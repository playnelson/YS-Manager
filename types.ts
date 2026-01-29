
// Kanban Types
export interface KanbanCard {
  id: string;
  title: string;
  description: string;
}

export interface KanbanState {
  todo: KanbanCard[];
  doing: KanbanCard[];
  done: KanbanCard[];
}

// Flowchart Types
export type FlowNodeType = 'input' | 'op' | 'result';
export type FlowOperation = '+' | '-' | '*' | '/';

export interface FlowNode {
  id: string;
  type: FlowNodeType;
  x: number;
  y: number;
  label: string;
  value?: number; // For Input
  operation?: FlowOperation; // For Op
  calculatedValue?: number | null;
}

export interface FlowConnection {
  id: string;
  from: string;
  to: string;
}

export interface FlowState {
  nodes: FlowNode[];
  connections: FlowConnection[];
}

// Email Types
export interface EmailTemplate {
  id: string;
  name: string;
  to: string;
  cc: string;
  subject: string;
  body: string;
  savedAt: string;
}

// Global App Data (for save/load)
export interface AppData {
  kanban: KanbanState;
  flow: FlowState;
  emails: EmailTemplate[];
}
