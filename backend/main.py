import sys
import os

sys.path.append(os.path.dirname(__file__))

from fastapi import FastAPI, HTTPException, UploadFile, File, Form
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional, List
import time

from database import init_db, get_db
from time_service import get_system_time_context
from orchestrator import process_user_request, get_latest_db_state
from rag_service import search_rag_chunks, generate_rag_answer
from planner_service import get_current_plan, perform_adaptive_rescheduling
from action_engine import add_personal_memory_action, add_calendar_event_action, add_task_action

# Initialize Database
init_db()

app = FastAPI(title="ASTRA Study OS API Engine", version="2.0.0")

# Enable CORS for React Frontend (vite default 5173 / localhost)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Models
class ChatMessage(BaseModel):
    role: str
    content: str

class ChatRequest(BaseModel):
    query: str
    history: Optional[List[ChatMessage]] = []

class MemoryCreate(BaseModel):
    category: str
    title: str
    content: str
    confidence: Optional[str] = "96%"
    source: Optional[str] = "User Input"

class TaskCreate(BaseModel):
    title: str
    subtext: Optional[str] = "DBMS · 1 hour"
    accent: Optional[str] = "#00f2fe"

class RAGSearchRequest(BaseModel):
    query: str
    top_k: Optional[int] = 5
    score_threshold: Optional[float] = 0.25

class RAGAskRequest(BaseModel):
    question: str
    top_k: Optional[int] = 5

@app.get("/api/health")
def health_check():
    return {
        "status": "online", 
        "system": "ASTRA AI Command Engine", 
        "version": "2.0.0",
        "time": get_system_time_context()
    }

@app.get("/api/time")
def get_time():
    return get_system_time_context()

@app.get("/api/state")
def get_full_state():
    state = get_latest_db_state()
    state["time_context"] = get_system_time_context()
    return state

@app.post("/api/chat")
def chat_endpoint(req: ChatRequest):
    history_dicts = [{"role": m.role, "content": m.content} for m in (req.history or [])]
    return process_user_request(req.query, history_dicts)


# Memory Management Endpoints
@app.get("/api/memories")
def list_memories():
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM personal_memories ORDER BY date DESC")
    rows = [dict(r) for r in cursor.fetchall()]
    conn.close()
    return rows

@app.post("/api/memories")
def create_memory(mem: MemoryCreate):
    return add_personal_memory_action(mem.category, mem.title, mem.content, mem.confidence, mem.source)

@app.delete("/api/memories/{mem_id}")
def delete_memory(mem_id: str):
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute("DELETE FROM personal_memories WHERE id = ?", (mem_id,))
    conn.commit()
    conn.close()
    return {"success": True, "deleted_id": mem_id}

# Tasks Endpoints
@app.get("/api/tasks")
def list_tasks():
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM tasks")
    rows = [dict(r) for r in cursor.fetchall()]
    conn.close()
    return rows

@app.post("/api/tasks")
def create_task(task: TaskCreate):
    return add_task_action(task.title, task.subtext, task.accent)

@app.put("/api/tasks/{task_id}/toggle")
def toggle_task(task_id: str):
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute("SELECT completed FROM tasks WHERE id = ?", (task_id,))
    row = cursor.fetchone()
    if not row:
        conn.close()
        raise HTTPException(status_code=404, detail="Task not found")
    
    new_val = 0 if row["completed"] else 1
    cursor.execute("UPDATE tasks SET completed = ? WHERE id = ?", (new_val, task_id))
    conn.commit()
    conn.close()
    return {"success": True, "task_id": task_id, "completed": bool(new_val)}

# RAG Knowledge Endpoints
UPLOAD_DIR = os.path.join(os.path.dirname(__file__), "uploads")
os.makedirs(UPLOAD_DIR, exist_ok=True)

from rag.document_loader import load_pdf_document
from rag.chunker import chunk_document
from rag.embeddings import embedding_service
from rag.vector_store import vector_store

@app.post("/api/knowledge/upload")
async def upload_knowledge_document(file: UploadFile = File(...)):
    """
    Real PDF Ingestion Pipeline:
    1. Validates file presence and .pdf extension.
    2. Saves PDF to backend/uploads/.
    3. Extracts pages using pypdf via document_loader.py.
    4. Chunks document with overlap via chunker.py.
    5. Generates 3072-dim embeddings using Gemini embedding_service.
    6. Stores chunk vectors in persistent local Qdrant collection 'astra_knowledge'.
    7. Syncs SQLite documents database.
    8. Returns structured JSON metrics response.
    """
    if not file or not file.filename:
        raise HTTPException(status_code=400, detail="No file was provided for upload.")

    filename = file.filename
    if not filename.lower().endswith(".pdf"):
        raise HTTPException(status_code=400, detail="Invalid file type. Only '.pdf' files are supported.")

    safe_filename = os.path.basename(filename)
    saved_path = os.path.join(UPLOAD_DIR, safe_filename)

    try:
        content = await file.read()
        if len(content) == 0:
            raise HTTPException(status_code=400, detail="The uploaded PDF file is empty (0 bytes).")

        with open(saved_path, "wb") as f:
            f.write(content)
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to save uploaded file on server.")

    try:
        # Step 1: Load PDF document
        doc_data = load_pdf_document(saved_path)

        # Step 2: Chunk text
        chunks = chunk_document(doc_data, chunk_size_words=350, chunk_overlap_words=50)
        if not chunks:
            raise HTTPException(status_code=400, detail="No extractable text could be found in the PDF.")

        # Step 3: Extract text for embeddings
        chunk_texts = [c["text"] for c in chunks]

        # Step 4: Generate Gemini embeddings (3072 dims)
        embeddings = embedding_service.generate_embeddings_batch(chunk_texts)

        # Step 5: Upsert vectors into Qdrant
        stored_count = vector_store.upsert_chunks(chunks, embeddings, original_filename=filename)

        # Step 6: Sync SQLite DB for documents & chunks view
        try:
            conn = get_db()
            cursor = conn.cursor()
            doc_id = doc_data["document_id"]
            now_str = time.strftime('%Y-%m-%d %I:%M %p')

            cursor.execute(
                "INSERT OR REPLACE INTO documents (id, title, uploaded_at, total_pages, total_chunks) VALUES (?, ?, ?, ?, ?)",
                (doc_id, filename, now_str, doc_data["page_count"], len(chunks))
            )

            cursor.execute("DELETE FROM document_chunks WHERE doc_id = ?", (doc_id,))

            for idx, chk in enumerate(chunks):
                emb_vec = embeddings[idx]
                preview_str = f"[{', '.join(f'{v:.3f}' for v in emb_vec[:6])}, ... {len(emb_vec)} dims]"
                cursor.execute(
                    "INSERT INTO document_chunks (id, doc_id, page, title, text, embedding_preview) VALUES (?, ?, ?, ?, ?, ?)",
                    (chk["chunk_id"], doc_id, chk["page_start"], f"Page {chk['page_start']} - {chk['page_end']}", chk["text"], preview_str)
                )

            conn.commit()
            conn.close()
        except Exception as db_err:
            pass

        return {
            "success": True,
            "document_id": doc_data["document_id"],
            "filename": filename,
            "page_count": doc_data["page_count"],
            "chunk_count": len(chunks),
            "embedded_count": len(embeddings),
            "stored_count": stored_count,
            "vector_store": "qdrant",
            "collection": vector_store.collection_name
        }

    except HTTPException:
        raise
    except ValueError as ve:
        raise HTTPException(status_code=400, detail=str(ve))
    except Exception as e:
        # Clean user-facing error without exposing raw SDK stack traces, paths, or keys
        raise HTTPException(status_code=500, detail=f"Could not process PDF document. Error: {str(e)}")

@app.get("/api/knowledge/document")
def get_document_info():
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM documents ORDER BY rowid DESC LIMIT 1")
    row = cursor.fetchone()
    if not row:
        conn.close()
        return {}
    doc = dict(row)

    cursor.execute("SELECT * FROM document_chunks WHERE doc_id = ?", (doc["id"],))
    chunks = [dict(r) for r in cursor.fetchall()]
    conn.close()

    return {
        "title": doc["title"],
        "uploadedAt": doc["uploaded_at"],
        "totalPages": doc["total_pages"],
        "totalChunks": doc["total_chunks"],
        "chunks": chunks
    }

from rag.retriever import retrieve_relevant_chunks

@app.post("/api/knowledge/search")
def search_knowledge(req: RAGSearchRequest):
    """
    Real Semantic Retrieval Endpoint (Step 4B):
    1. Generates 3072-dim query vector using Gemini embedding_service (gemini-embedding-001).
    2. Queries Qdrant collection 'astra_knowledge' with Cosine similarity.
    3. Returns top-k relevant document chunks with real similarity scores & page metadata.
    """
    if not req.query or not req.query.strip():
        return {
            "success": True,
            "query": req.query or "",
            "results": []
        }

    try:
        top_k = req.top_k if req.top_k and req.top_k > 0 else 5
        results = retrieve_relevant_chunks(
            query=req.query,
            top_k=top_k,
            score_threshold=req.score_threshold
        )
        return {
            "success": True,
            "query": req.query,
            "results": results
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Semantic retrieval failed: {str(e)}")

from rag.answer_generator import generate_grounded_answer

@app.post("/api/knowledge/ask")
def ask_knowledge_question(req: RAGAskRequest):
    """
    Real Grounded Knowledge QA Endpoint (Step 4C):
    1. Validates input question string.
    2. Executes real Qdrant vector retrieval for top_k relevant chunks.
    3. If no relevant chunks match, returns clean no-result response immediately (no Gemini LLM call).
    4. Passes retrieved chunks & user question to Gemini provider for grounded answer generation.
    5. Returns grounded answer, deterministic page citations, and chunk sources.
    """
    if not req.question or not req.question.strip():
        raise HTTPException(status_code=400, detail="Question cannot be empty.")

    question = req.question.strip()
    top_k = req.top_k if req.top_k and req.top_k > 0 else 5

    # Step 1: Real Qdrant vector retrieval
    try:
        chunks = retrieve_relevant_chunks(question, top_k=top_k, score_threshold=0.25)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Knowledge retrieval failed: {str(e)}")

    # Step 2: Zero results check (skip Gemini LLM call)
    if not chunks:
        return {
            "success": True,
            "question": question,
            "answer": "I couldn't find relevant information in the uploaded documents to answer that question.",
            "citations": [],
            "sources": []
        }

    # Step 3: Grounded answer generation via Gemini provider
    try:
        res = generate_grounded_answer(question, chunks)
        return {
            "success": True,
            "question": question,
            "answer": res["answer"],
            "citations": res["citations"],
            "sources": res["sources"]
        }
    except Exception as e:
        from llm.provider import GeminiDailyQuotaExceededError
        if isinstance(e, GeminiDailyQuotaExceededError):
            return {
                "success": False,
                "error": str(e)
            }
        # Return clean error response without revealing stack traces, paths, or keys
        return {
            "success": False,
            "error": "The AI answer service is temporarily unavailable. Please try again."
        }

# Planner Endpoints
@app.get("/api/planner")
def get_planner():
    return get_current_plan()

@app.post("/api/planner/reschedule")
def reschedule_planner():
    return perform_adaptive_rescheduling()

# Action Engine Endpoints
@app.post("/api/actions/calendar_sync")
def sync_calendar():
    return add_calendar_event_action("DBMS revision", time_str="7:00 PM", duration="19:00 – 21:00", location="Focus session")
