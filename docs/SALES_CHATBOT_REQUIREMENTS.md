## Requirements: Questions a Marketing/Sales Chatbot Should Ask for a Company Building Chatbots and AI Workflows

### 1) Purpose
- **Primary goal**: Qualify leads, discover use cases, and drive next steps (demo/meeting).
- **Secondary goals**: Educate, showcase capabilities/case studies, capture contact info compliantly.

### 2) Audience & Tone
- **Personas**: CTO/VP Eng, Product, Ops, Marketing, Customer Support, Founders.
- **Tone**: Expert, concise, helpful; avoids jargon unless the user signals technical depth.

### 3) Entry, Greeting, and Consent
- **Greeting**: “Looking to build a chatbot or automate workflows? I can help scope your project.”
- **Consent**: “I can save your answers to share a tailored proposal. OK?”
- **Off-ramps**: “Prefer a human? I can book a call or open live chat.”

### 4) Core Question Categories (with sample prompts)

- **Basic Profile**
  - Company, role, email (optional gated), website/domain.
  - “What’s your company name and your role?”
  - “How can I follow up? Email or calendar link?”

- **Goals & Outcomes**
  - “What outcomes do you want? (reduce support tickets, qualify leads, increase conversion, automate back office)”
  - “How will you measure success? (CSAT, AHT, resolution rate, revenue, hours saved)”
  - “What’s the ‘must-win’ for the next 90 days?”

- **Use Cases (Chatbots and AI Workflows)**
  - “Which use cases apply? (customer support, sales assistant, internal helpdesk, HR, IT, finance ops, data extraction, RPA)”
  - “For AI workflows, what processes should be automated? (intake, summarization, routing, approvals, reporting)”
  - “Any must-have channels? (web, mobile, WhatsApp, SMS, Slack, Teams, voice/telephony)”

- **Audience & Volume**
  - “Who will use it? (customers, agents, sales, ops, all employees)”
  - “Monthly conversation volume estimate?”
  - “Languages/locales needed?”

- **Content & Knowledge Sources**
  - “What documents or systems should answers come from? (KB, website, PDFs, Confluence, SharePoint, Notion)”
  - “Are these sources public, private, or mixed?”
  - “How often do they change?”

- **Systems & Integrations**
  - “Which tools should it connect to? (CRM, ticketing, ERP, HRIS, data warehouses)”
  - “Any preference for LLM providers or vector DBs?”
  - “Authentication requirements (SSO/OAuth, JWT, API keys)?”

- **Constraints & Compliance**
  - “Do you operate in regulated environments? (HIPAA, HITRUST, SOC 2, ISO 27001, GDPR/CCPA)”
  - “Data residency or on-prem/VPC requirements?”
  - “PII handling and retention policies?”

- **Current State & Maturity**
  - “Do you have an existing chatbot or workflow tooling?”
  - “What’s working, what isn’t?”
  - “Any prior experiments or benchmarks?”

- **Conversation Design & UX**
  - “Preferred style: guided menus vs free text?”
  - “Do you want rich UI elements? (cards, forms, file upload)”
  - “Handoffs: live agent, email escalation, ticket creation?”

- **Ops & Lifecycle**
  - “Who maintains content and prompts?”
  - “Release cadence, environments (dev/stage/prod)?”
  - “Observability needs: logs, analytics, feedback loop, red-team reviews?”

- **Timeline & Budget**
  - “Target launch date and any market/exec deadlines?”
  - “Budget range (ballpark is fine)?”

- **Decision Process**
  - “Who are decision-makers and influencers?”
  - “Procurement/security review required?”
  - “When should we schedule a solution walkthrough?”

- **Next Steps & Consent**
  - “Would you like a quick capability demo?”
  - “Can I send a summary and suggested plan to your email?”
  - “Want to book a 30-min call now?”

### 5) Conditional/Branching Logic Rules
- **If regulated industry**: Ask compliance, audit trails, data residency, BAAs, DPA needs.
- **If voice channel**: Ask telephony provider, IVR needs, latency constraints, call recording.
- **If internal helpdesk**: Ask SSO, RBAC, Slack/Teams, HRIS/ITSM integrations.
- **If high volume**: Ask rate limits, autoscaling, queuing, cost controls.
- **If on-prem/VPC**: Ask Kubernetes, VPC peering, private endpoints, secrets management.
- **If multilingual**: Ask priority locales, translation QA process.
- **If lead gen**: Ask CRM mapping, lead routing rules, form enrichment.

### 6) Data Capture Schema (for CRM/ATS/Notes)
- **Contact**: name, email, phone, role, timezone, LinkedIn (optional).
- **Company**: name, domain, size, industry, region.
- **Project**: goals, use cases, channels, languages, sources, integrations, constraints, metrics, timeline, budget range.
- **Compliance**: frameworks, residency, retention, PII categories.
- **Next Steps**: demo interest, meeting time windows, preferred contact method, consent flags.

### 7) Acceptance Criteria
- **Must** capture: company, role, email/meeting intent, primary goal, target use cases, key systems, timeline.
- **Must** present: a clear CTA for demo/meeting and provide a human handoff.
- **Should** handle: multilingual prompts, consent prompts, and compliance flags.
- **Should** log: all answers with timestamps and consent state.
- **Should** summarize: a brief project summary before asking to book a call.

### 8) Example Microcopy (Short)
- “What would success look like in 4–8 weeks?”
- “Which systems should the bot talk to first?”
- “Any compliance or data residency requirements we should respect?”
- “Want me to pull a 2–page scoped plan to your email?”

### 9) Sample High-Level Flow
1. Greet + consent → show capabilities and menu of outcomes.
2. Goals → use cases → channels → volume → languages.
3. Sources → integrations → constraints/compliance.
4. Timeline → budget → decision process → next steps.
5. Summarize answers → confirm → offer demo scheduling and email follow-up.

### 10) KPIs for the Chatbot
- **Lead quality rate**, meeting-booked rate, completion rate of discovery flow, time-to-qualification, consent capture rate, attribution to pipeline.

### Implementation Note
If desired, convert these prompts into a structured intent/question schema (JSON) and instrument the UI to capture responses alongside each conversation, feeding your CRM and analytics.


