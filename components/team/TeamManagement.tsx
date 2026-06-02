"use client";

import { useEffect, useState } from "react";

type Member = {
  id: string;
  clerkUserId: string;
  role: "owner" | "admin" | "member";
  createdAt: string;
};

type Invitation = {
  id: string;
  email: string;
  status: "pending" | "accepted" | "revoked";
  invitedBy: string | null;
  createdAt: string;
};

type TeamData = {
  members: Member[];
  invitations: Invitation[];
  myRole: string;
  canManage: boolean;
};

function roleBadgeClass(role: string) {
  switch (role) {
    case "owner":
      return "bg-purple-500/20 text-purple-400";
    case "admin":
      return "bg-blue-500/20 text-blue-400";
    default:
      return "bg-gray-500/20 text-gray-400";
  }
}

function formatDate(iso: string | null) {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

/**
 * TeamManagement — list members, show pending invites, invite new members.
 * Owners/admins see full controls; members see read-only.
 */
export default function TeamManagement() {
  const [data, setData] = useState<TeamData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Invite form
  const [email, setEmail] = useState("");
  const [sending, setSending] = useState(false);
  const [inviteError, setInviteError] = useState<string | null>(null);
  const [inviteSuccess, setInviteSuccess] = useState(false);

  function loadTeam() {
    setLoading(true);
    setError(null);
    fetch("/api/tenants/members")
      .then((r) => {
        if (!r.ok) throw new Error("Failed to load team data");
        return r.json();
      })
      .then((json) => {
        if (json.error) throw new Error(json.error);
        setData(json);
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    loadTeam();
  }, []);

  async function handleInvite(e: React.FormEvent) {
    e.preventDefault();
    setInviteError(null);
    setInviteSuccess(false);

    const trimmed = email.trim();
    if (!trimmed) {
      setInviteError("Enter an email address");
      return;
    }

    setSending(true);
    try {
      const res = await fetch("/api/tenants/members", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: trimmed }),
      });

      const json = await res.json();

      if (!res.ok) {
        setInviteError(json.error || "Failed to send invite");
        return;
      }

      setInviteSuccess(true);
      setEmail("");
      loadTeam();
    } catch (e) {
      setInviteError(e instanceof Error ? e.message : "Network error");
    } finally {
      setSending(false);
    }
  }

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="h-6 w-48 animate-pulse rounded bg-gray-200" />
        <div className="h-12 w-full animate-pulse rounded bg-gray-200" />
        <div className="h-12 w-full animate-pulse rounded bg-gray-200" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
        {error}
      </div>
    );
  }

  const { members, invitations, canManage } = data!;

  return (
    <div className="space-y-6">
      {/* Current team members */}
      <div className="rounded-xl border border-gray-200 bg-white p-6">
        <h2 className="text-lg font-semibold text-gray-900">Team Members</h2>
        <p className="mt-1 text-sm text-gray-500">
          {members.length} member{members.length !== 1 ? "s" : ""} in your
          organisation
        </p>

        <div className="mt-4 divide-y divide-gray-100">
          {members.map((member) => (
            <div
              key={member.id}
              className="flex items-center justify-between py-3"
            >
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-gray-200 text-sm font-medium text-gray-600">
                  {member.clerkUserId.slice(0, 2).toUpperCase()}
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-900">
                    {member.clerkUserId}
                  </p>
                  <p className="text-xs text-gray-400">
                    Joined {formatDate(member.createdAt)}
                  </p>
                </div>
              </div>
              <span
                className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium capitalize ${roleBadgeClass(member.role)}`}
              >
                {member.role}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Pending invitations */}
      {invitations.length > 0 && (
        <div className="rounded-xl border border-gray-200 bg-white p-6">
          <h3 className="text-sm font-semibold text-gray-900">
            Pending Invitations
          </h3>
          <p className="mt-1 text-xs text-gray-500">
            {invitations.length} invitation{invitations.length !== 1 ? "s" : ""}{" "}
            waiting for response
          </p>

          <div className="mt-3 divide-y divide-gray-100">
            {invitations.map((inv) => (
              <div
                key={inv.id}
                className="flex items-center justify-between py-2"
              >
                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-700">{inv.email}</span>
                </div>
                <span className="inline-flex items-center rounded-full bg-amber-500/20 px-2.5 py-0.5 text-xs font-medium text-amber-600">
                  Pending
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Invite form — only for owners/admins */}
      {canManage && (
        <div className="rounded-xl border border-gray-200 bg-white p-6">
          <h3 className="text-sm font-medium text-gray-900">
            Invite a Team Member
          </h3>
          <p className="mb-4 text-sm text-gray-500">
            Send an invitation email to add someone to your organisation.
          </p>

          <form onSubmit={handleInvite} className="flex flex-col sm:flex-row gap-3">
            <input
              type="email"
              placeholder="Enter email address"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={sending}
              className="flex-1 rounded-lg border border-gray-300 px-4 py-2 text-sm text-gray-900 placeholder-gray-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 disabled:cursor-not-allowed disabled:opacity-50"
            />
            <button
              type="submit"
              disabled={sending || !email.trim()}
              className="inline-flex items-center rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {sending ? "Sending..." : "Send Invite"}
            </button>
          </form>

          {inviteError && (
            <p className="mt-3 text-sm text-red-600">{inviteError}</p>
          )}
          {inviteSuccess && (
            <p className="mt-3 text-sm text-green-600">
              Invitation sent successfully!
            </p>
          )}
        </div>
      )}

      {/* Read-only notice for members */}
      {!canManage && (
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-700">
          You have read-only access. Contact an owner or admin to manage team
          members.
        </div>
      )}
    </div>
  );
}
