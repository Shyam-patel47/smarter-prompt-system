# Smarter Prompt System - Technical Documentation

## 1. Project Overview

**The Smarter Prompt System** is a full-stack, AI-driven application designed to solve a critical bottleneck for modern professionals, marketers, and developers: writing high-quality, reproducible AI prompts is difficult, repetitive, and prone to poor outcomes. Most users either write lazy, zero-shot prompts and get generic outputs, or they spend hours manually crafting complex prompts in unstructured documents.

The Smarter Prompt System provides a structured environment to **build, generate, save, organize, compare, and reuse** high-quality prompts. 

**The Core User Loop:**
1. **Build:** The user inputs a simple task (e.g., "Write a marketing email") and context into the Builder.
2. **Generate:** The system uses a hidden, highly-engineered system prompt alongside Google's Gemini AI to automatically generate a rich, token-efficient, robust meta-prompt.
3. **Save & Organize:** The generated prompt is saved to the user's Library, where it can be tagged, placed into folders, and marked as a favorite or template.
4. **Compare:** The user can A/B test variations of prompts using the AI Evaluator tool to objectively determine which prompt yields better structural constraints.
5. **Reuse:** Users pull from their organized library to execute tasks efficiently across any external LLM.

## 2. Tech Stack

### Frontend
* **React 18 & TypeScript:** Core UI library and language, chosen for strict type safety and component reusability.
* **Vite:** Build tool and dev server, chosen for incredibly fast Hot Module Replacement (HMR) and optimized production bundles.
* **Tailwind CSS:** Utility-first CSS framework, chosen to rapidly implement a bespoke, highly consistent design system without writing custom CSS files.
* **React Router v6:** Client-side routing, chosen for seamless SPA navigation.
* **Lucide React:** Icon library, chosen for its clean, consistent stroke widths that match our modern aesthetic.
* **Next Themes:** Chosen for effortless dark/light/system theme toggling and persistence.

### Backend
* **Node.js & Express.js:** API server, chosen for its lightweight, asynchronous architecture and seamless sharing of TypeScript types with the frontend.
* **Mongoose:** Object Data Modeling (ODM) library for MongoDB, chosen for schema validation and strict relationship mapping.
* **Bcryptjs & Jsonwebtoken (JWT):** Chosen for secure password hashing and stateless, cookie-based session management.
* **@google/genai:** Official Google Gemini SDK, chosen to interface with the Gemini API.

### Database
* **MongoDB Atlas:** Hosted NoSQL database, chosen for its flexibility with document-based data (like dynamic prompt variables) and built-in text search capabilities.

### AI Integration
* **Google Gemini 3.6 Flash:** The underlying AI model powering the generation engine. Chosen because it is a "thinking" model that excels at complex reasoning and structural adherence while maintaining a massive context window and cost-effective execution on the free tier.

## 3. System Architecture

The system follows a standard decoupled Client-Server architecture.

```text
+-------------------+        HTTP REST         +-------------------+
|                   |   (JSON over HTTPS)      |                   |
|   React SPA       | <----------------------> |   Express API     |
|   (Vite/Tailwind) |                          |   (Node.js)       |
|                   |                          |                   |
+-------------------+                          +-------------------+
        |                                           |         |
        | LocalStorage                              |         | Mongoose
        v                                           |         v
+-------------------+       @google/genai      +-------------------+
| Browser Cache     | <----------------------> |  MongoDB Atlas    |
| (Draft Persist.)  |                          |  (Database)       |
+-------------------+                          +-------------------+
                                                    |
                                                    v
                                               +-------------------+
                                               |  Google Gemini    |
                                               |  (LLM API)        |
                                               +-------------------+
```

**Typical Request Flow (Generating a Prompt):**
1. The client sends a `POST /api/prompts/generate` request containing the user's raw input (task, tone, details).
2. The Express API authenticates the request via the HTTP-only JWT cookie.
3. The API calculates a "complexity score" based on the user's input to dynamically allocate a token budget.
4. The API constructs a highly structured system prompt and securely calls the Gemini API via the `@google/genai` SDK.
5. If the Gemini API returns a `429 Quota Exceeded` error, the API automatically enters a 2-second backoff-and-retry loop.
6. If the AI call succeeds, the structured prompt is returned to the client. If the AI completely fails, the API gracefully serves a deterministic, non-AI string template so the client UI never crashes.

## 4. Database Schema — Full Explanation

The database consists of 6 core Mongoose models.

### 1. User Model (`users`)
Manages account data, authentication, and session invalidation.
* `email` (String, Unique, Sparse): User's login email.
* `mobileNumber` (String, Unique, Sparse): Optional alternative login.
* `passwordHash` (String, Required): Bcrypt hash of the user's password.
* `name`, `avatarUrl` (String): Profile display data.
* `emailVerified`, `mobileVerified` (Boolean): Flags for verification status.
* `planTier` (String): `'free'` or `'pro'`.
* `tokenVersion` (Number, Default: 0): A critical security field. Incremented during password changes or "Logout All" actions to instantly invalidate all previously issued JWTs.
* `themePreference` (String): UI preference (`'light'`, `'dark'`, `'system'`).
* `resetTokenHash`, `resetTokenExpiry`: Ephemeral fields used during the forgot-password flow.

### 2. Prompt Model (`prompts`)
The core entity representing a generated or manually created prompt.
* `userId` (ObjectId, Ref: User, Required): The owner of the prompt.
* `folderId` (ObjectId, Ref: Folder, Nullable): Categorization reference.
* `title` (String, Required): Display name. Indexed for text search.
* `taskType`, `detailsInput`, `tone`, `outputFormat`, `targetModel` (String): Configuration metadata used to generate the prompt.
* `generatedBody` (String): The actual prompt text. Indexed for text search.
* `isTemplate`, `isFavorite` (Boolean): Toggles for UI filtering.
* `deletedAt` (Date): Used for soft-deletes (moves prompt to Trash).
* `purgeAt` (Date): Used by a MongoDB TTL index to automatically permanently delete the document after a specific timeframe (e.g., 30 days in trash).
* `tagIds` (Array of ObjectIds, Ref: Tag): Many-to-many relationship for flexible organization.
* `variables` (Array of Embedded Documents): 
  * *Why embedded?* Variables (`key`, `label`, `defaultValue`) are inherently tied to a single prompt's execution context. Creating a separate `Variables` collection would require expensive `$lookup` joins for every prompt load. Embedding them ensures atomic updates and immediate retrieval.

### 3. PromptVersion Model (`promptversions`)
Tracks historical changes to a Prompt's text.
* `promptId` (ObjectId, Ref: Prompt, Required): The parent prompt.
* `userId` (ObjectId, Ref: User, Required): The author of the change.
* `body` (String, Required): The historical state of `generatedBody`.
* `commitMessage` (String): Note explaining the change.

### 4. Folder Model (`folders`)
Hierarchical organization.
* `userId` (ObjectId, Ref: User, Required): Owner.
* `name` (String, Required): Display name.
* `color` (String): Optional UI accent color.
* `parentId` (ObjectId, Ref: Folder, Nullable): Enables nested folder structures.

### 5. Tag Model (`tags`)
Flat organization.
* `userId` (ObjectId, Ref: User, Required): Owner.
* `name` (String, Required): Display name.
* `color` (String): UI badge color.

### 6. Comparison Model (`comparisons`)
Stores results from the AI Evaluator tool.
* `userId` (ObjectId, Ref: User, Required): Owner.
* `baseTaskDescription` (String, Required): The goal the prompts were evaluated against.
* `promptABody`, `promptBBody` (String, Required): The two variations tested.
* `promptAScore`, `promptBScore` (Number): The 0-100 scores generated by the AI.
* `winner` (String): `'a'`, `'b'`, `'tie'`, or `'none'`.

## 5. Authentication System — Step by Step

Authentication is handled securely via HttpOnly cookies and JWTs.

1. **Signup (`POST /api/auth/signup`):**
   * The user provides `email`, `password`, and `confirmPassword`.
   * The server validates password match and minimum length (8 chars).
   * The password is hashed using `bcrypt` (10 rounds).
   * A `User` document is created. A JWT is immediately signed (containing `userId` and `tokenVersion`) and set as an HttpOnly, secure cookie (`token`).
2. **Login (`POST /api/auth/login`):**
   * The server finds the user by email and compares the provided password against `passwordHash`.
   * Upon success, a new JWT is issued in the cookie.
3. **Session Validation & Global Logout (`POST /api/auth/logout-all`):**
   * The JWT payload contains `tokenVersion` (e.g., `1`).
   * On every protected route, the `authenticateJWT` middleware extracts the token, decodes it, and compares the token's version to the user's current `tokenVersion` in the database.
   * If a user clicks "Log out of all devices", their `tokenVersion` is incremented to `2` in the database. Any existing JWTs circulating in browsers still say `1`, and are instantly rejected by the middleware.
4. **Forgot Password Flow:**
   * **Request (`POST /api/auth/forgot-password`):** The server generates a random 32-byte crypto hex string (`resetToken`). It hashes this token and stores the hash + a 1-hour expiry on the `User`. The raw token is emailed to the user via Resend (`emailService.ts`). (We don't leak user existence; the API always returns a generic success message).
   * **Reset (`POST /api/auth/reset-password`):** The user submits the raw token from the URL and a new password. The server finds unexpired tokens, compares the bcrypt hash, updates the `passwordHash`, clears the reset fields, and increments the `tokenVersion` to boot out any bad actors logged into the account.

## 6. The Prompt Builder & AI Generation Engine

The core value proposition of the app is its ability to take lazy input and generate robust, model-portable prompts.

### 1. Dynamic Complexity Classification
Instead of assigning a flat `maxOutputTokens` cap to every generation call (which results in short prompts being bloated with filler or complex tasks being truncated), the system runs a pre-flight heuristic classification:
* `complexityClassifier.ts` scores the user's input based on word count, structural keywords (e.g., "report", "multi-part", "explain in detail"), and task type.
* The score maps to a dynamically calculated `maxOutputTokens` formula: `1200 + (score * 1000)`.
* This specifically accounts for the Gemini 3.6 Flash "thinking" model, ensuring the AI has enough hidden token budget to reason through complex formatting rules before printing the final output.

### 2. Resilience and 429 Mitigation
Because the system runs on the Gemini Free Tier (15 requests/minute), rate limiting is a primary operational hazard.
* `promptController.ts` wraps the Gemini SDK call in a `while` loop (`maxRetries = 2`).
* If a `429` or `RESOURCE_EXHAUSTED` error is caught, the server logs a warning, sleeps for exactly 2,000ms, and retries the request transparently.
* **Deterministic Fallback:** If the API completely fails or exhausts its retries, the server bypasses the AI entirely and serves a highly structured, non-AI string template combining the user's variables. This guarantees 100% uptime for the UI.

### 3. Example Generations
**User Input:** Task: "Marketing Copy", Tone: "Aggressive", Details: "Sell my new vacuum cleaner, it has turbo suction."
**AI Output:**
```text
Act as an elite, high-conversion direct-response copywriter.
Your objective is to write aggressive, compelling marketing copy for a new vacuum cleaner.

PARAMETERS:
- Tone: Aggressive, urgent, and authoritative.
- Output Format: Paragraphs.

KEY DETAILS TO INTEGRATE:
- The vacuum features "turbo suction" technology.

INSTRUCTIONS:
1. Hook the reader immediately by exposing a pain point (e.g., hidden dirt in carpets).
2. Introduce the vacuum cleaner as the absolute, non-negotiable solution.
3. Emphasize the "turbo suction" feature. Frame it as overwhelmingly powerful compared to competitors.
4. Conclude with a hard, aggressive Call to Action (CTA) demanding immediate purchase.
5. Use punchy, declarative sentences. Avoid passive voice entirely.
```

## 7. Library, Tags, Folders & Version History

* **Organization:** The Library UI uses a combined query strategy. When fetching prompts, the Express API builds a dynamic MongoDB query based on `folderId`, `tags` (using `$in`), `isFavorite`, and `isTemplate`.
* **Search:** The `Prompt` schema features a text index: `PromptSchema.index({ title: 'text', generatedBody: 'text' })`. This allows the API to use the highly efficient `$text: { $search: query }` operator for instantaneous full-text search across all prompt bodies and titles.
* **Soft Delete:** Deleting a prompt sets `deletedAt`. It disappears from the main library but remains in the database.
* **Auto-Purge:** When moved to trash, `purgeAt` is set. A MongoDB TTL index (`expireAfterSeconds: 0` on `purgeAt`) automatically tells the MongoDB engine to permanently delete the document from disk when that date is reached, requiring zero cron jobs on the Node server.

## 8. Test & Compare Tool

The Compare tool acts as an automated A/B evaluator for prompt engineering.
* **Flow:** The user inputs a base goal and two competing prompts (Prompt A and Prompt B).
* **AI Evaluation:** The backend injects both prompts into a specialized System Prompt that instructs Gemini 3.6 Flash to act as an objective Prompt Evaluator.
* **Scoring:** The AI returns a strict JSON object containing `scoreA` (0-100), `scoreB` (0-100), and a 1-2 sentence `reasoning` explaining the structural differences.
* **Resilience:** Like the Builder, this controller features a 429 retry-with-backoff loop and a deterministic fallback (returning a 50-50 tie if the API is entirely down) to prevent UI crashes.

## 9. Design System

The app was designed as a deliberate rejection of the "generic SaaS" aesthetic (white backgrounds, light gray borders, system fonts) that saturates the AI tooling space. 

* **Theme:** Deep space dark mode default (`bg: #0B0E14`), paired with rich, elevated surfaces (`#1A1D24`).
* **Accent:** A neon, vibrant indigo/violet (`#6366f1`) used sparingly for primary actions, active states, and focus rings.
* **Typography:** Modern sans-serif (Inter/Roboto), completely overriding browser defaults for a premium feel.
* **Interactions:** Subtle hover states, smooth transitions on NavLinks, and localized state persistence (saving active drafts to `localStorage` so forms survive page refreshes).

## 10. Settings, Dashboard & Account Management

* **Dashboard:** Aggregates quick metrics.
* **Settings:** 
  * **Security:** Allows password updates and features a "Log out of all devices" panic button (manipulating the `tokenVersion`).
  * **Appearance:** Toggles Next Themes between light, dark, and system preferences.
* **Draft Persistence:** Forms on the Builder and Compare pages automatically save their state to `localStorage` as the user types. When the user successfully clicks "Log out" in Settings, these `localStorage` keys are explicitly wiped to protect user data on shared machines.

## 11. Deployment & Environment Configuration

### Environment Variables

| Variable | Location | Purpose |
|----------|----------|---------|
| `VITE_API_BASE_URL` | Client | Points the React app's Axios instance to the backend (e.g., `http://localhost:5000/api`). |
| `MONGODB_URI` | Server | Full connection string to the MongoDB Atlas cluster. |
| `JWT_SECRET` | Server | Cryptographic key used to sign and verify session cookies. |
| `PORT` | Server | Port the Express API binds to (default 5000). |
| `CLIENT_URL` / `FRONTEND_URL` | Server | Used for CORS origins and generating password reset email links. |
| `GEMINI_API_KEY` | Server | Authenticates requests to Google's generative AI models. |
| `RESEND_API_KEY` | Server | API key for the Resend transactional email service. |
| `SYSTEM_FROM_EMAIL` | Server | The verified domain email address used as the "From" address for system emails. |

### Deployment Architecture (Target)
* **Frontend:** Deployed to Vercel or Netlify. The `VITE_API_BASE_URL` must be updated to the production backend URL during build time.
* **Backend:** Deployed to a Node.js hosting provider (e.g., Render, Railway, DigitalOcean App Platform).
* **Database:** Hosted on MongoDB Atlas. IP Access lists must be configured to allow the backend's IP addresses (or `0.0.0.0/0` if using a dynamic host).

## 12. Known Limitations & Deferred Items

The following features were scoped out of Phase 1 and deferred for future iterations:
1. **Profile Avatars:** The `User` schema contains an `avatarUrl` field, but file upload logic (e.g., AWS S3 integration) was deferred.
2. **Dual Linking:** Allowing a user to sign in seamlessly via both Email and Mobile concurrently is supported by the schema (`sparse` indexes) but requires complex UI linking logic deferred to a later phase.

## 13. How to Run This Locally

**Prerequisites:** Node.js (v18+), npm/yarn, and a MongoDB Atlas URI.

**1. Clone the repository and install dependencies:**
```bash
# Install backend dependencies
cd server
npm install

# Install frontend dependencies
cd ../client
npm install
```

**2. Configure Environment Variables:**
* In the `server` directory, create a `.env` file based on the table in Section 11. Ensure you have valid `MONGODB_URI` and `GEMINI_API_KEY` values.
* In the `client` directory, create a `.env` file containing `VITE_API_BASE_URL=http://localhost:5000/api`.

**3. Start the Development Servers:**
Open two terminal windows.
```bash
# Terminal 1: Start Backend (Runs on port 5000)
cd server
npm run dev

# Terminal 2: Start Frontend (Runs on port 5173)
cd client
npm run dev
```
Navigate to `http://localhost:5173` in your browser. The app is fully operational.
