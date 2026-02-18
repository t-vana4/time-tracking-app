import { useState } from 'react';
import type { TabName } from './types';
import TimeTracker from './components/TimeTracker';
import Timeline from './components/Timeline';
import Report from './components/Report';
import DataManagement from './components/DataManagement';

const tabs: { key: TabName; label: string }[] = [
  { key: 'tracker', label: 'タイムトラッカー' },
  { key: 'timeline', label: 'タイムライン' },
  { key: 'report', label: 'レポート' },
  { key: 'data', label: 'データ管理' },
];

function App() {
  const [activeTab, setActiveTab] = useState<TabName>('tracker');

  return (
    <div className="app">
      <header className="app-header">
        <h1 className="app-title">Time Tracking</h1>
        <nav className="tab-nav">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              className={`tab-button ${activeTab === tab.key ? 'active' : ''}`}
              onClick={() => setActiveTab(tab.key)}
            >
              {tab.label}
            </button>
          ))}
        </nav>
      </header>
      <main className="app-main">
        <div style={{ display: activeTab === 'tracker' ? 'block' : 'none' }}><TimeTracker /></div>
        <div style={{ display: activeTab === 'timeline' ? 'block' : 'none' }}><Timeline /></div>
        <div style={{ display: activeTab === 'report' ? 'block' : 'none' }}><Report /></div>
        <div style={{ display: activeTab === 'data' ? 'block' : 'none' }}><DataManagement /></div>
      </main>
    </div>
  );
}

export default App;
