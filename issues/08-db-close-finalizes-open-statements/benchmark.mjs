import { compare, createTable, loadPair } from '../_shared/bench-utils.mjs';

const { baseline, patched } = await loadPair(import.meta.url);
function reproduce(sqlite3) {
  const db = new sqlite3.oo1.DB(':memory:'); const stmt = db.prepare('SELECT 1');
  const before = { openStatements: db.openStatementCount(), stmtPointer: stmt.pointer };
  db.close();
  let stepError = ''; try { stmt.step(); } catch (e) { stepError = e.message; }
  return [{ before, after: { dbOpen: db.isOpen(), stmtPointer: stmt.pointer, stepError } }];
}
const before = reproduce(baseline)[0], after = reproduce(patched)[0];
console.log('baseline:', JSON.stringify(before, null, 2));
console.log('patched :', JSON.stringify(after, null, 2));
if (after.after.stmtPointer !== undefined) throw new Error('patched statement pointer was not cleared');
if (!/Stmt has been closed/.test(after.after.stepError)) throw new Error('patched statement did not fail as closed');
