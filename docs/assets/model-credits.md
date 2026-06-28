# Model Asset Credits

The game uses a small runtime subset of Quaternius character assets for the
guild receptionist NPC. The original uploaded asset folders remain as source
material; the game loads only the prepared runtime files listed below.

Quaternius assets are released under CC0 1.0. Credit is not required, but this
project records the optional credit as: Quaternius / quaternius.com.

Checked source folders:

- `assets/models/Universal Base Characters[Standard]/`
- `assets/models/Modular Character Outfits - Fantasy[Standard]/`

Adopted files:

| Use | Source asset | Source file | Runtime path | License |
|---|---|---|---|---|
| Receptionist base body/head | Universal Base Characters | `Base Characters/Godot - UE/Superhero_Female_FullBody.gltf` | `assets/models/characters/guild_receptionist/base.gltf` | CC0 1.0 |
| Receptionist base geometry | Universal Base Characters | `Base Characters/Godot - UE/Superhero_Female_FullBody.bin` | `assets/models/characters/guild_receptionist/base.bin` | CC0 1.0 |
| Receptionist outfit | Modular Character Outfits - Fantasy | `Exports/glTF (Godot-Unreal)/Outfits/Female_Peasant.gltf` | `assets/models/characters/guild_receptionist/outfit.gltf` | CC0 1.0 |
| Receptionist outfit geometry | Modular Character Outfits - Fantasy | `Exports/glTF (Godot-Unreal)/Outfits/Female_Peasant.bin` | `assets/models/characters/guild_receptionist/outfit.bin` | CC0 1.0 |
| Receptionist hair | Universal Base Characters | `Hairstyles/Rigged to Head Bone/glTF (Godot -Unreal)/Hair_SimpleParted.gltf` | `assets/models/characters/guild_receptionist/hair.gltf` | CC0 1.0 |
| Receptionist hair geometry | Universal Base Characters | `Hairstyles/Rigged to Head Bone/glTF (Godot -Unreal)/Hair_SimpleParted.bin` | `assets/models/characters/guild_receptionist/hair.bin` | CC0 1.0 |

Runtime notes:

- The prepared glTF files keep the Quaternius geometry but replace large texture
  references with simple material colors to avoid loading tens of megabytes for
  one prototype NPC.
- The outfit source readme recommends using only the base character head with
  clothing. This PR overlays the full base body under the outfit for a browser
  prototype; a future Blender-authored GLB should remove hidden body parts.

## Expansion (fix/visible-gltf-npcs-expand)

The disappearing receptionist was caused by `gltf.scene.clone(true)` sharing the
original skeleton on skinned meshes; switching to `SkeletonUtils.clone()` plus a
visibility check (Box3 height 1.0–3.5, mesh count ≥ 1) before removing the
primitive fallback fixed it. Fixed/named NPCs now use external glTF with a
guaranteed fallback.

To avoid duplicating large files, only two runtime model sets exist; per-NPC
roles are differentiated by runtime material color tints in `CHARACTER_MODELS`.

| Runtime set | Source (Quaternius CC0) | Runtime path | Used by |
|---|---|---|---|
| Female peasant | Superhero_Female + Female_Peasant + Hair_SimpleParted | `assets/models/characters/guild_receptionist/` | guild_receptionist, inn_marta, academy_teacher |
| Male peasant | Superhero_Male + Male_Peasant + Hair_SimpleParted | `assets/models/characters/male_common/` | guildmaster, priest, gate guard, training instructor |

## Expansion (feature/all-human-gltf-npc-pool)

This pass broadens human NPC usage through the same two prepared runtime sets
instead of copying additional texture-heavy source files. The model registry now
adds role variants for adventurers, merchants, students, townsfolk, faithful,
slum residents, blacksmiths, and nobles. These variants reuse the female peasant
or male peasant runtime parts with different material tints and scales.

Low/Medium/High modes cap external human NPC attempts at 12/24/40 per loaded
map. Ambient crowds have a smaller 4/10/20 sub-budget so named or fixed NPCs can
still receive external models. Any budget exhaustion, missing file, failed load,
or failed visibility check leaves the existing primitive fallback visible.

All assets are Quaternius CC0 1.0 (credit optional: Quaternius / quaternius.com).
Both sets keep the full rigged base body under the outfit (texture-stripped,
material colors only). Known limitation: the bind pose is a static T-pose and the
base body shows under the minimal outfit — a Blender-authored single GLB
(A-pose, hidden parts removed) is the recommended next step.
