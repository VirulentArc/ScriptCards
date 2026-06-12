# Spell Book Manager

Spell Book Manager is a ScriptCards utility for Roll20 D&D 5E 2014 games. It lets a GM maintain one or more spell mule characters and lets players copy approved spells from those mules onto their own character sheets.

Spell Book Manager can also manage assigned spell book characters, copy spells between spell mule characters, add spells to NPC sheets, and move a character's existing leveled spells up or down between spell levels. The move feature is especially useful for Warlocks and other cases where the same spell may need to live at a different slot level.

The script is designed for the official D&D 5E 2014 by Roll20 character sheet and works with normal PC spell rows. NPC support is available through the GM-only NPC Spell Manager.

---

## Requirements

- A Roll20 Pro account with Mod/API access.
- ScriptCards installed.
- ScriptCards 3.0.22 or newer is required. If Roll20 One-Click has an older ScriptCards version, install ScriptCards manually before using Spell Book Manager.
- The official D&D 5E 2014 by Roll20 character sheet.
- One or more spell mule characters whose names begin with `SBM_`.

### Installing ScriptCards

If the Roll20 One-Click version of ScriptCards is 3.0.22 or newer, install it from **Game Settings** > **Mod Scripts** > **Script Library**.

If Roll20 One-Click has an older version, install ScriptCards manually from the [ScriptCards GitHub repository](https://github.com/kjaegers/ScriptCards):

1. Open the [ScriptCards_API folder](https://github.com/kjaegers/ScriptCards/tree/main/ScriptCards_API).
2. Open `scriptcards.js`.
3. Copy the full script code.
4. In Roll20, open **Game Settings** > **Mod Scripts**.
5. Create a new script, paste the ScriptCards code, save it, and restart the Mod sandbox if needed.

---

## Getting Spell Book Manager

Spell Book Manager is installed as a Roll20 macro, not as a separate Mod/API script. The file you need is `Spell_Book_Manager.scard`.

The latest version is available in the [Spell Book Manager folder on GitHub](https://github.com/VirulentArc/ScriptCards/tree/main/Spell%20Book%20Manager).

To copy the script:

1. Open the [raw `Spell_Book_Manager.scard` file](https://raw.githubusercontent.com/VirulentArc/ScriptCards/refs/heads/main/Spell%20Book%20Manager/Spell_Book_Manager.scard).
2. Select all of the text on the page.
3. Copy the selected text.
4. Paste that full text into the Roll20 macro created in the Installation steps below. Paste as plain text when possible, such as with **Ctrl+Shift+V**.

If you open the normal GitHub preview page instead, click **Raw** before copying. The raw page is the safest way to make sure you only copy the script text.

---

## Installation

1. Install ScriptCards in your Roll20 game.
2. Copy the full `Spell_Book_Manager.scard` script from the raw GitHub source.
3. Create a new Macro named `Spell-Book-Manager`.
4. Paste the full Spell Book Manager script into that macro.
5. Run the script once as the GM.
6. On first run, the script will create these handouts automatically:
   - `Spell Book Manager Settings`
   - `Spell Book Manager [PlayerID]`

The settings handout stores GM configuration. The player-specific handout is used to display spell descriptions when the spell description button is clicked.

The first time each player runs the script, a new `Spell Book Manager [PlayerID]` handout will be created.<br>
All automatically created handouts are archived so they do not interfere with game journals.<br>
![Installation handouts](images/handouts.png)

GMs will see a string of characters in the GM Notes of the handouts. Do not manually edit the GM Notes. That text is a JSON string that stores spell mule assignment information and player theme information.<br>
![Settings JSON](images/JSON.png)

---

## First Run as the GM

After installation, run the `Spell-Book-Manager` macro once as the GM.

On first run, Spell Book Manager creates the handouts it needs:

- `Spell Book Manager Settings`
- `Spell Book Manager [PlayerID]`

The settings handout stores GM configuration. The player-specific handout is used to display formatted spell descriptions when the spell description button is clicked.

The first time each player runs the script, Spell Book Manager creates that player's own `Spell Book Manager [PlayerID]` handout.

All automatically created handouts are archived so they do not clutter the Journal.

![Installation handouts](images/handouts.png)

GMs will see a string of characters in the GM Notes of the handouts. Do not manually edit the GM Notes. That text stores Spell Book Manager settings and player theme information.

![Settings JSON](images/JSON.png)

Some Spell Book Manager menus can be long. If Roll20 does not automatically jump to the newest menu after you click a button, manually scroll to the bottom of chat. Roll20 will sometimes stop auto-scrolling when the chat window is already scrolled upward.

---

## GM Main Card

After the first-run setup is complete, the GM main card is the starting point for Spell Book Manager setup and management.

From this card, the GM can:

- click a player character to manage that character
- click the settings button to open GM Settings
- click **NPC Spell Manager** to copy spells onto NPC sheets
- click **Copy Between Mules** to copy spells from one spell mule to another

![GM main card](images/gm_tools.png)

The sections below follow those buttons in the same general order a GM would use them while setting up the script.

---

## Spell Mule Characters

A spell mule is a normal Roll20 character sheet whose name begins with:

```text
SBM_
```

Examples:

```text
SBM_Wizard Spells
SBM_Cleric Spells
SBM_Xanathar Spells
SBM_Custom Warlock Spells
SBM_Gandalf's Spellbook
```

Put spells on the spell mule as normal spell rows at the correct spell level. Spell Book Manager reads those spell rows and offers them depending on how the mule is assigned or used.

`SBM_` spell mule characters can be used as:

- Class spell mules.
- Character-specific spell mules.
- Assigned spell books.
- GM-only Copy Between Mules sources or destinations.
- NPC Spell Manager spell sources.

The `SBM_` prefix is only for identifying Spell Book Manager spell mule characters. The prefix is removed from button display names inside the settings menu.

A spell mule assigned as a character's spell book should usually be treated as that character's personal spell book, not as a shared class mule.

---

## GM Settings

![GM Settings](images/gm_settings.png)

Click the settings button in the Spell Book Manager title bar to open settings.

GM Settings is where the GM configures how players get access to spells. The GM can manage:

- Class spell mule assignments.
- Character-specific spell mule assignments.
- Character spell book assignments.
- Custom class names.
- Theme selection.

Player settings only include theme selection. Only the GM sees class mule, character mule, spell book assignment, and custom class management options.

---

## Class Spell Mules

![Assigning Class Spell Mules](images/class_assigned.png)

Class Spell Mules are the normal way to give a class access to a spell list.

To assign spell mules by class:

1. Run Spell Book Manager as the GM.
2. Click the settings button.
3. Under **Class Spell Mules**, click a class.
4. Click an unassigned spell mule to assign it to that class.
5. Click an assigned spell mule to remove it from that class.

A character inherits spell mules from any matching class names found on their sheet, including multiclass fields.

After assigning or removing a class spell mule, use the back button in the Spell Book Manager menu to return to the class list before choosing another class. Do not scroll back to an older class list in chat and click a different class from there; Roll20 may not pass the new selection correctly from an older menu.

Large available spell mule lists use 0-9 and A-Z navigation so the GM does not need to scroll through every `SBM_` character at once.

![Class mule alphanumeric navigation](images/class_source_alpha_nav.png)

---

## Character Assignments

![Character-Specific Spell Mules](images/character_assigned.png)

Character Assignments let the GM adjust spell access for one specific player character.

To manage character-specific spell mules:

1. Run Spell Book Manager as the GM.
2. Click the settings button.
3. Click **Character Assignments**.
4. Choose a character.
5. Use the available, added, inherited, and blocked lists to control that character's spell mule access.

Only valid player character sheets are shown here. NPCs, `SBM_` spell mule characters, and ScriptCards mule characters are filtered out.

Character-specific mule settings can:

- Add an extra mule that the character does not inherit from class settings.
- Block an inherited class mule for that character.
- Remove a previously added mule.
- Unblock a previously blocked inherited mule.

Assigned spell books are kept out of the normal available spell mule lists so they are not accidentally assigned as shared spell mules.

---

## Spell Book Assignment

![Spell Book Assignment](images/spell_book_assignment.png)

Spell Book Assignment is reached from the Character Assignments card.

Use this when a character should have a separate `SBM_` character that acts as a personal spell book, preparation list, research list, or curated collection.

To assign a spell book to a character:

1. Run Spell Book Manager as the GM.
2. Click the settings button.
3. Click **Character Assignments**.
4. Choose a character.
5. Click **Spell Book Assignment**.
6. Choose one available `SBM_` character to use as that character's spell book.

![Available spell books](images/available_spell_books.png)

A character can have one assigned spell book. If a spell book is already assigned, the Spell Book Assignment page shows the assigned spell book instead of the available list. Click the assigned spell book to remove it, then choose a different one if needed.

For a wizard named Gandalf, for example, you could create an `SBM_Gandalf's Spellbook` character and assign that character as Gandalf's spell book. The player can then use **Copy to Spell Book** to add approved spells to that spell book, and the normal spell list can copy prepared or selected spells from the spell book onto Gandalf's actual character sheet.

Assigned spell books change how the character uses Spell Book Manager:

- **Copy to Spell Book** copies from approved spell mules into the assigned spell book.
- The normal spell list copies from the assigned spell book onto the actual character sheet.

---

## Custom Classes

![Custom classes](images/custom_classes.png)

The GM can add custom class names from the settings menu.

Use this if your game has a homebrew class, a sheet class name that is not part of the default class list, or a subclass that should have its own spell mule assignments.

Custom class entries are matched against the class and subclass names on a character's sheet. If the custom entry matches either a character's class or subclass, Spell Book Manager applies the mule assignments for that custom entry to that character.

For example, if the GM adds a custom class named `Eldritch Knight`, then assigns a spell mule to Eldritch Knight, characters with Eldritch Knight as their subclass can inherit that mule assignment the same way a character inherits assignments from a matching class name.

---

## Themes

![Theme selection](images/theme_selection.png)

Spell Book Manager includes multiple visual themes.

Current themes:

- 2014
- 2024
- AD&D2E
- Arcane
- Brasswork
- Eldritch
- Prismatic
- Radiant
- Verdant

Theme selection is stored per user. Players can choose their own display theme without changing the theme for other users.

---

## Copy Between Mules

![Copy Between Mules destination](images/copy_between_mules_destination.png)

**Copy Between Mules** is a GM-only tool reached from the GM main card. It copies spells from one active `SBM_` spell mule to another.

To use this tool:

1. Run Spell Book Manager as the GM.
2. On the GM main card, click **Copy Between Mules**.
3. Choose the destination mule.
4. Choose the mule to copy from.
5. Click **Copy to Mule** beside the spells you want to copy.

![Copy Between Mules mule to copy from](images/copy_between_mules_source.png)

The spell mule picker excludes the already-selected destination mule so the GM does not accidentally copy a mule into itself.

![Copy to Mule spell list](images/copy_to_mule_spell_list.png)

This is useful for building smaller campaign-specific, subclass-specific, or player-specific spell mules from larger spell mules.

---

## NPC Spell Manager

![NPC Spell Manager](images/npc_spell_manager.png)

**NPC Spell Manager** is a GM-only tool reached from the GM main card. It copies spells from active `SBM_` spell mules onto NPC sheets.

The NPC picker lists NPC sheets separately from player characters.

![NPC picker pagination](images/npc_picker_pagination.png)

To use this tool:

1. Run Spell Book Manager as the GM.
2. On the GM main card, click **NPC Spell Manager**.
3. Choose an NPC.
4. Choose a spell mule.
5. Click **Copy to Character** beside the spells you want to add to the NPC.

![NPC spell mule choice](images/npc_spell_source_choice.png)

When a spell is copied to an NPC, Spell Book Manager enables the NPC spellcasting flag if needed so the spell section can appear on the NPC sheet.

NPC Spell Manager is intended for the official D&D 5E 2014 NPC sheet. It is separate from normal player character assignment settings and does not use class assignments.

---

## Managing a Player Character as the GM

![Character options](images/choose_move.png)

When the GM clicks a player character from the GM main card, Spell Book Manager opens that character's management card.

The GM can usually see:

- **Choose Spells** to open the spell list for that character.
- **Move Spells** to move existing leveled spells on that character sheet.
- **Copy to Spell Book** if the character has an assigned spell book.

The GM can access Move Spells for any valid PC. Normal players only see Move Spells for Warlocks.

---

## Spell Lists and Copy Buttons

![Spell list](images/spell_choice.png)

The spell list is the shared spell-copying screen used by several parts of Spell Book Manager.

Players with most non-Warlock characters may go directly to the spell list after choosing their character. Warlocks and GMs may reach the same spell list by clicking **Choose Spells** from the character management card.

From the spell list, users can:

1. Click **Spell Description Handout** to open the Spell Book Manager handout.
2. Click the &#x1F56E; button beside a spell to write that spell's formatted description to the handout.
3. Click the copy button beside a spell.

The copy button text changes depending on where the spell list was opened from:

- **Copy to Character** copies a spell to a PC or NPC sheet.
- **Copy to Spell Book** copies a spell into an assigned spell book.
- **Copy to Mule** copies a spell into another spell mule.

Spell availability normally comes from two kinds of spell mule assignments:

1. Class spell mules assigned by the GM.
2. Character-specific spell mules assigned by the GM.

If more than one spell mule is available, Spell Book Manager shows a spell mule selection page before displaying the spell list. Users can choose **All Spells** or a specific assigned mule.

![Spell mule choice](images/spell_source_choice.png)

Spells are grouped by spell level and sorted alphabetically. If multiple assigned mules contain a spell with the same name at the same level, the spell is only shown once in the list.

If the character already knows a spell with the same name, Spell Book Manager marks that spell as **Already Known** instead of offering another copy button. The spell list may need to be refreshed before this status updates after a copy.

When a spell is copied, the script copies the full spell row to the destination sheet and preserves important spell text fields such as name, description, and At Higher Levels text.

### Characters with assigned spell books

If the selected character has an assigned spell book, the available spell list comes from that assigned spell book instead of the character's normal assigned spell mules. In that setup, the spell book acts as the character's curated or prepared spell list, and **Copy to Character** copies from the spell book onto the actual character sheet.

Use **Copy to Spell Book** to add spells into the assigned spell book first.

---

## Copy to Spell Book

![Copy to Spell Book button](images/copy_to_spell_book_button.png)

**Copy to Spell Book** appears when a character has a spell book assigned by the GM.

This feature is intended for characters that should maintain a separate spell book, preparation list, research list, or other curated personal spell collection.

For players, **Copy to Spell Book** allows copying from the character's approved spell mules into the assigned spell book. Players do not get unrestricted access to every `SBM_` spell mule.

For GMs, **Copy to Spell Book** can use any active `SBM_` spell mule as the spell mule list, while still copying into the selected character's assigned spell book.

To use Copy to Spell Book:

1. The GM assigns one `SBM_` character as the selected character's spell book.
2. The player or GM clicks **Copy to Spell Book** from the character options page.
3. The user chooses a spell mule list.
4. The user clicks **Copy to Spell Book** beside a spell.
5. The spell is copied into the assigned spell book character.
6. The character can then copy from that spell book onto their actual character sheet.

![Copy to Spell Book mule choice](images/copy_to_spell_book_source_choice.png)
![Copy spell into spell book](images/copy_to_spell_book_spell_list.png)

Only one spell book can be assigned to a character at a time.

---

## Move Spells

![Move Spells](images/move_spell.png)

**Move Spells** allows a character's existing leveled spells to be moved up or down one spell level at a time.

This is intended mainly for Warlocks or other special cases where spells need to be shifted between spell levels after they are already on the character sheet.

Notes:

- Cantrips cannot be moved.
- Level 1 spells cannot be moved down.
- Level 9 spells cannot be moved up.
- Non-GM players only see **Move Spells** if the selected character is a Warlock.
- GMs can access move mode for any valid PC.

When moving Warlock-style scaling spells, Spell Book Manager attempts to preserve the spell's original baseline level and adjust simple dice expressions when appropriate.

See **Custom Spell Notes** for suggestions about custom Warlock spells.

---

## Player Use

![Character choice](images/character_choice.png)

Players run Spell Book Manager from the macro bar or collections tab.

If the player controls more than one valid character, Spell Book Manager first asks which character to manage. If the player only controls one valid character, this step is skipped.

For most player characters, Spell Book Manager opens directly to the available spell list.

From the spell list, players can normally:

1. Click **Copy to Character** to copy a spell onto the character sheet.
2. Click the &#x1F56E; description button beside a spell to write that spell's formatted description to the Spell Book Manager handout.

If the character is a Warlock, Spell Book Manager shows a character options page first. From there, **Choose Spells** opens the spell list, and **Move Spells** allows existing spells on the character sheet to be moved between spell levels.

If the character has an assigned spell book, the character options page can also show **Copy to Spell Book**. This lets a player copy spells from their approved spell mules into the assigned spell book rather than directly onto the character.

Players only see spell mules approved by the GM through class assignments, character-specific assignments, or the character's assigned spell book setup.

---

## Spell Description Handout

![Spell Description Handout](images/handout.png)

The spell list includes a **Spell Description Handout** button. Clicking it opens the player's spell description handout.

Each spell has a &#x1F56E; description button. Clicking it writes the formatted spell description to that user's Spell Book Manager handout.

The handout updates live. If the handout is already open when a description button is clicked, the visible handout content should update after Roll20 refreshes the handout display.

The spell's **Class** field will appear in handouts when it is filled in. 2014 compendium spells often do not use this field, even though it is part of the D&D 5E 2014 spell card.

The spell's **Type** field will also appear in handouts when it is filled in. This is an extra field available in the spell settings and can be used however the GM finds useful.

---

## Spell List Size and Roll20 Performance

Avoid putting too many spells on a single character sheet.

This includes player characters, NPCs, spell mule characters, and assigned spell book characters. `SBM_` spell mules are still character sheets, and very large spell lists can make Roll20 slower or less reliable.

There is no exact universal spell limit. Some sheets may work fine with a large number of spells, while others may slow down or behave unpredictably depending on browser, computer, campaign size, and overall sheet data.

For best results, do not create one giant spell mule containing every spell in the game. Split large spell libraries into smaller `SBM_` spell mules, such as class-based, sourcebook-based, subclass-based, player-specific, or campaign-specific spell mules.

If a character sheet or spell mule starts loading slowly, failing to update correctly, or behaving strangely, reduce the number of spell rows on that sheet.

---

## Important Notes

Only one GM should edit Spell Book Manager settings at a time. The settings are stored in a shared handout, and simultaneous writes can overwrite or confuse each other.

Do not manually edit the GM Notes of the Spell Book Manager handouts. The GM Notes contain JSON strings that store settings.

Assigned spell books are still `SBM_` character sheets. They count toward Roll20 sheet size and performance the same way other spell mules do.

Do not reuse old menu cards in chat after changing settings. Use the current card, or go back through the current menu, so the script receives the correct selection.

---

## Custom Spell Notes

Custom spells that put their own damage or upcast rolls directly in the spell description should not also use the sheet's normal At Higher Levels/upcast fields unless that behavior is intentional.

If the spell description already contains a custom scaling roll, make sure **At Higher Levels** and any higher-level damage fields are blank. Otherwise, Roll20's normal upcast behavior may run in addition to the custom roll in the description.

For custom description-roll spells:

1. Create the spell manually from a blank spell row.
2. Set the spell output type as needed.
3. Leave **At Higher Levels** blank unless you want the sheet's normal upcast behavior.
4. Put the complete custom roll directly in the spell description.
5. If the custom roll needs to scale by spell level, use `@{spelllevel}` as the default/current level reference instead of hard-coding a default level.

For custom Warlock spells that place their damage roll directly in the spell description, make sure **At Higher Levels** and higher-level damage fields are blank unless you intentionally want Roll20's normal upcast behavior to run as well.

Custom spells may produce an API console error when their description is written to the handout. This is unavoidable with some custom spell content and does not necessarily mean the spell failed to copy.

### Example: Hellish Rebuke Warlock scaling

```text
A creature that damaged you is momentarily surrounded by hellish flames. The creature must make a Dexterity saving throw. It takes [[[[@{spelllevel}+1]]d10]] [[[@{spelllevel}+1]]d10] fire damage on a failed save, or half as much damage on a successful one.
```

The exact spell text can be adjusted, but the important part is using `@{spelllevel}` rather than hard-coding one slot level.

---

## Troubleshooting

### No characters appear

Make sure the character is a PC, not an NPC, and that the character sheet has normal class attributes. For normal players, the character must be controlled by that player. For GMs, all valid PCs should appear.

Spell Book Manager excludes NPCs, `SBM_` spell mules, and ScriptCards mule characters from the normal player character picker.

Characters controlled by **All Players** are not shown in the available character list for character-specific settings. Assign the character to specific players if it needs character-specific Spell Book Manager settings.

### No spell mules are assigned

Open settings as the GM and assign one or more `SBM_` spell mules to the character's class or directly to the character.

### A spell mule does not appear in an available spell mule list

Make sure the character name begins with `SBM_`.

If the mule is assigned as a character's spell book, it is intentionally removed from normal available spell mule lists so it is not accidentally assigned as a shared source.

### The spell list only shows the assigned spell book

This is expected if the character has a spell book assigned. In that setup, the normal spell list copies from the assigned spell book onto the character sheet. Use **Copy to Spell Book** to add spells from approved spell mules into the spell book first.

### Copy to Spell Book does not appear

The selected character does not have an assigned spell book. Open **GM Settings**, go to **Character Assignments**, choose the character, and assign one `SBM_` character under **Spell Book Assignment**.

### A spell says Already Known

A spell with the same name is already present on the destination sheet. Spell Book Manager prevents duplicate copies by spell name.

### A copied spell has unexpected upcast behavior

Check the spell's At Higher Levels field and higher-level damage fields. If the spell also has custom roll text in the description, Roll20 may be applying both the normal sheet upcast behavior and the custom description roll.

### NPC Spell Manager does not list an NPC

Make sure the NPC is using the official D&D 5E 2014 NPC sheet. NPC Spell Manager is separate from the normal player character picker and does not use class assignments.

### The menu did not jump to the newest card

Manually scroll to the bottom of chat. Roll20 may stop auto-scrolling when the chat window is already scrolled upward.

### Class Spell Mule selection acts like it chose the wrong class

After assigning or removing a class spell mule, use the back button in the current Spell Book Manager card to return to the class list before choosing another class. Do not scroll up to an older class list and click from there.
