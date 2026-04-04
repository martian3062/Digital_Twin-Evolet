"""Geospatial Health Intelligence Module.
IDF Step 12: Location-aware insights — environmental risks, nearby facilities, emergency routing.
"""
import math
import random


# Simulated healthcare facilities database
FACILITIES = [
    {"name": "AMTZ Medical Hub", "type": "hospital", "lat": 17.3850, "lng": 78.4867, "services": ["cardiology", "emergency", "icu"]},
    {"name": "Apollo Clinic", "type": "clinic", "lat": 17.4200, "lng": 78.4500, "services": ["general", "pharmacy"]},
    {"name": "Care Emergency Center", "type": "emergency", "lat": 17.3700, "lng": 78.5100, "services": ["emergency", "trauma"]},
    {"name": "NovaMed Diagnostics", "type": "diagnostic", "lat": 17.4100, "lng": 78.4800, "services": ["lab", "imaging"]},
    {"name": "City Pharmacy", "type": "pharmacy", "lat": 17.3900, "lng": 78.4900, "services": ["pharmacy"]},
]


def analyze_geospatial_context(patient_id: str, lat: float, lng: float, risk_scores: dict = None) -> dict:
    """
    IDF: Environmental impact, nearby facility mapping, emergency routing.
    """
    nearby = _find_nearby_facilities(lat, lng, radius_km=10.0)
    env_risk = _assess_environmental_risk(lat, lng)
    emergency_route = _compute_emergency_route(lat, lng, nearby, risk_scores or {})
    spatial_insights = _generate_spatial_insights(env_risk, nearby, risk_scores or {})

    return {
        "patient_id": patient_id,
        "location": {"lat": lat, "lng": lng},
        "nearby_facilities": nearby[:5],
        "environmental_risk": env_risk,
        "emergency_route": emergency_route,
        "spatial_insights": spatial_insights,
        "model_version": "geo-v1.0",
    }


def _haversine_km(lat1: float, lng1: float, lat2: float, lng2: float) -> float:
    R = 6371.0
    d_lat = math.radians(lat2 - lat1)
    d_lng = math.radians(lng2 - lng1)
    a = math.sin(d_lat / 2) ** 2 + math.cos(math.radians(lat1)) * math.cos(math.radians(lat2)) * math.sin(d_lng / 2) ** 2
    return R * 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))


def _find_nearby_facilities(lat: float, lng: float, radius_km: float = 10.0) -> list:
    results = []
    for f in FACILITIES:
        dist = _haversine_km(lat, lng, f["lat"], f["lng"])
        if dist <= radius_km:
            results.append({**f, "distance_km": round(dist, 2), "eta_minutes": round(dist * 3, 1)})
    results.sort(key=lambda x: x["distance_km"])
    return results


def _assess_environmental_risk(lat: float, lng: float) -> dict:
    """Simulate environmental risk assessment."""
    # In production: integrate AQI / weather APIs
    aqi = random.randint(45, 130)
    return {
        "aqi": aqi,
        "aqi_category": "Good" if aqi < 50 else ("Moderate" if aqi < 100 else "Unhealthy"),
        "heat_index": round(random.uniform(28, 38), 1),
        "humidity_pct": random.randint(55, 85),
        "pollen_level": random.choice(["Low", "Moderate", "High"]),
        "risk_level": "low" if aqi < 50 else ("moderate" if aqi < 100 else "high"),
    }


def _compute_emergency_route(lat: float, lng: float, facilities: list, risk_scores: dict) -> dict:
    """Prioritize emergency routing based on patient risk profile."""
    high_risk = any(v > 0.75 for v in risk_scores.values()) if risk_scores else False

    emergency_facilities = [f for f in facilities if "emergency" in f.get("services", [])]
    best = emergency_facilities[0] if emergency_facilities else (facilities[0] if facilities else None)

    if not best:
        return {"status": "no_facility_found"}

    cardiac_risk = risk_scores.get("cardiac", 0)
    preferred_type = "cardiology" if cardiac_risk > 0.6 else "emergency"

    return {
        "priority": "URGENT" if high_risk else "STANDARD",
        "recommended_facility": best["name"],
        "facility_type": best["type"],
        "distance_km": best["distance_km"],
        "eta_minutes": best["eta_minutes"],
        "preferred_service": preferred_type,
        "ambulance_recommended": high_risk,
    }


def _generate_spatial_insights(env_risk: dict, facilities: list, risk_scores: dict) -> list:
    insights = []
    if env_risk["aqi"] > 100:
        insights.append(f"Poor air quality (AQI {env_risk['aqi']}) — avoid outdoor activity; may worsen respiratory risk.")
    if env_risk["heat_index"] > 35:
        insights.append("High heat index — ensure hydration; cardiac and hypertension risk elevated.")
    if facilities:
        insights.append(f"Nearest facility: {facilities[0]['name']} ({facilities[0]['distance_km']} km, ~{facilities[0]['eta_minutes']} min).")
    cardiac = risk_scores.get("cardiac", 0)
    if cardiac > 0.6:
        nearest_cardiac = next((f for f in facilities if "cardiology" in f.get("services", [])), None)
        if nearest_cardiac:
            insights.append(f"Cardiac risk elevated — {nearest_cardiac['name']} has cardiology services {nearest_cardiac['distance_km']} km away.")
    return insights
