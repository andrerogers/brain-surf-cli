import chalk from 'chalk';
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
    console.log(chalk.green('Server connected:'), server.id);
    console.log(chalk.dim(`Status: ${server.status}, Tools: ${server.tools_count}`));
  }

  handleServerDisconnected(data) {
    console.log(chalk.yellow(`Server disconnected: ${data.server_id}`));
  }

  handleToolsList(data) {
    const { server_id, tools } = data;
    
    console.log(`\nTools available on server ${chalk.cyan(server_id)}:\n`);
    
    if (tools.length === 0) {
      console.log('No tools available');
      return;
    }

    tools.forEach(tool => {
      console.log(`  ${chalk.green('•')} ${chalk.bold(tool.name)}`);
      if (tool.description && tool.description !== 'No description') {
        console.log(`    ${chalk.dim(tool.description)}`);
      }
    });
    console.log('');
  }

  handleServersList(data) {
    const { servers } = data;
    
    console.log('\nConnected MCP Servers:\n');
    
    if (servers.length === 0) {
      console.log('No servers connected');
      return;
    }

    const serverList = Object.values(servers);

    serverList.forEach(server => {
      const status = server.status === 'connected' ? chalk.green('✓') : chalk.red('✗');
      console.log(`  ${status} ${chalk.cyan(server.id)} - ${server.tools_count} tools`);
    });
    console.log('');
  }

  handleQueryResponse(data) {
    const { query, response } = data;
    
    console.log('\n' + response);
    console.log('');
  }

  handleThinking(data) {
    console.log(chalk.dim('Thinking...'));
  }

  handleStatus(data) {
    // Format status output similar to Claude Code
    console.log('\nBrain System Status:\n');
    
    if (data.servers) {
      const serverList = Object.values(data.servers);
      if (serverList.length > 0) {
        console.log('Connected MCP Servers:');
        serverList.forEach(server => {
          const status = server.status === 'connected' ? chalk.green('✓') : chalk.red('✗');
          console.log(`  ${status} ${chalk.cyan(server.id)} - ${server.tools_count} tools`);
        });
      } else {
        console.log('No MCP servers connected');
      }
    }
    
    console.log('');
  }

  handleError(data) {
    console.error(chalk.red('Error:'), data.error);
  }

  disconnect() {
    if (this.ws) {
      this.ws.close();
      this.connected = false;
    }
  }
}
