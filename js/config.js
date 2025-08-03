// Application Configuration
export const CONFIG = {
  // API Configuration
  API: {
    KEY: '', // Automatically provided by the environment
    BASE_URL:
      'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-05-20:generateContent',
    MAX_RETRIES: 5,
    INITIAL_RETRY_DELAY: 1000,
    RETRY_MULTIPLIER: 2,
  },

  // UI Configuration
  UI: {
    LOADING_MESSAGES: {
      INITIALIZING: 'Initializing Python environment...',
      GENERATING_CONTENT: 'Generating content...',
      GENERATING_EXERCISE: 'Generating a new exercise...',
    },
    COLORS: {
      SUCCESS: '#34d399',
      ERROR: '#f87171',
    },
    CHAT: {
      MAX_CONTEXT_LENGTH: 50, // Prevent context from growing too large
      WELCOME_MESSAGE:
        "Hello! Welcome to your Python course. I'm your AI tutor. Ask me anything!",
      NEW_EXERCISE_MESSAGE:
        "Okay, here's a new challenge for you! Let me know if you need any help.",
    },
  },

  // Pyodide Configuration
  PYODIDE: {
    PACKAGES: ['micropip'],
    INIT_SCRIPT: `
      import sys
      import io
      sys.stdout = io.StringIO()
      sys.stderr = io.StringIO()
    `,
  },

  // Lesson Configuration
  LESSON: {
    DEFAULT_TOPIC: 'variables, data types, and basic operations',
    PROMPT_TEMPLATE: `Generate a new lesson for an interactive Python course. 
      The topic is {topic}. Include an explanation, a simple code example, and an exercise for the user to complete. 
      Structure the response using Markdown. The exercise should have a clear goal and an empty code block for the user to fill in.`,
    EXERCISE_PROMPT_TEMPLATE: `Generate a new and more challenging exercise based on the current topic: {topic}. 
      The exercise should be self-contained and ready for the student to solve. It should include a clear problem description and an empty code block.`,
  },

  // Tutor Configuration
  TUTOR: {
    PROMPT_TEMPLATE: `
You are a supportive Python tutor helping a beginner.

The student will write Python code. Your role is to:
- Encourage the student.
- Provide step-by-step **hints**, not full answers.
- Only give full solutions if the student explicitly says something like "show me the full answer" or "I give up".
- Use a friendly, constructive tone.
- Always explain **why** a suggestion is helpful.
- If there's an error, give a hint about what might be wrong and how to fix it.

Here is the student's code:
\`\`\`python
{code}
\`\`\`

{feedbackRequest}
Give your coaching feedback now.
`,
  },
};

// DOM Selectors
export const SELECTORS = {
  UI: {
    COURSE_CONTENT: '#course-content-container',
    CODE_EDITOR: '#code-editor',
    RUN_CODE_BTN: '#run-code',
    NEW_EXERCISE_BTN: '#new-exercise',
    CONSOLE_OUTPUT: '#console',
    CHAT_HISTORY: '#chat-history',
    CHAT_INPUT: '#chat-input',
    SEND_CHAT_BTN: '#send-chat',
    LOADING_OVERLAY: '#loading-overlay',
    LOADING_TEXT: '#loading-text',
  },
  MODAL: {
    CONTAINER: '#custom-modal',
    TITLE: '#modal-title',
    MESSAGE: '#modal-message',
    OK_BUTTON: '#modal-ok-button',
  },
};

// Error Messages
export const ERROR_MESSAGES = {
  PYODIDE_NOT_READY:
    'The Python environment is still loading. Please wait a moment.',
  API_CONNECTION: 'Could not connect to the AI tutor. Please try again.',
  API_RATE_LIMIT: 'API rate limit exceeded. Retrying...',
  DEFAULT_ERROR:
    "Sorry, I'm having trouble connecting right now. Please try again later.",
  UNEXPECTED_RESPONSE:
    'LLM response format is unexpected or content is missing.',
};
