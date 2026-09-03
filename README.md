# MEAM Collection Manager - GraphQL API

A token-efficient museum collection management system using **GraphQL** to optimize data queries and reduce token usage by only fetching the specific data needed.

## Features

- ✅ **GraphQL API** - Efficient data fetching with specific queries
- ✅ **Inventory Management** - Add, edit, search, and delete artworks
- ✅ **Collection Statistics** - Real-time inventory summary
- ✅ **Search Functionality** - Server-side search for better performance
- ✅ **Persistent Storage** - JSON-based database
- ✅ **Responsive UI** - Works on desktop and mobile devices

## Architecture

### Backend
- **GraphQL Server**: Apollo Server + Express
- **Database**: JSON file-based storage
- **Port**: 3000

### Frontend
- **Client**: Modern JavaScript with ES modules
- **GraphQL Client**: Custom implementation for efficient queries
- **UI Framework**: Vanilla CSS with modern design

## Why GraphQL?

Instead of re-reading entire datasets or files on each Claude interaction, GraphQL queries allow:
1. **Targeted Data Fetching** - Only request what you need
2. **Reduced Token Usage** - Smaller payloads mean fewer tokens
3. **Better Performance** - Server-side filtering and searching
4. **Type Safety** - Schema validation for data integrity

## Setup

### Installation

```bash
npm install
```

### Start the Server

```bash
npm start
```

Development mode with auto-reload:
```bash
npm run dev
```

Server will start at `http://localhost:3000`

### Access the Application

- **Web UI**: http://localhost:3000
- **GraphQL Playground**: http://localhost:3000/graphql

## GraphQL Schema

### Types

```graphql
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
```

### Queries

```graphql
# Get all artworks
query {
  artworks {
    id
    title
    artist
  }
}

# Get inventory statistics
query {
  stats {
    total
    display
    storage
    restoration
  }
}

# Search artworks
query {
  searchArtworks(query: "Picasso") {
    id
    title
    artist
  }
}

# Get specific artwork
query {
  artwork(id: "12345") {
    id
    title
    artist
    notes
  }
}
```

### Mutations

```graphql
# Add artwork
mutation {
  addArtwork(
    title: "Guernica"
    artist: "Pablo Picasso"
    year: 1937
    category: "Pintura"
    status: "En exhibición"
    location: "Sala 1"
    notes: "Oil on canvas"
  ) {
    id
    title
  }
}

# Delete artwork
mutation {
  deleteArtwork(id: "12345")
}
```

## File Structure

```
appmeam/
├── server.js                 # Express + Apollo Server setup
├── schema.js                 # GraphQL schema definitions
├── resolvers.js              # GraphQL resolver functions
├── database.js               # Database operations
├── package.json              # Dependencies
├── data.json                 # Artwork database (auto-created)
├── public/
│   ├── index.html           # Main HTML page
│   ├── app.js               # Application logic
│   ├── graphql-client.js    # GraphQL query client
│   └── styles.css           # Styling
└── README.md                # This file
```

## Database

The application uses a JSON-based file database (`data.json`) that stores all artworks. The database is:
- **Persistent** - Data survives server restarts
- **Atomic** - Changes are written immediately
- **Simple** - Easy to inspect and backup

## API Endpoints

- `GET /` - Serve the web UI
- `POST /graphql` - GraphQL queries and mutations
- `GET /api/health` - Health check endpoint

## Token Optimization

When Claude needs to work with collection data, instead of:
```
❌ Reading the entire artworks database file (large token cost)
❌ Re-fetching all data each time
```

It can now:
```
✅ Query only the fields needed
✅ Use server-side search
✅ Get stats without detailed artwork data
✅ Minimal payload sizes = fewer tokens
```

### Example: Getting Stats Only

```javascript
// Costs far fewer tokens than reading the entire database
const stats = await graphql.getStats();
```

## Development

### Adding New Features

1. Update the GraphQL schema in `schema.js`
2. Implement resolvers in `resolvers.js`
3. Add database functions in `database.js`
4. Update frontend queries in `graphql-client.js`

### Testing Queries

Use the GraphQL Playground at http://localhost:3000/graphql to test queries before implementing them in the frontend.

## License

© 2026 MEAM Museum
