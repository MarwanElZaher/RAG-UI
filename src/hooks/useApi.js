import { useState } from 'react';

const useApi = () => {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const request = async (endpoint, options = {}) => {
        setLoading(true);
        setError(null);

        try {
            const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api';
            const response = await fetch(`${API_BASE}${endpoint}`, {
                headers: {
                    'Content-Type': 'application/json',
                    ...options.headers,
                },
                ...options,
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Request failed');
            }

            setLoading(false);
            return data;
        } catch (err) {
            setError(err.message);
            setLoading(false);
            throw err;
        }
    };

    return { request, loading, error };
};

export default useApi;