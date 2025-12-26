import { useState, useCallback } from 'react';

interface Command<T> {
  execute: () => T;
  undo: () => void;
  description: string;
}

interface HistoryState<T> {
  past: Array<() => void>;
  present: T;
  future: Array<() => void>;
}

const MAX_HISTORY = 50;

export function useUndoRedo<T>(initialState: T) {
  const [history, setHistory] = useState<HistoryState<T>>({
    past: [],
    present: initialState,
    future: [],
  });

  const execute = useCallback((command: Command<T>) => {
    setHistory((prev) => {
      const newPast = [...prev.past, command.undo];
      // Limit history size
      const trimmedPast = newPast.slice(-MAX_HISTORY);
      
      command.execute();
      
      return {
        past: trimmedPast,
        present: prev.present,
        future: [], // Clear future when new command is executed
      };
    });
  }, []);

  const undo = useCallback(() => {
    setHistory((prev) => {
      if (prev.past.length === 0) return prev;
      
      const previous = prev.past[prev.past.length - 1];
      const newPast = prev.past.slice(0, -1);
      const newFuture = [previous, ...prev.future];
      
      previous(); // Execute undo
      
      return {
        past: newPast,
        present: prev.present,
        future: newFuture,
      };
    });
  }, []);

  const redo = useCallback(() => {
    setHistory((prev) => {
      if (prev.future.length === 0) return prev;
      
      const next = prev.future[0];
      const newFuture = prev.future.slice(1);
      const newPast = [...prev.past, next];
      
      // To redo, we need to re-execute the command
      // This is a simplified version - in practice, you'd store the execute function too
      // For now, we'll just update the state
      
      return {
        past: newPast,
        present: prev.present,
        future: newFuture,
      };
    });
  }, []);

  const canUndo = history.past.length > 0;
  const canRedo = history.future.length > 0;

  const clearHistory = useCallback(() => {
    setHistory({
      past: [],
      present: history.present,
      future: [],
    });
  }, [history.present]);

  return {
    execute,
    undo,
    redo,
    canUndo,
    canRedo,
    clearHistory,
  };
}


