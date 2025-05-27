import { createContext, useContext, useState, ReactNode } from 'react';

interface EditContextType {
  state: 'manual' | 'auto' | 'off',
  setState: (state: 'manual' | 'auto' | 'off') => void,
}


const EditContext = createContext<EditContextType|undefined>(undefined)

export function EditProvider({children}: {children: ReactNode}) {
  const [state, setState] = useState<'manual' | 'auto' | 'off'>('off');

  return(
    <EditContext.Provider value={{state, setState}}>
      {children}
    </EditContext.Provider>
  )
}

export function useEditContext() {
  const context = useContext(EditContext);
  if (!context) {
        throw new Error('useEditContext must be used within EditProvider');
  }
  return context;
}