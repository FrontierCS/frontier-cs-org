# Data in assets/js/blog-anim.js

PACK: the packings that the programs in the Frontier-CS repository produce for one test case of Polyomino Packing
(algorithmic problem 0, testdata/43.in: 104 pieces, 1,011 cells).

- Sources: `algorithmic/solutions/0/*.cpp` (model submissions) and `algorithmic/problems/0/examples/reference.cpp` (human reference), Frontier-CS at ede1b44d.
- Each was compiled with `g++ -O2 -std=c++17` and run with a 10 s limit in a container without network.
- Each output was checked against the statement's rules (reflect, rotate clockwise, translate; inside W x H; no overlap); invalid ones were dropped (32 of 55 were valid).
- Score = 100 x cells / (W x H), the statement's scoring for one test case.
- Ten packings were kept, from 13.1 to 85.7; taller-than-wide ones are stored on their side.
