import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { MainLayout } from "@/components/MainLayout";
import DashboardPage from "@/pages/DashboardPage";
import TransactionsPage from "@/pages/TransactionsPage";
import NewTransactionPage from "@/pages/NewTransactionPage";
import CalendarPage from "@/pages/CalendarPage";
import BudgetPage from "@/pages/BudgetPage";
import GoalsPage from "@/pages/GoalsPage";
import GroupsPage from "@/pages/GroupsPage";
import AccountsPage from "@/pages/AccountsPage";
import InsightsPage from "@/pages/InsightsPage";
import SettingsPage from "@/pages/SettingsPage";
import NotFound from "@/pages/NotFound";
import { useEffect } from "react";
import { useStore } from "@/store/useStore";

const queryClient = new QueryClient();

function ThemeInitializer({ children }: { children: React.ReactNode }) {
  const theme = useStore((s) => s.theme);
  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark');
  }, [theme]);
  return <>{children}</>;
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <ThemeInitializer>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route element={<MainLayout />}>
              <Route path="/" element={<DashboardPage />} />
              <Route path="/transactions" element={<TransactionsPage />} />
              <Route path="/transactions/new" element={<NewTransactionPage />} />
              <Route path="/calendar" element={<CalendarPage />} />
              <Route path="/budget" element={<BudgetPage />} />
              <Route path="/goals" element={<GoalsPage />} />
              <Route path="/groups" element={<GroupsPage />} />
              <Route path="/accounts" element={<AccountsPage />} />
              <Route path="/insights" element={<InsightsPage />} />
              <Route path="/settings" element={<SettingsPage />} />
            </Route>
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </ThemeInitializer>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
