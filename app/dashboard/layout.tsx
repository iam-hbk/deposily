// import { Providers } from "./providers";
import { DashboardNav } from "@/components/dashboard-nav";
// import { UserNav } from "@/components/user-nav";

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    // <Providers>
    <div className="flex h-screen border">
      <DashboardNav />
      <div className="flex-1 flex flex-col">
        <header className="border-b">
          <div className="flex h-16 items-center px-4">{/* <UserNav /> */}</div>
        </header>
        <main className="flex-1 overflow-y-auto p-6">{children}</main>
      </div>
    </div>
    // </Providers>
  );
}
