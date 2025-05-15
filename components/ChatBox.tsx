import { useState, useEffect, useRef } from 'react';
import { Chat, ChatMessage } from '@/types/OllamaTypes';
import { loadChats, updateChat, chatCompletion } from '@/services/ollamaService';
import ReactMarkdown from 'react-markdown';

interface ChatBoxProps {
    chatId?: string;
    onClose?: () => void;
}

export default function ChatBox({ chatId, onClose }: ChatBoxProps) {
    const [chat, setChat] = useState<Chat | null>(null);
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [errorMessage, setErrorMessage] = useState<string | null>(null);
    const [activeResponse, setActiveResponse] = useState('');
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLTextAreaElement>(null);
    
    useEffect(() => {
        if (chatId) {
            loadChat(chatId);
        }
    }, [chatId]);
    
    useEffect(() => {
        scrollToBottom();
    }, [chat?.messages, activeResponse]);
    
    useEffect(() => {
        if (inputRef.current) {
            inputRef.current.focus();
        }
    }, [chat]);
    
    const loadChat = (id: string) => {
        try {
            const chats = loadChats();
            const foundChat = chats.find(c => c.id === id);
            
            if (foundChat) {
                setChat(foundChat);
                setErrorMessage(null);
            } else {
                setErrorMessage(`Chat with ID ${id} not found`);
            }
        } catch (error) {
            console.error('Error loading chat:', error);
            setErrorMessage('Failed to load chat');
        }
    };
    
    const handleSend = async () => {
        if (!input.trim() || !chat) return;
        
        try {
            // Add user message to chat
            const userMessage: ChatMessage = {
                role: 'user',
                content: input,
                timestamp: new Date()
            };
            
            const updatedChat = updateChat(chat.id, userMessage);
            setChat(updatedChat);
            setInput('');
            setIsLoading(true);
            setActiveResponse('');
            
            // Prepare messages for API, including system prompt if present
            const messages: ChatMessage[] = [];
            
            if (chat.systemPrompt) {
                messages.push({
                    role: 'system',
                    content: chat.systemPrompt
                });
            }
            
            // Add all messages from chat history
            messages.push(...updatedChat.messages);
            
            // Call API with streaming
            await chatCompletion(
                {
                    model: chat.model,
                    messages,
                    stream: true,
                    options: {
                        temperature: 0.7,
                        top_p: 0.9
                    }
                },
                (chunk) => {
                    setActiveResponse(prev => prev + chunk);
                },
                (fullResponse) => {
                    // Add assistant's response to chat
                    const assistantMessage: ChatMessage = {
                        role: 'assistant',
                        content: fullResponse,
                        timestamp: new Date()
                    };
                    
                    const finalChat = updateChat(chat.id, assistantMessage);
                    setChat(finalChat);
                    setActiveResponse('');
                    setIsLoading(false);
                }
            );
        } catch (error) {
            console.error('Error sending message:', error);
            setErrorMessage('Failed to send message. Is Ollama running?');
            setIsLoading(false);
        }
    };
    
    const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSend();
        }
    };
    
    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };
    
    if (!chat) {
        return (
            <div className="flex flex-col h-full items-center justify-center bg-gray-900 text-gray-200 p-4">
                {errorMessage ? (
                    <div className="text-red-400">{errorMessage}</div>
                ) : (
                    <div>Select a chat or start a new one</div>
                )}
            </div>
        );
    }
    
    return (
        <div className="flex flex-col h-full bg-gray-900">
            <div className="border-b border-gray-700 p-4 flex justify-between items-center">
                <div>
                    <h2 className="text-xl font-semibold text-white">{chat.title}</h2>
                    <div className="text-sm text-gray-400">Model: {chat.model}</div>
                </div>
                {onClose && (
                    <button 
                        className="text-gray-400 hover:text-white"
                        onClick={onClose}
                    >
                        ✕
                    </button>
                )}
            </div>
            
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {chat.systemPrompt && (
                    <div className="bg-blue-900/30 border border-blue-700 rounded-lg p-3 mb-4">
                        <div className="text-sm font-medium text-blue-300 mb-1">System Prompt</div>
                        <div className="text-gray-300 whitespace-pre-wrap">{chat.systemPrompt}</div>
                    </div>
                )}
                
                {chat.messages.map((message, index) => (
                    <div key={index} className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                        <div 
                            className={`max-w-3/4 rounded-lg p-3 ${
                                message.role === 'user' 
                                    ? 'bg-blue-600 text-white' 
                                    : 'bg-gray-700 text-gray-200'
                            }`}
                        >
                            {message.role === 'assistant' ? (
                                <div className="prose prose-invert max-w-none">
                                    <ReactMarkdown>
                                        {message.content}
                                    </ReactMarkdown>
                                </div>
                            ) : (
                                <div className="whitespace-pre-wrap">{message.content}</div>
                            )}
                            <div className="text-xs text-opacity-70 mt-2 text-right">
                                {message.timestamp ? new Date(message.timestamp).toLocaleTimeString() : ''}
                            </div>
                        </div>
                    </div>
                ))}
                
                {activeResponse && (
                    <div className="flex justify-start">
                        <div className="max-w-3/4 rounded-lg p-3 bg-gray-700 text-gray-200">
                            <div className="prose prose-invert max-w-none">
                                <ReactMarkdown>
                                    {activeResponse}
                                </ReactMarkdown>
                            </div>
                            <div className="mt-2 text-blue-400 text-sm animate-pulse">
                                Generating...
                            </div>
                        </div>
                    </div>
                )}
                
                <div ref={messagesEndRef} />
            </div>
            
            <div className="border-t border-gray-700 p-4">
                {errorMessage && (
                    <div className="bg-red-500/20 border border-red-500 text-red-200 p-2 mb-2 rounded text-sm">
                        {errorMessage}
                        <button 
                            className="ml-2 text-red-300 hover:text-red-100"
                            onClick={() => setErrorMessage(null)}
                        >
                            ✕
                        </button>
                    </div>
                )}
                <div className="flex items-end space-x-2">
                    <textarea
                        ref={inputRef}
                        className="flex-1 bg-gray-800 text-white border border-gray-700 rounded-lg p-3 focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                        placeholder="Send a message..."
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyDown={handleKeyDown}
                        rows={3}
                        disabled={isLoading}
                    />
                    <button
                        className={`bg-blue-600 hover:bg-blue-700 text-white px-4 py-3 rounded-lg flex-shrink-0 ${
                            isLoading || !input.trim() ? 'opacity-50 cursor-not-allowed' : ''
                        }`}
                        onClick={handleSend}
                        disabled={isLoading || !input.trim()}
                    >
                        {isLoading ? (
                            <span className="animate-pulse">...</span>
                        ) : (
                            <span>Send</span>
                        )}
                    </button>
                </div>
                <div className="text-xs text-gray-500 mt-2">
                    Press Enter to send, Shift+Enter for new line
                </div>
            </div>
        </div>
    );
}