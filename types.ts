
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

// CNPJ Data Type (BrasilAPI Completo)
export interface Cnae {
  codigo: number;
  descricao: string;
}

export interface Socio {
  nome_socio: string;
  cnpj_cpf_do_socio: string;
  codigo_qualificacao_socio: number;
  qualificacao_socio: string;
  data_entrada_sociedade: string;
  faixa_etaria?: string;
}

export interface CnpjData {
  cnpj: string;
  identificador_matriz_filial: number;
  descricao_matriz_filial: string;
  razao_social: string;
  nome_fantasia: string;
  situacao_cadastral: number;
  descricao_situacao_cadastral: string;
  data_situacao_cadastral: string;
  motivo_situacao_cadastral: number;
  nome_cidade_exterior: string | null;
  codigo_natureza_juridica: number;
  data_inicio_atividade: string;
  cnae_fiscal: number;
  cnae_fiscal_descricao: string;
  descricao_tipo_de_logradouro: string;
  logradouro: string;
  numero: string;
  complemento: string;
  bairro: string;
  cep: string;
  uf: string;
  codigo_municipio: number;
  municipio: string;
  ddd_telefone_1: string;
  ddd_telefone_2: string;
  ddd_fax: string;
  email: string | null;
  qualificacao_do_responsavel: number;
  capital_social: number;
  porte: number;
  descricao_porte: string;
  opcao_pelo_simples: boolean | null;
  data_opcao_pelo_simples: string | null;
  data_exclusao_do_simples: string | null;
  opcao_pelo_mei: boolean | null;
  situacao_especial: string | null;
  data_situacao_especial: string | null;
  cnaes_secundarios: Cnae[];
  qsa: Socio[];
}

// Brasil Tools Types
export interface CepData {
  cep: string;
  state: string;
  city: string;
  neighborhood: string;
  street: string;
  service: string;
}

export interface BankData {
  ispb: string;
  name: string;
  code: number | null;
  fullName: string;
}

export interface CurrencyQuote {
  code: string;
  codein: string;
  name: string;
  high: string;
  low: string;
  varBid: string;
  pctChange: string;
  bid: string;
  ask: string;
  timestamp: string;
  create_date: string;
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
