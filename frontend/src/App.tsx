import { BrowserRouter, Routes, Route } from 'react-router-dom'
import HomePage from './pages/HomePage'
import DashboardPage from './pages/DashboardPage'

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/dashboard" element={<DashboardPage />} />
        <Route path="*" element={<HomePage />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App
