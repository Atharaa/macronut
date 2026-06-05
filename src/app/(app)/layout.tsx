import { BottomNav } from "@/components/BottomNav";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="mx-auto min-h-screen max-w-md pb-[calc(5.5rem+env(safe-area-inset-bottom))]">
      {children}
      <BottomNav />
    </div>
  );
}
