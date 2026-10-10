import React, { useState } from 'react';
import { BrainCircuit, Plus, Trash2, Mic, Search, ShieldCheck } from 'lucide-react';
import { audioEngine } from '../utils/audioEngine';

const API_BASE = "http://localhost:8000/api";

export default function MemoryView({ memories, setMemories, addMemory, fetchState }) {
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newCategory, setNewCategory] = useState('Exams');
  const [newContent, setNewContent] = useState('');
  const [isListening, setIsListening] = useState(false);

  const categories = ['All', 'Exams', 'Weak Subjects', 'Preferences', 'Goals'];

  const filteredMemories = memories.filter(mem => {
    const matchCat = selectedCategory === 'All' || mem.category === selectedCategory;
    const matchSearch = (mem.title || '').toLowerCase().includes(searchQuery.toLowerCase()) || 
                        (mem.content || '').toLowerCase().includes(searchQuery.toLowerCase());
    return matchCat && matchSearch;
  });

  const handleDelete = async (id) => {
    try {
      const res = await fetch(`${API_BASE}/memories/${id}`, { method: 'DELETE' });
      if (res.ok) {
        setMemories(prev => prev.filter(m => m.id !== id));
      }
    } catch (e) {
      setMemories(prev => prev.filter(m => m.id !== id));
    }
  };

  const handleAddMemorySubmit = async (e) => {
    e.preventDefault();
    if (!newTitle.trim() || !newContent.trim()) return;

    await addMemory({
      category: newCategory,
      title: newTitle,
      content: newContent,
      confidence: '96%',
      source: 'User Input'
    });

    setNewTitle('');
    setNewContent('');
    setShowAddModal(false);
  };

  const handleVoiceAdd = () => {
    if (isListening) {
      audioEngine.stopListening();
      setIsListening(false);
    } else {
      setIsListening(true);
      audioEngine.startListening(
        (transcript, isFinal) => {
          setNewContent(transcript);
          if (isFinal) {
            setIsListening(false);
            if (!newTitle) setNewTitle('Voice Memory ' + new Date().toLocaleTimeString());
          }
        },
        () => setIsListening(false)
      );
    }
  };

  return (
    <div style={{ padding: '32px 28px', maxWidth: '1240px', margin: '0 auto' }}>
      
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '28px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '11px', fontWeight: 700, letterSpacing: '0.1em', color: 'var(--cyan-primary)', marginBottom: '8px' }}>
            <BrainCircuit size={16} />
            <span>ASTRA LONG-TERM PERSONAL MEMORY STORE (SQLite DB)</span>
          </div>
          <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '32px', fontWeight: 700, color: '#fff' }}>
            Personal Student Memory Database
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '14px', marginTop: '4px' }}>
            Persistent student context, weak areas, exam dates, and preferences stored in SQLite database.
          </p>
        </div>

        <button 
          onClick={() => setShowAddModal(true)} 
          className="btn-cyan"
        >
          <Plus size={16} />
          <span>Add Memory</span>
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div style={{ 
        display: 'flex', 
        alignItems: 'center', 
        justify: 'space-between', 
        gap: '16px', 
        marginBottom: '24px',
        flexWrap: 'wrap'
      }}>
        <div style={{ display: 'flex', gap: '8px' }}>
          {categories.map(cat => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              style={{
                padding: '6px 14px',
                borderRadius: '8px',
                fontSize: '12px',
                fontWeight: 600,
                border: selectedCategory === cat ? '1px solid var(--cyan-primary)' : '1px solid var(--border-color)',
                background: selectedCategory === cat ? 'rgba(0, 242, 254, 0.12)' : 'rgba(255,255,255,0.02)',
                color: selectedCategory === cat ? 'var(--cyan-primary)' : 'var(--text-secondary)',
                cursor: 'pointer',
                transition: 'all 0.15s ease'
              }}
            >
              {cat}
            </button>
          ))}
        </div>

        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          background: 'var(--bg-input)',
          border: '1px solid var(--border-color)',
          borderRadius: '8px',
          padding: '6px 12px',
          width: '260px'
        }}>
          <Search size={14} color="var(--text-muted)" />
          <input 
            type="text" 
            placeholder="Search persistent memories..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{
              background: 'transparent',
              border: 'none',
              color: '#fff',
              fontSize: '12px',
              outline: 'none',
              width: '100%'
            }}
          />
        </div>
      </div>

      {/* Memory Grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))',
        gap: '20px'
      }}>
        {filteredMemories.map(mem => (
          <div key={mem.id} className="glass-panel-interactive" style={{ padding: '20px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
              <span className={
                mem.category === 'Exams' ? 'badge-cyan' :
                mem.category === 'Weak Subjects' ? 'badge-orange' : 'badge-purple'
              } style={{ fontSize: '11px', padding: '3px 8px', borderRadius: '6px', fontWeight: 600 }}>
                {mem.category}
              </span>

              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontSize: '11px', color: 'var(--emerald-accent)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <ShieldCheck size={12} />
                  {mem.confidence}
                </span>
                <button 
                  onClick={() => handleDelete(mem.id)}
                  style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
                  title="Delete memory"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            </div>

            <h3 style={{ fontSize: '16px', fontWeight: 700, color: '#fff', marginBottom: '8px' }}>
              {mem.title}
            </h3>

            <p style={{ fontSize: '13px', color: 'var(--text-secondary)', lineHeight: '1.5', marginBottom: '16px' }}>
              {mem.content}
            </p>

            <div style={{ 
              display: 'flex', 
              alignItems: 'center', 
              justify: 'space-between', 
              paddingTop: '12px',
              borderTop: '1px solid rgba(255,255,255,0.06)',
              fontSize: '11px',
              color: 'var(--text-muted)'
            }}>
              <span>Extracted: {mem.date}</span>
              <span>Source: {mem.source}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Add Memory Modal */}
      {showAddModal && (
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
          <div className="glass-panel" style={{ width: '460px', padding: '24px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h3 style={{ fontSize: '18px', fontWeight: 700, color: '#fff' }}>Store Memory in SQLite DB</h3>
              <button 
                onClick={handleVoiceAdd} 
                style={{
                  background: isListening ? 'rgba(239, 68, 68, 0.2)' : 'rgba(0,242,254,0.1)',
                  color: isListening ? '#ef4444' : 'var(--cyan-primary)',
                  border: '1px solid rgba(0,242,254,0.3)',
                  borderRadius: '6px',
                  padding: '6px 10px',
                  fontSize: '11px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px'
                }}
              >
                <Mic size={13} />
                <span>{isListening ? 'Listening...' : 'Voice Input'}</span>
              </button>
            </div>

            <form onSubmit={handleAddMemorySubmit}>
              <div style={{ marginBottom: '12px' }}>
                <label style={{ fontSize: '11px', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>CATEGORY</label>
                <select 
                  value={newCategory} 
                  onChange={(e) => setNewCategory(e.target.value)}
                  style={{
                    width: '100%',
                    background: 'var(--bg-input)',
                    border: '1px solid var(--border-color)',
                    color: '#fff',
                    borderRadius: '8px',
                    padding: '8px 12px',
                    outline: 'none'
                  }}
                >
                  <option value="Exams">Exams</option>
                  <option value="Weak Subjects">Weak Subjects</option>
                  <option value="Preferences">Preferences</option>
                  <option value="Goals">Goals</option>
                </select>
              </div>

              <div style={{ marginBottom: '12px' }}>
                <label style={{ fontSize: '11px', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>MEMORY TITLE</label>
                <input 
                  type="text" 
                  placeholder="e.g. DBMS Exam Date" 
                  value={newTitle} 
                  onChange={(e) => setNewTitle(e.target.value)}
                  style={{
                    width: '100%',
                    background: 'var(--bg-input)',
                    border: '1px solid var(--border-color)',
                    color: '#fff',
                    borderRadius: '8px',
                    padding: '8px 12px',
                    outline: 'none'
                  }}
                />
              </div>

              <div style={{ marginBottom: '20px' }}>
                <label style={{ fontSize: '11px', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>CONTENT / DETAIL</label>
                <textarea 
                  rows={3}
                  placeholder="e.g. Exam is next Friday March 21, need 3NF practice..." 
                  value={newContent} 
                  onChange={(e) => setNewContent(e.target.value)}
                  style={{
                    width: '100%',
                    background: 'var(--bg-input)',
                    border: '1px solid var(--border-color)',
                    color: '#fff',
                    borderRadius: '8px',
                    padding: '8px 12px',
                    outline: 'none',
                    resize: 'none'
                  }}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
                <button type="button" className="btn-secondary" onClick={() => setShowAddModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn-cyan">
                  Save Memory
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
