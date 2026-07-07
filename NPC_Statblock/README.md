# Tim's NPC Stat Block Mod v5

Tim's NPC Stat Block Mod v5 is a ScriptCards macro for Roll20 games using the official **D&D 5E 2014 by Roll20** character sheet. It creates a compact, Monster Manual-style NPC stat block in chat from a selected NPC token.

The card includes clickable controls for ability checks, saving throws, skills, initiative, traits, actions, bonus actions, reactions, legendary actions, mythic actions, and NPC spells. Rolls are built with the official Roll20 5E NPC roll templates, so the output looks and behaves like normal sheet rolls instead of custom ScriptCards roll rows.

The current version does **not** require a ScriptCards template mule. You do not need `ScriptCards_TemplateMule`, `statblockv4`, stored ScriptCards templates, or `!sc-reloadtemplates`.

---

## Requirements

- A Roll20 Pro account with Mod/API access.
- ScriptCards installed in the game.
- The official **D&D 5E 2014 by Roll20** character sheet.
- A token linked to an NPC character sheet.
- The script installed as a Roll20 macro or character ability.

This script is built for the 2014 Roll20 D&D 5E sheet attributes and repeating sections. It is not intended for the 2024 Beacon sheet.

---

## Installation

1. Install ScriptCards in your Roll20 game.
2. Copy the full `NPC_Statblock_v5.scard` source.
3. Create a new Roll20 macro, such as `NPC-Statblock`.
4. Paste the full script into the macro.
5. Save the macro.
6. Select a token linked to an NPC character sheet.
7. Run the macro.

The script is installed as a macro. It is not a separate Mod/API script.

For best results, edit the source in an external editor and replace the entire Roll20 macro when updating. Large ScriptCards macros can be damaged by partial edits or accidental formatting changes in Roll20's in-game editor.

---

## First Run

On first run, the script creates an archived handout named:

```text
NPC Stat Block Settings
```

That handout stores the script's global settings in GM Notes. The default settings are:

```text
whisper=1
advantage=normal
autodamage=pick
basics=show
abilities=show
stats=hide
traits=show
skills=show
actions=show
bonusactions=show
reactions=show
legendary=show
mythic=show
```

Do not manually edit the GM Notes unless you are intentionally resetting or repairing the stored settings.

If the settings handout is deleted, the script will recreate it the next time the macro runs.

---

## Basic Use

1. Select exactly one token.
2. Make sure the token represents an NPC character sheet.
3. Run the macro.
4. Use the buttons in the generated stat block.

The script stops with a clear message if:

- no token is selected;
- more than one token is selected;
- the selected token is not linked to a character sheet;
- the linked character is not marked as an NPC.

---

## Card Layout

The stat block is divided into collapsible sections. Click the small `+` or `−` button beside a divider to show or hide that section. Section visibility is saved in the `NPC Stat Block Settings` handout and persists between uses.

The card can display:

- NPC name and creature type.
- Armor Class, Hit Points, HP formula, and Speed.
- Ability scores and ability check buttons.
- Saving throw buttons.
- Initiative and skill buttons.
- Saving throw and skill summaries.
- Damage vulnerabilities, resistances, and immunities.
- Condition immunities.
- Senses.
- Languages.
- Challenge Rating, XP, and Proficiency Bonus.
- Traits.
- Actions.
- Bonus Actions.
- Reactions.
- Legendary Actions.
- Mythic Actions.
- A spell list button when spell data is detected.

Long trait, action, and spell rows are displayed in a compact single-line format. Hover over the row to see the full cleaned text in the tooltip.

Empty repeating sections are not shown. For example, a Goblin will not show a Legendary Actions header just because Legendary Actions are enabled globally.

---

## Footer Controls

The footer contains the global roll controls. Clicking a footer control updates the settings handout and immediately rebuilds the card.

### Whisper Button

The speech-bubble button toggles whether native rolls are whispered to the GM.

- Whisper on: rolls are sent with `/w gm`.
- Whisper off: rolls are public.

When this setting changes, the script also syncs the NPC sheet's `wtype` attribute so native sheet-style rolls follow the same whisper mode.

### DMG Button

The **DMG** button toggles action damage behavior.

- **Pick mode** uses Roll20's normal attack template and damage links.
- **Full mode** includes damage directly in the roll output.

When this setting changes, the script also syncs the NPC sheet's `dtype` attribute.

### D / N / A Buttons

The **D**, **N**, and **A** buttons control roll mode:

- **D** = disadvantage.
- **N** = normal roll.
- **A** = advantage.

Normal mode rolls one d20. Advantage and disadvantage roll two d20s using the normal Roll20 sheet style.

The old separate classic-roll button is no longer used. The D/N/A buttons now control the native/classic-style roll output directly.

---

## Rolls

The script builds native Roll20 5E NPC roll output.

### Ability Checks, Saving Throws, Skills, and Initiative

Ability checks, saving throws, skills, and initiative use the `&{template:npc}` template.

The roll output includes:

- the NPC name flag;
- the roll name;
- the displayed modifier;
- the d20 roll;
- normal, advantage, or disadvantage mode;
- the roll type.

Initiative also updates the turn tracker for the selected token. If advantage or disadvantage is enabled, the tracker uses the selected result.

### NPC Actions

NPC attacks are rebuilt into native Roll20 NPC attack output.

- Pick-damage mode uses `&{template:npcatk}`.
- Full-damage mode uses `&{template:npcaction}`.

Attack buttons use data from the repeating NPC action row, including attack bonus, damage, damage types, and crit fields when available.

Non-attack actions, traits, and other description-only entries use sheet buttons when there is no attack roll to rebuild.

---

## Spells

If the NPC has spell data detected by the script, the footer shows a **Spells** button.

The spell card lists spells by level:

- Cantrips.
- Level 1 through Level 9 spells.

Each spell row shows a compact spell name and description. Hover over a spell row to see details such as:

- school;
- casting time;
- range;
- target;
- components;
- ritual and concentration flags;
- duration;
- innate text;
- spell description;
- higher-level text.

When the underlying sheet row supports it, spell rows include sheet buttons for casting and description output.

---

## Settings Handout

The settings handout is named:

```text
NPC Stat Block Settings
```

It is archived automatically and stores global settings in GM Notes.

| Setting | Values | Purpose |
| --- | --- | --- |
| `whisper` | `0`, `1` | Controls whether rolls are public or whispered to the GM. |
| `advantage` | `normal`, `advantage`, `disadvantage` | Controls D/N/A roll mode. |
| `autodamage` | `pick`, `full` | Controls whether action damage is picked from links or included automatically. |
| `basics` | `show`, `hide` | Shows or hides Armor Class, Hit Points, and Speed. |
| `abilities` | `show`, `hide` | Shows or hides ability score buttons. |
| `stats` | `show`, `hide` | Shows or hides saving throw summaries, skill summaries, defenses, senses, languages, challenge, XP, and proficiency bonus. |
| `traits` | `show`, `hide` | Shows or hides traits. |
| `skills` | `show`, `hide` | Shows or hides initiative and skill buttons. |
| `actions` | `show`, `hide` | Shows or hides actions. |
| `bonusactions` | `show`, `hide` | Shows or hides bonus actions. |
| `reactions` | `show`, `hide` | Shows or hides reactions. |
| `legendary` | `show`, `hide` | Shows or hides legendary actions. |
| `mythic` | `show`, `hide` | Shows or hides mythic actions. |

Older versions may have stored template data after a `!NSBTEMPLATE!` marker. The current script does not use that template data and cleans it from the settings handout when found.

---

## Sheet Attributes Touched by the Script

The script mostly reads the selected NPC sheet. It intentionally writes only these character sheet attributes when syncing global settings:

| Attribute | Purpose |
| --- | --- |
| `wtype` | Matches the script's whisper setting. |
| `dtype` | Matches the script's damage setting. |

Initiative rolls can also update the Roll20 turn tracker for the selected token.

The script does not write stat block data, actions, traits, spells, ability scores, skills, or saving throws back to the character sheet.

---

## Updating

To update the script:

1. Open the current `NPC_Statblock_v5.scard` source.
2. Copy the full file contents.
3. Open the Roll20 macro that contains the old version.
4. Replace the entire macro with the new source.
5. Save the macro.
6. Run it once as the GM to confirm the card loads.

Existing settings are stored in `NPC Stat Block Settings`, so replacing the macro does not normally reset whisper, roll mode, damage mode, or collapsed section states.

---

## Updating from Older Template-Mule Versions

Older versions of this project used a ScriptCards template mule and a custom stat block template. The current version does not.

You can leave old template mule characters in your game, but this script no longer uses:

- `ScriptCards_TemplateMule`
- `statblockv4`
- `overridetemplate`
- `StyleSaveResult`
- `!sc-reloadtemplates`

Other important changes from older versions:

- The card layout is built directly inside the script.
- Rolls are built using native Roll20 5E NPC templates.
- The old classic-roll button has been removed.
- D/N/A now control native/classic-style roll mode directly.
- Section collapse states are saved in the settings handout.
- Empty action sections are checked and skipped instead of being shown as blank headers.

---

## Troubleshooting

### The macro says no token is selected

Select exactly one token before running the macro.

### The macro says the token is not linked to a character sheet

Open the token settings and make sure **Represents Character** points to the NPC character.

### The macro says the selected character is not an NPC

Open the character sheet and make sure it is configured as an NPC on the D&D 5E 2014 sheet.

### Rolls are whispered or public unexpectedly

Use the speech-bubble button in the footer controls. The setting is global and stored in the `NPC Stat Block Settings` handout.

### Damage output is not what you expect

Use the **DMG** button in the footer controls.

- Pick mode gives normal Roll20 damage links.
- Full mode includes damage directly in the roll output.

### A section is missing

The section may be collapsed, or the selected NPC may not have any rows for that section. Empty repeating sections are not displayed.

### The Spells button is missing

The script only shows the **Spells** button when it detects spell data on the selected NPC sheet. Confirm the NPC is using the 2014 sheet's NPC spellcasting fields and repeating spell rows.

### The title wraps strangely

Very long NPC names may wrap. The title size adjusts for longer names, but extremely long names may still use more than one line.

### The settings handout was deleted

Run the macro again. The script will recreate `NPC Stat Block Settings` with default settings.

### The API console is very noisy or the script is slower than expected

Make sure the release copy has debug and benchmarking turned off near the top of the script:

```text
--#functionbenchmarking|0
--#Debug|0
```

These options are useful while testing but should be off for normal play.

---

## Credits

Created by Timothy Beasley for Roll20 D&D 5E 2014 games using ScriptCards.
