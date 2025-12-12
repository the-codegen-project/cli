---
sidebar_position: 8
---

# Telemetry

The Codegen Project CLI collects **anonymous** usage data to help us understand how the tool is being used and make data-driven improvements.

## Privacy First

We take your privacy seriously. Here's what we collect and what we don't:

### ✅ What We Collect

- **Command usage**: Which commands you run (e.g., `generate`, `init`)
- **Generator types**: Which generators you use (e.g., `payloads`, `channels`)
- **Input source types**: Whether you use remote URLs, local relative paths, or absolute paths (not the actual paths)
- **Feature usage**: Which flags and options you use
- **Error categories**: Types of errors that occur (not error messages or stack traces)
- **System information**: CLI version, Node.js version, OS platform
- **Execution metrics**: Command duration and success rates

### ❌ What We DON'T Collect

- ❌ File paths or file names
- ❌ Actual URLs or file locations
- ❌ File contents or schema details
- ❌ Project names
- ❌ User names or emails
- ❌ API keys or credentials
- ❌ IP addresses (anonymized by analytics provider)
- ❌ Hostnames
- ❌ Environment variable values
- ❌ Git repository information
- ❌ Custom schema structures

## Managing Telemetry

### Check Status

View your current telemetry settings:

```bash
codegen telemetry status
```

This shows:
- Whether telemetry is enabled or disabled
- Configuration file location
- What data is collected
- Environment variable overrides

### Disable Telemetry

You can disable telemetry in several ways:

#### Option 1: Using the CLI command

```bash
codegen telemetry disable
```

#### Option 2: Environment variable (permanent)

Add to your shell profile (`.bashrc`, `.zshrc`, etc.):

```bash
export CODEGEN_TELEMETRY_DISABLED=1
```

Or use the standard DO_NOT_TRACK variable:

```bash
export DO_NOT_TRACK=1
```

#### Option 3: Environment variable (per-command)

```bash
CODEGEN_TELEMETRY_DISABLED=1 codegen generate
```

#### Option 4: Project-level configuration

In your `codegen.config.js`:

```javascript
export default {
  inputType: 'asyncapi',
  inputPath: './asyncapi.yaml',
  generators: [/* ... */],
  
  // Disable telemetry for this project
  telemetry: {
    enabled: false
  }
}
```

### Re-enable Telemetry

```bash
codegen telemetry enable
```

## First-Run Notice

When you run any command for the first time, you'll see a notice about telemetry:

```
┌─────────────────────────────────────────────────────────────┐
│                                                             │
│  The Codegen Project CLI collects anonymous usage data      │
│  to help us improve the tool.                               │
│                                                             │
│  To disable: codegen telemetry disable                      │
│  Learn more: https://the-codegen-project.org/docs/telemetry │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

This notice is shown only once. Telemetry is **opt-out by default**, meaning it's enabled unless you explicitly disable it.

## Debug Mode

To see what telemetry data would be sent without actually sending it:

```bash
CODEGEN_TELEMETRY_DEBUG=1 codegen generate
```

This logs telemetry events to the console without sending them to the analytics endpoint.

## Custom Tracking Endpoint (for Organizations)

Organizations can point telemetry to their own analytics endpoint:

```bash
# Set custom endpoint
export CODEGEN_TELEMETRY_ENDPOINT=https://analytics.mycompany.com/telemetry
export CODEGEN_TELEMETRY_ID=custom-tracking-id
export CODEGEN_TELEMETRY_API_SECRET=your-api-secret
```

Expected endpoint format (GA4 Measurement Protocol compatible):

```
POST /telemetry
Content-Type: application/json

{
  "client_id": "anonymous-uuid",
  "events": [{
    "name": "command_executed",
    "params": {
      "command": "generate",
      "duration": 1234,
      "success": true,
      "cli_version": "0.57.0",
      "node_version": "v18.0.0",
      "os": "darwin",
      "ci": false
    }
  }]
}
```

## Configuration File

Telemetry settings are stored in:

```
~/.the-codegen-project/config.json
```

Example configuration:

```json
{
  "version": "1.0.0",
  "telemetry": {
    "enabled": true,
    "anonymousId": "550e8400-e29b-41d4-a716-446655440000",
    "endpoint": "https://www.google-analytics.com/mp/collect",
    "trackingId": "G-XXXXXXXXXX"
  },
  "hasShownTelemetryNotice": true,
  "lastUpdated": "2024-12-11T10:30:00Z"
}
```

## Example Telemetry Events

### Command Execution

```javascript
{
  event: 'command_executed',
  command: 'generate',
  flags: ['watch'],
  input_source: 'local_relative',    // Not the actual path!
  input_type: 'asyncapi',
  generators: ['payloads', 'parameters', 'channels'],  // Generator combination used
  generator_count: 3,
  duration: 1234,
  success: true,
  cli_version: '0.57.0',
  node_version: 'v18.0.0',
  os: 'darwin',
  ci: false
}
```

**Why track generator combinations?** This helps us understand:
- Which generators are commonly used together
- Popular generator patterns (e.g., "payloads + parameters")
- If certain generators are always used in isolation
- Common workflows and use cases

### Generator Usage

```javascript
{
  event: 'generator_used',
  generator_type: 'payloads',
  input_type: 'asyncapi',          // Can be: asyncapi, openapi, jsonschema
  input_source: 'remote_url',      // Not the actual URL!
  language: 'typescript',
  options: {                       // Actual generator configuration (sanitized)
    includeValidation: true,
    serializationType: 'json'
  },
  duration: 500,
  success: true
}
```

**Why track individual generators?** This helps us understand:
- Which generators are most popular
- How users configure generators (validation, serialization, etc.)
- Performance characteristics of each generator
- Success/failure rates per generator type

**Combined with `command_executed` event**, we get both:
- **Macro view**: What generators are used together
- **Micro view**: How each generator is configured

### Init Command

```javascript
{
  event: 'init_executed',
  config_type: 'esm',
  input_type: 'asyncapi',
  generators: ['payloads', 'parameters', 'channels'],
  language: 'typescript',
  completed: true
}
```

### Error Tracking

```javascript
{
  event: 'error_occurred',
  command: 'generate',
  error_type: 'configuration_error',  // Category only, not actual error message
  cli_version: '0.57.0',
  node_version: 'v18.0.0'
}
```

## CI/CD Environments

Telemetry automatically detects CI environments and adjusts behavior:

- **First-run notice is skipped** in CI environments
- Telemetry still runs by default (to track CI usage patterns)
- You can disable it with environment variables if needed

Detected CI environments:
- GitHub Actions
- GitLab CI
- CircleCI
- Travis CI
- Jenkins
- Bitbucket Pipelines
- AWS CodeBuild
- TeamCity
- Buildkite

## Privacy & Compliance

### GDPR Compliance

Our telemetry implementation is GDPR compliant:

- ✅ **Lawful Basis**: Legitimate interest (improving software)
- ✅ **Transparency**: Clear notice on first run
- ✅ **User Control**: Easy opt-out mechanism
- ✅ **Data Minimization**: Only collect necessary data
- ✅ **Purpose Limitation**: Use only for improvement
- ✅ **Anonymization**: No PII collected
- ✅ **Right to Object**: Users can disable anytime

### Data Retention

We store data for 14 months, if you use your own telemetry, then its up to you.

### Anonymous ID

Each installation generates a random UUID (v4) as an anonymous identifier. This ID:
- Is NOT tied to your identity
- Cannot be used to identify you personally
- Is only used to understand usage patterns
- Can be reset by deleting the config file

## How Telemetry Helps

The data we collect helps us:

1. **Prioritize features**: Focus on the most-used generators and commands
2. **Improve reliability**: Identify and fix common error scenarios
3. **Optimize performance**: Understand typical execution times
4. **Support platforms**: Know which Node.js versions and OS platforms to support
5. **Guide documentation**: Understand which features cause confusion
6. **Understand workflows**: Learn whether users prefer remote URLs, relative paths, or absolute paths

## Technical Details

### Implementation

- **Non-blocking**: Telemetry runs asynchronously and never blocks CLI execution
- **Fail-safe**: Network errors or timeouts don't affect CLI functionality
- **Fast timeout**: Telemetry requests timeout after 1 second
- **Error handling**: All errors are handled gracefully and silently

### Default Analytics Provider

We use Google Analytics 4 Measurement Protocol by default:
- Free service with powerful analytics
- Automatic IP anonymization
- GDPR compliant
- No additional infrastructure needed

## FAQ

### Q: Will telemetry slow down my CLI?

**A**: No. Telemetry runs asynchronously and doesn't block command execution. Network requests timeout after 1 second and fail silently.

### Q: Can telemetry errors break my CLI?

**A**: No. All telemetry functions are designed to never throw errors. Failures are handled internally and don't affect CLI functionality.

### Q: Does this work behind a corporate proxy?

**A**: Yes. Telemetry respects standard `HTTP_PROXY` and `HTTPS_PROXY` environment variables. If it fails, it fails silently without affecting the CLI.

### Q: Can I see what's being sent?

**A**: Yes! Use debug mode:

```bash
CODEGEN_TELEMETRY_DEBUG=1 codegen generate
```

### Q: Why opt-out instead of opt-in?

**A**: Opt-out telemetry provides more representative data about how the tool is actually used, which leads to better improvements for all users. However, we respect your choice to opt-out at any time.

### Q: Is my company's internal tracking supported?

**A**: Yes! Set `CODEGEN_TELEMETRY_ENDPOINT` to your internal analytics service. See the "Custom Tracking Endpoint" section above.

### Q: Where is the data sent?

**A**: By default, to Google Analytics 4 (anonymized). You can configure a custom endpoint for organizational tracking.

### Q: Can you track me across projects?

**A**: We use an anonymous UUID that is the same across all your projects (any where you interact with the-codegen-project), but it's not tied to any personal information. You can reset it by deleting `~/.the-codegen-project/config.json`.

## Contact

If you have questions or concerns about telemetry:

- GitHub Issues: [the-codegen-project/cli](https://github.com/the-codegen-project/cli/issues)
