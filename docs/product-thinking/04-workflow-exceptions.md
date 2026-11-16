# Workflow: exception paths
Branches off the success path. Documented so far: already pending, and submission failed.
Not yet documented: outcome uncertain, too early, and pharmacy unable to fulfill.
## Branch: already pending
Trigger: the member opens the Prescriptions tab and a medication already has an open refill request.
- The medication shows the status "Pending," the date requested, and the expected update. The Refill button keeps its label but is greyed out. The status text in the row carries the meaning, because some assistive technology skips disabled buttons.
- **Decision D: is a request open?** Yes, if a request exists for that prescription and has not reached an end state. Pending takes priority over Low in the display.
- **End states.** A medication becomes refillable again when its request is delivered (for delivery), ready for pickup (for pickup), or cancelled or failed.
- **Double tap.** The button turns off the moment it is tapped, and the system rejects a second submission for the same medication. If a duplicate reaches the server anyway, for example from a second device or a retry, the member sees "You already requested this refill" along with the existing request's status.
Open question: when does the "last fill date" update? The Low rule depends on it. If it updates when the pharmacy fills the prescription, a medication that is ready for pickup stops being Low. If it only updates after pickup or delivery, a member could request a second refill while the first is still at the pharmacy. Not decided yet.
## Branch: submission failed
Trigger: the member taps Confirm refill and the system knows the request was not accepted.
1. Member taps Confirm refill. The button turns off immediately and a loading state shows.
2. The request fails with a known cause. The member stays on the refill screen with all entries kept, and a message appears at the top:
   - Pharmacy cannot be reached: "We couldn't reach [pharmacy]. Your request wasn't sent. You can try again or choose a different pharmacy."
   - Request rejected, or connection failed before sending: "Your request wasn't sent. Check your connection and try again."
   - "Change pharmacy" is only offered for the pharmacy failure.
   - **Decision E: is the failure certain?** "Wasn't sent" is only shown when the system knows that. Otherwise the outcome-uncertain treatment applies (not yet documented).
3. The member retries. The same choices are resubmitted, and duplicate protection still applies, so a retry cannot create a second request if the first went through.
4. After a failed retry, help appears: "Still not working? Call [number] and tell them the medication and the time you tried."
5. If the member leaves and returns, the medication shows "Not sent. Try again" in a different color from Pending, and the Refill button is available.
Rules:
- Failure messages differ by cause, because the member's next action differs.
- Entries are kept after a failure so the member does not have to re-enter them.
- "Not sent" takes priority over "Low."
- "Not sent" clears when a retry succeeds, or 24 hours after the failed attempt, whichever comes first. The medication then returns to its normal status.
Known gap (out of scope for this version): a member who sees the error and closes the app gets no reminder. A notification would close that gap.
