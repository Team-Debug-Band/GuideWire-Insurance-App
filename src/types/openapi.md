# Open API Contract - Dev 1 

## Worker API Contracts

### `POST /api/v1/auth/signup`
- **Request Body**: `UserCreate` (`email` or `phone`, `password`)
- **Response**: `Token` (`access_token`, `token_type`)

### `POST /api/v1/auth/login`
- **Request Body**: `OAuth2PasswordRequestForm` (`username` -> email/phone, `password`)
- **Response**: `Token` (`access_token`, `token_type`)

### `GET /api/v1/workers/me`
- **Headers**: `Authorization: Bearer <token>`
- **Response**: `DashboardResponse` (Contains worker profile, linked platforms, and active policy if any)

### `POST /api/v1/workers/me/profile`
- **Headers**: `Authorization: Bearer <token>`
- **Request Body**: `WorkerProfileUpdate` (`first_name`, `last_name`)
- **Response**: `WorkerProfileResponse`

### `POST /api/v1/workers/me/platforms`
- **Headers**: `Authorization: Bearer <token>`
- **Request Body**: `PlatformAccountCreate` (`platform_name`, `account_identifier`, `avg_weekly_earnings`, `tenure_months`)
- **Response**: `PlatformAccountResponse`

### `POST /api/v1/workers/me/policy`
- **Headers**: `Authorization: Bearer <token>`
- **Response**: `PolicyResponse` (Calculates expected income, coverage ratio, and creates the policy)
