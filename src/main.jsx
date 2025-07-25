import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import { AuthProvider } from './hooks/useAuth.jsx'
import { FamilyProvider } from './hooks/useFamily.jsx'
import { TasksProvider } from './hooks/useTasks.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <AuthProvider>
      <FamilyProvider>
        <TasksProvider>
          <App />
        </TasksProvider>
      </FamilyProvider>
    </AuthProvider>
  </StrictMode>,
)
