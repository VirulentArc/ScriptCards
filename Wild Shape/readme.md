# Tim's Wild Shape Mod

Tim's Wild Shape Mod is a [ScriptCards](https://wiki.roll20.net/Script:ScriptCards) Wild Shape menu and token manager for Roll20. It officially supports the **D&D 5E by Roll20 (2014)** character sheet and includes experimental compatibility with the **D&D 2024 by Roll20 Beacon** character sheet.

The DM chooses which forms are available to each Druid. Players can then browse those forms, use their rollable stat blocks, transform their tokens, and revert when Wild Shape ends.

> [!IMPORTANT]
> **Beacon support is experimental and is not part of the official ScriptCards release.** It requires the unofficial Beacon-compatible ScriptCards build supplied alongside this project. Users playing with the 2014 sheet should use the official ScriptCards release.

![Wild Shape overview](images/wild-shape-overview.png) ![Wild Shape overview](images/wild-shape-overview-2024.png)

## Requirements

- A **Roll20 Pro** subscription with access to Mod (API) Scripts.
- **ScriptCards 3.0.25a**.
- The **D&D 5E by Roll20 (2014)** sheet, or the experimental **D&D 2024 by Roll20 Beacon** sheet.

Only one copy of ScriptCards should be active in the game:

- For a 2014 game, use the official ScriptCards 3.0.25a release.
- For an experimental Beacon game, use the unofficial Beacon-compatible build supplied with this project instead.

## Installation

### 1. Install ScriptCards

1. Open your Roll20 game.
2. Open **Settings** and select **Mod (API) Scripts**.
3. Install the appropriate ScriptCards version for your character sheet.
4. Save the script and confirm that the Mod sandbox starts without errors.

### 2. Create the Wild Shape macro

1. Open the **Collections** tab in your Roll20 game.
2. Under **Macros**, select **Add**.
3. Name the macro `Wild Shape`.
4. Open `Wild_Shape_mod.scard` from this project.
5. Copy the complete contents of the file into the macro's **Actions** field.
6. Make the macro visible to the players who will use it.
7. Enable **Show as Token Action** or **Show in Macro Bar**, depending on how your group will launch it.
8. Save the macro.

The `.scard` file belongs in a Roll20 macro or character ability. Do not paste it into the Mod (API) Script editor.

## Prepare your game

### Druid characters

Each Druid must:

- Be an unarchived player character controlled by a player.
- Have at least one level in the Druid class.
- Use the same Roll20 sheet system as the game.
- Have a token that represents the correct Druid character sheet.

### Wild Shape forms

Each possible form should be an unarchived NPC character in the Journal with:

- NPC mode enabled.
- A recognizable character name.
- Its creature type, challenge rating, and movement speeds entered on the sheet.
- A usable default token with a Roll20-hosted image.
- Any traits, actions, saves, and skills that should appear on the Wild Shape card.

A character avatar can be used as a fallback, but a proper default token is strongly recommended.

## Initial DM setup

1. Run the **Wild Shape** macro as the DM.
2. If the game contains multiple Druids, choose the Druid you want to configure. A game with one recognized Druid opens that Druid automatically.
3. Set **Rules** to match the game's character sheet:
   - **2014 Rules** for the D&D 5E by Roll20 sheet.
   - **2024 Rules** for the experimental D&D 2024 by Roll20 Beacon sheet.
4. Set **Non-Beasts** to the desired value.
5. Select **Manage Wild Shape Forms**.
6. Use the letter buttons to browse the available NPCs.
7. Select an NPC name to assign or remove it. Assigned forms are highlighted.
8. Repeat this setup for every Druid in the game.
9. Turn **DM View** off when you want to see the selected Druid's player-facing menu.

![Wild Shape DM Settings](images/gm-settings.png)

![Managing Wild Shape forms](images/manage-wild-shape-forms.png)

The **Rules** and **Non-Beasts** settings apply to the whole campaign. Form assignments and transformation effects are set separately for each Druid.

### Non-Beasts and eligibility

- With **Non-Beasts: Off**, the form manager displays NPCs whose creature type contains `Beast`.
- With **Non-Beasts: On**, any valid NPC can be assigned as a form.
- Turning Non-Beasts off does not remove non-Beast forms that were already assigned.
- Eligibility warnings show when a form exceeds the normal challenge-rating or movement limits for the Druid's level. These warnings are informational; the DM can still assign the form.

## Using Wild Shape

### Player instructions

1. Select a token that represents the Druid character sheet.
2. Run the **Wild Shape** macro.
3. Select **Choose Form**.
4. Select either the portrait or name of the desired form.
5. Review the form's stat block.
6. Select **Wild Shape** to transform.
7. Use the checks, saves, skills, traits, and action buttons directly from the form card.
8. Select **Revert** when the transformation ends.

The last-selected form opens automatically the next time that Druid runs the script. Select **Choose Form** whenever you want a different assigned form.

While transformed, you can choose another form and select **Wild Shape** to change directly into it.

Strength, Dexterity, and Constitution rolls use the selected form's statistics. Intelligence, Wisdom, and Charisma rolls use the Druid's statistics.

![Choosing a Wild Shape form](images/choose-wild-shape.png)

![Wild Shape form stat block](images/wild-shape-overview.png)

### DM View and multiple Druids

The **DM View** control is visible only to the DM.

- A new DM session with no Druid selected opens DM View automatically.
- In a game with one Druid, that Druid opens automatically.
- In a game with multiple Druids, choose the Druid from the DM card.
- Token selection does not determine which Druid the DM is configuring.
- Turning DM View off shows the selected Druid's player-facing menu for testing.

### Transformation effects

Select **FX** or **FX Settings** from the player-facing card to choose that Druid's transformation effect. You can use the default effect, disable the effect, or choose another Roll20 effect type and color.

## Force Revert and recovery

If a Druid has a recorded active transformation, the DM Settings card displays **Force Revert**. Use it when a transformed token was manually deleted or the token and saved transformation state are out of sync.

1. Run the macro as the DM.
2. Choose the affected Druid.
3. Select **Force Revert**.
4. Read the recovery message and confirm the action.
5. Follow any manual token instructions shown by the script.

The Rules setting cannot be changed while any Druid has an active Wild Shape state. Revert or Force Revert every transformed Druid first.

## Updating

1. Revert every transformed Druid.
2. Open the Roll20 **Wild Shape** macro.
3. Replace the complete macro action with the complete contents of the new `Wild_Shape_mod.scard` file.
4. Save the macro.
5. Test one complete transform and revert cycle.

Existing form assignments and settings are retained when the macro is updated.

## Quick troubleshooting

### No Druids are found

Confirm that the character is unarchived, controlled by a player, configured as a player character, and has at least one Druid level.

### No NPCs are available in Manage Wild Shape Forms

Confirm that the NPC is unarchived, has NPC mode enabled, and has a usable default token or character avatar. It must also have `Beast` in its creature type unless **Non-Beasts** is on.

### A roll button reports "No action available"

Confirm that the game is using the correct ScriptCards build and character sheet. Also confirm that the requested roll or action exists on the source character sheet.

### Token Replacement Failed

Make sure the form has a usable Roll20-hosted default-token image. If Roll20 created an extra token despite displaying an error, delete the extra token before trying again.

### Rules cannot be changed

At least one Druid still has an active Wild Shape state. Revert normally or use **Force Revert** from DM View.

## Credits

Created by **Timothy Beasley** for Roll20 and ScriptCards.
