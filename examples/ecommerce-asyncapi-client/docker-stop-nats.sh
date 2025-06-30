#!/bin/bash

# Stop NATS Server for E-commerce Order Lifecycle Testing

echo "🛑 Stopping NATS Server..."

# Stop and remove the container
if docker ps -q -f name=nats-jetstream | grep -q .; then
    echo "📦 Stopping NATS container..."
    docker stop nats-jetstream
    echo "🗑️  Removing NATS container..."
    docker rm nats-jetstream
    echo "✅ NATS server stopped and removed"
else
    echo "ℹ️  NATS container is not running"
fi

echo "�� Cleanup complete!" 