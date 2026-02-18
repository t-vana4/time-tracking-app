import type { WorkEntry, WorkEntryCreate, WorkEntryUpdate, ReportSummary } from './types';

const BASE = '/api';

export async function fetchEntries(params?: { week_of?: string; from?: string; to?: string }): Promise<WorkEntry[]> {
  const query = new URLSearchParams();
  if (params?.week_of) query.set('week_of', params.week_of);
  if (params?.from) query.set('from', params.from);
  if (params?.to) query.set('to', params.to);
  const qs = query.toString();
  const res = await fetch(`${BASE}/entries${qs ? '?' + qs : ''}`);
  if (!res.ok) throw new Error('Failed to fetch entries');
  return res.json();
}

export async function createEntry(data: WorkEntryCreate): Promise<WorkEntry> {
  const res = await fetch(`${BASE}/entries`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error('Failed to create entry');
  return res.json();
}

export async function updateEntry(id: string, data: WorkEntryUpdate): Promise<WorkEntry> {
  const res = await fetch(`${BASE}/entries/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error('Failed to update entry');
  return res.json();
}

export async function deleteEntry(id: string): Promise<void> {
  const res = await fetch(`${BASE}/entries/${id}`, { method: 'DELETE' });
  if (!res.ok) throw new Error('Failed to delete entry');
}

export async function deleteEntriesBulk(from: string, to: string): Promise<{ deleted_count: number }> {
  const res = await fetch(`${BASE}/entries?from=${from}&to=${to}`, { method: 'DELETE' });
  if (!res.ok) throw new Error('Failed to delete entries');
  return res.json();
}

export async function fetchSuggestions(type: 'tasks' | 'projects' | 'categories'): Promise<string[]> {
  const res = await fetch(`${BASE}/suggestions/${type}`);
  if (!res.ok) throw new Error('Failed to fetch suggestions');
  return res.json();
}

export async function fetchReportSummary(params: {
  from: string;
  to: string;
  group_by: 'project' | 'category';
  projects?: string[];
  categories?: string[];
}): Promise<ReportSummary> {
  const query = new URLSearchParams();
  query.set('from', params.from);
  query.set('to', params.to);
  query.set('group_by', params.group_by);
  if (params.projects && params.projects.length > 0) {
    query.set('projects', params.projects.join(','));
  }
  if (params.categories && params.categories.length > 0) {
    query.set('categories', params.categories.join(','));
  }
  const res = await fetch(`${BASE}/reports/summary?${query.toString()}`);
  if (!res.ok) throw new Error('Failed to fetch report');
  return res.json();
}

export function getExportCsvUrl(from: string, to: string): string {
  return `${BASE}/export/csv?from=${from}&to=${to}`;
}
