import { useState } from 'react';

const useApi = () => {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const request = async (endpoint, options = {}) => {
        setLoading(true);
        setError(null);

        try {
            const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api';

            // Ensure Content-Type header is set for POST requests
            const headers = {
                'Content-Type': 'application/json',
                ...options.headers,
            };

            console.log('API Request:', {
                url: `${API_BASE}${endpoint}`,
                method: options.method || 'GET',
                headers,
                body: options.body
            });

            const response = await fetch(`${API_BASE}${endpoint}`, {
                headers,
                ...options,
            });

            const data = await response.json();
            console.log('API Response:', data);

            if (!response.ok) {
                throw new Error(data.error || data.message || 'Request failed');
            }

            setLoading(false);
            return data;
        } catch (err) {
            console.error('API Error:', err);
            setError(err.message);
            setLoading(false);
            throw err;
        }
    };

    return { request, loading, error };
};

export default useApi;