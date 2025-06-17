from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from typing import List
import torch
import json

import sys
import os

# Debug: Print current working directory and sys.path
# print("🛠 Current file:", __file__)
# print("🛠 Current working directory:", os.getcwd())

kt_models_path = os.path.join(os.path.dirname(__file__), "..", "kt_models")
# print("🛠 Adding to sys.path:", kt_models_path)

sys.path.append(kt_models_path)

# Debug: Show sys.path entries
print("🛠 Final sys.path:", sys.path)


from models.dkt import DKT
from models.dkt_plus import DKTPlus

app = FastAPI()

# ==== Pydantic request model ====
class PredictionRequest(BaseModel):
    q_ids: List[int]
    correctness: List[int]
    confidence: List[float]
    difficulty: List[float]

# ==== Load DKT+ Model ====
dktplus_ckpt = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "kt_models", "ckpts", "dkt+", "SkillBuilder"))
with open(os.path.join(dktplus_ckpt, "model_config.json")) as f:
    config = json.load(f)

dktplus_state = torch.load(os.path.join(dktplus_ckpt, "model.ckpt"), map_location="cpu")
num_q = dktplus_state["out_layer.weight"].shape[0]

dktplus_model = DKTPlus(
    num_q=num_q,
    emb_size=config["emb_size"],
    hidden_size=config["hidden_size"],
    lambda_r=config["lambda_r"],
    lambda_w1=config["lambda_w1"],
    lambda_w2=config["lambda_w2"]
)
dktplus_model.load_state_dict(dktplus_state)
dktplus_model.eval()

# ==== Load Lightweight DKT as backup ====
dkt_ckpt = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "kt_models", "ckpts", "dkt", "ASSIST2009"))
with open(os.path.join(dkt_ckpt, "model_config.json")) as f:
    dkt_config = json.load(f)

dkt_state = torch.load(os.path.join(dkt_ckpt, "model.ckpt"), map_location="cpu")
dkt_num_q = dkt_state["out_layer.weight"].shape[0]

dkt_model = DKT(
    num_q=dkt_num_q,
    emb_size=dkt_config["emb_size"],
    hidden_size=dkt_config["hidden_size"]
)
dkt_model.load_state_dict(dkt_state)
dkt_model.eval()

# ==== Inference ====
def run_dktplus_model(q_ids, correctness, confidence, difficulty):
    q = torch.tensor([q_ids])
    r = torch.tensor([correctness])
    c = torch.tensor([confidence])
    d = torch.tensor([difficulty])

    with torch.no_grad():
        y_pred = dktplus_model(q, r, c, d)
        last_probs = y_pred[:, -1].squeeze(0).tolist()
    return last_probs

# ==== POST Endpoint ====
@app.post("/predict")
async def predict(input: PredictionRequest):
    try:
        seq_len = len(input.q_ids)

        # === Check array lengths ===
        if not all(len(arr) == seq_len for arr in [input.correctness, input.confidence, input.difficulty]):
            raise HTTPException(status_code=400, detail="All input arrays must be of the same length.")

        # === Convert to tensors ===
        q = torch.tensor([input.q_ids])
        r = torch.tensor([input.correctness])
        c = torch.tensor([input.confidence])
        d = torch.tensor([input.difficulty])

        # === Check if DKT+ is valid ===
        use_dkt_plus = (
            c is not None and d is not None and
            c.numel() > 0 and d.numel() > 0 and
            torch.any(c != 0) and torch.any(d != 0)
        )

        if use_dkt_plus:
            try:
                with torch.no_grad():
                    y_pred = dktplus_model(q, r, c, d)
                    probs = y_pred[:, -1].squeeze(0).tolist()
                return {
                    "model_used": "DKT+",
                    "question_ids": list(range(len(probs))),
                    "predicted_probabilities": probs
                }
            except Exception as e:
                # fallback in case DKT+ errors at runtime
                print("⚠️ DKT+ failed, falling back to DKT:", e)

        # === Fallback to DKT ===
        with torch.no_grad():
            y_pred = dkt_model(q, r)
            probs = torch.sigmoid(y_pred[:, -1]).squeeze(0).tolist()

        return {
            "model_used": "DKT (fallback)",
            "question_ids": list(range(len(probs))),
            "predicted_probabilities": probs
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

