// API base URL
// - Can be overridden via Vite env var: VITE_API_URL (ex: http://localhost:8000)
// - Otherwise defaults to same hostname as the frontend, port 8000.
const HOST = window.location.hostname;
const ENV_API_URL = (import.meta as any)?.env?.VITE_API_URL as string | undefined;
const API_URL = (ENV_API_URL || `http://${HOST}:8000`).replace(/\/+$/, "");

export async function apiRequest<T>(endpoint: string, options?: RequestInit): Promise<T> {
    const response = await fetch(`${API_URL}${endpoint}`, {
        ...options,
        headers: {
            'Content-Type': 'application/json',
            ...options?.headers,
        },
    });

    if (!response.ok) {
        const error = await response.json().catch(() => ({ detail: 'Something went wrong' }));
        throw new Error(error.detail || 'API Request Failed');
    }

    return response.json();
}

