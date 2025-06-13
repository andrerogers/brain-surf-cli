import chalk from 'chalk';
import Table from 'cli-table3';
import boxen from 'boxen';

import WebSocket from 'ws';
import EventEmitter from 'events';

import { createSpinner } from 'nanospinner';

export class BrainClient extends EventEmitter {
  constructor() {
    super();
    this.ws = null;
    this.connected = false;
    this.pendingRequests = new Map();
    this.requestId = 0;
  }

  async connect(url = 'ws://localhost:3789', timeout = 5000) {
    const spinner = createSpinner('Connecting to Brain server...').start();
    
    return new Promise((resolve, reject) => {
      const timeoutId = setTimeout(() => {
        spinner.error({ text: 'Connection timeout' });
        reject(new Error('Connection timeout'));
      }, timeout);

      this.ws = new WebSocket(url);

      this.ws.on('open', () => {
        clearTimeout(timeoutId);
        this.connected = true;
        spinner.success({ text: `Connected to ${url}` });
        
        // Show connection info box
        console.log(boxen(
          chalk.green('🚀 Brain CLI Connected!\n\n') +
          chalk.blue('Available commands:\n') +
          chalk.gray('• brain interactive - Start interactive mode\n') +
          chalk.gray('• brain server list - List connected servers\n') +
          chalk.gray('• brain query "your question" - Ask the Brain\n') +
          chalk.gray('• brain status - Show system status'),
          {
            padding: 1,
            margin: 1,
            borderStyle: 'round',
            borderColor: 'green'
          }
        ));
        
        resolve();
      });

      this.ws.on('message', (data) => {
        try {
          const message = JSON.parse(data.toString());
          this.handleMessage(message);
        } catch (error) {
          console.error(chalk.red('Failed to parse message:'), error);
        }
      });

      this.ws.on('error', (error) => {
        clearTimeout(timeoutId);
        spinner.error({ text: 'Connection failed' });
        this.connected = false;
        reject(error);
      });

      this.ws.on('close', () => {
        this.connected = false;
        console.log(chalk.yellow('Connection closed ⚠️'));
      });
    });
  }

  handleMessage(message) {
    const { type, ...data } = message;

    switch (type) {
      case 'server_connected':
        this.handleServerConnected(data);
        break;
      case 'server_disconnected':
        this.handleServerDisconnected(data);
        break;
      case 'tools_list':
        this.handleToolsList(data);
        break;
      case 'servers_list':
        this.handleServersList(data);
        break;
      case 'query_response':
        this.handleQueryResponse(data);
        break;
      case 'thinking':
        this.handleThinking(data);
        break;
      case 'status':
        this.handleStatus(data);
        break;
      case 'error':
        this.handleError(data);
        break;
      default:
        console.log(chalk.gray('Unknown message type:'), type);
    }

    this.emit('message', message);
  }

  async sendCommand(command, params = {}) {
    if (!this.connected) {
      throw new Error('Not connected to Brain server');
    }

    const message = {
      command,
      ...params
    };

    this.ws.send(JSON.stringify(message));
  }

  async connectServer(serverId, serverConfig) {
    const spinner = createSpinner(`Connecting to server: ${serverId}...`).start();
    
    try {
      await this.sendCommand('connect_server', {
        server_id: serverId,
        server_config: serverConfig
      });
      spinner.success({ text: `Server ${serverId} connected successfully` });
    } catch (error) {
      spinner.error({ text: `Failed to connect server: ${serverId}` });
      throw error;
    }
  }

  async disconnectServer(serverId) {
    await this.sendCommand('disconnect_server', { server_id: serverId });
  }

  async listServers() {
    const spinner = createSpinner('Fetching connected servers...').start();
    await this.sendCommand('get_servers');
    spinner.stop();
  }

  async listTools(serverId) {
    const spinner = createSpinner(`Fetching tools from ${serverId}...`).start();
    await this.sendCommand('list_tools', { server_id: serverId });
    spinner.stop();
  }

  async sendQuery(query, options = {}) {
    console.log(boxen(
      chalk.blue('🧠 Query: ') + chalk.white(query),
      { padding: 1, borderColor: 'blue', borderStyle: 'round' }
    ));

    await this.sendCommand('query', { query });
  }

  async showStatus() {
    const spinner = createSpinner('Getting system status...').start();
    
    if (this.connected) {
      await this.sendCommand('get_servers');
      spinner.success({ text: 'System status retrieved' });
    } else {
      spinner.error({ text: 'Not connected to Brain server' });
    }
  }

  handleServerConnected(data) {
    const { server } = data;
    console.log(boxen(
      chalk.green('✅ Server Connected\n\n') +
      chalk.blue('ID: ') + chalk.white(server.id) + '\n' +
      chalk.blue('Status: ') + chalk.green(server.status) + '\n' +
      chalk.blue('Tools: ') + chalk.cyan(server.tools_count),
      { padding: 1, borderColor: 'green', borderStyle: 'round' }
    ));
  }

  handleServerDisconnected(data) {
    console.log(chalk.yellow(`🔌 Server disconnected: ${data.server_id}`));
  }

  handleToolsList(data) {
    const { server_id, tools } = data;
    
    console.log(chalk.blue(`\n🛠️  Tools available on server: ${chalk.cyan(server_id)}\n`));
    
    if (tools.length === 0) {
      console.log(chalk.gray('No tools available'));
      return;
    }

    const table = new Table({
      head: [chalk.blue('Tool Name'), chalk.blue('Description')],
      colWidths: [25, 60],
      style: {
        head: [],
        border: ['cyan']
      }
    });

    tools.forEach(tool => {
      table.push([
        chalk.green(tool.name),
        chalk.white(tool.description || 'No description')
      ]);
    });

    console.log(table.toString());
  }

  handleServersList(data) {
    const { servers } = data;
    
    console.log(chalk.blue('\n🖥️  Connected MCP Servers\n'));
    
    if (servers.length === 0) {
      console.log(chalk.gray('No servers connected'));
      return;
    }

    const table = new Table({
      head: [chalk.blue('Server ID'), chalk.blue('Status'), chalk.blue('Tools Count')],
      style: {
        head: [],
        border: ['cyan']
      }
    });

    const serverList = Object.values(servers);

    serverList.forEach(server => {
      table.push([
        chalk.green(server.id),
        server.status === 'connected' ? chalk.green('●') + ' Connected' : chalk.red('●') + ' Disconnected',
        chalk.cyan(server.tools_count.toString())
      ]);
    });

    console.log(table.toString());
  }

  handleQueryResponse(data) {
    const { query, response } = data;
    
    console.log(boxen(
      chalk.green('🤖 Brain Response:\n\n') + chalk.white(response),
      {
        padding: 1,
        margin: 1,
        borderColor: 'green',
        borderStyle: 'round'
      }
    ));
  }

  handleThinking(data) {
    console.log(chalk.yellow('🤔 ') + chalk.gray(data.message));
  }

  handleStatus(data) {
    console.log(chalk.blue('📊 Status:'), data);
  }

  handleError(data) {
    console.error(boxen(
      chalk.red('❌ Error\n\n') + chalk.white(data.error),
      {
        padding: 1,
        borderColor: 'red',
        borderStyle: 'round'
      }
    ));
  }

  /**
   * Close connection
   */
  disconnect() {
    if (this.ws) {
      this.ws.close();
      this.connected = false;
    }
  }
}
