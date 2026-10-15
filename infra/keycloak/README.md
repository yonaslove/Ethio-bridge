# Keycloak infrastructure

The realm export `ethiobridge-realm.json` is committed here and imported by Docker Compose
(`--import-realm`), so a clean clone starts with the realm, clients, roles, audience mapper, and
synthetic test users already configured.

Spec: [../../docs/identity.md](../../docs/identity.md). Create the export in Phase 3.
