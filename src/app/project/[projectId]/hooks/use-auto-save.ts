import { useEffect, useRef, useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { client } from '@/lib/client';

type SaveStatus = 'idle' | 'saving' | 'saved' | 'error';

interface UseAutoSaveOptions {
  debounceMs?: number;
  onSave?: () => void;
  onError?: (error: Error) => void;
}

export function useAutoSave<T>(
  data: T,
  saveFn: (data: T) => Promise<void>,
  options: UseAutoSaveOptions = {}
) {
  const { debounceMs = 500, onSave, onError } = options;
  const [status, setStatus] = useState<SaveStatus>('idle');
  const timeoutRef = useRef<NodeJS.Timeout>();
  const dataRef = useRef(data);
  const isInitialMount = useRef(true);

  // Update ref when data changes
  useEffect(() => {
    dataRef.current = data;
  }, [data]);

  useEffect(() => {
    // Skip initial mount
    if (isInitialMount.current) {
      isInitialMount.current = false;
      return;
    }

    // Clear existing timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    // Set status to saving after debounce
    setStatus('saving');

    // Set new timeout
    timeoutRef.current = setTimeout(async () => {
      try {
        await saveFn(dataRef.current);
        setStatus('saved');
        onSave?.();
        
        // Reset to idle after 2 seconds
        setTimeout(() => {
          setStatus('idle');
        }, 2000);
      } catch (error) {
        setStatus('error');
        onError?.(error instanceof Error ? error : new Error('Save failed'));
        
        // Reset to idle after 5 seconds on error
        setTimeout(() => {
          setStatus('idle');
        }, 5000);
      }
    }, debounceMs);

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [data, debounceMs, saveFn, onSave, onError]);

  return status;
}


