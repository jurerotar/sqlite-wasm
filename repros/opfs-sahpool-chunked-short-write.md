# opfs-sahpool: chunked import accepts a short write

The callback form of `importDb()` ignores each `write()` return value. A short write therefore
returns success and registers a truncated database. Firefox reports exhausted storage as a short
write, so this does not require an exception from OPFS.

The accompanying Vitest reproduction is `src/__tests__/sahpool-chunked-short-write.browser.test.ts`.

## Proposed fix

Check every chunk write and fail before advancing the logical byte count. The same fix applies to
the non-pool `opfsUtil.importDb()` callback implementation.

```diff
-        sah.write(chunk, {at: HEADER_OFFSET_DATA + nWrote});
+        const n = sah.write(chunk, {at: HEADER_OFFSET_DATA + nWrote});
+        if(n !== chunk.byteLength){
+          toss("Expected to write "+chunk.byteLength+" bytes but wrote "+n+".");
+        }
         nWrote += chunk.byteLength;
```
