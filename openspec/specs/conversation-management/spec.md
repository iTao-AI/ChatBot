## ADDED Requirements

### Requirement: Create Conversation
The system SHALL allow authenticated users to create new conversations. Each conversation SHALL have a unique ID, creation timestamp, and be associated with the creating user.

#### Scenario: Create a new conversation
- **WHEN** authenticated user sends a POST request to create a conversation
- **THEN** system creates and returns the conversation with a generated ID and timestamp

#### Scenario: Create conversation without authentication
- **WHEN** an unauthenticated request is made
- **THEN** system returns 401 Unauthorized

### Requirement: List Conversations
The system SHALL return a paginated list of the user's conversations, ordered by most recently updated.

#### Scenario: List user conversations
- **WHEN** authenticated user requests their conversation list
- **THEN** system returns conversations sorted by updatedAt descending, with pagination metadata

#### Scenario: User has no conversations
- **WHEN** a new user with no conversations requests the list
- **THEN** system returns an empty array with pagination metadata

### Requirement: Delete Conversation
The system SHALL allow users to permanently delete a conversation and all its messages.

#### Scenario: Delete own conversation
- **WHEN** user deletes a conversation they own
- **THEN** system removes the conversation and all associated messages, returns 204 No Content

#### Scenario: Delete another user's conversation
- **WHEN** user attempts to delete a conversation belonging to another user
- **THEN** system returns 403 Forbidden

### Requirement: Rename Conversation
The system SHALL allow users to update the title of a conversation.

#### Scenario: Rename conversation
- **WHEN** user provides a new title for their conversation
- **THEN** system updates and returns the conversation with the new title

### Requirement: Get Conversation Messages
The system SHALL return all messages in a conversation, ordered chronologically.

#### Scenario: Retrieve messages
- **WHEN** user requests messages for a conversation they own
- **THEN** system returns all messages ordered by createdAt ascending

#### Scenario: Retrieve messages for another user's conversation
- **WHEN** user requests messages for a conversation they don't own
- **THEN** system returns 403 Forbidden

### Requirement: Save Message
The system SHALL persist both user messages and AI assistant messages with their role, content, model used, and timestamps.

#### Scenario: Save a user message
- **WHEN** user sends a message in a conversation
- **THEN** system stores the message with role="user", content, timestamp, and conversationId

#### Scenario: Save an assistant message
- **WHEN** the AI generates a response
- **THEN** system stores the message with role="assistant", content, modelUsed, timestamp, and conversationId
