async function checkSession(){

  const {

    data:{ session }

  } = await supabaseClient.auth.getSession();

  if(!session){

    window.location.href =
      "login.html";

    return;

  }

}

checkSession();

window.logout = async function(){
  await supabaseClient.auth.signOut();
  window.location.href = "login.html";
};

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

function setupNotificationDropdown(){
  const notifBtn = document.getElementById("notif-button");
  const dropdown = document.getElementById("notification-dropdown");
  if(!notifBtn || !dropdown) return;

  const closeDropdown = () => {
    dropdown.classList.remove("open");
    setTimeout(() => {
      if(!dropdown.classList.contains("open")){
        dropdown.style.display = "none";
      }
    }, 220);
  };

  notifBtn.addEventListener("click", (event) => {
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
    if(!notifBtn.contains(event.target) && !dropdown.contains(event.target)){
      closeDropdown();
    }
  });
}

// Release dates for books (ISO date strings)
const releaseDates = {  'astral-heir': '2026-06-01',
  'eleventh-voxt': '2026-06-12',
  'aeron-vaultis': '2026-06-19',
  'lady-nyxora': '2026-06-26',
  'four-brothers': '2026-07-03'
};

function applyBookLocks(){
  const now = new Date();
  document.querySelectorAll('button[data-book][data-release]').forEach(btn=>{
    const r = btn.dataset.release;
    if(!r) return;
    const release = new Date(r + 'T00:00:00');
    if(now < release){
      const days = Math.ceil((release - now)/(1000*60*60*24));
      btn.disabled = true;
      btn.classList.add('locked-book');
      btn.dataset.originalText = btn.textContent;
      btn.innerHTML = `🔒 Unlocks in ${days} day${days>1?'s':''}`;
      btn.addEventListener('click', (e)=>{
        e.preventDefault();
        alert(`${btn.closest('.book-card')?.querySelector('h3')?.textContent || 'This book'} unlocks on ${release.toDateString()}`);
      });
    } else {
      btn.disabled = false;
      btn.classList.remove('locked-book');
      if(btn.dataset.originalText){ btn.textContent = btn.dataset.originalText; }
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
      }).catch(()=>{
        // autoplay blocked
      }).finally(()=>{
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

async function loadNotifications(){
  const list = document.getElementById("notification-list");
  const countEl = document.getElementById("notif-count");
  if(!list || !countEl) return;

  let response = await supabaseClient
    .from("notifications")
    .select("id, title, created_at")
    .order("created_at", { ascending: false })
    .limit(5);

  if(response.error){
    console.warn("loadNotifications primary query failed, retrying fallback:", response.error.message || response.error);
    response = await supabaseClient
      .from("notification")
      .select("id, title, created_at")
      .order("created_at", { ascending: false })
      .limit(5);
  }

  if(response.error){
    console.warn("loadNotifications fallback created_at sort failed, retrying without order:", response.error.message || response.error);
    response = await supabaseClient
      .from(response.error && response.error.details?.table ? response.error.details.table : "notifications")
      .select("id, title, created_at")
      .limit(5);
  }

  const { data, error } = response;
  if(error){
    console.error("loadNotifications error:", error);
    list.innerHTML = "<div class=\"notification-item\">Unable to load notifications</div>";
    countEl.textContent = "0";
    return;
  }

  if(!data || data.length === 0){
    list.innerHTML = "<div class=\"notification-item\">No notifications</div>";
    countEl.textContent = "0";
    return;
  }

  list.innerHTML = data.map(note => `
    <div class=\"notification-item\">
      <strong>${escapeHtml(note.title || note.message || "Notification")}</strong>
      <div class="comment-time">${formatTimestamp(note.created_at || note.createdAt || note.inserted_at)}</div>
    </div>
  `).join("");

  countEl.textContent = String(data.length);
}

async function loadUserProfile(){

  const {

    data:{ user }

  } = await supabaseClient
      .auth
      .getUser();

  if(!user) return;

  const { data, error } =
    await supabaseClient
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  const usernameDisplay = document.getElementById(
    "username-display"
  );
  const profileInfo = document.getElementById(
    "profile-info"
  );
  const profileSection = document.getElementById(
    "profile-section"
  );
  const adminLink = document.getElementById(
    "admin-link"
  );

  const username =
    data?.username ||
    user.email?.split("@")[0] ||
    "reader";

  if(usernameDisplay){
    usernameDisplay.textContent = username;
  }

  if(adminLink){
    if(data?.role !== "admin"){
      adminLink.style.display = "none";
    } else {
      adminLink.style.display = "inline-flex";
    }
  }

  if(profileInfo && data){
    profileInfo.innerHTML = `
      <div class="profile-card">
        <div class="profile-heading">${data.username || username}</div>
        <div class="profile-meta">${data.email}</div>
        <div class="profile-stat">Role: ${data.role}</div>
        <div class="profile-stat">Joined: ${new Date(data.created_at).toLocaleDateString()}</div>
      </div>
    `;
  }

  if(profileSection){
    profileSection.style.display = "block";
  }

}

async function showAdminButton(){

  const admin =
    await window.isAdmin();

  const btn = document.getElementById(
      "admin-link"
    );
  if(btn){
    btn.style.display = admin ? "inline-flex" : "none";
  }

}

applyTheme();
setupProfileDropdown();
setupNotificationDropdown();
setupMusic();
showAdminButton();
await loadUserProfile();
await loadNotifications();
applyBookLocks();

document
.addEventListener(
  "DOMContentLoaded",
  ()=>{

    document
    .querySelectorAll(".like-btn")
    .forEach(btn=>{

      const id =
        btn.dataset.book;

      if(
        localStorage.getItem(
          `liked-${id}`
        )
      ){
        btn.classList.add(
          "liked"
        );
      }

    });

  }
);

/* BOOK READER */

async function loadViews() {
  const { data, error } = await supabaseClient
    .from("books")
    .select("id, title, views, likes, comments");
  

  if (error) {
    console.error("loadViews error:", error);
    return;
  }

  data.forEach(book => {
    const key = book.slug || book.id;
    const viewsEl = document.getElementById(`views-${key}`);
    const likesEl = document.getElementById(`likes-${key}`);
    const commentsEl = document.getElementById(`comments-${key}`);

    if (viewsEl) viewsEl.textContent = book.views || 0;
    if (likesEl) likesEl.textContent = book.likes || 0;
    if (commentsEl) commentsEl.textContent = book.comments || 0;
  });

}

// try to increment a counter using an RPC if available, otherwise fall back to a safe-select-and-update with retries
async function safeIncrement(table, id, column) {
  for (let i = 0; i < 3; i++) {
    const { data, error } = await supabaseClient
      .from(table)
      .select(column)
      .eq("id", id)
      .single();

    if (error) {
      console.error(`safeIncrement select error (${column}):`, error);
      return false;
    }

    const current = (data && data[column]) || 0;

    const { error: updateError } = await supabaseClient
      .from(table)
      .update({ [column]: current + 1 })
      .eq("id", id);

    if (!updateError) return true;

    // small backoff
    await new Promise((r) => setTimeout(r, 100 + i * 50));
  }

  console.error("safeIncrement failed for", table, id, column);
  return false;
}

async function incrementViews(bookId){

  const { data, error } =
    await supabaseClient
      .from("books")
      .select("views")
      .eq("id", bookId)
      .single();

  if(error){
    console.error(error);
    return;
  }

  const currentViews = data.views || 0;

  const { error:updateError } =
    await supabaseClient
      .from("books")
      .update({
        views: currentViews + 1
      })
      .eq("id", bookId);

  if(updateError){
    console.error(updateError);
    return;
  }

  // log analytics event for view
  try{
    await supabaseClient
      .from("analytics")
      .insert([
        { book_id: bookId, event_type: "view" }
      ]);
  }catch(e){
    console.error('analytics insert view error', e);
  }

  await loadViews();
}

window.loadBook =
async function(
title,
url,
bookId,
bookSlug
){

  const titleElement =
    document.getElementById(
      "reader-title"
    );

  const readerContainer =
    document.getElementById(
      "reader-container"
    );

  titleElement.textContent =
    title;

  readerContainer.innerHTML =
  `
    <iframe
      src="${url}"
      width="100%"
      height="1000"
      frameborder="0"
      allowfullscreen>
    </iframe>
  `;

  document
    .getElementById(
      "reader-section"
    )
    .scrollIntoView({
      behavior:"smooth"
    });

  // track current book globally for like/comment actions
  window.currentBookId = bookId;
  window.currentBookSlug = bookSlug;
  // Attempt to start theme music on book open (user interaction context)
  try{
    const music = document.getElementById('voxt-theme');
    if(music && music.paused){
      music.play().catch(()=>{});
    }
  }catch(e){ /* ignore */ }
  await incrementViews(bookId);

  await loadViews();

  // load comments for the selected book
  await loadComments(bookId);

};
// initial load of counts
loadViews();

// refresh counts every 5 seconds
setInterval(() => {
  loadViews();
}, 5000);

// Developer debug panel (enabled via ?debug=1)
async function renderDebugPanel(){
  try{
    const params = new URLSearchParams(window.location.search);
    if(!params.get('debug')) return;

    const panel = document.getElementById('dev-debug-panel');
    const content = document.getElementById('dev-debug-content');
    if(!panel || !content) return;
    panel.style.display = 'block';

    const { data: userData } = await supabaseClient.auth.getUser();
    const user = userData?.user;

    let profileInfo = null;
    if(user){
      const { data, error } = await supabaseClient
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();
      if(error){
        console.error('debug profile fetch error', error);
      } else {
        profileInfo = data;
      }
    }

    content.innerHTML = `
      <div><strong>User:</strong> ${user ? user.id : 'not signed in'}</div>
      <div><strong>Email:</strong> ${user ? (user.email || '-') : '-'}</div>
      <div><strong>Profile role:</strong> ${profileInfo?.role || 'not set'}</div>
      <div style="margin-top:8px;font-size:12px;color:#bbb">This panel is temporary for debugging only.</div>
    `;

    document.getElementById('dev-refresh-debug').onclick = renderDebugPanel;

    document.getElementById('dev-force-admin').onclick = async ()=>{
      if(!user) return alert('Not signed in');
      if(!confirm('Make this account admin in profiles table?')) return;

      const { error } = await supabaseClient
        .from('profiles')
        .update({ role: 'admin' })
        .eq('id', user.id);

      if(error){
        console.error('force admin error', error);
        alert('Failed to update profile role. See console.');
        return;
      }

      alert('Profile role set to admin. Reloading...');
      renderDebugPanel();
    };

  }catch(e){
    console.error('renderDebugPanel error', e);
  }
}

// run debug panel render after DOM ready
if(document.readyState === 'loading'){
  document.addEventListener('DOMContentLoaded', renderDebugPanel);
} else {
  renderDebugPanel();
}

// Like a book (optimistic UI + safe increment)
window.likeBook = async function (bookId) {
  if (!bookId) return;

  // optimistic UI
  const likesEl = document.getElementById(`likes-${bookId}`);
  if (likesEl) likesEl.textContent = Number(likesEl.textContent || 0) + 1;

  try {
    const { error } = await supabaseClient.rpc("increment_book_likes", { book_id: bookId });
    if (!error) {
      await loadViews();
      return;
    }
  } catch (e) {
    // rpc may not exist
  }

  const ok = await safeIncrement("books", bookId, "likes");
  if (!ok) {
    console.error("Failed to increment likes");
    // revert optimistic UI by reloading true value
    await loadViews();
  } else {
    await loadViews();
  }
};

window.toggleLike =
async function(bookId){

  const storageKey =
    `liked-${bookId}`;

  const alreadyLiked =
    localStorage.getItem(storageKey);

  const btn = document.querySelector(
    `.like-btn[data-book="${bookId}"]`
  );

  

  if(alreadyLiked){
    localStorage.removeItem(storageKey);
    if(btn) btn.classList.remove("liked");
    await decrementLike(bookId);
    return;
  }

  localStorage.setItem(
    storageKey,
    "true"
  );

  if(btn) btn.classList.add("liked");
  await incrementLike(bookId);

};

async function incrementLike(bookId){

  

  const { data, error } =
    await supabaseClient
      .from("books")
      .select("likes")
      .eq("id", bookId)
      .single();

  if(error){
    console.error(error);
    return;
  }

  const { data: updateData, error: updateError } = await supabaseClient
    .from("books")
    .update({
      likes:(data.likes || 0)+1
    })
    .eq("id", bookId);

  

  // log analytics event for like
  try{
    await supabaseClient
      .from("analytics")
      .insert([
        { book_id: bookId, event_type: "like" }
      ]);
  }catch(e){
    console.error('analytics insert like error', e);
  }

  await loadViews();

}

async function decrementLike(bookId){

  

  const { data, error } =
    await supabaseClient
      .from("books")
      .select("likes")
      .eq("id", bookId)
      .single();

  if(error){
    console.error(error);
    return;
  }

  const newValue =
    Math.max(
      0,
      (data.likes || 0)-1
    );

  const { data: updateData, error: updateError } = await supabaseClient
    .from("books")
    .update({
      likes:newValue
    })
    .eq("id", bookId);

  

  await loadViews();

}

// Comments
async function loadComments(bookId) {
  const container = document.getElementById("comments-list");
  if (!container) return;

  container.innerHTML = "Loading comments...";

  const { data, error } = await supabaseClient
    .from("comments")
    .select("id, username, message, created_at")
    .eq("book_id", bookId)
    .order("created_at", { ascending: true });

  if (error) {
    console.error("loadComments error:", error);
    container.innerHTML = "Error loading comments";
    return;
  }

  if (!data || data.length === 0) {
    container.innerHTML = "<p>No comments yet.</p>";
    return;
  }

  container.innerHTML =
  data.map(c => `

    <div class="comment-item">
      <div class="comment-author">${escapeHtml(c.username)}</div>
      <div class="comment-message">${escapeHtml(c.message)}</div>
      <div class="comment-time">${new Date(
        c.created_at
      ).toLocaleString()}</div>
      <div class="reply-actions">
        <button class="reply-button" type="button" onclick="showReplyBox('${escapeHtml(c.id)}')">Reply</button>
      </div>
      <div id="reply-box-${escapeHtml(c.id)}"></div>
      <div id="replies-${escapeHtml(c.id)}" class="comment-replies"></div>
    </div>

  `).join("");

  for (const comment of data) {
    await loadReplies(comment.id);
  }
}

async function loadReplies(commentId) {
  const container = document.getElementById(`replies-${commentId}`);
  if (!container) return;

  let response = await supabaseClient
    .from("comment_replies")
    .select("id, username, message, created_at")
    .eq("comment_id", commentId)
    .order("created_at", { ascending: true });

  if (response.error) {
    console.warn("loadReplies primary query failed, retrying fallback:", response.error.message || response.error);
    response = await supabaseClient
      .from("comment_reply")
      .select("id, username, message, created_at")
      .eq("comment_id", commentId)
      .order("created_at", { ascending: true });
  }

  if (response.error) {
    console.warn("loadReplies fallback created_at sort failed, retrying without order:", response.error.message || response.error);
    response = await supabaseClient
      .from(response.error && response.error.details?.table ? response.error.details.table : "comment_replies")
      .select("id, username, message, created_at")
      .eq("comment_id", commentId);
  }

  const { data, error } = response;
  if (error) {
    console.error("loadReplies error:", error);
    container.innerHTML = "<div class=\"comment-reply\">Error loading replies</div>";
    return;
  }

  if (!data || data.length === 0) {
    container.innerHTML = "";
    return;
  }

  container.innerHTML = data.map(reply => `
    <div class="comment-reply">
      <div class="comment-author">${escapeHtml(reply.username)}</div>
      <div class="comment-message">${escapeHtml(reply.message)}</div>
      <div class="comment-time">${formatTimestamp(reply.created_at || reply.createdAt || reply.inserted_at)}</div>
    </div>
  `).join("");
}

window.showReplyBox = function(commentId){

  const box =
    document.getElementById(
      `reply-box-${commentId}`
    );

  if(!box) return;

  box.innerHTML = `
    <div class="reply-actions">
      <input id="reply-input-${commentId}" type="text" placeholder="Write a reply..." />
      <button type="button" onclick="submitReply('${commentId}')">Post Reply</button>
    </div>
  `;
}

window.submitReply = async function(commentId){
  const message = document.getElementById(`reply-input-${commentId}`)?.value?.trim();
  if(!message){
    alert('Enter a reply message');
    return;
  }

  const { data: userData, error: userError } =
    await supabaseClient.auth.getUser();

  if(userError || !userData?.user){
    console.error('submitReply getUser error', userError);
    alert('Unable to reply right now');
    return;
  }

  const { data: profile, error: profileError } =
    await supabaseClient
      .from('profiles')
      .select('username')
      .eq('id', userData.user.id)
      .single();

  if(profileError){
    console.error('submitReply profile error', profileError);
    alert('Unable to reply right now');
    return;
  }

  const { error } = await supabaseClient
    .from('comment_replies')
    .insert([{ comment_id: commentId, username: profile.username, message }]);

  if(error){
    console.error('submitReply insert error', error);
    alert('Unable to post reply');
    return;
  }

  document.getElementById(`reply-box-${commentId}`).innerHTML = '';
  await loadReplies(commentId);
}

window.postComment = async function (bookId, username, message) {
  if (!bookId || !username || !message) return;

  const { error } = await supabaseClient.from("comments").insert([
    { book_id: bookId, username, message }
  ]);

  if (error) {
    console.error("postComment insert error:", error);
    return;
  }

  // log analytics event for comment
  try{
    await supabaseClient
      .from("analytics")
      .insert([
        { book_id: bookId, event_type: "comment" }
      ]);
  }catch(e){
    console.error('analytics insert comment error', e);
  }

  // increment comment count on books table
  try {
    const { error: rpcError } = await supabaseClient.rpc("increment_book_comments", { book_id: bookId });
    if (rpcError) throw rpcError;
  } catch (e) {
    await safeIncrement("books", bookId, "comments");
  }

  // refresh UI
  await loadComments(bookId);
  await loadViews();
};

// bind comment form (attach immediately if available, otherwise wait for DOMContentLoaded)
function bindCommentForm(){
  const form = document.getElementById("comment-form");
  if (!form) return;

  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    const username = document.getElementById("comment-username").value.trim();
    const message = document.getElementById("comment-message").value.trim();

    if (!window.currentBookId) {
      alert("Select a book first");
      return;
    }

    try{
      await postComment(window.currentBookId, username, message);
    }catch(err){
      console.error('postComment error:', err);
      alert('Failed to post comment');
      return;
    }

    form.reset();
  });
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", bindCommentForm);
} else {
  bindCommentForm();
}

// small helper to avoid XSS in rendered comments
function formatTimestamp(value) {
  if (!value) return "No date";
  const date = new Date(value);
  return isNaN(date.getTime()) ? "No date" : date.toLocaleString();
}

function escapeHtml(str) {
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

supabaseClient
.channel("comments-live")
.on(
  "postgres_changes",
  {
    event: "*",
    schema: "public",
    table: "comments"
  },
  async (payload) => {

    if(window.currentBookId){

      await loadComments(
        window.currentBookId
      );

    }

  }
)
.subscribe();

  // Subscribe helper — inserts email into `subscribers` table
  window.subscribe = async function(){

    const emailEl = document.getElementById("email");
    if(!emailEl) return;

    const email = emailEl.value && emailEl.value.trim();
    if(!email) {
      alert('Please enter an email');
      return;
    }

    try{
      const { data, error } = await supabaseClient
        .from('subscribers')
        .insert([
          { email }
        ]);

      if(error){
        console.error('subscribe error:', error);
        alert('Subscribe failed');
        return;
      }

      emailEl.value = '';
      alert('Thanks for subscribing!');

    }catch(e){
      console.error(e);
      alert('Subscribe failed');
    }

  };

    // Alternative subscribe function used by homepage 'Join The VOXT Chronicles' section
    window.subscribeReader =
    async function(){

      const emailEl = document.getElementById(
        "subscriber-email"
      ) || document.getElementById("email");

      if(!emailEl){
        alert("Subscribe field not found");
        return;
      }

      const email = emailEl.value && emailEl.value.trim();
      if(!email){
        alert("Enter email");
        return;
      }

      const { error } = await supabaseClient
        .from("subscribers")
        .insert([
          { email }
        ]);

      if(error){
        alert("Already subscribed");
        return;
      }

      emailEl.value = "";
      alert("Welcome to VOXT!");

    };

  supabaseClient
.channel("comments-live")
.on(
  "postgres_changes",
  {
    event: "*",
    schema: "public",
    table: "comments"
  },
  async () => {

    if(window.currentBookId){

      await loadComments(
        window.currentBookId
      );

    }

  }
)
.subscribe();