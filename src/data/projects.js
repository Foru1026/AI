// Detail-panel content for the project screens in the glass corridor.
// Order and slugs must match PROJECT_SLUGS in public/datacluster/blue-photos.js.
const shots = (slug) => [`/assets/projects/full/${slug}-1.webp`, `/assets/projects/full/${slug}-2.webp`];

export const PROJECTS = Object.freeze(
  [
    {
      slug: "marqo",
      name: "Marqo",
      category: "AI commerce search",
      url: "https://marqo.ai",
      summary:
        "AI-native search, recommendations and merchandising trained on a retailer’s own catalog, turning every shopper interaction into measurable revenue.",
      highlights: [
        ["Sector", "E-commerce"],
        ["AI focus", "Vector search"],
        ["Delivery", "Web + API"],
      ],
      focus: [
        "Semantic and vector search pipelines over large product catalogs",
        "Recommendation and merchandising APIs behind storefront experiences",
        "Dashboards for relevance tuning and conversion analytics",
      ],
      stack: ["Python", "FastAPI", "Vector search", "React", "TypeScript", "PostgreSQL"],
    },
    {
      slug: "syntheum",
      name: "Syntheum",
      category: "Agentic merchandising",
      url: "https://www.syntheum.ai",
      summary:
        "An agent-first merchandising platform that unifies shopper intent, catalog data and brand identity to automate merchandising decisions in real time across web and AI channels.",
      highlights: [
        ["Sector", "Retail"],
        ["AI focus", "AI agents"],
        ["Delivery", "Platform"],
      ],
      focus: [
        "Agent workflows that curate and recommend from live shopper behaviour",
        "A unified intelligence layer joining catalog, intent and brand rules",
        "Guardrails that keep every automated decision on-brand",
      ],
      stack: ["Python", "LLM agents", "Orchestration", "Node.js", "Redis", "PostgreSQL"],
    },
    {
      slug: "deeplumen",
      name: "DeepLumen",
      category: "Agentic commerce infrastructure",
      url: "https://www.deeplumen.com",
      summary:
        "Infrastructure that makes a brand’s catalog, storefront and checkout discoverable, recommendable and transactable by AI agents across ChatGPT, Gemini, Claude and Perplexity.",
      highlights: [
        ["Sector", "Commerce"],
        ["AI focus", "Tool calling"],
        ["Delivery", "Agentic page"],
      ],
      focus: [
        "Agent-readable product data layered onto existing websites",
        "Agentic commerce protocols and tool calling through to checkout",
        "Attribution of orders that start in an AI conversation",
      ],
      stack: ["TypeScript", "Node.js", "MCP", "Tool calling", "REST APIs", "PostgreSQL"],
    },
    {
      slug: "thankly",
      name: "Thankly",
      category: "Conversational storefronts",
      url: "https://thankly.ai",
      summary:
        "Branded shopping assistants that live inside ChatGPT, Claude and Gemini: grounded in the live catalog, speaking in the brand’s voice, with checkout inside the conversation.",
      highlights: [
        ["Sector", "Brands"],
        ["AI focus", "MCP apps"],
        ["Delivery", "In-chat store"],
      ],
      focus: [
        "An app layer above product feeds: ontology, memory and guardrails",
        "Answers grounded in live inventory, never a hallucinated SKU",
        "Checkout completed in the assistant or on the brand’s own site",
      ],
      stack: ["MCP", "LLM apps", "RAG", "TypeScript", "React", "Node.js"],
    },
    {
      slug: "vendifai",
      name: "VendifAI",
      category: "AI product discovery",
      url: "https://vendifai.com",
      summary:
        "AI product discovery that guides shoppers from first search to purchase with intelligent search, smart comparisons, contextual assistance and buying guidance.",
      highlights: [
        ["Sector", "E-commerce"],
        ["AI focus", "RAG"],
        ["Delivery", "Widget + API"],
      ],
      focus: [
        "Intent-aware search and side-by-side comparison flows",
        "Conversational buying guidance grounded in product data",
        "Insight into how a brand appears across AI platforms",
      ],
      stack: ["React", "TypeScript", "Python", "RAG", "LLM apps", "Redis"],
    },
    {
      slug: "kepler",
      name: "Kepler",
      category: "AI-ready storefronts",
      url: "https://www.trykepler.ai",
      summary:
        "An agentic platform that gives retailers control over how AI sees their products, with AI-ready storefronts, agent insights and conversion of AI-referred visitors.",
      highlights: [
        ["Sector", "Retail"],
        ["AI focus", "Agent traffic"],
        ["Delivery", "Storefront"],
      ],
      focus: [
        "One storefront served to both human visitors and AI agents",
        "Insights into agentic browsers and AI-referred traffic",
        "A conversational storefront that turns AI visits into customers",
      ],
      stack: ["React", "TypeScript", "Node.js", "LLM apps", "Analytics", "CI/CD"],
    },
    {
      slug: "sozai",
      name: "SozAI",
      category: "AI transcription & notes",
      url: "https://sozai.app",
      summary:
        "Turns audio, video and YouTube links into searchable text with speaker labels, AI summaries and notes in 99 languages, on mobile, desktop and the web.",
      highlights: [
        ["Sector", "Productivity"],
        ["AI focus", "Speech + LLM"],
        ["Delivery", "Web + mobile"],
      ],
      focus: [
        "Speech-to-text pipeline with speaker labelling",
        "LLM summaries, notes and quizzes generated from transcripts",
        "Cross-platform apps served by one shared API",
      ],
      stack: ["Python", "FastAPI", "LLM apps", "React", "Docker", "PostgreSQL"],
    },
    {
      slug: "rubick",
      name: "Rubick.ai",
      category: "AI e-commerce OS",
      url: "https://rubick.ai",
      summary:
        "An AI operating system for retail that automates catalog enrichment, product discovery, competitor intelligence and growth insights for brands and marketplaces.",
      highlights: [
        ["Sector", "Marketplaces"],
        ["AI focus", "Document AI"],
        ["Delivery", "SaaS suite"],
      ],
      focus: [
        "Automated catalog enrichment from raw product data",
        "Market and competitor intelligence data pipelines",
        "AI agents for day-to-day catalog operations",
      ],
      stack: ["Python", "Document AI", "Automation", "PostgreSQL", "React", "Docker"],
    },
    {
      slug: "flint",
      name: "Flint",
      category: "Self-improving marketing",
      url: "https://www.tryflint.com",
      summary:
        "A closed learning loop between ads and landing pages: on-brand pages built for every campaign, and an ads agent that proposes fixes for approval.",
      highlights: [
        ["Sector", "Marketing"],
        ["AI focus", "Agents + HITL"],
        ["Delivery", "Platform"],
      ],
      focus: [
        "Landing pages generated from campaign intent and keywords",
        "An ads agent whose changes ship only after human approval",
        "A feedback loop from conversion data back into page variants",
      ],
      stack: ["TypeScript", "React", "LLM agents", "Human-in-the-loop", "Node.js", "Automation"],
    },
    {
      slug: "livedemo",
      name: "LiveDemo",
      category: "AI demo agents",
      url: "https://livedemo.ai",
      summary:
        "Interactive, clickable product demos with an AI agent that presents the product, qualifies leads and books calls, built for product-led growth.",
      highlights: [
        ["Sector", "B2B SaaS"],
        ["AI focus", "AI agents"],
        ["Delivery", "Embeds"],
      ],
      focus: [
        "Product capture turned into interactive, shareable demos",
        "A demo agent that walks through, qualifies and schedules with tool calls",
        "Embeddable player with engagement analytics",
      ],
      stack: ["React", "TypeScript", "Node.js", "AI agents", "Tool calling", "Docker"],
    },
  ].map((project) => Object.freeze({ ...project, shots: shots(project.slug) })),
);

export const projectIndex = (slug) => PROJECTS.findIndex((project) => project.slug === slug);
