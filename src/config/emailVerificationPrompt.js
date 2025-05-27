import React, { useState } from 'react'
import { useAuth } from '../contexts/AuthContext'

export default function EmailVerificationPrompt() {
  const { currentUser, sendVerificationEmail, logout } = useAuth()
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleResend() {
    try {
      setError('')
      setMessage('')
      setLoading(true)
      await sendVerificationEmail()
      setMessage('Verification email sent. Please check your inbox.')
    } catch (err) {
      setError('Failed to send verification: ' + err.message)
    }
    setLoading(false)
  }

  async function handleSignOut() {
    await logout()
  }

  if (currentUser && !currentUser.emailVerified) {
    return (
      <div className="verification-prompt">
        <h2>Please verify your email address</h2>
        <p>
          We sent a verification link to <strong>{currentUser.email}</strong>.
          You must verify your email to access all features.
        </p>
        {error && <div className="error">{error}</div>}
        {message && <div className="message">{message}</div>}
        <button onClick={handleResend} disabled={loading}>
          {loading ? 'Resending...' : 'Resend Verification Email'}
        </button>
        <button onClick={handleSignOut} className="logout-link">
          Logout
        </button>
      </div>
    )
  }
  return null
}