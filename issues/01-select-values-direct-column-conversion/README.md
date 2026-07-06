# Direct column conversion for selectValue/selectValues

## Problem

`selectValue()` and `selectValues()` only need column 0 from each row, but the current implementation reaches that value through public `Stmt.get(0)`. That public path repeats argument dispatch and validation for every row.

Representative shape of the current hot path:

```js
while (stmt.step()) {
  result.push(stmt.get(0));
}
```

`Stmt.get(0)` is general-purpose API surface. In a tight selector loop, the extra public dispatch is paid once per returned row even though the target column is fixed and already known.

## Proposed Solution

Add an internal column conversion helper and call it directly from `selectValue()` and `selectValues()` after the statement has been prepared. The public API behavior stays the same, but the row loop avoids going back through `Stmt.get()`.

Representative patched shape:

```js
while (stmt.step()) {
  result.push(__stmtGetColumn(stmt, 0));
}
```

This is intentionally limited to `selectValue()`/`selectValues()` so the change is small and does not alter public `Stmt.get()` semantics.

## Files

- `sqlite3.mjs`: patched runtime generated from `HEAD:src/bin/sqlite3.mjs` with only this issue's change.
- `benchmark.mjs`: compares `../_baseline/sqlite3.mjs` to this folder's patched `sqlite3.mjs`.

## Benchmark

The benchmark reads one selected value per row across several row/column shapes.

## Latest Benchmark Results

Latest local run with `node --expose-gc`:

| Workload | Benchmark | Before (ms) | After (ms) | Speedup | Reduction |
|---|---:|---:|---:|---:|---:|
| 50,000 rows x 1 col | selectValues | 35.3 | 26.5 | 1.33x | 24.9% |
| 50,000 rows x 4 cols | selectValues | 36.2 | 28.0 | 1.29x | 22.6% |
| 25,000 rows x 16 cols | selectValues | 21.1 | 16.4 | 1.28x | 22.0% |

```sh
node --expose-gc issues/01-select-values-direct-column-conversion/benchmark.mjs
```