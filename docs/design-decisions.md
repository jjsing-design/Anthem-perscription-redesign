# Design decisions

## Pharmacy is the prescription surface

Home keeps a short path to prescriptions, claims, and the plan. The list itself, deductible, out-of-pocket, status, and cost live on Pharmacy. One list, one set of rules.

## Status is a badge, and the button follows it

| Status | Meaning | Refill Now |
| --- | --- | --- |
| Refill Available | The next refill date has passed | Enabled |
| Active | The next refill date is still ahead | Disabled, with the date it opens |
| Pending | A refill is already in progress | Disabled |

A date that has passed is not enough on its own. A pending order stays disabled so the member does not submit the same refill twice.

## Cost is visible before the flow, and explained inside it

Each prescription shows `Est. cost`. The confirm screen breaks that into medication, what the plan pays, delivery, and the estimated total.

Pharmacy pickup has no delivery fee. Home delivery adds **$4.99**. The delivery row and the estimated total update when the member switches methods. The order confirmation keeps the total they confirmed.

## The happy path is three taps

From Home, Prescriptions, then Refill Now, then Confirm. From Pharmacy it is two taps, because the list is already open. Pharmacy and delivery have defaults, so changing them is optional.

## The visual system follows a light health-app reference

The reference uses a blue gradient header, white floating cards, soft shadows, and a bottom bar with a short active mark. This prototype uses that structure:

- Gradient header and a white card for Sydney.
- Plan spending shown as rings, in the same family as the reference score rings.
- Refill and claim actions as blue buttons. Disabled refills stay visible but quiet.
- Bottom navigation for Home, Claims, Pharmacy, and Settings, with the current tab in blue.

## States in the refill flow

Confirm does not jump straight to success. The member sees a loading state, “Sending your refill,” and then the order confirmation. Logout lives in Settings and returns to sign-in, clearing the session so the sample data starts over.
