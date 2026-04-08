import { Link, useLocation } from 'react-router-dom';
import { LayoutDashboard, ArrowLeftRight, CalendarDays, PiggyBank, Target } from 'lucide-react';
import { cn } from '@/lib/utils';

const items = [
  { title: 'Home', url: '/', icon: LayoutDashboard },
  { title: 'Transações', url: '/transactions', icon: ArrowLeftRight },
  { title: 'Calendário', url: '/calendar', icon: CalendarDays },
  { title: 'Orçamento', url: '/budget', icon: PiggyBank },
  { title: 'Metas', url: '/goals', icon: Target },
];

export function MobileBottomNav() {
  const location = useLocation();
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-card border-t border-border md:hidden">
      <div className="flex items-center justify-around py-2">
        {items.map((item) => {
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
      </div>
    </nav>
  );
}
