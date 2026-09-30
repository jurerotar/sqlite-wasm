# opfs-sahpool: failed reduceCapacity() poisons the pool

`reduceCapacity()` closes an available SyncAccessHandle before awaiting `removeEntry()`. If removal
fails, the closed handle remains available and the next database open fails with `SQLITE_CANTOPEN`
until the worker reloads.

The accompanying Vitest reproduction is
`src/__tests__/sahpool-reduce-capacity-failure.browser.test.ts`.

## Proposed fix

After a failed removal, reopen the backing file and replace the closed handle in the pool maps. If
reopening fails as well, remove the closed handle from the maps before reporting the error.

```diff
         ah.close();
-        await this.#dhOpaque.removeEntry(name);
+        try {
+          await this.#dhOpaque.removeEntry(name);
+        } catch (e) {
+          this.#mapSAHToName.delete(ah);
+          this.#availableSAH.delete(ah);
+          const h = await this.#dhOpaque.getFileHandle(name);
+          const restored = await h.createSyncAccessHandle();
+          this.#mapSAHToName.set(restored, name);
+          this.#availableSAH.add(restored);
+          throw e;
+        }
         this.#mapSAHToName.delete(ah);
         this.#availableSAH.delete(ah);
```
