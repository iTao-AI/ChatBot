## ADDED Requirements

### Requirement: Provider Configuration
The system SHALL support configuring multiple AI providers (DeepSeek, OpenAI, Anthropic) via environment variables or database storage, each with its own API key and base URL. DeepSeek is the default provider with OpenAI-compatible API.

#### Scenario: Load provider configuration
- **WHEN** the backend starts
- **THEN** system loads provider configurations from environment variables (DEEPSEEK_API_KEY, OPENAI_API_KEY, ANTHROPIC_API_KEY, etc.) and database ApiConfig table

#### Scenario: Missing API key
- **WHEN** a provider is configured without an API key
- **THEN** system excludes that provider from the available models list

### Requirement: ChatProvider Interface
The system SHALL define a unified `ChatProvider` interface that all LLM adapters MUST implement, including methods for non-streaming and streaming chat completions.

#### Scenario: Implement OpenAI adapter
- **WHEN** a request targets an OpenAI model
- **THEN** the OpenAI adapter translates the unified message format to OpenAI API format and returns the response

#### Scenario: Implement DeepSeek adapter (OpenAI-compatible)
- **WHEN** a request targets a DeepSeek model (deepseek-chat, deepseek-reasoner)
- **THEN** system uses the OpenAI adapter with DeepSeek's base URL (https://api.deepseek.com/v1) to route the request

#### Scenario: Implement Anthropic adapter
- **WHEN** a request targets an Anthropic model
- **THEN** the Anthropic adapter translates the unified message format to Anthropic API format and returns the response

### Requirement: Model Registry
The system SHALL maintain a registry of available models with their metadata (provider, context window size, pricing tier, display name). DeepSeek models shall be available by default when DEEPSEEK_API_KEY is configured.

#### Scenario: List available models
- **WHEN** the frontend requests the list of available models
- **THEN** system returns all registered models with their provider, contextWindow, displayName, and isDefault flag

#### Scenario: Default model selection
- **WHEN** no model is specified for a new conversation
- **THEN** system selects deepseek-chat if DEEPSEEK_API_KEY is configured, otherwise falls back to gpt-4o

### Requirement: API Key Management
The system SHALL support storing API keys encrypted (AES-256-CBC) in the database via the ApiConfig model, with the ability for administrators to add, update, enable/disable, or remove keys. Provider routing shall check database keys first, then fall back to environment variables.

#### Scenario: Store encrypted API key
- **WHEN** a user adds a new API key via POST /api/config
- **THEN** system encrypts the key with AES-256-CBC before storing in the ApiConfig table

#### Scenario: Database key takes priority over env var
- **WHEN** both a database ApiConfig and an environment variable exist for the same provider
- **THEN** system uses the database key for API requests

#### Scenario: Toggle API key active status
- **WHEN** a user toggles an API key via PATCH /api/config/:provider/toggle
- **THEN** system sets isActive to false and the provider is excluded from available models

### Requirement: Provider Routing
The system SHALL route chat requests to the correct provider based on the model registry lookup (NOT by model name prefix).

#### Scenario: Route to DeepSeek
- **WHEN** user selects deepseek-chat or deepseek-reasoner
- **THEN** system routes the request to the OpenAI-compatible adapter with DeepSeek's base URL

#### Scenario: Route to OpenAI
- **WHEN** user selects gpt-4o or gpt-4o-mini
- **THEN** system routes the request to the OpenAI provider adapter

#### Scenario: Route to Anthropic
- **WHEN** user selects claude-sonnet-4 or claude-opus-4
- **THEN** system routes the request to the Anthropic provider adapter

#### Scenario: Unknown model
- **WHEN** user requests a model not in the registry
- **THEN** system returns 400 Bad Request with an error message listing available models
