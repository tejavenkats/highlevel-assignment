import type { Edge, Node, XYPosition } from "@vue-flow/core";

export type NodeKind = "start" | "transform" | "end";
export type TransformMode = "uppercase" | "append" | "multiply";

export interface StartNodeConfig {
  message: string;
}

export interface TransformNodeConfig {
  mode: TransformMode;
  appendText: string;
  multiplier: number;
}

export interface EndNodeConfig {
  note: string;
}

export type WorkflowNodeConfig =
  | StartNodeConfig
  | TransformNodeConfig
  | EndNodeConfig;

export interface WorkflowNodeData {
  kind: NodeKind;
  title: string;
  summary: string;
  label: string;
  config: WorkflowNodeConfig;
}

export type WorkflowNode = Node<WorkflowNodeData>;
export type WorkflowEdge = Edge;

export interface WorkflowGraphNode {
  id: string;
  kind: NodeKind;
  position: XYPosition;
  config: WorkflowNodeConfig;
}

export interface WorkflowGraphEdge {
  id: string;
  source: string;
  target: string;
  sourceHandle?: string | null;
  targetHandle?: string | null;
}

export interface WorkflowSnapshot {
  nodes: WorkflowGraphNode[];
  edges: WorkflowGraphEdge[];
}

export interface PaletteItem {
  kind: NodeKind;
  title: string;
  description: string;
}

export interface SimulationResult {
  executionTrail: string[];
  nodeLogs: string[];
  finalPayload: string | number;
}

export interface AddNodePayload {
  kind: NodeKind;
  position: XYPosition;
}
