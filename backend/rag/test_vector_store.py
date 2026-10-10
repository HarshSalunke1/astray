import os
import sys
import logging
from qdrant_client import QdrantClient

# Ensure backend directory is on sys.path
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from rag.chunker import ingest_pdf_and_chunk
from rag.embeddings import embedding_service
from rag.vector_store import QdrantVectorStore

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("test_vector_store")

def run_tests():
    print("==================================================")
    print("RUNNING PHASE 2 STEP 3: QDRANT VECTOR STORAGE TESTS")
    print("==================================================")

    test_db_path = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "test_qdrant_db"))
    test_collection = "astra_knowledge_test"

    # Step 1: Ensure PDF exists and run Ingestion Pipeline (Step 2)
    pdf_path = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "sample_dbms_test_doc.pdf"))
    if not os.path.exists(pdf_path):
        from rag.test_ingestion import create_mock_pdf_file
        pdf_path = create_mock_pdf_file(pdf_path)

    print(f"[TEST SETUP] Using test PDF: {pdf_path}")
    ingest_result = ingest_pdf_and_chunk(pdf_path, chunk_size_words=150, chunk_overlap_words=30)
    chunks = ingest_result["chunks"]
    original_filename = ingest_result["original_filename"]
    print(f"[TEST SETUP] PDF Ingested & Chunked: {len(chunks)} chunks produced.")

    # Step 2: Generate Real Gemini Vector Embeddings (Step 1)
    chunk_texts = [c["text"] for c in chunks]
    print(f"[TEST EMBEDDINGS] Requesting real Gemini API embeddings for {len(chunk_texts)} chunks...")
    embeddings = embedding_service.generate_embeddings_batch(chunk_texts)

    assert len(embeddings) == len(chunks), "Embeddings count mismatch"
    vector_dim = len(embeddings[0])
    assert vector_dim == 3072, f"Expected 3072 dimensions, got {vector_dim}"
    print(f"[TEST EMBEDDINGS PASS] Generated {len(embeddings)} real vectors of dimension {vector_dim} using model '{embedding_service.model}'.")

    # Step 3: Process A - Initialize Qdrant & Upsert Points
    store_a = QdrantVectorStore(path=test_db_path, collection_name=test_collection)
    store_a.ensure_collection(vector_size=vector_dim)

    upserted_count = store_a.upsert_chunks(chunks, embeddings, original_filename=original_filename)
    assert upserted_count == len(chunks), "Upsert count mismatch"
    print(f"[PROCESS A PASS] Upserted {upserted_count} real vector points into local Qdrant store.")

    info_a = store_a.get_collection_info()
    assert info_a["points_count"] == len(chunks), f"Expected {len(chunks)} points, got {info_a['points_count']}"
    assert info_a["vector_size"] == 3072, f"Expected vector_size 3072, got {info_a['vector_size']}"
    assert "COSINE" in str(info_a["distance_metric"]).upper(), f"Expected COSINE metric, got {info_a['distance_metric']}"
    print(f"[COLLECTION VERIFIED] Name: {info_a['name']}, Points: {info_a['points_count']}, Dim: {info_a['vector_size']}, Metric: {info_a['distance_metric']}")

    # Close Process A store connection to write/flush to disk
    store_a.close()

    # Step 4: Process B Simulation - Fresh Client Instance Reading From Disk
    print("\n[PROCESS B PERSISTENCE TEST] Instantiating brand new QdrantClient pointing at disk path...")
    client_b = QdrantClient(path=test_db_path)
    res_b = client_b.get_collection(collection_name=test_collection)

    assert res_b.points_count == len(chunks), f"Process B persistence failed: expected {len(chunks)} points, found {res_b.points_count}"
    assert res_b.config.params.vectors.size == 3072, "Process B vector size mismatch"
    print(f"[PROCESS B PASS] Verified Disk Persistence! New client found {res_b.points_count} points on disk.")

    # Retrieve point payload metadata sample from Process B
    scroll_res, _ = client_b.scroll(collection_name=test_collection, limit=1, with_payload=True, with_vectors=False)
    assert len(scroll_res) > 0, "Failed to retrieve stored payload from Qdrant"
    sample_payload = scroll_res[0].payload

    required_payload_keys = [
        "document_id", "original_filename", "chunk_id", "chunk_index",
        "text", "page_start", "page_end", "word_count", "character_count"
    ]
    for key in required_payload_keys:
        assert key in sample_payload, f"Payload missing required key: '{key}'"

    print(f"[PAYLOAD VERIFIED] Sample Point Chunk ID: '{sample_payload['chunk_id']}', Pages: {sample_payload['page_start']}-{sample_payload['page_end']}, Words: {sample_payload['word_count']}")
    client_b.close()

    # Step 5: Idempotency / Re-indexing Test
    print("\n[IDEMPOTENCY TEST] Re-upserting identical chunks to verify no duplicate points are created...")
    store_c = QdrantVectorStore(path=test_db_path, collection_name=test_collection)
    store_c.upsert_chunks(chunks, embeddings, original_filename=original_filename)
    
    count_after_reindex = store_c.count_points()
    assert count_after_reindex == len(chunks), f"Idempotency test failed: expected {len(chunks)} points, found {count_after_reindex}"
    print(f"[IDEMPOTENCY PASS] Re-indexing identical chunks resulted in exactly {count_after_reindex} points (zero duplicates created).")
    store_c.close()

    print("\nALL PHASE 2 STEP 3 QDRANT VECTOR STORAGE TESTS PASSED SUCCESSFULLY!")

if __name__ == "__main__":
    run_tests()
