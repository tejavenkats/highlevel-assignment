<script setup lang="ts">
import { computed } from "vue";
import { useWorkflowStore } from "@/stores/workflow";
import type { TransformNodeConfig } from "@/types";

const workflowStore = useWorkflowStore();

const selectedNode = computed(() => workflowStore.selectedNode);
const startMessage = computed(
  () => (selectedNode.value?.data.config as { message: string } | undefined)?.message
);
const transformConfig = computed(
  () => selectedNode.value?.data.config as TransformNodeConfig | undefined
);

function updateText(field: string, event: Event) {
  const target = event.target as HTMLInputElement | HTMLTextAreaElement;
  workflowStore.updateSelectedNodeConfig({ [field]: target.value });
}

function updateNumber(field: string, event: Event) {
  const target = event.target as HTMLInputElement;
  workflowStore.updateSelectedNodeConfig({ [field]: Number(target.value) });
}
</script>

<template>
  <aside class="panel config-panel">
    <div class="panel-header">
      <p class="eyebrow">Configuration</p>
      <h2>Selected node settings</h2>
    </div>

    <template v-if="selectedNode">
      <div class="config-block">
        <p class="config-title">{{ selectedNode.data.title }}</p>
        <p class="config-caption">{{ selectedNode.data.summary }}</p>
      </div>

      <label
        v-if="selectedNode.data.kind === 'start'"
        class="field"
      >
        <span class="field-label">Message payload</span>
        <textarea
          class="field-input field-textarea"
          rows="4"
          :value="startMessage"
          @input="updateText('message', $event)"
        />
      </label>

      <template v-if="selectedNode.data.kind === 'transform'">
        <label class="field">
          <span class="field-label">Transform mode</span>
          <select
            class="field-input"
            :value="transformConfig?.mode"
            @change="updateText('mode', $event)"
          >
            <option value="uppercase">Uppercase</option>
            <option value="append">Append text</option>
            <option value="multiply">Multiply number</option>
          </select>
        </label>

        <label class="field">
          <span class="field-label">Append text</span>
          <input
            class="field-input"
            type="text"
            :disabled="transformConfig?.mode !== 'append'"
            :value="transformConfig?.appendText"
            @input="updateText('appendText', $event)"
          />
        </label>

        <label class="field">
          <span class="field-label">Multiplier</span>
          <input
            class="field-input"
            type="number"
            min="1"
            :disabled="transformConfig?.mode !== 'multiply'"
            :value="transformConfig?.multiplier"
            @input="updateNumber('multiplier', $event)"
          />
        </label>
      </template>

      <p
        v-if="selectedNode.data.kind === 'end'"
        class="config-note"
      >
        The End Node displays the final payload produced by the simulation.
      </p>

      <button
        class="ghost-button danger-button"
        @click="workflowStore.deleteSelectedNode()"
      >
        Delete selected node
      </button>
    </template>

    <p
      v-else
      class="empty-state"
    >
      Click a node in the canvas to edit its configuration.
    </p>
  </aside>
</template>
