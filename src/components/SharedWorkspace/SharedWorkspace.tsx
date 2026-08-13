"use client";

import { useState } from "react";
import type { Tables } from "@/types/database";

type Group = Tables<"groups">;

type SharedWorkspaceProps = {
  groups: Group[];
  activeGroupId: string | null;
  onSelectGroup: (groupId: string) => void;
  onCreateGroup: (name: string) => Promise<void>;
  onJoinGroup: (inviteCode: string) => Promise<void>;
};

export function SharedWorkspace({
  groups,
  activeGroupId,
  onSelectGroup,
  onCreateGroup,
  onJoinGroup,
}: SharedWorkspaceProps) {
  const [groupName, setGroupName] = useState("");
  const [inviteCode, setInviteCode] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  /** Whether the whole section is collapsed */
  const [collapsed, setCollapsed] = useState(false);
  /** Whether the invite code is revealed */
  const [codeVisible, setCodeVisible] = useState(false);

  const activeGroup = groups.find((g) => g.id === activeGroupId) ?? null;

  async function handleCreate() {
    if (!groupName.trim()) return;
    setBusy(true);
    setError(null);
    try {
      await onCreateGroup(groupName.trim());
      setGroupName("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not create calendar.");
    } finally {
      setBusy(false);
    }
  }

  async function handleJoin() {
    if (!inviteCode.trim()) return;
    setBusy(true);
    setError(null);
    try {
      await onJoinGroup(inviteCode.trim());
      setInviteCode("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not join calendar.");
    } finally {
      setBusy(false);
    }
  }

  async function copyInvite() {
    if (!activeGroup) return;
    await navigator.clipboard.writeText(activeGroup.invite_code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div
      className="flex flex-col gap-0"
      style={{
        borderRadius: "var(--radius-xl)",
        border: "1.5px solid var(--border)",
        background: "var(--surface-2)",
      }}
    >
      {/* Header — always visible, click to collapse */}
      <button
        type="button"
        onClick={() => setCollapsed((c) => !c)}
        className="flex w-full cursor-pointer items-center justify-between px-3 py-2.5"
        style={{ background: "transparent" }}
      >
        <p
          className="text-xs font-semibold uppercase tracking-wider"
          style={{ color: "var(--text-muted)" }}
        >
          Shared calendars
        </p>
        {/* Chevron icon — rotates when open */}
        <svg
          viewBox="0 0 16 16"
          className="h-3.5 w-3.5 shrink-0 transition-transform duration-200"
          style={{
            transform: collapsed ? "rotate(-90deg)" : "rotate(0deg)",
            color: "var(--text-muted)",
          }}
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M4 6l4 4 4-4" />
        </svg>
      </button>

      {/* Collapsible body — max-height transition keeps elements in the DOM */}
      <div
        style={{
          overflow: "hidden",
          maxHeight: collapsed ? "0px" : "600px",
          transition: "max-height 0.25s ease-in-out",
        }}
      >
        <div className="flex flex-col gap-3 px-3 pb-3">
          <p className="text-xs" style={{ color: "var(--text-secondary)" }}>
            Sync events with another account using an invite code.
          </p>

          {/* Active Calendar selector — shown when at least one group exists */}
          {groups.length > 0 && (
            <label className="flex flex-col gap-1 text-xs font-semibold">
              Active calendar
              <select
                value={activeGroupId ?? ""}
                onChange={(e) => onSelectGroup(e.target.value)}
                className="px-2.5 py-2 text-sm font-medium outline-none"
                style={{
                  borderRadius: "var(--radius-lg)",
                  border: "1.5px solid var(--border)",
                  background: "var(--surface)",
                  color: "var(--foreground)",
                }}
              >
                {groups.map((group) => (
                  <option key={group.id} value={group.id}>
                    {group.name}
                  </option>
                ))}
              </select>
            </label>
          )}

          {/* Invite code section — hidden by default, reveal with toggle */}
          {activeGroup && (
            <div
              className="rounded-lg p-2.5"
              style={{ background: "var(--surface)", border: "1px solid var(--border)" }}
            >
              <div className="flex items-center justify-between">
                <p className="text-[11px] font-semibold" style={{ color: "var(--text-muted)" }}>
                  Invite code
                </p>
                <button
                  type="button"
                  onClick={() => setCodeVisible((v) => !v)}
                  className="cursor-pointer text-[11px] font-semibold"
                  style={{ color: "var(--accent)" }}
                >
                  {codeVisible ? "Hide" : "Show"}
                </button>
              </div>

              {codeVisible && (
                <div className="mt-1.5 flex items-center justify-between gap-2">
                  <code
                    className="text-sm font-bold tracking-wider"
                    style={{ color: "var(--accent)" }}
                  >
                    {activeGroup.invite_code}
                  </code>
                  <button
                    type="button"
                    onClick={() => void copyInvite()}
                    className="flex cursor-pointer items-center gap-1 text-xs font-semibold transition-colors duration-150"
                    style={{ color: copied ? "#16a34a" : "var(--accent)" }}
                  >
                    {copied ? (
                      <>
                        {/* Checkmark icon */}
                        <svg
                          viewBox="0 0 16 16"
                          className="h-3.5 w-3.5 shrink-0"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2.5"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        >
                          <path d="M3 8l3.5 3.5L13 4.5" />
                        </svg>
                        Copied!
                      </>
                    ) : (
                      "Copy"
                    )}
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Create new shared calendar */}
          <div className="flex flex-col gap-2">
            <input
              type="text"
              value={groupName}
              onChange={(e) => setGroupName(e.target.value)}
              placeholder="New calendar name"
              className="px-2.5 py-2 text-sm outline-none"
              style={{
                borderRadius: "var(--radius-lg)",
                border: "1.5px solid var(--border)",
                background: "var(--surface)",
              }}
            />
            <button
              type="button"
              disabled={busy || !groupName.trim()}
              onClick={() => void handleCreate()}
              className="btn-bounce cursor-pointer px-3 py-2 text-xs font-semibold text-white disabled:opacity-50"
              style={{
                borderRadius: "var(--radius-lg)",
                background: "var(--accent)",
              }}
            >
              Create &amp; sync
            </button>
          </div>

          {/* Join existing shared calendar */}
          <div className="flex flex-col gap-2">
            <input
              type="text"
              value={inviteCode}
              onChange={(e) => setInviteCode(e.target.value)}
              placeholder="Enter invite code"
              className="px-2.5 py-2 text-sm outline-none"
              style={{
                borderRadius: "var(--radius-lg)",
                border: "1.5px solid var(--border)",
                background: "var(--surface)",
              }}
            />
            <button
              type="button"
              disabled={busy || !inviteCode.trim()}
              onClick={() => void handleJoin()}
              className="btn-bounce cursor-pointer px-3 py-2 text-xs font-semibold disabled:opacity-50"
              style={{
                borderRadius: "var(--radius-lg)",
                border: "1.5px solid var(--border)",
                background: "var(--surface)",
                color: "var(--foreground)",
              }}
            >
              Join calendar
            </button>
          </div>

          {error && (
            <p className="text-xs" style={{ color: "#b91c1c" }} role="alert">
              {error}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
