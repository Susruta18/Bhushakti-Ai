import { apiFetch } from './api';
import type { Alert, AlertFilter } from '../types';

export const alertService = {
  async getAlerts(filter: AlertFilter = 'all'): Promise<Alert[]> {
    let url = '/alerts';
    if (filter === 'resolved') {
      url += '?status=RESOLVED';
    } else if (filter !== 'all') {
      url += `?severity=${filter.toUpperCase()}`; // wait, backend filter is just status or zoneId. 
      // If we need to filter by severity, frontend can filter it for now.
    }
    
    const response = await apiFetch(url) as any;
    let alerts: Alert[] = response.data || [];
    
    // Map backend _id to id and structure
    alerts = alerts.map((a: any) => ({
      ...a,
      id: a._id,
      riskLevel: a.severity.toLowerCase(),
      status: a.status.toLowerCase(),
      time: a.createdAt,
      location: a.zoneId // We might need zone details, but for now we just map what we have
    }));

    if (filter !== 'all' && filter !== 'resolved') {
      alerts = alerts.filter(a => a.riskLevel === filter && a.status !== 'resolved');
    }
    
    return alerts;
  },

  async getAlert(id: string): Promise<Alert> {
    const response = await apiFetch(`/alerts/${id}`) as any;
    if (!response.data) throw new Error(`Alert ${id} not found`);
    const a = response.data;
    return {
      ...a,
      id: a._id,
      riskLevel: a.severity.toLowerCase(),
      status: a.status.toLowerCase(),
      time: a.createdAt,
      location: a.zoneId
    };
  },

  async getActiveAlertCount(): Promise<number> {
    const response = await apiFetch('/alerts?status=ACTIVE') as any;
    return response.total || (response.data ? response.data.length : 0);
  },

  async acknowledgeAlert(id: string): Promise<Alert> {
    const response = await apiFetch(`/alerts/${id}/acknowledge`, {
      method: 'PATCH',
    }) as any;
    
    // The backend just returns success message, we can re-fetch or optimistically update
    return this.getAlert(id);
  },

  async resolveAlert(id: string): Promise<Alert> {
    // Currently backend resolves alerts automatically on severity change. 
    // If frontend needs it, it requires a new endpoint. 
    // Throw error or mock if not implemented.
    throw new Error('Manual resolve not supported. Risk evaluator handles resolution automatically.');
  },
};
