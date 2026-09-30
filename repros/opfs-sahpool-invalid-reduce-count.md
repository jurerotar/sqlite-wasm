# opfs-sahpool: fractional reduceCapacity() removes every free entry

`reduceCapacity(1.5)` removes all free entries. The loop compares an integer removal count with
`1.5`, so its stop condition never matches. Negative and non-finite counts have the same problem.

The accompanying Vitest reproduction is
`src/__tests__/sahpool-invalid-reduce-count.browser.test.ts`.

## Proposed fix

Require a non-negative safe integer before changing persistent capacity.

```diff
     async reduceCapacity(n){
+      if(!Number.isSafeInteger(n) || n < 0){
+        toss('Invalid capacity reduction:', n);
+      }
       let nRm = 0;
```
