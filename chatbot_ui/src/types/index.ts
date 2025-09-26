export interface SessionSelections {
  what_chatbot?: string;
  channels?: string;
  audience?: string;
  contact?: ContactData;
  [key: string]: unknown;
}

export interface ContactData {
  name: string;
  email: string;
  company: string;
  note: string;
}

export interface Message {
  id: string;
  role: 'User' | 'Assistant';
  content: string;
  components?: React.ReactNode;
  details?: Record<string, unknown>;
}

export interface FlowStep {
  assistant: string;
  tag?: string;
  message_template?: string;
}

export interface Flow {
  start_triggers: string[];
  continue_prefix: string;
  sequence: FlowStep[];
}

export interface FlowsData {
  greeting: string;
  thank_you: string;
  flows: Record<string, Flow>;
}

export interface ChatResponse {
  answer: string;
  citations: Array<{
    source_title: string;
    document_uri: string;
    chunk_index: number;
    snippet: string;
    fused_score: number;
  }>;
  retrieval_metadata: Record<string, unknown>;
}
