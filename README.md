# Maths Team

A polished, dependency-free multi-agent web app for NTU Summer School's **Agentic AI in Education - Project 2**.

The app implements a visible pipeline:

1. **Planner** chooses substitution or elimination and states the first step.
2. **Solver** follows that plan, shows the calculations, and returns `x` and `y`.
3. **Checker** substitutes the answer into both original equations, rejects wrong claims, and sends them back for correction.

It also detects no-solution and infinitely-many-solution systems, supports Chinese and English, and includes all four workshop test cases.

Open `index.html` directly in a browser. No API key or server is required.
