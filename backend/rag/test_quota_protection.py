import os
import sys
import unittest
from unittest.mock import MagicMock, patch

# Add backend directory to sys.path
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from llm.provider import (
    LLMProvider,
    GeminiDailyQuotaExceededError,
    DAILY_QUOTA_ERROR_MESSAGE,
    is_daily_quota_error
)

class TestGeminiQuotaProtection(unittest.TestCase):
    """
    Test suite verifying Gemini daily quota exhaustion detection, short-circuiting,
    fallback model skipping, and clean user error reporting.
    """

    def setUp(self):
        # Exact structure of Google GenAI SDK 429 FreeTier daily quota error
        self.raw_daily_quota_error_msg = (
            "429 RESOURCE_EXHAUSTED. {'error': {'code': 429, 'message': "
            "'You exceeded your current quota, please check your plan and billing details. "
            "Quota exceeded for metric: generativelanguage.googleapis.com/generate_content_free_tier_requests, "
            "limit: 20, model: gemini-3.6-flash\\nPlease retry in 59.76s.', 'status': 'RESOURCE_EXHAUSTED', "
            "'details': [{'@type': 'type.googleapis.com/google.rpc.QuotaFailure', 'violations': "
            "[{'quotaMetric': 'generativelanguage.googleapis.com/generate_content_free_tier_requests', "
            "'quotaId': 'GenerateRequestsPerDayPerProjectPerModel-FreeTier', "
            "'quotaDimensions': {'location': 'global', 'model': 'gemini-3.6-flash'}, 'quotaValue': '20'}]}]}}"
        )
        self.daily_quota_exception = Exception(self.raw_daily_quota_error_msg)

        # Transient 429 error structure (e.g. per-minute rate spike)
        self.transient_429_msg = "429 Too Many Requests. Rate limit exceeded. Please try again in 2 seconds."
        self.transient_exception = Exception(self.transient_429_msg)

    def test_1_detection_logic(self):
        """Verify is_daily_quota_error correctly identifies daily quota errors vs transient rate limits."""
        # 1. Daily quota error must return True
        self.assertTrue(is_daily_quota_error(self.daily_quota_exception))

        # 2. Transient 429 error without daily markers must return False
        self.assertFalse(is_daily_quota_error(self.transient_exception))

        # 3. None or standard 500 error must return False
        self.assertFalse(is_daily_quota_error(None))
        self.assertFalse(is_daily_quota_error(Exception("500 Internal Server Error")))

    @patch("google.genai.Client")
    def test_2_fallback_skipping_and_no_retry_loop(self, mock_client_cls):
        """Verify fallback model chain is skipped immediately on daily quota error and called exactly once."""
        mock_client = MagicMock()
        mock_client_cls.return_value = mock_client

        # Configure generate_content to raise daily quota error
        mock_client.models.generate_content.side_effect = self.daily_quota_exception

        provider = LLMProvider(provider="gemini", api_key="dummy_test_key_for_unit_test", model="gemini-3.6-flash")

        # Calling generate_grounded_text must raise GeminiDailyQuotaExceededError
        with self.assertRaises(GeminiDailyQuotaExceededError) as ctx:
            provider.generate_grounded_text("Explain BCNF", "System prompt")

        # Verify exact error message
        self.assertEqual(str(ctx.exception), DAILY_QUOTA_ERROR_MESSAGE)

        # CRITICAL VERIFICATION: generate_content must be called EXACTLY 1 time (fallback models skipped)
        self.assertEqual(mock_client.models.generate_content.call_count, 1)

    @patch("google.genai.Client")
    def test_3_generate_completion_daily_quota_handling(self, mock_client_cls):
        """Verify /api/chat provider completion handles daily quota error cleanly."""
        mock_client = MagicMock()
        mock_client_cls.return_value = mock_client
        mock_client.models.generate_content.side_effect = self.daily_quota_exception

        provider = LLMProvider(provider="gemini", api_key="dummy_test_key_for_unit_test", model="gemini-3.6-flash")
        res = provider.generate_completion("Hello", [], {}, [])

        self.assertTrue(res.get("error"))
        self.assertEqual(res.get("error_type"), "DAILY_QUOTA_EXHAUSTED")
        self.assertEqual(res.get("message"), DAILY_QUOTA_ERROR_MESSAGE)
        # Ensure only 1 call attempt occurred
        self.assertEqual(mock_client.models.generate_content.call_count, 1)

if __name__ == "__main__":
    unittest.main()
