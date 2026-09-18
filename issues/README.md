# SQLite WASM Performance/Correctness Issue Artifacts

Each numbered folder maps to one small maintainer issue. Every folder contains a README, a patched `sqlite3.mjs`, and a benchmark/repro script comparing it to `issues/_baseline/sqlite3.mjs`.

Run from the repository root, e.g.

```sh
node --expose-gc issues/01-select-values-direct-column-conversion/benchmark.mjs
```

## Issues

1. `01-select-values-direct-column-conversion`
2. `02-stmt-get-array-object-fast-path`
3. `03-select-objects-direct-object-build`
4. `04-exec-numeric-rowmode-direct-column`
5. `05-exec-named-rowmode-resolve-once`
6. `08-db-close-finalizes-open-statements`
7. `09-kvvfs-read-direct-destination`

See also `rejected-candidates.md` for ideas tested but not worth filing yet.
