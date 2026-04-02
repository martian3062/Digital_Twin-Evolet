"""Temporal Transformer for health time-series prediction.

Uses HuggingFace-style architecture for:
- Multi-variate vital sign forecasting
- Temporal pattern recognition
- Auto-regressive prediction
"""

import math
import torch
import torch.nn as nn
import torch.nn.functional as F


class PositionalEncoding(nn.Module):
    """Sinusoidal positional encoding for temporal sequences."""

    def __init__(self, d_model, max_len=5000):
        super().__init__()
        pe = torch.zeros(max_len, d_model)
        position = torch.arange(0, max_len, dtype=torch.float).unsqueeze(1)
        div_term = torch.exp(torch.arange(0, d_model, 2).float() * (-math.log(10000.0) / d_model))
        pe[:, 0::2] = torch.sin(position * div_term)
        pe[:, 1::2] = torch.cos(position * div_term)
        pe = pe.unsqueeze(0)
        self.register_buffer('pe', pe)

    def forward(self, x):
        return x + self.pe[:, :x.size(1)]


class TemporalHealthTransformer(nn.Module):
    """
    Transformer for multi-variate health time-series forecasting.
    
    Architecture:
    - Input projection + positional encoding
    - 4-layer Transformer encoder
    - Prediction heads for each vital type
    """

    def __init__(
        self,
        input_dim=8,
        d_model=128,
        nhead=8,
        num_layers=4,
        dim_feedforward=256,
        dropout=0.1,
        num_vitals=6,
        forecast_horizon=12,
    ):
        super().__init__()
        self.d_model = d_model
        self.forecast_horizon = forecast_horizon

        # Input projection
        self.input_proj = nn.Linear(input_dim, d_model)
        self.pos_encoding = PositionalEncoding(d_model)

        # Transformer encoder
        encoder_layer = nn.TransformerEncoderLayer(
            d_model=d_model,
            nhead=nhead,
            dim_feedforward=dim_feedforward,
            dropout=dropout,
            batch_first=True,
        )
        self.transformer = nn.TransformerEncoder(encoder_layer, num_layers=num_layers)

        # Prediction heads
        self.vital_predictor = nn.Sequential(
            nn.Linear(d_model, dim_feedforward),
            nn.GELU(),
            nn.Dropout(dropout),
            nn.Linear(dim_feedforward, num_vitals * forecast_horizon),
        )

        # Anomaly head
        self.anomaly_head = nn.Sequential(
            nn.Linear(d_model, 64),
            nn.ReLU(),
            nn.Linear(64, 1),
            nn.Sigmoid(),
        )

        self.norm = nn.LayerNorm(d_model)

    def forward(self, x, mask=None):
        """
        Args:
            x: (batch, seq_len, input_dim) — time-series input
            mask: optional attention mask
        Returns:
            predictions: (batch, num_vitals * forecast_horizon)
            anomaly_scores: (batch, seq_len) — per-timestep anomaly probability
        """
        h = self.input_proj(x)
        h = self.pos_encoding(h)
        h = self.transformer(h, src_key_padding_mask=mask)
        h = self.norm(h)

        # Use last hidden state for prediction
        last_hidden = h[:, -1, :]
        predictions = self.vital_predictor(last_hidden)

        # Anomaly scores for each timestep
        anomaly_scores = self.anomaly_head(h).squeeze(-1)

        return predictions, anomaly_scores

    def predict_next(self, x, steps=12):
        """Auto-regressive prediction for future vitals."""
        self.eval()
        with torch.no_grad():
            predictions, anomaly_scores = self.forward(x)
            # Reshape to (batch, forecast_horizon, num_vitals)
            num_vitals = predictions.shape[-1] // self.forecast_horizon
            predictions = predictions.view(-1, self.forecast_horizon, num_vitals)
        return predictions, anomaly_scores


def create_temporal_features(vitals_list, window_size=96):
    """
    Convert vitals list to temporal feature tensor.
    
    Features per timestep:
    [value_normalized, metric_one_hot(6), hour_sin, hour_cos]
    """
    import numpy as np

    if not vitals_list:
        return torch.zeros(1, window_size, 8)

    # Pad or truncate to window_size
    if len(vitals_list) > window_size:
        vitals_list = vitals_list[-window_size:]

    features = []
    for vital in vitals_list:
        value = vital.get('value', 0) / 200.0
        hour = vital.get('hour', 12)
        hour_sin = math.sin(2 * math.pi * hour / 24)
        hour_cos = math.cos(2 * math.pi * hour / 24)

        metric_idx = {
            'heart_rate': 0, 'spo2': 1, 'bp_systolic': 2,
            'bp_diastolic': 3, 'body_temp': 4, 'steps': 5,
        }.get(vital.get('metric_type', ''), 0)

        one_hot = [0.0] * 6
        one_hot[metric_idx] = 1.0

        features.append([value] + one_hot[:5] + [hour_sin, hour_cos])

    # Pad if needed
    while len(features) < window_size:
        features.insert(0, [0.0] * 8)

    return torch.tensor([features], dtype=torch.float)
