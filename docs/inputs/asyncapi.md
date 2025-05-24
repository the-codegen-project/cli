---
sidebar_position: 99
---

# AsyncAPI
Supported versions: 2.0 -> 3.0

If you arrive from the AsyncAPI community, you might be wondering what this project is and how does it relate?

The Codegen Project was started because of a need for a code generator that;
1. could easily be integrated into development workflows
2. can easily be extended or customized to specific use-cases
3. forms a community across communities in languages and standards
4. are financially sustainable long term through open source at it's core.

There is a lot of overlap with existing tooling, however the idea is to form the same level of quality that the OpenAPI Generator provides to OpenAPI community for HTTP, for AsyncAPI and **any** protocol (including HTTP), and the usability of the Apollo GraphQL generator. How are we gonna achieve it? Together, and a [roadmap](https://github.com/orgs/the-codegen-project/projects/1/views/2).

## Basic AsyncAPI Document Structure

Here's a complete basic AsyncAPI document example to get you started:

```json
{
  "asyncapi": "3.0.0",
  "info": {
    "title": "User Service API",
    "version": "1.0.0",
    "description": "API for user management events"
  },
  "channels": {
    "userSignedup": {
      "address": "user/signedup/{userId}/{region}",
      "parameters": {
        "userId": {
          "description": "The unique identifier for the user"
        },
        "region": {
          "description": "The geographic region",
          "enum": ["us-east", "us-west", "eu-central"]
        }
      },
      "messages": {
        "UserSignedUp": {
          "$ref": "#/components/messages/UserSignedUp"
        }
      }
    }
  },
  "operations": {
    "sendUserSignedup": {
      "action": "send",
      "channel": {
        "$ref": "#/channels/userSignedup"
      },
      "messages": [
        {
          "$ref": "#/channels/userSignedup/messages/UserSignedUp"
        }
      ]
    },
    "receiveUserSignedup": {
      "action": "receive",
      "channel": {
        "$ref": "#/channels/userSignedup"
      },
      "messages": [
        {
          "$ref": "#/channels/userSignedup/messages/UserSignedUp"
        }
      ]
    }
  },
  "components": {
    "messages": {
      "UserSignedUp": {
        "payload": {
          "$ref": "#/components/schemas/UserSignedUpPayload"
        },
        "headers": {
          "$ref": "#/components/schemas/UserHeaders"
        }
      }
    },
    "schemas": {
      "UserSignedUpPayload": {
        "type": "object",
        "properties": {
          "display_name": {
            "type": "string",
            "description": "Name of the user"
          },
          "email": {
            "type": "string",
            "format": "email",
            "description": "Email of the user"
          },
          "created_at": {
            "type": "string",
            "format": "date-time",
            "description": "When the user was created"
          }
        },
        "required": ["display_name", "email"]
      },
      "UserHeaders": {
        "type": "object",
        "properties": {
          "correlation_id": {
            "type": "string",
            "description": "Correlation ID for tracking"
          },
          "source": {
            "type": "string",
            "description": "Source system"
          }
        }
      }
    }
  }
}
```

## Extensions

To customize the code generation through the AsyncAPI document, use the `x-the-codegen-project` [extension object](https://www.asyncapi.com/docs/reference/specification/v3.0.0#specificationExtensions) with the following properties:

### Channel Extensions

`channelName`, string, customize the name of the functions generated for the channel, use this to overwrite the automatically determined name for models and functions. This will be used by the following generators; [payloads](../generators/payloads.md), [parameters](../generators/parameters.md) and [channels](../generators/channels.md). 

`functionTypeMapping`, [ChannelFunctionTypes](https://the-codegen-project.org/docs/api/enumerations/ChannelFunctionTypes), customize which generators to generate for the given channel, use this to specify further which functions we render. This will be used by the following generators; [channels](../generators/channels.md). 

#### Example: Custom Channel Configuration

```json
{
  "asyncapi": "3.0.0",
  "info": {
    "title": "Custom Channel Example",
    "version": "1.0.0"
  },
  "channels": {
    "user-events": {
      "address": "events/user/{action}",
      "parameters": {
        "action": {
          "enum": ["created", "updated", "deleted"]
        }
      },
      "messages": {
        "UserEvent": {
          "payload": {
            "type": "object",
            "properties": {
              "userId": {"type": "string"},
              "action": {"type": "string"},
              "timestamp": {"type": "string", "format": "date-time"}
            }
          }
        }
      },
      "x-the-codegen-project": {
        "channelName": "UserEventChannel",
        "functionTypeMapping": ["event_source_express", "kafka_publish"]
      }
    }
  }
}
```

### Operation Extensions

`functionTypeMapping`, [ChannelFunctionTypes](https://the-codegen-project.org/docs/api/enumerations/ChannelFunctionTypes), customize which generators to generate for the given operation, use this to specify further which functions we render. This will be used by the following generators; [channels](../generators/channels.md). 

#### Example: Custom Operation Configuration

```json
{
  "asyncapi": "3.0.0",
  "info": {
    "title": "Custom Operation Example",
    "version": "1.0.0"
  },
  "operations": {
    "publishUserEvent": {
      "action": "send",
      "channel": {
        "$ref": "#/channels/user-events"
      },
      "messages": [
        {"$ref": "#/channels/user-events/messages/UserEvent"}
      ],
      "x-the-codegen-project": {
        "functionTypeMapping": ["kafka_publish"]
      }
    },
    "subscribeToUserEvents": {
      "action": "receive",
      "channel": {
        "$ref": "#/channels/user-events"
      },
      "messages": [
        {"$ref": "#/channels/user-events/messages/UserEvent"}
      ],
      "x-the-codegen-project": {
        "functionTypeMapping": ["kafka_subscribe"]
      }
    }
  }
}
```

## Protocol Support

### HTTP Client

Use HTTP bindings to generate HTTP client code. Supports all standard HTTP methods and status codes.

#### Example: REST API with Multiple HTTP Methods

```json
{
  "asyncapi": "3.0.0",
  "info": {
    "title": "User Management API",
    "version": "1.0.0"
  },
  "channels": {
    "users": {
      "address": "/users/{userId}",
      "parameters": {
        "userId": {
          "description": "User identifier"
        }
      },
      "messages": {
        "UserRequest": {
          "payload": {
            "$ref": "#/components/schemas/User"
          }
        },
        "UserResponse": {
          "payload": {
            "$ref": "#/components/schemas/User"
          },
          "bindings": {
            "http": {
              "statusCode": 200
            }
          }
        },
        "NotFound": {
          "payload": {
            "type": "object",
            "properties": {
              "error": {"type": "string"},
              "code": {"type": "string"}
            }
          },
          "bindings": {
            "http": {
              "statusCode": 404
            }
          }
        }
      }
    }
  },
  "operations": {
    "createUser": {
      "action": "send",
      "channel": {"$ref": "#/channels/users"},
      "messages": [{"$ref": "#/channels/users/messages/UserRequest"}],
      "bindings": {
        "http": {"method": "POST"}
      },
      "reply": {
        "channel": {"$ref": "#/channels/users"},
        "messages": [{"$ref": "#/channels/users/messages/UserResponse"}]
      },
      "x-the-codegen-project": {
        "functionTypeMapping": ["http_client"]
      }
    },
    "getUser": {
      "action": "send",
      "channel": {"$ref": "#/channels/users"},
      "messages": [],
      "bindings": {
        "http": {"method": "GET"}
      },
      "reply": {
        "channel": {"$ref": "#/channels/users"},
        "messages": [
          {"$ref": "#/channels/users/messages/UserResponse"},
          {"$ref": "#/channels/users/messages/NotFound"}
        ]
      },
      "x-the-codegen-project": {
        "functionTypeMapping": ["http_client"]
      }
    },
    "updateUser": {
      "action": "send",
      "channel": {"$ref": "#/channels/users"},
      "messages": [{"$ref": "#/channels/users/messages/UserRequest"}],
      "bindings": {
        "http": {"method": "PUT"}
      },
      "reply": {
        "channel": {"$ref": "#/channels/users"},
        "messages": [{"$ref": "#/channels/users/messages/UserResponse"}]
      },
      "x-the-codegen-project": {
        "functionTypeMapping": ["http_client"]
      }
    },
    "deleteUser": {
      "action": "send",
      "channel": {"$ref": "#/channels/users"},
      "messages": [],
      "bindings": {
        "http": {"method": "DELETE"}
      },
      "reply": {
        "channel": {"$ref": "#/channels/users"},
        "messages": [{"$ref": "#/channels/users/messages/UserResponse"}]
      },
      "x-the-codegen-project": {
        "functionTypeMapping": ["http_client"]
      }
    }
  },
  "components": {
    "schemas": {
      "User": {
        "type": "object",
        "properties": {
          "id": {"type": "string"},
          "name": {"type": "string"},
          "email": {"type": "string", "format": "email"},
          "created_at": {"type": "string", "format": "date-time"}
        },
        "required": ["name", "email"]
      }
    }
  }
}
```

### Kafka

Generate Kafka producers and consumers with proper serialization.

#### Example: Kafka Event Streaming

```json
{
  "asyncapi": "3.0.0",
  "info": {
    "title": "Order Processing Events",
    "version": "1.0.0"
  },
  "channels": {
    "order-events": {
      "address": "orders.{eventType}.{region}",
      "parameters": {
        "eventType": {
          "enum": ["created", "updated", "cancelled", "completed"]
        },
        "region": {
          "enum": ["us", "eu", "asia"]
        }
      },
      "messages": {
        "OrderEvent": {
          "payload": {
            "$ref": "#/components/schemas/OrderEvent"
          },
          "headers": {
            "$ref": "#/components/schemas/EventHeaders"
          }
        }
      }
    }
  },
  "operations": {
    "publishOrderEvent": {
      "action": "send",
      "channel": {"$ref": "#/channels/order-events"},
      "messages": [{"$ref": "#/channels/order-events/messages/OrderEvent"}],
      "bindings": {
        "kafka": {
          "clientId": "order-service",
          "groupId": "order-processors"
        }
      },
      "x-the-codegen-project": {
        "functionTypeMapping": ["kafka_publish"]
      }
    },
    "subscribeToOrderEvents": {
      "action": "receive",
      "channel": {"$ref": "#/channels/order-events"},
      "messages": [{"$ref": "#/channels/order-events/messages/OrderEvent"}],
      "bindings": {
        "kafka": {
          "groupId": "order-processors",
          "clientId": "order-consumer"
        }
      },
      "x-the-codegen-project": {
        "functionTypeMapping": ["kafka_subscribe"]
      }
    }
  },
  "components": {
    "schemas": {
      "OrderEvent": {
        "type": "object",
        "properties": {
          "orderId": {"type": "string"},
          "customerId": {"type": "string"},
          "amount": {"type": "number"},
          "currency": {"type": "string"},
          "status": {"type": "string"},
          "timestamp": {"type": "string", "format": "date-time"}
        },
        "required": ["orderId", "customerId", "amount", "status"]
      },
      "EventHeaders": {
        "type": "object",
        "properties": {
          "correlationId": {"type": "string"},
          "source": {"type": "string"},
          "version": {"type": "string"}
        }
      }
    }
  }
}
```

### NATS

Generate NATS request/reply patterns and pub/sub functionality.

#### Example: NATS Request-Reply Pattern

```json
{
  "asyncapi": "3.0.0",
  "info": {
    "title": "User Service NATS API",
    "version": "1.0.0"
  },
  "channels": {
    "user-service": {
      "address": "user.service.{operation}",
      "parameters": {
        "operation": {
          "enum": ["get", "create", "update", "delete"]
        }
      },
      "messages": {
        "UserRequest": {
          "payload": {
            "$ref": "#/components/schemas/UserRequest"
          }
        },
        "UserResponse": {
          "payload": {
            "$ref": "#/components/schemas/UserResponse"
          }
        }
      }
    }
  },
  "operations": {
    "requestUserOperation": {
      "action": "send",
      "channel": {"$ref": "#/channels/user-service"},
      "messages": [{"$ref": "#/channels/user-service/messages/UserRequest"}],
      "reply": {
        "channel": {"$ref": "#/channels/user-service"},
        "messages": [{"$ref": "#/channels/user-service/messages/UserResponse"}]
      },
      "x-the-codegen-project": {
        "functionTypeMapping": ["nats_request"]
      }
    },
    "replyToUserOperation": {
      "action": "receive",
      "channel": {"$ref": "#/channels/user-service"},
      "messages": [{"$ref": "#/channels/user-service/messages/UserRequest"}],
      "reply": {
        "channel": {"$ref": "#/channels/user-service"},
        "messages": [{"$ref": "#/channels/user-service/messages/UserResponse"}]
      },
      "x-the-codegen-project": {
        "functionTypeMapping": ["nats_reply"]
      }
    }
  },
  "components": {
    "schemas": {
      "UserRequest": {
        "type": "object",
        "properties": {
          "operation": {"type": "string"},
          "userId": {"type": "string"},
          "data": {"type": "object"}
        },
        "required": ["operation"]
      },
      "UserResponse": {
        "type": "object",
        "properties": {
          "success": {"type": "boolean"},
          "data": {"type": "object"},
          "error": {"type": "string"}
        },
        "required": ["success"]
      }
    }
  }
}
```

### MQTT

Generate MQTT publish/subscribe clients with QoS levels.

#### Example: IoT Device Communications

```json
{
  "asyncapi": "3.0.0",
  "info": {
    "title": "IoT Device Management",
    "version": "1.0.0"
  },
  "channels": {
    "device-telemetry": {
      "address": "devices/{deviceId}/telemetry/{sensorType}",
      "parameters": {
        "deviceId": {
          "description": "Unique device identifier"
        },
        "sensorType": {
          "enum": ["temperature", "humidity", "pressure", "motion"]
        }
      },
      "messages": {
        "TelemetryData": {
          "payload": {
            "$ref": "#/components/schemas/TelemetryData"
          }
        }
      }
    },
    "device-commands": {
      "address": "devices/{deviceId}/commands",
      "parameters": {
        "deviceId": {
          "description": "Unique device identifier"
        }
      },
      "messages": {
        "DeviceCommand": {
          "payload": {
            "$ref": "#/components/schemas/DeviceCommand"
          }
        }
      }
    }
  },
  "operations": {
    "publishTelemetry": {
      "action": "send",
      "channel": {"$ref": "#/channels/device-telemetry"},
      "messages": [{"$ref": "#/channels/device-telemetry/messages/TelemetryData"}],
      "bindings": {
        "mqtt": {
          "qos": 1,
          "retain": false
        }
      },
      "x-the-codegen-project": {
        "functionTypeMapping": ["mqtt_publish"]
      }
    },
    "subscribeToTelemetry": {
      "action": "receive",
      "channel": {"$ref": "#/channels/device-telemetry"},
      "messages": [{"$ref": "#/channels/device-telemetry/messages/TelemetryData"}],
      "bindings": {
        "mqtt": {
          "qos": 1
        }
      },
      "x-the-codegen-project": {
        "functionTypeMapping": ["mqtt_subscribe"]
      }
    },
    "sendCommand": {
      "action": "send",
      "channel": {"$ref": "#/channels/device-commands"},
      "messages": [{"$ref": "#/channels/device-commands/messages/DeviceCommand"}],
      "bindings": {
        "mqtt": {
          "qos": 2,
          "retain": true
        }
      },
      "x-the-codegen-project": {
        "functionTypeMapping": ["mqtt_publish"]
      }
    }
  },
  "components": {
    "schemas": {
      "TelemetryData": {
        "type": "object",
        "properties": {
          "deviceId": {"type": "string"},
          "sensorType": {"type": "string"},
          "value": {"type": "number"},
          "unit": {"type": "string"},
          "timestamp": {"type": "string", "format": "date-time"},
          "location": {
            "type": "object",
            "properties": {
              "latitude": {"type": "number"},
              "longitude": {"type": "number"}
            }
          }
        },
        "required": ["deviceId", "sensorType", "value", "timestamp"]
      },
      "DeviceCommand": {
        "type": "object",
        "properties": {
          "command": {"type": "string"},
          "parameters": {"type": "object"},
          "commandId": {"type": "string"},
          "timestamp": {"type": "string", "format": "date-time"}
        },
        "required": ["command", "commandId"]
      }
    }
  }
}
```

### AMQP

Generate AMQP producers and consumers for message queuing.

#### Example: Order Processing Queue

```json
{
  "asyncapi": "3.0.0",
  "info": {
    "title": "Order Processing Queue",
    "version": "1.0.0"
  },
  "channels": {
    "order-queue": {
      "address": "orders.processing",
      "messages": {
        "OrderMessage": {
          "payload": {
            "$ref": "#/components/schemas/Order"
          },
          "headers": {
            "$ref": "#/components/schemas/MessageHeaders"
          }
        }
      }
    },
    "order-dlq": {
      "address": "orders.dead-letter",
      "messages": {
        "FailedOrderMessage": {
          "payload": {
            "$ref": "#/components/schemas/FailedOrder"
          }
        }
      }
    }
  },
  "operations": {
    "publishOrder": {
      "action": "send",
      "channel": {"$ref": "#/channels/order-queue"},
      "messages": [{"$ref": "#/channels/order-queue/messages/OrderMessage"}],
      "bindings": {
        "amqp": {
          "exchange": {
            "name": "orders",
            "type": "topic",
            "durable": true
          },
          "routingKey": "order.created"
        }
      },
      "x-the-codegen-project": {
        "functionTypeMapping": ["amqp_publish"]
      }
    },
    "consumeOrders": {
      "action": "receive",
      "channel": {"$ref": "#/channels/order-queue"},
      "messages": [{"$ref": "#/channels/order-queue/messages/OrderMessage"}],
      "bindings": {
        "amqp": {
          "queue": {
            "name": "order-processing-queue",
            "durable": true,
            "exclusive": false,
            "autoDelete": false
          },
          "ack": true
        }
      },
      "x-the-codegen-project": {
        "functionTypeMapping": ["amqp_consume"]
      }
    }
  },
  "components": {
    "schemas": {
      "Order": {
        "type": "object",
        "properties": {
          "orderId": {"type": "string"},
          "customerId": {"type": "string"},
          "items": {
            "type": "array",
            "items": {
              "type": "object",
              "properties": {
                "productId": {"type": "string"},
                "quantity": {"type": "integer"},
                "price": {"type": "number"}
              }
            }
          },
          "totalAmount": {"type": "number"},
          "currency": {"type": "string"},
          "orderDate": {"type": "string", "format": "date-time"}
        },
        "required": ["orderId", "customerId", "items", "totalAmount"]
      },
      "FailedOrder": {
        "type": "object",
        "properties": {
          "orderId": {"type": "string"},
          "error": {"type": "string"},
          "retryCount": {"type": "integer"},
          "failedAt": {"type": "string", "format": "date-time"}
        }
      },
      "MessageHeaders": {
        "type": "object",
        "properties": {
          "messageId": {"type": "string"},
          "correlationId": {"type": "string"},
          "timestamp": {"type": "string", "format": "date-time"},
          "priority": {"type": "integer", "minimum": 0, "maximum": 255}
        }
      }
    }
  }
}
```

### EventSource

Generate Server-Sent Events (SSE) implementations for real-time updates.

#### Example: Real-time Notifications

```json
{
  "asyncapi": "3.0.0",
  "info": {
    "title": "Real-time Notifications",
    "version": "1.0.0"
  },
  "channels": {
    "user-notifications": {
      "address": "/events/users/{userId}/notifications",
      "parameters": {
        "userId": {
          "description": "User identifier for targeted notifications"
        }
      },
      "messages": {
        "Notification": {
          "payload": {
            "$ref": "#/components/schemas/Notification"
          }
        },
        "SystemAlert": {
          "payload": {
            "$ref": "#/components/schemas/SystemAlert"
          }
        }
      }
    },
    "live-updates": {
      "address": "/events/live/{topic}",
      "parameters": {
        "topic": {
          "enum": ["stock-prices", "sports-scores", "weather-alerts"]
        }
      },
      "messages": {
        "LiveUpdate": {
          "payload": {
            "$ref": "#/components/schemas/LiveUpdate"
          }
        }
      }
    }
  },
  "operations": {
    "streamUserNotifications": {
      "action": "send",
      "channel": {"$ref": "#/channels/user-notifications"},
      "messages": [
        {"$ref": "#/channels/user-notifications/messages/Notification"},
        {"$ref": "#/channels/user-notifications/messages/SystemAlert"}
      ],
      "x-the-codegen-project": {
        "functionTypeMapping": ["event_source_express"]
      }
    },
    "streamLiveUpdates": {
      "action": "send",
      "channel": {"$ref": "#/channels/live-updates"},
      "messages": [{"$ref": "#/channels/live-updates/messages/LiveUpdate"}],
      "x-the-codegen-project": {
        "functionTypeMapping": ["event_source_express"]
      }
    }
  },
  "components": {
    "schemas": {
      "Notification": {
        "type": "object",
        "properties": {
          "id": {"type": "string"},
          "userId": {"type": "string"},
          "type": {"type": "string", "enum": ["info", "warning", "error", "success"]},
          "title": {"type": "string"},
          "message": {"type": "string"},
          "timestamp": {"type": "string", "format": "date-time"},
          "actionUrl": {"type": "string", "format": "uri"},
          "read": {"type": "boolean", "default": false}
        },
        "required": ["id", "userId", "type", "title", "message", "timestamp"]
      },
      "SystemAlert": {
        "type": "object",
        "properties": {
          "alertId": {"type": "string"},
          "severity": {"type": "string", "enum": ["low", "medium", "high", "critical"]},
          "service": {"type": "string"},
          "message": {"type": "string"},
          "timestamp": {"type": "string", "format": "date-time"},
          "resolved": {"type": "boolean", "default": false}
        },
        "required": ["alertId", "severity", "service", "message", "timestamp"]
      },
      "LiveUpdate": {
        "type": "object",
        "properties": {
          "topic": {"type": "string"},
          "data": {"type": "object"},
          "timestamp": {"type": "string", "format": "date-time"},
          "sequence": {"type": "integer"}
        },
        "required": ["topic", "data", "timestamp"]
      }
    }
  }
}
```

## FAQ

### How does it relate to AsyncAPI Generator and templates?
It is fairly similar in functionality except in some key areas.

Templates are similar to presets except you can bind presets together to make it easier to render code down stream.

The AsyncAPI Generator is like the core of the Codegen Project, however it does not enable different inputs than AsyncAPI documents. 

### Can I mix multiple protocols in one document?
Yes! You can define operations with different protocol bindings in the same AsyncAPI document. Use the `x-the-codegen-project` extension to specify which generators to use for each operation.

### How do I handle versioning?
Use the `info.version` field in your AsyncAPI document and consider using separate documents for major version changes. You can also use channel addressing patterns to include version information.

### Can I customize the generated code structure?
Yes, use the `x-the-codegen-project` extension properties to customize channel names, function mappings, and other generation aspects. If you want full control, use the [custom preset](../generators/custom.md)
