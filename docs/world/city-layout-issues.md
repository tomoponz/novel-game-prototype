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
6. Build the first outer block of the four-block Aurelia plan.
