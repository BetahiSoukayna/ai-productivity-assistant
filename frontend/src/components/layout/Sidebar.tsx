import { NavLink } from "react-router-dom";

const navItems = [
  { label: "Tableau de bord", path: "/", icon: "▦" },
  { label: "E-mails", path: "/emails", icon: "✉" },
  { label: "Documents", path: "/documents", icon: "▤" },
  { label: "Calendrier", path: "/calendar", icon: "□" },
  { label: "Tâches", path: "/tasks", icon: "☑" },
];

export function Sidebar() {
  return (
    <aside className="fixed left-0 top-0 z-50 flex h-screen w-[248px] flex-col border-r border-slate-200 bg-white">
      <div className="flex h-[72px] items-center gap-3 border-b border-slate-100 px-5">
        <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-blue-600 font-bold text-white">
          AI
        </div>
        <div>
          <h1 className="text-lg font-bold">AI Assistant</h1>
          <p className="text-xs text-slate-500">Workspace intelligent</p>
        </div>
      </div>

      <nav className="flex-1 space-y-1 px-3 py-5">
        {navItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            end={item.path === "/"}
            className={({ isActive }) =>
              `flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-medium transition ${
                isActive
                  ? "bg-blue-50 text-blue-700"
                  : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
              }`
            }
          >
            <span className="text-lg">{item.icon}</span>
            {item.label}
          </NavLink>
        ))}
      </nav>

      <div className="border-t border-slate-100 p-4">
        <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">
            Statut système
          </p>
          <div className="mt-2 flex items-center gap-2 text-sm font-medium text-slate-700">
            <span className="h-2 w-2 rounded-full bg-green-500" />
            Connecté à Google
          </div>
        </div>

        <NavLink
          to="/settings"
          className={({ isActive }) =>
            `mt-4 flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-medium ${
              isActive
                ? "bg-slate-100 text-slate-900"
                : "text-slate-600 hover:bg-slate-100"
            }`
          }
        >
          ⚙ Paramètres
        </NavLink>
      </div>
    </aside>
  );
}