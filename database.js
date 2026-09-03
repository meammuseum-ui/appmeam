import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const dbPath = path.join(__dirname, 'data.json');

// Initialize with empty database if it doesn't exist
let db = { artworks: [] };

// Load database from file
export async function loadDatabase() {
  try {
    const data = await fs.readFile(dbPath, 'utf-8');
    db = JSON.parse(data);
  } catch (error) {
    // Create new database if file doesn't exist
    await saveDatabase();
  }
  return db;
}

// Save database to file
export async function saveDatabase() {
  await fs.writeFile(dbPath, JSON.stringify(db, null, 2));
}

// Generate unique ID
function generateId() {
  return Date.now().toString(36) + Math.random().toString(36).substr(2);
}

// Get all artworks
export function getArtworks() {
  return db.artworks;
}

// Get artwork by ID
export function getArtwork(id) {
  return db.artworks.find(artwork => artwork.id === id);
}

// Get inventory stats
export function getStats() {
  const total = db.artworks.length;
  const display = db.artworks.filter(a => a.status === 'En exhibición').length;
  const storage = db.artworks.filter(a => a.status === 'En almacén').length;
  const restoration = db.artworks.filter(a => a.status === 'Restauración').length;

  return { total, display, storage, restoration };
}

// Search artworks
export function searchArtworks(query) {
  const q = query.toLowerCase();
  return db.artworks.filter(artwork =>
    artwork.title.toLowerCase().includes(q) ||
    artwork.artist.toLowerCase().includes(q)
  );
}

// Add artwork
export async function addArtwork(input) {
  const newArtwork = {
    id: generateId(),
    ...input
  };
  db.artworks.push(newArtwork);
  await saveDatabase();
  return newArtwork;
}

// Update artwork
export async function updateArtwork(id, updates) {
  const artwork = db.artworks.find(a => a.id === id);
  if (!artwork) return null;

  const updated = { ...artwork, ...updates };
  const index = db.artworks.findIndex(a => a.id === id);
  db.artworks[index] = updated;
  await saveDatabase();
  return updated;
}

// Delete artwork
export async function deleteArtwork(id) {
  const index = db.artworks.findIndex(a => a.id === id);
  if (index === -1) return false;

  db.artworks.splice(index, 1);
  await saveDatabase();
  return true;
}
