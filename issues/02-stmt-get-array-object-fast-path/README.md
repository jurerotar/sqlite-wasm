# Avoid recursive Stmt.get() calls for row materialization

## Problem

`Stmt.get([])` and `Stmt.get({})` materialize full rows by recursively calling public `Stmt.get(i)` for every column. That means row materialization pays public dispatch, type checks, and argument handling once per cell.

Representative shape of the current hot path:

```js
const row = [];
for (let i = 0; i < columnCount; ++i) {
  row.push(stmt.get(i));
}
```

For object rows the same pattern is used, then values are assigned to column names. This is expensive for wide result sets because the inner loop calls back into the public getter for every column of every row.

## Proposed Solution

Keep the public validation at the outer `Stmt.get([])` / `Stmt.get({})` entry point, then fill arrays and objects by converting columns directly inside the row loop.

Representative patched shape:

```js
const row = [];
for (let i = 0; i < columnCount; ++i) {
  row.push(__stmtGetColumn(stmt, i));
}
```

This preserves the public API while removing recursive public getter calls from the hot path.

## Files

- `sqlite3.mjs`: patched runtime generated from `HEAD:src/bin/sqlite3.mjs` with only this issue's change.
- `benchmark.mjs`: compares `../_baseline/sqlite3.mjs` to this folder's patched `sqlite3.mjs`.

## Benchmark

The benchmark compares `selectArrays()` and `selectObjects()` on narrow and wide result sets.

## Latest Benchmark Results

Latest local run with `node --expose-gc`:

| Workload | Benchmark | Before (ms) | After (ms) | Speedup | Reduction |
|---|---:|---:|---:|---:|---:|
| 50,000 rows x 1 col | selectArrays | 47.7 | 44.2 | 1.08x | 7.3% |
| 50,000 rows x 1 col | selectObjects | 76.4 | 52.6 | 1.45x | 31.1% |
| 50,000 rows x 4 cols | selectArrays | 156.0 | 123.7 | 1.26x | 20.7% |
| 50,000 rows x 4 cols | selectObjects | 197.4 | 157.5 | 1.25x | 20.2% |
| 25,000 rows x 16 cols | selectArrays | 251.0 | 179.3 | 1.40x | 28.6% |
| 25,000 rows x 16 cols | selectObjects | 266.4 | 204.5 | 1.30x | 23.2% |

```sh
node --expose-gc issues/02-stmt-get-array-object-fast-path/benchmark.mjs
```