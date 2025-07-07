import React, { useState, useEffect } from 'react';
import { Settings, Brain, Clock, Database, Trash2, Download, Upload, RefreshCw, AlertTriangle, CheckCircle, Info } from 'lucide-react';

const MemorySettings = () => {
    const [config, setConfig] = useState({
        maxConversations: 50,
        maxMessagesPerConversation: 30,
        maxContextLength: 6000,
        memoryRetentionHours: 24,
        autoCleanupEnabled: true,
        cleanupThresholdDays: 30,
        compressionEnabled: true,
        compressionThreshold: 10
    });

    const [stats, setStats] = useState({
        totalConversations: 0,
        totalMessages: 0,
        oldestConversation: null,
        newestConversation: null,
        memoryUsageEstimate: 0,
        avgMessagesPerConv: 0
    });

    const [unsavedChanges, setUnsavedChanges] = useState(false);
    const [loading, setLoading] = useState(false);
    const [lastSaved, setLastSaved] = useState(null);
    const [showAdvanced, setShowAdvanced] = useState(false);

    useEffect(() => {
        loadCurrentConfig();
        loadMemoryStats();
    }, []);

    const loadCurrentConfig = async () => {
        try {
            // Load from localStorage for now (in real app, this would be an API call)
            const savedConfig = localStorage.getItem('memoryConfig');
            if (savedConfig) {
                setConfig(JSON.parse(savedConfig));
            }

            const lastSavedTime = localStorage.getItem('memoryConfigLastSaved');
            if (lastSavedTime) {
                setLastSaved(new Date(lastSavedTime));
            }
        } catch (error) {
            console.error('Failed to load memory configuration:', error);
        }
    };

    const loadMemoryStats = async () => {
        try {
            const response = await fetch('/api/memory/conversations');
            const data = await response.json();

            if (data.success) {
                const conversations = data.data.conversations || [];
                const totalMessages = conversations.reduce((sum, conv) => sum + conv.summary.messageCount, 0);

                // Calculate memory usage estimate (rough approximation)
                const avgMessageSize = 200; // bytes
                const avgMetadataSize = 100; // bytes
                const memoryUsageEstimate = totalMessages * (avgMessageSize + avgMetadataSize);

                const dates = conversations.map(conv => new Date(conv.summary.lastUpdated));
                const oldest = dates.length > 0 ? new Date(Math.min(...dates)) : null;
                const newest = dates.length > 0 ? new Date(Math.max(...dates)) : null;

                setStats({
                    totalConversations: conversations.length,
                    totalMessages,
                    oldestConversation: oldest,
                    newestConversation: newest,
                    memoryUsageEstimate,
                    avgMessagesPerConv: conversations.length > 0 ? totalMessages / conversations.length : 0
                });
            }
        } catch (error) {
            console.error('Failed to load memory stats:', error);
        }
    };

    const handleConfigChange = (key, value) => {
        setConfig(prev => ({
            ...prev,
            [key]: value
        }));
        setUnsavedChanges(true);
    };

    const saveConfiguration = async () => {
        setLoading(true);
        try {
            // Save to localStorage for now (in real app, this would be an API call)
            localStorage.setItem('memoryConfig', JSON.stringify(config));
            localStorage.setItem('memoryConfigLastSaved', new Date().toISOString());

            setUnsavedChanges(false);
            setLastSaved(new Date());

            // In a real app, you'd send this to the server:
            // await fetch('/api/memory/config', {
            //     method: 'PUT',
            //     headers: { 'Content-Type': 'application/json' },
            //     body: JSON.stringify(config)
            // });

        } catch (error) {
            console.error('Failed to save configuration:', error);
            alert('Failed to save configuration');
        } finally {
            setLoading(false);
        }
    };

    const resetToDefaults = () => {
        if (confirm('Reset all settings to default values?')) {
            setConfig({
                maxConversations: 50,
                maxMessagesPerConversation: 30,
                maxContextLength: 6000,
                memoryRetentionHours: 24,
                autoCleanupEnabled: true,
                cleanupThresholdDays: 30,
                compressionEnabled: true,
                compressionThreshold: 10
            });
            setUnsavedChanges(true);
        }
    };

    const exportConfiguration = () => {
        const exportData = {
            timestamp: new Date().toISOString(),
            version: '1.0.0',
            config,
            stats
        };

        const blob = new Blob([JSON.stringify(exportData, null, 2)], {
            type: 'application/json'
        });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `memory-config-${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    };

    const importConfiguration = (event) => {
        const file = event.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (e) => {
                try {
                    const importData = JSON.parse(e.target.result);
                    if (importData.config) {
                        setConfig(importData.config);
                        setUnsavedChanges(true);
                    }
                } catch (error) {
                    alert('Invalid configuration file');
                }
            };
            reader.readAsText(file);
        }
    };

    const runCleanup = async () => {
        if (confirm('Run memory cleanup now? This will remove old conversations based on your settings.')) {
            setLoading(true);
            try {
                // Simulate cleanup (in real app, this would be an API call)
                const cutoffDate = new Date(Date.now() - config.cleanupThresholdDays * 24 * 60 * 60 * 1000);
                console.log('Would cleanup conversations older than:', cutoffDate);

                // Refresh stats after cleanup
                await loadMemoryStats();
                alert('Memory cleanup completed');
            } catch (error) {
                console.error('Cleanup failed:', error);
                alert('Cleanup failed');
            } finally {
                setLoading(false);
            }
        }
    };

    const optimizeMemory = async () => {
        if (confirm('Optimize memory usage? This will compress old conversations and remove redundant data.')) {
            setLoading(true);
            try {
                // Simulate optimization
                console.log('Would compress conversations older than', config.compressionThreshold, 'days');

                await loadMemoryStats();
                alert('Memory optimization completed');
            } catch (error) {
                console.error('Optimization failed:', error);
                alert('Optimization failed');
            } finally {
                setLoading(false);
            }
        }
    };

    const formatBytes = (bytes) => {
        if (bytes === 0) return '0 B';
        const k = 1024;
        const sizes = ['B', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    };

    const formatDuration = (hours) => {
        if (hours < 24) return `${hours} hours`;
        if (hours < 24 * 7) return `${Math.round(hours / 24)} days`;
        return `${Math.round(hours / (24 * 7))} weeks`;
    };

    return (
        <div className="p-6 space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                    <Settings size={32} className="text-blue-600" />
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900">Memory Configuration</h1>
                        <p className="text-gray-600">Configure conversation memory buffer settings</p>
                    </div>
                </div>
                <div className="flex items-center space-x-2">
                    {unsavedChanges && (
                        <div className="flex items-center space-x-1 text-orange-600 text-sm">
                            <AlertTriangle size={16} />
                            <span>Unsaved changes</span>
                        </div>
                    )}
                    {lastSaved && (
                        <div className="text-xs text-gray-500">
                            Last saved: {lastSaved.toLocaleString()}
                        </div>
                    )}
                </div>
            </div>

            {/* Memory Statistics */}
            <div className="bg-white rounded-lg border border-gray-200 p-6">
                <h3 className="text-lg font-semibold mb-4 flex items-center">
                    <Database className="mr-2" size={20} />
                    Current Memory Usage
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div className="bg-blue-50 p-4 rounded-lg">
                        <div className="text-2xl font-bold text-blue-600">{stats.totalConversations}</div>
                        <div className="text-sm text-blue-600">Total Conversations</div>
                    </div>
                    <div className="bg-green-50 p-4 rounded-lg">
                        <div className="text-2xl font-bold text-green-600">{stats.totalMessages}</div>
                        <div className="text-sm text-green-600">Total Messages</div>
                    </div>
                    <div className="bg-purple-50 p-4 rounded-lg">
                        <div className="text-2xl font-bold text-purple-600">
                            {formatBytes(stats.memoryUsageEstimate)}
                        </div>
                        <div className="text-sm text-purple-600">Estimated Usage</div>
                    </div>
                    <div className="bg-orange-50 p-4 rounded-lg">
                        <div className="text-2xl font-bold text-orange-600">
                            {stats.avgMessagesPerConv.toFixed(1)}
                        </div>
                        <div className="text-sm text-orange-600">Avg Messages/Conv</div>
                    </div>
                </div>

                {stats.oldestConversation && (
                    <div className="mt-4 text-sm text-gray-600">
                        <div>Oldest conversation: {stats.oldestConversation.toLocaleDateString()}</div>
                        <div>Newest conversation: {stats.newestConversation.toLocaleDateString()}</div>
                    </div>
                )}
            </div>

            {/* Configuration Settings */}
            <div className="bg-white rounded-lg border border-gray-200 p-6">
                <h3 className="text-lg font-semibold mb-4 flex items-center">
                    <Brain className="mr-2" size={20} />
                    Memory Buffer Settings
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Basic Settings */}
                    <div className="space-y-4">
                        <h4 className="font-medium text-gray-900">Basic Configuration</h4>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Maximum Conversations
                            </label>
                            <input
                                type="number"
                                min="10"
                                max="1000"
                                value={config.maxConversations}
                                onChange={(e) => handleConfigChange('maxConversations', parseInt(e.target.value))}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                            />
                            <p className="text-xs text-gray-500 mt-1">
                                Maximum number of conversations to keep in memory
                            </p>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Messages per Conversation
                            </label>
                            <input
                                type="number"
                                min="5"
                                max="100"
                                value={config.maxMessagesPerConversation}
                                onChange={(e) => handleConfigChange('maxMessagesPerConversation', parseInt(e.target.value))}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                            />
                            <p className="text-xs text-gray-500 mt-1">
                                Maximum messages to keep per conversation
                            </p>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Context Length Limit
                            </label>
                            <input
                                type="number"
                                min="1000"
                                max="20000"
                                step="500"
                                value={config.maxContextLength}
                                onChange={(e) => handleConfigChange('maxContextLength', parseInt(e.target.value))}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                            />
                            <p className="text-xs text-gray-500 mt-1">
                                Maximum characters in conversation context
                            </p>
                        </div>
                    </div>

                    {/* Retention Settings */}
                    <div className="space-y-4">
                        <h4 className="font-medium text-gray-900">Retention & Cleanup</h4>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Memory Retention ({formatDuration(config.memoryRetentionHours)})
                            </label>
                            <input
                                type="range"
                                min="1"
                                max="168"
                                value={config.memoryRetentionHours}
                                onChange={(e) => handleConfigChange('memoryRetentionHours', parseInt(e.target.value))}
                                className="w-full"
                            />
                            <div className="flex justify-between text-xs text-gray-500 mt-1">
                                <span>1 hour</span>
                                <span>1 week</span>
                            </div>
                            <p className="text-xs text-gray-500 mt-1">
                                How long to keep conversations in active memory
                            </p>
                        </div>

                        <div className="flex items-center space-x-3">
                            <input
                                type="checkbox"
                                id="autoCleanup"
                                checked={config.autoCleanupEnabled}
                                onChange={(e) => handleConfigChange('autoCleanupEnabled', e.target.checked)}
                                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                            />
                            <label htmlFor="autoCleanup" className="text-sm font-medium text-gray-700">
                                Enable Automatic Cleanup
                            </label>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Cleanup Threshold (Days)
                            </label>
                            <input
                                type="number"
                                min="1"
                                max="365"
                                value={config.cleanupThresholdDays}
                                onChange={(e) => handleConfigChange('cleanupThresholdDays', parseInt(e.target.value))}
                                disabled={!config.autoCleanupEnabled}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
                            />
                            <p className="text-xs text-gray-500 mt-1">
                                Automatically delete conversations older than this
                            </p>
                        </div>
                    </div>
                </div>

                {/* Advanced Settings */}
                <div className="mt-6 pt-6 border-t border-gray-200">
                    <button
                        onClick={() => setShowAdvanced(!showAdvanced)}
                        className="flex items-center space-x-2 text-blue-600 hover:text-blue-800"
                    >
                        <span>Advanced Settings</span>
                        <span>{showAdvanced ? '▲' : '▼'}</span>
                    </button>

                    {showAdvanced && (
                        <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-4">
                                <h4 className="font-medium text-gray-900">Performance Optimization</h4>

                                <div className="flex items-center space-x-3">
                                    <input
                                        type="checkbox"
                                        id="compression"
                                        checked={config.compressionEnabled}
                                        onChange={(e) => handleConfigChange('compressionEnabled', e.target.checked)}
                                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                    />
                                    <label htmlFor="compression" className="text-sm font-medium text-gray-700">
                                        Enable Memory Compression
                                    </label>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Compression Threshold (Days)
                                    </label>
                                    <input
                                        type="number"
                                        min="1"
                                        max="30"
                                        value={config.compressionThreshold}
                                        onChange={(e) => handleConfigChange('compressionThreshold', parseInt(e.target.value))}
                                        disabled={!config.compressionEnabled}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
                                    />
                                    <p className="text-xs text-gray-500 mt-1">
                                        Compress conversations older than this to save memory
                                    </p>
                                </div>
                            </div>

                            <div className="space-y-4">
                                <h4 className="font-medium text-gray-900">Memory Limits</h4>

                                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                                    <div className="flex items-start space-x-2">
                                        <Info size={16} className="text-yellow-600 mt-0.5" />
                                        <div className="text-sm text-yellow-800">
                                            <strong>Memory Usage Warning:</strong>
                                            <div className="mt-1">
                                                Current: {formatBytes(stats.memoryUsageEstimate)}<br />
                                                Estimated max with current settings: {formatBytes(config.maxConversations * config.maxMessagesPerConversation * 300)}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Actions */}
            <div className="bg-white rounded-lg border border-gray-200 p-6">
                <h3 className="text-lg font-semibold mb-4 flex items-center">
                    <RefreshCw className="mr-2" size={20} />
                    Memory Management Actions
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <button
                        onClick={runCleanup}
                        disabled={loading}
                        className="flex items-center justify-center space-x-2 px-4 py-3 bg-orange-600 text-white rounded-lg hover:bg-orange-700 disabled:opacity-50 transition-colors"
                    >
                        <Trash2 size={16} />
                        <span>Run Cleanup</span>
                    </button>

                    <button
                        onClick={optimizeMemory}
                        disabled={loading}
                        className="flex items-center justify-center space-x-2 px-4 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 transition-colors"
                    >
                        <Brain size={16} />
                        <span>Optimize Memory</span>
                    </button>

                    <button
                        onClick={loadMemoryStats}
                        disabled={loading}
                        className="flex items-center justify-center space-x-2 px-4 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700 disabled:opacity-50 transition-colors"
                    >
                        <RefreshCw size={16} />
                        <span>Refresh Stats</span>
                    </button>

                    <button
                        onClick={exportConfiguration}
                        className="flex items-center justify-center space-x-2 px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                    >
                        <Download size={16} />
                        <span>Export Config</span>
                    </button>
                </div>

                <div className="mt-4 flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                        <label className="flex items-center space-x-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 cursor-pointer transition-colors">
                            <Upload size={16} />
                            <span>Import Config</span>
                            <input
                                type="file"
                                accept=".json"
                                onChange={importConfiguration}
                                className="hidden"
                            />
                        </label>
                        <button
                            onClick={resetToDefaults}
                            className="px-4 py-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors"
                        >
                            Reset to Defaults
                        </button>
                    </div>

                    <div className="flex items-center space-x-2">
                        <button
                            onClick={() => loadCurrentConfig()}
                            disabled={!unsavedChanges}
                            className="px-4 py-2 text-gray-600 hover:text-gray-800 disabled:opacity-50 rounded-lg transition-colors"
                        >
                            Discard Changes
                        </button>
                        <button
                            onClick={saveConfiguration}
                            disabled={loading || !unsavedChanges}
                            className="flex items-center space-x-2 px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 transition-colors"
                        >
                            {loading ? (
                                <RefreshCw size={16} className="animate-spin" />
                            ) : (
                                <CheckCircle size={16} />
                            )}
                            <span>Save Configuration</span>
                        </button>
                    </div>
                </div>
            </div>

            {/* Configuration Preview */}
            <div className="bg-white rounded-lg border border-gray-200 p-6">
                <h3 className="text-lg font-semibold mb-4">Configuration Summary</h3>
                <div className="bg-gray-50 rounded-lg p-4 font-mono text-sm overflow-x-auto">
                    <pre>{JSON.stringify(config, null, 2)}</pre>
                </div>
            </div>

            {/* Performance Impact */}
            <div className="bg-white rounded-lg border border-gray-200 p-6">
                <h3 className="text-lg font-semibold mb-4 flex items-center">
                    <Clock className="mr-2" size={20} />
                    Performance Impact Assessment
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="text-center">
                        <div className={`text-2xl font-bold ${config.maxConversations <= 25 ? 'text-green-600' :
                                config.maxConversations <= 75 ? 'text-yellow-600' : 'text-red-600'
                            }`}>
                            {config.maxConversations <= 25 ? 'Low' :
                                config.maxConversations <= 75 ? 'Medium' : 'High'}
                        </div>
                        <div className="text-sm text-gray-600">Memory Usage</div>
                    </div>

                    <div className="text-center">
                        <div className={`text-2xl font-bold ${config.maxContextLength <= 3000 ? 'text-green-600' :
                                config.maxContextLength <= 8000 ? 'text-yellow-600' : 'text-red-600'
                            }`}>
                            {config.maxContextLength <= 3000 ? 'Fast' :
                                config.maxContextLength <= 8000 ? 'Medium' : 'Slow'}
                        </div>
                        <div className="text-sm text-gray-600">Response Speed</div>
                    </div>

                    <div className="text-center">
                        <div className={`text-2xl font-bold ${config.memoryRetentionHours <= 24 ? 'text-green-600' :
                                config.memoryRetentionHours <= 72 ? 'text-yellow-600' : 'text-red-600'
                            }`}>
                            {config.memoryRetentionHours <= 24 ? 'Low' :
                                config.memoryRetentionHours <= 72 ? 'Medium' : 'High'}
                        </div>
                        <div className="text-sm text-gray-600">Storage Load</div>
                    </div>
                </div>

                <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                    <div className="text-sm text-blue-800">
                        <strong>Recommendations:</strong>
                        <ul className="mt-2 space-y-1">
                            {config.maxConversations > 100 && (
                                <li>• Consider reducing max conversations for better performance</li>
                            )}
                            {config.maxContextLength > 10000 && (
                                <li>• Large context length may slow down response generation</li>
                            )}
                            {config.memoryRetentionHours > 168 && (
                                <li>• Long retention periods increase storage requirements</li>
                            )}
                            {!config.autoCleanupEnabled && (
                                <li>• Enable auto-cleanup to prevent memory bloat</li>
                            )}
                            {!config.compressionEnabled && config.maxConversations > 50 && (
                                <li>• Enable compression for better memory efficiency</li>
                            )}
                        </ul>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default MemorySettings;