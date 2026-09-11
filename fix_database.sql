-- Permitir crear nuevas organizaciones al registrarse
CREATE POLICY "org_insert_any" ON organizations FOR INSERT WITH CHECK (true);

-- Restaurar los nombres originales de las plantillas que fueron sobrescritos por el Debug
UPDATE whatsapp_templates SET name = 'Seguimiento post-consulta' WHERE template_type = 'followup_postconsult';
UPDATE whatsapp_templates SET name = 'Respuesta a Reprogramar' WHERE template_type = 'reschedule_reply';
UPDATE whatsapp_templates SET name = 'Recuperación de cupo' WHERE template_type = 'slot_recovery';
