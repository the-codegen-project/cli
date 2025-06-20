#!/bin/bash

# NATS Server with JetStream for E-commerce Order Lifecycle Testing
# This script sets up a complete NATS environment for the AsyncAPI client example

echo "🚀 Starting NATS Server with JetStream for E-commerce Order Lifecycle..."

# Stop any existing NATS container
docker stop nats-jetstream 2>/dev/null || true
docker rm nats-jetstream 2>/dev/null || true

# Get the directory where this script is located
CONFIG_FILE="./nats-server.conf"

# Check if the configuration file exists
if [ ! -f "$CONFIG_FILE" ]; then
    echo "❌ Configuration file not found: $CONFIG_FILE"
    echo "Please ensure nats-server.conf exists in the same directory as this script."
    exit 1
fi

echo "📁 Using NATS configuration: $CONFIG_FILE"


# Run NATS server with JetStream
echo "🏃 Starting NATS server container..."
docker run -d \
  --name nats-jetstream \
  -p 4222:4222 \
  -p 8222:8222 \
  -v "./nats-server.conf:/etc/nats/nats-server.conf" \
  nats:2.10-alpine \
  nats-server

# Wait for NATS to be ready
echo "⏳ Waiting for NATS server to be ready..."
sleep 3

# Check if NATS is running
if ! docker ps | grep -q nats-jetstream; then
    echo "❌ Failed to start NATS server"
    exit 1
fi

echo "✅ NATS server is running"

# Create JetStream configuration using NATS CLI in the container
echo "🔧 Configuring JetStream streams and consumers..."

# Create the main orders stream for order lifecycle events
docker exec nats-jetstream nats stream add \
  --subjects="orders.>" \
  --storage=memory \
  --retention=limits \
  --max-msgs=1000000 \
  --max-age=24h \
  --max-bytes=100MB \
  --replicas=1 \
  --discard=old \
  --dupe-window=2m \
  ORDERS_LIFECYCLE || echo "⚠️  Stream might already exist"

# Create specific subjects for each order action
echo "📝 Creating subjects for order lifecycle events..."

# Test that we can publish to the subjects
docker exec nats-jetstream nats pub orders.created '{"test": "stream setup"}' --count=1 >/dev/null 2>&1
docker exec nats-jetstream nats pub orders.updated '{"test": "stream setup"}' --count=1 >/dev/null 2>&1
docker exec nats-jetstream nats pub orders.cancelled '{"test": "stream setup"}' --count=1 >/dev/null 2>&1
docker exec nats-jetstream nats pub orders.shipped '{"test": "stream setup"}' --count=1 >/dev/null 2>&1
docker exec nats-jetstream nats pub orders.delivered '{"test": "stream setup"}' --count=1 >/dev/null 2>&1

# Create a durable consumer for order processing (as used in the example)
docker exec nats-jetstream nats consumer add ORDERS_LIFECYCLE \
  --filter="orders.>" \
  --ack=explicit \
  --pull \
  --deliver=all \
  --max-deliver=3 \
  --wait=5s \
  --replay=instant \
  --max-pending=100 \
  order-processor || echo "⚠️  Consumer might already exist"

echo ""
echo "🎉 NATS JetStream setup complete!"
echo ""
echo "📊 Connection Details:"
echo "   NATS URL: nats://localhost:4222"
echo "   Monitor URL: http://localhost:8222"
echo "   JetStream Domain: ecommerce"
echo ""
echo "📂 Configured Streams:"
echo "   • ORDERS_LIFECYCLE (subjects: orders.>)"
echo ""
echo "🏷️  Available Subjects:"
echo "   • orders.created   - New order events"
echo "   • orders.updated   - Order status updates"
echo "   • orders.cancelled - Order cancellations"
echo "   • orders.shipped   - Order shipment events"
echo "   • orders.delivered - Order delivery events"
echo ""
echo "🔄 Configured Consumers:"
echo "   • order-processor (durable pull consumer)"
echo ""
echo "🧪 Test the setup:"
echo "   npm run demo"
echo ""
echo "🛑 To stop the server:"
echo "   docker stop nats-jetstream"
echo ""
echo "📈 Monitor the server:"
echo "   docker logs -f nats-jetstream"
echo "   curl http://localhost:8222/varz"
echo ""

# Show stream info
echo "📋 Stream Information:"
docker exec nats-jetstream nats stream info ORDERS_LIFECYCLE 2>/dev/null || echo "⚠️  Could not fetch stream info"

echo ""
echo "✨ Ready for testing! Run your AsyncAPI client demo now." 