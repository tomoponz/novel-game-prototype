# Audio Asset Credits

The game uses a small curated subset of Kenney sound effects copied into
`assets/audio/se/` for GitHub Pages runtime use. The original uploaded packs are
kept as source material, but the game does not load zip files at runtime.

Kenney assets are released under CC0. Credit is not required, but this project
records the source as: Kenney / kenney.nl.

Checked packs:

- `kenney_interface-sounds.zip`
- `kenney_ui-audio.zip`
- `kenney_rpg-audio.zip`
- `kenney_impact-sounds.zip`

Adopted files:

| Use | Source zip | Source file | Runtime path | License |
|---|---|---|---|---|
| dialogue_next | `kenney_interface-sounds.zip` | `Audio/select_001.ogg` | `assets/audio/se/ui/dialogue_next.ogg` | CC0 |
| ui_decide | `kenney_interface-sounds.zip` | `Audio/confirmation_001.ogg` | `assets/audio/se/ui/ui_decide.ogg` | CC0 |
| ui_cancel | `kenney_interface-sounds.zip` | `Audio/back_001.ogg` | `assets/audio/se/ui/ui_cancel.ogg` | CC0 |
| trust_up | `kenney_interface-sounds.zip` | `Audio/confirmation_004.ogg` | `assets/audio/se/ui/trust_up.ogg` | CC0 |
| door_open | `kenney_rpg-audio.zip` | `Audio/doorOpen_1.ogg` | `assets/audio/se/world/door_open.ogg` | CC0 |
| door_close | `kenney_rpg-audio.zip` | `Audio/doorClose_1.ogg` | `assets/audio/se/world/door_close.ogg` | CC0 |
| fireball_cast | `kenney_interface-sounds.zip` | `Audio/switch_007.ogg` | `assets/audio/se/magic/fireball_cast.ogg` | CC0 |
| fireball_hit | `kenney_impact-sounds.zip` | `Audio/impactGeneric_light_000.ogg` | `assets/audio/se/magic/fireball_hit.ogg` | CC0 |
| crystal_crack | `kenney_impact-sounds.zip` | `Audio/impactGlass_medium_000.ogg` | `assets/audio/se/magic/crystal_crack.ogg` | CC0 |

Notes:

- `kenney_ui-audio.zip` was checked and contains usable click/switch sounds, but
  no file from it is adopted in this pass.
- `fireball_cast` is a temporary short effect. It can be replaced later by a
  more explicitly magical whoosh/spell sound.
