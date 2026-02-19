
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { History, Trash2, X, Calculator } from 'lucide-react';
import { HistoryItem } from './types';

const App: React.FC = () => {
  const [display, setDisplay] = useState('0');
  const [expression, setExpression] = useState('');
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [showHistory, setShowHistory] = useState(false);

  const historyEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const savedHistory = localStorage.getItem('calc_history');
    if (savedHistory) {
      try {
        setHistory(JSON.parse(savedHistory));
      } catch (e) {
        console.error("Erro ao carregar histórico", e);
      }
    }
  }, []);

  useEffect(() => {
    localStorage.setItem('calc_history', JSON.stringify(history));
    if (showHistory) {
      historyEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [history, showHistory]);

  const handleClear = useCallback(() => {
    setDisplay('0');
    setExpression('');
  }, []);

  const handleDigit = useCallback((digit: string) => {
    setDisplay(prev => (prev === '0' || prev === 'Erro' ? digit : prev + digit));
  }, []);

  const handleOperator = useCallback((op: string) => {
    setExpression(prev => display + ' ' + op + ' ');
    setDisplay('0');
  }, [display]);

  const calculate = useCallback(() => {
    try {
      const fullExpression = expression + display;
      const sanitized = fullExpression.replace(/[^-+*/.0-9 ]/g, '');
      if (!sanitized) return null;
      
      // eslint-disable-next-line no-eval
      const resultValue = eval(sanitized); 
      const result = Number.isFinite(resultValue) ? resultValue.toString() : 'Erro';
      
      const newHistory: HistoryItem = {
        id: Date.now().toString(),
        expression: fullExpression,
        result: result,
        timestamp: new Date()
      };

      setHistory(prev => [newHistory, ...prev].slice(0, 50));
      setDisplay(result);
      setExpression('');
      return { fullExpression, result };
    } catch (error) {
      setDisplay('Erro');
      setTimeout(() => setDisplay('0'), 1500);
      return null;
    }
  }, [display, expression]);

  const handleEquals = useCallback(() => {
    if (expression === '') return;
    calculate();
  }, [expression, calculate]);

  const handlePercentage = useCallback(() => {
    setDisplay(prev => (parseFloat(prev) / 100).toString());
  }, []);

  const handleSign = useCallback(() => {
    setDisplay(prev => (prev.startsWith('-') ? prev.slice(1) : '-' + prev));
  }, []);

  const deleteLast = useCallback(() => {
    setDisplay(prev => (prev.length > 1 ? prev.slice(0, -1) : '0'));
  }, []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (document.activeElement?.tagName === 'INPUT' || document.activeElement?.tagName === 'TEXTAREA') return;
      
      if (/[0-9]/.test(e.key)) handleDigit(e.key);
      if (['+', '-', '*', '/'].includes(e.key)) handleOperator(e.key);
      if (e.key === 'Enter' || e.key === '=') handleEquals();
      if (e.key === 'Backspace') deleteLast();
      if (e.key === 'Escape' || e.key === 'c' || e.key === 'C') handleClear();
      if (e.key === '.') handleDigit('.');
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleDigit, handleOperator, handleEquals, deleteLast, handleClear]);

  return (
    <div className="min-h-screen bg-[#1a0b12] text-rose-50 flex flex-col items-center justify-center p-4">
      
      {/* Calculadora Principal */}
      <div className="relative w-full max-w-[400px] aspect-[1/1.6] bg-[#2d121e] border border-rose-800/40 rounded-[2.5rem] shadow-2xl flex flex-col overflow-hidden">
        
        <div className="p-8 pt-14 flex flex-col items-end justify-end h-1/3">
          <div className="text-pink-400/50 mono text-lg mb-1 h-8 truncate max-w-full">
            {expression}
          </div>
          <div className="text-6xl font-extralight mono text-white overflow-hidden text-right w-full tracking-tighter">
            {display}
          </div>
        </div>

        <div className="grid grid-cols-4 gap-3 p-6 flex-1 bg-rose-900/10 backdrop-blur-md">
          <CalcButton label="AC" onClick={handleClear} variant="functional" />
          <CalcButton label="+/-" onClick={handleSign} variant="functional" />
          <CalcButton label="%" onClick={handlePercentage} variant="functional" />
          <CalcButton label="÷" onClick={() => handleOperator('/')} variant="operator" />
          
          <CalcButton label="7" onClick={() => handleDigit('7')} />
          <CalcButton label="8" onClick={() => handleDigit('8')} />
          <CalcButton label="9" onClick={() => handleDigit('9')} />
          <CalcButton label="×" onClick={() => handleOperator('*')} variant="operator" />
          
          <CalcButton label="4" onClick={() => handleDigit('4')} />
          <CalcButton label="5" onClick={() => handleDigit('5')} />
          <CalcButton label="6" onClick={() => handleDigit('6')} />
          <CalcButton label="-" onClick={() => handleOperator('-')} variant="operator" />
          
          <CalcButton label="1" onClick={() => handleDigit('1')} />
          <CalcButton label="2" onClick={() => handleDigit('2')} />
          <CalcButton label="3" onClick={() => handleDigit('3')} />
          <CalcButton label="+" onClick={() => handleOperator('+')} variant="operator" />
          
          <CalcButton label="0" onClick={() => handleDigit('0')} className="col-span-2" />
          <CalcButton label="." onClick={() => handleDigit('.')} />
          <CalcButton label="=" onClick={handleEquals} variant="equals" />
        </div>

        <button 
          onClick={() => setShowHistory(!showHistory)}
          className="absolute top-6 right-6 p-2 rounded-full bg-rose-800/30 hover:bg-rose-700/50 text-rose-300 transition-colors z-30"
          aria-label="Ver Histórico"
        >
          <History size={20} />
        </button>
        
        {showHistory && (
          <div className="absolute inset-0 bg-rose-950/98 backdrop-blur-xl z-20 flex flex-col p-6 animate-in slide-in-from-right duration-300">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold flex items-center gap-2 text-rose-100">
                <History size={22} className="text-pink-400" /> Histórico
              </h3>
              <div className="flex gap-2">
                <button 
                  onClick={() => setHistory([])}
                  className="p-2 hover:bg-pink-500/20 text-pink-400 rounded-lg transition-colors"
                  title="Limpar tudo"
                >
                  <Trash2 size={20} />
                </button>
                <button 
                  onClick={() => setShowHistory(false)}
                  className="p-2 hover:bg-rose-800/40 rounded-lg transition-colors"
                >
                  <X size={20} />
                </button>
              </div>
            </div>
            
            <div className="flex-1 overflow-y-auto space-y-4 pr-2">
              {history.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-rose-700">
                  <Calculator size={48} className="mb-3 opacity-20" />
                  <p>Sem cálculos ainda</p>
                </div>
              ) : (
                history.map((item) => (
                  <div key={item.id} className="group p-4 bg-rose-900/30 border border-rose-800/40 rounded-2xl hover:border-pink-500/30 transition-all">
                    <div className="text-xs text-rose-400/60 mb-1 flex justify-between">
                      <span className="mono">{item.expression}</span>
                      <span>{new Date(item.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                    </div>
                    <div className="text-xl font-semibold mb-3 text-rose-50">
                      = {item.result}
                    </div>
                    <div className="flex gap-2">
                      <button 
                        onClick={() => { setDisplay(item.result); setShowHistory(false); }}
                        className="text-xs bg-rose-800/50 hover:bg-rose-700 px-4 py-2 rounded-lg transition-colors w-full"
                      >
                        Usar Resultado
                      </button>
                    </div>
                  </div>
                ))
              )}
              <div ref={historyEndRef} />
            </div>
          </div>
        )}
      </div>

      <div className="mt-8 text-center text-rose-600/40 text-xs uppercase tracking-widest font-bold">
        SmartCalc Pink Edition
      </div>
    </div>
  );
};

interface CalcButtonProps {
  label: string;
  onClick: () => void;
  variant?: 'number' | 'operator' | 'functional' | 'equals';
  className?: string;
}

const CalcButton: React.FC<CalcButtonProps> = ({ label, onClick, variant = 'number', className = '' }) => {
  const baseStyles = "h-full min-h-[64px] flex items-center justify-center text-2xl font-light rounded-2xl transition-all active:scale-95 select-none";
  
  const variants = {
    number: "bg-rose-800/20 hover:bg-rose-800/40 text-rose-50 border border-rose-700/20 backdrop-blur-sm",
    operator: "bg-pink-600/10 hover:bg-pink-600/20 text-pink-400 border border-pink-500/20",
    functional: "bg-rose-700/10 hover:bg-rose-700/20 text-rose-400 border border-rose-700/10",
    equals: "bg-gradient-to-br from-pink-500 to-rose-600 hover:from-pink-400 hover:to-rose-500 text-white shadow-lg shadow-pink-900/30 font-medium"
  };

  return (
    <button onClick={onClick} className={`${baseStyles} ${variants[variant]} ${className}`}>
      {label}
    </button>
  );
};

export default App;
