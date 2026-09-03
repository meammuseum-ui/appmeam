/**
 * GraphQL Client for MEAM Collection Manager
 * Provides optimized queries to reduce token usage by only fetching needed data
 */

const API_URL = '/graphql';

class GraphQLClient {
  async query(query, variables = {}) {
    try {
      const response = await fetch(API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ query, variables }),
      });

      const data = await response.json();

      if (data.errors) {
        console.error('GraphQL Error:', data.errors);
        throw new Error(data.errors[0].message);
      }

      return data.data;
    } catch (error) {
      console.error('Query failed:', error);
      throw error;
    }
  }

  // Query for all artworks (minimal data)
  async getArtworks() {
    const query = `
      query {
        artworks {
          id
          title
          artist
          year
          category
          status
          location
        }
      }
    `;
    const result = await this.query(query);
    return result.artworks;
  }

  // Query for inventory statistics only
  async getStats() {
    const query = `
      query {
        stats {
          total
          display
          storage
          restoration
        }
      }
    `;
    const result = await this.query(query);
    return result.stats;
  }

  // Search artworks (efficient filtering on server side)
  async searchArtworks(searchQuery) {
    const query = `
      query SearchArtworks($query: String!) {
        searchArtworks(query: $query) {
          id
          title
          artist
          year
          category
          status
          location
        }
      }
    `;
    const result = await this.query(query, { query: searchQuery });
    return result.searchArtworks;
  }

  // Get single artwork by ID
  async getArtwork(id) {
    const query = `
      query GetArtwork($id: ID!) {
        artwork(id: $id) {
          id
          title
          artist
          year
          category
          status
          location
          notes
        }
      }
    `;
    const result = await this.query(query, { id });
    return result.artwork;
  }

  // Add new artwork
  async addArtwork(artwork) {
    const query = `
      mutation AddArtwork(
        $title: String!
        $artist: String!
        $year: Int!
        $category: String!
        $status: String!
        $location: String!
        $notes: String
      ) {
        addArtwork(
          title: $title
          artist: $artist
          year: $year
          category: $category
          status: $status
          location: $location
          notes: $notes
        ) {
          id
          title
          artist
          year
          category
          status
          location
        }
      }
    `;
    const result = await this.query(query, artwork);
    return result.addArtwork;
  }

  // Update artwork
  async updateArtwork(id, updates) {
    const query = `
      mutation UpdateArtwork(
        $id: ID!
        $title: String
        $artist: String
        $year: Int
        $category: String
        $status: String
        $location: String
        $notes: String
      ) {
        updateArtwork(
          id: $id
          title: $title
          artist: $artist
          year: $year
          category: $category
          status: $status
          location: $location
          notes: $notes
        ) {
          id
          title
          artist
          year
          category
          status
          location
        }
      }
    `;
    const result = await this.query(query, { id, ...updates });
    return result.updateArtwork;
  }

  // Delete artwork
  async deleteArtwork(id) {
    const query = `
      mutation DeleteArtwork($id: ID!) {
        deleteArtwork(id: $id)
      }
    `;
    const result = await this.query(query, { id });
    return result.deleteArtwork;
  }
}

export const graphql = new GraphQLClient();
