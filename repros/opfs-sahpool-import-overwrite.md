# opfs-sahpool: importDb() leaves stale trailing bytes

Importing a smaller database over an existing larger database writes the replacement bytes but does
not truncate the backing file. `exportFile()` therefore returns the old trailing bytes.

The accompanying Vitest reproduction is `src/__tests__/sahpool-import-overwrite.browser.test.ts`.

## Proposed fix

After the complete replacement has been written, truncate the backing file to its new logical size.

```diff
       const nWrote = sah.write(bytes, {at: HEADER_OFFSET_DATA});
       if(nWrote != n){
         this.setAssociatedPath(sah, '', 0);
         toss("Expected to write "+n+" bytes but wrote "+nWrote+".");
       }else{
+        sah.truncate(HEADER_OFFSET_DATA + n);
         sah.write(new Uint8Array([1,1]), {at: HEADER_OFFSET_DATA+18});
         this.setAssociatedPath(sah, name, capi.SQLITE_OPEN_MAIN_DB);
       }
```
