# Tim's NPC Stat Block Mod v5

A Roll20 ScriptCards macro for displaying D&D 5E 2014 NPCs as compact, Monster Manual-style stat blocks in chat.

The card gives the GM a clean NPC reference with clickable ability checks, saving throws, skills, actions, traits, reactions, legendary actions, mythic actions, and spells. Rolls are built to use Roll20's native 2014 D&D 5E NPC roll templates instead of custom ScriptCards roll output.

## Features

- Monster Manual-style NPC stat block layout.
- One-click ability checks, saving throws, skill checks, initiative, and attacks.
- Native Roll20 NPC roll templates for rolls.
- Normal, advantage, and disadvantage roll modes from the stat block header.
- Whisper-to-GM toggle for NPC rolls.
- Damage mode toggle:
  - **DMG off / pick mode**: rolls the attack and leaves native Roll20 damage and crit buttons available.
  - **DMG on / full mode**: rolls attack and damage together.
- Initiative button support, including turn tracker update for the selected token.
- Action, bonus action, reaction, legendary action, mythic action, and trait sections.
- Tooltips for traits, attacks, and spell descriptions.
- Spell list button when NPC spellcasting data is present.
- Quick skill button grid at the bottom of the card.
- Persistent global settings stored in a hidden handout.

## Requirements

- Roll20 Pro account with Mod/API access.
- ScriptCards installed in the game.
- The official **D&D 5E 2014 by Roll20** character sheet.
- A character named exactly:

```text
ScriptCards_TemplateMule
```

The template mule name is case-sensitive.

ScriptCards 3.0.23d or newer is recommended.

## Compatibility

This script is designed for the official Roll20 D&D 5E 2014 sheet and its NPC attributes/repeating sections.

It is not intended for the D&D 2024 sheet, Beacon sheets, or non-Roll20 5E sheets without modification.

## Installation

1. Install **ScriptCards** in your Roll20 game.
2. Create a character named exactly `ScriptCards_TemplateMule`.
3. Create a new Roll20 macro, for example `NPC-Statblock`.
4. Copy the full contents of `NPC_Statblock_v5.scard` into the macro.
5. Select a token that represents a linked NPC character sheet.
6. Run the macro.
7. On first run, the script writes its `statblockv4` display template to `ScriptCards_TemplateMule` and asks you to run it again.
8. Run the macro again with the NPC token selected to display the stat block.

For best results, edit the `.scard` file outside Roll20 and paste the full script into the macro as plain text.

## Updating

To update the script, replace the contents of your Roll20 macro with the newest `NPC_Statblock_v5.scard` file.

Your existing settings handout can usually stay in place. The script stores its persistent settings in:

```text
NPC Stat Block Settings
```

If the visual template ever needs to be regenerated, delete the `statblockv4` ability from `ScriptCards_TemplateMule` and run the macro once. The script will recreate the template ability and reload ScriptCards templates.

## Usage

1. Select exactly one NPC token.
2. Make sure the token represents a linked NPC character sheet.
3. Run the macro.
4. Use the buttons in the stat block to roll checks, saves, skills, attacks, initiative, and spells.

The script will stop with a clear message if:

- no token is selected;
- more than one token is selected;
- the selected token is not linked to a character sheet;
- the selected character is not marked as an NPC;
- `ScriptCards_TemplateMule` does not exist.

## Header Controls

The stat block header includes compact controls for common roll settings.

### Whisper Toggle

The speech icon toggles whether generated NPC rolls whisper to the GM.

When whispering is enabled, the script also syncs the selected NPC sheet's native `wtype` value so Roll20's clicked native damage buttons continue to whisper correctly.

### DMG Toggle

The **DMG** button toggles damage behavior.

- **DMG off** uses Roll20's native attack template with clickable damage and crit buttons.
- **DMG on** uses a native NPC action roll that includes damage immediately.

The script also syncs the selected NPC sheet's native `dtype` value so Roll20's sheet damage behavior matches the current stat block setting.

### D / N / A Buttons

These set roll mode for generated rolls:

- **D**: disadvantage
- **N**: normal roll
- **A**: advantage

Normal mode intentionally rolls one d20.

## What the Script Writes

The script uses a small amount of Roll20 storage so it can function consistently.

It may create or update:

- `ScriptCards_TemplateMule`, ability `statblockv4`
- archived handout `NPC Stat Block Settings`
- selected NPC sheet attributes `wtype` and `dtype`

The `wtype` and `dtype` writes are used only to keep native Roll20 damage buttons aligned with the stat block's whisper and damage settings.

The script does not rewrite NPC stat blocks, actions, spells, traits, or monster data.

## Spell Support

If the NPC has spellcasting data, the card can show a **Spells** button.

The spell view groups spells by level and shows concise rows with tooltip details including school, casting time, range, target, components, duration, concentration, ritual status, description, and higher-level text when available.

Spell buttons use the native sheet spell outputs where possible.

## Troubleshooting

### The script says `ScriptCards_TemplateMule` is missing

Create a character named exactly:

```text
ScriptCards_TemplateMule
```

The name is case-sensitive.

### The first run only initializes styles

That is expected. The first run creates the `statblockv4` template ability on `ScriptCards_TemplateMule`. Run the macro again after that setup message.

### I do not see whispered damage after clicking Roll20 damage buttons

Use the stat block's whisper toggle again, then roll the attack from the current card. The script syncs `wtype` on the selected NPC so native Roll20 damage buttons follow the current whisper setting.

### The wrong sheet type is selected

This script expects a token linked to a D&D 5E 2014 NPC sheet. It is not designed for PC sheets, 2024 sheets, or unlinked tokens.

### The card looks wrong after an update

Delete the `statblockv4` ability from `ScriptCards_TemplateMule`, then run the macro once to regenerate the template.

## Recommended Repository Files

A simple repository layout is enough:

```text
NPC_Statblock_v5.scard
README.md
```

Optional extras:

```text
CHANGELOG.md
images/
```

## Credits

Created by Timothy Beasley.

Built for Roll20, ScriptCards, and the official D&D 5E 2014 by Roll20 character sheet.

## License

Add your preferred license before publishing the repository.
