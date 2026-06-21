# Blog Backend - Express + MongoDB

A full-featured blog backend API built with Express.js, MongoDB, and TypeScript.

## Features

- ✅ Express.js REST API
- ✅ MongoDB with Mongoose ODM
- ✅ TypeScript for type safety
- ✅ Input validation with Zod
- ✅ JWT authentication ready
- ✅ Jest testing framework
- ✅ Hot-reload development with Nodemon
- ✅ Comprehensive error handling

## Prerequisites

- Node.js 18+
- MongoDB (local or Atlas)
- npm or yarn

## Installation

1. **Clone and install dependencies:**
   ```bash
   npm install
   ```

2. **Set up environment variables:**
   ```bash
   cp .env.example .env
   ```
   Edit `.env` and configure:
   - `MONGODB_URI` - Your MongoDB connection string
   - `JWT_SECRET` - Your JWT secret key
   - `PORT` - Server port (default: 5000)

## Development

Start the development server with hot-reload:
```bash
npm run dev
```

The server will be available at `http://localhost:5000`

Check health: `GET http://localhost:5000/health`
```

## Testing

Run tests:
```bash
npm test
```

Watch mode:
```bash
npm run test:watch
```

## Build for Production

Compile TypeScript:
```bash
npm run build
```

Start production server:
```bash
npm start
```

## Project Structure

```
src/
├── index.ts          # Main server entry point
├── models/           # Mongoose schemas
└── routes/           # API routes
```

## Technologies

- **Runtime**: Node.js
- **Web Framework**: Express.js 5
- **Database**: MongoDB + Mongoose 9
- **Language**: TypeScript 6
- **Validation**: Zod
- **Auth**: JWT + Bcrypt
- **Testing**: Jest
- **Dev Tools**: Nodemon, ts-node

## License

MIT
