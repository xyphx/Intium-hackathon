import { Node, SensorReading, Event, Alert } from '../types';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8001/api';

async function fetchAPI<T>(endpoint: string, options?: RequestInit): Promise<T> {
  const response = await fetch(`${API_BASE}${endpoint}`, options);
  const json = await response.json();
  if (!json.success) {
    throw new Error(json.message || 'API Error');
  }
  return json.data as T;
}

export const getNodes = () => fetchAPI<Node[]>('/nodes');
export const getNode = (id: string) => fetchAPI<Node>(`/nodes/${id}`);
export const getSensorReadings = (limit = 50) => fetchAPI<SensorReading[]>(`/sensor-data?limit=${limit}`);
export const getNodeSensorReadings = (nodeId: string, limit = 50) => fetchAPI<SensorReading[]>(`/sensor-data/${nodeId}?limit=${limit}`);
export const getEvents = () => fetchAPI<Event[]>('/events');
export const getEvent = (id: string) => fetchAPI<Event>(`/events/${id}`);
export const getAlerts = () => fetchAPI<Alert[]>('/alerts');
export const acknowledgeAlert = (id: string) => fetchAPI<any>(`/alerts/${id}/acknowledge`, { method: 'PATCH' });
