/** A clinic video shown in the About page's video section. */
export interface ClinicVideo {
  id?: string;
  title: string;
  description: string;
  videoUrl: string;
  posterUrl?: string;
  /** Intrinsic size captured at upload — lets the page reserve the right
   *  aspect ratio before the video loads (no layout jump). */
  width?: number;
  height?: number;
}

/** Public chatbot widget config (snapshotted to assets/data/chatbot.json). */
export interface ChatbotConfig {
  isEnabled: boolean;
  botName: string;
  welcomeMessage: string;
  maxMessages: number;
  handoffMessage: string;
  suggestions: string[];
}

export interface ChatMsg {
  role: 'user' | 'assistant';
  content: string;
}
