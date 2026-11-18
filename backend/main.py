import os
import time
import json
import re
from fastapi import FastAPI, Depends, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from google import genai
from google.genai import types
from dotenv import load_dotenv

load_dotenv()

import models
from database import engine, get_db
from schemas import TicketRequest

try:
    models.Base.metadata.create_all(bind=engine)
except Exception as e:
    print(f"Database table initialization notice: {e}")

app = FastAPI(title="Ticket Triage Muscle Memory - Backend")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# In-memory dictionary for ultra-fast System-1 lookups
label_keywords = {
    "Billing": {},
    "Technical": {},
    "Account": {},
    "Other": {}
}

def check_learned_rules(text: str) -> str | None:
    text_lower = text.lower()
    words = set(re.findall(r'\b\w+\b', text_lower))
    
    candidate_labels = {}
    for word in words:
        qualifying = []
        for label, kw_dict in label_keywords.items():
            if kw_dict.get(word, 0) >= 2:
                qualifying.append(label)
        
        if len(qualifying) == 1:
            lbl = qualifying[0]
            candidate_labels[lbl] = candidate_labels.get(lbl, 0) + 1
            
    if candidate_labels:
        return max(candidate_labels, key=candidate_labels.get)
    return None

def call_gemini_api(text: str):
    api_key = os.getenv("GEMINI_API_KEY")
    if not api_key:
        return "Other", ["support"]
    
    client = genai.Client(api_key=api_key)
    prompt = f'Classify this support message into Billing, Technical, Account, or Other. Return JSON only: {{"label": "...", "keywords": ["1-3 lowercase keywords"]}}. Message: {text}'
    model_name = os.getenv("GEMINI_MODEL", "gemini-3.8-flash")
    
    try:
        response = client.models.generate_content(
            model=model_name,
            contents=prompt,
            config=types.GenerateContentConfig(
                response_mime_type="application/json",
                temperature=0.1
            )
        )
        data = json.loads(response.text)
        lbl = data.get("label", "Other")
        if lbl not in ["Billing", "Technical", "Account", "Other"]:
            lbl = "Other"
        kws = [k.lower().strip() for k in data.get("keywords", []) if k]
        return lbl, kws
    except Exception as e:
        print(f"Error calling Gemini API: {e}")
        return "Other", ["support"]

@app.post("/api/classify")
def classify_ticket(req: TicketRequest, db: Session = Depends(get_db)):
    start_time = time.time()
    text = req.text.strip()
    if not text:
        raise HTTPException(status_code=400, detail="Text cannot be empty")

    # System 1: Check learned rules
    rule_label = check_learned_rules(text)
    if rule_label:
        latency = round((time.time() - start_time) * 1000, 2)
        ticket = models.ClassifiedTicket(
            text=text, label=rule_label, source="RULE", latency_ms=latency
        )
        db.add(ticket)
        db.commit()
        return {
            "label": rule_label,
            "source": "RULE",
            "latency_ms": latency,
            "text": text
        }

    # System 2: Call Gemini API
    label, keywords = call_gemini_api(text)
    latency = round((time.time() - start_time) * 1000, 2)

    # Learn extracted keywords
    for kw in keywords:
        label_keywords[label][kw] = label_keywords[label].get(kw, 0) + 1

    ticket = models.ClassifiedTicket(
        text=text, label=label, source="GEMINI", latency_ms=latency
    )
    db.add(ticket)
    db.commit()

    return {
        "label": label,
        "source": "GEMINI",
        "latency_ms": latency,
        "text": text
    }

@app.get("/api/analytics")
def get_analytics(db: Session = Depends(get_db)):
    total_tickets = db.query(models.ClassifiedTicket).count()
    gemini_calls = db.query(models.ClassifiedTicket).filter(models.ClassifiedTicket.source == "GEMINI").count()
    rule_hits = db.query(models.ClassifiedTicket).filter(models.ClassifiedTicket.source == "RULE").count()
    recent = db.query(models.ClassifiedTicket).order_by(models.ClassifiedTicket.id.desc()).limit(15).all()
    
    return {
        "stats": {
            "total": total_tickets,
            "gemini_calls": gemini_calls,
            "rule_hits": rule_hits,
            "api_calls_saved": rule_hits
        },
        "learned_rules": label_keywords,
        "recent_tickets": [
            {"id": t.id, "text": t.text, "label": t.label, "source": t.source, "latency_ms": t.latency_ms}
            for t in recent
        ]
    }

@app.post("/api/reset")
def reset_demo(db: Session = Depends(get_db)):
    global label_keywords
    label_keywords = {"Billing": {}, "Technical": {}, "Account": {}, "Other": {}}
    db.query(models.ClassifiedTicket).delete()
    db.commit()
    return {"status": "cleared"}