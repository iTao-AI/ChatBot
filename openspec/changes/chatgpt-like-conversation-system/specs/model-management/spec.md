## ADDED Requirements

### Requirement: Provider Configuration
The system SHALL support configuring multiple AI providers (OpenAI, Anthropic) via environment variables or a configuration file, each with its own API key and base URL.

#### Scenario: Load provider configuration
- **WHEN** the backend starts
- **THEN** system loads provider configurations from environment variables (OPENAI_API_KEY, ANTHROPIC_API_KEY, etc.)

#### Scenario: Missing API key
- **WHEN** a provider is configured without an API key
- **THEN** system logs a warning and excludes that provider from the available models list

### Requirement: ChatProvider Interface
The system SHALL define a unified `ChatProvider` interface that all LLM adapters MUST implement, including methods for non-streaming and streaming chat completions.

#### Scenario: Implement OpenAI adapter
- **WHEN** a request targets an OpenAI model
- **THEN** the OpenAI adapter translates the unified message format to OpenAI API format and returns the response

#### Scenario: Implement Anthropic adapter
- **WHEN** a request targets an Anthropic model
- **THEN** the Anthropic adapter translates the unified message format to Anthropic API format and returns the response

### Requirement: Model Registry
The system SHALL maintain a registry of available models with their metadata (provider, context window size, pricing tier, display name).

#### Scenario: List available models
- **WHEN** the frontend requests the list of available models
- **THEN** system returns all registered models with their provider, contextWindow, displayName, and isDefault flag

#### Scenario: Default model selection
- **WHEN** no model is specified for a new conversation
- **THEN** system selects the model marked as isDefault

### Requirement: API Key Management
The system SHALL support storing API keys encrypted in the database, with the ability for administrators to add, update, or rotate keys.

#### Scenario: Store encrypted API key
- **WHEN** an administrator adds a new API key
- **THEN** system encrypts the key before storing it in the database

#### Scenario: Rotate API key
- **WHEN** an administrator updates an existing API key
- **THEN** system encrypts and stores the new key, deactivating the old one

### Requirement: Provider Routing
The system SHALL route chat requests to the correct provider based on the selected model.

#### Scenario: Route to OpenAI
- **WHEN** user selects a model with prefix "gpt-"
- **THEN** system routes the request to the OpenAI provider adapter

#### Scenario: Route to Anthropic
- **WHEN** user selects a model with prefix "claude-"
- **THEN** system routes the request to the Anthropic provider adapter

#### Scenario: Unknown model
- **WHEN** user requests a model not in the registry
- **THEN** system returns 400 Bad Request with an error message listing available models
