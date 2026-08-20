def evaluate_sensor_fusion(current_node_id: str, recent_events: list[dict]) -> tuple[int, int]:
    """
    Evaluates multi-node fusion.
    Returns:
      nodes_confirmed: number of other nodes that have reported high-risk events recently.
      evidence_count: number of distinct pieces of evidence across the system right now.
    """
    nodes_confirming = set()
    evidence_count = 0
    
    for event in recent_events:
        if event.get("node_id") != current_node_id:
            nodes_confirming.add(event.get("node_id"))
            evidence_count += 1
            
    return len(nodes_confirming), evidence_count

def cloud_classify(raw_data: dict, edge_ai: dict, fusion_confirmed: int) -> tuple[str, float]:
    """
    Determines the Cloud AI classification and confidence.
    """
    base_conf = edge_ai.get("confidence") or 0.0
    classification = edge_ai.get("event") or "unknown"
    
    # If edge says possible fire, and we have high temp or smoke, we confirm it
    if classification in ["possible_fire", "fire"]:
        temp = raw_data.get("temperature", 0)
        smoke = raw_data.get("smoke", 0)
        
        if temp > 60 or smoke > 50:
            classification = "fire"
            base_conf = max(base_conf, 0.8) + 0.1
            
    # Boost confidence based on fusion
    if fusion_confirmed > 0:
        base_conf += (fusion_confirmed * 0.05)
        
    return classification, min(base_conf, 1.0)
