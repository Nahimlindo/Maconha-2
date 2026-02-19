
export interface HistoryItem {
  id: string;
  expression: string;
  result: string;
  timestamp: Date;
}

export type CalculatorMode = 'standard' | 'scientific';

export interface AiExplanation {
  explanation: string;
  steps: string[];
}
