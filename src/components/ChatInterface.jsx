
import React, { useState, useEffect, useRef } from 'react';
import { Bot, User, Send, MessageCircle, Code, Layers, FileText, TrendingUp, Settings, Map, Book, Database, Search, Lightbulb, Cpu } from 'lucide-react';
import useApi from '../hooks/useApi';

const ChatInterface = () => {
    const [messages, setMessages] = useState([]);
    const [input, setInput] = useState('');
    const [intent, setIntent] = useState('qa');
    const [contextSettings, setContextSettings] = useState({
        includeOlMap: true,
        includeMaLib: true,
        includePlugins: true,
        includeDocs: true,
        maxSources: 10
    });
    const [showContextSettings, setShowContextSettings] = useState(false);
    const [suggestions, setSuggestions] = useState([]);
    const messagesEndRef = useRef(null);
    const contextDropdownRef = useRef(null);
    const { request, loading } = useApi();


    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    useEffect(() => {
        // Load contextual suggestions based on intent
        loadSuggestions();
    }, [intent]);

    // Click outside handler to close context dropdown
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (contextDropdownRef.current && !contextDropdownRef.current.contains(event.target)) {
                setShowContextSettings(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, []);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    useEffect(() => {
        // Load contextual suggestions based on intent
        loadSuggestions();
    }, [intent]);

    const loadSuggestions = () => {
        const suggestionMap = {
            qa: [
                "How does the ol-map wrapper handle coordinate transformations?",
                "What are the key components in ma-lib for form building?",
                "Show me plugin architecture patterns in Penta-B",
                "How do I integrate ol-map with form fields?",
                "What are the available ma-lib utility functions?"
            ],
            field_generation: [
                "Create a geospatial coordinate picker field using ol-map",
                "Generate a file upload field with ma-lib validation",
                "Build a datetime picker with localization support",
                "Create a multi-select dropdown with search functionality",
                "Generate a text field with real-time validation"
            ],
            plugin_generation: [
                "Create a plugin for importing GeoJSON data",
                "Generate a PDF export plugin for forms",
                "Build a data visualization plugin using charts",
                "Create a map integration plugin with ol-map",
                "Generate a notification system plugin"
            ],
            architecture_explanation: [
                "Explain the ol-map component architecture",
                "How does ma-lib handle state management?",
                "What's the plugin loading mechanism?",
                "Describe the form builder's core architecture",
                "How are components registered and discovered?"
            ],
            improvement_suggestions: [
                "Optimize ol-map rendering performance",
                "Improve ma-lib component reusability",
                "Enhance plugin system scalability",
                "Better error handling strategies",
                "Code organization best practices"
            ]
        };

        setSuggestions(suggestionMap[intent] || []);
    };

    const sendMessage = async (messageText = null) => {
        const messageToSend = messageText || input;
        if (!messageToSend.trim()) return;

        const userMessage = {
            id: Date.now(),
            role: 'user',
            content: messageToSend,
            timestamp: new Date(),
        };

        setMessages(prev => [...prev, userMessage]);
        if (!messageText) setInput('');

        try {
            const requestPayload = {
                message: messageToSend,
                intent: intent || 'qa',
                context: contextSettings
            };

            console.log('🚀 Sending chat request:', requestPayload);
            console.log('🎯 Context filters:', {
                olMap: contextSettings.includeOlMap,
                maLib: contextSettings.includeMaLib,
                plugins: contextSettings.includePlugins,
                docs: contextSettings.includeDocs,
                maxSources: contextSettings.maxSources
            });

            // Enhanced request with context settings
            const response = await request('/chat', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(requestPayload),
            });

            console.log('✅ Chat response received:', response);
            setMessages(prev => [...prev, response]);
        } catch (error) {
            console.error('❌ Chat error:', error);
            const errorMessage = {
                id: Date.now() + 1,
                role: 'assistant',
                content: `Sorry, I encountered an error processing your request: ${error.message || 'Unknown error'}. Please try again.`,
                timestamp: new Date(),
                error: true
            };
            setMessages(prev => [...prev, errorMessage]);
        }
    };

    const intentOptions = [
        {
            value: 'qa',
            label: 'Q&A',
            icon: MessageCircle,
            description: 'Ask questions about the codebase',
            color: 'blue'
        },
        {
            value: 'field_generation',
            label: 'Generate Field',
            icon: Code,
            description: 'Create new form field components',
            color: 'green'
        },
        {
            value: 'plugin_generation',
            label: 'Generate Plugin',
            icon: Layers,
            description: 'Build new plugins for Penta-B',
            color: 'purple'
        },
        {
            value: 'architecture_explanation',
            label: 'Explain Architecture',
            icon: FileText,
            description: 'Understand system architecture',
            color: 'indigo'
        },
        {
            value: 'improvement_suggestions',
            label: 'Suggest Improvements',
            icon: TrendingUp,
            description: 'Get optimization recommendations',
            color: 'orange'
        },
    ];

    const formatMessageContent = (content) => {
        // Enhanced code block detection and formatting
        const codeBlockRegex = /```(\w+)?\n([\s\S]*?)```/g;
        const inlineCodeRegex = /`([^`]+)`/g;

        let formattedContent = content;

        // Replace code blocks
        formattedContent = formattedContent.replace(codeBlockRegex, (match, language, code) => {
            return `<div class="code-block">
                <div class="code-header">
                    <span class="language">${language || 'code'}</span>
                    <button onclick="navigator.clipboard.writeText(\`${code.trim()}\`)" class="copy-btn">Copy</button>
                </div>
                <pre><code class="language-${language || 'text'}">${code.trim()}</code></pre>
            </div>`;
        });

        // Replace inline code
        formattedContent = formattedContent.replace(inlineCodeRegex, '<code class="inline-code">$1</code>');

        return formattedContent;
    };

    const ContextSettings = () => (
        <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-gray-200 rounded-lg shadow-lg p-4 z-50">
            <h4 className="font-medium mb-3 text-gray-900">Context Settings</h4>
            <div className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                    <label className="flex items-center space-x-2 cursor-pointer">
                        <input
                            type="checkbox"
                            checked={contextSettings.includeOlMap}
                            onChange={(e) => setContextSettings(prev => ({ ...prev, includeOlMap: e.target.checked }))}
                            className="rounded border-gray-300 text-purple-600 focus:ring-purple-500"
                        />
                        <Map size={16} className="text-purple-600 flex-shrink-0" />
                        <span className="text-sm text-gray-700">Ol-Map docs</span>
                    </label>
                    <label className="flex items-center space-x-2 cursor-pointer">
                        <input
                            type="checkbox"
                            checked={contextSettings.includeMaLib}
                            onChange={(e) => setContextSettings(prev => ({ ...prev, includeMaLib: e.target.checked }))}
                            className="rounded border-gray-300 text-orange-600 focus:ring-orange-500"
                        />
                        <Book size={16} className="text-orange-600 flex-shrink-0" />
                        <span className="text-sm text-gray-700">Ma-Lib components</span>
                    </label>
                    <label className="flex items-center space-x-2 cursor-pointer">
                        <input
                            type="checkbox"
                            checked={contextSettings.includePlugins}
                            onChange={(e) => setContextSettings(prev => ({ ...prev, includePlugins: e.target.checked }))}
                            className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                        />
                        <Layers size={16} className="text-blue-600 flex-shrink-0" />
                        <span className="text-sm text-gray-700">Plugin examples</span>
                    </label>
                    <label className="flex items-center space-x-2 cursor-pointer">
                        <input
                            type="checkbox"
                            checked={contextSettings.includeDocs}
                            onChange={(e) => setContextSettings(prev => ({ ...prev, includeDocs: e.target.checked }))}
                            className="rounded border-gray-300 text-green-600 focus:ring-green-500"
                        />
                        <FileText size={16} className="text-green-600 flex-shrink-0" />
                        <span className="text-sm text-gray-700">Documentation</span>
                    </label>
                </div>
                <div className="border-t border-gray-200 pt-3">
                    <div className="flex items-center justify-between mb-2">
                        <label className="text-sm font-medium text-gray-700">Max sources:</label>
                        <span className="text-sm font-medium text-gray-900 bg-gray-100 px-2 py-1 rounded">
                            {contextSettings.maxSources}
                        </span>
                    </div>
                    <input
                        type="range"
                        min="5"
                        max="20"
                        value={contextSettings.maxSources}
                        onChange={(e) => setContextSettings(prev => ({ ...prev, maxSources: parseInt(e.target.value) }))}
                        className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider"
                    />
                    <div className="flex justify-between text-xs text-gray-500 mt-1">
                        <span>5</span>
                        <span>20</span>
                    </div>
                </div>
            </div>
        </div>
    );

    return (
        <div className="flex flex-col h-full">
            {/* Enhanced Intent Selector */}
            <div className="p-4 border-b border-gray-200 bg-gray-50">
                <div className="flex flex-wrap gap-2 mb-3">
                    {intentOptions.map(({ value, label, icon: Icon, description, color }) => {
                        const isActive = intent === value;
                        let buttonStyle = {};
                        let buttonClass = 'flex items-center space-x-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors border ';

                        if (isActive) {
                            // Use inline styles for dynamic colors since Tailwind's dynamic classes don't work
                            switch (color) {
                                case 'blue':
                                    buttonStyle = { backgroundColor: '#2563eb', color: 'white', borderColor: '#2563eb' };
                                    break;
                                case 'green':
                                    buttonStyle = { backgroundColor: '#16a34a', color: 'white', borderColor: '#16a34a' };
                                    break;
                                case 'purple':
                                    buttonStyle = { backgroundColor: '#9333ea', color: 'white', borderColor: '#9333ea' };
                                    break;
                                case 'indigo':
                                    buttonStyle = { backgroundColor: '#4f46e5', color: 'white', borderColor: '#4f46e5' };
                                    break;
                                case 'orange':
                                    buttonStyle = { backgroundColor: '#ea580c', color: 'white', borderColor: '#ea580c' };
                                    break;
                                default:
                                    buttonStyle = { backgroundColor: '#2563eb', color: 'white', borderColor: '#2563eb' };
                            }
                            buttonClass += 'shadow-sm';
                        } else {
                            buttonClass += 'bg-white text-gray-700 hover:bg-gray-100 border-gray-300';
                        }

                        return (
                            <button
                                key={value}
                                onClick={() => setIntent(value)}
                                className={buttonClass}
                                style={isActive ? buttonStyle : {}}
                                title={description}
                            >
                                <Icon size={16} />
                                <span>{label}</span>
                            </button>
                        );
                    })}
                    <div className="relative min-w-96" ref={contextDropdownRef}>
                        <button
                            onClick={() => setShowContextSettings(!showContextSettings)}
                            className={`flex items-center space-x-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors border ${showContextSettings
                                ? 'bg-gray-600 text-white border-gray-600'
                                : 'bg-white text-gray-700 hover:bg-gray-100 border-gray-300'
                                }`}
                        >
                            <Settings size={16} />
                            <span>Context</span>
                            <div className="ml-1">
                                {showContextSettings ? '▲' : '▼'}
                            </div>
                        </button>
                        {showContextSettings && <ContextSettings />}
                    </div>
                </div>

                {/* Suggestions */}
                {suggestions.length > 0 && (
                    <div className="mt-3">
                        <div className="text-xs text-gray-600 mb-2 flex items-center">
                            <Lightbulb size={12} className="mr-1" />
                            Suggestions for {intentOptions.find(opt => opt.value === intent)?.label}:
                        </div>
                        <div className="flex flex-wrap gap-1">
                            {suggestions.slice(0, 3).map((suggestion, index) => (
                                <button
                                    key={index}
                                    onClick={() => sendMessage(suggestion)}
                                    className="text-xs px-2 py-1 bg-blue-100 text-blue-700 rounded hover:bg-blue-200 transition-colors"
                                >
                                    {suggestion.length > 50 ? suggestion.substring(0, 50) + '...' : suggestion}
                                </button>
                            ))}
                        </div>
                    </div>
                )}
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {messages.length === 0 && (
                    <div className="text-center text-gray-500 py-8">
                        <Bot size={48} className="mx-auto mb-4 text-gray-400" />
                        <h3 className="text-lg font-medium mb-2">Welcome to Penta-B RAG Assistant</h3>
                        <p className="mb-4">Ask questions about your codebase, generate components, or get architecture insights.</p>
                        <div className="text-sm text-gray-400">
                            <div className="flex items-center justify-center space-x-4 mb-2">
                                <div className="flex items-center space-x-1">
                                    <Map size={14} className="text-purple-600" />
                                    <span>Ol-Map Integration</span>
                                </div>
                                <div className="flex items-center space-x-1">
                                    <Book size={14} className="text-orange-600" />
                                    <span>Ma-Lib Components</span>
                                </div>
                                <div className="flex items-center space-x-1">
                                    <Layers size={14} className="text-blue-600" />
                                    <span>Plugin System</span>
                                </div>
                            </div>
                            <p>Ready to help with Penta-B development workflows</p>
                        </div>
                    </div>
                )}

                {messages.map((message) => (
                    <div
                        key={message.id}
                        className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                    >
                        <div
                            className={`max-w-4xl rounded-lg p-4 ${message.role === 'user'
                                ? 'bg-blue-600 text-white'
                                : message.error
                                    ? 'bg-red-50 border border-red-200'
                                    : 'bg-white border border-gray-200 shadow-sm'
                                }`}
                        >
                            <div className="flex items-start space-x-3">
                                {message.role === 'assistant' && (
                                    <div className="flex-shrink-0">
                                        {message.error ? (
                                            <div className="w-8 h-8 bg-red-100 rounded-lg flex items-center justify-center">
                                                <Bot size={20} className="text-red-600" />
                                            </div>
                                        ) : (
                                            <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                                                <Bot size={20} className="text-blue-600" />
                                            </div>
                                        )}
                                    </div>
                                )}
                                {message.role === 'user' && (
                                    <User size={20} className="text-white mt-1 flex-shrink-0" />
                                )}
                                <div className="flex-1 min-w-0">
                                    <div
                                        className="whitespace-pre-wrap font-sans"
                                        dangerouslySetInnerHTML={{
                                            __html: formatMessageContent(message.content)
                                        }}
                                    />

                                    {message.sources && message.sources.length > 0 && (
                                        <div className="mt-4 pt-3 border-t border-gray-200">
                                            <p className="text-sm font-medium text-gray-600 mb-2 flex items-center">
                                                <Database size={14} className="mr-1" />
                                                Sources ({message.sources.length}):
                                            </p>

                                            {/* Debug info for context filtering */}
                                            {message.contextSettings && (
                                                <div className="mb-3 p-2 bg-gray-50 rounded text-xs">
                                                    <div className="font-medium text-gray-700 mb-1">Context filters used:</div>
                                                    <div className="flex flex-wrap gap-1">
                                                        {message.contextSettings.includeOlMap &&
                                                            <span className="bg-purple-100 text-purple-700 px-1 py-0.5 rounded">Ol-Map</span>}
                                                        {message.contextSettings.includeMaLib &&
                                                            <span className="bg-orange-100 text-orange-700 px-1 py-0.5 rounded">Ma-Lib</span>}
                                                        {message.contextSettings.includePlugins &&
                                                            <span className="bg-blue-100 text-blue-700 px-1 py-0.5 rounded">Plugins</span>}
                                                        {message.contextSettings.includeDocs &&
                                                            <span className="bg-green-100 text-green-700 px-1 py-0.5 rounded">Docs</span>}
                                                        <span className="bg-gray-100 text-gray-600 px-1 py-0.5 rounded">
                                                            Max: {message.contextSettings.maxSources}
                                                        </span>
                                                    </div>
                                                </div>
                                            )}

                                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                                {message.sources.map((source, idx) => {
                                                    const getSourceIcon = (source) => {
                                                        if (source.source?.includes('ol-map')) return Map;
                                                        if (source.source?.includes('ma-lib')) return Book;
                                                        if (source.source?.includes('plugin')) return Layers;
                                                        if (source.type === 'code') return Code;
                                                        return FileText;
                                                    };

                                                    const Icon = getSourceIcon(source);
                                                    const similarity = source.similarity ? ` (${(source.similarity * 100).toFixed(0)}%)` : '';

                                                    // Determine source type for validation
                                                    const sourceType = source.source?.includes('ol-map') ? 'ol-map' :
                                                        source.source?.includes('ma-lib') ? 'ma-lib' :
                                                            source.source?.includes('plugin') ? 'plugin' : 'other';

                                                    // Check if this source should be included based on context
                                                    const shouldBeIncluded = message.contextSettings ? (
                                                        (sourceType === 'ol-map' && message.contextSettings.includeOlMap) ||
                                                        (sourceType === 'ma-lib' && message.contextSettings.includeMaLib) ||
                                                        (sourceType === 'plugin' && message.contextSettings.includePlugins) ||
                                                        (source.type !== 'code' && message.contextSettings.includeDocs)
                                                    ) : true;

                                                    return (
                                                        <div
                                                            key={idx}
                                                            className={`text-xs bg-gray-50 rounded px-3 py-2 border transition-colors ${shouldBeIncluded
                                                                ? 'border-gray-200 hover:bg-gray-100'
                                                                : 'border-red-200 bg-red-50 hover:bg-red-100'
                                                                }`}
                                                        >
                                                            <div className="flex items-center space-x-1 mb-1">
                                                                <Icon size={12} className="text-gray-500" />
                                                                <span className="font-medium text-gray-700">
                                                                    {source.source?.split('/').pop() || 'Unknown'}
                                                                </span>
                                                                {similarity && (
                                                                    <span className="text-gray-500">{similarity}</span>
                                                                )}
                                                                {!shouldBeIncluded && (
                                                                    <span className="text-red-600 text-xs">⚠️</span>
                                                                )}
                                                            </div>
                                                            <div className="text-gray-500 truncate">
                                                                {source.source} - {source.type}
                                                            </div>
                                                            <div className="text-xs text-gray-400 mt-1">
                                                                Type: {sourceType}
                                                            </div>
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                ))}

                {loading && (
                    <div className="flex justify-start">
                        <div className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
                            <div className="flex items-center space-x-3">
                                <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                                    <Bot size={20} className="text-blue-600" />
                                </div>
                                <div className="flex items-center space-x-2">
                                    <Cpu size={16} className="text-gray-400 animate-pulse" />
                                    <span className="text-sm text-gray-600">Processing with Penta-B context...</span>
                                    <div className="flex space-x-1">
                                        <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce"></div>
                                        <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                                        <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                <div ref={messagesEndRef} />
            </div>

            {/* Enhanced Input */}
            <div className="p-4 border-t border-gray-200 bg-white">
                <div className="flex space-x-3">
                    <div className="flex-1 relative">
                        <input
                            type="text"
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            onKeyPress={(e) => e.key === 'Enter' && !e.shiftKey && sendMessage()}
                            placeholder={`Ask about ${intent === 'qa' ? 'ol-map, ma-lib, or plugins...' :
                                intent === 'field_generation' ? 'the field component you need...' :
                                    intent === 'plugin_generation' ? 'the plugin functionality you want...' :
                                        intent === 'architecture_explanation' ? 'the component architecture...' :
                                            'improvements for your code...'
                                }`}
                            className="w-full px-4 py-3 pr-12 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            disabled={loading}
                        />
                        <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                            <Search size={16} className="text-gray-400" />
                        </div>
                    </div>
                    <button
                        onClick={() => sendMessage()}
                        disabled={loading || !input.trim()}
                        className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center space-x-2"
                    >
                        <Send size={20} />
                        <span className="hidden sm:inline">Send</span>
                    </button>
                </div>

                {/* Context indicator */}
                <div className="mt-2 flex items-center justify-between text-xs text-gray-500">
                    <div className="flex items-center space-x-2">
                        <span className="font-medium">Active Context:</span>
                        {contextSettings.includeOlMap && (
                            <span className="bg-purple-100 text-purple-700 px-2 py-1 rounded flex items-center space-x-1">
                                <Map size={10} />
                                <span>Ol-Map</span>
                            </span>
                        )}
                        {contextSettings.includeMaLib && (
                            <span className="bg-orange-100 text-orange-700 px-2 py-1 rounded flex items-center space-x-1">
                                <Book size={10} />
                                <span>Ma-Lib</span>
                            </span>
                        )}
                        {contextSettings.includePlugins && (
                            <span className="bg-blue-100 text-blue-700 px-2 py-1 rounded flex items-center space-x-1">
                                <Layers size={10} />
                                <span>Plugins</span>
                            </span>
                        )}
                        {contextSettings.includeDocs && (
                            <span className="bg-green-100 text-green-700 px-2 py-1 rounded flex items-center space-x-1">
                                <FileText size={10} />
                                <span>Docs</span>
                            </span>
                        )}
                        {!contextSettings.includeOlMap && !contextSettings.includeMaLib &&
                            !contextSettings.includePlugins && !contextSettings.includeDocs && (
                                <span className="bg-red-100 text-red-700 px-2 py-1 rounded text-xs">
                                    ⚠️ No sources selected
                                </span>
                            )}
                    </div>
                    <span className="bg-gray-100 text-gray-600 px-2 py-1 rounded">
                        Max: {contextSettings.maxSources} sources
                    </span>
                </div>
            </div>

            <style jsx>{`
                .code-block {
                    background: #f8f9fa;
                    border: 1px solid #e9ecef;
                    border-radius: 6px;
                    margin: 12px 0;
                    overflow: hidden;
                }
                .code-header {
                    background: #e9ecef;
                    padding: 8px 12px;
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    font-size: 12px;
                    color: #6c757d;
                }
                .copy-btn {
                    background: #007bff;
                    color: white;
                    border: none;
                    padding: 4px 8px;
                    border-radius: 4px;
                    cursor: pointer;
                    font-size: 11px;
                }
                .copy-btn:hover {
                    background: #0056b3;
                }
                .code-block pre {
                    margin: 0;
                    padding: 16px;
                    overflow-x: auto;
                    background: #f8f9fa;
                }
                .code-block code {
                    font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
                    font-size: 13px;
                    line-height: 1.4;
                }
                .inline-code {
                    background: #f1f3f4;
                    padding: 2px 4px;
                    border-radius: 3px;
                    font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
                    font-size: 0.9em;
                    color: #d73a49;
                }
                .slider {
                    -webkit-appearance: none;
                    appearance: none;
                    background: linear-gradient(to right, #3b82f6 0%, #3b82f6 ${((contextSettings.maxSources - 5) / 15) * 100}%, #e5e7eb ${((contextSettings.maxSources - 5) / 15) * 100}%, #e5e7eb 100%);
                    outline: none;
                }
                .slider::-webkit-slider-thumb {
                    -webkit-appearance: none;
                    appearance: none;
                    width: 20px;
                    height: 20px;
                    border-radius: 50%;
                    background: #3b82f6;
                    cursor: pointer;
                    border: 2px solid #ffffff;
                    box-shadow: 0 2px 4px rgba(0,0,0,0.2);
                }
                .slider::-moz-range-thumb {
                    width: 20px;
                    height: 20px;
                    border-radius: 50%;
                    background: #3b82f6;
                    cursor: pointer;
                    border: 2px solid #ffffff;
                    box-shadow: 0 2px 4px rgba(0,0,0,0.2);
                }
            `}</style>
        </div>
    );
}
export default ChatInterface;