import { DashboardNav } from "@/components/dashboard-nav";
import { ScrollArea } from "@/components/ui/scroll-area";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex overflow-hidden h-[calc(100vh-64px)]">
      <aside className="w-64 border-r bg-background">
        <DashboardNav />
      </aside>
      <main className="flex-1 overflow-hidden">
        <ScrollArea className="h-full">
          <div className="container p-6">{children}</div>
        </ScrollArea>
      </main>
    </div>
  );
}
