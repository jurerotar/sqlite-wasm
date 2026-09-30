import { expect, test } from 'vitest';
import { makeReproName, removeReproDirectory, type ReproResult } from './sahpool-repro-helpers';

type Result = ReproResult & { expectedSize?: number; actualSize?: number };

test.fails('importDb() replaces all prior file content', async () => {
  const { name, directory } = makeReproName('import-overwrite');
  const worker = new Worker(
    new URL('./workers/sahpool-import-overwrite.worker.ts', import.meta.url),
    { type: 'module' },
  );
  try {
    const result = await new Promise<Result>((resolve, reject) => {
      worker.onmessage = (event) => resolve(event.data);
      worker.onerror = (event) => reject(new Error(event.message));
      worker.postMessage({ name, directory });
    });
    expect(result.type, result.error).toBe('result');
    expect(result.actualSize).toBe(result.expectedSize);
  } finally {
    worker.terminate();
    await removeReproDirectory(directory);
  }
});
