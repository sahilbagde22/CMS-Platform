import { Sidebar } from '@/components/layout/Sidebar';
import { TopBar } from '@/components/layout/TopBar';
import { CommandPaletteProvider } from '@/components/layout/CommandPalette';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <CommandPaletteProvider>
      <div className="flex h-screen bg-slate-950 overflow-hidden">
        <Sidebar />
        <div className="flex flex-col flex-1 min-w-0">
          <TopBar />
          <main className="flex-1 overflow-y-auto bg-slate-950">
            {children}
          </main>
        </div>
      </div>
    </CommandPaletteProvider>
  );
}
