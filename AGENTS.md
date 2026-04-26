# Project: be-izinin (Backend API)

## Tech Stack
- **Express.js** (v5)
- **Supabase** (Database)
- **Nodemailer** (Email)
- **CommonJS** (No ESM)

## Commands
```bash
npm run dev    # nodemon src/server.js (auto-restart)
npm start     # node src/server.js
```

## Project Structure
```
src/
├── server.js           # Express app entry point
├── db/index.js         # Database connection
├── shared/
│   ├── middleware/   # Auth middleware
│   ├── repository/  # Base repository
│   ├── constants/    # App constants
│   └── utils/        # Email, validators, JSON helpers
└── modules/
    ├── auth/         # Authentication (login, register)
    ├── user/         # User management
    └── master/       # Master data (position, holiday, site, etc.)
    └── timeoff/      # Time off requests, approvals, adjustments
```

## Important Patterns
- **Architecture**: Controller → Service → Repository (layered)
- **API Routes**: Defined in controller files
- **Database**: Supabase (not local file)
- **Email**: Nodemailer with templates in `src/shared/utils/email/`
- **Config**: Uses `.env` file (copy from `.env.example`)
- **Authentication**: JWT via auth middleware (`src/shared/middleware/auth.js`)

## Notes
- Runs on port specified in `.env` (default: 3000 or 5000)
- Frontend: `fe-izinin` (Next.js)
- Uses `dotenv` for environment variables