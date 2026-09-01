"use client";

import { useState } from "react";
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
  /** Real tag IDs currently active (shown on calendar) */
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
      tags.forEach((t) => {
        if (activeTagIds.includes(t.id)) onTagToggle(t.id);
      });
    } else {
      tags.forEach((t) => {
        if (!activeTagIds.includes(t.id)) onTagToggle(t.id);
      });
    }
  }

  return (
    <aside
      className={`shrink-0 overflow-hidden transition-[width] duration-300 ease-out ${
        open ? "w-64" : "w-0"
      }`}
      aria-hidden={!open}
      style={{
        borderRight: open ? "1.5px solid var(--border)" : "none",
        background: "var(--surface)",
      }}
    >
      <div className="flex h-full w-64 flex-col gap-4 overflow-y-auto p-4 animate-fade-in">
        <button
          type="button"
          onClick={onCreateEvent}
          disabled={!canCreateEvent}
          title={
            canCreateEvent
              ? "Create event"
              : "Join or create a calendar first"
          }
          className="btn-bounce flex w-full cursor-pointer items-center justify-center gap-2 px-4 py-2.5 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-50"
          style={{
            borderRadius: "var(--radius-xl)",
            background: "var(--accent)",
            boxShadow: "var(--shadow-md)",
          }}
        >
          <svg
            viewBox="0 0 24 24"
            className="h-4 w-4"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
          >
            <path d="M12 5v14M5 12h14" />
          </svg>
          Create Event
        </button>

        <SharedWorkspace
          groups={groups}
          activeGroupId={activeGroupId}
          onSelectGroup={onSelectGroup}
          onCreateGroup={onCreateGroup}
          onJoinGroup={onJoinGroup}
        />

        <MiniCalendar viewDate={viewDate} />

        {/* Tag Filters — matches SharedWorkspace card style */}
        <div
          className="flex flex-col gap-0"
          style={{
            borderRadius: "var(--radius-xl)",
            border: "1.5px solid var(--border)",
            background: "var(--surface-2)",
          }}
        >
          {/* Header - always visible, click to collapse */}
          <button
            type="button"
            onClick={() => setFiltersOpen((v) => !v)}
            aria-expanded={filtersOpen}
            aria-controls="sidebar-filters-body"
            className="flex w-full cursor-pointer items-center justify-between px-3 py-2.5"
            style={{ background: "transparent" }}
          >
            <p
              className="text-xs font-semibold uppercase tracking-wider"
              style={{ color: "var(--text-muted)" }}
            >
              Filters
            </p>
            <div className="flex items-center gap-2">
              {filtersOpen && tags.length > 0 && (
                <span
                  role="button"
                  tabIndex={0}
                  onClick={(e) => { e.stopPropagation(); toggleAll(); }}
                  onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.stopPropagation(); toggleAll(); } }}
                  className="cursor-pointer text-xs font-semibold"
                  style={{ color: "var(--accent)" }}
                >
                  {allOn ? "Clear all" : "Select all"}
                </span>
              )}
              <svg
                viewBox="0 0 16 16"
                className="h-3.5 w-3.5 shrink-0 transition-transform duration-200"
                style={{
                  transform: filtersOpen ? "rotate(0deg)" : "rotate(-90deg)",
                  color: "var(--text-muted)",
                }}
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden
              >
                <path d="M4 6l4 4 4-4" />
              </svg>
            </div>
          </button>

          {/* Collapsible body */}
          <div
            id="sidebar-filters-body"
            style={{
              overflow: "hidden",
              maxHeight: filtersOpen ? "600px" : "0px",
              transition: "max-height 0.25s ease-in-out",
            }}
          >
            <div className="flex flex-col gap-1 px-3 pb-3">
              {tags.length === 0 && (
                <p
                  className="px-2 py-1 text-xs"
                  style={{ color: "var(--text-muted)" }}
                >
                  No tags yet - create one below.
                </p>
              )}

              {tags.map((tag) => {
                const active = activeTagIds.includes(tag.id);
                return (
                  <label
                    key={tag.id}
                    htmlFor={`tag-${tag.id}`}
                    className="flex cursor-pointer items-center gap-2.5 rounded-xl px-2 py-1.5 text-sm font-medium"
                    style={{
                      background: active ? `${tag.color}18` : "transparent",
                    }}
                  >
                    <span
                      className="relative flex h-4 w-4 shrink-0 items-center justify-center"
                      style={{
                        borderRadius: "var(--radius-sm)",
                        border: active ? "none" : `2px solid ${tag.color}`,
                        background: active ? tag.color : "transparent",
                      }}
                    >
                      {active && (
                        <svg
                          viewBox="0 0 12 12"
                          className="h-2.5 w-2.5"
                          fill="none"
                          stroke="white"
                          strokeWidth="2.5"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        >
                          <path d="M2 6l3 3 5-5" />
                        </svg>
                      )}
                    </span>
                    <input
                      id={`tag-${tag.id}`}
                      type="checkbox"
                      checked={active}
                      onChange={() => onTagToggle(tag.id)}
                      className="sr-only"
                    />
                    <span
                      className="h-2.5 w-2.5 shrink-0 rounded-full"
                      style={{ background: tag.color }}
                    />
                    <span style={{ color: "var(--foreground)" }}>{tag.name}</span>
                  </label>
                );
              })}

              {/* Inline tag creator - only shown when in a group */}
              {activeGroupId && (
                <div className="mt-1">
                  <TagCreatorInline onAdd={onCreateTag} />
                </div>
              )}
            </div>
          </div>
        </div>

      </div>
    </aside>
  );
}
