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

Current runtime NPC pool:

| NPC role | Runtime key(s) | Runtime files | Notes |
|---|---|---|---|
| Receptionist / innkeeper / academy teacher | `guildReceptionist`, `innMarta`, `academyTeacher` | `assets/models/characters/guild_receptionist/*.gltf` | Female peasant set with role-specific tints |
| Guildmaster / priest / guards | `guildmaster`, `priest`, `guard` | `assets/models/characters/male_common/*.gltf` | Male peasant set with role-specific tints |
| Adventurers | `adventurerMale`, `adventurerFemale` | Both prepared runtime sets | Budgeted pool replacement for guild/city adventurers |
| Merchants / shopkeepers | `merchantMale`, `merchantFemale` | Both prepared runtime sets | Budgeted pool replacement for market and shop NPCs |
| Students / townsfolk / faithful / slum residents | `studentMale`, `studentFemale`, `townsfolkMale`, `townsfolkFemale`, `faithful`, `slumResident` | Both prepared runtime sets | Ambient crowds use a smaller model budget in Low mode |
| Blacksmith / noble | `blacksmith`, `noble` | `assets/models/characters/male_common/*.gltf` | Named/fixed NPCs are prioritized over crowds |

Recommended next step:

- Convert the shared compositions to Blender-authored GLB files.
- Remove hidden base body parts and author an A-pose or idle animation to reduce
  the current static T-pose limitation.
