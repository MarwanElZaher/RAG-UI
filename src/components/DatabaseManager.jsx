import React, { useState, useEffect } from 'react';
import { Database, Search, FolderOpen, File, FileText, Trash2, RefreshCw } from 'lucide-react';
import useApi from '../hooks/useApi';

const DatabaseManager = () => {
    const [dbInfo, setDbInfo] = useState(null);
    const [sources, setSources] = useState([]);
    const [selectedSource, setSelectedSource] = useState(null);
    const [documents, setDocuments] = useState([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState([]);
    const { request, loading } = useApi();

    const loadDbInfo = async () => {
        try {
            const info = await request('/database/info');
            setDbInfo(info.data);
        } catch (error) {
            console.error('Failed to load database info:', error);
        }
    };

    const loadSources = async () => {
        try {
            const response = await request('/database/sources');
            setSources(response.data.sources);
        } catch (error) {
            console.error('Failed to load sources:', error);
        }
    };

    const loadDocuments = async (source) => {
        try {
            const response = await request(`/database/documents/${encodeURIComponent(source)}`);
            setDocuments(response.data.documents);
            setSelectedSource(source);
        } catch (error) {
            console.error('Failed to load documents:', error);
        }
    };

    const searchDocuments = async () => {
        if (!searchQuery.trim()) return;

        try {
            const response = await request(`/database/search?q=${encodeURIComponent(searchQuery)}&limit=10`);
            setSearchResults(response.data.results);
        } catch (error) {
            console.error('Search failed:', error);
        }
    };

    const deleteSource = async (source) => {
        if (!confirm(`Are you sure you want to delete all documents from "${source}"?`)) return;

        try {
            await request(`/database/source/${encodeURIComponent(source)}`, {
                method: 'DELETE',
            });
            loadSources();
            loadDbInfo();
            if (selectedSource === source) {
                setSelectedSource(null);
                setDocuments([]);
            }
        } catch (error) {
            console.error('Failed to delete source:', error);
        }
    };

    useEffect(() => {
        loadDbInfo();
        loadSources();
    }, []);

    return (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-full">
            {/* Database Info & Search */}
            <div className="space-y-6">
                {/* Database Info */}
                <div className="bg-white rounded-lg border border-gray-200 p-6">
                    <h3 className="text-lg font-semibold mb-4 flex items-center">
                        <Database className="mr-2" size={20} />
                        Database Info
                    </h3>
                    {dbInfo && (
                        <div className="space-y-3">
                            <div className="flex justify-between">
                                <span className="text-gray-600">Collection:</span>
                                <span className="font-medium">{dbInfo.name}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-gray-600">Documents:</span>
                                <span className="font-medium">{dbInfo.count}</span>
                            </div>
                            <button
                                onClick={() => { loadDbInfo(); loadSources(); }}
                                className="w-full mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center"
                            >
                                <RefreshCw size={16} className="mr-2" />
                                Refresh
                            </button>
                        </div>
                    )}
                </div>

                {/* Search */}
                <div className="bg-white rounded-lg border border-gray-200 p-6">
                    <h3 className="text-lg font-semibold mb-4 flex items-center">
                        <Search className="mr-2" size={20} />
                        Search Documents
                    </h3>
                    <div className="space-y-3">
                        <input
                            type="text"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            onKeyPress={(e) => e.key === 'Enter' && searchDocuments()}
                            placeholder="Search in documents..."
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                        />
                        <button
                            onClick={searchDocuments}
                            disabled={loading || !searchQuery.trim()}
                            className="w-full px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 transition-colors"
                        >
                            Search
                        </button>
                    </div>

                    {searchResults.length > 0 && (
                        <div className="mt-4 space-y-2 max-h-64 overflow-y-auto">
                            {searchResults.map((result, idx) => (
                                <div key={idx} className="p-3 bg-gray-50 rounded border">
                                    <div className="text-sm font-medium text-gray-800 mb-1">
                                        Similarity: {result.similarity}
                                    </div>
                                    <div className="text-xs text-gray-600 mb-2">
                                        Source: {result.metadata.source}
                                    </div>
                                    <div className="text-sm text-gray-700">
                                        {result.content}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {/* Sources List */}
            <div className="bg-white rounded-lg border border-gray-200 p-6">
                <h3 className="text-lg font-semibold mb-4 flex items-center">
                    <FolderOpen className="mr-2" size={20} />
                    Sources ({sources.length})
                </h3>
                <div className="space-y-2 max-h-96 overflow-y-auto">
                    {sources.map((source) => (
                        <div
                            key={source}
                            className={`p-3 rounded-lg border cursor-pointer transition-colors ${selectedSource === source
                                ? 'bg-blue-50 border-blue-200'
                                : 'bg-gray-50 border-gray-200 hover:bg-gray-100'
                                }`}
                            onClick={() => loadDocuments(source)}
                        >
                            <div className="flex items-center justify-between">
                                <div className="flex items-center space-x-2">
                                    <File size={16} className="text-gray-500" />
                                    <span className="text-sm font-medium truncate">{source}</span>
                                </div>
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        deleteSource(source);
                                    }}
                                    className="text-red-500 hover:text-red-700 p-1"
                                >
                                    <Trash2 size={14} />
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Documents Detail */}
            <div className="bg-white rounded-lg border border-gray-200 p-6">
                <h3 className="text-lg font-semibold mb-4 flex items-center">
                    <FileText className="mr-2" size={20} />
                    Documents
                </h3>
                {selectedSource ? (
                    <div>
                        <div className="mb-4 p-3 bg-blue-50 rounded-lg">
                            <div className="text-sm font-medium text-blue-800">Selected Source:</div>
                            <div className="text-sm text-blue-600">{selectedSource}</div>
                            <div className="text-xs text-blue-500 mt-1">
                                {documents.length} document chunks
                            </div>
                        </div>
                        <div className="space-y-3 max-h-96 overflow-y-auto">
                            {documents.map((doc, idx) => (
                                <div key={idx} className="p-3 bg-gray-50 rounded border">
                                    <div className="text-sm text-gray-700 mb-2">
                                        {doc.content}
                                    </div>
                                    <div className="text-xs text-gray-500">
                                        Length: {doc.contentLength} characters
                                    </div>
                                    {doc.metadata && (
                                        <div className="text-xs text-gray-400 mt-1">
                                            Type: {doc.metadata.type || 'unknown'}
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>
                ) : (
                    <div className="text-center text-gray-500 py-8">
                        <FileText size={48} className="mx-auto mb-4 text-gray-400" />
                        <p>Select a source to view documents</p>
                    </div>
                )}
            </div>
        </div>
    );
};
export default DatabaseManager;