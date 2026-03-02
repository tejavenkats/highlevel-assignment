<script setup lang="ts">
import type { PaletteItem } from "@/types";

const paletteItems: PaletteItem[] = [
  {
    kind: "start",
    title: "Start Node",
    description: "Define the initial message payload."
  },
  {
    kind: "transform",
    title: "Transform Node",
    description: "Uppercase, append text, or multiply."
  },
  {
    kind: "end",
    title: "End Node",
    description: "Display the final message payload."
  }
];

function onDragStart(event: DragEvent, kind: PaletteItem["kind"]) {
  if (!event.dataTransfer) {
    return;
  }

  event.dataTransfer.setData("application/workflow-node", kind);
  event.dataTransfer.effectAllowed = "move";
}
</script>

<template>
  <aside class="panel palette-panel">
    <div class="panel-header">
      <p class="eyebrow">Palette</p>
      <h2>Drag nodes into the canvas</h2>
    </div>

    <ul class="palette-list">
      <li
        v-for="item in paletteItems"
        :key="item.kind"
      >
        <button
          class="palette-card"
          draggable="true"
          @dragstart="onDragStart($event, item.kind)"
        >
          <span class="palette-card__title">{{ item.title }}</span>
          <span class="palette-card__description">{{ item.description }}</span>
        </button>
      </li>
    </ul>
  </aside>
</template>
