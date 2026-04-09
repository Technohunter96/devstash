"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Code,
  Sparkles,
  Terminal,
  StickyNote,
  Link2,
  File,
  Image,
  Star,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  FolderOpen,
  Settings,
  X,
} from "lucide-react";
import { mockItemTypes, mockItemTypeCounts, mockCollections, mockUser } from "@/lib/mock-data";

const lucideIconMap: Record<string, React.ElementType> = {
  Code,
  Sparkles,
  Terminal,
  StickyNote,
  Link: Link2,
  File,
  Image,
};

interface SidebarProps {
  isOpen: boolean;
  isCollapsed: boolean;
  onClose: () => void;
  onToggleCollapse: () => void;
}

export default function Sidebar({ isOpen, isCollapsed, onClose, onToggleCollapse }: SidebarProps) {
  const pathname = usePathname();
  const [collectionsOpen, setCollectionsOpen] = useState(true);

  const favoriteCollections = mockCollections.filter((c) => c.isFavorite);
  const otherCollections = mockCollections.filter((c) => !c.isFavorite);

  return (
    <>
      {/* Mobile backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 z-20 bg-black/50 md:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar panel */}
      <aside
        className={[
          "flex flex-col border-r border-border bg-card shrink-0 z-30 transition-all duration-300",
          "fixed md:relative inset-y-0 left-0",
          isOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0",
          isCollapsed ? "md:w-[60px]" : "w-60",
        ].join(" ")}
      >
        {/* Sidebar header */}
        <div className="h-14 flex items-center justify-between px-3 border-b border-border shrink-0">
          {!isCollapsed && (
            <span className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
              Menu
            </span>
          )}
          <div className={isCollapsed ? "w-full flex justify-center" : ""}>
            <button
              onClick={onToggleCollapse}
              className="hidden md:flex items-center justify-center size-7 rounded hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
            >
              {isCollapsed ? <ChevronRight className="size-4" /> : <ChevronLeft className="size-4" />}
            </button>
            <button
              onClick={onClose}
              className="md:hidden flex items-center justify-center size-7 rounded hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
            >
              <X className="size-4" />
            </button>
          </div>
        </div>

        {/* Scrollable content */}
        <div className="flex-1 overflow-y-auto overflow-x-hidden py-3">

          {/* Item Types */}
          <div className="px-3">
            {!isCollapsed && (
              <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground mb-1 px-1">
                Item Types
              </p>
            )}
            <nav className="space-y-0.5">
              {mockItemTypes.map((type) => {
                const Icon = lucideIconMap[type.icon] ?? File;
                const slug = type.name.toLowerCase() + "s";
                const href = `/items/${slug}`;
                const isActive = pathname === href;
                const count = mockItemTypeCounts[type.id] ?? 0;

                return (
                  <Link
                    key={type.id}
                    href={href}
                    title={isCollapsed ? `${type.name} (${count})` : undefined}
                    className={[
                      "flex items-center gap-2 rounded px-2 py-1.5 text-sm transition-colors",
                      isActive
                        ? "bg-muted text-foreground"
                        : "text-muted-foreground hover:bg-muted hover:text-foreground",
                      isCollapsed ? "justify-center" : "",
                    ].join(" ")}
                  >
                    <Icon className="size-4 shrink-0" style={{ color: type.color }} />
                    {!isCollapsed && (
                      <>
                        <span className="flex-1 truncate">{type.name}</span>
                        <div className="flex items-center gap-1">
                          {(type.name === "File" || type.name === "Image") && (
                            <span className="text-[9px] font-bold bg-primary/20 text-primary rounded px-1 py-0.5 leading-none">
                              PRO
                            </span>
                          )}
                          <span className="text-xs text-muted-foreground">{count}</span>
                        </div>
                      </>
                    )}
                  </Link>
                );
              })}
            </nav>
          </div>

          {/* Divider */}
          {!isCollapsed && <div className="mx-3 my-3 border-t border-border" />}
          {isCollapsed && <div className="mx-3 my-3 border-t border-border" />}

          {/* Collections */}
          {!isCollapsed ? (
            <div className="px-3 space-y-1">

              {/* Section title — collapsible */}
              <button
                onClick={() => setCollectionsOpen((v) => !v)}
                className="w-full flex items-center gap-1 px-1 py-0.5 mb-1 hover:text-foreground transition-colors"
              >
                <ChevronDown
                  className={[
                    "size-3.5 text-muted-foreground transition-transform duration-200",
                    collectionsOpen ? "" : "-rotate-90",
                  ].join(" ")}
                />
                <span className="text-xs font-semibold text-foreground">Collections</span>
              </button>

              {collectionsOpen && (
                <div className="space-y-1">
                  {/* Favourites subsection */}
                  <p className="px-2 pt-1 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
                    Favourites
                  </p>
                  <nav className="space-y-0.5">
                    {favoriteCollections.map((col) => (
                      <Link
                        key={col.id}
                        href={`/collections/${col.id}`}
                        className={[
                          "flex items-center gap-2 rounded px-2 py-1.5 text-sm transition-colors",
                          pathname === `/collections/${col.id}`
                            ? "bg-muted text-foreground"
                            : "text-muted-foreground hover:bg-muted hover:text-foreground",
                        ].join(" ")}
                      >
                        <Star className="size-3.5 text-yellow-400 fill-yellow-400 shrink-0" />
                        <span className="flex-1 truncate">{col.name}</span>
                        <span className="text-xs text-muted-foreground shrink-0">{col.itemCount}</span>
                      </Link>
                    ))}
                    {favoriteCollections.length === 0 && (
                      <p className="px-2 py-1 text-xs text-muted-foreground">No favourites yet</p>
                    )}
                  </nav>

                  {/* All Collections subsection */}
                  <p className="px-2 pt-2 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
                    All Collections
                  </p>
                  <nav className="space-y-0.5 pl-3">
                    {otherCollections.map((col) => (
                      <Link
                        key={col.id}
                        href={`/collections/${col.id}`}
                        className={[
                          "flex items-center gap-2 rounded px-2 py-1.5 text-sm transition-colors",
                          pathname === `/collections/${col.id}`
                            ? "bg-muted text-foreground"
                            : "text-muted-foreground hover:bg-muted hover:text-foreground",
                        ].join(" ")}
                      >
                        <FolderOpen className="size-4 shrink-0" />
                        <span className="flex-1 truncate">{col.name}</span>
                        <span className="text-xs text-muted-foreground shrink-0">{col.itemCount}</span>
                      </Link>
                    ))}
                  </nav>
                </div>
              )}

            </div>
          ) : (
            /* Collapsed: just star icon for favourites */
            <div className="px-3">
              <Link
                href="/favourites"
                title="Favourites"
                className="flex items-center justify-center rounded px-2 py-1.5 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
              >
                <Star className="size-4 text-yellow-400" />
              </Link>
            </div>
          )}
        </div>

        {/* User avatar area */}
        <div className="border-t border-border p-3 shrink-0">
          {isCollapsed ? (
            <div className="flex justify-center">
              <div className="size-8 rounded-full bg-muted flex items-center justify-center text-xs font-semibold uppercase">
                {mockUser.name.charAt(0)}
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <div className="size-8 rounded-full bg-muted flex items-center justify-center text-xs font-semibold uppercase shrink-0">
                {mockUser.name.charAt(0)}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{mockUser.name}</p>
                <p className="text-xs text-muted-foreground truncate">{mockUser.email}</p>
              </div>
              <button className="size-7 flex items-center justify-center rounded hover:bg-muted text-muted-foreground hover:text-foreground transition-colors shrink-0">
                <Settings className="size-4" />
              </button>
            </div>
          )}
        </div>
      </aside>
    </>
  );
}
