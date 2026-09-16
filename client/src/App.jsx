import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import Login from './Pages/Login'
import Register from './Pages/Register'
import Home from './Pages/Home'
import Resources from './Pages/Resources'
import { Toaster } from 'sonner'

const App = () => {
  return (
    <BrowserRouter>
      <Toaster position="top-right" richColors closeButton />
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/" element={<Home />} />
        <Route path="/resources/:subjectId" element={<Resources />} />
        <Route path="*" element={<Navigate replace to="/login" />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App
