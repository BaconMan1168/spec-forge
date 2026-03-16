# SpecForge — Cost Model

## Purpose

This document captures expected MVP costs, AI cost drivers, and scaling considerations.

## One-Time Costs

- domain registration: approximately $15–$20/year
- landing page tool: $0 to low-cost plan depending on custom domain needs

## Monthly Recurring Costs (MVP Phase)

- hosting: approximately $0–$20/month
- LLM API costs: approximately $8–$12/month for first 100 active users based on the source estimate
- database/storage: $0/month at MVP scale on free tier
- waitlist/email tool: $0/month for low subscriber counts
- error monitoring: $0/month on free tier

## AI API Cost Detail

### Baseline Pricing Reference from Source

- input tokens: $3.00 per 1 million
- output tokens: $15.00 per 1 million

### Estimated Usage Per Analysis Run

- around 75,000 input tokens
- around 3,000 output tokens

### Estimated Cost Per Run

- without caching: about $0.27
- with prompt caching enabled: about $0.08–$0.12

### Estimated Monthly AI Cost

- 100 runs/month: about $8–$12
- 500 runs/month: about $40–$60

## Total Estimated MVP Cost

### Pre-Launch

- approximately $15–$40 one-time

### Monthly Burn During MVP

- approximately $20–$70/month depending on usage

### Marketing Budget

- approximately $200–$500 one-time

### Total First-Month Estimate

- approximately $243–$622

## Primary Cost Driver

LLM API costs are the primary variable cost.

## Cost Optimization Principles

- enable prompt caching from day one
- keep system prompts stable to maximize caching benefit
- validate input before expensive AI calls
- keep scope narrow during MVP
- introduce rate limits or paid plans if usage grows meaningfully
- avoid unnecessary repeated full-project analyses

## Scaling Note

At low volume, AI costs remain modest. If usage spikes, introduce usage controls and pricing before adding major infrastructure complexity.

## Operational Recommendation

Review costs periodically against:

- number of analyses run
- export rate
- returning users
- conversion to willingness-to-pay signals