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

      // Check if loadPyodide is available
      if (typeof loadPyodide !== 'function') {
        console.error(
          'loadPyodide is not defined. Make sure pyodide.js is loaded from the CDN before this script runs.'
        );
        appState.setLoading(false);
        throw new Error(
          'loadPyodide is not defined. Pyodide script may not be loaded.'
        );
      }

      // Load Pyodide
      this.pyodide = await loadPyodide();

      // Load required packages
      for (const pkg of CONFIG.PYODIDE.PACKAGES) {
        try {
          await this.pyodide.loadPackage(pkg);
        } catch (pkgError) {
          console.error(`Failed to load Pyodide package: ${pkg}`, pkgError);
          appState.setLoading(false);
          throw new Error(`Failed to load Pyodide package: ${pkg}`);
        }
      }

      // Initialize Python environment
      try {
        await this.pyodide.runPythonAsync(CONFIG.PYODIDE.INIT_SCRIPT);
      } catch (pyInitError) {
        console.error(
          'Failed to run Python environment init script:',
          pyInitError
        );
        appState.setLoading(false);
        throw new Error(
          'Failed to initialize Python environment (init script failed)'
        );
      }

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
