import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:3000/api/v1',
});

export interface Politician {
  id: string;
  name: string;
  role_title: string | null;
  image: string | null;
  state: string | null;
  party: string | null;
}

export const getPeople = async (state?: string, party?: string): Promise<Politician[]> => {
  const params = new URLSearchParams();
  if (state) params.append('state', state);
  if (party) params.append('party', party);

  const response = await api.get('/people', { params });
  return response.data.results || [];
};

export const getStates = async (): Promise<string[]> => {
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

export default api;
