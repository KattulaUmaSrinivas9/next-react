"use client";

import { useState } from "react";
import Image from "next/image";
import { ArrowDown, ArrowLeft, ArrowRight, ArrowUpRight, Check, ChevronDown, Code2, Layers3, Mail, Menu, Sparkles, X } from "lucide-react";

const projects = [
  {
    number: "01", category: "Commerce · Product Experience", title: "Walmart Savings & Subscriptions",
    subtitle: "Accessible shopping flows, from savings to subscriptions.",
    description: "Responsive savings pages and server-rendered subscription flows built with reusable UI components. The work focused on accessibility, performance, and clear end-to-end customer journeys across devices.",
    work: ["Turned Figma designs into a responsive Savings experience built around accessible, clear shopping flows", "Delivered server-rendered subscription journeys and reusable UI components", "Built Java/Spring Boot REST APIs and JWT-secured integrations for customer workflows", "Improved page stability and data delivery through GraphQL, feature flags, lazy loading, and API caching"],
    stack: ["Next.js", "React", "Java", "Spring Boot", "REST APIs", "GraphQL", "WCAG"], accent: "mint",
    links: [
      { label: "Walmart Savings", href: "https://www.walmart.com/savings" },
      { label: "Walmart Subscriptions", href: "https://www.walmart.com/subscriptions" },
    ],
  },
  {
    number: "02", category: "Analytics · Retail", title: "Traffic Sense",
    subtitle: "Making customer behavior easier to understand.",
    description: "An internal analytics dashboard built to give teams more ownership of their data and reduce reliance on third-party analytics. The experience centers on clear KPIs, drill-down analysis, and useful export workflows.",
    work: ["Led UI delivery for an internal analytics dashboard that gives teams more ownership of their reporting workflows", "Translated product and analytics requirements into focused KPI views with AG Grid and AM Charts", "Built drill-down, filtering, and export flows so users can move from summary metrics to useful detail", "Validated analytics tracking across releases to keep reported activity dependable"],
    stack: ["React", "Next.js", "AG Grid", "AM Charts", "Accessibility"], accent: "lilac",
    links: [],
  },
  {
    number: "03", category: "Energy · Customer Experience", title: "DE Texas Acquisition",
    subtitle: "One place for plans, usage, and payments.",
    description: "A mobile-responsive energy web application for managing customer profiles, electricity plans, terms, utilization, and payments, designed around clear user workflows.",
    work: ["Led wireframe design and delivery of mobile-ready journeys for profiles, plans, usage, and payments", "Built enrollment and payment experiences with Next.js SSR/SSG and dynamic routes", "Integrated Cognito authentication and JWT-secured Spring REST APIs; validated an App Router/AWS Lambda proof of concept", "Created multilingual, WCAG 2.1 React/Storybook components and raised unit test coverage above 80%"],
    stack: ["React", "Next.js", "TypeScript", "Spring Boot", "REST APIs", "AWS Cognito", "WCAG 2.1"], accent: "blue",
    links: [{ label: "Direct Energy", href: "https://www.directenergy.com/" }],
  },
  {
    number: "04", category: "Enterprise · Operations Platform", title: "Omnia",
    subtitle: "A configurable platform for web, desktop, and service operations.",
    description: "A suite of web and desktop applications for managing users, releases, regional flags, and service workflows. Dashboards surfaced container and process logs, while configurable services connected the UI to backend systems.",
    work: ["Shipped responsive, WCAG 2.1 workflows directly from product journeys and Figma/Sketch designs", "Built the admin application from scratch for user access, releases, and regional feature flags", "Delivered Next.js web and Electron desktop clients alongside Python/FastAPI REST APIs and Java services", "Secured API workflows with OAuth2/JWT and streamed live container/process logs to dashboards over sockets"],
    stack: ["React", "Next.js", "Electron", "FastAPI", "OAuth2 / JWT", "Sockets", "WCAG 2.1"], accent: "lilac",
    links: [{ label: "About Entain", href: "https://www.entaingroup.com/about-entain/" }],
  },
  {
    number: "05", category: "SaaS · Conversational AI", title: "Techforce Chatbot",
    subtitle: "A configurable chatbot platform built from connected services.",
    description: "A multi-service chatbot product with a React interface, NLP training, chat history, feedback, and content management. The SaaS release brought together nine containerized services behind configurable environment settings.",
    work: ["Built React dialog-modeler and catalogue features backed by Node/Express and NLP services", "Connected training, chat history, and feedback APIs across the product's microservices", "Queued NLP training jobs with RabbitMQ to avoid spawning every process at once and overloading VMs", "Packaged nine services into a Dockerized SaaS release and adapted build scripts for cloud marketplace delivery"],
    stack: ["React", "Node.js", "RabbitMQ", "Elasticsearch", "Docker"], accent: "gold",
    links: [{ label: "Supervity", href: "https://www.supervity.ai/" }],
  },
  {
    number: "06", category: "Education · Mobile", title: "Digital Books",
    subtitle: "Learning content that works across platforms.",
    description: "A digital books experience for web and mobile, with reusable Angular components and offline access. Automated content ingestion helped move book data and assets into MongoDB and AWS S3.",
    work: ["Built reusable Angular and Ionic experiences for web, iOS, and Android digital books", "Added offline reading so learners could access books without a network connection", "Automated hierarchical book and asset ingestion into MongoDB and S3, reducing manual processing by 90%", "Implemented Java/Spring services and REST integrations for book, user, and assessment workflows"],
    stack: ["Angular", "Ionic", "TypeScript", "MongoDB", "AWS S3"], accent: "blue",
    links: [{ label: "OneLern Experience", href: "https://www.onelern.com/experience" }],
  },
];

const experience = [
  { years: "2025 — Now", company: "Walmart Inc.", role: "UI Full Stack Engineer", focus: "Retail analytics, subscriptions & accessible commerce", highlights: ["Lead delivery across internal analytics and customer-facing Savings and subscription experiences.", "Build secure REST APIs with Java/Spring Boot and JWT authorization, alongside Next.js SSR customer flows.", "Turn KPI requirements into interactive AG Grid and AM Charts views with filtering, drill-down, and export.", "Improve rendering and API performance; validate quality with over 90% unit test coverage, Playwright/TestCafe flows, and NVDA/VoiceOver checks."] },
  { years: "2023 — 2025", company: "Zelante Technologies", role: "Senior UI Developer", focus: "Energy customer experiences · NRG Energy", highlights: ["Led full-stack delivery of mobile-ready customer journeys for profiles, plans, usage, and payments.", "Built React/Next.js experiences and secure Spring REST integrations using Cognito and JWT; explored an App Router/AWS Lambda proof of concept.", "Created reusable, multilingual Storybook components meeting WCAG 2.1 and used SSR/SSG to improve first-load performance and SEO.", "Raised unit test coverage above 80% and reduced deployment errors by 30% through Jenkins and SonarQube workflows."] },
  { years: "2021 — 2023", company: "Ivy Comptech / Entain", role: "Senior Software Engineer", focus: "Omnia · Web, desktop & operations platform", highlights: ["Turned product journeys and UX designs into responsive, WCAG-aligned Next.js web and Electron desktop workflows.", "Created an admin application from scratch for user management, releases, and regional feature flags.", "Developed Python/FastAPI REST APIs and integrated Java microservices behind product workflows.", "Secured API access with OAuth2/JWT and streamed live container/process logs to dashboards over sockets."] },
  { years: "2019 — 2021", company: "Digitamize / Techforce.ai", role: "Full Stack Developer", focus: "Conversational AI · SaaS · Microservices", highlights: ["Built React chatbot and NLP Trainer features with Node/Express APIs for dialog modeling, training, chat history, and feedback.", "Designed RabbitMQ-backed NLP job queues to control concurrent workloads and prevent VM overload.", "Integrated Keycloak and ForgeRock authentication and supported migration of auth data from MongoDB to PostgreSQL.", "Dockerized nine services and prepared build/release scripts for cloud marketplace delivery."] },
  { years: "2017 — 2019", company: "Fortunapix Pvt Ltd", role: "MERN Stack Developer", focus: "Education technology · Digital books", highlights: ["Delivered Angular and Ionic digital book experiences across web and mobile platforms.", "Implemented Java/Spring REST services for book, user, and assessment workflows, with offline reading in the mobile app.", "Automated content and asset ingestion into MongoDB and AWS S3, reducing manual processing by 90%.", "Built reusable UI components and supported a modular Kubernetes deployment."] },
];

const skillGroups = {
  Frontend: ["React", "Next.js", "Angular", "JavaScript", "TypeScript", "HTML / CSS", "Storybook", "Accessibility"],
  Backend: ["Node.js", "Express", "Java", "Spring Boot", "Python", "REST APIs", "GraphQL"],
  Cloud: ["CI/CD", "Docker", "Kubernetes", "Jenkins", "GitHub Actions", "AWS"],
  Data: ["PostgreSQL", "MongoDB", "DynamoDB", "Elasticsearch", "RabbitMQ", "AG Grid", "AM Charts"],
  Quality: ["Jest", "React Testing Library", "Playwright", "TestCafe", "WCAG", "NVDA / VoiceOver"],
};

type SkillGroup = keyof typeof skillGroups;
const groupNames = Object.keys(skillGroups) as SkillGroup[];
const featuredTechnologies = ["React", "Next.js", "Node.js", "Docker", "Java", "Python", "AWS"];
const remainingTechnologies = Object.values(skillGroups).flat().filter((technology) => !featuredTechnologies.includes(technology));
const blogArticles = [
  { title: "React deployments with runtime configuration", href: "https://umasrinivask.medium.com/React-application-deployments-with-runtime-configuration-dd42820e3f50", type: "DEPLOYMENT" },
  { title: "Multi-stage Docker images for React apps", href: "https://umasrinivask.medium.com/build-a-multi-stage-docker-image-for-React-app-to-load-runtime-environment-settings-911517f5f58d", type: "DOCKER" },
  { title: "Dockerize Elasticsearch & Kibana securely", href: "https://umasrinivask.medium.com/dockerize-elasticsearch-kibana-with-x-packs-security-237589acb3fd", type: "ELASTICSEARCH" },
  { title: "Nginx as a reverse proxy with Docker Compose", href: "https://umasrinivask.medium.com/configure-nginx-as-a-reverse-proxy-with-docker-compose-file-4ebba2b75c89", type: "INFRASTRUCTURE" },
];
const techStarPositions: [number, number][] = (() => {
  const positions: [number, number][] = [];
  let seed = 42817;
  const random = () => {
    seed = (seed * 1664525 + 1013904223) >>> 0;
    return seed / 4294967296;
  };

  for (let attempt = 0; positions.length < remainingTechnologies.length && attempt < 5000; attempt += 1) {
    const left = 5 + random() * 90;
    const top = 7 + random() * 86;
    const portraitClearance = ((left - 50) / 18.5) ** 2 + ((top - 50) / 26.5) ** 2;
    const spacedFromStars = positions.every(([x, y]) => Math.hypot((left - x) * 3.4, (top - y) * 2.5) > 25);
    if (portraitClearance > 1.12 && spacedFromStars) positions.push([left, top]);
  }

  return positions;
})();

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
        <div className="hero-art" aria-label="Portrait surrounded by interactive technology stars" role="group" onPointerMove={(event) => {
          const bounds = event.currentTarget.getBoundingClientRect();
          const x = (event.clientX - bounds.left) / bounds.width - 0.5;
          const y = (event.clientY - bounds.top) / bounds.height - 0.5;
          event.currentTarget.style.setProperty("--grid-shift-x", `${x * 4}px`);
          event.currentTarget.style.setProperty("--grid-shift-y", `${y * 4}px`);
          event.currentTarget.style.setProperty("--orbit-shift-x", `${x * 7}px`);
          event.currentTarget.style.setProperty("--orbit-shift-y", `${y * 6}px`);
          event.currentTarget.style.setProperty("--portrait-shift-x", `${x * -6}px`);
          event.currentTarget.style.setProperty("--portrait-shift-y", `${y * -5}px`);
        }} onPointerLeave={(event) => {
          ["--grid-shift-x", "--grid-shift-y", "--orbit-shift-x", "--orbit-shift-y", "--portrait-shift-x", "--portrait-shift-y"].forEach((property) => event.currentTarget.style.setProperty(property, "0px"));
        }}>
          <div className="art-grid" />
          <div className="tech-starfield" aria-label="Additional technology stars">
            {remainingTechnologies.map((technology, index) => {
              const [left, top] = techStarPositions[index];
              const edgeClass = left < 16 ? "tech-star-left" : left > 84 ? "tech-star-right" : "";
              const verticalClass = top > 72 ? "tech-star-above" : "";
              return <button key={technology} type="button" className={`tech-star ${edgeClass} ${verticalClass}`} style={{ left: `${left}%`, top: `${top}%` }} aria-label={technology} data-tech={technology} />;
            })}
          </div>
          <div className="profile-planets" aria-label="External profiles">
            <div className="jupiter-system" aria-label="Code profile with orbiting particles">
              <div className="jupiter-granules jupiter-granules-outer" aria-hidden="true">{Array.from({ length: 44 }, (_, index) => { const angle = index * 2.39996; const wobble = ((index * 37) % 17) / 17; const radiusX = 43 + wobble * 13; const radiusY = 41 + ((index * 23) % 19) / 19 * 13; const size = .8 + ((index * 11) % 13) / 13 * 1.5; return <i key={index} style={{ left: `${50 + Math.cos(angle) * radiusX}%`, top: `${50 + Math.sin(angle) * radiusY}%`, width: size, height: size }} />; })}</div>
              <div className="jupiter-granules jupiter-granules-inner" aria-hidden="true">{Array.from({ length: 32 }, (_, index) => { const angle = index * 2.39996 + .6; const wobble = ((index * 29) % 15) / 15; const radiusX = 42 + wobble * 12; const radiusY = 40 + ((index * 17) % 17) / 17 * 12; const size = .8 + ((index * 7) % 11) / 11 * 1.4; return <i key={index} style={{ left: `${50 + Math.cos(angle) * radiusX}%`, top: `${50 + Math.sin(angle) * radiusY}%`, width: size, height: size }} />; })}</div>
              <a className="profile-planet profile-planet-code" href="https://github.com/KattulaUmaSrinivas9" target="_blank" rel="noreferrer" aria-label="GitHub" />
            </div>
            <a className="profile-planet profile-planet-network" href="https://www.linkedin.com/feed/update/urn:li:activity:6713165668218499072" target="_blank" rel="noreferrer" aria-label="LinkedIn" />
            <div className="writing-planet-system" aria-label="Writing planet with four orbiting articles">
              <div className="blog-orbit">
                {blogArticles.map((article, index) => <a key={article.href} className={`blog-moon blog-moon-${index + 1}`} href={article.href} target="_blank" rel="noreferrer" aria-label={article.title} title={article.title} />)}
              </div>
              <a className="profile-planet profile-planet-writing" href="https://umasrinivask.medium.com/" target="_blank" rel="noreferrer" aria-label="Blogs" />
            </div>
          </div>
          <div className="orbit orbit-one" role="group" aria-label="Featured technologies orbiting Uma">
            <span className="orbit-tech orbit-tech-one"><span>React</span></span><span className="orbit-tech orbit-tech-two"><span>Next.js</span></span><span className="orbit-tech orbit-tech-three"><span>Node.js</span></span><span className="orbit-tech orbit-tech-seven"><span>Docker</span></span>
          </div>
          <div className="orbit orbit-two" role="group" aria-label="More featured technologies">
            <span className="orbit-tech orbit-tech-four"><span>Applied AI</span></span><span className="orbit-tech orbit-tech-five"><span>AWS</span></span><span className="orbit-tech orbit-tech-six"><span>Java</span></span><span className="orbit-tech orbit-tech-eight"><span>Python</span></span>
          </div>
          <div className="portrait-frame"><Image src="/photo.png" alt="" width={220} height={220} priority className="portrait-image" /></div>
        </div>
        <div className="hero-bottom"><span><span className="hero-specialty-highlight">FRONTEND × FULL STACK × PRODUCT THINKING × APPLIED AI</span></span><a href="#about" aria-label="Scroll to about"><ArrowDown size={16} /></a><span>SCROLL TO EXPLORE</span></div>
      </section>

      <section className="section-wrap work-section" id="work">
        <div className="section-heading"><div><div className="eyebrow">A FEW THINGS I&apos;VE HELPED SHIP</div><h2>Selected work<span className="heading-period">.</span></h2></div><p>Product stories across retail and e-commerce, sports betting, energy, SaaS, and education—told through the decisions and details behind the UI.</p></div>
        <div className={`project-feature accent-${project.accent}`}>
          <div className="project-index-panel">
            <span className="project-index-number">{project.number}</span>
            <div className="project-topline"><span className="eyebrow">{project.category}</span><span className="project-count">{project.number} <i>/</i> 0{projects.length}</span></div>
            <h3>{project.title}</h3><p className="project-subtitle">{project.subtitle}</p>
            <div className="tag-list">{project.stack.map((tag) => <span key={tag}>{tag}</span>)}</div>
          </div>
          <div className="project-info">
            <div className="project-summary-label"><span className="status-dot" /> CASE STUDY</div>
            <p className="project-description">{project.description}</p>
            <div className="project-contribution"><span className="contribution-label">WHAT I CONTRIBUTED</span><ul>{project.work.map((item) => <li key={item}><Check size={15} />{item}</li>)}</ul></div>
            <div className="project-link-actions">{project.links.length > 0 ? project.links.map((link) => <a key={link.href} href={link.href} target="_blank" rel="noreferrer">{link.label}<ArrowUpRight size={14} /></a>) : <span className="project-confidential"><strong>INTERNAL TOOL · CONFIDENTIAL</strong><small>Details are kept high level.</small></span>}</div>
            <div className="project-controls"><span className="project-current">STORY 0{activeProject + 1} OF 0{projects.length}</span><div className="arrow-controls"><button onClick={() => moveProject(-1)} aria-label="Previous project"><ArrowLeft size={17} /></button><button onClick={() => moveProject(1)} aria-label="Next project"><ArrowRight size={17} /></button></div></div>
          </div>
        </div>
        <div className="project-selector" aria-label="Choose a project">{projects.map((item, index) => <button key={item.number} onClick={() => setActiveProject(index)} className={activeProject === index ? "selector-item selector-active" : "selector-item"} aria-current={activeProject === index ? "true" : undefined}><span className="selector-number">{item.number}</span><span className="selector-text"><strong>{item.title}</strong><small>{item.category}</small></span><ArrowUpRight size={15} /></button>)}</div>
      </section>

      <section className="about-section" id="about"><div className="section-wrap about-grid"><div className="about-aside"><div className="eyebrow">A LITTLE ABOUT HOW I WORK</div><div className="about-stamp"><Code2 size={32} /><span>HUMAN FIRST<br />SYSTEMS MINDED</span></div><div className="about-aside-note">From the first sketch to the production dashboard, I enjoy the whole path from problem to shipped product.</div></div><div className="about-copy"><h2>Curious by default.<br /><span>Practical by design.</span></h2><p className="about-lead">For 10 years, I&apos;ve worked across the full product journey—from shaping an idea and building its interface to connecting services and making releases dependable.</p><p>I like the hard middle: untangling a complex workflow, finding the simplest useful shape, and making sure the result works for more people and more devices. I bring a systems mindset to UI work, and a care for detail to the systems behind it.</p><div className="about-facts"><div><strong>10<span>+</span></strong><small>YEARS IN SOFTWARE</small></div><div><strong>5</strong><small>INDUSTRIES</small></div><div><strong>12<span>+</span></strong><small>APPS &amp; PROJECTS DELIVERED</small></div></div><div className="credentials"><span>AWS CERTIFIED DEVELOPER — ASSOCIATE</span><span>APOLLO CERTIFIED DEVELOPER</span></div></div></div></section>

      <section className="section-wrap experience-section" id="experience"><div className="section-heading"><div><div className="eyebrow">WHERE I&apos;VE BEEN</div><h2>Experience<span className="heading-period">.</span></h2></div><p>Growing from cross-platform product work into full-stack experiences and large-scale retail products.</p></div><div className="timeline">{experience.map((item, index) => <article className={openExperience === index ? "experience-item experience-open" : "experience-item"} key={item.company}><span className="timeline-marker">0{index + 1}</span><button className="experience-toggle" onClick={() => setOpenExperience(openExperience === index ? null : index)} aria-expanded={openExperience === index}><span className="experience-years">{item.years}</span><span className="experience-main"><strong>{item.company}</strong><span>{item.role}</span></span><span className="experience-focus">{item.focus}</span><span className="experience-chevron"><ChevronDown size={18} /></span></button>{openExperience === index && <div className="experience-details"><ul>{item.highlights.map((highlight) => <li key={highlight}>{highlight}</li>)}</ul></div>}</article>)}</div></section>

      <section className="skills-section" id="skills"><div className="section-wrap skills-layout"><div className="skills-intro"><div className="eyebrow">THE TOOLS ARE ONLY PART OF IT</div><h2>A flexible<br /><span>toolkit.</span></h2><p>Pick a lane to explore the technologies and practices I reach for most.</p><div className="skill-categories" role="tablist" aria-label="Skill categories">{groupNames.map((group) => <button key={group} role="tab" aria-selected={skillGroup === group} className={skillGroup === group ? "skill-tab skill-tab-active" : "skill-tab"} onClick={() => setSkillGroup(group)}>{group}<ArrowUpRight size={13} /></button>)}</div></div><div className="skills-panel"><div className="skills-panel-top"><span><Layers3 size={16} /> {skillGroup}</span><span>0{groupNames.indexOf(skillGroup) + 1} / 0{groupNames.length}</span></div><div className="skills-cloud" role="tabpanel">{skillGroups[skillGroup].map((skill, index) => <span key={skill} className={index === 0 ? "skill-pill skill-pill-featured" : "skill-pill"}>{skill}{index === 0 && <Sparkles size={13} />}</span>)}</div><div className="skills-note"><span className="status-dot" /> ALWAYS LEARNING, ALWAYS SHIPPING</div></div></div></section>

      <section className="writing-section section-wrap"><div className="section-heading"><div><div className="eyebrow">NOTES FROM THE BUILD</div><h2>Writing &amp; community<span className="heading-period">.</span></h2></div><p>Practical notes on shipping, deployment, and the infrastructure that supports great product experiences.</p></div><div className="writing-list">{blogArticles.map((article, index) => <a key={article.href} href={article.href} target="_blank" rel="noreferrer"><span className="writing-number">0{index + 1}</span><span className="writing-title">{article.title}</span><span className="writing-type">{article.type}</span><ArrowUpRight size={17} /></a>)}</div></section>

      <footer className="footer"><div className="section-wrap"><div className="footer-cta"><div><div className="eyebrow">HAVE A GOOD PROBLEM TO SOLVE?</div><h2>Let&apos;s make it<br /><span>make sense.</span></h2></div><div className="footer-contact-links"><a className="footer-email" href="mailto:umasrinivas9k@gmail.com">umasrinivas9k@gmail.com <ArrowUpRight size={20} /></a><a className="footer-phone" href="tel:+14795608479">+1 (479) 560-8479</a></div></div><div className="footer-bottom"><a className="wordmark" href="#top" aria-label="K. Uma Srinivas, home"><span className="wordmark-mark">K<span>.</span></span><span>UMA SRINIVAS</span></a><span>UI FULL STACK ENGINEER · 2026</span><div><a href="https://github.com/KattulaUmaSrinivas9" target="_blank" rel="noreferrer">CODE <ArrowUpRight size={12} /></a><a href="https://www.linkedin.com/feed/update/urn:li:activity:6713165668218499072" target="_blank" rel="noreferrer">PROFILE <ArrowUpRight size={12} /></a></div></div></div></footer>
    </main>
  );
}
