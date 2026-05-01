## ADDED Requirements

### Requirement: User Registration
The system SHALL allow users to register with email and password. Passwords MUST be hashed using bcrypt before storage.

#### Scenario: Successful registration
- **WHEN** user provides a valid email and password meeting complexity requirements
- **THEN** system creates the user account and returns a success response

#### Scenario: Duplicate email registration
- **WHEN** user attempts to register with an email that already exists
- **THEN** system returns a 409 Conflict error

#### Scenario: Weak password
- **WHEN** user provides a password shorter than 8 characters
- **THEN** system returns a 400 Bad Request with validation errors

### Requirement: User Login
The system SHALL allow registered users to authenticate via email and password, returning a JWT access token and refresh token.

#### Scenario: Successful login
- **WHEN** user provides correct email and password credentials
- **THEN** system returns an access token (15min expiry) and a refresh token (7d expiry) set as HttpOnly cookie

#### Scenario: Invalid credentials
- **WHEN** user provides incorrect email or password
- **THEN** system returns a 401 Unauthorized error with a generic message

### Requirement: Token Refresh
The system SHALL provide an endpoint to exchange a valid refresh token for a new access token.

#### Scenario: Successful token refresh
- **WHEN** user sends a valid, non-expired refresh token
- **THEN** system returns a new access token

#### Scenario: Expired refresh token
- **WHEN** user sends an expired refresh token
- **THEN** system returns a 401 Unauthorized error requiring re-login

### Requirement: User Logout
The system SHALL provide a logout endpoint that invalidates the refresh token.

#### Scenario: Successful logout
- **WHEN** user calls the logout endpoint with a valid session
- **THEN** system invalidates the refresh token and returns 200 OK

### Requirement: Session Protection
All protected API endpoints SHALL require a valid JWT access token in the Authorization header.

#### Scenario: Access without token
- **WHEN** a request is made without an Authorization header
- **THEN** system returns 401 Unauthorized

#### Scenario: Access with expired token
- **WHEN** a request is made with an expired JWT
- **THEN** system returns 401 Unauthorized
