# Anthem prescription redesign

A mobile prototype for an Anthem member app. Prescriptions, cost, and refill status live in one place, and a refill can be confirmed in a few taps.

This is sample member data for a design portfolio. It is not a live Anthem sign-in.

## Prototype

React 18 and Vite. Styles are in component files. The layout is mobile-first, with the app column capped at 480px.

```bash
npm install
npm run dev
```

Sign in with any username and password. The sample member is Jordan Ellis.

## Design notes

| Doc | What it covers |
| --- | --- |
| [Problem](docs/problem.md) | What is hard about managing a refill today |
| [Existing experience](docs/existing-experience.md) | How prescriptions are split across the current app |
| [UX audit](docs/ux-audit.md) | What gets in the way of acting |
| [Design decisions](docs/design-decisions.md) | What this prototype changes, and why |
| [AI workflow](docs/ai-workflow.md) | Sydney in the product, and how the prototype was built |
| [Iteration](docs/iteration.md) | What changed after the first pass |
| [Validation plan](docs/validation-plan.md) | How to test the refill flow |
| [Case study](docs/case-study.md) | The story in one place |

## Product thinking
The problem framing, workflow maps, and decisions behind this redesign are in [`docs/product-thinking`](docs/product-thinking):
- [Problem statement](docs/product-thinking/01-problem-statement.md)
- [Observed vs. assumed](docs/product-thinking/02-observed-vs-assumed.md)
- [Workflow: success path](docs/product-thinking/03-workflow-success-path.md)
- [Workflow: exception paths](docs/product-thinking/04-workflow-exceptions.md)
- [Decision log](docs/product-thinking/05-decision-log.md)
Work in progress: remaining exception paths, a consolidated data model, and acceptance criteria.
