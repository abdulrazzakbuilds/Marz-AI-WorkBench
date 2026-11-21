# Mission Studio product plan

## Product aim

Reach the practical coding-agent baseline users expect: understand a real repo,
plan, edit multiple files, run project checks, show a diff, and recover a task.
Then make Marz distinct by connecting that work to the rest of its desktop
workbench and making every completed step carry reviewable proof.

## Why this direction

The current checklist and single-file project chat do not reach today's agent
workflow. The following open implementations set concrete expectations to
match:

- [OpenHands Software Agent SDK](https://github.com/OpenHands/software-agent-sdk)
  separates agents, tools, workspaces, conversations, and events. Marz should
  use similarly explicit boundaries so an AI provider is not coupled to the UI.
- [Archon](https://github.com/coleam00/archon) demonstrates approval gates,
  task dependencies, durable run state, and audit trails. Marz can apply these
  ideas to user-visible mission checkpoints and reviewed actions.
- [Continue codebase documentation awareness](https://github.com/continuedev/continue/blob/main/docs/guides/codebase-documentation-awareness.mdx)
  emphasizes project rules, scoped repository context, and traceable sources.
  Marz should show which files, instructions, or notes informed a proposed
  change.
- [Continue Agent mode](https://github.com/continuedev/continue/blob/main/docs/ide-extensions/agent/quick-start.mdx)
  separates read-only planning from tools that can edit and run commands.
- [Roo Code modes](https://github.com/RooCodeInc/Roo-Code-Docs/blob/main/docs/basic-usage/using-modes.md)
  make planning, coding, debugging, and orchestration distinct working modes.
- [Aider commands](https://github.com/Aider-AI/aider/blob/main/aider/website/docs/usage/commands.md)
  make repository maps, diffs, tests, lint, and undo part of the normal agent
  loop.
- [Browser Use](https://github.com/browser-use/browser-use) runs a model-driven
  browser agent against Chrome through Python and CDP. It confirms that browser
  actions can be real agent tools, but its browser runtime does not directly
  control this app's Tauri child WebViews.
- [Research Wiki](https://github.com/johapark/research-wiki) keeps local,
  portable research in Markdown and checks claims against source material. Its
  claim/source relationship is a useful pattern for research and study work.

These are design references. The plan is to implement a unified Marz workflow
using the existing Tauri and React application, not to copy or combine external
code wholesale.

## Integration choice

The first differentiating bridge is **Page-to-Project Context**: explicitly
capture the readable text, title, and URL from the selected embedded browser
tab, review which source is attached, then pass it to a project task. The user
can use documentation, an issue, or a reference page while asking the agent to
inspect a chosen repo. Preserve the source URL with the generated work so claims
can be checked. The capture remains in memory and is included only after the
user starts a task.

This uses the existing Tauri webview rather than pulling in Browser Use's
separate Python/Playwright browser runtime. The source-grounded research idea is
adapted from Research Wiki; no external repository code is copied into this
project. A future Browser Use connection should be an optional browser-agent
adapter only if it can safely operate the existing app's tabs or if a clear
separate-browser workflow is designed.

## Product concept: Proof-carrying workbench

Every agent run and learning sprint produces a durable evidence trail. A user
should be able to inspect the repository context, plan decisions, diffs,
terminal output, browser references, and open questions that support each
result. Marz's differentiator is connecting these artifacts across its editor,
terminal, and browser, then packaging them into a portable handoff. “Done” must
mean the evidence is inspectable, not just that the model said it finished.

### Developer missions

1. Select a project and state the intended outcome.
2. Build a project map: language/tooling, useful scripts, repository
   instructions, git state, and relevant files with context citations.
3. Switch between Ask, Plan, Code, and Debug modes with different tool access.
4. Make coordinated multi-file edits with reviewable diffs and targeted
   accept/reject, undo, and checkpoints.
5. Run the project's checks from the integrated terminal with clear permission
   gates and attach their actual output to the run.
6. Save a resumable journal and export a handoff with diffs, checks, sources,
   unresolved questions, and the next action.

### Student missions

1. State a topic and a measurable learning outcome.
2. Start with a short diagnostic question to find gaps.
3. Explain one concept at a time, then use retrieval practice before revealing
   worked answers.
4. Keep confidence, mistakes, and mastered ideas in a local review queue.
5. Create a compact study handout with concepts to revisit and a teach-back
   prompt.

### Shared workflow

`Brief → Plan → Work → Check evidence → Handoff`

Build and study missions use different actions but share mission storage,
checkpoints, notes, provider selection, activity history, and exportable
handoffs. A mission should remain useful without an AI provider: users can edit
the plan, record notes, and mark evidence manually.

## Architecture direction

- Build a typed agent runtime separate from React views: provider adapters,
  tool registry, run state machine, context selection, and artifact ledger.
- Support compatible local and hosted providers through capabilities
  negotiation; expose unavailable tool support clearly.
- Keep provider secrets in the OS credential store, not local storage.
- Enforce project-root scoping; show a proposed diff and ask before writes or
  terminal commands. Log approvals and command results.
- Store local run journals and evidence as versioned structured data with
  recovery/migrations. Keep project files as untrusted context.
- Define typed evidence records for selected context, files changed, patches,
  terminal commands/output, browser references, study attempts, and timestamps.
- Allow export as Markdown/JSON, with secrets stripped and workspace paths
  sanitized by default.

## Delivery sequence

### 1. Product and agent parity

Replace the weak file-proposal loop with repository-aware Ask/Plan/Code/Debug
modes, project maps, multi-file patches, actual terminal checks, visible diffs,
and recoverable work journals. The existing release does not yet provide this
parity; this is the engineering investment required.

### 2. Proof-carrying missions

Connect editor, browser, and terminal artifacts to the run. Provide a
reproducible report and a reviewable timeline so students and developers can
audit and resume the work. Include source references, actual check output,
decision notes, and open risks.

### 3. Study sprint and review loop

Add diagnostic recall, one-concept teaching steps, confidence-aware review,
spaced revisit dates, and an exportable handout that includes the student's
answers and the concepts they need to revisit.

### 4. Durable, shareable work

Add mission transfer/import and optional sharing only after privacy, secret
redaction, and conflict behavior are clear.

## Quality bar

- The next action is obvious without opening a chat panel.
- Users can see and edit the brief, plan, notes, and evidence.
- A local-only mission can be completed without configuring a provider.
- AI-written files and shell commands require explicit approval.
- Build and study missions both create a useful handoff.
- Layout works at the app's desktop window size and at narrow widths; motion
  respects `prefers-reduced-motion`.
- Automated checks and a Windows launch smoke test pass before publishing a
  release.

## First implementation slice

This iteration includes explicit active-page capture into a project task,
source title/URL in the task context, in-memory handling, and a visible notice
that page text is sent when the task starts. It also refreshes Mission Control's
visual system and adds a copyable mission handoff. Real repo maps, multi-file
edits, terminal approval, durable event journals, and spaced study review are
still roadmap work. Do not market the current single-file proposal agent as
parity with established coding agents.
