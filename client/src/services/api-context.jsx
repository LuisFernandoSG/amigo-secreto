import axios from 'axios';
import { createContext, useContext, useMemo } from 'react';

const ApiContext = createContext();

export const ApiProvider = ({ children }) => {
  const baseURL = import.meta.env.VITE_API_BASE_URL || '/api';
  const client = useMemo(() => {
    const instance = axios.create({ baseURL });
    instance.interceptors.response.use(
      (response) => response,
      (error) => {
        if (error.response?.data?.message) {
          error.message = error.response.data.message;
        }
        return Promise.reject(error);
      }
    );
    return instance;
  }, [baseURL]);

  return <ApiContext.Provider value={client}>{children}</ApiContext.Provider>;
};

export const useApi = () => {
  const context = useContext(ApiContext);
  if (!context) {
    throw new Error('useApi debe usarse dentro de ApiProvider');
  }
  return context;
};