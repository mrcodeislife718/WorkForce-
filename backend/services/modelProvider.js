const axios = require('axios');

function configuration() {
  const baseUrl = String(process.env.MODEL_API_BASE_URL || '').replace(/\/$/, '');
  const apiKey = process.env.MODEL_API_KEY;
  const model = process.env.MODEL_ID;
  const provider = process.env.MODEL_PROVIDER || 'openai-compatible';
  if (!baseUrl || !apiKey || !model) {
    const error = new Error('A real model provider must be configured with MODEL_API_BASE_URL, MODEL_API_KEY, and MODEL_ID.');
    error.code = 'MODEL_PROVIDER_NOT_CONFIGURED';
    throw error;
  }
  return { baseUrl, apiKey, model, provider };
}

function extractText(data) {
  const chatText = data?.choices?.[0]?.message?.content;
  if (typeof chatText === 'string' && chatText.trim()) return chatText.trim();
  const outputText = data?.output_text;
  if (typeof outputText === 'string' && outputText.trim()) return outputText.trim();
  const responseText = data?.output
    ?.flatMap((item) => item?.content || [])
    ?.map((item) => item?.text)
    ?.filter(Boolean)
    ?.join('\n');
  if (responseText) return responseText.trim();
  throw new Error('The model provider returned no text output.');
}

async function generateText({ system, messages, temperature = 0.2, maxTokens = 2000 }) {
  const config = configuration();
  const response = await axios.post(
    `${config.baseUrl}/chat/completions`,
    {
      model: config.model,
      temperature,
      max_tokens: maxTokens,
      messages: [
        ...(system ? [{ role: 'system', content: system }] : []),
        ...messages.map((message) => ({
          role: message.role === 'digital_employee' ? 'assistant' : message.role === 'customer' ? 'user' : message.role,
          content: message.content,
        })),
      ],
    },
    {
      headers: {
        Authorization: `Bearer ${config.apiKey}`,
        'Content-Type': 'application/json',
      },
      timeout: Number(process.env.MODEL_REQUEST_TIMEOUT_MS || 120000),
      maxContentLength: Number(process.env.MODEL_MAX_RESPONSE_BYTES || 2097152),
      validateStatus: (status) => status >= 200 && status < 300,
    },
  );

  return {
    text: extractText(response.data),
    provider: config.provider,
    model: config.model,
    usage: response.data?.usage || null,
  };
}

async function generateJson(args) {
  const result = await generateText(args);
  const cleaned = result.text.replace(/^```json\s*/i, '').replace(/\s*```$/, '');
  let value;
  try {
    value = JSON.parse(cleaned);
  } catch (error) {
    const invalid = new Error('The configured model did not return valid JSON.');
    invalid.code = 'INVALID_MODEL_JSON';
    throw invalid;
  }
  return { ...result, value };
}

module.exports = { configuration, generateText, generateJson };
