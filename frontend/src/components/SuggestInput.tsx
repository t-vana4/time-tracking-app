import { useState, useEffect, useRef } from 'react';
import { fetchSuggestions } from '../api';

interface Props {
  label: string;
  value: string;
  onChange: (value: string) => void;
  type: 'tasks' | 'projects' | 'categories';
  placeholder?: string;
  disabled?: boolean;
}

export default function SuggestInput({ label, value, onChange, type, placeholder, disabled }: Props) {
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [filtered, setFiltered] = useState<string[]>([]);
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchSuggestions(type).then(setSuggestions).catch(() => {});
  }, [type]);

  useEffect(() => {
    if (value) {
      const lower = value.toLowerCase();
      setFiltered(suggestions.filter(s => s.toLowerCase().includes(lower)));
    } else {
      setFiltered(suggestions);
    }
    setActiveIndex(-1);
  }, [value, suggestions]);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  useEffect(() => {
    if (activeIndex >= 0 && dropdownRef.current) {
      const item = dropdownRef.current.children[activeIndex] as HTMLElement;
      if (item) {
        item.scrollIntoView({ block: 'nearest' });
      }
    }
  }, [activeIndex]);

  function handleKeyDown(e: React.KeyboardEvent) {
    if (!open || filtered.length === 0) return;

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActiveIndex(prev => (prev < filtered.length - 1 ? prev + 1 : 0));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActiveIndex(prev => (prev > 0 ? prev - 1 : filtered.length - 1));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (activeIndex >= 0 && activeIndex < filtered.length) {
        onChange(filtered[activeIndex]);
        setOpen(false);
        setActiveIndex(-1);
      }
    } else if (e.key === 'Escape') {
      setOpen(false);
      setActiveIndex(-1);
    }
  }

  return (
    <div className="form-group">
      <label className="form-label">{label}</label>
      <div className="suggest-input-wrapper" ref={wrapperRef} onMouseLeave={() => setOpen(false)}>
        <input
          className="form-input"
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onFocus={() => setOpen(true)}
          onBlur={() => setTimeout(() => setOpen(false), 200)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          disabled={disabled}
          autoComplete="off"
          data-1p-ignore
        />
        {open && filtered.length > 0 && (
          <div className="suggest-dropdown" ref={dropdownRef}>
            {filtered.map((item, idx) => (
              <div
                key={item}
                className={`suggest-item${idx === activeIndex ? ' suggest-item-active' : ''}`}
                onMouseDown={() => {
                  onChange(item);
                  setOpen(false);
                  setActiveIndex(-1);
                }}
                onMouseEnter={() => setActiveIndex(idx)}
              >
                {item}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
