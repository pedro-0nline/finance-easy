import { Link, useLocation } from 'react-router-dom';
import {
  LayoutDashboard, ArrowLeftRight, CalendarDays, PiggyBank, Target,
  Users, CreditCard, Sparkles, Settings, MoreHorizontal
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useState } from 'react';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';

const mainItems = [
  { title: 'Home', url: '/app', icon: LayoutDashboard },
  { title: 'Transações', url: '/app/transactions', icon: ArrowLeftRight },
  { title: 'Calendário', url: '/app/calendar', icon: CalendarDays },
  { title: 'Orçamento', url: '/app/budget', icon: PiggyBank },
];

const moreItems = [
  { title: 'Metas', url: '/app/goals', icon: Target },
  { title: 'Grupos', url: '/app/groups', icon: Users },
  { title: 'Contas', url: '/app/accounts', icon: CreditCard },
  { title: 'Insights', url: '/app/insights', icon: Sparkles },
  { title: 'Configurações', url: '/app/settings', icon: Settings },
];

export function MobileBottomNav() {
  const location = useLocation();
  const [open, setOpen] = useState(false);
  const isMoreActive = moreItems.some(i => location.pathname === i.url || (i.url !== '/' && location.pathname.startsWith(i.url)));

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-card border-t border-border md:hidden">
      <div className="flex items-center justify-around py-2">
        {mainItems.map((item) => {
          const isActive = location.pathname === item.url;
          return (
            <Link
              key={item.url}
              to={item.url}
              className={cn(
                'flex flex-col items-center gap-1 px-3 py-1 text-xs transition-colors',
                isActive ? 'text-primary' : 'text-muted-foreground'
              )}
            >
              <item.icon size={20} />
              <span>{item.title}</span>
            </Link>
          );
        })}

        <Sheet open={open} onOpenChange={setOpen}>
          <SheetTrigger asChild>
            <button
              className={cn(
                'flex flex-col items-center gap-1 px-3 py-1 text-xs transition-colors',
                isMoreActive ? 'text-primary' : 'text-muted-foreground'
              )}
            >
              <MoreHorizontal size={20} />
              <span>Mais</span>
            </button>
          </SheetTrigger>
          <SheetContent side="bottom" className="pb-8">
            <div className="grid grid-cols-3 gap-4 pt-4">
              {moreItems.map((item) => {
                const isActive = location.pathname === item.url;
                return (
                  <Link
                    key={item.url}
                    to={item.url}
                    onClick={() => setOpen(false)}
                    className={cn(
                      'flex flex-col items-center gap-2 p-3 rounded-lg transition-colors',
                      isActive ? 'bg-primary/10 text-primary' : 'text-muted-foreground hover:bg-accent'
                    )}
                  >
                    <item.icon size={24} />
                    <span className="text-xs font-medium">{item.title}</span>
                  </Link>
                );
              })}
            </div>
          </SheetContent>
        </Sheet>
      </div>
    </nav>
  );
}
