import torch
import torch.nn.functional as F
import os
import json
from models.dkt_plus import DKTPlus

#  === Resolve Paths ===
ROOT_DIR = os.path.dirname(__file__)
ckpt_dir = os.path.join(ROOT_DIR, "ckpts", "dkt+", "SkillBuilder")
checkpoint_path = os.path.join(ckpt_dir, "model.ckpt")
model_config_path = os.path.join(ckpt_dir, "model_config.json")

# Load model config
with open(model_config_path, "r") as f:
    config = json.load(f)

state_dict = torch.load(checkpoint_path, map_location="cpu")
num_q = state_dict["out_layer.weight"].shape[0]

num_q = config.get("num_q", num_q)  # Fallback to default if not in config
# num_q = config["num_q"]
emb_size = config["emb_size"]
hidden_size = config["hidden_size"]
lambda_r = config["lambda_r"]
lambda_w1 = config["lambda_w1"]
lambda_w2 = config["lambda_w2"]

model = DKTPlus(num_q, emb_size, hidden_size, lambda_r, lambda_w1, lambda_w2)
model.load_state_dict(torch.load(checkpoint_path))
model.eval()
 
# # Example prediction
# with torch.no_grad():
#     q_seq = torch.tensor([[12, 45, 32, 21, 7]])      # question IDs
#     r_seq = torch.tensor([[1, 0, 1, 1, 0]])          # correctness
#     c_seq = torch.tensor([[0.8, 0.5, 0.7, 0.6, 0.4]])  # confidence
#     d_seq = torch.tensor([[0.3, 0.2, 0.5, 0.7, 0.6]])  # difficulty

#     y_pred = model(q_seq, r_seq, c_seq, d_seq)   # [B, T, num_q]
#     next_pred = y_pred[:, -1]                   # [B, num_q]
#     top_k = torch.topk(next_pred[0], 5)
#     print("Top-5 questions with highest predicted probability of being correct next:")
#     for score, idx in zip(top_k.values, top_k.indices):
#         print(f"Q{idx.item()}: {score.item():.4f}")

# Example prediction 2
q_seqs = [
    [1, 5, 3, 10],   # Student A
    [2, 8, 7, 4],    # Student B
    [0, 3, 6, 11]    # Student C
]

r_seqs = [
    [1, 0, 1, 1],
    [0, 1, 1, 0],
    [1, 1, 0, 0]
]

c_seqs = [
    [0.7, 0.3, 0.5, 0.8],
    [0.6, 0.9, 0.7, 0.4],
    [0.5, 0.6, 0.4, 0.3]
]

d_seqs = [
    [0.2, 0.6, 0.4, 0.1],
    [0.3, 0.2, 0.5, 0.6],
    [0.7, 0.5, 0.4, 0.3]
]


q_tensor = torch.tensor(q_seqs)  # [3, 4]
r_tensor = torch.tensor(r_seqs)  # [3, 4]
c_tensor = torch.tensor(c_seqs)  # [3, 4]
d_tensor = torch.tensor(d_seqs)  # [3, 4]

with torch.no_grad():
    y_pred = model(q_tensor, r_tensor, c_tensor, d_tensor)  # [3, 4, num_q]
    last_preds = y_pred[:, -1]  # [3, num_q]

num_students = last_preds.size(0)

for i in range(num_students):
    print(f"\n🧑‍🎓 Student {i+1} - Predicted Probabilities for Questions 0–9:")
    for q_next in range(10):
        prob = last_preds[i, q_next].item()
        print(f"  Q{q_next}: {prob:.4f}")
