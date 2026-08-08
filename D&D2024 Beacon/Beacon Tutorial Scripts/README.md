# ScriptCards D&D 2024 Beacon Tutorials

This folder contains a set of **runnable ScriptCards tutorials** for working with the Roll20 D&D 2024 Beacon character sheet.

Each `.scard` file is both a working example and a tutorial. The comments explain what the script is doing, why the Beacon-specific syntax is needed, and how the behavior differs from classic Roll20 character sheets where appropriate.

These tutorials assume the current experimental Beacon-enabled ScriptCards build and use:

```scard
--#beaconsheet|1
```

## How to Use the Tutorials

1. Open the `.scard` file you want to study.
2. Copy the script into Roll20 and run it as you normally would.
3. Select or target a D&D 2024 Beacon character when the tutorial asks for one.
4. Read the comments in the script along with the output card.

The tutorials are numbered in a suggested learning order.

## Tutorial Order

1. **Basic NPC Stats**  
   Read common Beacon sheet values using simple ScriptCards aliases.

2. **Structured Reads**  
   Read exact values from Beacon's structured sheet data using `sheet->...` paths.

3. **Typed Collections**  
   Read Beacon record groups such as actions, spells, speeds, languages, classes, defenses, and more.

4. **Repeating Rows**  
   Use familiar ScriptCards repeating-row commands with Beacon records.

5. **Finding Repeating Rows**  
   Find individual rows with `Rfind`, `Rsearch`, `Rbyindex`, and `Rbysectionid`.

6. **Repeating Arrays and Hashtables**  
   Convert Beacon repeating sections into ScriptCards arrays and hashtables.

7. **Writing Sheet Values**  
   Write native Beacon values and learn the Beacon differences between `--!a` and `--!c`.

8. **Custom Attributes**  
   Create, read, update, and remove custom `user.*` values.

9. **Typed Collection Writes**  
   Change an existing field inside a Beacon typed collection.

10. **Writing Repeating Rows**  
    Change fields on existing Beacon repeating rows using both compatibility and native write paths.

11. **Creating Repeating Rows**  
    Create new native Beacon repeating records with `--!or`.

12. **Copying Repeating Rows**  
    Copy native Beacon repeating records by field match or index.

13. **Spell Slots**  
    Read and write normal spell slots and Pact Magic slots as separate Beacon pools.

14. **Computed Token Bars**  
    Link token bars to writable Beacon computed properties.

15. **`attribute;set`**  
    Use Beacon's expanded `attribute;set` support for native, custom, structured, and repeating values.

## A Note About Beacon vs Classic Sheets

ScriptCards keeps as much familiar syntax as possible, but the D&D 2024 Beacon sheet does not store its data the same way as older Roll20 character sheets.

These tutorials focus specifically on the ScriptCards features and compatibility behavior needed to work with Beacon. General ScriptCards features that behave the same on Beacon and classic sheets are intentionally not repeated here.
