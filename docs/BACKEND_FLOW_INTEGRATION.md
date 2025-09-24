## Backend integration guide for the client-side flow model

This document outlines how to adapt the backend to work smoothly with the new client-driven flow engine. The UI now manages flows locally and only calls the backend when not in a flow or when the user exits a flow.

### Goals
- Keep flows entirely client-side (fast, predictable UX).
- Use the backend for retrieval + model answers when outside flows.
- Pass lightweight state so the backend can personalize and log.

### Request/response contract

Augment the existing `/chat` request with optional fields (non-breaking):

- `session_id: string` (already supported)
- `selections: object` (already supported)
- `client_state?: { flow_id?: string; flow_active?: boolean; flow_step?: number }`
- `allow_ui_tags?: boolean` – whether the backend should ask the model to append a single UI tag suggestion; default `true`

Response remains the same:

- `answer: string`
- `citations: Array<object>`
- `retrieval_metadata: object`
- Optionally (non-breaking) add: `ui_tag_suggestion?: string | null`

### Behavior recommendations

1) When the UI is in a flow (`client_state.flow_active === true`):
   - Do not instruct the model to append UI tags. The UI is already in control of components.
   - Leverage `selections` (merged by `session_id`) to personalize answers.
   - Keep responses short and factual; avoid patterns like "I want ..." that the UI uses as flow triggers.

2) When the UI is not in a flow (`flow_active !== true`):
   - Optionally allow the model to append exactly one trailing tag in square brackets to suggest the next UI component (same convention you already use).
   - You can also return `ui_tag_suggestion` in JSON instead of modifying `answer`; the UI can choose which to use.

3) Always merge `selections` into per-session context:
   - Use `session_id` as the key.
   - Validate and normalize known fields (e.g., emails) before persisting.

### Prompt control (toggling UI tags)

Currently, `retrieval_chatbot.create_prompt()` ends with a rule that encourages the model to append a single UI tag in brackets. Make this conditional on `allow_ui_tags`:

```python
# server.py (request model example)
class ChatRequest(BaseModel):
    query: str
    max_context_chunks: int = 5
    model: Optional[str] = None
    session_id: Optional[str] = None
    selections: Optional[Dict[str, Any]] = None
    client_state: Optional[Dict[str, Any]] = None  # { flow_id, flow_active, flow_step }
    allow_ui_tags: Optional[bool] = True

# server.py (/chat handler excerpt)
flow_active = bool(req.client_state and req.client_state.get("flow_active"))
allow_ui_tags = False if flow_active else bool(req.allow_ui_tags)

user_ctx_str = None
if ctx.get("selections"):
    import json as _json
    user_ctx_str = _json.dumps({"selections": ctx["selections"]}, ensure_ascii=False)

result = chatbot.chat(
    req.query,
    max_context_chunks=req.max_context_chunks,
    user_context=user_ctx_str,
    allow_ui_tags=allow_ui_tags,
)
```

```python
# retrieval_chatbot.py (signature + prompt control)
def create_prompt(self, query: str, context: str, user_context: str | None = None, allow_ui_tags: bool = True) -> str:
    extra_user_ctx = f"\nUser Context...\n{user_context}\n" if user_context else "\n"
    ui_rule = "\n- If the user's query matches a known step... append a suitable UI tag ..." if allow_ui_tags else ""
    return f"""You are Josh ...
...
Instructions:
- Synthesize a concise answer ...
- End your response with a \"Sources\" section ...
{ui_rule}

Answer:"""

def chat(self, query: str, max_context_chunks: int = 5, user_context: str | None = None, allow_ui_tags: bool = True) -> Dict[str, Any]:
    context = self.format_context_for_llm(context_chunks)
    prompt = self.create_prompt(query, context, user_context=user_context, allow_ui_tags=allow_ui_tags)
    # rest unchanged
```

This preserves current behavior but avoids UI-tag suggestions while the UI is executing a flow.

### Session context and selections

- Continue merging `selections` into `app.state.session_context[session_id]`.
- Consider storing the last N user messages for better personalization (short memory per session).
- Optionally, persist to a datastore if you need continuity across server restarts.

### Observability and analytics

- Log `session_id`, `flow_id`, `flow_active`, and `flow_step` (if provided) for each `/chat` call.
- Capture whether a response included a `ui_tag_suggestion`.
- Emit counters/timers for retrieval latency and model latency.

### Validation and safety

- Validate `selections` payloads (e.g., email format) to avoid bad data.
- Sanitize/escape any user-provided strings used in logs.
- Keep timeouts reasonable (e.g., 60s) and return structured errors.

### Backward compatibility

- Treat new fields as optional.
- Default `allow_ui_tags=True` to preserve current behavior for non-flow clients.

### Minimal migration checklist

1) Add `client_state` and `allow_ui_tags` to the chat request model.
2) In `/chat`, set `allow_ui_tags = False` when `client_state.flow_active` is true.
3) Thread `allow_ui_tags` into your prompt creation.
4) Keep merging `selections` by `session_id`.
5) (Optional) Return `ui_tag_suggestion` separately instead of modifying `answer`.

### Example: calling the backend from the UI

When the UI exits a flow or is not in one, it will POST:

```json
{
  "query": "How do you price enterprise support?",
  "session_id": "abc123",
  "selections": { "what_chatbot": "support" },
  "client_state": { "flow_id": null, "flow_active": false },
  "allow_ui_tags": true
}
```

When the UI is inside a flow, it may avoid calling the backend entirely. If it does call, it can send:

```json
{
  "query": "I want this on mobile.",
  "session_id": "abc123",
  "client_state": { "flow_id": "flow_customer_support", "flow_active": true, "flow_step": 1 },
  "allow_ui_tags": false
}
```

This lets the backend keep answers clean while the UI controls the flow and components.


