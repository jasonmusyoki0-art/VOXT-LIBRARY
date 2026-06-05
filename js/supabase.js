window.test123 = "hello";

window.SUPABASE_URL =
"https://stuqfuwbgcicybruyppv.supabase.co";

window.SUPABASE_KEY =
"eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InN0dXFmdXdiZ2NpY3licnV5cHB2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODA0OTQ5MTQsImV4cCI6MjA5NjA3MDkxNH0.SjCXzuuGb1Q9Ar4BFoZeErm5wMz7whBbKsIPxGq_rJs";

window.supabaseClient =
supabase.createClient(
  window.SUPABASE_URL,
  window.SUPABASE_KEY
);

window.isAdmin = async function(){

  const {

    data:{ user }

  } = await supabaseClient.auth.getUser();

  if(!user) return false;

  const { data, error } =
    await supabaseClient
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if(error){
    console.error("isAdmin error:", error);
    return false;
  }

  

  return data && data.role === "admin";

};

window.logout = async function(){
  await supabaseClient.auth.signOut();
  window.location.href = "login.html";
};

 