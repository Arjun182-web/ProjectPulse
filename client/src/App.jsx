import { useEffect, useRef, useState } from "react";
import {
  Activity,
  Bell,
  CheckCircle2,
  ChevronDown,
  Clock3,
  FileText,
  LayoutDashboard,
  MessageSquareText,
  Mic,
  Plus,
  Search,
  Settings,
  Sparkles,
  Users,
  AlertTriangle,
  ArrowUpRight,
} from "lucide-react";




function App() {
  const [message, setMessage] = useState("");

  const [analysis, setAnalysis] = useState(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisError, setAnalysisError] = useState("");

  const [isListening, setIsListening] = useState(false);
  const [voiceError, setVoiceError] = useState("");

  const recognitionRef = useRef(null);

  const [activePage, setActivePage] = useState("overview");
  const [projectMemory, setProjectMemory] = useState([]);
  const [memoryLoading, setMemoryLoading] = useState(false);

  const [projectCommand, setProjectCommand] = useState("");
  const [commandResponse, setCommandResponse] = useState("");

  const [isCommandListening, setIsCommandListening] = useState(false);
  const [commandVoiceError, setCommandVoiceError] = useState("");

const commandRecognitionRef = useRef(null);

  const stats = [
  {
    label: "Open Actions",
    value: analysis
      ? analysis.actions.filter(
          (action) => action.status?.toLowerCase() !== "completed"
        ).length
      : 0,
    change: analysis ? "From latest analysis" : "Awaiting analysis",
    icon: CheckCircle2,
  },
  {
    label: "Decisions",
    value: analysis ? analysis.decisions.length : 0,
    change: analysis ? "Extracted from communication" : "Awaiting analysis",
    icon: Clock3,
  },
  {
    label: "Stakeholders",
    value: analysis ? analysis.stakeholders.length : 0,
    change: analysis ? "Identified in communication" : "Awaiting analysis",
    icon: Users,
  },
  {
    label: "Active Alerts",
    value: analysis ? analysis.alerts.length : 0,
    change: analysis
      ? analysis.alerts.length > 0
        ? "Needs attention"
        : "No active alerts"
      : "Awaiting analysis",
    icon: AlertTriangle,
  },
];


const extractedItems = analysis
  ? [
      ...analysis.decisions.map((decision) => ({
        type: "Decision",
        title: decision.text,
        source: decision.source || "Project communication",
        time: "Just now",
        icon: CheckCircle2,
      })),

      ...analysis.actions.map((action) => ({
        type: "Action",
        title: action.task,
        source: action.responsible || "Unassigned",
        time: "Just now",
        icon: FileText,
      })),

      ...analysis.deadlines.map((deadline) => ({
        type: "Deadline",
        title: deadline.item,
        source: "Project communication",
        time: "Just now",
        icon: Clock3,
      })),
    ].slice(0, 3)
  : [];

    const formatActivityTime = (createdAt) => {
    if (!createdAt) return "Recently";

    const diff = Date.now() - new Date(createdAt).getTime();
    const minutes = Math.floor(diff / 60000);

    if (minutes < 1) return "Just now";
    if (minutes < 60) return `${minutes} min ago`;

    const hours = Math.floor(minutes / 60);

    if (hours < 24) return `${hours} hr ago`;

    const days = Math.floor(hours / 24);

    return `${days} day${days !== 1 ? "s" : ""} ago`;
  };

  const activities = projectMemory
    .flatMap((entry) => {
      const createdAt = entry.createdAt;

      const decisionActivities = (entry.decisions || []).map(
        (decision, index) => ({
          id: `${entry.id}-decision-${index}`,
          name: decision.source || "Project communication",
          action: `decision recorded: ${decision.text}`,
          time: formatActivityTime(createdAt),
          createdAt,
        })
      );

      const actionActivities = (entry.actions || []).map(
        (action, index) => ({
          id: `${entry.id}-action-${index}`,
          name: action.responsible || "Unassigned",
          action: `action identified: ${action.task}`,
          time: formatActivityTime(createdAt),
          createdAt,
        })
      );

      return [...decisionActivities, ...actionActivities];
    })
    .sort(
      (a, b) =>
        new Date(b.createdAt).getTime() -
        new Date(a.createdAt).getTime()
    )
    .slice(0, 5);

  const handleAnalyze = async () => {
  if (!message.trim()) return;

  setIsAnalyzing(true);
  setAnalysisError("");
  setAnalysis(null);

  try {
    const response = await fetch("http://projectpulse-gmni.onrender.com/api/analyze", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        message,
      }),
    });

    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.error || "Analysis failed");
    }

    setAnalysis(result.data);
    setProjectMemory((prev) => [result.data, ...prev]);
  } catch (error) {
    console.error(error);
    setAnalysisError(error.message);
  } finally {
    setIsAnalyzing(false);
  }
};

const handleVoiceInput = () => {
  const SpeechRecognition =
    window.SpeechRecognition || window.webkitSpeechRecognition;

  if (!SpeechRecognition) {
    setVoiceError(
      "Voice input is not supported in this browser. Please use Google Chrome."
    );
    return;
  }

  if (isListening) {
    recognitionRef.current?.stop();
    return;
  }

  setVoiceError("");

  const recognition = new SpeechRecognition();

  recognition.lang = "en-IN";
  recognition.continuous = false;
  recognition.interimResults = false;

  recognition.onstart = () => {
    setIsListening(true);
  };

  recognition.onresult = (event) => {
    const transcript = event.results[0][0].transcript;

    setMessage((previous) => {
      if (!previous.trim()) {
        return transcript;
      }

      return `${previous.trim()} ${transcript}`;
    });
  };

  recognition.onerror = (event) => {
    console.error("Voice recognition error:", event.error);

    if (event.error === "not-allowed") {
      setVoiceError(
        "Microphone permission was blocked. Please allow microphone access in Chrome."
      );
    } else {
      setVoiceError("Could not understand the voice input. Please try again.");
    }

    setIsListening(false);
  };

  recognition.onend = () => {
    setIsListening(false);
  };

  recognitionRef.current = recognition;

  recognition.start();
};

const handleProjectCommandFromText = (text) => {
  const command = text.toLowerCase().trim();

  if (!command) return;

  const actions = projectMemory.flatMap(
    (entry) => entry.actions || []
  );

  const decisions = projectMemory.flatMap(
    (entry) => entry.decisions || []
  );

  const stakeholders = projectMemory.flatMap(
    (entry) => entry.stakeholders || []
  );

  const deadlines = projectMemory.flatMap(
    (entry) => entry.deadlines || []
  );

  // Remove duplicate actions from repeated analyses
  const uniqueActions = Array.from(
    new Map(
      actions.map((action) => [
        `${action.task}|${action.responsible}|${action.deadline}`,
        action,
      ])
    ).values()
  );

  const blockedActions = uniqueActions.filter(
    (action) => action.status?.toLowerCase() === "blocked"
  );

  const pendingActions = uniqueActions.filter(
    (action) => action.status?.toLowerCase() !== "completed"
  );

  // --------------------------------------------------
  // 1. RESPONSIBILITY / "WHO HANDLES..." QUESTIONS
  // --------------------------------------------------

  const isResponsibilityQuestion =
    command.includes("who") &&
    (
      command.includes("responsible") ||
      command.includes("handles") ||
      command.includes("handle") ||
      command.includes("assigned") ||
      command.includes("will") ||
      command.includes("should")
    );

  if (isResponsibilityQuestion) {
    if (uniqueActions.length === 0) {
      setCommandResponse(
        "No project responsibilities have been recorded yet."
      );
      return;
    }

    // Try to identify the specific task being asked about
    const ignoredWords = [
      "who",
      "is",
      "are",
      "the",
      "for",
      "responsible",
      "handles",
      "handle",
      "assigned",
      "will",
      "issue",
      "do",
      "should",
      "be",
      "project",
      "action",
      "actions",
      "work",
      "task",
      "tasks",
      "person",
      "people",
      "in",
      "of",
      "my",
      "this",
      "that",
    ];

    const queryWords = command
      .replace(/[?.,!]/g, "")
      .split(/\s+/)
      .filter(
        (word) =>
          word.length > 2 &&
          !ignoredWords.includes(word)
      );

    const matchingActions = uniqueActions.filter((action) => {
      const taskText = (action.task || "").toLowerCase();

      return queryWords.some((word) =>
        taskText.includes(word)
      );
    });

    // Specific responsibility found
    if (matchingActions.length > 0) {
      const responsibilityList = matchingActions
        .slice(0, 5)
        .map(
          (action) =>
            `• ${action.task} — ${
              action.responsible || "Unassigned"
            }`
        )
        .join("\n");

      setCommandResponse(
        `👤 Responsibilities:\n${responsibilityList}`
      );

      return;
    }

    // General responsibility question
    const responsibilityList = uniqueActions
      .slice(0, 8)
      .map(
        (action) =>
          `• ${action.task} — ${
            action.responsible || "Unassigned"
          }`
      )
      .join("\n");

    setCommandResponse(
      `👤 Project responsibilities:\n${responsibilityList}`
    );

    return;
  }

  // --------------------------------------------------
  // 2. BLOCKED WORK
  // --------------------------------------------------

  if (
    command.includes("blocked") ||
    command.includes("blocking") ||
    command.includes("waiting")
  ) {
    if (blockedActions.length === 0) {
      setCommandResponse(
        "There are currently no blocked actions in the project."
      );
      return;
    }

    const blocked = blockedActions
      .slice(0, 5)
      .map(
        (action) =>
          `• ${action.task} — Responsible: ${
            action.responsible || "Unassigned"
          }`
      )
      .join("\n");

    setCommandResponse(
      `🔴 Blocked work:\n${blocked}`
    );

    return;
  }

  // --------------------------------------------------
  // 3. OPEN ACTIONS
  // --------------------------------------------------

  if (
    command.includes("action") ||
    command.includes("task") ||
    command.includes("todo")
  ) {
    if (pendingActions.length === 0) {
      setCommandResponse(
        "There are currently no open actions."
      );
      return;
    }

    const actionList = pendingActions
      .slice(0, 5)
      .map(
        (action) =>
          `• ${action.task} — ${
            action.responsible || "Unassigned"
          }`
      )
      .join("\n");

    setCommandResponse(
      `📋 Open actions:\n${actionList}`
    );

    return;
  }

  // --------------------------------------------------
  // 4. DECISIONS
  // --------------------------------------------------

  if (
    command.includes("decision") ||
    command.includes("decisions")
  ) {
    if (decisions.length === 0) {
      setCommandResponse(
        "No project decisions have been recorded yet."
      );
      return;
    }

    const uniqueDecisions = Array.from(
      new Map(
        decisions.map((decision) => [
          decision.text,
          decision,
        ])
      ).values()
    );

    const decisionList = uniqueDecisions
      .slice(0, 5)
      .map(
        (decision) =>
          `• ${decision.text}`
      )
      .join("\n");

    setCommandResponse(
      `✅ Recent decisions:\n${decisionList}`
    );

    return;
  }

  // --------------------------------------------------
  // 5. STAKEHOLDERS
  // --------------------------------------------------

  if (
    command.includes("stakeholder") ||
    command.includes("stakeholders") ||
    command.includes("people")
  ) {
    if (stakeholders.length === 0) {
      setCommandResponse(
        "No stakeholders have been identified yet."
      );
      return;
    }

    const uniqueStakeholders = Array.from(
      new Map(
        stakeholders.map((person) => [
          `${person.name}|${person.role}`,
          person,
        ])
      ).values()
    );

    const people = uniqueStakeholders
      .slice(0, 8)
      .map(
        (person) =>
          `• ${person.name || "Unknown"} — ${
            person.role || "Role not specified"
          }`
      )
      .join("\n");

    setCommandResponse(
      `👥 Project stakeholders:\n${people}`
    );

    return;
  }

  // --------------------------------------------------
  // 6. DEADLINES
  // --------------------------------------------------

  if (
    command.includes("deadline") ||
    command.includes("deadlines") ||
    command.includes("due") ||
    command.includes("upcoming")
  ) {
    if (deadlines.length === 0) {
      setCommandResponse(
        "There are currently no recorded deadlines."
      );
      return;
    }

    const uniqueDeadlines = Array.from(
      new Map(
        deadlines.map((deadline) => [
          `${deadline.item}|${deadline.deadline}`,
          deadline,
        ])
      ).values()
    );

    const deadlineList = uniqueDeadlines
      .slice(0, 8)
      .map(
        (deadline) =>
          `• ${deadline.item} — Due ${deadline.deadline}`
      )
      .join("\n");

    setCommandResponse(
      `⏰ Upcoming deadlines:\n${deadlineList}`
    );

    return;
  }

  // --------------------------------------------------
  // 7. FALLBACK
  // --------------------------------------------------

  setCommandResponse(
    "I can help with blocked work, actions, decisions, stakeholders, responsibilities, and deadlines. Try asking: “Who handles fabrication?”"
  );
};

const handleProjectCommand = () => {
  handleProjectCommandFromText(projectCommand);
};


const handleProjectCommandVoiceInput = () => {
  const SpeechRecognition =
    window.SpeechRecognition || window.webkitSpeechRecognition;

  if (!SpeechRecognition) {
    setCommandVoiceError(
      "Voice commands are not supported in this browser. Please use Google Chrome."
    );
    return;
  }

  if (isCommandListening) {
    commandRecognitionRef.current?.stop();
    return;
  }

  setCommandVoiceError("");

  const recognition = new SpeechRecognition();

  recognition.lang = "en-IN";
  recognition.continuous = false;
  recognition.interimResults = false;

  recognition.onstart = () => {
    setIsCommandListening(true);
  };

  recognition.onresult = (event) => {
    const transcript = event.results[0][0].transcript.trim();

    setProjectCommand(transcript);

    // Automatically process the voice command
    setTimeout(() => {
      handleProjectCommandFromText(transcript);
    }, 100);
  };

  recognition.onerror = (event) => {
    console.error("Project command voice error:", event.error);

    if (event.error === "not-allowed") {
      setCommandVoiceError(
        "Microphone permission was blocked. Please allow microphone access in Chrome."
      );
    } else if (event.error === "no-speech") {
      setCommandVoiceError(
        "No speech detected. Please speak your project question."
      );
    } else {
      setCommandVoiceError(
        "Could not understand the command. Please try again."
      );
    }

    setIsCommandListening(false);
  };

  recognition.onend = () => {
    setIsCommandListening(false);
  };

  commandRecognitionRef.current = recognition;

  recognition.start();
};

  const [apiStatus, setApiStatus] = useState("Checking backend...");

useEffect(() => {
  fetch("http://projectpulse-gmni.onrender.com/api/health")
    .then((response) => response.json())
    .then((data) => {
      setApiStatus(
        data.status === "ok" ? "Backend connected" : "Backend unavailable"
      );
    })
    .catch(() => {
      setApiStatus("Backend unavailable");
    });
}, []);

useEffect(() => {
  const loadProjectMemory = async () => {
    setMemoryLoading(true);

    try {
      const response = await fetch(
        "https://projectpulse-gmni.onrender.com/api/analyze/memory"
      );

      const result = await response.json();

      if (!response.ok) {
  throw new Error(
    result.error || "Failed to load project memory"
  );
}

setProjectMemory(result.data || []);

if (result.data && result.data.length > 0) {
  setAnalysis(result.data[0]);
}
    } catch (error) {
      console.error("Memory loading error:", error);
    } finally {
      setMemoryLoading(false);
    }
  };

  loadProjectMemory();
}, []);
    
  return (
    <div className="min-h-screen bg-[#f7f7f5] text-[#171717]">
      {/* Sidebar */}
      <aside className="fixed left-0 top-0 z-20 flex h-screen w-64 flex-col border-r border-black/10 bg-white">
        <div className="flex h-20 items-center gap-3 border-b border-black/10 px-6">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-black text-white">
            <Sparkles size={20} />
          </div>

          <div>
            <h1 className="text-lg font-semibold tracking-tight">
              ProjectPulse
            </h1>
            <p className="text-xs text-gray-500">Project Intelligence</p>
          </div>
        </div>

        <nav className="flex-1 space-y-1 px-3 py-6">
          <NavItem
  icon={<LayoutDashboard size={18} />}
  label="Overview"
  active={activePage === "overview"}
  onClick={() => setActivePage("overview")}
/>

          <NavItem
  icon={<MessageSquareText size={18} />}
  label="Communication"
  active={activePage === "communication"}
  onClick={() => setActivePage("communication")}
/>

          <NavItem
  icon={<CheckCircle2 size={18} />}
  label="Actions"
  badge={
  projectMemory.reduce(
    (total, entry) => total + (entry.actions?.length || 0),
    0
  )
}
  active={activePage === "actions"}
  onClick={() => setActivePage("actions")}
/>

          <NavItem
  icon={<Users size={18} />}
  label="Stakeholders"
  active={activePage === "stakeholders"}
  onClick={() => setActivePage("stakeholders")}
/>

          <NavItem
  icon={<Activity size={18} />}
  label="Coordination"
  active={activePage === "coordination"}
  onClick={() => setActivePage("coordination")}
/>

          <NavItem
  icon={<FileText size={18} />}
  label="Project Memory"
  active={activePage === "memory"}
  onClick={() => setActivePage("memory")}
/>

          <div className="my-5 border-t border-black/10" />

          <NavItem icon={<Settings size={18} />} label="Settings" />
        </nav>

        <div className="border-t border-black/10 p-4">
          <div className="flex items-center gap-3 rounded-xl bg-[#f5f5f3] p-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-black text-sm font-medium text-white">
              A
            </div>

            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium">Project Manager</p>
              <p className="truncate text-xs text-gray-500">
                Riverside Residence
              </p>
            </div>

            <ChevronDown size={15} className="text-gray-400" />
          </div>
        </div>
      </aside>

      {/* Main */}
      <main className="ml-64 min-h-screen">
        {/* Header */}
        <header className="flex h-20 items-center justify-between border-b border-black/10 bg-white px-8">
          <div>
            <p className="text-sm text-gray-500">Project</p>

            <button className="mt-0.5 flex items-center gap-2 text-lg font-semibold">
              Riverside Residence
              <ChevronDown size={17} className="text-gray-400" />
            </button>
          </div>

          <div className="flex items-center gap-3">
            <button className="flex h-10 w-10 items-center justify-center rounded-xl border border-black/10 bg-white text-gray-600 transition hover:bg-gray-50">
              <Search size={18} />
            </button>

            <button className="relative flex h-10 w-10 items-center justify-center rounded-xl border border-black/10 bg-white text-gray-600 transition hover:bg-gray-50">
              <Bell size={18} />

              <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-red-500" />
            </button>

            <button className="flex items-center gap-2 rounded-xl bg-black px-4 py-2.5 text-sm font-medium text-white transition hover:bg-gray-800">
              <Plus size={17} />
              New Update
            </button>
          </div>
        </header>

        <div className="space-y-8 p-8">
          {activePage === "memory" ? (
  <ProjectMemoryPage
    memory={projectMemory}
    loading={memoryLoading}
  />
) : activePage === "actions" ? (
  <ActionsPage
    memory={projectMemory}
    loading={memoryLoading}
  />
) : activePage === "stakeholders" ? (
  <StakeholdersPage
    memory={projectMemory}
    loading={memoryLoading}
  />
) : activePage === "coordination" ? (
  <CoordinationPage
    memory={projectMemory}
    loading={memoryLoading}
  />
) : (
  <>
          {/* Page heading */}
          <section className="flex items-end justify-between">
            <div>
              <p className="mb-2 text-sm font-medium text-gray-500">
                Friday, September 11
              </p>

              <h2 className="text-3xl font-semibold tracking-tight">
                Good morning 👋
              </h2>

              <p className="mt-2 text-gray-500">
                Here's what needs your attention today.
              </p>
            </div>

            <div className="rounded-xl border border-black/10 bg-white px-4 py-3">
              <div className="flex items-center gap-2 text-sm">
                <div className="h-2 w-2 rounded-full bg-green-500" />
                Project status
                <span className="font-semibold">{apiStatus}</span>
              </div>
            </div>
          </section>

          {/* Stats */}
          <section className="grid grid-cols-4 gap-4">
            {stats.map((stat) => {
              const Icon = stat.icon;

              return (
                <div
                  key={stat.label}
                  className="rounded-2xl border border-black/10 bg-white p-5"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#f4f4f1]">
                      <Icon size={19} />
                    </div>

                    <ArrowUpRight size={17} className="text-gray-400" />
                  </div>

                  <p className="mt-5 text-sm text-gray-500">{stat.label}</p>

                  <div className="mt-1 flex items-end gap-3">
                    <span className="text-3xl font-semibold tracking-tight">
                      {stat.value}
                    </span>

                    <span className="mb-1 text-xs text-gray-500">
                      {stat.change}
                    </span>
                  </div>
                </div>
              );
            })}
          </section>

          {/* Communication input */}
          <section className="rounded-2xl border border-black/10 bg-white p-6">
            <div className="flex items-start justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-black text-white">
                    <Sparkles size={17} />
                  </div>

                  <h3 className="font-semibold">
                    Turn communication into action
                  </h3>
                </div>

                <p className="mt-2 max-w-2xl text-sm text-gray-500">
                  Paste a project conversation, meeting note or site update.
                  ProjectPulse will identify decisions, actions, people and
                  deadlines.
                </p>
              </div>

              <span className="rounded-full bg-[#f3f3ef] px-3 py-1 text-xs font-medium text-gray-600">
                AI enabled
              </span>
            </div>

            <div className="mt-5 rounded-xl border border-black/10 bg-[#fafaf8] p-3">
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Paste a project conversation here..."
                className="min-h-28 w-full resize-none bg-transparent p-2 text-sm outline-none placeholder:text-gray-400"
              />

              {isListening && (
  <div className="mb-3 flex items-center gap-2 rounded-lg bg-red-50 px-3 py-2 text-xs text-red-600">
    <span className="h-2 w-2 animate-pulse rounded-full bg-red-500" />
    Listening... Speak your project update
  </div>
)}

{voiceError && (
  <div className="mb-3 rounded-lg bg-red-50 px-3 py-2 text-xs text-red-600">
    {voiceError}
  </div>
)}

              <div className="flex items-center justify-between border-t border-black/10 pt-3">
                <button className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-gray-500 transition hover:bg-white">
                  <FileText size={16} />
                  Add file
                </button>

                <div className="flex items-center gap-2">
                  <button
  onClick={handleVoiceInput}
  title={isListening ? "Stop listening" : "Speak project update"}
  className={`flex h-9 w-9 items-center justify-center rounded-lg border transition ${
    isListening
      ? "border-red-200 bg-red-50 text-red-600"
      : "border-black/10 bg-white text-gray-600 hover:bg-gray-50"
  }`}
>
  <Mic size={17} />
</button>

                  <button
  onClick={handleAnalyze}
  disabled={!message.trim() || isAnalyzing}
  className="rounded-lg bg-black px-4 py-2 text-sm font-medium text-white transition hover:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-30"
>
  {isAnalyzing ? "Analyzing..." : "Analyze communication"}
</button>
                </div>
              </div>
            </div>
          </section>
            
          {/* Analysis results */}
{analysis && (
  <section className="rounded-2xl border border-black/10 bg-white p-6">
    <div className="flex items-start justify-between">
      <div>
        <div className="flex items-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-black text-white">
            <Sparkles size={17} />
          </div>

          <h3 className="font-semibold">Extracted project intelligence</h3>
        </div>

        <p className="mt-2 text-sm text-gray-500">
          ProjectPulse identified the following information from your
          communication.
        </p>
      </div>

      <span className="rounded-full bg-green-50 px-3 py-1 text-xs font-medium text-green-700">
        Analysis complete
      </span>
    </div>

    {/* Summary */}
    <div className="mt-6 rounded-xl bg-[#f7f7f5] p-5">
      <p className="text-xs font-medium uppercase tracking-wide text-gray-400">
        Summary
      </p>

      <p className="mt-2 text-sm leading-6 text-gray-700">
        {analysis.summary}
      </p>
    </div>

    {/* Intelligence cards */}
    <div className="mt-5 grid grid-cols-3 gap-4">
      {/* Decisions */}
      <div className="rounded-xl border border-black/10 p-4">
        <div className="flex items-center justify-between">
          <h4 className="text-sm font-semibold">Decisions</h4>
          <CheckCircle2 size={17} />
        </div>

        <div className="mt-4 space-y-3">
          {analysis.decisions.map((decision, index) => (
            <div key={index} className="rounded-lg bg-[#f7f7f5] p-3">
              <p className="text-sm font-medium">{decision.text}</p>
              <p className="mt-1 text-xs text-gray-500">
                Source: {decision.source}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Actions */}
      <div className="rounded-xl border border-black/10 p-4">
        <div className="flex items-center justify-between">
          <h4 className="text-sm font-semibold">Actions</h4>
          <CheckCircle2 size={17} />
        </div>

        <div className="mt-4 space-y-3">
          {analysis.actions.map((action, index) => (
            <div key={index} className="rounded-lg bg-[#f7f7f5] p-3">
              <p className="text-sm font-medium">{action.task}</p>

              <p className="mt-2 text-xs text-gray-500">
                {action.responsible} · {action.deadline}
              </p>

              <span className="mt-2 inline-block rounded-full bg-white px-2 py-1 text-[11px] font-medium">
                {action.status}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Deadlines */}
      <div className="rounded-xl border border-black/10 p-4">
        <div className="flex items-center justify-between">
          <h4 className="text-sm font-semibold">Deadlines</h4>
          <Clock3 size={17} />
        </div>

        <div className="mt-4 space-y-3">
          {analysis.deadlines.map((deadline, index) => (
            <div key={index} className="rounded-lg bg-[#f7f7f5] p-3">
              <p className="text-sm font-medium">{deadline.item}</p>

              <p className="mt-1 text-xs text-gray-500">
                Due {deadline.deadline}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>

    {/* Dependencies */}
    <div className="mt-5 rounded-xl border border-black/10 p-4">
      <div className="flex items-center gap-2">
        <Activity size={17} />
        <h4 className="text-sm font-semibold">Dependencies</h4>
      </div>

      <div className="mt-4 space-y-3">
        {analysis.dependencies.map((dependency, index) => (
          <div
            key={index}
            className="flex items-center gap-3 rounded-lg bg-[#f7f7f5] p-3"
          >
            <span className="text-sm font-medium">
              {dependency.from}
            </span>

            <ArrowUpRight size={15} className="text-gray-400" />

            <span className="text-sm font-medium">
              {dependency.to}
            </span>

            <span className="ml-auto text-xs text-gray-500">
              {dependency.reason}
            </span>
          </div>
        ))}
      </div>
    </div>
  </section>
)}

{analysisError && (
  <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
    {analysisError}
  </div>
)}

{/* Talk to your project */}
<section className="rounded-2xl border border-black/10 bg-white p-6">
  <div className="flex items-start justify-between">
    <div>
      <div className="flex items-center gap-2">
        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-black text-white">
          <Sparkles size={17} />
        </div>

        <h3 className="font-semibold">
          Talk to your project
        </h3>
      </div>

      <p className="mt-2 max-w-2xl text-sm text-gray-500">
        Ask ProjectPulse about actions, blocked work, decisions,
        stakeholders or deadlines.
      </p>
    </div>

    <span className="rounded-full bg-[#f3f3ef] px-3 py-1 text-xs font-medium text-gray-600">
      Project intelligence
    </span>
  </div>

  {/* Command input */}
  <div className="mt-5 rounded-xl border border-black/10 bg-[#fafaf8] p-3">

    <textarea
      value={projectCommand}
      onChange={(e) => setProjectCommand(e.target.value)}
      onKeyDown={(e) => {
        if (e.key === "Enter" && !e.shiftKey) {
          e.preventDefault();

          if (projectCommand.trim()) {
            handleProjectCommand();
          }
        }
      }}
      placeholder="Ask your project anything..."
      className="min-h-20 w-full resize-none bg-transparent p-2 text-sm outline-none placeholder:text-gray-400"
    />

    {isCommandListening && (
      <div className="mb-3 flex items-center gap-2 rounded-lg bg-red-50 px-3 py-2 text-xs text-red-600">
        <span className="h-2 w-2 animate-pulse rounded-full bg-red-500" />
        Listening... Ask your project a question
      </div>
    )}

    {commandVoiceError && (
      <div className="mb-3 rounded-lg bg-red-50 px-3 py-2 text-xs text-red-600">
        {commandVoiceError}
      </div>
    )}

    <div className="flex items-center justify-between border-t border-black/10 pt-3">

      <div className="flex flex-wrap gap-2">
        <button
          onClick={() => {
            setProjectCommand("What actions are blocked?");
            setCommandResponse("");
          }}
          className="rounded-lg bg-white px-3 py-2 text-xs text-gray-600 border border-black/10 transition hover:bg-gray-50"
        >
          Blocked work
        </button>

        <button
          onClick={() => {
            setProjectCommand("What are the upcoming deadlines?");
            setCommandResponse("");
          }}
          className="rounded-lg bg-white px-3 py-2 text-xs text-gray-600 border border-black/10 transition hover:bg-gray-50"
        >
          Deadlines
        </button>

        <button
          onClick={() => {
            setProjectCommand("Who is responsible for the project actions?");
            setCommandResponse("");
          }}
          className="rounded-lg bg-white px-3 py-2 text-xs text-gray-600 border border-black/10 transition hover:bg-gray-50"
        >
          Responsibilities
        </button>
      </div>

      <div className="ml-3 flex shrink-0 items-center gap-2">

        <button
          onClick={handleProjectCommandVoiceInput}
          title={
            isCommandListening
              ? "Stop listening"
              : "Ask by voice"
          }
          className={`flex h-9 w-9 items-center justify-center rounded-lg border transition ${
            isCommandListening
              ? "border-red-200 bg-red-50 text-red-600"
              : "border-black/10 bg-white text-gray-600 hover:bg-gray-50"
          }`}
        >
          <Mic size={17} />
        </button>

        <button
          onClick={handleProjectCommand}
          disabled={!projectCommand.trim()}
          className="rounded-lg bg-black px-4 py-2 text-sm font-medium text-white transition hover:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-30"
        >
          Ask ProjectPulse
        </button>

      </div>
    </div>
  </div>

  {/* Command response */}
  {commandResponse && (
    <div className="mt-4 rounded-xl border border-black/10 bg-[#f7f7f5] p-5">
      <div className="flex items-center gap-2">
        <Sparkles size={16} />
        <p className="text-sm font-semibold">
          ProjectPulse
        </p>
      </div>

      <p className="mt-3 whitespace-pre-line text-sm leading-6 text-gray-700">
        {commandResponse}
      </p>
    </div>
  )}
</section>
          {/* Lower content */}
          <section className="grid grid-cols-5 gap-6">
            {/* Extracted intelligence */}
            <div className="col-span-3 rounded-2xl border border-black/10 bg-white">
              <div className="flex items-center justify-between border-b border-black/10 px-6 py-5">
                <div>
                  <h3 className="font-semibold">Recent project intelligence</h3>
                  <p className="mt-1 text-xs text-gray-500">
                    Information extracted from project communication
                  </p>
                </div>

                <button className="text-sm font-medium text-gray-500 hover:text-black">
                  View all
                </button>
              </div>

              <div className="divide-y divide-black/10">
                {extractedItems.map((item) => {
                  const Icon = item.icon;

                  return (
                    <div
                      key={item.title}
                      className="flex items-center gap-4 px-6 py-5"
                    >
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#f4f4f1]">
                        <Icon size={18} />
                      </div>

                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-medium uppercase tracking-wide text-gray-400">
                            {item.type}
                          </span>
                        </div>

                        <p className="mt-1 truncate text-sm font-medium">
                          {item.title}
                        </p>

                        <p className="mt-1 text-xs text-gray-500">
                          {item.source}
                        </p>
                      </div>

                      <span className="shrink-0 text-xs text-gray-400">
                        {item.time}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Activity */}
            <div className="col-span-2 rounded-2xl border border-black/10 bg-white">
              <div className="border-b border-black/10 px-6 py-5">
                <h3 className="font-semibold">Project activity</h3>
                <p className="mt-1 text-xs text-gray-500">
                  Latest updates across the project
                </p>
              </div>

              <div className="space-y-6 p-6">
  {activities.length === 0 && (
    <div className="text-sm text-gray-500">
      No project activity yet. Analyze project communication to create activity.
    </div>
  )}

  {activities.map((activity) => (
    <div
      key={activity.id}
      className="flex gap-3"
    >
      <div className="mt-1 h-2.5 w-2.5 shrink-0 rounded-full bg-black" />

      <div>
        <p className="text-sm leading-5">
          <span className="font-medium">
            {activity.name}
          </span>{" "}
          {activity.action}
        </p>

        <p className="mt-1 text-xs text-gray-400">
          {activity.time}
        </p>
      </div>
    </div>
  ))}
</div>
            </div>
          </section>
          </>
      )}
        </div>
      </main>
    </div>
  );
}

function NavItem({ icon, label, active, badge, onClick }) {
  return (
    <button
      onClick={onClick}
      className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition ${
        active
          ? "bg-black text-white"
          : "text-gray-600 hover:bg-[#f5f5f3] hover:text-black"
      }`}
    >
      {icon}

      <span className="flex-1 text-left">{label}</span>

      {badge && (
        <span
          className={`rounded-md px-1.5 py-0.5 text-xs ${
            active ? "bg-white/15 text-white" : "bg-gray-100 text-gray-500"
          }`}
        >
          {badge}
        </span>
      )}
    </button>
  );
}

function CoordinationPage({ memory, loading }) {
    const coordinationItems = [];

  memory.forEach((entry) => {
    const actions = entry.actions || [];
    const dependencies = entry.dependencies || [];
    const stakeholders = entry.stakeholders || [];

    dependencies.forEach((dependency, index) => {
      /*
       * Dependency meaning:
       *
       * from = prerequisite
       * to   = downstream / blocked task
       *
       * Example:
       * Issue revised drawing -> Start ceiling wiring
       *
       * Therefore:
       * waitingFor  = from
       * blockedTask = to
       */

      const normalizeText = (text = "") =>
  text
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, "")
    .replace(/\s+/g, " ")
    .trim();

const dependencyTarget = normalizeText(dependency.to);

const blockedAction = actions.find((action) => {
  const actionTask = normalizeText(action.task);

  return (
    actionTask === dependencyTarget ||
    actionTask.includes(dependencyTarget) ||
    dependencyTarget.includes(actionTask)
  );
});

let responsiblePerson =
  blockedAction?.responsible || "";

// If the action wording differs from the dependency wording,
// try to identify the responsible stakeholder directly.
if (!responsiblePerson) {
  const relatedStakeholder = stakeholders.find((person) => {
    const name = normalizeText(person.name);
    const role = normalizeText(person.role);

    return (
      role === dependencyTarget ||
      dependencyTarget.includes(role) ||
      role.includes(dependencyTarget) ||
      dependency.reason
        ?.toLowerCase()
        .includes(name)
    );
  });

  if (relatedStakeholder) {
    responsiblePerson =
      relatedStakeholder.role || relatedStakeholder.name || "";
  }
}
      let stakeholderRole = "Role not specified";

      const normalizedResponsible =
        responsiblePerson.trim().toLowerCase();

      if (normalizedResponsible === "contractor") {
        stakeholderRole = "Contractor";
      } else if (normalizedResponsible === "architect") {
        stakeholderRole = "Architect";
      } else if (normalizedResponsible === "client") {
        stakeholderRole = "Client";
      } else {
        const stakeholder = stakeholders.find(
          (person) =>
            person.name?.trim().toLowerCase() ===
            normalizedResponsible
        );

        if (stakeholder?.role?.trim()) {
          stakeholderRole = stakeholder.role.trim();
        }
      }

      coordinationItems.push({
        id: `${entry.id}-${index}`,

        // The downstream task that is blocked
        blockedTask: dependency.to,

        // The prerequisite that must happen first
        requiredBefore: dependency.from,

        reason: dependency.reason,

        responsible:
          responsiblePerson || "Unassigned",

        role: stakeholderRole,

        priority:
          blockedAction?.priority || "High",
      });
    });
  });

  // Remove duplicate coordination relationships
  const uniqueItems = Array.from(
    new Map(
      coordinationItems.map((item) => [
        `${item.blockedTask
          ?.trim()
          .toLowerCase()}-${item.requiredBefore
          ?.trim()
          .toLowerCase()}`,
        item,
      ])
    ).values()
  );

  const alerts = memory.flatMap((entry) =>
    (entry.alerts || []).map((alert, index) => ({
      ...alert,
      id: `${entry.id}-alert-${index}`,
    }))
  );

  // Remove duplicate alerts

  const uniqueAlerts = Array.from(
  new Map(
    alerts.map((alert) => {
      const message = alert.message?.toLowerCase() || "";

      let key = message;

      // These alerts describe the same fabrication dependency
      if (
        message.includes("fabrication") &&
        message.includes("revised drawing")
      ) {
        key = "fabrication-revised-drawing";
      }

      return [key, alert];
    })
  ).values()
);

  const affectedStakeholders = new Set(
    uniqueItems
      .map((item) => item.responsible)
      .filter(
        (name) =>
          name &&
          name.toLowerCase() !== "unassigned"
      )
  );

  return (
    <div className="space-y-8">

      {/* Heading */}
      <section className="flex items-end justify-between">
        <div>
          <p className="mb-2 text-sm font-medium text-gray-500">
            Impact & dependency intelligence
          </p>

          <h2 className="text-3xl font-semibold tracking-tight">
            Coordination
          </h2>

          <p className="mt-2 max-w-2xl text-gray-500">
            ProjectPulse identifies dependencies, blocked work and
            the stakeholders affected by project decisions.
          </p>
        </div>

        <div className="rounded-xl border border-black/10 bg-white px-4 py-3">
          <p className="text-xs text-gray-500">
            Coordination risks
          </p>

          <p className="mt-1 text-2xl font-semibold">
            {uniqueItems.length}
          </p>
        </div>
      </section>

      {/* Overview cards */}
      <section className="grid grid-cols-3 gap-4">

        <div className="rounded-2xl border border-black/10 bg-white p-5">
          <p className="text-sm text-gray-500">
            Dependencies
          </p>

          <p className="mt-2 text-3xl font-semibold">
            {uniqueItems.length}
          </p>
        </div>

        <div className="rounded-2xl border border-black/10 bg-white p-5">
          <p className="text-sm text-gray-500">
            Blocked work
          </p>

          <p className="mt-2 text-3xl font-semibold">
            {
              uniqueItems.filter(
                (item) => item.blockedTask
              ).length
            }
          </p>
        </div>

        <div className="rounded-2xl border border-black/10 bg-white p-5">
          <p className="text-sm text-gray-500">
            Affected stakeholders
          </p>

          <p className="mt-2 text-3xl font-semibold">
            {affectedStakeholders.size}
          </p>
        </div>

      </section>

      {/* Coordination map */}
      <section className="rounded-2xl border border-black/10 bg-white">

        <div className="border-b border-black/10 px-6 py-5">
          <h3 className="font-semibold">
            Coordination map
          </h3>

          <p className="mt-1 text-xs text-gray-500">
            Dependencies that can affect downstream project work
          </p>
        </div>

        {loading ? (
          <div className="px-6 py-12 text-center text-sm text-gray-500">
            Loading coordination intelligence...
          </div>
        ) : uniqueItems.length === 0 ? (
          <div className="px-6 py-12 text-center">

            <Activity
              size={32}
              className="mx-auto text-gray-300"
            />

            <p className="mt-4 text-sm font-medium">
              No coordination dependencies detected
            </p>

            <p className="mt-1 text-xs text-gray-500">
              Analyze more project communication to identify
              dependencies and coordination risks.
            </p>

          </div>
        ) : (
          <div className="space-y-4 p-6">

            {uniqueItems.map((item) => (
              <div
                key={item.id}
                className="rounded-2xl border border-black/10 p-5"
              >

                {/* Blocked task */}
                <div className="flex items-start gap-4">

                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-red-50 text-red-600">
                    <AlertTriangle size={19} />
                  </div>

                  <div className="min-w-0 flex-1">

                    <div className="flex items-start justify-between gap-4">

                      <div>
                        <p className="text-xs font-medium uppercase tracking-wide text-red-600">
                          Blocked work
                        </p>

                        <h4 className="mt-1 text-base font-semibold">
                          {item.blockedTask}
                        </h4>

                        <p className="mt-1 text-sm text-gray-500">
  Responsible: {item.responsible}
</p>
                      </div>

                      <span className="rounded-full bg-red-50 px-3 py-1 text-[11px] font-medium text-red-700">
                        {item.priority}
                      </span>

                    </div>

                    {/* Dependency */}
                    <div className="mt-5 grid grid-cols-[1fr_auto_1fr] items-center gap-4">

                      <div className="rounded-xl bg-[#f7f7f5] p-4">

                        <p className="text-[11px] font-medium uppercase tracking-wide text-gray-400">
                          Waiting for
                        </p>

                        <p className="mt-1 text-sm font-semibold">
                          {item.requiredBefore}
                        </p>

                      </div>

                      <div className="flex h-9 w-9 items-center justify-center rounded-full border border-black/10">
                        →
                      </div>

                      <div className="rounded-xl bg-[#f7f7f5] p-4">

                        <p className="text-[11px] font-medium uppercase tracking-wide text-gray-400">
                          Then
                        </p>

                        <p className="mt-1 text-sm font-semibold">
                          {item.blockedTask}
                        </p>

                      </div>

                    </div>

                    {/* Reason */}
                    <div className="mt-4 rounded-xl border border-red-100 bg-red-50 p-4">

                      <p className="text-xs font-medium text-red-800">
                        Why this matters
                      </p>

                      <p className="mt-1 text-sm text-red-700">
                        {item.reason}
                      </p>

                    </div>

                  </div>
                </div>
              </div>
            ))}

          </div>
        )}

      </section>

      {/* Alerts */}
      <section className="rounded-2xl border border-black/10 bg-white">

        <div className="border-b border-black/10 px-6 py-5">
          <h3 className="font-semibold">
            Coordination alerts
          </h3>

          <p className="mt-1 text-xs text-gray-500">
            Risks that require project attention
          </p>
        </div>

        {uniqueAlerts.length === 0 ? (
          <div className="px-6 py-10 text-center text-sm text-gray-500">
            No active coordination alerts.
          </div>
        ) : (
          <div className="space-y-3 p-6">

            {uniqueAlerts.map((alert) => (
              <div
                key={alert.id}
                className="flex items-start gap-3 rounded-xl border border-red-100 bg-red-50 p-4"
              >

                <AlertTriangle
                  size={18}
                  className="mt-0.5 shrink-0 text-red-600"
                />

                <div className="flex-1">

                  <p className="text-sm font-medium text-red-800">
                    {alert.message}
                  </p>

                  <p className="mt-1 text-xs text-red-600">
                    Priority: {alert.priority}
                  </p>

                </div>

              </div>
            ))}

          </div>
        )}

      </section>

    </div>
  );
}


function StakeholdersPage({ memory, loading }) {
  const stakeholderMap = new Map();

  memory.forEach((entry) => {
    (entry.stakeholders || []).forEach((stakeholder) => {
      const name = stakeholder.name?.trim();
      const role = stakeholder.role?.trim();

      if (!name) return;

      if (!stakeholderMap.has(name)) {
        stakeholderMap.set(name, {
          name,
          role: role || "Role not specified",
          actions: [],
          decisions: [],
        });
      }

      const person = stakeholderMap.get(name);

      if (role && person.role === "Role not specified") {
        person.role = role;
      }

      (entry.actions || []).forEach((action) => {
        if (
          action.responsible?.trim().toLowerCase() ===
          name.toLowerCase()
        ) {
          const exists = person.actions.some(
            (item) => item.task === action.task
          );

          if (!exists) {
            person.actions.push(action);
          }
        }
      });

      (entry.decisions || []).forEach((decision) => {
        if (
          decision.source?.trim().toLowerCase() ===
          name.toLowerCase()
        ) {
          const exists = person.decisions.some(
            (item) => item.text === decision.text
          );

          if (!exists) {
            person.decisions.push(decision);
          }
        }
      });
    });
  });

  const stakeholders = Array.from(stakeholderMap.values());

  return (
    <div className="space-y-8">

      {/* Page heading */}
      <section className="flex items-end justify-between">
        <div>
          <p className="mb-2 text-sm font-medium text-gray-500">
            Project participants
          </p>

          <h2 className="text-3xl font-semibold tracking-tight">
            Stakeholders
          </h2>

          <p className="mt-2 max-w-2xl text-gray-500">
            People and project roles identified from communication
            and connected to their responsibilities.
          </p>
        </div>

        <div className="rounded-xl border border-black/10 bg-white px-4 py-3">
          <p className="text-xs text-gray-500">
            Stakeholders
          </p>

          <p className="mt-1 text-2xl font-semibold">
            {stakeholders.length}
          </p>
        </div>
      </section>

      {/* Summary */}
      <section className="grid grid-cols-3 gap-4">

        <div className="rounded-2xl border border-black/10 bg-white p-5">
          <p className="text-sm text-gray-500">
            People identified
          </p>

          <p className="mt-2 text-3xl font-semibold">
            {stakeholders.length}
          </p>
        </div>

        <div className="rounded-2xl border border-black/10 bg-white p-5">
          <p className="text-sm text-gray-500">
            With assigned actions
          </p>

          <p className="mt-2 text-3xl font-semibold">
            {
              stakeholders.filter(
                (person) => person.actions.length > 0
              ).length
            }
          </p>
        </div>

        <div className="rounded-2xl border border-black/10 bg-white p-5">
          <p className="text-sm text-gray-500">
            With decisions
          </p>

          <p className="mt-2 text-3xl font-semibold">
            {
              stakeholders.filter(
                (person) => person.decisions.length > 0
              ).length
            }
          </p>
        </div>

      </section>

      {/* Stakeholder list */}
      <section className="rounded-2xl border border-black/10 bg-white">

        <div className="border-b border-black/10 px-6 py-5">
          <h3 className="font-semibold">
            Project stakeholders
          </h3>

          <p className="mt-1 text-xs text-gray-500">
            Stakeholders identified from project communication
          </p>
        </div>

        {loading ? (
          <div className="px-6 py-12 text-center text-sm text-gray-500">
            Loading stakeholders...
          </div>
        ) : stakeholders.length === 0 ? (
          <div className="px-6 py-12 text-center">

            <Users
              size={32}
              className="mx-auto text-gray-300"
            />

            <p className="mt-4 text-sm font-medium">
              No stakeholders yet
            </p>

            <p className="mt-1 text-xs text-gray-500">
              Analyze project communication to identify stakeholders.
            </p>

          </div>
        ) : (
          <div className="divide-y divide-black/10">

            {stakeholders.map((person) => {

              const initial = person.name
                .charAt(0)
                .toUpperCase();

              return (
                <div
                  key={person.name}
                  className="p-6"
                >

                  <div className="flex items-start gap-4">

                    {/* Avatar */}
                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-black text-sm font-semibold text-white">
                      {initial}
                    </div>

                    {/* Details */}
                    <div className="min-w-0 flex-1">

                      <div className="flex items-center justify-between">

                        <div>
                          <h4 className="text-sm font-semibold">
                            {person.name}
                          </h4>

                          <p className="mt-1 text-xs text-gray-500">
                            {person.role}
                          </p>
                        </div>

                        <div className="flex gap-2">

                          {person.actions.length > 0 && (
                            <span className="rounded-full bg-gray-100 px-3 py-1 text-[11px] font-medium text-gray-700">
                              {person.actions.length} action
                              {person.actions.length !== 1
                                ? "s"
                                : ""}
                            </span>
                          )}

                          {person.decisions.length > 0 && (
                            <span className="rounded-full bg-green-50 px-3 py-1 text-[11px] font-medium text-green-700">
                              {person.decisions.length} decision
                              {person.decisions.length !== 1
                                ? "s"
                                : ""}
                            </span>
                          )}

                        </div>

                      </div>

                      {/* Responsibilities */}
                      {person.actions.length > 0 && (
                        <div className="mt-5">

                          <p className="mb-2 text-xs font-medium uppercase tracking-wide text-gray-400">
                            Responsibilities
                          </p>

                          <div className="space-y-2">

                            {person.actions.map(
                              (action, index) => (
                                <div
                                  key={index}
                                  className="flex items-center justify-between rounded-xl bg-[#f7f7f5] p-3"
                                >

                                  <div>
                                    <p className="text-sm font-medium">
                                      {action.task}
                                    </p>

                                    {action.deadline && (
                                      <p className="mt-1 text-xs text-gray-500">
                                        Due {action.deadline}
                                      </p>
                                    )}
                                  </div>

                                  <span className="rounded-full bg-white px-2.5 py-1 text-[11px] font-medium">
                                    {action.status || "Unknown"}
                                  </span>

                                </div>
                              )
                            )}

                          </div>
                        </div>
                      )}

                    </div>
                  </div>

                </div>
              );
            })}

          </div>
        )}

      </section>

    </div>
  );
}

function ActionsPage({ memory, loading }) {
  const actions = memory.flatMap((entry) =>
    (entry.actions || []).map((action, index) => ({
      ...action,
      id: `${entry.id}-${index}`,
      createdAt: entry.createdAt,
    }))
  );

  const openActions = actions.filter(
    (action) => action.status?.toLowerCase() !== "completed"
  );

  const blockedActions = actions.filter(
    (action) => action.status?.toLowerCase() === "blocked"
  );

  return (
    <div className="space-y-8">

      {/* Page heading */}
      <section className="flex items-end justify-between">
        <div>
          <p className="mb-2 text-sm font-medium text-gray-500">
            Project execution
          </p>

          <h2 className="text-3xl font-semibold tracking-tight">
            Actions
          </h2>

          <p className="mt-2 max-w-2xl text-gray-500">
            All actions extracted from project communication and
            stored in Project Memory.
          </p>
        </div>

        <div className="rounded-xl border border-black/10 bg-white px-4 py-3">
          <p className="text-xs text-gray-500">
            Open actions
          </p>

          <p className="mt-1 text-2xl font-semibold">
            {openActions.length}
          </p>
        </div>
      </section>

      {/* Summary cards */}
      <section className="grid grid-cols-3 gap-4">

        <div className="rounded-2xl border border-black/10 bg-white p-5">
          <p className="text-sm text-gray-500">
            Total actions
          </p>

          <p className="mt-2 text-3xl font-semibold">
            {actions.length}
          </p>
        </div>

        <div className="rounded-2xl border border-black/10 bg-white p-5">
          <p className="text-sm text-gray-500">
            Open actions
          </p>

          <p className="mt-2 text-3xl font-semibold">
            {openActions.length}
          </p>
        </div>

        <div className="rounded-2xl border border-black/10 bg-white p-5">
          <p className="text-sm text-gray-500">
            Blocked
          </p>

          <p className="mt-2 text-3xl font-semibold">
            {blockedActions.length}
          </p>
        </div>

      </section>

      {/* Actions list */}
      <section className="rounded-2xl border border-black/10 bg-white">

        <div className="border-b border-black/10 px-6 py-5">
          <h3 className="font-semibold">
            Project actions
          </h3>

          <p className="mt-1 text-xs text-gray-500">
            Tasks identified from project communication
          </p>
        </div>

        {loading ? (
          <div className="px-6 py-12 text-center text-sm text-gray-500">
            Loading project actions...
          </div>
        ) : actions.length === 0 ? (
          <div className="px-6 py-12 text-center">

            <CheckCircle2
              size={32}
              className="mx-auto text-gray-300"
            />

            <p className="mt-4 text-sm font-medium">
              No actions yet
            </p>

            <p className="mt-1 text-xs text-gray-500">
              Analyze project communication to create actions.
            </p>

          </div>
        ) : (
          <div className="divide-y divide-black/10">

            {actions.map((action) => {

              const status =
                action.status?.toLowerCase() || "unknown";

              const priority =
                action.priority?.toLowerCase() || "unknown";

              const isBlocked = status === "blocked";

              return (
                <div
                  key={action.id}
                  className="p-6"
                >

                  <div className="flex items-start justify-between gap-6">

                    {/* Main action */}
                    <div className="min-w-0">

                      <div className="flex items-center gap-3">

                        <div
                          className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${
                            isBlocked
                              ? "bg-red-50 text-red-600"
                              : "bg-[#f4f4f1] text-black"
                          }`}
                        >
                          {isBlocked ? (
                            <AlertTriangle size={18} />
                          ) : (
                            <CheckCircle2 size={18} />
                          )}
                        </div>

                        <div>
                          <p className="text-sm font-semibold">
                            {action.task}
                          </p>

                          <p className="mt-1 text-xs text-gray-500">
                            Responsible:{" "}
                            {action.responsible || "Unassigned"}
                          </p>
                        </div>

                      </div>

                      {/* Deadline */}
                      {action.deadline && (
                        <div className="mt-4 flex items-center gap-2 text-xs text-gray-500">

                          <Clock3 size={14} />

                          <span>
                            Due {action.deadline}
                          </span>

                        </div>
                      )}

                    </div>

                    {/* Status + Priority */}
                    <div className="flex shrink-0 items-center gap-2">

                      <span
                        className={`rounded-full px-3 py-1 text-[11px] font-medium ${
                          priority === "high"
                            ? "bg-red-50 text-red-700"
                            : priority === "medium"
                              ? "bg-yellow-50 text-yellow-700"
                              : "bg-gray-100 text-gray-600"
                        }`}
                      >
                        {action.priority || "Unknown"}
                      </span>

                      <span
                        className={`rounded-full px-3 py-1 text-[11px] font-medium ${
                          status === "blocked"
                            ? "bg-red-50 text-red-700"
                            : status === "completed"
                              ? "bg-green-50 text-green-700"
                              : "bg-gray-100 text-gray-700"
                        }`}
                      >
                        {action.status || "Unknown"}
                      </span>

                    </div>

                  </div>

                  {/* Blocked warning */}
                  {isBlocked && (
                    <div className="mt-4 rounded-xl border border-red-100 bg-red-50 p-3">

                      <div className="flex items-start gap-2">

                        <AlertTriangle
                          size={16}
                          className="mt-0.5 shrink-0 text-red-600"
                        />

                        <div>
                          <p className="text-xs font-medium text-red-800">
                            This action is blocked
                          </p>

                          <p className="mt-1 text-xs text-red-600">
                            Project communication indicates that
                            this task depends on another project event.
                          </p>
                        </div>

                      </div>

                    </div>
                  )}

                </div>
              );
            })}

          </div>
        )}

      </section>
    </div>
  );
}

function ProjectMemoryPage({ memory, loading }) {
  return (
    <div className="space-y-8">

      {/* Page heading */}
      <section>
        <p className="mb-2 text-sm font-medium text-gray-500">
          Persistent project intelligence
        </p>

        <h2 className="text-3xl font-semibold tracking-tight">
          Project Memory
        </h2>

        <p className="mt-2 max-w-2xl text-gray-500">
          A running memory of decisions, actions, deadlines and
          dependencies extracted from project communication.
        </p>
      </section>

      {/* Stats */}
      <section className="grid grid-cols-4 gap-4">

        <div className="rounded-2xl border border-black/10 bg-white p-5">
          <p className="text-sm text-gray-500">Analyses</p>
          <p className="mt-2 text-3xl font-semibold">
            {memory.length}
          </p>
        </div>

        <div className="rounded-2xl border border-black/10 bg-white p-5">
          <p className="text-sm text-gray-500">Decisions</p>
          <p className="mt-2 text-3xl font-semibold">
            {memory.reduce(
              (total, item) => total + (item.decisions?.length || 0),
              0
            )}
          </p>
        </div>

        <div className="rounded-2xl border border-black/10 bg-white p-5">
          <p className="text-sm text-gray-500">Actions</p>
          <p className="mt-2 text-3xl font-semibold">
            {memory.reduce(
              (total, item) => total + (item.actions?.length || 0),
              0
            )}
          </p>
        </div>

        <div className="rounded-2xl border border-black/10 bg-white p-5">
          <p className="text-sm text-gray-500">Alerts</p>
          <p className="mt-2 text-3xl font-semibold">
            {memory.reduce(
              (total, item) => total + (item.alerts?.length || 0),
              0
            )}
          </p>
        </div>

      </section>

      {/* Memory list */}
      <section className="rounded-2xl border border-black/10 bg-white">

        <div className="border-b border-black/10 px-6 py-5">
          <h3 className="font-semibold">
            Analysis history
          </h3>

          <p className="mt-1 text-xs text-gray-500">
            Previously captured project intelligence
          </p>
        </div>

        {loading ? (
          <div className="px-6 py-12 text-center text-sm text-gray-500">
            Loading project memory...
          </div>
        ) : memory.length === 0 ? (
          <div className="px-6 py-12 text-center">
            <FileText
              size={32}
              className="mx-auto text-gray-300"
            />

            <p className="mt-4 text-sm font-medium">
              No project memory yet
            </p>

            <p className="mt-1 text-xs text-gray-500">
              Analyze a project communication to create your first memory.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-black/10">

            {memory.map((entry) => (
              <div
                key={entry.id}
                className="p-6"
              >

                {/* Header */}
                <div className="flex items-start justify-between gap-6">

                  <div className="min-w-0">

                    <div className="flex items-center gap-2">
                      <span className="rounded-full bg-green-50 px-2.5 py-1 text-[11px] font-medium text-green-700">
                        AI ANALYSIS
                      </span>

                      {entry.modelUsed && (
                        <span className="text-xs text-gray-400">
                          {entry.modelUsed}
                        </span>
                      )}
                    </div>

                    <p className="mt-3 text-sm leading-6 text-gray-700">
                      {entry.summary}
                    </p>

                  </div>

                  <span className="shrink-0 text-xs text-gray-400">
                    {new Date(entry.createdAt).toLocaleString()}
                  </span>

                </div>

                {/* Counters */}
                <div className="mt-5 flex flex-wrap gap-2">

                  <span className="rounded-lg bg-[#f7f7f5] px-3 py-2 text-xs font-medium">
                    {entry.decisions?.length || 0} Decisions
                  </span>

                  <span className="rounded-lg bg-[#f7f7f5] px-3 py-2 text-xs font-medium">
                    {entry.actions?.length || 0} Actions
                  </span>

                  <span className="rounded-lg bg-[#f7f7f5] px-3 py-2 text-xs font-medium">
                    {entry.stakeholders?.length || 0} Stakeholders
                  </span>

                  <span className="rounded-lg bg-[#f7f7f5] px-3 py-2 text-xs font-medium">
                    {entry.deadlines?.length || 0} Deadlines
                  </span>

                  <span className="rounded-lg bg-[#f7f7f5] px-3 py-2 text-xs font-medium">
                    {entry.alerts?.length || 0} Alerts
                  </span>

                </div>

                {/* Actions */}
                {entry.actions?.length > 0 && (
                  <div className="mt-5">

                    <p className="mb-3 text-xs font-medium uppercase tracking-wide text-gray-400">
                      Actions
                    </p>

                    <div className="space-y-2">

                      {entry.actions.map((action, index) => (
                        <div
                          key={index}
                          className="flex items-center justify-between rounded-xl bg-[#f7f7f5] p-3"
                        >

                          <div>
                            <p className="text-sm font-medium">
                              {action.task}
                            </p>

                            <p className="mt-1 text-xs text-gray-500">
                              {action.responsible || "Unassigned"}
                              {action.deadline
                                ? ` · ${action.deadline}`
                                : ""}
                            </p>
                          </div>

                          <span className="rounded-full bg-white px-2.5 py-1 text-[11px] font-medium">
                            {action.status || "Unknown"}
                          </span>

                        </div>
                      ))}

                    </div>
                  </div>
                )}

                {/* Alerts */}
                {entry.alerts?.length > 0 && (
                  <div className="mt-5">

                    <p className="mb-3 text-xs font-medium uppercase tracking-wide text-gray-400">
                      Alerts
                    </p>

                    <div className="space-y-2">

                      {entry.alerts.map((alert, index) => (
                        <div
                          key={index}
                          className="flex items-start gap-3 rounded-xl border border-red-100 bg-red-50 p-3"
                        >

                          <AlertTriangle
                            size={17}
                            className="mt-0.5 shrink-0 text-red-600"
                          />

                          <div>
                            <p className="text-sm font-medium text-red-800">
                              {alert.message}
                            </p>

                            <p className="mt-1 text-xs text-red-600">
                              Priority: {alert.priority}
                            </p>
                          </div>

                        </div>
                      ))}

                    </div>
                  </div>
                )}

              </div>
            ))}

          </div>
        )}

      </section>
    </div>
  );
}
export default App;