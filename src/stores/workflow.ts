import { defineStore } from "pinia";
import { Position } from "@vue-flow/core";
import type { Connection, Edge, XYPosition } from "@vue-flow/core";
import type {
  NodeKind,
  TransformNodeConfig,
  WorkflowEdge,
  WorkflowGraphEdge,
  WorkflowGraphNode,
  WorkflowNode,
  WorkflowNodeConfig,
  WorkflowSnapshot
} from "@/types";
import {
  buildNodeLabelFromParts,
  buildNodeSummaryFromParts,
  createNodeConfig,
  createNodeId,
  simulateWorkflow
} from "@/utils/workflowEngine";

const STORAGE_KEY = "conversation-ai-workflow";

function cloneNodeConfig(config: WorkflowNodeConfig): WorkflowNodeConfig {
  return { ...config };
}

function clampPosition(position: XYPosition): XYPosition {
  return {
    x: Math.max(position.x, 0),
    y: Math.max(position.y, 0)
  };
}

export function createWorkflowNode(
  kind: NodeKind,
  position: XYPosition
): WorkflowGraphNode {
  return {
    id: createNodeId(kind),
    kind,
    position: clampPosition(position),
    config: createNodeConfig(kind)
  };
}

function toFlowNode(node: WorkflowGraphNode): WorkflowNode {
  return {
    id: node.id,
    type: "default",
    position: { ...node.position },
    draggable: true,
    selectable: true,
    sourcePosition: Position.Right,
    targetPosition: Position.Left,
    data: {
      kind: node.kind,
      title: node.kind === "start"
        ? "Start Node"
        : node.kind === "transform"
          ? "Transform Node"
          : "End Node",
      summary: buildNodeSummaryFromParts(node.kind, node.config),
      label: buildNodeLabelFromParts(node.kind, node.config),
      config: cloneNodeConfig(node.config)
    }
  };
}

function toFlowEdge(edge: WorkflowGraphEdge): WorkflowEdge {
  return {
    ...edge
  };
}

function toGraphEdge(edge: Edge): WorkflowGraphEdge | null {
  if (!edge.source || !edge.target) {
    return null;
  }

  return {
    id: edge.id,
    source: edge.source,
    target: edge.target,
    sourceHandle: edge.sourceHandle ?? null,
    targetHandle: edge.targetHandle ?? null
  };
}

function isLegacyNode(node: WorkflowGraphNode | WorkflowNode): node is WorkflowNode {
  return "data" in node;
}

function normalizeNode(node: WorkflowGraphNode | WorkflowNode): WorkflowGraphNode {
  if (isLegacyNode(node)) {
    return {
      id: node.id,
      kind: node.data.kind,
      position: clampPosition(node.position),
      config: cloneNodeConfig(node.data.config)
    };
  }

  return {
    ...node,
    position: clampPosition(node.position),
    config: cloneNodeConfig(node.config)
  };
}

function normalizeEdge(edge: WorkflowGraphEdge | WorkflowEdge): WorkflowGraphEdge | null {
  if (!edge.source || !edge.target) {
    return null;
  }

  return {
    id: edge.id,
    source: edge.source,
    target: edge.target,
    sourceHandle: edge.sourceHandle ?? null,
    targetHandle: edge.targetHandle ?? null
  };
}

function buildSnapshot(
  nodeOrder: string[],
  nodesById: Record<string, WorkflowGraphNode>,
  edgeOrder: string[],
  edgesById: Record<string, WorkflowGraphEdge>
): WorkflowSnapshot {
  return {
    nodes: nodeOrder
      .map((id) => nodesById[id])
      .filter((node): node is WorkflowGraphNode => Boolean(node))
      .map((node) => ({
        ...node,
        position: { ...node.position },
        config: cloneNodeConfig(node.config)
      })),
    edges: edgeOrder
      .map((id) => edgesById[id])
      .filter((edge): edge is WorkflowGraphEdge => Boolean(edge))
      .map((edge) => ({
        ...edge
      }))
  };
}

function normalizeSnapshot(input: WorkflowSnapshot): WorkflowSnapshot {
  return {
    nodes: (input.nodes ?? []).map(normalizeNode),
    edges: (input.edges ?? [])
      .map(normalizeEdge)
      .filter((edge): edge is WorkflowGraphEdge => Boolean(edge))
  };
}

function createEdgeId(source: string, target: string): string {
  return `${source}-${target}`;
}

export const useWorkflowStore = defineStore("workflow", {
  state: () => ({
    nodeOrder: [] as string[],
    nodesById: {} as Record<string, WorkflowGraphNode>,
    edgeOrder: [] as string[],
    edgesById: {} as Record<string, WorkflowGraphEdge>,
    selectedNodeId: null as string | null,
    logs: [
      "Build the flow by dragging nodes from the palette.",
      "Connect Start -> Transform -> End, then run the simulation."
    ] as string[],
    importDraft: "",
    lastRunStatus: "idle" as "idle" | "success" | "error"
  }),
  getters: {
    snapshot(state): WorkflowSnapshot {
      return buildSnapshot(
        state.nodeOrder,
        state.nodesById,
        state.edgeOrder,
        state.edgesById
      );
    },
    nodes(): WorkflowNode[] {
      return this.snapshot.nodes.map(toFlowNode);
    },
    edges(): WorkflowEdge[] {
      return this.snapshot.edges.map(toFlowEdge);
    },
    selectedNode(): WorkflowNode | null {
      const selectedNode = this.selectedNodeId
        ? this.nodesById[this.selectedNodeId]
        : null;

      return selectedNode ? toFlowNode(selectedNode) : null;
    },
    serializedWorkflow(): string {
      return JSON.stringify(this.snapshot, null, 2);
    },
    persistedWorkflow(): string {
      return JSON.stringify(this.snapshot);
    }
  },
  actions: {
    applySnapshot(snapshot: WorkflowSnapshot) {
      const normalized = normalizeSnapshot(snapshot);

      this.nodeOrder = normalized.nodes.map((node) => node.id);
      this.nodesById = Object.fromEntries(
        normalized.nodes.map((node) => [node.id, node])
      );
      this.edgeOrder = normalized.edges.map((edge) => edge.id);
      this.edgesById = Object.fromEntries(
        normalized.edges.map((edge) => [edge.id, edge])
      );

      if (this.selectedNodeId && !this.nodesById[this.selectedNodeId]) {
        this.selectedNodeId = null;
      }
    },
    bootstrap() {
      const saved = localStorage.getItem(STORAGE_KEY);

      if (!saved) {
        this.seedStarterFlow();
        return;
      }

      try {
        const parsed = JSON.parse(saved) as WorkflowSnapshot;
        this.applySnapshot(parsed);
        this.logs = ["Restored the last saved workflow from localStorage."];
      } catch (error) {
        console.error(error);
        this.seedStarterFlow();
        this.logs = [
          "Saved workflow could not be restored.",
          "A fresh starter flow was created instead."
        ];
      }
    },
    persist() {
      localStorage.setItem(STORAGE_KEY, this.persistedWorkflow);
    },
    seedStarterFlow() {
      const startNode = createWorkflowNode("start", { x: 80, y: 180 });
      const transformNode = createWorkflowNode("transform", { x: 360, y: 180 });
      const endNode = createWorkflowNode("end", { x: 680, y: 180 });

      this.applySnapshot({
        nodes: [startNode, transformNode, endNode],
        edges: [
          {
            id: createEdgeId(startNode.id, transformNode.id),
            source: startNode.id,
            target: transformNode.id
          },
          {
            id: createEdgeId(transformNode.id, endNode.id),
            source: transformNode.id,
            target: endNode.id
          }
        ]
      });
      this.selectedNodeId = null;
    },
    addNode(kind: NodeKind, position: XYPosition) {
      const nextNode = createWorkflowNode(kind, position);

      this.nodeOrder = [...this.nodeOrder, nextNode.id];
      this.nodesById = {
        ...this.nodesById,
        [nextNode.id]: nextNode
      };
      this.logs = [`Added a ${kind} node.`, ...this.logs];
      this.lastRunStatus = "idle";
    },
    updateEdges(nextEdges: Edge[]) {
      const normalizedEdges = nextEdges
        .map(toGraphEdge)
        .filter((edge): edge is WorkflowGraphEdge => Boolean(edge));

      this.edgeOrder = normalizedEdges.map((edge) => edge.id);
      this.edgesById = Object.fromEntries(
        normalizedEdges.map((edge) => [edge.id, edge])
      );
      this.lastRunStatus = "idle";
    },
    syncDraggedNodes(nextNodes: WorkflowNode[]) {
      const nextPositions = new Map(
        nextNodes.map((node) => [node.id, clampPosition(node.position)])
      );

      this.nodesById = Object.fromEntries(
        this.nodeOrder
          .map((id) => {
            const currentNode = this.nodesById[id];

            if (!currentNode) {
              return null;
            }

            const nextPosition = nextPositions.get(id);

            return [
              id,
              nextPosition
                ? {
                    ...currentNode,
                    position: nextPosition
                  }
                : currentNode
            ];
          })
          .filter(
            (
              entry
            ): entry is [string, WorkflowGraphNode] => Boolean(entry)
          )
      );
    },
    addConnection(connection: Connection) {
      if (!connection.source || !connection.target) {
        return;
      }

      const alreadyExists = this.edgeOrder.some((edgeId) => {
        const edge = this.edgesById[edgeId];

        return (
          edge?.source === connection.source && edge?.target === connection.target
        );
      });

      if (alreadyExists) {
        this.logs = ["That connection already exists.", ...this.logs];
        return;
      }

      const nextEdge: WorkflowGraphEdge = {
        id: createEdgeId(connection.source, connection.target),
        source: connection.source,
        target: connection.target,
        sourceHandle: connection.sourceHandle ?? null,
        targetHandle: connection.targetHandle ?? null
      };

      this.edgeOrder = [...this.edgeOrder, nextEdge.id];
      this.edgesById = {
        ...this.edgesById,
        [nextEdge.id]: nextEdge
      };
      this.logs = ["Created a new connection.", ...this.logs];
      this.lastRunStatus = "idle";
    },
    selectNode(nodeId: string | null) {
      this.selectedNodeId = nodeId;
    },
    updateSelectedNodeConfig(patch: Record<string, unknown>) {
      if (!this.selectedNodeId) {
        return;
      }

      const currentNode = this.nodesById[this.selectedNodeId];

      if (!currentNode) {
        this.selectedNodeId = null;
        return;
      }

      this.nodesById = {
        ...this.nodesById,
        [this.selectedNodeId]: {
          ...currentNode,
          config: {
            ...currentNode.config,
            ...patch
          } as WorkflowNodeConfig
        }
      };
      this.lastRunStatus = "idle";
    },
    deleteSelectedNode() {
      if (!this.selectedNodeId) {
        return;
      }

      const nodeId = this.selectedNodeId;
      const { [nodeId]: _removedNode, ...remainingNodes } = this.nodesById;
      const remainingEdges = this.edgeOrder
        .map((edgeId) => this.edgesById[edgeId])
        .filter(
          (edge): edge is WorkflowGraphEdge =>
            Boolean(edge) &&
            edge.source !== nodeId &&
            edge.target !== nodeId
        );

      this.nodeOrder = this.nodeOrder.filter((id) => id !== nodeId);
      this.nodesById = remainingNodes;
      this.edgeOrder = remainingEdges.map((edge) => edge.id);
      this.edgesById = Object.fromEntries(
        remainingEdges.map((edge) => [edge.id, edge])
      );
      this.selectedNodeId = null;
      this.logs = ["Deleted the selected node.", ...this.logs];
      this.lastRunStatus = "idle";
    },
    clearCanvas() {
      this.nodeOrder = [];
      this.nodesById = {};
      this.edgeOrder = [];
      this.edgesById = {};
      this.selectedNodeId = null;
      this.logs = ["Cleared the canvas.", ...this.logs];
      this.lastRunStatus = "idle";
    },
    runSimulation() {
      try {
        const result = simulateWorkflow(this.snapshot.nodes, this.snapshot.edges);
        this.logs = [
          "Execution trail:",
          ...result.executionTrail,
          "Node outputs:",
          ...result.nodeLogs
        ];
        this.lastRunStatus = "success";
      } catch (error) {
        this.logs = [error instanceof Error ? error.message : "Simulation failed."];
        this.lastRunStatus = "error";
      }
    },
    loadImportDraft(value: string) {
      this.importDraft = value;
    },
    importWorkflow() {
      if (!this.importDraft.trim()) {
        this.logs = ["Paste workflow JSON before importing.", ...this.logs];
        return;
      }

      try {
        const parsed = JSON.parse(this.importDraft) as WorkflowSnapshot;
        this.applySnapshot(parsed);
        this.selectedNodeId = null;
        this.logs = ["Imported the workflow from JSON."];
        this.lastRunStatus = "idle";
      } catch (error) {
        console.error(error);
        this.logs = ["The import JSON is invalid."];
        this.lastRunStatus = "error";
      }
    },
    setTransformPreset(mode: TransformNodeConfig["mode"]) {
      this.updateSelectedNodeConfig({ mode });
    }
  }
});
