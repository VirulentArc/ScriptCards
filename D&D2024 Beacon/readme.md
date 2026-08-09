# D&D 2024 Beacon Sheet — ScriptCards Location Reference

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
- `speeds` contains the character's Speed records.
- `spells` contains the character's Spell records.

A typed collection may also be read without selecting a particular record. For example:

```scard
[*S:speeds]
```

On the tested Goblin Minion, this returns one string:

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

#### Superseded canonical records

Some Beacon progression features leave earlier records in `store.current` after a later record replaces them. The earlier record can remain `_enabled: true`; its replacement relationship is identified by `overwrittenBy`.

ScriptCards treats a record as superseded when:

1. the record has an `overwrittenBy` value;
2. that value identifies another record in the same typed collection; and
3. the replacement record is present and not explicitly disabled.

The superseded record is excluded from typed-collection selection, enumeration, and formatting. It remains visible through the raw `sheet->integrants->integrants->[record-key]` path for diagnostics.

This is especially important for progressive Spell Slot records. At Warlock 2, the tested character retained an earlier Pact record with a value of `1`, but that record was marked as overwritten by the current Pact record with a value of `2`. These values are alternatives in a progression chain and must **not** be added together.

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
- In Beacon mode, an unprefixed read first uses an exact local structured, typed-collection, or sheet-specific compatibility route when available. Recognized bare D&D typed collections are resolved locally before native sheet-item routing. Remaining names may use the native/translated sheet-item route, followed by an exact classic Attribute and then an existing `user.*` custom field for a bare unresolved name.
- Use `--!c` for Beacon direct aliases, fixed structured paths, and typed canonical paths.
- Use `--!a` for existing native sheet items, repeating compatibility fields, and `user.*` custom fields. Prefix a custom name with `!` to create it, for example `--!a:[&CharacterID]|!user.MyField:VALUE`.
- Copy documented names exactly. Some names preserve Roll20 spellings, including `aboutTabApperancesDisplayOrder`, `encumberance`, and `simpleproficencies`.
- The ordinary movement record is internally named `Walk`. The direct alias is `speed`; special movement records use `Burrow`, `Climb`, `Fly`, and `Swim`.

## Leaf values and value domains

A ScriptCards location is not complete documentation by itself. For a location to be usable, the reference must also say **what value lives at the final leaf and what that value means**.

The tables below therefore include a **Values / format** column. Treat that column as part of the location reference, especially before writing a Beacon value.

### How to read the Values / format column

- **Boolean leaves** are stored as `true` or `false`. For existing boolean structured/typed leaves, ScriptCards also accepts `1`/`0`, `yes`/`no`, and `on`/`off` when writing and converts them to a real boolean.
- **Enums and state strings** list the exact values observed or verified by the controlled sheet work. Copy those literals as written. If the complete allowed set was not established, the row says **observed** rather than pretending the list is exhaustive.
- **Numbers** are documented with their meaning where it is known. A number being writable does not imply an arbitrary range is safe.
- **Text** is identified as free text or a formatted sheet string. Blank text may be a legitimate stored value.
- **IDs and relationship values** identify what kind of Beacon identity is expected (`shortID`, canonical parent/child identity, source identity, and so on). Do not manufacture IDs.
- **Arrays and objects** are containers, not primitive write values. Traverse to a documented child or existing array element before writing; do not replace a canonical container merely because it is readable.
- **Compatibility outputs** sometimes preserve legacy 2014-style names whose exact returned representation was never independently probed. Those rows are explicitly marked **not independently verified** instead of guessing whether the result is a number, string, checkbox value, or other legacy shape.

### Example: a condition toggle

The complete usable location for Poisoned is not just `conditions->Poisoned->_active`. Its leaf contract is:

```text
Location: conditions->Poisoned->_active
Type:     boolean
Values:   true  = Poisoned active
          false = Poisoned inactive
```

So an existing Poisoned record can be toggled with:

```scard
--!c:[&CharacterID]|conditions->Poisoned->_active:true
--!c:[&CharacterID]|conditions->Poisoned->_active:false
```

`_enabled` is a different boolean. It controls whether the canonical record participates in the live character model; it is **not** the on/off state of a Condition.

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

| Direct alias | ScriptCards read location | Value role | Values / format | Description | Write using |
|---|---|---|---|---|---|
| `ac` | Direct alias: `ac`<br>Typed collection: `armorclasses` | `INPUT` | Number — use a numeric value. The meaningful range depends on the field; no additional range is implied unless stated here. | `ac` is a finite Armor Class input. | `Direct alias` |
| `deathsave_fail1` | Direct alias: `deathsave_fail1`<br>Structured path: `sheet->hitpoints->deathSaves->failures` | `STORED` | Death-save checkbox compatibility state. The backing structured state is a count from `0` to `3`; the exact direct-alias checkbox representation was not independently probed. | `deathsave_fail1` is the finite first-failure state. | `Direct alias` |
| `deathsave_fail2` | Direct alias: `deathsave_fail2`<br>Structured path: `sheet->hitpoints->deathSaves->failures` | `STORED` | Death-save checkbox compatibility state. The backing structured state is a count from `0` to `3`; the exact direct-alias checkbox representation was not independently probed. | `deathsave_fail2` is the finite second-failure state. | `Direct alias` |
| `deathsave_fail3` | Direct alias: `deathsave_fail3`<br>Structured path: `sheet->hitpoints->deathSaves->failures` | `STORED` | Death-save checkbox compatibility state. The backing structured state is a count from `0` to `3`; the exact direct-alias checkbox representation was not independently probed. | `deathsave_fail3` is the finite third-failure state. | `Direct alias` |
| `deathsave_succ1` | Direct alias: `deathsave_succ1`<br>Structured path: `sheet->hitpoints->deathSaves->successes` | `STORED` | Death-save checkbox compatibility state. The backing structured state is a count from `0` to `3`; the exact direct-alias checkbox representation was not independently probed. | `deathsave_succ1` is the finite first-success state. | `Direct alias` |
| `deathsave_succ2` | Direct alias: `deathsave_succ2`<br>Structured path: `sheet->hitpoints->deathSaves->successes` | `STORED` | Death-save checkbox compatibility state. The backing structured state is a count from `0` to `3`; the exact direct-alias checkbox representation was not independently probed. | `deathsave_succ2` is the finite second-success state. | `Direct alias` |
| `deathsave_succ3` | Direct alias: `deathsave_succ3`<br>Structured path: `sheet->hitpoints->deathSaves->successes` | `STORED` | Death-save checkbox compatibility state. The backing structured state is a count from `0` to `3`; the exact direct-alias checkbox representation was not independently probed. | `deathsave_succ3` is the finite third-success state. | `Direct alias` |
| `hit_dice` | Direct alias: `hit_dice`<br>Typed collection: `hitdices` | `STORED` | Number — use a numeric value. The meaningful range depends on the field; no additional range is implied unless stated here. | `hit_dice` is a finite Hit Dice value. | `Direct alias` |
| `hp` | Direct alias: `hp`<br>Structured path: `sheet->hitpoints->currentHP` | `STORED` | Number — use a numeric value. The meaningful range depends on the field; no additional range is implied unless stated here. | `hp` reads a finite value stored at the structured ScriptCards location shown in the location column. | `Direct alias` |
| `hp_max` | Direct alias: `hp_max`<br>Typed collection: `hitpoints` | `INPUT` | Number — use a numeric value. The meaningful range depends on the field; no additional range is implied unless stated here. | `hp_max` is a finite maximum-HP input. | `Direct alias` |
| `hp_temp` | Direct alias: `hp_temp`<br>Structured path: `sheet->hitpoints->tempHP` | `STORED` | Number — use a numeric value. The meaningful range depends on the field; no additional range is implied unless stated here. | `hp_temp` reads a finite value stored at the structured ScriptCards location shown in the location column. | `Direct alias` |
| `init_tiebreaker` | Direct alias: `init_tiebreaker`<br>Structured path: `sheet->settings->addDexTiebreaker` | `STORED` | Boolean backing setting `sheet->settings->addDexTiebreaker`: `true` = Dexterity tiebreaker enabled; `false` = disabled. | `init_tiebreaker` reads a finite value stored at the structured ScriptCards location shown in the location column. | `Structured path` |
| `initiative_style` | Direct alias: `initiative_style`<br>Structured path: `sheet->settings->rolls->mode` | `STORED` | Roll-mode string backed by `sheet->settings->rolls->mode`. Controlled writes observed `Advantage` and `Disadvantage`; other sheet modes were not exhaustively enumerated. | `initiative_style` reads a finite value stored at the structured ScriptCards location shown in the location column. | `Structured path` — Compatibility view of `sheet->settings->rolls->mode`; use the `Structured path:` setting for new sheet-equivalent logic. |
| `speed` | Direct alias: `speed`<br>Typed collection: `speeds`<br>Match: `speed = Walk` | `INPUT` | Number — use a numeric value. The meaningful range depends on the field; no additional range is implied unless stated here. | `speed` is the finite Speed input. | `Direct alias` |

#### Ability scores

> **Value roles**
>
> - `INPUT` — An editable input used by the sheet or by a typed record.
>
> **Write using**
>
> - `Direct alias` — Write the name in the first column directly with `--!c`.

| Direct alias | ScriptCards read location | Value role | Values / format | Description | Write using |
|---|---|---|---|---|---|
| `charisma` | Direct alias: `charisma`<br>Typed collection: `abilityscores`<br>Match: `ability = Charisma` | `INPUT` | Integer ability-score input. Ordinary D&D scores are numeric; no additional range is enforced/documented here. | `charisma` is a finite ability-score input. | `Direct alias` |
| `constitution` | Direct alias: `constitution`<br>Typed collection: `abilityscores`<br>Match: `ability = Constitution` | `INPUT` | Integer ability-score input. Ordinary D&D scores are numeric; no additional range is enforced/documented here. | `constitution` is a finite ability-score input. | `Direct alias` |
| `dexterity` | Direct alias: `dexterity`<br>Typed collection: `abilityscores`<br>Match: `ability = Dexterity` | `INPUT` | Integer ability-score input. Ordinary D&D scores are numeric; no additional range is enforced/documented here. | `dexterity` is a finite ability-score input. | `Direct alias` |
| `intelligence` | Direct alias: `intelligence`<br>Typed collection: `abilityscores`<br>Match: `ability = Intelligence` | `INPUT` | Integer ability-score input. Ordinary D&D scores are numeric; no additional range is enforced/documented here. | `intelligence` is a finite ability-score input. | `Direct alias` |
| `strength` | Direct alias: `strength`<br>Typed collection: `abilityscores`<br>Match: `ability = Strength` | `INPUT` | Integer ability-score input. Ordinary D&D scores are numeric; no additional range is enforced/documented here. | `strength` is a finite ability-score input. | `Direct alias` |
| `wisdom` | Direct alias: `wisdom`<br>Typed collection: `abilityscores`<br>Match: `ability = Wisdom` | `INPUT` | Integer ability-score input. Ordinary D&D scores are numeric; no additional range is enforced/documented here. | `wisdom` is a finite ability-score input. | `Direct alias` |

#### Spellcasting and spell slots

> **Value roles**
>
> - `STORED` — A finite value or state stored by the sheet.
> - `INPUT` — An editable input used by the sheet or by a typed record.
>
> **Write using**
>
> - `Direct alias` — Write the name in the first column directly with `--!c`.

| Direct alias | ScriptCards read location | Value role | Values / format | Description | Write using |
|---|---|---|---|---|---|
| `lvl1_slots_expended` | Direct alias: `lvl1_slots_expended`<br>Structured path: `sheet->spellSlots->currentByLevel->FIRST` | `STORED` | Numeric level-1 normal-slot compatibility state, but native setter semantics are **not** the same as the remaining-slot counter. For remaining slots use `sheet->spellSlots->currentByLevel->FIRST`. | `lvl1_slots_expended` is the remaining normal level-1 slot state. | `Direct alias` |
| `lvl1_slots_total` | Direct alias: `lvl1_slots_total`<br>Typed collection: `spellslots`<br>Match: `spellLevel = 1` and the normal `_slotType` | `INPUT` | Nonnegative numeric slot-capacity input for normal level-1 spell slots. Pact capacity is a separate canonical Spell Slot record family. | `lvl1_slots_total` is a finite slot-capacity input. | `Direct alias` |
| `lvl2_slots_expended` | Direct alias: `lvl2_slots_expended`<br>Structured path: `sheet->spellSlots->currentByLevel->SECOND` | `STORED` | Numeric level-2 normal-slot compatibility state, but native setter semantics are **not** the same as the remaining-slot counter. For remaining slots use `sheet->spellSlots->currentByLevel->SECOND`. | `lvl2_slots_expended` is the remaining normal level-2 slot state. | `Direct alias` |
| `lvl2_slots_total` | Direct alias: `lvl2_slots_total`<br>Typed collection: `spellslots`<br>Match: `spellLevel = 2` and the normal `_slotType` | `INPUT` | Nonnegative numeric slot-capacity input for normal level-2 spell slots. Pact capacity is a separate canonical Spell Slot record family. | `lvl2_slots_total` is a finite slot-capacity input. | `Direct alias` |
| `lvl3_slots_expended` | Direct alias: `lvl3_slots_expended`<br>Structured path: `sheet->spellSlots->currentByLevel->THIRD` | `STORED` | Numeric level-3 normal-slot compatibility state, but native setter semantics are **not** the same as the remaining-slot counter. For remaining slots use `sheet->spellSlots->currentByLevel->THIRD`. | `lvl3_slots_expended` is the remaining normal level-3 slot state. | `Direct alias` |
| `lvl3_slots_total` | Direct alias: `lvl3_slots_total`<br>Typed collection: `spellslots`<br>Match: `spellLevel = 3` and the normal `_slotType` | `INPUT` | Nonnegative numeric slot-capacity input for normal level-3 spell slots. Pact capacity is a separate canonical Spell Slot record family. | `lvl3_slots_total` is a finite slot-capacity input. | `Direct alias` |
| `lvl4_slots_expended` | Direct alias: `lvl4_slots_expended`<br>Structured path: `sheet->spellSlots->currentByLevel->FOURTH` | `STORED` | Numeric level-4 normal-slot compatibility state, but native setter semantics are **not** the same as the remaining-slot counter. For remaining slots use `sheet->spellSlots->currentByLevel->FOURTH`. | `lvl4_slots_expended` is the remaining normal level-4 slot state. | `Direct alias` |
| `lvl4_slots_total` | Direct alias: `lvl4_slots_total`<br>Typed collection: `spellslots`<br>Match: `spellLevel = 4` and the normal `_slotType` | `INPUT` | Nonnegative numeric slot-capacity input for normal level-4 spell slots. Pact capacity is a separate canonical Spell Slot record family. | `lvl4_slots_total` is a finite slot-capacity input. | `Direct alias` |
| `lvl5_slots_expended` | Direct alias: `lvl5_slots_expended`<br>Structured path: `sheet->spellSlots->currentByLevel->FIFTH` | `STORED` | Numeric level-5 normal-slot compatibility state, but native setter semantics are **not** the same as the remaining-slot counter. For remaining slots use `sheet->spellSlots->currentByLevel->FIFTH`. | `lvl5_slots_expended` is the remaining normal level-5 slot state. | `Direct alias` |
| `lvl5_slots_total` | Direct alias: `lvl5_slots_total`<br>Typed collection: `spellslots`<br>Match: `spellLevel = 5` and the normal `_slotType` | `INPUT` | Nonnegative numeric slot-capacity input for normal level-5 spell slots. Pact capacity is a separate canonical Spell Slot record family. | `lvl5_slots_total` is a finite slot-capacity input. | `Direct alias` |
| `lvl6_slots_expended` | Direct alias: `lvl6_slots_expended`<br>Structured path: `sheet->spellSlots->currentByLevel->SIXTH` | `STORED` | Numeric level-6 normal-slot compatibility state, but native setter semantics are **not** the same as the remaining-slot counter. For remaining slots use `sheet->spellSlots->currentByLevel->SIXTH`. | `lvl6_slots_expended` is the remaining normal level-6 slot state. | `Direct alias` |
| `lvl6_slots_total` | Direct alias: `lvl6_slots_total`<br>Typed collection: `spellslots`<br>Match: `spellLevel = 6` and the normal `_slotType` | `INPUT` | Nonnegative numeric slot-capacity input for normal level-6 spell slots. Pact capacity is a separate canonical Spell Slot record family. | `lvl6_slots_total` is a finite slot-capacity input. | `Direct alias` |
| `lvl7_slots_expended` | Direct alias: `lvl7_slots_expended`<br>Structured path: `sheet->spellSlots->currentByLevel->SEVENTH` | `STORED` | Numeric level-7 normal-slot compatibility state, but native setter semantics are **not** the same as the remaining-slot counter. For remaining slots use `sheet->spellSlots->currentByLevel->SEVENTH`. | `lvl7_slots_expended` is the remaining normal level-7 slot state. | `Direct alias` |
| `lvl7_slots_total` | Direct alias: `lvl7_slots_total`<br>Typed collection: `spellslots`<br>Match: `spellLevel = 7` and the normal `_slotType` | `INPUT` | Nonnegative numeric slot-capacity input for normal level-7 spell slots. Pact capacity is a separate canonical Spell Slot record family. | `lvl7_slots_total` is a finite slot-capacity input. | `Direct alias` |
| `lvl8_slots_expended` | Direct alias: `lvl8_slots_expended`<br>Structured path: `sheet->spellSlots->currentByLevel->EIGHTH` | `STORED` | Numeric level-8 normal-slot compatibility state, but native setter semantics are **not** the same as the remaining-slot counter. For remaining slots use `sheet->spellSlots->currentByLevel->EIGHTH`. | `lvl8_slots_expended` is the remaining normal level-8 slot state. | `Direct alias` |
| `lvl8_slots_total` | Direct alias: `lvl8_slots_total`<br>Typed collection: `spellslots`<br>Match: `spellLevel = 8` and the normal `_slotType` | `INPUT` | Nonnegative numeric slot-capacity input for normal level-8 spell slots. Pact capacity is a separate canonical Spell Slot record family. | `lvl8_slots_total` is a finite slot-capacity input. | `Direct alias` |
| `lvl9_slots_expended` | Direct alias: `lvl9_slots_expended`<br>Structured path: `sheet->spellSlots->currentByLevel->NINTH` | `STORED` | Numeric level-9 normal-slot compatibility state, but native setter semantics are **not** the same as the remaining-slot counter. For remaining slots use `sheet->spellSlots->currentByLevel->NINTH`. | `lvl9_slots_expended` is the remaining normal level-9 slot state. | `Direct alias` |
| `lvl9_slots_total` | Direct alias: `lvl9_slots_total`<br>Typed collection: `spellslots`<br>Match: `spellLevel = 9` and the normal `_slotType` | `INPUT` | Nonnegative numeric slot-capacity input for normal level-9 spell slots. Pact capacity is a separate canonical Spell Slot record family. | `lvl9_slots_total` is a finite slot-capacity input. | `Direct alias` |

##### Normal and Pact slot pools

The `lvl1_slots_expended` through `lvl9_slots_expended` direct aliases address only the normal slot pool under `sheet->spellSlots->currentByLevel`. Despite the historical `slots_expended` name, ScriptCards treats these aliases as the **remaining/available normal-slot count**. They do not read or write Pact Magic slots.

In `.131`, reads and writes use the same `currentByLevel` value. A live level-2 test showed that sending the locally read remaining-slot value back through Roll20's native `setSheetItem()` translation could invert the intended result: writing `0` caused a 3-slot character to return to `3/3` available slots. ScriptCards therefore routes these nine compatibility-alias writes directly to their verified `currentByLevel` structured leaves. The public ScriptCards syntax remains unchanged:

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

Normal and Pact slots can exist at the same spell level and must be tracked independently. On the tested Paladin 3 / Warlock 2 character, `currentByLevel->FIRST` was `3` while `currentPactByLevel->FIRST` was `2`; changing either value left the other unchanged.

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

| Direct alias | ScriptCards read location | Value role | Values / format | Description | Write using |
|---|---|---|---|---|---|
| `npc_challenge` | Direct alias: `npc_challenge`<br>Structured path: `sheet->npc->challengeRating` | `STORED` | Text/string — content is record-specific; blank may be meaningful. | `npc_challenge` reads a finite value stored at the structured ScriptCards location shown in the location column. | `Structured path` |
| `npc_hpformula` | Direct alias: `npc_hpformula`<br>Structured path: `sheet->npc->rollHP` | `STORED` | Text/string — content is record-specific; blank may be meaningful. | `npc_hpformula` reads a finite value stored at the structured ScriptCards location shown in the location column. | `Structured path` |
| `npc_legendary_actions` | Direct alias: `npc_legendary_actions`<br>Structured path: `sheet->npc->legendaryActionCompendiumNum` | `STORED` | Number — use a numeric value. The meaningful range depends on the field; no additional range is implied unless stated here. | `npc_legendary_actions` reads a finite value stored at the structured ScriptCards location shown in the location column. | `Structured path` |
| `npc_legendary_actions_desc` | Direct alias: `npc_legendary_actions_desc`<br>Structured path: `sheet->npc->legendaryActionSummary` | `STORED` | Text/string — content is record-specific; blank may be meaningful. | `npc_legendary_actions_desc` reads a finite value stored at the structured ScriptCards location shown in the location column. | `Structured path` |
| `npc_speed` | Direct alias: `npc_speed`<br>Typed collection: `speeds`<br>Match: `speed = Walk` | `INPUT` | Number — use a numeric value. The meaningful range depends on the field; no additional range is implied unless stated here. | `npc_speed` is the finite NPC-compatible Speed input. | `Direct alias` |

#### Identity, progression, and biography

> **Value roles**
>
> - `STORED` — A finite value or state stored by the sheet.
>
> **Write using**
>
> - `Direct alias` — Write the name in the first column directly with `--!c`.

| Direct alias | ScriptCards read location | Value role | Values / format | Description | Write using |
|---|---|---|---|---|---|
| `age` | Direct alias: `age` | `STORED` | Stored age value; may be numeric-form or text depending on what the sheet contains. The exact native scalar type was not independently isolated. | `age` is a writable direct alias for the character’s age. The current probes did not identify a stable structured `sheet` location. | `Direct alias` |
| `alignment` | Direct alias: `alignment`<br>Structured path: `sheet->about->characteristics->alignment` | `STORED` | Text/string — content is record-specific; blank may be meaningful. | `alignment` reads a finite value stored at the structured ScriptCards location shown in the location column. | `Direct alias` |
| `experience` | Direct alias: `experience`<br>Structured path: `sheet->classLevel->currentExp` | `STORED` | Number — use a numeric value. The meaningful range depends on the field; no additional range is implied unless stated here. | `experience` reads a finite value stored at the structured ScriptCards location shown in the location column. | `Direct alias` |
| `eyes` | Direct alias: `eyes` | `STORED` | Text/string — content is record-specific; blank may be meaningful. | `eyes` is a writable direct alias for the character’s eye description. The current probes did not identify a stable structured `sheet` location. | `Direct alias` |
| `hair` | Direct alias: `hair` | `STORED` | Text/string — content is record-specific; blank may be meaningful. | `hair` is a writable direct alias for the character’s hair description. The current probes did not identify a stable structured `sheet` location. | `Direct alias` |
| `height` | Direct alias: `height` | `STORED` | Stored height text/value; preserve the sheet's existing formatting rather than assuming a numeric unit. | `height` is a writable direct alias for the character’s height. The current probes did not identify a stable structured `sheet` location. | `Direct alias` |
| `size` | Direct alias: `size`<br>Structured path: `sheet->about->characteristics->size` | `STORED` | Text/string — content is record-specific; blank may be meaningful. | `size` reads a finite value stored at the structured ScriptCards location shown in the location column. | `Direct alias` |
| `skin` | Direct alias: `skin` | `STORED` | Text/string — content is record-specific; blank may be meaningful. | `skin` is a writable direct alias for the character’s skin description. The current probes did not identify a stable structured `sheet` location. | `Direct alias` |
| `weight` | Direct alias: `weight` | `STORED` | Stored weight text/value; preserve the sheet's existing formatting rather than assuming a numeric unit. | `weight` is a writable direct alias for the character’s weight. The current probes did not identify a stable structured `sheet` location. | `Direct alias` |

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

| Direct alias | ScriptCards read location | Value role | Values / format | Description | Write using |
|---|---|---|---|---|---|
| `cp` | Direct alias: `cp`<br>Typed collection: `currencies` | `STORED` | Number — use a numeric value. The meaningful range depends on the field; no additional range is implied unless stated here. | `cp` is the finite amount stored by the matching Currency record. | `Direct alias` |
| `cust_classname` | Direct alias: `cust_classname`<br>Typed collections: `classes`, `classlevels`<br>Match: the intended custom Class and its Class Level record | `STORED` | Text/string — content is record-specific; blank may be meaningful. | `cust_classname` comes from the typed collection records identified in the location column. | `Typed collection` |
| `custom_class` | Direct alias: `custom_class`<br>Typed collections: `classes`, `classlevels`<br>Match: the intended custom Class and its Class Level record | `STORED` | Text/string — content is record-specific; blank may be meaningful. | `custom_class` comes from the typed collection records identified in the location column. | `Typed collection` |
| `dtype` | Direct alias: `dtype`<br>Structured path: `sheet->settings->rollDamageAutomatic` | `STORED` | Boolean backing setting `sheet->settings->rollDamageAutomatic`: `true` = automatic damage rolling enabled; `false` = disabled. This compatibility alias is read-only in the reference. | `dtype` reads a finite value stored at the structured ScriptCards location shown in the location column. | `Structured path` — Compatibility view of `rollDamageAutomatic`; do not treat it as the 2014 sheet’s independent damage-mode field. |
| `encumberance_setting` | Direct alias: `encumberance_setting`<br>Structured path: `sheet->settings->encumbranceType` | `STORED` | Encumbrance-mode string backed by `sheet->settings->encumbranceType`; the complete allowed enum was not independently enumerated. | `encumberance_setting` reads a finite value stored at the structured ScriptCards location shown in the location column. | `Structured path` |
| `ep` | Direct alias: `ep`<br>Typed collection: `currencies` | `STORED` | Number — use a numeric value. The meaningful range depends on the field; no additional range is implied unless stated here. | `ep` is the finite amount stored by the matching Currency record. | `Direct alias` |
| `gp` | Direct alias: `gp`<br>Typed collection: `currencies` | `STORED` | Number — use a numeric value. The meaningful range depends on the field; no additional range is implied unless stated here. | `gp` is the finite amount stored by the matching Currency record. | `Direct alias` |
| `inspiration` | Direct alias: `inspiration`<br>Structured path: `sheet->inspiration->isInspired` | `STORED` | Boolean — backing state is `sheet->inspiration->isInspired`: `true` = has Inspiration; `false` = does not. | `inspiration` reads a finite value stored at the structured ScriptCards location shown in the location column. | `Direct alias` |
| `pp` | Direct alias: `pp`<br>Typed collection: `currencies` | `STORED` | Number — use a numeric value. The meaningful range depends on the field; no additional range is implied unless stated here. | `pp` is the finite amount stored by the matching Currency record. | `Direct alias` |
| `sp` | Direct alias: `sp`<br>Typed collection: `currencies` | `STORED` | Number — use a numeric value. The meaningful range depends on the field; no additional range is implied unless stated here. | `sp` is the finite amount stored by the matching Currency record. | `Direct alias` |
| `subrace` | Direct alias: `subrace`<br>Typed collection: `species`<br>Match: the character’s Species record | `STORED` | Text/string — content is record-specific; blank may be meaningful. | `subrace` comes from the typed collection records identified in the location column. | `Typed collection` |

#### Legacy compatibility and roll output

> **Value roles**
>
> - `STORED` — A finite value or state stored by the sheet.
> - `UNKNOWN` — The character-level direct alias is not exposed by the verified Beacon build.
>
> **Write using**
>
> - `Typed collection` — Locate the matching existing record through the location labeled `Typed collection:` or `Typed collections:` in the row. When the row names a field, write that field; otherwise use the corresponding typed-collection table below to choose the existing primitive field that represents the intended change.

| Direct alias | ScriptCards read location | Value role | Values / format | Description | Write using |
|---|---|---|---|---|---|
| `cust_hitdietype` | Direct alias: `cust_hitdietype`<br>Typed collection: `hitdices`<br>Match: the intended class-specific Hit Dice record | `STORED` | Text/string — content is record-specific; blank may be meaningful. | `cust_hitdietype` comes from the typed collection records identified in the location column. | `Typed collection` |
| `cust_spellcasting_ability` | Character-level direct alias: not exposed in the verified Beacon build<br>Verified fallback result: missing `user.cust_spellcasting_ability` Custom Attribute<br>Use instead: `spellcastings->[selector]->ability` | `UNKNOWN` | Text/string — content is record-specific; blank may be meaningful. | A bare `cust_spellcasting_ability` read falls through to the classic custom-attribute fallback and produces a missing Custom Attribute error. The official Beacon selector changes the selected Spellcasting record's `ability`. | `Typed collection` — Locate the intended Spellcasting record and write `spellcastings->[selector]->ability`. |
| `cust_spellslots` | Direct alias: `cust_spellslots`<br>Typed collection: `spellslots`<br>Match: the intended spell level and `_slotType` | `STORED` | Text/string — content is record-specific; blank may be meaningful. | `cust_spellslots` comes from the typed collection records identified in the location column. | `Typed collection` |

### Computed and synthetic values

These aliases expose values calculated, aggregated, translated, or assembled from other Beacon data rather than independent storage locations. Use them freely for reads, but do not write a computed or synthetic alias directly. Follow the **Write using** column to find the actual input or parent record.

**Formula-based results.** These values are calculated from stored inputs such as ability scores, proficiency records, formula components, and enabled modifiers.

#### Ability scores and saving throws

> **Value roles**
>
> - `COMPUTED` — A calculated or aggregated result. Change the named source input rather than writing the result.
>
> **Write using**
>
> - `Source input` or `Source inputs` — Change the exact location or locations labeled `Source input:` or `Source inputs:` in the row.

| Direct alias | ScriptCards read location | Value role | Values / format | Description | Write using |
|---|---|---|---|---|---|
| `charisma_mod` | Direct alias: `charisma_mod`<br>Source input: `charisma` | `COMPUTED` | Numeric or numeric-form compatibility output. Exact formatting (for example signed text versus number) was not independently probed where this is a legacy projection. | Calculated from the Charisma score. | `Source input`: `charisma` |
| `charisma_save_bonus` | Direct alias: `charisma_save_bonus`<br>Source inputs: `charisma`; `proficiencies->Charisma->proficiencyLevel` for the Charisma Saving Throw record; `classlevels->[selector]->totalLevel`; applicable `rollbonuses` or `modifiers` records | `COMPUTED` | Numeric or numeric-form compatibility output. Exact formatting (for example signed text versus number) was not independently probed where this is a legacy projection. | Calculated from the Charisma modifier, Saving Throw proficiency, proficiency bonus, and applicable bonuses. | `Source inputs`: `charisma`; `proficiencies->Charisma->proficiencyLevel`; `classlevels->[selector]->totalLevel`; applicable `rollbonuses` or `modifiers` records |
| `charisma_save_mod` | Direct alias: `charisma_save_mod`<br>Source inputs: `charisma`; `proficiencies->Charisma->proficiencyLevel` for the Charisma Saving Throw record; `classlevels->[selector]->totalLevel`; applicable `rollbonuses` or `modifiers` records | `COMPUTED` | Numeric or numeric-form compatibility output. Exact formatting (for example signed text versus number) was not independently probed where this is a legacy projection. | Calculated from the Charisma modifier, Saving Throw proficiency, proficiency bonus, and applicable bonuses. | `Source inputs`: `charisma`; `proficiencies->Charisma->proficiencyLevel`; `classlevels->[selector]->totalLevel`; applicable `rollbonuses` or `modifiers` records |
| `constitution_mod` | Direct alias: `constitution_mod`<br>Source input: `constitution` | `COMPUTED` | Numeric or numeric-form compatibility output. Exact formatting (for example signed text versus number) was not independently probed where this is a legacy projection. | Calculated from the Constitution score. | `Source input`: `constitution` |
| `constitution_save_bonus` | Direct alias: `constitution_save_bonus`<br>Source inputs: `constitution`; `proficiencies->Constitution->proficiencyLevel` for the Constitution Saving Throw record; `classlevels->[selector]->totalLevel`; applicable `rollbonuses` or `modifiers` records | `COMPUTED` | Numeric or numeric-form compatibility output. Exact formatting (for example signed text versus number) was not independently probed where this is a legacy projection. | Calculated from the Constitution modifier, Saving Throw proficiency, proficiency bonus, and applicable bonuses. | `Source inputs`: `constitution`; `proficiencies->Constitution->proficiencyLevel`; `classlevels->[selector]->totalLevel`; applicable `rollbonuses` or `modifiers` records |
| `constitution_save_mod` | Direct alias: `constitution_save_mod`<br>Source inputs: `constitution`; `proficiencies->Constitution->proficiencyLevel` for the Constitution Saving Throw record; `classlevels->[selector]->totalLevel`; applicable `rollbonuses` or `modifiers` records | `COMPUTED` | Numeric or numeric-form compatibility output. Exact formatting (for example signed text versus number) was not independently probed where this is a legacy projection. | Calculated from the Constitution modifier, Saving Throw proficiency, proficiency bonus, and applicable bonuses. | `Source inputs`: `constitution`; `proficiencies->Constitution->proficiencyLevel`; `classlevels->[selector]->totalLevel`; applicable `rollbonuses` or `modifiers` records |
| `death_save_bonus` | Direct alias: `death_save_bonus`<br>Source inputs: applicable `rollbonuses` or `modifiers` records for death saves<br>State-only structured path: `sheet->hitpoints->deathSaves` stores successes and failures, not the numeric bonus | `COMPUTED` | Numeric or numeric-form compatibility output. Exact formatting (for example signed text versus number) was not independently probed where this is a legacy projection. | Calculated from bonuses that apply to death-saving throws. The death-save state container stores marks only. | `Source inputs`: applicable `rollbonuses->[selector]` or `modifiers->[selector]` fields |
| `death_save_mod` | Direct alias: `death_save_mod`<br>Source inputs: applicable `rollbonuses` or `modifiers` records for death saves<br>State-only structured path: `sheet->hitpoints->deathSaves` stores successes and failures, not the numeric bonus | `COMPUTED` | Numeric or numeric-form compatibility output. Exact formatting (for example signed text versus number) was not independently probed where this is a legacy projection. | Calculated from bonuses that apply to death-saving throws. The death-save state container stores marks only. | `Source inputs`: applicable `rollbonuses->[selector]` or `modifiers->[selector]` fields |
| `dexterity_mod` | Direct alias: `dexterity_mod`<br>Source input: `dexterity` | `COMPUTED` | Numeric or numeric-form compatibility output. Exact formatting (for example signed text versus number) was not independently probed where this is a legacy projection. | Calculated from the Dexterity score. | `Source input`: `dexterity` |
| `dexterity_save_bonus` | Direct alias: `dexterity_save_bonus`<br>Source inputs: `dexterity`; `proficiencies->Dexterity->proficiencyLevel` for the Dexterity Saving Throw record; `classlevels->[selector]->totalLevel`; applicable `rollbonuses` or `modifiers` records | `COMPUTED` | Numeric or numeric-form compatibility output. Exact formatting (for example signed text versus number) was not independently probed where this is a legacy projection. | Calculated from the Dexterity modifier, Saving Throw proficiency, proficiency bonus, and applicable bonuses. | `Source inputs`: `dexterity`; `proficiencies->Dexterity->proficiencyLevel`; `classlevels->[selector]->totalLevel`; applicable `rollbonuses` or `modifiers` records |
| `dexterity_save_mod` | Direct alias: `dexterity_save_mod`<br>Source inputs: `dexterity`; `proficiencies->Dexterity->proficiencyLevel` for the Dexterity Saving Throw record; `classlevels->[selector]->totalLevel`; applicable `rollbonuses` or `modifiers` records | `COMPUTED` | Numeric or numeric-form compatibility output. Exact formatting (for example signed text versus number) was not independently probed where this is a legacy projection. | Calculated from the Dexterity modifier, Saving Throw proficiency, proficiency bonus, and applicable bonuses. | `Source inputs`: `dexterity`; `proficiencies->Dexterity->proficiencyLevel`; `classlevels->[selector]->totalLevel`; applicable `rollbonuses` or `modifiers` records |
| `intelligence_mod` | Direct alias: `intelligence_mod`<br>Source input: `intelligence` | `COMPUTED` | Numeric or numeric-form compatibility output. Exact formatting (for example signed text versus number) was not independently probed where this is a legacy projection. | Calculated from the Intelligence score. | `Source input`: `intelligence` |
| `intelligence_save_bonus` | Direct alias: `intelligence_save_bonus`<br>Source inputs: `intelligence`; `proficiencies->Intelligence->proficiencyLevel` for the Intelligence Saving Throw record; `classlevels->[selector]->totalLevel`; applicable `rollbonuses` or `modifiers` records | `COMPUTED` | Numeric or numeric-form compatibility output. Exact formatting (for example signed text versus number) was not independently probed where this is a legacy projection. | Calculated from the Intelligence modifier, Saving Throw proficiency, proficiency bonus, and applicable bonuses. | `Source inputs`: `intelligence`; `proficiencies->Intelligence->proficiencyLevel`; `classlevels->[selector]->totalLevel`; applicable `rollbonuses` or `modifiers` records |
| `intelligence_save_mod` | Direct alias: `intelligence_save_mod`<br>Source inputs: `intelligence`; `proficiencies->Intelligence->proficiencyLevel` for the Intelligence Saving Throw record; `classlevels->[selector]->totalLevel`; applicable `rollbonuses` or `modifiers` records | `COMPUTED` | Numeric or numeric-form compatibility output. Exact formatting (for example signed text versus number) was not independently probed where this is a legacy projection. | Calculated from the Intelligence modifier, Saving Throw proficiency, proficiency bonus, and applicable bonuses. | `Source inputs`: `intelligence`; `proficiencies->Intelligence->proficiencyLevel`; `classlevels->[selector]->totalLevel`; applicable `rollbonuses` or `modifiers` records |
| `strength_mod` | Direct alias: `strength_mod`<br>Source input: `strength` | `COMPUTED` | Numeric or numeric-form compatibility output. Exact formatting (for example signed text versus number) was not independently probed where this is a legacy projection. | Calculated from the Strength score. | `Source input`: `strength` |
| `strength_save_bonus` | Direct alias: `strength_save_bonus`<br>Source inputs: `strength`; `proficiencies->Strength->proficiencyLevel` for the Strength Saving Throw record; `classlevels->[selector]->totalLevel`; applicable `rollbonuses` or `modifiers` records | `COMPUTED` | Numeric or numeric-form compatibility output. Exact formatting (for example signed text versus number) was not independently probed where this is a legacy projection. | Calculated from the Strength modifier, Saving Throw proficiency, proficiency bonus, and applicable bonuses. | `Source inputs`: `strength`; `proficiencies->Strength->proficiencyLevel`; `classlevels->[selector]->totalLevel`; applicable `rollbonuses` or `modifiers` records |
| `strength_save_mod` | Direct alias: `strength_save_mod`<br>Source inputs: `strength`; `proficiencies->Strength->proficiencyLevel` for the Strength Saving Throw record; `classlevels->[selector]->totalLevel`; applicable `rollbonuses` or `modifiers` records | `COMPUTED` | Numeric or numeric-form compatibility output. Exact formatting (for example signed text versus number) was not independently probed where this is a legacy projection. | Calculated from the Strength modifier, Saving Throw proficiency, proficiency bonus, and applicable bonuses. | `Source inputs`: `strength`; `proficiencies->Strength->proficiencyLevel`; `classlevels->[selector]->totalLevel`; applicable `rollbonuses` or `modifiers` records |
| `wisdom_mod` | Direct alias: `wisdom_mod`<br>Source input: `wisdom` | `COMPUTED` | Numeric or numeric-form compatibility output. Exact formatting (for example signed text versus number) was not independently probed where this is a legacy projection. | Calculated from the Wisdom score. | `Source input`: `wisdom` |
| `wisdom_save_bonus` | Direct alias: `wisdom_save_bonus`<br>Source inputs: `wisdom`; `proficiencies->Wisdom->proficiencyLevel` for the Wisdom Saving Throw record; `classlevels->[selector]->totalLevel`; applicable `rollbonuses` or `modifiers` records | `COMPUTED` | Numeric or numeric-form compatibility output. Exact formatting (for example signed text versus number) was not independently probed where this is a legacy projection. | Calculated from the Wisdom modifier, Saving Throw proficiency, proficiency bonus, and applicable bonuses. | `Source inputs`: `wisdom`; `proficiencies->Wisdom->proficiencyLevel`; `classlevels->[selector]->totalLevel`; applicable `rollbonuses` or `modifiers` records |
| `wisdom_save_mod` | Direct alias: `wisdom_save_mod`<br>Source inputs: `wisdom`; `proficiencies->Wisdom->proficiencyLevel` for the Wisdom Saving Throw record; `classlevels->[selector]->totalLevel`; applicable `rollbonuses` or `modifiers` records | `COMPUTED` | Numeric or numeric-form compatibility output. Exact formatting (for example signed text versus number) was not independently probed where this is a legacy projection. | Calculated from the Wisdom modifier, Saving Throw proficiency, proficiency bonus, and applicable bonuses. | `Source inputs`: `wisdom`; `proficiencies->Wisdom->proficiencyLevel`; `classlevels->[selector]->totalLevel`; applicable `rollbonuses` or `modifiers` records |

#### Skills and passive checks

> **Value roles**
>
> - `COMPUTED` — A calculated or aggregated result. Change the named source inputs rather than writing the result.
>
> **Write using**
>
> - `Source inputs` — Change the exact locations labeled `Source inputs:` in the row.

| Direct alias | ScriptCards read location | Value role | Values / format | Description | Write using |
|---|---|---|---|---|---|
| `acrobatics_bonus` | Direct alias: `acrobatics_bonus`<br>Source inputs: `skills->Acrobatics->ability`; the matching ability-score direct alias; `proficiencies->Acrobatics->proficiencyLevel`; `classlevels->[selector]->totalLevel`; applicable `rollbonuses` or `modifiers` records | `COMPUTED` | Numeric or numeric-form compatibility output. Exact formatting (for example signed text versus number) was not independently probed where this is a legacy projection. | Calculated from the ability assigned to Acrobatics, that ability score, Acrobatics proficiency, proficiency bonus, and applicable bonuses. | `Source inputs`: `skills->Acrobatics->ability`; matching ability-score direct alias; `proficiencies->Acrobatics->proficiencyLevel`; `classlevels->[selector]->totalLevel`; applicable `rollbonuses` or `modifiers` records |
| `acrobatics_flat` | Direct alias: `acrobatics_flat`<br>Source inputs: `skills->Acrobatics->ability`; the matching ability-score direct alias; `proficiencies->Acrobatics->proficiencyLevel`; `classlevels->[selector]->totalLevel`; applicable `rollbonuses` or `modifiers` records | `COMPUTED` | Numeric or numeric-form compatibility output. Exact formatting (for example signed text versus number) was not independently probed where this is a legacy projection. | Calculated from the ability assigned to Acrobatics, that ability score, Acrobatics proficiency, proficiency bonus, and applicable bonuses. | `Source inputs`: `skills->Acrobatics->ability`; matching ability-score direct alias; `proficiencies->Acrobatics->proficiencyLevel`; `classlevels->[selector]->totalLevel`; applicable `rollbonuses` or `modifiers` records |
| `animal_handling_flat` | Direct alias: `animal_handling_flat`<br>Source inputs: `skills->Animal Handling->ability`; the matching ability-score direct alias; `proficiencies->Animal Handling->proficiencyLevel`; `classlevels->[selector]->totalLevel`; applicable `rollbonuses` or `modifiers` records | `COMPUTED` | Numeric or numeric-form compatibility output. Exact formatting (for example signed text versus number) was not independently probed where this is a legacy projection. | Calculated from the ability assigned to Animal Handling, that ability score, Animal Handling proficiency, proficiency bonus, and applicable bonuses. | `Source inputs`: `skills->Animal Handling->ability`; matching ability-score direct alias; `proficiencies->Animal Handling->proficiencyLevel`; `classlevels->[selector]->totalLevel`; applicable `rollbonuses` or `modifiers` records |
| `arcana_flat` | Direct alias: `arcana_flat`<br>Source inputs: `skills->Arcana->ability`; the matching ability-score direct alias; `proficiencies->Arcana->proficiencyLevel`; `classlevels->[selector]->totalLevel`; applicable `rollbonuses` or `modifiers` records | `COMPUTED` | Numeric or numeric-form compatibility output. Exact formatting (for example signed text versus number) was not independently probed where this is a legacy projection. | Calculated from the ability assigned to Arcana, that ability score, Arcana proficiency, proficiency bonus, and applicable bonuses. | `Source inputs`: `skills->Arcana->ability`; matching ability-score direct alias; `proficiencies->Arcana->proficiencyLevel`; `classlevels->[selector]->totalLevel`; applicable `rollbonuses` or `modifiers` records |
| `athletics_flat` | Direct alias: `athletics_flat`<br>Source inputs: `skills->Athletics->ability`; the matching ability-score direct alias; `proficiencies->Athletics->proficiencyLevel`; `classlevels->[selector]->totalLevel`; applicable `rollbonuses` or `modifiers` records | `COMPUTED` | Numeric or numeric-form compatibility output. Exact formatting (for example signed text versus number) was not independently probed where this is a legacy projection. | Calculated from the ability assigned to Athletics, that ability score, Athletics proficiency, proficiency bonus, and applicable bonuses. | `Source inputs`: `skills->Athletics->ability`; matching ability-score direct alias; `proficiencies->Athletics->proficiencyLevel`; `classlevels->[selector]->totalLevel`; applicable `rollbonuses` or `modifiers` records |
| `deception_flat` | Direct alias: `deception_flat`<br>Source inputs: `skills->Deception->ability`; the matching ability-score direct alias; `proficiencies->Deception->proficiencyLevel`; `classlevels->[selector]->totalLevel`; applicable `rollbonuses` or `modifiers` records | `COMPUTED` | Numeric or numeric-form compatibility output. Exact formatting (for example signed text versus number) was not independently probed where this is a legacy projection. | Calculated from the ability assigned to Deception, that ability score, Deception proficiency, proficiency bonus, and applicable bonuses. | `Source inputs`: `skills->Deception->ability`; matching ability-score direct alias; `proficiencies->Deception->proficiencyLevel`; `classlevels->[selector]->totalLevel`; applicable `rollbonuses` or `modifiers` records |
| `history_flat` | Direct alias: `history_flat`<br>Source inputs: `skills->History->ability`; the matching ability-score direct alias; `proficiencies->History->proficiencyLevel`; `classlevels->[selector]->totalLevel`; applicable `rollbonuses` or `modifiers` records | `COMPUTED` | Numeric or numeric-form compatibility output. Exact formatting (for example signed text versus number) was not independently probed where this is a legacy projection. | Calculated from the ability assigned to History, that ability score, History proficiency, proficiency bonus, and applicable bonuses. | `Source inputs`: `skills->History->ability`; matching ability-score direct alias; `proficiencies->History->proficiencyLevel`; `classlevels->[selector]->totalLevel`; applicable `rollbonuses` or `modifiers` records |
| `insight_flat` | Direct alias: `insight_flat`<br>Source inputs: `skills->Insight->ability`; the matching ability-score direct alias; `proficiencies->Insight->proficiencyLevel`; `classlevels->[selector]->totalLevel`; applicable `rollbonuses` or `modifiers` records | `COMPUTED` | Numeric or numeric-form compatibility output. Exact formatting (for example signed text versus number) was not independently probed where this is a legacy projection. | Calculated from the ability assigned to Insight, that ability score, Insight proficiency, proficiency bonus, and applicable bonuses. | `Source inputs`: `skills->Insight->ability`; matching ability-score direct alias; `proficiencies->Insight->proficiencyLevel`; `classlevels->[selector]->totalLevel`; applicable `rollbonuses` or `modifiers` records |
| `intimidation_flat` | Direct alias: `intimidation_flat`<br>Source inputs: `skills->Intimidation->ability`; the matching ability-score direct alias; `proficiencies->Intimidation->proficiencyLevel`; `classlevels->[selector]->totalLevel`; applicable `rollbonuses` or `modifiers` records | `COMPUTED` | Numeric or numeric-form compatibility output. Exact formatting (for example signed text versus number) was not independently probed where this is a legacy projection. | Calculated from the ability assigned to Intimidation, that ability score, Intimidation proficiency, proficiency bonus, and applicable bonuses. | `Source inputs`: `skills->Intimidation->ability`; matching ability-score direct alias; `proficiencies->Intimidation->proficiencyLevel`; `classlevels->[selector]->totalLevel`; applicable `rollbonuses` or `modifiers` records |
| `investigation_flat` | Direct alias: `investigation_flat`<br>Source inputs: `skills->Investigation->ability`; the matching ability-score direct alias; `proficiencies->Investigation->proficiencyLevel`; `classlevels->[selector]->totalLevel`; applicable `rollbonuses` or `modifiers` records | `COMPUTED` | Numeric or numeric-form compatibility output. Exact formatting (for example signed text versus number) was not independently probed where this is a legacy projection. | Calculated from the ability assigned to Investigation, that ability score, Investigation proficiency, proficiency bonus, and applicable bonuses. | `Source inputs`: `skills->Investigation->ability`; matching ability-score direct alias; `proficiencies->Investigation->proficiencyLevel`; `classlevels->[selector]->totalLevel`; applicable `rollbonuses` or `modifiers` records |
| `medicine_flat` | Direct alias: `medicine_flat`<br>Source inputs: `skills->Medicine->ability`; the matching ability-score direct alias; `proficiencies->Medicine->proficiencyLevel`; `classlevels->[selector]->totalLevel`; applicable `rollbonuses` or `modifiers` records | `COMPUTED` | Numeric or numeric-form compatibility output. Exact formatting (for example signed text versus number) was not independently probed where this is a legacy projection. | Calculated from the ability assigned to Medicine, that ability score, Medicine proficiency, proficiency bonus, and applicable bonuses. | `Source inputs`: `skills->Medicine->ability`; matching ability-score direct alias; `proficiencies->Medicine->proficiencyLevel`; `classlevels->[selector]->totalLevel`; applicable `rollbonuses` or `modifiers` records |
| `nature_flat` | Direct alias: `nature_flat`<br>Source inputs: `skills->Nature->ability`; the matching ability-score direct alias; `proficiencies->Nature->proficiencyLevel`; `classlevels->[selector]->totalLevel`; applicable `rollbonuses` or `modifiers` records | `COMPUTED` | Numeric or numeric-form compatibility output. Exact formatting (for example signed text versus number) was not independently probed where this is a legacy projection. | Calculated from the ability assigned to Nature, that ability score, Nature proficiency, proficiency bonus, and applicable bonuses. | `Source inputs`: `skills->Nature->ability`; matching ability-score direct alias; `proficiencies->Nature->proficiencyLevel`; `classlevels->[selector]->totalLevel`; applicable `rollbonuses` or `modifiers` records |
| `passive_wisdom` | Direct alias: `passive_wisdom`<br>Source inputs: `skills->Perception->ability`; the matching ability-score direct alias; `proficiencies->Perception->proficiencyLevel`; `classlevels->[selector]->totalLevel`; applicable `rollbonuses` or `modifiers` records | `COMPUTED` | Compatibility output — the exact returned value domain was not independently verified in the controlled probes. | Calculated as 10 plus the final Perception total. | `Source inputs`: `skills->Perception->ability`; matching ability-score direct alias; `proficiencies->Perception->proficiencyLevel`; `classlevels->[selector]->totalLevel`; applicable `rollbonuses` or `modifiers` records |
| `passiveperceptionmod` | Direct alias: `passiveperceptionmod`<br>Source inputs: `skills->Perception->ability`; the matching ability-score direct alias; `proficiencies->Perception->proficiencyLevel`; `classlevels->[selector]->totalLevel`; applicable `rollbonuses` or `modifiers` records | `COMPUTED` | Numeric or numeric-form compatibility output. Exact formatting (for example signed text versus number) was not independently probed where this is a legacy projection. | Calculated as 10 plus the final Perception total. | `Source inputs`: `skills->Perception->ability`; matching ability-score direct alias; `proficiencies->Perception->proficiencyLevel`; `classlevels->[selector]->totalLevel`; applicable `rollbonuses` or `modifiers` records |
| `perception_flat` | Direct alias: `perception_flat`<br>Source inputs: `skills->Perception->ability`; the matching ability-score direct alias; `proficiencies->Perception->proficiencyLevel`; `classlevels->[selector]->totalLevel`; applicable `rollbonuses` or `modifiers` records | `COMPUTED` | Numeric or numeric-form compatibility output. Exact formatting (for example signed text versus number) was not independently probed where this is a legacy projection. | Calculated from the ability assigned to Perception, that ability score, Perception proficiency, proficiency bonus, and applicable bonuses. | `Source inputs`: `skills->Perception->ability`; matching ability-score direct alias; `proficiencies->Perception->proficiencyLevel`; `classlevels->[selector]->totalLevel`; applicable `rollbonuses` or `modifiers` records |
| `performance_flat` | Direct alias: `performance_flat`<br>Source inputs: `skills->Performance->ability`; the matching ability-score direct alias; `proficiencies->Performance->proficiencyLevel`; `classlevels->[selector]->totalLevel`; applicable `rollbonuses` or `modifiers` records | `COMPUTED` | Numeric or numeric-form compatibility output. Exact formatting (for example signed text versus number) was not independently probed where this is a legacy projection. | Calculated from the ability assigned to Performance, that ability score, Performance proficiency, proficiency bonus, and applicable bonuses. | `Source inputs`: `skills->Performance->ability`; matching ability-score direct alias; `proficiencies->Performance->proficiencyLevel`; `classlevels->[selector]->totalLevel`; applicable `rollbonuses` or `modifiers` records |
| `persuasion_flat` | Direct alias: `persuasion_flat`<br>Source inputs: `skills->Persuasion->ability`; the matching ability-score direct alias; `proficiencies->Persuasion->proficiencyLevel`; `classlevels->[selector]->totalLevel`; applicable `rollbonuses` or `modifiers` records | `COMPUTED` | Numeric or numeric-form compatibility output. Exact formatting (for example signed text versus number) was not independently probed where this is a legacy projection. | Calculated from the ability assigned to Persuasion, that ability score, Persuasion proficiency, proficiency bonus, and applicable bonuses. | `Source inputs`: `skills->Persuasion->ability`; matching ability-score direct alias; `proficiencies->Persuasion->proficiencyLevel`; `classlevels->[selector]->totalLevel`; applicable `rollbonuses` or `modifiers` records |
| `religion_flat` | Direct alias: `religion_flat`<br>Source inputs: `skills->Religion->ability`; the matching ability-score direct alias; `proficiencies->Religion->proficiencyLevel`; `classlevels->[selector]->totalLevel`; applicable `rollbonuses` or `modifiers` records | `COMPUTED` | Numeric or numeric-form compatibility output. Exact formatting (for example signed text versus number) was not independently probed where this is a legacy projection. | Calculated from the ability assigned to Religion, that ability score, Religion proficiency, proficiency bonus, and applicable bonuses. | `Source inputs`: `skills->Religion->ability`; matching ability-score direct alias; `proficiencies->Religion->proficiencyLevel`; `classlevels->[selector]->totalLevel`; applicable `rollbonuses` or `modifiers` records |
| `sleight_of_hand_flat` | Direct alias: `sleight_of_hand_flat`<br>Source inputs: `skills->Sleight of Hand->ability`; the matching ability-score direct alias; `proficiencies->Sleight of Hand->proficiencyLevel`; `classlevels->[selector]->totalLevel`; applicable `rollbonuses` or `modifiers` records | `COMPUTED` | Numeric or numeric-form compatibility output. Exact formatting (for example signed text versus number) was not independently probed where this is a legacy projection. | Calculated from the ability assigned to Sleight of Hand, that ability score, Sleight of Hand proficiency, proficiency bonus, and applicable bonuses. | `Source inputs`: `skills->Sleight of Hand->ability`; matching ability-score direct alias; `proficiencies->Sleight of Hand->proficiencyLevel`; `classlevels->[selector]->totalLevel`; applicable `rollbonuses` or `modifiers` records |
| `stealth_flat` | Direct alias: `stealth_flat`<br>Source inputs: `skills->Stealth->ability`; the matching ability-score direct alias; `proficiencies->Stealth->proficiencyLevel`; `classlevels->[selector]->totalLevel`; applicable `rollbonuses` or `modifiers` records | `COMPUTED` | Numeric or numeric-form compatibility output. Exact formatting (for example signed text versus number) was not independently probed where this is a legacy projection. | Calculated from the ability assigned to Stealth, that ability score, Stealth proficiency, proficiency bonus, and applicable bonuses. | `Source inputs`: `skills->Stealth->ability`; matching ability-score direct alias; `proficiencies->Stealth->proficiencyLevel`; `classlevels->[selector]->totalLevel`; applicable `rollbonuses` or `modifiers` records |
| `survival_flat` | Direct alias: `survival_flat`<br>Source inputs: `skills->Survival->ability`; the matching ability-score direct alias; `proficiencies->Survival->proficiencyLevel`; `classlevels->[selector]->totalLevel`; applicable `rollbonuses` or `modifiers` records | `COMPUTED` | Numeric or numeric-form compatibility output. Exact formatting (for example signed text versus number) was not independently probed where this is a legacy projection. | Calculated from the ability assigned to Survival, that ability score, Survival proficiency, proficiency bonus, and applicable bonuses. | `Source inputs`: `skills->Survival->ability`; matching ability-score direct alias; `proficiencies->Survival->proficiencyLevel`; `classlevels->[selector]->totalLevel`; applicable `rollbonuses` or `modifiers` records |

#### Combat statistics

> **Value roles**
>
> - `COMPUTED` — A calculated or aggregated result. Change the named source inputs rather than writing the result.
>
> **Write using**
>
> - `Source inputs` — Change the exact locations labeled `Source inputs:` in the row.

| Direct alias | ScriptCards read location | Value role | Values / format | Description | Write using |
|---|---|---|---|---|---|
| `initiative_bonus` | Direct alias: `initiative_bonus`<br>Source inputs: `dexterity`; applicable initiative `rollbonuses` or `modifiers` records | `COMPUTED` | Number — use a numeric value. The meaningful range depends on the field; no additional range is implied unless stated here. | Calculated from the Dexterity modifier and bonuses that apply to Initiative. `init_tiebreaker` changes tie handling, not this number. | `Source inputs`: `dexterity`; applicable initiative `rollbonuses->[selector]` or `modifiers->[selector]` fields |
| `initmod` | Direct alias: `initmod`<br>Source inputs: `dexterity`; applicable initiative `rollbonuses` or `modifiers` records | `COMPUTED` | Number — use a numeric value. The meaningful range depends on the field; no additional range is implied unless stated here. | Calculated from the Dexterity modifier and bonuses that apply to Initiative. `init_tiebreaker` changes tie handling, not this number. | `Source inputs`: `dexterity`; applicable initiative `rollbonuses->[selector]` or `modifiers->[selector]` fields |

#### Shared character values

> **Value roles**
>
> - `COMPUTED` — A calculated or aggregated result. Change the named source input rather than writing the result.
>
> **Write using**
>
> - `Source input` — Change the exact location labeled `Source input:` in the row.

| Direct alias | ScriptCards read location | Value role | Values / format | Description | Write using |
|---|---|---|---|---|---|
| `base_level` | Direct alias: `base_level`<br>Source input: `classlevels->[selector]->totalLevel` | `COMPUTED` | Number — use a numeric value. The meaningful range depends on the field; no additional range is implied unless stated here. | Compatibility projection of the applicable total level from the Class Level records. | `Source input`: `classlevels->[selector]->totalLevel` |
| `pb` | Direct alias: `pb`<br>Source input: `classlevels->[selector]->totalLevel`<br>Match: a Class Level record with populated `classID`<br>Formula: `2 + floor((totalLevel - 1) / 4)` | `COMPUTED` | Number — use a numeric value. The meaningful range depends on the field; no additional range is implied unless stated here. | Calculated proficiency bonus from the applicable total character level. | `Source input`: `classlevels->[selector]->totalLevel` |

#### Level and proficiency bonus

> **Value roles**
>
> - `COMPUTED` — A calculated or aggregated result. Change the named source input rather than writing the result.
>
> **Write using**
>
> - `Source input` — Change the exact location labeled `Source input:` in the row.
> - `Write not verified` — Use the alias for reads; no safe ScriptCards write target has been verified.

| Direct alias | ScriptCards read location | Value role | Values / format | Description | Write using |
|---|---|---|---|---|---|
| `level` | Direct alias: `level`<br>Source input: `classlevels->[selector]->totalLevel` | `COMPUTED` | Number — use a numeric value. The meaningful range depends on the field; no additional range is implied unless stated here. | Final total character level derived from the applicable Class Level records. | `Source input`: `classlevels->[selector]->totalLevel` |
| `level_calculations` | Direct alias: `level_calculations`<br>Known typed collection: `classlevels`<br>Source-input set: not yet verified | `COMPUTED` | Compatibility output — the exact returned value domain was not independently verified in the controlled probes. | Sheet-generated level-calculation compatibility output. The complete input set has not yet been mapped to safe ScriptCards write targets. | `Write not verified` |

**Aliases, aggregates, and synthetic projections.** These values are translated, aggregated, or assembled from canonical records. They are not independent storage locations; use the listed source record or collection for deliberate edits.

#### Identity, class, and species

> **Value roles**
>
> - `COMPUTED` — A calculated or aggregated result. Change the named source input rather than writing the result.
>
> **Write using**
>
> - `Write not verified` — Use the alias for reads; no safe ScriptCards write target has been verified.

| Direct alias | ScriptCards read location | Value role | Values / format | Description | Write using |
|---|---|---|---|---|---|
| `background` | Direct alias: `background`<br>Typed collection: `backgrounds` | `COMPUTED` | Text/string — content is record-specific; blank may be meaningful. | `background` is the translated display value derived from the canonical Background record. | `Write not verified` |
| `character_name` | Direct alias: `character_name` | `COMPUTED` | Text/string — content is record-specific; blank may be meaningful. | `character_name` is the Roll20 character-name pseudo-attribute exposed through ScriptCards, not an independently writable Beacon sheet field. | `Write not verified` |
| `class` | Direct alias: `class`<br>Typed collection: `classes` | `COMPUTED` | Text/string — content is record-specific; blank may be meaningful. | `class` is the translated display value derived from canonical Class and Class Level records. | `Write not verified` |
| `class_display` | Direct alias: `class_display`<br>Typed collections: `classes`, `classlevels`, `subclasses` | `COMPUTED` | Text/string — content is record-specific; blank may be meaningful. | `class_display` is a formatted compatibility display assembled from class, level, and subclass records. | `Write not verified` |
| `race` | Direct alias: `race`<br>Typed collection: `species` | `COMPUTED` | Text/string — content is record-specific; blank may be meaningful. | `race` is the legacy-compatible species display derived from the canonical Species record. | `Write not verified` |
| `race_display` | Direct alias: `race_display`<br>Typed collection: `species` | `COMPUTED` | Text/string — content is record-specific; blank may be meaningful. | `race_display` is a formatted compatibility display derived from the canonical Species record. | `Write not verified` |

#### Spellcasting and spell slots

> **Value roles**
>
> - `COMPUTED` — A calculated or aggregated result. Change the named source input rather than writing the result.
>
> **Write using**
>
> - `Write not verified` — Use the alias for reads; no safe ScriptCards write target has been verified.

| Direct alias | ScriptCards read location | Value role | Values / format | Description | Write using |
|---|---|---|---|---|---|
| `lvl1_slots_mod` | Direct alias: `lvl1_slots_mod` | `COMPUTED` | Numeric compatibility value associated with that spell-slot level; exact calculation semantics are read-only here. | `lvl1_slots_mod` is a direct alias that provides convenient ScriptCards access to the Beacon data described in the location column. | `Write not verified` |
| `lvl2_slots_mod` | Direct alias: `lvl2_slots_mod` | `COMPUTED` | Numeric compatibility value associated with that spell-slot level; exact calculation semantics are read-only here. | `lvl2_slots_mod` is a direct alias that provides convenient ScriptCards access to the Beacon data described in the location column. | `Write not verified` |
| `lvl3_slots_mod` | Direct alias: `lvl3_slots_mod` | `COMPUTED` | Numeric compatibility value associated with that spell-slot level; exact calculation semantics are read-only here. | `lvl3_slots_mod` is a direct alias that provides convenient ScriptCards access to the Beacon data described in the location column. | `Write not verified` |
| `lvl4_slots_mod` | Direct alias: `lvl4_slots_mod` | `COMPUTED` | Numeric compatibility value associated with that spell-slot level; exact calculation semantics are read-only here. | `lvl4_slots_mod` is a direct alias that provides convenient ScriptCards access to the Beacon data described in the location column. | `Write not verified` |
| `lvl5_slots_mod` | Direct alias: `lvl5_slots_mod` | `COMPUTED` | Numeric compatibility value associated with that spell-slot level; exact calculation semantics are read-only here. | `lvl5_slots_mod` is a direct alias that provides convenient ScriptCards access to the Beacon data described in the location column. | `Write not verified` |
| `lvl6_slots_mod` | Direct alias: `lvl6_slots_mod` | `COMPUTED` | Numeric compatibility value associated with that spell-slot level; exact calculation semantics are read-only here. | `lvl6_slots_mod` is a direct alias that provides convenient ScriptCards access to the Beacon data described in the location column. | `Write not verified` |
| `lvl7_slots_mod` | Direct alias: `lvl7_slots_mod` | `COMPUTED` | Numeric compatibility value associated with that spell-slot level; exact calculation semantics are read-only here. | `lvl7_slots_mod` is a direct alias that provides convenient ScriptCards access to the Beacon data described in the location column. | `Write not verified` |
| `lvl8_slots_mod` | Direct alias: `lvl8_slots_mod` | `COMPUTED` | Numeric compatibility value associated with that spell-slot level; exact calculation semantics are read-only here. | `lvl8_slots_mod` is a direct alias that provides convenient ScriptCards access to the Beacon data described in the location column. | `Write not verified` |
| `lvl9_slots_mod` | Direct alias: `lvl9_slots_mod` | `COMPUTED` | Numeric compatibility value associated with that spell-slot level; exact calculation semantics are read-only here. | `lvl9_slots_mod` is a direct alias that provides convenient ScriptCards access to the Beacon data described in the location column. | `Write not verified` |

#### NPC core, defenses, and compatibility flags

> **Value roles**
>
> - `COMPUTED` — A calculated or aggregated result. Change the named source input rather than writing the result.
>
> **Write using**
>
> - `Write not verified` — Use the alias for reads; no safe ScriptCards write target has been verified.

| Direct alias | ScriptCards read location | Value role | Values / format | Description | Write using |
|---|---|---|---|---|---|
| `npc_ac` | Direct alias: `npc_ac` | `COMPUTED` | Number — use a numeric value. The meaningful range depends on the field; no additional range is implied unless stated here. | `npc_ac` is a direct alias that provides convenient ScriptCards access to the Beacon data described in the location column. | `Write not verified` |
| `npc_actype` | Direct alias: `npc_actype` | `COMPUTED` | Text/string — content is record-specific; blank may be meaningful. | `npc_actype` is a direct alias that provides convenient ScriptCards access to the Beacon data described in the location column. | `Write not verified` |
| `npc_condition_immunities` | Direct alias: `npc_condition_immunities` | `COMPUTED` | Text/string — content is record-specific; blank may be meaningful. | `npc_condition_immunities` is a direct alias that provides convenient ScriptCards access to the Beacon data described in the location column. | `Write not verified` |
| `npc_immunities` | Direct alias: `npc_immunities` | `COMPUTED` | Text/string — content is record-specific; blank may be meaningful. | `npc_immunities` is a direct alias that provides convenient ScriptCards access to the Beacon data described in the location column. | `Write not verified` |
| `npc_languages` | Direct alias: `npc_languages` | `COMPUTED` | Text/string — content is record-specific; blank may be meaningful. | `npc_languages` is a direct alias that provides convenient ScriptCards access to the Beacon data described in the location column. | `Write not verified` |
| `npc_name_flag` | Direct alias: `npc_name_flag`<br>Structured path: `sheet->npc` | `COMPUTED` | Compatibility flag/toggle output. Exact legacy representation (`0`/`1`, boolean, blank/text, etc.) was not independently verified; do not assume a writable boolean unless the row names a canonical boolean source. | `npc_name_flag` is a direct alias that provides convenient ScriptCards access to the Beacon data described in the location column. | `Write not verified` |
| `npc_options-flag` | Direct alias: `npc_options-flag` | `COMPUTED` | Compatibility flag/toggle output. Exact legacy representation (`0`/`1`, boolean, blank/text, etc.) was not independently verified; do not assume a writable boolean unless the row names a canonical boolean source. | `npc_options-flag` is a direct alias that provides convenient ScriptCards access to the Beacon data described in the location column. | `Write not verified` |
| `npc_resistances` | Direct alias: `npc_resistances` | `COMPUTED` | Text/string — content is record-specific; blank may be meaningful. | `npc_resistances` is a direct alias that provides convenient ScriptCards access to the Beacon data described in the location column. | `Write not verified` |
| `npc_saving_flag` | Direct alias: `npc_saving_flag` | `COMPUTED` | Compatibility flag/toggle output. Exact legacy representation (`0`/`1`, boolean, blank/text, etc.) was not independently verified; do not assume a writable boolean unless the row names a canonical boolean source. | `npc_saving_flag` is a direct alias that provides convenient ScriptCards access to the Beacon data described in the location column. | `Write not verified` |
| `npc_senses` | Direct alias: `npc_senses` | `COMPUTED` | Text/string — content is record-specific; blank may be meaningful. | `npc_senses` is a direct alias that provides convenient ScriptCards access to the Beacon data described in the location column. | `Write not verified` |
| `npc_skills_flag` | Direct alias: `npc_skills_flag` | `COMPUTED` | Compatibility flag/toggle output. Exact legacy representation (`0`/`1`, boolean, blank/text, etc.) was not independently verified; do not assume a writable boolean unless the row names a canonical boolean source. | `npc_skills_flag` is a direct alias that provides convenient ScriptCards access to the Beacon data described in the location column. | `Write not verified` |
| `npc_type` | Direct alias: `npc_type`<br>Structured path: `sheet->character->creatureType` | `COMPUTED` | Text/string — content is record-specific; blank may be meaningful. | `npc_type` is a direct alias that provides convenient ScriptCards access to the Beacon data described in the location column. | `Write not verified` |
| `npc_vulnerabilities` | Direct alias: `npc_vulnerabilities` | `COMPUTED` | Text/string — content is record-specific; blank may be meaningful. | `npc_vulnerabilities` is a direct alias that provides convenient ScriptCards access to the Beacon data described in the location column. | `Write not verified` |
| `npc_xp` | Direct alias: `npc_xp`<br>Structured path: `sheet->npc->challengeRating`<br>Structured path: `sheet->npc->customXP` | `COMPUTED` | Number — use a numeric value. The meaningful range depends on the field; no additional range is implied unless stated here. | `npc_xp` is a direct alias that provides convenient ScriptCards access to the Beacon data described in the location column. | `Write not verified` |
| `npcreactionsflag` | Direct alias: `npcreactionsflag`<br>Structured path: `sheet->actions->reactionDisplayOrder` | `COMPUTED` | Compatibility flag/toggle output. Exact legacy representation (`0`/`1`, boolean, blank/text, etc.) was not independently verified; do not assume a writable boolean unless the row names a canonical boolean source. | `npcreactionsflag` is a direct alias that provides convenient ScriptCards access to the Beacon data described in the location column. | `Write not verified` |
| `npcspell_flag` | Direct alias: `npcspell_flag` | `COMPUTED` | Compatibility flag/toggle output. Exact legacy representation (`0`/`1`, boolean, blank/text, etc.) was not independently verified; do not assume a writable boolean unless the row names a canonical boolean source. | `npcspell_flag` is a direct alias that provides convenient ScriptCards access to the Beacon data described in the location column. | `Write not verified` |
| `npcspellcastingflag` | Direct alias: `npcspellcastingflag` | `COMPUTED` | Compatibility flag/toggle output. Exact legacy representation (`0`/`1`, boolean, blank/text, etc.) was not independently verified; do not assume a writable boolean unless the row names a canonical boolean source. | `npcspellcastingflag` is a direct alias that provides convenient ScriptCards access to the Beacon data described in the location column. | `Write not verified` |

#### NPC skills — Acrobatics through Medicine

> **Value roles**
>
> - `COMPUTED` — A calculated or aggregated result. Change the named source input rather than writing the result.
>
> **Write using**
>
> - `Write not verified` — Use the alias for reads; no safe ScriptCards write target has been verified.

| Direct alias | ScriptCards read location | Value role | Values / format | Description | Write using |
|---|---|---|---|---|---|
| `npc_acrobatics` | Direct alias: `npc_acrobatics` | `COMPUTED` | Numeric NPC skill compatibility total/base value. | `npc_acrobatics` is a direct alias that provides convenient ScriptCards access to the Beacon data described in the location column. | `Write not verified` |
| `npc_acrobatics_base` | Direct alias: `npc_acrobatics_base` | `COMPUTED` | Numeric NPC skill compatibility total/base value. | `npc_acrobatics_base` is a direct alias that provides convenient ScriptCards access to the Beacon data described in the location column. | `Write not verified` |
| `npc_acrobatics_flag` | Direct alias: `npc_acrobatics_flag` | `COMPUTED` | Compatibility flag/toggle output. Exact legacy representation (`0`/`1`, boolean, blank/text, etc.) was not independently verified; do not assume a writable boolean unless the row names a canonical boolean source. | `npc_acrobatics_flag` is a direct alias that provides convenient ScriptCards access to the Beacon data described in the location column. | `Write not verified` |
| `npc_animal_handling` | Direct alias: `npc_animal_handling` | `COMPUTED` | Numeric NPC skill compatibility total/base value. | `npc_animal_handling` is a direct alias that provides convenient ScriptCards access to the Beacon data described in the location column. | `Write not verified` |
| `npc_animal_handling_base` | Direct alias: `npc_animal_handling_base` | `COMPUTED` | Numeric NPC skill compatibility total/base value. | `npc_animal_handling_base` is a direct alias that provides convenient ScriptCards access to the Beacon data described in the location column. | `Write not verified` |
| `npc_animal_handling_flag` | Direct alias: `npc_animal_handling_flag` | `COMPUTED` | Compatibility flag/toggle output. Exact legacy representation (`0`/`1`, boolean, blank/text, etc.) was not independently verified; do not assume a writable boolean unless the row names a canonical boolean source. | `npc_animal_handling_flag` is a direct alias that provides convenient ScriptCards access to the Beacon data described in the location column. | `Write not verified` |
| `npc_arcana` | Direct alias: `npc_arcana` | `COMPUTED` | Numeric NPC skill compatibility total/base value. | `npc_arcana` is a direct alias that provides convenient ScriptCards access to the Beacon data described in the location column. | `Write not verified` |
| `npc_arcana_base` | Direct alias: `npc_arcana_base` | `COMPUTED` | Numeric NPC skill compatibility total/base value. | `npc_arcana_base` is a direct alias that provides convenient ScriptCards access to the Beacon data described in the location column. | `Write not verified` |
| `npc_arcana_flag` | Direct alias: `npc_arcana_flag` | `COMPUTED` | Compatibility flag/toggle output. Exact legacy representation (`0`/`1`, boolean, blank/text, etc.) was not independently verified; do not assume a writable boolean unless the row names a canonical boolean source. | `npc_arcana_flag` is a direct alias that provides convenient ScriptCards access to the Beacon data described in the location column. | `Write not verified` |
| `npc_athletics` | Direct alias: `npc_athletics` | `COMPUTED` | Numeric NPC skill compatibility total/base value. | `npc_athletics` is a direct alias that provides convenient ScriptCards access to the Beacon data described in the location column. | `Write not verified` |
| `npc_athletics_base` | Direct alias: `npc_athletics_base` | `COMPUTED` | Numeric NPC skill compatibility total/base value. | `npc_athletics_base` is a direct alias that provides convenient ScriptCards access to the Beacon data described in the location column. | `Write not verified` |
| `npc_athletics_flag` | Direct alias: `npc_athletics_flag` | `COMPUTED` | Compatibility flag/toggle output. Exact legacy representation (`0`/`1`, boolean, blank/text, etc.) was not independently verified; do not assume a writable boolean unless the row names a canonical boolean source. | `npc_athletics_flag` is a direct alias that provides convenient ScriptCards access to the Beacon data described in the location column. | `Write not verified` |
| `npc_deception` | Direct alias: `npc_deception` | `COMPUTED` | Numeric NPC skill compatibility total/base value. | `npc_deception` is a direct alias that provides convenient ScriptCards access to the Beacon data described in the location column. | `Write not verified` |
| `npc_deception_base` | Direct alias: `npc_deception_base` | `COMPUTED` | Numeric NPC skill compatibility total/base value. | `npc_deception_base` is a direct alias that provides convenient ScriptCards access to the Beacon data described in the location column. | `Write not verified` |
| `npc_deception_flag` | Direct alias: `npc_deception_flag` | `COMPUTED` | Compatibility flag/toggle output. Exact legacy representation (`0`/`1`, boolean, blank/text, etc.) was not independently verified; do not assume a writable boolean unless the row names a canonical boolean source. | `npc_deception_flag` is a direct alias that provides convenient ScriptCards access to the Beacon data described in the location column. | `Write not verified` |
| `npc_history` | Direct alias: `npc_history` | `COMPUTED` | Numeric NPC skill compatibility total/base value. | `npc_history` is a direct alias that provides convenient ScriptCards access to the Beacon data described in the location column. | `Write not verified` |
| `npc_history_base` | Direct alias: `npc_history_base` | `COMPUTED` | Numeric NPC skill compatibility total/base value. | `npc_history_base` is a direct alias that provides convenient ScriptCards access to the Beacon data described in the location column. | `Write not verified` |
| `npc_history_flag` | Direct alias: `npc_history_flag` | `COMPUTED` | Compatibility flag/toggle output. Exact legacy representation (`0`/`1`, boolean, blank/text, etc.) was not independently verified; do not assume a writable boolean unless the row names a canonical boolean source. | `npc_history_flag` is a direct alias that provides convenient ScriptCards access to the Beacon data described in the location column. | `Write not verified` |
| `npc_insight` | Direct alias: `npc_insight` | `COMPUTED` | Numeric NPC skill compatibility total/base value. | `npc_insight` is a direct alias that provides convenient ScriptCards access to the Beacon data described in the location column. | `Write not verified` |
| `npc_insight_base` | Direct alias: `npc_insight_base` | `COMPUTED` | Numeric NPC skill compatibility total/base value. | `npc_insight_base` is a direct alias that provides convenient ScriptCards access to the Beacon data described in the location column. | `Write not verified` |
| `npc_insight_flag` | Direct alias: `npc_insight_flag` | `COMPUTED` | Compatibility flag/toggle output. Exact legacy representation (`0`/`1`, boolean, blank/text, etc.) was not independently verified; do not assume a writable boolean unless the row names a canonical boolean source. | `npc_insight_flag` is a direct alias that provides convenient ScriptCards access to the Beacon data described in the location column. | `Write not verified` |
| `npc_intimidation` | Direct alias: `npc_intimidation` | `COMPUTED` | Numeric NPC skill compatibility total/base value. | `npc_intimidation` is a direct alias that provides convenient ScriptCards access to the Beacon data described in the location column. | `Write not verified` |
| `npc_intimidation_base` | Direct alias: `npc_intimidation_base` | `COMPUTED` | Numeric NPC skill compatibility total/base value. | `npc_intimidation_base` is a direct alias that provides convenient ScriptCards access to the Beacon data described in the location column. | `Write not verified` |
| `npc_intimidation_flag` | Direct alias: `npc_intimidation_flag` | `COMPUTED` | Compatibility flag/toggle output. Exact legacy representation (`0`/`1`, boolean, blank/text, etc.) was not independently verified; do not assume a writable boolean unless the row names a canonical boolean source. | `npc_intimidation_flag` is a direct alias that provides convenient ScriptCards access to the Beacon data described in the location column. | `Write not verified` |
| `npc_investigation` | Direct alias: `npc_investigation` | `COMPUTED` | Numeric NPC skill compatibility total/base value. | `npc_investigation` is a direct alias that provides convenient ScriptCards access to the Beacon data described in the location column. | `Write not verified` |
| `npc_investigation_base` | Direct alias: `npc_investigation_base` | `COMPUTED` | Numeric NPC skill compatibility total/base value. | `npc_investigation_base` is a direct alias that provides convenient ScriptCards access to the Beacon data described in the location column. | `Write not verified` |
| `npc_investigation_flag` | Direct alias: `npc_investigation_flag` | `COMPUTED` | Compatibility flag/toggle output. Exact legacy representation (`0`/`1`, boolean, blank/text, etc.) was not independently verified; do not assume a writable boolean unless the row names a canonical boolean source. | `npc_investigation_flag` is a direct alias that provides convenient ScriptCards access to the Beacon data described in the location column. | `Write not verified` |
| `npc_medicine` | Direct alias: `npc_medicine` | `COMPUTED` | Numeric NPC skill compatibility total/base value. | `npc_medicine` is a direct alias that provides convenient ScriptCards access to the Beacon data described in the location column. | `Write not verified` |
| `npc_medicine_base` | Direct alias: `npc_medicine_base` | `COMPUTED` | Numeric NPC skill compatibility total/base value. | `npc_medicine_base` is a direct alias that provides convenient ScriptCards access to the Beacon data described in the location column. | `Write not verified` |
| `npc_medicine_flag` | Direct alias: `npc_medicine_flag` | `COMPUTED` | Compatibility flag/toggle output. Exact legacy representation (`0`/`1`, boolean, blank/text, etc.) was not independently verified; do not assume a writable boolean unless the row names a canonical boolean source. | `npc_medicine_flag` is a direct alias that provides convenient ScriptCards access to the Beacon data described in the location column. | `Write not verified` |

#### NPC skills — Nature through Survival

> **Value roles**
>
> - `COMPUTED` — A calculated or aggregated result. Change the named source input rather than writing the result.
>
> **Write using**
>
> - `Write not verified` — Use the alias for reads; no safe ScriptCards write target has been verified.

| Direct alias | ScriptCards read location | Value role | Values / format | Description | Write using |
|---|---|---|---|---|---|
| `npc_nature` | Direct alias: `npc_nature` | `COMPUTED` | Numeric NPC skill compatibility total/base value. | `npc_nature` is a direct alias that provides convenient ScriptCards access to the Beacon data described in the location column. | `Write not verified` |
| `npc_nature_base` | Direct alias: `npc_nature_base` | `COMPUTED` | Numeric NPC skill compatibility total/base value. | `npc_nature_base` is a direct alias that provides convenient ScriptCards access to the Beacon data described in the location column. | `Write not verified` |
| `npc_nature_flag` | Direct alias: `npc_nature_flag` | `COMPUTED` | Compatibility flag/toggle output. Exact legacy representation (`0`/`1`, boolean, blank/text, etc.) was not independently verified; do not assume a writable boolean unless the row names a canonical boolean source. | `npc_nature_flag` is a direct alias that provides convenient ScriptCards access to the Beacon data described in the location column. | `Write not verified` |
| `npc_perception` | Direct alias: `npc_perception` | `COMPUTED` | Numeric NPC skill compatibility total/base value. | `npc_perception` is a direct alias that provides convenient ScriptCards access to the Beacon data described in the location column. | `Write not verified` |
| `npc_perception_base` | Direct alias: `npc_perception_base` | `COMPUTED` | Numeric NPC skill compatibility total/base value. | `npc_perception_base` is a direct alias that provides convenient ScriptCards access to the Beacon data described in the location column. | `Write not verified` |
| `npc_perception_flag` | Direct alias: `npc_perception_flag` | `COMPUTED` | Compatibility flag/toggle output. Exact legacy representation (`0`/`1`, boolean, blank/text, etc.) was not independently verified; do not assume a writable boolean unless the row names a canonical boolean source. | `npc_perception_flag` is a direct alias that provides convenient ScriptCards access to the Beacon data described in the location column. | `Write not verified` |
| `npc_performance` | Direct alias: `npc_performance` | `COMPUTED` | Numeric NPC skill compatibility total/base value. | `npc_performance` is a direct alias that provides convenient ScriptCards access to the Beacon data described in the location column. | `Write not verified` |
| `npc_performance_base` | Direct alias: `npc_performance_base` | `COMPUTED` | Numeric NPC skill compatibility total/base value. | `npc_performance_base` is a direct alias that provides convenient ScriptCards access to the Beacon data described in the location column. | `Write not verified` |
| `npc_performance_flag` | Direct alias: `npc_performance_flag` | `COMPUTED` | Compatibility flag/toggle output. Exact legacy representation (`0`/`1`, boolean, blank/text, etc.) was not independently verified; do not assume a writable boolean unless the row names a canonical boolean source. | `npc_performance_flag` is a direct alias that provides convenient ScriptCards access to the Beacon data described in the location column. | `Write not verified` |
| `npc_persuasion` | Direct alias: `npc_persuasion` | `COMPUTED` | Numeric NPC skill compatibility total/base value. | `npc_persuasion` is a direct alias that provides convenient ScriptCards access to the Beacon data described in the location column. | `Write not verified` |
| `npc_persuasion_base` | Direct alias: `npc_persuasion_base` | `COMPUTED` | Numeric NPC skill compatibility total/base value. | `npc_persuasion_base` is a direct alias that provides convenient ScriptCards access to the Beacon data described in the location column. | `Write not verified` |
| `npc_persuasion_flag` | Direct alias: `npc_persuasion_flag` | `COMPUTED` | Compatibility flag/toggle output. Exact legacy representation (`0`/`1`, boolean, blank/text, etc.) was not independently verified; do not assume a writable boolean unless the row names a canonical boolean source. | `npc_persuasion_flag` is a direct alias that provides convenient ScriptCards access to the Beacon data described in the location column. | `Write not verified` |
| `npc_religion` | Direct alias: `npc_religion` | `COMPUTED` | Numeric NPC skill compatibility total/base value. | `npc_religion` is a direct alias that provides convenient ScriptCards access to the Beacon data described in the location column. | `Write not verified` |
| `npc_religion_base` | Direct alias: `npc_religion_base` | `COMPUTED` | Numeric NPC skill compatibility total/base value. | `npc_religion_base` is a direct alias that provides convenient ScriptCards access to the Beacon data described in the location column. | `Write not verified` |
| `npc_religion_flag` | Direct alias: `npc_religion_flag` | `COMPUTED` | Compatibility flag/toggle output. Exact legacy representation (`0`/`1`, boolean, blank/text, etc.) was not independently verified; do not assume a writable boolean unless the row names a canonical boolean source. | `npc_religion_flag` is a direct alias that provides convenient ScriptCards access to the Beacon data described in the location column. | `Write not verified` |
| `npc_sleight_of_hand` | Direct alias: `npc_sleight_of_hand` | `COMPUTED` | Numeric NPC skill compatibility total/base value. | `npc_sleight_of_hand` is a direct alias that provides convenient ScriptCards access to the Beacon data described in the location column. | `Write not verified` |
| `npc_sleight_of_hand_base` | Direct alias: `npc_sleight_of_hand_base` | `COMPUTED` | Numeric NPC skill compatibility total/base value. | `npc_sleight_of_hand_base` is a direct alias that provides convenient ScriptCards access to the Beacon data described in the location column. | `Write not verified` |
| `npc_sleight_of_hand_flag` | Direct alias: `npc_sleight_of_hand_flag` | `COMPUTED` | Compatibility flag/toggle output. Exact legacy representation (`0`/`1`, boolean, blank/text, etc.) was not independently verified; do not assume a writable boolean unless the row names a canonical boolean source. | `npc_sleight_of_hand_flag` is a direct alias that provides convenient ScriptCards access to the Beacon data described in the location column. | `Write not verified` |
| `npc_stealth` | Direct alias: `npc_stealth` | `COMPUTED` | Numeric NPC skill compatibility total/base value. | `npc_stealth` is a direct alias that provides convenient ScriptCards access to the Beacon data described in the location column. | `Write not verified` |
| `npc_stealth_base` | Direct alias: `npc_stealth_base` | `COMPUTED` | Numeric NPC skill compatibility total/base value. | `npc_stealth_base` is a direct alias that provides convenient ScriptCards access to the Beacon data described in the location column. | `Write not verified` |
| `npc_stealth_flag` | Direct alias: `npc_stealth_flag` | `COMPUTED` | Compatibility flag/toggle output. Exact legacy representation (`0`/`1`, boolean, blank/text, etc.) was not independently verified; do not assume a writable boolean unless the row names a canonical boolean source. | `npc_stealth_flag` is a direct alias that provides convenient ScriptCards access to the Beacon data described in the location column. | `Write not verified` |
| `npc_survival` | Direct alias: `npc_survival` | `COMPUTED` | Numeric NPC skill compatibility total/base value. | `npc_survival` is a direct alias that provides convenient ScriptCards access to the Beacon data described in the location column. | `Write not verified` |
| `npc_survival_base` | Direct alias: `npc_survival_base` | `COMPUTED` | Numeric NPC skill compatibility total/base value. | `npc_survival_base` is a direct alias that provides convenient ScriptCards access to the Beacon data described in the location column. | `Write not verified` |
| `npc_survival_flag` | Direct alias: `npc_survival_flag` | `COMPUTED` | Compatibility flag/toggle output. Exact legacy representation (`0`/`1`, boolean, blank/text, etc.) was not independently verified; do not assume a writable boolean unless the row names a canonical boolean source. | `npc_survival_flag` is a direct alias that provides convenient ScriptCards access to the Beacon data described in the location column. | `Write not verified` |

#### NPC saving throws

> **Value roles**
>
> - `COMPUTED` — A calculated or aggregated result. Change the named source input rather than writing the result.
>
> **Write using**
>
> - `Write not verified` — Use the alias for reads; no safe ScriptCards write target has been verified.

| Direct alias | ScriptCards read location | Value role | Values / format | Description | Write using |
|---|---|---|---|---|---|
| `npc_cha_negative` | Direct alias: `npc_cha_negative` | `COMPUTED` | Compatibility output — the exact returned value domain was not independently verified in the controlled probes. | `npc_cha_negative` is a direct alias that provides convenient ScriptCards access to the Beacon data described in the location column. | `Write not verified` |
| `npc_cha_save` | Direct alias: `npc_cha_save` | `COMPUTED` | Numeric NPC saving-throw compatibility total/base value. | `npc_cha_save` is a direct alias that provides convenient ScriptCards access to the Beacon data described in the location column. | `Write not verified` |
| `npc_cha_save_base` | Direct alias: `npc_cha_save_base` | `COMPUTED` | Numeric NPC saving-throw compatibility total/base value. | `npc_cha_save_base` is a direct alias that provides convenient ScriptCards access to the Beacon data described in the location column. | `Write not verified` |
| `npc_cha_save_flag` | Direct alias: `npc_cha_save_flag` | `COMPUTED` | Compatibility flag/toggle output. Exact legacy representation (`0`/`1`, boolean, blank/text, etc.) was not independently verified; do not assume a writable boolean unless the row names a canonical boolean source. | `npc_cha_save_flag` is a direct alias that provides convenient ScriptCards access to the Beacon data described in the location column. | `Write not verified` |
| `npc_con_negative` | Direct alias: `npc_con_negative` | `COMPUTED` | Compatibility output — the exact returned value domain was not independently verified in the controlled probes. | `npc_con_negative` is a direct alias that provides convenient ScriptCards access to the Beacon data described in the location column. | `Write not verified` |
| `npc_con_save` | Direct alias: `npc_con_save` | `COMPUTED` | Numeric NPC saving-throw compatibility total/base value. | `npc_con_save` is a direct alias that provides convenient ScriptCards access to the Beacon data described in the location column. | `Write not verified` |
| `npc_con_save_base` | Direct alias: `npc_con_save_base` | `COMPUTED` | Numeric NPC saving-throw compatibility total/base value. | `npc_con_save_base` is a direct alias that provides convenient ScriptCards access to the Beacon data described in the location column. | `Write not verified` |
| `npc_con_save_flag` | Direct alias: `npc_con_save_flag` | `COMPUTED` | Compatibility flag/toggle output. Exact legacy representation (`0`/`1`, boolean, blank/text, etc.) was not independently verified; do not assume a writable boolean unless the row names a canonical boolean source. | `npc_con_save_flag` is a direct alias that provides convenient ScriptCards access to the Beacon data described in the location column. | `Write not verified` |
| `npc_dex_negative` | Direct alias: `npc_dex_negative` | `COMPUTED` | Compatibility output — the exact returned value domain was not independently verified in the controlled probes. | `npc_dex_negative` is a direct alias that provides convenient ScriptCards access to the Beacon data described in the location column. | `Write not verified` |
| `npc_dex_save` | Direct alias: `npc_dex_save` | `COMPUTED` | Numeric NPC saving-throw compatibility total/base value. | `npc_dex_save` is a direct alias that provides convenient ScriptCards access to the Beacon data described in the location column. | `Write not verified` |
| `npc_dex_save_base` | Direct alias: `npc_dex_save_base` | `COMPUTED` | Numeric NPC saving-throw compatibility total/base value. | `npc_dex_save_base` is a direct alias that provides convenient ScriptCards access to the Beacon data described in the location column. | `Write not verified` |
| `npc_dex_save_flag` | Direct alias: `npc_dex_save_flag` | `COMPUTED` | Compatibility flag/toggle output. Exact legacy representation (`0`/`1`, boolean, blank/text, etc.) was not independently verified; do not assume a writable boolean unless the row names a canonical boolean source. | `npc_dex_save_flag` is a direct alias that provides convenient ScriptCards access to the Beacon data described in the location column. | `Write not verified` |
| `npc_int_negative` | Direct alias: `npc_int_negative` | `COMPUTED` | Compatibility output — the exact returned value domain was not independently verified in the controlled probes. | `npc_int_negative` is a direct alias that provides convenient ScriptCards access to the Beacon data described in the location column. | `Write not verified` |
| `npc_int_save` | Direct alias: `npc_int_save` | `COMPUTED` | Numeric NPC saving-throw compatibility total/base value. | `npc_int_save` is a direct alias that provides convenient ScriptCards access to the Beacon data described in the location column. | `Write not verified` |
| `npc_int_save_base` | Direct alias: `npc_int_save_base` | `COMPUTED` | Numeric NPC saving-throw compatibility total/base value. | `npc_int_save_base` is a direct alias that provides convenient ScriptCards access to the Beacon data described in the location column. | `Write not verified` |
| `npc_int_save_flag` | Direct alias: `npc_int_save_flag` | `COMPUTED` | Compatibility flag/toggle output. Exact legacy representation (`0`/`1`, boolean, blank/text, etc.) was not independently verified; do not assume a writable boolean unless the row names a canonical boolean source. | `npc_int_save_flag` is a direct alias that provides convenient ScriptCards access to the Beacon data described in the location column. | `Write not verified` |
| `npc_str_negative` | Direct alias: `npc_str_negative` | `COMPUTED` | Compatibility output — the exact returned value domain was not independently verified in the controlled probes. | `npc_str_negative` is a direct alias that provides convenient ScriptCards access to the Beacon data described in the location column. | `Write not verified` |
| `npc_str_save` | Direct alias: `npc_str_save` | `COMPUTED` | Numeric NPC saving-throw compatibility total/base value. | `npc_str_save` is a direct alias that provides convenient ScriptCards access to the Beacon data described in the location column. | `Write not verified` |
| `npc_str_save_base` | Direct alias: `npc_str_save_base` | `COMPUTED` | Numeric NPC saving-throw compatibility total/base value. | `npc_str_save_base` is a direct alias that provides convenient ScriptCards access to the Beacon data described in the location column. | `Write not verified` |
| `npc_str_save_flag` | Direct alias: `npc_str_save_flag` | `COMPUTED` | Compatibility flag/toggle output. Exact legacy representation (`0`/`1`, boolean, blank/text, etc.) was not independently verified; do not assume a writable boolean unless the row names a canonical boolean source. | `npc_str_save_flag` is a direct alias that provides convenient ScriptCards access to the Beacon data described in the location column. | `Write not verified` |
| `npc_wis_negative` | Direct alias: `npc_wis_negative` | `COMPUTED` | Compatibility output — the exact returned value domain was not independently verified in the controlled probes. | `npc_wis_negative` is a direct alias that provides convenient ScriptCards access to the Beacon data described in the location column. | `Write not verified` |
| `npc_wis_save` | Direct alias: `npc_wis_save` | `COMPUTED` | Numeric NPC saving-throw compatibility total/base value. | `npc_wis_save` is a direct alias that provides convenient ScriptCards access to the Beacon data described in the location column. | `Write not verified` |
| `npc_wis_save_base` | Direct alias: `npc_wis_save_base` | `COMPUTED` | Numeric NPC saving-throw compatibility total/base value. | `npc_wis_save_base` is a direct alias that provides convenient ScriptCards access to the Beacon data described in the location column. | `Write not verified` |
| `npc_wis_save_flag` | Direct alias: `npc_wis_save_flag` | `COMPUTED` | Compatibility flag/toggle output. Exact legacy representation (`0`/`1`, boolean, blank/text, etc.) was not independently verified; do not assume a writable boolean unless the row names a canonical boolean source. | `npc_wis_save_flag` is a direct alias that provides convenient ScriptCards access to the Beacon data described in the location column. | `Write not verified` |

#### Repeating attack fields

> **Value roles**
>
> - `COMPUTED` — A calculated or aggregated result. Change the named source input rather than writing the result.
>
> **Write using**
>
> - `Write not verified` — Use the alias for reads; no safe ScriptCards write target has been verified.

| Direct alias | ScriptCards read location | Value role | Values / format | Description | Write using |
|---|---|---|---|---|---|
| `atk_desc` | Direct alias: `atk_desc` | `COMPUTED` | Text/string — content is record-specific; blank may be meaningful. | `atk_desc` is a direct alias that provides convenient ScriptCards access to the Beacon data described in the location column. | `Write not verified` |
| `atkattr_base` | Direct alias: `atkattr_base` | `COMPUTED` | Numeric or numeric-form compatibility output. Exact formatting (for example signed text versus number) was not independently probed where this is a legacy projection. | `atkattr_base` is a direct alias that provides convenient ScriptCards access to the Beacon data described in the location column. | `Write not verified` |
| `atkbonus` | Direct alias: `atkbonus` | `COMPUTED` | Numeric or numeric-form compatibility output. Exact formatting (for example signed text versus number) was not independently probed where this is a legacy projection. | `atkbonus` is a direct alias that provides convenient ScriptCards access to the Beacon data described in the location column. | `Write not verified` |
| `atkcritrange` | Direct alias: `atkcritrange` | `COMPUTED` | Compatibility output — the exact returned value domain was not independently verified in the controlled probes. | `atkcritrange` is a direct alias that provides convenient ScriptCards access to the Beacon data described in the location column. | `Write not verified` |
| `atkdmgtype` | Direct alias: `atkdmgtype` | `COMPUTED` | Text/string — content is record-specific; blank may be meaningful. | `atkdmgtype` is a direct alias that provides convenient ScriptCards access to the Beacon data described in the location column. | `Write not verified` |
| `atkflag` | Direct alias: `atkflag` | `COMPUTED` | Compatibility flag/toggle output. Exact legacy representation (`0`/`1`, boolean, blank/text, etc.) was not independently verified; do not assume a writable boolean unless the row names a canonical boolean source. | `atkflag` is a direct alias that provides convenient ScriptCards access to the Beacon data described in the location column. | `Write not verified` |
| `atkmagic` | Direct alias: `atkmagic` | `COMPUTED` | Compatibility output — the exact returned value domain was not independently verified in the controlled probes. | `atkmagic` is a direct alias that provides convenient ScriptCards access to the Beacon data described in the location column. | `Write not verified` |
| `atkmod` | Direct alias: `atkmod` | `COMPUTED` | Numeric or numeric-form compatibility output. Exact formatting (for example signed text versus number) was not independently probed where this is a legacy projection. | `atkmod` is a direct alias that provides convenient ScriptCards access to the Beacon data described in the location column. | `Write not verified` |
| `atkname` | Direct alias: `atkname` | `COMPUTED` | Text/string — content is record-specific; blank may be meaningful. | `atkname` is a direct alias that provides convenient ScriptCards access to the Beacon data described in the location column. | `Write not verified` |
| `atkprofflag` | Direct alias: `atkprofflag` | `COMPUTED` | Compatibility flag/toggle output. Exact legacy representation (`0`/`1`, boolean, blank/text, etc.) was not independently verified; do not assume a writable boolean unless the row names a canonical boolean source. | `atkprofflag` is a direct alias that provides convenient ScriptCards access to the Beacon data described in the location column. | `Write not verified` |
| `atkrange` | Direct alias: `atkrange` | `COMPUTED` | Text/string — content is record-specific; blank may be meaningful. | `atkrange` is a direct alias that provides convenient ScriptCards access to the Beacon data described in the location column. | `Write not verified` |
| `attack_crit` | Direct alias: `attack_crit` | `COMPUTED` | Compatibility output — the exact returned value domain was not independently verified in the controlled probes. | `attack_crit` is a direct alias that provides convenient ScriptCards access to the Beacon data described in the location column. | `Write not verified` |
| `attack_crit2` | Direct alias: `attack_crit2` | `COMPUTED` | Compatibility output — the exact returned value domain was not independently verified in the controlled probes. | `attack_crit2` is a direct alias that provides convenient ScriptCards access to the Beacon data described in the location column. | `Write not verified` |
| `attack_damage` | Direct alias: `attack_damage` | `COMPUTED` | Numeric or numeric-form compatibility output. Exact formatting (for example signed text versus number) was not independently probed where this is a legacy projection. | `attack_damage` is a direct alias that provides convenient ScriptCards access to the Beacon data described in the location column. | `Write not verified` |
| `attack_damage2` | Direct alias: `attack_damage2` | `COMPUTED` | Numeric or numeric-form compatibility output. Exact formatting (for example signed text versus number) was not independently probed where this is a legacy projection. | `attack_damage2` is a direct alias that provides convenient ScriptCards access to the Beacon data described in the location column. | `Write not verified` |
| `attack_damagetype` | Direct alias: `attack_damagetype` | `COMPUTED` | Text/string — content is record-specific; blank may be meaningful. | `attack_damagetype` is a direct alias that provides convenient ScriptCards access to the Beacon data described in the location column. | `Write not verified` |
| `attack_damagetype2` | Direct alias: `attack_damagetype2` | `COMPUTED` | Text/string — content is record-specific; blank may be meaningful. | `attack_damagetype2` is a direct alias that provides convenient ScriptCards access to the Beacon data described in the location column. | `Write not verified` |
| `attack_flag` | Direct alias: `attack_flag` | `COMPUTED` | Compatibility flag/toggle output. Exact legacy representation (`0`/`1`, boolean, blank/text, etc.) was not independently verified; do not assume a writable boolean unless the row names a canonical boolean source. | `attack_flag` is a direct alias that provides convenient ScriptCards access to the Beacon data described in the location column. | `Write not verified` |
| `attack_onhit` | Direct alias: `attack_onhit` | `COMPUTED` | Text/string — content is record-specific; blank may be meaningful. | `attack_onhit` is a direct alias that provides convenient ScriptCards access to the Beacon data described in the location column. | `Write not verified` |
| `attack_range` | Direct alias: `attack_range` | `COMPUTED` | Text/string — content is record-specific; blank may be meaningful. | `attack_range` is a direct alias that provides convenient ScriptCards access to the Beacon data described in the location column. | `Write not verified` |
| `attack_target` | Direct alias: `attack_target` | `COMPUTED` | Text/string — content is record-specific; blank may be meaningful. | `attack_target` is a direct alias that provides convenient ScriptCards access to the Beacon data described in the location column. | `Write not verified` |
| `attack_tohit` | Direct alias: `attack_tohit` | `COMPUTED` | Numeric or numeric-form compatibility output. Exact formatting (for example signed text versus number) was not independently probed where this is a legacy projection. | `attack_tohit` is a direct alias that provides convenient ScriptCards access to the Beacon data described in the location column. | `Write not verified` |
| `attack_tohitrange` | Direct alias: `attack_tohitrange` | `COMPUTED` | Compatibility output — the exact returned value domain was not independently verified in the controlled probes. | `attack_tohitrange` is a direct alias that provides convenient ScriptCards access to the Beacon data described in the location column. | `Write not verified` |
| `attack_type` | Direct alias: `attack_type` | `COMPUTED` | Text/string — content is record-specific; blank may be meaningful. | `attack_type` is a direct alias that provides convenient ScriptCards access to the Beacon data described in the location column. | `Write not verified` |
| `desc` | Direct alias: `desc` | `COMPUTED` | Text/string — content is record-specific; blank may be meaningful. | `desc` is a direct alias that provides convenient ScriptCards access to the Beacon data described in the location column. | `Write not verified` |
| `description` | Direct alias: `description` | `COMPUTED` | Text/string — content is record-specific; blank may be meaningful. | `description` is a direct alias that provides convenient ScriptCards access to the Beacon data described in the location column. | `Write not verified` |
| `hasattack` | Direct alias: `hasattack` | `COMPUTED` | Compatibility output — the exact returned value domain was not independently verified in the controlled probes. | `hasattack` is a direct alias that provides convenient ScriptCards access to the Beacon data described in the location column. | `Write not verified` |
| `includedesc` | Direct alias: `includedesc` | `COMPUTED` | Compatibility output — the exact returned value domain was not independently verified in the controlled probes. | `includedesc` is a direct alias that provides convenient ScriptCards access to the Beacon data described in the location column. | `Write not verified` |
| `mod` | Direct alias: `mod` | `COMPUTED` | Numeric or numeric-form compatibility output. Exact formatting (for example signed text versus number) was not independently probed where this is a legacy projection. | `mod` is a direct alias that provides convenient ScriptCards access to the Beacon data described in the location column. | `Write not verified` |
| `show_desc` | Direct alias: `show_desc` | `COMPUTED` | Compatibility output — the exact returned value domain was not independently verified in the controlled probes. | `show_desc` is a direct alias that provides convenient ScriptCards access to the Beacon data described in the location column. | `Write not verified` |

#### Repeating damage fields

> **Value roles**
>
> - `COMPUTED` — A calculated or aggregated result. Change the named source input rather than writing the result.
>
> **Write using**
>
> - `Write not verified` — Use the alias for reads; no safe ScriptCards write target has been verified.

| Direct alias | ScriptCards read location | Value role | Values / format | Description | Write using |
|---|---|---|---|---|---|
| `damage_flag` | Direct alias: `damage_flag` | `COMPUTED` | Compatibility flag/toggle output. Exact legacy representation (`0`/`1`, boolean, blank/text, etc.) was not independently verified; do not assume a writable boolean unless the row names a canonical boolean source. | `damage_flag` is a direct alias that provides convenient ScriptCards access to the Beacon data described in the location column. | `Write not verified` |
| `dmg2attr` | Direct alias: `dmg2attr` | `COMPUTED` | Compatibility output — the exact returned value domain was not independently verified in the controlled probes. | `dmg2attr` is a direct alias that provides convenient ScriptCards access to the Beacon data described in the location column. | `Write not verified` |
| `dmg2base` | Direct alias: `dmg2base` | `COMPUTED` | Compatibility output — the exact returned value domain was not independently verified in the controlled probes. | `dmg2base` is a direct alias that provides convenient ScriptCards access to the Beacon data described in the location column. | `Write not verified` |
| `dmg2custcrit` | Direct alias: `dmg2custcrit` | `COMPUTED` | Compatibility output — the exact returned value domain was not independently verified in the controlled probes. | `dmg2custcrit` is a direct alias that provides convenient ScriptCards access to the Beacon data described in the location column. | `Write not verified` |
| `dmg2flag` | Direct alias: `dmg2flag` | `COMPUTED` | Compatibility flag/toggle output. Exact legacy representation (`0`/`1`, boolean, blank/text, etc.) was not independently verified; do not assume a writable boolean unless the row names a canonical boolean source. | `dmg2flag` is a direct alias that provides convenient ScriptCards access to the Beacon data described in the location column. | `Write not verified` |
| `dmg2mod` | Direct alias: `dmg2mod` | `COMPUTED` | Numeric or numeric-form compatibility output. Exact formatting (for example signed text versus number) was not independently probed where this is a legacy projection. | `dmg2mod` is a direct alias that provides convenient ScriptCards access to the Beacon data described in the location column. | `Write not verified` |
| `dmg2type` | Direct alias: `dmg2type` | `COMPUTED` | Text/string — content is record-specific; blank may be meaningful. | `dmg2type` is a direct alias that provides convenient ScriptCards access to the Beacon data described in the location column. | `Write not verified` |
| `dmgattr` | Direct alias: `dmgattr` | `COMPUTED` | Compatibility output — the exact returned value domain was not independently verified in the controlled probes. | `dmgattr` is a direct alias that provides convenient ScriptCards access to the Beacon data described in the location column. | `Write not verified` |
| `dmgbase` | Direct alias: `dmgbase` | `COMPUTED` | Compatibility output — the exact returned value domain was not independently verified in the controlled probes. | `dmgbase` is a direct alias that provides convenient ScriptCards access to the Beacon data described in the location column. | `Write not verified` |
| `dmgcustcrit` | Direct alias: `dmgcustcrit` | `COMPUTED` | Compatibility output — the exact returned value domain was not independently verified in the controlled probes. | `dmgcustcrit` is a direct alias that provides convenient ScriptCards access to the Beacon data described in the location column. | `Write not verified` |
| `dmgflag` | Direct alias: `dmgflag` | `COMPUTED` | Compatibility flag/toggle output. Exact legacy representation (`0`/`1`, boolean, blank/text, etc.) was not independently verified; do not assume a writable boolean unless the row names a canonical boolean source. | `dmgflag` is a direct alias that provides convenient ScriptCards access to the Beacon data described in the location column. | `Write not verified` |
| `dmgmod` | Direct alias: `dmgmod` | `COMPUTED` | Numeric or numeric-form compatibility output. Exact formatting (for example signed text versus number) was not independently probed where this is a legacy projection. | `dmgmod` is a direct alias that provides convenient ScriptCards access to the Beacon data described in the location column. | `Write not verified` |
| `dmgtype` | Direct alias: `dmgtype` | `COMPUTED` | Text/string — content is record-specific; blank may be meaningful. | `dmgtype` is a direct alias that provides convenient ScriptCards access to the Beacon data described in the location column. | `Write not verified` |
| `hldmg` | Direct alias: `hldmg` | `COMPUTED` | Compatibility output — the exact returned value domain was not independently verified in the controlled probes. | `hldmg` is a direct alias that provides convenient ScriptCards access to the Beacon data described in the location column. | `Write not verified` |

#### Roll and save output aliases

> **Value roles**
>
> - `COMPUTED` — A calculated or aggregated result. Change the named source input rather than writing the result.
>
> **Write using**
>
> - `Write not verified` — Use the alias for reads; no safe ScriptCards write target has been verified.

| Direct alias | ScriptCards read location | Value role | Values / format | Description | Write using |
|---|---|---|---|---|---|
| `advantagetoggle` | Direct alias: `advantagetoggle`<br>Structured path: `sheet->settings->rolls->mode` | `COMPUTED` | Legacy roll-mode compatibility output backed by `sheet->settings->rolls->mode`. Controlled sheet-state values include `Advantage` and `Disadvantage`; exact legacy output formatting was not independently probed. | `advantagetoggle` is a direct alias that provides convenient ScriptCards access to the Beacon data described in the location column. | `Write not verified` |
| `core_die` | Direct alias: `core_die` | `COMPUTED` | Compatibility output — the exact returned value domain was not independently verified in the controlled probes. | `core_die` is a direct alias that provides convenient ScriptCards access to the Beacon data described in the location column. | `Write not verified` |
| `d20` | Direct alias: `d20`<br>Structured path: `sheet->settings->rolls->mode` | `COMPUTED` | Legacy d20 roll-expression compatibility output derived from `sheet->settings->rolls->mode`; do not assume the raw stored mode string is returned unchanged. | `d20` is a direct alias that provides convenient ScriptCards access to the Beacon data described in the location column. | `Write not verified` |
| `dflag` | Direct alias: `dflag` | `COMPUTED` | Compatibility flag/toggle output. Exact legacy representation (`0`/`1`, boolean, blank/text, etc.) was not independently verified; do not assume a writable boolean unless the row names a canonical boolean source. | `dflag` is a direct alias that provides convenient ScriptCards access to the Beacon data described in the location column. | `Write not verified` |
| `rollbase` | Direct alias: `rollbase` | `COMPUTED` | Compatibility output — the exact returned value domain was not independently verified in the controlled probes. | `rollbase` is a direct alias that provides convenient ScriptCards access to the Beacon data described in the location column. | `Write not verified` |
| `rollbase_crit` | Direct alias: `rollbase_crit` | `COMPUTED` | Compatibility output — the exact returned value domain was not independently verified in the controlled probes. | `rollbase_crit` is a direct alias that provides convenient ScriptCards access to the Beacon data described in the location column. | `Write not verified` |
| `rollbase_dmg` | Direct alias: `rollbase_dmg` | `COMPUTED` | Compatibility output — the exact returned value domain was not independently verified in the controlled probes. | `rollbase_dmg` is a direct alias that provides convenient ScriptCards access to the Beacon data described in the location column. | `Write not verified` |
| `rollcontent` | Direct alias: `rollcontent` | `COMPUTED` | Text/string — content is record-specific; blank may be meaningful. | `rollcontent` is a direct alias that provides convenient ScriptCards access to the Beacon data described in the location column. | `Write not verified` |
| `rtype` | Direct alias: `rtype`<br>Structured path: `sheet->settings->rolls->mode` | `COMPUTED` | Legacy roll-type compatibility output derived from `sheet->settings->rolls->mode`; exact translated output literals were not independently probed. | `rtype` is a direct alias that provides convenient ScriptCards access to the Beacon data described in the location column. | `Write not verified` |
| `saveattr` | Direct alias: `saveattr` | `COMPUTED` | Text/string — content is record-specific; blank may be meaningful. | `saveattr` is a direct alias that provides convenient ScriptCards access to the Beacon data described in the location column. | `Write not verified` |
| `savedc` | Direct alias: `savedc` | `COMPUTED` | Compatibility output — the exact returned value domain was not independently verified in the controlled probes. | `savedc` is a direct alias that provides convenient ScriptCards access to the Beacon data described in the location column. | `Write not verified` |
| `saveeffect` | Direct alias: `saveeffect` | `COMPUTED` | Text/string — content is record-specific; blank may be meaningful. | `saveeffect` is a direct alias that provides convenient ScriptCards access to the Beacon data described in the location column. | `Write not verified` |
| `saveflag` | Direct alias: `saveflag` | `COMPUTED` | Compatibility flag/toggle output. Exact legacy representation (`0`/`1`, boolean, blank/text, etc.) was not independently verified; do not assume a writable boolean unless the row names a canonical boolean source. | `saveflag` is a direct alias that provides convenient ScriptCards access to the Beacon data described in the location column. | `Write not verified` |
| `saveflat` | Direct alias: `saveflat` | `COMPUTED` | Compatibility output — the exact returned value domain was not independently verified in the controlled probes. | `saveflat` is a direct alias that provides convenient ScriptCards access to the Beacon data described in the location column. | `Write not verified` |
| `whispertoggle` | Direct alias: `whispertoggle`<br>Structured path: `sheet->settings->rolls->privacy` | `COMPUTED` | Legacy whisper/privacy compatibility output derived from `sheet->settings->rolls->privacy`; the structured setting stores the sheet's public/GM/private visibility state. | `whispertoggle` is a direct alias that provides convenient ScriptCards access to the Beacon data described in the location column. | `Write not verified` — Legacy roll-output formatting; use `sheet->settings->rolls->privacy` for new Beacon logic. |
| `wtype` | Direct alias: `wtype`<br>Structured path: `sheet->settings->rolls->privacy` | `COMPUTED` | Legacy whisper/privacy compatibility output derived from `sheet->settings->rolls->privacy`; the structured setting stores the sheet's public/GM/private visibility state. | `wtype` is a direct alias that provides convenient ScriptCards access to the Beacon data described in the location column. | `Write not verified` — Legacy roll-output formatting; use `sheet->settings->rolls->privacy` for new Beacon logic. |

#### Repeating spells

> **Value roles**
>
> - `SYNTH` — A compatibility projection assembled from the parent and linked typed records named in the row.
> - `UNKNOWN` — The character-level direct alias is not exposed by the verified Beacon build.
>
> **Write using**
>
> - `Parent typed record` — Edit the existing record or records labeled `Parent typed record:` or `Parent typed records:` in the row.

| Direct alias | ScriptCards read location | Value role | Values / format | Description | Write using |
|---|---|---|---|---|---|
| `caster_level` | Direct alias: `caster_level`<br>Parent typed records: `spells`; linked `spellcastings`, `attacks`, `damages`, `upcastings`, and `classlevels` as applicable | `SYNTH` | Number — use a numeric value. The meaningful range depends on the field; no additional range is implied unless stated here. | `caster_level` is a synthetic compatibility field generated from canonical Beacon records rather than an independent stored attribute. | `Parent typed record` |
| `spell_ability` | Character-level direct alias: not exposed in the verified Beacon build<br>Verified fallback result: missing `user.spell_ability` Custom Attribute<br>Canonical source: `spellcastings->[selector]->ability` | `UNKNOWN` | Text/string — content is record-specific; blank may be meaningful. | A bare `spell_ability` read falls through to the classic custom-attribute fallback and produces a missing Custom Attribute error. Use the intended Spellcasting record's `ability`; a repeating-spell compatibility row may still expose its own row-level spell ability. | `Parent typed record` — Locate the intended Spellcasting record and change its `ability`. |
| `spell_attack_bonus` | Direct alias: `spell_attack_bonus`<br>Sheet-wide compatibility result; contributing records include `spellcastings`, `rollbonuses`, `abilityscores`, and `classlevels` as applicable | `SYNTH` | Number — use a numeric value. The meaningful range depends on the field; no additional range is implied unless stated here. | Singular sheet-wide compatibility result, not a separate attack bonus for every Spellcasting record. ScriptCards reconstructs it locally only when active Spellcasting records agree on one ability and applicable spell-targeted Roll Bonuses are verified roll-mode or flat numeric modifiers; otherwise the native sheet result remains authoritative. | `Parent typed record` — Change the intended Spellcasting record's `ability` or another contributing canonical input. Do not assume this singular alias represents every spellcasting source. |
| `spell_attack_mod` | Direct alias: `spell_attack_mod`<br>Locally reconstructed from the agreed sheet-wide Spellcasting ability when unambiguous; otherwise native compatibility result | `SYNTH` | Number — use a numeric value. The meaningful range depends on the field; no additional range is implied unless stated here. | Singular compatibility modifier paired with `spell_attack_bonus`; it is not a per-Spellcasting-record modifier on characters with multiple spellcasting sources. ScriptCards returns the selected casting ability modifier locally when active Spellcasting records agree on one ability. | `Parent typed record` — Change the intended Spellcasting record's `ability` or another contributing canonical input. |
| `spell_damage_progression` | Direct alias: `spell_damage_progression`<br>Parent typed records: `spells`; linked `spellcastings`, `attacks`, `damages`, `upcastings`, and `classlevels` as applicable | `SYNTH` | Synthetic compatibility output assembled from canonical records; exact legacy formatting is record-dependent unless a canonical source is named in this row. | `spell_damage_progression` is a synthetic compatibility field generated from canonical Beacon records rather than an independent stored attribute. | `Parent typed record` |
| `spell_dc_mod` | Direct alias: `spell_dc_mod`<br>Locally reconstructed from the agreed sheet-wide Spellcasting ability when unambiguous; otherwise native compatibility result | `SYNTH` | Number — use a numeric value. The meaningful range depends on the field; no additional range is implied unless stated here. | Singular compatibility modifier paired with `spell_save_dc`; it is not a per-Spellcasting-record modifier on characters with multiple spellcasting sources. ScriptCards returns the selected casting ability modifier locally when active Spellcasting records agree on one ability, including numeric `0`. | `Parent typed record` — Change the intended Spellcasting record's `ability` or another contributing canonical input. |
| `spell_innate` | Direct alias: `spell_innate`<br>Parent typed records: `spells`; linked `spellcastings`, `attacks`, `damages`, `upcastings`, and `classlevels` as applicable | `SYNTH` | Boolean — stored as `true` / `false`. ScriptCards structured writes also accept `1`/`0`, `yes`/`no`, and `on`/`off`. | `spell_innate` is a synthetic compatibility field generated from canonical Beacon records rather than an independent stored attribute. | `Parent typed record` |
| `spell_save_dc` | Direct alias: `spell_save_dc`<br>Sheet-wide compatibility result; contributing records include `spellcastings`, `rollbonuses`, `abilityscores`, and `classlevels` as applicable | `SYNTH` | Number — use a numeric value. The meaningful range depends on the field; no additional range is implied unless stated here. | Singular sheet-wide compatibility result, not a separate save DC for every Spellcasting record. ScriptCards reconstructs it locally only when active Spellcasting records agree on one ability and applicable spell-targeted Roll Bonuses are verified roll-mode or flat numeric modifiers; otherwise the native sheet result remains authoritative. | `Parent typed record` — Change the intended Spellcasting record's `ability` or another contributing canonical input. Do not assume this singular alias represents every spellcasting source. |
| `spellathigherlevels` | Direct alias: `spellathigherlevels`<br>Parent typed records: `spells`; linked `spellcastings`, `attacks`, `damages`, `upcastings`, and `classlevels` as applicable | `SYNTH` | Text/string — content is record-specific; blank may be meaningful. | `spellathigherlevels` is a synthetic compatibility field generated from canonical Beacon records rather than an independent stored attribute. | `Parent typed record` |
| `spellattack` | Direct alias: `spellattack`<br>Parent typed records: `spells`; linked `spellcastings`, `attacks`, `damages`, `upcastings`, and `classlevels` as applicable | `SYNTH` | Text/string — content is record-specific; blank may be meaningful. | `spellattack` is a synthetic compatibility field generated from canonical Beacon records rather than an independent stored attribute. | `Parent typed record` |
| `spellattackid` | Direct alias: `spellattackid`<br>Parent typed records: `spells`; linked `spellcastings`, `attacks`, `damages`, `upcastings`, and `classlevels` as applicable | `SYNTH` | Text/string — content is record-specific; blank may be meaningful. | `spellattackid` is a synthetic compatibility field generated from canonical Beacon records rather than an independent stored attribute. | `Parent typed record` |
| `spellcasting_ability` | Direct alias: `spellcasting_ability`<br>Sheet-wide compatibility result derived from one selected Spellcasting profile | `SYNTH` | Text/string — content is record-specific; blank may be meaningful. | Singular modifier-like compatibility output, not the ability name for each Spellcasting record. Verified values included `3+` and `0+`; the alias followed the same selected profile as the sheet-wide spell attack and save DC values. | `Parent typed record` — Read or write the intended Spellcasting record's `ability` instead of treating this alias as a universal character-wide casting ability. |
| `spellcastingtime` | Direct alias: `spellcastingtime`<br>Parent typed records: `spells`; linked `spellcastings`, `attacks`, `damages`, `upcastings`, and `classlevels` as applicable | `SYNTH` | Text/string — content is record-specific; blank may be meaningful. | `spellcastingtime` is a synthetic compatibility field generated from canonical Beacon records rather than an independent stored attribute. | `Parent typed record` |
| `spellcomp` | Direct alias: `spellcomp`<br>Parent typed records: `spells`; linked `spellcastings`, `attacks`, `damages`, `upcastings`, and `classlevels` as applicable | `SYNTH` | Text/string — content is record-specific; blank may be meaningful. | `spellcomp` is a synthetic compatibility field generated from canonical Beacon records rather than an independent stored attribute. | `Parent typed record` |
| `spellcomp_m` | Direct alias: `spellcomp_m`<br>Parent typed records: `spells`; linked `spellcastings`, `attacks`, `damages`, `upcastings`, and `classlevels` as applicable | `SYNTH` | Boolean — stored as `true` / `false`. ScriptCards structured writes also accept `1`/`0`, `yes`/`no`, and `on`/`off`. | `spellcomp_m` is a synthetic compatibility field generated from canonical Beacon records rather than an independent stored attribute. | `Parent typed record` |
| `spellcomp_materials` | Direct alias: `spellcomp_materials`<br>Parent typed records: `spells`; linked `spellcastings`, `attacks`, `damages`, `upcastings`, and `classlevels` as applicable | `SYNTH` | Text/string — content is record-specific; blank may be meaningful. | `spellcomp_materials` is a synthetic compatibility field generated from canonical Beacon records rather than an independent stored attribute. | `Parent typed record` |
| `spellcomp_s` | Direct alias: `spellcomp_s`<br>Parent typed records: `spells`; linked `spellcastings`, `attacks`, `damages`, `upcastings`, and `classlevels` as applicable | `SYNTH` | Boolean — stored as `true` / `false`. ScriptCards structured writes also accept `1`/`0`, `yes`/`no`, and `on`/`off`. | `spellcomp_s` is a synthetic compatibility field generated from canonical Beacon records rather than an independent stored attribute. | `Parent typed record` |
| `spellcomp_v` | Direct alias: `spellcomp_v`<br>Parent typed records: `spells`; linked `spellcastings`, `attacks`, `damages`, `upcastings`, and `classlevels` as applicable | `SYNTH` | Boolean — stored as `true` / `false`. ScriptCards structured writes also accept `1`/`0`, `yes`/`no`, and `on`/`off`. | `spellcomp_v` is a synthetic compatibility field generated from canonical Beacon records rather than an independent stored attribute. | `Parent typed record` |
| `spellconcentration` | Direct alias: `spellconcentration`<br>Parent typed records: `spells`; linked `spellcastings`, `attacks`, `damages`, `upcastings`, and `classlevels` as applicable | `SYNTH` | Concentration-state compatibility value. Canonical source is boolean `concentration`: `true` = requires concentration; `false` = does not; exact legacy alias representation was not separately probed. | `spellconcentration` is a synthetic compatibility field generated from canonical Beacon records rather than an independent stored attribute. | `Parent typed record` |
| `spelldamage` | Direct alias: `spelldamage`<br>Parent typed records: `spells`; linked `spellcastings`, `attacks`, `damages`, `upcastings`, and `classlevels` as applicable | `SYNTH` | Text/string — content is record-specific; blank may be meaningful. | `spelldamage` is a synthetic compatibility field generated from canonical Beacon records rather than an independent stored attribute. | `Parent typed record` |
| `spelldamage2` | Direct alias: `spelldamage2`<br>Parent typed records: `spells`; linked `spellcastings`, `attacks`, `damages`, `upcastings`, and `classlevels` as applicable | `SYNTH` | Text/string — content is record-specific; blank may be meaningful. | `spelldamage2` is a synthetic compatibility field generated from canonical Beacon records rather than an independent stored attribute. | `Parent typed record` |
| `spelldamagetype` | Direct alias: `spelldamagetype`<br>Parent typed records: `spells`; linked `spellcastings`, `attacks`, `damages`, `upcastings`, and `classlevels` as applicable | `SYNTH` | Text/string — content is record-specific; blank may be meaningful. | `spelldamagetype` is a synthetic compatibility field generated from canonical Beacon records rather than an independent stored attribute. | `Parent typed record` |
| `spelldamagetype2` | Direct alias: `spelldamagetype2`<br>Parent typed records: `spells`; linked `spellcastings`, `attacks`, `damages`, `upcastings`, and `classlevels` as applicable | `SYNTH` | Text/string — content is record-specific; blank may be meaningful. | `spelldamagetype2` is a synthetic compatibility field generated from canonical Beacon records rather than an independent stored attribute. | `Parent typed record` |
| `spelldescription` | Direct alias: `spelldescription`<br>Parent typed records: `spells`; linked `spellcastings`, `attacks`, `damages`, `upcastings`, and `classlevels` as applicable | `SYNTH` | Text/string — content is record-specific; blank may be meaningful. | `spelldescription` is a synthetic compatibility field generated from canonical Beacon records rather than an independent stored attribute. | `Parent typed record` |
| `spelldmgmod` | Direct alias: `spelldmgmod`<br>Parent typed records: `spells`; linked `spellcastings`, `attacks`, `damages`, `upcastings`, and `classlevels` as applicable | `SYNTH` | Numeric or numeric-form compatibility output. Exact formatting (for example signed text versus number) was not independently probed where this is a legacy projection. | `spelldmgmod` is a synthetic compatibility field generated from canonical Beacon records rather than an independent stored attribute. | `Parent typed record` |
| `spellduration` | Direct alias: `spellduration`<br>Parent typed records: `spells`; linked `spellcastings`, `attacks`, `damages`, `upcastings`, and `classlevels` as applicable | `SYNTH` | Text/string — content is record-specific; blank may be meaningful. | `spellduration` is a synthetic compatibility field generated from canonical Beacon records rather than an independent stored attribute. | `Parent typed record` |
| `spellhealing` | Direct alias: `spellhealing`<br>Parent typed records: `spells`; linked `spellcastings`, `attacks`, `damages`, `upcastings`, and `classlevels` as applicable | `SYNTH` | Synthetic compatibility output assembled from canonical records; exact legacy formatting is record-dependent unless a canonical source is named in this row. | `spellhealing` is a synthetic compatibility field generated from canonical Beacon records rather than an independent stored attribute. | `Parent typed record` |
| `spellhlbonus` | Direct alias: `spellhlbonus`<br>Parent typed records: `spells`; linked `spellcastings`, `attacks`, `damages`, `upcastings`, and `classlevels` as applicable | `SYNTH` | Numeric or numeric-form compatibility output. Exact formatting (for example signed text versus number) was not independently probed where this is a legacy projection. | `spellhlbonus` is a synthetic compatibility field generated from canonical Beacon records rather than an independent stored attribute. | `Parent typed record` |
| `spellhldie` | Direct alias: `spellhldie`<br>Parent typed records: `spells`; linked `spellcastings`, `attacks`, `damages`, `upcastings`, and `classlevels` as applicable | `SYNTH` | Synthetic compatibility output assembled from canonical records; exact legacy formatting is record-dependent unless a canonical source is named in this row. | `spellhldie` is a synthetic compatibility field generated from canonical Beacon records rather than an independent stored attribute. | `Parent typed record` |
| `spellhldietype` | Direct alias: `spellhldietype`<br>Parent typed records: `spells`; linked `spellcastings`, `attacks`, `damages`, `upcastings`, and `classlevels` as applicable | `SYNTH` | Text/string — content is record-specific; blank may be meaningful. | `spellhldietype` is a synthetic compatibility field generated from canonical Beacon records rather than an independent stored attribute. | `Parent typed record` |
| `spellicon_flag` | Direct alias: `spellicon_flag`<br>Parent typed records: `spells`; linked `spellcastings`, `attacks`, `damages`, `upcastings`, and `classlevels` as applicable | `SYNTH` | Compatibility flag/toggle output. Exact legacy representation (`0`/`1`, boolean, blank/text, etc.) was not independently verified; do not assume a writable boolean unless the row names a canonical boolean source. | `spellicon_flag` is a synthetic compatibility field generated from canonical Beacon records rather than an independent stored attribute. | `Parent typed record` |
| `spellid` | Direct alias: `spellid`<br>Parent typed records: `spells`; linked `spellcastings`, `attacks`, `damages`, `upcastings`, and `classlevels` as applicable | `SYNTH` | Text/string — content is record-specific; blank may be meaningful. | `spellid` is a synthetic compatibility field generated from canonical Beacon records rather than an independent stored attribute. | `Parent typed record` |
| `spelllevel` | Direct alias: `spelllevel`<br>Parent typed records: `spells`; linked `spellcastings`, `attacks`, `damages`, `upcastings`, and `classlevels` as applicable | `SYNTH` | Spell level compatibility value; ordinary D&D values are `0`–`9`, where `0` is a cantrip. | `spelllevel` is a synthetic compatibility field generated from canonical Beacon records rather than an independent stored attribute. | `Parent typed record` |
| `spellname` | Direct alias: `spellname`<br>Parent typed records: `spells`; linked `spellcastings`, `attacks`, `damages`, `upcastings`, and `classlevels` as applicable | `SYNTH` | Text/string — content is record-specific; blank may be meaningful. | `spellname` is a synthetic compatibility field generated from canonical Beacon records rather than an independent stored attribute. | `Parent typed record` |
| `spelloutput` | Direct alias: `spelloutput`<br>Parent typed records: `spells`; linked `spellcastings`, `attacks`, `damages`, `upcastings`, and `classlevels` as applicable | `SYNTH` | Text/string — content is record-specific; blank may be meaningful. | `spelloutput` is a synthetic compatibility field generated from canonical Beacon records rather than an independent stored attribute. | `Parent typed record` |
| `spellprepared` | Direct alias: `spellprepared`<br>Parent typed records: `spells`; linked `spellcastings`, `attacks`, `damages`, `upcastings`, and `classlevels` as applicable | `SYNTH` | Prepared-state compatibility value. The canonical source is `spells->[selector]->_prepared`, whose stored values are boolean `true` / `false`; the exact legacy alias representation was not separately probed. | `spellprepared` is a synthetic compatibility field generated from canonical Beacon records rather than an independent stored attribute. | `Parent typed record` |
| `spellrange` | Direct alias: `spellrange`<br>Parent typed records: `spells`; linked `spellcastings`, `attacks`, `damages`, `upcastings`, and `classlevels` as applicable | `SYNTH` | Text/string — content is record-specific; blank may be meaningful. | `spellrange` is a synthetic compatibility field generated from canonical Beacon records rather than an independent stored attribute. | `Parent typed record` |
| `spellritual` | Direct alias: `spellritual`<br>Parent typed records: `spells`; linked `spellcastings`, `attacks`, `damages`, `upcastings`, and `classlevels` as applicable | `SYNTH` | Ritual-state compatibility value. Canonical source is boolean `ritual`: `true` = ritual; `false` = not ritual; exact legacy alias representation was not separately probed. | `spellritual` is a synthetic compatibility field generated from canonical Beacon records rather than an independent stored attribute. | `Parent typed record` |
| `spellsave` | Direct alias: `spellsave`<br>Parent typed records: `spells`; linked `spellcastings`, `attacks`, `damages`, `upcastings`, and `classlevels` as applicable | `SYNTH` | Text/string — content is record-specific; blank may be meaningful. | `spellsave` is a synthetic compatibility field generated from canonical Beacon records rather than an independent stored attribute. | `Parent typed record` |
| `spellsavesuccess` | Direct alias: `spellsavesuccess`<br>Parent typed records: `spells`; linked `spellcastings`, `attacks`, `damages`, `upcastings`, and `classlevels` as applicable | `SYNTH` | Text/string — content is record-specific; blank may be meaningful. | `spellsavesuccess` is a synthetic compatibility field generated from canonical Beacon records rather than an independent stored attribute. | `Parent typed record` |
| `spellschool` | Direct alias: `spellschool`<br>Parent typed records: `spells`; linked `spellcastings`, `attacks`, `damages`, `upcastings`, and `classlevels` as applicable | `SYNTH` | Text/string — content is record-specific; blank may be meaningful. | `spellschool` is a synthetic compatibility field generated from canonical Beacon records rather than an independent stored attribute. | `Parent typed record` |
| `spelltarget` | Direct alias: `spelltarget`<br>Parent typed records: `spells`; linked `spellcastings`, `attacks`, `damages`, `upcastings`, and `classlevels` as applicable | `SYNTH` | Text/string — content is record-specific; blank may be meaningful. | `spelltarget` is a synthetic compatibility field generated from canonical Beacon records rather than an independent stored attribute. | `Parent typed record` |

#### Inventory and repeating items

> **Value roles**
>
> - `SYNTH` — A compatibility projection assembled from the parent and linked typed records named in the row.
>
> **Write using**
>
> - `Parent typed record` — Edit the existing record or records labeled `Parent typed record:` or `Parent typed records:` in the row.

| Direct alias | ScriptCards read location | Value role | Values / format | Description | Write using |
|---|---|---|---|---|---|
| `ammo` | Direct alias: `ammo`<br>Parent typed records: `items`; linked `attunements`, `attacks`, `damages`, `resources`, `armorclasses`, and `weaponmasteries` as applicable | `SYNTH` | Text/string — content is record-specific; blank may be meaningful. | `ammo` is a synthetic compatibility field generated from canonical Beacon records rather than an independent stored attribute. | `Parent typed record` |
| `ammotracking` | Direct alias: `ammotracking`<br>Parent typed records: `items`; linked `attunements`, `attacks`, `damages`, `resources`, `armorclasses`, and `weaponmasteries` as applicable | `SYNTH` | Synthetic compatibility output assembled from canonical records; exact legacy formatting is record-dependent unless a canonical source is named in this row. | `ammotracking` is a synthetic compatibility field generated from canonical Beacon records rather than an independent stored attribute. | `Parent typed record` |
| `equipment` | Direct alias: `equipment`<br>Structured path: `sheet->inventory->equipmentDisplayOrder`<br>Parent typed records: `items`; linked `attunements`, `attacks`, `damages`, `resources`, `armorclasses`, and `weaponmasteries` as applicable | `SYNTH` | Synthetic inventory compatibility output assembled from the equipment display order and Item graph; exact text format is sheet/row dependent. | `equipment` is a synthetic compatibility field generated from canonical Beacon records rather than an independent stored attribute. | `Parent typed record` |
| `equipped` | Direct alias: `equipped`<br>Parent typed records: `items`; linked `attunements`, `attacks`, `damages`, `resources`, `armorclasses`, and `weaponmasteries` as applicable | `SYNTH` | Equipment-state compatibility value. Canonical Item source is boolean `equipData.equipped`: `true` = equipped; `false` = not equipped; exact legacy alias representation was not separately probed. | `equipped` is a synthetic compatibility field generated from canonical Beacon records rather than an independent stored attribute. | `Parent typed record` |
| `inventorysubflag` | Direct alias: `inventorysubflag`<br>Parent typed records: `items`; linked `attunements`, `attacks`, `damages`, `resources`, `armorclasses`, and `weaponmasteries` as applicable | `SYNTH` | Compatibility flag/toggle output. Exact legacy representation (`0`/`1`, boolean, blank/text, etc.) was not independently verified; do not assume a writable boolean unless the row names a canonical boolean source. | `inventorysubflag` is a synthetic compatibility field generated from canonical Beacon records rather than an independent stored attribute. | `Parent typed record` |
| `itemattackid` | Direct alias: `itemattackid`<br>Parent typed records: `items`; linked `attunements`, `attacks`, `damages`, `resources`, `armorclasses`, and `weaponmasteries` as applicable | `SYNTH` | Text/string — content is record-specific; blank may be meaningful. | `itemattackid` is a synthetic compatibility field generated from canonical Beacon records rather than an independent stored attribute. | `Parent typed record` |
| `itemcontent` | Direct alias: `itemcontent`<br>Parent typed records: `items`; linked `attunements`, `attacks`, `damages`, `resources`, `armorclasses`, and `weaponmasteries` as applicable | `SYNTH` | Text/string — content is record-specific; blank may be meaningful. | `itemcontent` is a synthetic compatibility field generated from canonical Beacon records rather than an independent stored attribute. | `Parent typed record` |
| `itemcount` | Direct alias: `itemcount`<br>Parent typed records: `items`; linked `attunements`, `attacks`, `damages`, `resources`, `armorclasses`, and `weaponmasteries` as applicable | `SYNTH` | Number — use a numeric value. The meaningful range depends on the field; no additional range is implied unless stated here. | `itemcount` is a synthetic compatibility field generated from canonical Beacon records rather than an independent stored attribute. | `Parent typed record` |
| `itemid` | Direct alias: `itemid`<br>Parent typed records: `items`; linked `attunements`, `attacks`, `damages`, `resources`, `armorclasses`, and `weaponmasteries` as applicable | `SYNTH` | Text/string — content is record-specific; blank may be meaningful. | `itemid` is a synthetic compatibility field generated from canonical Beacon records rather than an independent stored attribute. | `Parent typed record` |
| `itemmodifiers` | Direct alias: `itemmodifiers`<br>Parent typed records: `items`; linked `attunements`, `attacks`, `damages`, `resources`, `armorclasses`, and `weaponmasteries` as applicable | `SYNTH` | Text/string — content is record-specific; blank may be meaningful. | `itemmodifiers` is a synthetic compatibility field generated from canonical Beacon records rather than an independent stored attribute. | `Parent typed record` |
| `itemname` | Direct alias: `itemname`<br>Parent typed records: `items`; linked `attunements`, `attacks`, `damages`, `resources`, `armorclasses`, and `weaponmasteries` as applicable | `SYNTH` | Text/string — content is record-specific; blank may be meaningful. | `itemname` is a synthetic compatibility field generated from canonical Beacon records rather than an independent stored attribute. | `Parent typed record` |
| `itemproperties` | Direct alias: `itemproperties`<br>Parent typed records: `items`; linked `attunements`, `attacks`, `damages`, `resources`, `armorclasses`, and `weaponmasteries` as applicable | `SYNTH` | Text/string — content is record-specific; blank may be meaningful. | `itemproperties` is a synthetic compatibility field generated from canonical Beacon records rather than an independent stored attribute. | `Parent typed record` |
| `itemresourceid` | Direct alias: `itemresourceid`<br>Parent typed records: `items`; linked `attunements`, `attacks`, `damages`, `resources`, `armorclasses`, and `weaponmasteries` as applicable | `SYNTH` | Text/string — content is record-specific; blank may be meaningful. | `itemresourceid` is a synthetic compatibility field generated from canonical Beacon records rather than an independent stored attribute. | `Parent typed record` |
| `itemweight` | Direct alias: `itemweight`<br>Parent typed records: `items`; linked `attunements`, `attacks`, `damages`, `resources`, `armorclasses`, and `weaponmasteries` as applicable | `SYNTH` | Number — use a numeric value. The meaningful range depends on the field; no additional range is implied unless stated here. | `itemweight` is a synthetic compatibility field generated from canonical Beacon records rather than an independent stored attribute. | `Parent typed record` |
| `simpleinventory` | Direct alias: `simpleinventory`<br>Structured path: `sheet->settings->layoutState`<br>Parent typed records: `items`; linked `attunements`, `attacks`, `damages`, `resources`, `armorclasses`, and `weaponmasteries` as applicable | `SYNTH` | Synthetic inventory/layout compatibility output assembled from Item records and layout state; exact legacy text/flag representation was not independently probed. | `simpleinventory` is a synthetic compatibility field generated from canonical Beacon records rather than an independent stored attribute. | `Parent typed record` |
| `treasure` | Direct alias: `treasure`<br>Parent typed records: `items`; linked `attunements`, `attacks`, `damages`, `resources`, `armorclasses`, and `weaponmasteries` as applicable | `SYNTH` | Text/string — content is record-specific; blank may be meaningful. | `treasure` is a synthetic compatibility field generated from canonical Beacon records rather than an independent stored attribute. | `Parent typed record` — Synthetic compatibility value; for direct NPC Treasure text use `sheet->npc->treasure`. |
| `useasresource` | Direct alias: `useasresource`<br>Parent typed records: `items`; linked `attunements`, `attacks`, `damages`, `resources`, `armorclasses`, and `weaponmasteries` as applicable | `SYNTH` | Boolean — stored as `true` / `false`. ScriptCards structured writes also accept `1`/`0`, `yes`/`no`, and `on`/`off`. | `useasresource` is a synthetic compatibility field generated from canonical Beacon records rather than an independent stored attribute. | `Parent typed record` |
| `weighttotal` | Direct alias: `weighttotal`<br>Parent typed records: `items`; linked `attunements`, `attacks`, `damages`, `resources`, `armorclasses`, and `weaponmasteries` as applicable | `SYNTH` | Number — use a numeric value. The meaningful range depends on the field; no additional range is implied unless stated here. | `weighttotal` is a synthetic compatibility field generated from canonical Beacon records rather than an independent stored attribute. | `Parent typed record` |

#### Resources

> **Value roles**
>
> - `COMPUTED` — A calculated or aggregated result. Change the named source input rather than writing the result.
>
> **Write using**
>
> - `Write not verified` — Use the alias for reads; no safe ScriptCards write target has been verified.

| Direct alias | ScriptCards read location | Value role | Values / format | Description | Write using |
|---|---|---|---|---|---|
| `class_resource` | Direct alias: `class_resource` | `COMPUTED` | Number — use a numeric value. The meaningful range depends on the field; no additional range is implied unless stated here. | `class_resource` is a direct alias that provides convenient ScriptCards access to the Beacon data described in the location column. | `Write not verified` |
| `class_resource_max` | Direct alias: `class_resource_max` | `COMPUTED` | Number — use a numeric value. The meaningful range depends on the field; no additional range is implied unless stated here. | `class_resource_max` is a direct alias that provides convenient ScriptCards access to the Beacon data described in the location column. | `Write not verified` |
| `class_resource_name` | Direct alias: `class_resource_name` | `COMPUTED` | Text/string — content is record-specific; blank may be meaningful. | `class_resource_name` is a direct alias that provides convenient ScriptCards access to the Beacon data described in the location column. | `Write not verified` |
| `other_resource` | Direct alias: `other_resource` | `COMPUTED` | Number — use a numeric value. The meaningful range depends on the field; no additional range is implied unless stated here. | `other_resource` is a direct alias that provides convenient ScriptCards access to the Beacon data described in the location column. | `Write not verified` |
| `other_resource_itemid` | Direct alias: `other_resource_itemid` | `COMPUTED` | Text/string — content is record-specific; blank may be meaningful. | `other_resource_itemid` is a direct alias that provides convenient ScriptCards access to the Beacon data described in the location column. | `Write not verified` |
| `other_resource_max` | Direct alias: `other_resource_max` | `COMPUTED` | Number — use a numeric value. The meaningful range depends on the field; no additional range is implied unless stated here. | `other_resource_max` is a direct alias that provides convenient ScriptCards access to the Beacon data described in the location column. | `Write not verified` |
| `other_resource_name` | Direct alias: `other_resource_name` | `COMPUTED` | Text/string — content is record-specific; blank may be meaningful. | `other_resource_name` is a direct alias that provides convenient ScriptCards access to the Beacon data described in the location column. | `Write not verified` |
| `resource_left` | Direct alias: `resource_left` | `COMPUTED` | Number — use a numeric value. The meaningful range depends on the field; no additional range is implied unless stated here. | `resource_left` is a direct alias that provides convenient ScriptCards access to the Beacon data described in the location column. | `Write not verified` |
| `resource_left_itemid` | Direct alias: `resource_left_itemid` | `COMPUTED` | Text/string — content is record-specific; blank may be meaningful. | `resource_left_itemid` is a direct alias that provides convenient ScriptCards access to the Beacon data described in the location column. | `Write not verified` |
| `resource_left_max` | Direct alias: `resource_left_max` | `COMPUTED` | Number — use a numeric value. The meaningful range depends on the field; no additional range is implied unless stated here. | `resource_left_max` is a direct alias that provides convenient ScriptCards access to the Beacon data described in the location column. | `Write not verified` |
| `resource_left_name` | Direct alias: `resource_left_name` | `COMPUTED` | Text/string — content is record-specific; blank may be meaningful. | `resource_left_name` is a direct alias that provides convenient ScriptCards access to the Beacon data described in the location column. | `Write not verified` |
| `resource_right` | Direct alias: `resource_right` | `COMPUTED` | Number — use a numeric value. The meaningful range depends on the field; no additional range is implied unless stated here. | `resource_right` is a direct alias that provides convenient ScriptCards access to the Beacon data described in the location column. | `Write not verified` |
| `resource_right_itemid` | Direct alias: `resource_right_itemid` | `COMPUTED` | Text/string — content is record-specific; blank may be meaningful. | `resource_right_itemid` is a direct alias that provides convenient ScriptCards access to the Beacon data described in the location column. | `Write not verified` |
| `resource_right_max` | Direct alias: `resource_right_max` | `COMPUTED` | Number — use a numeric value. The meaningful range depends on the field; no additional range is implied unless stated here. | `resource_right_max` is a direct alias that provides convenient ScriptCards access to the Beacon data described in the location column. | `Write not verified` |
| `resource_right_name` | Direct alias: `resource_right_name` | `COMPUTED` | Text/string — content is record-specific; blank may be meaningful. | `resource_right_name` is a direct alias that provides convenient ScriptCards access to the Beacon data described in the location column. | `Write not verified` |

#### Ability scores and saving throws

> **Value roles**
>
> - `COMPUTED` — A calculated or aggregated result. Change the named source input rather than writing the result.
>
> **Write using**
>
> - `Typed collection` — Locate the matching existing record through the location labeled `Typed collection:` or `Typed collections:` in the row. When the row names a field, write that field; otherwise use the corresponding typed-collection table below to choose the existing primitive field that represents the intended change.

| Direct alias | ScriptCards read location | Value role | Values / format | Description | Write using |
|---|---|---|---|---|---|
| `charisma_save_prof` | Direct alias: `charisma_save_prof`<br>Typed collection: `proficiencies->[selector]->proficiencyLevel`<br>Match: `category = Saving Throw`; `proficiency = Charisma` | `COMPUTED` | Skill/save proficiency compatibility value. The canonical `proficiencyLevel` strings include observed values such as `Proficient` and `Expertise`; this alias's exact legacy representation was not independently probed. | `charisma_save_prof` is a derived proficiency-presence flag from the matching Saving Throw Proficiency record. | `Typed collection` |
| `constitution_save_prof` | Direct alias: `constitution_save_prof`<br>Typed collection: `proficiencies->[selector]->proficiencyLevel`<br>Match: `category = Saving Throw`; `proficiency = Constitution` | `COMPUTED` | Skill/save proficiency compatibility value. The canonical `proficiencyLevel` strings include observed values such as `Proficient` and `Expertise`; this alias's exact legacy representation was not independently probed. | `constitution_save_prof` is a derived proficiency-presence flag from the matching Saving Throw Proficiency record. | `Typed collection` |
| `dexterity_save_prof` | Direct alias: `dexterity_save_prof`<br>Typed collection: `proficiencies->[selector]->proficiencyLevel`<br>Match: `category = Saving Throw`; `proficiency = Dexterity` | `COMPUTED` | Skill/save proficiency compatibility value. The canonical `proficiencyLevel` strings include observed values such as `Proficient` and `Expertise`; this alias's exact legacy representation was not independently probed. | `dexterity_save_prof` is a derived proficiency-presence flag from the matching Saving Throw Proficiency record. | `Typed collection` |
| `intelligence_save_prof` | Direct alias: `intelligence_save_prof`<br>Typed collection: `proficiencies->[selector]->proficiencyLevel`<br>Match: `category = Saving Throw`; `proficiency = Intelligence` | `COMPUTED` | Skill/save proficiency compatibility value. The canonical `proficiencyLevel` strings include observed values such as `Proficient` and `Expertise`; this alias's exact legacy representation was not independently probed. | `intelligence_save_prof` is a derived proficiency-presence flag from the matching Saving Throw Proficiency record. | `Typed collection` |
| `strength_save_prof` | Direct alias: `strength_save_prof`<br>Typed collection: `proficiencies->[selector]->proficiencyLevel`<br>Match: `category = Saving Throw`; `proficiency = Strength` | `COMPUTED` | Skill/save proficiency compatibility value. The canonical `proficiencyLevel` strings include observed values such as `Proficient` and `Expertise`; this alias's exact legacy representation was not independently probed. | `strength_save_prof` is a derived proficiency-presence flag from the matching Saving Throw Proficiency record. | `Typed collection` |
| `wisdom_save_prof` | Direct alias: `wisdom_save_prof`<br>Typed collection: `proficiencies->[selector]->proficiencyLevel`<br>Match: `category = Saving Throw`; `proficiency = Wisdom` | `COMPUTED` | Skill/save proficiency compatibility value. The canonical `proficiencyLevel` strings include observed values such as `Proficient` and `Expertise`; this alias's exact legacy representation was not independently probed. | `wisdom_save_prof` is a derived proficiency-presence flag from the matching Saving Throw Proficiency record. | `Typed collection` |

#### Skills and passive checks

> **Value roles**
>
> - `COMPUTED` — A calculated or aggregated result. Change the named source input rather than writing the result.
>
> **Write using**
>
> - `Typed collection` — Locate the matching existing record through the location labeled `Typed collection:` or `Typed collections:` in the row. When the row names a field, write that field; otherwise use the corresponding typed-collection table below to choose the existing primitive field that represents the intended change.

| Direct alias | ScriptCards read location | Value role | Values / format | Description | Write using |
|---|---|---|---|---|---|
| `acrobatics_prof` | Direct alias: `acrobatics_prof`<br>Typed collection: `proficiencies->[selector]->proficiencyLevel`<br>Match: `category = Skill`; `proficiency = Acrobatics` | `COMPUTED` | Skill/save proficiency compatibility value. The canonical `proficiencyLevel` strings include observed values such as `Proficient` and `Expertise`; this alias's exact legacy representation was not independently probed. | `acrobatics_prof` is a derived proficiency-presence flag from the matching Skill Proficiency record. | `Typed collection` |
| `acrobatics_type` | Direct alias: `acrobatics_type`<br>Typed collection: `proficiencies->[selector]->proficiencyLevel`<br>Match: `category = Skill`; `proficiency = Acrobatics` | `COMPUTED` | Skill/save proficiency compatibility value. The canonical `proficiencyLevel` strings include observed values such as `Proficient` and `Expertise`; this alias's exact legacy representation was not independently probed. | `acrobatics_type` is a derived proficiency-tier code from `proficiencyLevel`; `2` was observed for Expertise. | `Typed collection` |
| `animal_handling_prof` | Direct alias: `animal_handling_prof`<br>Typed collection: `proficiencies->[selector]->proficiencyLevel`<br>Match: `category = Skill`; `proficiency = Animal Handling` | `COMPUTED` | Skill/save proficiency compatibility value. The canonical `proficiencyLevel` strings include observed values such as `Proficient` and `Expertise`; this alias's exact legacy representation was not independently probed. | `animal_handling_prof` is a derived proficiency-presence flag from the matching Skill Proficiency record. | `Typed collection` |
| `animal_handling_type` | Direct alias: `animal_handling_type`<br>Typed collection: `proficiencies->[selector]->proficiencyLevel`<br>Match: `category = Skill`; `proficiency = Animal Handling` | `COMPUTED` | Skill/save proficiency compatibility value. The canonical `proficiencyLevel` strings include observed values such as `Proficient` and `Expertise`; this alias's exact legacy representation was not independently probed. | `animal_handling_type` is a derived proficiency-tier code from `proficiencyLevel`; `2` was observed for Expertise. | `Typed collection` |
| `arcana_prof` | Direct alias: `arcana_prof`<br>Typed collection: `proficiencies->[selector]->proficiencyLevel`<br>Match: `category = Skill`; `proficiency = Arcana` | `COMPUTED` | Skill/save proficiency compatibility value. The canonical `proficiencyLevel` strings include observed values such as `Proficient` and `Expertise`; this alias's exact legacy representation was not independently probed. | `arcana_prof` is a derived proficiency-presence flag from the matching Skill Proficiency record. | `Typed collection` |
| `arcana_type` | Direct alias: `arcana_type`<br>Typed collection: `proficiencies->[selector]->proficiencyLevel`<br>Match: `category = Skill`; `proficiency = Arcana` | `COMPUTED` | Skill/save proficiency compatibility value. The canonical `proficiencyLevel` strings include observed values such as `Proficient` and `Expertise`; this alias's exact legacy representation was not independently probed. | `arcana_type` is a derived proficiency-tier code from `proficiencyLevel`; `2` was observed for Expertise. | `Typed collection` |
| `athletics_prof` | Direct alias: `athletics_prof`<br>Typed collection: `proficiencies->[selector]->proficiencyLevel`<br>Match: `category = Skill`; `proficiency = Athletics` | `COMPUTED` | Skill/save proficiency compatibility value. The canonical `proficiencyLevel` strings include observed values such as `Proficient` and `Expertise`; this alias's exact legacy representation was not independently probed. | `athletics_prof` is a derived proficiency-presence flag from the matching Skill Proficiency record. | `Typed collection` |
| `athletics_type` | Direct alias: `athletics_type`<br>Typed collection: `proficiencies->[selector]->proficiencyLevel`<br>Match: `category = Skill`; `proficiency = Athletics` | `COMPUTED` | Skill/save proficiency compatibility value. The canonical `proficiencyLevel` strings include observed values such as `Proficient` and `Expertise`; this alias's exact legacy representation was not independently probed. | `athletics_type` is a derived proficiency-tier code from `proficiencyLevel`; `2` was observed for Expertise. | `Typed collection` |
| `deception_prof` | Direct alias: `deception_prof`<br>Typed collection: `proficiencies->[selector]->proficiencyLevel`<br>Match: `category = Skill`; `proficiency = Deception` | `COMPUTED` | Skill/save proficiency compatibility value. The canonical `proficiencyLevel` strings include observed values such as `Proficient` and `Expertise`; this alias's exact legacy representation was not independently probed. | `deception_prof` is a derived proficiency-presence flag from the matching Skill Proficiency record. | `Typed collection` |
| `deception_type` | Direct alias: `deception_type`<br>Typed collection: `proficiencies->[selector]->proficiencyLevel`<br>Match: `category = Skill`; `proficiency = Deception` | `COMPUTED` | Skill/save proficiency compatibility value. The canonical `proficiencyLevel` strings include observed values such as `Proficient` and `Expertise`; this alias's exact legacy representation was not independently probed. | `deception_type` is a derived proficiency-tier code from `proficiencyLevel`; `2` was observed for Expertise. | `Typed collection` |
| `history_prof` | Direct alias: `history_prof`<br>Typed collection: `proficiencies->[selector]->proficiencyLevel`<br>Match: `category = Skill`; `proficiency = History` | `COMPUTED` | Skill/save proficiency compatibility value. The canonical `proficiencyLevel` strings include observed values such as `Proficient` and `Expertise`; this alias's exact legacy representation was not independently probed. | `history_prof` is a derived proficiency-presence flag from the matching Skill Proficiency record. | `Typed collection` |
| `history_type` | Direct alias: `history_type`<br>Typed collection: `proficiencies->[selector]->proficiencyLevel`<br>Match: `category = Skill`; `proficiency = History` | `COMPUTED` | Skill/save proficiency compatibility value. The canonical `proficiencyLevel` strings include observed values such as `Proficient` and `Expertise`; this alias's exact legacy representation was not independently probed. | `history_type` is a derived proficiency-tier code from `proficiencyLevel`; `2` was observed for Expertise. | `Typed collection` |
| `insight_prof` | Direct alias: `insight_prof`<br>Typed collection: `proficiencies->[selector]->proficiencyLevel`<br>Match: `category = Skill`; `proficiency = Insight` | `COMPUTED` | Skill/save proficiency compatibility value. The canonical `proficiencyLevel` strings include observed values such as `Proficient` and `Expertise`; this alias's exact legacy representation was not independently probed. | `insight_prof` is a derived proficiency-presence flag from the matching Skill Proficiency record. | `Typed collection` |
| `insight_type` | Direct alias: `insight_type`<br>Typed collection: `proficiencies->[selector]->proficiencyLevel`<br>Match: `category = Skill`; `proficiency = Insight` | `COMPUTED` | Skill/save proficiency compatibility value. The canonical `proficiencyLevel` strings include observed values such as `Proficient` and `Expertise`; this alias's exact legacy representation was not independently probed. | `insight_type` is a derived proficiency-tier code from `proficiencyLevel`; `2` was observed for Expertise. | `Typed collection` |
| `intimidation_prof` | Direct alias: `intimidation_prof`<br>Typed collection: `proficiencies->[selector]->proficiencyLevel`<br>Match: `category = Skill`; `proficiency = Intimidation` | `COMPUTED` | Skill/save proficiency compatibility value. The canonical `proficiencyLevel` strings include observed values such as `Proficient` and `Expertise`; this alias's exact legacy representation was not independently probed. | `intimidation_prof` is a derived proficiency-presence flag from the matching Skill Proficiency record. | `Typed collection` |
| `intimidation_type` | Direct alias: `intimidation_type`<br>Typed collection: `proficiencies->[selector]->proficiencyLevel`<br>Match: `category = Skill`; `proficiency = Intimidation` | `COMPUTED` | Skill/save proficiency compatibility value. The canonical `proficiencyLevel` strings include observed values such as `Proficient` and `Expertise`; this alias's exact legacy representation was not independently probed. | `intimidation_type` is a derived proficiency-tier code from `proficiencyLevel`; `2` was observed for Expertise. | `Typed collection` |
| `investigation_prof` | Direct alias: `investigation_prof`<br>Typed collection: `proficiencies->[selector]->proficiencyLevel`<br>Match: `category = Skill`; `proficiency = Investigation` | `COMPUTED` | Skill/save proficiency compatibility value. The canonical `proficiencyLevel` strings include observed values such as `Proficient` and `Expertise`; this alias's exact legacy representation was not independently probed. | `investigation_prof` is a derived proficiency-presence flag from the matching Skill Proficiency record. | `Typed collection` |
| `investigation_type` | Direct alias: `investigation_type`<br>Typed collection: `proficiencies->[selector]->proficiencyLevel`<br>Match: `category = Skill`; `proficiency = Investigation` | `COMPUTED` | Skill/save proficiency compatibility value. The canonical `proficiencyLevel` strings include observed values such as `Proficient` and `Expertise`; this alias's exact legacy representation was not independently probed. | `investigation_type` is a derived proficiency-tier code from `proficiencyLevel`; `2` was observed for Expertise. | `Typed collection` |
| `medicine_prof` | Direct alias: `medicine_prof`<br>Typed collection: `proficiencies->[selector]->proficiencyLevel`<br>Match: `category = Skill`; `proficiency = Medicine` | `COMPUTED` | Skill/save proficiency compatibility value. The canonical `proficiencyLevel` strings include observed values such as `Proficient` and `Expertise`; this alias's exact legacy representation was not independently probed. | `medicine_prof` is a derived proficiency-presence flag from the matching Skill Proficiency record. | `Typed collection` |
| `medicine_type` | Direct alias: `medicine_type`<br>Typed collection: `proficiencies->[selector]->proficiencyLevel`<br>Match: `category = Skill`; `proficiency = Medicine` | `COMPUTED` | Skill/save proficiency compatibility value. The canonical `proficiencyLevel` strings include observed values such as `Proficient` and `Expertise`; this alias's exact legacy representation was not independently probed. | `medicine_type` is a derived proficiency-tier code from `proficiencyLevel`; `2` was observed for Expertise. | `Typed collection` |
| `nature_prof` | Direct alias: `nature_prof`<br>Typed collection: `proficiencies->[selector]->proficiencyLevel`<br>Match: `category = Skill`; `proficiency = Nature` | `COMPUTED` | Skill/save proficiency compatibility value. The canonical `proficiencyLevel` strings include observed values such as `Proficient` and `Expertise`; this alias's exact legacy representation was not independently probed. | `nature_prof` is a derived proficiency-presence flag from the matching Skill Proficiency record. | `Typed collection` |
| `nature_type` | Direct alias: `nature_type`<br>Typed collection: `proficiencies->[selector]->proficiencyLevel`<br>Match: `category = Skill`; `proficiency = Nature` | `COMPUTED` | Skill/save proficiency compatibility value. The canonical `proficiencyLevel` strings include observed values such as `Proficient` and `Expertise`; this alias's exact legacy representation was not independently probed. | `nature_type` is a derived proficiency-tier code from `proficiencyLevel`; `2` was observed for Expertise. | `Typed collection` |
| `perception_prof` | Direct alias: `perception_prof`<br>Typed collection: `proficiencies->[selector]->proficiencyLevel`<br>Match: `category = Skill`; `proficiency = Perception` | `COMPUTED` | Skill/save proficiency compatibility value. The canonical `proficiencyLevel` strings include observed values such as `Proficient` and `Expertise`; this alias's exact legacy representation was not independently probed. | `perception_prof` is a derived proficiency-presence flag from the matching Skill Proficiency record. | `Typed collection` |
| `perception_type` | Direct alias: `perception_type`<br>Typed collection: `proficiencies->[selector]->proficiencyLevel`<br>Match: `category = Skill`; `proficiency = Perception` | `COMPUTED` | Skill/save proficiency compatibility value. The canonical `proficiencyLevel` strings include observed values such as `Proficient` and `Expertise`; this alias's exact legacy representation was not independently probed. | `perception_type` is a derived proficiency-tier code from `proficiencyLevel`; `2` was observed for Expertise. | `Typed collection` |
| `performance_prof` | Direct alias: `performance_prof`<br>Typed collection: `proficiencies->[selector]->proficiencyLevel`<br>Match: `category = Skill`; `proficiency = Performance` | `COMPUTED` | Skill/save proficiency compatibility value. The canonical `proficiencyLevel` strings include observed values such as `Proficient` and `Expertise`; this alias's exact legacy representation was not independently probed. | `performance_prof` is a derived proficiency-presence flag from the matching Skill Proficiency record. | `Typed collection` |
| `performance_type` | Direct alias: `performance_type`<br>Typed collection: `proficiencies->[selector]->proficiencyLevel`<br>Match: `category = Skill`; `proficiency = Performance` | `COMPUTED` | Skill/save proficiency compatibility value. The canonical `proficiencyLevel` strings include observed values such as `Proficient` and `Expertise`; this alias's exact legacy representation was not independently probed. | `performance_type` is a derived proficiency-tier code from `proficiencyLevel`; `2` was observed for Expertise. | `Typed collection` |
| `persuasion_prof` | Direct alias: `persuasion_prof`<br>Typed collection: `proficiencies->[selector]->proficiencyLevel`<br>Match: `category = Skill`; `proficiency = Persuasion` | `COMPUTED` | Skill/save proficiency compatibility value. The canonical `proficiencyLevel` strings include observed values such as `Proficient` and `Expertise`; this alias's exact legacy representation was not independently probed. | `persuasion_prof` is a derived proficiency-presence flag from the matching Skill Proficiency record. | `Typed collection` |
| `persuasion_type` | Direct alias: `persuasion_type`<br>Typed collection: `proficiencies->[selector]->proficiencyLevel`<br>Match: `category = Skill`; `proficiency = Persuasion` | `COMPUTED` | Skill/save proficiency compatibility value. The canonical `proficiencyLevel` strings include observed values such as `Proficient` and `Expertise`; this alias's exact legacy representation was not independently probed. | `persuasion_type` is a derived proficiency-tier code from `proficiencyLevel`; `2` was observed for Expertise. | `Typed collection` |
| `religion_prof` | Direct alias: `religion_prof`<br>Typed collection: `proficiencies->[selector]->proficiencyLevel`<br>Match: `category = Skill`; `proficiency = Religion` | `COMPUTED` | Skill/save proficiency compatibility value. The canonical `proficiencyLevel` strings include observed values such as `Proficient` and `Expertise`; this alias's exact legacy representation was not independently probed. | `religion_prof` is a derived proficiency-presence flag from the matching Skill Proficiency record. | `Typed collection` |
| `religion_type` | Direct alias: `religion_type`<br>Typed collection: `proficiencies->[selector]->proficiencyLevel`<br>Match: `category = Skill`; `proficiency = Religion` | `COMPUTED` | Skill/save proficiency compatibility value. The canonical `proficiencyLevel` strings include observed values such as `Proficient` and `Expertise`; this alias's exact legacy representation was not independently probed. | `religion_type` is a derived proficiency-tier code from `proficiencyLevel`; `2` was observed for Expertise. | `Typed collection` |
| `sleight_of_hand_prof` | Direct alias: `sleight_of_hand_prof`<br>Typed collection: `proficiencies->[selector]->proficiencyLevel`<br>Match: `category = Skill`; `proficiency = Sleight of Hand` | `COMPUTED` | Skill/save proficiency compatibility value. The canonical `proficiencyLevel` strings include observed values such as `Proficient` and `Expertise`; this alias's exact legacy representation was not independently probed. | `sleight_of_hand_prof` is a derived proficiency-presence flag from the matching Skill Proficiency record. | `Typed collection` |
| `sleight_of_hand_type` | Direct alias: `sleight_of_hand_type`<br>Typed collection: `proficiencies->[selector]->proficiencyLevel`<br>Match: `category = Skill`; `proficiency = Sleight of Hand` | `COMPUTED` | Skill/save proficiency compatibility value. The canonical `proficiencyLevel` strings include observed values such as `Proficient` and `Expertise`; this alias's exact legacy representation was not independently probed. | `sleight_of_hand_type` is a derived proficiency-tier code from `proficiencyLevel`; `2` was observed for Expertise. | `Typed collection` |
| `stealth_prof` | Direct alias: `stealth_prof`<br>Typed collection: `proficiencies->[selector]->proficiencyLevel`<br>Match: `category = Skill`; `proficiency = Stealth` | `COMPUTED` | Skill/save proficiency compatibility value. The canonical `proficiencyLevel` strings include observed values such as `Proficient` and `Expertise`; this alias's exact legacy representation was not independently probed. | `stealth_prof` is a derived proficiency-presence flag from the matching Skill Proficiency record. | `Typed collection` |
| `stealth_type` | Direct alias: `stealth_type`<br>Typed collection: `proficiencies->[selector]->proficiencyLevel`<br>Match: `category = Skill`; `proficiency = Stealth` | `COMPUTED` | Skill/save proficiency compatibility value. The canonical `proficiencyLevel` strings include observed values such as `Proficient` and `Expertise`; this alias's exact legacy representation was not independently probed. | `stealth_type` is a derived proficiency-tier code from `proficiencyLevel`; `2` was observed for Expertise. | `Typed collection` |
| `survival_prof` | Direct alias: `survival_prof`<br>Typed collection: `proficiencies->[selector]->proficiencyLevel`<br>Match: `category = Skill`; `proficiency = Survival` | `COMPUTED` | Skill/save proficiency compatibility value. The canonical `proficiencyLevel` strings include observed values such as `Proficient` and `Expertise`; this alias's exact legacy representation was not independently probed. | `survival_prof` is a derived proficiency-presence flag from the matching Skill Proficiency record. | `Typed collection` |
| `survival_type` | Direct alias: `survival_type`<br>Typed collection: `proficiencies->[selector]->proficiencyLevel`<br>Match: `category = Skill`; `proficiency = Survival` | `COMPUTED` | Skill/save proficiency compatibility value. The canonical `proficiencyLevel` strings include observed values such as `Proficient` and `Expertise`; this alias's exact legacy representation was not independently probed. | `survival_type` is a derived proficiency-tier code from `proficiencyLevel`; `2` was observed for Expertise. | `Typed collection` |

#### Shared character values

> **Value roles**
>
> - `COMPUTED` — A calculated or aggregated result. Change the named source input rather than writing the result.
>
> **Write using**
>
> - `Write not verified` — Use the alias for reads; no safe ScriptCards write target has been verified.

| Direct alias | ScriptCards read location | Value role | Values / format | Description | Write using |
|---|---|---|---|---|---|
| `charname_output` | Direct alias: `charname_output` | `COMPUTED` | Text/string — content is record-specific; blank may be meaningful. | `charname_output` is a direct alias that provides convenient ScriptCards access to the Beacon data described in the location column. | `Write not verified` |
| `multiclass1` | Direct alias: `multiclass1` | `COMPUTED` | Text/string — content is record-specific; blank may be meaningful. | `multiclass1` is a direct alias that provides convenient ScriptCards access to the Beacon data described in the location column. | `Write not verified` |
| `multiclass1_flag` | Direct alias: `multiclass1_flag` | `COMPUTED` | Compatibility flag/toggle output. Exact legacy representation (`0`/`1`, boolean, blank/text, etc.) was not independently verified; do not assume a writable boolean unless the row names a canonical boolean source. | `multiclass1_flag` is a direct alias that provides convenient ScriptCards access to the Beacon data described in the location column. | `Write not verified` |
| `multiclass1_lvl` | Direct alias: `multiclass1_lvl` | `COMPUTED` | Numeric class-level compatibility output for this multiclass slot. | `multiclass1_lvl` is a direct alias that provides convenient ScriptCards access to the Beacon data described in the location column. | `Write not verified` |
| `multiclass1_subclass` | Direct alias: `multiclass1_subclass` | `COMPUTED` | Text/string — content is record-specific; blank may be meaningful. | `multiclass1_subclass` is a direct alias that provides convenient ScriptCards access to the Beacon data described in the location column. | `Write not verified` |
| `multiclass2` | Direct alias: `multiclass2` | `COMPUTED` | Text/string — content is record-specific; blank may be meaningful. | `multiclass2` is a direct alias that provides convenient ScriptCards access to the Beacon data described in the location column. | `Write not verified` |
| `multiclass2_flag` | Direct alias: `multiclass2_flag` | `COMPUTED` | Compatibility flag/toggle output. Exact legacy representation (`0`/`1`, boolean, blank/text, etc.) was not independently verified; do not assume a writable boolean unless the row names a canonical boolean source. | `multiclass2_flag` is a direct alias that provides convenient ScriptCards access to the Beacon data described in the location column. | `Write not verified` |
| `multiclass2_lvl` | Direct alias: `multiclass2_lvl` | `COMPUTED` | Numeric class-level compatibility output for this multiclass slot. | `multiclass2_lvl` is a direct alias that provides convenient ScriptCards access to the Beacon data described in the location column. | `Write not verified` |
| `multiclass2_subclass` | Direct alias: `multiclass2_subclass` | `COMPUTED` | Text/string — content is record-specific; blank may be meaningful. | `multiclass2_subclass` is a direct alias that provides convenient ScriptCards access to the Beacon data described in the location column. | `Write not verified` |
| `multiclass3` | Direct alias: `multiclass3` | `COMPUTED` | Text/string — content is record-specific; blank may be meaningful. | `multiclass3` is a direct alias that provides convenient ScriptCards access to the Beacon data described in the location column. | `Write not verified` |
| `multiclass3_flag` | Direct alias: `multiclass3_flag` | `COMPUTED` | Compatibility flag/toggle output. Exact legacy representation (`0`/`1`, boolean, blank/text, etc.) was not independently verified; do not assume a writable boolean unless the row names a canonical boolean source. | `multiclass3_flag` is a direct alias that provides convenient ScriptCards access to the Beacon data described in the location column. | `Write not verified` |
| `multiclass3_lvl` | Direct alias: `multiclass3_lvl` | `COMPUTED` | Numeric class-level compatibility output for this multiclass slot. | `multiclass3_lvl` is a direct alias that provides convenient ScriptCards access to the Beacon data described in the location column. | `Write not verified` |
| `multiclass3_subclass` | Direct alias: `multiclass3_subclass` | `COMPUTED` | Text/string — content is record-specific; blank may be meaningful. | `multiclass3_subclass` is a direct alias that provides convenient ScriptCards access to the Beacon data described in the location column. | `Write not verified` |
| `name` | Direct alias: `name` | `COMPUTED` | Text/string — content is record-specific; blank may be meaningful. | `name` is a direct alias that provides convenient ScriptCards access to the Beacon data described in the location column. | `Write not verified` |
| `npc` | Direct alias: `npc`<br>Structured path: `appState` | `COMPUTED` | PC/NPC compatibility flag. Read-only compatibility result; authoritative Beacon state is `appState` (`sheet` or `npc`). | `npc` is the compatibility flag derived from whether `appState` is `npc` or `sheet`. | `Write not verified` — Use `appState` in new scripts when you need to distinguish NPC (`npc`) from PC (`sheet`). |
| `npc_name` | Direct alias: `npc_name` | `COMPUTED` | Text/string — content is record-specific; blank may be meaningful. | `npc_name` is a direct alias that provides convenient ScriptCards access to the Beacon data described in the location column. | `Write not verified` |
| `subclass` | Direct alias: `subclass`<br>Typed collection: `subclasses` | `COMPUTED` | Text/string — content is record-specific; blank may be meaningful. | `subclass` is the translated display value derived from the canonical Subclass record. | `Write not verified` |

#### Tools and proficiencies

> **Value roles**
>
> - `COMPUTED` — A calculated or aggregated result. Change the named source input rather than writing the result.
>
> **Write using**
>
> - `Write not verified` — Use the alias for reads; no safe ScriptCards write target has been verified.

| Direct alias | ScriptCards read location | Value role | Values / format | Description | Write using |
|---|---|---|---|---|---|
| `simpleproficencies` | Direct alias: `simpleproficencies` | `COMPUTED` | Text/string — content is record-specific; blank may be meaningful. | `simpleproficencies` is a direct alias that provides convenient ScriptCards access to the Beacon data described in the location column. | `Write not verified` |
| `tool_mod` | Direct alias: `tool_mod` | `COMPUTED` | Numeric or numeric-form compatibility output. Exact formatting (for example signed text versus number) was not independently probed where this is a legacy projection. | `tool_mod` is a direct alias that provides convenient ScriptCards access to the Beacon data described in the location column. | `Write not verified` |
| `toolattr` | Direct alias: `toolattr` | `COMPUTED` | Text/string — content is record-specific; blank may be meaningful. | `toolattr` is a direct alias that provides convenient ScriptCards access to the Beacon data described in the location column. | `Write not verified` |
| `toolattr_base` | Direct alias: `toolattr_base` | `COMPUTED` | Text/string — content is record-specific; blank may be meaningful. | `toolattr_base` is a direct alias that provides convenient ScriptCards access to the Beacon data described in the location column. | `Write not verified` |
| `toolbonus` | Direct alias: `toolbonus` | `COMPUTED` | Numeric or numeric-form compatibility output. Exact formatting (for example signed text versus number) was not independently probed where this is a legacy projection. | `toolbonus` is a direct alias that provides convenient ScriptCards access to the Beacon data described in the location column. | `Write not verified` |
| `toolbonus_base` | Direct alias: `toolbonus_base` | `COMPUTED` | Numeric or numeric-form compatibility output. Exact formatting (for example signed text versus number) was not independently probed where this is a legacy projection. | `toolbonus_base` is a direct alias that provides convenient ScriptCards access to the Beacon data described in the location column. | `Write not verified` |
| `toolbonus_display` | Direct alias: `toolbonus_display` | `COMPUTED` | Text/string — content is record-specific; blank may be meaningful. | `toolbonus_display` is a direct alias that provides convenient ScriptCards access to the Beacon data described in the location column. | `Write not verified` |
| `toolname` | Direct alias: `toolname` | `COMPUTED` | Text/string — content is record-specific; blank may be meaningful. | `toolname` is a direct alias that provides convenient ScriptCards access to the Beacon data described in the location column. | `Write not verified` |

#### Conditions and exhaustion

> **Value roles**
>
> - `COMPUTED` — A calculated or aggregated result. Change the named source input rather than writing the result.
>
> **Write using**
>
> - `Write not verified` — Use the alias for reads; no safe ScriptCards write target has been verified.

| Direct alias | ScriptCards read location | Value role | Values / format | Description | Write using |
|---|---|---|---|---|---|
| `exhaustion_1` | Direct alias: `exhaustion_1` | `COMPUTED` | Exhaustion-level compatibility flag for this numbered level; exact legacy representation was not independently probed. | `exhaustion_1` is a direct alias that provides convenient ScriptCards access to the Beacon data described in the location column. | `Write not verified` |
| `exhaustion_2` | Direct alias: `exhaustion_2` | `COMPUTED` | Exhaustion-level compatibility flag for this numbered level; exact legacy representation was not independently probed. | `exhaustion_2` is a direct alias that provides convenient ScriptCards access to the Beacon data described in the location column. | `Write not verified` |
| `exhaustion_3` | Direct alias: `exhaustion_3` | `COMPUTED` | Exhaustion-level compatibility flag for this numbered level; exact legacy representation was not independently probed. | `exhaustion_3` is a direct alias that provides convenient ScriptCards access to the Beacon data described in the location column. | `Write not verified` |
| `exhaustion_4` | Direct alias: `exhaustion_4` | `COMPUTED` | Exhaustion-level compatibility flag for this numbered level; exact legacy representation was not independently probed. | `exhaustion_4` is a direct alias that provides convenient ScriptCards access to the Beacon data described in the location column. | `Write not verified` |
| `exhaustion_5` | Direct alias: `exhaustion_5` | `COMPUTED` | Exhaustion-level compatibility flag for this numbered level; exact legacy representation was not independently probed. | `exhaustion_5` is a direct alias that provides convenient ScriptCards access to the Beacon data described in the location column. | `Write not verified` |
| `exhaustion_6` | Direct alias: `exhaustion_6` | `COMPUTED` | Exhaustion-level compatibility flag for this numbered level; exact legacy representation was not independently probed. | `exhaustion_6` is a direct alias that provides convenient ScriptCards access to the Beacon data described in the location column. | `Write not verified` |
| `exhaustion_level` | Direct alias: `exhaustion_level` | `COMPUTED` | Numeric Exhaustion level compatibility output. Exact writable representation is not verified; use canonical Exhaustion records for record-level work. | `exhaustion_level` is a direct alias that provides convenient ScriptCards access to the Beacon data described in the location column. | `Write not verified` |
| `exhaustion_toggle` | Direct alias: `exhaustion_toggle` | `COMPUTED` | Compatibility toggle output for Exhaustion; exact legacy representation was not independently probed. Do not use it as a write target. | `exhaustion_toggle` is a direct alias that provides convenient ScriptCards access to the Beacon data described in the location column. | `Write not verified` |

#### Global roll modifiers

> **Value roles**
>
> - `COMPUTED` — A calculated or aggregated result. Change the named source input rather than writing the result.
> - `UNKNOWN` — The character-level direct alias is not exposed by the verified Beacon build.
>
> **Write using**
>
> - `Write not verified` — Use the alias for reads; no safe ScriptCards write target has been verified.
> - `Not mapped` — The character-level direct alias is unavailable and no replacement write route has been verified.

| Direct alias | ScriptCards read location | Value role | Values / format | Description | Write using |
|---|---|---|---|---|---|
| `global_ac_active_flag` | Direct alias: `global_ac_active_flag` | `COMPUTED` | Compatibility flag/toggle output. Exact legacy representation (`0`/`1`, boolean, blank/text, etc.) was not independently verified; do not assume a writable boolean unless the row names a canonical boolean source. | `global_ac_active_flag` is a direct alias that provides convenient ScriptCards access to the Beacon data described in the location column. | `Write not verified` |
| `global_ac_mod_flag` | Direct alias: `global_ac_mod_flag` | `COMPUTED` | Compatibility flag/toggle output. Exact legacy representation (`0`/`1`, boolean, blank/text, etc.) was not independently verified; do not assume a writable boolean unless the row names a canonical boolean source. | `global_ac_mod_flag` is a direct alias that provides convenient ScriptCards access to the Beacon data described in the location column. | `Write not verified` |
| `global_ac_name` | Direct alias: `global_ac_name` | `COMPUTED` | Text/string — content is record-specific; blank may be meaningful. | `global_ac_name` is a direct alias that provides convenient ScriptCards access to the Beacon data described in the location column. | `Write not verified` |
| `global_ac_val` | Direct alias: `global_ac_val` | `COMPUTED` | Number — use a numeric value. The meaningful range depends on the field; no additional range is implied unless stated here. | `global_ac_val` is a direct alias that provides convenient ScriptCards access to the Beacon data described in the location column. | `Write not verified` |
| `global_attack_active_flag` | Direct alias: `global_attack_active_flag` | `COMPUTED` | Compatibility flag/toggle output. Exact legacy representation (`0`/`1`, boolean, blank/text, etc.) was not independently verified; do not assume a writable boolean unless the row names a canonical boolean source. | `global_attack_active_flag` is a direct alias that provides convenient ScriptCards access to the Beacon data described in the location column. | `Write not verified` |
| `global_attack_mod` | Direct alias: `global_attack_mod` | `COMPUTED` | Number — use a numeric value. The meaningful range depends on the field; no additional range is implied unless stated here. | `global_attack_mod` is a direct alias that provides convenient ScriptCards access to the Beacon data described in the location column. | `Write not verified` |
| `global_attack_mod_flag` | Direct alias: `global_attack_mod_flag` | `COMPUTED` | Compatibility flag/toggle output. Exact legacy representation (`0`/`1`, boolean, blank/text, etc.) was not independently verified; do not assume a writable boolean unless the row names a canonical boolean source. | `global_attack_mod_flag` is a direct alias that provides convenient ScriptCards access to the Beacon data described in the location column. | `Write not verified` |
| `global_attack_rollstring` | Direct alias: `global_attack_rollstring` | `COMPUTED` | Text/string — content is record-specific; blank may be meaningful. | `global_attack_rollstring` is a direct alias that provides convenient ScriptCards access to the Beacon data described in the location column. | `Write not verified` |
| `global_damage_active_flag` | Direct alias: `global_damage_active_flag` | `COMPUTED` | Compatibility flag/toggle output. Exact legacy representation (`0`/`1`, boolean, blank/text, etc.) was not independently verified; do not assume a writable boolean unless the row names a canonical boolean source. | `global_damage_active_flag` is a direct alias that provides convenient ScriptCards access to the Beacon data described in the location column. | `Write not verified` |
| `global_damage_mod_crit` | Direct alias: `global_damage_mod_crit` | `COMPUTED` | Number — use a numeric value. The meaningful range depends on the field; no additional range is implied unless stated here. | `global_damage_mod_crit` is a direct alias that provides convenient ScriptCards access to the Beacon data described in the location column. | `Write not verified` |
| `global_damage_mod_flag` | Direct alias: `global_damage_mod_flag` | `COMPUTED` | Compatibility flag/toggle output. Exact legacy representation (`0`/`1`, boolean, blank/text, etc.) was not independently verified; do not assume a writable boolean unless the row names a canonical boolean source. | `global_damage_mod_flag` is a direct alias that provides convenient ScriptCards access to the Beacon data described in the location column. | `Write not verified` |
| `global_damage_mod_roll` | Direct alias: `global_damage_mod_roll` | `COMPUTED` | Text/string — content is record-specific; blank may be meaningful. | `global_damage_mod_roll` is a direct alias that provides convenient ScriptCards access to the Beacon data described in the location column. | `Write not verified` |
| `global_damage_mod_type` | Direct alias: `global_damage_mod_type` | `COMPUTED` | Text/string — content is record-specific; blank may be meaningful. | `global_damage_mod_type` is a direct alias that provides convenient ScriptCards access to the Beacon data described in the location column. | `Write not verified` |
| `global_damage_rollstring` | Direct alias: `global_damage_rollstring` | `COMPUTED` | Text/string — content is record-specific; blank may be meaningful. | `global_damage_rollstring` is a direct alias that provides convenient ScriptCards access to the Beacon data described in the location column. | `Write not verified` |
| `global_damage_type` | Direct alias: `global_damage_type` | `COMPUTED` | Text/string — content is record-specific; blank may be meaningful. | `global_damage_type` is a direct alias that provides convenient ScriptCards access to the Beacon data described in the location column. | `Write not verified` |
| `global_save_active_flag` | Direct alias: `global_save_active_flag` | `COMPUTED` | Compatibility flag/toggle output. Exact legacy representation (`0`/`1`, boolean, blank/text, etc.) was not independently verified; do not assume a writable boolean unless the row names a canonical boolean source. | `global_save_active_flag` is a direct alias that provides convenient ScriptCards access to the Beacon data described in the location column. | `Write not verified` |
| `global_save_mod` | Direct alias: `global_save_mod` | `COMPUTED` | Number — use a numeric value. The meaningful range depends on the field; no additional range is implied unless stated here. | `global_save_mod` is a direct alias that provides convenient ScriptCards access to the Beacon data described in the location column. | `Write not verified` |
| `global_save_mod_flag` | Direct alias: `global_save_mod_flag` | `COMPUTED` | Compatibility flag/toggle output. Exact legacy representation (`0`/`1`, boolean, blank/text, etc.) was not independently verified; do not assume a writable boolean unless the row names a canonical boolean source. | `global_save_mod_flag` is a direct alias that provides convenient ScriptCards access to the Beacon data described in the location column. | `Write not verified` |
| `global_save_rollstring` | Direct alias: `global_save_rollstring` | `COMPUTED` | Text/string — content is record-specific; blank may be meaningful. | `global_save_rollstring` is a direct alias that provides convenient ScriptCards access to the Beacon data described in the location column. | `Write not verified` |
| `global_skill_active_flag` | Direct alias: `global_skill_active_flag` | `COMPUTED` | Compatibility flag/toggle output. Exact legacy representation (`0`/`1`, boolean, blank/text, etc.) was not independently verified; do not assume a writable boolean unless the row names a canonical boolean source. | `global_skill_active_flag` is a direct alias that provides convenient ScriptCards access to the Beacon data described in the location column. | `Write not verified` |
| `global_skill_mod` | Direct alias: `global_skill_mod` | `COMPUTED` | Number — use a numeric value. The meaningful range depends on the field; no additional range is implied unless stated here. | `global_skill_mod` is a direct alias that provides convenient ScriptCards access to the Beacon data described in the location column. | `Write not verified` |
| `global_skill_mod_flag` | Direct alias: `global_skill_mod_flag` | `COMPUTED` | Compatibility flag/toggle output. Exact legacy representation (`0`/`1`, boolean, blank/text, etc.) was not independently verified; do not assume a writable boolean unless the row names a canonical boolean source. | `global_skill_mod_flag` is a direct alias that provides convenient ScriptCards access to the Beacon data described in the location column. | `Write not verified` |
| `global_skill_rollstring` | Direct alias: `global_skill_rollstring` | `COMPUTED` | Text/string — content is record-specific; blank may be meaningful. | `global_skill_rollstring` is a direct alias that provides convenient ScriptCards access to the Beacon data described in the location column. | `Write not verified` |
| `globalmagicmod` | Character-level direct alias: not exposed in the verified Beacon build<br>Verified fallback result: missing `user.globalmagicmod` Custom Attribute | `UNKNOWN` | Numeric or numeric-form compatibility output. Exact formatting (for example signed text versus number) was not independently probed where this is a legacy projection. | A bare `globalmagicmod` read falls through to the classic custom-attribute fallback and produces a missing Custom Attribute error. Do not use it as a Beacon character-level spellcasting modifier. | `Not mapped` |
| `globalsavemod` | Direct alias: `globalsavemod` | `COMPUTED` | Number — use a numeric value. The meaningful range depends on the field; no additional range is implied unless stated here. | `globalsavemod` is a direct alias that provides convenient ScriptCards access to the Beacon data described in the location column. | `Write not verified` |
| `globalsavingthrowbonus` | Direct alias: `globalsavingthrowbonus` | `COMPUTED` | Number — use a numeric value. The meaningful range depends on the field; no additional range is implied unless stated here. | `globalsavingthrowbonus` is a direct alias that provides convenient ScriptCards access to the Beacon data described in the location column. | `Write not verified` |

#### Combat statistics

> **Value roles**
>
> - `COMPUTED` — A calculated or aggregated result. Change the named source input rather than writing the result.
>
> **Write using**
>
> - `Typed collection` — Locate the matching existing record through the location labeled `Typed collection:` or `Typed collections:` in the row. When the row names a field, write that field; otherwise use the corresponding typed-collection table below to choose the existing primitive field that represents the intended change.

| Direct alias | ScriptCards read location | Value role | Values / format | Description | Write using |
|---|---|---|---|---|---|
| `hit_dice_max` | Direct alias: `hit_dice_max`<br>Typed collection: `hitdices` | `COMPUTED` | Number — use a numeric value. The meaningful range depends on the field; no additional range is implied unless stated here. | `hit_dice_max` is the translated maximum Hit Dice value derived from canonical Hit Dice records. | `Typed collection` |
| `hitdie_final` | Direct alias: `hitdie_final`<br>Typed collection: `hitdices` | `COMPUTED` | Number — use a numeric value. The meaningful range depends on the field; no additional range is implied unless stated here. | `hitdie_final` is a compatibility result derived from the applicable Hit Dice record. | `Typed collection` |
| `hitdietype` | Direct alias: `hitdietype`<br>Typed collection: `hitdices->[selector]->dieSize` | `COMPUTED` | Die-size value from the applicable Hit Dice record; interpret as the character's hit-die size. | `hitdietype` is the compatibility die-size value derived from the applicable Hit Dice record. | `Typed collection` |

#### Settings and UI

> **Value roles**
>
> - `COMPUTED` — A calculated or aggregated result. Change the named source input rather than writing the result.
>
> **Write using**
>
> - `Write not verified` — Use the alias for reads; no safe ScriptCards write target has been verified.

| Direct alias | ScriptCards read location | Value role | Values / format | Description | Write using |
|---|---|---|---|---|---|
| `cancel` | Direct alias: `cancel` | `COMPUTED` | Compatibility flag/toggle output. Exact legacy representation (`0`/`1`, boolean, blank/text, etc.) was not independently verified; do not assume a writable boolean unless the row names a canonical boolean source. | `cancel` is a direct alias that provides convenient ScriptCards access to the Beacon data described in the location column. | `Write not verified` |
| `carrying_capacity_mod` | Direct alias: `carrying_capacity_mod` | `COMPUTED` | Number — use a numeric value. The meaningful range depends on the field; no additional range is implied unless stated here. | `carrying_capacity_mod` is a direct alias that provides convenient ScriptCards access to the Beacon data described in the location column. | `Write not verified` |
| `confirm` | Direct alias: `confirm` | `COMPUTED` | Compatibility flag/toggle output. Exact legacy representation (`0`/`1`, boolean, blank/text, etc.) was not independently verified; do not assume a writable boolean unless the row names a canonical boolean source. | `confirm` is a direct alias that provides convenient ScriptCards access to the Beacon data described in the location column. | `Write not verified` |
| `encumberance` | Direct alias: `encumberance`<br>Structured path: `sheet->settings->encumbranceType` | `COMPUTED` | Compatibility text backed by `sheet->settings->encumbranceType`; the complete allowed enum was not independently enumerated. | `encumberance` is a direct alias that provides convenient ScriptCards access to the Beacon data described in the location column. | `Write not verified` |
| `mancer_cancel` | Direct alias: `mancer_cancel` | `COMPUTED` | Compatibility flag/toggle output. Exact legacy representation (`0`/`1`, boolean, blank/text, etc.) was not independently verified; do not assume a writable boolean unless the row names a canonical boolean source. | `mancer_cancel` is a direct alias that provides convenient ScriptCards access to the Beacon data described in the location column. | `Write not verified` |
| `mancer_confirm` | Direct alias: `mancer_confirm` | `COMPUTED` | Compatibility flag/toggle output. Exact legacy representation (`0`/`1`, boolean, blank/text, etc.) was not independently verified; do not assume a writable boolean unless the row names a canonical boolean source. | `mancer_confirm` is a direct alias that provides convenient ScriptCards access to the Beacon data described in the location column. | `Write not verified` |
| `mancer_confirm_flag` | Direct alias: `mancer_confirm_flag` | `COMPUTED` | Compatibility flag/toggle output. Exact legacy representation (`0`/`1`, boolean, blank/text, etc.) was not independently verified; do not assume a writable boolean unless the row names a canonical boolean source. | `mancer_confirm_flag` is a direct alias that provides convenient ScriptCards access to the Beacon data described in the location column. | `Write not verified` |
| `mancer_npc` | Direct alias: `mancer_npc` | `COMPUTED` | Compatibility output — the exact returned value domain was not independently verified in the controlled probes. | `mancer_npc` is a direct alias that provides convenient ScriptCards access to the Beacon data described in the location column. | `Write not verified` |
| `missing_info` | Direct alias: `missing_info` | `COMPUTED` | Compatibility flag/toggle output. Exact legacy representation (`0`/`1`, boolean, blank/text, etc.) was not independently verified; do not assume a writable boolean unless the row names a canonical boolean source. | `missing_info` is a direct alias that provides convenient ScriptCards access to the Beacon data described in the location column. | `Write not verified` |
| `monster_confirm_flag` | Direct alias: `monster_confirm_flag` | `COMPUTED` | Compatibility flag/toggle output. Exact legacy representation (`0`/`1`, boolean, blank/text, etc.) was not independently verified; do not assume a writable boolean unless the row names a canonical boolean source. | `monster_confirm_flag` is a direct alias that provides convenient ScriptCards access to the Beacon data described in the location column. | `Write not verified` |
| `options-class-selection` | Direct alias: `options-class-selection` | `COMPUTED` | Text/string — content is record-specific; blank may be meaningful. | `options-class-selection` is a direct alias that provides convenient ScriptCards access to the Beacon data described in the location column. | `Write not verified` |
| `options-flag` | Direct alias: `options-flag` | `COMPUTED` | Compatibility flag/toggle output. Exact legacy representation (`0`/`1`, boolean, blank/text, etc.) was not independently verified; do not assume a writable boolean unless the row names a canonical boolean source. | `options-flag` is a direct alias that provides convenient ScriptCards access to the Beacon data described in the location column. | `Write not verified` |
| `options-flag-bonds` | Direct alias: `options-flag-bonds` | `COMPUTED` | Compatibility flag/toggle output. Exact legacy representation (`0`/`1`, boolean, blank/text, etc.) was not independently verified; do not assume a writable boolean unless the row names a canonical boolean source. | `options-flag-bonds` is a direct alias that provides convenient ScriptCards access to the Beacon data described in the location column. | `Write not verified` |
| `options-flag-flaws` | Direct alias: `options-flag-flaws` | `COMPUTED` | Compatibility flag/toggle output. Exact legacy representation (`0`/`1`, boolean, blank/text, etc.) was not independently verified; do not assume a writable boolean unless the row names a canonical boolean source. | `options-flag-flaws` is a direct alias that provides convenient ScriptCards access to the Beacon data described in the location column. | `Write not verified` |
| `options-flag-ideals` | Direct alias: `options-flag-ideals` | `COMPUTED` | Compatibility flag/toggle output. Exact legacy representation (`0`/`1`, boolean, blank/text, etc.) was not independently verified; do not assume a writable boolean unless the row names a canonical boolean source. | `options-flag-ideals` is a direct alias that provides convenient ScriptCards access to the Beacon data described in the location column. | `Write not verified` |
| `options-flag-personality` | Direct alias: `options-flag-personality` | `COMPUTED` | Compatibility flag/toggle output. Exact legacy representation (`0`/`1`, boolean, blank/text, etc.) was not independently verified; do not assume a writable boolean unless the row names a canonical boolean source. | `options-flag-personality` is a direct alias that provides convenient ScriptCards access to the Beacon data described in the location column. | `Write not verified` |
| `simpletraits` | Direct alias: `simpletraits`<br>Structured path: `sheet->settings->layoutState` | `COMPUTED` | Legacy layout/traits compatibility output backed in part by `sheet->settings->layoutState`; exact translated value literals were not independently probed. | `simpletraits` is a direct alias that provides convenient ScriptCards access to the Beacon data described in the location column. | `Write not verified` |
| `tab` | Direct alias: `tab` | `COMPUTED` | Text/string — content is record-specific; blank may be meaningful. | `tab` is a direct alias that provides convenient ScriptCards access to the Beacon data described in the location column. | `Write not verified` |

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

| Direct alias | ScriptCards read location | Value role | Values / format | Description | Write using |
|---|---|---|---|---|---|
| `armorwarningflag` | Direct alias: `armorwarningflag`<br>Typed collections: `armorclasses`; equipped armor/shields: `items` | `COMPUTED` | Compatibility flag/toggle output. Exact legacy representation (`0`/`1`, boolean, blank/text, etc.) was not independently verified; do not assume a writable boolean unless the row names a canonical boolean source. | `armorwarningflag` is a legacy armor-warning flag. Beacon derives AC from applicable Armor Class records and related equipped Item records instead of storing this as an independent AC field. | `Typed collection` |
| `charisma_base` | Direct alias: `charisma_base` | `COMPUTED` | Numeric or numeric-form compatibility output. Exact formatting (for example signed text versus number) was not independently probed where this is a legacy projection. | `charisma_base` is a direct alias that provides convenient ScriptCards access to the Beacon data described in the location column. | `Write not verified` |
| `charisma_bonus` | Direct alias: `charisma_bonus` | `COMPUTED` | Numeric or numeric-form compatibility output. Exact formatting (for example signed text versus number) was not independently probed where this is a legacy projection. | `charisma_bonus` is a direct alias that provides convenient ScriptCards access to the Beacon data described in the location column. | `Write not verified` |
| `charisma_flag` | Direct alias: `charisma_flag` | `COMPUTED` | Compatibility flag/toggle output. Exact legacy representation (`0`/`1`, boolean, blank/text, etc.) was not independently verified; do not assume a writable boolean unless the row names a canonical boolean source. | `charisma_flag` is a direct alias that provides convenient ScriptCards access to the Beacon data described in the location column. | `Write not verified` |
| `constitution_base` | Direct alias: `constitution_base` | `COMPUTED` | Numeric or numeric-form compatibility output. Exact formatting (for example signed text versus number) was not independently probed where this is a legacy projection. | `constitution_base` is a direct alias that provides convenient ScriptCards access to the Beacon data described in the location column. | `Write not verified` |
| `constitution_bonus` | Direct alias: `constitution_bonus` | `COMPUTED` | Numeric or numeric-form compatibility output. Exact formatting (for example signed text versus number) was not independently probed where this is a legacy projection. | `constitution_bonus` is a direct alias that provides convenient ScriptCards access to the Beacon data described in the location column. | `Write not verified` |
| `constitution_flag` | Direct alias: `constitution_flag` | `COMPUTED` | Compatibility flag/toggle output. Exact legacy representation (`0`/`1`, boolean, blank/text, etc.) was not independently verified; do not assume a writable boolean unless the row names a canonical boolean source. | `constitution_flag` is a direct alias that provides convenient ScriptCards access to the Beacon data described in the location column. | `Write not verified` |
| `cust_charisma_save_prof` | Direct alias: `cust_charisma_save_prof`<br>Typed collection: `proficiencies`<br>Match: `category = Saving Throw`; `proficiency = Charisma` | `COMPUTED` | Skill/save proficiency compatibility value. The canonical `proficiencyLevel` strings include observed values such as `Proficient` and `Expertise`; this alias's exact legacy representation was not independently probed. | `cust_charisma_save_prof` is a legacy custom Charisma saving-throw proficiency control. Beacon represents the effective proficiency with a matching Proficiency record rather than an independent custom scalar. | `Typed collection` |
| `cust_constitution_save_prof` | Direct alias: `cust_constitution_save_prof`<br>Typed collection: `proficiencies`<br>Match: `category = Saving Throw`; `proficiency = Constitution` | `COMPUTED` | Skill/save proficiency compatibility value. The canonical `proficiencyLevel` strings include observed values such as `Proficient` and `Expertise`; this alias's exact legacy representation was not independently probed. | `cust_constitution_save_prof` is a legacy custom Constitution saving-throw proficiency control. Beacon represents the effective proficiency with a matching Proficiency record rather than an independent custom scalar. | `Typed collection` |
| `cust_dexterity_save_prof` | Direct alias: `cust_dexterity_save_prof`<br>Typed collection: `proficiencies`<br>Match: `category = Saving Throw`; `proficiency = Dexterity` | `COMPUTED` | Skill/save proficiency compatibility value. The canonical `proficiencyLevel` strings include observed values such as `Proficient` and `Expertise`; this alias's exact legacy representation was not independently probed. | `cust_dexterity_save_prof` is a legacy custom Dexterity saving-throw proficiency control. Beacon represents the effective proficiency with a matching Proficiency record rather than an independent custom scalar. | `Typed collection` |
| `cust_intelligence_save_prof` | Direct alias: `cust_intelligence_save_prof`<br>Typed collection: `proficiencies`<br>Match: `category = Saving Throw`; `proficiency = Intelligence` | `COMPUTED` | Skill/save proficiency compatibility value. The canonical `proficiencyLevel` strings include observed values such as `Proficient` and `Expertise`; this alias's exact legacy representation was not independently probed. | `cust_intelligence_save_prof` is a legacy custom Intelligence saving-throw proficiency control. Beacon represents the effective proficiency with a matching Proficiency record rather than an independent custom scalar. | `Typed collection` |
| `cust_strength_save_prof` | Direct alias: `cust_strength_save_prof`<br>Typed collection: `proficiencies`<br>Match: `category = Saving Throw`; `proficiency = Strength` | `COMPUTED` | Skill/save proficiency compatibility value. The canonical `proficiencyLevel` strings include observed values such as `Proficient` and `Expertise`; this alias's exact legacy representation was not independently probed. | `cust_strength_save_prof` is a legacy custom Strength saving-throw proficiency control. Beacon represents the effective proficiency with a matching Proficiency record rather than an independent custom scalar. | `Typed collection` |
| `cust_wisdom_save_prof` | Direct alias: `cust_wisdom_save_prof`<br>Typed collection: `proficiencies`<br>Match: `category = Saving Throw`; `proficiency = Wisdom` | `COMPUTED` | Skill/save proficiency compatibility value. The canonical `proficiencyLevel` strings include observed values such as `Proficient` and `Expertise`; this alias's exact legacy representation was not independently probed. | `cust_wisdom_save_prof` is a legacy custom Wisdom saving-throw proficiency control. Beacon represents the effective proficiency with a matching Proficiency record rather than an independent custom scalar. | `Typed collection` |
| `custom_ac_base` | Direct alias: `custom_ac_base`<br>Typed collections: `armorclasses`; equipped armor/shields: `items` | `COMPUTED` | Numeric or numeric-form compatibility output. Exact formatting (for example signed text versus number) was not independently probed where this is a legacy projection. | `custom_ac_base` is a legacy custom-AC base component. Beacon derives AC from applicable Armor Class records and related equipped Item records instead of storing this as an independent AC field. | `Typed collection` |
| `custom_ac_flag` | Direct alias: `custom_ac_flag`<br>Typed collections: `armorclasses`; equipped armor/shields: `items` | `COMPUTED` | Compatibility flag/toggle output. Exact legacy representation (`0`/`1`, boolean, blank/text, etc.) was not independently verified; do not assume a writable boolean unless the row names a canonical boolean source. | `custom_ac_flag` is a legacy custom-AC activation flag. Beacon derives AC from applicable Armor Class records and related equipped Item records instead of storing this as an independent AC field. | `Typed collection` |
| `custom_ac_part1` | Direct alias: `custom_ac_part1`<br>Typed collections: `armorclasses`; equipped armor/shields: `items` | `COMPUTED` | Text/string — content is record-specific; blank may be meaningful. | `custom_ac_part1` is a legacy first custom-AC formula component. Beacon derives AC from applicable Armor Class records and related equipped Item records instead of storing this as an independent AC field. | `Typed collection` |
| `custom_ac_part2` | Direct alias: `custom_ac_part2`<br>Typed collections: `armorclasses`; equipped armor/shields: `items` | `COMPUTED` | Text/string — content is record-specific; blank may be meaningful. | `custom_ac_part2` is a legacy second custom-AC formula component. Beacon derives AC from applicable Armor Class records and related equipped Item records instead of storing this as an independent AC field. | `Typed collection` |
| `custom_ac_shield` | Direct alias: `custom_ac_shield`<br>Typed collections: `armorclasses`; equipped armor/shields: `items` | `COMPUTED` | Compatibility output — the exact returned value domain was not independently verified in the controlled probes. | `custom_ac_shield` is a legacy custom shield-AC component. Beacon derives AC from applicable Armor Class records and related equipped Item records instead of storing this as an independent AC field. | `Typed collection` |
| `customacwarningflag` | Direct alias: `customacwarningflag`<br>Typed collections: `armorclasses`; equipped armor/shields: `items` | `COMPUTED` | Compatibility flag/toggle output. Exact legacy representation (`0`/`1`, boolean, blank/text, etc.) was not independently verified; do not assume a writable boolean unless the row names a canonical boolean source. | `customacwarningflag` is a legacy custom-AC warning flag. Beacon derives AC from applicable Armor Class records and related equipped Item records instead of storing this as an independent AC field. | `Typed collection` |
| `dexterity_base` | Direct alias: `dexterity_base` | `COMPUTED` | Numeric or numeric-form compatibility output. Exact formatting (for example signed text versus number) was not independently probed where this is a legacy projection. | `dexterity_base` is a direct alias that provides convenient ScriptCards access to the Beacon data described in the location column. | `Write not verified` |
| `dexterity_bonus` | Direct alias: `dexterity_bonus` | `COMPUTED` | Numeric or numeric-form compatibility output. Exact formatting (for example signed text versus number) was not independently probed where this is a legacy projection. | `dexterity_bonus` is a direct alias that provides convenient ScriptCards access to the Beacon data described in the location column. | `Write not verified` |
| `dexterity_flag` | Direct alias: `dexterity_flag` | `COMPUTED` | Compatibility flag/toggle output. Exact legacy representation (`0`/`1`, boolean, blank/text, etc.) was not independently verified; do not assume a writable boolean unless the row names a canonical boolean source. | `dexterity_flag` is a direct alias that provides convenient ScriptCards access to the Beacon data described in the location column. | `Write not verified` |
| `display_flag` | Direct alias: `display_flag` | `COMPUTED` | Compatibility flag/toggle output. Exact legacy representation (`0`/`1`, boolean, blank/text, etc.) was not independently verified; do not assume a writable boolean unless the row names a canonical boolean source. | `display_flag` is a legacy display-control value rather than an authoritative Beacon character value. | `Write not verified` |
| `innate` | Direct alias: `innate`<br>Known typed collections: applicable `spells` and `spellcastings` records | `COMPUTED` | Boolean — stored as `true` / `false`. ScriptCards structured writes also accept `1`/`0`, `yes`/`no`, and `on`/`off`. | `innate` is a legacy spellcasting compatibility value. Beacon stores innate spell and caster details on Spell and Spellcasting records. | `Write not verified` |
| `intelligence_base` | Direct alias: `intelligence_base` | `COMPUTED` | Numeric or numeric-form compatibility output. Exact formatting (for example signed text versus number) was not independently probed where this is a legacy projection. | `intelligence_base` is a direct alias that provides convenient ScriptCards access to the Beacon data described in the location column. | `Write not verified` |
| `intelligence_bonus` | Direct alias: `intelligence_bonus` | `COMPUTED` | Numeric or numeric-form compatibility output. Exact formatting (for example signed text versus number) was not independently probed where this is a legacy projection. | `intelligence_bonus` is a direct alias that provides convenient ScriptCards access to the Beacon data described in the location column. | `Write not verified` |
| `intelligence_flag` | Direct alias: `intelligence_flag` | `COMPUTED` | Compatibility flag/toggle output. Exact legacy representation (`0`/`1`, boolean, blank/text, etc.) was not independently verified; do not assume a writable boolean unless the row names a canonical boolean source. | `intelligence_flag` is a direct alias that provides convenient ScriptCards access to the Beacon data described in the location column. | `Write not verified` |
| `pb_custom` | Direct alias: `pb_custom` | `COMPUTED` | Number — use a numeric value. The meaningful range depends on the field; no additional range is implied unless stated here. | `pb_custom` is a direct alias that provides convenient ScriptCards access to the Beacon data described in the location column. | `Write not verified` |
| `pb_type` | Direct alias: `pb_type` | `COMPUTED` | Compatibility output — the exact returned value domain was not independently verified in the controlled probes. | `pb_type` is a direct alias that provides convenient ScriptCards access to the Beacon data described in the location column. | `Write not verified` |
| `pbd_safe` | Direct alias: `pbd_safe` | `COMPUTED` | Compatibility output — the exact returned value domain was not independently verified in the controlled probes. | `pbd_safe` is a direct alias that provides convenient ScriptCards access to the Beacon data described in the location column. | `Write not verified` |
| `prof_type` | Direct alias: `prof_type` | `COMPUTED` | Compatibility output — the exact returned value domain was not independently verified in the controlled probes. | `prof_type` is a direct alias that provides convenient ScriptCards access to the Beacon data described in the location column. | `Write not verified` |
| `source` | Direct alias: `source` | `COMPUTED` | Text/string — content is record-specific; blank may be meaningful. | `source` is a compatibility projection of the source label belonging to the current repeating or canonical record context. | `Write not verified` |
| `source_type` | Direct alias: `source_type` and `source` | `COMPUTED` | Text/string — content is record-specific; blank may be meaningful. | `source_type` is a compatibility projection describing the source or record family in the current row context. | `Write not verified` |
| `strength_base` | Direct alias: `strength_base` | `COMPUTED` | Numeric or numeric-form compatibility output. Exact formatting (for example signed text versus number) was not independently probed where this is a legacy projection. | `strength_base` is a direct alias that provides convenient ScriptCards access to the Beacon data described in the location column. | `Write not verified` |
| `strength_bonus` | Direct alias: `strength_bonus` | `COMPUTED` | Numeric or numeric-form compatibility output. Exact formatting (for example signed text versus number) was not independently probed where this is a legacy projection. | `strength_bonus` is a direct alias that provides convenient ScriptCards access to the Beacon data described in the location column. | `Write not verified` |
| `strength_flag` | Direct alias: `strength_flag` | `COMPUTED` | Compatibility flag/toggle output. Exact legacy representation (`0`/`1`, boolean, blank/text, etc.) was not independently verified; do not assume a writable boolean unless the row names a canonical boolean source. | `strength_flag` is a direct alias that provides convenient ScriptCards access to the Beacon data described in the location column. | `Write not verified` |
| `token_size` | Direct alias: `token_size`<br>Known sources: direct alias `size`; typed collection field `sizes->[selector]->sizeValue` | `COMPUTED` | Number — use a numeric value. The meaningful range depends on the field; no additional range is implied unless stated here. | `token_size` is a legacy token-scale compatibility value derived from the character’s canonical Size data. | `Write not verified` |
| `versatile_alt` | Direct alias: `versatile_alt`<br>Parent typed records: `items`; linked `attacks` and `damages` | `SYNTH` | Synthetic compatibility output assembled from canonical records; exact legacy formatting is record-dependent unless a canonical source is named in this row. | `versatile_alt` is a synthetic repeating-row value for alternate versatile-weapon damage. It is assembled from the parent Item and linked Attack/Damage records. | `Parent typed record` |
| `wisdom_base` | Direct alias: `wisdom_base` | `COMPUTED` | Numeric or numeric-form compatibility output. Exact formatting (for example signed text versus number) was not independently probed where this is a legacy projection. | `wisdom_base` is a direct alias that provides convenient ScriptCards access to the Beacon data described in the location column. | `Write not verified` |
| `wisdom_bonus` | Direct alias: `wisdom_bonus` | `COMPUTED` | Numeric or numeric-form compatibility output. Exact formatting (for example signed text versus number) was not independently probed where this is a legacy projection. | `wisdom_bonus` is a direct alias that provides convenient ScriptCards access to the Beacon data described in the location column. | `Write not verified` |
| `wisdom_flag` | Direct alias: `wisdom_flag` | `COMPUTED` | Compatibility flag/toggle output. Exact legacy representation (`0`/`1`, boolean, blank/text, etc.) was not independently verified; do not assume a writable boolean unless the row names a canonical boolean source. | `wisdom_flag` is a direct alias that provides convenient ScriptCards access to the Beacon data described in the location column. | `Write not verified` |

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

| Direct alias | ScriptCards read location | Value role | Values / format | Description | Write using |
|---|---|---|---|---|---|
| `additional_feature_and_traits` | Direct alias: `additional_feature_and_traits` | `UNKNOWN` | Text/string — content is record-specific; blank may be meaningful. | `additional_feature_and_traits` exposes the legacy additional features and traits text, but no verified fixed path, canonical record rule, or calculation has been mapped for it. | `Not mapped` |
| `allies_and_organizations` | Direct alias: `allies_and_organizations` | `UNKNOWN` | Text/string — content is record-specific; blank may be meaningful. | `allies_and_organizations` exposes the legacy allies and organizations text, but no verified fixed path, canonical record rule, or calculation has been mapped for it. | `Not mapped` |
| `bonds` | Direct alias: `bonds` | `UNKNOWN` | Text/string — content is record-specific; blank may be meaningful. | `bonds` exposes the legacy bonds text, but no verified fixed path, canonical record rule, or calculation has been mapped for it. | `Not mapped` |
| `character_appearance` | Direct alias: `character_appearance` | `UNKNOWN` | Text/string — content is record-specific; blank may be meaningful. | `character_appearance` exposes the legacy character appearance text, but no verified fixed path, canonical record rule, or calculation has been mapped for it. | `Not mapped` |
| `character_backstory` | Direct alias: `character_backstory` | `UNKNOWN` | Text/string — content is record-specific; blank may be meaningful. | `character_backstory` exposes the legacy character backstory text, but no verified fixed path, canonical record rule, or calculation has been mapped for it. | `Not mapped` |
| `features_and_traits` | Direct alias: `features_and_traits` | `UNKNOWN` | Text/string — content is record-specific; blank may be meaningful. | `features_and_traits` exposes the legacy features and traits text, but no verified fixed path, canonical record rule, or calculation has been mapped for it. | `Not mapped` |
| `flaws` | Direct alias: `flaws` | `UNKNOWN` | Text/string — content is record-specific; blank may be meaningful. | `flaws` exposes the legacy flaws text, but no verified fixed path, canonical record rule, or calculation has been mapped for it. | `Not mapped` |
| `ideals` | Direct alias: `ideals` | `UNKNOWN` | Text/string — content is record-specific; blank may be meaningful. | `ideals` exposes the legacy ideals text, but no verified fixed path, canonical record rule, or calculation has been mapped for it. | `Not mapped` |
| `other_proficiencies_and_languages` | Direct alias: `other_proficiencies_and_languages` | `UNKNOWN` | Text/string — content is record-specific; blank may be meaningful. | `other_proficiencies_and_languages` exposes the legacy other proficiencies and languages text, but no verified fixed path, canonical record rule, or calculation has been mapped for it. | `Not mapped` |
| `personality_traits` | Direct alias: `personality_traits` | `UNKNOWN` | Text/string — content is record-specific; blank may be meaningful. | `personality_traits` exposes the legacy personality traits text, but no verified fixed path, canonical record rule, or calculation has been mapped for it. | `Not mapped` |

#### Shared character values

> **Value roles**
>
> - `UNKNOWN` — The source location or safe write route has not yet been verified.
>
> **Write using**
>
> - `Not mapped` — The source location and safe write route are not yet known.

| Direct alias | ScriptCards read location | Value role | Values / format | Description | Write using |
|---|---|---|---|---|---|
| `version` | Direct alias: `version` | `UNKNOWN` | Version identifier/value exposed by the compatibility layer; exact scalar representation was not independently probed. | `version` exposes the legacy sheet-version value, but no verified fixed path, canonical record rule, or calculation has been mapped for it. | `Not mapped` |

#### Legacy compatibility and roll output

> **Value roles**
>
> - `TRANSIENT` — Temporary builder or interface state rather than ordinary stored character data.
>
> **Write using**
>
> - `Builder/interface state` — The row identifies this with `Builder/interface state:`; it is transient interface data rather than ordinary live character data.

| Direct alias | ScriptCards read location | Value role | Values / format | Description | Write using |
|---|---|---|---|---|---|
| `drop_category` | Direct alias: `drop_category`<br>Builder/interface state: `builder` | `TRANSIENT` | Text/string — content is record-specific; blank may be meaningful. | `drop_category` is transient drag-and-drop or builder workflow state used while processing dropped content. | `Builder/interface state` |
| `drop_content` | Direct alias: `drop_content`<br>Builder/interface state: `builder` | `TRANSIENT` | Text/string — content is record-specific; blank may be meaningful. | `drop_content` is transient drag-and-drop or builder workflow state used while processing dropped content. | `Builder/interface state` |
| `drop_data` | Direct alias: `drop_data`<br>Builder/interface state: `builder` | `TRANSIENT` | Text/string — content is record-specific; blank may be meaningful. | `drop_data` is transient drag-and-drop or builder workflow payload data. | `Builder/interface state` |
| `drop_name` | Direct alias: `drop_name`<br>Builder/interface state: `builder` | `TRANSIENT` | Text/string — content is record-specific; blank may be meaningful. | `drop_name` is the transient name associated with drag-and-drop or builder workflow content. | `Builder/interface state` |

## Placeholder notation

| Placeholder | Meaning |
|---|---|
| `[selector]` | A zero-based typed-collection index, `shortID`, canonical ID, or unique collection-specific identity value such as `name`, `ability`, `speed`, or `spellLevel`. |
| `[index]` | A real zero-based array index. |
| `FIELD` | An existing primitive field on the selected typed record. |
| `VALUE` | The string, number, or boolean being written. |

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

| Field | ScriptCards location | Value kind | Values / format | Description | Use |
|---|---|---|---|---|---|
| `ability` | `abilityscores->[selector]->ability` | `INPUT` | Ability name — verified D&D ability values are `Strength`, `Dexterity`, `Constitution`, `Intelligence`, `Wisdom`, or `Charisma`. | On an Ability Score record, this field identifies the ability used by this record or formula. | `FIND` + `INPUT` + `RECORD` |
| `calculation` | `abilityscores->[selector]->calculation` | `INPUT` | Observed calculation modes include `Set Base`, `Modify`, `Set Value`, and `Minimum`. Not every record family supports every mode; keep the mode appropriate to that record family. | On an Ability Score record, this field identifies the calculation method used by this record. | `FIND` + `INPUT` + `RECORD` |
| `valueFormula.flatValue` | `abilityscores->[selector]->valueFormula->flatValue` | `INPUT` | Number — finite stored formula/input value. Its unit depends on the record (score, AC, speed in feet, slot count, etc.). | On an Ability Score record, this field stores a finite score component. | `FIND` + `INPUT` + `RECORD` — Use the matching direct ability alias for ordinary changes; edit this field only for deliberate record-level control. |
| `valueFormula.ability` | `abilityscores->[selector]->valueFormula->ability` | `INPUT` | Ability name/reference — use the ability value already used by the record; common D&D values are `Strength`, `Dexterity`, `Constitution`, `Intelligence`, `Wisdom`, and `Charisma`. | On an Ability Score record, this field identifies the ability used by this record or formula. | `FIND` + `INPUT` + `RECORD` |
| `_enabled` | `abilityscores->[selector]->_enabled` | `STORED` | Boolean — `true` = this canonical record participates in the live character model; `false` = the record is disabled/excluded. This is not the same as a Condition record's `_active` state. | On an Ability Score record, this field stores whether the canonical record participates in the live character model. | `FIND` + `TOGGLE` + `RECORD` |
| `name` | `abilityscores->[selector]->name` | `STORED` | Display-name string. Use it as a selector only when it uniquely identifies one active record. | On an Ability Score record, this field stores the record's primary display name. | `FIND` + `IDENTITY` |
| `shortID` | `abilityscores->[selector]->shortID` | `STORED` | Compact Beacon record ID string used by sheet action calls. Treat as identity; do not invent or casually edit it. | On an Ability Score record, this field stores the compact ID used by Beacon sheet action calls. | `FIND` + `IDENTITY` |

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

| Field | ScriptCards location | Value kind | Values / format | Description | Use |
|---|---|---|---|---|---|
| `actionType` | `actions->[selector]->actionType` | `STORED` | Observed action categories: `Action`, `Bonus Action`, `Free Action`, `Reaction`, `Legendary`, `Mythic`. Copy the stored capitalization when writing. | On an Action record, this field identifies whether the record is an Action, Bonus Action, Reaction, Free Action, or another action category. | `FIND` + `RECORD` — Changing the category may also require the record identity to appear in the matching action display-order array. |
| `description` | `actions->[selector]->description` | `STORED` | Free text/HTML-like sheet description; blank is valid. | On an Action record, this field stores the human-readable description. | `FIND` + `RECORD` |
| `name` | `actions->[selector]->name` | `STORED` | Display-name string. Use it as a selector only when it uniquely identifies one active record. | On an Action record, this field stores the record's primary display name. | `FIND` + `IDENTITY` |
| `shortID` | `actions->[selector]->shortID` | `STORED` | Compact Beacon record ID string used by sheet action calls. Treat as identity; do not invent or casually edit it. | On an Action record, this field stores the compact ID used by Beacon sheet action calls. | `FIND` + `IDENTITY` — Use this for the Beacon action call; typed writes use the selected collection path. |
| `_enabled` | `actions->[selector]->_enabled` | `STORED` | Boolean — `true` = this canonical record participates in the live character model; `false` = the record is disabled/excluded. This is not the same as a Condition record's `_active` state. | On an Action record, this field stores whether the canonical record participates in the live character model. | `FIND` + `TOGGLE` + `RECORD` |
| `arrayPosition` | `actions->[selector]->arrayPosition` | `ORDER` | Number used for relative record ordering. Treat it as ordering metadata rather than a game statistic. | On an Action record, this field stores the record's relative display position among records of the same family. | `FIND` + `ORDER` |
| `parentID` | `actions->[selector]->parentID` | `STORED` | Canonical parent relationship ID string. Blank means no parent where allowed; otherwise it must identify a valid parent record. | On an Action record, this field stores the relationship ID of the record's immediate parent. | `FIND` + `GRAPH` |
| `childIDs` | `actions->[selector]->childIDs` | `STORED` | Array of canonical child relationship IDs. `[]` = no child records. Preserve valid graph identities and ordering. | On an Action record, this field stores the relationship IDs of this record's immediate child records. | `FIND` + `GRAPH` — Contains relationship IDs; edit an existing array element rather than replacing the whole array. |

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

| Field | ScriptCards location | Value kind | Values / format | Description | Use |
|---|---|---|---|---|---|
| `calculation` | `armorclasses->[selector]->calculation` | `INPUT` | Observed calculation modes include `Set Base`, `Modify`, `Set Value`, and `Minimum`. Not every record family supports every mode; keep the mode appropriate to that record family. | On an Armor Class record, this field identifies the calculation method used by this record. | `FIND` + `INPUT` + `RECORD` |
| `defaultAbility` | `armorclasses->[selector]->defaultAbility` | `STORED` | Boolean — stored as `true` / `false`. ScriptCards structured writes also accept `1`/`0`, `yes`/`no`, and `on`/`off`. | On an Armor Class record, this field stores the default ability used by the formula. | `FIND` + `RECORD` |
| `valueFormula.flatValue` | `armorclasses->[selector]->valueFormula->flatValue` | `INPUT` | Number — finite stored formula/input value. Its unit depends on the record (score, AC, speed in feet, slot count, etc.). | On an Armor Class record, this field stores a finite value used as an input by a formula. | `FIND` + `INPUT` + `RECORD` |
| `valueFormula.ability` | `armorclasses->[selector]->valueFormula->ability` | `INPUT` | Ability name/reference — use the ability value already used by the record; common D&D values are `Strength`, `Dexterity`, `Constitution`, `Intelligence`, `Wisdom`, and `Charisma`. | On an Armor Class record, this field identifies the ability used by this record or formula. | `FIND` + `INPUT` + `RECORD` |
| `_enabled` | `armorclasses->[selector]->_enabled` | `STORED` | Boolean — `true` = this canonical record participates in the live character model; `false` = the record is disabled/excluded. This is not the same as a Condition record's `_active` state. | On an Armor Class record, this field stores whether the canonical record participates in the live character model. | `FIND` + `TOGGLE` + `RECORD` |
| `parentID` | `armorclasses->[selector]->parentID` | `STORED` | Canonical parent relationship ID string. Blank means no parent where allowed; otherwise it must identify a valid parent record. | On an Armor Class record, this field stores the relationship ID of the record's immediate parent. | `FIND` + `GRAPH` |
| `name` | `armorclasses->[selector]->name` | `STORED` | Display-name string. Use it as a selector only when it uniquely identifies one active record. | On an Armor Class record, this field stores the record's primary display name. | `FIND` + `IDENTITY` |
| `shortID` | `armorclasses->[selector]->shortID` | `STORED` | Compact Beacon record ID string used by sheet action calls. Treat as identity; do not invent or casually edit it. | On an Armor Class record, this field stores the compact ID used by Beacon sheet action calls. | `FIND` + `IDENTITY` |

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

| Field | ScriptCards location | Value kind | Values / format | Description | Use |
|---|---|---|---|---|---|
| `actionType` | `attacks->[selector]->actionType` | `STORED` | Observed action categories: `Action`, `Bonus Action`, `Free Action`, `Reaction`, `Legendary`, `Mythic`. Copy the stored capitalization when writing. | On an Attack record, this field identifies whether the record is an Action, Bonus Action, Reaction, Free Action, or another action category. | `FIND` + `RECORD` |
| `attack.type` | `attacks->[selector]->attack->type` | `STORED` | Observed Attack modes include `Melee`, `Ranged`, `Spell Attack`, `Spell Save`, and `Attack Save`; additional display/action variants may exist. | On an Attack record, this field identifies the canonical record type. | `FIND` + `IDENTITY` |
| `attack.abilityBonus` | `attacks->[selector]->attack->abilityBonus` | `STORED` | Ability/reference string used by the attack's bonus calculation. Preserve the existing sheet value unless deliberately changing the attack formula. | On an Attack record, this field stores the ability contribution used by the attack. | `FIND` + `RECORD` |
| `attack.proficiencyLevel` | `attacks->[selector]->attack->proficiencyLevel` | `INPUT` | Attack proficiency-tier string. Observed examples include `Proficient` and `Expertise`; preserve the sheet's existing tier values. | On an Attack record, this field stores the proficiency tier, such as Proficient or Expertise. | `FIND` + `INPUT` + `RECORD` |
| `attack.bonus` | `attacks->[selector]->attack->bonus` | `INPUT` | Number — stored attack bonus component. | On an Attack record, this field stores a finite bonus or bonus expression. | `FIND` + `INPUT` + `RECORD` |
| `autoHit` | `attacks->[selector]->autoHit` | `STORED` | Boolean — `true` = the attack/effect automatically hits; `false` = normal hit resolution applies. | On an Attack record, this field stores whether the attack skips an attack roll and automatically applies its effect or damage. | `FIND` + `RECORD` — Changes whether the attack rolls to hit; it does not change the attack bonus. |
| `repeat` | `attacks->[selector]->repeat` | `STORED` | Integer repeat/instance count for the attack or effect. | On an Attack record, this field stores attack repetition or multiattack information. | `FIND` + `RECORD` |
| `range` | `attacks->[selector]->range` | `STORED` | Attack/spell range text in the sheet's stored format. | On an Attack record, this field stores the attack or spell range. | `FIND` + `RECORD` |
| `_reach` | `attacks->[selector]->_reach` | `STORED` | Boolean — `true` = the attack uses reach metadata; `false` = no reach flag. | On an Attack record, this field stores `_reach`. | `FIND` + `RECORD` |
| `_reachText` | `attacks->[selector]->_reachText` | `STORED` | Reach/range text shown for attacks using reach metadata. | On an Attack record, this field stores `_reachText`. | `FIND` + `RECORD` |
| `save.saveAbility` | `attacks->[selector]->save->saveAbility` | `STORED` | Saving-throw ability name — common values are `Strength`, `Dexterity`, `Constitution`, `Intelligence`, `Wisdom`, or `Charisma`. | On an Attack record, this field stores `saveAbility`. | `FIND` + `RECORD` |
| `save.saveFlat` | `attacks->[selector]->save->saveFlat` | `STORED` | Number — finite stored save DC where this attack uses a flat save value. | On an Attack record, this field stores `saveFlat`. | `FIND` + `RECORD` |
| `save.saveFormula.flatValue` | `attacks->[selector]->save->saveFormula->flatValue` | `INPUT` | Number — finite save DC/formula component for the owning Attack record. | On an Attack record, this field stores a finite value used as an input by a formula. | `FIND` + `INPUT` + `RECORD` |
| `save.onFail` | `attacks->[selector]->save->onFail` | `STORED` | Free text describing the effect on a failed save; blank is valid. | On an Attack record, this field stores the effect or text used when a save fails. | `FIND` + `RECORD` |
| `save.onSucceed` | `attacks->[selector]->save->onSucceed` | `STORED` | Free text describing the effect on a successful save; blank is valid. | On an Attack record, this field stores the effect or text used when a save succeeds. | `FIND` + `RECORD` |
| `onHitDisplay` | `attacks->[selector]->onHitDisplay` | `STORED` | Text/string controlling or describing on-hit display behavior; exact allowed literals were not exhaustively probed. | On an Attack record, this field stores `onHitDisplay`. | `FIND` + `RECORD` |
| `description` | `attacks->[selector]->description` | `STORED` | Free text/HTML-like sheet description; blank is valid. | On an Attack record, this field stores the human-readable description. | `FIND` + `RECORD` |
| `name` | `attacks->[selector]->name` | `STORED` | Display-name string. Use it as a selector only when it uniquely identifies one active record. | On an Attack record, this field stores the record's primary display name. | `FIND` + `IDENTITY` |
| `shortID` | `attacks->[selector]->shortID` | `STORED` | Compact Beacon record ID string used by sheet action calls. Treat as identity; do not invent or casually edit it. | On an Attack record, this field stores the compact ID used by Beacon sheet action calls. | `FIND` + `IDENTITY` — Use this for the Beacon attack action call; typed writes use the selected collection path. |
| `_enabled` | `attacks->[selector]->_enabled` | `STORED` | Boolean — `true` = this canonical record participates in the live character model; `false` = the record is disabled/excluded. This is not the same as a Condition record's `_active` state. | On an Attack record, this field stores whether the canonical record participates in the live character model. | `FIND` + `TOGGLE` + `RECORD` |
| `parentID` | `attacks->[selector]->parentID` | `STORED` | Canonical parent relationship ID string. Blank means no parent where allowed; otherwise it must identify a valid parent record. | On an Attack record, this field stores the relationship ID of the record's immediate parent. | `FIND` + `GRAPH` |
| `childIDs` | `attacks->[selector]->childIDs` | `STORED` | Array of canonical child relationship IDs. `[]` = no child records. Preserve valid graph identities and ordering. | On an Attack record, this field stores the relationship IDs of this record's immediate child records. | `FIND` + `GRAPH` — Follow these linked record IDs to linked Damage or other child records; do not replace the whole array. |

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

| Field | ScriptCards location | Value kind | Values / format | Description | Use |
|---|---|---|---|---|---|
| `_attuned` | `attunements->[selector]->_attuned` | `STORED` | Boolean — `true` = attuned; `false` = not attuned. | On an Attunement record, this field stores whether the item is currently attuned. | `FIND` + `TOGGLE` + `RECORD` — This is the actual attunement state; `_enabled` only controls whether the record participates. |
| `requireEquip` | `attunements->[selector]->requireEquip` | `STORED` | Boolean — `true` = the parent item must be equipped for this effect/record to apply; `false` = equipment is not required. | On an Attunement record, this field stores `requireEquip`. | `FIND` + `RECORD` |
| `parentID` | `attunements->[selector]->parentID` | `STORED` | Canonical parent relationship ID string. Blank means no parent where allowed; otherwise it must identify a valid parent record. | On an Attunement record, this field stores the relationship ID of the record's immediate parent. | `FIND` + `GRAPH` |
| `childIDs` | `attunements->[selector]->childIDs` | `STORED` | Array of canonical child relationship IDs. `[]` = no child records. Preserve valid graph identities and ordering. | On an Attunement record, this field stores the relationship IDs of this record's immediate child records. | `FIND` + `GRAPH` |
| `_enabled` | `attunements->[selector]->_enabled` | `STORED` | Boolean — `true` = this canonical record participates in the live character model; `false` = the record is disabled/excluded. This is not the same as a Condition record's `_active` state. | On an Attunement record, this field stores whether the canonical record participates in the live character model. | `FIND` + `TOGGLE` + `RECORD` |
| `name` | `attunements->[selector]->name` | `STORED` | Display-name string. Use it as a selector only when it uniquely identifies one active record. | On an Attunement record, this field stores the record's primary display name. | `FIND` + `IDENTITY` |
| `shortID` | `attunements->[selector]->shortID` | `STORED` | Compact Beacon record ID string used by sheet action calls. Treat as identity; do not invent or casually edit it. | On an Attunement record, this field stores the compact ID used by Beacon sheet action calls. | `FIND` + `IDENTITY` |

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

| Field | ScriptCards location | Value kind | Values / format | Description | Use |
|---|---|---|---|---|---|
| `description` | `backgrounds->[selector]->description` | `STORED` | Free text/HTML-like sheet description; blank is valid. | On a Background record, this field stores the human-readable description. | `FIND` + `RECORD` |
| `childIDs` | `backgrounds->[selector]->childIDs` | `STORED` | Array of canonical child relationship IDs. `[]` = no child records. Preserve valid graph identities and ordering. | On a Background record, this field stores the relationship IDs of this record's immediate child records. | `FIND` + `GRAPH` |
| `name` | `backgrounds->[selector]->name` | `STORED` | Display-name string. Use it as a selector only when it uniquely identifies one active record. | On a Background record, this field stores the record's primary display name. | `FIND` + `IDENTITY` |
| `shortID` | `backgrounds->[selector]->shortID` | `STORED` | Compact Beacon record ID string used by sheet action calls. Treat as identity; do not invent or casually edit it. | On a Background record, this field stores the compact ID used by Beacon sheet action calls. | `FIND` + `IDENTITY` |
| `_enabled` | `backgrounds->[selector]->_enabled` | `STORED` | Boolean — `true` = this canonical record participates in the live character model; `false` = the record is disabled/excluded. This is not the same as a Condition record's `_active` state. | On a Background record, this field stores whether the canonical record participates in the live character model. | `FIND` + `TOGGLE` + `RECORD` |

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

| Field | ScriptCards location | Value kind | Values / format | Description | Use |
|---|---|---|---|---|---|
| `childIDs` | `classes->[selector]->childIDs` | `STORED` | Array of canonical child relationship IDs. `[]` = no child records. Preserve valid graph identities and ordering. | On a Class record, this field stores the relationship IDs of this record's immediate child records. | `FIND` + `GRAPH` |
| `name` | `classes->[selector]->name` | `STORED` | Display-name string. Use it as a selector only when it uniquely identifies one active record. | On a Class record, this field stores the record's primary display name. | `FIND` + `IDENTITY` |
| `shortID` | `classes->[selector]->shortID` | `STORED` | Compact Beacon record ID string used by sheet action calls. Treat as identity; do not invent or casually edit it. | On a Class record, this field stores the compact ID used by Beacon sheet action calls. | `FIND` + `IDENTITY` |
| `_enabled` | `classes->[selector]->_enabled` | `STORED` | Boolean — `true` = this canonical record participates in the live character model; `false` = the record is disabled/excluded. This is not the same as a Condition record's `_active` state. | On a Class record, this field stores whether the canonical record participates in the live character model. | `FIND` + `TOGGLE` + `RECORD` |
| `sourceID` | `classes->[selector]->sourceID` | `STORED` | Source/owner identity string. Its target semantics vary by record family; resolve it against the canonical graph rather than guessing. | On a Class record, this field stores the originating source record identifier. | `FIND` + `IDENTITY` |

#### Class Level records

**Purpose:** Class Level records store class-specific level information and the `totalLevel` input used by proficiency bonus.

**Calculation:** The level fields are stored inputs. `pb` and many other values are calculated from them.

**General use:** Use `level` and `pb` for final values. Use these records when you need class-specific level data or the stored `totalLevel` input.

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

| Field | ScriptCards location | Value kind | Values / format | Description | Use |
|---|---|---|---|---|---|
| `classID` | `classlevels->[selector]->classID` | `STORED` | Owning Class record identity string. | On a Class Level record, this field identifies the owning Class record. | `FIND` + `RECORD` |
| `level` | `classlevels->[selector]->level` | `INPUT` | Integer level value. Interpret it in the context of the owning record (class level, feature level, etc.). | On a Class Level record, this field stores the level contributed by that class progression record. | `FIND` + `INPUT` + `RECORD` |
| `totalLevel` | `classlevels->[selector]->totalLevel` | `INPUT` | Integer total character level used by level-based calculations. | On a Class Level record, this field stores the character's total level used by calculations such as proficiency bonus. | `FIND` + `INPUT` + `RECORD` |
| `subClassID` | `classlevels->[selector]->subClassID` | `STORED` | Owning/linked Subclass record identity string; may be blank when no subclass is linked. | On a Class Level record, this field stores `subClassID`. | `FIND` + `RECORD` |
| `name` | `classlevels->[selector]->name` | `STORED` | Display-name string. Use it as a selector only when it uniquely identifies one active record. | On a Class Level record, this field stores the record's primary display name. | `FIND` + `IDENTITY` |
| `shortID` | `classlevels->[selector]->shortID` | `STORED` | Compact Beacon record ID string used by sheet action calls. Treat as identity; do not invent or casually edit it. | On a Class Level record, this field stores the compact ID used by Beacon sheet action calls. | `FIND` + `IDENTITY` |
| `_enabled` | `classlevels->[selector]->_enabled` | `STORED` | Boolean — `true` = this canonical record participates in the live character model; `false` = the record is disabled/excluded. This is not the same as a Condition record's `_active` state. | On a Class Level record, this field stores whether the canonical record participates in the live character model. | `FIND` + `TOGGLE` + `RECORD` |
| `parentID` | `classlevels->[selector]->parentID` | `STORED` | Canonical parent relationship ID string. Blank means no parent where allowed; otherwise it must identify a valid parent record. | On a Class Level record, this field stores the relationship ID of the record's immediate parent. | `FIND` + `GRAPH` |

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

| Field | ScriptCards location | Value kind | Values / format | Description | Use |
|---|---|---|---|---|---|
| `_active` | `conditions->[selector]->_active` | `STORED` | Boolean — `true` = condition/effect active; `false` = inactive. **For Condition records this is the actual condition toggle.** ScriptCards writes also accept `1`/`0`, `yes`/`no`, and `on`/`off`. | On a Condition record, this field stores whether this record or effect is currently active. | `FIND` + `TOGGLE` + `RECORD` — This is the actual condition state; `_enabled` only controls whether the record participates. |
| `description` | `conditions->[selector]->description` | `STORED` | Free text/HTML-like sheet description; blank is valid. | On a Condition record, this field stores the human-readable description. | `FIND` + `RECORD` |
| `childIDs` | `conditions->[selector]->childIDs` | `STORED` | Array of canonical child relationship IDs. `[]` = no child records. Preserve valid graph identities and ordering. | On a Condition record, this field stores the relationship IDs of this record's immediate child records. | `FIND` + `GRAPH` |
| `name` | `conditions->[selector]->name` | `STORED` | Display-name string. Use it as a selector only when it uniquely identifies one active record. | On a Condition record, this field stores the record's primary display name. | `FIND` + `IDENTITY` |
| `shortID` | `conditions->[selector]->shortID` | `STORED` | Compact Beacon record ID string used by sheet action calls. Treat as identity; do not invent or casually edit it. | On a Condition record, this field stores the compact ID used by Beacon sheet action calls. | `FIND` + `IDENTITY` |
| `_enabled` | `conditions->[selector]->_enabled` | `STORED` | Boolean — `true` = this canonical record participates in the live character model; `false` = the record is disabled/excluded. This is not the same as a Condition record's `_active` state. | On a Condition record, this field stores whether the canonical record participates in the live character model. | `FIND` + `TOGGLE` + `RECORD` |

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

| Field | ScriptCards location | Value kind | Values / format | Description | Use |
|---|---|---|---|---|---|
| `value` | `currencies->[selector]->value` | `STORED` | Number — finite stored value; its meaning depends on the record family (currency amount, resource value, upcast increment, etc.). | On a Currency record, this field stores the record's finite current value. | `FIND` + `RECORD` — Prefer `cp`, `sp`, `ep`, `gp`, or `pp` for ordinary amount changes; use the record for conversion details. |
| `conversion.target` | `currencies->[selector]->conversion->target` | `STORED` | Target currency/resource identity string for this conversion rule. | On a Currency record, this field stores `target`. | `FIND` + `RECORD` |
| `conversion.amountOfTarget` | `currencies->[selector]->conversion->amountOfTarget` | `STORED` | Number — conversion amount applied to the target currency/resource specified by `conversion.target`. | On a Currency record, this field stores `amountOfTarget`. | `FIND` + `RECORD` |
| `name` | `currencies->[selector]->name` | `STORED` | Display-name string. Use it as a selector only when it uniquely identifies one active record. | On a Currency record, this field stores the record's primary display name. | `FIND` + `IDENTITY` |
| `shortID` | `currencies->[selector]->shortID` | `STORED` | Compact Beacon record ID string used by sheet action calls. Treat as identity; do not invent or casually edit it. | On a Currency record, this field stores the compact ID used by Beacon sheet action calls. | `FIND` + `IDENTITY` |
| `_enabled` | `currencies->[selector]->_enabled` | `STORED` | Boolean — `true` = this canonical record participates in the live character model; `false` = the record is disabled/excluded. This is not the same as a Condition record's `_active` state. | On a Currency record, this field stores whether the canonical record participates in the live character model. | `FIND` + `TOGGLE` + `RECORD` |

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

| Field | ScriptCards location | Value kind | Values / format | Description | Use |
|---|---|---|---|---|---|
| `_diceCount` | `damages->[selector]->_diceCount` | `INPUT` | Integer number of dice used by the record's internal/scaling damage representation. | On a Damage record, this field stores `_diceCount`. | `FIND` + `INPUT` + `RECORD` |
| `diceSize` | `damages->[selector]->diceSize` | `INPUT` | Die-size string/value, such as a die expression component; preserve the record's existing format. | On a Damage record, this field stores the die size. | `FIND` + `INPUT` + `RECORD` |
| `_bonus` | `damages->[selector]->_bonus` | `INPUT` | Number — stored numeric bonus. | On a Damage record, this field stores `_bonus`. | `FIND` + `INPUT` + `RECORD` |
| `ability` | `damages->[selector]->ability` | `INPUT` | Ability name — verified D&D ability values are `Strength`, `Dexterity`, `Constitution`, `Intelligence`, `Wisdom`, or `Charisma`. | On a Damage record, this field identifies the ability used by this record or formula. | `FIND` + `INPUT` + `RECORD` |
| `damageType` | `damages->[selector]->damageType` | `STORED` | Damage-type string, e.g. a D&D damage type. The complete allowed set was not enumerated by the controlled probes. | On a Damage record, this field stores the damage type. | `FIND` + `RECORD` |
| `overrideCrit` | `damages->[selector]->overrideCrit` | `STORED` | Boolean — `true` = use the record's critical-hit override; `false` = use normal critical behavior. | On a Damage record, this field stores `overrideCrit`. | `FIND` + `RECORD` |
| `critDiceSize` | `damages->[selector]->critDiceSize` | `STORED` | Critical-damage die-size string/value; preserve the existing die format. | On a Damage record, this field stores `critDiceSize`. | `FIND` + `RECORD` |
| `parentID` | `damages->[selector]->parentID` | `STORED` | Canonical parent relationship ID string. Blank means no parent where allowed; otherwise it must identify a valid parent record. | On a Damage record, this field stores the relationship ID of the record's immediate parent. | `FIND` + `GRAPH` — Use this linked record ID to identify the owning Attack, Spell, or other parent record. |
| `name` | `damages->[selector]->name` | `STORED` | Display-name string. Use it as a selector only when it uniquely identifies one active record. | On a Damage record, this field stores the record's primary display name. | `FIND` + `IDENTITY` |
| `shortID` | `damages->[selector]->shortID` | `STORED` | Compact Beacon record ID string used by sheet action calls. Treat as identity; do not invent or casually edit it. | On a Damage record, this field stores the compact ID used by Beacon sheet action calls. | `FIND` + `IDENTITY` |
| `_enabled` | `damages->[selector]->_enabled` | `STORED` | Boolean — `true` = this canonical record participates in the live character model; `false` = the record is disabled/excluded. This is not the same as a Condition record's `_active` state. | On a Damage record, this field stores whether the canonical record participates in the live character model. | `FIND` + `TOGGLE` + `RECORD` |

#### Defense records

**Purpose:** Defense records store damage immunities, resistances, vulnerabilities, and condition defenses.

**Calculation:** No. These are stored defense definitions.

**General use:** Use the typed collection to build defense lists. Edit only the existing defense record that represents the intended immunity, resistance, vulnerability, or condition defense.

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

| Field | ScriptCards location | Value kind | Values / format | Description | Use |
|---|---|---|---|---|---|
| `defense` | `defenses->[selector]->defense` | `STORED` | Defense category string. Observed values include `Resistance` and `Immunity`; the complete allowed set was not exhaustively probed. | On a Defense record, this field stores `defense`. | `FIND` + `RECORD` |
| `damage` | `defenses->[selector]->damage` | `STORED` | Damage-type or damage descriptor string on a Defense record; preserve the sheet's exact value. | On a Defense record, this field stores the defense record's damage category or damage-type data. | `FIND` + `RECORD` |
| `condition` | `defenses->[selector]->condition` | `STORED` | Condition name/identity string used by a Defense or related record; use an existing condition identity. | On a Defense record, this field stores `condition`. | `FIND` + `RECORD` |
| `name` | `defenses->[selector]->name` | `STORED` | Display-name string. Use it as a selector only when it uniquely identifies one active record. | On a Defense record, this field stores the record's primary display name. | `FIND` + `IDENTITY` |
| `shortID` | `defenses->[selector]->shortID` | `STORED` | Compact Beacon record ID string used by sheet action calls. Treat as identity; do not invent or casually edit it. | On a Defense record, this field stores the compact ID used by Beacon sheet action calls. | `FIND` + `IDENTITY` |
| `_enabled` | `defenses->[selector]->_enabled` | `STORED` | Boolean — `true` = this canonical record participates in the live character model; `false` = the record is disabled/excluded. This is not the same as a Condition record's `_active` state. | On a Defense record, this field stores whether the canonical record participates in the live character model. | `FIND` + `TOGGLE` + `RECORD` |
| `parentID` | `defenses->[selector]->parentID` | `STORED` | Canonical parent relationship ID string. Blank means no parent where allowed; otherwise it must identify a valid parent record. | On a Defense record, this field stores the relationship ID of the record's immediate parent. | `FIND` + `GRAPH` |

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

| Field | ScriptCards location | Value kind | Values / format | Description | Use |
|---|---|---|---|---|---|
| `value` | `exhaustions->[selector]->value` | `STORED` | Number — finite stored value; its meaning depends on the record family (currency amount, resource value, upcast increment, etc.). | On an Exhaustion record, this field stores the record's finite current value. | `FIND` + `RECORD` |
| `name` | `exhaustions->[selector]->name` | `STORED` | Display-name string. Use it as a selector only when it uniquely identifies one active record. | On an Exhaustion record, this field stores the record's primary display name. | `FIND` + `IDENTITY` |
| `shortID` | `exhaustions->[selector]->shortID` | `STORED` | Compact Beacon record ID string used by sheet action calls. Treat as identity; do not invent or casually edit it. | On an Exhaustion record, this field stores the compact ID used by Beacon sheet action calls. | `FIND` + `IDENTITY` |
| `_enabled` | `exhaustions->[selector]->_enabled` | `STORED` | Boolean — `true` = this canonical record participates in the live character model; `false` = the record is disabled/excluded. This is not the same as a Condition record's `_active` state. | On an Exhaustion record, this field stores whether the canonical record participates in the live character model. | `FIND` + `TOGGLE` + `RECORD` |

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

| Field | ScriptCards location | Value kind | Values / format | Description | Use |
|---|---|---|---|---|---|
| `description` | `features->[selector]->description` | `STORED` | Free text/HTML-like sheet description; blank is valid. | On a Features record, this field stores the human-readable description. | `FIND` + `RECORD` |
| `childIDs` | `features->[selector]->childIDs` | `STORED` | Array of canonical child relationship IDs. `[]` = no child records. Preserve valid graph identities and ordering. | On a Features record, this field stores the relationship IDs of this record's immediate child records. | `FIND` + `GRAPH` |
| `relations` | `features->[selector]->relations` | `STORED` | Object/map of canonical relationship metadata. Traverse a specific relation leaf; do not replace the whole object. | On a Features record, this field stores relationships that connect this record to other records. | `FIND` + `GRAPH` |
| `name` | `features->[selector]->name` | `STORED` | Display-name string. Use it as a selector only when it uniquely identifies one active record. | On a Features record, this field stores the record's primary display name. | `FIND` + `IDENTITY` |
| `shortID` | `features->[selector]->shortID` | `STORED` | Compact Beacon record ID string used by sheet action calls. Treat as identity; do not invent or casually edit it. | On a Features record, this field stores the compact ID used by Beacon sheet action calls. | `FIND` + `IDENTITY` |
| `_enabled` | `features->[selector]->_enabled` | `STORED` | Boolean — `true` = this canonical record participates in the live character model; `false` = the record is disabled/excluded. This is not the same as a Condition record's `_active` state. | On a Features record, this field stores whether the canonical record participates in the live character model. | `FIND` + `TOGGLE` + `RECORD` |
| `arrayPosition` | `features->[selector]->arrayPosition` | `ORDER` | Number used for relative record ordering. Treat it as ordering metadata rather than a game statistic. | On a Features record, this field stores the record's relative display position among records of the same family. | `FIND` + `ORDER` |
| `parentID` | `features->[selector]->parentID` | `STORED` | Canonical parent relationship ID string. Blank means no parent where allowed; otherwise it must identify a valid parent record. | On a Features record, this field stores the relationship ID of the record's immediate parent. | `FIND` + `GRAPH` |

#### Hit Dice records

**Purpose:** Hit Dice records store the class-specific details behind the finite `hit_dice` value.

**Calculation:** The direct alias `hit_dice` is finite and writable. The record fields preserve class-specific die details and recovery state.

**General use:** Prefer the verified direct alias `hit_dice` for ordinary changes. Use records when class-specific Hit Dice details matter.

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

| Field | ScriptCards location | Value kind | Values / format | Description | Use |
|---|---|---|---|---|---|
| `classID` | `hitdices->[selector]->classID` | `STORED` | Owning Class record identity string. | On a Hit Dice record, this field identifies the owning Class record. | `FIND` + `RECORD` — Stores the owning Class record identity, not the Class `shortID` or display name. |
| `dieCount` | `hitdices->[selector]->dieCount` | `STORED` | Integer number of dice. | On a Hit Dice record, this field stores `dieCount`. | `FIND` + `RECORD` |
| `dieSize` | `hitdices->[selector]->dieSize` | `STORED` | Die-size value. Observed Hit Dice records use numeric die sizes; interpret as the die's number of sides. | On a Hit Dice record, this field stores `dieSize`. | `FIND` + `RECORD` |
| `ability` | `hitdices->[selector]->ability` | `INPUT` | Ability name — verified D&D ability values are `Strength`, `Dexterity`, `Constitution`, `Intelligence`, `Wisdom`, or `Charisma`. | On a Hit Dice record, this field identifies the ability used by this record or formula. | `FIND` + `INPUT` + `RECORD` |
| `recovery` | `hitdices->[selector]->recovery` | `STORED` | Recovery-rule string. Preserve the existing sheet-defined literal unless the desired value has been verified. | On a Hit Dice record, this field stores how the value recovers. | `FIND` + `RECORD` |
| `name` | `hitdices->[selector]->name` | `STORED` | Display-name string. Use it as a selector only when it uniquely identifies one active record. | On a Hit Dice record, this field stores the record's primary display name. | `FIND` + `IDENTITY` |
| `shortID` | `hitdices->[selector]->shortID` | `STORED` | Compact Beacon record ID string used by sheet action calls. Treat as identity; do not invent or casually edit it. | On a Hit Dice record, this field stores the compact ID used by Beacon sheet action calls. | `FIND` + `IDENTITY` |
| `_enabled` | `hitdices->[selector]->_enabled` | `STORED` | Boolean — `true` = this canonical record participates in the live character model; `false` = the record is disabled/excluded. This is not the same as a Condition record's `_active` state. | On a Hit Dice record, this field stores whether the canonical record participates in the live character model. | `FIND` + `TOGGLE` + `RECORD` |
| `parentID` | `hitdices->[selector]->parentID` | `STORED` | Canonical parent relationship ID string. Blank means no parent where allowed; otherwise it must identify a valid parent record. | On a Hit Dice record, this field stores the relationship ID of the record's immediate parent. | `FIND` + `GRAPH` |

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

| Field | ScriptCards location | Value kind | Values / format | Description | Use |
|---|---|---|---|---|---|
| `hitpointType` | `hitpoints->[selector]->hitpointType` | `STORED` | Hit-point record category string. The complete allowed set was not exhaustively probed. | On a Hit Points record, this field stores `hitpointType`. | `FIND` + `RECORD` |
| `calculation` | `hitpoints->[selector]->calculation` | `INPUT` | Observed calculation modes include `Set Base`, `Modify`, `Set Value`, and `Minimum`. Not every record family supports every mode; keep the mode appropriate to that record family. | On a Hit Points record, this field identifies the calculation method used by this record. | `FIND` + `INPUT` + `RECORD` |
| `isFixed` | `hitpoints->[selector]->isFixed` | `STORED` | Boolean — `true` = fixed value; `false` = non-fixed/calculated behavior. | On a Hit Points record, this field stores whether the formula uses a fixed value. | `FIND` + `RECORD` |
| `isTemp` | `hitpoints->[selector]->isTemp` | `STORED` | Boolean — `true` = temporary record/value; `false` = normal/non-temporary. | On a Hit Points record, this field stores whether a Hit Points record represents temporary hit points. | `FIND` + `RECORD` — Classifies this formula record as temporary-HP capacity; it is not the character’s current `hp_temp` value. |
| `valueFormula.flatValue` | `hitpoints->[selector]->valueFormula->flatValue` | `INPUT` | Number — finite stored formula/input value. Its unit depends on the record (score, AC, speed in feet, slot count, etc.). | On a Hit Points record, this field stores a finite value used as an input by a formula. | `FIND` + `INPUT` + `RECORD` |
| `valueFormula.ability.name` | `hitpoints->[selector]->valueFormula->ability->name` | `STORED` | Ability name — `Strength`, `Dexterity`, `Constitution`, `Intelligence`, `Wisdom`, or `Charisma` where this object is used. | On a Hit Points record, this field stores the record's primary display name. | `FIND` + `IDENTITY` |
| `valueFormula.ability.add` | `hitpoints->[selector]->valueFormula->ability->add` | `STORED` | Boolean — stored as `true` / `false`. ScriptCards structured writes also accept `1`/`0`, `yes`/`no`, and `on`/`off`. | On a Hit Points record, this field stores `add`. | `FIND` + `RECORD` |
| `name` | `hitpoints->[selector]->name` | `STORED` | Display-name string. Use it as a selector only when it uniquely identifies one active record. | On a Hit Points record, this field stores the record's primary display name. | `FIND` + `IDENTITY` |
| `shortID` | `hitpoints->[selector]->shortID` | `STORED` | Compact Beacon record ID string used by sheet action calls. Treat as identity; do not invent or casually edit it. | On a Hit Points record, this field stores the compact ID used by Beacon sheet action calls. | `FIND` + `IDENTITY` |
| `_enabled` | `hitpoints->[selector]->_enabled` | `STORED` | Boolean — `true` = this canonical record participates in the live character model; `false` = the record is disabled/excluded. This is not the same as a Condition record's `_active` state. | On a Hit Points record, this field stores whether the canonical record participates in the live character model. | `FIND` + `TOGGLE` + `RECORD` |
| `parentID` | `hitpoints->[selector]->parentID` | `STORED` | Canonical parent relationship ID string. Blank means no parent where allowed; otherwise it must identify a valid parent record. | On a Hit Points record, this field stores the relationship ID of the record's immediate parent. | `FIND` + `GRAPH` |

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

| Field | ScriptCards location | Value kind | Values / format | Description | Use |
|---|---|---|---|---|---|
| `description` | `items->[selector]->description` | `STORED` | Free text/HTML-like sheet description; blank is valid. | On an Item record, this field stores the human-readable description. | `FIND` + `RECORD` |
| `quantity` | `items->[selector]->quantity` | `STORED` | Number — item quantity/count. | On an Item record, this field stores the item quantity. | `FIND` + `RECORD` |
| `weight` | `items->[selector]->weight` | `STORED` | Numeric/string weight value as stored by the Item record. Preserve the existing unit/format; the controlled schema observed more than one representation. | On an Item record, this field stores the item weight. | `FIND` + `RECORD` |
| `cost` | `items->[selector]->cost` | `STORED` | Text/string cost representation. Preserve the sheet's existing currency/format text. | On an Item record, this field stores `cost`. | `FIND` + `RECORD` |
| `rarity` | `items->[selector]->rarity` | `STORED` | Item rarity string; preserve the sheet's exact stored rarity value. | On an Item record, this field stores `rarity`. | `FIND` + `RECORD` |
| `properties` | `items->[selector]->properties` | `STORED` | Array of item/weapon/property strings or identities as stored by the record. `[]` = none. | On an Item record, this field stores `properties`. | `FIND` + `RECORD` |
| `equipData.equippable` | `items->[selector]->equipData->equippable` | `STORED` | Boolean — `true` = item can be equipped; `false` = not equippable. | On an Item record, this field stores whether the item can be equipped. | `FIND` + `RECORD` |
| `equipData.equipped` | `items->[selector]->equipData->equipped` | `STORED` | Boolean — `true` = item currently equipped; `false` = not equipped. | On an Item record, this field stores whether the item is currently equipped. | `FIND` + `TOGGLE` + `RECORD` — Changes equipped state and can affect derived AC or attacks; `equippable` only says whether equipping is allowed. |
| `weaponData.category` | `items->[selector]->weaponData->category` | `STORED` | Weapon category string stored on the Item's weapon data; use an observed existing category value. | On an Item record, this field stores the weapon category used by the item. | `FIND` + `RECORD` |
| `weaponData.training` | `items->[selector]->weaponData->training` | `STORED` | Weapon-training/proficiency string stored on the Item; preserve an observed existing sheet value. | On an Item record, this field stores `training`. | `FIND` + `RECORD` |
| `weaponData.type` | `items->[selector]->weaponData->type` | `STORED` | Weapon-type string stored on the Item; preserve an observed existing sheet value. | On an Item record, this field identifies the canonical record type. | `FIND` + `IDENTITY` |
| `armorData.category` | `items->[selector]->armorData->category` | `STORED` | Armor category string stored on the Item's armor data; use an observed existing category value. | On an Item record, this field stores the armour category used by the item. | `FIND` + `RECORD` |
| `armorData.ability` | `items->[selector]->armorData->ability` | `INPUT` | Ability string used by the armor calculation; use a verified D&D ability name when explicitly set. | On an Item record, this field identifies the ability used by this record or formula. | `FIND` + `INPUT` + `RECORD` |
| `armorData.bonusCap` | `items->[selector]->armorData->bonusCap` | `STORED` | Number — ability/armor bonus cap used by the armor data. | On an Item record, this field stores the maximum ability contribution allowed by the armor formula. | `FIND` + `RECORD` |
| `armorData.strengthMinimum` | `items->[selector]->armorData->strengthMinimum` | `STORED` | Number — minimum Strength requirement associated with the armor Item. | On an Item record, this field stores the armor's Strength requirement. | `FIND` + `RECORD` |
| `shieldData.category` | `items->[selector]->shieldData->category` | `STORED` | Shield category string stored on the Item's shield data; use an observed existing category value. | On an Item record, this field stores the shield category used by the item. | `FIND` + `RECORD` |
| `shieldData.wieldable` | `items->[selector]->shieldData->wieldable` | `STORED` | Boolean — `true` = shield can be wielded; `false` = not wieldable. | On an Item record, this field stores `wieldable`. | `FIND` + `RECORD` |
| `name` | `items->[selector]->name` | `STORED` | Display-name string. Use it as a selector only when it uniquely identifies one active record. | On an Item record, this field stores the record's primary display name. | `FIND` + `IDENTITY` |
| `shortID` | `items->[selector]->shortID` | `STORED` | Compact Beacon record ID string used by sheet action calls. Treat as identity; do not invent or casually edit it. | On an Item record, this field stores the compact ID used by Beacon sheet action calls. | `FIND` + `IDENTITY` |
| `_enabled` | `items->[selector]->_enabled` | `STORED` | Boolean — `true` = this canonical record participates in the live character model; `false` = the record is disabled/excluded. This is not the same as a Condition record's `_active` state. | On an Item record, this field stores whether the canonical record participates in the live character model. | `FIND` + `TOGGLE` + `RECORD` |
| `arrayPosition` | `items->[selector]->arrayPosition` | `ORDER` | Number used for relative record ordering. Treat it as ordering metadata rather than a game statistic. | On an Item record, this field stores the record's relative display position among records of the same family. | `FIND` + `ORDER` |
| `parentID` | `items->[selector]->parentID` | `STORED` | Canonical parent relationship ID string. Blank means no parent where allowed; otherwise it must identify a valid parent record. | On an Item record, this field stores the relationship ID of the record's immediate parent. | `FIND` + `GRAPH` |
| `childIDs` | `items->[selector]->childIDs` | `STORED` | Array of canonical child relationship IDs. `[]` = no child records. Preserve valid graph identities and ordering. | On an Item record, this field stores the relationship IDs of this record's immediate child records. | `FIND` + `GRAPH` — Follow these linked record IDs to linked Attack, Attunement, or other child records; do not replace the whole array. |

#### Language records

**Purpose:** Language records store each language known by the character.

**Calculation:** No. Each language is a stored record.

**General use:** Use `languages` to list languages. Use the typed record path only when enabling, disabling, or renaming a specific existing Language record.

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

| Field | ScriptCards location | Value kind | Values / format | Description | Use |
|---|---|---|---|---|---|
| `name` | `languages->[selector]->name` | `STORED` | Display-name string. Use it as a selector only when it uniquely identifies one active record. | On a Language record, this field stores the record's primary display name. | `FIND` + `IDENTITY` |
| `_enabled` | `languages->[selector]->_enabled` | `STORED` | Boolean — `true` = this canonical record participates in the live character model; `false` = the record is disabled/excluded. This is not the same as a Condition record's `_active` state. | On a Language record, this field stores whether the canonical record participates in the live character model. | `FIND` + `TOGGLE` + `RECORD` |
| `shortID` | `languages->[selector]->shortID` | `STORED` | Compact Beacon record ID string used by sheet action calls. Treat as identity; do not invent or casually edit it. | On a Language record, this field stores the compact ID used by Beacon sheet action calls. | `FIND` + `IDENTITY` |
| `arrayPosition` | `languages->[selector]->arrayPosition` | `ORDER` | Number used for relative record ordering. Treat it as ordering metadata rather than a game statistic. | On a Language record, this field stores the record's relative display position among records of the same family. | `FIND` + `ORDER` |
| `parentID` | `languages->[selector]->parentID` | `STORED` | Canonical parent relationship ID string. Blank means no parent where allowed; otherwise it must identify a valid parent record. | On a Language record, this field stores the relationship ID of the record's immediate parent. | `FIND` + `GRAPH` |

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

| Field | ScriptCards location | Value kind | Values / format | Description | Use |
|---|---|---|---|---|---|
| `concat` | `modifiers->[selector]->concat` | `STORED` | Object/container holding modifier concatenation metadata. Traverse its documented child leaves before writing. | On a `modifier` record, this field stores how modifier text or values are concatenated. | `FIND` + `RECORD` |
| `modifications` | `modifiers->[selector]->modifications` | `STORED` | Object/container describing modifier changes. Traverse a documented primitive child leaf before writing. | On a `modifier` record, this field stores the modifications applied by the record. | `FIND` + `RECORD` — Structured modifier data; inspect it and address an existing primitive child rather than replacing the container blindly. |
| `relations` | `modifiers->[selector]->relations` | `STORED` | Object/map of canonical relationship metadata. Traverse a specific relation leaf; do not replace the whole object. | On a `modifier` record, this field stores relationships that connect this record to other records. | `FIND` + `GRAPH` — Structured relationship data; preserve valid linked record IDs and edit only an understood primitive child. |
| `name` | `modifiers->[selector]->name` | `STORED` | Display-name string. Use it as a selector only when it uniquely identifies one active record. | On a `modifier` record, this field stores the record's primary display name. | `FIND` + `IDENTITY` |
| `shortID` | `modifiers->[selector]->shortID` | `STORED` | Compact Beacon record ID string used by sheet action calls. Treat as identity; do not invent or casually edit it. | On a `modifier` record, this field stores the compact ID used by Beacon sheet action calls. | `FIND` + `IDENTITY` |
| `_enabled` | `modifiers->[selector]->_enabled` | `STORED` | Boolean — `true` = this canonical record participates in the live character model; `false` = the record is disabled/excluded. This is not the same as a Condition record's `_active` state. | On a `modifier` record, this field stores whether the canonical record participates in the live character model. | `FIND` + `TOGGLE` + `RECORD` |
| `parentID` | `modifiers->[selector]->parentID` | `STORED` | Canonical parent relationship ID string. Blank means no parent where allowed; otherwise it must identify a valid parent record. | On a `modifier` record, this field stores the relationship ID of the record's immediate parent. | `FIND` + `GRAPH` |

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

| Field | ScriptCards location | Value kind | Values / format | Description | Use |
|---|---|---|---|---|---|
| `calculation` | `preparedspellslots->[selector]->calculation` | `INPUT` | Observed calculation modes include `Set Base`, `Modify`, `Set Value`, and `Minimum`. Not every record family supports every mode; keep the mode appropriate to that record family. | On a Prepared Spell Slot record, this field identifies the calculation method used by this record. | `FIND` + `INPUT` + `RECORD` |
| `valueFormula.flatValue` | `preparedspellslots->[selector]->valueFormula->flatValue` | `INPUT` | Number — finite stored formula/input value. Its unit depends on the record (score, AC, speed in feet, slot count, etc.). | On a Prepared Spell Slot record, this field stores a finite value used as an input by a formula. | `FIND` + `INPUT` + `RECORD` |
| `name` | `preparedspellslots->[selector]->name` | `STORED` | Display-name string. Use it as a selector only when it uniquely identifies one active record. | On a Prepared Spell Slot record, this field stores the record's primary display name. | `FIND` + `IDENTITY` |
| `shortID` | `preparedspellslots->[selector]->shortID` | `STORED` | Compact Beacon record ID string used by sheet action calls. Treat as identity; do not invent or casually edit it. | On a Prepared Spell Slot record, this field stores the compact ID used by Beacon sheet action calls. | `FIND` + `IDENTITY` |
| `_enabled` | `preparedspellslots->[selector]->_enabled` | `STORED` | Boolean — `true` = this canonical record participates in the live character model; `false` = the record is disabled/excluded. This is not the same as a Condition record's `_active` state. | On a Prepared Spell Slot record, this field stores whether the canonical record participates in the live character model. | `FIND` + `TOGGLE` + `RECORD` |
| `parentID` | `preparedspellslots->[selector]->parentID` | `STORED` | Canonical parent relationship ID string. Blank means no parent where allowed; otherwise it must identify a valid parent record. | On a Prepared Spell Slot record, this field stores the relationship ID of the record's immediate parent. | `FIND` + `GRAPH` |

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

| Field | ScriptCards location | Value kind | Values / format | Description | Use |
|---|---|---|---|---|---|
| `category` | `proficiencies->[selector]->category` | `STORED` | Category string. Allowed values depend on the record family; use an observed value from an existing record of that family. | On a Proficiency record, this field identifies the record's category, such as Skill or Saving Throw. | `FIND` + `RECORD` |
| `proficiency` | `proficiencies->[selector]->proficiency` | `STORED` | Proficiency/identity string; allowed values depend on the Proficiency/Skill record family. | On a Proficiency record, this field identifies the skill, save, tool, weapon, or armor proficiency. | `FIND` + `RECORD` |
| `proficiencyLevel` | `proficiencies->[selector]->proficiencyLevel` | `INPUT` | Proficiency-tier string. Observed examples include `Proficient` and `Expertise`; the complete tier set was not exhaustively probed. | On a Proficiency record, this field stores the proficiency tier, such as Proficient or Expertise. | `FIND` + `INPUT` + `RECORD` — Change this tier to alter Proficient or Expertise state, then read the recalculated public skill or save total. |
| `rollAbility` | `proficiencies->[selector]->rollAbility` | `STORED` | Ability name used for the roll — common verified D&D values are `Strength`, `Dexterity`, `Constitution`, `Intelligence`, `Wisdom`, or `Charisma`. | On a Proficiency record, this field stores the ability used when rolling the proficiency. | `FIND` + `RECORD` |
| `increaseIfAlreadyAt` | `proficiencies->[selector]->increaseIfAlreadyAt` | `STORED` | Boolean — `true` = the recovery/change rule may increase a value already at its threshold; `false` = it does not. | On a Proficiency record, this field stores `increaseIfAlreadyAt`. | `FIND` + `RECORD` |
| `name` | `proficiencies->[selector]->name` | `STORED` | Display-name string. Use it as a selector only when it uniquely identifies one active record. | On a Proficiency record, this field stores the record's primary display name. | `FIND` + `IDENTITY` |
| `shortID` | `proficiencies->[selector]->shortID` | `STORED` | Compact Beacon record ID string used by sheet action calls. Treat as identity; do not invent or casually edit it. | On a Proficiency record, this field stores the compact ID used by Beacon sheet action calls. | `FIND` + `IDENTITY` |
| `_enabled` | `proficiencies->[selector]->_enabled` | `STORED` | Boolean — `true` = this canonical record participates in the live character model; `false` = the record is disabled/excluded. This is not the same as a Condition record's `_active` state. | On a Proficiency record, this field stores whether the canonical record participates in the live character model. | `FIND` + `TOGGLE` + `RECORD` |
| `parentID` | `proficiencies->[selector]->parentID` | `STORED` | Canonical parent relationship ID string. Blank means no parent where allowed; otherwise it must identify a valid parent record. | On a Proficiency record, this field stores the relationship ID of the record's immediate parent. | `FIND` + `GRAPH` |

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

| Field | ScriptCards location | Value kind | Values / format | Description | Use |
|---|---|---|---|---|---|
| `value` | `resources->[selector]->value` | `STORED` | Number — finite stored value; its meaning depends on the record family (currency amount, resource value, upcast increment, etc.). | On a Resource record, this field stores the record's finite current value. | `FIND` + `RECORD` — This is the current amount; use `maxValueFormula` only when changing capacity. |
| `maxValueFormula` | `resources->[selector]->maxValueFormula` | `INPUT` | Object/container for the record's maximum-value formula. Traverse a primitive child before writing. | On a Resource record, this field stores the formula used to calculate a Resource maximum. | `FIND` + `INPUT` + `RECORD` — Structured maximum formula; edit an existing primitive component rather than replacing the whole object blindly. |
| `recoveryRate` | `resources->[selector]->recoveryRate` | `STORED` | Object/container for recovery rules. Traverse a specific rest/recovery primitive leaf before writing. | On a Resource record, this field stores how much of the Resource recovers. | `FIND` + `RECORD` |
| `relations` | `resources->[selector]->relations` | `STORED` | Object/map of canonical relationship metadata. Traverse a specific relation leaf; do not replace the whole object. | On a Resource record, this field stores relationships that connect this record to other records. | `FIND` + `GRAPH` |
| `name` | `resources->[selector]->name` | `STORED` | Display-name string. Use it as a selector only when it uniquely identifies one active record. | On a Resource record, this field stores the record's primary display name. | `FIND` + `IDENTITY` |
| `shortID` | `resources->[selector]->shortID` | `STORED` | Compact Beacon record ID string used by sheet action calls. Treat as identity; do not invent or casually edit it. | On a Resource record, this field stores the compact ID used by Beacon sheet action calls. | `FIND` + `IDENTITY` |
| `_enabled` | `resources->[selector]->_enabled` | `STORED` | Boolean — `true` = this canonical record participates in the live character model; `false` = the record is disabled/excluded. This is not the same as a Condition record's `_active` state. | On a Resource record, this field stores whether the canonical record participates in the live character model. | `FIND` + `TOGGLE` + `RECORD` |
| `parentID` | `resources->[selector]->parentID` | `STORED` | Canonical parent relationship ID string. Blank means no parent where allowed; otherwise it must identify a valid parent record. | On a Resource record, this field stores the relationship ID of the record's immediate parent. | `FIND` + `GRAPH` |

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

| Field | ScriptCards location | Value kind | Values / format | Description | Use |
|---|---|---|---|---|---|
| `description` | `restdisplays->[selector]->description` | `STORED` | Free text/HTML-like sheet description; blank is valid. | On a Rest Display record, this field stores the human-readable description. | `FIND` + `RECORD` |
| `restType` | `restdisplays->[selector]->restType` | `STORED` | Array of rest-type strings associated with this Rest Display record. The complete allowed set was not exhaustively probed. | On a Rest Display record, this field stores `restType`. | `FIND` + `RECORD` |
| `name` | `restdisplays->[selector]->name` | `STORED` | Display-name string. Use it as a selector only when it uniquely identifies one active record. | On a Rest Display record, this field stores the record's primary display name. | `FIND` + `IDENTITY` |
| `shortID` | `restdisplays->[selector]->shortID` | `STORED` | Compact Beacon record ID string used by sheet action calls. Treat as identity; do not invent or casually edit it. | On a Rest Display record, this field stores the compact ID used by Beacon sheet action calls. | `FIND` + `IDENTITY` |
| `_enabled` | `restdisplays->[selector]->_enabled` | `STORED` | Boolean — `true` = this canonical record participates in the live character model; `false` = the record is disabled/excluded. This is not the same as a Condition record's `_active` state. | On a Rest Display record, this field stores whether the canonical record participates in the live character model. | `FIND` + `TOGGLE` + `RECORD` |

#### Roll Bonus records

**Purpose:** Roll Bonus records store global or conditional bonuses applied to attacks, damage, saves, skills, or other rolls.

**Calculation:** The bonus definition is stored. The final roll total is calculated.

**General use:** Use these records to identify active global modifiers. Change the bonus fields only when intentionally editing that modifier. For the direct `spell_attack_bonus` and `spell_save_dc` aliases, ScriptCards can locally accumulate applicable flat numeric `Modifier` records with `totalRoll` disabled; `Keep Highest` and `Keep Lowest` affect roll mode rather than the numeric header. An inactive parent Condition is ignored. Any other applicable spell-targeted shape preserves the native sheet lookup.

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

| Field | ScriptCards location | Value kind | Values / format | Description | Use |
|---|---|---|---|---|---|
| `bonusCategory` | `rollbonuses->[selector]->bonusCategory` | `STORED` | Array of Roll Bonus category strings describing what rolls the bonus applies to. | On a Roll Bonus record, this field stores `bonusCategory`. | `FIND` + `RECORD` |
| `bonusDetails` | `rollbonuses->[selector]->bonusDetails` | `STORED` | Text/string describing the Roll Bonus mode/details. Observed behavior includes advantage/disadvantage-style effects such as Keep Highest/Keep Lowest. | On a Roll Bonus record, this field stores `bonusDetails`. | `FIND` + `RECORD` |
| `bonusName` | `rollbonuses->[selector]->bonusName` | `STORED` | Array of Roll Bonus target/name strings. Interpret together with `bonusCategory` and `bonusDetails`. | On a Roll Bonus record, this field stores `bonusName`. | `FIND` + `RECORD` |
| `bonusValue` | `rollbonuses->[selector]->bonusValue` | `STORED` | Number — stored Roll Bonus modifier value. | On a Roll Bonus record, this field stores `bonusValue`. | `FIND` + `RECORD` |
| `diceCount` | `rollbonuses->[selector]->diceCount` | `INPUT` | Integer number of dice. | On a Roll Bonus record, this field stores the number of dice. | `FIND` + `INPUT` + `RECORD` |
| `totalRoll` | `rollbonuses->[selector]->totalRoll` | `STORED` | Boolean — controls whether the Roll Bonus is applied to the total roll. Observed local reconstruction accepts flat numeric modifiers only when this is `false`; preserve the record's existing meaning when editing. | On a Roll Bonus record, this field stores the record's `totalRoll` flag. | `FIND` + `RECORD` |
| `name` | `rollbonuses->[selector]->name` | `STORED` | Display-name string. Use it as a selector only when it uniquely identifies one active record. | On a Roll Bonus record, this field stores the record's primary display name. | `FIND` + `IDENTITY` |
| `shortID` | `rollbonuses->[selector]->shortID` | `STORED` | Compact Beacon record ID string used by sheet action calls. Treat as identity; do not invent or casually edit it. | On a Roll Bonus record, this field stores the compact ID used by Beacon sheet action calls. | `FIND` + `IDENTITY` |
| `_enabled` | `rollbonuses->[selector]->_enabled` | `STORED` | Boolean — `true` = this canonical record participates in the live character model; `false` = the record is disabled/excluded. This is not the same as a Condition record's `_active` state. | On a Roll Bonus record, this field stores whether the canonical record participates in the live character model. | `FIND` + `TOGGLE` + `RECORD` |
| `parentID` | `rollbonuses->[selector]->parentID` | `STORED` | Canonical parent relationship ID string. Blank means no parent where allowed; otherwise it must identify a valid parent record. | On a Roll Bonus record, this field stores the relationship ID of the record's immediate parent. | `FIND` + `GRAPH` |

#### Sense records

**Purpose:** Sense records store each sense and its range formula.

**Calculation:** The sense definition and range input are stored; displayed text is derived.

**General use:** Use `senses` to build a senses list. Change the intended Sense record's finite range or enabled state rather than a legacy `npc_senses` string.

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

| Field | ScriptCards location | Value kind | Values / format | Description | Use |
|---|---|---|---|---|---|
| `calculation` | `senses->[selector]->calculation` | `INPUT` | Observed calculation modes include `Set Base`, `Modify`, `Set Value`, and `Minimum`. Not every record family supports every mode; keep the mode appropriate to that record family. | On a Sense record, this field identifies the calculation method used by this record. | `FIND` + `INPUT` + `RECORD` |
| `ignoreValue` | `senses->[selector]->ignoreValue` | `STORED` | Boolean — `true` = ignore the associated value; `false` = use it normally. | On a Sense record, this field stores whether a Sense ignores its numeric range. | `FIND` + `RECORD` — When true, the Sense should not be treated as having a meaningful numeric range. |
| `valueFormula.flatValue` | `senses->[selector]->valueFormula->flatValue` | `INPUT` | Number — finite stored formula/input value. Its unit depends on the record (score, AC, speed in feet, slot count, etc.). | On a Sense record, this field stores a finite value used as an input by a formula. | `FIND` + `INPUT` + `RECORD` — Stores the numeric Sense range when `ignoreValue` does not suppress it. |
| `name` | `senses->[selector]->name` | `STORED` | Display-name string. Use it as a selector only when it uniquely identifies one active record. | On a Sense record, this field stores the record's primary display name. | `FIND` + `IDENTITY` |
| `shortID` | `senses->[selector]->shortID` | `STORED` | Compact Beacon record ID string used by sheet action calls. Treat as identity; do not invent or casually edit it. | On a Sense record, this field stores the compact ID used by Beacon sheet action calls. | `FIND` + `IDENTITY` |
| `_enabled` | `senses->[selector]->_enabled` | `STORED` | Boolean — `true` = this canonical record participates in the live character model; `false` = the record is disabled/excluded. This is not the same as a Condition record's `_active` state. | On a Sense record, this field stores whether the canonical record participates in the live character model. | `FIND` + `TOGGLE` + `RECORD` |
| `arrayPosition` | `senses->[selector]->arrayPosition` | `ORDER` | Number used for relative record ordering. Treat it as ordering metadata rather than a game statistic. | On a Sense record, this field stores the record's relative display position among records of the same family. | `FIND` + `ORDER` |
| `parentID` | `senses->[selector]->parentID` | `STORED` | Canonical parent relationship ID string. Blank means no parent where allowed; otherwise it must identify a valid parent record. | On a Sense record, this field stores the relationship ID of the record's immediate parent. | `FIND` + `GRAPH` |

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

| Field | ScriptCards location | Value kind | Values / format | Description | Use |
|---|---|---|---|---|---|
| `sizeValue` | `sizes->[selector]->sizeValue` | `STORED` | Size/value string used by the Size record; copy an observed sheet value rather than inventing an enum. | On a Size record, this field stores the canonical creature-size value. | `FIND` + `RECORD` |
| `name` | `sizes->[selector]->name` | `STORED` | Display-name string. Use it as a selector only when it uniquely identifies one active record. | On a Size record, this field stores the record's primary display name. | `FIND` + `IDENTITY` |
| `shortID` | `sizes->[selector]->shortID` | `STORED` | Compact Beacon record ID string used by sheet action calls. Treat as identity; do not invent or casually edit it. | On a Size record, this field stores the compact ID used by Beacon sheet action calls. | `FIND` + `IDENTITY` |
| `_enabled` | `sizes->[selector]->_enabled` | `STORED` | Boolean — `true` = this canonical record participates in the live character model; `false` = the record is disabled/excluded. This is not the same as a Condition record's `_active` state. | On a Size record, this field stores whether the canonical record participates in the live character model. | `FIND` + `TOGGLE` + `RECORD` |
| `parentID` | `sizes->[selector]->parentID` | `STORED` | Canonical parent relationship ID string. Blank means no parent where allowed; otherwise it must identify a valid parent record. | On a Size record, this field stores the relationship ID of the record's immediate parent. | `FIND` + `GRAPH` |

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

| Field | ScriptCards location | Value kind | Values / format | Description | Use |
|---|---|---|---|---|---|
| `ability` | `skills->[selector]->ability` | `INPUT` | Ability name — verified D&D ability values are `Strength`, `Dexterity`, `Constitution`, `Intelligence`, `Wisdom`, or `Charisma`. | On a Skill record, this field identifies the ability used by this record or formula. | `FIND` + `INPUT` + `RECORD` |
| `custom` | `skills->[selector]->custom` | `STORED` | Boolean — `true` = custom/user-defined record value; `false` = non-custom where the record family uses this flag. | On a Skill record, this field stores `custom`. | `FIND` + `RECORD` |
| `showAsPassive` | `skills->[selector]->showAsPassive` | `STORED` | Boolean — `true` = display/use as a passive value; `false` = normal display behavior. | On a Skill record, this field stores whether the Skill can be displayed or calculated as a passive score. | `FIND` + `RECORD` — Controls whether this Skill participates in passive-score display or calculation; it is not the passive total itself. |
| `name` | `skills->[selector]->name` | `STORED` | Display-name string. Use it as a selector only when it uniquely identifies one active record. | On a Skill record, this field stores the record's primary display name. | `FIND` + `IDENTITY` |
| `shortID` | `skills->[selector]->shortID` | `STORED` | Compact Beacon record ID string used by sheet action calls. Treat as identity; do not invent or casually edit it. | On a Skill record, this field stores the compact ID used by Beacon sheet action calls. | `FIND` + `IDENTITY` |
| `_enabled` | `skills->[selector]->_enabled` | `STORED` | Boolean — `true` = this canonical record participates in the live character model; `false` = the record is disabled/excluded. This is not the same as a Condition record's `_active` state. | On a Skill record, this field stores whether the canonical record participates in the live character model. | `FIND` + `TOGGLE` + `RECORD` |

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

| Field | ScriptCards location | Value kind | Values / format | Description | Use |
|---|---|---|---|---|---|
| `description` | `species->[selector]->description` | `STORED` | Free text/HTML-like sheet description; blank is valid. | On a Species record, this field stores the human-readable description. | `FIND` + `RECORD` |
| `preventSubspecies` | `species->[selector]->preventSubspecies` | `STORED` | Boolean — `true` = suppress/prevent subspecies behavior; `false` = do not suppress it. | On a Species record, this field stores `preventSubspecies`. | `FIND` + `RECORD` |
| `childIDs` | `species->[selector]->childIDs` | `STORED` | Array of canonical child relationship IDs. `[]` = no child records. Preserve valid graph identities and ordering. | On a Species record, this field stores the relationship IDs of this record's immediate child records. | `FIND` + `GRAPH` |
| `name` | `species->[selector]->name` | `STORED` | Display-name string. Use it as a selector only when it uniquely identifies one active record. | On a Species record, this field stores the record's primary display name. | `FIND` + `IDENTITY` |
| `shortID` | `species->[selector]->shortID` | `STORED` | Compact Beacon record ID string used by sheet action calls. Treat as identity; do not invent or casually edit it. | On a Species record, this field stores the compact ID used by Beacon sheet action calls. | `FIND` + `IDENTITY` |
| `_enabled` | `species->[selector]->_enabled` | `STORED` | Boolean — `true` = this canonical record participates in the live character model; `false` = the record is disabled/excluded. This is not the same as a Condition record's `_active` state. | On a Species record, this field stores whether the canonical record participates in the live character model. | `FIND` + `TOGGLE` + `RECORD` |
| `parentID` | `species->[selector]->parentID` | `STORED` | Canonical parent relationship ID string. Blank means no parent where allowed; otherwise it must identify a valid parent record. | On a Species record, this field stores the relationship ID of the record's immediate parent. | `FIND` + `GRAPH` |

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

| Field | ScriptCards location | Value kind | Values / format | Description | Use |
|---|---|---|---|---|---|
| `speed` | `speeds->[selector]->speed` | `STORED` | Movement mode string. Observed values include `Walk`, `Fly`, `Fly (Hover)`, `Swim`, `Climb`, `Burrow`, and condition-owned `All` overrides. | On a Speed record, this field identifies the movement mode, such as Walk, Fly, Climb, Swim, or Burrow. | `FIND` + `RECORD` — Identifies the movement mode; the direct alias `speed` represents Speed only. |
| `calculation` | `speeds->[selector]->calculation` | `INPUT` | Observed calculation modes include `Set Base`, `Modify`, `Set Value`, and `Minimum`. Not every record family supports every mode; keep the mode appropriate to that record family. | On a Speed record, this field identifies the calculation method used by this record. | `FIND` + `INPUT` + `RECORD` |
| `valueFormula.flatValue` | `speeds->[selector]->valueFormula->flatValue` | `INPUT` | Number — finite stored formula/input value. Its unit depends on the record (score, AC, speed in feet, slot count, etc.). | On a Speed record, this field stores a finite value used as an input by a formula. | `FIND` + `INPUT` + `RECORD` — Changes the selected movement mode’s base value, after which the sheet recalculates the final speed. |
| `name` | `speeds->[selector]->name` | `STORED` | Display-name string. Use it as a selector only when it uniquely identifies one active record. | On a Speed record, this field stores the record's primary display name. | `FIND` + `IDENTITY` |
| `shortID` | `speeds->[selector]->shortID` | `STORED` | Compact Beacon record ID string used by sheet action calls. Treat as identity; do not invent or casually edit it. | On a Speed record, this field stores the compact ID used by Beacon sheet action calls. | `FIND` + `IDENTITY` |
| `_enabled` | `speeds->[selector]->_enabled` | `STORED` | Boolean — `true` = this canonical record participates in the live character model; `false` = the record is disabled/excluded. This is not the same as a Condition record's `_active` state. | On a Speed record, this field stores whether the canonical record participates in the live character model. | `FIND` + `TOGGLE` + `RECORD` |
| `arrayPosition` | `speeds->[selector]->arrayPosition` | `ORDER` | Number used for relative record ordering. Treat it as ordering metadata rather than a game statistic. | On a Speed record, this field stores the record's relative display position among records of the same family. | `FIND` + `ORDER` |
| `parentID` | `speeds->[selector]->parentID` | `STORED` | Canonical parent relationship ID string. Blank means no parent where allowed; otherwise it must identify a valid parent record. | On a Speed record, this field stores the relationship ID of the record's immediate parent. | `FIND` + `GRAPH` |

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

| Field | ScriptCards location | Value kind | Values / format | Description | Use |
|---|---|---|---|---|---|
| `_prepared` | `spells->[selector]->_prepared` | `STORED` | Boolean — `true` = prepared; `false` = unprepared. | On a Spell record, this field stores whether the spell is currently prepared. | `FIND` + `TOGGLE` + `RECORD` — This is the character’s current prepared state for the spell. |
| `alwaysPrepared` | `spells->[selector]->alwaysPrepared` | `STORED` | Boolean — `true` = always prepared; `false` = not marked always prepared. | On a Spell record, this field stores `alwaysPrepared`. | `FIND` + `RECORD` — Marks a spell as inherently always prepared; do not use it as a temporary prepared toggle. |
| `level` | `spells->[selector]->level` | `STORED` | Integer level value. Interpret it in the context of the owning record (class level, feature level, etc.). | On a Spell record, this field stores a class, spell, slot, or upcasting level. | `FIND` + `RECORD` |
| `school` | `spells->[selector]->school` | `STORED` | Spell-school string; preserve the sheet's exact school name. | On a Spell record, this field stores the spell school. | `FIND` + `RECORD` |
| `castingTime` | `spells->[selector]->castingTime` | `STORED` | Spell casting-time text, e.g. the sheet's stored action/time description. | On a Spell record, this field stores `castingTime`. | `FIND` + `RECORD` |
| `range` | `spells->[selector]->range` | `STORED` | Attack/spell range text in the sheet's stored format. | On a Spell record, this field stores the attack or spell range. | `FIND` + `RECORD` |
| `duration` | `spells->[selector]->duration` | `STORED` | Spell/effect duration text. | On a Spell record, this field stores the duration of the spell or effect. | `FIND` + `RECORD` |
| `concentration` | `spells->[selector]->concentration` | `STORED` | Boolean — `true` = concentration required; `false` = no concentration requirement. | On a Spell record, this field stores whether the spell requires Concentration. | `FIND` + `RECORD` |
| `ritual` | `spells->[selector]->ritual` | `STORED` | Boolean — `true` = ritual spell; `false` = not a ritual. | On a Spell record, this field stores whether the spell can be cast as a Ritual. | `FIND` + `RECORD` |
| `components.verbal` | `spells->[selector]->components->verbal` | `STORED` | Boolean — `true` = Verbal component required; `false` = no Verbal component. | On a Spell record, this field stores `verbal`. | `FIND` + `RECORD` |
| `components.somatic` | `spells->[selector]->components->somatic` | `STORED` | Boolean — `true` = Somatic component required; `false` = no Somatic component. | On a Spell record, this field stores `somatic`. | `FIND` + `RECORD` |
| `components.material` | `spells->[selector]->components->material` | `STORED` | Boolean — `true` = Material component required; `false` = no Material component. | On a Spell record, this field stores `material`. | `FIND` + `RECORD` |
| `components.materialDescription` | `spells->[selector]->components->materialDescription` | `STORED` | Free text describing the Material component; blank when no description is stored. | On a Spell record, this field stores `materialDescription`. | `FIND` + `RECORD` |
| `cantripScale` | `spells->[selector]->cantripScale` | `STORED` | Cantrip-scaling string/state; preserve the sheet's existing value unless the desired mode is verified. | On a Spell record, this field stores the spell's cantrip-scaling behavior. | `FIND` + `RECORD` |
| `upcastText` | `spells->[selector]->upcastText` | `STORED` | Free text shown for upcasting behavior; blank is valid. | On a Spell record, this field stores `upcastText`. | `FIND` + `RECORD` |
| `description` | `spells->[selector]->description` | `STORED` | Free text/HTML-like sheet description; blank is valid. | On a Spell record, this field stores the human-readable description. | `FIND` + `RECORD` |
| `name` | `spells->[selector]->name` | `STORED` | Display-name string. Use it as a selector only when it uniquely identifies one active record. | On a Spell record, this field stores the record's primary display name. | `FIND` + `IDENTITY` |
| `shortID` | `spells->[selector]->shortID` | `STORED` | Compact Beacon record ID string used by sheet action calls. Treat as identity; do not invent or casually edit it. | On a Spell record, this field stores the compact ID used by Beacon sheet action calls. | `FIND` + `IDENTITY` — Use this for the Beacon spell action call; typed writes use the selected collection path. |
| `_enabled` | `spells->[selector]->_enabled` | `STORED` | Boolean — `true` = this canonical record participates in the live character model; `false` = the record is disabled/excluded. This is not the same as a Condition record's `_active` state. | On a Spell record, this field stores whether the canonical record participates in the live character model. | `FIND` + `TOGGLE` + `RECORD` |
| `arrayPosition` | `spells->[selector]->arrayPosition` | `ORDER` | Number used for relative record ordering. Treat it as ordering metadata rather than a game statistic. | On a Spell record, this field stores the record's relative display position among records of the same family. | `FIND` + `ORDER` |
| `parentID` | `spells->[selector]->parentID` | `STORED` | Canonical parent relationship ID string. Blank means no parent where allowed; otherwise it must identify a valid parent record. | On a Spell record, this field stores the relationship ID of the record's immediate parent. | `FIND` + `GRAPH` |
| `childIDs` | `spells->[selector]->childIDs` | `STORED` | Array of canonical child relationship IDs. `[]` = no child records. Preserve valid graph identities and ordering. | On a Spell record, this field stores the relationship IDs of this record's immediate child records. | `FIND` + `GRAPH` |

#### Spell Slot records

**Purpose:** Spell Slot records store normal or Pact slot entitlement and capacity formula inputs. Progressive features can retain older records and mark them as replaced through `overwrittenBy`.

**Calculation:** The direct aliases `lvl1_slots_total` through `lvl9_slots_total` are finite **normal-slot** capacity inputs. For D&D 2024 Beacon reads, ScriptCards reconstructs these aliases locally from active non-Pact Spell Slot records when their calculation shapes are verified; otherwise it preserves the native sheet-item lookup. Pact capacity is record-driven and Pact current state is stored separately under `sheet->spellSlots->currentPactByLevel`.

**General use:** Use the direct spell-slot aliases for ordinary normal-slot reads and writes. For `lvl1_slots_expended` through `lvl9_slots_expended`, ScriptCards internally reads and writes the matching `currentByLevel` remaining-slot leaf so the alias has one consistent meaning in both directions. Use `currentPactByLevel` for current Pact state. Use the typed collection for entitlement details; ScriptCards removes superseded records from the active collection when their enabled `overwrittenBy` replacement is present.

> **Progression rule**
>
> Do not sum every enabled Spell Slot record that shares a parent. On the tested Warlock 2 character, the earlier level-1 Pact record stored `1` and pointed through `overwrittenBy` to the later record storing `2`. The correct Pact capacity was `2`, not `3`.

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

| Field | ScriptCards location | Value kind | Values / format | Description | Use |
|---|---|---|---|---|---|
| `_slotType` | `spellslots->[selector]->_slotType` | `STORED` | Spell-slot category string. Observed normal records use `normal`; Pact records identify a Pact slot type. Treat normal and Pact records as separate pools. | On a Spell Slot record, this field identifies the spell-slot category, such as normal or Pact. | `FIND` + `RECORD` — Distinguishes normal and Pact entitlement records; do not infer the slot type from `spellLevel` alone. |
| `spellLevel` | `spellslots->[selector]->spellLevel` | `STORED` | Integer spell level. Ordinary D&D spell levels are `0` through `9`; `0` is a cantrip. | On a Spell Slot record, this field stores the spell-slot level. | `FIND` + `RECORD` |
| `calculation` | `spellslots->[selector]->calculation` | `INPUT` | Observed calculation modes include `Set Base`, `Modify`, `Set Value`, and `Minimum`. Not every record family supports every mode; keep the mode appropriate to that record family. | On a Spell Slot record, this field identifies the calculation method used by this record. | `FIND` + `INPUT` + `RECORD` |
| `valueFormula.flatValue` | `spellslots->[selector]->valueFormula->flatValue` | `INPUT` | Number — finite stored formula/input value. Its unit depends on the record (score, AC, speed in feet, slot count, etc.). | On a Spell Slot record, this field stores a finite value used as an input by a formula. | `FIND` + `INPUT` + `RECORD` |
| `name` | `spellslots->[selector]->name` | `STORED` | Display-name string. Use it as a selector only when it uniquely identifies one active record. | On a Spell Slot record, this field stores the record's primary display name. | `FIND` + `IDENTITY` |
| `shortID` | `spellslots->[selector]->shortID` | `STORED` | Compact Beacon record ID string used by sheet action calls. Treat as identity; do not invent or casually edit it. | On a Spell Slot record, this field stores the compact ID used by Beacon sheet action calls. | `FIND` + `IDENTITY` |
| `_enabled` | `spellslots->[selector]->_enabled` | `STORED` | Boolean — `true` = this canonical record participates in the live character model; `false` = the record is disabled/excluded. This is not the same as a Condition record's `_active` state. | On a Spell Slot record, this field stores whether the canonical record participates in the live character model. | `FIND` + `TOGGLE` + `RECORD` |
| `overwrittenBy` | `spellslots->[selector]->overwrittenBy` | `STORED` | Canonical replacement record key. Blank/no value = not superseded; otherwise it identifies the enabled replacement record. | Stores the raw canonical key of the later record that supersedes this progression stage. | `FIND` + `GRAPH` — When the referenced replacement exists and is enabled, ScriptCards excludes this record from the active typed collection. |
| `cascades` | `spellslots->[selector]->cascades` | `STORED` | Object/map of cascade keys to activation arrays. Example condition-owned effects use entries such as `<condition> = ["Activate"]`. Traverse a specific child before writing. | Stores progression/cascade metadata. The tested earlier Pact record identified its replacement as an `Overwrite`. | `FIND` + `GRAPH` — Treat as structural metadata; do not add the values of overwrite-linked records. |
| `parentID` | `spellslots->[selector]->parentID` | `STORED` | Canonical parent relationship ID string. Blank means no parent where allowed; otherwise it must identify a valid parent record. | On a Spell Slot record, this field stores the relationship ID of the record's immediate parent. Multiple progression stages can share this parent. | `FIND` + `GRAPH` — Parent identity alone may match several raw records; active typed selection also applies the overwrite rule. |

#### Spellcasting records

**Purpose:** Spellcasting records store independent spellcasting profiles such as class, Pact Magic, and species spellcasting. A character may have several enabled records at once—for example, High Elf, Paladin, and Warlock—with a separate `ability` on each record.

**Calculation:** The official D&D 2024 Beacon Spellcasting Ability selector writes the selected record's `ability`. The character-level `spellcasting_ability`, `spell_attack_bonus`, `spell_attack_mod`, `spell_save_dc`, and `spell_dc_mod` aliases are singular compatibility results and may reflect only one of several enabled Spellcasting records. ScriptCards reconstructs `spell_attack_mod` and `spell_dc_mod` locally as the selected casting ability modifier only when the active Spellcasting records agree on one ability; otherwise it preserves the native compatibility lookup instead of guessing.

**General use:** Locate the exact Spellcasting record by a unique selector, then read or write its `ability`. Do not assume that changing one record will change the singular compatibility attack/DC aliases. Verified testing showed that High Elf and Warlock `ability` changes could leave those aliases unchanged while a Paladin `ability` change updated them.

```scard
[*S:spellcastings->Paladin->ability]
--!c:[&CharacterID]|spellcastings->Paladin->ability:Charisma
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

| Field | ScriptCards location | Value kind | Values / format | Description | Use |
|---|---|---|---|---|---|
| `ability` | `spellcastings->[selector]->ability` | `INPUT` | Ability name — verified D&D ability values are `Strength`, `Dexterity`, `Constitution`, `Intelligence`, `Wisdom`, or `Charisma`. | Verified official write target. The D&D 2024 Beacon sheet's Spellcasting Ability selector changes this field on the selected Spellcasting record. Each class, pact, species, or other spellcasting source may have its own value. | `FIND` + `INPUT` + `RECORD` — Write this exact field to mimic the official sheet selector. |
| `spellcastingAbility` | `spellcastings->[selector]->spellcastingAbility` | `UNKNOWN` | Spellcasting ability name — one of the D&D abilities when explicitly set; blank/other sheet-defined states may defer to another source. | High Elf, Paladin, and Warlock Spellcasting records returned `undefined`, and the official selector did not write this field. It is not the verified D&D 2024 Beacon casting-ability write target. | `FIND` + `UNVERIFIED` — Prefer `ability`; do not create or write this field merely because its name suggests it. |
| `casterType` | `spellcastings->[selector]->casterType` | `STORED` | Spellcasting progression/category string. Pact and non-Pact casting are distinct; the complete literal set was not exhaustively probed. | On a Spellcasting record, this field identifies the spellcasting progression or caster category. | `FIND` + `RECORD` |
| `overviewDisplay` | `spellcastings->[selector]->overviewDisplay` | `STORED` | Boolean — `true` = show in the relevant overview; `false` = do not show there. | On a Spellcasting record, this field stores `overviewDisplay`. | `FIND` + `RECORD` |
| `name` | `spellcastings->[selector]->name` | `STORED` | Display-name string. Use it as a selector only when it uniquely identifies one active record. | On a Spellcasting record, this field stores the record's primary display name. | `FIND` + `IDENTITY` |
| `shortID` | `spellcastings->[selector]->shortID` | `STORED` | Compact Beacon record ID string used by sheet action calls. Treat as identity; do not invent or casually edit it. | On a Spellcasting record, this field stores the compact ID used by Beacon sheet action calls. | `FIND` + `IDENTITY` |
| `_enabled` | `spellcastings->[selector]->_enabled` | `STORED` | Boolean — `true` = this canonical record participates in the live character model; `false` = the record is disabled/excluded. This is not the same as a Condition record's `_active` state. | On a Spellcasting record, this field stores whether the canonical record participates in the live character model. | `FIND` + `TOGGLE` + `RECORD` |
| `parentID` | `spellcastings->[selector]->parentID` | `STORED` | Canonical parent relationship ID string. Blank means no parent where allowed; otherwise it must identify a valid parent record. | On a Spellcasting record, this field stores the relationship ID of the record's immediate parent. | `FIND` + `GRAPH` |
| `childIDs` | `spellcastings->[selector]->childIDs` | `STORED` | Array of canonical child relationship IDs. `[]` = no child records. Preserve valid graph identities and ordering. | On a Spellcasting record, this field stores the relationship IDs of this record's immediate child records. | `FIND` + `GRAPH` |

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

| Field | ScriptCards location | Value kind | Values / format | Description | Use |
|---|---|---|---|---|---|
| `childIDs` | `subclasses->[selector]->childIDs` | `STORED` | Array of canonical child relationship IDs. `[]` = no child records. Preserve valid graph identities and ordering. | On a Subclass record, this field stores the relationship IDs of this record's immediate child records. | `FIND` + `GRAPH` |
| `name` | `subclasses->[selector]->name` | `STORED` | Display-name string. Use it as a selector only when it uniquely identifies one active record. | On a Subclass record, this field stores the record's primary display name. | `FIND` + `IDENTITY` |
| `shortID` | `subclasses->[selector]->shortID` | `STORED` | Compact Beacon record ID string used by sheet action calls. Treat as identity; do not invent or casually edit it. | On a Subclass record, this field stores the compact ID used by Beacon sheet action calls. | `FIND` + `IDENTITY` |
| `_enabled` | `subclasses->[selector]->_enabled` | `STORED` | Boolean — `true` = this canonical record participates in the live character model; `false` = the record is disabled/excluded. This is not the same as a Condition record's `_active` state. | On a Subclass record, this field stores whether the canonical record participates in the live character model. | `FIND` + `TOGGLE` + `RECORD` |
| `parentID` | `subclasses->[selector]->parentID` | `STORED` | Canonical parent relationship ID string. Blank means no parent where allowed; otherwise it must identify a valid parent record. | On a Subclass record, this field stores the relationship ID of the record's immediate parent. | `FIND` + `GRAPH` |
| `sourceID` | `subclasses->[selector]->sourceID` | `STORED` | Source/owner identity string. Its target semantics vary by record family; resolve it against the canonical graph rather than guessing. | On a Subclass record, this field stores the originating source record identifier. | `FIND` + `IDENTITY` |

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

| Field | ScriptCards location | Value kind | Values / format | Description | Use |
|---|---|---|---|---|---|
| `mode` | `upcastings->[selector]->mode` | `STORED` | Mode string; meaning depends on the record family. For Upcasting an observed value is `Per X Spell Level`. Preserve exact existing sheet text unless using a verified mode. | On an Upcasting record, this field stores the selected mode, such as a roll or upcasting mode. | `FIND` + `RECORD` |
| `startingLevel` | `upcastings->[selector]->startingLevel` | `STORED` | Integer spell/upcasting starting level for the rule represented by this record. | On an Upcasting record, this field stores the starting level for the upcasting rule. | `FIND` + `RECORD` |
| `level` | `upcastings->[selector]->level` | `STORED` | Integer level value. Interpret it in the context of the owning record (class level, feature level, etc.). | On an Upcasting record, this field stores a class, spell, slot, or upcasting level. | `FIND` + `RECORD` |
| `changeMode` | `upcastings->[selector]->changeMode` | `STORED` | Observed Upcasting change mode: `Add`. Other allowed modes were not exhaustively probed. | On an Upcasting record, this field stores how the target value changes at higher levels. | `FIND` + `RECORD` |
| `target` | `upcastings->[selector]->target` | `STORED` | Target path/string for the owning rule. For Upcasting an observed target is `$.repeat`; other targets are record-specific. | On an Upcasting record, this field identifies the value or linked record affected by the scaling rule. | `FIND` + `RECORD` — Identifies the value or linked record being scaled; preserve the expected target identity when editing the rule. |
| `value` | `upcastings->[selector]->value` | `STORED` | Number — finite stored value; its meaning depends on the record family (currency amount, resource value, upcast increment, etc.). | On an Upcasting record, this field stores the record's finite current value. | `FIND` + `RECORD` |
| `name` | `upcastings->[selector]->name` | `STORED` | Display-name string. Use it as a selector only when it uniquely identifies one active record. | On an Upcasting record, this field stores the record's primary display name. | `FIND` + `IDENTITY` |
| `shortID` | `upcastings->[selector]->shortID` | `STORED` | Compact Beacon record ID string used by sheet action calls. Treat as identity; do not invent or casually edit it. | On an Upcasting record, this field stores the compact ID used by Beacon sheet action calls. | `FIND` + `IDENTITY` |
| `_enabled` | `upcastings->[selector]->_enabled` | `STORED` | Boolean — `true` = this canonical record participates in the live character model; `false` = the record is disabled/excluded. This is not the same as a Condition record's `_active` state. | On an Upcasting record, this field stores whether the canonical record participates in the live character model. | `FIND` + `TOGGLE` + `RECORD` |
| `parentID` | `upcastings->[selector]->parentID` | `STORED` | Canonical parent relationship ID string. Blank means no parent where allowed; otherwise it must identify a valid parent record. | On an Upcasting record, this field stores the relationship ID of the record's immediate parent. | `FIND` + `GRAPH` |

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

| Field | ScriptCards location | Value kind | Values / format | Description | Use |
|---|---|---|---|---|---|
| `parentID` | `weaponmasterychanges->[selector]->parentID` | `STORED` | Canonical parent relationship ID string. Blank means no parent where allowed; otherwise it must identify a valid parent record. | Stores the linked record ID of the owning feature record. | `FIND` + `GRAPH` |
| `name` | `weaponmasterychanges->[selector]->name` | `STORED` | Display-name string. Use it as a selector only when it uniquely identifies one active record. | Stores the record's display name. | `FIND` + `IDENTITY` |
| `shortID` | `weaponmasterychanges->[selector]->shortID` | `STORED` | Compact Beacon record ID string used by sheet action calls. Treat as identity; do not invent or casually edit it. | Stores the compact Beacon action identity. | `FIND` + `IDENTITY` |
| `_enabled` | `weaponmasterychanges->[selector]->_enabled` | `STORED` | Boolean — `true` = this canonical record participates in the live character model; `false` = the record is disabled/excluded. This is not the same as a Condition record's `_active` state. | Stores whether the record participates in the live character model. | `FIND` + `TOGGLE` + `RECORD` |

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

| Field | ScriptCards location | Value kind | Values / format | Description | Use |
|---|---|---|---|---|---|
| `known` | `weaponmasteryknowns->[selector]->known` | `STORED` | Object/map of known Weapon Mastery selections. Observed form: `<weapon name>` keys with stored selection payloads; traverse a specific entry rather than replacing the object. | Stores an object whose key identifies the weapon selected for mastery. | `FIND` + `RECORD` — Structured selected-weapon data; address an existing primitive child instead of replacing the whole object. |
| `childIDs` | `weaponmasteryknowns->[selector]->childIDs` | `STORED` | Array of canonical child relationship IDs. `[]` = no child records. Preserve valid graph identities and ordering. | Stores the linked record ID of the linked Weapon Mastery record. | `FIND` + `GRAPH` — Contains the linked Weapon Mastery record identity; edit an existing array element rather than replacing the whole array. |
| `name` | `weaponmasteryknowns->[selector]->name` | `STORED` | Display-name string. Use it as a selector only when it uniquely identifies one active record. | Stores the selected mastery record's display name. | `FIND` + `IDENTITY` |
| `shortID` | `weaponmasteryknowns->[selector]->shortID` | `STORED` | Compact Beacon record ID string used by sheet action calls. Treat as identity; do not invent or casually edit it. | Stores the compact Beacon action identity. | `FIND` + `IDENTITY` |
| `_enabled` | `weaponmasteryknowns->[selector]->_enabled` | `STORED` | Boolean — `true` = this canonical record participates in the live character model; `false` = the record is disabled/excluded. This is not the same as a Condition record's `_active` state. | Stores whether the selection participates in the live character model. | `FIND` + `TOGGLE` + `RECORD` |
| `parentID` | `weaponmasteryknowns->[selector]->parentID` | `STORED` | Canonical parent relationship ID string. Blank means no parent where allowed; otherwise it must identify a valid parent record. | Stores the linked record ID of the owning Weapon Mastery feature. | `FIND` + `GRAPH` |

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

| Field | ScriptCards location | Value kind | Values / format | Description | Use |
|---|---|---|---|---|---|
| `calculation` | `weaponmasteryslots->[selector]->calculation` | `INPUT` | Observed calculation modes include `Set Base`, `Modify`, `Set Value`, and `Minimum`. Not every record family supports every mode; keep the mode appropriate to that record family. | Stores the calculation mode used for mastery capacity. | `FIND` + `INPUT` + `RECORD` |
| `valueFormula.flatValue` | `weaponmasteryslots->[selector]->valueFormula->flatValue` | `INPUT` | Number — finite stored formula/input value. Its unit depends on the record (score, AC, speed in feet, slot count, etc.). | Stores the finite mastery-slot capacity. | `FIND` + `INPUT` + `RECORD` |
| `name` | `weaponmasteryslots->[selector]->name` | `STORED` | Display-name string. Use it as a selector only when it uniquely identifies one active record. | Stores the record's display name. | `FIND` + `IDENTITY` |
| `shortID` | `weaponmasteryslots->[selector]->shortID` | `STORED` | Compact Beacon record ID string used by sheet action calls. Treat as identity; do not invent or casually edit it. | Stores the compact Beacon action identity. | `FIND` + `IDENTITY` |
| `_enabled` | `weaponmasteryslots->[selector]->_enabled` | `STORED` | Boolean — `true` = this canonical record participates in the live character model; `false` = the record is disabled/excluded. This is not the same as a Condition record's `_active` state. | Stores whether the capacity record participates in the live character model. | `FIND` + `TOGGLE` + `RECORD` |
| `parentID` | `weaponmasteryslots->[selector]->parentID` | `STORED` | Canonical parent relationship ID string. Blank means no parent where allowed; otherwise it must identify a valid parent record. | Stores the linked record ID of the owning Weapon Mastery feature. | `FIND` + `GRAPH` |

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

| Field | ScriptCards location | Value kind | Values / format | Description | Use |
|---|---|---|---|---|---|
| `active` | `weaponmasteries->[selector]->active` | `STORED` | Boolean — `true` = active; `false` = inactive. | On a Weapon Mastery record, this field stores whether the mastery is currently active. | `FIND` + `TOGGLE` + `RECORD` — This is the mastery’s active state; `_enabled` only controls whether the record participates. |
| `applies` | `weaponmasteries->[selector]->applies` | `STORED` | Applicability string. Weapon Mastery examples observed `On Miss` and `On Hit`; other record families may use different literals. | On a Weapon Mastery record, this field stores the item or weapon applicability rules. | `FIND` + `RECORD` — Structured applicability rules; inspect and edit an existing primitive child rather than replacing the container blindly. |
| `defaultItems` | `weaponmasteries->[selector]->defaultItems` | `STORED` | Array of default Item identities/names associated with the record. `[]` = none. | On a Weapon Mastery record, this field stores the default items associated with the mastery. | `FIND` + `RECORD` — Structured default-item data; inspect and edit an existing primitive child or array element rather than replacing the container blindly. |
| `description` | `weaponmasteries->[selector]->description` | `STORED` | Free text/HTML-like sheet description; blank is valid. | On a Weapon Mastery record, this field stores the human-readable description. | `FIND` + `RECORD` |
| `name` | `weaponmasteries->[selector]->name` | `STORED` | Display-name string. Use it as a selector only when it uniquely identifies one active record. | On a Weapon Mastery record, this field stores the record's primary display name. | `FIND` + `IDENTITY` |
| `shortID` | `weaponmasteries->[selector]->shortID` | `STORED` | Compact Beacon record ID string used by sheet action calls. Treat as identity; do not invent or casually edit it. | On a Weapon Mastery record, this field stores the compact ID used by Beacon sheet action calls. | `FIND` + `IDENTITY` |
| `_enabled` | `weaponmasteries->[selector]->_enabled` | `STORED` | Boolean — `true` = this canonical record participates in the live character model; `false` = the record is disabled/excluded. This is not the same as a Condition record's `_active` state. | On a Weapon Mastery record, this field stores whether the canonical record participates in the live character model. | `FIND` + `TOGGLE` + `RECORD` |
| `parentID` | `weaponmasteries->[selector]->parentID` | `STORED` | Canonical parent relationship ID string. Blank means no parent where allowed; otherwise it must identify a valid parent record. | On a Weapon Mastery record, this field stores the relationship ID of the record's immediate parent. | `FIND` + `GRAPH` |
| `childIDs` | `weaponmasteries->[selector]->childIDs` | `STORED` | Array of canonical child relationship IDs. `[]` = no child records. Preserve valid graph identities and ordering. | On a Weapon Mastery record, this field stores the relationship IDs of this record's immediate child records. | `FIND` + `GRAPH` |

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
