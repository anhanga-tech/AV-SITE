# Form CRO Dashboards Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build trustworthy dashboards for form conversion, field friction, validation errors, and WhatsApp-vs-saved-lead behavior.

**Architecture:** Use GA4/Looker Studio first as a fast event-quality and marketing sanity check, then make Metabase the durable CRO decision layer once form events are available in a queryable warehouse/table. Do not rely on Metabase directly against brittle GA4 ad hoc exports; Metabase should read clean modeled event data.

**Tech Stack:** GTM/dataLayer, GA4 custom dimensions, optional GA4 BigQuery export or first-party event sink, PostgreSQL/BigQuery-compatible modeled table, Metabase self-hosted, Looker Studio for short-term validation.

---

## Scope

This plan starts after the V1 form CRO instrumentation is deployed. The site already emits non-PII form events through `pushFormAnalyticsEvent`.

Events expected:
- `form_view`
- `form_start`
- `field_complete`
- `field_error`
- `submit_attempt`
- `submit_success`
- `submit_failure`
- `whatsapp_opened`

Dimensions expected:
- `form_type`
- `form_id`
- `field_name`
- `error_type`
- `destination`
- `page_location`

Important constraint: `destination` and `page_location` may become high-cardinality dimensions. Use them for diagnosis, not as primary executive dashboard dimensions.

---

## File/Data Structure

No site code changes are required for the first dashboard pass unless event delivery gaps are found.

Target modeled table for Metabase:

```sql
create table form_events (
  id bigserial primary key,
  event_name text not null,
  form_type text not null,
  form_id text not null,
  field_name text,
  error_type text,
  destination text,
  page_location text,
  session_id text,
  anonymous_id text,
  device_type text,
  utm_source text,
  utm_medium text,
  utm_campaign text,
  created_at timestamptz not null
);

create index form_events_created_at_idx on form_events (created_at);
create index form_events_form_idx on form_events (form_type, form_id, created_at);
create index form_events_error_idx on form_events (form_id, field_name, error_type, created_at);
create index form_events_session_idx on form_events (session_id, created_at);
```

If using BigQuery instead of Postgres, keep the same logical columns and partition by `created_at`.

---

## Chunk 1: GA4/Looker Studio Sanity Check

### Task 1: Configure GA4 Custom Dimensions

**Files:**
- No repo file changes expected.
- Configure in GA4 Admin.

- [ ] **Step 1: Register event-scoped custom dimensions**

Create event-scoped dimensions:
- `form_type`
- `form_id`
- `field_name`
- `error_type`
- `destination`
- `page_location`

- [ ] **Step 2: Confirm events arrive from production/staging**

Use GA4 DebugView or Realtime after interacting with:
- contact modal
- footer CTA
- chat lead form
- direct WhatsApp chat CTA
- quiz pre-result form
- quiz WhatsApp enrichment
- Lollapalooza waitlist
- corporate form
- NPS
- home search

Expected: each interaction emits the relevant event with `form_type` and `form_id`.

- [ ] **Step 3: Create Looker Studio MVP**

Create pages:
- Resumo CRO
- Funil por Formulário
- Erros por Campo
- WhatsApp vs Lead Salvo
- Qualidade dos Eventos

Expected: dashboards show data segmented by `form_type` and `form_id`.

### Task 2: Add Event Quality Checks

**Files:**
- No repo file changes expected.

- [ ] **Step 1: Build quality scorecards**

Metrics:
- events missing `form_type`
- events missing `form_id`
- events with unexpected `event_name`
- events with unexpected `field_name`
- events with unexpected `error_type`

- [ ] **Step 2: Review cardinality**

Check whether `destination` or `page_location` creates noisy reports.

Expected: executive pages rely mainly on `form_type` and `form_id`; detailed exploration can use `destination` and `page_location`.

---

## Chunk 2: Metabase Data Model

### Task 3: Choose the Event Source

**Files:**
- Possible future repo changes if building a first-party endpoint:
  - Create: `api/submit-form-event.ts`
  - Create: `lib/schemas/form-event.ts`
  - Modify: `utils/formAnalytics.ts`
  - Test: `tests/form-event-schema.test.ts`

- [ ] **Step 1: Decide between GA4 BigQuery export and first-party sink**

Recommended order:
1. Use GA4/Looker Studio to validate events.
2. If GA4 BigQuery export is available, model form events from BigQuery first.
3. If BigQuery is unavailable or too indirect, build a first-party event sink.

Expected: one reliable source feeds Metabase.

- [ ] **Step 2: Reject direct Metabase-over-GA4 as the main path**

Do not make the official CRO dashboard depend on brittle GA4 connector behavior or manually exported reports.

Expected: Metabase reads a stable SQL source.

### Task 4: Create the `form_events` Model

**Files:**
- If using Postgres migrations, add migration in the repo-specific migration location.
- If using BigQuery, create a scheduled model/query outside the app repo and document it.

- [ ] **Step 1: Create the modeled table/view**

Use the logical schema from the File/Data Structure section.

- [ ] **Step 2: Backfill recent data**

Backfill at least 14 days if available.

Expected: Metabase can query recent events by form and timestamp.

- [ ] **Step 3: Create a data freshness check**

Query:

```sql
select max(created_at) as latest_event_at
from form_events;
```

Expected: latest event is recent during active traffic periods.

---

## Chunk 3: Metabase Dashboards

### Task 5: Build Executive Dashboard

**Files:**
- No repo file changes expected.

- [ ] **Step 1: Create core funnel cards**

Metrics by `form_type` and `form_id`:
- views: `form_view`
- starts: `form_start`
- attempts: `submit_attempt`
- successes: `submit_success`
- failures: `submit_failure`
- WhatsApp opens: `whatsapp_opened`

- [ ] **Step 2: Create conversion-rate cards**

SQL pattern:

```sql
select
  form_type,
  form_id,
  count(*) filter (where event_name = 'form_view') as views,
  count(*) filter (where event_name = 'form_start') as starts,
  count(*) filter (where event_name = 'submit_attempt') as attempts,
  count(*) filter (where event_name = 'submit_success') as successes,
  count(*) filter (where event_name = 'submit_failure') as failures,
  count(*) filter (where event_name = 'whatsapp_opened') as whatsapp_opens,
  count(*) filter (where event_name = 'form_start')::numeric
    / nullif(count(*) filter (where event_name = 'form_view'), 0) as start_rate,
  count(*) filter (where event_name = 'submit_success')::numeric
    / nullif(count(*) filter (where event_name = 'submit_attempt'), 0) as success_rate
from form_events
where created_at >= now() - interval '30 days'
group by form_type, form_id
order by starts desc;
```

Expected: the team can compare forms without opening GA4.

### Task 6: Build Field/Error Diagnostic Dashboard

**Files:**
- No repo file changes expected.

- [ ] **Step 1: Create errors by field table**

SQL pattern:

```sql
select
  form_type,
  form_id,
  field_name,
  error_type,
  count(*) as error_events
from form_events
where event_name = 'field_error'
  and created_at >= now() - interval '30 days'
group by form_type, form_id, field_name, error_type
order by error_events desc;
```

- [ ] **Step 2: Create errors as share of starts**

SQL pattern:

```sql
with starts as (
  select form_id, count(*) as starts
  from form_events
  where event_name = 'form_start'
    and created_at >= now() - interval '30 days'
  group by form_id
),
errors as (
  select form_id, field_name, error_type, count(*) as errors
  from form_events
  where event_name = 'field_error'
    and created_at >= now() - interval '30 days'
  group by form_id, field_name, error_type
)
select
  errors.form_id,
  errors.field_name,
  errors.error_type,
  errors.errors,
  starts.starts,
  errors.errors::numeric / nullif(starts.starts, 0) as errors_per_start
from errors
join starts using (form_id)
order by errors_per_start desc;
```

Expected: top friction points are obvious.

### Task 7: Build WhatsApp vs Lead Saved Dashboard

**Files:**
- No repo file changes expected.

- [ ] **Step 1: Compare direct WhatsApp and backend-backed paths**

Track:
- `form_type = ai_chatbot_lead`
- `form_type = ai_chatbot_direct_whatsapp`
- `whatsapp_opened`
- `submit_success`
- `submit_failure`

- [ ] **Step 2: Flag lead leakage intentionally**

Create a card showing direct WhatsApp opens that did not have a matching saved-lead success in the same session.

Expected: the team can see whether the direct path is increasing conversations at the cost of CRM-captured leads.

---

## Chunk 4: Operationalization

### Task 8: Add Alerts

**Files:**
- No repo file changes expected unless alerts are codified elsewhere.

- [ ] **Step 1: Add failure-rate alert**

Alert when:
- `submit_failure / submit_attempt > 10%` over the last 24 hours for any form with at least 20 attempts.

- [ ] **Step 2: Add event-quality alert**

Alert when:
- events missing `form_type` or `form_id` exceed 1% in the last 24 hours.

Expected: instrumentation breakage is caught quickly.

### Task 9: Review Cadence

**Files:**
- No repo file changes expected.

- [ ] **Step 1: Schedule weekly CRO review**

Review:
- highest-abandonment form
- top field errors
- direct WhatsApp vs saved lead trend
- mobile vs desktop gap
- paid vs organic gap

- [ ] **Step 2: Convert findings into experiments**

Each action should become either:
- copy/layout change
- validation change
- field reduction
- backend reliability task
- A/B test

Expected: dashboard insights turn into shipped improvements, not passive reporting.

---

## Validation Checklist

- [ ] GA4 receives all expected events.
- [ ] Looker Studio sanity dashboard has no missing `form_type`/`form_id` issues.
- [ ] Metabase queries refresh from a stable SQL source.
- [ ] Executive dashboard answers which forms convert.
- [ ] Diagnostic dashboard answers which fields/errors create friction.
- [ ] WhatsApp dashboard separates saved leads from direct conversations.
- [ ] Alerts catch backend failure and instrumentation breakage.
