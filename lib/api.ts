// API base URL. For local development, set NEXT_PUBLIC_API_URL=http://localhost:8000
// in .env.local. Production should set it to your deployed API URL.
const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

function getToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('adaptive_token');
}

export function setToken(token: string) {
  localStorage.setItem('adaptive_token', token);
}

export function clearToken() {
  localStorage.removeItem('adaptive_token');
  localStorage.removeItem('adaptive_user');
}

export function getUser() {
  if (typeof window === 'undefined') return null;
  const u = localStorage.getItem('adaptive_user');
  return u ? JSON.parse(u) : null;
}

export function setUser(user: any) {
  localStorage.setItem('adaptive_user', JSON.stringify(user));
}

async function request(path: string, options: RequestInit = {}) {
  const token = getToken();
  const url = new URL(path, window.location.origin);
  if (token) url.searchParams.set('token', token);

  const res = await fetch(url.toString(), {
    ...options,
    headers: { 'Content-Type': 'application/json', ...options.headers },
  });

  if (res.status === 401) {
    clearToken();
    window.location.href = '/';
    throw new Error('Unauthorized');
  }

  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: 'Request failed' }));
    throw new Error(err.detail || 'Request failed');
  }

  return res.json();
}

export const api = {
  // Auth
  login: (email: string, password: string) =>
    request(`${API_BASE}/auth/login`, { method: 'POST', body: JSON.stringify({ email, password }) }),

  getMe: () => request(`${API_BASE}/auth/me`),

  // Admin: Clients
  getClients: (search = '', page = 1, perPage = 10) =>
    request(`${API_BASE}/clients?search=${encodeURIComponent(search)}&page=${page}&per_page=${perPage}`),

  getClient: (id: number) => request(`${API_BASE}/clients/${id}`),

  createClient: (data: { client_name: string; project_code: string; email: string; password: string }) =>
    request(`${API_BASE}/clients`, { method: 'POST', body: JSON.stringify(data) }),

  updateClient: (id: number, data: any) =>
    request(`${API_BASE}/clients/${id}`, { method: 'PUT', body: JSON.stringify(data) }),

  deleteClient: (id: number) =>
    request(`${API_BASE}/clients/${id}`, { method: 'DELETE' }),

  resetPassword: (clientId: number, newPassword: string) =>
    request(`${API_BASE}/clients/${clientId}/reset-password`, {
      method: 'POST', body: JSON.stringify({ new_password: newPassword }),
    }),

  // Client: own profile + settings
  getMyClient: () => request(`${API_BASE}/my-client`),
  updateMyContact: (data: any) =>
    request(`${API_BASE}/my-contact`, { method: 'PUT', body: JSON.stringify(data) }),
  updateMyNotifications: (data: any) =>
    request(`${API_BASE}/my-notifications`, { method: 'PUT', body: JSON.stringify(data) }),

  // Sites
  getSites: (clientId: number, search = '', page = 1, perPage = 10) =>
    request(`${API_BASE}/clients/${clientId}/sites?search=${encodeURIComponent(search)}&page=${page}&per_page=${perPage}`),

  getSite: (siteId: number) => request(`${API_BASE}/sites/${siteId}`),

  createSite: (clientId: number, data: any) =>
    request(`${API_BASE}/clients/${clientId}/sites`, { method: 'POST', body: JSON.stringify(data) }),

  updateSite: (siteId: number, data: any) =>
    request(`${API_BASE}/sites/${siteId}`, { method: 'PUT', body: JSON.stringify(data) }),

  deleteSite: (siteId: number) =>
    request(`${API_BASE}/sites/${siteId}`, { method: 'DELETE' }),

  setSiteDemo: (siteId: number, data: { demo_started_at?: string | null; demo_history_end_at?: string | null; demo_history_interval_seconds?: number; demo_interval_seconds?: number }) =>
    request(`${API_BASE}/sites/${siteId}/demo`, { method: 'PUT', body: JSON.stringify(data) }),

  // Upload
  uploadData: async (siteId: number, file: File) => {
    const token = getToken();
    const formData = new FormData();
    formData.append('file', file);
    const url = new URL(`${API_BASE}/sites/${siteId}/upload-data`, window.location.origin);
    if (token) url.searchParams.set('token', token);
    const res = await fetch(url.toString(), { method: 'POST', body: formData });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ detail: 'Upload failed' }));
      throw new Error(err.detail || 'Upload failed');
    }
    return res.json();
  },

  // Sensors + chart data
  getSensors: (siteId: number) => request(`${API_BASE}/sites/${siteId}/sensors`),

  getChartData: (siteId: number, sensorNames: string[], excludeOutliers = false) =>
    request(`${API_BASE}/sites/${siteId}/chart-data?sensor_names=${encodeURIComponent(sensorNames.join(','))}&exclude_outliers=${excludeOutliers}`),

  // Views
  getViews: (siteId: number) => request(`${API_BASE}/sites/${siteId}/views`),

  createView: (siteId: number, data: any) =>
    request(`${API_BASE}/sites/${siteId}/views`, { method: 'POST', body: JSON.stringify(data) }),

  updateView: (viewId: number, data: any) =>
    request(`${API_BASE}/views/${viewId}`, { method: 'PUT', body: JSON.stringify(data) }),

  deleteView: (viewId: number) =>
    request(`${API_BASE}/views/${viewId}`, { method: 'DELETE' }),

  // Thresholds
  getThresholds: (siteId: number) => request(`${API_BASE}/sites/${siteId}/thresholds`),

  createThreshold: (siteId: number, data: any) =>
    request(`${API_BASE}/sites/${siteId}/thresholds`, { method: 'POST', body: JSON.stringify(data) }),

  updateThreshold: (thresholdId: number, data: any) =>
    request(`${API_BASE}/thresholds/${thresholdId}`, { method: 'PUT', body: JSON.stringify(data) }),

  deleteThreshold: (thresholdId: number) =>
    request(`${API_BASE}/thresholds/${thresholdId}`, { method: 'DELETE' }),

  // Export
  exportCsv: async (siteId: number, sensorNames: string[] = [], excludeOutliers = false) => {
    const token = getToken();
    const url = new URL(`${API_BASE}/sites/${siteId}/export-csv`, window.location.origin);
    if (token) url.searchParams.set('token', token);
    if (sensorNames.length) url.searchParams.set('sensor_names', sensorNames.join(','));
    url.searchParams.set('exclude_outliers', String(excludeOutliers));
    const res = await fetch(url.toString());
    if (!res.ok) throw new Error('Export failed');
    const blob = await res.blob();
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `export_${siteId}.csv`;
    a.click();
  },
};
