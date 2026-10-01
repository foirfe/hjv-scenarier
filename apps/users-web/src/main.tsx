import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import { BrowserRouter } from 'react-router'
import { AuthProvider } from './auth/AuthContext.tsx'
import { offlineDb } from "./offline/db";
import "./styles/variables.css";
import "./styles/globals.css";
import SyncQueueProcessor from './components/SyncQueueProcessor.tsx'

void offlineDb.open().catch((error) => { console.error("Offline database kunne ikke åbnes:", error); });

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <SyncQueueProcessor />
        <App />
      </AuthProvider>
    </BrowserRouter>
  </StrictMode>,
)
