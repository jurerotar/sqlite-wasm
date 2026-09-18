import { compare, createTable, loadPair } from '../_shared/bench-utils.mjs';

const { baseline, patched } = await loadPair(import.meta.url);
function setup(sqlite3, rows, cols) { const db = new sqlite3.oo1.DB(':memory:'); createTable(db, rows, cols); return db; }
for (const [rows, cols] of [[50000, 1], [50000, 4], [25000, 16]]) {
  const beforeDb = setup(baseline, rows, cols), afterDb = setup(patched, rows, cols);
  const sql = `SELECT ${Array.from({ length: cols }, (_, i) => `c${i}`).join(', ')} FROM t`;
  console.log(`\n${rows} rows x ${cols} cols`);
  await compare('selectObjects', () => beforeDb.selectObjects(sql), () => afterDb.selectObjects(sql));
  await compare('exec rowMode object', () => beforeDb.exec({ sql, rowMode: 'object', returnValue: 'resultRows' }), () => afterDb.exec({ sql, rowMode: 'object', returnValue: 'resultRows' }));
  beforeDb.close(); afterDb.close();
}
