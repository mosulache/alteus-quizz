import { Outlet } from "react-router-dom";

export function MobileLayout() {
  return (
    <div className="min-h-screen bg-slate-100 flex flex-col items-center justify-center p-0 sm:p-4">
      <div className="w-full max-w-md bg-white sm:shadow-xl sm:rounded-2xl overflow-hidden min-h-screen sm:min-h-[700px] flex flex-col relative">
        <header className="bg-primary p-4 text-primary-foreground text-center font-bold text-lg shadow-sm z-10">
          Alteus Quizzer
        </header>
        <main className="flex-1 p-6 flex flex-col relative">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

