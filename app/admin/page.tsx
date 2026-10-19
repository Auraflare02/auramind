"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { formatLevel } from "@/lib/categories";

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

  const syncSelectedRequestState = (req: any) => {
    const rd = req.research_data;
    setResearchSummary(rd?.summary || req.research || "");
    setRequirements(rd?.requirements || ["Master fundamental mechanics", "Spaced retrieval intervals"]);
    setPrerequisites(rd?.prerequisites || ["Core conceptual literacy"]);
    setBottlenecks(rd?.common_bottlenecks || ["Cognitive fatigue in week 2", "Distraction during unguided practice"]);
    setStrategy(rd?.strategy || "30-day deliberate practice ramp with scheduled active recall.");
  };

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
      <div className="container-narrow" style={{ paddingTop: "80px" }}>
        <div className="card card-highlight">
          <div style={{ textAlign: "center", marginBottom: "24px" }}>
            <span className="badge badge-yellow" style={{ marginBottom: "8px" }}>Admin Access</span>
            <h1 style={{ fontSize: "1.8rem" }}>AuraMind Control Panel</h1>
            <p>Enter your AURAMIND_ADMIN_KEY to manage goal requests and curriculum research.</p>
          </div>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              loadRequests(adminKey);
            }}
          >
            <div className="form-group">
              <label htmlFor="adminKey">Admin Secret Key</label>
              <input
                id="adminKey"
                type="password"
                placeholder="Enter AURAMIND_ADMIN_KEY"
                value={adminKey}
                onChange={(e) => setAdminKey(e.target.value)}
                required
              />
            </div>

            {errorMsg && <div className="alert alert-error">{errorMsg}</div>}

            <button type="submit" className="btn btn-primary" style={{ width: "100%" }}>
              Sign In to Admin Workspace &rarr;
            </button>
          </form>
        </div>
      </div>
    );
  }

  // MAIN ADMIN DASHBOARD
  return (
    <div className="container" style={{ paddingTop: "30px", paddingBottom: "60px" }}>
      {/* HEADER */}
      <div className="flex-between" style={{ marginBottom: "24px", flexWrap: "wrap" }}>
        <div>
          <span className="badge badge-yellow" style={{ marginBottom: "6px" }}>Admin Research Panel</span>
          <h1 style={{ fontSize: "2rem", margin: "4px 0" }}>Goal Request Queue</h1>
        </div>

        <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
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

      {errorMsg && <div className="alert alert-error">{errorMsg}</div>}
      {successMsg && <div className="alert alert-success">{successMsg}</div>}

      <div style={{ display: "grid", gridTemplateColumns: "360px 1fr", gap: "24px" }}>
        {/* LEFT COLUMN: REQUEST QUEUE LIST */}
        <div>
          <div className="card" style={{ padding: "16px", marginBottom: "16px" }}>
            <div className="flex-between" style={{ marginBottom: "12px" }}>
              <span className="text-xs text-muted" style={{ fontWeight: 700, textTransform: "uppercase" }}>
                Filter Status ({filteredRequests.length})
              </span>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                style={{ padding: "4px 8px", minHeight: "32px", fontSize: "0.85rem", width: "auto" }}
              >
                <option value="all">All Statuses</option>
                <option value="pending">Pending</option>
                <option value="researching">Researching</option>
                <option value="review">Review</option>
                <option value="ready">Ready</option>
                <option value="archived">Archived</option>
              </select>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "8px", maxHeight: "650px", overflowY: "auto" }}>
              {filteredRequests.length === 0 ? (
                <p className="text-sm text-muted" style={{ padding: "20px 0", textAlign: "center" }}>
                  No requests match this status.
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
                        padding: "12px 14px",
                        borderRadius: "8px",
                        backgroundColor: isSelected ? "var(--bg-elevated)" : "var(--bg-secondary)",
                        border: isSelected ? "1px solid var(--yellow-primary)" : "1px solid var(--border-color)",
                        cursor: "pointer",
                        transition: "all 0.15s ease",
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
                          style={{ fontSize: "0.7rem", padding: "2px 8px" }}
                        >
                          {r.status}
                        </span>
                        <span className="text-xs font-mono text-muted">
                          {r.request_code || r.id.slice(0, 8)}
                        </span>
                      </div>

                      <div style={{ fontWeight: 600, fontSize: "0.95rem", color: "var(--text-primary)", marginBottom: "4px" }}>
                        {ctx.goal || "Untitled Goal"}
                      </div>

                      <div className="text-xs text-muted">
                        {r.category || ctx.category} &bull; {ctx.hours}h/day ({ctx.focus})
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: WORKSPACE FOR SELECTED REQUEST */}
        <div>
          {selectedRequest ? (
            <div>
              {/* TOP ACTION BAR */}
              <div className="card card-highlight" style={{ marginBottom: "20px" }}>
                <div className="flex-between" style={{ flexWrap: "wrap", marginBottom: "16px" }}>
                  <div>
                    <div className="flex-between" style={{ gap: "10px", justifyContent: "flex-start", marginBottom: "6px" }}>
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
                    <h2 style={{ fontSize: "1.6rem", margin: "4px 0" }}>
                      {selectedRequest.context?.goal}
                    </h2>
                    <div className="text-xs text-muted">
                      Created: {new Date(selectedRequest.created_at).toLocaleString()}
                      {selectedRequest.plan_source && ` \u2022 Plan Source: ${selectedRequest.plan_source.toUpperCase()}`}
                    </div>
                  </div>

                  <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
                    <Link
                      href={`/goal/${selectedRequest.id}`}
                      target="_blank"
                      className="btn btn-secondary btn-sm"
                    >
                      Open User View &#8599;
                    </Link>

                    {/* RELEASE BUTTON (CRITICAL ACCEPTANCE REQUIREMENT) */}
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
                        ? "Releasing…"
                        : selectedRequest.status === "ready"
                        ? "Released to User \u2713"
                        : "Release to User"}
                    </button>
                  </div>
                </div>

                {/* USER CONTEXT BREAKDOWN */}
                <details style={{ backgroundColor: "var(--bg-secondary)", padding: "12px 16px", borderRadius: "8px", border: "1px solid var(--border-color)" }}>
                  <summary style={{ cursor: "pointer", fontWeight: 600, fontSize: "0.9rem", color: "var(--text-primary)" }}>
                    User Context &amp; Constraints Checklist
                  </summary>
                  <div style={{ marginTop: "12px", display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: "12px", fontSize: "0.875rem" }}>
                    <div>
                      <strong>Category:</strong> {selectedRequest.category || selectedRequest.context?.category}
                    </div>
                    <div>
                      <strong>Daily Availability:</strong> {selectedRequest.context?.hours}h in {selectedRequest.context?.focus}
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
                      <strong>Timezone:</strong> {selectedRequest.timezone || selectedRequest.context?.timezone}
                    </div>
                    <div>
                      <strong>Deadline:</strong> {selectedRequest.context?.deadline || "None"}
                    </div>
                    <div style={{ gridColumn: "span 2" }}>
                      <strong>Fixed Commitments:</strong> {selectedRequest.context?.fixed || "None"}
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
              <div className="card" style={{ marginBottom: "20px" }}>
                <div className="flex-between" style={{ marginBottom: "16px" }}>
                  <div>
                    <h3>Research &amp; Pedagogical Strategy</h3>
                    <p className="text-xs text-muted" style={{ margin: 0 }}>
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
                      {busyAction === "research" ? "Researching…" : "AI + Web Research"}
                    </button>
                    <button
                      type="button"
                      className="btn btn-outline-yellow btn-sm"
                      disabled={Boolean(busyAction)}
                      onClick={handleSaveResearch}
                    >
                      {busyAction === "save_research" ? "Saving…" : "Save Notes"}
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

              {/* TIMETABLE GENERATION & REVIEW */}
              <div className="card">
                <div className="flex-between" style={{ marginBottom: "16px" }}>
                  <div>
                    <h3>30-Day Timetable Review</h3>
                    <p className="text-xs text-muted" style={{ margin: 0 }}>
                      {selectedRequest.plan
                        ? `30-Day Plan synthesized (${selectedRequest.plan.days.length} days). Review below before releasing.`
                        : "No timetable generated yet. Click Generate to build with Gemini."}
                    </p>
                  </div>

                  <div style={{ display: "flex", gap: "8px" }}>
                    <button
                      type="button"
                      className="btn btn-primary btn-sm"
                      disabled={Boolean(busyAction)}
                      onClick={() => executeAction("generate_plan")}
                    >
                      {busyAction === "generate_plan"
                        ? "Generating 30 Days…"
                        : selectedRequest.plan
                        ? "Regenerate Plan"
                        : "Generate 30-Day Plan"}
                    </button>
                  </div>
                </div>

                {selectedRequest.plan ? (
                  <div>
                    <div style={{ backgroundColor: "var(--bg-secondary)", padding: "16px", borderRadius: "8px", marginBottom: "16px" }}>
                      <div style={{ fontWeight: 700, color: "var(--yellow-primary)", marginBottom: "4px" }}>
                        Goal Summary:
                      </div>
                      <div className="text-sm" style={{ marginBottom: "10px" }}>
                        {selectedRequest.plan.goal_summary}
                      </div>

                      <div style={{ fontWeight: 700, color: "var(--yellow-primary)", marginBottom: "4px" }}>
                        Definition of Success:
                      </div>
                      <div className="text-sm">
                        {selectedRequest.plan.definition_of_success}
                      </div>
                    </div>

                    {/* DAYS ACCORDION PREVIEW */}
                    <details style={{ marginBottom: "16px" }}>
                      <summary style={{ cursor: "pointer", fontWeight: 600, color: "var(--text-primary)", padding: "8px 0" }}>
                        Browse All 30 Days ({selectedRequest.plan.days.length} Days Generated)
                      </summary>
                      <div style={{ display: "flex", flexDirection: "column", gap: "10px", marginTop: "12px", maxHeight: "400px", overflowY: "auto" }}>
                        {selectedRequest.plan.days.map((day: any) => (
                          <div
                            key={day.day}
                            style={{
                              backgroundColor: "var(--bg-secondary)",
                              padding: "12px",
                              borderRadius: "6px",
                              border: "1px solid var(--border-color)",
                            }}
                          >
                            <div className="flex-between" style={{ marginBottom: "6px" }}>
                              <strong style={{ color: "var(--yellow-primary)" }}>
                                {day.day_label || `Day ${day.day}`} ({day.calendar_date})
                              </strong>
                              <span className="badge badge-gray" style={{ fontSize: "0.7rem" }}>
                                {day.phase}
                              </span>
                            </div>

                            {day.blocks.map((b: any, bi: number) => (
                              <div key={bi} className="text-xs" style={{ padding: "4px 0" }}>
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
                        backgroundColor: "var(--bg-elevated)",
                        borderRadius: "8px",
                        border: "1px solid var(--yellow-border)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
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
                          ? "Releasing…"
                          : selectedRequest.status === "ready"
                          ? "Already Released \u2713"
                          : "Release Plan to User &rarr;"}
                      </button>
                    </div>
                  </div>
                ) : (
                  <div style={{ textAlign: "center", padding: "40px 20px" }}>
                    <p className="text-muted">
                      No timetable generated yet. Click "Generate 30-Day Plan" to run Gemini AI timetable synthesis.
                    </p>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="card" style={{ textAlign: "center", padding: "80px 20px" }}>
              <p className="text-muted">Select a goal request from the queue to start research, review the curriculum, or release the plan.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
