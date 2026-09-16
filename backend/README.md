# Finance Buddy API

Secure Java/Spring Boot boundary for the Finance Buddy browser app.

## Run

Requirements: Java 21 and Maven 3.9+.

```bash
cp .env.example .env
mvn spring-boot:run
```

The API listens on `http://localhost:8080`.

## Routes

- `GET /api/v1/health` is public.
- `POST /api/v1/expenses` requires a JWT and an `Idempotency-Key` header.
- `POST /api/v1/connections/finvu/sync` requires a JWT and remains unavailable until the Finvu consent integration is configured.
- `POST /api/v1/assistant/messages` requires a JWT and remains unavailable until the server-side Grok integration is configured.

## Security boundary

The browser must never receive `FINVU_CLIENT_SECRET`, `XAI_API_KEY`, database credentials, or provider access tokens. Configure `AUTH_ISSUER_URI` with the production identity provider and keep all secrets in the deployment platform’s secret manager. The current integrations intentionally fail closed when their enabled flags are false.

Before production, add persistent storage, user/business authorization checks, encrypted provider-token storage, consent and revocation records, audit logging, rate limits, request tracing, and integration contract tests.
