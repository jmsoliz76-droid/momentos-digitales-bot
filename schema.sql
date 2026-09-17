-- ============================================================
-- ESQUEMA COMPLETO - Momentos Digitales Bot
-- Ejecutar esto en Supabase: Project > SQL Editor > New query
-- ============================================================

-- Extensión para generar UUIDs
create extension if not exists "uuid-ossp";

-- ------------------------------------------------------------
-- CLIENTES
-- ------------------------------------------------------------
create table if not exists clientes (
  id uuid primary key default uuid_generate_v4(),
  telefono text unique not null,         -- número de WhatsApp del cliente, formato internacional sin '+'
  nombre text,                            -- se completa cuando el cliente lo indica
  bot_activo boolean not null default true, -- false = tomado por atención humana
  creado_en timestamptz not null default now(),
  actualizado_en timestamptz not null default now()
);

-- ------------------------------------------------------------
-- CONVERSACIONES (una por cliente; guarda el estado de la máquina de estados)
-- ------------------------------------------------------------
create table if not exists conversaciones (
  id uuid primary key default uuid_generate_v4(),
  cliente_id uuid not null references clientes(id) on delete cascade,
  estado text not null default 'INICIO',
  -- INICIO, MENU, VIENDO_MODELOS, VIENDO_PRECIOS, RECOPILANDO_DATOS,
  -- RESUMEN_CONFIRMACION, PEDIDO_CONFIRMADO, ATENCION_HUMANA
  evento_tipo text,                       -- boda | xv | cumpleanos | otro
  plan_sugerido text,                     -- esencial | premium | exclusivo
  requiere_atencion boolean not null default false,
  ultimo_mensaje_en timestamptz default now(),
  creado_en timestamptz not null default now(),
  actualizado_en timestamptz not null default now(),
  unique(cliente_id)
);

-- ------------------------------------------------------------
-- MENSAJES (historial completo, visible en el panel)
-- ------------------------------------------------------------
create table if not exists mensajes (
  id uuid primary key default uuid_generate_v4(),
  conversacion_id uuid not null references conversaciones(id) on delete cascade,
  remitente text not null,                -- cliente | bot | humano
  contenido text not null,
  whatsapp_message_id text,               -- id que devuelve Meta, útil para depurar
  creado_en timestamptz not null default now()
);

create index if not exists idx_mensajes_conversacion on mensajes(conversacion_id);

-- ------------------------------------------------------------
-- PLANES (precios editables, NO quemados en el código)
-- ------------------------------------------------------------
create table if not exists planes (
  id text primary key,                    -- esencial | premium | exclusivo
  nombre text not null,
  precio numeric(10,2) not null,
  orden int not null default 0,
  caracteristicas jsonb not null default '[]', -- lista de strings
  activo boolean not null default true
);

insert into planes (id, nombre, precio, orden, caracteristicas) values
('esencial', 'Plan Esencial', 80, 1, '["Diseño elegante prediseñado","Datos del evento personalizados","Cuenta regresiva","Botón de WhatsApp","Diseño responsive","Entrega en 48h"]'),
('premium', 'Plan Premium', 100, 2, '["Todo lo del plan Esencial","Galería de fotos","Música personalizada","Ubicación con Google Maps","Confirmación de asistencia","Itinerario del evento","Entrega en 24h"]'),
('exclusivo', 'Plan Exclusivo', 120, 3, '["Todo lo del plan Premium","Diseño completamente personalizado","Animaciones exclusivas","Pase digital individual","Código de vestimenta","Sugerencia de regalos","Entrega en 24h + revisiones"]')
on conflict (id) do nothing;

-- ------------------------------------------------------------
-- CATÁLOGO DE MODELOS (editable desde el panel, sin tocar código)
-- ------------------------------------------------------------
create table if not exists catalogo_modelos (
  id uuid primary key default uuid_generate_v4(),
  nombre text not null,
  codigo text unique not null,            -- ej: BODA-01, XV-03
  categoria text not null,                -- boda | xv | cumpleanos | otro
  precio numeric(10,2),                   -- opcional, si un modelo tiene precio propio
  imagen_url text,
  demo_url text,
  caracteristicas jsonb default '[]',
  disponible boolean not null default true,
  creado_en timestamptz not null default now()
);

create index if not exists idx_catalogo_categoria on catalogo_modelos(categoria);

-- ------------------------------------------------------------
-- PEDIDOS (ficha que se arma con los datos recopilados)
-- ------------------------------------------------------------
create table if not exists pedidos (
  id uuid primary key default uuid_generate_v4(),
  cliente_id uuid not null references clientes(id) on delete cascade,
  evento_tipo text,
  plan_id text references planes(id),
  datos jsonb not null default '{}',      -- nombre, fecha, lugar, musica, colores, etc. (flexible)
  estado text not null default 'NUEVO',
  -- NUEVO, INTERESADO, ESPERANDO_DATOS, DATOS_COMPLETOS, PEDIDO_CONFIRMADO, EN_DISENO, ENTREGADO
  creado_en timestamptz not null default now(),
  actualizado_en timestamptz not null default now()
);

create index if not exists idx_pedidos_cliente on pedidos(cliente_id);

-- ------------------------------------------------------------
-- Función auxiliar para mantener actualizado_en al día (opcional pero útil)
-- ------------------------------------------------------------
create or replace function set_actualizado_en()
returns trigger as $$
begin
  new.actualizado_en = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists trg_clientes_actualizado on clientes;
create trigger trg_clientes_actualizado before update on clientes
  for each row execute function set_actualizado_en();

drop trigger if exists trg_conversaciones_actualizado on conversaciones;
create trigger trg_conversaciones_actualizado before update on conversaciones
  for each row execute function set_actualizado_en();

drop trigger if exists trg_pedidos_actualizado on pedidos;
create trigger trg_pedidos_actualizado before update on pedidos
  for each row execute function set_actualizado_en();
