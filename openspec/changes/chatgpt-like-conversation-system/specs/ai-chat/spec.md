## ADDED Requirements

### Requirement: Stream Chat Response
The system SHALL provide an SSE endpoint that streams AI responses token by token as they are generated.

#### Scenario: Stream a complete response
- **WHEN** user sends a message to the chat endpoint
- **THEN** system connects the SSE stream and sends tokens incrementally until the response is complete

#### Scenario: Stream with model selection
- **WHEN** user sends a message specifying a model (e.g., "gpt-4")
- **THEN** system routes to the correct AI provider and streams the response

#### Scenario: Streaming error
- **WHEN** the AI provider returns an error during streaming
- **THEN** system sends an SSE error event and closes the stream

### Requirement: Maintain Conversation Context
The system SHALL send the full conversation history as context with each API call to the AI provider, respecting the model's token window limit.

#### Scenario: Multi-turn context
- **WHEN** user sends the 5th message in a conversation
- **THEN** system sends all previous 4 exchanges (user + assistant messages) as context to the AI provider

#### Scenario: Context window exceeded
- **WHEN** conversation history exceeds the model's token limit
- **THEN** system calculates total tokens using tiktoken, truncates oldest messages iteratively until within limit, preserving system prompt and most recent messages

### Requirement: Model Switching
The system SHALL allow users to switch AI models mid-conversation. The new model SHALL receive the existing conversation history as context.

#### Scenario: Switch from GPT-4 to Claude
- **WHEN** user changes the model from GPT-4 to Claude in an active conversation
- **THEN** system routes the next request to Anthropic with the existing conversation history

### Requirement: System Prompt
The system SHALL support a configurable system prompt that is prepended to every API call as the first message with role="system".

#### Scenario: Default system prompt
- **WHEN** a conversation is created without a custom system prompt
- **THEN** system uses the default system prompt "You are a helpful assistant."

#### Scenario: Custom system prompt
- **WHEN** user sets a custom system prompt for a conversation
- **THEN** system prepends the custom prompt as the system message in API calls

### Requirement: Chat Response Metadata
The system SHALL capture and return response metadata including token usage, model name, and response time.

#### Scenario: Response metadata capture
- **WHEN** an AI response completes successfully
- **THEN** system stores and returns promptTokens, completionTokens, totalTokens, model, and responseTimeMs
