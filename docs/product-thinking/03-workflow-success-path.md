# Workflow: refill a prescription (success path)
Start: a member's medication is running low and they want to refill it.
## Step 1. Member opens the Prescriptions tab
- System shows each medication with its name, last refill date, and a status. A medication that is running low shows the text "Low" with a red circle, so color is not the only signal.
- Needs: for each prescription, the medication name, last fill date, quantity dispensed, daily dose, and a calculated run-out date.
- **Decision A: is this medication low?** Run-out date = last fill date + (quantity / daily dose). It is Low when today is within 7 days of that date.
- Assumption: the 7-day threshold is a prototype choice.
## Step 2. Member taps Refill on a Low medication
- System opens the refill screen for that medication.
- Needs: the result of Decision A, the medication, and the quantity.
- **Decision C: does Low always allow a refill?** No. If the prescription has no refills remaining, the Refill button is greyed out with the reason "No refills left" and the next step "Contact your doctor to renew this prescription." No renewal flow is built in this version.
## Step 3. Member chooses a pharmacy
- System shows delivery and pickup options. Options the pharmacy cannot do are greyed out with a short reason.
- Needs: the member's pharmacies (name, distance) and what each one can do: delivery, pickup, or both.
- **Decision B: which options are valid?** The chosen pharmacy decides.
## Step 4. Member chooses delivery or pickup
- System shows the estimated cost and expected timing for that combination. The cost is labeled "Estimated" because the final charge may differ.
- Needs: the medication price, the plan's cost-sharing rules, the remaining deductible, and the pharmacy's fulfillment time.
## Step 5. Member taps Confirm refill
- One tap, with no separate review screen.
- System submits the request once and creates a refill record.
- Needs: medication, pharmacy, fulfillment choice, estimated cost, timing, and a generated request ID and submission time.
## Step 6. System shows the completion screen
- Shows that the request was received, its status is Pending, what happens next for the chosen delivery or pickup, and when the member can expect an update.
- Needs: the request record (ID, status, submitted time) and an expected update date.
## Step 7. Return visit: member opens the Prescriptions tab later
- System shows that medication with its request status, the date requested, and the expected update, instead of an active Refill option.
- Needs: a link between the request and the prescription, and status updates coming back from the pharmacy.
## Assumptions
- The statuses Pending and Shipped are placeholders from the prototype. The full list of statuses is not defined yet.
