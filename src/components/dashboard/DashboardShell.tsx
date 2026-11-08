"use client";

import { useState } from "react";
import TopBar from "@/components/dashboard/TopBar";
import Sidebar from "@/components/dashboard/Sidebar";
import ItemDrawerProvider from "@/components/dashboard/ItemDrawerProvider";
import SearchProvider from "@/components/dashboard/SearchProvider";
import CommandPalette from "@/components/dashboard/CommandPalette";
import EditorPreferencesProvider from "@/components/dashboard/EditorPreferencesProvider";
import ProProvider from "@/components/dashboard/ProProvider";
import type { SidebarItemType, SidebarCollection } from "@/lib/db/sidebar";

interface DashboardShellProps {
  children: React.ReactNode;
  itemTypes: SidebarItemType[];
  collections: SidebarCollection[];
  user: { name: string; email: string; image?: string | null };
  isPro: boolean;
}

export default function DashboardShell({
  children,
  itemTypes,
  collections,
  user,
  isPro,
}: DashboardShellProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  return (
    <ProProvider isPro={isPro}>
      <EditorPreferencesProvider>
        <SearchProvider>
          <ItemDrawerProvider>
            <CommandPalette />
            <div className="flex flex-col h-full">
              <TopBar onMenuToggle={() => setSidebarOpen((v) => !v)} />
              <div className="flex flex-1 overflow-hidden relative">
                <Sidebar
                  isOpen={sidebarOpen}
                  isCollapsed={sidebarCollapsed}
                  onClose={() => setSidebarOpen(false)}
                  onToggleCollapse={() => setSidebarCollapsed((v) => !v)}
                  itemTypes={itemTypes}
                  collections={collections}
                  user={user}
                />
                <main className="flex-1 overflow-auto">{children}</main>
              </div>
            </div>
          </ItemDrawerProvider>
        </SearchProvider>
      </EditorPreferencesProvider>
    </ProProvider>
  );
}
