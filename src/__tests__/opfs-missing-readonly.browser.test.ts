import { expect, test } from 'vitest';

test.fails('reports CANTOPEN when read-only opening a missing OPFS database', async () => {
  const worker = new Worker(new URL('./workers/opfs-missing-readonly.worker.ts', import.meta.url), {
    type: 'module',
  });
  try {
    const results = await new Promise<{ resultCode?: number; message: string }[]>(
      (resolve, reject) => {
        worker.onmessage = (event) => resolve(event.data);
        worker.onerror = (event) => reject(new Error(event.message));
        const id = crypto.randomUUID();
        worker.postMessage({
          filenames: [`/missing-${id}.db`, `/missing-parent-${id}/database.db`],
        });
      },
    );
    for (const result of results) expect(result.resultCode, result.message).toBe(14);
  } finally {
    worker.terminate();
  }
});
