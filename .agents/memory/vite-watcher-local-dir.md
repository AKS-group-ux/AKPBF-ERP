---
name: Vite watcher floods from .local/
description: Vite's file watcher picks up .local/ agent state files, causing HMR page-reload floods every 3 seconds.
---

# Vite watcher floods .local/ agent state files

## The rule
Always exclude `.local/`, `.git/`, `node_modules/`, `dist/` from Vite's watch config. The config MUST go inside `createViteServer()` in `server.ts`, not only in `vite.config.ts`.

**Why:** This project runs Vite as middleware via `createViteServer()` in `server.ts`. When inline `server:{}` options are passed to `createViteServer()`, they override `vite.config.ts`. The Replit agent continuously writes to `.local/state/replit/agent/.latest.json` and `.local/state/workflow-logs/...` — Vite sees these as file changes and sends `full-reload` to all HMR clients, causing the page to reload every 3 seconds. This aborts all in-flight fetch requests (which serialize to `{}` in console), floods the server with repeated API calls, and makes the app unusable.

**How to apply:** In `server.ts`, inside `createViteServer({server: { ... }})`, always include:
```js
watch: {
  ignored: ['**/.local/**', '**/.git/**', '**/node_modules/**', '**/dist/**'],
},
```
