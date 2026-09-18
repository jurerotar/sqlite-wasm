# DB.close() should finalize open prepared statements

## Problem

`DB.close()` attempts to finalize open prepared statements, but it treats the second argument of `Object.keys(...).forEach()` as the statement object. In JavaScript, that second argument is the array index, not the mapped value.

Representative shape of the current bug:

```js
Object.keys(stmts).forEach((key, stmt) => {
  if (stmt.pointer) stmt.finalize();
});
```

Because `stmt` is actually `0`, `1`, `2`, etc., prepared statements are not finalized by this loop. After closing the database, a statement can still retain a stale pointer and fail later with a low-level SQLite misuse error instead of behaving like a closed statement.

## Proposed Solution

Look up each statement value from the statement map before finalizing it.

Representative patched shape:

```js
Object.keys(stmts).forEach((key) => {
  const stmt = stmts[key];
  if (stmt?.pointer) stmt.finalize();
});
```

This makes `DB.close()` clear open statement pointers and makes later statement use fail through the existing closed-statement guard.

## Files

- `sqlite3.mjs`: patched runtime generated from `HEAD:src/bin/sqlite3.mjs` with only this issue's change.
- `benchmark.mjs`: compares `../_baseline/sqlite3.mjs` to this folder's patched `sqlite3.mjs`.

## Repro

This is a correctness repro rather than a timing benchmark. It prepares a statement, closes the database, then checks whether the statement pointer was cleared and whether subsequent use reports `Stmt has been closed.`

## Latest Repro Result

Latest local run with `node --expose-gc`:

| Case | Open statements before close | Statement pointer after close | Error after `stmt.step()` |
|---|---:|---:|---|
| Baseline | 1 | 837160 | `SQLITE_MISUSE: sqlite3 result code 21: bad parameter or other API misuse` |
| Patched | 1 | cleared | `Stmt has been closed.` |

```sh
node --expose-gc issues/08-db-close-finalizes-open-statements/benchmark.mjs
```