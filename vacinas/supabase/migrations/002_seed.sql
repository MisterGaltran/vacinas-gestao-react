-- Seed: Calendário Nacional de Vacinação (PNI) — 0 a 18 meses
-- Execute no SQL Editor após criar as tabelas

INSERT INTO vaccine_types (name, disease, dose_number, total_doses, recommended_age_months, min_interval_days, description, is_custom) VALUES
-- Ao nascer
('BCG', 'Tuberculose', 1, 1, 0, NULL, 'Dose única ao nascer. Protege contra formas graves de tuberculose.', false),
('Hepatite B', 'Hepatite B', 1, 1, 0, NULL, 'Dose única ao nascer. Previne hepatite B.', false),

-- 2 meses
('Pentavalente', 'Difteria, Tétano, Coqueluche, Haemophilus influenzae B, Hepatite B', 1, 3, 2, 60, '1ª dose. Protege contra 5 doenças.', false),
('VIP', 'Poliomielite', 1, 3, 2, 60, '1ª dose. Vacina inativada contra poliomielite (paralisia infantil).', false),
('Pneumocócica 10V', 'Pneumonia, Meningite pneumocócica, Otite', 1, 2, 2, 60, '1ª dose. Protege contra 10 sorotipos de pneumococos.', false),
('Rotavírus Humano', 'Diarreia por rotavírus', 1, 2, 2, 60, '1ª dose. Previne diarreia grave causada por rotavírus.', false),

-- 3 meses
('Meningocócica C', 'Meningite meningocócica tipo C', 1, 2, 3, 60, '1ª dose. Protege contra meningite bacteriana tipo C.', false),

-- 4 meses
('Pentavalente', 'Difteria, Tétano, Coqueluche, Haemophilus influenzae B, Hepatite B', 2, 3, 4, 60, '2ª dose. Intervalo mínimo de 60 dias após 1ª dose.', false),
('VIP', 'Poliomielite', 2, 3, 4, 60, '2ª dose. Intervalo mínimo de 60 dias após 1ª dose.', false),
('Pneumocócica 10V', 'Pneumonia, Meningite pneumocócica, Otite', 2, 2, 4, 60, '2ª dose. Intervalo mínimo de 60 dias após 1ª dose.', false),
('Rotavírus Humano', 'Diarreia por rotavírus', 2, 2, 4, 60, '2ª dose. Intervalo mínimo de 60 dias após 1ª dose.', false),

-- 5 meses
('Meningocócica C', 'Meningite meningocócica tipo C', 2, 2, 5, 60, '2ª dose. Intervalo mínimo de 60 dias após 1ª dose.', false),

-- 6 meses
('Pentavalente', 'Difteria, Tétano, Coqueluche, Haemophilus influenzae B, Hepatite B', 3, 3, 6, 60, '3ª dose. Intervalo mínimo de 60 dias após 2ª dose.', false),
('VIP', 'Poliomielite', 3, 3, 6, 60, '3ª dose. Intervalo mínimo de 60 dias após 2ª dose.', false),
('Influenza', 'Gripe (Influenza)', 1, 2, 6, 30, '1ª dose. Vacina anual contra gripe.', false),

-- 7 meses
('Influenza', 'Gripe (Influenza)', 2, 2, 7, 30, '2ª dose. Intervalo mínimo de 30 dias após 1ª dose.', false),

-- 9 meses
('Febre Amarela', 'Febre Amarela', 1, 1, 9, NULL, 'Dose única. Protege contra febre amarela.', false),

-- 12 meses
('Tríplice Viral', 'Sarampo, Caxumba, Rubéola', 1, 2, 12, 180, '1ª dose. Protege contra sarampo, caxumba e rubéola.', false),
('Hepatite A', 'Hepatite A', 1, 1, 12, NULL, 'Dose única. Previne hepatite A.', false),
('Pneumocócica 10V (Reforço)', 'Pneumonia, Meningite pneumocócica, Otite', 1, 1, 12, NULL, 'Dose de reforço. Após esquema primário de 2 doses.', false),

-- 15 meses
('DTP (Reforço)', 'Difteria, Tétano, Coqueluche', 1, 1, 15, NULL, 'Reforço da tríplice bacteriana. Após esquema da Pentavalente.', false),
('Meningocócica C (Reforço)', 'Meningite meningocócica tipo C', 1, 1, 15, NULL, 'Reforço. Após esquema primário de 2 doses.', false),
('VIP (Reforço)', 'Poliomielite', 1, 1, 15, NULL, 'Reforço. Após esquema primário de 3 doses de VIP.', false),

-- 18 meses
('Tríplice Viral', 'Sarampo, Caxumba, Rubéola', 2, 2, 18, NULL, '2ª dose. Intervalo mínimo de 6 meses após 1ª dose.', false);