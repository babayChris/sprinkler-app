import { createContext, useContext, useState, ReactNode } from 'react';

interface PageContextType {
  numPages: number;
  setNumPages: (pages: number) => void;
  pageNum: number;
  setPageNum: (page: number) => void;
}

const PageContext = createContext<PageContextType | undefined>(undefined);

export function PageProvider({ children }: { children: ReactNode }) {
  const [numPages, setNumPages] = useState<number>(0);
  const [pageNum, setPageNum] = useState<number>(1);

  return (
    <PageContext.Provider value={{ numPages, setNumPages, pageNum, setPageNum }}>
      {children}
    </PageContext.Provider>
  );
}

export function usePageContext() {
  const context = useContext(PageContext);
  if (!context) {
    throw new Error('usePageContext must be used within PageProvider');
  }
  return context;
}