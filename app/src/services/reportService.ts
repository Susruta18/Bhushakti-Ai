import { delay } from './api';
import { MOCK_REPORTS } from '../data/mockReports';
import type { FieldReport, ReportFormData } from '../types';

export const reportService = {
  async getReports(): Promise<FieldReport[]> {
    await delay();
    return MOCK_REPORTS;
  },

  async getReport(id: string): Promise<FieldReport> {
    await delay(400);
    const report = MOCK_REPORTS.find((r) => r.id === id);
    if (!report) throw new Error(`Report ${id} not found`);
    return report;
  },

  async createReport(data: ReportFormData): Promise<FieldReport> {
    await delay(1500); // Simulate upload time
    const newReport: FieldReport = {
      id: `report-${Date.now()}`,
      title: data.hazardType.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase()),
      hazardType: data.hazardType,
      location: data.location,
      zone: 'Zone A',
      description: data.description,
      riskLevel: 'moderate',
      status: 'submitted',
      reportedBy: 'Demo Authority Officer',
      reportedAt: new Date().toISOString(),
    };
    return newReport;
  },

  async getRecentReportCount(): Promise<number> {
    await delay(200);
    return MOCK_REPORTS.filter((r) => {
      const diff = Date.now() - new Date(r.reportedAt).getTime();
      return diff < 24 * 60 * 60 * 1000; // Last 24h
    }).length;
  },
};
