import { useState, useEffect } from 'react'
import { supabase } from './supabaseClient'
import CaddieAuth from './CaddieAuth'
import StudentDashboard from './StudentDashboard'
import StudentLogging from './StudentLogging'
import CoachHome from './CoachHome'
import CoachDashboard from './CoachDashboard'
import AdminDashboard from './AdminDashboard'

function App() {
  const [user, setUser]     = useState(null)
  const [role, setRole]     = useState(null)
  const [loading, setLoading] = useState(true)

  const [studentScreen, setStudentScreen] = useState('dashboard')
  const [editRound, setEditRound]         = useState(null)
  const [coachScreen, setCoachScreen]     = useState('home')
  const [coachRound, setCoachRound]       = useState(null)
  const [coachStudent, setCoachStudent]   = useState(null)

  function resetScreenState() {
    setStudentScreen('dashboard')
    setEditRound(null)
    setCoachScreen('home')
    setCoachRound(null)
    setCoachStudent(null)
  }

  async function fetchAndSetRole(userId) {
    const { data } = await supabase
      .from('profiles').select('role, first_name, last_name, official_handicap').eq('id', userId).single()
    setRole(data?.role ?? null)
    return data?.role ?? null
  }

  useEffect(() => {
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (session?.user) {
        setUser(session.user)
        await fetchAndSetRole(session.user.id)
      }
      setLoading(false)
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        if (event === 'SIGNED_OUT') {
          setUser(null)
          setRole(null)
          resetScreenState()
        }
      }
    )
    return () => subscription.unsubscribe()
  }, [])

  async function handleSignOut() {
    await supabase.auth.signOut()
  }

  // Called by CaddieAuth — roleArg comes straight from the profiles fetch
  async function handleAuthSuccess(userObj, roleArg) {
    setUser(userObj)
    if (roleArg) {
      setRole(roleArg)
    } else {
      await fetchAndSetRole(userObj.id)
    }
    resetScreenState()
  }

  if (loading) return (
    <div style={{
      minHeight: '100vh', background: '#F4F1EB',
      display: 'flex', alignItems: 'center', justifyContent: 'center'
    }}>
      <div style={{
        width: 28, height: 28, border: '3px solid #E2DDD4',
        borderTopColor: '#1A6B4A', borderRadius: '50%',
        animation: 'spin 0.7s linear infinite'
      }} />
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  )

  if (!user) return <CaddieAuth onAuthSuccess={handleAuthSuccess} />
if (role === 'admin') {
  return <AdminDashboard user={user} onSignOut={handleSignOut} />
}
  if (role === 'coach') {
    if (coachScreen === 'round' && coachRound) {
      return (
        <CoachDashboard
          user={user}
          student={coachStudent}
          round={coachRound}
          onBack={() => setCoachScreen('history')}
          onSignOut={handleSignOut}
        />
      )
    }
    return (
      <CoachHome
        user={user}
        initialScreen={coachScreen === 'history' ? 'history' : 'students'}
        initialStudent={coachStudent}
        onSelectRound={(round, student) => {
          setCoachRound(round)
          setCoachStudent(student)
          setCoachScreen('round')
        }}
        onSignOut={handleSignOut}
      />
    )
  }

  if (studentScreen === 'logging') {
    return (
      <StudentLogging
        user={user}
        onSignOut={handleSignOut}
        onBackToDashboard={() => setStudentScreen('dashboard')}
      />
    )
  }
  if (studentScreen === 'editing') {
    return (
      <StudentLogging
        user={user}
        onSignOut={handleSignOut}
        onBackToDashboard={() => { setEditRound(null); setStudentScreen('dashboard') }}
        existingRound={editRound}
      />
    )
  }
  return (
    <StudentDashboard
      user={user}
      onSignOut={handleSignOut}
      onNewRound={() => setStudentScreen('logging')}
      onEditRound={r => { setEditRound(r); setStudentScreen('editing') }}
    />
  )
}

export default App