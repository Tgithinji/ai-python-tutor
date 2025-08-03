import { CONFIG, ERROR_MESSAGES } from './config.js';
import { appState } from './state.js';

// API Service for LLM interactions
class APIService {
  constructor() {
    this.baseURL = CONFIG.API.BASE_URL;
    this.apiKey = CONFIG.API.KEY;
  }

  // Build the full API URL
  getApiUrl() {
    return `${this.baseURL}?key=${this.apiKey}`;
  }

  // Make API call with retry logic
  async callLLM(prompt, role = 'user') {
    appState.setLoading(true, CONFIG.UI.LOADING_MESSAGES.GENERATING_CONTENT);

    const chatHistory = appState.getChatContext();
    chatHistory.push({ role, parts: [{ text: prompt }] });
    const payload = { contents: chatHistory };

    for (let i = 0; i < CONFIG.API.MAX_RETRIES; i++) {
      try {
        const response = await this._makeRequest(payload);

        if (response.ok) {
          const result = await response.json();
          const text = this._extractResponseText(result);

          if (text) {
            appState.setLoading(false);
            appState.resetRetryDelay();
            return text;
          } else {
            throw new Error(ERROR_MESSAGES.UNEXPECTED_RESPONSE);
          }
        } else {
          await this._handleErrorResponse(response, i);
        }
      } catch (error) {
        await this._handleRequestError(error, i);
      }
    }

    appState.setLoading(false);
    return ERROR_MESSAGES.DEFAULT_ERROR;
  }

  // Make the actual HTTP request
  async _makeRequest(payload) {
    return fetch(this.getApiUrl(), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
  }

  // Extract text from API response
  _extractResponseText(result) {
    if (
      result.candidates &&
      result.candidates.length > 0 &&
      result.candidates[0].content &&
      result.candidates[0].content.parts &&
      result.candidates[0].content.parts.length > 0
    ) {
      return result.candidates[0].content.parts[0].text;
    }
    return null;
  }

  // Handle error responses
  async _handleErrorResponse(response, attempt) {
    if (response.status === 429) {
      // Rate limit exceeded
      const delay = appState.getRetryDelay();
      console.error(
        `${ERROR_MESSAGES.API_RATE_LIMIT} Retrying in ${delay / 1000}s...`
      );
      await this._wait(delay);
      appState.increaseRetryDelay();
    } else {
      throw new Error(`API returned status code ${response.status}`);
    }
  }

  // Handle request errors
  async _handleRequestError(error, attempt) {
    console.error(`Error calling LLM API (attempt ${attempt + 1}):`, error);

    if (attempt === CONFIG.API.MAX_RETRIES - 1) {
      // Last attempt failed
      appState.setLoading(false);
      throw new Error(ERROR_MESSAGES.API_CONNECTION);
    }

    // Wait before retry
    const delay = appState.getRetryDelay();
    await this._wait(delay);
    appState.increaseRetryDelay();
  }

  // Utility function to wait
  _wait(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  // Generate lesson content
  async generateLesson(topic = CONFIG.LESSON.DEFAULT_TOPIC) {
    const prompt = CONFIG.LESSON.PROMPT_TEMPLATE.replace('{topic}', topic);
    return this.callLLM(prompt);
  }

  // Generate new exercise
  async generateExercise(topic) {
    const prompt = CONFIG.LESSON.EXERCISE_PROMPT_TEMPLATE.replace(
      '{topic}',
      topic
    );
    return this.callLLM(prompt);
  }

  // Get tutor feedback
  async getTutorFeedback(code, feedbackRequest = '') {
    const prompt = CONFIG.TUTOR.PROMPT_TEMPLATE.replace('{code}', code).replace(
      '{feedbackRequest}',
      feedbackRequest ? `The student said: "${feedbackRequest}"` : ''
    );

    return this.callLLM(prompt, 'user');
  }
}

// Create singleton instance
export const apiService = new APIService();
