export interface WorkEntry {
  id: string;
  task_name: string;
  project_name: string;
  category: string;
  work_date: string;
  start_time: string;
  end_time: string;
  duration_seconds: number;
  created_at: string;
  updated_at: string;
}

export interface WorkEntryCreate {
  task_name: string;
  project_name: string;
  category: string;
  work_date: string;
  start_time: string;
  end_time: string;
}

export interface WorkEntryUpdate {
  task_name?: string;
  project_name?: string;
  category?: string;
  work_date?: string;
  start_time?: string;
  end_time?: string;
}

export interface ReportSummaryItem {
  name: string;
  seconds: number;
  percentage: number;
}

export interface ReportSummary {
  total_seconds: number;
  items: ReportSummaryItem[];
}

export type TabName = 'tracker' | 'timeline' | 'report' | 'data';
