"""Graph Neural Network for patient health relationship modeling.

Uses PyTorch Geometric to model:
- Vitals as node features
- Temporal/causal edges between health events
- Multi-relational graph structure
"""

import torch
import torch.nn as nn
import torch.nn.functional as F

try:
    from torch_geometric.nn import GCNConv, GATConv, global_mean_pool
    from torch_geometric.data import Data
    HAS_GEOMETRIC = True
except ImportError:
    HAS_GEOMETRIC = False


class HealthGNN(nn.Module):
    """
    Graph Neural Network for modeling patient health relationships.
    
    Architecture:
    - 3-layer GAT (Graph Attention Network)
    - Residual connections
    - Multi-head attention for different relationship types
    """

    def __init__(self, input_dim=16, hidden_dim=64, output_dim=32, num_heads=4, dropout=0.3):
        super().__init__()
        self.input_dim = input_dim
        self.hidden_dim = hidden_dim

        if HAS_GEOMETRIC:
            self.conv1 = GATConv(input_dim, hidden_dim, heads=num_heads, dropout=dropout)
            self.conv2 = GATConv(hidden_dim * num_heads, hidden_dim, heads=num_heads, dropout=dropout)
            self.conv3 = GATConv(hidden_dim * num_heads, output_dim, heads=1, concat=False, dropout=dropout)
        else:
            # Fallback: simple MLP when PyG is not available
            self.fc1 = nn.Linear(input_dim, hidden_dim)
            self.fc2 = nn.Linear(hidden_dim, hidden_dim)
            self.fc3 = nn.Linear(hidden_dim, output_dim)

        self.dropout = nn.Dropout(dropout)
        self.norm1 = nn.LayerNorm(hidden_dim * num_heads if HAS_GEOMETRIC else hidden_dim)
        self.norm2 = nn.LayerNorm(hidden_dim * num_heads if HAS_GEOMETRIC else hidden_dim)

        # Risk prediction head
        self.risk_head = nn.Sequential(
            nn.Linear(output_dim, 32),
            nn.ReLU(),
            nn.Dropout(dropout),
            nn.Linear(32, 6),  # 6 risk categories
            nn.Sigmoid(),
        )

    def forward(self, x, edge_index=None, batch=None):
        if HAS_GEOMETRIC and edge_index is not None:
            h = self.conv1(x, edge_index)
            h = F.elu(self.norm1(h))
            h = self.dropout(h)

            h = self.conv2(h, edge_index)
            h = F.elu(self.norm2(h))
            h = self.dropout(h)

            h = self.conv3(h, edge_index)

            if batch is not None:
                h = global_mean_pool(h, batch)
        else:
            h = F.relu(self.fc1(x))
            h = self.dropout(h)
            h = F.relu(self.fc2(h))
            h = self.dropout(h)
            h = self.fc3(h)

        risk_scores = self.risk_head(h)
        return h, risk_scores


def create_patient_graph(vitals_data, conditions=None):
    """
    Convert patient vitals into a graph structure.
    
    Nodes: Individual vital readings, symptoms, conditions
    Edges: Temporal proximity, causal relationships
    """
    if not HAS_GEOMETRIC:
        # Return tensor-based representation
        import numpy as np
        features = []
        for vital in vitals_data:
            features.append([
                vital.get('value', 0),
                vital.get('hour', 0) / 24.0,
                1.0 if vital.get('is_anomaly', False) else 0.0,
            ])
        if not features:
            features = [[0.0] * 3]
        return torch.tensor(features, dtype=torch.float)

    # Build PyG graph
    node_features = []
    edge_sources = []
    edge_targets = []

    for i, vital in enumerate(vitals_data):
        node_features.append(_vital_to_features(vital))

        # Temporal edges: connect consecutive readings
        if i > 0:
            edge_sources.extend([i - 1, i])
            edge_targets.extend([i, i - 1])

        # Connect readings within 1-hour window
        for j in range(max(0, i - 4), i):
            edge_sources.extend([j, i])
            edge_targets.extend([i, j])

    if not node_features:
        node_features = [torch.zeros(16)]

    x = torch.stack(node_features) if isinstance(node_features[0], torch.Tensor) else torch.tensor(node_features, dtype=torch.float)

    if edge_sources:
        edge_index = torch.tensor([edge_sources, edge_targets], dtype=torch.long)
    else:
        edge_index = torch.zeros((2, 0), dtype=torch.long)

    return Data(x=x, edge_index=edge_index)


def _vital_to_features(vital):
    """Convert a vital reading to a feature vector."""
    metric_encoding = {
        'heart_rate': [1, 0, 0, 0, 0, 0],
        'spo2': [0, 1, 0, 0, 0, 0],
        'bp_systolic': [0, 0, 1, 0, 0, 0],
        'bp_diastolic': [0, 0, 0, 1, 0, 0],
        'body_temp': [0, 0, 0, 0, 1, 0],
        'steps': [0, 0, 0, 0, 0, 1],
    }

    metric = vital.get('metric_type', 'heart_rate')
    encoding = metric_encoding.get(metric, [0] * 6)

    features = encoding + [
        vital.get('value', 0) / 200.0,  # Normalize
        vital.get('hour', 12) / 24.0,
        vital.get('day_of_week', 0) / 7.0,
        1.0 if vital.get('is_anomaly', False) else 0.0,
    ] + [0.0] * 6  # Padding to 16 dims

    return torch.tensor(features[:16], dtype=torch.float)
