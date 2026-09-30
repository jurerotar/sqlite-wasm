# opfs: read-only open of a missing database reports SQLITE_IOERR

Opening a missing OPFS database read-only fails with `SQLITE_IOERR` instead of `SQLITE_CANTOPEN`. A
missing parent directory instead reports `SQLITE_NOTFOUND`. Both are `NotFoundError` cases: SQLite's
existing OPFS error mapper already documents that `SQLITE_NOTFOUND` has different semantics and that
`SQLITE_CANTOPEN` is the appropriate result.

The accompanying Vitest reproduction is `src/__tests__/opfs-missing-readonly.browser.test.ts`.

## Proposed fix

Reuse the existing exception mapper for both `xOpen()` failure paths. This proxy is shared by `opfs`
and `opfs-wl`. SQLite has no extended `SQLITE_CANTOPEN` result code specifically for a missing file,
so base `SQLITE_CANTOPEN` is the most precise result.

```diff
        }catch(e){
          state.s11n.storeException(1,e);
-         storeAndNotify(opName, state.sq3Codes.SQLITE_NOTFOUND);
+         storeAndNotify(opName, GetSyncHandleError.convertRc(
+           e, state.sq3Codes.SQLITE_NOTFOUND
+         ));
          return;
        }
...
       }catch(e){
         error(opName,e);
         state.s11n.storeException(1,e);
-        storeAndNotify(opName, state.sq3Codes.SQLITE_IOERR);
+        storeAndNotify(opName, GetSyncHandleError.convertRc(
+          e, state.sq3Codes.SQLITE_IOERR
+        ));
       }
```
