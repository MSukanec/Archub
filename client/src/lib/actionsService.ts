import { apiRequest } from './queryClient';

export interface Action {
  id: number;
  name: string;
  description: string;
  createdAt: string;
}

export interface CreateActionData {
  name: string;
  description: string;
}

export const actionsService = {
  async getAll(): Promise<Action[]> {
    const response = await fetch('/api/actions');
    if (!response.ok) {
      throw new Error('Error al obtener las acciones');
    }
    return response.json();
  },

  async create(actionData: CreateActionData): Promise<Action> {
    return apiRequest('/api/actions', {
      method: 'POST',
      body: JSON.stringify(actionData),
    });
  },

  async update(id: number, actionData: Partial<CreateActionData>): Promise<Action> {
    return apiRequest(`/api/actions/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(actionData),
    });
  },

  async delete(id: number): Promise<void> {
    return apiRequest(`/api/actions/${id}`, {
      method: 'DELETE',
    });
  },
};