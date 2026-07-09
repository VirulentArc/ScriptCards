# Tim's NPC Stat Block Mod v5

A compact NPC stat block for Roll20 D&D 5E 2014 games, built with ScriptCards.

Select an NPC token, run the macro, and the script prints a Monster Manual-style stat block in chat with clickable buttons for checks, saves, skills, initiative, traits, actions, bonus actions, reactions, legendary actions, mythic actions, and spells.

The roll buttons use Roll20's normal 5E NPC roll templates, so the output looks and behaves like rolls made from the official 2014 NPC sheet.

---

## Requirements

- A Roll20 Pro game with Mod/API access.
- ScriptCards installed in the game.
- The official **D&D 5E 2014 by Roll20** character sheet.
- An NPC character sheet.
- A token linked to that NPC sheet.

This script is for the 2014 D&D 5E sheet. It is not designed for the 2024 Beacon sheet.

---

## Installation

1. Install ScriptCards in your Roll20 game.
2. Copy the full contents of `NPC_Statblock_v5.scard`.
3. In Roll20, open the **Collections** tab.
4. Create a new macro, such as `NPC-Statblock`.
5. Paste the full script into the macro.
6. Save the macro.
7. Select a token that represents an NPC character.
8. Run the macro.

The script is installed as a Roll20 macro. It is not a separate Mod/API script.

For updates, replace the entire macro with the newest full script. Large ScriptCards macros are easiest to maintain in an external editor, then copied into Roll20 as one complete block.

---

## Quick Start

1. Select one NPC token.
2. Run the `NPC-Statblock` macro.
3. Use the buttons in the stat block.

The macro will show an error message if no token is selected, more than one token is selected, the token is not linked to a character sheet, or the linked sheet is not an NPC.

---

## First Run

The first time the macro runs, it creates an archived handout named:

```text
NPC Stat Block Settings
```

This handout stores the stat block's shared settings, such as whisper mode, roll mode, damage mode, and Full/Combat mode.

Do not edit the GM Notes of this handout unless you are intentionally resetting or repairing the settings. If the handout is deleted, the script will recreate it the next time the macro runs.

---

## Full Mode and Combat Mode

The stat block has two display modes.

### Full Mode

Full Mode is the complete stat block view. It includes the NPC's core stats, ability buttons, save buttons, full skill grid, saving throw and skill summaries, combat defenses, senses, languages, challenge, proficiency bonus, traits, actions, bonus actions, reactions, legendary actions, mythic actions, and spell access when available.

Use Full Mode when you want the most complete version of the NPC entry.

### Combat Mode

Combat Mode is a tighter table-use view. It keeps the combat-relevant information visible while moving the full skill grid onto a separate **Skills** button.

Combat Mode still includes important combat traits. Traits are not hidden, because many NPC traits are rules-critical in combat.

Use Combat Mode when you want the card to stay smaller during play.

### Switching Modes

The mode button is in the lower-left area of the card.

The button text shows where it will go next:

- **Combat** means clicking it will switch to Combat Mode.
- **Full** means clicking it will switch to Full Mode.

The selected mode is saved in `NPC Stat Block Settings` and will be used the next time the macro runs.

---

## Card Controls

The lower-right buttons control how rolls behave.

### Whisper Button

The speech-bubble button toggles whether rolls are whispered to the GM.

- Whisper on: rolls are sent to the GM.
- Whisper off: rolls are public.

This setting is shared for the game.

### DMG Button

The **DMG** button controls attack damage output.

- Off / pick damage: attack rolls use Roll20's normal damage buttons or links.
- On / full damage: attack rolls include damage in the roll output automatically.

Use pick damage if you want to roll damage only after confirming a hit. Use full damage if you prefer attacks to include damage immediately.

### D / N / A Buttons

The **D**, **N**, and **A** buttons set the roll mode.

- **D** = disadvantage.
- **N** = normal.
- **A** = advantage.

Normal mode rolls one d20. Advantage and disadvantage use the normal Roll20 two-d20 sheet style.

---

## Reading the Stat Block

The card is designed to be compact. Long text is shortened on the visible row, but the full text is still available.

Hover over long traits, actions, reactions, bonus actions, legendary actions, mythic actions, and spell rows to see the full cleaned text in a tooltip.

The card can show:

- name and creature type;
- Armor Class;
- Hit Points and HP formula;
- speed;
- ability scores and modifiers;
- saving throw buttons;
- skill buttons;
- initiative;
- damage vulnerabilities, resistances, and immunities;
- condition immunities;
- senses;
- languages;
- Challenge Rating and XP;
- proficiency bonus;
- traits;
- actions;
- bonus actions;
- reactions;
- legendary actions;
- mythic actions;
- spells, when available.

Only sections with sheet data are shown.

---

## Rolling from the Card

Most buttons roll using Roll20's official 5E NPC templates.

### Ability Checks and Saving Throws

Click an ability score button to roll an ability check. Click the **save** button below an ability to roll that ability's saving throw.

If the NPC has a listed saving throw bonus on the sheet, the save button uses that listed bonus. Otherwise it uses the ability modifier.

### Skills and Initiative

In Full Mode, skill buttons appear directly on the main card.

In Combat Mode, click **Skills** to open a separate skill card.

Initiative uses the NPC's initiative bonus when one is present. If the sheet does not have a separate initiative bonus, it uses the Dexterity modifier. Initiative rolls also update the turn tracker for the selected token.

### Actions

Attack actions use native NPC attack roll output.

Non-attack actions use the sheet's own action button. They still appear on the stat block, and their full text is available by hovering over the row.

### Traits

Traits appear in both Full Mode and Combat Mode. This is intentional. Many NPC traits are important during combat, such as Magic Resistance, Legendary Resistance, Pack Tactics, Regeneration, or sunlight-related weaknesses.

Trait buttons use the sheet's own output.

---

## Spells

If the NPC has spellcasting data, the card shows a **Spells** button.

Click **Spells** to open a spell list card. Spells are grouped by level:

- Cantrips.
- Level 1 through Level 9.

Spell rows show the spell name and a compact description. Hover over a spell row to see details such as school, casting time, range, target, components, ritual or concentration tags, duration, innate text, description, and higher-level text.

When the sheet supports it, spell rows can include buttons to cast the spell or show the spell description using the sheet's normal output.

This script displays and rolls NPC spells. It does not manage spell slots or spell preparation.

---

## Shared Settings

The script stores these settings in the `NPC Stat Block Settings` handout:

| Setting | What it controls |
| --- | --- |
| Whisper | Whether rolls are public or whispered to the GM. |
| Roll mode | Disadvantage, normal, or advantage. |
| Damage mode | Pick damage or full damage. |
| Display mode | Full Mode or Combat Mode. |

These settings are shared in the game. If one user changes the mode or roll setting, the next card uses that saved setting.

---

## What the Script Changes

The script reads the selected NPC sheet and displays a chat card.

It does not rewrite the NPC's stat block.

To keep sheet-style buttons consistent with the card controls, the script may update the selected NPC sheet's normal whisper and damage roll settings. This is the same kind of setting changed by the 5E sheet's own whisper and damage controls.

---

## Updating from Older Versions

Older versions of this project used a ScriptCards template mule and a custom stat block template. Version 5 no longer needs that setup.

You do not need:

- `ScriptCards_TemplateMule`
- `statblockv4`
- stored ScriptCards templates
- `!sc-reloadtemplates`

You can leave old template mule material in your game if other scripts still use it, but this NPC Stat Block script no longer depends on it.

The old separate classic-roll button has also been removed. The **D**, **N**, and **A** buttons now control the native/classic-style roll mode directly.

---

## Troubleshooting

### No token is selected

Select exactly one NPC token, then run the macro again.

### More than one token is selected

Deselect the extra tokens. The macro only works with one selected token at a time.

### The token is not linked to a character sheet

Open the token settings and make sure **Represents Character** is set to the NPC character sheet.

### The selected character is not an NPC

Open the character sheet and make sure it is configured as an NPC on the official D&D 5E 2014 sheet.

### The card does not show spells

Make sure the NPC has spellcasting data on the NPC sheet. The **Spells** button only appears for NPCs with spell data the script can read.

### Rolls are whispered or public unexpectedly

Use the speech-bubble button on the card. The setting is saved globally in `NPC Stat Block Settings`.

### Damage is not rolling the way you want

Use the **DMG** button.

Pick-damage mode gives Roll20's normal damage links. Full-damage mode includes damage directly in the roll output.

### The card is too large in chat

Switch to Combat Mode. Combat Mode keeps combat-useful information, including traits, but moves the full skill grid behind the **Skills** button.

### Long text is cut off

Hover over the row. Long text is intentionally shortened on the card, and the full text is available in the tooltip.

### The settings handout was deleted

Run the macro again. The script will recreate `NPC Stat Block Settings` with default settings.

### The macro behaves strangely after editing it in Roll20

Replace the entire macro from a clean copy of `NPC_Statblock_v5.scard`. For large ScriptCards macros, editing in an external editor and then pasting the whole script back into Roll20 is usually safer than making piecemeal edits in the Roll20 macro editor.

---

## Credits

Created by Timothy Beasley for Roll20 D&D 5E 2014 games using ScriptCards.
