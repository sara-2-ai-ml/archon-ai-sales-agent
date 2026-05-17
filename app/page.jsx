"use client";
import dynamic from "next/dynamic";
import Link from "next/link";
import { motion } from "framer-motion";
import SmoothScroll from "./components/SmoothScroll";
import CustomCursor from "./components/CustomCursor";
import HeroScatterTitle from "./components/HeroScatterTitle";

const BlobScene = dynamic(() => import("./components/BlobScene"), { ssr: false });
import AnimatedTerminal from "./components/AnimatedTerminal";

const FEATURES = [
  {
    num: "01",
    title: "Lead Discovery",
    desc: "Agent 1 uses Tavily and Apollo to find real companies matching your exact target profile.",
  },
  {
    num: "02",
    title: "Deep Research",
    desc: "Agent 2 scrapes each company's website and extracts pain points, tech stack, and opportunities.",
  },
  {
    num: "03",
    title: "Email Writing",
    desc: "Agent 3 writes hyper-personalized cold emails using Claude — no templates, no noise.",
  },
  {
    num: "04",
    title: "Auto Outreach",
    desc: "Agent 4 sends emails via Resend and schedules follow-ups — fully autonomous.",
  },
  {
    num: "05",
    title: "Performance Reporter",
    desc: "Agent 5 generates a full campaign report with AI insights — open rates, reply rates, and actionable recommendations.",
  },
];

// Animation variants for staggered fade-up
const containerVars = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.15, delayChildren: 0.2 },
  },
};
const itemVars = {
  hidden: { opacity: 0, y: 30 },
  show: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 100, damping: 20 } },
};

export default function Home() {
  return (
    <div className="archon-landing">
      {/* NAV */}
      <motion.nav 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="archon-nav"
      >
        <div className="archon-nav-logo">ARCHON.</div>
        <div className="archon-nav-links">
          <a href="#features">Platform</a>
          <a href="#features">Agents</a>
          <Link href="/login" className="archon-nav-login">Log in</Link>
          <Link href="/signup" className="archon-nav-cta">Sign up</Link>
        </div>
      </motion.nav>

      {/* HERO */}
      <section className="archon-hero">

        {/* LEFT COLUMN: Text Content with Staggered Animation */}
        <motion.div 
          className="archon-hero-left"
          variants={containerVars}
          initial="hidden"
          animate="show"
        >
          <motion.div variants={itemVars} className="archon-hero-tag">
            AI Outreach Platform
          </motion.div>
          
          <motion.div variants={itemVars}>
            <HeroScatterTitle text="ARCHON." />
          </motion.div>
          
          <motion.p variants={itemVars} className="archon-hero-sub">
            Five autonomous agents that find leads,<br/>
            research companies, and close deals.
          </motion.p>
          
          <motion.div variants={itemVars} style={{ display:"flex", alignItems:"center", gap:16, marginTop:32 }}>
            <Link href="/dashboard" className="archon-hero-cta">
              Start a Campaign
              <span className="archon-hero-cta-arrow">→</span>
            </Link>
            <div className="archon-hero-stats">
              <div>
                <span className="archon-stat-num">5</span>
                <span className="archon-stat-label">Agents</span>
              </div>
              <div>
                <span className="archon-stat-num">100%</span>
                <span className="archon-stat-label">Auto</span>
              </div>
            </div>
          </motion.div>
        </motion.div>

        {/* RIGHT COLUMN: 3D Blob */}
        <motion.div 
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 1.5, ease: "easeOut" }}
          className="archon-blob-wrap"
        >
          <div className="archon-blob-canvas">
            <BlobScene />
          </div>
        </motion.div>

        {/* Bottom-left — user avatars + stat */}
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1, duration: 1 }}
          className="archon-hero-bottom"
        >
          <div className="archon-avatars">
            <div className="archon-avatar" style={{ background:"linear-gradient(135deg, #111111, #333333)" }}>G</div>
            <div className="archon-avatar" style={{ background:"linear-gradient(135deg, #5BCC00, #1D5A00)", color: "#000" }}>P</div>
            <div className="archon-avatar" style={{ background:"linear-gradient(135deg, #7088B8, #202838)" }}>T</div>
          </div>
          <div className="archon-hero-count-text">
            <strong>2,400+ leads found</strong>
            <span>across 180 campaigns</span>
          </div>
        </motion.div>

        {/* Right side tags */}
        <motion.div 
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 1.2, duration: 0.8 }}
          className="archon-side-tags"
        >
          <div className="archon-side-tag">Web-based <span>/ 01</span></div>
          <div className="archon-side-tag">Autonomous <span>/ 02</span></div>
          <div className="archon-side-tag">Real-time <span>/ 03</span></div>
        </motion.div>

        {/* Bottom right pill */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.4, duration: 0.8 }}
        >
          <Link href="#features" className="archon-how-btn">
            How it works
          </Link>
        </motion.div>

      </section>

      {/* FEATURES */}
      <section className="archon-features" id="features">
        <div className="archon-features-header">
          <h2>
            All the intelligence of a<br />
            <span className="archon-accent-text">full sales team.</span>
          </h2>
        </div>
        <div className="archon-features-grid">
          {FEATURES.slice(0, 3).map((f) => (
            <div key={f.num} className="archon-feat-card">
              <div className="archon-feat-icon">{f.num}</div>
              <div className="archon-feat-title">{f.title}</div>
              <div className="archon-feat-desc">{f.desc}</div>
            </div>
          ))}
        </div>
        <div className="archon-features-row-2">
          {FEATURES.slice(3).map((f) => (
            <div key={f.num} className="archon-feat-card">
              <div className="archon-feat-icon">{f.num}</div>
              <div className="archon-feat-title">{f.title}</div>
              <div className="archon-feat-desc">{f.desc}</div>
            </div>
          ))}
        </div>
        <div className="archon-demo-block">
          <div className="archon-demo-head">
            <p>Product Demo</p>
            <h3>See Archon in Action</h3>
          </div>
          <div className="archon-demo-screen" style={{ background: "transparent", border: "none", display: "flex", justifyContent: "center" }}>
            <AnimatedTerminal />
          </div>
        </div>
      </section>

      <footer className="archon-footer">
        <div className="archon-footer-left">Copyright Archon 2026</div>
        <div className="archon-footer-right">
          <a href="https://linkedin.com" target="_blank" rel="noreferrer" className="archon-footer-link">
            <span aria-hidden="true">in</span>
            LinkedIn
          </a>
          <a href="mailto:contact@archon.ai" className="archon-footer-link">
            <span aria-hidden="true">@</span>
            contact@archon.ai
          </a>
          <a href="tel:+355000000000" className="archon-footer-link">
            <span aria-hidden="true">☎</span>
            +355 00 000 0000
          </a>
        </div>
      </footer>

    </div>
  );
}