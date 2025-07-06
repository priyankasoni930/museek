const NAPSTER_API_KEY = "";
const NAPSTER_BASE_URL = "https://api.napster.com/v2.2";
const LOCAL_BASE_URL = "http://localhost:3000";
const SAAVN_BASE_URL = "";
const JIOSAAVAN_API_URL = "";

export const api = {
  API_KEY: NAPSTER_API_KEY,

  async getTopTracks() {
    const response = await fetch(
      `${NAPSTER_BASE_URL}/tracks/top?apikey=${NAPSTER_API_KEY}&limit=20`
    );
    const data = await response.json();
    return data.tracks;
  },

  async searchTracks(query: string, page: number = 1, limit: number = 20) {
    console.log(
      "Searching tracks with query:",
      query,
      "page:",
      page,
      "limit:",
      limit
    );
    const response = await fetch(
      `${JIOSAAVAN_API_URL}/api/search/songs?query=${encodeURIComponent(
        query
      )}&page=${page}&limit=${limit}`
    );
    const data = await response.json();

    if (!data.success) {
      console.error("Search failed:", data);
      return [];
    }

    // Transform response to match our app's expected format
    return data.data.results.map((track: any) => ({
      id: track.id,
      name: track.name,
      artistName: track.artists.primary[0]?.name || "Unknown Artist",
      albumId: track.album?.id,
      previewURL: track.downloadUrl[track.downloadUrl.length - 1]?.url,
      downloadUrl: track.downloadUrl[track.downloadUrl.length - 1]?.url,
      imageUrl: track.image[track.image.length - 1]?.url,
      year: track.year,
      duration: track.duration,
      language: track.language,
      label: track.label,
      copyright: track.copyright,
      hasLyrics: track.hasLyrics,
      playCount: track.playCount,
      url: track.url,
    }));
  },

  async getTrendingTracks() {
    try {
      console.log("Fetching trending tracks...");
      const response = await fetch(
        `${JIOSAAVAN_API_URL}/api/search/songs?query=english%20trending%20songs&limit=20`
      );
      const data = await response.json();

      if (!data.success) {
        console.error("Trending search failed:", data);
        return [];
      }

      return data.data.results.map((track: any) => ({
        id: track.id,
        name: track.name,
        artistName: track.artists.primary[0]?.name || "Unknown Artist",
        albumId: track.album?.id,
        previewURL: track.downloadUrl[track.downloadUrl.length - 1]?.url,
        downloadUrl: track.downloadUrl[track.downloadUrl.length - 1]?.url,
        imageUrl: track.image[track.image.length - 1]?.url,
        year: track.year,
        duration: track.duration,
        language: track.language,
        label: track.label,
        copyright: track.copyright,
        hasLyrics: track.hasLyrics,
        playCount: track.playCount,
        url: track.url,
      }));
    } catch (error) {
      console.error("Error getting trending tracks:", error);
      return [];
    }
  },

  async getNewReleases() {
    try {
      console.log("Fetching new releases...");
      const response = await fetch(
        `${JIOSAAVAN_API_URL}/api/search/songs?query=english%20new%20songs%202024&limit=20`
      );
      const data = await response.json();

      if (!data.success) {
        console.error("New releases search failed:", data);
        return [];
      }

      return data.data.results.map((track: any) => ({
        id: track.id,
        name: track.name,
        artistName: track.artists.primary[0]?.name || "Unknown Artist",
        albumId: track.album?.id,
        previewURL: track.downloadUrl[track.downloadUrl.length - 1]?.url,
        downloadUrl: track.downloadUrl[track.downloadUrl.length - 1]?.url,
        imageUrl: track.image[track.image.length - 1]?.url,
        year: track.year,
        duration: track.duration,
        language: track.language,
        label: track.label,
        copyright: track.copyright,
        hasLyrics: track.hasLyrics,
        playCount: track.playCount,
        url: track.url,
      }));
    } catch (error) {
      console.error("Error getting new releases:", error);
      return [];
    }
  },

  async getLyrics(songId: string) {
    try {
      console.log("Fetching lyrics for song:", songId);
      const response = await fetch(`${SAAVN_BASE_URL}/songs/${songId}/lyrics`);

      // Clone the response before reading it
      const responseClone = response.clone();

      try {
        const data = await response.json();
        if (!response.ok) {
          console.error("Failed to fetch lyrics:", data);
          return null;
        }
        return data.data.lyrics;
      } catch (error) {
        // If the first attempt fails, try with the cloned response
        console.log("Retrying with cloned response...");
        const data = await responseClone.json();
        if (!response.ok) {
          console.error("Failed to fetch lyrics (retry):", data);
          return null;
        }
        return data.data.lyrics;
      }
    } catch (error) {
      console.error("Error fetching lyrics:", error);
      return null;
    }
  },
};

// Utility functions for managing recently played data
export const recentlyPlayedUtils = {
  saveToSearchRecentlyPlayed(track: any) {
    const existing = this.getSearchRecentlyPlayed();
    const updated = [track, ...existing.filter((t) => t.id !== track.id)].slice(
      0,
      10
    );
    localStorage.setItem("searchRecentlyPlayed", JSON.stringify(updated));
  },

  saveToHomeRecentlyPlayed(track: any) {
    const existing = this.getHomeRecentlyPlayed();
    const updated = [track, ...existing.filter((t) => t.id !== track.id)].slice(
      0,
      10
    );
    localStorage.setItem("homeRecentlyPlayed", JSON.stringify(updated));
  },

  getSearchRecentlyPlayed() {
    const saved = localStorage.getItem("searchRecentlyPlayed");
    return saved ? JSON.parse(saved) : [];
  },

  getHomeRecentlyPlayed() {
    const saved = localStorage.getItem("homeRecentlyPlayed");
    return saved ? JSON.parse(saved) : [];
  },

  removeFromSearchRecentlyPlayed(trackId: string) {
    const existing = this.getSearchRecentlyPlayed();
    const updated = existing.filter((t: any) => t.id !== trackId);
    localStorage.setItem("searchRecentlyPlayed", JSON.stringify(updated));
    return updated;
  },

  removeFromHomeRecentlyPlayed(trackId: string) {
    const existing = this.getHomeRecentlyPlayed();
    const updated = existing.filter((t: any) => t.id !== trackId);
    localStorage.setItem("homeRecentlyPlayed", JSON.stringify(updated));
    return updated;
  },
};
