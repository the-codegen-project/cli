/**
 * Runtime tests for format-validated payload types.
 * Tests email, uri, uuid, date, date-time, time, hostname, ipv4, ipv6 formats.
 */
import * as FormatEmail from '../../src/payload-types/payloads/FormatEmail';
import * as FormatUri from '../../src/payload-types/payloads/FormatUri';
import * as FormatUuid from '../../src/payload-types/payloads/FormatUuid';
import * as FormatDate from '../../src/payload-types/payloads/FormatDate';
import * as FormatDateTime from '../../src/payload-types/payloads/FormatDateTime';
import * as FormatTime from '../../src/payload-types/payloads/FormatTime';
import * as FormatHostname from '../../src/payload-types/payloads/FormatHostname';
import * as FormatIpv4 from '../../src/payload-types/payloads/FormatIpv4';
import * as FormatIpv6 from '../../src/payload-types/payloads/FormatIpv6';
import { ObjectWithFormats } from '../../src/payload-types/payloads/ObjectWithFormats';

describe('Format Validation', () => {
  describe('FormatEmail', () => {
    test('should marshal email', () => {
      const value: FormatEmail.FormatEmail = 'user@example.com';
      const serialized = FormatEmail.marshal(value);
      expect(serialized).toBe('"user@example.com"');
    });

    test('should unmarshal email', () => {
      const result = FormatEmail.unmarshal('"test@test.com"');
      expect(result).toBe('test@test.com');
    });

    test('should validate correct email', () => {
      const result = FormatEmail.validate({ data: '"user@example.com"' });
      expect(result.valid).toBe(true);
    });

    test('should validate email with subdomain', () => {
      const result = FormatEmail.validate({ data: '"user@mail.example.com"' });
      expect(result.valid).toBe(true);
    });

    test('should validate email with plus sign', () => {
      const result = FormatEmail.validate({ data: '"user+tag@example.com"' });
      expect(result.valid).toBe(true);
    });

    test('should invalidate email without @', () => {
      const result = FormatEmail.validate({ data: '"userexample.com"' });
      expect(result.valid).toBe(false);
      expect(result.errors).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ keyword: 'format' })
        ])
      );
    });

    test('should invalidate email without domain', () => {
      const result = FormatEmail.validate({ data: '"user@"' });
      expect(result.valid).toBe(false);
    });
  });

  describe('FormatUri', () => {
    test('should marshal URI', () => {
      const value: FormatUri.FormatUri = 'https://example.com/path';
      const serialized = FormatUri.marshal(value);
      expect(serialized).toBe('"https://example.com/path"');
    });

    test('should validate https URI', () => {
      const result = FormatUri.validate({ data: '"https://example.com"' });
      expect(result.valid).toBe(true);
    });

    test('should validate http URI', () => {
      const result = FormatUri.validate({ data: '"http://example.com/path/to/resource"' });
      expect(result.valid).toBe(true);
    });

    test('should validate URI with query params', () => {
      const result = FormatUri.validate({ data: '"https://example.com/search?q=test&page=1"' });
      expect(result.valid).toBe(true);
    });

    test('should validate URI with fragment', () => {
      const result = FormatUri.validate({ data: '"https://example.com/page#section"' });
      expect(result.valid).toBe(true);
    });

    test('should validate ftp URI', () => {
      const result = FormatUri.validate({ data: '"ftp://ftp.example.com/file.txt"' });
      expect(result.valid).toBe(true);
    });

    test('should invalidate invalid URI', () => {
      const result = FormatUri.validate({ data: '"not a uri"' });
      expect(result.valid).toBe(false);
    });
  });

  describe('FormatUuid', () => {
    test('should marshal UUID', () => {
      const value: FormatUuid.FormatUuid = '550e8400-e29b-41d4-a716-446655440000';
      const serialized = FormatUuid.marshal(value);
      expect(serialized).toBe('"550e8400-e29b-41d4-a716-446655440000"');
    });

    test('should unmarshal UUID', () => {
      const result = FormatUuid.unmarshal('"123e4567-e89b-12d3-a456-426614174000"');
      expect(result).toBe('123e4567-e89b-12d3-a456-426614174000');
    });

    test('should validate correct UUID v4', () => {
      const result = FormatUuid.validate({ data: '"550e8400-e29b-41d4-a716-446655440000"' });
      expect(result.valid).toBe(true);
    });

    test('should validate UUID v1', () => {
      const result = FormatUuid.validate({ data: '"6ba7b810-9dad-11d1-80b4-00c04fd430c8"' });
      expect(result.valid).toBe(true);
    });

    test('should validate lowercase UUID', () => {
      const result = FormatUuid.validate({ data: '"a1b2c3d4-e5f6-7890-abcd-ef1234567890"' });
      expect(result.valid).toBe(true);
    });

    test('should invalidate invalid UUID format', () => {
      const result = FormatUuid.validate({ data: '"not-a-uuid"' });
      expect(result.valid).toBe(false);
    });

    test('should invalidate UUID with wrong length', () => {
      const result = FormatUuid.validate({ data: '"550e8400-e29b-41d4-a716-44665544000"' }); // one char short
      expect(result.valid).toBe(false);
    });
  });

  describe('FormatDate', () => {
    test('should marshal date', () => {
      const value: FormatDate.FormatDate = '2024-01-15';
      const serialized = FormatDate.marshal(value);
      expect(serialized).toBe('"2024-01-15"');
    });

    test('should unmarshal date', () => {
      const result = FormatDate.unmarshal('"2024-12-25"');
      expect(result).toBe('2024-12-25');
    });

    test('should validate correct date', () => {
      const result = FormatDate.validate({ data: '"2024-01-15"' });
      expect(result.valid).toBe(true);
    });

    test('should validate leap year date', () => {
      const result = FormatDate.validate({ data: '"2024-02-29"' });
      expect(result.valid).toBe(true);
    });

    test('should invalidate invalid date format', () => {
      const result = FormatDate.validate({ data: '"15-01-2024"' }); // wrong order
      expect(result.valid).toBe(false);
    });

    test('should invalidate date with slashes', () => {
      const result = FormatDate.validate({ data: '"2024/01/15"' });
      expect(result.valid).toBe(false);
    });
  });

  describe('FormatDateTime', () => {
    test('should marshal datetime', () => {
      const value: FormatDateTime.FormatDateTime = '2024-01-15T10:30:00Z';
      const serialized = FormatDateTime.marshal(value);
      expect(serialized).toBe('"2024-01-15T10:30:00Z"');
    });

    test('should validate ISO 8601 datetime with Z', () => {
      const result = FormatDateTime.validate({ data: '"2024-01-15T10:30:00Z"' });
      expect(result.valid).toBe(true);
    });

    test('should validate datetime with timezone offset', () => {
      const result = FormatDateTime.validate({ data: '"2024-01-15T10:30:00+05:30"' });
      expect(result.valid).toBe(true);
    });

    test('should validate datetime with milliseconds', () => {
      const result = FormatDateTime.validate({ data: '"2024-01-15T10:30:00.123Z"' });
      expect(result.valid).toBe(true);
    });

    test('should validate datetime with negative offset', () => {
      const result = FormatDateTime.validate({ data: '"2024-01-15T10:30:00-08:00"' });
      expect(result.valid).toBe(true);
    });

    test('should invalidate date-only', () => {
      const result = FormatDateTime.validate({ data: '"2024-01-15"' });
      expect(result.valid).toBe(false);
    });

    test('should invalidate invalid datetime', () => {
      const result = FormatDateTime.validate({ data: '"not a datetime"' });
      expect(result.valid).toBe(false);
    });
  });

  describe('FormatTime', () => {
    test('should marshal time', () => {
      const value: FormatTime.FormatTime = '10:30:00';
      const serialized = FormatTime.marshal(value);
      expect(serialized).toBe('"10:30:00"');
    });

    test('should validate correct time', () => {
      const result = FormatTime.validate({ data: '"10:30:00"' });
      expect(result.valid).toBe(true);
    });

    test('should validate midnight', () => {
      const result = FormatTime.validate({ data: '"00:00:00"' });
      expect(result.valid).toBe(true);
    });

    test('should validate end of day', () => {
      const result = FormatTime.validate({ data: '"23:59:59"' });
      expect(result.valid).toBe(true);
    });

    test('should validate time with timezone', () => {
      const result = FormatTime.validate({ data: '"10:30:00Z"' });
      expect(result.valid).toBe(true);
    });

    test('should invalidate 24:00:00', () => {
      const result = FormatTime.validate({ data: '"24:00:00"' });
      expect(result.valid).toBe(false);
    });

    test('should invalidate invalid time', () => {
      const result = FormatTime.validate({ data: '"25:70:99"' });
      expect(result.valid).toBe(false);
    });
  });

  describe('FormatHostname', () => {
    test('should marshal hostname', () => {
      const value: FormatHostname.FormatHostname = 'example.com';
      const serialized = FormatHostname.marshal(value);
      expect(serialized).toBe('"example.com"');
    });

    test('should validate simple hostname', () => {
      const result = FormatHostname.validate({ data: '"example.com"' });
      expect(result.valid).toBe(true);
    });

    test('should validate subdomain hostname', () => {
      const result = FormatHostname.validate({ data: '"www.example.com"' });
      expect(result.valid).toBe(true);
    });

    test('should validate deep subdomain', () => {
      const result = FormatHostname.validate({ data: '"api.v1.staging.example.com"' });
      expect(result.valid).toBe(true);
    });

    test('should validate localhost', () => {
      const result = FormatHostname.validate({ data: '"localhost"' });
      expect(result.valid).toBe(true);
    });

    test('should validate hostname with numbers', () => {
      const result = FormatHostname.validate({ data: '"server01.example.com"' });
      expect(result.valid).toBe(true);
    });

    test('should invalidate hostname with protocol', () => {
      const result = FormatHostname.validate({ data: '"https://example.com"' });
      expect(result.valid).toBe(false);
    });
  });

  describe('FormatIpv4', () => {
    test('should marshal IPv4', () => {
      const value: FormatIpv4.FormatIpv4 = '192.168.1.1';
      const serialized = FormatIpv4.marshal(value);
      expect(serialized).toBe('"192.168.1.1"');
    });

    test('should validate correct IPv4', () => {
      const result = FormatIpv4.validate({ data: '"192.168.1.1"' });
      expect(result.valid).toBe(true);
    });

    test('should validate localhost IPv4', () => {
      const result = FormatIpv4.validate({ data: '"127.0.0.1"' });
      expect(result.valid).toBe(true);
    });

    test('should validate broadcast address', () => {
      const result = FormatIpv4.validate({ data: '"255.255.255.255"' });
      expect(result.valid).toBe(true);
    });

    test('should validate zeros', () => {
      const result = FormatIpv4.validate({ data: '"0.0.0.0"' });
      expect(result.valid).toBe(true);
    });

    test('should invalidate IPv4 with out-of-range octet', () => {
      const result = FormatIpv4.validate({ data: '"256.1.1.1"' });
      expect(result.valid).toBe(false);
    });

    test('should invalidate IPv4 with too few octets', () => {
      const result = FormatIpv4.validate({ data: '"192.168.1"' });
      expect(result.valid).toBe(false);
    });

    test('should invalidate IPv6 as IPv4', () => {
      const result = FormatIpv4.validate({ data: '"::1"' });
      expect(result.valid).toBe(false);
    });
  });

  describe('FormatIpv6', () => {
    test('should marshal IPv6', () => {
      const value: FormatIpv6.FormatIpv6 = '2001:0db8:85a3:0000:0000:8a2e:0370:7334';
      const serialized = FormatIpv6.marshal(value);
      expect(serialized).toBe('"2001:0db8:85a3:0000:0000:8a2e:0370:7334"');
    });

    test('should validate full IPv6', () => {
      const result = FormatIpv6.validate({ data: '"2001:0db8:85a3:0000:0000:8a2e:0370:7334"' });
      expect(result.valid).toBe(true);
    });

    test('should validate compressed IPv6', () => {
      const result = FormatIpv6.validate({ data: '"2001:db8:85a3::8a2e:370:7334"' });
      expect(result.valid).toBe(true);
    });

    test('should validate loopback IPv6', () => {
      const result = FormatIpv6.validate({ data: '"::1"' });
      expect(result.valid).toBe(true);
    });

    test('should validate link-local IPv6', () => {
      const result = FormatIpv6.validate({ data: '"fe80::1"' });
      expect(result.valid).toBe(true);
    });

    test('should invalidate IPv4 as IPv6', () => {
      const result = FormatIpv6.validate({ data: '"192.168.1.1"' });
      expect(result.valid).toBe(false);
    });

    test('should invalidate invalid IPv6', () => {
      const result = FormatIpv6.validate({ data: '"not:an:ipv6"' });
      expect(result.valid).toBe(false);
    });
  });

  describe('ObjectWithFormats', () => {
    test('should marshal object with format-validated properties', () => {
      const obj = new ObjectWithFormats({
        email: 'user@example.com',
        website: 'https://example.com',
        userId: '550e8400-e29b-41d4-a716-446655440000',
        birthDate: '1990-01-15',
        lastLogin: '2024-01-15T10:30:00Z',
        serverIp: '192.168.1.1'
      });
      const serialized = obj.marshal();
      const parsed = JSON.parse(serialized);
      expect(parsed.email).toBe('user@example.com');
      expect(parsed.website).toBe('https://example.com');
    });

    test('should validate object with all valid formats', () => {
      const result = ObjectWithFormats.validate({
        data: {
          email: 'user@example.com',
          website: 'https://example.com',
          userId: '550e8400-e29b-41d4-a716-446655440000',
          birthDate: '1990-01-15',
          lastLogin: '2024-01-15T10:30:00Z',
          serverIp: '192.168.1.1'
        }
      });
      expect(result.valid).toBe(true);
    });

    test('should invalidate object with invalid email', () => {
      const result = ObjectWithFormats.validate({
        data: {
          email: 'invalid-email',
          website: 'https://example.com',
          userId: '550e8400-e29b-41d4-a716-446655440000',
          birthDate: '1990-01-15',
          lastLogin: '2024-01-15T10:30:00Z',
          serverIp: '192.168.1.1'
        }
      });
      expect(result.valid).toBe(false);
    });

    test('should invalidate object with invalid URI', () => {
      const result = ObjectWithFormats.validate({
        data: {
          email: 'user@example.com',
          website: 'not a uri',
          userId: '550e8400-e29b-41d4-a716-446655440000',
          birthDate: '1990-01-15',
          lastLogin: '2024-01-15T10:30:00Z',
          serverIp: '192.168.1.1'
        }
      });
      expect(result.valid).toBe(false);
    });

    test('should validate empty object (all fields optional)', () => {
      const result = ObjectWithFormats.validate({
        data: {}
      });
      expect(result.valid).toBe(true);
    });

    test('should validate partial object', () => {
      const result = ObjectWithFormats.validate({
        data: {
          email: 'user@example.com'
        }
      });
      expect(result.valid).toBe(true);
    });
  });
});
