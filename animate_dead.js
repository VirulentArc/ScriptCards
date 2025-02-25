!scriptcards {{ 

  --:DoFormatting|

    --#overridetemplate|mydnd
    --&AnimateDead|@{AnimateDead|character_id}
    --#sourceToken|@{selected|token_id}
    --&SpellName|Animate Dead
    --&SoundEffectTrack|
    --&SpellLevel|3
    --#Debug|0

  --/|Token Image Variables
    --&ZombieToken|https://s3.amazonaws.com/files.d20.io/images/374874811/CkeFPFdmE3dnpwtFjfvGZg/original.png?17049357245
    --&SkeletonToken|https://s3.amazonaws.com/files.d20.io/images/374874951/YcobSDMcdzaefYw0I5rTdw/original.png?17049357805

  -->DoesCharacterExist|

--X|

  --:DoesCharacterExist|
    --?"@{AnimateDead|charactersheet_type}" -neq "npc"|NoCharacter|IsFirstRun
  --X|

  --:IsFirstRun|
    --=DoesExist|[T#AnimateDead]
    --&FFText|[$DoesExist.tableEntryText]
    --?"[&FFText]" -eq "0"|MakeTable|SpellInfo
  --X|

  --:MakeTable|
    --+|[b]Creating Rollable Token Table for First Run for Animate Dead[/b]
    --!o#:tableid|AnimateDead
	--+New Table ID|[&tableid]
	--!oe:entryid|[&tableid];Zombie
    --!tableitem:[&entryid]|avatar:[&ZombieToken]
    --+New Entry ID|[&entryid]
	--!oe:entryid|[&tableid];Skeleton
    --!tableitem:[&entryid]|avatar:[&SkeletonToken]
    --+|[br][b]The Multi-sided token (rollable table) AnimateDead has been created. Please add your tokens to the table before proceding. Then link your token to your character sheet, setting bar information and turning on vision.[/b]

    --!or:[&AnimateDead]:npcaction|name:Shortsword|attack_flag:on|attack_type:Melee|attack_target:one target|attack_range:5 ft.|attack_tohit:4|attack_damage:1d6 + 2|attack_damagetype:piercing|attack_tohitrange:+4, Reach 5ft., one target|attack_onhit:7 (1d6 + 2) piercing damage|attack_crit:1d6
    --!or:[&AnimateDead]:npcaction|name:Shortbow|attack_flag:on|attack_type:Melee|attack_target:one target|attack_range:80/320 ft.|attack_tohit:4|attack_damage:1d6 + 2|attack_damagetype:piercing|attack_tohitrange:+4, Reach 80/320 ft., one target|attack_onhit:7 (1d6 + 2) piercing damage|attack_crit:1d6

    --!or:[&AnimateDead]:npctrait|name:Undead Fortitude|description:If damage reduces the zombie to 0 hit points, it must make a Constitution saving throw with a DC of 5 + the damage taken, unless the damage is radiant or from a critical hit. On a success, the zombie drops to 1 hit point instead.
  --X|

  --:SpellInfo|

    --Rfind|@{selected|character_id};[&SpellName];repeating_spell-[&SpellLevel];spellname

    --#emoteText|[*S:character_name] Casts [*R:spellname].
    --#title|&nbsp;&nbsp;[*R:spellname]
    --?[*R:spelllevel] -eq cantrip|&spllvl;cantrip|&spllvl;[*R:spelllevel]
    --?[&spllvl] -eq 1|&lvlsuffix;st
    --?[&spllvl] -eq 2|&lvlsuffix;nd
    --?[&spllvl] -eq 3|&lvlsuffix;rd
    --?[&spllvl] -ge 4|&lvlsuffix;th

    --?"[*R:spellcomp_v]" -inc "v=1"|&Verbal;V|&Verbal;
    --?"[*R:spellcomp_s]" -inc "s=1"|&Somatic;S|&Somatic;
    --?"[*R:spellcomp_m]" -inc "m=1"|[
      --&Components|M
      --&Materials|([*R:spellcomp_materials])
    --]|
    --?"[*R:spellconcentration]" -inc 1|&Concentration;Concentration,

    --&SpellDesc|[*R:spelldescription]
    --=SpellDescCalc|[&SpellDesc(length)] - 1024

    --/|Output

      --+|[i][&spllvl][&lvlsuffix]-Level [*R:spellschool][/i]
      --+|[br]
	  --+Casting Time:|[*R:spellcastingtime]
      --+Range:|[*R:spellrange]
      --+Components:|[&Verbal][&Somatic][&Components] [&Materials]
	  --+Duration:|[&Concentration]&nbsp;[*R:spellduration]
      --+|[t width=100% title="[&SpellDesc([$SpellDescCalc.Raw],[&SpellDesc(length)])]"][tr][td][&SpellDesc(0,[$SpellDescCalc.Raw])]...[/td][/tr][/t]
      --?"[*R:spellathigherlevels]" -ne ""|[
        --+&nbsp;&nbsp;&nbsp;&nbsp;[i]At Higher Levels:[/i]|[*R:spellathigherlevels]
      --]|
      --+|[br]
      --+|[c][b]At what level is the spell being cast?[/b][/c]
      --+|[c][rbutton]3rd::DoSpell;3[/rbutton][rbutton]4th::DoSpell;4[/rbutton][rbutton]5th::DoSpell;5[/rbutton][rbutton]6th::DoSpell;6[/rbutton][rbutton]7th::DoSpell;7[/rbutton][rbutton]8th::DoSpell;8[/rbutton][rbutton]9th::DoSpell;9[/rbutton][/c]
      --+|[br]
  --X|

  --:DoSpell|
    --=SlotLevel|[&reentryval]
    --=SlotsTotal|0
    --=SlotsExpended|[*S:lvl[$SlotLevel]_slots_expended]
	--?[$SlotLevel] -eq 3|[
	  --=HowManyDead|1
	--]|[
	  --=HowManyDead|[$SlotLevel] - 1
	--]|
    --?[$SlotsExpended.Raw] -eq [$SlotsTotal.Raw]|[
      --+|[c][b][*S:character_name] has no level [$SlotLevel.Total] spell slots available.[/b][/c]
	--]|[
      --=SlotsLeft|[$SlotsExpended] - 1
	  --!a:[*S:character_id]|lvl[$SlotLevel]_slots_expended:[$SlotsLeft]
	--]|
    -->GetDead|
  --X|

  --:GetDead|
    --#whisper|self
    --+|[c][b]What are you casting this spell on?[/b][br][br][rbutton]Corpse::Undead;Zombie[/rbutton][rbutton]Bones::Undead;Skeleton[/rbutton][/c]
  --X|

  --:Undead|
    --#whisper|
    --&UndeadType|[&reentryval]
    --c[&UndeadType]|Zombie:&Type;1|Skeleton:&Type;2
    --c[&UndeadType]|Zombie:&Size;Medium Undead, neutral evil|Skeleton:&Size;Medium Undead, lawful evil
    --c[&UndeadType]|Zombie:&UndeadAC;8|Skeleton:&UndeadAC;13
    --c[&UndeadType]|Zombie:&ACType;|Skeleton:&ACType;armor scraps
    --c[&UndeadType]|Zombie:&hplvl;22|Skeleton:&hplvl;13
    --c[&UndeadType]|Zombie:&hpformula;3d8+9|Skeleton:&hpformula;2d8+9
    --c[&UndeadType]|Zombie:&STR;13|Skeleton:&STR;10
    --c[&UndeadType]|Zombie:&DEX;6|Skeleton:&DEX;14
    --c[&UndeadType]|Zombie:&CON;16|Skeleton:&CON;15
    --c[&UndeadType]|Zombie:&INT;3|Skeleton:&INT;6
    --c[&UndeadType]|Zombie:&WIS;6|Skeleton:&WIS;8
    --c[&UndeadType]|Zombie:&CHA;5|Skeleton:&CHA;5
    --c[&UndeadType]|Zombie:&Speed;20 ft.|Skeleton:&Speed;30 ft.
    --c[&UndeadType]|Zombie:&PP;8|Skeleton:&PP;9
    --c[&UndeadType]|Zombie:&Vuln;|Skeleton:&Vuln;bludgeoning
    --c[&UndeadType]|Zombie:&ConImm;poisoned|Skeleton:&ConImm;exhaustion, poisoned
    --c[&UndeadType]|Zombie:&WisSave;++0|Skeleton:&WisSave;

    --!a:[&AnimateDead]|!npc_name:[&UndeadType]|!npc_type:[&Size]|!npc_ac:[&UndeadAC]|!npc_actype:[&ACType]|!hp:[&hplvl]|!hp^:[&hplvl]|!npc_hpformula:[&hpformula]|!strength_base:[&STR]|!dexterity_base:[&DEX]|!constitution_base:[&CON]|!intelligence_base:[&INT]|!wisdom_base:[&WIS]|!charisma_base:[&CHA]|!npc_speed:[&Speed]|!npc_challenge:1/4|!npc_xp:50|!npc_senses:Darkvision 60 ft., Passive Perception [&PP]|!npc_languages:understands all languages it spoke in life but can't speak|!npc_immunities:poison|!npc_condition_immunities:[&ConImm]|!npc_vulnerabilities:[&Vuln]|!npc_wis_save_base:[&WisSave]

    --Rfirst|[&AnimateDead];repeating_npcaction
    --?"[&UndeadType]" -inc "Zombie"|[
      --!a:[&AnimateDead]|[*R>name]:Slam|[*R>attack_flag]:on|[*R>attack_type]:Melee|[*R>attack_target]:one target|[R>attack_range]:5 ft.|[*R>attack_tohit]:3|[*R>attack_damage]:1d6 + 1|[*R>attack_damagetype]:bludgeoning|[*R>attack_onhit]:1d6 + 1
    --]|[
      --!a:[&AnimateDead]|[*R>name]:Shortsword|[*R>attack_flag]:on|[*R>attack_type]:Melee|[*R>attack_target]:one target|[R>attack_range]:5 ft.|[*R>attack_tohit]:4|[*R>attack_damage]:1d6 + 2|[*R>attack_damagetype]:piercing|[*R>attack_onhit]:1d6 + 2
    --]|
    --Rnext|
    --?"[&UndeadType]" -inc "Zombie"|[
      --!a:[&AnimateDead]|[*R>name]:|[*R>attack_flag]:off|[*R>attack_type]:|[*R>attack_target]:|[R>attack_range]:|[*R>attack_tohit]:|[*R>attack_damage]:|[*R>attack_damagetype]:|[*R>attack_tohitrange]:|[*R>attack_onhit]:
    --]|[
      --!a:[&AnimateDead]|[*R>name]:Shortbow|[*R>attack_flag]:on|[*R>attack_type]:Ranged|[*R>attack_target]:one target|[R>attack_range]:80/320 ft.|[*R>attack_tohit]:4|[*R>attack_damage]:1d6 + 2|[*R>attack_damagetype]:piercing|[*R>attack_tohitrange]:|[*R>attack_onhit]:1d6 + 2
    --]|
    --Rfirst|[&AnimateDead];repeating_npctrait
    --?"[&UndeadType]" -inc "Zombie"|[
      --!a:[&AnimateDead]|[*R>name]:Undead Fortitude|[*R>description]:If damage reduces the zombie to 0 hit points, it must make a Constitution saving throw with a DC of 5 + the damage taken, unless the damage is radiant or from a critical hit. On a success, the zombie drops to 1 hit point instead.
    --]|[
      --!a:[&AnimateDead]|[*R>name]:|[*R>description]:
    --]|

    --a|[&SoundEffectTrack]

    --@forselected|Spawn _name|AnimateDead _offset|1,0 _side|[&Type] _qty|[$HowManyDead] _placement|surround _size|1 _expand|20,20 _tokenProps|has_night_vision:1,night_vision_distance:60,night_vision_effect:Nocturnal
    --+|[b][c][*S:character_name] Summoned a [&UndeadType].[/c][/b]
    --+|[c][b]Level [$SlotLevel] Slots Left: [$SlotsLeft][/b][/c]

  --X|

  --:NoCharacter|
    --+|[b]Please make sure to create an NPC character named AnimateDead, then rerun the script.[/b]
  --X|

}}