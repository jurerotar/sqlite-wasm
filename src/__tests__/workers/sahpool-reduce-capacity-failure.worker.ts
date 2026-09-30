import sqlite3InitModule from '../../browser';
import { errorMessage } from './sahpool-repro-helpers';

self.onmessage = async (event: MessageEvent<{ name: string; directory: string }>) => {
  try {
    const sqlite3 = await sqlite3InitModule();
    const pool = await sqlite3.installOpfsSAHPoolVfs({
      name: event.data.name,
      directory: event.data.directory,
      initialCapacity: 1,
    });
    const removeEntry = FileSystemDirectoryHandle.prototype.removeEntry;
    let injected = false;
    FileSystemDirectoryHandle.prototype.removeEntry = function (...args) {
      if (!injected) {
        injected = true;
        return Promise.reject(new DOMException('simulated remove failure', 'UnknownError'));
      }
      return removeEntry.apply(this, args);
    };

    let reductionError = '';
    try {
      await pool.reduceCapacity(1);
    } catch (error) {
      reductionError = errorMessage(error);
    } finally {
      FileSystemDirectoryHandle.prototype.removeEntry = removeEntry;
    }

    let openError = '';
    try {
      const db = new pool.OpfsSAHPoolDb('/after.sqlite3');
      db.close();
    } catch (error) {
      openError = errorMessage(error);
    }

    self.postMessage({ type: 'result', reductionError, openError });
  } catch (error) {
    self.postMessage({ type: 'fatal', error: errorMessage(error) });
  }
};
