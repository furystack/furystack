import type { IconDefinition } from './icon-types.js'

// ============================================================================
// TIER 1 — Used in core components (required for emoji replacement)
// ============================================================================

// --- Actions / Controls ---

/** X mark icon for close, dismiss, and cancel actions */
export const close: IconDefinition = {
  paths: [{ d: 'M18 6L6 18M6 6l12 12' }],
}

/** Checkmark icon for confirmation and selection */
export const check: IconDefinition = {
  paths: [{ d: 'M20 6L9 17l-5-5' }],
}

/** Circled checkmark for success states */
export const checkCircle: IconDefinition = {
  style: 'fill',
  paths: [
    {
      d: 'M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.42-1.42L10 14.17l7.58-7.59L19 8l-9 9z',
    },
  ],
}

/** Circled X for error states */
export const errorCircle: IconDefinition = {
  style: 'fill',
  paths: [
    {
      d: 'M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm5 13.59L15.59 17 12 13.41 8.41 17 7 15.59 10.59 12 7 8.41 8.41 7 12 10.59 15.59 7 17 8.41 13.41 12 17 15.59z',
    },
  ],
}

/** Triangle warning icon */
export const warning: IconDefinition = {
  style: 'fill',
  paths: [
    {
      d: 'M1 21h22L12 2 1 21zm12-3h-2v-2h2v2zm0-4h-2v-4h2v4z',
    },
  ],
}

/** Circled "i" for informational messages */
export const info: IconDefinition = {
  style: 'fill',
  paths: [
    {
      d: 'M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-6h2v6zm0-8h-2V7h2v2z',
    },
  ],
}

/** Circle with a slash for forbidden / 403 */
export const forbidden: IconDefinition = {
  paths: [{ d: 'M12 2a10 10 0 100 20 10 10 0 000-20z' }, { d: 'M4.93 4.93l14.14 14.14' }],
}

/** Magnifying glass with an X for "not found" / 404 */
export const searchOff: IconDefinition = {
  paths: [{ d: 'M11 5a6 6 0 100 12 6 6 0 000-12z' }, { d: 'M21 21l-4.35-4.35' }, { d: 'M8 8l6 6M14 8l-6 6' }],
}

/** Explosion / server error icon for 500 */
export const serverError: IconDefinition = {
  paths: [{ d: 'M12 2l1.5 5.5L19 6l-3 5 5 1.5L16.5 15l2 5.5-5-3L12 22l-1.5-4.5-5 3 2-5.5L2 12.5 7 11l-3-5 5.5 1.5z' }],
}

// --- Navigation / Direction ---

/** Left-pointing chevron */
export const chevronLeft: IconDefinition = {
  paths: [{ d: 'M15 18l-6-6 6-6' }],
}

/** Right-pointing chevron */
export const chevronRight: IconDefinition = {
  paths: [{ d: 'M9 6l6 6-6 6' }],
}

/** Up-pointing chevron */
export const chevronUp: IconDefinition = {
  paths: [{ d: 'M18 15l-6-6-6 6' }],
}

/** Down-pointing chevron */
export const chevronDown: IconDefinition = {
  paths: [{ d: 'M6 9l6 6 6-6' }],
}

/** Upward arrow */
export const arrowUp: IconDefinition = {
  paths: [{ d: 'M12 19V5M5 12l7-7 7 7' }],
}

/** Downward arrow */
export const arrowDown: IconDefinition = {
  paths: [{ d: 'M12 5v14M19 12l-7 7-7-7' }],
}

/** Bidirectional vertical arrow for unsorted state */
export const arrowUpDown: IconDefinition = {
  paths: [{ d: 'M7 3l-4 4h8z' }, { d: 'M17 21l4-4H13z' }, { d: 'M7 7v14M17 17V3' }],
  style: 'fill',
}

// --- Search / Zoom ---

/** Magnifying glass */
export const search: IconDefinition = {
  paths: [{ d: 'M11 5a6 6 0 100 12 6 6 0 000-12z' }, { d: 'M21 21l-4.35-4.35' }],
}

/** Magnifying glass with a plus for zoom in */
export const zoomIn: IconDefinition = {
  paths: [{ d: 'M11 5a6 6 0 100 12 6 6 0 000-12z' }, { d: 'M21 21l-4.35-4.35' }, { d: 'M11 8v6M8 11h6' }],
}

/** Magnifying glass with a minus for zoom out */
export const zoomOut: IconDefinition = {
  paths: [{ d: 'M11 5a6 6 0 100 12 6 6 0 000-12z' }, { d: 'M21 21l-4.35-4.35' }, { d: 'M8 11h6' }],
}

/** Circular arrow for rotate */
export const rotate: IconDefinition = {
  paths: [{ d: 'M1 4v6h6' }, { d: 'M3.51 15a9 9 0 102.13-9.36L1 10' }],
}

// --- Rating ---

/** Filled star */
export const star: IconDefinition = {
  style: 'fill',
  paths: [
    {
      d: 'M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01z',
    },
  ],
}

/** Star outline */
export const starOutline: IconDefinition = {
  paths: [
    {
      d: 'M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01z',
    },
  ],
}

// --- Misc Tier 1 ---

/** Clipboard icon */
export const clipboard: IconDefinition = {
  paths: [
    { d: 'M16 4h2a2 2 0 012 2v14a2 2 0 01-2 2H6a2 2 0 01-2-2V6a2 2 0 012-2h2' },
    { d: 'M15 2H9a1 1 0 00-1 1v2a1 1 0 001 1h6a1 1 0 001-1V3a1 1 0 00-1-1z' },
  ],
}

/** Broken image placeholder */
export const imageBroken: IconDefinition = {
  paths: [
    { d: 'M21 3H3a2 2 0 00-2 2v14a2 2 0 002 2h18a2 2 0 002-2V5a2 2 0 00-2-2z' },
    { d: 'M8.5 10a1.5 1.5 0 100-3 1.5 1.5 0 000 3z' },
    { d: 'M21 15l-5-5L5 21' },
    { d: 'M2 2l20 20' },
  ],
}

// ============================================================================
// TIER 2 — Commonly used across showcase and general-purpose
// ============================================================================

/** House icon for home / landing */
export const home: IconDefinition = {
  paths: [{ d: 'M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2V9z' }, { d: 'M9 22V12h6v10' }],
}

/** Person silhouette */
export const user: IconDefinition = {
  paths: [{ d: 'M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2' }, { d: 'M12 3a4 4 0 100 8 4 4 0 000-8z' }],
}

/** Gear / cog for settings */
export const settings: IconDefinition = {
  paths: [
    {
      d: 'M12 15a3 3 0 100-6 3 3 0 000 6z',
    },
    {
      d: 'M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 01-2.83 2.83l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z',
    },
  ],
}

/** Pencil for edit */
export const edit: IconDefinition = {
  paths: [{ d: 'M17 3a2.83 2.83 0 014 4L7.5 20.5 2 22l1.5-5.5z' }],
}

/** Trash can for delete */
export const trash: IconDefinition = {
  paths: [
    { d: 'M3 6h18' },
    { d: 'M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2' },
    { d: 'M10 11v6M14 11v6' },
  ],
}

/** Floppy disk for save */
export const save: IconDefinition = {
  paths: [
    { d: 'M19 21H5a2 2 0 01-2-2V5a2 2 0 012-2h11l5 5v11a2 2 0 01-2 2z' },
    { d: 'M17 21v-8H7v8' },
    { d: 'M7 3v5h8' },
  ],
}

/** Chain link */
export const link: IconDefinition = {
  paths: [
    { d: 'M10 13a5 5 0 007.54.54l3-3a5 5 0 00-7.07-7.07l-1.72 1.71' },
    { d: 'M14 11a5 5 0 00-7.54-.54l-3 3a5 5 0 007.07 7.07l1.71-1.71' },
  ],
}

/** Bell for notifications */
export const bell: IconDefinition = {
  paths: [{ d: 'M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9' }, { d: 'M13.73 21a2 2 0 01-3.46 0' }],
}

/** Plus sign for add */
export const plus: IconDefinition = {
  paths: [{ d: 'M12 5v14M5 12h14' }],
}

/** Minus sign for subtract / collapse */
export const minus: IconDefinition = {
  paths: [{ d: 'M5 12h14' }],
}

/** Hamburger menu */
export const menu: IconDefinition = {
  paths: [{ d: 'M3 12h18' }, { d: 'M3 6h18' }, { d: 'M3 18h18' }],
}

/** Open eye for visibility */
export const eye: IconDefinition = {
  paths: [{ d: 'M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z' }, { d: 'M12 9a3 3 0 100 6 3 3 0 000-6z' }],
}

/** Eye with a slash for hidden */
export const eyeOff: IconDefinition = {
  paths: [
    { d: 'M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94' },
    { d: 'M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19' },
    { d: 'M14.12 14.12a3 3 0 11-4.24-4.24' },
    { d: 'M1 1l22 22' },
  ],
}

/** Locked padlock */
export const lock: IconDefinition = {
  paths: [
    { d: 'M19 11H5a2 2 0 00-2 2v7a2 2 0 002 2h14a2 2 0 002-2v-7a2 2 0 00-2-2z' },
    { d: 'M7 11V7a5 5 0 0110 0v4' },
  ],
}

/** Unlocked padlock */
export const unlock: IconDefinition = {
  paths: [{ d: 'M19 11H5a2 2 0 00-2 2v7a2 2 0 002 2h14a2 2 0 002-2v-7a2 2 0 00-2-2z' }, { d: 'M7 11V7a5 5 0 019.9-1' }],
}

/** Sun for light theme */
export const sun: IconDefinition = {
  paths: [
    { d: 'M12 8a4 4 0 100 8 4 4 0 000-8z' },
    {
      d: 'M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42',
    },
  ],
}

/** Moon / crescent for dark theme */
export const moon: IconDefinition = {
  paths: [{ d: 'M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z' }],
}

/** File / document page */
export const file: IconDefinition = {
  paths: [{ d: 'M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z' }, { d: 'M14 2v6h6' }],
}

/** Closed folder */
export const folder: IconDefinition = {
  paths: [
    {
      d: 'M22 19a2 2 0 01-2 2H4a2 2 0 01-2-2V5a2 2 0 012-2h5l2 3h9a2 2 0 012 2z',
    },
  ],
}

/** Open folder */
export const folderOpen: IconDefinition = {
  paths: [
    {
      d: 'M22 19a2 2 0 01-2 2H4a2 2 0 01-2-2V5a2 2 0 012-2h5l2 3h9a2 2 0 012 2v1',
    },
    { d: 'M2 10h20l-2.5 11H4.5z' },
  ],
}

/** Box / package */
export const packageIcon: IconDefinition = {
  paths: [
    { d: 'M16.5 9.4l-9-5.19' },
    {
      d: 'M21 16V8a2 2 0 00-1-1.73l-7-4a2 2 0 00-2 0l-7 4A2 2 0 003 8v8a2 2 0 001 1.73l7 4a2 2 0 002 0l7-4A2 2 0 0021 16z',
    },
    { d: 'M3.27 6.96L12 12.01l8.73-5.05' },
    { d: 'M12 22.08V12' },
  ],
}

/** Scissors for cut */
export const cut: IconDefinition = {
  paths: [
    { d: 'M6 9a3 3 0 100-6 3 3 0 000 6z' },
    { d: 'M6 21a3 3 0 100-6 3 3 0 000 6z' },
    { d: 'M20 4L8.12 15.88' },
    { d: 'M14.47 14.48L20 20' },
    { d: 'M8.12 8.12L12 12' },
  ],
}

/** Overlapping squares for copy */
export const copy: IconDefinition = {
  paths: [
    { d: 'M20 9h-9a2 2 0 00-2 2v9a2 2 0 002 2h9a2 2 0 002-2v-9a2 2 0 00-2-2z' },
    { d: 'M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1' },
  ],
}

/** Clipboard with arrow for paste */
export const paste: IconDefinition = {
  paths: [
    { d: 'M16 4h2a2 2 0 012 2v14a2 2 0 01-2 2H6a2 2 0 01-2-2V6a2 2 0 012-2h2' },
    { d: 'M15 2H9a1 1 0 00-1 1v2a1 1 0 001 1h6a1 1 0 001-1V3a1 1 0 00-1-1z' },
    { d: 'M12 11v6M9 14h6' },
  ],
}

/** Curved arrow back for undo */
export const undo: IconDefinition = {
  paths: [{ d: 'M3 7v6h6' }, { d: 'M5.51 17a9 9 0 102.13-9.36L3 13' }],
}

/** Curved arrow forward for redo */
export const redo: IconDefinition = {
  paths: [{ d: 'M23 4v6h-6' }, { d: 'M20.49 15a9 9 0 11-2.13-9.36L23 10' }],
}

/** Tray with downward arrow for inbox */
export const inbox: IconDefinition = {
  paths: [
    { d: 'M22 12h-6l-2 3H10l-2-3H2' },
    { d: 'M5.45 5.11L2 12v6a2 2 0 002 2h16a2 2 0 002-2v-6l-3.45-6.89A2 2 0 0016.76 4H7.24a2 2 0 00-1.79 1.11z' },
  ],
}

/** Paper plane for send */
export const send: IconDefinition = {
  paths: [{ d: 'M22 2L11 13' }, { d: 'M22 2L15 22l-4-9-9-4z' }],
}

/** Filled heart */
export const heart: IconDefinition = {
  style: 'fill',
  paths: [
    {
      d: 'M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z',
    },
  ],
}

/** Outlined heart */
export const heartOutline: IconDefinition = {
  paths: [
    {
      d: 'M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z',
    },
  ],
}

// ============================================================================
// TIER 3 — Nice-to-have common icons
// ============================================================================

/** Downward arrow into tray for download */
export const download: IconDefinition = {
  paths: [{ d: 'M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4' }, { d: 'M7 10l5 5 5-5' }, { d: 'M12 15V3' }],
}

/** Upward arrow from tray for upload */
export const upload: IconDefinition = {
  paths: [{ d: 'M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4' }, { d: 'M17 8l-5-5-5 5' }, { d: 'M12 3v12' }],
}

/** Circular arrows for refresh */
export const refresh: IconDefinition = {
  paths: [
    { d: 'M23 4v6h-6' },
    { d: 'M1 20v-6h6' },
    { d: 'M3.51 9a9 9 0 0114.85-3.36L23 10' },
    { d: 'M20.49 15a9 9 0 01-14.85 3.36L1 14' },
  ],
}

/** Funnel for filter */
export const filter: IconDefinition = {
  paths: [{ d: 'M22 3H2l8 9.46V19l4 2v-8.54z' }],
}

/** Arrow pointing to upper-right with box corner */
export const externalLink: IconDefinition = {
  paths: [{ d: 'M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6' }, { d: 'M15 3h6v6' }, { d: 'M10 14L21 3' }],
}

/** Three horizontal dots */
export const moreHorizontal: IconDefinition = {
  style: 'fill',
  paths: [
    { d: 'M12 10a2 2 0 100 4 2 2 0 000-4z' },
    { d: 'M5 10a2 2 0 100 4 2 2 0 000-4z' },
    { d: 'M19 10a2 2 0 100 4 2 2 0 000-4z' },
  ],
}

/** Three vertical dots */
export const moreVertical: IconDefinition = {
  style: 'fill',
  paths: [
    { d: 'M12 5a2 2 0 100 4 2 2 0 000-4z' },
    { d: 'M12 10a2 2 0 100 4 2 2 0 000-4z' },
    { d: 'M12 17a2 2 0 100-4 2 2 0 000 4z' },
  ],
}

/** Calendar page */
export const calendar: IconDefinition = {
  paths: [{ d: 'M19 4H5a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2V6a2 2 0 00-2-2z' }, { d: 'M16 2v4M8 2v4M3 10h18' }],
}

/** Clock face */
export const clock: IconDefinition = {
  paths: [{ d: 'M12 2a10 10 0 100 20 10 10 0 000-20z' }, { d: 'M12 6v6l4 2' }],
}

/** Globe / earth for internationalization */
export const globe: IconDefinition = {
  paths: [
    { d: 'M12 2a10 10 0 100 20 10 10 0 000-20z' },
    { d: 'M2 12h20' },
    { d: 'M12 2a15.3 15.3 0 014 10 15.3 15.3 0 01-4 10 15.3 15.3 0 01-4-10 15.3 15.3 0 014-10z' },
  ],
}

/** Map pin / location marker */
export const pin: IconDefinition = {
  paths: [{ d: 'M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z' }, { d: 'M12 7a3 3 0 100 6 3 3 0 000-6z' }],
}

/** Price tag / label */
export const tag: IconDefinition = {
  paths: [
    {
      d: 'M20.59 13.41l-7.17 7.17a2 2 0 01-2.83 0L2 12V2h10l8.59 8.59a2 2 0 010 2.82z',
    },
    { d: 'M7 7h.01' },
  ],
}

/** Share / branching arrow */
export const share: IconDefinition = {
  paths: [
    { d: 'M18 2a3 3 0 100 6 3 3 0 000-6z' },
    { d: 'M6 9a3 3 0 100 6 3 3 0 000-6z' },
    { d: 'M18 16a3 3 0 100 6 3 3 0 000-6z' },
    { d: 'M8.59 13.51l6.83 3.98M15.41 6.51l-6.82 3.98' },
  ],
}

/** Play triangle */
export const play: IconDefinition = {
  style: 'fill',
  paths: [{ d: 'M5 3l14 9-14 9V3z' }],
}

/** Pause bars */
export const pause: IconDefinition = {
  paths: [{ d: 'M6 4h4v16H6zM14 4h4v16h-4z' }],
  style: 'fill',
}
