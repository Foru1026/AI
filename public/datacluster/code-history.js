// 20 milestones curated from the CEO's "AI Code & Image Timeline" (44 Code entries).
// Code examples, dates, original titles and details are preserved from that file.
// These are illustrative panels, not executable integrations or NODDAL benchmarks.
export const CODE_TIMELINE = Object.freeze({ title: 'AI Code & Image Timeline', section: 'code', entries: 44, checked: '2026-10-09' });
const entry = data => Object.freeze({
  ...data,
  code: data.code.join('\n'),
  sources: Object.freeze(data.sources.map(source => Object.freeze(source))),
});
export const CODE_HISTORY = Object.freeze([
  entry({
    "timelineIndex": 0,
    "date": "2017-06-12",
    "dateLabel": "12 Jun 2017",
    "year": "2017",
    "kind": "research",
    "title": "ATTENTION CHANGES THE MODEL",
    "originalTitle": "Google publishes the Transformer",
    "code": [
      "# \"Attention Is All You Need\"",
      "attn = softmax(Q @ K.T / sqrt(d_k))",
      "out  = attn @ V"
    ],
    "note": "Tokens learn to connect through context.\nThe Transformer sets a new foundation.",
    "detail": "The architecture behind every large coding model that followed.",
    "source": "Vaswani et al. / Transformer",
    "url": "https://arxiv.org/abs/1706.03762",
    "sources": [
      {
        "label": "arXiv",
        "url": "https://arxiv.org/abs/1706.03762"
      }
    ]
  }),
  entry({
    "timelineIndex": 1,
    "date": "2019-07-15",
    "dateLabel": "15 Jul 2019",
    "year": "2019",
    "kind": "product",
    "title": "AI COMPLETES THE NEXT LINE",
    "originalTitle": "Deep TabNine puts GPT-2 into autocomplete",
    "code": [
      "def fetch_user(user_id):",
      "    r = requests.get(f\"/users/{user_id}\")",
      "    return r.json()  # ⇥ suggested"
    ],
    "note": "GPT-2 enters the autocomplete workflow.\nDeep TabNine predicts what comes next.",
    "detail": "Trained on about 2 million GitHub files, it predicts the code you're about to type.",
    "source": "Deep TabNine / GPT-2",
    "url": "https://cdn.openai.com/GPT_2_August_Report.pdf",
    "sources": [
      {
        "label": "Synced",
        "url": "https://syncedreview.com/2019/07/18/deep-tabnine-a-powerful-ai-code-autocompleter-for-developers/"
      },
      {
        "label": "OpenAI / GPT-2 release report",
        "url": "https://cdn.openai.com/GPT_2_August_Report.pdf"
      }
    ]
  }),
  entry({
    "timelineIndex": 2,
    "date": "2020-05-28",
    "dateLabel": "28 May 2020",
    "year": "2020",
    "kind": "model",
    "title": "LANGUAGE MODELS GROW TO 175B",
    "originalTitle": "OpenAI publishes GPT-3",
    "code": [
      ">>> gpt3.parameters",
      "175_000_000_000",
      ">>> humaneval(gpt3)   # measured in 2021",
      "0.0"
    ],
    "note": "GPT-3 scales language learning to 175B.\nHumanEval follows a year later: 0%.",
    "detail": "A 175-billion-parameter language model. Tested on code a year later, it solved none of HumanEval's problems.",
    "source": "OpenAI / GPT-3 + HumanEval",
    "url": "https://arxiv.org/abs/2005.14165",
    "sources": [
      {
        "label": "arXiv",
        "url": "https://arxiv.org/abs/2005.14165"
      },
      {
        "label": "Codex paper",
        "url": "https://arxiv.org/abs/2107.03374"
      }
    ]
  }),
  entry({
    "timelineIndex": 3,
    "date": "2021-06-29",
    "dateLabel": "29 Jun 2021",
    "year": "2021",
    "kind": "product",
    "title": "YOUR EDITOR GETS A COPILOT",
    "originalTitle": "GitHub Copilot technical preview",
    "code": [
      "// sort users by signup date, newest first",
      "users.sort((a, b) =>",
      "  b.createdAt - a.createdAt);"
    ],
    "note": "Describe a function inside VS Code.\nCodex suggests code; you review it.",
    "detail": "An AI pair programmer inside VS Code, powered by OpenAI Codex.",
    "source": "GitHub / Copilot preview",
    "url": "https://github.blog/news-insights/product-news/introducing-github-copilot-ai-pair-programmer/",
    "sources": [
      {
        "label": "GitHub",
        "url": "https://github.blog/news-insights/product-news/introducing-github-copilot-ai-pair-programmer/"
      }
    ]
  }),
  entry({
    "timelineIndex": 4,
    "date": "2021-07-07",
    "dateLabel": "7 Jul 2021",
    "year": "2021",
    "kind": "benchmark",
    "title": "TEST WHETHER THE CODE WORKS",
    "originalTitle": "Codex paper introduces HumanEval",
    "code": [
      "def is_palindrome(s: str) -> bool:",
      "    \"\"\"True if s reads the same reversed.\"\"\"",
      "    return s == s[::-1]",
      "# Codex, first try: 28.8% of 164 problems"
    ],
    "note": "HumanEval tests 164 Python problems.\nCodex solves 28.8% on its first try.",
    "detail": "HumanEval becomes the standard code test. Codex solves 28.8% on the first try and 70.2% with 100 tries.",
    "source": "Chen et al. / HumanEval",
    "url": "https://arxiv.org/abs/2107.03374",
    "sources": [
      {
        "label": "arXiv",
        "url": "https://arxiv.org/abs/2107.03374"
      }
    ]
  }),
  entry({
    "timelineIndex": 6,
    "date": "2022-02-02",
    "dateLabel": "2 Feb 2022",
    "year": "2022",
    "kind": "benchmark",
    "title": "AI ENTERS CODING CONTESTS",
    "originalTitle": "DeepMind's AlphaCode competes on Codeforces",
    "code": [
      "n = int(input())",
      "a = sorted(map(int, input().split()))",
      "print(sum(a[::2]))",
      "# estimated rank: top 54%"
    ],
    "note": "AlphaCode tackles unseen contest tasks.\nPerformance reaches the human median.",
    "detail": "About the level of the median human in competitive programming contests.",
    "source": "DeepMind / AlphaCode",
    "url": "https://deepmind.google/blog/competitive-programming-with-alphacode/",
    "sources": [
      {
        "label": "9to5Google",
        "url": "https://9to5google.com/2022/02/02/deepmind-alphacode/"
      },
      {
        "label": "Google DeepMind",
        "url": "https://deepmind.google/blog/competitive-programming-with-alphacode/"
      }
    ]
  }),
  entry({
    "timelineIndex": 8,
    "date": "2022-11-30",
    "dateLabel": "30 Nov 2022",
    "year": "2022",
    "kind": "product",
    "title": "DEBUGGING BECOMES A DIALOGUE",
    "originalTitle": "OpenAI launches ChatGPT",
    "code": [
      "> why does my loop never end?",
      "  `i` is never incremented. Add:",
      "  i += 1"
    ],
    "note": "ChatGPT turns debugging into a dialogue.\nFollow-up questions refine the answer.",
    "detail": "A free research preview that turns debugging into a conversation.",
    "source": "OpenAI / ChatGPT",
    "url": "https://openai.com/index/chatgpt/",
    "sources": [
      {
        "label": "OpenAI",
        "url": "https://openai.com/index/chatgpt/"
      }
    ]
  }),
  entry({
    "timelineIndex": 9,
    "date": "2023-03",
    "dateLabel": "Mar 2023",
    "year": "2023",
    "kind": "product",
    "title": "THE EDITOR BECOMES AI-FIRST",
    "originalTitle": "Cursor, an AI-first code editor, ships",
    "code": [
      "$ cursor .",
      "⌘K  \"add pagination to this endpoint\"",
      "✓ diff ready · accept / reject"
    ],
    "note": "Cursor puts chat and edits in the IDE.\nReview a diff instead of copying code.",
    "detail": "Anysphere's editor builds AI chat and edits into the editor itself. Its oldest changelog entry is dated March 14, 2023.",
    "source": "Anysphere / Cursor",
    "url": "https://cursor.com/changelog/page/51",
    "sources": [
      {
        "label": "Cursor changelog",
        "url": "https://cursor.com/changelog/page/51"
      }
    ]
  }),
  entry({
    "timelineIndex": 10,
    "date": "2023-03-14",
    "dateLabel": "14 Mar 2023",
    "year": "2023",
    "kind": "model",
    "title": "GPT-4 AND CLAUDE ARRIVE",
    "originalTitle": "GPT-4 released; Claude launches the same day",
    "code": [
      "humaneval(\"gpt-3\")   # 0.0%",
      "humaneval(\"codex\")   # 28.8%",
      "humaneval(\"gpt-4\")   # 67.0%"
    ],
    "note": "GPT-4 reaches 67% on HumanEval.\nAnthropic launches Claude the same day.",
    "detail": "GPT-4 solves 67% of HumanEval. Anthropic releases Claude and Claude Instant the same day.",
    "source": "OpenAI + Anthropic / 2023",
    "url": "https://arxiv.org/abs/2303.08774",
    "sources": [
      {
        "label": "GPT-4 report",
        "url": "https://arxiv.org/abs/2303.08774"
      },
      {
        "label": "Anthropic",
        "url": "https://www.anthropic.com/news/introducing-claude"
      }
    ]
  }),
  entry({
    "timelineIndex": 11,
    "date": "2023-05-04",
    "dateLabel": "4 May 2023",
    "year": "2023",
    "kind": "model",
    "title": "CODE MODELS OPEN THEIR WEIGHTS",
    "originalTitle": "StarCoder: an open model trained on code",
    "code": [
      "model  = \"bigcode/starcoder\"   # 15B params",
      "tokens = 1_000_000_000_000",
      "humaneval(model)   # 33.6%"
    ],
    "note": "BigCode releases the 15B StarCoder.\nOpen code models broaden access.",
    "detail": "Released by BigCode, a project led by Hugging Face and ServiceNow.",
    "source": "BigCode / StarCoder",
    "url": "https://huggingface.co/blog/starcoder",
    "sources": [
      {
        "label": "Hugging Face",
        "url": "https://huggingface.co/blog/starcoder"
      }
    ]
  }),
  entry({
    "timelineIndex": 13,
    "date": "2023-10-10",
    "dateLabel": "10 Oct 2023",
    "year": "2023",
    "kind": "benchmark",
    "title": "REAL ISSUES BECOME THE TEST",
    "originalTitle": "SWE-bench tests AI on real GitHub issues",
    "code": [
      "task  = github_issue(\"django/django\")",
      "patch = model.solve(task)",
      "run_tests(patch)   # resolved: 1.96%"
    ],
    "note": "SWE-bench uses 2,294 real GitHub issues.\nClaude 2 resolves 1.96% at launch.",
    "detail": "2,294 issues from 12 Python repositories. The best model at launch, Claude 2, resolves 1.96%.",
    "source": "Jimenez et al. / SWE-bench",
    "url": "https://arxiv.org/abs/2310.06770",
    "sources": [
      {
        "label": "arXiv",
        "url": "https://arxiv.org/abs/2310.06770"
      }
    ]
  }),
  entry({
    "timelineIndex": 14,
    "date": "2024-03-12",
    "dateLabel": "12 Mar 2024",
    "year": "2024",
    "kind": "product",
    "title": "AGENTS PLAN, TEST AND EDIT",
    "originalTitle": "Cognition unveils Devin",
    "code": [
      "[plan]  reproduce the bug from the issue",
      "[shell] npm test   → 3 failing",
      "[edit]  cart.ts    → all passing"
    ],
    "note": "Devin plans, edits and runs tests.\nA task becomes a multi-step workflow.",
    "detail": "Billed as the first AI software engineer. It resolves 13.86% on SWE-bench, up from 1.96%.",
    "source": "Cognition / Devin",
    "url": "https://cognition.com/blog/introducing-devin",
    "sources": [
      {
        "label": "Cognition",
        "url": "https://cognition.com/blog/introducing-devin"
      }
    ]
  }),
  entry({
    "timelineIndex": 17,
    "date": "2024-09-12",
    "dateLabel": "12 Sep 2024",
    "year": "2024",
    "kind": "model",
    "title": "REASON BEFORE WRITING CODE",
    "originalTitle": "OpenAI o1-preview: models that reason first",
    "code": [
      "<thinking>",
      "  brute force is O(n²); n = 10^5. Too slow.",
      "  sort, then use two pointers.",
      "</thinking>"
    ],
    "note": "o1-preview reasons before answering.\nExplore a strategy, then write code.",
    "detail": "The first reasoning model. The full o1, released December 5, reaches the 89th percentile on Codeforces.",
    "source": "OpenAI / o1-preview",
    "url": "https://openai.com/index/learning-to-reason-with-llms/",
    "sources": [
      {
        "label": "OpenAI",
        "url": "https://openai.com/index/learning-to-reason-with-llms/"
      }
    ]
  }),
  entry({
    "timelineIndex": 20,
    "date": "2025-02-02",
    "dateLabel": "2 Feb 2025",
    "year": "2025",
    "kind": "milestone",
    "title": "ENTER: VIBE CODING",
    "originalTitle": "Andrej Karpathy coins \"vibe coding\"",
    "code": [
      "$ describe \"a habit tracker with streaks\"",
      "$ accept --all",
      "# \"forget that the code even exists\""
    ],
    "note": "Karpathy names the shift: vibe coding.\nDescribe intent. Accept. Iterate.",
    "detail": "A post on X names a new way to build: describe what you want and accept what the AI writes.",
    "source": "Karpathy / Vibe coding",
    "url": "https://x.com/karpathy/status/1886192184808149383",
    "sources": [
      {
        "label": "X",
        "url": "https://x.com/karpathy/status/1886192184808149383"
      }
    ]
  }),
  entry({
    "timelineIndex": 21,
    "date": "2025-02-24",
    "dateLabel": "24 Feb 2025",
    "year": "2025",
    "kind": "product",
    "title": "THE AGENT MOVES INTO YOUR TERMINAL",
    "originalTitle": "Claude 3.7 Sonnet and Claude Code",
    "code": [
      "$ claude",
      "> add dark mode and update the tests",
      "  ✓ 6 files changed · tests passing"
    ],
    "note": "Claude Code works inside your terminal.\nAn agent edits files and runs tests.",
    "detail": "An agentic coding tool that works in your terminal, launched as a limited research preview.",
    "source": "Anthropic / Claude Code",
    "url": "https://www.anthropic.com/news/claude-3-7-sonnet",
    "sources": [
      {
        "label": "Anthropic",
        "url": "https://www.anthropic.com/news/claude-3-7-sonnet"
      }
    ]
  }),
  entry({
    "timelineIndex": 22,
    "date": "2025-05-16",
    "dateLabel": "16 May 2025",
    "year": "2025",
    "kind": "product",
    "title": "CODING TASKS MOVE TO THE CLOUD",
    "originalTitle": "OpenAI launches Codex, a cloud coding agent",
    "code": [
      "codex.task(\"fix the flaky checkout test\")",
      "# works in its own cloud sandbox",
      "# → proposes a pull request"
    ],
    "note": "Codex works in an isolated sandbox.\nReview its proposed pull request.",
    "detail": "Powered by codex-1, a version of o3 tuned for software engineering.",
    "source": "OpenAI / Codex cloud agent",
    "url": "https://openai.com/index/introducing-codex/",
    "sources": [
      {
        "label": "OpenAI",
        "url": "https://openai.com/index/introducing-codex/"
      }
    ]
  }),
  entry({
    "timelineIndex": 28,
    "date": "2025-11-18",
    "dateLabel": "18 Nov 2025",
    "year": "2025",
    "kind": "model",
    "title": "AGENTS GET AN ENTIRE WORKSPACE",
    "originalTitle": "Gemini 3 Pro and Google Antigravity",
    "code": [
      "swe_bench_verified(\"gemini-3-pro\")  # 76.2%",
      "terminal_bench_2(\"gemini-3-pro\")    # 54.2%",
      "ide = \"Antigravity\""
    ],
    "note": "Gemini 3 launches with Antigravity.\nAgents use editor, terminal and browser.",
    "detail": "Google launches its new model with Antigravity, an agentic development platform.",
    "source": "Google / Gemini 3 + Antigravity",
    "url": "https://blog.google/products/gemini/gemini-3/",
    "sources": [
      {
        "label": "Google",
        "url": "https://blog.google/products/gemini/gemini-3/"
      }
    ]
  }),
  entry({
    "timelineIndex": 34,
    "date": "2026-04-22",
    "dateLabel": "22 Apr 2026",
    "year": "2026",
    "kind": "milestone",
    "title": "AI WRITES. ENGINEERS APPROVE.",
    "originalTitle": "75% of Google's new code is AI-generated",
    "code": [
      "ai_share(google.new_code)",
      "# fall 2025:  0.50",
      "# April 2026: 0.75"
    ],
    "note": "Google reports 75% of new code from AI.\nEngineers still approve what ships.",
    "detail": "Sundar Pichai at Cloud Next: written by AI, approved by engineers.",
    "source": "Google / Cloud Next 2026",
    "url": "https://blog.google/innovation-and-ai/infrastructure-and-cloud/google-cloud/cloud-next-2026-sundar-pichai/",
    "sources": [
      {
        "label": "Google",
        "url": "https://blog.google/innovation-and-ai/infrastructure-and-cloud/google-cloud/cloud-next-2026-sundar-pichai/"
      }
    ]
  }),
  entry({
    "timelineIndex": 41,
    "date": "2026-09-03",
    "dateLabel": "3 Sep 2026",
    "year": "2026",
    "kind": "model",
    "title": "MODELS TAKE ON LONGER TASKS",
    "originalTitle": "OpenAI releases GPT-6 Astra",
    "code": [
      "model   = \"gpt-6-astra\"",
      "rollout = [\"cyber partners\", \"paid users\"]",
      "# coding, computer use, long tasks"
    ],
    "note": "GPT-6 Astra tackles multi-step work.\nCoding and computer use come together.",
    "detail": "OpenAI's new flagship for long, multi-step work. Cybersecurity partners get it first; paid ChatGPT users follow the next day.",
    "source": "OpenAI / GPT-6 Astra",
    "url": "https://openai.com/index/gpt-6-astra/",
    "sources": [
      {
        "label": "CNBC",
        "url": "https://www.cnbc.com/2026/09/03/open-ai-astra-gpt-6-cyber.html"
      },
      {
        "label": "OpenAI",
        "url": "https://openai.com/index/gpt-6-astra/"
      }
    ]
  }),
  entry({
    "timelineIndex": 43,
    "date": "2026-09-30",
    "dateLabel": "30 Sep 2026",
    "year": "2026",
    "kind": "model",
    "title": "SOFTWARE WORKFLOWS GO LONG-HORIZON",
    "originalTitle": "Google Gemini 4 Argon",
    "code": [
      "deepswe(\"gemini-4-argon\")   # 77.9%",
      "max_output_tokens = 1_000_000",
      "first_access = \"cyber defenders\""
    ],
    "note": "Gemini 4 Argon extends software tasks.\nEarly access goes to cyber defenders.",
    "detail": "Google's new model starts with its Fairwind program for cyber defenders before wider release.",
    "source": "Google / Gemini 4 Argon",
    "url": "https://blog.google/innovation-and-ai/models-and-research/gemini-models/gemini-4-argon/",
    "sources": [
      {
        "label": "Google",
        "url": "https://blog.google/innovation-and-ai/models-and-research/gemini-models/gemini-4-argon/"
      }
    ]
  }),
]);

export function historyPanelLines(index) {
  const story = CODE_HISTORY[index];
  return [story.code.split('\n'), story.note.split('\n').map(line => '// ' + line)];
}

// A small lead-in and newline rests make typing feel deliberate. No random
// clock, DOM nodes, timers or allocations in the render loop; finished cards
// keep their final text even when the camera returns to them.
export function historyTypingReveal(code, elapsed) {
  let time = Math.max(0, elapsed - .15), revealed = 0;
  for (let row = 0; row < code.length; row++) {
    const line = code[row], duration = line.length / 65;
    if (time < duration) return revealed + Math.floor(time * 65);
    revealed += line.length;
    time -= duration;
    if (row < code.length - 1) {
      if (time < .11) return revealed;
      time -= .11;
      revealed++;
    }
  }
  return revealed;
}
