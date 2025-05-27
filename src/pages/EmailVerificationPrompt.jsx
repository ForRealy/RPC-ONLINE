import { useState, useEffect } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'

export default function EmailVerificationPrompt() {
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(false)
  const [searchParams] = useSearchParams()
  const { currentUser, sendVerificationEmail, verifyEmail } = useAuth()
  const navigate = useNavigate()

  const code = searchParams.get('oobCode')

  useEffect(() => {
    if (code) {
      handleVerification()
    }
  }, [code])

  async function handleVerification() {
    try {
      setError('')
      setLoading(true)
      await verifyEmail(code)
      setMessage('Email verified successfully')
      setTimeout(() => navigate('/'), 2000)
    } catch (error) {
      setError('Failed to verify email: ' + error.message)
    }
    setLoading(false)
  }

  async function handleResendVerification() {
    try {
      setError('')
      setLoading(true)
      await sendVerificationEmail()
      setMessage('Verification email sent. Please check your inbox.')
    } catch (error) {
      setError('Failed to send verification email: ' + error.message)
    }
    setLoading(false)
  }

  if (!currentUser) {
    return (
      <div className="min-h-screen bg-gray-100 py-6 flex flex-col justify-center sm:py-12">
        <div className="relative py-3 sm:max-w-xl sm:mx-auto">
          <div className="relative px-4 py-10 bg-white shadow-lg sm:rounded-3xl sm:p-20">
            <div className="max-w-md mx-auto">
              <div className="divide-y divide-gray-200">
                <div className="py-8 text-base leading-6 space-y-4 text-gray-700 sm:text-lg sm:leading-7">
                  <h2 className="text-2xl font-bold text-center mb-8">Please Login</h2>
                  <p className="text-center">You need to be logged in to verify your email.</p>
                  <div className="text-center mt-4">
                    <Link to="/login" className="text-blue-600 hover:text-blue-800">
                      Go to Login
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-100 py-6 flex flex-col justify-center sm:py-12">
      <div className="relative py-3 sm:max-w-xl sm:mx-auto">
        <div className="relative px-4 py-10 bg-white shadow-lg sm:rounded-3xl sm:p-20">
          <div className="max-w-md mx-auto">
            <div className="divide-y divide-gray-200">
              <div className="py-8 text-base leading-6 space-y-4 text-gray-700 sm:text-lg sm:leading-7">
                <h2 className="text-2xl font-bold text-center mb-8">Email Verification</h2>
                {error && (
                  <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4">
                    {error}
                  </div>
                )}
                {message && (
                  <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded relative mb-4">
                    {message}
                  </div>
                )}
                {!code && (
                  <>
                    <p className="text-center">
                      Please verify your email address ({currentUser.email}) to continue.
                    </p>
                    <button
                      onClick={handleResendVerification}
                      disabled={loading}
                      className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {loading ? 'Sending...' : 'Resend Verification Email'}
                    </button>
                  </>
                )}
                {code && loading && (
                  <p className="text-center">Verifying your email...</p>
                )}
                <div className="text-center mt-4">
                  <Link to="/" className="text-blue-600 hover:text-blue-800">
                    Back to Home
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
} 