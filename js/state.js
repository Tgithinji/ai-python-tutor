// Application State Management
class AppState {
  constructor() {
    this._state = {
      // Pyodide state
      pyodide: null,
      isPyodideReady: false,

      // Lesson state
      currentLesson: '',
      lessonId: 1,

      // Chat state
      chatContext: [],

      // UI state
      isLoading: false,
      loadingMessage: '',

      // API state
      retryDelay: 1000,
    };

    this._listeners = new Map();
  }

  // Get state value
  get(key) {
    return this._state[key];
  }

  // Set state value and notify listeners
  set(key, value) {
    this._state[key] = value;
    this._notifyListeners(key, value);
  }

  // Subscribe to state changes
  subscribe(key, callback) {
    if (!this._listeners.has(key)) {
      this._listeners.set(key, new Set());
    }
    this._listeners.get(key).add(callback);

    // Return unsubscribe function
    return () => {
      const listeners = this._listeners.get(key);
      if (listeners) {
        listeners.delete(callback);
      }
    };
  }

  // Notify all listeners for a key
  _notifyListeners(key, value) {
    const listeners = this._listeners.get(key);
    if (listeners) {
      listeners.forEach(callback => {
        try {
          callback(value);
        } catch (error) {
          console.error(`Error in state listener for ${key}:`, error);
        }
      });
    }
  }

  // Chat context management
  addChatMessage(role, text) {
    const message = { role, parts: [{ text }] };
    this._state.chatContext.push(message);

    // Prevent context from growing too large
    if (this._state.chatContext.length > 50) {
      this._state.chatContext = this._state.chatContext.slice(-25);
    }
  }

  clearChatContext() {
    this._state.chatContext = [];
  }

  getChatContext() {
    return [...this._state.chatContext];
  }

  // Pyodide state management
  setPyodide(pyodide) {
    this._state.pyodide = pyodide;
    this._state.isPyodideReady = true;
    this._notifyListeners('pyodide', pyodide);
    this._notifyListeners('isPyodideReady', true);
  }

  // Loading state management
  setLoading(loading, message = '') {
    this._state.isLoading = loading;
    this._state.loadingMessage = message;
    this._notifyListeners('isLoading', loading);
    this._notifyListeners('loadingMessage', message);
  }

  // Reset retry delay
  resetRetryDelay() {
    this._state.retryDelay = 1000;
  }

  // Increase retry delay
  increaseRetryDelay() {
    this._state.retryDelay *= 2;
  }

  // Get current retry delay
  getRetryDelay() {
    return this._state.retryDelay;
  }

  // Get all state (for debugging)
  getState() {
    return { ...this._state };
  }
}

// Create singleton instance
export const appState = new AppState();
