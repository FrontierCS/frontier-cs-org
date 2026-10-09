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
// model, domain, task, final score (0-100, the task's own scale). Timeouts score 0; 23 unscored runs are left out.
const RUNS = [["sol", "Database", "Yannakakis", 11.41], ["sol", "Machine Learning", "Differentiable Population Statistics", 4.39], ["sol", "HPC", "RegionsSort", 51.23], ["sol", "Security", "Progent", 93.16], ["sol", "Robotics", "MuJoCo Playground", 37.97], ["sol", "HPC", "RegionsSort", 51.31], ["sol", "HPC", "Hygra", 45.42], ["sol", "Machine Learning", "Polar Express", 60.79], ["sol", "Machine Learning", "DyT", 61.11], ["sol", "HPC", "ParButterfly", 56.41], ["sol", "Robotics", "Diffusion Policy", 57.55], ["sol", "Architecture", "KAMI", 16.34], ["sol", "Database", "Approximate-MIPS Query Stopping", 81.55], ["sol", "Machine Learning", "Robust Image Tokenizer", 70.76], ["sol", "MLSys", "dbscan kernel", 69.79], ["sol", "MLSys", "knn kernel", 39.97], ["sol", "Database", "Persistent Treap Update Engine", 35.6], ["sol", "Security", "Spectre", 81.4], ["sol", "HPC", "ParButterfly", 53.41], ["sol", "Cryptography", "Structured LWE", 79.5], ["sol", "Programming Languages", "egg", 59.92], ["sol", "Database", "Residual State Advancement", 46.23], ["sol", "Network", "MetaOpt", 0.0], ["sol", "Machine Learning", "Nano World Model", 79.84], ["sol", "Database", "FARGO paper-aligned query core", 52.1], ["sol", "MLSys", "SVG-EAR", 33.74], ["sol", "Database", "Spectrum", 81.24], ["sol", "MLSys", "ivf_pq kernel", 77.34], ["sol", "Robotics", "MuJoCo Playground", 37.97], ["sol", "Security", "Opal", 99.17], ["sol", "Programming Languages", "BABBLE", 17.32], ["sol", "Machine Learning", "RAGEN", 98.92], ["sol", "Machine Learning", "Nano World Model", 81.21], ["sol", "HPC", "Parallel DBSCAN", 76.57], ["sol", "Security", "Adaptive attacks", 75.87], ["sol", "HPC", "Hygra", 59.52], ["sol", "MLSys", "knn kernel", 44.45], ["sol", "Programming Languages", "egg", 60.89], ["sol", "HPC", "Parallel DBSCAN", 76.96], ["sol", "Machine Learning", "DyT", 66.28], ["sol", "Security", "Adaptive attacks", 82.24], ["sol", "Database", "Yannakakis", 12.2], ["sol", "MLSys", "kmeans kernel", 44.72], ["sol", "Database", "Approximate-MIPS Query Stopping", 69.23], ["sol", "Programming Languages", "Polygon", 92.13], ["sol", "Machine Learning", "Polar Express", 71.71], ["sol", "Network", "Shockwave", 40.46], ["sol", "Architecture", "Clusterwise SpGEMM", 91.13], ["sol", "Database", "Spectrum", 82.84], ["sol", "Network", "BBQ", 71.77], ["sol", "MLSys", "SVG-EAR", 50.94], ["sol", "Database", "SCOPE", 66.52], ["sol", "Network", "BBQ", 66.09], ["sol", "Database", "Persistent Treap Update Engine", 24.36], ["sol", "Database", "ScaleGPM", 65.12], ["sol", "Network", "Shockwave", 45.76], ["sol", "Security", "Opal", 99.17], ["sol", "Database", "Residual State Advancement", 0.06], ["sol", "Machine Learning", "Robust Image Tokenizer", 73.22], ["sol", "MLSys", "ivf_pq kernel", 78.01], ["sol", "MLSys", "kmeans kernel", 45.77], ["sol", "Machine Learning", "LeJEPA", 99.57], ["sol", "MLSys", "dbscan kernel", 67.46], ["sol", "Database", "Seer", 81.14], ["muse", "Robotics", "Diffusion Policy", 54.98], ["muse", "Database", "Yannakakis", 9.78], ["muse", "HPC", "RegionsSort", 51.14], ["muse", "Security", "Progent", 93.54], ["muse", "Robotics", "MuJoCo Playground", 33.33], ["muse", "HPC", "Hygra", 59.22], ["muse", "HPC", "ParButterfly", 39.12], ["muse", "Architecture", "KAMI", 7.85], ["muse", "Machine Learning", "Robust Image Tokenizer", 70.53], ["muse", "Database", "Persistent Treap Update Engine", 43.29], ["muse", "Security", "Spectre", 80.5], ["muse", "Cryptography", "Structured LWE", 56.0], ["muse", "Programming Languages", "egg", 59.82], ["muse", "Database", "Residual State Advancement", 4.29], ["muse", "Network", "MetaOpt", 0.0], ["muse", "Machine Learning", "Nano World Model", 78.78], ["muse", "Database", "FARGO paper-aligned query core", 52.09], ["muse", "Security", "Opal", 98.33], ["muse", "Programming Languages", "BABBLE", 18.39], ["muse", "Machine Learning", "RAGEN", 11.69], ["muse", "Security", "Adaptive attacks", 81.27], ["muse", "MLSys", "knn kernel", 23.36], ["muse", "HPC", "Parallel DBSCAN", 78.53], ["muse", "Machine Learning", "DyT", 50.95], ["muse", "Database", "Approximate-MIPS Query Stopping", 82.17], ["muse", "Programming Languages", "Polygon", 92.13], ["muse", "Machine Learning", "Polar Express", 53.23], ["muse", "Architecture", "Clusterwise SpGEMM", 80.89], ["muse", "Database", "Spectrum", 2.26], ["muse", "Security", "Hacking Blind", 100.0], ["muse", "Network", "BBQ", 53.64], ["muse", "MLSys", "SVG-EAR", 26.19], ["muse", "Database", "SCOPE", 4.51], ["muse", "Database", "ScaleGPM", 79.07], ["muse", "Network", "Shockwave", 45.27], ["muse", "MLSys", "ivf_pq kernel", 72.79], ["muse", "MLSys", "kmeans kernel", 47.96], ["muse", "Machine Learning", "LeJEPA", 82.01], ["muse", "MLSys", "dbscan kernel", 39.8], ["muse", "Database", "Seer", 81.14], ["k3", "Security", "Adaptive attacks", 80.74], ["k3", "Database", "Residual State Advancement", 17.17], ["k3", "Machine Learning", "Differentiable Population Statistics", 3.42], ["k3", "Security", "Progent", 93.5], ["k3", "Database", "Spectrum", 0.21], ["k3", "HPC", "Parallel DBSCAN", 76.17], ["k3", "HPC", "ParButterfly", 48.45], ["k3", "Machine Learning", "DyT", 51.47], ["k3", "Machine Learning", "Polar Express", 65.23], ["k3", "Robotics", "Diffusion Policy", 52.11], ["k3", "Architecture", "KAMI", 18.45], ["k3", "Machine Learning", "Nano World Model", 79.44], ["k3", "Database", "Yannakakis", 11.82], ["k3", "Security", "Spectre", 81.14], ["k3", "Database", "Approximate-MIPS Query Stopping", 86.98], ["k3", "Cryptography", "Structured LWE", 55.0], ["k3", "MLSys", "kmeans kernel", 47.98], ["k3", "Network", "MetaOpt", 52.01], ["k3", "Database", "FARGO paper-aligned query core", 52.23], ["k3", "HPC", "Hygra", 58.74], ["k3", "MLSys", "knn kernel", 40.12], ["k3", "Programming Languages", "egg", 59.38], ["k3", "Machine Learning", "RAGEN", 10.62], ["k3", "Database", "ScaleGPM", 83.05], ["k3", "Robotics", "MuJoCo Playground", 37.97], ["k3", "Machine Learning", "OCR Distillation Trajectory Sampling", 65.18], ["k3", "MLSys", "dbscan kernel", 61.37], ["k3", "Database", "Seer", 81.15], ["k3", "Network", "BBQ", 66.09], ["k3", "Security", "Opal", 99.17], ["k3", "Programming Languages", "Polygon", 92.13], ["k3", "HPC", "RegionsSort", 51.25], ["k3", "MLSys", "ivf_pq kernel", 77.51], ["k3", "Security", "Hacking Blind", 90.91], ["k3", "Database", "Persistent Treap Update Engine", 20.77], ["k3", "Database", "SCOPE", 13.94], ["k3", "Programming Languages", "BABBLE", 18.89], ["k3", "Machine Learning", "Robust Image Tokenizer", 71.32], ["k3", "MLSys", "SVG-EAR", 27.79], ["k3", "Network", "Shockwave", 46.29], ["k27", "Machine Learning", "Differentiable Population Statistics", 4.17], ["k27", "Database", "Residual State Advancement", 4.21], ["k27", "HPC", "RegionsSort", 51.55], ["k27", "Network", "Shockwave", 38.9], ["k27", "Machine Learning", "Polar Express", 0.0], ["k27", "Machine Learning", "DyT", 50.55], ["k27", "Database", "Approximate-MIPS Query Stopping", 75.42], ["k27", "MLSys", "dbscan kernel", 55.1], ["k27", "MLSys", "knn kernel", 18.8], ["k27", "Database", "ScaleGPM", 76.48], ["k27", "Security", "Spectre", 79.08], ["k27", "HPC", "ParButterfly", 36.86], ["k27", "Database", "Seer", 81.13], ["k27", "Cryptography", "Structured LWE", 0.0], ["k27", "Network", "MetaOpt", 0.0], ["k27", "Machine Learning", "Nano World Model", 0.0], ["k27", "MLSys", "SVG-EAR", 0.0], ["k27", "Robotics", "MuJoCo Playground", 33.26], ["k27", "Machine Learning", "RAGEN", 0.0], ["k27", "HPC", "Parallel DBSCAN", 65.29], ["k27", "HPC", "Hygra", 55.63], ["k27", "Security", "Hacking Blind", 100.0], ["k27", "Programming Languages", "BABBLE", 18.87], ["k27", "Programming Languages", "egg", 0.0], ["k27", "Security", "Adaptive attacks", 80.74], ["k27", "Database", "Yannakakis", 10.71], ["k27", "MLSys", "kmeans kernel", 43.21], ["k27", "MLSys", "ivf_pq kernel", 0.0], ["k27", "Database", "SCOPE", 8.52], ["k27", "Network", "BBQ", 0.0], ["k27", "Database", "Persistent Treap Update Engine", 24.1], ["k27", "Security", "Opal", 70.0], ["k27", "Database", "Spectrum", 0.0], ["k27", "Machine Learning", "Robust Image Tokenizer", 71.87], ["qwen", "Security", "Adaptive attacks", 80.74], ["qwen", "Database", "Spectrum", 1.1], ["qwen", "HPC", "Parallel DBSCAN", 71.88], ["qwen", "HPC", "ParButterfly", 51.81], ["qwen", "MLSys", "SVG-EAR", 7.72], ["qwen", "Machine Learning", "Polar Express", 58.87], ["qwen", "Database", "Yannakakis", 13.02], ["qwen", "Cryptography", "Structured LWE", 58.0], ["qwen", "HPC", "Hygra", 60.04], ["qwen", "Programming Languages", "egg", 59.71], ["qwen", "Database", "ScaleGPM", 79.99], ["qwen", "Security", "Hacking Blind", 100.0], ["qwen", "Robotics", "MuJoCo Playground", 33.33], ["qwen", "Database", "Seer", 81.33], ["qwen", "Security", "Opal", 99.17], ["qwen", "HPC", "RegionsSort", 50.81], ["qwen", "Database", "SCOPE", 21.02], ["qwen", "Programming Languages", "BABBLE", 18.09], ["qwen", "Network", "Shockwave", 45.93], ["astra", "Security", "Adaptive attacks", 79.26], ["astra", "HPC", "Parallel DBSCAN", 77.11], ["astra", "HPC", "ParButterfly", 56.19], ["astra", "Machine Learning", "Polar Express", 71.71], ["astra", "Architecture", "KAMI", 22.04], ["astra", "Machine Learning", "Nano World Model", 80.85], ["astra", "Database", "Yannakakis", 12.68], ["astra", "Security", "Spectre", 81.82], ["astra", "Database", "Approximate-MIPS Query Stopping", 84.77], ["astra", "Cryptography", "Structured LWE", 85.5], ["astra", "MLSys", "kmeans kernel", 47.4], ["astra", "Network", "MetaOpt", 0.0], ["astra", "Database", "FARGO paper-aligned query core", 52.37], ["astra", "HPC", "Hygra", 58.84], ["astra", "MLSys", "knn kernel", 43.2], ["astra", "Programming Languages", "egg", 61.31], ["astra", "Machine Learning", "RAGEN", 98.92], ["astra", "Database", "ScaleGPM", 90.31], ["astra", "Robotics", "MuJoCo Playground", 100.0], ["astra", "Database", "Seer", 81.27], ["astra", "Network", "BBQ", 71.77], ["astra", "Security", "Opal", 99.17], ["astra", "Programming Languages", "Polygon", 92.13], ["astra", "HPC", "RegionsSort", 51.26], ["astra", "MLSys", "ivf_pq kernel", 78.45], ["astra", "Database", "Persistent Treap Update Engine", 41.68], ["astra", "Database", "SCOPE", 67.92], ["astra", "Programming Languages", "BABBLE", 18.45], ["astra", "Robotics", "Diffusion Policy", 57.01], ["astra", "Network", "Shockwave", 47.03], ["ds", "Security", "Adaptive attacks", 80.74], ["ds", "Database", "Spectrum", 60.08], ["ds", "HPC", "ParButterfly", 52.9], ["ds", "Machine Learning", "DyT", 49.32], ["ds", "Machine Learning", "Polar Express", 64.91], ["ds", "Machine Learning", "Nano World Model", 80.55], ["ds", "Database", "Yannakakis", 10.38], ["ds", "Database", "Approximate-MIPS Query Stopping", 86.79], ["ds", "Cryptography", "Structured LWE", 72.0], ["ds", "MLSys", "kmeans kernel", 51.04], ["ds", "Database", "FARGO paper-aligned query core", 52.21], ["ds", "HPC", "Hygra", 58.72], ["ds", "MLSys", "knn kernel", 7.85], ["ds", "Programming Languages", "egg", 60.33], ["ds", "Machine Learning", "RAGEN", 17.48], ["ds", "Database", "ScaleGPM", 90.44], ["ds", "Robotics", "MuJoCo Playground", 37.95], ["ds", "MLSys", "dbscan kernel", 66.68], ["ds", "Database", "Seer", 81.47], ["ds", "Network", "BBQ", 66.09], ["ds", "Security", "Opal", 99.17], ["ds", "Programming Languages", "Polygon", 92.13], ["ds", "HPC", "RegionsSort", 51.13], ["ds", "MLSys", "ivf_pq kernel", 77.5], ["ds", "Database", "Persistent Treap Update Engine", 36.7], ["ds", "Database", "SCOPE", 26.81], ["ds", "Programming Languages", "BABBLE", 17.47], ["ds", "Machine Learning", "Robust Image Tokenizer", 73.12], ["ds", "MLSys", "SVG-EAR", 30.64], ["ds", "Network", "Shockwave", 44.32], ["glm", "Security", "Adaptive attacks", 80.74], ["glm", "Database", "Residual State Advancement", 9.33], ["glm", "Machine Learning", "Differentiable Population Statistics", 4.51], ["glm", "Security", "Progent", 92.99], ["glm", "Database", "Spectrum", 78.62], ["glm", "HPC", "Parallel DBSCAN", 76.49], ["glm", "HPC", "ParButterfly", 54.81], ["glm", "Machine Learning", "DyT", 48.82], ["glm", "Machine Learning", "Polar Express", 61.32], ["glm", "Robotics", "Diffusion Policy", 41.61], ["glm", "Architecture", "KAMI", 20.51], ["glm", "Machine Learning", "Nano World Model", 80.43], ["glm", "Database", "Yannakakis", 10.03], ["glm", "Security", "Spectre", 81.27], ["glm", "Database", "Approximate-MIPS Query Stopping", 84.85], ["glm", "Cryptography", "Structured LWE", 58.0], ["glm", "MLSys", "kmeans kernel", 49.91], ["glm", "Network", "MetaOpt", 0.0], ["glm", "Database", "FARGO paper-aligned query core", 52.15], ["glm", "HPC", "Hygra", 57.51], ["glm", "MLSys", "knn kernel", 23.84], ["glm", "Programming Languages", "egg", 61.4], ["glm", "Machine Learning", "RAGEN", 32.75], ["glm", "Database", "ScaleGPM", 87.97], ["glm", "Robotics", "MuJoCo Playground", 33.33], ["glm", "MLSys", "dbscan kernel", 59.96], ["glm", "Database", "Seer", 81.21], ["glm", "Network", "BBQ", 45.45], ["glm", "Security", "Opal", 99.17], ["glm", "Programming Languages", "Polygon", 92.13], ["glm", "Architecture", "Clusterwise SpGEMM", 0.0], ["glm", "HPC", "RegionsSort", 48.87], ["glm", "MLSys", "ivf_pq kernel", 77.25], ["glm", "Security", "Hacking Blind", 100.0], ["glm", "Database", "Persistent Treap Update Engine", 10.39], ["glm", "Database", "SCOPE", 31.17], ["glm", "Programming Languages", "BABBLE", 18.34], ["glm", "Machine Learning", "Robust Image Tokenizer", 72.1], ["glm", "MLSys", "SVG-EAR", 0.0], ["glm", "Network", "Shockwave", 46.54]].map(([m, d, t, s]) => ({m, d, t, s}));
const MODELS = [
  {id:'astra', name:'GPT-6 Astra', short:'GPT-6 Astra', h:'Codex CLI', lab:'OpenAI'},
  {id:'sol', name:'GPT-6.1 Sol', short:'GPT-6.1 Sol', h:'Codex CLI', lab:'OpenAI'},
  {id:'muse', name:'Muse Spark 1.3', short:'Muse Spark', h:'Muse Code', lab:'Meta'},
  {id:'k3', name:'Kimi K3', short:'Kimi K3', h:'Kimi Code', lab:'Kimi'},
  {id:'k27', name:'Kimi K2.7 Code', short:'Kimi K2.7', h:'Kimi CLI', lab:'Kimi'},
  {id:'qwen', name:'Qwen 3.8 Max Code', short:'Qwen 3.8 Max', h:'', lab:'Qwen'},
  {id:'ds', name:'DeepSeek V4.1 Flash', short:'DeepSeek V4.1', h:'DSH', lab:'DeepSeek'},
  {id:'glm', name:'GLM 5.3', short:'GLM 5.3', h:'ZCode', lab:'Z.ai'},
];
const UPDATED = 'October 8, 2026';
// ECI per model: [point, 90% low, 90% high, tasks]; Human (the authors' reference) is 100 and Kimi K2.7 Code is 20 (300 task resamples).
const ECI = {"astra": [129.3, 115.1, 174.3, 30], "sol": [125.5, 105.8, 164.0, 40], "muse": [95.0, 85.9, 124.1, 40], "k3": [95.2, 87.1, 132.2, 40], "k27": [20.0, 20.0, 20.0, 34], "qwen": [93.6, 80.2, 127.3, 19], "ds": [100.4, 99.8, 137.1, 30], "glm": [101.5, 87.5, 130.9, 40]};
const ECI_LOW = 'k27', ECI_REF_TASKS = 38;
const RAN = new Set(RUNS.map(r => r.t));
const mean = a => a.reduce((x, y) => x + y, 0) / a.length;
const f1 = x => x.toFixed(1);

// Four GPT-6 Astra runs from the paper's case studies (tex/4_experiments.tex, fig/case_*.py and the source notes there).
// Indices are 0-based submissions. fin = the run's final score (Table 1 run). min = minutes into the run, from the submission ULIDs.
const CASES = [
  {id:'dbscan', name:'GPU DBSCAN', domain:'MLSys', fin:63.98,
   title:'Latency falls from 46.5 to 3.6 ms in three steps',
   task:[['Task','Speed up a naive but correct DBSCAN implementation in PyTorch and Triton on one H100.'],
         ['Score','Grows with the speedup over the naive code. Zero if any clustering has an adjusted Rand index below 0.99.'],
         ['Bar','To beat the reference, it must be faster than flashlib’s kernel on every workload with no loss in quality.']],
   score:[38.1,38.4,52.8,0.0,0.0,53.3,0.0,0.0,54.3,59.2,57.3,64.5],
   metric:{label:'Latency on one development workload', unit:'ms', log:true, y:[46.5,45.0,14.9,15.3,14.9,13.1,13.1,18.4,12.6,7.0,5.7,3.6], ydom:[2.5,64], yt:[3,10,30], lower:true},
   bad:[3,4,6,7], badLabel:'Correctness gate missed', badNote:'One development workload has an adjusted Rand index of 0.714, below the 0.99 gate.',
   phases:[{a:2,b:2,l:'64 nearest neighbors', s:'64 NN',n:'The patch keeps only each core point’s 64 nearest core neighbors. The speedup triples, but on some inputs the subset disconnects a cluster.'},
           {a:3,b:8,l:'Variant and repair alternate', s:'Variant, repair',n:'The agent alternates between the 64-neighbor variant and a repair. 4 of these 6 submissions score zero.'},
           {a:9,b:11,l:'Tiled bf16 GEMM, bit-packed adjacency', s:'bf16 GEMM',n:'A tiled bfloat16 GEMM builds the radius graph and connected components run on the GPU. A bit-packed adjacency then gives the final speedup.'}],
   ann:[{p:'metric', i:2, t:['64 nearest neighbors','speedup triples'], dx:46, dy:-40},
        {p:'score', i:4, t:['4 submissions miss','the correctness gate'], dx:34, dy:-24},
        {p:'metric', i:9, t:['Tiled bf16 GEMM,','bit-packed adjacency'], dx:-40, dy:42}],
   final:{beat:false, chip:'Below the reference', short:'Faster on 3 of 4 workloads', n:'The final patch is byte-identical to submission 12. It is faster than the reference on 3 of 4 final workloads and keeps clustering quality on all 4.'}},
  {id:'lwe', name:'Structured LWE', domain:'Cryptography', fin:82.0,
   title:'153 of 200 instances solved in the first 36 minutes',
   task:[['Task','Recover the secret of 200 learning-with-errors instances in 10 families, with 8 CPU cores, fplll and 3 hours.'],
         ['Score','The percentage of instances solved.'],
         ['Bar','To meet the bar, it must solve all 200.']],
   min:[10.1,19.7,36.2,45.5,84.0,88.3,118.5], finMin:130.4,
   metric:{label:'Instances solved, of 200', unit:'solved', y:[86,146,153,161,162,164,166], fy:164, ydom:[0,200], yt:[0,100,200]},
   fam:{names:['Dense A, binary s','Dense A, ternary s','Dense A, small s','Sparse A, mod-q s','Sparse small A, mod-q s','Dense binary A, mod-q s','Dense ternary A, mod-q s','Sparse A, sparse s','Sparse small A, sparse s','Dense small A, small s'],
        // solved per family at submissions 1..7, then the final submission
        v:[[6,6,7,10,11,13,14,13],[6,6,6,6,6,6,6,6],[5,6,6,6,6,6,6,6],[5,20,20,20,20,20,20,20],[6,20,20,20,20,20,20,20],
           [6,18,20,20,20,20,20,20],[6,19,20,20,20,20,20,20],[6,11,14,19,19,19,20,19],[20,20,20,20,20,20,20,20],[20,20,20,20,20,20,20,20]]},
   bad:[],
   phases:[{a:0,b:2,l:'Six families complete',n:'6 of the 10 families are complete by 36 minutes.'},
           {a:3,b:6,l:'Two families gain',n:'The remaining 80 minutes add solutions in only 2 families.'}],
   ann:[{p:'metric', i:2, t:['153 solved by 36 min','6 families complete'], dx:40, dy:46}],
   final:{beat:false, chip:'Below the bar', short:'164 of 200 solved', n:'The stored final submission holds 164 solutions, 2 fewer than submission 7. Dense A with a ternary or small secret never exceeds 6 of 20.'}},
  {id:'hygra', name:'Hypergraph cores', domain:'HPC', fin:48.74,
   title:'The fourth submission halves the runtime, and no later one is faster',
   task:[['Task','Write the k-core peeling of Hygra, a hypergraph framework, on 8 OpenMP threads.'],
         ['Score','Falls exponentially with runtime. Zero for any wrong core number.'],
         ['Bar','To beat the reference, it must be at least 3% faster than the authors’ code on every workload.']],
   min:[3.1,6.6,10.7,14.0,18.2,20.9,23.1,24.7], finMin:27.8,
   score:[19.8,36.2,37.0,60.9,60.5,49.6,49.6,49.3],
   metric:{label:'Median runtime of the complete process', unit:'s', y:[0.405,0.254,0.249,0.124,0.126,0.175,0.175,0.177], ydom:[0,0.45], yt:[0,0.2,0.4], lower:true},
   bad:[],
   phases:[{a:3,b:3,l:'Parallel frontier',n:'A parallel frontier with per-thread buffers halves the runtime, from 0.41 s at the first submission to 0.12 s.'},
           {a:4,b:7,l:'Slower variants',n:'Variants with prefetch hints and other OpenMP schedules are all slower, and the agent keeps submission 4.'}],
   ann:[{p:'metric', i:3, t:['Parallel frontier','runtime halves to 0.12 s'], dx:30, dy:-66},
        {p:'metric', i:6, t:['Prefetch hints, other','schedules: all slower'], dx:10, dy:-62, mob:false}],
   final:{beat:true, chip:'Beats the reference', short:'Faster on 4 of 4 workloads', n:'The final patch is submission 4. It beats the reference on all 4 final workloads, yet runs only 1.03 to 1.04× faster on 8 threads than on 1. The reference runs 5.8 to 6.1× faster.'}},
  {id:'metaopt', name:'MetaOpt', domain:'Network', fin:51.54,
   title:'7 of 10 submissions fail validation',
   task:[['Task','Find a traffic matrix with at most 9 demands that maximizes the gap between optimal routing and the better of POP and demand pinning.'],
         ['Score','Grows with the mean gap. 256 oracle queries per instance, within 30 s.'],
         ['Bar','To beat the reference, its gap must match or exceed the reference’s on every instance.']],
   min:[4.2,7.4,11.5,13.3,15.7,17.1,20.2,21.7,24.0,26.1], finMin:30.9,
   score:[31.7,0,0,0,0,48.5,0,0,0,51.0],
   metric:{label:'Mean adversarial gap, 15 development instances', unit:'gap', y:[15.3,null,null,null,null,26.6,null,null,null,28.5], ydom:[0,32], yt:[0,15,30]},
   bad:[1,2,3,4,6,7,8], badLabel:'Failed validation', badNote:'The submission fails validation, so it scores zero.',
   phases:[{a:0,b:0,l:'Random local search', s:'Local search',n:'A random local search reaches a mean gap of 15.3.'},
           {a:5,b:5,l:'Own LP evaluator', s:'Own LP',n:'The agent’s own linear-program evaluator raises the mean gap to 26.6.'},
           {a:9,b:9,l:'OR-Tools dual simplex', s:'OR-Tools',n:'An OR-Tools dual simplex raises the mean gap to 28.5.'}],
   ann:[{p:'score', i:2, t:['7 of 10 submissions','fail validation'], dx:34, dy:-24},
        {p:'metric', i:0, t:['Random local search'], dx:24, dy:-22, mob:false},
        {p:'metric', i:5, t:['Own LP evaluator'], dx:-26, dy:-22},
        {p:'metric', i:9, t:['OR-Tools dual simplex'], dx:-24, dy:48}],
   final:{beat:false, chip:'Below the reference', short:'Short on 1 of 30 instances', n:'The final score is 51.5 against the reference’s 47.8, but the gap falls short of the reference on 1 of the 30 final instances.'}},
];

const yfmt = (u, v) => u === 's' ? (v === 0 ? '0' : v.toFixed(2).replace(/0$/, '')) : String(v);
const esc = s => String(s).replace(/[&<>"]/g, ch => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[ch]));


const $ = s => document.querySelector(s);
const NS = 'http://www.w3.org/2000/svg';
const sv = (tag, a = {}, text) => { const e = document.createElementNS(NS, tag);
  for (const k in a) if (a[k] != null) { if (tag === 'text' && /^(fill|font-size|font-weight)$/.test(k)) e.style.setProperty(k, k === 'font-size' ? a[k] + 'px' : a[k]); else e.setAttribute(k, a[k]); }
  if (text != null) e.textContent = text; return e; };
const MCOL = Object.fromEntries(MODELS.map(m => [m.id, `var(--m-${m.id})`]));
// Models ranked by ECI, the leaderboard's main number (bin/fcs2_runs_from_db.py fits it).
const RANKED = [...MODELS].sort((a, b) => ECI[b.id][0] - ECI[a.id][0]);
const NTASK = rs => new Set(rs.map(r => r.t)).size;
/* numbers in the page text come from the data, so they cannot drift from the chart */
document.querySelectorAll('[data-fill]').forEach(el => { el.textContent = {updated:`Last updated: ${UPDATED}`, runs:String(RUNS.length),
  runtasks:`on ${NTASK(RUNS)} tasks`, models:`${MODELS.length} models from ${new Set(MODELS.map(m => m.lab)).size} labs have run so far.`,
  summary:`${RUNS.length} runs on ${NTASK(RUNS)} tasks by ${MODELS.length} models`}[el.dataset.fill]; });
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
let metric = 'eci', group = 'model', dom = 'All', showRuns = true;
const DOMS_WITH_RUNS = DOMAINS.filter(d => RUNS.some(r => r.d === d));
$('#domradios').innerHTML = ['All', ...DOMS_WITH_RUNS].map(d => `<label><input type="radio" name="dom" value="${esc(d)}" ${d === 'All' ? 'checked' : ''}>${d === 'All' ? 'All domains' : esc(d)}<span class="n num">${RUNS.filter(r => d === 'All' || r.d === d).length}</span></label>`).join('');
$('#domradios').addEventListener('change', e => { dom = e.target.value; drawLB(); });
$('#groupby').addEventListener('click', e => { const b = e.target.closest('.chip'); if (!b) return; group = b.dataset.g;
  [...$('#groupby').children].forEach(c => c.setAttribute('aria-pressed', String(c === b))); drawLB(); });
$('#metric').addEventListener('click', e => { const b = e.target.closest('.chip'); if (!b) return; metric = b.dataset.k;
  [...$('#metric').children].forEach(c => c.setAttribute('aria-pressed', String(c === b))); $('#scoreopts').hidden = metric !== 'score'; drawLB(); });
$('#showruns').addEventListener('change', e => { showRuns = e.target.checked; drawLB(); });
$('#custom').addEventListener('click', () => { const s = $('#settings'); const o = !s.classList.contains('open'); s.classList.toggle('open', o); $('#custom').setAttribute('aria-expanded', String(o)); });
$('#lblegend').innerHTML = RANKED.map(m => `<span><i style="background:${MCOL[m.id]}"></i>${esc(m.name)}</span>`).join('');

/* ECI view: one row per model, the 90% interval as a bar, Human (the authors' reference code) as a dashed line at 100 */
function drawECI() {
  $('#ylab').textContent = 'ECI, FrontierCS 2 capabilities index';
  $('#lbnote').textContent = 'Preliminary · Human = 100 (the authors’ reference code), Kimi K2.7 Code = 20 · bars are 90% intervals';
  $('#nres').textContent = `${RUNS.length} runs`;
  const svg = $('#lbsvg'), box = $('#lbplot'), W = Math.max(300, box.clientWidth), narrow = W < 560;
  const L = narrow ? 112 : 190, R = 34, T = 26, B = 46, lane = narrow ? 56 : 64;
  const xmax = Math.ceil(Math.max(...MODELS.map(m => ECI[m.id][2])) / 20) * 20, step = narrow && xmax > 120 ? 40 : 20;
  const H = T + RANKED.length * lane + B;
  svg.setAttribute('viewBox', `0 0 ${W} ${H}`); svg.setAttribute('height', H); svg.replaceChildren();
  const X = v => L + v / xmax * (W - L - R);
  for (let v = 0; v <= xmax; v += step) {
    svg.append(sv('line', {x1:X(v), x2:X(v), y1:T, y2:H - B + 6, stroke:'var(--grid)', 'stroke-width':1}));
    svg.append(sv('text', {x:X(v), y:H - B + 22, 'text-anchor':'middle'}, v));
  }
  svg.append(sv('line', {x1:X(100), x2:X(100), y1:T - 6, y2:H - B + 6, stroke:'var(--ink-2)', 'stroke-width':1.2, 'stroke-dasharray':'4 4'}));
  svg.append(sv('text', {class:'an', x:X(100) + (narrow ? -6 : 6), y:T - 12, 'text-anchor': narrow ? 'end' : 'start', 'font-size':12.5}, 'Human = 100'));
  svg.append(sv('text', {class:'ax', x:L + (W - L - R) / 2, y:H - 6, 'text-anchor':'middle'}, 'ECI'));
  const pts = [];
  RANKED.forEach((m, i) => {
    const [e, lo, hi, nt] = ECI[m.id], y0 = T + i * lane, yc = y0 + lane / 2, anchor = m.id === ECI_LOW;
    if (i) svg.append(sv('line', {x1:0, x2:W - R, y1:y0, y2:y0, stroke:'var(--line)', 'stroke-width':1}));
    const name = narrow ? m.short : m.name;
    svg.append(sv('text', {class:'lab', x:0, y:yc + (m.h ? -3 : 4)}, name));
    if (m.h) svg.append(sv('text', {x:0, y:yc + 14, 'font-size':12}, m.h));
    if (!anchor) {
      svg.append(sv('line', {x1:X(lo), x2:X(hi), y1:yc, y2:yc, stroke:MCOL[m.id], 'stroke-width':6, 'stroke-linecap':'round', opacity:.25}));
    }
    svg.append(sv('circle', {cx:X(e), cy:yc, r:7, fill:MCOL[m.id], stroke:'#fff', 'stroke-width':2}));
    svg.append(sv('text', {class:'val halo', x:X(e), y:yc - 13, fill:MCOL[m.id], 'text-anchor':'middle'}, Math.round(e)));
    const nr = RUNS.filter(r => r.m === m.id).length;
    pts.push({x:X(e), y:yc, mean:true, html:`<b>${esc(m.name)}</b><br>ECI <b>${f1(e)}</b>${anchor ? ` (anchor, fixed at ${ECI[m.id][0]})` : `<br>90% interval ${Math.round(lo)}–${Math.round(hi)}`}<br>${nr} runs on ${NTASK(RUNS.filter(r => r.m === m.id))} tasks`});
  });
  attachTip(svg, W, H, pts);
}
function attachTip(svg, W, H, pts) {
  const tip = $('#lbtip');
  const near = ev => { const rc = svg.getBoundingClientRect(), px = (ev.clientX - rc.left) * W / rc.width, py = (ev.clientY - rc.top) * H / rc.height;
    let best = null, bd = 1e9; pts.forEach(p => { const d = Math.hypot(p.x - px, p.y - py) - (p.mean ? 4 : 0); if (d < bd) { bd = d; best = p; } });
    return bd < 28 ? {p:best, rc} : null; };
  svg.onpointermove = ev => { const n = near(ev); if (!n) { tip.hidden = true; return; }
    tip.innerHTML = n.p.html; tip.hidden = false; tip.style.left = (n.p.x / W * n.rc.width) + 'px'; tip.style.top = (n.p.y / H * n.rc.height) + 'px'; };
  svg.onpointerdown = svg.onpointermove;
  svg.onpointerleave = () => { if (!isTouch) tip.hidden = true; };
}

function drawLB() {
  if (metric === 'eci') return drawECI();
  $('#ylab').textContent = 'Final score, mean over runs';
  $('#lbnote').textContent = 'Preliminary · scores on each task’s own 0–100 scale · each model ran its own set of tasks';
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
    const vals = RANKED.map(m => { const s = RUNS.filter(r => r.m === m.id && (d === 'All' || r.d === d)).map(r => r.s); return s.length ? mean(s) : null; });
    const best = Math.max(...vals.filter(v => v != null));
    const n = NTASK(RUNS.filter(r => d === 'All' || r.d === d));
    return `<tr class="${cls || ''}"><td>${d === 'All' ? 'All tasks' : esc(d)}</td><td class="tk">${n}</td>${vals.map(v => v == null ? '<td class="e">–</td>' : `<td class="${v === best && vals.filter(x => x != null).length > 1 ? 'best' : ''}">${f1(v)}</td>`).join('')}</tr>`;
  };
  $('#restbl').innerHTML = head + DOMS_WITH_RUNS.map(d => line(d)).join('') + line('All', 'all');
}

/* ---------- case studies: one chart per run, in the grammar of Epoch's data insights ---------- */
const MSHORT = {ms:'Latency', s:'Runtime', solved:'Instances solved', gap:'Mean gap'};
const ufmt = (u, v) => u === 'ms' || u === 's' ? yfmt(u, v) + ' ' + u : String(v);
const NFIN = c => c.metric.y.length;
const C_ON = '#0b57d0', C_OFF = '#bdc1c6', C_FIN = '#1f1f1f', C_INK = '#1f1f1f';
let cur = CASES[0];
const ctabs = $('#ctabs');
ctabs.innerHTML = CASES.map((c, i) => `<button type="button" role="tab" aria-selected="${i === 0}" data-i="${i}">${esc(c.name)}</button>`).join('');
ctabs.addEventListener('click', e => { const b = e.target.closest('button'); if (!b) return; cur = CASES[+b.dataset.i];
  [...ctabs.children].forEach(x => x.setAttribute('aria-selected', String(x === b))); reveal(b); renderCase(); });

function renderCase() {
  const c = cur;
  $('#cmeta').innerHTML = `<span class="dotm"><i></i>GPT-6 Astra</span><span>${esc(c.domain)}</span><span class="vd ${c.final.beat ? 'yes' : 'no'}">${esc(c.final.chip)}</span>`;
  $('#ctitle').textContent = c.title;
  $('#cdesc').innerHTML = `${esc(c.task[0][1])} <span>${esc(c.task[2][1])}</span>`;
  const sw = (col, round) => `<i style="background:${col}${round ? ';border-radius:50%' : ''}"></i>`;
  const leg = c.fam ? [[C_ON, 'Instances solved', 1], [C_FIN, 'Final submission, hidden suite', 1], [C_ON, 'Family complete'], [C_OFF, 'Family incomplete']]
    : [[C_ON, 'Scored submission', 1], ...(c.bad.length ? [[C_OFF, c.badLabel + ', score 0', 1]] : []), [C_FIN, 'Final submission, hidden suite', 1]];
  $('#clegend').innerHTML = leg.map(([col, l, r]) => `<span>${sw(col, r)}${esc(l)}</span>`).join('');
  $('#cnote').textContent = c.final.n;
  drawCase();
}

let cgeo = null;
function drawCase() {
  const c = cur, n = NFIN(c), m = c.metric, svg = $('#csvg'), box = $('#cplot'), W = Math.max(280, box.clientWidth), narrow = W < 560;
  const FS = narrow ? 12 : 13, L = narrow ? 36 : 46, R = narrow ? 34 : 44, byTime = !!c.fam;
  svg.replaceChildren();
  const defs = sv('defs'), mk = sv('marker', {id:'carr', viewBox:'0 0 8 8', refX:7, refY:4, markerWidth:8, markerHeight:8, orient:'auto'});
  mk.append(sv('path', {d:'M1,1 L7,4 L1,7', fill:'none', stroke:C_INK, 'stroke-width':1.2, 'stroke-linecap':'round', 'stroke-linejoin':'round'})); defs.append(mk); svg.append(defs);
  // x: submissions (or minutes for LWE), then a gap, then the final submission
  const xd = byTime ? [0, c.finMin + 6] : [-0.5, n + 0.5];
  const X = v => L + (v - xd[0]) / (xd[1] - xd[0]) * (W - L - R);
  const xi = i => byTime ? X(i === n ? c.finMin : c.min[i]) : X(i === n ? n + 0.1 : i);
  const sepX = byTime ? X((c.min[n - 1] + c.finMin) / 2) : X(n - 0.45);
  const panels = [];
  if (c.score) panels.push({k:'score', title:'Development score', h:narrow ? 120 : 150, yd:[0, 100], yt:[0, 50, 100]});
  panels.push({k:'metric', title: m.label + (m.unit === 'ms' || m.unit === 's' ? ` (${m.unit}${m.log ? ', log scale' : ''})` : ''), h:narrow ? 140 : 180, yd:m.ydom, yt:m.yt, log:m.log});
  let y = 0; const TT = 26, GAPP = 30;
  panels.forEach((p, k) => { p.top = y + TT; p.bot = p.top + p.h; y = p.bot + (k < panels.length - 1 ? GAPP : 0);
    p.Y = p.log ? v => p.bot - (Math.log(v) - Math.log(p.yd[0])) / (Math.log(p.yd[1]) - Math.log(p.yd[0])) * p.h : v => p.bot - (v - p.yd[0]) / (p.yd[1] - p.yd[0]) * p.h; });
  const axisY = y, H0 = axisY + (narrow ? 38 : 40);
  // x ticks
  const ticks = [];
  if (byTime) { [0, 30, 60, 90, 120].forEach(v => { if (Math.abs(X(v) - xi(n)) > 34) ticks.push([X(v), String(v)]); }); }
  else { const step = (W - L - R) / (n + 1) < 24 ? 2 : 1; for (let i = 0; i < n; i++) if (i % step === 0 || (i === n - 1 && i % step === 0)) ticks.push([xi(i), String(i + 1)]); }
  ticks.push([xi(n), 'Final']);
  panels.forEach(p => {
    svg.append(sv('text', {class:'pt', x:0, y:p.top - 12}, p.title));
    ticks.forEach(([x]) => svg.append(sv('line', {x1:x, x2:x, y1:p.top, y2:p.bot, stroke:'#e8eef0'})));
    p.yt.forEach(v => { svg.append(sv('line', {x1:L, x2:W - R + 14, y1:p.Y(v), y2:p.Y(v), stroke:'#e8eef0'}));
      svg.append(sv('text', {class:'tk', x:L - 8, y:p.Y(v) + 4, 'text-anchor':'end'}, yfmt(m.unit === 's' && p.k === 'metric' ? 's' : '', v))); });
    svg.append(sv('line', {x1:sepX, x2:sepX, y1:p.top - 4, y2:p.bot, stroke:'#9aa0a6', 'stroke-dasharray':'5 4'}));
  });
  const first = panels[0];
  svg.append(sv('line', {x1:L, x2:W - R + 14, y1:axisY, y2:axisY, stroke:'#c7caca', 'stroke-width':1.5}));
  ticks.forEach(([x, t]) => { svg.append(sv('line', {x1:x, x2:x, y1:axisY, y2:axisY + 5, stroke:'#c7caca', 'stroke-width':1.5}));
    svg.append(sv('text', {class:'tk', x, y:axisY + 19, 'text-anchor':'middle', 'font-weight': t === 'Final' ? 600 : null}, t)); });
  svg.append(sv('text', {class:'tk', x:L + (sepX - L) / 2, y:axisY + 36, 'text-anchor':'middle'}, byTime ? 'Minutes into the run' : 'Submission'));
  // series
  const bad = new Set(c.bad), pts = {};
  panels.forEach(p => {
    const vals = p.k === 'score' ? c.score : m.y, fin = p.k === 'score' ? c.fin : m.fy;
    const P = vals.map((v, i) => v == null ? null : {i, x:xi(i), y:p.Y(v), v, ok:!bad.has(i)}).filter(Boolean);
    const ok = P.filter(q => q.ok);
    svg.append(sv('path', {d:'M' + ok.map(q => q.x.toFixed(1) + ',' + q.y.toFixed(1)).join(' L'), fill:'none', stroke:C_ON, 'stroke-width':1.5, 'stroke-linejoin':'round'}));
    P.forEach(q => svg.append(sv('circle', {cx:q.x, cy:q.y, r:narrow ? 3.2 : 3.8, fill: q.ok ? C_ON : C_OFF})));
    if (fin != null) { const fy = p.Y(fin); svg.append(sv('circle', {cx:xi(n), cy:fy, r:narrow ? 4 : 4.6, fill:C_FIN}));
      const lab = sv('text', {class:'an b', x:xi(n), y: fy - 11, 'text-anchor':'middle'}, p.k === 'score' ? f1(fin) : ufmt(m.unit, fin)); svg.append(lab);
      P.push({i:n, x:xi(n), y:fy, v:fin}); }
    pts[p.k] = P; p.P = P;
  });
  // annotations: bold first line, regular second, a curved arrow to the point (Epoch's data-insight style)
  const placed = [];
  (c.ann || []).forEach(a => {
    if (narrow && a.mob === false) return;
    const p = panels.find(q => q.k === a.p), q = p && p.P.find(z => z.i === a.i); if (!q) return;
    const k = narrow ? .75 : 1, start = a.dx >= 0, lh = FS + 3;
    let bx = q.x + a.dx * k, by = q.y + a.dy * k;
    const g = sv('g'); svg.append(g);
    const ts = a.t.map((line, j) => { const t = sv('text', {class:'an' + (j === 0 ? ' b' : ''), x:0, y:0, 'text-anchor': start ? 'start' : 'end'}, line); g.append(t); return t; });
    const w = Math.max(...ts.map(t => t.getComputedTextLength())), h = lh * a.t.length;
    let x0 = start ? bx : bx - w; x0 = Math.max(0, Math.min(W - w, x0)); bx = start ? x0 : x0 + w;
    let y0 = a.dy < 0 ? by - h : by; y0 = Math.max(p.top + 2, Math.min(p.bot - h, y0));
    const rect = [x0 - 4, y0 - 2, x0 + w + 4, y0 + h + 2];
    if (placed.some(r => !(rect[2] < r[0] || rect[0] > r[2] || rect[3] < r[1] || rect[1] > r[3]))) { g.remove(); return; }
    placed.push(rect);
    ts.forEach((t, j) => { t.setAttribute('x', bx); t.setAttribute('y', y0 + FS + j * lh); });
    const sx = start ? x0 - 5 : x0 + w + 5, sy = a.dy < 0 ? y0 + h * .5 : y0 + FS * .6;
    const ang = Math.atan2(q.y - sy, q.x - sx), ex = q.x - Math.cos(ang) * 8, ey = q.y - Math.sin(ang) * 8;
    g.append(sv('path', {d:`M${sx},${sy} Q${ex},${sy} ${ex},${ey}`, fill:'none', stroke:C_INK, 'stroke-width':1.2, 'marker-end':'url(#carr)'}));
  });
  // LWE: solved per family at submission 7, as horizontal bars
  let H = H0;
  if (c.fam) {
    const top = H0 + 34, rh = narrow ? 21 : 23, FR = 30,
      FL = 10 + Math.max(...c.fam.names.map(nm => { const t = sv('text', {class:'tk fam', x:-999, y:-999}, nm); svg.append(t); const w = t.getComputedTextLength(); t.remove(); return w; })), k7 = n - 1, BX = v => FL + v / 20 * (W - FL - FR);
    svg.append(sv('text', {class:'pt', x:0, y:top - 12}, `Solved per family at submission ${n}, of 20`));
    [0, 10, 20].forEach(v => { svg.append(sv('line', {x1:BX(v), x2:BX(v), y1:top, y2:top + rh * 10, stroke:'#e8eef0'}));
      svg.append(sv('text', {class:'tk', x:BX(v), y:top + rh * 10 + 18, 'text-anchor':'middle'}, v)); });
    c.fam.names.forEach((nm, r) => { const v = c.fam.v[r][k7], yy = top + r * rh;
      svg.append(sv('text', {class:'tk fam', x:FL - 10, y:yy + rh / 2 + 4, 'text-anchor':'end'}, nm));
      svg.append(sv('rect', {x:FL, y:yy + 4, width:Math.max(1, BX(v) - FL), height:rh - 8, rx:2, fill: v === 20 ? C_ON : C_OFF, class:'fbar', 'data-r':r}));
      svg.append(sv('text', {class:'tk', x:BX(v) + 6, y:yy + rh / 2 + 4}, v)); });
    H = top + rh * 10 + 26;
  }
  svg.setAttribute('viewBox', `0 0 ${W} ${H}`); svg.setAttribute('height', H);
  const cross = sv('line', {y1:first.top - 4, y2:axisY, stroke:'#5f6368', 'stroke-width':1, opacity:0, 'pointer-events':'none'}); svg.append(cross);
  cgeo = {W, H, n, xi, axisY, top:first.top, cross, panels};
}

const ctip = $('#ctip');
function caseTip(html, x, y) { const rc = $('#cplot').getBoundingClientRect(); ctip.innerHTML = html; ctip.hidden = false;
  // beside the crosshair, on the side with more room, vertically at the pointer (clamped to the plot)
  const k = rc.width / cgeo.W, tw = ctip.offsetWidth, th = ctip.offsetHeight, right = x * k + 14 + tw <= rc.width || x * k < rc.width / 2;
  let left = right ? x * k + 14 : x * k - 14 - tw; left = Math.max(0, Math.min(rc.width - tw, left));
  ctip.style.left = left + 'px'; ctip.style.top = Math.max(0, Math.min(cgeo.H * k - th, y * k - th / 2)) + 'px'; }
function tipFor(i) {
  const c = cur, n = NFIN(c), m = c.metric, fin = i === n, when = fin ? c.finMin : c.min && c.min[i];
  const ph = fin ? null : c.phases.find(p => i >= p.a && i <= p.b), bad = c.bad.includes(i);
  const row = (col, k, v) => `<div class="tr"><i style="background:${col}"></i><span>${k}</span><b>${v}</b></div>`;
  let h = `<div class="th">${fin ? 'Final submission' : 'Submission ' + (i + 1)}${when != null ? ` <span>${when.toFixed(1)} min</span>` : ''}</div>`;
  if (fin) { h += row(C_FIN, 'Final score', f1(c.fin)); if (m.fy != null) h += row(C_FIN, MSHORT[m.unit], ufmt(m.unit, m.fy)); h += `<p>${esc(c.final.chip)}. ${esc(c.final.short)}.</p>`; }
  else { const col = bad ? C_OFF : C_ON;
    if (c.score) h += row(col, 'Development score', f1(c.score[i]));
    h += row(col, MSHORT[m.unit], m.y[i] == null ? 'no valid result' : ufmt(m.unit, m.y[i]));
    if (c.fam) h += row(C_ON, 'Families complete', c.fam.v.filter(r => r[i] === 20).length + ' of 10');
    if (bad) h += `<p>${esc(c.badLabel)}.</p>`; else if (ph) h += `<p>${esc(ph.n)}</p>`; }
  return h;
}
$('#csvg').addEventListener('pointermove', e => {
  if (!cgeo) return; const rc = e.currentTarget.getBoundingClientRect(), k = cgeo.W / rc.width, px = (e.clientX - rc.left) * k, py = (e.clientY - rc.top) * k;
  const fb = e.target.closest('.fbar');
  if (fb) { const r = +fb.dataset.r, v = cur.fam.v[r]; cgeo.cross.setAttribute('opacity', 0);
    caseTip(`<div class="th">${esc(cur.fam.names[r])}</div><p>Solved after each submission: ${v.slice(0, -1).join(', ')}. Final: ${v.at(-1)} of 20.</p>`, px, py); return; }
  if (py < cgeo.top - 20 || py > cgeo.axisY + 8) { ctip.hidden = true; cgeo.cross.setAttribute('opacity', 0); return; }
  let best = 0; for (let i = 0; i <= cgeo.n; i++) if (Math.abs(cgeo.xi(i) - px) < Math.abs(cgeo.xi(best) - px)) best = i;
  const x = cgeo.xi(best); cgeo.cross.setAttribute('x1', x); cgeo.cross.setAttribute('x2', x); cgeo.cross.setAttribute('opacity', .35);
  caseTip(tipFor(best), x, py);
});
$('#csvg').addEventListener('pointerdown', e => $('#csvg').dispatchEvent(new PointerEvent('pointermove', e)));
$('#csvg').addEventListener('pointerleave', e => { if (e.pointerType === 'mouse') { ctip.hidden = true; cgeo && cgeo.cross.setAttribute('opacity', 0); } });
document.addEventListener('pointerdown', e => { if (!e.target.closest('#cplot')) { ctip.hidden = true; cgeo && cgeo.cross.setAttribute('opacity', 0); } });
const redraws = [drawCase];
renderCase();

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

drawLB(); drawTable(); drawRows();
let rz; addEventListener('resize', () => { clearTimeout(rz); rz = setTimeout(() => { drawLB(); drawMap(); redraws.forEach(f => f()); }, 120); });
