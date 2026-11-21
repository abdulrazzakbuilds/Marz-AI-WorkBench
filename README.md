# Marz AI Workbench

Marz AI Workbench is a desktop workspace for developers and students. It brings AI chat services, a coding editor, and command-line tools together so you can research, write, build, and study in one window.

## What you can do

- Work across ChatGPT, Gemini, Claude, DeepSeek, Grok, Perplexity, and other supported AI services.
- Draft a prompt once and send it to one or several AI services.
- Use the built-in prompt kit for code explanation, debugging, code review, study notes, quizzes, and essay outlines.
- Write and compare code in up to five split Monaco editor panes with syntax highlighting.
- Run command-line tools such as Claude Code, Gemini CLI, and Codex CLI in integrated terminal tabs.
- Save prompt history, configure reusable snippets, reorder tabs, and switch between dark and light themes.

## Run from source

Requirements: Node.js, Rust, and the platform dependencies for [Tauri 2](https://v2.tauri.app/start/prerequisites/).

```sh
npm install
npm run dev
```

To build the renderer and check TypeScript:

```sh
npm run typecheck
npm run build:renderer
```

Platform release scripts are included for Windows and macOS. Automatic updates are disabled until Marz AI Workbench has its own release signing key and release feed.

## About

- **Project:** Marz AI Workbench
- **Maintainer:** Mohammed AbdulRazzak ([abdulrazzakbuilds](https://github.com/abdulrazzakbuilds), abdulrazzakmohd01@gmail.com)
- **License:** MIT. See [LICENSE.txt](LICENSE.txt) for copyright notices and license terms.

Marz AI Workbench is an independent community project and is not affiliated with the AI service providers it can open.
