// assets/js/supabase.js
const SUPABASE_URL = "https://mgpnpbexvkoujtgmhksj.supabase.co";
const SUPABASE_ANON_KEY = "sb_publishable_k4jCWy6fgE_qk8B6C3Hahg_JFwYJ1ht";
const GAS_WEBAPP_URL = "https://script.google.com/macros/s/YOUR_GAS_DEPLOYMENT_ID/exec";

const DEFAULT_PEGAWAI_IMG = "assets/img/pegawai.png";

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

function getDriveImageUrl(fileId, fallback = DEFAULT_PEGAWAI_IMG) {
  if (!fileId || String(fileId).trim() === "") return fallback;
  return `https://lh3.googleusercontent.com/d/${String(fileId).trim()}`;
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

  const { data: profile, error: profError } = await client
    .from("users")
    .select("*")
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

async function refreshUserProfile() {
  const sessionData = await checkSession();
  if (!sessionData) return null;

  const client = initSupabase();
  let profile = sessionData.profile || {};

  try {
    if (client && sessionData.user?.id) {
      const { data, error } = await client
        .from("users")
        .select("*")
        .eq("auth_id", sessionData.user.id)
        .single();

      if (!error && data) {
        profile = { ...profile, ...data };
        sessionData.profile = profile;
        localStorage.setItem("bbws_session", JSON.stringify(sessionData));
      }
    }
  } catch (e) {
    console.warn("Mode offline: menggunakan cache profil sesi lokal.");
  }

  return profile;
}

async function logout() {
  const client = initSupabase();
  if (client) {
    await client.auth.signOut();
  }
  localStorage.removeItem("bbws_session");
  window.location.href = "index.html";
}
