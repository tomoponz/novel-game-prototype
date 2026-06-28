# Model Candidate Notes

Source checked:

- `Universal Base Characters[Standard].zip`
- `Modular Character Outfits - Fantasy[Standard].zip`
- Repository path: `assets/models/Universal Base Characters[Standard]/`
- Repository path: `assets/models/Modular Character Outfits - Fantasy[Standard]/`

Detected contents:

| Type | Present | Notes |
|---|---:|---|
| glTF | Yes | Universal base characters, hairstyles, and outfit files include `.gltf` with `.bin` geometry |
| GLB | No | No `.glb` files found |
| FBX | Yes | Universal base characters and outfit packs include FBX exports |
| OBJ | No | No `.obj` files found |
| Textures | Yes | Large PNG base color, normal, roughness/ORM textures are present in the source folders |
| License | Yes | `License_Standard.txt`, CC0 1.0, models by Quaternius |
| Readme | Yes | Outfit readme notes that the clothing works with the Universal Base Character kit |

Important implementation note:

The included readme says these are outfit assets intended to work with the
Universal Base Character kit. It notes that only the head of the base character
is required when using the clothing, and using a full body can cause clipping.
This PR adds GLTFLoader only for the guild receptionist and uses prepared
runtime glTF files in `assets/models/characters/guild_receptionist/`.

Candidate NPC mapping for a later model PR:

| Candidate NPC | Candidate file | Format | Usable as-is? | Notes |
|---|---|---|---|---|
| Guild receptionist | `characters/guild_receptionist/base.gltf` + `outfit.gltf` + `hair.gltf` | glTF | Prototype-ready | Uses Universal female base, Female_Peasant outfit, and SimpleParted hair; future Blender GLB should remove hidden body parts |
| Academy teacher | `Exports/glTF (Godot-Unreal)/Outfits/Female_Ranger.gltf` or `Male_Ranger.gltf` | glTF | Not directly | Stronger fantasy silhouette; may suit a senior mage/teacher after color/material pass |
| Innkeeper | `Exports/glTF (Godot-Unreal)/Outfits/Female_Peasant.gltf` | glTF | Not directly | Peasant outfit is closest to an inn/tavern worker |

Recommended next step:

- Convert the receptionist composition to a single Blender-authored GLB.
- Expand the same pipeline to `academy_teacher` and `inn_marta` only after the
  receptionist pass is reviewed.
