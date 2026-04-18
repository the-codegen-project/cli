/**
 * Unit tests for JSDoc generation utilities.
 * Tests the utility functions used to generate JSDoc comments
 * from API specification descriptions.
 */

describe('JSDoc Utilities', () => {
  describe('escapeJSDocDescription', () => {
    // These tests will verify escapeJSDocDescription from channels/utils.ts
    it('should escape closing comment markers', async () => {
      const { escapeJSDocDescription } = await import('../../../../src/codegen/generators/typescript/channels/utils');
      const input = 'This has a */ in the middle';
      const result = escapeJSDocDescription(input);
      // Should escape the closing comment
      expect(result).not.toContain('*/');
    });

    it('should format multi-line descriptions', async () => {
      const { escapeJSDocDescription } = await import('../../../../src/codegen/generators/typescript/channels/utils');
      const input = 'First line\nSecond line\nThird line';
      const result = escapeJSDocDescription(input);
      // Each new line should be formatted with JSDoc prefix
      expect(result).toContain('\n * ');
    });

    it('should handle empty strings', async () => {
      const { escapeJSDocDescription } = await import('../../../../src/codegen/generators/typescript/channels/utils');
      const result = escapeJSDocDescription('');
      expect(result).toBe('');
    });

    it('should handle descriptions without special characters', async () => {
      const { escapeJSDocDescription } = await import('../../../../src/codegen/generators/typescript/channels/utils');
      const input = 'A simple description';
      const result = escapeJSDocDescription(input);
      expect(result).toBe(input);
    });
  });

  describe('renderChannelJSDoc', () => {
    // These tests will verify renderChannelJSDoc from channels/utils.ts
    it('should render JSDoc with description', async () => {
      const { renderChannelJSDoc } = await import('../../../../src/codegen/generators/typescript/channels/utils');
      const result = renderChannelJSDoc({
        description: 'My operation description',
        deprecated: false,
        fallbackDescription: 'Fallback text',
        parameters: []
      });
      expect(result).toContain('/**');
      expect(result).toContain('My operation description');
      expect(result).toContain('*/');
    });

    it('should use fallback when no description provided', async () => {
      const { renderChannelJSDoc } = await import('../../../../src/codegen/generators/typescript/channels/utils');
      const result = renderChannelJSDoc({
        description: undefined,
        deprecated: false,
        fallbackDescription: 'Fallback text',
        parameters: []
      });
      expect(result).toContain('Fallback text');
    });

    it('should include @deprecated tag when deprecated is true', async () => {
      const { renderChannelJSDoc } = await import('../../../../src/codegen/generators/typescript/channels/utils');
      const result = renderChannelJSDoc({
        description: 'Some description',
        deprecated: true,
        fallbackDescription: 'Fallback',
        parameters: []
      });
      expect(result).toContain('@deprecated');
    });

    it('should not include @deprecated when deprecated is false', async () => {
      const { renderChannelJSDoc } = await import('../../../../src/codegen/generators/typescript/channels/utils');
      const result = renderChannelJSDoc({
        description: 'Some description',
        deprecated: false,
        fallbackDescription: 'Fallback',
        parameters: []
      });
      expect(result).not.toContain('@deprecated');
    });

    it('should include parameter JSDoc', async () => {
      const { renderChannelJSDoc } = await import('../../../../src/codegen/generators/typescript/channels/utils');
      const result = renderChannelJSDoc({
        description: 'Some description',
        deprecated: false,
        fallbackDescription: 'Fallback',
        parameters: [
          { jsDoc: ' * @param userId The unique user identifier' },
          { jsDoc: ' * @param orderId The order identifier' }
        ]
      });
      expect(result).toContain('@param userId');
      expect(result).toContain('The unique user identifier');
      expect(result).toContain('@param orderId');
    });

    it('should produce valid JSDoc format', async () => {
      const { renderChannelJSDoc } = await import('../../../../src/codegen/generators/typescript/channels/utils');
      const result = renderChannelJSDoc({
        description: 'Description here',
        deprecated: true,
        fallbackDescription: 'Fallback',
        parameters: [{ jsDoc: ' * @param param1 description' }]
      });
      // Should be valid JSDoc
      expect(result.startsWith('/**')).toBe(true);
      expect(result.endsWith('*/')).toBe(true);
      // Each line except first and last should start with ' *'
      const lines = result.split('\n');
      expect(lines[0]).toBe('/**');
      expect(lines[lines.length - 1].trim()).toBe('*/');
    });
  });
});
