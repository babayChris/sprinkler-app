import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { EditProvider } from './contexts/EditContext.tsx'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <EditProvider>
      <App />
    </EditProvider>
  </StrictMode>,
)
