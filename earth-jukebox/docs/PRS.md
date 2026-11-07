# NASA World — Product Requirements Specification (Draft)

**Status:** Working draft for owner review  
**Version:** 0.1  
**Source:** User-provided hand-drawn layout and TerraNova logo reference. Labels and structure below reflect those references; behavior and product details marked **Assumption** are proposals for the user to correct.

## 1. Product summary

A web experience for exploring Earth-related information in a large central “World” view. A left panel provides TerraNova and NASA logo marks, the TerraNova name and tagline, topic navigation, and a feed of top news.

## 2. Goals

- Make the global view the primary focus of the page.
- Let people switch between Weather, Ocean, Forest, Air, and Top News.
- Surface recent relevant updates alongside the visualization.
- Keep the first screen understandable without requiring setup.

## 3. Users and use cases

**Assumption:** Curious members of the public, students, and educators want to inspect global environmental conditions and find related updates.

- Explore a global view and orient to a region.
- Select a topic and see the relevant information on the view.
- Scan headlines and open a relevant update.

## 4. Scope

### In scope for an initial release

- Responsive dashboard with a left navigation panel and a primary World view.
- Topic controls for Weather, Ocean, Forest, Air, and Top News.
- Search field for a place or topic (**Assumption;** the sketch shows an unlabeled input).
- A short latest-updates list in the left panel.
- Basic map controls or equivalent view controls (**Assumption**).

### Out of scope until confirmed

- Accounts, saved locations, alerts, personalization, collaboration, and downloads.
- Specific NASA datasets, third-party feeds, or update cadence.
- Advanced GIS tools, time-series playback, and mobile-native applications.

## 5. Functional requirements

| ID | Requirement | Priority |
|---|---|---|
| FR-1 | The landing view shows the TerraNova logo and NASA logo in the top brand row. | Must |
| FR-1a | Below the brand row, show “TERRA NOVA” and “A new way to hear earth” in place of the search field. | Must |
| FR-2 | The page presents a large World visualization area to the right of the navigation panel. | Must |
| FR-3 | Users can select Weather, Ocean, Forest, Air, or Top News. | Must |
| FR-4 | The selected topic is visually indicated. | Must |
| FR-5 | The latest-updates area shows a headline and brief summary for each item. | Should; assumed from sketch lines |
| FR-6 | Selecting a topic updates the primary view with relevant content. | Should; data behavior TBD |
| FR-7 | The search field accepts a location or topic and provides a useful result or empty state. | Could; assumption |
| FR-8 | Users can zoom or change visible layers if supported by the chosen map/data source. | Could; assumption |

## 6. Non-functional requirements

- Layout adapts to desktop, tablet, and narrow mobile widths; on narrow screens the navigation becomes a collapsible panel or moves above the visualization (**Assumption**).
- Controls have keyboard focus states and accessible names; selection is not communicated by color alone.
- Loading, empty, and error states explain what is happening in plain language.
- Data sources, licensing, attribution, and refresh timing must be confirmed before launch.
- The map must remain usable with the information and interaction the chosen data provider supports.

## 7. Content and data questions

- Which exact NASA data products or APIs power each topic?
- What does “DuWin” refer to, and should it be shown beside NASA as a tab, brand, or partner?
- What is “Top News” sourced from, and does it mean NASA news or topic-specific news?
- Should “World” be a map, globe, image, or another visualization?
- Should search locate places, datasets, news, or all three?

## 8. Acceptance criteria

- The first screen contains the left panel, the five topic controls, an updates list, and the large World area.
- Topic selection has a clear active state and a corresponding content state.
- The page remains navigable at desktop and mobile widths.
- Keyboard users can reach and operate the navigation, search, and view controls.
- Data attribution and failure/loading states are present once sources are selected.

## 9. Open decisions for the owner

1. Confirm whether the TerraNova logo should be the standalone symbol or full wordmark in the top row.
2. Confirm if the World area is intended to be an interactive map/globe.
3. Name the data source and desired contents for each topic.
4. Confirm the intended meaning of the lines below Top News.
5. Confirm target devices, audience, and whether “Top News” is a topic button or a news section.

## 10. Reference sketch

See [`sketch.svg`](sketch.svg). It is an editable vector wireframe based on the supplied image, not a final visual design.
