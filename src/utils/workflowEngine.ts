import type {
  NodeKind,
  WorkflowGraphEdge,
  WorkflowGraphNode,
  SimulationResult,
  TransformNodeConfig,
  WorkflowEdge,
  WorkflowNode,
  WorkflowNodeConfig,
  WorkflowNodeData
} from "@/types";

const NODE_LABELS: Record<NodeKind, string> = {
  start: "Start Node",
  transform: "Transform Node",
  end: "End Node"
};

export function createNodeId(kind: NodeKind): string {
  return `${kind}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}

export function createNodeConfig(kind: NodeKind): WorkflowNodeConfig {
  if (kind === "start") {
    return {
      message: "hello"
    };
  }

  if (kind === "transform") {
    return {
      mode: "uppercase",
      appendText: " world",
      multiplier: 2
    };
  }

  return {
    note: ""
  };
}

export function createNodeData(kind: NodeKind): WorkflowNodeData {
  const config = createNodeConfig(kind);

  return {
    kind,
    title: NODE_LABELS[kind],
    summary: buildNodeSummaryFromParts(kind, config),
    label: buildNodeLabelFromParts(kind, config),
    config
  };
}

export function buildNodeSummaryFromParts(
  kind: NodeKind,
  config: WorkflowNodeConfig
): string {
  if (kind === "start") {
    return `message: "${(config as { message: string }).message}"`;
  }

  if (kind === "transform") {
    const transformConfig = config as TransformNodeConfig;

    if (transformConfig.mode === "append") {
      return `append "${transformConfig.appendText}"`;
    }

    if (transformConfig.mode === "multiply") {
      return `multiply by ${transformConfig.multiplier}`;
    }

    return "uppercase";
  }

  return "Displays the final payload";
}

export function buildNodeLabelFromParts(
  kind: NodeKind,
  config: WorkflowNodeConfig
): string {
  return `${NODE_LABELS[kind]} | ${buildNodeSummaryFromParts(kind, config)}`;
}

export function buildNodeSummary(node: WorkflowNode): string {
  return buildNodeSummaryFromParts(node.data.kind, node.data.config);
}

export function buildNodeLabel(node: WorkflowNode): string {
  return buildNodeLabelFromParts(node.data.kind, node.data.config);
}

function formatPayload(payload: string | number): string {
  return typeof payload === "number"
    ? `{ message: ${payload} }`
    : `{ message: "${payload}" }`;
}

function applyTransform(
  payload: string | number,
  config: TransformNodeConfig
): string | number {
  if (config.mode === "uppercase") {
    return String(payload).toUpperCase();
  }

  if (config.mode === "append") {
    return `${String(payload)}${config.appendText}`;
  }

  const numericValue =
    typeof payload === "number" ? payload : Number(String(payload));

  if (Number.isNaN(numericValue)) {
    throw new Error(
      "Multiply mode expects a numeric message or a value that can be converted to a number."
    );
  }

  return numericValue * config.multiplier;
}

export function simulateWorkflow(
  nodes: WorkflowGraphNode[] | WorkflowNode[],
  edges: WorkflowGraphEdge[] | WorkflowEdge[]
): SimulationResult {
  const nodeMap = new Map(nodes.map((node) => [node.id, node]));
  const outgoing = new Map<string, string[]>();

  for (const edge of edges) {
    if (!edge.source || !edge.target) {
      continue;
    }

    const nextTargets = outgoing.get(edge.source) ?? [];
    nextTargets.push(edge.target);
    outgoing.set(edge.source, nextTargets);
  }

  const startNode = nodes.find((node) =>
    "data" in node ? node.data.kind === "start" : node.kind === "start"
  );

  if (!startNode) {
    throw new Error("Add a Start Node before running the workflow.");
  }

  let payload: string | number = ("data" in startNode
    ? (startNode.data.config as { message: string }).message
    : (startNode.config as { message: string }).message);
  let currentNode: WorkflowGraphNode | WorkflowNode | undefined = startNode;
  const visited = new Set<string>();
  const executionTrail: string[] = [];
  const nodeLogs: string[] = [];

  while (currentNode) {
    if (visited.has(currentNode.id)) {
      throw new Error("A cycle was detected. Remove loops before running the workflow.");
    }

    visited.add(currentNode.id);

    const currentKind = "data" in currentNode ? currentNode.data.kind : currentNode.kind;
    const currentTitle =
      "data" in currentNode ? currentNode.data.title : NODE_LABELS[currentNode.kind];
    const currentConfig =
      "data" in currentNode
        ? currentNode.data.config
        : (currentNode.config as WorkflowNodeConfig);

    if (currentKind === "start") {
      nodeLogs.push(`${currentTitle} -> ${formatPayload(payload)}`);
    }

    if (currentKind === "transform") {
      payload = applyTransform(
        payload,
        currentConfig as TransformNodeConfig
      );
      nodeLogs.push(`${currentTitle} -> ${formatPayload(payload)}`);
    }

    if (currentKind === "end") {
      nodeLogs.push(`${currentTitle} -> ${formatPayload(payload)}`);
      return {
        executionTrail,
        nodeLogs,
        finalPayload: payload
      };
    }

    const targets = outgoing.get(currentNode.id) ?? [];

    if (targets.length === 0) {
      throw new Error(
        `${currentTitle} does not lead to another node. Connect the flow before running it.`
      );
    }

    const nextNode = nodeMap.get(targets[0]);

    if (!nextNode) {
      throw new Error("One of the node connections points to a missing node.");
    }

    const nextTitle =
      "data" in nextNode ? nextNode.data.title : NODE_LABELS[nextNode.kind];

    executionTrail.push(
      currentKind === "transform"
        ? `${currentTitle} (applies transformation) -> ${nextTitle}`
        : `${currentTitle} output -> ${nextTitle}`
    );

    currentNode = nextNode;
  }

  throw new Error("The workflow ended unexpectedly.");
}
