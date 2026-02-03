"use client";

import * as LucideIcons from "lucide-react";
import { Check } from "lucide-react";

const POPULAR_ICONS = [

  "ShoppingCart", "ShoppingBag", "Store", "Package",

  "Home", "Building", "Building2", "Key",

  "UtensilsCrossed", "Coffee", "Pizza", "Salad",

  "Car", "Bus", "Bike", "Plane", "Train", "Fuel",

  "Lightbulb", "Droplets", "Wifi", "Phone", "Smartphone",

  "Play", "Gamepad2", "Music", "Film", "Tv", "Ticket",

  "Heart", "HeartPulse", "Pill", "Stethoscope", "Activity",

  "GraduationCap", "BookOpen", "Library", "PenTool",

  "Laptop", "Briefcase", "Wallet", "Calculator",

  "CreditCard", "Banknote", "PiggyBank", "TrendingUp", "TrendingDown",
  "CircleDollarSign", "Receipt", "Landmark",

  "Shirt", "Gift", "Watch", "Gem",

  "Dog", "Cat", "PawPrint",

  "Tag", "Tags", "Star", "Zap", "ArrowLeftRight",
  "MoreHorizontal", "HelpCircle", "Sparkles",
];

interface IconPickerProps {
  value: string;
  onChange: (icon: string) => void;
  color?: string;
}

export function IconPicker({ value, onChange, color = "#8B5CF6" }: IconPickerProps) {
  return (
    <div className="grid grid-cols-8 gap-2 max-h-48 overflow-y-auto p-1">
      {POPULAR_ICONS.map((iconName) => {
        const IconComponent = LucideIcons[iconName as keyof typeof LucideIcons] as React.ComponentType<{ className?: string }>;

        if (!IconComponent) return null;

        const isSelected = value === iconName;

        return (
          <button
            key={iconName}
            type="button"
            onClick={() => onChange(iconName)}
            className={`w-9 h-9 rounded-lg flex items-center justify-center transition-all ${
              isSelected
                ? "ring-2 ring-offset-2 ring-offset-[var(--bg-secondary)] ring-[var(--color-primary)]"
                : "hover:bg-[var(--bg-hover)]"
            }`}
            style={{
              backgroundColor: isSelected ? `${color}20` : undefined,
            }}
            title={iconName}
          >
            {isSelected ? (
              <div className="relative">
                <IconComponent className="w-5 h-5" />
                <Check
                  className="w-3 h-3 absolute -bottom-1 -right-1 rounded-full p-0.5"
                  style={{ backgroundColor: color, color: "white" }}
                />
              </div>
            ) : (
              <IconComponent className="w-5 h-5 text-[var(--text-muted)]" />
            )}
          </button>
        );
      })}
    </div>
  );
}

export function DynamicIcon({
  name,
  className,
  style,
}: {
  name: string;
  className?: string;
  style?: React.CSSProperties;
}) {
  const IconComponent = LucideIcons[name as keyof typeof LucideIcons] as React.ComponentType<{
    className?: string;
    style?: React.CSSProperties;
  }>;

  if (!IconComponent) {
    const FallbackIcon = LucideIcons.Tag;
    return <FallbackIcon className={className} style={style} />;
  }

  return <IconComponent className={className} style={style} />;
}
