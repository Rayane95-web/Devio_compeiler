
import React, { useRef, useEffect, useState, useMemo } from 'react';
import { Language } from '../types';
import { LANGUAGE_KEYWORDS } from '../constants';
import { Terminal, Box, Braces, Code, Cpu } from 'lucide-react';

export const EDITOR_THEMES = [
  { id: 'okaidia', name: 'Monokai (Okaidia)', url: 'https://cdnjs.cloudflare.com/ajax/libs/prism/1.29.0/themes/prism-okaidia.min.css', type: 'dark' },
  { id: 'tomorrow', name: 'Tomorrow Night', url: 'https://cdnjs.cloudflare.com/ajax/libs/prism/1.29.0/themes/prism-tomorrow.min.css', type: 'dark' },
  { id: 'twilight', name: 'Twilight', url: 'https://cdnjs.cloudflare.com/ajax/libs/prism/1.29.0/themes/prism-twilight.min.css', type: 'dark' },
  { id: 'solarizedlight', name: 'Solarized Light', url: 'https://cdnjs.cloudflare.com/ajax/libs/prism/1.29.0/themes/prism-solarizedlight.min.css', type: 'light' },
  { id: 'prism', name: 'Prism Classic', url: 'https://cdnjs.cloudflare.com/ajax/libs/prism/1.29.0/themes/prism.min.css', type: 'light' },
  { id: 'funky', name: 'Funky', url: 'https://cdnjs.cloudflare.com/ajax/libs/prism/1.29.0/themes/prism-funky.min.css', type: 'dark' }
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
  isDarkMode?: boolean;
  theme?: string;
}

interface Suggestion {
  text: string;
  type: 'keyword' | 'variable' | 'function';
}

const Editor: React.FC<EditorProps> = ({ 
  code, 
  language,
  onChange, 
  breakpoints,
  toggleBreakpoint,
  currentDebugLine,
  fontSize = 14,
  fontFamily = "'Fira Code'",
  isDarkMode = true,
  theme = 'okaidia'
}) => {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const preRef = useRef<HTMLPreElement>(null);
  const codeRef = useRef<HTMLElement>(null);
  const lineNumbersRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Auto-completion state
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [activeIndex, setActiveIndex] = useState(0);
  const [suggestionPos, setSuggestionPos] = useState({ top: 0, left: 0 });
  const [currentPrefix, setCurrentPrefix] = useState('');

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

  // Extract all identifiers from the code for local suggestions
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
    // Close suggestions on scroll to avoid misalignment
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
    const charWidth = fontSize * 0.6; // Approximation for mono fonts

    // Relative to the textarea content
    const top = (currentLineNumber - 1) * lineHeight - textarea.scrollTop + 24; // 24 for padding
    const left = currentColumn * charWidth - textarea.scrollLeft + 48; // 48 for line numbers width

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
    setCurrentPrefix(match[0]);

    const keywords = LANGUAGE_KEYWORDS[language] || [];
    
    const keywordSuggestions: Suggestion[] = keywords
      .filter(k => k.toLowerCase().startsWith(prefix) && k !== match[0])
      .map(k => ({ text: k, type: 'keyword' }));

    const localSuggestions: Suggestion[] = localIdentifiers
      .filter(id => id.toLowerCase().startsWith(prefix) && id !== match[0])
      .map(id => ({ text: id, type: 'variable' }));

    // Merge and deduplicate
    const combined = [...keywordSuggestions, ...localSuggestions];
    const unique = Array.from(new Map(combined.map(s => [s.text, s])).values())
      .slice(0, 10); // Limit to 10 results

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
    const newCode = newTextBefore + textAfterCursor;
    
    onChange(newCode);
    setSuggestions([]);

    // Set cursor to end of suggestion
    setTimeout(() => {
      if (textareaRef.current) {
        const newPos = newTextBefore.length;
        textareaRef.current.selectionStart = textareaRef.current.selectionEnd = newPos;
        textareaRef.current.focus();
      }
    }, 0);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (suggestions.length > 0) {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setActiveIndex(prev => (prev + 1) % suggestions.length);
        return;
      }
      if (e.key === 'ArrowUp') {
        e.preventDefault();
        setActiveIndex(prev => (prev - 1 + suggestions.length) % suggestions.length);
        return;
      }
      if (e.key === 'Enter' || e.key === 'Tab') {
        e.preventDefault();
        applySuggestion(suggestions[activeIndex].text);
        return;
      }
      if (e.key === 'Escape') {
        setSuggestions([]);
        return;
      }
    }

    if (e.key === 'Tab') {
      e.preventDefault();
      const { selectionStart, selectionEnd, value } = e.currentTarget;
      const newValue = value.substring(0, selectionStart) + '    ' + value.substring(selectionEnd);
      onChange(newValue);

      requestAnimationFrame(() => {
        if (textareaRef.current) {
          textareaRef.current.selectionStart = textareaRef.current.selectionEnd = selectionStart + 4;
        }
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
      <div 
        ref={lineNumbersRef}
        className={`w-12 shrink-0 overflow-hidden text-right select-none border-r transition-colors duration-300 ${
          isDarkMode ? 'bg-[#0f172a] border-slate-800 text-slate-600' : 'bg-slate-50 border-slate-200 text-slate-400'
        }`}
        style={{ 
          fontSize: `${fontSize * 0.9}px`, 
          lineHeight: `${lineHeightPx}px`,
          fontFamily: `${fontFamily}, monospace`,
          paddingTop: '1.5rem'
        }}
      >
        {lines.map((_, i) => {
          const lineNum = i + 1;
          const hasBreakpoint = breakpoints.includes(lineNum);
          const isDebugging = currentDebugLine === lineNum;
          return (
            <div 
              key={i} 
              className={`pr-3 leading-relaxed h-[1.5em] relative cursor-pointer group flex items-center justify-end ${isDebugging ? 'bg-yellow-500/20' : ''}`}
              onClick={() => toggleBreakpoint(lineNum)}
            >
              <div className={`absolute left-1 w-2 h-2 rounded-full transition-all ${
                hasBreakpoint ? 'bg-red-500 scale-100' : 'bg-red-500/0 group-hover:bg-red-500/30 scale-50'
              }`} />
              {lineNum}
            </div>
          );
        })}
      </div>

      <div className="relative flex-1 overflow-hidden" onClick={() => textareaRef.current?.focus()}>
        {/* Debug Line Highlight Layer */}
        {currentDebugLine && (
          <div 
            className="absolute left-0 w-full pointer-events-none bg-yellow-500/10 border-y border-yellow-500/30 z-0"
            style={{ 
              top: `${(currentDebugLine - 1) * lineHeightPx + 24}px`, 
              height: `${lineHeightPx}px` 
            }}
          />
        )}

        <pre
          ref={preRef}
          className={`absolute inset-0 pointer-events-none language-${prismLang} custom-scrollbar z-1`}
          style={{ ...editorStyles, background: 'transparent' }}
          aria-hidden="true"
        >
          <code ref={codeRef} className={`language-${prismLang}`} style={{ fontFamily: 'inherit' }}>{code}</code>
        </pre>

        <textarea
          ref={textareaRef}
          value={code}
          onChange={handleChange}
          onScroll={handleScroll}
          onKeyDown={handleKeyDown}
          onBlur={() => setTimeout(() => setSuggestions([]), 200)}
          spellCheck={false}
          autoCapitalize="off"
          autoCorrect="off"
          autoComplete="off"
          className={`absolute inset-0 bg-transparent resize-none overflow-auto custom-scrollbar transition-none ${isDarkMode ? 'caret-white' : 'caret-black'}`}
          style={{ 
            ...editorStyles, 
            color: isDarkMode ? 'rgba(255,255,255,0.01)' : 'rgba(0,0,0,0.01)',
            WebkitTextFillColor: 'transparent',
            zIndex: 10
          }}
        />

        {/* Floating Suggestions List */}
        {suggestions.length > 0 && (
          <div 
            className={`absolute z-[200] w-64 border rounded-xl shadow-2xl overflow-hidden backdrop-blur-xl animate-in fade-in zoom-in duration-100 ${
              isDarkMode ? 'bg-slate-900/95 border-slate-700' : 'bg-white/95 border-slate-200'
            }`}
            style={{ 
              top: suggestionPos.top + fontSize + 4, 
              left: Math.min(suggestionPos.left, (containerRef.current?.offsetWidth || 0) - 270)
            }}
          >
            {suggestions.map((s, i) => (
              <div
                key={s.text}
                onClick={() => applySuggestion(s.text)}
                onMouseEnter={() => setActiveIndex(i)}
                className={`flex items-center justify-between px-3 py-1.5 cursor-pointer transition-colors ${
                  i === activeIndex 
                    ? 'bg-blue-600 text-white' 
                    : isDarkMode ? 'text-slate-300 hover:bg-slate-800' : 'text-slate-700 hover:bg-slate-100'
                }`}
              >
                <div className="flex items-center gap-2">
                  {s.type === 'keyword' && <Box size={14} className={i === activeIndex ? 'text-white' : 'text-purple-400'} />}
                  {s.type === 'variable' && <Cpu size={14} className={i === activeIndex ? 'text-white' : 'text-blue-400'} />}
                  {s.type === 'function' && <Code size={14} className={i === activeIndex ? 'text-white' : 'text-emerald-400'} />}
                  <span className="text-xs font-medium">{s.text}</span>
                </div>
                {i === activeIndex && <span className="text-[10px] opacity-70">Tab</span>}
                <span className={`text-[9px] uppercase font-bold px-1 rounded ${
                  i === activeIndex ? 'bg-white/20' : isDarkMode ? 'bg-slate-800 text-slate-500' : 'bg-slate-200 text-slate-500'
                }`}>
                  {s.type}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Editor;
