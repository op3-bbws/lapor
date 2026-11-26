// GANTI DENGAN ANON KEY (BUKAN SERVICE ROLE KEY!)
const SUPABASE_URL = "https://mgpnpbexvkoujtgmhksj.supabase.co";
const SUPABASE_ANON_KEY = "sb_publishable_k4jCWy6fgE_qk8B6C3Hahg_JFwYJ1ht"; 

let supabaseClient = null;

function initSupabase() {
  if (supabaseClient) return supabaseClient;
  if (typeof window.supabase !== "undefined") {
    supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
    return supabaseClient;
  }
  console.error("Supabase SDK belum dimuat di HTML.");
  return null;
}

async function login(idPetugas, password) {
  const client = initSupabase();
  if (!client) throw new Error("Supabase belum siap.");

  const email = idPetugas.toLowerCase().replace(/\s+/g, "") + "@bbws-brantas.go.id";

  const { data, error } = await client.auth.signInWithPassword({
    email,
    password
  });

  if (error) throw error;

  // Ambil profile (termasuk D.I untuk keperluan peta/filter nanti)
  const { data: profile, error: profError } = await client
    .from("users")
    .select("role, nama, daerah_irigasi, id_petugas")
    .eq("auth_id", data.user.id)
    .single();

  if (profError) throw profError;

  localStorage.setItem("bbws_session", JSON.stringify({
    access_token: data.session?.access_token ?? null,
    refresh_token: data.session?.refresh_token ?? null,
    user: data.user,
    profile
  }));

  return { user: data.user, profile };
}

async function checkSession() {
  const client = initSupabase();
  const rawSession = localStorage.getItem("bbws_session");

  if (!rawSession) {
    window.location.href = "index.html";
    return null;
  }

  try {
    const parsed = JSON.parse(rawSession);
    if (client && parsed.access_token && parsed.refresh_token) {
      await client.auth.setSession({
        access_token: parsed.access_token,
        refresh_token: parsed.refresh_token
      });
    }
    return parsed;
  } catch (err) {
    localStorage.removeItem("bbws_session");
    window.location.href = "index.html";
    return null;
  }
}

async function logout() {
  const client = initSupabase();
  if (client) {
    await client.auth.signOut();
  }
  localStorage.removeItem("bbws_session");
  window.location.href = "index.html";
}
