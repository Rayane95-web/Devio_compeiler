
import React, { useRef, useEffect, useState, useMemo, forwardRef, useImperativeHandle } from 'react';
import { Language } from '../types';
import { LANGUAGE_KEYWORDS } from '../constants';
import { Box, Code, Cpu, Search, X, ChevronDown, ChevronUp, Replace, ReplaceAll, Wand2, RefreshCw, Type } from 'lucide-react';

export const EDITOR_THEMES = [
  { id: 'okaidia', name: 'Monokai (Okaidia)', url: 'https://cdnjs.cloudflare.com/ajax/libs/prism/1.29.0/themes/prism-okaidia.min.css', type: 'dark' },
  { id: 'tomorrow', name: 'Tomorrow Night', url: 'https://cdnjs.cloudflare.com/ajax/libs/prism/1.29.0/themes/prism-tomorrow.min.css', type: 'dark' },
  { id: 'twilight', name: 'Twilight', url: 'https://cdnjs.cloudflare.com/ajax/libs/prism/1.29.0/themes/prism-twilight.min.css', type: 'dark' },
  { id: 'solarizedlight', name: 'Solarized Light', url: 'https://cdnjs.cloudflare.com/ajax/libs/prism/1.29.0/themes/prism-solarizedlight.min.css', type: 'light' },
  { id: 'prism', name: 'Prism Classic', url: 'https://cdnjs.cloudflare.com/ajax/libs/prism/1.29.0/themes/prism.min.css', type: 'light' },
  { id: 'funky', name: 'Funky', url: 'https://cdnjs.cloudflare.com/ajax/libs/prism/1.29.0/themes/prism-funky.min.css', type: 'dark' }
];

export const FONT_FAMILIES = [
  { id: "'Fira Code'", name: 'Fira Code' },
  { id: "'JetBrains Mono'", name: 'JetBrains Mono' },
  { id: "'Roboto Mono'", name: 'Roboto Mono' },
  { id: "'Source Code Pro'", name: 'Source Code Pro' },
  { id: "'Space Mono'", name: 'Space Mono' },
  { id: 'monospace', name: 'System Mono' }
];

interface EditorProps {
  code: string;
  language: Language;
  onChange: (value: string) => void;
  breakpoints: number[];
  toggleBreakpoint: (line: number) => void;
  currentDebugLine?: number;
  fontSize?: number;
  fontFamily?: string;
  onFontFamilyChange?: (font: string) => void;
  isDarkMode?: boolean;
  theme?: string;
  onFormat?: () => void;
  isFormatting?: boolean;
}

export interface EditorHandle {
  toggleFind: () => void;
}

interface Suggestion {
  text: string;
  type: 'keyword' | 'variable' | 'function';
}

const Editor = forwardRef<EditorHandle, EditorProps>(({ 
  code, 
  language,
  onChange, 
  breakpoints,
  toggleBreakpoint,
  currentDebugLine,
  fontSize = 14,
  fontFamily = "'Fira Code'",
  onFontFamilyChange,
  isDarkMode = true,
  theme = 'okaidia',
  onFormat,
  isFormatting = false
}, ref) => {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const preRef = useRef<HTMLPreElement>(null);
  const codeRef = useRef<HTMLElement>(null);
  const lineNumbersRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Auto-completion state
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [activeIndex, setActiveIndex] = useState(0);
  const [suggestionPos, setSuggestionPos] = useState({ top: 0, left: 0 });
  
  // Find and Replace state
  const [isFindOpen, setIsFindOpen] = useState(false);
  const [findText, setFindText] = useState('');
  const [replaceText, setReplaceText] = useState('');
  const [searchIndex, setSearchIndex] = useState(-1);
  const [searchResults, setSearchResults] = useState<number[]>([]);

  useImperativeHandle(ref, () => ({
    toggleFind: () => {
      setIsFindOpen(prev => !prev);
      if (!isFindOpen) {
        const selection = textareaRef.current ? 
          code.substring(textareaRef.current.selectionStart, textareaRef.current.selectionEnd) : '';
        if (selection && selection.length < 100) setFindText(selection);
        setTimeout(() => document.getElementById('find-input')?.focus(), 10);
      }
    }
  }));

  // Update global Prism theme stylesheet
  useEffect(() => {
    const themeObj = EDITOR_THEMES.find(t => t.id === theme) || EDITOR_THEMES[0];
    const linkTag = document.getElementById('prism-theme') as HTMLLinkElement;
    if (linkTag && linkTag.href !== themeObj.url) {
      linkTag.href = themeObj.url;
    }
  }, [theme]);

  // Re-highlight when code, language, theme, or mode changes
  useEffect(() => {
    const prism = (window as any).Prism;
    if (prism && codeRef.current) {
      prism.highlightElement(codeRef.current);
    }
  }, [code, language, isDarkMode, theme]);

  // Search logic
  useEffect(() => {
    if (!findText) {
      setSearchResults([]);
      setSearchIndex(-1);
      return;
    }
    const results: number[] = [];
    let pos = code.indexOf(findText);
    while (pos !== -1) {
      results.push(pos);
      pos = code.indexOf(findText, pos + 1);
    }
    setSearchResults(results);
    if (results.length > 0) {
      if (searchIndex === -1 || searchIndex >= results.length) setSearchIndex(0);
    } else {
      setSearchIndex(-1);
    }
  }, [findText, code]);

  const findNext = () => {
    if (searchResults.length === 0) return;
    const nextIdx = (searchIndex + 1) % searchResults.length;
    setSearchIndex(nextIdx);
    scrollToOccurrence(searchResults[nextIdx]);
  };

  const findPrev = () => {
    if (searchResults.length === 0) return;
    const nextIdx = (searchIndex - 1 + searchResults.length) % searchResults.length;
    setSearchIndex(nextIdx);
    scrollToOccurrence(searchResults[nextIdx]);
  };

  const scrollToOccurrence = (pos: number) => {
    if (textareaRef.current) {
      textareaRef.current.focus();
      textareaRef.current.setSelectionRange(pos, pos + findText.length);
      const textarea = textareaRef.current;
      const textBefore = textarea.value.substring(0, pos);
      const linesBefore = textBefore.split('\n');
      const lineHeightValue = fontSize * 1.5;
      const top = (linesBefore.length - 1) * lineHeightValue;
      textarea.scrollTo({ top: top - textarea.offsetHeight / 2, behavior: 'smooth' });
    }
  };

  const handleReplace = () => {
    if (searchIndex === -1 || searchResults.length === 0) return;
    const pos = searchResults[searchIndex];
    const newCode = code.substring(0, pos) + replaceText + code.substring(pos + findText.length);
    onChange(newCode);
    setTimeout(() => {
      textareaRef.current?.focus();
      textareaRef.current?.setSelectionRange(pos, pos + replaceText.length);
    }, 10);
  };

  const handleReplaceAll = () => {
    if (!findText) return;
    const newCode = code.split(findText).join(replaceText);
    onChange(newCode);
    setIsFindOpen(false);
  };

  const localIdentifiers = useMemo(() => {
    const words = code.match(/[a-zA-Z_]\w*/g) || [];
    return Array.from(new Set(words));
  }, [code]);

  const handleScroll = (e: React.UIEvent<HTMLTextAreaElement>) => {
    if (lineNumbersRef.current) lineNumbersRef.current.scrollTop = e.currentTarget.scrollTop;
    if (preRef.current) {
      preRef.current.scrollTop = e.currentTarget.scrollTop;
      preRef.current.scrollLeft = e.currentTarget.scrollLeft;
    }
    if (suggestions.length > 0) setSuggestions([]);
  };

  const getCaretCoordinates = () => {
    const textarea = textareaRef.current;
    if (!textarea) return { top: 0, left: 0 };
    const { selectionStart } = textarea;
    const textBeforeCaret = textarea.value.substring(0, selectionStart);
    const linesBeforeCaret = textBeforeCaret.split('\n');
    const currentLineNumber = linesBeforeCaret.length;
    const currentColumn = linesBeforeCaret[linesBeforeCaret.length - 1].length;
    const lineHeight = fontSize * 1.5;
    const charWidth = fontSize * 0.6;
    const top = (currentLineNumber - 1) * lineHeight - textarea.scrollTop + 24;
    const left = currentColumn * charWidth - textarea.scrollLeft + 48;
    return { top, left };
  };

  const updateSuggestions = (text: string, cursor: number) => {
    const textBeforeCursor = text.substring(0, cursor);
    const match = textBeforeCursor.match(/[a-zA-Z_]\w*$/);
    if (!match || match[0].length < 1) {
      setSuggestions([]);
      return;
    }
    const prefix = match[0].toLowerCase();
    const keywords = LANGUAGE_KEYWORDS[language] || [];
    const keywordSuggestions: Suggestion[] = keywords
      .filter(k => k.toLowerCase().startsWith(prefix) && k !== match[0])
      .map(k => ({ text: k, type: 'keyword' }));
    const localSuggestions: Suggestion[] = localIdentifiers
      .filter(id => id.toLowerCase().startsWith(prefix) && id !== match[0])
      .map(id => ({ text: id, type: 'variable' }));
    const combined = [...keywordSuggestions, ...localSuggestions];
    const unique = Array.from(new Map(combined.map(s => [s.text, s])).values()).slice(0, 10);
    setSuggestions(unique);
    setActiveIndex(0);
    setSuggestionPos(getCaretCoordinates());
  };

  const applySuggestion = (suggestion: string) => {
    const textarea = textareaRef.current;
    if (!textarea) return;
    const { selectionStart } = textarea;
    const textBeforeCursor = code.substring(0, selectionStart);
    const textAfterCursor = code.substring(selectionStart);
    const prefixMatch = textBeforeCursor.match(/[a-zA-Z_]\w*$/);
    if (!prefixMatch) return;
    const newTextBefore = textBeforeCursor.substring(0, prefixMatch.index) + suggestion;
    onChange(newTextBefore + textAfterCursor);
    setSuggestions([]);
    setTimeout(() => {
      if (textareaRef.current) {
        textareaRef.current.selectionStart = textareaRef.current.selectionEnd = newTextBefore.length;
        textareaRef.current.focus();
      }
    }, 0);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if ((e.ctrlKey || e.metaKey) && e.key === 'f') {
      e.preventDefault();
      setIsFindOpen(true);
      const selection = code.substring(e.currentTarget.selectionStart, e.currentTarget.selectionEnd);
      if (selection && selection.length < 100) setFindText(selection);
      setTimeout(() => document.getElementById('find-input')?.focus(), 10);
      return;
    }
    if (e.key === 'Escape' && isFindOpen) {
      setIsFindOpen(false);
      textareaRef.current?.focus();
      return;
    }
    if (suggestions.length > 0) {
      if (e.key === 'ArrowDown') { e.preventDefault(); setActiveIndex(prev => (prev + 1) % suggestions.length); return; }
      if (e.key === 'ArrowUp') { e.preventDefault(); setActiveIndex(prev => (prev - 1 + suggestions.length) % suggestions.length); return; }
      if (e.key === 'Enter' || e.key === 'Tab') { e.preventDefault(); applySuggestion(suggestions[activeIndex].text); return; }
      if (e.key === 'Escape') { setSuggestions([]); return; }
    }
    if (e.key === 'Tab') {
      e.preventDefault();
      const { selectionStart, selectionEnd, value } = e.currentTarget;
      const newValue = value.substring(0, selectionStart) + '    ' + value.substring(selectionEnd);
      onChange(newValue);
      requestAnimationFrame(() => {
        if (textareaRef.current) textareaRef.current.selectionStart = textareaRef.current.selectionEnd = selectionStart + 4;
      });
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newCode = e.target.value;
    onChange(newCode);
    updateSuggestions(newCode, e.target.selectionStart);
  };

  const lines = code.split('\n');
  const lineHeightValue = 1.5;
  const lineHeightPx = fontSize * lineHeightValue;

  const editorStyles: React.CSSProperties = {
    fontSize: `${fontSize}px`,
    lineHeight: `${lineHeightValue}`,
    fontFamily: `${fontFamily}, monospace`,
    padding: '1.5rem',
    tabSize: 4,
    whiteSpace: 'pre',
    wordWrap: 'normal',
    boxSizing: 'border-box',
    border: 'none',
    outline: 'none',
    margin: 0,
    overflow: 'auto',
    fontVariantLigatures: 'none',
    letterSpacing: 'normal',
  };

  const prismLang = language === Language.CPP ? 'cpp' : language;

  return (
    <div ref={containerRef} className={`flex flex-1 overflow-hidden font-mono relative ${isDarkMode ? 'bg-[#020617]' : 'bg-white'}`}>
      
      {/* Editor Floating Actions */}
      <div className="absolute top-4 right-6 z-[100] flex items-center gap-2">
        {onFontFamilyChange && (
          <div className={`flex items-center gap-1.5 px-2 py-1 rounded-lg border backdrop-blur-md shadow-xl transition-all ${
            isDarkMode ? 'bg-slate-800/80 border-slate-700 text-slate-400' : 'bg-white/80 border-slate-200 text-slate-500'
          }`}>
            <Type size={12} className="shrink-0" />
            <select 
              value={fontFamily} 
              onChange={(e) => onFontFamilyChange(e.target.value)}
              className="bg-transparent text-[10px] font-bold uppercase tracking-wider outline-none cursor-pointer pr-1"
            >
              {FONT_FAMILIES.map(font => (
                <option key={font.id} value={font.id} style={{ fontFamily: font.id }}>{font.name}</option>
              ))}
            </select>
          </div>
        )}

        {onFormat && (
          <button 
            onClick={onFormat} 
            disabled={isFormatting}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border text-[10px] font-bold uppercase tracking-wider backdrop-blur-md transition-all active:scale-95 shadow-xl ${
              isDarkMode 
                ? 'bg-slate-800/80 border-slate-700 text-blue-400 hover:bg-slate-700 hover:text-blue-300' 
                : 'bg-white/80 border-slate-200 text-blue-600 hover:bg-slate-50 hover:text-blue-500'
            }`}
          >
            {isFormatting ? <RefreshCw size={12} className="animate-spin" /> : <Wand2 size={12} />}
            Format Code
          </button>
        )}
      </div>

      {/* Find Widget */}
      {isFindOpen && (
        <div className={`absolute top-14 right-6 z-[150] w-80 p-3 rounded-xl shadow-2xl border backdrop-blur-xl animate-in fade-in slide-in-from-top-4 duration-200 ${
          isDarkMode ? 'bg-slate-900/90 border-slate-700 text-slate-200' : 'bg-white/90 border-slate-200 text-slate-900'
        }`}>
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
               <Search size={14} className="text-blue-500" />
               <span className="text-[10px] font-bold uppercase tracking-wider opacity-60">Find & Replace</span>
            </div>
            <button onClick={() => setIsFindOpen(false)} className="p-1 hover:bg-slate-500/10 rounded-full transition-colors"><X size={14}/></button>
          </div>
          <div className="space-y-2">
            <div className="relative group">
              <input id="find-input" type="text" value={findText} onChange={(e) => setFindText(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') e.shiftKey ? findPrev() : findNext(); }} placeholder="Find"
                className={`w-full px-3 py-1.5 text-xs rounded-lg border outline-none transition-all ${isDarkMode ? 'bg-slate-950 border-slate-800 focus:border-blue-500' : 'bg-slate-50 border-slate-200 focus:border-blue-500'}`} />
              <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
                <span className="text-[9px] opacity-40 mr-1">{searchResults.length > 0 ? `${searchIndex + 1}/${searchResults.length}` : '0/0'}</span>
                <button onClick={findPrev} className="p-0.5 hover:bg-slate-500/20 rounded"><ChevronUp size={12}/></button>
                <button onClick={findNext} className="p-0.5 hover:bg-slate-500/20 rounded"><ChevronDown size={12}/></button>
              </div>
            </div>
            <div className="relative group">
              <input type="text" value={replaceText} onChange={(e) => setReplaceText(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleReplace()} placeholder="Replace"
                className={`w-full px-3 py-1.5 text-xs rounded-lg border outline-none transition-all ${isDarkMode ? 'bg-slate-950 border-slate-800 focus:border-blue-500' : 'bg-slate-50 border-slate-200 focus:border-blue-500'}`} />
              <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
                <button onClick={handleReplace} title="Replace current" className="p-0.5 hover:bg-slate-500/20 rounded text-blue-500"><Replace size={12}/></button>
                <button onClick={handleReplaceAll} title="Replace all" className="p-0.5 hover:bg-slate-500/20 rounded text-blue-500"><ReplaceAll size={12}/></button>
              </div>
            </div>
          </div>
        </div>
      )}

      <div ref={lineNumbersRef} className={`w-12 shrink-0 overflow-hidden text-right select-none border-r transition-colors duration-300 ${isDarkMode ? 'bg-[#0f172a] border-slate-800 text-slate-600' : 'bg-slate-50 border-slate-200 text-slate-400'}`}
        style={{ fontSize: `${fontSize * 0.9}px`, lineHeight: `${lineHeightPx}px`, fontFamily: `${fontFamily}, monospace`, paddingTop: '1.5rem' }}>
        {lines.map((_, i) => {
          const lineNum = i + 1;
          const hasBreakpoint = breakpoints.includes(lineNum);
          const isDebugging = currentDebugLine === lineNum;
          return (
            <div key={i} className={`pr-3 leading-relaxed h-[1.5em] relative cursor-pointer group flex items-center justify-end ${isDebugging ? 'bg-yellow-500/20' : ''}`} onClick={() => toggleBreakpoint(lineNum)}>
              <div className={`absolute left-1 w-2 h-2 rounded-full transition-all ${hasBreakpoint ? 'bg-red-500 scale-100' : 'bg-red-500/0 group-hover:bg-red-500/30 scale-50'}`} />
              {lineNum}
            </div>
          );
        })}
      </div>

      <div className="relative flex-1 overflow-hidden" onClick={() => textareaRef.current?.focus()}>
        {currentDebugLine && (
          <div className="absolute left-0 w-full pointer-events-none bg-yellow-500/10 border-y border-yellow-500/30 z-0"
            style={{ top: `${(currentDebugLine - 1) * lineHeightPx + 24}px`, height: `${lineHeightPx}px` }} />
        )}
        <pre ref={preRef} className={`absolute inset-0 pointer-events-none language-${prismLang} custom-scrollbar z-1`} style={{ ...editorStyles, background: 'transparent' }} aria-hidden="true">
          <code ref={codeRef} className={`language-${prismLang}`} style={{ fontFamily: 'inherit' }}>{code}</code>
        </pre>
        <textarea ref={textareaRef} value={code} onChange={handleChange} onScroll={handleScroll} onKeyDown={handleKeyDown} onBlur={() => setTimeout(() => setSuggestions([]), 200)}
          spellCheck={false} autoCapitalize="off" autoCorrect="off" autoComplete="off" className={`absolute inset-0 bg-transparent resize-none overflow-auto custom-scrollbar transition-none ${isDarkMode ? 'caret-white' : 'caret-black'}`}
          style={{ ...editorStyles, color: isDarkMode ? 'rgba(255,255,255,0.01)' : 'rgba(0,0,0,0.01)', WebkitTextFillColor: 'transparent', zIndex: 10 }} />

        {suggestions.length > 0 && (
          <div className={`absolute z-[200] w-64 border rounded-xl shadow-2xl overflow-hidden backdrop-blur-xl animate-in fade-in zoom-in duration-100 ${isDarkMode ? 'bg-slate-900/95 border-slate-700' : 'bg-white/95 border-slate-200'}`}
            style={{ top: suggestionPos.top + fontSize + 4, left: Math.min(suggestionPos.left, (containerRef.current?.offsetWidth || 0) - 270) }}>
            {suggestions.map((s, i) => (
              <div key={s.text} onClick={() => applySuggestion(s.text)} onMouseEnter={() => setActiveIndex(i)} className={`flex items-center justify-between px-3 py-1.5 cursor-pointer transition-colors ${i === activeIndex ? 'bg-blue-600 text-white' : isDarkMode ? 'text-slate-300 hover:bg-slate-800' : 'text-slate-700 hover:bg-slate-100'}`}>
                <div className="flex items-center gap-2">
                  {s.type === 'keyword' && <Box size={14} className={i === activeIndex ? 'text-white' : 'text-purple-400'} />}
                  {s.type === 'variable' && <Cpu size={14} className={i === activeIndex ? 'text-white' : 'text-blue-400'} />}
                  {s.type === 'function' && <Code size={14} className={i === activeIndex ? 'text-white' : 'text-emerald-400'} />}
                  <span className="text-xs font-medium">{s.text}</span>
                </div>
                {i === activeIndex && <span className="text-[10px] opacity-70">Tab</span>}
                <span className={`text-[9px] uppercase font-bold px-1 rounded ${i === activeIndex ? 'bg-white/20' : isDarkMode ? 'bg-slate-800 text-slate-500' : 'bg-slate-200 text-slate-500'}`}>{s.type}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
});

export default Editor;
