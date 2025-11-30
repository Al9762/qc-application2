
export enum AppTab {
  SCANNER = 'scanner',
  DATA = 'data',
  FILES = 'files'
}

export enum Sender {
  USER = 'user',
  BOT = 'bot'
}

export interface Message {
  id: string;
  text: string;
  sender: Sender;
  timestamp: number;
  image?: string; // Base64 string for uploaded or generated images
  isError?: boolean;
}

export enum ModelType {
  FLASH = 'gemini-2.5-flash',
  PRO = 'gemini-3-pro-preview',
  IMAGE = 'gemini-2.5-flash-image'
}

export interface GenerationConfig {
  model: ModelType;
  temperature?: number;
}

export interface ScannedItem {
  id: string;
  format: string;
  code: string;
  timestamp: number;
  name?: string; // User entered name
  manualCode?: string; // User entered code
  description?: string; // AI generated description
  isLoading?: boolean;
}