import uuid
import json
from datetime import datetime
from typing import Optional
from database import SessionLocal
import models
from sms_service import send_sms

ESCALATION_THRESHOLD = 0.7


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
    """Create an RSK escalation ticket dict."""
    ticket_id = f"RSK-{uuid.uuid4().hex[:8].upper()}"

    priority = "urgent" if severity == "high" else "normal"
    if confidence < 0.5:
        priority = "urgent"

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


def _ticket_to_dict(ticket: models.EscalationTicket) -> dict:
    return {
        "ticket_id": ticket.ticket_id,
        "farm_id": ticket.farm_id,
        "health_report_id": ticket.health_report_id,
        "disease_name": ticket.disease_name,
        "ai_confidence": float(ticket.ai_confidence) if ticket.ai_confidence else 0.0,
        "severity": ticket.severity,
        "priority": ticket.priority,
        "symptoms": json.loads(ticket.symptoms) if ticket.symptoms else [],
        "image_path": ticket.image_path,
        "audio_path": ticket.audio_path,
        "farmer_description": ticket.farmer_description,
        "status": ticket.status,
        "assigned_to": ticket.assigned_to,
        "response": ticket.response,
        "created_at": ticket.created_at.isoformat() if ticket.created_at else None,
        "resolved_at": ticket.resolved_at.isoformat() if ticket.resolved_at else None,
    }


def add_ticket(ticket: dict) -> dict:
    """Save ticket to database."""
    db = SessionLocal()
    try:
        db_ticket = models.EscalationTicket(
            ticket_id=ticket["ticket_id"],
            farm_id=ticket["farm_id"],
            health_report_id=ticket["health_report_id"],
            disease_name=ticket["disease_name"],
            ai_confidence=str(ticket["ai_confidence"]),
            severity=ticket["severity"],
            priority=ticket["priority"],
            symptoms=json.dumps(ticket.get("symptoms", [])),
            image_path=ticket.get("image_path"),
            audio_path=ticket.get("audio_path"),
            farmer_description=ticket.get("farmer_description"),
            status=ticket.get("status", "open"),
            assigned_to=ticket.get("assigned_to"),
            response=ticket.get("response"),
            created_at=datetime.utcnow(),
            resolved_at=None,
        )
        db.add(db_ticket)
        db.commit()
        db.refresh(db_ticket)
        return _ticket_to_dict(db_ticket)
    except Exception as e:
        db.rollback()
        print(f"Error saving escalation ticket: {e}")
        raise
    finally:
        db.close()


def get_open_tickets() -> list[dict]:
    """Get all open RSK tickets from database."""
    db = SessionLocal()
    try:
        tickets = db.query(models.EscalationTicket).filter(
            models.EscalationTicket.status == "open"
        ).order_by(models.EscalationTicket.created_at.desc()).all()
        return [_ticket_to_dict(t) for t in tickets]
    finally:
        db.close()


def get_all_tickets() -> list[dict]:
    """Get all tickets from database."""
    db = SessionLocal()
    try:
        tickets = db.query(models.EscalationTicket).order_by(
            models.EscalationTicket.created_at.desc()
        ).all()
        return [_ticket_to_dict(t) for t in tickets]
    finally:
        db.close()


def respond_to_ticket(ticket_id: str, response: str, expert_name: str = "RSK Expert") -> Optional[dict]:
    """RSK expert responds to a ticket. Persists to database."""
    db = SessionLocal()
    try:
        ticket = db.query(models.EscalationTicket).filter(
            models.EscalationTicket.ticket_id == ticket_id
        ).first()
        if not ticket:
            return None

        ticket.status = "resolved"
        ticket.response = response
        ticket.assigned_to = expert_name
        ticket.resolved_at = datetime.utcnow()
        db.commit()

        # Closed-Loop SMS Notification
        try:
            farm = db.query(models.Farm).filter(models.Farm.id == ticket.farm_id).first()
            if farm:
                user = db.query(models.User).filter(models.User.id == farm.user_id).first()
                if user and user.phone:
                    msg = f"AgriShield RSK Update: Expert {expert_name} reviewed your crop issue #{ticket_id}. Advice: {response}. Apply recommended treatment immediately."
                    print(f"[RSK Closed-Loop Push] Sending SMS to {user.phone}: {msg}")
                    send_sms(user.phone, msg)
        except Exception as e:
            print(f"[RSK SMS Error] Failed to send closed-loop SMS: {e}")

        return _ticket_to_dict(ticket)
    except Exception as e:
        print(f"Error responding to ticket: {e}")
        db.rollback()
        raise
    finally:
        db.close()
