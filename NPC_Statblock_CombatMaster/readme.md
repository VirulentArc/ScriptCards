# NPC Statblock Mod — Installer / CombatMaster Branch

This branch of **NPC Statblock Mod** packages the statblock script and its CombatMaster turn integration into a self-installing ScriptCard.

Instead of storing the full NPC Statblock code in a game macro, the installer creates a shared **`ScriptCards_Triggers`** character and writes the required abilities there. The game macro is reduced to a single ability call, while the installed turn trigger can automatically display the current NPC's statblock when CombatMaster announces its turn.

The installer can be run again at any time to update the installed abilities.

## Requirements

- Roll20 with Mod/API access
- **ScriptCards** installed and running
- **CombatMaster** if you want the automatic NPC statblock display on turns

## Installation

1. Run **`NPC_Statblock_Installer.scard`** once in your Roll20 game.

2. The installer will create a character named **`ScriptCards_Triggers`** if one does not already exist, then create or update these abilities on it:
   - **`NPC-Statblock`** — the main NPC Statblock script
   - **`chat:message:'s-Turn`** — the turn trigger used for CombatMaster integration

   **Do not delete the `ScriptCards_Triggers` character.**

3. Create a Roll20 **game macro** named:

   ```text
   NPC-Statblock
   ```

4. Set the macro's action to this single line:

   ```text
   %{ScriptCards_Triggers|NPC-Statblock}
   ```

5. Configure the game macro's visibility and Token Action setting however you want for your game.

6. **Restart the Mod sandbox once after installation.** ScriptCards registers `chat:message` triggers when the sandbox starts, so the restart is required for the CombatMaster turn trigger to become active.

7. Select an NPC token and run the **NPC-Statblock** macro.

## Updating

To update this branch, replace your installer with the newer version and run it again. The installer will update the existing abilities on **`ScriptCards_Triggers`**; you do not need to recreate the game macro.
