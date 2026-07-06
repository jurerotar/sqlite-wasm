# Rejected Or Deferred Candidates

These were investigated but should not be filed as maintainer issues without stronger evidence.

| Candidate | Result |
|---|---|
| Rewrite `selectObjects()` via `selectValues()` | Not semantically valid. `selectValues()` returns only the first result column. |
| Direct `selectArrays()` prepare/step implementation | Slower for wider rows than the existing `exec()` path. |
| Custom direct `rowMode: 'array'` construction | Helps one-column rows but regresses wider rows. |
| Binding loop rewrite / reduced bind validation | Regressed array binds by roughly 13-31%; object binds improved only about 2%. |
| BLOB column copy via `subarray().set()` | Workload-sensitive. Helped medium/large BLOBs in some runs but regressed small BLOBs and was not stable enough to file. |
| Direct BLOB return via `heap8u().slice(...)` | Inconsistent and slower for large BLOBs compared with `subarray().set(...)`. |
| JS UDF arity-specialized dispatch | Neutral/slower for common arities. |
| Preallocating `sqlite3_values_to_js()` result arrays | Mixed results in `sqlite3.mjs`; not stable enough to file as a standalone issue. |
| Skipping `stmt.bind(undefined)` in selectors | Neutral/slightly slower in targeted comparison. |
| KVVFS `xClose()` cleanup via `splice()` instead of `filter()` | Only about 2-3% on a synthetic open/close loop; too small to file alone. |
| KVVFS `xRcrdRead()` `charCodeAt()` instead of `codePointAt()` | Neutral in the targeted read benchmark. |
| OPFS serialization `subarray()` for strings | Invalid: `TextDecoder` rejects SharedArrayBuffer-backed views, so the existing `slice()` copy is required. |
| OPFS serialization without temporary `typeIds` arrays | Functionally valid but only about 1% in browser OPFS worker benchmarks. |
| SAHPool cached heap views in `xRead()`/`xWrite()` | Initial run looked faster, but reversed-order browser benchmark was neutral/slightly slower. |
| VFS `xCurrentTime`/`xCurrentTimeInt64` using `Date.now()` | Behavior-preserving but only about 1% on a targeted SQLite date/time workload. |
