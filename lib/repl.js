import chalk from 'chalk';
import inquirer from 'inquirer';
import { CommandParser } from './command-parser.js';
import { SessionManager } from './session-manager.js';

export class BrainREPL {
  constructor(brainClient, options = {}) {
    this.client = brainClient;
    this.parser = new CommandParser();
    this.sessionManager = new SessionManager();
    this.isRunning = false;
    this.currentSessionId = null;
    this.continueSession = options.continueSession || false;
    this.sessionId = options.sessionId;
  }

  async start(url = 'ws://localhost:3789') {
    try {
      // Connect to Brain server quietly
      await this.client.connect(url);
      this.isRunning = true;
      
      this.client.on('message', (message) => {
        this.handleMessage(message);
      });

      // Handle session management
      if (this.continueSession || this.sessionId) {
        const sessionId = this.sessionId || this.sessionManager.getLastSession();
        if (sessionId) {
          this.currentSessionId = sessionId;
          const history = this.sessionManager.getHistory(sessionId);
          if (history.length > 0) {
            console.log(chalk.dim(`Continuing session ${sessionId.slice(0, 8)}... (${history.length} previous messages)`));
          }
        } else {
          console.log(chalk.yellow('No previous session found, starting new session'));
          this.currentSessionId = this.sessionManager.createSession();
        }
      } else {
        this.currentSessionId = this.sessionManager.createSession();
      }

      console.log(chalk.dim('Connected to Brain server'));
      console.log(''); // Empty line for spacing

      await this.mainLoop();
      
    } catch (error) {
      console.error(chalk.red('Failed to connect:'), error.message);
      process.exit(1);
    }
  }

  async mainLoop() {
    while (this.isRunning) {
      try {
        const { input } = await inquirer.prompt([
          {
            type: 'input',
            name: 'input',
            message: '>',
            validate: (input) => input.trim() !== '' || true // Allow empty input
          }
        ]);

        if (!input.trim()) {
          continue; // Skip empty input
        }

        await this.processInput(input.trim());
        
      } catch (error) {
        if (error.name === 'ExitPromptError') {
          // User pressed Ctrl+C
          await this.handleExit();
          break;
        } else {
          console.error(chalk.red('Error:'), error.message);
        }
      }
    }
  }

  async processInput(input) {
    // Add to session history
    this.sessionManager.addToHistory(this.currentSessionId, {
      type: 'user',
      content: input
    });

    // Handle special commands
    if (input.toLowerCase() === 'exit' || input.toLowerCase() === 'quit') {
      await this.handleExit();
      return;
    }

    if (input.toLowerCase() === 'help') {
      this.showHelp();
      return;
    }

    if (input.toLowerCase() === 'status') {
      await this.client.showStatus();
      return;
    }

    if (input.toLowerCase() === 'clear') {
      console.clear();
      return;
    }

    if (input.toLowerCase() === 'history') {
      this.showHistory();
      return;
    }

    if (input.toLowerCase().startsWith('sessions')) {
      this.showSessions();
      return;
    }

    // Parse natural language command
    const command = this.parser.parse(input);
    
    switch (command.type) {
      // File operations
      case 'read_file':
        await this.handleFileOperation('read_file', { path: command.filePath });
        break;
      case 'write_file':
        await this.handleFileOperation('write_file', { path: command.filePath });
        break;
      case 'edit_file':
        await this.handleFileOperation('edit_file', { path: command.filePath });
        break;
      case 'list_directory':
        await this.handleFileOperation('list_directory', { path: command.path });
        break;
      case 'search_files':
        await this.handleFileOperation('search_files', { pattern: command.pattern, directory: command.directory });
        break;
      case 'create_directory':
        await this.handleFileOperation('create_directory', { path: command.path });
        break;
        
      // Git operations
      case 'git_status':
        await this.handleGitOperation('git_status');
        break;
      case 'git_diff':
        await this.handleGitOperation('git_diff', { file_path: command.filePath });
        break;
      case 'git_log':
        await this.handleGitOperation('git_log', { limit: command.limit });
        break;
      case 'git_add':
        await this.handleGitOperation('git_add', { file_paths: command.files });
        break;
      case 'git_commit':
        await this.handleGitOperation('git_commit', { message: command.message });
        break;
      case 'git_branch_info':
        await this.handleGitOperation('git_branch_info');
        break;
        
      // Codebase analysis
      case 'analyze_project':
        await this.handleCodebaseOperation('analyze_project');
        break;
      case 'explain_codebase':
        await this.handleCodebaseOperation('explain_codebase');
        break;
      case 'get_project_structure':
        await this.handleCodebaseOperation('get_project_structure');
        break;
      case 'find_definition':
        await this.handleCodebaseOperation('find_definition', { symbol: command.symbol, file_path: command.filePath });
        break;
      case 'find_references':
        await this.handleCodebaseOperation('find_references', { symbol: command.symbol, file_path: command.filePath });
        break;
        
      // Server operations
      case 'connect_server':
        await this.handleConnectServer(command.serverId, command.config);
        break;
      case 'list_servers':
        await this.client.listServers();
        break;
      case 'list_tools':
        await this.handleListTools(command.serverId);
        break;
        
      // Queries
      case 'query':
        await this.handleQuery(command.query);
        break;
      case 'unknown':
        // Check if it looks like a development command that we should route to Brain
        if (this.parser.isDevelopmentCommand(input)) {
          await this.handleDevelopmentQuery(input);
        } else {
          // Treat as general query to the Brain
          await this.handleQuery(input);
        }
        break;
      default:
        await this.handleQuery(input);
    }
  }

  async handleQuery(query) {
    this.sessionManager.addToHistory(this.currentSessionId, {
      type: 'query',
      content: query
    });
    await this.client.sendQuery(query);
  }

  async handleConnectServer(serverId, config) {
    try {
      await this.client.connectServer(serverId, config);
      console.log(chalk.green(`Connected to server: ${serverId}`));
    } catch (error) {
      console.error(chalk.red('Failed to connect server:'), error.message);
    }
  }

  async handleListTools(serverId) {
    if (!serverId) {
      console.log(chalk.yellow('Please specify a server ID. Example: "list tools from exa"'));
      return;
    }
    try {
      await this.client.listTools(serverId);
    } catch (error) {
      console.error(chalk.red('Failed to list tools:'), error.message);
    }
  }

  showHelp() {
    console.log('Brain CLI - Available Commands:');
    console.log('');
    console.log('File Operations:');
    console.log('  "read file.txt"               - Read a file');
    console.log('  "edit src/app.js"             - Edit a file');
    console.log('  "list ." or "ls"              - List directory contents');
    console.log('  "search for function in src" - Search files for text');
    console.log('  "create directory new_dir"   - Create a directory');
    console.log('');
    console.log('Git Operations:');
    console.log('  "git status" or "status"      - Show git status');
    console.log('  "git diff" or "diff"          - Show changes');
    console.log('  "git log" or "history"        - Show commit history');
    console.log('  "add file.txt"               - Stage files');
    console.log('  "commit \"message\""           - Create commit');
    console.log('  "branches"                   - Show branch info');
    console.log('');
    console.log('Codebase Analysis:');
    console.log('  "analyze project"            - Analyze project structure');
    console.log('  "explain codebase"           - Explain architecture');
    console.log('  "show structure"             - Show project structure');
    console.log('  "find definition MyClass"    - Find symbol definition');
    console.log('  "find references myFunction" - Find symbol references');
    console.log('');
    console.log('Server Management:');
    console.log('  "connect server exa with /path"  - Connect MCP server');
    console.log('  "list servers"               - Show connected servers');
    console.log('  "tools from server_name"     - Show server tools');
    console.log('');
    console.log('General Queries:');
    console.log('  "what is artificial intelligence?" - Ask Brain questions');
    console.log('  "explain this error message"      - Get help with problems');
    console.log('');
    console.log('System Commands:');
    console.log('  help     - Show this help message');
    console.log('  status   - Show system status');
    console.log('  history  - Show conversation history');
    console.log('  sessions - List recent sessions');
    console.log('  clear    - Clear the screen');
    console.log('  exit     - Exit the REPL');
    console.log('');
  }

  async handleExit() {
    if (this.currentSessionId) {
      const history = this.sessionManager.getHistory(this.currentSessionId);
      if (history.length > 0) {
        console.log(chalk.dim(`Session ${this.currentSessionId.slice(0, 8)} saved (${history.length} messages)`));
      }
    }
    console.log('Goodbye!');
    this.client.disconnect();
    this.isRunning = false;
    process.exit(0);
  }

  handleMessage(message) {
    // Add response to session history
    if (message.type === 'query_response') {
      this.sessionManager.addToHistory(this.currentSessionId, {
        type: 'response',
        content: message.response
      });
    }
  }

  async handleFileOperation(operation, params) {
    try {
      const query = `Use the filesystem server to perform: ${operation} with parameters: ${JSON.stringify(params)}`;
      await this.client.sendQuery(query);
    } catch (error) {
      console.error(chalk.red('File operation failed:'), error.message);
    }
  }

  async handleGitOperation(operation, params = {}) {
    try {
      const query = `Use the git server to perform: ${operation} with parameters: ${JSON.stringify(params)}`;
      await this.client.sendQuery(query);
    } catch (error) {
      console.error(chalk.red('Git operation failed:'), error.message);
    }
  }

  async handleCodebaseOperation(operation, params = {}) {
    try {
      const query = `Use the codebase server to perform: ${operation} with parameters: ${JSON.stringify(params)}`;
      await this.client.sendQuery(query);
    } catch (error) {
      console.error(chalk.red('Codebase operation failed:'), error.message);
    }
  }

  async handleDevelopmentQuery(input) {
    // Route development-related queries with context
    const query = `As a development assistant, help with: ${input}`;
    await this.client.sendQuery(query);
  }

  showHistory() {
    const history = this.sessionManager.getHistory(this.currentSessionId);
    if (history.length === 0) {
      console.log('No conversation history in this session');
      return;
    }

    console.log('\nConversation History:');
    console.log('='.repeat(50));
    
    history.forEach((entry, index) => {
      const time = new Date(entry.timestamp).toLocaleTimeString();
      
      if (entry.type === 'user' || entry.type === 'query') {
        console.log(`\n${chalk.dim(time)} ${chalk.blue('You:')}`);
        console.log(entry.content);
      } else if (entry.type === 'response') {
        console.log(`\n${chalk.dim(time)} ${chalk.green('Brain:')}`);
        console.log(entry.content);
      }
    });
    
    console.log('\n' + '='.repeat(50));
  }

  showSessions() {
    const sessions = this.sessionManager.listSessions();
    if (sessions.length === 0) {
      console.log('No previous sessions found');
      return;
    }

    console.log('\nRecent Sessions:');
    console.log('='.repeat(50));
    
    sessions.forEach((session, index) => {
      const isActive = session.id === this.currentSessionId;
      const created = new Date(session.created).toLocaleString();
      const activeMarker = isActive ? chalk.green(' (active)') : '';
      
      console.log(`${chalk.cyan(session.id.slice(0, 8))}: ${created} (${session.historyCount} messages)${activeMarker}`);
    });
    
    console.log('\n' + '='.repeat(50));
    console.log(chalk.dim('To continue a session: brain -r <session_id>'));
  }
}