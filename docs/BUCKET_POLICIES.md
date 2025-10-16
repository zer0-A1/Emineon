## Google Cloud Storage Policies (emineon-cv-storage-prod)

Scope: Files used by AI features (CVs, job descriptions, attachments).

Bucket: `gs://emineon-cv-storage-prod` (location: `eu` multi-region)

Configured settings
- Soft delete: 30 days (object recovery window)
- Lifecycle rules:
  - Move to NEARLINE after 30 days
  - Move to COLDLINE after 180 days
  - Delete objects under `tmp/` after 7 days
  - If versioning is enabled (it is): delete noncurrent versions after 180 days
- Object Versioning: Enabled (retains previous versions for audit/recovery)
- Access logging: Enabled to `gs://emineon-logs` with prefix `storage/`
- Public access prevention: Enabled (bucket not public)
- Encryption: Google-managed keys (CMEK optional later)
- CORS: viewing-only policy for app domain
  - Origins: `https://app.emineon.com`, `http://localhost:3000`
  - Methods: `GET`, `HEAD`
  - Response headers: `Content-Type`, `Range`
  - Max age: 3600 seconds

Uploader behavior
- All uploads go through server-side `universal-storage` service.
- Files are written under structured prefixes, e.g. `candidates/{id}/cv/{timestamp_filename}`.
- Downloads are performed using signed URLs or via server proxy; no browser-side write credentials are exposed.

Operational notes
- Increase soft delete to >30d for stricter compliance if needed.
- If enabling direct browser access beyond viewing, expand CORS to include `POST/PUT` and required request headers; prefer keeping writes server-side.
- If cost pressure rises, consider DEEP_ARCHIVE after 365d for cold content.

