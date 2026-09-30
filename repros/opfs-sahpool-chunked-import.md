# opfs-sahpool: chunked import rejects a valid database

`importDb()` with a callback rejects valid database input when the first chunk is shorter than 15
bytes. Its fallback header check reads SAH metadata at offset 0 instead of the imported database at
offset 4096.

The accompanying Vitest reproduction is `src/__tests__/sahpool-chunked-import.browser.test.ts`.

## Proposed fix

The fallback must read the header from the database data region.

```diff
         if( !checkedHeader ){
           const header = new Uint8Array(20);
-          sah.read( header, {at: 0} );
+          sah.read( header, {at: HEADER_OFFSET_DATA} );
           util.affirmDbHeader( header );
         }
```
