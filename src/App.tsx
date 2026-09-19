import { BrowserRouter, Route, Routes } from 'react-router-dom'
import { AppShell } from './components/AppShell.tsx'
import { AuthGate } from './components/AuthGate.tsx'
import { Login } from './components/Login.tsx'
import { useVisualViewportHeight } from './lib/useVisualViewport.ts'

export default function App() {
  useVisualViewportHeight()

  return (
    <BrowserRouter>
      <Routes>
        <Route element={<AuthGate />}>
          <Route path="/login" element={<Login />} />
          <Route path="/" element={<AppShell />} />
          <Route path="/n/:id" element={<AppShell />} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}
