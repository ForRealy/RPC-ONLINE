import React, { useState } from 'react'
import { useAuth } from '../contexts/AuthContext'

export default function ResetPassword() {
  const { sendPasswordReset } = useAuth()
  const [email, setEmail] = useState('')
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    try {
      setError('')
      setMessage('')
      setLoading(true)
      await sendPasswordReset(email)
      setMessage('Check your inbox for password reset instructions.')
    } catch (err) {
      setError('Failed to send reset email: ' + err.message)
    }
    setLoading(false)
  }

  return (
    <div className="auth-container">
      <h2>Password Reset</h2>
      {error && <div className="error">{error}</div>}
      {message && <div className="message">{message}</div>}
      <form onSubmit={handleSubmit}>
        <input
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Enter your email"
        />
        <button disabled={loading} type="submit">
          {loading ? 'Sending...' : 'Send Reset Email'}
        </button>
      </form>
    </div>
  )
}