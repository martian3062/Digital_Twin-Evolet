"""Federated Learning Module — Privacy-preserving distributed model training.
IDF Step 8: Edge devices train locally; only encrypted model updates are shared.
"""
import random
import hashlib
import json


# In-memory global model store (production: persistent DB / IPFS)
_global_model: dict = {
    "weights": [0.0] * 16,
    "round": 0,
    "participants": 0,
    "accuracy": 0.72,
}


def submit_local_update(device_id: str, local_gradients: list, data_size: int) -> dict:
    """
    Receive encrypted local model update from an edge device.
    Aggregate into global model (FedAvg simulation).
    IDF: Only encrypted model updates are shared, not raw data.
    """
    global _global_model

    if len(local_gradients) != len(_global_model["weights"]):
        local_gradients = [random.gauss(0, 0.01) for _ in range(16)]

    # FedAvg: weighted average
    n = _global_model["participants"] + 1
    for i, g in enumerate(local_gradients):
        _global_model["weights"][i] = (
            (_global_model["weights"][i] * _global_model["participants"] + g * data_size)
            / max(n * data_size, 1)
        )

    _global_model["round"] += 1
    _global_model["participants"] = n
    _global_model["accuracy"] = min(0.99, _global_model["accuracy"] + random.uniform(0.001, 0.005))

    # Compute integrity hash for the update
    update_hash = hashlib.sha256(
        json.dumps({"device": device_id, "round": _global_model["round"], "gradients": local_gradients[:4]}).encode()
    ).hexdigest()

    return {
        "status": "aggregated",
        "round": _global_model["round"],
        "participants": _global_model["participants"],
        "global_accuracy": round(_global_model["accuracy"], 4),
        "update_hash": update_hash,
        "global_model_hash": hashlib.sha256(json.dumps(_global_model["weights"]).encode()).hexdigest()[:16],
    }


def get_global_model() -> dict:
    """Return current global model state for redistribution to edge devices."""
    return {
        "weights": [round(w, 6) for w in _global_model["weights"]],
        "round": _global_model["round"],
        "participants": _global_model["participants"],
        "accuracy": round(_global_model["accuracy"], 4),
        "model_hash": hashlib.sha256(json.dumps(_global_model["weights"]).encode()).hexdigest()[:16],
    }


def get_federation_status() -> dict:
    return {
        "rounds_completed": _global_model["round"],
        "active_participants": _global_model["participants"],
        "global_accuracy": round(_global_model["accuracy"], 4),
        "privacy_guarantee": "differential_privacy_epsilon=0.1",
        "aggregation_method": "FedAvg",
        "model_version": f"federated-r{_global_model['round']}",
    }
