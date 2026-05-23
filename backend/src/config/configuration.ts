export default () => ({
  port: parseInt(process.env.PORT || '3000', 10),
  database: {
    url: process.env.DATABASE_URL,
  },
  jwt: {
    secret: process.env.JWT_SECRET || 'change-me-in-production',
    expiresIn: process.env.JWT_EXPIRES_IN || '8h',
  },
  openai: {
    apiKey: process.env.OPENAI_API_KEY,
    model: process.env.OPENAI_MODEL || 'gpt-4o',
    systemPromptVersion: process.env.AI_SYSTEM_PROMPT_VERSION || 'v1.0',
  },
  confidenceThreshold: parseFloat(process.env.CONFIDENCE_THRESHOLD || '0.75'),
  frontendUrl: process.env.FRONTEND_URL || 'http://localhost:5173',
});
