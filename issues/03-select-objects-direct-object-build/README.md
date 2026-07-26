# Build object rows without an intermediate array

## Problem

Object row conversion currently builds an intermediate array first, then copies that array into an object keyed by column name. For `selectObjects()` and `exec({ rowMode: 'object' })`, that means every row allocates and fills an array that is immediately thrown away.

Representative shape of the current hot path:

```js
const values = stmt.get([]);
const row = {};
for (let i = 0; i < columnCount; ++i) {
  row[columnNames[i]] = values[i];
}
```

This doubles part of the materialization work for object rows: first array population, then object population.

## Proposed Solution

Cache the column names once per statement and build the object directly from result columns.

Representative patched shape:

```js
const row = {};
for (let i = 0; i < columnCount; ++i) {
  row[columnNames[i]] = __stmtGetColumn(stmt, i);
}
```

This keeps the returned object shape the same but avoids the temporary array allocation and copy.

## Files

- `sqlite3.mjs`: patched runtime generated from `HEAD:src/bin/sqlite3.mjs` with only this issue's change.
- `benchmark.mjs`: compares `../_baseline/sqlite3.mjs` to this folder's patched `sqlite3.mjs`.

## Benchmark

The benchmark compares `selectObjects()` and `exec({ rowMode: 'object' })` across several result widths.

## Latest Benchmark Results

Latest local run with `node --expose-gc`:

| Workload | Benchmark | Before (ms) | After (ms) | Speedup | Reduction |
|---|---:|---:|---:|---:|---:|
| 50,000 rows x 1 col | selectObjects | 72.1 | 38.8 | 1.86x | 46.2% |
| 50,000 rows x 1 col | exec rowMode object | 69.7 | 37.9 | 1.84x | 45.6% |
| 50,000 rows x 4 cols | selectObjects | 181.6 | 112.5 | 1.61x | 38.0% |
| 50,000 rows x 4 cols | exec rowMode object | 183.6 | 113.4 | 1.62x | 38.3% |
| 25,000 rows x 16 cols | selectObjects | 291.7 | 197.2 | 1.48x | 32.4% |
| 25,000 rows x 16 cols | exec rowMode object | 249.3 | 181.3 | 1.38x | 27.3% |

```sh
node --expose-gc issues/03-select-objects-direct-object-build/benchmark.mjs
```