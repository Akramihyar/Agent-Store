#!/bin/bash

echo "🚀 Starting Agent Store Backend with ngrok..."
echo ""

# Start the Express server in the background
node server.js &
SERVER_PID=$!

# Wait a moment for the server to start
sleep 2

echo "✅ Express server started on port 3001 (PID: $SERVER_PID)"
echo ""

# Start ngrok tunnel
echo "🌐 Starting ngrok tunnel..."
ngrok start backend --config=ngrok.yml

# When ngrok exits, kill the server
kill $SERVER_PID
echo "🛑 Server stopped"