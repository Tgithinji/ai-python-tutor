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
    };
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
    }
  }

  // Get element by name
  getElement(name) {
    return this.elements[name];
  }
}

// Create singleton instance
export const uiService = new UIService();
