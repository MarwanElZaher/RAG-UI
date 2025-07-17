import React, { useState, useEffect } from 'react';
import { Database, Search, FolderOpen, File, FileText, Trash2, RefreshCw, Map, Book, Layers, Code, BarChart3, Eye, Download, Filter } from 'lucide-react';
import useApi from '../hooks/useApi';

const DatabaseManager = () => {
    const [dbInfo, setDbInfo] = useState(null);
    const [sources, setSources] = useState([]);
    const [selectedSource, setSelectedSource] = useState(null);
    const [documents, setDocuments] = useState([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState([]);
    const [statistics, setStatistics] = useState(null);
    const [filters, setFilters] = useState({
        component: 'all',
        type: 'all',
        sortBy: 'relevance'
    });
    const [viewMode, setViewMode] = useState('list'); // 'list' | 'grid' | 'detailed'
    const { request, loading } = useApi();

    useEffect(() => {
        loadDbInfo();
        loadSources();
        loadStatistics();
    }, []);

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

    const loadStatistics = async () => {
        try {
            // This would be a new endpoint to get enhanced statistics
            const stats = {
                totalDocuments: dbInfo?.count || 0,
                byComponent: {
                    'ol-map': sources.filter(s => s.includes('ol-map')).length,
                    'ma-lib': sources.filter(s => s.includes('ma-lib')).length,
                    'plugin': sources.filter(s => s.includes('plugin')).length,
                    'other': sources.filter(s => !s.includes('ol-map') && !s.includes('ma-lib') && !s.includes('plugin')).length
                },
                byType: {
                    code: Math.floor(sources.length * 0.6),
                    documentation: Math.floor(sources.length * 0.25),
                    configuration: Math.floor(sources.length * 0.15)
                }
            };
            setStatistics(stats);
        } catch (error) {
            console.error('Failed to load statistics:', error);
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
            const limit = 20;
            const response = await request(`/database/search?q=${encodeURIComponent(searchQuery)}&limit=${limit}`);
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
            loadStatistics();
            if (selectedSource === source) {
                setSelectedSource(null);
                setDocuments([]);
            }
        } catch (error) {
            console.error('Failed to delete source:', error);
        }
    };

    const getSourceIcon = (source) => {
        if (source.includes('ol-map')) return Map;
        if (source.includes('ma-lib')) return Book;
        if (source.includes('plugin')) return Layers;
        return File;
    };

    const getSourceType = (source) => {
        if (source.includes('ol-map')) return 'ol-map';
        if (source.includes('ma-lib')) return 'ma-lib';
        if (source.includes('plugin')) return 'plugin';
        return 'other';
    };

    const getTypeColor = (type) => {
        const colors = {
            'ol-map': 'bg-purple-100 text-purple-800 border-purple-200',
            'ma-lib': 'bg-orange-100 text-orange-800 border-orange-200',
            'plugin': 'bg-blue-100 text-blue-800 border-blue-200',
            'other': 'bg-gray-100 text-gray-800 border-gray-200'
        };
        return colors[type] || colors.other;
    };

    const filteredSources = sources.filter(source => {
        if (filters.component !== 'all' && !source.includes(filters.component)) return false;
        if (filters.type !== 'all') {
            const sourceType = getSourceType(source);
            if (sourceType !== filters.type) return false;
        }
        return true;
    });

    const StatCard = ({ title, value, icon: Icon, color = 'blue', subtitle = '' }) => (
        <div className={`bg-${color}-50 border border-${color}-200 rounded-lg p-4`}>
            <div className="flex items-center justify-between">
                <div>
                    <p className={`text-${color}-600 text-sm font-medium`}>{title}</p>
                    <p className={`text-2xl font-bold text-${color}-900`}>{value}</p>
                    {subtitle && <p className={`text-xs text-${color}-500 mt-1`}>{subtitle}</p>}
                </div>
                <Icon className={`h-8 w-8 text-${color}-600`} />
            </div>
        </div>
    );

    const DocumentCard = ({ doc, index }) => (
        <div className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
            <div className="flex items-start justify-between mb-2">
                <h4 className="font-medium text-gray-900 text-sm truncate flex-1">
                    Chunk {doc.metadata?.chunkIndex + 1 || index + 1}
                </h4>
                <span className="text-xs text-gray-500 ml-2">
                    {doc.contentLength} chars
                </span>
            </div>
            <p className="text-sm text-gray-600 mb-3 line-clamp-3">
                {doc.content}
            </p>
            <div className="flex items-center justify-between text-xs text-gray-500">
                <span>Type: {doc.metadata?.type || 'unknown'}</span>
                {doc.metadata?.primaryFunction && (
                    <span>Fn: {doc.metadata.primaryFunction}</span>
                )}
            </div>
        </div>
    );

    return (
        <>
            {/* Header with Statistics */}
            <div className="bg-white rounded-lg border border-gray-200 p-6">
                <div className="flex items-center justify-between mb-6">
                    <h3 className="text-xl font-semibold flex items-center">
                        <Database className="mr-2" size={24} />
                        Penta-B Knowledge Base
                    </h3>
                    <button
                        onClick={() => { loadDbInfo(); loadSources(); loadStatistics(); }}
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center"
                    >
                        <RefreshCw size={16} className="mr-2" />
                        Refresh
                    </button>
                </div>

                {/* Statistics Grid */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                    <StatCard
                        title="Total Documents"
                        value={dbInfo?.count || 0}
                        icon={Database}
                        color="blue"
                        subtitle="Searchable chunks"
                    />
                    <StatCard
                        title="Ol-Map Components"
                        value={statistics?.byComponent['ol-map'] || 0}
                        icon={Map}
                        color="purple"
                        subtitle="Geospatial functionality"
                    />
                    <StatCard
                        title="Ma-Lib Components"
                        value={statistics?.byComponent['ma-lib'] || 0}
                        icon={Book}
                        color="orange"
                        subtitle="Form & UI library"
                    />
                    <StatCard
                        title="Plugin System"
                        value={statistics?.byComponent.plugin || 0}
                        icon={Layers}
                        color="green"
                        subtitle="Extensions & plugins"
                    />
                </div>

                {/* Search and Filters */}
                <div className="flex flex-col lg:flex-row gap-4">
                    <div className="flex-1 relative">
                        <input
                            type="text"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            onKeyPress={(e) => e.key === 'Enter' && searchDocuments()}
                            placeholder="Search across all Penta-B components and documentation..."
                            className="w-full px-4 py-3 pr-12 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                        />
                        <Search className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
                    </div>
                    <div className="flex gap-2">
                        <select
                            value={filters.component}
                            onChange={(e) => setFilters(prev => ({ ...prev, component: e.target.value }))}
                            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                        >
                            <option value="all">All Components</option>
                            <option value="ol-map">Ol-Map</option>
                            <option value="ma-lib">Ma-Lib</option>
                            <option value="plugin">Plugins</option>
                        </select>
                        <button
                            onClick={searchDocuments}
                            disabled={loading || !searchQuery.trim()}
                            className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 transition-colors"
                        >
                            Search
                        </button>
                    </div>
                </div>
            </div>

            <div className="flex-1 flex gap-6 min-h-0">
                {/* Sources Panel */}
                <div className="w-1/3 bg-white rounded-lg border border-gray-200 p-6 flex flex-col">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-lg font-semibold flex items-center">
                            <FolderOpen className="mr-2" size={20} />
                            Sources ({filteredSources.length})
                        </h3>
                        <div className="flex items-center space-x-2">
                            <Filter size={16} className="text-gray-400" />
                            <select
                                value={filters.type}
                                onChange={(e) => setFilters(prev => ({ ...prev, type: e.target.value }))}
                                className="text-sm border border-gray-300 rounded px-2 py-1"
                            >
                                <option value="all">All Types</option>
                                <option value="ol-map">Ol-Map</option>
                                <option value="ma-lib">Ma-Lib</option>
                                <option value="plugin">Plugins</option>
                                <option value="other">Other</option>
                            </select>
                        </div>
                    </div>

                    <div className="flex-1 overflow-y-auto space-y-2">
                        {filteredSources.map((source) => {
                            const Icon = getSourceIcon(source);
                            const sourceType = getSourceType(source);
                            const typeColor = getTypeColor(sourceType);

                            return (
                                <div
                                    key={source}
                                    className={`p-3 rounded-lg border cursor-pointer transition-all ${selectedSource === source
                                        ? 'bg-blue-50 border-blue-200 shadow-sm'
                                        : 'bg-gray-50 border-gray-200 hover:bg-gray-100'
                                        }`}
                                    onClick={() => loadDocuments(source)}
                                >
                                    <div className="flex items-center justify-between mb-2">
                                        <div className="flex items-center space-x-2 flex-1 min-w-0">
                                            <Icon size={16} className="text-gray-500 flex-shrink-0" />
                                            <span className="text-sm font-medium truncate" title={source}>
                                                {source.split('/').pop() || source}
                                            </span>
                                        </div>
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                deleteSource(source);
                                            }}
                                            className="text-red-500 hover:text-red-700 p-1 flex-shrink-0"
                                        >
                                            <Trash2 size={12} />
                                        </button>
                                    </div>
                                    <div className="flex items-center justify-between">
                                        <span className={`px-2 py-1 text-xs rounded-full border ${typeColor}`}>
                                            {sourceType}
                                        </span>
                                        <span className="text-xs text-gray-500 truncate ml-2">
                                            {source}
                                        </span>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* Content Panel */}
                <div className="flex-1 overflow-auto bg-white rounded-lg border border-gray-200 p-6 flex flex-col">
                    {/* Search Results */}
                    {searchResults.length > 0 && (
                        <div className="mb-6">
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="text-lg font-semibold flex items-center">
                                    <Search className="mr-2" size={20} />
                                    Search Results ({searchResults.length})
                                </h3>
                                <button
                                    onClick={() => setSearchResults([])}
                                    className="text-gray-500 hover:text-gray-700"
                                >
                                    Clear Results
                                </button>
                            </div>
                            <div className="space-y-3 max-h-80 overflow-y-auto">
                                {searchResults.map((result, idx) => {
                                    const Icon = getSourceIcon(result.metadata.source);
                                    const sourceType = getSourceType(result.metadata.source);

                                    return (
                                        <div key={idx} className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                                            <div className="flex items-start justify-between mb-2">
                                                <div className="flex items-center space-x-2">
                                                    <Icon size={16} className="text-gray-500 mt-0.5" />
                                                    <div>
                                                        <div className="text-sm font-medium text-gray-800">
                                                            {result.metadata.source?.split('/').pop() || 'Unknown'}
                                                        </div>
                                                        <div className="text-xs text-gray-500">
                                                            Similarity: {(result.similarity * 100).toFixed(1)}%
                                                        </div>
                                                    </div>
                                                </div>
                                                <span className={`px-2 py-1 text-xs rounded-full border ${getTypeColor(sourceType)}`}>
                                                    {sourceType}
                                                </span>
                                            </div>
                                            <div className="text-sm text-gray-700 mb-2 line-clamp-3">
                                                {result.content}
                                            </div>
                                            <div className="text-xs text-gray-500 truncate">
                                                Source: {result.metadata.source}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    )}

                    {/* Document Details */}
                    {selectedSource ? (
                        <div className="flex-1 flex flex-col">
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="text-lg font-semibold flex items-center">
                                    <FileText className="mr-2" size={20} />
                                    Document Chunks
                                </h3>
                                <div className="flex items-center space-x-2">
                                    <button
                                        onClick={() => setViewMode(viewMode === 'list' ? 'grid' : 'list')}
                                        className="p-2 text-gray-500 hover:text-gray-700 border border-gray-300 rounded"
                                        title={`Switch to ${viewMode === 'list' ? 'grid' : 'list'} view`}
                                    >
                                        {viewMode === 'list' ? <BarChart3 size={16} /> : <Eye size={16} />}
                                    </button>
                                    <span className="text-sm text-gray-600">
                                        {documents.length} chunks
                                    </span>
                                </div>
                            </div>

                            <div className="mb-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <div className="text-sm font-medium text-blue-800">Selected Source:</div>
                                        <div className="text-sm text-blue-600">{selectedSource}</div>
                                        <div className="text-xs text-blue-500 mt-1">
                                            {documents.length} document chunks • Total size: {
                                                documents.reduce((total, doc) => total + (doc.contentLength || 0), 0).toLocaleString()
                                            } characters
                                        </div>
                                    </div>
                                    <div className="flex items-center space-x-2">
                                        {getSourceIcon(selectedSource) &&
                                            React.createElement(getSourceIcon(selectedSource), {
                                                size: 24,
                                                className: "text-blue-600"
                                            })
                                        }
                                        <span className={`px-3 py-1 text-sm rounded-full border ${getTypeColor(getSourceType(selectedSource))}`}>
                                            {getSourceType(selectedSource)}
                                        </span>
                                    </div>
                                </div>
                            </div>

                            <div className="flex-1 overflow-y-auto">
                                {viewMode === 'grid' ? (
                                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                                        {documents.map((doc, idx) => (
                                            <DocumentCard key={idx} doc={doc} index={idx} />
                                        ))}
                                    </div>
                                ) : (
                                    <div className="space-y-3">
                                        {documents.map((doc, idx) => (
                                            <div key={idx} className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                                                <div className="flex items-center justify-between mb-2">
                                                    <div className="text-sm font-medium text-gray-800">
                                                        Chunk {doc.metadata?.chunkIndex + 1 || idx + 1} of {doc.metadata?.chunkCount || documents.length}
                                                    </div>
                                                    <div className="flex items-center space-x-2 text-xs text-gray-500">
                                                        <span>{doc.contentLength || doc.content?.length || 0} chars</span>
                                                        {doc.metadata?.type && (
                                                            <span className="px-2 py-1 bg-gray-200 rounded">
                                                                {doc.metadata.type}
                                                            </span>
                                                        )}
                                                    </div>
                                                </div>
                                                <div className="text-sm text-gray-700 mb-3">
                                                    {doc.content || 'No content available'}
                                                </div>
                                                {doc.metadata && (
                                                    <div className="flex flex-wrap gap-2 text-xs text-gray-500">
                                                        {doc.metadata.primaryFunction && (
                                                            <span className="px-2 py-1 bg-green-100 text-green-700 rounded">
                                                                Function: {doc.metadata.primaryFunction}
                                                            </span>
                                                        )}
                                                        {doc.metadata.primaryClass && (
                                                            <span className="px-2 py-1 bg-purple-100 text-purple-700 rounded">
                                                                Class: {doc.metadata.primaryClass}
                                                            </span>
                                                        )}
                                                        {doc.metadata.components && doc.metadata.components.length > 0 && (
                                                            <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded">
                                                                Components: {doc.metadata.components}
                                                            </span>
                                                        )}
                                                    </div>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                    ) : (
                        <div className="flex-1 flex items-center justify-center text-center text-gray-500 py-12">
                            <div>
                                <Database size={48} className="mx-auto mb-4 text-gray-400" />
                                <h3 className="text-lg font-medium text-gray-600 mb-2">
                                    Select a Source to View Documents
                                </h3>
                                <p className="text-sm text-gray-500 mb-4">
                                    Choose a source from the left panel to explore its document chunks,<br />
                                    or use the search functionality to find specific content.
                                </p>
                                <div className="text-xs text-gray-400 space-y-1">
                                    <div className="flex items-center justify-center space-x-2">
                                        <Map size={12} className="text-purple-600" />
                                        <span>Ol-Map: Geospatial components and utilities</span>
                                    </div>
                                    <div className="flex items-center justify-center space-x-2">
                                        <Book size={12} className="text-orange-600" />
                                        <span>Ma-Lib: Form components and UI library</span>
                                    </div>
                                    <div className="flex items-center justify-center space-x-2">
                                        <Layers size={12} className="text-blue-600" />
                                        <span>Plugins: Extensible system components</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Quick Actions Footer */}
            <div className="bg-white rounded-lg border border-gray-200 p-4">
                <div className="flex items-center justify-between">
                    <div className="text-sm text-gray-600">
                        Database contains {dbInfo?.count || 0} searchable documents across {sources.length} sources
                    </div>
                    <div className="flex items-center space-x-2">
                        <button
                            onClick={() => {
                                if (confirm('Export database statistics? This will download a JSON file.')) {
                                    const exportData = {
                                        timestamp: new Date().toISOString(),
                                        totalDocuments: dbInfo?.count || 0,
                                        totalSources: sources.length,
                                        statistics,
                                        sources: sources.map(source => ({
                                            source,
                                            type: getSourceType(source),
                                            components: source.includes('ol-map') ? ['ol-map'] :
                                                source.includes('ma-lib') ? ['ma-lib'] :
                                                    source.includes('plugin') ? ['plugin'] : ['other']
                                        }))
                                    };

                                    const blob = new Blob([JSON.stringify(exportData, null, 2)], {
                                        type: 'application/json'
                                    });
                                    const url = URL.createObjectURL(blob);
                                    const a = document.createElement('a');
                                    a.href = url;
                                    a.download = `penta-b-database-stats-${new Date().toISOString().split('T')[0]}.json`;
                                    document.body.appendChild(a);
                                    a.click();
                                    document.body.removeChild(a);
                                    URL.revokeObjectURL(url);
                                }
                            }}
                            className="px-3 py-2 text-sm bg-gray-600 text-white rounded hover:bg-gray-700 transition-colors flex items-center"
                        >
                            <Download size={14} className="mr-1" />
                            Export Stats
                        </button>
                        <button
                            onClick={() => {
                                if (confirm('Clear all database content? This cannot be undone.')) {
                                    request('/database/clear', { method: 'DELETE' }).then(() => {
                                        loadDbInfo();
                                        loadSources();
                                        loadStatistics();
                                        setSelectedSource(null);
                                        setDocuments([]);
                                        setSearchResults([]);
                                    });
                                }
                            }}
                            className="px-3 py-2 text-sm bg-red-600 text-white rounded hover:bg-red-700 transition-colors flex items-center"
                        >
                            <Trash2 size={14} className="mr-1" />
                            Clear All
                        </button>
                    </div>
                </div>
            </div>
        </>
    );
};

export default DatabaseManager;