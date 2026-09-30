import sqlite3InitModule from '../../browser';
import { errorMessage } from './sahpool-repro-helpers';

self.onmessage = async (event: MessageEvent<{ name: string; directory: string }>) => {
  try {
    const sqlite3 = await sqlite3InitModule();
    const pool = await sqlite3.installOpfsSAHPoolVfs({
      name: event.data.name,
      directory: event.data.directory,
      initialCapacity: 4,
    });
    const existing = new pool.OpfsSAHPoolDb('/existing.db');
    existing.exec('CREATE TABLE t(x)');
    existing.close();

    const stack = sqlite3.wasm.pstack.pointer;
    let pDb;
    try {
      const pOut = sqlite3.wasm.pstack.allocPtr();
      const rc = sqlite3.capi.sqlite3_open_v2(
        '/existing.db',
        pOut,
        sqlite3.capi.SQLITE_OPEN_READWRITE |
          sqlite3.capi.SQLITE_OPEN_CREATE |
          sqlite3.capi.SQLITE_OPEN_EXCLUSIVE,
        pool.vfsName,
      );
      pDb = sqlite3.wasm.peekPtr(pOut);
      self.postMessage({ type: 'result', rc });
    } finally {
      if (pDb) sqlite3.capi.sqlite3_close_v2(pDb);
      sqlite3.wasm.pstack.restore(stack);
    }
  } catch (error) {
    self.postMessage({ type: 'fatal', error: errorMessage(error) });
  }
};
