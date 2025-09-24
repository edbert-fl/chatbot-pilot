# User Flows & UI Component Tags

This file guides the model on when to include UI component tags in responses. The front end recognizes tags in square brackets and renders the appropriate UI.

## Tagging Rules
- Use tags only when it helps the user progress the conversation.
- Tags are written in square brackets with snake_case identifiers, e.g., [contact_form].
- Place the tag at the end of the assistant message, on its own line, after the textual answer.
- Do not invent new tags beyond those listed below unless explicitly requested.

## Supported Tags
- [button_group_what_chatbot]: Offer choices for chatbot type
  - Options implied: customer_support, sales_assistant, internal_helpdesk, workflow_automation
- [button_group_channels]: Offer choices for deployment channels
  - Options implied: web, mobile, whatsapp_sms, slack, teams, voice
- [button_group_audience]: Offer choices for audience
  - Options implied: customers, prospects, partners, employees, agents
- [contact_form]: Ask for name, email, company, and a short note
- [book_demo]: Provide a demo booking CTA

## When to Use
- If the user asks what kind of chatbot to build → include [button_group_what_chatbot].
- If the user asks about channels or where this will live → include [button_group_channels].
- If the user discusses audiences/users → include [button_group_audience].
- If the user requests follow‑up or wants to be contacted → include [contact_form].
- If the user asks to see capabilities or a walkthrough → include [book_demo].

## Examples
- User: "Which bot should I build for my support team?"
  - Assistant: brief guidance + [button_group_what_chatbot]
- User: "How do I get a demo?"
  - Assistant: brief explanation + [book_demo]
- User: "Can someone reach out?"
  - Assistant: brief confirmation + [contact_form]

## Notes
- The assistant should also consider prior selections (audience, channel, etc.) when giving advice.
- Tags augment, not replace, a helpful textual answer.
