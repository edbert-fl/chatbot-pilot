# Systems & Integrations

- CRM: Salesforce (Sales Cloud)
- Support: Zendesk (tickets + Guide KB)
- Marketing: HubSpot (forms), Google Analytics
- ERP: NetSuite
- HRIS/ITSM: Workday; Jira Service Management (internal)
- Data: Snowflake (analytics warehouse)
- Auth: Okta SSO/OIDC; service-to-service via OAuth 2.0 or API keys
- Preferences:
  - LLM provider: OpenAI (primary), Azure OpenAI (backup)
  - Vector DB: pgvector (managed Postgres) initially; Pinecone optional later
- Webhooks & eventing: Required for CRM/ticket lifecycle updates
