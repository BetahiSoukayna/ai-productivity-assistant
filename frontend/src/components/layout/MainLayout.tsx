import { Outlet } from "react-router-dom";
import { Sidebar } from "./Sidebar";
import { Header } from "./Header";

export function MainLayout() {
  return (
    <div className="min-h-screen bg-[#f6f8fc] text-slate-900">
      <Sidebar />

      <div className="min-h-screen pl-[248px]">
        <Header />

        <main className="min-h-[calc(100vh-72px)] pt-[72px]">
          <Outlet />
        </main>
      </div>
    </div>
  );
}