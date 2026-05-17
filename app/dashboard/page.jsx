"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend } from "recharts";

const STEPS = [
  { label: "Finding leads"         },
  { label: "Researching companies" },
  { label: "Writing emails"        },
  { label: "Sending emails"        },
  { label: "Generating report"     },
];

const PRESET_QUERIES = [
  "B2B SaaS startups in Germany",
  "E-commerce startups in the UK",
  "Fintech companies in London",
  "Healthcare AI startups in Europe",
];

export default function Dashboard() {
  const [query,      setQuery]      = useState("");
  const [count,      setCount]      = useState(5);
  const [companySize, setCompanySize] = useState("");
  const [targetRole, setTargetRole] = useState("");
  const [techStack, setTechStack] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [loading,    setLoading]    = useState(false);
  const [stepIdx,    setStepIdx]    = useState(-1);
  const [error,      setError]      = useState("");
  const [leads,      setLeads]      = useState([]);
  const [researches, setResearches] = useState([]);
  const [emails,     setEmails]     = useState([]);
  const [report,     setReport]     = useState(null);
  const [insights,   setInsights]   = useState("");
  const [activeTab,  setActiveTab]  = useState("leads");
  const [done,       setDone]       = useState(false);
  const [researchStatus, setResearchStatus] = useState({});
  const [emailStatus, setEmailStatus] = useState({});
  const [history, setHistory] = useState([]);
  const [editingEmailId, setEditingEmailId] = useState(null);
  const [editSubject, setEditSubject] = useState("");
  const [editBody, setEditBody] = useState("");
  const [toastMessage, setToastMessage] = useState("");

  const loadHistory = async () => {
    try {
      const res = await fetch("/api/campaign");
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed loading campaign history");
      setHistory(data.campaigns || []);
    } catch (err) {
      console.error("History load failed:", err);
    }
  };

  useEffect(() => {
    loadHistory();
  }, []);

  const runCampaign = async (overrideQuery, overrideCount) => {
    const nextQuery =
      typeof overrideQuery === "string"
        ? overrideQuery
        : query;
    const effectiveQuery = nextQuery.trim();
    const effectiveCount = overrideCount ?? count;
    if (!effectiveQuery || loading) return;
    setLoading(true); setDone(false); setError("");
    setResearchStatus({}); setEmailStatus({});
    setLeads([]); setResearches([]); setEmails([]);
    setReport(null); setInsights(""); setStepIdx(0);

    let idx = 0;
    const interval = setInterval(() => {
      idx = Math.min(idx + 1, STEPS.length - 1);
      setStepIdx(idx);
    }, 5000);

    try {
      const res  = await fetch("/api/campaign", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          query: effectiveQuery, 
          count: effectiveCount,
          companySize: companySize || undefined,
          targetRole: targetRole || undefined,
          techStack: techStack || undefined
        }),
      });
      clearInterval(interval);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Campaign failed");

      setLeads(data.leads);
      setResearches(data.researches);
      setEmails(data.emails);
      setResearchStatus(
        Object.fromEntries((data.researches || []).map((r) => [r.leadId, r.reviewStatus || "pending"]))
      );
      setEmailStatus(
        Object.fromEntries((data.emails || []).map((e) => [e.leadId, e.reviewStatus || "pending"]))
      );
      setReport(data.report);
      setInsights(data.insights);
      setDone(true); setStepIdx(-1); setActiveTab("report");
      loadHistory();
    } catch (err) {
      clearInterval(interval);
      setError(err.message);
      setStepIdx(-1);
    } finally {
      setLoading(false);
    }
  };

  const hasResults = leads.length > 0;
  const currentStep = stepIdx >= 0 ? STEPS[stepIdx] : null;
  const progressPct = loading && stepIdx >= 0
    ? Math.round(((stepIdx + 1) / STEPS.length) * 100)
    : done
      ? 100
      : 0;

  const TABS = [
    { id: "leads",    label: `Leads (${leads.length})` },
    { id: "research", label: "Research" },
    { id: "emails",   label: "Emails" },
    { id: "report",   label: "Report" },
  ];

  const getLeadWebsite = (leadId) => leads.find((l) => l.id === leadId)?.website;

  const markResearch = async (leadId, status) => {
    setResearchStatus(prev => ({ ...prev, [leadId]: status }));
    try {
      const dbLeadId = leads.find((l) => l.id === leadId)?.dbId;
      if (!dbLeadId) return;
      await fetch("/api/campaign", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: "research", action: status, dbLeadId }),
      });
    } catch (err) {
      console.error("Failed to persist research action:", err);
    }
  };

  const markEmail = async (leadId, status) => {
    setEmailStatus(prev => ({ ...prev, [leadId]: status }));
    try {
      const dbLeadId = leads.find((l) => l.id === leadId)?.dbId;
      if (!dbLeadId) return;
      const res = await fetch("/api/campaign", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: "email", action: status, dbLeadId }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to update email status");

      if (status === "approved") {
        setReport((prev) => {
          if (!prev) return prev;
          const nextLeads = prev.leads.map((item) =>
            item.leadId === leadId
              ? { ...item, status: data.status || "sent", sentAt: data.sentAt || item.sentAt || new Date().toISOString() }
              : item
          );
          const sentCount = nextLeads.filter((item) => item.status === "sent").length;
          const unsentCount = nextLeads.filter((item) => item.status !== "sent").length;
          return { ...prev, leads: nextLeads, emailsSent: sentCount, emailsUnsent: unsentCount };
        });
        loadHistory();
      }

      if (status === "skipped") {
        setReport((prev) => {
          if (!prev) return prev;
          const nextLeads = prev.leads.map((item) =>
            item.leadId === leadId ? { ...item, status: "unsent", sentAt: null } : item
          );
          const sentCount = nextLeads.filter((item) => item.status === "sent").length;
          const unsentCount = nextLeads.filter((item) => item.status !== "sent").length;
          return { ...prev, leads: nextLeads, emailsSent: sentCount, emailsUnsent: unsentCount };
        });
        loadHistory();
      }
    } catch (err) {
      console.error("Failed to persist email action:", err);
    }
  };

  const regenerateEmail = async (leadId) => {
    let regeneratedPayload = null;
    setEmails(prev => prev.map(email => {
      if (email.leadId !== leadId) return email;
      const variants = [
        `Quick idea for ${email.companyName}'s growth`,
        `${email.companyName}: a smarter outbound workflow`,
        `A faster way to scale outreach at ${email.companyName}`,
      ];
      const nextSubject = variants[Math.floor(Math.random() * variants.length)];
      const updated = {
        ...email,
        subject: nextSubject,
        body: `${email.body}\n\nP.S. Happy to share 2 similar campaign examples from your space.`,
      };
      regeneratedPayload = updated;
      return updated;
    }));
    setEmailStatus(prev => ({ ...prev, [leadId]: "regenerated" }));

    try {
      const dbLeadId = leads.find((l) => l.id === leadId)?.dbId;
      if (!dbLeadId || !regeneratedPayload) return;
      await fetch("/api/campaign", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "email",
          action: "regenerated",
          dbLeadId,
          subject: regeneratedPayload.subject,
          body: regeneratedPayload.body,
        }),
      });
      setReport((prev) => {
        if (!prev) return prev;
        const nextLeads = prev.leads.map((item) =>
          item.leadId === leadId ? { ...item, status: "unsent", sentAt: null } : item
        );
        const sentCount = nextLeads.filter((item) => item.status === "sent").length;
        const unsentCount = nextLeads.filter((item) => item.status !== "sent").length;
        return { ...prev, leads: nextLeads, emailsSent: sentCount, emailsUnsent: unsentCount };
      });
    } catch (err) {
      console.error("Failed to persist regenerate action:", err);
    }
  };

  const exportCSV = (campaignId = null) => {
    let url = "/api/export";
    if (campaignId) url += `?campaignId=${campaignId}`;
    window.open(url, "_blank");
  };

  const deleteCampaign = async (id) => {
    if (!confirm("Are you sure you want to delete this campaign?")) return;
    try {
      const res = await fetch(`/api/campaign?id=${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete campaign");
      
      setHistory(prev => prev.filter(c => c.id !== id));
      setToastMessage("Campaign deleted successfully");
      setTimeout(() => setToastMessage(""), 3000);
    } catch (err) {
      console.error(err);
      alert("Failed to delete campaign");
    }
  };

  const approveAllEmails = async () => {
    if (emails.length === 0) return;
    const dbLeadId = leads[0]?.dbId;
    if (!dbLeadId) return;
    
    try {
      const res = await fetch("/api/campaign", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: "email", action: "approve_all", dbLeadId }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      const updatedStatus = { ...emailStatus };
      emails.forEach(e => {
        if (!updatedStatus[e.leadId] || updatedStatus[e.leadId] === "pending" || updatedStatus[e.leadId] === "regenerated") {
          updatedStatus[e.leadId] = "approved";
        }
      });
      setEmailStatus(updatedStatus);

      setReport(prev => {
        if (!prev) return prev;
        const nextLeads = prev.leads.map(item => {
          if (!emailStatus[item.leadId] || emailStatus[item.leadId] === "pending" || emailStatus[item.leadId] === "regenerated") {
            return { ...item, status: "sent", sentAt: new Date().toISOString() };
          }
          return item;
        });
        const sentCount = nextLeads.filter((item) => item.status === "sent").length;
        const unsentCount = nextLeads.filter((item) => item.status !== "sent").length;
        return { ...prev, leads: nextLeads, emailsSent: sentCount, emailsUnsent: unsentCount };
      });
      
      loadHistory();
    } catch (err) {
      console.error("Failed to approve all:", err);
    }
  };

  const saveEmailEdit = async (leadId) => {
    try {
      const dbLeadId = leads.find((l) => l.id === leadId)?.dbId;
      if (!dbLeadId) return;
      await fetch("/api/campaign", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: "email", action: "edit", dbLeadId, subject: editSubject, body: editBody }),
      });
      setEmails(prev => prev.map(e => e.leadId === leadId ? { ...e, subject: editSubject, body: editBody } : e));
      setEditingEmailId(null);
    } catch (err) {
      console.error("Failed to save edit:", err);
    }
  };

  return (
    <div className="dash-root">

      {/* HEADER */}
      <header className="dash-header">
        <Link href="/" className="dash-logo">
          ARCHON<span>.</span>
        </Link>
        <div className={`dash-status ${loading ? "active" : "idle"}`}>
          <div className={`dash-dot ${loading ? "active" : "idle"}`} />
          {loading ? `Agent ${stepIdx + 1} running...` : "Ready"}
        </div>
      </header>

      {/* MAIN */}
      <main className="dash-main">
        {/* Animated Background Mesh */}
        <div className="dash-bg-mesh" />

        {/* SEARCH CARD (Command Palette) */}
        <motion.div 
          className="dash-search-card"
          initial={{ opacity: 0, y: -20, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.5, ease: "easeOut" }}
        >
          <div className="dash-search-label">New Campaign</div>
          <div className="dash-presets-row">
            {PRESET_QUERIES.map((preset) => (
              <button
                key={preset}
                type="button"
                className="dash-preset-btn"
                onClick={() => setQuery(preset)}
                disabled={loading}
              >
                {preset}
              </button>
            ))}
          </div>
          <div className="dash-search-row">
            <input
              id="campaign-query"
              type="text"
              className="dash-input"
              value={query}
              onChange={e => setQuery(e.target.value)}
              onKeyDown={e => e.key === "Enter" && runCampaign()}
              placeholder='e.g. "SaaS startups in Europe with 10-50 employees"'
              disabled={loading}
            />
            <select
              id="lead-count"
              className="dash-select"
              value={count}
              onChange={e => setCount(Number(e.target.value))}
              disabled={loading}
            >
              <option value={3}>3 leads</option>
              <option value={5}>5 leads</option>
              <option value={10}>10 leads</option>
            </select>
            <button
              id="run-campaign-btn"
              className="dash-run-btn"
              onClick={() => runCampaign()}
              disabled={loading || !query.trim()}
            >
              {loading ? "Running..." : "Run Campaign"}
            </button>
          </div>

          <div style={{ marginTop: '0.5rem', textAlign: 'left' }}>
            <button 
              className="dash-action-btn ghost" 
              onClick={() => setShowFilters(!showFilters)}
              style={{ fontSize: '0.8rem', padding: '4px 8px' }}
            >
              {showFilters ? "- Hide Advanced Filters" : "+ Advanced Filters"}
            </button>
          </div>

          {showFilters && (
            <motion.div 
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem', marginTop: '1rem', textAlign: 'left' }}
            >
              <div>
                <label className="dash-cell-label" style={{ display: 'block', marginBottom: '4px' }}>Company Size</label>
                <select className="dash-select" style={{ width: '100%' }} value={companySize} onChange={e => setCompanySize(e.target.value)} disabled={loading}>
                  <option value="">Any Size</option>
                  <option value="1-10">1-10</option>
                  <option value="11-50">11-50</option>
                  <option value="51-200">51-200</option>
                  <option value="201-500">201-500</option>
                  <option value="500+">500+</option>
                </select>
              </div>
              <div>
                <label className="dash-cell-label" style={{ display: 'block', marginBottom: '4px' }}>Target Role</label>
                <input className="dash-input" style={{ width: '100%' }} placeholder="e.g. CTO, VP of Sales" value={targetRole} onChange={e => setTargetRole(e.target.value)} disabled={loading} />
              </div>
              <div>
                <label className="dash-cell-label" style={{ display: 'block', marginBottom: '4px' }}>Tech Stack</label>
                <input className="dash-input" style={{ width: '100%' }} placeholder="e.g. React, Salesforce" value={techStack} onChange={e => setTechStack(e.target.value)} disabled={loading} />
              </div>
            </motion.div>
          )}

          {loading && currentStep && (
            <div className="dash-step">
              <div className="dash-spinner" />
              {currentStep.label}... ({progressPct}%)
            </div>
          )}
          {(loading || done) && (
            <div className="dash-progress-wrap">
              <div className="dash-progress-bar">
                <div
                  className="dash-progress-fill"
                  style={{ width: `${progressPct}%` }}
                />
              </div>
              <div className="dash-progress-label">
                {done ? "Campaign complete" : `Step ${stepIdx + 1}/${STEPS.length}`}
              </div>
            </div>
          )}
          {done && (
            <div className="dash-step done">
              Campaign completed successfully
            </div>
          )}
          {error && <div className="dash-error">{error}</div>}
        </motion.div>

        {/* PIPELINE */}
        <motion.div 
          className="dash-pipeline"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3, duration: 0.5 }}
        >
          {STEPS.map((s, i) => (
            <React.Fragment key={s.label}>
              <div className={`dash-pill ${loading && stepIdx === i ? "active" : ""}`}>
                {String(i + 1).padStart(2, "0")} {s.label}
              </div>
              {i < STEPS.length - 1 && <div className={`dash-pipeline-line ${loading && stepIdx >= i ? "active" : ""}`} />}
            </React.Fragment>
          ))}
        </motion.div>

        {/* STATS */}
        {report && (
          <div className="dash-stats">
            {[
              { val: report.totalLeads,         lbl: "Total Leads"    },
              { val: report.emailsSent,         lbl: "Emails Sent"    },
              { val: report.emailsUnsent ?? 0,  lbl: "Emails Unsent"  },
              { val: `${report.replyRate}%`,    lbl: "Est. Reply Rate"},
            ].map(s => (
              <div key={s.lbl} className="dash-stat-card">
                <div className="dash-stat-val">{s.val}</div>
                <div className="dash-stat-lbl">{s.lbl}</div>
              </div>
            ))}
          </div>
        )}

        {/* INSIGHTS */}
        {insights && (
          <div className="dash-insights">
            <div className="dash-insights-hdr">AI Insights</div>
            <div className="dash-insights-txt">{insights}</div>
          </div>
        )}

        {/* TABS */}
        {hasResults && (
          <div>
            <div className="dash-tabs-bar">
              {TABS.map(tab => (
                <button
                  key={tab.id}
                  id={`tab-${tab.id}`}
                  className={`dash-tab ${activeTab === tab.id ? "active" : ""}`}
                  onClick={() => setActiveTab(tab.id)}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* LEADS */}
            {activeTab === "leads" && leads.map((lead, i) => (
              <div key={lead.id} className="dash-card" style={{ animationDelay: `${i * 60}ms` }}>
                <div className="dash-lead-row">
                  <div>
                    <div className="dash-lead-name">{lead.companyName}</div>
                    <div className="dash-lead-meta">{lead.contactName} · {lead.industry}</div>
                    <div className="dash-lead-email">{lead.email} · {lead.location}</div>
                  </div>
                  <div style={{ textAlign: "right", flexShrink: 0 }}>
                    <div className="dash-size-badge">{lead.size} emp.</div>
                    <div className="dash-website">{lead.website}</div>
                  </div>
                </div>
              </div>
            ))}

            {/* RESEARCH */}
            {activeTab === "research" && researches.map((r, i) => (
              <div key={r.leadId} className="dash-card" style={{ animationDelay: `${i * 60}ms` }}>
                {getLeadWebsite(r.leadId) ? (
                  <a
                    href={getLeadWebsite(r.leadId)}
                    target="_blank"
                    rel="noreferrer"
                    className="dash-research-name dash-email-company-link"
                  >
                    {r.companyName}
                  </a>
                ) : (
                  <div className="dash-research-name">{r.companyName}</div>
                )}
                <div className="dash-research-grid">
                  <div className="dash-research-cell">
                    <div className="dash-cell-label">Pain Point</div>
                    {r.problem}
                  </div>
                  <div className="dash-research-cell">
                    <div className="dash-cell-label">Product Fit</div>
                    {r.product}
                  </div>
                  <div className="dash-research-cell">
                    <div className="dash-cell-label">Opportunity</div>
                    {r.opportunity}
                  </div>
                </div>
                <div className="dash-tech-tags">
                  {r.techStack.map(tech => (
                    <span key={tech} className="dash-tech-tag">{tech}</span>
                  ))}
                </div>
                <div className="dash-actions-row">
                  <button
                    className="dash-action-btn"
                    onClick={() => markResearch(r.leadId, "approved")}
                  >
                    Approve
                  </button>
                  <button
                    className="dash-action-btn ghost"
                    onClick={() => markResearch(r.leadId, "skipped")}
                  >
                    Skip
                  </button>
                  {researchStatus[r.leadId] && (
                    <span className={`dash-action-status ${researchStatus[r.leadId]}`}>
                      {researchStatus[r.leadId]}
                    </span>
                  )}
                </div>
              </div>
            ))}

            {/* EMAILS */}
            {activeTab === "emails" && (
              <>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem' }}>
                  <h3 style={{ color: '#fff', fontSize: '1rem', fontWeight: 500 }}>Generated Emails</h3>
                  <button className="dash-action-btn" style={{ background: '#7fffd4', color: '#000' }} onClick={approveAllEmails}>
                    Approve All Pending
                  </button>
                </div>
                {emails.map((email, i) => (
                  <div key={email.leadId} className="dash-card" style={{ animationDelay: `${i * 60}ms` }}>
                    <div className="dash-email-top">
                      {getLeadWebsite(email.leadId) ? (
                        <a href={getLeadWebsite(email.leadId)} target="_blank" rel="noreferrer" className="dash-email-company dash-email-company-link">
                          {email.companyName}
                        </a>
                      ) : (
                        <div className="dash-email-company">{email.companyName}</div>
                      )}
                      <div className="dash-email-to">{email.to}</div>
                    </div>
                    <div className="dash-email-box">
                      {editingEmailId === email.leadId ? (
                        <>
                          <input 
                            className="dash-input" 
                            style={{ marginBottom: '0.5rem', width: '100%', fontSize: '0.9rem' }} 
                            value={editSubject} 
                            onChange={(e) => setEditSubject(e.target.value)} 
                          />
                          <textarea 
                            className="dash-input" 
                            style={{ width: '100%', height: '150px', fontSize: '0.9rem', resize: 'vertical' }} 
                            value={editBody} 
                            onChange={(e) => setEditBody(e.target.value)} 
                          />
                        </>
                      ) : (
                        <>
                          <div className="dash-email-subject">{email.subject}</div>
                          <div className="dash-email-body">{email.body}</div>
                        </>
                      )}
                    </div>
                    <div className="dash-email-followup">
                      Follow-up: {new Date(email.followUpDate).toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" })}
                    </div>
                    <div className="dash-actions-row">
                      {editingEmailId === email.leadId ? (
                        <>
                          <button className="dash-action-btn" onClick={() => saveEmailEdit(email.leadId)}>Save</button>
                          <button className="dash-action-btn ghost" onClick={() => setEditingEmailId(null)}>Cancel</button>
                        </>
                      ) : (
                        <>
                          <button className="dash-action-btn ghost" onClick={() => { setEditingEmailId(email.leadId); setEditSubject(email.subject); setEditBody(email.body); }}>Edit</button>
                          <button className="dash-action-btn regen" onClick={() => regenerateEmail(email.leadId)}>Regenerate</button>
                          <button className="dash-action-btn" onClick={() => markEmail(email.leadId, "approved")}>Approve</button>
                          <button className="dash-action-btn ghost" onClick={() => markEmail(email.leadId, "skipped")}>Skip</button>
                          {emailStatus[email.leadId] && (
                            <span className={`dash-action-status ${emailStatus[email.leadId]}`}>
                              {emailStatus[email.leadId]}
                            </span>
                          )}
                        </>
                      )}
                    </div>
                  </div>
                ))}
              </>
            )}

            {/* REPORT */}
            {activeTab === "report" && report && report.leads.map((result, i) => (
              <div key={result.leadId} className="dash-card" style={{ animationDelay: `${i * 60}ms` }}>
                <div className="dash-report-row">
                  <div>
                    <div className="dash-report-name">{result.companyName}</div>
                    <div className="dash-report-email">{result.email}</div>
                    <div className="dash-report-time">
                      {result.sentAt
                        ? new Date(result.sentAt).toLocaleString("en-US", { dateStyle: "medium", timeStyle: "short" })
                        : "Not sent yet"}
                    </div>
                  </div>
                  <span className={`dash-badge ${result.status}`}>
                    {result.status === "sent" ? "Sent" : "Unsent"}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}

        {history.length > 0 && (
          <div className="dash-history">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <div className="dash-history-title">Campaign History & Analytics</div>
              <button className="dash-action-btn" onClick={() => exportCSV()} style={{ background: '#2a2a2a', border: '1px solid #444', color: '#fff' }}>
                Export All CSV
              </button>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '2rem' }}>
              <div className="dash-card" style={{ height: '300px', padding: '1rem' }}>
                <h4 style={{ color: '#888', marginBottom: '1rem', fontSize: '0.8rem', textTransform: 'uppercase' }}>Leads vs Sent (per campaign)</h4>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={[...history].reverse()} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#333" vertical={false} />
                    <XAxis dataKey="createdAt" tickFormatter={(val) => new Date(val).toLocaleDateString()} stroke="#666" fontSize={12} />
                    <YAxis stroke="#666" fontSize={12} allowDecimals={false} />
                    <Tooltip contentStyle={{ backgroundColor: '#111', borderColor: '#333', color: '#fff' }} />
                    <Legend iconType="circle" wrapperStyle={{ fontSize: '12px' }} />
                    <Bar dataKey="totalLeads" name="Total Leads" fill="#444" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="emailsSent" name="Emails Sent" fill="#7fffd4" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
              
              <div className="dash-card" style={{ height: '300px', padding: '1rem' }}>
                <h4 style={{ color: '#888', marginBottom: '1rem', fontSize: '0.8rem', textTransform: 'uppercase' }}>Engagement Trend</h4>
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={[...history].reverse()} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#333" vertical={false} />
                    <XAxis dataKey="createdAt" tickFormatter={(val) => new Date(val).toLocaleDateString()} stroke="#666" fontSize={12} />
                    <YAxis stroke="#666" fontSize={12} allowDecimals={false} />
                    <Tooltip contentStyle={{ backgroundColor: '#111', borderColor: '#333', color: '#fff' }} />
                    <Legend iconType="circle" wrapperStyle={{ fontSize: '12px' }} />
                    <Line type="monotone" dataKey="totalLeads" name="Total Leads" stroke="#888" strokeWidth={2} dot={false} />
                    <Line type="monotone" dataKey="emailsSent" name="Emails Sent" stroke="#7fffd4" strokeWidth={2} dot={{ fill: '#7fffd4', strokeWidth: 2, r: 4 }} activeDot={{ r: 6 }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>

            {history.map((item) => (
              <div key={item.id} className="dash-history-row">
                <div>
                  <div className="dash-history-query">{item.query}</div>
                  <div className="dash-history-meta">
                    {new Date(item.createdAt).toLocaleString("en-US", { dateStyle: "medium", timeStyle: "short" })}
                    {" · "}
                    {item.totalLeads} leads
                    {" · "}
                    {item.emailsSent} sent
                  </div>
                </div>
                <div className="dash-history-actions">
                  <button className="dash-action-btn ghost" onClick={() => exportCSV(item.id)} style={{ marginRight: '8px' }}>
                    CSV
                  </button>
                  <button className="dash-action-btn ghost" onClick={() => deleteCampaign(item.id)} style={{ marginRight: '8px', color: '#ff4444' }}>
                    🗑️
                  </button>
                  <span className={`dash-badge ${item.status === "completed" ? "sent" : "unsent"}`}>
                    {item.status}
                  </span>
                  <button
                    className="dash-action-btn regen"
                    onClick={() => {
                      setQuery(item.query);
                      setCount(item.requestedLeadCount || 5);
                      runCampaign(item.query, item.requestedLeadCount || 5);
                    }}
                    disabled={loading}
                  >
                    Run Again
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* EMPTY STATE (Radar) */}
        {!loading && !hasResults && !error && (
          <motion.div 
            className="dash-empty"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5, duration: 1 }}
          >
            <div className="dash-radar-wrap">
              <div className="dash-radar-circle"></div>
              <div className="dash-radar-circle delay-1"></div>
              <div className="dash-radar-circle delay-2"></div>
              <div className="dash-radar-sweep"></div>
            </div>
            <div className="dash-empty-title">Awaiting Command</div>
            <p className="dash-empty-sub">
              5 agents are ready to find leads, research companies, and write personalized emails.
            </p>
            <p className="dash-empty-hint">
              Try: "B2B SaaS companies in Germany" or "E-commerce startups in the UK"
            </p>
          </motion.div>
        )}

      </main>

      {toastMessage && (
        <div style={{
          position: 'fixed', bottom: '20px', right: '20px', 
          background: '#4CAF50', color: '#fff', padding: '12px 24px', 
          borderRadius: '4px', zIndex: 1000,
          boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
        }}>
          {toastMessage}
        </div>
      )}
    </div>
  );
}