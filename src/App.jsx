import React, { useState } from 'react';
import { MessageCircle, Database, Upload, Bot, Figma } from 'lucide-react';
import ChatInterface from './components/ChatInterface';
import DatabaseManager from './components/DataBaseManager';
import IngestionManager from './components/IngestionManager';
import MemoryAnalytics from './components/MemoryAnalytics';
import MemorySettings from './components/MemorySettings';
import ConversationSearchManager from './components/ConversationSearchManager';
import FigmaImporter from './components/FigmaImporter';
const App = () => {
    const [activeTab, setActiveTab] = useState('chat');

    const tabs = [
        { id: 'chat', label: 'Chat', icon: MessageCircle, component: ChatInterface },
        { id: 'figma', label: 'Figma Import', icon: Figma, component: FigmaImporter },
        { id: 'database', label: 'Database', icon: Database, component: DatabaseManager },
        { id: 'ingestion', label: 'Ingestion', icon: Upload, component: IngestionManager },
        { id: 'memoryAnalytics', label: 'Memory Analytics', icon: Bot, component: MemoryAnalytics },
        { id: 'memorySettings', label: 'Memory Settings', icon: Bot, component: MemorySettings },
        { id: 'conversationSearchManager', label: 'Conversation Search Manager', icon: Bot, component: ConversationSearchManager }
    ];

    const ActiveComponent = tabs.find(tab => tab.id === activeTab)?.component;

    return (
        <div className='flex flex-col h-screen'>
            <div className='flex flex-shrink-0 flex-col bg-gray-50 border-b border-gray-200'>
                {/* Header */}
                <header className="bg-white border-b border-gray-200">
                    <div className="px-6 py-4">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-4">
                                <div className="flex items-center space-x-2">
                                    <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                                        <Bot size={20} className="text-white" />
                                    </div>
                                    <h1 className="text-xl font-bold text-gray-900">Penta-B RAG System</h1>
                                </div>
                            </div>
                            <div className="flex items-center space-x-4">
                                <div className="text-sm text-gray-500">
                                    Company Knowledge Assistant
                                </div>
                            </div>
                        </div>
                    </div>
                </header>

                {/* Navigation */}
                <nav className="bg-white border-b border-gray-200">
                    <div className="px-6">
                        <div className="flex space-x-8">
                            {tabs.map(({ id, label, icon: Icon }) => (
                                <button
                                    key={id}
                                    onClick={() => setActiveTab(id)}
                                    className={`flex items-center space-x-2 px-1 py-4 border-b-2 font-medium text-sm transition-colors ${activeTab === id
                                        ? 'border-blue-500 text-blue-600'
                                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                                        }`}
                                >
                                    <Icon size={18} />
                                    <span>{label}</span>
                                </button>
                            ))}
                        </div>
                    </div>
                </nav>
            </div>
            {/* Main Content */}
            <main className="p-6 flex-1 overflow-y-auto">
                {ActiveComponent && <ActiveComponent />}
            </main>
        </div>
    );
};

export default App;