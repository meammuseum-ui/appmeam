import { graphql } from './graphql-client.js';

// DOM Elements
const artworkForm = document.getElementById('artifact-form');
const searchInput = document.getElementById('search');
const inventoryBody = document.getElementById('inventory-body');
const rowTemplate = document.getElementById('row-template');
const statElements = {
  total: document.getElementById('stat-total'),
  display: document.getElementById('stat-display'),
  storage: document.getElementById('stat-storage'),
  restoration: document.getElementById('stat-restoration'),
};

let currentArtworks = [];

// Initialize
async function init() {
  await loadStats();
  await loadArtworks();
  setupEventListeners();
}

// Load and display statistics
async function loadStats() {
  try {
    const stats = await graphql.getStats();
    statElements.total.textContent = stats.total;
    statElements.display.textContent = stats.display;
    statElements.storage.textContent = stats.storage;
    statElements.restoration.textContent = stats.restoration;
  } catch (error) {
    console.error('Failed to load stats:', error);
  }
}

// Load and display artworks
async function loadArtworks() {
  try {
    currentArtworks = await graphql.getArtworks();
    renderArtworks(currentArtworks);
  } catch (error) {
    console.error('Failed to load artworks:', error);
  }
}

// Render artworks in table
function renderArtworks(artworks) {
  inventoryBody.innerHTML = '';

  if (artworks.length === 0) {
    const row = document.createElement('tr');
    row.innerHTML = '<td colspan="7" style="text-align: center; padding: 20px;">No hay obras en la colección</td>';
    inventoryBody.appendChild(row);
    return;
  }

  artworks.forEach(artwork => {
    const row = rowTemplate.content.cloneNode(true);

    // Fill in data
    row.querySelector('[data-col="title"]').textContent = artwork.title;
    row.querySelector('[data-col="artist"]').textContent = artwork.artist;
    row.querySelector('[data-col="year"]').textContent = artwork.year;
    row.querySelector('[data-col="category"]').textContent = artwork.category;
    row.querySelector('[data-col="status"]').textContent = artwork.status;
    row.querySelector('[data-col="location"]').textContent = artwork.location;

    // Setup delete button
    const deleteBtn = row.querySelector('[data-action="delete"]');
    deleteBtn.addEventListener('click', () => handleDelete(artwork.id));

    inventoryBody.appendChild(row);
  });
}

// Handle form submission
artworkForm.addEventListener('submit', async (e) => {
  e.preventDefault();

  const formData = new FormData(artworkForm);
  const artwork = {
    title: formData.get('title'),
    artist: formData.get('artist'),
    year: parseInt(formData.get('year')),
    category: formData.get('category'),
    status: formData.get('status'),
    location: formData.get('location'),
    notes: formData.get('notes'),
  };

  try {
    const newArtwork = await graphql.addArtwork(artwork);
    currentArtworks.push(newArtwork);
    renderArtworks(currentArtworks);
    await loadStats();
    artworkForm.reset();
  } catch (error) {
    console.error('Failed to add artwork:', error);
    alert('Error al guardar la obra');
  }
});

// Handle search
let searchTimeout;
searchInput.addEventListener('input', async (e) => {
  clearTimeout(searchTimeout);
  const query = e.target.value.trim();

  if (!query) {
    renderArtworks(currentArtworks);
    return;
  }

  searchTimeout = setTimeout(async () => {
    try {
      const results = await graphql.searchArtworks(query);
      renderArtworks(results);
    } catch (error) {
      console.error('Search failed:', error);
    }
  }, 300);
});

// Handle delete
async function handleDelete(id) {
  if (!confirm('¿Estás seguro de que deseas eliminar esta obra?')) {
    return;
  }

  try {
    await graphql.deleteArtwork(id);
    currentArtworks = currentArtworks.filter(a => a.id !== id);
    renderArtworks(currentArtworks);
    await loadStats();
  } catch (error) {
    console.error('Failed to delete artwork:', error);
    alert('Error al eliminar la obra');
  }
}

// Setup event listeners
function setupEventListeners() {
  // Search on input
  searchInput.addEventListener('input', async (e) => {
    const query = e.target.value.trim();
    if (query) {
      try {
        const results = await graphql.searchArtworks(query);
        renderArtworks(results);
      } catch (error) {
        console.error('Search failed:', error);
      }
    } else {
      renderArtworks(currentArtworks);
    }
  });
}

// Start the application
init();
