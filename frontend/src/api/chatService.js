/**
 * Chat Service — tries the real Python backend first, then falls back to
 * a smart frontend intent engine using the already-loaded studentData.
 */

// ─────────────────────────────────────────────
// SUBJECT CURRICULUM KNOWLEDGE BASE
// ─────────────────────────────────────────────
const SUBJECT_CURRICULUM = {
  "operating systems": {
    display: "Operating Systems",
    units: [
      { name: "Process Management", topics: ["Process states and PCB (Process Control Block)", "CPU Scheduling: FCFS, SJF, Round Robin, Priority Scheduling", "Preemptive vs Non-Preemptive scheduling", "Context switching and dispatcher"] },
      { name: "Deadlocks", topics: ["Necessary conditions: Mutual Exclusion, Hold & Wait, No Preemption, Circular Wait", "Deadlock prevention, avoidance (Banker's Algorithm)", "Deadlock detection and recovery"] },
      { name: "Memory Management", topics: ["Contiguous allocation: Fixed & Variable partitioning", "Paging: page table, TLB, effective access time", "Virtual memory, demand paging, page replacement (LRU, FIFO, Optimal)", "Thrashing and working set model"] },
      { name: "File Systems", topics: ["File allocation methods: contiguous, linked, indexed", "Directory structures: single-level, two-level, tree", "Disk scheduling: SSTF, SCAN, C-SCAN", "Inode structure in UNIX"] },
      { name: "Synchronization", topics: ["Critical section problem", "Semaphores: counting and binary", "Classic problems: Producer-Consumer, Readers-Writers, Dining Philosophers"] },
    ],
  },
  "data structures": {
    display: "Data Structures & Algorithms",
    units: [
      { name: "Linear Structures", topics: ["Arrays: static vs dynamic, time complexity of operations", "Linked Lists: singly, doubly, circular — insertions & deletions", "Stacks: LIFO, applications (expression evaluation, recursion)", "Queues: FIFO, circular queue, deque, priority queue"] },
      { name: "Trees", topics: ["Binary Tree traversals: Inorder, Preorder, Postorder", "Binary Search Tree (BST): insert, delete, search", "AVL Trees: rotations (LL, RR, LR, RL), height balance", "Heaps: max-heap, min-heap, heapify, heap sort"] },
      { name: "Graphs", topics: ["Representations: Adjacency Matrix vs Adjacency List", "BFS and DFS traversal algorithms", "Shortest path: Dijkstra's, Bellman-Ford", "Minimum Spanning Tree: Prim's, Kruskal's", "Topological Sort"] },
      { name: "Sorting & Searching", topics: ["Bubble, Selection, Insertion Sort — O(n²)", "Merge Sort, Quick Sort — O(n log n)", "Binary Search — O(log n)", "Hashing: hash functions, collision resolution"] },
    ],
  },
  "database management systems": {
    display: "Database Management Systems",
    units: [
      { name: "Relational Model", topics: ["ER diagrams: entities, attributes, relationships, cardinality", "Relational Algebra: Select, Project, Join, Union, Difference", "Keys: primary, foreign, candidate, super key"] },
      { name: "SQL", topics: ["DDL: CREATE, ALTER, DROP", "DML: SELECT, INSERT, UPDATE, DELETE", "Joins: INNER, LEFT, RIGHT, FULL OUTER JOIN", "GROUP BY, HAVING, subqueries, correlated subqueries", "Views and transactions (COMMIT, ROLLBACK)"] },
      { name: "Normalization", topics: ["1NF: atomic values, no repeating groups", "2NF: no partial dependency", "3NF: no transitive dependency", "BCNF: every determinant is a candidate key", "Functional Dependencies and Armstrong's Axioms"] },
      { name: "Transactions & Concurrency", topics: ["ACID properties", "Transaction states: active, committed, aborted", "Concurrency problems: dirty read, lost update, unrepeatable read", "Lock-based protocols: 2PL (Two-Phase Locking)"] },
    ],
  },
  "computer networks": {
    display: "Computer Networks",
    units: [
      { name: "Network Models", topics: ["OSI 7-Layer model — roles of each layer", "TCP/IP 4-Layer model vs OSI comparison", "Encapsulation and decapsulation"] },
      { name: "Network Layer", topics: ["IP addressing: IPv4 (32-bit), classes A/B/C/D", "Subnetting and CIDR notation", "Routing protocols: RIP, OSPF, BGP", "ARP, ICMP, NAT"] },
      { name: "Transport Layer", topics: ["TCP vs UDP — connection-oriented vs connectionless", "TCP 3-way handshake (SYN, SYN-ACK, ACK)", "TCP congestion control: slow start, congestion avoidance", "Port numbers and sockets"] },
      { name: "Application Layer", topics: ["HTTP/HTTPS, FTP, SMTP, DNS", "DNS resolution process (recursive vs iterative)", "Email protocols: SMTP, IMAP, POP3"] },
    ],
  },
  "machine learning": {
    display: "Machine Learning",
    units: [
      { name: "Supervised Learning", topics: ["Linear Regression: gradient descent, cost function (MSE)", "Logistic Regression: sigmoid, binary classification", "Decision Trees: Gini impurity, entropy, information gain", "Support Vector Machines: hyperplanes, kernels (RBF, polynomial)", "K-Nearest Neighbors: distance metrics, choosing K"] },
      { name: "Unsupervised Learning", topics: ["K-Means Clustering: centroid update, elbow method", "Hierarchical Clustering: dendrogram", "PCA: dimensionality reduction"] },
      { name: "Model Evaluation", topics: ["Train/Test/Validation split", "Cross-validation (k-fold)", "Metrics: Accuracy, Precision, Recall, F1-Score, ROC-AUC", "Overfitting vs Underfitting, bias-variance tradeoff", "Regularization: L1 (Lasso), L2 (Ridge)"] },
      { name: "Neural Networks", topics: ["Perceptron and MLP", "Activation functions: ReLU, Sigmoid, Tanh", "Backpropagation and gradient descent", "CNN basics for images, RNN for sequences"] },
    ],
  },
};

function detectSubject(text) {
  const lower = text.toLowerCase();
  for (const key of Object.keys(SUBJECT_CURRICULUM)) {
    const words = key.split(" ").filter((w) => w.length > 3);
    if (words.some((w) => new RegExp(`\\b${w}\\b`).test(lower))) return key;
  }
  return null;
}

function formatKnowledge(subjectKey, question) {
  const data = SUBJECT_CURRICULUM[subjectKey];
  const q = question.toLowerCase();

  // Check if asking about a specific unit
  const specificUnit = data.units.find((u) =>
    u.name
      .split(" ")
      .filter((w) => w.length > 3)
      .some((w) => new RegExp(`\\b${w.toLowerCase()}\\b`).test(q))
  );

  if (specificUnit) {
    return (
      `## ${data.display} — ${specificUnit.name}\n\n` +
      specificUnit.topics.map((t) => `- ${t}`).join("\n") +
      `\n\n> 💡 This is a high-weightage exam unit. Practice past paper questions after covering the theory.`
    );
  }

  // Full subject overview
  let lines = [`## Important Topics — ${data.display}\n`];
  data.units.forEach((unit, i) => {
    lines.push(`### ${i + 1}. ${unit.name}`);
    unit.topics.forEach((t) => lines.push(`- ${t}`));
    lines.push("");
  });
  lines.push(`> 💡 **Exam Tip:** Practice numerical problems regularly — scheduling algorithms, SQL queries, subnetting calculations, and graph traversals appear in most exams.`);
  return lines.join("\n");
}

// ─────────────────────────────────────────────
// INTENT DETECTION
// ─────────────────────────────────────────────
function detectIntent(question) {
  const q = question.toLowerCase();

  // HIGHEST PRIORITY — subject knowledge questions
  const knowledgeTriggers = /\b(important|topic|tell|explain|what is|what are|describe|notes|syllabus|units|chapters|content|concept)\b/;
  if (knowledgeTriggers.test(q) && detectSubject(q)) return "knowledge";

  if (/\b(risk|profile|score|marks|percentage|perform|weak|strength)\b/.test(q)) return "risk";
  if (/\b(timetable|schedule|hours|days|session|time|plan my|study plan)\b/.test(q)) return "schedule";
  if (/\b(catch.?up|backlog|recovery|roadmap)\b/.test(q)) return "plan";
  if (/\b(how.*prepare|study sequence|step.*step)\b/.test(q)) return "plan";
  if (/\b(attendance|absent|shortage|debarment|classes|present)\b/.test(q)) return "attendance";
  if (/\b(revision|priority|urgent|upcoming|deadline|next exam)\b/.test(q)) return "revision";
  if (/\b(intervention|suggest|recommend|mentor|action|flag)\b/.test(q)) return "mentor_action";
  if (/\b(email|draft|message|notify|send|write)\b/.test(q)) return "mentor_email";
  if (/\b(department|hod|cohort|remedial|faculty|overall|analyze|report|strategic)\b/.test(q)) return "hod_report";
  return "overview";
}

// ─────────────────────────────────────────────
// FORMAT HELPERS (use real studentData)
// ─────────────────────────────────────────────
function formatRiskProfile(studentId, risk) {
  if (!risk || !Object.keys(risk).length) return "No risk data available.";
  const sorted = Object.entries(risk).sort((a, b) => ({ high: 0, medium: 1, low: 2 }[a[1].risk] - { high: 0, medium: 1, low: 2 }[b[1].risk]));
  const icon = { high: "🔴", medium: "🟡", low: "🟢" };
  const rows = sorted.map(([s, v]) => `| ${icon[v.risk]} **${s}** | ${v.marks_pct}% | ${v.attendance_pct}% | **${v.risk.toUpperCase()}** |`);
  return (
    `## Risk Profile — ${studentId}\n\n| Subject | Marks | Attendance | Risk |\n|---------|-------|------------|------|\n` +
    rows.join("\n") +
    `\n\n> 💡 **Tip:** Focus on 🔴 High Risk subjects first — they affect your result most.`
  );
}

function formatSchedule(studentId, intensity) {
  if (!intensity || !Object.keys(intensity).length) return "No study intensity data available.";
  const blocks = Object.entries(intensity).map(([sub, v]) => {
    const badge = v.risk === "high" ? "🔴 HIGH PRIORITY" : v.risk === "medium" ? "🟡 MODERATE" : "🟢 MAINTENANCE";
    const strategy = v.risk === "high" ? "Split sessions: 50 min study + 5 min break + 45 min practice." : "One focused session per study day is sufficient.";
    return `### ${sub} — ${badge}\n- **Weekly:** ${v.hours_per_week} hours across ${v.days_per_week} days\n- **Session:** ${v.session_minutes} min/session\n- **Strategy:** ${strategy}`;
  });
  return `## Study Schedule — ${studentId}\n\n${blocks.join("\n\n")}`;
}

function formatPlan(studentId, plan) {
  if (!plan || !Object.keys(plan).length) return "No backlog plan found — all subjects appear on track!";
  const icon = { high: "🔴", medium: "🟡", low: "🟢" };
  const blocks = Object.entries(plan).map(([sub, v]) => {
    const topics = v.topics.map((t, i) => `${i + 1}. ${t}`).join("\n");
    return `### ${icon[v.risk] || ""} ${sub} — Catch-Up Sequence\n**Topics to complete in order:**\n${topics}\n\n**Rationale:**\n${v.plan_text}`;
  });
  return `## Recovery Plan — ${studentId}\n\n${blocks.join("\n\n---\n\n")}\n\n> 💡 Prerequisites are listed first so you build a solid foundation before advanced exam topics.`;
}

function formatAttendance(studentId, risk) {
  if (!risk || !Object.keys(risk).length) return "No attendance data available.";
  const rows = Object.entries(risk).map(([s, v]) => {
    const status = v.attendance_pct < 65 ? "🚨 Critical" : v.attendance_pct < 75 ? "⚠️ Warning" : "✅ Good";
    return `| **${s}** | ${v.attendance_pct}% | ${status} |`;
  });
  return `## Attendance Report — ${studentId}\n\n| Subject | Attendance | Status |\n|---------|------------|--------|\n${rows.join("\n")}\n\n> ⚠️ Any subject below **75%** risks exam debarment.`;
}

function formatRevision(studentId, revision) {
  const backlog = revision?.backlog || [];
  if (!backlog.length) return "No upcoming backlog exams — you are on track! 🎉";
  const labels = ["⚡ Most Urgent", "📌 Next", "📋 Queued"];
  const rows = backlog.map((item, i) => `| ${labels[Math.min(i, 2)]} | **${item.subject}** | ${item.topic} | \`${item.exam_date}\` |`);
  let result = `## Revision Priorities — ${studentId}\n\n| Priority | Subject | Topic | Exam Date |\n|----------|---------|-------|----------|\n${rows.join("\n")}`;
  if (revision?.revision_text) result += `\n\n**Agent Recommendation:**\n> ${revision.revision_text}`;
  return result;
}

// ─────────────────────────────────────────────
// FRONTEND FALLBACK ENGINE
// ─────────────────────────────────────────────
function frontendFallback(studentId, question, role, studentData) {
  const { risk = {}, plan = {}, intensity = {}, revision = {} } = studentData || {};
  const intent = detectIntent(question);

  // Knowledge questions — always answer directly regardless of role
  if (intent === "knowledge") {
    const subjectKey = detectSubject(question);
    if (subjectKey) return formatKnowledge(subjectKey, question);
  }

  if (role === "Mentor") {
    if (intent === "mentor_email") {
      const high = Object.entries(risk).filter(([, v]) => v.risk === "high");
      const subjectName = high[0]?.[0] || Object.keys(risk)[0] || "your weakest subject";
      const hrs = intensity?.[subjectName]?.hours_per_week || 6;
      return (
        `## Draft Check-In Email — ${studentId}\n\n**Subject:** Academic Support — Action Required for ${subjectName}\n\n---\n\n` +
        `Dear Student,\n\nI have reviewed your academic profile. Your current performance in **${subjectName}** requires immediate attention.\n\n` +
        `**Action Plan:**\n1. Dedicate **${hrs} hours per week** starting this week.\n2. Complete the prerequisite topic sequence in order.\n3. Attend all upcoming lab sessions.\n\n` +
        `Please confirm your availability for a 15-minute check-in.\n\n*— Faculty Mentor*`
      );
    }
    if (intent === "schedule") return formatSchedule(studentId, intensity);
    if (intent === "attendance") return formatAttendance(studentId, risk);
    if (intent === "revision") return formatRevision(studentId, revision);
    // Default: intervention report
    const high = Object.entries(risk).filter(([, v]) => v.risk === "high");
    const med = Object.entries(risk).filter(([, v]) => v.risk === "medium");
    let out = `## Intervention Report — ${studentId}\n\n`;
    if (high.length) {
      out += `### 🚨 High-Risk Subjects (Immediate Action)\n${high.map(([s, v]) => `- **${s}** — Marks: ${v.marks_pct}%, Attendance: ${v.attendance_pct}%`).join("\n")}\n\n**Actions:**\n1. Schedule 1-on-1 review within 3 days.\n2. Assign targeted practice for foundational topics.\n3. Issue attendance warning if below 65%.\n`;
    }
    if (med.length) {
      out += `\n### ⚠️ Medium-Risk (Monitor)\n${med.map(([s, v]) => `- **${s}** — Marks: ${v.marks_pct}%, Attendance: ${v.attendance_pct}%`).join("\n")}`;
    }
    return out;
  }

  if (role === "HOD") {
    const high = Object.entries(risk).filter(([, v]) => v.risk === "high");
    const med = Object.entries(risk).filter(([, v]) => v.risk === "medium");
    return (
      `## HOD Department Drill-Down — ${studentId}\n\n` +
      `### High-Risk Subjects (${high.length})\n${high.map(([s, v]) => `- **${s}**: ${v.marks_pct}% marks | ${v.attendance_pct}% attendance`).join("\n") || "_None_"}\n\n` +
      `### Medium-Risk Subjects (${med.length})\n${med.map(([s, v]) => `- **${s}**: ${v.marks_pct}% marks | ${v.attendance_pct}% attendance`).join("\n") || "_None_"}\n\n` +
      `**HOD Recommended Actions:**\n1. Approve remedial lab sessions for High-Risk subjects.\n2. Issue faculty review directive if dept avg is below 55%.\n3. Trigger attendance warning for students below 65%.`
    );
  }

  // STUDENT mode
  switch (intent) {
    case "risk":       return formatRiskProfile(studentId, risk);
    case "schedule":   return formatSchedule(studentId, intensity);
    case "plan":       return formatPlan(studentId, plan);
    case "attendance": return formatAttendance(studentId, risk);
    case "revision":   return formatRevision(studentId, revision);
    default: {
      const highRisk = Object.entries(risk).filter(([, v]) => v.risk === "high");
      const next = revision?.backlog?.[0];
      return (
        `## Your Academic Summary — ${studentId}\n\n` +
        (highRisk.length ? `**Priority Alert:** ${highRisk.length} High-Risk subject(s): ${highRisk.map(([s]) => `**${s}**`).join(", ")}.\n\n` : "All subjects are at acceptable risk levels.\n\n") +
        (next ? `**Next Exam:** ${next.subject} (${next.topic}) on \`${next.exam_date}\`.\n\n` : "") +
        `**Ask me anything:**\n- *"What is my risk profile?"*\n- *"Show my study schedule"*\n- *"Tell me important topics in Operating Systems"*\n- *"What is my attendance status?"*\n- *"What are my revision priorities?"*`
      );
    }
  }
}

// ─────────────────────────────────────────────
// PUBLIC EXPORT
// ─────────────────────────────────────────────
export async function sendChatMessage(studentId, question, role = "Student", studentData = null) {
  // Try real backend /api/chat first
  try {
    const res = await fetch("/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ student_id: studentId, question, role }),
    });
    if (res.ok) {
      const data = await res.json();
      return data.answer || data.response || data.text || JSON.stringify(data);
    }
  } catch {
    // Backend unreachable — use frontend fallback
  }

  await new Promise((r) => setTimeout(r, 300));
  return frontendFallback(studentId, question, role, studentData);
}
