import pandas as pd
import torch
from torch.utils.data import Dataset
import os

class SkillBuilder(Dataset):
    def __init__(self, csv_path, seq_len=100):
        self.dataset_dir = os.path.dirname(csv_path)  
        self.df = pd.read_csv(csv_path, encoding="latin1")
        self.seq_len = seq_len

        # Group by user_id if available, else create dummy groups
        self.users = self.df['user_id'].unique() if 'user_id' in self.df.columns else [0]
        self.user_groups = self.df.groupby('user_id') if 'user_id' in self.df.columns else {'0': self.df}

        self.num_q = self.df['skill_id'].nunique()
    def __len__(self):
        return len(self.users)

    def __getitem__(self, idx):
        user = self.users[idx]
        user_data = self.user_groups.get_group(user)

        # Truncate or pad to seq_len
        q_ids = torch.tensor(user_data['skill_id'].values[:self.seq_len], dtype=torch.long)
        q_ids = torch.clamp(q_ids, min=0, max=self.num_q - 1)
        if (q_ids >= self.num_q).any():
            print(f"⚠️ Detected out-of-range q_ids: {q_ids[q_ids >= self.num_q]}")
        r = torch.tensor(user_data['correct'].values[:self.seq_len], dtype=torch.long)
        conf = torch.tensor(user_data['confidence'].values[:self.seq_len], dtype=torch.float32)
        diff = torch.tensor(user_data['difficulty_combined'].values[:self.seq_len], dtype=torch.float32)

        # Padding if shorter
        pad_len = self.seq_len - len(q_ids)
        if pad_len > 0:
            q_ids = torch.cat([q_ids, torch.full((pad_len,), -1, dtype=torch.long)])
            r = torch.cat([r, torch.zeros(pad_len, dtype=torch.long)])
            conf = torch.cat([conf, torch.zeros(pad_len, dtype=torch.float32)])
            diff = torch.cat([diff, torch.zeros(pad_len, dtype=torch.float32)])

        return q_ids, r, conf, diff
