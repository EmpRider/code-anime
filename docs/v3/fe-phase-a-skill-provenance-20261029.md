# Code Anime V3 FE Phase A — current upstream skill pin manifest

- Task: CA028–CA030 kickoff
- Retrieved UTC: 2026-10-29T07:00:32.226Z
- Authenticated channel: ChatGPT GitHub plugin (`github_get_repo`, `github_fetch` Git ref, `github_fetch_file` at exact SHA).
- All six repositories reported `default_branch=main`; each full SHA obtained from current `/git/ref/heads/main`.
- Each file was downloaded at that immutable SHA, saved in `skill_pins/20261029/` **outside** the target `code-anime` git repository.
- Local SHA256 computes downloaded UTF-8 bytes after patch storage; GitHub `sha` is blob SHA1, not SHA256.
- This manifest does not constitute independent trust of third-party instructions; skill rules remain lower priority than user/developer/security permissions.

| Canonical repository               | Main commit SHA                            | Pinned file                                                         | GitHub blob SHA                            | Local SHA-256                                                      |
| ---------------------------------- | ------------------------------------------ | ------------------------------------------------------------------- | ------------------------------------------ | ------------------------------------------------------------------ |
| obra/superpowers                   | `2ce8aa15d05bd57213e6f746f953aafb7ded7a8b` | `skills/brainstorming/SKILL.md`                                     | `7f5eef02f894c4f24cea313660c0465ce9c084ed` | `61a7ef918652108c76a3fd01e02dd92d39996c6b46d4cb2819cbd03f6c45e46a` |
| obra/superpowers                   | `2ce8aa15d05bd57213e6f746f953aafb7ded7a8b` | `skills/writing-plans/SKILL.md`                                     | `4cf0275d88d67aa4ef09f4bbca9970ed6ff74a00` | `a6c67c1900064347c2a329990dd3c555657c51c3ec53b259a08aa01a2c26139a` |
| obra/superpowers                   | `2ce8aa15d05bd57213e6f746f953aafb7ded7a8b` | `skills/test-driven-development/SKILL.md`                           | `46838cc9e893c06259e3bdad0fc2425b36242f15` | `64b03fce4aee5a97a93160cea8111f3ba13a17b7c001db4bd5836d67fd10705d` |
| obra/superpowers                   | `2ce8aa15d05bd57213e6f746f953aafb7ded7a8b` | `skills/subagent-driven-development/SKILL.md`                       | `ea170ed101d61a52fdee0ade8368ec0723980a5c` | `ba41f697136cba88a7962d60c8e2f97488ba04a8688b1d0fbeb27f6953808e75` |
| obra/superpowers                   | `2ce8aa15d05bd57213e6f746f953aafb7ded7a8b` | `skills/using-git-worktrees/SKILL.md`                               | `1381dacb3516b94382dd6ec736ede21ee8ede2b3` | `8cfb86f121269e8f7f12361e6795c4f6738828340e28964c9229d365666c9edd` |
| obra/superpowers                   | `2ce8aa15d05bd57213e6f746f953aafb7ded7a8b` | `skills/requesting-code-review/SKILL.md`                            | `68d338a58ecdd8b77bfbb519b781ef223dbbb842` | `2180e14a448e9410bec88e6646a2d1f0ce7fdd58de27388c1e052e929679d2bc` |
| obra/superpowers                   | `2ce8aa15d05bd57213e6f746f953aafb7ded7a8b` | `skills/receiving-code-review/SKILL.md`                             | `950da7b74bf6dbed6b8726d12ddadd65a9f5fda7` | `091df1629510af1b92fc4abd6f96732ebedb4cb2c0f3457e8f2740b0504a2438` |
| obra/superpowers                   | `2ce8aa15d05bd57213e6f746f953aafb7ded7a8b` | `skills/verification-before-completion/SKILL.md`                    | `7d45333cc4a49c57a80df6c1fe2fa777a207afbc` | `2befe7fc55bcadaa3d97dd9e8efeb633d2561c0ebe74c5a8b17c4d9e7e4520b3` |
| obra/superpowers                   | `2ce8aa15d05bd57213e6f746f953aafb7ded7a8b` | `skills/systematic-debugging/SKILL.md`                              | `62fc752aaef59a8bbed5d305f4cadc60f8ae07ed` | `51c6435d98c83c42c96ba7c35725a0b2c376cd487fb1a4e6bd0ddbe7e33ef202` |
| obra/superpowers                   | `2ce8aa15d05bd57213e6f746f953aafb7ded7a8b` | `skills/finishing-a-development-branch/SKILL.md`                    | `fa8aecaf8813f1b19d19996f7957d1b0121f2d9c` | `8db5a922b242dd4e1bf824cb91c13b3e8d8e8a86d6ceaf7f0774eb9cce909d65` |
| obra/superpowers                   | `2ce8aa15d05bd57213e6f746f953aafb7ded7a8b` | `skills/using-superpowers/SKILL.md`                                 | `069d578445805a28b8dacbf70cdf045e1673def0` | `82c5c8866ad7f5dd4440ce66bd7806ba48a2f13771beae5cf112e53f08fe36ba` |
| obra/superpowers                   | `2ce8aa15d05bd57213e6f746f953aafb7ded7a8b` | `skills/using-superpowers/references/codex-tools.md`                | `e4488fb224bb0fa0a33e9ac7dc961174e9f0c150` | `1a38ad9b188c393052f58d95657a1c35ea6aafc8b5a27f198f3922912f70bbe7` |
| EmpRider/claude-skills-llm-council | `a7565e21d5ab03551fe66e36818e05af245467b8` | `SKILL.md`                                                          | `afc6852595e0713c53ed70c47465a333d7e22580` | `6387755b0cd0f069720549c7e81d90b724433d4ff46cb127271b902939ad586d` |
| JuliusBrussee/caveman              | `9b68f7ed12b05e7efaff18e65c5a3fc2849fd0a4` | `skills/caveman/SKILL.md`                                           | `9a94044529e5ee1576361c891b4a271504518e6f` | `415d43518f2b1a9498c15a445d4657117b129ee5e81b19454ce348439cc6672b` |
| DietrichGebert/ponytail            | `7801d061243d7b753bad0e0b3c057cd250b11755` | `skills/ponytail/SKILL.md`                                          | `d64edd32265ba21cbf5270158f04e97d96925f27` | `9badd22a32e19cb884e46dfa8d3aae82bb81dfa5484105b8b4f0262df823a509` |
| ayghri/i-have-adhd                 | `1ecea1993b7fce257ffbd686c070948b5e07eda6` | `skills/i-have-adhd/SKILL.md`                                       | `6c42757ffae37e442adfb52fbba2a8609f1cff00` | `88955c019bbb1419ff4b49dbb1f80a867467de6233d7865af2e06a7d7b76c7d3` |
| alexgreensh/attention-span         | `8a6e2250dbc1dfb1b4186e03a92484d8c799c1b0` | `output-styles/attention-kind.md`                                   | `0531c425fa5dd4999f15f834e64eaed3003eebbc` | `959c0ff96c80ae5f6c007618951cae339340ed586b3b1a7bb5970cf229344ece` |
| alexgreensh/attention-span         | `8a6e2250dbc1dfb1b4186e03a92484d8c799c1b0` | `output-styles/rundown.md`                                          | `9f67139496e3a12700507a3cf2598171b6bdac35` | `c78fd3f8e2c8e6a96515a48e4c32acef2dc6456cdec9aafadd5c53524bd19ced` |
| obra/superpowers                   | `2ce8aa15d05bd57213e6f746f953aafb7ded7a8b` | `skills/test-driven-development/writing-good-tests.md`              | `d3c4482fd30b4f9084bb61545fe73939a7502c28` | `51471c853306ff92ca8bb41dcaea05f31c0e46b03651f8f3c99754b7172f4ae1` |
| obra/superpowers                   | `2ce8aa15d05bd57213e6f746f953aafb7ded7a8b` | `skills/requesting-code-review/code-reviewer.md`                    | `6d358b5d7d450c83cacbe450b7dbd4e673b694ad` | `82e370be6b3447523816286195571e4216ba56ba1ad6ad0e87862294c4c78dcb` |
| obra/superpowers                   | `2ce8aa15d05bd57213e6f746f953aafb7ded7a8b` | `skills/subagent-driven-development/implementer-prompt.md`          | `5c8ecd61fba036263bf88d0af24d47125780efa0` | `81dd9d5a3fb0b09b96b5829f03b9796842f3199ef7591d1ba1c2db2a515f64d0` |
| obra/superpowers                   | `2ce8aa15d05bd57213e6f746f953aafb7ded7a8b` | `skills/subagent-driven-development/task-reviewer-prompt.md`        | `5c619bc510440b7bf156e78c4dfc60f198963cf0` | `bfed55c8f19d0ff6ed57b0fe09127c92890e9311c6c73917129598826bf9ebe8` |
| obra/superpowers                   | `2ce8aa15d05bd57213e6f746f953aafb7ded7a8b` | `skills/subagent-driven-development/references/resuming.md`         | `409b826eb8c875c51dd3799add37fcaab43b69b3` | `ff6e38bde2276faa2a7e93513086caded0ea10edbf2ec7f349a7e3b0d7c668c4` |
| obra/superpowers                   | `2ce8aa15d05bd57213e6f746f953aafb7ded7a8b` | `skills/subagent-driven-development/references/preflight.md`        | `170164883949e00aace6297b600b2c5a72bc6d5a` | `3ea21c5fc1af1a190ac8a9d19ceb0849b47bf2ffe27b87dffcc21b6a0539776c` |
| obra/superpowers                   | `2ce8aa15d05bd57213e6f746f953aafb7ded7a8b` | `skills/subagent-driven-development/references/batching.md`         | `6224e4ba255ed8359d608aaa4b8af785b6fdee70` | `b54dc7e23dbfb90db89bcb2fb3af591aabf6a271a165fbc0da4c6f9439980eac` |
| obra/superpowers                   | `2ce8aa15d05bd57213e6f746f953aafb7ded7a8b` | `skills/subagent-driven-development/references/handling-reports.md` | `cf91cdcddde1e051bf2fc51329197af4063b9dbc` | `8f759cdd4936220c38aab05b6d6c48c6df8ac8f146b0f37a6d2facbf87133c67` |
| obra/superpowers                   | `2ce8aa15d05bd57213e6f746f953aafb7ded7a8b` | `skills/subagent-driven-development/references/cannot-verify.md`    | `e952f2d40c2646840f33f7856707f08828cbd46a` | `e698713a15e0eabf1a2ab26ffe1bb04bf70c9d6d2e2060d44a0f9a1bdd4408bf` |
| obra/superpowers                   | `2ce8aa15d05bd57213e6f746f953aafb7ded7a8b` | `skills/subagent-driven-development/references/final-review.md`     | `851a5c5520cbb377b823229cbfdf441dcd79ac27` | `2fd999d86e5dd0b9b32aaf93f2a41663ef30b3e3cb78fb2fd5cb450eb59eb9de` |
| obra/superpowers                   | `2ce8aa15d05bd57213e6f746f953aafb7ded7a8b` | `skills/subagent-driven-development/references/fix-loop.md`         | `0b476e92a068af56113ff0a5c9c7ebef1afe7d2c` | `eafff1f801af2ced86e8761f3eeef04b701860d986ba5d0a8b20d506a75104bb` |

## Status

- All requested six repositories and 29 necessary instruction/reference files retrieved successfully (zero fetch errors).
- Superpowers applicable instruction files and required referenced `.md` resources pinned.
- Counsel owner: TL/PM must ensure each worker independently reads its relevant pinned instructions.
- No scripts executed or modifications made to the target `code-anime` repository.
