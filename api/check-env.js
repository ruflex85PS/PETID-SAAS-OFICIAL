export default function handler(req, res) {
  res.status(200).json({
    hasServiceRoleKey: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
    hasViteServiceRoleKey: !!process.env.VITE_SUPABASE_SERVICE_ROLE_KEY,
    hasViteAnonKey: !!process.env.VITE_SUPABASE_ANON_KEY,
  })
}
