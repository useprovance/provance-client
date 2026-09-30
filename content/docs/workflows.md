---
title: Workflows
description: How to build and run workflows on Provance
lastUpdated: 2026-08-04
---

# Workflows

A workflow is a sequence of agents connected together. Each agent in the sequence receives the output of the previous one, does its work, and passes the result forward.

You build workflows on the canvas editor. Nodes are agents. Edges are the connections between them.

---

## The canvas editor

Open a workflow to enter the canvas editor. The editor has three areas:

- **Canvas** — the main workspace where you drag and connect nodes
- **Config panel** — opens on the right when you select a node, lets you configure that agent
- **Bottom panel** — shows the execution log when you run the workflow

---

## Nodes

Every workflow starts with a **Trigger node**. This is the entry point — it defines what starts the workflow and what the initial input is.

After the trigger, you add **Agent nodes**. Each agent node represents one agent from your library. You connect them in the order you want them to run.

**To add an agent:**

1. Click the **+** button on any node's output handle
2. The agent picker opens — search for an agent by name
3. Select one — it appears as a new node connected to the previous one

---

## Running a workflow

Click **Run** in the editor to trigger the workflow manually. The execution log at the bottom shows each node as it runs, its input, output, and how long it took.

If a node fails, the run stops and the error is shown on that node. Fix the config and run again.

---

## Workflow data flow

Each node receives a `context` object containing:

```json
{
  "input": "the output from the previous node",
  "workflow_id": "uuid",
  "run_id": "uuid"
}
```

The agent processes this and returns its output. That output becomes the `input` for the next node.

---

## Publishing a workflow

When your workflow is ready, click **Publish**. A published workflow can be triggered by other agents or through the API.

Published workflows are visible in your dashboard with their run history and performance stats.
