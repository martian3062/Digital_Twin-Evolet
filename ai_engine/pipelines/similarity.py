"""Patient Similarity Engine — anonymized embedding comparison for clinical insights."""
import math
import random


def compute_patient_similarity(patient_id: str, vitals_data: list = None, top_k: int = 3) -> dict:
    """
    Compute anonymized patient similarity using embedding distance.
    IDF Step 16: Patient Similarity and Analytics Engine.
    """
    # Feature extraction from vitals
    features = _extract_features(vitals_data or [])

    # Simulated cohort embeddings (in production: retrieved from vector DB / Pinecone)
    cohort = _get_cohort_embeddings()

    similarities = []
    for idx, cohort_patient in enumerate(cohort):
        dist = _cosine_distance(features, cohort_patient["embedding"])
        similarity = round(1.0 - dist, 3)
        similarities.append({
            "cohort_id": f"anon-{idx+1:04d}",
            "similarity_score": similarity,
            "shared_conditions": cohort_patient["conditions"],
            "treatment_outcomes": cohort_patient["outcomes"],
        })

    similarities.sort(key=lambda x: x["similarity_score"], reverse=True)
    top_matches = similarities[:top_k]

    # Aggregate recommendations from similar patients
    recommendations = []
    for m in top_matches:
        recommendations.extend(m["treatment_outcomes"])
    recommendations = list(set(recommendations))[:5]

    return {
        "patient_id": patient_id,
        "similar_patients": top_matches,
        "aggregated_recommendations": recommendations,
        "embedding_dim": len(features),
        "model_version": "similarity-v1.0",
    }


def _extract_features(vitals_data: list) -> list:
    hr = spo2 = bp = temp = 0.0
    counts = {}
    for v in vitals_data:
        mt = v.get("metric_type", "")
        val = v.get("value", 0)
        if mt == "heart_rate":
            hr += val; counts["hr"] = counts.get("hr", 0) + 1
        elif mt == "spo2":
            spo2 += val; counts["spo2"] = counts.get("spo2", 0) + 1
        elif mt == "bp_systolic":
            bp += val; counts["bp"] = counts.get("bp", 0) + 1
        elif mt == "body_temp":
            temp += val; counts["temp"] = counts.get("temp", 0) + 1

    hr = hr / counts.get("hr", 1) if counts.get("hr") else 72.0
    spo2 = spo2 / counts.get("spo2", 1) if counts.get("spo2") else 98.0
    bp = bp / counts.get("bp", 1) if counts.get("bp") else 120.0
    temp = temp / counts.get("temp", 1) if counts.get("temp") else 36.6

    # Normalized 8-dim feature vector
    return [
        hr / 200.0,
        spo2 / 100.0,
        bp / 200.0,
        temp / 42.0,
        len(vitals_data) / 500.0,
        random.uniform(0.1, 0.3),   # behavioral_score placeholder
        random.uniform(0.0, 0.2),   # stress_index placeholder
        random.uniform(0.5, 1.0),   # adherence_score placeholder
    ]


def _cosine_distance(a: list, b: list) -> float:
    dot = sum(x * y for x, y in zip(a, b))
    mag_a = math.sqrt(sum(x * x for x in a)) or 1e-9
    mag_b = math.sqrt(sum(x * x for x in b)) or 1e-9
    return 1.0 - (dot / (mag_a * mag_b))


def _get_cohort_embeddings() -> list:
    """Simulated anonymized cohort embeddings."""
    random.seed(42)
    conditions_pool = [
        ["hypertension", "type-2-diabetes"],
        ["cardiac-arrhythmia"],
        ["sleep-apnea", "obesity"],
        ["hypothyroidism"],
        ["chronic-kidney-disease", "hypertension"],
    ]
    outcomes_pool = [
        "ACE inhibitor therapy improved BP by 12%",
        "Metformin adherence reduced HbA1c by 1.2%",
        "CPAP therapy normalized sleep SpO2",
        "Levothyroxine stabilized metabolic markers",
        "Dietary sodium restriction lowered systolic by 8 mmHg",
    ]
    cohort = []
    for i in range(10):
        cohort.append({
            "embedding": [random.uniform(0.0, 1.0) for _ in range(8)],
            "conditions": random.choice(conditions_pool),
            "outcomes": random.sample(outcomes_pool, k=2),
        })
    return cohort
