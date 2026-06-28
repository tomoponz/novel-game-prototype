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
