
import React, { useRef, useEffect, useState } from 'react';
import { Terminal as TerminalIcon, ChevronUp, ChevronDown, Trash2, Keyboard } from 'lucide-react';
import { TerminalLine } from '../types';

interface TerminalProps {
  history: TerminalLine[];
  onCommand: (command: string) => void;
  isDarkMode: boolean;
  isRunning: boolean;
  isWaitingForStdin?: boolean;
  onClear: () => void;
  height: number;
  setHeight: (h: number) => void;
  fontFamily?: string;
}

const Terminal: React.FC<TerminalProps> = ({
  history,
  onCommand,
  isDarkMode,
  isRunning,
  isWaitingForStdin = false,
  onClear,
  height,
  setHeight,
  fontFamily = "'Fira Code'"
}) => {
  const [input, setInput] = useState('');
  const [cmdHistory, setCmdHistory] = useState<string[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const [tempInput, setTempInput] = useState('');

  const scrollRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [history, isRunning, isWaitingForStdin, input]);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  }, [input]);

  const handleSubmit = () => {
    if (input.trim() || input === '') {
      const command = input.trim();
      if (command && !isWaitingForStdin) {
        setCmdHistory(prev => [command, ...prev.filter(c => c !== command)].slice(0, 50));
      }
      onCommand(input);
      setInput('');
      setHistoryIndex(-1);
      setTempInput('');
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    } else if (e.key === 'ArrowUp' && !isWaitingForStdin) {
      if (historyIndex < cmdHistory.length - 1) {
        e.preventDefault();
        const nextIdx = historyIndex + 1;
        if (historyIndex === -1) setTempInput(input);
        setHistoryIndex(nextIdx);
        setInput(cmdHistory[nextIdx]);
      }
    } else if (e.key === 'ArrowDown' && !isWaitingForStdin) {
      if (historyIndex > -1) {
        e.preventDefault();
        const nextIdx = historyIndex - 1;
        setHistoryIndex(nextIdx);
        setInput(nextIdx === -1 ? tempInput : cmdHistory[nextIdx]);
      }
    }
  };

  const focusInput = () => {
    textareaRef.current?.focus();
  };

  return (
    <div 
      className={`border-t flex flex-col transition-colors duration-300 ${
        isDarkMode ? 'border-slate-800 bg-[#0f172a]' : 'border-slate-200 bg-white'
      }`}
      style={{ height: `${height}px` }}
      onClick={focusInput}
    >
      <div className={`flex items-center justify-between px-4 py-1.5 border-b shrink-0 ${
        isDarkMode ? 'bg-slate-900 border-slate-800' : 'bg-slate-50 border-slate-200'
      }`}>
        <div className="flex items-center gap-2 text-xs font-bold text-slate-500 uppercase tracking-wider">
          <TerminalIcon size={14} />
          Terminal
          {isWaitingForStdin && (
            <span className="flex items-center gap-1 ml-4 text-emerald-500 normal-case font-medium animate-pulse">
              <Keyboard size={12} />
              Waiting for input
            </span>
          )}
        </div>
        <div className="flex items-center gap-1">
          <button 
            onClick={(e) => { e.stopPropagation(); setHeight(height <= 40 ? 250 : 40); }} 
            className="p-1 text-slate-500 hover:text-blue-500 transition-colors"
          >
            {height <= 40 ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
          </button>
        </div>
      </div>

      <div 
        ref={scrollRef}
        className={`flex-1 overflow-auto p-3 text-sm custom-scrollbar ${
          isDarkMode ? 'text-slate-300' : 'text-slate-700'
        }`}
        style={{ fontFamily: `${fontFamily}, monospace` }}
      >
        <div className="space-y-1">
          {history.map((line, i) => (
            <div key={i} className="whitespace-pre-wrap break-all leading-relaxed">
              {line.type === 'input' && (
                <div className="flex gap-2">
                  <span className="text-emerald-500 font-bold shrink-0">➜</span>
                  <span className="text-blue-400 font-bold shrink-0">~</span>
                  <span className={isDarkMode ? 'text-white' : 'text-slate-900'}>{line.text}</span>
                </div>
              )}
              {line.type === 'output' && (
                <div className={isDarkMode ? 'text-slate-300' : 'text-slate-600'}>{line.text}</div>
              )}
              {line.type === 'error' && (
                <div className="text-red-500 dark:text-red-400">{line.text}</div>
              )}
              {line.type === 'system' && (
                <div className="text-slate-500 italic text-xs">{line.text}</div>
              )}
            </div>
          ))}
          
          {isRunning && !isWaitingForStdin && (
            <div className="flex items-center gap-2 text-slate-500 italic animate-pulse">
              <div className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-bounce" />
              Running process...
            </div>
          )}

          {(!isRunning || isWaitingForStdin) && height > 40 && (
            <div className="flex gap-2 items-start group mt-1">
              <div className="flex gap-2 shrink-0 pt-0.5">
                {isWaitingForStdin ? (
                  <span className="text-yellow-500 font-bold whitespace-nowrap">Stdin: </span>
                ) : (
                  <>
                    <span className="text-emerald-500 font-bold">➜</span>
                    <span className="text-blue-400 font-bold">~</span>
                  </>
                )}
              </div>
              <textarea
                ref={textareaRef}
                rows={1}
                autoFocus
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder={isWaitingForStdin ? "Type program input..." : ""}
                className={`flex-1 bg-transparent border-none outline-none p-0 m-0 resize-none overflow-hidden ${
                  isDarkMode ? 'text-white' : 'text-slate-900'
                } ${isWaitingForStdin ? 'placeholder:text-slate-600' : ''}`}
                style={{ fontFamily: 'inherit' }}
                spellCheck={false}
                autoComplete="off"
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Terminal;
