import os
import sys
import requests

def test_pdf_upload():
    url = "http://localhost:8000/api/knowledge/upload"
    pdf_path = os.path.abspath("sample_dbms_test_doc.pdf")
    
    if not os.path.exists(pdf_path):
        print(f"Error: {pdf_path} does not exist.")
        sys.exit(1)

    print(f"Testing POST {url} with file: {pdf_path}")
    
    with open(pdf_path, "rb") as f:
        files = {"file": ("sample_dbms_test_doc.pdf", f, "application/pdf")}
        response = requests.post(url, files=files)

    print(f"Response Status Code: {response.status_code}")
    print(f"Response JSON: {response.json()}")

    assert response.status_code == 200, f"Expected 200 OK, got {response.status_code}"
    data = response.json()
    assert data["success"] is True, "Success should be True"
    assert data["filename"] == "sample_dbms_test_doc.pdf"
    assert data["page_count"] == 3
    assert data["chunk_count"] > 0
    assert data["embedded_count"] == data["chunk_count"]
    assert data["stored_count"] == data["chunk_count"]
    assert data["vector_store"] == "qdrant"
    assert data["collection"] == "astra_knowledge"
    
    print("\n--- TEST 1 (VALID PDF UPLOAD) PASSED ---")

def test_invalid_file_upload():
    url = "http://localhost:8000/api/knowledge/upload"
    files = {"file": ("invalid_file.txt", b"Hello world", "text/plain")}
    response = requests.post(url, files=files)
    
    print(f"\nInvalid File Response Status Code: {response.status_code}")
    print(f"Invalid File Response JSON: {response.json()}")
    assert response.status_code == 400, f"Expected 400 Bad Request, got {response.status_code}"
    print("--- TEST 2 (INVALID EXTENSION REJECTION) PASSED ---")

def test_reupload_idempotency():
    url = "http://localhost:8000/api/knowledge/upload"
    pdf_path = os.path.abspath("sample_dbms_test_doc.pdf")
    
    print("\nRe-uploading same PDF to test endpoint re-upload behavior...")
    
    with open(pdf_path, "rb") as f:
        files = {"file": ("sample_dbms_test_doc.pdf", f, "application/pdf")}
        response1 = requests.post(url, files=files)
    assert response1.status_code == 200
    res1 = response1.json()

    with open(pdf_path, "rb") as f:
        files = {"file": ("sample_dbms_test_doc.pdf", f, "application/pdf")}
        response2 = requests.post(url, files=files)
    assert response2.status_code == 200
    res2 = response2.json()

    assert res1["stored_count"] == res2["stored_count"], f"Expected stored counts to match ({res1['stored_count']}), got {res2['stored_count']}"
    print(f"First upload stored: {res1['stored_count']}, Re-upload stored: {res2['stored_count']}")
    print("--- TEST 3 (IDEMPOTENCY / RE-UPLOAD API SUCCESS) PASSED ---")

if __name__ == "__main__":
    test_pdf_upload()
    test_invalid_file_upload()
    test_reupload_idempotency()
