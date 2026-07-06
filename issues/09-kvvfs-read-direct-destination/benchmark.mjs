import { loadPair, median, report } from '../_shared/bench-utils.mjs';
import { performance } from 'node:perf_hooks';

const { baseline, patched } = await loadPair(import.meta.url);

function setup(sqlite3, name) {
  sqlite3.kvvfs.unlink(name);
  const db = new sqlite3.oo1.DB(`file:${name}?vfs=kvvfs`, 'c');
  db.exec('PRAGMA journal_mode=DELETE; CREATE TABLE t(a INTEGER PRIMARY KEY, b TEXT);');
  const stmt = db.prepare('INSERT INTO t(a,b) VALUES(?,?)');
  try {
    db.exec('BEGIN');
    for (let i = 0; i < 2000; ++i) stmt.bind([i, 'v'.repeat(50)]).stepReset();
    db.exec('COMMIT');
  } finally {
    stmt.finalize();
    db.close();
  }
}

function run(sqlite3, name) {
  const db = new sqlite3.oo1.DB(`file:${name}?vfs=kvvfs`, 'c');
  try {
    let total = 0;
    for (let i = 0; i < 30; ++i) {
      total += db.selectValue('SELECT sum(length(b)) FROM t WHERE a >= 0');
    }
    return total;
  } finally {
    db.close();
  }
}

setup(baseline, 'kvvfs_before');
setup(patched, 'kvvfs_after');
run(baseline, 'kvvfs_before');
run(patched, 'kvvfs_after');

const beforeTimes = [];
const afterTimes = [];
for (let i = 0; i < 15; ++i) {
  globalThis.gc?.();
  const t0 = performance.now();
  const before = run(baseline, 'kvvfs_before');
  const t1 = performance.now();
  const after = run(patched, 'kvvfs_after');
  const t2 = performance.now();
  if (before !== after) throw new Error('mismatched benchmark result');
  beforeTimes.push(t1 - t0);
  afterTimes.push(t2 - t1);
}

report('kvvfs xRcrdRead direct destination', median(beforeTimes), median(afterTimes));
baseline.kvvfs.unlink('kvvfs_before');
patched.kvvfs.unlink('kvvfs_after');