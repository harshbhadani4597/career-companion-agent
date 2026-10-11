#!/usr/bin/env python3
"""
Master Test Runner for AI Career Companion Agent
Executes unit tests, integration tests, RAG evaluations, and E2E workflow assertions.
"""

import sys
import unittest

def run_all_tests():
    print("=" * 70)
    print("      AI CAREER COMPANION AGENT — MASTER TEST SUITE RUNNER")
    print("=" * 70)

    loader = unittest.TestLoader()
    suite = unittest.TestSuite()

    # Load test_system.py
    print("-> Discovering tests in backend/test_system.py...")
    suite1 = loader.discover("backend", pattern="test_system.py")
    suite.addTests(suite1)

    # Load test_m4_suite.py
    print("-> Discovering tests in backend/test_m4_suite.py...")
    suite2 = loader.discover("backend", pattern="test_m4_suite.py")
    suite.addTests(suite2)

    runner = unittest.TextTestRunner(verbosity=2)
    result = runner.run(suite)

    print("\n" + "=" * 70)
    print(f"Tests Run: {result.testsRun}")
    print(f"Failures:  {len(result.failures)}")
    print(f"Errors:    {len(result.errors)}")
    print(f"Success:   {result.wasSuccessful()}")
    print("=" * 70)

    if not result.wasSuccessful():
        sys.exit(1)

if __name__ == "__main__":
    run_all_tests()
