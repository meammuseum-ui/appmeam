import * as db from './database.js';

export const resolvers = {
  Query: {
    artworks: () => db.getArtworks(),
    artwork: (_, { id }) => db.getArtwork(id),
    stats: () => db.getStats(),
    searchArtworks: (_, { query }) => db.searchArtworks(query),
  },

  Mutation: {
    addArtwork: async (_, input) => {
      return await db.addArtwork(input);
    },

    updateArtwork: async (_, { id, ...updates }) => {
      return await db.updateArtwork(id, updates);
    },

    deleteArtwork: async (_, { id }) => {
      return await db.deleteArtwork(id);
    },
  },
};
