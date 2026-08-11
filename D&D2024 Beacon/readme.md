# D&D 2024 Beacon Sheet — ScriptCards Location Reference

**Core behavior described:** accepted experimental `.135`  
**Updated:** August 11, 2026

This document lists reusable **ScriptCards direct aliases and structured locations** for the D&D 2024 by Roll20 character sheet.

All examples assume Beacon routing is enabled in the ScriptCard:

```scard
--#beaconsheet|1
```

With Beacon routing enabled, ordinary unprefixed ScriptCards references check Beacon sheet data first. Classic Roll20 Attribute objects remain available as a fallback when no Beacon value matches.

## Migrating scripts that use `b-` or `c-`

The old Beacon prefixes have been removed. They are not retained as compatibility aliases.

Existing Beacon scripts must:

1. Add `--#beaconsheet|1`.
2. Remove `b-` or `c-` from every Beacon direct alias, structured path, typed collection, and write target.

| Old syntax | Current syntax |
|---|---|
| `[*S:b-hp]` or `[*S:c-hp]` | `[*S:hp]` |
| `[*T:b-npc_ac]` | `[*T:npc_ac]` |
| `[*[&CharacterID]:b-strength_mod]` | `[*[&CharacterID]:strength_mod]` |
| `[*S:b-sheet->hitpoints->currentHP]` | `[*S:sheet->hitpoints->currentHP]` |
| `[*S:b-store->hitpoints->currentHP]` | `[*S:store->hitpoints->currentHP]` |
| `[*S:b-actions->0->name]` | `[*S:actions->0->name]` |
| `--!c:[&CharacterID]\|b-hp:10` | `--!c:[&CharacterID]\|hp:10` |
| `--!c:[&CharacterID]\|c-hp:10` | `--!c:[&CharacterID]\|hp:10` |
| `--!c:[&CharacterID]\|b-sheet->npc->challengeRating:5` | `--!c:[&CharacterID]\|sheet->npc->challengeRating:5` |

Search existing scripts for all four retired forms: `b-`, `c-`, `b-sheet`, and `b-store`. Prefixed Beacon write targets are rejected with a migration error. The token-property prefix `t-` is unrelated and remains valid.

## Using a documented location

A **direct alias** is the unprefixed sheet name used directly in a ScriptCards reference, such as `hp`, `strength`, or `npc_ac`.

When a table lists a direct alias such as:

```text
hp
```

use it with the normal source, target, or explicit-character wrapper:

```scard
[*S:hp]
[*T:hp]
[*[&CharacterID]:hp]
```

When that row says `Direct alias` in the **Write using** column, write the same direct alias with `--!c`:

```scard
--!c:[&CharacterID]|hp:VALUE
```

When **Write using** instead says `Structured path`, `Typed collection`, `Source input`, or another route, use the documented ScriptCards location rather than writing the direct alias.

Structured locations are used when there is no suitable direct alias. They use the same wrappers:

```scard
[*S:sheet->settings->rolls->mode]
[*T:sheet->settings->rolls->mode]
[*[&CharacterID]:sheet->settings->rolls->mode]

--!c:[&CharacterID]|sheet->settings->rolls->mode:Advantage
```

### What a typed collection is

A **typed collection** is a shortened ScriptCards location for a group of Beacon sheet records of the same kind. For example:

- `actions` contains the character's enabled Action records.
- `abilityscores` contains the six Ability Score records.
- `effects` contains canonical Effect records, including their `_active` state.
- `healings` contains canonical Healing records. Only the family itself is currently mapped; inspect each record before relying on type-specific fields.
- `speeds` contains the character's Speed records.
- `spells` contains the character's Spell records.

A typed collection may also be read without selecting a particular record. For example:

```scard
[*S:speeds]
```

A collection containing those records returns one string:

```text
Grappled 0, Paralyzed 0, Petrified 0, Restrained 0, Stunned 0, Unconscious 0, Walk 30
```

Each collection entry is separated by a **comma followed by one space** (`", "`). The result is a single string, not a ScriptCards array.

For each record, ScriptCards begins with the record's identifying name or value. When the record also contains a recognized primary value, ScriptCards appends that value after a space. In the example above, `Walk` is the record identity and `30` is its primary value, producing `Walk 30`. A record with no recognized primary value is represented by its identity alone.

ScriptCards builds these collections from the Beacon sheet and hides the sheet's internal storage keys. A typed collection path has three parts:

```text
collection->selector->field
```

- **Collection** identifies the kind of record, such as `actions` or `speeds`.
- **Selector** chooses one record from that collection.
- **Field** is the value to read or write on the selected record.

A selector may be:

- A zero-based numeric index, such as `actions->0` for the first Action record.
- A unique identifying value stored on the record, such as its `name`, `shortID`, `uuid`, ability name, movement mode, skill name, or another collection-specific identity value.

Selector matching ignores capitalization, spaces, and punctuation, but the result must identify exactly one record. A selector made entirely of digits is always treated as a numeric index. When two records share the same name or another selector is ambiguous, use the record's `shortID`, `uuid`, or a numeric index. Numeric indexes can change when records are added, removed, or reordered, so a unique record identity is preferable for scripts that will be reused.

ScriptCards prefers records from authoritative Beacon roots. Mirrored builder records are used only when no authoritative entries exist for that collection. Explicitly disabled and superseded records are excluded from ordinary typed-collection selection. Calculated compatibility aliases apply the stricter complete-parent activation rules documented below.

#### Superseded canonical records

Some Beacon progression features leave earlier records in `store.current` after a later record replaces them. The earlier record can remain `_enabled: true`; its replacement relationship is identified by `overwrittenBy`.

ScriptCards treats a record as superseded when:

1. the record has an `overwrittenBy` value;
2. that value identifies another record in the same typed collection; and
3. the replacement record is present and not explicitly disabled.

The superseded record is excluded from typed-collection selection, enumeration, and formatting. It remains visible through the raw `sheet->integrants->integrants->[record-key]` path for diagnostics.

This is especially important for progressive Spell Slot records. An earlier Pact record can remain enabled with a value of `1` after a later record replaces it with a value of `2`. These values are alternatives in a progression chain and must **not** be added together.

Examples:

```scard
[*S:actions->0->name]
[*S:actions->Dagger (Melee)->description]
[*S:abilityscores->Strength->valueFormula->flatValue]
[*S:speeds->Walk->valueFormula->flatValue]
[*[&CharacterID]:actions-><shortID>->name]
```

Replace `<shortID>` with the selected record's actual `shortID`. To change a field on an existing record, use the same typed collection path with `--!c`:

```scard
--!c:[&CharacterID]|actions-><shortID>->actionType:Bonus Action
```

The typed collection identifies existing records; it does not create a new Action, Spell, Item, or other record. Use the documented repeating-row creation and copy commands when a new compatible row is required.

Append `^` to a complete lookup to read the sheet item's `max` tree instead of `current`:

```scard
[*S:speeds->Walk->valueFormula->flatValue^]
[*S:actions->[selector]->name^]
```

Nested writes target `current`. Most D&D 2024 Beacon data is stored in `current`, and many `max` trees are empty.

### Performance: local reads, native scheduling, and read ahead

A direct alias, repeating compatibility field, structured path, and typed-collection field can expose the same logical information, but they do not necessarily use the same internal read path.

A **local read** is answered from structured Beacon data that ScriptCards has already parsed into memory. A local structured, typed-collection, compatibility, or repeating-field read does not call Roll20's asynchronous `getSheetItem()` function.

A **native-read scheduler** is the small ScriptCards queue that starts only the `getSheetItem()` calls that remain necessary. It permits at most three native reads to run at once, shares one pending Promise when the same property is requested again, and preserves positive and negative results in the existing per-card caches.

**Read ahead** means that ScriptCards conservatively scans the current line and up to seven following lines for independent static Beacon references. It starts unavoidable native reads early through the scheduler, then consumes their results in the original ScriptCards execution order. The scan stops at control-flow, write, repeating-command, API-call, source/target-change, and other semantic barriers. Writes remain ordered and invalidate older pending results for the affected character.

Roll20 exposes individual Beacon sheet items to Mod scripts through `getSheetItem()`. Different native names remain different SDK requests, and one request may take substantial time. Bounded concurrency reduces wall-clock waiting when a non-D&D Beacon sheet or an unmapped D&D value genuinely requires several independent native properties. It does not make a native request cheaper, so local resolution remains the preferred path.

Structured paths and typed collections use the Beacon sheet's structured data instead. ScriptCards parses the relevant structured root and builds the typed-record index once, then reuses it. After the index exists, reading several fields from the same Action, Attack, Spell, Item, Feature, or other record is ordinary local object access rather than a separate `getSheetItem()` request for every field.

For the D&D 2024 sheet:

- recognized bare typed-collection roots such as `classes`, `subclasses`, `spells`, and `spellslots` are resolved locally;
- known repeating aliases that map unambiguously to primitive canonical fields are resolved locally once the row has been matched to its canonical record;
- examples include `spellname` → `name`, `spelldescription` → `description`, `spellduration` → `duration`, `spellschool` → `school`, `spellcastingtime` → `castingTime`, and `spellrange` → `range`;
- structural classifiers, containers, genuinely computed values, ambiguous aliases, and fields without a verified canonical mapping still use the native compatibility route;
- `spell_attack_mod` and `spell_dc_mod` are reconstructed locally from the agreed sheet-wide Spellcasting ability when the active Spellcasting records identify one unambiguous ability. Otherwise ScriptCards leaves the native sheet-item result authoritative.
- `level`, primary `class` and `base_level`, `class_display`, `multiclass1` through `multiclass3`, `spellcasting_ability`, current and maximum Hit Dice, and the documented NPC aggregate strings and flags are reconstructed locally when their canonical graphs are unambiguous;
- a deliberately unsupported D&D compatibility alias returns `undefined` as an authoritative local miss. ScriptCards does not retry that result as `user.<name>` or call the native API.

Use the access method that matches the job:

- Use a **direct alias** for one or a few standalone values, especially computed results such as `strength_mod`, `initiative_bonus`, or `spell_save_dc`.
- Use a **fixed structured path** for a known setting or scalar stored beneath `sheet`, such as `sheet->settings->rolls->mode`.
- Use a **typed collection** when a script needs several fields from the same canonical record or needs to enumerate records.
- Use **repeating compatibility fields** when compatibility with an existing repeating-row workflow is required. Known primitive aliases are now local for D&D 2024, but typed collection paths remain the clearest route when a script already has the canonical selector.

For example, these D&D 2024 compatibility reads are local after the Spell row has been matched:

```scard
--Rbysectionid|[&CharacterID];repeating_spell-[&SpellLevel];[&SpellRowID]
--&SpellName|[*R:spellname]
--&School|[*R:spellschool]
--&CastingTime|[*R:spellcastingtime]
--&Range|[*R:spellrange]
--&Description|[*R:spelldescription]
```

The equivalent typed-collection form is:

```scard
--&SpellName|[*[&CharacterID]:spells->[&SpellRowID]->name]
--&School|[*[&CharacterID]:spells->[&SpellRowID]->school]
--&CastingTime|[*[&CharacterID]:spells->[&SpellRowID]->castingTime]
--&Range|[*[&CharacterID]:spells->[&SpellRowID]->range]
--&Description|[*[&CharacterID]:spells->[&SpellRowID]->description]
```

Both forms reuse the structured index for those verified primitive fields. A compatibility field that represents a calculation or linked-record result may still require the native route unless the D&D adapter documents a safe local reconstruction.

When `--#functionbenchmarking|1` is enabled, the Beacon performance report identifies the selected path:

- `sheetItemSdkCalls` counts actual native `getSheetItem()` calls.
- `sheetItemMilliseconds` is the **sum of time spent inside all native calls**. Because calls can overlap, it can be greater than the card's wall-clock execution time.
- `sheetItemCacheHits` and `sheetItemNegativeCacheHits` report resolved and unresolved exact lookups served from the per-card caches.
- `sheetItemPendingHits` reports consumers that reused an already-running native request.
- `sheetItemConcurrentPeak`, `sheetItemQueueMaxDepth`, and `sheetItemQueueWaitMilliseconds` report scheduler behavior.
- `sheetItemPrefetchCandidates`, `sheetItemPrefetchStarted`, `sheetItemPrefetchReused`, and `readAheadWindowScans` report read-ahead activity.
- `repeatingLocalFieldHits` reports repeating fields read directly from canonical records.
- `repeatingLocalAliasHits` is the subset resolved through an unambiguous legacy-to-canonical field-name match.
- `structuredRootParses`, `typedIndexBuilds`, and `typedIndexMilliseconds` report structured parsing and typed-index construction.

A high `sheetItemSdkCalls` count still means the card crossed the Roll20 SDK boundary frequently. On D&D 2024, check whether the requested values have documented structured, typed, locally reconstructed, or canonical repeating routes. On another Beacon sheet, the bounded scheduler and read ahead reduce serial waiting even when no sheet-specific adapter exists.

### Routing and spelling notes

- `sheet` and `store` are equivalent structured roots. This reference uses `sheet` for fixed structured locations.
- Typed collections are unprefixed, including `actions`, `abilityscores`, `speeds`, and `spells`.
- In Beacon mode, an unprefixed read first uses an exact local structured, typed-collection, or sheet-specific compatibility route when available. Recognized bare D&D typed collections are resolved locally before native sheet-item routing. A local authoritative miss stops there and returns `undefined`. Other unresolved names may use the native/translated sheet-item route, followed by an exact classic Attribute and then an existing `user.*` custom field for a bare unresolved name.
- Use `--!c` for Beacon direct aliases, fixed structured paths, and typed canonical paths.
- Use `--!a` for existing native sheet items, repeating compatibility fields, and `user.*` custom fields. Prefix a custom name with `!` to create it, for example `--!a:[&CharacterID]|!user.MyField:VALUE`.
- Copy documented names exactly. Some names preserve Roll20 spellings, including `aboutTabApperancesDisplayOrder`, `encumberance`, and `simpleproficencies`.
- The ordinary movement record is internally named `Walk`. The direct alias is `speed`; special movement records use `Burrow`, `Climb`, `Fly`, and `Swim`.

## Direct aliases

A direct alias is the sheet attribute name ScriptCards authors use directly in Beacon mode. The first column is therefore named **Direct alias**, rather than native or legacy attribute.

- **ScriptCards read location** identifies what the row exposes:
  - `Direct alias:` — the unprefixed name used directly in `[*...]` references.
  - `Structured path:` — a fixed `sheet->...` ScriptCards location.
  - `Typed collection:` or `Typed collections:` — one or more shortened collections of existing Beacon records.
  - `Match:` — the field value used to identify the intended record in a typed collection.
  - `Source input:` or `Source inputs:` — the exact values that drive a computed result.
  - `Parent typed record:` or `Parent typed records:` — the canonical records that generate a synthetic compatibility value.
  - `Builder/interface state:` — transient interface data rather than ordinary stored character data.
  - `Known typed collection:` or `Known typed collections:` — contributing collections are known, but a safe write route is not verified.
  - `Known sources:` — more than one source type contributes, such as a direct alias together with a typed collection field.
  - `State-only structured path:` — related stored state that is not itself the source of the computed value.
  - `Source-input set:` — states whether the complete set of inputs has been verified.
  - `Formula:` — shows the calculation used after the source inputs are read.
- **Value role** identifies the kind of value returned:
  - `STORED` — finite state stored by the sheet.
  - `INPUT` — an editable input used by the sheet or a canonical record.
  - `COMPUTED` — a calculated or aggregated result.
  - `SYNTH` — a compatibility projection assembled from canonical records.
  - `UNKNOWN` — the source location has not yet been verified.
  - `TRANSIENT` — temporary builder or interface state rather than ordinary stored character data.
- **Write using** identifies the correct write route:
  - `Direct alias` — write the name in the first column directly with `--!c`.
  - `Structured path` — write the exact location labeled `Structured path:` in the row.
  - `Typed collection` — use the collection or collections labeled `Typed collection:` or `Typed collections:` in the row to locate the matching existing record. When the row names a field, write that field; otherwise use the corresponding typed-collection table below to choose the existing primitive field that represents the intended change.
  - `Source input` or `Source inputs` — change the exact location or locations labeled `Source input:` or `Source inputs:` in that row.
  - `Parent typed record` — edit the existing record or records labeled `Parent typed record:` or `Parent typed records:` in the row.
  - `Write not verified` — use the direct alias for reads, but no safe write target has been verified.
  - `Not mapped` — the source location is not yet known.
  - `Builder/interface state` — transient sheet-builder or interface data, not ordinary character data.

The tables are grouped by value role and related sheet data. Table headers are repeated throughout for easier reference.

Character-, class-, subclass-, and species-specific feature flags are intentionally not mapped as general direct aliases. Read those values through the appropriate repeating-row or typed-collection records instead.

### Stored values and editable inputs

These aliases expose finite stored state or editable inputs. Use the **Write using** column to determine whether the direct alias itself is writable or whether the documented structured path or typed record must be changed.

#### Combat statistics

> **Value roles**
>
> - `INPUT` — An editable input used by the sheet or by a typed record.
> - `STORED` — A finite value or state stored by the sheet.
>
> **Write using**
>
> - `Direct alias` — Write the name in the first column directly with `--!c`.
> - `Structured path` — Write the exact location labeled `Structured path:` in the row.

| Direct alias | ScriptCards read location | Value role | Description | Write using |
|---|---|---|---|---|
| `ac` | Direct alias: `ac`<br>Typed collection: `armorclasses` | `INPUT` | `ac` is a finite Armor Class input. | `Direct alias` |
| `deathsave_fail1` | Direct alias: `deathsave_fail1`<br>Structured path: `sheet->hitpoints->deathSaves->failures` | `STORED` | `deathsave_fail1` is the finite first-failure state. | `Direct alias` |
| `deathsave_fail2` | Direct alias: `deathsave_fail2`<br>Structured path: `sheet->hitpoints->deathSaves->failures` | `STORED` | `deathsave_fail2` is the finite second-failure state. | `Direct alias` |
| `deathsave_fail3` | Direct alias: `deathsave_fail3`<br>Structured path: `sheet->hitpoints->deathSaves->failures` | `STORED` | `deathsave_fail3` is the finite third-failure state. | `Direct alias` |
| `deathsave_succ1` | Direct alias: `deathsave_succ1`<br>Structured path: `sheet->hitpoints->deathSaves->successes` | `STORED` | `deathsave_succ1` is the finite first-success state. | `Direct alias` |
| `deathsave_succ2` | Direct alias: `deathsave_succ2`<br>Structured path: `sheet->hitpoints->deathSaves->successes` | `STORED` | `deathsave_succ2` is the finite second-success state. | `Direct alias` |
| `deathsave_succ3` | Direct alias: `deathsave_succ3`<br>Structured path: `sheet->hitpoints->deathSaves->successes` | `STORED` | `deathsave_succ3` is the finite third-success state. | `Direct alias` |
| `hp` | Direct alias: `hp`<br>Structured path: `sheet->hitpoints->currentHP` | `STORED` | `hp` reads a finite value stored at the structured ScriptCards location shown in the location column. | `Direct alias` |
| `hp_max` | Direct alias: `hp_max`<br>Typed collection: `hitpoints` | `INPUT` | `hp_max` is a finite maximum-HP input. | `Direct alias` |
| `hp_temp` | Direct alias: `hp_temp`<br>Structured path: `sheet->hitpoints->tempHP` | `STORED` | `hp_temp` reads a finite value stored at the structured ScriptCards location shown in the location column. | `Direct alias` |
| `init_tiebreaker` | Direct alias: `init_tiebreaker`<br>Structured path: `sheet->settings->addDexTiebreaker` | `STORED` | `init_tiebreaker` reads a finite value stored at the structured ScriptCards location shown in the location column. | `Structured path` |
| `initiative_style` | Direct alias: `initiative_style`<br>Structured path: `sheet->settings->rolls->mode` | `STORED` | `initiative_style` reads a finite value stored at the structured ScriptCards location shown in the location column. | `Structured path` — Compatibility view of `sheet->settings->rolls->mode`; use the `Structured path:` setting for new sheet-equivalent logic. |
| `speed` | Direct alias: `speed`<br>Typed collection: `speeds`<br>Match: `speed = Walk` | `INPUT` | `speed` is the finite Speed input. | `Direct alias` |

#### Ability scores

> **Value roles**
>
> - `INPUT` — An editable input used by the sheet or by a typed record.
>
> **Write using**
>
> - `Direct alias` — Write the name in the first column directly with `--!c`.

| Direct alias | ScriptCards read location | Value role | Description | Write using |
|---|---|---|---|---|
| `charisma` | Direct alias: `charisma`<br>Typed collection: `abilityscores`<br>Match: `ability = Charisma` | `INPUT` | `charisma` is a finite ability-score input. | `Direct alias` |
| `constitution` | Direct alias: `constitution`<br>Typed collection: `abilityscores`<br>Match: `ability = Constitution` | `INPUT` | `constitution` is a finite ability-score input. | `Direct alias` |
| `dexterity` | Direct alias: `dexterity`<br>Typed collection: `abilityscores`<br>Match: `ability = Dexterity` | `INPUT` | `dexterity` is a finite ability-score input. | `Direct alias` |
| `intelligence` | Direct alias: `intelligence`<br>Typed collection: `abilityscores`<br>Match: `ability = Intelligence` | `INPUT` | `intelligence` is a finite ability-score input. | `Direct alias` |
| `strength` | Direct alias: `strength`<br>Typed collection: `abilityscores`<br>Match: `ability = Strength` | `INPUT` | `strength` is a finite ability-score input. | `Direct alias` |
| `wisdom` | Direct alias: `wisdom`<br>Typed collection: `abilityscores`<br>Match: `ability = Wisdom` | `INPUT` | `wisdom` is a finite ability-score input. | `Direct alias` |

#### Spellcasting and spell slots

> **Value roles**
>
> - `STORED` — A finite value or state stored by the sheet.
> - `INPUT` — An editable input used by the sheet or by a typed record.
>
> **Write using**
>
> - `Direct alias` — Write the name in the first column directly with `--!c`.

| Direct alias | ScriptCards read location | Value role | Description | Write using |
|---|---|---|---|---|
| `lvl1_slots_expended` | Direct alias: `lvl1_slots_expended`<br>Structured path: `sheet->spellSlots->currentByLevel->FIRST` | `STORED` | `lvl1_slots_expended` is the remaining normal level-1 slot state. | `Direct alias` |
| `lvl1_slots_total` | Direct alias: `lvl1_slots_total`<br>Typed collection: `spellslots`<br>Match: `spellLevel = 1` and the normal `_slotType` | `INPUT` | `lvl1_slots_total` is a finite slot-capacity input. | `Direct alias` |
| `lvl2_slots_expended` | Direct alias: `lvl2_slots_expended`<br>Structured path: `sheet->spellSlots->currentByLevel->SECOND` | `STORED` | `lvl2_slots_expended` is the remaining normal level-2 slot state. | `Direct alias` |
| `lvl2_slots_total` | Direct alias: `lvl2_slots_total`<br>Typed collection: `spellslots`<br>Match: `spellLevel = 2` and the normal `_slotType` | `INPUT` | `lvl2_slots_total` is a finite slot-capacity input. | `Direct alias` |
| `lvl3_slots_expended` | Direct alias: `lvl3_slots_expended`<br>Structured path: `sheet->spellSlots->currentByLevel->THIRD` | `STORED` | `lvl3_slots_expended` is the remaining normal level-3 slot state. | `Direct alias` |
| `lvl3_slots_total` | Direct alias: `lvl3_slots_total`<br>Typed collection: `spellslots`<br>Match: `spellLevel = 3` and the normal `_slotType` | `INPUT` | `lvl3_slots_total` is a finite slot-capacity input. | `Direct alias` |
| `lvl4_slots_expended` | Direct alias: `lvl4_slots_expended`<br>Structured path: `sheet->spellSlots->currentByLevel->FOURTH` | `STORED` | `lvl4_slots_expended` is the remaining normal level-4 slot state. | `Direct alias` |
| `lvl4_slots_total` | Direct alias: `lvl4_slots_total`<br>Typed collection: `spellslots`<br>Match: `spellLevel = 4` and the normal `_slotType` | `INPUT` | `lvl4_slots_total` is a finite slot-capacity input. | `Direct alias` |
| `lvl5_slots_expended` | Direct alias: `lvl5_slots_expended`<br>Structured path: `sheet->spellSlots->currentByLevel->FIFTH` | `STORED` | `lvl5_slots_expended` is the remaining normal level-5 slot state. | `Direct alias` |
| `lvl5_slots_total` | Direct alias: `lvl5_slots_total`<br>Typed collection: `spellslots`<br>Match: `spellLevel = 5` and the normal `_slotType` | `INPUT` | `lvl5_slots_total` is a finite slot-capacity input. | `Direct alias` |
| `lvl6_slots_expended` | Direct alias: `lvl6_slots_expended`<br>Structured path: `sheet->spellSlots->currentByLevel->SIXTH` | `STORED` | `lvl6_slots_expended` is the remaining normal level-6 slot state. | `Direct alias` |
| `lvl6_slots_total` | Direct alias: `lvl6_slots_total`<br>Typed collection: `spellslots`<br>Match: `spellLevel = 6` and the normal `_slotType` | `INPUT` | `lvl6_slots_total` is a finite slot-capacity input. | `Direct alias` |
| `lvl7_slots_expended` | Direct alias: `lvl7_slots_expended`<br>Structured path: `sheet->spellSlots->currentByLevel->SEVENTH` | `STORED` | `lvl7_slots_expended` is the remaining normal level-7 slot state. | `Direct alias` |
| `lvl7_slots_total` | Direct alias: `lvl7_slots_total`<br>Typed collection: `spellslots`<br>Match: `spellLevel = 7` and the normal `_slotType` | `INPUT` | `lvl7_slots_total` is a finite slot-capacity input. | `Direct alias` |
| `lvl8_slots_expended` | Direct alias: `lvl8_slots_expended`<br>Structured path: `sheet->spellSlots->currentByLevel->EIGHTH` | `STORED` | `lvl8_slots_expended` is the remaining normal level-8 slot state. | `Direct alias` |
| `lvl8_slots_total` | Direct alias: `lvl8_slots_total`<br>Typed collection: `spellslots`<br>Match: `spellLevel = 8` and the normal `_slotType` | `INPUT` | `lvl8_slots_total` is a finite slot-capacity input. | `Direct alias` |
| `lvl9_slots_expended` | Direct alias: `lvl9_slots_expended`<br>Structured path: `sheet->spellSlots->currentByLevel->NINTH` | `STORED` | `lvl9_slots_expended` is the remaining normal level-9 slot state. | `Direct alias` |
| `lvl9_slots_total` | Direct alias: `lvl9_slots_total`<br>Typed collection: `spellslots`<br>Match: `spellLevel = 9` and the normal `_slotType` | `INPUT` | `lvl9_slots_total` is a finite slot-capacity input. | `Direct alias` |

##### Normal and Pact slot pools

The `lvl1_slots_expended` through `lvl9_slots_expended` direct aliases address only the normal slot pool under `sheet->spellSlots->currentByLevel`. Despite the historical `slots_expended` name, ScriptCards treats these aliases as the **remaining/available normal-slot count**. They do not read or write Pact Magic slots.

Reads and writes use the same `currentByLevel` value. Sending a locally read remaining-slot value back through Roll20's native `setSheetItem()` translation can invert the intended result—for example, writing `0` can restore a 3-slot pool to `3/3` available slots. ScriptCards therefore routes these nine compatibility-alias writes directly to their `currentByLevel` structured leaves. The public ScriptCards syntax remains unchanged:

```scard
--!c:[&CharacterID]|lvl2_slots_expended:0
```

That example now writes `sheet->spellSlots->currentByLevel->SECOND = 0` rather than sending `0` through the native translated setter. The same routing is used by Beacon-compatible `--!a` and `attribute;set`.

Pact Magic current state is stored separately:

```scard
[*S:sheet->spellSlots->currentPactByLevel->FIRST]
--!c:[&CharacterID]|sheet->spellSlots->currentPactByLevel->FIRST:1
```

No separate direct alias for Pact current-slot state has been verified. Use the exact `currentPactByLevel` structured path when a script needs to display or change that pool.

Normal and Pact slots can exist at the same spell level and must be tracked independently. For example, `currentByLevel->FIRST` can be `3` while `currentPactByLevel->FIRST` is `2`; changing either value leaves the other unchanged.

##### Local normal-slot capacity reads

For D&D 2024 Beacon characters, ScriptCards resolves `lvl1_slots_total` through `lvl9_slots_total` locally before calling Roll20's native sheet-item lookup when the canonical Spell Slot records provide an exact result. This behavior is available to any ScriptCard that reads the standard aliases; it is not tied to a particular mod.

The local calculation:

- selects active Spell Slot records for the requested `spellLevel`;
- excludes any `_slotType` containing `pact`;
- excludes superseded records through the typed collection's `overwrittenBy` handling;
- accepts one consistent `Set Base`, any number of `Modify` records, and the highest `Minimum`;
- also accepts one simple finite record with no calculation mode;
- returns `0` when no active normal entitlement record exists for that level.

Conflicting bases, mixed simple and calculated records, blank or nonnumeric values, or an unknown calculation mode make the local result unsafe. In those cases ScriptCards falls through to Roll20's native `getSheetItem()` result. Writes remain unchanged and continue through the verified direct alias route.

#### NPC compatibility

> **Value roles**
>
> - `STORED` — A finite value or state stored by the sheet.
> - `INPUT` — An editable input used by the sheet or by a typed record.
>
> **Write using**
>
> - `Structured path` — Write the exact location labeled `Structured path:` in the row.
> - `Direct alias` — Write the name in the first column directly with `--!c`.

| Direct alias | ScriptCards read location | Value role | Description | Write using |
|---|---|---|---|---|
| `npc_challenge` | Direct alias: `npc_challenge`<br>Structured path: `sheet->npc->challengeRating` | `STORED` | `npc_challenge` reads a finite value stored at the structured ScriptCards location shown in the location column. | `Structured path` |
| `npc_hpformula` | Direct alias: `npc_hpformula`<br>Structured path: `sheet->npc->rollHP` | `STORED` | `npc_hpformula` reads a finite value stored at the structured ScriptCards location shown in the location column. | `Structured path` |
| `npc_legendary_actions` | Direct alias: `npc_legendary_actions`<br>Structured path: `sheet->npc->legendaryActionCompendiumNum` | `STORED` | `npc_legendary_actions` reads a finite value stored at the structured ScriptCards location shown in the location column. | `Structured path` |
| `npc_legendary_actions_desc` | Direct alias: `npc_legendary_actions_desc`<br>Structured path: `sheet->npc->legendaryActionSummary` | `STORED` | `npc_legendary_actions_desc` reads a finite value stored at the structured ScriptCards location shown in the location column. | `Structured path` |
| `npc_speed` | Direct alias: `npc_speed`<br>Typed collection: `speeds`<br>Match: `speed = Walk` | `INPUT` | `npc_speed` is the finite NPC-compatible Speed input. | `Direct alias` |

#### Identity, progression, and biography

> **Value roles**
>
> - `STORED` — A finite value or state stored by the sheet.
>
> **Write using**
>
> - `Direct alias` — Write the name in the first column directly with `--!c`.

| Direct alias | ScriptCards read location | Value role | Description | Write using |
|---|---|---|---|---|
| `age` | Direct alias: `age` | `STORED` | `age` is a writable direct alias for the character’s age. No stable structured `sheet` location is mapped. | `Direct alias` |
| `alignment` | Direct alias: `alignment`<br>Structured path: `sheet->about->characteristics->alignment` | `STORED` | `alignment` reads a finite value stored at the structured ScriptCards location shown in the location column. | `Direct alias` |
| `experience` | Direct alias: `experience`<br>Structured path: `sheet->classLevel->currentExp` | `STORED` | `experience` reads a finite value stored at the structured ScriptCards location shown in the location column. | `Direct alias` |
| `eyes` | Direct alias: `eyes` | `STORED` | `eyes` is a writable direct alias for the character’s eye description. No stable structured `sheet` location is mapped. | `Direct alias` |
| `hair` | Direct alias: `hair` | `STORED` | `hair` is a writable direct alias for the character’s hair description. No stable structured `sheet` location is mapped. | `Direct alias` |
| `height` | Direct alias: `height` | `STORED` | `height` is a writable direct alias for the character’s height. No stable structured `sheet` location is mapped. | `Direct alias` |
| `size` | Direct alias: `size`<br>Structured path: `sheet->about->characteristics->size` | `STORED` | `size` reads a finite value stored at the structured ScriptCards location shown in the location column. | `Direct alias` |
| `skin` | Direct alias: `skin` | `STORED` | `skin` is a writable direct alias for the character’s skin description. No stable structured `sheet` location is mapped. | `Direct alias` |
| `weight` | Direct alias: `weight` | `STORED` | `weight` is a writable direct alias for the character’s weight. No stable structured `sheet` location is mapped. | `Direct alias` |

#### Shared character values

> **Value roles**
>
> - `STORED` — A finite value or state stored by the sheet.
>
> **Write using**
>
> - `Direct alias` — Write the name in the first column directly with `--!c`.
> - `Typed collection` — Locate the matching existing record through the location labeled `Typed collection:` or `Typed collections:` in the row. When the row names a field, write that field; otherwise use the corresponding typed-collection table below to choose the existing primitive field that represents the intended change.
> - `Structured path` — Write the exact location labeled `Structured path:` in the row.

| Direct alias | ScriptCards read location | Value role | Description | Write using |
|---|---|---|---|---|
| `cp` | Direct alias: `cp`<br>Typed collection: `currencies` | `STORED` | `cp` is the finite amount stored by the matching Currency record. | `Direct alias` |
| `cust_classname` | Direct alias: `cust_classname`<br>Typed collections: `classes`, `classlevels`<br>Match: the intended custom Class and its Class Level record | `STORED` | `cust_classname` comes from the typed collection records identified in the location column. | `Typed collection` |
| `custom_class` | Direct alias: `custom_class`<br>Typed collections: `classes`, `classlevels`<br>Match: the intended custom Class and its Class Level record | `STORED` | `custom_class` comes from the typed collection records identified in the location column. | `Typed collection` |
| `dtype` | Direct alias: `dtype`<br>Structured path: `sheet->settings->rollDamageAutomatic` | `STORED` | `dtype` reads a finite value stored at the structured ScriptCards location shown in the location column. | `Structured path` — Compatibility view of `rollDamageAutomatic`; do not treat it as the 2014 sheet’s independent damage-mode field. |
| `encumberance_setting` | Direct alias: `encumberance_setting`<br>Structured path: `sheet->settings->encumbranceType` | `STORED` | `encumberance_setting` reads a finite value stored at the structured ScriptCards location shown in the location column. | `Structured path` |
| `ep` | Direct alias: `ep`<br>Typed collection: `currencies` | `STORED` | `ep` is the finite amount stored by the matching Currency record. | `Direct alias` |
| `gp` | Direct alias: `gp`<br>Typed collection: `currencies` | `STORED` | `gp` is the finite amount stored by the matching Currency record. | `Direct alias` |
| `inspiration` | Direct alias: `inspiration`<br>Structured path: `sheet->inspiration->isInspired` | `STORED` | `inspiration` reads a finite value stored at the structured ScriptCards location shown in the location column. | `Direct alias` |
| `pp` | Direct alias: `pp`<br>Typed collection: `currencies` | `STORED` | `pp` is the finite amount stored by the matching Currency record. | `Direct alias` |
| `sp` | Direct alias: `sp`<br>Typed collection: `currencies` | `STORED` | `sp` is the finite amount stored by the matching Currency record. | `Direct alias` |
| `subrace` | Direct alias: `subrace`<br>Typed collection: `species`<br>Match: the character’s Species record | `STORED` | `subrace` comes from the typed collection records identified in the location column. | `Typed collection` |

#### Legacy compatibility and roll output

> **Value roles**
>
> - `STORED` — A finite value or state stored by the sheet.
> - `UNKNOWN` — The character-level direct alias is not exposed by the mapped Beacon interface.
>
> **Write using**
>
> - `Typed collection` — Locate the matching existing record through the location labeled `Typed collection:` or `Typed collections:` in the row. When the row names a field, write that field; otherwise use the corresponding typed-collection table below to choose the existing primitive field that represents the intended change.

| Direct alias | ScriptCards read location | Value role | Description | Write using |
|---|---|---|---|---|
| `cust_hitdietype` | Direct alias: `cust_hitdietype`<br>Typed collection: `hitdices`<br>Match: the intended class-specific Hit Dice record | `STORED` | `cust_hitdietype` comes from the typed collection records identified in the location column. | `Typed collection` |
| `cust_spellcasting_ability` | Character-level direct alias: not exposed by the mapped Beacon interface<br>Fallback result: missing `user.cust_spellcasting_ability` Custom Attribute<br>Use instead: `spellcastings->[selector]->ability` | `UNKNOWN` | A bare `cust_spellcasting_ability` read falls through to the classic custom-attribute fallback and produces a missing Custom Attribute error. The Beacon selector changes the selected Spellcasting record's `ability`. | `Typed collection` — Locate the intended Spellcasting record and write `spellcastings->[selector]->ability`. |
| `cust_spellslots` | Direct alias: `cust_spellslots`<br>Typed collection: `spellslots`<br>Match: the intended spell level and `_slotType` | `STORED` | `cust_spellslots` comes from the typed collection records identified in the location column. | `Typed collection` |

### Computed and synthetic values

These aliases expose values calculated, aggregated, translated, or assembled from other Beacon data rather than independent storage locations. Use them freely for reads. Do not write a computed or synthetic alias directly unless its **Write using** cell explicitly says `Direct alias`; otherwise follow that column to the actual input or parent record.

**Formula-based results.** These values are calculated from stored inputs such as ability scores, proficiency records, formula components, and enabled modifiers.

For numeric totals, ScriptCards ignores active Roll Bonus records whose `bonusDetails` is `Keep Highest` or `Keep Lowest`; those records change dice selection, not the numeric modifier. A differently shaped Roll Bonus that could affect the requested roll makes ScriptCards preserve the native result instead of guessing. Locally calculated aliases follow the complete parent activation chain, including Condition and Effect `_active`, Attunement `_attuned`, `requireEquip`, and Item equipped state.

#### Ability scores and saving throws

> **Value roles**
>
> - `COMPUTED` — A calculated or aggregated result. Change the named source input rather than writing the result.
>
> **Write using**
>
> - `Source input` or `Source inputs` — Change the exact location or locations labeled `Source input:` or `Source inputs:` in the row.

| Direct alias | ScriptCards read location | Value role | Description | Write using |
|---|---|---|---|---|
| `charisma_mod` | Direct alias: `charisma_mod`<br>Source input: `charisma` | `COMPUTED` | Calculated from the Charisma score. | `Source input`: `charisma` |
| `charisma_save_bonus` | Direct alias: `charisma_save_bonus`<br>Source inputs: `charisma`; `proficiencies->Charisma->proficiencyLevel` for the Charisma Saving Throw record; `classlevels->[selector]->totalLevel`; applicable `rollbonuses` or `modifiers` records | `COMPUTED` | Calculated from the Charisma modifier, Saving Throw proficiency, proficiency bonus, and applicable bonuses. | `Source inputs`: `charisma`; `proficiencies->Charisma->proficiencyLevel`; `classlevels->[selector]->totalLevel`; applicable `rollbonuses` or `modifiers` records |
| `charisma_save_mod` | Direct alias: `charisma_save_mod`<br>Source inputs: `charisma`; `proficiencies->Charisma->proficiencyLevel` for the Charisma Saving Throw record; `classlevels->[selector]->totalLevel`; applicable `rollbonuses` or `modifiers` records | `COMPUTED` | Calculated from the Charisma modifier, Saving Throw proficiency, proficiency bonus, and applicable bonuses. | `Source inputs`: `charisma`; `proficiencies->Charisma->proficiencyLevel`; `classlevels->[selector]->totalLevel`; applicable `rollbonuses` or `modifiers` records |
| `constitution_mod` | Direct alias: `constitution_mod`<br>Source input: `constitution` | `COMPUTED` | Calculated from the Constitution score. | `Source input`: `constitution` |
| `constitution_save_bonus` | Direct alias: `constitution_save_bonus`<br>Source inputs: `constitution`; `proficiencies->Constitution->proficiencyLevel` for the Constitution Saving Throw record; `classlevels->[selector]->totalLevel`; applicable `rollbonuses` or `modifiers` records | `COMPUTED` | Calculated from the Constitution modifier, Saving Throw proficiency, proficiency bonus, and applicable bonuses. | `Source inputs`: `constitution`; `proficiencies->Constitution->proficiencyLevel`; `classlevels->[selector]->totalLevel`; applicable `rollbonuses` or `modifiers` records |
| `constitution_save_mod` | Direct alias: `constitution_save_mod`<br>Source inputs: `constitution`; `proficiencies->Constitution->proficiencyLevel` for the Constitution Saving Throw record; `classlevels->[selector]->totalLevel`; applicable `rollbonuses` or `modifiers` records | `COMPUTED` | Calculated from the Constitution modifier, Saving Throw proficiency, proficiency bonus, and applicable bonuses. | `Source inputs`: `constitution`; `proficiencies->Constitution->proficiencyLevel`; `classlevels->[selector]->totalLevel`; applicable `rollbonuses` or `modifiers` records |
| `death_save_bonus` | Direct alias: `death_save_bonus`<br>Source inputs: applicable `rollbonuses` or `modifiers` records for death saves<br>State-only structured path: `sheet->hitpoints->deathSaves` stores successes and failures, not the numeric bonus | `COMPUTED` | Calculated from bonuses that apply to death-saving throws. The death-save state container stores marks only. | `Source inputs`: applicable `rollbonuses->[selector]` or `modifiers->[selector]` fields |
| `death_save_mod` | Direct alias: `death_save_mod`<br>Source inputs: applicable `rollbonuses` or `modifiers` records for death saves<br>State-only structured path: `sheet->hitpoints->deathSaves` stores successes and failures, not the numeric bonus | `COMPUTED` | Calculated from bonuses that apply to death-saving throws. The death-save state container stores marks only. | `Source inputs`: applicable `rollbonuses->[selector]` or `modifiers->[selector]` fields |
| `dexterity_mod` | Direct alias: `dexterity_mod`<br>Source input: `dexterity` | `COMPUTED` | Calculated from the Dexterity score. | `Source input`: `dexterity` |
| `dexterity_save_bonus` | Direct alias: `dexterity_save_bonus`<br>Source inputs: `dexterity`; `proficiencies->Dexterity->proficiencyLevel` for the Dexterity Saving Throw record; `classlevels->[selector]->totalLevel`; applicable `rollbonuses` or `modifiers` records | `COMPUTED` | Calculated from the Dexterity modifier, Saving Throw proficiency, proficiency bonus, and applicable bonuses. | `Source inputs`: `dexterity`; `proficiencies->Dexterity->proficiencyLevel`; `classlevels->[selector]->totalLevel`; applicable `rollbonuses` or `modifiers` records |
| `dexterity_save_mod` | Direct alias: `dexterity_save_mod`<br>Source inputs: `dexterity`; `proficiencies->Dexterity->proficiencyLevel` for the Dexterity Saving Throw record; `classlevels->[selector]->totalLevel`; applicable `rollbonuses` or `modifiers` records | `COMPUTED` | Calculated from the Dexterity modifier, Saving Throw proficiency, proficiency bonus, and applicable bonuses. | `Source inputs`: `dexterity`; `proficiencies->Dexterity->proficiencyLevel`; `classlevels->[selector]->totalLevel`; applicable `rollbonuses` or `modifiers` records |
| `intelligence_mod` | Direct alias: `intelligence_mod`<br>Source input: `intelligence` | `COMPUTED` | Calculated from the Intelligence score. | `Source input`: `intelligence` |
| `intelligence_save_bonus` | Direct alias: `intelligence_save_bonus`<br>Source inputs: `intelligence`; `proficiencies->Intelligence->proficiencyLevel` for the Intelligence Saving Throw record; `classlevels->[selector]->totalLevel`; applicable `rollbonuses` or `modifiers` records | `COMPUTED` | Calculated from the Intelligence modifier, Saving Throw proficiency, proficiency bonus, and applicable bonuses. | `Source inputs`: `intelligence`; `proficiencies->Intelligence->proficiencyLevel`; `classlevels->[selector]->totalLevel`; applicable `rollbonuses` or `modifiers` records |
| `intelligence_save_mod` | Direct alias: `intelligence_save_mod`<br>Source inputs: `intelligence`; `proficiencies->Intelligence->proficiencyLevel` for the Intelligence Saving Throw record; `classlevels->[selector]->totalLevel`; applicable `rollbonuses` or `modifiers` records | `COMPUTED` | Calculated from the Intelligence modifier, Saving Throw proficiency, proficiency bonus, and applicable bonuses. | `Source inputs`: `intelligence`; `proficiencies->Intelligence->proficiencyLevel`; `classlevels->[selector]->totalLevel`; applicable `rollbonuses` or `modifiers` records |
| `strength_mod` | Direct alias: `strength_mod`<br>Source input: `strength` | `COMPUTED` | Calculated from the Strength score. | `Source input`: `strength` |
| `strength_save_bonus` | Direct alias: `strength_save_bonus`<br>Source inputs: `strength`; `proficiencies->Strength->proficiencyLevel` for the Strength Saving Throw record; `classlevels->[selector]->totalLevel`; applicable `rollbonuses` or `modifiers` records | `COMPUTED` | Calculated from the Strength modifier, Saving Throw proficiency, proficiency bonus, and applicable bonuses. | `Source inputs`: `strength`; `proficiencies->Strength->proficiencyLevel`; `classlevels->[selector]->totalLevel`; applicable `rollbonuses` or `modifiers` records |
| `strength_save_mod` | Direct alias: `strength_save_mod`<br>Source inputs: `strength`; `proficiencies->Strength->proficiencyLevel` for the Strength Saving Throw record; `classlevels->[selector]->totalLevel`; applicable `rollbonuses` or `modifiers` records | `COMPUTED` | Calculated from the Strength modifier, Saving Throw proficiency, proficiency bonus, and applicable bonuses. | `Source inputs`: `strength`; `proficiencies->Strength->proficiencyLevel`; `classlevels->[selector]->totalLevel`; applicable `rollbonuses` or `modifiers` records |
| `wisdom_mod` | Direct alias: `wisdom_mod`<br>Source input: `wisdom` | `COMPUTED` | Calculated from the Wisdom score. | `Source input`: `wisdom` |
| `wisdom_save_bonus` | Direct alias: `wisdom_save_bonus`<br>Source inputs: `wisdom`; `proficiencies->Wisdom->proficiencyLevel` for the Wisdom Saving Throw record; `classlevels->[selector]->totalLevel`; applicable `rollbonuses` or `modifiers` records | `COMPUTED` | Calculated from the Wisdom modifier, Saving Throw proficiency, proficiency bonus, and applicable bonuses. | `Source inputs`: `wisdom`; `proficiencies->Wisdom->proficiencyLevel`; `classlevels->[selector]->totalLevel`; applicable `rollbonuses` or `modifiers` records |
| `wisdom_save_mod` | Direct alias: `wisdom_save_mod`<br>Source inputs: `wisdom`; `proficiencies->Wisdom->proficiencyLevel` for the Wisdom Saving Throw record; `classlevels->[selector]->totalLevel`; applicable `rollbonuses` or `modifiers` records | `COMPUTED` | Calculated from the Wisdom modifier, Saving Throw proficiency, proficiency bonus, and applicable bonuses. | `Source inputs`: `wisdom`; `proficiencies->Wisdom->proficiencyLevel`; `classlevels->[selector]->totalLevel`; applicable `rollbonuses` or `modifiers` records |

#### Skills and passive checks

> **Value roles**
>
> - `COMPUTED` — A calculated or aggregated result. Change the named source inputs rather than writing the result.
>
> **Write using**
>
> - `Source inputs` — Change the exact locations labeled `Source inputs:` in the row.

| Direct alias | ScriptCards read location | Value role | Description | Write using |
|---|---|---|---|---|
| `acrobatics_bonus` | Direct alias: `acrobatics_bonus`<br>Source inputs: `skills->Acrobatics->ability`; the matching ability-score direct alias; `proficiencies->Acrobatics->proficiencyLevel`; `classlevels->[selector]->totalLevel`; applicable `rollbonuses` or `modifiers` records | `COMPUTED` | Calculated from the ability assigned to Acrobatics, that ability score, Acrobatics proficiency, proficiency bonus, and applicable bonuses. | `Source inputs`: `skills->Acrobatics->ability`; matching ability-score direct alias; `proficiencies->Acrobatics->proficiencyLevel`; `classlevels->[selector]->totalLevel`; applicable `rollbonuses` or `modifiers` records |
| `acrobatics_flat` | Direct alias: `acrobatics_flat`<br>Source inputs: `skills->Acrobatics->ability`; the matching ability-score direct alias; `proficiencies->Acrobatics->proficiencyLevel`; `classlevels->[selector]->totalLevel`; applicable `rollbonuses` or `modifiers` records | `COMPUTED` | Calculated from the ability assigned to Acrobatics, that ability score, Acrobatics proficiency, proficiency bonus, and applicable bonuses. | `Source inputs`: `skills->Acrobatics->ability`; matching ability-score direct alias; `proficiencies->Acrobatics->proficiencyLevel`; `classlevels->[selector]->totalLevel`; applicable `rollbonuses` or `modifiers` records |
| `animal_handling_flat` | Direct alias: `animal_handling_flat`<br>Source inputs: `skills->Animal Handling->ability`; the matching ability-score direct alias; `proficiencies->Animal Handling->proficiencyLevel`; `classlevels->[selector]->totalLevel`; applicable `rollbonuses` or `modifiers` records | `COMPUTED` | Calculated from the ability assigned to Animal Handling, that ability score, Animal Handling proficiency, proficiency bonus, and applicable bonuses. | `Source inputs`: `skills->Animal Handling->ability`; matching ability-score direct alias; `proficiencies->Animal Handling->proficiencyLevel`; `classlevels->[selector]->totalLevel`; applicable `rollbonuses` or `modifiers` records |
| `arcana_flat` | Direct alias: `arcana_flat`<br>Source inputs: `skills->Arcana->ability`; the matching ability-score direct alias; `proficiencies->Arcana->proficiencyLevel`; `classlevels->[selector]->totalLevel`; applicable `rollbonuses` or `modifiers` records | `COMPUTED` | Calculated from the ability assigned to Arcana, that ability score, Arcana proficiency, proficiency bonus, and applicable bonuses. | `Source inputs`: `skills->Arcana->ability`; matching ability-score direct alias; `proficiencies->Arcana->proficiencyLevel`; `classlevels->[selector]->totalLevel`; applicable `rollbonuses` or `modifiers` records |
| `athletics_flat` | Direct alias: `athletics_flat`<br>Source inputs: `skills->Athletics->ability`; the matching ability-score direct alias; `proficiencies->Athletics->proficiencyLevel`; `classlevels->[selector]->totalLevel`; applicable `rollbonuses` or `modifiers` records | `COMPUTED` | Calculated from the ability assigned to Athletics, that ability score, Athletics proficiency, proficiency bonus, and applicable bonuses. | `Source inputs`: `skills->Athletics->ability`; matching ability-score direct alias; `proficiencies->Athletics->proficiencyLevel`; `classlevels->[selector]->totalLevel`; applicable `rollbonuses` or `modifiers` records |
| `deception_flat` | Direct alias: `deception_flat`<br>Source inputs: `skills->Deception->ability`; the matching ability-score direct alias; `proficiencies->Deception->proficiencyLevel`; `classlevels->[selector]->totalLevel`; applicable `rollbonuses` or `modifiers` records | `COMPUTED` | Calculated from the ability assigned to Deception, that ability score, Deception proficiency, proficiency bonus, and applicable bonuses. | `Source inputs`: `skills->Deception->ability`; matching ability-score direct alias; `proficiencies->Deception->proficiencyLevel`; `classlevels->[selector]->totalLevel`; applicable `rollbonuses` or `modifiers` records |
| `history_flat` | Direct alias: `history_flat`<br>Source inputs: `skills->History->ability`; the matching ability-score direct alias; `proficiencies->History->proficiencyLevel`; `classlevels->[selector]->totalLevel`; applicable `rollbonuses` or `modifiers` records | `COMPUTED` | Calculated from the ability assigned to History, that ability score, History proficiency, proficiency bonus, and applicable bonuses. | `Source inputs`: `skills->History->ability`; matching ability-score direct alias; `proficiencies->History->proficiencyLevel`; `classlevels->[selector]->totalLevel`; applicable `rollbonuses` or `modifiers` records |
| `insight_flat` | Direct alias: `insight_flat`<br>Source inputs: `skills->Insight->ability`; the matching ability-score direct alias; `proficiencies->Insight->proficiencyLevel`; `classlevels->[selector]->totalLevel`; applicable `rollbonuses` or `modifiers` records | `COMPUTED` | Calculated from the ability assigned to Insight, that ability score, Insight proficiency, proficiency bonus, and applicable bonuses. | `Source inputs`: `skills->Insight->ability`; matching ability-score direct alias; `proficiencies->Insight->proficiencyLevel`; `classlevels->[selector]->totalLevel`; applicable `rollbonuses` or `modifiers` records |
| `intimidation_flat` | Direct alias: `intimidation_flat`<br>Source inputs: `skills->Intimidation->ability`; the matching ability-score direct alias; `proficiencies->Intimidation->proficiencyLevel`; `classlevels->[selector]->totalLevel`; applicable `rollbonuses` or `modifiers` records | `COMPUTED` | Calculated from the ability assigned to Intimidation, that ability score, Intimidation proficiency, proficiency bonus, and applicable bonuses. | `Source inputs`: `skills->Intimidation->ability`; matching ability-score direct alias; `proficiencies->Intimidation->proficiencyLevel`; `classlevels->[selector]->totalLevel`; applicable `rollbonuses` or `modifiers` records |
| `investigation_flat` | Direct alias: `investigation_flat`<br>Source inputs: `skills->Investigation->ability`; the matching ability-score direct alias; `proficiencies->Investigation->proficiencyLevel`; `classlevels->[selector]->totalLevel`; applicable `rollbonuses` or `modifiers` records | `COMPUTED` | Calculated from the ability assigned to Investigation, that ability score, Investigation proficiency, proficiency bonus, and applicable bonuses. | `Source inputs`: `skills->Investigation->ability`; matching ability-score direct alias; `proficiencies->Investigation->proficiencyLevel`; `classlevels->[selector]->totalLevel`; applicable `rollbonuses` or `modifiers` records |
| `medicine_flat` | Direct alias: `medicine_flat`<br>Source inputs: `skills->Medicine->ability`; the matching ability-score direct alias; `proficiencies->Medicine->proficiencyLevel`; `classlevels->[selector]->totalLevel`; applicable `rollbonuses` or `modifiers` records | `COMPUTED` | Calculated from the ability assigned to Medicine, that ability score, Medicine proficiency, proficiency bonus, and applicable bonuses. | `Source inputs`: `skills->Medicine->ability`; matching ability-score direct alias; `proficiencies->Medicine->proficiencyLevel`; `classlevels->[selector]->totalLevel`; applicable `rollbonuses` or `modifiers` records |
| `nature_flat` | Direct alias: `nature_flat`<br>Source inputs: `skills->Nature->ability`; the matching ability-score direct alias; `proficiencies->Nature->proficiencyLevel`; `classlevels->[selector]->totalLevel`; applicable `rollbonuses` or `modifiers` records | `COMPUTED` | Calculated from the ability assigned to Nature, that ability score, Nature proficiency, proficiency bonus, and applicable bonuses. | `Source inputs`: `skills->Nature->ability`; matching ability-score direct alias; `proficiencies->Nature->proficiencyLevel`; `classlevels->[selector]->totalLevel`; applicable `rollbonuses` or `modifiers` records |
| `passive_wisdom` | Direct alias: `passive_wisdom`<br>Source inputs: `skills->Perception->ability`; the matching ability-score direct alias; `proficiencies->Perception->proficiencyLevel`; `classlevels->[selector]->totalLevel`; applicable `rollbonuses` or `modifiers` records | `COMPUTED` | Calculated as 10 plus the final Perception total. | `Source inputs`: `skills->Perception->ability`; matching ability-score direct alias; `proficiencies->Perception->proficiencyLevel`; `classlevels->[selector]->totalLevel`; applicable `rollbonuses` or `modifiers` records |
| `passiveperceptionmod` | Direct alias: `passiveperceptionmod`<br>Source inputs: `skills->Perception->ability`; the matching ability-score direct alias; `proficiencies->Perception->proficiencyLevel`; `classlevels->[selector]->totalLevel`; applicable `rollbonuses` or `modifiers` records | `COMPUTED` | Calculated as 10 plus the final Perception total. | `Source inputs`: `skills->Perception->ability`; matching ability-score direct alias; `proficiencies->Perception->proficiencyLevel`; `classlevels->[selector]->totalLevel`; applicable `rollbonuses` or `modifiers` records |
| `perception_flat` | Direct alias: `perception_flat`<br>Source inputs: `skills->Perception->ability`; the matching ability-score direct alias; `proficiencies->Perception->proficiencyLevel`; `classlevels->[selector]->totalLevel`; applicable `rollbonuses` or `modifiers` records | `COMPUTED` | Calculated from the ability assigned to Perception, that ability score, Perception proficiency, proficiency bonus, and applicable bonuses. | `Source inputs`: `skills->Perception->ability`; matching ability-score direct alias; `proficiencies->Perception->proficiencyLevel`; `classlevels->[selector]->totalLevel`; applicable `rollbonuses` or `modifiers` records |
| `performance_flat` | Direct alias: `performance_flat`<br>Source inputs: `skills->Performance->ability`; the matching ability-score direct alias; `proficiencies->Performance->proficiencyLevel`; `classlevels->[selector]->totalLevel`; applicable `rollbonuses` or `modifiers` records | `COMPUTED` | Calculated from the ability assigned to Performance, that ability score, Performance proficiency, proficiency bonus, and applicable bonuses. | `Source inputs`: `skills->Performance->ability`; matching ability-score direct alias; `proficiencies->Performance->proficiencyLevel`; `classlevels->[selector]->totalLevel`; applicable `rollbonuses` or `modifiers` records |
| `persuasion_flat` | Direct alias: `persuasion_flat`<br>Source inputs: `skills->Persuasion->ability`; the matching ability-score direct alias; `proficiencies->Persuasion->proficiencyLevel`; `classlevels->[selector]->totalLevel`; applicable `rollbonuses` or `modifiers` records | `COMPUTED` | Calculated from the ability assigned to Persuasion, that ability score, Persuasion proficiency, proficiency bonus, and applicable bonuses. | `Source inputs`: `skills->Persuasion->ability`; matching ability-score direct alias; `proficiencies->Persuasion->proficiencyLevel`; `classlevels->[selector]->totalLevel`; applicable `rollbonuses` or `modifiers` records |
| `religion_flat` | Direct alias: `religion_flat`<br>Source inputs: `skills->Religion->ability`; the matching ability-score direct alias; `proficiencies->Religion->proficiencyLevel`; `classlevels->[selector]->totalLevel`; applicable `rollbonuses` or `modifiers` records | `COMPUTED` | Calculated from the ability assigned to Religion, that ability score, Religion proficiency, proficiency bonus, and applicable bonuses. | `Source inputs`: `skills->Religion->ability`; matching ability-score direct alias; `proficiencies->Religion->proficiencyLevel`; `classlevels->[selector]->totalLevel`; applicable `rollbonuses` or `modifiers` records |
| `sleight_of_hand_flat` | Direct alias: `sleight_of_hand_flat`<br>Source inputs: `skills->Sleight of Hand->ability`; the matching ability-score direct alias; `proficiencies->Sleight of Hand->proficiencyLevel`; `classlevels->[selector]->totalLevel`; applicable `rollbonuses` or `modifiers` records | `COMPUTED` | Calculated from the ability assigned to Sleight of Hand, that ability score, Sleight of Hand proficiency, proficiency bonus, and applicable bonuses. | `Source inputs`: `skills->Sleight of Hand->ability`; matching ability-score direct alias; `proficiencies->Sleight of Hand->proficiencyLevel`; `classlevels->[selector]->totalLevel`; applicable `rollbonuses` or `modifiers` records |
| `stealth_flat` | Direct alias: `stealth_flat`<br>Source inputs: `skills->Stealth->ability`; the matching ability-score direct alias; `proficiencies->Stealth->proficiencyLevel`; `classlevels->[selector]->totalLevel`; applicable `rollbonuses` or `modifiers` records | `COMPUTED` | Calculated from the ability assigned to Stealth, that ability score, Stealth proficiency, proficiency bonus, and applicable bonuses. | `Source inputs`: `skills->Stealth->ability`; matching ability-score direct alias; `proficiencies->Stealth->proficiencyLevel`; `classlevels->[selector]->totalLevel`; applicable `rollbonuses` or `modifiers` records |
| `survival_flat` | Direct alias: `survival_flat`<br>Source inputs: `skills->Survival->ability`; the matching ability-score direct alias; `proficiencies->Survival->proficiencyLevel`; `classlevels->[selector]->totalLevel`; applicable `rollbonuses` or `modifiers` records | `COMPUTED` | Calculated from the ability assigned to Survival, that ability score, Survival proficiency, proficiency bonus, and applicable bonuses. | `Source inputs`: `skills->Survival->ability`; matching ability-score direct alias; `proficiencies->Survival->proficiencyLevel`; `classlevels->[selector]->totalLevel`; applicable `rollbonuses` or `modifiers` records |

#### Combat statistics

> **Value roles**
>
> - `COMPUTED` — A calculated or aggregated result. Change the named source inputs rather than writing the result.
>
> **Write using**
>
> - `Source inputs` — Change the exact locations labeled `Source inputs:` in the row.

| Direct alias | ScriptCards read location | Value role | Description | Write using |
|---|---|---|---|---|
| `initiative_bonus` | Direct alias: `initiative_bonus`<br>Source inputs: `dexterity`; applicable initiative `rollbonuses` or `modifiers` records | `COMPUTED` | Calculated from the Dexterity modifier and bonuses that apply to Initiative. `init_tiebreaker` changes tie handling, not this number. | `Source inputs`: `dexterity`; applicable initiative `rollbonuses->[selector]` or `modifiers->[selector]` fields |
| `initmod` | Direct alias: `initmod`<br>Source inputs: `dexterity`; applicable initiative `rollbonuses` or `modifiers` records | `COMPUTED` | Calculated from the Dexterity modifier and bonuses that apply to Initiative. `init_tiebreaker` changes tie handling, not this number. | `Source inputs`: `dexterity`; applicable initiative `rollbonuses->[selector]` or `modifiers->[selector]` fields |

#### Shared character values

> **Value roles**
>
> - `COMPUTED` — A calculated or aggregated result. Change the named source input rather than writing the result.
>
> **Write using**
>
> - `Source input` — Change the exact location labeled `Source input:` in the row.

| Direct alias | ScriptCards read location | Value role | Description | Write using |
|---|---|---|---|---|
| `base_level` | Direct alias: `base_level`<br>Source inputs: active `classes`, `classlevels`, `hitpoints`, and `hitdices` records<br>Multiclass primary evidence: the unique level-1 contribution whose non-temporary HP value equals its Hit Dice size | `COMPUTED` | Primary-class level, not total character level. A single class is inherently primary; on a multiclass character, ScriptCards declines the local projection if the primary graph is ambiguous rather than choosing by class order or highest level. | `Source inputs`: the owning Class Level graph |
| `pb` | Direct alias: `pb`<br>Source inputs: `classlevels->[selector]->totalLevel`<br>Match: active Class Level records with populated `classID`<br>Aggregate: sum each positive finite `totalLevel` contribution<br>Formula: `2 + floor((aggregateLevel - 1) / 4)` | `COMPUTED` | Calculated proficiency bonus from total character level. Internal Class Level records with a blank `classID` are excluded. | `Source inputs`: `classlevels->[selector]->totalLevel` |

#### Level and proficiency bonus

> **Value roles**
>
> - `COMPUTED` — A calculated or aggregated result. Change the named source input rather than writing the result.
>
> **Write using**
>
> - `Source input` — Change the exact location labeled `Source input:` in the row.
> - `Write not verified` — Use the alias for reads; no safe ScriptCards write target has been verified.

| Direct alias | ScriptCards read location | Value role | Description | Write using |
|---|---|---|---|---|
| `level` | Direct alias: `level`<br>Source inputs: `classlevels->[selector]->totalLevel`<br>Match: active Class Level records with populated `classID`<br>Aggregate: sum each positive finite `totalLevel` contribution | `COMPUTED` | Final total character level. This is distinct from primary-class `base_level` on a multiclass character. Internal Class Level records with a blank `classID` are excluded. | `Source inputs`: `classlevels->[selector]->totalLevel` |
| `level_calculations` | Direct alias: `level_calculations`<br>Known typed collection: `classlevels`<br>Source-input set: not yet verified | `COMPUTED` | Sheet-generated level-calculation compatibility output. The complete input set has not yet been mapped to safe ScriptCards write targets. | `Write not verified` |

**Aliases, aggregates, and synthetic projections.** These values are translated, aggregated, or assembled from canonical records. They are not independent storage locations; use the listed source record or collection for deliberate edits.

#### Identity, class, and species

> **Value roles**
>
> - `COMPUTED` — A calculated or aggregated result. Change the named source input rather than writing the result.
>
> **Write using**
>
> - `Write not verified` — Use the alias for reads; no safe ScriptCards write target has been verified.

| Direct alias | ScriptCards read location | Value role | Description | Write using |
|---|---|---|---|---|
| `background` | Direct alias: `background`<br>Typed collection: `backgrounds` | `COMPUTED` | `background` is the translated display value derived from the canonical Background record. | `Write not verified` |
| `character_name` | Direct alias: `character_name` | `COMPUTED` | `character_name` is the Roll20 character-name pseudo-attribute exposed through ScriptCards, not an independently writable Beacon sheet field. | `Write not verified` |
| `class` | Direct alias: `class`<br>Source inputs: active `classes`, `classlevels`, `hitpoints`, and `hitdices` records | `COMPUTED` | Primary-class name. If the primary-class graph is ambiguous, ScriptCards preserves the native compatibility route rather than guessing. | `Source inputs`: the owning Class Level graph |
| `class_display` | Direct alias: `class_display`<br>Source inputs: active `classes`, `classlevels`, and `subclasses` records | `COMPUTED` | Comma-and-space separated `Class level` groups sorted by class name, for example `Bard 3, Fighter 2`. | `Source inputs`: `classes`, `classlevels`, and `subclasses` |
| `race` | Direct alias: `race`<br>Typed collection: `species` | `COMPUTED` | `race` is the legacy-compatible species display derived from the canonical Species record. | `Write not verified` |
| `race_display` | Direct alias: `race_display`<br>Typed collection: `species` | `COMPUTED` | `race_display` is a formatted compatibility display derived from the canonical Species record. | `Write not verified` |

#### Spellcasting and spell slots

> **Value roles**
>
> - `COMPUTED` — A calculated or aggregated result. Change the named source input rather than writing the result.
>
> **Write using**
>
> - `Write not verified` — Use the alias for reads; no safe ScriptCards write target has been verified.

| Direct alias | ScriptCards read location | Value role | Description | Write using |
|---|---|---|---|---|
| `lvl1_slots_mod` | Direct alias: `lvl1_slots_mod` | `COMPUTED` | `lvl1_slots_mod` is a direct alias that provides convenient ScriptCards access to the Beacon data described in the location column. | `Write not verified` |
| `lvl2_slots_mod` | Direct alias: `lvl2_slots_mod` | `COMPUTED` | `lvl2_slots_mod` is a direct alias that provides convenient ScriptCards access to the Beacon data described in the location column. | `Write not verified` |
| `lvl3_slots_mod` | Direct alias: `lvl3_slots_mod` | `COMPUTED` | `lvl3_slots_mod` is a direct alias that provides convenient ScriptCards access to the Beacon data described in the location column. | `Write not verified` |
| `lvl4_slots_mod` | Direct alias: `lvl4_slots_mod` | `COMPUTED` | `lvl4_slots_mod` is a direct alias that provides convenient ScriptCards access to the Beacon data described in the location column. | `Write not verified` |
| `lvl5_slots_mod` | Direct alias: `lvl5_slots_mod` | `COMPUTED` | `lvl5_slots_mod` is a direct alias that provides convenient ScriptCards access to the Beacon data described in the location column. | `Write not verified` |
| `lvl6_slots_mod` | Direct alias: `lvl6_slots_mod` | `COMPUTED` | `lvl6_slots_mod` is a direct alias that provides convenient ScriptCards access to the Beacon data described in the location column. | `Write not verified` |
| `lvl7_slots_mod` | Direct alias: `lvl7_slots_mod` | `COMPUTED` | `lvl7_slots_mod` is a direct alias that provides convenient ScriptCards access to the Beacon data described in the location column. | `Write not verified` |
| `lvl8_slots_mod` | Direct alias: `lvl8_slots_mod` | `COMPUTED` | `lvl8_slots_mod` is a direct alias that provides convenient ScriptCards access to the Beacon data described in the location column. | `Write not verified` |
| `lvl9_slots_mod` | Direct alias: `lvl9_slots_mod` | `COMPUTED` | `lvl9_slots_mod` is a direct alias that provides convenient ScriptCards access to the Beacon data described in the location column. | `Write not verified` |

#### NPC core, defenses, and compatibility flags

> **Value roles**
>
> - `COMPUTED` — A calculated or aggregated result. Change the named source input rather than writing the result.
>
> **Write using**
>
> - `Write not verified` — Use the alias for reads; no safe ScriptCards write target has been verified.

| Direct alias | ScriptCards read location | Value role | Description | Write using |
|---|---|---|---|---|
| `npc_ac` | Direct alias: `npc_ac` | `COMPUTED` | `npc_ac` is a direct alias that provides convenient ScriptCards access to the Beacon data described in the location column. | `Write not verified` |
| `npc_actype` | Direct alias: `npc_actype` | `COMPUTED` | `npc_actype` is a direct alias that provides convenient ScriptCards access to the Beacon data described in the location column. | `Write not verified` |
| `npc_condition_immunities` | Direct alias: `npc_condition_immunities`<br>Typed collection: active `defenses` with `defense = Immunity` and nonblank `condition` | `COMPUTED` | Unique condition names sorted and joined with comma-space. Complete Condition, Effect, Attunement, Item/equipment, and `_enabled` ancestry is respected. | `Typed collection`: matching `defenses` records |
| `npc_immunities` | Direct alias: `npc_immunities`<br>Typed collection: active `defenses` with `defense = Immunity` and nonblank `damage` | `COMPUTED` | Unique damage-immunity values sorted and joined with comma-space. Records beneath inactive ancestors are excluded. | `Typed collection`: matching `defenses` records |
| `npc_languages` | Direct alias: `npc_languages`<br>Typed collection: active `languages->[selector]->name` | `COMPUTED` | Unique enabled Language names sorted and joined with comma-space, for example `Common, Draconic`. | `Typed collection`: matching `languages` records |
| `npc_name_flag` | Direct alias: `npc_name_flag`<br>Structured path: `sheet->npc` | `COMPUTED` | `npc_name_flag` is a direct alias that provides convenient ScriptCards access to the Beacon data described in the location column. | `Write not verified` |
| `npc_options-flag` | Direct alias: `npc_options-flag` | `COMPUTED` | `npc_options-flag` is a direct alias that provides convenient ScriptCards access to the Beacon data described in the location column. | `Write not verified` |
| `npc_resistances` | Direct alias: `npc_resistances`<br>Typed collection: active `defenses` with `defense = Resistance` and nonblank `damage` | `COMPUTED` | Unique resistance values sorted and joined with comma-space. | `Typed collection`: matching `defenses` records |
| `npc_saving_flag` | Direct alias: `npc_saving_flag`<br>Typed collection: active `proficiencies` with `category = Saving Throw` | `COMPUTED` | Returns `1` when at least one active saving-throw Proficiency has a recognized positive tier; otherwise `0`. | `Typed collection`: matching `proficiencies` records |
| `npc_senses` | Direct alias: `npc_senses`<br>Typed collection: active `senses` | `COMPUTED` | Formats each Sense as `Name N ft.` when `ignoreValue = false`, or `Name` when true; unique entries are sorted and joined with comma-space. | `Typed collection`: matching `senses` records |
| `npc_skills_flag` | Direct alias: `npc_skills_flag`<br>Typed collection: active `proficiencies` with `category = Skill` | `COMPUTED` | Returns `1` when at least one active skill Proficiency has a recognized positive tier; otherwise `0`. | `Typed collection`: matching `proficiencies` records |
| `npc_type` | Direct alias: `npc_type`<br>Structured path: `sheet->character->creatureType` | `COMPUTED` | `npc_type` is a direct alias that provides convenient ScriptCards access to the Beacon data described in the location column. | `Write not verified` |
| `npc_vulnerabilities` | Direct alias: `npc_vulnerabilities`<br>Typed collection: active `defenses` with `defense = Vulnerability` and nonblank `damage` | `COMPUTED` | Unique vulnerability values sorted and joined with comma-space. | `Typed collection`: matching `defenses` records |
| `npc_xp` | Direct alias: `npc_xp`<br>Structured path: `sheet->npc->challengeRating`<br>Structured path: `sheet->npc->customXP` | `COMPUTED` | `npc_xp` is a direct alias that provides convenient ScriptCards access to the Beacon data described in the location column. | `Write not verified` |
| `npcreactionsflag` | Direct alias: `npcreactionsflag`<br>Typed collections: active `actions` and `attacks` with `actionType = Reaction` | `COMPUTED` | Returns `1` when an active Reaction exists, otherwise `0`. It does not rely on `sheet->actions->reactionDisplayOrder`, which can be empty while a Reaction record exists. | `Typed collection`: matching `actions` or `attacks` record |
| `npcspell_flag` | Direct alias: `npcspell_flag` | `COMPUTED` | `npcspell_flag` is a direct alias that provides convenient ScriptCards access to the Beacon data described in the location column. | `Write not verified` |
| `npcspellcastingflag` | Direct alias: `npcspellcastingflag` | `COMPUTED` | `npcspellcastingflag` is a direct alias that provides convenient ScriptCards access to the Beacon data described in the location column. | `Write not verified` |

#### NPC skills — Acrobatics through Medicine

> **Value roles**
>
> - `COMPUTED` — A calculated or aggregated result. Change the named source input rather than writing the result.
>
> **Write using**
>
> - `Write not verified` — Use the alias for reads; no safe ScriptCards write target has been verified.

| Direct alias | ScriptCards read location | Value role | Description | Write using |
|---|---|---|---|---|
| `npc_acrobatics` | Direct alias: `npc_acrobatics` | `COMPUTED` | `npc_acrobatics` is a direct alias that provides convenient ScriptCards access to the Beacon data described in the location column. | `Write not verified` |
| `npc_acrobatics_base` | Direct alias: `npc_acrobatics_base` | `COMPUTED` | `npc_acrobatics_base` is a direct alias that provides convenient ScriptCards access to the Beacon data described in the location column. | `Write not verified` |
| `npc_acrobatics_flag` | Direct alias: `npc_acrobatics_flag` | `COMPUTED` | `npc_acrobatics_flag` is a direct alias that provides convenient ScriptCards access to the Beacon data described in the location column. | `Write not verified` |
| `npc_animal_handling` | Direct alias: `npc_animal_handling` | `COMPUTED` | `npc_animal_handling` is a direct alias that provides convenient ScriptCards access to the Beacon data described in the location column. | `Write not verified` |
| `npc_animal_handling_base` | Direct alias: `npc_animal_handling_base` | `COMPUTED` | `npc_animal_handling_base` is a direct alias that provides convenient ScriptCards access to the Beacon data described in the location column. | `Write not verified` |
| `npc_animal_handling_flag` | Direct alias: `npc_animal_handling_flag` | `COMPUTED` | `npc_animal_handling_flag` is a direct alias that provides convenient ScriptCards access to the Beacon data described in the location column. | `Write not verified` |
| `npc_arcana` | Direct alias: `npc_arcana` | `COMPUTED` | `npc_arcana` is a direct alias that provides convenient ScriptCards access to the Beacon data described in the location column. | `Write not verified` |
| `npc_arcana_base` | Direct alias: `npc_arcana_base` | `COMPUTED` | `npc_arcana_base` is a direct alias that provides convenient ScriptCards access to the Beacon data described in the location column. | `Write not verified` |
| `npc_arcana_flag` | Direct alias: `npc_arcana_flag` | `COMPUTED` | `npc_arcana_flag` is a direct alias that provides convenient ScriptCards access to the Beacon data described in the location column. | `Write not verified` |
| `npc_athletics` | Direct alias: `npc_athletics` | `COMPUTED` | `npc_athletics` is a direct alias that provides convenient ScriptCards access to the Beacon data described in the location column. | `Write not verified` |
| `npc_athletics_base` | Direct alias: `npc_athletics_base` | `COMPUTED` | `npc_athletics_base` is a direct alias that provides convenient ScriptCards access to the Beacon data described in the location column. | `Write not verified` |
| `npc_athletics_flag` | Direct alias: `npc_athletics_flag` | `COMPUTED` | `npc_athletics_flag` is a direct alias that provides convenient ScriptCards access to the Beacon data described in the location column. | `Write not verified` |
| `npc_deception` | Direct alias: `npc_deception` | `COMPUTED` | `npc_deception` is a direct alias that provides convenient ScriptCards access to the Beacon data described in the location column. | `Write not verified` |
| `npc_deception_base` | Direct alias: `npc_deception_base` | `COMPUTED` | `npc_deception_base` is a direct alias that provides convenient ScriptCards access to the Beacon data described in the location column. | `Write not verified` |
| `npc_deception_flag` | Direct alias: `npc_deception_flag` | `COMPUTED` | `npc_deception_flag` is a direct alias that provides convenient ScriptCards access to the Beacon data described in the location column. | `Write not verified` |
| `npc_history` | Direct alias: `npc_history` | `COMPUTED` | `npc_history` is a direct alias that provides convenient ScriptCards access to the Beacon data described in the location column. | `Write not verified` |
| `npc_history_base` | Direct alias: `npc_history_base` | `COMPUTED` | `npc_history_base` is a direct alias that provides convenient ScriptCards access to the Beacon data described in the location column. | `Write not verified` |
| `npc_history_flag` | Direct alias: `npc_history_flag` | `COMPUTED` | `npc_history_flag` is a direct alias that provides convenient ScriptCards access to the Beacon data described in the location column. | `Write not verified` |
| `npc_insight` | Direct alias: `npc_insight` | `COMPUTED` | `npc_insight` is a direct alias that provides convenient ScriptCards access to the Beacon data described in the location column. | `Write not verified` |
| `npc_insight_base` | Direct alias: `npc_insight_base` | `COMPUTED` | `npc_insight_base` is a direct alias that provides convenient ScriptCards access to the Beacon data described in the location column. | `Write not verified` |
| `npc_insight_flag` | Direct alias: `npc_insight_flag` | `COMPUTED` | `npc_insight_flag` is a direct alias that provides convenient ScriptCards access to the Beacon data described in the location column. | `Write not verified` |
| `npc_intimidation` | Direct alias: `npc_intimidation` | `COMPUTED` | `npc_intimidation` is a direct alias that provides convenient ScriptCards access to the Beacon data described in the location column. | `Write not verified` |
| `npc_intimidation_base` | Direct alias: `npc_intimidation_base` | `COMPUTED` | `npc_intimidation_base` is a direct alias that provides convenient ScriptCards access to the Beacon data described in the location column. | `Write not verified` |
| `npc_intimidation_flag` | Direct alias: `npc_intimidation_flag` | `COMPUTED` | `npc_intimidation_flag` is a direct alias that provides convenient ScriptCards access to the Beacon data described in the location column. | `Write not verified` |
| `npc_investigation` | Direct alias: `npc_investigation` | `COMPUTED` | `npc_investigation` is a direct alias that provides convenient ScriptCards access to the Beacon data described in the location column. | `Write not verified` |
| `npc_investigation_base` | Direct alias: `npc_investigation_base` | `COMPUTED` | `npc_investigation_base` is a direct alias that provides convenient ScriptCards access to the Beacon data described in the location column. | `Write not verified` |
| `npc_investigation_flag` | Direct alias: `npc_investigation_flag` | `COMPUTED` | `npc_investigation_flag` is a direct alias that provides convenient ScriptCards access to the Beacon data described in the location column. | `Write not verified` |
| `npc_medicine` | Direct alias: `npc_medicine` | `COMPUTED` | `npc_medicine` is a direct alias that provides convenient ScriptCards access to the Beacon data described in the location column. | `Write not verified` |
| `npc_medicine_base` | Direct alias: `npc_medicine_base` | `COMPUTED` | `npc_medicine_base` is a direct alias that provides convenient ScriptCards access to the Beacon data described in the location column. | `Write not verified` |
| `npc_medicine_flag` | Direct alias: `npc_medicine_flag` | `COMPUTED` | `npc_medicine_flag` is a direct alias that provides convenient ScriptCards access to the Beacon data described in the location column. | `Write not verified` |

#### NPC skills — Nature through Survival

> **Value roles**
>
> - `COMPUTED` — A calculated or aggregated result. Change the named source input rather than writing the result.
>
> **Write using**
>
> - `Write not verified` — Use the alias for reads; no safe ScriptCards write target has been verified.

| Direct alias | ScriptCards read location | Value role | Description | Write using |
|---|---|---|---|---|
| `npc_nature` | Direct alias: `npc_nature` | `COMPUTED` | `npc_nature` is a direct alias that provides convenient ScriptCards access to the Beacon data described in the location column. | `Write not verified` |
| `npc_nature_base` | Direct alias: `npc_nature_base` | `COMPUTED` | `npc_nature_base` is a direct alias that provides convenient ScriptCards access to the Beacon data described in the location column. | `Write not verified` |
| `npc_nature_flag` | Direct alias: `npc_nature_flag` | `COMPUTED` | `npc_nature_flag` is a direct alias that provides convenient ScriptCards access to the Beacon data described in the location column. | `Write not verified` |
| `npc_perception` | Direct alias: `npc_perception` | `COMPUTED` | `npc_perception` is a direct alias that provides convenient ScriptCards access to the Beacon data described in the location column. | `Write not verified` |
| `npc_perception_base` | Direct alias: `npc_perception_base` | `COMPUTED` | `npc_perception_base` is a direct alias that provides convenient ScriptCards access to the Beacon data described in the location column. | `Write not verified` |
| `npc_perception_flag` | Direct alias: `npc_perception_flag` | `COMPUTED` | `npc_perception_flag` is a direct alias that provides convenient ScriptCards access to the Beacon data described in the location column. | `Write not verified` |
| `npc_performance` | Direct alias: `npc_performance` | `COMPUTED` | `npc_performance` is a direct alias that provides convenient ScriptCards access to the Beacon data described in the location column. | `Write not verified` |
| `npc_performance_base` | Direct alias: `npc_performance_base` | `COMPUTED` | `npc_performance_base` is a direct alias that provides convenient ScriptCards access to the Beacon data described in the location column. | `Write not verified` |
| `npc_performance_flag` | Direct alias: `npc_performance_flag` | `COMPUTED` | `npc_performance_flag` is a direct alias that provides convenient ScriptCards access to the Beacon data described in the location column. | `Write not verified` |
| `npc_persuasion` | Direct alias: `npc_persuasion` | `COMPUTED` | `npc_persuasion` is a direct alias that provides convenient ScriptCards access to the Beacon data described in the location column. | `Write not verified` |
| `npc_persuasion_base` | Direct alias: `npc_persuasion_base` | `COMPUTED` | `npc_persuasion_base` is a direct alias that provides convenient ScriptCards access to the Beacon data described in the location column. | `Write not verified` |
| `npc_persuasion_flag` | Direct alias: `npc_persuasion_flag` | `COMPUTED` | `npc_persuasion_flag` is a direct alias that provides convenient ScriptCards access to the Beacon data described in the location column. | `Write not verified` |
| `npc_religion` | Direct alias: `npc_religion` | `COMPUTED` | `npc_religion` is a direct alias that provides convenient ScriptCards access to the Beacon data described in the location column. | `Write not verified` |
| `npc_religion_base` | Direct alias: `npc_religion_base` | `COMPUTED` | `npc_religion_base` is a direct alias that provides convenient ScriptCards access to the Beacon data described in the location column. | `Write not verified` |
| `npc_religion_flag` | Direct alias: `npc_religion_flag` | `COMPUTED` | `npc_religion_flag` is a direct alias that provides convenient ScriptCards access to the Beacon data described in the location column. | `Write not verified` |
| `npc_sleight_of_hand` | Direct alias: `npc_sleight_of_hand` | `COMPUTED` | `npc_sleight_of_hand` is a direct alias that provides convenient ScriptCards access to the Beacon data described in the location column. | `Write not verified` |
| `npc_sleight_of_hand_base` | Direct alias: `npc_sleight_of_hand_base` | `COMPUTED` | `npc_sleight_of_hand_base` is a direct alias that provides convenient ScriptCards access to the Beacon data described in the location column. | `Write not verified` |
| `npc_sleight_of_hand_flag` | Direct alias: `npc_sleight_of_hand_flag` | `COMPUTED` | `npc_sleight_of_hand_flag` is a direct alias that provides convenient ScriptCards access to the Beacon data described in the location column. | `Write not verified` |
| `npc_stealth` | Direct alias: `npc_stealth` | `COMPUTED` | `npc_stealth` is a direct alias that provides convenient ScriptCards access to the Beacon data described in the location column. | `Write not verified` |
| `npc_stealth_base` | Direct alias: `npc_stealth_base` | `COMPUTED` | `npc_stealth_base` is a direct alias that provides convenient ScriptCards access to the Beacon data described in the location column. | `Write not verified` |
| `npc_stealth_flag` | Direct alias: `npc_stealth_flag` | `COMPUTED` | `npc_stealth_flag` is a direct alias that provides convenient ScriptCards access to the Beacon data described in the location column. | `Write not verified` |
| `npc_survival` | Direct alias: `npc_survival` | `COMPUTED` | `npc_survival` is a direct alias that provides convenient ScriptCards access to the Beacon data described in the location column. | `Write not verified` |
| `npc_survival_base` | Direct alias: `npc_survival_base` | `COMPUTED` | `npc_survival_base` is a direct alias that provides convenient ScriptCards access to the Beacon data described in the location column. | `Write not verified` |
| `npc_survival_flag` | Direct alias: `npc_survival_flag` | `COMPUTED` | `npc_survival_flag` is a direct alias that provides convenient ScriptCards access to the Beacon data described in the location column. | `Write not verified` |

#### NPC saving throws

> **Value roles**
>
> - `COMPUTED` — A calculated or aggregated result. Change the named source input rather than writing the result.
>
> **Write using**
>
> - `Write not verified` — Use the alias for reads; no safe ScriptCards write target has been verified.

| Direct alias | ScriptCards read location | Value role | Description | Write using |
|---|---|---|---|---|
| `npc_cha_negative` | Direct alias: `npc_cha_negative` | `COMPUTED` | `npc_cha_negative` is a direct alias that provides convenient ScriptCards access to the Beacon data described in the location column. | `Write not verified` |
| `npc_cha_save` | Direct alias: `npc_cha_save` | `COMPUTED` | `npc_cha_save` is a direct alias that provides convenient ScriptCards access to the Beacon data described in the location column. | `Write not verified` |
| `npc_cha_save_base` | Direct alias: `npc_cha_save_base` | `COMPUTED` | `npc_cha_save_base` is a direct alias that provides convenient ScriptCards access to the Beacon data described in the location column. | `Write not verified` |
| `npc_cha_save_flag` | Direct alias: `npc_cha_save_flag` | `COMPUTED` | `npc_cha_save_flag` is a direct alias that provides convenient ScriptCards access to the Beacon data described in the location column. | `Write not verified` |
| `npc_con_negative` | Direct alias: `npc_con_negative` | `COMPUTED` | `npc_con_negative` is a direct alias that provides convenient ScriptCards access to the Beacon data described in the location column. | `Write not verified` |
| `npc_con_save` | Direct alias: `npc_con_save` | `COMPUTED` | `npc_con_save` is a direct alias that provides convenient ScriptCards access to the Beacon data described in the location column. | `Write not verified` |
| `npc_con_save_base` | Direct alias: `npc_con_save_base` | `COMPUTED` | `npc_con_save_base` is a direct alias that provides convenient ScriptCards access to the Beacon data described in the location column. | `Write not verified` |
| `npc_con_save_flag` | Direct alias: `npc_con_save_flag` | `COMPUTED` | `npc_con_save_flag` is a direct alias that provides convenient ScriptCards access to the Beacon data described in the location column. | `Write not verified` |
| `npc_dex_negative` | Direct alias: `npc_dex_negative` | `COMPUTED` | `npc_dex_negative` is a direct alias that provides convenient ScriptCards access to the Beacon data described in the location column. | `Write not verified` |
| `npc_dex_save` | Direct alias: `npc_dex_save` | `COMPUTED` | `npc_dex_save` is a direct alias that provides convenient ScriptCards access to the Beacon data described in the location column. | `Write not verified` |
| `npc_dex_save_base` | Direct alias: `npc_dex_save_base` | `COMPUTED` | `npc_dex_save_base` is a direct alias that provides convenient ScriptCards access to the Beacon data described in the location column. | `Write not verified` |
| `npc_dex_save_flag` | Direct alias: `npc_dex_save_flag` | `COMPUTED` | `npc_dex_save_flag` is a direct alias that provides convenient ScriptCards access to the Beacon data described in the location column. | `Write not verified` |
| `npc_int_negative` | Direct alias: `npc_int_negative` | `COMPUTED` | `npc_int_negative` is a direct alias that provides convenient ScriptCards access to the Beacon data described in the location column. | `Write not verified` |
| `npc_int_save` | Direct alias: `npc_int_save` | `COMPUTED` | `npc_int_save` is a direct alias that provides convenient ScriptCards access to the Beacon data described in the location column. | `Write not verified` |
| `npc_int_save_base` | Direct alias: `npc_int_save_base` | `COMPUTED` | `npc_int_save_base` is a direct alias that provides convenient ScriptCards access to the Beacon data described in the location column. | `Write not verified` |
| `npc_int_save_flag` | Direct alias: `npc_int_save_flag` | `COMPUTED` | `npc_int_save_flag` is a direct alias that provides convenient ScriptCards access to the Beacon data described in the location column. | `Write not verified` |
| `npc_str_negative` | Direct alias: `npc_str_negative` | `COMPUTED` | `npc_str_negative` is a direct alias that provides convenient ScriptCards access to the Beacon data described in the location column. | `Write not verified` |
| `npc_str_save` | Direct alias: `npc_str_save` | `COMPUTED` | `npc_str_save` is a direct alias that provides convenient ScriptCards access to the Beacon data described in the location column. | `Write not verified` |
| `npc_str_save_base` | Direct alias: `npc_str_save_base` | `COMPUTED` | `npc_str_save_base` is a direct alias that provides convenient ScriptCards access to the Beacon data described in the location column. | `Write not verified` |
| `npc_str_save_flag` | Direct alias: `npc_str_save_flag` | `COMPUTED` | `npc_str_save_flag` is a direct alias that provides convenient ScriptCards access to the Beacon data described in the location column. | `Write not verified` |
| `npc_wis_negative` | Direct alias: `npc_wis_negative` | `COMPUTED` | `npc_wis_negative` is a direct alias that provides convenient ScriptCards access to the Beacon data described in the location column. | `Write not verified` |
| `npc_wis_save` | Direct alias: `npc_wis_save` | `COMPUTED` | `npc_wis_save` is a direct alias that provides convenient ScriptCards access to the Beacon data described in the location column. | `Write not verified` |
| `npc_wis_save_base` | Direct alias: `npc_wis_save_base` | `COMPUTED` | `npc_wis_save_base` is a direct alias that provides convenient ScriptCards access to the Beacon data described in the location column. | `Write not verified` |
| `npc_wis_save_flag` | Direct alias: `npc_wis_save_flag` | `COMPUTED` | `npc_wis_save_flag` is a direct alias that provides convenient ScriptCards access to the Beacon data described in the location column. | `Write not verified` |

#### Repeating attack fields

> **Value roles**
>
> - `COMPUTED` — A calculated or aggregated result. Change the named source input rather than writing the result.
>
> **Write using**
>
> - `Write not verified` — Use the alias for reads; no safe ScriptCards write target has been verified.

| Direct alias | ScriptCards read location | Value role | Description | Write using |
|---|---|---|---|---|
| `atk_desc` | Direct alias: `atk_desc` | `COMPUTED` | `atk_desc` is a direct alias that provides convenient ScriptCards access to the Beacon data described in the location column. | `Write not verified` |
| `atkattr_base` | Direct alias: `atkattr_base` | `COMPUTED` | `atkattr_base` is a direct alias that provides convenient ScriptCards access to the Beacon data described in the location column. | `Write not verified` |
| `atkbonus` | Direct alias: `atkbonus` | `COMPUTED` | `atkbonus` is a direct alias that provides convenient ScriptCards access to the Beacon data described in the location column. | `Write not verified` |
| `atkcritrange` | Direct alias: `atkcritrange` | `COMPUTED` | `atkcritrange` is a direct alias that provides convenient ScriptCards access to the Beacon data described in the location column. | `Write not verified` |
| `atkdmgtype` | Direct alias: `atkdmgtype` | `COMPUTED` | `atkdmgtype` is a direct alias that provides convenient ScriptCards access to the Beacon data described in the location column. | `Write not verified` |
| `atkflag` | Direct alias: `atkflag` | `COMPUTED` | `atkflag` is a direct alias that provides convenient ScriptCards access to the Beacon data described in the location column. | `Write not verified` |
| `atkmagic` | Direct alias: `atkmagic` | `COMPUTED` | `atkmagic` is a direct alias that provides convenient ScriptCards access to the Beacon data described in the location column. | `Write not verified` |
| `atkmod` | Direct alias: `atkmod` | `COMPUTED` | `atkmod` is a direct alias that provides convenient ScriptCards access to the Beacon data described in the location column. | `Write not verified` |
| `atkname` | Direct alias: `atkname` | `COMPUTED` | `atkname` is a direct alias that provides convenient ScriptCards access to the Beacon data described in the location column. | `Write not verified` |
| `atkprofflag` | Direct alias: `atkprofflag` | `COMPUTED` | `atkprofflag` is a direct alias that provides convenient ScriptCards access to the Beacon data described in the location column. | `Write not verified` |
| `atkrange` | Direct alias: `atkrange` | `COMPUTED` | `atkrange` is a direct alias that provides convenient ScriptCards access to the Beacon data described in the location column. | `Write not verified` |
| `attack_crit` | Direct alias: `attack_crit` | `COMPUTED` | `attack_crit` is a direct alias that provides convenient ScriptCards access to the Beacon data described in the location column. | `Write not verified` |
| `attack_crit2` | Direct alias: `attack_crit2` | `COMPUTED` | `attack_crit2` is a direct alias that provides convenient ScriptCards access to the Beacon data described in the location column. | `Write not verified` |
| `attack_damage` | Direct alias: `attack_damage` | `COMPUTED` | `attack_damage` is a direct alias that provides convenient ScriptCards access to the Beacon data described in the location column. | `Write not verified` |
| `attack_damage2` | Direct alias: `attack_damage2` | `COMPUTED` | `attack_damage2` is a direct alias that provides convenient ScriptCards access to the Beacon data described in the location column. | `Write not verified` |
| `attack_damagetype` | Direct alias: `attack_damagetype` | `COMPUTED` | `attack_damagetype` is a direct alias that provides convenient ScriptCards access to the Beacon data described in the location column. | `Write not verified` |
| `attack_damagetype2` | Direct alias: `attack_damagetype2` | `COMPUTED` | `attack_damagetype2` is a direct alias that provides convenient ScriptCards access to the Beacon data described in the location column. | `Write not verified` |
| `attack_flag` | Direct alias: `attack_flag` | `COMPUTED` | `attack_flag` is a direct alias that provides convenient ScriptCards access to the Beacon data described in the location column. | `Write not verified` |
| `attack_onhit` | Direct alias: `attack_onhit` | `COMPUTED` | `attack_onhit` is a direct alias that provides convenient ScriptCards access to the Beacon data described in the location column. | `Write not verified` |
| `attack_range` | Direct alias: `attack_range` | `COMPUTED` | `attack_range` is a direct alias that provides convenient ScriptCards access to the Beacon data described in the location column. | `Write not verified` |
| `attack_target` | Direct alias: `attack_target` | `COMPUTED` | `attack_target` is a direct alias that provides convenient ScriptCards access to the Beacon data described in the location column. | `Write not verified` |
| `attack_tohit` | Direct alias: `attack_tohit` | `COMPUTED` | `attack_tohit` is a direct alias that provides convenient ScriptCards access to the Beacon data described in the location column. | `Write not verified` |
| `attack_tohitrange` | Direct alias: `attack_tohitrange` | `COMPUTED` | `attack_tohitrange` is a direct alias that provides convenient ScriptCards access to the Beacon data described in the location column. | `Write not verified` |
| `attack_type` | Direct alias: `attack_type` | `COMPUTED` | `attack_type` is a direct alias that provides convenient ScriptCards access to the Beacon data described in the location column. | `Write not verified` |
| `desc` | Direct alias: `desc` | `COMPUTED` | `desc` is a direct alias that provides convenient ScriptCards access to the Beacon data described in the location column. | `Write not verified` |
| `description` | Direct alias: `description` | `COMPUTED` | `description` is a direct alias that provides convenient ScriptCards access to the Beacon data described in the location column. | `Write not verified` |
| `hasattack` | Direct alias: `hasattack` | `COMPUTED` | `hasattack` is a direct alias that provides convenient ScriptCards access to the Beacon data described in the location column. | `Write not verified` |
| `includedesc` | Direct alias: `includedesc` | `COMPUTED` | `includedesc` is a direct alias that provides convenient ScriptCards access to the Beacon data described in the location column. | `Write not verified` |
| `mod` | Direct alias: `mod` | `COMPUTED` | `mod` is a direct alias that provides convenient ScriptCards access to the Beacon data described in the location column. | `Write not verified` |
| `show_desc` | Direct alias: `show_desc` | `COMPUTED` | `show_desc` is a direct alias that provides convenient ScriptCards access to the Beacon data described in the location column. | `Write not verified` |

#### Repeating damage fields

> **Value roles**
>
> - `COMPUTED` — A calculated or aggregated result. Change the named source input rather than writing the result.
>
> **Write using**
>
> - `Write not verified` — Use the alias for reads; no safe ScriptCards write target has been verified.

| Direct alias | ScriptCards read location | Value role | Description | Write using |
|---|---|---|---|---|
| `damage_flag` | Direct alias: `damage_flag` | `COMPUTED` | `damage_flag` is a direct alias that provides convenient ScriptCards access to the Beacon data described in the location column. | `Write not verified` |
| `dmg2attr` | Direct alias: `dmg2attr` | `COMPUTED` | `dmg2attr` is a direct alias that provides convenient ScriptCards access to the Beacon data described in the location column. | `Write not verified` |
| `dmg2base` | Direct alias: `dmg2base` | `COMPUTED` | `dmg2base` is a direct alias that provides convenient ScriptCards access to the Beacon data described in the location column. | `Write not verified` |
| `dmg2custcrit` | Direct alias: `dmg2custcrit` | `COMPUTED` | `dmg2custcrit` is a direct alias that provides convenient ScriptCards access to the Beacon data described in the location column. | `Write not verified` |
| `dmg2flag` | Direct alias: `dmg2flag` | `COMPUTED` | `dmg2flag` is a direct alias that provides convenient ScriptCards access to the Beacon data described in the location column. | `Write not verified` |
| `dmg2mod` | Direct alias: `dmg2mod` | `COMPUTED` | `dmg2mod` is a direct alias that provides convenient ScriptCards access to the Beacon data described in the location column. | `Write not verified` |
| `dmg2type` | Direct alias: `dmg2type` | `COMPUTED` | `dmg2type` is a direct alias that provides convenient ScriptCards access to the Beacon data described in the location column. | `Write not verified` |
| `dmgattr` | Direct alias: `dmgattr` | `COMPUTED` | `dmgattr` is a direct alias that provides convenient ScriptCards access to the Beacon data described in the location column. | `Write not verified` |
| `dmgbase` | Direct alias: `dmgbase` | `COMPUTED` | `dmgbase` is a direct alias that provides convenient ScriptCards access to the Beacon data described in the location column. | `Write not verified` |
| `dmgcustcrit` | Direct alias: `dmgcustcrit` | `COMPUTED` | `dmgcustcrit` is a direct alias that provides convenient ScriptCards access to the Beacon data described in the location column. | `Write not verified` |
| `dmgflag` | Direct alias: `dmgflag` | `COMPUTED` | `dmgflag` is a direct alias that provides convenient ScriptCards access to the Beacon data described in the location column. | `Write not verified` |
| `dmgmod` | Direct alias: `dmgmod` | `COMPUTED` | `dmgmod` is a direct alias that provides convenient ScriptCards access to the Beacon data described in the location column. | `Write not verified` |
| `dmgtype` | Direct alias: `dmgtype` | `COMPUTED` | `dmgtype` is a direct alias that provides convenient ScriptCards access to the Beacon data described in the location column. | `Write not verified` |
| `hldmg` | Direct alias: `hldmg` | `COMPUTED` | `hldmg` is a direct alias that provides convenient ScriptCards access to the Beacon data described in the location column. | `Write not verified` |

#### Roll and save output aliases

> **Value roles**
>
> - `COMPUTED` — A calculated or aggregated result. Change the named source input rather than writing the result.
>
> **Write using**
>
> - `Write not verified` — Use the alias for reads; no safe ScriptCards write target has been verified.

| Direct alias | ScriptCards read location | Value role | Description | Write using |
|---|---|---|---|---|
| `advantagetoggle` | Direct alias: `advantagetoggle`<br>Structured path: `sheet->settings->rolls->mode` | `COMPUTED` | `advantagetoggle` is a direct alias that provides convenient ScriptCards access to the Beacon data described in the location column. | `Write not verified` |
| `core_die` | Direct alias: `core_die` | `COMPUTED` | `core_die` is a direct alias that provides convenient ScriptCards access to the Beacon data described in the location column. | `Write not verified` |
| `d20` | Direct alias: `d20`<br>Structured path: `sheet->settings->rolls->mode` | `COMPUTED` | `d20` is a direct alias that provides convenient ScriptCards access to the Beacon data described in the location column. | `Write not verified` |
| `dflag` | Direct alias: `dflag` | `COMPUTED` | `dflag` is a direct alias that provides convenient ScriptCards access to the Beacon data described in the location column. | `Write not verified` |
| `rollbase` | Direct alias: `rollbase` | `COMPUTED` | `rollbase` is a direct alias that provides convenient ScriptCards access to the Beacon data described in the location column. | `Write not verified` |
| `rollbase_crit` | Direct alias: `rollbase_crit` | `COMPUTED` | `rollbase_crit` is a direct alias that provides convenient ScriptCards access to the Beacon data described in the location column. | `Write not verified` |
| `rollbase_dmg` | Direct alias: `rollbase_dmg` | `COMPUTED` | `rollbase_dmg` is a direct alias that provides convenient ScriptCards access to the Beacon data described in the location column. | `Write not verified` |
| `rollcontent` | Direct alias: `rollcontent` | `COMPUTED` | `rollcontent` is a direct alias that provides convenient ScriptCards access to the Beacon data described in the location column. | `Write not verified` |
| `rtype` | Direct alias: `rtype`<br>Structured path: `sheet->settings->rolls->mode` | `COMPUTED` | `rtype` is a direct alias that provides convenient ScriptCards access to the Beacon data described in the location column. | `Write not verified` |
| `saveattr` | Direct alias: `saveattr` | `COMPUTED` | `saveattr` is a direct alias that provides convenient ScriptCards access to the Beacon data described in the location column. | `Write not verified` |
| `savedc` | Direct alias: `savedc` | `COMPUTED` | `savedc` is a direct alias that provides convenient ScriptCards access to the Beacon data described in the location column. | `Write not verified` |
| `saveeffect` | Direct alias: `saveeffect` | `COMPUTED` | `saveeffect` is a direct alias that provides convenient ScriptCards access to the Beacon data described in the location column. | `Write not verified` |
| `saveflag` | Direct alias: `saveflag` | `COMPUTED` | `saveflag` is a direct alias that provides convenient ScriptCards access to the Beacon data described in the location column. | `Write not verified` |
| `saveflat` | Direct alias: `saveflat` | `COMPUTED` | `saveflat` is a direct alias that provides convenient ScriptCards access to the Beacon data described in the location column. | `Write not verified` |
| `whispertoggle` | Direct alias: `whispertoggle`<br>Structured path: `sheet->settings->rolls->privacy` | `COMPUTED` | `whispertoggle` is a direct alias that provides convenient ScriptCards access to the Beacon data described in the location column. | `Write not verified` — Legacy roll-output formatting; use `sheet->settings->rolls->privacy` for new Beacon logic. |
| `wtype` | Direct alias: `wtype`<br>Structured path: `sheet->settings->rolls->privacy` | `COMPUTED` | `wtype` is a direct alias that provides convenient ScriptCards access to the Beacon data described in the location column. | `Write not verified` — Legacy roll-output formatting; use `sheet->settings->rolls->privacy` for new Beacon logic. |

#### Repeating spells

> **Value roles**
>
> - `SYNTH` — A compatibility projection assembled from the parent and linked typed records named in the row.
> - `UNKNOWN` — The character-level direct alias is not exposed by the mapped Beacon interface.
>
> **Write using**
>
> - `Parent typed record` — Edit the existing record or records labeled `Parent typed record:` or `Parent typed records:` in the row.

| Direct alias | ScriptCards read location | Value role | Description | Write using |
|---|---|---|---|---|
| `caster_level` | Direct alias: `caster_level`<br>Parent typed records: `spells`; linked `spellcastings`, `attacks`, `damages`, `upcastings`, and `classlevels` as applicable | `SYNTH` | `caster_level` is a synthetic compatibility field generated from canonical Beacon records rather than an independent stored attribute. | `Parent typed record` |
| `spell_ability` | Character-level direct alias: not exposed by the mapped Beacon interface<br>Fallback result: missing `user.spell_ability` Custom Attribute<br>Canonical source: `spellcastings->[selector]->ability` | `UNKNOWN` | A bare `spell_ability` read falls through to the classic custom-attribute fallback and produces a missing Custom Attribute error. Use the intended Spellcasting record's `ability`; a repeating-spell compatibility row may still expose its own row-level spell ability. | `Parent typed record` — Locate the intended Spellcasting record and change its `ability`. |
| `spell_attack_bonus` | Direct alias: `spell_attack_bonus`<br>Sheet-wide compatibility result; contributing records include `spellcastings`, `rollbonuses`, `abilityscores`, and `classlevels` as applicable | `SYNTH` | Singular sheet-wide compatibility result, not a separate attack bonus for every Spellcasting record. ScriptCards reconstructs it locally only when active Spellcasting records agree on one ability and applicable spell-targeted Roll Bonuses are verified roll-mode or flat numeric modifiers; otherwise the native sheet result remains authoritative. | `Parent typed record` — Change the intended Spellcasting record's `ability` or another contributing canonical input. Do not assume this singular alias represents every spellcasting source. |
| `spell_attack_mod` | Direct alias: `spell_attack_mod`<br>Locally reconstructed from the agreed sheet-wide Spellcasting ability when unambiguous; otherwise native compatibility result | `SYNTH` | Singular compatibility modifier paired with `spell_attack_bonus`; it is not a per-Spellcasting-record modifier on characters with multiple spellcasting sources. ScriptCards returns the selected casting ability modifier locally when active Spellcasting records agree on one ability. | `Parent typed record` — Change the intended Spellcasting record's `ability` or another contributing canonical input. |
| `spell_damage_progression` | Direct alias: `spell_damage_progression`<br>Parent typed records: `spells`; linked `spellcastings`, `attacks`, `damages`, `upcastings`, and `classlevels` as applicable | `SYNTH` | `spell_damage_progression` is a synthetic compatibility field generated from canonical Beacon records rather than an independent stored attribute. | `Parent typed record` |
| `spell_dc_mod` | Direct alias: `spell_dc_mod`<br>Locally reconstructed from the agreed sheet-wide Spellcasting ability when unambiguous; otherwise native compatibility result | `SYNTH` | Singular compatibility modifier paired with `spell_save_dc`; it is not a per-Spellcasting-record modifier on characters with multiple spellcasting sources. ScriptCards returns the selected casting ability modifier locally when active Spellcasting records agree on one ability, including numeric `0`. | `Parent typed record` — Change the intended Spellcasting record's `ability` or another contributing canonical input. |
| `spell_innate` | Direct alias: `spell_innate`<br>Parent typed records: `spells`; linked `spellcastings`, `attacks`, `damages`, `upcastings`, and `classlevels` as applicable | `SYNTH` | `spell_innate` is a synthetic compatibility field generated from canonical Beacon records rather than an independent stored attribute. | `Parent typed record` |
| `spell_save_dc` | Direct alias: `spell_save_dc`<br>Sheet-wide compatibility result; contributing records include `spellcastings`, `rollbonuses`, `abilityscores`, and `classlevels` as applicable | `SYNTH` | Singular sheet-wide compatibility result, not a separate save DC for every Spellcasting record. ScriptCards reconstructs it locally only when active Spellcasting records agree on one ability and applicable spell-targeted Roll Bonuses are verified roll-mode or flat numeric modifiers; otherwise the native sheet result remains authoritative. | `Parent typed record` — Change the intended Spellcasting record's `ability` or another contributing canonical input. Do not assume this singular alias represents every spellcasting source. |
| `spellathigherlevels` | Direct alias: `spellathigherlevels`<br>Parent typed records: `spells`; linked `spellcastings`, `attacks`, `damages`, `upcastings`, and `classlevels` as applicable | `SYNTH` | `spellathigherlevels` is a synthetic compatibility field generated from canonical Beacon records rather than an independent stored attribute. | `Parent typed record` |
| `spellattack` | Direct alias: `spellattack`<br>Parent typed records: `spells`; linked `spellcastings`, `attacks`, `damages`, `upcastings`, and `classlevels` as applicable | `SYNTH` | `spellattack` is a synthetic compatibility field generated from canonical Beacon records rather than an independent stored attribute. | `Parent typed record` |
| `spellattackid` | Direct alias: `spellattackid`<br>Parent typed records: `spells`; linked `spellcastings`, `attacks`, `damages`, `upcastings`, and `classlevels` as applicable | `SYNTH` | `spellattackid` is a synthetic compatibility field generated from canonical Beacon records rather than an independent stored attribute. | `Parent typed record` |
| `spellcasting_ability` | Direct alias: `spellcasting_ability`<br>Source inputs: active `spellcastings->[selector]->ability` and the matching ability score | `SYNTH` | Singular modifier-like compatibility output, not an ability name. When all active Spellcasting records agree on one ability, ScriptCards returns that ability modifier with a trailing plus sign, including values such as `3+` or `0+`; otherwise it preserves the native compatibility route. | `Parent typed record` — Read or write the intended Spellcasting record's `ability` instead of treating this alias as a universal character-wide casting ability. |
| `spellcastingtime` | Direct alias: `spellcastingtime`<br>Parent typed records: `spells`; linked `spellcastings`, `attacks`, `damages`, `upcastings`, and `classlevels` as applicable | `SYNTH` | `spellcastingtime` is a synthetic compatibility field generated from canonical Beacon records rather than an independent stored attribute. | `Parent typed record` |
| `spellcomp` | Direct alias: `spellcomp`<br>Parent typed records: `spells`; linked `spellcastings`, `attacks`, `damages`, `upcastings`, and `classlevels` as applicable | `SYNTH` | `spellcomp` is a synthetic compatibility field generated from canonical Beacon records rather than an independent stored attribute. | `Parent typed record` |
| `spellcomp_m` | Direct alias: `spellcomp_m`<br>Parent typed records: `spells`; linked `spellcastings`, `attacks`, `damages`, `upcastings`, and `classlevels` as applicable | `SYNTH` | `spellcomp_m` is a synthetic compatibility field generated from canonical Beacon records rather than an independent stored attribute. | `Parent typed record` |
| `spellcomp_materials` | Direct alias: `spellcomp_materials`<br>Parent typed records: `spells`; linked `spellcastings`, `attacks`, `damages`, `upcastings`, and `classlevels` as applicable | `SYNTH` | `spellcomp_materials` is a synthetic compatibility field generated from canonical Beacon records rather than an independent stored attribute. | `Parent typed record` |
| `spellcomp_s` | Direct alias: `spellcomp_s`<br>Parent typed records: `spells`; linked `spellcastings`, `attacks`, `damages`, `upcastings`, and `classlevels` as applicable | `SYNTH` | `spellcomp_s` is a synthetic compatibility field generated from canonical Beacon records rather than an independent stored attribute. | `Parent typed record` |
| `spellcomp_v` | Direct alias: `spellcomp_v`<br>Parent typed records: `spells`; linked `spellcastings`, `attacks`, `damages`, `upcastings`, and `classlevels` as applicable | `SYNTH` | `spellcomp_v` is a synthetic compatibility field generated from canonical Beacon records rather than an independent stored attribute. | `Parent typed record` |
| `spellconcentration` | Direct alias: `spellconcentration`<br>Parent typed records: `spells`; linked `spellcastings`, `attacks`, `damages`, `upcastings`, and `classlevels` as applicable | `SYNTH` | `spellconcentration` is a synthetic compatibility field generated from canonical Beacon records rather than an independent stored attribute. | `Parent typed record` |
| `spelldamage` | Direct alias: `spelldamage`<br>Parent typed records: `spells`; linked `spellcastings`, `attacks`, `damages`, `upcastings`, and `classlevels` as applicable | `SYNTH` | `spelldamage` is a synthetic compatibility field generated from canonical Beacon records rather than an independent stored attribute. | `Parent typed record` |
| `spelldamage2` | Direct alias: `spelldamage2`<br>Parent typed records: `spells`; linked `spellcastings`, `attacks`, `damages`, `upcastings`, and `classlevels` as applicable | `SYNTH` | `spelldamage2` is a synthetic compatibility field generated from canonical Beacon records rather than an independent stored attribute. | `Parent typed record` |
| `spelldamagetype` | Direct alias: `spelldamagetype`<br>Parent typed records: `spells`; linked `spellcastings`, `attacks`, `damages`, `upcastings`, and `classlevels` as applicable | `SYNTH` | `spelldamagetype` is a synthetic compatibility field generated from canonical Beacon records rather than an independent stored attribute. | `Parent typed record` |
| `spelldamagetype2` | Direct alias: `spelldamagetype2`<br>Parent typed records: `spells`; linked `spellcastings`, `attacks`, `damages`, `upcastings`, and `classlevels` as applicable | `SYNTH` | `spelldamagetype2` is a synthetic compatibility field generated from canonical Beacon records rather than an independent stored attribute. | `Parent typed record` |
| `spelldescription` | Direct alias: `spelldescription`<br>Parent typed records: `spells`; linked `spellcastings`, `attacks`, `damages`, `upcastings`, and `classlevels` as applicable | `SYNTH` | `spelldescription` is a synthetic compatibility field generated from canonical Beacon records rather than an independent stored attribute. | `Parent typed record` |
| `spelldmgmod` | Direct alias: `spelldmgmod`<br>Parent typed records: `spells`; linked `spellcastings`, `attacks`, `damages`, `upcastings`, and `classlevels` as applicable | `SYNTH` | `spelldmgmod` is a synthetic compatibility field generated from canonical Beacon records rather than an independent stored attribute. | `Parent typed record` |
| `spellduration` | Direct alias: `spellduration`<br>Parent typed records: `spells`; linked `spellcastings`, `attacks`, `damages`, `upcastings`, and `classlevels` as applicable | `SYNTH` | `spellduration` is a synthetic compatibility field generated from canonical Beacon records rather than an independent stored attribute. | `Parent typed record` |
| `spellhealing` | Direct alias: `spellhealing`<br>Parent typed records: `spells`; linked `spellcastings`, `attacks`, `damages`, `upcastings`, and `classlevels` as applicable | `SYNTH` | `spellhealing` is a synthetic compatibility field generated from canonical Beacon records rather than an independent stored attribute. | `Parent typed record` |
| `spellhlbonus` | Direct alias: `spellhlbonus`<br>Parent typed records: `spells`; linked `spellcastings`, `attacks`, `damages`, `upcastings`, and `classlevels` as applicable | `SYNTH` | `spellhlbonus` is a synthetic compatibility field generated from canonical Beacon records rather than an independent stored attribute. | `Parent typed record` |
| `spellhldie` | Direct alias: `spellhldie`<br>Parent typed records: `spells`; linked `spellcastings`, `attacks`, `damages`, `upcastings`, and `classlevels` as applicable | `SYNTH` | `spellhldie` is a synthetic compatibility field generated from canonical Beacon records rather than an independent stored attribute. | `Parent typed record` |
| `spellhldietype` | Direct alias: `spellhldietype`<br>Parent typed records: `spells`; linked `spellcastings`, `attacks`, `damages`, `upcastings`, and `classlevels` as applicable | `SYNTH` | `spellhldietype` is a synthetic compatibility field generated from canonical Beacon records rather than an independent stored attribute. | `Parent typed record` |
| `spellicon_flag` | Direct alias: `spellicon_flag`<br>Parent typed records: `spells`; linked `spellcastings`, `attacks`, `damages`, `upcastings`, and `classlevels` as applicable | `SYNTH` | `spellicon_flag` is a synthetic compatibility field generated from canonical Beacon records rather than an independent stored attribute. | `Parent typed record` |
| `spellid` | Direct alias: `spellid`<br>Parent typed records: `spells`; linked `spellcastings`, `attacks`, `damages`, `upcastings`, and `classlevels` as applicable | `SYNTH` | `spellid` is a synthetic compatibility field generated from canonical Beacon records rather than an independent stored attribute. | `Parent typed record` |
| `spelllevel` | Direct alias: `spelllevel`<br>Parent typed records: `spells`; linked `spellcastings`, `attacks`, `damages`, `upcastings`, and `classlevels` as applicable | `SYNTH` | `spelllevel` is a synthetic compatibility field generated from canonical Beacon records rather than an independent stored attribute. | `Parent typed record` |
| `spellname` | Direct alias: `spellname`<br>Parent typed records: `spells`; linked `spellcastings`, `attacks`, `damages`, `upcastings`, and `classlevels` as applicable | `SYNTH` | `spellname` is a synthetic compatibility field generated from canonical Beacon records rather than an independent stored attribute. | `Parent typed record` |
| `spelloutput` | Direct alias: `spelloutput`<br>Parent typed records: `spells`; linked `spellcastings`, `attacks`, `damages`, `upcastings`, and `classlevels` as applicable | `SYNTH` | `spelloutput` is a synthetic compatibility field generated from canonical Beacon records rather than an independent stored attribute. | `Parent typed record` |
| `spellprepared` | Direct alias: `spellprepared`<br>Parent typed records: `spells`; linked `spellcastings`, `attacks`, `damages`, `upcastings`, and `classlevels` as applicable | `SYNTH` | `spellprepared` is a synthetic compatibility field generated from canonical Beacon records rather than an independent stored attribute. | `Parent typed record` |
| `spellrange` | Direct alias: `spellrange`<br>Parent typed records: `spells`; linked `spellcastings`, `attacks`, `damages`, `upcastings`, and `classlevels` as applicable | `SYNTH` | `spellrange` is a synthetic compatibility field generated from canonical Beacon records rather than an independent stored attribute. | `Parent typed record` |
| `spellritual` | Direct alias: `spellritual`<br>Parent typed records: `spells`; linked `spellcastings`, `attacks`, `damages`, `upcastings`, and `classlevels` as applicable | `SYNTH` | `spellritual` is a synthetic compatibility field generated from canonical Beacon records rather than an independent stored attribute. | `Parent typed record` |
| `spellsave` | Direct alias: `spellsave`<br>Parent typed records: `spells`; linked `spellcastings`, `attacks`, `damages`, `upcastings`, and `classlevels` as applicable | `SYNTH` | `spellsave` is a synthetic compatibility field generated from canonical Beacon records rather than an independent stored attribute. | `Parent typed record` |
| `spellsavesuccess` | Direct alias: `spellsavesuccess`<br>Parent typed records: `spells`; linked `spellcastings`, `attacks`, `damages`, `upcastings`, and `classlevels` as applicable | `SYNTH` | `spellsavesuccess` is a synthetic compatibility field generated from canonical Beacon records rather than an independent stored attribute. | `Parent typed record` |
| `spellschool` | Direct alias: `spellschool`<br>Parent typed records: `spells`; linked `spellcastings`, `attacks`, `damages`, `upcastings`, and `classlevels` as applicable | `SYNTH` | `spellschool` is a synthetic compatibility field generated from canonical Beacon records rather than an independent stored attribute. | `Parent typed record` |
| `spelltarget` | Direct alias: `spelltarget`<br>Parent typed records: `spells`; linked `spellcastings`, `attacks`, `damages`, `upcastings`, and `classlevels` as applicable | `SYNTH` | `spelltarget` is a synthetic compatibility field generated from canonical Beacon records rather than an independent stored attribute. | `Parent typed record` |

#### Inventory and repeating items

> **Value roles**
>
> - `SYNTH` — A compatibility projection assembled from the parent and linked typed records named in the row.
>
> **Write using**
>
> - `Parent typed record` — Edit the existing record or records labeled `Parent typed record:` or `Parent typed records:` in the row.

| Direct alias | ScriptCards read location | Value role | Description | Write using |
|---|---|---|---|---|
| `ammo` | Direct alias: `ammo`<br>Parent typed records: `items`; linked `attunements`, `attacks`, `damages`, `resources`, `armorclasses`, and `weaponmasteries` as applicable | `SYNTH` | `ammo` is a synthetic compatibility field generated from canonical Beacon records rather than an independent stored attribute. | `Parent typed record` |
| `ammotracking` | Direct alias: `ammotracking`<br>Parent typed records: `items`; linked `attunements`, `attacks`, `damages`, `resources`, `armorclasses`, and `weaponmasteries` as applicable | `SYNTH` | `ammotracking` is a synthetic compatibility field generated from canonical Beacon records rather than an independent stored attribute. | `Parent typed record` |
| `equipment` | Direct alias: `equipment`<br>Structured path: `sheet->inventory->equipmentDisplayOrder`<br>Parent typed records: `items`; linked `attunements`, `attacks`, `damages`, `resources`, `armorclasses`, and `weaponmasteries` as applicable | `SYNTH` | `equipment` is a synthetic compatibility field generated from canonical Beacon records rather than an independent stored attribute. | `Parent typed record` |
| `equipped` | Direct alias: `equipped`<br>Parent typed records: `items`; linked `attunements`, `attacks`, `damages`, `resources`, `armorclasses`, and `weaponmasteries` as applicable | `SYNTH` | `equipped` is a synthetic compatibility field generated from canonical Beacon records rather than an independent stored attribute. | `Parent typed record` |
| `inventorysubflag` | Direct alias: `inventorysubflag`<br>Parent typed records: `items`; linked `attunements`, `attacks`, `damages`, `resources`, `armorclasses`, and `weaponmasteries` as applicable | `SYNTH` | `inventorysubflag` is a synthetic compatibility field generated from canonical Beacon records rather than an independent stored attribute. | `Parent typed record` |
| `itemattackid` | Direct alias: `itemattackid`<br>Parent typed records: `items`; linked `attunements`, `attacks`, `damages`, `resources`, `armorclasses`, and `weaponmasteries` as applicable | `SYNTH` | `itemattackid` is a synthetic compatibility field generated from canonical Beacon records rather than an independent stored attribute. | `Parent typed record` |
| `itemcontent` | Direct alias: `itemcontent`<br>Parent typed records: `items`; linked `attunements`, `attacks`, `damages`, `resources`, `armorclasses`, and `weaponmasteries` as applicable | `SYNTH` | `itemcontent` is a synthetic compatibility field generated from canonical Beacon records rather than an independent stored attribute. | `Parent typed record` |
| `itemcount` | Direct alias: `itemcount`<br>Parent typed records: `items`; linked `attunements`, `attacks`, `damages`, `resources`, `armorclasses`, and `weaponmasteries` as applicable | `SYNTH` | `itemcount` is a synthetic compatibility field generated from canonical Beacon records rather than an independent stored attribute. | `Parent typed record` |
| `itemid` | Direct alias: `itemid`<br>Parent typed records: `items`; linked `attunements`, `attacks`, `damages`, `resources`, `armorclasses`, and `weaponmasteries` as applicable | `SYNTH` | `itemid` is a synthetic compatibility field generated from canonical Beacon records rather than an independent stored attribute. | `Parent typed record` |
| `itemmodifiers` | Direct alias: `itemmodifiers`<br>Parent typed records: `items`; linked `attunements`, `attacks`, `damages`, `resources`, `armorclasses`, and `weaponmasteries` as applicable | `SYNTH` | `itemmodifiers` is a synthetic compatibility field generated from canonical Beacon records rather than an independent stored attribute. | `Parent typed record` |
| `itemname` | Direct alias: `itemname`<br>Parent typed records: `items`; linked `attunements`, `attacks`, `damages`, `resources`, `armorclasses`, and `weaponmasteries` as applicable | `SYNTH` | `itemname` is a synthetic compatibility field generated from canonical Beacon records rather than an independent stored attribute. | `Parent typed record` |
| `itemproperties` | Direct alias: `itemproperties`<br>Parent typed records: `items`; linked `attunements`, `attacks`, `damages`, `resources`, `armorclasses`, and `weaponmasteries` as applicable | `SYNTH` | `itemproperties` is a synthetic compatibility field generated from canonical Beacon records rather than an independent stored attribute. | `Parent typed record` |
| `itemresourceid` | Direct alias: `itemresourceid`<br>Parent typed records: `items`; linked `attunements`, `attacks`, `damages`, `resources`, `armorclasses`, and `weaponmasteries` as applicable | `SYNTH` | `itemresourceid` is a synthetic compatibility field generated from canonical Beacon records rather than an independent stored attribute. | `Parent typed record` |
| `itemweight` | Direct alias: `itemweight`<br>Parent typed records: `items`; linked `attunements`, `attacks`, `damages`, `resources`, `armorclasses`, and `weaponmasteries` as applicable | `SYNTH` | `itemweight` is a synthetic compatibility field generated from canonical Beacon records rather than an independent stored attribute. | `Parent typed record` |
| `simpleinventory` | Direct alias: `simpleinventory`<br>Structured path: `sheet->settings->layoutState`<br>Parent typed records: `items`; linked `attunements`, `attacks`, `damages`, `resources`, `armorclasses`, and `weaponmasteries` as applicable | `SYNTH` | `simpleinventory` is a synthetic compatibility field generated from canonical Beacon records rather than an independent stored attribute. | `Parent typed record` |
| `treasure` | Direct alias: `treasure`<br>Parent typed records: `items`; linked `attunements`, `attacks`, `damages`, `resources`, `armorclasses`, and `weaponmasteries` as applicable | `SYNTH` | `treasure` is a synthetic compatibility field generated from canonical Beacon records rather than an independent stored attribute. | `Parent typed record` — Synthetic compatibility value; for direct NPC Treasure text use `sheet->npc->treasure`. |
| `useasresource` | Direct alias: `useasresource`<br>Parent typed records: `items`; linked `attunements`, `attacks`, `damages`, `resources`, `armorclasses`, and `weaponmasteries` as applicable | `SYNTH` | `useasresource` is a synthetic compatibility field generated from canonical Beacon records rather than an independent stored attribute. | `Parent typed record` |
| `weighttotal` | Direct alias: `weighttotal`<br>Parent typed records: `items`; linked `attunements`, `attacks`, `damages`, `resources`, `armorclasses`, and `weaponmasteries` as applicable | `SYNTH` | `weighttotal` is a synthetic compatibility field generated from canonical Beacon records rather than an independent stored attribute. | `Parent typed record` |

#### Resources

> **Value roles**
>
> - `COMPUTED` — A calculated or aggregated result. Change the named source input rather than writing the result.
> - `UNKNOWN` — The alias has no unambiguous character-wide projection.
>
> **Write using**
>
> - `Write not verified` — Use the alias for reads; no safe ScriptCards write target has been verified.
> - `Typed collection` — Select the exact existing Resource record instead of using an ambiguous aggregate alias.

| Direct alias | ScriptCards read location | Value role | Description | Write using |
|---|---|---|---|---|
| `class_resource` | Direct alias: `class_resource`<br>Canonical alternative: `resources->[selector]->value` | `UNKNOWN` | Deliberately returns `undefined` without a native read because the sheet does not expose an unambiguous single class-resource projection. | `Typed collection`: select the intended `resources` record |
| `class_resource_max` | Direct alias: `class_resource_max`<br>Canonical alternative: `resources->[selector]->maxValueFormula` | `UNKNOWN` | Deliberately returns `undefined` without a native read because more than one class Resource can exist. | `Typed collection`: select the intended `resources` record |
| `class_resource_name` | Direct alias: `class_resource_name`<br>Canonical alternative: `resources->[selector]->name` | `UNKNOWN` | Deliberately returns `undefined` without a native read. | `Typed collection`: select the intended `resources` record |
| `other_resource` | Direct alias: `other_resource`<br>Canonical alternative: `resources->[selector]->value` | `UNKNOWN` | Deliberately returns `undefined` without a native read because `other` does not identify one canonical Resource. | `Typed collection`: select the intended `resources` record |
| `other_resource_itemid` | Direct alias: `other_resource_itemid` | `COMPUTED` | `other_resource_itemid` is a direct alias that provides convenient ScriptCards access to the Beacon data described in the location column. | `Write not verified` |
| `other_resource_max` | Direct alias: `other_resource_max`<br>Canonical alternative: `resources->[selector]->maxValueFormula` | `UNKNOWN` | Deliberately returns `undefined` without a native read. | `Typed collection`: select the intended `resources` record |
| `other_resource_name` | Direct alias: `other_resource_name`<br>Canonical alternative: `resources->[selector]->name` | `UNKNOWN` | Deliberately returns `undefined` without a native read. | `Typed collection`: select the intended `resources` record |
| `resource_left` | Direct alias: `resource_left` | `COMPUTED` | `resource_left` is a direct alias that provides convenient ScriptCards access to the Beacon data described in the location column. | `Write not verified` |
| `resource_left_itemid` | Direct alias: `resource_left_itemid` | `COMPUTED` | `resource_left_itemid` is a direct alias that provides convenient ScriptCards access to the Beacon data described in the location column. | `Write not verified` |
| `resource_left_max` | Direct alias: `resource_left_max` | `COMPUTED` | `resource_left_max` is a direct alias that provides convenient ScriptCards access to the Beacon data described in the location column. | `Write not verified` |
| `resource_left_name` | Direct alias: `resource_left_name` | `COMPUTED` | `resource_left_name` is a direct alias that provides convenient ScriptCards access to the Beacon data described in the location column. | `Write not verified` |
| `resource_right` | Direct alias: `resource_right` | `COMPUTED` | `resource_right` is a direct alias that provides convenient ScriptCards access to the Beacon data described in the location column. | `Write not verified` |
| `resource_right_itemid` | Direct alias: `resource_right_itemid` | `COMPUTED` | `resource_right_itemid` is a direct alias that provides convenient ScriptCards access to the Beacon data described in the location column. | `Write not verified` |
| `resource_right_max` | Direct alias: `resource_right_max` | `COMPUTED` | `resource_right_max` is a direct alias that provides convenient ScriptCards access to the Beacon data described in the location column. | `Write not verified` |
| `resource_right_name` | Direct alias: `resource_right_name` | `COMPUTED` | `resource_right_name` is a direct alias that provides convenient ScriptCards access to the Beacon data described in the location column. | `Write not verified` |

#### Ability scores and saving throws

> **Value roles**
>
> - `COMPUTED` — A calculated or aggregated result. Change the named source input rather than writing the result.
>
> **Write using**
>
> - `Typed collection` — Locate the matching existing record through the location labeled `Typed collection:` or `Typed collections:` in the row. When the row names a field, write that field; otherwise use the corresponding typed-collection table below to choose the existing primitive field that represents the intended change.

| Direct alias | ScriptCards read location | Value role | Description | Write using |
|---|---|---|---|---|
| `charisma_save_prof` | Direct alias: `charisma_save_prof`<br>Typed collection: `proficiencies->[selector]->proficiencyLevel`<br>Match: `category = Saving Throw`; `proficiency = Charisma` | `COMPUTED` | `charisma_save_prof` is a derived proficiency-presence flag from the matching Saving Throw Proficiency record. | `Typed collection` |
| `constitution_save_prof` | Direct alias: `constitution_save_prof`<br>Typed collection: `proficiencies->[selector]->proficiencyLevel`<br>Match: `category = Saving Throw`; `proficiency = Constitution` | `COMPUTED` | `constitution_save_prof` is a derived proficiency-presence flag from the matching Saving Throw Proficiency record. | `Typed collection` |
| `dexterity_save_prof` | Direct alias: `dexterity_save_prof`<br>Typed collection: `proficiencies->[selector]->proficiencyLevel`<br>Match: `category = Saving Throw`; `proficiency = Dexterity` | `COMPUTED` | `dexterity_save_prof` is a derived proficiency-presence flag from the matching Saving Throw Proficiency record. | `Typed collection` |
| `intelligence_save_prof` | Direct alias: `intelligence_save_prof`<br>Typed collection: `proficiencies->[selector]->proficiencyLevel`<br>Match: `category = Saving Throw`; `proficiency = Intelligence` | `COMPUTED` | `intelligence_save_prof` is a derived proficiency-presence flag from the matching Saving Throw Proficiency record. | `Typed collection` |
| `strength_save_prof` | Direct alias: `strength_save_prof`<br>Typed collection: `proficiencies->[selector]->proficiencyLevel`<br>Match: `category = Saving Throw`; `proficiency = Strength` | `COMPUTED` | `strength_save_prof` is a derived proficiency-presence flag from the matching Saving Throw Proficiency record. | `Typed collection` |
| `wisdom_save_prof` | Direct alias: `wisdom_save_prof`<br>Typed collection: `proficiencies->[selector]->proficiencyLevel`<br>Match: `category = Saving Throw`; `proficiency = Wisdom` | `COMPUTED` | `wisdom_save_prof` is a derived proficiency-presence flag from the matching Saving Throw Proficiency record. | `Typed collection` |

#### Skills and passive checks

> **Value roles**
>
> - `COMPUTED` — A calculated or aggregated result. Change the named source input rather than writing the result.
>
> **Write using**
>
> - `Typed collection` — Locate the matching existing record through the location labeled `Typed collection:` or `Typed collections:` in the row. When the row names a field, write that field; otherwise use the corresponding typed-collection table below to choose the existing primitive field that represents the intended change.

| Direct alias | ScriptCards read location | Value role | Description | Write using |
|---|---|---|---|---|
| `acrobatics_prof` | Direct alias: `acrobatics_prof`<br>Typed collection: `proficiencies->[selector]->proficiencyLevel`<br>Match: `category = Skill`; `proficiency = Acrobatics` | `COMPUTED` | `acrobatics_prof` is a derived proficiency-presence flag from the matching Skill Proficiency record. | `Typed collection` |
| `acrobatics_type` | Direct alias: `acrobatics_type`<br>Typed collection: `proficiencies->[selector]->proficiencyLevel`<br>Match: `category = Skill`; `proficiency = Acrobatics` | `COMPUTED` | `acrobatics_type` is a derived proficiency-tier code from `proficiencyLevel`; `2` was observed for Expertise. | `Typed collection` |
| `animal_handling_prof` | Direct alias: `animal_handling_prof`<br>Typed collection: `proficiencies->[selector]->proficiencyLevel`<br>Match: `category = Skill`; `proficiency = Animal Handling` | `COMPUTED` | `animal_handling_prof` is a derived proficiency-presence flag from the matching Skill Proficiency record. | `Typed collection` |
| `animal_handling_type` | Direct alias: `animal_handling_type`<br>Typed collection: `proficiencies->[selector]->proficiencyLevel`<br>Match: `category = Skill`; `proficiency = Animal Handling` | `COMPUTED` | `animal_handling_type` is a derived proficiency-tier code from `proficiencyLevel`; `2` was observed for Expertise. | `Typed collection` |
| `arcana_prof` | Direct alias: `arcana_prof`<br>Typed collection: `proficiencies->[selector]->proficiencyLevel`<br>Match: `category = Skill`; `proficiency = Arcana` | `COMPUTED` | `arcana_prof` is a derived proficiency-presence flag from the matching Skill Proficiency record. | `Typed collection` |
| `arcana_type` | Direct alias: `arcana_type`<br>Typed collection: `proficiencies->[selector]->proficiencyLevel`<br>Match: `category = Skill`; `proficiency = Arcana` | `COMPUTED` | `arcana_type` is a derived proficiency-tier code from `proficiencyLevel`; `2` was observed for Expertise. | `Typed collection` |
| `athletics_prof` | Direct alias: `athletics_prof`<br>Typed collection: `proficiencies->[selector]->proficiencyLevel`<br>Match: `category = Skill`; `proficiency = Athletics` | `COMPUTED` | `athletics_prof` is a derived proficiency-presence flag from the matching Skill Proficiency record. | `Typed collection` |
| `athletics_type` | Direct alias: `athletics_type`<br>Typed collection: `proficiencies->[selector]->proficiencyLevel`<br>Match: `category = Skill`; `proficiency = Athletics` | `COMPUTED` | `athletics_type` is a derived proficiency-tier code from `proficiencyLevel`; `2` was observed for Expertise. | `Typed collection` |
| `deception_prof` | Direct alias: `deception_prof`<br>Typed collection: `proficiencies->[selector]->proficiencyLevel`<br>Match: `category = Skill`; `proficiency = Deception` | `COMPUTED` | `deception_prof` is a derived proficiency-presence flag from the matching Skill Proficiency record. | `Typed collection` |
| `deception_type` | Direct alias: `deception_type`<br>Typed collection: `proficiencies->[selector]->proficiencyLevel`<br>Match: `category = Skill`; `proficiency = Deception` | `COMPUTED` | `deception_type` is a derived proficiency-tier code from `proficiencyLevel`; `2` was observed for Expertise. | `Typed collection` |
| `history_prof` | Direct alias: `history_prof`<br>Typed collection: `proficiencies->[selector]->proficiencyLevel`<br>Match: `category = Skill`; `proficiency = History` | `COMPUTED` | `history_prof` is a derived proficiency-presence flag from the matching Skill Proficiency record. | `Typed collection` |
| `history_type` | Direct alias: `history_type`<br>Typed collection: `proficiencies->[selector]->proficiencyLevel`<br>Match: `category = Skill`; `proficiency = History` | `COMPUTED` | `history_type` is a derived proficiency-tier code from `proficiencyLevel`; `2` was observed for Expertise. | `Typed collection` |
| `insight_prof` | Direct alias: `insight_prof`<br>Typed collection: `proficiencies->[selector]->proficiencyLevel`<br>Match: `category = Skill`; `proficiency = Insight` | `COMPUTED` | `insight_prof` is a derived proficiency-presence flag from the matching Skill Proficiency record. | `Typed collection` |
| `insight_type` | Direct alias: `insight_type`<br>Typed collection: `proficiencies->[selector]->proficiencyLevel`<br>Match: `category = Skill`; `proficiency = Insight` | `COMPUTED` | `insight_type` is a derived proficiency-tier code from `proficiencyLevel`; `2` was observed for Expertise. | `Typed collection` |
| `intimidation_prof` | Direct alias: `intimidation_prof`<br>Typed collection: `proficiencies->[selector]->proficiencyLevel`<br>Match: `category = Skill`; `proficiency = Intimidation` | `COMPUTED` | `intimidation_prof` is a derived proficiency-presence flag from the matching Skill Proficiency record. | `Typed collection` |
| `intimidation_type` | Direct alias: `intimidation_type`<br>Typed collection: `proficiencies->[selector]->proficiencyLevel`<br>Match: `category = Skill`; `proficiency = Intimidation` | `COMPUTED` | `intimidation_type` is a derived proficiency-tier code from `proficiencyLevel`; `2` was observed for Expertise. | `Typed collection` |
| `investigation_prof` | Direct alias: `investigation_prof`<br>Typed collection: `proficiencies->[selector]->proficiencyLevel`<br>Match: `category = Skill`; `proficiency = Investigation` | `COMPUTED` | `investigation_prof` is a derived proficiency-presence flag from the matching Skill Proficiency record. | `Typed collection` |
| `investigation_type` | Direct alias: `investigation_type`<br>Typed collection: `proficiencies->[selector]->proficiencyLevel`<br>Match: `category = Skill`; `proficiency = Investigation` | `COMPUTED` | `investigation_type` is a derived proficiency-tier code from `proficiencyLevel`; `2` was observed for Expertise. | `Typed collection` |
| `medicine_prof` | Direct alias: `medicine_prof`<br>Typed collection: `proficiencies->[selector]->proficiencyLevel`<br>Match: `category = Skill`; `proficiency = Medicine` | `COMPUTED` | `medicine_prof` is a derived proficiency-presence flag from the matching Skill Proficiency record. | `Typed collection` |
| `medicine_type` | Direct alias: `medicine_type`<br>Typed collection: `proficiencies->[selector]->proficiencyLevel`<br>Match: `category = Skill`; `proficiency = Medicine` | `COMPUTED` | `medicine_type` is a derived proficiency-tier code from `proficiencyLevel`; `2` was observed for Expertise. | `Typed collection` |
| `nature_prof` | Direct alias: `nature_prof`<br>Typed collection: `proficiencies->[selector]->proficiencyLevel`<br>Match: `category = Skill`; `proficiency = Nature` | `COMPUTED` | `nature_prof` is a derived proficiency-presence flag from the matching Skill Proficiency record. | `Typed collection` |
| `nature_type` | Direct alias: `nature_type`<br>Typed collection: `proficiencies->[selector]->proficiencyLevel`<br>Match: `category = Skill`; `proficiency = Nature` | `COMPUTED` | `nature_type` is a derived proficiency-tier code from `proficiencyLevel`; `2` was observed for Expertise. | `Typed collection` |
| `perception_prof` | Direct alias: `perception_prof`<br>Typed collection: `proficiencies->[selector]->proficiencyLevel`<br>Match: `category = Skill`; `proficiency = Perception` | `COMPUTED` | `perception_prof` is a derived proficiency-presence flag from the matching Skill Proficiency record. | `Typed collection` |
| `perception_type` | Direct alias: `perception_type`<br>Typed collection: `proficiencies->[selector]->proficiencyLevel`<br>Match: `category = Skill`; `proficiency = Perception` | `COMPUTED` | `perception_type` is a derived proficiency-tier code from `proficiencyLevel`; `2` was observed for Expertise. | `Typed collection` |
| `performance_prof` | Direct alias: `performance_prof`<br>Typed collection: `proficiencies->[selector]->proficiencyLevel`<br>Match: `category = Skill`; `proficiency = Performance` | `COMPUTED` | `performance_prof` is a derived proficiency-presence flag from the matching Skill Proficiency record. | `Typed collection` |
| `performance_type` | Direct alias: `performance_type`<br>Typed collection: `proficiencies->[selector]->proficiencyLevel`<br>Match: `category = Skill`; `proficiency = Performance` | `COMPUTED` | `performance_type` is a derived proficiency-tier code from `proficiencyLevel`; `2` was observed for Expertise. | `Typed collection` |
| `persuasion_prof` | Direct alias: `persuasion_prof`<br>Typed collection: `proficiencies->[selector]->proficiencyLevel`<br>Match: `category = Skill`; `proficiency = Persuasion` | `COMPUTED` | `persuasion_prof` is a derived proficiency-presence flag from the matching Skill Proficiency record. | `Typed collection` |
| `persuasion_type` | Direct alias: `persuasion_type`<br>Typed collection: `proficiencies->[selector]->proficiencyLevel`<br>Match: `category = Skill`; `proficiency = Persuasion` | `COMPUTED` | `persuasion_type` is a derived proficiency-tier code from `proficiencyLevel`; `2` was observed for Expertise. | `Typed collection` |
| `religion_prof` | Direct alias: `religion_prof`<br>Typed collection: `proficiencies->[selector]->proficiencyLevel`<br>Match: `category = Skill`; `proficiency = Religion` | `COMPUTED` | `religion_prof` is a derived proficiency-presence flag from the matching Skill Proficiency record. | `Typed collection` |
| `religion_type` | Direct alias: `religion_type`<br>Typed collection: `proficiencies->[selector]->proficiencyLevel`<br>Match: `category = Skill`; `proficiency = Religion` | `COMPUTED` | `religion_type` is a derived proficiency-tier code from `proficiencyLevel`; `2` was observed for Expertise. | `Typed collection` |
| `sleight_of_hand_prof` | Direct alias: `sleight_of_hand_prof`<br>Typed collection: `proficiencies->[selector]->proficiencyLevel`<br>Match: `category = Skill`; `proficiency = Sleight of Hand` | `COMPUTED` | `sleight_of_hand_prof` is a derived proficiency-presence flag from the matching Skill Proficiency record. | `Typed collection` |
| `sleight_of_hand_type` | Direct alias: `sleight_of_hand_type`<br>Typed collection: `proficiencies->[selector]->proficiencyLevel`<br>Match: `category = Skill`; `proficiency = Sleight of Hand` | `COMPUTED` | `sleight_of_hand_type` is a derived proficiency-tier code from `proficiencyLevel`; `2` was observed for Expertise. | `Typed collection` |
| `stealth_prof` | Direct alias: `stealth_prof`<br>Typed collection: `proficiencies->[selector]->proficiencyLevel`<br>Match: `category = Skill`; `proficiency = Stealth` | `COMPUTED` | `stealth_prof` is a derived proficiency-presence flag from the matching Skill Proficiency record. | `Typed collection` |
| `stealth_type` | Direct alias: `stealth_type`<br>Typed collection: `proficiencies->[selector]->proficiencyLevel`<br>Match: `category = Skill`; `proficiency = Stealth` | `COMPUTED` | `stealth_type` is a derived proficiency-tier code from `proficiencyLevel`; `2` was observed for Expertise. | `Typed collection` |
| `survival_prof` | Direct alias: `survival_prof`<br>Typed collection: `proficiencies->[selector]->proficiencyLevel`<br>Match: `category = Skill`; `proficiency = Survival` | `COMPUTED` | `survival_prof` is a derived proficiency-presence flag from the matching Skill Proficiency record. | `Typed collection` |
| `survival_type` | Direct alias: `survival_type`<br>Typed collection: `proficiencies->[selector]->proficiencyLevel`<br>Match: `category = Skill`; `proficiency = Survival` | `COMPUTED` | `survival_type` is a derived proficiency-tier code from `proficiencyLevel`; `2` was observed for Expertise. | `Typed collection` |

#### Shared character values

> **Value roles**
>
> - `COMPUTED` — A calculated or aggregated result. Change the named source input rather than writing the result.
>
> **Write using**
>
> - `Write not verified` — Use the alias for reads; no safe ScriptCards write target has been verified.

| Direct alias | ScriptCards read location | Value role | Description | Write using |
|---|---|---|---|---|
| `charname_output` | Direct alias: `charname_output` | `COMPUTED` | `charname_output` is a direct alias that provides convenient ScriptCards access to the Beacon data described in the location column. | `Write not verified` |
| `multiclass1` | Direct alias: `multiclass1`<br>Source inputs: `classes`, `classlevels`, and `subclasses` after the primary class is removed | `COMPUTED` | First secondary-class name. Secondary groups are sorted by class name. | `Source inputs`: the matching class graph |
| `multiclass1_flag` | Direct alias: `multiclass1_flag`<br>Source inputs: `classes` and `classlevels` | `COMPUTED` | Returns `1` when the first secondary-class slot exists, otherwise `0`. | `Source inputs`: the matching class graph |
| `multiclass1_lvl` | Direct alias: `multiclass1_lvl`<br>Source inputs: matching active `classlevels` | `COMPUTED` | Sum of positive finite level contributions for the first secondary class. | `Source inputs`: matching `classlevels` records |
| `multiclass1_subclass` | Direct alias: `multiclass1_subclass`<br>Source input: the active `subclasses` record whose `parentID` identifies `multiclass1` | `COMPUTED` | Subclass name for the first secondary class; returns blank when the slot has no subclass. | `Source input`: matching `subclasses` record |
| `multiclass2` | Direct alias: `multiclass2`<br>Source inputs: `classes`, `classlevels`, and `subclasses` after the primary class is removed | `COMPUTED` | Second secondary-class name, or blank when no second secondary class exists. | `Source inputs`: the matching class graph |
| `multiclass2_flag` | Direct alias: `multiclass2_flag`<br>Source inputs: `classes` and `classlevels` | `COMPUTED` | Returns `1` when the second secondary-class slot exists, otherwise `0`. | `Source inputs`: the matching class graph |
| `multiclass2_lvl` | Direct alias: `multiclass2_lvl`<br>Source inputs: matching active `classlevels` | `COMPUTED` | Level for the second secondary class, or blank when the slot does not exist. | `Source inputs`: matching `classlevels` records |
| `multiclass2_subclass` | Direct alias: `multiclass2_subclass`<br>Source input: matching active `subclasses` record | `COMPUTED` | Subclass for the second secondary class, or blank when the slot does not exist or has no subclass. | `Source input`: matching `subclasses` record |
| `multiclass3` | Direct alias: `multiclass3`<br>Source inputs: `classes`, `classlevels`, and `subclasses` after the primary class is removed | `COMPUTED` | Third secondary-class name, or blank when no third secondary class exists. | `Source inputs`: the matching class graph |
| `multiclass3_flag` | Direct alias: `multiclass3_flag`<br>Source inputs: `classes` and `classlevels` | `COMPUTED` | Returns `1` when the third secondary-class slot exists, otherwise `0`. | `Source inputs`: the matching class graph |
| `multiclass3_lvl` | Direct alias: `multiclass3_lvl`<br>Source inputs: matching active `classlevels` | `COMPUTED` | Level for the third secondary class, or blank when the slot does not exist. | `Source inputs`: matching `classlevels` records |
| `multiclass3_subclass` | Direct alias: `multiclass3_subclass`<br>Source input: matching active `subclasses` record | `COMPUTED` | Subclass for the third secondary class, or blank when the slot does not exist or has no subclass. | `Source input`: matching `subclasses` record |
| `name` | Direct alias: `name` | `COMPUTED` | `name` is a direct alias that provides convenient ScriptCards access to the Beacon data described in the location column. | `Write not verified` |
| `npc` | Direct alias: `npc`<br>Structured path: `appState` | `COMPUTED` | `npc` is the compatibility flag derived from whether `appState` is `npc` or `sheet`. | `Write not verified` — Use `appState` in new scripts when you need to distinguish NPC (`npc`) from PC (`sheet`). |
| `npc_name` | Direct alias: `npc_name` | `COMPUTED` | `npc_name` is a direct alias that provides convenient ScriptCards access to the Beacon data described in the location column. | `Write not verified` |
| `subclass` | Direct alias: `subclass`<br>Typed collection: `subclasses` | `COMPUTED` | `subclass` is the translated display value derived from the canonical Subclass record. | `Write not verified` |

#### Tools and proficiencies

> **Value roles**
>
> - `COMPUTED` — A calculated or aggregated result. Change the named source input rather than writing the result.
>
> **Write using**
>
> - `Write not verified` — Use the alias for reads; no safe ScriptCards write target has been verified.

| Direct alias | ScriptCards read location | Value role | Description | Write using |
|---|---|---|---|---|
| `simpleproficencies` | Direct alias: `simpleproficencies` | `COMPUTED` | `simpleproficencies` is a direct alias that provides convenient ScriptCards access to the Beacon data described in the location column. | `Write not verified` |
| `tool_mod` | Direct alias: `tool_mod` | `COMPUTED` | `tool_mod` is a direct alias that provides convenient ScriptCards access to the Beacon data described in the location column. | `Write not verified` |
| `toolattr` | Direct alias: `toolattr` | `COMPUTED` | `toolattr` is a direct alias that provides convenient ScriptCards access to the Beacon data described in the location column. | `Write not verified` |
| `toolattr_base` | Direct alias: `toolattr_base` | `COMPUTED` | `toolattr_base` is a direct alias that provides convenient ScriptCards access to the Beacon data described in the location column. | `Write not verified` |
| `toolbonus` | Direct alias: `toolbonus` | `COMPUTED` | `toolbonus` is a direct alias that provides convenient ScriptCards access to the Beacon data described in the location column. | `Write not verified` |
| `toolbonus_base` | Direct alias: `toolbonus_base` | `COMPUTED` | `toolbonus_base` is a direct alias that provides convenient ScriptCards access to the Beacon data described in the location column. | `Write not verified` |
| `toolbonus_display` | Direct alias: `toolbonus_display` | `COMPUTED` | `toolbonus_display` is a direct alias that provides convenient ScriptCards access to the Beacon data described in the location column. | `Write not verified` |
| `toolname` | Direct alias: `toolname` | `COMPUTED` | `toolname` is a direct alias that provides convenient ScriptCards access to the Beacon data described in the location column. | `Write not verified` |

#### Conditions and exhaustion

> **Value roles**
>
> - `COMPUTED` — A calculated or aggregated result. Change the named source input rather than writing the result.
>
> **Write using**
>
> - `Write not verified` — Use the alias for reads; no safe ScriptCards write target has been verified.

| Direct alias | ScriptCards read location | Value role | Description | Write using |
|---|---|---|---|---|
| `exhaustion_1` | Direct alias: `exhaustion_1` | `COMPUTED` | `exhaustion_1` is a direct alias that provides convenient ScriptCards access to the Beacon data described in the location column. | `Write not verified` |
| `exhaustion_2` | Direct alias: `exhaustion_2` | `COMPUTED` | `exhaustion_2` is a direct alias that provides convenient ScriptCards access to the Beacon data described in the location column. | `Write not verified` |
| `exhaustion_3` | Direct alias: `exhaustion_3` | `COMPUTED` | `exhaustion_3` is a direct alias that provides convenient ScriptCards access to the Beacon data described in the location column. | `Write not verified` |
| `exhaustion_4` | Direct alias: `exhaustion_4` | `COMPUTED` | `exhaustion_4` is a direct alias that provides convenient ScriptCards access to the Beacon data described in the location column. | `Write not verified` |
| `exhaustion_5` | Direct alias: `exhaustion_5` | `COMPUTED` | `exhaustion_5` is a direct alias that provides convenient ScriptCards access to the Beacon data described in the location column. | `Write not verified` |
| `exhaustion_6` | Direct alias: `exhaustion_6` | `COMPUTED` | `exhaustion_6` is a direct alias that provides convenient ScriptCards access to the Beacon data described in the location column. | `Write not verified` |
| `exhaustion_level` | Direct alias: `exhaustion_level` | `COMPUTED` | `exhaustion_level` is a direct alias that provides convenient ScriptCards access to the Beacon data described in the location column. | `Write not verified` |
| `exhaustion_toggle` | Direct alias: `exhaustion_toggle` | `COMPUTED` | `exhaustion_toggle` is a direct alias that provides convenient ScriptCards access to the Beacon data described in the location column. | `Write not verified` |

#### Global roll modifiers

> **Value roles**
>
> - `COMPUTED` — A calculated or aggregated result. Change the named source input rather than writing the result.
> - `UNKNOWN` — The character-level direct alias is not exposed by the mapped Beacon interface.
>
> **Write using**
>
> - `Write not verified` — Use the alias for reads; no safe ScriptCards write target has been verified.
> - `Not mapped` — The character-level direct alias is unavailable and no replacement write route has been verified.

| Direct alias | ScriptCards read location | Value role | Description | Write using |
|---|---|---|---|---|
| `global_ac_active_flag` | Direct alias: `global_ac_active_flag` | `COMPUTED` | `global_ac_active_flag` is a direct alias that provides convenient ScriptCards access to the Beacon data described in the location column. | `Write not verified` |
| `global_ac_mod_flag` | Direct alias: `global_ac_mod_flag` | `COMPUTED` | `global_ac_mod_flag` is a direct alias that provides convenient ScriptCards access to the Beacon data described in the location column. | `Write not verified` |
| `global_ac_name` | Direct alias: `global_ac_name` | `COMPUTED` | `global_ac_name` is a direct alias that provides convenient ScriptCards access to the Beacon data described in the location column. | `Write not verified` |
| `global_ac_val` | Direct alias: `global_ac_val` | `COMPUTED` | `global_ac_val` is a direct alias that provides convenient ScriptCards access to the Beacon data described in the location column. | `Write not verified` |
| `global_attack_active_flag` | Direct alias: `global_attack_active_flag` | `COMPUTED` | `global_attack_active_flag` is a direct alias that provides convenient ScriptCards access to the Beacon data described in the location column. | `Write not verified` |
| `global_attack_mod` | Direct alias: `global_attack_mod` | `COMPUTED` | `global_attack_mod` is a direct alias that provides convenient ScriptCards access to the Beacon data described in the location column. | `Write not verified` |
| `global_attack_mod_flag` | Direct alias: `global_attack_mod_flag` | `COMPUTED` | `global_attack_mod_flag` is a direct alias that provides convenient ScriptCards access to the Beacon data described in the location column. | `Write not verified` |
| `global_attack_rollstring` | Direct alias: `global_attack_rollstring` | `COMPUTED` | `global_attack_rollstring` is a direct alias that provides convenient ScriptCards access to the Beacon data described in the location column. | `Write not verified` |
| `global_damage_active_flag` | Direct alias: `global_damage_active_flag` | `COMPUTED` | `global_damage_active_flag` is a direct alias that provides convenient ScriptCards access to the Beacon data described in the location column. | `Write not verified` |
| `global_damage_mod_crit` | Direct alias: `global_damage_mod_crit` | `COMPUTED` | `global_damage_mod_crit` is a direct alias that provides convenient ScriptCards access to the Beacon data described in the location column. | `Write not verified` |
| `global_damage_mod_flag` | Direct alias: `global_damage_mod_flag` | `COMPUTED` | `global_damage_mod_flag` is a direct alias that provides convenient ScriptCards access to the Beacon data described in the location column. | `Write not verified` |
| `global_damage_mod_roll` | Direct alias: `global_damage_mod_roll` | `COMPUTED` | `global_damage_mod_roll` is a direct alias that provides convenient ScriptCards access to the Beacon data described in the location column. | `Write not verified` |
| `global_damage_mod_type` | Direct alias: `global_damage_mod_type` | `COMPUTED` | `global_damage_mod_type` is a direct alias that provides convenient ScriptCards access to the Beacon data described in the location column. | `Write not verified` |
| `global_damage_rollstring` | Direct alias: `global_damage_rollstring` | `COMPUTED` | `global_damage_rollstring` is a direct alias that provides convenient ScriptCards access to the Beacon data described in the location column. | `Write not verified` |
| `global_damage_type` | Direct alias: `global_damage_type` | `COMPUTED` | `global_damage_type` is a direct alias that provides convenient ScriptCards access to the Beacon data described in the location column. | `Write not verified` |
| `global_save_active_flag` | Direct alias: `global_save_active_flag` | `COMPUTED` | `global_save_active_flag` is a direct alias that provides convenient ScriptCards access to the Beacon data described in the location column. | `Write not verified` |
| `global_save_mod` | Direct alias: `global_save_mod` | `COMPUTED` | `global_save_mod` is a direct alias that provides convenient ScriptCards access to the Beacon data described in the location column. | `Write not verified` |
| `global_save_mod_flag` | Direct alias: `global_save_mod_flag` | `COMPUTED` | `global_save_mod_flag` is a direct alias that provides convenient ScriptCards access to the Beacon data described in the location column. | `Write not verified` |
| `global_save_rollstring` | Direct alias: `global_save_rollstring` | `COMPUTED` | `global_save_rollstring` is a direct alias that provides convenient ScriptCards access to the Beacon data described in the location column. | `Write not verified` |
| `global_skill_active_flag` | Direct alias: `global_skill_active_flag` | `COMPUTED` | `global_skill_active_flag` is a direct alias that provides convenient ScriptCards access to the Beacon data described in the location column. | `Write not verified` |
| `global_skill_mod` | Direct alias: `global_skill_mod` | `COMPUTED` | `global_skill_mod` is a direct alias that provides convenient ScriptCards access to the Beacon data described in the location column. | `Write not verified` |
| `global_skill_mod_flag` | Direct alias: `global_skill_mod_flag` | `COMPUTED` | `global_skill_mod_flag` is a direct alias that provides convenient ScriptCards access to the Beacon data described in the location column. | `Write not verified` |
| `global_skill_rollstring` | Direct alias: `global_skill_rollstring` | `COMPUTED` | `global_skill_rollstring` is a direct alias that provides convenient ScriptCards access to the Beacon data described in the location column. | `Write not verified` |
| `globalmagicmod` | Character-level direct alias: not exposed by the mapped Beacon interface<br>Fallback result: missing `user.globalmagicmod` Custom Attribute | `UNKNOWN` | A bare `globalmagicmod` read falls through to the classic custom-attribute fallback and produces a missing Custom Attribute error. Do not use it as a Beacon character-level spellcasting modifier. | `Not mapped` |
| `globalsavemod` | Direct alias: `globalsavemod` | `COMPUTED` | `globalsavemod` is a direct alias that provides convenient ScriptCards access to the Beacon data described in the location column. | `Write not verified` |
| `globalsavingthrowbonus` | Direct alias: `globalsavingthrowbonus` | `COMPUTED` | `globalsavingthrowbonus` is a direct alias that provides convenient ScriptCards access to the Beacon data described in the location column. | `Write not verified` |

#### Hit Dice compatibility

> **Value roles**
>
> - `COMPUTED` — A calculated or aggregated result. Change the named source input rather than writing the result.
>
> **Write using**
>
> - `Typed collection` — Locate the matching existing record through the location labeled `Typed collection:` or `Typed collections:` in the row. When the row names a field, write that field; otherwise use the corresponding typed-collection table below to choose the existing primitive field that represents the intended change.
> - `Direct alias` — Use only where the row explicitly retains a verified aggregate write.

| Direct alias | ScriptCards read location | Value role | Description | Write using |
|---|---|---|---|---|
| `hit_dice` | Direct alias: `hit_dice`<br>Typed collection: active `hitdices->[selector]->dieCount`<br>Structured path: `sheet->rest->usedHitDiceData->[poolKey]->usedHitDice`<br>Formula: maximum minus all used counts | `COMPUTED` | Remaining Hit Dice across all classes. Canonical records store entitlement; the rest branch stores expenditure. The aggregate alias retains its verified direct write route. | `Direct alias` for an ordinary aggregate write; use the source inputs for pool-specific work |
| `hit_dice_max` | Direct alias: `hit_dice_max` or `hit_dice^`<br>Typed collection: active `hitdices->[selector]->dieCount`<br>Formula: sum `dieCount` | `COMPUTED` | Maximum Hit Dice across all active class entitlements. | `Typed collection`: matching `hitdices` records |
| `hitdie_final` | Direct alias: `hitdie_final`<br>Typed collection: `hitdices->[selector]->dieSize` | `COMPUTED` | When more than one die size is present, this returns `undefined` without a native read rather than choosing one. With one die size, it uses the native compatibility route. | `Typed collection`: read the individual Hit Dice records |
| `hitdietype` | Direct alias: `hitdietype`<br>Typed collection: `hitdices->[selector]->dieSize` | `COMPUTED` | When more than one die size is present, this returns `undefined` without a native read. Use the typed records to preserve a mixed entitlement such as `2d8 + 3d10`. With one die size, it uses the native compatibility route. | `Typed collection`: read the individual Hit Dice records |

#### Settings and UI

> **Value roles**
>
> - `COMPUTED` — A calculated or aggregated result. Change the named source input rather than writing the result.
>
> **Write using**
>
> - `Write not verified` — Use the alias for reads; no safe ScriptCards write target has been verified.

| Direct alias | ScriptCards read location | Value role | Description | Write using |
|---|---|---|---|---|
| `cancel` | Direct alias: `cancel` | `COMPUTED` | `cancel` is a direct alias that provides convenient ScriptCards access to the Beacon data described in the location column. | `Write not verified` |
| `carrying_capacity_mod` | Direct alias: `carrying_capacity_mod` | `COMPUTED` | `carrying_capacity_mod` is a direct alias that provides convenient ScriptCards access to the Beacon data described in the location column. | `Write not verified` |
| `confirm` | Direct alias: `confirm` | `COMPUTED` | `confirm` is a direct alias that provides convenient ScriptCards access to the Beacon data described in the location column. | `Write not verified` |
| `encumberance` | Direct alias: `encumberance`<br>Structured path: `sheet->settings->encumbranceType` | `COMPUTED` | `encumberance` is a direct alias that provides convenient ScriptCards access to the Beacon data described in the location column. | `Write not verified` |
| `mancer_cancel` | Direct alias: `mancer_cancel` | `COMPUTED` | `mancer_cancel` is a direct alias that provides convenient ScriptCards access to the Beacon data described in the location column. | `Write not verified` |
| `mancer_confirm` | Direct alias: `mancer_confirm` | `COMPUTED` | `mancer_confirm` is a direct alias that provides convenient ScriptCards access to the Beacon data described in the location column. | `Write not verified` |
| `mancer_confirm_flag` | Direct alias: `mancer_confirm_flag` | `COMPUTED` | `mancer_confirm_flag` is a direct alias that provides convenient ScriptCards access to the Beacon data described in the location column. | `Write not verified` |
| `mancer_npc` | Direct alias: `mancer_npc` | `COMPUTED` | `mancer_npc` is a direct alias that provides convenient ScriptCards access to the Beacon data described in the location column. | `Write not verified` |
| `missing_info` | Direct alias: `missing_info` | `COMPUTED` | `missing_info` is a direct alias that provides convenient ScriptCards access to the Beacon data described in the location column. | `Write not verified` |
| `monster_confirm_flag` | Direct alias: `monster_confirm_flag` | `COMPUTED` | `monster_confirm_flag` is a direct alias that provides convenient ScriptCards access to the Beacon data described in the location column. | `Write not verified` |
| `options-class-selection` | Direct alias: `options-class-selection` | `COMPUTED` | `options-class-selection` is a direct alias that provides convenient ScriptCards access to the Beacon data described in the location column. | `Write not verified` |
| `options-flag` | Direct alias: `options-flag` | `COMPUTED` | `options-flag` is a direct alias that provides convenient ScriptCards access to the Beacon data described in the location column. | `Write not verified` |
| `options-flag-bonds` | Direct alias: `options-flag-bonds` | `COMPUTED` | `options-flag-bonds` is a direct alias that provides convenient ScriptCards access to the Beacon data described in the location column. | `Write not verified` |
| `options-flag-flaws` | Direct alias: `options-flag-flaws` | `COMPUTED` | `options-flag-flaws` is a direct alias that provides convenient ScriptCards access to the Beacon data described in the location column. | `Write not verified` |
| `options-flag-ideals` | Direct alias: `options-flag-ideals` | `COMPUTED` | `options-flag-ideals` is a direct alias that provides convenient ScriptCards access to the Beacon data described in the location column. | `Write not verified` |
| `options-flag-personality` | Direct alias: `options-flag-personality` | `COMPUTED` | `options-flag-personality` is a direct alias that provides convenient ScriptCards access to the Beacon data described in the location column. | `Write not verified` |
| `simpletraits` | Direct alias: `simpletraits`<br>Structured path: `sheet->settings->layoutState` | `COMPUTED` | `simpletraits` is a direct alias that provides convenient ScriptCards access to the Beacon data described in the location column. | `Write not verified` |
| `tab` | Direct alias: `tab` | `COMPUTED` | `tab` is a direct alias that provides convenient ScriptCards access to the Beacon data described in the location column. | `Write not verified` |

#### Legacy compatibility and roll output

> **Value roles**
>
> - `COMPUTED` — A calculated or aggregated compatibility result.
> - `SYNTH` — A compatibility projection assembled from the parent and linked typed records named in the row.
>
> **Write using**
>
> - `Write not verified` — Use the alias for reads; no safe ScriptCards write target has been verified.
> - `Typed collection` — Locate the matching existing record through the location labeled `Typed collection:` or `Typed collections:` in the row. When the row names a field, write that field; otherwise use the corresponding typed-collection table below to choose the existing primitive field that represents the intended change.
> - `Parent typed record` — Edit the existing record or records labeled `Parent typed record:` or `Parent typed records:` in the row.

| Direct alias | ScriptCards read location | Value role | Description | Write using |
|---|---|---|---|---|
| `armorwarningflag` | Direct alias: `armorwarningflag`<br>Typed collections: `armorclasses`; equipped armor/shields: `items` | `COMPUTED` | `armorwarningflag` is a legacy armor-warning flag. Beacon derives AC from applicable Armor Class records and related equipped Item records instead of storing this as an independent AC field. | `Typed collection` |
| `charisma_base` | Direct alias: `charisma_base` | `COMPUTED` | `charisma_base` is a direct alias that provides convenient ScriptCards access to the Beacon data described in the location column. | `Write not verified` |
| `charisma_bonus` | Direct alias: `charisma_bonus` | `COMPUTED` | `charisma_bonus` is a direct alias that provides convenient ScriptCards access to the Beacon data described in the location column. | `Write not verified` |
| `charisma_flag` | Direct alias: `charisma_flag` | `COMPUTED` | `charisma_flag` is a direct alias that provides convenient ScriptCards access to the Beacon data described in the location column. | `Write not verified` |
| `constitution_base` | Direct alias: `constitution_base` | `COMPUTED` | `constitution_base` is a direct alias that provides convenient ScriptCards access to the Beacon data described in the location column. | `Write not verified` |
| `constitution_bonus` | Direct alias: `constitution_bonus` | `COMPUTED` | `constitution_bonus` is a direct alias that provides convenient ScriptCards access to the Beacon data described in the location column. | `Write not verified` |
| `constitution_flag` | Direct alias: `constitution_flag` | `COMPUTED` | `constitution_flag` is a direct alias that provides convenient ScriptCards access to the Beacon data described in the location column. | `Write not verified` |
| `cust_charisma_save_prof` | Direct alias: `cust_charisma_save_prof`<br>Typed collection: `proficiencies`<br>Match: `category = Saving Throw`; `proficiency = Charisma` | `COMPUTED` | `cust_charisma_save_prof` is a legacy custom Charisma saving-throw proficiency control. Beacon represents the effective proficiency with a matching Proficiency record rather than an independent custom scalar. | `Typed collection` |
| `cust_constitution_save_prof` | Direct alias: `cust_constitution_save_prof`<br>Typed collection: `proficiencies`<br>Match: `category = Saving Throw`; `proficiency = Constitution` | `COMPUTED` | `cust_constitution_save_prof` is a legacy custom Constitution saving-throw proficiency control. Beacon represents the effective proficiency with a matching Proficiency record rather than an independent custom scalar. | `Typed collection` |
| `cust_dexterity_save_prof` | Direct alias: `cust_dexterity_save_prof`<br>Typed collection: `proficiencies`<br>Match: `category = Saving Throw`; `proficiency = Dexterity` | `COMPUTED` | `cust_dexterity_save_prof` is a legacy custom Dexterity saving-throw proficiency control. Beacon represents the effective proficiency with a matching Proficiency record rather than an independent custom scalar. | `Typed collection` |
| `cust_intelligence_save_prof` | Direct alias: `cust_intelligence_save_prof`<br>Typed collection: `proficiencies`<br>Match: `category = Saving Throw`; `proficiency = Intelligence` | `COMPUTED` | `cust_intelligence_save_prof` is a legacy custom Intelligence saving-throw proficiency control. Beacon represents the effective proficiency with a matching Proficiency record rather than an independent custom scalar. | `Typed collection` |
| `cust_strength_save_prof` | Direct alias: `cust_strength_save_prof`<br>Typed collection: `proficiencies`<br>Match: `category = Saving Throw`; `proficiency = Strength` | `COMPUTED` | `cust_strength_save_prof` is a legacy custom Strength saving-throw proficiency control. Beacon represents the effective proficiency with a matching Proficiency record rather than an independent custom scalar. | `Typed collection` |
| `cust_wisdom_save_prof` | Direct alias: `cust_wisdom_save_prof`<br>Typed collection: `proficiencies`<br>Match: `category = Saving Throw`; `proficiency = Wisdom` | `COMPUTED` | `cust_wisdom_save_prof` is a legacy custom Wisdom saving-throw proficiency control. Beacon represents the effective proficiency with a matching Proficiency record rather than an independent custom scalar. | `Typed collection` |
| `custom_ac_base` | Direct alias: `custom_ac_base`<br>Typed collections: `armorclasses`; equipped armor/shields: `items` | `COMPUTED` | `custom_ac_base` is a legacy custom-AC base component. Beacon derives AC from applicable Armor Class records and related equipped Item records instead of storing this as an independent AC field. | `Typed collection` |
| `custom_ac_flag` | Direct alias: `custom_ac_flag`<br>Typed collections: `armorclasses`; equipped armor/shields: `items` | `COMPUTED` | `custom_ac_flag` is a legacy custom-AC activation flag. Beacon derives AC from applicable Armor Class records and related equipped Item records instead of storing this as an independent AC field. | `Typed collection` |
| `custom_ac_part1` | Direct alias: `custom_ac_part1`<br>Typed collections: `armorclasses`; equipped armor/shields: `items` | `COMPUTED` | `custom_ac_part1` is a legacy first custom-AC formula component. Beacon derives AC from applicable Armor Class records and related equipped Item records instead of storing this as an independent AC field. | `Typed collection` |
| `custom_ac_part2` | Direct alias: `custom_ac_part2`<br>Typed collections: `armorclasses`; equipped armor/shields: `items` | `COMPUTED` | `custom_ac_part2` is a legacy second custom-AC formula component. Beacon derives AC from applicable Armor Class records and related equipped Item records instead of storing this as an independent AC field. | `Typed collection` |
| `custom_ac_shield` | Direct alias: `custom_ac_shield`<br>Typed collections: `armorclasses`; equipped armor/shields: `items` | `COMPUTED` | `custom_ac_shield` is a legacy custom shield-AC component. Beacon derives AC from applicable Armor Class records and related equipped Item records instead of storing this as an independent AC field. | `Typed collection` |
| `customacwarningflag` | Direct alias: `customacwarningflag`<br>Typed collections: `armorclasses`; equipped armor/shields: `items` | `COMPUTED` | `customacwarningflag` is a legacy custom-AC warning flag. Beacon derives AC from applicable Armor Class records and related equipped Item records instead of storing this as an independent AC field. | `Typed collection` |
| `dexterity_base` | Direct alias: `dexterity_base` | `COMPUTED` | `dexterity_base` is a direct alias that provides convenient ScriptCards access to the Beacon data described in the location column. | `Write not verified` |
| `dexterity_bonus` | Direct alias: `dexterity_bonus` | `COMPUTED` | `dexterity_bonus` is a direct alias that provides convenient ScriptCards access to the Beacon data described in the location column. | `Write not verified` |
| `dexterity_flag` | Direct alias: `dexterity_flag` | `COMPUTED` | `dexterity_flag` is a direct alias that provides convenient ScriptCards access to the Beacon data described in the location column. | `Write not verified` |
| `display_flag` | Direct alias: `display_flag` | `COMPUTED` | `display_flag` is a legacy display-control value rather than an authoritative Beacon character value. | `Write not verified` |
| `innate` | Direct alias: `innate`<br>Known typed collections: applicable `spells` and `spellcastings` records | `COMPUTED` | `innate` is a legacy spellcasting compatibility value. Beacon stores innate spell and caster details on Spell and Spellcasting records. | `Write not verified` |
| `intelligence_base` | Direct alias: `intelligence_base` | `COMPUTED` | `intelligence_base` is a direct alias that provides convenient ScriptCards access to the Beacon data described in the location column. | `Write not verified` |
| `intelligence_bonus` | Direct alias: `intelligence_bonus` | `COMPUTED` | `intelligence_bonus` is a direct alias that provides convenient ScriptCards access to the Beacon data described in the location column. | `Write not verified` |
| `intelligence_flag` | Direct alias: `intelligence_flag` | `COMPUTED` | `intelligence_flag` is a direct alias that provides convenient ScriptCards access to the Beacon data described in the location column. | `Write not verified` |
| `pb_custom` | Direct alias: `pb_custom` | `COMPUTED` | `pb_custom` is a direct alias that provides convenient ScriptCards access to the Beacon data described in the location column. | `Write not verified` |
| `pb_type` | Direct alias: `pb_type` | `COMPUTED` | `pb_type` is a direct alias that provides convenient ScriptCards access to the Beacon data described in the location column. | `Write not verified` |
| `pbd_safe` | Direct alias: `pbd_safe` | `COMPUTED` | `pbd_safe` is a direct alias that provides convenient ScriptCards access to the Beacon data described in the location column. | `Write not verified` |
| `prof_type` | Direct alias: `prof_type` | `COMPUTED` | `prof_type` is a direct alias that provides convenient ScriptCards access to the Beacon data described in the location column. | `Write not verified` |
| `source` | Direct alias: `source` | `COMPUTED` | `source` is a compatibility projection of the source label belonging to the current repeating or canonical record context. | `Write not verified` |
| `source_type` | Direct alias: `source_type` and `source` | `COMPUTED` | `source_type` is a compatibility projection describing the source or record family in the current row context. | `Write not verified` |
| `strength_base` | Direct alias: `strength_base` | `COMPUTED` | `strength_base` is a direct alias that provides convenient ScriptCards access to the Beacon data described in the location column. | `Write not verified` |
| `strength_bonus` | Direct alias: `strength_bonus` | `COMPUTED` | `strength_bonus` is a direct alias that provides convenient ScriptCards access to the Beacon data described in the location column. | `Write not verified` |
| `strength_flag` | Direct alias: `strength_flag` | `COMPUTED` | `strength_flag` is a direct alias that provides convenient ScriptCards access to the Beacon data described in the location column. | `Write not verified` |
| `token_size` | Direct alias: `token_size`<br>Known sources: direct alias `size`; typed collection field `sizes->[selector]->sizeValue` | `COMPUTED` | `token_size` is a legacy token-scale compatibility value derived from the character’s canonical Size data. | `Write not verified` |
| `versatile_alt` | Direct alias: `versatile_alt`<br>Parent typed records: `items`; linked `attacks` and `damages` | `SYNTH` | `versatile_alt` is a synthetic repeating-row value for alternate versatile-weapon damage. It is assembled from the parent Item and linked Attack/Damage records. | `Parent typed record` |
| `wisdom_base` | Direct alias: `wisdom_base` | `COMPUTED` | `wisdom_base` is a direct alias that provides convenient ScriptCards access to the Beacon data described in the location column. | `Write not verified` |
| `wisdom_bonus` | Direct alias: `wisdom_bonus` | `COMPUTED` | `wisdom_bonus` is a direct alias that provides convenient ScriptCards access to the Beacon data described in the location column. | `Write not verified` |
| `wisdom_flag` | Direct alias: `wisdom_flag` | `COMPUTED` | `wisdom_flag` is a direct alias that provides convenient ScriptCards access to the Beacon data described in the location column. | `Write not verified` |

### Transient and unmapped aliases

These aliases are builder/interface state or currently lack a verified source location. Treat unmapped values as read-only and use transient values only for deliberate builder or interface work.

#### Identity, progression, and biography

> **Value roles**
>
> - `UNKNOWN` — The source location or safe write route has not yet been verified.
>
> **Write using**
>
> - `Not mapped` — The source location and safe write route are not yet known.

| Direct alias | ScriptCards read location | Value role | Description | Write using |
|---|---|---|---|---|
| `additional_feature_and_traits` | Direct alias: `additional_feature_and_traits` | `UNKNOWN` | `additional_feature_and_traits` exposes the legacy additional features and traits text, but no verified fixed path, canonical record rule, or calculation has been mapped for it. | `Not mapped` |
| `allies_and_organizations` | Direct alias: `allies_and_organizations` | `UNKNOWN` | `allies_and_organizations` exposes the legacy allies and organizations text, but no verified fixed path, canonical record rule, or calculation has been mapped for it. | `Not mapped` |
| `bonds` | Direct alias: `bonds` | `UNKNOWN` | `bonds` exposes the legacy bonds text, but no verified fixed path, canonical record rule, or calculation has been mapped for it. | `Not mapped` |
| `character_appearance` | Direct alias: `character_appearance` | `UNKNOWN` | `character_appearance` exposes the legacy character appearance text, but no verified fixed path, canonical record rule, or calculation has been mapped for it. | `Not mapped` |
| `character_backstory` | Direct alias: `character_backstory` | `UNKNOWN` | `character_backstory` exposes the legacy character backstory text, but no verified fixed path, canonical record rule, or calculation has been mapped for it. | `Not mapped` |
| `features_and_traits` | Direct alias: `features_and_traits` | `UNKNOWN` | `features_and_traits` exposes the legacy features and traits text, but no verified fixed path, canonical record rule, or calculation has been mapped for it. | `Not mapped` |
| `flaws` | Direct alias: `flaws` | `UNKNOWN` | `flaws` exposes the legacy flaws text, but no verified fixed path, canonical record rule, or calculation has been mapped for it. | `Not mapped` |
| `ideals` | Direct alias: `ideals` | `UNKNOWN` | `ideals` exposes the legacy ideals text, but no verified fixed path, canonical record rule, or calculation has been mapped for it. | `Not mapped` |
| `other_proficiencies_and_languages` | Direct alias: `other_proficiencies_and_languages` | `UNKNOWN` | `other_proficiencies_and_languages` exposes the legacy other proficiencies and languages text, but no verified fixed path, canonical record rule, or calculation has been mapped for it. | `Not mapped` |
| `personality_traits` | Direct alias: `personality_traits` | `UNKNOWN` | `personality_traits` exposes the legacy personality traits text, but no verified fixed path, canonical record rule, or calculation has been mapped for it. | `Not mapped` |

#### Shared character values

> **Value roles**
>
> - `UNKNOWN` — The source location or safe write route has not yet been verified.
>
> **Write using**
>
> - `Not mapped` — The source location and safe write route are not yet known.

| Direct alias | ScriptCards read location | Value role | Description | Write using |
|---|---|---|---|---|
| `default_critical_range` | Direct alias: `default_critical_range` | `UNKNOWN` | Deliberately returns `undefined` without a native read. Use the normal game-rule default of 20 in script logic unless an individual Attack record or another verified feature supplies a different critical range. | `Not mapped` |
| `version` | Direct alias: `version` | `UNKNOWN` | `version` exposes the legacy sheet-version value, but no verified fixed path, canonical record rule, or calculation has been mapped for it. | `Not mapped` |

#### Legacy compatibility and roll output

> **Value roles**
>
> - `TRANSIENT` — Temporary builder or interface state rather than ordinary stored character data.
>
> **Write using**
>
> - `Builder/interface state` — The row identifies this with `Builder/interface state:`; it is transient interface data rather than ordinary live character data.

| Direct alias | ScriptCards read location | Value role | Description | Write using |
|---|---|---|---|---|
| `drop_category` | Direct alias: `drop_category`<br>Builder/interface state: `builder` | `TRANSIENT` | `drop_category` is transient drag-and-drop or builder workflow state used while processing dropped content. | `Builder/interface state` |
| `drop_content` | Direct alias: `drop_content`<br>Builder/interface state: `builder` | `TRANSIENT` | `drop_content` is transient drag-and-drop or builder workflow state used while processing dropped content. | `Builder/interface state` |
| `drop_data` | Direct alias: `drop_data`<br>Builder/interface state: `builder` | `TRANSIENT` | `drop_data` is transient drag-and-drop or builder workflow payload data. | `Builder/interface state` |
| `drop_name` | Direct alias: `drop_name`<br>Builder/interface state: `builder` | `TRANSIENT` | `drop_name` is the transient name associated with drag-and-drop or builder workflow content. | `Builder/interface state` |


#### Additional legacy feature compatibility

These names remain part of the complete legacy-name inventory. Their exact single-value projections are not reconstructed locally; use the listed typed records for deterministic logic.

| Direct alias | ScriptCards read location | Value role | Description | Write using |
|---|---|---|---|---|
| `arcane_fighter` | Direct alias: `arcane_fighter`<br>Known typed collections: `classes`, `subclasses`, and `spellcastings` | `COMPUTED` | Legacy Fighter spellcasting compatibility flag. Determine the class, subclass, and spellcasting state from the canonical records when deterministic behavior is required. | `Write not verified` |
| `arcane_rogue` | Direct alias: `arcane_rogue`<br>Known typed collections: `classes`, `subclasses`, and `spellcastings` | `COMPUTED` | Legacy Rogue spellcasting compatibility flag. Determine the class, subclass, and spellcasting state from the canonical records when deterministic behavior is required. | `Write not verified` |
| `halflingluck_flag` | Direct alias: `halflingluck_flag`<br>Known typed collections: `features` and applicable `rollbonuses` | `COMPUTED` | Legacy Halfling Luck compatibility flag. Beacon represents the feature and its roll effects with canonical records. | `Write not verified` |
| `jack` | Direct alias: `jack`<br>Known typed collections: applicable `features` and `rollbonuses` | `COMPUTED` | Legacy Jack of All Trades compatibility value. Beacon represents the feature and its roll modifier with canonical records. | `Write not verified` |
| `jack_attr` | Direct alias: `jack_attr`<br>Known typed collections: applicable `features` and `rollbonuses` | `UNKNOWN` | Legacy Jack of All Trades ability component. No safe single Beacon write target is verified. | `Write not verified` |
| `jack_bonus` | Direct alias: `jack_bonus`<br>Known typed collections: applicable `features` and `rollbonuses` | `UNKNOWN` | Legacy Jack of All Trades bonus component. No safe single Beacon write target is verified. | `Write not verified` |
| `jack_of_all_trades` | Direct alias: `jack_of_all_trades`<br>Known typed collections: applicable `features` and `rollbonuses` | `COMPUTED` | Legacy Jack of All Trades feature flag. Beacon represents the feature and its roll effect with canonical records. | `Write not verified` |

## Placeholder notation

| Placeholder | Meaning |
|---|---|
| `[selector]` | A zero-based typed-collection index, `shortID`, canonical ID, or unique collection-specific identity value such as `name`, `ability`, `speed`, or `spellLevel`. |
| `[index]` | A real zero-based array index. |
| `[poolKey]` | An existing opaque key under `sheet->rest->usedHitDiceData`. Read its nested `dieSize`; do not construct or parse the key from a class name. |
| `FIELD` | An existing primitive field on the selected typed record. |
| `VALUE` | The string, number, or boolean being written. |

## Fixed structured locations

Use these sections when no public alias exposes the required value, when a write must target the actual backing input, or when a script needs a specific structured record rather than a formatted public result.

### Nested-write rules

- Use the documented location after `|` in a `--!c` command.
- The complete path must already exist.
- The final target must be a primitive string, number, or boolean.
- Whole objects and arrays cannot be replaced.
- Numeric leaves preserve numeric type.
- Boolean leaves accept `1/0`, `true/false`, `yes/no`, and `on/off`.
- `+=` and `-=` work on numeric leaves; `+=` can append to string leaves.
- Missing nested fields cannot be created.
- `!name` creates a sheet-visible custom field under `user.name`; it does not create a missing nested location.
- Order arrays contain canonical record keys. Only write valid existing keys.
- `parentID`, `childIDs`, and `relations` form the canonical graph. Invalid writes can disconnect records.
- A successful raw write can occur before every translated or calculated value refreshes. Reread after the sheet worker settles when the result matters.

### Fixed `sheet` locations

#### Character identity and About tab

> **Value kinds**
>
> - `ORDER` — Stored ordering or index data containing positions or canonical record keys.
> - `STORED` — A value or field stored directly at this location; it may be primitive or a container.
>
> **Usage**
>
> - `ORDER` — Preserve valid existing record keys and change this only when intentionally reordering them.
> - `NATIVE` — The public `name` is verified writable and may be used directly in `--!c`.
> - `RAW` — Use the exact `sheet` path to read or deliberately change this existing primitive value.

| ScriptCards location | Value | Description | Use |
|---|---|---|---|
| `sheet->about->aboutTabApperancesDisplayOrder` | array<br>`ORDER` | This location stores the value named `aboutTabApperancesDisplayOrder` within the character's About-tab data and display order. | `ORDER` |
| `sheet->about->aboutTabCharacteristicsDisplayOrder` | array<br>`ORDER` | This location stores the value named `aboutTabCharacteristicsDisplayOrder` within the character's About-tab data and display order. | `ORDER` |
| `sheet->about->characteristics->alignment` | string<br>`STORED` | This location stores the value named `alignment` within the character's About-tab data and display order. | `NATIVE` — Prefer `alignment` for ordinary reads and writes through the verified alias; this raw path is its backing store. |
| `sheet->about->characteristics->size` | string<br>`STORED` | This location stores the value named `size` within the character's About-tab data and display order. | `NATIVE` — Prefer `size` for ordinary reads and writes through the verified alias; this raw path is its backing store. |
| `sheet->character->createdWithBuilder` | boolean<br>`STORED` | This location stores the value named `createdWithBuilder` within core character identity metadata stored by the Beacon sheet. | `RAW` — Treat this as provenance metadata; do not write it to change how the character is managed. |
| `sheet->character->creatureType` | string<br>`STORED` | This location stores the value named `creatureType` within core character identity metadata stored by the Beacon sheet. | `RAW` |
| `sheet->character->pronouns` | string<br>`STORED` | This location stores the value named `pronouns` within core character identity metadata stored by the Beacon sheet. | `RAW` |
| `sheet->classLevel->currentExp` | number<br>`STORED` | This location stores the character's current experience points within direct experience state; class levels themselves remain canonical records. | `NATIVE` — Prefer `experience` for ordinary reads and writes through the verified alias; this raw path is its backing store. |

#### Hit points, Inspiration, and death saves

> **Value kinds**
>
> - `STORED` — A value or field stored directly at this location; it may be primitive or a container.
>
> **Usage**
>
> - `NATIVE` — The public `name` is verified writable and may be used directly in `--!c`.
> - `RAW` — Use the exact `sheet` path to read or deliberately change this existing primitive value.

| ScriptCards location | Value | Description | Use |
|---|---|---|---|
| `sheet->hitpoints->currentHP` | number<br>`STORED` | This location stores the character's current hit points within current hit points, temporary hit points, and death-save state. | `NATIVE` — Prefer `hp` for ordinary reads and writes through the verified alias; this raw path is its backing store. |
| `sheet->hitpoints->deathSaves->failures` | number<br>`STORED` | This location stores the current number of failed death saves within current hit points, temporary hit points, and death-save state. | `NATIVE` + `RAW` — Use `deathsave_fail1` through `deathsave_fail3` for ordinary checkbox writes; use this count for deliberate count-based logic. |
| `sheet->hitpoints->deathSaves->open` | boolean<br>`STORED` | This location stores the value named `open` within current hit points, temporary hit points, and death-save state. | `RAW` — This is death-save interface state; use `successes` and `failures` for the actual tracked results. |
| `sheet->hitpoints->deathSaves->successes` | number<br>`STORED` | This location stores the current number of successful death saves within current hit points, temporary hit points, and death-save state. | `NATIVE` + `RAW` — Use `deathsave_succ1` through `deathsave_succ3` for ordinary checkbox writes; use this count for deliberate count-based logic. |
| `sheet->hitpoints->tempHP` | number<br>`STORED` | This location stores the character's temporary hit points within current hit points, temporary hit points, and death-save state. | `NATIVE` — Prefer `hp_temp` for ordinary reads and writes through the verified alias; this raw path is its backing store. |
| `sheet->inspiration->isInspired` | boolean<br>`STORED` | This location stores whether the character currently has Inspiration within the character's current Inspiration state. | `NATIVE` — Prefer `inspiration` for ordinary reads and writes through the verified alias; this raw path is its backing store. |

#### Rules and sheet settings

> **Value kinds**
>
> - `STORED` — A value or field stored directly at this location; it may be primitive or a container.
>
> **Usage**
>
> - `RAW` — Use the exact `sheet` path to read or deliberately change this existing primitive value.
> - `SETTING` — Read this to respect the user's sheet setting; write only when intentionally changing that setting.

| ScriptCards location | Value | Description | Use |
|---|---|---|---|
| `sheet->campaignSettings->lastDefaultsApplied` | number<br>`STORED` | This location stores the value named `lastDefaultsApplied` within the campaign-default state already applied to this character. | `RAW` — Use this to diagnose campaign-default application; do not normally change it as character data. |
| `sheet->rest->longRestModalData->dawnResources` | boolean<br>`STORED` | This location stores the value named `dawnResources` within the options used by the short-rest and long-rest dialogs. | `SETTING` |
| `sheet->rest->longRestModalData->recoverExhaustion` | boolean<br>`STORED` | This location stores the value named `recoverExhaustion` within the options used by the short-rest and long-rest dialogs. | `SETTING` — Controls the long-rest dialog option; it is not the character’s current Exhaustion value. |
| `sheet->rest->longRestModalData->resetHpMax` | boolean<br>`STORED` | This location stores the value named `resetHpMax` within the options used by the short-rest and long-rest dialogs. | `SETTING` |
| `sheet->rest->longRestModalData->spellManagement` | boolean<br>`STORED` | This location stores the value named `spellManagement` within the options used by the short-rest and long-rest dialogs. | `SETTING` — Controls spell management in the long-rest dialog; individual prepared state belongs to each Spell record. |
| `sheet->rest->shortRestModalData->autoApplyHealing` | boolean<br>`STORED` | This location stores the value named `autoApplyHealing` within the options used by the short-rest and long-rest dialogs. | `SETTING` — Controls short-rest dialog behavior; it does not store a healing amount or current HP. |
| `sheet->rest->shortRestModalData->dawnResources` | boolean<br>`STORED` | This location stores the value named `dawnResources` within the options used by the short-rest and long-rest dialogs. | `SETTING` |
| `sheet->rest->shortRestModalData->resetHpMax` | boolean<br>`STORED` | This location stores the value named `resetHpMax` within the options used by the short-rest and long-rest dialogs. | `SETTING` |
| `sheet->settings->addDexTiebreaker` | boolean<br>`STORED` | This location stores the value named `addDexTiebreaker` within the sheet's rules, display, roll, and behavior settings. | `SETTING` — Read this when reproducing the sheet’s initiative behavior. |
| `sheet->settings->encumbranceType` | string<br>`STORED` | This location stores the value named `encumbranceType` within the sheet's rules, display, roll, and behavior settings. | `SETTING` |
| `sheet->settings->hideCombatHints` | boolean<br>`STORED` | This location stores the value named `hideCombatHints` within the sheet's rules, display, roll, and behavior settings. | `SETTING` |
| `sheet->settings->ignoreCoinWeight` | boolean<br>`STORED` | This location stores the value named `ignoreCoinWeight` within the sheet's rules, display, roll, and behavior settings. | `SETTING` |
| `sheet->settings->isCampaignSettingsSheet` | boolean<br>`STORED` | This location stores the value named `isCampaignSettingsSheet` within the sheet's rules, display, roll, and behavior settings. | `SETTING` — This identifies a campaign-settings sheet; do not enable it on an ordinary character. |
| `sheet->settings->layoutState` | string<br>`STORED` | This location stores the value named `layoutState` within the sheet's rules, display, roll, and behavior settings. | `SETTING` |
| `sheet->settings->newRules` | boolean<br>`STORED` | This location stores the value named `newRules` within the sheet's rules, display, roll, and behavior settings. | `SETTING` — Read this before applying rules-version-specific behavior; writing it changes the sheet’s rules mode. |
| `sheet->settings->rollDamageAutomatic` | boolean<br>`STORED` | This location stores whether the sheet rolls damage automatically with an attack within the sheet's rules, display, roll, and behavior settings. | `SETTING` — Read this before deciding whether an attack needs a separate damage action; writing it changes sheet roll behavior. |
| `sheet->settings->rolls->advancedMode` | string<br>`STORED` | This location stores the value named `advancedMode` within the sheet's rules, display, roll, and behavior settings. | `SETTING` |
| `sheet->settings->rolls->mode` | string<br>`STORED` | This location stores the selected mode, such as a roll or upcasting mode within the sheet's rules, display, roll, and behavior settings. | `SETTING` — Read this when reproducing the sheet’s current roll or upcasting mode; do not assume it is only an advantage setting. |
| `sheet->settings->rolls->privacy` | string<br>`STORED` | This location stores the public/GM/private roll-visibility setting within the sheet's rules, display, roll, and behavior settings. | `SETTING` — Read this to preserve public, GM, or private visibility in sheet-equivalent output. |
| `sheet->settings->showAllCrits` | boolean<br>`STORED` | This location stores the value named `showAllCrits` within the sheet's rules, display, roll, and behavior settings. | `SETTING` |
| `sheet->settings->showPreparedSpells` | boolean<br>`STORED` | This location stores the value named `showPreparedSpells` within the sheet's rules, display, roll, and behavior settings. | `SETTING` — Controls spell-list display or filtering; individual prepared state belongs to `Spell._prepared`. |
| `sheet->settings->useConditionTokenSync` | boolean<br>`STORED` | This location stores the value named `useConditionTokenSync` within the sheet's rules, display, roll, and behavior settings. | `SETTING` — Writing this changes automatic synchronization between sheet conditions and token markers. |
| `sheet->sheetToSheet->lastSheetToSheetAcknowledged` | number<br>`STORED` | This location stores the value named `lastSheetToSheetAcknowledged` within the sheet-to-sheet migration acknowledgement state. | `RAW` — This is migration acknowledgement state; do not normally change it as live character data. |


#### Hit Dice expenditure

Hit Dice entitlement is stored in canonical `hitdices` records. Current expenditure is stored separately under `sheet->rest->usedHitDiceData`. Pool keys are opaque: enumerate existing keys and inspect `dieSize` instead of constructing a key from a class name.

| ScriptCards location | Value | Description | Use |
|---|---|---|---|
| `sheet->rest->usedHitDiceData->[pool-key]->dieSize` | number<br>`STORED` | Identifies the die size associated with this existing rest-state pool. | `READ` — Use this to associate an opaque pool with its die size; do not infer identity from the pool key. |
| `sheet->rest->usedHitDiceData->[pool-key]->usedHitDice` | number<br>`STORED` | Stores the number of Hit Dice spent from this pool. | `RAW` — This is expenditure, not entitlement. Change deliberately and preserve the existing pool structure. |

#### Section display order

> **Value kinds**
>
> - `ORDER` — Stored ordering or index data containing positions or canonical record keys.
> - `STORED` — A value or field stored directly at this location; it may be primitive or a container.
>
> **Usage**
>
> - `ORDER` — Preserve valid existing record keys and change this only when intentionally reordering them.
> - `RAW` — Use the exact `sheet` path to read or deliberately change this existing primitive value.

| ScriptCards location | Value | Description | Use |
|---|---|---|---|
| `sheet->actions->actionDisplayOrder` | array<br>`ORDER` | This location stores the value named `actionDisplayOrder` within the record keys and order used by the Actions, Bonus Actions, Free Actions, and Reactions sections. | `ORDER` |
| `sheet->actions->bonusActionDisplayOrder` | array<br>`ORDER` | This location stores the value named `bonusActionDisplayOrder` within the record keys and order used by the Actions, Bonus Actions, Free Actions, and Reactions sections. | `ORDER` |
| `sheet->actions->freeActionDisplayOrder` | array<br>`ORDER` | This location stores the value named `freeActionDisplayOrder` within the record keys and order used by the Actions, Bonus Actions, Free Actions, and Reactions sections. | `ORDER` |
| `sheet->actions->reactionDisplayOrder` | array<br>`ORDER` | This location stores the value named `reactionDisplayOrder` within the record keys and order used by the Actions, Bonus Actions, Free Actions, and Reactions sections. | `ORDER` |
| `sheet->attacks->attackDisplayOrder` | array<br>`ORDER` | This location stores the canonical Attack record keys in the order shown by the sheet within the record keys and order used by the Attacks section. | `ORDER` |
| `sheet->attacks->attackDisplayOrder->[index]` | string<br>`ORDER` | This array element stores one entry in `attackDisplayOrder` within the record keys and order used by the Attacks section. | `ORDER` — Returns an Attack `[record-key]`; use it to seed an exact raw record read or write. |
| `sheet->background->aboutTabBackgroundDisplayOrder` | array<br>`ORDER` | This location stores the value named `aboutTabBackgroundDisplayOrder` within the background display data shown on the About tab. | `ORDER` |
| `sheet->effects->effectDisplayOrder` | array<br>`ORDER` | This location stores the value named `effectDisplayOrder` within the record keys and order used by the Effects section. | `ORDER` |
| `sheet->features->classFeatureDisplayOrder` | array<br>`ORDER` | This location stores the value named `classFeatureDisplayOrder` within the record keys and order used by the feature sections. | `ORDER` |
| `sheet->features->classFeatureDisplayOrder->[index]` | string<br>`ORDER` | This array element stores one entry in `classFeatureDisplayOrder` within the record keys and order used by the feature sections. | `ORDER` — Returns a Feature `[record-key]`; use it to seed an exact raw record read or write. |
| `sheet->features->featsDisplayOrder` | array<br>`ORDER` | This location stores the value named `featsDisplayOrder` within the record keys and order used by the feature sections. | `ORDER` |
| `sheet->features->featsDisplayOrder->[index]` | string<br>`ORDER` | This array element stores one entry in `featsDisplayOrder` within the record keys and order used by the feature sections. | `ORDER` — Returns a Feat `[record-key]`; use it to seed an exact raw record read or write. |
| `sheet->features->otherDisplayOrder` | array<br>`ORDER` | This location stores the value named `otherDisplayOrder` within the record keys and order used by the feature sections. | `ORDER` |
| `sheet->features->otherDisplayOrder->[index]` | string<br>`ORDER` | This array element stores one entry in `otherDisplayOrder` within the record keys and order used by the feature sections. | `ORDER` — Returns a Feature `[record-key]`; use it to seed an exact raw record read or write. |
| `sheet->features->speciesTraitsDisplayOrder->[index]` | string<br>`ORDER` | This array element stores one entry in `speciesTraitsDisplayOrder` within the record keys and order used by the feature sections. | `ORDER` — Returns a Species Trait `[record-key]`; use it to seed an exact raw record read or write. |
| `sheet->notes->emptyCategories` | array<br>`ORDER` | This location stores the value named `emptyCategories` within notes categories and notes display order. | `ORDER` — Stores empty category names, not canonical record keys. |
| `sheet->notes->order->Allies` | array<br>`ORDER` | This location stores the value named `Allies` within notes categories and notes display order. | `ORDER` — Contains the Note record keys displayed under Allies; do not replace them with note text. |
| `sheet->notes->order->Enemies` | array<br>`ORDER` | This location stores the value named `Enemies` within notes categories and notes display order. | `ORDER` — Contains the Note record keys displayed under Enemies; do not replace them with note text. |
| `sheet->notes->order->Organizations` | array<br>`ORDER` | This location stores the value named `Organizations` within notes categories and notes display order. | `ORDER` — Contains the Note record keys displayed under Organizations; do not replace them with note text. |
| `sheet->spells->displayOrder->[index]` | array<br>`ORDER` | This array element stores one entry in `displayOrder` within spell display order and spell-section behavior. | `ORDER` — Returns one spell-level bucket; read its child elements to obtain actual Spell record keys. |
| `sheet->spells->displayOrder->[index]->[index]` | string<br>`ORDER` | This array element stores one entry in `[index]` within spell display order and spell-section behavior. | `ORDER` — Returns a Spell `[record-key]`; use it to seed an exact raw Spell read or write. |
| `sheet->spells->generalSpellSettings->defaultToFullscreen` | boolean<br>`STORED` | This location stores the value named `defaultToFullscreen` within spell display order and spell-section behavior. | `RAW` |
| `sheet->spells->generalSpellSettings->showPreparedBar` | boolean<br>`STORED` | This location stores the value named `showPreparedBar` within spell display order and spell-section behavior. | `RAW` |
| `sheet->spells->generalSpellSettings->showPreparedSpellsOnly` | boolean<br>`STORED` | This location stores the value named `showPreparedSpellsOnly` within spell display order and spell-section behavior. | `RAW` — This is a display filter; individual prepared state belongs to `Spell._prepared`. |
| `sheet->spells->generalSpellSettings->spellcastings` | string<br>`STORED` | This location stores the value named `spellcastings` within spell display order and spell-section behavior. | `RAW` — Inspect the stored format before editing; this is spellcasting-selection state rather than a single spell record. |
| `sheet->spells->generalSpellSettings->useSlotAlwaysPrepared` | boolean<br>`STORED` | This location stores the value named `useSlotAlwaysPrepared` within spell display order and spell-section behavior. | `RAW` |
| `sheet->spells->generalSpellSettings->useSlotDefault` | boolean<br>`STORED` | This location stores the value named `useSlotDefault` within spell display order and spell-section behavior. | `RAW` |
| `sheet->weaponMasteries->masteryDisplayOrder` | array<br>`ORDER` | This location stores the value named `masteryDisplayOrder` within weapon-mastery display order. | `ORDER` |

#### Inventory and currencies

> **Value kinds**
>
> - `ORDER` — Stored ordering or index data containing positions or canonical record keys.
> - `STORED` — A value or field stored directly at this location; it may be primitive or a container.
>
> **Usage**
>
> - `RAW` — Use the exact `sheet` path to read or deliberately change this existing primitive value.
> - `ORDER` — Preserve valid existing record keys and change this only when intentionally reordering them.

| ScriptCards location | Value | Description | Use |
|---|---|---|---|
| `sheet->currencies->initialized` | boolean<br>`STORED` | This location stores the value named `initialized` within the currency subsystem's initialization state. | `RAW` — This is an initialization flag; change Currency records or `cp` through `pp` to change actual money values. |
| `sheet->inventory->equipmentDisplayOrder` | array<br>`ORDER` | This location stores the value named `equipmentDisplayOrder` within inventory display order and editing behavior. | `ORDER` |
| `sheet->inventory->equipmentDisplayOrder->[index]` | string<br>`ORDER` | This array element stores one entry in `equipmentDisplayOrder` within inventory display order and editing behavior. | `ORDER` — Returns an Item `[record-key]`; use it to seed an exact raw Item read or write. |
| `sheet->inventory->incrementalQuantityEditing` | boolean<br>`STORED` | This location stores the value named `incrementalQuantityEditing` within inventory display order and editing behavior. | `RAW` — This controls inventory editing behavior; it does not store an item quantity. |
| `sheet->inventory->otherPossessionsDisplayOrder` | array<br>`ORDER` | This location stores the value named `otherPossessionsDisplayOrder` within inventory display order and editing behavior. | `ORDER` |

#### Spell slots

> **Value kinds**
>
> - `STORED` — A value or field stored directly at this location; it may be primitive or a container.
>
> **Usage**
>
> - `RAW` — Use the exact `sheet` path to read or deliberately change this existing primitive value.
> - `NATIVE` — The public `name` is verified writable and may be used directly in `--!c`.

Normal `currentByLevel` rows have public `lvlN_slots_expended` aliases. `currentPactByLevel` is separate Pact-slot state and has no verified writable public alias in this reference.

| ScriptCards location | Value | Description | Use |
|---|---|---|---|
| `sheet->spellSlots->currentByLevel->CANTRIP` | number<br>`STORED` | This location stores the value named `CANTRIP` within current normal and Pact spell-slot counters and slot-consumption behavior. | `RAW` — Treat this as diagnostic slot-state data; cantrips do not consume normal spell slots. |
| `sheet->spellSlots->currentByLevel->EIGHTH` | number<br>`STORED` | This location stores the value named `EIGHTH` within current normal and Pact spell-slot counters and slot-consumption behavior. | `NATIVE` — Prefer `lvl8_slots_expended` for ordinary reads and writes through the verified alias; this raw path is its backing store. |
| `sheet->spellSlots->currentByLevel->FIFTH` | number<br>`STORED` | This location stores the value named `FIFTH` within current normal and Pact spell-slot counters and slot-consumption behavior. | `NATIVE` — Prefer `lvl5_slots_expended` for ordinary reads and writes through the verified alias; this raw path is its backing store. |
| `sheet->spellSlots->currentByLevel->FIRST` | number<br>`STORED` | This location stores the value named `FIRST` within current normal and Pact spell-slot counters and slot-consumption behavior. | `NATIVE` — Prefer `lvl1_slots_expended` for ordinary reads and writes through the verified alias; this raw path is its backing store. |
| `sheet->spellSlots->currentByLevel->FOURTH` | number<br>`STORED` | This location stores the value named `FOURTH` within current normal and Pact spell-slot counters and slot-consumption behavior. | `NATIVE` — Prefer `lvl4_slots_expended` for ordinary reads and writes through the verified alias; this raw path is its backing store. |
| `sheet->spellSlots->currentByLevel->NINTH` | number<br>`STORED` | This location stores the value named `NINTH` within current normal and Pact spell-slot counters and slot-consumption behavior. | `NATIVE` — Prefer `lvl9_slots_expended` for ordinary reads and writes through the verified alias; this raw path is its backing store. |
| `sheet->spellSlots->currentByLevel->SECOND` | number<br>`STORED` | This location stores the value named `SECOND` within current normal and Pact spell-slot counters and slot-consumption behavior. | `NATIVE` — Prefer `lvl2_slots_expended` for ordinary reads and writes through the verified alias; this raw path is its backing store. |
| `sheet->spellSlots->currentByLevel->SEVENTH` | number<br>`STORED` | This location stores the value named `SEVENTH` within current normal and Pact spell-slot counters and slot-consumption behavior. | `NATIVE` — Prefer `lvl7_slots_expended` for ordinary reads and writes through the verified alias; this raw path is its backing store. |
| `sheet->spellSlots->currentByLevel->SIXTH` | number<br>`STORED` | This location stores the value named `SIXTH` within current normal and Pact spell-slot counters and slot-consumption behavior. | `NATIVE` — Prefer `lvl6_slots_expended` for ordinary reads and writes through the verified alias; this raw path is its backing store. |
| `sheet->spellSlots->currentByLevel->THIRD` | number<br>`STORED` | This location stores the value named `THIRD` within current normal and Pact spell-slot counters and slot-consumption behavior. | `NATIVE` — Prefer `lvl3_slots_expended` for ordinary reads and writes through the verified alias; this raw path is its backing store. |
| `sheet->spellSlots->currentPactByLevel->CANTRIP` | number<br>`STORED` | This location stores the value named `CANTRIP` within current normal and Pact spell-slot counters and slot-consumption behavior. | `RAW` — Treat this as diagnostic Pact-slot data; cantrips do not consume Pact slots. |
| `sheet->spellSlots->currentPactByLevel->EIGHTH` | number<br>`STORED` | This location stores the value named `EIGHTH` within current normal and Pact spell-slot counters and slot-consumption behavior. | `RAW` |
| `sheet->spellSlots->currentPactByLevel->FIFTH` | number<br>`STORED` | This location stores the value named `FIFTH` within current normal and Pact spell-slot counters and slot-consumption behavior. | `RAW` |
| `sheet->spellSlots->currentPactByLevel->FIRST` | number<br>`STORED` | This location stores the value named `FIRST` within current normal and Pact spell-slot counters and slot-consumption behavior. | `RAW` |
| `sheet->spellSlots->currentPactByLevel->FOURTH` | number<br>`STORED` | This location stores the value named `FOURTH` within current normal and Pact spell-slot counters and slot-consumption behavior. | `RAW` |
| `sheet->spellSlots->currentPactByLevel->NINTH` | number<br>`STORED` | This location stores the value named `NINTH` within current normal and Pact spell-slot counters and slot-consumption behavior. | `RAW` |
| `sheet->spellSlots->currentPactByLevel->SECOND` | number<br>`STORED` | This location stores the value named `SECOND` within current normal and Pact spell-slot counters and slot-consumption behavior. | `RAW` |
| `sheet->spellSlots->currentPactByLevel->SEVENTH` | number<br>`STORED` | This location stores the value named `SEVENTH` within current normal and Pact spell-slot counters and slot-consumption behavior. | `RAW` |
| `sheet->spellSlots->currentPactByLevel->SIXTH` | number<br>`STORED` | This location stores the value named `SIXTH` within current normal and Pact spell-slot counters and slot-consumption behavior. | `RAW` |
| `sheet->spellSlots->currentPactByLevel->THIRD` | number<br>`STORED` | This location stores the value named `THIRD` within current normal and Pact spell-slot counters and slot-consumption behavior. | `RAW` |
| `sheet->spellSlots->useSpellSlotOnCast` | boolean<br>`STORED` | This location stores the value named `useSpellSlotOnCast` within current normal and Pact spell-slot counters and slot-consumption behavior. | `RAW` — Controls automatic slot consumption when casting; it is not a slot count. |

#### NPC metadata

> **Value kinds**
>
> - `STORED` — A value or field stored directly at this location; it may be primitive or a container.
>
> **Usage**
>
> - `RAW` — Use the exact `sheet` path to read or deliberately change this existing primitive value.

| ScriptCards location | Value | Description | Use |
|---|---|---|---|
| `sheet->npc->acNotes` | string<br>`STORED` | This location stores the value named `acNotes` within NPC-only scalar metadata. | `RAW` — Supplemental NPC AC text only; read final AC from `ac` and Armor Class records. |
| `sheet->npc->challengeRating` | string<br>`STORED` | This location stores the value named `challengeRating` within NPC-only scalar metadata. | `RAW` — Use this as the direct NPC Challenge Rating value; `npc_challenge` is a compatibility view of this path. |
| `sheet->npc->compendiumDropData->categoryName` | string<br>`STORED` | This location stores the value named `categoryName` within NPC-only scalar metadata. | `RAW` — Compendium-import provenance; read for diagnostics and do not normally edit it. |
| `sheet->npc->compendiumDropData->expansionId` | number<br>`STORED` | This location stores the value named `expansionId` within NPC-only scalar metadata. | `RAW` — Compendium-import provenance; read for diagnostics and do not normally edit it. |
| `sheet->npc->compendiumDropData->pageName` | string<br>`STORED` | This location stores the value named `pageName` within NPC-only scalar metadata. | `RAW` — Compendium-import provenance; read for diagnostics and do not normally edit it. |
| `sheet->npc->compendiumDropData->tokenImg` | string<br>`STORED` | This location stores the value named `tokenImg` within NPC-only scalar metadata. | `RAW` — Compendium-import provenance; this is not the active token object’s image source. |
| `sheet->npc->customXP` | string<br>`STORED` | This location stores the value named `customXP` within NPC-only scalar metadata. | `RAW` — Use only for a manual NPC XP override; Challenge Rating remains at `challengeRating`. |
| `sheet->npc->gear` | string<br>`STORED` | This location stores the value named `gear` within NPC-only scalar metadata. | `RAW` — Direct NPC Gear text; no canonical-record lookup is required. |
| `sheet->npc->habitat` | string<br>`STORED` | This location stores the value named `habitat` within NPC-only scalar metadata. | `RAW` — Direct NPC Habitat text; no canonical-record lookup is required. |
| `sheet->npc->legendaryActionCompendiumNum` | number<br>`STORED` | This location stores the value named `legendaryActionCompendiumNum` within NPC-only scalar metadata. | `RAW` — Stores the legendary-action count or allowance, not the action descriptions. |
| `sheet->npc->legendaryActionSummary` | string<br>`STORED` | This location stores the value named `legendaryActionSummary` within NPC-only scalar metadata. | `RAW` — Stores the legendary-action summary text, not the individual Action records. |
| `sheet->npc->mythicActionSummary` | string<br>`STORED` | This location stores the value named `mythicActionSummary` within NPC-only scalar metadata. | `RAW` — Stores mythic-action summary text, not the individual Action records. |
| `sheet->npc->rollHP` | string<br>`STORED` | This location stores the value named `rollHP` within NPC-only scalar metadata. | `RAW` — Stores the NPC HP formula text; current HP remains at `hp`. |
| `sheet->npc->treasure` | string<br>`STORED` | This location stores the value named `treasure` within NPC-only scalar metadata. | `RAW` — Direct NPC Treasure text; do not confuse it with the synthetic legacy `treasure` field. |

#### Bastion, shop, and other state

> **Value kinds**
>
> - `STORED` — A value or field stored directly at this location; it may be primitive or a container.
>
> **Usage**
>
> - `RAW` — Use the exact `sheet` path to read or deliberately change this existing primitive value.

| ScriptCards location | Value | Description | Use |
|---|---|---|---|
| `sheet->bastion->bastionDefenders` | string<br>`STORED` | This location stores the value named `bastionDefenders` within the character's Bastion state. | `RAW` |
| `sheet->bastion->bastionDescription` | string<br>`STORED` | This location stores the value named `bastionDescription` within the character's Bastion state. | `RAW` |
| `sheet->bastion->bastionLevel` | number<br>`STORED` | This location stores the value named `bastionLevel` within the character's Bastion state. | `RAW` |
| `sheet->bastion->characterLink` | string<br>`STORED` | This location stores the value named `characterLink` within the character's Bastion state. | `RAW` — This is a relationship identifier; write only a valid character link. |
| `sheet->shop->isLocked` | boolean<br>`STORED` | This location stores the value named `isLocked` within shop-sheet configuration and shop state. | `RAW` |
| `sheet->shop->lockDC` | number<br>`STORED` | This location stores the value named `lockDC` within shop-sheet configuration and shop state. | `RAW` |
| `sheet->shop->sheetToSheetEnabled` | boolean<br>`STORED` | This location stores the value named `sheetToSheetEnabled` within shop-sheet configuration and shop state. | `RAW` — Controls shop sheet-to-sheet transfers; it is independent of the shop lock state. |
| `sheet->shop->shopDescription` | string<br>`STORED` | This location stores the value named `shopDescription` within shop-sheet configuration and shop state. | `RAW` |
| `sheet->shop->shopDiscountMarkup` | number<br>`STORED` | This location stores the value named `shopDiscountMarkup` within shop-sheet configuration and shop state. | `RAW` |
| `sheet->shop->shopOwner` | string<br>`STORED` | This location stores the value named `shopOwner` within shop-sheet configuration and shop state. | `RAW` |
| `sheet->shop->shopStaff` | string<br>`STORED` | This location stores the value named `shopStaff` within shop-sheet configuration and shop state. | `RAW` |
| `sheet->shop->type` | string<br>`STORED` | Stores the shop type used by the shop sheet. | `RAW` — Identifies the shop-sheet type; do not change it merely to repurpose a normal character. |


## Typed canonical collections

Typed collections are the ScriptCards-facing way to inspect and change canonical Beacon records. They avoid exposing the sheet's internal record map or requiring an internal record key.

Use a zero-based index, `shortID`, canonical ID, or a unique identity value supported by that collection as `[selector]`:

```scard
[*S:actions->0->name]
[*S:actions->Dagger (Melee)->description]
[*S:abilityscores->Strength->valueFormula->flatValue]
[*S:speeds->Walk->valueFormula->flatValue]
```

Write an existing primitive field through the same typed path:

```scard
--!c:[&CharacterID]|actions->[selector]->actionType:Bonus Action
--!c:[&CharacterID]|speeds->Walk->valueFormula->flatValue:30
```

The complete low-level Beacon storage layout, internal record keys, builder data, and relationship map belong in the separate **D&D 2024 Beacon Sheet Map** README.

#### Ability Score records

**Purpose:** Ability Score records store the canonical details behind the finite ability-score inputs exposed by the sheet.

**Calculation:** The record fields store formula and component details. The direct ability-score aliases are finite inputs; ability modifiers and other dependent values are calculated from them.

**General use:** Use `strength`, `dexterity`, and the other direct ability aliases marked writable for ordinary score reads and writes. Use these records only when inspecting or deliberately changing record-level components.

> **Value kinds**
>
> - `INPUT` — A stored input used by the sheet to calculate another value.
> - `STORED` — A value or field stored directly at this location; it may be primitive or a container.
>
> **Usage**
>
> - `FIND` — Use the typed collection to locate and read the intended canonical record.
> - `INPUT` — Change this stored input when you want the sheet to recalculate the final result.
> - `RECORD` — After locating the record, write an existing primitive field through the typed collection path.
> - `TOGGLE` — Change this state only on the exact existing record or setting you intend to toggle.
> - `IDENTITY` — Treat this as record identity data and do not normally change it.

| Field | ScriptCards location | Value kind | Description | Use |
|---|---|---|---|---|
| `ability` | Typed: `abilityscores->[selector]->ability`<br>Raw: `sheet->integrants->integrants->[record-key]->ability` | `INPUT` | On an Ability Score record, this field identifies the ability used by this record or formula. | `FIND` + `INPUT` + `RECORD` |
| `calculation` | Typed: `abilityscores->[selector]->calculation`<br>Raw: `sheet->integrants->integrants->[record-key]->calculation` | `INPUT` | On an Ability Score record, this field identifies the calculation method used by this record. | `FIND` + `INPUT` + `RECORD` |
| `valueFormula.flatValue` | Typed: `abilityscores->[selector]->valueFormula->flatValue`<br>Raw: `sheet->integrants->integrants->[record-key]->valueFormula->flatValue` | `INPUT` | On an Ability Score record, this field stores a finite score component. | `FIND` + `INPUT` + `RECORD` — Use the matching direct ability alias for ordinary changes; edit this field only for deliberate record-level control. |
| `valueFormula.ability` | Typed: `abilityscores->[selector]->valueFormula->ability`<br>Raw: `sheet->integrants->integrants->[record-key]->valueFormula->ability` | `INPUT` | On an Ability Score record, this field identifies the ability used by this record or formula. | `FIND` + `INPUT` + `RECORD` |
| `_enabled` | Typed: `abilityscores->[selector]->_enabled`<br>Raw: `sheet->integrants->integrants->[record-key]->_enabled` | `STORED` | On an Ability Score record, this field stores whether the canonical record participates in the live character model. | `FIND` + `TOGGLE` + `RECORD` |
| `name` | Typed: `abilityscores->[selector]->name`<br>Raw: `sheet->integrants->integrants->[record-key]->name` | `STORED` | On an Ability Score record, this field stores the record's primary display name. | `FIND` + `IDENTITY` |
| `shortID` | Typed: `abilityscores->[selector]->shortID`<br>Raw: `sheet->integrants->integrants->[record-key]->shortID` | `STORED` | On an Ability Score record, this field stores the compact ID used by Beacon sheet action calls. | `FIND` + `IDENTITY` |

#### Action records

**Purpose:** Action records store non-attack Actions, Bonus Actions, Reactions, and Free Actions.

**Calculation:** No. These are stored action definitions.

**General use:** Use the typed collection to list and inspect actions. Use the record's `shortID` for Beacon sheet action calls; write existing fields through the typed collection when changing the action definition.

> **Value kinds**
>
> - `ORDER` — Stored ordering or index data containing positions or record identities.
> - `STORED` — A value or field stored directly at this location; it may be primitive or a container.
>
> **Usage**
>
> - `FIND` — Use the typed collection to locate and read the intended canonical record.
> - `RECORD` — After locating the record, write an existing primitive field through the typed collection path.
> - `IDENTITY` — Treat this as record identity data and do not normally change it.
> - `TOGGLE` — Change this state only on the exact existing record or setting you intend to toggle.
> - `ORDER` — Preserve valid existing record identities and change this only when intentionally reordering them.
> - `GRAPH` — Use this to traverse record relationships; write only with valid keys and a full understanding of the graph.

| Field | ScriptCards location | Value kind | Description | Use |
|---|---|---|---|---|
| `actionType` | Typed: `actions->[selector]->actionType`<br>Raw: `sheet->integrants->integrants->[record-key]->actionType` | `STORED` | On an Action record, this field identifies whether the record is an Action, Bonus Action, Reaction, Free Action, or another action category. | `FIND` + `RECORD` — Changing the category may also require the record identity to appear in the matching action display-order array. |
| `description` | Typed: `actions->[selector]->description`<br>Raw: `sheet->integrants->integrants->[record-key]->description` | `STORED` | On an Action record, this field stores the human-readable description. | `FIND` + `RECORD` |
| `name` | Typed: `actions->[selector]->name`<br>Raw: `sheet->integrants->integrants->[record-key]->name` | `STORED` | On an Action record, this field stores the record's primary display name. | `FIND` + `IDENTITY` |
| `shortID` | Typed: `actions->[selector]->shortID`<br>Raw: `sheet->integrants->integrants->[record-key]->shortID` | `STORED` | On an Action record, this field stores the compact ID used by Beacon sheet action calls. | `FIND` + `IDENTITY` — Use this for the Beacon action call; typed writes use the selected collection path. |
| `_enabled` | Typed: `actions->[selector]->_enabled`<br>Raw: `sheet->integrants->integrants->[record-key]->_enabled` | `STORED` | On an Action record, this field stores whether the canonical record participates in the live character model. | `FIND` + `TOGGLE` + `RECORD` |
| `arrayPosition` | Typed: `actions->[selector]->arrayPosition`<br>Raw: `sheet->integrants->integrants->[record-key]->arrayPosition` | `ORDER` | On an Action record, this field stores the record's relative display position among records of the same family. | `FIND` + `ORDER` |
| `parentID` | Typed: `actions->[selector]->parentID`<br>Raw: `sheet->integrants->integrants->[record-key]->parentID` | `STORED` | On an Action record, this field stores the relationship ID of the record's immediate parent. | `FIND` + `GRAPH` |
| `childIDs` | Typed: `actions->[selector]->childIDs`<br>Raw: `sheet->integrants->integrants->[record-key]->childIDs` | `STORED` | On an Action record, this field stores the relationship IDs of this record's immediate child records. | `FIND` + `GRAPH` — Contains relationship IDs; edit an existing array element rather than replacing the whole array. |

#### Armor Class records

**Purpose:** Armor Class records store formula and item-relationship details behind the finite `ac` input.

**Calculation:** The record fields store component and formula details. The direct alias `ac` is a finite input.

**General use:** Use `ac` for ordinary Armor Class reads and writes. Use `armorclasses` only to inspect or intentionally change a specific AC component.

> **Value kinds**
>
> - `INPUT` — A stored input used by the sheet to calculate another value.
> - `STORED` — A value or field stored directly at this location; it may be primitive or a container.
>
> **Usage**
>
> - `FIND` — Use the typed collection to locate and read the intended canonical record.
> - `INPUT` — Change this stored input when you want the sheet to recalculate the final result.
> - `RECORD` — After locating the record, write an existing primitive field through the typed collection path.
> - `TOGGLE` — Change this state only on the exact existing record or setting you intend to toggle.
> - `GRAPH` — Use this to traverse record relationships; write only with valid keys and a full understanding of the graph.
> - `IDENTITY` — Treat this as record identity data and do not normally change it.

| Field | ScriptCards location | Value kind | Description | Use |
|---|---|---|---|---|
| `calculation` | Typed: `armorclasses->[selector]->calculation`<br>Raw: `sheet->integrants->integrants->[record-key]->calculation` | `INPUT` | On an Armor Class record, this field identifies the calculation method used by this record. | `FIND` + `INPUT` + `RECORD` |
| `defaultAbility` | Typed: `armorclasses->[selector]->defaultAbility`<br>Raw: `sheet->integrants->integrants->[record-key]->defaultAbility` | `STORED` | On an Armor Class record, this field stores the default ability used by the formula. | `FIND` + `RECORD` |
| `valueFormula.flatValue` | Typed: `armorclasses->[selector]->valueFormula->flatValue`<br>Raw: `sheet->integrants->integrants->[record-key]->valueFormula->flatValue` | `INPUT` | On an Armor Class record, this field stores a finite value used as an input by a formula. | `FIND` + `INPUT` + `RECORD` |
| `valueFormula.ability` | Typed: `armorclasses->[selector]->valueFormula->ability`<br>Raw: `sheet->integrants->integrants->[record-key]->valueFormula->ability` | `INPUT` | On an Armor Class record, this field identifies the ability used by this record or formula. | `FIND` + `INPUT` + `RECORD` |
| `_enabled` | Typed: `armorclasses->[selector]->_enabled`<br>Raw: `sheet->integrants->integrants->[record-key]->_enabled` | `STORED` | On an Armor Class record, this field stores whether the canonical record participates in the live character model. | `FIND` + `TOGGLE` + `RECORD` |
| `parentID` | Typed: `armorclasses->[selector]->parentID`<br>Raw: `sheet->integrants->integrants->[record-key]->parentID` | `STORED` | On an Armor Class record, this field stores the relationship ID of the record's immediate parent. | `FIND` + `GRAPH` |
| `name` | Typed: `armorclasses->[selector]->name`<br>Raw: `sheet->integrants->integrants->[record-key]->name` | `STORED` | On an Armor Class record, this field stores the record's primary display name. | `FIND` + `IDENTITY` |
| `shortID` | Typed: `armorclasses->[selector]->shortID`<br>Raw: `sheet->integrants->integrants->[record-key]->shortID` | `STORED` | On an Armor Class record, this field stores the compact ID used by Beacon sheet action calls. | `FIND` + `IDENTITY` |

#### Attack records

**Purpose:** Attack records store attack mode, range, save information, and links to Damage records.

**Calculation:** Attack metadata is stored. Final to-hit and save values are calculated from these fields and other character inputs.

**General use:** Use the typed collection to find attacks and `shortID` for Beacon sheet action calls. Edit a typed field only when deliberately changing an existing attack.

> **Value kinds**
>
> - `INPUT` — A stored input used by the sheet to calculate another value.
> - `STORED` — A value or field stored directly at this location; it may be primitive or a container.
>
> **Usage**
>
> - `FIND` — Use the typed collection to locate and read the intended canonical record.
> - `RECORD` — After locating the record, write an existing primitive field through the typed collection path.
> - `IDENTITY` — Treat this as record identity data and do not normally change it.
> - `INPUT` — Change this stored input when you want the sheet to recalculate the final result.
> - `TOGGLE` — Change this state only on the exact existing record or setting you intend to toggle.
> - `GRAPH` — Use this to traverse record relationships; write only with valid keys and a full understanding of the graph.

| Field | ScriptCards location | Value kind | Description | Use |
|---|---|---|---|---|
| `actionType` | Typed: `attacks->[selector]->actionType`<br>Raw: `sheet->integrants->integrants->[record-key]->actionType` | `STORED` | On an Attack record, this field identifies whether the record is an Action, Bonus Action, Reaction, Free Action, or another action category. | `FIND` + `RECORD` |
| `attack.type` | Typed: `attacks->[selector]->attack->type`<br>Raw: `sheet->integrants->integrants->[record-key]->attack->type` | `STORED` | On an Attack record, this field identifies the canonical record type. | `FIND` + `IDENTITY` |
| `attack.abilityBonus` | Typed: `attacks->[selector]->attack->abilityBonus`<br>Raw: `sheet->integrants->integrants->[record-key]->attack->abilityBonus` | `STORED` | On an Attack record, this field stores the ability contribution used by the attack. | `FIND` + `RECORD` |
| `attack.proficiencyLevel` | Typed: `attacks->[selector]->attack->proficiencyLevel`<br>Raw: `sheet->integrants->integrants->[record-key]->attack->proficiencyLevel` | `INPUT` | On an Attack record, this field stores the proficiency tier, such as Proficient or Expertise. | `FIND` + `INPUT` + `RECORD` |
| `attack.bonus` | Typed: `attacks->[selector]->attack->bonus`<br>Raw: `sheet->integrants->integrants->[record-key]->attack->bonus` | `INPUT` | On an Attack record, this field stores a finite bonus or bonus expression. | `FIND` + `INPUT` + `RECORD` |
| `autoHit` | Typed: `attacks->[selector]->autoHit`<br>Raw: `sheet->integrants->integrants->[record-key]->autoHit` | `STORED` | On an Attack record, this field stores whether the attack skips an attack roll and automatically applies its effect or damage. | `FIND` + `RECORD` — Changes whether the attack rolls to hit; it does not change the attack bonus. |
| `repeat` | Typed: `attacks->[selector]->repeat`<br>Raw: `sheet->integrants->integrants->[record-key]->repeat` | `STORED` | On an Attack record, this field stores attack repetition or multiattack information. | `FIND` + `RECORD` |
| `range` | Typed: `attacks->[selector]->range`<br>Raw: `sheet->integrants->integrants->[record-key]->range` | `STORED` | On an Attack record, this field stores the attack or spell range. | `FIND` + `RECORD` |
| `_reach` | Typed: `attacks->[selector]->_reach`<br>Raw: `sheet->integrants->integrants->[record-key]->_reach` | `STORED` | On an Attack record, this field stores `_reach`. | `FIND` + `RECORD` |
| `_reachText` | Typed: `attacks->[selector]->_reachText`<br>Raw: `sheet->integrants->integrants->[record-key]->_reachText` | `STORED` | On an Attack record, this field stores `_reachText`. | `FIND` + `RECORD` |
| `save.saveAbility` | Typed: `attacks->[selector]->save->saveAbility`<br>Raw: `sheet->integrants->integrants->[record-key]->save->saveAbility` | `STORED` | On an Attack record, this field stores `saveAbility`. | `FIND` + `RECORD` |
| `save.saveFlat` | Typed: `attacks->[selector]->save->saveFlat`<br>Raw: `sheet->integrants->integrants->[record-key]->save->saveFlat` | `STORED` | On an Attack record, this field stores `saveFlat`. | `FIND` + `RECORD` |
| `save.saveFormula.flatValue` | Typed: `attacks->[selector]->save->saveFormula->flatValue`<br>Raw: `sheet->integrants->integrants->[record-key]->save->saveFormula->flatValue` | `INPUT` | On an Attack record, this field stores a finite value used as an input by a formula. | `FIND` + `INPUT` + `RECORD` |
| `save.onFail` | Typed: `attacks->[selector]->save->onFail`<br>Raw: `sheet->integrants->integrants->[record-key]->save->onFail` | `STORED` | On an Attack record, this field stores the effect or text used when a save fails. | `FIND` + `RECORD` |
| `save.onSucceed` | Typed: `attacks->[selector]->save->onSucceed`<br>Raw: `sheet->integrants->integrants->[record-key]->save->onSucceed` | `STORED` | On an Attack record, this field stores the effect or text used when a save succeeds. | `FIND` + `RECORD` |
| `onHitDisplay` | Typed: `attacks->[selector]->onHitDisplay`<br>Raw: `sheet->integrants->integrants->[record-key]->onHitDisplay` | `STORED` | On an Attack record, this field stores `onHitDisplay`. | `FIND` + `RECORD` |
| `description` | Typed: `attacks->[selector]->description`<br>Raw: `sheet->integrants->integrants->[record-key]->description` | `STORED` | On an Attack record, this field stores the human-readable description. | `FIND` + `RECORD` |
| `name` | Typed: `attacks->[selector]->name`<br>Raw: `sheet->integrants->integrants->[record-key]->name` | `STORED` | On an Attack record, this field stores the record's primary display name. | `FIND` + `IDENTITY` |
| `shortID` | Typed: `attacks->[selector]->shortID`<br>Raw: `sheet->integrants->integrants->[record-key]->shortID` | `STORED` | On an Attack record, this field stores the compact ID used by Beacon sheet action calls. | `FIND` + `IDENTITY` — Use this for the Beacon attack action call; typed writes use the selected collection path. |
| `_enabled` | Typed: `attacks->[selector]->_enabled`<br>Raw: `sheet->integrants->integrants->[record-key]->_enabled` | `STORED` | On an Attack record, this field stores whether the canonical record participates in the live character model. | `FIND` + `TOGGLE` + `RECORD` |
| `parentID` | Typed: `attacks->[selector]->parentID`<br>Raw: `sheet->integrants->integrants->[record-key]->parentID` | `STORED` | On an Attack record, this field stores the relationship ID of the record's immediate parent. | `FIND` + `GRAPH` |
| `childIDs` | Typed: `attacks->[selector]->childIDs`<br>Raw: `sheet->integrants->integrants->[record-key]->childIDs` | `STORED` | On an Attack record, this field stores the relationship IDs of this record's immediate child records. | `FIND` + `GRAPH` — Follow these linked record IDs to linked Damage or other child records; do not replace the whole array. |

#### Attunement records

**Purpose:** Attunement records store whether a related item is attuned and whether equipping is required.

**Calculation:** No. These are stored state and relationship fields.

**General use:** Read these records when item effects depend on attunement. Change `_attuned` only on the existing record that belongs to the intended item.

> **Value kinds**
>
> - `STORED` — A value or field stored directly at this location; it may be primitive or a container.
>
> **Usage**
>
> - `FIND` — Use the typed collection to locate and read the intended canonical record.
> - `TOGGLE` — Change this state only on the exact existing record or setting you intend to toggle.
> - `RECORD` — After locating the record, write an existing primitive field through the typed collection path.
> - `GRAPH` — Use this to traverse record relationships; write only with valid keys and a full understanding of the graph.
> - `IDENTITY` — Treat this as record identity data and do not normally change it.

| Field | ScriptCards location | Value kind | Description | Use |
|---|---|---|---|---|
| `_attuned` | Typed: `attunements->[selector]->_attuned`<br>Raw: `sheet->integrants->integrants->[record-key]->_attuned` | `STORED` | On an Attunement record, this field stores whether the item is currently attuned. | `FIND` + `TOGGLE` + `RECORD` — This is the actual attunement state; `_enabled` only controls whether the record participates. |
| `requireEquip` | Typed: `attunements->[selector]->requireEquip`<br>Raw: `sheet->integrants->integrants->[record-key]->requireEquip` | `STORED` | On an Attunement record, this field stores `requireEquip`. | `FIND` + `RECORD` |
| `parentID` | Typed: `attunements->[selector]->parentID`<br>Raw: `sheet->integrants->integrants->[record-key]->parentID` | `STORED` | On an Attunement record, this field stores the relationship ID of the record's immediate parent. | `FIND` + `GRAPH` |
| `childIDs` | Typed: `attunements->[selector]->childIDs`<br>Raw: `sheet->integrants->integrants->[record-key]->childIDs` | `STORED` | On an Attunement record, this field stores the relationship IDs of this record's immediate child records. | `FIND` + `GRAPH` |
| `_enabled` | Typed: `attunements->[selector]->_enabled`<br>Raw: `sheet->integrants->integrants->[record-key]->_enabled` | `STORED` | On an Attunement record, this field stores whether the canonical record participates in the live character model. | `FIND` + `TOGGLE` + `RECORD` |
| `name` | Typed: `attunements->[selector]->name`<br>Raw: `sheet->integrants->integrants->[record-key]->name` | `STORED` | On an Attunement record, this field stores the record's primary display name. | `FIND` + `IDENTITY` |
| `shortID` | Typed: `attunements->[selector]->shortID`<br>Raw: `sheet->integrants->integrants->[record-key]->shortID` | `STORED` | On an Attunement record, this field stores the compact ID used by Beacon sheet action calls. | `FIND` + `IDENTITY` |

#### Background records

**Purpose:** Background records store the canonical background and its related child records.

**Calculation:** No. These are stored background definitions and relationships.

**General use:** Use translated background fields for display text. Use the canonical record when you need its description or graph relationships.

> **Value kinds**
>
> - `STORED` — A value or field stored directly at this location; it may be primitive or a container.
>
> **Usage**
>
> - `FIND` — Use the typed collection to locate and read the intended canonical record.
> - `RECORD` — After locating the record, write an existing primitive field through the typed collection path.
> - `GRAPH` — Use this to traverse record relationships; write only with valid keys and a full understanding of the graph.
> - `IDENTITY` — Treat this as record identity data and do not normally change it.
> - `TOGGLE` — Change this state only on the exact existing record or setting you intend to toggle.

| Field | ScriptCards location | Value kind | Description | Use |
|---|---|---|---|---|
| `description` | Typed: `backgrounds->[selector]->description`<br>Raw: `sheet->integrants->integrants->[record-key]->description` | `STORED` | On a Background record, this field stores the human-readable description. | `FIND` + `RECORD` |
| `childIDs` | Typed: `backgrounds->[selector]->childIDs`<br>Raw: `sheet->integrants->integrants->[record-key]->childIDs` | `STORED` | On a Background record, this field stores the relationship IDs of this record's immediate child records. | `FIND` + `GRAPH` |
| `name` | Typed: `backgrounds->[selector]->name`<br>Raw: `sheet->integrants->integrants->[record-key]->name` | `STORED` | On a Background record, this field stores the record's primary display name. | `FIND` + `IDENTITY` |
| `shortID` | Typed: `backgrounds->[selector]->shortID`<br>Raw: `sheet->integrants->integrants->[record-key]->shortID` | `STORED` | On a Background record, this field stores the compact ID used by Beacon sheet action calls. | `FIND` + `IDENTITY` |
| `_enabled` | Typed: `backgrounds->[selector]->_enabled`<br>Raw: `sheet->integrants->integrants->[record-key]->_enabled` | `STORED` | On a Background record, this field stores whether the canonical record participates in the live character model. | `FIND` + `TOGGLE` + `RECORD` |

#### Class records

**Purpose:** Class records store the canonical class identity and related feature/level records.

**Calculation:** No. These are stored identity and relationship fields.

**General use:** Use translated class fields for simple display. Use Class records when traversing multiclass ownership or child records.

> **Value kinds**
>
> - `STORED` — A value or field stored directly at this location; it may be primitive or a container.
>
> **Usage**
>
> - `FIND` — Use the typed collection to locate and read the intended canonical record.
> - `GRAPH` — Use this to traverse record relationships; write only with valid keys and a full understanding of the graph.
> - `IDENTITY` — Treat this as record identity data and do not normally change it.
> - `TOGGLE` — Change this state only on the exact existing record or setting you intend to toggle.
> - `RECORD` — After locating the record, write an existing primitive field through the typed collection path.

| Field | ScriptCards location | Value kind | Description | Use |
|---|---|---|---|---|
| `childIDs` | Typed: `classes->[selector]->childIDs`<br>Raw: `sheet->integrants->integrants->[record-key]->childIDs` | `STORED` | On a Class record, this field stores the relationship IDs of this record's immediate child records. | `FIND` + `GRAPH` |
| `name` | Typed: `classes->[selector]->name`<br>Raw: `sheet->integrants->integrants->[record-key]->name` | `STORED` | On a Class record, this field stores the record's primary display name. | `FIND` + `IDENTITY` |
| `shortID` | Typed: `classes->[selector]->shortID`<br>Raw: `sheet->integrants->integrants->[record-key]->shortID` | `STORED` | On a Class record, this field stores the compact ID used by Beacon sheet action calls. | `FIND` + `IDENTITY` |
| `_enabled` | Typed: `classes->[selector]->_enabled`<br>Raw: `sheet->integrants->integrants->[record-key]->_enabled` | `STORED` | On a Class record, this field stores whether the canonical record participates in the live character model. | `FIND` + `TOGGLE` + `RECORD` |
| `sourceID` | Typed: `classes->[selector]->sourceID`<br>Raw: `sheet->integrants->integrants->[record-key]->sourceID` | `STORED` | On a Class record, this field stores the originating source record identifier. | `FIND` + `IDENTITY` |

#### Class Level records

**Purpose:** Class Level records store class-specific progression stages. Each valid record's `totalLevel` is one contribution to the character-wide level used by proficiency bonus.

**Calculation:** The level fields are stored inputs. ScriptCards derives total `level` and `pb` by summing positive finite `totalLevel` contributions from active Class Level records whose `classID` is populated. `base_level` is the total for the primary-class graph. Records with a blank `classID` are internal and do not contribute.

**General use:** Use `level` and `pb` for character-wide values and `base_level` for primary-class level. Use these records for class-specific totals, multiclass displays, subclass ownership, or individual `totalLevel` contributions. Do not sum the `level` field; it identifies the progression stage represented by that record.

> **Value kinds**
>
> - `INPUT` — A stored input used by the sheet to calculate another value.
> - `STORED` — A value or field stored directly at this location; it may be primitive or a container.
>
> **Usage**
>
> - `FIND` — Use the typed collection to locate and read the intended canonical record.
> - `RECORD` — After locating the record, write an existing primitive field through the typed collection path.
> - `INPUT` — Change this stored input when you want the sheet to recalculate the final result.
> - `IDENTITY` — Treat this as record identity data and do not normally change it.
> - `TOGGLE` — Change this state only on the exact existing record or setting you intend to toggle.
> - `GRAPH` — Use this to traverse record relationships; write only with valid keys and a full understanding of the graph.

| Field | ScriptCards location | Value kind | Description | Use |
|---|---|---|---|---|
| `classID` | Typed: `classlevels->[selector]->classID`<br>Raw: `sheet->integrants->integrants->[record-key]->classID` | `STORED` | On a Class Level record, this field identifies the owning Class record. | `FIND` + `RECORD` |
| `level` | Typed: `classlevels->[selector]->level`<br>Raw: `sheet->integrants->integrants->[record-key]->level` | `INPUT` | Identifies the class-progression stage represented by this record. It is not the additive contribution used to total multiclass levels. | `FIND` + `INPUT` + `RECORD` |
| `totalLevel` | Typed: `classlevels->[selector]->totalLevel`<br>Raw: `sheet->integrants->integrants->[record-key]->totalLevel` | `INPUT` | On a valid Class Level record, this field stores one contribution to the character-wide level aggregate used by calculations such as proficiency bonus. Sum the contributions from active records with populated `classID`; do not treat one record as the complete character total. | `FIND` + `INPUT` + `RECORD` |
| `subClassID` | Typed: `classlevels->[selector]->subClassID`<br>Raw: `sheet->integrants->integrants->[record-key]->subClassID` | `STORED` | On a Class Level record, this field stores `subClassID`. | `FIND` + `RECORD` |
| `name` | Typed: `classlevels->[selector]->name`<br>Raw: `sheet->integrants->integrants->[record-key]->name` | `STORED` | On a Class Level record, this field stores the record's primary display name. | `FIND` + `IDENTITY` |
| `shortID` | Typed: `classlevels->[selector]->shortID`<br>Raw: `sheet->integrants->integrants->[record-key]->shortID` | `STORED` | On a Class Level record, this field stores the compact ID used by Beacon sheet action calls. | `FIND` + `IDENTITY` |
| `_enabled` | Typed: `classlevels->[selector]->_enabled`<br>Raw: `sheet->integrants->integrants->[record-key]->_enabled` | `STORED` | On a Class Level record, this field stores whether the canonical record participates in the live character model. | `FIND` + `TOGGLE` + `RECORD` |
| `parentID` | Typed: `classlevels->[selector]->parentID`<br>Raw: `sheet->integrants->integrants->[record-key]->parentID` | `STORED` | On a Class Level record, this field stores the relationship ID of the record's immediate parent. | `FIND` + `GRAPH` |

#### Condition records

**Purpose:** Condition records store active conditions and their related child effects.

**Calculation:** No. The condition state is stored; downstream roll effects may be calculated.

**General use:** Read `_active` and child relationships to determine condition state. Change `_active` only on the intended existing condition record.

> **Value kinds**
>
> - `STORED` — A value or field stored directly at this location; it may be primitive or a container.
>
> **Usage**
>
> - `FIND` — Use the typed collection to locate and read the intended canonical record.
> - `TOGGLE` — Change this state only on the exact existing record or setting you intend to toggle.
> - `RECORD` — After locating the record, write an existing primitive field through the typed collection path.
> - `GRAPH` — Use this to traverse record relationships; write only with valid keys and a full understanding of the graph.
> - `IDENTITY` — Treat this as record identity data and do not normally change it.

| Field | ScriptCards location | Value kind | Description | Use |
|---|---|---|---|---|
| `_active` | Typed: `conditions->[selector]->_active`<br>Raw: `sheet->integrants->integrants->[record-key]->_active` | `STORED` | On a Condition record, this field stores whether this record or effect is currently active. | `FIND` + `TOGGLE` + `RECORD` — This is the actual condition state; `_enabled` only controls whether the record participates. |
| `description` | Typed: `conditions->[selector]->description`<br>Raw: `sheet->integrants->integrants->[record-key]->description` | `STORED` | On a Condition record, this field stores the human-readable description. | `FIND` + `RECORD` |
| `childIDs` | Typed: `conditions->[selector]->childIDs`<br>Raw: `sheet->integrants->integrants->[record-key]->childIDs` | `STORED` | On a Condition record, this field stores the relationship IDs of this record's immediate child records. | `FIND` + `GRAPH` |
| `name` | Typed: `conditions->[selector]->name`<br>Raw: `sheet->integrants->integrants->[record-key]->name` | `STORED` | On a Condition record, this field stores the record's primary display name. | `FIND` + `IDENTITY` |
| `shortID` | Typed: `conditions->[selector]->shortID`<br>Raw: `sheet->integrants->integrants->[record-key]->shortID` | `STORED` | On a Condition record, this field stores the compact ID used by Beacon sheet action calls. | `FIND` + `IDENTITY` |
| `_enabled` | Typed: `conditions->[selector]->_enabled`<br>Raw: `sheet->integrants->integrants->[record-key]->_enabled` | `STORED` | On a Condition record, this field stores whether the canonical record participates in the live character model. | `FIND` + `TOGGLE` + `RECORD` |

#### Currency records

**Purpose:** Currency records store the finite amount and currency-conversion metadata.

**Calculation:** No. The amount is stored; conversions use the stored metadata.

**General use:** Prefer the verified direct aliases `cp`, `sp`, `ep`, `gp`, and `pp` for ordinary currency changes. Use records for conversion information.

> **Value kinds**
>
> - `STORED` — A value or field stored directly at this location; it may be primitive or a container.
>
> **Usage**
>
> - `FIND` — Use the typed collection to locate and read the intended canonical record.
> - `RECORD` — After locating the record, write an existing primitive field through the typed collection path.
> - `IDENTITY` — Treat this as record identity data and do not normally change it.
> - `TOGGLE` — Change this state only on the exact existing record or setting you intend to toggle.

| Field | ScriptCards location | Value kind | Description | Use |
|---|---|---|---|---|
| `value` | Typed: `currencies->[selector]->value`<br>Raw: `sheet->integrants->integrants->[record-key]->value` | `STORED` | On a Currency record, this field stores the record's finite current value. | `FIND` + `RECORD` — Prefer `cp`, `sp`, `ep`, `gp`, or `pp` for ordinary amount changes; use the record for conversion details. |
| `conversion.target` | Typed: `currencies->[selector]->conversion->target`<br>Raw: `sheet->integrants->integrants->[record-key]->conversion->target` | `STORED` | On a Currency record, this field stores `target`. | `FIND` + `RECORD` |
| `conversion.amountOfTarget` | Typed: `currencies->[selector]->conversion->amountOfTarget`<br>Raw: `sheet->integrants->integrants->[record-key]->conversion->amountOfTarget` | `STORED` | On a Currency record, this field stores `amountOfTarget`. | `FIND` + `RECORD` |
| `name` | Typed: `currencies->[selector]->name`<br>Raw: `sheet->integrants->integrants->[record-key]->name` | `STORED` | On a Currency record, this field stores the record's primary display name. | `FIND` + `IDENTITY` |
| `shortID` | Typed: `currencies->[selector]->shortID`<br>Raw: `sheet->integrants->integrants->[record-key]->shortID` | `STORED` | On a Currency record, this field stores the compact ID used by Beacon sheet action calls. | `FIND` + `IDENTITY` |
| `_enabled` | Typed: `currencies->[selector]->_enabled`<br>Raw: `sheet->integrants->integrants->[record-key]->_enabled` | `STORED` | On a Currency record, this field stores whether the canonical record participates in the live character model. | `FIND` + `TOGGLE` + `RECORD` |

#### Damage records

**Purpose:** Damage records store dice, flat bonuses, ability contribution, damage type, and critical behavior.

**Calculation:** The record fields are stored inputs. Final damage rolls are calculated.

**General use:** Locate Damage records through the parent Attack or Spell relationship. Change the finite damage inputs rather than a generated repeating-row damage string.

> **Value kinds**
>
> - `INPUT` — A stored input used by the sheet to calculate another value.
> - `STORED` — A value or field stored directly at this location; it may be primitive or a container.
>
> **Usage**
>
> - `FIND` — Use the typed collection to locate and read the intended canonical record.
> - `INPUT` — Change this stored input when you want the sheet to recalculate the final result.
> - `RECORD` — After locating the record, write an existing primitive field through the typed collection path.
> - `GRAPH` — Use this to traverse record relationships; write only with valid keys and a full understanding of the graph.
> - `IDENTITY` — Treat this as record identity data and do not normally change it.
> - `TOGGLE` — Change this state only on the exact existing record or setting you intend to toggle.

| Field | ScriptCards location | Value kind | Description | Use |
|---|---|---|---|---|
| `_diceCount` | Typed: `damages->[selector]->_diceCount`<br>Raw: `sheet->integrants->integrants->[record-key]->_diceCount` | `INPUT` | On a Damage record, this field stores `_diceCount`. | `FIND` + `INPUT` + `RECORD` |
| `diceSize` | Typed: `damages->[selector]->diceSize`<br>Raw: `sheet->integrants->integrants->[record-key]->diceSize` | `INPUT` | On a Damage record, this field stores the die size. | `FIND` + `INPUT` + `RECORD` |
| `_bonus` | Typed: `damages->[selector]->_bonus`<br>Raw: `sheet->integrants->integrants->[record-key]->_bonus` | `INPUT` | On a Damage record, this field stores `_bonus`. | `FIND` + `INPUT` + `RECORD` |
| `ability` | Typed: `damages->[selector]->ability`<br>Raw: `sheet->integrants->integrants->[record-key]->ability` | `INPUT` | On a Damage record, this field identifies the ability used by this record or formula. | `FIND` + `INPUT` + `RECORD` |
| `damageType` | Typed: `damages->[selector]->damageType`<br>Raw: `sheet->integrants->integrants->[record-key]->damageType` | `STORED` | On a Damage record, this field stores the damage type. | `FIND` + `RECORD` |
| `overrideCrit` | Typed: `damages->[selector]->overrideCrit`<br>Raw: `sheet->integrants->integrants->[record-key]->overrideCrit` | `STORED` | On a Damage record, this field stores `overrideCrit`. | `FIND` + `RECORD` |
| `critDiceSize` | Typed: `damages->[selector]->critDiceSize`<br>Raw: `sheet->integrants->integrants->[record-key]->critDiceSize` | `STORED` | On a Damage record, this field stores `critDiceSize`. | `FIND` + `RECORD` |
| `parentID` | Typed: `damages->[selector]->parentID`<br>Raw: `sheet->integrants->integrants->[record-key]->parentID` | `STORED` | On a Damage record, this field stores the relationship ID of the record's immediate parent. | `FIND` + `GRAPH` — Use this linked record ID to identify the owning Attack, Spell, or other parent record. |
| `name` | Typed: `damages->[selector]->name`<br>Raw: `sheet->integrants->integrants->[record-key]->name` | `STORED` | On a Damage record, this field stores the record's primary display name. | `FIND` + `IDENTITY` |
| `shortID` | Typed: `damages->[selector]->shortID`<br>Raw: `sheet->integrants->integrants->[record-key]->shortID` | `STORED` | On a Damage record, this field stores the compact ID used by Beacon sheet action calls. | `FIND` + `IDENTITY` |
| `_enabled` | Typed: `damages->[selector]->_enabled`<br>Raw: `sheet->integrants->integrants->[record-key]->_enabled` | `STORED` | On a Damage record, this field stores whether the canonical record participates in the live character model. | `FIND` + `TOGGLE` + `RECORD` |

#### Defense records

**Purpose:** Defense records store damage immunities, resistances, vulnerabilities, and condition defenses.

**Calculation:** No. These are stored defense definitions.

**General use:** Use the typed collection to build defense lists. Before including a record, follow its complete `parentID` chain and require active Condition or Effect state, active Attunement, and an equipped Item when `requireEquip` is true. Edit only the existing Defense record that represents the intended immunity, resistance, vulnerability, or condition defense.

> **Value kinds**
>
> - `STORED` — A value or field stored directly at this location; it may be primitive or a container.
>
> **Usage**
>
> - `FIND` — Use the typed collection to locate and read the intended canonical record.
> - `RECORD` — After locating the record, write an existing primitive field through the typed collection path.
> - `IDENTITY` — Treat this as record identity data and do not normally change it.
> - `TOGGLE` — Change this state only on the exact existing record or setting you intend to toggle.
> - `GRAPH` — Use this to traverse record relationships; write only with valid keys and a full understanding of the graph.

| Field | ScriptCards location | Value kind | Description | Use |
|---|---|---|---|---|
| `defense` | Typed: `defenses->[selector]->defense`<br>Raw: `sheet->integrants->integrants->[record-key]->defense` | `STORED` | On a Defense record, this field stores `defense`. | `FIND` + `RECORD` |
| `damage` | Typed: `defenses->[selector]->damage`<br>Raw: `sheet->integrants->integrants->[record-key]->damage` | `STORED` | On a Defense record, this field stores the defense record's damage category or damage-type data. | `FIND` + `RECORD` |
| `condition` | Typed: `defenses->[selector]->condition`<br>Raw: `sheet->integrants->integrants->[record-key]->condition` | `STORED` | On a Defense record, this field stores `condition`. | `FIND` + `RECORD` |
| `name` | Typed: `defenses->[selector]->name`<br>Raw: `sheet->integrants->integrants->[record-key]->name` | `STORED` | On a Defense record, this field stores the record's primary display name. | `FIND` + `IDENTITY` |
| `shortID` | Typed: `defenses->[selector]->shortID`<br>Raw: `sheet->integrants->integrants->[record-key]->shortID` | `STORED` | On a Defense record, this field stores the compact ID used by Beacon sheet action calls. | `FIND` + `IDENTITY` |
| `_enabled` | Typed: `defenses->[selector]->_enabled`<br>Raw: `sheet->integrants->integrants->[record-key]->_enabled` | `STORED` | On a Defense record, this field stores whether the canonical record participates in the live character model. | `FIND` + `TOGGLE` + `RECORD` |
| `parentID` | Typed: `defenses->[selector]->parentID`<br>Raw: `sheet->integrants->integrants->[record-key]->parentID` | `STORED` | On a Defense record, this field stores the relationship ID of the record's immediate parent. | `FIND` + `GRAPH` |

#### Effect records

**Purpose:** Effect records group dynamic sheet effects and can own or gate downstream calculations, Roll Bonuses, and Defenses.

**Calculation:** The Effect fields are stored. A calculated alias includes descendants only while the complete parent activation chain is active.

**General use:** Use `effects` to inspect existing Effect records. `_enabled` controls record availability; `_active` is the current effect state. Persistent enabled records with `_active = false` are normal. Effect creation, removal, and active-state writes are not mapped as general ScriptCards operations, so read the existing record and follow its relationships without assuming a universal lifecycle write.

> **Value kinds**
>
> - `STORED` — A value or field stored directly at this location.
>
> **Usage**
>
> - `FIND` — Use the typed collection to locate and read the intended canonical record.
> - `IDENTITY` — Treat this as record identity data and do not normally change it.
> - `GRAPH` — Use this to traverse record relationships; write only with valid keys and a full understanding of the graph.
> - `UNVERIFIED` — Do not write this field merely because it is readable; its general lifecycle behavior has not been verified.

| Field | ScriptCards location | Value kind | Description | Use |
|---|---|---|---|---|
| `_active` | Typed: `effects->[selector]->_active`<br>Raw: `sheet->integrants->integrants->[record-key]->_active` | `STORED` | Whether the existing Effect is currently active. Distinct from `_enabled`. | `FIND` + `UNVERIFIED` |
| `_enabled` | Typed: `effects->[selector]->_enabled`<br>Raw: `sheet->integrants->integrants->[record-key]->_enabled` | `STORED` | Whether the Effect participates in the canonical model. Distinct from `_active`. | `FIND` + `UNVERIFIED` |
| `category` | Typed: `effects->[selector]->category`<br>Raw: `sheet->integrants->integrants->[record-key]->category` | `STORED` | Serialized JSON array text identifying affected categories when present; parse before treating it as a list. | `FIND` |
| `damageType` | Typed: `effects->[selector]->damageType`<br>Raw: `sheet->integrants->integrants->[record-key]->damageType` | `STORED` | Optional damage-type value on Effects that apply to a damage type. | `FIND` |
| `description` | Typed: `effects->[selector]->description`<br>Raw: `sheet->integrants->integrants->[record-key]->description` | `STORED` | Human-readable Effect description. | `FIND` |
| `name` | Typed: `effects->[selector]->name`<br>Raw: `sheet->integrants->integrants->[record-key]->name` | `STORED` | Effect display name. | `FIND` + `IDENTITY` |
| `shortID` | Typed: `effects->[selector]->shortID`<br>Raw: `sheet->integrants->integrants->[record-key]->shortID` | `STORED` | Compact Beacon identity. | `FIND` + `IDENTITY` |
| `parentID` | Typed: `effects->[selector]->parentID`<br>Raw: `sheet->integrants->integrants->[record-key]->parentID` | `STORED` | Immediate parent identity when present. | `FIND` + `GRAPH` |
| `childIDs` | Typed: `effects->[selector]->childIDs`<br>Raw: `sheet->integrants->integrants->[record-key]->childIDs` | `STORED` | Immediate child identities. Effect mechanics may be implemented by these linked records. | `FIND` + `GRAPH` |

#### Exhaustion records

**Purpose:** The Exhaustion record stores the finite exhaustion value.

**Calculation:** No. The exhaustion level is stored.

**General use:** Use the translated exhaustion value when it is available. Use the record's `value` field when you need the canonical stored level.

> **Value kinds**
>
> - `STORED` — A value or field stored directly at this location; it may be primitive or a container.
>
> **Usage**
>
> - `FIND` — Use the typed collection to locate and read the intended canonical record.
> - `RECORD` — After locating the record, write an existing primitive field through the typed collection path.
> - `IDENTITY` — Treat this as record identity data and do not normally change it.
> - `TOGGLE` — Change this state only on the exact existing record or setting you intend to toggle.

| Field | ScriptCards location | Value kind | Description | Use |
|---|---|---|---|---|
| `value` | Typed: `exhaustions->[selector]->value`<br>Raw: `sheet->integrants->integrants->[record-key]->value` | `STORED` | On an Exhaustion record, this field stores the record's finite current value. | `FIND` + `RECORD` |
| `name` | Typed: `exhaustions->[selector]->name`<br>Raw: `sheet->integrants->integrants->[record-key]->name` | `STORED` | On an Exhaustion record, this field stores the record's primary display name. | `FIND` + `IDENTITY` |
| `shortID` | Typed: `exhaustions->[selector]->shortID`<br>Raw: `sheet->integrants->integrants->[record-key]->shortID` | `STORED` | On an Exhaustion record, this field stores the compact ID used by Beacon sheet action calls. | `FIND` + `IDENTITY` |
| `_enabled` | Typed: `exhaustions->[selector]->_enabled`<br>Raw: `sheet->integrants->integrants->[record-key]->_enabled` | `STORED` | On an Exhaustion record, this field stores whether the canonical record participates in the live character model. | `FIND` + `TOGGLE` + `RECORD` |

#### Features records

**Purpose:** Feature records store feature names, descriptions, relationships, and enabled state.

**Calculation:** No. These are stored feature definitions; their effects can feed later calculations.

**General use:** Use the typed collection to list features and read descriptions. Edit typed fields only when intentionally changing an existing feature.

> **Value kinds**
>
> - `ORDER` — Stored ordering or index data containing positions or record identities.
> - `STORED` — A value or field stored directly at this location; it may be primitive or a container.
>
> **Usage**
>
> - `FIND` — Use the typed collection to locate and read the intended canonical record.
> - `RECORD` — After locating the record, write an existing primitive field through the typed collection path.
> - `GRAPH` — Use this to traverse record relationships; write only with valid keys and a full understanding of the graph.
> - `IDENTITY` — Treat this as record identity data and do not normally change it.
> - `TOGGLE` — Change this state only on the exact existing record or setting you intend to toggle.
> - `ORDER` — Preserve valid existing record identities and change this only when intentionally reordering them.

| Field | ScriptCards location | Value kind | Description | Use |
|---|---|---|---|---|
| `description` | Typed: `features->[selector]->description`<br>Raw: `sheet->integrants->integrants->[record-key]->description` | `STORED` | On a Features record, this field stores the human-readable description. | `FIND` + `RECORD` |
| `childIDs` | Typed: `features->[selector]->childIDs`<br>Raw: `sheet->integrants->integrants->[record-key]->childIDs` | `STORED` | On a Features record, this field stores the relationship IDs of this record's immediate child records. | `FIND` + `GRAPH` |
| `relations` | Typed: `features->[selector]->relations`<br>Raw: `sheet->integrants->integrants->[record-key]->relations` | `STORED` | On a Features record, this field stores relationships that connect this record to other records. | `FIND` + `GRAPH` |
| `name` | Typed: `features->[selector]->name`<br>Raw: `sheet->integrants->integrants->[record-key]->name` | `STORED` | On a Features record, this field stores the record's primary display name. | `FIND` + `IDENTITY` |
| `shortID` | Typed: `features->[selector]->shortID`<br>Raw: `sheet->integrants->integrants->[record-key]->shortID` | `STORED` | On a Features record, this field stores the compact ID used by Beacon sheet action calls. | `FIND` + `IDENTITY` |
| `_enabled` | Typed: `features->[selector]->_enabled`<br>Raw: `sheet->integrants->integrants->[record-key]->_enabled` | `STORED` | On a Features record, this field stores whether the canonical record participates in the live character model. | `FIND` + `TOGGLE` + `RECORD` |
| `arrayPosition` | Typed: `features->[selector]->arrayPosition`<br>Raw: `sheet->integrants->integrants->[record-key]->arrayPosition` | `ORDER` | On a Features record, this field stores the record's relative display position among records of the same family. | `FIND` + `ORDER` |
| `parentID` | Typed: `features->[selector]->parentID`<br>Raw: `sheet->integrants->integrants->[record-key]->parentID` | `STORED` | On a Features record, this field stores the relationship ID of the record's immediate parent. | `FIND` + `GRAPH` |

#### Healing records

**Purpose:** Healing records are a confirmed canonical family associated with healing effects and progression.

**Locations:** Typed: `healings->[selector]`; raw record: `sheet->integrants->integrants->[record-key]`.

**Calculation:** Not mapped. The family is available through the `healings` typed collection, but its type-specific payload contract has not been established.

**General use:** Use a numeric index or an identity actually present on the record, inspect the returned record, and rely only on fields present in that payload. No general Healing write target is documented.

```scard
[*S:healings->0]
[*S:healings->0->type]
```

#### Hit Dice records

**Purpose:** Hit Dice records store class-specific Hit Dice entitlement. Expenditure is stored separately under `sheet->rest->usedHitDiceData`.

**Calculation:** `hit_dice_max` is the sum of active `dieCount` values. Current `hit_dice` subtracts every `usedHitDice` value under `sheet->rest->usedHitDiceData` and clamps the result at zero. Spending a die does not change the entitlement records.

**General use:** Read the aggregate aliases for current and maximum totals. The direct `hit_dice` write remains available for an ordinary aggregate change, but mixed-pool allocation semantics are not mapped. Use the records together with `sheet->rest->usedHitDiceData->[poolKey]->dieSize` and `usedHitDice` when class, die-size, or expenditure detail matters. Do not change `dieCount` merely to spend a die.

> **Value kinds**
>
> - `INPUT` — A stored input used by the sheet to calculate another value.
> - `STORED` — A value or field stored directly at this location; it may be primitive or a container.
>
> **Usage**
>
> - `FIND` — Use the typed collection to locate and read the intended canonical record.
> - `RECORD` — After locating the record, write an existing primitive field through the typed collection path.
> - `INPUT` — Change this stored input when you want the sheet to recalculate the final result.
> - `IDENTITY` — Treat this as record identity data and do not normally change it.
> - `TOGGLE` — Change this state only on the exact existing record or setting you intend to toggle.
> - `GRAPH` — Use this to traverse record relationships; write only with valid keys and a full understanding of the graph.

| Field | ScriptCards location | Value kind | Description | Use |
|---|---|---|---|---|
| `classID` | Typed: `hitdices->[selector]->classID`<br>Raw: `sheet->integrants->integrants->[record-key]->classID` | `STORED` | On a Hit Dice record, this field identifies the owning Class record. | `FIND` + `RECORD` — Stores the owning Class record identity, not the Class `shortID` or display name. |
| `dieCount` | Typed: `hitdices->[selector]->dieCount`<br>Raw: `sheet->integrants->integrants->[record-key]->dieCount` | `STORED` | Stores the number of dice granted by this entitlement record, not the remaining unspent count. | `FIND` + `RECORD` |
| `dieSize` | Typed: `hitdices->[selector]->dieSize`<br>Raw: `sheet->integrants->integrants->[record-key]->dieSize` | `STORED` | On a Hit Dice record, this field stores `dieSize`. | `FIND` + `RECORD` |
| `ability` | Typed: `hitdices->[selector]->ability`<br>Raw: `sheet->integrants->integrants->[record-key]->ability` | `INPUT` | On a Hit Dice record, this field identifies the ability used by this record or formula. | `FIND` + `INPUT` + `RECORD` |
| `recovery` | Typed: `hitdices->[selector]->recovery`<br>Raw: `sheet->integrants->integrants->[record-key]->recovery` | `STORED` | On a Hit Dice record, this field stores how the value recovers. | `FIND` + `RECORD` |
| `name` | Typed: `hitdices->[selector]->name`<br>Raw: `sheet->integrants->integrants->[record-key]->name` | `STORED` | On a Hit Dice record, this field stores the record's primary display name. | `FIND` + `IDENTITY` |
| `shortID` | Typed: `hitdices->[selector]->shortID`<br>Raw: `sheet->integrants->integrants->[record-key]->shortID` | `STORED` | On a Hit Dice record, this field stores the compact ID used by Beacon sheet action calls. | `FIND` + `IDENTITY` |
| `_enabled` | Typed: `hitdices->[selector]->_enabled`<br>Raw: `sheet->integrants->integrants->[record-key]->_enabled` | `STORED` | On a Hit Dice record, this field stores whether the canonical record participates in the live character model. | `FIND` + `TOGGLE` + `RECORD` |
| `parentID` | Typed: `hitdices->[selector]->parentID`<br>Raw: `sheet->integrants->integrants->[record-key]->parentID` | `STORED` | On a Hit Dice record, this field stores the relationship ID of the record's immediate parent. | `FIND` + `GRAPH` |

#### Hit Points records

**Purpose:** Hit Points records store record-level details behind maximum or temporary hit-point capacity.

**Calculation:** The direct alias `hp_max` is a finite input. The record fields preserve formula and component details.

**General use:** Use `hp` for current HP and `hp_max` for ordinary maximum-HP reads and writes. Use these records when inspecting or changing a specific HP component.

> **Value kinds**
>
> - `INPUT` — A stored input used by the sheet to calculate another value.
> - `STORED` — A value or field stored directly at this location; it may be primitive or a container.
>
> **Usage**
>
> - `FIND` — Use the typed collection to locate and read the intended canonical record.
> - `RECORD` — After locating the record, write an existing primitive field through the typed collection path.
> - `INPUT` — Change this stored input when you want the sheet to recalculate the final result.
> - `IDENTITY` — Treat this as record identity data and do not normally change it.
> - `TOGGLE` — Change this state only on the exact existing record or setting you intend to toggle.
> - `GRAPH` — Use this to traverse record relationships; write only with valid keys and a full understanding of the graph.

| Field | ScriptCards location | Value kind | Description | Use |
|---|---|---|---|---|
| `hitpointType` | Typed: `hitpoints->[selector]->hitpointType`<br>Raw: `sheet->integrants->integrants->[record-key]->hitpointType` | `STORED` | On a Hit Points record, this field stores `hitpointType`. | `FIND` + `RECORD` |
| `calculation` | Typed: `hitpoints->[selector]->calculation`<br>Raw: `sheet->integrants->integrants->[record-key]->calculation` | `INPUT` | On a Hit Points record, this field identifies the calculation method used by this record. | `FIND` + `INPUT` + `RECORD` |
| `isFixed` | Typed: `hitpoints->[selector]->isFixed`<br>Raw: `sheet->integrants->integrants->[record-key]->isFixed` | `STORED` | On a Hit Points record, this field stores whether the formula uses a fixed value. | `FIND` + `RECORD` |
| `isTemp` | Typed: `hitpoints->[selector]->isTemp`<br>Raw: `sheet->integrants->integrants->[record-key]->isTemp` | `STORED` | On a Hit Points record, this field stores whether a Hit Points record represents temporary hit points. | `FIND` + `RECORD` — Classifies this formula record as temporary-HP capacity; it is not the character’s current `hp_temp` value. |
| `valueFormula.flatValue` | Typed: `hitpoints->[selector]->valueFormula->flatValue`<br>Raw: `sheet->integrants->integrants->[record-key]->valueFormula->flatValue` | `INPUT` | On a Hit Points record, this field stores a finite value used as an input by a formula. | `FIND` + `INPUT` + `RECORD` |
| `valueFormula.ability.name` | Typed: `hitpoints->[selector]->valueFormula->ability->name`<br>Raw: `sheet->integrants->integrants->[record-key]->valueFormula->ability->name` | `STORED` | On a Hit Points record, this field stores the record's primary display name. | `FIND` + `IDENTITY` |
| `valueFormula.ability.add` | Typed: `hitpoints->[selector]->valueFormula->ability->add`<br>Raw: `sheet->integrants->integrants->[record-key]->valueFormula->ability->add` | `STORED` | On a Hit Points record, this field stores `add`. | `FIND` + `RECORD` |
| `name` | Typed: `hitpoints->[selector]->name`<br>Raw: `sheet->integrants->integrants->[record-key]->name` | `STORED` | On a Hit Points record, this field stores the record's primary display name. | `FIND` + `IDENTITY` |
| `shortID` | Typed: `hitpoints->[selector]->shortID`<br>Raw: `sheet->integrants->integrants->[record-key]->shortID` | `STORED` | On a Hit Points record, this field stores the compact ID used by Beacon sheet action calls. | `FIND` + `IDENTITY` |
| `_enabled` | Typed: `hitpoints->[selector]->_enabled`<br>Raw: `sheet->integrants->integrants->[record-key]->_enabled` | `STORED` | On a Hit Points record, this field stores whether the canonical record participates in the live character model. | `FIND` + `TOGGLE` + `RECORD` |
| `parentID` | Typed: `hitpoints->[selector]->parentID`<br>Raw: `sheet->integrants->integrants->[record-key]->parentID` | `STORED` | On a Hit Points record, this field stores the relationship ID of the record's immediate parent. | `FIND` + `GRAPH` |

#### Item records

**Purpose:** Item records store inventory data, equipment state, weapon data, armor data, and shop metadata.

**Calculation:** The item fields are stored. Totals such as carried weight and AC contribution are calculated.

**General use:** Use the typed collection to find items and the inventory order arrays to preserve sheet order. Edit the intended Item record rather than a synthetic repeating-item field.

> **Value kinds**
>
> - `INPUT` — A stored input used by the sheet to calculate another value.
> - `ORDER` — Stored ordering or index data containing positions or record identities.
> - `STORED` — A value or field stored directly at this location; it may be primitive or a container.
>
> **Usage**
>
> - `FIND` — Use the typed collection to locate and read the intended canonical record.
> - `RECORD` — After locating the record, write an existing primitive field through the typed collection path.
> - `TOGGLE` — Change this state only on the exact existing record or setting you intend to toggle.
> - `IDENTITY` — Treat this as record identity data and do not normally change it.
> - `INPUT` — Change this stored input when you want the sheet to recalculate the final result.
> - `ORDER` — Preserve valid existing record identities and change this only when intentionally reordering them.
> - `GRAPH` — Use this to traverse record relationships; write only with valid keys and a full understanding of the graph.

| Field | ScriptCards location | Value kind | Description | Use |
|---|---|---|---|---|
| `description` | Typed: `items->[selector]->description`<br>Raw: `sheet->integrants->integrants->[record-key]->description` | `STORED` | On an Item record, this field stores the human-readable description. | `FIND` + `RECORD` |
| `quantity` | Typed: `items->[selector]->quantity`<br>Raw: `sheet->integrants->integrants->[record-key]->quantity` | `STORED` | On an Item record, this field stores the item quantity. | `FIND` + `RECORD` |
| `weight` | Typed: `items->[selector]->weight`<br>Raw: `sheet->integrants->integrants->[record-key]->weight` | `STORED` | On an Item record, this field stores the item weight. | `FIND` + `RECORD` |
| `cost` | Typed: `items->[selector]->cost`<br>Raw: `sheet->integrants->integrants->[record-key]->cost` | `STORED` | On an Item record, this field stores `cost`. | `FIND` + `RECORD` |
| `rarity` | Typed: `items->[selector]->rarity`<br>Raw: `sheet->integrants->integrants->[record-key]->rarity` | `STORED` | On an Item record, this field stores `rarity`. | `FIND` + `RECORD` |
| `properties` | Typed: `items->[selector]->properties`<br>Raw: `sheet->integrants->integrants->[record-key]->properties` | `STORED` | On an Item record, this field stores `properties`. | `FIND` + `RECORD` |
| `equipData.equippable` | Typed: `items->[selector]->equipData->equippable`<br>Raw: `sheet->integrants->integrants->[record-key]->equipData->equippable` | `STORED` | On an Item record, this field stores whether the item can be equipped. | `FIND` + `RECORD` |
| `equipData.equipped` | Typed: `items->[selector]->equipData->equipped`<br>Raw: `sheet->integrants->integrants->[record-key]->equipData->equipped` | `STORED` | On an Item record, this field stores whether the item is currently equipped. | `FIND` + `TOGGLE` + `RECORD` — Changes equipped state and can affect derived AC or attacks; `equippable` only says whether equipping is allowed. |
| `weaponData.category` | Typed: `items->[selector]->weaponData->category`<br>Raw: `sheet->integrants->integrants->[record-key]->weaponData->category` | `STORED` | On an Item record, this field stores the weapon category used by the item. | `FIND` + `RECORD` |
| `weaponData.training` | Typed: `items->[selector]->weaponData->training`<br>Raw: `sheet->integrants->integrants->[record-key]->weaponData->training` | `STORED` | On an Item record, this field stores `training`. | `FIND` + `RECORD` |
| `weaponData.type` | Typed: `items->[selector]->weaponData->type`<br>Raw: `sheet->integrants->integrants->[record-key]->weaponData->type` | `STORED` | On an Item record, this field identifies the canonical record type. | `FIND` + `IDENTITY` |
| `armorData.category` | Typed: `items->[selector]->armorData->category`<br>Raw: `sheet->integrants->integrants->[record-key]->armorData->category` | `STORED` | On an Item record, this field stores the armour category used by the item. | `FIND` + `RECORD` |
| `armorData.ability` | Typed: `items->[selector]->armorData->ability`<br>Raw: `sheet->integrants->integrants->[record-key]->armorData->ability` | `INPUT` | On an Item record, this field identifies the ability used by this record or formula. | `FIND` + `INPUT` + `RECORD` |
| `armorData.bonusCap` | Typed: `items->[selector]->armorData->bonusCap`<br>Raw: `sheet->integrants->integrants->[record-key]->armorData->bonusCap` | `STORED` | On an Item record, this field stores the maximum ability contribution allowed by the armor formula. | `FIND` + `RECORD` |
| `armorData.strengthMinimum` | Typed: `items->[selector]->armorData->strengthMinimum`<br>Raw: `sheet->integrants->integrants->[record-key]->armorData->strengthMinimum` | `STORED` | On an Item record, this field stores the armor's Strength requirement. | `FIND` + `RECORD` |
| `shieldData.category` | Typed: `items->[selector]->shieldData->category`<br>Raw: `sheet->integrants->integrants->[record-key]->shieldData->category` | `STORED` | On an Item record, this field stores the shield category used by the item. | `FIND` + `RECORD` |
| `shieldData.wieldable` | Typed: `items->[selector]->shieldData->wieldable`<br>Raw: `sheet->integrants->integrants->[record-key]->shieldData->wieldable` | `STORED` | On an Item record, this field stores `wieldable`. | `FIND` + `RECORD` |
| `name` | Typed: `items->[selector]->name`<br>Raw: `sheet->integrants->integrants->[record-key]->name` | `STORED` | On an Item record, this field stores the record's primary display name. | `FIND` + `IDENTITY` |
| `shortID` | Typed: `items->[selector]->shortID`<br>Raw: `sheet->integrants->integrants->[record-key]->shortID` | `STORED` | On an Item record, this field stores the compact ID used by Beacon sheet action calls. | `FIND` + `IDENTITY` |
| `_enabled` | Typed: `items->[selector]->_enabled`<br>Raw: `sheet->integrants->integrants->[record-key]->_enabled` | `STORED` | On an Item record, this field stores whether the canonical record participates in the live character model. | `FIND` + `TOGGLE` + `RECORD` |
| `arrayPosition` | Typed: `items->[selector]->arrayPosition`<br>Raw: `sheet->integrants->integrants->[record-key]->arrayPosition` | `ORDER` | On an Item record, this field stores the record's relative display position among records of the same family. | `FIND` + `ORDER` |
| `parentID` | Typed: `items->[selector]->parentID`<br>Raw: `sheet->integrants->integrants->[record-key]->parentID` | `STORED` | On an Item record, this field stores the relationship ID of the record's immediate parent. | `FIND` + `GRAPH` |
| `childIDs` | Typed: `items->[selector]->childIDs`<br>Raw: `sheet->integrants->integrants->[record-key]->childIDs` | `STORED` | On an Item record, this field stores the relationship IDs of this record's immediate child records. | `FIND` + `GRAPH` — Follow these linked record IDs to linked Attack, Attunement, or other child records; do not replace the whole array. |

#### Language records

**Purpose:** Language records store each language known by the character.

**Calculation:** No. Each language is a stored record.

**General use:** Use `languages` to list languages. The complete displayed phrase is stored in `name`; entries such as `Draconic But Can't Speak` or `Understands Common` are each one Language name, not a language plus separate qualifier fields. Use the typed record path only when enabling, disabling, or renaming a specific existing Language record.

> **Value kinds**
>
> - `ORDER` — Stored ordering or index data containing positions or record identities.
> - `STORED` — A value or field stored directly at this location; it may be primitive or a container.
>
> **Usage**
>
> - `FIND` — Use the typed collection to locate and read the intended canonical record.
> - `IDENTITY` — Treat this as record identity data and do not normally change it.
> - `TOGGLE` — Change this state only on the exact existing record or setting you intend to toggle.
> - `RECORD` — After locating the record, write an existing primitive field through the typed collection path.
> - `ORDER` — Preserve valid existing record identities and change this only when intentionally reordering them.
> - `GRAPH` — Use this to traverse record relationships; write only with valid keys and a full understanding of the graph.

| Field | ScriptCards location | Value kind | Description | Use |
|---|---|---|---|---|
| `name` | Typed: `languages->[selector]->name`<br>Raw: `sheet->integrants->integrants->[record-key]->name` | `STORED` | On a Language record, this field stores the record's primary display name. | `FIND` + `IDENTITY` |
| `_enabled` | Typed: `languages->[selector]->_enabled`<br>Raw: `sheet->integrants->integrants->[record-key]->_enabled` | `STORED` | On a Language record, this field stores whether the canonical record participates in the live character model. | `FIND` + `TOGGLE` + `RECORD` |
| `shortID` | Typed: `languages->[selector]->shortID`<br>Raw: `sheet->integrants->integrants->[record-key]->shortID` | `STORED` | On a Language record, this field stores the compact ID used by Beacon sheet action calls. | `FIND` + `IDENTITY` |
| `arrayPosition` | Typed: `languages->[selector]->arrayPosition`<br>Raw: `sheet->integrants->integrants->[record-key]->arrayPosition` | `ORDER` | On a Language record, this field stores the record's relative display position among records of the same family. | `FIND` + `ORDER` |
| `parentID` | Typed: `languages->[selector]->parentID`<br>Raw: `sheet->integrants->integrants->[record-key]->parentID` | `STORED` | On a Language record, this field stores the relationship ID of the record's immediate parent. | `FIND` + `GRAPH` |

#### Modifier records

**Purpose:** `modifier` records store modifications and relationships applied to other records or calculations.

**Calculation:** The modifier definition is stored. The final affected value is calculated.

**General use:** Use these records to understand why a final value changed. Edit them only when deliberately changing the modifier itself.

> **Value kinds**
>
> - `STORED` — A value or field stored directly at this location; it may be primitive or a container.
>
> **Usage**
>
> - `FIND` — Use the typed collection to locate and read the intended canonical record.
> - `RECORD` — After locating the record, write an existing primitive field through the typed collection path.
> - `GRAPH` — Use this to traverse record relationships; write only with valid keys and a full understanding of the graph.
> - `IDENTITY` — Treat this as record identity data and do not normally change it.
> - `TOGGLE` — Change this state only on the exact existing record or setting you intend to toggle.

| Field | ScriptCards location | Value kind | Description | Use |
|---|---|---|---|---|
| `concat` | Typed: `modifiers->[selector]->concat`<br>Raw: `sheet->integrants->integrants->[record-key]->concat` | `STORED` | On a `modifier` record, this field stores how modifier text or values are concatenated. | `FIND` + `RECORD` |
| `modifications` | Typed: `modifiers->[selector]->modifications`<br>Raw: `sheet->integrants->integrants->[record-key]->modifications` | `STORED` | On a `modifier` record, this field stores the modifications applied by the record. | `FIND` + `RECORD` — Structured modifier data; inspect it and address an existing primitive child rather than replacing the container blindly. |
| `relations` | Typed: `modifiers->[selector]->relations`<br>Raw: `sheet->integrants->integrants->[record-key]->relations` | `STORED` | On a `modifier` record, this field stores relationships that connect this record to other records. | `FIND` + `GRAPH` — Structured relationship data; preserve valid linked record IDs and edit only an understood primitive child. |
| `name` | Typed: `modifiers->[selector]->name`<br>Raw: `sheet->integrants->integrants->[record-key]->name` | `STORED` | On a `modifier` record, this field stores the record's primary display name. | `FIND` + `IDENTITY` |
| `shortID` | Typed: `modifiers->[selector]->shortID`<br>Raw: `sheet->integrants->integrants->[record-key]->shortID` | `STORED` | On a `modifier` record, this field stores the compact ID used by Beacon sheet action calls. | `FIND` + `IDENTITY` |
| `_enabled` | Typed: `modifiers->[selector]->_enabled`<br>Raw: `sheet->integrants->integrants->[record-key]->_enabled` | `STORED` | On a `modifier` record, this field stores whether the canonical record participates in the live character model. | `FIND` + `TOGGLE` + `RECORD` |
| `parentID` | Typed: `modifiers->[selector]->parentID`<br>Raw: `sheet->integrants->integrants->[record-key]->parentID` | `STORED` | On a `modifier` record, this field stores the relationship ID of the record's immediate parent. | `FIND` + `GRAPH` |

#### Prepared Spell Slot records

**Purpose:** Prepared Spell Slot records store formula inputs used to calculate prepared-spell capacity.

**Calculation:** The record fields are stored inputs. Prepared capacity is calculated.

**General use:** Use the translated prepared-spell value for the final capacity. Use this record when changing the underlying capacity formula.

> **Value kinds**
>
> - `INPUT` — A stored input used by the sheet to calculate another value.
> - `STORED` — A value or field stored directly at this location; it may be primitive or a container.
>
> **Usage**
>
> - `FIND` — Use the typed collection to locate and read the intended canonical record.
> - `INPUT` — Change this stored input when you want the sheet to recalculate the final result.
> - `RECORD` — After locating the record, write an existing primitive field through the typed collection path.
> - `IDENTITY` — Treat this as record identity data and do not normally change it.
> - `TOGGLE` — Change this state only on the exact existing record or setting you intend to toggle.
> - `GRAPH` — Use this to traverse record relationships; write only with valid keys and a full understanding of the graph.

| Field | ScriptCards location | Value kind | Description | Use |
|---|---|---|---|---|
| `calculation` | Typed: `preparedspellslots->[selector]->calculation`<br>Raw: `sheet->integrants->integrants->[record-key]->calculation` | `INPUT` | On a Prepared Spell Slot record, this field identifies the calculation method used by this record. | `FIND` + `INPUT` + `RECORD` |
| `valueFormula.flatValue` | Typed: `preparedspellslots->[selector]->valueFormula->flatValue`<br>Raw: `sheet->integrants->integrants->[record-key]->valueFormula->flatValue` | `INPUT` | On a Prepared Spell Slot record, this field stores a finite value used as an input by a formula. | `FIND` + `INPUT` + `RECORD` |
| `name` | Typed: `preparedspellslots->[selector]->name`<br>Raw: `sheet->integrants->integrants->[record-key]->name` | `STORED` | On a Prepared Spell Slot record, this field stores the record's primary display name. | `FIND` + `IDENTITY` |
| `shortID` | Typed: `preparedspellslots->[selector]->shortID`<br>Raw: `sheet->integrants->integrants->[record-key]->shortID` | `STORED` | On a Prepared Spell Slot record, this field stores the compact ID used by Beacon sheet action calls. | `FIND` + `IDENTITY` |
| `_enabled` | Typed: `preparedspellslots->[selector]->_enabled`<br>Raw: `sheet->integrants->integrants->[record-key]->_enabled` | `STORED` | On a Prepared Spell Slot record, this field stores whether the canonical record participates in the live character model. | `FIND` + `TOGGLE` + `RECORD` |
| `parentID` | Typed: `preparedspellslots->[selector]->parentID`<br>Raw: `sheet->integrants->integrants->[record-key]->parentID` | `STORED` | On a Prepared Spell Slot record, this field stores the relationship ID of the record's immediate parent. | `FIND` + `GRAPH` |

#### Proficiency records

**Purpose:** Proficiency records store skill, saving-throw, tool, weapon, and armor proficiency choices and tiers.

**Calculation:** The proficiency choice and tier are stored. Final bonuses are calculated.

**General use:** Use translated skill/save totals for final modifiers. Use Proficiency records when you need to determine or change whether the character is Proficient or has Expertise.

> **Value kinds**
>
> - `INPUT` — A stored input used by the sheet to calculate another value.
> - `STORED` — A value or field stored directly at this location; it may be primitive or a container.
>
> **Usage**
>
> - `FIND` — Use the typed collection to locate and read the intended canonical record.
> - `RECORD` — After locating the record, write an existing primitive field through the typed collection path.
> - `INPUT` — Change this stored input when you want the sheet to recalculate the final result.
> - `IDENTITY` — Treat this as record identity data and do not normally change it.
> - `TOGGLE` — Change this state only on the exact existing record or setting you intend to toggle.
> - `GRAPH` — Use this to traverse record relationships; write only with valid keys and a full understanding of the graph.

| Field | ScriptCards location | Value kind | Description | Use |
|---|---|---|---|---|
| `category` | Typed: `proficiencies->[selector]->category`<br>Raw: `sheet->integrants->integrants->[record-key]->category` | `STORED` | On a Proficiency record, this field identifies the record's category, such as Skill or Saving Throw. | `FIND` + `RECORD` |
| `proficiency` | Typed: `proficiencies->[selector]->proficiency`<br>Raw: `sheet->integrants->integrants->[record-key]->proficiency` | `STORED` | On a Proficiency record, this field identifies the skill, save, tool, weapon, or armor proficiency. | `FIND` + `RECORD` |
| `proficiencyLevel` | Typed: `proficiencies->[selector]->proficiencyLevel`<br>Raw: `sheet->integrants->integrants->[record-key]->proficiencyLevel` | `INPUT` | On a Proficiency record, this field stores the proficiency tier, such as Proficient or Expertise. | `FIND` + `INPUT` + `RECORD` — Change this tier to alter Proficient or Expertise state, then read the recalculated public skill or save total. |
| `rollAbility` | Typed: `proficiencies->[selector]->rollAbility`<br>Raw: `sheet->integrants->integrants->[record-key]->rollAbility` | `STORED` | On a Proficiency record, this field stores the ability used when rolling the proficiency. | `FIND` + `RECORD` |
| `increaseIfAlreadyAt` | Typed: `proficiencies->[selector]->increaseIfAlreadyAt`<br>Raw: `sheet->integrants->integrants->[record-key]->increaseIfAlreadyAt` | `STORED` | On a Proficiency record, this field stores `increaseIfAlreadyAt`. | `FIND` + `RECORD` |
| `name` | Typed: `proficiencies->[selector]->name`<br>Raw: `sheet->integrants->integrants->[record-key]->name` | `STORED` | On a Proficiency record, this field stores the record's primary display name. | `FIND` + `IDENTITY` |
| `shortID` | Typed: `proficiencies->[selector]->shortID`<br>Raw: `sheet->integrants->integrants->[record-key]->shortID` | `STORED` | On a Proficiency record, this field stores the compact ID used by Beacon sheet action calls. | `FIND` + `IDENTITY` |
| `_enabled` | Typed: `proficiencies->[selector]->_enabled`<br>Raw: `sheet->integrants->integrants->[record-key]->_enabled` | `STORED` | On a Proficiency record, this field stores whether the canonical record participates in the live character model. | `FIND` + `TOGGLE` + `RECORD` |
| `parentID` | Typed: `proficiencies->[selector]->parentID`<br>Raw: `sheet->integrants->integrants->[record-key]->parentID` | `STORED` | On a Proficiency record, this field stores the relationship ID of the record's immediate parent. | `FIND` + `GRAPH` |

#### Resource records

**Purpose:** Resource records store current resource values, maximum formulas, and recovery rules.

**Calculation:** The current value is stored. The maximum can be calculated from `maxValueFormula`.

**General use:** Use the typed collection to find resources by name. Change `value` for current uses and the formula fields only when changing capacity or recovery behavior.

> **Value kinds**
>
> - `INPUT` — A stored input used by the sheet to calculate another value.
> - `STORED` — A value or field stored directly at this location; it may be primitive or a container.
>
> **Usage**
>
> - `FIND` — Use the typed collection to locate and read the intended canonical record.
> - `RECORD` — After locating the record, write an existing primitive field through the typed collection path.
> - `INPUT` — Change this stored input when you want the sheet to recalculate the final result.
> - `GRAPH` — Use this to traverse record relationships; write only with valid keys and a full understanding of the graph.
> - `IDENTITY` — Treat this as record identity data and do not normally change it.
> - `TOGGLE` — Change this state only on the exact existing record or setting you intend to toggle.

| Field | ScriptCards location | Value kind | Description | Use |
|---|---|---|---|---|
| `value` | Typed: `resources->[selector]->value`<br>Raw: `sheet->integrants->integrants->[record-key]->value` | `STORED` | On a Resource record, this field stores the record's finite current value. | `FIND` + `RECORD` — This is the current amount; use `maxValueFormula` only when changing capacity. |
| `maxValueFormula` | Typed: `resources->[selector]->maxValueFormula`<br>Raw: `sheet->integrants->integrants->[record-key]->maxValueFormula` | `INPUT` | On a Resource record, this field stores the formula used to calculate a Resource maximum. | `FIND` + `INPUT` + `RECORD` — Structured maximum formula; edit an existing primitive component rather than replacing the whole object blindly. |
| `recoveryRate` | Typed: `resources->[selector]->recoveryRate`<br>Raw: `sheet->integrants->integrants->[record-key]->recoveryRate` | `STORED` | On a Resource record, this field stores how much of the Resource recovers. | `FIND` + `RECORD` |
| `relations` | Typed: `resources->[selector]->relations`<br>Raw: `sheet->integrants->integrants->[record-key]->relations` | `STORED` | On a Resource record, this field stores relationships that connect this record to other records. | `FIND` + `GRAPH` |
| `name` | Typed: `resources->[selector]->name`<br>Raw: `sheet->integrants->integrants->[record-key]->name` | `STORED` | On a Resource record, this field stores the record's primary display name. | `FIND` + `IDENTITY` |
| `shortID` | Typed: `resources->[selector]->shortID`<br>Raw: `sheet->integrants->integrants->[record-key]->shortID` | `STORED` | On a Resource record, this field stores the compact ID used by Beacon sheet action calls. | `FIND` + `IDENTITY` |
| `_enabled` | Typed: `resources->[selector]->_enabled`<br>Raw: `sheet->integrants->integrants->[record-key]->_enabled` | `STORED` | On a Resource record, this field stores whether the canonical record participates in the live character model. | `FIND` + `TOGGLE` + `RECORD` |
| `parentID` | Typed: `resources->[selector]->parentID`<br>Raw: `sheet->integrants->integrants->[record-key]->parentID` | `STORED` | On a Resource record, this field stores the relationship ID of the record's immediate parent. | `FIND` + `GRAPH` |

#### Rest Display records

**Purpose:** Rest Display records store descriptions and rest categories shown by the rest interface.

**Calculation:** No. These are stored display definitions.

**General use:** Read these records when reproducing the sheet's rest summary. Do not normally write them.

> **Value kinds**
>
> - `STORED` — A value or field stored directly at this location; it may be primitive or a container.
>
> **Usage**
>
> - `FIND` — Use the typed collection to locate and read the intended canonical record.
> - `RECORD` — After locating the record, write an existing primitive field through the typed collection path.
> - `IDENTITY` — Treat this as record identity data and do not normally change it.
> - `TOGGLE` — Change this state only on the exact existing record or setting you intend to toggle.

| Field | ScriptCards location | Value kind | Description | Use |
|---|---|---|---|---|
| `description` | Typed: `restdisplays->[selector]->description`<br>Raw: `sheet->integrants->integrants->[record-key]->description` | `STORED` | On a Rest Display record, this field stores the human-readable description. | `FIND` + `RECORD` |
| `restType` | Typed: `restdisplays->[selector]->restType`<br>Raw: `sheet->integrants->integrants->[record-key]->restType` | `STORED` | On a Rest Display record, this field stores `restType`. | `FIND` + `RECORD` |
| `name` | Typed: `restdisplays->[selector]->name`<br>Raw: `sheet->integrants->integrants->[record-key]->name` | `STORED` | On a Rest Display record, this field stores the record's primary display name. | `FIND` + `IDENTITY` |
| `shortID` | Typed: `restdisplays->[selector]->shortID`<br>Raw: `sheet->integrants->integrants->[record-key]->shortID` | `STORED` | On a Rest Display record, this field stores the compact ID used by Beacon sheet action calls. | `FIND` + `IDENTITY` |
| `_enabled` | Typed: `restdisplays->[selector]->_enabled`<br>Raw: `sheet->integrants->integrants->[record-key]->_enabled` | `STORED` | On a Rest Display record, this field stores whether the canonical record participates in the live character model. | `FIND` + `TOGGLE` + `RECORD` |

#### Roll Bonus records

**Purpose:** Roll Bonus records store global or conditional bonuses applied to attacks, damage, saves, skills, or other rolls.

**Calculation:** The bonus definition is stored. The final roll total is calculated.

**General use:** Use these records to identify active global or targeted modifiers. Change the bonus fields only when intentionally editing that modifier. For numeric aliases, `Keep Highest` and `Keep Lowest` affect dice selection and are ignored as numeric additions. For `spell_attack_bonus` and `spell_save_dc`, an applicable flat numeric Roll Bonus uses `bonusDetails = Modifier`, a finite `bonusValue`, and `totalRoll = false`. Complete Condition, Effect, Attunement, and equipment ancestry must be active. Any other applicable shape preserves the native sheet lookup.

> **Value kinds**
>
> - `INPUT` — A stored input used by the sheet to calculate another value.
> - `STORED` — A value or field stored directly at this location; it may be primitive or a container.
>
> **Usage**
>
> - `FIND` — Use the typed collection to locate and read the intended canonical record.
> - `RECORD` — After locating the record, write an existing primitive field through the typed collection path.
> - `INPUT` — Change this stored input when you want the sheet to recalculate the final result.
> - `IDENTITY` — Treat this as record identity data and do not normally change it.
> - `TOGGLE` — Change this state only on the exact existing record or setting you intend to toggle.
> - `GRAPH` — Use this to traverse record relationships; write only with valid keys and a full understanding of the graph.

| Field | ScriptCards location | Value kind | Description | Use |
|---|---|---|---|---|
| `bonusCategory` | Typed: `rollbonuses->[selector]->bonusCategory`<br>Raw: `sheet->integrants->integrants->[record-key]->bonusCategory` | `STORED` | On a Roll Bonus record, this field stores `bonusCategory`. | `FIND` + `RECORD` |
| `bonusDetails` | Typed: `rollbonuses->[selector]->bonusDetails`<br>Raw: `sheet->integrants->integrants->[record-key]->bonusDetails` | `STORED` | On a Roll Bonus record, this field stores `bonusDetails`. | `FIND` + `RECORD` |
| `bonusName` | Typed: `rollbonuses->[selector]->bonusName`<br>Raw: `sheet->integrants->integrants->[record-key]->bonusName` | `STORED` | On a Roll Bonus record, this field stores `bonusName`. | `FIND` + `RECORD` |
| `bonusValue` | Typed: `rollbonuses->[selector]->bonusValue`<br>Raw: `sheet->integrants->integrants->[record-key]->bonusValue` | `STORED` | On a Roll Bonus record, this field stores `bonusValue`. | `FIND` + `RECORD` |
| `diceCount` | Typed: `rollbonuses->[selector]->diceCount`<br>Raw: `sheet->integrants->integrants->[record-key]->diceCount` | `INPUT` | On a Roll Bonus record, this field stores the number of dice. | `FIND` + `INPUT` + `RECORD` |
| `totalRoll` | Typed: `rollbonuses->[selector]->totalRoll`<br>Raw: `sheet->integrants->integrants->[record-key]->totalRoll` | `STORED` | On a Roll Bonus record, this field stores the record's `totalRoll` flag. | `FIND` + `RECORD` |
| `name` | Typed: `rollbonuses->[selector]->name`<br>Raw: `sheet->integrants->integrants->[record-key]->name` | `STORED` | On a Roll Bonus record, this field stores the record's primary display name. | `FIND` + `IDENTITY` |
| `shortID` | Typed: `rollbonuses->[selector]->shortID`<br>Raw: `sheet->integrants->integrants->[record-key]->shortID` | `STORED` | On a Roll Bonus record, this field stores the compact ID used by Beacon sheet action calls. | `FIND` + `IDENTITY` |
| `_enabled` | Typed: `rollbonuses->[selector]->_enabled`<br>Raw: `sheet->integrants->integrants->[record-key]->_enabled` | `STORED` | On a Roll Bonus record, this field stores whether the canonical record participates in the live character model. | `FIND` + `TOGGLE` + `RECORD` |
| `parentID` | Typed: `rollbonuses->[selector]->parentID`<br>Raw: `sheet->integrants->integrants->[record-key]->parentID` | `STORED` | On a Roll Bonus record, this field stores the relationship ID of the record's immediate parent. | `FIND` + `GRAPH` |

#### Sense records

**Purpose:** Sense records store each sense and its range formula.

**Calculation:** The sense definition and range input are stored; displayed text is derived.

**General use:** Use `senses` to build a senses list. When `ignoreValue` is false, `npc_senses` formats the record as `Name N ft.`; when true, it formats only `Name`. Change the intended Sense record's finite range or enabled state rather than an aggregated `npc_senses` string.

> **Value kinds**
>
> - `INPUT` — A stored input used by the sheet to calculate another value.
> - `ORDER` — Stored ordering or index data containing positions or record identities.
> - `STORED` — A value or field stored directly at this location; it may be primitive or a container.
>
> **Usage**
>
> - `FIND` — Use the typed collection to locate and read the intended canonical record.
> - `INPUT` — Change this stored input when you want the sheet to recalculate the final result.
> - `RECORD` — After locating the record, write an existing primitive field through the typed collection path.
> - `IDENTITY` — Treat this as record identity data and do not normally change it.
> - `TOGGLE` — Change this state only on the exact existing record or setting you intend to toggle.
> - `ORDER` — Preserve valid existing record identities and change this only when intentionally reordering them.
> - `GRAPH` — Use this to traverse record relationships; write only with valid keys and a full understanding of the graph.

| Field | ScriptCards location | Value kind | Description | Use |
|---|---|---|---|---|
| `calculation` | Typed: `senses->[selector]->calculation`<br>Raw: `sheet->integrants->integrants->[record-key]->calculation` | `INPUT` | On a Sense record, this field identifies the calculation method used by this record. | `FIND` + `INPUT` + `RECORD` |
| `ignoreValue` | Typed: `senses->[selector]->ignoreValue`<br>Raw: `sheet->integrants->integrants->[record-key]->ignoreValue` | `STORED` | On a Sense record, this field stores whether a Sense ignores its numeric range. | `FIND` + `RECORD` — When true, the Sense should not be treated as having a meaningful numeric range. |
| `valueFormula.flatValue` | Typed: `senses->[selector]->valueFormula->flatValue`<br>Raw: `sheet->integrants->integrants->[record-key]->valueFormula->flatValue` | `INPUT` | On a Sense record, this field stores a finite value used as an input by a formula. | `FIND` + `INPUT` + `RECORD` — Stores the numeric Sense range when `ignoreValue` does not suppress it. |
| `name` | Typed: `senses->[selector]->name`<br>Raw: `sheet->integrants->integrants->[record-key]->name` | `STORED` | On a Sense record, this field stores the record's primary display name. | `FIND` + `IDENTITY` |
| `shortID` | Typed: `senses->[selector]->shortID`<br>Raw: `sheet->integrants->integrants->[record-key]->shortID` | `STORED` | On a Sense record, this field stores the compact ID used by Beacon sheet action calls. | `FIND` + `IDENTITY` |
| `_enabled` | Typed: `senses->[selector]->_enabled`<br>Raw: `sheet->integrants->integrants->[record-key]->_enabled` | `STORED` | On a Sense record, this field stores whether the canonical record participates in the live character model. | `FIND` + `TOGGLE` + `RECORD` |
| `arrayPosition` | Typed: `senses->[selector]->arrayPosition`<br>Raw: `sheet->integrants->integrants->[record-key]->arrayPosition` | `ORDER` | On a Sense record, this field stores the record's relative display position among records of the same family. | `FIND` + `ORDER` |
| `parentID` | Typed: `senses->[selector]->parentID`<br>Raw: `sheet->integrants->integrants->[record-key]->parentID` | `STORED` | On a Sense record, this field stores the relationship ID of the record's immediate parent. | `FIND` + `GRAPH` |

#### Size records

**Purpose:** Size records store the character's canonical creature-size value.

**Calculation:** No. The size value is stored.

**General use:** Prefer the verified direct alias `size` for ordinary changes. Use the record when inspecting the canonical Size model.

> **Value kinds**
>
> - `STORED` — A value or field stored directly at this location; it may be primitive or a container.
>
> **Usage**
>
> - `FIND` — Use the typed collection to locate and read the intended canonical record.
> - `RECORD` — After locating the record, write an existing primitive field through the typed collection path.
> - `IDENTITY` — Treat this as record identity data and do not normally change it.
> - `TOGGLE` — Change this state only on the exact existing record or setting you intend to toggle.
> - `GRAPH` — Use this to traverse record relationships; write only with valid keys and a full understanding of the graph.

| Field | ScriptCards location | Value kind | Description | Use |
|---|---|---|---|---|
| `sizeValue` | Typed: `sizes->[selector]->sizeValue`<br>Raw: `sheet->integrants->integrants->[record-key]->sizeValue` | `STORED` | On a Size record, this field stores the canonical creature-size value. | `FIND` + `RECORD` |
| `name` | Typed: `sizes->[selector]->name`<br>Raw: `sheet->integrants->integrants->[record-key]->name` | `STORED` | On a Size record, this field stores the record's primary display name. | `FIND` + `IDENTITY` |
| `shortID` | Typed: `sizes->[selector]->shortID`<br>Raw: `sheet->integrants->integrants->[record-key]->shortID` | `STORED` | On a Size record, this field stores the compact ID used by Beacon sheet action calls. | `FIND` + `IDENTITY` |
| `_enabled` | Typed: `sizes->[selector]->_enabled`<br>Raw: `sheet->integrants->integrants->[record-key]->_enabled` | `STORED` | On a Size record, this field stores whether the canonical record participates in the live character model. | `FIND` + `TOGGLE` + `RECORD` |
| `parentID` | Typed: `sizes->[selector]->parentID`<br>Raw: `sheet->integrants->integrants->[record-key]->parentID` | `STORED` | On a Size record, this field stores the relationship ID of the record's immediate parent. | `FIND` + `GRAPH` |

#### Skill records

**Purpose:** Skill records define each skill's governing ability and passive-display behavior.

**Calculation:** The definition is stored. Final skill bonuses are calculated from ability, proficiency, and modifiers.

**General use:** Use translated skill totals for final modifiers. Use Skill records to inspect definitions; use Proficiency records to change proficiency tier.

> **Value kinds**
>
> - `INPUT` — A stored input used by the sheet to calculate another value.
> - `STORED` — A value or field stored directly at this location; it may be primitive or a container.
>
> **Usage**
>
> - `FIND` — Use the typed collection to locate and read the intended canonical record.
> - `INPUT` — Change this stored input when you want the sheet to recalculate the final result.
> - `RECORD` — After locating the record, write an existing primitive field through the typed collection path.
> - `IDENTITY` — Treat this as record identity data and do not normally change it.
> - `TOGGLE` — Change this state only on the exact existing record or setting you intend to toggle.

| Field | ScriptCards location | Value kind | Description | Use |
|---|---|---|---|---|
| `ability` | Typed: `skills->[selector]->ability`<br>Raw: `sheet->integrants->integrants->[record-key]->ability` | `INPUT` | On a Skill record, this field identifies the ability used by this record or formula. | `FIND` + `INPUT` + `RECORD` |
| `custom` | Typed: `skills->[selector]->custom`<br>Raw: `sheet->integrants->integrants->[record-key]->custom` | `STORED` | On a Skill record, this field stores `custom`. | `FIND` + `RECORD` |
| `showAsPassive` | Typed: `skills->[selector]->showAsPassive`<br>Raw: `sheet->integrants->integrants->[record-key]->showAsPassive` | `STORED` | On a Skill record, this field stores whether the Skill can be displayed or calculated as a passive score. | `FIND` + `RECORD` — Controls whether this Skill participates in passive-score display or calculation; it is not the passive total itself. |
| `name` | Typed: `skills->[selector]->name`<br>Raw: `sheet->integrants->integrants->[record-key]->name` | `STORED` | On a Skill record, this field stores the record's primary display name. | `FIND` + `IDENTITY` |
| `shortID` | Typed: `skills->[selector]->shortID`<br>Raw: `sheet->integrants->integrants->[record-key]->shortID` | `STORED` | On a Skill record, this field stores the compact ID used by Beacon sheet action calls. | `FIND` + `IDENTITY` |
| `_enabled` | Typed: `skills->[selector]->_enabled`<br>Raw: `sheet->integrants->integrants->[record-key]->_enabled` | `STORED` | On a Skill record, this field stores whether the canonical record participates in the live character model. | `FIND` + `TOGGLE` + `RECORD` |

#### Species records

**Purpose:** Species records store the canonical species identity, description, and child relationships.

**Calculation:** No. These are stored species definitions and relationships.

**General use:** Use translated species/race text for simple display. Use Species records when you need canonical relationships or source data.

> **Value kinds**
>
> - `STORED` — A value or field stored directly at this location; it may be primitive or a container.
>
> **Usage**
>
> - `FIND` — Use the typed collection to locate and read the intended canonical record.
> - `RECORD` — After locating the record, write an existing primitive field through the typed collection path.
> - `GRAPH` — Use this to traverse record relationships; write only with valid keys and a full understanding of the graph.
> - `IDENTITY` — Treat this as record identity data and do not normally change it.
> - `TOGGLE` — Change this state only on the exact existing record or setting you intend to toggle.

| Field | ScriptCards location | Value kind | Description | Use |
|---|---|---|---|---|
| `description` | Typed: `species->[selector]->description`<br>Raw: `sheet->integrants->integrants->[record-key]->description` | `STORED` | On a Species record, this field stores the human-readable description. | `FIND` + `RECORD` |
| `preventSubspecies` | Typed: `species->[selector]->preventSubspecies`<br>Raw: `sheet->integrants->integrants->[record-key]->preventSubspecies` | `STORED` | On a Species record, this field stores `preventSubspecies`. | `FIND` + `RECORD` |
| `childIDs` | Typed: `species->[selector]->childIDs`<br>Raw: `sheet->integrants->integrants->[record-key]->childIDs` | `STORED` | On a Species record, this field stores the relationship IDs of this record's immediate child records. | `FIND` + `GRAPH` |
| `name` | Typed: `species->[selector]->name`<br>Raw: `sheet->integrants->integrants->[record-key]->name` | `STORED` | On a Species record, this field stores the record's primary display name. | `FIND` + `IDENTITY` |
| `shortID` | Typed: `species->[selector]->shortID`<br>Raw: `sheet->integrants->integrants->[record-key]->shortID` | `STORED` | On a Species record, this field stores the compact ID used by Beacon sheet action calls. | `FIND` + `IDENTITY` |
| `_enabled` | Typed: `species->[selector]->_enabled`<br>Raw: `sheet->integrants->integrants->[record-key]->_enabled` | `STORED` | On a Species record, this field stores whether the canonical record participates in the live character model. | `FIND` + `TOGGLE` + `RECORD` |
| `parentID` | Typed: `species->[selector]->parentID`<br>Raw: `sheet->integrants->integrants->[record-key]->parentID` | `STORED` | On a Species record, this field stores the relationship ID of the record's immediate parent. | `FIND` + `GRAPH` |

#### Speed records

**Purpose:** Speed records store movement modes and the finite inputs used to calculate each speed.

**Calculation:** The direct aliases `speed` and `npc_speed` are finite Speed inputs. Speed records preserve movement-mode and formula details.

**General use:** Use the direct Speed aliases marked writable for ordinary changes. Use Speed records when you need another movement mode or deliberate record-level control.

> **Value kinds**
>
> - `INPUT` — A stored input used by the sheet to calculate another value.
> - `ORDER` — Stored ordering or index data containing positions or record identities.
> - `STORED` — A value or field stored directly at this location; it may be primitive or a container.
>
> **Usage**
>
> - `FIND` — Use the typed collection to locate and read the intended canonical record.
> - `RECORD` — After locating the record, write an existing primitive field through the typed collection path.
> - `INPUT` — Change this stored input when you want the sheet to recalculate the final result.
> - `IDENTITY` — Treat this as record identity data and do not normally change it.
> - `TOGGLE` — Change this state only on the exact existing record or setting you intend to toggle.
> - `ORDER` — Preserve valid existing record identities and change this only when intentionally reordering them.
> - `GRAPH` — Use this to traverse record relationships; write only with valid keys and a full understanding of the graph.

| Field | ScriptCards location | Value kind | Description | Use |
|---|---|---|---|---|
| `speed` | Typed: `speeds->[selector]->speed`<br>Raw: `sheet->integrants->integrants->[record-key]->speed` | `STORED` | On a Speed record, this field identifies the movement mode, such as Walk, Fly, Climb, Swim, or Burrow. | `FIND` + `RECORD` — Identifies the movement mode; the direct alias `speed` represents Speed only. |
| `calculation` | Typed: `speeds->[selector]->calculation`<br>Raw: `sheet->integrants->integrants->[record-key]->calculation` | `INPUT` | On a Speed record, this field identifies the calculation method used by this record. | `FIND` + `INPUT` + `RECORD` |
| `valueFormula.flatValue` | Typed: `speeds->[selector]->valueFormula->flatValue`<br>Raw: `sheet->integrants->integrants->[record-key]->valueFormula->flatValue` | `INPUT` | On a Speed record, this field stores a finite value used as an input by a formula. | `FIND` + `INPUT` + `RECORD` — Changes the selected movement mode’s base value, after which the sheet recalculates the final speed. |
| `name` | Typed: `speeds->[selector]->name`<br>Raw: `sheet->integrants->integrants->[record-key]->name` | `STORED` | On a Speed record, this field stores the record's primary display name. | `FIND` + `IDENTITY` |
| `shortID` | Typed: `speeds->[selector]->shortID`<br>Raw: `sheet->integrants->integrants->[record-key]->shortID` | `STORED` | On a Speed record, this field stores the compact ID used by Beacon sheet action calls. | `FIND` + `IDENTITY` |
| `_enabled` | Typed: `speeds->[selector]->_enabled`<br>Raw: `sheet->integrants->integrants->[record-key]->_enabled` | `STORED` | On a Speed record, this field stores whether the canonical record participates in the live character model. | `FIND` + `TOGGLE` + `RECORD` |
| `arrayPosition` | Typed: `speeds->[selector]->arrayPosition`<br>Raw: `sheet->integrants->integrants->[record-key]->arrayPosition` | `ORDER` | On a Speed record, this field stores the record's relative display position among records of the same family. | `FIND` + `ORDER` |
| `parentID` | Typed: `speeds->[selector]->parentID`<br>Raw: `sheet->integrants->integrants->[record-key]->parentID` | `STORED` | On a Speed record, this field stores the relationship ID of the record's immediate parent. | `FIND` + `GRAPH` |

#### Spell records

**Purpose:** Spell records store spell identity, preparation, level, school, casting details, components, and description.

**Calculation:** The spell definition is stored. Attack, save DC, damage, and upcasting results can be calculated from linked records.

**General use:** Use `spells` to find and read spells and Beacon sheet action calls to cast them. Edit the existing Spell record rather than synthetic repeating-spell fields.

> **Value kinds**
>
> - `ORDER` — Stored ordering or index data containing positions or record identities.
> - `STORED` — A value or field stored directly at this location; it may be primitive or a container.
>
> **Usage**
>
> - `FIND` — Use the typed collection to locate and read the intended canonical record.
> - `TOGGLE` — Change this state only on the exact existing record or setting you intend to toggle.
> - `RECORD` — After locating the record, write an existing primitive field through the typed collection path.
> - `IDENTITY` — Treat this as record identity data and do not normally change it.
> - `ORDER` — Preserve valid existing record identities and change this only when intentionally reordering them.
> - `GRAPH` — Use this to traverse record relationships; write only with valid keys and a full understanding of the graph.

| Field | ScriptCards location | Value kind | Description | Use |
|---|---|---|---|---|
| `_prepared` | Typed: `spells->[selector]->_prepared`<br>Raw: `sheet->integrants->integrants->[record-key]->_prepared` | `STORED` | On a Spell record, this field stores whether the spell is currently prepared. | `FIND` + `TOGGLE` + `RECORD` — This is the character’s current prepared state for the spell. |
| `alwaysPrepared` | Typed: `spells->[selector]->alwaysPrepared`<br>Raw: `sheet->integrants->integrants->[record-key]->alwaysPrepared` | `STORED` | On a Spell record, this field stores `alwaysPrepared`. | `FIND` + `RECORD` — Marks a spell as inherently always prepared; do not use it as a temporary prepared toggle. |
| `level` | Typed: `spells->[selector]->level`<br>Raw: `sheet->integrants->integrants->[record-key]->level` | `STORED` | On a Spell record, this field stores a class, spell, slot, or upcasting level. | `FIND` + `RECORD` |
| `school` | Typed: `spells->[selector]->school`<br>Raw: `sheet->integrants->integrants->[record-key]->school` | `STORED` | On a Spell record, this field stores the spell school. | `FIND` + `RECORD` |
| `castingTime` | Typed: `spells->[selector]->castingTime`<br>Raw: `sheet->integrants->integrants->[record-key]->castingTime` | `STORED` | On a Spell record, this field stores `castingTime`. | `FIND` + `RECORD` |
| `range` | Typed: `spells->[selector]->range`<br>Raw: `sheet->integrants->integrants->[record-key]->range` | `STORED` | On a Spell record, this field stores the attack or spell range. | `FIND` + `RECORD` |
| `duration` | Typed: `spells->[selector]->duration`<br>Raw: `sheet->integrants->integrants->[record-key]->duration` | `STORED` | On a Spell record, this field stores the duration of the spell or effect. | `FIND` + `RECORD` |
| `concentration` | Typed: `spells->[selector]->concentration`<br>Raw: `sheet->integrants->integrants->[record-key]->concentration` | `STORED` | On a Spell record, this field stores whether the spell requires Concentration. | `FIND` + `RECORD` |
| `ritual` | Typed: `spells->[selector]->ritual`<br>Raw: `sheet->integrants->integrants->[record-key]->ritual` | `STORED` | On a Spell record, this field stores whether the spell can be cast as a Ritual. | `FIND` + `RECORD` |
| `components.verbal` | Typed: `spells->[selector]->components->verbal`<br>Raw: `sheet->integrants->integrants->[record-key]->components->verbal` | `STORED` | On a Spell record, this field stores `verbal`. | `FIND` + `RECORD` |
| `components.somatic` | Typed: `spells->[selector]->components->somatic`<br>Raw: `sheet->integrants->integrants->[record-key]->components->somatic` | `STORED` | On a Spell record, this field stores `somatic`. | `FIND` + `RECORD` |
| `components.material` | Typed: `spells->[selector]->components->material`<br>Raw: `sheet->integrants->integrants->[record-key]->components->material` | `STORED` | On a Spell record, this field stores `material`. | `FIND` + `RECORD` |
| `components.materialDescription` | Typed: `spells->[selector]->components->materialDescription`<br>Raw: `sheet->integrants->integrants->[record-key]->components->materialDescription` | `STORED` | On a Spell record, this field stores `materialDescription`. | `FIND` + `RECORD` |
| `cantripScale` | Typed: `spells->[selector]->cantripScale`<br>Raw: `sheet->integrants->integrants->[record-key]->cantripScale` | `STORED` | On a Spell record, this field stores the spell's cantrip-scaling behavior. | `FIND` + `RECORD` |
| `upcastText` | Typed: `spells->[selector]->upcastText`<br>Raw: `sheet->integrants->integrants->[record-key]->upcastText` | `STORED` | On a Spell record, this field stores `upcastText`. | `FIND` + `RECORD` |
| `description` | Typed: `spells->[selector]->description`<br>Raw: `sheet->integrants->integrants->[record-key]->description` | `STORED` | On a Spell record, this field stores the human-readable description. | `FIND` + `RECORD` |
| `name` | Typed: `spells->[selector]->name`<br>Raw: `sheet->integrants->integrants->[record-key]->name` | `STORED` | On a Spell record, this field stores the record's primary display name. | `FIND` + `IDENTITY` |
| `shortID` | Typed: `spells->[selector]->shortID`<br>Raw: `sheet->integrants->integrants->[record-key]->shortID` | `STORED` | On a Spell record, this field stores the compact ID used by Beacon sheet action calls. | `FIND` + `IDENTITY` — Use this for the Beacon spell action call; typed writes use the selected collection path. |
| `_enabled` | Typed: `spells->[selector]->_enabled`<br>Raw: `sheet->integrants->integrants->[record-key]->_enabled` | `STORED` | On a Spell record, this field stores whether the canonical record participates in the live character model. | `FIND` + `TOGGLE` + `RECORD` |
| `arrayPosition` | Typed: `spells->[selector]->arrayPosition`<br>Raw: `sheet->integrants->integrants->[record-key]->arrayPosition` | `ORDER` | On a Spell record, this field stores the record's relative display position among records of the same family. | `FIND` + `ORDER` |
| `parentID` | Typed: `spells->[selector]->parentID`<br>Raw: `sheet->integrants->integrants->[record-key]->parentID` | `STORED` | On a Spell record, this field stores the relationship ID of the record's immediate parent. | `FIND` + `GRAPH` |
| `childIDs` | Typed: `spells->[selector]->childIDs`<br>Raw: `sheet->integrants->integrants->[record-key]->childIDs` | `STORED` | On a Spell record, this field stores the relationship IDs of this record's immediate child records. | `FIND` + `GRAPH` |

#### Spell Slot records

**Purpose:** Spell Slot records store normal or Pact slot entitlement and capacity formula inputs. Progressive features can retain older records and mark them as replaced through `overwrittenBy`.

**Calculation:** The direct aliases `lvl1_slots_total` through `lvl9_slots_total` are finite **normal-slot** capacity inputs. For D&D 2024 Beacon reads, ScriptCards reconstructs these aliases locally from active non-Pact Spell Slot records when their calculation shapes are verified; otherwise it preserves the native sheet-item lookup. Pact capacity is record-driven and Pact current state is stored separately under `sheet->spellSlots->currentPactByLevel`.

**General use:** Use the direct spell-slot aliases for ordinary normal-slot reads and writes. For `lvl1_slots_expended` through `lvl9_slots_expended`, ScriptCards internally reads and writes the matching `currentByLevel` remaining-slot leaf so the alias has one consistent meaning in both directions. Use `currentPactByLevel` for current Pact state. Use the typed collection for entitlement details; ScriptCards removes superseded records from the active collection when their enabled `overwrittenBy` replacement is present.

> **Progression rule**
>
> Do not sum every enabled Spell Slot record that shares a parent. An earlier level-1 Pact record can store `1` and point through `overwrittenBy` to a later record storing `2`. The correct Pact capacity is `2`, not `3`.

> **Value kinds**
>
> - `INPUT` — A stored input used by the sheet to calculate another value.
> - `STORED` — A value or field stored directly at this location; it may be primitive or a container.
>
> **Usage**
>
> - `FIND` — Use the typed collection to locate and read the intended canonical record.
> - `RECORD` — After locating the record, write an existing primitive field through the typed collection path.
> - `INPUT` — Change this stored input when you want the sheet to recalculate the final result.
> - `IDENTITY` — Treat this as record identity data and do not normally change it.
> - `TOGGLE` — Change this state only on the exact existing record or setting you intend to toggle.
> - `GRAPH` — Use this to traverse record relationships; write only with valid keys and a full understanding of the graph.

| Field | ScriptCards location | Value kind | Description | Use |
|---|---|---|---|---|
| `_slotType` | Typed: `spellslots->[selector]->_slotType`<br>Raw: `sheet->integrants->integrants->[record-key]->_slotType` | `STORED` | On a Spell Slot record, this field identifies the spell-slot category, such as normal or Pact. | `FIND` + `RECORD` — Distinguishes normal and Pact entitlement records; do not infer the slot type from `spellLevel` alone. |
| `spellLevel` | Typed: `spellslots->[selector]->spellLevel`<br>Raw: `sheet->integrants->integrants->[record-key]->spellLevel` | `STORED` | On a Spell Slot record, this field stores the spell-slot level. | `FIND` + `RECORD` |
| `calculation` | Typed: `spellslots->[selector]->calculation`<br>Raw: `sheet->integrants->integrants->[record-key]->calculation` | `INPUT` | On a Spell Slot record, this field identifies the calculation method used by this record. | `FIND` + `INPUT` + `RECORD` |
| `valueFormula.flatValue` | Typed: `spellslots->[selector]->valueFormula->flatValue`<br>Raw: `sheet->integrants->integrants->[record-key]->valueFormula->flatValue` | `INPUT` | On a Spell Slot record, this field stores a finite value used as an input by a formula. | `FIND` + `INPUT` + `RECORD` |
| `name` | Typed: `spellslots->[selector]->name`<br>Raw: `sheet->integrants->integrants->[record-key]->name` | `STORED` | On a Spell Slot record, this field stores the record's primary display name. | `FIND` + `IDENTITY` |
| `shortID` | Typed: `spellslots->[selector]->shortID`<br>Raw: `sheet->integrants->integrants->[record-key]->shortID` | `STORED` | On a Spell Slot record, this field stores the compact ID used by Beacon sheet action calls. | `FIND` + `IDENTITY` |
| `_enabled` | Typed: `spellslots->[selector]->_enabled`<br>Raw: `sheet->integrants->integrants->[record-key]->_enabled` | `STORED` | On a Spell Slot record, this field stores whether the canonical record participates in the live character model. | `FIND` + `TOGGLE` + `RECORD` |
| `overwrittenBy` | Typed: `spellslots->[selector]->overwrittenBy`<br>Raw: `sheet->integrants->integrants->[record-key]->overwrittenBy` | `STORED` | Stores the raw canonical key of the later record that supersedes this progression stage. | `FIND` + `GRAPH` — When the referenced replacement exists and is enabled, ScriptCards excludes this record from the active typed collection. |
| `cascades` | Typed: `spellslots->[selector]->cascades`<br>Raw: `sheet->integrants->integrants->[record-key]->cascades` | `STORED` | Stores progression/cascade metadata. An earlier progression record may identify its replacement as an `Overwrite`. | `FIND` + `GRAPH` — Treat as structural metadata; do not add the values of overwrite-linked records. |
| `parentID` | Typed: `spellslots->[selector]->parentID`<br>Raw: `sheet->integrants->integrants->[record-key]->parentID` | `STORED` | On a Spell Slot record, this field stores the relationship ID of the record's immediate parent. Multiple progression stages can share this parent. | `FIND` + `GRAPH` — Parent identity alone may match several raw records; active typed selection also applies the overwrite rule. |

#### Spellcasting records

**Purpose:** Spellcasting records store independent profiles such as class, Pact Magic, and species spellcasting. A character may have several enabled records at once, each with a separate `ability`.

**Calculation:** The D&D 2024 Beacon Spellcasting Ability selector writes the selected record's `ability`. The character-level `spellcasting_ability`, `spell_attack_bonus`, `spell_attack_mod`, `spell_save_dc`, and `spell_dc_mod` aliases are singular compatibility results rather than one result per profile. ScriptCards reconstructs all five locally only when the active Spellcasting records agree on one ability; `spellcasting_ability` formats that modifier with a trailing plus sign, such as `3+`. The attack and save values also require every applicable Roll Bonus to have a supported numeric shape. Otherwise ScriptCards preserves the native compatibility lookup instead of guessing.

**General use:** Locate the exact Spellcasting record by a unique selector, then read or write its `ability`. Do not assume that changing one profile will change the singular compatibility attack/DC aliases when several profiles exist.

```scard
[*S:spellcastings->[selector]->ability]
--!c:[&CharacterID]|spellcastings->[selector]->ability:Charisma
```

Use `shortID`, the canonical ID, or a numeric index when a displayed record name is not unique.

> **Value kinds**
>
> - `INPUT` — A stored input used by the sheet to calculate another value.
> - `STORED` — A value or field stored directly at this location; it may be primitive or a container.
> - `UNKNOWN` — The field was absent from the verified records and is not a verified write target.
>
> **Usage**
>
> - `FIND` — Use the typed collection to locate and read the intended canonical record.
> - `INPUT` — Change this stored input when you want the sheet to recalculate the final result.
> - `RECORD` — After locating the record, write an existing primitive field through the typed collection path.
> - `IDENTITY` — Treat this as record identity data and do not normally change it.
> - `TOGGLE` — Change this state only on the exact existing record or setting you intend to toggle.
> - `GRAPH` — Use this to traverse record relationships; write only with valid keys and a full understanding of the graph.
> - `UNVERIFIED` — Do not create or write this field merely because its name appears relevant.

| Field | ScriptCards location | Value kind | Description | Use |
|---|---|---|---|---|
| `ability` | Typed: `spellcastings->[selector]->ability`<br>Raw: `sheet->integrants->integrants->[record-key]->ability` | `INPUT` | Verified official write target. The D&D 2024 Beacon sheet's Spellcasting Ability selector changes this field on the selected Spellcasting record. Each class, pact, species, or other spellcasting source may have its own value. | `FIND` + `INPUT` + `RECORD` — Write this exact field to mimic the official sheet selector. |
| `spellcastingAbility` | Typed: `spellcastings->[selector]->spellcastingAbility`<br>Raw: `sheet->integrants->integrants->[record-key]->spellcastingAbility` | `UNKNOWN` | This field was absent from the mapped Spellcasting records, and the sheet selector did not write it. It is not the D&D 2024 Beacon casting-ability write target. | `FIND` + `UNVERIFIED` — Prefer `ability`; do not create or write this field merely because its name suggests it. |
| `casterType` | Typed: `spellcastings->[selector]->casterType`<br>Raw: `sheet->integrants->integrants->[record-key]->casterType` | `STORED` | On a Spellcasting record, this field identifies the spellcasting progression or caster category. | `FIND` + `RECORD` |
| `overviewDisplay` | Typed: `spellcastings->[selector]->overviewDisplay`<br>Raw: `sheet->integrants->integrants->[record-key]->overviewDisplay` | `STORED` | On a Spellcasting record, this field stores `overviewDisplay`. | `FIND` + `RECORD` |
| `name` | Typed: `spellcastings->[selector]->name`<br>Raw: `sheet->integrants->integrants->[record-key]->name` | `STORED` | On a Spellcasting record, this field stores the record's primary display name. | `FIND` + `IDENTITY` |
| `shortID` | Typed: `spellcastings->[selector]->shortID`<br>Raw: `sheet->integrants->integrants->[record-key]->shortID` | `STORED` | On a Spellcasting record, this field stores the compact ID used by Beacon sheet action calls. | `FIND` + `IDENTITY` |
| `_enabled` | Typed: `spellcastings->[selector]->_enabled`<br>Raw: `sheet->integrants->integrants->[record-key]->_enabled` | `STORED` | On a Spellcasting record, this field stores whether the canonical record participates in the live character model. | `FIND` + `TOGGLE` + `RECORD` |
| `parentID` | Typed: `spellcastings->[selector]->parentID`<br>Raw: `sheet->integrants->integrants->[record-key]->parentID` | `STORED` | On a Spellcasting record, this field stores the relationship ID of the record's immediate parent. | `FIND` + `GRAPH` |
| `childIDs` | Typed: `spellcastings->[selector]->childIDs`<br>Raw: `sheet->integrants->integrants->[record-key]->childIDs` | `STORED` | On a Spellcasting record, this field stores the relationship IDs of this record's immediate child records. | `FIND` + `GRAPH` |

#### Subclass records

**Purpose:** Subclass records store the canonical subclass identity and child relationships.

**Calculation:** No. These are stored identity and relationship fields.

**General use:** Use translated subclass text for simple display. To pair classes and subclasses on a multiclass character, resolve each Subclass record's `parentID` to the corresponding Class record key; do not assume independent class and subclass lists have matching positions.

> **Value kinds**
>
> - `STORED` — A value or field stored directly at this location; it may be primitive or a container.
>
> **Usage**
>
> - `FIND` — Use the typed collection to locate and read the intended canonical record.
> - `GRAPH` — Use this to traverse record relationships; write only with valid keys and a full understanding of the graph.
> - `IDENTITY` — Treat this as record identity data and do not normally change it.
> - `TOGGLE` — Change this state only on the exact existing record or setting you intend to toggle.
> - `RECORD` — After locating the record, write an existing primitive field through the typed collection path.

| Field | ScriptCards location | Value kind | Description | Use |
|---|---|---|---|---|
| `childIDs` | Typed: `subclasses->[selector]->childIDs`<br>Raw: `sheet->integrants->integrants->[record-key]->childIDs` | `STORED` | On a Subclass record, this field stores the relationship IDs of this record's immediate child records. | `FIND` + `GRAPH` |
| `name` | Typed: `subclasses->[selector]->name`<br>Raw: `sheet->integrants->integrants->[record-key]->name` | `STORED` | On a Subclass record, this field stores the record's primary display name. | `FIND` + `IDENTITY` |
| `shortID` | Typed: `subclasses->[selector]->shortID`<br>Raw: `sheet->integrants->integrants->[record-key]->shortID` | `STORED` | On a Subclass record, this field stores the compact ID used by Beacon sheet action calls. | `FIND` + `IDENTITY` |
| `_enabled` | Typed: `subclasses->[selector]->_enabled`<br>Raw: `sheet->integrants->integrants->[record-key]->_enabled` | `STORED` | On a Subclass record, this field stores whether the canonical record participates in the live character model. | `FIND` + `TOGGLE` + `RECORD` |
| `parentID` | Typed: `subclasses->[selector]->parentID`<br>Raw: `sheet->integrants->integrants->[record-key]->parentID` | `STORED` | On a Subclass record, this field stores the relationship ID of the record's immediate parent. | `FIND` + `GRAPH` |
| `sourceID` | Typed: `subclasses->[selector]->sourceID`<br>Raw: `sheet->integrants->integrants->[record-key]->sourceID` | `STORED` | On a Subclass record, this field stores the originating source record identifier. | `FIND` + `IDENTITY` |

#### Upcasting records

**Purpose:** Upcasting records store how an attack, damage instance, healing effect, or spell changes at higher levels.

**Calculation:** The scaling rule is stored. The higher-level result is calculated.

**General use:** Find this record through its parent Spell, Attack, or Damage relationship. Edit it only when intentionally changing the scaling rule.

> **Value kinds**
>
> - `STORED` — A value or field stored directly at this location; it may be primitive or a container.
>
> **Usage**
>
> - `FIND` — Use the typed collection to locate and read the intended canonical record.
> - `RECORD` — After locating the record, write an existing primitive field through the typed collection path.
> - `IDENTITY` — Treat this as record identity data and do not normally change it.
> - `TOGGLE` — Change this state only on the exact existing record or setting you intend to toggle.
> - `GRAPH` — Use this to traverse record relationships; write only with valid keys and a full understanding of the graph.

| Field | ScriptCards location | Value kind | Description | Use |
|---|---|---|---|---|
| `mode` | Typed: `upcastings->[selector]->mode`<br>Raw: `sheet->integrants->integrants->[record-key]->mode` | `STORED` | On an Upcasting record, this field stores the selected mode, such as a roll or upcasting mode. | `FIND` + `RECORD` |
| `startingLevel` | Typed: `upcastings->[selector]->startingLevel`<br>Raw: `sheet->integrants->integrants->[record-key]->startingLevel` | `STORED` | On an Upcasting record, this field stores the starting level for the upcasting rule. | `FIND` + `RECORD` |
| `level` | Typed: `upcastings->[selector]->level`<br>Raw: `sheet->integrants->integrants->[record-key]->level` | `STORED` | On an Upcasting record, this field stores a class, spell, slot, or upcasting level. | `FIND` + `RECORD` |
| `changeMode` | Typed: `upcastings->[selector]->changeMode`<br>Raw: `sheet->integrants->integrants->[record-key]->changeMode` | `STORED` | On an Upcasting record, this field stores how the target value changes at higher levels. | `FIND` + `RECORD` |
| `target` | Typed: `upcastings->[selector]->target`<br>Raw: `sheet->integrants->integrants->[record-key]->target` | `STORED` | On an Upcasting record, this field identifies the value or linked record affected by the scaling rule. | `FIND` + `RECORD` — Identifies the value or linked record being scaled; preserve the expected target identity when editing the rule. |
| `value` | Typed: `upcastings->[selector]->value`<br>Raw: `sheet->integrants->integrants->[record-key]->value` | `STORED` | On an Upcasting record, this field stores the record's finite current value. | `FIND` + `RECORD` |
| `name` | Typed: `upcastings->[selector]->name`<br>Raw: `sheet->integrants->integrants->[record-key]->name` | `STORED` | On an Upcasting record, this field stores the record's primary display name. | `FIND` + `IDENTITY` |
| `shortID` | Typed: `upcastings->[selector]->shortID`<br>Raw: `sheet->integrants->integrants->[record-key]->shortID` | `STORED` | On an Upcasting record, this field stores the compact ID used by Beacon sheet action calls. | `FIND` + `IDENTITY` |
| `_enabled` | Typed: `upcastings->[selector]->_enabled`<br>Raw: `sheet->integrants->integrants->[record-key]->_enabled` | `STORED` | On an Upcasting record, this field stores whether the canonical record participates in the live character model. | `FIND` + `TOGGLE` + `RECORD` |
| `parentID` | Typed: `upcastings->[selector]->parentID`<br>Raw: `sheet->integrants->integrants->[record-key]->parentID` | `STORED` | On an Upcasting record, this field stores the relationship ID of the record's immediate parent. | `FIND` + `GRAPH` |

#### Weapon Mastery Change records

**Purpose:** Weapon Mastery Change records mark the class feature that permits a character to change known Weapon Masteries.

**Calculation:** No. These records primarily store identity and ownership metadata.

**General use:** Read these records to determine whether the character has the feature that permits mastery changes. Do not normally edit their identity fields.

> **Value kinds**
>
> - `STORED` — A value or field stored directly at this location; it may be primitive or a container.
>
> **Usage**
>
> - `FIND` — Use the typed collection to locate and read the intended canonical record.
> - `GRAPH` — Use this to traverse record relationships; write only with valid keys and a full understanding of the graph.
> - `IDENTITY` — Treat this as record identity data and do not normally change it.
> - `TOGGLE` — Change this state only on the exact existing record or setting you intend to toggle.
> - `RECORD` — After locating the record, write an existing primitive field through the typed collection path.

| Field | ScriptCards location | Value kind | Description | Use |
|---|---|---|---|---|
| `parentID` | Typed: `weaponmasterychanges->[selector]->parentID`<br>Raw: `sheet->integrants->integrants->[record-key]->parentID` | `STORED` | Stores the linked record ID of the owning feature record. | `FIND` + `GRAPH` |
| `name` | Typed: `weaponmasterychanges->[selector]->name`<br>Raw: `sheet->integrants->integrants->[record-key]->name` | `STORED` | Stores the record's display name. | `FIND` + `IDENTITY` |
| `shortID` | Typed: `weaponmasterychanges->[selector]->shortID`<br>Raw: `sheet->integrants->integrants->[record-key]->shortID` | `STORED` | Stores the compact Beacon action identity. | `FIND` + `IDENTITY` |
| `_enabled` | Typed: `weaponmasterychanges->[selector]->_enabled`<br>Raw: `sheet->integrants->integrants->[record-key]->_enabled` | `STORED` | Stores whether the record participates in the live character model. | `FIND` + `TOGGLE` + `RECORD` |

#### Weapon Mastery Known records

**Purpose:** Weapon Mastery Known records store each weapon selected for mastery and link that selection to its Weapon Mastery effect record.

**Calculation:** No. The selection and relationships are stored.

**General use:** Read `known` to identify the selected weapon and `childIDs` to reach the applied mastery. Do not replace the `known` object or `childIDs` array as a whole; address an existing primitive child or array element.

> **Value kinds**
>
> - `STORED` — A value or field stored directly at this location; it may be primitive or a container.
>
> **Usage**
>
> - `FIND` — Use the typed collection to locate and read the intended canonical record.
> - `GRAPH` — Use this to traverse record relationships; write only with valid keys and a full understanding of the graph.
> - `IDENTITY` — Treat this as record identity data and do not normally change it.
> - `TOGGLE` — Change this state only on the exact existing record or setting you intend to toggle.
> - `RECORD` — After locating the record, write an existing primitive field through the typed collection path.

| Field | ScriptCards location | Value kind | Description | Use |
|---|---|---|---|---|
| `known` | Typed: `weaponmasteryknowns->[selector]->known`<br>Raw: `sheet->integrants->integrants->[record-key]->known` | `STORED` | Stores an object whose key identifies the weapon selected for mastery. | `FIND` + `RECORD` — Structured selected-weapon data; address an existing primitive child instead of replacing the whole object. |
| `childIDs` | Typed: `weaponmasteryknowns->[selector]->childIDs`<br>Raw: `sheet->integrants->integrants->[record-key]->childIDs` | `STORED` | Stores the linked record ID of the linked Weapon Mastery record. | `FIND` + `GRAPH` — Contains the linked Weapon Mastery record identity; edit an existing array element rather than replacing the whole array. |
| `name` | Typed: `weaponmasteryknowns->[selector]->name`<br>Raw: `sheet->integrants->integrants->[record-key]->name` | `STORED` | Stores the selected mastery record's display name. | `FIND` + `IDENTITY` |
| `shortID` | Typed: `weaponmasteryknowns->[selector]->shortID`<br>Raw: `sheet->integrants->integrants->[record-key]->shortID` | `STORED` | Stores the compact Beacon action identity. | `FIND` + `IDENTITY` |
| `_enabled` | Typed: `weaponmasteryknowns->[selector]->_enabled`<br>Raw: `sheet->integrants->integrants->[record-key]->_enabled` | `STORED` | Stores whether the selection participates in the live character model. | `FIND` + `TOGGLE` + `RECORD` |
| `parentID` | Typed: `weaponmasteryknowns->[selector]->parentID`<br>Raw: `sheet->integrants->integrants->[record-key]->parentID` | `STORED` | Stores the linked record ID of the owning Weapon Mastery feature. | `FIND` + `GRAPH` |

#### Weapon Mastery Slot records

**Purpose:** Weapon Mastery Slot records store the formula input that determines how many Weapon Mastery selections the character can know.

**Calculation:** The slot record is a stored input. The available mastery capacity is calculated from it.

**General use:** Read the slot record to inspect mastery capacity. Change `valueFormula->flatValue` only when intentionally changing the number of available mastery selections.

> **Value kinds**
>
> - `INPUT` — A stored input used by the sheet to calculate another value.
> - `STORED` — A value or field stored directly at this location; it may be primitive or a container.
>
> **Usage**
>
> - `FIND` — Use the typed collection to locate and read the intended canonical record.
> - `INPUT` — Change this stored input when you want the sheet to recalculate the final result.
> - `RECORD` — After locating the record, write an existing primitive field through the typed collection path.
> - `IDENTITY` — Treat this as record identity data and do not normally change it.
> - `TOGGLE` — Change this state only on the exact existing record or setting you intend to toggle.
> - `GRAPH` — Use this to traverse record relationships; write only with valid keys and a full understanding of the graph.

| Field | ScriptCards location | Value kind | Description | Use |
|---|---|---|---|---|
| `calculation` | Typed: `weaponmasteryslots->[selector]->calculation`<br>Raw: `sheet->integrants->integrants->[record-key]->calculation` | `INPUT` | Stores the calculation mode used for mastery capacity. | `FIND` + `INPUT` + `RECORD` |
| `valueFormula.flatValue` | Typed: `weaponmasteryslots->[selector]->valueFormula->flatValue`<br>Raw: `sheet->integrants->integrants->[record-key]->valueFormula->flatValue` | `INPUT` | Stores the finite mastery-slot capacity. | `FIND` + `INPUT` + `RECORD` |
| `name` | Typed: `weaponmasteryslots->[selector]->name`<br>Raw: `sheet->integrants->integrants->[record-key]->name` | `STORED` | Stores the record's display name. | `FIND` + `IDENTITY` |
| `shortID` | Typed: `weaponmasteryslots->[selector]->shortID`<br>Raw: `sheet->integrants->integrants->[record-key]->shortID` | `STORED` | Stores the compact Beacon action identity. | `FIND` + `IDENTITY` |
| `_enabled` | Typed: `weaponmasteryslots->[selector]->_enabled`<br>Raw: `sheet->integrants->integrants->[record-key]->_enabled` | `STORED` | Stores whether the capacity record participates in the live character model. | `FIND` + `TOGGLE` + `RECORD` |
| `parentID` | Typed: `weaponmasteryslots->[selector]->parentID`<br>Raw: `sheet->integrants->integrants->[record-key]->parentID` | `STORED` | Stores the linked record ID of the owning Weapon Mastery feature. | `FIND` + `GRAPH` |

#### Weapon Mastery records

**Purpose:** Weapon Mastery records store mastery identity, active state, applicability, default items, and description.

**Calculation:** No. These are stored mastery definitions and state.

**General use:** Use the typed collection to list masteries. Change `active` only on the intended existing mastery record.

> **Value kinds**
>
> - `STORED` — A value or field stored directly at this location; it may be primitive or a container.
>
> **Usage**
>
> - `FIND` — Use the typed collection to locate and read the intended canonical record.
> - `TOGGLE` — Change this state only on the exact existing record or setting you intend to toggle.
> - `RECORD` — After locating the record, write an existing primitive field through the typed collection path.
> - `IDENTITY` — Treat this as record identity data and do not normally change it.
> - `GRAPH` — Use this to traverse record relationships; write only with valid keys and a full understanding of the graph.

| Field | ScriptCards location | Value kind | Description | Use |
|---|---|---|---|---|
| `active` | Typed: `weaponmasteries->[selector]->active`<br>Raw: `sheet->integrants->integrants->[record-key]->active` | `STORED` | On a Weapon Mastery record, this field stores whether the mastery is currently active. | `FIND` + `TOGGLE` + `RECORD` — This is the mastery’s active state; `_enabled` only controls whether the record participates. |
| `applies` | Typed: `weaponmasteries->[selector]->applies`<br>Raw: `sheet->integrants->integrants->[record-key]->applies` | `STORED` | On a Weapon Mastery record, this field stores the item or weapon applicability rules. | `FIND` + `RECORD` — Structured applicability rules; inspect and edit an existing primitive child rather than replacing the container blindly. |
| `defaultItems` | Typed: `weaponmasteries->[selector]->defaultItems`<br>Raw: `sheet->integrants->integrants->[record-key]->defaultItems` | `STORED` | On a Weapon Mastery record, this field stores the default items associated with the mastery. | `FIND` + `RECORD` — Structured default-item data; inspect and edit an existing primitive child or array element rather than replacing the container blindly. |
| `description` | Typed: `weaponmasteries->[selector]->description`<br>Raw: `sheet->integrants->integrants->[record-key]->description` | `STORED` | On a Weapon Mastery record, this field stores the human-readable description. | `FIND` + `RECORD` |
| `name` | Typed: `weaponmasteries->[selector]->name`<br>Raw: `sheet->integrants->integrants->[record-key]->name` | `STORED` | On a Weapon Mastery record, this field stores the record's primary display name. | `FIND` + `IDENTITY` |
| `shortID` | Typed: `weaponmasteries->[selector]->shortID`<br>Raw: `sheet->integrants->integrants->[record-key]->shortID` | `STORED` | On a Weapon Mastery record, this field stores the compact ID used by Beacon sheet action calls. | `FIND` + `IDENTITY` |
| `_enabled` | Typed: `weaponmasteries->[selector]->_enabled`<br>Raw: `sheet->integrants->integrants->[record-key]->_enabled` | `STORED` | On a Weapon Mastery record, this field stores whether the canonical record participates in the live character model. | `FIND` + `TOGGLE` + `RECORD` |
| `parentID` | Typed: `weaponmasteries->[selector]->parentID`<br>Raw: `sheet->integrants->integrants->[record-key]->parentID` | `STORED` | On a Weapon Mastery record, this field stores the relationship ID of the record's immediate parent. | `FIND` + `GRAPH` |
| `childIDs` | Typed: `weaponmasteries->[selector]->childIDs`<br>Raw: `sheet->integrants->integrants->[record-key]->childIDs` | `STORED` | On a Weapon Mastery record, this field stores the relationship IDs of this record's immediate child records. | `FIND` + `GRAPH` |

### Calling Beacon sheet actions

Typed collection locations provide data; Beacon sheet actions execute the corresponding roll or output. The row identity used by these calls is the record's `shortID`, not a translated `$0` index or a typed collection position.

| Purpose | Beacon action call | Notes |
|---|---|---|
| Ability check, saving throw, skill check, or initiative | `no_relevant_action("DISPLAY LABEL")` | Confirmed labels include `Strength Check`, `Intelligence Saving Throw`, `Arcana Check`, and `Initiative`. |
| PC attack | `repeating_attack("ATTACK_SHORTID", "attack")` | Uses `Attack.shortID`. |
| Separate PC or NPC attack damage | `repeating_attack("ATTACK_SHORTID", "attack", "dmg")` | Uses the same Attack `shortID`. |
| PC non-attack cantrip output | `repeating_spell-cantrip("SPELL_SHORTID", "output")` | Confirmed for cantrips. Equivalent calls for every leveled non-attack spell row were not captured and should not be assumed. |
| PC or NPC bonus action | `repeating_npcbonusaction("ACTION_SHORTID", "action")` | Beacon uses the NPC-prefixed namespace for confirmed PC bonus actions as well. |
| PC reaction | `repeating_npcreaction("ACTION_SHORTID", "action")` | Confirmed for PC reactions. |
| NPC ordinary action | `repeating_npcaction("ACTION_SHORTID", "action")` | Also used by confirmed NPC spell actions. |
| NPC legendary action | `repeating_npcaction-l("ACTION_SHORTID", "action")` | Uses the Action `shortID`. |
| NPC mythic action | `repeating_npcaction-m("ACTION_SHORTID", "action")` | Uses the Action `shortID`. |

Use the relevant typed collection to read `shortID`, for example `attacks->[selector]->shortID` or `actions->[selector]->shortID`.


## Advanced and internal locations

These sections are complete implementation references rather than the normal starting point for a ScriptCards script. Use them for diagnostics, component-level canonical-record work, ordering, relationship traversal, or deliberate character-builder automation.

### Root locations

> **Value kinds**
>
> - `STORED` — A value or field stored directly at this location; it may be primitive or a container.
> - `TRANSIENT` — Builder or user-interface state that is not authoritative live character data.
> - `MIXED` — A root or container holding more than one kind of data.
>
> **Usage**
>
> - `READ` — Read this for display, branching, or diagnostics; do not normally write it.
> - `BUILDER` — Use this only for builder inspection or deliberate builder automation, not as finished-character data.

| ScriptCards location | Value | Description | Use |
|---|---|---|---|
| `appState` | string<br>`STORED` | Identifies whether the character is using the PC application (`sheet`) or NPC application (`npc`). | `READ` — Use this to distinguish a PC (`sheet`) from an NPC (`npc`); do not write it. |
| `builder` | object<br>`TRANSIENT` | Contains character-builder decisions, source payloads, and in-progress builder state. | `BUILDER` — Use this only while inspecting or automating the builder; use `sheet` for authoritative live character data. |
| `sheetVersion` | string<br>`STORED` | Stores the Beacon sheet schema version. | `READ` — Use this to version-gate a script against the Beacon schema; do not write it. |
| `sheet` | object<br>`MIXED` | Contains live character state, settings, display-order arrays, and the canonical record graph. | `READ` — Use this root to reach live-sheet reads and exact writes to existing primitive leaves. |
| `updateId` | string<br>`STORED` | Stores Roll20's internal sheet-update marker. | `READ` — Use this only to diagnose or detect a sheet update; do not write it. |


### Complete observed canonical-record leaf index

This appendix includes every primitive canonical-record path shape observed by the PC and NPC probes, including fields not repeated in the common record-type summaries.

#### Identity and source metadata

> **Value kinds**
>
> - `STORED` — A value or field stored directly at this location; it may be primitive or a container.
>
> **Usage**
>
> - `FIND` — Use the typed collection to locate and read the intended canonical record.
> - `IDENTITY` — Treat this as record identity metadata and do not normally change it.
> - `RECORD` — After locating the record, use its exact `[record-key]` raw path for a deliberate field edit.

| ScriptCards location | Value | Description | Use |
|---|---|---|---|
| `sheet->integrants->integrants->[record-key]->attack->type` | string<br>`STORED` | This location identifies the canonical record type on the canonical record identified by `[record-key]`. | `FIND` + `IDENTITY` |
| `sheet->integrants->integrants->[record-key]->builderDisplayName` | string<br>`STORED` | This location stores the label shown by the character builder on the canonical record identified by `[record-key]`. | `FIND` + `RECORD` |
| `sheet->integrants->integrants->[record-key]->builderIteration` | string<br>`STORED` | This location identifies the builder iteration that produced this record on the canonical record identified by `[record-key]`. | `FIND` + `RECORD` |
| `sheet->integrants->integrants->[record-key]->compendiumPageID` | string<br>`STORED` | This location stores the Roll20 Compendium page identifier on the canonical record identified by `[record-key]`. | `FIND` + `IDENTITY` |
| `sheet->integrants->integrants->[record-key]->concat->name` | string<br>`STORED` | This location stores the record's primary display name on the canonical record identified by `[record-key]`. | `FIND` + `RECORD` |
| `sheet->integrants->integrants->[record-key]->createdTime` | number<br>`STORED` | This location stores the record's creation timestamp on the canonical record identified by `[record-key]`. | `FIND` + `IDENTITY` |
| `sheet->integrants->integrants->[record-key]->label` | string<br>`STORED` | This location stores a secondary display identity for the record on the canonical record identified by `[record-key]`. | `FIND` + `RECORD` |
| `sheet->integrants->integrants->[record-key]->name` | string<br>`STORED` | This location stores the record's primary display name on the canonical record identified by `[record-key]`. | `FIND` + `RECORD` |
| `sheet->integrants->integrants->[record-key]->recordName` | string<br>`STORED` | This location stores the record's internal identity name on the canonical record identified by `[record-key]`. | `FIND` + `RECORD` |
| `sheet->integrants->integrants->[record-key]->recoveryRate->Long Rest->type` | string<br>`STORED` | This location identifies the canonical record type on the canonical record identified by `[record-key]`. | `FIND` + `IDENTITY` |
| `sheet->integrants->integrants->[record-key]->shortID` | string<br>`STORED` | This location stores the compact ID used by Beacon sheet action calls on the canonical record identified by `[record-key]`. | `FIND` + `IDENTITY` |
| `sheet->integrants->integrants->[record-key]->source` | string<br>`STORED` | This location stores the human-readable source label on the canonical record identified by `[record-key]`. | `FIND` + `RECORD` |
| `sheet->integrants->integrants->[record-key]->sourceID` | string<br>`STORED` | This location stores the originating source record identifier on the canonical record identified by `[record-key]`. | `FIND` + `IDENTITY` |
| `sheet->integrants->integrants->[record-key]->type` | string<br>`STORED` | This location identifies the canonical record type on the canonical record identified by `[record-key]`. | `FIND` + `IDENTITY` |
| `sheet->integrants->integrants->[record-key]->valueFormula->ability->name` | string<br>`STORED` | This location stores the record's primary display name on the canonical record identified by `[record-key]`. | `FIND` + `RECORD` |
| `sheet->integrants->integrants->[record-key]->weaponData->type` | string<br>`STORED` | This location identifies the canonical record type on the canonical record identified by `[record-key]`. | `FIND` + `IDENTITY` |

#### Relationships and ordering

> **Value kinds**
>
> - `ORDER` — Stored ordering or index data containing positions or canonical record keys.
> - `STORED` — A value or field stored directly at this location; it may be primitive or a container.
>
> **Usage**
>
> - `FIND` — Use the typed collection to locate and read the intended canonical record.
> - `ORDER` — Preserve valid existing record keys and change this only when intentionally reordering them.
> - `GRAPH` — Use this to traverse record relationships; write only with valid keys and a full understanding of the graph.

| ScriptCards location | Value | Description | Use |
|---|---|---|---|
| `sheet->integrants->integrants->[record-key]->arrayPosition` | number<br>`ORDER` | This location stores the record's relative display position among records of the same family on the canonical record identified by `[record-key]`. | `FIND` + `ORDER` |
| `sheet->integrants->integrants->[record-key]->childIDs` | array<br>`STORED` | This location stores the canonical keys of this record's immediate child records on the canonical record identified by `[record-key]`. | `FIND` + `GRAPH` |
| `sheet->integrants->integrants->[record-key]->parentID` | string<br>`STORED` | This location stores the canonical key of the record's immediate parent on the canonical record identified by `[record-key]`. | `FIND` + `GRAPH` |

#### Calculation inputs

> **Value kinds**
>
> - `INPUT` — A stored input used by the sheet to calculate another value.
>
> **Usage**
>
> - `FIND` — Use the typed collection to locate and read the intended canonical record.
> - `INPUT` — Change this stored input when you want the sheet to recalculate the final result.
> - `RECORD` — After locating the record, use its exact `[record-key]` raw path for a deliberate field edit.

| ScriptCards location | Value | Description | Use |
|---|---|---|---|
| `sheet->integrants->integrants->[record-key]->_bonus` | number<br>`INPUT` | This location stores the canonical record field named `_bonus` on the canonical record identified by `[record-key]`. | `FIND` + `INPUT` + `RECORD` |
| `sheet->integrants->integrants->[record-key]->_diceCount` | number<br>`INPUT` | This location stores the canonical record field named `_diceCount` on the canonical record identified by `[record-key]`. | `FIND` + `INPUT` + `RECORD` |
| `sheet->integrants->integrants->[record-key]->ability` | string<br>`INPUT` | This location identifies the ability used by this record or formula on the canonical record identified by `[record-key]`. | `FIND` + `INPUT` + `RECORD` |
| `sheet->integrants->integrants->[record-key]->attack->bonus` | number<br>`INPUT` | This location stores a finite bonus or bonus expression on the canonical record identified by `[record-key]`. | `FIND` + `INPUT` + `RECORD` |
| `sheet->integrants->integrants->[record-key]->attack->proficiencyLevel` | string<br>`INPUT` | This location stores the proficiency tier, such as Proficient or Expertise on the canonical record identified by `[record-key]`. | `FIND` + `INPUT` + `RECORD` |
| `sheet->integrants->integrants->[record-key]->calculation` | string<br>`INPUT` | This location identifies the calculation method used by this record on the canonical record identified by `[record-key]`. | `FIND` + `INPUT` + `RECORD` |
| `sheet->integrants->integrants->[record-key]->diceCount` | number<br>`INPUT` | This location stores the number of dice on the canonical record identified by `[record-key]`. | `FIND` + `INPUT` + `RECORD` |
| `sheet->integrants->integrants->[record-key]->diceSize` | string<br>`INPUT` | This location stores the die size on the canonical record identified by `[record-key]`. | `FIND` + `INPUT` + `RECORD` |
| `sheet->integrants->integrants->[record-key]->maxValueFormula->flatValue` | number<br>`INPUT` | This location stores a finite value used as an input by a formula on the canonical record identified by `[record-key]`. | `FIND` + `INPUT` + `RECORD` |
| `sheet->integrants->integrants->[record-key]->proficiencyLevel` | string<br>`INPUT` | This location stores the proficiency tier, such as Proficient or Expertise on the canonical record identified by `[record-key]`. | `FIND` + `INPUT` + `RECORD` |
| `sheet->integrants->integrants->[record-key]->save->saveFormula->ability->ability` | string<br>`INPUT` | This location identifies the ability used by this record or formula on the canonical record identified by `[record-key]`. | `FIND` + `INPUT` + `RECORD` |
| `sheet->integrants->integrants->[record-key]->save->saveFormula->flatValue` | number<br>`INPUT` | This location stores a finite value used as an input by a formula on the canonical record identified by `[record-key]`. | `FIND` + `INPUT` + `RECORD` |
| `sheet->integrants->integrants->[record-key]->totalLevel` | number<br>`INPUT` | This location stores the character's total level used by calculations such as proficiency bonus on the canonical record identified by `[record-key]`. | `FIND` + `INPUT` + `RECORD` |
| `sheet->integrants->integrants->[record-key]->valueFormula->flatValue` | number<br>`INPUT` | This location stores a finite value used as an input by a formula on the canonical record identified by `[record-key]`. | `FIND` + `INPUT` + `RECORD` |

#### State and toggles

> **Value kinds**
>
> - `STORED` — A value or field stored directly at this location; it may be primitive or a container.
>
> **Usage**
>
> - `FIND` — Use the typed collection to locate and read the intended canonical record.
> - `TOGGLE` — Change this state only on the exact existing record or setting you intend to toggle.
> - `RECORD` — After locating the record, use its exact `[record-key]` raw path for a deliberate field edit.

| ScriptCards location | Value | Description | Use |
|---|---|---|---|
| `sheet->integrants->integrants->[record-key]->_active` | boolean<br>`STORED` | This location stores whether this record or effect is currently active on the canonical record identified by `[record-key]`. | `FIND` + `TOGGLE` + `RECORD` |
| `sheet->integrants->integrants->[record-key]->_enabled` | boolean<br>`STORED` | This location stores whether the canonical record participates in the live character model on the canonical record identified by `[record-key]`. | `FIND` + `TOGGLE` + `RECORD` |
| `sheet->integrants->integrants->[record-key]->_prepared` | boolean<br>`STORED` | This location stores whether the spell is currently prepared on the canonical record identified by `[record-key]`. | `FIND` + `TOGGLE` + `RECORD` |
| `sheet->integrants->integrants->[record-key]->alwaysPrepared` | boolean<br>`STORED` | This location stores the canonical record field named `alwaysPrepared` on the canonical record identified by `[record-key]`. | `FIND` + `RECORD` |
| `sheet->integrants->integrants->[record-key]->autoHit` | boolean<br>`STORED` | This location stores whether the attack skips an attack roll and automatically applies its effect or damage on the canonical record identified by `[record-key]`. | `FIND` + `RECORD` |
| `sheet->integrants->integrants->[record-key]->concentration` | boolean<br>`STORED` | This location stores whether the spell requires Concentration on the canonical record identified by `[record-key]`. | `FIND` + `RECORD` |
| `sheet->integrants->integrants->[record-key]->equipData->equippable` | boolean<br>`STORED` | This location stores whether the item can be equipped on the canonical record identified by `[record-key]`. | `FIND` + `RECORD` |
| `sheet->integrants->integrants->[record-key]->equipData->equipped` | boolean<br>`STORED` | This location stores whether the item is currently equipped on the canonical record identified by `[record-key]`. | `FIND` + `TOGGLE` + `RECORD` |
| `sheet->integrants->integrants->[record-key]->isFixed` | boolean<br>`STORED` | This location stores whether the formula uses a fixed value on the canonical record identified by `[record-key]`. | `FIND` + `RECORD` |
| `sheet->integrants->integrants->[record-key]->isTemp` | boolean<br>`STORED` | This location stores whether a Hit Points record represents temporary hit points on the canonical record identified by `[record-key]`. | `FIND` + `RECORD` |
| `sheet->integrants->integrants->[record-key]->ritual` | boolean<br>`STORED` | This location stores whether the spell can be cast as a Ritual on the canonical record identified by `[record-key]`. | `FIND` + `RECORD` |

#### Record content

> **Value kinds**
>
> - `STORED` — A value or field stored directly at this location; it may be primitive or a container.
>
> **Usage**
>
> - `FIND` — Use the typed collection to locate and read the intended canonical record.
> - `RECORD` — After locating the record, use its exact `[record-key]` raw path for a deliberate field edit.

| ScriptCards location | Value | Description | Use |
|---|---|---|---|
| `sheet->integrants->integrants->[record-key]` | unknown<br>`STORED` | This location stores the canonical record field named `[record-key]` on the canonical record identified by `[record-key]`. | `FIND` + `RECORD` |
| `sheet->integrants->integrants->[record-key]->_reach` | boolean<br>`STORED` | This location stores the canonical record field named `_reach` on the canonical record identified by `[record-key]`. | `FIND` + `RECORD` |
| `sheet->integrants->integrants->[record-key]->_reachText` | string<br>`STORED` | This location stores the canonical record field named `_reachText` on the canonical record identified by `[record-key]`. | `FIND` + `RECORD` |
| `sheet->integrants->integrants->[record-key]->_slotType` | string<br>`STORED` | This location identifies the spell-slot category, such as normal or Pact on the canonical record identified by `[record-key]`. | `FIND` + `RECORD` |
| `sheet->integrants->integrants->[record-key]->actionType` | string<br>`STORED` | This location identifies whether the record is an Action, Bonus Action, Reaction, Free Action, or another action category on the canonical record identified by `[record-key]`. | `FIND` + `RECORD` |
| `sheet->integrants->integrants->[record-key]->aoe->shape` | string<br>`STORED` | This location stores the canonical record field named `shape` on the canonical record identified by `[record-key]`. | `FIND` + `RECORD` |
| `sheet->integrants->integrants->[record-key]->aoe->size` | string<br>`STORED` | This location stores the canonical record field named `size` on the canonical record identified by `[record-key]`. | `FIND` + `RECORD` |
| `sheet->integrants->integrants->[record-key]->attack->abilityBonus` | string<br>`STORED` | This location stores the ability contribution used by the attack on the canonical record identified by `[record-key]`. | `FIND` + `RECORD` |
| `sheet->integrants->integrants->[record-key]->bonusCategory->[index]` | string<br>`STORED` | This location stores the canonical record field named `[index]` on the canonical record identified by `[record-key]`. | `FIND` + `RECORD` |
| `sheet->integrants->integrants->[record-key]->bonusDetails` | string<br>`STORED` | This location stores the canonical record field named `bonusDetails` on the canonical record identified by `[record-key]`. | `FIND` + `RECORD` |
| `sheet->integrants->integrants->[record-key]->bonusName` | array<br>`STORED` | This location stores the canonical record field named `bonusName` on the canonical record identified by `[record-key]`. | `FIND` + `RECORD` |
| `sheet->integrants->integrants->[record-key]->bonusName->[index]` | string<br>`STORED` | This location stores the canonical record field named `[index]` on the canonical record identified by `[record-key]`. | `FIND` + `RECORD` |
| `sheet->integrants->integrants->[record-key]->bonusValue` | number<br>`STORED` | This location stores the canonical record field named `bonusValue` on the canonical record identified by `[record-key]`. | `FIND` + `RECORD` |
| `sheet->integrants->integrants->[record-key]->cantripScale` | string<br>`STORED` | This location stores the spell's cantrip-scaling behavior on the canonical record identified by `[record-key]`. | `FIND` + `RECORD` |
| `sheet->integrants->integrants->[record-key]->cascades->8i9RIG0aHUHG57O58mT7a->[index]` | string<br>`STORED` | This location stores the canonical record field named `[index]` on the canonical record identified by `[record-key]`. | `FIND` + `RECORD` |
| `sheet->integrants->integrants->[record-key]->cascades->CSiYSrStvfQnAEocYiC3G->[index]` | string<br>`STORED` | This location stores the canonical record field named `[index]` on the canonical record identified by `[record-key]`. | `FIND` + `RECORD` |
| `sheet->integrants->integrants->[record-key]->cascades->YEzDCStj638jvcyxvPcxW->[index]` | string<br>`STORED` | This location stores the canonical record field named `[index]` on the canonical record identified by `[record-key]`. | `FIND` + `RECORD` |
| `sheet->integrants->integrants->[record-key]->cascades->blinded->[index]` | string<br>`STORED` | This location stores the canonical record field named `[index]` on the canonical record identified by `[record-key]`. | `FIND` + `RECORD` |
| `sheet->integrants->integrants->[record-key]->cascades->cA9JVt0Yqj-jJ4QIkoP67->[index]` | string<br>`STORED` | This location stores the canonical record field named `[index]` on the canonical record identified by `[record-key]`. | `FIND` + `RECORD` |
| `sheet->integrants->integrants->[record-key]->cascades->frightened->[index]` | string<br>`STORED` | This location stores the canonical record field named `[index]` on the canonical record identified by `[record-key]`. | `FIND` + `RECORD` |
| `sheet->integrants->integrants->[record-key]->cascades->grappled->[index]` | string<br>`STORED` | This location stores the canonical record field named `[index]` on the canonical record identified by `[record-key]`. | `FIND` + `RECORD` |
| `sheet->integrants->integrants->[record-key]->cascades->invisible->[index]` | string<br>`STORED` | This location stores the canonical record field named `[index]` on the canonical record identified by `[record-key]`. | `FIND` + `RECORD` |
| `sheet->integrants->integrants->[record-key]->cascades->paralyzed->[index]` | string<br>`STORED` | This location stores the canonical record field named `[index]` on the canonical record identified by `[record-key]`. | `FIND` + `RECORD` |
| `sheet->integrants->integrants->[record-key]->cascades->petrified->[index]` | string<br>`STORED` | This location stores the canonical record field named `[index]` on the canonical record identified by `[record-key]`. | `FIND` + `RECORD` |
| `sheet->integrants->integrants->[record-key]->cascades->poisoned->[index]` | string<br>`STORED` | This location stores the canonical record field named `[index]` on the canonical record identified by `[record-key]`. | `FIND` + `RECORD` |
| `sheet->integrants->integrants->[record-key]->cascades->prone->[index]` | string<br>`STORED` | This location stores the canonical record field named `[index]` on the canonical record identified by `[record-key]`. | `FIND` + `RECORD` |
| `sheet->integrants->integrants->[record-key]->cascades->restrained->[index]` | string<br>`STORED` | This location stores the canonical record field named `[index]` on the canonical record identified by `[record-key]`. | `FIND` + `RECORD` |
| `sheet->integrants->integrants->[record-key]->cascades->stunned->[index]` | string<br>`STORED` | This location stores the canonical record field named `[index]` on the canonical record identified by `[record-key]`. | `FIND` + `RECORD` |
| `sheet->integrants->integrants->[record-key]->cascades->unconscious->[index]` | string<br>`STORED` | This location stores the canonical record field named `[index]` on the canonical record identified by `[record-key]`. | `FIND` + `RECORD` |
| `sheet->integrants->integrants->[record-key]->casterType` | string<br>`STORED` | This location identifies the spellcasting progression or caster category on the canonical record identified by `[record-key]`. | `FIND` + `RECORD` |
| `sheet->integrants->integrants->[record-key]->castingTime` | string<br>`STORED` | This location stores the canonical record field named `castingTime` on the canonical record identified by `[record-key]`. | `FIND` + `RECORD` |
| `sheet->integrants->integrants->[record-key]->category` | string<br>`STORED` | Stores the category defined by the selected record; its meaning depends on that record type. | `FIND` + `RECORD` |
| `sheet->integrants->integrants->[record-key]->changeMode` | string<br>`STORED` | This location stores the canonical record field named `changeMode` on the canonical record identified by `[record-key]`. | `FIND` + `RECORD` |
| `sheet->integrants->integrants->[record-key]->childIDs->[index]` | string<br>`STORED` | This location stores the canonical record field named `[index]` on the canonical record identified by `[record-key]`. | `FIND` + `RECORD` |
| `sheet->integrants->integrants->[record-key]->classID` | string<br>`STORED` | This location identifies the owning Class record on the canonical record identified by `[record-key]`. | `FIND` + `RECORD` |
| `sheet->integrants->integrants->[record-key]->components->material` | boolean<br>`STORED` | This location stores the canonical record field named `material` on the canonical record identified by `[record-key]`. | `FIND` + `RECORD` |
| `sheet->integrants->integrants->[record-key]->components->materialDescription` | string<br>`STORED` | This location stores the canonical record field named `materialDescription` on the canonical record identified by `[record-key]`. | `FIND` + `RECORD` |
| `sheet->integrants->integrants->[record-key]->components->somatic` | boolean<br>`STORED` | This location stores the canonical record field named `somatic` on the canonical record identified by `[record-key]`. | `FIND` + `RECORD` |
| `sheet->integrants->integrants->[record-key]->components->verbal` | boolean<br>`STORED` | This location stores the canonical record field named `verbal` on the canonical record identified by `[record-key]`. | `FIND` + `RECORD` |
| `sheet->integrants->integrants->[record-key]->condition` | string<br>`STORED` | This location stores the canonical record field named `condition` on the canonical record identified by `[record-key]`. | `FIND` + `RECORD` |
| `sheet->integrants->integrants->[record-key]->conversion->amountOfTarget` | number<br>`STORED` | This location stores the canonical record field named `amountOfTarget` on the canonical record identified by `[record-key]`. | `FIND` + `RECORD` |
| `sheet->integrants->integrants->[record-key]->conversion->target` | string<br>`STORED` | This location stores the canonical record field named `target` on the canonical record identified by `[record-key]`. | `FIND` + `RECORD` |
| `sheet->integrants->integrants->[record-key]->cost` | string<br>`STORED` | This location stores the canonical record field named `cost` on the canonical record identified by `[record-key]`. | `FIND` + `RECORD` |
| `sheet->integrants->integrants->[record-key]->critDiceSize` | string<br>`STORED` | This location stores the canonical record field named `critDiceSize` on the canonical record identified by `[record-key]`. | `FIND` + `RECORD` |
| `sheet->integrants->integrants->[record-key]->custom` | boolean<br>`STORED` | This location stores the canonical record field named `custom` on the canonical record identified by `[record-key]`. | `FIND` + `RECORD` |
| `sheet->integrants->integrants->[record-key]->damage` | string<br>`STORED` | This location stores the defense record's damage category or damage-type data on the canonical record identified by `[record-key]`. | `FIND` + `RECORD` |
| `sheet->integrants->integrants->[record-key]->damageType` | string<br>`STORED` | This location stores the damage type on the canonical record identified by `[record-key]`. | `FIND` + `RECORD` |
| `sheet->integrants->integrants->[record-key]->defaultAbility` | boolean<br>`STORED` | This location stores the default ability used by the formula on the canonical record identified by `[record-key]`. | `FIND` + `RECORD` |
| `sheet->integrants->integrants->[record-key]->defaultName` | string<br>`STORED` | This location stores the canonical record field named `defaultName` on the canonical record identified by `[record-key]`. | `FIND` + `RECORD` |
| `sheet->integrants->integrants->[record-key]->defense` | string<br>`STORED` | This location stores the canonical record field named `defense` on the canonical record identified by `[record-key]`. | `FIND` + `RECORD` |
| `sheet->integrants->integrants->[record-key]->description` | string<br>`STORED` | This location stores the human-readable description on the canonical record identified by `[record-key]`. | `FIND` + `RECORD` |
| `sheet->integrants->integrants->[record-key]->dieCount` | number<br>`STORED` | This location stores the canonical record field named `dieCount` on the canonical record identified by `[record-key]`. | `FIND` + `RECORD` |
| `sheet->integrants->integrants->[record-key]->dieSize` | number<br>`STORED` | This location stores the canonical record field named `dieSize` on the canonical record identified by `[record-key]`. | `FIND` + `RECORD` |
| `sheet->integrants->integrants->[record-key]->duration` | string<br>`STORED` | This location stores the duration of the spell or effect on the canonical record identified by `[record-key]`. | `FIND` + `RECORD` |
| `sheet->integrants->integrants->[record-key]->excludeFamilialResources` | boolean<br>`STORED` | This location stores the canonical record field named `excludeFamilialResources` on the canonical record identified by `[record-key]`. | `FIND` + `RECORD` |
| `sheet->integrants->integrants->[record-key]->hitpointType` | string<br>`STORED` | This location stores the canonical record field named `hitpointType` on the canonical record identified by `[record-key]`. | `FIND` + `RECORD` |
| `sheet->integrants->integrants->[record-key]->ignoreValue` | boolean<br>`STORED` | This location stores whether a Sense ignores its numeric range on the canonical record identified by `[record-key]`. | `FIND` + `RECORD` |
| `sheet->integrants->integrants->[record-key]->increaseIfAlreadyAt` | boolean<br>`STORED` | This location stores the canonical record field named `increaseIfAlreadyAt` on the canonical record identified by `[record-key]`. | `FIND` + `RECORD` |
| `sheet->integrants->integrants->[record-key]->level` | number<br>`STORED` | This location stores a class, spell, slot, or upcasting level on the canonical record identified by `[record-key]`. | `FIND` + `RECORD` |
| `sheet->integrants->integrants->[record-key]->mode` | string<br>`STORED` | This location stores the selected mode, such as a roll or upcasting mode on the canonical record identified by `[record-key]`. | `FIND` + `RECORD` |
| `sheet->integrants->integrants->[record-key]->modifications->description` | string<br>`STORED` | This location stores the human-readable description on the canonical record identified by `[record-key]`. | `FIND` + `RECORD` |
| `sheet->integrants->integrants->[record-key]->notes` | string<br>`STORED` | This location stores the canonical record field named `notes` on the canonical record identified by `[record-key]`. | `FIND` + `RECORD` |
| `sheet->integrants->integrants->[record-key]->onHitDisplay` | string<br>`STORED` | This location stores the canonical record field named `onHitDisplay` on the canonical record identified by `[record-key]`. | `FIND` + `RECORD` |
| `sheet->integrants->integrants->[record-key]->overrideCrit` | boolean<br>`STORED` | This location stores the canonical record field named `overrideCrit` on the canonical record identified by `[record-key]`. | `FIND` + `RECORD` |
| `sheet->integrants->integrants->[record-key]->overviewDisplay` | boolean<br>`STORED` | This location stores the canonical record field named `overviewDisplay` on the canonical record identified by `[record-key]`. | `FIND` + `RECORD` |
| `sheet->integrants->integrants->[record-key]->preventSubspecies` | boolean<br>`STORED` | This location stores the canonical record field named `preventSubspecies` on the canonical record identified by `[record-key]`. | `FIND` + `RECORD` |
| `sheet->integrants->integrants->[record-key]->proficiency` | string<br>`STORED` | This location identifies the skill, save, tool, weapon, or armor proficiency on the canonical record identified by `[record-key]`. | `FIND` + `RECORD` |
| `sheet->integrants->integrants->[record-key]->properties->[index]` | string<br>`STORED` | This location stores the canonical record field named `[index]` on the canonical record identified by `[record-key]`. | `FIND` + `RECORD` |
| `sheet->integrants->integrants->[record-key]->quantity` | number<br>`STORED` | This location stores the item quantity on the canonical record identified by `[record-key]`. | `FIND` + `RECORD` |
| `sheet->integrants->integrants->[record-key]->range` | string<br>`STORED` | This location stores the attack or spell range on the canonical record identified by `[record-key]`. | `FIND` + `RECORD` |
| `sheet->integrants->integrants->[record-key]->rarity` | string<br>`STORED` | This location stores the canonical record field named `rarity` on the canonical record identified by `[record-key]`. | `FIND` + `RECORD` |
| `sheet->integrants->integrants->[record-key]->recovery` | string<br>`STORED` | This location stores how the value recovers on the canonical record identified by `[record-key]`. | `FIND` + `RECORD` |
| `sheet->integrants->integrants->[record-key]->relations->WOSph94OitM56cZ2iaynw` | string<br>`STORED` | This location stores the canonical record field named `WOSph94OitM56cZ2iaynw` on the canonical record identified by `[record-key]`. | `FIND` + `RECORD` |
| `sheet->integrants->integrants->[record-key]->relations->Xvu6hzAoDz81im6yg-F6U` | string<br>`STORED` | This location stores the canonical record field named `Xvu6hzAoDz81im6yg-F6U` on the canonical record identified by `[record-key]`. | `FIND` + `RECORD` |
| `sheet->integrants->integrants->[record-key]->relations->dcdOvde0VxAPMNQ8C4xLH` | string<br>`STORED` | This location stores the canonical record field named `dcdOvde0VxAPMNQ8C4xLH` on the canonical record identified by `[record-key]`. | `FIND` + `RECORD` |
| `sheet->integrants->integrants->[record-key]->relations->sFUWXkqwwfto5WVIGBLml` | string<br>`STORED` | This location stores the canonical record field named `sFUWXkqwwfto5WVIGBLml` on the canonical record identified by `[record-key]`. | `FIND` + `RECORD` |
| `sheet->integrants->integrants->[record-key]->repeat` | number<br>`STORED` | This location stores attack repetition or multiattack information on the canonical record identified by `[record-key]`. | `FIND` + `RECORD` |
| `sheet->integrants->integrants->[record-key]->restType->[index]` | string<br>`STORED` | This location stores the canonical record field named `[index]` on the canonical record identified by `[record-key]`. | `FIND` + `RECORD` |
| `sheet->integrants->integrants->[record-key]->rollAbility` | string<br>`STORED` | This location stores the ability used when rolling the proficiency on the canonical record identified by `[record-key]`. | `FIND` + `RECORD` |
| `sheet->integrants->integrants->[record-key]->save->onFail` | string<br>`STORED` | This location stores the effect or text used when a save fails on the canonical record identified by `[record-key]`. | `FIND` + `RECORD` |
| `sheet->integrants->integrants->[record-key]->save->onSucceed` | string<br>`STORED` | This location stores the effect or text used when a save succeeds on the canonical record identified by `[record-key]`. | `FIND` + `RECORD` |
| `sheet->integrants->integrants->[record-key]->save->saveAbility` | string<br>`STORED` | This location stores the canonical record field named `saveAbility` on the canonical record identified by `[record-key]`. | `FIND` + `RECORD` |
| `sheet->integrants->integrants->[record-key]->save->saveFormula->ability->add` | boolean<br>`STORED` | This location stores the canonical record field named `add` on the canonical record identified by `[record-key]`. | `FIND` + `RECORD` |
| `sheet->integrants->integrants->[record-key]->save->saveFormula->proficiency->add` | boolean<br>`STORED` | This location stores the canonical record field named `add` on the canonical record identified by `[record-key]`. | `FIND` + `RECORD` |
| `sheet->integrants->integrants->[record-key]->school` | string<br>`STORED` | This location stores the spell school on the canonical record identified by `[record-key]`. | `FIND` + `RECORD` |
| `sheet->integrants->integrants->[record-key]->showAsPassive` | boolean<br>`STORED` | This location stores whether the Skill can be displayed or calculated as a passive score on the canonical record identified by `[record-key]`. | `FIND` + `RECORD` |
| `sheet->integrants->integrants->[record-key]->sizeValue` | string<br>`STORED` | This location stores the canonical creature-size value on the canonical record identified by `[record-key]`. | `FIND` + `RECORD` |
| `sheet->integrants->integrants->[record-key]->speed` | string<br>`STORED` | This location identifies the movement mode on the canonical record identified by `[record-key]`. | `FIND` + `RECORD` |
| `sheet->integrants->integrants->[record-key]->spellLevel` | number<br>`STORED` | This location stores the spell-slot level on the canonical record identified by `[record-key]`. | `FIND` + `RECORD` |
| `sheet->integrants->integrants->[record-key]->startingLevel` | number<br>`STORED` | This location stores the starting level for the upcasting rule on the canonical record identified by `[record-key]`. | `FIND` + `RECORD` |
| `sheet->integrants->integrants->[record-key]->subClassID` | string<br>`STORED` | This location stores the canonical record field named `subClassID` on the canonical record identified by `[record-key]`. | `FIND` + `RECORD` |
| `sheet->integrants->integrants->[record-key]->target` | string<br>`STORED` | This location stores the canonical record field named `target` on the canonical record identified by `[record-key]`. | `FIND` + `RECORD` |
| `sheet->integrants->integrants->[record-key]->tempShopData->compendiumUrl` | string<br>`STORED` | This location stores the canonical record field named `compendiumUrl` on the canonical record identified by `[record-key]`. | `FIND` + `RECORD` |
| `sheet->integrants->integrants->[record-key]->tempShopData->useCompendiumLink` | boolean<br>`STORED` | This location stores the canonical record field named `useCompendiumLink` on the canonical record identified by `[record-key]`. | `FIND` + `RECORD` |
| `sheet->integrants->integrants->[record-key]->totalRoll` | boolean<br>`STORED` | Stores the Roll Bonus record's `totalRoll` flag. | `FIND` + `RECORD` |
| `sheet->integrants->integrants->[record-key]->upcastText` | string<br>`STORED` | This location stores the canonical record field named `upcastText` on the canonical record identified by `[record-key]`. | `FIND` + `RECORD` |
| `sheet->integrants->integrants->[record-key]->value` | number<br>`STORED` | This location stores the record's finite current value on the canonical record identified by `[record-key]`. | `FIND` + `RECORD` |
| `sheet->integrants->integrants->[record-key]->valueFormula->ability->add` | boolean<br>`STORED` | This location stores the canonical record field named `add` on the canonical record identified by `[record-key]`. | `FIND` + `RECORD` |
| `sheet->integrants->integrants->[record-key]->weaponData->category` | string<br>`STORED` | Stores the weapon category on an Item record. | `FIND` + `RECORD` |
| `sheet->integrants->integrants->[record-key]->weaponData->training` | string<br>`STORED` | This location stores the canonical record field named `training` on the canonical record identified by `[record-key]`. | `FIND` + `RECORD` |
| `sheet->integrants->integrants->[record-key]->weight` | number, string<br>`STORED` | This location stores the item weight on the canonical record identified by `[record-key]`. | `FIND` + `RECORD` |


### Builder-only typed collections

The typed-collection index walks both `store` and `builder`. The collections below therefore exist even though their records are builder definitions rather than canonical finished-character records.

> **Value kinds**
>
> - `TRANSIENT` — Builder or user-interface state that is not authoritative live character data.
>
> **Usage**
>
> - `BUILDER` — Use this only for builder inspection or deliberate builder automation, not as finished-character data.

| Typed collection | Builder record type | Important fields | Description | Use |
|---|---|---|---|---|
| `abilityscorechoices` | `Ability Score Choice` | `choose`, `increase`, `from`, `excludeFrom` | Describes which ability scores can be selected and how much each selection increases them. | `BUILDER` |
| `effects` | `Effect` | `category`, `description`, `flatValueFormula->customFormula`, `shortID` | Describes a builder effect before or alongside the canonical records it produces. | `BUILDER` |
| `featattaches` | `Feat Attach` | `feats`, `limitations->choiceName`, `limitations->optionNames` | Describes feats automatically attached by a builder choice and the limitations controlling them. | `BUILDER` |
| `featchoices` | `Feat Choice` | `list`, `limitations` | Describes the feat options offered by a builder choice. | `BUILDER` |
| `genericchoices` | `Generic Choice` | `category`, `numOfChoices`, `replace` | Describes a generic builder selection that does not have a more specific record type. | `BUILDER` |
| `itemattaches` | `Item Attach` | `items`, `parentID`, `childIDs` | Describes items attached by a builder choice; selected items may later be represented by canonical Item records. | `BUILDER` |
| `languagechoices` | `Language Choice` | `list`, `numOfChoices` | Describes the language options and number of selections offered by the builder. | `BUILDER` |
| `proficiencychoices` | `Proficiency Choice` | `list`, `numOfChoices`, `proficiencyLevel`, `subtype` | Describes selectable proficiencies and the tier granted by the choice. | `BUILDER` |
| `spellchoices` | `Spell Choice` | `choices`, `filter`, `list`, `spellLevel`, `alwaysPrepared` | Describes spells offered by a builder choice and the filters applied to that list. | `BUILDER` |
| `startingcurrencies` | `Starting Currency` | `gold` | Stores the starting-currency option offered by the builder. | `BUILDER` |
| `startingequipments` | `Starting Equipment` | `items`, `numOfChoices`, `subtype` | Describes starting-equipment choices offered by the builder. The collection name is the exact result of ScriptCards' generic pluraliser. | `BUILDER` |

The full primitive paths for these records remain listed in the Builder location index below.


### Builder location index

Builder locations are accessible, but they are not authoritative finished-character data.

#### Builder workflow and section payloads

> **Value kinds**
>
> - `TRANSIENT` — Builder or user-interface state that is not authoritative live character data.
>
> **Usage**
>
> - `BUILDER` — Use this only for builder inspection or deliberate builder automation, not as finished-character data.

| ScriptCards location | Value | Description | Use |
|---|---|---|---|
| `builder->abilities->assignAllToggled` | boolean<br>`TRANSIENT` | This builder location stores the builder value named `assignAllToggled` while the character builder is creating or editing the character. | `BUILDER` |
| `builder->abilities->generationMethod` | string<br>`TRANSIENT` | This builder location stores the builder value named `generationMethod` while the character builder is creating or editing the character. | `BUILDER` |
| `builder->abilities->hasVisited` | boolean<br>`TRANSIENT` | This builder location stores the builder value named `hasVisited` while the character builder is creating or editing the character. | `BUILDER` |
| `builder->abilities->isUsingTCERulesASI` | boolean<br>`TRANSIENT` | This builder location stores the builder value named `isUsingTCERulesASI` while the character builder is creating or editing the character. | `BUILDER` |
| `builder->abilities->rolledArray` | string<br>`TRANSIENT` | This builder location stores the builder value named `rolledArray` while the character builder is creating or editing the character. | `BUILDER` |
| `builder->about->hasVisited` | boolean<br>`TRANSIENT` | This builder location stores the builder value named `hasVisited` while the character builder is creating or editing the character. | `BUILDER` |
| `builder->background->hasVisited` | boolean<br>`TRANSIENT` | This builder location stores the builder value named `hasVisited` while the character builder is creating or editing the character. | `BUILDER` |
| `builder->class->hasVisited` | boolean<br>`TRANSIENT` | This builder location stores the builder value named `hasVisited` while the character builder is creating or editing the character. | `BUILDER` |
| `builder->equipment->hasVisited` | boolean<br>`TRANSIENT` | This builder location stores the builder value named `hasVisited` while the character builder is creating or editing the character. | `BUILDER` |
| `builder->feats->hasVisited` | boolean<br>`TRANSIENT` | This builder location stores the builder value named `hasVisited` while the character builder is creating or editing the character. | `BUILDER` |
| `builder->finalize->builderIterations->[iteration-key]` | number<br>`TRANSIENT` | This builder location stores the builder value named `[iteration-key]` while the character builder is creating or editing the character. | `BUILDER` |
| `builder->hasCompletedOnce` | boolean<br>`TRANSIENT` | This builder location stores the builder value named `hasCompletedOnce` while the character builder is creating or editing the character. | `BUILDER` — Historical completion flag; it does not mean the builder is currently active. |
| `builder->isInProgress` | boolean<br>`TRANSIENT` | This builder location stores the builder value named `isInProgress` while the character builder is creating or editing the character. | `BUILDER` — Use this only to detect an active builder workflow; it is not finished-character validity state. |
| `builder->skills->hasVisited` | boolean<br>`TRANSIENT` | This builder location stores the builder value named `hasVisited` while the character builder is creating or editing the character. | `BUILDER` |
| `builder->species->hasVisited` | boolean<br>`TRANSIENT` | This builder location stores the builder value named `hasVisited` while the character builder is creating or editing the character. | `BUILDER` |
| `builder->spells->hasVisited` | boolean<br>`TRANSIENT` | This builder location stores the builder value named `hasVisited` while the character builder is creating or editing the character. | `BUILDER` |

#### Builder decisions

> **Value kinds**
>
> - `TRANSIENT` — Builder or user-interface state that is not authoritative live character data.
>
> **Usage**
>
> - `BUILDER` — Use this only for builder inspection or deliberate builder automation, not as finished-character data.

| ScriptCards location | Value | Description | Use |
|---|---|---|---|
| `builder->decisions->allDecisions->[decision-key]->_active` | boolean<br>`TRANSIENT` | This builder location stores whether this record or effect is currently active while the character builder is creating or editing the character. | `BUILDER` — Current builder-choice state only; the resulting live canonical records may not yet exist or may differ. |
| `builder->decisions->allDecisions->[decision-key]->_id` | string<br>`TRANSIENT` | This builder location stores the builder value named `_id` while the character builder is creating or editing the character. | `BUILDER` |
| `builder->decisions->allDecisions->[decision-key]->_iteration` | string<br>`TRANSIENT` | This builder location stores the builder value named `_iteration` while the character builder is creating or editing the character. | `BUILDER` |
| `builder->decisions->allDecisions->[decision-key]->children` | array<br>`TRANSIENT` | This builder location stores the builder value named `children` while the character builder is creating or editing the character. | `BUILDER` |
| `builder->decisions->allDecisions->[decision-key]->children->[index]` | string<br>`TRANSIENT` | This builder location stores the builder value named `[index]` while the character builder is creating or editing the character. | `BUILDER` |
| `builder->decisions->allDecisions->[decision-key]->metadata->book->bundles` | array<br>`TRANSIENT` | This builder location stores the builder value named `bundles` while the character builder is creating or editing the character. | `BUILDER` |
| `builder->decisions->allDecisions->[decision-key]->metadata->book->cost` | number<br>`TRANSIENT` | This builder location stores the builder value named `cost` while the character builder is creating or editing the character. | `BUILDER` |
| `builder->decisions->allDecisions->[decision-key]->metadata->book->coverImage` | string<br>`TRANSIENT` | This builder location stores the builder value named `coverImage` while the character builder is creating or editing the character. | `BUILDER` |
| `builder->decisions->allDecisions->[decision-key]->metadata->book->isOwned` | boolean<br>`TRANSIENT` | This builder location stores the builder value named `isOwned` while the character builder is creating or editing the character. | `BUILDER` |
| `builder->decisions->allDecisions->[decision-key]->metadata->book->itemId` | number<br>`TRANSIENT` | This builder location stores the builder value named `itemId` while the character builder is creating or editing the character. | `BUILDER` |
| `builder->decisions->allDecisions->[decision-key]->metadata->book->name` | string<br>`TRANSIENT` | This builder location stores the record's primary display name while the character builder is creating or editing the character. | `BUILDER` |
| `builder->decisions->allDecisions->[decision-key]->metadata->book->notForSale` | boolean<br>`TRANSIENT` | This builder location stores the builder value named `notForSale` while the character builder is creating or editing the character. | `BUILDER` |
| `builder->decisions->allDecisions->[decision-key]->metadata->book->systemVersion` | number<br>`TRANSIENT` | This builder location stores the builder value named `systemVersion` while the character builder is creating or editing the character. | `BUILDER` |
| `builder->decisions->allDecisions->[decision-key]->metadata->builderDisplayDescription` | string<br>`TRANSIENT` | This builder location stores the builder value named `builderDisplayDescription` while the character builder is creating or editing the character. | `BUILDER` |
| `builder->decisions->allDecisions->[decision-key]->metadata->builderDisplayName` | string<br>`TRANSIENT` | This builder location stores the label shown by the character builder while the character builder is creating or editing the character. | `BUILDER` |
| `builder->decisions->allDecisions->[decision-key]->metadata->cameFromFeat` | boolean<br>`TRANSIENT` | This builder location stores the builder value named `cameFromFeat` while the character builder is creating or editing the character. | `BUILDER` |
| `builder->decisions->allDecisions->[decision-key]->metadata->choiceIndex` | number<br>`TRANSIENT` | This builder location stores the builder value named `choiceIndex` while the character builder is creating or editing the character. | `BUILDER` |
| `builder->decisions->allDecisions->[decision-key]->metadata->chosen` | array<br>`TRANSIENT` | This builder location stores the builder value named `chosen` while the character builder is creating or editing the character. | `BUILDER` |
| `builder->decisions->allDecisions->[decision-key]->metadata->chosen->[index]` | string<br>`TRANSIENT` | This builder location stores the builder value named `[index]` while the character builder is creating or editing the character. | `BUILDER` |
| `builder->decisions->allDecisions->[decision-key]->metadata->classLevel` | number<br>`TRANSIENT` | This builder location stores the builder value named `classLevel` while the character builder is creating or editing the character. | `BUILDER` |
| `builder->decisions->allDecisions->[decision-key]->metadata->className` | string<br>`TRANSIENT` | This builder location stores the builder value named `className` while the character builder is creating or editing the character. | `BUILDER` |
| `builder->decisions->allDecisions->[decision-key]->metadata->closestParent` | string<br>`TRANSIENT` | This builder location stores the builder value named `closestParent` while the character builder is creating or editing the character. | `BUILDER` |
| `builder->decisions->allDecisions->[decision-key]->metadata->disabledByGenerationMethod` | boolean<br>`TRANSIENT` | This builder location stores the builder value named `disabledByGenerationMethod` while the character builder is creating or editing the character. | `BUILDER` |
| `builder->decisions->allDecisions->[decision-key]->metadata->featRepeatable` | boolean<br>`TRANSIENT` | This builder location stores the builder value named `featRepeatable` while the character builder is creating or editing the character. | `BUILDER` |
| `builder->decisions->allDecisions->[decision-key]->metadata->generationMethod` | string<br>`TRANSIENT` | This builder location stores the builder value named `generationMethod` while the character builder is creating or editing the character. | `BUILDER` |
| `builder->decisions->allDecisions->[decision-key]->metadata->hasInput` | boolean<br>`TRANSIENT` | This builder location stores the builder value named `hasInput` while the character builder is creating or editing the character. | `BUILDER` |
| `builder->decisions->allDecisions->[decision-key]->metadata->hasLocalASI` | boolean<br>`TRANSIENT` | This builder location stores the builder value named `hasLocalASI` while the character builder is creating or editing the character. | `BUILDER` |
| `builder->decisions->allDecisions->[decision-key]->metadata->hasLocalFeat` | boolean<br>`TRANSIENT` | This builder location stores the builder value named `hasLocalFeat` while the character builder is creating or editing the character. | `BUILDER` |
| `builder->decisions->allDecisions->[decision-key]->metadata->index` | number<br>`TRANSIENT` | This builder location stores the builder value named `index` while the character builder is creating or editing the character. | `BUILDER` |
| `builder->decisions->allDecisions->[decision-key]->metadata->is2024` | boolean<br>`TRANSIENT` | This builder location stores the builder value named `is2024` while the character builder is creating or editing the character. | `BUILDER` |
| `builder->decisions->allDecisions->[decision-key]->metadata->isPrimary` | boolean<br>`TRANSIENT` | This builder location stores the builder value named `isPrimary` while the character builder is creating or editing the character. | `BUILDER` |
| `builder->decisions->allDecisions->[decision-key]->metadata->level` | number<br>`TRANSIENT` | This builder location stores a class, spell, slot, or upcasting level while the character builder is creating or editing the character. | `BUILDER` |
| `builder->decisions->allDecisions->[decision-key]->metadata->multiclass` | boolean<br>`TRANSIENT` | This builder location stores the builder value named `multiclass` while the character builder is creating or editing the character. | `BUILDER` |
| `builder->decisions->allDecisions->[decision-key]->metadata->override2024` | boolean<br>`TRANSIENT` | This builder location stores the builder value named `override2024` while the character builder is creating or editing the character. | `BUILDER` |
| `builder->decisions->allDecisions->[decision-key]->metadata->position` | number<br>`TRANSIENT` | This builder location stores the builder value named `position` while the character builder is creating or editing the character. | `BUILDER` |
| `builder->decisions->allDecisions->[decision-key]->metadata->publisherIcon` | string<br>`TRANSIENT` | This builder location stores the builder value named `publisherIcon` while the character builder is creating or editing the character. | `BUILDER` |
| `builder->decisions->allDecisions->[decision-key]->metadata->spellLevel` | number<br>`TRANSIENT` | This builder location stores the spell-slot level while the character builder is creating or editing the character. | `BUILDER` |
| `builder->decisions->allDecisions->[decision-key]->metadata->subclassDescription` | string<br>`TRANSIENT` | This builder location stores the builder value named `subclassDescription` while the character builder is creating or editing the character. | `BUILDER` |
| `builder->decisions->allDecisions->[decision-key]->metadata->subclassLevel` | number<br>`TRANSIENT` | This builder location stores the builder value named `subclassLevel` while the character builder is creating or editing the character. | `BUILDER` |
| `builder->decisions->allDecisions->[decision-key]->metadata->subclassName` | string<br>`TRANSIENT` | This builder location stores the builder value named `subclassName` while the character builder is creating or editing the character. | `BUILDER` |
| `builder->decisions->allDecisions->[decision-key]->metadata->type` | string<br>`TRANSIENT` | This builder location identifies the canonical record type while the character builder is creating or editing the character. | `BUILDER` |
| `builder->decisions->allDecisions->[decision-key]->parentID` | string<br>`TRANSIENT` | This builder location stores the canonical key of the record's immediate parent while the character builder is creating or editing the character. | `BUILDER` |
| `builder->decisions->allDecisions->[decision-key]->payload` | unknown<br>`TRANSIENT` | This builder location stores the builder value named `payload` while the character builder is creating or editing the character. | `BUILDER` |
| `builder->decisions->allDecisions->[decision-key]->payload->_bonus` | number<br>`TRANSIENT` | This builder location stores the builder value named `_bonus` while the character builder is creating or editing the character. | `BUILDER` |
| `builder->decisions->allDecisions->[decision-key]->payload->_id` | string<br>`TRANSIENT` | This builder location stores the builder value named `_id` while the character builder is creating or editing the character. | `BUILDER` |
| `builder->decisions->allDecisions->[decision-key]->payload->_label` | string<br>`TRANSIENT` | This builder location stores the builder value named `_label` while the character builder is creating or editing the character. | `BUILDER` |
| `builder->decisions->allDecisions->[decision-key]->payload->ability` | string<br>`TRANSIENT` | This builder location identifies the ability used by this record or formula while the character builder is creating or editing the character. | `BUILDER` |
| `builder->decisions->allDecisions->[decision-key]->payload->actionType` | string<br>`TRANSIENT` | This builder location identifies whether the record is an Action, Bonus Action, Reaction, Free Action, or another action category while the character builder is creating or editing the character. | `BUILDER` |
| `builder->decisions->allDecisions->[decision-key]->payload->alwaysPrepared` | boolean<br>`TRANSIENT` | This builder location stores the builder value named `alwaysPrepared` while the character builder is creating or editing the character. | `BUILDER` |
| `builder->decisions->allDecisions->[decision-key]->payload->aoe->shape` | string<br>`TRANSIENT` | This builder location stores the builder value named `shape` while the character builder is creating or editing the character. | `BUILDER` |
| `builder->decisions->allDecisions->[decision-key]->payload->aoe->size` | string<br>`TRANSIENT` | This builder location stores the builder value named `size` while the character builder is creating or editing the character. | `BUILDER` |
| `builder->decisions->allDecisions->[decision-key]->payload->attack->abilityBonus` | string<br>`TRANSIENT` | This builder location stores the ability contribution used by the attack while the character builder is creating or editing the character. | `BUILDER` |
| `builder->decisions->allDecisions->[decision-key]->payload->attack->type` | string<br>`TRANSIENT` | This builder location identifies the canonical record type while the character builder is creating or editing the character. | `BUILDER` |
| `builder->decisions->allDecisions->[decision-key]->payload->autoHit` | boolean<br>`TRANSIENT` | This builder location stores whether the attack skips an attack roll and automatically applies its effect or damage while the character builder is creating or editing the character. | `BUILDER` |
| `builder->decisions->allDecisions->[decision-key]->payload->builderDisplayName` | string<br>`TRANSIENT` | This builder location stores the label shown by the character builder while the character builder is creating or editing the character. | `BUILDER` |
| `builder->decisions->allDecisions->[decision-key]->payload->calculation` | string<br>`TRANSIENT` | This builder location identifies the calculation method used by this record while the character builder is creating or editing the character. | `BUILDER` |
| `builder->decisions->allDecisions->[decision-key]->payload->cantripScale` | string<br>`TRANSIENT` | This builder location stores the spell's cantrip-scaling behavior while the character builder is creating or editing the character. | `BUILDER` |
| `builder->decisions->allDecisions->[decision-key]->payload->casterType` | string<br>`TRANSIENT` | This builder location identifies the spellcasting progression or caster category while the character builder is creating or editing the character. | `BUILDER` |
| `builder->decisions->allDecisions->[decision-key]->payload->castingTime` | string<br>`TRANSIENT` | This builder location stores the builder value named `castingTime` while the character builder is creating or editing the character. | `BUILDER` |
| `builder->decisions->allDecisions->[decision-key]->payload->category` | string<br>`TRANSIENT` | Stores the category used by this builder payload; its meaning depends on the payload type. | `BUILDER` |
| `builder->decisions->allDecisions->[decision-key]->payload->category->[index]` | string<br>`TRANSIENT` | This builder location stores the builder value named `[index]` while the character builder is creating or editing the character. | `BUILDER` |
| `builder->decisions->allDecisions->[decision-key]->payload->changeMode` | string<br>`TRANSIENT` | This builder location stores the builder value named `changeMode` while the character builder is creating or editing the character. | `BUILDER` |
| `builder->decisions->allDecisions->[decision-key]->payload->choices` | number<br>`TRANSIENT` | This builder location stores the builder value named `choices` while the character builder is creating or editing the character. | `BUILDER` |
| `builder->decisions->allDecisions->[decision-key]->payload->choose` | number<br>`TRANSIENT` | This builder location stores the builder value named `choose` while the character builder is creating or editing the character. | `BUILDER` |
| `builder->decisions->allDecisions->[decision-key]->payload->classID` | string<br>`TRANSIENT` | This builder location identifies the owning Class record while the character builder is creating or editing the character. | `BUILDER` |
| `builder->decisions->allDecisions->[decision-key]->payload->compendiumPageID` | string<br>`TRANSIENT` | This builder location stores the Roll20 Compendium page identifier while the character builder is creating or editing the character. | `BUILDER` |
| `builder->decisions->allDecisions->[decision-key]->payload->components->material` | boolean<br>`TRANSIENT` | This builder location stores the builder value named `material` while the character builder is creating or editing the character. | `BUILDER` |
| `builder->decisions->allDecisions->[decision-key]->payload->components->materialDescription` | string<br>`TRANSIENT` | This builder location stores the builder value named `materialDescription` while the character builder is creating or editing the character. | `BUILDER` |
| `builder->decisions->allDecisions->[decision-key]->payload->components->somatic` | boolean<br>`TRANSIENT` | This builder location stores the builder value named `somatic` while the character builder is creating or editing the character. | `BUILDER` |
| `builder->decisions->allDecisions->[decision-key]->payload->components->verbal` | boolean<br>`TRANSIENT` | This builder location stores the builder value named `verbal` while the character builder is creating or editing the character. | `BUILDER` |
| `builder->decisions->allDecisions->[decision-key]->payload->concat->name` | string<br>`TRANSIENT` | This builder location stores the record's primary display name while the character builder is creating or editing the character. | `BUILDER` |
| `builder->decisions->allDecisions->[decision-key]->payload->concentration` | boolean<br>`TRANSIENT` | This builder location stores whether the spell requires Concentration while the character builder is creating or editing the character. | `BUILDER` |
| `builder->decisions->allDecisions->[decision-key]->payload->cost` | string<br>`TRANSIENT` | This builder location stores the builder value named `cost` while the character builder is creating or editing the character. | `BUILDER` |
| `builder->decisions->allDecisions->[decision-key]->payload->damageType` | string<br>`TRANSIENT` | This builder location stores the damage type while the character builder is creating or editing the character. | `BUILDER` |
| `builder->decisions->allDecisions->[decision-key]->payload->description` | string<br>`TRANSIENT` | This builder location stores the human-readable description while the character builder is creating or editing the character. | `BUILDER` |
| `builder->decisions->allDecisions->[decision-key]->payload->diceCount` | number<br>`TRANSIENT` | This builder location stores the number of dice while the character builder is creating or editing the character. | `BUILDER` |
| `builder->decisions->allDecisions->[decision-key]->payload->diceSize` | string<br>`TRANSIENT` | This builder location stores the die size while the character builder is creating or editing the character. | `BUILDER` |
| `builder->decisions->allDecisions->[decision-key]->payload->dieCount` | number<br>`TRANSIENT` | This builder location stores the builder value named `dieCount` while the character builder is creating or editing the character. | `BUILDER` |
| `builder->decisions->allDecisions->[decision-key]->payload->dieSize` | number<br>`TRANSIENT` | This builder location stores the builder value named `dieSize` while the character builder is creating or editing the character. | `BUILDER` |
| `builder->decisions->allDecisions->[decision-key]->payload->duration` | string<br>`TRANSIENT` | This builder location stores the duration of the spell or effect while the character builder is creating or editing the character. | `BUILDER` |
| `builder->decisions->allDecisions->[decision-key]->payload->equipData->equippable` | boolean<br>`TRANSIENT` | This builder location stores whether the item can be equipped while the character builder is creating or editing the character. | `BUILDER` |
| `builder->decisions->allDecisions->[decision-key]->payload->excludeFrom` | string<br>`TRANSIENT` | This builder location stores the builder value named `excludeFrom` while the character builder is creating or editing the character. | `BUILDER` |
| `builder->decisions->allDecisions->[decision-key]->payload->feats->[index]` | string<br>`TRANSIENT` | This builder location stores the builder value named `[index]` while the character builder is creating or editing the character. | `BUILDER` |
| `builder->decisions->allDecisions->[decision-key]->payload->filter` | array<br>`TRANSIENT` | This builder location stores the builder value named `filter` while the character builder is creating or editing the character. | `BUILDER` |
| `builder->decisions->allDecisions->[decision-key]->payload->filter->[index]` | string<br>`TRANSIENT` | This builder location stores the builder value named `[index]` while the character builder is creating or editing the character. | `BUILDER` |
| `builder->decisions->allDecisions->[decision-key]->payload->flatValueFormula->customFormula` | string<br>`TRANSIENT` | This builder location stores the builder value named `customFormula` while the character builder is creating or editing the character. | `BUILDER` |
| `builder->decisions->allDecisions->[decision-key]->payload->from->[index]` | string<br>`TRANSIENT` | This builder location stores the builder value named `[index]` while the character builder is creating or editing the character. | `BUILDER` |
| `builder->decisions->allDecisions->[decision-key]->payload->fromClassList->[index]` | string<br>`TRANSIENT` | This builder location stores the builder value named `[index]` while the character builder is creating or editing the character. | `BUILDER` |
| `builder->decisions->allDecisions->[decision-key]->payload->gold` | number<br>`TRANSIENT` | This builder location stores the builder value named `gold` while the character builder is creating or editing the character. | `BUILDER` |
| `builder->decisions->allDecisions->[decision-key]->payload->includeBelow` | boolean<br>`TRANSIENT` | This builder location stores the builder value named `includeBelow` while the character builder is creating or editing the character. | `BUILDER` |
| `builder->decisions->allDecisions->[decision-key]->payload->increase` | number<br>`TRANSIENT` | This builder location stores the builder value named `increase` while the character builder is creating or editing the character. | `BUILDER` |
| `builder->decisions->allDecisions->[decision-key]->payload->increaseIfAlreadyAt` | boolean<br>`TRANSIENT` | This builder location stores the builder value named `increaseIfAlreadyAt` while the character builder is creating or editing the character. | `BUILDER` |
| `builder->decisions->allDecisions->[decision-key]->payload->isFixed` | boolean<br>`TRANSIENT` | This builder location stores whether the formula uses a fixed value while the character builder is creating or editing the character. | `BUILDER` |
| `builder->decisions->allDecisions->[decision-key]->payload->items` | array<br>`TRANSIENT` | This builder location stores the builder value named `items` while the character builder is creating or editing the character. | `BUILDER` |
| `builder->decisions->allDecisions->[decision-key]->payload->items->[index]` | string<br>`TRANSIENT` | This builder location stores the builder value named `[index]` while the character builder is creating or editing the character. | `BUILDER` |
| `builder->decisions->allDecisions->[decision-key]->payload->label` | string<br>`TRANSIENT` | This builder location stores a secondary display identity for the record while the character builder is creating or editing the character. | `BUILDER` |
| `builder->decisions->allDecisions->[decision-key]->payload->level` | number<br>`TRANSIENT` | This builder location stores a class, spell, slot, or upcasting level while the character builder is creating or editing the character. | `BUILDER` |
| `builder->decisions->allDecisions->[decision-key]->payload->levelOrder` | number<br>`TRANSIENT` | This builder location stores the builder value named `levelOrder` while the character builder is creating or editing the character. | `BUILDER` |
| `builder->decisions->allDecisions->[decision-key]->payload->limitations` | array<br>`TRANSIENT` | This builder location stores the builder value named `limitations` while the character builder is creating or editing the character. | `BUILDER` |
| `builder->decisions->allDecisions->[decision-key]->payload->limitations->choiceName` | string<br>`TRANSIENT` | This builder location stores the builder value named `choiceName` while the character builder is creating or editing the character. | `BUILDER` |
| `builder->decisions->allDecisions->[decision-key]->payload->limitations->optionNames->[index]` | string<br>`TRANSIENT` | This builder location stores the builder value named `[index]` while the character builder is creating or editing the character. | `BUILDER` |
| `builder->decisions->allDecisions->[decision-key]->payload->list` | array<br>`TRANSIENT` | This builder location stores the builder value named `list` while the character builder is creating or editing the character. | `BUILDER` |
| `builder->decisions->allDecisions->[decision-key]->payload->list->[index]` | string<br>`TRANSIENT` | This builder location stores the builder value named `[index]` while the character builder is creating or editing the character. | `BUILDER` |
| `builder->decisions->allDecisions->[decision-key]->payload->maxValueFormula->flatValue` | number<br>`TRANSIENT` | This builder location stores a finite value used as an input by a formula while the character builder is creating or editing the character. | `BUILDER` |
| `builder->decisions->allDecisions->[decision-key]->payload->mode` | string<br>`TRANSIENT` | This builder location stores the selected mode, such as a roll or upcasting mode while the character builder is creating or editing the character. | `BUILDER` |
| `builder->decisions->allDecisions->[decision-key]->payload->modifications->description` | string<br>`TRANSIENT` | This builder location stores the human-readable description while the character builder is creating or editing the character. | `BUILDER` |
| `builder->decisions->allDecisions->[decision-key]->payload->name` | string<br>`TRANSIENT` | This builder location stores the record's primary display name while the character builder is creating or editing the character. | `BUILDER` |
| `builder->decisions->allDecisions->[decision-key]->payload->numOfChoices` | number<br>`TRANSIENT` | This builder location stores the builder value named `numOfChoices` while the character builder is creating or editing the character. | `BUILDER` |
| `builder->decisions->allDecisions->[decision-key]->payload->onHitDisplay` | string<br>`TRANSIENT` | This builder location stores the builder value named `onHitDisplay` while the character builder is creating or editing the character. | `BUILDER` |
| `builder->decisions->allDecisions->[decision-key]->payload->preventSubspecies` | boolean<br>`TRANSIENT` | This builder location stores the builder value named `preventSubspecies` while the character builder is creating or editing the character. | `BUILDER` |
| `builder->decisions->allDecisions->[decision-key]->payload->proficiency` | string<br>`TRANSIENT` | This builder location identifies the skill, save, tool, weapon, or armor proficiency while the character builder is creating or editing the character. | `BUILDER` |
| `builder->decisions->allDecisions->[decision-key]->payload->proficiencyLevel` | string<br>`TRANSIENT` | This builder location stores the proficiency tier, such as Proficient or Expertise while the character builder is creating or editing the character. | `BUILDER` |
| `builder->decisions->allDecisions->[decision-key]->payload->properties->[index]` | string<br>`TRANSIENT` | This builder location stores the builder value named `[index]` while the character builder is creating or editing the character. | `BUILDER` |
| `builder->decisions->allDecisions->[decision-key]->payload->quantity` | number<br>`TRANSIENT` | This builder location stores the item quantity while the character builder is creating or editing the character. | `BUILDER` |
| `builder->decisions->allDecisions->[decision-key]->payload->range` | string<br>`TRANSIENT` | This builder location stores the attack or spell range while the character builder is creating or editing the character. | `BUILDER` |
| `builder->decisions->allDecisions->[decision-key]->payload->rarity` | string<br>`TRANSIENT` | This builder location stores the builder value named `rarity` while the character builder is creating or editing the character. | `BUILDER` |
| `builder->decisions->allDecisions->[decision-key]->payload->recordName` | string<br>`TRANSIENT` | This builder location stores the record's internal identity name while the character builder is creating or editing the character. | `BUILDER` |
| `builder->decisions->allDecisions->[decision-key]->payload->recovery` | string<br>`TRANSIENT` | This builder location stores how the value recovers while the character builder is creating or editing the character. | `BUILDER` |
| `builder->decisions->allDecisions->[decision-key]->payload->recoveryRate` | string<br>`TRANSIENT` | This builder location stores how much of the Resource recovers while the character builder is creating or editing the character. | `BUILDER` |
| `builder->decisions->allDecisions->[decision-key]->payload->recoveryRate->Long Rest->type` | string<br>`TRANSIENT` | This builder location identifies the canonical record type while the character builder is creating or editing the character. | `BUILDER` |
| `builder->decisions->allDecisions->[decision-key]->payload->recoveryRate->Short Rest->type` | string<br>`TRANSIENT` | This builder location identifies the canonical record type while the character builder is creating or editing the character. | `BUILDER` |
| `builder->decisions->allDecisions->[decision-key]->payload->repeat` | number<br>`TRANSIENT` | This builder location stores attack repetition or multiattack information while the character builder is creating or editing the character. | `BUILDER` |
| `builder->decisions->allDecisions->[decision-key]->payload->replace` | boolean<br>`TRANSIENT` | This builder location stores the builder value named `replace` while the character builder is creating or editing the character. | `BUILDER` |
| `builder->decisions->allDecisions->[decision-key]->payload->restType->[index]` | string<br>`TRANSIENT` | This builder location stores the builder value named `[index]` while the character builder is creating or editing the character. | `BUILDER` |
| `builder->decisions->allDecisions->[decision-key]->payload->ritual` | boolean<br>`TRANSIENT` | This builder location stores whether the spell can be cast as a Ritual while the character builder is creating or editing the character. | `BUILDER` |
| `builder->decisions->allDecisions->[decision-key]->payload->save->onFail` | string<br>`TRANSIENT` | This builder location stores the effect or text used when a save fails while the character builder is creating or editing the character. | `BUILDER` |
| `builder->decisions->allDecisions->[decision-key]->payload->save->onSucceed` | string<br>`TRANSIENT` | This builder location stores the effect or text used when a save succeeds while the character builder is creating or editing the character. | `BUILDER` |
| `builder->decisions->allDecisions->[decision-key]->payload->save->saveAbility` | string<br>`TRANSIENT` | This builder location stores the builder value named `saveAbility` while the character builder is creating or editing the character. | `BUILDER` |
| `builder->decisions->allDecisions->[decision-key]->payload->save->saveFlat->ability->ability` | string<br>`TRANSIENT` | This builder location identifies the ability used by this record or formula while the character builder is creating or editing the character. | `BUILDER` |
| `builder->decisions->allDecisions->[decision-key]->payload->save->saveFlat->ability->add` | boolean<br>`TRANSIENT` | This builder location stores the builder value named `add` while the character builder is creating or editing the character. | `BUILDER` |
| `builder->decisions->allDecisions->[decision-key]->payload->save->saveFlat->flatValue` | number<br>`TRANSIENT` | This builder location stores a finite value used as an input by a formula while the character builder is creating or editing the character. | `BUILDER` |
| `builder->decisions->allDecisions->[decision-key]->payload->save->saveFlat->proficiency->add` | boolean<br>`TRANSIENT` | This builder location stores the builder value named `add` while the character builder is creating or editing the character. | `BUILDER` |
| `builder->decisions->allDecisions->[decision-key]->payload->school` | string<br>`TRANSIENT` | This builder location stores the spell school while the character builder is creating or editing the character. | `BUILDER` |
| `builder->decisions->allDecisions->[decision-key]->payload->shortID` | string<br>`TRANSIENT` | This builder location stores the compact ID used by Beacon sheet action calls while the character builder is creating or editing the character. | `BUILDER` |
| `builder->decisions->allDecisions->[decision-key]->payload->sizeValue` | string<br>`TRANSIENT` | This builder location stores the canonical creature-size value while the character builder is creating or editing the character. | `BUILDER` |
| `builder->decisions->allDecisions->[decision-key]->payload->source` | string<br>`TRANSIENT` | This builder location stores the human-readable source label while the character builder is creating or editing the character. | `BUILDER` |
| `builder->decisions->allDecisions->[decision-key]->payload->speed` | string<br>`TRANSIENT` | This builder location identifies the movement mode while the character builder is creating or editing the character. | `BUILDER` |
| `builder->decisions->allDecisions->[decision-key]->payload->spellLevel` | number<br>`TRANSIENT` | This builder location stores the spell-slot level while the character builder is creating or editing the character. | `BUILDER` |
| `builder->decisions->allDecisions->[decision-key]->payload->startingLevel` | number<br>`TRANSIENT` | This builder location stores the starting level for the upcasting rule while the character builder is creating or editing the character. | `BUILDER` |
| `builder->decisions->allDecisions->[decision-key]->payload->subtype` | string<br>`TRANSIENT` | This builder location stores the builder value named `subtype` while the character builder is creating or editing the character. | `BUILDER` |
| `builder->decisions->allDecisions->[decision-key]->payload->subtype->[index]` | string<br>`TRANSIENT` | This builder location stores the builder value named `[index]` while the character builder is creating or editing the character. | `BUILDER` |
| `builder->decisions->allDecisions->[decision-key]->payload->target` | string<br>`TRANSIENT` | This builder location stores the builder value named `target` while the character builder is creating or editing the character. | `BUILDER` |
| `builder->decisions->allDecisions->[decision-key]->payload->type` | string<br>`TRANSIENT` | This builder location identifies the canonical record type while the character builder is creating or editing the character. | `BUILDER` |
| `builder->decisions->allDecisions->[decision-key]->payload->upcastText` | string<br>`TRANSIENT` | This builder location stores the builder value named `upcastText` while the character builder is creating or editing the character. | `BUILDER` |
| `builder->decisions->allDecisions->[decision-key]->payload->value` | number, string<br>`TRANSIENT` | This builder location stores the record's finite current value while the character builder is creating or editing the character. | `BUILDER` |
| `builder->decisions->allDecisions->[decision-key]->payload->valueFormula->ability->add` | boolean<br>`TRANSIENT` | This builder location stores the builder value named `add` while the character builder is creating or editing the character. | `BUILDER` |
| `builder->decisions->allDecisions->[decision-key]->payload->valueFormula->ability->name` | string<br>`TRANSIENT` | This builder location stores the record's primary display name while the character builder is creating or editing the character. | `BUILDER` |
| `builder->decisions->allDecisions->[decision-key]->payload->valueFormula->flatValue` | number<br>`TRANSIENT` | This builder location stores a finite value used as an input by a formula while the character builder is creating or editing the character. | `BUILDER` |
| `builder->decisions->allDecisions->[decision-key]->payload->weaponData->category` | string<br>`TRANSIENT` | Stores the weapon category selected by the builder payload. | `BUILDER` |
| `builder->decisions->allDecisions->[decision-key]->payload->weaponData->training` | string<br>`TRANSIENT` | This builder location stores the builder value named `training` while the character builder is creating or editing the character. | `BUILDER` |
| `builder->decisions->allDecisions->[decision-key]->payload->weaponData->type` | string<br>`TRANSIENT` | This builder location identifies the canonical record type while the character builder is creating or editing the character. | `BUILDER` |
| `builder->decisions->allDecisions->[decision-key]->payload->weight` | number, string<br>`TRANSIENT` | This builder location stores the item weight while the character builder is creating or editing the character. | `BUILDER` |
| `builder->decisions->allDecisions->[decision-key]->recordName` | string<br>`TRANSIENT` | This builder location stores the record's internal identity name while the character builder is creating or editing the character. | `BUILDER` |
| `builder->decisions->allDecisions->[decision-key]->relationshipObject->Arcane Recovery` | string<br>`TRANSIENT` | This builder location stores the builder value named `Arcane Recovery` while the character builder is creating or editing the character. | `BUILDER` |
| `builder->decisions->allDecisions->[decision-key]->relationshipObject->Magic Initiate` | string<br>`TRANSIENT` | This builder location stores the builder value named `Magic Initiate` while the character builder is creating or editing the character. | `BUILDER` |
| `builder->decisions->allDecisions->[decision-key]->relationshipObject->Signature Spell Resource 1` | string<br>`TRANSIENT` | This builder location stores the builder value named `Signature Spell Resource 1` while the character builder is creating or editing the character. | `BUILDER` |
| `builder->decisions->allDecisions->[decision-key]->relationshipObject->Signature Spell Resource 2` | string<br>`TRANSIENT` | This builder location stores the builder value named `Signature Spell Resource 2` while the character builder is creating or editing the character. | `BUILDER` |
| `builder->decisions->allDecisions->[decision-key]->title` | string<br>`TRANSIENT` | This builder location stores the builder value named `title` while the character builder is creating or editing the character. | `BUILDER` |
| `builder->decisions->allDecisions->[decision-key]->visible` | boolean<br>`TRANSIENT` | This builder location stores the builder value named `visible` while the character builder is creating or editing the character. | `BUILDER` |

#### Custom content builder data

> **Value kinds**
>
> - `TRANSIENT` — Builder or user-interface state that is not authoritative live character data.
>
> **Usage**
>
> - `BUILDER` — Use this only for builder inspection or deliberate builder automation, not as finished-character data.

| ScriptCards location | Value | Description | Use |
|---|---|---|---|
| `builder->customBackground->initialDecision->_active` | boolean<br>`TRANSIENT` | This builder location stores whether this record or effect is currently active while the character builder is creating or editing the character. | `BUILDER` |
| `builder->customBackground->initialDecision->_description` | string<br>`TRANSIENT` | This builder location stores the builder value named `_description` while the character builder is creating or editing the character. | `BUILDER` |
| `builder->customBackground->initialDecision->_id` | string<br>`TRANSIENT` | This builder location stores the builder value named `_id` while the character builder is creating or editing the character. | `BUILDER` |
| `builder->customBackground->initialDecision->children` | array<br>`TRANSIENT` | This builder location stores the builder value named `children` while the character builder is creating or editing the character. | `BUILDER` |
| `builder->customBackground->initialDecision->description` | string<br>`TRANSIENT` | This builder location stores the human-readable description while the character builder is creating or editing the character. | `BUILDER` |
| `builder->customBackground->initialDecision->metadata->is2024` | boolean<br>`TRANSIENT` | This builder location stores the builder value named `is2024` while the character builder is creating or editing the character. | `BUILDER` |
| `builder->customBackground->initialDecision->payload->type` | string<br>`TRANSIENT` | This builder location identifies the canonical record type while the character builder is creating or editing the character. | `BUILDER` |
| `builder->customBackground->initialDecision->recordName` | string<br>`TRANSIENT` | This builder location stores the record's internal identity name while the character builder is creating or editing the character. | `BUILDER` |
| `builder->customBackground->initialDecision->visible` | boolean<br>`TRANSIENT` | This builder location stores the builder value named `visible` while the character builder is creating or editing the character. | `BUILDER` |
| `builder->customBackground->options->allDecisions->[decision-key]->_active` | boolean<br>`TRANSIENT` | This builder location stores whether this record or effect is currently active while the character builder is creating or editing the character. | `BUILDER` |
| `builder->customBackground->options->allDecisions->[decision-key]->_description` | string<br>`TRANSIENT` | This builder location stores the builder value named `_description` while the character builder is creating or editing the character. | `BUILDER` |
| `builder->customBackground->options->allDecisions->[decision-key]->_id` | string<br>`TRANSIENT` | This builder location stores the builder value named `_id` while the character builder is creating or editing the character. | `BUILDER` |
| `builder->customBackground->options->allDecisions->[decision-key]->children` | array<br>`TRANSIENT` | This builder location stores the builder value named `children` while the character builder is creating or editing the character. | `BUILDER` |
| `builder->customBackground->options->allDecisions->[decision-key]->description` | string<br>`TRANSIENT` | This builder location stores the human-readable description while the character builder is creating or editing the character. | `BUILDER` |
| `builder->customBackground->options->allDecisions->[decision-key]->metadata->is2024` | boolean<br>`TRANSIENT` | This builder location stores the builder value named `is2024` while the character builder is creating or editing the character. | `BUILDER` |
| `builder->customBackground->options->allDecisions->[decision-key]->payload` | unknown<br>`TRANSIENT` | This builder location stores the builder value named `payload` while the character builder is creating or editing the character. | `BUILDER` |
| `builder->customBackground->options->allDecisions->[decision-key]->payload->type` | string<br>`TRANSIENT` | This builder location identifies the canonical record type while the character builder is creating or editing the character. | `BUILDER` |
| `builder->customBackground->options->allDecisions->[decision-key]->recordName` | string<br>`TRANSIENT` | This builder location stores the record's internal identity name while the character builder is creating or editing the character. | `BUILDER` |
| `builder->customBackground->options->allDecisions->[decision-key]->visible` | boolean<br>`TRANSIENT` | This builder location stores the builder value named `visible` while the character builder is creating or editing the character. | `BUILDER` |
| `builder->customBackground->tempCustomBackground->description` | string<br>`TRANSIENT` | This builder location stores the human-readable description while the character builder is creating or editing the character. | `BUILDER` |
| `builder->customBackground->tempCustomBackground->hasASI` | boolean<br>`TRANSIENT` | This builder location stores the builder value named `hasASI` while the character builder is creating or editing the character. | `BUILDER` |
| `builder->customBackground->tempCustomBackground->hasFeat` | boolean<br>`TRANSIENT` | This builder location stores the builder value named `hasFeat` while the character builder is creating or editing the character. | `BUILDER` |
| `builder->customBackground->tempCustomBackground->metadata->is2024` | boolean<br>`TRANSIENT` | This builder location stores the builder value named `is2024` while the character builder is creating or editing the character. | `BUILDER` |
| `builder->customBackground->tempCustomBackground->name` | string<br>`TRANSIENT` | This builder location stores the record's primary display name while the character builder is creating or editing the character. | `BUILDER` |
| `builder->customClass->initialDecision->_active` | boolean<br>`TRANSIENT` | This builder location stores whether this record or effect is currently active while the character builder is creating or editing the character. | `BUILDER` |
| `builder->customClass->initialDecision->_description` | string<br>`TRANSIENT` | This builder location stores the builder value named `_description` while the character builder is creating or editing the character. | `BUILDER` |
| `builder->customClass->initialDecision->_id` | string<br>`TRANSIENT` | This builder location stores the builder value named `_id` while the character builder is creating or editing the character. | `BUILDER` |
| `builder->customClass->initialDecision->children` | array<br>`TRANSIENT` | This builder location stores the builder value named `children` while the character builder is creating or editing the character. | `BUILDER` |
| `builder->customClass->initialDecision->description` | string<br>`TRANSIENT` | This builder location stores the human-readable description while the character builder is creating or editing the character. | `BUILDER` |
| `builder->customClass->initialDecision->metadata->classLevel` | number<br>`TRANSIENT` | This builder location stores the builder value named `classLevel` while the character builder is creating or editing the character. | `BUILDER` |
| `builder->customClass->initialDecision->metadata->className` | string<br>`TRANSIENT` | This builder location stores the builder value named `className` while the character builder is creating or editing the character. | `BUILDER` |
| `builder->customClass->initialDecision->metadata->subclassDescription` | string<br>`TRANSIENT` | This builder location stores the builder value named `subclassDescription` while the character builder is creating or editing the character. | `BUILDER` |
| `builder->customClass->initialDecision->metadata->subclassLevel` | number<br>`TRANSIENT` | This builder location stores the builder value named `subclassLevel` while the character builder is creating or editing the character. | `BUILDER` |
| `builder->customClass->initialDecision->metadata->subclassName` | string<br>`TRANSIENT` | This builder location stores the builder value named `subclassName` while the character builder is creating or editing the character. | `BUILDER` |
| `builder->customClass->initialDecision->metadata->suggestedAbilities` | array<br>`TRANSIENT` | This builder location stores the builder value named `suggestedAbilities` while the character builder is creating or editing the character. | `BUILDER` |
| `builder->customClass->initialDecision->payload->type` | string<br>`TRANSIENT` | This builder location identifies the canonical record type while the character builder is creating or editing the character. | `BUILDER` |
| `builder->customClass->initialDecision->recordName` | string<br>`TRANSIENT` | This builder location stores the record's internal identity name while the character builder is creating or editing the character. | `BUILDER` |
| `builder->customClass->initialDecision->visible` | boolean<br>`TRANSIENT` | This builder location stores the builder value named `visible` while the character builder is creating or editing the character. | `BUILDER` |
| `builder->customClass->options->allDecisions->[decision-key]->_active` | boolean<br>`TRANSIENT` | This builder location stores whether this record or effect is currently active while the character builder is creating or editing the character. | `BUILDER` |
| `builder->customClass->options->allDecisions->[decision-key]->_description` | string<br>`TRANSIENT` | This builder location stores the builder value named `_description` while the character builder is creating or editing the character. | `BUILDER` |
| `builder->customClass->options->allDecisions->[decision-key]->_id` | string<br>`TRANSIENT` | This builder location stores the builder value named `_id` while the character builder is creating or editing the character. | `BUILDER` |
| `builder->customClass->options->allDecisions->[decision-key]->children` | array<br>`TRANSIENT` | This builder location stores the builder value named `children` while the character builder is creating or editing the character. | `BUILDER` |
| `builder->customClass->options->allDecisions->[decision-key]->description` | string<br>`TRANSIENT` | This builder location stores the human-readable description while the character builder is creating or editing the character. | `BUILDER` |
| `builder->customClass->options->allDecisions->[decision-key]->metadata->classLevel` | number<br>`TRANSIENT` | This builder location stores the builder value named `classLevel` while the character builder is creating or editing the character. | `BUILDER` |
| `builder->customClass->options->allDecisions->[decision-key]->metadata->className` | string<br>`TRANSIENT` | This builder location stores the builder value named `className` while the character builder is creating or editing the character. | `BUILDER` |
| `builder->customClass->options->allDecisions->[decision-key]->metadata->subclassDescription` | string<br>`TRANSIENT` | This builder location stores the builder value named `subclassDescription` while the character builder is creating or editing the character. | `BUILDER` |
| `builder->customClass->options->allDecisions->[decision-key]->metadata->subclassLevel` | number<br>`TRANSIENT` | This builder location stores the builder value named `subclassLevel` while the character builder is creating or editing the character. | `BUILDER` |
| `builder->customClass->options->allDecisions->[decision-key]->metadata->subclassName` | string<br>`TRANSIENT` | This builder location stores the builder value named `subclassName` while the character builder is creating or editing the character. | `BUILDER` |
| `builder->customClass->options->allDecisions->[decision-key]->metadata->suggestedAbilities` | array<br>`TRANSIENT` | This builder location stores the builder value named `suggestedAbilities` while the character builder is creating or editing the character. | `BUILDER` |
| `builder->customClass->options->allDecisions->[decision-key]->payload` | unknown<br>`TRANSIENT` | This builder location stores the builder value named `payload` while the character builder is creating or editing the character. | `BUILDER` |
| `builder->customClass->options->allDecisions->[decision-key]->payload->type` | string<br>`TRANSIENT` | This builder location identifies the canonical record type while the character builder is creating or editing the character. | `BUILDER` |
| `builder->customClass->options->allDecisions->[decision-key]->recordName` | string<br>`TRANSIENT` | This builder location stores the record's internal identity name while the character builder is creating or editing the character. | `BUILDER` |
| `builder->customClass->options->allDecisions->[decision-key]->visible` | boolean<br>`TRANSIENT` | This builder location stores the builder value named `visible` while the character builder is creating or editing the character. | `BUILDER` |
| `builder->customClass->tempCustomClass->hasSpellcasting` | boolean<br>`TRANSIENT` | This builder location stores the builder value named `hasSpellcasting` while the character builder is creating or editing the character. | `BUILDER` |
| `builder->customClass->tempCustomClass->hitDieSize` | number<br>`TRANSIENT` | This builder location stores the builder value named `hitDieSize` while the character builder is creating or editing the character. | `BUILDER` |
| `builder->customClass->tempCustomClass->metadata->className` | string<br>`TRANSIENT` | This builder location stores the builder value named `className` while the character builder is creating or editing the character. | `BUILDER` |
| `builder->customClass->tempCustomClass->metadata->is2024` | boolean<br>`TRANSIENT` | This builder location stores the builder value named `is2024` while the character builder is creating or editing the character. | `BUILDER` |
| `builder->customClass->tempCustomClass->metadata->subclassLevel` | number<br>`TRANSIENT` | This builder location stores the builder value named `subclassLevel` while the character builder is creating or editing the character. | `BUILDER` |
| `builder->customClass->tempCustomClass->name` | string<br>`TRANSIENT` | This builder location stores the record's primary display name while the character builder is creating or editing the character. | `BUILDER` |
| `builder->customClass->tempCustomClass->spellcasting->ability` | string<br>`TRANSIENT` | This builder location identifies the ability used by this record or formula while the character builder is creating or editing the character. | `BUILDER` |
| `builder->customClass->tempCustomClass->spellcasting->casterType` | string<br>`TRANSIENT` | This builder location identifies the spellcasting progression or caster category while the character builder is creating or editing the character. | `BUILDER` |
| `builder->customClass->tempCustomClass->spellcasting->expandedSpells` | array<br>`TRANSIENT` | This builder location stores the builder value named `expandedSpells` while the character builder is creating or editing the character. | `BUILDER` |
| `builder->customClass->tempCustomClass->spellcasting->prepareDaily` | boolean<br>`TRANSIENT` | This builder location stores the builder value named `prepareDaily` while the character builder is creating or editing the character. | `BUILDER` |
| `builder->customClass->tempCustomClass->spellcasting->spellLists` | array<br>`TRANSIENT` | This builder location stores the builder value named `spellLists` while the character builder is creating or editing the character. | `BUILDER` |
| `builder->customSpecies->initialDecision->_active` | boolean<br>`TRANSIENT` | This builder location stores whether this record or effect is currently active while the character builder is creating or editing the character. | `BUILDER` |
| `builder->customSpecies->initialDecision->_description` | string<br>`TRANSIENT` | This builder location stores the builder value named `_description` while the character builder is creating or editing the character. | `BUILDER` |
| `builder->customSpecies->initialDecision->_id` | string<br>`TRANSIENT` | This builder location stores the builder value named `_id` while the character builder is creating or editing the character. | `BUILDER` |
| `builder->customSpecies->initialDecision->children` | array<br>`TRANSIENT` | This builder location stores the builder value named `children` while the character builder is creating or editing the character. | `BUILDER` |
| `builder->customSpecies->initialDecision->description` | string<br>`TRANSIENT` | This builder location stores the human-readable description while the character builder is creating or editing the character. | `BUILDER` |
| `builder->customSpecies->initialDecision->metadata->is2024` | boolean<br>`TRANSIENT` | This builder location stores the builder value named `is2024` while the character builder is creating or editing the character. | `BUILDER` |
| `builder->customSpecies->initialDecision->payload->name` | string<br>`TRANSIENT` | This builder location stores the record's primary display name while the character builder is creating or editing the character. | `BUILDER` |
| `builder->customSpecies->initialDecision->payload->type` | string<br>`TRANSIENT` | This builder location identifies the canonical record type while the character builder is creating or editing the character. | `BUILDER` |
| `builder->customSpecies->initialDecision->recordName` | string<br>`TRANSIENT` | This builder location stores the record's internal identity name while the character builder is creating or editing the character. | `BUILDER` |
| `builder->customSpecies->initialDecision->visible` | boolean<br>`TRANSIENT` | This builder location stores the builder value named `visible` while the character builder is creating or editing the character. | `BUILDER` |
| `builder->customSpecies->options->allDecisions->[decision-key]->_active` | boolean<br>`TRANSIENT` | This builder location stores whether this record or effect is currently active while the character builder is creating or editing the character. | `BUILDER` |
| `builder->customSpecies->options->allDecisions->[decision-key]->_description` | string<br>`TRANSIENT` | This builder location stores the builder value named `_description` while the character builder is creating or editing the character. | `BUILDER` |
| `builder->customSpecies->options->allDecisions->[decision-key]->_id` | string<br>`TRANSIENT` | This builder location stores the builder value named `_id` while the character builder is creating or editing the character. | `BUILDER` |
| `builder->customSpecies->options->allDecisions->[decision-key]->children` | array<br>`TRANSIENT` | This builder location stores the builder value named `children` while the character builder is creating or editing the character. | `BUILDER` |
| `builder->customSpecies->options->allDecisions->[decision-key]->description` | string<br>`TRANSIENT` | This builder location stores the human-readable description while the character builder is creating or editing the character. | `BUILDER` |
| `builder->customSpecies->options->allDecisions->[decision-key]->metadata->is2024` | boolean<br>`TRANSIENT` | This builder location stores the builder value named `is2024` while the character builder is creating or editing the character. | `BUILDER` |
| `builder->customSpecies->options->allDecisions->[decision-key]->payload` | unknown<br>`TRANSIENT` | This builder location stores the builder value named `payload` while the character builder is creating or editing the character. | `BUILDER` |
| `builder->customSpecies->options->allDecisions->[decision-key]->payload->name` | string<br>`TRANSIENT` | This builder location stores the record's primary display name while the character builder is creating or editing the character. | `BUILDER` |
| `builder->customSpecies->options->allDecisions->[decision-key]->payload->type` | string<br>`TRANSIENT` | This builder location identifies the canonical record type while the character builder is creating or editing the character. | `BUILDER` |
| `builder->customSpecies->options->allDecisions->[decision-key]->recordName` | string<br>`TRANSIENT` | This builder location stores the record's internal identity name while the character builder is creating or editing the character. | `BUILDER` |
| `builder->customSpecies->options->allDecisions->[decision-key]->visible` | boolean<br>`TRANSIENT` | This builder location stores the builder value named `visible` while the character builder is creating or editing the character. | `BUILDER` |
| `builder->customSpecies->tempCustomSpecies->hasDarkvision` | boolean<br>`TRANSIENT` | This builder location stores the builder value named `hasDarkvision` while the character builder is creating or editing the character. | `BUILDER` |
| `builder->customSpecies->tempCustomSpecies->hasSubspecies` | boolean<br>`TRANSIENT` | This builder location stores the builder value named `hasSubspecies` while the character builder is creating or editing the character. | `BUILDER` |
| `builder->customSpecies->tempCustomSpecies->metadata->is2024` | boolean<br>`TRANSIENT` | This builder location stores the builder value named `is2024` while the character builder is creating or editing the character. | `BUILDER` |
| `builder->customSpecies->tempCustomSpecies->name` | string<br>`TRANSIENT` | This builder location stores the record's primary display name while the character builder is creating or editing the character. | `BUILDER` |
| `builder->customSpecies->tempCustomSpecies->subspeciesName` | string<br>`TRANSIENT` | This builder location stores the builder value named `subspeciesName` while the character builder is creating or editing the character. | `BUILDER` |
| `builder->customSubclass->initialDecision->_active` | boolean<br>`TRANSIENT` | This builder location stores whether this record or effect is currently active while the character builder is creating or editing the character. | `BUILDER` |
| `builder->customSubclass->initialDecision->_description` | string<br>`TRANSIENT` | This builder location stores the builder value named `_description` while the character builder is creating or editing the character. | `BUILDER` |
| `builder->customSubclass->initialDecision->_id` | string<br>`TRANSIENT` | This builder location stores the builder value named `_id` while the character builder is creating or editing the character. | `BUILDER` |
| `builder->customSubclass->initialDecision->children` | array<br>`TRANSIENT` | This builder location stores the builder value named `children` while the character builder is creating or editing the character. | `BUILDER` |
| `builder->customSubclass->initialDecision->description` | string<br>`TRANSIENT` | This builder location stores the human-readable description while the character builder is creating or editing the character. | `BUILDER` |
| `builder->customSubclass->initialDecision->metadata->classLevel` | number<br>`TRANSIENT` | This builder location stores the builder value named `classLevel` while the character builder is creating or editing the character. | `BUILDER` |
| `builder->customSubclass->initialDecision->metadata->is2024` | boolean<br>`TRANSIENT` | This builder location stores the builder value named `is2024` while the character builder is creating or editing the character. | `BUILDER` |
| `builder->customSubclass->initialDecision->metadata->subclassName` | string<br>`TRANSIENT` | This builder location stores the builder value named `subclassName` while the character builder is creating or editing the character. | `BUILDER` |
| `builder->customSubclass->initialDecision->payload->type` | string<br>`TRANSIENT` | This builder location identifies the canonical record type while the character builder is creating or editing the character. | `BUILDER` |
| `builder->customSubclass->initialDecision->recordName` | string<br>`TRANSIENT` | This builder location stores the record's internal identity name while the character builder is creating or editing the character. | `BUILDER` |
| `builder->customSubclass->initialDecision->visible` | boolean<br>`TRANSIENT` | This builder location stores the builder value named `visible` while the character builder is creating or editing the character. | `BUILDER` |
| `builder->customSubclass->options->allDecisions->[decision-key]->_active` | boolean<br>`TRANSIENT` | This builder location stores whether this record or effect is currently active while the character builder is creating or editing the character. | `BUILDER` |
| `builder->customSubclass->options->allDecisions->[decision-key]->_description` | string<br>`TRANSIENT` | This builder location stores the builder value named `_description` while the character builder is creating or editing the character. | `BUILDER` |
| `builder->customSubclass->options->allDecisions->[decision-key]->_id` | string<br>`TRANSIENT` | This builder location stores the builder value named `_id` while the character builder is creating or editing the character. | `BUILDER` |
| `builder->customSubclass->options->allDecisions->[decision-key]->children` | array<br>`TRANSIENT` | This builder location stores the builder value named `children` while the character builder is creating or editing the character. | `BUILDER` |
| `builder->customSubclass->options->allDecisions->[decision-key]->description` | string<br>`TRANSIENT` | This builder location stores the human-readable description while the character builder is creating or editing the character. | `BUILDER` |
| `builder->customSubclass->options->allDecisions->[decision-key]->metadata->classLevel` | number<br>`TRANSIENT` | This builder location stores the builder value named `classLevel` while the character builder is creating or editing the character. | `BUILDER` |
| `builder->customSubclass->options->allDecisions->[decision-key]->metadata->is2024` | boolean<br>`TRANSIENT` | This builder location stores the builder value named `is2024` while the character builder is creating or editing the character. | `BUILDER` |
| `builder->customSubclass->options->allDecisions->[decision-key]->metadata->subclassName` | string<br>`TRANSIENT` | This builder location stores the builder value named `subclassName` while the character builder is creating or editing the character. | `BUILDER` |
| `builder->customSubclass->options->allDecisions->[decision-key]->payload` | unknown<br>`TRANSIENT` | This builder location stores the builder value named `payload` while the character builder is creating or editing the character. | `BUILDER` |
| `builder->customSubclass->options->allDecisions->[decision-key]->payload->type` | string<br>`TRANSIENT` | This builder location identifies the canonical record type while the character builder is creating or editing the character. | `BUILDER` |
| `builder->customSubclass->options->allDecisions->[decision-key]->recordName` | string<br>`TRANSIENT` | This builder location stores the record's internal identity name while the character builder is creating or editing the character. | `BUILDER` |
| `builder->customSubclass->options->allDecisions->[decision-key]->visible` | boolean<br>`TRANSIENT` | This builder location stores the builder value named `visible` while the character builder is creating or editing the character. | `BUILDER` |
| `builder->customSubclass->tempCustomSubclass->description` | string<br>`TRANSIENT` | This builder location stores the human-readable description while the character builder is creating or editing the character. | `BUILDER` |
| `builder->customSubclass->tempCustomSubclass->hasSpellcasting` | boolean<br>`TRANSIENT` | This builder location stores the builder value named `hasSpellcasting` while the character builder is creating or editing the character. | `BUILDER` |
| `builder->customSubclass->tempCustomSubclass->metadata->is2024` | boolean<br>`TRANSIENT` | This builder location stores the builder value named `is2024` while the character builder is creating or editing the character. | `BUILDER` |
| `builder->customSubclass->tempCustomSubclass->name` | string<br>`TRANSIENT` | This builder location stores the record's primary display name while the character builder is creating or editing the character. | `BUILDER` |
| `builder->customSubclass->tempCustomSubclass->spellcasting->ability` | string<br>`TRANSIENT` | This builder location identifies the ability used by this record or formula while the character builder is creating or editing the character. | `BUILDER` |
| `builder->customSubclass->tempCustomSubclass->spellcasting->casterType` | string<br>`TRANSIENT` | This builder location identifies the spellcasting progression or caster category while the character builder is creating or editing the character. | `BUILDER` |
| `builder->customSubclass->tempCustomSubclass->spellcasting->expandedSpells` | array<br>`TRANSIENT` | This builder location stores the builder value named `expandedSpells` while the character builder is creating or editing the character. | `BUILDER` |
| `builder->customSubclass->tempCustomSubclass->spellcasting->prepareDaily` | boolean<br>`TRANSIENT` | This builder location stores the builder value named `prepareDaily` while the character builder is creating or editing the character. | `BUILDER` |
| `builder->customSubclass->tempCustomSubclass->spellcasting->spellLists` | array<br>`TRANSIENT` | This builder location stores the builder value named `spellLists` while the character builder is creating or editing the character. | `BUILDER` |

#### Builder lists and ordering

> **Value kinds**
>
> - `TRANSIENT` — Builder or user-interface state that is not authoritative live character data.
>
> **Usage**
>
> - `BUILDER` — Use this only for builder inspection or deliberate builder automation, not as finished-character data.

| ScriptCards location | Value | Description | Use |
|---|---|---|---|
| `builder->lists->localLists->[list-key]->_id` | string<br>`TRANSIENT` | This builder location stores the builder value named `_id` while the character builder is creating or editing the character. | `BUILDER` |
| `builder->lists->localLists->[list-key]->name` | string<br>`TRANSIENT` | This builder location stores the record's primary display name while the character builder is creating or editing the character. | `BUILDER` |
| `builder->lists->localLists->[list-key]->optionsString->[index]->[index]->_active` | boolean<br>`TRANSIENT` | This builder location stores whether this record or effect is currently active while the character builder is creating or editing the character. | `BUILDER` |
| `builder->lists->localLists->[list-key]->optionsString->[index]->[index]->_id` | string<br>`TRANSIENT` | This builder location stores the builder value named `_id` while the character builder is creating or editing the character. | `BUILDER` |
| `builder->lists->localLists->[list-key]->optionsString->[index]->[index]->children` | array<br>`TRANSIENT` | This builder location stores the builder value named `children` while the character builder is creating or editing the character. | `BUILDER` |
| `builder->lists->localLists->[list-key]->optionsString->[index]->[index]->concat` | object<br>`TRANSIENT` | This builder location stores the builder value named `concat` while the character builder is creating or editing the character. | `BUILDER` |
| `builder->lists->localLists->[list-key]->optionsString->[index]->[index]->metadata->book->bundles` | array<br>`TRANSIENT` | This builder location stores the builder value named `bundles` while the character builder is creating or editing the character. | `BUILDER` |
| `builder->lists->localLists->[list-key]->optionsString->[index]->[index]->metadata->book->cost` | number<br>`TRANSIENT` | This builder location stores the builder value named `cost` while the character builder is creating or editing the character. | `BUILDER` |
| `builder->lists->localLists->[list-key]->optionsString->[index]->[index]->metadata->book->coverImage` | string<br>`TRANSIENT` | This builder location stores the builder value named `coverImage` while the character builder is creating or editing the character. | `BUILDER` |
| `builder->lists->localLists->[list-key]->optionsString->[index]->[index]->metadata->book->isOwned` | boolean<br>`TRANSIENT` | This builder location stores the builder value named `isOwned` while the character builder is creating or editing the character. | `BUILDER` |
| `builder->lists->localLists->[list-key]->optionsString->[index]->[index]->metadata->book->itemId` | number<br>`TRANSIENT` | This builder location stores the builder value named `itemId` while the character builder is creating or editing the character. | `BUILDER` |
| `builder->lists->localLists->[list-key]->optionsString->[index]->[index]->metadata->book->marketplaceLink` | object<br>`TRANSIENT` | This builder location stores the builder value named `marketplaceLink` while the character builder is creating or editing the character. | `BUILDER` |
| `builder->lists->localLists->[list-key]->optionsString->[index]->[index]->metadata->book->name` | string<br>`TRANSIENT` | This builder location stores the record's primary display name while the character builder is creating or editing the character. | `BUILDER` |
| `builder->lists->localLists->[list-key]->optionsString->[index]->[index]->metadata->book->notForSale` | boolean<br>`TRANSIENT` | This builder location stores the builder value named `notForSale` while the character builder is creating or editing the character. | `BUILDER` |
| `builder->lists->localLists->[list-key]->optionsString->[index]->[index]->metadata->book->systemVersion` | number<br>`TRANSIENT` | This builder location stores the builder value named `systemVersion` while the character builder is creating or editing the character. | `BUILDER` |
| `builder->lists->localLists->[list-key]->optionsString->[index]->[index]->metadata->builderDisplayName` | string<br>`TRANSIENT` | This builder location stores the label shown by the character builder while the character builder is creating or editing the character. | `BUILDER` |
| `builder->lists->localLists->[list-key]->optionsString->[index]->[index]->metadata->cameFromFeat` | boolean<br>`TRANSIENT` | This builder location stores the builder value named `cameFromFeat` while the character builder is creating or editing the character. | `BUILDER` |
| `builder->lists->localLists->[list-key]->optionsString->[index]->[index]->metadata->level` | number<br>`TRANSIENT` | This builder location stores a class, spell, slot, or upcasting level while the character builder is creating or editing the character. | `BUILDER` |
| `builder->lists->localLists->[list-key]->optionsString->[index]->[index]->metadata->publisherIcon` | string<br>`TRANSIENT` | This builder location stores the builder value named `publisherIcon` while the character builder is creating or editing the character. | `BUILDER` |
| `builder->lists->localLists->[list-key]->optionsString->[index]->[index]->modifications` | object<br>`TRANSIENT` | This builder location stores the builder value named `modifications` while the character builder is creating or editing the character. | `BUILDER` |
| `builder->lists->localLists->[list-key]->optionsString->[index]->[index]->payload->ability` | string<br>`TRANSIENT` | This builder location identifies the ability used by this record or formula while the character builder is creating or editing the character. | `BUILDER` |
| `builder->lists->localLists->[list-key]->optionsString->[index]->[index]->payload->builderDisplayName` | string<br>`TRANSIENT` | This builder location stores the label shown by the character builder while the character builder is creating or editing the character. | `BUILDER` |
| `builder->lists->localLists->[list-key]->optionsString->[index]->[index]->payload->casterType` | string<br>`TRANSIENT` | This builder location identifies the spellcasting progression or caster category while the character builder is creating or editing the character. | `BUILDER` |
| `builder->lists->localLists->[list-key]->optionsString->[index]->[index]->payload->compendiumPageID` | string<br>`TRANSIENT` | This builder location stores the Roll20 Compendium page identifier while the character builder is creating or editing the character. | `BUILDER` |
| `builder->lists->localLists->[list-key]->optionsString->[index]->[index]->payload->name` | string<br>`TRANSIENT` | This builder location stores the record's primary display name while the character builder is creating or editing the character. | `BUILDER` |
| `builder->lists->localLists->[list-key]->optionsString->[index]->[index]->payload->recordName` | string<br>`TRANSIENT` | This builder location stores the record's internal identity name while the character builder is creating or editing the character. | `BUILDER` |
| `builder->lists->localLists->[list-key]->optionsString->[index]->[index]->payload->sizeValue` | string<br>`TRANSIENT` | This builder location stores the canonical creature-size value while the character builder is creating or editing the character. | `BUILDER` |
| `builder->lists->localLists->[list-key]->optionsString->[index]->[index]->payload->type` | string<br>`TRANSIENT` | This builder location identifies the canonical record type while the character builder is creating or editing the character. | `BUILDER` |
| `builder->lists->localLists->[list-key]->optionsString->[index]->[index]->recordName` | string<br>`TRANSIENT` | This builder location stores the record's internal identity name while the character builder is creating or editing the character. | `BUILDER` |
| `builder->lists->localLists->[list-key]->optionsString->[index]->[index]->relationshipObject` | object<br>`TRANSIENT` | This builder location stores the builder value named `relationshipObject` while the character builder is creating or editing the character. | `BUILDER` |
| `builder->lists->localLists->[list-key]->optionsString->[index]->[index]->title` | string<br>`TRANSIENT` | This builder location stores the builder value named `title` while the character builder is creating or editing the character. | `BUILDER` |
| `builder->lists->localLists->[list-key]->optionsString->[index]->[index]->visible` | boolean<br>`TRANSIENT` | This builder location stores the builder value named `visible` while the character builder is creating or editing the character. | `BUILDER` |

---

## Master legend

### Value kinds

| Code | Meaning |
|---|---|
| `STORED` | A value or field stored directly at this location; it may be primitive or a container. |
| `INPUT` | A stored input used by the sheet to calculate another value. |
| `COMPUTED` | A read-only result calculated, aggregated, translated, or assembled from other Beacon data rather than independently stored. Change its input or backing record instead. |
| `ORDER` | Stored ordering or index data containing positions or canonical record keys. |
| `TRANSIENT` | Builder or user-interface state that is not authoritative live character data. |
| `MIXED` | A root or container holding more than one kind of data. |
| `UNKNOWN` | The backing source or calculation has not been verified. |

### Usage codes

| Code | Meaning |
|---|---|
| `NATIVE` | The public `name` is verified writable and may be used directly in `--!c`. |
| `RAW` | Use the exact `sheet` path to read or deliberately change this existing primitive value. |
| `READ` | Read this for display, branching, or diagnostics; do not normally write it. |
| `INPUT` | Change this stored input when you want the sheet to recalculate the final result. |
| `COMPUTED` | Read the exposed result only. Never pass a computed alias to `--!c`; change the documented stored value, input, or backing record. |
| `FIND` | Use the typed collection to locate and read the intended canonical record. |
| `RECORD` | After locating the record, use its exact `[record-key]` raw path for a deliberate field edit. |
| `TOGGLE` | Change this state only on the exact existing record or setting you intend to toggle. |
| `ORDER` | Preserve valid existing record keys and change this only when intentionally reordering them. |
| `GRAPH` | Use this to traverse record relationships; write only with valid keys and a full understanding of the graph. |
| `IDENTITY` | Treat this as record identity metadata and do not normally change it. |
| `SETTING` | Read this to respect the user's sheet setting; write only when intentionally changing that setting. |
| `BUILDER` | Use this only for builder inspection or deliberate builder automation, not as finished-character data. |
| `ALIAS` | Use this public native/legacy attribute for convenient ScriptCards access in new or adapted scripts. For writes, use the alias only when it is verified as writable; otherwise use the documented backing location or calculation input. |
| `SYNTH` | Use this for compatibility reads or sheet-button logic; edit the parent canonical record instead. |
| `UNMAPPED` | Treat this as read-only until its backing source or calculation is verified. |

Most rows use only these reusable codes. A row adds a short note after the codes when its alias, identity, container shape, or write risk needs field-specific guidance.

### Write-target codes

| Code | Meaning |
|---|---|
| `NATIVE` | The public `name` is on the verified writable list and may be used directly in `--!c`. |
| `RAW` | No writable alias is relied on; write the exact existing primitive `sheet` leaf shown. |
| `INPUT` | The location stores an input used by a sheet calculation. It can be changed deliberately, then the final public value should be reread. |
| `COMPUTED` | The public value is calculated, aggregated, translated, or assembled from other data. Never write that alias; change the listed stored value, input, or backing record. |
| `SYNTH` | The public value is a legacy or repeating-row projection assembled from canonical records. Edit the parent canonical record instead. |
| `UNMAPPED` | No verified write target exists in this reference. Treat the alias as read-only. |
