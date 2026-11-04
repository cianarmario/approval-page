# Shared user-side map implementation

The reusable map modules and scoped styles in this folder come from the nearby
`Capstone Project 2 (userside)` project. The approval portal's `ProjectMap`
component adapts its project record to that implementation.

The same city bounds, validated barangay geometry, label placement, tile caching,
smooth zoom, and natural tile rendering are retained. Both map sizes support dragging,
pinch zoom, and double-tap zoom. The expanded view also enables wheel zoom.
The default view and map presets center on the project marker. Expanded maps open
at the barangay overview, framing its boundary around the centered marker. Resizing
preserves this overview unless the reviewer has moved or zoomed the map.

Boundary files are served from `public/data/legazpi`. Source attribution is retained
on the map and in `boundaryData.ts`. The local boundary dataset is reused as-is;
the project coordinates remain the coordinates stored on the approval record.
