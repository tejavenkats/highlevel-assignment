<script setup lang="ts">
import { computed, ref } from "vue";
import { VueFlow, useVueFlow } from "@vue-flow/core";
import { Background } from "@vue-flow/background";
import { Controls } from "@vue-flow/controls";
import { MiniMap } from "@vue-flow/minimap";
import type { Connection, Edge, NodeMouseEvent } from "@vue-flow/core";
import type { NodeDragEvent } from "@vue-flow/core/dist/types/hooks";
import { useWorkflowStore } from "@/stores/workflow";

const workflowStore = useWorkflowStore();
const boardRef = ref<HTMLDivElement | null>(null);

const { project, fitView } = useVueFlow({
  id: "workflow-builder"
});

const nodes = computed(() => workflowStore.nodes);
const edges = computed(() => workflowStore.edges as Edge[]);

function onDrop(event: DragEvent) {
  event.preventDefault();

  if (!boardRef.value || !event.dataTransfer) {
    return;
  }

  const kind = event.dataTransfer.getData("application/workflow-node");

  if (!kind) {
    return;
  }

  const bounds = boardRef.value.getBoundingClientRect();
  const position = project({
    x: event.clientX - bounds.left,
    y: event.clientY - bounds.top
  });

  workflowStore.addNode(kind as "start" | "transform" | "end", position);
}

function onDragOver(event: DragEvent) {
  event.preventDefault();

  if (event.dataTransfer) {
    event.dataTransfer.dropEffect = "move";
  }
}

function handleConnect(connection: Connection) {
  workflowStore.addConnection(connection);
}

function handleNodeDragStop(event: NodeDragEvent) {
  workflowStore.syncDraggedNodes(event.nodes);
}

function handleNodeClick(event: NodeMouseEvent) {
  event.event.stopPropagation();
  workflowStore.selectNode(event.node.id);
}

function handlePaneClick(event: MouseEvent) {
  const target = event.target as HTMLElement | null;

  if (target?.closest(".vue-flow__node")) {
    return;
  }

  workflowStore.selectNode(null);
}

function fitCanvas() {
  fitView({
    padding: 0.2
  });
}
</script>

<template>
  <section class="board-shell">
    <header class="board-toolbar">
      <div>
        <p class="eyebrow">Canvas</p>
        <h2>Workflow editor</h2>
      </div>

      <button
        class="ghost-button"
        @click="fitCanvas"
      >
        Fit view
      </button>
    </header>

    <div
      ref="boardRef"
      class="board-surface"
      @dragover="onDragOver"
      @drop="onDrop"
    >
      <VueFlow
        id="workflow-builder"
        :nodes="nodes"
        :edges="edges"
        class="workflow-flow"
        fit-view-on-init
        @connect="handleConnect"
        @node-drag-stop="handleNodeDragStop"
        @pane-click="handlePaneClick"
        @node-click="handleNodeClick"
      >
        <Background
          pattern-color="#c7d2fe"
          :gap="18"
          :size="1"
        />
        <MiniMap />
        <Controls />
      </VueFlow>
    </div>
  </section>
</template>
