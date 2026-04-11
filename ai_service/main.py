from fastapi import FastAPI
from pydantic import BaseModel
import joblib
import pandas as pd
import numpy as np

app = FastAPI()

# Load models
disruption_model = joblib.load("models/disruption_model.pkl")
loss_model = joblib.load("models/loss_model.pkl")
anomaly_model = joblib.load("models/anomaly_model.pkl")

class FeaturesInput(BaseModel):
    rainfall: float
    rainfall_avg_3d: float
    rainfall_weighted: float
    aqi: float
    aqi_avg_3d: float
    aqi_trend: float
    temperature: float
    is_peak_hour: int
    is_weekend: int
    hour: int
    platform: str
    rain_weight: float
    speed_sensitivity: float
    is_swiggy: int
    is_zomato: int
    is_quick_commerce: int
    avg_daily_deliveries: int
    earnings_per_delivery: int

@app.get("/")
def home():
    return {"status": "Aegis AI Service Online - Enhanced ML"}

@app.post("/predict")
def predict_integrated(data: FeaturesInput):
    # 1. RISK PREDICTION & CONFIDENCE
    risk_df = pd.DataFrame([[
        data.rainfall_weighted, data.aqi_avg_3d, data.aqi_trend, data.temperature, 
        data.is_peak_hour, data.is_weekend, data.speed_sensitivity
    ]], columns=['rainfall_weighted', 'aqi_avg', 'aqi_trend', 'temp', 'is_peak_hour', 'is_weekend', 'speed_sens'])
    
    # Probability of disruption (class 1)
    risk_prob = float(disruption_model.predict_proba(risk_df)[0][1])
    risk_score = int(risk_prob * 100)
    
    risk_level = "High" if risk_prob > 0.6 else "Medium" if risk_prob > 0.3 else "Low"
    
    # Confidence Score: Distance from threshold (0.5). If 0.99 or 0.01 -> confidence is high.
    dist_from_threshold = abs(risk_prob - 0.5) * 2  # normalize to 0-1
    confidence = round(float(np.clip(dist_from_threshold + 0.3, 0.4, 0.98)), 2)

    # 2. LOSS ESTIMATION
    daily_earnings = data.avg_daily_deliveries * data.earnings_per_delivery
    loss_df = pd.DataFrame([[
        data.rainfall_avg_3d, data.aqi, data.is_peak_hour, 
        data.is_quick_commerce, data.avg_daily_deliveries
    ]], columns=['rainfall_avg_3d', 'aqi', 'is_peak_hour', 'is_quick_commerce', 'avg_daily_deliveries'])
    
    loss_pct = float(loss_model.predict(loss_df)[0])
    loss_pct = min(100.0, max(0.0, loss_pct))
    estimated_loss = (loss_pct / 100.0) * daily_earnings

    # 3. ANOMALY / FRAUD DETECTION
    # Estimated mapping for realtime check
    anomaly_df = pd.DataFrame([[estimated_loss, 1.5, risk_score]], 
                             columns=['payout_amount', 'payout_frequency_7d', 'anomaly_patterns_score'])
    is_anomaly = True if anomaly_model.predict(anomaly_df)[0] == -1 else False

    # 4. EXPLAINABILITY IMPROVEMENT (Feature Contributions)
    total_impact_base = data.rainfall_weighted * 0.4 + data.aqi_avg_3d * 0.1 + max(0, data.aqi_trend) * 0.2 + data.is_peak_hour * 25
    if total_impact_base == 0: total_impact_base = 1
    
    rain_cont = round(((data.rainfall_weighted * 0.4) / total_impact_base) * 100)
    aqi_cont = round(((data.aqi_avg_3d * 0.1) / total_impact_base) * 100)
    trend_cont = round(((max(0, data.aqi_trend) * 0.2) / total_impact_base) * 100)
    peak_cont = round(((data.is_peak_hour * 25) / total_impact_base) * 100)
    
    expl_parts = []
    if rain_cont > 10: expl_parts.append(f"heavy rainfall ({rain_cont}%)")
    if trend_cont > 10: expl_parts.append(f"rising AQI trend ({trend_cont}%)")
    elif aqi_cont > 15: expl_parts.append(f"poor AQI levels ({aqi_cont}%)")
    if peak_cont > 10: expl_parts.append(f"peak hours ({peak_cont}%)")
    
    if expl_parts:
        explanation = f"Risk is {risk_level.lower()} due to " + " and ".join(expl_parts[:2]) + "."
    else:
        explanation = f"Risk is low. Stable conditions detected."

    return {
        "risk_score": risk_score,
        "confidence": confidence,
        "risk_level": risk_level,
        "loss_percentage": round(loss_pct, 2),
        "estimated_loss": round(estimated_loss, 2),
        "anomaly": is_anomaly,
        "explanation": explanation
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
