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
  const response = await api.get('/people/states');
  return response.data.results || [];
};

export const getParties = async (): Promise<string[]> => {
  const response = await api.get('/people/parties');
  return response.data.results || [];
};

export const syncPeople = async (): Promise<any> => {
  const response = await api.post('/people/sync');
  return response.data;
};

export const getSyncSchedule = async (): Promise<string> => {
  const response = await api.get('/people/sync/schedule');
  return response.data.frequency;
};

export const updateSyncSchedule = async (frequency: string): Promise<any> => {
  const response = await api.put('/people/sync/schedule', { frequency });
  return response.data;
};

export default api;
