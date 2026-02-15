// lib/severity.ts

export const SEVERITY_CONFIG = {
  critical: {
    bg: "bg-red-50",
    border: "border-red-200",
    text: "text-red-800",
    badge: "bg-red-600",
    badgeText: "text-white",
    icon: "🔴",
    dot: "bg-red-600",
  },
  high: {
    bg: "bg-orange-50",
    border: "border-orange-200",
    text: "text-orange-800",
    badge: "bg-orange-600",
    badgeText: "text-white",
    icon: "🟠",
    dot: "bg-orange-600",
  },
  medium: {
    bg: "bg-yellow-50",
    border: "border-yellow-200",
    text: "text-yellow-800",
    badge: "bg-yellow-600",
    badgeText: "text-white",
    icon: "🟡",
    dot: "bg-yellow-600",
  },
  low: {
    bg: "bg-blue-50",
    border: "border-blue-200",
    text: "text-blue-800",
    badge: "bg-blue-600",
    badgeText: "text-white",
    icon: "🔵",
    dot: "bg-blue-600",
  },
  info: {
    bg: "bg-gray-50",
    border: "border-gray-200",
    text: "text-gray-600",
    badge: "bg-gray-500",
    badgeText: "text-white",
    icon: "⚪",
    dot: "bg-gray-500",
  },
} as const;
