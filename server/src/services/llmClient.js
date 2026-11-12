'use strict';

/**
 * llmClient.js — IBM watsonx.ai inference client.
 *
 * Authentication follows the official Node.js SDK pattern:
 *   - Uses IBM_CREDENTIALS_FILE or env vars for IAM auth
 *   - Requires WATSONX_AI_URL and WATSONX_AI_PROJECT_ID
 *
 * This module is intentionally modular: if credentials are absent,
 * isAvailable() returns false and callers fall back to deterministic methods.
 *
 * Model: ibm/granite-4-h-small
 *   - Granite 4.0, 30B params, multitenant (Dallas/Frankfurt regions)
 *   - Available as of October 2025; replaces deprecated Granite 3.x models
 *   - Granite 3.x (granite-3-8b-instruct etc.) withdrawn from multitenant Feb 2026
 *
 * Lite plan limits (verified from IBM docs, July 2025 update):
 *   - 300,000 tokens/month
 *   - 2 inference requests/second
 *
 * References:
 *   https://cloud.ibm.com/apidocs/watsonx-ai#text-generation
 *   https://cloud.ibm.com/docs/account?topic=account-iamtoken_from_apikey
 */

const DEFAULT_MODEL = 'ibm/granite-4-h-small';

// Cached WatsonXAI instance — initialised lazily on first call
let _watsonxClient = null;
let _initAttempted  = false;

/**
 * Returns true if the watsonx.ai credentials are configured.
 * Does NOT verify that credentials are valid — that happens on the first call.
 */
function isAvailable() {
  return !!(
    process.env.WATSONX_AI_APIKEY &&
    process.env.WATSONX_AI_URL &&
    process.env.WATSONX_AI_PROJECT_ID
  );
}

/**
 * Lazily initialises and returns the WatsonXAI SDK client.
 * Returns null if the SDK is not installed or credentials are missing.
 */
function getClient() {
  if (_initAttempted) return _watsonxClient;
  _initAttempted = true;

  if (!isAvailable()) {
    console.log('[llmClient] watsonx.ai credentials not configured — AI extraction disabled.');
    return null;
  }

  try {
    // The SDK reads WATSONX_AI_AUTH_TYPE and WATSONX_AI_APIKEY from process.env
    // when IBM_CREDENTIALS_FILE is not set. We set them explicitly here.
    process.env.WATSONX_AI_AUTH_TYPE = 'iam';

    const { WatsonXAI } = require('@ibm-cloud/watsonx-ai');

    _watsonxClient = WatsonXAI.newInstance({
      version:    '2024-05-31',
      serviceUrl: process.env.WATSONX_AI_URL,
    });

    console.log('[llmClient] watsonx.ai client initialised ✅');
    return _watsonxClient;
  } catch (err) {
    console.warn('[llmClient] Failed to initialise watsonx.ai SDK:', err.message);
    console.warn('[llmClient] Install with: cd server && npm install @ibm-cloud/watsonx-ai');
    _watsonxClient = null;
    return null;
  }
}

/**
 * Calls the watsonx.ai text generation API.
 *
 * @param {string} prompt  — The full prompt text (system + user combined for Granite 4)
 * @param {object} options — Optional overrides: { maxNewTokens, temperature, modelId }
 * @returns {Promise<string>}  The generated text, or throws on API error.
 */
async function generate(prompt, options = {}) {
  const client = getClient();
  if (!client) {
    throw new Error('watsonx.ai client is not available — credentials not configured');
  }

  const projectId = process.env.WATSONX_AI_PROJECT_ID;
  const modelId   = options.modelId || process.env.WATSONX_AI_MODEL || DEFAULT_MODEL;

  const params = {
    input:     prompt,
    modelId,
    projectId,
    parameters: {
      max_new_tokens: options.maxNewTokens || 800,
      temperature:    options.temperature  || 0.2,  // low temp for structured extraction
      // No top_p / top_k overrides — Granite 4 defaults are appropriate
    },
  };

  const response = await client.generateText(params);

  // SDK returns: response.result.results[0].generated_text
  const text = response?.result?.results?.[0]?.generated_text;
  if (!text) {
    throw new Error('watsonx.ai returned an empty response');
  }

  return text.trim();
}

/**
 * Returns the model ID that will be used for inference.
 * Useful for logging and the Bob Story documentation.
 */
function getModelId() {
  return process.env.WATSONX_AI_MODEL || DEFAULT_MODEL;
}

module.exports = { isAvailable, generate, getModelId };
