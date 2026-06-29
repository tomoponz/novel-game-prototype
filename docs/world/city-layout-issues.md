# City Layout Issues

This document tracks current Aurelia layout and presentation issues. It is not a
claim that all items are solved.

## Current Issues

- General buildings still share too much of the same silhouette.
- Some houses can read as simple block buildings.
- Side alleys and narrow living roads are still sparse.
- Pedestrians and carts can still pass through some scenery, though a lightweight
  static-collider check now reduces obvious building penetration.
- The minimap is still a text overview, not a real positional minimap.
- Quest destination guidance is still mostly dialogue and markers.
- The magic academy is not yet campus scale.
- The church is not yet cathedral scale.
- The total capital scale is still smaller than the final four-block goal.
- Some external glTF NPCs still use a static bind/T-pose style presentation.

## Addressed In This PR

| Item | Work |
|---|---|
| General building flatness | Added low-cost facade texture detail and instanced roof/chimney/awning/balcony-style parts |
| White wall and orange roof repetition | Adjusted ordinary wall and roof palettes toward more muted medieval variation |
| Sparse inner roads | Added a small number of narrow visual alley paths around existing open district areas |
| Abrupt time changes | Added a short light and sky transition for time-of-day changes |
| NPC/cart building penetration | Added a small static-collider check with sidestep/route-advance fallback; this is not full pathfinding |

## Not Addressed In This PR

| Item | Reason |
|---|---|
| Real minimap | Needs a separate UI and map-data pass |
| Full NPC/cart avoidance | Needs pathing or steering logic |
| Cart ambush action redesign | Larger combat/event change |
| Permit and flag gate system | Larger progression-system change |
| Academy campus expansion | Larger district expansion |
| Cathedral-scale church | Larger landmark expansion |
| Four-block Aurelia | Major world-scale redesign |
| T-pose correction | Needs Blender-authored GLB or animation preparation |

## Candidate Next PRs

1. Add a lightweight positional minimap for the current city only.
2. Add simple pedestrian/cart steering around major colliders.
3. Expand the academy into a small campus without changing the whole city.
4. Expand the church into a cathedral courtyard scene.
5. Convert the shared glTF NPC compositions into finalized GLB files with an
   A-pose or idle animation.
6. Build the first capital-scale expansion block for Aurelia.

## Staged Capital Scale Plan (issue #17 — foundation only)

The four-block plan means a staged production unit for expanding central Aurelia
to roughly four times the current playable scale. It does **not** mean four
ideological, factional, or color-coded theme districts.

The current plaza stays as the central hub. Phase 1 adds small street extensions,
direction signs, modest shops, homes, props, and residents around the central
plaza so the city feels like it continues beyond the first visible square.
Administration, commerce, academy, and church facilities can cluster by
convenience, but homes, inns, shops, routes, and side alleys should remain mixed.

Staging (each a separate future PR, no plaza replacement):
1. Central plaza street cues + mixed city-life dressing.
2. `administrativeStreet`: permit bureau, records window, guard post, royal
   approach cue, homes, stalls, and waiting citizens.
3. Nearby facility depth for `guildHall`, `inn`, `merchantOffice`, and
   `backstreet`.
4. Larger but still lightweight surroundings for `academyCampus` and
   `churchGrounds`.
5. Additional lightweight submaps around the center until the playable capital
   center is about four times the current scale.

Constraints honored: no one-map 4x rebuild, no factional four-district split,
minimap/world-map compatibility maintained, and no heavy new asset dependency.
The canonical definition now lives in `capital-scale-expansion-plan.md`.

## Implemented / Partially implemented open issues (#10–#17)

Status as of branch `feature/resolve-open-gameplay-issues-20260629`:

| Issue | Title | Status | Notes |
|---|---|---|---|
| #10 | Minimap / next destination | Completed | Official read-only `window.__AURELIA_MINIMAP__` API; minimap uses exact player pos (no camera approx). |
| #11 | Flags / permits / progression | Completed | Derived `player.items` permit object; hotbar reflects progress; guard rules verified against quest chain. |
| #12 | Caravan fireball action | Completed | Pulsing ⚠TARGET marker over the bite-hound, more forgiving hit radius, rescue cannot complete via dialogue. |
| #13 | NPC / cart clipping | Partial | Added stuck-counter re-route + `__AURELIA_DEBUG__.movers()`; still collider-based, not full pathfinding. |
| #14 | Fixed-NPC T-pose | Partial | Mixer infra plays idle clips if present; current CC0 assets have 0 clips, so T-pose remains (needs authored GLB). |
| #15 | Academy campus map | Completed | New `academyCampus` map (gate/courtyard/lecture hall/tower/garden/yard) linking plaza ↔ academy interior. |
| #16 | Cathedral grounds map | Completed | New `churchGrounds` map (cathedral/spires/stained glass/garden/fountain/records) linking plaza ↔ church interior. |
| #17 | Capital scale expansion | Partial (Phase 2) | Added `administrativeStreet` as a mixed civic/living street with permit and record windows; no four-theme-district split or 4x rebuild. |
