# Aurelia Master Plan

This document records the long-term direction for the royal capital Aurelia. It
is a planning note only. The current implementation remains a compact prototype,
and the items below should be split into future, reviewable PRs.

## Long-Term Scale

- Treat the current walled city as one block of the final capital.
- Expand central Aurelia to roughly four times the current playable scale through
  staged production blocks.
- These blocks are production units, not ideological or factional city quarters.
- Put the royal castle on that highland so it is visibly above the lower town.
- Keep the current city playable while expanding outward in phases.

## Scale Blocks

| Production Block | Intended Role |
|---|---|
| Central plaza and mixed streets | Current plaza hub, homes, small shops, inns, markets, routes, and civic signs |
| Nearby facilities | Guild, inn, merchant office, backstreet, guard-facing services, and ordinary housing |
| Large institutional approaches | Academy campus and cathedral grounds with nearby residents, shops, records, and side streets |
| Royal/civic expansion | Castle approach, administration, guard plazas, estates, and the ordinary town around them |

Administration, academy, church, and trade facilities can cluster where it makes
sense, but the city should not become four separated theme districts. Homes,
shops, alleys, inns, record offices, and street traffic should remain mixed.

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

The church surroundings should eventually become a cathedral-scale approach with
gardens, record offices, treatment spaces, and nearby homes/shops, not an
isolated church-only quarter.

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
