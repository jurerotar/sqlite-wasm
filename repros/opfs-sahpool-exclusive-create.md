# opfs-sahpool: exclusive creation opens an existing database

`xOpen()` ignores `SQLITE_OPEN_EXCLUSIVE`. A `sqlite3_open_v2()` request with `CREATE | EXCLUSIVE`
successfully opens an existing database instead of failing.

The accompanying Vitest reproduction is `src/__tests__/sahpool-exclusive-create.browser.test.ts`.

## Proposed fix

Reject an already-associated file when exclusive creation is requested.

```diff
         let sah = pool.getSAHForPath(path);
+        if(sah && (flags & capi.SQLITE_OPEN_CREATE)
+               && (flags & capi.SQLITE_OPEN_EXCLUSIVE)){
+          toss('file already exists:', path);
+        }
         if(!sah && (flags & capi.SQLITE_OPEN_CREATE)) {
```
