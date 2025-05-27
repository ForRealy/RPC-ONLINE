import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import { AuthProvider } from './contexts/AuthContext'
import PrivateRoute from './components/PrivateRoute'
import Home from './pages/Home'
import Game from './pages/Game'
import Login from './pages/Login'
import Register from './pages/Register'
import ResetPassword from './pages/ResetPassword'
import EmailVerificationPrompt from './pages/EmailVerificationPrompt'
import VerifyEmail from './pages/VerifyEmail'

function App() {
  return (
    <Router>
      <AuthProvider>
        <div className="min-h-screen bg-gray-100">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/reset-password" element={<ResetPassword />} />
            <Route path="/verify" element={<EmailVerificationPrompt />} />
            <Route path="/verify-email" element={<VerifyEmail />} />

            <Route
              path="/game"
              element={
                <PrivateRoute>
                  <Game />
                </PrivateRoute>
              }
            />
          </Routes>
        </div>
      </AuthProvider>
    </Router>
  )
}

export default App 