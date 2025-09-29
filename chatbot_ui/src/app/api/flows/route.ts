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
        { assistant: "Thank you for your message! We have received your inquiry and will contact you back shortly. Our team will review your requirements and get in touch with you within 24 hours.", tag: "thank_you" }
      ]
    },
    flow_sales_assistant: {
      start_triggers: ["i want a sales assistant chatbot", "sales assistant chatbot"],
      continue_prefix: "i want",
      sequence: [
        { assistant: "Great choice! Now let's determine which channels you'd like to use for your chatbot.", tag: "button_group_channels" },
        { assistant: "Perfect! Now tell me who will be using this chatbot.", tag: "button_group_audience" },
        { assistant: "Excellent! I have all the information I need. Let me prepare a message for you to send to our team.", tag: "contact_form" },
        { assistant: "Thank you for your message! We have received your inquiry and will contact you back shortly. Our team will review your requirements and get in touch with you within 24 hours.", tag: "thank_you" }
      ]
    },
    flow_internal_helpdesk: {
      start_triggers: ["i want an internal helpdesk chatbot", "internal helpdesk chatbot"],
      continue_prefix: "i want",
      sequence: [
        { assistant: "Great choice! Now let's determine which channels you'd like to use for your chatbot.", tag: "button_group_channels" },
        { assistant: "Perfect! Now tell me who will be using this chatbot.", tag: "button_group_audience" },
        { assistant: "Excellent! I have all the information I need. Let me prepare a message for you to send to our team.", tag: "contact_form" },
        { assistant: "Thank you for your message! We have received your inquiry and will contact you back shortly. Our team will review your requirements and get in touch with you within 24 hours.", tag: "thank_you" }
      ]
    },
    flow_workflow_automation: {
      start_triggers: ["i want a workflow automation chatbot", "workflow automation chatbot"],
      continue_prefix: "i want",
      sequence: [
        { assistant: "Great choice! Now let's determine which channels you'd like to use for your chatbot.", tag: "button_group_channels" },
        { assistant: "Perfect! Now tell me who will be using this chatbot.", tag: "button_group_audience" },
        { assistant: "Excellent! I have all the information I need. Let me prepare a message for you to send to our team.", tag: "contact_form" },
        { assistant: "Thank you for your message! We have received your inquiry and will contact you back shortly. Our team will review your requirements and get in touch with you within 24 hours.", tag: "thank_you" }
      ]
    }
  }
};

export async function GET() {
  return NextResponse.json(flows);
}
