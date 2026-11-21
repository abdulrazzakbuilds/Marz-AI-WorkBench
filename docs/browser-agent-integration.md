# Browser Agent integration

## Upstream architecture researched

[Browser Use Web UI](https://github.com/browser-use/web-ui) is an MIT-licensed
Python/Gradio application built around the `browser-use` agent library. Its UI
separates model setup, browser setup, task execution, and saved settings. A
manager owns the active agent, browser, browser context, task, and conversation
history. The Playwright browser context supplies page state and screenshots;
callbacks publish step results. The task view supports pause, stop, user-help
prompts, history export, and persistent browser sessions. LLM adapters are
provided through its LangChain integration.

## Marz integration

Marz keeps one task workflow and one browser session. The new Browser Agent
panel calls the existing provider adapter and the selected native Tauri child
WebView:

1. The user selects an existing Marz browser tab and writes a research brief.
2. The agent inspects a bounded page snapshot containing readable text and up
   to 80 visible controls, then selects a small browser action.
3. Marz logs each inspection and action. Clicks, text entry, and navigation are
   reviewed by default; password and hidden fields are excluded on both
   inspection and action. Potentially sensitive and cross-site actions still
   pause when routine action review is turned off.
4. The agent can ask the user for help, pause, stop, and finish with cited
   sources. The run remains in memory unless the user explicitly exports it.
5. The user can send the result and source URLs to Project Agent. That handoff
   stays local and is sent to the configured model only when a project task is
   started.

The central integration is the existing selected WebView, not a second
Playwright browser. This keeps the signed-in browser session, browser tabs, and
research-to-project handoff inside the workbench. Browser control is implemented
as bounded Rust commands with serialized arguments; the model cannot submit
arbitrary JavaScript. Navigation is limited to HTTP(S), user text is limited to
visible non-password fields, and stale element references are rejected.

## Difference from upstream

Marz uses the upstream task lifecycle and browser-agent workflow as an
architecture reference, but does not package the Python/Gradio or Playwright
runtime. Marz currently exposes OpenAI-compatible model endpoints and a DOM
view rather than Browser Use's full provider adapter set and screenshot-based
perception. It operates one selected Marz tab, does not manage separate browser
profiles, and records its run as a user-exported JSON trace rather than
persisting task history automatically.

The upstream project is MIT licensed. No upstream source code is copied into
Marz; this integration ports workflow ideas to the native Rust/Tauri and React
architecture.
