def analyze_trend(current_value: float, history: list[float]) -> str:
    """
    Analyzes the trend of a sensor value over time.
    history should be ordered from oldest to newest.
    """
    if not history or current_value is None:
        return "stable"
        
    avg_history = sum(history) / len(history)
    diff = current_value - avg_history
    
    # Calculate rate of change
    if diff > 10:
        return "rapidly_increasing"
    elif diff > 3:
        return "increasing"
    elif diff < -10:
        return "rapidly_decreasing"
    elif diff < -3:
        return "decreasing"
        
    return "stable"

def analyze_sensor_trends(current_data: dict, historical_readings: list[dict]) -> dict:
    """
    Given the current reading and a list of historical readings (oldest to newest),
    calculates the trend for key sensors.
    """
    trends = {}
    for sensor in ["temperature", "smoke", "battery"]:
        current_val = current_data.get(sensor)
        if current_val is not None:
            history = [r.get(sensor) for r in historical_readings if r.get(sensor) is not None]
            trends[sensor] = analyze_trend(current_val, history)
    
    return trends
