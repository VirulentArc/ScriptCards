!Scriptcard {{ 

  --#overridetemplate|spellbook
  --#sourceToken|@{selected|character_id}
  --&tok|@{selected|token_id}
  --#diceFontColor|#611b1c
  --#Whisper|self
  --#debug|0

  --Rfind|[*S:character_id];Channel Divinity: Twilight Sanctuary;repeating_traits;name
  --#title|[*R:name]
  --&obrac|{
  --&cbrac|}

  --:Begin|
  --+|[t width=240px style="text-align: center ;"][tr][td title="[*R:description]" style="display: inline-block ; position: relative ; top: 20px ; height: 40px ; text-align: center ; font-size: 14px ;"][sheetbutton]Description::@{selected|character_name}::[*R>output][/sheetbutton]|[/td][td style="display: inline-block ; position: relative ; top: 20px ; height: 40px ; text-align: center ; font-size: 14px ;"][rbutton]Roll HP::RollTwilight[/rbutton]|[/td][td style="display: inline-block ; position: relative ; top: 20px ; height: 40px ; text-align: center ; font-size: 14px ;"][rbutton]Aura ON/OFF::Aura[/rbutton][/td][/tr][/t]
  
--X|

--:RollTwilight|
  --#Whisper|
  --=TwilightRoll|1d6
  --&RollOutput|[c][t width=100%][tr][td style="display: inline-block ; position: relative ; top: 30px ; height: 20px ; text-align: center ; font-size: 22px ;"][d6][$TwilightRoll.Raw][/d6][/td][/tr]
  --&RollOutput|+[tr][td style="display: inline-block ; position: relative ; top: 45px ; height: 40px ; text-align: center ; font-size: 16px ; font-weight: bold ; color: #000 ;"]+&nbsp;WIS&nbsp;([*S:caster_level])[/td][/tr]
  --=RollTotal|[$TwilightRoll] + [*S:caster_level]
  --&RollOutput|+[tr][td style="display: inline-block ; position: relative ; top: 40px ; height: 40px ; text-align: center ; font-size: 22px ; font-weight: bold ; color: #000 ;"]Total[/td][/tr]
  --&RollOutput|+[tr][td style="display: inline-block ; position: relative ; top: 30px ; height: 40px ; text-align: center ; font-size: 32px ; font-weight: bold ;"][$RollTotal.Raw][/td][/tr][/t][/c]
  --+|[&RollOutput]
  --!a:[*S:character_id]|hp_temp:[$RollTotal]
--X|

--:Aura|
  --#Whisper|self
  --?"[*[&tok]:t-aura1_radius]" -ne 30|[
	--!t:[&tok]|aura1_radius:30
    --!t:[&tok]|aura1_color:#4a86e8
    --!t:[&tok]|emits_low_light:1
    --!t:[&tok]|low_light_distance:30
  --]|[
    --!t:[&tok]|aura1_radius:0
    --!t:[&tok]|emits_low_light:0
    --!t:[&tok]|low_light_distance:0
  --]|
--X|

}}