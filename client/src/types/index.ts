export interface NodeLocation {
  latitude: number;
  longitude: number;
}

export interface Node {
  node_id: string;
  name: string;
  capabilities: string[];
  location?: {
    latitude: number;
    longitude: number;
  };
  status: string;
  battery?: number;
  last_seen: string;
  created_at: string;
}

export interface SensorReading {
  node_id: string;
  timestamp: string;
  temperature?: number;
  smoke?: number;
  humidity?: number;
  motion?: boolean;
  distance?: number;
  gas?: number;
  battery?: number;
}

export interface Event {
  event_id: string;
  node_id: string;
  event_type: string;
  confidence?: number;
  risk_score: number;
  risk_level: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  status: string;
  confirmed: boolean;
  timestamp: string;
}

export interface Alert {
  alert_id: string;
  event_id: string;
  node_id: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  title: string;
  message: string;
  acknowledged: boolean;
  created_at: string;
}

export interface CloudAIResult {
  node_id: string;
  edge_ai: {
    event?: string;
    confidence?: number;
    model_version?: string;
  };
  cloud_ai: {
    classification?: string;
    confidence?: number;
  };
  fusion: {
    nodes_confirmed: number;
    evidence_count: number;
  };
  trend: {
    temperature?: string;
    smoke?: string;
    battery?: string;
  };
  anomaly: {
    detected: boolean;
    score: number;
    reason?: string;
  };
  risk: {
    score: number;
    level: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
    evidence: string[];
  };
}

export interface WebSocketMessage {
  type: string;
  data: any;
}
