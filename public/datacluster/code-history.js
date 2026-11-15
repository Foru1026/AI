// 20 milestones from Ben Clark's career, oldest first, one per flight card.
// Code lines are illustrative of the work described, not excerpts of client code.
const entry = data => Object.freeze({ ...data, code: data.code.join('\n') });

export const CODE_HISTORY = Object.freeze([
  entry({
    dateLabel: '2014 – 2018',
    title: 'COMPUTER SCIENCE FOUNDATIONS',
    code: [
      'degree = "BSc Computer Science"',
      'school = "University of Science & Tech."',
      'focus  = ["algorithms", "systems", "data"]',
    ],
    note: 'Algorithms, systems and data structures.\nThe base for everything that followed.',
    source: 'Education / University of Science & Tech.',
  }),
  entry({
    dateLabel: '2018 · Affinda',
    title: 'DOCUMENTS BECOME DATA',
    code: [
      'doc = parse("invoice.pdf")',
      'fields = extract(doc, schema=Invoice)',
      'assert fields.total is not None',
    ],
    note: 'Python services turn business documents\ninto structured, validated data.',
    source: 'Software Engineer / Affinda',
  }),
  entry({
    dateLabel: '2019 · Affinda',
    title: 'EXTRACTION AT PRODUCTION SCALE',
    code: [
      'for doc in queue.stream():',
      '    result = pipeline.run(doc)',
      '    downstream.push(result)',
    ],
    note: 'Document pipelines feed results straight\ninto downstream business systems.',
    source: 'Software Engineer / Affinda',
  }),
  entry({
    dateLabel: '2020 · Affinda',
    title: 'MACHINE LEARNING IN THE LOOP',
    code: [
      'pred = model.predict(features)',
      'if pred.confidence < THRESHOLD:',
      '    route_to_review(doc)',
    ],
    note: 'ML components run inside the backend;\nlow-confidence results go to review.',
    source: 'Software Engineer / Affinda',
  }),
  entry({
    dateLabel: '2021 · Affinda',
    title: 'VALIDATION BEFORE TRUST',
    code: [
      'errors = validate(fields, rules)',
      'if errors: flag(doc, errors)',
      'else: commit(fields)',
    ],
    note: 'Validation workflows make automated\ndocument intelligence consistent.',
    source: 'Software Engineer / Affinda',
  }),
  entry({
    dateLabel: '2021 · n8n',
    title: 'WORKFLOWS RUN THEMSELVES',
    code: [
      'on("crm.contact.created")',
      '  .then(syncTo("billing"))',
      '  .then(notify("#sales"))',
    ],
    note: 'Backend services and automations connect\nAPIs, databases and SaaS platforms.',
    source: 'Software Engineer / n8n',
  }),
  entry({
    dateLabel: '2021 · n8n',
    title: 'REUSABLE AUTOMATION WORKFLOWS',
    code: [
      'const flow = template("data-sync")',
      'flow.configure({ source, target })',
      'await flow.activate()',
    ],
    note: 'Reusable workflows for data sync,\nnotifications and integrations.',
    source: 'Software Engineer / n8n',
  }),
  entry({
    dateLabel: '2022 · n8n',
    title: 'AI JOINS THE WORKFLOW',
    code: [
      'const intent = await llm.classify(ticket)',
      'if (rules.allow(intent)) route(ticket)',
      'else escalate(ticket)',
    ],
    note: 'Business rules and model decisions\nwork side by side.',
    source: 'Automation Engineer / n8n',
  }),
  entry({
    dateLabel: '2022 · n8n',
    title: 'RETRIES, LOGS, CONTROLLED RUNS',
    code: [
      'await step.run(task, {',
      '  retries: 3, backoff: "exponential",',
      '})',
    ],
    note: 'Error handling, retries and logging\nmake automations dependable.',
    source: 'Promoted to Automation Engineer / n8n',
  }),
  entry({
    dateLabel: '2022 · Lindy',
    title: 'AGENTS LEARN TO TAKE ACTION',
    code: [
      'agent = Agent(tools=[calendar, email, crm])',
      'plan = agent.plan("book the follow-up")',
      'agent.execute(plan)',
    ],
    note: 'Multi-step agents for research,\nscheduling and communication.',
    source: 'AI Automation & Agent Engineer / Lindy',
  }),
  entry({
    dateLabel: '2023 · Lindy',
    title: 'REASONING MEETS BUSINESS DATA',
    code: [
      'context = crm.lookup(lead.email)',
      'reply = llm.draft(thread, context)',
      'outbox.queue(reply)',
    ],
    note: 'LLM reasoning grounded in structured data,\nexternal APIs and integrations.',
    source: 'AI Automation & Agent Engineer / Lindy',
  }),
  entry({
    dateLabel: '2023 · Lindy',
    title: 'TOOLS WITH GUARDRAILS',
    code: [
      '@tool(schema=CreateEvent)',
      'def create_event(args):',
      '    return calendar.insert(validate(args))',
    ],
    note: 'Tool-based execution with validated,\ncontrolled actions.',
    source: 'AI Automation & Agent Engineer / Lindy',
  }),
  entry({
    dateLabel: '2024 · Lindy',
    title: 'STATE THAT SURVIVES EVERY STEP',
    code: [
      'state = store.load(run_id)',
      'state = await step(state, event)',
      'store.save(run_id, state)',
    ],
    note: 'Workflow state management keeps long\nautomations resumable.',
    source: 'AI Automation & Agent Engineer / Lindy',
  }),
  entry({
    dateLabel: '2024 · Lindy',
    title: 'SOME DECISIONS STAY HUMAN',
    code: [
      'if action.risk >= Risk.HIGH:',
      '    await request_approval(owner, action)',
      'agent.execute(action)',
    ],
    note: 'Human-approval and exception paths for\ntasks that need business judgment.',
    source: 'AI Automation & Agent Engineer / Lindy',
  }),
  entry({
    dateLabel: '2025 · Lindy',
    title: 'REQUIREMENTS INTO AUTOMATION',
    code: [
      'spec = ops.requirements("invoice follow-up")',
      'workflow = design(spec, tools, approvals)',
      'deploy(workflow, env="production")',
    ],
    note: 'Operational needs translated into\nreliable AI automation systems.',
    source: 'AI Automation & Agent Engineer / Lindy',
  }),
  entry({
    dateLabel: '2025 · Devjam',
    title: 'AI SHIPS AS PRODUCT',
    code: [
      '<Assistant',
      '  retrieve={searchDocs}',
      '  fallback={<HumanHandoff />} />',
    ],
    note: 'LLM assistants with retrieval, permissions\nand graceful fallbacks.',
    source: 'Senior AI & Full Stack Engineer / Devjam',
  }),
  entry({
    dateLabel: '2025 · Devjam',
    title: '15+ FEATURES, ONE COMPONENT SYSTEM',
    code: [
      'export function DataTable<T>(props: Props<T>) {',
      '  const rows = useVirtualRows(props.rows);',
      '  return <Table rows={rows} />;',
    ],
    note: 'Reusable React components shipped across\n15+ production features.',
    source: 'Senior AI & Full Stack Engineer / Devjam',
  }),
  entry({
    dateLabel: '2026 · Devjam',
    title: '~35% FASTER, END TO END',
    code: [
      'CREATE INDEX CONCURRENTLY idx_orders_user',
      '  ON orders (user_id, created_at);',
      '-- plus leaner rendering and API calls',
    ],
    note: 'Rendering, API and database work adds up\nto roughly 35% better performance.',
    source: 'Senior AI & Full Stack Engineer / Devjam',
  }),
  entry({
    dateLabel: '2026 · Devjam',
    title: '99%+ AVAILABILITY',
    code: [
      'app.use(validate(schema))',
      'app.use(requestLogger)',
      '// docker build · ci test · deploy',
    ],
    note: 'Validation, logging, containers and CI/CD\nkeep maintained systems above 99%.',
    source: 'Senior AI & Full Stack Engineer / Devjam',
  }),
  entry({
    dateLabel: '2026 · Devjam',
    title: 'ARCHITECTURE, REVIEWS, RELEASES',
    code: [
      'const decision = tradeoffs(options)',
      'await review.approve(pr)',
      'await release.ship()',
    ],
    note: 'Partnering with product and engineering\non trade-offs, reviews and releases.',
    source: 'Senior AI & Full Stack Engineer / Devjam',
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
