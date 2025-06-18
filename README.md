# Brain Surf CLI

A sophisticated Claude Code-style command-line interface that provides natural language development assistance through the Brain multi-agent system. Brain Surf CLI offers both interactive REPL and direct command execution for comprehensive development workflows.

## 🚀 Features

- **Claude Code-Style Experience**: Natural language development assistance with auto-connection
- **Interactive REPL Mode**: Conversational interface with session management and history
- **Direct Command Execution**: One-shot queries with immediate responses
- **Real-time WebSocket Communication**: Low-latency communication with Brain server
- **Comprehensive Development Tools**: File operations, git management, code analysis, testing
- **Session Persistence**: Conversation history with resumption capabilities
- **Clean Terminal UI**: Professional output formatting with status indicators
- **Multi-Agent Integration**: Access to specialized MCP servers through Brain

## 🎯 Claude Code-Style Usage

### Interactive REPL (Recommended)
```bash
brain  # Auto-connects and starts interactive session
```

### Direct Development Commands
```bash
brain "fix the bug in src/app.js"
brain "analyze this project structure"
brain "run tests and show results"
brain "git status and show recent commits"
brain "read package.json and explain dependencies"
```

### Session Management
```bash
brain -c                    # Continue last conversation
brain -r <session_id>       # Resume specific session
brain -p "quick query"      # Print mode (ask and exit)
```

## 📦 Installation

### Prerequisites

- Node.js 18 or higher
- Brain server running (see [Brain project](../brain/))

### Quick Setup

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Link globally for system-wide access:**
   ```bash
   npm link
   ```

3. **Verify installation:**
   ```bash
   which brain
   brain --help
   ```

### Automated Setup

Use the setup script for complete installation:
```bash
chmod +x setup.sh
./setup.sh
```

This will:
- Check Node.js version
- Install dependencies
- Create environment configuration
- Link CLI globally
- Verify installation

## 🔧 Configuration

### Environment Variables

Create a `.env` file for custom configuration:

```bash
# Brain Server Configuration
BRAIN_WS_URL=ws://localhost:3789
BRAIN_WS_TIMEOUT=5000

# Session Storage (optional)
SESSION_DIR=~/.brain-cli/sessions
```

### Brain Server Integration

The CLI automatically connects to the Brain server. Ensure the Brain server is running:

```bash
# In the brain project directory
source .venv/bin/activate
python src/main.py
```

## 🛠️ Usage Guide

### REPL Commands

Once in the interactive mode (`brain`), you can use natural language:

**File Operations:**
```
> read package.json
> edit src/app.js
> list current directory
> search for "TODO" in src
```

**Git Operations:**
```
> git status
> show recent commits
> create branch feature/new-feature
> commit these changes
```

**Code Analysis:**
```
> analyze this project
> explain the codebase architecture
> find definition of UserService
> show project structure
```

**Development Tools:**
```
> run tests
> lint the code
> check types
> install dependencies
```

**System Commands:**
- `help` - Show comprehensive help
- `status` - Show Brain server and MCP server status
- `history` - View conversation history
- `sessions` - List available sessions
- `clear` - Clear terminal screen
- `exit` or `quit` - Exit REPL

### Legacy Commands (for compatibility)

```bash
# Server management
brain connect --url ws://localhost:3789
brain server connect -i <server_id> -c <config>
brain server list

# Tool discovery
brain tools -i <server_id>

# Direct queries
brain query "analyze this code"

# System status
brain status
```

## 🏗️ Architecture

### Core Components

**CLI Entry Point** (`bin/brain.js`):
- Intelligent argument parsing for Claude Code-style usage
- Auto-connection and session management
- Error handling and graceful shutdown

**REPL Interface** (`lib/repl.js`):
- Conversational development assistant experience
- Natural language command processing
- Real-time message handling and session tracking

**Brain Client** (`lib/brain-client.js`):
- WebSocket communication with Brain server
- Message routing and response formatting
- Connection management and error handling

**Command Parser** (`lib/command-parser.js`):
- Natural language pattern matching
- Development command categorization
- Intent detection and parameter extraction

**Session Manager** (`lib/session-manager.js`):
- Persistent conversation storage
- Session creation, resumption, and history tracking
- Local file-based session management

### WebSocket Protocol

The CLI communicates with the Brain server using structured messages:

**Commands:**
- `query` - Natural language development assistance
- `get_servers` - List connected MCP servers
- `list_tools` - Get tools from specific servers
- `connect_server` - Connect custom MCP servers

**Response Handling:**
- Real-time response streaming
- Progress indicators and status updates
- Error handling with user-friendly messages

## 🧩 Available Tools

Through the Brain server, the CLI provides access to:

### File System Operations
- Read, write, edit files
- List directories and search content
- Create directories and manage file structure

### Git Version Control
- Repository status and diff viewing
- Commit history and branch management
- Staging, committing, and git workflow automation

### Code Analysis
- Project structure analysis
- Symbol definition and reference finding
- Codebase architecture understanding

### Development Tools
- Test execution and automation
- Code linting and formatting
- Type checking and dependency management

### Web Search (via Exa)
- Real-time internet information access
- Intelligent content extraction
- Development-related research assistance

## 🔄 Session Management

### Session Storage

Sessions are stored locally in `~/.brain-cli/sessions/`:
```
~/.brain-cli/sessions/
├── 4a1a7575.json  # Session files with conversation history
├── b2c8d391.json
└── ...
```

### Session Commands

```bash
# Continue last session
brain -c

# Resume specific session
brain -r 4a1a7575

# List sessions in REPL
> sessions
```

### Session Content

Each session contains:
- Unique session ID
- Conversation history with timestamps
- User inputs and Brain responses
- Session metadata

## 🛠️ Development

### Local Development Setup

```bash
# Clone and setup
git clone <repository-url>
cd brain-surf-cli
npm install

# Development mode with auto-restart
npm run dev

# Testing
npm test

# Linting
npm run lint
```

### Project Structure

```
brain-surf-cli/
├── bin/
│   └── brain.js              # CLI entry point with shebang
├── lib/
│   ├── brain-client.js       # WebSocket client implementation
│   ├── repl.js               # Interactive REPL interface
│   ├── command-parser.js     # Natural language command parsing
│   ├── session-manager.js    # Session persistence and management
│   ├── interactive-mode.js   # Legacy interactive interface
│   └── utils.js              # Shared utilities and helpers
├── package.json              # Node.js package configuration
├── setup.sh                  # Automated setup script
└── README.md                # This file
```

### Dependencies

**Core Dependencies:**
- `commander` - CLI argument parsing and command structure
- `ws` - WebSocket client for Brain server communication
- `inquirer` - Interactive prompts and REPL interface
- `chalk` - Terminal colors and formatting

**UI/UX Dependencies:**
- `boxen` - Terminal boxes and borders
- `figlet` - ASCII art headers
- `gradient-string` - Gradient text effects
- `ora` / `nanospinner` - Loading indicators
- `cli-table3` - Formatted data tables

## 🔗 Integration

### Brain Server Integration

The CLI is designed to work seamlessly with the Brain server:

1. **Start Brain Server:**
   ```bash
   # In brain project directory
   python src/main.py
   ```

2. **Use CLI:**
   ```bash
   brain "analyze this project"
   ```

### WebSocket Communication

```javascript
// Example WebSocket message to Brain server
{
  "command": "query",
  "query": "What files are in the current directory?"
}
```

## 🐛 Troubleshooting

### Common Issues

**Connection Problems:**
```bash
# Check if Brain server is running
curl -I http://localhost:3789

# Verify WebSocket connection
brain status
```

**Global Command Not Found:**
```bash
# Re-link globally
npm link

# Check installation
which brain
```

**Session Issues:**
```bash
# Check session directory
ls ~/.brain-cli/sessions/

# Clear problematic sessions
rm ~/.brain-cli/sessions/*.json
```

### Debug Mode

Enable detailed logging by setting environment variable:
```bash
DEBUG=true brain "test query"
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make changes with appropriate tests
4. Run linting and formatting
5. Submit a pull request

### Code Style

- ES modules with Node.js 18+ features
- Clean, minimal terminal interfaces
- Comprehensive error handling
- User-friendly command patterns

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🚀 Getting Started

1. **Install Brain server** (see [Brain project](../brain/))
2. **Install CLI globally:** `npm link`
3. **Start Brain server:** `python src/main.py` (in brain directory)
4. **Use CLI:** `brain "help me with development"`

Welcome to the future of conversational development assistance!