def calculate_system_risk(
    raw_data: dict,
    edge_ai: dict,
    cloud_class: str,
    cloud_conf: float,
    trends: dict,
    anomaly: tuple[bool, float, str],
    fusion_confirmed: int
) -> tuple[int, str, list[str]]:
    """
    Calculates the final global risk score, risk level, and generates explainable evidence.
    """
    score = 0
    evidence = []
    
    # 1. Edge AI Evidence
    if edge_ai.get("event"):
        score += int(30 * (edge_ai.get("confidence") or 0.0))
        evidence.append(f"Edge AI detected '{edge_ai['event']}' ({int((edge_ai.get('confidence') or 0)*100)}% confidence)")
        
    # 2. Raw Sensor Thresholds
    temp = raw_data.get("temperature")
    if temp and temp > 60:
        score += 40
        evidence.append(f"Critical temperature threshold exceeded: {temp}°C")
    elif temp and temp > 40:
        score += 20
        evidence.append(f"High temperature detected: {temp}°C")
        
    smoke = raw_data.get("smoke")
    if smoke and smoke > 50:
        score += 30
        evidence.append(f"High smoke concentration: {smoke}")
        
    if raw_data.get("motion"):
        score += 10
        evidence.append("Motion detected")
        
    # 3. Trends
    temp_trend = trends.get("temperature")
    if temp_trend == "rapidly_increasing":
        score += 20
        evidence.append("Temperature is rapidly increasing")
    elif temp_trend == "increasing":
        score += 10
        
    # 4. Anomaly
    is_anomalous, anom_score, anom_reason = anomaly
    if is_anomalous:
        score += 25
        evidence.append(f"Historical Anomaly: {anom_reason}")
        
    # 5. Fusion / Multi-node
    if fusion_confirmed > 0:
        score += (20 * fusion_confirmed)
        evidence.append(f"Confirmed by {fusion_confirmed} neighbor node(s)")
        
    # Cap score
    score = min(score, 100)
    
    # Determine level
    level = "LOW"
    if score >= 80:
        level = "CRITICAL"
    elif score >= 50:
        level = "HIGH"
    elif score >= 20:
        level = "MEDIUM"
        
    if not evidence and score == 0:
        evidence.append("All systems operating within normal parameters")
        
    return score, level, evidence
