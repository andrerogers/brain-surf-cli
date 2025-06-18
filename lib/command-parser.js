export class CommandParser {
  constructor() {
    this.patterns = [
      // File operations
      {
        pattern: /^(?:read|show|cat|view)\s+(?:file\s+)?(.+)$/i,
        type: 'read_file',
        extract: (match) => ({ filePath: match[1].trim() })
      },
      {
        pattern: /^(?:write|save)\s+(?:to\s+)?(?:file\s+)?(.+)$/i,
        type: 'write_file',
        extract: (match) => ({ filePath: match[1].trim() })
      },
      {
        pattern: /^(?:edit|modify)\s+(?:file\s+)?(.+)$/i,
        type: 'edit_file',
        extract: (match) => ({ filePath: match[1].trim() })
      },
      {
        pattern: /^(?:list|ls|dir)\s*(.*)$/i,
        type: 'list_directory',
        extract: (match) => ({ path: match[1].trim() || '.' })
      },
      {
        pattern: /^(?:search|find|grep)\s+(?:for\s+)?["'](.+?)["'](?:\s+in\s+(.+))?$/i,
        type: 'search_files',
        extract: (match) => ({ pattern: match[1], directory: match[2] || '.' })
      },
      {
        pattern: /^(?:search|find|grep)\s+(?:for\s+)?(\S+)(?:\s+in\s+(.+))?$/i,
        type: 'search_files',
        extract: (match) => ({ pattern: match[1], directory: match[2] || '.' })
      },
      {
        pattern: /^(?:create|mkdir)\s+(?:directory\s+)?(.+)$/i,
        type: 'create_directory',
        extract: (match) => ({ path: match[1].trim() })
      },

      // Git operations
      {
        pattern: /^git\s+status$/i,
        type: 'git_status'
      },
      {
        pattern: /^(?:git\s+)?(?:show\s+)?(?:status|st)$/i,
        type: 'git_status'
      },
      {
        pattern: /^git\s+diff(?:\s+(.+))?$/i,
        type: 'git_diff',
        extract: (match) => ({ filePath: match[1]?.trim() })
      },
      {
        pattern: /^(?:show\s+)?diff(?:\s+(?:for\s+)?(.+))?$/i,
        type: 'git_diff',
        extract: (match) => ({ filePath: match[1]?.trim() })
      },
      {
        pattern: /^git\s+log(?:\s+(\d+))?$/i,
        type: 'git_log',
        extract: (match) => ({ limit: match[1] ? parseInt(match[1]) : 10 })
      },
      {
        pattern: /^(?:show\s+)?(?:git\s+)?(?:history|log)(?:\s+(\d+))?$/i,
        type: 'git_log',
        extract: (match) => ({ limit: match[1] ? parseInt(match[1]) : 10 })
      },
      {
        pattern: /^git\s+add\s+(.+)$/i,
        type: 'git_add',
        extract: (match) => ({ files: match[1].trim().split(/\s+/) })
      },
      {
        pattern: /^(?:stage|add)\s+(.+)$/i,
        type: 'git_add',
        extract: (match) => ({ files: match[1].trim().split(/\s+/) })
      },
      {
        pattern: /^git\s+commit\s+(?:-m\s+)?["'](.+)["']$/i,
        type: 'git_commit',
        extract: (match) => ({ message: match[1] })
      },
      {
        pattern: /^commit\s+["'](.+)["']$/i,
        type: 'git_commit',
        extract: (match) => ({ message: match[1] })
      },
      {
        pattern: /^(?:git\s+)?(?:branch|branches)$/i,
        type: 'git_branch_info'
      },

      // Codebase analysis
      {
        pattern: /^(?:analyze|analysis)\s+(?:project|codebase)$/i,
        type: 'analyze_project'
      },
      {
        pattern: /^(?:explain|describe)\s+(?:this\s+)?(?:project|codebase|architecture)$/i,
        type: 'explain_codebase'
      },
      {
        pattern: /^(?:show\s+)?(?:project\s+)?structure$/i,
        type: 'get_project_structure'
      },
      {
        pattern: /^(?:find|search)\s+(?:definition\s+(?:of\s+)?)?(\w+)(?:\s+in\s+(.+))?$/i,
        type: 'find_definition',
        extract: (match) => ({ symbol: match[1], filePath: match[2]?.trim() })
      },
      {
        pattern: /^(?:find|search)\s+(?:references\s+(?:to\s+)?)?(\w+)(?:\s+in\s+(.+))?$/i,
        type: 'find_references',
        extract: (match) => ({ symbol: match[1], filePath: match[2]?.trim() })
      },
      {
        pattern: /^(?:where\s+is|what\s+is)\s+(\w+)(?:\s+(?:defined|used))?$/i,
        type: 'find_definition',
        extract: (match) => ({ symbol: match[1] })
      },

      // Server connection patterns
      {
        pattern: /^connect\s+(?:to\s+)?server\s+(\w+)\s+(?:with\s+)?(?:config\s+)?(.+)$/i,
        type: 'connect_server',
        extract: (match) => ({ serverId: match[1], config: match[2].trim() })
      },
      {
        pattern: /^connect\s+(\w+)\s+(.+)$/i,
        type: 'connect_server',
        extract: (match) => ({ serverId: match[1], config: match[2].trim() })
      },

      // Server listing patterns
      {
        pattern: /^(?:list|show)\s+servers?$/i,
        type: 'list_servers'
      },
      {
        pattern: /^servers?$/i,
        type: 'list_servers'
      },

      // Tools listing patterns
      {
        pattern: /^(?:list|show)\s+tools?\s+(?:from\s+)?(?:server\s+)?(\w+)$/i,
        type: 'list_tools',
        extract: (match) => ({ serverId: match[1] })
      },
      {
        pattern: /^tools?\s+(?:from\s+)?(\w+)$/i,
        type: 'list_tools',
        extract: (match) => ({ serverId: match[1] })
      },

      // Query patterns (explicit)
      {
        pattern: /^query:\s*(.+)$/i,
        type: 'query',
        extract: (match) => ({ query: match[1].trim() })
      },
      {
        pattern: /^ask:\s*(.+)$/i,
        type: 'query',
        extract: (match) => ({ query: match[1].trim() })
      },

      // Question patterns (natural language queries)
      {
        pattern: /^(?:what|how|why|when|where|who|can|could|would|should|is|are|do|does|did|will|explain|tell|describe)\s+/i,
        type: 'query',
        extract: (match) => ({ query: match.input })
      },
      {
        pattern: /\?$/,
        type: 'query',
        extract: (match) => ({ query: match.input })
      }
    ];
  }

  parse(input) {
    const trimmedInput = input.trim();
    
    // Try each pattern
    for (const { pattern, type, extract } of this.patterns) {
      const match = trimmedInput.match(pattern);
      if (match) {
        const result = { type };
        if (extract) {
          Object.assign(result, extract(match));
        }
        return result;
      }
    }

    // If no pattern matches, treat as unknown (will become a query)
    return { type: 'unknown', input: trimmedInput };
  }
  
  // Check if input looks like a development command
  isDevelopmentCommand(input) {
    const devKeywords = [
      'read', 'write', 'edit', 'file', 'list', 'search', 'find',
      'git', 'status', 'diff', 'commit', 'add', 'stage',
      'analyze', 'explain', 'structure', 'definition', 'references'
    ];
    
    return devKeywords.some(keyword => 
      input.toLowerCase().includes(keyword)
    );
  }
  
  // Get command category for better help
  getCommandCategory(type) {
    const categories = {
      'file_operations': ['read_file', 'write_file', 'edit_file', 'list_directory', 'search_files', 'create_directory'],
      'git_operations': ['git_status', 'git_diff', 'git_log', 'git_add', 'git_commit', 'git_branch_info'],
      'codebase_analysis': ['analyze_project', 'explain_codebase', 'get_project_structure', 'find_definition', 'find_references'],
      'server_management': ['connect_server', 'list_servers', 'list_tools'],
      'queries': ['query']
    };
    
    for (const [category, types] of Object.entries(categories)) {
      if (types.includes(type)) {
        return category;
      }
    }
    
    return 'unknown';
  }

  // Helper method to suggest corrections for common typos
  suggestCommand(input) {
    const suggestions = [];
    
    // File operations
    if (input.includes('file') || input.includes('read') || input.includes('edit')) {
      suggestions.push('read file.txt', 'edit src/app.js', 'list .');
    }
    
    // Git operations
    if (input.includes('git') || input.includes('commit') || input.includes('diff')) {
      suggestions.push('git status', 'git diff', 'commit "message"');
    }
    
    // Project analysis
    if (input.includes('project') || input.includes('analyze') || input.includes('structure')) {
      suggestions.push('analyze project', 'show structure', 'explain codebase');
    }
    
    // Server operations
    if (input.includes('server') || input.includes('connect')) {
      suggestions.push('connect server_name config_path');
    }
    
    if (input.includes('list') || input.includes('show')) {
      suggestions.push('list servers', 'list tools from server_name');
    }
    
    return suggestions;
  }
}