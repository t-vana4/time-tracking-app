import { useState, useRef, useCallback, useEffect } from 'react';
import { createEntry } from '../api';
import SuggestInput from './SuggestInput';

function formatTime(totalSeconds: number): string {
  const h = Math.floor(totalSeconds / 3600);
  const m = Math.floor((totalSeconds % 3600) / 60);
  const s = totalSeconds % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

export default function TimeTracker() {
  const [taskName, setTaskName] = useState('');
  const [projectName, setProjectName] = useState('');
  const [category, setCategory] = useState('');
  const [tracking, setTracking] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const startTimeRef = useRef<Date | null>(null);

  const canStart = taskName.trim() && projectName.trim() && category.trim();

  const progress = (elapsed % 3600) / 3600;
  const circumference = 2 * Math.PI * 220;
  const strokeDashoffset = circumference * (1 - progress);

  const tick = useCallback(() => {
    if (startTimeRef.current) {
      const now = new Date();
      setElapsed(Math.floor((now.getTime() - startTimeRef.current.getTime()) / 1000));
    }
  }, []);

  useEffect(() => {
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, []);

  function handleStart() {
    if (!canStart) return;
    startTimeRef.current = new Date();
    setElapsed(0);
    setTracking(true);
    intervalRef.current = setInterval(tick, 1000);
  }

  async function handleStop() {
    if (intervalRef.current) clearInterval(intervalRef.current);
    intervalRef.current = null;
    setTracking(false);

    if (!startTimeRef.current) return;

    const startDate = startTimeRef.current;
    const endDate = new Date();

    const workDate = startDate.toISOString().slice(0, 10);
    const startTimeStr = startDate.toTimeString().slice(0, 8);
    const endTimeStr = endDate.toTimeString().slice(0, 8);

    try {
      await createEntry({
        task_name: taskName,
        project_name: projectName,
        category,
        work_date: workDate,
        start_time: startTimeStr,
        end_time: endTimeStr,
      });
      setTaskName('');
      setProjectName('');
      setCategory('');
      setElapsed(0);
    } catch {
      alert('保存に失敗しました');
    }
  }

  return (
    <div className="tracker-container">
      <div className="tracker-form">
        <SuggestInput
          label="タスク名"
          value={taskName}
          onChange={setTaskName}
          type="tasks"
          placeholder="タスク名を入力"
          disabled={tracking}
        />
        <SuggestInput
          label="プロジェクト名"
          value={projectName}
          onChange={setProjectName}
          type="projects"
          placeholder="プロジェクト名を入力"
          disabled={tracking}
        />
        <SuggestInput
          label="カテゴリ"
          value={category}
          onChange={setCategory}
          type="categories"
          placeholder="カテゴリを入力"
          disabled={tracking}
        />
      </div>

      <div className="tracker-circle-wrapper">
        <svg width="500" height="500" viewBox="0 0 500 500">
          <circle
            cx="250"
            cy="250"
            r="220"
            fill="none"
            stroke="rgba(255,255,255,0.08)"
            strokeWidth="12"
          />
          <circle
            cx="250"
            cy="250"
            r="220"
            fill="none"
            stroke="url(#tealGrad)"
            strokeWidth="12"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            transform="rotate(-90 250 250)"
            style={{ transition: 'stroke-dashoffset 1s linear' }}
          />
          <defs>
            <linearGradient id="tealGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#2d8a8a" />
              <stop offset="100%" stopColor="#5ec4c4" />
            </linearGradient>
          </defs>
        </svg>
        <span className="tracker-time-display">{formatTime(elapsed)}</span>
      </div>

      <div className="tracker-buttons">
        {!tracking ? (
          <button
            className="btn btn-start"
            onClick={handleStart}
            disabled={!canStart}
          >
            スタート
          </button>
        ) : (
          <button className="btn btn-stop" onClick={handleStop}>
            ストップ
          </button>
        )}
      </div>
    </div>
  );
}
