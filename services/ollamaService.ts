import { 
  OllamaModel, 
  OllamaModelsList, 
  GenerateRequestOptions, 
  ChatRequestOptions, 
  GenerateResponse,
  Chat,
  ChatMessage 
} from '@/types/OllamaTypes';

const OLLAMA_API_URL = 'http://localhost:11434'; // Default Ollama URL

export async function listModels(): Promise<OllamaModel[]> {
  try {
    const response = await fetch(`${OLLAMA_API_URL}/api/tags`);
    if (!response.ok) {
      throw new Error(`Failed to fetch models: ${response.statusText}`);
    }
    const data: OllamaModelsList = await response.json();
    return data.models;
  } catch (error) {
    console.error("Error fetching models:", error);
    throw error;
  }
}

export async function pullModel(modelName: string): Promise<Response> {
  try {
    const response = await fetch(`${OLLAMA_API_URL}/api/pull`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ name: modelName })
    });
    
    if (!response.ok) {
      throw new Error(`Failed to pull model: ${response.statusText}`);
    }
    
    return response;
  } catch (error) {
    console.error("Error pulling model:", error);
    throw error;
  }
}

export async function deleteModel(modelName: string): Promise<void> {
  try {
    const response = await fetch(`${OLLAMA_API_URL}/api/delete`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ name: modelName })
    });
    
    if (!response.ok) {
      throw new Error(`Failed to delete model: ${response.statusText}`);
    }
  } catch (error) {
    console.error("Error deleting model:", error);
    throw error;
  }
}

export async function generateCompletion(options: GenerateRequestOptions): Promise<GenerateResponse> {
  try {
    const response = await fetch(`${OLLAMA_API_URL}/api/generate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(options)
    });
    
    if (!response.ok) {
      throw new Error(`Failed to generate completion: ${response.statusText}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error("Error generating completion:", error);
    throw error;
  }
}

export async function streamCompletion(options: GenerateRequestOptions, 
  onChunk: (chunk: string) => void, 
  onComplete: (fullResponse: string) => void) {
  
  try {
    const response = await fetch(`${OLLAMA_API_URL}/api/generate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({...options, stream: true})
    });
    
    if (!response.ok) {
      throw new Error(`Failed to stream completion: ${response.statusText}`);
    }
    
    const reader = response.body?.getReader();
    if (!reader) {
      throw new Error('Failed to create stream reader');
    }
    
    let fullResponse = '';
    const decoder = new TextDecoder();
    
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      
      const chunk = decoder.decode(value);
      const lines = chunk.split('\n').filter(line => line.trim());
      
      for (const line of lines) {
        try {
          const data = JSON.parse(line);
          onChunk(data.response);
          fullResponse += data.response;
          
          if (data.done) {
            onComplete(fullResponse);
            return;
          }
        } catch (error) {
          console.error("Error parsing stream chunk:", error);
        }
      }
    }
  } catch (error) {
    console.error("Error streaming completion:", error);
    throw error;
  }
}

export async function chatCompletion(options: ChatRequestOptions, 
  onChunk?: (chunk: string) => void, 
  onComplete?: (fullResponse: string) => void) {
  
  try {
    const response = await fetch(`${OLLAMA_API_URL}/api/chat`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(options)
    });
    
    if (!response.ok) {
      throw new Error(`Failed to get chat completion: ${response.statusText}`);
    }
    
    if (options.stream && onChunk && onComplete) {
      const reader = response.body?.getReader();
      if (!reader) {
        throw new Error('Failed to create stream reader');
      }
      
      let fullResponse = '';
      const decoder = new TextDecoder();
      
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        
        const chunk = decoder.decode(value);
        const lines = chunk.split('\n').filter(line => line.trim());
        
        for (const line of lines) {
          try {
            const data = JSON.parse(line);
            onChunk(data.message.content);
            fullResponse += data.message.content;
            
            if (data.done) {
              onComplete(fullResponse);
              return;
            }
          } catch (error) {
            console.error("Error parsing stream chunk:", error);
          }
        }
      }
    } else {
      return await response.json();
    }
  } catch (error) {
    console.error("Error in chat completion:", error);
    throw error;
  }
}

// Local storage for chats
const CHATS_STORAGE_KEY = 'ollama-chats';

// Helper to save chats to local storage
function saveChatsToStorage(chats: Chat[]): void {
  localStorage.setItem(CHATS_STORAGE_KEY, JSON.stringify(chats));
}

// Load chats from local storage
export function loadChats(): Chat[] {
  try {
    const chatsJson = localStorage.getItem(CHATS_STORAGE_KEY);
    if (!chatsJson) return [];
    
    const chats: Chat[] = JSON.parse(chatsJson);
    return chats.map(chat => ({
      ...chat,
      createdAt: new Date(chat.createdAt),
      updatedAt: new Date(chat.updatedAt),
    }));
  } catch (error) {
    console.error("Error loading chats:", error);
    return [];
  }
}

// Save a new chat
export function saveChat(chat: Chat): void {
  const chats = loadChats();
  const existingIndex = chats.findIndex(c => c.id === chat.id);
  
  if (existingIndex >= 0) {
    chats[existingIndex] = chat;
  } else {
    chats.push(chat);
  }
  
  saveChatsToStorage(chats);
}

// Delete a chat
export function deleteChat(chatId: string): void {
  const chats = loadChats();
  const updatedChats = chats.filter(chat => chat.id !== chatId);
  saveChatsToStorage(updatedChats);
}

// Create a new chat
export function createNewChat(model: string, title?: string, systemPrompt: string = ''): Chat {
  const newChat: Chat = {
    id: `chat-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    title: title || `New Chat ${new Date().toLocaleTimeString()}`,
    messages: [],
    model,
    systemPrompt,
    createdAt: new Date(),
    updatedAt: new Date()
  };
  
  saveChat(newChat);
  return newChat;
}

// Update a chat with a new message
export function updateChat(chatId: string, message: ChatMessage): Chat {
  const chats = loadChats();
  const chatIndex = chats.findIndex(chat => chat.id === chatId);
  
  if (chatIndex === -1) {
    throw new Error(`Chat with ID ${chatId} not found`);
  }
  
  const chat = chats[chatIndex];
  chat.messages.push({...message, timestamp: new Date()});
  chat.updatedAt = new Date();
  
  if (chat.messages.length === 1 && message.role === 'user') {
    // If this is the first user message, use it to create a better title
    chat.title = message.content.substring(0, 30) + (message.content.length > 30 ? '...' : '');
  }
  
  saveChat(chat);
  return chat;
}