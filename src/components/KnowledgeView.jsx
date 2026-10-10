import React, { useState, useEffect } from 'react';
import { BookOpen, Upload, FileText, Search, Cpu, Database, Code, CheckCircle2 } from 'lucide-react';

export default function KnowledgeView({ documentData }) {
  const [testQuery, setTestQuery] = useState('explain normalization and BCNF according to my notes');
  const [searchResults, setSearchResults] = useState([]);
  const [ragResult, setRagResult] = useState(null);
  const [showDeveloperDebug, setShowDeveloperDebug] = useState(false);

  // Active Document & Upload State
  const [activeDoc, setActiveDoc] = useState(documentData);
  const [uploadStatus, setUploadStatus] = useState('idle'); // 'idle' | 'uploading' | 'processing' | 'embedding' | 'storing' | 'success' | 'error'
  const [uploadResult, setUploadResult] = useState(null);
  const [uploadError, setUploadError] = useState(null);

  // Grounded QA & Retrieval State
  const [askResult, setAskResult] = useState(null);
  const [isAsking, setIsAsking] = useState(false);

  useEffect(() => {
    fetchActiveDocument();
    handleTestSearch('explain normalization and BCNF according to my notes');
  }, []);

  const fetchActiveDocument = async () => {
    try {
      const res = await fetch("http://localhost:8000/api/knowledge/document");
      if (res.ok) {
        const data = await res.json();
        if (data && data.title) {
          setActiveDoc({
            title: data.title,
            uploadedAt: data.uploadedAt,
            totalPages: data.totalPages,
            totalChunks: data.totalChunks,
            chunks: data.chunks || [],
            isRealIngested: true,
            vectorStore: 'qdrant',
            collection: 'astra_knowledge'
          });
        }
      }
    } catch (e) {
      console.warn("Could not fetch active document from backend:", e);
    }
  };

  const handleTestSearch = async (queryToSearch) => {
    const q = queryToSearch || testQuery;
    if (!q.trim()) return;

    setIsAsking(true);

    try {
      // 1. Call POST /api/knowledge/ask for Grounded LLM Answer + Citations
      const askRes = await fetch("http://localhost:8000/api/knowledge/ask", {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question: q, top_k: 5 })
      });
      if (askRes.ok) {
        const askData = await askRes.json();
        setAskResult({
          answer: askData.answer,
          citations: askData.citations || [],
          sources: askData.sources || []
        });
      }

      // 2. Call POST /api/knowledge/search for Top-K Semantic Chunks
      const searchRes = await fetch("http://localhost:8000/api/knowledge/search", {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: q, top_k: 5 })
      });
      if (searchRes.ok) {
        const searchData = await searchRes.json();
        setSearchResults(searchData.results || []);
      }
    } catch (e) {
      console.warn("RAG ask/search fallback:", e);
    } finally {
      setIsAsking(false);
    }
  };

  const handleRealPdfUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Reset input target value so re-uploading the same file fires event
    e.target.value = '';

    if (!file.name.toLowerCase().endsWith('.pdf')) {
      setUploadStatus('error');
      setUploadError('Invalid file type. Please select a valid PDF file (.pdf).');
      setUploadResult(null);
      return;
    }

    setUploadStatus('uploading');
    setUploadError(null);
    setUploadResult(null);

    // Multi-stage status progression for user feedback
    const t1 = setTimeout(() => setUploadStatus('processing'), 400);
    const t2 = setTimeout(() => setUploadStatus('embedding'), 1200);
    const t3 = setTimeout(() => setUploadStatus('storing'), 2200);

    const formData = new FormData();
    formData.append('file', file);

    try {
      const res = await fetch("http://localhost:8000/api/knowledge/upload", {
        method: 'POST',
        body: formData
      });

      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);

      if (res.ok) {
        const data = await res.json();
        setUploadStatus('success');
        setUploadResult(data);
        setUploadError(null);

        setActiveDoc({
          title: data.filename,
          uploadedAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          totalPages: data.page_count,
          totalChunks: data.chunk_count,
          storedCount: data.stored_count,
          vectorStore: data.vector_store,
          collection: data.collection,
          isRealIngested: true
        });

        fetchActiveDocument();
      } else {
        let errMessage = "Could not process this PDF. Please try again.";
        try {
          const errData = await res.json();
          if (errData && errData.detail) errMessage = errData.detail;
        } catch (_) {}
        setUploadStatus('error');
        setUploadError(errMessage);
        setUploadResult(null);
      }
    } catch (err) {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
      setUploadStatus('error');
      setUploadError("Could not process this PDF. Network or server connection failed.");
      setUploadResult(null);
    }
  };

  const getUploadBtnText = () => {
    switch (uploadStatus) {
      case 'uploading': return 'Uploading PDF...';
      case 'processing': return 'Processing PDF...';
      case 'embedding': return 'Generating embeddings...';
      case 'storing': return 'Storing knowledge...';
      case 'success': return 'Indexed in Qdrant ✓';
      case 'error': return 'Upload Failed ❌';
      default: return 'Select PDF File';
    }
  };

  return (
    <div style={{ padding: '32px 28px', maxWidth: '1240px', margin: '0 auto' }}>
      
      {/* Header */}
      <div style={{ marginBottom: '28px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '11px', fontWeight: 700, letterSpacing: '0.1em', color: 'var(--cyan-primary)', marginBottom: '8px' }}>
            <BookOpen size={16} />
            <span>ASTRA KNOWLEDGE BASE & RAG PIPELINE</span>
          </div>
          <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '32px', fontWeight: 700, color: '#fff' }}>
            Document Knowledge Base
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '14px', marginTop: '4px' }}>
            Uploaded lecture notes, assignments, and RAG document search with page-level citations.
          </p>
        </div>

        {/* Developer Debug Toggle */}
        <button 
          onClick={() => setShowDeveloperDebug(!showDeveloperDebug)}
          className="btn-secondary"
          style={{ fontSize: '11px', borderColor: showDeveloperDebug ? 'var(--cyan-primary)' : 'var(--border-color)' }}
        >
          <Code size={14} color={showDeveloperDebug ? 'var(--cyan-primary)' : 'var(--text-muted)'} />
          <span>{showDeveloperDebug ? 'Hide Developer Vectors' : 'Developer Debug View'}</span>
        </button>
      </div>

      {/* Top Grid: Document Summary & Upload Area */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(12, 1fr)', gap: '24px', marginBottom: '28px' }}>
        
        {/* Active Document Card (8 cols) */}
        <div style={{ gridColumn: 'span 8' }} className="glass-panel">
          <div style={{ padding: '24px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{
                  width: '36px',
                  height: '36px',
                  borderRadius: '8px',
                  background: 'rgba(0, 242, 254, 0.1)',
                  border: '1px solid rgba(0, 242, 254, 0.3)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'var(--cyan-primary)'
                }}>
                  <FileText size={20} />
                </div>
                <div>
                  <h3 style={{ fontSize: '16px', fontWeight: 700, color: '#fff' }}>{activeDoc.title}</h3>
                  <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Uploaded: {activeDoc.uploadedAt}</div>
                </div>
              </div>

              <span className={activeDoc.isRealIngested ? "badge-cyan" : "badge-purple"} style={{ fontSize: '11px', padding: '4px 10px', borderRadius: '6px' }}>
                {activeDoc.isRealIngested ? 'Real Qdrant Vector Store ✓' : 'Sample Note (Seeded)'}
              </span>
            </div>

            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(3, 1fr)',
              gap: '16px',
              padding: '16px',
              background: 'rgba(255,255,255,0.02)',
              borderRadius: '8px',
              border: '1px solid rgba(255,255,255,0.05)'
            }}>
              <div>
                <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginBottom: '4px' }}>TOTAL PAGES</div>
                <div style={{ fontSize: '20px', fontWeight: 700, color: '#fff' }}>{activeDoc.totalPages} Pages</div>
              </div>

              <div>
                <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginBottom: '4px' }}>INDEXED PASSAGES</div>
                <div style={{ fontSize: '20px', fontWeight: 700, color: 'var(--cyan-primary)' }}>{activeDoc.totalChunks} Chunks</div>
              </div>

              <div>
                <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginBottom: '4px' }}>VECTOR STORE</div>
                <div style={{ fontSize: '14px', fontWeight: 600, color: 'var(--emerald-accent)' }}>
                  {activeDoc.vectorStore ? `${activeDoc.vectorStore.toUpperCase()} (${activeDoc.collection})` : 'Qdrant Persistent'}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Upload Box (4 cols) */}
        <div style={{ gridColumn: 'span 4' }} className="glass-panel">
          <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', height: '100%', justifyContent: 'center', alignItems: 'center', textAlign: 'center' }}>
            <Upload size={24} color="var(--cyan-primary)" style={{ marginBottom: '8px' }} />
            <h4 style={{ fontSize: '14px', fontWeight: 600, color: '#fff', marginBottom: '4px' }}>
              Upload Notes / PDF
            </h4>
            <p style={{ fontSize: '11px', color: 'var(--text-muted)', marginBottom: '12px' }}>
              Select PDF to extract, chunk, embed & store in Qdrant
            </p>

            <label className="btn-secondary" style={{ cursor: ['uploading','processing','embedding','storing'].includes(uploadStatus) ? 'wait' : 'pointer', fontSize: '12px' }}>
              <span>{getUploadBtnText()}</span>
              <input 
                type="file" 
                accept=".pdf" 
                onChange={handleRealPdfUpload} 
                disabled={['uploading','processing','embedding','storing'].includes(uploadStatus)} 
                style={{ display: 'none' }} 
              />
            </label>

            {/* Ingestion Success Result Box */}
            {uploadStatus === 'success' && uploadResult && (
              <div style={{
                marginTop: '12px',
                padding: '10px 12px',
                background: 'rgba(16, 185, 129, 0.1)',
                border: '1px solid rgba(16, 185, 129, 0.3)',
                borderRadius: '8px',
                fontSize: '11px',
                textAlign: 'left',
                width: '100%'
              }}>
                <div style={{ fontWeight: 700, color: 'var(--emerald-accent)', display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '6px' }}>
                  <CheckCircle2 size={14} />
                  <span>✓ {uploadResult.filename} processed</span>
                </div>
                <div style={{ color: 'var(--text-secondary)', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '4px', fontSize: '10px', fontFamily: 'var(--font-mono)' }}>
                  <span>📄 {uploadResult.page_count} pages</span>
                  <span>✂️ {uploadResult.chunk_count} chunks</span>
                  <span>⚡ {uploadResult.embedded_count} embeddings</span>
                  <span>💾 {uploadResult.stored_count} stored (Qdrant)</span>
                </div>
              </div>
            )}

            {/* Ingestion Error Box */}
            {uploadStatus === 'error' && uploadError && (
              <div style={{
                marginTop: '12px',
                padding: '10px 12px',
                background: 'rgba(239, 68, 68, 0.1)',
                border: '1px solid rgba(239, 68, 68, 0.3)',
                borderRadius: '8px',
                fontSize: '11px',
                color: '#f87171',
                textAlign: 'left',
                width: '100%'
              }}>
                ⚠️ {uploadError}
              </div>
            )}
          </div>
        </div>

      </div>

      {/* Semantic Search Tester Section */}
      <div className="glass-panel" style={{ padding: '24px', marginBottom: '28px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
          <Cpu size={18} color="var(--cyan-primary)" />
          <h3 style={{ fontSize: '18px', fontWeight: 700, color: '#fff' }}>Ask Questions About Your Uploaded Notes</h3>
        </div>

        <div style={{ display: 'flex', gap: '12px', marginBottom: '20px' }}>
          <div style={{
            flex: 1,
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            background: 'var(--bg-input)',
            border: '1px solid var(--border-color)',
            borderRadius: '8px',
            padding: '8px 14px'
          }}>
            <Search size={16} color="var(--text-muted)" />
            <input 
              type="text" 
              value={testQuery} 
              onChange={(e) => setTestQuery(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleTestSearch()}
              placeholder="Query document knowledge..."
              style={{
                background: 'transparent',
                border: 'none',
                color: '#fff',
                fontSize: '13px',
                outline: 'none',
                width: '100%'
              }}
            />
          </div>

          <button onClick={() => handleTestSearch()} className="btn-cyan" disabled={isAsking}>
            <span>{isAsking ? 'Thinking...' : 'Query Notes'}</span>
          </button>
        </div>

        {/* Visually Distinct Grounded ASTRA Answer Box */}
        {askResult && (
          <div style={{
            background: 'rgba(0, 242, 254, 0.05)',
            border: '1px solid rgba(0, 242, 254, 0.25)',
            borderRadius: '12px',
            padding: '20px 24px',
            marginTop: '16px'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px', fontWeight: 700, color: 'var(--cyan-primary)', letterSpacing: '0.05em' }}>
                <Cpu size={16} />
                <span>ASTRA GROUNDED ANSWER</span>
              </div>
              <span className="badge-cyan" style={{ fontSize: '10px', padding: '2px 8px', borderRadius: '4px' }}>
                Document Grounded ✓
              </span>
            </div>

            <div style={{ fontSize: '14px', color: '#fff', lineHeight: '1.6', marginBottom: '16px', whiteSpace: 'pre-line' }}>
              {askResult.answer}
            </div>

            {/* Document & Page Citations */}
            {askResult.citations && askResult.citations.length > 0 && (
              <div>
                <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '8px', letterSpacing: '0.05em' }}>
                  SOURCE CITATIONS
                </div>
                <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                  {askResult.citations.map((cite, idx) => {
                    const pageStr = cite.page_start === cite.page_end ? `Page ${cite.page_start}` : `Pages ${cite.page_start}–${cite.page_end}`;
                    return (
                      <span key={idx} style={{
                        fontSize: '11px',
                        fontFamily: 'var(--font-mono)',
                        color: 'var(--cyan-primary)',
                        background: 'rgba(0, 242, 254, 0.1)',
                        padding: '4px 10px',
                        borderRadius: '6px',
                        border: '1px solid rgba(0, 242, 254, 0.25)',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px'
                      }}>
                        📄 <strong>{cite.filename}</strong> &nbsp;•&nbsp; 📖 <span>{pageStr}</span>
                      </span>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        )}

      </div>

      {/* Document Chunks List */}
      <div className="glass-panel" style={{ padding: '24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Database size={18} color="var(--cyan-primary)" />
            <h3 style={{ fontSize: '18px', fontWeight: 700, color: '#fff' }}>Retrieved Knowledge</h3>
          </div>
          <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
            Showing {searchResults.length} top-k semantic matches (Qdrant Vector Store)
          </span>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {searchResults.length === 0 ? (
            <div style={{ fontSize: '13px', color: 'var(--text-muted)', textAlign: 'center', padding: '24px 0' }}>
              No relevant document passages matched this query threshold in Qdrant.
            </div>
          ) : (
            searchResults.map((chk, idx) => {
              const scoreVal = chk.score !== undefined ? chk.score : (chk.similarity_score || 0.85);
              const isHigh = scoreVal >= 0.4;
              const pageStr = chk.page_start ? (chk.page_start === chk.page_end ? `Page ${chk.page_start}` : `Pages ${chk.page_start}–${chk.page_end}`) : `Page ${chk.page || 1}`;
              const docName = chk.filename || chk.title || activeDoc.title || "DBMS_Notes.pdf";

              return (
                <div key={chk.chunk_id || chk.id || idx} style={{
                  background: 'rgba(255,255,255,0.02)',
                  border: isHigh ? '1px solid rgba(0, 242, 254, 0.3)' : '1px solid rgba(255,255,255,0.06)',
                  borderRadius: '10px',
                  padding: '16px'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <span className="badge-purple" style={{ fontSize: '11px', padding: '2px 8px', borderRadius: '4px' }}>
                        {pageStr}
                      </span>
                      <span style={{ fontSize: '13px', fontWeight: 700, color: '#fff' }}>{docName}</span>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Cosine Similarity:</span>
                      <span style={{
                        fontSize: '12px',
                        fontWeight: 700,
                        color: isHigh ? 'var(--cyan-primary)' : 'var(--text-secondary)',
                        background: isHigh ? 'rgba(0,242,254,0.1)' : 'rgba(255,255,255,0.05)',
                        padding: '2px 8px',
                        borderRadius: '4px'
                      }}>
                        {(scoreVal * 100).toFixed(1)}% ({scoreVal.toFixed(4)})
                      </span>
                    </div>
                  </div>

                  <p style={{ fontSize: '13px', color: 'var(--text-secondary)', lineHeight: '1.5', marginBottom: '12px' }}>
                    {chk.text}
                  </p>

                  {/* Developer Debug View Toggle */}
                  {showDeveloperDebug && (
                    <div style={{
                      background: '#070a11',
                      borderRadius: '6px',
                      padding: '8px 12px',
                      fontSize: '11px',
                      fontFamily: 'var(--font-mono)',
                      color: 'var(--text-muted)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between'
                    }}>
                      <span>Chunk ID: {chk.chunk_id || `chk-${idx}`}</span>
                      <span style={{ color: 'var(--cyan-primary)' }}>Vector dim: 3072 | Cosine: {scoreVal.toFixed(6)}</span>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>

    </div>
  );
}
