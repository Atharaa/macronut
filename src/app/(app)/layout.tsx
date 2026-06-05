import { BottomNav } from "@/components/BottomNav";
import { ThemeToggle } from "@/components/ThemeToggle";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="mx-auto min-h-screen max-w-md pb-[calc(5.5rem+env(safe-area-inset-bottom))]">
      <div className="flex justify-end px-4 pt-3">
        <ThemeToggle />
      </div>
      {children}
      <BottomNav />
    </div>
  );
}
