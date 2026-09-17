const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error(
    '[ERROR] Faltan SUPABASE_URL o SUPABASE_SERVICE_ROLE_KEY en las variables de entorno.'
  );
}

// Usamos la Service Role Key porque este cliente corre SOLO en el backend.
// Nunca debe llegar al frontend / panel público.
const supabase = createClient(supabaseUrl, supabaseKey);

module.exports = supabase;
