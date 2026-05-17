"use client";
import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";

const LINES = [
  { text: "$ archon start --query \"B2B SaaS startups in Berlin\"", delay: 500,  color: "#ffffff" },
  { text: "◆ ARCHON. initialized — 5 agents ready",               delay: 1200, color: "#ffffff" },
  { text: "── AGENT 01 · Lead Finder",                            delay: 2000, color: "#555555" },
  { text: "› Searching for companies...",                          delay: 2600, color: "#ffffff" },
  { text: "› ✓ Found: Personio, Contentful, Trade Republic  [5 leads]", delay: 4000, color: "#4ade80" },
  { text: "── AGENT 02 · Researcher",                             delay: 4800, color: "#555555" },
  { text: "› Scraping websites + recent news...",                  delay: 5400, color: "#ffffff" },
  { text: "› ✓ Pain points and product fit mapped",               delay: 7000, color: "#4ade80" },
  { text: "── AGENT 03 · Email Writer",                           delay: 7800, color: "#555555" },
  { text: "› Drafting hyper-personalized emails...",               delay: 8400, color: "#ffffff" },
  { text: "› ✓ 5 emails ready — personalization score: 94%",      delay: 10000, color: "#4ade80" },
  { text: "── AGENT 04 · Outreach",                               delay: 10800, color: "#555555" },
  { text: "› ⏸ Human-in-the-loop — awaiting approval",           delay: 11600, color: "#fbbf24" },
  { text: "› ✓ 3 approved → sent via Resend API",                 delay: 13200, color: "#4ade80" },
  { text: "── AGENT 05 · Reporter",                               delay: 14000, color: "#555555" },
  { text: "› ✓ Report generated",                                  delay: 14600, color: "#4ade80" },
  { text: "★ Performance Rating: Good — Est. reply rate 13%",     delay: 15600, color: "#c084fc" },
];

const TOTAL_DURATION = 16200; // slightly after last line
const LOOP_INTERVAL  = 18000;

const STATS = [
  { label: "Leads Found",     target: 43,  suffix: "" },
  { label: "Emails Sent",     target: 5,   suffix: "" },
  { label: "Est. Reply Rate", target: 13,  suffix: "%" },
];

// --- CountUp number hook ---
function useCountUp(target, active, duration = 1200) {
  const [value, setValue] = useState(0);
  const raf = useRef(null);

  useEffect(() => {
    if (!active) { setValue(0); return; }
    const start = performance.now();
    const tick = (now) => {
      const t = Math.min((now - start) / duration, 1);
      setValue(Math.round(t * target));
      if (t < 1) raf.current = requestAnimationFrame(tick);
    };
    raf.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf.current);
  }, [active, target, duration]);

  return value;
}

// --- Single stat card ---
function StatCard({ label, target, suffix, active }) {
  const value = useCountUp(target, active);
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 12 }}
      transition={{ duration: 0.5 }}
      style={{
        flex: 1,
        background: "#111",
        border: "1px solid #222",
        borderRadius: "10px",
        padding: "14px 18px",
        textAlign: "center",
        fontFamily: "'Courier New', Courier, monospace",
      }}
    >
      <div style={{ fontSize: "26px", fontWeight: "700", color: "#4ade80", letterSpacing: "-1px" }}>
        {value}{suffix}
      </div>
      <div style={{ fontSize: "11px", color: "#555", marginTop: "4px", textTransform: "uppercase", letterSpacing: "0.08em" }}>
        {label}
      </div>
    </motion.div>
  );
}

export default function AnimatedTerminal() {
  const [cycle,        setCycle]        = useState(0);   // bumps every loop
  const [visible,      setVisible]      = useState(true);
  const [visibleLines, setVisibleLines] = useState([]);
  const [progress,     setProgress]     = useState(0);
  const [showStats,    setShowStats]    = useState(false);

  useEffect(() => {
    let timeouts = [];
    let rafId    = null;
    let loopTimer;

    const runCycle = () => {
      setVisible(true);
      setVisibleLines([]);
      setProgress(0);
      setShowStats(false);

      // Schedule each line
      LINES.forEach((line, idx) => {
        const t = setTimeout(() => {
          setVisibleLines((prev) => [...prev, line]);
          setProgress(((idx + 1) / LINES.length) * 100);
        }, line.delay);
        timeouts.push(t);
      });

      // Show stats after last line
      const statsTimer = setTimeout(() => setShowStats(true), TOTAL_DURATION);
      timeouts.push(statsTimer);

      // Fade out before next loop
      const fadeTimer = setTimeout(() => setVisible(false), LOOP_INTERVAL - 600);
      timeouts.push(fadeTimer);
    };

    runCycle();
    loopTimer = setInterval(() => {
      timeouts.forEach(clearTimeout);
      timeouts = [];
      setCycle((c) => c + 1);
      setTimeout(runCycle, 0);
    }, LOOP_INTERVAL);

    return () => {
      timeouts.forEach(clearTimeout);
      clearInterval(loopTimer);
      if (rafId) cancelAnimationFrame(rafId);
    };
  }, []);

  return (
    <div style={{ width: "100%", maxWidth: "700px", margin: "0 auto" }}>
      <AnimatePresence mode="wait">
        {visible && (
          <motion.div
            key={`terminal-${cycle}`}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.6 }}
          >
            {/* ── Terminal window ── */}
            <div style={{
              background: "#0d0d0d",
              borderRadius: "12px",
              border: "1px solid #222",
              fontFamily: "'Courier New', Courier, monospace",
              height: "460px",
              width: "100%",
              display: "flex",
              flexDirection: "column",
              boxShadow: "0 20px 40px rgba(0,0,0,0.8)",
              overflow: "hidden",
            }}>

              {/* Progress bar */}
              <div style={{ width: "100%", height: "3px", background: "#1a1a1a", flexShrink: 0 }}>
                <motion.div
                  animate={{ width: `${progress}%` }}
                  transition={{ ease: "easeOut", duration: 0.4 }}
                  style={{ height: "100%", background: "#4ade80", borderRadius: "0 2px 2px 0" }}
                />
              </div>

              {/* Title bar */}
              <div style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                padding: "14px 20px 0",
                flexShrink: 0,
              }}>
                <div style={{ display: "flex", gap: "8px" }}>
                  <div style={{ width: 12, height: 12, borderRadius: "50%", background: "#ff5f56" }} />
                  <div style={{ width: 12, height: 12, borderRadius: "50%", background: "#ffbd2e" }} />
                  <div style={{ width: 12, height: 12, borderRadius: "50%", background: "#27c93f" }} />
                </div>
                <motion.div
                  animate={{ opacity: [1, 0.3, 1] }}
                  transition={{ repeat: Infinity, duration: 2, ease: "easeInOut" }}
                  style={{ fontSize: "11px", color: "#4ade80", letterSpacing: "0.05em", fontFamily: "sans-serif" }}
                >
                  ● LIVE
                </motion.div>
              </div>

              {/* Terminal content */}
              <div style={{ flex: 1, padding: "18px 20px", textAlign: "left", overflowY: "hidden" }}>
                {visibleLines.map((line, i) => (
                  <motion.div
                    key={`${cycle}-${i}`}
                    initial={{ opacity: 0, x: -6 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.25 }}
                    style={{
                      marginBottom: "8px",
                      fontSize: "13.5px",
                      lineHeight: "1.5",
                      color: line.color,
                      whiteSpace: "pre-wrap",
                    }}
                  >
                    {line.text}
                  </motion.div>
                ))}
                {/* Blinking cursor */}
                <motion.span
                  animate={{ opacity: [1, 0] }}
                  transition={{ repeat: Infinity, duration: 0.8 }}
                  style={{ display: "inline-block", width: "8px", height: "15px", background: "#4ade80", verticalAlign: "middle" }}
                />
              </div>
            </div>

            {/* ── Stat cards ── */}
            <AnimatePresence>
              {showStats && (
                <motion.div
                  key={`stats-${cycle}`}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.4 }}
                  style={{ display: "flex", gap: "12px", marginTop: "16px" }}
                >
                  {STATS.map((s, i) => (
                    <StatCard key={i} {...s} active={showStats} />
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
