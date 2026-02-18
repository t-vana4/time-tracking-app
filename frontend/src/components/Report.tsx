import { useState, useEffect, useMemo } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts';
import { format, startOfMonth, differenceInMonths } from 'date-fns';
import { fetchReportSummary, fetchEntries } from '../api';
import type { ReportSummary } from '../types';

const COLORS = [
  '#5ec4c4', '#e8a87c', '#a897e8', '#e88a97', '#8ac4e8',
  '#c4e85e', '#e85e8a', '#8ae8c4', '#c48ae8', '#e8c45e',
];

function formatDuration(totalSeconds: number): string {
  const h = Math.floor(totalSeconds / 3600);
  const m = Math.floor((totalSeconds % 3600) / 60);
  const s = totalSeconds % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

export default function Report() {
  const today = format(new Date(), 'yyyy-MM-dd');
  const monthStart = format(startOfMonth(new Date()), 'yyyy-MM-dd');

  const [from, setFrom] = useState(monthStart);
  const [to, setTo] = useState(today);
  const [groupBy, setGroupBy] = useState<'project' | 'category'>('project');
  const [summary, setSummary] = useState<ReportSummary | null>(null);
  const [error, setError] = useState('');

  const [projectOptions, setProjectOptions] = useState<string[]>([]);
  const [categoryOptions, setCategoryOptions] = useState<string[]>([]);
  const [selectedProjects, setSelectedProjects] = useState<string[]>([]);
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [projectDropdownOpen, setProjectDropdownOpen] = useState(false);
  const [categoryDropdownOpen, setCategoryDropdownOpen] = useState(false);

  const rangeValid = useMemo(() => {
    if (!from || !to) return false;
    const diff = differenceInMonths(new Date(to), new Date(from));
    return diff <= 12 && diff >= 0;
  }, [from, to]);

  useEffect(() => {
    if (!from || !to || !rangeValid) return;
    fetchEntries({ from, to }).then((entries) => {
      setProjectOptions([...new Set(entries.map(e => e.project_name))]);
      setCategoryOptions([...new Set(entries.map(e => e.category))]);
    }).catch(() => {});
  }, [from, to, rangeValid]);

  useEffect(() => {
    if (!from || !to || !rangeValid) {
      if (!rangeValid && from && to) setError('期間は最長12ヶ月です');
      return;
    }
    setError('');
    fetchReportSummary({
      from,
      to,
      group_by: groupBy,
      projects: selectedProjects.length > 0 ? selectedProjects : undefined,
      categories: selectedCategories.length > 0 ? selectedCategories : undefined,
    })
      .then(setSummary)
      .catch(() => setError('レポートの取得に失敗しました'));
  }, [from, to, groupBy, selectedProjects, selectedCategories, rangeValid]);

  function toggleProject(p: string) {
    setSelectedProjects(prev =>
      prev.includes(p) ? prev.filter(x => x !== p) : [...prev, p]
    );
  }

  function toggleCategory(c: string) {
    setSelectedCategories(prev =>
      prev.includes(c) ? prev.filter(x => x !== c) : [...prev, c]
    );
  }

  const chartData = summary?.items.map(item => ({
    name: item.name,
    value: item.seconds,
  })) || [];

  const totalForPercent = chartData.reduce((acc, d) => acc + d.value, 0);

  return (
    <div>
      <div className="report-controls">
        <div className="report-controls-row">
          <div className="form-group">
            <label className="form-label">From</label>
            <input className="form-input" type="date" value={from} onChange={(e) => setFrom(e.target.value)} />
          </div>
          <div className="form-group">
            <label className="form-label">To</label>
            <input className="form-input" type="date" value={to} onChange={(e) => setTo(e.target.value)} />
          </div>
          <div className="form-group">
            <label className="form-label">集計単位</label>
            <select className="form-select" value={groupBy} onChange={(e) => setGroupBy(e.target.value as 'project' | 'category')}>
              <option value="project">プロジェクト</option>
              <option value="category">カテゴリ</option>
            </select>
          </div>
        </div>

        <div className="report-controls-row">
          <div className="form-group">
            <label className="form-label">プロジェクト</label>
            <div className="multi-select-wrapper" onMouseLeave={() => setProjectDropdownOpen(false)}>
              <button
                className="multi-select-trigger"
                onClick={() => { setProjectDropdownOpen(!projectDropdownOpen); setCategoryDropdownOpen(false); }}
              >
                {selectedProjects.length === 0 ? '全て' : `${selectedProjects.length}件選択`}
              </button>
              {projectDropdownOpen && (
                <div className="multi-select-dropdown">
                  {projectOptions.map(p => (
                    <label key={p} className="multi-select-option">
                      <input type="checkbox" checked={selectedProjects.includes(p)} onChange={() => toggleProject(p)} />
                      {p}
                    </label>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">カテゴリ</label>
            <div className="multi-select-wrapper" onMouseLeave={() => setCategoryDropdownOpen(false)}>
              <button
                className="multi-select-trigger"
                onClick={() => { setCategoryDropdownOpen(!categoryDropdownOpen); setProjectDropdownOpen(false); }}
              >
                {selectedCategories.length === 0 ? '全て' : `${selectedCategories.length}件選択`}
              </button>
              {categoryDropdownOpen && (
                <div className="multi-select-dropdown">
                  {categoryOptions.map(c => (
                    <label key={c} className="multi-select-option">
                      <input type="checkbox" checked={selectedCategories.includes(c)} onChange={() => toggleCategory(c)} />
                      {c}
                    </label>
                  ))}
                </div>
              )}
            </div>
          </div>

          {(selectedProjects.length > 0 || selectedCategories.length > 0) && (
            <div className="form-group">
              <label className="form-label">&nbsp;</label>
              <button
                className="btn btn-primary btn-reset-filters"
                onClick={() => { setSelectedProjects([]); setSelectedCategories([]); setProjectDropdownOpen(false); setCategoryDropdownOpen(false); }}
              >
                フィルタをリセット
              </button>
            </div>
          )}
        </div>
      </div>

      {error && <p className="report-error">{error}</p>}

      {summary && (
        <>
          <div className="report-chart-wrapper">
            <div style={{ position: 'relative', width: 450, height: 450 }}>
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={chartData}
                    cx="50%"
                    cy="50%"
                    innerRadius={140}
                    outerRadius={210}
                    paddingAngle={0}
                    dataKey="value"
                  >
                    {chartData.map((_, idx) => (
                      <Cell key={idx} fill={COLORS[idx % COLORS.length]} />
                    ))}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
              <div
                style={{
                  position: 'absolute',
                  top: '50%',
                  left: '50%',
                  transform: 'translate(-50%, -50%)',
                  textAlign: 'center',
                  pointerEvents: 'none',
                }}
              >
                <div style={{ fontSize: '28px', fontWeight: 700, color: '#ffffff' }}>
                  {formatDuration(summary.total_seconds)}
                </div>
                <div style={{ fontSize: '14px', color: '#a0d2d2', marginTop: 6 }}>
                  {groupBy === 'project' ? 'プロジェクト別' : 'カテゴリ別'}
                </div>
              </div>
            </div>
          </div>

          <div className="report-legend">
            {chartData.map((d, idx) => (
              <div key={d.name} className="report-legend-item">
                <span className="report-legend-color" style={{ backgroundColor: COLORS[idx % COLORS.length] }}></span>
                {d.name} — {formatDuration(d.value)}{' '}
                ({totalForPercent > 0 ? Math.round((d.value / totalForPercent) * 100) : 0}%)
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
