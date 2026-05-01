## ADDED Requirements

### Requirement: Markdown Rendering
The system SHALL render user and assistant messages with full Markdown support, including headings, lists, tables, blockquotes, and inline formatting.

#### Scenario: Render markdown message
- **WHEN** a message contains Markdown syntax (headings, bold, italic, lists)
- **THEN** the frontend renders the formatted HTML output

#### Scenario: Render code blocks
- **WHEN** a message contains fenced code blocks with language hints
- **THEN** the system renders the code with syntax highlighting appropriate to the language

#### Scenario: Inline code rendering
- **WHEN** a message contains inline code using backticks
- **THEN** the system renders inline code with a monospace font and background

### Requirement: XSS Sanitization
The system SHALL sanitize all rendered HTML to prevent XSS attacks using DOMPurify.

#### Scenario: Malicious script in message
- **WHEN** an AI response contains `<script>` tags or `javascript:` URLs
- **THEN** DOMPurify strips the dangerous content before rendering

#### Scenario: Safe HTML preserved
- **WHEN** a message contains safe HTML-like Markdown (e.g., code blocks, tables)
- **THEN** DOMPurify preserves the safe content while removing dangerous elements

### Requirement: Typewriter Effect
The system SHALL display streaming AI responses with a typewriter effect, showing characters incrementally as they arrive via SSE.

#### Scenario: Streaming display
- **WHEN** SSE tokens arrive from the server
- **THEN** the frontend appends each token to the message display in real time

#### Scenario: Cursor animation
- **WHEN** streaming is in progress
- **THEN** the frontend displays a blinking cursor at the end of the current text

#### Scenario: Streaming complete
- **WHEN** the SSE stream sends a completion event
- **THEN** the frontend removes the cursor animation and finalizes the message rendering

### Requirement: LaTeX Math Rendering
The system SHALL render LaTeX math expressions enclosed in `$$...$$` (block) or `$...$` (inline) using a math rendering library.

#### Scenario: Block math rendering
- **WHEN** a message contains `$$\frac{a}{b}$$`
- **THEN** the frontend renders it as a centered, display-style mathematical formula

#### Scenario: Inline math rendering
- **WHEN** a message contains `$E = mc^2$`
- **THEN** the frontend renders it inline with the surrounding text

### Requirement: Copy Code Button
The system SHALL display a copy button on each code block that copies the code content to the clipboard.

#### Scenario: Copy code to clipboard
- **WHEN** user clicks the copy button on a code block
- **THEN** the code content is copied to clipboard and a brief "Copied!" confirmation is shown
