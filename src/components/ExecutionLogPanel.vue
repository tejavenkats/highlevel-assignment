<script setup lang="ts">
import { computed } from "vue";
import { useWorkflowStore } from "@/stores/workflow";

const workflowStore = useWorkflowStore();

const statusText = computed(() => {
  if (workflowStore.lastRunStatus === "success") {
    return "Last run succeeded";
  }

  if (workflowStore.lastRunStatus === "error") {
    return "Last run failed";
  }

  return "Ready to run";
});
</script>

<template>
  <section class="panel log-panel">
    <div class="panel-header panel-header--row">
      <div>
        <p class="eyebrow">Execution logs</p>
        <h2>{{ statusText }}</h2>
      </div>

      <button
        class="ghost-button"
        @click="workflowStore.runSimulation()"
      >
        Run workflow
      </button>
    </div>

    <ol class="log-list">
      <li
        v-for="line in workflowStore.logs"
        :key="line"
      >
        {{ line }}
      </li>
    </ol>
  </section>
</template>
