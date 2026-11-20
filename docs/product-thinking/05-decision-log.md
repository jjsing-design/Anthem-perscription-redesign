# Decision log — Anthem prescription refill

Each entry records what was decided and why. Ordered roughly as decided.

## Status rules

1. **Status is always text plus color, never color alone.** Color alone excludes members who can't distinguish it, and some assistive technology skips disabled controls, so the row's text must carry the meaning on its own.

2. **"Low" means today is within 7 days of the calculated run-out date.** Run-out date = last fill date + (quantity / daily dose). Rationale for the 7-day figure: not yet written.

3. **Partial days of supply round down.**

4. **"Needs a refill" is a separate status for a medication whose run-out date has passed.** An overdue medication is more urgent than one merely running low, so it needs its own label rather than being folded into "Low."

5. **Display priority, highest first: Not sent → Pending → Needs a refill → Low → normal.** A request already in motion (Pending), or one the member may wrongly believe was sent (Not sent), outranks the medication's own supply state.

## The refill flow

6. **Single confirm, no review screen.** The refill screen already shows everything the member is confirming, and one submit avoids the risk of submitting twice.

7. **Unavailable pharmacy options are greyed out with a short reason, not hidden.** Consistent with how other unavailable actions behave, and it tells the member why rather than leaving a silent gap.

8. **No refills remaining: grey out Refill, give the reason, and tell the member to contact their doctor.** This keeps members from bypassing prescriber approval and avoids building a renewal flow for now. Tradeoff: the member leaves the app to continue, and has no way to see when the renewal is done.

9. **Estimated cost is labeled as an estimate,** because the final charge may differ.

## Already pending

10. **A pending request greys out Refill but keeps its label,** and the row shows the status, request date, and expected update. Pending takes priority over the supply state, since something is already being done.

11. **A medication becomes refillable again when its request is delivered, ready for pickup, cancelled, or failed.** Delivery ends when the member has it; pickup ends when it's ready at the pharmacy.

12. **Double taps are prevented in two places.** The button turns off when tapped, and the server rejects a second submission for the same medication. The second protects against other devices and retries.

13. **A request ID is generated on the device and reused on every retry.** Same ID means the same request, so a retry can never create a second order.

## Submission failed

14. **Failure messages differ by cause,** because the member's next action differs. "Change pharmacy" is offered only when the pharmacy was the problem.

15. **The member's entries are preserved after a failure,** so they don't have to re-enter pharmacy and fulfillment choices.

16. **"Wasn't sent" wording is used only when the system is certain.** An uncertain outcome must not claim the request failed.

17. **Help after a failed retry is a phone number plus what to tell them.** Chat and callback are out of scope for this version. The number in the prototype is a labeled placeholder.

18. **A failed attempt shows as "Not sent" on the medication,** so a member who leaves and returns can see it. The label carries the meaning; color supports it.

19. **"Not sent" clears on a successful retry, or 24 hours after the FIRST failed attempt.** Later failures do not restart the clock: the member already knows something went wrong, and repeating the warning gives them no new information. On expiry the medication returns to its normal status, which may be "Needs a refill" or "Low," so the member still sees that action is required.

20. **When the device holds a "Not sent" record and the server has an open request, the server wins.** The row shows Pending and Refill is disabled. The device only knows its own attempt; the server's record covers every device. A member must never be shown "Not sent" with an enabled Refill button for a medication that already has a request in flight.

## Open decisions

- Rationale for the 7-day "Low" threshold.
- When the "last fill date" updates — at pharmacy fill, or at pickup/delivery. The Low rule depends on it.
- Whether the $4.99 home-delivery fee counts toward the deductible, and the reason for that amount.
- Outcome uncertain: how the app checks status, how long before it gives up, and what the member sees in each of the three outcomes. Decision 20 depends on this check existing.

## Branches not yet designed

- Outcome uncertain
- Too early
- Pharmacy unable to fulfill
