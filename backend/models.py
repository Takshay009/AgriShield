from sqlalchemy import Column, Integer, String, DateTime, Boolean
from sqlalchemy.orm import relationship
from database import Base
from datetime import datetime

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, index=True)
    email = Column(String, unique=True, index=True)
    password_hash = Column(String)
    role = Column(String, default="farmer") # 'farmer' | 'admin'
    created_at = Column(DateTime, default=datetime.utcnow)

class Farm(Base):
    __tablename__ = "farms"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, index=True)
    name = Column(String, index=True)
    lat = Column(String)
    lng = Column(String)
    boundary_geojson = Column(String) # Stored as JSON string
    area_hectares = Column(String)
    crop_type = Column(String, nullable=True)
    location = Column(String, nullable=True)
    soil_type = Column(String, nullable=True)
    irrigation_source = Column(String, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    nft_url = Column(String, nullable=True)

class FarmMetric(Base):
    __tablename__ = "farm_metrics"

    id = Column(Integer, primary_key=True, index=True)
    farm_id = Column(Integer, index=True)
    captured_at = Column(DateTime, default=datetime.utcnow)
    ndvi_avg = Column(String) # Float as string or Float
    rainfall_mm = Column(String)
    temp_c = Column(String)
    humidity = Column(String)
    risk_level = Column(String) # 'low'|'medium'|'high'
    risk_probability = Column(String) # Float as string
    source = Column(String) # 'mock'|'sentinel_hub'

class EscalationTicket(Base):
    __tablename__ = "escalation_tickets"

    id = Column(Integer, primary_key=True, index=True)
    ticket_id = Column(String, unique=True, index=True)
    farm_id = Column(Integer)
    health_report_id = Column(String)
    disease_name = Column(String)
    ai_confidence = Column(String)
    severity = Column(String)
    priority = Column(String)
    symptoms = Column(String, nullable=True)
    image_path = Column(String, nullable=True)
    audio_path = Column(String, nullable=True)
    farmer_description = Column(String, nullable=True)
    status = Column(String, default="open")
    assigned_to = Column(String, nullable=True)
    response = Column(String, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    resolved_at = Column(DateTime, nullable=True)


class Claim(Base):
    __tablename__ = "claims"

    id = Column(Integer, primary_key=True, index=True)
    farm_id = Column(Integer, index=True)
    user_id = Column(Integer, index=True)
    metric_id = Column(Integer, index=True)
    status = Column(String, default="pending") # pending, approved, rejected
    is_eligible = Column(Boolean, default=False)
    proof_data = Column(String, nullable=True) # ZK proof JSON
    tx_hash = Column(String, nullable=True) # Blockchain transaction hash
    created_at = Column(DateTime, default=datetime.utcnow)
