
export enum Language {
  PYTHON = 'python',
  JAVASCRIPT = 'javascript',
  C = 'c',
  CPP = 'cpp',
  JAVA = 'java',
  CSHARP = 'csharp',
  RUST = 'rust',
  LUA = 'lua',
  RUBY = 'ruby',
  GO = 'go',
  SWIFT = 'swift'
}

export interface ProjectFile {
  id: string;
  name: string;
  content: string;
  language: Language;
  parentId?: string; // ID of the folder it belongs to
}

export interface ProjectFolder {
  id: string;
  name: string;
  parentId?: string; // Support for nested folders
  isOpen: boolean;
}

export interface CodeOutput {
  stdout: string;
  stderr: string;
  exitCode: number;
  executionTime?: string;
  memoryUsage?: string;
}

export interface DebugFrame {
  line: number;
  variables: Record<string, any>;
  stackTrace: string[];
  explanation?: string;
}

export interface Project {
  id: string;
  name: string;
  files: ProjectFile[];
  folders: ProjectFolder[];
  activeFileId: string;
  lastSaved: number;
}

export interface TerminalLine {
  type: 'input' | 'output' | 'error' | 'system';
  text: string;
  timestamp: number;
}
