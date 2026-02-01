// Shared Google Maps configuration to prevent multiple loaders with different options
export const GOOGLE_MAPS_CONFIG = {
  id: "google-map-script",
  googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || "",
  libraries: ["places"] as ("places" | "drawing" | "geometry" | "visualization")[],
}
