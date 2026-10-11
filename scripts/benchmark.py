#!/usr/bin/env python3
"""
Performance & Latency Benchmark Script
Measures RAG search latency, multi-factor matching, and multi-turn response times.
"""

import os
import sys

# Ensure project root is in path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from backend.optimize_benchmarks import run_all_benchmarks

if __name__ == "__main__":
    print("=" * 70)
    print("      AI CAREER COMPANION AGENT — BENCHMARK SUITE")
    print("=" * 70)
    run_all_benchmarks()
