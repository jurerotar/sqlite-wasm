import sqlite3InitModule from '../../browser';

self.onmessage = async (event: MessageEvent<{ filenames: string[] }>) => {
  const sqlite3 = await sqlite3InitModule();
  const results = event.data.filenames.map((filename) => {
    let resultCode: number | undefined;
    let message = '';
    try {
      new sqlite3.oo1.OpfsDb(filename, 'r');
    } catch (error) {
      if (error instanceof sqlite3.SQLite3Error) resultCode = error.resultCode;
      message = error instanceof Error ? error.message : String(error);
    }
    return { filename, resultCode, message };
  });
  self.postMessage(results);
};
