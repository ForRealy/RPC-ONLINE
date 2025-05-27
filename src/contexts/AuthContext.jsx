import { createContext, useContext, useState, useEffect } from 'react'
import { 
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  GoogleAuthProvider,
  signInWithPopup,
  sendEmailVerification,
  sendPasswordResetEmail,
  applyActionCode,
  verifyPasswordResetCode,
  confirmPasswordReset
} from 'firebase/auth'
import { auth } from '../config/firebase'

const AuthContext = createContext()

export function useAuth() {
  return useContext(AuthContext)
}

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null)
  const [loading, setLoading] = useState(true)

  async function signup(email, password) {
    try {
      // Create a temporary user
      const userCredential = await createUserWithEmailAndPassword(auth, email, password)
      const user = userCredential.user

      // Send verification email
      await sendEmailVerification(user)

      // Sign out the temporary user
      await signOut(auth)

      return { success: true, message: 'Verification email sent. Please check your email to complete registration.' }
    } catch (error) {
      throw error
    }
  }

  async function verifyEmailAndCreateAccount(actionCode) {
    try {
      // Apply the email verification code
      await applyActionCode(auth, actionCode)
      
      // Get the email from the verification code
      const email = await verifyPasswordResetCode(auth, actionCode)
      
      // Now we can create the actual account
      const userCredential = await createUserWithEmailAndPassword(auth, email, password)
      return userCredential.user
    } catch (error) {
      throw error
    }
  }

  async function login(email, password) {
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password)
      const user = userCredential.user

      if (!user.emailVerified) {
        await signOut(auth)
        throw new Error('Please verify your email before logging in.')
      }

      return user
    } catch (error) {
      throw error
    }
  }

  async function loginWithGoogle() {
    try {
      const provider = new GoogleAuthProvider()
      const result = await signInWithPopup(auth, provider)
      return result.user
    } catch (error) {
      throw error
    }
  }

  async function logout() {
    try {
      await signOut(auth)
    } catch (error) {
      throw error
    }
  }

  async function resetPassword(email) {
    try {
      await sendPasswordResetEmail(auth, email)
    } catch (error) {
      throw error
    }
  }

  async function verifyPasswordReset(code) {
    try {
      return await verifyPasswordResetCode(auth, code)
    } catch (error) {
      throw error
    }
  }

  async function confirmPasswordReset(code, newPassword) {
    try {
      await confirmPasswordReset(auth, code, newPassword)
    } catch (error) {
      throw error
    }
  }

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user)
      setLoading(false)
    })

    return unsubscribe
  }, [])

  const value = {
    currentUser,
    signup,
    login,
    logout,
    loginWithGoogle,
    resetPassword,
    verifyPasswordReset,
    confirmPasswordReset,
    verifyEmailAndCreateAccount
  }

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  )
} 