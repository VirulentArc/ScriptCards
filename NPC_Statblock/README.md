# Tim's NPC Stat Block Mod v5.5.0

A compact NPC stat block for Roll20, built with ScriptCards.

Select an NPC token, run the macro, and the script prints a chat stat block with clickable buttons for checks, saves, skills, initiative, traits, actions, spells, recharge rolls, token HP controls, and token condition management.

The Mod is designed to resemble official D&D NPC stat blocks as closely as possible while still keeping Roll20 functionality practical at the table.

<!-- IMAGE PLACEHOLDER: Main NPC stat block in 2014 Full Mode -->
<!-- ![NPC Stat Block - 2014 Full Mode](docs/images/npc-statblock-2014-full.png) -->

---

## Support Status

### Officially Supported

- **D&D 5E 2014 by Roll20**

### Experimental Support

- **Beacon character sheet**

Beacon support is currently **experimental only** and requires the [Beacon-compatible experimental version of ScriptCards](https://github.com/VirulentArc/ScriptCards/tree/main/D%26D2024%20Beacon). It is not part of the normal public ScriptCards release at this time.

The Mod also supports both **2014** and **2024** presentation styles. The selected Rules/Theme setting is separate from the sheet type, so either supported sheet can display either theme.

---

## Features

- Displays an NPC stat block directly in chat.
- Mimics official **2014** and **2024** NPC stat block presentation as closely as practical.
- Supports the **2014 Roll20 5E NPC sheet**.
- Includes **experimental Beacon support** when used with the Beacon experimental ScriptCards build.
- Includes clickable buttons for:
  - ability checks
  - saving throws
  - skills
  - initiative
  - traits
  - actions
  - bonus actions
  - reactions
  - legendary actions
  - mythic actions
  - spells
- Includes built-in **Disadvantage / Normal / Advantage** roll controls.
- Includes a **Whisper to GM** toggle.
- Includes an **Auto Roll Damage** toggle.
- Includes **Full Mode** and **Combat Mode** display options.
- Includes a **Spells** card for NPC spellcasting.
- Includes tooltips for traits, actions, and spells so the GM can review full text without sending it to chat.
- Includes a **Recharge** button for abilities with Recharge text.
- Includes a token-only **HP roll** button for NPCs with an HP formula.
- Includes a token-only **HP reset** button to restore HP from the sheet value.
- Includes a **Manage Conditions** button for applying and removing token condition markers.
- Includes configurable condition marker mappings stored in the settings handout.
- Automatically respects **Condition Immunities** when showing available conditions.
- NPC names on the card link directly to the Roll20 journal entry.
- Automatically creates and uses a shared **NPC Stat Block Settings** handout.

---

## Requirements

### For Officially Supported 2014 Use

- A Roll20 Pro game with Mod/API access.
- ScriptCards installed in the game.
- The official **D&D 5E 2014 by Roll20** character sheet.
- An NPC character sheet.
- A token linked to that NPC sheet.

### For Experimental Beacon Use

- A Roll20 Pro game with Mod/API access.
- The [**Beacon-compatible experimental ScriptCards build**](https://github.com/VirulentArc/ScriptCards/tree/main/D%26D2024%20Beacon).
- A Beacon NPC sheet.
- A token linked to that NPC sheet.

---

## Installation

### D&D 5E 2014

1. Install the normal release of **ScriptCards** in your Roll20 game.
2. Copy the full contents of `NPC_Statblock_v5.5.0.scard`.
3. In Roll20, open the **Collections** tab.
4. Create a new macro, such as `NPC-Statblock`.
5. Paste the full NPC Stat Block script into the macro.
6. Save the macro.
7. Select a token that represents an NPC character.
8. Run the macro.

The NPC Stat Block script is installed as a Roll20 **Game Macro**. It is not a separate Mod/API script.

### Experimental Beacon

Beacon requires the experimental Beacon-compatible build of ScriptCards instead of the normal ScriptCards release.

1. Go to the [D&D 2024 Beacon folder in the ScriptCards GitHub repository](https://github.com/VirulentArc/ScriptCards/tree/main/D%26D2024%20Beacon).
2. Open the current Beacon-compatible ScriptCards `.js` file and copy its complete contents.
3. In Roll20, open your game's **Mod (API) Scripts** page.
4. Create a new custom Mod script and give it a name such as `ScriptCards-Beacon`.
5. Paste the complete Beacon-compatible ScriptCards JavaScript into the new Mod script and save it.
6. If the normal release of ScriptCards is already installed in the game, disable or remove it while using the Beacon build. **Do not run both versions of ScriptCards at the same time.**
7. Copy the full contents of `NPC_Statblock_v5.5.0.scard`.
8. In Roll20, open the **Collections** tab and create a new Game Macro, such as `NPC-Statblock`.
9. Paste the full NPC Stat Block script into the macro and save it.
10. Select a token representing a Beacon NPC and run the macro.

The experimental Beacon ScriptCards build replaces the normal ScriptCards Mod for Beacon use. The NPC Stat Block itself is still installed as a **Game Macro** in the same way as the 2014 version.

For updates, replace the entire NPC Stat Block macro with the newest full script. Large ScriptCards macros are easiest to maintain in an external editor, then copied into Roll20 as one complete block.

---

## Quick Start

1. Select one NPC token.
2. Run the `NPC-Statblock` macro.
3. Use the buttons on the stat block.
4. If needed, click the **gear** button to open the shared settings handout.

The macro will show an error if:

- no token is selected
- more than one token is selected
- the token does not represent a character
- the represented character is not an NPC

---

## First Run

The first time the macro runs, it creates an archived handout named:

```text
NPC Stat Block Settings
```

This handout stores the Mod's shared settings, including:

- whisper mode
- roll mode
- auto damage mode
- Full/Combat mode
- Rules/Theme
- condition marker mappings

Do not edit the GM Notes of this handout unless you are intentionally resetting or repairing the settings.

If the handout is deleted, the script will recreate it the next time the macro runs.

<!-- IMAGE PLACEHOLDER: NPC Stat Block Settings handout -->
<!-- ![NPC Stat Block Settings](docs/images/npc-statblock-settings.png) -->

---

## Display Modes

The stat block has two display modes.

### Full Mode

Full Mode shows the most complete version of the NPC entry. It includes the NPC's core statistics, full ability and saving throw block, skill buttons, combat defenses, senses, languages, challenge, proficiency bonus, traits, actions, bonus actions, reactions, legendary actions, mythic actions, and spell access when available.

### Combat Mode

Combat Mode is a tighter table-use view. It keeps combat-relevant information visible while moving the full skill grid onto a separate **Skills** button.

Traits are still shown in Combat Mode, because many NPC traits are important during combat.

<!-- IMAGE PLACEHOLDER: Combat Mode example -->
<!-- ![NPC Stat Block - Combat Mode](docs/images/npc-statblock-combat-mode.png) -->

### Switching Modes

The mode button appears at the bottom of the card.

- **Combat Mode** means the card is currently in Full Mode and will switch to Combat Mode.
- **Full Mode** means the card is currently in Combat Mode and will switch to Full Mode.

The selected mode is saved in the settings handout and is shared for the game.

---

## Rules / Theme

The Mod supports both **2014** and **2024** visual presentation styles.

<!-- IMAGE PLACEHOLDER: 2014 and 2024 theme comparison -->
<!-- ![NPC Stat Block - 2014 and 2024 Themes](docs/images/npc-statblock-theme-comparison.png) -->

This is a display setting, not a sheet-type lock.

That means:

- a supported 2014 sheet can be displayed in 2014 or 2024 style
- a supported Beacon sheet can be displayed in 2014 or 2024 style

The setting is saved in the shared settings handout.

---

## Card Controls

The bottom controls determine how card rolls behave.

### Whisper to GM

The speech-bubble button toggles whether the stat block's rolls and related outputs are whispered.

- Whisper on: outputs are whispered to the GM.
- Whisper off: outputs are public.

### Auto Roll Damage

The **DMG** button controls how attack damage is handled.

- **Off / Pick Damage**: attack rolls use Roll20's normal damage links or buttons.
- **On / Full Damage**: attack rolls include damage automatically.

### D / N / A Buttons

The **D**, **N**, and **A** buttons control the roll mode.

- **D** = disadvantage
- **N** = normal
- **A** = advantage

These controls are used by the card's rolls, including initiative.

### Settings Button

The gear button opens the **NPC Stat Block Settings** handout.

### Manage Conditions Button

The condition-management button opens the **Manage Conditions** card for the selected token.

---

## Reading the Stat Block

The card is designed to remain compact.

Long descriptive text is shortened on the visible card, but full cleaned text remains available in tooltips.

The card can show:

- NPC name and type
- Armor Class
- Initiative
- Hit Points and HP formula
- Speed
- Ability scores and modifiers
- Saving throw buttons
- Skill buttons
- Damage vulnerabilities, resistances, and immunities
- Condition immunities
- Senses
- Languages
- Challenge Rating and XP
- Proficiency Bonus
- Traits
- Actions
- Bonus Actions
- Reactions
- Legendary Actions
- Mythic Actions
- Spells, when available

Only sections with usable data are shown.

---

## Rolling from the Card

Most buttons roll using Roll20's normal NPC roll output.

### Ability Checks and Saving Throws

Click an ability score button to roll an ability check.

Click the save button under an ability to roll that ability's saving throw.

If the NPC has a listed save bonus, the save button uses that listed bonus. Otherwise it falls back to the ability modifier.

### Skills and Initiative

In Full Mode, skill buttons appear directly on the main card.

In Combat Mode, click **Skills** to open a separate skill card.

Initiative uses the NPC's initiative bonus when present. If no separate initiative bonus exists, it falls back to Dexterity. Initiative rolls respect the card's D / N / A mode and update the turn order for the selected token.

### Actions

Attack actions use native NPC attack output.

Non-attack actions use the sheet's own action output when appropriate.

### Traits

Traits appear in both Full Mode and Combat Mode. This is intentional.

Many NPC traits are rules-critical during combat, such as Magic Resistance, Legendary Resistance, Pack Tactics, Regeneration, or sunlight-related weaknesses.

---

## Spells

If the NPC has spellcasting data, the card shows a **Spells** button.

Click **Spells** to open a spell list card.

<!-- IMAGE PLACEHOLDER: Spells card -->
<!-- ![NPC Stat Block - Spells](docs/images/npc-statblock-spells.png) -->

Spells are grouped by level:

- Cantrips
- Level 1 through Level 9

Spell rows can show:

- spell name
- compact description
- tooltip details
- native cast button when available
- native description button when available

Tooltips can include:

- school
- casting time
- range
- target
- components
- ritual tag
- concentration tag
- duration
- innate spell text
- description
- higher-level text

This script displays and rolls NPC spells. It does not manage spell slots or spell preparation.

---

## Recharge Rolls

If an action includes a Recharge entry such as **Recharge 5–6**, the action receives a Recharge button.

Clicking that button rolls the recharge check and reports whether the ability recharges.

Recharge output follows the current whisper setting.

---

## Token Hit Point Controls

If the NPC has an HP formula, the card shows a roll button beside the HP formula.

Clicking it rolls the NPC's HP formula and applies the result to the selected token's **current and maximum HP**.

- This affects the **selected token only**.
- It does **not** change the character sheet.
- If the rolled result is **0 or lower**, it is forced to **1**.

A second button resets the token's HP to the sheet HP value.

---

## Manage Conditions

The Mod includes a **Manage Conditions** card for the selected token.

<!-- IMAGE PLACEHOLDER: Manage Conditions card -->
<!-- ![NPC Stat Block - Manage Conditions](docs/images/npc-statblock-manage-conditions.png) -->

Supported conditions are:

- Blinded
- Charmed
- Deafened
- Exhausted
- Frightened
- Grappled
- Incapacitated
- Invisible
- Paralyzed
- Petrified
- Poisoned
- Prone
- Restrained
- Stunned
- Unconscious

The card lets the GM quickly apply or remove those conditions as token markers.

If the NPC has Condition Immunities, immune conditions are automatically omitted from the list.

---

## Condition Marker Settings

Condition marker mappings are stored in the shared settings handout.

<!-- IMAGE PLACEHOLDER: Condition Marker settings -->
<!-- ![NPC Stat Block - Condition Marker Settings](docs/images/npc-statblock-condition-markers.png) -->

On first setup, the Mod attempts to auto-match Roll20's default token markers by name where possible.

Examples:

- Blinded → Blinded
- Charmed → Charmed
- Exhausted → Exhausted
- Stunned → Stunned

If needed, the GM can manually change or clear each mapping from the settings handout.

Condition mappings are shared in the game.

---

## Shared Settings

The script stores these settings in the `NPC Stat Block Settings` handout:

| Setting | What it controls |
| --- | --- |
| Whisper to GM | Whether outputs are public or whispered to the GM. |
| Roll Mode | Disadvantage, Normal, or Advantage. |
| Auto Roll Damage | Pick damage or include damage automatically. |
| Display Mode | Full Mode or Combat Mode. |
| Rules / Theme | 2014 or 2024 presentation style. |
| Condition Markers | Which token marker is assigned to each supported condition. |

These settings are shared for the game.

---

## What the Script Changes

The script reads the selected NPC sheet and displays a chat stat block.

It does not rewrite the NPC's stat block contents.

To keep native sheet-style button behavior consistent with the card's roll controls, the script may update the selected NPC sheet's normal whisper and damage roll settings. This is the same kind of setting changed by the Roll20 5E sheet's own controls.

The script can also:

- update the selected token's HP bars when using the HP controls
- update the selected token's condition markers when using Manage Conditions
- update the turn tracker when rolling initiative

It does **not** use the token HP controls or condition tools to change the character sheet itself.

---

## Updating from Older Versions

Older versions of this project used a ScriptCards template mule and a custom stat block template. Version 5.5.0 no longer requires that setup.

You do not need:

- `ScriptCards_TemplateMule`
- `statblockv4`
- stored ScriptCards templates
- `!sc-reloadtemplates`

You can leave old template material in your game if other scripts still use it, but this NPC Stat Block Mod no longer depends on it.

---

## Troubleshooting

### No token is selected

Select exactly one NPC token, then run the macro again.

### More than one token is selected

Deselect the extra tokens. The macro only works with one selected token at a time.

### The token is not linked to a character sheet

Open the token settings and make sure **Represents Character** is set to the NPC character sheet.

### The selected character is not an NPC

Open the character sheet and confirm it is configured as an NPC on the supported sheet.

### The card does not show spells

Make sure the NPC has spellcasting data on the NPC sheet. The **Spells** button only appears when the script can read usable spell data.

### Rolls are whispered or public unexpectedly

Use the speech-bubble button on the card. The setting is saved globally in `NPC Stat Block Settings`.

### Damage is not rolling the way you want

Use the **DMG** button.

Pick-damage mode gives Roll20's normal damage links. Full-damage mode includes damage directly in the roll output.

### The card is too large in chat

Switch to Combat Mode. Combat Mode keeps combat-relevant information visible while moving the full skill grid to the **Skills** button.

### Long text is cut off

Hover over the row. Long text is intentionally shortened on the card, and the full cleaned text is available in the tooltip.

### Condition markers are missing or wrong

Open the settings handout and review the Condition Marker mappings.

### The settings handout was deleted

Run the macro again. The script will recreate `NPC Stat Block Settings` with default settings.

### The macro behaves strangely after editing it in Roll20

Replace the entire macro from a clean copy of `NPC_Statblock_v5.5.0.scard`. For large ScriptCards macros, editing in an external editor and then pasting the whole script back into Roll20 is usually safer than making piecemeal edits in the Roll20 macro editor.

---

## Credits

Created by Timothy Beasley for Roll20 using ScriptCards.
