import { useState, useEffect } from 'react'
import { supabase } from './supabaseClient'
import CaddieAuth from './CaddieAuth'
import StudentDashboard from './StudentDashboard'
import StudentLogging from './StudentLogging'
import CoachHome from './CoachHome'
import CoachDashboard from './CoachDashboard'
import AdminDashboard from './AdminDashboard'
import ProfilePage from './ProfilePage'
import StudentSettings from './StudentSettings'
import CourseForm from './CourseForm'
import FeedbackButton from './FeedbackButton'
import StudentOnboarding from './StudentOnboarding'
import CoachOnboarding from './CoachOnboarding'
import CoachDirectory from './CoachDirectory'
import StudentProgress from './StudentProgress'

function App() {
  const [user, setUser]     = useState(null)
  const [role, setRole]     = useState(null)
  const [loading, setLoading] = useState(true)
  const [onboardingComplete, setOnboardingComplete] = useState(null)
  const [onboardingCompleteCoach, setOnboardingCompleteCoach] = useState(null)

  const [userProfile, setUserProfile]     = useState(null)

  const [adminView, setAdminView]         = useState('admin')
  const [studentScreen, setStudentScreen] = useState('dashboard')
  const [editRound, setEditRound]         = useState(null)
  const [coachScreen, setCoachScreen]     = useState('home')
  const [coachRound, setCoachRound]       = useState(null)
  const [coachStudent, setCoachStudent]   = useState(null)
  const [editingCourseId, setEditingCourseId] = useState(null)
  const [pendingCourseId, setPendingCourseId] = useState(null)
  const [courseFormReturn, setCourseFormReturn] = useState('logging')

  function resetScreenState() {
    setStudentScreen('dashboard')
    setEditRound(null)
    setCoachScreen('home')
    setCoachRound(null)
    setCoachStudent(null)
    setEditingCourseId(null)
    setPendingCourseId(null)
    setCourseFormReturn('logging')
  }

  async function fetchAndSetRole(userId) {
    const { data } = await supabase
      .from('profiles').select('role, first_name, last_name, official_handicap, is_premium, onboarding_complete, onboarding_complete_coach').eq('id', userId).single()
    setRole(data?.role ?? null)
    setUserProfile(data || null)
    setOnboardingComplete(data?.onboarding_complete ?? false)
    setOnboardingCompleteCoach(data?.onboarding_complete_coach ?? false)
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

  // Called by CaddieAuth — always fetch profile to get onboarding_complete
  async function handleAuthSuccess(userObj) {
    setUser(userObj)
    await fetchAndSetRole(userObj.id)
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
    if (adminView === 'student') {
      if (studentScreen === 'profile') {
        return (
          <>
            <ProfilePage
              user={user}
              onBack={() => setStudentScreen('dashboard')}
              onSignOut={handleSignOut}
              onAddCourse={() => { setEditingCourseId(null); setCourseFormReturn('profile'); setStudentScreen('course_form') }}
            />
            <FeedbackButton userId={user.id} page="profile" />
          </>
        )
      }
      if (studentScreen === 'settings') {
        return (
          <>
            <StudentSettings
              user={user}
              onBack={() => setStudentScreen('dashboard')}
              onSignOut={handleSignOut}
            />
            <FeedbackButton userId={user.id} page="settings" />
          </>
        )
      }
      if (studentScreen === 'course_form') {
        return (
          <>
            <CourseForm
              user={user}
              editCourseId={editingCourseId}
              onBack={() => { setEditingCourseId(null); setStudentScreen(courseFormReturn) }}
              onDone={(course) => { setPendingCourseId(course.id); setEditingCourseId(null); setStudentScreen(courseFormReturn) }}
              onSignOut={handleSignOut}
            />
            <FeedbackButton userId={user.id} page="course_form" />
          </>
        )
      }
      if (studentScreen === 'logging') {
        return (
          <>
            <StudentLogging
              user={user}
              onSignOut={handleSignOut}
              onBackToDashboard={() => setStudentScreen('dashboard')}
              onAddCourse={() => { setEditingCourseId(null); setCourseFormReturn('logging'); setStudentScreen('course_form') }}
              onEditCourse={id => { setEditingCourseId(id); setCourseFormReturn('logging'); setStudentScreen('course_form') }}
              pendingCourseId={pendingCourseId}
              onClearPendingCourse={() => setPendingCourseId(null)}
            />
            <FeedbackButton userId={user.id} page="logging" />
          </>
        )
      }
      if (studentScreen === 'editing') {
        return (
          <>
            <StudentLogging
              user={user}
              onSignOut={handleSignOut}
              onBackToDashboard={() => { setEditRound(null); setStudentScreen('dashboard') }}
              existingRound={editRound}
            />
            <FeedbackButton userId={user.id} page="editing" />
          </>
        )
      }
      if (studentScreen === 'coachDirectory') {
        return <CoachDirectory onBack={() => setStudentScreen('dashboard')} user={user} onCoachLinked={() => setStudentScreen('dashboard')} />
      }
      if (studentScreen === 'progress') {
        return (
          <StudentProgress
            user={user}
            profile={userProfile}
            onBack={() => setStudentScreen('dashboard')}
          />
        )
      }
      return (
        <>
          <StudentDashboard
            user={user}
            onSignOut={handleSignOut}
            onNewRound={() => setStudentScreen('logging')}
            onEditRound={r => { setEditRound(r); setStudentScreen('editing') }}
            onBackToAdmin={() => { resetScreenState(); setAdminView('admin') }}
            onProfile={() => setStudentScreen('profile')}
            onSettings={() => setStudentScreen('settings')}
            onFindCoach={() => setStudentScreen('coachDirectory')}
            onProgress={() => setStudentScreen('progress')}
          />
          <FeedbackButton userId={user.id} page="dashboard" />
        </>
      )
    }
    return <AdminDashboard user={user} onSignOut={handleSignOut} onStudentView={() => setAdminView('student')} />
  }
  if (role === 'coach' && onboardingCompleteCoach === false) {
    return (
      <CoachOnboarding
        user={user}
        onComplete={() => setOnboardingCompleteCoach(true)}
      />
    )
  }
  if (role === 'coach') {
    if (coachScreen === 'profile') {
      return (
        <ProfilePage
          user={user}
          onBack={() => setCoachScreen('home')}
          onSignOut={handleSignOut}
        />
      )
    }
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
        onProfile={() => setCoachScreen('profile')}
        onSignOut={handleSignOut}
      />
    )
  }

  if (role === 'student' && onboardingComplete === false) {
    if (studentScreen === 'course_form') {
      return (
        <CourseForm
          user={user}
          editCourseId={editingCourseId}
          onBack={() => { setEditingCourseId(null); setStudentScreen('dashboard') }}
          onDone={(course) => { setPendingCourseId(course.id); setEditingCourseId(null); setStudentScreen('dashboard') }}
        />
      )
    }
    return (
      <StudentOnboarding
        user={user}
        onComplete={() => setOnboardingComplete(true)}
        onAddCourse={() => { setEditingCourseId(null); setStudentScreen('course_form') }}
        pendingCourseId={pendingCourseId}
        onClearPendingCourse={() => setPendingCourseId(null)}
      />
    )
  }

  if (studentScreen === 'profile') {
    return (
      <>
        <ProfilePage
          user={user}
          onBack={() => setStudentScreen('dashboard')}
          onSignOut={handleSignOut}
          onAddCourse={() => { setEditingCourseId(null); setCourseFormReturn('profile'); setStudentScreen('course_form') }}
        />
        <FeedbackButton userId={user.id} page="profile" />
      </>
    )
  }

  if (studentScreen === 'settings') {
    return (
      <>
        <StudentSettings
          user={user}
          onBack={() => setStudentScreen('dashboard')}
          onSignOut={handleSignOut}
        />
        <FeedbackButton userId={user.id} page="settings" />
      </>
    )
  }

  if (studentScreen === 'course_form') {
    return (
      <>
        <CourseForm
          user={user}
          editCourseId={editingCourseId}
          onBack={() => { setEditingCourseId(null); setStudentScreen(courseFormReturn) }}
          onDone={(course) => { setPendingCourseId(course.id); setEditingCourseId(null); setStudentScreen(courseFormReturn) }}
        />
        <FeedbackButton userId={user.id} page="course_form" />
      </>
    )
  }

  if (studentScreen === 'logging') {
    return (
      <>
        <StudentLogging
          user={user}
          onSignOut={handleSignOut}
          onBackToDashboard={() => setStudentScreen('dashboard')}
        />
        <FeedbackButton userId={user.id} page="logging" />
      </>
    )
  }
  if (studentScreen === 'editing') {
    return (
      <>
        <StudentLogging
          user={user}
          onSignOut={handleSignOut}
          onBackToDashboard={() => { setEditRound(null); setStudentScreen('dashboard') }}
          existingRound={editRound}
        />
        <FeedbackButton userId={user.id} page="editing" />
      </>
    )
  }
  if (studentScreen === 'coachDirectory') {
    return <CoachDirectory onBack={() => setStudentScreen('dashboard')} user={user} onCoachLinked={() => setStudentScreen('dashboard')} />
  }
  if (studentScreen === 'progress') {
    return (
      <StudentProgress
        user={user}
        profile={userProfile}
        onBack={() => setStudentScreen('dashboard')}
      />
    )
  }
  return (
    <>
      <StudentDashboard
        user={user}
        onSignOut={handleSignOut}
        onNewRound={() => setStudentScreen('logging')}
        onEditRound={r => { setEditRound(r); setStudentScreen('editing') }}
        onProfile={() => setStudentScreen('profile')}
        onSettings={() => setStudentScreen('settings')}
        onFindCoach={() => setStudentScreen('coachDirectory')}
        onProgress={() => setStudentScreen('progress')}
      />
      <FeedbackButton userId={user.id} page="dashboard" />
    </>
  )
}

export default App