# FlyDB Enhancement Roadmap

Use this checklist to track weekly/phase progress. Mark tasks as `[x]` once completed.

## Phase 1 – Enhanced Search & Filtering (Weeks 1-2)
- [x] Week 1: Global search upgrades
  - [x] Implement debounced global search across columns
  - [x] Add search-result highlighting in table rows
  - [x] Provide recent search history dropdown
- [x] Week 1-2: Smart filters
  - [x] Add date range picker + quick presets (Today, Last 7 Days, This Month)
  - [x] Support numeric range (`min/max`) filtering
  - [x] Introduce `IN/NOT IN` multi-value filters and NULL toggles
- [ ] Week 2: Saved filter presets
  - [ ] Save named filter combinations per table
  - [ ] Manage (rename/delete) presets
  - [ ] Quick-apply dropdown for presets

## Phase 2 – Table Relationships (Weeks 3-4)
- [x] Week 3: Relationship detection
  - [x] Parse foreign keys + naming heuristics for implicit relationships
  - [x] Store relationship metadata for reuse
- [ ] Week 3-4: Visualization
  - [ ] Display relationship badges/counts on table list
  - [ ] Show relationship panel inside table viewer with quick navigation
  - [ ] (Optional) Render relationship graph/diagram
- [ ] Week 4: Related data preview
  - [ ] Expandable related-record previews
  - [ ] One-click navigation with pre-applied filters

## Phase 3 – Column Management (Weeks 5-6)
- [x] Week 5: Column visibility
  - [x] Column selector UI (show/hide + reset)
  - [ ] Persist preferences per table
- [ ] Week 5-6: Reordering
  - [ ] Drag-and-drop column headers
  - [ ] Persist custom order
- [ ] Week 6: Resizing
  - [ ] Resizable headers with double-click auto-fit
  - [ ] Save column widths per table

## Phase 4 – Export Enhancements (Weeks 7-8)
- [x] Week 7: Multiple export formats
  - [x] JSON export
  - [ ] XML export
  - [ ] SQL INSERT export
- [ ] Week 7-8: Export UX
  - [ ] Progress indicator + chunked processing for large exports
  - [ ] Export current view vs entire dataset toggle
  - [ ] Column include/exclude selection
- [ ] Week 8: Export presets
  - [ ] Save/export presets with format + column + row scope

## Phase 5 – Performance Optimization (Weeks 9-10)
- [ ] Week 9: Virtual scrolling
  - [ ] Implement windowed row rendering (e.g., `react-window`)
  - [ ] Ensure keyboard accessibility remains intact
- [ ] Week 9-10: Query performance
  - [ ] Server-side caching for repeated queries
  - [ ] Highlight slow queries & index recommendations
- [ ] Week 10: Lazy loading
  - [ ] On-demand metadata fetching
  - [ ] Background prefetch for likely next tables

## Phase 6 – Analytics Dashboard (Weeks 11-12)
- [ ] Week 11: Overview dashboard
  - [ ] Database size trends chart
  - [ ] Largest/most accessed tables summary
- [ ] Week 11-12: Table analytics
  - [ ] Row-count history + storage breakdown per table
  - [ ] Column statistics (unique %, null %, top values)
- [ ] Week 12: Activity monitoring
  - [ ] Recent queries/logs
  - [ ] Export history + popular searches

## Phase 7 – User Preferences (Weeks 13-14)
- [ ] Week 13: Table bookmarks
  - [ ] Favorite/star tables with custom labels
- [ ] Week 13-14: Layout preferences
  - [ ] Density modes (compact/comfortable)
  - [ ] Theme controls (light/dark/custom accent)
  - [ ] Font size adjustments
- [ ] Week 14: Saved views
  - [ ] Persist full table state (filters, columns, sort)
  - [ ] Shareable view URLs

## Phase 8 – Polish & Documentation (Weeks 15-16)
- [ ] Week 15: Testing & QA
  - [ ] Unit + integration test coverage
  - [ ] Cross-browser & responsive review
- [ ] Week 15-16: Documentation
  - [ ] User guide + feature tutorials
  - [ ] Developer API & extension docs
- [ ] Week 16: Accessibility & i18n
  - [ ] WCAG 2.1 AA audit
  - [ ] Keyboard navigation polish
  - [ ] Translation/RTL readiness
