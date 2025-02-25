!scriptcards {{ 

  --/|Script Name : Find Familiar
  --/|Version     : v2.0.0
  --/|Author      : Timothy Beasley
  --/|API MODs    : ScriptCards, SpawnDefaultToken, TokenMod(if you want a concentration status marker), SelectManager(I suggest installing MetaScriptToolbox to get SelectManager)

  --/|Description : This script on first run creates a Rollable Token Table and writes stats to the SummonBeast character
  --/|              On all subsequent runs it will cast the spell which will ask for the spell slot level used;
  --/|              ask if the Beast being summoned is a Land, Air, or Water beast. It will then Spawn the token beside the Summoner.
  --/|
  --/|Instructions: First create a new NPC character and call it SummonBeast. The name is case sensative with no spaces.
  --/|              Secondly, run the script for the first time.
  --/|              Next go to your Rollable Tables and click on "token" of the SummonBeast table. 
  --/|              Link the token to the SummonBeast character.
  --/|              All of the subsequent runs of the script will then just cast the spell.

  --#overridetemplate|mydnd
  --&SummonBeast|@{SummonBeast|character_id}
  --#sourceToken|@{selected|token_id}
  --&SoundEffectTrack|absorb_elements
  --&SpellLevel|2
  --&SpellName|Summon Beast
  --&StatusMarker|Concentration::6498817
  --#debug|0

  --/|Token Image Variables
    --&LandToken|https://s3.amazonaws.com/files.d20.io/images/405355810/bPNKocIsdnbzZhzpWX4_mQ/original.png?17237716575
    --&AirToken|https://s3.amazonaws.com/files.d20.io/images/405356017/QoKKmEFLHV8hvSwxHxgU4w/original.png?17237717685
    --&WaterToken|https://s3.amazonaws.com/files.d20.io/images/405355871/e-jsklroffKcQ4B_JXzn4A/original.png?17237716955

  -->DoesCharacterExist|

--X|

  --:DoesCharacterExist|
    --?"@{SummonBeast|charactersheet_type}" -neq "npc"|NoCharacter|IsFirstRun
  --X|

  --:IsFirstRun|
    --=DoesExist|[T#SummonBeast]
    --&FFText|[$DoesExist.tableEntryText]
    --?"[&FFText]" -eq ""|MakeTable|SpellInfo
  --X|

  --:MakeTable|
    --Rfind|@{SummonBeast|character_id};Maul;repeating_npcaction;name
      --+|[b]Creating Rollable Token Table for First Run[/b]
      --!o#:tableid|SummonBeast
      --+New Table ID|[&tableid]
      --!oe:entryid|[&tableid];Land-Beast
      --!tableitem:[&entryid]|avatar:[&LandToken]
      --+New Entry ID|[&entryid]
      --!oe:entryid|[&tableid];Air-Beast
      --!tableitem:[&entryid]|avatar:[&AirToken]
      --+New Entry ID|[&entryid]
      --!oe:entryid|[&tableid];Water-Beast
      --!tableitem:[&entryid]|avatar:[&WaterToken]
      --+New Entry ID|[&entryid]
      --+Rollable Token Table SummonBeast created.| Don't forget to link your new rollable token to your SummonBeast character sheet. The next run of this macro will just cast the spell.

	--!a:[&SummonBeast]|!npc_type:Medium Beast, Unaligned|!npc_actype:natural armor|!npc_hpformula:|!strength_base:18|!dexterity_base:11|!constitution_base:16|!intelligence_base:4|!wisdom_base:14|!charisma_base:5|!initiative_bonus:|!npc_challenge:|!npc_xp:|!npc_senses:Darkvision 60 ft., Passive Perception 12|!npc_languages:Same as Caster

    --!or:[&SummonBeast]:npcaction|name:Maul|attack_flag:on|attack_type:Melee|attack_target:one target|attack_range:5 ft.|attack_tohit:@{selected|spell_attack_bonus}|attack_damagetype:piercing|attack_tohitrange:|attack_range:5ft.|attack_target:one target
    --!or:[&SummonBeast]:npcaction|name:Multiattack|attack_flag:off|description:The beast makes a number of attacks equal to half this spell’s level (rounded down).
    --!or:[&SummonBeast]:npctrait|name:temp|description:temp
    --!or:[&SummonBeast]:npctrait|name:temp2|description:temp2
    --&obrac|{
    --&cbrac|}
    --&perc|%
    --!ob:AbilID:[&SummonBeast]:Maul:y|[&perc][&obrac]SummonBeast|repeating_npcaction_$0_npc_action[&cbrac]
    --!ob:AbilID2:[&SummonBeast]:Multiattack:y|@[&obrac]SummonBeast|wtype[&cbrac]&[&obrac]template:npcaction[&cbrac] @[&obrac]SummonBeast|npc_name_flag[&cbrac] [&obrac][&obrac]rname=Multiattack[&cbrac][&cbrac] [&obrac][&obrac]description=The beast makes a number of attacks equal to half this spell’s level (rounded down).[&cbrac][&cbrac] @[&obrac]SummonBeast|charname_output[&cbrac]

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

    --/|Output

      --+|[i][&spllvl][&lvlsuffix]-Level [*R:spellschool][/i]
      --+|[br]
	  --+Casting Time:|[*R:spellcastingtime]
      --+Range:|[*R:spellrange]
      --+Components:|[&Verbal][&Somatic][&Components] [&Materials]
	  --+Duration:|[&Concentration]&nbsp;[*R:spellduration]
      --+|[br]
      --+|[*R:spelldescription]
      --?"[*R:spellathigherlevels]" -ne ""|[
        --+&nbsp;&nbsp;&nbsp;&nbsp;[i]At Higher Levels:[/i]|[*R:spellathigherlevels]
      --]|
      --+|[br]
      --+|[c][b]At what level is the spell being cast?[/b][/c]
      --+|[c][rbutton]2nd::DoSpell;2[/rbutton][rbutton]3rd::DoSpell;3[/rbutton][rbutton]4th::DoSpell;4[/rbutton][rbutton]5th::DoSpell;5[/rbutton][rbutton]6th::DoSpell;6[/rbutton][rbutton]7th::DoSpell;7[/rbutton][rbutton]8th::DoSpell;8[/rbutton][rbutton]9th::DoSpell;9[/rbutton][/c]
      --+|[br]

  --X|

  --:DoSpell|
    --#whisper|self
    --=SlotLevel|[&reentryval]
    --=SlotsTotal|0
    --=SlotsExpended|[*S:lvl[$SlotLevel]_slots_expended]
    --?[$SlotsExpended.Raw] -eq [$SlotsTotal.Raw]|[
      --+|[br]
      --+|[c][b][*S:character_name] has no level [$SlotLevel.Total] spell slots available.[/b][/c]
    --]|[
      --=SlotsLeft|[$SlotsExpended] - 1
      --!a:[*S:character_id]|lvl[$SlotLevel]_slots_expended:[$SlotsLeft]
      --+|[c][b]What type of Beast are you summoning?[/b][/c]
      --+|[c][b][rbutton]Land::Beast;Land[/rbutton][rbutton]Air::Beast;Air[/rbutton][rbutton]Water::Beast;Water[/rbutton][/b][/c]
    --]|
  --X|

  --:Beast|
    --&BeastType|[&reentryval]
    --c[&BeastType]|Land:&Type;1|Air:&Type;2|Water:&Type;3
    --c[&BeastType]|Land:&hplvl;30|Air:&hplvl;20|Water:&hplvl;30
    --c[&BeastType]|Land:&Speed;30 ft., climb 30 ft.|Air:&Speed;30 ft., fly 60 ft.|Water:&Speed;30 ft., swim 30 ft.
    --=ACCalc|11 + [$SlotLevel]
    --=hptotal|5 * [= [$SlotLevel] - 2] + [&hplvl]
    --=AttNum|[$SlotLevel] /2 {FLOOR}
	--!a:[&SummonBeast]|!npc_name:[&BeastType] Beast|!npc_ac:[$ACCalc]|!hp:[$hptotal]|!hp^:[$hptotal]|!npc_speed:[&Speed]|!pb:@{selected|pb}
    --Rfirst|[&SummonBeast];repeating_npctrait
    --?"[&BeastType]" -inc "Air"|[
      --!a:[&SummonBeast]|![*R>name]:Flyby|![*R>description]:The beast doesn’t provoke opportunity attacks when it flies out of an enemy’s reach.
    --]|[
      --!a:[&SummonBeast]|[*R>name]:Pack Tactics|[*R>description]:The beast has advantage on an attack roll against a creature if at least one of the beast’s allies is within 5 feet of the creature and the ally isn’t incapacitated.
    --]|
    --Rnext|
    --?"[&BeastType]" -inc "Water"|[
      --!a:[&SummonBeast]|[*R>name]:Water Breathing|[*R>description]:The beast can breathe only underwater.
    --]|[
      --!a:[&SummonBeast]|[*R>name]:|[*R>description]:
    --]|
    --+|[c][b]Level [$SlotLevel] Slots Left: [$SlotsLeft][/b][/c]
    --Rfirst|[&SummonBeast];repeating_npcaction
    --?"[&BeastType]" -inc "Air"|[
      --!a:[&SummonBeast]|[*R>description]:|attack_damage:1d8 + 4 + [$SlotLevel]|attack_onhit:1d8 + 4 + [$SlotLevel]
    --]|[
      --!a:[&SummonBeast]|[*R>description]:The beast has advantage on an attack roll against a creature if at least one of the beast’s allies is within 5 feet of the creature and the ally isn’t incapacitated.|attack_damage:1d8 + 4 + [$SlotLevel]|attack_onhit:1d8 + 4 + [$SlotLevel]
    --]|
      --Rnext|
        --!a:[&SummonBeast]|[*R>description]:The beast makes [$AttNum] attack per round(half the spell's level rounded down).
        --@token-mod| _ids @(selected|token_id} _set statusmarkers|[&StatusMarker]
        --@forselected|Spawn _name|SummonBeast _offset|1,0 _side|[&Type] _size|1 _expand|5,50 _tokenProps|has_bright_light_vision:1,has_night_vision:1,night_vision_distance:60,night_vision_effect:Nocturnal
  --X|

  --:NoCharacter|
    --+|[b]Please make sure to create an NPC character named SummonBeast, then rerun the script.[/b]
  --X|

}}