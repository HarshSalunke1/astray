import os
import logging
from typing import List, Optional
from dotenv import load_dotenv

load_dotenv()

logger = logging.getLogger("astra.rag.embeddings")

DEFAULT_EMBEDDING_MODEL = os.getenv("GEMINI_EMBEDDING_MODEL", "gemini-embedding-001")
DEFAULT_API_KEY = os.getenv("LLM_API_KEY", "").strip()

class GeminiEmbeddingService:
    def __init__(self, api_key: Optional[str] = None, model: Optional[str] = None):
        self.api_key = api_key or DEFAULT_API_KEY
        self.model = model or DEFAULT_EMBEDDING_MODEL

    def is_configured(self) -> bool:
        return bool(self.api_key and self.api_key != "your_gemini_api_key_here")

    def generate_embedding(self, text: str) -> List[float]:
        """
        Generates a numeric vector embedding for the input text using Gemini API.
        Returns a list of float numbers representing vector embedding values.
        """
        if not self.is_configured():
            raise ValueError("LLM_API_KEY is missing or unconfigured. Cannot generate real embeddings.")

        if not text or not text.strip():
            raise ValueError("Text string cannot be empty for embedding generation.")

        from google import genai
        from google.genai import errors

        try:
            client = genai.Client(api_key=self.api_key)
            response = client.models.embed_content(
                model=self.model,
                contents=text
            )

            if not getattr(response, 'embeddings', None) or not response.embeddings[0].values:
                raise ValueError(f"Gemini API returned empty embedding vector for model '{self.model}'.")

            vector = response.embeddings[0].values
            if not isinstance(vector, list) or len(vector) == 0:
                raise ValueError("Returned embedding is not a valid non-empty float list.")

            logger.info(f"Successfully generated embedding vector of dimensionality {len(vector)} using model '{self.model}'.")
            return vector

        except errors.APIError as e:
            logger.error(f"Gemini API Embedding Error ({self.model}): code={getattr(e, 'code', 'N/A')}, message={getattr(e, 'message', str(e))}")
            raise e
        except Exception as e:
            logger.error(f"Failed to generate embedding with model '{self.model}': {str(e)}", exc_info=True)
            raise e

    def generate_embeddings_batch(self, texts: List[str]) -> List[List[float]]:
        """
        Generates numeric vector embeddings for a list of text strings.
        """
        return [self.generate_embedding(txt) for txt in texts]

# Singleton instance for application use
embedding_service = GeminiEmbeddingService()
