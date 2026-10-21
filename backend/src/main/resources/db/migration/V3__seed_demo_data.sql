-- EthioBridge Seed Demo Data Migration V3

-- 1. App Users (corresponding to Keycloak test accounts)
INSERT INTO app_user (id, keycloak_subject, email, full_name, status) VALUES
('a1111111-1111-1111-1111-111111111101', '11111111-1111-1111-1111-111111111101', 'seeker1@ethiobridge.et', 'Sara Bekele', 'ACTIVE'),
('a2222222-2222-2222-2222-222222222201', '22222222-2222-2222-2222-222222222201', 'provider1@ethiobridge.et', 'Dawit Tadesse', 'ACTIVE'),
('a2222222-2222-2222-2222-222222222202', '22222222-2222-2222-2222-222222222202', 'provider2@ethiobridge.et', 'Bethlehem Haile', 'ACTIVE'),
('a3333333-3333-3333-3333-333333333301', '33333333-3333-3333-3333-333333333301', 'dualuser@ethiobridge.et', 'Abebe Kebede', 'ACTIVE'),
('a4444444-4444-4444-4444-444444444401', '44444444-4444-4444-4444-444444444401', 'admin@ethiobridge.et', 'System Administrator', 'ACTIVE')
ON CONFLICT (keycloak_subject) DO NOTHING;

-- 2. Seeker Profiles
INSERT INTO seeker_profile (id, user_id, headline, bio, location_id) VALUES
('b1111111-1111-1111-1111-111111111101', 'a1111111-1111-1111-1111-111111111101', 'Tech Lead at Addis Systems', 'Hiring top engineering and trade talent across Ethiopia.', 1),
('b3333333-3333-3333-3333-333333333301', 'a3333333-3333-3333-3333-333333333301', 'Entrepreneur & Project Manager', 'Seeking dependable developers and local service professionals.', 1)
ON CONFLICT (user_id) DO NOTHING;

-- 3. Provider Profiles
INSERT INTO provider_profile (id, user_id, headline, bio, years_experience, location_id, availability, hourly_rate, category_focus, profile_text) VALUES
('c2222222-2222-2222-2222-222222222201', 'a2222222-2222-2222-2222-222222222201', 'Senior Backend Engineer', 'Backend specialist with 5 years crafting Java, Spring Boot, and PostgreSQL distributed systems.', 5, 1, 'FULL_TIME', 850.00, 'EMPLOYMENT', 'Senior Backend Engineer. 5 years building Java, Spring Boot microservices, high-throughput PostgreSQL queries, and robust REST APIs.'),
('c2222222-2222-2222-2222-222222222202', 'a2222222-2222-2222-2222-222222222202', 'Full-Stack Angular & Python Developer', 'Experienced modern web application architect with Angular, TypeScript, Python, and responsive UI design.', 4, 1, 'PART_TIME', 650.00, 'FREELANCING', 'Full-Stack Developer. 4 years developing Angular and TypeScript client architectures, Figma prototyping, and Python services.'),
('c3333333-3333-3333-3333-333333333301', 'a3333333-3333-3333-3333-333333333301', 'Certified Electrical & Maintenance Technician', 'Licensed electrician for residential and commercial wiring, installations, and maintenance in Addis Ababa.', 6, 1, 'HOURLY', 450.00, 'LOCAL_SERVICE', 'Certified Electrician with 6 years experience in residential wiring, electrical fault diagnosis, panel upgrades, and socket fitting.')
ON CONFLICT (user_id) DO NOTHING;

-- 4. Provider Skills
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

-- 5. Listings (One for each core pillar: Employment, Freelancing, Local Service)
INSERT INTO listing (id, owner_user_id, listing_type, title, description, service_category_id, location_id, is_remote, budget_min, budget_max, currency, availability_required, seniority, status, published_at) VALUES
('d1111111-1111-1111-1111-111111111101', 'a1111111-1111-1111-1111-111111111101', 'JOB', 'Junior Backend Developer', 'Join our core platform engineering team to build enterprise REST APIs using Java, Spring Boot, and PostgreSQL. Must understand clean code and relational databases.', 1, 1, false, 20000.00, 35000.00, 'ETB', 'FULL_TIME', 'JUNIOR', 'OPEN', now()),

('d2222222-2222-2222-2222-222222222202', 'a1111111-1111-1111-1111-111111111101', 'FREELANCE_PROJECT', 'Responsive Web Application Redesign', 'Design and implement an interactive and accessible web frontend using Angular and TypeScript. Familiarity with modern Figma design tokens is required.', 5, 1, true, 30000.00, 50000.00, 'ETB', 'PART_TIME', 'MID', 'OPEN', now()),

('d3333333-3333-3333-3333-333333333303', 'a3333333-3333-3333-3333-333333333301', 'LOCAL_SERVICE_REQUEST', 'Emergency Home Electrical Rewiring', 'Need an experienced electrician in Bole area to diagnose recurring short circuits and install upgraded circuit breakers.', 7, 1, false, 3000.00, 8000.00, 'ETB', 'ONE_OFF', 'MID', 'OPEN', now())
ON CONFLICT (id) DO NOTHING;

-- 6. Listing Skills
INSERT INTO listing_skill (listing_id, skill_id, requirement, weight) VALUES
('d1111111-1111-1111-1111-111111111101', 1, 'REQUIRED', 1.000), -- Java
('d1111111-1111-1111-1111-111111111101', 3, 'REQUIRED', 0.800), -- SQL
('d1111111-1111-1111-1111-111111111101', 2, 'PREFERRED', 0.500), -- Spring Boot
('d2222222-2222-2222-2222-222222222202', 5, 'REQUIRED', 1.000), -- Angular
('d2222222-2222-2222-2222-222222222202', 6, 'REQUIRED', 0.800), -- TypeScript
('d2222222-2222-2222-2222-222222222202', 8, 'PREFERRED', 0.600), -- Figma
('d3333333-3333-3333-3333-333333333303', 11, 'REQUIRED', 1.000) -- Wiring
ON CONFLICT (listing_id, skill_id) DO NOTHING;

-- 7. Sample Application
INSERT INTO application (id, listing_id, applicant_user_id, provider_profile_id, cover_note, proposed_rate, status) VALUES
('e1111111-1111-1111-1111-111111111101', 'd1111111-1111-1111-1111-111111111101', 'a2222222-2222-2222-2222-222222222201', 'c2222222-2222-2222-2222-222222222201', 'I have 5 years building resilient Java/Spring Boot services. Looking forward to discussing this opportunity.', 28000.00, 'SUBMITTED')
ON CONFLICT (listing_id, applicant_user_id) DO NOTHING;
