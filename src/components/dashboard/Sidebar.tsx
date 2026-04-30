"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import { File, Star, PanelLeftClose, PanelLeftOpen, ChevronDown, LogOut, User, X } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import UserAvatar from "@/components/ui/user-avatar";
import type { SidebarItemType, SidebarCollection } from "@/lib/db/sidebar";
import { ICON_MAP as lucideIconMap } from "@/lib/icon-map";

interface SidebarProps {
  isOpen: boolean;
  isCollapsed: boolean;
  onClose: () => void;
  onToggleCollapse: () => void;
  itemTypes: SidebarItemType[];
  collections: SidebarCollection[];
  user: { name: string; email: string; image?: string | null };
}

export default function Sidebar({
  isOpen,
  isCollapsed,
  onClose,
  onToggleCollapse,
  itemTypes,
  collections,
  user,
}: SidebarProps) {
  const pathname = usePathname();
  const [collectionsOpen, setCollectionsOpen] = useState(true);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const userMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target as Node)) {
        setUserMenuOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const favoriteCollections = collections.filter((c) => c.isFavorite);
  const otherCollections = collections.filter((c) => !c.isFavorite);

  return (
    <>
      {/* Mobile backdrop */}
      {isOpen && <div className="fixed inset-0 z-20 bg-black/50 md:hidden" onClick={onClose} />}

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
              className="hidden md:flex items-center justify-center size-7 rounded hover:bg-muted text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
            >
              {isCollapsed ? (
                <PanelLeftOpen className="size-4" />
              ) : (
                <PanelLeftClose className="size-4" />
              )}
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
              {itemTypes.map((type) => {
                const Icon = lucideIconMap[type.icon] ?? File;
                const slug = type.name.toLowerCase() + "s";
                const href = `/items/${slug}`;
                const isActive = pathname === href;

                return (
                  <Link
                    key={type.id}
                    href={href}
                    title={isCollapsed ? `${type.name} (${type.itemCount})` : undefined}
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
                        <span className="truncate">{type.name}</span>
                        {(type.name === "File" || type.name === "Image") && (
                          <Badge variant="secondary" className="h-4 px-1 text-[9px]">
                            PRO
                          </Badge>
                        )}
                        <span className="flex-1" />
                        <span className="text-xs text-muted-foreground">{type.itemCount}</span>
                      </>
                    )}
                  </Link>
                );
              })}
            </nav>
          </div>

          {/* Divider */}
          <div className="mx-3 my-3 border-t border-border" />

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
                        <span className="text-xs text-muted-foreground shrink-0">
                          {col.itemCount}
                        </span>
                      </Link>
                    ))}
                    {favoriteCollections.length === 0 && (
                      <p className="px-2 py-1 text-xs text-muted-foreground">No favourites yet</p>
                    )}
                  </nav>

                  {/* All Collections subsection */}
                  <p className="px-2 pt-5 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
                    Recents
                  </p>
                  <nav className="space-y-0.5">
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
                        <span
                          className="size-2.5 rounded-full shrink-0"
                          style={{ backgroundColor: col.dominantColor ?? "#6b7280" }}
                        />
                        <span className="flex-1 truncate">{col.name}</span>
                        <span className="text-xs text-muted-foreground shrink-0">
                          {col.itemCount}
                        </span>
                      </Link>
                    ))}
                  </nav>

                  {/* View all collections link */}
                  <Link
                    href="/collections"
                    className="block px-2 pt-2 pb-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
                  >
                    View all collections →
                  </Link>
                </div>
              )}
            </div>
          ) : (
            /* Collapsed: star icon for favourites */
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
        <div className="border-t border-border p-3 shrink-0 relative" ref={userMenuRef}>
          {/* Dropdown menu */}
          {userMenuOpen && (
            <div className="absolute bottom-full left-2 right-2 mb-1 bg-popover border border-border rounded-md shadow-md overflow-hidden z-50">
              <Link
                href="/profile"
                onClick={() => setUserMenuOpen(false)}
                className="flex items-center gap-2 px-3 py-2 text-sm hover:bg-muted transition-colors"
              >
                <User className="size-4 text-muted-foreground" />
                Profile
              </Link>
              <button
                onClick={() => signOut({ callbackUrl: "/sign-in" })}
                className="w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-destructive/10 text-destructive transition-colors text-left cursor-pointer"
              >
                <LogOut className="size-4" />
                Sign out
              </button>
            </div>
          )}

          <button
            onClick={() => setUserMenuOpen((v) => !v)}
            className="w-full cursor-pointer"
          >
            {isCollapsed ? (
              <div className="flex justify-center">
                <UserAvatar name={user.name} image={user.image} size={32} />
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <UserAvatar name={user.name} image={user.image} size={32} />
                <div className="flex-1 min-w-0 text-left">
                  <p className="text-sm font-medium truncate">{user.name}</p>
                  <p className="text-xs text-muted-foreground truncate">{user.email}</p>
                </div>
                <ChevronDown
                  className={[
                    "size-4 text-muted-foreground transition-transform duration-200 shrink-0",
                    userMenuOpen ? "rotate-180" : "",
                  ].join(" ")}
                />
              </div>
            )}
          </button>
        </div>
      </aside>
    </>
  );
}
