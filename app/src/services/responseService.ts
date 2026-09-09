import { delay } from './api';
import { MOCK_RESPONSE_PRIORITIES, MOCK_RESPONSE_PLANS } from '../data/mockData';
import type { ResponsePriority, ResponsePlan } from '../types';

export const responseService = {
  async getResponsePriorities(): Promise<ResponsePriority[]> {
    await delay();
    return MOCK_RESPONSE_PRIORITIES;
  },

  async getResponsePlan(id: string): Promise<ResponsePlan> {
    await delay(400);
    const plan = MOCK_RESPONSE_PLANS.find((p) => p.id === id);
    if (!plan) throw new Error(`Response plan ${id} not found`);
    return plan;
  },

  async getResponsePlanByZone(zoneId: string): Promise<ResponsePlan | null> {
    await delay(400);
    return MOCK_RESPONSE_PLANS.find((p) => p.zoneId === zoneId) || null;
  },

  async updateActionStatus(
    planId: string,
    actionId: string,
    completed: boolean
  ): Promise<ResponsePlan> {
    await delay(300);
    const plan = MOCK_RESPONSE_PLANS.find((p) => p.id === planId);
    if (!plan) throw new Error(`Plan ${planId} not found`);
    const updated = {
      ...plan,
      actions: plan.actions.map((a) =>
        a.id === actionId ? { ...a, completed } : a
      ),
    };
    return updated;
  },
};
