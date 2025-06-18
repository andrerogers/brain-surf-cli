import chalk from 'chalk';

export function showWelcome() {
  console.log(chalk.bold('Brain CLI') + chalk.dim(' - Claude Code-style development assistant'));
  console.log('\nQuick Start:');
  console.log('  brain                       Start interactive mode');
  console.log('  brain "explain this error"  Ask Brain directly');
  console.log('  brain -p "git status"       Print mode (ask and exit)');
  console.log('  brain -c                    Continue last conversation\n');
  
  console.log('Example Development Commands:');
  console.log(chalk.dim('  "read package.json"'));
  console.log(chalk.dim('  "show git status"'));
  console.log(chalk.dim('  "run tests"'));
  console.log(chalk.dim('  "fix the bug in src/app.js"'));
  console.log(chalk.dim('  "analyze this project"'));
  console.log(chalk.dim('  "what does this function do?"\n'));
  
  console.log(chalk.green('✓') + ' File operations (read, write, edit, search)');
  console.log(chalk.green('✓') + ' Git operations (status, diff, commit, log)');
  console.log(chalk.green('✓') + ' Code analysis (find definitions, references)');
  console.log(chalk.green('✓') + ' Development tools (tests, linting, formatting)');
  console.log(chalk.green('✓') + ' Project understanding and assistance\n');
  
  console.log(chalk.dim('Type "brain" to start or "brain --help" for full command list'));
}

export function handleError(context, error) {
  console.error(chalk.red('Error:'), context);
  console.error(chalk.red(error.message || error));
}

export function formatServerConfig(config) {
  if (typeof config === 'string') {
    if (config.startsWith('http://') || config.startsWith('https://')) {
      return chalk.blue('Remote: ') + chalk.cyan(config);
    } else {
      return chalk.green('Local: ') + chalk.cyan(config);
    }
  } else if (typeof config === 'object') {
    return chalk.yellow('⚙️  Custom: ') + chalk.cyan(JSON.stringify(config, null, 2));
  }
  return chalk.gray('Unknown configuration');
}

export function createLoadingSpinner(text) {
  const frames = ['⠋', '⠙', '⠹', '⠸', '⠼', '⠴', '⠦', '⠧', '⠇', '⠏'];
  let i = 0;
  
  return setInterval(() => {
    process.stdout.write(`\r${chalk.cyan(frames[i])} ${text}`);
    i = (i + 1) % frames.length;
  }, 100);
}

export function stopLoadingSpinner(spinner) {
  clearInterval(spinner);
  process.stdout.write('\r\x1b[K'); // Clear current line
}

export function formatTimestamp(date = new Date()) {
  return chalk.gray(`[${date.toLocaleTimeString()}]`);
}

export function validateWebSocketUrl(url) {
  try {
    const parsed = new URL(url);
    return parsed.protocol === 'ws:' || parsed.protocol === 'wss:';
  } catch {
    return false;
  }
}

export function createStatusBadge(status) {
  switch (status.toLowerCase()) {
    case 'connected':
      return chalk.green('● Connected');
    case 'disconnected':
      return chalk.red('● Disconnected');
    case 'connecting':
      return chalk.yellow('● Connecting');
    case 'error':
      return chalk.red('● Error');
    default:
      return chalk.gray('● Unknown');
  }
}

export function createProgressBar(total, current, width = 30) {
  const percentage = Math.round((current / total) * 100);
  const filled = Math.round((current / total) * width);
  const empty = width - filled;
  
  const bar = '█'.repeat(filled) + '░'.repeat(empty);
  
  return `${chalk.cyan(bar)} ${chalk.white(percentage)}% (${current}/${total})`;
}

export function truncate(text, maxLength = 50) {
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength - 3) + '...';
}

export function createHeader(text, gradient_type = 'rainbow') {
  const gradients = {
    rainbow: gradient.retro.rainbow,
    pastel: gradient.pastel,
    morning: gradient.morning,
    night: gradient.night,
    fruit: gradient.fruit
  };
  
  const selectedGradient = gradients[gradient_type] || gradient.rainbow;
  
  return boxen(
    selectedGradient(text),
    {
      padding: 1,
      borderStyle: 'double',
      borderColor: 'cyan',
      textAlignment: 'center'
    }
  );
}

export function parseServerConfig(input) {
  // Try to parse as JSON first
  try {
    return JSON.parse(input);
  } catch {
    // If not JSON, return as string
    return input;
  }
}

export function validateServerId(id) {
  // Server ID should be alphanumeric with underscores and hyphens
  const pattern = /^[a-zA-Z0-9_-]+$/;
  return pattern.test(id);
}

export function createNotification(type, title, message) {
  const icons = {
    success: '✅',
    error: '❌',
    warning: '⚠️',
    info: 'ℹ️'
  };
  
  const colors = {
    success: chalk.green,
    error: chalk.red,
    warning: chalk.yellow,
    info: chalk.blue
  };
  
  const icon = icons[type] || icons.info;
  const color = colors[type] || colors.info;
  
  return boxen(
    `${icon} ${color(title)}\n\n${chalk.white(message)}`,
    {
      padding: 1,
      borderStyle: 'round',
      borderColor: type === 'success' ? 'green' : type === 'error' ? 'red' : type === 'warning' ? 'yellow' : 'blue'
    }
  );
}

export function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

export function isCI() {
  return Boolean(process.env.CI);
}

export function getTerminalWidth() {
  return process.stdout.columns || 80;
}
