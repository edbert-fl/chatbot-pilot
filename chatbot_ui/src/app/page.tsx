'use client';

import { useState, useEffect, useRef } from 'react';
import ChatMessage from '@/components/ChatMessage';
import ChatForm from '@/components/ChatForm';
import StatusIndicator from '@/components/StatusIndicator';
import { Message, SessionSelections, FlowsData } from '@/types';

export default function Home() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [sessionId] = useState(() => Math.random().toString(36).substring(2, 15));
  const [sessionSelections, setSessionSelections] = useState<SessionSelections>({});
  const [currentFlowId, setCurrentFlowId] = useState<string | null>(null);
  const [currentFlowStep, setCurrentFlowStep] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const chatRef = useRef<HTMLDivElement>(null);

  // Load flows data
  const [flows, setFlows] = useState<FlowsData | null>(null);

  useEffect(() => {
    // Load flows from the backend
    fetch('/api/flows')
      .then(res => res.json())
      .then(data => {
        setFlows(data);
        // Initialize with greeting and flow buttons
        if (data.greeting) {
          const greetingMessage: Message = {
            id: Math.random().toString(36).substring(2, 15),
            role: 'Assistant',
            content: `${data.greeting} [button_group_what_chatbot]`,
          };
          setMessages(prev => [...prev, greetingMessage]);
        }
      })
      .catch(console.error);
  }, []);

  // Auto-scroll to bottom when new messages are added
  useEffect(() => {
    if (chatRef.current) {
      chatRef.current.scrollTop = chatRef.current.scrollHeight;
    }
  }, [messages]);

  const addMessage = (role: 'User' | 'Assistant', content: string, details?: Record<string, unknown>) => {
    const newMessage: Message = {
      id: Math.random().toString(36).substring(2, 15),
      role,
      content,
      details,
    };
    setMessages(prev => [...prev, newMessage]);
  };

  const findFlowByStart = (text: string): string | null => {
    if (!flows) return null;
    
    const query = text.toLowerCase();
    for (const [flowId, config] of Object.entries(flows.flows)) {
      const triggers = Array.isArray(config.start_triggers) ? config.start_triggers : [];
      for (const trigger of triggers) {
        if (query.startsWith(String(trigger).toLowerCase())) {
          return flowId;
        }
      }
    }
    return null;
  };

  const sendMessage = async (query: string) => {
    if (!query.trim()) return;

    setIsLoading(true);
    addMessage('User', query);

    // Check if this query should start a flow
    const flowId = findFlowByStart(query);
    if (flowId) {
      enterFlow(flowId);
      setIsLoading(false);
      return;
    }

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query,
          session_id: sessionId,
          selections: sessionSelections,
        }),
      });

      const result = await response.json();
      addMessage('Assistant', result.answer || 'No answer', result);
    } catch (error) {
      addMessage('Assistant', `Error: ${error}`, { error: String(error) });
    } finally {
      setIsLoading(false);
    }
  };

  const getHardcodedResponse = (selections: Partial<SessionSelections>): string => {
    // Hardcoded responses based on selection type
    if (selections.what_chatbot) {
      return "Great choice! Now let's determine which channels you'd like to use for your chatbot.";
    }
    
    if (selections.channels) {
      return "Perfect! Now tell me who will be using this chatbot.";
    }
    
    if (selections.audience) {
      return "Excellent! I have all the information I need. Let me prepare a message for you to send to our team.";
    }
    
    if (selections.contact) {
      return "Thank you for providing your contact information! Your message is ready to send.";
    }
    
    return "Thanks for your selection! Let's continue.";
  };

  const sendFollowupSelection = async (selections: Partial<SessionSelections>) => {
    // Create user-friendly message
    const userMessage = createUserSelectionMessage(selections);
    addMessage('User', userMessage);

    // Store selections
    setSessionSelections(prev => ({ ...prev, ...selections }));

    // Use hardcoded responses instead of API call
    const hardcodedResponse = getHardcodedResponse(selections);
    addMessage('Assistant', hardcodedResponse);

    // Advance flow if we're in one
    if (currentFlowId && flows) {
      advanceFlow();
    }
  };

  const createUserSelectionMessage = (selections: Partial<SessionSelections>): string => {
    const messages: string[] = [];

    if (selections.what_chatbot) {
      const chatbotNames: Record<string, string> = {
        'support': 'customer support chatbot',
        'sales': 'sales assistant chatbot',
        'helpdesk': 'internal helpdesk chatbot',
        'automation': 'workflow automation chatbot'
      };
      messages.push(`I want a ${chatbotNames[selections.what_chatbot] || selections.what_chatbot}.`);
    }

    if (selections.channels) {
      const channelNames: Record<string, string> = {
        'web': 'Web',
        'mobile': 'Mobile',
        'whatsapp_sms': 'WhatsApp/SMS',
        'slack': 'Slack',
        'teams': 'Teams',
        'voice': 'Voice'
      };
      messages.push(`I want this on ${channelNames[selections.channels] || selections.channels}.`);
    }

    if (selections.audience) {
      const audienceNames: Record<string, string> = {
        'customers': 'customers',
        'prospects': 'potential customers',
        'partners': 'partners',
        'employees': 'employees',
        'agents': 'support agents'
      };
      messages.push(`I want this for ${audienceNames[selections.audience] || selections.audience}.`);
    }

    if (selections.contact) {
      messages.push('I\'ve filled out my contact information.');
    }

    return messages.join(' ');
  };

  const advanceFlow = () => {
    if (!currentFlowId || !flows) return;

    const flow = flows.flows[currentFlowId];
    if (!flow || !flow.sequence) return;

    const nextStep = currentFlowStep + 1;
    if (nextStep < flow.sequence.length) {
      setCurrentFlowStep(nextStep);
      const step = flow.sequence[nextStep];
      let messageContent = step.assistant || '';
      if (step.tag) {
        messageContent += ` [${step.tag}]`;
      }
      if (messageContent) {
        addMessage('Assistant', messageContent);
      }
    } else {
      // End of flow
      if (flows.thank_you) {
        addMessage('Assistant', flows.thank_you);
      }
      resetToStart();
    }
  };

  const resetToStart = () => {
    setCurrentFlowId(null);
    setCurrentFlowStep(0);
    if (flows?.greeting) {
      addMessage('Assistant', `${flows.greeting} [button_group_what_chatbot]`);
    }
  };

  const enterFlow = (flowId: string) => {
    if (!flows) return;

    setCurrentFlowId(flowId);
    setCurrentFlowStep(0);

    const flow = flows.flows[flowId];
    if (flow && flow.sequence && flow.sequence[0]) {
      const firstStep = flow.sequence[0];
      let messageContent = firstStep.assistant || '';
      if (firstStep.tag) {
        messageContent += ` [${firstStep.tag}]`;
      }
      if (messageContent) {
        addMessage('Assistant', messageContent);
      }
    }
  };

  const generateContactMessage = (): string => {
    const selections = sessionSelections;
    const currentFlow = currentFlowId ? flows?.flows[currentFlowId] : null;

    if (!currentFlow) return "I am looking to build a chatbot for my business. I look forward to further discussing this with you.";

    // Get chatbot type from selections or flow ID
    let chatbotType = "chatbot";
    if (selections.what_chatbot) {
      const chatbotNames: Record<string, string> = {
        'support': 'customer support chatbot',
        'sales': 'sales assistant chatbot',
        'helpdesk': 'internal helpdesk chatbot',
        'automation': 'workflow automation chatbot'
      };
      chatbotType = chatbotNames[selections.what_chatbot] || 'chatbot';
    } else if (currentFlowId === 'flow_customer_support') {
      chatbotType = "customer support chatbot";
    } else if (currentFlowId === 'flow_sales_assistant') {
      chatbotType = "sales assistant chatbot";
    } else if (currentFlowId === 'flow_internal_helpdesk') {
      chatbotType = "internal helpdesk chatbot";
    } else if (currentFlowId === 'flow_workflow_automation') {
      chatbotType = "workflow automation chatbot";
    }

    // Get channels
    let channelDetails = "";
    if (selections.channels) {
      const channelNames: Record<string, string> = {
        'web': 'website',
        'mobile': 'mobile app',
        'whatsapp_sms': 'WhatsApp/SMS',
        'slack': 'Slack',
        'teams': 'Microsoft Teams',
        'voice': 'voice calls'
      };
      channelDetails = channelNames[selections.channels] || selections.channels;
    } else {
      channelDetails = "various channels";
    }

    // Get audience
    let audienceDetails = "";
    if (selections.audience) {
      const audienceNames: Record<string, string> = {
        'customers': 'customers',
        'prospects': 'potential customers',
        'partners': 'partners',
        'employees': 'employees',
        'agents': 'support agents'
      };
      audienceDetails = audienceNames[selections.audience] || selections.audience;
    } else {
      audienceDetails = "our users";
    }

    // Generate local message templates
    const messageTemplates = [
      `Hi! I'm interested in building a ${chatbotType} for ${channelDetails} that will be used by ${audienceDetails}. I'd love to discuss this project with you.`,
      `Hello! I want to create a ${chatbotType} for ${channelDetails} to serve ${audienceDetails}. Let's schedule a call to discuss this further.`,
      `Hi there! I'm looking to build a ${chatbotType} for ${channelDetails} that will help ${audienceDetails}. I'd appreciate the opportunity to discuss this with your team.`,
      `Hello! I'm interested in developing a ${chatbotType} for ${channelDetails} to support ${audienceDetails}. I'd love to learn more about your services.`
    ];

    const randomIndex = Math.floor(Math.random() * messageTemplates.length);
    return messageTemplates[randomIndex];
  };

  return (
    <div className="min-h-screen bg-bg text-text">
      <div className="max-w-4xl mx-auto p-6">
        <header className="flex items-baseline justify-between mb-4">
          <h1 className="text-xl font-semibold text-text">Chatbot Pilot UI</h1>
          <StatusIndicator />
        </header>

        <main>
          <div 
            ref={chatRef}
            className="bg-panel border border-border rounded-lg p-4 h-[70vh] overflow-y-auto"
          >
            {messages.map((message) => (
              <ChatMessage
                key={message.id}
                message={message}
                onSelection={sendFollowupSelection}
                onEnterFlow={enterFlow}
                generateContactMessage={generateContactMessage}
                flows={flows}
                currentFlowId={currentFlowId}
                currentFlowStep={currentFlowStep}
              />
            ))}
            {isLoading && (
              <div className="text-muted text-sm">Assistant is typing...</div>
            )}
          </div>

          <ChatForm onSendMessage={sendMessage} disabled={isLoading} />
        </main>
      </div>
    </div>
  );
}