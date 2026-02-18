import { useState, useMemo } from 'react';
import { format, differenceInMonths } from 'date-fns';
import { deleteEntriesBulk, getExportCsvUrl, fetchEntries } from '../api';

export default function DataManagement() {
  const today = format(new Date(), 'yyyy-MM-dd');

  // Export state
  const [exportFrom, setExportFrom] = useState(today);
  const [exportTo, setExportTo] = useState(today);
  const [exportMsg, setExportMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Delete state
  const [deleteFrom, setDeleteFrom] = useState(today);
  const [deleteTo, setDeleteTo] = useState(today);
  const [deleteMsg, setDeleteMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleteCount, setDeleteCount] = useState(0);

  const exportValid = useMemo(() => {
    if (!exportFrom || !exportTo) return false;
    return differenceInMonths(new Date(exportTo), new Date(exportFrom)) <= 12;
  }, [exportFrom, exportTo]);

  const deleteValid = useMemo(() => {
    if (!deleteFrom || !deleteTo) return false;
    return differenceInMonths(new Date(deleteTo), new Date(deleteFrom)) <= 12;
  }, [deleteFrom, deleteTo]);

  function handleExport() {
    if (!exportValid) {
      setExportMsg({ type: 'error', text: '期間は最長12ヶ月です' });
      return;
    }
    setExportMsg(null);
    const url = getExportCsvUrl(exportFrom, exportTo);
    const a = document.createElement('a');
    a.href = url;
    a.download = `time_tracking_${exportFrom.replace(/-/g, '')}_${exportTo.replace(/-/g, '')}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  }

  async function handleDeleteClick() {
    if (!deleteValid) {
      setDeleteMsg({ type: 'error', text: '期間は最長12ヶ月です' });
      return;
    }
    setDeleteMsg(null);
    try {
      const entries = await fetchEntries({ from: deleteFrom, to: deleteTo });
      setDeleteCount(entries.length);
      setConfirmDelete(true);
    } catch {
      setDeleteMsg({ type: 'error', text: 'データの取得に失敗しました' });
    }
  }

  async function handleDeleteConfirm() {
    try {
      const result = await deleteEntriesBulk(deleteFrom, deleteTo);
      setDeleteMsg({ type: 'success', text: `${result.deleted_count}件のデータを削除しました` });
    } catch {
      setDeleteMsg({ type: 'error', text: '削除に失敗しました' });
    }
    setConfirmDelete(false);
  }

  return (
    <div>
      {/* CSV Export */}
      <div className="data-section card">
        <h2 className="data-section-title">CSVエクスポート</h2>
        <div className="data-form-row">
          <div className="form-group">
            <label className="form-label">From</label>
            <input className="form-input" type="date" value={exportFrom} onChange={(e) => setExportFrom(e.target.value)} />
          </div>
          <div className="form-group">
            <label className="form-label">To</label>
            <input className="form-input" type="date" value={exportTo} onChange={(e) => setExportTo(e.target.value)} />
          </div>
          <button className="btn btn-primary" onClick={handleExport}>エクスポート</button>
        </div>
        {exportMsg && (
          <div className={`data-message ${exportMsg.type}`}>{exportMsg.text}</div>
        )}
      </div>

      {/* Data Delete */}
      <div className="data-section card">
        <h2 className="data-section-title">データ削除</h2>
        <div className="data-form-row">
          <div className="form-group">
            <label className="form-label">From</label>
            <input className="form-input" type="date" value={deleteFrom} onChange={(e) => setDeleteFrom(e.target.value)} />
          </div>
          <div className="form-group">
            <label className="form-label">To</label>
            <input className="form-input" type="date" value={deleteTo} onChange={(e) => setDeleteTo(e.target.value)} />
          </div>
          <button className="btn btn-danger" onClick={handleDeleteClick}>削除</button>
        </div>
        {deleteMsg && (
          <div className={`data-message ${deleteMsg.type}`}>{deleteMsg.text}</div>
        )}
      </div>

      {confirmDelete && (
        <div className="confirm-overlay" onClick={() => setConfirmDelete(false)}>
          <div className="confirm-box" onClick={(e) => e.stopPropagation()}>
            <p>
              指定期間（{deleteFrom.replace(/-/g, '/')}〜{deleteTo.replace(/-/g, '/')}）のデータ {deleteCount}件 を削除します。<br />
              この操作は取り消せません。よろしいですか？
            </p>
            <div className="confirm-actions">
              <button className="btn btn-secondary" onClick={() => setConfirmDelete(false)}>キャンセル</button>
              <button className="btn btn-danger" onClick={handleDeleteConfirm}>削除する</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
