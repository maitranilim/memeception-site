// script.js - simple client-side meme fetcher
const genres = [
  { name: "memes", label: "Top memes" },
  { name: "puns", label: "Pun" },
  { name: "wholesomememes", label: "Wholesome" },
  { name: "dankmemes", label: "Dank" },
  { name: "ProgrammerHumor", label: "Tech" },
  { name: "cringememes", label: "Cringe" },
  { name: "me_irl", label: "Relatable" },
];

const memeBox = document.getElementById("memePlaceholder");
const creditLine = document.getElementById("creditLine");
const genresWrap = document.getElementById("genres");
const getBtn = document.getElementById("getBtn");
const prevBtn = document.getElementById("prevBtn");
const nextBtn = document.getElementById("nextBtn");

let selectedGenre = "memes";
let stack = []; // cached meme objects
let idx = -1;
const fallbackImage = "https://i.imgur.com/qIufhof.png"; // friendly fallback
const maxRetries = 2;

function isImageUrl(url){
  return !!url && /\.(jpe?g|png|gif|webp|avif)$/i.test(url);
}

function renderGenreButtons(){
  genres.forEach(g => {
    const btn = document.createElement("button");
    btn.className = "genre-pill";
    btn.textContent = g.label;
    btn.dataset.genre = g.name;
    if(g.name === selectedGenre) btn.classList.add("active");
    btn.addEventListener("click", () => {
      document.querySelectorAll(".genre-pill").forEach(x => x.classList.remove("active"));
      btn.classList.add("active");
      selectedGenre = g.name;
    });
    genresWrap.appendChild(btn);
  });
}

function renderCurrent(){
  memeBox.innerHTML = "";
  creditLine.textContent = "";
  if(idx < 0 || !stack[idx]){
    memeBox.innerHTML = `<div class="placeholder-text">Click "Gimme a Meme" to start</div>`;
    prevBtn.disabled = true;
    nextBtn.disabled = true;
    return;
  }
  const m = stack[idx];
  prevBtn.disabled = idx <= 0;
  nextBtn.disabled = idx >= stack.length - 1;

  // show image or fallback
  const img = document.createElement("img");
  img.alt = m.title || "meme";
  img.loading = "lazy";
  img.onerror = () => {
    img.src = fallbackImage;
    creditLine.textContent = "Meme failed to load — showing placeholder.";
  };

  img.src = m.url || fallbackImage;
  memeBox.appendChild(img);

  if(m.subreddit){
    creditLine.innerHTML = `<a href="${m.postLink}" target="_blank" rel="noopener">View on r/${m.subreddit}</a> • u/${m.author || "unknown"}`;
  } else {
    creditLine.textContent = m.title || "";
  }
}

async function fetchFromApi(genre){
  let attempt = 0;
  while(attempt <= maxRetries){
    try{
      const endpoint = `https://meme-api.com/gimme/${encodeURIComponent(genre)}`;
      const res = await fetch(endpoint);
      if(!res.ok) throw new Error("upstream " + res.status);
      const data = await res.json();
      if(data && isImageUrl(data.url)){
        return {
          ok: true,
          url: data.url,
          title: data.title,
          subreddit: data.subreddit,
          author: data.author,
          postLink: data.postLink
        };
      } else {
        // sometimes meme-api returns gifv or external preview - try one more time
        attempt++;
      }
    } catch(e){
      attempt++;
      if(attempt > maxRetries) return { ok: false, error: "network" };
    }
  }
  return { ok: false, error: "invalid_image" };
}

async function getMeme(){
  getBtn.disabled = true;
  getBtn.textContent = "Loading...";
  const res = await fetchFromApi(selectedGenre);
  if(res.ok){
    // push to stack and show
    // if user has moved backward then fetch should discard forward history
    stack = [...stack.slice(0, idx + 1), res];
    idx = stack.length - 1;
  } else {
    // push fallback object
    const fail = { ok: false, url: fallbackImage, title: "Meme unavailable" };
    stack = [...stack.slice(0, idx + 1), fail];
    idx = stack.length - 1;
  }
  renderCurrent();
  getBtn.disabled = false;
  getBtn.textContent = "Gimme a Meme";
  saveCache();
}

function prevMeme(){
  if(idx > 0){ idx--; renderCurrent(); saveCache(); }
}
function nextMeme(){
  if(idx < stack.length - 1){ idx++; renderCurrent(); saveCache(); }
}

function saveCache(){
  try{
    localStorage.setItem("memeStackV1", JSON.stringify(stack));
    localStorage.setItem("memeIdxV1", String(idx));
  }catch(e){}
}

function loadCache(){
  try{
    const s = localStorage.getItem("memeStackV1");
    const i = localStorage.getItem("memeIdxV1");
    if(s){ stack = JSON.parse(s) || []; idx = (i !== null ? Number(i) : stack.length -1); }
  }catch(e){}
}

getBtn.addEventListener("click", getMeme);
prevBtn.addEventListener("click", prevMeme);
nextBtn.addEventListener("click", nextMeme);

renderGenreButtons();
loadCache();
renderCurrent();
