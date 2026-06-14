import { Link, useLocation } from 'react-router-dom';
import {
  LayoutDashboard, ArrowLeftRight, Calendar, PiggyBank, Target,
  Users, CreditCard, Sparkles, Settings, Plus, LogOut, Wallet
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import {
  Sidebar, SidebarContent, SidebarFooter, SidebarGroup, SidebarGroupContent,
  SidebarMenu, SidebarMenuButton, SidebarMenuItem, SidebarHeader, useSidebar,
} from '@/components/ui/sidebar';
import { useAuth } from '@/hooks/useAuth';
import { useProfile } from '@/hooks/useSupabaseData';

const navItems = [
  { title: 'Dashboard', url: '/app', icon: LayoutDashboard },
  { title: 'Transações', url: '/app/transactions', icon: ArrowLeftRight },
  { title: 'Calendário', url: '/app/calendar', icon: Calendar },
  { title: 'Orçamento', url: '/app/budget', icon: PiggyBank },
  { title: 'Metas', url: '/app/goals', icon: Target },
  { title: 'Grupos', url: '/app/groups', icon: Users },
  { title: 'Contas', url: '/app/accounts', icon: CreditCard },
  { title: 'Insights', url: '/app/insights', icon: Sparkles },
  { title: 'Configurações', url: '/app/settings', icon: Settings },
];

export function AppSidebar() {
  const location = useLocation();
  const { state } = useSidebar();
  const collapsed = state === 'collapsed';
  const { user, signOut } = useAuth();
  const { data: profile } = useProfile();

  const displayName = profile?.name || user?.user_metadata?.name || user?.email?.split('@')[0] || '';
  const initials = displayName.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2);

  return (
    <Sidebar collapsible="icon" className="border-r border-border">
      <SidebarHeader className="p-4">
        <Link to="/app" className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
            <Wallet size={18} className="text-primary-foreground" />
          </div>
          {!collapsed && <span className="font-bold text-lg">FinanceEasy</span>}
        </Link>
      </SidebarHeader>

      <SidebarContent className="px-2">
        {!collapsed && (
          <div className="px-2 mb-3">
            <Link to="/app/transactions/new">
              <Button className="w-full gap-2" size="sm">
                <Plus size={16} /> Nova Transação
              </Button>
            </Link>
          </div>
        )}

        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {navItems.map((item) => {
                const isActive = location.pathname === item.url ||
                  (item.url !== '/app' && location.pathname.startsWith(item.url));
                return (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton asChild>
                      <Link
                        to={item.url}
                        className={cn(
                          'flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors',
                          isActive
                            ? 'bg-primary/10 text-primary font-medium'
                            : 'text-muted-foreground hover:text-foreground hover:bg-accent'
                        )}
                      >
                        <item.icon size={18} />
                        {!collapsed && <span>{item.title}</span>}
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="p-4 border-t border-border">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-sm font-bold text-primary">
            {initials || '?'}
          </div>
          {!collapsed && (
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">{displayName}</p>
              <p className="text-xs text-muted-foreground truncate">{user?.email}</p>
            </div>
          )}
          {!collapsed && (
            <button onClick={signOut} className="text-muted-foreground hover:text-foreground transition-colors" title="Sair">
              <LogOut size={16} />
            </button>
          )}
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}
