// FrontierCS 2 page: data and interaction. Task list, Table 1 runs and case-study traces come from the FrontierCS 2 paper repo
// (notes/tasks.tsv, notes/check_numbers.py, fig/case_*.py). index.md holds the markup, assets/css/fcs2.css the page styles.
// Shared data, from the paper repo: notes/tasks.tsv, Table 1 runs (notes/check_numbers.py), fig/case_*.py.
const TASKS_RAW = [["Programming Language", "BABBLE", "BABBLE: Learning Better Abstractions with E-Graphs and Anti-unification", "https://dl.acm.org/doi/epdf/10.1145/3571207", "https://github.com/dcao/babble"], ["Programming Language", "Szalinski", "Synthesizing Structured CAD Models with Equality Saturation and Inverse Transformations", "https://dl.acm.org/doi/10.1145/3385412.3386012", "https://github.com/uwplse/szalinski.git"], ["Programming Language", "Polygon", "Polygon: Symbolic Reasoning for SQL using Conflict-Driven Under-Approximation Search", "https://dl.acm.org/doi/10.1145/3729303", "https://arxiv.org/pdf/2504.06542"], ["Programming Language", "egg", "egg: Fast and Extensible Equality Saturation", "https://arxiv.org/abs/2004.03082", ""], ["Programming Language", "Ruler", "Ruler: Rewrite Rule Inference Using Equality Saturation", "https://ztatlock.net/pub-2021-oopsla-ruler.html", ""], ["Programming Language", "MBA e-graphs", "Simplifying MBA Expression Using E-Graphs", "https://arxiv.org/abs/2404.05431", ""], ["Programming Language", "Glenside", "Glenside: Pure Tensor Program Rewriting via Access Patterns", "https://arxiv.org/abs/2105.09377", ""], ["Programming Language", "TenSat", "TenSat: Equality Saturation for Tensor Graph Superoptimization", "https://proceedings.mlsys.org/paper_files/paper/2021/file/cc427d934a7f6c0663e5923f49eba531-Paper.pdf", ""], ["Programming Language", "ACC Saturator", "ACC Saturator: Automatic Kernel Optimization for Directive-Based GPU Code", "https://arxiv.org/abs/2306.13002", ""], ["Security", "Spectre", "Spectre Attacks: Exploiting Speculative Execution", "https://mlq.me/download/spectre-cacm.pdf", ""], ["Security", "Adaptive attacks", "The Attacker Moves Second: Stronger Adaptive Attacks Bypass Defenses Against LLM Jailbreaks and Prompt Injections", "https://arxiv.org/pdf/2510.09023", ""], ["Security", "Progent", "Progent: Securing AI Agents with Privilege Control", "https://arxiv.org/pdf/2504.11703", "https://github.com/sunblaze-ucb/progent"], ["Security", "Opal", "Opal: Private Memory for Personal AI", "https://arxiv.org/pdf/2604.02522", ""], ["Security", "Hacking Blind", "Hacking Blind", "https://www.ieee-security.org/TC/SP2014/papers/HackingBlind.pdf", ""], ["Robotics", "Diffusion Policy", "Diffusion Policy", "https://diffusion-policy.cs.columbia.edu/", "https://github.com/real-stanford/diffusion_policy"], ["Robotics", "MuJoCo Playground", "MuJoCo Playground", "https://arxiv.org/pdf/2502.08844v1", "https://github.com/google-deepmind/mujoco_playground"], ["Network", "MetaOpt", "MetaOpt", "https://dl.acm.org/doi/10.1145/3718958.3754348", "https://github.com/microsoft/MetaOpt"], ["Network", "Shockwave", "Dynamic cluster scheduling for GPU workloads", "https://arxiv.org/pdf/2210.00093", "https://github.com/uw-mad-dash/shockwave"], ["Network", "BBQ", "Hardware packet scheduling", "https://www.usenix.org/system/files/nsdi24-atre.pdf", "https://github.com/cmu-snap/BBQ"], ["Network", "RedTE", "Distributed TE", "https://cs.stanford.edu/~keithw/sigcomm2024/sigcomm24-final237-acmpaginated.pdf", "https://github.com/NASP-THU/RedTE"], ["MLSys", "SVG-EAR", "SVG-EAR: Parameter-Free Linear Compensation for Sparse Video Generation via Error-aware Routing", "https://arxiv.org/abs/2603.08982", "https://github.com/svg-project/Sparse-VideoGen"], ["MLSys", "AWQ", "AWQ: Activation-aware Weight Quantization for LLM Compression and Acceleration", "https://arxiv.org/pdf/2306.00978", ""], ["MLSys", "StreamingLLM", "Efficient Streaming Language Models with Attention Sinks", "https://arxiv.org/pdf/2309.17453", ""], ["MLSys", "KIVI", "KIVI: A Tuning-Free Asymmetric 2bit Quantization for KV Cache", "https://arxiv.org/pdf/2402.02750", ""], ["MLSys", "dbscan kernel", "GPU DBSCAN kernel (flashlib)", "https://flashml-org.github.io/", "https://github.com/FlashML-org/flashlib"], ["MLSys", "ivf_pq kernel", "GPU IVF-PQ search kernel (flashlib)", "https://flashml-org.github.io/", "https://github.com/FlashML-org/flashlib"], ["MLSys", "kmeans kernel", "GPU k-means kernel (flashlib)", "https://flashml-org.github.io/", "https://github.com/FlashML-org/flashlib"], ["MLSys", "knn kernel", "GPU k-nearest-neighbor kernel (flashlib)", "https://flashml-org.github.io/", "https://github.com/FlashML-org/flashlib"], ["MLSys", "Hydragen", "Hydragen: High-Throughput LLM Inference with Shared Prefixes", "https://arxiv.org/abs/2402.05099", ""], ["MLSys", "Wanda", "A Simple and Effective Pruning Approach for Large Language Models", "https://arxiv.org/abs/2306.11695", ""], ["MLSys", "FastV", "An Image is Worth 1/2 Tokens After Layer 2: Plug-and-Play Inference Acceleration for Large Vision-Language Models", "https://arxiv.org/pdf/2403.06764", ""], ["MLSys", "DeepCache", "DeepCache: Accelerating Diffusion Models for Free", "https://arxiv.org/pdf/2312.00858", ""], ["MLSys", "SVG2", "Sparse VideoGen2: Accelerate Video Generation with Sparse Attention via Semantic-Aware Permutation", "https://arxiv.org/pdf/2502.01776", ""], ["MLSys", "Lookahead", "Break the Sequential Dependency of LLM Inference Using Lookahead Decoding", "https://arxiv.org/pdf/2402.02057", ""], ["MLSys", "SliceGPT", "SliceGPT: Compress Large Language Models by Deleting Rows and Columns", "https://arxiv.org/pdf/2401.15024", ""], ["MLSys", "Continuum", "Continuum: Efficient and Robust Multi-Turn LLM Agent Scheduling with KV Cache Time-to-Live", "https://arxiv.org/abs/2511.02230", "https://github.com/Hanchenli/vllm-continuum"], ["Arch", "Clusterwise SpGEMM", "Improving SpGEMM Performance Through Matrix Reordering and Cluster-wise Computation", "https://arxiv.org/abs/2507.21253", "https://github.com/PASSIONLab/clusterwise-spgemm"], ["Arch", "Stream-K", "Stream-K: Work-centric Parallel Decomposition for Dense Matrix-Matrix Multiplication on the GPU", "https://arxiv.org/abs/2301.03598", "https://github.com/NVIDIA/cutlass"], ["Arch", "KAMI", "KAMI: Communication-Avoiding General Matrix Multiplication within a Single GPU", "https://doi.org/10.1145/3712285.3759895", "https://github.com/SuperScientificSoftwareLaboratory/KAMI"], ["Medical AI", "MIRA", "MIRA: Medical Time Series Foundation Model for Real-World Health Data", "https://arxiv.org/abs/2506.07584", "https://github.com/microsoft/MIRA"], ["Crypto", "Zelda", "Zelda: Efficient Multi-server Preprocessing PIR with Unconditional Security", "https://eprint.iacr.org/2025/1340.pdf", "https://github.com/p-b-p-b/Zelda"], ["Crypto", "QuarterPIR", "Efficient Pre-processing PIR Without Public-Key Cryptography", "https://eprint.iacr.org/2023/1574", "https://github.com/wuwuz/QuarterPIR/"], ["Crypto", "Piano", "Piano: Extremely Simple, Single-server Private Information Retrieval with Sublinear Server Computation", "https://eprint.iacr.org/2023/452.pdf", "https://github.com/wuwuz/Piano-PIR-new"], ["Crypto", "Structured LWE", "Structured-LWE public witness recovery (authored for the benchmark)", "", ""], ["Machine Learning", "nanoslm", "Hybrid small-language-model architecture design (reference: Olmo Hybrid)", "https://arxiv.org/abs/2604.03444", ""], ["Machine Learning", "nanowm speedup", "Nano World Model rollout speedup", "https://arxiv.org/abs/2605.23993", "https://github.com/simchowitzlabpublic/nano-world-model"], ["Machine Learning", "nanowm stability", "Nano World Model rollout stability", "https://arxiv.org/abs/2605.23993", "https://github.com/simchowitzlabpublic/nano-world-model"], ["Machine Learning", "Polar Express", "Polar Express", "https://arxiv.org/abs/2505.16932", "https://github.com/NoahAmsel/PolarExpress"], ["Machine Learning", "LeJEPA", "LeJEPA World Model", "https://arxiv.org/abs/2605.26379", "https://github.com/klindtlab/lejepa-identifiability"], ["Machine Learning", "HRM", "HRM", "https://arxiv.org/abs/2506.21734", "https://github.com/sapientinc/HRM"], ["Machine Learning", "MoM", "Mixture of Memories (MoM)", "https://arxiv.org/abs/2502.13685", "https://github.com/OpenSparseLLMs/MoM"], ["Machine Learning", "Nano World Model", "Nano World Model", "https://arxiv.org/abs/2605.23993", "https://github.com/simchowitzlabpublic/nano-world-model"], ["Machine Learning", "DFlash", "DFlash", "https://arxiv.org/abs/2602.06036", "https://github.com/z-lab/dflash"], ["Machine Learning", "RAGEN", "RAGEN", "https://arxiv.org/abs/2504.20073", "https://github.com/mll-lab-nu/RAGEN"], ["Machine Learning", "JiT", "JiT", "https://arxiv.org/abs/2511.13720", "https://github.com/LTH14/JiT"], ["Machine Learning", "DyT", "Dynamic Tanh (DyT)", "https://arxiv.org/abs/2503.10622", "https://github.com/jiachenzhu/DyT"], ["Machine Learning", "CLIPPO", "CLIPPO", "https://arxiv.org/abs/2212.08045", "https://github.com/google-research/big_vision"], ["Machine Learning", "MoE overfitting", "Data Scarcity and Model Sparsity: Mixtures-of-Experts Overfit More to Repeated Data", "https://arxiv.org/abs/2609.11917", ""], ["Language Modeling", "ACE", "Agentic Context Engineering: Evolving Contexts for Self-Improving Language Models", "https://arxiv.org/abs/2510.04618", "https://github.com/ace-agent/ace"], ["Language Modeling", "Meta Context Engineering", "Meta Context Engineering via Agentic Skill Evolution", "https://arxiv.org/abs/2601.21557", "https://github.com/metaevo-ai/meta-context-engineering"], ["Language Modeling", "Meta-Harness", "Meta-Harness: End-to-End Optimization of Model Harnesses", "https://arxiv.org/abs/2603.28052", "https://github.com/stanford-iris-lab/meta-harness"], ["Language Modeling", "Self-Harness", "Self-Harness: Harnesses That Improve Themselves", "https://arxiv.org/abs/2606.09498", "https://github.com/qzzqzzb/Self-Harness"], ["Database", "ScaleGPM", "Accurate and Fast Approximate Graph Pattern Mining at Scale", "https://www.vldb.org/pvldb/vol18/p93-chen.pdf", "https://anonymous.4open.science/r/scale-gpm-B987/"], ["Database", "SCOPE", "Fast Local Subgraph Counting", "https://www.vldb.org/pvldb/vol17/p1967-li.pdf", "https://github.com/magic62442/subgraph-counting"], ["Database", "Yannakakis", "Instance-Optimal Acyclic Join Processing Without Regret: Engineering the Yannakakis Algorithm in Column Stores", "https://www.vldb.org/pvldb/vol18/p2413-vansummeren.pdf", "https://github.com/UHasselt-DSI-Data-Systems-Lab/code-reproducability-yannakakis-vldb2025"], ["Database", "Seer", "Seer: Accelerating Blockchain Transaction Execution by Fine-Grained Branch Prediction", "https://www.vldb.org/pvldb/vol18/p822-xiao.pdf", "https://github.com/CGCL-codes/SeerEVM"], ["Database", "Spectrum", "Spectrum: Speedy and Strictly-Deterministic Smart Contract Transactions for Blockchain Ledgers", "https://www.vldb.org/pvldb/vol17/p2541-zhang.pdf", "https://github.com/jacklightChen/spectrum"], ["Database", "SemJoin", "SemJoin: Semantic Join Optimization (needs API)", "https://arxiv.org/pdf/2606.29532", "https://github.com/Kronk12/CS-541-Semantic-Join-Exploration"], ["HPC", "RegionsSort", "Theoretically-Efficient and Practical Parallel In-Place Radix Sorting", "https://jshun.csail.mit.edu/RegionsSort.pdf", "https://github.com/omarobeya/parallel-inplace-radixsort"], ["HPC", "Parallel DBSCAN", "Theoretically-Efficient and Practical Parallel DBSCAN", "https://jshun.csail.mit.edu/dbscan.pdf", "https://github.com/wangyiqiu/dbscan"], ["HPC", "Hygra", "Practical Parallel Hypergraph Algorithms", "https://jshun.csail.mit.edu/hygra.pdf", "https://github.com/jshun/ligra"], ["HPC", "ParButterfly", "Parallel Algorithms for Butterfly Computations", "https://jshun.csail.mit.edu/butterfly.pdf", "https://github.com/jeshi96/parbutterfly"], ["HPC", "ConnectIt", "ConnectIt: A Framework for Static and Incremental Parallel Graph Connectivity Algorithms", "https://jshun.csail.mit.edu/connectit.pdf", "https://github.com/ParAlg/gbbs/tree/master/benchmarks/Connectivity/ConnectIt"], ["Programming Language", "Type-constrained decoding", "Type-Constrained Code Generation with Language Models", "https://arxiv.org/abs/2504.09246", ""], ["Programming Language", "Generative Compilation", "Generative Compilation: On-the-Fly Compiler Feedback as AI Generates Code", "https://arxiv.org/abs/2607.13921", ""], ["Programming Language", "CIll", "CIll: CTI-Guided Invariant Generation via LLMs for Model Checking", "https://arxiv.org/abs/2602.23389", "https://github.com/gipsyh/rIC3"], ["SE", "QFuzz", "QFuzz: Quantitative Fuzzing for Side Channels", "https://arxiv.org/abs/2106.03346", "https://github.com/yannicnoller/qfuzz"], ["SE", "CUTE", "CUTE: A Concolic Unit Testing Engine for C", "https://dl.acm.org/doi/pdf/10.1145/1095430.1081750", ""], ["SE", "ItyFuzz", "ItyFuzz: Snapshot-Based Fuzzer for Smart Contract", "https://arxiv.org/abs/2306.17135", ""], ["SE", "Zest", "Semantic Fuzzing with Zest", "https://arxiv.org/abs/1812.00078", ""], ["Machine Learning", "KV compaction", "Fast KV Compaction via Attention Matching", "https://arxiv.org/abs/2602.16284", ""], ["Machine Learning", "DepthBench", "DepthBench: Measuring How Residual Connections Enable More Computational Depth", "https://arxiv.org/abs/2609.32534", ""], ["Machine Learning", "Gigatoken", "Gigatoken: 1000x faster byte-pair-encoding tokenization on CPUs", "", "https://github.com/marcelroed/gigatoken"], ["Machine Learning", "WeirdML", "WeirdML v3: hand-made machine-learning tasks for agents", "https://htihle.github.io/weirdml.html", ""], ["Machine Learning", "Synthetic pre-pretraining", "Synthetic Pre-pretraining Survives Scale, but Not as a Grammatical Prior", "https://arxiv.org/abs/2609.39827", ""], ["Machine Learning", "nanoswe", "nanoswe: training a software-engineering agent from scratch on a fixed compute budget", "https://www.nanoswe.com/", "https://github.com/nanosweb/nanoswe"], ["Machine Learning", "SWE-2 reward", "Extending SWE-2’s Reward Function to Steer the Pareto Frontier", "https://anishlk.com/swe-2-extended/", "https://github.com/anish-lakkapragada/swe-2-extended"], ["Machine Learning", "Local Support Learning", "Local Support Learning", "https://arxiv.org/abs/2610.02126", "https://assafbk.github.io/lsl"], ["MLSys", "LeapQuant", "LeapQuant: Efficient Linear Attention with Accurate Recurrent State Quantization", "https://arxiv.org/abs/2609.38166", "https://github.com/NVlabs/kda/pull/10"], ["Arch", "Berti prefetcher", "Pushing the Limits of the Berti Prefetcher", "https://webdiis.unizar.es/~agusnt/PDF/26/26_DPC4-BertiGo.pdf", "https://github.com/CMU-SAFARI/DPC4/tree/main/submissions/BertiGO/BertiGo"], ["Arch", "RUNLTS", "RUNLTS: Register-value-aware Predictor Utilizing Nested Large Tables", "https://ericrotenberg.wordpress.ncsu.edu/files/2025/06/cbp2025-final44-Koizumi.pdf", "https://github.com/ramisheikh/cbp2025"], ["Crypto", "CKKS noise", "Accurate and Composable Noise Estimates for CKKS with Application to Exact HE Computation", "https://eprint.iacr.org/2024/853.pdf", "https://github.com/tuneinsight/ckks-noise-estimator"]];   // [domain, short name, paper title, paper url, code url]
const SHOWN = {'Medical AI':'Medical','Arch':'Architecture','Crypto':'Cryptography','SE':'Software Engineering','Programming Language':'Programming Languages'};
const AREAS = [
  {k:'sys', name:'Systems', d:['MLSys','Architecture','HPC','Network']},
  {k:'ml',  name:'Machine learning', d:['Machine Learning','Language Modeling','Medical']},
  {k:'pl',  name:'Languages & SE', d:['Programming Languages','Software Engineering']},
  {k:'sec', name:'Security & crypto', d:['Security','Cryptography']},
  {k:'db',  name:'Databases', d:['Database']},
  {k:'rb',  name:'Robotics', d:['Robotics']},
];
const DOMAINS = AREAS.flatMap(a => a.d);
const AREA_OF = Object.fromEntries(AREAS.flatMap(a => a.d.map(d => [d, a])));
const TASKS = TASKS_RAW.map(([d, s, t, p, r]) => ({d: SHOWN[d] || d, s, t: t === s ? '' : t, p, r: /^https?:/.test(r) && !/arxiv\.org/.test(r) ? r : ''}));
const N_IN = d => TASKS.filter(t => t.d === d).length;

// One entry per scored run in the preview results database of 2026-10-08 (bin/fcs2_runs_from_db.py):
// model, domain, task, final score (0-100, the task's own scale), passed (1 = verdict PASS). Timeouts score 0; 23 unscored runs are left out; Kimi K2.7 Code is left out (only the ECI 0 point).
const RUNS = [["sol", "Database", "Yannakakis", 11.41, 0], ["sol", "Machine Learning", "Differentiable Population Statistics", 4.39, 0], ["sol", "HPC", "RegionsSort", 51.23, 0], ["sol", "Security", "Progent", 93.16, 0], ["sol", "Robotics", "MuJoCo Playground", 37.97, 0], ["sol", "HPC", "RegionsSort", 51.31, 0], ["sol", "HPC", "Hygra", 45.42, 0], ["sol", "Machine Learning", "Polar Express", 60.79, 1], ["sol", "Machine Learning", "DyT", 61.11, 1], ["sol", "HPC", "ParButterfly", 56.41, 1], ["sol", "Robotics", "Diffusion Policy", 57.55, 0], ["sol", "Architecture", "KAMI", 16.34, 0], ["sol", "Database", "Approximate-MIPS Query Stopping", 81.55, 0], ["sol", "Machine Learning", "Robust Image Tokenizer", 70.76, 0], ["sol", "MLSys", "dbscan kernel", 69.79, 1], ["sol", "MLSys", "knn kernel", 39.97, 1], ["sol", "Database", "Persistent Treap Update Engine", 35.6, 1], ["sol", "Security", "Spectre", 81.4, 1], ["sol", "HPC", "ParButterfly", 53.41, 1], ["sol", "Cryptography", "Structured LWE", 79.5, 0], ["sol", "Programming Languages", "egg", 59.92, 0], ["sol", "Database", "Residual State Advancement", 46.23, 1], ["sol", "Network", "MetaOpt", 0.0, 0], ["sol", "Machine Learning", "Nano World Model", 79.84, 0], ["sol", "Database", "FARGO paper-aligned query core", 52.1, 1], ["sol", "MLSys", "SVG-EAR", 33.74, 0], ["sol", "Database", "Spectrum", 81.24, 1], ["sol", "MLSys", "ivf_pq kernel", 77.34, 0], ["sol", "Robotics", "MuJoCo Playground", 37.97, 0], ["sol", "Security", "Opal", 99.17, 0], ["sol", "Programming Languages", "BABBLE", 17.32, 0], ["sol", "Machine Learning", "RAGEN", 98.92, 1], ["sol", "Machine Learning", "Nano World Model", 81.21, 1], ["sol", "HPC", "Parallel DBSCAN", 76.57, 1], ["sol", "Security", "Adaptive attacks", 75.87, 0], ["sol", "HPC", "Hygra", 59.52, 0], ["sol", "MLSys", "knn kernel", 44.45, 1], ["sol", "Programming Languages", "egg", 60.89, 0], ["sol", "HPC", "Parallel DBSCAN", 76.96, 1], ["sol", "Machine Learning", "DyT", 66.28, 1], ["sol", "Security", "Adaptive attacks", 82.24, 1], ["sol", "Database", "Yannakakis", 12.2, 0], ["sol", "MLSys", "kmeans kernel", 44.72, 0], ["sol", "Database", "Approximate-MIPS Query Stopping", 69.23, 0], ["sol", "Programming Languages", "Polygon", 92.13, 1], ["sol", "Machine Learning", "Polar Express", 71.71, 1], ["sol", "Network", "Shockwave", 40.46, 0], ["sol", "Architecture", "Clusterwise SpGEMM", 91.13, 1], ["sol", "Database", "Spectrum", 82.84, 1], ["sol", "Network", "BBQ", 71.77, 1], ["sol", "MLSys", "SVG-EAR", 50.94, 1], ["sol", "Database", "SCOPE", 66.52, 1], ["sol", "Network", "BBQ", 66.09, 1], ["sol", "Database", "Persistent Treap Update Engine", 24.36, 1], ["sol", "Database", "ScaleGPM", 65.12, 0], ["sol", "Network", "Shockwave", 45.76, 0], ["sol", "Security", "Opal", 99.17, 0], ["sol", "Database", "Residual State Advancement", 0.06, 0], ["sol", "Machine Learning", "Robust Image Tokenizer", 73.22, 0], ["sol", "MLSys", "ivf_pq kernel", 78.01, 0], ["sol", "MLSys", "kmeans kernel", 45.77, 0], ["sol", "Machine Learning", "LeJEPA", 99.57, 1], ["sol", "MLSys", "dbscan kernel", 67.46, 1], ["sol", "Database", "Seer", 81.14, 1], ["muse", "Robotics", "Diffusion Policy", 54.98, 0], ["muse", "Database", "Yannakakis", 9.78, 0], ["muse", "HPC", "RegionsSort", 51.14, 1], ["muse", "Security", "Progent", 93.54, 0], ["muse", "Robotics", "MuJoCo Playground", 33.33, 0], ["muse", "HPC", "Hygra", 59.22, 1], ["muse", "HPC", "ParButterfly", 39.12, 1], ["muse", "Architecture", "KAMI", 7.85, 0], ["muse", "Machine Learning", "Robust Image Tokenizer", 70.53, 0], ["muse", "Database", "Persistent Treap Update Engine", 43.29, 1], ["muse", "Security", "Spectre", 80.5, 1], ["muse", "Cryptography", "Structured LWE", 56.0, 0], ["muse", "Programming Languages", "egg", 59.82, 0], ["muse", "Database", "Residual State Advancement", 4.29, 1], ["muse", "Network", "MetaOpt", 0.0, 0], ["muse", "Machine Learning", "Nano World Model", 78.78, 0], ["muse", "Database", "FARGO paper-aligned query core", 52.09, 1], ["muse", "Security", "Opal", 98.33, 0], ["muse", "Programming Languages", "BABBLE", 18.39, 0], ["muse", "Machine Learning", "RAGEN", 11.69, 0], ["muse", "Security", "Adaptive attacks", 81.27, 1], ["muse", "MLSys", "knn kernel", 23.36, 0], ["muse", "HPC", "Parallel DBSCAN", 78.53, 0], ["muse", "Machine Learning", "DyT", 50.95, 1], ["muse", "Database", "Approximate-MIPS Query Stopping", 82.17, 0], ["muse", "Programming Languages", "Polygon", 92.13, 1], ["muse", "Machine Learning", "Polar Express", 53.23, 1], ["muse", "Architecture", "Clusterwise SpGEMM", 80.89, 1], ["muse", "Database", "Spectrum", 2.26, 0], ["muse", "Security", "Hacking Blind", 100.0, 1], ["muse", "Network", "BBQ", 53.64, 1], ["muse", "MLSys", "SVG-EAR", 26.19, 0], ["muse", "Database", "SCOPE", 4.51, 0], ["muse", "Database", "ScaleGPM", 79.07, 0], ["muse", "Network", "Shockwave", 45.27, 0], ["muse", "MLSys", "ivf_pq kernel", 72.79, 0], ["muse", "MLSys", "kmeans kernel", 47.96, 0], ["muse", "Machine Learning", "LeJEPA", 82.01, 0], ["muse", "MLSys", "dbscan kernel", 39.8, 0], ["muse", "Database", "Seer", 81.14, 1], ["k3", "Security", "Adaptive attacks", 80.74, 1], ["k3", "Database", "Residual State Advancement", 17.17, 1], ["k3", "Machine Learning", "Differentiable Population Statistics", 3.42, 0], ["k3", "Security", "Progent", 93.5, 1], ["k3", "Database", "Spectrum", 0.21, 0], ["k3", "HPC", "Parallel DBSCAN", 76.17, 0], ["k3", "HPC", "ParButterfly", 48.45, 1], ["k3", "Machine Learning", "DyT", 51.47, 0], ["k3", "Machine Learning", "Polar Express", 65.23, 1], ["k3", "Robotics", "Diffusion Policy", 52.11, 0], ["k3", "Architecture", "KAMI", 18.45, 0], ["k3", "Machine Learning", "Nano World Model", 79.44, 0], ["k3", "Database", "Yannakakis", 11.82, 0], ["k3", "Security", "Spectre", 81.14, 1], ["k3", "Database", "Approximate-MIPS Query Stopping", 86.98, 0], ["k3", "Cryptography", "Structured LWE", 55.0, 0], ["k3", "MLSys", "kmeans kernel", 47.98, 0], ["k3", "Network", "MetaOpt", 52.01, 0], ["k3", "Database", "FARGO paper-aligned query core", 52.23, 0], ["k3", "HPC", "Hygra", 58.74, 1], ["k3", "MLSys", "knn kernel", 40.12, 1], ["k3", "Programming Languages", "egg", 59.38, 0], ["k3", "Machine Learning", "RAGEN", 10.62, 0], ["k3", "Database", "ScaleGPM", 83.05, 0], ["k3", "Robotics", "MuJoCo Playground", 37.97, 0], ["k3", "Machine Learning", "OCR Distillation Trajectory Sampling", 65.18, 0], ["k3", "MLSys", "dbscan kernel", 61.37, 0], ["k3", "Database", "Seer", 81.15, 1], ["k3", "Network", "BBQ", 66.09, 1], ["k3", "Security", "Opal", 99.17, 0], ["k3", "Programming Languages", "Polygon", 92.13, 1], ["k3", "HPC", "RegionsSort", 51.25, 1], ["k3", "MLSys", "ivf_pq kernel", 77.51, 0], ["k3", "Security", "Hacking Blind", 90.91, 0], ["k3", "Database", "Persistent Treap Update Engine", 20.77, 1], ["k3", "Database", "SCOPE", 13.94, 0], ["k3", "Programming Languages", "BABBLE", 18.89, 1], ["k3", "Machine Learning", "Robust Image Tokenizer", 71.32, 0], ["k3", "MLSys", "SVG-EAR", 27.79, 0], ["k3", "Network", "Shockwave", 46.29, 0], ["qwen", "Security", "Adaptive attacks", 80.74, 1], ["qwen", "Database", "Spectrum", 1.1, 0], ["qwen", "HPC", "Parallel DBSCAN", 71.88, 1], ["qwen", "HPC", "ParButterfly", 51.81, 1], ["qwen", "MLSys", "SVG-EAR", 7.72, 0], ["qwen", "Machine Learning", "Polar Express", 58.87, 1], ["qwen", "Database", "Yannakakis", 13.02, 0], ["qwen", "Cryptography", "Structured LWE", 58.0, 0], ["qwen", "HPC", "Hygra", 60.04, 1], ["qwen", "Programming Languages", "egg", 59.71, 0], ["qwen", "Database", "ScaleGPM", 79.99, 0], ["qwen", "Security", "Hacking Blind", 100.0, 1], ["qwen", "Robotics", "MuJoCo Playground", 33.33, 0], ["qwen", "Database", "Seer", 81.33, 1], ["qwen", "Security", "Opal", 99.17, 0], ["qwen", "HPC", "RegionsSort", 50.81, 0], ["qwen", "Database", "SCOPE", 21.02, 0], ["qwen", "Programming Languages", "BABBLE", 18.09, 0], ["qwen", "Network", "Shockwave", 45.93, 0], ["astra", "Security", "Adaptive attacks", 79.26, 0], ["astra", "HPC", "Parallel DBSCAN", 77.11, 1], ["astra", "HPC", "ParButterfly", 56.19, 1], ["astra", "Machine Learning", "Polar Express", 71.71, 1], ["astra", "Architecture", "KAMI", 22.04, 1], ["astra", "Machine Learning", "Nano World Model", 80.85, 1], ["astra", "Database", "Yannakakis", 12.68, 0], ["astra", "Security", "Spectre", 81.82, 1], ["astra", "Database", "Approximate-MIPS Query Stopping", 84.77, 0], ["astra", "Cryptography", "Structured LWE", 85.5, 0], ["astra", "MLSys", "kmeans kernel", 47.4, 0], ["astra", "Network", "MetaOpt", 0.0, 0], ["astra", "Database", "FARGO paper-aligned query core", 52.37, 1], ["astra", "HPC", "Hygra", 58.84, 1], ["astra", "MLSys", "knn kernel", 43.2, 1], ["astra", "Programming Languages", "egg", 61.31, 0], ["astra", "Machine Learning", "RAGEN", 98.92, 1], ["astra", "Database", "ScaleGPM", 90.31, 1], ["astra", "Robotics", "MuJoCo Playground", 100.0, 1], ["astra", "Database", "Seer", 81.27, 1], ["astra", "Network", "BBQ", 71.77, 1], ["astra", "Security", "Opal", 99.17, 0], ["astra", "Programming Languages", "Polygon", 92.13, 1], ["astra", "HPC", "RegionsSort", 51.26, 1], ["astra", "MLSys", "ivf_pq kernel", 78.45, 1], ["astra", "Database", "Persistent Treap Update Engine", 41.68, 1], ["astra", "Database", "SCOPE", 67.92, 1], ["astra", "Programming Languages", "BABBLE", 18.45, 0], ["astra", "Robotics", "Diffusion Policy", 57.01, 0], ["astra", "Network", "Shockwave", 47.03, 1], ["ds", "Security", "Adaptive attacks", 80.74, 1], ["ds", "Database", "Spectrum", 60.08, 0], ["ds", "HPC", "ParButterfly", 52.9, 1], ["ds", "Machine Learning", "DyT", 49.32, 0], ["ds", "Machine Learning", "Polar Express", 64.91, 1], ["ds", "Machine Learning", "Nano World Model", 80.55, 1], ["ds", "Database", "Yannakakis", 10.38, 0], ["ds", "Database", "Approximate-MIPS Query Stopping", 86.79, 0], ["ds", "Cryptography", "Structured LWE", 72.0, 0], ["ds", "MLSys", "kmeans kernel", 51.04, 1], ["ds", "Database", "FARGO paper-aligned query core", 52.21, 1], ["ds", "HPC", "Hygra", 58.72, 0], ["ds", "MLSys", "knn kernel", 7.85, 0], ["ds", "Programming Languages", "egg", 60.33, 0], ["ds", "Machine Learning", "RAGEN", 17.48, 0], ["ds", "Database", "ScaleGPM", 90.44, 1], ["ds", "Robotics", "MuJoCo Playground", 37.95, 0], ["ds", "MLSys", "dbscan kernel", 66.68, 1], ["ds", "Database", "Seer", 81.47, 1], ["ds", "Network", "BBQ", 66.09, 1], ["ds", "Security", "Opal", 99.17, 0], ["ds", "Programming Languages", "Polygon", 92.13, 1], ["ds", "HPC", "RegionsSort", 51.13, 1], ["ds", "MLSys", "ivf_pq kernel", 77.5, 1], ["ds", "Database", "Persistent Treap Update Engine", 36.7, 1], ["ds", "Database", "SCOPE", 26.81, 0], ["ds", "Programming Languages", "BABBLE", 17.47, 0], ["ds", "Machine Learning", "Robust Image Tokenizer", 73.12, 0], ["ds", "MLSys", "SVG-EAR", 30.64, 0], ["ds", "Network", "Shockwave", 44.32, 0], ["glm", "Security", "Adaptive attacks", 80.74, 1], ["glm", "Database", "Residual State Advancement", 9.33, 1], ["glm", "Machine Learning", "Differentiable Population Statistics", 4.51, 0], ["glm", "Security", "Progent", 92.99, 0], ["glm", "Database", "Spectrum", 78.62, 0], ["glm", "HPC", "Parallel DBSCAN", 76.49, 1], ["glm", "HPC", "ParButterfly", 54.81, 1], ["glm", "Machine Learning", "DyT", 48.82, 0], ["glm", "Machine Learning", "Polar Express", 61.32, 1], ["glm", "Robotics", "Diffusion Policy", 41.61, 0], ["glm", "Architecture", "KAMI", 20.51, 1], ["glm", "Machine Learning", "Nano World Model", 80.43, 1], ["glm", "Database", "Yannakakis", 10.03, 0], ["glm", "Security", "Spectre", 81.27, 1], ["glm", "Database", "Approximate-MIPS Query Stopping", 84.85, 0], ["glm", "Cryptography", "Structured LWE", 58.0, 0], ["glm", "MLSys", "kmeans kernel", 49.91, 0], ["glm", "Network", "MetaOpt", 0.0, 0], ["glm", "Database", "FARGO paper-aligned query core", 52.15, 1], ["glm", "HPC", "Hygra", 57.51, 0], ["glm", "MLSys", "knn kernel", 23.84, 0], ["glm", "Programming Languages", "egg", 61.4, 0], ["glm", "Machine Learning", "RAGEN", 32.75, 0], ["glm", "Database", "ScaleGPM", 87.97, 0], ["glm", "Robotics", "MuJoCo Playground", 33.33, 0], ["glm", "MLSys", "dbscan kernel", 59.96, 0], ["glm", "Database", "Seer", 81.21, 1], ["glm", "Network", "BBQ", 45.45, 1], ["glm", "Security", "Opal", 99.17, 0], ["glm", "Programming Languages", "Polygon", 92.13, 1], ["glm", "Architecture", "Clusterwise SpGEMM", 0.0, 0], ["glm", "HPC", "RegionsSort", 48.87, 0], ["glm", "MLSys", "ivf_pq kernel", 77.25, 1], ["glm", "Security", "Hacking Blind", 100.0, 1], ["glm", "Database", "Persistent Treap Update Engine", 10.39, 0], ["glm", "Database", "SCOPE", 31.17, 0], ["glm", "Programming Languages", "BABBLE", 18.34, 0], ["glm", "Machine Learning", "Robust Image Tokenizer", 72.1, 0], ["glm", "MLSys", "SVG-EAR", 0.0, 0], ["glm", "Network", "Shockwave", 46.54, 0]].map(([m, d, t, s, p]) => ({m, d, t, s, p}));
const MODELS = [
  {id:'astra', name:'GPT-6 Astra', short:'GPT-6 Astra', h:'Codex CLI', lab:'OpenAI'},
  {id:'sol', name:'GPT-6.1 Sol', short:'GPT-6.1 Sol', h:'Codex CLI', lab:'OpenAI'},
  {id:'muse', name:'Muse Spark 1.3', short:'Muse Spark', h:'Muse Code', lab:'Meta'},
  {id:'k3', name:'Kimi K3', short:'Kimi K3', h:'Kimi Code', lab:'Kimi'},
  {id:'qwen', name:'Qwen 3.8 Max', short:'Qwen 3.8 Max', h:'', lab:'Qwen'},
  {id:'ds', name:'DeepSeek V4.1 Flash', short:'DeepSeek V4.1', h:'DSH', lab:'DeepSeek'},
  {id:'glm', name:'GLM 5.3', short:'GLM 5.3', h:'ZCode', lab:'Z.ai'},
];
const UPDATED = 'October 8, 2026';
// FECI per model: [point, 90% low, 90% high, tasks]; Human (the authors' reference) is 60 and Kimi K2.7 Code is 0 (494 bootstrap draws kept, 6 dropped with the anchors inverted; pinned slope: Adaptive Robustness Evaluation for Prompt-Injection Defense).
// Pass rate per model: [percent, runs that pass, runs].
const PASS = {"astra": [66.7, 20, 30], "ds": [46.7, 14, 30], "glm": [35.0, 14, 40], "k3": [35.0, 14, 40], "muse": [37.5, 15, 40], "qwen": [36.8, 7, 19], "sol": [46.9, 30, 64]};
const ECI = {"astra": [84.3, 73.0, 148.9, 30], "sol": [80.5, 66.2, 133.5, 40], "muse": [53.7, 44.0, 91.4, 40], "k3": [54.5, 46.5, 96.6, 40], "qwen": [51.4, 36.4, 89.1, 19], "ds": [62.0, 53.2, 107.6, 30], "glm": [62.8, 45.8, 105.0, 40]};
const ECI_HUMAN = 60, ECI_LOW = 'k27', ECI_LOW_NAME = 'Kimi K2.7 Code', ECI_LOW_VALUE = 0, ECI_REF_TASKS = 38;
// Test-time scaling per model: [US$ budget per run, ECI, 90% low, 90% high, share of runs still going] (see the converter's docstring).
const SCALE = {"astra":[[0.001,-400.0,-400.0,-400.0,1.0],[0.00142,-400.0,-400.0,-400.0,1.0],[0.00201,-400.0,-400.0,-400.0,1.0],[0.00285,-400.0,-400.0,-400.0,1.0],[0.00403,-400.0,-400.0,-400.0,1.0],[0.0057,-400.0,-400.0,-400.0,1.0],[0.00807,-400.0,-400.0,-400.0,1.0],[0.01143,-400.0,-400.0,-400.0,1.0],[0.01619,-400.0,-400.0,-400.0,1.0],[0.02292,-400.0,-400.0,-400.0,1.0],[0.03246,-400.0,-400.0,-400.0,1.0],[0.04596,-400.0,-400.0,-400.0,1.0],[0.06509,-400.0,-400.0,-400.0,1.0],[0.09218,-400.0,-400.0,-400.0,1.0],[0.13055,-400.0,-400.0,-400.0,1.0],[0.18488,-400.0,-400.0,-400.0,1.0],[0.26182,-400.0,-400.0,-400.0,1.0],[0.37079,-400.0,-400.0,-400.0,1.0],[0.52511,-400.0,-400.0,-354.9,1.0],[0.74366,-26.7,-309.0,-2.0,1.0],[1.05318,-5.4,-44.7,13.3,1.0],[1.49151,17.9,2.3,39.1,0.97],[2.11227,27.3,17.7,47.2,0.97],[2.9914,48.9,31.5,57.1,0.83],[4.23642,59.1,46.0,74.2,0.73],[5.99962,75.2,54.6,80.0,0.6],[8.49666,81.6,78.8,86.4,0.33],[12.03298,82.9,73.6,86.4,0.13],[17.04112,83.6,78.1,87.6,0.13],[24.13365,84.1,79.0,88.2,0.07],[34.1781,84.2,80.3,89.8,0.03],[48.40306,84.3,80.3,89.1,0.0]],"ds":[[0.001,-400.0,-400.0,-400.0,1.0],[0.00123,-400.0,-400.0,-400.0,1.0],[0.0015,-400.0,-400.0,-400.0,1.0],[0.00184,-400.0,-400.0,-400.0,1.0],[0.00225,-400.0,-400.0,-400.0,1.0],[0.00275,-400.0,-400.0,-400.0,1.0],[0.00337,-400.0,-400.0,-400.0,1.0],[0.00412,-400.0,-400.0,-400.0,1.0],[0.00505,-400.0,-400.0,-400.0,1.0],[0.00618,-400.0,-400.0,-400.0,1.0],[0.00756,-400.0,-400.0,-400.0,1.0],[0.00925,-400.0,-400.0,-400.0,1.0],[0.01133,-400.0,-400.0,-400.0,1.0],[0.01387,-400.0,-400.0,-400.0,1.0],[0.01697,-400.0,-400.0,-400.0,1.0],[0.02078,-400.0,-400.0,-400.0,1.0],[0.02543,-400.0,-400.0,-400.0,1.0],[0.03113,-400.0,-400.0,-400.0,1.0],[0.03811,-400.0,-400.0,-152.5,1.0],[0.04665,-400.0,-400.0,-46.4,1.0],[0.0571,-41.5,-400.0,-13.4,1.0],[0.0699,-35.9,-400.0,-10.3,0.97],[0.08557,-13.6,-400.0,-1.5,0.97],[0.10474,3.3,-285.1,21.1,0.97],[0.12822,13.8,-10.7,31.8,0.93],[0.15696,29.5,14.8,47.1,0.83],[0.19214,38.0,23.9,47.1,0.67],[0.2352,46.6,31.8,57.3,0.67],[0.28792,60.4,56.0,61.4,0.43],[0.35245,62.2,60.7,63.2,0.27],[0.43145,62.3,60.5,64.0,0.2],[0.52816,62.0,60.8,63.5,0.0]],"glm":[[0.001,-400.0,-400.0,-400.0,1.0],[0.00139,-400.0,-400.0,-400.0,1.0],[0.00191,-400.0,-400.0,-400.0,1.0],[0.00264,-400.0,-400.0,-400.0,1.0],[0.00364,-400.0,-400.0,-400.0,1.0],[0.00503,-400.0,-400.0,-400.0,1.0],[0.00694,-400.0,-400.0,-400.0,1.0],[0.00959,-400.0,-400.0,-400.0,1.0],[0.01324,-400.0,-400.0,-400.0,1.0],[0.01828,-400.0,-400.0,-400.0,1.0],[0.02524,-400.0,-400.0,-400.0,1.0],[0.03486,-400.0,-400.0,-400.0,1.0],[0.04814,-400.0,-400.0,-400.0,1.0],[0.06648,-400.0,-400.0,-400.0,1.0],[0.09182,-400.0,-400.0,-400.0,1.0],[0.1268,-400.0,-400.0,-400.0,1.0],[0.17512,-400.0,-400.0,-400.0,1.0],[0.24184,-400.0,-400.0,-400.0,1.0],[0.33399,-400.0,-400.0,-400.0,1.0],[0.46125,-400.0,-400.0,-400.0,1.0],[0.637,-400.0,-400.0,-400.0,1.0],[0.87973,-400.0,-400.0,-281.9,1.0],[1.21494,-400.0,-400.0,-228.8,1.0],[1.67788,-400.0,-400.0,-225.0,1.0],[2.31723,-400.0,-400.0,-251.5,0.95],[3.20018,-129.1,-400.0,-40.1,0.93],[4.41959,-5.7,-94.9,26.5,0.8],[6.10363,27.9,13.0,62.1,0.62],[8.42938,61.2,37.8,63.6,0.47],[11.64132,62.2,48.2,64.5,0.4],[16.07716,62.8,53.6,64.2,0.2],[22.20323,62.8,51.5,64.4,0.0]],"k3":[[0.001,-400.0,-400.0,-400.0,1.0],[0.00142,-400.0,-400.0,-400.0,1.0],[0.00199,-400.0,-400.0,-400.0,1.0],[0.00281,-400.0,-400.0,-400.0,1.0],[0.00396,-400.0,-400.0,-400.0,1.0],[0.00559,-400.0,-400.0,-400.0,1.0],[0.00788,-400.0,-400.0,-400.0,1.0],[0.01111,-400.0,-400.0,-400.0,1.0],[0.01567,-400.0,-400.0,-400.0,1.0],[0.0221,-400.0,-400.0,-400.0,1.0],[0.03117,-400.0,-400.0,-400.0,1.0],[0.04396,-400.0,-400.0,-400.0,1.0],[0.06201,-400.0,-400.0,-400.0,1.0],[0.08746,-400.0,-400.0,-400.0,1.0],[0.12336,-400.0,-400.0,-400.0,1.0],[0.174,-400.0,-400.0,-400.0,1.0],[0.24542,-400.0,-400.0,-400.0,1.0],[0.34615,-400.0,-400.0,-400.0,1.0],[0.48824,-400.0,-400.0,-281.1,1.0],[0.68866,-225.3,-400.0,-136.6,1.0],[0.97134,-51.2,-129.5,-25.8,1.0],[1.37006,-50.1,-108.5,-19.7,0.93],[1.93244,-32.1,-58.0,14.5,0.88],[2.72568,27.2,11.0,38.3,0.75],[3.84452,40.6,27.1,52.0,0.65],[5.42264,51.6,46.3,57.6,0.47],[7.64855,52.5,49.2,58.2,0.38],[10.78816,53.6,51.1,60.4,0.25],[15.21654,54.5,52.9,61.1,0.17],[21.46269,54.7,53.0,63.4,0.07],[30.2728,54.5,52.5,62.0,0.03],[42.69932,54.5,52.5,60.8,0.0]],"muse":[[0.001,-400.0,-400.0,-400.0,1.0],[0.00147,-400.0,-400.0,-400.0,1.0],[0.00214,-400.0,-400.0,-400.0,1.0],[0.00312,-400.0,-400.0,-400.0,1.0],[0.00456,-400.0,-400.0,-400.0,1.0],[0.00665,-400.0,-400.0,-400.0,1.0],[0.00972,-400.0,-400.0,-400.0,1.0],[0.01419,-400.0,-400.0,-400.0,1.0],[0.02072,-400.0,-400.0,-400.0,1.0],[0.03026,-400.0,-400.0,-400.0,1.0],[0.0442,-400.0,-400.0,-400.0,1.0],[0.06456,-400.0,-400.0,-400.0,1.0],[0.0943,-400.0,-400.0,-400.0,1.0],[0.13773,-400.0,-400.0,-400.0,1.0],[0.20117,-400.0,-400.0,-400.0,1.0],[0.29383,-400.0,-400.0,-400.0,1.0],[0.42918,-400.0,-400.0,-400.0,1.0],[0.62687,-400.0,-400.0,-400.0,1.0],[0.91562,-400.0,-400.0,-400.0,1.0],[1.33738,-400.0,-400.0,-285.8,1.0],[1.95342,-288.9,-400.0,-93.8,1.0],[2.85321,-104.5,-400.0,-74.6,0.97],[4.16748,-44.8,-93.9,14.0,0.95],[6.08714,11.5,-22.8,24.9,0.88],[8.89104,29.7,18.4,43.4,0.75],[12.98651,42.8,34.7,52.5,0.6],[18.96846,47.1,38.9,53.4,0.42],[27.70586,47.5,38.4,54.0,0.4],[40.46796,48.2,39.1,54.1,0.25],[59.10864,53.8,51.9,61.1,0.15],[86.33574,53.9,51.8,60.1,0.05],[126.10442,53.7,51.5,59.7,0.0]],"qwen":[[0.001,-400.0,-400.0,-400.0,1.0],[0.00138,-400.0,-400.0,-400.0,1.0],[0.00188,-400.0,-400.0,-400.0,1.0],[0.00258,-400.0,-400.0,-400.0,1.0],[0.00354,-400.0,-400.0,-400.0,1.0],[0.00485,-400.0,-400.0,-400.0,1.0],[0.00664,-400.0,-400.0,-400.0,1.0],[0.00911,-400.0,-400.0,-400.0,1.0],[0.01248,-400.0,-400.0,-400.0,1.0],[0.01711,-400.0,-400.0,-400.0,1.0],[0.02346,-400.0,-400.0,-400.0,1.0],[0.03216,-400.0,-400.0,-400.0,1.0],[0.04409,-400.0,-400.0,-400.0,1.0],[0.06045,-400.0,-400.0,-400.0,1.0],[0.08287,-400.0,-400.0,-400.0,1.0],[0.11361,-400.0,-400.0,-400.0,1.0],[0.15575,-400.0,-400.0,-400.0,1.0],[0.21352,-400.0,-400.0,-400.0,1.0],[0.29273,-400.0,-400.0,-400.0,1.0],[0.40132,-400.0,-400.0,-400.0,1.0],[0.55019,-400.0,-400.0,-400.0,1.0],[0.75429,-400.0,-400.0,-400.0,1.0],[1.0341,-400.0,-400.0,-353.2,1.0],[1.4177,-64.5,-400.0,-15.4,1.0],[1.94362,-59.7,-129.6,-8.4,0.95],[2.66462,-2.3,-39.8,12.9,0.95],[3.65309,37.8,25.6,44.0,0.84],[5.00825,43.4,39.1,47.3,0.74],[6.86612,45.3,37.9,51.8,0.63],[9.41318,50.7,46.5,57.0,0.42],[12.90511,50.8,47.8,57.3,0.16],[17.69242,51.4,47.6,58.2,0.0]],"sol":[[0.001,-400.0,-400.0,-400.0,1.0],[0.00133,-400.0,-400.0,-400.0,1.0],[0.00177,-400.0,-400.0,-400.0,1.0],[0.00235,-400.0,-400.0,-400.0,1.0],[0.00312,-400.0,-400.0,-400.0,1.0],[0.00414,-400.0,-400.0,-400.0,1.0],[0.0055,-400.0,-400.0,-400.0,1.0],[0.0073,-400.0,-400.0,-400.0,1.0],[0.0097,-400.0,-400.0,-400.0,1.0],[0.01289,-400.0,-400.0,-400.0,1.0],[0.01712,-400.0,-400.0,-400.0,1.0],[0.02273,-400.0,-400.0,-400.0,1.0],[0.0302,-400.0,-400.0,-400.0,1.0],[0.04011,-400.0,-400.0,-400.0,1.0],[0.05329,-400.0,-400.0,-400.0,1.0],[0.07078,-400.0,-400.0,-281.4,1.0],[0.09403,-202.2,-382.4,-121.5,1.0],[0.1249,-128.4,-207.6,-92.5,1.0],[0.16592,-93.8,-180.6,-59.6,1.0],[0.2204,8.9,-28.9,21.4,1.0],[0.29278,19.8,6.0,28.7,0.98],[0.38892,35.6,25.4,48.6,0.89],[0.51664,42.5,31.2,50.9,0.81],[0.6863,55.9,49.2,73.3,0.72],[0.91167,68.2,58.5,78.2,0.58],[1.21105,68.9,58.9,78.6,0.48],[1.60875,71.6,60.1,82.0,0.34],[2.13705,71.9,60.6,80.9,0.22],[2.83884,72.6,63.2,81.4,0.12],[3.77109,73.9,65.8,82.7,0.06],[5.00949,75.2,66.4,82.3,0.05],[6.65456,80.5,71.8,83.0,0.0]]};
// Cost per model: [mean US$ per scored run, runs]; output tokens x output price + every token x cache-read price (PRICE above).
const COST = {"astra": [9.3052, 30], "ds": [0.2829, 30], "glm": [9.8448, 40], "k3": [8.7123, 40], "muse": [29.5909, 40], "qwen": [8.523, 19], "sol": [1.5532, 64]};
const PRICE = {"astra": [50.0, 1.0], "sol": [10.0, 0.1], "k3": [15.0, 0.3], "qwen": [6.0, 0.25], "ds": [0.6, 0.003], "glm": [4.4, 0.26], "muse": [4.25, 1.25]};
const RAN = new Set(RUNS.map(r => r.t));
const mean = a => a.reduce((x, y) => x + y, 0) / a.length;
const f1 = x => x.toFixed(1);


const esc = s => String(s).replace(/[&<>"]/g, ch => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[ch]));


const $ = s => document.querySelector(s);
const NS = 'http://www.w3.org/2000/svg';
const sv = (tag, a = {}, text) => { const e = document.createElementNS(NS, tag);
  for (const k in a) if (a[k] != null) { if (tag === 'text' && /^(fill|font-size|font-weight)$/.test(k)) e.style.setProperty(k, k === 'font-size' ? a[k] + 'px' : a[k]); else e.setAttribute(k, a[k]); }
  if (text != null) e.textContent = text; return e; };
const MCOL = Object.fromEntries(MODELS.map(m => [m.id, `var(--m-${m.id})`]));
// Models ranked by FECI, the leaderboard's main number (bin/fcs2_runs_from_db.py fits it).
const RANKED = [...MODELS].sort((a, b) => ECI[b.id][0] - ECI[a.id][0]);
const NTASK = rs => new Set(rs.map(r => r.t)).size;
/* numbers in the page text come from the data, so they cannot drift from the chart */
document.querySelectorAll('[data-fill]').forEach(el => { el.textContent = {updated:`Last updated: ${UPDATED}`, runs:String(RUNS.length),
  runtasks:`on ${NTASK(RUNS)} tasks`, models:`${MODELS.length} models from ${new Set(MODELS.map(m => m.lab)).size} labs have run so far.`,
  summary:`${RUNS.length} runs on ${NTASK(RUNS)} tasks by ${MODELS.length} models`, nruns:`${RUNS.length} runs`}[el.dataset.fill]; });
const MNAME = Object.fromEntries(MODELS.map(m => [m.id, m.name]));
const isTouch = matchMedia('(hover: none)').matches;
// Bring a tab into view inside its own horizontal strip only. scrollIntoView would also scroll the page,
// which fought the reader's scrolling whenever the section spy fired.
const reveal = el => { const p = el.parentElement, pr = p.getBoundingClientRect(), er = el.getBoundingClientRect();
  if (er.left < pr.left) p.scrollLeft += er.left - pr.left - 16; else if (er.right > pr.right) p.scrollLeft += er.right - pr.right + 16; };

/* ---------- sub-nav scrollspy ---------- */
const subLinks = [...document.querySelectorAll('#subnav a')];
const spy = new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting) {
  subLinks.forEach(a => a.classList.toggle('on', a.getAttribute('href') === '#' + e.target.id));
  const on = subLinks.find(a => a.classList.contains('on')); on && reveal(on); } }), {rootMargin:'-45% 0px -50% 0px'});
['overview','leaderboard','cases','tasks','questions'].forEach(id => spy.observe(document.getElementById(id)));

/* ---------- leaderboard chart ---------- */
let group = 'model', dom = 'All', showRuns = true;
const DOMS_WITH_RUNS = DOMAINS.filter(d => RUNS.some(r => r.d === d));
$('#domradios').innerHTML = ['All', ...DOMS_WITH_RUNS].map(d => `<label><input type="radio" name="dom" value="${esc(d)}" ${d === 'All' ? 'checked' : ''}>${d === 'All' ? 'All domains' : esc(d)}<span class="n num">${RUNS.filter(r => d === 'All' || r.d === d).length}</span></label>`).join('');
$('#domradios').addEventListener('change', e => { dom = e.target.value; drawLB(); });
$('#groupby').addEventListener('click', e => { const b = e.target.closest('.chip'); if (!b) return; group = b.dataset.g;
  [...$('#groupby').children].forEach(c => c.setAttribute('aria-pressed', String(c === b))); drawLB(); });
$('#showruns').addEventListener('change', e => { showRuns = e.target.checked; drawLB(); });
$('#custom').addEventListener('click', () => { const s = $('#settings'); const o = !s.classList.contains('open'); s.classList.toggle('open', o); $('#custom').setAttribute('aria-expanded', String(o)); });
$('#lblegend').innerHTML = RANKED.map(m => `<span><i style="background:${MCOL[m.id]}"></i>${esc(m.name)}</span>`).join('');

/* Main chart: pass rate against mean cost per run in US$, one dot per model (PASS, COST). Each label takes the first
   spot right, left, above or below its dot that clears every dot, every placed label and the edges; a dot with no free
   spot keeps no label (the legend and the tooltip still name it). */
function drawPassCost() {
  const svg = $('#pcsvg'), W = Math.max(300, $('#pcplot').clientWidth), narrow = W < 560;
  const L = 44, R = narrow ? 12 : 24, T = 14, B = 46, H = narrow ? 320 : 400;
  const ms = MODELS.filter(m => COST[m.id]), tx = ms.map(m => COST[m.id][0]);
  const x0 = Math.floor(Math.log10(Math.min(...tx)) * 2) / 2, x1 = Math.ceil(Math.log10(Math.max(...tx)) * 2) / 2;
  const ymax = Math.min(100, Math.ceil((Math.max(...ms.map(m => PASS[m.id][0])) + 5) / 20) * 20);
  const X = v => L + (Math.log10(v) - x0) / (x1 - x0) * (W - L - R), Y = v => T + (1 - v / ymax) * (H - T - B);
  svg.setAttribute('viewBox', `0 0 ${W} ${H}`); svg.setAttribute('height', H); svg.replaceChildren();
  for (let v = 0; v <= ymax; v += 20) {
    svg.append(sv('line', {x1:L, x2:W - R, y1:Y(v), y2:Y(v), stroke:'var(--grid)', 'stroke-width':1}));
    svg.append(sv('text', {x:L - 8, y:Y(v) + 4, 'text-anchor':'end'}, v + '%'));
  }
  // ticks at 1, 2 and 5 times each power of ten; a range under one decade still gets several
  for (let k = Math.floor(x0); k <= Math.ceil(x1); k++) [1, 2, 5].forEach(f => { const v = f * 10 ** k, lv = Math.log10(v);
    if (lv < x0 - 1e-9 || lv > x1 + 1e-9 || (narrow && f === 2 && x1 - x0 > 1.5)) return;
    svg.append(sv('line', {x1:X(v), x2:X(v), y1:T, y2:H - B, stroke:'var(--grid)', 'stroke-width':1}));
    svg.append(sv('text', {x:X(v), y:H - B + 20, 'text-anchor':'middle'}, usdfmt(v))); });
  svg.append(sv('text', {class:'ax', x:L + (W - L - R) / 2, y:H - 6, 'text-anchor':'middle'}, 'Cost per run in US$, mean, log scale'));
  const pts = [], order = [...ms].sort((a, b) => PASS[b.id][0] - PASS[a.id][0]);
  const at = m => [X(COST[m.id][0]), Y(PASS[m.id][0])];
  const boxes = order.map(m => { const [cx, cy] = at(m); return {x:cx - 9, y:cy - 9, w:18, h:18}; });
  order.forEach(m => {
    const [cx, cy] = at(m), name = narrow ? m.short : m.name;
    svg.append(sv('circle', {cx, cy, r:7, fill:MCOL[m.id], stroke:'#fff', 'stroke-width':2, 'data-m':m.id}));
    const lab = sv('text', {class:'lab halo', x:cx, y:cy}, name); svg.append(lab);
    const w = lab.getComputedTextLength() + 2;
    const spots = [[cx + 12, cy + 4.5, 'start'], [cx - 12, cy + 4.5, 'end'], [cx, cy - 13, 'middle'], [cx, cy + 22, 'middle']];
    const box = ([x, y, an]) => ({x:an === 'start' ? x : an === 'end' ? x - w : x - w / 2, y:y - 12, w, h:16});
    const hit = q => boxes.some(o => q.x < o.x + o.w && o.x < q.x + q.w && q.y < o.y + o.h && o.y < q.y + q.h) || q.x < L || q.x + q.w > W || q.y < 0;
    const spot = spots.find(sp => !hit(box(sp)));
    if (spot) { boxes.push(box(spot)); lab.setAttribute('x', spot[0]); lab.setAttribute('y', spot[1]); lab.setAttribute('text-anchor', spot[2]); }
    else lab.remove();
    const [pct, np, n] = PASS[m.id];
    pts.push({x:cx, y:cy, mean:true, html:`<b>${esc(m.name)}</b><br>Pass rate <b>${f1(pct)}%</b>, ${np} of ${n} runs pass<br>${usdfmt(COST[m.id][0])} per run, mean of ${COST[m.id][1]} runs`});
  });
  attachTip(svg, W, H, pts, $('#pctip'));
}
$('#pclegend').innerHTML = [...MODELS].sort((a, b) => PASS[b.id][0] - PASS[a.id][0]).map(m => `<span><i style="background:${MCOL[m.id]}"></i>${esc(m.name)}</span>`).join('');

/* FECI: one row per model ranked by ECI, its 90% interval as a bar. */
function drawECI() {
  const order = [...MODELS].sort((a, b) => ECI[b.id][0] - ECI[a.id][0]);
  const svg = $('#ecisvg'), W = Math.max(300, $('#eciplot').clientWidth), narrow = W < 560;
  const L = narrow ? 112 : 190, R = 34, T = 14, B = 46, lane = narrow ? 56 : 64;
  const xmax = Math.ceil(Math.max(...MODELS.map(m => ECI[m.id][2])) / 20) * 20, step = narrow && xmax > 120 ? 40 : 20;
  const H = T + order.length * lane + B;
  svg.setAttribute('viewBox', `0 0 ${W} ${H}`); svg.setAttribute('height', H); svg.replaceChildren();
  const X = v => L + v / xmax * (W - L - R);
  for (let v = 0; v <= xmax; v += step) {
    svg.append(sv('line', {x1:X(v), x2:X(v), y1:T, y2:H - B + 6, stroke:'var(--grid)', 'stroke-width':1}));
    svg.append(sv('text', {x:X(v), y:H - B + 22, 'text-anchor':'middle'}, v));
  }
  svg.append(sv('text', {class:'ax', x:L + (W - L - R) / 2, y:H - 6, 'text-anchor':'middle'}, 'FECI'));
  const pts = [];
  order.forEach((m, i) => {
    const [e, lo, hi] = ECI[m.id], y0 = T + i * lane, yc = y0 + lane / 2;
    if (i) svg.append(sv('line', {x1:0, x2:W - R, y1:y0, y2:y0, stroke:'var(--line)', 'stroke-width':1}));
    svg.append(sv('text', {class:'lab', x:0, y:yc + (m.h ? -3 : 4)}, narrow ? m.short : m.name));
    if (m.h) svg.append(sv('text', {x:0, y:yc + 14, 'font-size':12}, m.h));
    svg.append(sv('line', {x1:X(lo), x2:X(hi), y1:yc, y2:yc, stroke:MCOL[m.id], 'stroke-width':6, 'stroke-linecap':'round', opacity:.25}));
    svg.append(sv('circle', {cx:X(e), cy:yc, r:7, fill:MCOL[m.id], stroke:'#fff', 'stroke-width':2}));
    svg.append(sv('text', {class:'val halo', x:X(e), y:yc - 13, fill:MCOL[m.id], 'text-anchor':'middle'}, String(Math.round(e))));
    const mine = RUNS.filter(r => r.m === m.id);
    pts.push({x:X(e), y:yc, mean:true, html:`<b>${esc(m.name)}</b><br>FECI <b>${f1(e)}</b><br>90% interval ${Math.round(lo)}–${Math.round(hi)}<br>${mine.length} runs on ${NTASK(mine)} tasks`});
  });
  attachTip(svg, W, H, pts, $('#ecitip'));
}
function attachTip(svg, W, H, pts, tip = $('#lbtip')) {
  const near = ev => { const rc = svg.getBoundingClientRect(), px = (ev.clientX - rc.left) * W / rc.width, py = (ev.clientY - rc.top) * H / rc.height;
    let best = null, bd = 1e9; pts.forEach(p => { const d = Math.hypot(p.x - px, p.y - py) - (p.mean ? 4 : 0); if (d < bd) { bd = d; best = p; } });
    return bd < 28 ? {p:best, rc} : null; };
  svg.onpointermove = ev => { const n = near(ev); if (!n) { tip.hidden = true; return; }
    tip.innerHTML = n.p.html; tip.hidden = false; tip.style.left = (n.p.x / W * n.rc.width) + 'px'; tip.style.top = (n.p.y / H * n.rc.height) + 'px'; };
  svg.onpointerdown = svg.onpointermove;
  svg.onpointerleave = () => { if (!isTouch) tip.hidden = true; };
}

/* Test-time scaling: FECI when every run stops at a US$ budget (SCALE, from bin/fcs2_runs_from_db.py).
   Values below 0 leave the plot through its bottom edge. */
const usdfmt = v => v >= 1 ? `$${+v.toPrecision(2)}` : `$${+v.toPrecision(1)}`;
function drawTTS() {
  const svg = $('#ttssvg'), W = Math.max(300, $('#ttsplot').clientWidth), narrow = W < 560;
  const L = 34, R = narrow ? 12 : 24, T = 12, B = 46, H = narrow ? 300 : 380;
  const all = Object.values(SCALE).flat();
  // the axis starts half a decade before the first budget at which any model rises above 0
  const x0 = Math.log10(Math.min(...all.filter(p => p[1] >= 0).map(p => p[0]))) - 0.5, x1 = Math.log10(Math.max(...all.map(p => p[0])));
  const ymax = Math.ceil(Math.max(...all.map(p => p[3])) / 20) * 20;
  const X = v => L + (Math.log10(v) - x0) / (x1 - x0) * (W - L - R), Y = v => T + (1 - v / ymax) * (H - T - B);
  svg.setAttribute('viewBox', `0 0 ${W} ${H}`); svg.setAttribute('height', H); svg.replaceChildren();
  const clip = sv('clipPath', {id:'ttsclip'}); clip.append(sv('rect', {x:L, y:T - 4, width:W - L - R + 8, height:H - T - B + 4})); svg.append(clip);
  for (let v = 0; v <= ymax; v += 20) {
    svg.append(sv('line', {x1:L, x2:W - R, y1:Y(v), y2:Y(v), stroke:'var(--grid)', 'stroke-width':1}));
    svg.append(sv('text', {x:L - 8, y:Y(v) + 4, 'text-anchor':'end'}, v));
  }
  for (let k = Math.ceil(x0); k <= Math.floor(x1); k++) {
    svg.append(sv('line', {x1:X(10 ** k), x2:X(10 ** k), y1:H - B, y2:H - B + 5, stroke:'var(--ink-2)', 'stroke-width':1}));
    svg.append(sv('text', {x:X(10 ** k), y:H - B + 20, 'text-anchor':'middle'}, usdfmt(10 ** k)));
  }
  svg.append(sv('text', {class:'ax', x:L + (W - L - R) / 2, y:H - 6, 'text-anchor':'middle'}, 'Cost budget per run in US$, log scale'));
  const g = sv('g', {'clip-path':'url(#ttsclip)'}); svg.append(g);
  const pts = [];
  [...RANKED].reverse().forEach(m => {
    const c = SCALE[m.id], path = c.map((p, i) => `${i ? 'L' : 'M'}${X(p[0]).toFixed(1)},${Y(p[1]).toFixed(1)}`).join('');
    const band = c.map((p, i) => `${i ? 'L' : 'M'}${X(p[0]).toFixed(1)},${Y(p[3]).toFixed(1)}`).join('')
      + [...c].reverse().map(p => `L${X(p[0]).toFixed(1)},${Y(p[2]).toFixed(1)}`).join('') + 'Z';
    g.append(sv('path', {d:band, fill:MCOL[m.id], opacity:.12}));
    g.append(sv('path', {d:path, fill:'none', stroke:MCOL[m.id], 'stroke-width':2.2, 'stroke-linejoin':'round'}));
    const e = c[c.length - 1];
    g.append(sv('circle', {cx:X(e[0]), cy:Y(e[1]), r:4.5, fill:MCOL[m.id], stroke:'#fff', 'stroke-width':1.5}));
    c.forEach(p => { if (p[1] >= 0) pts.push({x:X(p[0]), y:Y(p[1]), html:`<b>${esc(m.name)}</b><br>FECI <b>${f1(p[1])}</b> at ${usdfmt(p[0])} per run`
      + `<br>90% interval ${Math.round(Math.max(p[2], 0))}–${Math.round(p[3])}<br>${Math.round(p[4] * 100)}% of runs still going`}); });
  });
  attachTip(svg, W, H, pts, $('#ttstip'));
}
$('#ttslegend').innerHTML = RANKED.map(m => `<span><i style="background:${MCOL[m.id]}"></i>${esc(m.name)}</span>`).join('');

function drawLB() {
  const runs = RUNS.filter(r => dom === 'All' || r.d === dom);
  $('#nres').textContent = `${runs.length} run${runs.length === 1 ? '' : 's'}`;
  let rows;
  if (group === 'model') {
    rows = MODELS.map(m => ({label:m.name, short:m.short, sub:m.h, items:[{m:m.id, runs:runs.filter(r => r.m === m.id)}]})).filter(r => r.items[0].runs.length);
    rows.forEach(r => r.best = mean(r.items[0].runs.map(x => x.s)));
  } else {
    // one line per task, one dot per model: the model's mean over its runs on that task
    const ts = [...new Set(runs.map(r => r.t))];
    rows = ts.map(t => ({label:t, sub:runs.find(r => r.t === t).d, items:MODELS.map(m => ({m:m.id, runs:runs.filter(r => r.t === t && r.m === m.id)})).filter(i => i.runs.length)}));
    rows.forEach(r => r.best = Math.max(...r.items.map(i => mean(i.runs.map(x => x.s)))));
  }
  rows.sort((a, b) => b.best - a.best);
  const svg = $('#lbsvg'), box = $('#lbplot'), W = Math.max(300, box.clientWidth), narrow = W < 560;
  const L = narrow ? 112 : 190, R = 34, T = 8, B = 46;
  const lane = group === 'model' ? (narrow ? 64 : 76) : 30;
  const rowH = () => lane;
  const H = T + rows.reduce((a, r) => a + rowH(r), 0) + B;
  svg.setAttribute('viewBox', `0 0 ${W} ${H}`); svg.setAttribute('height', H); svg.replaceChildren();
  const X = v => L + v / 100 * (W - L - R);
  for (let v = 0; v <= 100; v += 20) {
    svg.append(sv('line', {x1:X(v), x2:X(v), y1:T, y2:H - B + 6, stroke:'var(--grid)', 'stroke-width':1}));
    svg.append(sv('text', {x:X(v), y:H - B + 22, 'text-anchor':'middle'}, v));
  }
  svg.append(sv('text', {class:'ax', x:L + (W - L - R) / 2, y:H - 6, 'text-anchor':'middle'}, 'Final score'));
  const pts = [];
  let y0 = T;
  rows.forEach((r, ri) => {
    const h = rowH(r);
    if (ri) svg.append(sv('line', {x1:0, x2:W - R, y1:y0, y2:y0, stroke:'var(--line)', 'stroke-width':1}));
    const two = group === 'model' && r.sub;
    const name = narrow && r.short ? r.short : r.label, maxc = Math.floor((L - 14) / 7.4);
    const short = name.length > maxc ? name.slice(0, maxc - 1).trimEnd() + '…' : name;
    const lab = sv('text', {class:'lab', x:0, y:y0 + h / 2 + (two ? -3 : 4)}, short);
    if (short !== r.label) lab.append(sv('title', {}, r.label));
    svg.append(lab);
    if (two) svg.append(sv('text', {x:0, y:y0 + h / 2 + 14, 'font-size':12}, r.sub));
    if (group === 'task') {
      const ms = r.items.map(i => mean(i.runs.map(x => x.s))), yc = y0 + h / 2;
      if (ms.length > 1) svg.append(sv('line', {x1:X(Math.min(...ms)), x2:X(Math.max(...ms)), y1:yc, y2:yc, stroke:'var(--line)', 'stroke-width':2}));
      r.items.forEach((it, k) => {
        svg.append(sv('circle', {cx:X(ms[k]), cy:yc, r:5.5, fill:MCOL[it.m], stroke:'#fff', 'stroke-width':1.5}));
        pts.push({x:X(ms[k]), y:yc, html:`<b>${esc(MNAME[it.m])}</b><br>${esc(r.label)} · ${esc(r.sub)}<br>${it.runs.length > 1 ? `Mean <b>${f1(ms[k])}</b> over ${it.runs.length} runs` : `Final score <b>${f1(ms[k])}</b>`}`, mean:true});
      });
      const edge = X(Math.max(...ms)) + 10, right = edge + 34 > W;
      svg.append(sv('text', {class:'val', x: right ? X(Math.min(...ms)) - 10 : edge, y:yc + 4.5, fill:'var(--ink-2)', 'text-anchor': right ? 'end' : 'start'}, f1(Math.max(...ms))));
      y0 += h; return;
    }
    r.items.forEach((it, k) => {
      const yc = y0 + h / 2;
      const ss = it.runs.map(x => x.s), mu = mean(ss);
      if (ss.length > 1) svg.append(sv('line', {x1:X(Math.min(...ss)), x2:X(Math.max(...ss)), y1:yc, y2:yc, stroke:MCOL[it.m], 'stroke-width':2, opacity:.35}));
      if (showRuns) it.runs.forEach((x, j) => {
        const jy = ((j * 37) % 17 - 8) * (narrow ? .9 : 1.2);
        const c = sv('circle', {cx:X(x.s), cy:yc + jy, r:4.5, fill:MCOL[it.m], opacity:.4});
        svg.append(c); pts.push({x:X(x.s), y:yc + jy, html:`<b>${esc(MNAME[it.m])}</b><br>${esc(x.t)} · ${esc(x.d)}<br>Final score <b>${f1(x.s)}</b>`});
      });
      svg.append(sv('circle', {cx:X(mu), cy:yc, r:8, fill:MCOL[it.m], stroke:'#fff', 'stroke-width':2}));
      pts.push({x:X(mu), y:yc, html:`<b>${esc(MNAME[it.m])}</b><br>Mean <b>${f1(mu)}</b> over ${ss.length} run${ss.length > 1 ? 's' : ''} on ${NTASK(it.runs)} task${NTASK(it.runs) > 1 ? 's' : ''}`, mean:true});
      // the mean sits above its own dot, with a white halo over the run dots
      svg.append(sv('text', {class:'val halo', x:X(mu), y:yc - 15, fill:MCOL[it.m], 'text-anchor':'middle'}, f1(mu)));
    });
    y0 += h;
  });
  attachTip(svg, W, H, pts);
}

/* ---------- results by domain ---------- */
function drawTable() {
  const head = `<tr><th>Domain</th><th class="tk">Tasks run</th>${RANKED.map(m => `<th><span class="mn" style="background:${MCOL[m.id]}"></span><span class="full">${m.name}</span><span class="short">${m.short}</span></th>`).join('')}</tr>`;
  const line = (d, cls) => {
    const vals = RANKED.map(m => { const s = RUNS.filter(r => r.m === m.id && (d === 'All' || r.d === d)).map(r => r.p * 100); return s.length ? mean(s) : null; });
    const best = Math.max(...vals.filter(v => v != null));
    const n = NTASK(RUNS.filter(r => d === 'All' || r.d === d));
    return `<tr class="${cls || ''}"><td>${d === 'All' ? 'All tasks' : esc(d)}</td><td class="tk">${n}</td>${vals.map(v => v == null ? '<td class="e">–</td>' : `<td class="${v === best && vals.filter(x => x != null).length > 1 ? 'best' : ''}">${Math.round(v)}%</td>`).join('')}</tr>`;
  };
  $('#restbl').innerHTML = head + DOMS_WITH_RUNS.map(d => line(d)).join('') + line('All', 'all');
}

/* ---------- case studies: a placeholder until the preview runs have their own (owner, 2026-10-09) ---------- */
const redraws = [];

/* ---------- questions ---------- */
const fqHash = () => { const d = document.getElementById(location.hash.slice(1)); if (d && d.tagName === 'DETAILS') { d.open = true; d.scrollIntoView({block:'start'}); } };
addEventListener('hashchange', fqHash); fqHash();

/* ---------- task index ---------- */
let picked = new Set(), q = '', sort = 'domain', limit = 10;
$('#checks').innerHTML = DOMAINS.map(d => `<label><input type="checkbox" value="${esc(d)}"> ${esc(d)} (${N_IN(d)})</label>`).join('');
$('#checks').addEventListener('change', e => { e.target.checked ? picked.add(e.target.value) : picked.delete(e.target.value); limit = 10; drawRows(); });
$('#ftoggle').addEventListener('click', () => { const f = $('#filter'), o = !f.classList.contains('open'); f.classList.toggle('open', o); $('#ftoggle').setAttribute('aria-expanded', String(o)); });
$('#q').addEventListener('input', e => { q = e.target.value; limit = 10; drawRows(); });
$('#sort').addEventListener('change', e => { sort = e.target.value; drawRows(); });
$('#showmore').addEventListener('click', () => { limit += 20; drawRows(); });
function syncChecks() { [...$('#checks').querySelectorAll('input')].forEach(i => i.checked = picked.has(i.value)); $('#fcount').textContent = picked.size ? `(${picked.size})` : ''; }
function hits() {
  const w = q.toLowerCase().split(/\s+/).filter(Boolean);
  let h = TASKS.filter(t => (!picked.size || picked.has(t.d)) && w.every(x => (t.s + ' ' + t.t + ' ' + t.d).toLowerCase().includes(x)));
  if (sort === 'name') h = [...h].sort((a, b) => a.s.localeCompare(b.s, 'en', {sensitivity:'base'}));
  else if (sort === 'runs') h = [...h].sort((a, b) => RAN.has(b.s) - RAN.has(a.s));
  else h = [...h].sort((a, b) => DOMAINS.indexOf(a.d) - DOMAINS.indexOf(b.d));
  return h;
}
const AFILL = {sys:'#D2E3FC', ml:'#CEEAD6', pl:'#E9D2FD', sec:'#FAD2CF', db:'#FEEFC3', rb:'#E8EAED'};
const AINK = {sys:'#174EA6', ml:'#0D652D', pl:'#681DA8', sec:'#A50E0E', db:'#E37400', rb:'#202124'};
function squarify(vals, x, y, w, h) {
  const tot = vals.reduce((a, b) => a + b, 0), areas = vals.map(v => v * w * h / tot), out = [];
  const worst = (row, side) => { const s = row.reduce((a, b) => a + b, 0); return Math.max(...row.map(r => Math.max(side * side * r / (s * s), s * s / (side * side * r)))); };
  let i = 0;
  while (i < areas.length) {
    const side = Math.min(w, h); let row = [areas[i]], j = i + 1;
    while (j < areas.length && worst([...row, areas[j]], side) <= worst(row, side)) row.push(areas[j++]);
    const s = row.reduce((a, b) => a + b, 0);
    if (w >= h) { const rw = s / h; let yy = y; row.forEach(r => { out.push([x, yy, rw, r / rw]); yy += r / rw; }); x += rw; w -= rw; }
    else { const rh = s / w; let xx = x; row.forEach(r => { out.push([xx, y, r / rh, rh]); xx += r / rh; }); y += rh; h -= rh; }
    i = j;
  }
  return out;
}
$('#areas').innerHTML = AREAS.map(a => `<span><i style="background:${AFILL[a.k]}"></i>${esc(a.name)}</span>`).join('');
const nRan = d => TASKS.filter(t => t.d === d && RAN.has(t.s)).length;
function drawMap() {
  const svg = $('#mapsvg'), W = $('#map').clientWidth, narrow = W < 640, H = narrow ? Math.round(W * 1.15) : Math.round(W * 0.36);
  svg.setAttribute('viewBox', `0 0 ${W} ${H}`); svg.setAttribute('height', H); svg.replaceChildren();
  const byArea = AREAS.map(a => ({a, n:a.d.reduce((s, d) => s + N_IN(d), 0)})).sort((p, q) => q.n - p.n), G = narrow ? 4 : 6, tol = .5;
  squarify(byArea.map(x => x.n), 0, 0, W, H).forEach((ar, k) => {
    const a = byArea[k].a, doms = [...a.d].sort((p, q) => N_IN(q) - N_IN(p));
    squarify(doms.map(N_IN), ...ar).forEach(([x, y, w, h], j) => {
      const d = doms[j], n = N_IN(d), on = picked.has(d);
      const x0 = x + (x > tol ? G / 2 : 0), y0 = y + (y > tol ? G / 2 : 0), x1 = x + w - (x + w < W - tol ? G / 2 : 0), y1 = y + h - (y + h < H - tol ? G / 2 : 0), bw = x1 - x0, bh = y1 - y0;
      const g = sv('g', {class:'blk', tabindex:0, role:'button', 'aria-pressed':String(on), 'aria-label':`${d}, ${n} task${n > 1 ? 's' : ''}`, 'data-d':d, opacity: picked.size && !on ? .32 : 1});
      g.append(sv('rect', {x:x0, y:y0, width:bw, height:bh, rx:narrow ? 6 : 8, fill:AFILL[a.k]}));
      svg.append(g);
      // label: the largest size at which some layout fits. Layouts: name over count, name on two lines over count,
      // name and count on one line, the same stood up along the left edge, the name alone stood up
      const ink = AINK[a.k], words = d.split(' '), sizes = narrow ? [20, 16, 13, 11, 9.5] : [30, 24, 19, 15, 12, 10.5];
      const meas = (str, fs, wt) => { const t = sv('text', {x:-999, y:-999, 'font-size':fs, 'font-weight':wt}, str); svg.append(t); const w = t.getComputedTextLength(); t.remove(); return w; };
      const put = (str, x, y, fs, wt, rot) => g.append(sv('text', {x, y, 'font-size':fs, 'font-weight':wt, fill:ink, transform: rot ? `rotate(-90 ${x} ${y})` : null}, str));
      let done = false;
      for (const fs of sizes) {
        const pad = fs < 13 ? 6 : narrow ? 10 : 14, lh = fs * 1.15, nameW = meas(d, fs, 600), both = meas(`${d}  ${n}`, fs, 600);
        const lines = words.length > 1 ? [words.slice(0, -1).join(' '), words.at(-1)] : null;
        const tx = x0 + pad, ty = y0 + pad + fs * .8;
        if (nameW + 2 * pad <= bw && lh * 2 + pad * 1.4 <= bh) { put(d, tx, ty, fs, 600); put(n, tx, ty + lh, fs, 400); done = true; }
        else if (lines && Math.max(...lines.map(l => meas(l, fs, 600))) + 2 * pad <= bw && lh * 3 + pad * 1.4 <= bh) { put(lines[0], tx, ty, fs, 600); put(lines[1], tx, ty + lh, fs, 600); put(n, tx, ty + 2 * lh, fs, 400); done = true; }
        else if (both + 2 * pad <= bw && lh + pad * 1.4 <= bh) { put(`${d}  ${n}`, tx, ty, fs, 600); done = true; }
        else if (both + 2 * pad <= bh && fs + 2 * pad <= bw) { put(`${d}  ${n}`, x0 + pad + fs * .8, y1 - pad, fs, 600, true); done = true; }
        else if (fs === sizes.at(-1) && nameW + 8 <= bh && fs + 6 <= bw) { put(d, x0 + 3 + fs * .8, y1 - 4, fs, 600, true); done = true; }
        if (done) break;
      }
    });
  });
}
const mapTip = $('#maptip');
$('#mapsvg').addEventListener('pointermove', e => { const g = e.target.closest('.blk'); if (!g || e.pointerType !== 'mouse') { mapTip.hidden = true; return; }
  const d = g.dataset.d, r = $('#map').getBoundingClientRect();
  mapTip.innerHTML = `<b>${esc(d)}</b><br>${N_IN(d)} task${N_IN(d) > 1 ? 's' : ''}${nRan(d) ? ` · ${nRan(d)} with runs` : ''}`;
  mapTip.hidden = false; mapTip.style.left = (e.clientX - r.left) + 'px'; mapTip.style.top = (e.clientY - r.top) + 'px'; });
$('#mapsvg').addEventListener('pointerleave', () => { mapTip.hidden = true; });
const pickDom = d => { picked.has(d) ? picked.delete(d) : picked.add(d); syncChecks(); limit = 10; drawRows(); };
$('#mapsvg').addEventListener('click', e => { const g = e.target.closest('.blk'); if (g) pickDom(g.dataset.d); });
$('#mapsvg').addEventListener('keydown', e => { const g = e.target.closest('.blk'); if (g && (e.key === 'Enter' || e.key === ' ')) { const d = g.dataset.d; pickDom(d); $(`#mapsvg .blk[data-d="${CSS.escape(d)}"]`).focus(); e.preventDefault(); } });

function drawRows() {
  drawMap();
  $('#tzhint').textContent = picked.size ? `${[...picked].join(', ')} selected. Select again to clear.` : 'Select a domain to filter the list';
  const h = hits(); $('#cnt').textContent = `${h.length} task${h.length === 1 ? '' : 's'}`; $('#fcount').textContent = picked.size ? `(${picked.size})` : '';
  $('#rows').innerHTML = h.slice(0, limit).map(t => `<article class="row" data-s="${esc(t.s)}"><div class="meta"><span class="tag">${esc(t.d)}</span>${RAN.has(t.s) ? '<span class="ran"><i></i>Has runs</span>' : ''}</div>
    <h3>${esc(t.s)}</h3>${t.t ? `<p>${esc(t.t)}</p>` : ''}<div class="lk">${t.p ? `<a href="${esc(t.p)}" target="_blank" rel="noopener">Paper</a>` : '<span>No paper link</span>'}${t.r ? `<a href="${esc(t.r)}" target="_blank" rel="noopener">Code</a>` : ''}</div></article>`).join('')
    || `<p class="empty">No task matches. Clear the filter or try another word.</p>`;
  $('#showmore').hidden = h.length <= limit;
  $('#showmore').textContent = `Show more (${h.length - limit} left)`;
}

drawPassCost(); drawTable(); drawLB(); drawECI(); drawTTS(); drawRows();
let rz; addEventListener('resize', () => { clearTimeout(rz); rz = setTimeout(() => { drawPassCost(); drawLB(); drawECI(); drawTTS(); drawMap(); redraws.forEach(f => f()); }, 120); });
