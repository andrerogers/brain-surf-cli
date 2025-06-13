# Brain Surf CLI

A beautiful, interactive command-line interface for managing and querying your Brain server with real-time WebSocket communication.

## What You Get

### Core CLI Tool
- **Beautiful Terminal UI** with gradients, colors, and animations
- **Interactive Mode** - Full-screen experience with menus and real-time updates  
- **WebSocket Client** - Connects to your Brain server at `ws://localhost:3789`
- **Complete Command Coverage** - All Brain WebSocket commands supported

### Key Features
- **Gorgeous Interface** - Figlet headers, gradient text, boxed messages
- **Real-time Updates** - Live progress bars, spinners, status indicators
- **Server Management** - Connect/disconnect MCP servers with validation
- **Tool Discovery** - Beautiful tables showing available tools
- **LLM Queries** - Send queries with streaming support
- **System Status** - Monitor connected servers and health

## Quick Setup

### 1. Project Structure
Copy all the files into this directory structure:
```
brain-surf-cli/
├── bin/brain.js
├── lib/
│   ├── brain-client.js
│   ├── interactive-mode.js
│   └── utils.js
├── package.json
├── README.md
├── .env.example
└── setup.sh
```

### 2. Installation
Run the setup script:
```bash
chmod +x setup.sh
./setup.sh
```

Or install manually:
```bash
npm install
chmod +x bin/brain.js
cp .env.example .env
npm link  # Optional: for global access
```

### 4. Configuration
Update your `.env` file with the correct paths for your local Brain project.

## Usage Examples

### Interactive Mode (Recommended)
```bash
brain interactive
```

### Command Line Interface
```bash
# Connect and query
brain connect
brain query "What's the weather like?"

# Server management  
brain server connect --id math_server --config ./servers/math.py
brain server list
brain tools --id math_server

# System status
brain status
```

## Available Commands

| Command | Description |
|---------|-------------|
| `brain interactive` | Launch full interactive mode |
| `brain connect` | Connect to Brain server |
| `brain query <message>` | Send query to Brain |
| `brain server connect` | Connect MCP server |
| `brain server list` | List connected servers |
| `brain tools [--id <server_id>]` | Show available tools |
| `brain status` | Show system status |

## Development

### Prerequisites
- Node.js 18 or higher
- Brain server running on `ws://localhost:3789`

### Local Development
```bash
# Clone and setup
git clone <your-repo-url>
cd brain-surf-cli
npm install
```

**Ready to surf your brain?**

```bash
npm link
brain
```
