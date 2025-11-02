// DOM Elements
const btn = document.getElementById("meme-btn");
const memeBox = document.getElementById("meme-box");
const credit = document.getElementById("credit");
const genreSelect = document.getElementById("genre");
const saveBtn = document.getElementById("save-btn");
const savedSection = document.getElementById("saved-section");
const savedMemesGrid = document.getElementById("saved-memes-grid");
const themeToggle = document.getElementById("theme-toggle");
const sunIcon = document.getElementById("sun-icon");
const moonIcon = document.getElementById("moon-icon");

// Current meme data
let currentMeme = null;

// Theme Toggle Functionality
function initTheme() {
  const savedTheme = localStorage.getItem("theme");
  if (savedTheme === "dark") {
    document.body.classList.add("dark-mode");
    sunIcon.style.display = "none";
    moonIcon.style.display = "block";
  }
}

themeToggle.addEventListener("click", () => {
  document.body.classList.toggle("dark-mode");
  const isDark = document.body.classList.contains("dark-mode");
  
  if (isDark) {
    sunIcon.style.display = "none";
    moonIcon.style.display = "block";
    localStorage.setItem("theme", "dark");
  } else {
    sunIcon.style.display = "block";
    moonIcon.style.display = "none";
    localStorage.setItem("theme", "light");
  }
});

// Meme Fetching
async function getMeme() {
  const genre = genreSelect.value;
  credit.textContent = "Loading meme...";
  saveBtn.style.display = "none";
  
  try {
    const res = await fetch(`https://meme-api.com/gimme/${genre}`);
    const data = await res.json();
    
    if (data.url && data.url.match(/\.(jpg|jpeg|png|gif)$/i)) {
      memeBox.src = data.url;
      credit.innerHTML = `<a href="${data.postLink}" target="_blank">r/${data.subreddit}</a> • by u/${data.author}`;
      
      // Store current meme data
      currentMeme = {
        url: data.url,
        subreddit: data.subreddit,
        author: data.author,
        postLink: data.postLink
      };
      
      // Show save button
      saveBtn.style.display = "inline-block";
    } else {
      // If dark humor genre fails, try cursedcomments as fallback
      if (genre === "darkmemes") {
        const fallbackRes = await fetch(`https://meme-api.com/gimme/cursedcomments`);
        const fallbackData = await fallbackRes.json();
        
        if (fallbackData.url && fallbackData.url.match(/\.(jpg|jpeg|png|gif)$/i)) {
          memeBox.src = fallbackData.url;
          credit.innerHTML = `<a href="${fallbackData.postLink}" target="_blank">r/${fallbackData.subreddit}</a> • by u/${fallbackData.author}`;
          
          // Store current meme data
          currentMeme = {
            url: fallbackData.url,
            subreddit: fallbackData.subreddit,
            author: fallbackData.author,
            postLink: fallbackData.postLink
          };
          
          // Show save button
          saveBtn.style.display = "inline-block";
        } else {
          memeBox.src = "https://i.imgur.com/qIufhof.png";
          credit.textContent = "Meme failed to load 😢";
          currentMeme = null;
        }
      } else {
        memeBox.src = "https://i.imgur.com/qIufhof.png";
        credit.textContent = "Meme failed to load 😢";
        currentMeme = null;
      }
    }
  } catch (err) {
    // If dark humor genre fails, try cursedcomments as fallback
    if (genre === "darkmemes") {
      try {
        const fallbackRes = await fetch(`https://meme-api.com/gimme/cursedcomments`);
        const fallbackData = await fallbackRes.json();
        
        if (fallbackData.url && fallbackData.url.match(/\.(jpg|jpeg|png|gif)$/i)) {
          memeBox.src = fallbackData.url;
          credit.innerHTML = `<a href="${fallbackData.postLink}" target="_blank">r/${fallbackData.subreddit}</a> • by u/${fallbackData.author}`;
          
          // Store current meme data
          currentMeme = {
            url: fallbackData.url,
            subreddit: fallbackData.subreddit,
            author: fallbackData.author,
            postLink: fallbackData.postLink
          };
          
          // Show save button
          saveBtn.style.display = "inline-block";
        } else {
          memeBox.src = "https://i.imgur.com/qIufhof.png";
          credit.textContent = "Network issue — please try again.";
          currentMeme = null;
        }
      } catch (fallbackErr) {
        memeBox.src = "https://i.imgur.com/qIufhof.png";
        credit.textContent = "Network issue — please try again.";
        currentMeme = null;
      }
    } else {
      memeBox.src = "https://i.imgur.com/qIufhof.png";
      credit.textContent = "Network issue — please try again.";
      currentMeme = null;
    }
  }
}

// Save Meme Functionality
function saveMeme() {
  if (!currentMeme) return;
  
  // Get saved memes from localStorage
  let savedMemes = JSON.parse(localStorage.getItem("savedMemes")) || [];
  
  // Check if meme is already saved
  const alreadySaved = savedMemes.some(meme => meme.url === currentMeme.url);
  if (alreadySaved) {
    alert("This meme is already saved!");
    return;
  }
  
  // Add current meme to saved memes
  savedMemes.push(currentMeme);
  localStorage.setItem("savedMemes", JSON.stringify(savedMemes));
  
  // Update UI
  displaySavedMemes();
  alert("Meme saved! ✨");
}

// Display Saved Memes
function displaySavedMemes() {
  const savedMemes = JSON.parse(localStorage.getItem("savedMemes")) || [];
  
  if (savedMemes.length === 0) {
    savedSection.style.display = "none";
    return;
  }
  
  savedSection.style.display = "block";
  savedMemesGrid.innerHTML = "";
  
  savedMemes.forEach((meme, index) => {
    const memeItem = document.createElement("div");
    memeItem.className = "saved-meme-item";
    
    const img = document.createElement("img");
    img.src = meme.url;
    img.alt = `Saved meme from r/${meme.subreddit}`;
    
    // Click to load meme
    img.addEventListener("click", () => {
      memeBox.src = meme.url;
      credit.innerHTML = `<a href="${meme.postLink}" target="_blank">r/${meme.subreddit}</a> • by u/${meme.author}`;
      currentMeme = meme;
      saveBtn.style.display = "inline-block";
      window.scrollTo({ top: 0, behavior: "smooth" });
    });
    
    // Delete button
    const deleteBtn = document.createElement("button");
    deleteBtn.className = "delete-btn";
    deleteBtn.textContent = "✕";
    deleteBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      deleteSavedMeme(index);
    });
    
    memeItem.appendChild(img);
    memeItem.appendChild(deleteBtn);
    savedMemesGrid.appendChild(memeItem);
  });
}

// Delete Saved Meme
function deleteSavedMeme(index) {
  let savedMemes = JSON.parse(localStorage.getItem("savedMemes")) || [];
  savedMemes.splice(index, 1);
  localStorage.setItem("savedMemes", JSON.stringify(savedMemes));
  displaySavedMemes();
}

// Event Listeners
btn.addEventListener("click", getMeme);
saveBtn.addEventListener("click", saveMeme);

// Initialize
initTheme();
displaySavedMemes();
