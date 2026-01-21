import PomodoroTimer from './components/PomodoroTimer'

function App() {
  return (
    <main className="min-h-screen w-full bg-cozy-cream flex items-center justify-center p-4 sm:p-6 md:p-8 selection:bg-cozy-orange/30 relative overflow-x-hidden">
      {/* Dynamic background ambient lights - fully contained */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[50vw] h-[50vw] bg-cozy-orange/5 rounded-full blur-[120px] animate-pulse" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[60vw] h-[60vw] bg-cozy-green/5 rounded-full blur-[140px] animate-pulse" />
      </div>
      
      <div className="relative z-10 w-full max-w-[1000px] flex justify-center py-6 sm:py-10">
        <PomodoroTimer />
      </div>
    </main>
  )
}

export default App
