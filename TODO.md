# TODOs (Deferred to Post-v1)

- **Avatar Uploads**: Avatar upload logic was deferred. Currently, users can paste a direct URL to an avatar image in Settings. For v1.1, integrate AWS S3, Cloudinary, or Supabase Storage for physical file uploads.
- **Link Identifiers UI**: The backend logic for linking a second identifier (email/mobile) is implemented (`/api/auth/link-identifier/*`), but the Settings UI currently directs users to a placeholder button. Hook this up to a modal with OTP verification.
- **Social Login**: Consider adding OAuth (Google/GitHub) for faster signups.
- **Granular Data Export**: Currently, Data Export pulls all folders, tags, prompts, and comparisons in one JSON chunk. As data grows, consider exporting individual prompts or formatting as CSV/Markdown zip files.
