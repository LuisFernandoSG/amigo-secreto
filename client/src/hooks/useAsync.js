import { useCallback, useState } from 'react';

export const useAsync = (asyncFunction, { immediate = false, args = [] } = {}) => {
  const [status, setStatus] = useState(immediate ? 'pending' : 'idle');
  const [value, setValue] = useState(null);
  const [error, setError] = useState(null);

  const execute = useCallback(
    async (...executionArgs) => {
      setStatus('pending');
      setError(null);
      try {
        const result = await asyncFunction(...(executionArgs.length ? executionArgs : args));
        setValue(result);
        setStatus('success');
        return result;
      } catch (err) {
        setError(err);
        setStatus('error');
        throw err;
      }
    },
    [args, asyncFunction]
  );

  return { execute, status, value, error, setValue };
};