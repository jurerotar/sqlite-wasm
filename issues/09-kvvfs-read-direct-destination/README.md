# Avoid temporary buffer copy in KVVFS record reads

## Problem

`kvvfs` stores database pages as ASCII strings in a Storage-like backend. Its `xRcrdRead()` callback currently copies each stored record into `cache.memBuffer(0)`, then copies that temporary buffer into SQLite's requested output buffer with `copyWithin()`.

Representative shape of the current hot path:

```js
const zV = cache.memBuffer(0);
for (let i = 0; i < nV; ++i) {
  heap[wasm.ptr.add(zV, i)] = jV.codePointAt(i) & 0xff;
}
heap.copyWithin(Number(zBuf), Number(zV), wasm.ptr.addn(zV, nV));
heap[wasm.ptr.add(zBuf, nV)] = 0;
```

The destination buffer, `zBuf`, is already known. The intermediate `zV` buffer adds another pass over every KVVFS record read.

## Proposed Solution

Write the ASCII bytes directly into `zBuf` and append the terminating NUL byte there.

Representative patched shape:

```js
const nZBuf = Number(zBuf);
for (let i = 0; i < nV; ++i) {
  heap[nZBuf + i] = jV.codePointAt(i) & 0xff;
}
heap[nZBuf + nV] = 0;
```

This preserves the existing ASCII conversion logic and only removes the temporary buffer plus copy.

## Files

- `sqlite3.mjs`: patched runtime generated from `HEAD:src/bin/sqlite3.mjs` with only this issue's change.
- `benchmark.mjs`: compares `../_baseline/sqlite3.mjs` to this folder's patched `sqlite3.mjs`.

## Benchmark

The benchmark creates a transient `kvvfs` database and repeatedly reads through the KVVFS record path.

## Latest Benchmark Results

Latest local run with `node --expose-gc`:

| Workload | Benchmark | Before (ms) | After (ms) | Speedup | Reduction |
|---|---:|---:|---:|---:|---:|
| transient KVVFS, repeated reads | kvvfs xRcrdRead direct destination | 11.7 | 7.2 | 1.63x | 38.7% |

```sh
node --expose-gc issues/09-kvvfs-read-direct-destination/benchmark.mjs
```