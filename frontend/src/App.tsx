import PomodoroTimer from './components/PomodoroTimer'

function App() {
  return (
    <main className="min-h-screen w-full bg-cozy-cream flex items-center justify-center p-4 sm:p-10 selection:bg-cozy-orange/30 relative">
      {/* Dynamic background ambient lights - simplified for performance */}
      <div className="absolute top-[-10%] left-[-5%] w-[50vw] h-[50vw] bg-cozy-orange/5 rounded-full blur-[100px] animate-pulse pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-5%] w-[55vw] h-[55vw] bg-cozy-green/5 rounded-full blur-[120px] animate-pulse pointer-events-none" />
      
      <div className="relative z-10 w-full flex justify-center py-10">
        <PomodoroTimer />
      </div>
    </main>
  )
}

export default App
