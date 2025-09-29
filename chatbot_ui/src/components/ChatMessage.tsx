'use client';

import ButtonGroup from './ButtonGroup';
import ContactForm from './ContactForm';
import SendMessage from './SendMessage';
import BookDemo from './BookDemo';
import ThankYou from './ThankYou';
import { Message, FlowsData } from '@/types';

interface ChatMessageProps {
  message: Message;
  onSelection: (selections: Record<string, unknown>) => void;
  onEnterFlow: (flowId: string) => void;
  generateContactMessage: () => string;
  flows: FlowsData | null;
  currentFlowId: string | null;
  currentFlowStep: number;
}

export default function ChatMessage({
  message,
  onSelection,
  onEnterFlow,
  generateContactMessage
}: ChatMessageProps) {

  const renderComponent = (tag: string) => {
    switch (tag) {
      case 'button_group_what_chatbot':
        return (
          <ButtonGroup
            title="What kind of chatbot are you looking for?"
            options={[
              { label: 'Customer Support', value: 'support', flowId: 'flow_customer_support' },
              { label: 'Sales Assistant', value: 'sales', flowId: 'flow_sales_assistant' },
              { label: 'Internal Helpdesk', value: 'helpdesk', flowId: 'flow_internal_helpdesk' },
              { label: 'Workflow Automation', value: 'automation', flowId: 'flow_workflow_automation' },
            ]}
            selectionKey="what_chatbot"
            onSelection={onSelection}
            onEnterFlow={onEnterFlow}
          />
        );
      case 'button_group_channels':
        return (
          <ButtonGroup
            title="Which channels?"
            options={[
              { label: 'Web', value: 'web' },
              { label: 'Mobile', value: 'mobile' },
              { label: 'WhatsApp/SMS', value: 'whatsapp_sms' },
              { label: 'Slack', value: 'slack' },
              { label: 'Teams', value: 'teams' },
              { label: 'Voice', value: 'voice' },
            ]}
            selectionKey="channels"
            onSelection={onSelection}
          />
        );
      case 'button_group_audience':
        return (
          <ButtonGroup
            title="Who will use it?"
            options={[
              { label: 'Customers', value: 'customers' },
              { label: 'Prospects', value: 'prospects' },
              { label: 'Partners', value: 'partners' },
              { label: 'Employees', value: 'employees' },
              { label: 'Agents', value: 'agents' },
            ]}
            selectionKey="audience"
            onSelection={onSelection}
          />
        );
      case 'contact_form':
        return (
          <ContactForm
            generateContactMessage={generateContactMessage}
            onSelection={onSelection}
          />
        );
      case 'send_message':
        return (
          <SendMessage
            generateContactMessage={generateContactMessage}
          />
        );
      case 'book_demo':
        return <BookDemo />;
      case 'thank_you':
        return <ThankYou />;
      default:
        return null;
    }
  };

  // Check if message content contains component tags
  const contentParts = message.content.split(/\[([^\]]+)\]/);
  const hasComponents = contentParts.some((part, index) => index % 2 === 1);

  return (
    <div className={`py-3 last:border-b-0 ${
      message.role === 'User' 
        ? 'flex justify-end' 
        : 'flex justify-start'
    }`}>
      <div className={`max-w-[80%] ${
        message.role === 'User' 
          ? 'bg-blue-50 border border-blue-200 rounded-lg p-3' 
          : 'bg-gray-50 border border-gray-200 rounded-lg p-3'
      }`}>
        <div className={`text-xs font-semibold uppercase mb-2 ${
          message.role === 'User' ? 'text-blue-600' : 'text-gray-600'
        }`}>
          {message.role}
        </div>
        
        <div className="whitespace-pre-wrap leading-relaxed">
          {hasComponents ? (
            contentParts.map((part, index) => {
              if (index % 2 === 1) {
                // This is a component tag
                return (
                  <div key={index} className="mt-2">
                    {renderComponent(part)}
                  </div>
                );
              } else {
                // This is regular text
                return part;
              }
            })
          ) : (
            message.content
          )}
        </div>

        {message.components && (
          <div className="mt-2 flex gap-2 flex-wrap">
            {message.components}
          </div>
        )}

        {message.details && (
          <details className="mt-2">
            <summary className="text-xs text-muted cursor-pointer">
              Details
            </summary>
            <pre className="bg-bg p-2 rounded text-xs text-muted overflow-x-auto mt-1">
              {JSON.stringify(message.details, null, 2)}
            </pre>
          </details>
        )}
      </div>
    </div>
  );
}
