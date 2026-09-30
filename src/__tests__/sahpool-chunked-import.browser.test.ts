import { expect, test } from 'vitest';
import { makeReproName, removeReproDirectory, type ReproResult } from './sahpool-repro-helpers';

type Result = ReproResult & { importError?: string };

test.fails('importDb() accepts valid database data in one-byte chunks', async () => {
  const { name, directory } = makeReproName('chunked-import');
  const worker = new Worker(
    new URL('./workers/sahpool-chunked-import.worker.ts', import.meta.url),
    { type: 'module' },
  );
  try {
    const result = await new Promise<Result>((resolve, reject) => {
      worker.onmessage = (event) => resolve(event.data);
      worker.onerror = (event) => reject(new Error(event.message));
      worker.postMessage({ name, directory });
    });
    expect(result.type, result.error).toBe('result');
    expect(result.importError).toBe('');
  } finally {
    worker.terminate();
    await removeReproDirectory(directory);
  }
});
