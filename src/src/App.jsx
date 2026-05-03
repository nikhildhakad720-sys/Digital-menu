import { Routes, Route } from 'react-router-dom'
import MenuPage from './src/components/MenuPage'
import AdminPage from './src/components/AdminPage'

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<MenuPage />} />
      <Route path="/table/:tableId" element={<MenuPage />} />
      <Route path="/admin" element={<AdminPage />} />
    </Routes>
  )
}