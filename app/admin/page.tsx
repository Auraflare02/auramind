"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { formatLevel } from "@/lib/categories";
import { AuraMindLogo, AuraMindSymbol } from "@/components/AuraMindBrand";

export default function AdminPage() {
  const [adminKey, setAdminKey] = useState("");
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [requests, setRequests] = useState<any[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>("all");

  const [busyAction, setBusyAction] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  // Editable research state for selected request
  const [researchSummary, setResearchSummary] = useState("");
  const [requirements, setRequirements] = useState<string[]>([]);
  const [prerequisites, setPrerequisites] = useState<string[]>([]);
  const [bottlenecks, setBottlenecks] = useState<string[]>([]);
  const [strategy, setStrategy] = useState("");

  // Attempt to restore adminKey from sessionStorage
  useEffect(() => {
    const saved = sessionStorage.getItem("auramind_admin_key");
    if (saved) {
      setAdminKey(saved);
      loadRequests(saved);
    }
  }, []);

  const syncSelectedRequestState = (req: any) => {
    const rd = req.research_data;
    setResearchSummary(rd?.summary || req.research || "");
    setRequirements(rd?.requirements || ["Master fundamental mechanics", "Spaced retrieval intervals"]);
    setPrerequisites(rd?.prerequisites || ["Core conceptual literacy"]);
    setBottlenecks(rd?.common_bottlenecks || ["Cognitive fatigue in week 2", "Distraction during unguided practice"]);
    setStrategy(rd?.strategy || "30-day deliberate practice ramp with scheduled active recall.");
  };

  const loadRequests = useCallback(async (keyToUse = adminKey) => {
    if (!keyToUse) return;
    setErrorMsg("");

    try {
      const res = await fetch("/api/admin/requests", {
        headers: {
          "content-type": "application/json",
          "x-admin-key": keyToUse,
        },
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Authentication failed.");
      }

      setRequests(data.requests || []);
      setIsAuthenticated(true);
      sessionStorage.setItem("auramind_admin_key", keyToUse);

      // Keep selected request in sync
      if (selectedId) {
        const found = (data.requests || []).find((r: any) => r.id === selectedId);
        if (found) {
          syncSelectedRequestState(found);
        }
      }
    } catch (e: any) {
      setErrorMsg(e.message || "Failed to load requests.");
      setIsAuthenticated(false);
    }
  }, [adminKey, selectedId]);

  const handleSelectRequest = (r: any) => {
    setSelectedId(r.id);
    setErrorMsg("");
    setSuccessMsg("");
    syncSelectedRequestState(r);
  };

  const executeAction = async (action: string, extraPayload: any = {}) => {
    if (!selectedId) return;
    setBusyAction(action);
    setErrorMsg("");
    setSuccessMsg("");

    try {
      const res = await fetch("/api/admin/requests", {
        method: "POST",
        headers: {
          "content-type": "application/json",
          "x-admin-key": adminKey,
        },
        body: JSON.stringify({
          id: selectedId,
          action,
          ...extraPayload,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || `Action '${action}' failed.`);
      }

      setSuccessMsg(data.message || `Successfully executed ${action}.`);
      await loadRequests(adminKey);
    } catch (e: any) {
      setErrorMsg(e.message || "Action execution error.");
    } finally {
      setBusyAction(null);
    }
  };

  const handleSaveResearch = () => {
    executeAction("save_research", {
      research_data: {
        summary: researchSummary,
        requirements,
        prerequisites,
        common_bottlenecks: bottlenecks,
        strategy,
      },
    });
  };

  const selectedRequest = requests.find((r) => r.id === selectedId);
  const filteredRequests = requests.filter((r) => (statusFilter === "all" ? true : r.status === statusFilter));

  // LOGIN SCREEN
  if (!isAuthenticated) {
    return (
      <div className="container-narrow" style={{ paddingTop: "80px", paddingBottom: "80px" }}>
        <div className="card card-highlight" style={{ padding: "40px 32px", maxWidth: "460px", margin: "0 auto" }}>
          <div style={{ textAlign: "center", marginBottom: "28px" }}>
            <div style={{ display: "flex", justifyContent: "center", marginBottom: "16px" }}>
              <AuraMindLogo height={32} compactOnMobile={false} />
            </div>
            <span className="badge badge-yellow" style={{ marginBottom: "8px" }}>Operations Console</span>
            <h1 style={{ fontSize: "1.6rem", margin: "4px 0 8px" }}>AuraMind Admin</h1>
            <p className="text-secondary text-xs" style={{ margin: 0 }}>
              Enter your AURAMIND_ADMIN_KEY to manage goal requests and pedagogical research.
            </p>
          </div>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              loadRequests(adminKey);
            }}
          >
            <div className="form-group" style={{ marginBottom: "20px" }}>
              <label htmlFor="adminKey">Admin Secret Key</label>
              <input
                id="adminKey"
                type="password"
                placeholder="Enter secret key..."
                value={adminKey}
                onChange={(e) => setAdminKey(e.target.value)}
                required
                style={{ fontFamily: "monospace" }}
              />
            </div>

            {errorMsg && <div className="alert alert-error" style={{ marginBottom: "16px" }}>{errorMsg}</div>}

            <button type="submit" className="btn btn-primary" style={{ width: "100%", justifyContent: "center" }}>
              Authenticate Session &rarr;
            </button>
          </form>
        </div>
      </div>
    );
  }

  // MAIN ADMIN DASHBOARD
  return (
    <div className="container-wide" style={{ paddingTop: "24px", paddingBottom: "80px" }}>
      {/* OPERATIONS HEADER */}
      <div
        className="card"
        style={{
          padding: "16px 20px",
          marginBottom: "20px",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          gap: "12px",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          <AuraMindSymbol size={36} />
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <h1 style={{ fontSize: "1.25rem", margin: 0, fontWeight: 700 }}>Curriculum Research &amp; Dispatch</h1>
              <span className="badge badge-yellow" style={{ fontSize: "0.7rem", padding: "1px 6px" }}>
                {requests.length} Requests
              </span>
            </div>
            <div className="text-xs text-muted" style={{ marginTop: "2px" }}>
              Operational control for deliberate practice curriculum synthesis and releases
            </div>
          </div>
        </div>

        <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
          <button
            type="button"
            className="btn btn-secondary btn-sm"
            onClick={() => loadRequests()}
            disabled={Boolean(busyAction)}
          >
            &#x21bb; Refresh Queue
          </button>
          <button
            type="button"
            className="btn btn-secondary btn-sm"
            onClick={() => {
              sessionStorage.removeItem("auramind_admin_key");
              setIsAuthenticated(false);
            }}
          >
            Sign Out
          </button>
        </div>
      </div>

      {errorMsg && <div className="alert alert-error" style={{ marginBottom: "16px" }}>{errorMsg}</div>}
      {successMsg && <div className="alert alert-success" style={{ marginBottom: "16px" }}>{successMsg}</div>}

      {/* TWO PANEL WORKSPACE */}
      <div className="workspace-layout">
        {/* LEFT COLUMN: REQUEST QUEUE */}
        <aside className="workspace-sidebar" style={{ maxHeight: "calc(100vh - 120px)", overflowY: "auto" }}>
          <div className="flex-between" style={{ paddingBottom: "10px", borderBottom: "1px solid var(--border-subtle)", marginBottom: "8px" }}>
            <span className="text-xs text-muted" style={{ fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.04em" }}>
              Queue ({filteredRequests.length})
            </span>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              style={{ padding: "4px 8px", minHeight: "28px", fontSize: "0.75rem", width: "auto" }}
            >
              <option value="all">All</option>
              <option value="pending">Pending</option>
              <option value="researching">Researching</option>
              <option value="review">Review</option>
              <option value="ready">Ready</option>
              <option value="archived">Archived</option>
            </select>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
            {filteredRequests.length === 0 ? (
              <p className="text-xs text-muted" style={{ padding: "24px 0", textAlign: "center" }}>
                No requests match this filter.
              </p>
            ) : (
              filteredRequests.map((r) => {
                const isSelected = r.id === selectedId;
                const ctx = r.context || {};
                return (
                  <div
                    key={r.id}
                    onClick={() => handleSelectRequest(r)}
                    style={{
                      padding: "10px 12px",
                      borderRadius: "var(--radius-xs)",
                      backgroundColor: isSelected ? "var(--bg-elevated)" : "var(--bg-secondary)",
                      border: isSelected ? "1px solid var(--accent-primary)" : "1px solid var(--border-subtle)",
                      cursor: "pointer",
                      transition: "all var(--transition-fast)",
                    }}
                  >
                    <div className="flex-between" style={{ marginBottom: "4px" }}>
                      <span
                        className={`badge ${
                          r.status === "ready"
                            ? "badge-success"
                            : r.status === "review"
                            ? "badge-yellow"
                            : "badge-gray"
                        }`}
                        style={{ fontSize: "0.65rem", padding: "1px 6px" }}
                      >
                        {r.status}
                      </span>
                      <span className="text-xs font-mono text-muted">
                        {r.request_code || r.id.slice(0, 8)}
                      </span>
                    </div>

                    <div style={{ fontWeight: 600, fontSize: "0.875rem", color: isSelected ? "var(--accent-primary)" : "var(--text-primary)", marginBottom: "2px" }}>
                      {ctx.goal || r.goal || "Untitled Goal"}
                    </div>

                    <div className="text-xs text-muted">
                      {r.category || ctx.category} &bull; {ctx.hours || 2}h/day
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </aside>

        {/* RIGHT COLUMN: WORKSPACE */}
        <main>
          {selectedRequest ? (
            <div>
              {/* TOP ACTION & STATUS BANNER */}
              <div className="card card-highlight" style={{ padding: "20px", marginBottom: "20px" }}>
                <div className="flex-between" style={{ flexWrap: "wrap", gap: "12px", marginBottom: "16px" }}>
                  <div>
                    <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "6px" }}>
                      <span
                        className={`badge ${
                          selectedRequest.status === "ready"
                            ? "badge-success"
                            : selectedRequest.status === "review"
                            ? "badge-yellow"
                            : "badge-gray"
                        }`}
                      >
                        Status: {selectedRequest.status}
                      </span>
                      <span className="text-xs font-mono text-yellow" style={{ fontWeight: 700 }}>
                        {selectedRequest.request_code || selectedRequest.id}
                      </span>
                    </div>
                    <h2 style={{ fontSize: "1.5rem", margin: "4px 0" }}>
                      {selectedRequest.context?.goal || selectedRequest.goal}
                    </h2>
                    <div className="text-xs text-muted">
                      Created: {new Date(selectedRequest.created_at).toLocaleString()}
                      {selectedRequest.plan_source && ` \u2022 Source: ${selectedRequest.plan_source.toUpperCase()}`}
                    </div>
                  </div>

                  <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
                    <Link
                      href={`/goal/${selectedRequest.id}`}
                      target="_blank"
                      className="btn btn-secondary btn-sm"
                    >
                      Open User View &#8599;
                    </Link>

                    {/* RELEASE BUTTON */}
                    <button
                      type="button"
                      className="btn btn-primary btn-sm"
                      disabled={
                        Boolean(busyAction) ||
                        !selectedRequest.plan ||
                        selectedRequest.status === "ready" ||
                        selectedRequest.status === "archived"
                      }
                      onClick={() => executeAction("release")}
                    >
                      {busyAction === "release"
                        ? "Releasing..."
                        : selectedRequest.status === "ready"
                        ? "Released to User \u2713"
                        : "Release to User \u2192"}
                    </button>
                  </div>
                </div>

                {/* USER CONTEXT DETAILS */}
                <details style={{ backgroundColor: "var(--bg-secondary)", padding: "12px 16px", borderRadius: "var(--radius-xs)", border: "1px solid var(--border-subtle)" }}>
                  <summary style={{ cursor: "pointer", fontWeight: 600, fontSize: "0.85rem", color: "var(--text-primary)" }}>
                    User Context &amp; Constraints Checklist
                  </summary>
                  <div style={{ marginTop: "12px", display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: "10px", fontSize: "0.825rem" }}>
                    <div>
                      <strong>Category:</strong> {selectedRequest.category || selectedRequest.context?.category}
                    </div>
                    <div>
                      <strong>Daily Availability:</strong> {selectedRequest.context?.hours || 2}h in {selectedRequest.context?.focus || "morning"}
                    </div>
                    <div>
                      <strong>Starting Level:</strong> {formatLevel(selectedRequest.category, selectedRequest.current_level, selectedRequest.context?.custom_current_level)}
                    </div>
                    <div>
                      <strong>Target Level:</strong> {formatLevel(selectedRequest.category, selectedRequest.target_level, selectedRequest.context?.custom_target_level)}
                    </div>
                    {selectedRequest.context?.language && (
                      <div>
                        <strong>Target Language:</strong> {selectedRequest.context?.language}
                      </div>
                    )}
                    <div>
                      <strong>Timezone:</strong> {selectedRequest.timezone || selectedRequest.context?.timezone || "UTC"}
                    </div>
                    <div>
                      <strong>Deadline:</strong> {selectedRequest.context?.deadline || "None"}
                    </div>
                    <div style={{ gridColumn: "span 2" }}>
                      <strong>Known Distractions:</strong> {selectedRequest.context?.distractions || "None"}
                    </div>
                    <div style={{ gridColumn: "span 2" }}>
                      <strong>Previous Attempts:</strong> {selectedRequest.context?.previous || "None"}
                    </div>
                    <div style={{ gridColumn: "span 2" }}>
                      <strong>Other Constraints:</strong> {selectedRequest.context?.constraints || "None"}
                    </div>
                  </div>
                </details>
              </div>

              {/* RESEARCH WORKSPACE */}
              <div className="card" style={{ marginBottom: "20px", padding: "20px" }}>
                <div className="flex-between" style={{ marginBottom: "16px", flexWrap: "wrap", gap: "8px" }}>
                  <div>
                    <h3 style={{ margin: 0, fontSize: "1.15rem" }}>Research &amp; Pedagogical Strategy</h3>
                    <p className="text-xs text-muted" style={{ margin: "2px 0 0" }}>
                      Analyze cognitive bottlenecks, prerequisites, and curriculum requirements before generating plan.
                    </p>
                  </div>

                  <div style={{ display: "flex", gap: "8px" }}>
                    <button
                      type="button"
                      className="btn btn-secondary btn-sm"
                      disabled={Boolean(busyAction)}
                      onClick={() => executeAction("research")}
                    >
                      {busyAction === "research" ? "Researching..." : "AI + Web Research"}
                    </button>
                    <button
                      type="button"
                      className="btn btn-secondary btn-sm"
                      disabled={Boolean(busyAction)}
                      onClick={handleSaveResearch}
                    >
                      {busyAction === "save_research" ? "Saving..." : "Save Notes"}
                    </button>
                  </div>
                </div>

                <div className="form-group">
                  <label>Research Summary &amp; Trajectory</label>
                  <textarea
                    rows={3}
                    value={researchSummary}
                    onChange={(e) => setResearchSummary(e.target.value)}
                    placeholder="Provide overview of skill acquisition stages..."
                  />
                </div>

                <div className="grid-2">
                  <div className="form-group">
                    <label>Key Requirements (One per line)</label>
                    <textarea
                      rows={3}
                      value={requirements.join("\n")}
                      onChange={(e) => setRequirements(e.target.value.split("\n").filter(Boolean))}
                    />
                  </div>
                  <div className="form-group">
                    <label>Prerequisites (One per line)</label>
                    <textarea
                      rows={3}
                      value={prerequisites.join("\n")}
                      onChange={(e) => setPrerequisites(e.target.value.split("\n").filter(Boolean))}
                    />
                  </div>
                </div>

                <div className="grid-2">
                  <div className="form-group">
                    <label>Common Bottlenecks (One per line)</label>
                    <textarea
                      rows={3}
                      value={bottlenecks.join("\n")}
                      onChange={(e) => setBottlenecks(e.target.value.split("\n").filter(Boolean))}
                    />
                  </div>
                  <div className="form-group">
                    <label>Deliberate Practice Strategy</label>
                    <textarea
                      rows={3}
                      value={strategy}
                      onChange={(e) => setStrategy(e.target.value)}
                      placeholder="Pedagogical structure to eliminate bottlenecks..."
                    />
                  </div>
                </div>
              </div>

              {/* TIMETABLE REVIEW */}
              <div className="card" style={{ padding: "20px" }}>
                <div className="flex-between" style={{ marginBottom: "16px", flexWrap: "wrap", gap: "8px" }}>
                  <div>
                    <h3 style={{ margin: 0, fontSize: "1.15rem" }}>30-Day Timetable Review</h3>
                    <p className="text-xs text-muted" style={{ margin: "2px 0 0" }}>
                      {selectedRequest.plan
                        ? `30-Day Plan synthesized (${selectedRequest.plan.days.length} days). Review below before releasing.`
                        : "No timetable generated yet. Click Generate to build with Gemini."}
                    </p>
                  </div>

                  <button
                    type="button"
                    className="btn btn-primary btn-sm"
                    disabled={Boolean(busyAction)}
                    onClick={() => executeAction("generate_plan")}
                  >
                    {busyAction === "generate_plan"
                      ? "Generating 30 Days..."
                      : selectedRequest.plan
                      ? "Regenerate Plan"
                      : "Generate 30-Day Plan"}
                  </button>
                </div>

                {selectedRequest.plan ? (
                  <div>
                    <div style={{ backgroundColor: "var(--bg-secondary)", padding: "16px", borderRadius: "var(--radius-xs)", marginBottom: "16px" }}>
                      <div style={{ fontWeight: 600, color: "var(--accent-primary)", marginBottom: "4px" }}>
                        Goal Summary:
                      </div>
                      <div className="text-sm text-secondary" style={{ marginBottom: "10px", lineHeight: 1.5 }}>
                        {selectedRequest.plan.goal_summary}
                      </div>

                      <div style={{ fontWeight: 600, color: "var(--accent-primary)", marginBottom: "4px" }}>
                        Definition of Success:
                      </div>
                      <div className="text-sm text-secondary" style={{ lineHeight: 1.5 }}>
                        {selectedRequest.plan.definition_of_success}
                      </div>
                    </div>

                    {/* DAYS ACCORDION PREVIEW */}
                    <details style={{ marginBottom: "16px" }}>
                      <summary style={{ cursor: "pointer", fontWeight: 600, color: "var(--text-primary)", padding: "8px 0" }}>
                        Browse All 30 Days ({selectedRequest.plan.days.length} Days Generated)
                      </summary>
                      <div style={{ display: "flex", flexDirection: "column", gap: "8px", marginTop: "12px", maxHeight: "380px", overflowY: "auto" }}>
                        {selectedRequest.plan.days.map((day: any) => (
                          <div
                            key={day.day}
                            style={{
                              backgroundColor: "var(--bg-secondary)",
                              padding: "10px 14px",
                              borderRadius: "var(--radius-xs)",
                              border: "1px solid var(--border-subtle)",
                            }}
                          >
                            <div className="flex-between" style={{ marginBottom: "6px" }}>
                              <strong style={{ color: "var(--accent-primary)", fontSize: "0.85rem" }}>
                                {day.day_label || `Day ${day.day}`} ({day.calendar_date})
                              </strong>
                              <span className="badge badge-gray" style={{ fontSize: "0.65rem" }}>
                                {day.phase}
                              </span>
                            </div>

                            {day.blocks.map((b: any, bi: number) => (
                              <div key={bi} className="text-xs" style={{ padding: "3px 0" }}>
                                <span className="font-mono text-yellow">{b.start}&ndash;{b.end}</span> &bull; <strong>{b.activity}</strong> ({b.category}) &mdash; <span className="text-muted">{b.reason}</span>
                              </div>
                            ))}
                          </div>
                        ))}
                      </div>
                    </details>

                    {/* BOTTOM RELEASE TRIGGER */}
                    <div
                      style={{
                        padding: "16px",
                        backgroundColor: "var(--bg-secondary)",
                        borderRadius: "var(--radius-xs)",
                        border: "1px solid var(--accent-border)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        flexWrap: "wrap",
                        gap: "12px",
                      }}
                    >
                      <div>
                        <strong>Ready to release to user?</strong>
                        <div className="text-xs text-muted">
                          Once released, the user can start their 30-day goal and log hourly check-ins.
                        </div>
                      </div>

                      <button
                        type="button"
                        className="btn btn-primary"
                        disabled={
                          Boolean(busyAction) ||
                          selectedRequest.status === "ready" ||
                          selectedRequest.status === "archived"
                        }
                        onClick={() => executeAction("release")}
                      >
                        {busyAction === "release"
                          ? "Releasing..."
                          : selectedRequest.status === "ready"
                          ? "Already Released \u2713"
                          : "Release Plan to User \u2192"}
                      </button>
                    </div>
                  </div>
                ) : (
                  <div style={{ textAlign: "center", padding: "40px 20px" }}>
                    <p className="text-muted text-sm">
                      No timetable generated yet. Click "Generate 30-Day Plan" to run Gemini AI timetable synthesis.
                    </p>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="card" style={{ textAlign: "center", padding: "80px 20px" }}>
              <p className="text-muted text-sm">Select a goal request from the queue to start research, review curriculum, or release the plan.</p>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
