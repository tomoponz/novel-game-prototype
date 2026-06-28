# Aurelia Master Plan

This document records the long-term direction for the royal capital Aurelia. It
is a planning note only. The current implementation remains a compact prototype,
and the items below should be split into future, reviewable PRs.

## Long-Term Scale

- Treat the current walled city as one block of the final capital.
- Expand Aurelia to roughly four blocks at the final prototype scale.
- Place the four blocks around a central highland.
- Put the royal castle on that highland so it is visibly above the lower town.
- Keep the current city playable while expanding outward in phases.

## Four-Block Structure

| Block | Intended Role |
|---|---|
| Lower town | Current market, guild, inn, crafts, and ordinary housing |
| Noble and castle approach | Walled estates, guard posts, administration, castle plaza |
| Academy quarter | Magic academy campus, dormitory area, practice fields |
| Cathedral quarter | Cathedral, gardens, charity houses, archives, church plaza |

## Royal Castle

- The castle should sit higher than the surrounding town.
- Approaches should climb through terraces, gates, and guard plazas.
- The castle should be a visual landmark from the main roads.
- Castle expansion should not flatten or replace the current city in one pass.

## Magic Academy

The academy should eventually feel closer to a university campus than a single
building.

Future elements:

- Main gate
- Lecture halls
- Courtyard
- Practice yard
- Library or archive tower
- Dormitory-like side buildings
- Garden paths and small fountains

## Church And Cathedral

The church quarter should eventually become a cathedral and garden district.

Future direction:

- Cathedral-scale main building
- Tall towers and a rich silhouette
- Stained-glass-like colored panels
- Garden paths and cloisters
- Pilgrim and charity areas
- Visual richness inspired by ornate cathedrals such as Sagrada Familia, without
  directly copying a real building.

## Implementation Approach

- Do not implement the four-block city in one large PR.
- Keep `render=low` playable in every expansion.
- Preserve map transitions, Start flow, SE hooks, fireball controls, Trust, and
  the glTF NPC fallback design.
- Add new districts only after collision, culling, and navigation impact are
  tested locally.
