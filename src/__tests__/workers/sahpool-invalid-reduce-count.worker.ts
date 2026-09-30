import sqlite3InitModule from '../../browser';
import { errorMessage } from './sahpool-repro-helpers';

self.onmessage = async (event: MessageEvent<{ name: string; directory: string }>) => {
  try {
    const sqlite3 = await sqlite3InitModule();
    const pool = await sqlite3.installOpfsSAHPoolVfs({
      name: event.data.name,
      directory: event.data.directory,
      initialCapacity: 3,
    });
    const removed = await pool.reduceCapacity(1.5);
    self.postMessage({ type: 'result', removed, capacity: pool.getCapacity() });
  } catch (error) {
    self.postMessage({ type: 'fatal', error: errorMessage(error) });
  }
};
