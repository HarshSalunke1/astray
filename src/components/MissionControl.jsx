import React, { useState, useRef, useEffect } from 'react';
import { 
  ArrowUpRight, 
  Plus, 
  Mic, 
  MicOff, 
  Send, 
  Activity, 
  ChevronRight,
  Sparkles,
  Zap,
  Loader2,
  Cpu,
  Brain,
  BookOpen,
  Calendar,
  CheckCircle2,
  Terminal
} from 'lucide-react';
import { audioEngine } from '../utils/audioEngine';
import { getSystemTimeContext } from '../utils/dateTime';

export default function MissionControl({ 
  schedule, 
  tasks, 
  setTasks, 
  recentActivity, 
  studyProgress, 
  setActiveTab,
  chatHistory,
  handleSendChatMessage,
  aiStatus,
  systemTime
}) {
  const timeCtx = getSystemTimeContext(systemTime);

  const [inputText, setInputText] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [showAddTaskModal, setShowAddTaskModal] = useState(false);
  const chatScrollRef = useRef(null);

  useEffect(() => {
    if (chatScrollRef.current) {
      chatScrollRef.current.scrollTop = chatScrollRef.current.scrollHeight;
    }
  }, [chatHistory, aiStatus]);

  const toggleTask = async (id) => {
    try {
      const res = await fetch(`http://localhost:8000/api/tasks/${id}/toggle`, { method: 'PUT' });
      if (res.ok) {
        setTasks(prev => prev.map(t => t.id === id ? { ...t, completed: !t.completed } : t));
      }
    } catch (e) {
      setTasks(prev => prev.map(t => t.id === id ? { ...t, completed: !t.completed } : t));
    }
  };

  const onSubmitMessage = (textOverride) => {
    const text = textOverride || inputText;
    if (!text.trim()) return;
    handleSendChatMessage(text);
    setInputText('');
  };

  const handleVoiceToggle = () => {
    if (isListening) {
      audioEngine.stopListening();
      setIsListening(false);
    } else {
      setIsListening(true);
      audioEngine.startListening(
        (transcript, isFinal) => {
          setInputText(transcript);
          if (isFinal) {
            setIsListening(false);
            onSubmitMessage(transcript);
          }
        },
        (err) => {
          setIsListening(false);
          console.error("Speech error:", err);
        }
      );
    }
  };

  const handleAddTask = async (e) => {
    e.preventDefault();
    if (!newTaskTitle.trim()) return;
    
    try {
      const res = await fetch("http://localhost:8000/api/tasks", {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: newTaskTitle })
      });
      if (res.ok) {
        const data = await res.json();
        setTasks(prev => [
          ...prev,
          { id: data.task_id, title: newTaskTitle, subtext: 'DBMS · 1 hour', completed: false, accent: '#00f2fe' }
        ]);
      }
    } catch (e) {
      setTasks(prev => [
        ...prev,
        { id: 'task-' + Date.now(), title: newTaskTitle, subtext: 'DBMS · 1 hour', completed: false, accent: '#00f2fe' }
      ]);
    }

    setNewTaskTitle('');
    setShowAddTaskModal(false);
  };

  // SVG Gauge calculations
  const radius = 52;
  const strokeWidth = 8;
  const normalizedRadius = radius - strokeWidth * 0.5;
  const circumference = normalizedRadius * 2 * Math.PI;
  const strokeDashoffset = circumference - (studyProgress / 100) * circumference;

  return (
    <div style={{ padding: '28px 28px', maxWidth: '1280px', margin: '0 auto' }}>
      
      {/* 1. HERO: ASTRA VOICE & AI COMMAND CENTER (Full 12 Columns Span) */}
      <div className="glass-panel" style={{ 
        padding: '24px 28px', 
        marginBottom: '28px',
        border: '1px solid rgba(0, 242, 254, 0.3)',
        background: 'linear-gradient(135deg, rgba(16,21,36,0.95) 0%, rgba(11,15,27,0.95) 100%)',
        boxShadow: '0 12px 36px -10px rgba(0, 242, 254, 0.15)'
      }}>
        {/* Header Bar */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{
              width: '28px',
              height: '28px',
              borderRadius: '8px',
              background: 'rgba(0,242,254,0.15)',
              border: '1px solid var(--cyan-primary)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--cyan-primary)'
            }}>
              <Terminal size={16} className="text-cyan-glow" />
            </div>
            <div>
              <span style={{ fontSize: '12px', fontWeight: 700, letterSpacing: '0.1em', color: 'var(--cyan-primary)' }}>
                ASTRA AI COMMAND CENTER
              </span>
              <span style={{ fontSize: '11px', color: 'var(--text-muted)', marginLeft: '10px' }}>
                FastAPI Backend • SQLite Personal DB • RAG Vector Pipeline
              </span>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            {/* Live Status Badge */}
            <div style={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: '6px', 
              fontSize: '11px', 
              color: aiStatus !== 'Online' && aiStatus !== 'Responding...' ? 'var(--cyan-primary)' : 'var(--emerald-accent)',
              fontWeight: 600,
              background: 'rgba(255,255,255,0.03)',
              padding: '4px 10px',
              borderRadius: '12px',
              border: '1px solid rgba(255,255,255,0.06)'
            }}>
              {aiStatus !== 'Online' && aiStatus !== 'Responding...' ? (
                <Loader2 size={13} className="spin" />
              ) : (
                <span className="live-dot" style={{ width: '6px', height: '6px' }}></span>
              )}
              <span>{aiStatus}</span>
            </div>
          </div>
        </div>

        {/* Live Conversation Window */}
        <div 
          ref={chatScrollRef}
          style={{ 
            minHeight: '150px', 
            maxHeight: '220px', 
            overflowY: 'auto', 
            marginBottom: '16px',
            paddingRight: '8px',
            display: 'flex',
            flexDirection: 'column',
            gap: '12px'
          }}
        >
          {chatHistory.map((msg, idx) => (
            <div key={idx} style={{
              display: 'flex',
              gap: '12px',
              alignItems: 'flex-start',
              justify: msg.sender === 'user' ? 'flex-end' : 'flex-start'
            }}>
              {msg.sender === 'astra' && (
                <div style={{
                  width: '30px',
                  height: '30px',
                  borderRadius: '8px',
                  background: 'linear-gradient(135deg, rgba(0, 242, 254, 0.2) 0%, rgba(56, 189, 248, 0.2) 100%)',
                  border: '1px solid rgba(0, 242, 254, 0.4)',
                  color: 'var(--cyan-primary)',
                  fontSize: '13px',
                  fontWeight: 700,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0
                }}>
                  A
                </div>
              )}

              <div style={{
                background: msg.sender === 'user' ? 'rgba(0, 242, 254, 0.12)' : 'rgba(255, 255, 255, 0.04)',
                border: msg.sender === 'user' ? '1px solid rgba(0, 242, 254, 0.3)' : '1px solid rgba(255, 255, 255, 0.08)',
                borderRadius: '12px',
                padding: '12px 16px',
                maxWidth: '82%',
                color: '#fff',
                fontSize: '13.5px',
                lineHeight: '1.5'
              }}>
                <div>{msg.text}</div>

                {/* Executed Action Badge */}
                {msg.action_executed && (
                  <div style={{
                    marginTop: '8px',
                    padding: '5px 10px',
                    background: 'rgba(168, 85, 247, 0.15)',
                    border: '1px solid rgba(168, 85, 247, 0.3)',
                    borderRadius: '6px',
                    fontSize: '11px',
                    color: '#c084fc',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px'
                  }}>
                    <Zap size={13} />
                    <span>Action Executed: {msg.action_executed.detail}</span>
                  </div>
                )}

                {/* Grounded Citations */}
                {msg.citations && msg.citations.length > 0 && (
                  <div style={{ marginTop: '8px', paddingTop: '6px', borderTop: '1px solid rgba(255,255,255,0.08)' }}>
                    {msg.citations.map((c, i) => (
                      <div key={i} style={{ fontSize: '11px', color: 'var(--cyan-primary)', fontFamily: 'var(--font-mono)' }}>
                        📄 Source Citation: {c}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Audio Waveform Indicator */}
        {(isListening || audioEngine.isSpeaking) && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '14px', justifyContent: 'center' }}>
            <span style={{ fontSize: '12px', color: 'var(--cyan-primary)', fontWeight: 600 }}>
              {isListening ? '🎙 Listening to voice input...' : '🔊 ASTRA Speaking...'}
            </span>
            <div className="audio-bar" />
            <div className="audio-bar" />
            <div className="audio-bar" />
            <div className="audio-bar" />
            <div className="audio-bar" />
          </div>
        )}

        {/* AI Command Input Bar */}
        <div style={{ 
          display: 'flex', 
          alignItems: 'center', 
          background: 'var(--bg-input)', 
          border: '1px solid var(--border-glow)',
          borderRadius: '12px',
          padding: '8px 16px',
          boxShadow: '0 0 16px rgba(0, 242, 254, 0.1)'
        }}>
          <input 
            type="text" 
            placeholder="Command ASTRA (e.g. 'What do I have today?', 'Remember DBMS exam Friday', 'Explain BCNF', 'Sync calendar')..."
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && onSubmitMessage()}
            style={{
              flex: 1,
              background: 'transparent',
              border: 'none',
              color: '#fff',
              fontSize: '14px',
              outline: 'none'
            }}
          />

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <button 
              onClick={handleVoiceToggle}
              style={{
                background: isListening ? 'rgba(239, 68, 68, 0.25)' : 'rgba(255,255,255,0.05)',
                border: isListening ? '1px solid #ef4444' : '1px solid rgba(255,255,255,0.1)',
                color: isListening ? '#ef4444' : 'var(--cyan-primary)',
                cursor: 'pointer',
                padding: '8px 12px',
                borderRadius: '8px',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                fontSize: '12px',
                fontWeight: 600
              }}
              title="Toggle Voice Input"
            >
              {isListening ? <MicOff size={15} /> : <Mic size={15} />}
              <span>{isListening ? 'Listening' : 'Voice'}</span>
            </button>

            <button 
              onClick={() => onSubmitMessage()}
              className="btn-cyan"
              style={{ padding: '8px 16px', fontSize: '13px' }}
            >
              <Send size={14} />
              <span>Execute</span>
            </button>
          </div>
        </div>

        {/* Action Engine Presets */}
        <div style={{ display: 'flex', gap: '8px', marginTop: '14px', flexWrap: 'wrap', alignItems: 'center' }}>
          <span style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 600, letterSpacing: '0.05em' }}>
            COMMAND PRESETS:
          </span>
          {[
            { label: '📅 What do I have today?', text: 'What do I have planned for today?' },
            { label: '🧠 Remember DBMS exam date', text: 'Remember that DBMS final exam is next Friday' },
            { label: '📚 Explain BCNF from notes', text: 'explain normalization and BCNF according to my DBMS notes' },
            { label: '🗓 Make 5-Day Revision Plan', text: 'Make me a 5-day revision plan for DBMS' },
            { label: '⚡ Add revision to calendar', text: 'Add today\'s DBMS revision to my calendar' },
            { label: '🔄 Reschedule missed session', text: 'I didn\'t finish yesterday\'s revision, reschedule my plan' }
          ].map((chip, idx) => (
            <button
              key={idx}
              onClick={() => onSubmitMessage(chip.text)}
              style={{
                background: 'rgba(255,255,255,0.03)',
                border: '1px solid rgba(255,255,255,0.07)',
                color: 'var(--text-secondary)',
                borderRadius: '6px',
                padding: '4px 10px',
                fontSize: '11px',
                cursor: 'pointer',
                transition: 'all 0.15s'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = 'var(--cyan-primary)';
                e.currentTarget.style.color = '#fff';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = 'rgba(255,255,255,0.07)';
                e.currentTarget.style.color = 'var(--text-secondary)';
              }}
            >
              {chip.label}
            </button>
          ))}
        </div>

      </div>

      {/* 2. DASHBOARD GRID (Schedule, Focus Health, Tasks, Activity) */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(12, 1fr)',
        gap: '24px'
      }}>
        
        {/* Left Column: Today's Rhythm (Timeline) - 6 cols */}
        <div style={{ gridColumn: 'span 6' }} className="glass-panel">
          <div style={{ padding: '24px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
              <span style={{ fontSize: '11px', fontWeight: 700, letterSpacing: '0.1em', color: 'var(--text-muted)' }}>
                TODAY'S RHYTHM
              </span>
              <button 
                onClick={() => setActiveTab('planner')}
                style={{ 
                  background: 'none', 
                  border: 'none', 
                  color: 'var(--text-secondary)', 
                  fontSize: '12px', 
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px'
                }}
              >
                <span>Open calendar</span>
                <ArrowUpRight size={14} />
              </button>
            </div>

            <h2 style={{ fontSize: '20px', fontWeight: 700, color: '#fff', marginBottom: '24px' }}>
              {timeCtx.today_schedule_header}
            </h2>

            {/* Timeline */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', position: 'relative' }}>
              <div style={{
                position: 'absolute',
                left: '120px',
                top: '12px',
                bottom: '12px',
                width: '1px',
                background: '#1e293b',
                zIndex: 1
              }} />

              {schedule.map((item) => (
                <div 
                  key={item.id} 
                  style={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    justify: 'space-between', 
                    zIndex: 2,
                    padding: '8px 12px',
                    borderRadius: '8px',
                    transition: 'background 0.2s ease'
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.02)'}
                  onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                >
                  <div style={{ width: '100px', flexShrink: 0 }}>
                    <div style={{ fontSize: '13px', fontWeight: 700, color: '#fff' }}>{item.time}</div>
                    <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{item.duration}</div>
                  </div>

                  <div style={{
                    width: '10px',
                    height: '10px',
                    borderRadius: '50%',
                    backgroundColor: item.dot_color || item.dotColor || '#00f2fe',
                    boxShadow: `0 0 10px ${item.dot_color || item.dotColor || '#00f2fe'}`,
                    marginRight: '20px',
                    flexShrink: 0
                  }} />

                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: '14px', fontWeight: 600, color: '#fff' }}>{item.title}</div>
                    <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{item.location}</div>
                  </div>

                  <ChevronRight size={16} color="var(--text-muted)" />
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Column Top: Study Progress Ring - 6 cols */}
        <div style={{ gridColumn: 'span 6' }} className="glass-panel">
          <div style={{ padding: '24px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
              <span style={{ fontSize: '11px', fontWeight: 700, letterSpacing: '0.1em', color: 'var(--text-muted)' }}>
                FOCUS HEALTH
              </span>
              <Activity size={16} color="var(--cyan-primary)" />
            </div>

            <h2 style={{ fontSize: '20px', fontWeight: 700, color: '#fff', marginBottom: '20px' }}>
              Study progress
            </h2>

            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', margin: '16px 0' }}>
              <div style={{ position: 'relative', width: '130px', height: '130px' }}>
                <svg height="130" width="130" style={{ transform: 'rotate(-90deg)' }}>
                  <circle
                    stroke="#1e293b"
                    fill="transparent"
                    strokeWidth={strokeWidth}
                    r={normalizedRadius}
                    cx="65"
                    cy="65"
                  />
                  <circle
                    stroke="url(#cyanGlowGrad)"
                    fill="transparent"
                    strokeWidth={strokeWidth}
                    strokeDasharray={circumference + ' ' + circumference}
                    style={{ strokeDashoffset, transition: 'stroke-dashoffset 0.8s ease' }}
                    strokeLinecap="round"
                    r={normalizedRadius}
                    cx="65"
                    cy="65"
                  />
                  <defs>
                    <linearGradient id="cyanGlowGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stopColor="#00f2fe" />
                      <stop offset="100%" stopColor="#38bdf8" />
                    </linearGradient>
                  </defs>
                </svg>

                <div style={{
                  position: 'absolute',
                  top: 0, left: 0, right: 0, bottom: 0,
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justify: 'center'
                }}>
                  <div style={{ fontSize: '26px', fontWeight: 700, color: '#fff', fontFamily: 'var(--font-display)' }}>
                    {studyProgress}<span style={{ fontSize: '16px', color: 'var(--cyan-primary)' }}>%</span>
                  </div>
                  <div style={{ fontSize: '10px', color: 'var(--text-muted)', fontWeight: 600, letterSpacing: '0.05em' }}>
                    DBMS
                  </div>
                </div>
              </div>

              <div style={{ marginTop: '16px', textAlign: 'center' }}>
                <div style={{ fontSize: '14px', fontWeight: 600, color: '#fff', marginBottom: '4px' }}>
                  You're building momentum.
                </div>
                <div style={{ fontSize: '12px', color: 'var(--text-secondary)', maxWidth: '340px' }}>
                  Normalization needs a little more attention before Friday.
                </div>
              </div>

              <button 
                onClick={() => setActiveTab('planner')}
                className="btn-secondary"
                style={{ marginTop: '16px', fontSize: '12px' }}
              >
                <span>View study plan</span>
                <ArrowUpRight size={13} />
              </button>
            </div>
          </div>
        </div>

        {/* Pending Tasks Section - 6 cols */}
        <div style={{ gridColumn: 'span 6' }} className="glass-panel">
          <div style={{ padding: '24px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
              <span style={{ fontSize: '11px', fontWeight: 700, letterSpacing: '0.1em', color: 'var(--text-muted)' }}>
                IN THE QUEUE
              </span>
              <button 
                onClick={() => setShowAddTaskModal(true)}
                style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer' }}
                title="Add task"
              >
                <Plus size={18} />
              </button>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '20px' }}>
              <h2 style={{ fontSize: '20px', fontWeight: 700, color: '#fff' }}>
                Pending tasks
              </h2>
              <span style={{
                background: '#1e293b',
                color: 'var(--cyan-primary)',
                fontSize: '11px',
                fontWeight: 700,
                borderRadius: '10px',
                padding: '1px 8px'
              }}>
                {tasks.filter(t => !t.completed).length}
              </span>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {tasks.map(task => (
                <div 
                  key={task.id}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justify: 'space-between',
                    padding: '12px 14px',
                    borderRadius: '8px',
                    background: 'rgba(255,255,255,0.02)',
                    border: '1px solid rgba(255,255,255,0.04)'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <input 
                      type="checkbox" 
                      className="custom-checkbox"
                      checked={Boolean(task.completed)} 
                      onChange={() => toggleTask(task.id)}
                    />
                    <div>
                      <div style={{ 
                        fontSize: '13px', 
                        fontWeight: 600, 
                        color: task.completed ? 'var(--text-muted)' : '#fff',
                        textDecoration: task.completed ? 'line-through' : 'none'
                      }}>
                        {task.title}
                      </div>
                      <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                        {task.subtext}
                      </div>
                    </div>
                  </div>

                  <div style={{
                    width: '8px',
                    height: '8px',
                    borderRadius: '50%',
                    backgroundColor: task.accent,
                    boxShadow: `0 0 6px ${task.accent}`
                  }} />
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Bottom Card: RECENT ACTIVITY - 6 cols */}
        <div style={{ gridColumn: 'span 6' }} className="glass-panel">
          <div style={{ padding: '24px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
              <span style={{ fontSize: '11px', fontWeight: 700, letterSpacing: '0.1em', color: 'var(--text-muted)' }}>
                SYSTEM LOGS & RECENT ACTIVITY
              </span>
              <button 
                onClick={() => setActiveTab('memory')}
                style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', fontSize: '12px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}
              >
                <span>View all</span>
                <ArrowUpRight size={14} />
              </button>
            </div>

            <h2 style={{ fontSize: '20px', fontWeight: 700, color: '#fff', marginBottom: '20px' }}>
              Action feed
            </h2>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {recentActivity.map((act, index) => (
                <div key={act.id || index} style={{
                  display: 'flex',
                  alignItems: 'center',
                  justify: 'space-between',
                  padding: '10px 12px',
                  borderRadius: '8px',
                  background: 'rgba(255,255,255,0.02)',
                  border: '1px solid rgba(255,255,255,0.04)'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <div style={{
                      width: '24px',
                      height: '24px',
                      borderRadius: '50%',
                      background: `rgba(0, 242, 254, 0.1)`,
                      border: `1px solid ${act.dot_color || act.dotColor || '#00f2fe'}`,
                      display: 'flex',
                      alignItems: 'center',
                      justify: 'center',
                      color: act.dot_color || act.dotColor || '#00f2fe'
                    }}>
                      <Sparkles size={12} />
                    </div>
                    <span style={{ fontSize: '13px', color: '#fff', fontWeight: 500 }}>{act.text}</span>
                  </div>
                  <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{act.time}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

      </div>

      {/* Add Task Modal */}
      {showAddTaskModal && (
        <div style={{
          position: 'fixed',
          top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(0,0,0,0.7)',
          backdropFilter: 'blur(6px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 100
        }}>
          <div className="glass-panel" style={{ width: '400px', padding: '24px' }}>
            <h3 style={{ fontSize: '18px', fontWeight: 700, color: '#fff', marginBottom: '16px' }}>Add Pending Task</h3>
            <form onSubmit={handleAddTask}>
              <input 
                type="text"
                placeholder="Task description..."
                value={newTaskTitle}
                onChange={(e) => setNewTaskTitle(e.target.value)}
                style={{
                  width: '100%',
                  background: 'var(--bg-input)',
                  border: '1px solid var(--border-color)',
                  borderRadius: '8px',
                  padding: '10px 14px',
                  color: '#fff',
                  fontSize: '13px',
                  marginBottom: '16px',
                  outline: 'none'
                }}
                autoFocus
              />
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
                <button 
                  type="button" 
                  className="btn-secondary" 
                  onClick={() => setShowAddTaskModal(false)}
                >
                  Cancel
                </button>
                <button type="submit" className="btn-cyan">
                  Add Task
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
