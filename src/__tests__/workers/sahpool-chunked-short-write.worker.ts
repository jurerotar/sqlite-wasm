import sqlite3InitModule from '../../browser';
import { errorMessage } from './sahpool-repro-helpers';

type SyncAccessHandlePrototype = {
  write(this: object, buffer: Uint8Array, options?: { at?: number }): number;
};

type SyncAccessHandleOwner = FileSystemFileHandle & {
  createSyncAccessHandle(): Promise<{ close(): void }>;
};

self.onmessage = async (event: MessageEvent<{ name: string; directory: string }>) => {
  try {
    const sqlite3 = await sqlite3InitModule();
    const pool = await sqlite3.installOpfsSAHPoolVfs({
      name: event.data.name,
      directory: event.data.directory,
      initialCapacity: 8,
    });
    const source = new pool.OpfsSAHPoolDb('/source.db');
    source.exec('CREATE TABLE source(v); INSERT INTO source VALUES (1)');
    source.close();
    const bytes = await pool.exportFile('/source.db');

    const root = await navigator.storage.getDirectory();
    const probeName = `.short-write-probe-${crypto.randomUUID()}`;
    const probeFile = (await root.getFileHandle(probeName, {
      create: true,
    })) as SyncAccessHandleOwner;
    const probe = await probeFile.createSyncAccessHandle();
    const prototype = Object.getPrototypeOf(probe) as SyncAccessHandlePrototype;
    probe.close();
    await root.removeEntry(probeName);

    const write = prototype.write;
    let shortened = false;
    prototype.write = function (buffer, options) {
      if (!shortened && options?.at === 4096 && buffer.byteLength > 2) {
        shortened = true;
        return write.call(this, buffer.subarray(0, buffer.byteLength - 1), options);
      }
      return write.call(this, buffer, options);
    };

    let importError = '';
    let sent = false;
    try {
      await pool.importDb('/copy.db', () => {
        if (sent) return undefined;
        sent = true;
        return bytes;
      });
    } catch (error) {
      importError = errorMessage(error);
    } finally {
      prototype.write = write;
    }
    self.postMessage({ type: 'result', shortened, importError });
  } catch (error) {
    self.postMessage({ type: 'fatal', error: errorMessage(error) });
  }
};
