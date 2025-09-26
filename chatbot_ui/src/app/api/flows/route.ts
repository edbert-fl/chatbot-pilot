import { NextResponse } from 'next/server';

// This would typically fetch from your backend, but for now we'll return the flows data directly
const flows = {
  greeting: "Hi! What would you like to build?",
  thank_you: "Thank you for your interest! We'll be in touch soon.",
  flows: {
    flow_customer_support: {
      start_triggers: ["i want a customer support chatbot", "customer support chatbot"],
      continue_prefix: "i want",
      sequence: [
        { assistant: "Great choice! Now let's determine which channels you'd like to use for your chatbot.", tag: "button_group_channels" },
        { assistant: "Perfect! Now tell me who will be using this chatbot.", tag: "button_group_audience" },
        { assistant: "Excellent! I have all the information I need. Let me prepare a message for you to send to our team.", tag: "contact_form" },
        { assistant: "Perfect! I've prepared a message with your requirements. Review it and press send to contact our team.", tag: "send_message", message_template: "Hi! I'm interested in building a customer support chatbot. Here are my requirements:\n\n- Chatbot Type: Customer Support\n- Channels: {channels}\n- Audience: {audience}\n- Contact: {contact}\n\nPlease reach out to discuss next steps!" }
      ]
    },
    flow_sales_assistant: {
      start_triggers: ["i want a sales assistant chatbot", "sales assistant chatbot"],
      continue_prefix: "i want",
      sequence: [
        { assistant: "Great choice! Now let's determine which channels you'd like to use for your chatbot.", tag: "button_group_channels" },
        { assistant: "Perfect! Now tell me who will be using this chatbot.", tag: "button_group_audience" },
        { assistant: "Excellent! I have all the information I need. Let me prepare a message for you to send to our team.", tag: "contact_form" },
        { assistant: "Perfect! I've prepared a message with your requirements. Review it and press send to contact our team.", tag: "send_message", message_template: "Hi! I'm interested in building a sales assistant chatbot. Here are my requirements:\n\n- Chatbot Type: Sales Assistant\n- Channels: {channels}\n- Audience: {audience}\n- Contact: {contact}\n\nPlease reach out to discuss next steps!" }
      ]
    },
    flow_internal_helpdesk: {
      start_triggers: ["i want an internal helpdesk chatbot", "internal helpdesk chatbot"],
      continue_prefix: "i want",
      sequence: [
        { assistant: "Great choice! Now let's determine which channels you'd like to use for your chatbot.", tag: "button_group_channels" },
        { assistant: "Perfect! Now tell me who will be using this chatbot.", tag: "button_group_audience" },
        { assistant: "Excellent! I have all the information I need. Let me prepare a message for you to send to our team.", tag: "contact_form" },
        { assistant: "Perfect! I've prepared a message with your requirements. Review it and press send to contact our team.", tag: "send_message", message_template: "Hi! I'm interested in building an internal helpdesk chatbot. Here are my requirements:\n\n- Chatbot Type: Internal Helpdesk\n- Channels: {channels}\n- Audience: {audience}\n- Contact: {contact}\n\nPlease reach out to discuss next steps!" }
      ]
    },
    flow_workflow_automation: {
      start_triggers: ["i want a workflow automation chatbot", "workflow automation chatbot"],
      continue_prefix: "i want",
      sequence: [
        { assistant: "Great choice! Now let's determine which channels you'd like to use for your chatbot.", tag: "button_group_channels" },
        { assistant: "Perfect! Now tell me who will be using this chatbot.", tag: "button_group_audience" },
        { assistant: "Excellent! I have all the information I need. Let me prepare a message for you to send to our team.", tag: "contact_form" },
        { assistant: "Perfect! I've prepared a message with your requirements. Review it and press send to contact our team.", tag: "send_message", message_template: "Hi! I'm interested in building a workflow automation chatbot. Here are my requirements:\n\n- Chatbot Type: Workflow Automation\n- Channels: {channels}\n- Audience: {audience}\n- Contact: {contact}\n\nPlease reach out to discuss next steps!" }
      ]
    }
  }
};

export async function GET() {
  return NextResponse.json(flows);
}
