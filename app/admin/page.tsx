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

  // Tab & Payments State
  const [activeTab, setActiveTab] = useState<"payments" | "requests">("payments");
  const [payments, setPayments] = useState<any[]>([]);
  const [paymentStatusFilter, setPaymentStatusFilter] = useState<string>("all");
  const [paymentSearch, setPaymentSearch] = useState<string>("");
  const [copiedTxId, setCopiedTxId] = useState<string | null>(null);
  const [processingPaymentId, setProcessingPaymentId] = useState<string | null>(null);

  const [busyAction, setBusyAction] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  // Editable research state for selected request
  const [researchSummary, setResearchSummary] = useState("");
  const [requirements, setRequirements] = useState<string[]>([]);
  const [prerequisites, setPrerequisites] = useState<string[]>([]);
  const [bottlenecks, setBottlenecks] = useState<string[]>([]);
  const [strategy, setStrategy] = useState("");

  const loadPayments = useCallback(async (keyToUse = adminKey) => {
    if (!keyToUse) return;
    try {
      const res = await fetch("/api/admin/payments?status=all", {
        headers: {
          "content-type": "application/json",
          "x-admin-key": keyToUse,
        },
      });
      const data = await res.json();
      if (res.ok && data.requests) {
        setPayments(data.requests);
      }
    } catch (e) {
      console.warn("Failed to load payments:", e);
    }
  }, [adminKey]);

  // Attempt to restore adminKey from sessionStorage
  useEffect(() => {
    const saved = sessionStorage.getItem("auramind_admin_key");
    if (saved) {
      setAdminKey(saved);
      loadRequests(saved);
      loadPayments(saved);
    }
  }, [loadPayments]);

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
      loadPayments(keyToUse);

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

  const handleApprovePayment = async (id: string) => {
    setProcessingPaymentId(id);
    setErrorMsg("");
    setSuccessMsg("");
    try {
      const res = await fetch("/api/admin/payments", {
        method: "POST",
        headers: {
          "content-type": "application/json",
          "x-admin-key": adminKey,
        },
        body: JSON.stringify({ id, action: "approve" }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Approval failed.");
      setSuccessMsg(data.message || "Payment verified and plan activated!");
      await loadPayments(adminKey);
    } catch (err: any) {
      setErrorMsg(err.message || "Error approving payment.");
    } finally {
      setProcessingPaymentId(null);
    }
  };

  const handleRejectPayment = async (id: string) => {
    const reason = prompt("Enter rejection reason (optional):", "Invalid UTR / Payment not received");
    if (reason === null) return;
    setProcessingPaymentId(id);
    setErrorMsg("");
    setSuccessMsg("");
    try {
      const res = await fetch("/api/admin/payments", {
        method: "POST",
        headers: {
          "content-type": "application/json",
          "x-admin-key": adminKey,
        },
        body: JSON.stringify({ id, action: "reject", notes: reason }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Rejection failed.");
      setSuccessMsg("Payment marked as rejected.");
      await loadPayments(adminKey);
    } catch (err: any) {
      setErrorMsg(err.message || "Error rejecting payment.");
    } finally {
      setProcessingPaymentId(null);
    }
  };

  const pendingPaymentsCount = payments.filter((p) => p.status === "pending").length;
  const approvedPaymentsCount = payments.filter((p) => p.status === "approved").length;
  const totalRevenue = payments
    .filter((p) => p.status === "approved")
    .reduce((acc, p) => acc + (p.amount || 0), 0);

  const filteredPayments = payments.filter((p) => {
    const matchesStatus = paymentStatusFilter === "all" ? true : p.status === paymentStatusFilter;
    if (!matchesStatus) return false;
    if (!paymentSearch.trim()) return true;
    const q = paymentSearch.toLowerCase().trim();
    return (
      (p.transactionId || "").toLowerCase().includes(q) ||
      (p.userEmail || "").toLowerCase().includes(q) ||
      (p.userName || "").toLowerCase().includes(q) ||
      (p.auramindId || "").toLowerCase().includes(q)
    );
  });

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
              loadPayments(adminKey);
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
            onClick={() => {
              loadRequests();
              loadPayments();
            }}
            disabled={Boolean(busyAction) || Boolean(processingPaymentId)}
          >
            &#x21bb; Refresh Data
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

      {/* OPERATIONS TABS NAVIGATION */}
      <div style={{ display: "flex", gap: "10px", marginBottom: "20px", flexWrap: "wrap" }}>
        <button
          type="button"
          onClick={() => setActiveTab("payments")}
          className={activeTab === "payments" ? "btn btn-primary" : "btn btn-secondary"}
          style={{ padding: "10px 20px", fontWeight: 700, fontSize: "0.9rem" }}
        >
          💳 UPI Payments &amp; Plan Activations
          {pendingPaymentsCount > 0 && (
            <span
              style={{
                marginLeft: "8px",
                padding: "2px 8px",
                borderRadius: "9999px",
                backgroundColor: "#EF4444",
                color: "#FFFFFF",
                fontSize: "0.75rem",
                fontWeight: 800,
              }}
            >
              {pendingPaymentsCount} PENDING
            </span>
          )}
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("requests")}
          className={activeTab === "requests" ? "btn btn-primary" : "btn btn-secondary"}
          style={{ padding: "10px 20px", fontWeight: 700, fontSize: "0.9rem" }}
        >
          🎯 Curriculum Research &amp; Timetables ({requests.length})
        </button>
      </div>

      {errorMsg && <div className="alert alert-error" style={{ marginBottom: "16px" }}>{errorMsg}</div>}
      {successMsg && <div className="alert alert-success" style={{ marginBottom: "16px" }}>{successMsg}</div>}

      {/* TAB 1: PAYMENTS & PLAN ACTIVATION VIEW */}
      {activeTab === "payments" && (
        <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
          {/* METRICS ROW */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
              gap: "16px",
            }}
          >
            <div
              className="card"
              style={{
                padding: "18px 20px",
                backgroundColor: pendingPaymentsCount > 0 ? "rgba(239, 68, 68, 0.08)" : "var(--bg-card)",
                border: pendingPaymentsCount > 0 ? "1px solid rgba(239, 68, 68, 0.4)" : "1px solid var(--border-default)",
              }}
            >
              <div style={{ fontSize: "0.75rem", color: "var(--text-muted)", textTransform: "uppercase", fontWeight: 700 }}>
                Pending Verifications
              </div>
              <div style={{ fontSize: "1.8rem", fontWeight: 900, color: pendingPaymentsCount > 0 ? "#EF4444" : "var(--accent-primary)", marginTop: "4px" }}>
                {pendingPaymentsCount}
              </div>
              <div style={{ fontSize: "0.75rem", color: "var(--text-secondary)", marginTop: "2px" }}>
                SLA: Must activate within 6 hours
              </div>
            </div>

            <div className="card" style={{ padding: "18px 20px" }}>
              <div style={{ fontSize: "0.75rem", color: "var(--text-muted)", textTransform: "uppercase", fontWeight: 700 }}>
                Activated Plans
              </div>
              <div style={{ fontSize: "1.8rem", fontWeight: 900, color: "#10B981", marginTop: "4px" }}>
                {approvedPaymentsCount}
              </div>
              <div style={{ fontSize: "0.75rem", color: "var(--text-secondary)", marginTop: "2px" }}>
                Total user upgrades approved
              </div>
            </div>

            <div className="card" style={{ padding: "18px 20px" }}>
              <div style={{ fontSize: "0.75rem", color: "var(--text-muted)", textTransform: "uppercase", fontWeight: 700 }}>
                Total Revenue Collected
              </div>
              <div style={{ fontSize: "1.8rem", fontWeight: 900, color: "var(--accent-primary)", marginTop: "4px" }}>
                ₹{totalRevenue}
              </div>
              <div style={{ fontSize: "0.75rem", color: "var(--text-secondary)", marginTop: "2px" }}>
                Direct bank settlement via UPI
              </div>
            </div>

            <div className="card" style={{ padding: "18px 20px" }}>
              <div style={{ fontSize: "0.75rem", color: "var(--text-muted)", textTransform: "uppercase", fontWeight: 700 }}>
                Verification Protocol
              </div>
              <div style={{ fontSize: "1.2rem", fontWeight: 800, color: "#FFFFFF", marginTop: "8px" }}>
                UPI Bank Reconciliation
              </div>
              <div style={{ fontSize: "0.75rem", color: "var(--text-secondary)", marginTop: "4px" }}>
                Match 12-digit UTR with bank statement
              </div>
            </div>
          </div>

          {/* FILTER & SEARCH BAR */}
          <div
            className="card"
            style={{
              padding: "14px 18px",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              flexWrap: "wrap",
              gap: "12px",
            }}
          >
            <div style={{ display: "flex", gap: "10px", alignItems: "center", flex: 1, minWidth: "260px" }}>
              <input
                type="text"
                placeholder="Search by UTR number, email, name, or AM-ID..."
                value={paymentSearch}
                onChange={(e) => setPaymentSearch(e.target.value)}
                style={{
                  width: "100%",
                  padding: "8px 14px",
                  borderRadius: "8px",
                  backgroundColor: "var(--bg-surface)",
                  border: "1px solid var(--border-default)",
                  color: "#FFFFFF",
                  fontSize: "0.85rem",
                }}
              />
            </div>

            <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
              <span style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>Status:</span>
              <select
                value={paymentStatusFilter}
                onChange={(e) => setPaymentStatusFilter(e.target.value)}
                style={{
                  padding: "6px 12px",
                  borderRadius: "8px",
                  backgroundColor: "var(--bg-surface)",
                  border: "1px solid var(--border-default)",
                  color: "#FFFFFF",
                  fontSize: "0.82rem",
                }}
              >
                <option value="all">All ({payments.length})</option>
                <option value="pending">Pending ({pendingPaymentsCount})</option>
                <option value="approved">Approved ({approvedPaymentsCount})</option>
                <option value="rejected">Rejected ({payments.filter((p) => p.status === "rejected").length})</option>
              </select>
            </div>
          </div>

          {/* PAYMENTS QUEUE LIST */}
          {filteredPayments.length === 0 ? (
            <div className="card" style={{ padding: "60px 20px", textAlign: "center" }}>
              <div style={{ fontSize: "2rem", marginBottom: "8px" }}>💳</div>
              <h3 style={{ fontSize: "1.2rem", fontWeight: 700, margin: "0 0 6px" }}>No Payment Requests Found</h3>
              <p style={{ color: "var(--text-muted)", fontSize: "0.85rem", margin: 0 }}>
                {payments.length === 0
                  ? "When users submit UPI transactions on the pricing page, their requests will appear here for 6-hour approval."
                  : "No payment requests match your current search/filter."}
              </p>
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
              {filteredPayments.map((p: any) => {
                const isPending = p.status === "pending";
                const isApproved = p.status === "approved";
                const elapsedMs = Date.now() - new Date(p.createdAt).getTime();
                const remMs = 6 * 60 * 60 * 1000 - elapsedMs;
                const remHours = Math.floor(remMs / (60 * 60 * 1000));
                const remMins = Math.floor((remMs % (60 * 60 * 1000)) / (60 * 1000));

                return (
                  <div
                    key={p.id}
                    className="card"
                    style={{
                      padding: "20px 24px",
                      backgroundColor: isPending ? "#181818" : "var(--bg-card)",
                      border: isPending ? "1px solid rgba(255, 214, 0, 0.4)" : "1px solid var(--border-default)",
                      borderRadius: "14px",
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "flex-start",
                        flexWrap: "wrap",
                        gap: "12px",
                        marginBottom: "14px",
                      }}
                    >
                      <div>
                        <div style={{ display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap", marginBottom: "4px" }}>
                          <span style={{ fontWeight: 800, fontSize: "1.1rem", color: "#FFFFFF" }}>
                            {p.userName || p.userEmail.split("@")[0]}
                          </span>
                          <span style={{ fontSize: "0.8rem", color: "var(--text-muted)", fontFamily: "monospace" }}>
                            {p.userEmail}
                          </span>
                          {p.auramindId && (
                            <span className="badge badge-neutral" style={{ fontSize: "0.7rem", padding: "1px 6px" }}>
                              {p.auramindId}
                            </span>
                          )}
                        </div>
                        <div style={{ fontSize: "0.78rem", color: "var(--text-muted)" }}>
                          User ID: <code>{p.userId}</code>
                        </div>
                      </div>

                      {/* BADGES */}
                      <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                        <span
                          style={{
                            fontSize: "0.78rem",
                            fontWeight: 800,
                            padding: "4px 10px",
                            borderRadius: "6px",
                            backgroundColor:
                              p.tier === "diamond"
                                ? "rgba(168, 85, 247, 0.15)"
                                : p.tier === "platinum"
                                ? "rgba(59, 130, 246, 0.15)"
                                : "rgba(255, 214, 0, 0.15)",
                            color:
                              p.tier === "diamond"
                                ? "#C084FC"
                                : p.tier === "platinum"
                                ? "#60A5FA"
                                : "var(--accent-primary)",
                            border: "1px solid currentColor",
                          }}
                        >
                          {p.tier.toUpperCase()} PLAN &bull; ₹{p.amount}
                        </span>

                        <span
                          style={{
                            fontSize: "0.75rem",
                            fontWeight: 800,
                            padding: "4px 10px",
                            borderRadius: "6px",
                            backgroundColor: isPending ? "rgba(255, 214, 0, 0.15)" : isApproved ? "rgba(16, 185, 129, 0.15)" : "rgba(239, 68, 68, 0.15)",
                            color: isPending ? "var(--accent-primary)" : isApproved ? "#10B981" : "#EF4444",
                            border: `1px solid ${isPending ? "rgba(255, 214, 0, 0.3)" : isApproved ? "rgba(16, 185, 129, 0.3)" : "rgba(239, 68, 68, 0.3)"}`,
                          }}
                        >
                          {isPending ? "⏳ PENDING VERIFICATION" : isApproved ? "✓ PLAN ACTIVE" : "✕ REJECTED"}
                        </span>
                      </div>
                    </div>

                    {/* TRANSACTION ID & TIMESTAMPS */}
                    <div
                      style={{
                        backgroundColor: "#111111",
                        padding: "14px 18px",
                        borderRadius: "10px",
                        border: "1px solid var(--border-subtle)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        flexWrap: "wrap",
                        gap: "12px",
                        marginBottom: "14px",
                      }}
                    >
                      <div>
                        <div style={{ fontSize: "0.72rem", color: "var(--text-muted)", textTransform: "uppercase", fontWeight: 700 }}>
                          Submitted UPI UTR / Transaction ID
                        </div>
                        <div style={{ display: "flex", alignItems: "center", gap: "10px", marginTop: "2px" }}>
                          <span style={{ fontSize: "1.1rem", fontWeight: 900, color: "#FFFFFF", fontFamily: "monospace", letterSpacing: "0.05em" }}>
                            {p.transactionId}
                          </span>
                          <button
                            type="button"
                            onClick={() => {
                              navigator.clipboard.writeText(p.transactionId);
                              setCopiedTxId(p.transactionId);
                              setTimeout(() => setCopiedTxId(null), 2000);
                            }}
                            className="btn btn-secondary btn-sm"
                            style={{ padding: "2px 8px", fontSize: "0.72rem" }}
                          >
                            {copiedTxId === p.transactionId ? "Copied ✓" : "Copy UTR"}
                          </button>
                        </div>
                      </div>

                      <div style={{ textAlign: "right" }}>
                        <div style={{ fontSize: "0.72rem", color: "var(--text-muted)" }}>
                          Submitted: {new Date(p.createdAt).toLocaleDateString()} {new Date(p.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                        </div>
                        {isPending && (
                          <div style={{ fontSize: "0.78rem", fontWeight: 700, color: remMs <= 0 ? "#EF4444" : remHours < 2 ? "#F59E0B" : "var(--accent-primary)", marginTop: "2px" }}>
                            {remMs <= 0 ? "⚠ 6h SLA Exceeded" : `⏳ ${remHours}h ${remMins}m remaining in 6h SLA`}
                          </div>
                        )}
                        {isApproved && (
                          <div style={{ fontSize: "0.75rem", color: "#10B981", marginTop: "2px" }}>
                            Approved by {p.reviewedBy || "Admin"}
                          </div>
                        )}
                      </div>
                    </div>

                    {p.notes && (
                      <div style={{ fontSize: "0.82rem", color: "var(--text-secondary)", marginBottom: "14px", fontStyle: "italic" }}>
                        Note: {p.notes}
                      </div>
                    )}

                    {/* ACTION BUTTONS */}
                    {isPending && (
                      <div style={{ display: "flex", gap: "10px", justifyContent: "flex-end" }}>
                        <button
                          type="button"
                          onClick={() => handleApprovePayment(p.id)}
                          disabled={processingPaymentId === p.id}
                          className="btn btn-primary"
                          style={{
                            backgroundColor: "#10B981",
                            borderColor: "#10B981",
                            color: "#000000",
                            fontWeight: 800,
                            padding: "8px 18px",
                            fontSize: "0.85rem",
                          }}
                        >
                          {processingPaymentId === p.id
                            ? "Activating Plan..."
                            : `✓ Approve & Activate ${p.tier.toUpperCase()} Plan`}
                        </button>
                        <button
                          type="button"
                          onClick={() => handleRejectPayment(p.id)}
                          disabled={processingPaymentId === p.id}
                          className="btn btn-secondary"
                          style={{
                            color: "#EF4444",
                            borderColor: "rgba(239, 68, 68, 0.4)",
                            padding: "8px 14px",
                            fontSize: "0.85rem",
                          }}
                        >
                          ✕ Reject
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* TAB 2: CURRICULUM RESEARCH & DISPATCH QUEUE */}
      {activeTab === "requests" && (
        <div
          className="admin-layout"
          style={{
            display: "grid",
            gridTemplateColumns: "340px 1fr",
            gap: "20px",
            alignItems: "start",
          }}
        >
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
      )}
    </div>
  );
}
