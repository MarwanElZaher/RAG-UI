import React, { useState, useEffect, useRef } from 'react';
import { Bot, User, Send, MessageCircle, Code, Layers, FileText, TrendingUp } from 'lucide-react';
import useApi from '../hooks/useApi';

const ChatInterface = () => {
    const [messages, setMessages] = useState([]);
    const [input, setInput] = useState('');
    const [intent, setIntent] = useState('qa');
    const messagesEndRef = useRef(null);
    const { request, loading } = useApi();

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    const sendMessage = async () => {
        if (!input.trim()) return;

        const userMessage = {
            id: Date.now(),
            role: 'user',
            content: input,
            timestamp: new Date(),
        };

        setMessages(prev => [...prev, userMessage]);
        const currentInput = input;
        setInput('');

        try {
            const response = await request('/chat', {
                method: 'POST',
                body: JSON.stringify({
                    message: currentInput,
                    intent,
                }),
            });

            setMessages(prev => [...prev, response]);
        } catch (error) {
            console.error('Chat error:', error);
        }
    };

    const intentOptions = [
        { value: 'qa', label: 'Q&A', icon: MessageCircle },
        { value: 'field_generation', label: 'Generate Field', icon: Code },
        { value: 'plugin_generation', label: 'Generate Plugin', icon: Layers },
        { value: 'architecture_explanation', label: 'Explain Architecture', icon: FileText },
        { value: 'improvement_suggestions', label: 'Suggest Improvements', icon: TrendingUp },
    ];

    return (
        <div className="flex flex-col h-full">
            {/* Intent Selector */}
            <div className="p-4 border-b border-gray-200 bg-gray-50">
                <div className="flex flex-wrap gap-2">
                    {intentOptions.map(({ value, label, icon: Icon }) => (
                        <button
                            key={value}
                            onClick={() => setIntent(value)}
                            className={`flex items-center space-x-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${intent === value
                                ? 'bg-blue-600 text-white'
                                : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-300'
                                }`}
                        >
                            <Icon size={16} />
                            <span>{label}</span>
                        </button>
                    ))}
                </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {messages.length === 0 && (
                    <div className="text-center text-gray-500 py-8">
                        <Bot size={48} className="mx-auto mb-4 text-gray-400" />
                        <h3 className="text-lg font-medium mb-2">Welcome to Penta-B RAG Assistant</h3>
                        <p>Ask questions about your codebase, generate components, or get architecture insights.</p>
                    </div>
                )}

                {messages.map((message) => (
                    <div
                        key={message.id}
                        className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                    >
                        <div
                            className={`max-w-3xl rounded-lg p-4 ${message.role === 'user'
                                ? 'bg-blue-600 text-white'
                                : 'bg-white border border-gray-200 shadow-sm'
                                }`}
                        >
                            <div className="flex items-start space-x-3">
                                {message.role === 'assistant' && (
                                    <Bot size={20} className="text-blue-600 mt-1 flex-shrink-0" />
                                )}
                                {message.role === 'user' && (
                                    <User size={20} className="text-white mt-1 flex-shrink-0" />
                                )}
                                <div className="flex-1">
                                    <pre className="whitespace-pre-wrap font-sans">{message.content}</pre>
                                    {message.sources && message.sources.length > 0 && (
                                        <div className="mt-3 pt-3 border-t border-gray-200">
                                            <p className="text-sm font-medium text-gray-600 mb-2">Sources:</p>
                                            <div className="space-y-1">
                                                {message.sources.map((source, idx) => (
                                                    <div key={idx} className="text-xs text-gray-500 bg-gray-50 rounded px-2 py-1">
                                                        {source.source} - {source.type}
                                                    </div>
                                                ))}
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
                                <Bot size={20} className="text-blue-600" />
                                <div className="flex space-x-1">
                                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <div className="p-4 border-t border-gray-200">
                <div className="flex space-x-3">
                    <input
                        type="text"
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
                        placeholder="Ask about your codebase, request field generation, or get architecture insights..."
                        className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        disabled={loading}
                    />
                    <button
                        onClick={sendMessage}
                        disabled={loading || !input.trim()}
                        className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                        <Send size={20} />
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ChatInterface;