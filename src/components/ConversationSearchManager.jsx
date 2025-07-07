import React, { useState, useEffect, useCallback } from 'react';
import { Search, Filter, Calendar, Tag, MessageCircle, Brain, Download, Trash2, Eye, Copy, RefreshCw, Archive, Star, Clock } from 'lucide-react';

const ConversationSearchManager = () => {
    const [conversations, setConversations] = useState([]);
    const [filteredConversations, setFilteredConversations] = useState([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedConversations, setSelectedConversations] = useState(new Set());
    const [loading, setLoading] = useState(true);
    const [filters, setFilters] = useState({
        intent: 'all',
        dateRange: 'all',
        messageCount: 'all',
        topics: [],
        starred: false
    });
    const [sortBy, setSortBy] = useState('lastUpdated');
    const [sortOrder, setSortOrder] = useState('desc');
    const [starredConversations, setStarredConversations] = useState(new Set());

    useEffect(() => {
        loadConversations();
        loadStarredConversations();
    }, []);

    useEffect(() => {
        filterAndSortConversations();
    }, [conversations, searchQuery, filters, sortBy, sortOrder]);

    const loadConversations = async () => {
        setLoading(true);
        try {
            const response = await fetch('/api/memory/conversations');
            const data = await response.json();

            if (data.success) {
                const convs = data.data.conversations || [];
                // Enhance conversations with additional metadata
                const enhancedConvs = await Promise.all(
                    convs.map(async (conv) => {
                        try {
                            const detailResponse = await fetch(`/api/memory/conversations/${conv.id}`);
                            const detailData = await detailResponse.json();

                            if (detailData.success) {
                                return {
                                    ...conv,
                                    messages: detailData.data.messages || [],
                                    context: detailData.data.context || '',
                                    metadata: detailData.data.metadata || {}
                                };
                            }
                        } catch (error) {
                            console.warn(`Failed to load details for conversation ${conv.id}`);
                        }
                        return conv;
                    })
                );

                setConversations(enhancedConvs);
            }
        } catch (error) {
            console.error('Failed to load conversations:', error);
        } finally {
            setLoading(false);
        }
    };

    const loadStarredConversations = () => {
        const starred = localStorage.getItem('starredConversations');
        if (starred) {
            setStarredConversations(new Set(JSON.parse(starred)));
        }
    };

    const toggleStarredConversation = (conversationId) => {
        const newStarred = new Set(starredConversations);
        if (newStarred.has(conversationId)) {
            newStarred.delete(conversationId);
        } else {
            newStarred.add(conversationId);
        }
        setStarredConversations(newStarred);
        localStorage.setItem('starredConversations', JSON.stringify([...newStarred]));
    };

    const filterAndSortConversations = useCallback(() => {
        let filtered = [...conversations];

        // Apply search filter
        if (searchQuery.trim()) {
            const query = searchQuery.toLowerCase();
            filtered = filtered.filter(conv => {
                // Search in conversation ID, topics, intent, and message content
                const searchableText = [
                    conv.id,
                    conv.summary.lastIntent,
                    ...conv.summary.mainTopics,
                    ...(conv.messages || []).map(msg => msg.content)
                ].join(' ').toLowerCase();

                return searchableText.includes(query);
            });
        }

        // Apply intent filter
        if (filters.intent !== 'all') {
            filtered = filtered.filter(conv => conv.summary.lastIntent === filters.intent);
        }

        // Apply date range filter
        if (filters.dateRange !== 'all') {
            const now = new Date();
            let cutoffDate;

            switch (filters.dateRange) {
                case 'today':
                    cutoffDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
                    break;
                case 'week':
                    cutoffDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
                    break;
                case 'month':
                    cutoffDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
                    break;
                default:
                    cutoffDate = new Date(0);
            }

            filtered = filtered.filter(conv =>
                new Date(conv.summary.lastUpdated) >= cutoffDate
            );
        }

        // Apply message count filter
        if (filters.messageCount !== 'all') {
            switch (filters.messageCount) {
                case 'short':
                    filtered = filtered.filter(conv => conv.summary.messageCount <= 5);
                    break;
                case 'medium':
                    filtered = filtered.filter(conv =>
                        conv.summary.messageCount > 5 && conv.summary.messageCount <= 20
                    );
                    break;
                case 'long':
                    filtered = filtered.filter(conv => conv.summary.messageCount > 20);
                    break;
            }
        }

        // Apply topic filter
        if (filters.topics.length > 0) {
            filtered = filtered.filter(conv =>
                filters.topics.every(topic => conv.summary.mainTopics.includes(topic))
            );
        }

        // Apply starred filter
        if (filters.starred) {
            filtered = filtered.filter(conv => starredConversations.has(conv.id));
        }

        // Sort conversations
        filtered.sort((a, b) => {
            let aValue, bValue;

            switch (sortBy) {
                case 'lastUpdated':
                    aValue = new Date(a.summary.lastUpdated);
                    bValue = new Date(b.summary.lastUpdated);
                    break;
                case 'messageCount':
                    aValue = a.summary.messageCount;
                    bValue = b.summary.messageCount;
                    break;
                case 'intent':
                    aValue = a.summary.lastIntent;
                    bValue = b.summary.lastIntent;
                    break;
                case 'topics':
                    aValue = a.summary.mainTopics.length;
                    bValue = b.summary.mainTopics.length;
                    break;
                default:
                    return 0;
            }

            if (sortOrder === 'asc') {
                return aValue > bValue ? 1 : -1;
            } else {
                return aValue < bValue ? 1 : -1;
            }
        });

        setFilteredConversations(filtered);
    }, [conversations, searchQuery, filters, sortBy, sortOrder, starredConversations]);

    const getAllTopics = () => {
        const allTopics = new Set();
        conversations.forEach(conv => {
            conv.summary.mainTopics.forEach(topic => allTopics.add(topic));
        });
        return [...allTopics].sort();
    };

    const toggleTopicFilter = (topic) => {
        setFilters(prev => ({
            ...prev,
            topics: prev.topics.includes(topic)
                ? prev.topics.filter(t => t !== topic)
                : [...prev.topics, topic]
        }));
    };

    const selectConversation = (conversationId) => {
        const newSelected = new Set(selectedConversations);
        if (newSelected.has(conversationId)) {
            newSelected.delete(conversationId);
        } else {
            newSelected.add(conversationId);
        }
        setSelectedConversations(newSelected);
    };

    const selectAllVisible = () => {
        const allVisible = new Set(filteredConversations.map(conv => conv.id));
        setSelectedConversations(allVisible);
    };

    const clearSelection = () => {
        setSelectedConversations(new Set());
    };

    const bulkExport = async () => {
        if (selectedConversations.size === 0) return;

        const exportData = {
            timestamp: new Date().toISOString(),
            totalConversations: selectedConversations.size,
            conversations: []
        };

        for (const convId of selectedConversations) {
            try {
                const response = await fetch(`/api/memory/conversations/${convId}`);
                const data = await response.json();

                if (data.success) {
                    exportData.conversations.push(data.data);
                }
            } catch (error) {
                console.error(`Failed to export conversation ${convId}`);
            }
        }

        const blob = new Blob([JSON.stringify(exportData, null, 2)], {
            type: 'application/json'
        });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `conversations-export-${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    };

    const bulkDelete = async () => {
        if (selectedConversations.size === 0) return;

        if (confirm(`Delete ${selectedConversations.size} selected conversations? This cannot be undone.`)) {
            for (const convId of selectedConversations) {
                try {
                    await fetch(`/api/memory/conversations/${convId}`, { method: 'DELETE' });
                } catch (error) {
                    console.error(`Failed to delete conversation ${convId}`);
                }
            }

            setSelectedConversations(new Set());
            loadConversations();
        }
    };

    const copyConversationId = (conversationId) => {
        navigator.clipboard.writeText(conversationId);
        // You could add a toast notification here
    };

    const ConversationCard = ({ conversation }) => {
        const isSelected = selectedConversations.has(conversation.id);
        const isStarred = starredConversations.has(conversation.id);
        const createdDate = new Date(conversation.id.split('_')[1] ? parseInt(conversation.id.split('_')[1]) : Date.now());
        const lastUpdated = new Date(conversation.summary.lastUpdated);

        return (
            <div className={`bg-white border rounded-lg p-4 transition-all hover:shadow-md ${isSelected ? 'border-blue-500 bg-blue-50' : 'border-gray-200'
                }`}>
                <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center space-x-2">
                        <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => selectConversation(conversation.id)}
                            className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                        />
                        <button
                            onClick={() => toggleStarredConversation(conversation.id)}
                            className={`p-1 rounded ${isStarred ? 'text-yellow-500' : 'text-gray-300 hover:text-yellow-400'}`}
                        >
                            <Star size={16} fill={isStarred ? 'currentColor' : 'none'} />
                        </button>
                        <span className="text-xs font-mono text-gray-500 bg-gray-100 px-2 py-1 rounded">
                            {conversation.id.split('_')[2]?.substr(0, 6) || 'ID'}
                        </span>
                    </div>
                    <div className="flex items-center space-x-1">
                        <button
                            onClick={() => copyConversationId(conversation.id)}
                            className="p-1 text-gray-400 hover:text-gray-600"
                            title="Copy ID"
                        >
                            <Copy size={14} />
                        </button>
                        <button
                            className="p-1 text-gray-400 hover:text-blue-600"
                            title="View Details"
                        >
                            <Eye size={14} />
                        </button>
                    </div>
                </div>

                <div className="space-y-2">
                    <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-gray-900">
                            {createdDate.toLocaleDateString()} {createdDate.toLocaleTimeString()}
                        </span>
                        <span className="text-xs text-gray-500 flex items-center">
                            <Clock size={12} className="mr-1" />
                            {lastUpdated.toLocaleDateString()}
                        </span>
                    </div>

                    <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                            <MessageCircle size={14} className="text-blue-500" />
                            <span className="text-sm text-gray-600">
                                {conversation.summary.messageCount} messages
                            </span>
                        </div>
                        <span className={`text-xs px-2 py-1 rounded-full ${conversation.summary.lastIntent === 'qa' ? 'bg-blue-100 text-blue-700' :
                            conversation.summary.lastIntent === 'field_generation' ? 'bg-green-100 text-green-700' :
                                conversation.summary.lastIntent === 'plugin_generation' ? 'bg-purple-100 text-purple-700' :
                                    conversation.summary.lastIntent === 'architecture_explanation' ? 'bg-indigo-100 text-indigo-700' :
                                        conversation.summary.lastIntent === 'improvement_suggestions' ? 'bg-orange-100 text-orange-700' :
                                            'bg-gray-100 text-gray-700'
                            }`}>
                            {conversation.summary.lastIntent.replace('_', ' ')}
                        </span>
                    </div>

                    {conversation.summary.mainTopics.length > 0 && (
                        <div className="flex flex-wrap gap-1">
                            {conversation.summary.mainTopics.slice(0, 4).map((topic, idx) => (
                                <span key={idx} className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded">
                                    {topic}
                                </span>
                            ))}
                            {conversation.summary.mainTopics.length > 4 && (
                                <span className="text-xs text-gray-400">
                                    +{conversation.summary.mainTopics.length - 4} more
                                </span>
                            )}
                        </div>
                    )}

                    {conversation.messages && conversation.messages.length > 0 && (
                        <div className="text-xs text-gray-500 bg-gray-50 p-2 rounded">
                            <strong>Last message:</strong> {
                                conversation.messages[conversation.messages.length - 1]?.content?.substring(0, 100) + '...' || 'No content'
                            }
                        </div>
                    )}
                </div>
            </div>
        );
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="flex items-center space-x-2">
                    <RefreshCw className="animate-spin" size={24} />
                    <span>Loading conversations...</span>
                </div>
            </div>
        );
    }

    return (
        <div className="p-6 space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                    <Search size={32} className="text-blue-600" />
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900">Conversation Manager</h1>
                        <p className="text-gray-600">
                            Search, filter, and manage your conversation history
                        </p>
                    </div>
                </div>
                <div className="flex items-center space-x-2">
                    <button
                        onClick={loadConversations}
                        className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors flex items-center space-x-2"
                    >
                        <RefreshCw size={16} />
                        <span>Refresh</span>
                    </button>
                </div>
            </div>

            {/* Search and Filters */}
            <div className="bg-white rounded-lg border border-gray-200 p-6 space-y-4">
                {/* Search Bar */}
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                    <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Search conversations by content, topics, or intent..."
                        className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                </div>

                {/* Filters Row */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                    <select
                        value={filters.intent}
                        onChange={(e) => setFilters(prev => ({ ...prev, intent: e.target.value }))}
                        className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    >
                        <option value="all">All Intents</option>
                        <option value="qa">Q&A</option>
                        <option value="field_generation">Field Generation</option>
                        <option value="plugin_generation">Plugin Generation</option>
                        <option value="architecture_explanation">Architecture</option>
                        <option value="improvement_suggestions">Improvements</option>
                    </select>

                    <select
                        value={filters.dateRange}
                        onChange={(e) => setFilters(prev => ({ ...prev, dateRange: e.target.value }))}
                        className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    >
                        <option value="all">All Time</option>
                        <option value="today">Today</option>
                        <option value="week">Last Week</option>
                        <option value="month">Last Month</option>
                    </select>

                    <select
                        value={filters.messageCount}
                        onChange={(e) => setFilters(prev => ({ ...prev, messageCount: e.target.value }))}
                        className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    >
                        <option value="all">Any Length</option>
                        <option value="short">{`Short (≤5 msgs)`}</option>
                        <option value="medium">{`Medium (6-20 msgs)`}</option>
                        <option value="long">{`Long (>20 msgs)`}</option>
                    </select>

                    <select
                        value={sortBy}
                        onChange={(e) => setSortBy(e.target.value)}
                        className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    >
                        <option value="lastUpdated">Last Updated</option>
                        <option value="messageCount">Message Count</option>
                        <option value="intent">Intent</option>
                        <option value="topics">Topic Count</option>
                    </select>

                    <div className="flex items-center space-x-2">
                        <button
                            onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
                            className="px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                        >
                            {sortOrder === 'asc' ? '↑' : '↓'}
                        </button>
                        <label className="flex items-center space-x-2">
                            <input
                                type="checkbox"
                                checked={filters.starred}
                                onChange={(e) => setFilters(prev => ({ ...prev, starred: e.target.checked }))}
                                className="rounded border-gray-300 text-yellow-600 focus:ring-yellow-500"
                            />
                            <Star size={16} className="text-yellow-500" />
                        </label>
                    </div>
                </div>

                {/* Topic Filter */}
                {getAllTopics().length > 0 && (
                    <div>
                        <div className="text-sm font-medium text-gray-700 mb-2">Filter by Topics:</div>
                        <div className="flex flex-wrap gap-2">
                            {getAllTopics().map(topic => (
                                <button
                                    key={topic}
                                    onClick={() => toggleTopicFilter(topic)}
                                    className={`text-xs px-3 py-1 rounded-full border transition-colors ${filters.topics.includes(topic)
                                        ? 'bg-blue-100 text-blue-700 border-blue-200'
                                        : 'bg-gray-100 text-gray-600 border-gray-200 hover:bg-gray-200'
                                        }`}
                                >
                                    {topic}
                                </button>
                            ))}
                        </div>
                    </div>
                )}
            </div>

            {/* Bulk Actions */}
            {selectedConversations.size > 0 && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <div className="flex items-center justify-between">
                        <span className="text-blue-800 font-medium">
                            {selectedConversations.size} conversation(s) selected
                        </span>
                        <div className="flex items-center space-x-2">
                            <button
                                onClick={selectAllVisible}
                                className="text-sm text-blue-600 hover:text-blue-800"
                            >
                                Select All Visible
                            </button>
                            <button
                                onClick={clearSelection}
                                className="text-sm text-blue-600 hover:text-blue-800"
                            >
                                Clear Selection
                            </button>
                            <button
                                onClick={bulkExport}
                                className="px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700 flex items-center space-x-1"
                            >
                                <Download size={14} />
                                <span>Export</span>
                            </button>
                            <button
                                onClick={bulkDelete}
                                className="px-3 py-1 bg-red-600 text-white rounded hover:bg-red-700 flex items-center space-x-1"
                            >
                                <Trash2 size={14} />
                                <span>Delete</span>
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Results Summary */}
            <div className="flex items-center justify-between text-sm text-gray-600">
                <span>
                    Showing {filteredConversations.length} of {conversations.length} conversations
                </span>
                {searchQuery && (
                    <span>
                        Search results for: <strong>"{searchQuery}"</strong>
                    </span>
                )}
            </div>

            {/* Conversations Grid */}
            {filteredConversations.length === 0 ? (
                <div className="text-center py-12">
                    <Brain size={48} className="mx-auto text-gray-400 mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No conversations found</h3>
                    <p className="text-gray-600">
                        {searchQuery || Object.values(filters).some(f => f !== 'all' && f !== false && (!Array.isArray(f) || f.length > 0))
                            ? 'Try adjusting your search criteria or filters'
                            : 'Start a conversation to see it appear here'
                        }
                    </p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {filteredConversations.map(conversation => (
                        <ConversationCard key={conversation.id} conversation={conversation} />
                    ))}
                </div>
            )}

            {/* Load More Button (if needed for pagination) */}
            {filteredConversations.length > 0 && filteredConversations.length < conversations.length && (
                <div className="text-center">
                    <button className="px-6 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors">
                        Load More Conversations
                    </button>
                </div>
            )}
        </div>
    );
};

export default ConversationSearchManager;