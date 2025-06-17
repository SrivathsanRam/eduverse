import torch
import torch.nn.functional as F
import os
import json
from models.dkt import DKT

# === Resolve Paths ===
ROOT_DIR = os.path.dirname(_file_)
ckpt_dir = os.path.join(ROOT_DIR, "ckpts", "dkt", "ASSIST2009")
checkpoint_path = os.path.join(ckpt_dir, "model.ckpt")
model_config_path = os.path.join(ckpt_dir, "model_config.json")

# === Load Model Config ===
with open(model_config_path, "r") as f:
    config = json.load(f)

# === Detect num_q from checkpoint ===
state_dict = torch.load(checkpoint_path, map_location="cpu")
num_q = state_dict["out_layer.weight"].shape[0]
print("Detected num_q from checkpoint:", num_q)

# === Build Model and Load Weights ===
model = DKT(num_q=num_q, emb_size=config["emb_size"], hidden_size=config["hidden_size"])
model.load_state_dict(state_dict)
model.eval()

# === Encode Sample Interaction ===
def encode_input(q_ids, correctness, total_questions):
    input_dim = total_questions * 2
    inputs = []
    for q_id, correct in zip(q_ids, correctness):
        idx = q_id * 2 + correct
        one_hot = F.one_hot(torch.tensor(idx), num_classes=input_dim).float()
        inputs.append(one_hot)
    return torch.stack(inputs).unsqueeze(0)

# === Predict Next Question Performance ===
q_ids = [0, 1, 5]
correctness = [0, 1, 0]

q_tensor = torch.tensor(q_ids).unsqueeze(0)         # [1, 3]
r_tensor = torch.tensor(correctness).unsqueeze(0)   # [1, 3]

with torch.no_grad():
    output = model(q_tensor, r_tensor)
    probs = torch.sigmoid(output)

next_question_id = 6
predicted_prob = probs[0, -1, next_question_id].item()
print(f"Predicted probability of getting question {next_question_id} correct: {predicted_prob:.4f}")