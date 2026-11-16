# Decision log
Each entry records what was decided and why. Entries are ordered roughly as they were made.
1. **Single confirm, no review screen.** The refill screen already shows everything the member is confirming, and one submit avoids the risk of submitting twice.
2. **"Low" means within 7 days of run-out.** Rationale not yet written.
3. **Unavailable pharmacy options are greyed out with a short reason, not hidden.** This is consistent with how other buttons behave.
4. **No refills remaining: grey out Refill, give the reason, and tell the member to contact their doctor.** This keeps members from bypassing prescriber approval, and it avoids building a renewal flow for now. Tradeoff: the member leaves the app to continue.
5. **Estimated cost is labeled as an estimate** because the final charge may differ.
6. **Already pending: Refill keeps its label but is greyed out, and the row shows the status, request date, and expected update.** Pending takes priority over Low, since something is already being done about the medication.
7. **A medication becomes refillable again when its request is delivered, ready for pickup, or cancelled or failed.**
8. **Double taps are prevented in two places.** The button turns off when tapped, and the system rejects a second submission for the same medication. The second protects against other devices and retries.
9. **Submission failures show different messages by cause, keep the member's entries, and allow retry.** "Change pharmacy" is only offered when the pharmacy was the problem.
10. **Help after a failed retry is a phone number plus what to tell them.** Chat and callback are out of scope for this version.
11. **A failed attempt shows as "Not sent" on the medication.** The label carries the meaning and color supports it. It clears after a successful retry or 24 hours, and it takes priority over Low, because a member may believe they ordered something that was never sent.
## Open decisions
- When the "last fill date" updates (see the exception paths doc).
- Rationale for the 7-day threshold.
- Branches not yet documented: outcome uncertain, too early, pharmacy unable to fulfill.
