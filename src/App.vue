<script setup lang="ts">
import { computed, onMounted, watch } from "vue";
import { useWorkflowStore } from "@/stores/workflow";
import PalettePanel from "@/components/PalettePanel.vue";
import CanvasBoard from "@/components/CanvasBoard.vue";
import ConfigPanel from "@/components/ConfigPanel.vue";
import ExecutionLogPanel from "@/components/ExecutionLogPanel.vue";

const workflowStore = useWorkflowStore();

const importDraft = computed({
  get: () => workflowStore.importDraft,
  set: (value: string) => workflowStore.loadImportDraft(value)
});

const exportPayload = computed(() => workflowStore.serializedWorkflow);

function copyExport() {
  navigator.clipboard
    .writeText(exportPayload.value)
    .then(() => {
      workflowStore.logs = ["Copied the workflow JSON to the clipboard."];
    })
    .catch(() => {
      workflowStore.logs = [
        "Clipboard access was blocked. Copy the JSON manually from the export panel."
      ];
    });
}

onMounted(() => {
  workflowStore.bootstrap();
});

watch(
  () => workflowStore.persistedWorkflow,
  () => {
    workflowStore.persist();
  }
);
</script>

<template>
  <div class="app-shell">
    <header class="hero">
      <div>
        <p class="eyebrow">Conversation AI Frontend Assignment</p>
        <h1>Flow-based workflow builder</h1>
        <p class="hero-copy">
          Build, connect, configure, export, import, and simulate a lightweight
          n8n-style workflow.
        </p>
      </div>

      <div class="hero-actions">
        <button
          class="primary-button"
          @click="workflowStore.runSimulation()"
        >
          Run workflow
        </button>
        <button
          class="ghost-button"
          @click="workflowStore.seedStarterFlow()"
        >
          Reset starter flow
        </button>
        <button
          class="ghost-button"
          @click="workflowStore.clearCanvas()"
        >
          Clear canvas
        </button>
      </div>
    </header>

    <main class="workspace-grid">
      <PalettePanel />
      <CanvasBoard />
      <ConfigPanel />
    </main>

    <section class="import-export-grid">
      <section class="panel import-panel">
        <div class="panel-header panel-header--row">
          <div>
            <p class="eyebrow">Save workflow</p>
            <h2>Export JSON</h2>
          </div>

          <button
            class="ghost-button"
            @click="copyExport"
          >
            Copy JSON
          </button>
        </div>

        <textarea
          class="field-input code-block"
          readonly
          rows="10"
          :value="exportPayload"
        />
      </section>

      <section class="panel import-panel">
        <div class="panel-header panel-header--row">
          <div>
            <p class="eyebrow">Restore workflow</p>
            <h2>Import JSON</h2>
          </div>

          <button
            class="ghost-button"
            @click="workflowStore.importWorkflow()"
          >
            Import
          </button>
        </div>

        <textarea
          v-model="importDraft"
          class="field-input code-block"
          rows="10"
          placeholder="Paste exported workflow JSON here"
        />
      </section>
    </section>

    <ExecutionLogPanel />
  </div>
</template>
