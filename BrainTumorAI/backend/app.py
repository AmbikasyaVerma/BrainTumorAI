from fastapi import FastAPI, File, UploadFile, HTTPException
from fastapi.middleware.cors import CORSMiddleware
import uvicorn
import numpy as np
import tensorflow as tf
from PIL import Image
import io
import os
import json
from tensorflow.keras.applications.vgg16 import preprocess_input


# =============================
# App Setup
# =============================

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://127.0.0.1:3000",
    ],
    allow_methods=["*"],
    allow_headers=["*"],
    allow_credentials=True
)


# =============================
# Load Model
# =============================

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
MODEL_PATH = os.path.join(BASE_DIR, "model", "brain_tumor_model.h5")
CLASS_NAMES_PATH = os.path.join(BASE_DIR, "model", "class_names.json")
CONFUSION_MATRIX_PATH = os.path.join(BASE_DIR, "model", "confusion_matrix.json")
METRICS_PATH = os.path.join(BASE_DIR, "model", "metrics.json")

model = None
model_load_error = None
IMG_SIZE = 128

try:
    model = tf.keras.models.load_model(MODEL_PATH, compile=False)
    # Use model input size so inference always matches the trained model.
    IMG_SIZE = int(model.input_shape[1])
except Exception as e:
    model_load_error = str(e)
    print("MODEL LOAD ERROR:", model_load_error)

def to_display_name(name):
    mapping = {
        "glioma": "Glioma Tumor",
        "meningioma": "Meningioma Tumor",
        "notumor": "No Tumor",
        "pituitary": "Pituitary Tumor",
    }
    return mapping.get(str(name).lower(), str(name))


if os.path.exists(CLASS_NAMES_PATH):
    with open(CLASS_NAMES_PATH, "r", encoding="utf-8") as f:
        class_names = [to_display_name(x) for x in json.load(f)]
else:
    class_names = [
        "Glioma Tumor",
        "Meningioma Tumor",
        "No Tumor",
        "Pituitary Tumor"
    ]


# =============================
# Preprocess
# =============================

def preprocess(img_bytes):

    img = Image.open(io.BytesIO(img_bytes)).convert("RGB")

    img = img.resize((IMG_SIZE, IMG_SIZE))

    arr = np.array(img).astype("float32")
    arr = preprocess_input(arr)

    arr = np.expand_dims(arr, axis=0)

    return arr


def load_json(path):
    if not os.path.exists(path):
        return None
    with open(path, "r", encoding="utf-8") as f:
        return json.load(f)


@app.get("/health")
async def health():
    return {
        "status": "ok" if model is not None else "degraded",
        "model_loaded": model is not None,
        "model_path": MODEL_PATH,
        "model_load_error": model_load_error,
    }


# =============================
# Analyze API
# =============================

@app.post("/analyze")
async def analyze(file: UploadFile = File(...)):

    if model is None:
        raise HTTPException(
            status_code=503,
            detail="Model is not loaded. Run training first, then restart backend."
        )

    if not file.content_type or not file.content_type.startswith("image/"):
        raise HTTPException(status_code=400, detail="Please upload a valid image file.")

    try:

        data = await file.read()

        image = preprocess(data)

        preds = model.predict(image, verbose=0)[0]
        usable_preds = preds[:len(class_names)] if len(preds) > len(class_names) else preds

        index = int(np.argmax(usable_preds))

        confidence = float(np.max(usable_preds) * 100)

        label = class_names[index] if index < len(class_names) else f"Class {index}"

        result = {
            "prediction": label,
            "confidence": round(confidence, 2)
        }

        # DEBUG (important)
        print("===================================")
        print("RESULT:", result)
        print("===================================")

        return result


    except Exception as e:
        print("ANALYZE ERROR:", e)
        raise HTTPException(status_code=500, detail=f"Analyze failed: {e}")


@app.get("/model/evaluation")
async def model_evaluation():

    confusion_payload = load_json(CONFUSION_MATRIX_PATH)
    metrics_payload = load_json(METRICS_PATH)

    if confusion_payload is None or metrics_payload is None:
        raise HTTPException(
            status_code=404,
            detail="Evaluation files not found. Run training first to generate confusion_matrix.json and metrics.json."
        )

    return {
        "confusion_matrix": confusion_payload,
        "metrics": metrics_payload
    }


# =============================
# Run
# =============================

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)
