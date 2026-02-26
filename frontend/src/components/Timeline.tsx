import { useState, useEffect, useMemo } from 'react';
import { format, startOfWeek, addDays, addWeeks, subWeeks } from 'date-fns';
import { ja } from 'date-fns/locale';
import { fetchEntries, fetchSuggestions } from '../api';
import type { WorkEntry } from '../types';
import { buildColorMap } from '../colors';
import EntryModal from './EntryModal';

const HOURS_START = 8;
const HOURS_END = 22;
const HOUR_HEIGHT = 50;
const DAY_LABELS = ['月', '火', '水', '木', '金'];

function timeToMinutes(timeStr: string): number {
  const parts = timeStr.split(':').map(Number);
  return parts[0] * 60 + parts[1];
}

export default function Timeline() {
  const [weekStart, setWeekStart] = useState(() =>
    startOfWeek(new Date(), { weekStartsOn: 1 })
  );
  const [entries, setEntries] = useState<WorkEntry[]>([]);
  const [modalEntry, setModalEntry] = useState<WorkEntry | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [duplicateValues, setDuplicateValues] = useState<Partial<WorkEntry> | null>(null);
  const [selectedProjects, setSelectedProjects] = useState<string[]>([]);
  const [projectDropdownOpen, setProjectDropdownOpen] = useState(false);
  const [allCategories, setAllCategories] = useState<string[]>([]);

  const weekDates = useMemo(() => {
    return Array.from({ length: 5 }, (_, i) => addDays(weekStart, i));
  }, [weekStart]);

  const weekOfStr = format(weekStart, 'yyyy-MM-dd');

  useEffect(() => {
    loadEntries();
  }, [weekOfStr]);

  function loadEntries() {
    fetchEntries({ week_of: weekOfStr }).then(setEntries).catch(() => {});
    fetchSuggestions('categories').then(setAllCategories).catch(() => {});
  }

  const projectNames = useMemo(() => {
    return [...new Set(entries.map(e => e.project_name))];
  }, [entries]);

  const filteredEntries = useMemo(() => {
    if (selectedProjects.length === 0) return entries;
    return entries.filter(e => selectedProjects.includes(e.project_name));
  }, [entries, selectedProjects]);

  const entriesByDate = useMemo(() => {
    const map: Record<string, WorkEntry[]> = {};
    for (const e of filteredEntries) {
      if (!map[e.work_date]) map[e.work_date] = [];
      map[e.work_date].push(e);
    }
    return map;
  }, [filteredEntries]);

  const categoryColorMap = useMemo(() => buildColorMap(allCategories), [allCategories]);

  const hours = Array.from({ length: HOURS_END - HOURS_START + 1 }, (_, i) => HOURS_START + i);

  function getBlockStyle(entry: WorkEntry) {
    const startMin = timeToMinutes(entry.start_time);
    const endMin = timeToMinutes(entry.end_time);
    const topMin = Math.max(startMin, HOURS_START * 60) - HOURS_START * 60;
    const bottomMin = Math.min(endMin, HOURS_END * 60) - HOURS_START * 60;
    const top = (topMin / 60) * HOUR_HEIGHT;
    const height = Math.max(((bottomMin - topMin) / 60) * HOUR_HEIGHT, 18);
    const bg = categoryColorMap[entry.category] || '#a3c4e0';
    return { top: `${top}px`, height: `${height}px`, backgroundColor: bg };
  }

  function toggleProject(p: string) {
    setSelectedProjects(prev =>
      prev.includes(p) ? prev.filter(x => x !== p) : [...prev, p]
    );
  }

  const weekLabel = `${format(weekDates[0], 'yyyy/MM/dd')} - ${format(weekDates[4], 'yyyy/MM/dd')}`;

  return (
    <div>
      <div className="timeline-header">
        <div className="timeline-nav">
          <button className="btn btn-secondary btn-small" onClick={() => setWeekStart(subWeeks(weekStart, 1))}>
            前の週
          </button>
          <button className="btn btn-secondary btn-small" onClick={() => setWeekStart(startOfWeek(new Date(), { weekStartsOn: 1 }))}>
            今週
          </button>
          <button className="btn btn-secondary btn-small" onClick={() => setWeekStart(addWeeks(weekStart, 1))}>
            次の週
          </button>
        </div>
        <span className="timeline-week-label">{weekLabel}</span>
        <div className="form-group" style={{ marginLeft: 'auto', marginBottom: 0 }}>
          <div className="multi-select-wrapper" onMouseLeave={() => setProjectDropdownOpen(false)}>
            <button
              className="multi-select-trigger"
              onClick={() => setProjectDropdownOpen(!projectDropdownOpen)}
            >
              {selectedProjects.length === 0 ? 'プロジェクト: 全て' : `プロジェクト: ${selectedProjects.length}件選択`}
            </button>
            {projectDropdownOpen && (
              <div className="multi-select-dropdown">
                {projectNames.map(p => (
                  <label key={p} className="multi-select-option">
                    <input type="checkbox" checked={selectedProjects.includes(p)} onChange={() => toggleProject(p)} />
                    {p}
                  </label>
                ))}
              </div>
            )}
          </div>
        </div>
        <button className="btn btn-primary btn-small" onClick={() => setShowAddModal(true)}>
          追加
        </button>
      </div>

      <div className="timeline-grid">
        {/* Header row */}
        <div className="timeline-corner"></div>
        {weekDates.map((d, i) => (
          <div key={i} className="timeline-day-header">
            {format(d, 'M/d', { locale: ja })}（{DAY_LABELS[i]}）
          </div>
        ))}

        {/* Hour rows */}
        {hours.map((hour) => (
          <div key={hour} style={{ display: 'contents' }}>
            <div className="timeline-time-label">{`${hour}:00`}</div>
            {weekDates.map((d, di) => (
              <div key={di} className="timeline-day-column">
                {hour === HOURS_START &&
                  (entriesByDate[format(d, 'yyyy-MM-dd')] || []).map((entry) => (
                    <div
                      key={entry.id}
                      className="timeline-block"
                      style={getBlockStyle(entry)}
                      onClick={() => setModalEntry(entry)}
                    >
                      <div className="timeline-block-task">{entry.task_name}</div>
                      <div className="timeline-block-time">
                        {entry.start_time.slice(0, 5)}-{entry.end_time.slice(0, 5)}
                      </div>
                    </div>
                  ))}
              </div>
            ))}
          </div>
        ))}
      </div>

      {modalEntry && (
        <EntryModal
          entry={modalEntry}
          onClose={() => setModalEntry(null)}
          onSaved={loadEntries}
          onDuplicate={(e) => {
            setModalEntry(null);
            setDuplicateValues({
              task_name: e.task_name,
              project_name: e.project_name,
              category: e.category,
              work_date: format(new Date(), 'yyyy-MM-dd'),
              start_time: e.start_time,
              end_time: e.end_time,
            });
          }}
        />
      )}
      {showAddModal && (
        <EntryModal entry={null} onClose={() => setShowAddModal(false)} onSaved={loadEntries} />
      )}
      {duplicateValues && (
        <EntryModal
          entry={null}
          defaultValues={duplicateValues}
          onClose={() => setDuplicateValues(null)}
          onSaved={loadEntries}
        />
      )}
    </div>
  );
}
