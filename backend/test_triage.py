import unittest
from unittest.mock import patch
import os
import sys

# Ensure backend directory is in path
backend_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "backend"))
if backend_dir not in sys.path:
    sys.path.insert(0, backend_dir)

from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

import models
import database
from database import Base, get_db

# Create an in-memory test database shared across threads
TEST_SQLALCHEMY_DATABASE_URL = "sqlite:///:memory:"
test_engine = create_engine(
    TEST_SQLALCHEMY_DATABASE_URL,
    connect_args={"check_same_thread": False},
    poolclass=StaticPool,
)
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=test_engine)

def override_get_db():
    db = TestingSessionLocal()
    try:
        yield db
    finally:
        db.close()

import main
main.app.dependency_overrides[get_db] = override_get_db

class TestTicketTriage(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        Base.metadata.create_all(bind=test_engine)
        cls.client = TestClient(main.app)

    def setUp(self):
        # Reset rules and database before each test
        main.label_keywords = {
            "Billing": {},
            "Technical": {},
            "Account": {},
            "Other": {}
        }
        db = TestingSessionLocal()
        db.query(models.ClassifiedTicket).delete()
        db.commit()
        db.close()

    def test_check_learned_rules_empty(self):
        """No rules learned yet -> returns None"""
        self.assertIsNone(main.check_learned_rules("I was charged twice"))

    def test_check_learned_rules_threshold(self):
        """When a word reaches count >= 2, System-1 matches it"""
        main.label_keywords["Billing"]["charged"] = 2
        matched_label = main.check_learned_rules("Dispute request: customer charged incorrect amount")
        self.assertEqual(matched_label, "Billing")

    def test_rule_classification_fast_path(self):
        """Ensure RULE hits do NOT invoke Gemini API (quota preserved)"""
        main.label_keywords["Billing"]["charged"] = 2
        
        with patch("main.call_gemini_api") as mock_gemini:
            response = self.client.post("/api/classify", json={"text": "Charged twice on card"})
            self.assertEqual(response.status_code, 200)
            data = response.json()
            self.assertEqual(data["source"], "RULE")
            self.assertEqual(data["label"], "Billing")
            mock_gemini.assert_not_called()

    def test_gemini_classification_learns_keyword(self):
        """System-2 Gemini trains keywords into label_keywords and graduates to System-1"""
        with patch("main.call_gemini_api", return_value=("Technical", ["crash", "export"])) as mock_gemini:
            # First hit -> Gemini (System-2)
            r1 = self.client.post("/api/classify", json={"text": "The app crashes during export"})
            self.assertEqual(r1.status_code, 200)
            d1 = r1.json()
            self.assertEqual(d1["source"], "GEMINI")
            self.assertEqual(d1["label"], "Technical")
            self.assertEqual(main.label_keywords["Technical"]["crash"], 1)

            # Second hit -> Gemini reinforces "crash" (reaches 2)
            r2 = self.client.post("/api/classify", json={"text": "Fatal crash on launch"})
            self.assertEqual(r2.status_code, 200)
            d2 = r2.json()
            self.assertEqual(d2["source"], "GEMINI")
            self.assertEqual(main.label_keywords["Technical"]["crash"], 2)

        # Third hit with "crash" -> MUST BE RULE (System-1), saving Gemini quota!
        with patch("main.call_gemini_api") as mock_gemini:
            r3 = self.client.post("/api/classify", json={"text": "Another crash occurred"})
            self.assertEqual(r3.status_code, 200)
            d3 = r3.json()
            self.assertEqual(d3["source"], "RULE")
            self.assertEqual(d3["label"], "Technical")
            mock_gemini.assert_not_called()

    def test_analytics_and_reset_endpoints(self):
        """Test /api/analytics and /api/reset endpoints"""
        self.client.post("/api/classify", json={"text": "Dummy test ticket"})
        analytics_res = self.client.get("/api/analytics")
        self.assertEqual(analytics_res.status_code, 200)
        data = analytics_res.json()
        self.assertIn("stats", data)
        self.assertIn("learned_rules", data)
        self.assertIn("recent_tickets", data)

        reset_res = self.client.post("/api/reset")
        self.assertEqual(reset_res.status_code, 200)
        self.assertEqual(reset_res.json(), {"status": "cleared"})

if __name__ == "__main__":
    unittest.main()
