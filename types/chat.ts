export interface Message {
  id?: string
  role: "user" | "assistant" | "system"
  content: string
  createdAt?: Date
}

export interface Conversation {
  id: string
  userId: string
  title: string
  createdAt: Date
  updatedAt: Date
  messages: Message[]
}

export type ChatMessage = Message

