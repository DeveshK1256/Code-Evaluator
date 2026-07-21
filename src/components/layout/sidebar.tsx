"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils/cn";
import { useSidebarStore } from "@/stores/sidebar-store";
import { NAV_ITEMS } from "@/constants";
import { Button } from "@/components/ui/button";
import {
  LayoutDashboard,
  GitBranch,
  Search,
  BarChart3,
  FileText,
  Settings,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import * as React from "react";

const iconMap: Record<string, React.ReactNode> = {
  LayoutDashboard: <LayoutDashboard className="h-4 w-4" />,
  GitBranch: <GitBranch className="h-4 w-4" />,
  Search: <Search className="h-4 w-4" />,
  BarChart3: <BarChart3 className="h-4 w-4" />,
  FileText: <FileText className="h-4 w-4" />,
  Settings: <Settings className="h-4 w-4" />,
};

export function Sidebar() {
  const pathname = usePathname();
  const { isCollapsed, toggleCollapse } = useSidebarStore();

  return (
    <aside
      className={cn(
        "fixed left-0 top-16 z-30 flex h-[calc(100vh-4rem)] flex-col border-r bg-sidebar transition-all duration-300",
        isCollapsed ? "w-16" : "w-60"
      )}
    >
      <nav className="flex-1 space-y-1 p-2" aria-label="Main navigation">
        {NAV_ITEMS.map((item) => {
          const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                isActive
                  ? "bg-sidebar-accent text-sidebar-accent-foreground"
                  : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
              )}
              title={isCollapsed ? item.label : undefined}
            >
              {iconMap[item.icon] ?? <LayoutDashboard className="h-4 w-4" />}
              {!isCollapsed && <span>{item.label}</span>}
            </Link>
          );
        })}
      </nav>
      <div className="border-t p-2">
        <Button
          variant="ghost"
          size="icon"
          onClick={toggleCollapse}
          className="w-full justify-center"
          aria-label={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          {isCollapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
        </Button>
      </div>
    </aside>
  );
}
