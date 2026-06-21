# Changelog

## 1.0.0

Initial GitHub release.

### Added

- Syntax highlighting for Roll20 ScriptCards files.
- Support for `.scard`, `.scard.txt`, `.scriptcard`, and `.scriptcards`.
- Modern ScriptCards syntax coverage for arrays, hash tables, object references, pointer commands, handout commands, GOSUB/GOTO labels, loops, and `--~` function statements.
- Narrow `.scard.txt` support without claiming all `.txt` files.
- Dark-theme-focused token colors and scopes.

### Notes

- This release is tuned for dark VS Code themes.
- Light themes are not officially supported in this initial release.
- Exact colors may vary between dark themes because VS Code themes control final TextMate token rendering.
