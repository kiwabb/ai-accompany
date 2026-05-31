# PDF Navigation and Scrolling Fix Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Fix PDF outline jumping and scroll offset issues to ensure correct navigation across all platforms.

**Architecture:** 
1. Store the PDF document proxy in a state to allow resolving complex destinations (named destinations and page refs).
2. Update the outline click handler to resolve these destinations to actual page numbers using `pdf.getPageIndex` and `pdf.getDestination`.
3. Improve scrolling logic to account for sticky headers using CSS `scroll-margin-top` and updated container scroll calculations.

**Tech Stack:** React, react-pdf, pdf.js, Tailwind CSS.

---

### Task 1: Store PDF Document Proxy

**Files:**
- Modify: `frontend/src/components/PdfReader.tsx`

- [ ] **Step 1: Add `pdf` state to `PdfReader` component**
- [ ] **Step 2: Update `onDocumentLoadSuccess` to set the `pdf` state**
- [ ] **Step 3: Commit**

### Task 2: Robust Destination Resolution

**Files:**
- Modify: `frontend/src/components/PdfReader.tsx`

- [ ] **Step 1: Make `handleOutlineItemClick` async and resolve destinations**
- [ ] **Step 2: Update `goToPage` to handle smooth transitions and set current page**
- [ ] **Step 3: Commit**

### Task 3: Fix Scroll Offsets and Container Scrolling

**Files:**
- Modify: `frontend/src/components/PdfReader.tsx`

- [ ] **Step 1: Add `scroll-mt-20` or similar offset to PDF page wrappers**
- [ ] **Step 2: Fix `scrollPdfToReference` to use parent scroll container instead of window**
- [ ] **Step 3: Commit**
