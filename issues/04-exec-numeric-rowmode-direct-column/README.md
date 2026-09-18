# Cache and directly fetch numeric exec rowMode columns

## Problem

`exec({ rowMode: 0 })` returns a single numeric column per row, but the current implementation calls public `stmt.get(rowMode)` for every row. The selected column index does not change during execution, so repeated public getter dispatch and validation are unnecessary.

Representative shape of the current hot path:

```js
while (stmt.step()) {
  callback(stmt.get(rowMode));
}
```

The row mode is validated repeatedly through the generic getter path even though it can be resolved once when the statement is initialized.

## Proposed Solution

Validate and cache the numeric column index once per statement, then fetch the column directly in the row loop.

Representative patched shape:

```js
const columnIndex = validateColumnIndex(rowMode, stmt.columnCount);
while (stmt.step()) {
  callback(__stmtGetColumn(stmt, columnIndex));
}
```

This keeps numeric `rowMode` behavior intact while removing per-row public getter overhead.

## Files

- `sqlite3.mjs`: patched runtime generated from `HEAD:src/bin/sqlite3.mjs` with only this issue's change.
- `benchmark.mjs`: compares `../_baseline/sqlite3.mjs` to this folder's patched `sqlite3.mjs`.

## Benchmark

The benchmark compares `exec({ rowMode: 0, returnValue: 'resultRows' })` on multiple result-set shapes.

## Latest Benchmark Results

Latest local run with `node --expose-gc`:

| Workload | Benchmark | Before (ms) | After (ms) | Speedup | Reduction |
|---|---:|---:|---:|---:|---:|
| 50,000 rows x 1 col | exec rowMode 0 | 44.1 | 36.3 | 1.22x | 17.7% |
| 50,000 rows x 4 cols | exec rowMode 0 | 43.9 | 36.4 | 1.21x | 17.0% |
| 25,000 rows x 16 cols | exec rowMode 0 | 25.7 | 21.9 | 1.17x | 14.8% |

```sh
node --expose-gc issues/04-exec-numeric-rowmode-direct-column/benchmark.mjs
```