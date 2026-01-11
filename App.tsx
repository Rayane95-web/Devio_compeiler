
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { 
  Play, 
  Trash2, 
  Copy, 
  Download, 
  Save, 
  Settings, 
  Terminal as TerminalIcon, 
  List,
  Sun,
  Moon,
  FileCode,
  CheckCircle2,
  X,
  Type,
  ChevronDown,
  Clock,
  ExternalLink,
  ChevronUp,
  Plus,
  Keyboard,
  RefreshCw,
  Eraser,
  Palette,
  Bug,
  Sparkles,
  ChevronRight,
  StepForward,
  RotateCcw,
  Wand2,
  Search
} from 'lucide-react';
import { Language, Project, ProjectFile, ProjectFolder, TerminalLine, DebugFrame } from './types';
import { SUPPORTED_LANGUAGES, BOILERPLATE } from './constants';
import { executeCode, debugCode, getAIHint, formatCode } from './services/geminiService';
import Editor, { EDITOR_THEMES, EditorHandle } from './components/Editor';
import FileExplorer from './components/FileExplorer';
import Terminal from './components/Terminal';

const FONT_FAMILIES = [
  { id: "'Fira Code'", name: 'Fira Code' },
  { id: "'JetBrains Mono'", name: 'JetBrains Mono' },
  { id: "'Roboto Mono'", name: 'Roboto Mono' },
  { id: "'Source Code Pro'", name: 'Source Code Pro' },
  { id: "'Space Mono'", name: 'Space Mono' },
  { id: 'monospace', name: 'System Monospace' }
];

const DevioLogo = ({ size = 32, className = "" }) => (
  <svg 
    width={size} 
    height={size} 
    viewBox="0 0 100 100" 
    fill="none" 
    xmlns="http://www.w3.org/2000/svg"
    className={className}
  >
    <defs>
      <linearGradient id="logoGradient" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#c084fc" />
        <stop offset="50%" stopColor="#a855f7" />
        <stop offset="100%" stopColor="#0ea5e9" />
      </linearGradient>
    </defs>
    <path 
      d="M32 20C32 14.4772 36.4772 10 42 10H82C87.5228 10 92 14.4772 92 20V55C92 60.5228 87.5228 65 82 65H58L32 82V20Z" 
      fill="url(#logoGradient)"
    />
    <path 
      d="M48 30L40 37.5L48 45M72 30L80 37.5L72 45M64 25L56 50" 
      stroke="white" 
      strokeWidth="6" 
      strokeLinecap="round" 
      strokeLinejoin="round"
    />
  </svg>
);

const App: React.FC = () => {
  const editorRef = useRef<EditorHandle>(null);
  
  const initialFile: ProjectFile = {
    id: 'main-file',
    name: 'main.py',
    content: BOILERPLATE[Language.PYTHON],
    language: Language.PYTHON
  };

  const [files, setFiles] = useState<ProjectFile[]>([initialFile]);
  const [folders, setFolders] = useState<ProjectFolder[]>([]);
  const [activeFileId, setActiveFileId] = useState<string>(initialFile.id);
  const [terminalHistory, setTerminalHistory] = useState<TerminalLine[]>([
    { type: 'system', text: 'Welcome to Devio Terminal v1.0.0', timestamp: Date.now() },
    { type: 'system', text: 'Type "run" to execute current file or "help" for commands.', timestamp: Date.now() }
  ]);
  
  const [explorerWidth, setExplorerWidth] = useState(250);
  const [isResizing, setIsResizing] = useState(false);
  const [terminalHeight, setTerminalHeight] = useState(250);
  const [isRunning, setIsRunning] = useState(false);
  const [isDebugMode, setIsDebugMode] = useState(false);
  const [isFormatting, setIsFormatting] = useState(false);
  const [debugFrames, setDebugFrames] = useState<DebugFrame[]>([]);
  const [activeFrameIndex, setActiveFrameIndex] = useState(0);
  const [breakpoints, setBreakpoints] = useState<number[]>([]);
  const [isWaitingForStdin, setIsWaitingForStdin] = useState(false);
  const [showSaveToast, setShowSaveToast] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isProjectsOpen, setIsProjectsOpen] = useState(false);
  const [fontSize, setFontSize] = useState(14);
  const [fontFamily, setFontFamily] = useState("'Fira Code'");
  const [isDarkMode, setIsDarkMode] = useState(true);
  const [editorTheme, setEditorTheme] = useState('okaidia');
  const [projects, setProjects] = useState<Project[]>([]);
  const [isAIAnalyzing, setIsAIAnalyzing] = useState(false);
  
  const [saveStatus, setSaveStatus] = useState<'saved' | 'saving' | 'unsaved'>('saved');
  const isLoaded = useRef(false);
  const autoSaveTimerRef = useRef<number | null>(null);

  const activeFile = files.find(f => f.id === activeFileId);

  useEffect(() => {
    if (files.length > 0) {
      const exists = files.some(f => f.id === activeFileId);
      if (!exists) setActiveFileId(files[0].id);
    } else if (activeFileId !== '') {
      setActiveFileId('');
    }
  }, [files, activeFileId]);

  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
      document.body.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
      document.body.classList.remove('dark');
    }
  }, [isDarkMode]);

  useEffect(() => {
    const savedProjects = localStorage.getItem('gemini_projects');
    if (savedProjects) setProjects(JSON.parse(savedProjects));
    const savedTheme = localStorage.getItem('gemini_theme');
    if (savedTheme) setIsDarkMode(savedTheme === 'dark');
    const savedFontSize = localStorage.getItem('gemini_font_size');
    if (savedFontSize) setFontSize(parseInt(savedFontSize));
    const savedFontFamily = localStorage.getItem('gemini_font_family');
    if (savedFontFamily) setFontFamily(savedFontFamily);
    const savedEditorTheme = localStorage.getItem('gemini_editor_theme');
    if (savedEditorTheme) setEditorTheme(savedEditorTheme);
    const lastSession = localStorage.getItem('devio_current_session');
    if (lastSession) {
      try {
        const { files: sFiles, folders: sFolders, activeFileId: sActiveId } = JSON.parse(lastSession);
        if (sFiles && sFiles.length > 0) {
          setFiles(sFiles);
          setFolders(sFolders || []);
          setActiveFileId(sActiveId || sFiles[0].id);
        }
      } catch (e) { console.error("Failed to restore session", e); }
    }
    isLoaded.current = true;
  }, []);

  useEffect(() => { localStorage.setItem('gemini_theme', isDarkMode ? 'dark' : 'light'); }, [isDarkMode]);
  useEffect(() => { localStorage.setItem('gemini_font_size', fontSize.toString()); }, [fontSize]);
  useEffect(() => { localStorage.setItem('gemini_font_family', fontFamily); }, [fontFamily]);
  useEffect(() => { localStorage.setItem('gemini_editor_theme', editorTheme); }, [editorTheme]);

  useEffect(() => {
    if (!isLoaded.current) return;
    setSaveStatus('unsaved');
    if (autoSaveTimerRef.current) window.clearTimeout(autoSaveTimerRef.current);
    autoSaveTimerRef.current = window.setTimeout(() => {
      setSaveStatus('saving');
      const session = { files, folders, activeFileId, timestamp: Date.now() };
      localStorage.setItem('devio_current_session', JSON.stringify(session));
      setTimeout(() => setSaveStatus('saved'), 600);
    }, 1500);
    return () => { if (autoSaveTimerRef.current) window.clearTimeout(autoSaveTimerRef.current); };
  }, [files, folders, activeFileId]);

  const startResizing = useCallback((e: React.MouseEvent) => { setIsResizing(true); e.preventDefault(); }, []);
  const stopResizing = useCallback(() => setIsResizing(false), []);
  const resize = useCallback((e: MouseEvent) => {
    if (isResizing) {
      const newWidth = Math.max(150, Math.min(500, e.clientX - 64));
      setExplorerWidth(newWidth);
    }
  }, [isResizing]);

  useEffect(() => {
    window.addEventListener('mousemove', resize);
    window.addEventListener('mouseup', stopResizing);
    return () => { window.removeEventListener('mousemove', resize); window.removeEventListener('mouseup', stopResizing); };
  }, [resize, stopResizing]);

  const saveToLocal = (updatedProjects: Project[]) => { localStorage.setItem('gemini_projects', JSON.stringify(updatedProjects)); };
  const updateActiveFileContent = (content: string) => { if (!activeFileId) return; setFiles(prev => prev.map(f => f.id === activeFileId ? { ...f, content } : f)); };
  const handleLanguageChange = (newLang: Language) => { if (!activeFileId) return; setFiles(prev => prev.map(f => f.id === activeFileId ? { ...f, language: newLang } : f)); };
  const handleFileAdd = (name: string, language: Language, parentId?: string) => {
    const newFile: ProjectFile = { id: Date.now().toString(), name, content: BOILERPLATE[language] || '', language, parentId };
    setFiles(prev => [...prev, newFile]);
    setActiveFileId(newFile.id);
  };
  const handleFolderAdd = (name: string, parentId?: string) => {
    const newFolder: ProjectFolder = { id: 'folder-' + Date.now().toString(), name, parentId, isOpen: true };
    setFolders(prev => [...prev, newFolder]);
  };
  const handleFileDelete = useCallback((id: string) => { setFiles(prev => prev.filter(f => f.id !== id)); }, []);
  const handleFolderDelete = useCallback((folderId: string) => {
    const getRecursiveChildren = (parentId: string): { files: string[], folders: string[] } => {
      let results = { files: files.filter(f => f.parentId === parentId).map(f => f.id), folders: folders.filter(f => f.parentId === parentId).map(f => f.id) };
      results.folders.forEach(childFolderId => {
        const nested = getRecursiveChildren(childFolderId);
        results.files.push(...nested.files);
        results.folders.push(...nested.folders);
      });
      return results;
    };
    const toDelete = getRecursiveChildren(folderId);
    toDelete.folders.push(folderId);
    setFolders(prev => prev.filter(f => !toDelete.folders.includes(f.id)));
    setFiles(prev => prev.filter(f => !toDelete.files.includes(f.id)));
  }, [files, folders]);

  const handleItemRename = (id: string, type: 'file' | 'folder', newName: string) => {
    if (type === 'file') {
      const ext = newName.split('.').pop()?.toLowerCase();
      const detectedLang = SUPPORTED_LANGUAGES.find(l => l.extension === ext)?.id;
      setFiles(prev => prev.map(f => f.id === id ? { ...f, name: newName, language: detectedLang || f.language } : f));
    } else { setFolders(prev => prev.map(f => f.id === id ? { ...f, name: newName } : f)); }
  };
  const handleToggleFolder = (id: string) => setFolders(prev => prev.map(f => f.id === id ? { ...f, isOpen: !f.isOpen } : f));
  const handleMoveItem = (itemId: string, itemType: 'file' | 'folder', newParentId?: string) => {
    if (itemType === 'folder' && itemId === newParentId) return;
    if (itemType === 'file') setFiles(prev => prev.map(f => f.id === itemId ? { ...f, parentId: newParentId } : f));
    else setFolders(prev => prev.map(f => f.id === itemId ? { ...f, parentId: newParentId } : f));
  };

  const addToTerminal = (type: TerminalLine['type'], text: string) => { setTerminalHistory(prev => [...prev, { type, text, timestamp: Date.now() }]); };
  const handleRun = async (overrideStdin?: string) => {
    if (!activeFile) return;
    setIsDebugMode(false);
    const needsInput = /input\(|prompt\(|scanf\(|cin\s*>>|gets\(|fgets\(|Scanner|System\.in|gets|chomp/.test(activeFile.content);
    if (!overrideStdin && needsInput) {
      setIsWaitingForStdin(true);
      setTerminalHeight(Math.max(terminalHeight, 200));
      addToTerminal('system', 'Program is waiting for input... Type your input in the terminal and press Enter.');
      return;
    }
    setIsRunning(true);
    setIsWaitingForStdin(false);
    setTerminalHeight(Math.max(terminalHeight, 200));
    try {
      const result = await executeCode(activeFile.language, activeFile.content, overrideStdin || '');
      if (result.stdout) addToTerminal('output', result.stdout);
      if (result.stderr) addToTerminal('error', result.stderr);
      addToTerminal('system', `Process exited with code ${result.exitCode}${result.executionTime ? ` in ${result.executionTime}` : ''}`);
    } catch (err) { addToTerminal('error', `Execution failed: ${String(err)}`); } finally { setIsRunning(false); }
  };

  const handleDebug = async () => {
    if (!activeFile) return;
    setIsDebugMode(true);
    setIsRunning(true);
    setTerminalHeight(Math.max(terminalHeight, 200));
    addToTerminal('system', 'Starting debugger...');
    try {
      const frames = await debugCode(activeFile.language, activeFile.content, breakpoints);
      setDebugFrames(frames);
      setActiveFrameIndex(0);
      addToTerminal('system', `Debugger started. Captured ${frames.length} steps.`);
      const initialFrame = frames[0];
      if (initialFrame) addToTerminal('output', `Step 1: Line ${initialFrame.line}\nVariables: ${JSON.stringify(initialFrame.variables)}`);
    } catch (err) { addToTerminal('error', `Debug failed: ${String(err)}`); setIsDebugMode(false); } finally { setIsRunning(false); }
  };

  const handleStepDebug = () => {
    if (activeFrameIndex < debugFrames.length - 1) {
      const nextIdx = activeFrameIndex + 1;
      setActiveFrameIndex(nextIdx);
      const frame = debugFrames[nextIdx];
      addToTerminal('output', `Step ${nextIdx + 1}: Line ${frame.line}\nVariables: ${JSON.stringify(frame.variables)}`);
    } else { addToTerminal('system', 'Debug session finished.'); setIsDebugMode(false); }
  };

  const handleFormat = async () => {
    if (!activeFile) return;
    setIsFormatting(true);
    try {
      const formatted = await formatCode(activeFile.language, activeFile.content);
      updateActiveFileContent(formatted);
    } catch (err) { addToTerminal('error', `Formatting failed: ${String(err)}`); } finally { setIsFormatting(false); }
  };

  const handleAIAnalyze = async () => {
    if (!activeFile) return;
    setIsAIAnalyzing(true);
    setTerminalHeight(Math.max(terminalHeight, 200));
    addToTerminal('system', 'AI Assistant is analyzing your code...');
    try {
      const hint = await getAIHint(activeFile.language, activeFile.content, terminalHistory.filter(h => h.type === 'error').map(e => e.text).join('\n'));
      addToTerminal('output', `\n--- AI ANALYSIS ---\n${hint}\n-------------------\n`);
    } catch (err) { addToTerminal('error', `AI Analysis failed: ${String(err)}`); } finally { setIsAIAnalyzing(false); }
  };

  const handleTerminalCommand = (cmd: string) => {
    if (isWaitingForStdin) { addToTerminal('input', cmd); handleRun(cmd); return; }
    const trimmedCmd = cmd.trim();
    addToTerminal('input', cmd);
    if (trimmedCmd === '') return;
    const parts = trimmedCmd.split(' ');
    const command = parts[0].toLowerCase();
    switch (command) {
      case 'clear': setTerminalHistory([]); break;
      case 'help': addToTerminal('output', 'Available commands:\n  run               Execute active file\n  debug             Start AI Debugger\n  analyze           Get AI code insights\n  format            Prettify current code\n  ls                List files in directory\n  clear             Clear terminal\n  help              Show this message\n  echo [msg]        Print message'); break;
      case 'ls': addToTerminal('output', files.map(f => f.name).join('  ') || 'No files'); break;
      case 'echo': addToTerminal('output', parts.slice(1).join(' ')); break;
      case 'run': handleRun(); break;
      case 'debug': handleDebug(); break;
      case 'format': handleFormat(); break;
      case 'analyze': handleAIAnalyze(); break;
      default: addToTerminal('error', `Command not found: ${command}`);
    }
  };

  const toggleBreakpoint = (line: number) => { setBreakpoints(prev => prev.includes(line) ? prev.filter(l => l !== line) : [...prev, line]); };
  const copyCode = () => { if (activeFile) navigator.clipboard.writeText(activeFile.content); };
  const downloadCode = () => {
    if (!activeFile) return;
    const blob = new Blob([activeFile.content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = activeFile.name;
    a.click();
    URL.revokeObjectURL(url);
  };

  const saveProject = useCallback(() => {
    const name = prompt('Project name?', 'Untitled Project');
    if (!name) return;
    const newProject: Project = { id: Date.now().toString(), name, files: [...files], folders: [...folders], activeFileId, lastSaved: Date.now() };
    const updated = [...projects, newProject];
    setProjects(updated);
    saveToLocal(updated);
    setShowSaveToast(true);
    setTimeout(() => setShowSaveToast(false), 3000);
  }, [files, folders, activeFileId, projects]);

  const loadProject = (project: Project) => {
    setFiles(project.files);
    setFolders(project.folders);
    setActiveFileId(project.activeFileId);
    setIsProjectsOpen(false);
    addToTerminal('system', `Loaded project: ${project.name}`);
  };

  const deleteProject = (id: string) => {
    if (!window.confirm('Delete this project?')) return;
    const updated = projects.filter(p => p.id !== id);
    setProjects(updated);
    saveToLocal(updated);
  };

  const clearOutput = () => { setTerminalHistory([{ type: 'system', text: 'Terminal cleared.', timestamp: Date.now() }]); };

  const handleThemeChange = (newThemeId: string) => {
    const themeObj = EDITOR_THEMES.find(t => t.id === newThemeId);
    if (themeObj) {
      setEditorTheme(newThemeId);
      if (themeObj.type === 'light') setIsDarkMode(false);
      else setIsDarkMode(true);
    }
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 's') { e.preventDefault(); saveProject(); }
      if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') { e.preventDefault(); handleRun(); }
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') { e.preventDefault(); clearOutput(); }
      if ((e.ctrlKey || e.metaKey) && e.key === 'l' && e.shiftKey) { e.preventDefault(); handleFormat(); }
      if (e.key === 'F10' && isDebugMode) { e.preventDefault(); handleStepDebug(); }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [saveProject, handleRun, isDebugMode, activeFrameIndex]);

  const renderSaveStatus = () => {
    switch(saveStatus) {
      case 'saving': return <div className="flex items-center gap-1.5 text-[10px] font-bold text-blue-500 animate-pulse uppercase tracking-wider"><RefreshCw size={10} className="animate-spin" />Saving</div>;
      case 'unsaved': return <div className="flex items-center gap-1.5 text-[10px] font-bold text-amber-500 uppercase tracking-wider"><div className="w-1.5 h-1.5 rounded-full bg-amber-500" />Unsaved Changes</div>;
      case 'saved': default: return <div className="flex items-center gap-1.5 text-[10px] font-bold text-emerald-500 uppercase tracking-wider"><CheckCircle2 size={10} />Saved</div>;
    }
  };

  return (
    <div className={`flex h-screen w-full overflow-hidden transition-colors duration-300 ${isDarkMode ? 'bg-slate-950 text-slate-200' : 'bg-slate-50 text-slate-900'} ${isResizing ? 'cursor-col-resize select-none' : ''}`}>
      
      {/* Settings Modal */}
      {isSettingsOpen && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className={`${isDarkMode ? 'bg-slate-900 border-slate-700 text-slate-200' : 'bg-white border-slate-200 text-slate-900'} border w-full max-w-md rounded-2xl shadow-2xl p-6 relative animate-in fade-in zoom-in duration-200 overflow-y-auto max-h-[90vh]`}>
            <button onClick={() => setIsSettingsOpen(false)} className="absolute top-4 right-4 p-2 hover:bg-slate-500/10 rounded-full transition-colors"><X size={20} /></button>
            <h2 className="text-xl font-bold mb-6 flex items-center gap-2"><Settings className="text-blue-500" />Editor Settings</h2>
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div><div className="font-semibold text-sm">Appearance</div><div className={`text-[10px] ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>Switch modes</div></div>
                <button onClick={() => setIsDarkMode(!isDarkMode)} className={`p-2 rounded-lg border transition-all ${isDarkMode ? 'bg-slate-800 border-slate-700 text-yellow-400' : 'bg-slate-100 border-slate-200 text-slate-600'}`}>{isDarkMode ? <Sun size={20} /> : <Moon size={20} />}</button>
              </div>
              <div className="flex items-center justify-between">
                <div><div className="font-semibold text-sm">Font Size</div><div className={`text-[10px] ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>Adjust readability</div></div>
                <div className="flex items-center gap-4">
                  <button onClick={() => setFontSize(Math.max(10, fontSize - 1))} className="p-1 hover:bg-slate-500/10 rounded transition-colors"><Type size={16} /></button>
                  <span className="font-mono text-sm w-8 text-center">{fontSize}</span>
                  <button onClick={() => setFontSize(Math.min(24, fontSize + 1))} className="p-1 hover:bg-slate-500/10 rounded transition-colors"><Type size={20} /></button>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <div><div className="font-semibold text-sm">Font Family</div><div className={`text-[10px] ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>Choose typeface</div></div>
                <div className="relative">
                  <select value={fontFamily} onChange={(e) => setFontFamily(e.target.value)} className={`appearance-none outline-none border rounded-lg px-3 py-1.5 pr-8 text-xs font-medium cursor-pointer transition-all ${isDarkMode ? 'bg-slate-800 border-slate-700 text-blue-400 focus:border-blue-500' : 'bg-slate-50 border-slate-200 text-blue-600 focus:border-blue-500'}`}>
                    {FONT_FAMILIES.map(font => <option key={font.id} value={font.id} style={{ fontFamily: font.id }}>{font.name}</option>)}
                  </select>
                  <ChevronDown size={14} className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none text-slate-500" />
                </div>
              </div>
              <div className="flex items-center justify-between">
                <div><div className="font-semibold text-sm">Syntax Theme</div><div className={`text-[10px] ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>Change colors</div></div>
                <div className="relative">
                  <select value={editorTheme} onChange={(e) => handleThemeChange(e.target.value)} className={`appearance-none outline-none border rounded-lg px-3 py-1.5 pr-8 text-xs font-medium cursor-pointer transition-all ${isDarkMode ? 'bg-slate-800 border-slate-700 text-blue-400 focus:border-blue-500' : 'bg-slate-50 border-slate-200 text-blue-600 focus:border-blue-500'}`}>
                    {EDITOR_THEMES.map(theme => <option key={theme.id} value={theme.id}>{theme.name}</option>)}
                  </select>
                  <Palette size={14} className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none text-slate-500" />
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Projects Modal */}
      {isProjectsOpen && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className={`${isDarkMode ? 'bg-slate-900 border-slate-700' : 'bg-white border-slate-200'} border w-full max-w-2xl rounded-2xl shadow-2xl overflow-hidden relative animate-in fade-in zoom-in duration-200 flex flex-col max-h-[80vh]`}>
            <div className="p-6 border-b border-slate-800/50 flex items-center justify-between">
              <h2 className="text-xl font-bold flex items-center gap-2"><List className="text-blue-500" />Saved Projects</h2>
              <button onClick={() => setIsProjectsOpen(false)} className="p-2 hover:bg-slate-500/10 rounded-full transition-colors"><X size={20} /></button>
            </div>
            <div className="flex-1 overflow-auto custom-scrollbar p-6">
              {projects.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-slate-500 space-y-4 py-12">
                   <div className="p-4 bg-slate-800 rounded-full"><Save size={48} className="opacity-20" /></div>
                   <p className="text-sm italic">No saved projects.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-3">
                  {projects.sort((a, b) => b.lastSaved - a.lastSaved).map(project => (
                    <div key={project.id} className={`group flex items-center justify-between p-4 rounded-xl border transition-all ${isDarkMode ? 'bg-slate-800/40 border-slate-800 hover:border-blue-500/50 hover:bg-slate-800/80' : 'bg-slate-100 border-slate-200 hover:border-blue-500/50 hover:bg-white'}`}>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-bold text-sm truncate">{project.name}</span>
                          <span className={`px-1.5 py-0.5 rounded text-[8px] font-bold uppercase ${isDarkMode ? 'bg-slate-700 text-slate-400' : 'bg-slate-200 text-slate-500'}`}>{project.files.length} files</span>
                        </div>
                        <div className="flex items-center gap-3 text-[10px] text-slate-500"><Clock size={10} /> {new Intl.DateTimeFormat('en-US', {month: 'short', day: 'numeric'}).format(project.lastSaved)}</div>
                      </div>
                      <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button onClick={() => loadProject(project)} className="p-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg transition-colors flex items-center gap-2 text-xs font-semibold px-4"><ExternalLink size={14} /> Load</button>
                        <button onClick={() => deleteProject(project.id)} className="p-2 text-red-500 hover:bg-red-500/10 rounded-lg transition-colors"><Trash2 size={16} /></button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {showSaveToast && <div className="fixed bottom-10 left-1/2 -translate-x-1/2 z-[100] bg-emerald-600 text-white px-6 py-3 rounded-full shadow-2xl flex items-center gap-3 animate-bounce"><CheckCircle2 size={20} /><span className="font-semibold text-sm">Project Saved!</span></div>}

      <div className={`w-16 flex flex-col items-center py-6 border-r shrink-0 gap-6 transition-colors duration-300 ${isDarkMode ? 'border-slate-800 bg-[#0f172a]' : 'border-slate-200 bg-slate-100'}`}>
        <div className="relative group cursor-pointer" onClick={() => setActiveFileId('')}>
           <div className="absolute inset-0 bg-blue-500/20 blur-xl rounded-full scale-150 group-hover:bg-blue-500/30 transition-all"></div>
           <DevioLogo size={42} className="relative z-10 transition-transform group-hover:scale-105" />
        </div>
        <div className="w-10 h-px bg-slate-800/50 my-2" />
        <button onClick={() => setIsProjectsOpen(true)} className={`p-3 rounded-lg transition-colors ${isProjectsOpen ? 'text-blue-500 bg-blue-500/10' : 'text-slate-400 hover:text-blue-500 hover:bg-blue-500/10'}`} title="Saved Projects"><List size={20} /></button>
        <button onClick={handleAIAnalyze} disabled={isAIAnalyzing || !activeFile} className={`p-3 rounded-lg transition-all ${isAIAnalyzing ? 'text-purple-500 animate-pulse' : 'text-slate-400 hover:text-purple-500 hover:bg-purple-500/10'}`} title="AI Analysis"><Sparkles size={20} /></button>
        <div className="mt-auto flex flex-col gap-4">
          <button onClick={() => setIsSettingsOpen(true)} className={`p-3 transition-colors rounded-lg ${isSettingsOpen ? 'text-blue-500 bg-blue-500/10' : 'text-slate-400 hover:text-blue-500 hover:bg-blue-500/10'}`} title="Settings"><Settings size={20} /></button>
        </div>
      </div>

      <div className="flex-1 flex flex-col min-w-0">
        <header className={`h-14 border-b flex items-center justify-between px-6 backdrop-blur-md z-20 transition-colors duration-300 ${isDarkMode ? 'border-slate-800 bg-[#0f172a]/80' : 'border-slate-200 bg-white/80'}`}>
          <div className="flex items-center gap-6">
            <div className="flex flex-col min-w-[120px]">
              <div className={`flex items-center gap-2 ${isDarkMode ? 'text-slate-200' : 'text-slate-900'} font-medium`}><FileCode size={18} className="text-blue-500" /><span className="text-sm font-bold whitespace-nowrap overflow-hidden text-ellipsis max-w-[200px]">{activeFile?.name || 'Devio Editor'}</span></div>
              <div className="mt-0.5">{activeFile ? renderSaveStatus() : <span className="text-[10px] text-slate-500 uppercase tracking-widest font-bold">Workspace</span>}</div>
            </div>
            <div className={`h-8 w-px ${isDarkMode ? 'bg-slate-800' : 'bg-slate-200'}`} />
            <div className="flex items-center gap-3">
              <div className="relative group flex items-center">
                <select value={activeFile?.language || ''} onChange={(e) => handleLanguageChange(e.target.value as Language)} disabled={!activeFile} className={`appearance-none bg-slate-500/10 hover:bg-slate-500/20 px-3 py-1.5 pr-8 rounded-md text-xs font-bold cursor-pointer outline-none border border-transparent focus:border-blue-500/50 transition-all ${isDarkMode ? 'text-blue-400' : 'text-blue-600'} disabled:opacity-30`}>
                  <option value="" disabled>Select Language</option>
                  {SUPPORTED_LANGUAGES.map(lang => <option key={lang.id} value={lang.id} className={isDarkMode ? 'bg-slate-900 text-white' : 'bg-white text-slate-900'}>{lang.name}</option>)}
                </select>
                <ChevronDown size={12} className={`absolute right-2 pointer-events-none ${isDarkMode ? 'text-slate-500' : 'text-slate-400'}`} />
              </div>
              <div className="flex items-center gap-2">
                {!isDebugMode ? (
                  <>
                    <button onClick={() => handleRun()} disabled={isRunning || !activeFile} className={`flex items-center gap-2 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white px-5 py-1.5 rounded-md text-sm font-bold transition-all shadow-lg shadow-emerald-500/20 active:scale-95`}>
                      {isRunning ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Play size={16} />}Run
                    </button>
                    <button onClick={handleDebug} disabled={isRunning || !activeFile} className={`flex items-center gap-2 border border-slate-700 px-4 py-1.5 rounded-md text-sm font-bold transition-all hover:bg-slate-800 disabled:opacity-50`}><Bug size={16} className="text-amber-500" />Debug</button>
                    <button onClick={handleFormat} disabled={isFormatting || !activeFile} className={`flex items-center gap-2 border border-slate-700 px-4 py-1.5 rounded-md text-sm font-bold transition-all hover:bg-slate-800 disabled:opacity-50`}>
                      {isFormatting ? <div className="w-4 h-4 border-2 border-slate-400/30 border-t-blue-500 rounded-full animate-spin" /> : <Wand2 size={16} className="text-blue-400" />}Format
                    </button>
                    <button onClick={() => editorRef.current?.toggleFind()} disabled={!activeFile} className="p-2 text-slate-400 hover:text-blue-500 rounded-md transition-colors" title="Find and Replace (Ctrl+F)"><Search size={18}/></button>
                  </>
                ) : (
                  <div className="flex items-center gap-2 bg-slate-800/50 border border-amber-500/30 p-1 rounded-lg">
                    <button onClick={handleStepDebug} className="flex items-center gap-2 bg-amber-600 hover:bg-amber-500 text-white px-4 py-1.5 rounded-md text-sm font-bold transition-all"><StepForward size={16} />Next Step</button>
                    <button onClick={() => { setIsDebugMode(false); setDebugFrames([]); }} className="p-1.5 hover:bg-red-500/10 text-red-500 rounded-md transition-colors"><X size={18} /></button>
                    <button onClick={handleDebug} className="p-1.5 hover:bg-amber-500/10 text-amber-500 rounded-md transition-colors"><RotateCcw size={18} /></button>
                  </div>
                )}
                <div className={`h-6 w-px mx-1 ${isDarkMode ? 'bg-slate-800' : 'bg-slate-200'}`} />
                <button onClick={clearOutput} className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-semibold transition-all active:scale-95 ${isDarkMode ? 'text-slate-400 hover:text-white hover:bg-slate-800' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'}`} title="Clear (Ctrl+K)"><Eraser size={16} />Clear</button>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
             <button onClick={() => setIsDarkMode(!isDarkMode)} className={`p-2 rounded-md transition-colors ${isDarkMode ? 'text-yellow-400 hover:bg-slate-500/10' : 'text-slate-600 hover:bg-slate-500/10'}`}>{isDarkMode ? <Sun size={18} /> : <Moon size={18} />}</button>
             <div className={`h-4 w-px mx-1 ${isDarkMode ? 'bg-slate-800' : 'bg-slate-200'}`} />
             <button onClick={copyCode} disabled={!activeFile} className="p-2 text-slate-400 hover:text-blue-500 rounded-md transition-colors"><Copy size={18}/></button>
             <button onClick={downloadCode} disabled={!activeFile} className="p-2 text-slate-400 hover:text-blue-500 rounded-md transition-colors"><Download size={18}/></button>
             <button onClick={saveProject} className="p-2 text-slate-400 hover:text-blue-500 rounded-md transition-colors"><Save size={18}/></button>
          </div>
        </header>
        <div className="flex-1 flex overflow-hidden">
          <div style={{ width: `${explorerWidth}px` }} className="relative flex shrink-0">
            <FileExplorer files={files} folders={folders} activeFileId={activeFileId} onFileSelect={setActiveFileId} onFileAdd={handleFileAdd} onFolderAdd={handleFolderAdd} onFileDelete={handleFileDelete} onFolderDelete={handleFolderDelete} onToggleFolder={handleToggleFolder} onMoveItem={handleMoveItem} onItemRename={handleItemRename} isDarkMode={isDarkMode} />
            <div onMouseDown={startResizing} className={`absolute top-0 right-[-4px] w-[8px] h-full cursor-col-resize z-30 transition-colors group ${isResizing ? 'bg-blue-500' : 'hover:bg-blue-500/30'}`}><div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[1px] h-8 bg-slate-700 opacity-50" /></div>
          </div>
          <div className="flex-1 flex flex-col min-w-0">
            <div className="flex-1 flex flex-col relative min-h-0">
              {activeFile ? (
                <Editor 
                  ref={editorRef}
                  code={activeFile.content} 
                  language={activeFile.language} 
                  onChange={updateActiveFileContent} 
                  breakpoints={breakpoints} 
                  toggleBreakpoint={toggleBreakpoint}
                  currentDebugLine={isDebugMode ? debugFrames[activeFrameIndex]?.line : undefined}
                  fontSize={fontSize} 
                  fontFamily={fontFamily}
                  onFontFamilyChange={setFontFamily}
                  isDarkMode={isDarkMode}
                  theme={editorTheme}
                  onFormat={handleFormat}
                  isFormatting={isFormatting}
                />
              ) : (
                <div className={`flex-1 flex flex-col items-center justify-center p-8 text-center ${isDarkMode ? 'bg-[#020617]' : 'bg-slate-50'}`}>
                  <div className="relative mb-8"><div className="absolute inset-0 bg-blue-500/10 blur-3xl scale-150"></div><DevioLogo size={120} className="relative z-10 animate-pulse duration-[4000ms]" /></div>
                  <h1 className="text-4xl font-black mb-2 tracking-tight">devio</h1>
                  <p className={`text-sm mb-8 max-w-xs ${isDarkMode ? 'text-slate-500' : 'text-slate-400'}`}>The ultimate playground for developers. Select a file from the explorer or create a new one to get started.</p>
                  <button onClick={() => handleFileAdd('main.py', Language.PYTHON)} className="bg-blue-600 hover:bg-blue-500 text-white px-8 py-3 rounded-2xl font-bold transition-all flex items-center gap-2"><Plus size={20} />Create New File</button>
                </div>
              )}
            </div>
            <Terminal history={terminalHistory} onCommand={handleTerminalCommand} isDarkMode={isDarkMode} isRunning={isRunning || isAIAnalyzing || isFormatting} isWaitingForStdin={isWaitingForStdin} onClear={() => setTerminalHistory([])} height={terminalHeight} setHeight={setTerminalHeight} fontFamily={fontFamily} />
          </div>
        </div>
      </div>
    </div>
  );
};

export default App;
