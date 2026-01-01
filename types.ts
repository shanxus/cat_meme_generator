
export enum MemeType {
  PHOTO = 'PHOTO'
}

export enum GenerationStatus {
  IDLE = 'IDLE',
  UPLOADING = 'UPLOADING',
  GENERATING = 'GENERATING',
  SUCCESS = 'SUCCESS',
  ERROR = 'ERROR'
}

export interface MemeItem {
  id: string;
  type: MemeType;
  url: string;
  thumbnailUrl?: string;
  prompt: string;
  createdAt: number;
}

export interface MemeCaptions {
  topText: string;
  bottomText: string;
}

/**
 * Interface representing the global AI Studio key management utility.
 * We declare it here to ensure compatibility with existing environmental types.
 */
export interface AIStudio {
  hasSelectedApiKey: () => Promise<boolean>;
  openSelectKey: () => Promise<void>;
}

declare global {
  interface Window {
    // Fixed: Removed 'readonly' modifier and used 'any' to resolve conflicts with 
    // internal SDK types and avoid the "must be of type AIStudio but here has type AIStudio" error.
    aistudio: any;
  }
}