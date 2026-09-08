"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { MiniCalendar } from "./MiniCalendar";
import { SharedWorkspace } from "@/components/SharedWorkspace";
import { TagCreatorInline } from "@/components/TagCreatorInline";
import type { Tag } from "@/lib/tags";
import type { Tables } from "@/types/database";

type Group = Tables<"groups">;

type SidebarProps = {
  open: boolean;
  viewDate: Date;
  onCreateEvent: () => void;
  activeTagIds: string[];
  onTagToggle: (id: string) => void;
  tags: Tag[];
  onCreateTag: (name: string, color: string) => Promise<void>;
  groups: Group[];
  activeGroupId: string | null;
  onSelectGroup: (groupId: string) => void;
  onCreateGroup: (name: string) => Promise<void>;
  onJoinGroup: (inviteCode: string) => Promise<void>;
  canCreateEvent: boolean;
};

export function Sidebar({
  open,
  viewDate,
  onCreateEvent,
  activeTagIds,
  onTagToggle,
  tags,
  onCreateTag,
  groups,
  activeGroupId,
  onSelectGroup,
  onCreateGroup,
  onJoinGroup,
  canCreateEvent,
}: SidebarProps) {
  const allOn = tags.length > 0 && activeTagIds.length === tags.length;
  const [filtersOpen, setFiltersOpen] = useState(true);

  function toggleAll() {
    if (allOn) {
      tags.forEach((t) => { if (activeTagIds.includes(t.id)) onTagToggle(t.id); });
    } else {
      tags.forEach((t) => { if (!activeTagIds.includes(t.id)) onTagToggle(t.id); });
    }
  }

  return (
    <AnimatePresence initial={false}>
      {open && (
        <motion.aside
          key="sidebar"
          initial={{ width: 0, opacity: 0 }}
          animate={{ width: "var(--sidebar-width)", opacity: 1 }}
          exit={{ width: 0, opacity: 0 }}
          transition={{ type: "spring", bounce: 0, duration: 0.35 }}
          className="shrink-0 overflow-hidden"
          aria-hidden={!open}
          style={{
            borderRight: "1px solid var(--separator)",
            background: "var(--glass-bg)",
            backdropFilter: "var(--glass-blur)",
            WebkitBackdropFilter: "var(--glass-blur)",
          }}
        >
          <div className="flex h-full w-[var(--sidebar-width)] flex-col gap-3 overflow-y-auto p-3">

            {/* Create Event button */}
            <button
              type="button"
              onClick={onCreateEvent}
              disabled={!canCreateEvent}
              title={canCreateEvent ? "Create event" : "Join or create a calendar first"}
              className="pressable flex w-full items-center justify-center gap-2 px-4 py-2.5 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-40"
              style={{
                borderRadius: "var(--radius-xl)",
                background: "var(--accent)",
                boxShadow: "0 2px 12px var(--accent-muted), var(--shadow-sm)",
                letterSpacing: "-0.004em",
              }}
            >
              <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                <path d="M12 5v14M5 12h14" />
              </svg>
              Create Event
            </button>

            {/* Shared workspace */}
            <SharedWorkspace
              groups={groups}
              activeGroupId={activeGroupId}
              onSelectGroup={onSelectGroup}
              onCreateGroup={onCreateGroup}
              onJoinGroup={onJoinGroup}
            />

            {/* Mini calendar */}
            <MiniCalendar viewDate={viewDate} />

            {/* Tag filters */}
            <div
              className="flex flex-col gap-0"
              style={{
                borderRadius: "var(--radius-xl)",
                border: "1px solid var(--border)",
                background: "var(--surface)",
              }}
            >
              <button
                type="button"
                onClick={() => setFiltersOpen((v) => !v)}
                aria-expanded={filtersOpen}
                aria-controls="sidebar-filters-body"
                className="pressable flex w-full items-center justify-between px-3 py-2.5"
                style={{ background: "transparent", borderRadius: "var(--radius-xl) var(--radius-xl) 0 0" }}
              >
                <p className="text-label" style={{ color: "var(--text-muted)" }}>
                  Filters
                </p>
                <div className="flex items-center gap-2">
                  {filtersOpen && tags.length > 0 && (
                    <span
                      role="button"
                      tabIndex={0}
                      onClick={(e) => { e.stopPropagation(); toggleAll(); }}
                      onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.stopPropagation(); toggleAll(); } }}
                      className="pressable text-xs font-semibold"
                      style={{ color: "var(--accent)", letterSpacing: "-0.004em" }}
                    >
                      {allOn ? "Clear all" : "Select all"}
                    </span>
                  )}
                  <motion.svg
                    animate={{ rotate: filtersOpen ? 0 : -90 }}
                    transition={{ type: "spring", bounce: 0, duration: 0.25 }}
                    viewBox="0 0 16 16"
                    className="h-3.5 w-3.5 shrink-0"
                    style={{ color: "var(--text-muted)" }}
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    aria-hidden
                  >
                    <path d="M4 6l4 4 4-4" />
                  </motion.svg>
                </div>
              </button>

              {/* Animated collapsible body */}
              <motion.div
                id="sidebar-filters-body"
                initial={false}
                animate={{ height: filtersOpen ? "auto" : 0 }}
                transition={{ type: "spring", bounce: 0, duration: 0.3 }}
                style={{ overflow: "hidden" }}
              >
                <div className="flex flex-col gap-0.5 px-2 pb-2">
                  {tags.length === 0 && (
                    <p className="px-2 py-1.5 text-xs" style={{ color: "var(--text-muted)" }}>
                      No tags yet — create one below.
                    </p>
                  )}

                  {tags.map((tag) => {
                    const active = activeTagIds.includes(tag.id);
                    return (
                      <label
                        key={tag.id}
                        htmlFor={`tag-${tag.id}`}
                        className="pressable flex cursor-pointer items-center gap-2.5 rounded-lg px-2 py-1.5 text-sm"
                        style={{
                          background: active ? `color-mix(in srgb, ${tag.color} 12%, transparent)` : "transparent",
                          letterSpacing: "-0.004em",
                        }}
                      >
                        <span
                          className="relative flex h-4 w-4 shrink-0 items-center justify-center"
                          style={{
                            borderRadius: "var(--radius-xs)",
                            border: active ? "none" : `1.5px solid ${tag.color}`,
                            background: active ? tag.color : "transparent",
                          }}
                        >
                          {active && (
                            <svg viewBox="0 0 12 12" className="h-2.5 w-2.5" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                              <path d="M2 6l3 3 5-5" />
                            </svg>
                          )}
                        </span>
                        <input id={`tag-${tag.id}`} type="checkbox" checked={active} onChange={() => onTagToggle(tag.id)} className="sr-only" />
                        <span className="h-2 w-2 shrink-0 rounded-full" style={{ background: tag.color }} />
                        <span style={{ color: "var(--foreground)", fontWeight: 500 }}>{tag.name}</span>
                      </label>
                    );
                  })}

                  {activeGroupId && (
                    <div className="mt-1">
                      <TagCreatorInline onAdd={onCreateTag} />
                    </div>
                  )}
                </div>
              </motion.div>
            </div>

          </div>
        </motion.aside>
      )}
    </AnimatePresence>
  );
}
