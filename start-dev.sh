#!/bin/bash
echo "🚀 Starting FitKicks Development Environment"
echo ""

# Check .env files
if [ ! -f backend/.env ]; then
  echo "⚠️  backend/.env not found. Copying from .env.example..."
  cp backend/.env.example backend/.env
  echo "📝 Please fill in your environment variables in backend/.env"
  echo ""
fi

if [ ! -f frontend/.env ]; then
  echo "⚠️  frontend/.env not found. Copying from .env.example..."
  cp frontend/.env.example frontend/.env
fi

# Install dependencies
echo "📦 Installing backend dependencies..."
cd backend && npm install --silent

echo "📦 Installing frontend dependencies..."
cd ../frontend && npm install --silent

# Start both servers
echo ""
echo "✅ Starting servers..."
echo "   Backend: http://localhost:5000"
echo "   Frontend: http://localhost:5173"
echo "   API Health: http://localhost:5000/health"
echo ""

cd ..
npx concurrently \
  --names "BACKEND,FRONTEND" \
  --prefix-colors "yellow,cyan" \
  "cd backend && npm run dev" \
  "cd frontend && npm run dev"
