import { useEffect, useState } from 'react'
import { Navigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export default function Login() {
  const { user, signInWithGoogle } = useAuth()
  const [oauthError, setOauthError] = useState(null)

  useEffect(() => {
    const hashParams = new URLSearchParams(window.location.hash.replace('#', ''))
    const description = hashParams.get('error_description')
    if (description) setOauthError(description.replace(/\+/g, ' '))
  }, [])

  if (user) return <Navigate to="/" replace />

  return (
    <div className="page login-page">
      <h1>Sign in</h1>
      <p>Sign in with your college Google account to continue.</p>
      {oauthError && <p className="form-error">{oauthError}</p>}
      <button type="button" className="button-primary" onClick={signInWithGoogle}>
        Sign in with Google
      </button>
    </div>
  )
}
