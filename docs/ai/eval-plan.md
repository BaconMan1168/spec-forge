# SpecForge — AI Evaluation Plan

## Purpose

This document defines how the MVP AI output will be evaluated for usefulness, trustworthiness, and reliability.

## Evaluation Goals

Evaluate the system on four dimensions:

- quote accuracy
- theme relevance
- proposal usefulness
- low-signal handling

## Core Evaluation Questions

1. Are the quotes actually grounded in the uploaded source material?
2. Are the surfaced themes meaningful and recurring rather than noisy?
3. Are the proposals actionable enough to export and build from?
4. Does the system avoid overconfident output when inputs are weak?

## Primary Evaluation Dimensions

## 1. Quote Accuracy

### Definition

Supporting evidence must reflect real content from uploaded sources.

### What to Check

- quotes are actually present in the source material
- quotes are not fabricated
- quotes are attributed to the right source label
- paraphrases are not falsely presented as direct quotes

### Failure Examples

- invented quote text
- quote attached to wrong source
- quote exaggerated beyond the original meaning

## 2. Theme Relevance

### Definition

Surfaced themes should reflect meaningful recurring pain points or opportunities.

### What to Check

- themes are supported by multiple signals when claimed as recurring
- themes are not overly generic
- themes are not dominated by one-off comments unless explicitly labeled as such
- themes are phrased clearly enough to act on

### Failure Examples

- vague themes like “users want better UX” with no specificity
- duplicate themes stated in slightly different words
- one-off complaints framed as central recurring problems

## 3. Proposal Usefulness

### Definition

A proposal should be actionable enough to share or build from.

### What to Check

- problem statement is clear
- evidence supports the recommendation
- UI/data/workflow sections are coherent
- engineering tasks are atomic and implementation-ready
- proposal scope is appropriately narrow

### Failure Examples

- proposal is too broad
- engineering tasks are vague
- proposal sections repeat the same point without adding value
- recommendation is not clearly tied to evidence

## 4. Low-Signal Handling

### Definition

The system should warn when signal is weak rather than forcing weak synthesis.

### What to Check

- sparse inputs trigger appropriate caution
- insufficient-signal states appear when no meaningful themes exist
- the system does not generate confident but unsupported recommendations

### Failure Examples

- polished proposal generated from one weak comment
- fake consensus from sparse data
- no warning despite extremely limited input

## Suggested Rubric

Use a simple 1–5 scale for each category:

- **1** = poor / unreliable
- **3** = acceptable but needs work
- **5** = strong and trustworthy

Categories:

- quote accuracy
- theme relevance
- proposal usefulness
- low-signal handling

## Test Set Recommendations

Build a small internal evaluation set including:

- strong-signal interview transcripts
- mixed-source feedback sets
- sparse/low-signal inputs
- noisy inputs with conflicting complaints
- corrupt/partial input scenarios at the system level

## Regression Checks

Whenever prompts or model settings change, re-check:

- quote grounding
- duplicate-theme behavior
- proposal format consistency
- engineering task granularity
- low-signal response behavior

## Success Thresholds

The MVP is in a good state when:

- grounded quote accuracy is consistently high
- themes generally match human interpretation of the feedback
- proposals are often useful enough to export without major rewriting
- low-signal inputs are handled cautiously

## Human Review Recommendation

During beta, manually review a meaningful sample of outputs from early users. The goal is not just whether the model is coherent, but whether the outputs are decision-useful.

## Operational Note

Track qualitative feedback from beta users alongside rubric scores so the evaluation reflects both correctness and real-world utility.