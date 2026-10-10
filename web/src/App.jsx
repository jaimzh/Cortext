import { useEffect, useState } from 'react';
import { createApi } from './services/api.js';
import MainLayout from './layouts/MainLayout.jsx';

export default function App() {
    const [api, setApi] = useState(null);

    useEffect(() => {
        const token = new URLSearchParams(window.location.search).get('token') || '';
        const connection = createApi(token);
        setApi(connection);
        return () => connection.dispose();
    }, []);

    return api ? <MainLayout api={api} /> : <p role="status">Starting Cortext…</p>;
}
