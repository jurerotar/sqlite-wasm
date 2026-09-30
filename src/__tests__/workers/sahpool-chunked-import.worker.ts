import sqlite3InitModule from '../../browser';
import { errorMessage } from './sahpool-repro-helpers';

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

    let offset = 0;
    let importError = '';
    try {
      await pool.importDb('/copy.db', () => {
        if (offset === bytes.byteLength) return undefined;
        return bytes.slice(offset++, offset);
      });
    } catch (error) {
      importError = errorMessage(error);
    }

    self.postMessage({ type: 'result', importError });
  } catch (error) {
    self.postMessage({ type: 'fatal', error: errorMessage(error) });
  }
};
