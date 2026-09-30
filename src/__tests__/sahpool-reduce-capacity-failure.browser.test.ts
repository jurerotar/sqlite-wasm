import { expect, test } from 'vitest';
import { makeReproName, removeReproDirectory, type ReproResult } from './sahpool-repro-helpers';

type Result = ReproResult & { reductionError?: string; openError?: string };

test.fails('reuses the pool after reduceCapacity() cannot remove a free entry', async () => {
  const { name, directory } = makeReproName('reduce-capacity');
  const worker = new Worker(
    new URL('./workers/sahpool-reduce-capacity-failure.worker.ts', import.meta.url),
    { type: 'module' },
  );
  try {
    const result = await new Promise<Result>((resolve, reject) => {
      worker.onmessage = (event) => resolve(event.data);
      worker.onerror = (event) => reject(new Error(event.message));
      worker.postMessage({ name, directory });
    });
    expect(result.type, result.error).toBe('result');
    expect(result.reductionError).toContain('simulated remove failure');
    expect(result.openError).toBe('');
  } finally {
    worker.terminate();
    await removeReproDirectory(directory);
  }
});
