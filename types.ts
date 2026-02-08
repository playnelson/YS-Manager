
// Auth Types
export interface User {
  id: string;
  nick: string;
}

// Kanban Types
export type KanbanPriority = 'low' | 'medium' | 'high';

export interface KanbanCard {
  id: string;
  title: string;
  description: string;
  priority: KanbanPriority;
  createdAt: string;
}

export interface KanbanState {
  todo: KanbanCard[];
  doing: KanbanCard[];
  done: KanbanCard[];
}

// Flowchart Types
export type FlowNodeType = 'input' | 'op' | 'result';
export type FlowOperation = '+' | '-' | '*' | '/' | 'AVG' | 'MAX' | 'MIN' | 'POW' | 'PCT';

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

export interface FlowTemplate {
  id: string;
  name: string;
  nodes: FlowNode[];
  connections: FlowConnection[];
}

export interface FlowState {
  nodes: FlowNode[];
  connections: FlowConnection[];
  templates: FlowTemplate[];
}

// Calendar Types
export interface Holiday {
  date: string; // YYYY-MM-DD
  name: string;
  type: 'national' | 'state' | 'municipal' | 'optional';
}

export interface UserEvent {
  id: string;
  date: string; // YYYY-MM-DD
  title: string;
  type: 'holiday' | 'meeting' | 'reminder' | 'birthday';
  description?: string;
}

export interface CalendarConfig {
  uf: string;
  city: string;
}

// Email Types
export interface EmailTemplate {
  id: string;
  name: string;
  category?: string;
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

// Extension / Ramal Types
export interface Extension {
  id: string;
  name: string;
  department: string;
  number: string;
  notes?: string;
}

// Important Notes Types
export type NotePriority = 'normal' | 'urgent' | 'secret' | 'archived';

export interface ImportantNote {
  id: string;
  title: string;
  content: string;
  category: string;
  priority: NotePriority;
  updatedAt: string;
}

// Sticky Note Type
export interface PostIt {
  id: string;
  text: string;
  color: string;
  rotation: number;
}

// Shift Manager Types
export interface ShiftSegment {
  id: string;
  days: number;
  type: 'work' | 'off';
  startTime?: string;
  endTime?: string;
}

export interface ShiftConfig {
  startDate: string; // Data de início do ciclo
  segments: ShiftSegment[];
}

// CNPJ Data Type (BrasilAPI)
export interface CnpjData {
  cnpj: string;
  razao_social: string;
  nome_fantasia: string;
  situacao_cadastral: string;
  data_inicio_atividade: string;
  cnae_fiscal_descricao: string;
  logradouro: string;
  numero: string;
  bairro: string;
  municipio: string;
  uf: string;
  cep: string;
  ddd_telefone_1: string;
  qsa: Array<{
    nome_socio: string;
    qualificacao_socio: string;
  }>;
}

// Global App Data
export interface AppData {
  kanban: KanbanState;
  flow: FlowState;
  calendarConfig?: CalendarConfig;
  calendarEvents?: UserEvent[];
  emails: EmailTemplate[];
  links: ProfessionalLink[];
  extensions?: Extension[];
  postIts: PostIt[];
  importantNotes?: ImportantNote[];
  shiftConfig?: ShiftConfig;
}
