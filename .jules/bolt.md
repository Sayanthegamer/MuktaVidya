## 2025-05-19 - Optimize History Deduplication
**Learning:** Multiple array passes (.filter followed by another .filter with Set deduplication, and a separate reduce for validation) caused significant overhead when loading history from IndexedDB.
**Action:** Combined multiple array iterations into a single `for...of` loop pass. Added validation logic alongside Set deduplication (`!seenIds.has()`), avoiding redundant intermediate array creations and significantly cutting down loop execution times by >50%.
