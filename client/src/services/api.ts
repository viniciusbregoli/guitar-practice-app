const BASE_URL = '/api';

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE_URL}${path}`, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  });
  if (!res.ok) {
    throw new Error(`API error: ${res.status} ${res.statusText}`);
  }
  return res.json();
}

export const api = {
  // Routines
  getRoutines: () => request<any[]>('/routines'),
  getRoutine: (id: string) => request<any>(`/routines/${id}`),
  saveRoutine: (routine: any) =>
    request<any>(`/routines/${routine.id}`, {
      method: 'PUT',
      body: JSON.stringify(routine),
    }),
  createRoutine: (routine: any) =>
    request<any>('/routines', {
      method: 'POST',
      body: JSON.stringify(routine),
    }),

  // Songs
  getSongs: () => request<any>('/songs'),
  saveSongs: (library: any) =>
    request<any>('/songs', {
      method: 'PUT',
      body: JSON.stringify(library),
    }),

  // Sessions
  getSessions: () => request<any>('/sessions'),
  saveSession: (session: any) =>
    request<any>('/sessions', {
      method: 'POST',
      body: JSON.stringify(session),
    }),

  // Progress
  getStreaks: () => request<any>('/progress/streaks'),
  saveStreaks: (data: any) =>
    request<any>('/progress/streaks', {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
  getTopicRotation: () => request<any>('/progress/topics'),
  saveTopicRotation: (data: any) =>
    request<any>('/progress/topics', {
      method: 'PUT',
      body: JSON.stringify(data),
    }),

  // Settings
  getSettings: () => request<any>('/settings'),
  saveSettings: (data: any) =>
    request<any>('/settings', {
      method: 'PUT',
      body: JSON.stringify(data),
    }),

  // Video upload
  uploadVideo: async (file: File): Promise<{ path: string }> => {
    const formData = new FormData();
    formData.append('video', file);
    const res = await fetch(`${BASE_URL}/videos/upload`, {
      method: 'POST',
      body: formData,
    });
    if (!res.ok) throw new Error('Upload failed');
    return res.json();
  },
};
