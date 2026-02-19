
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Calculator as CalcIcon, History, Sparkles, Trash2, X, ChevronRight, Calculator, HelpCircle } from 'lucide-react';
import { HistoryItem } from './types';
import { explainCalculation, solveWordProblem } from './services/geminiService';

const App: React.FC = () => {
  const [display, setDisplay] = useState('0');
  const [expression, setExpression] = useState('');
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [showHistory, setShowHistory] = useState(false);
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [aiResponse, setAiResponse] = useState<any>(null);
  const [showAiModal, setShowAiModal] = useState(false);
  const [wordProblem, setWordProblem] = useState('');

  // Refs for scroll and focus
  const historyEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const savedHistory = localStorage.getItem('calc_history');
    if (savedHistory) {
      setHistory(JSON.parse(savedHistory));
    }
  }, []);

  useEffect(() => {
    localStorage.setItem('calc_history', JSON.stringify(history));
    if (showHistory) {
      historyEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [history, showHistory]);

  const handleClear = () => {
    setDisplay('0');
    setExpression('');
  };

  const handleDigit = (digit: string) => {
    setDisplay(prev => (prev === '0' ? digit : prev + digit));
  };

  const handleOperator = (op: string) => {
    setExpression(prev => display + ' ' + op + ' ');
    setDisplay('0');
  };

  const calculate = useCallback(() => {
    try {
      const fullExpression = expression + display;
      // Using a safe evaluation for basic math (standard calculator logic)
      const sanitized = fullExpression.replace(/[^-+*/.0-9 ]/g, '');
      const result = eval(sanitized); 
      
      const newHistory: HistoryItem = {
        id: Date.now().toString(),
        expression: fullExpression,
        result: result.toString(),
        timestamp: new Date()
      };

      setHistory(prev => [newHistory, ...prev].slice(0, 50));
      setDisplay(result.toString());
      setExpression('');
      return { fullExpression, result: result.toString() };
    } catch (error) {
      setDisplay('Erro');
      setTimeout(() => setDisplay('0'), 1500);
      return null;
    }
  }, [display, expression]);

  const handleEquals = () => {
    if (expression === '') return;
    calculate();
  };

  const handlePercentage = () => {
    const val = parseFloat(display) / 100;
    setDisplay(val.toString());
  };

  const handleSign = () => {
    setDisplay(prev => (prev.startsWith('-') ? prev.slice(1) : '-' + prev));
  };

  const deleteLast = () => {
    setDisplay(prev => (prev.length > 1 ? prev.slice(0, -1) : '0'));
  };

  const handleAiExplain = async (item: HistoryItem) => {
    setIsAiLoading(true);
    setShowAiModal(true);
    setAiResponse(null);
    const res = await explainCalculation(item.expression, item.result);
    setAiResponse(res);
    setIsAiLoading(false);
  };

  const handleSolveWordProblem = async () => {
    if (!wordProblem.trim()) return;
    setIsAiLoading(true);
    setAiResponse(null);
    const res = await solveWordProblem(wordProblem);
    if (res) {
      setAiResponse({
        explanation: res.reasoning,
        steps: [`Expressão: ${res.expression}`, `Resultado Final: ${res.result}`]
      });
      setDisplay(res.result);
      setExpression(res.expression);
    }
    setIsAiLoading(false);
  };

  // Keyboard support
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
    <div className="min-h-screen bg-[#1a0b12] text-rose-50 flex flex-col md:flex-row items-center justify-center p-4 gap-6">
      
      {/* Left Sidebar: AI & Controls (Desktop) */}
      <div className="hidden lg:flex flex-col w-80 gap-4 h-[600px]">
        <div className="bg-rose-900/20 border border-rose-800/40 rounded-3xl p-6 flex-1 flex flex-col backdrop-blur-sm">
          <div className="flex items-center gap-2 mb-4 text-pink-400">
            <Sparkles size={20} />
            <h2 className="font-bold uppercase tracking-tight">Assistente Smart</h2>
          </div>
          <p className="text-sm text-rose-300/70 mb-4 leading-relaxed">
            Cole um problema de texto ou peça para a IA resolver situações complexas.
          </p>
          <textarea 
            className="flex-1 bg-rose-950/40 border border-rose-800/60 rounded-xl p-3 text-sm focus:outline-none focus:ring-2 focus:ring-pink-500/50 transition-all resize-none placeholder-rose-700/50"
            placeholder="Ex: Se eu tenho 15 maçãs e vendo 3 por 5 reais cada..."
            value={wordProblem}
            onChange={(e) => setWordProblem(e.target.value)}
          />
          <button 
            onClick={handleSolveWordProblem}
            disabled={isAiLoading || !wordProblem}
            className="mt-4 bg-pink-600 hover:bg-pink-500 disabled:opacity-50 disabled:cursor-not-allowed text-white py-3 px-4 rounded-xl font-medium transition-all flex items-center justify-center gap-2 shadow-lg shadow-pink-900/20"
          >
            {isAiLoading ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Sparkles size={18} />}
            Resolver com IA
          </button>
        </div>
      </div>

      {/* Main Calculator */}
      <div className="relative w-full max-w-[400px] aspect-[1/1.6] bg-[#2d121e] border border-rose-800/40 rounded-[2.5rem] shadow-2xl flex flex-col overflow-hidden">
        
        {/* Display Area */}
        <div className="p-8 pt-14 flex flex-col items-end justify-end h-1/3">
          <div className="text-pink-400/50 mono text-lg mb-1 h-8 truncate max-w-full">
            {expression}
          </div>
          <div className="text-6xl font-extralight mono text-white overflow-hidden text-right w-full tracking-tighter">
            {display}
          </div>
        </div>

        {/* Buttons Grid */}
        <div className="grid grid-cols-4 gap-3 p-6 flex-1 bg-rose-900/10 backdrop-blur-md">
          {/* Row 1 */}
          <CalcButton label="AC" onClick={handleClear} variant="functional" />
          <CalcButton label="+/-" onClick={handleSign} variant="functional" />
          <CalcButton label="%" onClick={handlePercentage} variant="functional" />
          <CalcButton label="÷" onClick={() => handleOperator('/')} variant="operator" />
          
          {/* Row 2 */}
          <CalcButton label="7" onClick={() => handleDigit('7')} />
          <CalcButton label="8" onClick={() => handleDigit('8')} />
          <CalcButton label="9" onClick={() => handleDigit('9')} />
          <CalcButton label="×" onClick={() => handleOperator('*')} variant="operator" />
          
          {/* Row 3 */}
          <CalcButton label="4" onClick={() => handleDigit('4')} />
          <CalcButton label="5" onClick={() => handleDigit('5')} />
          <CalcButton label="6" onClick={() => handleDigit('6')} />
          <CalcButton label="-" onClick={() => handleOperator('-')} variant="operator" />
          
          {/* Row 4 */}
          <CalcButton label="1" onClick={() => handleDigit('1')} />
          <CalcButton label="2" onClick={() => handleDigit('2')} />
          <CalcButton label="3" onClick={() => handleDigit('3')} />
          <CalcButton label="+" onClick={() => handleOperator('+')} variant="operator" />
          
          {/* Row 5 */}
          <CalcButton label="0" onClick={() => handleDigit('0')} className="col-span-2" />
          <CalcButton label="." onClick={() => handleDigit('.')} />
          <CalcButton label="=" onClick={handleEquals} variant="equals" />
        </div>

        {/* History Floating Button */}
        <button 
          onClick={() => setShowHistory(!showHistory)}
          className="absolute top-6 right-6 p-2 rounded-full bg-rose-800/30 hover:bg-rose-700/50 text-rose-300 transition-colors z-30"
        >
          <History size={20} />
        </button>
        
        {/* History Panel */}
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
                  <p>Nada por aqui ainda</p>
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
                        className="text-xs bg-rose-800/50 hover:bg-rose-700 px-3 py-1.5 rounded-lg transition-colors"
                      >
                        Usar
                      </button>
                      <button 
                        onClick={() => handleAiExplain(item)}
                        className="text-xs bg-pink-600/20 hover:bg-pink-600/30 text-pink-400 px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-colors"
                      >
                        <Sparkles size={14} /> Explicar IA
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

      {/* AI Explanation Modal */}
      {showAiModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-rose-950/80 backdrop-blur-md">
          <div className="bg-[#2d121e] border border-rose-800/40 w-full max-w-lg rounded-3xl overflow-hidden shadow-2xl animate-in zoom-in duration-200">
            <div className="p-6 border-b border-rose-800/40 flex items-center justify-between bg-rose-900/20">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-pink-600/20 flex items-center justify-center text-pink-500">
                  <Sparkles size={24} />
                </div>
                <div>
                  <h3 className="font-bold text-lg text-rose-50">Explicação da IA</h3>
                  <p className="text-xs text-rose-400/70">Mestra em Números</p>
                </div>
              </div>
              <button onClick={() => setShowAiModal(false)} className="p-2 hover:bg-rose-800/40 rounded-xl transition-colors">
                <X size={20} />
              </button>
            </div>
            
            <div className="p-6 max-h-[60vh] overflow-y-auto">
              {isAiLoading ? (
                <div className="py-12 flex flex-col items-center justify-center text-rose-400">
                  <div className="w-12 h-12 border-4 border-pink-500/20 border-t-pink-500 rounded-full animate-spin mb-4" />
                  <p className="animate-pulse">Pensando em uma explicação fofa...</p>
                </div>
              ) : aiResponse ? (
                <div className="space-y-6">
                  <div>
                    <h4 className="text-pink-400/50 text-xs font-bold uppercase tracking-wider mb-2">Conceito</h4>
                    <p className="text-rose-100 leading-relaxed text-sm">{aiResponse.explanation}</p>
                  </div>
                  <div>
                    <h4 className="text-pink-400/50 text-xs font-bold uppercase tracking-wider mb-3">Passo a Passo</h4>
                    <div className="space-y-3">
                      {aiResponse.steps.map((step: string, i: number) => (
                        <div key={i} className="flex gap-4 p-4 bg-rose-900/30 rounded-2xl border border-rose-800/20">
                          <span className="flex-shrink-0 w-7 h-7 rounded-lg bg-pink-600/20 text-pink-400 text-xs flex items-center justify-center font-bold">
                            {i + 1}
                          </span>
                          <p className="text-sm text-rose-200/90 leading-relaxed">{step}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-8 text-rose-400">
                  <HelpCircle className="mx-auto mb-2 opacity-30" size={40} />
                  <p>Algo deu errado no mundo dos números.</p>
                </div>
              )}
            </div>
            
            <div className="p-6 bg-rose-950/40 border-t border-rose-800/40">
              <button 
                onClick={() => setShowAiModal(false)}
                className="w-full bg-rose-800/50 hover:bg-rose-700/50 text-rose-100 py-3 rounded-xl font-medium transition-all"
              >
                Entendi, obrigada!
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Footer / Info (Mobile Only) */}
      <div className="lg:hidden mt-6 text-center text-rose-600/60 text-xs uppercase tracking-widest font-bold">
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
  const baseStyles = "h-full min-h-[64px] flex items-center justify-center text-2xl font-light rounded-2xl transition-all active:scale-90 select-none";
  
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
