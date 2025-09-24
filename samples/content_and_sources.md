# Content & Knowledge Sources

- Sources (expanded):
  - Documents: PDFs, DOCX, PPTX, XLSX, CSV, plain text, Markdown
  - Public sites: company website, docs portals, developer sites (sitemap-driven or scoped crawl)
  - Knowledge bases & wikis: Zendesk Guide, Confluence, Notion, SharePoint, Google Drive, OneDrive, Dropbox
  - Databases & warehouses: Postgres, MySQL, SQL Server, Snowflake, BigQuery, Redshift (via read-only users or views)
  - SaaS systems: CRM (Salesforce, HubSpot), Support (Zendesk, ServiceNow), ITSM (Jira), CMS (WordPress, Contentful)
  - ERP/LOB: SAP, NetSuite, Microsoft Dynamics 365, Oracle EBS (read-only for knowledge; optional write for actions)
  - Cloud storage: S3, GCS, Azure Blob; file shares via SFTP/WebDAV
  - Messaging/collaboration: Slack/Teams channels (curated), email inbox ingestion for FAQs
  - APIs & feeds: REST/GraphQL endpoints, webhooks, RSS/Atom feeds

- Ingestion & indexing:
  - Connectors: batch pull (APIs, ODBC/JDBC), push (webhooks/events), scheduled crawlers, file-drop watchers, ETL jobs
  - Parsing: robust PDF-to-text, Office formats, table extraction; OCR for scanned PDFs/images when needed
  - Chunking: semantic or size-based (≈300–1,000 tokens); hierarchical by headings; preserves structure for citations
  - Metadata: source system, uri, document type, access scopes, updated_at, version, language, product/region tags, checksum
  - Quality: deduplication, canonicalization, HTML sanitization, code/markup handling

- Integration with ERP/CRM and other systems:
  - Read: product data, inventory, order status, customer/account context, entitlement data
  - Write (optional with safeguards): create/update tickets, cases, RMAs, opportunities, tasks; post activity logs
  - Safeguards: confirmation prompts, role restrictions, rate limits, idempotency keys, audit trails

- Access levels & security:
  - Identity: SSO/OIDC/SAML (Okta, Azure AD, Google Workspace); service accounts for ingestion
  - Authorization: role-based (RBAC) and attribute-based (ABAC); row- and field-level controls
  - ACL mapping: inherit permissions from sources (e.g., SharePoint/Confluence spaces, Salesforce object/field permissions, Zendesk groups)
  - Request-scoped enforcement: each query evaluated with user context; responses filtered/redacted by effective permissions
  - Data protection: encryption in transit/at rest, secrets management, private networking/VPC endpoints, audit logs

- Data freshness & sync:
  - Modes: batch (daily/weekly), near-real-time (5–15 min deltas), real-time via webhooks/CDC (where available)
  - Triggers: Salesforce/Zendesk/ServiceNow webhooks; Debezium/CDC for DBs; cloud storage object events; sitemap change detection
  - Scheduling: per-source cron windows with SLAs; backoff and retry on failures; partial re-index by document/version
  - Staleness policy: per-source TTLs; mark stale content; prefer freshest source; show last-updated in citations
  - Cache & index sync: invalidate by checksum/version; keep BM25 and vector indexes consistent

- Governance & quality management:
  - Ownership: data catalog with content owners and stewards (RACI)
  - Change control: content PRs/reviews; approval workflow before publish to index
  - Versioning: immutable snapshots and rollback; provenance stored with citations
  - Retention: policy-driven retention and legal holds; archival tiers for aged content
  - Sensitive data: PII/PCI/PHI detection and redaction; DLP scanning; configurable redaction rules
  - Monitoring: broken-link checks, coverage and freshness dashboards, answer quality sampling, user feedback loop
  - Compliance: audit logs for access and actions; export for SOC 2/ISO 27001/GDPR reviews

- Multilingual & localization:
  - Language detection and per-locale indexing; curated translations for canonical content
  - Terminology management and product glossary; locale-aware search/answers