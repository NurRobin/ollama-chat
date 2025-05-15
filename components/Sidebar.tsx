import { useEffect, useState } from "react";
import { ChatPreview } from "@/types/ChatPreview";
import { OllamaModel } from "@/types/OllamaTypes";
import { loadChats, createNewChat, deleteChat, listModels, pullModel, deleteModel } from "@/services/ollamaService";

interface SidebarProps {
    onChatSelect: (chatId: string) => void;
    onNewChat: (model: string, systemPrompt: string) => void;
    selectedChatId?: string;
}

export default function Sidebar({ onChatSelect, onNewChat, selectedChatId }: SidebarProps) {
    const [chatPreviews, setChatPreviews] = useState<ChatPreview[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [models, setModels] = useState<OllamaModel[]>([]);
    const [isModelLoading, setIsModelLoading] = useState(false);
    const [isModelsExpanded, setIsModelsExpanded] = useState(false);
    const [newModelName, setNewModelName] = useState("");
    const [systemPrompt, setSystemPrompt] = useState("");
    const [activeTab, setActiveTab] = useState<"chats" | "models">("chats");
    const [pullProgress, setPullProgress] = useState<{[key: string]: boolean}>({});
    const [error, setError] = useState<string | null>(null);
    
    useEffect(() => {
        loadChatPreviews();
        loadModelList();
    }, []);

    const loadChatPreviews = () => {
        try {
            const chats = loadChats();
            const previews: ChatPreview[] = chats.map(chat => ({
                id: chat.id,
                title: chat.title,
                lastMessage: chat.messages.length > 0 ? 
                    chat.messages[chat.messages.length - 1].content.substring(0, 50) + 
                    (chat.messages[chat.messages.length - 1].content.length > 50 ? "..." : "") : 
                    "No messages yet",
                timestamp: chat.updatedAt,
                model: chat.model
            }));
            
            // Sort by latest first
            previews.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
            setChatPreviews(previews);
            setIsLoading(false);
        } catch (err) {
            console.error("Failed to load chat previews:", err);
            setError("Failed to load chats");
            setIsLoading(false);
        }
    };

    const loadModelList = async () => {
        try {
            setIsModelLoading(true);
            const modelList = await listModels();
            setModels(modelList);
            setIsModelLoading(false);
        } catch (err) {
            console.error("Failed to load models:", err);
            setError("Failed to load models. Is Ollama running?");
            setIsModelLoading(false);
        }
    };

    const handleDeleteChat = (chatId: string, event: React.MouseEvent) => {
        event.stopPropagation();
        try {
            deleteChat(chatId);
            setChatPreviews(previews => previews.filter(chat => chat.id !== chatId));
        } catch (err) {
            console.error("Failed to delete chat:", err);
            setError("Failed to delete chat");
        }
    };

    const handleNewChat = (model: string) => {
        onNewChat(model, systemPrompt);
    };

    const handlePullModel = async () => {
        if (!newModelName.trim()) return;
        
        try {
            setPullProgress({...pullProgress, [newModelName]: true});
            await pullModel(newModelName);
            await loadModelList();
            setNewModelName("");
        } catch (err) {
            console.error("Failed to pull model:", err);
            setError(`Failed to pull model: ${newModelName}`);
        } finally {
            setPullProgress({...pullProgress, [newModelName]: false});
        }
    };

    const handleDeleteModel = async (modelName: string) => {
        try {
            await deleteModel(modelName);
            await loadModelList();
        } catch (err) {
            console.error("Failed to delete model:", err);
            setError(`Failed to delete model: ${modelName}`);
        }
    };

    return (
        <div className="flex flex-col h-full bg-gradient-to-b from-gray-800 to-gray-900 text-white w-72 overflow-hidden">
            <div className="p-4 border-b border-gray-700 flex justify-between items-center">
                <h1 className="text-xl font-semibold">Ollama Chat</h1>
            </div>
            
            {error && (
                <div className="bg-red-500 text-white p-2 text-sm">
                    {error}
                    <button 
                        className="ml-2 text-white hover:text-gray-200"
                        onClick={() => setError(null)}
                    >
                        ✕
                    </button>
                </div>
            )}
            
            <div className="flex border-b border-gray-700">
                <button 
                    className={`flex-1 py-2 text-center ${activeTab === 'chats' ? 'bg-gray-700' : ''}`}
                    onClick={() => setActiveTab('chats')}
                >
                    Chats
                </button>
                <button 
                    className={`flex-1 py-2 text-center ${activeTab === 'models' ? 'bg-gray-700' : ''}`}
                    onClick={() => setActiveTab('models')}
                >
                    Models
                </button>
            </div>
            
            {activeTab === 'chats' ? (
                <>
                    <div className="p-4 border-b border-gray-700">
                        <div className="flex flex-col gap-3">
                            <button 
                                className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-md transition"
                                onClick={() => setIsModelsExpanded(!isModelsExpanded)}
                            >
                                New Chat {isModelsExpanded ? '▲' : '▼'}
                            </button>
                            
                            {isModelsExpanded && (
                                <div className="bg-gray-700 p-3 rounded-md">
                                    <div className="mb-2">
                                        <label className="block text-sm mb-1">System Prompt</label>
                                        <textarea 
                                            className="w-full bg-gray-800 text-white rounded-md p-2 text-sm h-24"
                                            value={systemPrompt}
                                            onChange={(e) => setSystemPrompt(e.target.value)}
                                            placeholder="Optional system instructions..."
                                        />
                                    </div>
                                    <div className="text-sm mb-2">Select Model:</div>
                                    <div className="max-h-40 overflow-y-auto">
                                        {models.length === 0 ? (
                                            <div className="text-gray-400 text-sm">
                                                No models available. Pull a model first.
                                            </div>
                                        ) : (
                                            models.map(model => (
                                                <button 
                                                    key={model.name}
                                                    className="w-full text-left p-1 hover:bg-gray-600 rounded-sm mb-1 flex items-center text-sm"
                                                    onClick={() => handleNewChat(model.name)}
                                                >
                                                    <span className="truncate">{model.name}</span>
                                                </button>
                                            ))
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                    
                    <div className="flex-1 overflow-y-auto p-2">
                        <div className="space-y-1">
                            {isLoading ? (
                                <div className="text-center text-gray-400 py-4">Loading...</div>
                            ) : chatPreviews.length === 0 ? (
                                <div className="text-center text-gray-400 py-4">No chats yet</div>
                            ) : (
                                chatPreviews.map((chat) => (
                                    <div 
                                        key={chat.id} 
                                        className={`px-3 py-2 rounded-md cursor-pointer hover:bg-gray-700 flex justify-between group ${selectedChatId === chat.id ? 'bg-gray-700' : ''}`}
                                        onClick={() => onChatSelect(chat.id)}
                                    >
                                        <div className="overflow-hidden">
                                            <div className="font-medium truncate">{chat.title}</div>
                                            <div className="text-xs text-gray-400 truncate">
                                                {chat.model}
                                            </div>
                                            <div className="text-sm text-gray-300 truncate">
                                                {chat.lastMessage}
                                            </div>
                                            <div className="text-xs text-gray-500 mt-1">
                                                {chat.timestamp.toLocaleString()}
                                            </div>
                                        </div>
                                        <button 
                                            className="text-gray-400 hover:text-red-400 opacity-0 group-hover:opacity-100"
                                            onClick={(e) => handleDeleteChat(chat.id, e)}
                                        >
                                            ✕
                                        </button>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                </>
            ) : (
                <div className="flex-1 overflow-y-auto p-4">
                    <div className="mb-4">
                        <h3 className="text-lg font-medium mb-2">Available Models</h3>
                        {isModelLoading ? (
                            <div className="text-center text-gray-400 py-4">Loading models...</div>
                        ) : (
                            <>
                                {models.length === 0 ? (
                                    <div className="text-center text-gray-400 py-4">
                                        No models available
                                    </div>
                                ) : (
                                    <div className="space-y-2">
                                        {models.map(model => (
                                            <div 
                                                key={model.name}
                                                className="bg-gray-700 rounded-md p-3 group"
                                            >
                                                <div className="flex items-center justify-between">
                                                    <div className="font-medium">{model.name}</div>
                                                    <button 
                                                        className="text-gray-400 hover:text-red-400"
                                                        onClick={() => handleDeleteModel(model.name)}
                                                    >
                                                        Delete
                                                    </button>
                                                </div>
                                                <div className="text-xs text-gray-400 mt-1">
                                                    Size: {(model.size / (1024*1024*1024)).toFixed(1)} GB
                                                </div>
                                                {model.details && (
                                                    <div className="text-xs text-gray-400">
                                                        {model.details.parameter_size && `Parameters: ${model.details.parameter_size}`}
                                                        {model.details.quantization_level && ` • Q${model.details.quantization_level}`}
                                                    </div>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </>
                        )}
                    </div>
                    
                    <div className="bg-gray-700 rounded-md p-3">
                        <h3 className="text-lg font-medium mb-2">Pull New Model</h3>
                        <div className="flex items-center space-x-2">
                            <input 
                                type="text"
                                className="flex-1 bg-gray-800 text-white rounded-md p-2 text-sm"
                                value={newModelName}
                                onChange={(e) => setNewModelName(e.target.value)}
                                placeholder="e.g., llama3:8b-instruct-q4_0"
                            />
                            <button 
                                className={`bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-md ${pullProgress[newModelName] ? 'opacity-50' : ''}`}
                                onClick={handlePullModel}
                                disabled={pullProgress[newModelName] || !newModelName.trim()}
                            >
                                {pullProgress[newModelName] ? 'Pulling...' : 'Pull'}
                            </button>
                        </div>
                        <div className="text-xs text-gray-400 mt-2">
                            Enter model name from the Ollama library like llama3, mistral, llava etc.
                        </div>
                    </div>
                </div>
            )}
            
            <div className="p-3 border-t border-gray-700">
                <div className="text-xs text-gray-500">
                    Ollama Chat • {new Date().getFullYear()}
                </div>
            </div>
        </div>
    );
}