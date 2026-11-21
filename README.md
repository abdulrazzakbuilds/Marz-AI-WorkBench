# Marz AI Workbench

Marz AI Workbench is a desktop workbench for turning ideas into finished work and durable understanding. Developers can plan a change, work through implementation steps, use AI and command-line tools, then record what they verified. Students can turn a subject into a sequence of learning steps, practice recall, and keep their own review notes.

Its aim is to make AI useful inside a real workflow: keep the goal, the next action, the work surface, and the verification or learning outcome together. The app combines AI services, a coding editor, terminals, and a local project board instead of treating chat as the end product.

## What you can do

- Work across ChatGPT, Gemini, Claude, DeepSeek, Grok, Perplexity, and other supported AI services.
- Draft a prompt once and send it to one or several AI services.
- Open **Mission Control** to create build or study missions with an outcome, checkpoints, and progress tracking.
- Turn a checkpoint into a contextual engineering or learning prompt in the editor; keep project notes and study takeaways with the mission.
- Use the **Project Agent** in Mission Control with a local Ollama endpoint or any OpenAI-compatible API provider. The agent can inspect a chosen project and propose complete file updates; each write requires your approval.
- Follow a practical loop: **define → plan → build or practice → verify or teach back**.
- Use the built-in prompt kit for code explanation, debugging, code review, study notes, quizzes, and essay outlines.
- Write and compare code in up to five split Monaco editor panes with syntax highlighting.
- Run command-line tools such as Claude Code, Gemini CLI, and Codex CLI in integrated terminal tabs.
- Save prompt history, configure reusable snippets, reorder tabs, and switch between dark and light themes.

Mission data and non-secret agent endpoint/model settings are saved locally in this app's browser storage on the current device. API keys stay in memory for the current session and are sent only to the endpoint you configure. When you ask the agent to inspect a project, selected file contents are sent to that provider. Review provider privacy terms before using a cloud endpoint. The agent is limited to the selected project folder, skips hidden and generated folders, caps file reads, and requires approval before writing a proposed file. It does not execute shell commands automatically.

## Connect a model

Open Mission Control → **Project Agent**. Enter an OpenAI-compatible API base URL, model ID, and (for hosted services) an API key. For a local Ollama model, start Ollama and use `http://localhost:11434/v1` with the model name you have installed. Other compatible servers can be configured with their documented base URL and model ID. The agent supports the Chat Completions tool-call format; provider support and available models vary.

The integration follows the [OpenAI function-calling tool flow](https://developers.openai.com/api/docs/guides/function-calling). Ollama documents its compatible endpoint at [localhost:11434/v1](https://docs.ollama.com/api/openai-compatibility); supported API features depend on the model and server.

Select a project folder and describe the task. The agent can list and read project files, then prepare complete-file proposals. Inspect each proposal and select **Approve and write** to apply it. Builds, tests, and shell commands remain under your control.

## Download for Windows

Download the latest Windows `.exe` or installer from [GitHub Releases](https://github.com/abdulrazzakbuilds/Marz-AI-WorkBench/releases). The `.exe` is a direct app build; the installer is attached to the same release. Windows WebView2 is required. These downloads are not Authenticode-signed, so Windows may show an unknown-publisher prompt.

Pushing a version tag such as `v0.2.0` runs the Windows release workflow. It runs the Rust tests, type-checks and builds the Tauri application, checks the executable format, and runs a startup smoke check before attaching the `.exe` and generated MSI to the GitHub release. Automatic updates remain off until a Marz signing key and update feed are configured. Startup panics are recorded in the system temporary folder as `marz-ai-workbench-panic.log` to help diagnose failures.

For a portable build from source, follow the instructions below.

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
