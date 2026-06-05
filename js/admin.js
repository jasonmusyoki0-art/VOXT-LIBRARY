function routeTo(path = ""){
  return window.location.pathname.endsWith("/admin/") ||
    window.location.pathname.endsWith("/admin/index.html")
    ? `../${path}`
    : path || "./";
}

async function checkAdmin(){
  const {
    data:{ user }
  } = await supabaseClient.auth.getUser();

  if(!user){
    window.location.href = routeTo("login/");
    return;
  }

  const isAdminUser = await window.isAdmin();
  
  if(!isAdminUser){
    const overlay = document.createElement("div");
    overlay.id = "access-denied-overlay";
    overlay.style.position = "fixed";
    overlay.style.top = "0";
    overlay.style.left = "0";
    overlay.style.width = "100%";
    overlay.style.height = "100%";
    overlay.style.zIndex = "9999";
    overlay.style.display = "flex";
    overlay.style.alignItems = "center";
    overlay.style.justifyContent = "center";
    overlay.style.backdropFilter = "blur(6px)";
    overlay.style.backgroundColor = "rgba(0,0,0,0.45)";
    overlay.innerHTML = '<div style="background:rgba(255,255,255,0.95);padding:24px;border-radius:12px;max-width:90%;text-align:center;box-shadow:0 8px 24px rgba(0,0,0,0.25);font-size:18px;">Sorry, you are not an admin.</div>';
    document.body.appendChild(overlay);

    setTimeout(() => {
      window.location.href = routeTo();
    }, 3000);

    return;
  }
}

async function loadAdminProfile(){
  const {
    data:{ user }
  } = await supabaseClient.auth.getUser();

  if(!user) return;

  const { data, error } = await supabaseClient
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  if(error){
    console.error("loadAdminProfile error:", error);
    return;
  }

  const usernameDisplay = document.getElementById("username-display");
  if(usernameDisplay){
    usernameDisplay.textContent =
      data?.username ||
      user.email?.split("@")[0] ||
      "Admin";
  }

  const adminLink = document.getElementById("admin-link");
  if(adminLink){
    adminLink.style.display = "inline-flex";
  }
}

function applyTheme(){
  const toggle = document.getElementById("theme-toggle");
  if(!toggle) return;

  const stored = localStorage.getItem("theme");
  if(stored === "dark"){
    document.body.classList.add("dark");
  }

  toggle.textContent =
    document.body.classList.contains("dark")
    ? "☀️"
    : "🌙";

  toggle.addEventListener("click", () => {
    document.body.classList.toggle("dark");
    const isDark = document.body.classList.contains("dark");
    localStorage.setItem("theme", isDark ? "dark" : "light");
    toggle.textContent = isDark ? "☀️" : "🌙";
  });
}

function setupProfileDropdown(){
  const profileBtn = document.getElementById("profile-btn");
  const dropdown = document.getElementById("profile-dropdown");
  if(!profileBtn || !dropdown) return;

  const closeDropdown = () => {
    dropdown.classList.remove("open");
    setTimeout(() => {
      if(!dropdown.classList.contains("open")){
        dropdown.style.display = "none";
      }
    }, 220);
  };

  profileBtn.addEventListener("click", (event) => {
    event.stopPropagation();
    if(dropdown.classList.contains("open")){
      closeDropdown();
      return;
    }
    dropdown.style.display = "block";
    requestAnimationFrame(() => {
      dropdown.classList.add("open");
    });
  });

  dropdown.addEventListener("click", (event) => {
    event.stopPropagation();
  });

  document.addEventListener("click", (event) => {
    if(!profileBtn.contains(event.target) && !dropdown.contains(event.target)){
      closeDropdown();
    }
  });
}

function setupMusic(){
  const music = document.getElementById('voxt-theme');
  const btn = document.getElementById('music-toggle');
  if(!music || !btn) return;

  const savedState = localStorage.getItem('voxt-music-state') || (localStorage.getItem('voxt-music-muted') === 'muted' ? 'muted' : 'paused');
  const shouldAutoPlay = savedState === 'playing';

  if(shouldAutoPlay){
    btn.textContent = '🔇';
    music.muted = false;
    music.play().catch(() => {
      btn.textContent = '🎵';
      localStorage.setItem('voxt-music-state','paused');
    });
  } else {
    btn.textContent = '🎵';
    music.muted = savedState === 'muted';
  }

  try{
    if(localStorage.getItem('voxt-music-autoplay')){
      music.play().then(()=>{
        btn.textContent = '🔇';
        localStorage.setItem('voxt-music-state','playing');
      }).catch(()=>{}).finally(()=>{
        try{ localStorage.removeItem('voxt-music-autoplay'); }catch(e){}
      });
    }
  }catch(e){}

  btn.addEventListener('click', async () => {
    if(music.paused){
      try{
        await music.play();
        btn.textContent = '🔇';
        localStorage.setItem('voxt-music-state','playing');
      }catch(e){
        console.warn('music play prevented', e);
      }
    } else {
      music.pause();
      btn.textContent = '🎵';
      localStorage.setItem('voxt-music-state','muted');
    }
  });

  const startedKey = 'voxt-music-started';
  if(!localStorage.getItem(startedKey)){
    const startOnInteract = async ()=>{
      try{ await music.play(); }catch(e){}
      localStorage.setItem(startedKey,'1');
      document.removeEventListener('click', startOnInteract);
    };
    document.addEventListener('click', startOnInteract, { once: true });
  }
}

applyTheme();
setupProfileDropdown();
setupMusic();

async function loadDashboard(){

  const booksResponse = await supabaseClient
    .from("books")
    .select("id, title, views, likes, comments, slug");

  const subscribersResponse = await supabaseClient
    .from("subscribers")
    .select("*");

  const profilesResponse = await supabaseClient
    .from("profiles")
    .select("*");

  const books = booksResponse.data || [];
  const subscribers = subscribersResponse.data || [];
  const profiles = profilesResponse.data || [];

  if (booksResponse.error) {
    console.error("loadDashboard books error:", booksResponse.error);
  }
  if (subscribersResponse.error) {
    console.error("loadDashboard subscribers error:", subscribersResponse.error);
  }
  if (profilesResponse.error) {
    console.error("loadDashboard profiles error:", profilesResponse.error);
  }

  let views = 0;
  let likes = 0;
  books.forEach(book => {
    views += book.views || 0;
    likes += book.likes || 0;
  });

  const totalViewsEl = document.getElementById("totalViews");
  const totalLikesEl = document.getElementById("totalLikes");
  const totalSubscribersEl = document.getElementById("totalSubscribers");
  const totalReadersEl = document.getElementById("totalReaders");

  if(totalViewsEl) totalViewsEl.textContent = views;
  if(totalLikesEl) totalLikesEl.textContent = likes;
  if(totalSubscribersEl) totalSubscribersEl.textContent = subscribers.length;
  if(totalReadersEl) totalReadersEl.textContent = profiles.length;

  renderBookStats(books);
  renderRecentComments();
  renderTopBook(books);
}

function escapeHtml(str){
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function renderBookStats(books){
  const container = document.getElementById("book-stats-list");
  if(!container) return;

  if(!books || books.length === 0){
    container.innerHTML = '<p>No book stats available.</p>';
    return;
  }

  container.innerHTML = books.map(book => `
    <div class="book-stat-card">
      <div class="book-stat-title">${escapeHtml(book.title || book.slug || book.id)}</div>
      <div class="book-stat-row"><span>Views</span><span>${book.views || 0}</span></div>
      <div class="book-stat-row"><span>Likes</span><span>${book.likes || 0}</span></div>
      <div class="book-stat-row"><span>Comments</span><span>${book.comments || 0}</span></div>
    </div>
  `).join("");
}

async function renderRecentComments(){
  const feed = document.querySelector(".featured-panel-card.comments-feed ul");
  if(!feed) return;

  const { data, error } = await supabaseClient
    .from("comments")
    .select("username, message, book_id, created_at")
    .order("created_at", { ascending: false })
    .limit(5);

  if(error){
    console.error("renderRecentComments error:", error);
    feed.innerHTML = "<li>Error loading comments</li>";
    return;
  }

  if(!data || data.length === 0){
    feed.innerHTML = "<li>No comments yet.</li>";
    return;
  }

  feed.innerHTML = data.map(comment => `
    <li>
      <strong>${escapeHtml(comment.username)}</strong>
      <span>on ${escapeHtml(comment.book_id)}</span>
      <div>${escapeHtml(comment.message)}</div>
    </li>
  `).join("");
}

function renderTopBook(books){
  const headline = document.getElementById("topBookHeadline");
  const progress = document.getElementById("topBookProgress");
  if(!headline || !progress) return;

  if(!books || books.length === 0){
    headline.textContent = "No books available";
    progress.style.width = "0%";
    return;
  }

  const topBook = books.reduce((best, book) => {
    if(!best || (book.views || 0) > (best.views || 0)) return book;
    return best;
  }, books[0]);

  headline.textContent = `${topBook.title || topBook.slug || topBook.id} (${topBook.views || 0} views)`;

  const maxViews = Math.max(...books.map(b => b.views || 0), 1);
  const width = Math.round(((topBook.views || 0) / maxViews) * 100);
  progress.style.width = `${width}%`;
}


checkAdmin();
loadAdminProfile();
loadDashboard();
