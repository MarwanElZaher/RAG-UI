import React, { useState } from 'react';
import { Upload, File, FolderOpen, Trash2, RefreshCw, CheckCircle, AlertCircle } from 'lucide-react';
import useApi from '../hooks/useApi';

const IngestionManager = () => {
    const [uploadStatus, setUploadStatus] = useState(null);
    const [filePath, setFilePath] = useState('');
    const [dirPath, setDirPath] = useState('');
    const [recursive, setRecursive] = useState(false);
    const { request, loading } = useApi();

    const triggerIngestion = async (type, payload = {}) => {
        try {
            setUploadStatus({ type: 'loading', message: 'Processing...' });

            const response = await request(`/ingest/${type}`, {
                method: 'POST',
                body: JSON.stringify(payload),
            });

            setUploadStatus({
                type: 'success',
                message: `Successfully processed ${response.data.documentsProcessed} documents`,
                details: response.data,
            });
        } catch (error) {
            setUploadStatus({
                type: 'error',
                message: error.message,
            });
        }
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
                    <Icon
                        size={20}
                        className={status.type === 'loading' ? 'animate-spin' : ''}
                    />
                    <div>
                        <div className="font-medium">{status.message}</div>
                        {status.details && (
                            <div className="text-sm mt-2">
                                <div>Documents: {status.details.documentsProcessed}</div>
                                <div>Success: {status.details.success ? 'Yes' : 'No'}</div>
                                {status.details.errors?.length > 0 && (
                                    <div className="mt-2">
                                        <div className="font-medium">Errors:</div>
                                        <ul className="list-disc list-inside">
                                            {status.details.errors.map((error, idx) => (
                                                <li key={idx} className="text-xs">{error}</li>
                                            ))}
                                        </ul>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        );
    };

    return (
        <div className="max-w-4xl mx-auto space-y-6">
            <StatusAlert status={uploadStatus} />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Quick Actions */}
                <div className="bg-white rounded-lg border border-gray-200 p-6">
                    <h3 className="text-lg font-semibold mb-4 flex items-center">
                        <Upload className="mr-2" size={20} />
                        Quick Actions
                    </h3>
                    <div className="space-y-3">
                        <button
                            onClick={() => triggerIngestion('all')}
                            disabled={loading}
                            className="w-full px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
                        >
                            Ingest All Data
                        </button>
                        <button
                            onClick={() => triggerIngestion('incremental')}
                            disabled={loading}
                            className="w-full px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 transition-colors"
                        >
                            Incremental Update
                        </button>
                        <button
                            onClick={() => triggerIngestion('local')}
                            disabled={loading}
                            className="w-full px-4 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 transition-colors"
                        >
                            Local Documents Only
                        </button>
                    </div>
                </div>

                {/* File Ingestion */}
                <div className="bg-white rounded-lg border border-gray-200 p-6">
                    <h3 className="text-lg font-semibold mb-4 flex items-center">
                        <File className="mr-2" size={20} />
                        Single File
                    </h3>
                    <div className="space-y-3">
                        <input
                            type="text"
                            value={filePath}
                            onChange={(e) => setFilePath(e.target.value)}
                            placeholder="./docs/readme.md"
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                        />
                        <button
                            onClick={() => triggerIngestion('file', { filePath })}
                            disabled={loading || !filePath.trim()}
                            className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
                        >
                            Ingest File
                        </button>
                    </div>
                </div>

                {/* Directory Ingestion */}
                <div className="bg-white rounded-lg border border-gray-200 p-6">
                    <h3 className="text-lg font-semibold mb-4 flex items-center">
                        <FolderOpen className="mr-2" size={20} />
                        Directory
                    </h3>
                    <div className="space-y-3">
                        <input
                            type="text"
                            value={dirPath}
                            onChange={(e) => setDirPath(e.target.value)}
                            placeholder="./docs"
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                        />
                        <label className="flex items-center space-x-2">
                            <input
                                type="checkbox"
                                checked={recursive}
                                onChange={(e) => setRecursive(e.target.checked)}
                                className="rounded"
                            />
                            <span className="text-sm">Include subdirectories</span>
                        </label>
                        <button
                            onClick={() => triggerIngestion('directory', { dirPath, recursive })}
                            disabled={loading || !dirPath.trim()}
                            className="w-full px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 transition-colors"
                        >
                            Ingest Directory
                        </button>
                    </div>
                </div>

                {/* Cleanup */}
                <div className="bg-white rounded-lg border border-gray-200 p-6">
                    <h3 className="text-lg font-semibold mb-4 flex items-center">
                        <Trash2 className="mr-2" size={20} />
                        Cleanup
                    </h3>
                    <div className="space-y-3">
                        <p className="text-sm text-gray-600">
                            Remove orphaned documents that no longer exist in the filesystem.
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
                </div>
            </div>
        </div>
    );
};

export default IngestionManager;