import { gql } from 'apollo-server-express';

export const typeDefs = gql`
  type Artwork {
    id: ID!
    title: String!
    artist: String!
    year: Int!
    category: String!
    status: String!
    location: String!
    notes: String
  }

  type InventoryStats {
    total: Int!
    display: Int!
    storage: Int!
    restoration: Int!
  }

  type Query {
    artworks: [Artwork!]!
    artwork(id: ID!): Artwork
    stats: InventoryStats!
    searchArtworks(query: String!): [Artwork!]!
  }

  type Mutation {
    addArtwork(
      title: String!
      artist: String!
      year: Int!
      category: String!
      status: String!
      location: String!
      notes: String
    ): Artwork!

    updateArtwork(
      id: ID!
      title: String
      artist: String
      year: Int
      category: String
      status: String
      location: String
      notes: String
    ): Artwork

    deleteArtwork(id: ID!): Boolean!
  }
`;
