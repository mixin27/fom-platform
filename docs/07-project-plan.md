# Project Plan

## Plan Summary
Goal: build MVP in 5 to 7 days and validate with 5 to 10 real sellers.

## Work Phases
| Phase | Duration | Deliverables |
| --- | --- | --- |
| Discovery | 0.5 day | Finalized requirements, UX flow, data model |
| MVP Build | 4 to 5 days | Working app with core order flow |
| QA and Polish | 1 day | Bug fixes, Burmese copy review |
| Pilot | 1 day | 5 to 10 sellers onboarded |

## MVP Milestones
| Day | Focus | Output |
| --- | --- | --- |
| Day 1 | UX flow and data model | Screens wireframe and DB schema/migrations |
| Day 2 | Order creation and list | Add order, list, filter |
| Day 3 | Status updates and summary | One-tap status, daily summary |
| Day 4 | Localization and offline | Burmese UI, offline sync |
| Day 5 | QA and onboarding | Fix bugs, seed demo data |

## Key Risks
- Slow order entry flow could reduce adoption
- Burmese fonts and rendering issues on older devices
- Data loss risk without proper offline sync

## Mitigation
- Keep entry form short and fast
- Test fonts on low-end Android devices
- Use local cache with reliable sync and conflict handling
