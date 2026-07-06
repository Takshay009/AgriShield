import uuid
from datetime import datetime
from typing import Optional
from database import SessionLocal
import models
from sms_service import send_sms

ESCALATION_THRESHOLD = 0.7  # Confidence below this triggers escalation


def should_escalate(confidence: float, severity: str) -> bool:
    """Determine if a diagnosis needs RSK escalation."""
    if confidence < ESCALATION_THRESHOLD:
        return True
    if severity == "high" and confidence < 0.85:
        return True
    return False


def create_escalation_ticket(
    farm_id: int,
    health_report_id: str,
    disease_name: str,
    confidence: float,
    severity: str,
    symptoms: list[str],
    image_path: Optional[str] = None,
    audio_path: Optional[str] = None,
    farmer_description: Optional[str] = None,
) -> dict:
    """Create an RSK escalation ticket."""
    ticket_id = f"RSK-{uuid.uuid4().hex[:8].upper()}"

    priority = "urgent" if severity == "high" else "normal"
    if confidence < 0.5:
        priority = "urgent"  # Very low confidence = needs human expert

    return {
        "ticket_id": ticket_id,
        "farm_id": farm_id,
        "health_report_id": health_report_id,
        "disease_name": disease_name,
        "ai_confidence": round(confidence, 3),
        "severity": severity,
        "priority": priority,
        "symptoms": symptoms,
        "image_path": image_path,
        "audio_path": audio_path,
        "farmer_description": farmer_description,
        "status": "open",
        "assigned_to": None,
        "response": None,
        "created_at": datetime.utcnow().isoformat(),
        "resolved_at": None,
    }


# In-memory ticket store (swap for DB in production)
_tickets: list[dict] = []


def add_ticket(ticket: dict) -> dict:
    """Add ticket to store."""
    _tickets.append(ticket)
    return ticket


def get_open_tickets() -> list[dict]:
    """Get all open RSK tickets."""
    return [t for t in _tickets if t["status"] == "open"]


def get_all_tickets() -> list[dict]:
    """Get all tickets."""
    return list(_tickets)


def respond_to_ticket(ticket_id: str, response: str, expert_name: str = "RSK Expert") -> Optional[dict]:
    """RSK expert responds to a ticket."""
    for ticket in _tickets:
        if ticket["ticket_id"] == ticket_id:
            ticket["status"] = "resolved"
            ticket["response"] = response
            ticket["assigned_to"] = expert_name
            ticket["resolved_at"] = datetime.utcnow().isoformat()
            
            # --- Closed-Loop SMS Notification ---
            try:
                db = SessionLocal()
                farm = db.query(models.Farm).filter(models.Farm.id == ticket["farm_id"]).first()
                if farm:
                    user = db.query(models.User).filter(models.User.id == farm.user_id).first()
                    if user and user.phone:
                        msg = f"🌾 AgriShield RSK Update: Expert {expert_name} reviewed your crop issue #{ticket_id}. Advice: {response}. Apply recommended treatment immediately."
                        print(f"[RSK Closed-Loop Push] Sending SMS to {user.phone}: {msg}")
                        send_sms(user.phone, msg)
                db.close()
            except Exception as e:
                print(f"[RSK SMS Error] Failed to send closed-loop SMS: {e}")

            return ticket
    return None
