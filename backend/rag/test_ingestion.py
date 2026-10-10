import os
import sys
import logging

# Ensure backend path is on sys.path
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from rag.document_loader import load_pdf_document
from rag.chunker import clean_text, chunk_document, ingest_pdf_and_chunk

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("test_ingestion")

def create_mock_pdf_file(filename: str) -> str:
    """Generates a multi-page PDF document for realistic ingestion testing."""
    page_texts = [
        # Page 1: 1NF and 2NF
        """
        Database Management Systems - Module 1: Functional Dependencies and Normalization
        
        First Normal Form (1NF) requires that all attributes in a relation contain atomic values with no repeating groups or nested relations. Every attribute value must be a single indivisible value from its domain.
        
        Second Normal Form (2NF) builds upon 1NF requirements. A relation schema R is in 2NF if every non-prime attribute A in R is fully functionally dependent on any key of R. In other words, 2NF eliminates partial functional dependencies where a non-prime attribute depends on only a proper subset of a composite candidate key. If candidate keys are simple, 1NF automatically implies 2NF.
        
        Functional Dependency Definition: A functional dependency X -> Y specifies that the value of X uniquely determines the value of Y in any valid relation instance r(R). X is called the determinant and Y is the dependent.
        """,
        # Page 2: 3NF and BCNF
        """
        Database Management Systems - Module 2: Third Normal Form and Boyce-Codd Normal Form
        
        Third Normal Form (3NF) requires a relation schema R to be in 2NF and have no transitive functional dependencies for non-prime attributes. Formally, a relation schema R is in 3NF if for every non-trivial functional dependency X -> A, either X is a superkey of R, or A is a prime attribute.
        
        Boyce-Codd Normal Form (BCNF) is a stricter version of 3NF that eliminates all transitive and partial dependencies. A relation schema R is in BCNF if for every non-trivial functional dependency X -> A, X MUST be a superkey of R. Unlike 3NF, BCNF does not allow A to be a prime attribute if X is not a superkey.
        
        Decomposition Properties:
        1. Lossless-Join Property: Ensures that joining decomposed relations R1 and R2 recovers exactly the original relation R without spurious tuples. R1 ∩ R2 -> R1 or R1 ∩ R2 -> R2.
        2. Dependency Preservation: Ensures that all functional dependencies in F can be checked efficiently within decomposed relations without performing expensive joins.
        """,
        # Page 3: 4NF and Multi-valued dependencies
        """
        Database Management Systems - Module 3: Fourth Normal Form and Multi-Valued Dependencies
        
        Fourth Normal Form (4NF) addresses multi-valued dependencies (MVD). A multi-valued dependency X ->-> Y specifies that the presence of X in a tuple determines a set of values for Y, independent of all other attributes in the relation.
        
        A relation schema R is in 4NF if for every non-trivial multi-valued dependency X ->-> Y, X is a superkey of R. 4NF eliminates multi-valued redundancies that cannot be represented using functional dependencies alone.
        
        Summary Theorem:
        - 3NF guarantees both Lossless-Join and Dependency Preservation.
        - BCNF guarantees Lossless-Join, but Dependency Preservation is not always guaranteed.
        - 4NF guarantees Lossless-Join for multi-valued decompositions.
        """
    ]

    objects = []
    page_ids = []
    
    objects.append('') # 1: catalog
    objects.append('') # 2: pages
    objects.append('<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>') # 3: font

    curr_id = 4
    for ptext in page_texts:
        clean_ptext = ptext.replace('(', '\\(').replace(')', '\\)').replace('\n', ' ').replace('∩', 'INTERSECT').replace('->->', 'MVD').replace('->', 'TO')
        stream_content = f'BT /F1 10 Tf 40 750 Td ({clean_ptext[:250]}) Tj ET\nBT /F1 10 Tf 40 600 Td ({clean_ptext[250:500]}) Tj ET\nBT /F1 10 Tf 40 450 Td ({clean_ptext[500:]}) Tj ET'
        stream_id = curr_id
        objects.append(f'<< /Length {len(stream_content)} >>\nstream\n{stream_content}\nendstream')
        curr_id += 1
        
        page_id = curr_id
        objects.append(f'<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Contents {stream_id} 0 R /Resources << /Font << /F1 3 0 R >> >> >>')
        curr_id += 1
        page_ids.append(f'{page_id} 0 R')

    kids_str = ' '.join(page_ids)
    objects[0] = f'<< /Type /Catalog /Pages 2 0 R >>'
    objects[1] = f'<< /Type /Pages /Kids [{kids_str}] /Count {len(page_ids)} >>'

    pdf_path = os.path.abspath(filename)
    with open(pdf_path, 'wb') as f:
        f.write(b'%PDF-1.4\n')
        xref = [0]
        for idx, obj in enumerate(objects, 1):
            xref.append(f.tell())
            f.write(f'{idx} 0 obj\n{obj}\nendobj\n'.encode('utf-8'))
        start_xref = f.tell()
        f.write(f'xref\n0 {len(objects)+1}\n0000000000 65535 f \n'.encode('utf-8'))
        for off in xref[1:]:
            f.write(f'{off:010d} 00000 n \n'.encode('utf-8'))
        f.write(f'trailer\n<< /Size {len(objects)+1} /Root 1 0 R >>\nstartxref\n{start_xref}\n%%EOF\n'.encode('utf-8'))

    return pdf_path

def run_tests():
    print("==================================================")
    print("RUNNING PHASE 2 STEP 2: PDF INGESTION & CHUNKING TESTS")
    print("==================================================")

    pdf_path = create_mock_pdf_file("sample_dbms_test_doc.pdf")
    print(f"Created test PDF at: {pdf_path}")

    # Test 1: Load PDF Document
    doc_res = load_pdf_document(pdf_path)
    assert doc_res["page_count"] == 3, f"Expected 3 pages, got {doc_res['page_count']}"
    assert len(doc_res["pages"]) == 3, "Pages array length mismatch"
    assert doc_res["total_characters"] > 0, "Zero characters extracted"
    print(f"[TEST 1 PASS] PDF Loader: {doc_res['page_count']} pages, {doc_res['total_characters']} characters extracted.")

    # Test 2: Text Cleaning Verification
    dirty_text = "   First  Normal   Form   (1NF)\r\n\r\n\n  Attributes  must be   atomic.   "
    cleaned = clean_text(dirty_text)
    assert "First Normal Form (1NF)" in cleaned, "Cleaning destroyed core text"
    assert "\r\n" not in cleaned, "Carriage returns were not removed"
    print("[TEST 2 PASS] Text Cleaning: Whitespace & line breaks normalized.")

    # Test 3: Chunking & Word Overlap Verification (chunk_size=120, overlap=30)
    result = ingest_pdf_and_chunk(pdf_path, chunk_size_words=120, chunk_overlap_words=30)
    chunks = result["chunks"]

    assert len(chunks) > 1, f"Expected multiple chunks, got {len(chunks)}"
    print(f"[TEST 3 PASS] Chunking Produced: {len(chunks)} chunks from {result['total_words']} total words.")

    # Test 4: Overlap Verification between Chunk 0 and Chunk 1
    if len(chunks) >= 2:
        words_c0 = set(chunks[0]["text"].split())
        words_c1 = set(chunks[1]["text"].split())
        common_words = words_c0.intersection(words_c1)
        assert len(common_words) > 0, "No word overlap detected between consecutive chunks"
        print(f"[TEST 4 PASS] Overlap Verification: {len(common_words)} common words between Chunk 0 and Chunk 1.")

    # Test 5: Metadata Verification
    first_chunk = chunks[0]
    assert "chunk_id" in first_chunk, "Missing chunk_id"
    assert "page_start" in first_chunk, "Missing page_start"
    assert "page_end" in first_chunk, "Missing page_end"
    assert "word_count" in first_chunk, "Missing word_count"
    print(f"[TEST 5 PASS] Metadata Verified: chunk_id={first_chunk['chunk_id']}, pages={first_chunk['page_start']}-{first_chunk['page_end']}, words={first_chunk['word_count']}.")

    # Test 6: Safety / Invalid File Rejection
    try:
        load_pdf_document("non_existent_file.pdf")
        assert False, "Failed to reject missing file"
    except FileNotFoundError:
        print("[TEST 6 PASS] Safety Check: Missing file rejected with FileNotFoundError.")

    try:
        with open("dummy.txt", "w") as f:
            f.write("hello")
        load_pdf_document("dummy.txt")
        assert False, "Failed to reject non-PDF file"
    except ValueError:
        print("[TEST 6 PASS] Safety Check: Non-PDF extension rejected with ValueError.")
    finally:
        if os.path.exists("dummy.txt"):
            os.remove("dummy.txt")

    print("\nALL INGESTION & CHUNKING TESTS PASSED SUCCESSFULLY!")

if __name__ == "__main__":
    run_tests()
