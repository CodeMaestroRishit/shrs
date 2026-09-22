import { createContext, useContext, useEffect, useState } from 'react'
import { supabase } from '../lib/supabaseClient'

const AuthContext = createContext(undefined)

function readAuthErrorFromUrl() {
  const fromQuery = new URLSearchParams(window.location.search)
  const fromHash = new URLSearchParams(window.location.hash.replace(/^#/, ''))
  const error = fromQuery.get('error') || fromHash.get('error')
  if (!error) return null

  const description = fromQuery.get('error_description') || fromHash.get('error_description') || ''
  const decoded = decodeURIComponent(description.replace(/\+/g, ' '))

  return decoded.toLowerCase().includes('college email')
    ? 'Sign-in is restricted to RVU college email addresses. Please sign in with your @rvu.edu.in account.'
    : 'Sign-in failed. If you used a personal email, please sign in with your RVU (@rvu.edu.in) email address instead.'
}

export function AuthProvider({ children }) {
  const [session, setSession] = useState(null)
  const [profile, setProfile] = useState(null)
  const [adminClubIds, setAdminClubIds] = useState([])
  const [loading, setLoading] = useState(true)
  const [authError, setAuthError] = useState(() => readAuthErrorFromUrl())

  useEffect(() => {
    if (!authError) return
    // Strip the error params so refreshing/sharing the URL doesn't re-show it.
    window.history.replaceState(null, '', window.location.pathname)
  }, [authError])

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session)
    })

    const { data: listener } = supabase.auth.onAuthStateChange((_event, newSession) => {
      setSession(newSession)
    })

    return () => listener.subscription.unsubscribe()
  }, [])

  useEffect(() => {
    let cancelled = false

    async function loadProfileAndAdminClubs(userId) {
      setLoading(true)

      const [{ data: profileRow }, { data: adminRows }] = await Promise.all([
        supabase.from('profiles').select('*').eq('id', userId).single(),
        supabase.from('club_admins').select('club_id').eq('user_id', userId),
      ])

      if (cancelled) return
      setProfile(profileRow ?? null)
      setAdminClubIds((adminRows ?? []).map((row) => row.club_id))
      setLoading(false)
    }

    if (session?.user?.id) {
      loadProfileAndAdminClubs(session.user.id)
    } else {
      setProfile(null)
      setAdminClubIds([])
      setLoading(false)
    }

    return () => {
      cancelled = true
    }
  }, [session?.user?.id])

  async function signInWithGoogle(redirectPath = '/') {
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: window.location.origin + redirectPath },
    })
  }

  async function signOut() {
    await supabase.auth.signOut()
  }

  const value = {
    session,
    user: session?.user ?? null,
    profile,
    adminClubIds,
    isClubAdminOf: (clubId) => adminClubIds.includes(clubId),
    isAnyClubAdmin: adminClubIds.length > 0,
    loading,
    signInWithGoogle,
    signOut,
    authError,
    clearAuthError: () => setAuthError(null),
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (ctx === undefined) throw new Error('useAuth must be used within an AuthProvider')
  return ctx
}
