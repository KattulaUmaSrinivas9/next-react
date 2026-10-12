"use client";

import { useState } from "react";
import { ArrowDown, ArrowLeft, ArrowRight, ArrowUpRight, Check, ChevronDown, Code2, Layers3, Mail, Menu, Sparkles, X } from "lucide-react";

const projects = [
  {
    number: "01", category: "Analytics · Retail", title: "Traffic Sense",
    subtitle: "Making customer behavior easier to understand.",
    description: "A custom analytics dashboard built to give teams more ownership of their data and reduce reliance on third-party analytics. The experience centers on clear KPIs, drill-down analysis, and useful export workflows.",
    work: ["Led dashboard UI development", "Built interactive data visualizations with AG Grid and AM Charts", "Partnered with product and analytics teams on KPI design", "Added filtering, drill-down, and export capabilities"],
    stack: ["React", "Next.js", "AG Grid", "AM Charts", "Accessibility"], accent: "coral",
  },
  {
    number: "02", category: "Commerce · Accessibility", title: "Responsive Savings",
    subtitle: "A savings experience shaped for every screen.",
    description: "A responsive savings page developed from Figma wireframes, with accessible interactions and performance in mind. Feature flags supported a measured rollout while CLS and GraphQL improvements helped refine the experience.",
    work: ["Translated Figma wireframes into responsive UI", "Aligned implementation to ADA and WCAG practices", "Worked on CLS and GraphQL enhancements", "Supported feature-flagged releases"],
    stack: ["Next.js", "React", "GraphQL", "CSS", "WCAG"], accent: "mint",
  },
  {
    number: "03", category: "SaaS · Conversational AI", title: "Techforce Chatbot",
    subtitle: "A configurable chatbot platform built from connected services.",
    description: "A multi-service chatbot product with a React interface, NLP training, chat history, feedback, and content management. The SaaS release brought together nine containerized services behind configurable environment settings.",
    work: ["Built dialog modeler and catalogue UI features", "Integrated training, chat history, and feedback services", "Added configurable environment-based behavior", "Prepared a nine-service Dockerized SaaS release"],
    stack: ["React", "Node.js", "RabbitMQ", "Elasticsearch", "Docker"], accent: "lilac",
  },
  {
    number: "04", category: "Energy · Customer Experience", title: "DE Texas Acquisition",
    subtitle: "One place for plans, usage, and payments.",
    description: "A mobile-responsive energy web application for managing customer profiles, electricity plans, terms, utilization, and payments, designed around clear user workflows.",
    work: ["Led wireframe design and UI implementation", "Built responsive customer self-service flows", "Worked across profile, plan, usage, and payment experiences", "Collaborated with cross-functional delivery teams"],
    stack: ["React", "Responsive UI", "REST APIs", "Accessibility"], accent: "blue",
  },
  {
    number: "05", category: "Education · Mobile", title: "Digital Books",
    subtitle: "Learning content that works across platforms.",
    description: "A digital books experience for web and mobile, with reusable Angular components and offline access. Automated content ingestion helped move book data and assets into MongoDB and AWS S3.",
    work: ["Developed web and mobile experiences with Angular and Ionic", "Added offline book access for remote use", "Automated content ingestion, reducing manual work by 90%", "Connected REST services and AWS S3 assets"],
    stack: ["Angular", "Ionic", "TypeScript", "MongoDB", "AWS S3"], accent: "gold",
  },
];

const experience = [
  { years: "2025 — Now", company: "Walmart Inc.", role: "UI Full Stack Engineer", focus: "Retail analytics, subscriptions & accessible commerce", highlights: ["Led development of a custom analytics dashboard to increase data ownership and reduce third-party dependency.", "Built responsive Next.js experiences and reusable accessible components for subscriptions and savings.", "Created data visualization workflows with drill-down, filtering, and export.", "Improved performance with memoization, lazy loading, API caching, and efficient state management."] },
  { years: "2023 — 2025", company: "Zelante Technologies", role: "Senior UI Developer", focus: "Energy customer experiences · NRG Energy", highlights: ["Led wireframe design and implementation of a mobile-responsive customer web application.", "Built workflows for profiles, electricity plans, utilization, and payments.", "Focused on responsive, accessible experiences and cross-functional delivery."] },
  { years: "2021 — 2023", company: "Ivy Comptech / Entain", role: "Full Stack Developer", focus: "Web applications & platform services", highlights: ["Delivered full-stack application features across React interfaces and backend services.", "Worked across API integration, reusable UI patterns, and iterative product delivery."] },
  { years: "2019 — 2021", company: "Digitamize / Techforce.ai", role: "Full Stack Developer", focus: "Conversational AI · SaaS · Microservices", highlights: ["Built conversational product features with React, Node.js, NLP services, and content management.", "Dockerized a nine-service chatbot platform and supported SaaS releases.", "Implemented queue-based NLP training workflows with RabbitMQ."] },
  { years: "2017 — 2019", company: "Fortunapix Pvt Ltd", role: "MERN Stack Developer", focus: "Education technology · Digital books", highlights: ["Built responsive web and mobile learning experiences with Angular and Ionic.", "Automated content ingestion into MongoDB and AWS S3, reducing manual processing time by 90%.", "Contributed to REST services and offline access for digital books."] },
];

const skillGroups = {
  Frontend: ["React", "Next.js", "Angular", "JavaScript", "TypeScript", "HTML / CSS", "Storybook", "Accessibility"],
  Backend: ["Node.js", "Express", "Java", "Spring Boot", "Python", "REST APIs", "GraphQL"],
  Cloud: ["AWS", "Docker", "Kubernetes", "Jenkins", "GitHub Actions", "CI / CD"],
  Data: ["PostgreSQL", "MongoDB", "DynamoDB", "Elasticsearch", "RabbitMQ", "AG Grid", "AM Charts"],
  Quality: ["Jest", "React Testing Library", "Playwright", "TestCafe", "WCAG", "NVDA / VoiceOver"],
};

type SkillGroup = keyof typeof skillGroups;
const groupNames = Object.keys(skillGroups) as SkillGroup[];

export default function Portfolio() {
  const [activeProject, setActiveProject] = useState(0);
  const [openExperience, setOpenExperience] = useState<number | null>(0);
  const [skillGroup, setSkillGroup] = useState<SkillGroup>("Frontend");
  const [menuOpen, setMenuOpen] = useState(false);
  const project = projects[activeProject];

  const moveProject = (direction: number) => setActiveProject((current) => (current + direction + projects.length) % projects.length);

  return (
    <main>
      <header className="site-header">
        <a className="wordmark" href="#top" aria-label="K. Uma Srinivas, home"><span className="wordmark-mark">K<span>.</span></span><span>UMA SRINIVAS</span></a>
        <button className="mobile-menu" aria-label={menuOpen ? "Close menu" : "Open menu"} onClick={() => setMenuOpen(!menuOpen)}>{menuOpen ? <X size={20} /> : <Menu size={20} />}</button>
        <nav className={menuOpen ? "nav-links nav-open" : "nav-links"} aria-label="Main navigation">
          <a href="#work" onClick={() => setMenuOpen(false)}>Selected work</a><a href="#about" onClick={() => setMenuOpen(false)}>About</a><a href="#experience" onClick={() => setMenuOpen(false)}>Experience</a><a href="#skills" onClick={() => setMenuOpen(false)}>Toolkit</a>
          <a className="nav-contact" href="mailto:umasrinivas9k@gmail.com">Let&apos;s talk <ArrowUpRight size={15} /></a>
        </nav>
      </header>

      <section className="hero section-wrap" id="top">
        <div className="hero-copy">
          <div className="eyebrow"><span className="status-dot" /> UI ENGINEERING · FULL STACK</div>
          <h1>Thoughtful interfaces.<br /><span>Systems that scale.</span></h1>
          <p className="hero-intro">I&apos;m Uma, a UI full stack engineer turning complex products into clear, reliable experiences.</p>
          <div className="hero-actions"><a className="button button-primary" href="#work">Explore my work <ArrowDown size={16} /></a><a className="text-link" href="mailto:umasrinivas9k@gmail.com"><Mail size={16} /> Get in touch</a></div>
          <div className="hero-meta"><span><Code2 size={14} /> UI · Full Stack</span><span>10 years building for the web</span></div>
        </div>
        <div className="hero-art" aria-label="Decorative abstract pattern" role="img">
          <div className="art-grid" /><div className="orbit orbit-one" /><div className="orbit orbit-two" /><div className="art-sun" /><div className="art-card"><span className="art-card-label">CURRENTLY BUILDING</span><strong>Useful things<br />for real people.</strong><span className="art-card-foot"><span className="status-dot" /> React · Product UI</span></div>
          <span className="art-index">01 / 05</span><span className="art-caption">DESIGN WITH INTENT<br />ENGINEER FOR SCALE</span>
        </div>
        <div className="hero-bottom"><span>FRONTEND × FULL STACK × PRODUCT THINKING</span><a href="#about" aria-label="Scroll to about"><ArrowDown size={16} /></a><span>SCROLL TO EXPLORE</span></div>
      </section>

      <section className="section-wrap work-section" id="work">
        <div className="section-heading"><div><div className="eyebrow">A FEW THINGS I&apos;VE HELPED SHIP</div><h2>Selected work<span className="heading-period">.</span></h2></div><p>Product stories from retail, energy, SaaS, and education—told through the decisions and details behind the UI.</p></div>
        <div className={`project-feature accent-${project.accent}`}>
          <div className="project-visual">
            <div className="visual-top"><span>PORTFOLIO STUDY / {project.number}</span><span className="visual-live"><i /> ILLUSTRATIVE UI</span></div>
            <div className="visual-orbit" /><div className="visual-dashboard"><div className="dash-top"><span className="dash-brand"><i /> {activeProject === 2 ? "dialog studio" : "insight / overview"}</span><span className="dash-avatar">US</span></div><div className="dash-title"><span>Good morning, team</span><span>Last 30 days ⌄</span></div><div className="dash-metrics"><div><small>ENGAGEMENT</small><b>84.6%</b><em>↗ 12.8%</em></div><div><small>ACTIVE USERS</small><b>24,891</b><em>↗ 8.2%</em></div><div><small>CONVERSION</small><b>6.42%</b><em>↗ 2.1%</em></div></div><div className="dash-chart"><div className="chart-label"><span>Weekly activity</span><span>↗ 16.4%</span></div><div className="chart-lines"><div className="chart-bars">{[35, 52, 44, 68, 48, 82, 59, 75, 55, 92, 70, 84, 61, 96, 74, 88, 63, 79, 52, 91, 68, 97, 73, 85].map((height, index) => <i key={index} style={{ height: `${height}%` }} />)}</div><div className="chart-rule rule-one" /><div className="chart-rule rule-two" /><div className="chart-rule rule-three" /></div></div></div>
            <div className="visual-sticker"><Sparkles size={16} /> BUILT FOR<br />REAL WORK</div>
            <div className="visual-caption"><span>UI, DATA, DECISIONS.</span><span>0{activeProject + 1} — 0{projects.length}</span></div>
          </div>
          <div className="project-info"><div className="project-topline"><span className="eyebrow">{project.category}</span><span className="project-count">{project.number} <i>/</i> 0{projects.length}</span></div><h3>{project.title}</h3><p className="project-subtitle">{project.subtitle}</p><p className="project-description">{project.description}</p><div className="project-contribution"><span className="contribution-label">WHAT I CONTRIBUTED</span><ul>{project.work.map((item) => <li key={item}><Check size={14} />{item}</li>)}</ul></div><div className="tag-list">{project.stack.map((tag) => <span key={tag}>{tag}</span>)}</div><div className="project-controls"><div className="project-pips" aria-label={`Project ${activeProject + 1} of ${projects.length}`}>{projects.map((item, index) => <button key={item.number} onClick={() => setActiveProject(index)} className={activeProject === index ? "pip pip-active" : "pip"} aria-label={`Show ${item.title}`} aria-current={activeProject === index ? "true" : undefined} />)}</div><div className="arrow-controls"><button onClick={() => moveProject(-1)} aria-label="Previous project"><ArrowLeft size={17} /></button><button onClick={() => moveProject(1)} aria-label="Next project"><ArrowRight size={17} /></button></div></div></div>
        </div>
        <div className="project-strip"><span>MORE STORIES IN</span>{projects.map((item, index) => <button key={item.number} onClick={() => setActiveProject(index)} className={activeProject === index ? "strip-item strip-active" : "strip-item"}>{item.title}<ArrowUpRight size={13} /></button>)}</div>
      </section>

      <section className="about-section" id="about"><div className="section-wrap about-grid"><div className="about-aside"><div className="eyebrow">A LITTLE ABOUT HOW I WORK</div><div className="about-stamp"><Code2 size={32} /><span>HUMAN FIRST<br />SYSTEMS MINDED</span></div><div className="about-aside-note">From the first sketch to the production dashboard, I enjoy the whole path from problem to shipped product.</div></div><div className="about-copy"><h2>Curious by default.<br /><span>Practical by design.</span></h2><p className="about-lead">For 10 years, I&apos;ve worked across the full product journey—from shaping an idea and building its interface to connecting services and making releases dependable.</p><p>I like the hard middle: untangling a complex workflow, finding the simplest useful shape, and making sure the result works for more people and more devices. I bring a systems mindset to UI work, and a care for detail to the systems behind it.</p><div className="about-facts"><div><strong>10<span>+</span></strong><small>YEARS IN SOFTWARE</small></div><div><strong>5</strong><small>INDUSTRIES</small></div><div><strong>90<span>%+</span></strong><small>TEST COVERAGE ACHIEVED</small></div></div><div className="credentials"><span>AWS CERTIFIED DEVELOPER — ASSOCIATE</span><span>APOLLO CERTIFIED DEVELOPER</span><span>B.E. · ANDHRA UNIVERSITY</span></div></div></div></section>

      <section className="section-wrap experience-section" id="experience"><div className="section-heading"><div><div className="eyebrow">WHERE I&apos;VE BEEN</div><h2>Experience<span className="heading-period">.</span></h2></div><p>Growing from cross-platform product work into full-stack experiences and large-scale retail products.</p></div><div className="timeline">{experience.map((item, index) => <article className={openExperience === index ? "experience-item experience-open" : "experience-item"} key={item.company}><span className="timeline-marker">0{index + 1}</span><button className="experience-toggle" onClick={() => setOpenExperience(openExperience === index ? null : index)} aria-expanded={openExperience === index}><span className="experience-years">{item.years}</span><span className="experience-main"><strong>{item.company}</strong><span>{item.role}</span></span><span className="experience-focus">{item.focus}</span><span className="experience-chevron"><ChevronDown size={18} /></span></button>{openExperience === index && <div className="experience-details"><ul>{item.highlights.map((highlight) => <li key={highlight}>{highlight}</li>)}</ul></div>}</article>)}</div></section>

      <section className="skills-section" id="skills"><div className="section-wrap skills-layout"><div className="skills-intro"><div className="eyebrow">THE TOOLS ARE ONLY PART OF IT</div><h2>A flexible<br /><span>toolkit.</span></h2><p>Pick a lane to explore the technologies and practices I reach for most.</p><div className="skill-categories" role="tablist" aria-label="Skill categories">{groupNames.map((group) => <button key={group} role="tab" aria-selected={skillGroup === group} className={skillGroup === group ? "skill-tab skill-tab-active" : "skill-tab"} onClick={() => setSkillGroup(group)}>{group}<ArrowUpRight size={13} /></button>)}</div></div><div className="skills-panel"><div className="skills-panel-top"><span><Layers3 size={16} /> {skillGroup}</span><span>0{groupNames.indexOf(skillGroup) + 1} / 0{groupNames.length}</span></div><div className="skills-cloud" role="tabpanel">{skillGroups[skillGroup].map((skill, index) => <span key={skill} className={index === 0 ? "skill-pill skill-pill-featured" : "skill-pill"}>{skill}{index === 0 && <Sparkles size={13} />}</span>)}</div><div className="skills-note"><span className="status-dot" /> ALWAYS LEARNING, ALWAYS SHIPPING</div></div></div></section>

      <section className="writing-section section-wrap"><div className="section-heading"><div><div className="eyebrow">NOTES FROM THE BUILD</div><h2>Writing &amp; community<span className="heading-period">.</span></h2></div><p>Practical notes on shipping, deployment, and the infrastructure that supports great product experiences.</p></div><div className="writing-list"><a href="https://umasrinivask.medium.com/React-application-deployments-with-runtime-configuration-dd42820e3f50" target="_blank" rel="noreferrer"><span className="writing-number">01</span><span className="writing-title">React deployments with runtime configuration</span><span className="writing-type">DEPLOYMENT</span><ArrowUpRight size={17} /></a><a href="https://umasrinivask.medium.com/build-a-multi-stage-docker-image-for-React-app-to-load-runtime-environment-settings-911517f5f58d" target="_blank" rel="noreferrer"><span className="writing-number">02</span><span className="writing-title">Multi-stage Docker images for React apps</span><span className="writing-type">DOCKER</span><ArrowUpRight size={17} /></a><a href="https://umasrinivask.medium.com/dockerize-elasticsearch-kibana-with-x-packs-security-237589acb3fd" target="_blank" rel="noreferrer"><span className="writing-number">03</span><span className="writing-title">Dockerize Elasticsearch &amp; Kibana securely</span><span className="writing-type">ELASTICSEARCH</span><ArrowUpRight size={17} /></a><a href="https://umasrinivask.medium.com/configure-nginx-as-a-reverse-proxy-with-docker-compose-file-4ebba2b75c89" target="_blank" rel="noreferrer"><span className="writing-number">04</span><span className="writing-title">Nginx as a reverse proxy with Docker Compose</span><span className="writing-type">INFRASTRUCTURE</span><ArrowUpRight size={17} /></a></div></section>

      <footer className="footer"><div className="section-wrap"><div className="footer-cta"><div><div className="eyebrow">HAVE A GOOD PROBLEM TO SOLVE?</div><h2>Let&apos;s make it<br /><span>make sense.</span></h2></div><div className="footer-contact-links"><a className="footer-email" href="mailto:umasrinivas9k@gmail.com">umasrinivas9k@gmail.com <ArrowUpRight size={20} /></a><a className="footer-phone" href="tel:+14795608479">+1 (479) 560-8479</a></div></div><div className="footer-bottom"><a className="wordmark" href="#top" aria-label="K. Uma Srinivas, home"><span className="wordmark-mark">K<span>.</span></span><span>UMA SRINIVAS</span></a><span>UI FULL STACK ENGINEER · 2026</span><div><a href="https://github.com/kattulaumasrinivas" target="_blank" rel="noreferrer">GITHUB <ArrowUpRight size={12} /></a><a href="https://www.linkedin.com/feed/update/urn:li:activity:6713165668218499072" target="_blank" rel="noreferrer">LINKEDIN <ArrowUpRight size={12} /></a></div></div></div></footer>
    </main>
  );
}
