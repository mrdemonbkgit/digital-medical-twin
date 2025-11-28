# Insights Dashboard Feature Specification

> Last Updated: 2025-11-28

## Summary

The Insights Dashboard is a visual analytics feature that transforms raw health data into interactive charts, enabling users to see biomarker trends, correlate interventions with outcomes, and understand their health trajectory at a glance. While the AI Historian can tell users about patterns through conversation, the Insights Dashboard shows them—because humans process visual information faster and retain it longer than text.

## Keywords

`insights` `dashboard` `visualization` `charts` `biomarkers` `trends` `recharts` `correlation` `analytics` `interventions`

## Table of Contents

- [1. Introduction and Vision](#1-introduction-and-vision)
- [2. Problem Statement](#2-problem-statement)
- [3. User Research and Personas](#3-user-research-and-personas)
- [4. Product Requirements](#4-product-requirements)
- [5. User Experience Design](#5-user-experience-design)
- [6. Technical Architecture](#6-technical-architecture)
- [7. Data Layer](#7-data-layer)
- [8. Implementation Guide](#8-implementation-guide)
- [9. Testing Strategy](#9-testing-strategy)
- [10. Risks and Mitigations](#10-risks-and-mitigations)
- [11. Future Roadmap](#11-future-roadmap)
- [12. Related Documents](#12-related-documents)

---

## 1. Introduction and Vision

The Digital Medical Twin application enables users to track five types of health events: lab results, doctor visits, medications, interventions, and metrics. Users accumulate this data over months and years, building a comprehensive record of their health journey. However, this data currently lives in a timeline—a chronological list that requires users to scroll, remember, and mentally synthesize information across entries.

The Insights Dashboard represents a fundamental shift in how users interact with their health data. Instead of asking "what happened on this date?" users can ask "how has this changed over time?" Instead of reading individual lab results and trying to remember whether 125 mg/dL for LDL is better or worse than last year, users can see a downward-trending line with their entire cholesterol history at once.

This feature embodies the "Digital Twin" vision more completely than any other. A digital twin isn't just a record—it's a living representation that mirrors the physical entity. When users see their biomarker trends visualized, when they can overlay their medication periods and watch the effect on their health metrics, they're truly seeing their digital twin in action.

The feature takes its inspiration from consumer wearable dashboards like Oura and Whoop, which have proven that ordinary users—not just data scientists—can understand and act on visualized health data. But unlike wearable dashboards that focus on daily recovery and readiness, the Insights Dashboard focuses on clinical data: the lab results, biomarkers, and interventions that matter for long-term health outcomes.

---

## 2. Problem Statement

Users of the Digital Medical Twin face several challenges when trying to understand their health data:

### The Synthesis Problem

A user managing their cholesterol might have six lab results over three years. Each result lives as a separate event in the timeline. To understand whether their interventions are working, the user must scroll through their timeline, find each lab result, open it, locate the LDL value, remember it, then repeat for each prior result. Finally, they must mentally construct a trend from these scattered data points.

This cognitive burden is significant. Research in cognitive load theory suggests that humans can hold only four to seven items in working memory at once. Expecting users to synthesize trends from raw data scattered across a timeline asks them to exceed these limits.

### The Context Problem

Even when users remember their numbers, they often lack context. Was 145 mg/dL for LDL high? It depends on the reference range, which varies by lab and clinical guidelines. Was the improvement due to the statin, the diet change, or both? The timeline can't show these relationships visually.

The AI Historian partially addresses this by answering questions about trends. A user can ask "how has my LDL changed over time?" and receive a textual summary. But text has limitations. A chart showing LDL dropping from 180 to 120 with a shaded region indicating when atorvastatin was started communicates this relationship instantly and memorably.

### The Communication Problem

When users visit their doctors, they struggle to communicate their health trajectory effectively. They might say "I think my cholesterol got better" but can't show the trend. A chart exported as a PDF or displayed on their phone bridges this gap, enabling more productive conversations with healthcare providers.

### The Motivation Problem

Health behavior change research consistently shows that visual feedback improves adherence. When users can see their HbA1c trending downward after starting a new exercise routine, they're more motivated to continue. Abstract knowledge that "exercise helps blood sugar" doesn't provide the same reinforcement as seeing your own data respond to your own efforts.

---

## 3. User Research and Personas

The Insights Dashboard serves several distinct user personas, each with different needs and technical comfort levels.

### The Optimizing Professional

Alex, a 42-year-old software engineer, approaches health like a system to optimize. He tracks multiple biomarkers, runs n=1 experiments with supplements, and wants to see correlations between his interventions and outcomes. Alex is comfortable with data and finds numbers motivating. He would use the Insights Dashboard to compare his lipid panel before and after starting a new supplement, overlay his medication periods on biomarker charts, and export visualizations to share with his functional medicine doctor.

For Alex, the dashboard should support complex queries: multiple biomarkers on one chart, detailed statistics, and the ability to zoom into specific date ranges. He represents the power user who will push the feature to its limits.

### The Newly Diagnosed

Maria, a 56-year-old recently diagnosed with Type 2 diabetes, is learning to manage her condition. She tracks her HbA1c every three months and wants simple confirmation that her lifestyle changes are working. Maria isn't particularly technical but understands basic charts from work presentations. She would use the Insights Dashboard to see her HbA1c trend over the past year, understand whether values are in the "good" range, and feel reassured (or appropriately concerned) about her trajectory.

For Maria, the dashboard should be approachable: clear labels, obvious reference ranges (the "normal zone"), and helpful empty states that guide her if she hasn't logged enough data yet. Complexity should be hidden behind progressive disclosure.

### The Chronic Condition Manager

David, a 68-year-old managing multiple chronic conditions, has been tracking his health for years. He has dozens of biomarkers across hundreds of lab results. His primary care physician, cardiologist, and endocrinologist each focus on different metrics. David would use the Insights Dashboard to prepare for appointments by printing charts of relevant biomarkers, spot concerning trends before they become emergencies, and maintain a sense of control over his complex health situation.

For David, the dashboard should handle large datasets gracefully, organize biomarkers by category (lipids, thyroid, metabolic), and support filtering to specific date ranges. Export functionality is critical for his use case.

---

## 4. Product Requirements

### 4.1 Functional Requirements

The Insights Dashboard must enable users to accomplish the following tasks, organized by priority level.

#### Must Have (P0)

The dashboard must display biomarker trends over time. When a user selects a biomarker like "LDL Cholesterol" and a date range like "Past 2 years," the system should retrieve all lab results containing that biomarker and render a line chart showing values chronologically. Each data point should be interactive, revealing the exact value, date, and source lab when hovered or tapped.

The dashboard must show reference ranges visually. When available, the normal range for a biomarker should appear as a shaded region on the chart. Users should immediately see whether their values fall within the normal zone without consulting external resources.

The dashboard must provide summary statistics. For any selected biomarker and date range, users should see: the most recent value, the average value across the period, the minimum and maximum values, and an indicator of whether the trend is rising, falling, or stable.

The dashboard must work responsively across devices. While the desktop experience can offer more features, the mobile experience must remain fully functional. Charts should resize appropriately, controls should be touch-friendly, and users should be able to complete all core tasks on their phones.

#### Should Have (P1)

The dashboard should overlay intervention periods on charts. When toggled on, medications and interventions active during the charted period should appear as shaded vertical regions, labeled with the intervention name. This enables users to visually correlate when they started a medication with how their biomarkers responded.

The dashboard should support metric visualization. Beyond lab biomarkers, users who track metrics (HRV, weight, sleep scores from wearables) should be able to visualize these trends using the same interface.

The dashboard should provide a biomarker selector populated from the user's actual data. Rather than presenting a generic list of every possible biomarker, the selector should show only biomarkers the user has recorded, organized by category, with a search function for users with many biomarkers.

The dashboard should remember user preferences. If a user frequently views their lipid panel, the dashboard should restore this selection when they return, using URL state or local storage.

#### Could Have (P2)

The dashboard could support comparing two biomarkers on a single chart. Users managing metabolic health might want to see their fasting glucose and HbA1c together, using dual Y-axes to accommodate different scales.

The dashboard could export charts as images or PDFs. Users preparing for doctor visits could save charts directly to their device for printing or sharing.

The dashboard could provide AI-generated insights. After displaying a chart, the system could offer a one-sentence summary: "Your LDL decreased 25% after starting atorvastatin, reaching its lowest value in 18 months."

### 4.2 Non-Functional Requirements

Performance is critical. The dashboard must render initial charts within two seconds of data being available. For users with large datasets (500+ data points for a single biomarker), the system should automatically aggregate data or implement pagination to maintain responsiveness.

Accessibility must meet WCAG 2.1 AA standards. Charts must have text alternatives, keyboard navigation must work for all interactive elements, and color choices must support colorblind users. The standard red/green color scheme for high/low values must be supplemented with other visual indicators like icons or patterns.

The bundle size impact should remain reasonable. The charting library and associated code should add no more than 200KB to the gzipped bundle size, with tree-shaking enabled to minimize unused code.

---

## 5. User Experience Design

### 5.1 Information Architecture

The Insights Dashboard lives at the route `/insights` and is accessible from the main navigation. It exists alongside the Timeline, AI Historian, and Settings as a top-level feature. The page follows a clear hierarchy: controls at the top for configuration, the chart as the primary visual element, and supporting information (statistics, active interventions) below.

The page title "Insights" was chosen over alternatives like "Charts," "Analytics," or "Visualizations" because it communicates value rather than mechanism. Users don't want charts for their own sake—they want insights into their health. The terminology aligns with consumer health apps that use similar language.

### 5.2 Page Layout

The desktop layout divides into three sections. The control bar spans the full width at the top, containing the biomarker selector, date range picker, aggregation toggle, and intervention overlay checkbox. Below this, the chart occupies the primary viewport space, with generous padding and clear axis labels. Beneath the chart, a statistics panel displays the key numbers in a grid format, and an interventions list shows any medications or interventions active during the displayed period.

On mobile, the layout stacks vertically. Selectors become full-width dropdowns appropriate for touch interaction. The chart fills the available width with increased padding for touch targets. Statistics display in a compact two-by-two grid, and the interventions list remains collapsible to save space.

The visual design uses the application's existing Tailwind-based design system. Charts use the blue primary color for data lines, green for reference range shading, and a secondary color palette for intervention overlays. The design avoids chart junk: no unnecessary gridlines, no 3D effects, no decorative elements that don't convey information.

### 5.3 Control Components

The biomarker selector presents users with their available biomarkers organized by category. Categories like "Lipid Panel," "Metabolic," "Thyroid," and "Vitamins & Minerals" help users locate biomarkers quickly. Within each category, biomarkers appear alphabetically. A search input allows users with many biomarkers to filter the list by typing.

The selector only shows biomarkers the user has actually recorded. This prevents the empty state confusion that would arise if users could select "TSH" but had never logged a thyroid panel. The system examines the user's lab result events, extracts unique biomarker names, normalizes them using an alias mapping (so "LDL" and "LDL Cholesterol" appear as one option), and presents the deduplicated list.

The date range selector offers preset options: Last 30 days, Last 90 days, Last year, and All time. These presets cover the most common use cases without requiring date picker interactions. A "Custom" option reveals start and end date pickers for users who need specific ranges, such as "show me data from my last pregnancy" or "show me the year before I started this medication."

The aggregation toggle addresses the challenge of dense data. Users tracking daily weight or HRV from wearables might have hundreds of data points in a year. Raw display of every point creates visual noise. The toggle offers three options: Raw (every point), Weekly averages, and Monthly averages. The default is Raw for datasets under 50 points and Weekly for larger datasets, though users can override this.

The intervention overlay toggle, labeled "Show medications," controls whether medication and intervention periods appear on the chart. When enabled, each active medication or intervention during the displayed period appears as a semi-transparent vertical band spanning from its start date to its end date (or to the present if ongoing). The band is labeled with the intervention name.

### 5.4 Chart Design

The trend chart uses a standard time-series format. The X-axis represents time, with tick marks and labels formatted appropriately for the date range. For ranges under 30 days, labels show day and month (e.g., "Nov 15"). For ranges between 30 days and a year, labels show month and year (e.g., "Nov 2024"). For multi-year ranges, labels show just the year with quarterly divisions.

The Y-axis represents the biomarker value, with the unit displayed in the axis label (e.g., "mg/dL"). The axis domain is calculated dynamically based on the data and reference range, with padding to ensure data points don't touch the edges. If the reference range is known, it influences the domain so that the normal zone is always visible.

Data points appear as dots connected by smooth curved lines. The line type uses monotone interpolation, which creates natural curves without the angular appearance of straight segments or the overshooting of simple spline interpolation. Each dot can be hovered (desktop) or tapped (mobile) to reveal a tooltip.

The tooltip displays the biomarker name, exact value with unit, date formatted in a readable way (e.g., "March 15, 2024"), the flag status if abnormal ("High" or "Low"), and the source lab name if recorded. A link or button within the tooltip allows navigating to the source lab result event for full details.

Reference range shading appears as a semi-transparent green band spanning the normal zone. If only a minimum is known (e.g., HDL should be above 40), the shading extends from that minimum to the top of the chart. If only a maximum is known (e.g., LDL should be below 100), the shading extends from the bottom to that maximum. If both are known, the band spans between them. Points within the range appear in the standard blue color; points outside appear in warning colors (orange for moderately out of range, red for significantly out of range).

Intervention overlays appear as vertical bands with reduced opacity so they don't obscure the data. Each band uses a color from a secondary palette (purple, teal, pink) to distinguish multiple interventions. The intervention name appears as a label at the top of the band, rotated 90 degrees if necessary to fit. Clicking or tapping the band navigates to the intervention detail page.

### 5.5 Statistics Panel

Below the chart, a statistics panel summarizes the key numbers. The panel displays in a horizontal row on desktop and a two-by-two grid on mobile. Each statistic appears in a card format with the number prominently displayed and a label below.

The "Current" statistic shows the most recent value. If this value is outside the reference range, the card's border or background changes color to indicate this status.

The "Average" statistic shows the mean of all values in the displayed range. This helps users understand their typical value, smoothing out the noise of individual measurements.

The "Min" and "Max" statistics show the lowest and highest values in the range. Users can quickly see their best and worst readings without scanning the chart.

The "Trend" statistic shows whether values are generally increasing, decreasing, or stable, displayed as an arrow icon (upward, downward, or horizontal). The percentage change from the first to the last value accompanies this icon. The trend card also indicates whether the direction is "Improving" or "Worsening" based on whether lower or higher values are better for this biomarker. For LDL cholesterol, a downward trend is improving; for HDL cholesterol, an upward trend is improving. This contextual interpretation uses configured metadata about each biomarker.

### 5.6 Empty States

The dashboard handles several empty state scenarios gracefully.

If the user has no lab results at all, the page displays a friendly illustration and message: "No biomarker data yet. Add your first lab result to start tracking trends." A button links to the event creation page with the lab result type pre-selected.

If the user has lab results but hasn't selected a biomarker, the page shows a prompt: "Select a biomarker above to see your trends." The selector is emphasized visually to draw attention.

If the user selects a biomarker but no data exists in the selected date range, the page shows: "No data for LDL Cholesterol in the last 30 days. Try expanding the date range or selecting a different biomarker." Buttons for "View All Time" and "Change Biomarker" provide quick actions.

If the user has only one data point for the selected biomarker and range, the chart displays that single point, but the statistics panel notes: "Trend analysis requires 2+ data points." The system doesn't fake a trend from insufficient data.

### 5.7 Interaction Patterns

Users primarily interact with the dashboard by adjusting controls and observing the chart update. The interface provides immediate feedback: when a selector changes, the chart enters a loading state (perhaps a subtle shimmer effect or skeleton), then updates with the new data within moments.

Keyboard navigation supports accessibility requirements. Tab moves focus through controls and interactive elements. Enter or Space activates the focused element. Arrow keys navigate within selectors. All controls have visible focus states meeting contrast requirements.

Touch interactions on mobile are optimized for fingers rather than pointers. Selectors use native mobile UI patterns where possible. The chart supports tap-to-select for data points, with the tooltip appearing as a modal-like overlay that can be dismissed by tapping elsewhere. Pinch-to-zoom on the chart is a possible enhancement but not required for MVP.

---

## 6. Technical Architecture

### 6.1 Technology Choices

The charting library is Recharts. This choice was made after evaluating several alternatives against the project's requirements.

Recharts is built specifically for React applications, using a declarative component-based API that feels natural in the existing codebase. Charts are composed from components like `<LineChart>`, `<XAxis>`, `<Line>`, and `<Tooltip>`, mirroring how the rest of the application builds UI from component trees.

The library has strong TypeScript support, which matters for a codebase that uses TypeScript throughout. Type definitions are included and well-maintained, reducing friction during development.

Recharts produces responsive charts by default through its `<ResponsiveContainer>` component, which measures its parent container and resizes the chart automatically. This eliminates the manual resize handling required by some other libraries.

The bundle size is acceptable at approximately 150KB minified, with effective tree-shaking reducing this for production builds that don't use every feature. This is smaller than Chart.js with its React wrapper and comparable to Tremor while offering more customization.

Alternatives considered included Chart.js (larger bundle, less React-native API), D3.js (powerful but requires more custom code), and Tremor (higher-level but less flexible for custom requirements). Recharts strikes the best balance for this project.

### 6.2 Component Architecture

The feature is organized as a self-contained module within the existing application structure. The main page component, `InsightsPage.tsx`, manages top-level state and composes the feature's subcomponents.

The controls subdirectory contains `BiomarkerSelector.tsx`, `DateRangeSelector.tsx`, `AggregationToggle.tsx`, and `InterventionToggle.tsx`. Each control is a focused component managing its own UI and calling back to the parent when selections change.

The charts subdirectory contains `TrendChart.tsx` as the main chart component, along with supporting pieces: `ChartContainer.tsx` provides the responsive wrapper and consistent styling, `DataPointTooltip.tsx` renders custom tooltip content, `ReferenceRangeArea.tsx` handles the normal zone shading, and `InterventionOverlay.tsx` renders medication period bands.

The stats subdirectory contains `StatsPanel.tsx`, which composes multiple `StatCard.tsx` components, along with `TrendIndicator.tsx` for the directional arrow with improvement context.

A shared configuration file, `chartConfig.ts` or similar, centralizes visual constants: the color palette, stroke widths, margin definitions, and other design tokens that ensure visual consistency.

### 6.3 State Management

The dashboard's state can be categorized into several types with different management strategies.

User selections (selected biomarker, date range, aggregation level, show interventions toggle) are managed through URL query parameters using React Router's capabilities. This approach makes selections bookmarkable and shareable: a URL like `/insights?biomarker=ldl&range=lastYear&showMeds=true` directly encodes the dashboard state. A custom hook, `useInsightsState`, wraps the URL state management and provides a clean API for reading and updating selections.

Server data (lab result events, medications, interventions) flows through the existing data fetching infrastructure. The application likely has hooks like `useEvents` that query Supabase and cache results. The dashboard leverages this existing system rather than creating parallel data fetching logic.

Derived data (the processed time series, calculated statistics) is computed client-side using `useMemo` to avoid recalculation on every render. A data processing layer in `lib/insights/dataProcessing.ts` provides pure functions for extracting biomarker series from events, calculating statistics, and aggregating data points.

Loading and error states are managed per-query, displayed through skeleton loaders and error messages respectively. The UI remains interactive while data loads, with appropriate disabled states on controls that would trigger meaningless queries.

### 6.4 Data Processing Pipeline

When the user selects a biomarker and date range, a series of transformations converts raw events into chart-ready data.

First, lab result events within the date range are retrieved from the database via the existing data layer. This query can use existing filtering capabilities.

Second, the events are filtered to those containing the selected biomarker. This involves iterating through each lab result's biomarkers array and checking for matches. The matching uses normalized names, so "LDL" matches "LDL Cholesterol" matches "LDL-C." The normalization logic lives in a dedicated module that maintains an alias mapping for common biomarkers.

Third, matching biomarker values are extracted into a time series: an array of objects containing the date, value, unit, flag status, and a reference back to the source event ID. This series is sorted chronologically.

Fourth, if aggregation is enabled and the series has many points, the data is aggregated. Weekly aggregation groups points by ISO week and computes the mean, min, and max for each week. Monthly aggregation does the same by calendar month. The aggregated series replaces the raw series.

Fifth, statistics are calculated from the series. Current is the last value. Average, min, and max are computed over all values. Trend is determined by comparing the first and last values, with percentage change calculated. The "improving" flag is set based on biomarker metadata: if `preferLower` is true for this biomarker, a downward trend is improving.

Finally, the reference range is retrieved from biomarker configuration. This might come from the user's actual data (some labs include reference ranges in results) or from standardized clinical guidelines configured in the application.

The result is a `ChartData` object containing everything needed to render the chart and statistics: the biomarker name, unit, data points array, reference range, and stats object.

### 6.5 Biomarker Configuration System

The application maintains configuration for common biomarkers. This configuration serves multiple purposes: alias mapping for name normalization, default reference ranges from clinical guidelines, categorization for the selector UI, and directionality for trend interpretation.

The configuration is stored as a TypeScript module that exports an array of biomarker config objects. Each object includes the canonical name, an array of aliases, the category (lipids, metabolic, thyroid, etc.), the typical unit, whether lower values are preferred, and optionally a default reference range with its source.

For example, the LDL Cholesterol configuration specifies that "LDL," "LDL-C," and "low-density lipoprotein" are aliases; the category is lipids; the unit is mg/dL; lower is preferred (so downward trends are improving); and the AHA guideline suggests below 100 mg/dL is optimal.

When a user's actual lab result includes reference ranges from their specific lab, those values override the defaults. The system prioritizes lab-specific ranges when available.

A lookup function accepts any biomarker name and returns the matching configuration, falling back to a generic configuration for unknown biomarkers. This graceful degradation means users can track any biomarker even if it's not in the predefined list—they just won't get alias matching, categorization, or default reference ranges.

---

## 7. Data Layer

### 7.1 Data Sources

The Insights Dashboard reads from the existing event data model without requiring database schema changes. The relevant event types are:

Lab Results contain the biomarker data that forms the core of the dashboard. Each lab result event has a biomarkers array, where each biomarker has a name, value, unit, and optional reference range and flag. The event also has a date (when the lab was drawn), an optional lab name, and links to any uploaded PDF documents.

Medications and Interventions provide the overlay periods. Each has a start date, an optional end date (null if ongoing), and descriptive information. The dashboard queries these events to render intervention bands on the chart.

Metrics provide an alternative data source for users tracking wearable data. Each metric event has a metric name, value, unit, and source (Oura, Whoop, etc.). While the initial dashboard focuses on biomarkers from lab results, metrics follow a similar pattern and can be supported with minimal additional work.

### 7.2 Query Patterns

The dashboard makes several queries that can leverage existing data fetching infrastructure.

For the biomarker selector, the dashboard needs to know which biomarkers the user has recorded. This could be computed on the client by fetching all lab results and extracting unique biomarker names, or it could use a dedicated lightweight query that returns just the distinct biomarker names without full event payloads. The former is simpler; the latter is more performant for users with many lab results.

For the trend chart, the dashboard fetches lab results within the selected date range. If existing hooks support date range filtering, this is straightforward. The events are then processed client-side to extract the relevant biomarker series.

For intervention overlays, the dashboard fetches medications and interventions that overlap with the displayed date range. An intervention overlaps if it started before the range ends and either has no end date or ended after the range starts. This query returns more data than strictly needed (the full event objects) but reuses existing patterns; optimization can come later if needed.

### 7.3 Caching Considerations

Health data rarely changes retroactively. A lab result from six months ago won't suddenly have different values. This makes caching highly effective. Once fetched, lab results can be cached aggressively with long TTLs.

The existing data layer likely already implements caching through React Query, SWR, or a similar library. The dashboard hooks can leverage this existing caching rather than implementing custom cache management.

For real-time updates, the primary concern is that newly added events appear promptly. When a user adds a new lab result and navigates to the dashboard, they should see it reflected. This typically happens automatically through cache invalidation triggered by mutation operations.

---

## 8. Implementation Guide

### 8.1 Phase 1: MVP (Estimated 3-4 Days)

The first phase delivers core functionality: viewing single biomarker trends with reference ranges and statistics.

Begin by installing Recharts and verifying the development environment. Create a minimal chart component that renders test data to confirm the library works correctly in the project context.

Next, create the InsightsPage component with basic structure: a header, placeholder controls, and the chart area. Add the route to the application's router and a navigation link so the page is accessible.

Implement the BiomarkerSelector by querying lab results, extracting unique biomarker names, applying normalization, and presenting them in a searchable dropdown. Initially, the selector can be a simple list without category grouping.

Implement the DateRangeSelector with preset options only. Use URL state to persist selections across navigation.

Create the useBiomarkerData hook that fetches lab results, filters to the selected biomarker, extracts the time series, and calculates statistics. This hook returns the ChartData structure needed by the chart component.

Implement the TrendChart component using Recharts. Include the line chart with responsive container, proper axis formatting, reference range shading, and custom tooltip. Ensure the chart renders correctly at various viewport sizes.

Implement the StatsPanel displaying current value, average, min, max, and trend. Add appropriate styling and the trend direction indicator.

Create appropriate empty states for each scenario: no data at all, no biomarker selected, no data in range.

Test the complete flow manually: navigating to the page, selecting different biomarkers, changing date ranges, viewing statistics, and interacting with data points on both desktop and mobile.

### 8.2 Phase 2: Interventions (Estimated 2 Days)

The second phase adds medication and intervention overlays for correlation visualization.

Implement the InterventionToggle checkbox control. When enabled, the dashboard should fetch medications and interventions overlapping the displayed date range.

Create the useActiveInterventions hook that fetches medication and intervention events, filters to those overlapping the date range, and transforms them into InterventionPeriod objects suitable for rendering.

Implement the InterventionOverlay component that renders ReferenceArea components within the chart for each intervention period. Handle overlapping interventions gracefully, perhaps by stacking or using distinct colors.

Add the ActiveInterventionsList below the chart, showing a card for each displayed intervention with its name, date range, and a link to view details.

Test the intervention feature: verifying that periods render correctly, labels are readable, and clicking navigates to the source event.

### 8.3 Phase 3: Polish (Estimated 2-3 Days)

The third phase focuses on refinement, edge cases, and production readiness.

Add the custom date range picker for users who need specific date ranges beyond the presets.

Implement the AggregationToggle and the corresponding data aggregation logic in the data processing layer. Verify that weekly and monthly aggregation produces correct results.

Improve mobile experience: test on actual devices (or realistic emulators), adjust touch targets, ensure tooltips work well with touch interactions, and verify the layout at various screen sizes.

Add loading states with skeleton loaders while data fetches. Add error states with retry options when queries fail.

Conduct an accessibility audit: verify keyboard navigation works, add ARIA labels where needed, check color contrast, and ensure screen readers can access chart data.

Write unit tests for data processing functions: biomarker extraction, statistics calculation, aggregation, and alias matching. These pure functions are highly testable.

Write integration tests for hooks: mock the data layer and verify hooks return correct structures.

Update documentation and create migration notes if any database changes were needed (though none are expected for MVP).

### 8.4 Phase 4: Advanced Features (Future)

Beyond the initial release, several enhancements are planned.

Multi-biomarker comparison allows users to overlay two biomarkers on the same chart with dual Y-axes. This requires UI for selecting a second biomarker, logic for determining appropriate axis scales, and a legend distinguishing the series.

Correlation scatter plots show one biomarker versus another as a scatter plot, with calculated correlation coefficient. This helps users understand relationships between metrics like fasting glucose and HbA1c.

Export functionality lets users download the current chart as a PNG image or PDF document for sharing with healthcare providers. This uses HTML-to-canvas techniques or Recharts' built-in export capabilities.

Metric trends extend the dashboard to visualize metric-type events alongside biomarkers, supporting users who track wearable data like HRV and sleep scores.

AI-generated insights add a text summary below the chart: "Your LDL improved 25% since starting atorvastatin" generated by sending the chart data to the AI Historian for interpretation.

---

## 9. Testing Strategy

### 9.1 Unit Testing

The data processing layer contains pure functions that transform inputs to outputs without side effects. These are ideal candidates for unit testing.

Tests for `extractBiomarkerTimeSeries` verify that the function correctly identifies matching biomarkers using exact and alias matches, handles case insensitivity, returns an empty array when no matches exist, and sorts results chronologically.

Tests for `calculateStats` verify that statistics are calculated correctly for various data shapes: typical multi-point data, single data point, two data points, and data with extreme values. Tests also verify that trend direction and improvement interpretation work correctly for biomarkers where lower is better versus those where higher is better.

Tests for aggregation functions verify that weekly and monthly groupings are computed correctly, that averages are accurate, and that min/max within each period are captured.

Tests for alias matching verify that the normalization function correctly maps various input strings to canonical biomarker names, handles edge cases like extra whitespace or unusual capitalization, and returns the input unchanged for unknown biomarkers.

### 9.2 Integration Testing

Hook tests verify that the data flow from raw events to chart-ready structures works correctly.

Tests for `useBiomarkerData` mock the underlying event-fetching hook to return controlled data, then verify that the returned ChartData structure has the expected properties. Tests cover scenarios like multiple matching lab results, no matching lab results, and lab results with missing reference ranges.

Tests for `useActiveInterventions` verify that medications and interventions are correctly filtered to those overlapping the date range and transformed into the expected structure.

### 9.3 Component Testing

React Testing Library tests verify that components render correctly and respond to user interactions.

Tests for the BiomarkerSelector verify that available biomarkers are displayed, that selecting a biomarker triggers the expected callback, and that search filtering works.

Tests for the TrendChart verify that the chart renders with provided data, that data points are present, and that the tooltip appears on interaction. These tests may use snapshot testing to catch unintended visual regressions.

### 9.4 End-to-End Testing

Playwright or Cypress tests verify complete user flows in a browser environment.

A test for viewing biomarker trends logs in as a test user (with seeded lab results), navigates to the insights page, selects a biomarker, verifies the chart appears, and checks that statistics are displayed.

A test for medication overlays seeds both lab results and medications, enables the overlay toggle, and verifies that the medication period appears on the chart.

A test for mobile responsiveness runs the flow at mobile viewport dimensions, verifying that controls are usable and the chart adapts appropriately.

---

## 10. Risks and Mitigations

### Biomarker Name Mismatches

The risk is that users enter biomarker names inconsistently ("LDL" versus "LDL Cholesterol" versus "LDL-C"), causing data to appear fragmented across multiple entries in the selector.

The mitigation is the alias mapping system, which normalizes names to canonical forms. The initial implementation includes aliases for the 20-30 most common biomarkers. Users can report missing aliases through feedback channels, and the mapping can be extended over time.

If mismatches still occur, the user can view their raw lab results and manually ensure consistent naming when entering data. Future enhancements might include a biomarker name suggestion system during data entry.

### Performance with Large Datasets

The risk is that users with extensive health histories (years of daily metrics from wearables, hundreds of lab results) experience slow rendering or unresponsive interactions.

The mitigation is automatic aggregation for large datasets. When a time series exceeds 100 data points, the dashboard defaults to weekly aggregation. Users can override this for raw view, but a warning indicates potential performance impact.

Additional mitigations include limiting query results (e.g., fetching only the most recent 500 data points with an option to load more), implementing lazy loading as users scroll through long time ranges, and optimizing the charting library's rendering configuration.

### Reference Range Inaccuracies

The risk is that default reference ranges may not match individual labs' ranges or may not account for age, sex, or other factors that affect normal values.

The mitigation is to prefer lab-specific reference ranges from the user's actual data when available. Default ranges are sourced from established clinical guidelines (AHA, ADA, AACE) and clearly documented. The UI can indicate when a default range is being used versus a lab-specific range.

Additionally, reference ranges are informational aids, not diagnostic tools. The application's disclaimer makes clear that users should consult healthcare providers for interpretation.

### Mobile Usability Challenges

The risk is that charts designed for desktop screens are difficult to use on mobile devices, with cramped controls and imprecise touch targets.

The mitigation is mobile-first testing during development. Each component is verified at mobile viewport sizes before desktop optimization. Touch targets meet minimum size guidelines (44x44 pixels). Tooltips appear as modal overlays rather than small hover popups. Controls use native mobile UI patterns where possible.

### Recharts Limitations

The risk is that Recharts doesn't support a future requirement, forcing a library migration or custom implementation.

The mitigation is that Recharts covers the planned features (line charts, reference areas, tooltips, responsive containers). The component architecture isolates Recharts-specific code, so a library change would require updating chart components but not hooks or data processing. For highly custom visualizations, Recharts supports custom components and D3 integration.

---

## 11. Future Roadmap

### Near-Term Enhancements

Goal setting would let users define target values (e.g., "LDL below 100") and see their progress toward goals on the chart. The target appears as a horizontal line, and the UI celebrates when targets are met.

Annotations would let users add notes to specific dates (e.g., "started new diet" or "had flu this week"). These annotations appear on the chart, helping users remember context when interpreting trends.

Sharing would generate time-limited, read-only links to specific chart views. Users could share their cholesterol trend with their doctor via email before an appointment.

### Medium-Term Enhancements

Correlation analysis would calculate statistical correlations between biomarkers or between biomarkers and interventions. The UI might show "LDL is correlated with statin use (r = -0.72)" with appropriate caveats about causation.

Predictive insights would use machine learning to project future values based on historical trends. The chart might show a dashed line extending into the future, with confidence intervals, helping users understand where their trajectory leads.

### Long-Term Vision

The Insights Dashboard could evolve into a comprehensive health analytics platform. Integration with wearable devices would provide continuous data streams. Integration with AI would provide natural language insights alongside visualizations. Integration with healthcare providers could enable shared dashboards where both patient and provider see the same data.

The ultimate vision is that users understand their health as well as they understand their finances through online banking—with clear trends, meaningful metrics, and actionable insights.

---

## 12. Related Documents

- `/docs/features/AI_HISTORIAN.md` — AI chat feature that complements visual insights with conversational analysis
- `/docs/features/DATA_TRACKING.md` — Event types and data models that the dashboard visualizes
- `/docs/architecture/DATABASE_SCHEMA.md` — Database structure for event storage
- `/docs/DECISION_LOG.md` — Architectural decisions relevant to frontend features
- `/docs/ROADMAP.md` — Overall product roadmap and phase planning

---

*This specification was generated based on analysis of the Digital Medical Twin codebase, best practices in health data visualization, and research into consumer health application design patterns. It represents a complete vision for the Insights Dashboard feature, from user needs through technical implementation.*
