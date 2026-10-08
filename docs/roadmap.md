# Roadmap

## Implemented in 0.3.0

- CodeGraph-only analysis and refinement with immediate rejection of missing provider configuration.
- Removed local source parsing and scenario simulation; all languages depend on provider coverage.
- Eight MCP tools, background jobs, inspection, cancellation and session controls.
- Provider evidence rendering, replay snapshots, proposed overlays and offline imports.
- Portable `code-anime` skill, regression tests and packaged CLI verification.

## Next work

- Vendor-specific adapters verified against real CodeGraph implementations, including Kotlin.
- Provider readiness, indexing and language-support discovery through documented tools.
- Whole-project views, lazy expansion and measured large-project performance.
- Browser automation, host-specific skill checks and multilingual labels.

Graph structure does not establish runtime execution or values. See [provider setup](analysis.md).
