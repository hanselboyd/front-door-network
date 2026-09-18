import type { Film, Creator } from "@prisma/client";

type FilmWithCreator = Film & { creator: Creator | null };

export function toRokuItem(film: FilmWithCreator) {
  return {
    id: film.id,
    slug: film.slug,
    title: film.title,
    shortDescription: film.synopsis,
    releaseYear: film.releaseYear,
    duration: film.runtimeSeconds,
    rating: film.rating,
    poster: film.posterUrl,
    hero: film.landscapeUrl,
    streamUrl: film.bunnyPlaybackUrl,
    captionsUrl: film.captionsUrl,
    creator: film.creator ? { name: film.creator.name, slug: film.creator.slug } : null,
    aiTools: film.aiTools,
    acnFilmId: film.acnFilmId,
  };
}
