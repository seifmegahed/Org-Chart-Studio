import Link from "next/link";

type DefinitionKey =
  | "node"
  | "depth"
  | "spread"
  | "reparent"
  | "zoom"
  | "print-scale";

function MiniGraphic({ kind }: { kind: DefinitionKey }) {
  if (kind === "node") {
    return (
      <svg
        viewBox="0 0 220 128"
        className="h-32 w-full"
        role="img"
        aria-label="A node card with a role header and two people rows"
      >
        <rect x="40" y="18" width="140" height="92" rx="10" fill="var(--node-bg)" stroke="var(--node-border)" strokeWidth="2" />
        <path d="M50 18H170Q180 18 180 28V48H40V28Q40 18 50 18Z" fill="var(--accent-color)" />
        <text x="110" y="38" textAnchor="middle" fill="#ffffff" fontSize="13" fontWeight="800">Role / Title</text>
        <circle cx="63" cy="68" r="8" fill="var(--accent-color)" fillOpacity="0.18" />
        <circle cx="63" cy="90" r="8" fill="var(--accent-color)" fillOpacity="0.18" />
        <path d="M63 66a3.2 3.2 0 1 0 0-6.4 3.2 3.2 0 0 0 0 6.4Zm-6 8c0-4 12-4 12 0" fill="none" stroke="var(--accent-color)" strokeWidth="1.7" strokeLinecap="round" />
        <path d="M63 88a3.2 3.2 0 1 0 0-6.4 3.2 3.2 0 0 0 0 6.4Zm-6 8c0-4 12-4 12 0" fill="none" stroke="var(--accent-color)" strokeWidth="1.7" strokeLinecap="round" />
        <text x="80" y="72" fill="var(--main-text)" fontSize="12" fontWeight="700">Person One</text>
        <text x="80" y="94" fill="var(--main-text)" fontSize="12" fontWeight="700">Person Two</text>
      </svg>
    );
  }

  if (kind === "depth") {
    return (
      <svg
        viewBox="0 0 220 128"
        className="h-32 w-full"
        role="img"
        aria-label="A three level org chart showing depth"
      >
        <path d="M110 38V58M70 58H150M70 58V76M150 58V76M70 98V110M150 98V110" fill="none" stroke="var(--line-color)" strokeWidth="2.5" strokeLinecap="round" />
        <rect x="72" y="12" width="76" height="26" rx="7" fill="var(--accent-color)" />
        <rect x="34" y="76" width="72" height="24" rx="7" fill="var(--node-bg)" stroke="var(--node-border)" strokeWidth="2" />
        <rect x="114" y="76" width="72" height="24" rx="7" fill="var(--node-bg)" stroke="var(--node-border)" strokeWidth="2" />
        <rect x="35" y="110" width="70" height="12" rx="5" fill="var(--button-muted)" stroke="var(--panel-border)" />
        <rect x="115" y="110" width="70" height="12" rx="5" fill="var(--button-muted)" stroke="var(--panel-border)" />
        <text x="110" y="29" textAnchor="middle" fill="#ffffff" fontSize="11" fontWeight="800">Level 1</text>
        <text x="70" y="92" textAnchor="middle" fill="var(--main-text)" fontSize="10" fontWeight="800">Level 2</text>
        <text x="150" y="92" textAnchor="middle" fill="var(--main-text)" fontSize="10" fontWeight="800">Level 2</text>
        <text x="70" y="120" textAnchor="middle" fill="var(--muted-text)" fontSize="8" fontWeight="700">Level 3</text>
        <text x="150" y="120" textAnchor="middle" fill="var(--muted-text)" fontSize="8" fontWeight="700">Level 3</text>
      </svg>
    );
  }

  if (kind === "spread") {
    return (
      <svg
        viewBox="0 0 220 128"
        className="h-32 w-full"
        role="img"
        aria-label="Spread till keeps early levels horizontal and stacks deeper levels vertically"
      >
        <text x="18" y="18" fill="var(--muted-text)" fontSize="9" fontWeight="800">Spread Till 3</text>
        <path d="M110 34V50M52 50H168M52 50V64M110 50V64M168 50V64" fill="none" stroke="var(--line-color)" strokeWidth="2.3" strokeLinecap="round" />
        <rect x="82" y="18" width="56" height="20" rx="6" fill="var(--accent-color)" />
        <rect x="26" y="64" width="52" height="20" rx="6" fill="var(--node-bg)" stroke="var(--node-border)" strokeWidth="2" />
        <rect x="84" y="64" width="52" height="20" rx="6" fill="var(--node-bg)" stroke="var(--node-border)" strokeWidth="2" />
        <rect x="142" y="64" width="52" height="20" rx="6" fill="var(--node-bg)" stroke="var(--node-border)" strokeWidth="2" />
        <path d="M168 84V101H198" fill="none" stroke="var(--line-color)" strokeWidth="2.3" strokeLinecap="round" />
        <rect x="146" y="96" width="52" height="20" rx="6" fill="var(--button-muted)" stroke="var(--panel-border)" />
        <text x="110" y="31" textAnchor="middle" fill="#ffffff" fontSize="9" fontWeight="800">L1</text>
        <text x="52" y="77" textAnchor="middle" fill="var(--main-text)" fontSize="9" fontWeight="800">L2</text>
        <text x="110" y="77" textAnchor="middle" fill="var(--main-text)" fontSize="9" fontWeight="800">L3</text>
        <text x="168" y="77" textAnchor="middle" fill="var(--main-text)" fontSize="9" fontWeight="800">L3</text>
        <text x="172" y="110" textAnchor="middle" fill="var(--muted-text)" fontSize="8" fontWeight="800">L4 stack</text>
      </svg>
    );
  }

  if (kind === "reparent") {
    return (
      <svg
        viewBox="0 0 220 128"
        className="h-32 w-full"
        role="img"
        aria-label="A node moving from one parent to another"
      >
        <text x="38" y="16" textAnchor="middle" fill="var(--muted-text)" fontSize="9" fontWeight="800">Before</text>
        <text x="182" y="16" textAnchor="middle" fill="var(--muted-text)" fontSize="9" fontWeight="800">After</text>
        <path d="M48 40V58M48 58H82M48 58H14M172 40V58M172 58H206M172 58H138" fill="none" stroke="var(--line-color)" strokeWidth="2.1" strokeLinecap="round" />
        <rect x="24" y="24" width="48" height="20" rx="6" fill="var(--accent-color)" />
        <rect x="148" y="24" width="48" height="20" rx="6" fill="var(--accent-color)" />
        <rect x="2" y="72" width="48" height="20" rx="6" fill="var(--node-bg)" stroke="var(--node-border)" strokeWidth="2" />
        <rect x="64" y="72" width="48" height="20" rx="6" fill="var(--node-bg)" stroke="var(--node-border)" strokeWidth="2" />
        <rect x="126" y="72" width="48" height="20" rx="6" fill="var(--node-bg)" stroke="var(--node-border)" strokeWidth="2" />
        <rect x="188" y="72" width="30" height="20" rx="6" fill="var(--button-muted)" stroke="var(--panel-border)" />
        <path d="M100 64H122" stroke="var(--accent-color)" strokeWidth="2.5" strokeLinecap="round" />
        <path d="M116 58L122 64L116 70" fill="none" stroke="var(--accent-color)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
        <text x="48" y="38" textAnchor="middle" fill="#ffffff" fontSize="9" fontWeight="800">X</text>
        <text x="172" y="38" textAnchor="middle" fill="#ffffff" fontSize="9" fontWeight="800">B</text>
        <text x="26" y="85" textAnchor="middle" fill="var(--main-text)" fontSize="9" fontWeight="800">A</text>
        <text x="88" y="85" textAnchor="middle" fill="var(--main-text)" fontSize="9" fontWeight="800">B</text>
        <text x="150" y="85" textAnchor="middle" fill="var(--main-text)" fontSize="9" fontWeight="800">A</text>
      </svg>
    );
  }

  if (kind === "zoom") {
    return (
      <svg
        viewBox="0 0 220 128"
        className="h-32 w-full"
        role="img"
        aria-label="Three chart cards shown at different zoom levels"
      >
        <rect x="16" y="42" width="38" height="24" rx="6" fill="var(--button-muted)" stroke="var(--panel-border)" />
        <rect x="76" y="36" width="52" height="34" rx="7" fill="var(--node-bg)" stroke="var(--node-border)" strokeWidth="2" />
        <rect x="154" y="28" width="66" height="44" rx="8" fill="var(--node-bg)" stroke="var(--node-border)" strokeWidth="2" />
        <path d="M24 80H46M84 80H120M162 80H212" stroke="var(--line-color)" strokeWidth="2" strokeLinecap="round" />
        <text x="35" y="96" textAnchor="middle" fill="var(--muted-text)" fontSize="10" fontWeight="800">75%</text>
        <text x="102" y="96" textAnchor="middle" fill="var(--muted-text)" fontSize="10" fontWeight="800">100%</text>
        <text x="187" y="96" textAnchor="middle" fill="var(--muted-text)" fontSize="10" fontWeight="800">140%</text>
        <text x="110" y="116" textAnchor="middle" fill="var(--main-text)" fontSize="9" fontWeight="800">editor view only</text>
      </svg>
    );
  }

  return (
    <svg
      viewBox="0 0 220 128"
      className="h-32 w-full"
      role="img"
      aria-label="A paper preview with chart scale fitting inside margins"
    >
      <rect x="55" y="10" width="110" height="104" rx="4" fill="#ffffff" stroke="var(--main-text)" strokeWidth="2" />
      <rect x="68" y="24" width="84" height="76" rx="2" fill="none" stroke="var(--panel-border)" strokeWidth="1.5" strokeDasharray="4 4" />
      <rect x="78" y="44" width="64" height="34" rx="6" fill="var(--button-muted)" stroke="var(--node-border)" strokeWidth="2" />
      <path d="M78 56H142M110 44V30M110 78V93" stroke="var(--line-color)" strokeWidth="2" strokeLinecap="round" />
      <text x="110" y="122" textAnchor="middle" fill="var(--muted-text)" fontSize="10" fontWeight="800">fits selected paper</text>
    </svg>
  );
}

export default function HelpPage() {
  const quickStartSteps = [
    "Create a new project from the home screen.",
    "Rename the project in the top bar.",
    "Edit the root node title and name directly in the chart.",
    "Add children from the node menu (right-click or three-dot button).",
    "Tune layout using Spread Till, font sizes, and zoom.",
    "Open Print Setup, preview, then print/export to PDF.",
  ];

  const commonTasks = [
    {
      title: "Add another person in the same node",
      steps:
        "In a name field, press Shift+Enter to insert a new person line below.",
    },
    {
      title: "Move a node under a different parent",
      steps:
        "Open source node menu, choose Select New Parent, then open target node menu and choose Move Selected Node Here.",
    },
    {
      title: "Reorder siblings",
      steps:
        "Open node menu and use Move Left/Right (or Move Up/Down for deeper vertical levels).",
    },
    {
      title: "Duplicate a team branch",
      steps:
        "Open node menu and choose Duplicate. Child hierarchy is copied as well.",
    },
    {
      title: "Delete safely",
      steps:
        "Deleting prompts only when the node has children. Leaf nodes delete immediately.",
    },
  ];

  const printTips = [
    "Use Print Setup to pick paper size and orientation.",
    "Scale mode Fit usually avoids clipping; use custom scale for exact sizing.",
    "Use horizontal/vertical position controls to center or align on page.",
    "Legend and project print settings are saved per project.",
  ];

  const faq = [
    {
      q: "Where is my data stored?",
      a: "Projects are stored in your browser local storage and in exported JSON files when you export.",
    },
    {
      q: "Can I move projects between devices?",
      a: "Yes. Export as JSON on one device and import the file on another.",
    },
    {
      q: "Do zoom, print, and font settings persist?",
      a: "Yes. These settings are saved per project and included in exported JSON.",
    },
    {
      q: "How do I access node actions on touch devices?",
      a: "Use the three-dot menu button shown on each node header.",
    },
  ];

  const definitions: Array<{
    key: DefinitionKey;
    term: string;
    description: string;
  }> = [
    {
      key: "node",
      term: "Node",
      description:
        "A single card in the chart representing a role and one or more people.",
    },
    {
      key: "depth",
      term: "Depth (Level)",
      description:
        "How far a node is from the root. Root is level 1, children are level 2, and so on.",
    },
    {
      key: "spread",
      term: "Spread Till",
      description:
        "Controls how many top levels stay horizontally spread before deeper levels switch to vertical stacking.",
    },
    {
      key: "reparent",
      term: "Re-parenting",
      description:
        "Moving a node (and its descendants) from its current parent to a new parent node.",
    },
    {
      key: "zoom",
      term: "Zoom",
      description:
        "Changes how large the chart appears in the editor view. It does not change chart data.",
    },
    {
      key: "print-scale",
      term: "Print Scale",
      description:
        "Controls the chart size during printing. Use Fit modes to avoid clipping on the selected paper.",
    },
  ];

  return (
    <main data-theme="ocean" className="app-shell min-h-screen p-5 md:p-8">
      <div className="mx-auto max-w-4xl rounded-2xl border border-[--panel-border] bg-[--panel-bg] p-6 shadow-sm md:p-8">
        <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="mb-2 text-xs font-semibold uppercase tracking-[0.16em] text-[--muted-text]">
              INP Org Chart Studio
            </p>
            <h1 className="text-3xl font-bold text-[--main-text] md:text-4xl">
              Help
            </h1>
          </div>
          <Link
            href="/"
            className="inline-flex h-10 items-center justify-center rounded-lg border border-[--panel-border] bg-white px-4 text-sm font-semibold text-[--main-text] transition-colors hover:bg-[--button-muted]"
          >
            Back To Studio
          </Link>
        </div>

        <div className="grid gap-5 text-sm leading-7 text-[--main-text]">
          <section className="rounded-xl border border-[--panel-border] bg-white/80 p-4">
            <h2 className="text-base font-bold">Definitions</h2>
            <div className="mt-2 grid gap-3 md:grid-cols-2">
              {definitions.map((item) => (
                <article
                  key={item.key}
                  className="grid gap-3 rounded-lg border border-[--panel-border] bg-white p-3"
                >
                  <div className="rounded-lg border border-[--panel-border] bg-[--button-muted] px-2 py-1">
                    <MiniGraphic kind={item.key} />
                  </div>
                  <h3 className="text-sm font-semibold text-[--main-text]">
                    {item.term}
                  </h3>
                  <p className="text-sm text-[--muted-text]">{item.description}</p>
                </article>
              ))}
            </div>
          </section>

          <section className="rounded-xl border border-[--panel-border] bg-white/80 p-4">
            <h2 className="text-base font-bold">Quick Start</h2>
            <ol className="mt-2 list-decimal space-y-1 pl-5 text-[--muted-text]">
              {quickStartSteps.map((step) => (
                <li key={step}>{step}</li>
              ))}
            </ol>
          </section>

          <section className="rounded-xl border border-[--panel-border] bg-white/80 p-4">
            <h2 className="text-base font-bold">Common Tasks</h2>
            <div className="mt-2 grid gap-3">
              {commonTasks.map((task) => (
                <article
                  key={task.title}
                  className="rounded-lg border border-[--panel-border] bg-white p-3"
                >
                  <h3 className="text-sm font-semibold text-[--main-text]">
                    {task.title}
                  </h3>
                  <p className="mt-1 text-sm text-[--muted-text]">{task.steps}</p>
                </article>
              ))}
            </div>
          </section>

          <section className="rounded-xl border border-[--panel-border] bg-white/80 p-4">
            <h2 className="text-base font-bold">Print And PDF Tips</h2>
            <ul className="mt-2 list-disc space-y-1 pl-5 text-[--muted-text]">
              {printTips.map((tip) => (
                <li key={tip}>{tip}</li>
              ))}
            </ul>
          </section>

          <section className="rounded-xl border border-[--panel-border] bg-white/80 p-4">
            <h2 className="text-base font-bold">FAQ</h2>
            <div className="mt-2 grid gap-2">
              {faq.map((item) => (
                <details
                  key={item.q}
                  className="rounded-lg border border-[--panel-border] bg-white px-3 py-2"
                >
                  <summary className="cursor-pointer text-sm font-semibold text-[--main-text]">
                    {item.q}
                  </summary>
                  <p className="mt-2 text-sm text-[--muted-text]">{item.a}</p>
                </details>
              ))}
            </div>
          </section>

          <section className="rounded-xl border border-[--panel-border] bg-white/80 p-4">
            <h2 className="text-base font-bold">Need A Safe Reset?</h2>
            <p className="mt-1 text-[--muted-text]">
              Export your projects first. Then clear browser site data/local
              storage if you need a clean state.
            </p>
          </section>
        </div>
      </div>
    </main>
  );
}
