// Heroicons ES modules raw imports
import envelope from 'heroicons/24/outline/envelope.svg?raw';
import arrowPath from 'heroicons/24/outline/arrow-path.svg?raw';
import arrowsPointingOut from 'heroicons/24/outline/arrows-pointing-out.svg?raw';
import cursorArrowRays from 'heroicons/24/outline/cursor-arrow-rays.svg?raw';
import magnifyingGlass from 'heroicons/24/outline/magnifying-glass.svg?raw';
import globeAlt from 'heroicons/24/outline/globe-alt.svg?raw';
import camera from 'heroicons/24/outline/camera.svg?raw';
import mapPin from 'heroicons/24/outline/map-pin.svg?raw';
import paperAirplane from 'heroicons/24/outline/paper-airplane.svg?raw';
import buildingLibrary from 'heroicons/24/outline/building-library.svg?raw';
import briefcase from 'heroicons/24/outline/briefcase.svg?raw';
import chevronUp from 'heroicons/24/outline/chevron-up.svg?raw';
import chevronDown from 'heroicons/24/outline/chevron-down.svg?raw';
import chevronLeft from 'heroicons/24/outline/chevron-left.svg?raw';
import chevronRight from 'heroicons/24/outline/chevron-right.svg?raw';
import bars3 from 'heroicons/24/outline/bars-3.svg?raw';
import sparkles from 'heroicons/24/outline/sparkles.svg?raw';
import bolt from 'heroicons/24/outline/bolt.svg?raw';
import clock from 'heroicons/24/outline/clock.svg?raw';
import swatch from 'heroicons/24/outline/swatch.svg?raw';
import questionMarkCircle from 'heroicons/24/outline/question-mark-circle.svg?raw';

// Map icon names used in the app to imported Heroicon SVGs
const heroiconsRegistry = {
    Mail: envelope,
    RefreshCw: arrowPath,
    Maximize: arrowsPointingOut,
    Mouse: cursorArrowRays,
    Search: magnifyingGlass,
    Globe: globeAlt,
    Camera: camera,
    MapPin: mapPin,
    Plane: paperAirplane,
    Landmark: buildingLibrary,
    Briefcase: briefcase,
    ChevronUp: chevronUp,
    ChevronDown: chevronDown,
    ChevronLeft: chevronLeft,
    ChevronRight: chevronRight,
    Menu: bars3,
    Sparkles: sparkles,
    Zap: bolt,
    Clock: clock,
    Palette: swatch,
    Help: questionMarkCircle
};

/**
 * Returns the HTML string of the requested SVG icon.
 * @param {string} iconName The name of the icon (PascalCase, e.g. 'Mail', 'Github').
 * @param {string} classNames Additional CSS classes to add to the SVG element.
 * @returns {string} SVG HTML string
 */
export function getIcon(iconName, classNames = '') {
    const formattedName = iconName.charAt(0).toUpperCase() + iconName.slice(1);
    
    // Custom SVGs matching the Heroicons style (viewBox 0 0 24 24, stroke 1.5/2)
    if (formattedName === 'Github') {
        return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" class="h-icon h-github ${classNames}"><path d="M15 22v-4a4.8 4.8 0 0 0-1-3.5c3 0 6-2 6-5.5.08-1.25-.27-2.48-1-3.5.28-1.15.28-2.35 0-3.5 0 0-1 0-3 1.5-2.64-.5-5.36-.5-8 0C6 2 5 2 5 2c-.3 1.15-.3 2.35 0 3.5A5.403 5.403 0 0 0 4 9c0 3.5 3 5.5 6 5.5-.39.49-.68 1.05-.85 1.65-.17.6-.22 1.23-.15 1.85v4"/><path d="M9 18c-4.51 2-5-2-7-2"/></svg>`;
    }
    if (formattedName === 'Linkedin') {
        return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" class="h-icon h-linkedin ${classNames}"><path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z"/><rect width="4" height="12" x="2" y="9"/><circle cx="4" cy="4" r="2"/></svg>`;
    }
    if (formattedName === 'Palmtree') {
        return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" class="h-icon h-palmtree ${classNames}"><path d="M13 8c0-2.76-2.24-5-5-5S3 5.24 3 8s2.24 5 5 5c1.38 0 2.63-.56 3.54-1.46M12 12v9m1-9 2-2M13 15.5l3-1.5M13 18.5l2-1M6 21c0-2.76 2.24-5 5-5m-1.5-3.5L8 11.2M7.5 15.2l-1.5-1.5M7 18l-2-1"/></svg>`;
    }
    if (formattedName === 'TreePine') {
        return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" class="h-icon h-tree-pine ${classNames}"><path d="m12 2 10 10H2Z"/><path d="m12 8 8 8H4Z"/><path d="m12 14 6 6H6Z"/><path d="M12 20v2"/></svg>`;
    }
    if (formattedName === 'Rocket') {
        return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" class="h-icon h-rocket ${classNames}"><path d="M4.5 16.5c-1.5 1.26-2 3.5-2 3.5s2.24-.5 3.5-2c1.47-1.72 2-4 2-4s-2.28-.5-3.5 2.5z"/><path d="M12 15c2.4 2.4 4.5 4.5 4.5 4.5M9 12c-2.4-2.4-4.5-4.5-4.5-4.5"/><path d="M11.5 12.5c-.75-.75-1.5-1.5-2.25-2.25M17.5 6.5c-.75-.75-1.5-1.5-2.25-2.25"/><path d="m12.5 11.5 6.3-6.3c1.4-1.4 3.7-.6 4.3 1.3l.9 2.7c.3.9.1 1.9-.5 2.5l-2.4 2.4c-.6.6-1.6.8-2.5.5l-2.7-.9c-1.9-.6-2.7-2.9-1.4-4.3z"/></svg>`;
    }
    if (formattedName === 'Gamepad') {
        return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" class="h-icon h-gamepad ${classNames}"><rect width="20" height="12" x="2" y="6" rx="3"/><path d="M6 12h4M8 10v4M15 11v.01M18 13v.01"/></svg>`;
    }
    
    // Fetch SVG string from registry
    const rawSvg = heroiconsRegistry[formattedName];
    
    if (!rawSvg) {
        console.warn(`Icon "${formattedName}" not found in Heroicons registry.`);
        return '';
    }
    
    // Inject user classes and standard icon helper class into the raw SVG string
    const injectClass = `h-icon ${classNames}`.trim();
    if (rawSvg.includes('class=')) {
        return rawSvg.replace(/class="([^"]*)"/, `class="$1 ${injectClass}"`);
    } else {
        return rawSvg.replace('<svg', `<svg class="${injectClass}"`);
    }
}
