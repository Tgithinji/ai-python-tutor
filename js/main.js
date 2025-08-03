const API_KEY = ''; // Automatically provided by the environment
const API_URL =
  'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-05-20:generateContent?key=' +
  API_KEY;
const md = window.markdownit();

// UI Elements
const courseContentContainer = document.getElementById(
  'course-content-container'
);
const codeEditor = document.getElementById('code-editor');
const runCodeBtn = document.getElementById('run-code');
const newExerciseBtn = document.getElementById('new-exercise');
const consoleOutput = document.getElementById('console');
const chatHistory = document.getElementById('chat-history');
const chatInput = document.getElementById('chat-input');
const sendChatBtn = document.getElementById('send-chat');
const loadingOverlay = document.getElementById('loading-overlay');
const loadingText = document.getElementById('loading-text');

// Custom Modal Elements
const customModal = document.getElementById('custom-modal');
const modalTitle = document.getElementById('modal-title');
const modalMessage = document.getElementById('modal-message');
const modalOkButton = document.getElementById('modal-ok-button');

// State Management
let pyodide;
let isPyodideReady = false;
let currentLesson = '';
let chatContext = [];
let retryDelay = 1000;
let lessonId = 1;

// Custom alert function to replace window.alert
function customAlert(title, message) {
  modalTitle.textContent = title;
  modalMessage.textContent = message;
  customModal.classList.remove('hidden');
}

modalOkButton.addEventListener('click', () => {
  customModal.classList.add('hidden');
});

// Function to call the LLM API
async function callLLM(prompt, role = 'user') {
  showLoading(true);
  const chatHistory = chatContext.slice();
  chatHistory.push({ role: role, parts: [{ text: prompt }] });
  const payload = { contents: chatHistory };

  for (let i = 0; i < 5; i++) {
    // Exponential backoff retry loop
    try {
      const response = await fetch(API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        if (response.status === 429) {
          // Too many requests
          console.error(
            `API rate limit exceeded. Retrying in ${retryDelay / 1000}s...`
          );
          await new Promise(res => setTimeout(res, retryDelay));
          retryDelay *= 2;
          continue;
        } else {
          throw new Error(`API returned status code ${response.status}`);
        }
      }

      const result = await response.json();
      if (
        result.candidates &&
        result.candidates.length > 0 &&
        result.candidates[0].content &&
        result.candidates[0].content.parts &&
        result.candidates[0].content.parts.length > 0
      ) {
        const text = result.candidates[0].content.parts[0].text;
        showLoading(false);
        retryDelay = 1000; // Reset delay on success
        return text;
      } else {
        throw new Error(
          'LLM response format is unexpected or content is missing.'
        );
      }
    } catch (error) {
      console.error('Error calling LLM API:', error);
      showLoading(false);
      customAlert(
        'Error',
        'Could not connect to the AI tutor. Please try again.'
      );
      break;
    }
  }
  showLoading(false);
  return "Sorry, I'm having trouble connecting right now. Please try again later.";
}

// Show/hide loading overlay
function showLoading(show, message = 'Generating content...') {
  if (show) {
    loadingText.textContent = message;
    loadingOverlay.classList.remove('hidden');
  } else {
    loadingOverlay.classList.add('hidden');
  }
}

// --- Core Application Logic ---

// Function to initialize Pyodide
async function initializePyodide() {
  showLoading(true, 'Initializing Python environment...');
  pyodide = await loadPyodide();
  await pyodide.loadPackage('micropip');
  await pyodide.runPythonAsync(`
                import sys
                import io
                sys.stdout = io.StringIO()
                sys.stderr = io.StringIO()
            `);
  isPyodideReady = true;
  runCodeBtn.disabled = false;
  newExerciseBtn.disabled = false;
  console.log('Pyodide is ready.');
  showLoading(false);
}

// Function to generate and display a new lesson
async function generateLesson() {
  const prompt = `Generate a new lesson for an interactive Python course. 
            The topic is variables, data types, and basic operations. Include an explanation, a simple code example, and an exercise for the user to complete. 
            Structure the response using Markdown. The exercise should have a clear goal and an empty code block for the user to fill in.`;

  const lessonContent = await callLLM(prompt);
  currentLesson = lessonContent;
  courseContentContainer.innerHTML = md.render(lessonContent);
  chatHistory.innerHTML = ''; // Clear chat for new lesson
  chatContext = [
    {
      role: 'model',
      parts: [
        {
          text: "Hello! Welcome to your Python course. I'm your AI tutor. Ask me anything!",
        },
      ],
    },
  ];
  appendMessage(
    'AI Tutor',
    "Hello! Welcome to your Python course. I'm your AI tutor. Ask me anything!",
    false
  );
  // Append the generated lesson to the chat context
  chatContext.push({ role: 'model', parts: [{ text: currentLesson }] });
}

// This function builds the prompt for the AI tutor to provide hints
const getPrompt = (code, feedbackRequest) => `
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
${code}
\`\`\`

${feedbackRequest ? `The student said: "${feedbackRequest}"` : ''}
Give your coaching feedback now.
`;

// Function to handle code execution
runCodeBtn.addEventListener('click', async () => {
  const code = codeEditor.value;
  consoleOutput.textContent = ''; // Clear previous output

  if (!isPyodideReady) {
    customAlert(
      'Pyodide not ready',
      'The Python environment is still loading. Please wait a moment.'
    );
    return;
  }

  try {
    // Clear Pyodide's stdout and stderr streams
    await pyodide.runPythonAsync(
      'sys.stdout = io.StringIO()\nsys.stderr = io.StringIO()'
    );

    await pyodide.runPythonAsync(code);

    const stdout = await pyodide.runPythonAsync('sys.stdout.getvalue()');
    const stderr = await pyodide.runPythonAsync('sys.stderr.getvalue()');

    if (stderr) {
      consoleOutput.textContent = stderr;
      consoleOutput.style.color = '#f87171'; // Red for error
      sendFeedbackToTutor(code, null, stderr);
    } else {
      consoleOutput.textContent =
        stdout || 'Code executed successfully, no output.';
      consoleOutput.style.color = '#34d399'; // Green for success
      sendFeedbackToTutor(code, stdout, null);
    }
  } catch (error) {
    consoleOutput.textContent = `Error: ${error.message}`;
    consoleOutput.style.color = '#f87171'; // Red for error
    sendFeedbackToTutor(code, null, error.message);
  }
});

async function sendFeedbackToTutor(code, output, error) {
  let feedbackRequest;
  if (error) {
    feedbackRequest = `It resulted in an error: "${error}"`;
  } else {
    feedbackRequest = `The output was: "${output}". Please check if the exercise was completed correctly.`;
  }
  const userPrompt = getPrompt(code, feedbackRequest);

  const aiResponse = await callLLM(userPrompt, 'user');
  appendMessage('AI Tutor', aiResponse, false);
}

// Function to append a message to the chat history
function appendMessage(sender, message, isUser) {
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
  contentDiv.innerHTML = `<p class="font-bold text-sm">${sender}</p><div class="prose">${md.render(message)}</div>`;

  messageDiv.appendChild(contentDiv);
  chatHistory.appendChild(messageDiv);
  chatHistory.scrollTop = chatHistory.scrollHeight; // Auto-scroll to the bottom

  if (isUser) {
    chatContext.push({ role: 'user', parts: [{ text: message }] });
  } else {
    chatContext.push({ role: 'model', parts: [{ text: message }] });
  }
}

// Handle chat input
sendChatBtn.addEventListener('click', async () => {
  const userMessage = chatInput.value.trim();
  if (userMessage === '') return;

  appendMessage('You', userMessage, true);
  chatInput.value = '';

  const aiResponse = await callLLM(userMessage);
  appendMessage('AI Tutor', aiResponse, false);
});

chatInput.addEventListener('keydown', e => {
  if (e.key === 'Enter') {
    sendChatBtn.click();
  }
});

// Event listener for a new exercise
newExerciseBtn.addEventListener('click', async () => {
  const currentTopic =
    courseContentContainer.querySelector('h1')?.textContent ||
    'variables and data types';
  const prompt = `Generate a new and more challenging exercise based on the current topic: ${currentTopic}. 
            The exercise should be self-contained and ready for the student to solve. It should include a clear problem description and an empty code block.`;
  showLoading(true, 'Generating a new exercise...');
  const newExercise = await callLLM(prompt);
  courseContentContainer.innerHTML = md.render(newExercise);
  showLoading(false);
  chatHistory.innerHTML = ''; // Clear chat for new exercise
  chatContext = [
    {
      role: 'model',
      parts: [
        {
          text: "Okay, here's a new challenge for you! Let me know if you need any help.",
        },
      ],
    },
  ];
  appendMessage(
    'AI Tutor',
    "Okay, here's a new challenge for you! Let me know if you need any help.",
    false
  );
});

// Initial setup on page load
window.onload = async () => {
  await initializePyodide();
  await generateLesson();
};
