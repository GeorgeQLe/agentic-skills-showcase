"use client";

import { useState } from "react";
import { trpc } from "@/trpc/client";

type View = "login" | "admin";

export default function AdminNewsletterClient() {
  const [view, setView] = useState<View>("login");
  const [secret, setSecret] = useState("");
  const [search, setSearch] = useState("");
  const [copied, setCopied] = useState(false);

  const login = trpc.newsletter.adminLogin.useMutation({
    onSuccess: () => setView("admin"),
  });

  const list = trpc.newsletter.adminList.useQuery(
    { search: search || undefined, limit: 100 },
    { enabled: view === "admin", refetchOnWindowFocus: false },
  );

  const csvExport = trpc.newsletter.adminExport.useQuery(undefined, {
    enabled: false,
  });

  function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    login.mutate({ secret });
  }

  async function handleCopyEmails() {
    if (!list.data) return;
    const emails = list.data
      .filter((s) => s.status === "active")
      .map((s) => s.email)
      .join(", ");
    await navigator.clipboard.writeText(emails);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  async function handleDownloadCsv() {
    const result = await csvExport.refetch();
    if (!result.data) return;
    const blob = new Blob([result.data], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `subscribers-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  if (view === "login") {
    return (
      <section className="form-panel span-12" aria-labelledby="admin-title">
        <p className="eyebrow">Admin</p>
        <h2 id="admin-title">Newsletter Admin</h2>
        <form onSubmit={handleLogin}>
          <label>
            <span className="eyebrow">Secret</span>
            <input
              name="secret"
              type="password"
              autoComplete="off"
              placeholder="Enter admin secret"
              value={secret}
              onChange={(e) => setSecret(e.target.value)}
            />
          </label>
          <button
            className="button secondary"
            type="submit"
            disabled={login.isPending}
            style={{ marginTop: 12 }}
          >
            {login.isPending ? "Authenticating..." : "Log in"}
          </button>
          {login.isError && (
            <p className="notice" style={{ marginTop: 12, color: "var(--red)" }}>
              {login.error.message}
            </p>
          )}
        </form>
      </section>
    );
  }

  return (
    <section aria-labelledby="admin-title">
      <div style={{ marginBottom: 18 }}>
        <p className="eyebrow">Admin</p>
        <h2 id="admin-title">Newsletter Subscribers</h2>
      </div>

      <div className="newsletter-controls" style={{ marginBottom: 18 }}>
        <label>
          <span className="eyebrow">Search</span>
          <input
            type="search"
            placeholder="Filter by email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </label>
        <button className="button secondary" type="button" onClick={handleCopyEmails}>
          {copied ? "Copied!" : "Copy active emails"}
        </button>
        <button className="button secondary" type="button" onClick={handleDownloadCsv}>
          Download CSV
        </button>
      </div>

      {list.isLoading && <p className="coordinate">Loading subscribers...</p>}
      {list.isError && (
        <p className="notice" style={{ color: "var(--red)" }}>
          Failed to load subscribers. Your session may have expired.
        </p>
      )}

      {list.data && (
        <>
          <p className="coordinate" style={{ marginBottom: 12 }}>
            {list.data.length} subscriber{list.data.length !== 1 ? "s" : ""}
            {search ? ` matching "${search}"` : ""}
          </p>
          <div className="form-panel" style={{ overflow: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr>
                  <th style={thStyle}>Email</th>
                  <th style={thStyle}>Status</th>
                  <th style={thStyle}>Source page</th>
                  <th style={thStyle}>Created</th>
                </tr>
              </thead>
              <tbody>
                {list.data.map((sub) => (
                  <tr key={sub.id}>
                    <td style={tdStyle}>{sub.email}</td>
                    <td style={tdStyle}>
                      <span className="tag">{sub.status}</span>
                    </td>
                    <td style={tdStyle}>
                      <span className="coordinate">{sub.source_page}</span>
                    </td>
                    <td style={tdStyle}>
                      <span className="coordinate">
                        {new Date(sub.created_at).toLocaleDateString()}
                      </span>
                    </td>
                  </tr>
                ))}
                {list.data.length === 0 && (
                  <tr>
                    <td style={tdStyle} colSpan={4}>
                      No subscribers found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </>
      )}
    </section>
  );
}

const thStyle: React.CSSProperties = {
  textAlign: "left",
  padding: "8px 12px",
  borderBottom: "1px solid var(--line)",
  fontFamily: "var(--mono)",
  fontSize: "0.72rem",
  textTransform: "uppercase",
  color: "var(--muted)",
  fontWeight: 600,
};

const tdStyle: React.CSSProperties = {
  padding: "8px 12px",
  borderBottom: "1px solid var(--line)",
  fontSize: "0.88rem",
};
