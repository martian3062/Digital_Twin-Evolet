"""MedGenie AI Engine — FastAPI server for Digital Twin intelligence."""

import logging
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional
import uvicorn

from config import settings

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("medgenie-ai")

app = FastAPI(
    title="MedGenie AI Engine",
    description="Digital Twin AI Engine — GNN, Temporal Transformer, Causal Inference",
    version="0.1.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)


# === Request / Response models ===

class PredictionRequest(BaseModel):
    patient_id: str
    data: Optional[dict] = None


class RiskScoreRequest(BaseModel):
    patient_id: str


class SimulationRequest(BaseModel):
    patient_id: str
    scenario: dict


class HealthResponse(BaseModel):
    status: str
    version: str


# === Endpoints ===

@app.get("/", response_model=HealthResponse)
async def health():
    return {"status": "healthy", "version": "0.1.0"}


@app.post("/predict")
async def predict(request: PredictionRequest):
    """Run full neural prediction pipeline via Digital Twin orchestrator."""
    from models.digital_twin import DigitalTwin
    try:
        # Initialize or fetch twin (in real app, use a cache/store)
        twin = DigitalTwin(request.patient_id)
        
        # Use provided data or fall back to internal samples for demo
        vitals = request.data.get('vitals', []) if request.data else []
        
        # Update twin state with new data
        state = twin.update(vitals)
        
        return {
            'patient_id': request.patient_id,
            'predictions': state.get('predicted_events', []),
            'risk_scores': state.get('risk_scores', {}),
            'anomaly_index': state.get('anomaly_index', 0.0),
            'status': 'success',
            'model_version': 'v1.1.0-neural'
        }
    except Exception as e:
        logger.error(f"Prediction error: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/risk-score")
async def risk_score(request: RiskScoreRequest):
    """Calculate multi-dimensional risk scores using Digital Twin state."""
    from models.digital_twin import DigitalTwin
    try:
        twin = DigitalTwin(request.patient_id)
        # For risk-score only, we might just return the current cached state
        # but for this demo phase, we run a quick update check
        state = twin.get_state()
        
        return {
            'patient_id': request.patient_id,
            'risk_scores': state.get('risk_scores', {}),
            'status': 'success' if state.get('risk_scores') else 'initialized',
            'model_version': 'v1.1.0-neural'
        }
    except Exception as e:
        logger.error(f"Risk score error: {e}")
        raise HTTPException(status_code=500, detail=str(e))


from typing import Dict
from models.digital_twin import DigitalTwin

@app.post("/simulate")
async def simulate_scenario(request: SimulationRequest):
    """Run a 'What-If' clinical simulation for a patient."""
    try:
        twin = DigitalTwin(request.patient_id)
        # Ensure state is loaded
        await twin.load_state() 
        result = twin.simulate(request.scenario)
        return result
    except Exception as e:
        logger.error(f"Simulation error: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/scribe")
async def scribe(request: PredictionRequest):
    """Summarize a consultation transcript and generate AI clinical notes."""
    from pipelines.scribe import generate_clinical_summary
    try:
        # Transcript should be in request.data['transcript']
        transcript = request.data.get("transcript", "")
        result = generate_clinical_summary(transcript)
        return result
    except Exception as e:
        logger.error(f"Scribe error: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/voice-log")
async def voice_log(request: PredictionRequest):
    """Analyze real-time voice snippets for symptom tracking."""
    from pipelines.scribe import extract_voice_symptoms
    try:
        # Captured text should be in request.data['text']
        text = request.data.get("text", "")
        result = extract_voice_symptoms(text)
        return result
    except Exception as e:
        logger.error(f"Voice log error: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/model-info")
async def model_info():
    """Get information about loaded models."""
    return {
        "models": {
            "gnn": {"name": "HealthGNN", "version": "v0.1", "status": "skeleton"},
            "transformer": {"name": "TemporalHealthTransformer", "version": "v0.1", "status": "skeleton"},
            "causal": {"name": "CausalInferenceEngine", "version": "v0.1", "status": "skeleton"},
        },
        "knowledge_graph": {"nodes": 0, "edges": 0, "status": "initialized"},
    }


if __name__ == "__main__":
    uvicorn.run(
        "server:app",
        host="0.0.0.0",
        port=settings.PORT,
        reload=settings.DEBUG,
    )
