/** Shared API types — this is the "contract" the frontend and backend agree on. */

export type Role = "user" | "assistant" | "agent";

export type { OrderCard } from "@/db/schema";

/** Response shape for POST /api/chat.
 *  Base contract: { response, escalated }
 *  Extensions are optional so old clients keep working. */
export type ChatResponse = {
  response: string;
  escalated: boolean;
  /** true only on the exact turn the handoff happened */
  handoffJustHappened?: boolean;
  escalationRef?: string | null;
  quickReplies?: string[];
  orderCard?: import("@/db/schema").OrderCard | null;
};

export type TranscriptMessage = {
  id: number;
  role: Role;
  content: string;
  createdAt: string;
  orderCard?: import("@/db/schema").OrderCard | null;
};

export type TranscriptResponse = {
  sessionId: string;
  escalated: boolean;
  escalationRef: string | null;
  messages: TranscriptMessage[];
};

export type DeskSession = {
  sessionId: number;
  token: string;
  escalated: boolean;
  escalationRef: string | null;
  escalationReason: string | null;
  escalationStatus: string | null;
  createdAt: string;
  lastMessageAt: string;
  messages: TranscriptMessage[];
};

export type DeskResponse = {
  sessions: DeskSession[];
  stats: {
    totalConversations: number;
    openEscalations: number;
    resolved: number;
  };
};
