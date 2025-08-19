import { SELECTORS, CONFIG } from './config.js';
import { appState } from './state.js';

// UI Service for DOM interactions
class UIService {
  constructor() {
    this.elements = {};
    this.md = window.markdownit();
    this._initializeElements();
    this._setupEventListeners();
  }

  // Initialize DOM elements
  _initializeElements() {
    this.elements = {
      // UI Elements
      courseContent: document.querySelector(SELECTORS.UI.COURSE_CONTENT),
      codeEditor: document.querySelector(SELECTORS.UI.CODE_EDITOR),
      runCodeBtn: document.querySelector(SELECTORS.UI.RUN_CODE_BTN),
      newExerciseBtn: document.querySelector(SELECTORS.UI.NEW_EXERCISE_BTN),
      consoleOutput: document.querySelector(SELECTORS.UI.CONSOLE_OUTPUT),
      chatHistory: document.querySelector(SELECTORS.UI.CHAT_HISTORY),
      chatInput: document.querySelector(SELECTORS.UI.CHAT_INPUT),
      sendChatBtn: document.querySelector(SELECTORS.UI.SEND_CHAT_BTN),
      loadingOverlay: document.querySelector(SELECTORS.UI.LOADING_OVERLAY),
      loadingText: document.querySelector(SELECTORS.UI.LOADING_TEXT),

      // Modal Elements
      modal: document.querySelector(SELECTORS.MODAL.CONTAINER),
      modalTitle: document.querySelector(SELECTORS.MODAL.TITLE),
      modalMessage: document.querySelector(SELECTORS.MODAL.MESSAGE),
      modalOkButton: document.querySelector(SELECTORS.MODAL.OK_BUTTON),

      // Lesson Elements
      lessonTitle: document.querySelector(SELECTORS.UI.LESSON_TITLE),
      lessonInstructions: document.querySelector(
        SELECTORS.UI.LESSON_INSTRUCTIONS
      ),
      lessonCodeEditor: document.querySelector(SELECTORS.UI.LESSON_CODE_EDITOR),
      lessonRunBtn: document.querySelector(SELECTORS.UI.LESSON_RUN_BTN),
      lessonOutput: document.querySelector(SELECTORS.UI.LESSON_OUTPUT),
    };
    // Log which elements are found or missing
    Object.entries(this.elements).forEach(([key, el]) => {
      if (el) {
        console.log(`[UI INIT] Found element: ${key}`);
      } else {
        console.warn(`[UI INIT] Missing element: ${key}`);
      }
    });
  }

  // Setup event listeners
  _setupEventListeners() {
    // Modal close
    this.elements.modalOkButton?.addEventListener('click', () => {
      this.hideModal();
    });

    // Chat input enter key
    this.elements.chatInput?.addEventListener('keydown', e => {
      if (e.key === 'Enter') {
        this.elements.sendChatBtn?.click();
      }
    });

    // Subscribe to state changes
    appState.subscribe('isPyodideReady', ready => {
      this._updateButtonStates(ready);
    });

    appState.subscribe('isLoading', loading => {
      this._updateLoadingState(loading);
    });

    appState.subscribe('loadingMessage', message => {
      this._updateLoadingMessage(message);
    });
  }

  // Update button states based on Pyodide readiness
  _updateButtonStates(isReady) {
    if (this.elements.runCodeBtn) {
      this.elements.runCodeBtn.disabled = !isReady;
    }
    if (this.elements.newExerciseBtn) {
      this.elements.newExerciseBtn.disabled = !isReady;
    }
  }

  // Update loading overlay
  _updateLoadingState(isLoading) {
    if (this.elements.loadingOverlay) {
      if (isLoading) {
        this.elements.loadingOverlay.classList.remove('hidden');
      } else {
        this.elements.loadingOverlay.classList.add('hidden');
      }
    }
  }

  // Update loading message
  _updateLoadingMessage(message) {
    if (this.elements.loadingText && message) {
      this.elements.loadingText.textContent = message;
    }
  }

  // Show modal
  showModal(title, message) {
    if (this.elements.modalTitle) {
      this.elements.modalTitle.textContent = title;
    }
    if (this.elements.modalMessage) {
      this.elements.modalMessage.textContent = message;
    }
    if (this.elements.modal) {
      this.elements.modal.classList.remove('hidden');
    }
  }

  // Hide modal
  hideModal() {
    if (this.elements.modal) {
      this.elements.modal.classList.add('hidden');
    }
  }

  // Update course content
  updateCourseContent(content) {
    if (this.elements.courseContent) {
      this.elements.courseContent.innerHTML = this.md.render(content);
    }
  }

  // Get code from editor
  getCode() {
    return this.elements.codeEditor?.value || '';
  }

  // Set code in editor
  setCode(code) {
    if (this.elements.codeEditor) {
      this.elements.codeEditor.value = code;
    }
  }

  // Update console output
  updateConsoleOutput(output, isError = false) {
    if (this.elements.consoleOutput) {
      this.elements.consoleOutput.textContent = output;
      this.elements.consoleOutput.style.color = isError
        ? CONFIG.UI.COLORS.ERROR
        : CONFIG.UI.COLORS.SUCCESS;
    }
  }

  // Clear console output
  clearConsoleOutput() {
    this.updateConsoleOutput('');
  }

  // Add message to chat
  addChatMessage(sender, message, isUser) {
    if (!this.elements.chatHistory) return;

    const messageDiv = document.createElement('div');
    messageDiv.classList.add('flex', isUser ? 'justify-end' : 'justify-start');

    const contentDiv = document.createElement('div');
    contentDiv.classList.add(
      'max-w-xs',
      'md:max-w-lg',
      'p-3',
      'rounded-lg',
      'break-words'
    );
    contentDiv.classList.add(isUser ? 'bg-blue-600' : 'bg-gray-700');
    contentDiv.innerHTML = `
      <p class="font-bold text-sm">${sender}</p>
      <div class="prose">${this.md.render(message)}</div>
    `;

    messageDiv.appendChild(contentDiv);
    this.elements.chatHistory.appendChild(messageDiv);

    // Auto-scroll to bottom
    this.elements.chatHistory.scrollTop =
      this.elements.chatHistory.scrollHeight;
  }

  // Clear chat history
  clearChatHistory() {
    if (this.elements.chatHistory) {
      this.elements.chatHistory.innerHTML = '';
    }
  }

  // Get chat input value
  getChatInput() {
    return this.elements.chatInput?.value?.trim() || '';
  }

  // Clear chat input
  clearChatInput() {
    if (this.elements.chatInput) {
      this.elements.chatInput.value = '';
    }
  }

  // Get current topic from course content
  getCurrentTopic() {
    if (this.elements.courseContent) {
      const h1 = this.elements.courseContent.querySelector('h1');
      return h1?.textContent || CONFIG.LESSON.DEFAULT_TOPIC;
    }
    return CONFIG.LESSON.DEFAULT_TOPIC;
  }

  // Add event listener to button
  addButtonListener(buttonName, callback) {
    const button = this.elements[buttonName];
    if (button) {
      button.addEventListener('click', callback);
      console.log(`[UI] Event listener attached to: ${buttonName}`);
    } else {
      console.warn(
        `[UI] Tried to attach listener to missing button: ${buttonName}`
      );
    }
  }

  // Get element by name
  getElement(name) {
    return this.elements[name];
  }

  // Lesson-specific methods
  updateLessonTitle(title) {
    if (this.elements.lessonTitle) {
      this.elements.lessonTitle.textContent = title;
    }
  }

  updateLessonInstructions(instructions) {
    if (this.elements.lessonInstructions) {
      this.elements.lessonInstructions.textContent = instructions;
    }
  }

  getLessonCode() {
    return this.elements.lessonCodeEditor?.value || '';
  }

  setLessonCode(code) {
    if (this.elements.lessonCodeEditor) {
      this.elements.lessonCodeEditor.value = code;
    }
  }

  updateLessonOutput(output, isError = false) {
    if (this.elements.lessonOutput) {
      this.elements.lessonOutput.textContent = output;
      this.elements.lessonOutput.style.color = isError
        ? CONFIG.UI.COLORS.ERROR
        : CONFIG.UI.COLORS.SUCCESS;

      // Add some styling for better visibility
      if (output) {
        this.elements.lessonOutput.style.backgroundColor = isError
          ? 'rgba(248, 113, 113, 0.1)'
          : 'rgba(52, 211, 153, 0.1)';
        this.elements.lessonOutput.style.padding = '12px';
        this.elements.lessonOutput.style.borderRadius = '8px';
        this.elements.lessonOutput.style.border = `1px solid ${isError ? CONFIG.UI.COLORS.ERROR : CONFIG.UI.COLORS.SUCCESS}`;
      } else {
        this.elements.lessonOutput.style.backgroundColor = '';
        this.elements.lessonOutput.style.padding = '';
        this.elements.lessonOutput.style.borderRadius = '';
        this.elements.lessonOutput.style.border = '';
      }
    }
  }

  clearLessonOutput() {
    this.updateLessonOutput('');
  }

  addLessonButtonListener(callback) {
    if (this.elements.lessonRunBtn) {
      this.elements.lessonRunBtn.addEventListener('click', callback);
    }
  }

  // Create lesson UI if it doesn't exist
  createLessonUI() {
    if (!this.elements.lessonTitle) {
      this._injectLessonHTML();
      this._initializeElements(); // Re-initialize to get new elements
    }
  }

  _injectLessonHTML() {
    const courseContent = this.elements.courseContent;
    if (courseContent) {
      courseContent.innerHTML = `
        <div class="lesson-container space-y-6">
          <div class="lesson-header">
            <h2 id="lesson-title" class="text-2xl font-bold text-white mb-2">${CONFIG.LESSON.FIRST_LESSON.TITLE}</h2>
            <p id="lesson-instructions" class="text-gray-300 mb-4">${CONFIG.LESSON.FIRST_LESSON.INSTRUCTIONS}</p>
          </div>
          
          <div class="lesson-code-section">
            <label for="lesson-code-editor" class="block text-sm font-medium text-gray-300 mb-2">Your Code:</label>
            <textarea 
              id="lesson-code-editor" 
              class="w-full h-32 p-4 bg-gray-900 border border-gray-700 rounded-lg font-mono text-white resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Write your Python code here..."
            >${CONFIG.LESSON.FIRST_LESSON.DEFAULT_CODE}</textarea>
            
            <div class="mt-4 flex justify-between items-center">
              <button 
                id="lesson-run-btn" 
                class="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-green-500"
              >
                Run Code
              </button>
            </div>
          </div>
          
          <div class="lesson-output-section">
            <label class="block text-sm font-medium text-gray-300 mb-2">Output:</label>
            <pre id="lesson-output" class="w-full min-h-16 p-4 bg-gray-900 border border-gray-700 rounded-lg text-sm font-mono overflow-auto whitespace-pre-wrap"></pre>
          </div>
        </div>
      `;
    }
  }
}

// Create singleton instance
export const uiService = new UIService();
