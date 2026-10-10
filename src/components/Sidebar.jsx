import React from 'react';
import { 
  LayoutDashboard, 
  BrainCircuit, 
  BookOpen, 
  CalendarDays, 
  HelpCircle, 
  Settings, 
  ChevronRight,
  Atom
} from 'lucide-react';

export default function Sidebar({ activeTab, setActiveTab, memoryCount = 3 }) {
  const navItems = [
    { id: 'mission', label: 'Mission Control', icon: LayoutDashboard },
    { id: 'memory', label: 'Memory', icon: BrainCircuit, badge: memoryCount },
    { id: 'knowledge', label: 'Knowledge', icon: BookOpen },
    { id: 'planner', label: 'Planner', icon: CalendarDays },
    { id: 'quiz', label: 'Quizmode', icon: HelpCircle },
  ];

  return (
    <aside style={{
      width: '240px',
      backgroundColor: 'var(--bg-sidebar)',
      borderRight: '1px solid var(--border-color)',
      display: 'flex',
      flexDirection: 'column',
      justify: 'space-between',
      height: '100vh',
      position: 'sticky',
      top: 0,
      zIndex: 40,
      padding: '24px 16px',
      flexShrink: 0
    }}>
      <div>
        {/* Brand Header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '32px', paddingLeft: '8px' }}>
          <div style={{
            width: '32px',
            height: '32px',
            borderRadius: '8px',
            background: 'radial-gradient(circle, rgba(0,242,254,0.3) 0%, rgba(0,242,254,0.05) 100%)',
            border: '1px solid rgba(0,242,254,0.4)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'var(--cyan-primary)',
            boxShadow: '0 0 12px rgba(0,242,254,0.2)'
          }}>
            <Atom size={20} className="text-cyan-glow" />
          </div>
          <div>
            <div style={{ 
              fontFamily: 'var(--font-display)', 
              fontWeight: 700, 
              fontSize: '16px', 
              letterSpacing: '0.05em',
              color: '#fff' 
            }}>
              ASTRA
            </div>
            <div style={{ fontSize: '10px', letterSpacing: '0.12em', color: 'var(--text-muted)', fontWeight: 600 }}>
              STUDY OS
            </div>
          </div>
        </div>

        {/* Workspace Section */}
        <div style={{ marginBottom: '24px' }}>
          <div style={{ 
            fontSize: '11px', 
            fontWeight: 700, 
            letterSpacing: '0.1em', 
            color: 'var(--text-muted)', 
            marginBottom: '12px',
            paddingLeft: '8px'
          }}>
            WORKSPACE
          </div>

          <nav style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            {navItems.map(item => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    width: '100%',
                    padding: '10px 12px',
                    borderRadius: '8px',
                    border: isActive ? '1px solid rgba(0,242,254,0.3)' : '1px solid transparent',
                    background: isActive ? 'rgba(0, 242, 254, 0.08)' : 'transparent',
                    color: isActive ? '#fff' : 'var(--text-secondary)',
                    fontWeight: isActive ? 600 : 400,
                    fontSize: '13px',
                    cursor: 'pointer',
                    transition: 'all 0.18s ease'
                  }}
                  onMouseEnter={(e) => {
                    if (!isActive) {
                      e.currentTarget.style.background = 'rgba(255,255,255,0.03)';
                      e.currentTarget.style.color = '#fff';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!isActive) {
                      e.currentTarget.style.background = 'transparent';
                      e.currentTarget.style.color = 'var(--text-secondary)';
                    }
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <Icon size={17} color={isActive ? 'var(--cyan-primary)' : 'var(--text-muted)'} />
                    <span>{item.label}</span>
                  </div>

                  {item.badge !== undefined && (
                    <span style={{
                      backgroundColor: isActive ? 'var(--cyan-primary)' : '#1e293b',
                      color: isActive ? '#000' : 'var(--cyan-primary)',
                      fontSize: '11px',
                      fontWeight: 700,
                      borderRadius: '10px',
                      padding: '2px 7px',
                      minWidth: '20px',
                      textAlign: 'center'
                    }}>
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Account Section */}
        <div>
          <div style={{ 
            fontSize: '11px', 
            fontWeight: 700, 
            letterSpacing: '0.1em', 
            color: 'var(--text-muted)', 
            marginBottom: '12px',
            paddingLeft: '8px'
          }}>
            ACCOUNT
          </div>
          <button
            onClick={() => setActiveTab('settings')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              width: '100%',
              padding: '10px 12px',
              borderRadius: '8px',
              border: activeTab === 'settings' ? '1px solid rgba(0,242,254,0.3)' : '1px solid transparent',
              background: activeTab === 'settings' ? 'rgba(0, 242, 254, 0.08)' : 'transparent',
              color: activeTab === 'settings' ? '#fff' : 'var(--text-secondary)',
              fontSize: '13px',
              cursor: 'pointer',
              transition: 'all 0.18s ease'
            }}
          >
            <Settings size={17} color={activeTab === 'settings' ? 'var(--cyan-primary)' : 'var(--text-muted)'} />
            <span>Settings</span>
          </button>
        </div>
      </div>

      {/* User Account Footer Card */}
      <div style={{
        paddingTop: '16px',
        borderTop: '1px solid var(--border-color)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        cursor: 'pointer'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{
            width: '32px',
            height: '32px',
            borderRadius: '50%',
            background: 'linear-gradient(135deg, #d97706 0%, #b45309 100%)',
            color: '#fff',
            fontWeight: 700,
            fontSize: '13px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            border: '1px solid rgba(255,255,255,0.2)'
          }}>
            Y
          </div>
          <div>
            <div style={{ fontSize: '13px', fontWeight: 600, color: '#fff' }}>Yuna</div>
            <div style={{ fontSize: '10px', color: 'var(--text-muted)' }}>Student account</div>
          </div>
        </div>
        <ChevronRight size={14} color="var(--text-muted)" />
      </div>
    </aside>
  );
}
