# Spot v4.6 — readable activity and a sparser venue map

## Scope

This update implements clearer on-map activity labels and a lower-density fictional
venue distribution. It retains the embedded Ask Spot panel, the existing themes,
area search, friend system, saved places, comparisons, privacy controls and the
one-finger pan / two-finger pinch engine. It does not add a new map provider, actual
background location, real venue data, a new AI model, or an occupancy estimator.

## Readable markers

- Individual venue: category icon, short place name, and “18 app users.”
- Area/group: group icon, “3 nearby spots,” and a combined app-user count.
- Expired or absent observations: “No recent data,” never “Empty.”
- Friends use the existing subtle dot. A name or count is not an invitation or a
  statement about total attendance. The selected venue receives visual emphasis.
- Full place names and count caveats remain in accessible labels and detail cards.
- Markers have 52-pixel-high touch surfaces. Close-by screen-space labels group
  together; tap a group to jump inward. Low-scale selected pins stay in their group
  to prevent a selected label from colliding with a nearby area label.

## Fictional fixture, not a Lincoln inventory

| Fixture measure | This version |
|---|---:|
| Total fictional venues | 32 |
| Cafés | 24 |
| Bars / clubs | 8 |
| Within Lincoln | 20 |
| Surrounding towns | 12 |
| Unique sample accounts | 5,000 |
| Initial accounts at establishments | 610 |
| Accepted friends | 60 |
| Friends initially sharing a place | 42 |

All venue coordinates were authored for this illustration. The minimum pairwise
spacing is approximately 690 meters (test invariant: at least 600 meters). This is
a design constraint, not a claim that real cafés and bars must be this far apart.
Counts are not measured occupancy or seats. Some sample records have no recent data.

Formerly dense decorative building grids are reduced. More space surrounds each
venue building, and nearby decorative buildings are fewer. Canvas detail still
appears as users zoom in; tiny footprints are intentionally suppressed region-wide.
Campus and town footprints remain visible at the tested mobile zoom levels.

## Data consistency and privacy

Profiles formerly associated with removed fixtures were reattached to a retained
venue of the same category. Existing friend identities and relationships remain.
Known visible friends cannot exceed a venue's count. Each of the 610 allocated
accounts contributes to exactly one venue. Updated source records, place cards and
assistant retrieval all reference the same 32 venues.

The assistant's guide derives its inventory from the current public snapshot;
no friend names, saved IDs, privacy permissions or GPS fields have been added.
Old conversation text is historical. A previously user-imported outdated guide
may still exist in their knowledge library: refresh or remove it when no longer
needed. The current snapshot explicitly supersedes old fixture counts.

## Rollback

`rollback/spot-with-ai-v4.5.zip` is an exact copy of the incoming integrated project.
Its SHA-256 is recorded in `rollback/manifest.json`. Earlier v4.2–v4.4 map HTMLs are
also retained. Unzip the original project to a separate folder to revert source.
Browser data is not backed up by a code ZIP; export chats before testing.

## Validation

336 automated checks passed. See TEST-REPORT.md for the split and limitations.
Gesture source is byte-identical to v4.5. The updated source has 68 app/server tests,
193 map tests, 31 embedded-interface tests and 44 layout/touch tests. Screenshots
show the real map rendering in a test harness with no loaded AI model.
