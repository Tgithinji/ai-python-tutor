# AI Python Tutor

An interactive AI-powered Python tutoring application with real-time code execution.

## Features

- 🤖 AI-powered Python tutoring
- 💻 Real-time Python code execution using Pyodide
- 💬 Interactive chat with AI tutor
- 📚 Dynamic lesson generation
- 🎨 Modern, responsive UI with Tailwind CSS

## Getting Started

### Prerequisites

- Node.js (v14 or higher)
- npm or yarn

### Installation

1. Clone or download this project
2. Install dependencies:
   ```bash
   npm install
   ```

### Development

#### Start Live Server

```bash
npm run dev
# or
npm start
```

This will:

- Start a live server on `http://localhost:3000`
- Automatically open your browser to the application
- Watch for file changes and reload the page automatically

#### Available Scripts

- `npm run dev` - Start development server with live reload
- `npm run format` - Format all files with Prettier
- `npm run format:check` - Check if files need formatting
- `npm run lint` - Run ESLint to check code quality
- `npm run lint:fix` - Fix ESLint issues automatically

### Project Structure

```
ai_python_tutor/
├── index.html          # Main HTML file
├── js/
│   └── main.js         # Main JavaScript application
├── css/
│   └── style.css       # Custom styles
├── package.json        # Dependencies and scripts
├── .prettierrc         # Prettier configuration
├── .prettierignore     # Files to ignore by Prettier
└── .liveserverrc       # Live server configuration
```

## Usage

1. Open the application in your browser
2. Wait for Pyodide to initialize (Python environment)
3. Start with the generated lesson or ask the AI tutor questions
4. Write Python code in the editor and run it
5. Get real-time feedback from the AI tutor

## Technologies Used

- **Frontend**: HTML5, CSS3, JavaScript (ES6+)
- **Styling**: Tailwind CSS
- **Python Runtime**: Pyodide (Python in the browser)
- **AI**: Google Gemini API
- **Markdown**: markdown-it
- **Development Tools**: Prettier, ESLint, Live Server

## Configuration

### Prettier Settings

- Single quotes for strings
- Semicolons enabled
- 80 character line width
- 2-space indentation
- Trailing commas (ES5 compatible)

### Live Server Settings

- Port: 3000
- Auto-open browser
- File watching enabled
- 1 second delay for reload

## Troubleshooting

### Live Server Issues

- Make sure port 3000 is not in use
- Check that `index.html` exists in the root directory
- Try running `npm run dev` again

### Python Code Issues

- Ensure Pyodide has fully loaded (check loading overlay)
- Check browser console for JavaScript errors
- Verify your Python syntax

## Contributing

1. Format your code: `npm run format`
2. Check for linting issues: `npm run lint`
3. Test your changes with the live server

## License

MIT License
