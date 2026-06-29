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

## Staged Four-Block Plan (issue #17 — foundation only)

The full four-block rebuild is intentionally **not** implemented in this PR (too
risky for a single change). Only the foundation is laid: directional signage near
the central plaza now points at the intended district clusters so the staged plan
is legible in-world, and the layout below documents the target.

Current plaza already seats districts at fixed anchors (kept as-is). The staged
plan groups them into four outer blocks around the central high area:

```
                north — 北門 / 森の街道 (gate, forest road)
                            |
 west — 学院区/教会区 ──  中央広場 (central high area)  ── east — 市場区/職人区
   (academy, cathedral,        |                            (market, crafts,
    records)              south — 王城 / 貴族区 (royal hill)   smithy)
```

- North block: gate district, caravan road approach.
- South block: royal hill / castle terraces, noble quarter (central high area).
- East block: market district + craft/smith district.
- West block: academy district + cathedral/records district.

Staging (each a separate future PR, no plaza replacement):
1. Signage + district legibility (this PR).
2. Sub-map districts for academy (`academyCampus`) and cathedral
   (`churchGrounds`) — landed in this PR as standalone maps.
3. One outer block converted to denser, walk-through district streets.
4. Remaining blocks, then unify minimap regions.

Constraints honored: plaza geometry unchanged, minimap unaffected, no heavy
geometry added (signage only).

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
| #17 | Four-block capital | Partial (foundation) | Directional signage + this staged plan doc; no city rebuild. |
