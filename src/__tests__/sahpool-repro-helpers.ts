export type ReproResult = {
  type: 'result' | 'fatal';
  error?: string;
};

export const makeReproName = (prefix: string): { name: string; directory: string } => {
  const id = crypto.randomUUID();
  return {
    name: `${prefix}-${id}`,
    directory: `.${prefix}-${id}`,
  };
};

export const removeReproDirectory = async (directory: string): Promise<void> => {
  await new Promise((resolve) => setTimeout(resolve, 50));
  const root = await navigator.storage.getDirectory();
  await root.removeEntry(directory, { recursive: true }).catch(() => undefined);
};
