-- V17: Seed full comprehensive test personas and demo profiles into database
-- Ensures all Seeker, Provider, Dual-role, and Admin accounts are fully seeded with rich info, skills, and password_hash

-- 1. Ensure test personas exist in app_user with ACTIVE status, verified flags, and password123 hash
-- BCrypt: $2a$10$QKpQPglvSBO5R.HDHcJzGO0sR5vfbVkaXW8NIkGQPWoJ8P69zNbDe ('password123')
INSERT INTO app_user (id, keycloak_subject, email, full_name, password_hash, phone_number, is_verified, phone_verified, email_verified, status)
VALUES
('a1111111-1111-1111-1111-111111111101', '11111111-1111-1111-1111-111111111101', 'seeker1@ethiobridge.et', 'Sara Bekele', '$2a$10$QKpQPglvSBO5R.HDHcJzGO0sR5vfbVkaXW8NIkGQPWoJ8P69zNbDe', '+251911223344', true, true, true, 'ACTIVE'),
('a2222222-2222-2222-2222-222222222201', '22222222-2222-2222-2222-222222222201', 'provider1@ethiobridge.et', 'Dawit Tadesse', '$2a$10$QKpQPglvSBO5R.HDHcJzGO0sR5vfbVkaXW8NIkGQPWoJ8P69zNbDe', '+251922334455', true, true, true, 'ACTIVE'),
('a2222222-2222-2222-2222-222222222202', '22222222-2222-2222-2222-222222222202', 'provider2@ethiobridge.et', 'Bethlehem Haile', '$2a$10$QKpQPglvSBO5R.HDHcJzGO0sR5vfbVkaXW8NIkGQPWoJ8P69zNbDe', '+251933445566', true, true, true, 'ACTIVE'),
('a3333333-3333-3333-3333-333333333301', '33333333-3333-3333-3333-333333333301', 'dualuser@ethiobridge.et', 'Abebe Kebede', '$2a$10$QKpQPglvSBO5R.HDHcJzGO0sR5vfbVkaXW8NIkGQPWoJ8P69zNbDe', '+251944556677', true, true, true, 'ACTIVE'),
('a4444444-4444-4444-4444-444444444401', '44444444-4444-4444-4444-444444444401', 'admin@ethiobridge.et', 'System Administrator', '$2a$10$QKpQPglvSBO5R.HDHcJzGO0sR5vfbVkaXW8NIkGQPWoJ8P69zNbDe', '+251955667788', true, true, true, 'ACTIVE')
ON CONFLICT (keycloak_subject) DO UPDATE SET
    email = EXCLUDED.email,
    full_name = EXCLUDED.full_name,
    password_hash = COALESCE(app_user.password_hash, EXCLUDED.password_hash),
    phone_number = COALESCE(app_user.phone_number, EXCLUDED.phone_number),
    is_verified = true,
    phone_verified = true,
    email_verified = true,
    status = 'ACTIVE';

-- 2. Ensure roles exist in app_user_role
INSERT INTO app_user_role (user_id, role) VALUES
('a1111111-1111-1111-1111-111111111101', 'SEEKER'),
('a2222222-2222-2222-2222-222222222201', 'PROVIDER'),
('a2222222-2222-2222-2222-222222222202', 'PROVIDER'),
('a3333333-3333-3333-3333-333333333301', 'SEEKER'),
('a3333333-3333-3333-3333-333333333301', 'PROVIDER'),
('a4444444-4444-4444-4444-444444444401', 'ADMIN')
ON CONFLICT (user_id, role) DO NOTHING;

-- 3. Ensure Seeker Profiles
INSERT INTO seeker_profile (id, user_id, headline, bio, location_id) VALUES
('b1111111-1111-1111-1111-111111111101', 'a1111111-1111-1111-1111-111111111101', 'Tech Lead at Addis Systems', 'Hiring top engineering and trade talent across Ethiopia.', 1),
('b3333333-3333-3333-3333-333333333301', 'a3333333-3333-3333-3333-333333333301', 'Entrepreneur & Project Manager', 'Seeking dependable developers and local service professionals.', 1)
ON CONFLICT (user_id) DO UPDATE SET
    headline = EXCLUDED.headline,
    bio = EXCLUDED.bio;

-- 4. Ensure Provider Profiles with pro status, rates, and rich bios
INSERT INTO provider_profile (id, user_id, headline, bio, years_experience, location_id, availability, hourly_rate, category_focus, profile_text, is_pro) VALUES
('c2222222-2222-2222-2222-222222222201', 'a2222222-2222-2222-2222-222222222201', 'Senior Backend Engineer', 'Backend specialist with 5 years crafting Java, Spring Boot, and PostgreSQL distributed systems.', 5, 1, 'FULL_TIME', 850.00, 'EMPLOYMENT', 'Senior Backend Engineer. 5 years building Java, Spring Boot microservices, high-throughput PostgreSQL queries, and robust REST APIs.', true),
('c2222222-2222-2222-2222-222222222202', 'a2222222-2222-2222-2222-222222222202', 'Full-Stack Angular & Python Developer', 'Experienced modern web application architect with Angular, TypeScript, Python, and responsive UI design.', 4, 1, 'PART_TIME', 650.00, 'FREELANCING', 'Full-Stack Developer. 4 years developing Angular and TypeScript client architectures, Figma prototyping, and Python services.', false),
('c3333333-3333-3333-3333-333333333301', 'a3333333-3333-3333-3333-333333333301', 'Certified Electrical & Maintenance Technician', 'Licensed electrician for residential and commercial wiring, installations, and maintenance in Addis Ababa.', 6, 1, 'HOURLY', 450.00, 'LOCAL_SERVICE', 'Certified Electrician with 6 years experience in residential wiring, electrical fault diagnosis, panel upgrades, and socket fitting.', false)
ON CONFLICT (user_id) DO UPDATE SET
    headline = EXCLUDED.headline,
    bio = EXCLUDED.bio,
    hourly_rate = EXCLUDED.hourly_rate,
    availability = EXCLUDED.availability;

-- 5. Ensure Provider Skills
INSERT INTO provider_skill (provider_profile_id, skill_id, proficiency, years_experience) VALUES
('c2222222-2222-2222-2222-222222222201', 1, 5, 5.0), -- Java
('c2222222-2222-2222-2222-222222222201', 2, 5, 4.5), -- Spring Boot
('c2222222-2222-2222-2222-222222222201', 3, 4, 5.0), -- SQL
('c2222222-2222-2222-2222-222222222201', 4, 5, 4.0), -- PostgreSQL
('c2222222-2222-2222-2222-222222222202', 5, 5, 4.0), -- Angular
('c2222222-2222-2222-2222-222222222202', 6, 5, 4.0), -- TypeScript
('c2222222-2222-2222-2222-222222222202', 7, 4, 3.0), -- Python
('c2222222-2222-2222-2222-222222222202', 8, 4, 2.5), -- Figma
('c3333333-3333-3333-3333-333333333301', 11, 5, 6.0), -- Wiring
('c3333333-3333-3333-3333-333333333301', 12, 3, 3.0)  -- Pipefitting
ON CONFLICT (provider_profile_id, skill_id) DO NOTHING;
