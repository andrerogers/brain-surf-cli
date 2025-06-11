import chalk from 'chalk';
import boxen from 'boxen';
import figlet from 'figlet';
import inquirer from 'inquirer';
import gradient from 'gradient-string';

import { createSpinner } from 'nanospinner';

export class InteractiveMode {
  constructor(brainClient) {
    this.client = brainClient;
    this.isRunning = false;
    this.connectedServers = [];
  }

  async start(url = 'ws://localhost:3789') {
    console.clear();
    
    console.log(
      gradient.rainbow.multiline(
        figlet.textSync('Interactive Mode', {
          font: 'Small',
          horizontalLayout: 'default'
        })
      )
    );

    try {
      await this.client.connect(url);
      this.isRunning = true;
      
      this.client.on('message', (message) => {
        this.handleMessage(message);
      });

      await this.mainLoop();
      
    } catch (error) {
      console.error(chalk.red('Failed to start interactive mode:'), error.message);
      process.exit(1);
    }
  }

  async mainLoop() {
    while (this.isRunning) {
      try {
        const action = await this.showMainMenu();
        await this.handleAction(action);
      } catch (error) {
        console.error(chalk.red('Error:'), error.message);
        await this.pressAnyKey();
      }
    }
  }

  async showMainMenu() {
    console.log('\n' + boxen(
      chalk.blue('🧠 Brain Interactive Mode\n\n') +
      chalk.gray('Choose an action to interact with the Brain system'),
      {
        padding: 1,
        borderColor: 'blue',
        borderStyle: 'round'
      }
    ));

    const { action } = await inquirer.prompt([
      {
        type: 'list',
        name: 'action',
        message: 'What would you like to do?',
        choices: [
          { name: '🤖 Send Query to Brain', value: 'query' },
          { name: '🖥️  Manage MCP Servers', value: 'servers' },
          { name: '🛠️  View Tools', value: 'tools' },
          { name: '📊 System Status', value: 'status' },
          { name: '🔧 Settings', value: 'settings' },
          { name: '❌ Exit', value: 'exit' }
        ],
        pageSize: 10
      }
    ]);

    return action;
  }

  async handleAction(action) {
    switch (action) {
      case 'query':
        await this.handleQueryMode();
        break;
      case 'servers':
        await this.handleServerManagement();
        break;
      case 'tools':
        await this.handleToolsView();
        break;
      case 'status':
        await this.handleSystemStatus();
        break;
      case 'settings':
        await this.handleSettings();
        break;
      case 'exit':
        await this.handleExit();
        break;
    }
  }

  async handleQueryMode() {
    console.log('\n' + chalk.blue('🤖 Query Mode'));
    console.log(chalk.gray('Enter your questions for the Brain. Type "back" to return to main menu.\n'));

    while (true) {
      const { query } = await inquirer.prompt([
        {
          type: 'input',
          name: 'query',
          message: chalk.blue('Brain >'),
          validate: (input) => input.trim() !== '' || 'Please enter a query'
        }
      ]);

      if (query.toLowerCase() === 'back') {
        break;
      }

      await this.client.sendQuery(query);
      console.log(''); // Add spacing
    }
  }

  async handleServerManagement() {
    const { serverAction } = await inquirer.prompt([
      {
        type: 'list',
        name: 'serverAction',
        message: 'Server Management',
        choices: [
          { name: '📋 List Connected Servers', value: 'list' },
          { name: '🔗 Connect New Server', value: 'connect' },
          { name: '🔌 Disconnect Server', value: 'disconnect' },
          { name: '🔙 Back to Main Menu', value: 'back' }
        ]
      }
    ]);

    switch (serverAction) {
      case 'list':
        await this.client.listServers();
        await this.pressAnyKey();
        break;
      case 'connect':
        await this.handleConnectServer();
        break;
      case 'disconnect':
        await this.handleDisconnectServer();
        break;
      case 'back':
        break;
    }
  }

  async handleConnectServer() {
    console.log('\n' + chalk.blue('🔗 Connect New MCP Server\n'));

    const { serverId } = await inquirer.prompt([
      {
        type: 'input',
        name: 'serverId',
        message: 'Enter server ID:',
        validate: (input) => input.trim() !== '' || 'Server ID is required'
      }
    ]);

    const { configType } = await inquirer.prompt([
      {
        type: 'list',
        name: 'configType',
        message: 'Server configuration type:',
        choices: [
          { name: '📁 Local Script Path', value: 'local' },
          { name: '🌐 Remote HTTP URL', value: 'remote' },
          { name: '⚙️  Custom Configuration', value: 'custom' }
        ]
      }
    ]);

    let serverConfig;

    if (configType === 'local') {
      const { path } = await inquirer.prompt([
        {
          type: 'input',
          name: 'path',
          message: 'Enter path to local script:',
          validate: (input) => input.trim() !== '' || 'Path is required'
        }
      ]);
      serverConfig = path;
    } else if (configType === 'remote') {
      const { url } = await inquirer.prompt([
        {
          type: 'input',
          name: 'url',
          message: 'Enter remote server URL:',
          validate: (input) => {
            if (!input.trim()) return 'URL is required';
            if (!input.startsWith('http://') && !input.startsWith('https://')) {
              return 'URL must start with http:// or https://';
            }
            return true;
          }
        }
      ]);
      serverConfig = url;
    } else {
      // Custom configuration
      const { command, args, transport } = await inquirer.prompt([
        {
          type: 'input',
          name: 'command',
          message: 'Enter command:',
          validate: (input) => input.trim() !== '' || 'Command is required'
        },
        {
          type: 'input',
          name: 'args',
          message: 'Enter arguments (comma-separated, optional):'
        },
        {
          type: 'list',
          name: 'transport',
          message: 'Select transport:',
          choices: ['stdio', 'sse'],
          default: 'stdio'
        }
      ]);

      serverConfig = {
        command,
        args: args ? args.split(',').map(arg => arg.trim()) : [],
        transport
      };
    }

    try {
      await this.client.connectServer(serverId, serverConfig);
      await this.pressAnyKey();
    } catch (error) {
      console.error(chalk.red('Failed to connect server:'), error.message);
      await this.pressAnyKey();
    }
  }
  async handleDisconnectServer() {
    // First get the list of connected servers
    const spinner = createSpinner('Fetching connected servers...').start();
    
    // TODO: We need to implement a way to get current servers synchronously
    // For now, let the user type the server ID
    spinner.stop();
    
    const { serverId } = await inquirer.prompt([
      {
        type: 'input',
        name: 'serverId',
        message: 'Enter server ID to disconnect:',
        validate: (input) => input.trim() !== '' || 'Server ID is required'
      }
    ]);

    try {
      await this.client.disconnectServer(serverId);
      console.log(chalk.green(`✅ Server ${serverId} disconnected`));
      await this.pressAnyKey();
    } catch (error) {
      console.error(chalk.red('Failed to disconnect server:'), error.message);
      await this.pressAnyKey();
    }
  }

  async handleToolsView() {
    const { serverId } = await inquirer.prompt([
      {
        type: 'input',
        name: 'serverId',
        message: 'Enter server ID to view tools:',
        validate: (input) => input.trim() !== '' || 'Server ID is required'
      }
    ]);

    try {
      await this.client.listTools(serverId);
      await this.pressAnyKey();
    } catch (error) {
      console.error(chalk.red('Failed to get tools:'), error.message);
      await this.pressAnyKey();
    }
  }

  async handleSystemStatus() {
    await this.client.showStatus();
    await this.pressAnyKey();
  }

  async handleSettings() {
    const { setting } = await inquirer.prompt([
      {
        type: 'list',
        name: 'setting',
        message: 'Settings',
        choices: [
          { name: '🎨 Color Theme', value: 'theme' },
          { name: '⚡ Performance', value: 'performance' },
          { name: '🔔 Notifications', value: 'notifications' },
          { name: '🔙 Back to Main Menu', value: 'back' }
        ]
      }
    ]);

    if (setting !== 'back') {
      console.log(chalk.yellow('Settings coming soon!'));
      await this.pressAnyKey();
    }
  }

  async handleExit() {
    console.log('\n' + boxen(
      chalk.yellow('👋 Goodbye!\n\n') +
      chalk.gray('Thanks for using Brain CLI'),
      {
        padding: 1,
        borderColor: 'yellow',
        borderStyle: 'round'
      }
    ));

    this.client.disconnect();
    this.isRunning = false;
    process.exit(0);
  }

  handleMessage(message) {
    // Handle real-time messages from the Brain server
    // This method is called when the client receives messages
    // Most handling is done in the BrainClient class
  }

  async pressAnyKey() {
    await inquirer.prompt([
      {
        type: 'input',
        name: 'continue',
        message: chalk.gray('Press Enter to continue...'),
      }
    ]);
  }
}
