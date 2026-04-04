import {
  UtensilsCrossed, Heart, Car, GraduationCap, Gamepad2, Home, Zap, MoreHorizontal,
  Tag, ShoppingCart, Coffee, Briefcase, Music, Plane, Gift, BookOpen, Smartphone,
  Dumbbell, Baby, PawPrint, Wrench, Scissors, Shirt, Flame, Droplets,
  type LucideIcon,
} from 'lucide-react';

const iconMap: Record<string, LucideIcon> = {
  UtensilsCrossed, Heart, Car, GraduationCap, Gamepad2, Home, Zap, MoreHorizontal,
  Tag, ShoppingCart, Coffee, Briefcase, Music, Plane, Gift, BookOpen, Smartphone,
  Dumbbell, Baby, PawPrint, Wrench, Scissors, Shirt, Flame, Droplets,
};

export const availableIcons = Object.keys(iconMap);

export function getIconComponent(iconName: string): LucideIcon {
  return iconMap[iconName] || Tag;
}

interface CategoryIconProps {
  icon: string;
  color: string;
  size?: number;
  className?: string;
}

export function CategoryIcon({ icon, color, size = 18, className }: CategoryIconProps) {
  const Icon = getIconComponent(icon);
  return (
    <div
      className={`inline-flex items-center justify-center rounded-lg ${className}`}
      style={{ backgroundColor: color + '20', color, width: size + 14, height: size + 14 }}
    >
      <Icon size={size} />
    </div>
  );
}

/** Convenience: resolve category slug to icon+color using a categories map */
interface CategoryIconBySlugProps {
  category: string;
  categories: Record<string, { icon: string; color: string; label: string }>;
  size?: number;
  className?: string;
}

export function CategoryIconBySlug({ category, categories, size, className }: CategoryIconBySlugProps) {
  const config = categories[category] || { icon: 'Tag', color: '#94A3B8', label: category };
  return <CategoryIcon icon={config.icon} color={config.color} size={size} className={className} />;
}
