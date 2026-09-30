import { expect, test } from 'vitest';
import { makeReproName, removeReproDirectory, type ReproResult } from './sahpool-repro-helpers';

type Result = ReproResult & { rc?: number };

test.fails('rejects exclusive creation of an existing database', async () => {
  const { name, directory } = makeReproName('exclusive-create');
  const worker = new Worker(
    new URL('./workers/sahpool-exclusive-create.worker.ts', import.meta.url),
    { type: 'module' },
  );
  try {
    const result = await new Promise<Result>((resolve, reject) => {
      worker.onmessage = (event) => resolve(event.data);
      worker.onerror = (event) => reject(new Error(event.message));
      worker.postMessage({ name, directory });
    });
    expect(result.type, result.error).toBe('result');
    expect(result.rc).not.toBe(0);
  } finally {
    worker.terminate();
    await removeReproDirectory(directory);
  }
});
