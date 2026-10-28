# elkjs 0.12.0 — source availability and provenance

The neighboring `../elk-worker.min.js` is the **unmodified** native Web Worker
from `elkjs@0.12.0/lib/elk-worker.min.js` (official npm tarball
`elkjs-0.12.0.tgz`). This project copies it during `npm run build` and
`npm pack`/`prepack`; it does not rebundle or patch the GWT-generated JavaScript.

- Worker size: **1,595,334 bytes**.
- Worker SHA-256: `e4f5c51c6f2fd564bb64e52e81c4a85a316ef2f24f8b90e1db5eb886c765b030`.
- npm tarball integrity: `sha512-YZcKynxVxYoKIOEpywEPwCFdg+BTbxQRNf3pbwdDCvc8O3kQD8bmIwSxKU1eOTVc4Xo+VG9Te+575mlfvOrhEQ==`.
- The original **Eclipse Public License 2.0** accompanies this package as
  `LICENSE.md`. The upstream package also declares the alternative
  `GPL-3.0-or-later`; this distribution retains the EPL-2.0 text and source
  availability terms without changing upstream licensing.

The program's source code is available under EPL-2.0 (or the applicable
upstream alternative) from the maintainers at these permanent release links:

1. [elkjs source, npm `gitHead` `ff5771d7165445c42c408bb8a090c8035272218c`](https://github.com/kieler/elkjs/tree/ff5771d7165445c42c408bb8a090c8035272218c).
   The `build.gradle`, `src/`, Gradle wrapper and `README.md` describe the
   Java-to-GWT Worker compilation.
2. [Eclipse Layout Kernel Java source, release `v0.12.0`](https://github.com/eclipse-elk/elk/tree/v0.12.0).
   The corresponding elkjs release identifies its basis as **ELK 0.12.0**.

**Verification limit:** The official npm tarball does not contain the
corresponding Java, generated GWT source, build toolchain or third-party
source bundles. The repository/release pointers are upstream evidence, but a
byte-reproducible rebuild and a complete audit of the exact Java/GWT source
revision, transitive source dependencies, and third-party notices have **not**
been independently established. The build's dependency references include
GWT, Guava, EMF-GWT, Xtext and Xtend; this list is **not** a certified complete
inventory. Do not treat this statement alone as a qualified redistribution
compliance approval. Consult the upstream release and license files for their
full requirements before publishing.
