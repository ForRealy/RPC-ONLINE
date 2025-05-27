import { useState, useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'

export default function VerifyEmail() {
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(true)
  const [searchParams] = useSearchParams()
  const { verifyEmailAndCreateAccount } = useAuth()
  const navigate = useNavigate()

  useEffect(() => {
    const verifyEmail = async () => {
      try {
        const actionCode = searchParams.get('oobCode')
        if (!actionCode) {
          setError('Invalid verification link')
          setLoading(false)
          return
        }

        await verifyEmailAndCreateAccount(actionCode)
        setMessage('Email verified successfully! You can now log in.')
        setTimeout(() => navigate('/login'), 3000)
      } catch (error) {
        setError('Failed to verify email: ' + error.message)
      }
      setLoading(false)
    }

    verifyEmail()
  }, [searchParams, verifyEmailAndCreateAccount, navigate])

  return (
    <div className="min-h-screen bg-gray-100 py-6 flex flex-col justify-center sm:py-12">
      <div className="relative py-3 sm:max-w-xl sm:mx-auto">
        <div className="relative px-4 py-10 bg-white shadow-lg sm:rounded-3xl sm:p-20">
          <div className="max-w-md mx-auto">
            <div className="divide-y divide-gray-200">
              <div className="py-8 text-base leading-6 space-y-4 text-gray-700 sm:text-lg sm:leading-7">
                <h2 className="text-2xl font-bold text-center mb-8">Email Verification</h2>
                
                {loading && (
                  <div className="text-center">
                    <p>Verifying your email...</p>
                  </div>
                )}

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
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
} 