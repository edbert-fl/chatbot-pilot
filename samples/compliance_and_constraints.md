# Compliance & Constraints

- Frameworks: SOC 2 Type II, ISO 27001; GDPR/CCPA compliance
- Data residency: Prefer US-based processing; EU data stays in-region for EU users
- Retention: 18 months for support transcripts; 7 years for financial docs
- PII: Names, emails, phone numbers, order IDs; no SSNs or payment card data in chatbot flows
- Security: VPC peering for production; private endpoints; secrets in Vault
- BAAs/DPAs: DPA required; BAA not required (not handling PHI)
- Audit: Access logs, prompt logs with redaction, monthly reviews
