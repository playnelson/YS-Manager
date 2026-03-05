
// Auth Types
export interface User {
  id: string;
  nick: string;
  photoUrl?: string;
  googleAccessToken?: string;
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

export interface KanbanColumn {
  id: string;
  title: string;
  cards: KanbanCard[];
}

export interface KanbanState {
  columns: KanbanColumn[];
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

export interface FlowNodeWithHistory extends FlowNode {
  history?: number[];
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
  type: 'national' | 'state' | 'municipal' | 'optional' | 'commemorative';
}

export interface MoonPhase {
  date: string; // YYYY-MM-DD
  phase: 'new' | 'first-quarter' | 'full' | 'last-quarter';
  name: string;
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
  customIcon?: string;
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
  createdAt?: string;
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
  startDate: string;
  segments: ShiftSegment[];
}

// Shift Handoff Types
export type HandoffStatus = 'ok' | 'warning' | 'critical';

export interface ShiftHandoff {
  id: string;
  timestamp: string;
  userNick: string;
  shiftPeriod: string;
  status: HandoffStatus;
  occurrences: string;
  pendingItems: string;
}

// Document Generator Types
export interface DocTemplate {
  id: string;
  name: string;
  category: 'Financeiro' | 'Jurídico' | 'RH' | 'Pessoal' | 'Comercial' | 'Imobiliário';
  description: string;
  fields: string[];
  contentPattern: string;
}

// BrasilAPI / Consulta Types
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

export interface CnpjData {
  cnpj: string;
  razao_social: string;
  nome_fantasia: string | null;
  situacao_cadastral: number;
  descricao_situacao_cadastral: string;
  data_inicio_atividade: string | null;
  uf: string;
  municipio: string;
  logradouro: string;
  numero: string;
  complemento: string;
  bairro: string;
  cep: string;
  ddd_telefone_1: string | null;
  ddd_telefone_2: string | null;
  email: string | null;
  capital_social: number;
  porte: number;
  descricao_porte?: string;
  opcao_pelo_simples: boolean | null;
  data_opcao_pelo_simples: string | null;
  opcao_pelo_mei: boolean | null;
  cnae_fiscal: string;
  cnae_fiscal_descricao: string;
  cnaes_secundarios?: Array<{ codigo: string, descricao: string }>;
  qsa?: Array<{
    nome_socio: string;
    qualificacao_socio: string;
    data_entrada_sociedade: string | null;
  }>;
  descricao_matriz_filial: string;
  codigo_natureza_juridica: string;
  descricao_tipo_de_logradouro: string;
}

// FIPE Types
export interface FipeBrand {
  nome: string;
  codigo: string;
}

export interface FipeModel {
  nome: string;
  codigo: string;
}

export interface FipeYear {
  nome: string;
  codigo: string;
}

export interface FipeResult {
  Valor: string;
  Marca: string;
  Modelo: string;
  AnoModelo: number;
  Combustivel: string;
  CodigoFipe: string;
  MesReferencia: string;
}

// Financial Types
// Added TransactionType and FinancialTransaction definitions
export type TransactionType = 'income' | 'expense';

export interface FinancialTransaction {
  id: string;
  description: string;
  amount: number;
  type: TransactionType;
  category: string;
  date: string;
}

export interface Signature {
  id: string;
  name: string;
  dataUrl: string;
  createdAt: string;
}

export interface StoredFile {
  id: string;
  name: string;
  type: string;
  size: number;
  data: string;
  uploadedAt: string;
  category?: string;
}

export interface ModuleDefinition {
  id: string;
  name: string;
  description: string;
  icon: string; // Lucide icon name
  category: 'Productivity' | 'Logistics' | 'Communication' | 'Tools';
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
  shiftHandoffs?: ShiftHandoff[];
  shiftConfig?: ShiftConfig;
  signatures?: Signature[];
  personalFiles?: StoredFile[];
  financialTransactions?: FinancialTransaction[];
  warehouseInventory?: any[];
  warehouseLogs?: any[];
  logistics?: LogisticsState;
  hiddenTabs?: string[];
}

// Logistics Types
export interface FreightTable {
  id: string;
  name: string;
  fuelPrice: number;
  avgConsumption: number;
  driverPerDieum: number;
  insuranceRate: number; // percentage
  updatedAt: string;
}

export interface LogisticsChecklist {
  id: string;
  title: string;
  items: { id: string; label: string; completed: boolean }[];
  updatedAt: string;
}

export interface SavedRoute {
  id: string;
  origin: string;
  destination: string;
  distance: number;
  duration: number;
  stops: number;
  createdAt: string;
}

export interface LogisticsState {
  freightTables: FreightTable[];
  checklists: LogisticsChecklist[];
  savedRoutes?: SavedRoute[];
}
