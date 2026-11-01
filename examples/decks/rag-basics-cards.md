---
title: RAG Basics (example)
kind: flashcards
cert: Example decks
tags: [example, rag]
new_per_day: 10
---

### What does RAG stand for?

**Retrieval-augmented generation.** At query time, relevant documents are retrieved and added to the model's prompt as context.

### What are the two core components of a RAG pipeline?

- A **retriever**, which finds relevant chunks in a vector or knowledge store
- A **generator** (the LLM), which answers using those chunks as context

### What's the main benefit of RAG over relying on the model's training data alone?

Answers are grounded in up-to-date, domain-specific data **without retraining** the model.

### IVF vs. HNSW: how does each find nearest neighbors?

| Index | Structure | Search |
|---|---|---|
| IVF | Clusters / buckets | Scans only some buckets |
| HNSW | Hierarchical graph | Traverses the graph |

Both trade exact recall for speed.

### What does this policy allow?

```json
{
  "Effect": "Allow",
  "Action": "s3:GetObject",
  "Resource": "arn:aws:s3:::example-bucket/*"
}
```

?

Reading (downloading) any object in `example-bucket`. Not listing the bucket: that's `s3:ListBucket` on the bucket itself.
