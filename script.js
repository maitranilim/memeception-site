const btn = document.getElementById("meme-btn");
const memeBox = document.getElementById("meme-box");
const credit = document.getElementById("credit");
const genreSelect = document.getElementById("genre");

async function getMeme() {
  const genre = genreSelect.value;
  credit.textContent = "Loading meme...";
  try {
    const res = await fetch(`https://meme-api.com/gimme/${genre}`);
    const data = await res.json();
    if (data.url && data.url.match(/\.(jpg|jpeg|png|gif)$/i)) {
      memeBox.src = data.url;
      credit.innerHTML = `<a href="${data.postLink}" target="_blank">r/${data.subreddit}</a> • by u/${data.author}`;
    } else {
      memeBox.src = "https://i.imgur.com/qIufhof.png";
      credit.textContent = "Meme failed to load 😢";
    }
  } catch (err) {
    memeBox.src = "https://i.imgur.com/qIufhof.png";
    credit.textContent = "Network issue — please try again.";
  }
}
btn.addEventListener("click", getMeme);
