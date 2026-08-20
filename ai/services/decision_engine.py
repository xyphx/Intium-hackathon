from ai.schemas.inference import CloudAIResult, EdgeAI, CloudAI, SensorFusion, Trend, Anomaly, Risk
from ai.preprocessing.trend_analysis import analyze_sensor_trends
from ai.models.anomaly import detect_anomalies
from ai.services.sensor_fusion import evaluate_sensor_fusion, cloud_classify
from ai.risk.risk_engine import calculate_system_risk

def process_telemetry(
    node_id: str,
    raw_data: dict, 
    historical_readings: list[dict], 
    recent_system_events: list[dict]
) -> dict:
    """
    Main orchestrator for the Cloud AI layer.
    """
    # 1. Parse Edge AI if present
    edge_ai = raw_data.get("edge_ai", {})
    if not isinstance(edge_ai, dict):
        # Fallback if fields are flattened
        edge_ai = {
            "event": raw_data.get("vision_result") or raw_data.get("edge_event"),
            "confidence": raw_data.get("ai_confidence") or raw_data.get("edge_confidence"),
            "model_version": raw_data.get("model_version")
        }
        
    # Make sure we don't drop important fields
    parsed_data = {
        **raw_data,
        "temperature": raw_data.get("temperature"),
        "smoke": raw_data.get("smoke"),
        "humidity": raw_data.get("humidity"),
        "gas": raw_data.get("gas"),
        "motion": raw_data.get("motion"),
        "distance": raw_data.get("distance")
    }
    
    edge_model = EdgeAI(**edge_ai)
    
    # 2. Trend Analysis
    trends = analyze_sensor_trends(parsed_data, historical_readings)
    trend_model = Trend(**trends)
    
    # 3. Anomaly Detection
    is_anomalous, anom_score, anom_reason = detect_anomalies(parsed_data, historical_readings)
    anomaly_model = Anomaly(detected=is_anomalous, score=anom_score, reason=anom_reason)
    
    # 4. Sensor Fusion & Multi-node
    nodes_confirmed, evidence_count = evaluate_sensor_fusion(node_id, recent_system_events)
    fusion_model = SensorFusion(nodes_confirmed=nodes_confirmed, evidence_count=evidence_count)
    
    # 5. Cloud Classification
    c_class, c_conf = cloud_classify(raw_data, edge_ai, nodes_confirmed)
    cloud_model = CloudAI(classification=c_class, confidence=c_conf)
    
    # 6. Global Risk Engine
    r_score, r_level, evidence = calculate_system_risk(
        raw_data, edge_ai, c_class, c_conf, trends, (is_anomalous, anom_score, anom_reason), nodes_confirmed
    )
    
    # Ensure evidence_count reflects the generated evidence length
    fusion_model.evidence_count = len(evidence)
    
    risk_model = Risk(score=r_score, level=r_level, evidence=evidence)
    
    # 7. Assemble Result
    result = CloudAIResult(
        node_id=node_id,
        edge_ai=edge_model,
        cloud_ai=cloud_model,
        fusion=fusion_model,
        trend=trend_model,
        anomaly=anomaly_model,
        risk=risk_model
    )
    
    return result.model_dump()
