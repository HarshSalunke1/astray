import logging
from typing import List, Dict, Any, Optional
from .embeddings import embedding_service
from .vector_store import vector_store

logger = logging.getLogger("astra.rag.retriever")

# Default similarity threshold: Cosine similarity range is -1.0 to 1.0.
# Relevant document matches typically score >= 0.25 on 3072-dim embeddings.
DEFAULT_SIMILARITY_THRESHOLD: float = 0.25

def retrieve_relevant_chunks(
    query: str,
    top_k: int = 5,
    score_threshold: Optional[float] = DEFAULT_SIMILARITY_THRESHOLD
) -> List[Dict[str, Any]]:
    """
    Performs real semantic vector retrieval for a natural-language query:
    1. Validates query string.
    2. Generates query vector embedding using Gemini embedding service (gemini-embedding-001, 3072 dims).
    3. Executes nearest-neighbor search in Qdrant collection 'astra_knowledge' using Cosine distance.
    4. Filters results by score_threshold if specified.
    5. Returns structured chunk dictionaries with page boundaries, document filename, and similarity scores.

    Args:
        query: User input natural language query string.
        top_k: Maximum number of relevant chunks to retrieve (default: 5).
        score_threshold: Minimum cosine similarity score cutoff (default: 0.25).

    Returns:
        List of matching chunk dictionaries.
    """
    if not query or not isinstance(query, str) or not query.strip():
        logger.warning("Empty or invalid query provided for semantic retrieval.")
        return []

    if top_k <= 0:
        raise ValueError("top_k must be a positive integer greater than 0.")

    clean_query = query.strip()

    # Step 1: Generate real Gemini embedding vector for query
    try:
        query_vector = embedding_service.generate_embedding(clean_query)
    except Exception as e:
        logger.error(f"Failed to generate query embedding for query '{clean_query}': {e}")
        raise e

    # Step 2: Query persistent Qdrant vector store
    results = vector_store.search_similar_chunks(
        query_vector=query_vector,
        top_k=top_k,
        score_threshold=score_threshold
    )

    logger.info(
        f"Semantic retrieval for '{clean_query}': retrieved {len(results)} chunks "
        f"from Qdrant collection '{vector_store.collection_name}' (top_k={top_k}, score_threshold={score_threshold})."
    )

    return results
