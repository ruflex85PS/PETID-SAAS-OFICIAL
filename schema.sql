-- ============================================================
-- PETID - Schema completo v1.0
-- Plataforma SaaS multi-industria basada en citas
-- ============================================================

-- Extensiones necesarias
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================
-- TABLA: organizations
-- Cada negocio que usa PETID
-- ============================================================
CREATE TABLE organizations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  industry TEXT NOT NULL DEFAULT 'veterinary',
  phone TEXT,
  email TEXT,
  address TEXT,
  logo_url TEXT,
  settings JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- TABLA: profiles
-- Extiende auth.users de Supabase
-- ============================================================
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  organization_id UUID REFERENCES organizations(id) ON DELETE SET NULL,
  full_name TEXT,
  role TEXT NOT NULL DEFAULT 'staff' CHECK (role IN ('owner', 'admin', 'staff')),
  phone TEXT,
  avatar_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- TABLA: customers
-- Clientes / propietarios genéricos
-- ============================================================
CREATE TABLE customers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL,
  phone TEXT,
  whatsapp TEXT,
  email TEXT,
  address TEXT,
  notes TEXT,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- TABLA: pets (módulo veterinario)
-- ============================================================
CREATE TABLE pets (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  species TEXT NOT NULL DEFAULT 'dog' CHECK (species IN ('dog', 'cat', 'bird', 'rabbit', 'reptile', 'other')),
  breed TEXT,
  sex TEXT CHECK (sex IN ('male', 'female', 'unknown')),
  birth_date DATE,
  weight_kg DECIMAL(5,2),
  color TEXT,
  photo_url TEXT,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'deceased', 'transferred')),
  observations TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- TABLA: services
-- Servicios que ofrece el negocio
-- ============================================================
CREATE TABLE services (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  duration_minutes INTEGER NOT NULL DEFAULT 30,
  price DECIMAL(10,2),
  color TEXT DEFAULT '#4F46E5',
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- TABLA: appointments
-- Citas / reservas
-- ============================================================
CREATE TABLE appointments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE RESTRICT,
  pet_id UUID REFERENCES pets(id) ON DELETE SET NULL,
  service_id UUID REFERENCES services(id) ON DELETE SET NULL,
  assigned_to UUID REFERENCES profiles(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  notes TEXT,
  scheduled_at TIMESTAMPTZ NOT NULL,
  duration_minutes INTEGER NOT NULL DEFAULT 30,
  status TEXT NOT NULL DEFAULT 'scheduled' CHECK (status IN (
    'scheduled', 'confirmed', 'in_progress', 'completed', 'cancelled', 'no_show'
  )),
  cancellation_reason TEXT,
  reminder_24h_sent BOOLEAN DEFAULT FALSE,
  reminder_2h_sent BOOLEAN DEFAULT FALSE,
  followup_sent BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- TABLA: medical_records (módulo veterinario)
-- Historial clínico
-- ============================================================
CREATE TABLE medical_records (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  pet_id UUID NOT NULL REFERENCES pets(id) ON DELETE CASCADE,
  appointment_id UUID REFERENCES appointments(id) ON DELETE SET NULL,
  record_date DATE NOT NULL DEFAULT CURRENT_DATE,
  record_type TEXT NOT NULL DEFAULT 'consultation' CHECK (record_type IN (
    'consultation', 'vaccine', 'deworming', 'surgery', 'exam', 'other'
  )),
  diagnosis TEXT,
  treatment TEXT,
  medications TEXT,
  observations TEXT,
  next_visit_date DATE,
  created_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- TABLA: vaccines (módulo veterinario)
-- Registro de vacunas
-- ============================================================
CREATE TABLE vaccines (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  pet_id UUID NOT NULL REFERENCES pets(id) ON DELETE CASCADE,
  vaccine_name TEXT NOT NULL,
  applied_date DATE NOT NULL,
  next_due_date DATE,
  batch_number TEXT,
  notes TEXT,
  reminder_sent BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- TABLA: dewormings (módulo veterinario)
-- Desparasitaciones
-- ============================================================
CREATE TABLE dewormings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  pet_id UUID NOT NULL REFERENCES pets(id) ON DELETE CASCADE,
  product_name TEXT NOT NULL,
  applied_date DATE NOT NULL,
  next_due_date DATE,
  deworming_type TEXT DEFAULT 'internal' CHECK (deworming_type IN ('internal', 'external', 'both')),
  notes TEXT,
  reminder_sent BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- TABLA: automations
-- Registro de automatizaciones enviadas
-- ============================================================
CREATE TABLE automations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  automation_type TEXT NOT NULL CHECK (automation_type IN (
    'reminder_24h', 'reminder_2h', 'confirmation_request',
    'followup_postconsult', 'vaccine_reminder', 'deworming_reminder',
    'reactivation', 'slot_recovery'
  )),
  reference_id UUID,
  reference_type TEXT,
  customer_id UUID REFERENCES customers(id) ON DELETE SET NULL,
  channel TEXT DEFAULT 'whatsapp' CHECK (channel IN ('whatsapp', 'sms', 'email')),
  message_preview TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'failed', 'cancelled')),
  scheduled_for TIMESTAMPTZ,
  sent_at TIMESTAMPTZ,
  error_message TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- ÍNDICES para performance
-- ============================================================
CREATE INDEX idx_profiles_organization ON profiles(organization_id);
CREATE INDEX idx_customers_organization ON customers(organization_id);
CREATE INDEX idx_customers_status ON customers(organization_id, status);
CREATE INDEX idx_pets_organization ON pets(organization_id);
CREATE INDEX idx_pets_customer ON pets(customer_id);
CREATE INDEX idx_appointments_organization ON appointments(organization_id);
CREATE INDEX idx_appointments_scheduled ON appointments(organization_id, scheduled_at);
CREATE INDEX idx_appointments_status ON appointments(organization_id, status);
CREATE INDEX idx_appointments_customer ON appointments(customer_id);
CREATE INDEX idx_medical_records_pet ON medical_records(pet_id);
CREATE INDEX idx_vaccines_pet ON vaccines(pet_id);
CREATE INDEX idx_vaccines_due ON vaccines(organization_id, next_due_date);
CREATE INDEX idx_dewormings_due ON dewormings(organization_id, next_due_date);
CREATE INDEX idx_automations_org ON automations(organization_id, status);
CREATE INDEX idx_automations_scheduled ON automations(scheduled_for, status);

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================
ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE pets ENABLE ROW LEVEL SECURITY;
ALTER TABLE services ENABLE ROW LEVEL SECURITY;
ALTER TABLE appointments ENABLE ROW LEVEL SECURITY;
ALTER TABLE medical_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE vaccines ENABLE ROW LEVEL SECURITY;
ALTER TABLE dewormings ENABLE ROW LEVEL SECURITY;
ALTER TABLE automations ENABLE ROW LEVEL SECURITY;

-- Helper function: obtener organization_id del usuario actual
CREATE OR REPLACE FUNCTION get_user_organization_id()
RETURNS UUID AS $$
  SELECT organization_id FROM profiles WHERE id = auth.uid()
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- Organizations: solo ver la propia
CREATE POLICY "org_select_own" ON organizations
  FOR SELECT USING (id = get_user_organization_id());

CREATE POLICY "org_update_own" ON organizations
  FOR UPDATE USING (id = get_user_organization_id());

-- Profiles: ver y editar los de la misma org
CREATE POLICY "profiles_select_own_org" ON profiles
  FOR SELECT USING (organization_id = get_user_organization_id() OR id = auth.uid());

CREATE POLICY "profiles_insert_own" ON profiles
  FOR INSERT WITH CHECK (id = auth.uid());

CREATE POLICY "profiles_update_own" ON profiles
  FOR UPDATE USING (id = auth.uid() OR organization_id = get_user_organization_id());

-- Customers
CREATE POLICY "customers_org_all" ON customers
  FOR ALL USING (organization_id = get_user_organization_id());

-- Pets
CREATE POLICY "pets_org_all" ON pets
  FOR ALL USING (organization_id = get_user_organization_id());

-- Services
CREATE POLICY "services_org_all" ON services
  FOR ALL USING (organization_id = get_user_organization_id());

-- Appointments
CREATE POLICY "appointments_org_all" ON appointments
  FOR ALL USING (organization_id = get_user_organization_id());

-- Medical records
CREATE POLICY "medical_records_org_all" ON medical_records
  FOR ALL USING (organization_id = get_user_organization_id());

-- Vaccines
CREATE POLICY "vaccines_org_all" ON vaccines
  FOR ALL USING (organization_id = get_user_organization_id());

-- Dewormings
CREATE POLICY "dewormings_org_all" ON dewormings
  FOR ALL USING (organization_id = get_user_organization_id());

-- Automations
CREATE POLICY "automations_org_all" ON automations
  FOR ALL USING (organization_id = get_user_organization_id());

-- ============================================================
-- TRIGGERS: updated_at automático
-- ============================================================
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_organizations_updated BEFORE UPDATE ON organizations
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trg_profiles_updated BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trg_customers_updated BEFORE UPDATE ON customers
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trg_pets_updated BEFORE UPDATE ON pets
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trg_appointments_updated BEFORE UPDATE ON appointments
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ============================================================
-- TRIGGER: crear profile automáticamente al registrar usuario
-- ============================================================
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO profiles (id, full_name, role)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email),
    'owner'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- ============================================================
-- DATOS DE PRUEBA - Veterinaria Demo
-- ============================================================

-- Organización demo
INSERT INTO organizations (id, name, slug, industry, phone, email, address) VALUES
(
  '00000000-0000-0000-0000-000000000001',
  'Clínica Veterinaria PetCare',
  'petcare-demo',
  'veterinary',
  '+593 99 123 4567',
  'info@petcare.demo',
  'Av. Los Shyris 1234, Quito, Ecuador'
);

-- Servicios demo
INSERT INTO services (id, organization_id, name, description, duration_minutes, price, color) VALUES
('10000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000001', 'Consulta General', 'Revisión general del paciente', 30, 25.00, '#4F46E5'),
('10000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000001', 'Vacunación', 'Aplicación de vacunas', 15, 35.00, '#059669'),
('10000000-0000-0000-0000-000000000003', '00000000-0000-0000-0000-000000000001', 'Desparasitación', 'Tratamiento antiparasitario', 20, 20.00, '#D97706'),
('10000000-0000-0000-0000-000000000004', '00000000-0000-0000-0000-000000000001', 'Cirugía Menor', 'Procedimientos quirúrgicos menores', 90, 150.00, '#DC2626'),
('10000000-0000-0000-0000-000000000005', '00000000-0000-0000-0000-000000000001', 'Peluquería Canina', 'Baño y corte de pelo', 60, 30.00, '#7C3AED');

-- Clientes demo
INSERT INTO customers (id, organization_id, full_name, phone, whatsapp, email, address, notes) VALUES
('20000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000001', 'María González', '+593 98 765 4321', '+593 98 765 4321', 'maria@example.com', 'Calle Colón 456, Quito', 'Cliente frecuente. Prefiere citas en la mañana.'),
('20000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000001', 'Carlos Rodríguez', '+593 97 654 3210', '+593 97 654 3210', 'carlos@example.com', 'Av. Amazonas 789, Quito', NULL),
('20000000-0000-0000-0000-000000000003', '00000000-0000-0000-0000-000000000001', 'Ana Martínez', '+593 96 543 2109', '+593 96 543 2109', 'ana@example.com', 'Calle Veintimilla 321, Quito', 'Tiene 2 perros y 1 gato.'),
('20000000-0000-0000-0000-000000000004', '00000000-0000-0000-0000-000000000001', 'Luis Herrera', '+593 95 432 1098', NULL, NULL, NULL, NULL),
('20000000-0000-0000-0000-000000000005', '00000000-0000-0000-0000-000000000001', 'Sofía Torres', '+593 94 321 0987', '+593 94 321 0987', 'sofia@example.com', 'Calle Ladrón de Guevara 654', NULL);

-- Mascotas demo
INSERT INTO pets (id, organization_id, customer_id, name, species, breed, sex, birth_date, weight_kg, color, observations) VALUES
('30000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000001', '20000000-0000-0000-0000-000000000001', 'Max', 'dog', 'Golden Retriever', 'male', '2020-03-15', 28.5, 'Dorado', 'Alergia a ciertos alimentos. Evitar proteína de pollo.'),
('30000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000001', '20000000-0000-0000-0000-000000000002', 'Luna', 'cat', 'Siamés', 'female', '2021-07-20', 4.2, 'Crema y marrón', NULL),
('30000000-0000-0000-0000-000000000003', '00000000-0000-0000-0000-000000000001', '20000000-0000-0000-0000-000000000003', 'Rocky', 'dog', 'Bulldog Francés', 'male', '2019-11-10', 12.0, 'Atigrado', 'Problemas respiratorios leves.'),
('30000000-0000-0000-0000-000000000004', '00000000-0000-0000-0000-000000000001', '20000000-0000-0000-0000-000000000003', 'Mia', 'cat', 'Persa', 'female', '2022-01-05', 3.8, 'Blanca', NULL),
('30000000-0000-0000-0000-000000000005', '00000000-0000-0000-0000-000000000001', '20000000-0000-0000-0000-000000000004', 'Zeus', 'dog', 'Pastor Alemán', 'male', '2018-06-22', 35.0, 'Negro y café', 'Carácter fuerte. Llega bien con bozal.'),
('30000000-0000-0000-0000-000000000006', '00000000-0000-0000-0000-000000000001', '20000000-0000-0000-0000-000000000005', 'Bella', 'dog', 'Poodle', 'female', '2021-09-30', 5.5, 'Blanca', NULL);

-- Citas demo (fechas relativas a NOW() para que siempre sean válidas)
INSERT INTO appointments (id, organization_id, customer_id, pet_id, service_id, title, scheduled_at, duration_minutes, status, notes) VALUES
('40000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000001', '20000000-0000-0000-0000-000000000001', '30000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000001', 'Consulta General - Max', NOW() + INTERVAL '2 hours', 30, 'scheduled', 'Revisión rutinaria anual'),
('40000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000001', '20000000-0000-0000-0000-000000000002', '30000000-0000-0000-0000-000000000002', '10000000-0000-0000-0000-000000000002', 'Vacunación - Luna', NOW() + INTERVAL '1 day', 15, 'confirmed', NULL),
('40000000-0000-0000-0000-000000000003', '00000000-0000-0000-0000-000000000001', '20000000-0000-0000-0000-000000000003', '30000000-0000-0000-0000-000000000003', '10000000-0000-0000-0000-000000000005', 'Peluquería - Rocky', NOW() + INTERVAL '3 days', 60, 'scheduled', NULL),
('40000000-0000-0000-0000-000000000004', '00000000-0000-0000-0000-000000000001', '20000000-0000-0000-0000-000000000004', '30000000-0000-0000-0000-000000000005', '10000000-0000-0000-0000-000000000001', 'Consulta General - Zeus', NOW() - INTERVAL '1 day', 30, 'completed', 'Revisión de cadera'),
('40000000-0000-0000-0000-000000000005', '00000000-0000-0000-0000-000000000001', '20000000-0000-0000-0000-000000000005', '30000000-0000-0000-0000-000000000006', '10000000-0000-0000-0000-000000000003', 'Desparasitación - Bella', NOW() - INTERVAL '2 hours', 20, 'cancelled', 'Cliente canceló por viaje'),
('40000000-0000-0000-0000-000000000006', '00000000-0000-0000-0000-000000000001', '20000000-0000-0000-0000-000000000001', '30000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000002', 'Vacunación - Max', NOW() + INTERVAL '5 days', 15, 'scheduled', NULL);

-- Historial médico demo
INSERT INTO medical_records (organization_id, pet_id, appointment_id, record_date, record_type, diagnosis, treatment, medications, observations) VALUES
('00000000-0000-0000-0000-000000000001', '30000000-0000-0000-0000-000000000005', '40000000-0000-0000-0000-000000000004', CURRENT_DATE - 1, 'consultation', 'Displasia de cadera leve', 'Reposo relativo y analgésicos', 'Meloxicam 0.1mg/kg cada 24h por 5 días', 'Revisión en 30 días'),
('00000000-0000-0000-0000-000000000001', '30000000-0000-0000-0000-000000000001', NULL, CURRENT_DATE - 30, 'vaccine', NULL, 'Vacuna Cuádruple aplicada', NULL, 'Próxima vacuna en 1 año'),
('00000000-0000-0000-0000-000000000001', '30000000-0000-0000-0000-000000000002', NULL, CURRENT_DATE - 15, 'consultation', 'Otitis externa', 'Limpieza auricular + gotas óticas', 'Otomax 5 gotas cada 12h por 7 días', 'Respuesta positiva al tratamiento');

-- Vacunas demo
INSERT INTO vaccines (organization_id, pet_id, vaccine_name, applied_date, next_due_date, notes) VALUES
('00000000-0000-0000-0000-000000000001', '30000000-0000-0000-0000-000000000001', 'Parvovirus / Moquillo / Hepatitis', CURRENT_DATE - 365, CURRENT_DATE + 5, 'Refuerzo anual'),
('00000000-0000-0000-0000-000000000001', '30000000-0000-0000-0000-000000000001', 'Rabia', CURRENT_DATE - 300, CURRENT_DATE + 65, NULL),
('00000000-0000-0000-0000-000000000001', '30000000-0000-0000-0000-000000000002', 'Triple Felina', CURRENT_DATE - 180, CURRENT_DATE + 185, NULL),
('00000000-0000-0000-0000-000000000001', '30000000-0000-0000-0000-000000000003', 'Parvovirus / Moquillo', CURRENT_DATE - 400, CURRENT_DATE - 35, 'VENCIDA - Requiere refuerzo'),
('00000000-0000-0000-0000-000000000001', '30000000-0000-0000-0000-000000000005', 'Rabia', CURRENT_DATE - 200, CURRENT_DATE + 165, NULL);

-- Desparasitaciones demo
INSERT INTO dewormings (organization_id, pet_id, product_name, applied_date, next_due_date, deworming_type) VALUES
('00000000-0000-0000-0000-000000000001', '30000000-0000-0000-0000-000000000001', 'Drontal Plus', CURRENT_DATE - 90, CURRENT_DATE + 2, 'both'),
('00000000-0000-0000-0000-000000000001', '30000000-0000-0000-0000-000000000003', 'Milbemax', CURRENT_DATE - 120, CURRENT_DATE - 30, 'internal'),
('00000000-0000-0000-0000-000000000001', '30000000-0000-0000-0000-000000000006', 'Frontline Plus', CURRENT_DATE - 30, CURRENT_DATE + 30, 'external');
