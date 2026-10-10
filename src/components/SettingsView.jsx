import React, { useState } from 'react';
import { Settings, Volume2, Cpu, RefreshCw, Sliders } from 'lucide-react';
import { audioEngine } from '../utils/audioEngine';

export default function SettingsView({ resetDemo }) {
  const [isMuted, setIsMuted] = useState(audioEngine.isMuted);
  const [topK, setTopK] = useState(3);
  const [similarityThreshold, setSimilarityThreshold] = useState(0.45);

  const handleMuteToggle = () => {
    const nextMuted = !isMuted;
    setIsMuted(nextMuted);
    audioEngine.setMuted(nextMuted);
  };

  return (
    <div style={{ padding: '32px 28px', maxWidth: '860px', margin: '0 auto' }}>
      
      {/* Header */}
      <div style={{ marginBottom: '28px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '11px', fontWeight: 700, letterSpacing: '0.1em', color: 'var(--cyan-primary)', marginBottom: '8px' }}>
          <Settings size={16} />
          <span>ASTRA SYSTEM CONFIGURATION</span>
        </div>
        <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '32px', fontWeight: 700, color: '#fff' }}>
          System Settings & AI Preferences
        </h1>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
        
        {/* Voice & Speech Synthesis Panel */}
        <div className="glass-panel" style={{ padding: '24px' }}>
          <h3 style={{ fontSize: '16px', fontWeight: 700, color: '#fff', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Volume2 size={18} color="var(--cyan-primary)" />
            <span>Voice & Audio Synthesis</span>
          </h3>

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 16px', background: 'rgba(255,255,255,0.02)', borderRadius: '8px' }}>
            <div>
              <div style={{ fontSize: '14px', fontWeight: 600, color: '#fff' }}>Enable Natural AI Voice Output</div>
              <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Reads AI responses aloud using browser SpeechSynthesis</div>
            </div>

            <button 
              onClick={handleMuteToggle}
              className={isMuted ? 'btn-secondary' : 'btn-cyan'}
              style={{ fontSize: '12px' }}
            >
              {isMuted ? 'Unmute Audio' : 'Mute Voice Output'}
            </button>
          </div>
        </div>

        {/* Vector Search Parameters */}
        <div className="glass-panel" style={{ padding: '24px' }}>
          <h3 style={{ fontSize: '16px', fontWeight: 700, color: '#fff', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Cpu size={18} color="var(--purple-accent)" />
            <span>RAG Vector Search Parameters</span>
          </h3>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', color: '#fff', marginBottom: '6px' }}>
                <span>Top-K Relevant Chunks Retracted</span>
                <span style={{ color: 'var(--cyan-primary)', fontFamily: 'var(--font-mono)' }}>{topK} Chunks</span>
              </div>
              <input 
                type="range" 
                min="1" 
                max="5" 
                value={topK} 
                onChange={(e) => setTopK(parseInt(e.target.value))}
                style={{ width: '100%', accentColor: 'var(--cyan-primary)' }}
              />
            </div>

            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', color: '#fff', marginBottom: '6px' }}>
                <span>Cosine Similarity Threshold</span>
                <span style={{ color: 'var(--cyan-primary)', fontFamily: 'var(--font-mono)' }}>{similarityThreshold}</span>
              </div>
              <input 
                type="range" 
                min="0.1" 
                max="0.9" 
                step="0.05"
                value={similarityThreshold} 
                onChange={(e) => setSimilarityThreshold(parseFloat(e.target.value))}
                style={{ width: '100%', accentColor: 'var(--cyan-primary)' }}
              />
            </div>
          </div>
        </div>

        {/* Reset Demo State */}
        <div className="glass-panel" style={{ padding: '24px', border: '1px solid rgba(239, 68, 68, 0.3)' }}>
          <h3 style={{ fontSize: '16px', fontWeight: 700, color: '#ef4444', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <RefreshCw size={18} />
            <span>Reset Demo State</span>
          </h3>

          <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: '16px' }}>
            Restores Yuna's initial morning state, clearing newly added memories or rescheduling simulations.
          </p>

          <button onClick={resetDemo} className="btn-secondary" style={{ color: '#ef4444', borderColor: 'rgba(239,68,68,0.4)' }}>
            Reset ASTRA to Initial State
          </button>
        </div>

      </div>

    </div>
  );
}
