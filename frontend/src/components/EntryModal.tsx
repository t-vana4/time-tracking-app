import { useState, useEffect } from 'react';
import { format } from 'date-fns';
import type { WorkEntry } from '../types';
import { createEntry, updateEntry, deleteEntry } from '../api';
import SuggestInput from './SuggestInput';

interface Props {
  entry?: WorkEntry | null;
  defaultValues?: Partial<WorkEntry>;
  onClose: () => void;
  onSaved: () => void;
  onDuplicate?: (entry: WorkEntry) => void;
}

export default function EntryModal({ entry, defaultValues, onClose, onSaved, onDuplicate }: Props) {
  const isEdit = !!entry;
  const todayStr = format(new Date(), 'yyyy-MM-dd');
  const init = entry || defaultValues;
  const [taskName, setTaskName] = useState(init?.task_name || '');
  const [projectName, setProjectName] = useState(init?.project_name || '');
  const [category, setCategory] = useState(init?.category || '');
  const [workDate, setWorkDate] = useState(init?.work_date || todayStr);
  const [startTime, setStartTime] = useState(init?.start_time?.slice(0, 5) || '');
  const [endTime, setEndTime] = useState(init?.end_time?.slice(0, 5) || '');
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (entry) {
      setTaskName(entry.task_name);
      setProjectName(entry.project_name);
      setCategory(entry.category);
      setWorkDate(entry.work_date);
      setStartTime(entry.start_time?.slice(0, 5) || '');
      setEndTime(entry.end_time?.slice(0, 5) || '');
    }
  }, [entry]);

  const canSave = taskName && projectName && category && workDate && startTime && endTime;

  async function handleSave() {
    if (!canSave || saving) return;
    setSaving(true);
    try {
      const data = {
        task_name: taskName,
        project_name: projectName,
        category,
        work_date: workDate,
        start_time: startTime + ':00',
        end_time: endTime + ':00',
      };
      if (isEdit && entry) {
        await updateEntry(entry.id, data);
      } else {
        await createEntry(data);
      }
      onSaved();
      onClose();
    } catch {
      alert('保存に失敗しました');
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!entry) return;
    try {
      await deleteEntry(entry.id);
      onSaved();
      onClose();
    } catch {
      alert('削除に失敗しました');
    }
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2 className="modal-title">{isEdit ? '作業記録の編集' : '作業記録の追加'}</h2>
          {isEdit && entry && onDuplicate && (
            <button
              className="btn-duplicate"
              title="複製"
              onClick={() => { onDuplicate(entry); onClose(); }}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
                <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
              </svg>
            </button>
          )}
        </div>

        <SuggestInput label="タスク名" value={taskName} onChange={setTaskName} type="tasks" placeholder="タスク名" />
        <SuggestInput label="プロジェクト名" value={projectName} onChange={setProjectName} type="projects" placeholder="プロジェクト名" />
        <SuggestInput label="カテゴリ" value={category} onChange={setCategory} type="categories" placeholder="カテゴリ" />

        <div className="form-group">
          <label className="form-label">作業日</label>
          <input className="form-input" type="date" value={workDate} onChange={(e) => setWorkDate(e.target.value)} />
        </div>

        <div style={{ display: 'flex', gap: '16px' }}>
          <div className="form-group" style={{ flex: 1 }}>
            <label className="form-label">開始時刻</label>
            <input className="form-input" type="time" value={startTime} onChange={(e) => setStartTime(e.target.value)} />
          </div>
          <div className="form-group" style={{ flex: 1 }}>
            <label className="form-label">終了時刻</label>
            <input className="form-input" type="time" value={endTime} onChange={(e) => setEndTime(e.target.value)} />
          </div>
        </div>

        <div className="modal-actions">
          {isEdit && (
            <button className="btn btn-danger" onClick={() => setConfirmDelete(true)}>削除</button>
          )}
          <button className="btn btn-secondary" onClick={onClose}>キャンセル</button>
          <button className="btn btn-primary" onClick={handleSave} disabled={!canSave || saving}>
            {isEdit ? '保存' : '登録'}
          </button>
        </div>

        {confirmDelete && (
          <div className="confirm-overlay" onClick={() => setConfirmDelete(false)}>
            <div className="confirm-box" onClick={(e) => e.stopPropagation()}>
              <p>この作業記録を削除します。<br />この操作は取り消せません。よろしいですか？</p>
              <div className="confirm-actions">
                <button className="btn btn-secondary" onClick={() => setConfirmDelete(false)}>キャンセル</button>
                <button className="btn btn-danger" onClick={handleDelete}>削除する</button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
