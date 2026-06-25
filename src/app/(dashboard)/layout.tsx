import { DataProvider } from "@/lib/store";
import AppShell from "@/components/AppShell";

// Dashboard section: data + sidebar/topbar shell. The public landing and login
// pages live outside this group and render without the shell.
export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <DataProvider>
      <AppShell>{children}</AppShell>
    </DataProvider>
  );
}
