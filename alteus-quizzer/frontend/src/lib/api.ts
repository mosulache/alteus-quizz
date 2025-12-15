// Detect host automatically for local network testing
const HOST = window.location.hostname;
const API_URL = `http://${HOST}:8000`;

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

