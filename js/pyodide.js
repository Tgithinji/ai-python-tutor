import { CONFIG } from './config.js';
import { appState } from './state.js';

// Pyodide Service for Python environment management
class PyodideService {
  constructor() {
    this.pyodide = null;
    this.isInitialized = false;
  }

  // Initialize Pyodide environment
  async initialize() {
    try {
      appState.setLoading(true, CONFIG.UI.LOADING_MESSAGES.INITIALIZING);

      // Load Pyodide
      this.pyodide = await loadPyodide();

      // Load required packages
      for (const pkg of CONFIG.PYODIDE.PACKAGES) {
        await this.pyodide.loadPackage(pkg);
      }

      // Initialize Python environment
      await this.pyodide.runPythonAsync(CONFIG.PYODIDE.INIT_SCRIPT);

      this.isInitialized = true;
      appState.setPyodide(this.pyodide);

      console.log('Pyodide initialized successfully');
      return true;
    } catch (error) {
      console.error('Failed to initialize Pyodide:', error);
      appState.setLoading(false);
      throw new Error('Failed to initialize Python environment');
    }
  }

  // Execute Python code
  async executeCode(code) {
    if (!this.isInitialized || !this.pyodide) {
      throw new Error('Pyodide not initialized');
    }

    try {
      // Clear previous output
      await this._clearOutput();

      // Execute the code
      await this.pyodide.runPythonAsync(code);

      // Get output
      const stdout = await this.pyodide.runPythonAsync('sys.stdout.getvalue()');
      const stderr = await this.pyodide.runPythonAsync('sys.stderr.getvalue()');

      return {
        stdout: stdout || '',
        stderr: stderr || '',
        success: !stderr,
      };
    } catch (error) {
      return {
        stdout: '',
        stderr: error.message,
        success: false,
      };
    }
  }

  // Clear output streams
  async _clearOutput() {
    if (this.pyodide) {
      await this.pyodide.runPythonAsync(`
        sys.stdout = io.StringIO()
        sys.stderr = io.StringIO()
      `);
    }
  }

  // Check if Pyodide is ready
  isReady() {
    return this.isInitialized && this.pyodide !== null;
  }

  // Get Pyodide instance
  getPyodide() {
    return this.pyodide;
  }

  // Reset Pyodide environment
  async reset() {
    if (this.pyodide) {
      try {
        await this._clearOutput();
        console.log('Pyodide environment reset');
      } catch (error) {
        console.error('Error resetting Pyodide:', error);
      }
    }
  }
}

// Create singleton instance
export const pyodideService = new PyodideService();
