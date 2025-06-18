#!/usr/bin/env node

import chalk from 'chalk';
import { Command } from 'commander';

import { BrainClient } from '../lib/brain-client.js';
import { BrainREPL } from '../lib/repl.js';
import { handleError } from '../lib/utils.js';

const program = new Command();
const brainClient = new BrainClient();

program
  .name('brain')
  .description('CLI for interacting with Brain multi-agent system')
  .version('1.0.0', '-v, --version', 'display version number')
  .option('-p, --print', 'Print mode: execute query and exit')
  .option('-c, --continue', 'Continue last conversation')
  .option('-r, --resume <sessionId>', 'Resume specific session')
  .argument('[query...]', 'Query to send to Brain');

// Legacy connect command (kept for compatibility)
program
  .command('connect')
  .description('Connect to Brain WebSocket server')
  .option('-u, --url <url>', 'WebSocket server URL', 'ws://localhost:3789')
  .option('-t, --timeout <ms>', 'Connection timeout in milliseconds', '5000')
  .action(async (options) => {
    try {
      await brainClient.connect(options.url, parseInt(options.timeout));
      console.log(chalk.green('Connected to Brain server'));
    } catch (error) {
      handleError('Connection failed', error);
    }
  });

// Legacy interactive command (kept for compatibility)
program
  .command('interactive')
  .alias('i')
  .description('Start interactive REPL mode')
  .option('-u, --url <url>', 'WebSocket server URL', 'ws://localhost:3789')
  .action(async (options) => {
    try {
      const repl = new BrainREPL(brainClient);
      await repl.start(options.url);
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
          console.log(chalk.green(`Connected to server: ${options.id}`));
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

// Handle Claude Code-style usage
async function main() {
  const args = process.argv.slice(2);
  
  // If no arguments, start REPL
  if (args.length === 0) {
    const repl = new BrainREPL(brainClient);
    await repl.start();
    return;
  }
  
  // Parse arguments first to check for flags
  program.parse();
  const options = program.opts();
  const query = program.args.join(' ');
  
  // Handle print mode: brain "query" or brain -p "query"
  if (options.print || (query && !process.argv.some(arg => arg.startsWith('-')))) {
    try {
      await brainClient.connect();
      console.log(chalk.blue('Query:'), query);
      await brainClient.sendQuery(query);
      
      // Wait for response and exit
      brainClient.once('message', (message) => {
        if (message.type === 'query_response') {
          process.exit(0);
        }
      });
      
      // Timeout after 30 seconds
      setTimeout(() => {
        console.error(chalk.red('Query timeout'));
        process.exit(1);
      }, 30000);
      
    } catch (error) {
      handleError('Query failed', error);
      process.exit(1);
    }
    return;
  }
  
  // Handle continue mode
  if (options.continue) {
    const repl = new BrainREPL(brainClient, { continueSession: true });
    await repl.start();
    return;
  }
  
  // Handle resume mode
  if (options.resume) {
    const repl = new BrainREPL(brainClient, { sessionId: options.resume });
    await repl.start();
    return;
  }
}

// Only run main if not using legacy commands
if (!process.argv.some(arg => ['connect', 'interactive', 'server', 'tools', 'query', 'status'].includes(arg))) {
  main().catch(error => {
    console.error(chalk.red('Error:'), error.message);
    process.exit(1);
  });
} else {
  program.parse();
}

process.on('uncaughtException', (error) => {
  console.error(chalk.red('Uncaught Exception:'), error.message);
  brainClient.disconnect();
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error(chalk.red('Unhandled Rejection:'), reason);
  brainClient.disconnect();
  process.exit(1);
});

// Handle Ctrl+C gracefully
process.on('SIGINT', () => {
  console.log('\nGoodbye!');
  brainClient.disconnect();
  process.exit(0);
});
