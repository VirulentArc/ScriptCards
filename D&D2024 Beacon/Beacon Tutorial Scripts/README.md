# ScriptCards D&D 2024 Beacon Tutorials

This folder contains a set of **runnable ScriptCards tutorials** for working with the Roll20 D&D 2024 Beacon character sheet.

Each `.scard` file is both a working example and a tutorial. The comments explain what the script is doing, why the Beacon-specific syntax is needed, and how the behavior differs from classic Roll20 character sheets where appropriate.

These tutorials are audited against the accepted experimental **ScriptCards 3.0.25a Beacon `.135`** build and use:

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
   Read Beacon record groups, understand authoritative live vs Builder fallback, and distinguish collection membership from current rule applicability.

4. **Repeating Rows**  
   Use familiar ScriptCards repeating-row commands with Beacon records.

5. **Finding Repeating Rows**  
   Find individual rows with `Rfind`, `Rsearch`, `Rbyindex`, and `Rbysectionid`.

6. **Repeating Arrays and Hashtables**  
   Convert Beacon repeating sections into ScriptCards arrays and hashtables.

7. **Writing Sheet Values**  
   Write native Beacon values and learn the Beacon differences between `--!a` and `--!c`.

8. **Custom Attributes**  
   Create, read, update, and remove custom `user.*` values, including `.135` authoritative-miss/name-collision behavior.

9. **Typed Collection Writes**  
   Change existing numeric and boolean typed fields, including a safe write/restore example using Condition `_active`.

10. **Writing Repeating Rows**  
    Change fields on existing Beacon repeating rows using both compatibility and native write paths.

11. **Creating Repeating Rows**  
    Create new native Beacon repeating records with `--!or`.

12. **Copying Repeating Rows**  
    Copy native Beacon repeating records by field match or index.

13. **Spell Slots**  
    Read and write normal and Pact Magic pools separately, including `.135` remaining-slot routing for `lvlN_slots_expended`.

14. **Computed Token Bars**  
    Link token bars to writable Beacon computed properties.

15. **`attribute;set`**  
    Use Beacon's expanded `attribute;set` support for native, custom, structured, and repeating values.

16. **Character Progression and Hit Dice**  
    Understand `.135` total level, primary-class level, multiclass projections, proficiency bonus, Hit Dice aggregates, and mixed-die behavior.

17. **Roll Modes and Targeted Roll Bonuses**  
    Distinguish the global d20 roll mode from per-roll Advantage, Disadvantage, and modifiers supplied by Roll Bonus records and their parent sources.

18. **Dynamic Features and Effects**  
    Discover character-specific Feature and Effect records, read their generic mapped leaves, and follow their canonical relationships without assuming predictable names.

## A Note About Beacon vs Classic Sheets

ScriptCards keeps as much familiar syntax as possible, but the D&D 2024 Beacon sheet does not store its data the same way as older Roll20 character sheets.

These tutorials focus specifically on the ScriptCards features and compatibility behavior needed to work with Beacon. General ScriptCards features that behave the same on Beacon and classic sheets are intentionally not repeated here.

## `.135` Notes

The `.135` audit changed or clarified several behaviors that are reflected in these tutorials:

- Authoritative live typed records are preferred over mirrored Builder data; explicitly disabled and superseded records are excluded from typed collection results.
- A typed collection is a discovery/indexing surface, not automatically a list of currently applicable rules. Local calculated compatibility values follow the full parent chain and exclude inactive Conditions/Effects, unattuned Attunements, and records that require an unequipped Item.
- `level` is total character level, while `base_level` is the conservatively identified primary-class level. `class`, `class_display`, and `multiclass1` through `multiclass3` are reconstructed from the live class graph.
- Current and maximum Hit Dice are reconstructed from Hit Dice entitlement plus `sheet->rest->usedHitDiceData`; mixed die-size characters deliberately do not receive a guessed single `hitdietype`/`hitdie_final`.
- `spellcasting_ability` is a flattened modifier-style compatibility value such as `3+`, not the actual casting-ability name; inspect `spellcastings` when the ability identity matters.
- Familiar NPC senses, languages, defenses, save/skill flags, and reaction flags can be reconstructed from applicable canonical records.
- `Effect` is now a mapped dynamic record family, while `Healing` is confirmed as a live family whose complete type-specific leaf contract is still intentionally unmapped.
- Known ambiguous legacy names such as `class_resource`, `other_resource`, and `default_critical_range` are authoritative misses rather than guesses; use the appropriate typed records instead.
- `lvlN_slots_expended` continues to mean **remaining normal slots** in Beacon ScriptCards. `.135` deliberately routes writes to `sheet->spellSlots->currentByLevel` so the read and write meanings remain consistent.
