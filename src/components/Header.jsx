import React from 'react';
import { Bell } from 'lucide-react';
import { getSystemTimeContext } from '../utils/dateTime';

export default function Header({ activeTab, systemTime }) {
  const getTabTitle = () => {
    switch (activeTab) {
      case 'mission': return 'MISSION CONTROL';
      case 'memory': return 'MEMORY STORE';
      case 'knowledge': return 'KNOWLEDGE BASE & RAG';
      case 'planner': return 'EXAM REVISION PLANNER';
      case 'quiz': return 'ADAPTIVE QUIZ MODE';
      case 'settings': return 'SYSTEM SETTINGS';
      default: return 'MISSION CONTROL';
    }
  };

  const timeCtx = getSystemTimeContext(systemTime);
  const formattedDate = timeCtx.display_date;


  return (
    <header style={{
      height: '54px',
      borderBottom: '1px solid var(--border-color)',
      backgroundColor: 'rgba(9, 13, 22, 0.8)',
      backdropFilter: 'blur(12px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '0 28px',
      position: 'sticky',
      top: 0,
      zIndex: 30
    }}>
      {/* Breadcrumb */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '11px', letterSpacing: '0.08em', fontWeight: 600 }}>
        <span style={{ color: 'var(--text-muted)' }}>ASTRA</span>
        <span style={{ color: 'var(--text-muted)' }}>/</span>
        <span style={{ color: 'var(--text-primary)' }}>{getTabTitle()}</span>
      </div>

      {/* Right controls */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
        {/* System sync indicator */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          fontSize: '11px',
          color: 'var(--text-secondary)',
          background: 'rgba(255, 255, 255, 0.03)',
          border: '1px solid rgba(255, 255, 255, 0.05)',
          padding: '4px 12px',
          borderRadius: '16px'
        }}>
          <span className="live-dot"></span>
          <span>All systems synced</span>
        </div>

        {/* Notification bell */}
        <button style={{
          background: 'transparent',
          border: 'none',
          color: 'var(--text-secondary)',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          padding: '6px',
          borderRadius: '6px',
          transition: 'color 0.2s'
        }}
        onMouseEnter={(e) => e.currentTarget.style.color = '#fff'}
        onMouseLeave={(e) => e.currentTarget.style.color = 'var(--text-secondary)'}
        title="Notifications"
        >
          <Bell size={16} />
        </button>

        {/* Date string */}
        <div style={{ 
          fontSize: '11px', 
          fontFamily: 'var(--font-mono)', 
          fontWeight: 600, 
          color: 'var(--text-muted)',
          letterSpacing: '0.05em'
        }}>
          {formattedDate}
        </div>
      </div>
    </header>
  );
}
