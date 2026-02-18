import { useState, useEffect, useMemo } from 'react';
import { format, startOfWeek, addDays, addWeeks, subWeeks } from 'date-fns';
import { ja } from 'date-fns/locale';
import { fetchEntries } from '../api';
import type { WorkEntry } from '../types';
import EntryModal from './EntryModal';

const HOURS_START = 6;
const HOURS_END = 22;
const HOUR_HEIGHT = 50;
const DAY_LABELS = ['月', '火', '水', '木', '金'];

const PROJECT_COLORS = [
  '#2d8a8a', '#8a6b2d', '#5e2d8a', '#8a2d5e', '#2d5e8a',
  '#6b8a2d', '#8a2d2d', '#2d8a6b', '#5e8a2d', '#8a5e2d',
];

function getProjectColor(name: string, projectList: string[]): string {
  const idx = projectList.indexOf(name);
  return PROJECT_COLORS[idx % PROJECT_COLORS.length];
}

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

  const weekDates = useMemo(() => {
    return Array.from({ length: 5 }, (_, i) => addDays(weekStart, i));
  }, [weekStart]);

  const weekOfStr = format(weekStart, 'yyyy-MM-dd');

  useEffect(() => {
    loadEntries();
  }, [weekOfStr]);

  function loadEntries() {
    fetchEntries({ week_of: weekOfStr }).then(setEntries).catch(() => {});
  }

  const projectNames = useMemo(() => {
    return [...new Set(entries.map(e => e.project_name))];
  }, [entries]);

  const entriesByDate = useMemo(() => {
    const map: Record<string, WorkEntry[]> = {};
    for (const e of entries) {
      if (!map[e.work_date]) map[e.work_date] = [];
      map[e.work_date].push(e);
    }
    return map;
  }, [entries]);

  const hours = Array.from({ length: HOURS_END - HOURS_START + 1 }, (_, i) => HOURS_START + i);

  function getBlockStyle(entry: WorkEntry) {
    const startMin = timeToMinutes(entry.start_time);
    const endMin = timeToMinutes(entry.end_time);
    const topMin = Math.max(startMin, HOURS_START * 60) - HOURS_START * 60;
    const bottomMin = Math.min(endMin, HOURS_END * 60) - HOURS_START * 60;
    const top = (topMin / 60) * HOUR_HEIGHT;
    const height = Math.max(((bottomMin - topMin) / 60) * HOUR_HEIGHT, 18);
    const bg = getProjectColor(entry.project_name, projectNames);
    return { top: `${top}px`, height: `${height}px`, backgroundColor: bg };
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
        <button className="btn btn-primary btn-small" style={{ marginLeft: 'auto' }} onClick={() => setShowAddModal(true)}>
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
