import {
  ApprovalRecord,
  AuditLogEntry,
  MemoryDocument,
  MemoryTreeNode,
  ProjectContextBundle,
  ProjectSummary,
  ProviderItem,
  SearchResult,
  SessionRecord,
  SystemStatus,
} from '../types';

const API_BASE = '/api';

async function handleResponse<T>(res: Response): Promise<T> {
  if (!res.ok) {
    let detail = `Error ${res.status}: ${res.statusText}`;
    try {
      const errJson = await res.json();
      if (errJson.detail) detail = errJson.detail;
    } catch {
      // ignore
    }
    throw new Error(detail);
  }
  return res.json();
}

export const api = {
  // System & Health
  async getStatus(): Promise<SystemStatus> {
    const res = await fetch(`${API_BASE}/status`);
    return handleResponse<SystemStatus>(res);
  },

  async getHealth(): Promise<{ status: string; version: string }> {
    const res = await fetch(`${API_BASE}/health`);
    return handleResponse(res);
  },

  // Memory Vault
  async getMemoryTree(): Promise<MemoryTreeNode[]> {
    const res = await fetch(`${API_BASE}/memory/tree`);
    return handleResponse<MemoryTreeNode[]>(res);
  },

  async readMemoryFile(path: string): Promise<MemoryDocument> {
    const res = await fetch(`${API_BASE}/memory/file?path=${encodeURIComponent(path)}`);
    return handleResponse<MemoryDocument>(res);
  },

  async writeMemoryFile(path: string, content: string, bypassApproval = false): Promise<MemoryDocument> {
    const res = await fetch(`${API_BASE}/memory/file`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        path,
        content,
        agent: 'user-dashboard',
        bypass_approval: bypassApproval,
      }),
    });
    return handleResponse<MemoryDocument>(res);
  },

  async searchMemory(query: string, category?: string, project?: string): Promise<SearchResult[]> {
    const params = new URLSearchParams({ query });
    if (category) params.append('category', category);
    if (project) params.append('project', project);
    const res = await fetch(`${API_BASE}/memory/search?${params.toString()}`);
    return handleResponse<SearchResult[]>(res);
  },

  async syncVault(): Promise<{ status: string; indexed_count: number; message: string }> {
    const res = await fetch(`${API_BASE}/memory/sync`, { method: 'POST' });
    return handleResponse(res);
  },

  // Projects
  async listProjects(): Promise<ProjectSummary[]> {
    const res = await fetch(`${API_BASE}/projects`);
    return handleResponse<ProjectSummary[]>(res);
  },

  async createProject(name: string, description: string): Promise<any> {
    const res = await fetch(`${API_BASE}/projects`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, description, author: 'User' }),
    });
    return handleResponse(res);
  },

  async getProjectContext(projectName: string): Promise<ProjectContextBundle> {
    const res = await fetch(`${API_BASE}/projects/${encodeURIComponent(projectName)}/context`);
    return handleResponse<ProjectContextBundle>(res);
  },

  async updateProjectProgress(projectName: string, task: string, status: string, notes = ''): Promise<any> {
    const res = await fetch(`${API_BASE}/projects/${encodeURIComponent(projectName)}/progress`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ task, status, notes, agent: 'user-dashboard' }),
    });
    return handleResponse(res);
  },

  // Approvals & Governance
  async listApprovals(status?: string): Promise<ApprovalRecord[]> {
    const url = status ? `${API_BASE}/approvals?status=${encodeURIComponent(status)}` : `${API_BASE}/approvals`;
    const res = await fetch(url);
    return handleResponse<ApprovalRecord[]>(res);
  },

  async getApproval(id: string): Promise<ApprovalRecord> {
    const res = await fetch(`${API_BASE}/approvals/${encodeURIComponent(id)}`);
    return handleResponse<ApprovalRecord>(res);
  },

  async proposeUpdate(filePath: string, proposedContent: string, reason: string): Promise<any> {
    const res = await fetch(`${API_BASE}/approvals/propose`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        file_path: filePath,
        proposed_content: proposedContent,
        reason,
        agent: 'user-dashboard',
      }),
    });
    return handleResponse(res);
  },

  async approveProposal(id: string, reviewer = 'User'): Promise<ApprovalRecord> {
    const res = await fetch(`${API_BASE}/approvals/${encodeURIComponent(id)}/approve`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ reviewer }),
    });
    return handleResponse<ApprovalRecord>(res);
  },

  async rejectProposal(id: string, reviewer = 'User', reason = ''): Promise<ApprovalRecord> {
    const res = await fetch(`${API_BASE}/approvals/${encodeURIComponent(id)}/reject`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ reviewer, reason }),
    });
    return handleResponse<ApprovalRecord>(res);
  },

  // Handoffs
  async generateHandoff(params: {
    session_title: string;
    target_model: string;
    current_goal: string;
    completed_work: string[];
    decisions_made: string[];
    next_steps: string[];
    project_name?: string;
    open_questions?: string[];
  }): Promise<any> {
    const res = await fetch(`${API_BASE}/handoff/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params),
    });
    return handleResponse(res);
  },

  async listSessions(): Promise<SessionRecord[]> {
    const res = await fetch(`${API_BASE}/handoff/sessions`);
    return handleResponse<SessionRecord[]>(res);
  },

  // Providers
  async getProviders(): Promise<ProviderItem[]> {
    const res = await fetch(`${API_BASE}/providers/status`);
    return handleResponse<ProviderItem[]>(res);
  },

  async testOllama(): Promise<any> {
    const res = await fetch(`${API_BASE}/providers/ollama/test`, { method: 'POST' });
    return handleResponse(res);
  },

  async getMcpConfig(): Promise<any> {
    const res = await fetch(`${API_BASE}/providers/mcp/config`);
    return handleResponse(res);
  },

  // Audit
  async getAuditLogs(limit = 50): Promise<AuditLogEntry[]> {
    const res = await fetch(`${API_BASE}/audit?limit=${limit}`);
    return handleResponse<AuditLogEntry[]>(res);
  },
};

