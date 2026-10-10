import math
import re
from database import get_db

def search_rag_chunks(query, document_chunks=None):
    if not query:
        return []

    conn = get_db()
    cursor = conn.cursor()

    if not document_chunks:
        cursor.execute("SELECT * FROM document_chunks")
        rows = cursor.fetchall()
        chunks = [dict(row) for row in rows]
    else:
        chunks = document_chunks

    conn.close()

    query_terms = [t.lower() for t in re.findall(r'\w+', query) if len(t) > 2]
    
    scored_chunks = []
    for chunk in chunks:
        chunk_text = (chunk["title"] + " " + chunk["text"]).lower()
        matches = sum(1 for term in query_terms if term in chunk_text)

        # Keyword & Topic Boosting
        q_lower = query.lower()
        if 'normalization' in q_lower and 'normalization' in chunk_text:
            matches += 2
        if 'bcnf' in q_lower and 'bcnf' in chunk_text:
            matches += 3
        if 'lossless' in q_lower and 'lossless' in chunk_text:
            matches += 3
        if '3nf' in q_lower and '3nf' in chunk_text:
            matches += 2

        base_score = min(0.96, 0.45 + (matches * 0.12)) if matches > 0 else 0.32
        score = round(base_score, 2)

        scored_chunks.append({
            "id": chunk["id"],
            "doc_id": chunk["doc_id"],
            "page": chunk["page"],
            "title": chunk["title"],
            "text": chunk["text"],
            "embedding_preview": chunk["embedding_preview"],
            "similarity_score": score,
            "similarity_percentage": f"{int(score * 100)}%"
        })

    scored_chunks.sort(key=lambda x: x["similarity_score"], reverse=True)
    return scored_chunks

def generate_rag_answer(query, top_chunks):
    if not top_chunks:
        return {
            "answer": "I couldn't find relevant passages in your uploaded notes. Could you rephrase your question?",
            "citations": []
        }

    primary = top_chunks[0]
    secondary = top_chunks[1] if len(top_chunks) > 1 else top_chunks[0]

    q_lower = query.lower()
    if 'normalization' in q_lower or 'bcnf' in q_lower or '3nf' in q_lower:
        answer = f"Based on page {primary['page']} of your DBMS notes ({primary['title']}): {primary['text']} Furthermore, page {secondary['page']} notes: {secondary['text']}"
    else:
        answer = f"According to page {primary['page']} of your notes ({primary['title']}): {primary['text']}"

    citations = list(set([f"DBMS Notes — Page {c['page']} ({c['title']})" for c in top_chunks[:2]]))

    return {
        "answer": answer,
        "citations": citations
    }
