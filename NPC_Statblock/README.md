# Tim's NPC Stat Block Mod v5

Tim's NPC Stat Block Mod v5 is a ScriptCards macro for Roll20 D&D 5E 2014 games. It displays a compact, Monster Manual-style NPC stat block in chat from a selected NPC token, with clickable buttons for ability checks, saving throws, skills, initiative, NPC actions, traits, reactions, bonus actions, legendary actions, mythic actions, and spells.

The current version no longer uses a ScriptCards template mule. You do **not** need `ScriptCards_TemplateMule`, `statblockv4`, stored ScriptCards templates, or `!sc-reloadtemplates` for this script.

The script builds its own card layout directly in ScriptCards and uses the official 5E NPC roll templates for rolls, so the roll output looks and behaves like normal Roll20 sheet rolls instead of old custom ScriptCards roll rows.

---

## Requirements

- A Roll20 Pro account with Mod/API access.
- ScriptCards installed in the game.
- The official **D&D 5E 2014 by Roll20** character sheet.
- A token linked to an NPC character sheet.
- The script installed as a Roll20 macro or character ability.

This script is built for the 2014 Roll20 D&D 5E sheet attributes, such as `npc_name`, `npc_ac`, `npc_action`, `npcspellcastingflag`, and the repeating NPC action/spell sections. It is not intended for the 2024 Beacon sheet.

---

## Installation

1. Install ScriptCards in your Roll20 game.
2. Copy the full `NPC_Statblock_v5.scard` script.
3. Create a new Roll20 macro, for example `NPC-Statblock`.
4. Paste the full script into the macro.
5. Save the macro.
6. Select a token linked to an NPC character sheet.
7. Run the macro.

The script is installed as a macro. It is not a separate Mod/API script.

Updating the macro through Roll20's in-game macro editor can sometimes introduce formatting issues in large ScriptCards macros. The safest update method is to edit the file in an external editor, then replace the full macro contents in Roll20.

---

## No Template Mule Required

Older versions of this project used a ScriptCards template mule and a custom stat block template. The current version does not.

You do **not** need to create, maintain, or reload:

- `ScriptCards_TemplateMule`
- `statblockv4`
- `overridetemplate`
- `StyleSaveResult`
- `!sc-reloadtemplates`

The stat block is now assembled directly inside the script. This makes setup simpler and avoids template reload problems.

---

## First Run

On first run, the script creates an archived handout named:

```text
NPC Stat Block Settings
```

That handout stores global NPC Stat Block settings in GM Notes. The settings currently include:

```text
whisper=1
advantage=normal
autodamage=pick
```

Do not manually edit the GM Notes unless you are intentionally resetting or repairing the stored settings.

If the settings handout is deleted, the script will recreate it the next time the macro runs.

---

## Basic Use

1. Select one token.
2. Make sure the token represents an NPC character sheet.
3. Run the macro.
4. Use the buttons in the generated stat block.

The script will stop with a clear message if:

- no token is selected;
- more than one token is selected;
- the selected token is not linked to a character sheet;
- the linked character is not marked as an NPC.

---

## Top Controls

The top-right controls on the stat block are global settings. Clicking one updates the settings handout and immediately rebuilds the card.

### Whisper Button

The speech-bubble button toggles whether native rolls are whispered to the GM.

- Whisper on: rolls are sent with `/w gm`.
- Whisper off: rolls are public.

The script also syncs the NPC sheet's `wtype` attribute so native sheet-style rolls follow the same whisper mode.

### DMG Button

The **DMG** button toggles action damage behavior.

- Off / pick mode: action attack rolls use the NPC attack template with Roll20's normal damage buttons/links.
- On / full mode: action attack rolls include damage directly in the roll output.

The script also syncs the NPC sheet's `dtype` attribute to match the selected damage mode.

### D / N / A Buttons

The **D**, **N**, and **A** buttons control roll mode:

- **D** = disadvantage.
- **N** = normal roll.
- **A** = advantage.

Normal mode intentionally rolls one d20. Advantage and disadvantage roll two d20s in the normal Roll20 sheet style.

The old separate classic-roll button has been removed. The D/N/A buttons now use the classic/native roll style.

---

## What the Stat Block Shows

The main card includes:

- NPC name and type.
- Armor Class.
- Hit Points and HP formula.
- Speed.
- Ability scores and modifiers.
- Saving throw buttons.
- Skill buttons, including initiative.
- Saving throw summary, if the NPC has save bonuses.
- Skill summary, if the NPC has skill bonuses.
- Damage vulnerabilities, resistances, and immunities.
- Condition immunities.
- Senses.
- Languages.
- Challenge Rating and XP.
- Traits.
- Actions.
- Legendary Actions.
- Mythic Actions.
- Bonus Actions.
- Reactions.
- Spell list button, if the NPC has spellcasting data.

Long action, trait, and spell text is displayed in a compact single-line row with a tooltip. Hover over the row to see the full cleaned text.

---

## Rolls

The script builds native Roll20 5E NPC roll output instead of custom ScriptCards roll rows.

### Ability Checks, Saving Throws, Skills, and Initiative

These use the `&{template:npc}` template.

The roll output includes:

- the NPC name flag;
- the roll name;
- the displayed modifier;
- the main d20 roll;
- normal, advantage, or disadvantage mode;
- the roll type.

Initiative also updates the turn tracker for the selected token. The tracker value uses the selected roll result, including advantage or disadvantage when enabled.

### NPC Actions

Attack actions use native NPC roll templates.

- Pick-damage mode uses `&{template:npcatk}`.
- Full-damage mode uses `&{template:npcaction}`.

The action button uses the repeating NPC action data from the sheet, including attack bonus, damage, damage types, and crit fields when available.

### Traits and Non-Attack Entries

Traits and non-attack entries use sheet buttons when there is no attack roll to rebuild. Their row still appears in the compact stat block, with the full description available in the tooltip.

---

## Spells

If the NPC has spellcasting data, the main card shows a **Spells** button.

The spell card lists spells by level:

- Cantrips.
- Level 1 through Level 9 spells.

Each spell row shows a compact spell name and description. Hover over the row to see spell details such as:

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

Spell rows can include sheet buttons for casting and description output when the sheet row supports them.

---

## Settings Handout

The settings handout is named:

```text
NPC Stat Block Settings
```

It is archived automatically and stores settings in GM Notes. The current stored settings are:

| Setting | Values | Purpose |
| --- | --- | --- |
| `whisper` | `0` or `1` | Controls whether rolls are public or whispered to the GM. |
| `advantage` | `normal`, `advantage`, `disadvantage` | Controls D/N/A roll mode. |
| `autodamage` | `pick` or `full` | Controls whether action damage is picked from links or included automatically. |

The handout may also contain an internal native roll skeleton after the `!NSBTEMPLATE!` marker. That text is used by the script and should not be edited manually.

---

## Sheet Attributes Touched by the Script

The script mostly reads the selected NPC sheet. It intentionally writes only these sheet attributes when syncing global settings:

| Attribute | Purpose |
| --- | --- |
| `wtype` | Matches the script's whisper setting. |
| `dtype` | Matches the script's damage setting. |

The script does not write stat block data back to the character sheet.

---

## Troubleshooting

### The macro says no token is selected

Select exactly one token before running the macro.

### The macro says the token is not linked to a character sheet

Open the token settings and make sure **Represents Character** points to the NPC character.

### The macro says the selected character is not an NPC

Open the character sheet and make sure it is configured as an NPC on the D&D 5E 2014 sheet.

### Rolls are whispered or public unexpectedly

Use the speech-bubble button in the top-right controls. The setting is global and stored in the `NPC Stat Block Settings` handout.

### Damage output is not what you expect

Use the **DMG** button in the top-right controls.

- Off / pick mode gives normal Roll20 damage links.
- On / full mode includes damage directly in the roll output.

### The title wraps strangely

The current layout uses a compact floated control bar beside the NPC name. Very long NPC names can still wrap, but the layout is tuned so the controls stay beside the first title line and the remaining name wraps below.

### I deleted the settings handout

Run the macro again. The script will recreate `NPC Stat Block Settings` with default settings.

---

## Updating

To update the script:

1. Open the current `NPC_Statblock_v5.scard` source.
2. Copy the full file contents.
3. Open the Roll20 macro that contains the old version.
4. Replace the entire macro with the new source.
5. Save the macro.
6. Run it once as the GM to confirm the settings handout still loads.

Existing settings are stored in `NPC Stat Block Settings`, so replacing the macro does not normally reset whisper, roll mode, or damage mode.

---

## Notes for Older Versions

If you are updating from an older template-mule version:

- You can leave `ScriptCards_TemplateMule` in the game, but this script no longer uses it.
- You do not need to reload templates.
- You do not need the old `statblockv4` template.
- The old classic-roll button is gone.
- D/N/A now control the native/classic-style roll mode directly.
- Rolls are built to match the Roll20 5E NPC sheet templates instead of ScriptCards custom roll formatting.

---

## Credits

Created by Timothy Beasley for Roll20 D&D 5E 2014 games using ScriptCards.
