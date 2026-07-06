# Resolve named exec rowMode once instead of building an object per row

## Problem

`exec({ rowMode: '$name' })` asks for one named column per row, but the current path materializes a full object row and then reads one property from it. This does unnecessary work proportional to the total column count, not the one requested column.

Representative shape of the current hot path:

```js
while (stmt.step()) {
  const row = stmt.get({});
  callback(row[name]);
}
```

For wide result sets this builds many unused properties every row. The benchmark shows this gets especially expensive when the requested column is near the end of a wide select list.

## Proposed Solution

Resolve the requested column name to an index once per statement, preserving the existing right-most duplicate-name behavior, then fetch that column directly for each row.

Representative patched shape:

```js
const columnIndex = resolveNamedColumn(stmt, name);
while (stmt.step()) {
  callback(__stmtGetColumn(stmt, columnIndex));
}
```

The benchmark includes a duplicate-column assertion for `SELECT 1 AS a, 2 AS a` to verify the patched behavior still returns the right-most matching column.

## Files

- `sqlite3.mjs`: patched runtime generated from `HEAD:src/bin/sqlite3.mjs` with only this issue's change.
- `benchmark.mjs`: compares `../_baseline/sqlite3.mjs` to this folder's patched `sqlite3.mjs`.

## Benchmark

The benchmark compares named row mode for one, four, and sixteen selected columns.

## Latest Benchmark Results

Latest local run with `node --expose-gc`:

| Workload | Benchmark | Before (ms) | After (ms) | Speedup | Reduction |
|---|---:|---:|---:|---:|---:|
| 50,000 rows x 1 col | exec rowMode $n0 | 107.5 | 33.6 | 3.20x | 68.7% |
| 50,000 rows x 4 cols | exec rowMode $n3 | 220.6 | 35.3 | 6.25x | 84.0% |
| 25,000 rows x 16 cols | exec rowMode $n15 | 403.7 | 20.9 | 19.28x | 94.8% |

```sh
node --expose-gc issues/05-exec-named-rowmode-resolve-once/benchmark.mjs
```