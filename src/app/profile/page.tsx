"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import { createClient } from "@/lib/supabase/client";

// ─── Types ────────────────────────────────────────────────────────────────────

// ─── Sub-components ──────────────────────────────────────────────────────────

function SectionCard({
  children,
  danger = false,
  defaultOpen = true,
  icon,
  title,
  description,
}: {
  children: React.ReactNode;
  danger?: boolean;
  defaultOpen?: boolean;
  icon: React.ReactNode;
  title: string;
  description: string;
}) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <div
      className="overflow-hidden"
      style={{
        borderRadius: "var(--radius-xl)",
        border: danger ? "1.5px solid #fca5a5" : "1.5px solid var(--border)",
        background: danger ? "#fff5f5" : "var(--surface)",
        boxShadow: "var(--shadow-md)",
        transition: "box-shadow var(--transition-base)",
      }}
    >
      {/* Clickable header */}
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="flex w-full cursor-pointer items-center gap-3 px-6 py-4 text-left"
        aria-expanded={open}
        style={{
          background: danger ? "#fff0f0" : "var(--surface-2)",
          borderBottom: open
            ? danger
              ? "1.5px solid #fca5a5"
              : "1.5px solid var(--border)"
            : "none",
          transition: "background var(--transition-base), border-color var(--transition-base)",
        }}
        onMouseEnter={(e) => {
          (e.currentTarget as HTMLElement).style.background = danger
            ? "#fee2e2"
            : "var(--accent-muted)";
        }}
        onMouseLeave={(e) => {
          (e.currentTarget as HTMLElement).style.background = danger
            ? "#fff0f0"
            : "var(--surface-2)";
        }}
      >
        {/* Icon badge */}
        <span
          className="flex h-9 w-9 shrink-0 items-center justify-center text-lg"
          style={{
            borderRadius: "var(--radius-md)",
            background: danger ? "#fee2e2" : "var(--accent-muted)",
            color: danger ? "#dc2626" : "var(--accent)",
          }}
        >
          {icon}
        </span>

        {/* Text */}
        <div className="flex-1">
          <p
            className="font-semibold"
            style={{
              color: danger ? "#991b1b" : "var(--foreground)",
              fontFamily: "var(--font-varela-round, 'Varela Round', sans-serif)",
            }}
          >
            {title}
          </p>
          <p className="text-xs" style={{ color: "var(--text-secondary)" }}>
            {description}
          </p>
        </div>

        {/* Chevron */}
        <svg
          viewBox="0 0 24 24"
          className="h-5 w-5 shrink-0"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          style={{
            color: danger ? "#dc2626" : "var(--text-muted)",
            transform: open ? "rotate(180deg)" : "rotate(0deg)",
            transition: "transform 250ms cubic-bezier(0.4, 0, 0.2, 1)",
          }}
        >
          <path d="M6 9l6 6 6-6" />
        </svg>
      </button>

      {/* Collapsible content */}
      <div
        style={{
          display: "grid",
          gridTemplateRows: open ? "1fr" : "0fr",
          transition: "grid-template-rows 280ms cubic-bezier(0.4, 0, 0.2, 1)",
        }}
      >
        <div style={{ overflow: "hidden" }}>
          {children}
        </div>
      </div>
    </div>
  );
}

function FieldLabel({ htmlFor, children }: { htmlFor: string; children: React.ReactNode }) {
  return (
    <label
      htmlFor={htmlFor}
      className="block text-sm font-semibold"
      style={{ color: "var(--foreground)", marginBottom: "0.375rem" }}
    >
      {children}
    </label>
  );
}

function TextInput({
  id,
  type = "text",
  placeholder,
  value,
  onChange,
  maxLength,
}: {
  id: string;
  type?: string;
  placeholder?: string;
  value: string;
  onChange: (v: string) => void;
  maxLength?: number;
}) {
  return (
    <input
      id={id}
      type={type}
      placeholder={placeholder}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      maxLength={maxLength}
      className="w-full px-4 py-2.5 text-sm font-medium outline-none"
      style={{
        borderRadius: "var(--radius-lg)",
        border: "1.5px solid var(--border)",
        background: "var(--surface)",
        color: "var(--foreground)",
        transition: "border-color var(--transition-base), box-shadow var(--transition-base)",
      }}
      onFocus={(e) => {
        e.currentTarget.style.borderColor = "var(--accent)";
        e.currentTarget.style.boxShadow = "0 0 0 3px var(--accent-muted)";
      }}
      onBlur={(e) => {
        e.currentTarget.style.borderColor = "var(--border)";
        e.currentTarget.style.boxShadow = "none";
      }}
    />
  );
}

function DangerButton({
  id,
  icon,
  title,
  description,
  onClick,
  confirmLabel = "Confirm",
  buttonLabel,
}: {
  id: string;
  icon: React.ReactNode;
  title: string;
  description: string;
  onClick?: () => void;
  confirmLabel?: string;
  buttonLabel?: string;
}) {
  const [confirming, setConfirming] = useState(false);

  return (
    <div
      className="flex items-center justify-between gap-4 px-6 py-4"
      style={{ borderBottom: "1px solid #fecaca" }}
    >
      <div className="flex items-center gap-3">
        <span className="text-lg text-red-400">{icon}</span>
        <div>
          <p className="text-sm font-semibold" style={{ color: "#991b1b" }}>
            {title}
          </p>
          <p className="text-xs" style={{ color: "#b91c1c" }}>
            {description}
          </p>
        </div>
      </div>
      {confirming ? (
        <div className="flex items-center gap-2">
          <button
            id={`${id}-confirm`}
            type="button"
            onClick={() => { setConfirming(false); onClick?.(); }}
            className="btn-bounce cursor-pointer px-3 py-1.5 text-xs font-semibold text-white"
            style={{
              borderRadius: "var(--radius-full)",
              background: "#dc2626",
              boxShadow: "0 2px 8px 0 rgb(220 38 38 / 0.3)",
            }}
          >
            {confirmLabel}
          </button>
          <button
            id={`${id}-cancel`}
            type="button"
            onClick={() => setConfirming(false)}
            className="btn-bounce cursor-pointer px-3 py-1.5 text-xs font-semibold"
            style={{
              borderRadius: "var(--radius-full)",
              border: "1.5px solid var(--border)",
              background: "var(--surface)",
              color: "var(--text-secondary)",
            }}
          >
            Cancel
          </button>
        </div>
      ) : (
        <button
          id={id}
          type="button"
          onClick={() => setConfirming(true)}
          className="btn-bounce cursor-pointer shrink-0 px-3 py-1.5 text-xs font-semibold"
          style={{
            borderRadius: "var(--radius-full)",
            border: "1.5px solid #fca5a5",
            background: "#fff0f0",
            color: "#dc2626",
          }}
        >
          {buttonLabel ?? title.split(" ")[0]}
        </button>
      )}
    </div>
  );
}

// ─── Main Page ───────────────────────────────────────────────────────────────

function LeaveGroupRow({
  groups,
  onLeave,
}: {
  groups: { id: string; name: string }[];
  onLeave: (groupId: string) => void;
}) {
  const [selectedId, setSelectedId] = useState("");
  const [confirming, setConfirming] = useState(false);

  const selectedGroup = groups.find((g) => g.id === selectedId);

  function handleConfirm() {
    if (!selectedId) return;
    onLeave(selectedId);
    setSelectedId("");
    setConfirming(false);
  }

  return (
    <div
      className="flex flex-wrap items-center justify-between gap-3 px-6 py-4"
      style={{ borderBottom: "1px solid #fecaca" }}
    >
      {/* Left: icon + label */}
      <div className="flex items-center gap-3">
        <span className="text-lg text-red-400">
          <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
            <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
            <circle cx="9" cy="7" r="4" />
            <line x1="23" y1="11" x2="17" y2="11" />
          </svg>
        </span>
        <div>
          <p className="text-sm font-semibold" style={{ color: "#991b1b" }}>
            Leave a group
          </p>
          <p className="text-xs" style={{ color: "#b91c1c" }}>
            Remove yourself from a specific shared workspace
          </p>
        </div>
      </div>

      {/* Right: selector + action */}
      <div className="flex shrink-0 items-center gap-2">
        <select
          id="leave-group-select"
          value={selectedId}
          onChange={(e) => { setSelectedId(e.target.value); setConfirming(false); }}
          disabled={groups.length === 0}
          className="cursor-pointer py-1.5 pl-2.5 pr-7 text-xs font-semibold outline-none"
          style={{
            borderRadius: "var(--radius-full)",
            border: "1.5px solid #fca5a5",
            background: "#fff0f0",
            color: groups.length === 0 ? "#fca5a5" : "#dc2626",
            appearance: "none",
            backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 16 16' fill='%23dc2626'%3E%3Cpath d='M4 6l4 4 4-4'/%3E%3C/svg%3E")`,
            backgroundRepeat: "no-repeat",
            backgroundPosition: "right 6px center",
            backgroundSize: "14px",
          }}
        >
          <option value="" disabled>
            {groups.length === 0 ? "No groups" : "Select group…"}
          </option>
          {groups.map((g) => (
            <option key={g.id} value={g.id}>
              {g.name}
            </option>
          ))}
        </select>

        {confirming ? (
          <>
            <button
              id="leave-group-confirm-btn"
              type="button"
              onClick={handleConfirm}
              className="btn-bounce cursor-pointer px-3 py-1.5 text-xs font-semibold text-white"
              style={{
                borderRadius: "var(--radius-full)",
                background: "#dc2626",
                boxShadow: "0 2px 8px 0 rgb(220 38 38 / 0.3)",
              }}
            >
              Leave &ldquo;{selectedGroup?.name}&rdquo;
            </button>
            <button
              id="leave-group-cancel-btn"
              type="button"
              onClick={() => setConfirming(false)}
              className="btn-bounce cursor-pointer px-3 py-1.5 text-xs font-semibold"
              style={{
                borderRadius: "var(--radius-full)",
                border: "1.5px solid var(--border)",
                background: "var(--surface)",
                color: "var(--text-secondary)",
              }}
            >
              Cancel
            </button>
          </>
        ) : (
          <button
            id="leave-group-btn"
            type="button"
            disabled={!selectedId}
            onClick={() => setConfirming(true)}
            className="btn-bounce cursor-pointer px-3 py-1.5 text-xs font-semibold disabled:cursor-not-allowed disabled:opacity-40"
            style={{
              borderRadius: "var(--radius-full)",
              border: "1.5px solid #fca5a5",
              background: "#fff0f0",
              color: "#dc2626",
            }}
          >
            Leave
          </button>
        )}
      </div>
    </div>
  );
}

export default function ProfilePage() {
  const router = useRouter();
  const supabase = useMemo(() => createClient(), []);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [email, setEmail] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [pronouns, setPronouns] = useState("");
  const [birthday, setBirthday] = useState("");
  const [favoriteColor, setFavoriteColor] = useState("#6366f1");
  const [saved, setSaved] = useState(false);
  const [groups, setGroups] = useState<{ id: string; name: string }[]>([]);

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  useEffect(() => {
    let mounted = true;

    async function loadUser() {
      const { data } = await supabase.auth.getUser();
      const user = data.user;
      if (!mounted || !user) return;

      setEmail(user.email ?? "");
      setDisplayName(
        (user.user_metadata?.display_name as string | undefined) ||
          user.user_metadata?.full_name ||
          "",
      );

      const { data: profile } = await supabase
        .from("profiles")
        .select("display_name, theme_preferences")
        .eq("id", user.id)
        .maybeSingle();

      if (!mounted) return;

      if (profile?.display_name) {
        setDisplayName(profile.display_name);
      }

      const theme = profile?.theme_preferences as
        | { favorite_color?: string; pronouns?: string; birthday?: string }
        | null;
      if (theme?.favorite_color) setFavoriteColor(theme.favorite_color);
      if (theme?.pronouns) setPronouns(theme.pronouns);
      if (theme?.birthday) setBirthday(theme.birthday);

      // Load groups the user belongs to
      const { data: memberRows } = await supabase
        .from("group_members")
        .select("group_id, groups(id, name)")
        .eq("user_id", user.id);

      if (!mounted) return;

      const loadedGroups = (memberRows ?? [])
        .map((row) => {
          const g = row.groups as { id: string; name: string } | null;
          return g ? { id: g.id, name: g.name } : null;
        })
        .filter((g): g is { id: string; name: string } => g !== null);

      setGroups(loadedGroups);
    }

    void loadUser();
    return () => {
      mounted = false;
    };
  }, [supabase]);

  // Avatar upload handler
  function handleAvatarChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const url = URL.createObjectURL(file);
    setAvatarUrl(url);
  }

  async function handleSaveProfile(e: React.FormEvent) {
    e.preventDefault();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;

    const theme_preferences = {
      favorite_color: favoriteColor,
      pronouns,
      birthday,
    };

    const { error } = await supabase.from("profiles").upsert({
      id: user.id,
      display_name: displayName.trim() || null,
      theme_preferences,
    });

    if (!error) {
      await supabase.auth.updateUser({
        data: { display_name: displayName.trim() || undefined },
      });
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    }
  }

  async function handleChangePassword(e: React.FormEvent) {
    e.preventDefault();
    if (!newPassword || newPassword !== confirmPassword) return;

    const { error } = await supabase.auth.updateUser({ password: newPassword });
    if (!error) {
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    }
  }

  async function handleSignOut() {
    await supabase.auth.signOut();
    router.replace("/login");
    router.refresh();
  }

  async function handleLeaveGroup(groupId: string) {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    await supabase
      .from("group_members")
      .delete()
      .eq("group_id", groupId)
      .eq("user_id", user.id);
    setGroups((prev) => prev.filter((g) => g.id !== groupId));
  }

  const initials = displayName
    ? displayName
        .split(" ")
        .map((w) => w[0])
        .join("")
        .slice(0, 2)
        .toUpperCase()
    : email
      ? email[0]!.toUpperCase()
      : "?";

  return (
    <div
      className="min-h-full"
      style={{ background: "var(--background)" }}
    >
      {/* Top nav bar */}
      <header
        className="flex h-14 items-center gap-3 px-4 sm:px-8"
        style={{
          background: "var(--surface)",
          borderBottom: "1.5px solid var(--border)",
          boxShadow: "var(--shadow-sm)",
        }}
      >
        <Link
          href="/"
          className="flex items-center gap-2 text-sm font-semibold"
          style={{ color: "var(--text-secondary)" }}
        >
          <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M15 6l-6 6 6 6" />
          </svg>
          Back to calendar
        </Link>
        <span
          className="mx-2 text-lg"
          style={{ color: "var(--border)" }}
        >
          /
        </span>
        <span
          className="text-sm font-semibold"
          style={{
            color: "var(--foreground)",
            fontFamily: "var(--font-varela-round, 'Varela Round', sans-serif)",
          }}
        >
          Profile &amp; Settings
        </span>
      </header>

      {/* Page body */}
      <div className="mx-auto max-w-2xl space-y-6 px-4 py-8 sm:px-6">

        {/* ── Profile Info ────────────────────────────────── */}
        <SectionCard
          icon={
            <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="8" r="4" /><path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" />
            </svg>
          }
          title="Your Profile"
          description="How others see you in shared workspaces"
        >

          <form onSubmit={handleSaveProfile} className="space-y-6 p-6">
            {/* Avatar upload */}
            <div className="flex flex-col items-center gap-4 sm:flex-row sm:items-start">
              <button
                type="button"
                id="avatar-upload-btn"
                onClick={() => fileInputRef.current?.click()}
                className="btn-bounce group relative flex h-24 w-24 shrink-0 cursor-pointer items-center justify-center overflow-hidden"
                style={{
                  borderRadius: "var(--radius-full)",
                  border: "2.5px solid var(--accent)",
                  boxShadow: "var(--shadow-md)",
                  background: "var(--accent-muted)",
                }}
              >
                {avatarUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={avatarUrl}
                    alt="Profile picture"
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <span
                    className="text-2xl font-bold"
                    style={{
                      color: "var(--accent-text)",
                      fontFamily: "var(--font-varela-round, 'Varela Round', sans-serif)",
                    }}
                  >
                    {initials}
                  </span>
                )}
                {/* Hover overlay */}
                <div
                  className="absolute inset-0 flex flex-col items-center justify-center opacity-0 transition-opacity group-hover:opacity-100"
                  style={{ background: "rgb(0 0 0 / 0.45)", borderRadius: "var(--radius-full)" }}
                >
                  <svg viewBox="0 0 24 24" className="h-6 w-6 text-white" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                    <polyline points="17 8 12 3 7 8" />
                    <line x1="12" y1="3" x2="12" y2="15" />
                  </svg>
                  <span className="mt-1 text-[10px] font-semibold text-white">Upload</span>
                </div>
              </button>
              <input
                ref={fileInputRef}
                type="file"
                id="avatar-file-input"
                accept="image/*"
                className="hidden"
                onChange={handleAvatarChange}
              />
              <div className="flex-1 space-y-1 text-center sm:text-left">
                <p className="text-sm font-semibold" style={{ color: "var(--foreground)" }}>
                  Profile picture
                </p>
                <p className="text-xs" style={{ color: "var(--text-secondary)" }}>
                  JPG, PNG, or GIF - max 5 MB. Click the circle to upload.
                </p>
                {avatarUrl && (
                  <button
                    type="button"
                    onClick={() => setAvatarUrl(null)}
                    className="text-xs underline"
                    style={{ color: "#dc2626" }}
                  >
                    Remove photo
                  </button>
                )}
              </div>
            </div>

            {/* Fields */}
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
              <div>
                <FieldLabel htmlFor="display-name">Display name</FieldLabel>
                <TextInput
                  id="display-name"
                  placeholder="e.g. Alex Rivera"
                  value={displayName}
                  onChange={setDisplayName}
                  maxLength={48}
                />
              </div>
              <div>
                <FieldLabel htmlFor="pronouns">Pronouns</FieldLabel>
                <TextInput
                  id="pronouns"
                  placeholder="e.g. they/them"
                  value={pronouns}
                  onChange={setPronouns}
                  maxLength={24}
                />
              </div>
              <div>
                <FieldLabel htmlFor="birthday">Birthday</FieldLabel>
                <TextInput
                  id="birthday"
                  type="date"
                  value={birthday}
                  onChange={setBirthday}
                />
              </div>
              <div>
                <FieldLabel htmlFor="favorite-color">Favorite color</FieldLabel>
                <div className="flex items-center gap-3">
                  <input
                    type="color"
                    id="favorite-color-picker"
                    value={favoriteColor}
                    onChange={(e) => setFavoriteColor(e.target.value)}
                    className="h-10 w-10 cursor-pointer border-none bg-transparent p-0"
                    style={{ borderRadius: "var(--radius-md)" }}
                  />
                  <TextInput
                    id="favorite-color"
                    placeholder="#6366f1"
                    value={favoriteColor}
                    onChange={(v) => {
                      setFavoriteColor(v);
                    }}
                    maxLength={7}
                  />
                </div>
                <p className="mt-1.5 text-xs" style={{ color: "var(--text-muted)" }}>
                  Used to personalize your app theme.
                </p>
              </div>
            </div>

            {/* Save button */}
            <div className="flex items-center justify-end gap-3">
              {saved && (
                <span
                  className="flex items-center gap-1.5 text-sm font-semibold animate-fade-in"
                  style={{ color: "var(--color-success)" }}
                >
                  <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M20 6L9 17l-5-5" />
                  </svg>
                  Saved!
                </span>
              )}
              <button
                type="submit"
                id="save-profile-btn"
                className="btn-bounce cursor-pointer px-5 py-2.5 text-sm font-semibold text-white"
                style={{
                  borderRadius: "var(--radius-full)",
                  background: "var(--accent)",
                  boxShadow: "var(--shadow-md)",
                }}
              >
                Save profile
              </button>
            </div>
          </form>
        </SectionCard>

        {/* ── Account / Password ──────────────────────────── */}
        <SectionCard
          icon={
            <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="11" width="18" height="11" rx="2" />
              <path d="M7 11V7a5 5 0 0 1 10 0v4" />
            </svg>
          }
          title="Account & Security"
          description="Update your login credentials"
        >

          <form onSubmit={handleChangePassword} className="space-y-5 p-6">
            <div>
              <FieldLabel htmlFor="current-password">Current password</FieldLabel>
              <TextInput
                id="current-password"
                type="password"
                placeholder="••••••••"
                value={currentPassword}
                onChange={setCurrentPassword}
              />
            </div>
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
              <div>
                <FieldLabel htmlFor="new-password">New password</FieldLabel>
                <TextInput
                  id="new-password"
                  type="password"
                  placeholder="••••••••"
                  value={newPassword}
                  onChange={setNewPassword}
                />
              </div>
              <div>
                <FieldLabel htmlFor="confirm-password">Confirm new password</FieldLabel>
                <TextInput
                  id="confirm-password"
                  type="password"
                  placeholder="••••••••"
                  value={confirmPassword}
                  onChange={setConfirmPassword}
                />
              </div>
            </div>
            {newPassword && confirmPassword && newPassword !== confirmPassword && (
              <p className="text-xs font-semibold" style={{ color: "#dc2626" }}>
                Passwords don&apos;t match.
              </p>
            )}
            <div className="flex justify-end">
              <button
                type="submit"
                id="change-password-btn"
                disabled={!currentPassword || !newPassword || newPassword !== confirmPassword}
                className="btn-bounce cursor-pointer px-5 py-2.5 text-sm font-semibold"
                style={{
                  borderRadius: "var(--radius-full)",
                  background:
                    !currentPassword || !newPassword || newPassword !== confirmPassword
                      ? "var(--border)"
                      : "var(--accent)",
                  color:
                    !currentPassword || !newPassword || newPassword !== confirmPassword
                      ? "var(--text-muted)"
                      : "#fff",
                  boxShadow: "var(--shadow-sm)",
                  transition: "all var(--transition-base)",
                  cursor:
                    !currentPassword || !newPassword || newPassword !== confirmPassword
                      ? "not-allowed"
                      : "pointer",
                }}
              >
                Update password
              </button>
            </div>
          </form>
        </SectionCard>

        {/* ── Notifications ──────────────────────────────── */}
        <SectionCard
          icon={
            <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
              <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
              <path d="M13.73 21a2 2 0 0 1-3.46 0" />
            </svg>
          }
          title="Notifications"
          description="Choose what you hear about"
          defaultOpen={false}
        >
          <div className="divide-y px-6 py-2" style={{ borderColor: "var(--border)" }}>
            {[
              { id: "notif-events", label: "New events added to shared calendars", defaultChecked: true },
              { id: "notif-invites", label: "Group invites & membership changes", defaultChecked: true },
              { id: "notif-lists", label: "Shared list updates", defaultChecked: false },
              { id: "notif-nudges", label: "Availability nudges from group members", defaultChecked: true },
            ].map(({ id, label, defaultChecked }) => (
              <label
                key={id}
                htmlFor={id}
                className="flex cursor-pointer items-center justify-between gap-4 py-3.5"
              >
                <span className="text-sm font-medium" style={{ color: "var(--foreground)" }}>
                  {label}
                </span>
                <input
                  id={id}
                  type="checkbox"
                  defaultChecked={defaultChecked}
                  className="h-4 w-4 cursor-pointer accent-[var(--accent)]"
                />
              </label>
            ))}
          </div>
        </SectionCard>

        {/* ── Danger Zone ────────────────────────────────── */}
        <SectionCard
          danger
          defaultOpen={false}
          icon={
            <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
              <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
              <line x1="12" y1="9" x2="12" y2="13" />
              <line x1="12" y1="17" x2="12.01" y2="17" />
            </svg>
          }
          title="Danger Zone"
          description="Irreversible and destructive actions - proceed carefully"
        >
          <div>
            <DangerButton
              id="sign-out-all-btn"
              icon={
                <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                  <polyline points="16 17 21 12 16 7" />
                  <line x1="21" y1="12" x2="9" y2="12" />
                </svg>
              }
              title="Sign out"
              description="Sign out of WeCalendar on this device"
              confirmLabel="Sign out"
              onClick={() => {
                void handleSignOut();
              }}
            />
            <DangerButton
              id="unsync-calendar-btn"
              icon={
                <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
                  <path d="M3 3v5h5" />
                  <line x1="2" y1="2" x2="22" y2="22" />
                </svg>
              }
              title="Unsync calendar"
              description="Disconnect your Google Calendar or Outlook sync"
              confirmLabel="Unsync"
            />
            {/* ── Leave a specific group (selector) ── */}
            <LeaveGroupRow groups={groups} onLeave={(id) => { void handleLeaveGroup(id); }} />

            <DangerButton
              id="leave-all-groups-btn"
              buttonLabel="Leave all"
              icon={
                <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                  <circle cx="9" cy="7" r="4" />
                  <line x1="23" y1="11" x2="17" y2="11" />
                </svg>
              }
              title="Leave all groups"
              description="Remove yourself from every shared workspace you're a member of"
              confirmLabel="Leave all"
            />
            <DangerButton
              id="export-data-btn"
              icon={
                <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                  <polyline points="7 10 12 15 17 10" />
                  <line x1="12" y1="15" x2="12" y2="3" />
                </svg>
              }
              title="Export your data"
              description="Download a copy of all your events, lists, and profile data as JSON"
              confirmLabel="Export"
            />
            <DangerButton
              id="delete-account-btn"
              icon={
                <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="3 6 5 6 21 6" />
                  <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
                  <path d="M10 11v6M14 11v6" />
                  <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" />
                </svg>
              }
              title="Delete account"
              description="Permanently delete your account and all associated data - cannot be undone"
              confirmLabel="Delete forever"
            />
          </div>
        </SectionCard>

      </div>
    </div>
  );
}
