import { Routes, Route } from 'react-router-dom'
import MenuPage from './components/MenuPage'
import AdminPage from './components/AdminPage'

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<MenuPage />} />
      <Route path="/table/:tableId" element={<MenuPage />} />
      <Route path="/admin" element={<AdminPage />} />
    </Routes>
  )
}