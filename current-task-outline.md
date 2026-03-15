# Current Task Outline

## Focus Area: Phase 5 – AI Relational Data View (Weeks 9-10)

1. **Conversational Query Orchestration**
   - Expose schema + relationship metadata to the MCP/LLM layer
   - Enforce read-only SQL validation and guardrails before execution

2. **Chat Workspace UI**
   - Embed the streaming chat panel in both the TableViewer and TableList experiences so users can run relational queries before drilling down
   - Pre-seed prompts with context (current table selection, highlighted relationships) when inside the TableViewer
   - Render AI-generated SQL results through the existing DataTable and Export workflows so drag/reorder/resize/export presets all work without duplication

3. **Automations & Exports**
   - Allow assistant responses to trigger export presets/scopes directly from the chat context
   - Capture telemetry, errors, and fallback responses to continuously improve AI interactions

## Supporting Considerations
- Keep capability checks and nonce validation consistent with existing FlyDB REST endpoints
- Reuse current chunked export + column selector infrastructure where possible
- Plan for future separation into a dedicated MCP service if conversational load grows beyond what the PHP layer can comfortably handle
