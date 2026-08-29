# Smarter Prompt

A professional prompt management system for organizing, versioning, and comparing structured prompts.

## Architecture
- **Frontend**: React (Vite), Tailwind CSS v3, React Router, Context API, Lucide React icons, next-themes.
- **Backend**: Node.js, Express, Mongoose.
- **Database**: MongoDB (Atlas).

## Setup Instructions

1. Clone the repository.
2. Run `npm install` in both `/client` and `/server`.
3. Set up environment variables (see below).
4. Run `npm run dev` in both `/client` and `/server`.

## Environment Variables

### `/server/.env`
Create a `.env` file based on `server/.env.example`:
```
PORT=5000
MONGODB_URI=your_mongodb_atlas_connection_string
JWT_SECRET=your_jwt_secret_key
FRONTEND_URL=http://localhost:5173
```

### `/client/.env`
Create a `.env` file based on `client/.env.example`:
```
VITE_API_URL=http://localhost:5000/api
```

## Design Choices & Implementation Details

- **Account Deletion Cascade**: When a user deletes their account, all associated data (Prompts, Folders, Tags, Comparisons) is *permanently hard-deleted*. This was an explicit choice to prioritize user privacy and simplify compliance over soft-deletion/anonymization for v1.
- **Trash Auto-Purge**: Soft-deleted prompts are stored in the Trash folder. The `Prompt` schema utilizes a MongoDB TTL index on the `purgeAt` field to automatically permanently delete items 30 days after they are soft-deleted.
- **Testing**: For E2E testing, use an email starting with `e2e_test_` (e.g. `e2e_test_1@example.com`). The OTP provider will always validate `123456` for these test accounts, allowing automated tests to pass the signup and login barriers without checking a real inbox.
