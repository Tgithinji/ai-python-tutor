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

      // Log before Pyodide initialization
      console.log('About to initialize Pyodide...');
      await pyodideService.initialize();
      console.log('Pyodide initialized, now initializing first lesson...');

      // Initialize first lesson
      this.initializeFirstLesson();
      console.log('First lesson initialized, setting up event handlers...');

      // Setup event handlers
      this._setupEventHandlers();

      this.isInitialized = true;
      console.log('Application initialized successfully');

      // Show app before initializing UI elements
      const loadingOverlay = document.getElementById('loadingOverlay');
      const appEl = document.getElementById('app');
      if (appEl) {
        appEl.classList.remove('hidden');
        console.log('[UI] #app shown');
      } else {
        console.warn('[UI] #app not found');
      }
      if (loadingOverlay) {
        loadingOverlay.classList.add('hidden');
        console.log('[UI] #loadingOverlay hidden');
      } else {
        console.warn('[UI] #loadingOverlay not found');
      }

      // Now log presence of lesson UI elements
      const lessonIds = [
        'lessonTitle',
        'lessonInstructions',
        'lessonCodeEditor',
        'lessonRunBtn',
        'lessonOutput',
      ];
      lessonIds.forEach(id => {
        const el = document.getElementById(id);
        if (el) {
          console.log(`[UI] Found #${id}`);
        } else {
          console.warn(`[UI] Missing #${id}`);
        }
      });
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

    // Lesson run button
    uiService.addLessonButtonListener(() => this.handleLessonRunCode());
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

  // Handle lesson code execution
  async handleLessonRunCode() {
    const code = uiService.getLessonCode();

    if (!code.trim()) {
      uiService.updateLessonOutput('Please enter some code to run.', true);
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
      // Update state with current code
      appState.setCurrentCode(code);
      uiService.clearLessonOutput();

      const result = await pyodideService.executeCode(code);

      if (result.success) {
        const output =
          result.stdout || 'Code executed successfully, no output.';
        appState.setLessonOutput(output);
        uiService.updateLessonOutput(output, false);
      } else {
        appState.setLessonError(result.stderr);
        uiService.updateLessonOutput(result.stderr, true);
      }
    } catch (error) {
      const errorMessage = `Error: ${error.message}`;
      appState.setLessonError(errorMessage);
      uiService.updateLessonOutput(errorMessage, true);
    }
  }

  // Initialize first lesson
  initializeFirstLesson() {
    uiService.createLessonUI();

    // Set up state listeners for lesson
    appState.subscribe('lessonOutput', output => {
      if (output) {
        uiService.updateLessonOutput(output, false);
      }
    });

    appState.subscribe('lessonError', error => {
      if (error) {
        uiService.updateLessonOutput(error, true);
      }
    });

    appState.subscribe('currentCode', code => {
      uiService.setLessonCode(code);
    });
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

// Multilingual support
async function loadLanguage(lang) {
  try {
    const resp = await fetch(`lang/${lang}.json`);
    if (!resp.ok) throw new Error('Language file not found');
    return await resp.json();
  } catch (e) {
    console.error('Failed to load language file:', e);
    return {};
  }
}

function updateI18nTexts(translations) {
  document.querySelectorAll('[data-i18n]').forEach(el => {
    const key = el.getAttribute('data-i18n');
    if (translations[key]) {
      if (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA') {
        el.placeholder = translations[key];
      } else if (el.tagName === 'OPTION') {
        el.textContent = translations[key];
      } else {
        el.textContent = translations[key];
      }
    }
  });
}

async function setLanguage(lang) {
  localStorage.setItem('lang', lang);
  const translations = await loadLanguage(lang);
  updateI18nTexts(translations);
}

document.addEventListener('DOMContentLoaded', () => {
  const langSwitcher = document.getElementById('lang-switcher');
  if (langSwitcher) {
    // Set initial language
    const savedLang = localStorage.getItem('lang') || 'en';
    langSwitcher.value = savedLang;
    setLanguage(savedLang);
    langSwitcher.addEventListener('change', e => {
      setLanguage(e.target.value);
    });
  }
});
