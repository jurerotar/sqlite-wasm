import { readFileSync } from 'node:fs';
import { performance } from 'node:perf_hooks';

const wasmBinary = readFileSync(new URL('../../src/bin/sqlite3.wasm', import.meta.url));

export async function loadSqlite(moduleUrl) {
  const { default: init } = await import(moduleUrl.href);
  const originalWarn = console.warn;
  console.warn = () => {};
  try {
    return await init({
      print() {},
      printErr() {},
      instantiateWasm(imports, onSuccess) {
        WebAssembly.instantiate(wasmBinary, imports).then(({ instance, module }) => {
          onSuccess(instance, module);
        });
        return {};
      },
    });
  } finally {
    console.warn = originalWarn;
  }
}

export async function loadPair(issueUrl) {
  return {
    baseline: await loadSqlite(new URL('../_baseline/sqlite3.mjs', issueUrl)),
    patched: await loadSqlite(new URL('./sqlite3.mjs', issueUrl)),
  };
}

export function median(values) {
  return [...values].sort((a, b) => a - b)[Math.floor(values.length / 2)];
}

export function report(name, before, after) {
  const speedup = before / after;
  const reduction = (1 - after / before) * 100;
  console.table([
    {
      benchmark: name,
      'before (ms)': Number(before.toFixed(1)),
      'after (ms)': Number(after.toFixed(1)),
      speedup: `${speedup.toFixed(2)}x`,
      'reduction (%)': Number(reduction.toFixed(1)),
    },
  ]);
}

export async function compare(name, beforeFn, afterFn, iterations = 11) {
  beforeFn(); afterFn();
  const beforeTimes = [], afterTimes = [];
  for (let i = 0; i < iterations; ++i) {
    globalThis.gc?.();
    const t0 = performance.now();
    const before = beforeFn();
    const t1 = performance.now();
    const after = afterFn();
    const t2 = performance.now();
    if (before.length !== after.length) throw new Error(`${name}: mismatched lengths`);
    beforeTimes.push(t1 - t0);
    afterTimes.push(t2 - t1);
  }
  report(name, median(beforeTimes), median(afterTimes));
}

export function createTable(db, rows, cols) {
  db.exec(`CREATE TABLE t (${Array.from({ length: cols }, (_, i) => `c${i} INTEGER`).join(', ')})`);
  const stmt = db.prepare(`INSERT INTO t VALUES (${Array.from({ length: cols }, () => '?').join(', ')})`);
  try {
    db.exec('BEGIN');
    for (let r = 0; r < rows; ++r) stmt.bind(Array.from({ length: cols }, (_, c) => r + c)).stepReset();
    db.exec('COMMIT');
  } finally { stmt.finalize(); }
}
