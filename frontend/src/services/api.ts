import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:3000/api/v1',
});

export interface Politician {
  id: string;
  name: string;
  role_title: string | null;
  image: string | null;
  party: string | null;
  gender: string | null;
  birth_date: string | null;
  death_date: string | null;
  jurisdiction: {
    id: string;
    name: string;
  } | null;
}

export interface PeopleResponse {
  results: Politician[];
  pagination: {
    next_cursor: string | null;
  };
}

export const getPeople = async (jurisdictionId?: string, party?: string, cursor?: string): Promise<PeopleResponse> => {
  const params = new URLSearchParams();
  if (jurisdictionId) params.append('jurisdiction_id', jurisdictionId);
  if (party) params.append('party', party);
  if (cursor) params.append('cursor', cursor);

  const response = await api.get('/people', { params });
  return response.data;
};

export const getStates = async (): Promise<{ value: string; label: string }[]> => {
  const response = await api.get('/states');
  return response.data.results || [];
};

export const getParties = async (): Promise<string[]> => {
  const response = await api.get('/parties');
  return response.data.results || [];
};

export interface SyncResponse {
  status: 'accepted' | 'rejected';
  message: string;
}

export const syncPeople = async (): Promise<SyncResponse> => {
  const response = await api.post('/people/sync');
  return response.data;
};

export interface SyncProgressData {
  isSyncing: boolean;
  synced: number;
  total: number;
  current: string | null;
}

export const getSyncProgressData = async (): Promise<SyncProgressData> => {
  const response = await api.get('/people/sync/progress');
  return response.data;
};

export interface CancelSyncResponse {
  message: string;
}

export const cancelSyncRequest = async (): Promise<CancelSyncResponse> => {
  const response = await api.post('/people/sync/cancel');
  return response.data;
};

export const getSyncSchedule = async (): Promise<string> => {
  const response = await api.get('/people/sync/schedule');
  return response.data.frequency;
};

export interface UpdateScheduleResponse {
  message: string;
  frequency: string;
}

export const updateSyncSchedule = async (frequency: string): Promise<UpdateScheduleResponse> => {
  const response = await api.put('/people/sync/schedule', { frequency });
  return response.data;
};

export default api;
