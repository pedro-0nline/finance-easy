import { useEffect } from 'react';
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

const navItems = [
  { title: 'Dashboard', url: '/', icon: LayoutDashboard },
  { title: 'Transações', url: '/transactions', icon: ArrowLeftRight },
  { title: 'Calendário', url: '/calendar', icon: Calendar },
  { title: 'Orçamento', url: '/budget', icon: PiggyBank },
  { title: 'Metas', url: '/goals', icon: Target },
  { title: 'Grupos', url: '/groups', icon: Users },
  { title: 'Contas', url: '/accounts', icon: CreditCard },
  { title: 'Insights', url: '/insights', icon: Sparkles },
  { title: 'Configurações', url: '/settings', icon: Settings },
];

export function AppSidebar() {
  const location = useLocation();
  const { state } = useSidebar();
  const collapsed = state === 'collapsed';

  return (
    <Sidebar collapsible="icon" className="border-r border-border">
      <SidebarHeader className="p-4">
        <Link to="/" className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
            <Wallet size={18} className="text-primary-foreground" />
          </div>
          {!collapsed && <span className="font-bold text-lg">FinControl</span>}
        </Link>
      </SidebarHeader>

      <SidebarContent className="px-2">
        {!collapsed && (
          <div className="px-2 mb-3">
            <Link to="/transactions/new">
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
                  (item.url !== '/' && location.pathname.startsWith(item.url));
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
            JS
          </div>
          {!collapsed && (
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">João Silva</p>
              <p className="text-xs text-muted-foreground truncate">joao@email.com</p>
            </div>
          )}
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}
