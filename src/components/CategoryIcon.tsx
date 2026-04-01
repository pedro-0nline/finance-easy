import { UtensilsCrossed, Heart, Car, GraduationCap, Gamepad2, Home, Zap, MoreHorizontal, type LucideIcon } from 'lucide-react';
import type { Category } from '@/types';
import { categoryConfig } from '@/lib/categories';

const iconMap: Record<string, LucideIcon> = {
  UtensilsCrossed, Heart, Car, GraduationCap, Gamepad2, Home, Zap, MoreHorizontal,
};

interface CategoryIconProps {
  category: Category;
  size?: number;
  className?: string;
}

export function CategoryIcon({ category, size = 18, className }: CategoryIconProps) {
  const config = categoryConfig[category];
  const Icon = iconMap[config.icon];
  return (
    <div
      className={`inline-flex items-center justify-center rounded-lg ${className}`}
      style={{ backgroundColor: config.color + '20', color: config.color, width: size + 14, height: size + 14 }}
    >
      <Icon size={size} />
    </div>
  );
}
