# @shreyasdevadiga/pi-grok-style-tools

A [pi](https://pi.dev) extension that ports [Grok Build](https://github.com/xai-org) TUI look-and-feel into pi: GrokNight palette, braille spinner, ◆ verb-first tool rows, thinking chrome, rounded prompt box, pulsed accent rails, and OSC tab-title spinner.

Visual source of truth: grok-build (`xai-grok-pager` / `xai-grok-pager-render`). Extension scaffold patterns inspired by pi-claude-style-tools (API only — not Claude glyphs/verbs).

## Install

```bash
pi install /absolute/path/to/pi-grok-style-tools
```

Copy the theme (or symlink):

```bash
cp theme/grok-dark.json ~/.pi/agent/themes/
```

In `~/.pi/agent/settings.json`:

```json
{
  "theme": "grok-dark",
  "packages": [
    "../../Desktop/workspace/pi-grok-style-tools"
  ]
}
```

Do **not** load alongside `pi-claude-style-tools` (both patch `Loader.prototype`).

Then `/reload` in an interactive session.

## What you get

- GrokNight theme (`grok-dark`)
- Braille loader + **turn-status** row: `Thinking… 0.5s … 1m49s ⇣12k · Ctrl+C`
- Footer chrome: `Grok Build` · `always-approve` (from permission-system yolo) · shortcuts bar
- Tool rows: `◆ Read path`, `◆ Run cmd`, `◈` group folds, `┃` accent rails
- Thinking: `Thinking…` / `Thought for Ns`
- User lines: `❯ ` prefix
- Prompt editor: `╭─╮` box with `❯ `
- Pulsed accent on running tools/thinking
- Tab title: `⠋ Thinking - {cwd} - grok`

## Configuration

Useful settings in `.pi/settings.json` or `~/.pi/settings.json` (same keys as the Claude-style slim fork where applicable):

```json
{
  "toolBackground": "outlines",
  "previewLines": 8,
  "groupToolCalls": true,
  "themeAdaptive": true,
  "liveToolPreview": true
}
```

## Development

```bash
cd pi-grok-style-tools
npm install
npm run typecheck
```

## License

MIT
