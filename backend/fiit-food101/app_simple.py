import io, os
from fastapi import FastAPI, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from PIL import Image
import requests
import csv

TOPK = int(os.getenv("TOPK", "3"))
T_HIGH = float(os.getenv("T_HIGH", "0.70"))
T_MID = float(os.getenv("T_MID", "0.50"))
T_LOW = float(os.getenv("T_LOW", "0.35"))
FDC_API_KEY = os.getenv("FDC_API_KEY", "")

MAP_PATH = os.getenv("FDC_MAP_PATH", "food101_to_fdc_ids.csv")
LABEL_TO_FDC = {}

app = FastAPI(title="fiit-food101")
app.add_middleware(CORSMiddleware, allow_origins=["*"], allow_methods=["*"], allow_headers=["*"])

def load_map():
    global LABEL_TO_FDC
    LABEL_TO_FDC = {}
    try:
        with open(MAP_PATH, newline="", encoding="utf-8") as f:
            for row in csv.DictReader(f):
                label = (row.get("label") or "").strip().lower()
                fdcId = row.get("fdcId") or ""
                if label and fdcId:
                    LABEL_TO_FDC[label] = {
                        "fdcId": int(fdcId),
                        "description": row.get("fdcDescription") or row.get("fdcQuery") or "",
                    }
        print(f"Loaded {len(LABEL_TO_FDC)} label→FDC entries from {MAP_PATH}")
    except FileNotFoundError:
        print(f"No FDC map found at {MAP_PATH}; will use live lookup.")
    except Exception as e:
        print("Failed to load FDC map:", e)

load_map()

@app.get("/health")
async def health():
    return {"status": "healthy", "model_loaded": True}

def fdc_lookup(name: str):
    if not FDC_API_KEY:
        return None
    try:
        r = requests.get(
            "https://api.nal.usda.gov/fdc/v1/foods/search",
            params={"api_key": FDC_API_KEY, "query": name, "pageSize": 1},
            timeout=3
        )
        r.raise_for_status()
        js = r.json()
        if js.get("foods"):
            f = js["foods"][0]
            nutrients = {n.get("nutrientName","").lower(): n.get("value") for n in f.get("foodNutrients", [])}
            kcal = nutrients.get("energy") or nutrients.get("energy, kcal")
            protein = nutrients.get("protein")
            carbs = nutrients.get("carbohydrate, by difference")
            fat = nutrients.get("total lipid (fat)")
            return {
                "fdcId": f.get("fdcId"),
                "description": f.get("description"),
                "kcal": kcal, "protein": protein, "carbs": carbs, "fat": fat
            }
    except Exception:
        return None

def nutrition_for_label(label: str):
    key = label.strip().lower()
    if key in LABEL_TO_FDC:
        entry = LABEL_TO_FDC[key]
        return {"fdcId": entry["fdcId"], "description": entry["description"]}
    return fdc_lookup(label)

# Mock food recognition for testing
def mock_classify(image_bytes):
    """Mock food recognition that returns some common foods"""
    # This is just for testing - in production you'd use a real model
    mock_foods = [
        {"label": "pizza", "prob": 0.85},
        {"label": "hamburger", "prob": 0.75},
        {"label": "salad", "prob": 0.65},
        {"label": "sandwich", "prob": 0.55},
        {"label": "pasta", "prob": 0.45}
    ]
    
    # Return top 3 with some randomization based on image size
    import hashlib
    image_hash = hashlib.md5(image_bytes).hexdigest()
    seed = int(image_hash[:8], 16)
    
    # Shuffle based on hash
    import random
    random.seed(seed)
    shuffled = mock_foods.copy()
    random.shuffle(shuffled)
    
    return shuffled[:TOPK]

@app.post("/classify")
async def classify(file: UploadFile = File(...)):
    try:
        # Read image
        image_bytes = await file.read()
        img = Image.open(io.BytesIO(image_bytes)).convert("RGB")
        
        # Mock classification
        topk = mock_classify(image_bytes)
        
        # Determine decision
        top1 = topk[0]["prob"]
        if top1 >= T_HIGH:
            decision = "auto_accept"
        elif top1 >= T_MID:
            decision = "confirm"
        else:
            decision = "fallback"
        
        # Get nutrition for top prediction
        nutrition = nutrition_for_label(topk[0]["label"]) if decision != "fallback" else None
        
        return {"topk": topk, "decision": decision, "nutrition": nutrition}
        
    except Exception as e:
        return {
            "topk": [],
            "decision": "fallback",
            "nutrition": None,
            "error": str(e)
        }
