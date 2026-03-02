# Conversation AI Workflow Builder

This project implements the frontend take-home assignment from the provided PDF: a simplified visual workflow builder inspired by n8n / Node-RED, built with Vue 3.

## Stack

- Vue 3 with the Composition API
- Vite for local development
- Pinia for state management
- Vue Flow for the drag-and-drop canvas, node positioning, and connections
- TypeScript for readable and explicit state models

## Features

- Left-side node palette with `Start`, `Transform`, and `End` nodes
- Drag-and-drop workflow canvas
- Right-side reactive configuration panel for the selected node
- Pinia-backed state for nodes, edges, positions, and configuration
- Workflow simulation with execution logs
- Export workflow as JSON
- Import workflow from JSON
- LocalStorage autosave and restore

## How to run

1. Install dependencies:

```bash
npm install
```

2. Start the dev server:

```bash
npm run dev
```

3. Build for production:

```bash
npm run build
```

## Project structure

- `src/App.vue`: overall page layout and import/export panels
- `src/components/PalettePanel.vue`: draggable node palette
- `src/components/CanvasBoard.vue`: Vue Flow canvas and interactions
- `src/components/ConfigPanel.vue`: node configuration editor
- `src/components/ExecutionLogPanel.vue`: workflow execution output
- `src/stores/workflow.ts`: core application state and actions
- `src/utils/workflowEngine.ts`: simulation logic and node defaults
- `src/types.ts`: shared domain types

## Notes

- The app seeds a starter flow on first load so the simulation can be run immediately.
- The `Transform` node supports uppercase, append, and multiply modes.
- For the `multiply` mode, the current payload must be numeric or convertible to a number.
