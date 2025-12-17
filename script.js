/* -------------------------------------------------------------------------- */
/* THREE.JS BACKGROUND                                                        */
/* -------------------------------------------------------------------------- */
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });

renderer.setSize(window.innerWidth, window.innerHeight);
document.getElementById('canvas-container').appendChild(renderer.domElement);

// Geometry: Low Poly Icosahedron
const geometry = new THREE.IcosahedronGeometry(1.5, 0);
const material = new THREE.MeshLambertMaterial({
  color: 0x0ea5ff,
  wireframe: false,
  flatShading: true
});
const shape = new THREE.Mesh(geometry, material);
scene.add(shape);

// Lights
const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
scene.add(ambientLight);

const dirLight = new THREE.DirectionalLight(0xffffff, 0.8);
dirLight.position.set(5, 5, 5);
scene.add(dirLight);

camera.position.z = 5;

// Mouse Tracking for 3D Object
let mouseX = 0;
let mouseY = 0;

document.addEventListener('mousemove', (event) => {
  mouseX = (event.clientX / window.innerWidth) * 2 - 1;
  mouseY = -(event.clientY / window.innerHeight) * 2 + 1;
});

// Animation Loop
function animate() {
  requestAnimationFrame(animate);

  // Gentle rotation
  shape.rotation.x += 0.005;
  shape.rotation.y += 0.005;

  // Mouse influence (Parallax)
  shape.position.x += (mouseX * 1.5 - shape.position.x) * 0.05;
  shape.position.y += (mouseY * 1.5 - shape.position.y) * 0.05;

  renderer.render(scene, camera);
}
animate();

// Resize Handler
window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});

// Color Update on Theme Change
function updateThreeColor(isDark) {
  if (isDark) {
    material.color.setHex(0x0ea5ff); // Keep accent
    scene.fog = new THREE.FogExp2(0x0f172a, 0.1);
  } else {
    material.color.setHex(0x0ea5ff);
    scene.fog = null;
  }
}

/* -------------------------------------------------------------------------- */
/* UI INTERACTION (TILT)                                                      */
/* -------------------------------------------------------------------------- */
const card = document.getElementById('tilt-card');

document.addEventListener('mousemove', (e) => {
  if (window.innerWidth < 768) return; // Disable on mobile

  const x = (window.innerWidth / 2 - e.pageX) / 25;
  const y = (window.innerHeight / 2 - e.pageY) / 25;

  card.style.transform = `rotateY(${x}deg) rotateX(${y}deg)`;
});

/* -------------------------------------------------------------------------- */
/* MEME LOGIC (CORE)                                                          */
/* -------------------------------------------------------------------------- */
const state = {
  genre: 'dankmemes',
  currentMeme: null,
  isLoading: false
};

const els = {
  img: document.getElementById('meme-img'),
  loader: document.getElementById('loader'),
  fetchBtn: document.getElementById('fetch-btn'),
  saveBtn: document.getElementById('save-btn'),
  credit: document.getElementById('credit'),
  savedDrawer: document.getElementById('drawer'),
  savedGrid: document.getElementById('saved-grid')
};

// Initialize
fetchMeme();

// Event Listeners
els.fetchBtn.addEventListener('click', () => {
  // Trigger 3D Glitch Effect
  shape.rotation.x += 1;
  shape.rotation.y += 1;
  shape.scale.set(1.2, 1.2, 1.2);
  setTimeout(() => shape.scale.set(1, 1, 1), 200);

  fetchMeme();
});

document.getElementById('genre-container').addEventListener('click', (e) => {
  if (e.target.classList.contains('pill')) {
    document.querySelectorAll('.pill').forEach(p => p.classList.remove('active'));
    e.target.classList.add('active');
    state.genre = e.target.dataset.value;
  }
});

// --- FETCH ---
async function fetchMeme() {
  if (state.isLoading) return;
  state.isLoading = true;
  els.loader.style.opacity = '1';
  els.saveBtn.disabled = true;

  const urls = [
    `https://meme-api.com/gimme/${state.genre}`,
    `https://meme-api.com/gimme/cursedcomments` // Fallback
  ];

  for (let url of urls) {
    try {
      const res = await fetch(url);
      const data = await res.json();
      if (data.url && data.url.match(/\.(jpg|jpeg|png|gif)$/i)) {
        // Preload image
        const tempImg = new Image();
        tempImg.onload = () => {
          els.img.src = data.url;
          els.credit.innerHTML = `<a href="${data.postLink}" style="color:var(--accent);text-decoration:none;">r/${data.subreddit}</a> • u/${data.author}`;
          state.currentMeme = data;
          state.isLoading = false;
          els.loader.style.opacity = '0';
          els.saveBtn.disabled = false;
        };
        tempImg.src = data.url;
        return;
      }
    } catch (e) {
      console.log(e);
    }
  }

  // Error State
  state.isLoading = false;
  els.loader.style.opacity = '0';
  els.credit.innerText = "Error fetching meme 😢";
}

// --- SAVE SYSTEM ---
els.saveBtn.addEventListener('click', () => {
  if (!state.currentMeme) return;
  const saved = JSON.parse(localStorage.getItem('savedMemes') || '[]');
  if (saved.some(m => m.url === state.currentMeme.url)) return alert('Saved already!');

  saved.unshift(state.currentMeme);
  localStorage.setItem('savedMemes', JSON.stringify(saved));
  renderSaved();

  // Feedback
  els.saveBtn.innerText = '✅';
  setTimeout(() => els.saveBtn.innerText = '💾', 1000);
});

// --- DRAWER LOGIC ---
document.getElementById('view-saved-btn').addEventListener('click', () => els.savedDrawer.classList.add('open'));
document.getElementById('close-drawer').addEventListener('click', () => els.savedDrawer.classList.remove('open'));

function renderSaved() {
  const saved = JSON.parse(localStorage.getItem('savedMemes') || '[]');
  els.savedGrid.innerHTML = saved.map((m, i) => `
    <div class="saved-thumb" onclick="loadSaved(${i})">
      <div class="del" onclick="event.stopPropagation(); deleteMeme(${i})">✕</div>
      <img src="${m.url}">
    </div>
  `).join('');
}

window.deleteMeme = (i) => {
  const saved = JSON.parse(localStorage.getItem('savedMemes'));
  saved.splice(i, 1);
  localStorage.setItem('savedMemes', JSON.stringify(saved));
  renderSaved();
};

window.loadSaved = (i) => {
  const saved = JSON.parse(localStorage.getItem('savedMemes'));
  const m = saved[i];
  els.img.src = m.url;
  state.currentMeme = m;
  els.credit.innerHTML = `Saved Meme`;
  els.savedDrawer.classList.remove('open');
  els.saveBtn.disabled = true;
};

// --- THEME LOGIC ---
const themeToggle = document.getElementById('theme-toggle');
const sun = document.getElementById('icon-sun');
const moon = document.getElementById('icon-moon');

// Check saved theme
if (localStorage.getItem('theme') === 'dark') {
  document.body.classList.add('dark-mode');
  sun.style.display = 'none';
  moon.style.display = 'block';
  updateThreeColor(true);
}

themeToggle.addEventListener('click', () => {
  document.body.classList.toggle('dark-mode');
  const isDark = document.body.classList.contains('dark-mode');
  localStorage.setItem('theme', isDark ? 'dark' : 'light');

  sun.style.display = isDark ? 'none' : 'block';
  moon.style.display = isDark ? 'block' : 'none';

  updateThreeColor(isDark);
});

renderSaved();
