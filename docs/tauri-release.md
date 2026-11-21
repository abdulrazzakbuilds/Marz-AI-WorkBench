# Release process

Marz AI Workbench release builds use the scripts at the repository root:

- Windows: `npm run build:win`
- macOS: `npm run build:mac`

The scripts create signed installer artifacts when the required local signing credentials are configured. Keep release keys and `.env` files out of Git.

Automatic in-app updates are disabled. Before enabling them, configure a project-owned signing key, updater endpoint, and release feed in `src-tauri/tauri.conf.json` and `src/renderer/src/hooks/useCheckForUpdates.ts`.
