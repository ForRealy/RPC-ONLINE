import { Link } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'

export default function Home() {
  const { currentUser, logout } = useAuth()

  return (
    <div className="min-h-screen bg-gray-100 py-6 flex flex-col justify-center sm:py-12">
      <div className="relative py-3 sm:max-w-xl sm:mx-auto">
        <div className="relative px-4 py-10 bg-white shadow-lg sm:rounded-3xl sm:p-20">
          <div className="max-w-md mx-auto">
            <div className="divide-y divide-gray-200">
              <div className="py-8 text-base leading-6 space-y-4 text-gray-700 sm:text-lg sm:leading-7">
                <h1 className="text-3xl font-bold text-center mb-8">Rock Paper Scissors Online</h1>
                {currentUser ? (
                  <div className="space-y-4">
                    <p className="text-center">Welcome, {currentUser.email}!</p>
                    <div className="flex flex-col space-y-4">
                      <Link
                        to="/game"
                        className="bg-blue-500 text-white px-4 py-2 rounded-md hover:bg-blue-600 text-center"
                      >
                        Play Game
                      </Link>
                      <button
                        onClick={logout}
                        className="bg-red-500 text-white px-4 py-2 rounded-md hover:bg-red-600"
                      >
                        Logout
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col space-y-4">
                    <Link
                      to="/login"
                      className="bg-blue-500 text-white px-4 py-2 rounded-md hover:bg-blue-600 text-center"
                    >
                      Login
                    </Link>
                    <Link
                      to="/register"
                      className="bg-green-500 text-white px-4 py-2 rounded-md hover:bg-green-600 text-center"
                    >
                      Register
                    </Link>
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