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

## Values and writable domains

A location is not considered fully documented here merely because its path is known. Every mapped leaf now also states the **value domain** that the current evidence supports.

The **Values / writable domain** column uses these rules:

- **Finite enum** — The literal values that have been verified, observed, or explicitly recognized by the current ScriptCards Beacon adapter are listed. When the controlled data does not prove that the list is complete, the row says so.
- **Boolean** — The row states what `true` and `false` actually mean. For example, `conditions->[selector]->_active` uses `true` for an active condition and `false` for an inactive condition.
- **Numeric input** — The row states what the number represents and any verified bounds. If Roll20's hard validation range was not tested, the reference says that instead of inventing one.
- **Free text/string** — The value is open-ended text rather than a finite enum. Where blank is known to be meaningful, that is stated.
- **Identity/reference** — The value must be an existing valid Beacon identity such as a canonical `recordKey`, `shortID`, Class ID, or source ID. These are not arbitrary strings even though their JavaScript type is `string`.
- **Container** — Arrays and objects are described by their element/child meaning. Ordinary ScriptCards typed/structured writes target primitive leaves; do not replace a whole native container merely because it can be read.
- **Unverified domain** — The field/location exists, but the controlled data did not establish every accepted literal. The known values are listed when available and the gap is explicit.

**Important:** A documented value domain does not automatically make a field safe to write. Continue to follow the **Write using**, **Use**, or **Write guidance** column. Identity, graph, provenance, builder, and order fields are often readable but should not be casually changed.

### Example: activating a built-in condition

```scard
--#beaconsheet|1
--#sourcetoken|@{selected|token_id}
--&CharacterID|[*S:character_id]

--!c:[&CharacterID]|conditions->Poisoned->_active:true
```

For a Condition record:

```text
_active = true   -> condition active
_active = false  -> condition inactive

_enabled = true  -> the canonical record participates in the character model
_enabled = false -> the canonical record is disabled/excluded
```

`_enabled` is **not** the condition toggle.

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

| Direct alias | ScriptCards read location | Value role | Values / writable domain | Description | Write using |
|---|---|---|---|---|---|
| `ac` | Direct alias: `ac`<br>Typed collection: `armorclasses` | `INPUT` | Finite numeric Armor Class input. Tested with integer AC values; exact hard validation range was not independently probed. | `ac` is a finite Armor Class input. | `Direct alias` |
| `deathsave_fail1` | Direct alias: `deathsave_fail1`<br>Structured path: `sheet->hitpoints->deathSaves->failures` | `STORED` | Checkbox/state value. Use `1`/truthy to mark this specific save box and `0`/falsey to clear it; the backing count is `0`–`3`. | `deathsave_fail1` is the finite first-failure state. | `Direct alias` |
| `deathsave_fail2` | Direct alias: `deathsave_fail2`<br>Structured path: `sheet->hitpoints->deathSaves->failures` | `STORED` | Checkbox/state value. Use `1`/truthy to mark this specific save box and `0`/falsey to clear it; the backing count is `0`–`3`. | `deathsave_fail2` is the finite second-failure state. | `Direct alias` |
| `deathsave_fail3` | Direct alias: `deathsave_fail3`<br>Structured path: `sheet->hitpoints->deathSaves->failures` | `STORED` | Checkbox/state value. Use `1`/truthy to mark this specific save box and `0`/falsey to clear it; the backing count is `0`–`3`. | `deathsave_fail3` is the finite third-failure state. | `Direct alias` |
| `deathsave_succ1` | Direct alias: `deathsave_succ1`<br>Structured path: `sheet->hitpoints->deathSaves->successes` | `STORED` | Checkbox/state value. Use `1`/truthy to mark this specific save box and `0`/falsey to clear it; the backing count is `0`–`3`. | `deathsave_succ1` is the finite first-success state. | `Direct alias` |
| `deathsave_succ2` | Direct alias: `deathsave_succ2`<br>Structured path: `sheet->hitpoints->deathSaves->successes` | `STORED` | Checkbox/state value. Use `1`/truthy to mark this specific save box and `0`/falsey to clear it; the backing count is `0`–`3`. | `deathsave_succ2` is the finite second-success state. | `Direct alias` |
| `deathsave_succ3` | Direct alias: `deathsave_succ3`<br>Structured path: `sheet->hitpoints->deathSaves->successes` | `STORED` | Checkbox/state value. Use `1`/truthy to mark this specific save box and `0`/falsey to clear it; the backing count is `0`–`3`. | `deathsave_succ3` is the finite third-success state. | `Direct alias` |
| `hit_dice` | Direct alias: `hit_dice`<br>Typed collection: `hitdices` | `STORED` | Finite current Hit Dice value. Exact representation can aggregate class-specific Hit Dice; use `hitdices` records for per-class die details. | `hit_dice` is a finite Hit Dice value. | `Direct alias` |
| `hp` | Direct alias: `hp`<br>Structured path: `sheet->hitpoints->currentHP` | `STORED` | Finite numeric HP value. `0` is valid; normal use is numeric. `hp` can temporarily exceed maximum HP. | `hp` reads a finite value stored at the structured ScriptCards location shown in the location column. | `Direct alias` |
| `hp_max` | Direct alias: `hp_max`<br>Typed collection: `hitpoints` | `INPUT` | Finite numeric maximum-HP input. Normal use is non-negative; exact hard validation range was not independently probed. | `hp_max` is a finite maximum-HP input. | `Direct alias` |
| `hp_temp` | Direct alias: `hp_temp`<br>Structured path: `sheet->hitpoints->tempHP` | `STORED` | Finite numeric HP value. `0` is valid; normal use is numeric. `hp` can temporarily exceed maximum HP. | `hp_temp` reads a finite value stored at the structured ScriptCards location shown in the location column. | `Direct alias` |
| `init_tiebreaker` | Direct alias: `init_tiebreaker`<br>Structured path: `sheet->settings->addDexTiebreaker` | `STORED` | `true` = Dexterity initiative tiebreaker enabled; `false` = tiebreaker disabled. | `init_tiebreaker` reads a finite value stored at the structured ScriptCards location shown in the location column. | `Structured path` |
| `initiative_style` | Direct alias: `initiative_style`<br>Structured path: `sheet->settings->rolls->mode` | `STORED` | Observed/recognized values: `Advantage`, `Disadvantage`. Complete sheet enum not independently proven. These were directly observed for `sheet->settings->rolls->mode`; other default/normal literal(s) were not captured. | `initiative_style` reads a finite value stored at the structured ScriptCards location shown in the location column. | `Structured path` — Compatibility view of `sheet->settings->rolls->mode`; use the `Structured path:` setting for new sheet-equivalent logic. |
| `speed` | Direct alias: `speed`<br>Typed collection: `speeds`<br>Match: `speed = Walk` | `INPUT` | Finite numeric Walking speed input. Units follow the sheet's movement convention; special movement modes belong in `speeds` records. | `speed` is the finite Speed input. | `Direct alias` |

#### Ability scores

> **Value roles**
>
> - `INPUT` — An editable input used by the sheet or by a typed record.
>
> **Write using**
>
> - `Direct alias` — Write the name in the first column directly with `--!c`.

| Direct alias | ScriptCards read location | Value role | Values / writable domain | Description | Write using |
|---|---|---|---|---|---|
| `charisma` | Direct alias: `charisma`<br>Typed collection: `abilityscores`<br>Match: `ability = Charisma` | `INPUT` | Finite numeric ability-score input. Exact hard min/max validation was not independently probed. | `charisma` is a finite ability-score input. | `Direct alias` |
| `constitution` | Direct alias: `constitution`<br>Typed collection: `abilityscores`<br>Match: `ability = Constitution` | `INPUT` | Finite numeric ability-score input. Exact hard min/max validation was not independently probed. | `constitution` is a finite ability-score input. | `Direct alias` |
| `dexterity` | Direct alias: `dexterity`<br>Typed collection: `abilityscores`<br>Match: `ability = Dexterity` | `INPUT` | Finite numeric ability-score input. Exact hard min/max validation was not independently probed. | `dexterity` is a finite ability-score input. | `Direct alias` |
| `intelligence` | Direct alias: `intelligence`<br>Typed collection: `abilityscores`<br>Match: `ability = Intelligence` | `INPUT` | Finite numeric ability-score input. Exact hard min/max validation was not independently probed. | `intelligence` is a finite ability-score input. | `Direct alias` |
| `strength` | Direct alias: `strength`<br>Typed collection: `abilityscores`<br>Match: `ability = Strength` | `INPUT` | Finite numeric ability-score input. Exact hard min/max validation was not independently probed. | `strength` is a finite ability-score input. | `Direct alias` |
| `wisdom` | Direct alias: `wisdom`<br>Typed collection: `abilityscores`<br>Match: `ability = Wisdom` | `INPUT` | Finite numeric ability-score input. Exact hard min/max validation was not independently probed. | `wisdom` is a finite ability-score input. | `Direct alias` |

#### Spellcasting and spell slots

> **Value roles**
>
> - `STORED` — A finite value or state stored by the sheet.
> - `INPUT` — An editable input used by the sheet or by a typed record.
>
> **Write using**
>
> - `Direct alias` — Write the name in the first column directly with `--!c`.

| Direct alias | ScriptCards read location | Value role | Values / writable domain | Description | Write using |
|---|---|---|---|---|---|
| `lvl1_slots_expended` | Direct alias: `lvl1_slots_expended`<br>Structured path: `sheet->spellSlots->currentByLevel->FIRST` | `STORED` | Remaining/available normal level-1 slot count as exposed by ScriptCards. Write a non-negative integer through `lvl1_slots_expended`; in `.131`, ScriptCards routes that public alias directly to `sheet->spellSlots->currentByLevel->FIRST`. The underlying Roll20 native `lvl1_slots_expended` setter is translated and is not a 1:1 remaining-count setter. | `lvl1_slots_expended` is the remaining normal level-1 slot state. | `Direct alias` — In `.131`, ScriptCards safely routes `lvl1_slots_expended` to `sheet->spellSlots->currentByLevel->FIRST`. If bypassing ScriptCards and calling Roll20 directly, use the structured remaining-slot leaf rather than the native translated setter. |
| `lvl1_slots_total` | Direct alias: `lvl1_slots_total`<br>Typed collection: `spellslots`<br>Match: `spellLevel = 1` and the normal `_slotType` | `INPUT` | Finite normal level-1 slot-capacity input. Current ScriptCards local reconstruction accepts canonical `Set Base`, `Modify`, and `Minimum` Spell Slot shapes; Pact capacity is separate. | `lvl1_slots_total` is a finite slot-capacity input. | `Direct alias` |
| `lvl2_slots_expended` | Direct alias: `lvl2_slots_expended`<br>Structured path: `sheet->spellSlots->currentByLevel->SECOND` | `STORED` | Remaining/available normal level-2 slot count as exposed by ScriptCards. Write a non-negative integer through `lvl2_slots_expended`; in `.131`, ScriptCards routes that public alias directly to `sheet->spellSlots->currentByLevel->SECOND`. The underlying Roll20 native `lvl2_slots_expended` setter is translated and is not a 1:1 remaining-count setter. | `lvl2_slots_expended` is the remaining normal level-2 slot state. | `Direct alias` — In `.131`, ScriptCards safely routes `lvl2_slots_expended` to `sheet->spellSlots->currentByLevel->SECOND`. If bypassing ScriptCards and calling Roll20 directly, use the structured remaining-slot leaf rather than the native translated setter. |
| `lvl2_slots_total` | Direct alias: `lvl2_slots_total`<br>Typed collection: `spellslots`<br>Match: `spellLevel = 2` and the normal `_slotType` | `INPUT` | Finite normal level-2 slot-capacity input. Current ScriptCards local reconstruction accepts canonical `Set Base`, `Modify`, and `Minimum` Spell Slot shapes; Pact capacity is separate. | `lvl2_slots_total` is a finite slot-capacity input. | `Direct alias` |
| `lvl3_slots_expended` | Direct alias: `lvl3_slots_expended`<br>Structured path: `sheet->spellSlots->currentByLevel->THIRD` | `STORED` | Remaining/available normal level-3 slot count as exposed by ScriptCards. Write a non-negative integer through `lvl3_slots_expended`; in `.131`, ScriptCards routes that public alias directly to `sheet->spellSlots->currentByLevel->THIRD`. The underlying Roll20 native `lvl3_slots_expended` setter is translated and is not a 1:1 remaining-count setter. | `lvl3_slots_expended` is the remaining normal level-3 slot state. | `Direct alias` — In `.131`, ScriptCards safely routes `lvl3_slots_expended` to `sheet->spellSlots->currentByLevel->THIRD`. If bypassing ScriptCards and calling Roll20 directly, use the structured remaining-slot leaf rather than the native translated setter. |
| `lvl3_slots_total` | Direct alias: `lvl3_slots_total`<br>Typed collection: `spellslots`<br>Match: `spellLevel = 3` and the normal `_slotType` | `INPUT` | Finite normal level-3 slot-capacity input. Current ScriptCards local reconstruction accepts canonical `Set Base`, `Modify`, and `Minimum` Spell Slot shapes; Pact capacity is separate. | `lvl3_slots_total` is a finite slot-capacity input. | `Direct alias` |
| `lvl4_slots_expended` | Direct alias: `lvl4_slots_expended`<br>Structured path: `sheet->spellSlots->currentByLevel->FOURTH` | `STORED` | Remaining/available normal level-4 slot count as exposed by ScriptCards. Write a non-negative integer through `lvl4_slots_expended`; in `.131`, ScriptCards routes that public alias directly to `sheet->spellSlots->currentByLevel->FOURTH`. The underlying Roll20 native `lvl4_slots_expended` setter is translated and is not a 1:1 remaining-count setter. | `lvl4_slots_expended` is the remaining normal level-4 slot state. | `Direct alias` — In `.131`, ScriptCards safely routes `lvl4_slots_expended` to `sheet->spellSlots->currentByLevel->FOURTH`. If bypassing ScriptCards and calling Roll20 directly, use the structured remaining-slot leaf rather than the native translated setter. |
| `lvl4_slots_total` | Direct alias: `lvl4_slots_total`<br>Typed collection: `spellslots`<br>Match: `spellLevel = 4` and the normal `_slotType` | `INPUT` | Finite normal level-4 slot-capacity input. Current ScriptCards local reconstruction accepts canonical `Set Base`, `Modify`, and `Minimum` Spell Slot shapes; Pact capacity is separate. | `lvl4_slots_total` is a finite slot-capacity input. | `Direct alias` |
| `lvl5_slots_expended` | Direct alias: `lvl5_slots_expended`<br>Structured path: `sheet->spellSlots->currentByLevel->FIFTH` | `STORED` | Remaining/available normal level-5 slot count as exposed by ScriptCards. Write a non-negative integer through `lvl5_slots_expended`; in `.131`, ScriptCards routes that public alias directly to `sheet->spellSlots->currentByLevel->FIFTH`. The underlying Roll20 native `lvl5_slots_expended` setter is translated and is not a 1:1 remaining-count setter. | `lvl5_slots_expended` is the remaining normal level-5 slot state. | `Direct alias` — In `.131`, ScriptCards safely routes `lvl5_slots_expended` to `sheet->spellSlots->currentByLevel->FIFTH`. If bypassing ScriptCards and calling Roll20 directly, use the structured remaining-slot leaf rather than the native translated setter. |
| `lvl5_slots_total` | Direct alias: `lvl5_slots_total`<br>Typed collection: `spellslots`<br>Match: `spellLevel = 5` and the normal `_slotType` | `INPUT` | Finite normal level-5 slot-capacity input. Current ScriptCards local reconstruction accepts canonical `Set Base`, `Modify`, and `Minimum` Spell Slot shapes; Pact capacity is separate. | `lvl5_slots_total` is a finite slot-capacity input. | `Direct alias` |
| `lvl6_slots_expended` | Direct alias: `lvl6_slots_expended`<br>Structured path: `sheet->spellSlots->currentByLevel->SIXTH` | `STORED` | Remaining/available normal level-6 slot count as exposed by ScriptCards. Write a non-negative integer through `lvl6_slots_expended`; in `.131`, ScriptCards routes that public alias directly to `sheet->spellSlots->currentByLevel->SIXTH`. The underlying Roll20 native `lvl6_slots_expended` setter is translated and is not a 1:1 remaining-count setter. | `lvl6_slots_expended` is the remaining normal level-6 slot state. | `Direct alias` — In `.131`, ScriptCards safely routes `lvl6_slots_expended` to `sheet->spellSlots->currentByLevel->SIXTH`. If bypassing ScriptCards and calling Roll20 directly, use the structured remaining-slot leaf rather than the native translated setter. |
| `lvl6_slots_total` | Direct alias: `lvl6_slots_total`<br>Typed collection: `spellslots`<br>Match: `spellLevel = 6` and the normal `_slotType` | `INPUT` | Finite normal level-6 slot-capacity input. Current ScriptCards local reconstruction accepts canonical `Set Base`, `Modify`, and `Minimum` Spell Slot shapes; Pact capacity is separate. | `lvl6_slots_total` is a finite slot-capacity input. | `Direct alias` |
| `lvl7_slots_expended` | Direct alias: `lvl7_slots_expended`<br>Structured path: `sheet->spellSlots->currentByLevel->SEVENTH` | `STORED` | Remaining/available normal level-7 slot count as exposed by ScriptCards. Write a non-negative integer through `lvl7_slots_expended`; in `.131`, ScriptCards routes that public alias directly to `sheet->spellSlots->currentByLevel->SEVENTH`. The underlying Roll20 native `lvl7_slots_expended` setter is translated and is not a 1:1 remaining-count setter. | `lvl7_slots_expended` is the remaining normal level-7 slot state. | `Direct alias` — In `.131`, ScriptCards safely routes `lvl7_slots_expended` to `sheet->spellSlots->currentByLevel->SEVENTH`. If bypassing ScriptCards and calling Roll20 directly, use the structured remaining-slot leaf rather than the native translated setter. |
| `lvl7_slots_total` | Direct alias: `lvl7_slots_total`<br>Typed collection: `spellslots`<br>Match: `spellLevel = 7` and the normal `_slotType` | `INPUT` | Finite normal level-7 slot-capacity input. Current ScriptCards local reconstruction accepts canonical `Set Base`, `Modify`, and `Minimum` Spell Slot shapes; Pact capacity is separate. | `lvl7_slots_total` is a finite slot-capacity input. | `Direct alias` |
| `lvl8_slots_expended` | Direct alias: `lvl8_slots_expended`<br>Structured path: `sheet->spellSlots->currentByLevel->EIGHTH` | `STORED` | Remaining/available normal level-8 slot count as exposed by ScriptCards. Write a non-negative integer through `lvl8_slots_expended`; in `.131`, ScriptCards routes that public alias directly to `sheet->spellSlots->currentByLevel->EIGHTH`. The underlying Roll20 native `lvl8_slots_expended` setter is translated and is not a 1:1 remaining-count setter. | `lvl8_slots_expended` is the remaining normal level-8 slot state. | `Direct alias` — In `.131`, ScriptCards safely routes `lvl8_slots_expended` to `sheet->spellSlots->currentByLevel->EIGHTH`. If bypassing ScriptCards and calling Roll20 directly, use the structured remaining-slot leaf rather than the native translated setter. |
| `lvl8_slots_total` | Direct alias: `lvl8_slots_total`<br>Typed collection: `spellslots`<br>Match: `spellLevel = 8` and the normal `_slotType` | `INPUT` | Finite normal level-8 slot-capacity input. Current ScriptCards local reconstruction accepts canonical `Set Base`, `Modify`, and `Minimum` Spell Slot shapes; Pact capacity is separate. | `lvl8_slots_total` is a finite slot-capacity input. | `Direct alias` |
| `lvl9_slots_expended` | Direct alias: `lvl9_slots_expended`<br>Structured path: `sheet->spellSlots->currentByLevel->NINTH` | `STORED` | Remaining/available normal level-9 slot count as exposed by ScriptCards. Write a non-negative integer through `lvl9_slots_expended`; in `.131`, ScriptCards routes that public alias directly to `sheet->spellSlots->currentByLevel->NINTH`. The underlying Roll20 native `lvl9_slots_expended` setter is translated and is not a 1:1 remaining-count setter. | `lvl9_slots_expended` is the remaining normal level-9 slot state. | `Direct alias` — In `.131`, ScriptCards safely routes `lvl9_slots_expended` to `sheet->spellSlots->currentByLevel->NINTH`. If bypassing ScriptCards and calling Roll20 directly, use the structured remaining-slot leaf rather than the native translated setter. |
| `lvl9_slots_total` | Direct alias: `lvl9_slots_total`<br>Typed collection: `spellslots`<br>Match: `spellLevel = 9` and the normal `_slotType` | `INPUT` | Finite normal level-9 slot-capacity input. Current ScriptCards local reconstruction accepts canonical `Set Base`, `Modify`, and `Minimum` Spell Slot shapes; Pact capacity is separate. | `lvl9_slots_total` is a finite slot-capacity input. | `Direct alias` |

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

| Direct alias | ScriptCards read location | Value role | Values / writable domain | Description | Write using |
|---|---|---|---|---|---|
| `npc_challenge` | Direct alias: `npc_challenge`<br>Structured path: `sheet->npc->challengeRating` | `STORED` | Challenge Rating string. Fractional text such as `1/8` is supported/observed; complete CR literal set not enumerated. | `npc_challenge` reads a finite value stored at the structured ScriptCards location shown in the location column. | `Structured path` |
| `npc_hpformula` | Direct alias: `npc_hpformula`<br>Structured path: `sheet->npc->rollHP` | `STORED` | HP formula text/dice expression string. | `npc_hpformula` reads a finite value stored at the structured ScriptCards location shown in the location column. | `Structured path` |
| `npc_legendary_actions` | Direct alias: `npc_legendary_actions`<br>Structured path: `sheet->npc->legendaryActionCompendiumNum` | `STORED` | Finite non-negative numeric legendary-action count/allowance. | `npc_legendary_actions` reads a finite value stored at the structured ScriptCards location shown in the location column. | `Structured path` |
| `npc_legendary_actions_desc` | Direct alias: `npc_legendary_actions_desc`<br>Structured path: `sheet->npc->legendaryActionSummary` | `STORED` | Free-text/HTML-like legendary-action summary; blank allowed. | `npc_legendary_actions_desc` reads a finite value stored at the structured ScriptCards location shown in the location column. | `Structured path` |
| `npc_speed` | Direct alias: `npc_speed`<br>Typed collection: `speeds`<br>Match: `speed = Walk` | `INPUT` | Finite numeric Walking speed input. Units follow the sheet's movement convention; special movement modes belong in `speeds` records. | `npc_speed` is the finite NPC-compatible Speed input. | `Direct alias` |

#### Identity, progression, and biography

> **Value roles**
>
> - `STORED` — A finite value or state stored by the sheet.
>
> **Write using**
>
> - `Direct alias` — Write the name in the first column directly with `--!c`.

| Direct alias | ScriptCards read location | Value role | Values / writable domain | Description | Write using |
|---|---|---|---|---|---|
| `age` | Direct alias: `age` | `STORED` | Writable free text/string. No stable structured backing path or closed enum was established in the controlled probes. | `age` is a writable direct alias for the character’s age. The current probes did not identify a stable structured `sheet` location. | `Direct alias` |
| `alignment` | Direct alias: `alignment`<br>Structured path: `sheet->about->characteristics->alignment` | `STORED` | Alignment string. Writable, but the controlled sources did not establish a closed enum; use a value the sheet accepts. | `alignment` reads a finite value stored at the structured ScriptCards location shown in the location column. | `Direct alias` |
| `experience` | Direct alias: `experience`<br>Structured path: `sheet->classLevel->currentExp` | `STORED` | Finite current-XP number. Normally non-negative; exact hard range was not independently probed. | `experience` reads a finite value stored at the structured ScriptCards location shown in the location column. | `Direct alias` |
| `eyes` | Direct alias: `eyes` | `STORED` | Writable free text/string. No stable structured backing path or closed enum was established in the controlled probes. | `eyes` is a writable direct alias for the character’s eye description. The current probes did not identify a stable structured `sheet` location. | `Direct alias` |
| `faith` | Direct alias: `faith` | `STORED` | Writable free text/string. No stable structured backing path or closed enum was established in the controlled probes. | `faith` is documented by Roll20 as a writable D&D 2024 public property. It was not individually exercised in the controlled write probe, and no stable structured `sheet` backing path was established. | `Direct alias` — Roll20-documented writable property; not individually exercised in the controlled write probe. |
| `gender` | Direct alias: `gender` | `STORED` | Writable free text/string. No stable structured backing path or closed enum was established in the controlled probes. | `gender` is documented by Roll20 as a writable D&D 2024 public property. It was not individually exercised in the controlled write probe, and no stable structured `sheet` backing path was established. | `Direct alias` — Roll20-documented writable property; not individually exercised in the controlled write probe. |
| `hair` | Direct alias: `hair` | `STORED` | Writable free text/string. No stable structured backing path or closed enum was established in the controlled probes. | `hair` is a writable direct alias for the character’s hair description. The current probes did not identify a stable structured `sheet` location. | `Direct alias` |
| `height` | Direct alias: `height` | `STORED` | Writable free text/string. No stable structured backing path or closed enum was established in the controlled probes. | `height` is a writable direct alias for the character’s height. The current probes did not identify a stable structured `sheet` location. | `Direct alias` |
| `size` | Direct alias: `size`<br>Structured path: `sheet->about->characteristics->size` | `STORED` | Observed/recognized values: `Medium`, `Small`. Complete sheet enum not independently proven. Other sheet-supported sizes may exist. | `size` reads a finite value stored at the structured ScriptCards location shown in the location column. | `Direct alias` |
| `skin` | Direct alias: `skin` | `STORED` | Writable free text/string. No stable structured backing path or closed enum was established in the controlled probes. | `skin` is a writable direct alias for the character’s skin description. The current probes did not identify a stable structured `sheet` location. | `Direct alias` |
| `weight` | Direct alias: `weight` | `STORED` | Writable sheet-native value; commonly numeric/text depending on sheet UI. No stable structured backing path or closed enum was established in the controlled probes. | `weight` is a writable direct alias for the character’s weight. The current probes did not identify a stable structured `sheet` location. | `Direct alias` |

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

| Direct alias | ScriptCards read location | Value role | Values / writable domain | Description | Write using |
|---|---|---|---|---|---|
| `cp` | Direct alias: `cp`<br>Typed collection: `currencies` | `STORED` | Finite currency amount. Normally non-negative; exact hard validation/range was not independently probed. | `cp` is the finite amount stored by the matching Currency record. | `Direct alias` |
| `cust_classname` | Direct alias: `cust_classname`<br>Typed collections: `classes`, `classlevels`<br>Match: the intended custom Class and its Class Level record | `STORED` | String/formatted compatibility result. To change the value, use the backing location named in **Write using**; its accepted values are documented in the corresponding structured/typed leaf table. | `cust_classname` comes from the typed collection records identified in the location column. | `Typed collection` |
| `custom_class` | Direct alias: `custom_class`<br>Typed collections: `classes`, `classlevels`<br>Match: the intended custom Class and its Class Level record | `STORED` | Compatibility/synthetic result; exact output representation was not independently normalized for this alias. To change the value, use the backing location named in **Write using**; its accepted values are documented in the corresponding structured/typed leaf table. | `custom_class` comes from the typed collection records identified in the location column. | `Typed collection` |
| `dtype` | Direct alias: `dtype`<br>Structured path: `sheet->settings->rollDamageAutomatic` | `STORED` | `true` = roll damage automatically with the attack; `false` = separate damage behavior. This is a compatibility view of the boolean `rollDamageAutomatic` setting, not the old 2014 dtype system. | `dtype` reads a finite value stored at the structured ScriptCards location shown in the location column. | `Structured path` — Compatibility view of `rollDamageAutomatic`; do not treat it as the 2014 sheet’s independent damage-mode field. |
| `encumberance_setting` | Direct alias: `encumberance_setting`<br>Structured path: `sheet->settings->encumbranceType` | `STORED` | Encumbrance-mode string. Exact stored literal enum was not independently captured; read current value before changing. | `encumberance_setting` reads a finite value stored at the structured ScriptCards location shown in the location column. | `Structured path` |
| `ep` | Direct alias: `ep`<br>Typed collection: `currencies` | `STORED` | Finite currency amount. Normally non-negative; exact hard validation/range was not independently probed. | `ep` is the finite amount stored by the matching Currency record. | `Direct alias` |
| `gp` | Direct alias: `gp`<br>Typed collection: `currencies` | `STORED` | Finite currency amount. Normally non-negative; exact hard validation/range was not independently probed. | `gp` is the finite amount stored by the matching Currency record. | `Direct alias` |
| `inspiration` | Direct alias: `inspiration`<br>Structured path: `sheet->inspiration->isInspired` | `STORED` | `true`/`1` = inspired; `false`/`0` = not inspired. Backing state is boolean `sheet->inspiration->isInspired`. | `inspiration` reads a finite value stored at the structured ScriptCards location shown in the location column. | `Direct alias` |
| `pp` | Direct alias: `pp`<br>Typed collection: `currencies` | `STORED` | Finite currency amount. Normally non-negative; exact hard validation/range was not independently probed. | `pp` is the finite amount stored by the matching Currency record. | `Direct alias` |
| `sp` | Direct alias: `sp`<br>Typed collection: `currencies` | `STORED` | Finite currency amount. Normally non-negative; exact hard validation/range was not independently probed. | `sp` is the finite amount stored by the matching Currency record. | `Direct alias` |
| `subrace` | Direct alias: `subrace`<br>Typed collection: `species`<br>Match: the character’s Species record | `STORED` | Compatibility/synthetic result; exact output representation was not independently normalized for this alias. To change the value, use the backing location named in **Write using**; its accepted values are documented in the corresponding structured/typed leaf table. | `subrace` comes from the typed collection records identified in the location column. | `Typed collection` |

#### Legacy compatibility and roll output

> **Value roles**
>
> - `STORED` — A finite value or state stored by the sheet.
> - `UNKNOWN` — The character-level direct alias is not exposed by the verified Beacon build.
>
> **Write using**
>
> - `Typed collection` — Locate the matching existing record through the location labeled `Typed collection:` or `Typed collections:` in the row. When the row names a field, write that field; otherwise use the corresponding typed-collection table below to choose the existing primitive field that represents the intended change.

| Direct alias | ScriptCards read location | Value role | Values / writable domain | Description | Write using |
|---|---|---|---|---|---|
| `cust_hitdietype` | Direct alias: `cust_hitdietype`<br>Typed collection: `hitdices`<br>Match: the intended class-specific Hit Dice record | `STORED` | String/formatted compatibility result. To change the value, use the backing location named in **Write using**; its accepted values are documented in the corresponding structured/typed leaf table. | `cust_hitdietype` comes from the typed collection records identified in the location column. | `Typed collection` |
| `cust_spellcasting_ability` | Character-level direct alias: not exposed in the verified Beacon build<br>Verified fallback result: missing `user.cust_spellcasting_ability` Custom Attribute<br>Use instead: `spellcastings->[selector]->ability` | `UNKNOWN` | Unknown/unmapped value domain. Do not write; the current controlled sources did not establish a reliable Beacon source or value format. | A bare `cust_spellcasting_ability` read falls through to the classic custom-attribute fallback and produces a missing Custom Attribute error. The official Beacon selector changes the selected Spellcasting record's `ability`. | `Typed collection` — Locate the intended Spellcasting record and write `spellcastings->[selector]->ability`. |
| `cust_spellslots` | Direct alias: `cust_spellslots`<br>Typed collection: `spellslots`<br>Match: the intended spell level and `_slotType` | `STORED` | Compatibility/synthetic result; exact output representation was not independently normalized for this alias. To change the value, use the backing location named in **Write using**; its accepted values are documented in the corresponding structured/typed leaf table. | `cust_spellslots` comes from the typed collection records identified in the location column. | `Typed collection` |

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

| Direct alias | ScriptCards read location | Value role | Values / writable domain | Description | Write using |
|---|---|---|---|---|---|
| `charisma_mod` | Direct alias: `charisma_mod`<br>Source input: `charisma` | `COMPUTED` | Numeric compatibility/computed result. To change the value, use the backing location named in **Write using**; its accepted values are documented in the corresponding structured/typed leaf table. | Calculated from the Charisma score. | `Source input`: `charisma` |
| `charisma_save_bonus` | Direct alias: `charisma_save_bonus`<br>Source inputs: `charisma`; `proficiencies->Charisma->proficiencyLevel` for the Charisma Saving Throw record; `classlevels->[selector]->totalLevel`; applicable `rollbonuses` or `modifiers` records | `COMPUTED` | Numeric compatibility/computed result. To change the value, use the backing location named in **Write using**; its accepted values are documented in the corresponding structured/typed leaf table. | Calculated from the Charisma modifier, Saving Throw proficiency, proficiency bonus, and applicable bonuses. | `Source inputs`: `charisma`; `proficiencies->Charisma->proficiencyLevel`; `classlevels->[selector]->totalLevel`; applicable `rollbonuses` or `modifiers` records |
| `charisma_save_mod` | Direct alias: `charisma_save_mod`<br>Source inputs: `charisma`; `proficiencies->Charisma->proficiencyLevel` for the Charisma Saving Throw record; `classlevels->[selector]->totalLevel`; applicable `rollbonuses` or `modifiers` records | `COMPUTED` | Numeric compatibility/computed result. To change the value, use the backing location named in **Write using**; its accepted values are documented in the corresponding structured/typed leaf table. | Calculated from the Charisma modifier, Saving Throw proficiency, proficiency bonus, and applicable bonuses. | `Source inputs`: `charisma`; `proficiencies->Charisma->proficiencyLevel`; `classlevels->[selector]->totalLevel`; applicable `rollbonuses` or `modifiers` records |
| `constitution_mod` | Direct alias: `constitution_mod`<br>Source input: `constitution` | `COMPUTED` | Numeric compatibility/computed result. To change the value, use the backing location named in **Write using**; its accepted values are documented in the corresponding structured/typed leaf table. | Calculated from the Constitution score. | `Source input`: `constitution` |
| `constitution_save_bonus` | Direct alias: `constitution_save_bonus`<br>Source inputs: `constitution`; `proficiencies->Constitution->proficiencyLevel` for the Constitution Saving Throw record; `classlevels->[selector]->totalLevel`; applicable `rollbonuses` or `modifiers` records | `COMPUTED` | Numeric compatibility/computed result. To change the value, use the backing location named in **Write using**; its accepted values are documented in the corresponding structured/typed leaf table. | Calculated from the Constitution modifier, Saving Throw proficiency, proficiency bonus, and applicable bonuses. | `Source inputs`: `constitution`; `proficiencies->Constitution->proficiencyLevel`; `classlevels->[selector]->totalLevel`; applicable `rollbonuses` or `modifiers` records |
| `constitution_save_mod` | Direct alias: `constitution_save_mod`<br>Source inputs: `constitution`; `proficiencies->Constitution->proficiencyLevel` for the Constitution Saving Throw record; `classlevels->[selector]->totalLevel`; applicable `rollbonuses` or `modifiers` records | `COMPUTED` | Numeric compatibility/computed result. To change the value, use the backing location named in **Write using**; its accepted values are documented in the corresponding structured/typed leaf table. | Calculated from the Constitution modifier, Saving Throw proficiency, proficiency bonus, and applicable bonuses. | `Source inputs`: `constitution`; `proficiencies->Constitution->proficiencyLevel`; `classlevels->[selector]->totalLevel`; applicable `rollbonuses` or `modifiers` records |
| `death_save_bonus` | Direct alias: `death_save_bonus`<br>Source inputs: applicable `rollbonuses` or `modifiers` records for death saves<br>State-only structured path: `sheet->hitpoints->deathSaves` stores successes and failures, not the numeric bonus | `COMPUTED` | Numeric compatibility/computed result. To change the value, use the backing location named in **Write using**; its accepted values are documented in the corresponding structured/typed leaf table. | Calculated from bonuses that apply to death-saving throws. The death-save state container stores marks only. | `Source inputs`: applicable `rollbonuses->[selector]` or `modifiers->[selector]` fields |
| `death_save_mod` | Direct alias: `death_save_mod`<br>Source inputs: applicable `rollbonuses` or `modifiers` records for death saves<br>State-only structured path: `sheet->hitpoints->deathSaves` stores successes and failures, not the numeric bonus | `COMPUTED` | Numeric compatibility/computed result. To change the value, use the backing location named in **Write using**; its accepted values are documented in the corresponding structured/typed leaf table. | Calculated from bonuses that apply to death-saving throws. The death-save state container stores marks only. | `Source inputs`: applicable `rollbonuses->[selector]` or `modifiers->[selector]` fields |
| `dexterity_mod` | Direct alias: `dexterity_mod`<br>Source input: `dexterity` | `COMPUTED` | Numeric compatibility/computed result. To change the value, use the backing location named in **Write using**; its accepted values are documented in the corresponding structured/typed leaf table. | Calculated from the Dexterity score. | `Source input`: `dexterity` |
| `dexterity_save_bonus` | Direct alias: `dexterity_save_bonus`<br>Source inputs: `dexterity`; `proficiencies->Dexterity->proficiencyLevel` for the Dexterity Saving Throw record; `classlevels->[selector]->totalLevel`; applicable `rollbonuses` or `modifiers` records | `COMPUTED` | Numeric compatibility/computed result. To change the value, use the backing location named in **Write using**; its accepted values are documented in the corresponding structured/typed leaf table. | Calculated from the Dexterity modifier, Saving Throw proficiency, proficiency bonus, and applicable bonuses. | `Source inputs`: `dexterity`; `proficiencies->Dexterity->proficiencyLevel`; `classlevels->[selector]->totalLevel`; applicable `rollbonuses` or `modifiers` records |
| `dexterity_save_mod` | Direct alias: `dexterity_save_mod`<br>Source inputs: `dexterity`; `proficiencies->Dexterity->proficiencyLevel` for the Dexterity Saving Throw record; `classlevels->[selector]->totalLevel`; applicable `rollbonuses` or `modifiers` records | `COMPUTED` | Numeric compatibility/computed result. To change the value, use the backing location named in **Write using**; its accepted values are documented in the corresponding structured/typed leaf table. | Calculated from the Dexterity modifier, Saving Throw proficiency, proficiency bonus, and applicable bonuses. | `Source inputs`: `dexterity`; `proficiencies->Dexterity->proficiencyLevel`; `classlevels->[selector]->totalLevel`; applicable `rollbonuses` or `modifiers` records |
| `intelligence_mod` | Direct alias: `intelligence_mod`<br>Source input: `intelligence` | `COMPUTED` | Numeric compatibility/computed result. To change the value, use the backing location named in **Write using**; its accepted values are documented in the corresponding structured/typed leaf table. | Calculated from the Intelligence score. | `Source input`: `intelligence` |
| `intelligence_save_bonus` | Direct alias: `intelligence_save_bonus`<br>Source inputs: `intelligence`; `proficiencies->Intelligence->proficiencyLevel` for the Intelligence Saving Throw record; `classlevels->[selector]->totalLevel`; applicable `rollbonuses` or `modifiers` records | `COMPUTED` | Numeric compatibility/computed result. To change the value, use the backing location named in **Write using**; its accepted values are documented in the corresponding structured/typed leaf table. | Calculated from the Intelligence modifier, Saving Throw proficiency, proficiency bonus, and applicable bonuses. | `Source inputs`: `intelligence`; `proficiencies->Intelligence->proficiencyLevel`; `classlevels->[selector]->totalLevel`; applicable `rollbonuses` or `modifiers` records |
| `intelligence_save_mod` | Direct alias: `intelligence_save_mod`<br>Source inputs: `intelligence`; `proficiencies->Intelligence->proficiencyLevel` for the Intelligence Saving Throw record; `classlevels->[selector]->totalLevel`; applicable `rollbonuses` or `modifiers` records | `COMPUTED` | Numeric compatibility/computed result. To change the value, use the backing location named in **Write using**; its accepted values are documented in the corresponding structured/typed leaf table. | Calculated from the Intelligence modifier, Saving Throw proficiency, proficiency bonus, and applicable bonuses. | `Source inputs`: `intelligence`; `proficiencies->Intelligence->proficiencyLevel`; `classlevels->[selector]->totalLevel`; applicable `rollbonuses` or `modifiers` records |
| `strength_mod` | Direct alias: `strength_mod`<br>Source input: `strength` | `COMPUTED` | Numeric compatibility/computed result. To change the value, use the backing location named in **Write using**; its accepted values are documented in the corresponding structured/typed leaf table. | Calculated from the Strength score. | `Source input`: `strength` |
| `strength_save_bonus` | Direct alias: `strength_save_bonus`<br>Source inputs: `strength`; `proficiencies->Strength->proficiencyLevel` for the Strength Saving Throw record; `classlevels->[selector]->totalLevel`; applicable `rollbonuses` or `modifiers` records | `COMPUTED` | Numeric compatibility/computed result. To change the value, use the backing location named in **Write using**; its accepted values are documented in the corresponding structured/typed leaf table. | Calculated from the Strength modifier, Saving Throw proficiency, proficiency bonus, and applicable bonuses. | `Source inputs`: `strength`; `proficiencies->Strength->proficiencyLevel`; `classlevels->[selector]->totalLevel`; applicable `rollbonuses` or `modifiers` records |
| `strength_save_mod` | Direct alias: `strength_save_mod`<br>Source inputs: `strength`; `proficiencies->Strength->proficiencyLevel` for the Strength Saving Throw record; `classlevels->[selector]->totalLevel`; applicable `rollbonuses` or `modifiers` records | `COMPUTED` | Numeric compatibility/computed result. To change the value, use the backing location named in **Write using**; its accepted values are documented in the corresponding structured/typed leaf table. | Calculated from the Strength modifier, Saving Throw proficiency, proficiency bonus, and applicable bonuses. | `Source inputs`: `strength`; `proficiencies->Strength->proficiencyLevel`; `classlevels->[selector]->totalLevel`; applicable `rollbonuses` or `modifiers` records |
| `wisdom_mod` | Direct alias: `wisdom_mod`<br>Source input: `wisdom` | `COMPUTED` | Numeric compatibility/computed result. To change the value, use the backing location named in **Write using**; its accepted values are documented in the corresponding structured/typed leaf table. | Calculated from the Wisdom score. | `Source input`: `wisdom` |
| `wisdom_save_bonus` | Direct alias: `wisdom_save_bonus`<br>Source inputs: `wisdom`; `proficiencies->Wisdom->proficiencyLevel` for the Wisdom Saving Throw record; `classlevels->[selector]->totalLevel`; applicable `rollbonuses` or `modifiers` records | `COMPUTED` | Numeric compatibility/computed result. To change the value, use the backing location named in **Write using**; its accepted values are documented in the corresponding structured/typed leaf table. | Calculated from the Wisdom modifier, Saving Throw proficiency, proficiency bonus, and applicable bonuses. | `Source inputs`: `wisdom`; `proficiencies->Wisdom->proficiencyLevel`; `classlevels->[selector]->totalLevel`; applicable `rollbonuses` or `modifiers` records |
| `wisdom_save_mod` | Direct alias: `wisdom_save_mod`<br>Source inputs: `wisdom`; `proficiencies->Wisdom->proficiencyLevel` for the Wisdom Saving Throw record; `classlevels->[selector]->totalLevel`; applicable `rollbonuses` or `modifiers` records | `COMPUTED` | Numeric compatibility/computed result. To change the value, use the backing location named in **Write using**; its accepted values are documented in the corresponding structured/typed leaf table. | Calculated from the Wisdom modifier, Saving Throw proficiency, proficiency bonus, and applicable bonuses. | `Source inputs`: `wisdom`; `proficiencies->Wisdom->proficiencyLevel`; `classlevels->[selector]->totalLevel`; applicable `rollbonuses` or `modifiers` records |

#### Skills and passive checks

> **Value roles**
>
> - `COMPUTED` — A calculated or aggregated result. Change the named source inputs rather than writing the result.
>
> **Write using**
>
> - `Source inputs` — Change the exact locations labeled `Source inputs:` in the row.

| Direct alias | ScriptCards read location | Value role | Values / writable domain | Description | Write using |
|---|---|---|---|---|---|
| `acrobatics_bonus` | Direct alias: `acrobatics_bonus`<br>Source inputs: `skills->Acrobatics->ability`; the matching ability-score direct alias; `proficiencies->Acrobatics->proficiencyLevel`; `classlevels->[selector]->totalLevel`; applicable `rollbonuses` or `modifiers` records | `COMPUTED` | Numeric compatibility/computed result. To change the value, use the backing location named in **Write using**; its accepted values are documented in the corresponding structured/typed leaf table. | Calculated from the ability assigned to Acrobatics, that ability score, Acrobatics proficiency, proficiency bonus, and applicable bonuses. | `Source inputs`: `skills->Acrobatics->ability`; matching ability-score direct alias; `proficiencies->Acrobatics->proficiencyLevel`; `classlevels->[selector]->totalLevel`; applicable `rollbonuses` or `modifiers` records |
| `acrobatics_flat` | Direct alias: `acrobatics_flat`<br>Source inputs: `skills->Acrobatics->ability`; the matching ability-score direct alias; `proficiencies->Acrobatics->proficiencyLevel`; `classlevels->[selector]->totalLevel`; applicable `rollbonuses` or `modifiers` records | `COMPUTED` | Numeric compatibility/computed result. To change the value, use the backing location named in **Write using**; its accepted values are documented in the corresponding structured/typed leaf table. | Calculated from the ability assigned to Acrobatics, that ability score, Acrobatics proficiency, proficiency bonus, and applicable bonuses. | `Source inputs`: `skills->Acrobatics->ability`; matching ability-score direct alias; `proficiencies->Acrobatics->proficiencyLevel`; `classlevels->[selector]->totalLevel`; applicable `rollbonuses` or `modifiers` records |
| `animal_handling_flat` | Direct alias: `animal_handling_flat`<br>Source inputs: `skills->Animal Handling->ability`; the matching ability-score direct alias; `proficiencies->Animal Handling->proficiencyLevel`; `classlevels->[selector]->totalLevel`; applicable `rollbonuses` or `modifiers` records | `COMPUTED` | Numeric compatibility/computed result. To change the value, use the backing location named in **Write using**; its accepted values are documented in the corresponding structured/typed leaf table. | Calculated from the ability assigned to Animal Handling, that ability score, Animal Handling proficiency, proficiency bonus, and applicable bonuses. | `Source inputs`: `skills->Animal Handling->ability`; matching ability-score direct alias; `proficiencies->Animal Handling->proficiencyLevel`; `classlevels->[selector]->totalLevel`; applicable `rollbonuses` or `modifiers` records |
| `arcana_flat` | Direct alias: `arcana_flat`<br>Source inputs: `skills->Arcana->ability`; the matching ability-score direct alias; `proficiencies->Arcana->proficiencyLevel`; `classlevels->[selector]->totalLevel`; applicable `rollbonuses` or `modifiers` records | `COMPUTED` | Numeric compatibility/computed result. To change the value, use the backing location named in **Write using**; its accepted values are documented in the corresponding structured/typed leaf table. | Calculated from the ability assigned to Arcana, that ability score, Arcana proficiency, proficiency bonus, and applicable bonuses. | `Source inputs`: `skills->Arcana->ability`; matching ability-score direct alias; `proficiencies->Arcana->proficiencyLevel`; `classlevels->[selector]->totalLevel`; applicable `rollbonuses` or `modifiers` records |
| `athletics_flat` | Direct alias: `athletics_flat`<br>Source inputs: `skills->Athletics->ability`; the matching ability-score direct alias; `proficiencies->Athletics->proficiencyLevel`; `classlevels->[selector]->totalLevel`; applicable `rollbonuses` or `modifiers` records | `COMPUTED` | Numeric compatibility/computed result. To change the value, use the backing location named in **Write using**; its accepted values are documented in the corresponding structured/typed leaf table. | Calculated from the ability assigned to Athletics, that ability score, Athletics proficiency, proficiency bonus, and applicable bonuses. | `Source inputs`: `skills->Athletics->ability`; matching ability-score direct alias; `proficiencies->Athletics->proficiencyLevel`; `classlevels->[selector]->totalLevel`; applicable `rollbonuses` or `modifiers` records |
| `deception_flat` | Direct alias: `deception_flat`<br>Source inputs: `skills->Deception->ability`; the matching ability-score direct alias; `proficiencies->Deception->proficiencyLevel`; `classlevels->[selector]->totalLevel`; applicable `rollbonuses` or `modifiers` records | `COMPUTED` | Numeric compatibility/computed result. To change the value, use the backing location named in **Write using**; its accepted values are documented in the corresponding structured/typed leaf table. | Calculated from the ability assigned to Deception, that ability score, Deception proficiency, proficiency bonus, and applicable bonuses. | `Source inputs`: `skills->Deception->ability`; matching ability-score direct alias; `proficiencies->Deception->proficiencyLevel`; `classlevels->[selector]->totalLevel`; applicable `rollbonuses` or `modifiers` records |
| `history_flat` | Direct alias: `history_flat`<br>Source inputs: `skills->History->ability`; the matching ability-score direct alias; `proficiencies->History->proficiencyLevel`; `classlevels->[selector]->totalLevel`; applicable `rollbonuses` or `modifiers` records | `COMPUTED` | Numeric compatibility/computed result. To change the value, use the backing location named in **Write using**; its accepted values are documented in the corresponding structured/typed leaf table. | Calculated from the ability assigned to History, that ability score, History proficiency, proficiency bonus, and applicable bonuses. | `Source inputs`: `skills->History->ability`; matching ability-score direct alias; `proficiencies->History->proficiencyLevel`; `classlevels->[selector]->totalLevel`; applicable `rollbonuses` or `modifiers` records |
| `insight_flat` | Direct alias: `insight_flat`<br>Source inputs: `skills->Insight->ability`; the matching ability-score direct alias; `proficiencies->Insight->proficiencyLevel`; `classlevels->[selector]->totalLevel`; applicable `rollbonuses` or `modifiers` records | `COMPUTED` | Numeric compatibility/computed result. To change the value, use the backing location named in **Write using**; its accepted values are documented in the corresponding structured/typed leaf table. | Calculated from the ability assigned to Insight, that ability score, Insight proficiency, proficiency bonus, and applicable bonuses. | `Source inputs`: `skills->Insight->ability`; matching ability-score direct alias; `proficiencies->Insight->proficiencyLevel`; `classlevels->[selector]->totalLevel`; applicable `rollbonuses` or `modifiers` records |
| `intimidation_flat` | Direct alias: `intimidation_flat`<br>Source inputs: `skills->Intimidation->ability`; the matching ability-score direct alias; `proficiencies->Intimidation->proficiencyLevel`; `classlevels->[selector]->totalLevel`; applicable `rollbonuses` or `modifiers` records | `COMPUTED` | Numeric compatibility/computed result. To change the value, use the backing location named in **Write using**; its accepted values are documented in the corresponding structured/typed leaf table. | Calculated from the ability assigned to Intimidation, that ability score, Intimidation proficiency, proficiency bonus, and applicable bonuses. | `Source inputs`: `skills->Intimidation->ability`; matching ability-score direct alias; `proficiencies->Intimidation->proficiencyLevel`; `classlevels->[selector]->totalLevel`; applicable `rollbonuses` or `modifiers` records |
| `investigation_flat` | Direct alias: `investigation_flat`<br>Source inputs: `skills->Investigation->ability`; the matching ability-score direct alias; `proficiencies->Investigation->proficiencyLevel`; `classlevels->[selector]->totalLevel`; applicable `rollbonuses` or `modifiers` records | `COMPUTED` | Numeric compatibility/computed result. To change the value, use the backing location named in **Write using**; its accepted values are documented in the corresponding structured/typed leaf table. | Calculated from the ability assigned to Investigation, that ability score, Investigation proficiency, proficiency bonus, and applicable bonuses. | `Source inputs`: `skills->Investigation->ability`; matching ability-score direct alias; `proficiencies->Investigation->proficiencyLevel`; `classlevels->[selector]->totalLevel`; applicable `rollbonuses` or `modifiers` records |
| `medicine_flat` | Direct alias: `medicine_flat`<br>Source inputs: `skills->Medicine->ability`; the matching ability-score direct alias; `proficiencies->Medicine->proficiencyLevel`; `classlevels->[selector]->totalLevel`; applicable `rollbonuses` or `modifiers` records | `COMPUTED` | Numeric compatibility/computed result. To change the value, use the backing location named in **Write using**; its accepted values are documented in the corresponding structured/typed leaf table. | Calculated from the ability assigned to Medicine, that ability score, Medicine proficiency, proficiency bonus, and applicable bonuses. | `Source inputs`: `skills->Medicine->ability`; matching ability-score direct alias; `proficiencies->Medicine->proficiencyLevel`; `classlevels->[selector]->totalLevel`; applicable `rollbonuses` or `modifiers` records |
| `nature_flat` | Direct alias: `nature_flat`<br>Source inputs: `skills->Nature->ability`; the matching ability-score direct alias; `proficiencies->Nature->proficiencyLevel`; `classlevels->[selector]->totalLevel`; applicable `rollbonuses` or `modifiers` records | `COMPUTED` | Numeric compatibility/computed result. To change the value, use the backing location named in **Write using**; its accepted values are documented in the corresponding structured/typed leaf table. | Calculated from the ability assigned to Nature, that ability score, Nature proficiency, proficiency bonus, and applicable bonuses. | `Source inputs`: `skills->Nature->ability`; matching ability-score direct alias; `proficiencies->Nature->proficiencyLevel`; `classlevels->[selector]->totalLevel`; applicable `rollbonuses` or `modifiers` records |
| `passive_wisdom` | Direct alias: `passive_wisdom`<br>Source inputs: `skills->Perception->ability`; the matching ability-score direct alias; `proficiencies->Perception->proficiencyLevel`; `classlevels->[selector]->totalLevel`; applicable `rollbonuses` or `modifiers` records | `COMPUTED` | Compatibility/synthetic result; exact output representation was not independently normalized for this alias. To change the value, use the backing location named in **Write using**; its accepted values are documented in the corresponding structured/typed leaf table. | Calculated as 10 plus the final Perception total. | `Source inputs`: `skills->Perception->ability`; matching ability-score direct alias; `proficiencies->Perception->proficiencyLevel`; `classlevels->[selector]->totalLevel`; applicable `rollbonuses` or `modifiers` records |
| `passiveperceptionmod` | Direct alias: `passiveperceptionmod`<br>Source inputs: `skills->Perception->ability`; the matching ability-score direct alias; `proficiencies->Perception->proficiencyLevel`; `classlevels->[selector]->totalLevel`; applicable `rollbonuses` or `modifiers` records | `COMPUTED` | Numeric compatibility/computed result. To change the value, use the backing location named in **Write using**; its accepted values are documented in the corresponding structured/typed leaf table. | Calculated as 10 plus the final Perception total. | `Source inputs`: `skills->Perception->ability`; matching ability-score direct alias; `proficiencies->Perception->proficiencyLevel`; `classlevels->[selector]->totalLevel`; applicable `rollbonuses` or `modifiers` records |
| `perception_flat` | Direct alias: `perception_flat`<br>Source inputs: `skills->Perception->ability`; the matching ability-score direct alias; `proficiencies->Perception->proficiencyLevel`; `classlevels->[selector]->totalLevel`; applicable `rollbonuses` or `modifiers` records | `COMPUTED` | Numeric compatibility/computed result. To change the value, use the backing location named in **Write using**; its accepted values are documented in the corresponding structured/typed leaf table. | Calculated from the ability assigned to Perception, that ability score, Perception proficiency, proficiency bonus, and applicable bonuses. | `Source inputs`: `skills->Perception->ability`; matching ability-score direct alias; `proficiencies->Perception->proficiencyLevel`; `classlevels->[selector]->totalLevel`; applicable `rollbonuses` or `modifiers` records |
| `performance_flat` | Direct alias: `performance_flat`<br>Source inputs: `skills->Performance->ability`; the matching ability-score direct alias; `proficiencies->Performance->proficiencyLevel`; `classlevels->[selector]->totalLevel`; applicable `rollbonuses` or `modifiers` records | `COMPUTED` | Numeric compatibility/computed result. To change the value, use the backing location named in **Write using**; its accepted values are documented in the corresponding structured/typed leaf table. | Calculated from the ability assigned to Performance, that ability score, Performance proficiency, proficiency bonus, and applicable bonuses. | `Source inputs`: `skills->Performance->ability`; matching ability-score direct alias; `proficiencies->Performance->proficiencyLevel`; `classlevels->[selector]->totalLevel`; applicable `rollbonuses` or `modifiers` records |
| `persuasion_flat` | Direct alias: `persuasion_flat`<br>Source inputs: `skills->Persuasion->ability`; the matching ability-score direct alias; `proficiencies->Persuasion->proficiencyLevel`; `classlevels->[selector]->totalLevel`; applicable `rollbonuses` or `modifiers` records | `COMPUTED` | Numeric compatibility/computed result. To change the value, use the backing location named in **Write using**; its accepted values are documented in the corresponding structured/typed leaf table. | Calculated from the ability assigned to Persuasion, that ability score, Persuasion proficiency, proficiency bonus, and applicable bonuses. | `Source inputs`: `skills->Persuasion->ability`; matching ability-score direct alias; `proficiencies->Persuasion->proficiencyLevel`; `classlevels->[selector]->totalLevel`; applicable `rollbonuses` or `modifiers` records |
| `religion_flat` | Direct alias: `religion_flat`<br>Source inputs: `skills->Religion->ability`; the matching ability-score direct alias; `proficiencies->Religion->proficiencyLevel`; `classlevels->[selector]->totalLevel`; applicable `rollbonuses` or `modifiers` records | `COMPUTED` | Numeric compatibility/computed result. To change the value, use the backing location named in **Write using**; its accepted values are documented in the corresponding structured/typed leaf table. | Calculated from the ability assigned to Religion, that ability score, Religion proficiency, proficiency bonus, and applicable bonuses. | `Source inputs`: `skills->Religion->ability`; matching ability-score direct alias; `proficiencies->Religion->proficiencyLevel`; `classlevels->[selector]->totalLevel`; applicable `rollbonuses` or `modifiers` records |
| `sleight_of_hand_flat` | Direct alias: `sleight_of_hand_flat`<br>Source inputs: `skills->Sleight of Hand->ability`; the matching ability-score direct alias; `proficiencies->Sleight of Hand->proficiencyLevel`; `classlevels->[selector]->totalLevel`; applicable `rollbonuses` or `modifiers` records | `COMPUTED` | Numeric compatibility/computed result. To change the value, use the backing location named in **Write using**; its accepted values are documented in the corresponding structured/typed leaf table. | Calculated from the ability assigned to Sleight of Hand, that ability score, Sleight of Hand proficiency, proficiency bonus, and applicable bonuses. | `Source inputs`: `skills->Sleight of Hand->ability`; matching ability-score direct alias; `proficiencies->Sleight of Hand->proficiencyLevel`; `classlevels->[selector]->totalLevel`; applicable `rollbonuses` or `modifiers` records |
| `stealth_flat` | Direct alias: `stealth_flat`<br>Source inputs: `skills->Stealth->ability`; the matching ability-score direct alias; `proficiencies->Stealth->proficiencyLevel`; `classlevels->[selector]->totalLevel`; applicable `rollbonuses` or `modifiers` records | `COMPUTED` | Numeric compatibility/computed result. To change the value, use the backing location named in **Write using**; its accepted values are documented in the corresponding structured/typed leaf table. | Calculated from the ability assigned to Stealth, that ability score, Stealth proficiency, proficiency bonus, and applicable bonuses. | `Source inputs`: `skills->Stealth->ability`; matching ability-score direct alias; `proficiencies->Stealth->proficiencyLevel`; `classlevels->[selector]->totalLevel`; applicable `rollbonuses` or `modifiers` records |
| `survival_flat` | Direct alias: `survival_flat`<br>Source inputs: `skills->Survival->ability`; the matching ability-score direct alias; `proficiencies->Survival->proficiencyLevel`; `classlevels->[selector]->totalLevel`; applicable `rollbonuses` or `modifiers` records | `COMPUTED` | Numeric compatibility/computed result. To change the value, use the backing location named in **Write using**; its accepted values are documented in the corresponding structured/typed leaf table. | Calculated from the ability assigned to Survival, that ability score, Survival proficiency, proficiency bonus, and applicable bonuses. | `Source inputs`: `skills->Survival->ability`; matching ability-score direct alias; `proficiencies->Survival->proficiencyLevel`; `classlevels->[selector]->totalLevel`; applicable `rollbonuses` or `modifiers` records |

#### Combat statistics

> **Value roles**
>
> - `COMPUTED` — A calculated or aggregated result. Change the named source inputs rather than writing the result.
>
> **Write using**
>
> - `Source inputs` — Change the exact locations labeled `Source inputs:` in the row.

| Direct alias | ScriptCards read location | Value role | Values / writable domain | Description | Write using |
|---|---|---|---|---|---|
| `initiative_bonus` | Direct alias: `initiative_bonus`<br>Source inputs: `dexterity`; applicable initiative `rollbonuses` or `modifiers` records | `COMPUTED` | Numeric compatibility/computed result. To change the value, use the backing location named in **Write using**; its accepted values are documented in the corresponding structured/typed leaf table. | Calculated from the Dexterity modifier and bonuses that apply to Initiative. `init_tiebreaker` changes tie handling, not this number. | `Source inputs`: `dexterity`; applicable initiative `rollbonuses->[selector]` or `modifiers->[selector]` fields |
| `initmod` | Direct alias: `initmod`<br>Source inputs: `dexterity`; applicable initiative `rollbonuses` or `modifiers` records | `COMPUTED` | Numeric compatibility/computed result. To change the value, use the backing location named in **Write using**; its accepted values are documented in the corresponding structured/typed leaf table. | Calculated from the Dexterity modifier and bonuses that apply to Initiative. `init_tiebreaker` changes tie handling, not this number. | `Source inputs`: `dexterity`; applicable initiative `rollbonuses->[selector]` or `modifiers->[selector]` fields |

#### Shared character values

> **Value roles**
>
> - `COMPUTED` — A calculated or aggregated result. Change the named source input rather than writing the result.
>
> **Write using**
>
> - `Source input` — Change the exact location labeled `Source input:` in the row.

| Direct alias | ScriptCards read location | Value role | Values / writable domain | Description | Write using |
|---|---|---|---|---|---|
| `base_level` | Direct alias: `base_level`<br>Source input: `classlevels->[selector]->totalLevel` | `COMPUTED` | Numeric compatibility/computed result. To change the value, use the backing location named in **Write using**; its accepted values are documented in the corresponding structured/typed leaf table. | Compatibility projection of the applicable total level from the Class Level records. | `Source input`: `classlevels->[selector]->totalLevel` |
| `pb` | Direct alias: `pb`<br>Source input: `classlevels->[selector]->totalLevel`<br>Match: a Class Level record with populated `classID`<br>Formula: `2 + floor((totalLevel - 1) / 4)` | `COMPUTED` | Numeric compatibility/computed result. To change the value, use the backing location named in **Write using**; its accepted values are documented in the corresponding structured/typed leaf table. | Calculated proficiency bonus from the applicable total character level. | `Source input`: `classlevels->[selector]->totalLevel` |

#### Level and proficiency bonus

> **Value roles**
>
> - `COMPUTED` — A calculated or aggregated result. Change the named source input rather than writing the result.
>
> **Write using**
>
> - `Source input` — Change the exact location labeled `Source input:` in the row.
> - `Write not verified` — Use the alias for reads; no safe ScriptCards write target has been verified.

| Direct alias | ScriptCards read location | Value role | Values / writable domain | Description | Write using |
|---|---|---|---|---|---|
| `level` | Direct alias: `level`<br>Source input: `classlevels->[selector]->totalLevel` | `COMPUTED` | Numeric compatibility/computed result. To change the value, use the backing location named in **Write using**; its accepted values are documented in the corresponding structured/typed leaf table. | Final total character level derived from the applicable Class Level records. | `Source input`: `classlevels->[selector]->totalLevel` |
| `level_calculations` | Direct alias: `level_calculations`<br>Known typed collection: `classlevels`<br>Source-input set: not yet verified | `COMPUTED` | Compatibility/synthetic result; exact output representation was not independently normalized for this alias. Direct write is not verified. | Sheet-generated level-calculation compatibility output. The complete input set has not yet been mapped to safe ScriptCards write targets. | `Write not verified` |

**Aliases, aggregates, and synthetic projections.** These values are translated, aggregated, or assembled from canonical records. They are not independent storage locations; use the listed source record or collection for deliberate edits.

#### Identity, class, and species

> **Value roles**
>
> - `COMPUTED` — A calculated or aggregated result. Change the named source input rather than writing the result.
>
> **Write using**
>
> - `Write not verified` — Use the alias for reads; no safe ScriptCards write target has been verified.

| Direct alias | ScriptCards read location | Value role | Values / writable domain | Description | Write using |
|---|---|---|---|---|---|
| `background` | Direct alias: `background`<br>Typed collection: `backgrounds` | `COMPUTED` | Compatibility/synthetic result; exact output representation was not independently normalized for this alias. Direct write is not verified. | `background` is the translated display value derived from the canonical Background record. | `Write not verified` |
| `character_name` | Direct alias: `character_name` | `COMPUTED` | String/formatted compatibility result. Direct write is not verified. | `character_name` is the Roll20 character-name pseudo-attribute exposed through ScriptCards, not an independently writable Beacon sheet field. | `Write not verified` |
| `class` | Direct alias: `class`<br>Typed collection: `classes` | `COMPUTED` | Compatibility/synthetic result; exact output representation was not independently normalized for this alias. Direct write is not verified. | `class` is the translated display value derived from canonical Class and Class Level records. | `Write not verified` |
| `class_display` | Direct alias: `class_display`<br>Typed collections: `classes`, `classlevels`, `subclasses` | `COMPUTED` | Compatibility/synthetic result; exact output representation was not independently normalized for this alias. Direct write is not verified. | `class_display` is a formatted compatibility display assembled from class, level, and subclass records. | `Write not verified` |
| `race` | Direct alias: `race`<br>Typed collection: `species` | `COMPUTED` | Compatibility/synthetic result; exact output representation was not independently normalized for this alias. Direct write is not verified. | `race` is the legacy-compatible species display derived from the canonical Species record. | `Write not verified` |
| `race_display` | Direct alias: `race_display`<br>Typed collection: `species` | `COMPUTED` | Compatibility/synthetic result; exact output representation was not independently normalized for this alias. Direct write is not verified. | `race_display` is a formatted compatibility display derived from the canonical Species record. | `Write not verified` |

#### Spellcasting and spell slots

> **Value roles**
>
> - `COMPUTED` — A calculated or aggregated result. Change the named source input rather than writing the result.
>
> **Write using**
>
> - `Write not verified` — Use the alias for reads; no safe ScriptCards write target has been verified.

| Direct alias | ScriptCards read location | Value role | Values / writable domain | Description | Write using |
|---|---|---|---|---|---|
| `lvl1_slots_mod` | Direct alias: `lvl1_slots_mod` | `COMPUTED` | Numeric compatibility/computed result. Direct write is not verified. | `lvl1_slots_mod` is a direct alias that provides convenient ScriptCards access to the Beacon data described in the location column. | `Write not verified` |
| `lvl2_slots_mod` | Direct alias: `lvl2_slots_mod` | `COMPUTED` | Numeric compatibility/computed result. Direct write is not verified. | `lvl2_slots_mod` is a direct alias that provides convenient ScriptCards access to the Beacon data described in the location column. | `Write not verified` |
| `lvl3_slots_mod` | Direct alias: `lvl3_slots_mod` | `COMPUTED` | Numeric compatibility/computed result. Direct write is not verified. | `lvl3_slots_mod` is a direct alias that provides convenient ScriptCards access to the Beacon data described in the location column. | `Write not verified` |
| `lvl4_slots_mod` | Direct alias: `lvl4_slots_mod` | `COMPUTED` | Numeric compatibility/computed result. Direct write is not verified. | `lvl4_slots_mod` is a direct alias that provides convenient ScriptCards access to the Beacon data described in the location column. | `Write not verified` |
| `lvl5_slots_mod` | Direct alias: `lvl5_slots_mod` | `COMPUTED` | Numeric compatibility/computed result. Direct write is not verified. | `lvl5_slots_mod` is a direct alias that provides convenient ScriptCards access to the Beacon data described in the location column. | `Write not verified` |
| `lvl6_slots_mod` | Direct alias: `lvl6_slots_mod` | `COMPUTED` | Numeric compatibility/computed result. Direct write is not verified. | `lvl6_slots_mod` is a direct alias that provides convenient ScriptCards access to the Beacon data described in the location column. | `Write not verified` |
| `lvl7_slots_mod` | Direct alias: `lvl7_slots_mod` | `COMPUTED` | Numeric compatibility/computed result. Direct write is not verified. | `lvl7_slots_mod` is a direct alias that provides convenient ScriptCards access to the Beacon data described in the location column. | `Write not verified` |
| `lvl8_slots_mod` | Direct alias: `lvl8_slots_mod` | `COMPUTED` | Numeric compatibility/computed result. Direct write is not verified. | `lvl8_slots_mod` is a direct alias that provides convenient ScriptCards access to the Beacon data described in the location column. | `Write not verified` |
| `lvl9_slots_mod` | Direct alias: `lvl9_slots_mod` | `COMPUTED` | Numeric compatibility/computed result. Direct write is not verified. | `lvl9_slots_mod` is a direct alias that provides convenient ScriptCards access to the Beacon data described in the location column. | `Write not verified` |

#### NPC core, defenses, and compatibility flags

> **Value roles**
>
> - `COMPUTED` — A calculated or aggregated result. Change the named source input rather than writing the result.
>
> **Write using**
>
> - `Write not verified` — Use the alias for reads; no safe ScriptCards write target has been verified.

| Direct alias | ScriptCards read location | Value role | Values / writable domain | Description | Write using |
|---|---|---|---|---|---|
| `npc_ac` | Direct alias: `npc_ac` | `COMPUTED` | Numeric compatibility/computed result. Direct write is not verified. | `npc_ac` is a direct alias that provides convenient ScriptCards access to the Beacon data described in the location column. | `Write not verified` |
| `npc_actype` | Direct alias: `npc_actype` | `COMPUTED` | String/formatted compatibility result. Direct write is not verified. | `npc_actype` is a direct alias that provides convenient ScriptCards access to the Beacon data described in the location column. | `Write not verified` |
| `npc_condition_immunities` | Direct alias: `npc_condition_immunities` | `COMPUTED` | Compatibility/synthetic result; exact output representation was not independently normalized for this alias. Direct write is not verified. | `npc_condition_immunities` is a direct alias that provides convenient ScriptCards access to the Beacon data described in the location column. | `Write not verified` |
| `npc_immunities` | Direct alias: `npc_immunities` | `COMPUTED` | Compatibility/synthetic result; exact output representation was not independently normalized for this alias. Direct write is not verified. | `npc_immunities` is a direct alias that provides convenient ScriptCards access to the Beacon data described in the location column. | `Write not verified` |
| `npc_languages` | Direct alias: `npc_languages` | `COMPUTED` | Compatibility/synthetic result; exact output representation was not independently normalized for this alias. Direct write is not verified. | `npc_languages` is a direct alias that provides convenient ScriptCards access to the Beacon data described in the location column. | `Write not verified` |
| `npc_name_flag` | Direct alias: `npc_name_flag`<br>Structured path: `sheet->npc` | `COMPUTED` | String/formatted compatibility result. Direct write is not verified. | `npc_name_flag` is a direct alias that provides convenient ScriptCards access to the Beacon data described in the location column. | `Write not verified` |
| `npc_options-flag` | Direct alias: `npc_options-flag` | `COMPUTED` | Compatibility flag/state result; exact legacy representation (`0`/`1`, boolean, or sheet string) was not independently normalized for this alias. Direct write is not verified. | `npc_options-flag` is a direct alias that provides convenient ScriptCards access to the Beacon data described in the location column. | `Write not verified` |
| `npc_resistances` | Direct alias: `npc_resistances` | `COMPUTED` | Compatibility/synthetic result; exact output representation was not independently normalized for this alias. Direct write is not verified. | `npc_resistances` is a direct alias that provides convenient ScriptCards access to the Beacon data described in the location column. | `Write not verified` |
| `npc_saving_flag` | Direct alias: `npc_saving_flag` | `COMPUTED` | Compatibility flag/state result; exact legacy representation (`0`/`1`, boolean, or sheet string) was not independently normalized for this alias. Direct write is not verified. | `npc_saving_flag` is a direct alias that provides convenient ScriptCards access to the Beacon data described in the location column. | `Write not verified` |
| `npc_senses` | Direct alias: `npc_senses` | `COMPUTED` | Compatibility/synthetic result; exact output representation was not independently normalized for this alias. Direct write is not verified. | `npc_senses` is a direct alias that provides convenient ScriptCards access to the Beacon data described in the location column. | `Write not verified` |
| `npc_skills_flag` | Direct alias: `npc_skills_flag` | `COMPUTED` | Compatibility flag/state result; exact legacy representation (`0`/`1`, boolean, or sheet string) was not independently normalized for this alias. Direct write is not verified. | `npc_skills_flag` is a direct alias that provides convenient ScriptCards access to the Beacon data described in the location column. | `Write not verified` |
| `npc_type` | Direct alias: `npc_type`<br>Structured path: `sheet->character->creatureType` | `COMPUTED` | String/formatted compatibility result. Direct write is not verified. | `npc_type` is a direct alias that provides convenient ScriptCards access to the Beacon data described in the location column. | `Write not verified` |
| `npc_vulnerabilities` | Direct alias: `npc_vulnerabilities` | `COMPUTED` | Compatibility/synthetic result; exact output representation was not independently normalized for this alias. Direct write is not verified. | `npc_vulnerabilities` is a direct alias that provides convenient ScriptCards access to the Beacon data described in the location column. | `Write not verified` |
| `npc_xp` | Direct alias: `npc_xp`<br>Structured path: `sheet->npc->challengeRating`<br>Structured path: `sheet->npc->customXP` | `COMPUTED` | Numeric compatibility/computed result. Direct write is not verified. | `npc_xp` is a direct alias that provides convenient ScriptCards access to the Beacon data described in the location column. | `Write not verified` |
| `npcreactionsflag` | Direct alias: `npcreactionsflag`<br>Structured path: `sheet->actions->reactionDisplayOrder` | `COMPUTED` | Compatibility flag/state result; exact legacy representation (`0`/`1`, boolean, or sheet string) was not independently normalized for this alias. Direct write is not verified. | `npcreactionsflag` is a direct alias that provides convenient ScriptCards access to the Beacon data described in the location column. | `Write not verified` |
| `npcspell_flag` | Direct alias: `npcspell_flag` | `COMPUTED` | Compatibility flag/state result; exact legacy representation (`0`/`1`, boolean, or sheet string) was not independently normalized for this alias. Direct write is not verified. | `npcspell_flag` is a direct alias that provides convenient ScriptCards access to the Beacon data described in the location column. | `Write not verified` |
| `npcspellcastingflag` | Direct alias: `npcspellcastingflag` | `COMPUTED` | Compatibility flag/state result; exact legacy representation (`0`/`1`, boolean, or sheet string) was not independently normalized for this alias. Direct write is not verified. | `npcspellcastingflag` is a direct alias that provides convenient ScriptCards access to the Beacon data described in the location column. | `Write not verified` |

#### NPC skills — Acrobatics through Medicine

> **Value roles**
>
> - `COMPUTED` — A calculated or aggregated result. Change the named source input rather than writing the result.
>
> **Write using**
>
> - `Write not verified` — Use the alias for reads; no safe ScriptCards write target has been verified.

| Direct alias | ScriptCards read location | Value role | Values / writable domain | Description | Write using |
|---|---|---|---|---|---|
| `npc_acrobatics` | Direct alias: `npc_acrobatics` | `COMPUTED` | Compatibility/synthetic result; exact output representation was not independently normalized for this alias. Direct write is not verified. | `npc_acrobatics` is a direct alias that provides convenient ScriptCards access to the Beacon data described in the location column. | `Write not verified` |
| `npc_acrobatics_base` | Direct alias: `npc_acrobatics_base` | `COMPUTED` | Compatibility/synthetic result; exact output representation was not independently normalized for this alias. Direct write is not verified. | `npc_acrobatics_base` is a direct alias that provides convenient ScriptCards access to the Beacon data described in the location column. | `Write not verified` |
| `npc_acrobatics_flag` | Direct alias: `npc_acrobatics_flag` | `COMPUTED` | Compatibility flag/state result; exact legacy representation (`0`/`1`, boolean, or sheet string) was not independently normalized for this alias. Direct write is not verified. | `npc_acrobatics_flag` is a direct alias that provides convenient ScriptCards access to the Beacon data described in the location column. | `Write not verified` |
| `npc_animal_handling` | Direct alias: `npc_animal_handling` | `COMPUTED` | Compatibility/synthetic result; exact output representation was not independently normalized for this alias. Direct write is not verified. | `npc_animal_handling` is a direct alias that provides convenient ScriptCards access to the Beacon data described in the location column. | `Write not verified` |
| `npc_animal_handling_base` | Direct alias: `npc_animal_handling_base` | `COMPUTED` | Compatibility/synthetic result; exact output representation was not independently normalized for this alias. Direct write is not verified. | `npc_animal_handling_base` is a direct alias that provides convenient ScriptCards access to the Beacon data described in the location column. | `Write not verified` |
| `npc_animal_handling_flag` | Direct alias: `npc_animal_handling_flag` | `COMPUTED` | Compatibility flag/state result; exact legacy representation (`0`/`1`, boolean, or sheet string) was not independently normalized for this alias. Direct write is not verified. | `npc_animal_handling_flag` is a direct alias that provides convenient ScriptCards access to the Beacon data described in the location column. | `Write not verified` |
| `npc_arcana` | Direct alias: `npc_arcana` | `COMPUTED` | Compatibility/synthetic result; exact output representation was not independently normalized for this alias. Direct write is not verified. | `npc_arcana` is a direct alias that provides convenient ScriptCards access to the Beacon data described in the location column. | `Write not verified` |
| `npc_arcana_base` | Direct alias: `npc_arcana_base` | `COMPUTED` | Compatibility/synthetic result; exact output representation was not independently normalized for this alias. Direct write is not verified. | `npc_arcana_base` is a direct alias that provides convenient ScriptCards access to the Beacon data described in the location column. | `Write not verified` |
| `npc_arcana_flag` | Direct alias: `npc_arcana_flag` | `COMPUTED` | Compatibility flag/state result; exact legacy representation (`0`/`1`, boolean, or sheet string) was not independently normalized for this alias. Direct write is not verified. | `npc_arcana_flag` is a direct alias that provides convenient ScriptCards access to the Beacon data described in the location column. | `Write not verified` |
| `npc_athletics` | Direct alias: `npc_athletics` | `COMPUTED` | Compatibility/synthetic result; exact output representation was not independently normalized for this alias. Direct write is not verified. | `npc_athletics` is a direct alias that provides convenient ScriptCards access to the Beacon data described in the location column. | `Write not verified` |
| `npc_athletics_base` | Direct alias: `npc_athletics_base` | `COMPUTED` | Compatibility/synthetic result; exact output representation was not independently normalized for this alias. Direct write is not verified. | `npc_athletics_base` is a direct alias that provides convenient ScriptCards access to the Beacon data described in the location column. | `Write not verified` |
| `npc_athletics_flag` | Direct alias: `npc_athletics_flag` | `COMPUTED` | Compatibility flag/state result; exact legacy representation (`0`/`1`, boolean, or sheet string) was not independently normalized for this alias. Direct write is not verified. | `npc_athletics_flag` is a direct alias that provides convenient ScriptCards access to the Beacon data described in the location column. | `Write not verified` |
| `npc_deception` | Direct alias: `npc_deception` | `COMPUTED` | Compatibility/synthetic result; exact output representation was not independently normalized for this alias. Direct write is not verified. | `npc_deception` is a direct alias that provides convenient ScriptCards access to the Beacon data described in the location column. | `Write not verified` |
| `npc_deception_base` | Direct alias: `npc_deception_base` | `COMPUTED` | Compatibility/synthetic result; exact output representation was not independently normalized for this alias. Direct write is not verified. | `npc_deception_base` is a direct alias that provides convenient ScriptCards access to the Beacon data described in the location column. | `Write not verified` |
| `npc_deception_flag` | Direct alias: `npc_deception_flag` | `COMPUTED` | Compatibility flag/state result; exact legacy representation (`0`/`1`, boolean, or sheet string) was not independently normalized for this alias. Direct write is not verified. | `npc_deception_flag` is a direct alias that provides convenient ScriptCards access to the Beacon data described in the location column. | `Write not verified` |
| `npc_history` | Direct alias: `npc_history` | `COMPUTED` | Compatibility/synthetic result; exact output representation was not independently normalized for this alias. Direct write is not verified. | `npc_history` is a direct alias that provides convenient ScriptCards access to the Beacon data described in the location column. | `Write not verified` |
| `npc_history_base` | Direct alias: `npc_history_base` | `COMPUTED` | Compatibility/synthetic result; exact output representation was not independently normalized for this alias. Direct write is not verified. | `npc_history_base` is a direct alias that provides convenient ScriptCards access to the Beacon data described in the location column. | `Write not verified` |
| `npc_history_flag` | Direct alias: `npc_history_flag` | `COMPUTED` | Compatibility flag/state result; exact legacy representation (`0`/`1`, boolean, or sheet string) was not independently normalized for this alias. Direct write is not verified. | `npc_history_flag` is a direct alias that provides convenient ScriptCards access to the Beacon data described in the location column. | `Write not verified` |
| `npc_insight` | Direct alias: `npc_insight` | `COMPUTED` | Compatibility/synthetic result; exact output representation was not independently normalized for this alias. Direct write is not verified. | `npc_insight` is a direct alias that provides convenient ScriptCards access to the Beacon data described in the location column. | `Write not verified` |
| `npc_insight_base` | Direct alias: `npc_insight_base` | `COMPUTED` | Compatibility/synthetic result; exact output representation was not independently normalized for this alias. Direct write is not verified. | `npc_insight_base` is a direct alias that provides convenient ScriptCards access to the Beacon data described in the location column. | `Write not verified` |
| `npc_insight_flag` | Direct alias: `npc_insight_flag` | `COMPUTED` | Compatibility flag/state result; exact legacy representation (`0`/`1`, boolean, or sheet string) was not independently normalized for this alias. Direct write is not verified. | `npc_insight_flag` is a direct alias that provides convenient ScriptCards access to the Beacon data described in the location column. | `Write not verified` |
| `npc_intimidation` | Direct alias: `npc_intimidation` | `COMPUTED` | Compatibility/synthetic result; exact output representation was not independently normalized for this alias. Direct write is not verified. | `npc_intimidation` is a direct alias that provides convenient ScriptCards access to the Beacon data described in the location column. | `Write not verified` |
| `npc_intimidation_base` | Direct alias: `npc_intimidation_base` | `COMPUTED` | Compatibility/synthetic result; exact output representation was not independently normalized for this alias. Direct write is not verified. | `npc_intimidation_base` is a direct alias that provides convenient ScriptCards access to the Beacon data described in the location column. | `Write not verified` |
| `npc_intimidation_flag` | Direct alias: `npc_intimidation_flag` | `COMPUTED` | Compatibility flag/state result; exact legacy representation (`0`/`1`, boolean, or sheet string) was not independently normalized for this alias. Direct write is not verified. | `npc_intimidation_flag` is a direct alias that provides convenient ScriptCards access to the Beacon data described in the location column. | `Write not verified` |
| `npc_investigation` | Direct alias: `npc_investigation` | `COMPUTED` | Compatibility/synthetic result; exact output representation was not independently normalized for this alias. Direct write is not verified. | `npc_investigation` is a direct alias that provides convenient ScriptCards access to the Beacon data described in the location column. | `Write not verified` |
| `npc_investigation_base` | Direct alias: `npc_investigation_base` | `COMPUTED` | Compatibility/synthetic result; exact output representation was not independently normalized for this alias. Direct write is not verified. | `npc_investigation_base` is a direct alias that provides convenient ScriptCards access to the Beacon data described in the location column. | `Write not verified` |
| `npc_investigation_flag` | Direct alias: `npc_investigation_flag` | `COMPUTED` | Compatibility flag/state result; exact legacy representation (`0`/`1`, boolean, or sheet string) was not independently normalized for this alias. Direct write is not verified. | `npc_investigation_flag` is a direct alias that provides convenient ScriptCards access to the Beacon data described in the location column. | `Write not verified` |
| `npc_medicine` | Direct alias: `npc_medicine` | `COMPUTED` | Compatibility/synthetic result; exact output representation was not independently normalized for this alias. Direct write is not verified. | `npc_medicine` is a direct alias that provides convenient ScriptCards access to the Beacon data described in the location column. | `Write not verified` |
| `npc_medicine_base` | Direct alias: `npc_medicine_base` | `COMPUTED` | Compatibility/synthetic result; exact output representation was not independently normalized for this alias. Direct write is not verified. | `npc_medicine_base` is a direct alias that provides convenient ScriptCards access to the Beacon data described in the location column. | `Write not verified` |
| `npc_medicine_flag` | Direct alias: `npc_medicine_flag` | `COMPUTED` | Compatibility flag/state result; exact legacy representation (`0`/`1`, boolean, or sheet string) was not independently normalized for this alias. Direct write is not verified. | `npc_medicine_flag` is a direct alias that provides convenient ScriptCards access to the Beacon data described in the location column. | `Write not verified` |

#### NPC skills — Nature through Survival

> **Value roles**
>
> - `COMPUTED` — A calculated or aggregated result. Change the named source input rather than writing the result.
>
> **Write using**
>
> - `Write not verified` — Use the alias for reads; no safe ScriptCards write target has been verified.

| Direct alias | ScriptCards read location | Value role | Values / writable domain | Description | Write using |
|---|---|---|---|---|---|
| `npc_nature` | Direct alias: `npc_nature` | `COMPUTED` | Compatibility/synthetic result; exact output representation was not independently normalized for this alias. Direct write is not verified. | `npc_nature` is a direct alias that provides convenient ScriptCards access to the Beacon data described in the location column. | `Write not verified` |
| `npc_nature_base` | Direct alias: `npc_nature_base` | `COMPUTED` | Compatibility/synthetic result; exact output representation was not independently normalized for this alias. Direct write is not verified. | `npc_nature_base` is a direct alias that provides convenient ScriptCards access to the Beacon data described in the location column. | `Write not verified` |
| `npc_nature_flag` | Direct alias: `npc_nature_flag` | `COMPUTED` | Compatibility flag/state result; exact legacy representation (`0`/`1`, boolean, or sheet string) was not independently normalized for this alias. Direct write is not verified. | `npc_nature_flag` is a direct alias that provides convenient ScriptCards access to the Beacon data described in the location column. | `Write not verified` |
| `npc_perception` | Direct alias: `npc_perception` | `COMPUTED` | Compatibility/synthetic result; exact output representation was not independently normalized for this alias. Direct write is not verified. | `npc_perception` is a direct alias that provides convenient ScriptCards access to the Beacon data described in the location column. | `Write not verified` |
| `npc_perception_base` | Direct alias: `npc_perception_base` | `COMPUTED` | Compatibility/synthetic result; exact output representation was not independently normalized for this alias. Direct write is not verified. | `npc_perception_base` is a direct alias that provides convenient ScriptCards access to the Beacon data described in the location column. | `Write not verified` |
| `npc_perception_flag` | Direct alias: `npc_perception_flag` | `COMPUTED` | Compatibility flag/state result; exact legacy representation (`0`/`1`, boolean, or sheet string) was not independently normalized for this alias. Direct write is not verified. | `npc_perception_flag` is a direct alias that provides convenient ScriptCards access to the Beacon data described in the location column. | `Write not verified` |
| `npc_performance` | Direct alias: `npc_performance` | `COMPUTED` | Compatibility/synthetic result; exact output representation was not independently normalized for this alias. Direct write is not verified. | `npc_performance` is a direct alias that provides convenient ScriptCards access to the Beacon data described in the location column. | `Write not verified` |
| `npc_performance_base` | Direct alias: `npc_performance_base` | `COMPUTED` | Compatibility/synthetic result; exact output representation was not independently normalized for this alias. Direct write is not verified. | `npc_performance_base` is a direct alias that provides convenient ScriptCards access to the Beacon data described in the location column. | `Write not verified` |
| `npc_performance_flag` | Direct alias: `npc_performance_flag` | `COMPUTED` | Compatibility flag/state result; exact legacy representation (`0`/`1`, boolean, or sheet string) was not independently normalized for this alias. Direct write is not verified. | `npc_performance_flag` is a direct alias that provides convenient ScriptCards access to the Beacon data described in the location column. | `Write not verified` |
| `npc_persuasion` | Direct alias: `npc_persuasion` | `COMPUTED` | Compatibility/synthetic result; exact output representation was not independently normalized for this alias. Direct write is not verified. | `npc_persuasion` is a direct alias that provides convenient ScriptCards access to the Beacon data described in the location column. | `Write not verified` |
| `npc_persuasion_base` | Direct alias: `npc_persuasion_base` | `COMPUTED` | Compatibility/synthetic result; exact output representation was not independently normalized for this alias. Direct write is not verified. | `npc_persuasion_base` is a direct alias that provides convenient ScriptCards access to the Beacon data described in the location column. | `Write not verified` |
| `npc_persuasion_flag` | Direct alias: `npc_persuasion_flag` | `COMPUTED` | Compatibility flag/state result; exact legacy representation (`0`/`1`, boolean, or sheet string) was not independently normalized for this alias. Direct write is not verified. | `npc_persuasion_flag` is a direct alias that provides convenient ScriptCards access to the Beacon data described in the location column. | `Write not verified` |
| `npc_religion` | Direct alias: `npc_religion` | `COMPUTED` | Compatibility/synthetic result; exact output representation was not independently normalized for this alias. Direct write is not verified. | `npc_religion` is a direct alias that provides convenient ScriptCards access to the Beacon data described in the location column. | `Write not verified` |
| `npc_religion_base` | Direct alias: `npc_religion_base` | `COMPUTED` | Compatibility/synthetic result; exact output representation was not independently normalized for this alias. Direct write is not verified. | `npc_religion_base` is a direct alias that provides convenient ScriptCards access to the Beacon data described in the location column. | `Write not verified` |
| `npc_religion_flag` | Direct alias: `npc_religion_flag` | `COMPUTED` | Compatibility flag/state result; exact legacy representation (`0`/`1`, boolean, or sheet string) was not independently normalized for this alias. Direct write is not verified. | `npc_religion_flag` is a direct alias that provides convenient ScriptCards access to the Beacon data described in the location column. | `Write not verified` |
| `npc_sleight_of_hand` | Direct alias: `npc_sleight_of_hand` | `COMPUTED` | Compatibility/synthetic result; exact output representation was not independently normalized for this alias. Direct write is not verified. | `npc_sleight_of_hand` is a direct alias that provides convenient ScriptCards access to the Beacon data described in the location column. | `Write not verified` |
| `npc_sleight_of_hand_base` | Direct alias: `npc_sleight_of_hand_base` | `COMPUTED` | Compatibility/synthetic result; exact output representation was not independently normalized for this alias. Direct write is not verified. | `npc_sleight_of_hand_base` is a direct alias that provides convenient ScriptCards access to the Beacon data described in the location column. | `Write not verified` |
| `npc_sleight_of_hand_flag` | Direct alias: `npc_sleight_of_hand_flag` | `COMPUTED` | Compatibility flag/state result; exact legacy representation (`0`/`1`, boolean, or sheet string) was not independently normalized for this alias. Direct write is not verified. | `npc_sleight_of_hand_flag` is a direct alias that provides convenient ScriptCards access to the Beacon data described in the location column. | `Write not verified` |
| `npc_stealth` | Direct alias: `npc_stealth` | `COMPUTED` | Compatibility/synthetic result; exact output representation was not independently normalized for this alias. Direct write is not verified. | `npc_stealth` is a direct alias that provides convenient ScriptCards access to the Beacon data described in the location column. | `Write not verified` |
| `npc_stealth_base` | Direct alias: `npc_stealth_base` | `COMPUTED` | Compatibility/synthetic result; exact output representation was not independently normalized for this alias. Direct write is not verified. | `npc_stealth_base` is a direct alias that provides convenient ScriptCards access to the Beacon data described in the location column. | `Write not verified` |
| `npc_stealth_flag` | Direct alias: `npc_stealth_flag` | `COMPUTED` | Compatibility flag/state result; exact legacy representation (`0`/`1`, boolean, or sheet string) was not independently normalized for this alias. Direct write is not verified. | `npc_stealth_flag` is a direct alias that provides convenient ScriptCards access to the Beacon data described in the location column. | `Write not verified` |
| `npc_survival` | Direct alias: `npc_survival` | `COMPUTED` | Compatibility/synthetic result; exact output representation was not independently normalized for this alias. Direct write is not verified. | `npc_survival` is a direct alias that provides convenient ScriptCards access to the Beacon data described in the location column. | `Write not verified` |
| `npc_survival_base` | Direct alias: `npc_survival_base` | `COMPUTED` | Compatibility/synthetic result; exact output representation was not independently normalized for this alias. Direct write is not verified. | `npc_survival_base` is a direct alias that provides convenient ScriptCards access to the Beacon data described in the location column. | `Write not verified` |
| `npc_survival_flag` | Direct alias: `npc_survival_flag` | `COMPUTED` | Compatibility flag/state result; exact legacy representation (`0`/`1`, boolean, or sheet string) was not independently normalized for this alias. Direct write is not verified. | `npc_survival_flag` is a direct alias that provides convenient ScriptCards access to the Beacon data described in the location column. | `Write not verified` |

#### NPC saving throws

> **Value roles**
>
> - `COMPUTED` — A calculated or aggregated result. Change the named source input rather than writing the result.
>
> **Write using**
>
> - `Write not verified` — Use the alias for reads; no safe ScriptCards write target has been verified.

| Direct alias | ScriptCards read location | Value role | Values / writable domain | Description | Write using |
|---|---|---|---|---|---|
| `npc_cha_negative` | Direct alias: `npc_cha_negative` | `COMPUTED` | Compatibility/synthetic result; exact output representation was not independently normalized for this alias. Direct write is not verified. | `npc_cha_negative` is a direct alias that provides convenient ScriptCards access to the Beacon data described in the location column. | `Write not verified` |
| `npc_cha_save` | Direct alias: `npc_cha_save` | `COMPUTED` | Compatibility/synthetic result; exact output representation was not independently normalized for this alias. Direct write is not verified. | `npc_cha_save` is a direct alias that provides convenient ScriptCards access to the Beacon data described in the location column. | `Write not verified` |
| `npc_cha_save_base` | Direct alias: `npc_cha_save_base` | `COMPUTED` | Compatibility/synthetic result; exact output representation was not independently normalized for this alias. Direct write is not verified. | `npc_cha_save_base` is a direct alias that provides convenient ScriptCards access to the Beacon data described in the location column. | `Write not verified` |
| `npc_cha_save_flag` | Direct alias: `npc_cha_save_flag` | `COMPUTED` | Compatibility flag/state result; exact legacy representation (`0`/`1`, boolean, or sheet string) was not independently normalized for this alias. Direct write is not verified. | `npc_cha_save_flag` is a direct alias that provides convenient ScriptCards access to the Beacon data described in the location column. | `Write not verified` |
| `npc_con_negative` | Direct alias: `npc_con_negative` | `COMPUTED` | Compatibility/synthetic result; exact output representation was not independently normalized for this alias. Direct write is not verified. | `npc_con_negative` is a direct alias that provides convenient ScriptCards access to the Beacon data described in the location column. | `Write not verified` |
| `npc_con_save` | Direct alias: `npc_con_save` | `COMPUTED` | Compatibility/synthetic result; exact output representation was not independently normalized for this alias. Direct write is not verified. | `npc_con_save` is a direct alias that provides convenient ScriptCards access to the Beacon data described in the location column. | `Write not verified` |
| `npc_con_save_base` | Direct alias: `npc_con_save_base` | `COMPUTED` | Compatibility/synthetic result; exact output representation was not independently normalized for this alias. Direct write is not verified. | `npc_con_save_base` is a direct alias that provides convenient ScriptCards access to the Beacon data described in the location column. | `Write not verified` |
| `npc_con_save_flag` | Direct alias: `npc_con_save_flag` | `COMPUTED` | Compatibility flag/state result; exact legacy representation (`0`/`1`, boolean, or sheet string) was not independently normalized for this alias. Direct write is not verified. | `npc_con_save_flag` is a direct alias that provides convenient ScriptCards access to the Beacon data described in the location column. | `Write not verified` |
| `npc_dex_negative` | Direct alias: `npc_dex_negative` | `COMPUTED` | Compatibility/synthetic result; exact output representation was not independently normalized for this alias. Direct write is not verified. | `npc_dex_negative` is a direct alias that provides convenient ScriptCards access to the Beacon data described in the location column. | `Write not verified` |
| `npc_dex_save` | Direct alias: `npc_dex_save` | `COMPUTED` | Compatibility/synthetic result; exact output representation was not independently normalized for this alias. Direct write is not verified. | `npc_dex_save` is a direct alias that provides convenient ScriptCards access to the Beacon data described in the location column. | `Write not verified` |
| `npc_dex_save_base` | Direct alias: `npc_dex_save_base` | `COMPUTED` | Compatibility/synthetic result; exact output representation was not independently normalized for this alias. Direct write is not verified. | `npc_dex_save_base` is a direct alias that provides convenient ScriptCards access to the Beacon data described in the location column. | `Write not verified` |
| `npc_dex_save_flag` | Direct alias: `npc_dex_save_flag` | `COMPUTED` | Compatibility flag/state result; exact legacy representation (`0`/`1`, boolean, or sheet string) was not independently normalized for this alias. Direct write is not verified. | `npc_dex_save_flag` is a direct alias that provides convenient ScriptCards access to the Beacon data described in the location column. | `Write not verified` |
| `npc_int_negative` | Direct alias: `npc_int_negative` | `COMPUTED` | Compatibility/synthetic result; exact output representation was not independently normalized for this alias. Direct write is not verified. | `npc_int_negative` is a direct alias that provides convenient ScriptCards access to the Beacon data described in the location column. | `Write not verified` |
| `npc_int_save` | Direct alias: `npc_int_save` | `COMPUTED` | Compatibility/synthetic result; exact output representation was not independently normalized for this alias. Direct write is not verified. | `npc_int_save` is a direct alias that provides convenient ScriptCards access to the Beacon data described in the location column. | `Write not verified` |
| `npc_int_save_base` | Direct alias: `npc_int_save_base` | `COMPUTED` | Compatibility/synthetic result; exact output representation was not independently normalized for this alias. Direct write is not verified. | `npc_int_save_base` is a direct alias that provides convenient ScriptCards access to the Beacon data described in the location column. | `Write not verified` |
| `npc_int_save_flag` | Direct alias: `npc_int_save_flag` | `COMPUTED` | Compatibility flag/state result; exact legacy representation (`0`/`1`, boolean, or sheet string) was not independently normalized for this alias. Direct write is not verified. | `npc_int_save_flag` is a direct alias that provides convenient ScriptCards access to the Beacon data described in the location column. | `Write not verified` |
| `npc_str_negative` | Direct alias: `npc_str_negative` | `COMPUTED` | Compatibility/synthetic result; exact output representation was not independently normalized for this alias. Direct write is not verified. | `npc_str_negative` is a direct alias that provides convenient ScriptCards access to the Beacon data described in the location column. | `Write not verified` |
| `npc_str_save` | Direct alias: `npc_str_save` | `COMPUTED` | Compatibility/synthetic result; exact output representation was not independently normalized for this alias. Direct write is not verified. | `npc_str_save` is a direct alias that provides convenient ScriptCards access to the Beacon data described in the location column. | `Write not verified` |
| `npc_str_save_base` | Direct alias: `npc_str_save_base` | `COMPUTED` | Compatibility/synthetic result; exact output representation was not independently normalized for this alias. Direct write is not verified. | `npc_str_save_base` is a direct alias that provides convenient ScriptCards access to the Beacon data described in the location column. | `Write not verified` |
| `npc_str_save_flag` | Direct alias: `npc_str_save_flag` | `COMPUTED` | Compatibility flag/state result; exact legacy representation (`0`/`1`, boolean, or sheet string) was not independently normalized for this alias. Direct write is not verified. | `npc_str_save_flag` is a direct alias that provides convenient ScriptCards access to the Beacon data described in the location column. | `Write not verified` |
| `npc_wis_negative` | Direct alias: `npc_wis_negative` | `COMPUTED` | Compatibility/synthetic result; exact output representation was not independently normalized for this alias. Direct write is not verified. | `npc_wis_negative` is a direct alias that provides convenient ScriptCards access to the Beacon data described in the location column. | `Write not verified` |
| `npc_wis_save` | Direct alias: `npc_wis_save` | `COMPUTED` | Compatibility/synthetic result; exact output representation was not independently normalized for this alias. Direct write is not verified. | `npc_wis_save` is a direct alias that provides convenient ScriptCards access to the Beacon data described in the location column. | `Write not verified` |
| `npc_wis_save_base` | Direct alias: `npc_wis_save_base` | `COMPUTED` | Compatibility/synthetic result; exact output representation was not independently normalized for this alias. Direct write is not verified. | `npc_wis_save_base` is a direct alias that provides convenient ScriptCards access to the Beacon data described in the location column. | `Write not verified` |
| `npc_wis_save_flag` | Direct alias: `npc_wis_save_flag` | `COMPUTED` | Compatibility flag/state result; exact legacy representation (`0`/`1`, boolean, or sheet string) was not independently normalized for this alias. Direct write is not verified. | `npc_wis_save_flag` is a direct alias that provides convenient ScriptCards access to the Beacon data described in the location column. | `Write not verified` |

#### Repeating attack fields

> **Value roles**
>
> - `COMPUTED` — A calculated or aggregated result. Change the named source input rather than writing the result.
>
> **Write using**
>
> - `Write not verified` — Use the alias for reads; no safe ScriptCards write target has been verified.

| Direct alias | ScriptCards read location | Value role | Values / writable domain | Description | Write using |
|---|---|---|---|---|---|
| `atk_desc` | Direct alias: `atk_desc` | `COMPUTED` | String/formatted compatibility result. Direct write is not verified. | `atk_desc` is a direct alias that provides convenient ScriptCards access to the Beacon data described in the location column. | `Write not verified` |
| `atkattr_base` | Direct alias: `atkattr_base` | `COMPUTED` | String/formatted compatibility result. Direct write is not verified. | `atkattr_base` is a direct alias that provides convenient ScriptCards access to the Beacon data described in the location column. | `Write not verified` |
| `atkbonus` | Direct alias: `atkbonus` | `COMPUTED` | Numeric compatibility/computed result. Direct write is not verified. | `atkbonus` is a direct alias that provides convenient ScriptCards access to the Beacon data described in the location column. | `Write not verified` |
| `atkcritrange` | Direct alias: `atkcritrange` | `COMPUTED` | String/formatted compatibility result. Direct write is not verified. | `atkcritrange` is a direct alias that provides convenient ScriptCards access to the Beacon data described in the location column. | `Write not verified` |
| `atkdmgtype` | Direct alias: `atkdmgtype` | `COMPUTED` | String/formatted compatibility result. Direct write is not verified. | `atkdmgtype` is a direct alias that provides convenient ScriptCards access to the Beacon data described in the location column. | `Write not verified` |
| `atkflag` | Direct alias: `atkflag` | `COMPUTED` | Compatibility flag/state result; exact legacy representation (`0`/`1`, boolean, or sheet string) was not independently normalized for this alias. Direct write is not verified. | `atkflag` is a direct alias that provides convenient ScriptCards access to the Beacon data described in the location column. | `Write not verified` |
| `atkmagic` | Direct alias: `atkmagic` | `COMPUTED` | Compatibility/synthetic result; exact output representation was not independently normalized for this alias. Direct write is not verified. | `atkmagic` is a direct alias that provides convenient ScriptCards access to the Beacon data described in the location column. | `Write not verified` |
| `atkmod` | Direct alias: `atkmod` | `COMPUTED` | Numeric compatibility/computed result. Direct write is not verified. | `atkmod` is a direct alias that provides convenient ScriptCards access to the Beacon data described in the location column. | `Write not verified` |
| `atkname` | Direct alias: `atkname` | `COMPUTED` | String/formatted compatibility result. Direct write is not verified. | `atkname` is a direct alias that provides convenient ScriptCards access to the Beacon data described in the location column. | `Write not verified` |
| `atkprofflag` | Direct alias: `atkprofflag` | `COMPUTED` | Compatibility flag/state result; exact legacy representation (`0`/`1`, boolean, or sheet string) was not independently normalized for this alias. Direct write is not verified. | `atkprofflag` is a direct alias that provides convenient ScriptCards access to the Beacon data described in the location column. | `Write not verified` |
| `atkrange` | Direct alias: `atkrange` | `COMPUTED` | String/formatted compatibility result. Direct write is not verified. | `atkrange` is a direct alias that provides convenient ScriptCards access to the Beacon data described in the location column. | `Write not verified` |
| `attack_crit` | Direct alias: `attack_crit` | `COMPUTED` | Compatibility/synthetic result; exact output representation was not independently normalized for this alias. Direct write is not verified. | `attack_crit` is a direct alias that provides convenient ScriptCards access to the Beacon data described in the location column. | `Write not verified` |
| `attack_crit2` | Direct alias: `attack_crit2` | `COMPUTED` | Compatibility/synthetic result; exact output representation was not independently normalized for this alias. Direct write is not verified. | `attack_crit2` is a direct alias that provides convenient ScriptCards access to the Beacon data described in the location column. | `Write not verified` |
| `attack_damage` | Direct alias: `attack_damage` | `COMPUTED` | String/formatted compatibility result. Direct write is not verified. | `attack_damage` is a direct alias that provides convenient ScriptCards access to the Beacon data described in the location column. | `Write not verified` |
| `attack_damage2` | Direct alias: `attack_damage2` | `COMPUTED` | String/formatted compatibility result. Direct write is not verified. | `attack_damage2` is a direct alias that provides convenient ScriptCards access to the Beacon data described in the location column. | `Write not verified` |
| `attack_damagetype` | Direct alias: `attack_damagetype` | `COMPUTED` | String/formatted compatibility result. Direct write is not verified. | `attack_damagetype` is a direct alias that provides convenient ScriptCards access to the Beacon data described in the location column. | `Write not verified` |
| `attack_damagetype2` | Direct alias: `attack_damagetype2` | `COMPUTED` | String/formatted compatibility result. Direct write is not verified. | `attack_damagetype2` is a direct alias that provides convenient ScriptCards access to the Beacon data described in the location column. | `Write not verified` |
| `attack_flag` | Direct alias: `attack_flag` | `COMPUTED` | Compatibility flag/state result; exact legacy representation (`0`/`1`, boolean, or sheet string) was not independently normalized for this alias. Direct write is not verified. | `attack_flag` is a direct alias that provides convenient ScriptCards access to the Beacon data described in the location column. | `Write not verified` |
| `attack_onhit` | Direct alias: `attack_onhit` | `COMPUTED` | Compatibility/synthetic result; exact output representation was not independently normalized for this alias. Direct write is not verified. | `attack_onhit` is a direct alias that provides convenient ScriptCards access to the Beacon data described in the location column. | `Write not verified` |
| `attack_range` | Direct alias: `attack_range` | `COMPUTED` | String/formatted compatibility result. Direct write is not verified. | `attack_range` is a direct alias that provides convenient ScriptCards access to the Beacon data described in the location column. | `Write not verified` |
| `attack_target` | Direct alias: `attack_target` | `COMPUTED` | Compatibility/synthetic result; exact output representation was not independently normalized for this alias. Direct write is not verified. | `attack_target` is a direct alias that provides convenient ScriptCards access to the Beacon data described in the location column. | `Write not verified` |
| `attack_tohit` | Direct alias: `attack_tohit` | `COMPUTED` | Compatibility/synthetic result; exact output representation was not independently normalized for this alias. Direct write is not verified. | `attack_tohit` is a direct alias that provides convenient ScriptCards access to the Beacon data described in the location column. | `Write not verified` |
| `attack_tohitrange` | Direct alias: `attack_tohitrange` | `COMPUTED` | String/formatted compatibility result. Direct write is not verified. | `attack_tohitrange` is a direct alias that provides convenient ScriptCards access to the Beacon data described in the location column. | `Write not verified` |
| `attack_type` | Direct alias: `attack_type` | `COMPUTED` | String/formatted compatibility result. Direct write is not verified. | `attack_type` is a direct alias that provides convenient ScriptCards access to the Beacon data described in the location column. | `Write not verified` |
| `desc` | Direct alias: `desc` | `COMPUTED` | String/formatted compatibility result. Direct write is not verified. | `desc` is a direct alias that provides convenient ScriptCards access to the Beacon data described in the location column. | `Write not verified` |
| `description` | Direct alias: `description` | `COMPUTED` | String/formatted compatibility result. Direct write is not verified. | `description` is a direct alias that provides convenient ScriptCards access to the Beacon data described in the location column. | `Write not verified` |
| `hasattack` | Direct alias: `hasattack` | `COMPUTED` | Compatibility/synthetic result; exact output representation was not independently normalized for this alias. Direct write is not verified. | `hasattack` is a direct alias that provides convenient ScriptCards access to the Beacon data described in the location column. | `Write not verified` |
| `includedesc` | Direct alias: `includedesc` | `COMPUTED` | String/formatted compatibility result. Direct write is not verified. | `includedesc` is a direct alias that provides convenient ScriptCards access to the Beacon data described in the location column. | `Write not verified` |
| `mod` | Direct alias: `mod` | `COMPUTED` | Numeric compatibility/computed result. Direct write is not verified. | `mod` is a direct alias that provides convenient ScriptCards access to the Beacon data described in the location column. | `Write not verified` |
| `show_desc` | Direct alias: `show_desc` | `COMPUTED` | String/formatted compatibility result. Direct write is not verified. | `show_desc` is a direct alias that provides convenient ScriptCards access to the Beacon data described in the location column. | `Write not verified` |

#### Repeating damage fields

> **Value roles**
>
> - `COMPUTED` — A calculated or aggregated result. Change the named source input rather than writing the result.
>
> **Write using**
>
> - `Write not verified` — Use the alias for reads; no safe ScriptCards write target has been verified.

| Direct alias | ScriptCards read location | Value role | Values / writable domain | Description | Write using |
|---|---|---|---|---|---|
| `damage_flag` | Direct alias: `damage_flag` | `COMPUTED` | String/formatted compatibility result. Direct write is not verified. | `damage_flag` is a direct alias that provides convenient ScriptCards access to the Beacon data described in the location column. | `Write not verified` |
| `dmg2attr` | Direct alias: `dmg2attr` | `COMPUTED` | String/formatted compatibility result. Direct write is not verified. | `dmg2attr` is a direct alias that provides convenient ScriptCards access to the Beacon data described in the location column. | `Write not verified` |
| `dmg2base` | Direct alias: `dmg2base` | `COMPUTED` | Compatibility/synthetic result; exact output representation was not independently normalized for this alias. Direct write is not verified. | `dmg2base` is a direct alias that provides convenient ScriptCards access to the Beacon data described in the location column. | `Write not verified` |
| `dmg2custcrit` | Direct alias: `dmg2custcrit` | `COMPUTED` | Compatibility/synthetic result; exact output representation was not independently normalized for this alias. Direct write is not verified. | `dmg2custcrit` is a direct alias that provides convenient ScriptCards access to the Beacon data described in the location column. | `Write not verified` |
| `dmg2flag` | Direct alias: `dmg2flag` | `COMPUTED` | Compatibility flag/state result; exact legacy representation (`0`/`1`, boolean, or sheet string) was not independently normalized for this alias. Direct write is not verified. | `dmg2flag` is a direct alias that provides convenient ScriptCards access to the Beacon data described in the location column. | `Write not verified` |
| `dmg2mod` | Direct alias: `dmg2mod` | `COMPUTED` | Numeric compatibility/computed result. Direct write is not verified. | `dmg2mod` is a direct alias that provides convenient ScriptCards access to the Beacon data described in the location column. | `Write not verified` |
| `dmg2type` | Direct alias: `dmg2type` | `COMPUTED` | String/formatted compatibility result. Direct write is not verified. | `dmg2type` is a direct alias that provides convenient ScriptCards access to the Beacon data described in the location column. | `Write not verified` |
| `dmgattr` | Direct alias: `dmgattr` | `COMPUTED` | String/formatted compatibility result. Direct write is not verified. | `dmgattr` is a direct alias that provides convenient ScriptCards access to the Beacon data described in the location column. | `Write not verified` |
| `dmgbase` | Direct alias: `dmgbase` | `COMPUTED` | Compatibility/synthetic result; exact output representation was not independently normalized for this alias. Direct write is not verified. | `dmgbase` is a direct alias that provides convenient ScriptCards access to the Beacon data described in the location column. | `Write not verified` |
| `dmgcustcrit` | Direct alias: `dmgcustcrit` | `COMPUTED` | Compatibility/synthetic result; exact output representation was not independently normalized for this alias. Direct write is not verified. | `dmgcustcrit` is a direct alias that provides convenient ScriptCards access to the Beacon data described in the location column. | `Write not verified` |
| `dmgflag` | Direct alias: `dmgflag` | `COMPUTED` | Compatibility flag/state result; exact legacy representation (`0`/`1`, boolean, or sheet string) was not independently normalized for this alias. Direct write is not verified. | `dmgflag` is a direct alias that provides convenient ScriptCards access to the Beacon data described in the location column. | `Write not verified` |
| `dmgmod` | Direct alias: `dmgmod` | `COMPUTED` | Numeric compatibility/computed result. Direct write is not verified. | `dmgmod` is a direct alias that provides convenient ScriptCards access to the Beacon data described in the location column. | `Write not verified` |
| `dmgtype` | Direct alias: `dmgtype` | `COMPUTED` | String/formatted compatibility result. Direct write is not verified. | `dmgtype` is a direct alias that provides convenient ScriptCards access to the Beacon data described in the location column. | `Write not verified` |
| `hldmg` | Direct alias: `hldmg` | `COMPUTED` | Compatibility/synthetic result; exact output representation was not independently normalized for this alias. Direct write is not verified. | `hldmg` is a direct alias that provides convenient ScriptCards access to the Beacon data described in the location column. | `Write not verified` |

#### Roll and save output aliases

> **Value roles**
>
> - `COMPUTED` — A calculated or aggregated result. Change the named source input rather than writing the result.
>
> **Write using**
>
> - `Write not verified` — Use the alias for reads; no safe ScriptCards write target has been verified.

| Direct alias | ScriptCards read location | Value role | Values / writable domain | Description | Write using |
|---|---|---|---|---|---|
| `advantagetoggle` | Direct alias: `advantagetoggle`<br>Structured path: `sheet->settings->rolls->mode` | `COMPUTED` | Compatibility/synthetic result; exact output representation was not independently normalized for this alias. Direct write is not verified. | `advantagetoggle` is a direct alias that provides convenient ScriptCards access to the Beacon data described in the location column. | `Write not verified` |
| `core_die` | Direct alias: `core_die` | `COMPUTED` | Compatibility/synthetic result; exact output representation was not independently normalized for this alias. Direct write is not verified. | `core_die` is a direct alias that provides convenient ScriptCards access to the Beacon data described in the location column. | `Write not verified` |
| `d20` | Direct alias: `d20`<br>Structured path: `sheet->settings->rolls->mode` | `COMPUTED` | Compatibility/synthetic result; exact output representation was not independently normalized for this alias. Direct write is not verified. | `d20` is a direct alias that provides convenient ScriptCards access to the Beacon data described in the location column. | `Write not verified` |
| `dflag` | Direct alias: `dflag` | `COMPUTED` | Compatibility flag/state result; exact legacy representation (`0`/`1`, boolean, or sheet string) was not independently normalized for this alias. Direct write is not verified. | `dflag` is a direct alias that provides convenient ScriptCards access to the Beacon data described in the location column. | `Write not verified` |
| `rollbase` | Direct alias: `rollbase` | `COMPUTED` | Compatibility/synthetic result; exact output representation was not independently normalized for this alias. Direct write is not verified. | `rollbase` is a direct alias that provides convenient ScriptCards access to the Beacon data described in the location column. | `Write not verified` |
| `rollbase_crit` | Direct alias: `rollbase_crit` | `COMPUTED` | Compatibility/synthetic result; exact output representation was not independently normalized for this alias. Direct write is not verified. | `rollbase_crit` is a direct alias that provides convenient ScriptCards access to the Beacon data described in the location column. | `Write not verified` |
| `rollbase_dmg` | Direct alias: `rollbase_dmg` | `COMPUTED` | Compatibility/synthetic result; exact output representation was not independently normalized for this alias. Direct write is not verified. | `rollbase_dmg` is a direct alias that provides convenient ScriptCards access to the Beacon data described in the location column. | `Write not verified` |
| `rollcontent` | Direct alias: `rollcontent` | `COMPUTED` | String/formatted compatibility result. Direct write is not verified. | `rollcontent` is a direct alias that provides convenient ScriptCards access to the Beacon data described in the location column. | `Write not verified` |
| `rtype` | Direct alias: `rtype`<br>Structured path: `sheet->settings->rolls->mode` | `COMPUTED` | String/formatted compatibility result. Direct write is not verified. | `rtype` is a direct alias that provides convenient ScriptCards access to the Beacon data described in the location column. | `Write not verified` |
| `saveattr` | Direct alias: `saveattr` | `COMPUTED` | String/formatted compatibility result. Direct write is not verified. | `saveattr` is a direct alias that provides convenient ScriptCards access to the Beacon data described in the location column. | `Write not verified` |
| `savedc` | Direct alias: `savedc` | `COMPUTED` | Numeric compatibility/computed result. Direct write is not verified. | `savedc` is a direct alias that provides convenient ScriptCards access to the Beacon data described in the location column. | `Write not verified` |
| `saveeffect` | Direct alias: `saveeffect` | `COMPUTED` | Compatibility/synthetic result; exact output representation was not independently normalized for this alias. Direct write is not verified. | `saveeffect` is a direct alias that provides convenient ScriptCards access to the Beacon data described in the location column. | `Write not verified` |
| `saveflag` | Direct alias: `saveflag` | `COMPUTED` | Compatibility flag/state result; exact legacy representation (`0`/`1`, boolean, or sheet string) was not independently normalized for this alias. Direct write is not verified. | `saveflag` is a direct alias that provides convenient ScriptCards access to the Beacon data described in the location column. | `Write not verified` |
| `saveflat` | Direct alias: `saveflat` | `COMPUTED` | Numeric compatibility/computed result. Direct write is not verified. | `saveflat` is a direct alias that provides convenient ScriptCards access to the Beacon data described in the location column. | `Write not verified` |
| `whispertoggle` | Direct alias: `whispertoggle`<br>Structured path: `sheet->settings->rolls->privacy` | `COMPUTED` | Compatibility/synthetic result; exact output representation was not independently normalized for this alias. Direct write is not verified. | `whispertoggle` is a direct alias that provides convenient ScriptCards access to the Beacon data described in the location column. | `Write not verified` — Legacy roll-output formatting; use `sheet->settings->rolls->privacy` for new Beacon logic. |
| `wtype` | Direct alias: `wtype`<br>Structured path: `sheet->settings->rolls->privacy` | `COMPUTED` | String/formatted compatibility result. Direct write is not verified. | `wtype` is a direct alias that provides convenient ScriptCards access to the Beacon data described in the location column. | `Write not verified` — Legacy roll-output formatting; use `sheet->settings->rolls->privacy` for new Beacon logic. |

#### Repeating spells

> **Value roles**
>
> - `SYNTH` — A compatibility projection assembled from the parent and linked typed records named in the row.
> - `UNKNOWN` — The character-level direct alias is not exposed by the verified Beacon build.
>
> **Write using**
>
> - `Parent typed record` — Edit the existing record or records labeled `Parent typed record:` or `Parent typed records:` in the row.

| Direct alias | ScriptCards read location | Value role | Values / writable domain | Description | Write using |
|---|---|---|---|---|---|
| `caster_level` | Direct alias: `caster_level`<br>Parent typed records: `spells`; linked `spellcastings`, `attacks`, `damages`, `upcastings`, and `classlevels` as applicable | `SYNTH` | Numeric compatibility/computed result. To change the value, use the backing location named in **Write using**; its accepted values are documented in the corresponding structured/typed leaf table. | `caster_level` is a synthetic compatibility field generated from canonical Beacon records rather than an independent stored attribute. | `Parent typed record` |
| `spell_ability` | Character-level direct alias: not exposed in the verified Beacon build<br>Verified fallback result: missing `user.spell_ability` Custom Attribute<br>Canonical source: `spellcastings->[selector]->ability` | `UNKNOWN` | Unknown/unmapped value domain. Do not write; the current controlled sources did not establish a reliable Beacon source or value format. | A bare `spell_ability` read falls through to the classic custom-attribute fallback and produces a missing Custom Attribute error. Use the intended Spellcasting record's `ability`; a repeating-spell compatibility row may still expose its own row-level spell ability. | `Parent typed record` — Locate the intended Spellcasting record and change its `ability`. |
| `spell_attack_bonus` | Direct alias: `spell_attack_bonus`<br>Sheet-wide compatibility result; contributing records include `spellcastings`, `rollbonuses`, `abilityscores`, and `classlevels` as applicable | `SYNTH` | Numeric compatibility/computed result. To change the value, use the backing location named in **Write using**; its accepted values are documented in the corresponding structured/typed leaf table. | Singular sheet-wide compatibility result, not a separate attack bonus for every Spellcasting record. ScriptCards reconstructs it locally only when active Spellcasting records agree on one ability and applicable spell-targeted Roll Bonuses are verified roll-mode or flat numeric modifiers; otherwise the native sheet result remains authoritative. | `Parent typed record` — Change the intended Spellcasting record's `ability` or another contributing canonical input. Do not assume this singular alias represents every spellcasting source. |
| `spell_attack_mod` | Direct alias: `spell_attack_mod`<br>Locally reconstructed from the agreed sheet-wide Spellcasting ability when unambiguous; otherwise native compatibility result | `SYNTH` | Numeric compatibility/computed result. To change the value, use the backing location named in **Write using**; its accepted values are documented in the corresponding structured/typed leaf table. | Singular compatibility modifier paired with `spell_attack_bonus`; it is not a per-Spellcasting-record modifier on characters with multiple spellcasting sources. ScriptCards returns the selected casting ability modifier locally when active Spellcasting records agree on one ability. | `Parent typed record` — Change the intended Spellcasting record's `ability` or another contributing canonical input. |
| `spell_damage_progression` | Direct alias: `spell_damage_progression`<br>Parent typed records: `spells`; linked `spellcastings`, `attacks`, `damages`, `upcastings`, and `classlevels` as applicable | `SYNTH` | String/formatted compatibility result. To change the value, use the backing location named in **Write using**; its accepted values are documented in the corresponding structured/typed leaf table. | `spell_damage_progression` is a synthetic compatibility field generated from canonical Beacon records rather than an independent stored attribute. | `Parent typed record` |
| `spell_dc_mod` | Direct alias: `spell_dc_mod`<br>Locally reconstructed from the agreed sheet-wide Spellcasting ability when unambiguous; otherwise native compatibility result | `SYNTH` | Numeric compatibility/computed result. To change the value, use the backing location named in **Write using**; its accepted values are documented in the corresponding structured/typed leaf table. | Singular compatibility modifier paired with `spell_save_dc`; it is not a per-Spellcasting-record modifier on characters with multiple spellcasting sources. ScriptCards returns the selected casting ability modifier locally when active Spellcasting records agree on one ability, including numeric `0`. | `Parent typed record` — Change the intended Spellcasting record's `ability` or another contributing canonical input. |
| `spell_innate` | Direct alias: `spell_innate`<br>Parent typed records: `spells`; linked `spellcastings`, `attacks`, `damages`, `upcastings`, and `classlevels` as applicable | `SYNTH` | Compatibility/synthetic result; exact output representation was not independently normalized for this alias. To change the value, use the backing location named in **Write using**; its accepted values are documented in the corresponding structured/typed leaf table. | `spell_innate` is a synthetic compatibility field generated from canonical Beacon records rather than an independent stored attribute. | `Parent typed record` |
| `spell_save_dc` | Direct alias: `spell_save_dc`<br>Sheet-wide compatibility result; contributing records include `spellcastings`, `rollbonuses`, `abilityscores`, and `classlevels` as applicable | `SYNTH` | Numeric compatibility/computed result. To change the value, use the backing location named in **Write using**; its accepted values are documented in the corresponding structured/typed leaf table. | Singular sheet-wide compatibility result, not a separate save DC for every Spellcasting record. ScriptCards reconstructs it locally only when active Spellcasting records agree on one ability and applicable spell-targeted Roll Bonuses are verified roll-mode or flat numeric modifiers; otherwise the native sheet result remains authoritative. | `Parent typed record` — Change the intended Spellcasting record's `ability` or another contributing canonical input. Do not assume this singular alias represents every spellcasting source. |
| `spellathigherlevels` | Direct alias: `spellathigherlevels`<br>Parent typed records: `spells`; linked `spellcastings`, `attacks`, `damages`, `upcastings`, and `classlevels` as applicable | `SYNTH` | Compatibility/synthetic result; exact output representation was not independently normalized for this alias. To change the value, use the backing location named in **Write using**; its accepted values are documented in the corresponding structured/typed leaf table. | `spellathigherlevels` is a synthetic compatibility field generated from canonical Beacon records rather than an independent stored attribute. | `Parent typed record` |
| `spellattack` | Direct alias: `spellattack`<br>Parent typed records: `spells`; linked `spellcastings`, `attacks`, `damages`, `upcastings`, and `classlevels` as applicable | `SYNTH` | Compatibility/synthetic result; exact output representation was not independently normalized for this alias. To change the value, use the backing location named in **Write using**; its accepted values are documented in the corresponding structured/typed leaf table. | `spellattack` is a synthetic compatibility field generated from canonical Beacon records rather than an independent stored attribute. | `Parent typed record` |
| `spellattackid` | Direct alias: `spellattackid`<br>Parent typed records: `spells`; linked `spellcastings`, `attacks`, `damages`, `upcastings`, and `classlevels` as applicable | `SYNTH` | Compatibility/synthetic result; exact output representation was not independently normalized for this alias. To change the value, use the backing location named in **Write using**; its accepted values are documented in the corresponding structured/typed leaf table. | `spellattackid` is a synthetic compatibility field generated from canonical Beacon records rather than an independent stored attribute. | `Parent typed record` |
| `spellcasting_ability` | Direct alias: `spellcasting_ability`<br>Sheet-wide compatibility result derived from one selected Spellcasting profile | `SYNTH` | String/formatted compatibility result. To change the value, use the backing location named in **Write using**; its accepted values are documented in the corresponding structured/typed leaf table. | Singular modifier-like compatibility output, not the ability name for each Spellcasting record. Verified values included `3+` and `0+`; the alias followed the same selected profile as the sheet-wide spell attack and save DC values. | `Parent typed record` — Read or write the intended Spellcasting record's `ability` instead of treating this alias as a universal character-wide casting ability. |
| `spellcastingtime` | Direct alias: `spellcastingtime`<br>Parent typed records: `spells`; linked `spellcastings`, `attacks`, `damages`, `upcastings`, and `classlevels` as applicable | `SYNTH` | Compatibility/synthetic result; exact output representation was not independently normalized for this alias. To change the value, use the backing location named in **Write using**; its accepted values are documented in the corresponding structured/typed leaf table. | `spellcastingtime` is a synthetic compatibility field generated from canonical Beacon records rather than an independent stored attribute. | `Parent typed record` |
| `spellcomp` | Direct alias: `spellcomp`<br>Parent typed records: `spells`; linked `spellcastings`, `attacks`, `damages`, `upcastings`, and `classlevels` as applicable | `SYNTH` | Compatibility/synthetic result; exact output representation was not independently normalized for this alias. To change the value, use the backing location named in **Write using**; its accepted values are documented in the corresponding structured/typed leaf table. | `spellcomp` is a synthetic compatibility field generated from canonical Beacon records rather than an independent stored attribute. | `Parent typed record` |
| `spellcomp_m` | Direct alias: `spellcomp_m`<br>Parent typed records: `spells`; linked `spellcastings`, `attacks`, `damages`, `upcastings`, and `classlevels` as applicable | `SYNTH` | Compatibility/synthetic result; exact output representation was not independently normalized for this alias. To change the value, use the backing location named in **Write using**; its accepted values are documented in the corresponding structured/typed leaf table. | `spellcomp_m` is a synthetic compatibility field generated from canonical Beacon records rather than an independent stored attribute. | `Parent typed record` |
| `spellcomp_materials` | Direct alias: `spellcomp_materials`<br>Parent typed records: `spells`; linked `spellcastings`, `attacks`, `damages`, `upcastings`, and `classlevels` as applicable | `SYNTH` | Compatibility/synthetic result; exact output representation was not independently normalized for this alias. To change the value, use the backing location named in **Write using**; its accepted values are documented in the corresponding structured/typed leaf table. | `spellcomp_materials` is a synthetic compatibility field generated from canonical Beacon records rather than an independent stored attribute. | `Parent typed record` |
| `spellcomp_s` | Direct alias: `spellcomp_s`<br>Parent typed records: `spells`; linked `spellcastings`, `attacks`, `damages`, `upcastings`, and `classlevels` as applicable | `SYNTH` | Compatibility/synthetic result; exact output representation was not independently normalized for this alias. To change the value, use the backing location named in **Write using**; its accepted values are documented in the corresponding structured/typed leaf table. | `spellcomp_s` is a synthetic compatibility field generated from canonical Beacon records rather than an independent stored attribute. | `Parent typed record` |
| `spellcomp_v` | Direct alias: `spellcomp_v`<br>Parent typed records: `spells`; linked `spellcastings`, `attacks`, `damages`, `upcastings`, and `classlevels` as applicable | `SYNTH` | Compatibility/synthetic result; exact output representation was not independently normalized for this alias. To change the value, use the backing location named in **Write using**; its accepted values are documented in the corresponding structured/typed leaf table. | `spellcomp_v` is a synthetic compatibility field generated from canonical Beacon records rather than an independent stored attribute. | `Parent typed record` |
| `spellconcentration` | Direct alias: `spellconcentration`<br>Parent typed records: `spells`; linked `spellcastings`, `attacks`, `damages`, `upcastings`, and `classlevels` as applicable | `SYNTH` | Compatibility flag/state result; exact legacy representation (`0`/`1`, boolean, or sheet string) was not independently normalized for this alias. To change the value, use the backing location named in **Write using**; its accepted values are documented in the corresponding structured/typed leaf table. | `spellconcentration` is a synthetic compatibility field generated from canonical Beacon records rather than an independent stored attribute. | `Parent typed record` |
| `spelldamage` | Direct alias: `spelldamage`<br>Parent typed records: `spells`; linked `spellcastings`, `attacks`, `damages`, `upcastings`, and `classlevels` as applicable | `SYNTH` | String/formatted compatibility result. To change the value, use the backing location named in **Write using**; its accepted values are documented in the corresponding structured/typed leaf table. | `spelldamage` is a synthetic compatibility field generated from canonical Beacon records rather than an independent stored attribute. | `Parent typed record` |
| `spelldamage2` | Direct alias: `spelldamage2`<br>Parent typed records: `spells`; linked `spellcastings`, `attacks`, `damages`, `upcastings`, and `classlevels` as applicable | `SYNTH` | String/formatted compatibility result. To change the value, use the backing location named in **Write using**; its accepted values are documented in the corresponding structured/typed leaf table. | `spelldamage2` is a synthetic compatibility field generated from canonical Beacon records rather than an independent stored attribute. | `Parent typed record` |
| `spelldamagetype` | Direct alias: `spelldamagetype`<br>Parent typed records: `spells`; linked `spellcastings`, `attacks`, `damages`, `upcastings`, and `classlevels` as applicable | `SYNTH` | String/formatted compatibility result. To change the value, use the backing location named in **Write using**; its accepted values are documented in the corresponding structured/typed leaf table. | `spelldamagetype` is a synthetic compatibility field generated from canonical Beacon records rather than an independent stored attribute. | `Parent typed record` |
| `spelldamagetype2` | Direct alias: `spelldamagetype2`<br>Parent typed records: `spells`; linked `spellcastings`, `attacks`, `damages`, `upcastings`, and `classlevels` as applicable | `SYNTH` | String/formatted compatibility result. To change the value, use the backing location named in **Write using**; its accepted values are documented in the corresponding structured/typed leaf table. | `spelldamagetype2` is a synthetic compatibility field generated from canonical Beacon records rather than an independent stored attribute. | `Parent typed record` |
| `spelldescription` | Direct alias: `spelldescription`<br>Parent typed records: `spells`; linked `spellcastings`, `attacks`, `damages`, `upcastings`, and `classlevels` as applicable | `SYNTH` | String/formatted compatibility result. To change the value, use the backing location named in **Write using**; its accepted values are documented in the corresponding structured/typed leaf table. | `spelldescription` is a synthetic compatibility field generated from canonical Beacon records rather than an independent stored attribute. | `Parent typed record` |
| `spelldmgmod` | Direct alias: `spelldmgmod`<br>Parent typed records: `spells`; linked `spellcastings`, `attacks`, `damages`, `upcastings`, and `classlevels` as applicable | `SYNTH` | Numeric compatibility/computed result. To change the value, use the backing location named in **Write using**; its accepted values are documented in the corresponding structured/typed leaf table. | `spelldmgmod` is a synthetic compatibility field generated from canonical Beacon records rather than an independent stored attribute. | `Parent typed record` |
| `spellduration` | Direct alias: `spellduration`<br>Parent typed records: `spells`; linked `spellcastings`, `attacks`, `damages`, `upcastings`, and `classlevels` as applicable | `SYNTH` | Compatibility/synthetic result; exact output representation was not independently normalized for this alias. To change the value, use the backing location named in **Write using**; its accepted values are documented in the corresponding structured/typed leaf table. | `spellduration` is a synthetic compatibility field generated from canonical Beacon records rather than an independent stored attribute. | `Parent typed record` |
| `spellhealing` | Direct alias: `spellhealing`<br>Parent typed records: `spells`; linked `spellcastings`, `attacks`, `damages`, `upcastings`, and `classlevels` as applicable | `SYNTH` | Compatibility/synthetic result; exact output representation was not independently normalized for this alias. To change the value, use the backing location named in **Write using**; its accepted values are documented in the corresponding structured/typed leaf table. | `spellhealing` is a synthetic compatibility field generated from canonical Beacon records rather than an independent stored attribute. | `Parent typed record` |
| `spellhlbonus` | Direct alias: `spellhlbonus`<br>Parent typed records: `spells`; linked `spellcastings`, `attacks`, `damages`, `upcastings`, and `classlevels` as applicable | `SYNTH` | Numeric compatibility/computed result. To change the value, use the backing location named in **Write using**; its accepted values are documented in the corresponding structured/typed leaf table. | `spellhlbonus` is a synthetic compatibility field generated from canonical Beacon records rather than an independent stored attribute. | `Parent typed record` |
| `spellhldie` | Direct alias: `spellhldie`<br>Parent typed records: `spells`; linked `spellcastings`, `attacks`, `damages`, `upcastings`, and `classlevels` as applicable | `SYNTH` | Compatibility/synthetic result; exact output representation was not independently normalized for this alias. To change the value, use the backing location named in **Write using**; its accepted values are documented in the corresponding structured/typed leaf table. | `spellhldie` is a synthetic compatibility field generated from canonical Beacon records rather than an independent stored attribute. | `Parent typed record` |
| `spellhldietype` | Direct alias: `spellhldietype`<br>Parent typed records: `spells`; linked `spellcastings`, `attacks`, `damages`, `upcastings`, and `classlevels` as applicable | `SYNTH` | String/formatted compatibility result. To change the value, use the backing location named in **Write using**; its accepted values are documented in the corresponding structured/typed leaf table. | `spellhldietype` is a synthetic compatibility field generated from canonical Beacon records rather than an independent stored attribute. | `Parent typed record` |
| `spellicon_flag` | Direct alias: `spellicon_flag`<br>Parent typed records: `spells`; linked `spellcastings`, `attacks`, `damages`, `upcastings`, and `classlevels` as applicable | `SYNTH` | Compatibility flag/state result; exact legacy representation (`0`/`1`, boolean, or sheet string) was not independently normalized for this alias. To change the value, use the backing location named in **Write using**; its accepted values are documented in the corresponding structured/typed leaf table. | `spellicon_flag` is a synthetic compatibility field generated from canonical Beacon records rather than an independent stored attribute. | `Parent typed record` |
| `spellid` | Direct alias: `spellid`<br>Parent typed records: `spells`; linked `spellcastings`, `attacks`, `damages`, `upcastings`, and `classlevels` as applicable | `SYNTH` | Compatibility/synthetic result; exact output representation was not independently normalized for this alias. To change the value, use the backing location named in **Write using**; its accepted values are documented in the corresponding structured/typed leaf table. | `spellid` is a synthetic compatibility field generated from canonical Beacon records rather than an independent stored attribute. | `Parent typed record` |
| `spelllevel` | Direct alias: `spelllevel`<br>Parent typed records: `spells`; linked `spellcastings`, `attacks`, `damages`, `upcastings`, and `classlevels` as applicable | `SYNTH` | Numeric compatibility/computed result. To change the value, use the backing location named in **Write using**; its accepted values are documented in the corresponding structured/typed leaf table. | `spelllevel` is a synthetic compatibility field generated from canonical Beacon records rather than an independent stored attribute. | `Parent typed record` |
| `spellname` | Direct alias: `spellname`<br>Parent typed records: `spells`; linked `spellcastings`, `attacks`, `damages`, `upcastings`, and `classlevels` as applicable | `SYNTH` | String/formatted compatibility result. To change the value, use the backing location named in **Write using**; its accepted values are documented in the corresponding structured/typed leaf table. | `spellname` is a synthetic compatibility field generated from canonical Beacon records rather than an independent stored attribute. | `Parent typed record` |
| `spelloutput` | Direct alias: `spelloutput`<br>Parent typed records: `spells`; linked `spellcastings`, `attacks`, `damages`, `upcastings`, and `classlevels` as applicable | `SYNTH` | String/formatted compatibility result. To change the value, use the backing location named in **Write using**; its accepted values are documented in the corresponding structured/typed leaf table. | `spelloutput` is a synthetic compatibility field generated from canonical Beacon records rather than an independent stored attribute. | `Parent typed record` |
| `spellprepared` | Direct alias: `spellprepared`<br>Parent typed records: `spells`; linked `spellcastings`, `attacks`, `damages`, `upcastings`, and `classlevels` as applicable | `SYNTH` | Compatibility flag/state result; exact legacy representation (`0`/`1`, boolean, or sheet string) was not independently normalized for this alias. To change the value, use the backing location named in **Write using**; its accepted values are documented in the corresponding structured/typed leaf table. | `spellprepared` is a synthetic compatibility field generated from canonical Beacon records rather than an independent stored attribute. | `Parent typed record` |
| `spellrange` | Direct alias: `spellrange`<br>Parent typed records: `spells`; linked `spellcastings`, `attacks`, `damages`, `upcastings`, and `classlevels` as applicable | `SYNTH` | String/formatted compatibility result. To change the value, use the backing location named in **Write using**; its accepted values are documented in the corresponding structured/typed leaf table. | `spellrange` is a synthetic compatibility field generated from canonical Beacon records rather than an independent stored attribute. | `Parent typed record` |
| `spellritual` | Direct alias: `spellritual`<br>Parent typed records: `spells`; linked `spellcastings`, `attacks`, `damages`, `upcastings`, and `classlevels` as applicable | `SYNTH` | Compatibility flag/state result; exact legacy representation (`0`/`1`, boolean, or sheet string) was not independently normalized for this alias. To change the value, use the backing location named in **Write using**; its accepted values are documented in the corresponding structured/typed leaf table. | `spellritual` is a synthetic compatibility field generated from canonical Beacon records rather than an independent stored attribute. | `Parent typed record` |
| `spellsave` | Direct alias: `spellsave`<br>Parent typed records: `spells`; linked `spellcastings`, `attacks`, `damages`, `upcastings`, and `classlevels` as applicable | `SYNTH` | Compatibility/synthetic result; exact output representation was not independently normalized for this alias. To change the value, use the backing location named in **Write using**; its accepted values are documented in the corresponding structured/typed leaf table. | `spellsave` is a synthetic compatibility field generated from canonical Beacon records rather than an independent stored attribute. | `Parent typed record` |
| `spellsavesuccess` | Direct alias: `spellsavesuccess`<br>Parent typed records: `spells`; linked `spellcastings`, `attacks`, `damages`, `upcastings`, and `classlevels` as applicable | `SYNTH` | Compatibility/synthetic result; exact output representation was not independently normalized for this alias. To change the value, use the backing location named in **Write using**; its accepted values are documented in the corresponding structured/typed leaf table. | `spellsavesuccess` is a synthetic compatibility field generated from canonical Beacon records rather than an independent stored attribute. | `Parent typed record` |
| `spellschool` | Direct alias: `spellschool`<br>Parent typed records: `spells`; linked `spellcastings`, `attacks`, `damages`, `upcastings`, and `classlevels` as applicable | `SYNTH` | String/formatted compatibility result. To change the value, use the backing location named in **Write using**; its accepted values are documented in the corresponding structured/typed leaf table. | `spellschool` is a synthetic compatibility field generated from canonical Beacon records rather than an independent stored attribute. | `Parent typed record` |
| `spelltarget` | Direct alias: `spelltarget`<br>Parent typed records: `spells`; linked `spellcastings`, `attacks`, `damages`, `upcastings`, and `classlevels` as applicable | `SYNTH` | Compatibility/synthetic result; exact output representation was not independently normalized for this alias. To change the value, use the backing location named in **Write using**; its accepted values are documented in the corresponding structured/typed leaf table. | `spelltarget` is a synthetic compatibility field generated from canonical Beacon records rather than an independent stored attribute. | `Parent typed record` |

#### Inventory and repeating items

> **Value roles**
>
> - `SYNTH` — A compatibility projection assembled from the parent and linked typed records named in the row.
>
> **Write using**
>
> - `Parent typed record` — Edit the existing record or records labeled `Parent typed record:` or `Parent typed records:` in the row.

| Direct alias | ScriptCards read location | Value role | Values / writable domain | Description | Write using |
|---|---|---|---|---|---|
| `ammo` | Direct alias: `ammo`<br>Parent typed records: `items`; linked `attunements`, `attacks`, `damages`, `resources`, `armorclasses`, and `weaponmasteries` as applicable | `SYNTH` | String/formatted compatibility result. To change the value, use the backing location named in **Write using**; its accepted values are documented in the corresponding structured/typed leaf table. | `ammo` is a synthetic compatibility field generated from canonical Beacon records rather than an independent stored attribute. | `Parent typed record` |
| `ammotracking` | Direct alias: `ammotracking`<br>Parent typed records: `items`; linked `attunements`, `attacks`, `damages`, `resources`, `armorclasses`, and `weaponmasteries` as applicable | `SYNTH` | String/formatted compatibility result. To change the value, use the backing location named in **Write using**; its accepted values are documented in the corresponding structured/typed leaf table. | `ammotracking` is a synthetic compatibility field generated from canonical Beacon records rather than an independent stored attribute. | `Parent typed record` |
| `equipment` | Direct alias: `equipment`<br>Structured path: `sheet->inventory->equipmentDisplayOrder`<br>Parent typed records: `items`; linked `attunements`, `attacks`, `damages`, `resources`, `armorclasses`, and `weaponmasteries` as applicable | `SYNTH` | Compatibility/synthetic result; exact output representation was not independently normalized for this alias. To change the value, use the backing location named in **Write using**; its accepted values are documented in the corresponding structured/typed leaf table. | `equipment` is a synthetic compatibility field generated from canonical Beacon records rather than an independent stored attribute. | `Parent typed record` |
| `equipped` | Direct alias: `equipped`<br>Parent typed records: `items`; linked `attunements`, `attacks`, `damages`, `resources`, `armorclasses`, and `weaponmasteries` as applicable | `SYNTH` | Compatibility flag/state result; exact legacy representation (`0`/`1`, boolean, or sheet string) was not independently normalized for this alias. To change the value, use the backing location named in **Write using**; its accepted values are documented in the corresponding structured/typed leaf table. | `equipped` is a synthetic compatibility field generated from canonical Beacon records rather than an independent stored attribute. | `Parent typed record` |
| `inventorysubflag` | Direct alias: `inventorysubflag`<br>Parent typed records: `items`; linked `attunements`, `attacks`, `damages`, `resources`, `armorclasses`, and `weaponmasteries` as applicable | `SYNTH` | Compatibility flag/state result; exact legacy representation (`0`/`1`, boolean, or sheet string) was not independently normalized for this alias. To change the value, use the backing location named in **Write using**; its accepted values are documented in the corresponding structured/typed leaf table. | `inventorysubflag` is a synthetic compatibility field generated from canonical Beacon records rather than an independent stored attribute. | `Parent typed record` |
| `itemattackid` | Direct alias: `itemattackid`<br>Parent typed records: `items`; linked `attunements`, `attacks`, `damages`, `resources`, `armorclasses`, and `weaponmasteries` as applicable | `SYNTH` | Compatibility/synthetic result; exact output representation was not independently normalized for this alias. To change the value, use the backing location named in **Write using**; its accepted values are documented in the corresponding structured/typed leaf table. | `itemattackid` is a synthetic compatibility field generated from canonical Beacon records rather than an independent stored attribute. | `Parent typed record` |
| `itemcontent` | Direct alias: `itemcontent`<br>Parent typed records: `items`; linked `attunements`, `attacks`, `damages`, `resources`, `armorclasses`, and `weaponmasteries` as applicable | `SYNTH` | String/formatted compatibility result. To change the value, use the backing location named in **Write using**; its accepted values are documented in the corresponding structured/typed leaf table. | `itemcontent` is a synthetic compatibility field generated from canonical Beacon records rather than an independent stored attribute. | `Parent typed record` |
| `itemcount` | Direct alias: `itemcount`<br>Parent typed records: `items`; linked `attunements`, `attacks`, `damages`, `resources`, `armorclasses`, and `weaponmasteries` as applicable | `SYNTH` | Numeric compatibility/computed result. To change the value, use the backing location named in **Write using**; its accepted values are documented in the corresponding structured/typed leaf table. | `itemcount` is a synthetic compatibility field generated from canonical Beacon records rather than an independent stored attribute. | `Parent typed record` |
| `itemid` | Direct alias: `itemid`<br>Parent typed records: `items`; linked `attunements`, `attacks`, `damages`, `resources`, `armorclasses`, and `weaponmasteries` as applicable | `SYNTH` | Compatibility/synthetic result; exact output representation was not independently normalized for this alias. To change the value, use the backing location named in **Write using**; its accepted values are documented in the corresponding structured/typed leaf table. | `itemid` is a synthetic compatibility field generated from canonical Beacon records rather than an independent stored attribute. | `Parent typed record` |
| `itemmodifiers` | Direct alias: `itemmodifiers`<br>Parent typed records: `items`; linked `attunements`, `attacks`, `damages`, `resources`, `armorclasses`, and `weaponmasteries` as applicable | `SYNTH` | Compatibility/synthetic result; exact output representation was not independently normalized for this alias. To change the value, use the backing location named in **Write using**; its accepted values are documented in the corresponding structured/typed leaf table. | `itemmodifiers` is a synthetic compatibility field generated from canonical Beacon records rather than an independent stored attribute. | `Parent typed record` |
| `itemname` | Direct alias: `itemname`<br>Parent typed records: `items`; linked `attunements`, `attacks`, `damages`, `resources`, `armorclasses`, and `weaponmasteries` as applicable | `SYNTH` | String/formatted compatibility result. To change the value, use the backing location named in **Write using**; its accepted values are documented in the corresponding structured/typed leaf table. | `itemname` is a synthetic compatibility field generated from canonical Beacon records rather than an independent stored attribute. | `Parent typed record` |
| `itemproperties` | Direct alias: `itemproperties`<br>Parent typed records: `items`; linked `attunements`, `attacks`, `damages`, `resources`, `armorclasses`, and `weaponmasteries` as applicable | `SYNTH` | String/formatted compatibility result. To change the value, use the backing location named in **Write using**; its accepted values are documented in the corresponding structured/typed leaf table. | `itemproperties` is a synthetic compatibility field generated from canonical Beacon records rather than an independent stored attribute. | `Parent typed record` |
| `itemresourceid` | Direct alias: `itemresourceid`<br>Parent typed records: `items`; linked `attunements`, `attacks`, `damages`, `resources`, `armorclasses`, and `weaponmasteries` as applicable | `SYNTH` | String/formatted compatibility result. To change the value, use the backing location named in **Write using**; its accepted values are documented in the corresponding structured/typed leaf table. | `itemresourceid` is a synthetic compatibility field generated from canonical Beacon records rather than an independent stored attribute. | `Parent typed record` |
| `itemweight` | Direct alias: `itemweight`<br>Parent typed records: `items`; linked `attunements`, `attacks`, `damages`, `resources`, `armorclasses`, and `weaponmasteries` as applicable | `SYNTH` | Numeric compatibility/computed result. To change the value, use the backing location named in **Write using**; its accepted values are documented in the corresponding structured/typed leaf table. | `itemweight` is a synthetic compatibility field generated from canonical Beacon records rather than an independent stored attribute. | `Parent typed record` |
| `simpleinventory` | Direct alias: `simpleinventory`<br>Structured path: `sheet->settings->layoutState`<br>Parent typed records: `items`; linked `attunements`, `attacks`, `damages`, `resources`, `armorclasses`, and `weaponmasteries` as applicable | `SYNTH` | Compatibility/synthetic result; exact output representation was not independently normalized for this alias. To change the value, use the backing location named in **Write using**; its accepted values are documented in the corresponding structured/typed leaf table. | `simpleinventory` is a synthetic compatibility field generated from canonical Beacon records rather than an independent stored attribute. | `Parent typed record` |
| `treasure` | Direct alias: `treasure`<br>Parent typed records: `items`; linked `attunements`, `attacks`, `damages`, `resources`, `armorclasses`, and `weaponmasteries` as applicable | `SYNTH` | Compatibility/synthetic result; exact output representation was not independently normalized for this alias. To change the value, use the backing location named in **Write using**; its accepted values are documented in the corresponding structured/typed leaf table. | `treasure` is a synthetic compatibility field generated from canonical Beacon records rather than an independent stored attribute. | `Parent typed record` — Synthetic compatibility value; for direct NPC Treasure text use `sheet->npc->treasure`. |
| `useasresource` | Direct alias: `useasresource`<br>Parent typed records: `items`; linked `attunements`, `attacks`, `damages`, `resources`, `armorclasses`, and `weaponmasteries` as applicable | `SYNTH` | String/formatted compatibility result. To change the value, use the backing location named in **Write using**; its accepted values are documented in the corresponding structured/typed leaf table. | `useasresource` is a synthetic compatibility field generated from canonical Beacon records rather than an independent stored attribute. | `Parent typed record` |
| `weighttotal` | Direct alias: `weighttotal`<br>Parent typed records: `items`; linked `attunements`, `attacks`, `damages`, `resources`, `armorclasses`, and `weaponmasteries` as applicable | `SYNTH` | Compatibility/synthetic result; exact output representation was not independently normalized for this alias. To change the value, use the backing location named in **Write using**; its accepted values are documented in the corresponding structured/typed leaf table. | `weighttotal` is a synthetic compatibility field generated from canonical Beacon records rather than an independent stored attribute. | `Parent typed record` |

#### Resources

> **Value roles**
>
> - `COMPUTED` — A calculated or aggregated result. Change the named source input rather than writing the result.
>
> **Write using**
>
> - `Write not verified` — Use the alias for reads; no safe ScriptCards write target has been verified.

| Direct alias | ScriptCards read location | Value role | Values / writable domain | Description | Write using |
|---|---|---|---|---|---|
| `class_resource` | Direct alias: `class_resource` | `COMPUTED` | String/formatted compatibility result. Direct write is not verified. | `class_resource` is a direct alias that provides convenient ScriptCards access to the Beacon data described in the location column. | `Write not verified` |
| `class_resource_max` | Direct alias: `class_resource_max` | `COMPUTED` | Numeric compatibility/computed result. Direct write is not verified. | `class_resource_max` is a direct alias that provides convenient ScriptCards access to the Beacon data described in the location column. | `Write not verified` |
| `class_resource_name` | Direct alias: `class_resource_name` | `COMPUTED` | String/formatted compatibility result. Direct write is not verified. | `class_resource_name` is a direct alias that provides convenient ScriptCards access to the Beacon data described in the location column. | `Write not verified` |
| `other_resource` | Direct alias: `other_resource` | `COMPUTED` | String/formatted compatibility result. Direct write is not verified. | `other_resource` is a direct alias that provides convenient ScriptCards access to the Beacon data described in the location column. | `Write not verified` |
| `other_resource_itemid` | Direct alias: `other_resource_itemid` | `COMPUTED` | String/formatted compatibility result. Direct write is not verified. | `other_resource_itemid` is a direct alias that provides convenient ScriptCards access to the Beacon data described in the location column. | `Write not verified` |
| `other_resource_max` | Direct alias: `other_resource_max` | `COMPUTED` | Numeric compatibility/computed result. Direct write is not verified. | `other_resource_max` is a direct alias that provides convenient ScriptCards access to the Beacon data described in the location column. | `Write not verified` |
| `other_resource_name` | Direct alias: `other_resource_name` | `COMPUTED` | String/formatted compatibility result. Direct write is not verified. | `other_resource_name` is a direct alias that provides convenient ScriptCards access to the Beacon data described in the location column. | `Write not verified` |
| `resource_left` | Direct alias: `resource_left` | `COMPUTED` | String/formatted compatibility result. Direct write is not verified. | `resource_left` is a direct alias that provides convenient ScriptCards access to the Beacon data described in the location column. | `Write not verified` |
| `resource_left_itemid` | Direct alias: `resource_left_itemid` | `COMPUTED` | String/formatted compatibility result. Direct write is not verified. | `resource_left_itemid` is a direct alias that provides convenient ScriptCards access to the Beacon data described in the location column. | `Write not verified` |
| `resource_left_max` | Direct alias: `resource_left_max` | `COMPUTED` | Numeric compatibility/computed result. Direct write is not verified. | `resource_left_max` is a direct alias that provides convenient ScriptCards access to the Beacon data described in the location column. | `Write not verified` |
| `resource_left_name` | Direct alias: `resource_left_name` | `COMPUTED` | String/formatted compatibility result. Direct write is not verified. | `resource_left_name` is a direct alias that provides convenient ScriptCards access to the Beacon data described in the location column. | `Write not verified` |
| `resource_right` | Direct alias: `resource_right` | `COMPUTED` | String/formatted compatibility result. Direct write is not verified. | `resource_right` is a direct alias that provides convenient ScriptCards access to the Beacon data described in the location column. | `Write not verified` |
| `resource_right_itemid` | Direct alias: `resource_right_itemid` | `COMPUTED` | String/formatted compatibility result. Direct write is not verified. | `resource_right_itemid` is a direct alias that provides convenient ScriptCards access to the Beacon data described in the location column. | `Write not verified` |
| `resource_right_max` | Direct alias: `resource_right_max` | `COMPUTED` | Numeric compatibility/computed result. Direct write is not verified. | `resource_right_max` is a direct alias that provides convenient ScriptCards access to the Beacon data described in the location column. | `Write not verified` |
| `resource_right_name` | Direct alias: `resource_right_name` | `COMPUTED` | String/formatted compatibility result. Direct write is not verified. | `resource_right_name` is a direct alias that provides convenient ScriptCards access to the Beacon data described in the location column. | `Write not verified` |

#### Ability scores and saving throws

> **Value roles**
>
> - `COMPUTED` — A calculated or aggregated result. Change the named source input rather than writing the result.
>
> **Write using**
>
> - `Typed collection` — Locate the matching existing record through the location labeled `Typed collection:` or `Typed collections:` in the row. When the row names a field, write that field; otherwise use the corresponding typed-collection table below to choose the existing primitive field that represents the intended change.

| Direct alias | ScriptCards read location | Value role | Values / writable domain | Description | Write using |
|---|---|---|---|---|---|
| `charisma_save_prof` | Direct alias: `charisma_save_prof`<br>Typed collection: `proficiencies->[selector]->proficiencyLevel`<br>Match: `category = Saving Throw`; `proficiency = Charisma` | `COMPUTED` | Compatibility flag/state result; exact legacy representation (`0`/`1`, boolean, or sheet string) was not independently normalized for this alias. To change the value, use the backing location named in **Write using**; its accepted values are documented in the corresponding structured/typed leaf table. | `charisma_save_prof` is a derived proficiency-presence flag from the matching Saving Throw Proficiency record. | `Typed collection` |
| `constitution_save_prof` | Direct alias: `constitution_save_prof`<br>Typed collection: `proficiencies->[selector]->proficiencyLevel`<br>Match: `category = Saving Throw`; `proficiency = Constitution` | `COMPUTED` | Compatibility flag/state result; exact legacy representation (`0`/`1`, boolean, or sheet string) was not independently normalized for this alias. To change the value, use the backing location named in **Write using**; its accepted values are documented in the corresponding structured/typed leaf table. | `constitution_save_prof` is a derived proficiency-presence flag from the matching Saving Throw Proficiency record. | `Typed collection` |
| `dexterity_save_prof` | Direct alias: `dexterity_save_prof`<br>Typed collection: `proficiencies->[selector]->proficiencyLevel`<br>Match: `category = Saving Throw`; `proficiency = Dexterity` | `COMPUTED` | Compatibility flag/state result; exact legacy representation (`0`/`1`, boolean, or sheet string) was not independently normalized for this alias. To change the value, use the backing location named in **Write using**; its accepted values are documented in the corresponding structured/typed leaf table. | `dexterity_save_prof` is a derived proficiency-presence flag from the matching Saving Throw Proficiency record. | `Typed collection` |
| `intelligence_save_prof` | Direct alias: `intelligence_save_prof`<br>Typed collection: `proficiencies->[selector]->proficiencyLevel`<br>Match: `category = Saving Throw`; `proficiency = Intelligence` | `COMPUTED` | Compatibility flag/state result; exact legacy representation (`0`/`1`, boolean, or sheet string) was not independently normalized for this alias. To change the value, use the backing location named in **Write using**; its accepted values are documented in the corresponding structured/typed leaf table. | `intelligence_save_prof` is a derived proficiency-presence flag from the matching Saving Throw Proficiency record. | `Typed collection` |
| `strength_save_prof` | Direct alias: `strength_save_prof`<br>Typed collection: `proficiencies->[selector]->proficiencyLevel`<br>Match: `category = Saving Throw`; `proficiency = Strength` | `COMPUTED` | Compatibility flag/state result; exact legacy representation (`0`/`1`, boolean, or sheet string) was not independently normalized for this alias. To change the value, use the backing location named in **Write using**; its accepted values are documented in the corresponding structured/typed leaf table. | `strength_save_prof` is a derived proficiency-presence flag from the matching Saving Throw Proficiency record. | `Typed collection` |
| `wisdom_save_prof` | Direct alias: `wisdom_save_prof`<br>Typed collection: `proficiencies->[selector]->proficiencyLevel`<br>Match: `category = Saving Throw`; `proficiency = Wisdom` | `COMPUTED` | Compatibility flag/state result; exact legacy representation (`0`/`1`, boolean, or sheet string) was not independently normalized for this alias. To change the value, use the backing location named in **Write using**; its accepted values are documented in the corresponding structured/typed leaf table. | `wisdom_save_prof` is a derived proficiency-presence flag from the matching Saving Throw Proficiency record. | `Typed collection` |

#### Skills and passive checks

> **Value roles**
>
> - `COMPUTED` — A calculated or aggregated result. Change the named source input rather than writing the result.
>
> **Write using**
>
> - `Typed collection` — Locate the matching existing record through the location labeled `Typed collection:` or `Typed collections:` in the row. When the row names a field, write that field; otherwise use the corresponding typed-collection table below to choose the existing primitive field that represents the intended change.

| Direct alias | ScriptCards read location | Value role | Values / writable domain | Description | Write using |
|---|---|---|---|---|---|
| `acrobatics_prof` | Direct alias: `acrobatics_prof`<br>Typed collection: `proficiencies->[selector]->proficiencyLevel`<br>Match: `category = Skill`; `proficiency = Acrobatics` | `COMPUTED` | Compatibility flag/state result; exact legacy representation (`0`/`1`, boolean, or sheet string) was not independently normalized for this alias. To change the value, use the backing location named in **Write using**; its accepted values are documented in the corresponding structured/typed leaf table. | `acrobatics_prof` is a derived proficiency-presence flag from the matching Skill Proficiency record. | `Typed collection` |
| `acrobatics_type` | Direct alias: `acrobatics_type`<br>Typed collection: `proficiencies->[selector]->proficiencyLevel`<br>Match: `category = Skill`; `proficiency = Acrobatics` | `COMPUTED` | String/formatted compatibility result. To change the value, use the backing location named in **Write using**; its accepted values are documented in the corresponding structured/typed leaf table. | `acrobatics_type` is a derived proficiency-tier code from `proficiencyLevel`; `2` was observed for Expertise. | `Typed collection` |
| `animal_handling_prof` | Direct alias: `animal_handling_prof`<br>Typed collection: `proficiencies->[selector]->proficiencyLevel`<br>Match: `category = Skill`; `proficiency = Animal Handling` | `COMPUTED` | Compatibility flag/state result; exact legacy representation (`0`/`1`, boolean, or sheet string) was not independently normalized for this alias. To change the value, use the backing location named in **Write using**; its accepted values are documented in the corresponding structured/typed leaf table. | `animal_handling_prof` is a derived proficiency-presence flag from the matching Skill Proficiency record. | `Typed collection` |
| `animal_handling_type` | Direct alias: `animal_handling_type`<br>Typed collection: `proficiencies->[selector]->proficiencyLevel`<br>Match: `category = Skill`; `proficiency = Animal Handling` | `COMPUTED` | String/formatted compatibility result. To change the value, use the backing location named in **Write using**; its accepted values are documented in the corresponding structured/typed leaf table. | `animal_handling_type` is a derived proficiency-tier code from `proficiencyLevel`; `2` was observed for Expertise. | `Typed collection` |
| `arcana_prof` | Direct alias: `arcana_prof`<br>Typed collection: `proficiencies->[selector]->proficiencyLevel`<br>Match: `category = Skill`; `proficiency = Arcana` | `COMPUTED` | Compatibility flag/state result; exact legacy representation (`0`/`1`, boolean, or sheet string) was not independently normalized for this alias. To change the value, use the backing location named in **Write using**; its accepted values are documented in the corresponding structured/typed leaf table. | `arcana_prof` is a derived proficiency-presence flag from the matching Skill Proficiency record. | `Typed collection` |
| `arcana_type` | Direct alias: `arcana_type`<br>Typed collection: `proficiencies->[selector]->proficiencyLevel`<br>Match: `category = Skill`; `proficiency = Arcana` | `COMPUTED` | String/formatted compatibility result. To change the value, use the backing location named in **Write using**; its accepted values are documented in the corresponding structured/typed leaf table. | `arcana_type` is a derived proficiency-tier code from `proficiencyLevel`; `2` was observed for Expertise. | `Typed collection` |
| `athletics_prof` | Direct alias: `athletics_prof`<br>Typed collection: `proficiencies->[selector]->proficiencyLevel`<br>Match: `category = Skill`; `proficiency = Athletics` | `COMPUTED` | Compatibility flag/state result; exact legacy representation (`0`/`1`, boolean, or sheet string) was not independently normalized for this alias. To change the value, use the backing location named in **Write using**; its accepted values are documented in the corresponding structured/typed leaf table. | `athletics_prof` is a derived proficiency-presence flag from the matching Skill Proficiency record. | `Typed collection` |
| `athletics_type` | Direct alias: `athletics_type`<br>Typed collection: `proficiencies->[selector]->proficiencyLevel`<br>Match: `category = Skill`; `proficiency = Athletics` | `COMPUTED` | String/formatted compatibility result. To change the value, use the backing location named in **Write using**; its accepted values are documented in the corresponding structured/typed leaf table. | `athletics_type` is a derived proficiency-tier code from `proficiencyLevel`; `2` was observed for Expertise. | `Typed collection` |
| `deception_prof` | Direct alias: `deception_prof`<br>Typed collection: `proficiencies->[selector]->proficiencyLevel`<br>Match: `category = Skill`; `proficiency = Deception` | `COMPUTED` | Compatibility flag/state result; exact legacy representation (`0`/`1`, boolean, or sheet string) was not independently normalized for this alias. To change the value, use the backing location named in **Write using**; its accepted values are documented in the corresponding structured/typed leaf table. | `deception_prof` is a derived proficiency-presence flag from the matching Skill Proficiency record. | `Typed collection` |
| `deception_type` | Direct alias: `deception_type`<br>Typed collection: `proficiencies->[selector]->proficiencyLevel`<br>Match: `category = Skill`; `proficiency = Deception` | `COMPUTED` | String/formatted compatibility result. To change the value, use the backing location named in **Write using**; its accepted values are documented in the corresponding structured/typed leaf table. | `deception_type` is a derived proficiency-tier code from `proficiencyLevel`; `2` was observed for Expertise. | `Typed collection` |
| `history_prof` | Direct alias: `history_prof`<br>Typed collection: `proficiencies->[selector]->proficiencyLevel`<br>Match: `category = Skill`; `proficiency = History` | `COMPUTED` | Compatibility flag/state result; exact legacy representation (`0`/`1`, boolean, or sheet string) was not independently normalized for this alias. To change the value, use the backing location named in **Write using**; its accepted values are documented in the corresponding structured/typed leaf table. | `history_prof` is a derived proficiency-presence flag from the matching Skill Proficiency record. | `Typed collection` |
| `history_type` | Direct alias: `history_type`<br>Typed collection: `proficiencies->[selector]->proficiencyLevel`<br>Match: `category = Skill`; `proficiency = History` | `COMPUTED` | String/formatted compatibility result. To change the value, use the backing location named in **Write using**; its accepted values are documented in the corresponding structured/typed leaf table. | `history_type` is a derived proficiency-tier code from `proficiencyLevel`; `2` was observed for Expertise. | `Typed collection` |
| `insight_prof` | Direct alias: `insight_prof`<br>Typed collection: `proficiencies->[selector]->proficiencyLevel`<br>Match: `category = Skill`; `proficiency = Insight` | `COMPUTED` | Compatibility flag/state result; exact legacy representation (`0`/`1`, boolean, or sheet string) was not independently normalized for this alias. To change the value, use the backing location named in **Write using**; its accepted values are documented in the corresponding structured/typed leaf table. | `insight_prof` is a derived proficiency-presence flag from the matching Skill Proficiency record. | `Typed collection` |
| `insight_type` | Direct alias: `insight_type`<br>Typed collection: `proficiencies->[selector]->proficiencyLevel`<br>Match: `category = Skill`; `proficiency = Insight` | `COMPUTED` | String/formatted compatibility result. To change the value, use the backing location named in **Write using**; its accepted values are documented in the corresponding structured/typed leaf table. | `insight_type` is a derived proficiency-tier code from `proficiencyLevel`; `2` was observed for Expertise. | `Typed collection` |
| `intimidation_prof` | Direct alias: `intimidation_prof`<br>Typed collection: `proficiencies->[selector]->proficiencyLevel`<br>Match: `category = Skill`; `proficiency = Intimidation` | `COMPUTED` | Compatibility flag/state result; exact legacy representation (`0`/`1`, boolean, or sheet string) was not independently normalized for this alias. To change the value, use the backing location named in **Write using**; its accepted values are documented in the corresponding structured/typed leaf table. | `intimidation_prof` is a derived proficiency-presence flag from the matching Skill Proficiency record. | `Typed collection` |
| `intimidation_type` | Direct alias: `intimidation_type`<br>Typed collection: `proficiencies->[selector]->proficiencyLevel`<br>Match: `category = Skill`; `proficiency = Intimidation` | `COMPUTED` | String/formatted compatibility result. To change the value, use the backing location named in **Write using**; its accepted values are documented in the corresponding structured/typed leaf table. | `intimidation_type` is a derived proficiency-tier code from `proficiencyLevel`; `2` was observed for Expertise. | `Typed collection` |
| `investigation_prof` | Direct alias: `investigation_prof`<br>Typed collection: `proficiencies->[selector]->proficiencyLevel`<br>Match: `category = Skill`; `proficiency = Investigation` | `COMPUTED` | Compatibility flag/state result; exact legacy representation (`0`/`1`, boolean, or sheet string) was not independently normalized for this alias. To change the value, use the backing location named in **Write using**; its accepted values are documented in the corresponding structured/typed leaf table. | `investigation_prof` is a derived proficiency-presence flag from the matching Skill Proficiency record. | `Typed collection` |
| `investigation_type` | Direct alias: `investigation_type`<br>Typed collection: `proficiencies->[selector]->proficiencyLevel`<br>Match: `category = Skill`; `proficiency = Investigation` | `COMPUTED` | String/formatted compatibility result. To change the value, use the backing location named in **Write using**; its accepted values are documented in the corresponding structured/typed leaf table. | `investigation_type` is a derived proficiency-tier code from `proficiencyLevel`; `2` was observed for Expertise. | `Typed collection` |
| `medicine_prof` | Direct alias: `medicine_prof`<br>Typed collection: `proficiencies->[selector]->proficiencyLevel`<br>Match: `category = Skill`; `proficiency = Medicine` | `COMPUTED` | Compatibility flag/state result; exact legacy representation (`0`/`1`, boolean, or sheet string) was not independently normalized for this alias. To change the value, use the backing location named in **Write using**; its accepted values are documented in the corresponding structured/typed leaf table. | `medicine_prof` is a derived proficiency-presence flag from the matching Skill Proficiency record. | `Typed collection` |
| `medicine_type` | Direct alias: `medicine_type`<br>Typed collection: `proficiencies->[selector]->proficiencyLevel`<br>Match: `category = Skill`; `proficiency = Medicine` | `COMPUTED` | String/formatted compatibility result. To change the value, use the backing location named in **Write using**; its accepted values are documented in the corresponding structured/typed leaf table. | `medicine_type` is a derived proficiency-tier code from `proficiencyLevel`; `2` was observed for Expertise. | `Typed collection` |
| `nature_prof` | Direct alias: `nature_prof`<br>Typed collection: `proficiencies->[selector]->proficiencyLevel`<br>Match: `category = Skill`; `proficiency = Nature` | `COMPUTED` | Compatibility flag/state result; exact legacy representation (`0`/`1`, boolean, or sheet string) was not independently normalized for this alias. To change the value, use the backing location named in **Write using**; its accepted values are documented in the corresponding structured/typed leaf table. | `nature_prof` is a derived proficiency-presence flag from the matching Skill Proficiency record. | `Typed collection` |
| `nature_type` | Direct alias: `nature_type`<br>Typed collection: `proficiencies->[selector]->proficiencyLevel`<br>Match: `category = Skill`; `proficiency = Nature` | `COMPUTED` | String/formatted compatibility result. To change the value, use the backing location named in **Write using**; its accepted values are documented in the corresponding structured/typed leaf table. | `nature_type` is a derived proficiency-tier code from `proficiencyLevel`; `2` was observed for Expertise. | `Typed collection` |
| `perception_prof` | Direct alias: `perception_prof`<br>Typed collection: `proficiencies->[selector]->proficiencyLevel`<br>Match: `category = Skill`; `proficiency = Perception` | `COMPUTED` | Compatibility flag/state result; exact legacy representation (`0`/`1`, boolean, or sheet string) was not independently normalized for this alias. To change the value, use the backing location named in **Write using**; its accepted values are documented in the corresponding structured/typed leaf table. | `perception_prof` is a derived proficiency-presence flag from the matching Skill Proficiency record. | `Typed collection` |
| `perception_type` | Direct alias: `perception_type`<br>Typed collection: `proficiencies->[selector]->proficiencyLevel`<br>Match: `category = Skill`; `proficiency = Perception` | `COMPUTED` | String/formatted compatibility result. To change the value, use the backing location named in **Write using**; its accepted values are documented in the corresponding structured/typed leaf table. | `perception_type` is a derived proficiency-tier code from `proficiencyLevel`; `2` was observed for Expertise. | `Typed collection` |
| `performance_prof` | Direct alias: `performance_prof`<br>Typed collection: `proficiencies->[selector]->proficiencyLevel`<br>Match: `category = Skill`; `proficiency = Performance` | `COMPUTED` | Compatibility flag/state result; exact legacy representation (`0`/`1`, boolean, or sheet string) was not independently normalized for this alias. To change the value, use the backing location named in **Write using**; its accepted values are documented in the corresponding structured/typed leaf table. | `performance_prof` is a derived proficiency-presence flag from the matching Skill Proficiency record. | `Typed collection` |
| `performance_type` | Direct alias: `performance_type`<br>Typed collection: `proficiencies->[selector]->proficiencyLevel`<br>Match: `category = Skill`; `proficiency = Performance` | `COMPUTED` | String/formatted compatibility result. To change the value, use the backing location named in **Write using**; its accepted values are documented in the corresponding structured/typed leaf table. | `performance_type` is a derived proficiency-tier code from `proficiencyLevel`; `2` was observed for Expertise. | `Typed collection` |
| `persuasion_prof` | Direct alias: `persuasion_prof`<br>Typed collection: `proficiencies->[selector]->proficiencyLevel`<br>Match: `category = Skill`; `proficiency = Persuasion` | `COMPUTED` | Compatibility flag/state result; exact legacy representation (`0`/`1`, boolean, or sheet string) was not independently normalized for this alias. To change the value, use the backing location named in **Write using**; its accepted values are documented in the corresponding structured/typed leaf table. | `persuasion_prof` is a derived proficiency-presence flag from the matching Skill Proficiency record. | `Typed collection` |
| `persuasion_type` | Direct alias: `persuasion_type`<br>Typed collection: `proficiencies->[selector]->proficiencyLevel`<br>Match: `category = Skill`; `proficiency = Persuasion` | `COMPUTED` | String/formatted compatibility result. To change the value, use the backing location named in **Write using**; its accepted values are documented in the corresponding structured/typed leaf table. | `persuasion_type` is a derived proficiency-tier code from `proficiencyLevel`; `2` was observed for Expertise. | `Typed collection` |
| `religion_prof` | Direct alias: `religion_prof`<br>Typed collection: `proficiencies->[selector]->proficiencyLevel`<br>Match: `category = Skill`; `proficiency = Religion` | `COMPUTED` | Compatibility flag/state result; exact legacy representation (`0`/`1`, boolean, or sheet string) was not independently normalized for this alias. To change the value, use the backing location named in **Write using**; its accepted values are documented in the corresponding structured/typed leaf table. | `religion_prof` is a derived proficiency-presence flag from the matching Skill Proficiency record. | `Typed collection` |
| `religion_type` | Direct alias: `religion_type`<br>Typed collection: `proficiencies->[selector]->proficiencyLevel`<br>Match: `category = Skill`; `proficiency = Religion` | `COMPUTED` | String/formatted compatibility result. To change the value, use the backing location named in **Write using**; its accepted values are documented in the corresponding structured/typed leaf table. | `religion_type` is a derived proficiency-tier code from `proficiencyLevel`; `2` was observed for Expertise. | `Typed collection` |
| `sleight_of_hand_prof` | Direct alias: `sleight_of_hand_prof`<br>Typed collection: `proficiencies->[selector]->proficiencyLevel`<br>Match: `category = Skill`; `proficiency = Sleight of Hand` | `COMPUTED` | Compatibility flag/state result; exact legacy representation (`0`/`1`, boolean, or sheet string) was not independently normalized for this alias. To change the value, use the backing location named in **Write using**; its accepted values are documented in the corresponding structured/typed leaf table. | `sleight_of_hand_prof` is a derived proficiency-presence flag from the matching Skill Proficiency record. | `Typed collection` |
| `sleight_of_hand_type` | Direct alias: `sleight_of_hand_type`<br>Typed collection: `proficiencies->[selector]->proficiencyLevel`<br>Match: `category = Skill`; `proficiency = Sleight of Hand` | `COMPUTED` | String/formatted compatibility result. To change the value, use the backing location named in **Write using**; its accepted values are documented in the corresponding structured/typed leaf table. | `sleight_of_hand_type` is a derived proficiency-tier code from `proficiencyLevel`; `2` was observed for Expertise. | `Typed collection` |
| `stealth_prof` | Direct alias: `stealth_prof`<br>Typed collection: `proficiencies->[selector]->proficiencyLevel`<br>Match: `category = Skill`; `proficiency = Stealth` | `COMPUTED` | Compatibility flag/state result; exact legacy representation (`0`/`1`, boolean, or sheet string) was not independently normalized for this alias. To change the value, use the backing location named in **Write using**; its accepted values are documented in the corresponding structured/typed leaf table. | `stealth_prof` is a derived proficiency-presence flag from the matching Skill Proficiency record. | `Typed collection` |
| `stealth_type` | Direct alias: `stealth_type`<br>Typed collection: `proficiencies->[selector]->proficiencyLevel`<br>Match: `category = Skill`; `proficiency = Stealth` | `COMPUTED` | String/formatted compatibility result. To change the value, use the backing location named in **Write using**; its accepted values are documented in the corresponding structured/typed leaf table. | `stealth_type` is a derived proficiency-tier code from `proficiencyLevel`; `2` was observed for Expertise. | `Typed collection` |
| `survival_prof` | Direct alias: `survival_prof`<br>Typed collection: `proficiencies->[selector]->proficiencyLevel`<br>Match: `category = Skill`; `proficiency = Survival` | `COMPUTED` | Compatibility flag/state result; exact legacy representation (`0`/`1`, boolean, or sheet string) was not independently normalized for this alias. To change the value, use the backing location named in **Write using**; its accepted values are documented in the corresponding structured/typed leaf table. | `survival_prof` is a derived proficiency-presence flag from the matching Skill Proficiency record. | `Typed collection` |
| `survival_type` | Direct alias: `survival_type`<br>Typed collection: `proficiencies->[selector]->proficiencyLevel`<br>Match: `category = Skill`; `proficiency = Survival` | `COMPUTED` | String/formatted compatibility result. To change the value, use the backing location named in **Write using**; its accepted values are documented in the corresponding structured/typed leaf table. | `survival_type` is a derived proficiency-tier code from `proficiencyLevel`; `2` was observed for Expertise. | `Typed collection` |

#### Shared character values

> **Value roles**
>
> - `COMPUTED` — A calculated or aggregated result. Change the named source input rather than writing the result.
>
> **Write using**
>
> - `Write not verified` — Use the alias for reads; no safe ScriptCards write target has been verified.

| Direct alias | ScriptCards read location | Value role | Values / writable domain | Description | Write using |
|---|---|---|---|---|---|
| `charname_output` | Direct alias: `charname_output` | `COMPUTED` | String/formatted compatibility result. Direct write is not verified. | `charname_output` is a direct alias that provides convenient ScriptCards access to the Beacon data described in the location column. | `Write not verified` |
| `multiclass1` | Direct alias: `multiclass1` | `COMPUTED` | Compatibility/synthetic result; exact output representation was not independently normalized for this alias. Direct write is not verified. | `multiclass1` is a direct alias that provides convenient ScriptCards access to the Beacon data described in the location column. | `Write not verified` |
| `multiclass1_flag` | Direct alias: `multiclass1_flag` | `COMPUTED` | Compatibility flag/state result; exact legacy representation (`0`/`1`, boolean, or sheet string) was not independently normalized for this alias. Direct write is not verified. | `multiclass1_flag` is a direct alias that provides convenient ScriptCards access to the Beacon data described in the location column. | `Write not verified` |
| `multiclass1_lvl` | Direct alias: `multiclass1_lvl` | `COMPUTED` | Compatibility/synthetic result; exact output representation was not independently normalized for this alias. Direct write is not verified. | `multiclass1_lvl` is a direct alias that provides convenient ScriptCards access to the Beacon data described in the location column. | `Write not verified` |
| `multiclass1_subclass` | Direct alias: `multiclass1_subclass` | `COMPUTED` | Compatibility/synthetic result; exact output representation was not independently normalized for this alias. Direct write is not verified. | `multiclass1_subclass` is a direct alias that provides convenient ScriptCards access to the Beacon data described in the location column. | `Write not verified` |
| `multiclass2` | Direct alias: `multiclass2` | `COMPUTED` | Compatibility/synthetic result; exact output representation was not independently normalized for this alias. Direct write is not verified. | `multiclass2` is a direct alias that provides convenient ScriptCards access to the Beacon data described in the location column. | `Write not verified` |
| `multiclass2_flag` | Direct alias: `multiclass2_flag` | `COMPUTED` | Compatibility flag/state result; exact legacy representation (`0`/`1`, boolean, or sheet string) was not independently normalized for this alias. Direct write is not verified. | `multiclass2_flag` is a direct alias that provides convenient ScriptCards access to the Beacon data described in the location column. | `Write not verified` |
| `multiclass2_lvl` | Direct alias: `multiclass2_lvl` | `COMPUTED` | Compatibility/synthetic result; exact output representation was not independently normalized for this alias. Direct write is not verified. | `multiclass2_lvl` is a direct alias that provides convenient ScriptCards access to the Beacon data described in the location column. | `Write not verified` |
| `multiclass2_subclass` | Direct alias: `multiclass2_subclass` | `COMPUTED` | Compatibility/synthetic result; exact output representation was not independently normalized for this alias. Direct write is not verified. | `multiclass2_subclass` is a direct alias that provides convenient ScriptCards access to the Beacon data described in the location column. | `Write not verified` |
| `multiclass3` | Direct alias: `multiclass3` | `COMPUTED` | Compatibility/synthetic result; exact output representation was not independently normalized for this alias. Direct write is not verified. | `multiclass3` is a direct alias that provides convenient ScriptCards access to the Beacon data described in the location column. | `Write not verified` |
| `multiclass3_flag` | Direct alias: `multiclass3_flag` | `COMPUTED` | Compatibility flag/state result; exact legacy representation (`0`/`1`, boolean, or sheet string) was not independently normalized for this alias. Direct write is not verified. | `multiclass3_flag` is a direct alias that provides convenient ScriptCards access to the Beacon data described in the location column. | `Write not verified` |
| `multiclass3_lvl` | Direct alias: `multiclass3_lvl` | `COMPUTED` | Compatibility/synthetic result; exact output representation was not independently normalized for this alias. Direct write is not verified. | `multiclass3_lvl` is a direct alias that provides convenient ScriptCards access to the Beacon data described in the location column. | `Write not verified` |
| `multiclass3_subclass` | Direct alias: `multiclass3_subclass` | `COMPUTED` | Compatibility/synthetic result; exact output representation was not independently normalized for this alias. Direct write is not verified. | `multiclass3_subclass` is a direct alias that provides convenient ScriptCards access to the Beacon data described in the location column. | `Write not verified` |
| `name` | Direct alias: `name` | `COMPUTED` | String/formatted compatibility result. Direct write is not verified. | `name` is a direct alias that provides convenient ScriptCards access to the Beacon data described in the location column. | `Write not verified` |
| `npc` | Direct alias: `npc`<br>Structured path: `appState` | `COMPUTED` | Compatibility/synthetic result; exact output representation was not independently normalized for this alias. Direct write is not verified. | `npc` is the compatibility flag derived from whether `appState` is `npc` or `sheet`. | `Write not verified` — Use `appState` in new scripts when you need to distinguish NPC (`npc`) from PC (`sheet`). |
| `npc_name` | Direct alias: `npc_name` | `COMPUTED` | String/formatted compatibility result. Direct write is not verified. | `npc_name` is a direct alias that provides convenient ScriptCards access to the Beacon data described in the location column. | `Write not verified` |
| `subclass` | Direct alias: `subclass`<br>Typed collection: `subclasses` | `COMPUTED` | Compatibility/synthetic result; exact output representation was not independently normalized for this alias. Direct write is not verified. | `subclass` is the translated display value derived from the canonical Subclass record. | `Write not verified` |

#### Tools and proficiencies

> **Value roles**
>
> - `COMPUTED` — A calculated or aggregated result. Change the named source input rather than writing the result.
>
> **Write using**
>
> - `Write not verified` — Use the alias for reads; no safe ScriptCards write target has been verified.

| Direct alias | ScriptCards read location | Value role | Values / writable domain | Description | Write using |
|---|---|---|---|---|---|
| `simpleproficencies` | Direct alias: `simpleproficencies` | `COMPUTED` | Compatibility flag/state result; exact legacy representation (`0`/`1`, boolean, or sheet string) was not independently normalized for this alias. Direct write is not verified. | `simpleproficencies` is a direct alias that provides convenient ScriptCards access to the Beacon data described in the location column. | `Write not verified` |
| `tool_mod` | Direct alias: `tool_mod` | `COMPUTED` | Numeric compatibility/computed result. Direct write is not verified. | `tool_mod` is a direct alias that provides convenient ScriptCards access to the Beacon data described in the location column. | `Write not verified` |
| `toolattr` | Direct alias: `toolattr` | `COMPUTED` | String/formatted compatibility result. Direct write is not verified. | `toolattr` is a direct alias that provides convenient ScriptCards access to the Beacon data described in the location column. | `Write not verified` |
| `toolattr_base` | Direct alias: `toolattr_base` | `COMPUTED` | String/formatted compatibility result. Direct write is not verified. | `toolattr_base` is a direct alias that provides convenient ScriptCards access to the Beacon data described in the location column. | `Write not verified` |
| `toolbonus` | Direct alias: `toolbonus` | `COMPUTED` | Numeric compatibility/computed result. Direct write is not verified. | `toolbonus` is a direct alias that provides convenient ScriptCards access to the Beacon data described in the location column. | `Write not verified` |
| `toolbonus_base` | Direct alias: `toolbonus_base` | `COMPUTED` | Compatibility/synthetic result; exact output representation was not independently normalized for this alias. Direct write is not verified. | `toolbonus_base` is a direct alias that provides convenient ScriptCards access to the Beacon data described in the location column. | `Write not verified` |
| `toolbonus_display` | Direct alias: `toolbonus_display` | `COMPUTED` | Compatibility/synthetic result; exact output representation was not independently normalized for this alias. Direct write is not verified. | `toolbonus_display` is a direct alias that provides convenient ScriptCards access to the Beacon data described in the location column. | `Write not verified` |
| `toolname` | Direct alias: `toolname` | `COMPUTED` | String/formatted compatibility result. Direct write is not verified. | `toolname` is a direct alias that provides convenient ScriptCards access to the Beacon data described in the location column. | `Write not verified` |

#### Conditions and exhaustion

> **Value roles**
>
> - `COMPUTED` — A calculated or aggregated result. Change the named source input rather than writing the result.
>
> **Write using**
>
> - `Write not verified` — Use the alias for reads; no safe ScriptCards write target has been verified.

| Direct alias | ScriptCards read location | Value role | Values / writable domain | Description | Write using |
|---|---|---|---|---|---|
| `exhaustion_1` | Direct alias: `exhaustion_1` | `COMPUTED` | Compatibility/synthetic result; exact output representation was not independently normalized for this alias. Direct write is not verified. | `exhaustion_1` is a direct alias that provides convenient ScriptCards access to the Beacon data described in the location column. | `Write not verified` |
| `exhaustion_2` | Direct alias: `exhaustion_2` | `COMPUTED` | Compatibility/synthetic result; exact output representation was not independently normalized for this alias. Direct write is not verified. | `exhaustion_2` is a direct alias that provides convenient ScriptCards access to the Beacon data described in the location column. | `Write not verified` |
| `exhaustion_3` | Direct alias: `exhaustion_3` | `COMPUTED` | Compatibility/synthetic result; exact output representation was not independently normalized for this alias. Direct write is not verified. | `exhaustion_3` is a direct alias that provides convenient ScriptCards access to the Beacon data described in the location column. | `Write not verified` |
| `exhaustion_4` | Direct alias: `exhaustion_4` | `COMPUTED` | Compatibility/synthetic result; exact output representation was not independently normalized for this alias. Direct write is not verified. | `exhaustion_4` is a direct alias that provides convenient ScriptCards access to the Beacon data described in the location column. | `Write not verified` |
| `exhaustion_5` | Direct alias: `exhaustion_5` | `COMPUTED` | Compatibility/synthetic result; exact output representation was not independently normalized for this alias. Direct write is not verified. | `exhaustion_5` is a direct alias that provides convenient ScriptCards access to the Beacon data described in the location column. | `Write not verified` |
| `exhaustion_6` | Direct alias: `exhaustion_6` | `COMPUTED` | Compatibility/synthetic result; exact output representation was not independently normalized for this alias. Direct write is not verified. | `exhaustion_6` is a direct alias that provides convenient ScriptCards access to the Beacon data described in the location column. | `Write not verified` |
| `exhaustion_level` | Direct alias: `exhaustion_level` | `COMPUTED` | Numeric compatibility/computed result. Direct write is not verified. | `exhaustion_level` is a direct alias that provides convenient ScriptCards access to the Beacon data described in the location column. | `Write not verified` |
| `exhaustion_toggle` | Direct alias: `exhaustion_toggle` | `COMPUTED` | Compatibility/synthetic result; exact output representation was not independently normalized for this alias. Direct write is not verified. | `exhaustion_toggle` is a direct alias that provides convenient ScriptCards access to the Beacon data described in the location column. | `Write not verified` |

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

| Direct alias | ScriptCards read location | Value role | Values / writable domain | Description | Write using |
|---|---|---|---|---|---|
| `global_ac_active_flag` | Direct alias: `global_ac_active_flag` | `COMPUTED` | Compatibility flag/state result; exact legacy representation (`0`/`1`, boolean, or sheet string) was not independently normalized for this alias. Direct write is not verified. | `global_ac_active_flag` is a direct alias that provides convenient ScriptCards access to the Beacon data described in the location column. | `Write not verified` |
| `global_ac_mod_flag` | Direct alias: `global_ac_mod_flag` | `COMPUTED` | Compatibility flag/state result; exact legacy representation (`0`/`1`, boolean, or sheet string) was not independently normalized for this alias. Direct write is not verified. | `global_ac_mod_flag` is a direct alias that provides convenient ScriptCards access to the Beacon data described in the location column. | `Write not verified` |
| `global_ac_name` | Direct alias: `global_ac_name` | `COMPUTED` | String/formatted compatibility result. Direct write is not verified. | `global_ac_name` is a direct alias that provides convenient ScriptCards access to the Beacon data described in the location column. | `Write not verified` |
| `global_ac_val` | Direct alias: `global_ac_val` | `COMPUTED` | Compatibility/synthetic result; exact output representation was not independently normalized for this alias. Direct write is not verified. | `global_ac_val` is a direct alias that provides convenient ScriptCards access to the Beacon data described in the location column. | `Write not verified` |
| `global_attack_active_flag` | Direct alias: `global_attack_active_flag` | `COMPUTED` | Compatibility flag/state result; exact legacy representation (`0`/`1`, boolean, or sheet string) was not independently normalized for this alias. Direct write is not verified. | `global_attack_active_flag` is a direct alias that provides convenient ScriptCards access to the Beacon data described in the location column. | `Write not verified` |
| `global_attack_mod` | Direct alias: `global_attack_mod` | `COMPUTED` | Numeric compatibility/computed result. Direct write is not verified. | `global_attack_mod` is a direct alias that provides convenient ScriptCards access to the Beacon data described in the location column. | `Write not verified` |
| `global_attack_mod_flag` | Direct alias: `global_attack_mod_flag` | `COMPUTED` | Compatibility flag/state result; exact legacy representation (`0`/`1`, boolean, or sheet string) was not independently normalized for this alias. Direct write is not verified. | `global_attack_mod_flag` is a direct alias that provides convenient ScriptCards access to the Beacon data described in the location column. | `Write not verified` |
| `global_attack_rollstring` | Direct alias: `global_attack_rollstring` | `COMPUTED` | String/formatted compatibility result. Direct write is not verified. | `global_attack_rollstring` is a direct alias that provides convenient ScriptCards access to the Beacon data described in the location column. | `Write not verified` |
| `global_damage_active_flag` | Direct alias: `global_damage_active_flag` | `COMPUTED` | String/formatted compatibility result. Direct write is not verified. | `global_damage_active_flag` is a direct alias that provides convenient ScriptCards access to the Beacon data described in the location column. | `Write not verified` |
| `global_damage_mod_crit` | Direct alias: `global_damage_mod_crit` | `COMPUTED` | String/formatted compatibility result. Direct write is not verified. | `global_damage_mod_crit` is a direct alias that provides convenient ScriptCards access to the Beacon data described in the location column. | `Write not verified` |
| `global_damage_mod_flag` | Direct alias: `global_damage_mod_flag` | `COMPUTED` | String/formatted compatibility result. Direct write is not verified. | `global_damage_mod_flag` is a direct alias that provides convenient ScriptCards access to the Beacon data described in the location column. | `Write not verified` |
| `global_damage_mod_roll` | Direct alias: `global_damage_mod_roll` | `COMPUTED` | String/formatted compatibility result. Direct write is not verified. | `global_damage_mod_roll` is a direct alias that provides convenient ScriptCards access to the Beacon data described in the location column. | `Write not verified` |
| `global_damage_mod_type` | Direct alias: `global_damage_mod_type` | `COMPUTED` | String/formatted compatibility result. Direct write is not verified. | `global_damage_mod_type` is a direct alias that provides convenient ScriptCards access to the Beacon data described in the location column. | `Write not verified` |
| `global_damage_rollstring` | Direct alias: `global_damage_rollstring` | `COMPUTED` | String/formatted compatibility result. Direct write is not verified. | `global_damage_rollstring` is a direct alias that provides convenient ScriptCards access to the Beacon data described in the location column. | `Write not verified` |
| `global_damage_type` | Direct alias: `global_damage_type` | `COMPUTED` | String/formatted compatibility result. Direct write is not verified. | `global_damage_type` is a direct alias that provides convenient ScriptCards access to the Beacon data described in the location column. | `Write not verified` |
| `global_save_active_flag` | Direct alias: `global_save_active_flag` | `COMPUTED` | Compatibility flag/state result; exact legacy representation (`0`/`1`, boolean, or sheet string) was not independently normalized for this alias. Direct write is not verified. | `global_save_active_flag` is a direct alias that provides convenient ScriptCards access to the Beacon data described in the location column. | `Write not verified` |
| `global_save_mod` | Direct alias: `global_save_mod` | `COMPUTED` | Numeric compatibility/computed result. Direct write is not verified. | `global_save_mod` is a direct alias that provides convenient ScriptCards access to the Beacon data described in the location column. | `Write not verified` |
| `global_save_mod_flag` | Direct alias: `global_save_mod_flag` | `COMPUTED` | Compatibility flag/state result; exact legacy representation (`0`/`1`, boolean, or sheet string) was not independently normalized for this alias. Direct write is not verified. | `global_save_mod_flag` is a direct alias that provides convenient ScriptCards access to the Beacon data described in the location column. | `Write not verified` |
| `global_save_rollstring` | Direct alias: `global_save_rollstring` | `COMPUTED` | String/formatted compatibility result. Direct write is not verified. | `global_save_rollstring` is a direct alias that provides convenient ScriptCards access to the Beacon data described in the location column. | `Write not verified` |
| `global_skill_active_flag` | Direct alias: `global_skill_active_flag` | `COMPUTED` | Compatibility flag/state result; exact legacy representation (`0`/`1`, boolean, or sheet string) was not independently normalized for this alias. Direct write is not verified. | `global_skill_active_flag` is a direct alias that provides convenient ScriptCards access to the Beacon data described in the location column. | `Write not verified` |
| `global_skill_mod` | Direct alias: `global_skill_mod` | `COMPUTED` | Numeric compatibility/computed result. Direct write is not verified. | `global_skill_mod` is a direct alias that provides convenient ScriptCards access to the Beacon data described in the location column. | `Write not verified` |
| `global_skill_mod_flag` | Direct alias: `global_skill_mod_flag` | `COMPUTED` | Compatibility flag/state result; exact legacy representation (`0`/`1`, boolean, or sheet string) was not independently normalized for this alias. Direct write is not verified. | `global_skill_mod_flag` is a direct alias that provides convenient ScriptCards access to the Beacon data described in the location column. | `Write not verified` |
| `global_skill_rollstring` | Direct alias: `global_skill_rollstring` | `COMPUTED` | String/formatted compatibility result. Direct write is not verified. | `global_skill_rollstring` is a direct alias that provides convenient ScriptCards access to the Beacon data described in the location column. | `Write not verified` |
| `globalmagicmod` | Character-level direct alias: not exposed in the verified Beacon build<br>Verified fallback result: missing `user.globalmagicmod` Custom Attribute | `UNKNOWN` | Unknown/unmapped value domain. Do not write; the current controlled sources did not establish a reliable Beacon source or value format. | A bare `globalmagicmod` read falls through to the classic custom-attribute fallback and produces a missing Custom Attribute error. Do not use it as a Beacon character-level spellcasting modifier. | `Not mapped` |
| `globalsavemod` | Direct alias: `globalsavemod` | `COMPUTED` | Numeric compatibility/computed result. Direct write is not verified. | `globalsavemod` is a direct alias that provides convenient ScriptCards access to the Beacon data described in the location column. | `Write not verified` |
| `globalsavingthrowbonus` | Direct alias: `globalsavingthrowbonus` | `COMPUTED` | Numeric compatibility/computed result. Direct write is not verified. | `globalsavingthrowbonus` is a direct alias that provides convenient ScriptCards access to the Beacon data described in the location column. | `Write not verified` |

#### Combat statistics

> **Value roles**
>
> - `COMPUTED` — A calculated or aggregated result. Change the named source input rather than writing the result.
>
> **Write using**
>
> - `Typed collection` — Locate the matching existing record through the location labeled `Typed collection:` or `Typed collections:` in the row. When the row names a field, write that field; otherwise use the corresponding typed-collection table below to choose the existing primitive field that represents the intended change.

| Direct alias | ScriptCards read location | Value role | Values / writable domain | Description | Write using |
|---|---|---|---|---|---|
| `hit_dice_max` | Direct alias: `hit_dice_max`<br>Typed collection: `hitdices` | `COMPUTED` | Numeric compatibility/computed result. To change the value, use the backing location named in **Write using**; its accepted values are documented in the corresponding structured/typed leaf table. | `hit_dice_max` is the translated maximum Hit Dice value derived from canonical Hit Dice records. | `Typed collection` |
| `hitdie_final` | Direct alias: `hitdie_final`<br>Typed collection: `hitdices` | `COMPUTED` | Numeric compatibility/computed result. To change the value, use the backing location named in **Write using**; its accepted values are documented in the corresponding structured/typed leaf table. | `hitdie_final` is a compatibility result derived from the applicable Hit Dice record. | `Typed collection` |
| `hitdietype` | Direct alias: `hitdietype`<br>Typed collection: `hitdices->[selector]->dieSize` | `COMPUTED` | String/formatted compatibility result. To change the value, use the backing location named in **Write using**; its accepted values are documented in the corresponding structured/typed leaf table. | `hitdietype` is the compatibility die-size value derived from the applicable Hit Dice record. | `Typed collection` |

#### Settings and UI

> **Value roles**
>
> - `COMPUTED` — A calculated or aggregated result. Change the named source input rather than writing the result.
>
> **Write using**
>
> - `Write not verified` — Use the alias for reads; no safe ScriptCards write target has been verified.

| Direct alias | ScriptCards read location | Value role | Values / writable domain | Description | Write using |
|---|---|---|---|---|---|
| `cancel` | Direct alias: `cancel` | `COMPUTED` | Compatibility/synthetic result; exact output representation was not independently normalized for this alias. Direct write is not verified. | `cancel` is a direct alias that provides convenient ScriptCards access to the Beacon data described in the location column. | `Write not verified` |
| `carrying_capacity_mod` | Direct alias: `carrying_capacity_mod` | `COMPUTED` | Numeric compatibility/computed result. Direct write is not verified. | `carrying_capacity_mod` is a direct alias that provides convenient ScriptCards access to the Beacon data described in the location column. | `Write not verified` |
| `confirm` | Direct alias: `confirm` | `COMPUTED` | Compatibility/synthetic result; exact output representation was not independently normalized for this alias. Direct write is not verified. | `confirm` is a direct alias that provides convenient ScriptCards access to the Beacon data described in the location column. | `Write not verified` |
| `encumberance` | Direct alias: `encumberance`<br>Structured path: `sheet->settings->encumbranceType` | `COMPUTED` | Compatibility/synthetic result; exact output representation was not independently normalized for this alias. Direct write is not verified. | `encumberance` is a direct alias that provides convenient ScriptCards access to the Beacon data described in the location column. | `Write not verified` |
| `mancer_cancel` | Direct alias: `mancer_cancel` | `COMPUTED` | Compatibility/synthetic result; exact output representation was not independently normalized for this alias. Direct write is not verified. | `mancer_cancel` is a direct alias that provides convenient ScriptCards access to the Beacon data described in the location column. | `Write not verified` |
| `mancer_confirm` | Direct alias: `mancer_confirm` | `COMPUTED` | Compatibility/synthetic result; exact output representation was not independently normalized for this alias. Direct write is not verified. | `mancer_confirm` is a direct alias that provides convenient ScriptCards access to the Beacon data described in the location column. | `Write not verified` |
| `mancer_confirm_flag` | Direct alias: `mancer_confirm_flag` | `COMPUTED` | Compatibility flag/state result; exact legacy representation (`0`/`1`, boolean, or sheet string) was not independently normalized for this alias. Direct write is not verified. | `mancer_confirm_flag` is a direct alias that provides convenient ScriptCards access to the Beacon data described in the location column. | `Write not verified` |
| `mancer_npc` | Direct alias: `mancer_npc` | `COMPUTED` | Compatibility/synthetic result; exact output representation was not independently normalized for this alias. Direct write is not verified. | `mancer_npc` is a direct alias that provides convenient ScriptCards access to the Beacon data described in the location column. | `Write not verified` |
| `missing_info` | Direct alias: `missing_info` | `COMPUTED` | Compatibility/synthetic result; exact output representation was not independently normalized for this alias. Direct write is not verified. | `missing_info` is a direct alias that provides convenient ScriptCards access to the Beacon data described in the location column. | `Write not verified` |
| `monster_confirm_flag` | Direct alias: `monster_confirm_flag` | `COMPUTED` | Compatibility flag/state result; exact legacy representation (`0`/`1`, boolean, or sheet string) was not independently normalized for this alias. Direct write is not verified. | `monster_confirm_flag` is a direct alias that provides convenient ScriptCards access to the Beacon data described in the location column. | `Write not verified` |
| `options-class-selection` | Direct alias: `options-class-selection` | `COMPUTED` | Compatibility/synthetic result; exact output representation was not independently normalized for this alias. Direct write is not verified. | `options-class-selection` is a direct alias that provides convenient ScriptCards access to the Beacon data described in the location column. | `Write not verified` |
| `options-flag` | Direct alias: `options-flag` | `COMPUTED` | Compatibility flag/state result; exact legacy representation (`0`/`1`, boolean, or sheet string) was not independently normalized for this alias. Direct write is not verified. | `options-flag` is a direct alias that provides convenient ScriptCards access to the Beacon data described in the location column. | `Write not verified` |
| `options-flag-bonds` | Direct alias: `options-flag-bonds` | `COMPUTED` | Compatibility flag/state result; exact legacy representation (`0`/`1`, boolean, or sheet string) was not independently normalized for this alias. Direct write is not verified. | `options-flag-bonds` is a direct alias that provides convenient ScriptCards access to the Beacon data described in the location column. | `Write not verified` |
| `options-flag-flaws` | Direct alias: `options-flag-flaws` | `COMPUTED` | Compatibility flag/state result; exact legacy representation (`0`/`1`, boolean, or sheet string) was not independently normalized for this alias. Direct write is not verified. | `options-flag-flaws` is a direct alias that provides convenient ScriptCards access to the Beacon data described in the location column. | `Write not verified` |
| `options-flag-ideals` | Direct alias: `options-flag-ideals` | `COMPUTED` | Compatibility flag/state result; exact legacy representation (`0`/`1`, boolean, or sheet string) was not independently normalized for this alias. Direct write is not verified. | `options-flag-ideals` is a direct alias that provides convenient ScriptCards access to the Beacon data described in the location column. | `Write not verified` |
| `options-flag-personality` | Direct alias: `options-flag-personality` | `COMPUTED` | Compatibility flag/state result; exact legacy representation (`0`/`1`, boolean, or sheet string) was not independently normalized for this alias. Direct write is not verified. | `options-flag-personality` is a direct alias that provides convenient ScriptCards access to the Beacon data described in the location column. | `Write not verified` |
| `simpletraits` | Direct alias: `simpletraits`<br>Structured path: `sheet->settings->layoutState` | `COMPUTED` | Compatibility/synthetic result; exact output representation was not independently normalized for this alias. Direct write is not verified. | `simpletraits` is a direct alias that provides convenient ScriptCards access to the Beacon data described in the location column. | `Write not verified` |
| `tab` | Direct alias: `tab` | `COMPUTED` | Compatibility/synthetic result; exact output representation was not independently normalized for this alias. Direct write is not verified. | `tab` is a direct alias that provides convenient ScriptCards access to the Beacon data described in the location column. | `Write not verified` |

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

| Direct alias | ScriptCards read location | Value role | Values / writable domain | Description | Write using |
|---|---|---|---|---|---|
| `armorwarningflag` | Direct alias: `armorwarningflag`<br>Typed collections: `armorclasses`; equipped armor/shields: `items` | `COMPUTED` | Compatibility flag/state result; exact legacy representation (`0`/`1`, boolean, or sheet string) was not independently normalized for this alias. To change the value, use the backing location named in **Write using**; its accepted values are documented in the corresponding structured/typed leaf table. | `armorwarningflag` is a legacy armor-warning flag. Beacon derives AC from applicable Armor Class records and related equipped Item records instead of storing this as an independent AC field. | `Typed collection` |
| `charisma_base` | Direct alias: `charisma_base` | `COMPUTED` | Compatibility/synthetic result; exact output representation was not independently normalized for this alias. Direct write is not verified. | `charisma_base` is a direct alias that provides convenient ScriptCards access to the Beacon data described in the location column. | `Write not verified` |
| `charisma_bonus` | Direct alias: `charisma_bonus` | `COMPUTED` | Numeric compatibility/computed result. Direct write is not verified. | `charisma_bonus` is a direct alias that provides convenient ScriptCards access to the Beacon data described in the location column. | `Write not verified` |
| `charisma_flag` | Direct alias: `charisma_flag` | `COMPUTED` | Compatibility flag/state result; exact legacy representation (`0`/`1`, boolean, or sheet string) was not independently normalized for this alias. Direct write is not verified. | `charisma_flag` is a direct alias that provides convenient ScriptCards access to the Beacon data described in the location column. | `Write not verified` |
| `constitution_base` | Direct alias: `constitution_base` | `COMPUTED` | Compatibility/synthetic result; exact output representation was not independently normalized for this alias. Direct write is not verified. | `constitution_base` is a direct alias that provides convenient ScriptCards access to the Beacon data described in the location column. | `Write not verified` |
| `constitution_bonus` | Direct alias: `constitution_bonus` | `COMPUTED` | Numeric compatibility/computed result. Direct write is not verified. | `constitution_bonus` is a direct alias that provides convenient ScriptCards access to the Beacon data described in the location column. | `Write not verified` |
| `constitution_flag` | Direct alias: `constitution_flag` | `COMPUTED` | Compatibility flag/state result; exact legacy representation (`0`/`1`, boolean, or sheet string) was not independently normalized for this alias. Direct write is not verified. | `constitution_flag` is a direct alias that provides convenient ScriptCards access to the Beacon data described in the location column. | `Write not verified` |
| `cust_charisma_save_prof` | Direct alias: `cust_charisma_save_prof`<br>Typed collection: `proficiencies`<br>Match: `category = Saving Throw`; `proficiency = Charisma` | `COMPUTED` | Compatibility flag/state result; exact legacy representation (`0`/`1`, boolean, or sheet string) was not independently normalized for this alias. To change the value, use the backing location named in **Write using**; its accepted values are documented in the corresponding structured/typed leaf table. | `cust_charisma_save_prof` is a legacy custom Charisma saving-throw proficiency control. Beacon represents the effective proficiency with a matching Proficiency record rather than an independent custom scalar. | `Typed collection` |
| `cust_constitution_save_prof` | Direct alias: `cust_constitution_save_prof`<br>Typed collection: `proficiencies`<br>Match: `category = Saving Throw`; `proficiency = Constitution` | `COMPUTED` | Compatibility flag/state result; exact legacy representation (`0`/`1`, boolean, or sheet string) was not independently normalized for this alias. To change the value, use the backing location named in **Write using**; its accepted values are documented in the corresponding structured/typed leaf table. | `cust_constitution_save_prof` is a legacy custom Constitution saving-throw proficiency control. Beacon represents the effective proficiency with a matching Proficiency record rather than an independent custom scalar. | `Typed collection` |
| `cust_dexterity_save_prof` | Direct alias: `cust_dexterity_save_prof`<br>Typed collection: `proficiencies`<br>Match: `category = Saving Throw`; `proficiency = Dexterity` | `COMPUTED` | Compatibility flag/state result; exact legacy representation (`0`/`1`, boolean, or sheet string) was not independently normalized for this alias. To change the value, use the backing location named in **Write using**; its accepted values are documented in the corresponding structured/typed leaf table. | `cust_dexterity_save_prof` is a legacy custom Dexterity saving-throw proficiency control. Beacon represents the effective proficiency with a matching Proficiency record rather than an independent custom scalar. | `Typed collection` |
| `cust_intelligence_save_prof` | Direct alias: `cust_intelligence_save_prof`<br>Typed collection: `proficiencies`<br>Match: `category = Saving Throw`; `proficiency = Intelligence` | `COMPUTED` | Compatibility flag/state result; exact legacy representation (`0`/`1`, boolean, or sheet string) was not independently normalized for this alias. To change the value, use the backing location named in **Write using**; its accepted values are documented in the corresponding structured/typed leaf table. | `cust_intelligence_save_prof` is a legacy custom Intelligence saving-throw proficiency control. Beacon represents the effective proficiency with a matching Proficiency record rather than an independent custom scalar. | `Typed collection` |
| `cust_strength_save_prof` | Direct alias: `cust_strength_save_prof`<br>Typed collection: `proficiencies`<br>Match: `category = Saving Throw`; `proficiency = Strength` | `COMPUTED` | Compatibility flag/state result; exact legacy representation (`0`/`1`, boolean, or sheet string) was not independently normalized for this alias. To change the value, use the backing location named in **Write using**; its accepted values are documented in the corresponding structured/typed leaf table. | `cust_strength_save_prof` is a legacy custom Strength saving-throw proficiency control. Beacon represents the effective proficiency with a matching Proficiency record rather than an independent custom scalar. | `Typed collection` |
| `cust_wisdom_save_prof` | Direct alias: `cust_wisdom_save_prof`<br>Typed collection: `proficiencies`<br>Match: `category = Saving Throw`; `proficiency = Wisdom` | `COMPUTED` | Compatibility flag/state result; exact legacy representation (`0`/`1`, boolean, or sheet string) was not independently normalized for this alias. To change the value, use the backing location named in **Write using**; its accepted values are documented in the corresponding structured/typed leaf table. | `cust_wisdom_save_prof` is a legacy custom Wisdom saving-throw proficiency control. Beacon represents the effective proficiency with a matching Proficiency record rather than an independent custom scalar. | `Typed collection` |
| `custom_ac_base` | Direct alias: `custom_ac_base`<br>Typed collections: `armorclasses`; equipped armor/shields: `items` | `COMPUTED` | Compatibility/synthetic result; exact output representation was not independently normalized for this alias. To change the value, use the backing location named in **Write using**; its accepted values are documented in the corresponding structured/typed leaf table. | `custom_ac_base` is a legacy custom-AC base component. Beacon derives AC from applicable Armor Class records and related equipped Item records instead of storing this as an independent AC field. | `Typed collection` |
| `custom_ac_flag` | Direct alias: `custom_ac_flag`<br>Typed collections: `armorclasses`; equipped armor/shields: `items` | `COMPUTED` | Compatibility flag/state result; exact legacy representation (`0`/`1`, boolean, or sheet string) was not independently normalized for this alias. To change the value, use the backing location named in **Write using**; its accepted values are documented in the corresponding structured/typed leaf table. | `custom_ac_flag` is a legacy custom-AC activation flag. Beacon derives AC from applicable Armor Class records and related equipped Item records instead of storing this as an independent AC field. | `Typed collection` |
| `custom_ac_part1` | Direct alias: `custom_ac_part1`<br>Typed collections: `armorclasses`; equipped armor/shields: `items` | `COMPUTED` | Compatibility/synthetic result; exact output representation was not independently normalized for this alias. To change the value, use the backing location named in **Write using**; its accepted values are documented in the corresponding structured/typed leaf table. | `custom_ac_part1` is a legacy first custom-AC formula component. Beacon derives AC from applicable Armor Class records and related equipped Item records instead of storing this as an independent AC field. | `Typed collection` |
| `custom_ac_part2` | Direct alias: `custom_ac_part2`<br>Typed collections: `armorclasses`; equipped armor/shields: `items` | `COMPUTED` | Compatibility/synthetic result; exact output representation was not independently normalized for this alias. To change the value, use the backing location named in **Write using**; its accepted values are documented in the corresponding structured/typed leaf table. | `custom_ac_part2` is a legacy second custom-AC formula component. Beacon derives AC from applicable Armor Class records and related equipped Item records instead of storing this as an independent AC field. | `Typed collection` |
| `custom_ac_shield` | Direct alias: `custom_ac_shield`<br>Typed collections: `armorclasses`; equipped armor/shields: `items` | `COMPUTED` | Compatibility/synthetic result; exact output representation was not independently normalized for this alias. To change the value, use the backing location named in **Write using**; its accepted values are documented in the corresponding structured/typed leaf table. | `custom_ac_shield` is a legacy custom shield-AC component. Beacon derives AC from applicable Armor Class records and related equipped Item records instead of storing this as an independent AC field. | `Typed collection` |
| `customacwarningflag` | Direct alias: `customacwarningflag`<br>Typed collections: `armorclasses`; equipped armor/shields: `items` | `COMPUTED` | Compatibility flag/state result; exact legacy representation (`0`/`1`, boolean, or sheet string) was not independently normalized for this alias. To change the value, use the backing location named in **Write using**; its accepted values are documented in the corresponding structured/typed leaf table. | `customacwarningflag` is a legacy custom-AC warning flag. Beacon derives AC from applicable Armor Class records and related equipped Item records instead of storing this as an independent AC field. | `Typed collection` |
| `dexterity_base` | Direct alias: `dexterity_base` | `COMPUTED` | Compatibility/synthetic result; exact output representation was not independently normalized for this alias. Direct write is not verified. | `dexterity_base` is a direct alias that provides convenient ScriptCards access to the Beacon data described in the location column. | `Write not verified` |
| `dexterity_bonus` | Direct alias: `dexterity_bonus` | `COMPUTED` | Numeric compatibility/computed result. Direct write is not verified. | `dexterity_bonus` is a direct alias that provides convenient ScriptCards access to the Beacon data described in the location column. | `Write not verified` |
| `dexterity_flag` | Direct alias: `dexterity_flag` | `COMPUTED` | Compatibility flag/state result; exact legacy representation (`0`/`1`, boolean, or sheet string) was not independently normalized for this alias. Direct write is not verified. | `dexterity_flag` is a direct alias that provides convenient ScriptCards access to the Beacon data described in the location column. | `Write not verified` |
| `display_flag` | Direct alias: `display_flag` | `COMPUTED` | Compatibility flag/state result; exact legacy representation (`0`/`1`, boolean, or sheet string) was not independently normalized for this alias. Direct write is not verified. | `display_flag` is a legacy display-control value rather than an authoritative Beacon character value. | `Write not verified` |
| `innate` | Direct alias: `innate`<br>Known typed collections: applicable `spells` and `spellcastings` records | `COMPUTED` | Compatibility/synthetic result; exact output representation was not independently normalized for this alias. Direct write is not verified. | `innate` is a legacy spellcasting compatibility value. Beacon stores innate spell and caster details on Spell and Spellcasting records. | `Write not verified` |
| `intelligence_base` | Direct alias: `intelligence_base` | `COMPUTED` | Compatibility/synthetic result; exact output representation was not independently normalized for this alias. Direct write is not verified. | `intelligence_base` is a direct alias that provides convenient ScriptCards access to the Beacon data described in the location column. | `Write not verified` |
| `intelligence_bonus` | Direct alias: `intelligence_bonus` | `COMPUTED` | Numeric compatibility/computed result. Direct write is not verified. | `intelligence_bonus` is a direct alias that provides convenient ScriptCards access to the Beacon data described in the location column. | `Write not verified` |
| `intelligence_flag` | Direct alias: `intelligence_flag` | `COMPUTED` | Compatibility flag/state result; exact legacy representation (`0`/`1`, boolean, or sheet string) was not independently normalized for this alias. Direct write is not verified. | `intelligence_flag` is a direct alias that provides convenient ScriptCards access to the Beacon data described in the location column. | `Write not verified` |
| `pb_custom` | Direct alias: `pb_custom` | `COMPUTED` | Compatibility/synthetic result; exact output representation was not independently normalized for this alias. Direct write is not verified. | `pb_custom` is a direct alias that provides convenient ScriptCards access to the Beacon data described in the location column. | `Write not verified` |
| `pb_type` | Direct alias: `pb_type` | `COMPUTED` | String/formatted compatibility result. Direct write is not verified. | `pb_type` is a direct alias that provides convenient ScriptCards access to the Beacon data described in the location column. | `Write not verified` |
| `pbd_safe` | Direct alias: `pbd_safe` | `COMPUTED` | Compatibility/synthetic result; exact output representation was not independently normalized for this alias. Direct write is not verified. | `pbd_safe` is a direct alias that provides convenient ScriptCards access to the Beacon data described in the location column. | `Write not verified` |
| `prof_type` | Direct alias: `prof_type` | `COMPUTED` | String/formatted compatibility result. Direct write is not verified. | `prof_type` is a direct alias that provides convenient ScriptCards access to the Beacon data described in the location column. | `Write not verified` |
| `source` | Direct alias: `source` | `COMPUTED` | String/formatted compatibility result. Direct write is not verified. | `source` is a compatibility projection of the source label belonging to the current repeating or canonical record context. | `Write not verified` |
| `source_type` | Direct alias: `source_type` and `source` | `COMPUTED` | String/formatted compatibility result. Direct write is not verified. | `source_type` is a compatibility projection describing the source or record family in the current row context. | `Write not verified` |
| `strength_base` | Direct alias: `strength_base` | `COMPUTED` | Compatibility/synthetic result; exact output representation was not independently normalized for this alias. Direct write is not verified. | `strength_base` is a direct alias that provides convenient ScriptCards access to the Beacon data described in the location column. | `Write not verified` |
| `strength_bonus` | Direct alias: `strength_bonus` | `COMPUTED` | Numeric compatibility/computed result. Direct write is not verified. | `strength_bonus` is a direct alias that provides convenient ScriptCards access to the Beacon data described in the location column. | `Write not verified` |
| `strength_flag` | Direct alias: `strength_flag` | `COMPUTED` | Compatibility flag/state result; exact legacy representation (`0`/`1`, boolean, or sheet string) was not independently normalized for this alias. Direct write is not verified. | `strength_flag` is a direct alias that provides convenient ScriptCards access to the Beacon data described in the location column. | `Write not verified` |
| `token_size` | Direct alias: `token_size`<br>Known sources: direct alias `size`; typed collection field `sizes->[selector]->sizeValue` | `COMPUTED` | Compatibility/synthetic result; exact output representation was not independently normalized for this alias. Direct write is not verified. | `token_size` is a legacy token-scale compatibility value derived from the character’s canonical Size data. | `Write not verified` |
| `versatile_alt` | Direct alias: `versatile_alt`<br>Parent typed records: `items`; linked `attacks` and `damages` | `SYNTH` | Compatibility/synthetic result; exact output representation was not independently normalized for this alias. To change the value, use the backing location named in **Write using**; its accepted values are documented in the corresponding structured/typed leaf table. | `versatile_alt` is a synthetic repeating-row value for alternate versatile-weapon damage. It is assembled from the parent Item and linked Attack/Damage records. | `Parent typed record` |
| `wisdom_base` | Direct alias: `wisdom_base` | `COMPUTED` | Compatibility/synthetic result; exact output representation was not independently normalized for this alias. Direct write is not verified. | `wisdom_base` is a direct alias that provides convenient ScriptCards access to the Beacon data described in the location column. | `Write not verified` |
| `wisdom_bonus` | Direct alias: `wisdom_bonus` | `COMPUTED` | Numeric compatibility/computed result. Direct write is not verified. | `wisdom_bonus` is a direct alias that provides convenient ScriptCards access to the Beacon data described in the location column. | `Write not verified` |
| `wisdom_flag` | Direct alias: `wisdom_flag` | `COMPUTED` | Compatibility flag/state result; exact legacy representation (`0`/`1`, boolean, or sheet string) was not independently normalized for this alias. Direct write is not verified. | `wisdom_flag` is a direct alias that provides convenient ScriptCards access to the Beacon data described in the location column. | `Write not verified` |

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

| Direct alias | ScriptCards read location | Value role | Values / writable domain | Description | Write using |
|---|---|---|---|---|---|
| `additional_feature_and_traits` | Direct alias: `additional_feature_and_traits` | `UNKNOWN` | Unknown/unmapped value domain. Do not write; the current controlled sources did not establish a reliable Beacon source or value format. | `additional_feature_and_traits` exposes the legacy additional features and traits text, but no verified fixed path, canonical record rule, or calculation has been mapped for it. | `Not mapped` |
| `allies_and_organizations` | Direct alias: `allies_and_organizations` | `UNKNOWN` | Unknown/unmapped value domain. Do not write; the current controlled sources did not establish a reliable Beacon source or value format. | `allies_and_organizations` exposes the legacy allies and organizations text, but no verified fixed path, canonical record rule, or calculation has been mapped for it. | `Not mapped` |
| `bonds` | Direct alias: `bonds` | `UNKNOWN` | Unknown/unmapped value domain. Do not write; the current controlled sources did not establish a reliable Beacon source or value format. | `bonds` exposes the legacy bonds text, but no verified fixed path, canonical record rule, or calculation has been mapped for it. | `Not mapped` |
| `character_appearance` | Direct alias: `character_appearance` | `UNKNOWN` | Unknown/unmapped value domain. Do not write; the current controlled sources did not establish a reliable Beacon source or value format. | `character_appearance` exposes the legacy character appearance text, but no verified fixed path, canonical record rule, or calculation has been mapped for it. | `Not mapped` |
| `character_backstory` | Direct alias: `character_backstory` | `UNKNOWN` | Unknown/unmapped value domain. Do not write; the current controlled sources did not establish a reliable Beacon source or value format. | `character_backstory` exposes the legacy character backstory text, but no verified fixed path, canonical record rule, or calculation has been mapped for it. | `Not mapped` |
| `features_and_traits` | Direct alias: `features_and_traits` | `UNKNOWN` | Unknown/unmapped value domain. Do not write; the current controlled sources did not establish a reliable Beacon source or value format. | `features_and_traits` exposes the legacy features and traits text, but no verified fixed path, canonical record rule, or calculation has been mapped for it. | `Not mapped` |
| `flaws` | Direct alias: `flaws` | `UNKNOWN` | Unknown/unmapped value domain. Do not write; the current controlled sources did not establish a reliable Beacon source or value format. | `flaws` exposes the legacy flaws text, but no verified fixed path, canonical record rule, or calculation has been mapped for it. | `Not mapped` |
| `ideals` | Direct alias: `ideals` | `UNKNOWN` | Unknown/unmapped value domain. Do not write; the current controlled sources did not establish a reliable Beacon source or value format. | `ideals` exposes the legacy ideals text, but no verified fixed path, canonical record rule, or calculation has been mapped for it. | `Not mapped` |
| `other_proficiencies_and_languages` | Direct alias: `other_proficiencies_and_languages` | `UNKNOWN` | Unknown/unmapped value domain. Do not write; the current controlled sources did not establish a reliable Beacon source or value format. | `other_proficiencies_and_languages` exposes the legacy other proficiencies and languages text, but no verified fixed path, canonical record rule, or calculation has been mapped for it. | `Not mapped` |
| `personality_traits` | Direct alias: `personality_traits` | `UNKNOWN` | Unknown/unmapped value domain. Do not write; the current controlled sources did not establish a reliable Beacon source or value format. | `personality_traits` exposes the legacy personality traits text, but no verified fixed path, canonical record rule, or calculation has been mapped for it. | `Not mapped` |

#### Shared character values

> **Value roles**
>
> - `UNKNOWN` — The source location or safe write route has not yet been verified.
>
> **Write using**
>
> - `Not mapped` — The source location and safe write route are not yet known.

| Direct alias | ScriptCards read location | Value role | Values / writable domain | Description | Write using |
|---|---|---|---|---|---|
| `version` | Direct alias: `version` | `UNKNOWN` | Unknown/unmapped value domain. Do not write; the current controlled sources did not establish a reliable Beacon source or value format. | `version` exposes the legacy sheet-version value, but no verified fixed path, canonical record rule, or calculation has been mapped for it. | `Not mapped` |

#### Legacy compatibility and roll output

> **Value roles**
>
> - `TRANSIENT` — Temporary builder or interface state rather than ordinary stored character data.
>
> **Write using**
>
> - `Builder/interface state` — The row identifies this with `Builder/interface state:`; it is transient interface data rather than ordinary live character data.

| Direct alias | ScriptCards read location | Value role | Values / writable domain | Description | Write using |
|---|---|---|---|---|---|
| `drop_category` | Direct alias: `drop_category`<br>Builder/interface state: `builder` | `TRANSIENT` | Transient builder/interface value. Read for diagnostics only; exact domain is builder-state specific and not a supported live-character write surface. | `drop_category` is transient drag-and-drop or builder workflow state used while processing dropped content. | `Builder/interface state` |
| `drop_content` | Direct alias: `drop_content`<br>Builder/interface state: `builder` | `TRANSIENT` | Transient builder/interface value. Read for diagnostics only; exact domain is builder-state specific and not a supported live-character write surface. | `drop_content` is transient drag-and-drop or builder workflow state used while processing dropped content. | `Builder/interface state` |
| `drop_data` | Direct alias: `drop_data`<br>Builder/interface state: `builder` | `TRANSIENT` | Transient builder/interface value. Read for diagnostics only; exact domain is builder-state specific and not a supported live-character write surface. | `drop_data` is transient drag-and-drop or builder workflow payload data. | `Builder/interface state` |
| `drop_name` | Direct alias: `drop_name`<br>Builder/interface state: `builder` | `TRANSIENT` | Transient builder/interface value. Read for diagnostics only; exact domain is builder-state specific and not a supported live-character write surface. | `drop_name` is the transient name associated with drag-and-drop or builder workflow content. | `Builder/interface state` |

## Placeholder notation

| Placeholder | Meaning |
|---|---|
| `[selector]` | A zero-based typed-collection index, `shortID`, canonical ID, or unique collection-specific identity value such as `name`, `ability`, `speed`, or `spellLevel`. |
| `[index]` | A real zero-based array index. |
| `FIELD` | An existing primitive field on the selected typed record. |
| `VALUE` | The string, number, or boolean being written. |

## Fixed structured leaf locations

These are the **119 directly observed primitive or indexed `store.current` locations** from the current Beacon Sheet Map, rewritten into ScriptCards `sheet->...` syntax. This section fills the gap between the direct-alias tables and the typed canonical collections.

A path appearing here means the location was observed and its value type is known. It does **not** mean every field should be edited. Use the value domain and write guidance together.

### Character identity and About tab

| ScriptCards location | Value kind | Values / writable domain | Meaning | Write guidance |
|---|---|---|---|---|
| `sheet->about->aboutTabApperancesDisplayOrder` | array<br>`ORDER` | Ordered array of existing canonical `recordKey` strings; `[]` = no rows. Reordering changes display order; do not invent or orphan IDs. | This location stores the value named `aboutTabApperancesDisplayOrder` within the character's About-tab data and display order. | `ORDER` |
| `sheet->about->aboutTabCharacteristicsDisplayOrder` | array<br>`ORDER` | Ordered array of existing canonical `recordKey` strings; `[]` = no rows. Reordering changes display order; do not invent or orphan IDs. | This location stores the value named `aboutTabCharacteristicsDisplayOrder` within the character's About-tab data and display order. | `ORDER` |
| `sheet->about->characteristics->alignment` | string<br>`STORED` | String alignment value. The field is writable, but the controlled sources did not establish a closed enum; preserve sheet-supported alignment text. | This location stores the value named `alignment` within the character's About-tab data and display order. | `PUBLIC` — Prefer `alignment` for ordinary reads and writes through the verified public property; this structured path is its backing store. |
| `sheet->about->characteristics->size` | string<br>`STORED` | Observed/recognized values: `Medium`, `Small`. Complete sheet enum not independently proven. Other sheet-supported sizes may exist. | This location stores the value named `size` within the character's About-tab data and display order. | `PUBLIC` — Prefer `size` for ordinary reads and writes through the verified public property; this structured path is its backing store. |
| `sheet->character->createdWithBuilder` | boolean<br>`STORED` | `true` = character was created through the builder; `false` = character was not marked as builder-created. Provenance metadata; do not use this as a workflow toggle. | This location stores the value named `createdWithBuilder` within core character identity metadata stored by the Beacon sheet. | `PATH` — Treat this as provenance metadata; do not write it to change how the character is managed. |
| `sheet->character->creatureType` | string<br>`STORED` | Creature-type string. Open sheet content; complete enum not independently enumerated. | This location stores the value named `creatureType` within core character identity metadata stored by the Beacon sheet. | `PATH` |
| `sheet->character->pronouns` | string<br>`STORED` | Free-text pronouns string; blank is allowed. | This location stores the value named `pronouns` within core character identity metadata stored by the Beacon sheet. | `PATH` |
| `sheet->classLevel->currentExp` | number<br>`STORED` | Finite current XP number. Normally non-negative; hard validation/range was not independently probed. | This location stores the character's current experience points within direct experience state; class levels themselves remain canonical records. | `PUBLIC` — Prefer `experience` for ordinary reads and writes through the verified public property; this structured path is its backing store. |

### Hit points, Inspiration, and death saves

| ScriptCards location | Value kind | Values / writable domain | Meaning | Write guidance |
|---|---|---|---|---|
| `sheet->hitpoints->currentHP` | number<br>`STORED` | Finite HP number. `0` is valid; the sheet can temporarily store current HP above reconstructed maximum HP. Hard lower/upper validation was not independently probed. | This location stores the character's current hit points within current hit points, temporary hit points, and death-save state. | `PUBLIC` — Prefer `hp` for ordinary reads and writes through the verified public property; this structured path is its backing store. |
| `sheet->hitpoints->deathSaves->failures` | number<br>`STORED` | Integer `0`–`3`: number of failed death saves. | This location stores the current number of failed death saves within current hit points, temporary hit points, and death-save state. | `PUBLIC` + `PATH` — Use `deathsave_fail1` through `deathsave_fail3` for ordinary checkbox writes; use this count for deliberate count-based logic. |
| `sheet->hitpoints->deathSaves->open` | boolean<br>`STORED` | `true` = death-save UI/state is open; `false` = death-save UI/state is closed. Interface state, not a success/failure mark. | This location stores the value named `open` within current hit points, temporary hit points, and death-save state. | `PATH` — This is death-save interface state; use `successes` and `failures` for the actual tracked results. |
| `sheet->hitpoints->deathSaves->successes` | number<br>`STORED` | Integer `0`–`3`: number of successful death saves. | This location stores the current number of successful death saves within current hit points, temporary hit points, and death-save state. | `PUBLIC` + `PATH` — Use `deathsave_succ1` through `deathsave_succ3` for ordinary checkbox writes; use this count for deliberate count-based logic. |
| `sheet->hitpoints->tempHP` | number<br>`STORED` | Finite temporary-HP number. `0` = no temporary HP; normal use is non-negative. | This location stores the character's temporary hit points within current hit points, temporary hit points, and death-save state. | `PUBLIC` — Prefer `hp_temp` for ordinary reads and writes through the verified public property; this structured path is its backing store. |
| `sheet->inspiration->isInspired` | boolean<br>`STORED` | `true` = character has Inspiration; `false` = character does not have Inspiration. | This location stores whether the character currently has Inspiration within the character's current Inspiration state. | `PUBLIC` — Prefer `inspiration` for ordinary reads and writes through the verified public property; this structured path is its backing store. |

### Rules and sheet settings

| ScriptCards location | Value kind | Values / writable domain | Meaning | Write guidance |
|---|---|---|---|---|
| `sheet->campaignSettings->lastDefaultsApplied` | number<br>`STORED` | Numeric campaign-default version/marker. Diagnostic/internal state; do not edit as character data. | This location stores the value named `lastDefaultsApplied` within the campaign-default state already applied to this character. | `PATH` — Use this to diagnose campaign-default application; do not normally change it as character data. |
| `sheet->rest->longRestModalData->dawnResources` | boolean<br>`STORED` | `true` = include/apply dawn-resource handling in the rest dialog; `false` = do not apply that option. | This location stores the value named `dawnResources` within the options used by the short-rest and long-rest dialogs. | `SETTING` |
| `sheet->rest->longRestModalData->recoverExhaustion` | boolean<br>`STORED` | `true` = recover Exhaustion during the long-rest workflow; `false` = do not recover Exhaustion. | This location stores the value named `recoverExhaustion` within the options used by the short-rest and long-rest dialogs. | `SETTING` — Controls the long-rest dialog option; it is not the character’s current Exhaustion value. |
| `sheet->rest->longRestModalData->resetHpMax` | boolean<br>`STORED` | `true` = reset/recover maximum-HP effects during the rest workflow; `false` = do not reset maximum HP. | This location stores the value named `resetHpMax` within the options used by the short-rest and long-rest dialogs. | `SETTING` |
| `sheet->rest->longRestModalData->spellManagement` | boolean<br>`STORED` | `true` = enable spell-management behavior in the long-rest dialog; `false` = disable that behavior. | This location stores the value named `spellManagement` within the options used by the short-rest and long-rest dialogs. | `SETTING` — Controls spell management in the long-rest dialog; individual prepared state belongs to each Spell record. |
| `sheet->rest->shortRestModalData->autoApplyHealing` | boolean<br>`STORED` | `true` = automatically apply short-rest healing; `false` = do not auto-apply healing. | This location stores the value named `autoApplyHealing` within the options used by the short-rest and long-rest dialogs. | `SETTING` — Controls short-rest dialog behavior; it does not store a healing amount or current HP. |
| `sheet->rest->shortRestModalData->dawnResources` | boolean<br>`STORED` | `true` = include/apply dawn-resource handling in the rest dialog; `false` = do not apply that option. | This location stores the value named `dawnResources` within the options used by the short-rest and long-rest dialogs. | `SETTING` |
| `sheet->rest->shortRestModalData->resetHpMax` | boolean<br>`STORED` | `true` = reset/recover maximum-HP effects during the rest workflow; `false` = do not reset maximum HP. | This location stores the value named `resetHpMax` within the options used by the short-rest and long-rest dialogs. | `SETTING` |
| `sheet->settings->addDexTiebreaker` | boolean<br>`STORED` | `true` = use Dexterity as an initiative tiebreaker; `false` = do not use the Dexterity tiebreaker. | This location stores the value named `addDexTiebreaker` within the sheet's rules, display, roll, and behavior settings. | `SETTING` — Read this when reproducing the sheet’s initiative behavior. |
| `sheet->settings->encumbranceType` | string<br>`STORED` | Encumbrance-mode string. This is a finite sheet setting, but the exact accepted literal enum was not independently captured; read the existing value before changing it. | This location stores the value named `encumbranceType` within the sheet's rules, display, roll, and behavior settings. | `SETTING` |
| `sheet->settings->hideCombatHints` | boolean<br>`STORED` | `true` = hide combat hints; `false` = show combat hints. | This location stores the value named `hideCombatHints` within the sheet's rules, display, roll, and behavior settings. | `SETTING` |
| `sheet->settings->ignoreCoinWeight` | boolean<br>`STORED` | `true` = ignore coin weight; `false` = include coin weight. | This location stores the value named `ignoreCoinWeight` within the sheet's rules, display, roll, and behavior settings. | `SETTING` |
| `sheet->settings->isCampaignSettingsSheet` | boolean<br>`STORED` | `true` = sheet is flagged as a campaign-settings sheet; `false` = ordinary character sheet. Do not enable on a normal character. | This location stores the value named `isCampaignSettingsSheet` within the sheet's rules, display, roll, and behavior settings. | `SETTING` — This identifies a campaign-settings sheet; do not enable it on an ordinary character. |
| `sheet->settings->layoutState` | string<br>`STORED` | Layout-state string. Exact accepted literals were not independently captured; treat as UI state and preserve known values. | This location stores the value named `layoutState` within the sheet's rules, display, roll, and behavior settings. | `SETTING` |
| `sheet->settings->newRules` | boolean<br>`STORED` | `true` = use the newer rules mode; `false` = use the alternate/older rules mode. This changes rules behavior; exact UI wording was not independently captured. | This location stores the value named `newRules` within the sheet's rules, display, roll, and behavior settings. | `SETTING` — Read this before applying rules-version-specific behavior; writing it changes the sheet’s rules mode. |
| `sheet->settings->rollDamageAutomatic` | boolean<br>`STORED` | `true` = roll damage automatically with the attack; `false` = require/use separate damage action. | This location stores whether the sheet rolls damage automatically with an attack within the sheet's rules, display, roll, and behavior settings. | `SETTING` — Read this before deciding whether an attack needs a separate damage action; writing it changes sheet roll behavior. |
| `sheet->settings->rolls->advancedMode` | string<br>`STORED` | Advanced-roll mode string. Exact enum not independently captured. | This location stores the value named `advancedMode` within the sheet's rules, display, roll, and behavior settings. | `SETTING` |
| `sheet->settings->rolls->mode` | string<br>`STORED` | Observed/recognized values: `Advantage`, `Disadvantage`. Complete sheet enum not independently proven. These were directly observed in controlled writes; other normal/default state literal(s) were not independently captured. | Stores the sheet's current d20 roll mode. The controlled write test observed values such as `Advantage` and `Disadvantage`. | `SETTING` — Read this when reproducing the sheet's roll mode. |
| `sheet->settings->rolls->privacy` | string<br>`STORED` | Roll-visibility string. Semantics are public / GM / private visibility, but the exact stored literal spellings were not independently captured. | This location stores the public/GM/private roll-visibility setting within the sheet's rules, display, roll, and behavior settings. | `SETTING` — Read this to preserve public, GM, or private visibility in sheet-equivalent output. |
| `sheet->settings->showAllCrits` | boolean<br>`STORED` | `true` = show all critical-result details; `false` = use normal/limited critical display. | This location stores the value named `showAllCrits` within the sheet's rules, display, roll, and behavior settings. | `SETTING` |
| `sheet->settings->showPreparedSpells` | boolean<br>`STORED` | `true` = show prepared spells in the sheet view; `false` = do not show/filter them that way. | This location stores the value named `showPreparedSpells` within the sheet's rules, display, roll, and behavior settings. | `SETTING` — Controls spell-list display or filtering; individual prepared state belongs to `Spell._prepared`. |
| `sheet->settings->useConditionTokenSync` | boolean<br>`STORED` | `true` = synchronize sheet conditions with token markers; `false` = do not automatically synchronize condition/token-marker state. | This location stores the value named `useConditionTokenSync` within the sheet's rules, display, roll, and behavior settings. | `SETTING` — Writing this changes automatic synchronization between sheet conditions and token markers. |
| `sheet->sheetToSheet->lastSheetToSheetAcknowledged` | number<br>`STORED` | Numeric migration/acknowledgement marker. Internal state; do not edit as character data. | This location stores the value named `lastSheetToSheetAcknowledged` within the sheet-to-sheet migration acknowledgement state. | `PATH` — This is migration acknowledgement state; do not normally change it as live character data. |

### Section display order

| ScriptCards location | Value kind | Values / writable domain | Meaning | Write guidance |
|---|---|---|---|---|
| `sheet->actions->actionDisplayOrder` | array<br>`ORDER` | Ordered array of existing canonical `recordKey` strings; `[]` = no rows. Reordering changes display order; do not invent or orphan IDs. | This location stores the value named `actionDisplayOrder` within the record keys and order used by the Actions, Bonus Actions, Free Actions, and Reactions sections. | `ORDER` |
| `sheet->actions->bonusActionDisplayOrder` | array<br>`ORDER` | Ordered array of existing canonical `recordKey` strings; `[]` = no rows. Reordering changes display order; do not invent or orphan IDs. | This location stores the value named `bonusActionDisplayOrder` within the record keys and order used by the Actions, Bonus Actions, Free Actions, and Reactions sections. | `ORDER` |
| `sheet->actions->freeActionDisplayOrder` | array<br>`ORDER` | Ordered array of existing canonical `recordKey` strings; `[]` = no rows. Reordering changes display order; do not invent or orphan IDs. | This location stores the value named `freeActionDisplayOrder` within the record keys and order used by the Actions, Bonus Actions, Free Actions, and Reactions sections. | `ORDER` |
| `sheet->actions->reactionDisplayOrder` | array<br>`ORDER` | Ordered array of existing canonical `recordKey` strings; `[]` = no rows. Reordering changes display order; do not invent or orphan IDs. | This location stores the value named `reactionDisplayOrder` within the record keys and order used by the Actions, Bonus Actions, Free Actions, and Reactions sections. | `ORDER` |
| `sheet->attacks->attackDisplayOrder` | array<br>`ORDER` | Ordered array of existing canonical `recordKey` strings; `[]` = no rows. Reordering changes display order; do not invent or orphan IDs. | This location stores the canonical Attack record keys in the order shown by the sheet within the record keys and order used by the Attacks section. | `ORDER` |
| `sheet->attacks->attackDisplayOrder->[index]` | string<br>`ORDER` | Existing canonical `recordKey` string for the row at that position. Do not invent IDs. | This array element stores one entry in `attackDisplayOrder` within the record keys and order used by the Attacks section. | `ORDER` — Returns an Attack `[recordKey]`; use it to seed an exact canonical record read or write. |
| `sheet->background->aboutTabBackgroundDisplayOrder` | array<br>`ORDER` | Ordered array of existing canonical `recordKey` strings; `[]` = no rows. Reordering changes display order; do not invent or orphan IDs. | This location stores the value named `aboutTabBackgroundDisplayOrder` within the background display data shown on the About tab. | `ORDER` |
| `sheet->effects->effectDisplayOrder` | array<br>`ORDER` | Ordered array of existing canonical `recordKey` strings; `[]` = no rows. Reordering changes display order; do not invent or orphan IDs. | This location stores the value named `effectDisplayOrder` within the record keys and order used by the Effects section. | `ORDER` |
| `sheet->features->classFeatureDisplayOrder` | array<br>`ORDER` | Ordered array of existing canonical `recordKey` strings; `[]` = no rows. Reordering changes display order; do not invent or orphan IDs. | This location stores the value named `classFeatureDisplayOrder` within the record keys and order used by the feature sections. | `ORDER` |
| `sheet->features->classFeatureDisplayOrder->[index]` | string<br>`ORDER` | Existing canonical `recordKey` string for the row at that position. Do not invent IDs. | This array element stores one entry in `classFeatureDisplayOrder` within the record keys and order used by the feature sections. | `ORDER` — Returns a `Features` `[recordKey]`; use it to seed an exact canonical record read or write. |
| `sheet->features->featsDisplayOrder` | array<br>`ORDER` | Ordered array of existing canonical `recordKey` strings; `[]` = no rows. Reordering changes display order; do not invent or orphan IDs. | This location stores the value named `featsDisplayOrder` within the record keys and order used by the feature sections. | `ORDER` |
| `sheet->features->featsDisplayOrder->[index]` | string<br>`ORDER` | Existing canonical `recordKey` string for the row at that position. Do not invent IDs. | This array element stores one entry in `featsDisplayOrder` within the record keys and order used by the feature sections. | `ORDER` — Returns a `Features` `[recordKey]` displayed in the Feats section; use it to seed an exact canonical record read or write. |
| `sheet->features->otherDisplayOrder` | array<br>`ORDER` | Ordered array of existing canonical `recordKey` strings; `[]` = no rows. Reordering changes display order; do not invent or orphan IDs. | This location stores the value named `otherDisplayOrder` within the record keys and order used by the feature sections. | `ORDER` |
| `sheet->features->otherDisplayOrder->[index]` | string<br>`ORDER` | Existing canonical `recordKey` string for the row at that position. Do not invent IDs. | This array element stores one entry in `otherDisplayOrder` within the record keys and order used by the feature sections. | `ORDER` — Returns a `Features` `[recordKey]`; use it to seed an exact canonical record read or write. |
| `sheet->features->speciesTraitsDisplayOrder` | array<br>`ORDER` | Ordered array of existing canonical `recordKey` strings; `[]` = no rows. Reordering changes display order; do not invent or orphan IDs. | Stores the canonical record keys used to order species traits in the feature sections. | `ORDER` |
| `sheet->features->speciesTraitsDisplayOrder->[index]` | string<br>`ORDER` | Existing canonical `recordKey` string for the row at that position. Do not invent IDs. | This array element stores one entry in `speciesTraitsDisplayOrder` within the record keys and order used by the feature sections. | `ORDER` — Returns a `Features` `[recordKey]` displayed in the Species Traits section; use it to seed an exact canonical record read or write. |
| `sheet->notes->emptyCategories` | array<br>`ORDER` | Array of note-category name strings; `[]` = no empty categories. | This location stores the value named `emptyCategories` within notes categories and notes display order. | `ORDER` — Stores empty category names, not canonical record keys. |
| `sheet->notes->order->Allies` | array<br>`ORDER` | Array using the sheet's note-entry ordering schema. Exact element shape was not separately verified; preserve existing values/order rather than inventing entries. | Stores the entries and display order for the Allies note category. The controlled catalogue did not independently resolve the identity schema of each entry. | `ORDER` — Preserve the existing entry format and ordering unless that note schema has been separately verified. |
| `sheet->notes->order->Enemies` | array<br>`ORDER` | Array using the sheet's note-entry ordering schema. Exact element shape was not separately verified; preserve existing values/order rather than inventing entries. | Stores the entries and display order for the Enemies note category. The controlled catalogue did not independently resolve the identity schema of each entry. | `ORDER` — Preserve the existing entry format and ordering unless that note schema has been separately verified. |
| `sheet->notes->order->Organizations` | array<br>`ORDER` | Array using the sheet's note-entry ordering schema. Exact element shape was not separately verified; preserve existing values/order rather than inventing entries. | Stores the entries and display order for the Organizations note category. The controlled catalogue did not independently resolve the identity schema of each entry. | `ORDER` — Preserve the existing entry format and ordering unless that note schema has been separately verified. |
| `sheet->spells->displayOrder` | array<br>`ORDER` | Array of spell-level buckets (level `0` through `9`); each bucket is an array of existing Spell `recordKey` strings. `[]` buckets are valid. | Stores the spell-level order buckets used by the sheet. Each child bucket contains canonical Spell record keys. | `ORDER` |
| `sheet->spells->displayOrder->[index]` | array<br>`ORDER` | Array/container. Inspect element schema before editing; do not replace wholesale unless the exact container semantics are verified. | This array element stores one entry in `displayOrder` within spell display order and spell-section behavior. | `ORDER` — Returns one spell-level bucket; read its child elements to obtain actual Spell record keys. |
| `sheet->spells->displayOrder->[index]->[index]` | string<br>`ORDER` | String value. Exact enum/grammar was not independently established. | This array element stores one entry in `[index]` within spell display order and spell-section behavior. | `ORDER` — Returns a Spell `[recordKey]`; use it to seed an exact canonical Spell read or write. |
| `sheet->spells->generalSpellSettings->defaultToFullscreen` | boolean<br>`STORED` | `true` = open spell details in fullscreen by default; `false` = do not default to fullscreen. | This location stores the value named `defaultToFullscreen` within spell display order and spell-section behavior. | `PATH` |
| `sheet->spells->generalSpellSettings->showPreparedBar` | boolean<br>`STORED` | `true` = show the prepared-spell bar; `false` = hide the prepared-spell bar. | This location stores the value named `showPreparedBar` within spell display order and spell-section behavior. | `PATH` |
| `sheet->spells->generalSpellSettings->showPreparedSpellsOnly` | boolean<br>`STORED` | `true` = filter the spell list to prepared spells; `false` = show spells regardless of prepared state. | This location stores the value named `showPreparedSpellsOnly` within spell display order and spell-section behavior. | `PATH` — This is a display filter; individual prepared state belongs to `Spell._prepared`. |
| `sheet->spells->generalSpellSettings->spellcastings` | string<br>`STORED` | Spellcasting-selection state encoded as a string. Exact format/enum was not independently captured; inspect the current value before editing. | This location stores the value named `spellcastings` within spell display order and spell-section behavior. | `PATH` — Inspect the stored format before editing; this is spellcasting-selection state rather than a single spell record. |
| `sheet->spells->generalSpellSettings->useSlotAlwaysPrepared` | boolean<br>`STORED` | `true` = use prepared-slot behavior for always-prepared spells; `false` = do not use that slot behavior. | This location stores the value named `useSlotAlwaysPrepared` within spell display order and spell-section behavior. | `PATH` |
| `sheet->spells->generalSpellSettings->useSlotDefault` | boolean<br>`STORED` | `true` = use the default spell-slot behavior; `false` = do not use the default slot behavior. | This location stores the value named `useSlotDefault` within spell display order and spell-section behavior. | `PATH` |
| `sheet->weaponMasteries->masteryDisplayOrder` | array<br>`ORDER` | Ordered array of existing canonical `recordKey` strings; `[]` = no rows. Reordering changes display order; do not invent or orphan IDs. | This location stores the value named `masteryDisplayOrder` within weapon-mastery display order. | `ORDER` |

### Inventory and currencies

| ScriptCards location | Value kind | Values / writable domain | Meaning | Write guidance |
|---|---|---|---|---|
| `sheet->currencies->initialized` | boolean<br>`STORED` | `true` = currency system has been initialized; `false` = currency system is not initialized. Initialization flag; change Currency records/aliases instead of toggling this to edit money. | This location stores the value named `initialized` within the currency subsystem's initialization state. | `PATH` — This is an initialization flag; change Currency records or `cp` through `pp` to change actual money values. |
| `sheet->inventory->equipmentDisplayOrder` | array<br>`ORDER` | Ordered array of existing canonical `recordKey` strings; `[]` = no rows. Reordering changes display order; do not invent or orphan IDs. | This location stores the value named `equipmentDisplayOrder` within inventory display order and editing behavior. | `ORDER` |
| `sheet->inventory->equipmentDisplayOrder->[index]` | string<br>`ORDER` | Existing canonical `recordKey` string for the row at that position. Do not invent IDs. | This array element stores one entry in `equipmentDisplayOrder` within inventory display order and editing behavior. | `ORDER` — Returns an Item `[recordKey]`; use it to seed an exact canonical Item read or write. |
| `sheet->inventory->incrementalQuantityEditing` | boolean<br>`STORED` | `true` = use incremental quantity editing; `false` = use non-incremental quantity editing. | This location stores the value named `incrementalQuantityEditing` within inventory display order and editing behavior. | `PATH` — This controls inventory editing behavior; it does not store an item quantity. |
| `sheet->inventory->otherPossessionsDisplayOrder` | array<br>`ORDER` | Ordered array of existing canonical `recordKey` strings; `[]` = no rows. Reordering changes display order; do not invent or orphan IDs. | This location stores the value named `otherPossessionsDisplayOrder` within inventory display order and editing behavior. | `ORDER` |

### Spell slots

| ScriptCards location | Value kind | Values / writable domain | Meaning | Write guidance |
|---|---|---|---|---|
| `sheet->spellSlots->currentByLevel->CANTRIP` | number<br>`STORED` | Finite numeric diagnostic counter. Cantrips do not consume spell slots; do not use this as a normal/Pact slot pool. | This location stores the value named `CANTRIP` within current normal and Pact spell-slot counters and slot-consumption behavior. | `PATH` — Treat this as diagnostic slot-state data; cantrips do not consume normal spell slots. |
| `sheet->spellSlots->currentByLevel->EIGHTH` | number<br>`STORED` | Non-negative integer remaining/available normal slots at this level. `0` = none remaining. Do not exceed the character's corresponding capacity unless deliberately testing invalid state. | This location stores the value named `EIGHTH` within current normal and Pact spell-slot counters and slot-consumption behavior. | `PATH` — For remaining-slot writes, use this exact structured path. The related public `lvl8_slots_expended` has sheet-defined translated semantics and should not be used as a direct numeric substitute for this remaining-slot value. |
| `sheet->spellSlots->currentByLevel->FIFTH` | number<br>`STORED` | Non-negative integer remaining/available normal slots at this level. `0` = none remaining. Do not exceed the character's corresponding capacity unless deliberately testing invalid state. | This location stores the value named `FIFTH` within current normal and Pact spell-slot counters and slot-consumption behavior. | `PATH` — For remaining-slot writes, use this exact structured path. The related public `lvl5_slots_expended` has sheet-defined translated semantics and should not be used as a direct numeric substitute for this remaining-slot value. |
| `sheet->spellSlots->currentByLevel->FIRST` | number<br>`STORED` | Non-negative integer remaining/available normal slots at this level. `0` = none remaining. Do not exceed the character's corresponding capacity unless deliberately testing invalid state. | This location stores the value named `FIRST` within current normal and Pact spell-slot counters and slot-consumption behavior. | `PATH` — For remaining-slot writes, use this exact structured path. The related public `lvl1_slots_expended` has sheet-defined translated semantics and should not be used as a direct numeric substitute for this remaining-slot value. |
| `sheet->spellSlots->currentByLevel->FOURTH` | number<br>`STORED` | Non-negative integer remaining/available normal slots at this level. `0` = none remaining. Do not exceed the character's corresponding capacity unless deliberately testing invalid state. | This location stores the value named `FOURTH` within current normal and Pact spell-slot counters and slot-consumption behavior. | `PATH` — For remaining-slot writes, use this exact structured path. The related public `lvl4_slots_expended` has sheet-defined translated semantics and should not be used as a direct numeric substitute for this remaining-slot value. |
| `sheet->spellSlots->currentByLevel->NINTH` | number<br>`STORED` | Non-negative integer remaining/available normal slots at this level. `0` = none remaining. Do not exceed the character's corresponding capacity unless deliberately testing invalid state. | This location stores the value named `NINTH` within current normal and Pact spell-slot counters and slot-consumption behavior. | `PATH` — For remaining-slot writes, use this exact structured path. The related public `lvl9_slots_expended` has sheet-defined translated semantics and should not be used as a direct numeric substitute for this remaining-slot value. |
| `sheet->spellSlots->currentByLevel->SECOND` | number<br>`STORED` | Non-negative integer remaining/available normal slots at this level. `0` = none remaining. Do not exceed the character's corresponding capacity unless deliberately testing invalid state. | This location stores the value named `SECOND` within current normal and Pact spell-slot counters and slot-consumption behavior. | `PATH` — For remaining-slot writes, use this exact structured path. The related public `lvl2_slots_expended` has sheet-defined translated semantics and should not be used as a direct numeric substitute for this remaining-slot value. |
| `sheet->spellSlots->currentByLevel->SEVENTH` | number<br>`STORED` | Non-negative integer remaining/available normal slots at this level. `0` = none remaining. Do not exceed the character's corresponding capacity unless deliberately testing invalid state. | This location stores the value named `SEVENTH` within current normal and Pact spell-slot counters and slot-consumption behavior. | `PATH` — For remaining-slot writes, use this exact structured path. The related public `lvl7_slots_expended` has sheet-defined translated semantics and should not be used as a direct numeric substitute for this remaining-slot value. |
| `sheet->spellSlots->currentByLevel->SIXTH` | number<br>`STORED` | Non-negative integer remaining/available normal slots at this level. `0` = none remaining. Do not exceed the character's corresponding capacity unless deliberately testing invalid state. | This location stores the value named `SIXTH` within current normal and Pact spell-slot counters and slot-consumption behavior. | `PATH` — For remaining-slot writes, use this exact structured path. The related public `lvl6_slots_expended` has sheet-defined translated semantics and should not be used as a direct numeric substitute for this remaining-slot value. |
| `sheet->spellSlots->currentByLevel->THIRD` | number<br>`STORED` | Non-negative integer remaining/available normal slots at this level. `0` = none remaining. Do not exceed the character's corresponding capacity unless deliberately testing invalid state. | This location stores the value named `THIRD` within current normal and Pact spell-slot counters and slot-consumption behavior. | `PATH` — For remaining-slot writes, use this exact structured path. The related public `lvl3_slots_expended` has sheet-defined translated semantics and should not be used as a direct numeric substitute for this remaining-slot value. |
| `sheet->spellSlots->currentPactByLevel->CANTRIP` | number<br>`STORED` | Finite numeric diagnostic counter. Cantrips do not consume spell slots; do not use this as a normal/Pact slot pool. | This location stores the value named `CANTRIP` within current normal and Pact spell-slot counters and slot-consumption behavior. | `PATH` — Treat this as diagnostic Pact-slot data; cantrips do not consume Pact slots. |
| `sheet->spellSlots->currentPactByLevel->EIGHTH` | number<br>`STORED` | Non-negative integer remaining/available Pact slots at this level. `0` = none remaining. Do not exceed the character's corresponding capacity unless deliberately testing invalid state. | This location stores the value named `EIGHTH` within current normal and Pact spell-slot counters and slot-consumption behavior. | `PATH` |
| `sheet->spellSlots->currentPactByLevel->FIFTH` | number<br>`STORED` | Non-negative integer remaining/available Pact slots at this level. `0` = none remaining. Do not exceed the character's corresponding capacity unless deliberately testing invalid state. | This location stores the value named `FIFTH` within current normal and Pact spell-slot counters and slot-consumption behavior. | `PATH` |
| `sheet->spellSlots->currentPactByLevel->FIRST` | number<br>`STORED` | Non-negative integer remaining/available Pact slots at this level. `0` = none remaining. Do not exceed the character's corresponding capacity unless deliberately testing invalid state. | This location stores the value named `FIRST` within current normal and Pact spell-slot counters and slot-consumption behavior. | `PATH` |
| `sheet->spellSlots->currentPactByLevel->FOURTH` | number<br>`STORED` | Non-negative integer remaining/available Pact slots at this level. `0` = none remaining. Do not exceed the character's corresponding capacity unless deliberately testing invalid state. | This location stores the value named `FOURTH` within current normal and Pact spell-slot counters and slot-consumption behavior. | `PATH` |
| `sheet->spellSlots->currentPactByLevel->NINTH` | number<br>`STORED` | Non-negative integer remaining/available Pact slots at this level. `0` = none remaining. Do not exceed the character's corresponding capacity unless deliberately testing invalid state. | This location stores the value named `NINTH` within current normal and Pact spell-slot counters and slot-consumption behavior. | `PATH` |
| `sheet->spellSlots->currentPactByLevel->SECOND` | number<br>`STORED` | Non-negative integer remaining/available Pact slots at this level. `0` = none remaining. Do not exceed the character's corresponding capacity unless deliberately testing invalid state. | This location stores the value named `SECOND` within current normal and Pact spell-slot counters and slot-consumption behavior. | `PATH` |
| `sheet->spellSlots->currentPactByLevel->SEVENTH` | number<br>`STORED` | Non-negative integer remaining/available Pact slots at this level. `0` = none remaining. Do not exceed the character's corresponding capacity unless deliberately testing invalid state. | This location stores the value named `SEVENTH` within current normal and Pact spell-slot counters and slot-consumption behavior. | `PATH` |
| `sheet->spellSlots->currentPactByLevel->SIXTH` | number<br>`STORED` | Non-negative integer remaining/available Pact slots at this level. `0` = none remaining. Do not exceed the character's corresponding capacity unless deliberately testing invalid state. | This location stores the value named `SIXTH` within current normal and Pact spell-slot counters and slot-consumption behavior. | `PATH` |
| `sheet->spellSlots->currentPactByLevel->THIRD` | number<br>`STORED` | Non-negative integer remaining/available Pact slots at this level. `0` = none remaining. Do not exceed the character's corresponding capacity unless deliberately testing invalid state. | This location stores the value named `THIRD` within current normal and Pact spell-slot counters and slot-consumption behavior. | `PATH` |
| `sheet->spellSlots->useSpellSlotOnCast` | boolean<br>`STORED` | `true` = automatically consume a spell slot when casting; `false` = do not automatically consume a slot. | This location stores the value named `useSpellSlotOnCast` within current normal and Pact spell-slot counters and slot-consumption behavior. | `PATH` — Controls automatic slot consumption when casting; it is not a slot count. |

### NPC metadata

| ScriptCards location | Value kind | Values / writable domain | Meaning | Write guidance |
|---|---|---|---|---|
| `sheet->npc->acNotes` | string<br>`STORED` | Free-text NPC AC notes; blank allowed. | This location stores the value named `acNotes` within NPC-only scalar metadata. | `PATH` — Supplemental NPC AC text only; read final AC from `ac` and Armor Class records. |
| `sheet->npc->challengeRating` | string<br>`STORED` | Challenge Rating stored as a string (examples include fractional text such as `1/8`). Use a sheet-supported CR representation; exact full literal set was not independently enumerated. | This location stores the value named `challengeRating` within NPC-only scalar metadata. | `PATH` — Use this as the direct NPC Challenge Rating value; `npc_challenge` is a compatibility view of this path. |
| `sheet->npc->compendiumDropData->categoryName` | string<br>`STORED` | Compendium provenance string. Read-only for normal character editing; do not invent values. | This location stores the value named `categoryName` within NPC-only scalar metadata. | `PATH` — Compendium-import provenance; read for diagnostics and do not normally edit it. |
| `sheet->npc->compendiumDropData->expansionId` | number<br>`STORED` | Numeric compendium expansion identifier. Provenance metadata; do not invent/change casually. | This location stores the value named `expansionId` within NPC-only scalar metadata. | `PATH` — Compendium-import provenance; read for diagnostics and do not normally edit it. |
| `sheet->npc->compendiumDropData->pageName` | string<br>`STORED` | Compendium provenance string. Read-only for normal character editing; do not invent values. | This location stores the value named `pageName` within NPC-only scalar metadata. | `PATH` — Compendium-import provenance; read for diagnostics and do not normally edit it. |
| `sheet->npc->compendiumDropData->tokenImg` | string<br>`STORED` | Compendium token-image URL/string. Provenance field, not the live token image. | This location stores the value named `tokenImg` within NPC-only scalar metadata. | `PATH` — Compendium-import provenance; this is not the active token object’s image source. |
| `sheet->npc->customXP` | string<br>`STORED` | Blank or numeric-text XP override. A nonblank numeric value overrides CR-derived XP in the tested behavior; blank allows CR-derived XP. | This location stores the value named `customXP` within NPC-only scalar metadata. | `PATH` — Use only for a manual NPC XP override; Challenge Rating remains at `challengeRating`. |
| `sheet->npc->gear` | string<br>`STORED` | Free-text Gear string; blank allowed. | This location stores the value named `gear` within NPC-only scalar metadata. | `PATH` — Direct NPC Gear text; no canonical-record lookup is required. |
| `sheet->npc->habitat` | string<br>`STORED` | Free-text Habitat string; blank allowed. | This location stores the value named `habitat` within NPC-only scalar metadata. | `PATH` — Direct NPC Habitat text; no canonical-record lookup is required. |
| `sheet->npc->legendaryActionCompendiumNum` | number<br>`STORED` | Finite numeric legendary-action count/allowance. Normal use is a non-negative integer. | This location stores the value named `legendaryActionCompendiumNum` within NPC-only scalar metadata. | `PATH` — Stores the legendary-action count or allowance, not the action descriptions. |
| `sheet->npc->legendaryActionSummary` | string<br>`STORED` | Free-text/HTML-like legendary-action summary; blank allowed. | This location stores the value named `legendaryActionSummary` within NPC-only scalar metadata. | `PATH` — Stores the legendary-action summary text, not the individual Action records. |
| `sheet->npc->mythicActionSummary` | string<br>`STORED` | Free-text/HTML-like mythic-action summary; blank allowed. | This location stores the value named `mythicActionSummary` within NPC-only scalar metadata. | `PATH` — Stores mythic-action summary text, not the individual Action records. |
| `sheet->npc->rollHP` | string<br>`STORED` | HP formula text (dice/formula string). This is not current or maximum HP. | This location stores the value named `rollHP` within NPC-only scalar metadata. | `PATH` — Stores the NPC HP formula text; current HP remains at `hp`. |
| `sheet->npc->treasure` | string<br>`STORED` | Free-text Treasure string; blank allowed. | This location stores the value named `treasure` within NPC-only scalar metadata. | `PATH` — Direct NPC Treasure text; do not confuse it with the synthetic legacy `treasure` field. |

### Bastion, shop, and other state

| ScriptCards location | Value kind | Values / writable domain | Meaning | Write guidance |
|---|---|---|---|---|
| `sheet->bastion->bastionDefenders` | string<br>`STORED` | Bastion-defender state stored as a string; exact internal grammar was not independently mapped. | This location stores the value named `bastionDefenders` within the character's Bastion state. | `PATH` |
| `sheet->bastion->bastionDescription` | string<br>`STORED` | Free-text Bastion description; blank allowed. | This location stores the value named `bastionDescription` within the character's Bastion state. | `PATH` |
| `sheet->bastion->bastionLevel` | number<br>`STORED` | Finite numeric Bastion level. Exact valid range was not independently probed. | This location stores the value named `bastionLevel` within the character's Bastion state. | `PATH` |
| `sheet->bastion->characterLink` | string<br>`STORED` | Existing valid character-link identifier/string. Do not invent or point to an unrelated character. | This location stores the value named `characterLink` within the character's Bastion state. | `PATH` — This is a relationship identifier; write only a valid character link. |
| `sheet->shop->isLocked` | boolean<br>`STORED` | `true` = shop is locked; `false` = shop is unlocked. | This location stores the value named `isLocked` within shop-sheet configuration and shop state. | `PATH` |
| `sheet->shop->lockDC` | number<br>`STORED` | Finite numeric lock DC. | This location stores the value named `lockDC` within shop-sheet configuration and shop state. | `PATH` |
| `sheet->shop->sheetToSheetEnabled` | boolean<br>`STORED` | `true` = shop sheet-to-sheet transfer is enabled; `false` = sheet-to-sheet transfer is disabled. | This location stores the value named `sheetToSheetEnabled` within shop-sheet configuration and shop state. | `PATH` — Controls shop sheet-to-sheet transfers; it is independent of the shop lock state. |
| `sheet->shop->shopDescription` | string<br>`STORED` | Free-text shop description; blank allowed. | This location stores the value named `shopDescription` within shop-sheet configuration and shop state. | `PATH` |
| `sheet->shop->shopDiscountMarkup` | number<br>`STORED` | Finite numeric discount/markup value. Exact scale/sign convention was not independently probed; read the existing value before changing it. | This location stores the value named `shopDiscountMarkup` within shop-sheet configuration and shop state. | `PATH` |
| `sheet->shop->shopOwner` | string<br>`STORED` | Free-text shop-owner string; blank allowed. | This location stores the value named `shopOwner` within shop-sheet configuration and shop state. | `PATH` |
| `sheet->shop->shopStaff` | string<br>`STORED` | Free-text shop-staff string; blank allowed. | This location stores the value named `shopStaff` within shop-sheet configuration and shop state. | `PATH` |
| `sheet->shop->type` | string<br>`STORED` | Shop-type string. Exact accepted enum was not independently captured; internal sheet-role field, not a normal character customization. | Stores the shop type used by the shop sheet. | `PATH` — Identifies the shop-sheet type; do not change it merely to repurpose a normal character. |

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

| Field | ScriptCards location | Value kind | Values / writable domain | Description | Use |
|---|---|---|---|---|---|
| `ability` | `abilityscores->[selector]->ability` | `INPUT` | Ability name. Verified/recognized values: `Strength`, `Dexterity`, `Constitution`, `Intelligence`, `Wisdom`, `Charisma`. | On an Ability Score record, this field identifies the ability used by this record or formula. | `FIND` + `INPUT` + `RECORD` |
| `calculation` | `abilityscores->[selector]->calculation` | `INPUT` | Observed/recognized values: `Set Base`, `Set Value`, `Modify`. Complete sheet enum not independently proven. Current ScriptCards local Ability Score reconstruction also recognizes `Minimum`. | On an Ability Score record, this field identifies the calculation method used by this record. | `FIND` + `INPUT` + `RECORD` |
| `valueFormula.flatValue` | `abilityscores->[selector]->valueFormula->flatValue` | `INPUT` | Finite numeric formula input. Meaning depends on the record: score/AC/HP/range/slot/mastery capacity. Range is not globally fixed. | On an Ability Score record, this field stores a finite score component. | `FIND` + `INPUT` + `RECORD` — Use the matching direct ability alias for ordinary changes; edit this field only for deliberate record-level control. |
| `valueFormula.ability` | `abilityscores->[selector]->valueFormula->ability` | `INPUT` | Ability-formula object/reference rather than a free text ability name. Do not replace the whole object; use verified primitive children where mapped. | On an Ability Score record, this field identifies the ability used by this record or formula. | `FIND` + `INPUT` + `RECORD` |
| `_enabled` | `abilityscores->[selector]->_enabled` | `STORED` | `true` = record participates in the live character model; `false` = record is disabled/excluded. This is a record-availability flag, not the same as a Condition `_active` toggle. | On an Ability Score record, this field stores whether the canonical record participates in the live character model. | `FIND` + `TOGGLE` + `RECORD` |
| `name` | `abilityscores->[selector]->name` | `STORED` | Free-text display name. Blank may be technically storable, but names are used for display and sometimes typed selectors; keep it unique when selecting by name. | On an Ability Score record, this field stores the record's primary display name. | `FIND` + `IDENTITY` |
| `shortID` | `abilityscores->[selector]->shortID` | `STORED` | Existing Beacon compact record ID string. Treat as identity; **do not invent or casually change it**. | On an Ability Score record, this field stores the compact ID used by Beacon sheet action calls. | `FIND` + `IDENTITY` |

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

| Field | ScriptCards location | Value kind | Values / writable domain | Description | Use |
|---|---|---|---|---|---|
| `actionType` | `actions->[selector]->actionType` | `STORED` | Verified/recognized values: `Action`, `Bonus Action`, `Free Action`, `Reaction`, `Legendary`, `Mythic`. Changing it can also require moving the record key to the matching display-order array. | On an Action record, this field identifies whether the record is an Action, Bonus Action, Reaction, Free Action, or another action category. | `FIND` + `RECORD` — Changing the category may also require the record identity to appear in the matching action display-order array. |
| `description` | `actions->[selector]->description` | `STORED` | Free text/string. Blank is allowed where the sheet uses no text. Preserve any sheet-specific formatting already present. | On an Action record, this field stores the human-readable description. | `FIND` + `RECORD` |
| `name` | `actions->[selector]->name` | `STORED` | Free-text display name. Blank may be technically storable, but names are used for display and sometimes typed selectors; keep it unique when selecting by name. | On an Action record, this field stores the record's primary display name. | `FIND` + `IDENTITY` |
| `shortID` | `actions->[selector]->shortID` | `STORED` | Existing Beacon compact record ID string. Treat as identity; **do not invent or casually change it**. | On an Action record, this field stores the compact ID used by Beacon sheet action calls. | `FIND` + `IDENTITY` — Use this for the Beacon action call; typed writes use the selected collection path. |
| `_enabled` | `actions->[selector]->_enabled` | `STORED` | `true` = record participates in the live character model; `false` = record is disabled/excluded. This is a record-availability flag, not the same as a Condition `_active` toggle. | On an Action record, this field stores whether the canonical record participates in the live character model. | `FIND` + `TOGGLE` + `RECORD` |
| `arrayPosition` | `actions->[selector]->arrayPosition` | `ORDER` | Numeric ordering position. Exact range is not verified. Explicit display-order arrays can override this fallback ordering. | On an Action record, this field stores the record's relative display position among records of the same family. | `FIND` + `ORDER` |
| `parentID` | `actions->[selector]->parentID` | `STORED` | Existing canonical parent `recordKey`, or blank only where the sheet already permits no parent. **Do not invent IDs.** | On an Action record, this field stores the relationship ID of the record's immediate parent. | `FIND` + `GRAPH` |
| `childIDs` | `actions->[selector]->childIDs` | `STORED` | Array of existing canonical child `recordKey` values; `[]` = no children. Container value; do not replace wholesale through an ordinary typed write. | On an Action record, this field stores the relationship IDs of this record's immediate child records. | `FIND` + `GRAPH` — Contains relationship IDs; edit an existing array element rather than replacing the whole array. |

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

| Field | ScriptCards location | Value kind | Values / writable domain | Description | Use |
|---|---|---|---|---|---|
| `calculation` | `armorclasses->[selector]->calculation` | `INPUT` | Observed/recognized values: `Set Base`, `Set Value`, `Modify`. Complete sheet enum not independently proven. | On an Armor Class record, this field identifies the calculation method used by this record. | `FIND` + `INPUT` + `RECORD` |
| `defaultAbility` | `armorclasses->[selector]->defaultAbility` | `STORED` | `true` = use the record's default ability contribution; `false` = do not use the default ability contribution. Exact AC precedence beyond the tested configurations is not fully mapped. | On an Armor Class record, this field stores the default ability used by the formula. | `FIND` + `RECORD` |
| `valueFormula.flatValue` | `armorclasses->[selector]->valueFormula->flatValue` | `INPUT` | Finite numeric formula input. Meaning depends on the record: score/AC/HP/range/slot/mastery capacity. Range is not globally fixed. | On an Armor Class record, this field stores a finite value used as an input by a formula. | `FIND` + `INPUT` + `RECORD` |
| `valueFormula.ability` | `armorclasses->[selector]->valueFormula->ability` | `INPUT` | Ability-formula object/reference rather than a free text ability name. Do not replace the whole object; use verified primitive children where mapped. | On an Armor Class record, this field identifies the ability used by this record or formula. | `FIND` + `INPUT` + `RECORD` |
| `_enabled` | `armorclasses->[selector]->_enabled` | `STORED` | `true` = record participates in the live character model; `false` = record is disabled/excluded. This is a record-availability flag, not the same as a Condition `_active` toggle. | On an Armor Class record, this field stores whether the canonical record participates in the live character model. | `FIND` + `TOGGLE` + `RECORD` |
| `parentID` | `armorclasses->[selector]->parentID` | `STORED` | Existing canonical parent `recordKey`, or blank only where the sheet already permits no parent. **Do not invent IDs.** | On an Armor Class record, this field stores the relationship ID of the record's immediate parent. | `FIND` + `GRAPH` |
| `name` | `armorclasses->[selector]->name` | `STORED` | Free-text display name. Blank may be technically storable, but names are used for display and sometimes typed selectors; keep it unique when selecting by name. | On an Armor Class record, this field stores the record's primary display name. | `FIND` + `IDENTITY` |
| `shortID` | `armorclasses->[selector]->shortID` | `STORED` | Existing Beacon compact record ID string. Treat as identity; **do not invent or casually change it**. | On an Armor Class record, this field stores the compact ID used by Beacon sheet action calls. | `FIND` + `IDENTITY` |

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

| Field | ScriptCards location | Value kind | Values / writable domain | Description | Use |
|---|---|---|---|---|---|
| `actionType` | `attacks->[selector]->actionType` | `STORED` | Verified/recognized values: `Action`, `Bonus Action`, `Free Action`, `Reaction`, `Legendary`, `Mythic`. Changing it can also require moving the record key to the matching display-order array. | On an Attack record, this field identifies whether the record is an Action, Bonus Action, Reaction, Free Action, or another action category. | `FIND` + `RECORD` |
| `attack.type` | `attacks->[selector]->attack->type` | `STORED` | Observed/recognized values: `Melee`, `Ranged`, `Spell Attack`, `Spell Save`, `Attack Save`. Complete sheet enum not independently proven. The sheet map explicitly notes that additional display/action variants may exist. | On an Attack record, this field identifies the canonical record type. | `FIND` + `IDENTITY` |
| `attack.abilityBonus` | `attacks->[selector]->attack->abilityBonus` | `STORED` | Ability reference used for the attack. Usually one of `Strength`, `Dexterity`, `Constitution`, `Intelligence`, `Wisdom`, `Charisma`; blank/absent lets the sheet use attack-type defaults. Exact alternate representations are not fully enumerated. | On an Attack record, this field stores the ability contribution used by the attack. | `FIND` + `RECORD` |
| `attack.proficiencyLevel` | `attacks->[selector]->attack->proficiencyLevel` | `INPUT` | Observed/recognized values: `Proficient`, `Expertise`. Complete sheet enum not independently proven. Other proficiency tiers were not independently enumerated in the controlled data. | On an Attack record, this field stores the proficiency tier, such as Proficient or Expertise. | `FIND` + `INPUT` + `RECORD` |
| `attack.bonus` | `attacks->[selector]->attack->bonus` | `INPUT` | Finite numeric attack bonus input. The audited field is numeric; use other modifier records for more complex bonus behavior. | On an Attack record, this field stores a finite bonus or bonus expression. | `FIND` + `INPUT` + `RECORD` |
| `autoHit` | `attacks->[selector]->autoHit` | `STORED` | `true` = skip the attack roll and apply the attack/effect automatically; `false` = use normal attack/save behavior. | On an Attack record, this field stores whether the attack skips an attack roll and automatically applies its effect or damage. | `FIND` + `RECORD` — Changes whether the attack rolls to hit; it does not change the attack bonus. |
| `repeat` | `attacks->[selector]->repeat` | `STORED` | Numeric repeat/multiattack count. `1` = one occurrence; larger positive values repeat. Exact minimum/maximum validation was not independently probed. | On an Attack record, this field stores attack repetition or multiattack information. | `FIND` + `RECORD` |
| `range` | `attacks->[selector]->range` | `STORED` | Free text/string. Blank is allowed where the sheet uses no text. Preserve any sheet-specific formatting already present. | On an Attack record, this field stores the attack or spell range. | `FIND` + `RECORD` |
| `_reach` | `attacks->[selector]->_reach` | `STORED` | `true` = reach-specific display/state is enabled; `false` = reach-specific display/state is disabled. Exact UI effect was not independently isolated. | On an Attack record, this field stores `_reach`. | `FIND` + `RECORD` |
| `_reachText` | `attacks->[selector]->_reachText` | `STORED` | Free text/string. Blank is allowed where the sheet uses no text. Preserve any sheet-specific formatting already present. | On an Attack record, this field stores `_reachText`. | `FIND` + `RECORD` |
| `save.saveAbility` | `attacks->[selector]->save->saveAbility` | `STORED` | Saving-throw ability name. Verified/recognized values: `Strength`, `Dexterity`, `Constitution`, `Intelligence`, `Wisdom`, `Charisma`. | On an Attack record, this field stores `saveAbility`. | `FIND` + `RECORD` |
| `save.saveFlat` | `attacks->[selector]->save->saveFlat` | `STORED` | Finite numeric save DC/base input. `save.saveFlat` is used for a fixed DC; formula fields participate in calculated DCs. | On an Attack record, this field stores `saveFlat`. | `FIND` + `RECORD` |
| `save.saveFormula.flatValue` | `attacks->[selector]->save->saveFormula->flatValue` | `INPUT` | Finite numeric save DC/base input. `save.saveFlat` is used for a fixed DC; formula fields participate in calculated DCs. | On an Attack record, this field stores a finite value used as an input by a formula. | `FIND` + `INPUT` + `RECORD` |
| `save.onFail` | `attacks->[selector]->save->onFail` | `STORED` | Free text/string. Blank is allowed where the sheet uses no text. Preserve any sheet-specific formatting already present. | On an Attack record, this field stores the effect or text used when a save fails. | `FIND` + `RECORD` |
| `save.onSucceed` | `attacks->[selector]->save->onSucceed` | `STORED` | Free text/string. Blank is allowed where the sheet uses no text. Preserve any sheet-specific formatting already present. | On an Attack record, this field stores the effect or text used when a save succeeds. | `FIND` + `RECORD` |
| `onHitDisplay` | `attacks->[selector]->onHitDisplay` | `STORED` | Free text/string. Blank is allowed where the sheet uses no text. Preserve any sheet-specific formatting already present. | On an Attack record, this field stores `onHitDisplay`. | `FIND` + `RECORD` |
| `description` | `attacks->[selector]->description` | `STORED` | Free text/string. Blank is allowed where the sheet uses no text. Preserve any sheet-specific formatting already present. | On an Attack record, this field stores the human-readable description. | `FIND` + `RECORD` |
| `name` | `attacks->[selector]->name` | `STORED` | Free-text display name. Blank may be technically storable, but names are used for display and sometimes typed selectors; keep it unique when selecting by name. | On an Attack record, this field stores the record's primary display name. | `FIND` + `IDENTITY` |
| `shortID` | `attacks->[selector]->shortID` | `STORED` | Existing Beacon compact record ID string. Treat as identity; **do not invent or casually change it**. | On an Attack record, this field stores the compact ID used by Beacon sheet action calls. | `FIND` + `IDENTITY` — Use this for the Beacon attack action call; typed writes use the selected collection path. |
| `_enabled` | `attacks->[selector]->_enabled` | `STORED` | `true` = record participates in the live character model; `false` = record is disabled/excluded. This is a record-availability flag, not the same as a Condition `_active` toggle. | On an Attack record, this field stores whether the canonical record participates in the live character model. | `FIND` + `TOGGLE` + `RECORD` |
| `parentID` | `attacks->[selector]->parentID` | `STORED` | Existing canonical parent `recordKey`, or blank only where the sheet already permits no parent. **Do not invent IDs.** | On an Attack record, this field stores the relationship ID of the record's immediate parent. | `FIND` + `GRAPH` |
| `childIDs` | `attacks->[selector]->childIDs` | `STORED` | Array of existing canonical child `recordKey` values; `[]` = no children. Container value; do not replace wholesale through an ordinary typed write. | On an Attack record, this field stores the relationship IDs of this record's immediate child records. | `FIND` + `GRAPH` — Follow these linked record IDs to linked Damage or other child records; do not replace the whole array. |

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

| Field | ScriptCards location | Value kind | Values / writable domain | Description | Use |
|---|---|---|---|---|---|
| `_attuned` | `attunements->[selector]->_attuned` | `STORED` | `true` = attunement is active; `false` = item/effect is not attuned. | On an Attunement record, this field stores whether the item is currently attuned. | `FIND` + `TOGGLE` + `RECORD` — This is the actual attunement state; `_enabled` only controls whether the record participates. |
| `requireEquip` | `attunements->[selector]->requireEquip` | `STORED` | `true` = attunement-owned effect requires the parent Item to be equipped; `false` = attunement does not require the parent Item to be equipped. | On an Attunement record, this field stores `requireEquip`. | `FIND` + `RECORD` |
| `parentID` | `attunements->[selector]->parentID` | `STORED` | Existing canonical parent `recordKey`, or blank only where the sheet already permits no parent. **Do not invent IDs.** | On an Attunement record, this field stores the relationship ID of the record's immediate parent. | `FIND` + `GRAPH` |
| `childIDs` | `attunements->[selector]->childIDs` | `STORED` | Array of existing canonical child `recordKey` values; `[]` = no children. Container value; do not replace wholesale through an ordinary typed write. | On an Attunement record, this field stores the relationship IDs of this record's immediate child records. | `FIND` + `GRAPH` |
| `_enabled` | `attunements->[selector]->_enabled` | `STORED` | `true` = record participates in the live character model; `false` = record is disabled/excluded. This is a record-availability flag, not the same as a Condition `_active` toggle. | On an Attunement record, this field stores whether the canonical record participates in the live character model. | `FIND` + `TOGGLE` + `RECORD` |
| `name` | `attunements->[selector]->name` | `STORED` | Free-text display name. Blank may be technically storable, but names are used for display and sometimes typed selectors; keep it unique when selecting by name. | On an Attunement record, this field stores the record's primary display name. | `FIND` + `IDENTITY` |
| `shortID` | `attunements->[selector]->shortID` | `STORED` | Existing Beacon compact record ID string. Treat as identity; **do not invent or casually change it**. | On an Attunement record, this field stores the compact ID used by Beacon sheet action calls. | `FIND` + `IDENTITY` |

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

| Field | ScriptCards location | Value kind | Values / writable domain | Description | Use |
|---|---|---|---|---|---|
| `description` | `backgrounds->[selector]->description` | `STORED` | Free text/string. Blank is allowed where the sheet uses no text. Preserve any sheet-specific formatting already present. | On a Background record, this field stores the human-readable description. | `FIND` + `RECORD` |
| `childIDs` | `backgrounds->[selector]->childIDs` | `STORED` | Array of existing canonical child `recordKey` values; `[]` = no children. Container value; do not replace wholesale through an ordinary typed write. | On a Background record, this field stores the relationship IDs of this record's immediate child records. | `FIND` + `GRAPH` |
| `name` | `backgrounds->[selector]->name` | `STORED` | Free-text display name. Blank may be technically storable, but names are used for display and sometimes typed selectors; keep it unique when selecting by name. | On a Background record, this field stores the record's primary display name. | `FIND` + `IDENTITY` |
| `shortID` | `backgrounds->[selector]->shortID` | `STORED` | Existing Beacon compact record ID string. Treat as identity; **do not invent or casually change it**. | On a Background record, this field stores the compact ID used by Beacon sheet action calls. | `FIND` + `IDENTITY` |
| `_enabled` | `backgrounds->[selector]->_enabled` | `STORED` | `true` = record participates in the live character model; `false` = record is disabled/excluded. This is a record-availability flag, not the same as a Condition `_active` toggle. | On a Background record, this field stores whether the canonical record participates in the live character model. | `FIND` + `TOGGLE` + `RECORD` |

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

| Field | ScriptCards location | Value kind | Values / writable domain | Description | Use |
|---|---|---|---|---|---|
| `childIDs` | `classes->[selector]->childIDs` | `STORED` | Array of existing canonical child `recordKey` values; `[]` = no children. Container value; do not replace wholesale through an ordinary typed write. | On a Class record, this field stores the relationship IDs of this record's immediate child records. | `FIND` + `GRAPH` |
| `name` | `classes->[selector]->name` | `STORED` | Free-text display name. Blank may be technically storable, but names are used for display and sometimes typed selectors; keep it unique when selecting by name. | On a Class record, this field stores the record's primary display name. | `FIND` + `IDENTITY` |
| `shortID` | `classes->[selector]->shortID` | `STORED` | Existing Beacon compact record ID string. Treat as identity; **do not invent or casually change it**. | On a Class record, this field stores the compact ID used by Beacon sheet action calls. | `FIND` + `IDENTITY` |
| `_enabled` | `classes->[selector]->_enabled` | `STORED` | `true` = record participates in the live character model; `false` = record is disabled/excluded. This is a record-availability flag, not the same as a Condition `_active` toggle. | On a Class record, this field stores whether the canonical record participates in the live character model. | `FIND` + `TOGGLE` + `RECORD` |
| `sourceID` | `classes->[selector]->sourceID` | `STORED` | Existing owning/source identity string. The target type varies by record family; resolve it against the canonical graph before using or changing it. | On a Class record, this field stores the originating source record identifier. | `FIND` + `IDENTITY` |

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

| Field | ScriptCards location | Value kind | Values / writable domain | Description | Use |
|---|---|---|---|---|---|
| `classID` | `classlevels->[selector]->classID` | `STORED` | Existing owning Class record identity. Treat as graph identity; do not invent. | On a Class Level record, this field identifies the owning Class record. | `FIND` + `RECORD` |
| `level` | `classlevels->[selector]->level` | `INPUT` | Integer level value. For character/Class Level data, normal D&D character levels are expected, but the sheet's hard validation range was not independently probed. | On a Class Level record, this field stores the level contributed by that class progression record. | `FIND` + `INPUT` + `RECORD` |
| `totalLevel` | `classlevels->[selector]->totalLevel` | `INPUT` | Integer level value. For character/Class Level data, normal D&D character levels are expected, but the sheet's hard validation range was not independently probed. | On a Class Level record, this field stores the character's total level used by calculations such as proficiency bonus. | `FIND` + `INPUT` + `RECORD` |
| `subClassID` | `classlevels->[selector]->subClassID` | `STORED` | Existing linked Subclass record identity, or blank when no subclass is attached. Do not invent. | On a Class Level record, this field stores `subClassID`. | `FIND` + `RECORD` |
| `name` | `classlevels->[selector]->name` | `STORED` | Free-text display name. Blank may be technically storable, but names are used for display and sometimes typed selectors; keep it unique when selecting by name. | On a Class Level record, this field stores the record's primary display name. | `FIND` + `IDENTITY` |
| `shortID` | `classlevels->[selector]->shortID` | `STORED` | Existing Beacon compact record ID string. Treat as identity; **do not invent or casually change it**. | On a Class Level record, this field stores the compact ID used by Beacon sheet action calls. | `FIND` + `IDENTITY` |
| `_enabled` | `classlevels->[selector]->_enabled` | `STORED` | `true` = record participates in the live character model; `false` = record is disabled/excluded. This is a record-availability flag, not the same as a Condition `_active` toggle. | On a Class Level record, this field stores whether the canonical record participates in the live character model. | `FIND` + `TOGGLE` + `RECORD` |
| `parentID` | `classlevels->[selector]->parentID` | `STORED` | Existing canonical parent `recordKey`, or blank only where the sheet already permits no parent. **Do not invent IDs.** | On a Class Level record, this field stores the relationship ID of the record's immediate parent. | `FIND` + `GRAPH` |

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

| Field | ScriptCards location | Value kind | Values / writable domain | Description | Use |
|---|---|---|---|---|---|
| `_active` | `conditions->[selector]->_active` | `STORED` | `true` = condition/effect is active; `false` = condition/effect is inactive. **This is the actual Condition toggle.** | On a Condition record, this field stores whether this record or effect is currently active. | `FIND` + `TOGGLE` + `RECORD` — This is the actual condition state; `_enabled` only controls whether the record participates. |
| `description` | `conditions->[selector]->description` | `STORED` | Free text/string. Blank is allowed where the sheet uses no text. Preserve any sheet-specific formatting already present. | On a Condition record, this field stores the human-readable description. | `FIND` + `RECORD` |
| `childIDs` | `conditions->[selector]->childIDs` | `STORED` | Array of existing canonical child `recordKey` values; `[]` = no children. Container value; do not replace wholesale through an ordinary typed write. | On a Condition record, this field stores the relationship IDs of this record's immediate child records. | `FIND` + `GRAPH` |
| `name` | `conditions->[selector]->name` | `STORED` | Free-text display name. Blank may be technically storable, but names are used for display and sometimes typed selectors; keep it unique when selecting by name. | On a Condition record, this field stores the record's primary display name. | `FIND` + `IDENTITY` |
| `shortID` | `conditions->[selector]->shortID` | `STORED` | Existing Beacon compact record ID string. Treat as identity; **do not invent or casually change it**. | On a Condition record, this field stores the compact ID used by Beacon sheet action calls. | `FIND` + `IDENTITY` |
| `_enabled` | `conditions->[selector]->_enabled` | `STORED` | `true` = record participates in the live character model; `false` = record is disabled/excluded. This is a record-availability flag, not the same as a Condition `_active` toggle. | On a Condition record, this field stores whether the canonical record participates in the live character model. | `FIND` + `TOGGLE` + `RECORD` |

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

| Field | ScriptCards location | Value kind | Values / writable domain | Description | Use |
|---|---|---|---|---|---|
| `value` | `currencies->[selector]->value` | `STORED` | Finite currency amount. Normally a non-negative number; exact sheet validation/range was not independently probed. | On a Currency record, this field stores the record's finite current value. | `FIND` + `RECORD` — Prefer `cp`, `sp`, `ep`, `gp`, or `pp` for ordinary amount changes; use the record for conversion details. |
| `conversion.target` | `currencies->[selector]->conversion->target` | `STORED` | Currency target identifier/name used by the conversion rule. Use an existing valid currency target; exact representation beyond observed records is not fully documented. | On a Currency record, this field stores `target`. | `FIND` + `RECORD` |
| `conversion.amountOfTarget` | `currencies->[selector]->conversion->amountOfTarget` | `STORED` | Finite numeric conversion ratio/amount. Exact valid range was not independently probed. | On a Currency record, this field stores `amountOfTarget`. | `FIND` + `RECORD` |
| `name` | `currencies->[selector]->name` | `STORED` | Free-text display name. Blank may be technically storable, but names are used for display and sometimes typed selectors; keep it unique when selecting by name. | On a Currency record, this field stores the record's primary display name. | `FIND` + `IDENTITY` |
| `shortID` | `currencies->[selector]->shortID` | `STORED` | Existing Beacon compact record ID string. Treat as identity; **do not invent or casually change it**. | On a Currency record, this field stores the compact ID used by Beacon sheet action calls. | `FIND` + `IDENTITY` |
| `_enabled` | `currencies->[selector]->_enabled` | `STORED` | `true` = record participates in the live character model; `false` = record is disabled/excluded. This is a record-availability flag, not the same as a Condition `_active` toggle. | On a Currency record, this field stores whether the canonical record participates in the live character model. | `FIND` + `TOGGLE` + `RECORD` |

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

| Field | ScriptCards location | Value kind | Values / writable domain | Description | Use |
|---|---|---|---|---|---|
| `_diceCount` | `damages->[selector]->_diceCount` | `INPUT` | Numeric dice count. `0` or no dice is valid for flat-damage effects; positive integers represent the number of dice. | On a Damage record, this field stores `_diceCount`. | `FIND` + `INPUT` + `RECORD` |
| `diceSize` | `damages->[selector]->diceSize` | `INPUT` | Die-size string. Observed damage data uses die-size text and can use an empty string for flat damage. Exact accepted die notation set is not independently enumerated. | On a Damage record, this field stores the die size. | `FIND` + `INPUT` + `RECORD` |
| `_bonus` | `damages->[selector]->_bonus` | `INPUT` | Number **or expression string**. Examples include a fixed number or an attribute/function expression. Do not coerce expression values to a number. | On a Damage record, this field stores `_bonus`. | `FIND` + `INPUT` + `RECORD` |
| `ability` | `damages->[selector]->ability` | `INPUT` | Observed special values: `auto` = inherit the Attack ability; `none` = add no ability modifier. Explicit ability-name values may also be used (`Strength`, `Dexterity`, `Constitution`, `Intelligence`, `Wisdom`, `Charisma`); complete Damage enum not independently proven. | On a Damage record, this field identifies the ability used by this record or formula. | `FIND` + `INPUT` + `RECORD` |
| `damageType` | `damages->[selector]->damageType` | `STORED` | Damage-type string (for example `Piercing`, `Force`, `Cold` were observed). Complete damage-type enum was not independently enumerated. | On a Damage record, this field stores the damage type. | `FIND` + `RECORD` |
| `overrideCrit` | `damages->[selector]->overrideCrit` | `STORED` | `true` = use the record's critical-hit override; `false` = use normal critical-hit behavior. | On a Damage record, this field stores `overrideCrit`. | `FIND` + `RECORD` |
| `critDiceSize` | `damages->[selector]->critDiceSize` | `STORED` | Critical-hit die-size override. Use the same die-size representation as the Damage record; blank/absent means no separate override. | On a Damage record, this field stores `critDiceSize`. | `FIND` + `RECORD` |
| `parentID` | `damages->[selector]->parentID` | `STORED` | Existing canonical parent `recordKey`, or blank only where the sheet already permits no parent. **Do not invent IDs.** | On a Damage record, this field stores the relationship ID of the record's immediate parent. | `FIND` + `GRAPH` — Use this linked record ID to identify the owning Attack, Spell, or other parent record. |
| `name` | `damages->[selector]->name` | `STORED` | Free-text display name. Blank may be technically storable, but names are used for display and sometimes typed selectors; keep it unique when selecting by name. | On a Damage record, this field stores the record's primary display name. | `FIND` + `IDENTITY` |
| `shortID` | `damages->[selector]->shortID` | `STORED` | Existing Beacon compact record ID string. Treat as identity; **do not invent or casually change it**. | On a Damage record, this field stores the compact ID used by Beacon sheet action calls. | `FIND` + `IDENTITY` |
| `_enabled` | `damages->[selector]->_enabled` | `STORED` | `true` = record participates in the live character model; `false` = record is disabled/excluded. This is a record-availability flag, not the same as a Condition `_active` toggle. | On a Damage record, this field stores whether the canonical record participates in the live character model. | `FIND` + `TOGGLE` + `RECORD` |

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

| Field | ScriptCards location | Value kind | Values / writable domain | Description | Use |
|---|---|---|---|---|---|
| `defense` | `defenses->[selector]->defense` | `STORED` | Observed/recognized values: `Resistance`, `Immunity`. Complete sheet enum not independently proven. The sheet map explicitly indicates additional defense categories may exist. | On a Defense record, this field stores `defense`. | `FIND` + `RECORD` |
| `damage` | `defenses->[selector]->damage` | `STORED` | Defense target text/category. For `damage`, this identifies the affected damage type(s); for `condition`, the affected condition. Complete literal domain is not independently enumerated. | On a Defense record, this field stores the defense record's damage category or damage-type data. | `FIND` + `RECORD` |
| `condition` | `defenses->[selector]->condition` | `STORED` | Defense target text/category. For `damage`, this identifies the affected damage type(s); for `condition`, the affected condition. Complete literal domain is not independently enumerated. | On a Defense record, this field stores `condition`. | `FIND` + `RECORD` |
| `name` | `defenses->[selector]->name` | `STORED` | Free-text display name. Blank may be technically storable, but names are used for display and sometimes typed selectors; keep it unique when selecting by name. | On a Defense record, this field stores the record's primary display name. | `FIND` + `IDENTITY` |
| `shortID` | `defenses->[selector]->shortID` | `STORED` | Existing Beacon compact record ID string. Treat as identity; **do not invent or casually change it**. | On a Defense record, this field stores the compact ID used by Beacon sheet action calls. | `FIND` + `IDENTITY` |
| `_enabled` | `defenses->[selector]->_enabled` | `STORED` | `true` = record participates in the live character model; `false` = record is disabled/excluded. This is a record-availability flag, not the same as a Condition `_active` toggle. | On a Defense record, this field stores whether the canonical record participates in the live character model. | `FIND` + `TOGGLE` + `RECORD` |
| `parentID` | `defenses->[selector]->parentID` | `STORED` | Existing canonical parent `recordKey`, or blank only where the sheet already permits no parent. **Do not invent IDs.** | On a Defense record, this field stores the relationship ID of the record's immediate parent. | `FIND` + `GRAPH` |

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

| Field | ScriptCards location | Value kind | Values / writable domain | Description | Use |
|---|---|---|---|---|---|
| `value` | `exhaustions->[selector]->value` | `STORED` | Numeric Exhaustion value. Exact allowed range was not independently probed in the controlled sample. | On an Exhaustion record, this field stores the record's finite current value. | `FIND` + `RECORD` |
| `name` | `exhaustions->[selector]->name` | `STORED` | Free-text display name. Blank may be technically storable, but names are used for display and sometimes typed selectors; keep it unique when selecting by name. | On an Exhaustion record, this field stores the record's primary display name. | `FIND` + `IDENTITY` |
| `shortID` | `exhaustions->[selector]->shortID` | `STORED` | Existing Beacon compact record ID string. Treat as identity; **do not invent or casually change it**. | On an Exhaustion record, this field stores the compact ID used by Beacon sheet action calls. | `FIND` + `IDENTITY` |
| `_enabled` | `exhaustions->[selector]->_enabled` | `STORED` | `true` = record participates in the live character model; `false` = record is disabled/excluded. This is a record-availability flag, not the same as a Condition `_active` toggle. | On an Exhaustion record, this field stores whether the canonical record participates in the live character model. | `FIND` + `TOGGLE` + `RECORD` |

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

| Field | ScriptCards location | Value kind | Values / writable domain | Description | Use |
|---|---|---|---|---|---|
| `description` | `features->[selector]->description` | `STORED` | Free text/string. Blank is allowed where the sheet uses no text. Preserve any sheet-specific formatting already present. | On a Features record, this field stores the human-readable description. | `FIND` + `RECORD` |
| `childIDs` | `features->[selector]->childIDs` | `STORED` | Array of existing canonical child `recordKey` values; `[]` = no children. Container value; do not replace wholesale through an ordinary typed write. | On a Features record, this field stores the relationship IDs of this record's immediate child records. | `FIND` + `GRAPH` |
| `relations` | `features->[selector]->relations` | `STORED` | Object/container. **Do not replace the whole object through a normal typed leaf write.** Read its child structure first and edit only a verified primitive child. | On a Features record, this field stores relationships that connect this record to other records. | `FIND` + `GRAPH` |
| `name` | `features->[selector]->name` | `STORED` | Free-text display name. Blank may be technically storable, but names are used for display and sometimes typed selectors; keep it unique when selecting by name. | On a Features record, this field stores the record's primary display name. | `FIND` + `IDENTITY` |
| `shortID` | `features->[selector]->shortID` | `STORED` | Existing Beacon compact record ID string. Treat as identity; **do not invent or casually change it**. | On a Features record, this field stores the compact ID used by Beacon sheet action calls. | `FIND` + `IDENTITY` |
| `_enabled` | `features->[selector]->_enabled` | `STORED` | `true` = record participates in the live character model; `false` = record is disabled/excluded. This is a record-availability flag, not the same as a Condition `_active` toggle. | On a Features record, this field stores whether the canonical record participates in the live character model. | `FIND` + `TOGGLE` + `RECORD` |
| `arrayPosition` | `features->[selector]->arrayPosition` | `ORDER` | Numeric ordering position. Exact range is not verified. Explicit display-order arrays can override this fallback ordering. | On a Features record, this field stores the record's relative display position among records of the same family. | `FIND` + `ORDER` |
| `parentID` | `features->[selector]->parentID` | `STORED` | Existing canonical parent `recordKey`, or blank only where the sheet already permits no parent. **Do not invent IDs.** | On a Features record, this field stores the relationship ID of the record's immediate parent. | `FIND` + `GRAPH` |

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

| Field | ScriptCards location | Value kind | Values / writable domain | Description | Use |
|---|---|---|---|---|---|
| `classID` | `hitdices->[selector]->classID` | `STORED` | Existing owning Class record identity. Treat as graph identity; do not invent. | On a Hit Dice record, this field identifies the owning Class record. | `FIND` + `RECORD` — Stores the owning Class record identity, not the Class `shortID` or display name. |
| `dieCount` | `hitdices->[selector]->dieCount` | `STORED` | Numeric hit-die count. Normally a non-negative integer; exact range follows class level/resources. | On a Hit Dice record, this field stores `dieCount`. | `FIND` + `RECORD` |
| `dieSize` | `hitdices->[selector]->dieSize` | `STORED` | Numeric die size (for example the number of sides). Exact accepted sizes were not independently enumerated. | On a Hit Dice record, this field stores `dieSize`. | `FIND` + `RECORD` |
| `ability` | `hitdices->[selector]->ability` | `INPUT` | Ability name. Verified/recognized values: `Strength`, `Dexterity`, `Constitution`, `Intelligence`, `Wisdom`, `Charisma`. | On a Hit Dice record, this field identifies the ability used by this record or formula. | `FIND` + `INPUT` + `RECORD` |
| `recovery` | `hitdices->[selector]->recovery` | `STORED` | Free text/string. Blank is allowed where the sheet uses no text. Preserve any sheet-specific formatting already present. | On a Hit Dice record, this field stores how the value recovers. | `FIND` + `RECORD` |
| `name` | `hitdices->[selector]->name` | `STORED` | Free-text display name. Blank may be technically storable, but names are used for display and sometimes typed selectors; keep it unique when selecting by name. | On a Hit Dice record, this field stores the record's primary display name. | `FIND` + `IDENTITY` |
| `shortID` | `hitdices->[selector]->shortID` | `STORED` | Existing Beacon compact record ID string. Treat as identity; **do not invent or casually change it**. | On a Hit Dice record, this field stores the compact ID used by Beacon sheet action calls. | `FIND` + `IDENTITY` |
| `_enabled` | `hitdices->[selector]->_enabled` | `STORED` | `true` = record participates in the live character model; `false` = record is disabled/excluded. This is a record-availability flag, not the same as a Condition `_active` toggle. | On a Hit Dice record, this field stores whether the canonical record participates in the live character model. | `FIND` + `TOGGLE` + `RECORD` |
| `parentID` | `hitdices->[selector]->parentID` | `STORED` | Existing canonical parent `recordKey`, or blank only where the sheet already permits no parent. **Do not invent IDs.** | On a Hit Dice record, this field stores the relationship ID of the record's immediate parent. | `FIND` + `GRAPH` |

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

| Field | ScriptCards location | Value kind | Values / writable domain | Description | Use |
|---|---|---|---|---|---|
| `hitpointType` | `hitpoints->[selector]->hitpointType` | `STORED` | Hit-point formula/type string. Complete accepted literal set was not independently enumerated. | On a Hit Points record, this field stores `hitpointType`. | `FIND` + `RECORD` |
| `calculation` | `hitpoints->[selector]->calculation` | `INPUT` | Observed/recognized values: `Set Base`, `Set Value`, `Modify`, `Minimum`. Complete sheet enum not independently proven. | On a Hit Points record, this field identifies the calculation method used by this record. | `FIND` + `INPUT` + `RECORD` |
| `isFixed` | `hitpoints->[selector]->isFixed` | `STORED` | `true` = formula uses a fixed value; `false` = formula is not fixed. | On a Hit Points record, this field stores whether the formula uses a fixed value. | `FIND` + `RECORD` |
| `isTemp` | `hitpoints->[selector]->isTemp` | `STORED` | `true` = record represents temporary HP; `false` = record represents ordinary/max HP. | On a Hit Points record, this field stores whether a Hit Points record represents temporary hit points. | `FIND` + `RECORD` — Classifies this formula record as temporary-HP capacity; it is not the character’s current `hp_temp` value. |
| `valueFormula.flatValue` | `hitpoints->[selector]->valueFormula->flatValue` | `INPUT` | Finite numeric formula input. Meaning depends on the record: score/AC/HP/range/slot/mastery capacity. Range is not globally fixed. | On a Hit Points record, this field stores a finite value used as an input by a formula. | `FIND` + `INPUT` + `RECORD` |
| `valueFormula.ability.name` | `hitpoints->[selector]->valueFormula->ability->name` | `STORED` | Ability name used by the formula. Verified/recognized values: `Strength`, `Dexterity`, `Constitution`, `Intelligence`, `Wisdom`, `Charisma`. | On a Hit Points record, this field stores the record's primary display name. | `FIND` + `IDENTITY` |
| `valueFormula.ability.add` | `hitpoints->[selector]->valueFormula->ability->add` | `STORED` | `true` = add the named ability contribution; `false` = do not add that ability contribution. | On a Hit Points record, this field stores `add`. | `FIND` + `RECORD` |
| `name` | `hitpoints->[selector]->name` | `STORED` | Free-text display name. Blank may be technically storable, but names are used for display and sometimes typed selectors; keep it unique when selecting by name. | On a Hit Points record, this field stores the record's primary display name. | `FIND` + `IDENTITY` |
| `shortID` | `hitpoints->[selector]->shortID` | `STORED` | Existing Beacon compact record ID string. Treat as identity; **do not invent or casually change it**. | On a Hit Points record, this field stores the compact ID used by Beacon sheet action calls. | `FIND` + `IDENTITY` |
| `_enabled` | `hitpoints->[selector]->_enabled` | `STORED` | `true` = record participates in the live character model; `false` = record is disabled/excluded. This is a record-availability flag, not the same as a Condition `_active` toggle. | On a Hit Points record, this field stores whether the canonical record participates in the live character model. | `FIND` + `TOGGLE` + `RECORD` |
| `parentID` | `hitpoints->[selector]->parentID` | `STORED` | Existing canonical parent `recordKey`, or blank only where the sheet already permits no parent. **Do not invent IDs.** | On a Hit Points record, this field stores the relationship ID of the record's immediate parent. | `FIND` + `GRAPH` |

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

| Field | ScriptCards location | Value kind | Values / writable domain | Description | Use |
|---|---|---|---|---|---|
| `description` | `items->[selector]->description` | `STORED` | Free text/string. Blank is allowed where the sheet uses no text. Preserve any sheet-specific formatting already present. | On an Item record, this field stores the human-readable description. | `FIND` + `RECORD` |
| `quantity` | `items->[selector]->quantity` | `STORED` | Finite item quantity. Normally a non-negative number; exact fractional/negative validation was not independently probed. | On an Item record, this field stores the item quantity. | `FIND` + `RECORD` |
| `weight` | `items->[selector]->weight` | `STORED` | Finite item weight number. Exact units/range follow the sheet's weight conventions and were not independently probed. | On an Item record, this field stores the item weight. | `FIND` + `RECORD` |
| `cost` | `items->[selector]->cost` | `STORED` | Free text/string. Blank is allowed where the sheet uses no text. Preserve any sheet-specific formatting already present. | On an Item record, this field stores `cost`. | `FIND` + `RECORD` |
| `rarity` | `items->[selector]->rarity` | `STORED` | Item-rarity string. The complete accepted rarity enum was not independently enumerated in the controlled data. | On an Item record, this field stores `rarity`. | `FIND` + `RECORD` |
| `properties` | `items->[selector]->properties` | `STORED` | Array of Item property strings. `[]` = no listed properties. Container; do not replace wholesale through a normal typed leaf write. | On an Item record, this field stores `properties`. | `FIND` + `RECORD` |
| `equipData.equippable` | `items->[selector]->equipData->equippable` | `STORED` | `true` = item can be equipped; `false` = item is not equippable. | On an Item record, this field stores whether the item can be equipped. | `FIND` + `RECORD` |
| `equipData.equipped` | `items->[selector]->equipData->equipped` | `STORED` | `true` = item is currently equipped; `false` = item is not equipped. | On an Item record, this field stores whether the item is currently equipped. | `FIND` + `TOGGLE` + `RECORD` — Changes equipped state and can affect derived AC or attacks; `equippable` only says whether equipping is allowed. |
| `weaponData.category` | `items->[selector]->weaponData->category` | `STORED` | Weapon category string. The controlled sources confirm weapon-category storage but do not enumerate the complete literal set. | On an Item record, this field stores the weapon category used by the item. | `FIND` + `RECORD` |
| `weaponData.training` | `items->[selector]->weaponData->training` | `STORED` | Weapon training/proficiency string used to inherit attack proficiency. Complete literal enum was not independently enumerated. | On an Item record, this field stores `training`. | `FIND` + `RECORD` |
| `weaponData.type` | `items->[selector]->weaponData->type` | `STORED` | Weapon type string. Complete literal enum was not independently enumerated. | On an Item record, this field identifies the canonical record type. | `FIND` + `IDENTITY` |
| `armorData.category` | `items->[selector]->armorData->category` | `STORED` | Verified/recognized values: `Light`, `Medium`, `Heavy`. | On an Item record, this field stores the armour category used by the item. | `FIND` + `RECORD` |
| `armorData.ability` | `items->[selector]->armorData->ability` | `INPUT` | Ability name used by the armor formula. Observed value: `Dexterity`; other ability names were not observed. | On an Item record, this field identifies the ability used by this record or formula. | `FIND` + `INPUT` + `RECORD` |
| `armorData.bonusCap` | `items->[selector]->armorData->bonusCap` | `STORED` | Finite numeric cap on the armor's ability contribution. Observed Medium armor example: `2`. | On an Item record, this field stores the maximum ability contribution allowed by the armor formula. | `FIND` + `RECORD` |
| `armorData.strengthMinimum` | `items->[selector]->armorData->strengthMinimum` | `STORED` | Finite numeric Strength requirement. Observed Heavy armor example: `13`. | On an Item record, this field stores the armor's Strength requirement. | `FIND` + `RECORD` |
| `shieldData.category` | `items->[selector]->shieldData->category` | `STORED` | Observed value: `Shield`. Complete enum not independently probed. | On an Item record, this field stores the shield category used by the item. | `FIND` + `RECORD` |
| `shieldData.wieldable` | `items->[selector]->shieldData->wieldable` | `STORED` | `true` = shield can be wielded; `false` = shield is not wieldable. | On an Item record, this field stores `wieldable`. | `FIND` + `RECORD` |
| `name` | `items->[selector]->name` | `STORED` | Free-text display name. Blank may be technically storable, but names are used for display and sometimes typed selectors; keep it unique when selecting by name. | On an Item record, this field stores the record's primary display name. | `FIND` + `IDENTITY` |
| `shortID` | `items->[selector]->shortID` | `STORED` | Existing Beacon compact record ID string. Treat as identity; **do not invent or casually change it**. | On an Item record, this field stores the compact ID used by Beacon sheet action calls. | `FIND` + `IDENTITY` |
| `_enabled` | `items->[selector]->_enabled` | `STORED` | `true` = record participates in the live character model; `false` = record is disabled/excluded. This is a record-availability flag, not the same as a Condition `_active` toggle. | On an Item record, this field stores whether the canonical record participates in the live character model. | `FIND` + `TOGGLE` + `RECORD` |
| `arrayPosition` | `items->[selector]->arrayPosition` | `ORDER` | Numeric ordering position. Exact range is not verified. Explicit display-order arrays can override this fallback ordering. | On an Item record, this field stores the record's relative display position among records of the same family. | `FIND` + `ORDER` |
| `parentID` | `items->[selector]->parentID` | `STORED` | Existing canonical parent `recordKey`, or blank only where the sheet already permits no parent. **Do not invent IDs.** | On an Item record, this field stores the relationship ID of the record's immediate parent. | `FIND` + `GRAPH` |
| `childIDs` | `items->[selector]->childIDs` | `STORED` | Array of existing canonical child `recordKey` values; `[]` = no children. Container value; do not replace wholesale through an ordinary typed write. | On an Item record, this field stores the relationship IDs of this record's immediate child records. | `FIND` + `GRAPH` — Follow these linked record IDs to linked Attack, Attunement, or other child records; do not replace the whole array. |

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

| Field | ScriptCards location | Value kind | Values / writable domain | Description | Use |
|---|---|---|---|---|---|
| `name` | `languages->[selector]->name` | `STORED` | Free-text display name. Blank may be technically storable, but names are used for display and sometimes typed selectors; keep it unique when selecting by name. | On a Language record, this field stores the record's primary display name. | `FIND` + `IDENTITY` |
| `_enabled` | `languages->[selector]->_enabled` | `STORED` | `true` = record participates in the live character model; `false` = record is disabled/excluded. This is a record-availability flag, not the same as a Condition `_active` toggle. | On a Language record, this field stores whether the canonical record participates in the live character model. | `FIND` + `TOGGLE` + `RECORD` |
| `shortID` | `languages->[selector]->shortID` | `STORED` | Existing Beacon compact record ID string. Treat as identity; **do not invent or casually change it**. | On a Language record, this field stores the compact ID used by Beacon sheet action calls. | `FIND` + `IDENTITY` |
| `arrayPosition` | `languages->[selector]->arrayPosition` | `ORDER` | Numeric ordering position. Exact range is not verified. Explicit display-order arrays can override this fallback ordering. | On a Language record, this field stores the record's relative display position among records of the same family. | `FIND` + `ORDER` |
| `parentID` | `languages->[selector]->parentID` | `STORED` | Existing canonical parent `recordKey`, or blank only where the sheet already permits no parent. **Do not invent IDs.** | On a Language record, this field stores the relationship ID of the record's immediate parent. | `FIND` + `GRAPH` |

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

| Field | ScriptCards location | Value kind | Values / writable domain | Description | Use |
|---|---|---|---|---|---|
| `concat` | `modifiers->[selector]->concat` | `STORED` | Object/container. **Do not replace the whole object through a normal typed leaf write.** Read its child structure first and edit only a verified primitive child. | On a `modifier` record, this field stores how modifier text or values are concatenated. | `FIND` + `RECORD` |
| `modifications` | `modifiers->[selector]->modifications` | `STORED` | Object/container. **Do not replace the whole object through a normal typed leaf write.** Read its child structure first and edit only a verified primitive child. | On a `modifier` record, this field stores the modifications applied by the record. | `FIND` + `RECORD` — Structured modifier data; inspect it and address an existing primitive child rather than replacing the container blindly. |
| `relations` | `modifiers->[selector]->relations` | `STORED` | Object/container. **Do not replace the whole object through a normal typed leaf write.** Read its child structure first and edit only a verified primitive child. | On a `modifier` record, this field stores relationships that connect this record to other records. | `FIND` + `GRAPH` — Structured relationship data; preserve valid linked record IDs and edit only an understood primitive child. |
| `name` | `modifiers->[selector]->name` | `STORED` | Free-text display name. Blank may be technically storable, but names are used for display and sometimes typed selectors; keep it unique when selecting by name. | On a `modifier` record, this field stores the record's primary display name. | `FIND` + `IDENTITY` |
| `shortID` | `modifiers->[selector]->shortID` | `STORED` | Existing Beacon compact record ID string. Treat as identity; **do not invent or casually change it**. | On a `modifier` record, this field stores the compact ID used by Beacon sheet action calls. | `FIND` + `IDENTITY` |
| `_enabled` | `modifiers->[selector]->_enabled` | `STORED` | `true` = record participates in the live character model; `false` = record is disabled/excluded. This is a record-availability flag, not the same as a Condition `_active` toggle. | On a `modifier` record, this field stores whether the canonical record participates in the live character model. | `FIND` + `TOGGLE` + `RECORD` |
| `parentID` | `modifiers->[selector]->parentID` | `STORED` | Existing canonical parent `recordKey`, or blank only where the sheet already permits no parent. **Do not invent IDs.** | On a `modifier` record, this field stores the relationship ID of the record's immediate parent. | `FIND` + `GRAPH` |

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

| Field | ScriptCards location | Value kind | Values / writable domain | Description | Use |
|---|---|---|---|---|---|
| `calculation` | `preparedspellslots->[selector]->calculation` | `INPUT` | Observed/recognized values: `Set Base`, `Set Value`, `Modify`, `Minimum`. Complete sheet enum not independently proven. | On a Prepared Spell Slot record, this field identifies the calculation method used by this record. | `FIND` + `INPUT` + `RECORD` |
| `valueFormula.flatValue` | `preparedspellslots->[selector]->valueFormula->flatValue` | `INPUT` | Finite numeric formula input. Meaning depends on the record: score/AC/HP/range/slot/mastery capacity. Range is not globally fixed. | On a Prepared Spell Slot record, this field stores a finite value used as an input by a formula. | `FIND` + `INPUT` + `RECORD` |
| `name` | `preparedspellslots->[selector]->name` | `STORED` | Free-text display name. Blank may be technically storable, but names are used for display and sometimes typed selectors; keep it unique when selecting by name. | On a Prepared Spell Slot record, this field stores the record's primary display name. | `FIND` + `IDENTITY` |
| `shortID` | `preparedspellslots->[selector]->shortID` | `STORED` | Existing Beacon compact record ID string. Treat as identity; **do not invent or casually change it**. | On a Prepared Spell Slot record, this field stores the compact ID used by Beacon sheet action calls. | `FIND` + `IDENTITY` |
| `_enabled` | `preparedspellslots->[selector]->_enabled` | `STORED` | `true` = record participates in the live character model; `false` = record is disabled/excluded. This is a record-availability flag, not the same as a Condition `_active` toggle. | On a Prepared Spell Slot record, this field stores whether the canonical record participates in the live character model. | `FIND` + `TOGGLE` + `RECORD` |
| `parentID` | `preparedspellslots->[selector]->parentID` | `STORED` | Existing canonical parent `recordKey`, or blank only where the sheet already permits no parent. **Do not invent IDs.** | On a Prepared Spell Slot record, this field stores the relationship ID of the record's immediate parent. | `FIND` + `GRAPH` |

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

| Field | ScriptCards location | Value kind | Values / writable domain | Description | Use |
|---|---|---|---|---|---|
| `category` | `proficiencies->[selector]->category` | `STORED` | Observed/recognized values: `Skill`, `Saving Throw`, `Tool`. Complete sheet enum not independently proven. Weapon/armor proficiency records also exist, but their exact category literals were not exhaustively enumerated. | On a Proficiency record, this field identifies the record's category, such as Skill or Saving Throw. | `FIND` + `RECORD` |
| `proficiency` | `proficiencies->[selector]->proficiency` | `STORED` | Name of the proficiency granted/modified. For skill/save records this is the skill or ability name; tool/weapon names are open-ended sheet content. | On a Proficiency record, this field identifies the skill, save, tool, weapon, or armor proficiency. | `FIND` + `RECORD` |
| `proficiencyLevel` | `proficiencies->[selector]->proficiencyLevel` | `INPUT` | Observed/recognized values: `Proficient`, `Expertise`. Complete sheet enum not independently proven. Other proficiency tiers were not independently enumerated in the controlled data. | On a Proficiency record, this field stores the proficiency tier, such as Proficient or Expertise. | `FIND` + `INPUT` + `RECORD` — Change this tier to alter Proficient or Expertise state, then read the recalculated public skill or save total. |
| `rollAbility` | `proficiencies->[selector]->rollAbility` | `STORED` | Ability name used for the proficiency roll. Verified/recognized values: `Strength`, `Dexterity`, `Constitution`, `Intelligence`, `Wisdom`, `Charisma`. | On a Proficiency record, this field stores the ability used when rolling the proficiency. | `FIND` + `RECORD` |
| `increaseIfAlreadyAt` | `proficiencies->[selector]->increaseIfAlreadyAt` | `STORED` | `true` = increase the tier if already at the specified proficiency; `false` = do not increase beyond the specified tier. | On a Proficiency record, this field stores `increaseIfAlreadyAt`. | `FIND` + `RECORD` |
| `name` | `proficiencies->[selector]->name` | `STORED` | Free-text display name. Blank may be technically storable, but names are used for display and sometimes typed selectors; keep it unique when selecting by name. | On a Proficiency record, this field stores the record's primary display name. | `FIND` + `IDENTITY` |
| `shortID` | `proficiencies->[selector]->shortID` | `STORED` | Existing Beacon compact record ID string. Treat as identity; **do not invent or casually change it**. | On a Proficiency record, this field stores the compact ID used by Beacon sheet action calls. | `FIND` + `IDENTITY` |
| `_enabled` | `proficiencies->[selector]->_enabled` | `STORED` | `true` = record participates in the live character model; `false` = record is disabled/excluded. This is a record-availability flag, not the same as a Condition `_active` toggle. | On a Proficiency record, this field stores whether the canonical record participates in the live character model. | `FIND` + `TOGGLE` + `RECORD` |
| `parentID` | `proficiencies->[selector]->parentID` | `STORED` | Existing canonical parent `recordKey`, or blank only where the sheet already permits no parent. **Do not invent IDs.** | On a Proficiency record, this field stores the relationship ID of the record's immediate parent. | `FIND` + `GRAPH` |

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

| Field | ScriptCards location | Value kind | Values / writable domain | Description | Use |
|---|---|---|---|---|---|
| `value` | `resources->[selector]->value` | `STORED` | Finite current resource value. May be `0`; upper/lower bounds depend on the associated maximum and feature rules. | On a Resource record, this field stores the record's finite current value. | `FIND` + `RECORD` — This is the current amount; use `maxValueFormula` only when changing capacity. |
| `maxValueFormula` | `resources->[selector]->maxValueFormula` | `INPUT` | Object/container. **Do not replace the whole object through a normal typed leaf write.** Read its child structure first and edit only a verified primitive child. | On a Resource record, this field stores the formula used to calculate a Resource maximum. | `FIND` + `INPUT` + `RECORD` — Structured maximum formula; edit an existing primitive component rather than replacing the whole object blindly. |
| `recoveryRate` | `resources->[selector]->recoveryRate` | `STORED` | Object/container. **Do not replace the whole object through a normal typed leaf write.** Read its child structure first and edit only a verified primitive child. | On a Resource record, this field stores how much of the Resource recovers. | `FIND` + `RECORD` |
| `relations` | `resources->[selector]->relations` | `STORED` | Object/container. **Do not replace the whole object through a normal typed leaf write.** Read its child structure first and edit only a verified primitive child. | On a Resource record, this field stores relationships that connect this record to other records. | `FIND` + `GRAPH` |
| `name` | `resources->[selector]->name` | `STORED` | Free-text display name. Blank may be technically storable, but names are used for display and sometimes typed selectors; keep it unique when selecting by name. | On a Resource record, this field stores the record's primary display name. | `FIND` + `IDENTITY` |
| `shortID` | `resources->[selector]->shortID` | `STORED` | Existing Beacon compact record ID string. Treat as identity; **do not invent or casually change it**. | On a Resource record, this field stores the compact ID used by Beacon sheet action calls. | `FIND` + `IDENTITY` |
| `_enabled` | `resources->[selector]->_enabled` | `STORED` | `true` = record participates in the live character model; `false` = record is disabled/excluded. This is a record-availability flag, not the same as a Condition `_active` toggle. | On a Resource record, this field stores whether the canonical record participates in the live character model. | `FIND` + `TOGGLE` + `RECORD` |
| `parentID` | `resources->[selector]->parentID` | `STORED` | Existing canonical parent `recordKey`, or blank only where the sheet already permits no parent. **Do not invent IDs.** | On a Resource record, this field stores the relationship ID of the record's immediate parent. | `FIND` + `GRAPH` |

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

| Field | ScriptCards location | Value kind | Values / writable domain | Description | Use |
|---|---|---|---|---|---|
| `description` | `restdisplays->[selector]->description` | `STORED` | Free text/string. Blank is allowed where the sheet uses no text. Preserve any sheet-specific formatting already present. | On a Rest Display record, this field stores the human-readable description. | `FIND` + `RECORD` |
| `restType` | `restdisplays->[selector]->restType` | `STORED` | Array of rest-type strings. The controlled sources confirm the container but do not enumerate the complete accepted rest-type literals. | On a Rest Display record, this field stores `restType`. | `FIND` + `RECORD` |
| `name` | `restdisplays->[selector]->name` | `STORED` | Free-text display name. Blank may be technically storable, but names are used for display and sometimes typed selectors; keep it unique when selecting by name. | On a Rest Display record, this field stores the record's primary display name. | `FIND` + `IDENTITY` |
| `shortID` | `restdisplays->[selector]->shortID` | `STORED` | Existing Beacon compact record ID string. Treat as identity; **do not invent or casually change it**. | On a Rest Display record, this field stores the compact ID used by Beacon sheet action calls. | `FIND` + `IDENTITY` |
| `_enabled` | `restdisplays->[selector]->_enabled` | `STORED` | `true` = record participates in the live character model; `false` = record is disabled/excluded. This is a record-availability flag, not the same as a Condition `_active` toggle. | On a Rest Display record, this field stores whether the canonical record participates in the live character model. | `FIND` + `TOGGLE` + `RECORD` |

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

| Field | ScriptCards location | Value kind | Values / writable domain | Description | Use |
|---|---|---|---|---|---|
| `bonusCategory` | `rollbonuses->[selector]->bonusCategory` | `STORED` | Array of roll-target category strings. Observed logic recognizes labels containing `Spell Attack`, `Spell Save`, or `Spellcasting`; complete target-category set is not enumerated. | On a Roll Bonus record, this field stores `bonusCategory`. | `FIND` + `RECORD` |
| `bonusDetails` | `rollbonuses->[selector]->bonusDetails` | `STORED` | Observed/recognized values: `Modifier`, `Keep Highest`, `Keep Lowest`. Complete sheet enum not independently proven. Current ScriptCards treats `Modifier` as a flat numeric bonus and `Keep Highest`/`Keep Lowest` as roll-mode effects. | On a Roll Bonus record, this field stores `bonusDetails`. | `FIND` + `RECORD` |
| `bonusName` | `rollbonuses->[selector]->bonusName` | `STORED` | Array of target/name strings for the Roll Bonus. Complete accepted target-name set is not enumerated. | On a Roll Bonus record, this field stores `bonusName`. | `FIND` + `RECORD` |
| `bonusValue` | `rollbonuses->[selector]->bonusValue` | `STORED` | Finite numeric bonus value. Used by `Modifier`-style Roll Bonus records; may be ignored by keep-highest/lowest records. | On a Roll Bonus record, this field stores `bonusValue`. | `FIND` + `RECORD` |
| `diceCount` | `rollbonuses->[selector]->diceCount` | `INPUT` | Numeric number of bonus dice. Normally a non-negative integer; exact validation was not independently probed. | On a Roll Bonus record, this field stores the number of dice. | `FIND` + `INPUT` + `RECORD` |
| `totalRoll` | `rollbonuses->[selector]->totalRoll` | `STORED` | `true` = bonus applies to the total-roll result; `false` = bonus is not a total-roll modifier. Current ScriptCards local spell-header reconstruction accepts flat `Modifier` bonuses only when this is `false`. | On a Roll Bonus record, this field stores the record's `totalRoll` flag. | `FIND` + `RECORD` |
| `name` | `rollbonuses->[selector]->name` | `STORED` | Free-text display name. Blank may be technically storable, but names are used for display and sometimes typed selectors; keep it unique when selecting by name. | On a Roll Bonus record, this field stores the record's primary display name. | `FIND` + `IDENTITY` |
| `shortID` | `rollbonuses->[selector]->shortID` | `STORED` | Existing Beacon compact record ID string. Treat as identity; **do not invent or casually change it**. | On a Roll Bonus record, this field stores the compact ID used by Beacon sheet action calls. | `FIND` + `IDENTITY` |
| `_enabled` | `rollbonuses->[selector]->_enabled` | `STORED` | `true` = record participates in the live character model; `false` = record is disabled/excluded. This is a record-availability flag, not the same as a Condition `_active` toggle. | On a Roll Bonus record, this field stores whether the canonical record participates in the live character model. | `FIND` + `TOGGLE` + `RECORD` |
| `parentID` | `rollbonuses->[selector]->parentID` | `STORED` | Existing canonical parent `recordKey`, or blank only where the sheet already permits no parent. **Do not invent IDs.** | On a Roll Bonus record, this field stores the relationship ID of the record's immediate parent. | `FIND` + `GRAPH` |

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

| Field | ScriptCards location | Value kind | Values / writable domain | Description | Use |
|---|---|---|---|---|---|
| `calculation` | `senses->[selector]->calculation` | `INPUT` | Observed/recognized values: `Set Base`, `Set Value`, `Modify`, `Minimum`. Complete sheet enum not independently proven. | On a Sense record, this field identifies the calculation method used by this record. | `FIND` + `INPUT` + `RECORD` |
| `ignoreValue` | `senses->[selector]->ignoreValue` | `STORED` | `true` = ignore/hide the numeric Sense range; `false` = use the Sense's numeric range. | On a Sense record, this field stores whether a Sense ignores its numeric range. | `FIND` + `RECORD` — When true, the Sense should not be treated as having a meaningful numeric range. |
| `valueFormula.flatValue` | `senses->[selector]->valueFormula->flatValue` | `INPUT` | Finite numeric formula input. Meaning depends on the record: score/AC/HP/range/slot/mastery capacity. Range is not globally fixed. | On a Sense record, this field stores a finite value used as an input by a formula. | `FIND` + `INPUT` + `RECORD` — Stores the numeric Sense range when `ignoreValue` does not suppress it. |
| `name` | `senses->[selector]->name` | `STORED` | Free-text display name. Blank may be technically storable, but names are used for display and sometimes typed selectors; keep it unique when selecting by name. | On a Sense record, this field stores the record's primary display name. | `FIND` + `IDENTITY` |
| `shortID` | `senses->[selector]->shortID` | `STORED` | Existing Beacon compact record ID string. Treat as identity; **do not invent or casually change it**. | On a Sense record, this field stores the compact ID used by Beacon sheet action calls. | `FIND` + `IDENTITY` |
| `_enabled` | `senses->[selector]->_enabled` | `STORED` | `true` = record participates in the live character model; `false` = record is disabled/excluded. This is a record-availability flag, not the same as a Condition `_active` toggle. | On a Sense record, this field stores whether the canonical record participates in the live character model. | `FIND` + `TOGGLE` + `RECORD` |
| `arrayPosition` | `senses->[selector]->arrayPosition` | `ORDER` | Numeric ordering position. Exact range is not verified. Explicit display-order arrays can override this fallback ordering. | On a Sense record, this field stores the record's relative display position among records of the same family. | `FIND` + `ORDER` |
| `parentID` | `senses->[selector]->parentID` | `STORED` | Existing canonical parent `recordKey`, or blank only where the sheet already permits no parent. **Do not invent IDs.** | On a Sense record, this field stores the relationship ID of the record's immediate parent. | `FIND` + `GRAPH` |

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

| Field | ScriptCards location | Value kind | Values / writable domain | Description | Use |
|---|---|---|---|---|---|
| `sizeValue` | `sizes->[selector]->sizeValue` | `STORED` | Observed/recognized values: `Medium`, `Small`. Complete sheet enum not independently proven. | On a Size record, this field stores the canonical creature-size value. | `FIND` + `RECORD` |
| `name` | `sizes->[selector]->name` | `STORED` | Free-text display name. Blank may be technically storable, but names are used for display and sometimes typed selectors; keep it unique when selecting by name. | On a Size record, this field stores the record's primary display name. | `FIND` + `IDENTITY` |
| `shortID` | `sizes->[selector]->shortID` | `STORED` | Existing Beacon compact record ID string. Treat as identity; **do not invent or casually change it**. | On a Size record, this field stores the compact ID used by Beacon sheet action calls. | `FIND` + `IDENTITY` |
| `_enabled` | `sizes->[selector]->_enabled` | `STORED` | `true` = record participates in the live character model; `false` = record is disabled/excluded. This is a record-availability flag, not the same as a Condition `_active` toggle. | On a Size record, this field stores whether the canonical record participates in the live character model. | `FIND` + `TOGGLE` + `RECORD` |
| `parentID` | `sizes->[selector]->parentID` | `STORED` | Existing canonical parent `recordKey`, or blank only where the sheet already permits no parent. **Do not invent IDs.** | On a Size record, this field stores the relationship ID of the record's immediate parent. | `FIND` + `GRAPH` |

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

| Field | ScriptCards location | Value kind | Values / writable domain | Description | Use |
|---|---|---|---|---|---|
| `ability` | `skills->[selector]->ability` | `INPUT` | Ability name. Verified/recognized values: `Strength`, `Dexterity`, `Constitution`, `Intelligence`, `Wisdom`, `Charisma`. | On a Skill record, this field identifies the ability used by this record or formula. | `FIND` + `INPUT` + `RECORD` |
| `custom` | `skills->[selector]->custom` | `STORED` | `true` = Skill is custom; `false` = Skill is a standard/non-custom skill. | On a Skill record, this field stores `custom`. | `FIND` + `RECORD` |
| `showAsPassive` | `skills->[selector]->showAsPassive` | `STORED` | `true` = Skill can be shown/calculated as a passive score; `false` = do not expose it as passive. | On a Skill record, this field stores whether the Skill can be displayed or calculated as a passive score. | `FIND` + `RECORD` — Controls whether this Skill participates in passive-score display or calculation; it is not the passive total itself. |
| `name` | `skills->[selector]->name` | `STORED` | Free-text display name. Blank may be technically storable, but names are used for display and sometimes typed selectors; keep it unique when selecting by name. | On a Skill record, this field stores the record's primary display name. | `FIND` + `IDENTITY` |
| `shortID` | `skills->[selector]->shortID` | `STORED` | Existing Beacon compact record ID string. Treat as identity; **do not invent or casually change it**. | On a Skill record, this field stores the compact ID used by Beacon sheet action calls. | `FIND` + `IDENTITY` |
| `_enabled` | `skills->[selector]->_enabled` | `STORED` | `true` = record participates in the live character model; `false` = record is disabled/excluded. This is a record-availability flag, not the same as a Condition `_active` toggle. | On a Skill record, this field stores whether the canonical record participates in the live character model. | `FIND` + `TOGGLE` + `RECORD` |

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

| Field | ScriptCards location | Value kind | Values / writable domain | Description | Use |
|---|---|---|---|---|---|
| `description` | `species->[selector]->description` | `STORED` | Free text/string. Blank is allowed where the sheet uses no text. Preserve any sheet-specific formatting already present. | On a Species record, this field stores the human-readable description. | `FIND` + `RECORD` |
| `preventSubspecies` | `species->[selector]->preventSubspecies` | `STORED` | `true` = prevent subspecies selection/use; `false` = allow normal subspecies behavior. | On a Species record, this field stores `preventSubspecies`. | `FIND` + `RECORD` |
| `childIDs` | `species->[selector]->childIDs` | `STORED` | Array of existing canonical child `recordKey` values; `[]` = no children. Container value; do not replace wholesale through an ordinary typed write. | On a Species record, this field stores the relationship IDs of this record's immediate child records. | `FIND` + `GRAPH` |
| `name` | `species->[selector]->name` | `STORED` | Free-text display name. Blank may be technically storable, but names are used for display and sometimes typed selectors; keep it unique when selecting by name. | On a Species record, this field stores the record's primary display name. | `FIND` + `IDENTITY` |
| `shortID` | `species->[selector]->shortID` | `STORED` | Existing Beacon compact record ID string. Treat as identity; **do not invent or casually change it**. | On a Species record, this field stores the compact ID used by Beacon sheet action calls. | `FIND` + `IDENTITY` |
| `_enabled` | `species->[selector]->_enabled` | `STORED` | `true` = record participates in the live character model; `false` = record is disabled/excluded. This is a record-availability flag, not the same as a Condition `_active` toggle. | On a Species record, this field stores whether the canonical record participates in the live character model. | `FIND` + `TOGGLE` + `RECORD` |
| `parentID` | `species->[selector]->parentID` | `STORED` | Existing canonical parent `recordKey`, or blank only where the sheet already permits no parent. **Do not invent IDs.** | On a Species record, this field stores the relationship ID of the record's immediate parent. | `FIND` + `GRAPH` |

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

| Field | ScriptCards location | Value kind | Values / writable domain | Description | Use |
|---|---|---|---|---|---|
| `speed` | `speeds->[selector]->speed` | `STORED` | Verified/recognized values: `Walk`, `Fly`, `Fly (Hover)`, `Swim`, `Climb`, `Burrow`, `All`. `All` was observed on condition-owned override records, not as an ordinary movement mode. | On a Speed record, this field identifies the movement mode, such as Walk, Fly, Climb, Swim, or Burrow. | `FIND` + `RECORD` — Identifies the movement mode; the direct alias `speed` represents Speed only. |
| `calculation` | `speeds->[selector]->calculation` | `INPUT` | Verified/recognized values: `Set Base`, `Set Value`. `Set Base` is used for real movement; condition-owned `Set Value` can override (for example `All` to `0`). | On a Speed record, this field identifies the calculation method used by this record. | `FIND` + `INPUT` + `RECORD` |
| `valueFormula.flatValue` | `speeds->[selector]->valueFormula->flatValue` | `INPUT` | Finite numeric formula input. Meaning depends on the record: score/AC/HP/range/slot/mastery capacity. Range is not globally fixed. | On a Speed record, this field stores a finite value used as an input by a formula. | `FIND` + `INPUT` + `RECORD` — Changes the selected movement mode’s base value, after which the sheet recalculates the final speed. |
| `name` | `speeds->[selector]->name` | `STORED` | Free-text display name. Blank may be technically storable, but names are used for display and sometimes typed selectors; keep it unique when selecting by name. | On a Speed record, this field stores the record's primary display name. | `FIND` + `IDENTITY` |
| `shortID` | `speeds->[selector]->shortID` | `STORED` | Existing Beacon compact record ID string. Treat as identity; **do not invent or casually change it**. | On a Speed record, this field stores the compact ID used by Beacon sheet action calls. | `FIND` + `IDENTITY` |
| `_enabled` | `speeds->[selector]->_enabled` | `STORED` | `true` = record participates in the live character model; `false` = record is disabled/excluded. This is a record-availability flag, not the same as a Condition `_active` toggle. | On a Speed record, this field stores whether the canonical record participates in the live character model. | `FIND` + `TOGGLE` + `RECORD` |
| `arrayPosition` | `speeds->[selector]->arrayPosition` | `ORDER` | Numeric ordering position. Exact range is not verified. Explicit display-order arrays can override this fallback ordering. | On a Speed record, this field stores the record's relative display position among records of the same family. | `FIND` + `ORDER` |
| `parentID` | `speeds->[selector]->parentID` | `STORED` | Existing canonical parent `recordKey`, or blank only where the sheet already permits no parent. **Do not invent IDs.** | On a Speed record, this field stores the relationship ID of the record's immediate parent. | `FIND` + `GRAPH` |

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

| Field | ScriptCards location | Value kind | Values / writable domain | Description | Use |
|---|---|---|---|---|---|
| `_prepared` | `spells->[selector]->_prepared` | `STORED` | `true` = spell is prepared; `false` = spell is not prepared. | On a Spell record, this field stores whether the spell is currently prepared. | `FIND` + `TOGGLE` + `RECORD` — This is the character’s current prepared state for the spell. |
| `alwaysPrepared` | `spells->[selector]->alwaysPrepared` | `STORED` | `true` = spell is always prepared; `false` = spell uses ordinary preparation state. | On a Spell record, this field stores `alwaysPrepared`. | `FIND` + `RECORD` — Marks a spell as inherently always prepared; do not use it as a temporary prepared toggle. |
| `level` | `spells->[selector]->level` | `STORED` | Spell level integer `0`–`9`; `0` = cantrip. | On a Spell record, this field stores a class, spell, slot, or upcasting level. | `FIND` + `RECORD` |
| `school` | `spells->[selector]->school` | `STORED` | Spell-school string. The field is mapped, but the complete accepted school literal set was not independently probed in the controlled data. | On a Spell record, this field stores the spell school. | `FIND` + `RECORD` |
| `castingTime` | `spells->[selector]->castingTime` | `STORED` | Free text/string. Blank is allowed where the sheet uses no text. Preserve any sheet-specific formatting already present. | On a Spell record, this field stores `castingTime`. | `FIND` + `RECORD` |
| `range` | `spells->[selector]->range` | `STORED` | Free text/string. Blank is allowed where the sheet uses no text. Preserve any sheet-specific formatting already present. | On a Spell record, this field stores the attack or spell range. | `FIND` + `RECORD` |
| `duration` | `spells->[selector]->duration` | `STORED` | Free text/string. Blank is allowed where the sheet uses no text. Preserve any sheet-specific formatting already present. | On a Spell record, this field stores the duration of the spell or effect. | `FIND` + `RECORD` |
| `concentration` | `spells->[selector]->concentration` | `STORED` | `true` = spell requires Concentration; `false` = spell does not require Concentration. | On a Spell record, this field stores whether the spell requires Concentration. | `FIND` + `RECORD` |
| `ritual` | `spells->[selector]->ritual` | `STORED` | `true` = spell can be cast as a Ritual; `false` = spell is not a Ritual. | On a Spell record, this field stores whether the spell can be cast as a Ritual. | `FIND` + `RECORD` |
| `components.verbal` | `spells->[selector]->components->verbal` | `STORED` | `true` = verbal component is required/present; `false` = verbal component is not required. | On a Spell record, this field stores `verbal`. | `FIND` + `RECORD` |
| `components.somatic` | `spells->[selector]->components->somatic` | `STORED` | `true` = somatic component is required/present; `false` = somatic component is not required. | On a Spell record, this field stores `somatic`. | `FIND` + `RECORD` |
| `components.material` | `spells->[selector]->components->material` | `STORED` | `true` = material component is required/present; `false` = material component is not required. | On a Spell record, this field stores `material`. | `FIND` + `RECORD` |
| `components.materialDescription` | `spells->[selector]->components->materialDescription` | `STORED` | Free text/string. Blank is allowed where the sheet uses no text. Preserve any sheet-specific formatting already present. | On a Spell record, this field stores `materialDescription`. | `FIND` + `RECORD` |
| `cantripScale` | `spells->[selector]->cantripScale` | `STORED` | Object/container. **Do not replace the whole object through a normal typed leaf write.** Read its child structure first and edit only a verified primitive child. | On a Spell record, this field stores the spell's cantrip-scaling behavior. | `FIND` + `RECORD` |
| `upcastText` | `spells->[selector]->upcastText` | `STORED` | Free text/string. Blank is allowed where the sheet uses no text. Preserve any sheet-specific formatting already present. | On a Spell record, this field stores `upcastText`. | `FIND` + `RECORD` |
| `description` | `spells->[selector]->description` | `STORED` | Free text/string. Blank is allowed where the sheet uses no text. Preserve any sheet-specific formatting already present. | On a Spell record, this field stores the human-readable description. | `FIND` + `RECORD` |
| `name` | `spells->[selector]->name` | `STORED` | Free-text display name. Blank may be technically storable, but names are used for display and sometimes typed selectors; keep it unique when selecting by name. | On a Spell record, this field stores the record's primary display name. | `FIND` + `IDENTITY` |
| `shortID` | `spells->[selector]->shortID` | `STORED` | Existing Beacon compact record ID string. Treat as identity; **do not invent or casually change it**. | On a Spell record, this field stores the compact ID used by Beacon sheet action calls. | `FIND` + `IDENTITY` — Use this for the Beacon spell action call; typed writes use the selected collection path. |
| `_enabled` | `spells->[selector]->_enabled` | `STORED` | `true` = record participates in the live character model; `false` = record is disabled/excluded. This is a record-availability flag, not the same as a Condition `_active` toggle. | On a Spell record, this field stores whether the canonical record participates in the live character model. | `FIND` + `TOGGLE` + `RECORD` |
| `arrayPosition` | `spells->[selector]->arrayPosition` | `ORDER` | Numeric ordering position. Exact range is not verified. Explicit display-order arrays can override this fallback ordering. | On a Spell record, this field stores the record's relative display position among records of the same family. | `FIND` + `ORDER` |
| `parentID` | `spells->[selector]->parentID` | `STORED` | Existing canonical parent `recordKey`, or blank only where the sheet already permits no parent. **Do not invent IDs.** | On a Spell record, this field stores the relationship ID of the record's immediate parent. | `FIND` + `GRAPH` |
| `childIDs` | `spells->[selector]->childIDs` | `STORED` | Array of existing canonical child `recordKey` values; `[]` = no children. Container value; do not replace wholesale through an ordinary typed write. | On a Spell record, this field stores the relationship IDs of this record's immediate child records. | `FIND` + `GRAPH` |

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

| Field | ScriptCards location | Value kind | Values / writable domain | Description | Use |
|---|---|---|---|---|---|
| `_slotType` | `spellslots->[selector]->_slotType` | `STORED` | Observed/recognized values: `normal`, `Pact`. Complete sheet enum not independently proven. `normal` identifies ordinary levelled slots; `Pact` identifies Pact Magic progression. | On a Spell Slot record, this field identifies the spell-slot category, such as normal or Pact. | `FIND` + `RECORD` — Distinguishes normal and Pact entitlement records; do not infer the slot type from `spellLevel` alone. |
| `spellLevel` | `spellslots->[selector]->spellLevel` | `STORED` | Spell-slot level integer `1`–`9` for Spell Slot records. | On a Spell Slot record, this field stores the spell-slot level. | `FIND` + `RECORD` |
| `calculation` | `spellslots->[selector]->calculation` | `INPUT` | Observed/recognized values: `Set Base`, `Modify`, `Minimum`. Complete sheet enum not independently proven. These are the shapes recognized by the current ScriptCards local normal-slot reconstruction. | On a Spell Slot record, this field identifies the calculation method used by this record. | `FIND` + `INPUT` + `RECORD` |
| `valueFormula.flatValue` | `spellslots->[selector]->valueFormula->flatValue` | `INPUT` | Finite numeric formula input. Meaning depends on the record: score/AC/HP/range/slot/mastery capacity. Range is not globally fixed. | On a Spell Slot record, this field stores a finite value used as an input by a formula. | `FIND` + `INPUT` + `RECORD` |
| `name` | `spellslots->[selector]->name` | `STORED` | Free-text display name. Blank may be technically storable, but names are used for display and sometimes typed selectors; keep it unique when selecting by name. | On a Spell Slot record, this field stores the record's primary display name. | `FIND` + `IDENTITY` |
| `shortID` | `spellslots->[selector]->shortID` | `STORED` | Existing Beacon compact record ID string. Treat as identity; **do not invent or casually change it**. | On a Spell Slot record, this field stores the compact ID used by Beacon sheet action calls. | `FIND` + `IDENTITY` |
| `_enabled` | `spellslots->[selector]->_enabled` | `STORED` | `true` = record participates in the live character model; `false` = record is disabled/excluded. This is a record-availability flag, not the same as a Condition `_active` toggle. | On a Spell Slot record, this field stores whether the canonical record participates in the live character model. | `FIND` + `TOGGLE` + `RECORD` |
| `overwrittenBy` | `spellslots->[selector]->overwrittenBy` | `STORED` | Existing replacement record `recordKey`, or blank when not superseded. Used for progression overwrite chains; do not invent or point at an unrelated record. | Stores the raw canonical key of the later record that supersedes this progression stage. | `FIND` + `GRAPH` — When the referenced replacement exists and is enabled, ScriptCards excludes this record from the active typed collection. |
| `cascades` | `spellslots->[selector]->cascades` | `STORED` | Object/container. **Do not replace the whole object through a normal typed leaf write.** Read its child structure first and edit only a verified primitive child. | Stores progression/cascade metadata. The tested earlier Pact record identified its replacement as an `Overwrite`. | `FIND` + `GRAPH` — Treat as structural metadata; do not add the values of overwrite-linked records. |
| `parentID` | `spellslots->[selector]->parentID` | `STORED` | Existing canonical parent `recordKey`, or blank only where the sheet already permits no parent. **Do not invent IDs.** | On a Spell Slot record, this field stores the relationship ID of the record's immediate parent. Multiple progression stages can share this parent. | `FIND` + `GRAPH` — Parent identity alone may match several raw records; active typed selection also applies the overwrite rule. |

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

| Field | ScriptCards location | Value kind | Values / writable domain | Description | Use |
|---|---|---|---|---|---|
| `ability` | `spellcastings->[selector]->ability` | `INPUT` | Ability name. Verified/recognized values: `Strength`, `Dexterity`, `Constitution`, `Intelligence`, `Wisdom`, `Charisma`. | Verified official write target. The D&D 2024 Beacon sheet's Spellcasting Ability selector changes this field on the selected Spellcasting record. Each class, pact, species, or other spellcasting source may have its own value. | `FIND` + `INPUT` + `RECORD` — Write this exact field to mimic the official sheet selector. |
| `spellcastingAbility` | `spellcastings->[selector]->spellcastingAbility` | `UNKNOWN` | Field name was **not a verified write target** on the tested D&D 2024 records. Use `ability` instead. When present, it is expected to contain an ability name. | High Elf, Paladin, and Warlock Spellcasting records returned `undefined`, and the official selector did not write this field. It is not the verified D&D 2024 Beacon casting-ability write target. | `FIND` + `UNVERIFIED` — Prefer `ability`; do not create or write this field merely because its name suggests it. |
| `casterType` | `spellcastings->[selector]->casterType` | `STORED` | Spellcasting progression/category string. Exact accepted literals were not independently enumerated; do not change it to alter a character's class progression without separate validation. | On a Spellcasting record, this field identifies the spellcasting progression or caster category. | `FIND` + `RECORD` |
| `overviewDisplay` | `spellcastings->[selector]->overviewDisplay` | `STORED` | `true` = show/include this Spellcasting profile in the overview display; `false` = do not show it in the overview display. | On a Spellcasting record, this field stores `overviewDisplay`. | `FIND` + `RECORD` |
| `name` | `spellcastings->[selector]->name` | `STORED` | Free-text display name. Blank may be technically storable, but names are used for display and sometimes typed selectors; keep it unique when selecting by name. | On a Spellcasting record, this field stores the record's primary display name. | `FIND` + `IDENTITY` |
| `shortID` | `spellcastings->[selector]->shortID` | `STORED` | Existing Beacon compact record ID string. Treat as identity; **do not invent or casually change it**. | On a Spellcasting record, this field stores the compact ID used by Beacon sheet action calls. | `FIND` + `IDENTITY` |
| `_enabled` | `spellcastings->[selector]->_enabled` | `STORED` | `true` = record participates in the live character model; `false` = record is disabled/excluded. This is a record-availability flag, not the same as a Condition `_active` toggle. | On a Spellcasting record, this field stores whether the canonical record participates in the live character model. | `FIND` + `TOGGLE` + `RECORD` |
| `parentID` | `spellcastings->[selector]->parentID` | `STORED` | Existing canonical parent `recordKey`, or blank only where the sheet already permits no parent. **Do not invent IDs.** | On a Spellcasting record, this field stores the relationship ID of the record's immediate parent. | `FIND` + `GRAPH` |
| `childIDs` | `spellcastings->[selector]->childIDs` | `STORED` | Array of existing canonical child `recordKey` values; `[]` = no children. Container value; do not replace wholesale through an ordinary typed write. | On a Spellcasting record, this field stores the relationship IDs of this record's immediate child records. | `FIND` + `GRAPH` |

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

| Field | ScriptCards location | Value kind | Values / writable domain | Description | Use |
|---|---|---|---|---|---|
| `childIDs` | `subclasses->[selector]->childIDs` | `STORED` | Array of existing canonical child `recordKey` values; `[]` = no children. Container value; do not replace wholesale through an ordinary typed write. | On a Subclass record, this field stores the relationship IDs of this record's immediate child records. | `FIND` + `GRAPH` |
| `name` | `subclasses->[selector]->name` | `STORED` | Free-text display name. Blank may be technically storable, but names are used for display and sometimes typed selectors; keep it unique when selecting by name. | On a Subclass record, this field stores the record's primary display name. | `FIND` + `IDENTITY` |
| `shortID` | `subclasses->[selector]->shortID` | `STORED` | Existing Beacon compact record ID string. Treat as identity; **do not invent or casually change it**. | On a Subclass record, this field stores the compact ID used by Beacon sheet action calls. | `FIND` + `IDENTITY` |
| `_enabled` | `subclasses->[selector]->_enabled` | `STORED` | `true` = record participates in the live character model; `false` = record is disabled/excluded. This is a record-availability flag, not the same as a Condition `_active` toggle. | On a Subclass record, this field stores whether the canonical record participates in the live character model. | `FIND` + `TOGGLE` + `RECORD` |
| `parentID` | `subclasses->[selector]->parentID` | `STORED` | Existing canonical parent `recordKey`, or blank only where the sheet already permits no parent. **Do not invent IDs.** | On a Subclass record, this field stores the relationship ID of the record's immediate parent. | `FIND` + `GRAPH` |
| `sourceID` | `subclasses->[selector]->sourceID` | `STORED` | Existing owning/source identity string. The target type varies by record family; resolve it against the canonical graph before using or changing it. | On a Subclass record, this field stores the originating source record identifier. | `FIND` + `IDENTITY` |

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

| Field | ScriptCards location | Value kind | Values / writable domain | Description | Use |
|---|---|---|---|---|---|
| `mode` | `upcastings->[selector]->mode` | `STORED` | Observed Upcasting value: `Per X Spell Level`. Complete mode enum is not independently mapped. | On an Upcasting record, this field stores the selected mode, such as a roll or upcasting mode. | `FIND` + `RECORD` |
| `startingLevel` | `upcastings->[selector]->startingLevel` | `STORED` | Spell/upcasting level integer. Observed rules use level thresholds; exact allowed bounds depend on the parent spell/attack. | On an Upcasting record, this field stores the starting level for the upcasting rule. | `FIND` + `RECORD` |
| `level` | `upcastings->[selector]->level` | `STORED` | Spell/upcasting level integer. Observed rules use level thresholds; exact allowed bounds depend on the parent spell/attack. | On an Upcasting record, this field stores a class, spell, slot, or upcasting level. | `FIND` + `RECORD` |
| `changeMode` | `upcastings->[selector]->changeMode` | `STORED` | Observed Upcasting value: `Add`. Complete change-mode enum is not independently mapped. | On an Upcasting record, this field stores how the target value changes at higher levels. | `FIND` + `RECORD` |
| `target` | `upcastings->[selector]->target` | `STORED` | Target-path string naming the parent field to change. Observed: `$.repeat`; cantrip scaling also targets dice-count paths such as `$_diceCount`. Only use a target path already valid for that record shape. | On an Upcasting record, this field identifies the value or linked record affected by the scaling rule. | `FIND` + `RECORD` — Identifies the value or linked record being scaled; preserve the expected target identity when editing the rule. |
| `value` | `upcastings->[selector]->value` | `STORED` | Finite numeric amount applied by the upcasting rule (for example `1` in the observed Magic Missile repeat-scaling rule). | On an Upcasting record, this field stores the record's finite current value. | `FIND` + `RECORD` |
| `name` | `upcastings->[selector]->name` | `STORED` | Free-text display name. Blank may be technically storable, but names are used for display and sometimes typed selectors; keep it unique when selecting by name. | On an Upcasting record, this field stores the record's primary display name. | `FIND` + `IDENTITY` |
| `shortID` | `upcastings->[selector]->shortID` | `STORED` | Existing Beacon compact record ID string. Treat as identity; **do not invent or casually change it**. | On an Upcasting record, this field stores the compact ID used by Beacon sheet action calls. | `FIND` + `IDENTITY` |
| `_enabled` | `upcastings->[selector]->_enabled` | `STORED` | `true` = record participates in the live character model; `false` = record is disabled/excluded. This is a record-availability flag, not the same as a Condition `_active` toggle. | On an Upcasting record, this field stores whether the canonical record participates in the live character model. | `FIND` + `TOGGLE` + `RECORD` |
| `parentID` | `upcastings->[selector]->parentID` | `STORED` | Existing canonical parent `recordKey`, or blank only where the sheet already permits no parent. **Do not invent IDs.** | On an Upcasting record, this field stores the relationship ID of the record's immediate parent. | `FIND` + `GRAPH` |

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

| Field | ScriptCards location | Value kind | Values / writable domain | Description | Use |
|---|---|---|---|---|---|
| `parentID` | `weaponmasterychanges->[selector]->parentID` | `STORED` | Existing canonical parent `recordKey`, or blank only where the sheet already permits no parent. **Do not invent IDs.** | Stores the linked record ID of the owning feature record. | `FIND` + `GRAPH` |
| `name` | `weaponmasterychanges->[selector]->name` | `STORED` | Free-text display name. Blank may be technically storable, but names are used for display and sometimes typed selectors; keep it unique when selecting by name. | Stores the record's display name. | `FIND` + `IDENTITY` |
| `shortID` | `weaponmasterychanges->[selector]->shortID` | `STORED` | Existing Beacon compact record ID string. Treat as identity; **do not invent or casually change it**. | Stores the compact Beacon action identity. | `FIND` + `IDENTITY` |
| `_enabled` | `weaponmasterychanges->[selector]->_enabled` | `STORED` | `true` = record participates in the live character model; `false` = record is disabled/excluded. This is a record-availability flag, not the same as a Condition `_active` toggle. | Stores whether the record participates in the live character model. | `FIND` + `TOGGLE` + `RECORD` |

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

| Field | ScriptCards location | Value kind | Values / writable domain | Description | Use |
|---|---|---|---|---|---|
| `known` | `weaponmasteryknowns->[selector]->known` | `STORED` | Object/container. **Do not replace the whole object through a normal typed leaf write.** Read its child structure first and edit only a verified primitive child. | Stores an object whose key identifies the weapon selected for mastery. | `FIND` + `RECORD` — Structured selected-weapon data; address an existing primitive child instead of replacing the whole object. |
| `childIDs` | `weaponmasteryknowns->[selector]->childIDs` | `STORED` | Array of existing canonical child `recordKey` values; `[]` = no children. Container value; do not replace wholesale through an ordinary typed write. | Stores the linked record ID of the linked Weapon Mastery record. | `FIND` + `GRAPH` — Contains the linked Weapon Mastery record identity; edit an existing array element rather than replacing the whole array. |
| `name` | `weaponmasteryknowns->[selector]->name` | `STORED` | Free-text display name. Blank may be technically storable, but names are used for display and sometimes typed selectors; keep it unique when selecting by name. | Stores the selected mastery record's display name. | `FIND` + `IDENTITY` |
| `shortID` | `weaponmasteryknowns->[selector]->shortID` | `STORED` | Existing Beacon compact record ID string. Treat as identity; **do not invent or casually change it**. | Stores the compact Beacon action identity. | `FIND` + `IDENTITY` |
| `_enabled` | `weaponmasteryknowns->[selector]->_enabled` | `STORED` | `true` = record participates in the live character model; `false` = record is disabled/excluded. This is a record-availability flag, not the same as a Condition `_active` toggle. | Stores whether the selection participates in the live character model. | `FIND` + `TOGGLE` + `RECORD` |
| `parentID` | `weaponmasteryknowns->[selector]->parentID` | `STORED` | Existing canonical parent `recordKey`, or blank only where the sheet already permits no parent. **Do not invent IDs.** | Stores the linked record ID of the owning Weapon Mastery feature. | `FIND` + `GRAPH` |

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

| Field | ScriptCards location | Value kind | Values / writable domain | Description | Use |
|---|---|---|---|---|---|
| `calculation` | `weaponmasteryslots->[selector]->calculation` | `INPUT` | Verified/recognized values: `Set Base`, `Modify`. | Stores the calculation mode used for mastery capacity. | `FIND` + `INPUT` + `RECORD` |
| `valueFormula.flatValue` | `weaponmasteryslots->[selector]->valueFormula->flatValue` | `INPUT` | Finite numeric formula input. Meaning depends on the record: score/AC/HP/range/slot/mastery capacity. Range is not globally fixed. | Stores the finite mastery-slot capacity. | `FIND` + `INPUT` + `RECORD` |
| `name` | `weaponmasteryslots->[selector]->name` | `STORED` | Free-text display name. Blank may be technically storable, but names are used for display and sometimes typed selectors; keep it unique when selecting by name. | Stores the record's display name. | `FIND` + `IDENTITY` |
| `shortID` | `weaponmasteryslots->[selector]->shortID` | `STORED` | Existing Beacon compact record ID string. Treat as identity; **do not invent or casually change it**. | Stores the compact Beacon action identity. | `FIND` + `IDENTITY` |
| `_enabled` | `weaponmasteryslots->[selector]->_enabled` | `STORED` | `true` = record participates in the live character model; `false` = record is disabled/excluded. This is a record-availability flag, not the same as a Condition `_active` toggle. | Stores whether the capacity record participates in the live character model. | `FIND` + `TOGGLE` + `RECORD` |
| `parentID` | `weaponmasteryslots->[selector]->parentID` | `STORED` | Existing canonical parent `recordKey`, or blank only where the sheet already permits no parent. **Do not invent IDs.** | Stores the linked record ID of the owning Weapon Mastery feature. | `FIND` + `GRAPH` |

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

| Field | ScriptCards location | Value kind | Values / writable domain | Description | Use |
|---|---|---|---|---|---|
| `active` | `weaponmasteries->[selector]->active` | `STORED` | `true` = Weapon Mastery assignment is active; `false` = Weapon Mastery assignment is inactive. | On a Weapon Mastery record, this field stores whether the mastery is currently active. | `FIND` + `TOGGLE` + `RECORD` — This is the mastery’s active state; `_enabled` only controls whether the record participates. |
| `applies` | `weaponmasteries->[selector]->applies` | `STORED` | Verified/recognized values: `On Hit`, `On Miss`. | On a Weapon Mastery record, this field stores the item or weapon applicability rules. | `FIND` + `RECORD` — Structured applicability rules; inspect and edit an existing primitive child rather than replacing the container blindly. |
| `defaultItems` | `weaponmasteries->[selector]->defaultItems` | `STORED` | Array of default Item/weapon names associated with the mastery. `[]` = none. Container; do not replace wholesale through an ordinary typed leaf write. | On a Weapon Mastery record, this field stores the default items associated with the mastery. | `FIND` + `RECORD` — Structured default-item data; inspect and edit an existing primitive child or array element rather than replacing the container blindly. |
| `description` | `weaponmasteries->[selector]->description` | `STORED` | Free text/string. Blank is allowed where the sheet uses no text. Preserve any sheet-specific formatting already present. | On a Weapon Mastery record, this field stores the human-readable description. | `FIND` + `RECORD` |
| `name` | `weaponmasteries->[selector]->name` | `STORED` | Free-text display name. Blank may be technically storable, but names are used for display and sometimes typed selectors; keep it unique when selecting by name. | On a Weapon Mastery record, this field stores the record's primary display name. | `FIND` + `IDENTITY` |
| `shortID` | `weaponmasteries->[selector]->shortID` | `STORED` | Existing Beacon compact record ID string. Treat as identity; **do not invent or casually change it**. | On a Weapon Mastery record, this field stores the compact ID used by Beacon sheet action calls. | `FIND` + `IDENTITY` |
| `_enabled` | `weaponmasteries->[selector]->_enabled` | `STORED` | `true` = record participates in the live character model; `false` = record is disabled/excluded. This is a record-availability flag, not the same as a Condition `_active` toggle. | On a Weapon Mastery record, this field stores whether the canonical record participates in the live character model. | `FIND` + `TOGGLE` + `RECORD` |
| `parentID` | `weaponmasteries->[selector]->parentID` | `STORED` | Existing canonical parent `recordKey`, or blank only where the sheet already permits no parent. **Do not invent IDs.** | On a Weapon Mastery record, this field stores the relationship ID of the record's immediate parent. | `FIND` + `GRAPH` |
| `childIDs` | `weaponmasteries->[selector]->childIDs` | `STORED` | Array of existing canonical child `recordKey` values; `[]` = no children. Container value; do not replace wholesale through an ordinary typed write. | On a Weapon Mastery record, this field stores the relationship IDs of this record's immediate child records. | `FIND` + `GRAPH` |

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
