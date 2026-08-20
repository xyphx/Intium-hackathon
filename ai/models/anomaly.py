def detect_anomalies(current_data: dict, historical_readings: list[dict]) -> tuple[bool, float, str]:
    """
    Detects if the current sensor data is anomalous compared to historical baseline.
    Returns (is_anomalous, score, reason).
    """
    if not historical_readings:
        return False, 0.0, None
        
    # Example: Check temperature spikes
    temp = current_data.get("temperature")
    if temp is not None:
        history_temp = [r.get("temperature") for r in historical_readings if r.get("temperature") is not None]
        if len(history_temp) >= 3:
            avg_temp = sum(history_temp) / len(history_temp)
            if temp > avg_temp + 20: # Sudden spike of 20 degrees
                return True, 0.95, f"Temperature suddenly spiked to {temp}°C (baseline {avg_temp:.1f}°C)"
                
    # Example: Check smoke spikes
    smoke = current_data.get("smoke")
    if smoke is not None:
        history_smoke = [r.get("smoke") for r in historical_readings if r.get("smoke") is not None]
        if len(history_smoke) >= 3:
            avg_smoke = sum(history_smoke) / len(history_smoke)
            if smoke > avg_smoke + 30: 
                return True, 0.88, f"Unusual high smoke concentration detected: {smoke}"
                
    return False, 0.0, None
