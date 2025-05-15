export interface OllamaModel {
  name: string;
  model: string;
  modified_at: string;
  size: number;
  digest: string;
  details: {
    parameter_size?: string;
    quantization_level?: string;
    format?: string;
  };
}

export interface OllamaModelsList {
  models: OllamaModel[];
}

export interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
  timestamp?: Date;
}

export interface Chat {
  id: string;
  title: string;
  messages: ChatMessage[];
  model: string;
  systemPrompt: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface GenerateRequestOptions {
  model: string;
  prompt: string;
  system?: string;
  template?: string;
  context?: number[];
  stream?: boolean;
  raw?: boolean;
  format?: string;
  options?: {
    num_keep?: number;
    seed?: number;
    num_predict?: number;
    top_k?: number;
    top_p?: number;
    tfs_z?: number;
    typical_p?: number;
    repeat_last_n?: number;
    temperature?: number;
    repeat_penalty?: number;
    presence_penalty?: number;
    frequency_penalty?: number;
    mirostat?: number;
    mirostat_tau?: number;
    mirostat_eta?: number;
    penalize_newline?: boolean;
    stop?: string[];
  };
}

export interface ChatRequestOptions {
  model: string;
  messages: ChatMessage[];
  stream?: boolean;
  format?: string;
  options?: {
    num_ctx?: number;
    temperature?: number;
    top_p?: number;
    top_k?: number;
    stop?: string[];
  };
}

export interface GenerateResponse {
  model: string;
  created_at: string;
  response: string;
  done: boolean;
  context?: number[];
  total_duration?: number;
  load_duration?: number;
  prompt_eval_duration?: number;
  eval_count?: number;
  eval_duration?: number;
}