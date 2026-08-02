// Size budget for before/after photos attached to a recovery story.
//
// Story images live inside the story's own Firestore document (unlike timeline
// photos, which get a document each), so two of them plus the story text have
// to fit under Firestore's 1MB per-document limit. 380k characters each leaves
// comfortable room for a long story.
//
// Shared by the client (which compresses down to this) and the API route
// (which enforces it) — so no server-only or client-only imports here.

export const STORY_IMAGE_MAX_CHARS = 380_000;
