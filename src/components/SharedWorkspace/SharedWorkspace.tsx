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

  const activeGroup = groups.find((g) => g.id === activeGroupId) ?? null;

  async function handleCreate() {
    if (!groupName.trim()) return;
    setBusy(true);
    setError(null);
    try {
      await onCreateGroup(groupName.trim());
      setGroupName("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not create workspace.");
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
      setError(err instanceof Error ? err.message : "Could not join workspace.");
    } finally {
      setBusy(false);
    }
  }

  async function copyInvite() {
    if (!activeGroup) return;
    await navigator.clipboard.writeText(activeGroup.invite_code);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  return (
    <div
      className="flex flex-col gap-3 p-3"
      style={{
        borderRadius: "var(--radius-xl)",
        border: "1.5px solid var(--border)",
        background: "var(--surface-2)",
      }}
    >
      <div>
        <p
          className="text-xs font-semibold uppercase tracking-wider"
          style={{ color: "var(--text-muted)" }}
        >
          Shared calendar
        </p>
        <p className="mt-1 text-xs" style={{ color: "var(--text-secondary)" }}>
          Sync events with another account using an invite code.
        </p>
      </div>

      {groups.length > 0 && (
        <label className="flex flex-col gap-1 text-xs font-semibold">
          Active workspace
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

      {activeGroup && (
        <div
          className="rounded-lg p-2.5"
          style={{ background: "var(--surface)", border: "1px solid var(--border)" }}
        >
          <p className="text-[11px] font-semibold" style={{ color: "var(--text-muted)" }}>
            Invite code
          </p>
          <div className="mt-1 flex items-center justify-between gap-2">
            <code className="text-sm font-bold tracking-wider" style={{ color: "var(--accent)" }}>
              {activeGroup.invite_code}
            </code>
            <button
              type="button"
              onClick={() => void copyInvite()}
              className="cursor-pointer text-xs font-semibold"
              style={{ color: "var(--accent)" }}
            >
              {copied ? "Copied" : "Copy"}
            </button>
          </div>
        </div>
      )}

      <div className="flex flex-col gap-2">
        <input
          type="text"
          value={groupName}
          onChange={(e) => setGroupName(e.target.value)}
          placeholder="New workspace name"
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
          Create & sync
        </button>
      </div>

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
          Join workspace
        </button>
      </div>

      {error && (
        <p className="text-xs" style={{ color: "#b91c1c" }} role="alert">
          {error}
        </p>
      )}
    </div>
  );
}
