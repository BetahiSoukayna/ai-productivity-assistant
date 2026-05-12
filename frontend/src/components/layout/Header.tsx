export function Header() {
  return (
    <header className="fixed left-[248px] right-0 top-0 z-40 h-[72px] border-b border-slate-200 bg-white/90 backdrop-blur">
      <div className="flex h-full items-center justify-between px-6">
        <div className="flex w-full max-w-xl items-center rounded-2xl bg-slate-100 px-4 py-3">
          <span className="mr-3 text-slate-400">⌕</span>
          <input
            className="w-full bg-transparent text-sm outline-none placeholder:text-slate-400"
            placeholder="Rechercher dans vos emails, documents ou tâches..."
          />
        </div>

        <div className="flex items-center gap-4">
          <button className="relative rounded-full p-2 text-slate-500 hover:bg-slate-100">
            🔔
            <span className="absolute right-1 top-1 h-2 w-2 rounded-full bg-red-500" />
          </button>

          <button className="rounded-full p-2 text-slate-500 hover:bg-slate-100">
            ?
          </button>

          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-100 font-semibold text-blue-700">
            JD
          </div>
        </div>
      </div>
    </header>
  );
}