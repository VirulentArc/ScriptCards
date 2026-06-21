# ScriptCards Syntax Highlighting Plus

Syntax highlighting for Roll20 ScriptCards files in Visual Studio Code, VSCodium, and Code - OSS.

This extension is tuned for dark VS Code themes. Light themes are not officially supported in this initial release because several ScriptCards token groups can have poor contrast depending on the selected light theme. Colors may vary between dark themes because VS Code themes control final TextMate token rendering.

## Supported file extensions

- `.scard`
- `.scard.txt`
- `.scriptcard`
- `.scriptcards`

The extension does **not** claim all `.txt` files.

## Installation from GitHub

1. Download `scriptcards-syntax-highlighting-plus-1.0.0.vsix` from the latest GitHub release.
2. Open VS Code.
3. Open the Extensions panel.
4. Click the `...` menu.
5. Choose **Install from VSIX...**.
6. Select the downloaded `.vsix` file.
7. Reload VS Code if prompted.

## Command-line installation

```bash
code --install-extension scriptcards-syntax-highlighting-plus-1.0.0.vsix
```

For Code - OSS:

```bash
code-oss --install-extension scriptcards-syntax-highlighting-plus-1.0.0.vsix
```

For VSCodium:

```bash
codium --install-extension scriptcards-syntax-highlighting-plus-1.0.0.vsix
```

## Highlighting support

This extension includes highlighting support for common and modern ScriptCards syntax, including:

- statement prefixes such as `--#`, `--&`, `--=`, `--+`, `--?`, `--~`, `-->`, `--^`, `--%`, and `--h`
- GOSUB/GOTO labels
- loop names and loop types
- `--~` function statements
- arrays such as `[@ArrayName(index)]`
- roll variables such as `[$RollName.Raw]`
- string variables such as `[&VariableName]`
- hash table references such as `[:HashName("key")]`
- object references such as `[*O:objectid:character:archived]`
- handout/object modification commands such as `--!oh`, `--!h`, and `--!x`
- pointer commands such as `--Pread` and `--Pset`
- literal blocks such as `${ ... $}`

## Notes

This is a syntax-highlighting extension only. It does not run ScriptCards, validate ScriptCards logic, or communicate with Roll20.

## License

MIT
