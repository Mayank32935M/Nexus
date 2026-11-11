export interface SystemStats {
  total_files: number;
  total_words: number;
  total_size_bytes: number;
  total_projects: number;
  pending_approvals_count: number;
  categories: Record<string, number>;
}

export interface SystemStatus {
  system: {
    status: string;
    version: string;
    environment: string;
    memory_dir: string;
    db_path: string;
    timestamp: string;
  };
  stats: SystemStats;
  integrations: Record<string, {
    name: string;
    status?: string;
    connected?: boolean;
    status_message?: string;
    available_models?: string[];
    notes?: string;
    transport?: string;
    tools_count?: number;
  }>;
  active_projects: ProjectSummary[];
  pending_approvals: ApprovalRecord[];
}

export interface MemoryTreeNode {
  name: string;
  path: string;
  type: 'directory' | 'file';
  size?: number;
  last_modified?: string;
  children?: MemoryTreeNode[];
}

export interface MemoryDocument {
  path: string;
  title: string;
  category: string;
  project_name?: string;
  permission: 'READ' | 'WRITE' | 'APPROVAL_REQUIRED';
  frontmatter: Record<string, any>;
  content: string;
  body: string;
  word_count: number;
  content_hash: string;
  last_modified: string;
  file_size: number;
}

export interface SearchResult {
  path: string;
  title: string;
  category: string;
  project_name?: string;
  word_count: number;
  last_modified: string;
  snippet: string;
}

export interface ProjectSummary {
  name: string;
  description: string;
  doc_count: number;
  total_tasks: number;
  completed_tasks: number;
  last_updated: string;
}

export interface ProjectContextBundle {
  project_name: string;
  documents: Record<string, string>;
  context_bundle: string;
  retrieved_at: string;
}

export interface ApprovalRecord {
  id: string;
  file_path: string;
  action: 'CREATE' | 'UPDATE' | 'DELETE';
  diff: string;
  reason: string;
  agent: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  created_at: string;
  reviewed_at?: string;
  reviewed_by?: string;
  proposed_content?: string;
  original_content?: string;
}

export interface AuditLogEntry {
  id: number;
  timestamp: string;
  event_type: string;
  file_path?: string;
  agent: string;
  details: Record<string, any>;
}

export interface SessionRecord {
  id: string;
  title: string;
  agent: string;
  target_model: string;
  summary: string;
  created_at: string;
  file_path?: string;
  project?: string;
}

export interface ProviderItem {
  id: string;
  name: string;
  kind: 'local' | 'mcp' | 'connector' | 'agent';
  connected: boolean;
  status_message: string;
  models: string[];
  endpoint: string;
  description: string;
}

