-- EthioBridge Seed Reference Data Migration V2

-- 1. Service Categories
INSERT INTO service_category (id, slug, name, applicable_type) VALUES
(1, 'software-engineering', 'Software Engineering', 'JOB'),
(2, 'it-support', 'IT Support', 'JOB'),
(3, 'design', 'Design', 'FREELANCE_PROJECT'),
(4, 'writing', 'Writing and Translation', 'FREELANCE_PROJECT'),
(5, 'web-development', 'Web Development', 'FREELANCE_PROJECT'),
(6, 'plumbing', 'Plumbing', 'LOCAL_SERVICE_REQUEST'),
(7, 'electrical', 'Electrical', 'LOCAL_SERVICE_REQUEST'),
(8, 'cleaning', 'Cleaning', 'LOCAL_SERVICE_REQUEST'),
(9, 'tutoring', 'Tutoring', 'LOCAL_SERVICE_REQUEST')
ON CONFLICT (slug) DO NOTHING;

-- 2. Skills
INSERT INTO skill (id, slug, name, category, is_active) VALUES
(1, 'java', 'Java', 'TECH', true),
(2, 'spring-boot', 'Spring Boot', 'TECH', true),
(3, 'sql', 'SQL', 'TECH', true),
(4, 'postgresql', 'PostgreSQL', 'TECH', true),
(5, 'angular', 'Angular', 'TECH', true),
(6, 'typescript', 'TypeScript', 'TECH', true),
(7, 'python', 'Python', 'TECH', true),
(8, 'figma', 'Figma', 'TECH', true),
(9, 'ui-design', 'UI Design', 'TECH', true),
(10, 'translation-amh-en', 'Amharic–English Translation', 'LANGUAGE', true),
(11, 'wiring', 'Electrical Wiring', 'TRADES', true),
(12, 'pipefitting', 'Pipefitting', 'TRADES', true),
(13, 'communication', 'Communication', 'SOFT', true)
ON CONFLICT (slug) DO NOTHING;

-- 3. Locations
INSERT INTO location (id, name, region, country, latitude, longitude) VALUES
(1, 'Addis Ababa - Bole', 'Addis Ababa', 'ET', 9.0000, 38.7800),
(2, 'Addis Ababa - Arada', 'Addis Ababa', 'ET', 9.0300, 38.7500),
(3, 'Addis Ababa - Yeka', 'Addis Ababa', 'ET', 9.0300, 38.8000),
(4, 'Adama', 'Oromia', 'ET', 8.5400, 39.2700),
(5, 'Bahir Dar', 'Amhara', 'ET', 11.5900, 37.3900),
(6, 'Hawassa', 'Sidama', 'ET', 7.0500, 38.4700),
(7, 'Mekelle', 'Tigray', 'ET', 13.5000, 39.4700),
(8, 'Dire Dawa', 'Dire Dawa', 'ET', 9.6000, 41.8600),
(9, 'Gondar', 'Amhara', 'ET', 12.6000, 37.4600)
ON CONFLICT (name, region) DO NOTHING;

-- Reset sequences
SELECT setval('service_category_id_seq', (SELECT MAX(id) FROM service_category));
SELECT setval('skill_id_seq', (SELECT MAX(id) FROM skill));
SELECT setval('location_id_seq', (SELECT MAX(id) FROM location));
