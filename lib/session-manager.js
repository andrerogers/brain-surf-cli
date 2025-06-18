import fs from 'fs';
import path from 'path';
import os from 'os';
import crypto from 'crypto';

export class SessionManager {
  constructor() {
    this.sessionDir = path.join(os.homedir(), '.brain-cli', 'sessions');
    this.ensureSessionDir();
    this.currentSessionId = null;
  }

  ensureSessionDir() {
    try {
      fs.mkdirSync(this.sessionDir, { recursive: true });
    } catch (error) {
      // Directory already exists or permission error
    }
  }

  generateSessionId() {
    return crypto.randomBytes(8).toString('hex');
  }

  createSession() {
    this.currentSessionId = this.generateSessionId();
    const session = {
      id: this.currentSessionId,
      created: new Date().toISOString(),
      history: []
    };
    this.saveSession(session);
    return this.currentSessionId;
  }

  saveSession(session) {
    const sessionFile = path.join(this.sessionDir, `${session.id}.json`);
    try {
      fs.writeFileSync(sessionFile, JSON.stringify(session, null, 2));
    } catch (error) {
      console.warn('Failed to save session:', error.message);
    }
  }

  loadSession(sessionId) {
    const sessionFile = path.join(this.sessionDir, `${sessionId}.json`);
    try {
      const data = fs.readFileSync(sessionFile, 'utf8');
      return JSON.parse(data);
    } catch (error) {
      return null;
    }
  }

  getLastSession() {
    try {
      const files = fs.readdirSync(this.sessionDir)
        .filter(file => file.endsWith('.json'))
        .map(file => {
          const sessionFile = path.join(this.sessionDir, file);
          const stats = fs.statSync(sessionFile);
          return {
            file,
            sessionId: file.replace('.json', ''),
            modified: stats.mtime
          };
        })
        .sort((a, b) => b.modified - a.modified);
      
      return files.length > 0 ? files[0].sessionId : null;
    } catch (error) {
      return null;
    }
  }

  addToHistory(sessionId, entry) {
    const session = this.loadSession(sessionId);
    if (session) {
      session.history.push({
        ...entry,
        timestamp: new Date().toISOString()
      });
      this.saveSession(session);
    }
  }

  getHistory(sessionId) {
    const session = this.loadSession(sessionId);
    return session ? session.history : [];
  }

  listSessions(limit = 10) {
    try {
      const files = fs.readdirSync(this.sessionDir)
        .filter(file => file.endsWith('.json'))
        .map(file => {
          const sessionFile = path.join(this.sessionDir, file);
          const stats = fs.statSync(sessionFile);
          const session = this.loadSession(file.replace('.json', ''));
          return {
            id: file.replace('.json', ''),
            created: session?.created,
            modified: stats.mtime,
            historyCount: session?.history?.length || 0
          };
        })
        .sort((a, b) => b.modified - a.modified)
        .slice(0, limit);
      
      return files;
    } catch (error) {
      return [];
    }
  }

  deleteSession(sessionId) {
    const sessionFile = path.join(this.sessionDir, `${sessionId}.json`);
    try {
      fs.unlinkSync(sessionFile);
      return true;
    } catch (error) {
      return false;
    }
  }
}