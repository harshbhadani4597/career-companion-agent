#!/usr/bin/env python3
"""
Seed Database Script
Generates and verifies standardized knowledge base postings and sample application records.
"""

import os
import sys

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from data.generate_jobs import generate_job_postings

if __name__ == "__main__":
    print("=" * 70)
    print("      AI CAREER COMPANION AGENT — SEED DATABASE GENERATOR")
    print("=" * 70)
    generate_job_postings()
    print("✓ Knowledge base successfully verified and seeded.")
