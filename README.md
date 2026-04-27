# Org Chart Studio

A Next.js web app for creating organization charts with local project storage.

## Features

- Tree-style organization chart editor.
- Each node includes editable `name` and `title` fields.
- Node controls via right-click context menu (or node `Menu` button):
  - Add node beneath
  - Duplicate node (including subtree)
  - Delete node
- Local multi-project management with a home screen.
- JSON import/export for one or many projects.
- Theme selector (Ocean, Forest, Sunset, Midnight).
- Print-friendly layout for `Print / Save PDF`.

## Run

```bash
pnpm install
pnpm dev
```

Open `http://localhost:3000`.

## JSON Import/Export Notes

- `Export Project` writes one project.
- `Export All` writes all local projects.
- `Import JSON` accepts:
  - A single exported project payload
  - An exported all-projects payload
  - An array of project objects

Imported projects are added to local storage and opened automatically.

## Project Structure

- `src/app`: Next.js App Router pages and styling.
- `src/lib`: Core org-chart logic and helpers.
- `src/lib/__tests__`: Unit tests.
- `src/app/__tests__`: Integration tests.

## Scripts

```bash
pnpm dev
pnpm lint
pnpm test
pnpm test:unit
pnpm test:integration
pnpm test:watch
pnpm build
pnpm start
```
