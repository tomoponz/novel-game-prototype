# Model Candidate Notes

Source checked:

- `Modular Character Outfits - Fantasy[Standard].zip`
- Repository path: `assets/models/Modular Character Outfits - Fantasy[Standard]/`

Detected contents:

| Type | Present | Notes |
|---|---:|---|
| glTF | Yes | `Exports/glTF (Godot-Unreal)/Outfits/*.gltf` with `.bin` and texture files |
| GLB | No | No `.glb` files found |
| FBX | Yes | `Exports/FBX (Unity)/` contains outfits and modular parts |
| OBJ | No | No `.obj` files found |
| Textures | Yes | Large PNG base color, normal, roughness/ORM textures |
| License | Yes | `License_Standard.txt`, CC0 1.0, models by Quaternius |
| Readme | Yes | Notes that these outfits work with the Universal Base Character kit |

Important implementation note:

The included readme says these are outfit assets intended to work with the
Universal Base Character kit. It notes that only the head of the base character
is required when using the clothing, and using a full body can cause clipping.
For this reason, this PR does not add GLTFLoader or replace NPCs yet.

Candidate NPC mapping for a later model PR:

| Candidate NPC | Candidate file | Format | Usable as-is? | Notes |
|---|---|---|---|---|
| Guild receptionist | `Exports/glTF (Godot-Unreal)/Outfits/Female_Peasant.gltf` | glTF | Not directly | Good modest outfit silhouette, but likely needs Universal Base Character head/body setup |
| Academy teacher | `Exports/glTF (Godot-Unreal)/Outfits/Female_Ranger.gltf` or `Male_Ranger.gltf` | glTF | Not directly | Stronger fantasy silhouette; may suit a senior mage/teacher after color/material pass |
| Innkeeper | `Exports/glTF (Godot-Unreal)/Outfits/Female_Peasant.gltf` | glTF | Not directly | Peasant outfit is closest to an inn/tavern worker |

Recommended next step:

- Add a separate GLTFLoader experiment branch.
- Load one outfit in an isolated preview scene first.
- Confirm the required Universal Base Character dependency before wiring any
  model into live NPC spawning.
