import React, { useState, useEffect } from 'react';
import { Upload, File, FolderOpen, Trash2, RefreshCw, CheckCircle, AlertCircle, Play, Pause, FileText, Database, Code, Map, Book } from 'lucide-react';
import useApi from '../hooks/useApi';

const IngestionManager = () => {
    const [uploadStatus, setUploadStatus] = useState(null);
    const [filePath, setFilePath] = useState('');
    const [dirPath, setDirPath] = useState('');
    const [recursive, setRecursive] = useState(false);
    const [dbInfo, setDbInfo] = useState(null);
    const [sources, setSources] = useState([]);
    const [selectedFiles, setSelectedFiles] = useState([]);
    const [bulkOperationMode, setBulkOperationMode] = useState(false);
    const [ingestionProgress, setIngestionProgress] = useState(null);
    const { request, loading } = useApi();

    useEffect(() => {
        loadDbInfo();
        loadSources();
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

    const triggerIngestion = async (type, payload = {}) => {
        try {
            setUploadStatus({ type: 'loading', message: 'Processing...' });
            setIngestionProgress({ current: 0, total: 100, stage: 'Initializing...' });

            const response = await request(`/ingest/${type}`, {
                method: 'POST',
                body: JSON.stringify(payload),
            });

            setUploadStatus({
                type: 'success',
                message: `Successfully processed ${response.data.documentsProcessed} documents`,
                details: response.data,
            });

            // Refresh database info after successful ingestion
            loadDbInfo();
            loadSources();
        } catch (error) {
            setUploadStatus({
                type: 'error',
                message: error.message,
            });
        } finally {
            setIngestionProgress(null);
        }
    };

    const handleBulkFileIngestion = async () => {
        if (selectedFiles.length === 0) return;

        setUploadStatus({ type: 'loading', message: `Processing ${selectedFiles.length} files...` });

        let successCount = 0;
        let errorCount = 0;

        for (let i = 0; i < selectedFiles.length; i++) {
            const file = selectedFiles[i];
            setIngestionProgress({
                current: i + 1,
                total: selectedFiles.length,
                stage: `Processing: ${file}`
            });

            try {
                await triggerIngestion('file', { filePath: file });
                successCount++;
            } catch (error) {
                errorCount++;
                console.error(`Failed to process ${file}:`, error);
            }
        }

        setUploadStatus({
            type: successCount > 0 ? 'success' : 'error',
            message: `Processed ${successCount} files successfully, ${errorCount} failed`,
        });

        setSelectedFiles([]);
        setBulkOperationMode(false);
        setIngestionProgress(null);
    };

    const StatusAlert = ({ status }) => {
        if (!status) return null;

        const icons = {
            loading: RefreshCw,
            success: CheckCircle,
            error: AlertCircle,
        };

        const colors = {
            loading: 'bg-blue-50 border-blue-200 text-blue-800',
            success: 'bg-green-50 border-green-200 text-green-800',
            error: 'bg-red-50 border-red-200 text-red-800',
        };

        const Icon = icons[status.type];

        return (
            <div className={`p-4 rounded-lg border ${colors[status.type]} mb-6`}>
                <div className="flex items-start space-x-3">
                    <Icon size={20} className={status.type === 'loading' ? 'animate-spin' : ''} />
                    <div className="flex-1">
                        <div className="font-medium">{status.message}</div>
                        {status.details && (
                            <div className="text-sm mt-2">
                                <div>Documents: {status.details.documentsProcessed}</div>
                                <div>Success: {status.details.success ? 'Yes' : 'No'}</div>
                                {status.details.errors?.length > 0 && (
                                    <div className="mt-2">
                                        <div className="font-medium">Errors:</div>
                                        <ul className="list-disc list-inside">
                                            {status.details.errors.slice(0, 3).map((error, idx) => (
                                                <li key={idx} className="text-xs">{error}</li>
                                            ))}
                                            {status.details.errors.length > 3 && (
                                                <li className="text-xs">... and {status.details.errors.length - 3} more</li>
                                            )}
                                        </ul>
                                    </div>
                                )}
                            </div>
                        )}
                        {ingestionProgress && (
                            <div className="mt-3">
                                <div className="text-sm font-medium mb-1">
                                    {ingestionProgress.stage} ({ingestionProgress.current}/{ingestionProgress.total})
                                </div>
                                <div className="w-full bg-gray-200 rounded-full h-2">
                                    <div
                                        className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                                        style={{ width: `${(ingestionProgress.current / ingestionProgress.total) * 100}%` }}
                                    ></div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        );
    };

    const FileTypeIcon = ({ type }) => {
        const iconMap = {
            'ol-map': Map,
            'ma-lib': Book,
            'code': Code,
            'docs': FileText,
            'plugin': Database,
        };

        const Icon = iconMap[type] || File;
        return <Icon size={16} className="text-gray-500" />;
    };

    const getSourceType = (source) => {
        if (source.includes('ol-map')) return 'ol-map';
        if (source.includes('ma-lib')) return 'ma-lib';
        if (source.includes('.js') || source.includes('.ts')) return 'code';
        if (source.includes('plugin')) return 'plugin';
        return 'docs';
    };

    const presetPaths = [
        { label: 'Ol-Map Documentation', path: './data/ol-map/', type: 'ol-map' },
        { label: 'Ma-Lib Components', path: './data/ma-lib/', type: 'ma-lib' },
        { label: 'Plugin Examples', path: './data/plugins/', type: 'plugin' },
        { label: 'General Documentation', path: './data/docs/', type: 'docs' },
        { label: 'Source Code', path: './data/src/', type: 'code' },
    ];

    return (
        <div className="max-w-6xl mx-auto space-y-6">
            <StatusAlert status={uploadStatus} />

            {/* Database Status Dashboard */}
            <div className="bg-white rounded-lg border border-gray-200 p-6">
                <h3 className="text-lg font-semibold mb-4 flex items-center">
                    <Database className="mr-2" size={20} />
                    Database Status
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div className="bg-blue-50 p-4 rounded-lg">
                        <div className="text-2xl font-bold text-blue-600">{dbInfo?.count || 0}</div>
                        <div className="text-sm text-blue-600">Total Documents</div>
                    </div>
                    <div className="bg-green-50 p-4 rounded-lg">
                        <div className="text-2xl font-bold text-green-600">{sources.length}</div>
                        <div className="text-sm text-green-600">Unique Sources</div>
                    </div>
                    <div className="bg-purple-50 p-4 rounded-lg">
                        <div className="text-2xl font-bold text-purple-600">
                            {sources.filter(s => getSourceType(s) === 'ol-map').length}
                        </div>
                        <div className="text-sm text-purple-600">Ol-Map Docs</div>
                    </div>
                    <div className="bg-orange-50 p-4 rounded-lg">
                        <div className="text-2xl font-bold text-orange-600">
                            {sources.filter(s => getSourceType(s) === 'ma-lib').length}
                        </div>
                        <div className="text-sm text-orange-600">Ma-Lib Components</div>
                    </div>
                </div>
                <button
                    onClick={() => { loadDbInfo(); loadSources(); }}
                    className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center"
                >
                    <RefreshCw size={16} className="mr-2" />
                    Refresh Status
                </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Quick Actions with Penta-B Presets */}
                <div className="bg-white rounded-lg border border-gray-200 p-6">
                    <h3 className="text-lg font-semibold mb-4 flex items-center">
                        <Upload className="mr-2" size={20} />
                        Quick Actions
                    </h3>
                    <div className="space-y-3">
                        <button
                            onClick={() => triggerIngestion('all')}
                            disabled={loading}
                            className="w-full px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors flex items-center justify-center"
                        >
                            <Database className="mr-2" size={16} />
                            Ingest All Data Sources
                        </button>
                        <button
                            onClick={() => triggerIngestion('incremental')}
                            disabled={loading}
                            className="w-full px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 transition-colors flex items-center justify-center"
                        >
                            <RefreshCw className="mr-2" size={16} />
                            Incremental Update
                        </button>
                        <button
                            onClick={() => triggerIngestion('local')}
                            disabled={loading}
                            className="w-full px-4 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 transition-colors flex items-center justify-center"
                        >
                            <File className="mr-2" size={16} />
                            Local Documents Only
                        </button>
                    </div>
                </div>

                {/* Preset Paths for Penta-B Components */}
                <div className="bg-white rounded-lg border border-gray-200 p-6">
                    <h3 className="text-lg font-semibold mb-4 flex items-center">
                        <Book className="mr-2" size={20} />
                        Penta-B Component Presets
                    </h3>
                    <div className="space-y-2">
                        {presetPaths.map((preset, index) => (
                            <button
                                key={index}
                                onClick={() => triggerIngestion('directory', {
                                    dirPath: preset.path,
                                    recursive: true
                                })}
                                disabled={loading}
                                className="w-full px-4 py-2 text-left bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors flex items-center disabled:opacity-50"
                            >
                                <FileTypeIcon type={preset.type} />
                                <span className="ml-2 flex-1">{preset.label}</span>
                                <span className="text-xs text-gray-500">{preset.path}</span>
                            </button>
                        ))}
                    </div>
                </div>

                {/* Enhanced File Ingestion */}
                <div className="bg-white rounded-lg border border-gray-200 p-6">
                    <h3 className="text-lg font-semibold mb-4 flex items-center">
                        <File className="mr-2" size={20} />
                        Single File Ingestion
                    </h3>
                    <div className="space-y-3">
                        <input
                            type="text"
                            value={filePath}
                            onChange={(e) => setFilePath(e.target.value)}
                            placeholder="./data/ol-map/MapWrapper.js"
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                        />
                        <div className="flex gap-2">
                            <button
                                onClick={() => triggerIngestion('file', { filePath })}
                                disabled={loading || !filePath.trim()}
                                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
                            >
                                Ingest File
                            </button>
                            <button
                                onClick={() => setBulkOperationMode(!bulkOperationMode)}
                                className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
                            >
                                {bulkOperationMode ? <Pause size={16} /> : <Play size={16} />}
                            </button>
                        </div>

                        {bulkOperationMode && (
                            <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                                <h4 className="font-medium mb-2">Bulk File Selection</h4>
                                <textarea
                                    value={selectedFiles.join('\n')}
                                    onChange={(e) => setSelectedFiles(e.target.value.split('\n').filter(f => f.trim()))}
                                    placeholder="./data/ol-map/file1.js&#10;./data/ma-lib/component1.ts&#10;./data/plugins/example.js"
                                    className="w-full h-32 px-3 py-2 border border-gray-300 rounded-lg resize-none"
                                />
                                <button
                                    onClick={handleBulkFileIngestion}
                                    disabled={loading || selectedFiles.length === 0}
                                    className="mt-2 w-full px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 transition-colors"
                                >
                                    Process {selectedFiles.length} Files
                                </button>
                            </div>
                        )}
                    </div>
                </div>

                {/* Enhanced Directory Ingestion */}
                <div className="bg-white rounded-lg border border-gray-200 p-6">
                    <h3 className="text-lg font-semibold mb-4 flex items-center">
                        <FolderOpen className="mr-2" size={20} />
                        Directory Ingestion
                    </h3>
                    <div className="space-y-3">
                        <input
                            type="text"
                            value={dirPath}
                            onChange={(e) => setDirPath(e.target.value)}
                            placeholder="./data/ol-map"
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                        />
                        <div className="flex items-center space-x-4">
                            <label className="flex items-center space-x-2">
                                <input
                                    type="checkbox"
                                    checked={recursive}
                                    onChange={(e) => setRecursive(e.target.checked)}
                                    className="rounded"
                                />
                                <span className="text-sm">Include subdirectories</span>
                            </label>
                        </div>
                        <button
                            onClick={() => triggerIngestion('directory', { dirPath, recursive })}
                            disabled={loading || !dirPath.trim()}
                            className="w-full px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 transition-colors"
                        >
                            Ingest Directory
                        </button>
                    </div>
                </div>
            </div>

            {/* Enhanced Source Management */}
            <div className="bg-white rounded-lg border border-gray-200 p-6">
                <h3 className="text-lg font-semibold mb-4 flex items-center">
                    <Database className="mr-2" size={20} />
                    Ingested Sources ({sources.length})
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 max-h-96 overflow-y-auto">
                    {sources.map((source, index) => {
                        const sourceType = getSourceType(source);
                        return (
                            <div
                                key={index}
                                className="p-3 bg-gray-50 rounded-lg border border-gray-200 hover:bg-gray-100 transition-colors"
                            >
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center space-x-2 flex-1 min-w-0">
                                        <FileTypeIcon type={sourceType} />
                                        <span className="text-sm font-medium truncate" title={source}>
                                            {source.split('/').pop() || source}
                                        </span>
                                    </div>
                                    <div className="flex items-center space-x-1">
                                        <span className={`px-2 py-1 text-xs rounded-full ${sourceType === 'ol-map' ? 'bg-purple-100 text-purple-600' :
                                            sourceType === 'ma-lib' ? 'bg-orange-100 text-orange-600' :
                                                sourceType === 'plugin' ? 'bg-blue-100 text-blue-600' :
                                                    sourceType === 'code' ? 'bg-green-100 text-green-600' :
                                                        'bg-gray-100 text-gray-600'
                                            }`}>
                                            {sourceType}
                                        </span>
                                        <button
                                            onClick={async () => {
                                                if (confirm(`Delete all documents from "${source}"?`)) {
                                                    try {
                                                        await request(`/database/source/${encodeURIComponent(source)}`, {
                                                            method: 'DELETE',
                                                        });
                                                        loadSources();
                                                        loadDbInfo();
                                                    } catch (error) {
                                                        console.error('Failed to delete source:', error);
                                                    }
                                                }
                                            }}
                                            className="text-red-500 hover:text-red-700 p-1"
                                        >
                                            <Trash2 size={12} />
                                        </button>
                                    </div>
                                </div>
                                <div className="text-xs text-gray-500 mt-1 truncate">
                                    {source}
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* Cleanup Operations */}
            <div className="bg-white rounded-lg border border-gray-200 p-6">
                <h3 className="text-lg font-semibold mb-4 flex items-center">
                    <Trash2 className="mr-2" size={20} />
                    Cleanup Operations
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="p-4 bg-orange-50 rounded-lg">
                        <h4 className="font-medium text-orange-800 mb-2">Cleanup Orphaned</h4>
                        <p className="text-sm text-orange-600 mb-3">
                            Remove documents that no longer exist in filesystem.
                        </p>
                        <button
                            onClick={() => request('/cleanup/orphaned', { method: 'POST' }).then(response =>
                                setUploadStatus({
                                    type: 'success',
                                    message: `Cleaned up ${response.data.documentsProcessed} orphaned documents`,
                                    details: response.data,
                                })
                            )}
                            disabled={loading}
                            className="w-full px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 disabled:opacity-50 transition-colors"
                        >
                            Cleanup Orphaned
                        </button>
                    </div>

                    <div className="p-4 bg-red-50 rounded-lg">
                        <h4 className="font-medium text-red-800 mb-2">Clear All</h4>
                        <p className="text-sm text-red-600 mb-3">
                            Remove all documents from the database.
                        </p>
                        <button
                            onClick={() => {
                                if (confirm('Are you sure you want to clear ALL documents? This cannot be undone.')) {
                                    request('/database/clear', { method: 'DELETE' }).then(() => {
                                        setUploadStatus({
                                            type: 'success',
                                            message: 'Database cleared successfully',
                                        });
                                        loadDbInfo();
                                        loadSources();
                                    });
                                }
                            }}
                            disabled={loading}
                            className="w-full px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 transition-colors"
                        >
                            Clear All
                        </button>
                    </div>

                    <div className="p-4 bg-blue-50 rounded-lg">
                        <h4 className="font-medium text-blue-800 mb-2">Rebuild Index</h4>
                        <p className="text-sm text-blue-600 mb-3">
                            Force re-ingestion of all data sources.
                        </p>
                        <button
                            onClick={() => {
                                if (confirm('Rebuild the entire index? This may take several minutes.')) {
                                    triggerIngestion('all', { forceUpdate: true });
                                }
                            }}
                            disabled={loading}
                            className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
                        >
                            Rebuild Index
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default IngestionManager;