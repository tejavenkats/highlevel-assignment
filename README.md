# Conversation AI Workflow Builder

# highlevel-assignment

This project implements the frontend take-home assignment from the provided PDF: a simplified visual workflow builder inspired by n8n / Node-RED, built with Vue 3.

## Stack

- Vue 3 with the Composition API
- Vite for local development
- Pinia for state management
- Vue Flow for the drag-and-drop canvas, node positioning, and connections
- TypeScript for readable and explicit state models

## Basic functionality

- Left-side node palette with `Start`, `Transform`, and `End` nodes
- Drag-and-drop workflow canvas
- Right-side reactive configuration panel for the selected node
- Pinia-backed state for nodes, edges, positions, and configuration
- Workflow simulation with execution logs
- Export workflow as JSON
- Import workflow from JSON
- LocalStorage autosave and restore

## Steps to run locally

1. Install dependencies:

```bash
npm install
```

2. Start the local development server:

```bash
npm run dev
```

3. Open the Vite URL shown in the terminal, usually `http://localhost:5173`.

4. Build for production:

```bash
npm run build
```

5. (Optional) Preview the production build:

```bash
npm run preview
```

## State management and design

- The application uses a normalized Pinia store as the single source of truth for workflow state.
- The store keeps canonical graph records (`nodeOrder`, `nodesById`, `edgeOrder`, `edgesById`) instead of persisting full Vue Flow node objects.
- Vue Flow nodes and edges are derived from canonical state, which keeps the domain model separate from the rendering layer and scales better as the graph grows.
- Workflow simulation operates on the canonical graph snapshot, so execution logic is decoupled from the canvas library.
- The UI is intentionally split into palette, canvas, and configuration panels to keep interactions clear and extensible as more node types and settings are added.

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
