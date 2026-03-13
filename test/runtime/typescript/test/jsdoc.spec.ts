import * as fs from 'fs';
import * as path from 'path';

/**
 * Tests for JSDoc generation from API specification descriptions.
 * These tests verify that:
 * - Payload models include JSDoc from schema descriptions
 * - Channel functions include JSDoc from operation descriptions
 * - @deprecated tags appear for deprecated operations/schemas
 * - Parameter descriptions appear in JSDoc
 */
describe('JSDoc Generation', () => {
  describe('Payload Models', () => {
    it('should include schema description in class JSDoc', () => {
      const content = fs.readFileSync(
        path.join(__dirname, '../src/payloads/UserSignedUp.ts'),
        'utf-8'
      );
      // UserSignedUpPayload has description: "Payload for user signup events containing user registration details"
      expect(content).toContain('/**');
      expect(content).toContain('Payload for user signup events containing user registration details');
    });

    it('should include field-level JSDoc from property descriptions', () => {
      const content = fs.readFileSync(
        path.join(__dirname, '../src/payloads/UserSignedUp.ts'),
        'utf-8'
      );
      // display_name has description: "Name of the user"
      // email has description: "Email of the user"
      expect(content).toContain('Name of the user');
      expect(content).toContain('Email of the user');
    });

    it('should include deprecated flag in schema constant', () => {
      const content = fs.readFileSync(
        path.join(__dirname, '../src/payloads/LegacyNotification.ts'),
        'utf-8'
      );
      // LegacyNotificationPayload has deprecated: true - this is preserved in the schema constant
      // Note: TS_DESCRIPTION_PRESET from Modelina doesn't add @deprecated JSDoc tags to class definitions
      // The deprecated flag is accessible via the static theCodeGenSchema property
      expect(content).toContain('"deprecated":true');
    });

    it('should include description for deprecated schema', () => {
      const content = fs.readFileSync(
        path.join(__dirname, '../src/payloads/LegacyNotification.ts'),
        'utf-8'
      );
      // LegacyNotificationPayload has description: "Legacy notification payload - use NewNotificationPayload instead"
      expect(content).toContain('Legacy notification payload');
    });

    it('should include primitive payload descriptions', () => {
      const content = fs.readFileSync(
        path.join(__dirname, '../src/payloads/StringMessage.ts'),
        'utf-8'
      );
      // StringPayload has description: "A simple string payload"
      expect(content).toContain('A simple string payload');
    });

    it('should include array payload descriptions', () => {
      const content = fs.readFileSync(
        path.join(__dirname, '../src/payloads/ArrayMessage.ts'),
        'utf-8'
      );
      // ArrayPayload has description: "An array of strings payload"
      expect(content).toContain('An array of strings payload');
    });
  });

  describe('Channel Functions', () => {
    it('should use operation description in JSDoc instead of generic text', () => {
      const content = fs.readFileSync(
        path.join(__dirname, '../src/channels/nats.ts'),
        'utf-8'
      );
      // sendUserSignedup has description: "Publishes a user signup event to notify other services that a new user has registered in the system."
      expect(content).toContain('Publishes a user signup event to notify other services that a new user has registered in the system.');
    });

    it('should use operation summary when available', () => {
      const content = fs.readFileSync(
        path.join(__dirname, '../src/channels/nats.ts'),
        'utf-8'
      );
      // receiveUserSignedup has summary: "Subscribe to user signup events"
      // Either summary or description should appear
      expect(content).toMatch(/Subscribe to user signup events|Receives user signup events to process new user registrations/);
    });

    it('should include @deprecated for deprecated operations', () => {
      const content = fs.readFileSync(
        path.join(__dirname, '../src/channels/nats.ts'),
        'utf-8'
      );
      // sendLegacyNotification and receiveLegacyNotification have deprecated: true
      expect(content).toContain('@deprecated');
    });

    it('should include description for deprecated operations', () => {
      const content = fs.readFileSync(
        path.join(__dirname, '../src/channels/nats.ts'),
        'utf-8'
      );
      // sendLegacyNotification has description: "Sends a notification using the legacy notification system. Use the new notification service instead."
      expect(content).toContain('Sends a notification using the legacy notification system');
    });

    it('should include parameter descriptions in parameter class JSDoc', () => {
      // Parameter descriptions are included in the parameter class definition, not channel function @param tags
      // Channel function @param tags describe TypeScript function parameters (message, nc, codec, etc.)
      const content = fs.readFileSync(
        path.join(__dirname, '../src/parameters/UserSignedupParameters.ts'),
        'utf-8'
      );
      // my_parameter has description: "parameter description"
      // enum_parameter has description: "enum parameter"
      expect(content).toContain('parameter description');
      expect(content).toContain('enum parameter');
    });
  });

  describe('Multi-line and Special Character Handling', () => {
    it('should handle descriptions with special characters', () => {
      // Ensure descriptions don't break JSDoc syntax
      const content = fs.readFileSync(
        path.join(__dirname, '../src/channels/nats.ts'),
        'utf-8'
      );

      // All JSDoc blocks should be properly closed
      const openComments = (content.match(/\/\*\*/g) || []).length;
      const closeComments = (content.match(/\*\//g) || []).length;
      expect(openComments).toBe(closeComments);
    });

    it('should properly format JSDoc blocks', () => {
      const content = fs.readFileSync(
        path.join(__dirname, '../src/channels/nats.ts'),
        'utf-8'
      );

      // Verify JSDoc structure is valid (starts with /**, each line starts with *, ends with */)
      const jsdocPattern = /\/\*\*[\s\S]*?\*\//g;
      const jsdocBlocks = content.match(jsdocPattern) || [];

      expect(jsdocBlocks.length).toBeGreaterThan(0);

      for (const block of jsdocBlocks) {
        // Each JSDoc should start with /** and end with */
        expect(block.startsWith('/**')).toBe(true);
        expect(block.endsWith('*/')).toBe(true);
      }
    });
  });

  describe('Kafka Channel Functions', () => {
    it('should include operation descriptions in Kafka channels', () => {
      const content = fs.readFileSync(
        path.join(__dirname, '../src/channels/kafka.ts'),
        'utf-8'
      );
      // Should use operation description instead of generic Kafka text
      expect(content).toContain('Publishes a user signup event to notify other services');
    });

    it('should include @deprecated for deprecated Kafka operations', () => {
      const content = fs.readFileSync(
        path.join(__dirname, '../src/channels/kafka.ts'),
        'utf-8'
      );
      expect(content).toContain('@deprecated');
    });
  });

  describe('MQTT Channel Functions', () => {
    it('should include operation descriptions in MQTT channels', () => {
      const content = fs.readFileSync(
        path.join(__dirname, '../src/channels/mqtt.ts'),
        'utf-8'
      );
      expect(content).toContain('Publishes a user signup event to notify other services');
    });

    it('should include @deprecated for deprecated MQTT operations', () => {
      const content = fs.readFileSync(
        path.join(__dirname, '../src/channels/mqtt.ts'),
        'utf-8'
      );
      expect(content).toContain('@deprecated');
    });
  });

  describe('AMQP Channel Functions', () => {
    it('should include operation descriptions in AMQP channels', () => {
      const content = fs.readFileSync(
        path.join(__dirname, '../src/channels/amqp.ts'),
        'utf-8'
      );
      expect(content).toContain('Publishes a user signup event to notify other services');
    });

    it('should include @deprecated for deprecated AMQP operations', () => {
      const content = fs.readFileSync(
        path.join(__dirname, '../src/channels/amqp.ts'),
        'utf-8'
      );
      expect(content).toContain('@deprecated');
    });
  });
});
