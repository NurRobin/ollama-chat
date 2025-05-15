"use client";
import ChatBox from '@/components/ChatBox';
import Sidebar from '@/components/Sidebar';
import { useState, useEffect } from 'react';
import { createNewChat } from '@/services/ollamaService';

export default function MainPage() {
    const [selectedChatId, setSelectedChatId] = useState<string | undefined>(undefined);
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const [isFirstLoad, setIsFirstLoad] = useState(true);

    useEffect(() => {
        // Check for mobile screen size
        const handleResize = () => {
            setIsMobileMenuOpen(window.innerWidth > 768);
        };

        // Initial check
        handleResize();
        
        // Add event listener
        window.addEventListener('resize', handleResize);
        
        // Cleanup
        return () => {
            window.removeEventListener('resize', handleResize);
        };
    }, []);

    const handleChatSelect = (chatId: string) => {
        setSelectedChatId(chatId);
        if (window.innerWidth <= 768) {
            setIsMobileMenuOpen(false);
        }
        setIsFirstLoad(false);
    };

    const handleNewChat = (model: string, systemPrompt: string) => {
        const newChat = createNewChat(model, undefined, systemPrompt);
        setSelectedChatId(newChat.id);
        if (window.innerWidth <= 768) {
            setIsMobileMenuOpen(false);
        }
        setIsFirstLoad(false);
    };

    const toggleSidebar = () => {
        setIsMobileMenuOpen(!isMobileMenuOpen);
    };

    return (
        <div className="flex h-screen bg-gray-900 text-white overflow-hidden">
            {/* Mobile menu button */}
            <button 
                className="md:hidden fixed top-4 left-4 z-50 bg-gray-800 p-2 rounded-md"
                onClick={toggleSidebar}
            >
                {isMobileMenuOpen ? (
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                ) : (
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                    </svg>
                )}
            </button>
            
            {/* Sidebar - hidden on mobile unless menu is open */}
            <div className={`${isMobileMenuOpen ? 'block' : 'hidden'} md:block md:relative fixed inset-0 z-40`}>
                <div 
                    className="absolute inset-0 bg-black bg-opacity-50 md:hidden"
                    onClick={() => setIsMobileMenuOpen(false)}
                ></div>
                <div className="relative z-10 h-full md:w-auto">
                    <Sidebar 
                        onChatSelect={handleChatSelect}
                        onNewChat={handleNewChat}
                        selectedChatId={selectedChatId}
                    />
                </div>
            </div>
            
            {/* Main content */}
            <div className="flex-1 overflow-hidden">
                {isFirstLoad ? (
                    <div className="flex flex-col items-center justify-center h-full bg-gradient-to-b from-gray-800 to-gray-900 p-6">
                        <div className="text-center max-w-2xl">
                            <h1 className="text-4xl font-bold mb-4">Welcome to Ollama Chat</h1>
                            <p className="text-xl text-gray-300 mb-8">
                                Your personal AI assistant powered by Ollama models
                            </p>
                            <div className="space-y-4">
                                <div className="flex items-center bg-gray-700 rounded-lg p-4">
                                    <div className="bg-blue-600 rounded-full p-2 mr-4">
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
                                        </svg>
                                    </div>
                                    <div>
                                        <h2 className="font-semibold text-lg">Browse Available Models</h2>
                                        <p className="text-gray-400">View, download, and manage AI models from the Ollama library</p>
                                    </div>
                                </div>
                                <div className="flex items-center bg-gray-700 rounded-lg p-4">
                                    <div className="bg-blue-600 rounded-full p-2 mr-4">
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                                        </svg>
                                    </div>
                                    <div>
                                        <h2 className="font-semibold text-lg">Start a New Chat</h2>
                                        <p className="text-gray-400">Create a new conversation with your selected model</p>
                                    </div>
                                </div>
                                <div className="flex items-center bg-gray-700 rounded-lg p-4">
                                    <div className="bg-blue-600 rounded-full p-2 mr-4">
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                        </svg>
                                    </div>
                                    <div>
                                        <h2 className="font-semibold text-lg">Customize System Prompts</h2>
                                        <p className="text-gray-400">Tailor AI responses with custom system instructions</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                ) : (
                    <ChatBox 
                        chatId={selectedChatId}
                        onClose={() => setIsFirstLoad(true)}
                    />
                )}
            </div>
        </div>
    );
}