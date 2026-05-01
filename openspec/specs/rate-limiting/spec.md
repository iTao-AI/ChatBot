## ADDED Requirements

### Requirement: Per-User Rate Limiting
The system SHALL limit each authenticated user to a configurable number of chat requests per minute and per day.

#### Scenario: Within rate limit
- **WHEN** user sends their 10th message in a minute (limit is 20/min)
- **THEN** system processes the request normally

#### Scenario: Exceed per-minute limit
- **WHEN** user sends their 21st message in a minute (limit is 20/min)
- **THEN** system returns 429 Too Many Requests with a retry-after header

#### Scenario: Exceed daily limit
- **WHEN** user exceeds the daily message quota
- **THEN** system returns 429 Too Many Requests with a message indicating the daily limit has been reached

### Requirement: IP-Based Rate Limiting
The system SHALL limit requests per IP address for authentication endpoints to prevent brute force attacks.

#### Scenario: Login rate limit
- **WHEN** an IP address sends more than 10 login attempts in 5 minutes
- **THEN** system returns 429 Too Many Requests for subsequent login attempts from that IP

### Requirement: Rate Limit Headers
The system SHALL include rate limit status headers in all API responses.

#### Scenario: Rate limit headers present
- **WHEN** any API endpoint is called
- **THEN** response includes `X-RateLimit-Limit`, `X-RateLimit-Remaining`, and `X-RateLimit-Reset` headers

### Requirement: Redis-Based Rate Limiting
The system SHALL use Redis as the backing store for rate limit counters to support horizontal scaling.

#### Scenario: Distributed rate limiting
- **WHEN** the application runs on multiple instances behind a load balancer
- **THEN** rate limits are enforced correctly across all instances using shared Redis state

#### Scenario: Redis unavailable
- **WHEN** Redis is unreachable
- **THEN** system falls back to in-memory rate limiting and logs a warning

### Requirement: Configurable Rate Limits
The system SHALL allow rate limit thresholds to be configured via environment variables without code changes.

#### Scenario: Configure custom limits
- **WHEN** environment variables `RATE_LIMIT_CHAT_PER_MIN` and `RATE_LIMIT_CHAT_PER_DAY` are set
- **THEN** system applies the configured thresholds for chat rate limiting
