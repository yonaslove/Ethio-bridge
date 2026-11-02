-- V13: Skill Assessment Quizzes and Verification Badges
ALTER TABLE provider_skill ADD COLUMN IF NOT EXISTS is_verified BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE provider_skill ADD COLUMN IF NOT EXISTS assessment_score INTEGER;
ALTER TABLE provider_skill ADD COLUMN IF NOT EXISTS verified_at TIMESTAMPTZ;

CREATE TABLE IF NOT EXISTS skill_assessment (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    skill_id BIGINT NOT NULL REFERENCES skill(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    category VARCHAR(100) NOT NULL,
    passing_score INTEGER NOT NULL DEFAULT 80,
    time_limit_minutes INTEGER NOT NULL DEFAULT 15,
    questions_json TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS user_skill_assessment (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES app_user(id) ON DELETE CASCADE,
    assessment_id UUID NOT NULL REFERENCES skill_assessment(id) ON DELETE CASCADE,
    skill_id BIGINT NOT NULL REFERENCES skill(id) ON DELETE CASCADE,
    score INTEGER NOT NULL,
    passed BOOLEAN NOT NULL,
    badge_awarded VARCHAR(100),
    completed_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Seed Assessments for Core Skills:
-- 1. Spring Boot (Skill ID: 2)
INSERT INTO skill_assessment (id, skill_id, title, category, passing_score, time_limit_minutes, questions_json)
VALUES (
    'e1111111-1111-1111-1111-111111111101',
    2,
    'Spring Boot & Backend Engineering Assessment',
    'TECH',
    80,
    15,
    '[{"id":1,"question":"What is the primary role of the Spring Boot @Transactional annotation?","options":["It caches query results in Redis","It wraps method execution in a database transaction, committing on success and rolling back on unhandled exceptions","It converts HTTP requests into JSON automatically","It exposes the method as a WebSocket endpoint"],"correctIndex":1,"explanation":"@Transactional ensures ACID database transaction boundaries and triggers rollback on RuntimeException."},{"id":2,"question":"In Spring Boot, which annotation is typically used to handle incoming HTTP POST requests with a deserialized JSON body?","options":["@PostMapping with @RequestBody","@GetMapping with @RequestParam","@PutMapping with @PathVariable","@RequestMapping with @ModelAttribute"],"correctIndex":0,"explanation":"@PostMapping binds HTTP POST requests and @RequestBody maps the request body into a Java DTO."},{"id":3,"question":"How does Spring Data JPA derive query methods like findByListingIdAndApplicantUserId?","options":["By manually compiling regex strings at runtime","By parsing method names using entity property naming conventions to generate SQL statements","By storing precomputed JSON indices on disk","By calling an external OpenAI API endpoint"],"correctIndex":1,"explanation":"Spring Data JPA automatically parses method signature tokens and translates them to JPQL/SQL queries."},{"id":4,"question":"What is the purpose of Flyway in an enterprise Spring Boot application?","options":["To load-balance incoming HTTP traffic","To manage and version control relational database schema migrations reliably","To encrypt passwords using BCrypt","To monitor CPU and memory usage"],"correctIndex":1,"explanation":"Flyway executes timestamped or versioned SQL migrations to keep the database schema synchronized."},{"id":5,"question":"In a secure REST API architecture, what should the resource server validate on incoming Bearer JWT tokens?","options":["Only that the string begins with Bearer","Cryptographic signature, expiration timestamp (exp), issuer (iss), and target audience","The clients local IP address","Whether the user has paid their monthly subscription"],"correctIndex":1,"explanation":"JWT validation must verify the digital signature, issuer, expiration, and audience claims."}]'
) ON CONFLICT (id) DO NOTHING;

-- 2. Angular (Skill ID: 5)
INSERT INTO skill_assessment (id, skill_id, title, category, passing_score, time_limit_minutes, questions_json)
VALUES (
    'e2222222-2222-2222-2222-222222222201',
    5,
    'Angular & TypeScript Frontend Architecture Assessment',
    'TECH',
    80,
    15,
    '[{"id":1,"question":"What is the difference between @Input() and @Output() in Angular?","options":["@Input() passes data from child to parent, while @Output() receives data from parent","@Input() allows a parent component to pass data to a child, while @Output() emits events from child to parent via EventEmitter","Both are used exclusively for HTTP routing","@Input() is deprecated and replaced by ngModel"],"correctIndex":1,"explanation":"@Input binds properties down to child components, and @Output emits custom events up to parents."},{"id":2,"question":"In modern Angular (v16+ and v18), what is the benefit of Standalone Components (standalone: true)?","options":["They eliminate the need for NgModule declarations, making components modular, self-contained, and easier to tree-shake","They run entirely without JavaScript","They prevent CSS from being scoped to the component","They automatically disable change detection"],"correctIndex":0,"explanation":"Standalone components remove NgModule boilerplate and allow direct imports of dependencies."},{"id":3,"question":"Which RxJS operator is best suited for canceling previous HTTP search requests when a user types a new character in a search bar?","options":["mergeMap","switchMap","concatMap","exhaustMap"],"correctIndex":1,"explanation":"switchMap automatically cancels prior uncompleted inner Observables when a new value arrives."},{"id":4,"question":"What is the primary role of an Angular CanActivate Route Guard?","options":["To compress images before rendering","To verify whether a user is authenticated or authorized before permitting navigation to a protected route","To restart the browser when an error occurs","To generate unit test files automatically"],"correctIndex":1,"explanation":"CanActivate guards inspect user authentication status or roles before allowing route activation."},{"id":5,"question":"Why should components unsubscribe from long-lived RxJS subscriptions in ngOnDestroy?","options":["To prevent memory leaks and zombie event listeners when the view is destroyed","Because Angular will crash on reload","To speed up CSS animations","Because TypeScript requires it for compilation"],"correctIndex":0,"explanation":"Unsubscribing prevents memory leaks from detached components holding references in memory."}]'
) ON CONFLICT (id) DO NOTHING;

-- 3. Electrical Wiring (Skill ID: 11)
INSERT INTO skill_assessment (id, skill_id, title, category, passing_score, time_limit_minutes, questions_json)
VALUES (
    'e3333333-3333-3333-3333-333333333301',
    11,
    'Electrical Wiring & Standards Safety Assessment',
    'TRADES',
    80,
    15,
    '[{"id":1,"question":"What is the primary safety purpose of an Earth/Ground wire in residential electrical wiring in Ethiopia?","options":["To make the electricity flow faster","To provide a safe low-resistance path for fault current to trip the circuit breaker and prevent electric shock","To increase voltage from 220V to 380V","To convert AC current to DC current"],"correctIndex":1,"explanation":"Grounding directs hazardous fault currents into the earth, tripping safety breakers and preventing lethal shocks."},{"id":2,"question":"What standard nominal single-phase AC voltage and frequency is used across the Ethiopian power grid (EEU)?","options":["110V at 60 Hz","220V–230V at 50 Hz","400V at 100 Hz","48V DC"],"correctIndex":1,"explanation":"Ethiopia utilizes standard 220V–230V AC at 50 Hz for single-phase domestic and light commercial power."},{"id":3,"question":"What is the function of an RCD (Residual Current Device) or GFCI in an electrical distribution panel?","options":["It detects current leakage to ground and disconnects power within milliseconds to prevent electrocution","It measures monthly power consumption for billing","It acts as a backup diesel generator","It charges backup battery banks"],"correctIndex":0,"explanation":"RCDs monitor current balance between Live and Neutral and trip immediately upon detecting micro-leakages."},{"id":4,"question":"When sizing cables for heavy electric loads like water heaters or high-capacity motors, what does a larger cross-section prevent?","options":["Excessive electrical resistance, overheating, and fire hazard caused by overcurrent","Radio frequency interference only","Excessive noise from the electrical sockets","Unauthorized power theft"],"correctIndex":0,"explanation":"Proper conductor cross-section minimizes resistive heating, preventing insulation breakdown and fire."},{"id":5,"question":"Before servicing or modifying a live electrical circuit or distribution board, what critical protocol must always be followed?","options":["Work quickly while keeping one foot off the ground","Isolate the main breaker, lock-out/tag-out (LOTO), and verify zero voltage with an approved multimeter/tester","Wear wet leather gloves","Increase the breaker rating to prevent it from tripping"],"correctIndex":1,"explanation":"De-energizing, isolation, and multimeter verification of zero voltage are the non-negotiable fundamentals of electrical safety."}]'
) ON CONFLICT (id) DO NOTHING;
