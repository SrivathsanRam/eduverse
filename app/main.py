from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from typing import List
import torch
import torch.nn.functional as F
import os
import json

from models.dkt import DKT  # assumes `models` is in the same folder or symlinked

# ==== FastAPI app ====
app = FastAPI()

# ==== Pydantic request model ====
class PredictionRequest(BaseModel):
    q_ids: List[int]
    correctness: List[int]
    confidence: List[int]
    difficulty: List[int]  # not yet used in model

# ==== Load Model ====
ckpt_path = os.path.join(os.path.dirname(__file__), "..", "ckpts", "dkt", "ASSIST2009")
with open(os.path.join(ckpt_path, "model_config.json")) as f:
    config = json.load(f)

state_dict = torch.load(os.path.join(ckpt_path, "model.ckpt"), map_location="cpu")
num_q = state_dict["out_layer.weight"].shape[0]

model = DKT(num_q=num_q, emb_size=config["emb_size"], hidden_size=config["hidden_size"])
model.load_state_dict(state_dict)
model.eval()

# ==== Inference Function ====
def run_dkt_model(q_ids, correctness):
    q_tensor = torch.tensor(q_ids).unsqueeze(0)
    r_tensor = torch.tensor(correctness).unsqueeze(0)
    
    with torch.no_grad():
        output = model(q_tensor, r_tensor)
        probs = torch.sigmoid(output)[0, -1].tolist()
    return probs

# ==== POST Endpoint ====
@app.post("/predict")
async def predict(input: PredictionRequest):
    try:
        probs = run_dkt_model(input.q_ids, input.correctness)
        return {
            "question_ids": list(range(len(probs))),
            "predicted_probabilities": probs
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
