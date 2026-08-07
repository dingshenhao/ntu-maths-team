const EPS = 1e-9;

const els = {
  inputs: ["a1", "b1", "c1", "a2", "b2", "c2"].map(id => document.getElementById(id)),
  claimX: document.getElementById("claimX"),
  claimY: document.getElementById("claimY"),
  claimEditor: document.getElementById("claimEditor"),
  solveTab: document.getElementById("solveTab"),
  claimTab: document.getElementById("claimTab"),
  runButton: document.getElementById("runButton"),
  resetButton: document.getElementById("resetButton"),
  languageButton: document.getElementById("languageButton"),
  emptyState: document.getElementById("emptyState"),
  agentFeed: document.getElementById("agentFeed"),
  statusPill: document.getElementById("statusPill"),
  plannerCard: document.getElementById("plannerCard"),
  solverCard: document.getElementById("solverCard"),
  checkerCard: document.getElementById("checkerCard"),
  plannerState: document.getElementById("plannerState"),
  solverState: document.getElementById("solverState"),
  checkerState: document.getElementById("checkerState"),
  plannerMessage: document.getElementById("plannerMessage"),
  solverMessage: document.getElementById("solverMessage"),
  checkerMessage: document.getElementById("checkerMessage"),
  finalAnswer: document.getElementById("finalAnswer"),
  finalTitle: document.getElementById("finalTitle"),
  answerValues: document.getElementById("answerValues")
};

let mode = "solve";
let lang = "zh";
let running = false;

const copy = {
  zh: {
    waiting: "等待任务", collaborating: "正在协作", done: "任务完成",
    thinking: "THINKING", complete: "COMPLETE", waitingState: "WAITING", rejected: "REJECTED",
    invalid: "请为每个系数填入有效数字。",
    substitution: "代入法", elimination: "消元法",
    plannerSub: (source, variable, expression) => `<strong>选择代入法。</strong> 方程 ${source} 中 ${variable} 的系数为 ±1，能直接写成：<span class="math-line">${variable} = ${expression}</span>把这个表达式代入另一条方程，交给 Solver。`,
    plannerElim: (variable, m1, m2) => `<strong>选择消元法。</strong> 消去 ${variable} 最直接。<span class="math-line">方程① × ${fmt(m1)}；方程② × ${fmt(m2)}</span>相加后 ${variable} 的系数为 0，交给 Solver。`,
    plannerDegenerate: () => `<strong>选择消元法。</strong> 两条方程的左侧成比例，先消元判断它们是同一条直线还是互相平行。`,
    noSolution: "无解", infinite: "有无穷多组解", confirmed: "答案已通过双重验证", wrongRejected: "错误答案已驳回",
    solveNoSolution: (left, right) => `<strong>执行消元。</strong><span class="math-line">${left} = ${right}</span>得到矛盾等式，因此两条直线平行，系统无解。`,
    solveInfinite: () => `<strong>执行消元。</strong><span class="math-line">0 = 0</span>两条方程表示同一条直线，因此有无穷多组解。`,
    solveUnique: (method, steps, x, y) => `<strong>按照 Planner 的${method}计算。</strong>${steps.map(s => `<span class="math-line">${s}</span>`).join("")}得到 <strong>x = ${fmt(x)}, y = ${fmt(y)}</strong>，交给 Checker。`,
    checkerUnique: (l1, r1, ok1, l2, r2, ok2) => `<strong>代回两条原方程。</strong><span class="math-line ${ok1 ? "check-pass" : "check-fail"}">① 左边 = ${fmt(l1)}；右边 = ${fmt(r1)} ${ok1 ? "✓" : "✕"}</span><span class="math-line ${ok2 ? "check-pass" : "check-fail"}">② 左边 = ${fmt(l2)}；右边 = ${fmt(r2)} ${ok2 ? "✓" : "✕"}</span>${ok1 && ok2 ? "两式都成立，确认答案。" : "至少一式不成立，退回 Solver 重算。"}`,
    checkerNo: (type) => type === "none" ? `<strong>复核系统性质。</strong> 左侧系数成比例，但常数项不成比例，两条直线平行。确认：无解。` : `<strong>复核系统性质。</strong> 两条方程整体成比例，表示同一条直线。确认：有无穷多组解。`,
    claimIntro: (x, y) => `<strong>收到外部答案：</strong> x = ${fmt(x)}, y = ${fmt(y)}。我会跳过求解，直接逐式验证。`,
    retry: (x, y) => `<strong>收到 Checker 的退回。</strong> 重新按 Planner 的方法精确计算：<span class="math-line">x = ${fmt(x)}, y = ${fmt(y)}</span>现将修正结果再次交给 Checker。`,
    corrected: "错解被发现，已退回并修正",
    retryCheck: (x, y) => `修正答案代回两式均成立：<strong>x = ${fmt(x)}, y = ${fmt(y)}</strong> ✓`,
    ready: "小队已就位"
  },
  en: {
    waiting: "Standing by", collaborating: "Collaborating", done: "Complete",
    thinking: "THINKING", complete: "COMPLETE", waitingState: "WAITING", rejected: "REJECTED",
    invalid: "Please enter a valid number for every coefficient.",
    substitution: "substitution", elimination: "elimination",
    plannerSub: (source, variable, expression) => `<strong>Choose substitution.</strong> ${variable} has coefficient ±1 in equation ${source}, so isolate it directly:<span class="math-line">${variable} = ${expression}</span>Substitute this into the other equation and hand off to Solver.`,
    plannerElim: (variable, m1, m2) => `<strong>Choose elimination.</strong> Eliminating ${variable} is most direct.<span class="math-line">equation ① × ${fmt(m1)}; equation ② × ${fmt(m2)}</span>Adding makes the ${variable} coefficient zero. Hand off to Solver.`,
    plannerDegenerate: () => `<strong>Choose elimination.</strong> The left-hand sides are proportional, so eliminate first to determine whether the lines coincide or are parallel.`,
    noSolution: "No solution", infinite: "Infinitely many solutions", confirmed: "Answer verified in both equations", wrongRejected: "Incorrect answer rejected",
    solveNoSolution: (left, right) => `<strong>Perform elimination.</strong><span class="math-line">${left} = ${right}</span>This is a contradiction, so the lines are parallel and the system has no solution.`,
    solveInfinite: () => `<strong>Perform elimination.</strong><span class="math-line">0 = 0</span>Both equations describe the same line, so there are infinitely many solutions.`,
    solveUnique: (method, steps, x, y) => `<strong>Follow the Planner's ${method} method.</strong>${steps.map(s => `<span class="math-line">${s}</span>`).join("")}Therefore <strong>x = ${fmt(x)}, y = ${fmt(y)}</strong>. Hand off to Checker.`,
    checkerUnique: (l1, r1, ok1, l2, r2, ok2) => `<strong>Substitute into both original equations.</strong><span class="math-line ${ok1 ? "check-pass" : "check-fail"}">① left = ${fmt(l1)}; right = ${fmt(r1)} ${ok1 ? "✓" : "✕"}</span><span class="math-line ${ok2 ? "check-pass" : "check-fail"}">② left = ${fmt(l2)}; right = ${fmt(r2)} ${ok2 ? "✓" : "✕"}</span>${ok1 && ok2 ? "Both equations hold. Answer confirmed." : "At least one equation fails. Return to Solver."}`,
    checkerNo: (type) => type === "none" ? `<strong>Verify the system.</strong> The left-side coefficients are proportional but the constants are not. The lines are parallel. Confirmed: no solution.` : `<strong>Verify the system.</strong> The complete equations are proportional and describe the same line. Confirmed: infinitely many solutions.`,
    claimIntro: (x, y) => `<strong>External claim received:</strong> x = ${fmt(x)}, y = ${fmt(y)}. Skip solving and verify it equation by equation.`,
    retry: (x, y) => `<strong>Returned by Checker.</strong> Recalculate precisely using the Planner's method:<span class="math-line">x = ${fmt(x)}, y = ${fmt(y)}</span>Hand the corrected result back to Checker.`,
    corrected: "Error caught, returned and corrected",
    retryCheck: (x, y) => `The corrected answer satisfies both equations: <strong>x = ${fmt(x)}, y = ${fmt(y)}</strong> ✓`,
    ready: "The team is ready"
  }
};

function fmt(value) {
  if (!Number.isFinite(value)) return "—";
  if (near(value, Math.round(value))) return String(Math.round(value));
  return String(Number(value.toFixed(4)));
}
function near(a, b) { return Math.abs(a - b) < EPS; }
function signedTerm(coef, variable) {
  const n = fmt(Math.abs(coef));
  return `${coef >= 0 ? "+" : "−"} ${n === "1" ? "" : n}${variable}`;
}
function expression(constant, coef, variable) {
  let s = fmt(constant);
  if (!near(coef, 0)) s += ` ${signedTerm(coef, variable)}`;
  return s;
}
function equationText(a, b, c) {
  const first = `${fmt(a)}x`;
  return `${first} ${signedTerm(b, "y")} = ${fmt(c)}`;
}
function getSystem() {
  const v = els.inputs.map(input => Number(input.value));
  if (v.some(n => !Number.isFinite(n))) return null;
  return { a1: v[0], b1: v[1], c1: v[2], a2: v[3], b2: v[4], c2: v[5] };
}

class PlannerAgent {
  run(s) {
    const det = s.a1 * s.b2 - s.a2 * s.b1;
    const leftProportional = near(det, 0);
    if (leftProportional) return { method: "elimination", degenerate: true, variable: "x", m1: s.a2, m2: -s.a1 };

    const candidates = [
      { abs: Math.abs(s.a1), source: "①", variable: "x", coef: s.a1, other: s.b1, constant: s.c1 },
      { abs: Math.abs(s.b1), source: "①", variable: "y", coef: s.b1, other: s.a1, constant: s.c1 },
      { abs: Math.abs(s.a2), source: "②", variable: "x", coef: s.a2, other: s.b2, constant: s.c2 },
      { abs: Math.abs(s.b2), source: "②", variable: "y", coef: s.b2, other: s.a2, constant: s.c2 }
    ].filter(c => near(c.abs, 1));
    if (candidates.length) {
      const c = candidates[0];
      const otherVar = c.variable === "x" ? "y" : "x";
      return { method: "substitution", source: c.source, variable: c.variable, expression: expression(c.constant / c.coef, -c.other / c.coef, otherVar) };
    }

    const xCost = Math.abs(s.a1) + Math.abs(s.a2);
    const yCost = Math.abs(s.b1) + Math.abs(s.b2);
    const variable = xCost <= yCost ? "x" : "y";
    const p = variable === "x" ? [s.a1, s.a2] : [s.b1, s.b2];
    return { method: "elimination", variable, m1: p[1], m2: -p[0] };
  }
}

class SolverAgent {
  run(s, plan) {
    const det = s.a1 * s.b2 - s.a2 * s.b1;
    const detX = s.c1 * s.b2 - s.c2 * s.b1;
    const detY = s.a1 * s.c2 - s.a2 * s.c1;
    if (near(det, 0)) {
      if (!near(detX, 0) || !near(detY, 0)) {
        const m1 = s.a2 || s.b2;
        const m2 = -(s.a1 || s.b1);
        return { type: "none", contradictionLeft: 0, contradictionRight: m1 * s.c1 + m2 * s.c2 };
      }
      return { type: "infinite" };
    }
    const x = detX / det;
    const y = detY / det;
    const steps = [];
    if (plan.method === "substitution") {
      steps.push(`${plan.variable} = ${plan.expression}`);
      const other = plan.variable === "x" ? `y = ${fmt(y)}` : `x = ${fmt(x)}`;
      steps.push(`代入另一式 / substitute → ${other}`);
      steps.push(`${plan.variable} = ${fmt(plan.variable === "x" ? x : y)}`);
    } else {
      const v = plan.variable;
      const remain = v === "x" ? "y" : "x";
      const coef = v === "x" ? (plan.m1 * s.b1 + plan.m2 * s.b2) : (plan.m1 * s.a1 + plan.m2 * s.a2);
      const rhs = plan.m1 * s.c1 + plan.m2 * s.c2;
      steps.push(`(${equationText(s.a1, s.b1, s.c1)}) × ${fmt(plan.m1)}`);
      steps.push(`(${equationText(s.a2, s.b2, s.c2)}) × ${fmt(plan.m2)}`);
      steps.push(`${fmt(coef)}${remain} = ${fmt(rhs)} → ${remain} = ${fmt(remain === "x" ? x : y)}`);
      steps.push(`${v} = ${fmt(v === "x" ? x : y)}`);
    }
    return { type: "unique", x, y, steps };
  }
}

class CheckerAgent {
  check(s, x, y) {
    const left1 = s.a1 * x + s.b1 * y;
    const left2 = s.a2 * x + s.b2 * y;
    return { left1, left2, right1: s.c1, right2: s.c2, ok1: near(left1, s.c1), ok2: near(left2, s.c2) };
  }
}

const planner = new PlannerAgent();
const solver = new SolverAgent();
const checker = new CheckerAgent();
const wait = ms => new Promise(resolve => setTimeout(resolve, ms));

function setAgent(card, stateEl, state) {
  card.classList.toggle("active", state === "thinking");
  card.classList.toggle("complete", state === "complete" || state === "rejected");
  stateEl.dataset.state = state;
  stateEl.textContent = copy[lang][state === "waiting" ? "waitingState" : state];
}
function setStatus(type, key) {
  els.statusPill.className = `status-pill ${type}`;
  els.statusPill.querySelector("span").textContent = copy[lang][key];
}
function resetFeed() {
  [
    [els.plannerCard, els.plannerState],
    [els.solverCard, els.solverState],
    [els.checkerCard, els.checkerState]
  ].forEach(([card, state]) => setAgent(card, state, "waiting"));
  els.plannerMessage.innerHTML = "";
  els.solverMessage.innerHTML = "";
  els.checkerMessage.innerHTML = "";
  els.finalAnswer.hidden = true;
  els.finalAnswer.className = "final-answer";
  els.answerValues.innerHTML = "";
}
function showResult(title, values = [], kind = "success") {
  els.finalTitle.textContent = title;
  els.answerValues.innerHTML = values.map(v => `<span>${v}</span>`).join("");
  els.finalAnswer.className = `final-answer${kind === "rejected" ? " rejected" : kind === "neutral" ? " neutral" : ""}`;
  els.finalAnswer.hidden = false;
}

async function runTeam() {
  if (running) return;
  const s = getSystem();
  if (!s) { alert(copy[lang].invalid); return; }
  if ([s.a1, s.b1].every(n => near(n, 0)) || [s.a2, s.b2].every(n => near(n, 0))) {
    alert(lang === "zh" ? "每条方程至少需要一个非零系数。" : "Each equation needs at least one non-zero coefficient.");
    return;
  }
  running = true;
  els.runButton.disabled = true;
  els.emptyState.hidden = true;
  els.agentFeed.hidden = false;
  resetFeed();
  setStatus("running", "collaborating");
  const t = copy[lang];

  const plan = planner.run(s);
  setAgent(els.plannerCard, els.plannerState, "thinking");
  await wait(420);
  if (mode === "claim") {
    els.plannerMessage.innerHTML = t.claimIntro(Number(els.claimX.value), Number(els.claimY.value));
  } else if (plan.degenerate) {
    els.plannerMessage.innerHTML = t.plannerDegenerate();
  } else if (plan.method === "substitution") {
    els.plannerMessage.innerHTML = t.plannerSub(plan.source, plan.variable, plan.expression);
  } else {
    els.plannerMessage.innerHTML = t.plannerElim(plan.variable, plan.m1, plan.m2);
  }
  setAgent(els.plannerCard, els.plannerState, "complete");
  await wait(320);

  const solved = solver.run(s, plan);
  setAgent(els.solverCard, els.solverState, "thinking");
  await wait(520);

  if (mode === "claim") {
    const claimX = Number(els.claimX.value);
    const claimY = Number(els.claimY.value);
    els.solverMessage.innerHTML = lang === "zh" ? `<strong>按挑战模式跳过。</strong> 保留外部答案 x = ${fmt(claimX)}, y = ${fmt(claimY)}，直接交给 Checker。` : `<strong>Skipped in challenge mode.</strong> Preserve the external claim x = ${fmt(claimX)}, y = ${fmt(claimY)} and hand it to Checker.`;
    setAgent(els.solverCard, els.solverState, "complete");
    await wait(320);
    setAgent(els.checkerCard, els.checkerState, "thinking");
    await wait(520);
    const checked = checker.check(s, claimX, claimY);
    els.checkerMessage.innerHTML = t.checkerUnique(checked.left1, checked.right1, checked.ok1, checked.left2, checked.right2, checked.ok2);
    if (checked.ok1 && checked.ok2) {
      setAgent(els.checkerCard, els.checkerState, "complete");
      showResult(t.confirmed, [`x = ${fmt(claimX)}`, `y = ${fmt(claimY)}`]);
    } else {
      setAgent(els.checkerCard, els.checkerState, "rejected");
      showResult(t.wrongRejected, [], "rejected");
      await wait(700);
      if (solved.type === "unique") {
        setAgent(els.solverCard, els.solverState, "thinking");
        els.solverMessage.innerHTML = t.retry(solved.x, solved.y);
        await wait(450);
        setAgent(els.solverCard, els.solverState, "complete");
        setAgent(els.checkerCard, els.checkerState, "thinking");
        els.checkerMessage.innerHTML = t.retryCheck(solved.x, solved.y);
        await wait(420);
        setAgent(els.checkerCard, els.checkerState, "complete");
        showResult(t.corrected, [`x = ${fmt(solved.x)}`, `y = ${fmt(solved.y)}`]);
      }
    }
  } else {
    if (solved.type === "none") {
      els.solverMessage.innerHTML = t.solveNoSolution(fmt(solved.contradictionLeft), fmt(solved.contradictionRight));
    } else if (solved.type === "infinite") {
      els.solverMessage.innerHTML = t.solveInfinite();
    } else {
      els.solverMessage.innerHTML = t.solveUnique(t[plan.method], solved.steps, solved.x, solved.y);
    }
    setAgent(els.solverCard, els.solverState, "complete");
    await wait(350);

    setAgent(els.checkerCard, els.checkerState, "thinking");
    await wait(520);
    if (solved.type === "unique") {
      const checked = checker.check(s, solved.x, solved.y);
      els.checkerMessage.innerHTML = t.checkerUnique(checked.left1, checked.right1, checked.ok1, checked.left2, checked.right2, checked.ok2);
      setAgent(els.checkerCard, els.checkerState, checked.ok1 && checked.ok2 ? "complete" : "rejected");
      showResult(t.confirmed, [`x = ${fmt(solved.x)}`, `y = ${fmt(solved.y)}`]);
    } else {
      els.checkerMessage.innerHTML = t.checkerNo(solved.type);
      setAgent(els.checkerCard, els.checkerState, "complete");
      showResult(solved.type === "none" ? t.noSolution : t.infinite, [], "neutral");
    }
  }

  setStatus("done", "done");
  running = false;
  els.runButton.disabled = false;
}

function setMode(nextMode) {
  mode = nextMode;
  els.solveTab.classList.toggle("active", mode === "solve");
  els.claimTab.classList.toggle("active", mode === "claim");
  els.solveTab.setAttribute("aria-selected", String(mode === "solve"));
  els.claimTab.setAttribute("aria-selected", String(mode === "claim"));
  els.claimEditor.hidden = mode !== "claim";
}
function setValues(values) { els.inputs.forEach((input, i) => { input.value = values[i]; }); }

const examples = {
  substitution: { values: [1, 1, 4, 3, 2, 16], mode: "solve" },
  steps: { values: [7, 5, 81, 3, -2, 14], mode: "solve" },
  wrong: { values: [2, 1, 5, 1, -1, 1], mode: "claim", claim: [3, 2] },
  none: { values: [2, 1, 5, 4, 2, 7], mode: "solve" }
};

document.querySelectorAll("[data-example]").forEach(button => button.addEventListener("click", () => {
  const ex = examples[button.dataset.example];
  setValues(ex.values);
  setMode(ex.mode);
  if (ex.claim) { els.claimX.value = ex.claim[0]; els.claimY.value = ex.claim[1]; }
  runTeam();
}));
els.solveTab.addEventListener("click", () => setMode("solve"));
els.claimTab.addEventListener("click", () => setMode("claim"));
els.runButton.addEventListener("click", runTeam);
els.resetButton.addEventListener("click", () => {
  setValues([2, 1, 5, 1, -1, 1]);
  els.claimX.value = 3; els.claimY.value = 2;
  setMode("solve"); resetFeed();
  els.agentFeed.hidden = true; els.emptyState.hidden = false;
  setStatus("idle", "waiting");
});
els.languageButton.addEventListener("click", () => {
  lang = lang === "zh" ? "en" : "zh";
  els.languageButton.textContent = lang === "zh" ? "EN" : "中";
  document.documentElement.lang = lang === "zh" ? "zh-CN" : "en";
  document.querySelectorAll(`[data-${lang}]`).forEach(node => { node.innerHTML = node.dataset[lang]; });
  if (els.agentFeed.hidden) setStatus("idle", "waiting");
});

window.__mathsTeam = { PlannerAgent, SolverAgent, CheckerAgent, planner, solver, checker };
