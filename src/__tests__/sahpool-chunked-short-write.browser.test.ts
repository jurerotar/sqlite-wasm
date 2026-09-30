import { expect, test } from 'vitest';
import { makeReproName, removeReproDirectory, type ReproResult } from './sahpool-repro-helpers';

type Result = ReproResult & { shortened?: boolean; importError?: string };

test.fails('rejects a short write while importing database chunks', async () => {
  const { name, directory } = makeReproName('chunked-short-write');
  const worker = new Worker(
    new URL('./workers/sahpool-chunked-short-write.worker.ts', import.meta.url),
    { type: 'module' },
  );
  try {
    const result = await new Promise<Result>((resolve, reject) => {
      worker.onmessage = (event) => resolve(event.data);
      worker.onerror = (event) => reject(new Error(event.message));
      worker.postMessage({ name, directory });
    });
    expect(result.type, result.error).toBe('result');
    expect(result.shortened).toBe(true);
    expect(result.importError).not.toBe('');
  } finally {
    worker.terminate();
    await removeReproDirectory(directory);
  }
});
