# Dead Ends Log

| Iteration | Approach Tried | Why It Failed | Files Touched |
|-----------|---------------|---------------|---------------|
| Final Gate Iteration 1 | Rapid consecutive clearAll() and saveBooking() on live remote Supabase in CHAL-SWAP-03 without waiting for batch delete latency | Network/server latency on live remote Supabase during full 117-suite test run caused getBooking to return null intermittently | `tests/adversarial/Milestone2StorageSwappabilityAdversarial.test.ts` |
