#!/usr/bin/env node

import chalk from 'chalk';
import figlet from 'figlet';
import gradient from 'gradient-string';
import { Command } from 'commander';


import { BrainClient } from '../lib/brain-client.js';
import { InteractiveMode } from '../lib/interactive-mode.js';

import { showWelcome, handleError } from '../lib/utils.js';

const program = new Command();
const brainClient = new BrainClient();

console.log(
  gradient.retro.multiline(
    figlet.textSync('Brain Surf CLI', {
      font: 'ANSI Shadow',
      horizontalLayout: 'default',
      verticalLayout: 'default'
    })
  )
);

program
  .name('brain')
  .description('CLI for the Brain')
  .version('1.0.0', '-v, --version', 'display version number');

program
  .command('connect')
  .description('Connect to Brain WebSocket server')
  .option('-u, --url <url>', 'WebSocket server URL', 'ws://localhost:3789')
  .option('-t, --timeout <ms>', 'Connection timeout in milliseconds', '5000')
  .action(async (options) => {
    try {
      await brainClient.connect(options.url, parseInt(options.timeout));
      console.log(chalk.green('✅ Successfully connected to Brain server!'));
    } catch (error) {
      handleError('Connection failed', error);
    }
  });

program
  .command('interactive')
  .alias('i')
  .description('Start interactive mode with beautiful UI')
  .option('-u, --url <url>', 'WebSocket server URL', 'ws://localhost:3789')
  .action(async (options) => {
    try {
      const interactive = new InteractiveMode(brainClient);
      await interactive.start(options.url);
    } catch (error) {
      handleError('Interactive mode failed', error);
    }
  });

program
  .command('server')
  .description('Manage MCP servers')
  .addCommand(
    new Command('connect')
      .description('Connect to an MCP server')
      .requiredOption('-i, --id <id>', 'Server ID')
      .requiredOption('-c, --config <config>', 'Server config (path or URL)')
      .action(async (options) => {
        try {
          await brainClient.connectServer(options.id, options.config);
          console.log(chalk.green(`✅ Connected to server: ${options.id}`));
        } catch (error) {
          handleError('Server connection failed', error);
        }
      })
  )
  .addCommand(
    new Command('list')
      .description('List all connected servers')
      .action(async () => {
        try {
          await brainClient.listServers();
        } catch (error) {
          handleError('Failed to list servers', error);
        }
      })
  );

program
  .command('tools')
  .description('List tools from a specific server')
  .requiredOption('-i, --id <id>', 'Server ID')
  .action(async (options) => {
    try {
      await brainClient.listTools(options.id);
    } catch (error) {
      handleError('Failed to list tools', error);
    }
  });

program
  .command('query')
  .description('Send a query to the Brain LLM')
  .argument('<query>', 'Query to send')
  .option('-s, --stream', 'Stream response in real-time')
  .action(async (query, options) => {
    try {
      await brainClient.sendQuery(query, { stream: options.stream });
    } catch (error) {
      handleError('Query failed', error);
    }
  });

program
  .command('status')
  .description('Show Brain system status')
  .action(async () => {
    try {
      await brainClient.showStatus();
    } catch (error) {
      handleError('Failed to get status', error);
    }
  });

if (!process.argv.slice(2).length) {
  showWelcome();
  process.exit(0);
}

program.parse();

process.on('uncaughtException', (error) => {
  console.error(chalk.red('\n💥 Uncaught Exception:'), error.message);
  brainClient.disconnect();
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error(chalk.red('\n💥 Unhandled Rejection at:'), promise, 'reason:', reason);
  brainClient.disconnect();
  process.exit(1);
});
