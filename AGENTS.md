# Marz AI Workbench contributor notes

Marz AI Workbench is a Tauri 2 desktop application with a React and TypeScript interface. It combines AI chat tabs, Monaco editors, and integrated command-line terminals.

## Development commands

- `npm run dev` starts the desktop app.
- `npm run lint` runs Biome.
- `npm run typecheck` checks the Node and renderer TypeScript projects.
- `npm run build:renderer` builds the frontend.
- `npm run build:win` and `npm run build:mac` prepare platform releases.

Keep signing credentials and `.env` files out of Git. Automatic updates remain disabled until a project-owned feed and signing key are configured.
