window.signUp = async function(){

  const email =
    document.getElementById("email").value;

  const password =
    document.getElementById("password").value;

  const username =
    document.getElementById("username").value;

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
    data.user.id;

  await supabaseClient
    .from("profiles")
    .insert([{

      id:userId,

      username,

      email,

      role:"reader"

    }]);

  alert(
    "Account Created!"
  );

}

window.signIn =
async function(){
  const email = document.getElementById("email").value.trim();
  const password = document.getElementById("password").value.trim();

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
  window.location.href = "index.html";

}

