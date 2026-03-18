# Mock API for Flutter Assignment

This project exposes the mock routes required by the assignment:

- `GET /suggestions?page=1&limit=10`
- `POST /chat`
- `GET /chat/history`

`POST /chat` now supports a real AI response path through OpenRouter's free model router when `OPENROUTER_API_KEY` is configured. If the key is missing, the route falls back to the existing mock reply behavior so local development still works without extra setup.

## Run locally

```bash
npm install
npm start
```

The server uses `PORT` when provided, otherwise it starts on `3000`.

## AI chat setup

Set these environment variables before starting the server if you want `POST /chat` to call a real AI model:

```bash
export OPENROUTER_API_KEY=your_api_key_here
export OPENROUTER_MODEL=openrouter/free
npm start
```

Optional variables:

- `OPENROUTER_MODEL`: defaults to `openrouter/free`
- `OPENROUTER_API_URL`: defaults to `https://openrouter.ai/api/v1/chat/completions`

Example request:

```bash
curl -X POST http://localhost:3000/chat \
  -H "Content-Type: application/json" \
  -d '{"message":"Explain Flutter state management in simple terms."}'
```
