let collections = { default: [] };
let currentCollection = 'default';

function createColorSlot(color = '') {
  const slot = document.createElement('div');
  slot.className = 'color-slot';
  let hexColor = '';
  if (color) {
    const parsedColor = parseColor(color);
    hexColor = parsedColor ? rgbToHex(parsedColor.r, parsedColor.g, parsedColor.b) : '';
  }
  slot.innerHTML = `
    <div class="color-preview ${color ? '' : 'blank-swatch'}" style="background-color: ${color}"></div>
    <span class="color-value">${hexColor}</span>
    <div class="alternate-values">
      <span class="dropdown-arrow">▼</span>
      <div class="alternate-values-menu">
        <div class="rgb-value"></div>
        <div class="hsl-value"></div>
        <div class="remove-color">Remove</div>
      </div>
    </div>
  `;
  return slot;
}

function updatePalette() {
  const palette = document.querySelector('.palette');
  palette.innerHTML = '';

  if (!Array.isArray(collections[currentCollection])) {
    collections[currentCollection] = [];
  }

  collections[currentCollection].forEach(color => {
    palette.appendChild(createColorSlot(color));
  });

  // Always add a blank swatch at the end if there are no colors or the last one is not blank
  if (collections[currentCollection].length === 0 || collections[currentCollection][collections[currentCollection].length - 1] !== '') {
    palette.appendChild(createColorSlot());
  }
}

function updateCollectionName() {
  document.querySelector('.collection-name').textContent = currentCollection;
}

function showSettingsMenu(x, y) {
  const menu = document.createElement('div');
  menu.className = 'settings-menu';
  menu.innerHTML = `
    <div class="rename-collection">Rename</div>
    <div class="new-collection">New</div>
    <div class="delete-collection">Delete</div>
  `;
  menu.style.position = 'absolute';

  // Append the menu to the body first so we can get its dimensions
  document.body.appendChild(menu);

  // Calculate the position to ensure it doesn't overflow
  const menuWidth = menu.offsetWidth;
  const menuHeight = menu.offsetHeight;
  const windowWidth = window.innerWidth;
  const windowHeight = window.innerHeight;

  // Position the menu to the left of the click
  let leftPosition = x - menuWidth;
  let topPosition = y;

  // Adjust if it would go off the left edge
  if (leftPosition < 0) {
    leftPosition = 0;
  }

  // Adjust if it would go off the bottom
  if (topPosition + menuHeight > windowHeight) {
    topPosition = windowHeight - menuHeight;
  }

  menu.style.left = `${leftPosition}px`;
  menu.style.top = `${topPosition}px`;

  menu.addEventListener('click', (e) => {
    if (e.target.classList.contains('rename-collection')) {
      const newName = prompt('Enter new collection name:', currentCollection);
      if (newName && newName !== currentCollection) {
        collections[newName] = collections[currentCollection];
        delete collections[currentCollection];
        currentCollection = newName;
        updateCollectionName();
        saveCollections();
      }
    } else if (e.target.classList.contains('new-collection')) {
      const newName = prompt('Enter new collection name:');
      if (newName && !collections[newName]) {
        collections[newName] = [];
        currentCollection = newName;
        updateCollectionName();
        updatePalette();
        saveCollections();
      }
    } else if (e.target.classList.contains('delete-collection')) {
      if (Object.keys(collections).length > 1 && confirm(`Delete collection "${currentCollection}"?`)) {
        delete collections[currentCollection];
        currentCollection = Object.keys(collections)[0];
        updateCollectionName();
        updatePalette();
        saveCollections();
      }
    }
    document.body.removeChild(menu);
  });

  document.body.addEventListener('click', function removeMenu() {
    if (document.body.contains(menu)) {
      document.body.removeChild(menu);
    }
    document.body.removeEventListener('click', removeMenu);
  }, { once: true });
}

function saveCollections() {
  chrome.storage.local.set({
    collections: collections,
    currentCollection: currentCollection
  });
}

function rgbToHex(r, g, b) {
  return "#" + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1).toUpperCase();
}

function hexToRgb(hex) {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result ? {
    r: parseInt(result[1], 16),
    g: parseInt(result[2], 16),
    b: parseInt(result[3], 16)
  } : null;
}

function rgbToHsl(r, g, b) {
  r /= 255, g /= 255, b /= 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  let h, s, l = (max + min) / 2;

  if (max === min) {
    h = s = 0;
  } else {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r: h = (g - b) / d + (g < b ? 6 : 0); break;
      case g: h = (b - r) / d + 2; break;
      case b: h = (r - g) / d + 4; break;
    }
    h /= 6;
  }

  return {
    h: Math.round(h * 360),
    s: Math.round(s * 100),
    l: Math.round(l * 100)
  };
}

function parseColor(color) {
  if (color.startsWith('#')) {
    return hexToRgb(color);
  } else if (color.startsWith('rgb')) {
    const match = color.match(/rgb\((\d+),\s*(\d+),\s*(\d+)\)/);
    if (match) {
      return {
        r: parseInt(match[1]),
        g: parseInt(match[2]),
        b: parseInt(match[3])
      };
    }
  }
  return null;
}

function formatRgb(r, g, b) {
  return `rgb(${r}, ${g}, ${b})`;
}

function formatHsl(h, s, l) {
  return `hsl(${h}, ${s}%, ${l}%)`;
}

// Add this function to create the collection dropdown
function showCollectionDropdown(x, y) {
  const dropdown = document.createElement('div');
  dropdown.className = 'collection-dropdown';
  dropdown.style.position = 'absolute';
  dropdown.style.left = `${x}px`;
  dropdown.style.top = `${y}px`;
  dropdown.style.backgroundColor = 'white';
  dropdown.style.border = '1px solid #ccc';
  dropdown.style.borderRadius = '4px';
  dropdown.style.boxShadow = '0 2px 5px rgba(0,0,0,0.2)';
  dropdown.style.zIndex = '1000';

  Object.keys(collections).forEach(collectionName => {
    const item = document.createElement('div');
    item.textContent = collectionName;
    item.style.padding = '5px 10px';
    item.style.cursor = 'pointer';
    item.addEventListener('click', () => {
      currentCollection = collectionName;
      updateCollectionName();
      updatePalette();
      saveCollections();
      document.body.removeChild(dropdown);
    });
    dropdown.appendChild(item);
  });

  document.body.appendChild(dropdown);

  // Remove dropdown when clicking outside
  document.body.addEventListener('click', function removeDropdown(e) {
    if (!dropdown.contains(e.target) && e.target !== document.querySelector('.collection-name')) {
      if (document.body.contains(dropdown)) {
        document.body.removeChild(dropdown);
      }
      document.body.removeEventListener('click', removeDropdown);
    }
  });
}

// Add this function at the top of the file
function closeAllAlternateMenus() {
  document.querySelectorAll('.alternate-values-menu.show').forEach(menu => {
    menu.classList.remove('show');
  });
}

document.addEventListener('DOMContentLoaded', () => {
  chrome.storage.local.get(['collections', 'currentCollection'], (result) => {
    collections = result.collections || { default: [] };
    currentCollection = result.currentCollection || 'default';
    if (!Array.isArray(collections[currentCollection])) {
      collections[currentCollection] = [];
    }
    // Ensure there's at least one color in the collection
    if (collections[currentCollection].length === 0) {
      collections[currentCollection].push('');
    }
    updateCollectionName();
    updatePalette();
  });

  document.body.addEventListener('click', (e) => {
    if (e.target.closest('.collection-settings')) {
      showSettingsMenu(e.clientX, e.clientY);
    }
  });

  document.addEventListener('click', (e) => {
    if (!e.target.closest('.alternate-values')) {
      closeAllAlternateMenus();
    }
  });

  document.querySelector('.palette').addEventListener('click', (e) => {
    const colorSlot = e.target.closest('.color-slot');
    if (!colorSlot) return;

    if (e.target.classList.contains('color-preview')) {
      const index = Array.from(colorSlot.parentNode.children).indexOf(colorSlot);
      chrome.runtime.sendMessage({
        action: "startColorPick",
        slotIndex: index
      }, (response) => {
        if (chrome.runtime.lastError) {
          console.error("Error starting color pick:", chrome.runtime.lastError);
        }
      });
    } else if (e.target.classList.contains('color-value')) {
      const originalText = e.target.textContent;
      navigator.clipboard.writeText(originalText);
      const copiedSpan = document.createElement('span');
      copiedSpan.textContent = 'Copied!';
      copiedSpan.style.position = 'absolute';
      copiedSpan.style.left = '50%';
      copiedSpan.style.transform = 'translateX(-50%)';
      copiedSpan.style.backgroundColor = 'rgba(0,0,0,0.7)';
      copiedSpan.style.color = 'white';
      copiedSpan.style.padding = '2px 5px';
      copiedSpan.style.borderRadius = '3px';
      copiedSpan.style.fontSize = '10px';
      e.target.appendChild(copiedSpan);
      setTimeout(() => {
        e.target.removeChild(copiedSpan);
      }, 1000);
    } else if (e.target.classList.contains('dropdown-arrow')) {
      closeAllAlternateMenus(); // Close all other menus
      const menu = colorSlot.querySelector('.alternate-values-menu');
      menu.classList.toggle('show');

      const color = colorSlot.querySelector('.color-preview').style.backgroundColor;
      const rgb = parseColor(color);
      if (rgb) {
        const hsl = rgbToHsl(rgb.r, rgb.g, rgb.b);

        menu.querySelector('.rgb-value').textContent = formatRgb(rgb.r, rgb.g, rgb.b);
        menu.querySelector('.hsl-value').textContent = formatHsl(hsl.h, hsl.s, hsl.l);
      }
      e.stopPropagation(); // Prevent the global click event from immediately closing the menu
    } else if (e.target.classList.contains('rgb-value') || e.target.classList.contains('hsl-value')) {
      const originalText = e.target.textContent;
      navigator.clipboard.writeText(originalText);
      const copiedText = e.target.textContent;
      e.target.textContent = 'Copied!';
      setTimeout(() => {
        e.target.textContent = copiedText;
      }, 1000);
    } else if (e.target.classList.contains('remove-color')) {
      const index = Array.from(colorSlot.parentNode.children).indexOf(colorSlot);
      collections[currentCollection].splice(index, 1);
      updatePalette();
      saveCollections();
    }
  });

  document.querySelector('.collection-name').addEventListener('click', (e) => {
    showCollectionDropdown(e.clientX, e.clientY);
  });
});

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "colorPicked") {
    const color = request.color;
    if (request.slotIndex >= collections[currentCollection].length) {
      collections[currentCollection].push(color);
    } else {
      collections[currentCollection][request.slotIndex] = color;
    }
    updatePalette();
    saveCollections();
  }
});