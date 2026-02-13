import type { IconDefinition } from './icon-types.js'

// ============================================================================
// TIER 1 — Used in core components (required for emoji replacement)
// ============================================================================

// --- Actions / Controls ---

/** X mark icon for close, dismiss, and cancel actions */
export const close: IconDefinition = {
  name: 'Close',
  description: 'X mark for close, dismiss, and cancel actions',
  keywords: ['close', 'dismiss', 'cancel', 'x', 'remove'],
  category: 'Actions',
  paths: [{ d: 'M18 6L6 18M6 6l12 12' }],
}

/** Checkmark icon for confirmation and selection */
export const check: IconDefinition = {
  name: 'Check',
  description: 'Checkmark for confirmation and selection',
  keywords: ['check', 'confirm', 'done', 'accept', 'tick', 'yes'],
  category: 'Actions',
  paths: [{ d: 'M20 6L9 17l-5-5' }],
}

/** Circled checkmark for success states */
export const checkCircle: IconDefinition = {
  name: 'Check Circle',
  description: 'Circled checkmark for success states',
  keywords: ['check', 'success', 'complete', 'done', 'circle', 'verified'],
  category: 'Status',
  style: 'fill',
  paths: [
    {
      d: 'M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.42-1.42L10 14.17l7.58-7.59L19 8l-9 9z',
    },
  ],
}

/** Circled X for error states */
export const errorCircle: IconDefinition = {
  name: 'Error Circle',
  description: 'Circled X for error states',
  keywords: ['error', 'fail', 'failure', 'cancel', 'circle', 'x'],
  category: 'Status',
  style: 'fill',
  paths: [
    {
      d: 'M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm5 13.59L15.59 17 12 13.41 8.41 17 7 15.59 10.59 12 7 8.41 8.41 7 12 10.59 15.59 7 17 8.41 13.41 12 17 15.59z',
    },
  ],
}

/** Triangle warning icon */
export const warning: IconDefinition = {
  name: 'Warning',
  description: 'Triangle warning icon for alerts and caution',
  keywords: ['warning', 'alert', 'caution', 'danger', 'triangle', 'exclamation'],
  category: 'Status',
  style: 'fill',
  paths: [
    {
      d: 'M1 21h22L12 2 1 21zm12-3h-2v-2h2v2zm0-4h-2v-4h2v4z',
    },
  ],
}

/** Circled "i" for informational messages */
export const info: IconDefinition = {
  name: 'Info',
  description: 'Circled "i" for informational messages',
  keywords: ['info', 'information', 'help', 'about', 'circle', 'i'],
  category: 'Status',
  style: 'fill',
  paths: [
    {
      d: 'M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-6h2v6zm0-8h-2V7h2v2z',
    },
  ],
}

/** Circle with a slash for forbidden / 403 */
export const forbidden: IconDefinition = {
  name: 'Forbidden',
  description: 'Circle with a slash for forbidden / 403 errors',
  keywords: ['forbidden', 'banned', 'blocked', 'denied', '403', 'no-access'],
  category: 'Status',
  paths: [{ d: 'M12 2a10 10 0 100 20 10 10 0 000-20z' }, { d: 'M4.93 4.93l14.14 14.14' }],
}

/** Magnifying glass with an X for "not found" / 404 */
export const searchOff: IconDefinition = {
  name: 'Search Off',
  description: 'Magnifying glass with an X for "not found" / 404',
  keywords: ['search', 'not-found', '404', 'missing', 'empty'],
  category: 'Status',
  paths: [{ d: 'M11 5a6 6 0 100 12 6 6 0 000-12z' }, { d: 'M21 21l-4.35-4.35' }, { d: 'M8 8l6 6M14 8l-6 6' }],
}

/** Explosion / server error icon for 500 */
export const serverError: IconDefinition = {
  name: 'Server Error',
  description: 'Explosion icon for server error / 500',
  keywords: ['server', 'error', '500', 'crash', 'explosion', 'internal'],
  category: 'Status',
  paths: [{ d: 'M12 2l1.5 5.5L19 6l-3 5 5 1.5L16.5 15l2 5.5-5-3L12 22l-1.5-4.5-5 3 2-5.5L2 12.5 7 11l-3-5 5.5 1.5z' }],
}

// --- Navigation / Direction ---

/** Left-pointing chevron */
export const chevronLeft: IconDefinition = {
  name: 'Chevron Left',
  description: 'Left-pointing chevron for navigation',
  keywords: ['chevron', 'left', 'back', 'previous', 'arrow'],
  category: 'Navigation',
  paths: [{ d: 'M15 18l-6-6 6-6' }],
}

/** Right-pointing chevron */
export const chevronRight: IconDefinition = {
  name: 'Chevron Right',
  description: 'Right-pointing chevron for navigation',
  keywords: ['chevron', 'right', 'forward', 'next', 'arrow'],
  category: 'Navigation',
  paths: [{ d: 'M9 6l6 6-6 6' }],
}

/** Up-pointing chevron */
export const chevronUp: IconDefinition = {
  name: 'Chevron Up',
  description: 'Up-pointing chevron for expand/collapse',
  keywords: ['chevron', 'up', 'expand', 'collapse', 'arrow'],
  category: 'Navigation',
  paths: [{ d: 'M18 15l-6-6-6 6' }],
}

/** Down-pointing chevron */
export const chevronDown: IconDefinition = {
  name: 'Chevron Down',
  description: 'Down-pointing chevron for expand/collapse',
  keywords: ['chevron', 'down', 'expand', 'collapse', 'arrow', 'dropdown'],
  category: 'Navigation',
  paths: [{ d: 'M6 9l6 6 6-6' }],
}

/** Upward arrow */
export const arrowUp: IconDefinition = {
  name: 'Arrow Up',
  description: 'Upward arrow for direction and sorting',
  keywords: ['arrow', 'up', 'sort', 'ascending', 'direction'],
  category: 'Navigation',
  paths: [{ d: 'M12 19V5M5 12l7-7 7 7' }],
}

/** Downward arrow */
export const arrowDown: IconDefinition = {
  name: 'Arrow Down',
  description: 'Downward arrow for direction and sorting',
  keywords: ['arrow', 'down', 'sort', 'descending', 'direction'],
  category: 'Navigation',
  paths: [{ d: 'M12 5v14M19 12l-7 7-7-7' }],
}

/** Bidirectional vertical arrow for unsorted state */
export const arrowUpDown: IconDefinition = {
  name: 'Arrow Up Down',
  description: 'Bidirectional vertical arrow for unsorted state',
  keywords: ['arrow', 'sort', 'unsorted', 'up-down', 'bidirectional'],
  category: 'Navigation',
  paths: [{ d: 'M7 3l-4 4h8z' }, { d: 'M17 21l4-4H13z' }, { d: 'M7 7v14M17 17V3' }],
  style: 'fill',
}

// --- Search / Zoom ---

/** Magnifying glass */
export const search: IconDefinition = {
  name: 'Search',
  description: 'Magnifying glass for search functionality',
  keywords: ['search', 'find', 'lookup', 'magnifying-glass', 'query'],
  category: 'Actions',
  paths: [{ d: 'M11 5a6 6 0 100 12 6 6 0 000-12z' }, { d: 'M21 21l-4.35-4.35' }],
}

/** Magnifying glass with a plus for zoom in */
export const zoomIn: IconDefinition = {
  name: 'Zoom In',
  description: 'Magnifying glass with a plus for zoom in',
  keywords: ['zoom', 'in', 'enlarge', 'magnify', 'plus'],
  category: 'Actions',
  paths: [{ d: 'M11 5a6 6 0 100 12 6 6 0 000-12z' }, { d: 'M21 21l-4.35-4.35' }, { d: 'M11 8v6M8 11h6' }],
}

/** Magnifying glass with a minus for zoom out */
export const zoomOut: IconDefinition = {
  name: 'Zoom Out',
  description: 'Magnifying glass with a minus for zoom out',
  keywords: ['zoom', 'out', 'shrink', 'reduce', 'minus'],
  category: 'Actions',
  paths: [{ d: 'M11 5a6 6 0 100 12 6 6 0 000-12z' }, { d: 'M21 21l-4.35-4.35' }, { d: 'M8 11h6' }],
}

/** Circular arrow for rotate */
export const rotate: IconDefinition = {
  name: 'Rotate',
  description: 'Circular arrow for rotate actions',
  keywords: ['rotate', 'turn', 'spin', 'orientation'],
  category: 'Actions',
  paths: [{ d: 'M1 4v6h6' }, { d: 'M3.51 15a9 9 0 102.13-9.36L1 10' }],
}

// --- Rating ---

/** Filled star */
export const star: IconDefinition = {
  name: 'Star',
  description: 'Filled star for ratings and favorites',
  keywords: ['star', 'rating', 'favorite', 'bookmark', 'filled'],
  category: 'UI',
  style: 'fill',
  paths: [
    {
      d: 'M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01z',
    },
  ],
}

/** Star outline */
export const starOutline: IconDefinition = {
  name: 'Star Outline',
  description: 'Star outline for unselected ratings',
  keywords: ['star', 'rating', 'outline', 'empty', 'unselected'],
  category: 'UI',
  paths: [
    {
      d: 'M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01z',
    },
  ],
}

// --- Misc Tier 1 ---

/** Clipboard icon */
export const clipboard: IconDefinition = {
  name: 'Clipboard',
  description: 'Clipboard for copying and pasting content',
  keywords: ['clipboard', 'copy', 'paste', 'board'],
  category: 'Content',
  paths: [
    { d: 'M16 4h2a2 2 0 012 2v14a2 2 0 01-2 2H6a2 2 0 01-2-2V6a2 2 0 012-2h2' },
    { d: 'M15 2H9a1 1 0 00-1 1v2a1 1 0 001 1h6a1 1 0 001-1V3a1 1 0 00-1-1z' },
  ],
}

/** Broken image placeholder */
export const imageBroken: IconDefinition = {
  name: 'Image Broken',
  description: 'Broken image placeholder for missing images',
  keywords: ['image', 'broken', 'missing', 'placeholder', 'error'],
  category: 'Content',
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
  name: 'Home',
  description: 'House icon for home / landing page',
  keywords: ['home', 'house', 'landing', 'main', 'dashboard'],
  category: 'Common',
  paths: [{ d: 'M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2V9z' }, { d: 'M9 22V12h6v10' }],
}

/** Person silhouette */
export const user: IconDefinition = {
  name: 'User',
  description: 'Person silhouette for user profiles',
  keywords: ['user', 'person', 'profile', 'account', 'avatar'],
  category: 'Common',
  paths: [{ d: 'M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2' }, { d: 'M12 3a4 4 0 100 8 4 4 0 000-8z' }],
}

/** Gear / cog for settings */
export const settings: IconDefinition = {
  name: 'Settings',
  description: 'Gear / cog for settings and configuration',
  keywords: ['settings', 'gear', 'cog', 'config', 'preferences', 'options'],
  category: 'Common',
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
  name: 'Edit',
  description: 'Pencil icon for editing content',
  keywords: ['edit', 'pencil', 'write', 'modify', 'update'],
  category: 'Actions',
  paths: [{ d: 'M17 3a2.83 2.83 0 014 4L7.5 20.5 2 22l1.5-5.5z' }],
}

/** Trash can for delete */
export const trash: IconDefinition = {
  name: 'Trash',
  description: 'Trash can for deleting items',
  keywords: ['trash', 'delete', 'remove', 'discard', 'bin', 'garbage'],
  category: 'Actions',
  paths: [
    { d: 'M3 6h18' },
    { d: 'M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2' },
    { d: 'M10 11v6M14 11v6' },
  ],
}

/** Floppy disk for save */
export const save: IconDefinition = {
  name: 'Save',
  description: 'Floppy disk for saving content',
  keywords: ['save', 'floppy', 'disk', 'store', 'persist'],
  category: 'Actions',
  paths: [
    { d: 'M19 21H5a2 2 0 01-2-2V5a2 2 0 012-2h11l5 5v11a2 2 0 01-2 2z' },
    { d: 'M17 21v-8H7v8' },
    { d: 'M7 3v5h8' },
  ],
}

/** Chain link */
export const link: IconDefinition = {
  name: 'Link',
  description: 'Chain link for URLs and hyperlinks',
  keywords: ['link', 'chain', 'url', 'hyperlink', 'connect'],
  category: 'Actions',
  paths: [
    { d: 'M10 13a5 5 0 007.54.54l3-3a5 5 0 00-7.07-7.07l-1.72 1.71' },
    { d: 'M14 11a5 5 0 00-7.54-.54l-3 3a5 5 0 007.07 7.07l1.71-1.71' },
  ],
}

/** Bell for notifications */
export const bell: IconDefinition = {
  name: 'Bell',
  description: 'Bell for notifications and alerts',
  keywords: ['bell', 'notification', 'alert', 'alarm', 'ring'],
  category: 'Common',
  paths: [{ d: 'M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9' }, { d: 'M13.73 21a2 2 0 01-3.46 0' }],
}

/** Plus sign for add */
export const plus: IconDefinition = {
  name: 'Plus',
  description: 'Plus sign for adding items',
  keywords: ['plus', 'add', 'new', 'create', 'positive'],
  category: 'Actions',
  paths: [{ d: 'M12 5v14M5 12h14' }],
}

/** Minus sign for subtract / collapse */
export const minus: IconDefinition = {
  name: 'Minus',
  description: 'Minus sign for subtracting or collapsing',
  keywords: ['minus', 'subtract', 'remove', 'collapse', 'negative'],
  category: 'Actions',
  paths: [{ d: 'M5 12h14' }],
}

/** Hamburger menu */
export const menu: IconDefinition = {
  name: 'Menu',
  description: 'Hamburger menu icon',
  keywords: ['menu', 'hamburger', 'navigation', 'sidebar', 'drawer'],
  category: 'UI',
  paths: [{ d: 'M3 12h18' }, { d: 'M3 6h18' }, { d: 'M3 18h18' }],
}

/** Open eye for visibility */
export const eye: IconDefinition = {
  name: 'Eye',
  description: 'Open eye for visibility and showing content',
  keywords: ['eye', 'show', 'visible', 'visibility', 'view', 'watch'],
  category: 'UI',
  paths: [{ d: 'M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z' }, { d: 'M12 9a3 3 0 100 6 3 3 0 000-6z' }],
}

/** Eye with a slash for hidden */
export const eyeOff: IconDefinition = {
  name: 'Eye Off',
  description: 'Eye with a slash for hiding content',
  keywords: ['eye', 'hide', 'hidden', 'invisible', 'off', 'private'],
  category: 'UI',
  paths: [
    { d: 'M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94' },
    { d: 'M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19' },
    { d: 'M14.12 14.12a3 3 0 11-4.24-4.24' },
    { d: 'M1 1l22 22' },
  ],
}

/** Locked padlock */
export const lock: IconDefinition = {
  name: 'Lock',
  description: 'Locked padlock for security and authentication',
  keywords: ['lock', 'locked', 'secure', 'security', 'password', 'private'],
  category: 'Common',
  paths: [
    { d: 'M19 11H5a2 2 0 00-2 2v7a2 2 0 002 2h14a2 2 0 002-2v-7a2 2 0 00-2-2z' },
    { d: 'M7 11V7a5 5 0 0110 0v4' },
  ],
}

/** Unlocked padlock */
export const unlock: IconDefinition = {
  name: 'Unlock',
  description: 'Unlocked padlock for unlocked/public state',
  keywords: ['unlock', 'unlocked', 'open', 'public', 'accessible'],
  category: 'Common',
  paths: [{ d: 'M19 11H5a2 2 0 00-2 2v7a2 2 0 002 2h14a2 2 0 002-2v-7a2 2 0 00-2-2z' }, { d: 'M7 11V7a5 5 0 019.9-1' }],
}

/** Sun for light theme */
export const sun: IconDefinition = {
  name: 'Sun',
  description: 'Sun icon for light theme toggle',
  keywords: ['sun', 'light', 'theme', 'day', 'bright'],
  category: 'Common',
  paths: [
    { d: 'M12 8a4 4 0 100 8 4 4 0 000-8z' },
    {
      d: 'M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42',
    },
  ],
}

/** Moon / crescent for dark theme */
export const moon: IconDefinition = {
  name: 'Moon',
  description: 'Moon / crescent for dark theme toggle',
  keywords: ['moon', 'dark', 'theme', 'night', 'crescent'],
  category: 'Common',
  paths: [{ d: 'M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z' }],
}

/** File / document page */
export const file: IconDefinition = {
  name: 'File',
  description: 'Document page icon',
  keywords: ['file', 'document', 'page', 'paper'],
  category: 'Content',
  paths: [{ d: 'M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z' }, { d: 'M14 2v6h6' }],
}

/** Closed folder */
export const folder: IconDefinition = {
  name: 'Folder',
  description: 'Closed folder for file organization',
  keywords: ['folder', 'directory', 'organize', 'files', 'closed'],
  category: 'Content',
  paths: [
    {
      d: 'M22 19a2 2 0 01-2 2H4a2 2 0 01-2-2V5a2 2 0 012-2h5l2 3h9a2 2 0 012 2z',
    },
  ],
}

/** Open folder */
export const folderOpen: IconDefinition = {
  name: 'Folder Open',
  description: 'Open folder for expanded directories',
  keywords: ['folder', 'directory', 'open', 'expanded', 'browse'],
  category: 'Content',
  paths: [
    {
      d: 'M22 19a2 2 0 01-2 2H4a2 2 0 01-2-2V5a2 2 0 012-2h5l2 3h9a2 2 0 012 2v1',
    },
    { d: 'M2 10h20l-2.5 11H4.5z' },
  ],
}

/** Box / package */
export const packageIcon: IconDefinition = {
  name: 'Package',
  description: 'Box / package icon for modules and deliveries',
  keywords: ['package', 'box', 'module', 'delivery', 'parcel', 'npm'],
  category: 'Content',
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
  name: 'Cut',
  description: 'Scissors for cutting content',
  keywords: ['cut', 'scissors', 'trim', 'snip'],
  category: 'Actions',
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
  name: 'Copy',
  description: 'Overlapping squares for copying content',
  keywords: ['copy', 'duplicate', 'clone', 'squares'],
  category: 'Actions',
  paths: [
    { d: 'M20 9h-9a2 2 0 00-2 2v9a2 2 0 002 2h9a2 2 0 002-2v-9a2 2 0 00-2-2z' },
    { d: 'M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1' },
  ],
}

/** Clipboard with arrow for paste */
export const paste: IconDefinition = {
  name: 'Paste',
  description: 'Clipboard with plus for pasting content',
  keywords: ['paste', 'clipboard', 'insert'],
  category: 'Actions',
  paths: [
    { d: 'M16 4h2a2 2 0 012 2v14a2 2 0 01-2 2H6a2 2 0 01-2-2V6a2 2 0 012-2h2' },
    { d: 'M15 2H9a1 1 0 00-1 1v2a1 1 0 001 1h6a1 1 0 001-1V3a1 1 0 00-1-1z' },
    { d: 'M12 11v6M9 14h6' },
  ],
}

/** Curved arrow back for undo */
export const undo: IconDefinition = {
  name: 'Undo',
  description: 'Curved arrow back for undo',
  keywords: ['undo', 'back', 'revert', 'history'],
  category: 'Actions',
  paths: [{ d: 'M3 7v6h6' }, { d: 'M5.51 17a9 9 0 102.13-9.36L3 13' }],
}

/** Curved arrow forward for redo */
export const redo: IconDefinition = {
  name: 'Redo',
  description: 'Curved arrow forward for redo',
  keywords: ['redo', 'forward', 'repeat', 'history'],
  category: 'Actions',
  paths: [{ d: 'M23 4v6h-6' }, { d: 'M20.49 15a9 9 0 11-2.13-9.36L23 10' }],
}

/** Tray with downward arrow for inbox */
export const inbox: IconDefinition = {
  name: 'Inbox',
  description: 'Tray with downward arrow for inbox / received items',
  keywords: ['inbox', 'tray', 'mail', 'receive', 'incoming'],
  category: 'Content',
  paths: [
    { d: 'M22 12h-6l-2 3H10l-2-3H2' },
    { d: 'M5.45 5.11L2 12v6a2 2 0 002 2h16a2 2 0 002-2v-6l-3.45-6.89A2 2 0 0016.76 4H7.24a2 2 0 00-1.79 1.11z' },
  ],
}

/** Paper plane for send */
export const send: IconDefinition = {
  name: 'Send',
  description: 'Paper plane for sending messages',
  keywords: ['send', 'submit', 'paper-plane', 'message', 'dispatch'],
  category: 'Content',
  paths: [{ d: 'M22 2L11 13' }, { d: 'M22 2L15 22l-4-9-9-4z' }],
}

/** Filled heart */
export const heart: IconDefinition = {
  name: 'Heart',
  description: 'Filled heart for likes and favorites',
  keywords: ['heart', 'love', 'like', 'favorite', 'filled'],
  category: 'UI',
  style: 'fill',
  paths: [
    {
      d: 'M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z',
    },
  ],
}

/** Outlined heart */
export const heartOutline: IconDefinition = {
  name: 'Heart Outline',
  description: 'Outlined heart for unliked state',
  keywords: ['heart', 'love', 'like', 'outline', 'empty', 'unlike'],
  category: 'UI',
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
  name: 'Download',
  description: 'Downward arrow into tray for downloading',
  keywords: ['download', 'save', 'export', 'get'],
  category: 'Actions',
  paths: [{ d: 'M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4' }, { d: 'M7 10l5 5 5-5' }, { d: 'M12 15V3' }],
}

/** Upward arrow from tray for upload */
export const upload: IconDefinition = {
  name: 'Upload',
  description: 'Upward arrow from tray for uploading',
  keywords: ['upload', 'import', 'send', 'put'],
  category: 'Actions',
  paths: [{ d: 'M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4' }, { d: 'M17 8l-5-5-5 5' }, { d: 'M12 3v12' }],
}

/** Circular arrows for refresh */
export const refresh: IconDefinition = {
  name: 'Refresh',
  description: 'Circular arrows for refreshing / reloading',
  keywords: ['refresh', 'reload', 'sync', 'recycle', 'update'],
  category: 'Actions',
  paths: [
    { d: 'M23 4v6h-6' },
    { d: 'M1 20v-6h6' },
    { d: 'M3.51 9a9 9 0 0114.85-3.36L23 10' },
    { d: 'M20.49 15a9 9 0 01-14.85 3.36L1 14' },
  ],
}

/** Funnel for filter */
export const filter: IconDefinition = {
  name: 'Filter',
  description: 'Funnel for filtering content',
  keywords: ['filter', 'funnel', 'sort', 'refine', 'narrow'],
  category: 'Actions',
  paths: [{ d: 'M22 3H2l8 9.46V19l4 2v-8.54z' }],
}

/** Arrow pointing to upper-right with box corner */
export const externalLink: IconDefinition = {
  name: 'External Link',
  description: 'Arrow pointing to upper-right for external links',
  keywords: ['external', 'link', 'open', 'new-window', 'redirect'],
  category: 'Navigation',
  paths: [{ d: 'M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6' }, { d: 'M15 3h6v6' }, { d: 'M10 14L21 3' }],
}

/** Three horizontal dots */
export const moreHorizontal: IconDefinition = {
  name: 'More Horizontal',
  description: 'Three horizontal dots for overflow menus',
  keywords: ['more', 'horizontal', 'dots', 'ellipsis', 'overflow', 'menu'],
  category: 'UI',
  style: 'fill',
  paths: [
    { d: 'M12 10a2 2 0 100 4 2 2 0 000-4z' },
    { d: 'M5 10a2 2 0 100 4 2 2 0 000-4z' },
    { d: 'M19 10a2 2 0 100 4 2 2 0 000-4z' },
  ],
}

/** Three vertical dots */
export const moreVertical: IconDefinition = {
  name: 'More Vertical',
  description: 'Three vertical dots for overflow menus',
  keywords: ['more', 'vertical', 'dots', 'ellipsis', 'overflow', 'menu'],
  category: 'UI',
  style: 'fill',
  paths: [
    { d: 'M12 5a2 2 0 100 4 2 2 0 000-4z' },
    { d: 'M12 10a2 2 0 100 4 2 2 0 000-4z' },
    { d: 'M12 17a2 2 0 100-4 2 2 0 000 4z' },
  ],
}

/** Calendar page */
export const calendar: IconDefinition = {
  name: 'Calendar',
  description: 'Calendar page for dates and scheduling',
  keywords: ['calendar', 'date', 'schedule', 'event', 'planner'],
  category: 'Common',
  paths: [{ d: 'M19 4H5a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2V6a2 2 0 00-2-2z' }, { d: 'M16 2v4M8 2v4M3 10h18' }],
}

/** Clock face */
export const clock: IconDefinition = {
  name: 'Clock',
  description: 'Clock face for time-related content',
  keywords: ['clock', 'time', 'hour', 'schedule', 'timer'],
  category: 'Common',
  paths: [{ d: 'M12 2a10 10 0 100 20 10 10 0 000-20z' }, { d: 'M12 6v6l4 2' }],
}

/** Globe / earth for internationalization */
export const globe: IconDefinition = {
  name: 'Globe',
  description: 'Globe / earth for internationalization and web',
  keywords: ['globe', 'earth', 'world', 'international', 'web', 'language'],
  category: 'Common',
  paths: [
    { d: 'M12 2a10 10 0 100 20 10 10 0 000-20z' },
    { d: 'M2 12h20' },
    { d: 'M12 2a15.3 15.3 0 014 10 15.3 15.3 0 01-4 10 15.3 15.3 0 01-4-10 15.3 15.3 0 014-10z' },
  ],
}

/** Map pin / location marker */
export const pin: IconDefinition = {
  name: 'Pin',
  description: 'Map pin / location marker',
  keywords: ['pin', 'location', 'map', 'marker', 'place', 'gps'],
  category: 'UI',
  paths: [{ d: 'M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z' }, { d: 'M12 7a3 3 0 100 6 3 3 0 000-6z' }],
}

/** Price tag / label */
export const tag: IconDefinition = {
  name: 'Tag',
  description: 'Price tag / label for categorization',
  keywords: ['tag', 'label', 'price', 'category', 'badge'],
  category: 'UI',
  paths: [
    {
      d: 'M20.59 13.41l-7.17 7.17a2 2 0 01-2.83 0L2 12V2h10l8.59 8.59a2 2 0 010 2.82z',
    },
    { d: 'M7 7h.01' },
  ],
}

/** Share / branching arrow */
export const share: IconDefinition = {
  name: 'Share',
  description: 'Branching arrow for sharing content',
  keywords: ['share', 'social', 'distribute', 'send', 'branch'],
  category: 'Actions',
  paths: [
    { d: 'M18 2a3 3 0 100 6 3 3 0 000-6z' },
    { d: 'M6 9a3 3 0 100 6 3 3 0 000-6z' },
    { d: 'M18 16a3 3 0 100 6 3 3 0 000-6z' },
    { d: 'M8.59 13.51l6.83 3.98M15.41 6.51l-6.82 3.98' },
  ],
}

/** Play triangle */
export const play: IconDefinition = {
  name: 'Play',
  description: 'Play triangle for media playback',
  keywords: ['play', 'start', 'media', 'video', 'audio'],
  category: 'Common',
  style: 'fill',
  paths: [{ d: 'M5 3l14 9-14 9V3z' }],
}

/** Pause bars */
export const pause: IconDefinition = {
  name: 'Pause',
  description: 'Pause bars for media playback',
  keywords: ['pause', 'stop', 'media', 'wait', 'hold'],
  category: 'Common',
  paths: [{ d: 'M6 4h4v16H6zM14 4h4v16h-4z' }],
  style: 'fill',
}

// ============================================================================
// TIER 4 — New icons for emoji replacement
// ============================================================================

/** Envelope for email / mail */
export const envelope: IconDefinition = {
  name: 'Envelope',
  description: 'Envelope for email and mail',
  keywords: ['mail', 'email', 'envelope', 'message', 'letter'],
  category: 'Content',
  paths: [{ d: 'M4 4h16a2 2 0 012 2v12a2 2 0 01-2 2H4a2 2 0 01-2-2V6a2 2 0 012-2z' }, { d: 'M22 6l-10 7L2 6' }],
}

/** Bar chart for statistics / analytics */
export const barChart: IconDefinition = {
  name: 'Bar Chart',
  description: 'Bar chart for statistics and analytics',
  keywords: ['chart', 'bar', 'graph', 'statistics', 'analytics', 'data'],
  category: 'Content',
  paths: [{ d: 'M18 20V10M12 20V4M6 20v-6' }],
}

/** Multiple people for groups / teams */
export const users: IconDefinition = {
  name: 'Users',
  description: 'Multiple people for groups and teams',
  keywords: ['users', 'people', 'group', 'team', 'members', 'community'],
  category: 'Common',
  paths: [
    { d: 'M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2' },
    { d: 'M9 3a4 4 0 100 8 4 4 0 000-8z' },
    { d: 'M23 21v-2a4 4 0 00-3-3.87' },
    { d: 'M16 3.13a4 4 0 010 7.75' },
  ],
}

/** File with text lines for notes / documents */
export const fileText: IconDefinition = {
  name: 'File Text',
  description: 'File with text lines for notes and documents',
  keywords: ['file', 'text', 'document', 'note', 'paper', 'writing'],
  category: 'Content',
  paths: [
    { d: 'M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z' },
    { d: 'M14 2v6h6' },
    { d: 'M16 13H8M16 17H8M10 9H8' },
  ],
}

/** Exit / logout arrow for sign out */
export const logOut: IconDefinition = {
  name: 'Log Out',
  description: 'Exit / logout arrow for sign out actions',
  keywords: ['logout', 'signout', 'exit', 'leave', 'door'],
  category: 'Actions',
  paths: [{ d: 'M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4' }, { d: 'M16 17l5-5-5-5' }, { d: 'M21 12H9' }],
}

/** Briefcase for work / professional */
export const briefcase: IconDefinition = {
  name: 'Briefcase',
  description: 'Briefcase for work and professional contexts',
  keywords: ['briefcase', 'work', 'job', 'business', 'career', 'professional'],
  category: 'Content',
  paths: [
    { d: 'M20 7H4a2 2 0 00-2 2v10a2 2 0 002 2h16a2 2 0 002-2V9a2 2 0 00-2-2z' },
    { d: 'M16 21V5a2 2 0 00-2-2h-4a2 2 0 00-2 2v16' },
  ],
}

/** Filled circle / dot for status indicators */
export const circleDot: IconDefinition = {
  name: 'Circle Dot',
  description: 'Filled circle dot for status indicators',
  keywords: ['circle', 'dot', 'status', 'indicator', 'radio', 'bullet'],
  category: 'UI',
  paths: [{ d: 'M12 2a10 10 0 100 20 10 10 0 000-20z' }, { d: 'M12 8a4 4 0 100 8 4 4 0 000-8z' }],
}

/** Keyboard for input / shortcuts */
export const keyboard: IconDefinition = {
  name: 'Keyboard',
  description: 'Keyboard for input and shortcuts',
  keywords: ['keyboard', 'type', 'input', 'keys', 'shortcut', 'hotkey'],
  category: 'Content',
  paths: [
    { d: 'M20 3H4a2 2 0 00-2 2v10a2 2 0 002 2h16a2 2 0 002-2V5a2 2 0 00-2-2z' },
    { d: 'M7 17l5 4 5-4' },
    { d: 'M7 8h.01M11 8h.01M15 8h.01M7 12h.01M11 12h.01M15 12h.01' },
  ],
}

/** Stacked layers for depth / pages */
export const layers: IconDefinition = {
  name: 'Layers',
  description: 'Stacked layers for depth and multi-page content',
  keywords: ['layers', 'stack', 'pages', 'depth', 'levels'],
  category: 'Content',
  paths: [{ d: 'M12 2L2 7l10 5 10-5-10-5z' }, { d: 'M2 17l10 5 10-5' }, { d: 'M2 12l10 5 10-5' }],
}

/** Checked checkbox for completed items */
export const checkSquare: IconDefinition = {
  name: 'Check Square',
  description: 'Checked checkbox for completed items',
  keywords: ['check', 'checkbox', 'square', 'done', 'completed', 'task'],
  category: 'Actions',
  paths: [{ d: 'M9 11l3 3L22 4' }, { d: 'M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11' }],
}

/** Fire / flame for trending / hot */
export const flame: IconDefinition = {
  name: 'Flame',
  description: 'Fire / flame for trending and hot items',
  keywords: ['flame', 'fire', 'hot', 'trending', 'popular', 'burn'],
  category: 'UI',
  paths: [
    {
      d: 'M12 22c4.97 0 8-3.58 8-8 0-2.52-1.27-5.24-2.72-7.38a20.39 20.39 0 00-3.06-3.56L12 1l-2.22 2.06a20.39 20.39 0 00-3.06 3.56C5.27 8.76 4 11.48 4 14c0 4.42 3.03 8 8 8z',
    },
    {
      d: 'M12 22c-2.21 0-4-1.79-4-4 0-1.13.57-2.35 1.22-3.31a9.15 9.15 0 011.37-1.6L12 12l1.41 1.09c.5.43.97.97 1.37 1.6.65.96 1.22 2.18 1.22 3.31 0 2.21-1.79 4-4 4z',
    },
  ],
}

/** Wind / breeze for weather or speed */
export const wind: IconDefinition = {
  name: 'Wind',
  description: 'Wind / breeze for weather and speed',
  keywords: ['wind', 'breeze', 'air', 'weather', 'fast', 'speed'],
  category: 'Common',
  paths: [
    { d: 'M9.59 4.59A2 2 0 1111 8H2' },
    { d: 'M12.59 19.41A2 2 0 1014 16H2' },
    { d: 'M17.73 7.73A2.5 2.5 0 1119.5 12H2' },
  ],
}

/** Slider controls for adjustments */
export const sliders: IconDefinition = {
  name: 'Sliders',
  description: 'Slider controls for adjustments and settings',
  keywords: ['sliders', 'controls', 'adjust', 'settings', 'equalizer', 'tune'],
  category: 'UI',
  paths: [{ d: 'M4 21v-7M4 10V3M12 21v-9M12 8V3M20 21v-5M20 12V3' }, { d: 'M1 14h6M9 8h6M17 16h6' }],
}

/** Crossing arrows for shuffle / random */
export const shuffle: IconDefinition = {
  name: 'Shuffle',
  description: 'Crossing arrows for shuffle and random',
  keywords: ['shuffle', 'random', 'mix', 'crossing', 'arrows'],
  category: 'Actions',
  paths: [{ d: 'M16 3h5v5' }, { d: 'M4 20L21 3' }, { d: 'M21 16v5h-5' }, { d: 'M15 15l6 6' }, { d: 'M4 4l5 5' }],
}

/** Stop circle for halt / block */
export const stopCircle: IconDefinition = {
  name: 'Stop Circle',
  description: 'Stop circle for halt and block actions',
  keywords: ['stop', 'halt', 'block', 'circle', 'end'],
  category: 'Status',
  paths: [{ d: 'M12 2a10 10 0 100 20 10 10 0 000-20z' }, { d: 'M9 9h6v6H9z' }],
}

/** Left arrow for navigation */
export const arrowLeft: IconDefinition = {
  name: 'Arrow Left',
  description: 'Left arrow for backward navigation',
  keywords: ['arrow', 'left', 'back', 'previous', 'direction'],
  category: 'Navigation',
  paths: [{ d: 'M19 12H5M12 19l-7-7 7-7' }],
}

/** Right arrow for navigation */
export const arrowRight: IconDefinition = {
  name: 'Arrow Right',
  description: 'Right arrow for forward navigation',
  keywords: ['arrow', 'right', 'forward', 'next', 'direction'],
  category: 'Navigation',
  paths: [{ d: 'M5 12h14M12 5l7 7-7 7' }],
}

/** Hash / number sign */
export const hash: IconDefinition = {
  name: 'Hash',
  description: 'Hash / number sign for numbering and channels',
  keywords: ['hash', 'number', 'pound', 'channel', 'tag', 'count'],
  category: 'UI',
  paths: [{ d: 'M4 9h16M4 15h16M10 3l-2 18M16 3l-2 18' }],
}

/** Deciduous tree for nature */
export const treeDeciduous: IconDefinition = {
  name: 'Tree',
  description: 'Deciduous tree for nature and hierarchy',
  keywords: ['tree', 'nature', 'plant', 'hierarchy', 'branch', 'leaf'],
  category: 'Content',
  paths: [
    { d: 'M12 22V8' },
    {
      d: 'M12 3a5 5 0 013.5 8.5A4.5 4.5 0 0118 16H6a4.5 4.5 0 012.5-4.5A5 5 0 0112 3z',
    },
  ],
}

/** Music note for audio */
export const music: IconDefinition = {
  name: 'Music',
  description: 'Music note for audio content',
  keywords: ['music', 'audio', 'note', 'sound', 'song', 'melody'],
  category: 'Content',
  paths: [{ d: 'M9 18V5l12-2v13' }, { d: 'M6 21a3 3 0 100-6 3 3 0 000 6z' }, { d: 'M18 19a3 3 0 100-6 3 3 0 000 6z' }],
}

/** Picture frame for images */
export const image: IconDefinition = {
  name: 'Image',
  description: 'Picture frame for image content',
  keywords: ['image', 'picture', 'photo', 'gallery', 'frame'],
  category: 'Content',
  paths: [
    { d: 'M5 3h14a2 2 0 012 2v14a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2z' },
    { d: 'M8.5 10a1.5 1.5 0 100-3 1.5 1.5 0 000 3z' },
    { d: 'M21 15l-5-5L5 21' },
  ],
}

/** Film strip for movies / video */
export const film: IconDefinition = {
  name: 'Film',
  description: 'Film strip for movies and video content',
  keywords: ['film', 'movie', 'video', 'cinema', 'media', 'strip'],
  category: 'Content',
  paths: [
    {
      d: 'M19.82 2H4.18A2.18 2.18 0 002 4.18v15.64A2.18 2.18 0 004.18 22h15.64A2.18 2.18 0 0022 19.82V4.18A2.18 2.18 0 0019.82 2z',
    },
    { d: 'M7 2v20M17 2v20M2 12h20M2 7h5M2 17h5M17 17h5M17 7h5' },
  ],
}

/** Party popper for celebration */
export const partyPopper: IconDefinition = {
  name: 'Party Popper',
  description: 'Party popper for celebration and success',
  keywords: ['party', 'celebration', 'confetti', 'success', 'congratulations', 'tada'],
  category: 'UI',
  paths: [
    { d: 'M5.8 11.3L2 22l10.7-3.8' },
    { d: 'M4 3h.01M22 8h.01M15 2h.01M22 20h.01' },
    { d: 'M9.1 9.1c3.5-3.5 7.3-5 8.5-3.8 1.2 1.2-.3 5-3.8 8.5-3.5 3.5-7.3 5-8.5 3.8-1.2-1.2.3-5 3.8-8.5z' },
    { d: 'M16 5l3 3M10 2l1 4M2 10l4 1M19 14l2 3M14 19l3 2' },
  ],
}

/** Chat bubble for messages / comments */
export const messageCircle: IconDefinition = {
  name: 'Message Circle',
  description: 'Chat bubble for messages and comments',
  keywords: ['message', 'chat', 'bubble', 'comment', 'conversation', 'talk'],
  category: 'Content',
  paths: [
    {
      d: 'M21 11.5a8.38 8.38 0 01-.9 3.8 8.5 8.5 0 01-7.6 4.7 8.38 8.38 0 01-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 01-.9-3.8 8.5 8.5 0 014.7-7.6 8.38 8.38 0 013.8-.9h.5a8.48 8.48 0 018 8v.5z',
    },
  ],
}

/** Multiple images for gallery / carousel */
export const images: IconDefinition = {
  name: 'Images',
  description: 'Multiple images for gallery and carousel views',
  keywords: ['images', 'gallery', 'carousel', 'slideshow', 'photos', 'multiple'],
  category: 'Content',
  paths: [
    { d: 'M7 3h12a2 2 0 012 2v12a2 2 0 01-2 2H7a2 2 0 01-2-2V5a2 2 0 012-2z' },
    { d: 'M1 7h2v12a2 2 0 002 2h12v2' },
    { d: 'M10.5 10a1.5 1.5 0 100-3 1.5 1.5 0 000 3z' },
    { d: 'M21 13l-3-3-5 7' },
  ],
}

/** Text / typography letter for fonts */
export const type: IconDefinition = {
  name: 'Type',
  description: 'Text / typography for fonts and text formatting',
  keywords: ['type', 'text', 'font', 'typography', 'letter', 'format'],
  category: 'Content',
  paths: [{ d: 'M4 7V4h16v3' }, { d: 'M9 20h6' }, { d: 'M12 4v16' }],
}

/** Rocket for launch / deploy */
export const rocket: IconDefinition = {
  name: 'Rocket',
  description: 'Rocket for launch, deploy, and performance',
  keywords: ['rocket', 'launch', 'deploy', 'fast', 'speed', 'startup'],
  category: 'Common',
  paths: [
    {
      d: 'M4.5 16.5c-1.5 1.26-2 5-2 5s3.74-.5 5-2c.71-.84.7-2.13-.09-2.91a2.18 2.18 0 00-2.91-.09z',
    },
    {
      d: 'M12 15l-3-3a22 22 0 012-3.95A12.88 12.88 0 0122 2c0 2.72-.78 7.5-6 11.95A22 22 0 0112 15z',
    },
    { d: 'M9 12H4s.55-3.03 2-4c1.62-1.08 5 0 5 0' },
    { d: 'M12 15v5s3.03-.55 4-2c1.08-1.62 0-5 0-5' },
  ],
}

/** Alert siren for urgent notifications */
export const siren: IconDefinition = {
  name: 'Siren',
  description: 'Alert siren for urgent notifications',
  keywords: ['siren', 'alert', 'urgent', 'emergency', 'alarm', 'police'],
  category: 'Status',
  paths: [
    { d: 'M7 18v-6a5 5 0 0110 0v6' },
    { d: 'M5 21h14' },
    { d: 'M5 18h14' },
    { d: 'M12 2v2' },
    { d: 'M3.5 7l1.5 1' },
    { d: 'M19 8l1.5-1' },
  ],
}

/** Light bulb for ideas / tips */
export const lightbulb: IconDefinition = {
  name: 'Light Bulb',
  description: 'Light bulb for ideas and tips',
  keywords: ['lightbulb', 'idea', 'tip', 'innovation', 'bright', 'think'],
  category: 'Common',
  paths: [
    {
      d: 'M9 18h6M10 22h4',
    },
    {
      d: 'M12 2a7 7 0 00-4 12.7V17h8v-2.3A7 7 0 0012 2z',
    },
  ],
}

/** Flag for milestones / reporting */
export const flag: IconDefinition = {
  name: 'Flag',
  description: 'Flag for milestones, reporting, and marking',
  keywords: ['flag', 'milestone', 'report', 'mark', 'finish'],
  category: 'UI',
  paths: [{ d: 'M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z' }, { d: 'M4 22v-7' }],
}

/** Dollar sign for money / pricing */
export const dollarSign: IconDefinition = {
  name: 'Dollar Sign',
  description: 'Dollar sign for money, pricing, and finance',
  keywords: ['dollar', 'money', 'price', 'currency', 'finance', 'cost'],
  category: 'Content',
  paths: [{ d: 'M12 1v22' }, { d: 'M17 5H9.5a3.5 3.5 0 100 7h5a3.5 3.5 0 010 7H6' }],
}

/** Bidirectional horizontal arrow for exchange / compare */
export const arrowLeftRight: IconDefinition = {
  name: 'Arrow Left Right',
  description: 'Bidirectional horizontal arrow for exchange and comparison',
  keywords: ['arrow', 'left-right', 'exchange', 'swap', 'compare', 'bidirectional'],
  category: 'Navigation',
  paths: [{ d: 'M21 7H3M18 4l3 3-3 3' }, { d: 'M3 17h18M6 14l-3 3 3 3' }],
}

/** Magic wand for transformations */
export const wand: IconDefinition = {
  name: 'Wand',
  description: 'Magic wand for transformations and effects',
  keywords: ['wand', 'magic', 'transform', 'effect', 'auto', 'wizard'],
  category: 'Actions',
  paths: [
    { d: 'M15 4V2M15 16v-2M8 9h2M20 9h2M17.8 11.8L19 13M17.8 6.2L19 5M12.2 11.8L11 13M12.2 6.2L11 5' },
    { d: 'M15 9a2 2 0 100-4 2 2 0 000 4z' },
    { d: 'M6 21l9-9' },
  ],
}

/** Game controller for gaming */
export const gamepad: IconDefinition = {
  name: 'Gamepad',
  description: 'Game controller for gaming contexts',
  keywords: ['gamepad', 'controller', 'game', 'gaming', 'joystick', 'play'],
  category: 'Content',
  paths: [
    {
      d: 'M6 11h4M8 9v4',
    },
    { d: 'M15 12h.01M18 10h.01' },
    {
      d: 'M17.32 5H6.68a4 4 0 00-3.978 3.59c-.006.052-.01.101-.017.152C2.604 9.416 2 14.456 2 16a3 3 0 003 3c1 0 1.5-.5 2-1l1.414-1.414A2 2 0 019.828 16h4.344a2 2 0 011.414.586L17 18c.5.5 1 1 2 1a3 3 0 003-3c0-1.544-.604-6.584-.685-7.258-.007-.05-.011-.1-.017-.152A4 4 0 0017.32 5z',
    },
  ],
}

/** Code brackets for programming */
export const code: IconDefinition = {
  name: 'Code',
  description: 'Code brackets for programming and development',
  keywords: ['code', 'programming', 'development', 'brackets', 'developer', 'source'],
  category: 'Content',
  paths: [{ d: 'M16 18l6-6-6-6' }, { d: 'M8 6l-6 6 6 6' }],
}

/** Puzzle piece for extensions / plugins */
export const puzzle: IconDefinition = {
  name: 'Puzzle',
  description: 'Puzzle piece for extensions and plugins',
  keywords: ['puzzle', 'extension', 'plugin', 'module', 'piece', 'addon'],
  category: 'Content',
  paths: [
    {
      d: 'M19.439 7.85c-.049.322.059.648.289.878l1.568 1.568c.47.47.706 1.087.706 1.704s-.235 1.233-.706 1.704l-1.611 1.611a.98.98 0 01-.837.276c-.47-.07-.802-.48-.968-.925a2.501 2.501 0 10-3.214 3.214c.446.166.855.497.925.968a.979.979 0 01-.276.837l-1.61 1.61a2.404 2.404 0 01-1.705.707 2.402 2.402 0 01-1.704-.706l-1.568-1.568a1.026 1.026 0 00-.877-.29c-.493.074-.84.504-1.02.968a2.5 2.5 0 11-3.237-3.237c.464-.18.894-.527.967-1.02a1.026 1.026 0 00-.289-.877l-1.568-1.568A2.402 2.402 0 011.998 12c0-.617.236-1.234.706-1.704L4.315 8.685a.98.98 0 01.837-.276c.47.07.802.48.968.925a2.501 2.501 0 103.214-3.214c-.446-.166-.855-.497-.925-.968a.979.979 0 01.276-.837l1.61-1.61a2.404 2.404 0 011.705-.707c.618 0 1.234.236 1.704.706l1.568 1.568c.23.23.556.338.877.29.493-.074.84-.504 1.02-.969a2.5 2.5 0 113.237 3.237c-.464.18-.894.527-.967 1.02z',
    },
  ],
}

/** Ruler for layout / measurement */
export const ruler: IconDefinition = {
  name: 'Ruler',
  description: 'Ruler for layout and measurement',
  keywords: ['ruler', 'measure', 'layout', 'size', 'dimension', 'scale'],
  category: 'Content',
  paths: [
    {
      d: 'M21.174 6.812a1 1 0 00-3.986-3.987L3.842 16.174a2 2 0 000 2.83l1.153 1.154a2 2 0 002.83 0L21.174 6.812z',
    },
    { d: 'M15 5l1 1M12 8l1 1M9 11l1 1M6 14l1 1' },
  ],
}

/** Application window frame */
export const appWindow: IconDefinition = {
  name: 'App Window',
  description: 'Application window frame for UI elements',
  keywords: ['window', 'app', 'application', 'frame', 'browser', 'panel'],
  category: 'UI',
  paths: [
    { d: 'M4 2h16a2 2 0 012 2v16a2 2 0 01-2 2H4a2 2 0 01-2-2V4a2 2 0 012-2z' },
    { d: 'M2 8h20' },
    { d: 'M6 5h.01M9 5h.01' },
  ],
}

/** Electrical plug for connections / integrations */
export const plug: IconDefinition = {
  name: 'Plug',
  description: 'Electrical plug for connections and integrations',
  keywords: ['plug', 'connection', 'integration', 'power', 'socket', 'connect'],
  category: 'Content',
  paths: [{ d: 'M12 22v-5' }, { d: 'M9 8V2M15 8V2' }, { d: 'M18 8v5a6 6 0 01-12 0V8z' }],
}

/** Wrench for tools / maintenance */
export const wrench: IconDefinition = {
  name: 'Wrench',
  description: 'Wrench for tools and maintenance',
  keywords: ['wrench', 'tool', 'fix', 'repair', 'maintenance', 'spanner'],
  category: 'Actions',
  paths: [
    {
      d: 'M14.7 6.3a1 1 0 000 1.4l1.6 1.6a1 1 0 001.4 0l3.77-3.77a6 6 0 01-7.94 7.94l-6.91 6.91a2.12 2.12 0 01-3-3l6.91-6.91a6 6 0 017.94-7.94l-3.76 3.76z',
    },
  ],
}

/** Compass for exploration / navigation */
export const compass: IconDefinition = {
  name: 'Compass',
  description: 'Compass for exploration and navigation',
  keywords: ['compass', 'explore', 'navigate', 'direction', 'discover', 'orientation'],
  category: 'Navigation',
  paths: [
    { d: 'M12 2a10 10 0 100 20 10 10 0 000-20z' },
    { d: 'M16.24 7.76l-2.12 6.36-6.36 2.12 2.12-6.36 6.36-2.12z' },
  ],
}
