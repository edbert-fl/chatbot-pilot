# RAG + OpenAI Chatbot Usage Guide

This guide explains how to use the interactive RAG + OpenAI chatbot that combines document retrieval with AI-powered responses.

## 🚀 Quick Start

### 1. Start the Chatbot
```bash
# Activate virtual environment
source .venv/bin/activate

# Start interactive mode
python rag_chat.py
```

### 2. Ask Questions
Once the chatbot starts, you'll see:
```
🤖 Working RAG + OpenAI Chatbot
==================================================
Ask questions about the bank policies. Type 'quit' to exit.

❓ Your question: 
```

Simply type your question and press Enter!

## 💬 Interactive Commands

| Command | Description |
|---------|-------------|
| `quit` | Exit the chatbot |
| `exit` | Exit the chatbot |
| `q` | Exit the chatbot |
| `Ctrl+C` | Force quit |

## 🎯 Example Questions to Try

### Data Retention & Deletion
- "How long do we retain account statements and transaction logs?"
- "What is the retention period for mortgage files?"
- "How fast are deletion requests processed?"
- "How long are voice recordings retained?"

### Security & Encryption
- "What encryption is used at rest and in transit?"
- "What are the SLAs for remediating vulnerabilities?"
- "What are our incident response phases?"

### Privacy & Customer Rights
- "How can customers request data deletion?"
- "Do we sell personal information?"
- "What are the customer's privacy rights?"

### Third-Party & Compliance
- "How do we manage third-party risk?"
- "What audit rights do we have?"
- "Can we object to new subprocessors?"

## 📋 Understanding the Output

### Answer Format
The chatbot provides:
- **Intelligent answer** based on your documents
- **Inline citations** like [1], [2] referencing sources
- **Sources section** with full provenance

### Example Output
```
🤖 Answer: Customer account statements are retained for a minimum of seven years from the end of the relationship, unless longer retention is required by law or supervisory guidance [1]. The relationship end is defined as the date when the last open product held by the customer is closed and all outstanding obligations have settled [1].

Sources:
[1] bank_retention_policy.md

📚 Sources:
  [1] bank_retention_policy.md (chunk #0)
  [2] bank_privacy_notice.md (chunk #1)
  [3] bank_security_standards.md (chunk #0)
```

### What Each Part Means
- **[1], [2]** = Inline citations in the answer
- **chunk #0** = Which section of the document
- **Score: 0.123** = How relevant the source is (higher = more relevant)
- **checksum: abc12345** = Document integrity verification

## 🔧 Command Line Options

### Single Query Mode
```bash
# Ask one question without interactive mode
python rag_chat.py --query "How long do we retain data?"

# Use different OpenAI model
python rag_chat.py --model gpt-4 --query "What encryption do we use?"

# Specify custom index directory
python rag_chat.py --index-dir ./my_index --query "What are our policies?"
```

### Available Options
- `--query`: Single question (non-interactive)
- `--model`: OpenAI model (gpt-3.5-turbo, gpt-4, etc.)
- `--index-dir`: Path to RAG index directory
- `--api-key`: OpenAI API key (or set OPENAI_API_KEY env var)

## 🎯 Tips for Better Results

### 1. Be Specific
- ✅ "How long do we retain mortgage files?"
- ❌ "retention"

### 2. Use Keywords from Documents
- ✅ "account statements retention"
- ✅ "encryption AES-256"
- ✅ "incident response timeline"

### 3. Ask Follow-up Questions
- Start with: "What are our data retention policies?"
- Follow up: "What about voice recordings?"
- Then: "How fast is deletion processing?"

### 4. Test Different Phrasings
- "How can customers delete their data?"
- "What is the data deletion process?"
- "Customer data deletion requests"

## 🚨 Troubleshooting

### Common Issues

**"No relevant information found"**
- Try rephrasing your question
- Use more specific keywords
- Check if the topic is covered in your documents

**"Error generating response"**
- Check your OpenAI API key
- Verify you have API credits
- Try a different model

**"Index loading error"**
- Make sure you've built the index first
- Check that `local_index/` directory exists
- Run `python -m rag.cli build-index` if needed

### Getting Help
- Check the console output for error messages
- Verify your `.env` file has `OPENAI_API_KEY=your-key-here`
- Make sure all dependencies are installed

## 📚 What Documents Are Available

The chatbot searches through these bank policy documents:
- `bank_retention_policy.md` - Data retention and deletion policies
- `bank_privacy_notice.md` - Privacy rights and data handling
- `bank_security_standards.md` - Security controls and encryption
- `bank_dpa.md` - Data processing agreements

## 🔍 How It Works

1. **Question Processing**: Your question is analyzed and tokenized
2. **Document Search**: BM25 keyword search finds relevant chunks
3. **Context Assembly**: Top chunks are formatted with citations
4. **AI Generation**: OpenAI creates an answer based on the context
5. **Response**: You get a cited answer with full provenance

## 🎉 Enjoy Your Chatbot!

The RAG + OpenAI integration provides:
- ✅ **Accurate answers** grounded in your documents
- ✅ **Full transparency** with citations and checksums
- ✅ **Compliance-ready** audit trails
- ✅ **Fast responses** using pre-built indexes

Happy questioning! 🚀
