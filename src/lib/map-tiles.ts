// Basemap tile provider for the restaurant map.
//
// Keys come from env (public — tile keys are designed to ship to the browser
// and should be locked to the site's domain in the provider's dashboard).
// Order of preference: MapTiler → Stadia → CARTO. With no key configured the
// map falls back to the standard OpenStreetMap tiles, darkened with a CSS
// filter so they sit in the dark UI. Every provider carries its own required
// attribution.

export interface TileProvider {
  id: "maptiler" | "stadia" | "carto" | "osm";
  url: (z: number, x: number, y: number, retina: boolean) => string;
  attribution: string;
  /** CSS filter applied to the tiles (used to darken light OSM tiles). */
  filter?: string;
}

const MAPTILER_KEY = process.env.NEXT_PUBLIC_MAPTILER_KEY;
const STADIA_KEY = process.env.NEXT_PUBLIC_STADIA_API_KEY;
const CARTO_KEY = process.env.NEXT_PUBLIC_CARTO_API_KEY;

export function tileProvider(): TileProvider {
  if (MAPTILER_KEY) {
    return {
      id: "maptiler",
      url: (z, x, y, retina) =>
        `https://api.maptiler.com/maps/dataviz-dark/256/${z}/${x}/${y}${retina ? "@2x" : ""}.png?key=${MAPTILER_KEY}`,
      attribution: "© MapTiler © OpenStreetMap contributors",
    };
  }
  if (STADIA_KEY) {
    return {
      id: "stadia",
      url: (z, x, y, retina) =>
        `https://tiles.stadiamaps.com/tiles/alidade_smooth_dark/${z}/${x}/${y}${retina ? "@2x" : ""}.png?api_key=${STADIA_KEY}`,
      attribution: "© Stadia Maps © OpenMapTiles © OpenStreetMap contributors",
    };
  }
  if (CARTO_KEY) {
    return {
      id: "carto",
      url: (z, x, y, retina) => {
        const sub = "abcd"[Math.abs(x + y) % 4];
        return `https://${sub}.basemaps.cartocdn.com/dark_all/${z}/${x}/${y}${retina ? "@2x" : ""}.png?api_key=${CARTO_KEY}`;
      },
      attribution: "© OpenStreetMap contributors © CARTO",
    };
  }
  return {
    id: "osm",
    url: (z, x, y) => `https://tile.openstreetmap.org/${z}/${x}/${y}.png`,
    attribution: "© OpenStreetMap contributors",
    filter: "invert(1) hue-rotate(180deg) brightness(0.82) contrast(0.9) saturate(0.4)",
  };
}
