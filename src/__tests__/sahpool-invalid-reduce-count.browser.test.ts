import { expect, test } from 'vitest';
import { makeReproName, removeReproDirectory, type ReproResult } from './sahpool-repro-helpers';

type Result = ReproResult & { removed?: number; capacity?: number };

test.fails('rejects a fractional capacity reduction', async () => {
  const { name, directory } = makeReproName('invalid-reduce-count');
  const worker = new Worker(
    new URL('./workers/sahpool-invalid-reduce-count.worker.ts', import.meta.url),
    { type: 'module' },
  );
  try {
    const result = await new Promise<Result>((resolve, reject) => {
      worker.onmessage = (event) => resolve(event.data);
      worker.onerror = (event) => reject(new Error(event.message));
      worker.postMessage({ name, directory });
    });
    expect(result.type, result.error).toBe('fatal');
  } finally {
    worker.terminate();
    await removeReproDirectory(directory);
  }
});
