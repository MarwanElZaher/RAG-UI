import React, { useState, useEffect } from 'react';
import { Brain, MessageCircle, TrendingUp, Clock, BarChart3, Eye, Download, Trash2, Filter, Search, Calendar, User, Bot } from 'lucide-react';

const MemoryAnalytics = () => {
    const [conversations, setConversations] = useState([]);
    const [analytics, setAnalytics] = useState(null);
    const [selectedConversation, setSelectedConversation] = useState(null);
    const [timeFilter, setTimeFilter] = useState('all'); // all, today, week, month
    const [intentFilter, setIntentFilter] = useState('all');
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadAnalyticsData();
    }, [timeFilter, intentFilter]);

    const loadAnalyticsData = async () => {
        setLoading(true);
        try {
            // Simulate API call to get conversations with analytics
            const response = await fetch('/api/memory/conversations');
            const data = await response.json();

            if (data.success) {
                const convs = data.data.conversations || [];
                setConversations(convs);

                // Calculate analytics
                const analytics = calculateAnalytics(convs);
                setAnalytics(analytics);
            }
        } catch (error) {
            console.error('Failed to load analytics:', error);
        } finally {
            setLoading(false);
        }
    };

    const calculateAnalytics = (convs) => {
        const now = new Date();
        const filtered = convs.filter(conv => {
            // Apply time filter
            const convDate = new Date(conv.summary.lastUpdated);
            let timeMatch = true;

            switch (timeFilter) {
                case 'today':
                    timeMatch = convDate.toDateString() === now.toDateString();
                    break;
                case 'week':
                    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
                    timeMatch = convDate >= weekAgo;
                    break;
                case 'month':
                    const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
                    timeMatch = convDate >= monthAgo;
                    break;
                default:
                    timeMatch = true;
            }

            // Apply intent filter
            const intentMatch = intentFilter === 'all' || conv.summary.lastIntent === intentFilter;

            return timeMatch && intentMatch;
        });

        const totalMessages = filtered.reduce((sum, conv) => sum + conv.summary.messageCount, 0);
        const avgMessagesPerConv = filtered.length > 0 ? totalMessages / filtered.length : 0;

        // Intent distribution
        const intentCounts = {};
        filtered.forEach(conv => {
            const intent = conv.summary.lastIntent;
            intentCounts[intent] = (intentCounts[intent] || 0) + 1;
        });

        // Topic distribution
        const topicCounts = {};
        filtered.forEach(conv => {
            conv.summary.mainTopics.forEach(topic => {
                topicCounts[topic] = (topicCounts[topic] || 0) + 1;
            });
        });

        // Daily activity (last 7 days)
        const dailyActivity = [];
        for (let i = 6; i >= 0; i--) {
            const date = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
            const dayConvs = convs.filter(conv => {
                const convDate = new Date(conv.summary.lastUpdated);
                return convDate.toDateString() === date.toDateString();
            });
            dailyActivity.push({
                date: date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' }),
                conversations: dayConvs.length,
                messages: dayConvs.reduce((sum, conv) => sum + conv.summary.messageCount, 0)
            });
        }

        return {
            totalConversations: filtered.length,
            totalMessages,
            avgMessagesPerConv: Math.round(avgMessagesPerConv * 10) / 10,
            intentDistribution: intentCounts,
            topicDistribution: topicCounts,
            dailyActivity,
            activeConversations: filtered.filter(conv => conv.summary.messageCount > 3).length,
            topTopics: Object.entries(topicCounts)
                .sort(([, a], [, b]) => b - a)
                .slice(0, 5)
                .map(([topic, count]) => ({ topic, count }))
        };
    };

    const exportAnalytics = () => {
        const exportData = {
            timestamp: new Date().toISOString(),
            filters: { timeFilter, intentFilter },
            analytics,
            conversations: conversations.map(conv => ({
                id: conv.id,
                summary: conv.summary,
                created: conv.summary.lastUpdated
            }))
        };

        const blob = new Blob([JSON.stringify(exportData, null, 2)], {
            type: 'application/json'
        });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `memory-analytics-${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    };

    const clearOldConversations = async () => {
        if (confirm('Clear all conversations older than 30 days? This cannot be undone.')) {
            try {
                const cutoffDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
                const toDelete = conversations.filter(conv =>
                    new Date(conv.summary.lastUpdated) < cutoffDate
                );

                for (const conv of toDelete) {
                    await fetch(`/api/memory/conversations/${conv.id}`, { method: 'DELETE' });
                }

                loadAnalyticsData();
                alert(`Cleared ${toDelete.length} old conversations`);
            } catch (error) {
                console.error('Failed to clear old conversations:', error);
                alert('Failed to clear conversations');
            }
        }
    };

    const StatCard = ({ title, value, subtitle, icon: Icon, color = 'blue' }) => (
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

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="flex items-center space-x-2">
                    <Brain className="animate-spin" size={24} />
                    <span>Loading memory analytics...</span>
                </div>
            </div>
        );
    }

    return (
        <div className="p-6 space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                    <Brain size={32} className="text-purple-600" />
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900">Memory Analytics</h1>
                        <p className="text-gray-600">Conversation insights and memory management</p>
                    </div>
                </div>
                <div className="flex items-center space-x-2">
                    <button
                        onClick={exportAnalytics}
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2"
                    >
                        <Download size={16} />
                        <span>Export</span>
                    </button>
                    <button
                        onClick={clearOldConversations}
                        className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors flex items-center space-x-2"
                    >
                        <Trash2 size={16} />
                        <span>Cleanup</span>
                    </button>
                </div>
            </div>

            {/* Filters */}
            <div className="bg-white rounded-lg border border-gray-200 p-4">
                <div className="flex items-center space-x-4">
                    <div className="flex items-center space-x-2">
                        <Filter size={16} className="text-gray-500" />
                        <span className="text-sm font-medium text-gray-700">Filters:</span>
                    </div>

                    <select
                        value={timeFilter}
                        onChange={(e) => setTimeFilter(e.target.value)}
                        className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
                    >
                        <option value="all">All Time</option>
                        <option value="today">Today</option>
                        <option value="week">Last Week</option>
                        <option value="month">Last Month</option>
                    </select>

                    <select
                        value={intentFilter}
                        onChange={(e) => setIntentFilter(e.target.value)}
                        className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
                    >
                        <option value="all">All Intents</option>
                        <option value="qa">Q&A</option>
                        <option value="field_generation">Field Generation</option>
                        <option value="plugin_generation">Plugin Generation</option>
                        <option value="architecture_explanation">Architecture</option>
                        <option value="improvement_suggestions">Improvements</option>
                    </select>
                </div>
            </div>

            {/* Statistics Cards */}
            {analytics && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <StatCard
                        title="Total Conversations"
                        value={analytics.totalConversations}
                        subtitle={`${analytics.activeConversations} active (3+ messages)`}
                        icon={MessageCircle}
                        color="blue"
                    />
                    <StatCard
                        title="Total Messages"
                        value={analytics.totalMessages}
                        subtitle={`${analytics.avgMessagesPerConv} avg per conversation`}
                        icon={Bot}
                        color="green"
                    />
                    <StatCard
                        title="Top Topic"
                        value={analytics.topTopics[0]?.topic || 'N/A'}
                        subtitle={`${analytics.topTopics[0]?.count || 0} conversations`}
                        icon={TrendingUp}
                        color="purple"
                    />
                    <StatCard
                        title="Memory Efficiency"
                        value={`${Math.round((analytics.activeConversations / analytics.totalConversations) * 100) || 0}%`}
                        subtitle="Conversations with meaningful depth"
                        icon={Brain}
                        color="orange"
                    />
                </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Daily Activity Chart */}
                {analytics && (
                    <div className="bg-white rounded-lg border border-gray-200 p-6">
                        <h3 className="text-lg font-semibold mb-4 flex items-center">
                            <BarChart3 className="mr-2" size={20} />
                            Daily Activity (Last 7 Days)
                        </h3>
                        <div className="space-y-3">
                            {analytics.dailyActivity.map((day, index) => (
                                <div key={index} className="flex items-center justify-between">
                                    <span className="text-sm text-gray-600 w-20">{day.date}</span>
                                    <div className="flex-1 mx-3">
                                        <div className="bg-gray-200 rounded-full h-2">
                                            <div
                                                className="bg-blue-600 h-2 rounded-full"
                                                style={{
                                                    width: `${Math.max((day.conversations / Math.max(...analytics.dailyActivity.map(d => d.conversations))) * 100, 5)}%`
                                                }}
                                            />
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <div className="text-sm font-medium">{day.conversations} convs</div>
                                        <div className="text-xs text-gray-500">{day.messages} msgs</div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Intent Distribution */}
                {analytics && (
                    <div className="bg-white rounded-lg border border-gray-200 p-6">
                        <h3 className="text-lg font-semibold mb-4 flex items-center">
                            <TrendingUp className="mr-2" size={20} />
                            Intent Distribution
                        </h3>
                        <div className="space-y-3">
                            {Object.entries(analytics.intentDistribution).map(([intent, count]) => {
                                const percentage = (count / analytics.totalConversations) * 100;
                                return (
                                    <div key={intent} className="flex items-center justify-between">
                                        <span className="text-sm text-gray-600 capitalize">{intent.replace('_', ' ')}</span>
                                        <div className="flex items-center space-x-2">
                                            <div className="w-20 bg-gray-200 rounded-full h-2">
                                                <div
                                                    className="bg-purple-600 h-2 rounded-full"
                                                    style={{ width: `${percentage}%` }}
                                                />
                                            </div>
                                            <span className="text-sm font-medium w-8 text-right">{count}</span>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                )}

                {/* Top Topics */}
                {analytics && analytics.topTopics.length > 0 && (
                    <div className="bg-white rounded-lg border border-gray-200 p-6">
                        <h3 className="text-lg font-semibold mb-4 flex items-center">
                            <Search className="mr-2" size={20} />
                            Top Discussion Topics
                        </h3>
                        <div className="space-y-2">
                            {analytics.topTopics.map((topic, index) => (
                                <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                                    <span className="text-sm font-medium">{topic.topic}</span>
                                    <span className="text-sm text-gray-600">{topic.count} conversations</span>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Recent Conversations */}
                <div className="bg-white rounded-lg border border-gray-200 p-6">
                    <h3 className="text-lg font-semibold mb-4 flex items-center">
                        <Clock className="mr-2" size={20} />
                        Recent Conversations
                    </h3>
                    <div className="space-y-3 max-h-64 overflow-y-auto">
                        {conversations.slice(0, 10).map((conv) => (
                            <div
                                key={conv.id}
                                className="p-3 bg-gray-50 rounded-lg cursor-pointer hover:bg-gray-100 transition-colors"
                                onClick={() => setSelectedConversation(conv)}
                            >
                                <div className="flex items-center justify-between mb-1">
                                    <span className="text-sm font-medium">
                                        {new Date(conv.summary.lastUpdated).toLocaleDateString()}
                                    </span>
                                    <span className="text-xs text-gray-500">
                                        {conv.summary.messageCount} messages
                                    </span>
                                </div>
                                <div className="text-xs text-gray-600">
                                    Intent: {conv.summary.lastIntent}
                                </div>
                                {conv.summary.mainTopics.length > 0 && (
                                    <div className="flex flex-wrap gap-1 mt-1">
                                        {conv.summary.mainTopics.slice(0, 3).map((topic, idx) => (
                                            <span key={idx} className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded">
                                                {topic}
                                            </span>
                                        ))}
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Conversation Detail Modal */}
            {selectedConversation && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-lg max-w-2xl w-full mx-4 max-h-[80vh] overflow-hidden">
                        <div className="p-6 border-b border-gray-200">
                            <div className="flex items-center justify-between">
                                <h3 className="text-lg font-semibold">Conversation Details</h3>
                                <button
                                    onClick={() => setSelectedConversation(null)}
                                    className="text-gray-500 hover:text-gray-700"
                                >
                                    ✕
                                </button>
                            </div>
                        </div>
                        <div className="p-6 overflow-y-auto">
                            <div className="space-y-4">
                                <div>
                                    <strong>ID:</strong> {selectedConversation.id}
                                </div>
                                <div>
                                    <strong>Last Updated:</strong> {new Date(selectedConversation.summary.lastUpdated).toLocaleString()}
                                </div>
                                <div>
                                    <strong>Message Count:</strong> {selectedConversation.summary.messageCount}
                                </div>
                                <div>
                                    <strong>Last Intent:</strong> {selectedConversation.summary.lastIntent}
                                </div>
                                <div>
                                    <strong>Main Topics:</strong>
                                    <div className="flex flex-wrap gap-2 mt-1">
                                        {selectedConversation.summary.mainTopics.map((topic, idx) => (
                                            <span key={idx} className="bg-gray-100 text-gray-700 px-2 py-1 rounded text-sm">
                                                {topic}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default MemoryAnalytics;