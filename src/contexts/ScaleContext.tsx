import { createContext, useContext, useState, ReactNode } from 'react';

interface ScaleContextType {
  setScale: (scale: number) => void;
  scale: number
}

const PageContext = createContext<ScaleContextType | undefined>(undefined);

export function ScaleProvider({ children }: { children: ReactNode }) {
  const [scale, setScale] = useState<number>(0);

  return (
    <PageContext.Provider value={{ scale, setScale }}>
      {children}
    </PageContext.Provider>
  );
}

export function useScaleContext() {
  const context = useContext(PageContext);
  if (!context) {
    throw new Error('useScaleContext must be used within PageProvider');
  }
  return context;
}