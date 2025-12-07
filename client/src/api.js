// API adapter for Web Version (HTTP)

export const dbQuery = async (sql, params = []) => {
    try {
        const response = await fetch('/api/query', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify({ sql, params })
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.message || 'Database query failed');
        }

        return await response.json();
    } catch (error) {
        console.error('API Error:', error);
        throw error;
    }
};

export const saveFile = async (file, folder = 'uploads') => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('folder', folder);

    const response = await fetch('/api/uploads', {
        method: 'POST',
        body: formData
    });

    if (!response.ok) throw new Error('Upload failed');
    return await response.json();
};

export const openFile = async (path) => {
    // In web version, we just open the URL
    if (!path) return;
    const url = path.startsWith('http') ? path : `/uploads/${path}`;
    window.open(url, '_blank');
};

export const getUploadPath = async () => {
    return '/uploads';
};
