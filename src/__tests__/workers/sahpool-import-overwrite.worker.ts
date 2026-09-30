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

    const small = new pool.OpfsSAHPoolDb('/small.db');
    small.exec('CREATE TABLE small(v); INSERT INTO small VALUES (1)');
    small.close();
    const smallBytes = await pool.exportFile('/small.db');

    const large = new pool.OpfsSAHPoolDb('/large.db');
    large.exec('CREATE TABLE large(v); INSERT INTO large VALUES (zeroblob(200000))');
    large.close();

    pool.importDb('/large.db', smallBytes);
    self.postMessage({
      type: 'result',
      expectedSize: smallBytes.byteLength,
      actualSize: (await pool.exportFile('/large.db')).byteLength,
    });
  } catch (error) {
    self.postMessage({ type: 'fatal', error: errorMessage(error) });
  }
};
