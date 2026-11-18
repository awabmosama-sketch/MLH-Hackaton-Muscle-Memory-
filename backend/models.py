from sqlalchemy import Column, Integer, String, DateTime, Float
from sqlalchemy.sql import func
from database import Base

class ClassifiedTicket(Base):
    __tablename__ = "classified_tickets"

    id = Column(Integer, primary_key=True, index=True)
    text = Column(String, nullable=False)
    label = Column(String, nullable=False)
    source = Column(String, nullable=False)  # GEMINI or RULE
    latency_ms = Column(Float, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

class LearnedRule(Base):
    __tablename__ = "learned_rules"

    id = Column(Integer, primary_key=True, index=True)
    keyword = Column(String, unique=True, index=True, nullable=False)
    label = Column(String, nullable=False)
    hit_count = Column(Integer, default=1)