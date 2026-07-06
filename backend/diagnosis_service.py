"""
Diagnosis Service — Plant disease classification
Uses mock classifier by default. Swap for PyTorch model when available.

Supported diseases (from PlantVillage dataset categories):
- Healthy
- Bacterial Blight
- Leaf Rust
- Powdery Mildew
- Anthracnose
- Brown Spot
- Late Blight
- Early Blight
- Mosaic Virus
- Leaf Curl
"""
import hashlib
import os
import uuid
from datetime import datetime
from typing import Optional

USE_MOCK_CLASSIFIER = os.getenv("USE_MOCK_CLASSIFIER", "true").lower() == "true"

LATEST_FARM_DIAGNOSIS: dict[int, dict] = {}


def get_latest_farm_severity(farm_id: int) -> str:
    """Return latest recorded disease severity for a farm."""
    return LATEST_FARM_DIAGNOSIS.get(farm_id, {}).get("severity", "none")

DISEASE_CATEGORIES = [
    {"name": "Healthy", "severity": "none", "treatment": "No treatment needed. Crop is healthy."},
    {"name": "Bacterial Blight", "severity": "high", "treatment": "Apply copper-based bactericides. Remove infected plants. Improve field drainage."},
    {"name": "Leaf Rust", "severity": "medium", "treatment": "Apply fungicide (propiconazole/tebuconazole). Remove infected leaves. Ensure proper spacing."},
    {"name": "Powdery Mildew", "severity": "medium", "treatment": "Apply sulfur-based fungicide. Improve air circulation. Avoid overhead irrigation."},
    {"name": "Anthracnose", "severity": "high", "treatment": "Apply mancozeb/carbendazim. Remove infected plant debris. Practice crop rotation."},
    {"name": "Brown Spot", "severity": "medium", "treatment": "Apply tricyclazole fungicide. Ensure balanced fertilization. Drain stagnant water."},
    {"name": "Late Blight", "severity": "high", "treatment": "Apply metalaxyl/mancozeb immediately. Destroy infected plants. Avoid excessive irrigation."},
    {"name": "Early Blight", "severity": "medium", "treatment": "Apply chlorothalonil fungicide. Mulch around plants. Practice crop rotation."},
    {"name": "Mosaic Virus", "severity": "high", "treatment": "No chemical cure. Remove infected plants. Control aphid vectors. Use resistant varieties."},
    {"name": "Leaf Curl", "severity": "medium", "treatment": "Control whitefly vectors. Apply neem oil spray. Remove severely affected plants."},
]


def classify_image(image_path: str, farm_id: Optional[int] = None) -> dict:
    """
    Classify a crop image for disease detection.
    Returns predicted disease, confidence, severity, and treatment.
    """
    if USE_MOCK_CLASSIFIER:
        return _mock_classify(image_path, farm_id)

    # Real PyTorch model inference
    try:
        import torch
        import torchvision.transforms as transforms
        from torchvision import models
        from PIL import Image

        # Load model (cached)
        model_path = os.path.join(os.path.dirname(os.path.abspath(__file__)), "models_ml", "plant_disease_model.pth")
        if not os.path.exists(model_path):
            print(f"Model not found at {model_path}, using mock")
            return _mock_classify(image_path, farm_id)

        model = models.resnet18(pretrained=False)
        model.fc = torch.nn.Linear(model.fc.in_features, len(DISEASE_CATEGORIES))
        model.load_state_dict(torch.load(model_path, map_location="cpu"))
        model.eval()

        transform = transforms.Compose([
            transforms.Resize((224, 224)),
            transforms.ToTensor(),
            transforms.Normalize(mean=[0.485, 0.456, 0.406], std=[0.229, 0.224, 0.225]),
        ])

        img = Image.open(image_path).convert("RGB")
        tensor = transform(img).unsqueeze(0)

        with torch.no_grad():
            outputs = model(tensor)
            probabilities = torch.nn.functional.softmax(outputs, dim=1)
            confidence, predicted = torch.max(probabilities, 1)

        idx = predicted.item()
        disease = DISEASE_CATEGORIES[idx]
        res = {
            "disease_name": disease["name"],
            "confidence": round(confidence.item(), 3),
            "severity": disease["severity"],
            "treatment": disease["treatment"],
            "needs_escalation": confidence.item() < 0.7,
            "model_used": "resnet18",
            "classified_at": datetime.utcnow().isoformat(),
        }
        if farm_id is not None:
            LATEST_FARM_DIAGNOSIS[farm_id] = res
        return res
    except ImportError:
        print("PyTorch not installed, using mock classifier")
        return _mock_classify(image_path, farm_id)
    except Exception as e:
        print(f"Classification error: {e}")
        return _mock_classify(image_path, farm_id)


def _mock_classify(image_path: str, farm_id: Optional[int] = None) -> dict:
    """Deterministic mock classifier based on filename hash."""
    seed = int(hashlib.sha256(image_path.encode()).hexdigest(), 16)
    idx = seed % len(DISEASE_CATEGORIES)
    # Generate realistic confidence
    confidence = 0.5 + (seed % 50) / 100.0  # 0.50 - 0.99

    disease = DISEASE_CATEGORIES[idx]
    res = {
        "disease_name": disease["name"],
        "confidence": round(confidence, 3),
        "severity": disease["severity"],
        "treatment": disease["treatment"],
        "needs_escalation": confidence < 0.7,
        "model_used": "mock",
        "classified_at": datetime.utcnow().isoformat(),
    }
    if farm_id is not None:
        LATEST_FARM_DIAGNOSIS[farm_id] = res
    return res


def extract_symptoms_from_text(text: str) -> list[str]:
    """
    Extract symptom keywords from voice/text description.
    Simple keyword matching — swap for NLP model later.
    """
    symptom_keywords = {
        "yellowing": "Leaf Yellowing",
        "yellow": "Leaf Yellowing",
        "peela": "Leaf Yellowing",
        "wilting": "Plant Wilting",
        "murjhana": "Plant Wilting",
        "spots": "Leaf Spots",
        "daag": "Leaf Spots",
        "dhabbe": "Leaf Spots",
        "rot": "Root/Stem Rot",
        "sadna": "Root/Stem Rot",
        "mold": "Fungal Growth",
        "phool": "Abnormal Growth",
        "insects": "Pest Infestation",
        "keede": "Pest Infestation",
        "kida": "Pest Infestation",
        "dry": "Drying/Dehydration",
        "sukha": "Drying/Dehydration",
        "curl": "Leaf Curling",
        "brown": "Browning",
        "bhura": "Browning",
        "black": "Blackening",
        "kala": "Blackening",
        "holes": "Pest Damage",
        "chhed": "Pest Damage",
    }

    text_lower = text.lower()
    found = []
    for keyword, symptom in symptom_keywords.items():
        if keyword in text_lower and symptom not in found:
            found.append(symptom)

    return found if found else ["General Concern"]
