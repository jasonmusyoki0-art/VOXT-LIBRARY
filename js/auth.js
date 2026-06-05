function rootRoute(path = ""){
  const nestedRoute =
    window.location.pathname.endsWith("/login/") ||
    window.location.pathname.endsWith("/login/index.html");

  return nestedRoute ? `../${path}` : path || "./";
}

window.signUp = async function(){

  const email =
    document.getElementById("email").value.trim().toLowerCase();

  const password =
    document.getElementById("password").value;

  const username =
    document.getElementById("username").value.trim();

  if(!username || !email || !password){
    alert("Enter username, email, and password.");
    return;
  }

  const { data, error } =
    await supabaseClient.auth.signUp({

      email,
      password

    });

  if(error){

    alert(error.message);

    return;

  }

  const userId =
    data.user && data.user.id;

  if(!userId){
    alert("Account created. Check your email to confirm it before logging in.");
    return;
  }

  await supabaseClient
    .from("profiles")
    .insert([{

      id:userId,

      username,

      email,

      role:"reader"

    }]);

  alert(
    data.session
      ? "Account Created!"
      : "Account created. Check your email to confirm it before logging in."
  );

}

window.signIn =
async function(){
  const email = document.getElementById("email").value.trim().toLowerCase();
  const password = document.getElementById("password").value;

  if(!email || !password){
    alert("Enter email and password.");
    return;
  }

  const { data, error } = await supabaseClient.auth.signInWithPassword({
    email,
    password
  });

  

  if(error){
    alert(error.message);
    return;
  }

  alert("Logged in successfully!");
  // signal the app to attempt playing theme music on the next page
  try{
    localStorage.setItem('voxt-music-autoplay','1');
    localStorage.setItem('voxt-music-state','playing');
  }catch(e){}
  window.location.href = rootRoute();

}

