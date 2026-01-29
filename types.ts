
// Auth Types
export interface User {
  id: string;
  nick: string;
}

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
  value?: number;
  operation?: FlowOperation;
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

// Professional Links Types
export interface ProfessionalLink {
  id: string;
  title: string;
  url: string;
  category: string;
}

// Sticky Note Type
export interface PostIt {
  id: string;
  text: string;
  color: string;
  rotation: number;
}

// Global App Data
export interface AppData {
  kanban: KanbanState;
  flow: FlowState;
  emails: EmailTemplate[];
  links: ProfessionalLink[];
  postIts: PostIt[];
}
