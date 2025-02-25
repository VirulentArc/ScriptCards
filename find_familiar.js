!scriptcards {{ 

  --/|Script Name : Find Familiar
  --/|Version     : v2.1.0
  --/|Author      : Timothy Beasley
  --/|API MODs    : ScriptCards, SpawnDefaultToken, SelectManager(I suggest installing MetaScriptToolbox to get SelectManager)

  --/|Description : This script on first run creates a Rollable Token Table and writes stats to the FindFamiliar character
  --/|              On all subsequent runs it will cast the spell which will ask if the spell is being cast as a Ritual or not;
  --/|              ask if the Familiar being summoned is a Celecstial, Fey, or Fiend; and will finally ask which Familiar
  --/|              you are summoning. It will then Spawn the token beside the Summoner.
  --/|
  --/|Instructions: First create a new NPC character and call it FindFamiliar. The name is case sensative with no spaces.
  --/|              Secondly, run the script for the first time.
  --/|              Next go to your Rollable Tables and click on "token" of the FindFamiliar table. 
  --/|              Link the token to the FindFamiliar character.
  --/|              All of the subsequent runs of the script will then just cast the spell.

  --:DoFormatting|
    --#overridetemplate|mydnd
    --&FindFamiliar|@{FindFamiliar|character_id}
    --#sourceToken|@{selected|token_id}
    --&SoundEffectTrack|
    --&SpellLevel|1
    --&SpellName|Find Familiar
    --#Debug|0

  --\|Token Image Variables
    --&BatToken|https://s3.amazonaws.com/files.d20.io/images/407846117/a4ZJKr0ySyLpeDUmM1FGsw/original.png?17252959945
    --&CatToken|https://s3.amazonaws.com/files.d20.io/images/407846114/yY73RMgm6_BCLaNg2rxBzQ/original.png?17252959945
    --&CrabToken|https://s3.amazonaws.com/files.d20.io/images/407846115/T0Rit7tcKGuc4SNVemTqKA/original.png?17252959945
    --&FrogToken|https://s3.amazonaws.com/files.d20.io/images/407846109/-ucSpgR6y7RVeYmRiWgkEg/original.png?17252959945
    --&HawkToken|https://s3.amazonaws.com/files.d20.io/images/407846111/Zz5F5aLNGYDV-xRvSV0YfA/original.png?17252959945
    --&LizardToken|https://s3.amazonaws.com/files.d20.io/images/407846118/Kz43LZmtfCe_GFS6eS9uQg/original.png?17252959945
    --&OctopusToken|https://s3.amazonaws.com/files.d20.io/images/407846110/DIhTiq0_8EKqt_67ST9GYg/original.png?17252959945
    --&OwlToken|https://s3.amazonaws.com/files.d20.io/images/407846113/Thqe3vXwntNMdFeAms5zYQ/original.png?17252959945
    --&SnakeToken|https://s3.amazonaws.com/files.d20.io/images/407855134/bk8CwwNUm8rkReiyEBqJgQ/original.png?17253000535
    --&QuipperToken|https://s3.amazonaws.com/files.d20.io/images/407846108/FHRYjGLbhUYoth-8OP490g/original.png?17252959945
    --&RatToken|https://s3.amazonaws.com/files.d20.io/images/407846107/Uby34hjIEFwETxKo3gXzCA/original.png?17252959945
    --&RavenToken|https://s3.amazonaws.com/files.d20.io/images/407846112/8Bt_Off5cwk0xEfUlkcRyw/original.png?17252959945
    --&SeaHorseToken|https://s3.amazonaws.com/files.d20.io/images/407846104/PaAX9a0fqWOAGSey_WtiOQ/original.png?17252959945
    --&SpiderToken|https://s3.amazonaws.com/files.d20.io/images/407846105/ww3DHHb5YLDZo6qyFdLQsw/original.png?17252959945
    --&WeaselToken|https://s3.amazonaws.com/files.d20.io/images/407846106/JvvrVk9bNm4zG7QcrKzZuA/original.png?17252959945

  --:DoesCharacterExist|
    --?"@{FindFamiliar|charactersheet_type}" -neq "npc"|NoCharacter|IsFirstRun
  --X|

--X|

  --:IsFirstRun|
    --=DoesExist|[T#FindFamiliar]
    --&FFText|[$DoesExist.tableEntryText]
    --?"[&FFText]" -eq "0"|MakeTable|SpellInfo
  --X|

  --:MakeTable|
    --+|[b]Creating Rollable Token Table for First Run[/b]
    --!o#:tableid|FindFamiliar
	--+New Table ID|[&tableid]
	--!oe:entryid|[&tableid];Bat
    --!tableitem:[&entryid]|avatar:[&BatToken]
    --+New Entry ID|[&entryid]
	--!oe:entryid|[&tableid];Cat
    --!tableitem:[&entryid]|avatar:[&CatToken]
	--+New Entry ID|[&entryid]
	--!oe:entryid|[&tableid];Crab
    --!tableitem:[&entryid]|avatar:[&CrabToken]
    --+New Entry ID|[&entryid]
	--!oe:entryid|[&tableid];Frog
    --!tableitem:[&entryid]|avatar:[&FrogToken]
    --+New Entry ID|[&entryid]
	--!oe:entryid|[&tableid];Hawk
    --!tableitem:[&entryid]|avatar:[&HawkToken]
	--+New Entry ID|[&entryid]
	--!oe:entryid|[&tableid];Lizard
    --!tableitem:[&entryid]|avatar:[&LizardToken]
    --+New Entry ID|[&entryid]
	--!oe:entryid|[&tableid];Octopus
    --!tableitem:[&entryid]|avatar:[&OctopusToken]
	--+New Entry ID|[&entryid]
	--!oe:entryid|[&tableid];Owl
    --!tableitem:[&entryid]|avatar:[&OwlToken]
	--+New Entry ID|[&entryid]
	--!oe:entryid|[&tableid];Poisonous Snake
    --!tableitem:[&entryid]|avatar:[&SnakeToken]
	--+New Entry ID|[&entryid]
	--!oe:entryid|[&tableid];Quipper
    --!tableitem:[&entryid]|avatar:[&QuipperToken]
	--+New Entry ID|[&entryid]
	--!oe:entryid|[&tableid];Rat
    --!tableitem:[&entryid]|avatar:[&RatToken]
	--+New Entry ID|[&entryid]
	--!oe:entryid|[&tableid];Raven
    --!tableitem:[&entryid]|avatar:[&RavenToken]
    --+New Entry ID|[&entryid]
	--!oe:entryid|[&tableid];Sea Horse
    --!tableitem:[&entryid]|avatar:[&SeaHorseToken]
    --+New Entry ID|[&entryid]
	--!oe:entryid|[&tableid];Spider
    --!tableitem:[&entryid]|avatar:[&SpiderToken]
    --+New Entry ID|[&entryid]
	--!oe:entryid|[&tableid];Weasel
    --!tableitem:[&entryid]|avatar:[&WeaselToken]
    --+New Entry ID|[&entryid]
    --+|[br][b]The Multi-sided token (rollable table) FindFamiliar has been created. Now link your token to your character sheet, setting bar information.[/b]
    --!or:[&FindFamiliar]:npcaction|name:Bite|attack_flag:on|attack_type:melee|attack_target:one target|attack_range:5 ft.|attack_tohit:1|attack_damage:1|attack_damagetype:piercing|attack_tohitrange:+5, Reach 5ft., one target|attack_onhit:1 (1d4 + 3) piercing damage|attack_crit:1d4
    --!or:[&FindFamiliar]:npcaction|name:Ink Cloud|attack_flag:off|description:(Recharges after a Short or Long Rest). A 5-foot-radius cloud of ink extends all around the octopus if it is underwater. The area is heavily obscured for 1 minute, although a significant current can disperse the ink. After releasing the ink, the octopus can use the Dash action as a bonus action.
    --!or:[&FindFamiliar]:npctrait|name:Temp|description:Temp
    --!or:[&FindFamiliar]:npctrait|name:Temp1|description:Temp1
    --!or:[&FindFamiliar]:npctrait|name:Temp2|description:Temp2
    --&obrac|{
    --&cbrac|}
    --&perc|%
    --!ob:AbilID:[&FindFamiliar]:Bite:y|[&perc][&obrac]FindFamiliar|repeating_npcaction_$0_npc_action[&cbrac]
    --!ob:AbilID2:[&FindFamiliar]:Ink Cloud:y|@[&obrac]FindFamiliar|wtype[&cbrac]&[&obrac]template:npcaction[&cbrac] @[&obrac]FindFamiliar|npc_name_flag[&cbrac] [&obrac][&obrac]rname=Ink Cloud[&cbrac][&cbrac] [&obrac][&obrac]description=(Recharges after a Short or Long Rest). A 5-foot-radius cloud of ink extends all around the octopus if it is underwater. The area is heavily obscured for 1 minute, although a significant current can disperse the ink. After releasing the ink, the octopus can use the Dash action as a bonus action.[&cbrac][&cbrac] @[&obrac]FindFamiliar|charname_output[&cbrac]
    --!a:[&FindFamiliar]|!tableid:[&tableid]
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

      --+|[i][&spllvl][&lvlsuffix]-Level [*R:spellschool][/i][r][rbutton]⚙️::Settings[/rbutton][/r]
      --+|[br]
	  --+Casting Time:|[*R:spellcastingtime]
      --+Range:|[*R:spellrange]
      --+Components:|[&Verbal][&Somatic][&Components] [&Materials]
	  --+Duration:|[&Concentration]&nbsp;[*R:spellduration]
      --+|[br]
      --+|[t width=100% title="[&SpellDesc([$SpellDescCalc.Raw],[&SpellDesc(length)])]"][tr][td][&SpellDesc(0,[$SpellDescCalc.Raw])]...[/td][/tr][/t]
      --?"[*R:spellathigherlevels]" -ne ""|[
        --+&nbsp;&nbsp;&nbsp;&nbsp;[i]At Higher Levels:[/i]|[*R:spellathigherlevels]
      --]|
      --+|[br]
      --+|[c][b]Is this spell being cast as a Ritual?[/b][/c]
      --+|[br]
      --+|[c][b][rbutton]Yes::WhatBeast[/rbutton][rbutton]No::WhatSpellSlot;0[/rbutton][/b][/c]
      --+|[br]

  --X|

  --:WhatSpellSlot|
    --#Whisper|self
    --+At what level is the spell being cast?|
    --+|[c][rbutton]1::WhatLVL;1[/rbutton][rbutton]2::WhatLVL;2[/rbutton][rbutton]3::WhatLVL;3[/rbutton][rbutton]4::WhatLVL;4[/rbutton][rbutton]5::WhatLVL;5[/rbutton][rbutton]6::WhatLVL;6[/rbutton][rbutton]7::WhatLVL;7[/rbutton][rbutton]8::WhatLVL;8[/rbutton][rbutton]9::WhatLVL;9[/rbutton][/c]
  --X|

  --:WhatLVL|
    --=SlotLevel|[&reentryval]
    --=SlotsTotal|0
    --=SlotsExpended|[*S:lvl[$SlotLevel]_slots_expended]
    --?[$SlotsExpended.Raw] -eq [$SlotsTotal.Raw]|[
      --+|[*S:character_name] has no level [$SlotLevel.Total] spell slots available.
    --]|[
      --=SlotsLeft|[$SlotsExpended] - 1
      --!a:[*S:character_id]|lvl[$SlotLevel]_slots_expended:[$SlotsLeft]
      -->WhatBeast|
    --]|
  --X|

  --:WhatBeast|
    --#Whisper|self
    --+|[c][b]What type of Familiar are you summoning?[/b][/c]
    --+|[br]
    --+|[c][b][rbutton]Celestial::GetFamiliar;Celestial[/rbutton][rbutton]Fey::GetFamiliar;Fey[/rbutton][rbutton]Fiend::GetFamiliar;Fiend[/rbutton][/c][/b]
    --+|[br]
  --X|

  --:GetFamiliar|
    --+|What Familiar Are You Summoning?
    --#whisper|self
    --~|array;fromtable;FamiliarToken;FindFamiliar;both
    --&TokensPerRow|3
    --&TokenCounter|1
    --&AllTokens|[c][t width=90%][tr]
    --%TokenLoop|foreach;FamiliarToken
      --~TokenOutput|string;split;|;[&TokenLoop]
      --&AllTokens|+[td][img width=70 height=70][&TokenOutput2][/img][rbutton][&TokenOutput1]::Familiar;[&TokenOutput1][/rbutton][br][/td]
      --?[= [&TokenCounter] % [&TokensPerRow] ] -eq 0|&AllTokens;+[/tr][tr]
      -->IncrementCounter|TokenCounter
    --%|
    --&AllTokens|+[/tr][/t][/c]
    --+|[&AllTokens]
  --X|

  --:Familiar|
    --#whisper|self
    --&FamiliarType|[&reentryval]
    --c[&FamiliarType]|Bat:&TokenSide;1|Cat:&TokenSide;2|Crab:&TokenSide;3|Frog:&TokenSide;4|Hawk:&TokenSide;5|Lizard:&TokenSide;6|Octopus:&TokenSide;7|Owl:&TokenSide;8|Poisonous Snake:&TokenSide;9|Quipper:&TokenSide;10|Rat:&TokenSide;11|Raven:&TokenSide;12|Sea Horse:&TokenSide;13|Spider:&TokenSide;14|Weasel:&TokenSide;15
    --c[&FamiliarType]|Bat:&FamAC;12|Cat:&FamAC;12|Crab:&FamAC;11|Frog:&FamAC;11|Hawk:&FamAC;13|Lizard:&FamAC;10|Octopus:&FamAC;12|Owl:&FamAC;11|Poisonous Snake:&FamAC;13|Quipper:&FamAC;13|Rat:&FamAC;10|Raven:&FamAC;12|Sea Horse:&FamAC;11|Spider:&FamAC;12|Weasel:&FamAC;13
    --c[&FamiliarType]|Bat:&ACType;|Cat:&ACType;|Crab:&ACType;Natural Armor|Frog:&ACType;|Hawk:&ACType;|Lizard:&ACType;|Octopus:&ACType;|Owl:&ACType;|Poisonous Snake:&ACType;|Quipper:&ACType;|Rat:&ACType;|Raven:&ACType;|Sea Horse:&ACType;|Spider:&ACType;|Weasel:&ACType;
    --c[&FamiliarType]|Bat:&HP;1|Cat:&HP;2|Crab:&HP;2|Frog:&HP;1|Hawk:&HP;1|Lizard:&HP;2|Octopus:&HP;3|Owl:&HP;1|Poisonous Snake:&HP;2|Quipper:&HP;1|Rat:&HP;1|Raven:&HP;1|Sea Horse:&HP;1|Spider:&HP;1|Weasel:&HP;1
    --c[&FamiliarType]|Bat:&HPMax;1|Cat:&HPMax;2|Crab:&HPMax;2|Frog:&HPMax;1|Hawk:&HPMax;1|Lizard:&HPMax;2|Octopus:&HPMax;3|Owl:&HPMax;1|Poisonous Snake:&HPMax;2|Quipper:&HPMax;1|Rat:&HPMax;1|Raven:&HPMax;1|Sea Horse:&HPMax;1|Spider:&HPMax;1|Weasel:&HPMax;1
    --c[&FamiliarType]|Bat:&HPForm;1d4 - 1|Cat:&HPForm;1d4|Crab:&HPForm;1d4|Frog:&HPForm;1d4 - 1|Hawk:&HPForm;1d4 - 1|Lizard:&HPForm;1d4|Octopus:&HPForm;1d6|Owl:&HPForm;1d4 - 1|Poisonous Snake:&HPForm;1d4|Quipper:&HPForm;1d4 - 1|Rat:&HPForm;1d4 - 1|Raven:&HPForm;1d4 - 1|Sea Horse:&HPForm;1d4 - 1|Spider:&HPForm;1d4 - 1|Weasel:&HPForm;1d4 - 1
    --c[&FamiliarType]|Bat:&STR;2|Cat:&STR;3|Crab:&STR;2|Frog:&STR;1|Hawk:&STR;5|Lizard:&STR;2|Octopus:&STR;4|Owl:&STR;3|Poisonous Snake:&STR;2|Quipper:&STR;2|Rat:&STR;2|Raven:&STR;2|Sea Horse:&STR;1|Spider:&STR;2|Weasel:&STR;3
    --c[&FamiliarType]|Bat:&DEX;15|Cat:&DEX;15|Crab:&DEX;11|Frog:&DEX;13|Hawk:&DEX;16|Lizard:&DEX;11|Octopus:&DEX;15|Owl:&DEX;13|Poisonous Snake:&DEX;16|Quipper:&DEX;16|Rat:&DEX;11|Raven:&DEX;14|Sea Horse:&DEX;12|Spider:&DEX;14|Weasel:&DEX;16
    --c[&FamiliarType]|Bat:&CON;8|Cat:&CON;10|Crab:&CON;10|Frog:&CON;8|Hawk:&CON;8|Lizard:&CON;10|Octopus:&CON;11|Owl:&CON;8|Poisonous Snake:&CON;11|Quipper:&CON;9|Rat:&CON;9|Raven:&CON;8|Sea Horse:&CON;8|Spider:&CON;8|Weasel:&CON;8
    --c[&FamiliarType]|Bat:&INT;2|Cat:&INT;3|Crab:&INT;1|Frog:&INT;1|Hawk:&INT;2|Lizard:&INT;1|Octopus:&INT;3|Owl:&INT;2|Poisonous Snake:&INT;1|Quipper:&INT;1|Rat:&INT;2|Raven:&INT;2|Sea Horse:&INT;1|Spider:&INT;1|Weasel:&INT;2
    --c[&FamiliarType]|Bat:&WIS;12|Cat:&WIS;12|Crab:&WIS;8|Frog:&WIS;8|Hawk:&WIS;14|Lizard:&WIS;8|Octopus:&WIS;10|Owl:&WIS;12|Poisonous Snake:&WIS;10|Quipper:&WIS;7|Rat:&WIS;10|Raven:&WIS;12|Sea Horse:&WIS;10|Spider:&WIS;10|Weasel:&WIS;12
    --c[&FamiliarType]|Bat:&CHA;4|Cat:&CHA;7|Crab:&CHA;2|Frog:&CHA;3|Hawk:&CHA;6|Lizard:&CHA;3|Octopus:&CHA;4|Owl:&CHA;7|Poisonous Snake:&CHA;3|Quipper:&CHA;2|Rat:&CHA;4|Raven:&CHA;6|Sea Horse:&CHA;2|Spider:&CHA;2|Weasel:&CHA;3
    --c[&FamiliarType]|Bat:&Speed;5 ft., fly 30 ft.|Cat:&Speed;40 ft., climb 30 ft.|Crab:&Speed;20 ft., swim 20 ft.|Frog:&Speed;20 ft., swim 20 ft.|Hawk:&Speed;10 ft., fly 60 ft.|Lizard:&Speed;20 ft., climb 20 ft.|Octopus:&Speed;5 ft., swim 30 ft.|Owl:&Speed;5 ft., fly 60 ft.|Poisonous Snake:&Speed;30 ft., swim 30 ft.|Quipper:&Speed;0 ft., swim 30 ft.|Rat:&Speed;20 ft.|Raven:&Speed;10 ft., fly 50 ft.|Sea Horse:&Speed;0 ft., swim 20 ft.|Spider:&Speed;20 ft., climb 20 ft.|Weasel:&Speed;30 ft.
    --c[&FamiliarType]|Bat:&INIT;2|Cat:&INIT;2|Crab:&INIT;2|Frog:&INIT;1|Hawk:&INIT;3|Lizard:&INIT;0|Octopus:&INIT;2|Owl:&INIT;1|Poisonous Snake:&INIT;3|Quipper:&INIT;3|Rat:&INIT;0|Raven:&INIT;2|Sea Horse:&INIT;1|Spider:&INIT;2|Weasel:&INIT;3
    --c[&FamiliarType]|Bat:&Senses;blindsight 60 ft., Passive Perception 11|Cat:&Senses;Passive Perception 13|Crab:&Senses;blindsight 30 ft., Passive Perception 9|Frog:&Senses;Darkvision 30 ft., Passive Perception 11|Hawk:&Senses;Passive Perception 14|Lizard:&Senses;Passive Perception 9|Octopus:&Senses;Darkvision 30 ft., Passive Perception 12|Owl:&Senses;Darkvision 120 ft., Passive Perception 13|Poisonous Snake:&Senses;blindsight 10 ft., Passive Perception 10|Quipper:&Senses;Darkvision 60 ft., Passive Perception 8|Rat:&Senses;darkvision 30 ft., Passive Perception 10|Raven:&Senses;Passive Perception 13|Sea Horse:&Senses;Passive Perception 10|Spider:&Senses;Darkvision 30 ft., Passive Perception 10|Weasel:&Senses;Passive Perception 13
    --c[&FamiliarType]|Bat:&NightDistance;60|Cat:&NightDistance;0|Crab:&NightDistance;30|Frog:&NightDistance;30|Hawk:&NightDistance;0|Lizard:&NightDistance;0|Octopus:&NightDistance;30|Owl:&NightDistance;120|Poisonous Snake:&NightDistance;10|Quipper:&NightDistance;60|Rat:&NightDistance;30|Raven:&NightDistance;0|Sea Horse:&NightDistance;0|Spider:&NightDistance;30|Weasel:&NightDistance;0
    --c[&FamiliarType]|Bat:&TraitOne;Echolocation|Cat:&TraitOne;Keen Smell|Crab:&TraitOne;Amphibious|Frog:&TraitOne;Amphibious|Hawk:&TraitOne;Keen Sight|Lizard:&TraitOne;|Octopus:&TraitOne;Hold Breath|Owl:&TraitOne;Flyby|Poisonous Snake:&TraitOne;|Quipper:&TraitOne;Blood Frenzy|Rat:&TraitOne;Keen Smell|Raven:&TraitOne;Mimicry|Sea Horse:&TraitOne;Water Breathing|Spider:&TraitOne;Spider Climb|Weasel:&TraitOne;Keen Hearing and Smell
    --c[&FamiliarType]|Bat:&TraitOneDesc;The bat can't use its blindsight while deafened.|Cat:&TraitOneDesc;The cat has advantage on Wisdom (Perception) checks that rely on smell.|Crab:&TraitOneDesc;The crab can breathe air and water.|Frog:&TraitOneDesc;The frog can breathe air and water.|Hawk:&TraitOneDesc;The hawk has advantage on Wisdom (Perception) checks that rely on sight.|Lizard:&TraitOneDesc;|Octopus:&TraitOneDesc;While out of water, the octopus can hold its breath for 30 minutes.|Owl:&TraitOneDesc;The owl doesn't provoke opportunity attacks when it flies out of an enemy's reach.|Poisonous Snake:&TraitOneDesc;|Quipper:&TraitOneDesc;The quipper has advantage on melee attack rolls against any creature that doesn't have all its hit points.|Rat:&TraitOneDesc;The rat has advantage on Wisdom (Perception) checks that rely on smell.|Raven:&TraitOneDesc;The raven can mimic simple sounds it has heard, such as a person whispering, a baby crying, or an animal chittering. A creature that hears the sounds can tell they are imitations with a successful DC 10 Wisdom (Insight) check.|Sea Horse:&TraitOneDesc;The sea horse can breathe only underwater.|Spider:&TraitOneDesc;The spider can climb difficult surfaces, including upside down on ceilings, without needing to make an ability check.|Weasel:&TraitOneDesc;The weasel has advantage on Wisdom (Perception) checks that rely on hearing or smell.
    --c[&FamiliarType]|Bat:&TraitTwo;Keen Hearing|Cat:&TraitTwo;|Crab:&TraitTwo;|Frog:&TraitTwo;Standing Leap|Hawk:&TraitTwo;|Lizard:&TraitTwo;|Octopus:&TraitTwo;Underwater Camouflage|Owl:&TraitTwo;Keen Hearing and Sight|Poisonous Snake:&TraitTwo;|Quipper:&TraitTwo;Water Breathing|Rat:&TraitTwo;|Raven:&TraitTwo;|Sea Horse:&TraitTwo;|Spider:&TraitTwo;Web Sense|Weasel:&TraitTwo;
    --c[&FamiliarType]|Bat:&TraitTwoDesc;The bat has advantage on Wisdom (Perception) checks that rely on hearing.|Cat:&TraitTwoDesc;|Crab:&TraitTwoDesc;|Frog:&TraitTwoDesc;The frog's long jump is up to 10 feet and its high jump is up to 5 feet, with or without a running start.|Hawk:&TraitTwoDesc;|Lizard:&TraitTwoDesc;|Octopus:&TraitTwoDesc;The octopus has advantage on Dexterity (Stealth) checks made while underwater.|Owl:&TraitTwoDesc;The owl has advantage on Wisdom (Perception) checks that rely on hearing or sight.|Poisonous Snake:&TraitTwoDesc;|Quipper:&TraitTwoDesc;The quipper can breathe only underwater.|Rat:&TraitTwoDesc;|Raven:&TraitTwoDesc;|Sea Horse:&TraitTwoDesc;|Spider:&TraitTwoDesc;While in contact with a web, the spider knows the exact location of any other creature in contact with the same web.|Weasel:&TraitTwoDesc;
    --c[&FamiliarType]|Bat:&TraitThree;|Cat:&TraitThree;|Crab:&TraitThree;|Frog:&TraitThree;|Hawk:&TraitThree;|Lizard:&TraitThree;|Octopus:&TraitThree;Water Breathing|Owl:&TraitThree;|Poisonous Snake:&TraitThree;|Quipper:&TraitThree;|Rat:&TraitThree;|Raven:&TraitThree;|Sea Horse:&TraitThree;|Spider:&TraitThree;Web Walker|Weasel:&TraitThree;
    --c[&FamiliarType]|Bat:&TraitThreeDesc;|Cat:&TraitThreeDesc;|Crab:&TraitThreeDesc;|Frog:&TraitThreeDesc;|Hawk:&TraitThreeDesc;|Lizard:&TraitThreeDesc;|Octopus:&TraitThreeDesc;The octopus can breathe only underwater.|Owl:&TraitThreeDesc;|Poisonous Snake:&TraitThreeDesc;|Quipper:&TraitThreeDesc;|Rat:&TraitThreeDesc;|Raven:&TraitThreeDesc;|Sea Horse:&TraitThreeDesc;|Spider:&TraitThreeDesc;The spider ignores movement restrictions caused by webbing.|Weasel:&TraitThreeDesc;
    --c[&FamiliarType]|Bat:&AttackOne;Bite|Cat:&AttackOne;Claws|Crab:&AttackOne;Claw|Frog:&AttackOne;|Hawk:&AttackOne;Talons|Lizard:&AttackOne;Bite|Octopus:&AttackOne;Tentacles|Owl:&AttackOne;Talons|Poisonous Snake:&AttackOne;Bite|Quipper:&AttackOne;Bite|Rat:&AttackOne;Bite|Raven:&AttackOne;Beak|Sea Horse:&AttackOne;|Spider:&AttackOne;Bite|Weasel:&AttackOne;Bite
    --c[&FamiliarType]|Bat:&ToHitOne;+0|Cat:&ToHitOne;+0|Crab:&ToHitOne;+0|Frog:&ToHitOne;|Hawk:&ToHitOne;+5|Lizard:&ToHitOne;+0|Octopus:&ToHitOne;+4|Owl:&ToHitOne;+3|Poisonous Snake:&ToHitOne;+5|Quipper:&ToHitOne;+5|Rat:&ToHitOne;+0|Raven:&ToHitOne;+4|Sea Horse:&ToHitOne;|Spider:&ToHitOne;+4|Weasel:&ToHitOne;+5
    --?";Cat;Crab;Frog;Octopus;Owl;Spider;Weasel;" -inc ";[&FamiliarType];"|&StealthFlag;2|&StealthFlag;
    --c[&FamiliarType]|Bat:&StealthBase;|Cat:&StealthBase;+4|Crab:&StealthBase;+2|Frog:&StealthBase;+3|Hawk:&StealthBase;|Lizard:&StealthBase;|Octopus:&StealthBase;+4|Owl:&StealthBase;+3|Poisonous Snake:&StealthBase;|Quipper:&StealthBase;|Rat:&StealthBase;|Raven:&StealthBase;|Sea Horse:&StealthBase;|Spider:&StealthBase;+4|Weasel:&StealthBase;+5
    --c[&FamiliarType]|Bat:&Stealth;|Cat:&Stealth;4|Crab:&Stealth;2|Frog:&Stealth;3|Hawk:&Stealth;|Lizard:&Stealth;|Octopus:&Stealth;4|Owl:&Stealth;3|Poisonous Snake:&Stealth;|Quipper:&Stealth;|Rat:&Stealth;|Raven:&Stealth;|Sea Horse:&Stealth;|Spider:&Stealth;4|Weasel:&Stealth;5
    --?";Cat;Frog;Octopus;Hawk;Owl;Weasel;" -inc ";[&FamiliarType];"|&PercFlag;1
    --c[&FamiliarType]|Bat:&PercBase;|Cat:&PercBase;+3|Crab:&PercBase;|Frog:&PercBase;+1|Hawk:&PercBase;+4|Lizard:&PercBase;|Octopus:&PercBase;+2|Owl:&PercBase;+3|Poisonous Snake:&PercBase;|Quipper:&PercBase;|Rat:&PercBase;|Raven:&PercBase;+3|Sea Horse:&PercBase;|Spider:&PercBase;|Weasel:&PercBase;+3
    --c[&FamiliarType]|Bat:&Perc;|Cat:&Perc;3|Crab:&Perc;|Frog:&Perc;1|Hawk:&Perc;4|Lizard:&Perc;|Octopus:&Perc;2|Owl:&Perc;3|Poisonous Snake:&Perc;|Quipper:&Perc;|Rat:&Perc;|Raven:&Perc;3|Sea Horse:&Perc;|Spider:&Perc;|Weasel:&Perc;3
    --?"[&FamiliarType]" -inc "Poisonous Snake"|&Challenge;1/8|&Challenge;0
    --?"[&FamiliarType]" -inc "Poisonous Snake"|&XP;25|&XP;10
    --?";Lizard;Rat;" -inc ";[&FamiliarType];"|&AC;10
    --?";Crab;Frog;Owl;Sea Horse;" -inc ";[&FamiliarType];"|&AC;11
    --?";Bat;Cat;Octopus;Raven;Spider;" -inc ";[&FamiliarType];"|&AC;12
    --?";Poisonous Snake;Quipper;Weasel;Hawk;" -inc ";[&FamiliarType];"|&AC;13
    --?";Frog;Sea Horse;" -inc ";[&FamiliarType];"|[
      --&AttackOneFlag|off
      --&AttackOneType|
      --&AttackOneTarget|
      --&AttackOneRange|
      --&DamageOne|
      --&DamageOneType|
      --&OnHitOne|
    --]|[
      --&AttackOneFlag|on
      --&AttackOneType|Melee
      --&AttackOneTarget|one target
      --&AttackOneRange|5 Ft.
      --&DamageOne|1
      --&OnHitOne|1
    --]|
    --?";Bat;Lizard;Poisonous Snake;Quipper;Rat;Raven;Spider;Weasel;" -inc ";[&FamiliarType];"|&DamageOneType;piercing
    --?";Cat;Hawk;Owl;" -inc ";[&FamiliarType];"|&DamageOneType;slashing
    --?";Octopus;Crab;" -inc ";[&FamiliarType];"|&DamageOneType;bludgeoning
    --?"[&FamiliarType]" -inc "Poisonous Snake"|&AttackOneDesc;The target must make a DC 10 Constitution saving throw, taking 5 (2d4) poison damage on a failed save, or half as much damage on a successful one.
    --?"[&FamiliarType]" -inc "Poisonous Snake"|&DamageOneTwo;2d4
    --?"[&FamiliarType]" -inc "Poisonous Snake"|&DamageOneTypeTwo;Poison|&DamageOneTypeTwo;
    --?"[&FamiliarType]" -inc "Spider"|&AttackOneDesc;The target must succeed on a DC 9 Constitution saving throw or take 2 (1d4) poison damage.
    --?"[&FamiliarType]" -inc "Spider"|&DamageOneTwo;1d4
    --?"[&FamiliarType]" -inc "Spider"|&DamageOneTypeTwo;Poison
    --?"[&FamiliarType]" -inc "Octopus"|[
      --&FamSize|Small
      --&AttackTwo|Ink Cloud
      --&AttackOneDesc|(Recharges after a Short or Long Rest). The target is grappled (escape DC 10). Until this grapple ends, the octopus can't use its tentacles on another target.
      --&AttackTwoDesc|A 5-foot-radius cloud of ink extends all around the octopus if it is underwater. The area is heavily obscured for 1 minute, although a significant current can disperse the ink. After releasing the ink, the octopus can use the Dash action as a bonus action.
    --]|[
      --&FamSize|Tiny
      --&AttackTwo|
      --&AttackTwoDesc|
    --]|

    --!a:[&FindFamiliar]|!npc_name:[&FamiliarType]|!npc_type:[&FamSize] [&Realm], Unaligned|!npc_ac:[&AC]|!npc_actype:[&ACType]|!hp:[&HP]|!hp^:[&HPMax]|!npc_hpformula:[&HPForm]|!strength_base:[&STR]|!dexterity_base:[&DEX]|!constitution_base:[&CON]|!intelligence_base:[&INT]|!wisdom_base:[&WIS]|!charisma_base:[&CHA]|!npc_speed:[&Speed]|!initiative_bonus:[&INIT]|!npc_challenge:[&Challenge]|!npc_xp:[&XP]|!npc_senses:[&Senses]|!pb:2|!npc_stealth_base:[&StealthBase]|!npc_stealth_flag:[&StealthFlag]|!npc_stealth:[&Stealth]|!npc_perception_base:[&PercBase]|!npc_perception_flag:[&PercFlag]|!npc_perception:[&Perc]

    --Rfirst|[&FindFamiliar];repeating_npctrait
      --!a:[&FindFamiliar]|[*R>name]:[&TraitOne]|[*R>description]:[&TraitOneDesc]
        --Rnext|
          --!a:[&FindFamiliar]|[*R>name]:[&TraitTwo]|[*R>description]:[&TraitTwoDesc]
            --Rnext|
              --!a:[&FindFamiliar]|[*R>name]:[&TraitThree]|[*R>description]:[&TraitThreeDesc]

    --Rfirst|[&FindFamiliar];repeating_npcaction

      --~|array;objects:ability;AbilityArr;[*R:name];[&FindFamiliar]

      --!ability:[@AbilityArr(0)]|name:[&AttackOne]|istokenaction:True

      --!a:[&FindFamiliar]|[*R>name]:[&AttackOne]|[*R>attack_flag]:[&AttackOneFlag]|[*R>attack_type]:[&AttackOneType]|[*R>attack_target]:[&AttackOneTarget]|[R>attack_range]:[&AttackOneRange]|[*R>attack_tohit]:[&ToHitOne]|[*R>attack_damage]:[&DamageOne]|[*R>attack_damage2]:[&DamageOneTwo]|[*R>attack_damagetype]:[&DamageOneType]|[*R>attack_damagetype2]:[&DamageOneTypeTwo]|[*R>attack_tohitrange]:|[*R>attack_onhit]:[&OnHitOne]|[*R>attack_onhit2]:[&OnHitOneTwo]|[*R>description]:[&AttackOneDesc]

        --Rnext|

          --~|array;objects:ability;AbilArr;Ink Cloud;[&FindFamiliar]

          --?"[&FamiliarType]" -inc "Octopus"|[
            --!ability:[@AbilArr(0)]|istokenaction:True
          --]|[
            --!ability:[@AbilArr(0)]|istokenaction:False
          --]|
	
          --!a:[&FindFamiliar]|[*R>name]:[&AttackTwo]|[*R>attack_flag]:off|[*R>description]:[&AttackTwoDesc]

    --@forselected|Spawn _name|FindFamiliar _offset|1,0 _side|[&TokenSide] _size|1 _expand|5,50 _tokenProps|has_bright_light_vision:1,has_night_vision:1,night_vision_distance:[&NightDistance],night_vision_effect:Nocturnal

    --?"[&FamiliarType]" -inc "Poisonous Snake"|&DisplayName;Snake|&DisplayName;[&FamiliarType]
    --~NameReplace|string;replaceall; ;;[&DisplayName]

    --?[$SlotLevel] -ge 1|[
      --#whisper|
      --&EndMessage|[b][*S:character_name] casts [&SpellName] and summons a [&FamiliarType].[/b][c][img width=200][&[&NameReplace]Token][/img][/c]
      --&EndMessage|+[c]Level [$SlotLevel] Slots Left: [$SlotsLeft][/c]
    --]|[
      --#whisper|
      --&EndMessage|[b][*S:character_name] takes 10 minutes to cast [&SpellName] as a ritual and summons a [&FamiliarType].[/b][c][img width=200][&[&NameReplace]Token][/img][/c]
    --]|
    --+|[br]
    --+|[&EndMessage]
  --X|

  --:NoCharacter|
    --+|[b]Please make sure to create an NPC character named Findfamiliar, then rerun the script.[/b]
  --X|

  --:Settings|
    --#whisper|self
    --+|[b]Here you can change the tokens of the familiars to tokens of your own. The image for the token must be in your roll20 library. Have the URL of the image ready. [br]Click on the familiar you'd like to change and then follow the prompts in the chat window.[/b]
    --#whisper|self
    --~|array;fromtable;FamiliarToken;FindFamiliar;both
    --&TokensPerRow|3
    --&TokenCounter|1
    --&AllTokens|[c][t width=90%][tr]
    --%TokenLoop|foreach;FamiliarToken
      --~TokenOutput|string;split;|;[&TokenLoop]
      --&AllTokens|+[td][img width=70 height=70][&TokenOutput2][/img][rbutton][&TokenOutput1]::UpdateToken;[&TokenOutput1][/rbutton][br][/td]
      --?[= [&TokenCounter] % [&TokensPerRow] ] -eq 0|&AllTokens;+[/tr][tr]
      -->IncrementCounter|TokenCounter
    --%|
    --&AllTokens|+[/tr][/t][/c]
    --+|[&AllTokens]
  --X|

  --:UpdateToken|
    --&TableName|Findfamiliar
    --&TableItemName|[&reentryval]
  
    -->GetTableIDByName|[&TableName];TableID
    -->GetTableItemIDFromTable|[&TableName];[&TableItemName];ItemID
    --IClick to add your own Token, the image must be from your roll20 libary;Click Here|q;TokenURL;What Is The URL To Your Token Image?
    --!tableitem:[&ItemID]|avatar:[&TokenURL]
    --+|[c][b]You have replaced the [&TableItemName] Token with one your own.[/b][/c]
  --X|

  --:GetTableItemIDFromTable|TableName;ItemName;ReturnStringVarName
    -->GetTableIDByName|[%1%];_gtiiftTblID
    --?"[&_gtiiftTblID]" -eq "NotFound"|&[%3%];NotFound
    --?"[%3%]" -eq "NotFound"|_gtiiftEND
    --~|array;objects:tableitem;_gtiiftItemArr;[%2%]
    --?[@_gtiiftItemArr(length)] -eq 0|_gtiiftNOITEMERROR
    --~|array;define;_gtiiftFilteredArr
    --%_gtiiftItemID|foreach;_gtiiftItemArr
        --?"[*O:[&_gtiiftItemID]:tableitem:_rollabletableid]" -ne "[&_gtiiftTblID]"|_gtiiftLOOPEND
        --~|array;add;_gtiiftFilteredArr;[&_gtiiftItemID]
        --:_gtiiftLOOPEND|
    --%|
    --?[@_gtiiftFilteredArr(length)] -ne 1|_gtiiftFILTERERROR
    --&[%3%]|[@_gtiiftFilteredArr(0)]
    --^_gtiiftEND|

    --:_gtiiftFILTERERROR|
    --&[%3%]|NotFound
    --\|SC GetTableItemIDFromTable ERROR:tableitem [%2%] and table [%1%] returned [@_gtiiftFilteredArr(length)]. Expected 1
    --^_gtiiftEND|

    --:_gtiiftNOITEMERROR|
    --&[%3%]|NotFound
    --\|SC GetTableItemIDFromTable ERROR:tableitem [%2%] returned 0 values
    --:_gtiiftEND|
  --<|

  --:GetTableIDByName|TableName;ReturnStringVarName
    --~|array;objects:rollabletable;_gtibnArr;[%1%]
    --?[@_gtibnArr(length)] -ne 1|_gtibnERROR
    --&[%2%]|[@_gtibnArr(0)]
    --^_gtibnEND|
    --:_gtibnERROR|
    --&[%2%]|NotFound
    --\|SC GetTableIDByName ERROR:rollabletable [%1%] returned [@_gtibnArr(length)] values. Expected 1
    --:_gtibnEND|
  --<|  --X|

  --:IncrementCounter|
    --&[%1%]|[= [&[%1%]] + 1]
  --<|

}}