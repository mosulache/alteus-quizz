import { Outlet, Link, useLocation } from "react-router-dom";
import { LayoutDashboard, PlusCircle, Settings, LogOut } from "lucide-react";
import { cn } from "@/lib/utils";

export function AdminLayout() {
  const location = useLocation();

  const isActive = (path: string) => location.pathname === path;

  return (
    <div className="min-h-screen flex bg-slate-50 text-slate-900 font-sans">
      <aside className="w-64 bg-white border-r border-slate-200 flex flex-col shadow-sm fixed h-full z-10">
        <div className="p-6 border-b border-slate-100 flex items-center gap-2">
            <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center text-white font-bold">A</div>
            <h2 className="font-bold text-xl text-slate-800">Alteus Quizzer Admin</h2>
        </div>
        <nav className="flex-1 p-4 space-y-1">
          <Link 
            to="/admin" 
            className={cn(
                "flex items-center gap-3 px-4 py-3 rounded-lg transition-all font-medium",
                isActive("/admin") 
                    ? "bg-primary/10 text-primary" 
                    : "text-slate-500 hover:bg-slate-100 hover:text-slate-900"
            )}
          >
            <LayoutDashboard size={20} />
            Dashboard
          </Link>
          <Link 
            to="/admin/create" 
            className={cn(
                "flex items-center gap-3 px-4 py-3 rounded-lg transition-all font-medium",
                isActive("/admin/create") 
                    ? "bg-primary/10 text-primary" 
                    : "text-slate-500 hover:bg-slate-100 hover:text-slate-900"
            )}
          >
            <PlusCircle size={20} />
            Create Quiz
          </Link>
          <Link 
            to="/admin/settings" 
            className={cn(
                "flex items-center gap-3 px-4 py-3 rounded-lg transition-all font-medium",
                isActive("/admin/settings") 
                    ? "bg-primary/10 text-primary" 
                    : "text-slate-500 hover:bg-slate-100 hover:text-slate-900"
            )}
          >
            <Settings size={20} />
            Settings
          </Link>
        </nav>
        <div className="p-4 border-t border-slate-100">
            <button className="flex w-full items-center gap-3 px-4 py-3 text-slate-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors font-medium">
                <LogOut size={20} />
                Logout
            </button>
        </div>
      </aside>
      <main className="flex-1 p-8 ml-64 overflow-y-auto">
        <div className="max-w-7xl mx-auto">
            <Outlet />
        </div>
      </main>
    </div>
  );
}

