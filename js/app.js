import { CONFIG, ERROR_MESSAGES } from './config.js';
import { appState } from './state.js';
import { apiService } from './api.js';
import { pyodideService } from './pyodide.js';
import { uiService } from './ui.js';

// Main Application Controller
class AppController {
  constructor() {
    this.isInitialized = false;
  }

  // Initialize the application
  async initialize() {
    try {
      console.log('Initializing AI Python Tutor...');

      // Initialize Pyodide
      await pyodideService.initialize();

      // Generate initial lesson
      await this.generateLesson();

      // Setup event handlers
      this._setupEventHandlers();

      this.isInitialized = true;
      console.log('Application initialized successfully');
    } catch (error) {
      console.error('Failed to initialize application:', error);
      uiService.showModal('Initialization Error', error.message);
    }
  }

  // Setup event handlers
  _setupEventHandlers() {
    // Run code button
    uiService.addButtonListener('runCodeBtn', () => this.handleRunCode());

    // New exercise button
    uiService.addButtonListener('newExerciseBtn', () =>
      this.handleNewExercise()
    );

    // Send chat button
    uiService.addButtonListener('sendChatBtn', () => this.handleSendChat());
  }

  // Handle code execution
  async handleRunCode() {
    const code = uiService.getCode();

    if (!code.trim()) {
      uiService.updateConsoleOutput('Please enter some code to run.', true);
      return;
    }

    if (!pyodideService.isReady()) {
      uiService.showModal(
        'Pyodide not ready',
        ERROR_MESSAGES.PYODIDE_NOT_READY
      );
      return;
    }

    try {
      uiService.clearConsoleOutput();

      const result = await pyodideService.executeCode(code);

      if (result.success) {
        const output =
          result.stdout || 'Code executed successfully, no output.';
        uiService.updateConsoleOutput(output, false);
        await this.sendFeedbackToTutor(code, result.stdout, null);
      } else {
        uiService.updateConsoleOutput(result.stderr, true);
        await this.sendFeedbackToTutor(code, null, result.stderr);
      }
    } catch (error) {
      const errorMessage = `Error: ${error.message}`;
      uiService.updateConsoleOutput(errorMessage, true);
      await this.sendFeedbackToTutor(code, null, error.message);
    }
  }

  // Handle new exercise generation
  async handleNewExercise() {
    try {
      const currentTopic = uiService.getCurrentTopic();

      appState.setLoading(true, CONFIG.UI.LOADING_MESSAGES.GENERATING_EXERCISE);

      const newExercise = await apiService.generateExercise(currentTopic);

      uiService.updateCourseContent(newExercise);
      uiService.clearChatHistory();

      // Reset chat context
      appState.clearChatContext();
      appState.addChatMessage('model', CONFIG.UI.CHAT.NEW_EXERCISE_MESSAGE);

      uiService.addChatMessage(
        'AI Tutor',
        CONFIG.UI.CHAT.NEW_EXERCISE_MESSAGE,
        false
      );
    } catch (error) {
      console.error('Failed to generate new exercise:', error);
      uiService.showModal(
        'Error',
        'Failed to generate new exercise. Please try again.'
      );
    } finally {
      appState.setLoading(false);
    }
  }

  // Handle chat message sending
  async handleSendChat() {
    const userMessage = uiService.getChatInput();

    if (!userMessage) return;

    try {
      // Add user message to UI and state
      uiService.addChatMessage('You', userMessage, true);
      appState.addChatMessage('user', userMessage);
      uiService.clearChatInput();

      // Get AI response
      const aiResponse = await apiService.callLLM(userMessage);

      // Add AI response to UI and state
      uiService.addChatMessage('AI Tutor', aiResponse, false);
      appState.addChatMessage('model', aiResponse);
    } catch (error) {
      console.error('Failed to send chat message:', error);
      uiService.showModal('Error', 'Failed to send message. Please try again.');
    }
  }

  // Send feedback to tutor
  async sendFeedbackToTutor(code, output, error) {
    try {
      let feedbackRequest;
      if (error) {
        feedbackRequest = `It resulted in an error: "${error}"`;
      } else {
        feedbackRequest = `The output was: "${output}". Please check if the exercise was completed correctly.`;
      }

      const aiResponse = await apiService.getTutorFeedback(
        code,
        feedbackRequest
      );
      uiService.addChatMessage('AI Tutor', aiResponse, false);
      appState.addChatMessage('model', aiResponse);
    } catch (error) {
      console.error('Failed to get tutor feedback:', error);
    }
  }

  // Generate lesson
  async generateLesson(topic = CONFIG.LESSON.DEFAULT_TOPIC) {
    try {
      const lessonContent = await apiService.generateLesson(topic);

      appState.set('currentLesson', lessonContent);
      uiService.updateCourseContent(lessonContent);
      uiService.clearChatHistory();

      // Initialize chat context
      appState.clearChatContext();
      appState.addChatMessage('model', CONFIG.UI.CHAT.WELCOME_MESSAGE);
      appState.addChatMessage('model', lessonContent);

      uiService.addChatMessage(
        'AI Tutor',
        CONFIG.UI.CHAT.WELCOME_MESSAGE,
        false
      );
    } catch (error) {
      console.error('Failed to generate lesson:', error);
      uiService.showModal(
        'Error',
        'Failed to generate lesson. Please refresh the page.'
      );
    }
  }

  // Reset application state
  async reset() {
    try {
      await pyodideService.reset();
      appState.clearChatContext();
      uiService.clearChatHistory();
      uiService.clearConsoleOutput();
      uiService.setCode('');

      console.log('Application state reset');
    } catch (error) {
      console.error('Failed to reset application:', error);
    }
  }

  // Get application status
  getStatus() {
    return {
      isInitialized: this.isInitialized,
      pyodideReady: pyodideService.isReady(),
      isLoading: appState.get('isLoading'),
      chatContextLength: appState.getChatContext().length,
    };
  }
}

// Create and export singleton instance
export const appController = new AppController();

// Initialize app when DOM is loaded
window.addEventListener('DOMContentLoaded', () => {
  appController.initialize();
});
