import logging
from typing import List, Dict, Any, Optional
from llm.provider import llm_provider

logger = logging.getLogger("astra.rag.answer_generator")

SYSTEM_GROUNDED_PROMPT = """You are ASTRA's document-grounded knowledge assistant.
Your task is to answer the student's question using ONLY the provided retrieved document passages.

STRICT GROUNDING RULES:
1. Treat the retrieved passages as the absolute source of truth.
2. Do not introduce outside facts, general assumptions, or unverified claims not supported by the passages.
3. If the retrieved passages do not contain enough information to reliably answer the question, state explicitly: "The uploaded notes do not provide enough information to answer this question."
4. Do not pretend to have read the full document beyond the provided passages.
5. Preserve technical terminology, formulas, and definitions from the source text.
6. Provide a clear, structured, and student-friendly explanation directly answering the user's question."""

def generate_grounded_answer(
    question: str,
    retrieved_chunks: List[Dict[str, Any]]
) -> Dict[str, Any]:
    """
    Generates a document-grounded natural language answer using Gemini LLM provider
    and constructs deterministic page-level citation metadata.

    Args:
        question: User natural-language question.
        retrieved_chunks: List of retrieved chunk dictionaries from retriever.py.

    Returns:
        Dict containing answer string, citations list, and sources metadata list.
    """
    if not question or not question.strip():
        raise ValueError("Question string cannot be empty.")

    if not retrieved_chunks:
        return {
            "answer": "I couldn't find relevant information in the uploaded documents to answer that question.",
            "citations": [],
            "sources": []
        }

    # Step 1: Format retrieved context passages
    context_blocks = []
    for idx, chk in enumerate(retrieved_chunks, 1):
        filename = chk.get("filename", "Document")
        p_start = chk.get("page_start", 1)
        p_end = chk.get("page_end", 1)
        page_info = f"Page {p_start}" if p_start == p_end else f"Pages {p_start}–{p_end}"
        text = chk.get("text", "").strip()

        context_blocks.append(
            f"[Source {idx}]\n"
            f"Filename: {filename}\n"
            f"{page_info}\n"
            f"Passage Content:\n{text}\n"
        )

    formatted_context = "\n--------------------\n".join(context_blocks)

    user_prompt = (
        f"USER QUESTION:\n{question.strip()}\n\n"
        f"RETRIEVED CONTEXT FROM UPLOADED NOTES:\n"
        f"{formatted_context}\n\n"
        f"Please generate a grounded, accurate explanation answering the question based ONLY on the retrieved passages above."
    )

    # Step 2: Call Gemini LLM Provider for grounded answer text
    try:
        raw_answer = llm_provider.generate_grounded_text(
            prompt=user_prompt,
            system_instruction=SYSTEM_GROUNDED_PROMPT
        )
        if not raw_answer:
            raw_answer = "The uploaded notes do not provide enough information to answer this question."
    except Exception as e:
        logger.error(f"Gemini grounded answer generation error: {e}", exc_info=True)
        raise e

    # Step 3: Build deterministic citations and sources metadata from retrieved chunks
    citations = []
    seen_citations = set()

    for chk in retrieved_chunks:
        filename = chk.get("filename", "")
        p_start = chk.get("page_start", 1)
        p_end = chk.get("page_end", 1)
        cite_key = (filename, p_start, p_end)

        if cite_key not in seen_citations and filename:
            seen_citations.add(cite_key)
            citations.append({
                "filename": filename,
                "page_start": p_start,
                "page_end": p_end
            })

    sources = [
        {
            "chunk_id": chk.get("chunk_id", ""),
            "score": chk.get("score", 0.0),
            "filename": chk.get("filename", ""),
            "page_start": chk.get("page_start", 1),
            "page_end": chk.get("page_end", 1)
        }
        for chk in retrieved_chunks
    ]

    return {
        "answer": raw_answer,
        "citations": citations,
        "sources": sources
    }
