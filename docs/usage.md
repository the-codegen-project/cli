---
sidebar_position: 3
---
# CLI Usage

<!-- usage -->
```sh-session
$ npm install -g @the-codegen-project/cli
$ codegen COMMAND
running command...
$ codegen (--version)
@the-codegen-project/cli/0.64.0 linux-x64 node-v18.20.8
$ codegen --help [COMMAND]
USAGE
  $ codegen COMMAND
...
```
<!-- usagestop -->

## Table of contents

<!-- toc -->
* [CLI Usage](#cli-usage)
<!-- tocstop -->

## Commands

<!-- commands -->
* [`codegen autocomplete [SHELL]`](#codegen-autocomplete-shell)
* [`codegen base`](#codegen-base)
* [`codegen generate [FILE]`](#codegen-generate-file)
* [`codegen help [COMMAND]`](#codegen-help-command)
* [`codegen init`](#codegen-init)
* [`codegen telemetry ACTION`](#codegen-telemetry-action)
* [`codegen version`](#codegen-version)

## `codegen autocomplete [SHELL]`

Display autocomplete installation instructions.

```
USAGE
  $ codegen autocomplete [SHELL] [-r]

ARGUMENTS
  SHELL  (zsh|bash|powershell) Shell type

FLAGS
  -r, --refresh-cache  Refresh cache (ignores displaying instructions)

DESCRIPTION
  Display autocomplete installation instructions.

EXAMPLES
  $ codegen autocomplete

  $ codegen autocomplete bash

  $ codegen autocomplete zsh

  $ codegen autocomplete powershell

  $ codegen autocomplete --refresh-cache
```

_See code: [@oclif/plugin-autocomplete](https://github.com/oclif/plugin-autocomplete/blob/v3.0.18/src/commands/autocomplete/index.ts)_

## `codegen base`

```
USAGE
  $ codegen base [--json] [--no-color] [--debug | [-q | -v | --silent] | ]

FLAGS
  -q, --quiet     Only show errors and warnings
  -v, --verbose   Show detailed output
      --debug     Show debug information
      --json      Output results as JSON for scripting
      --no-color  Disable colored output
      --silent    Suppress all output except fatal errors
```

_See code: [src/commands/base.ts](https://github.com/the-codegen-project/cli/blob/v0.64.0/src/commands/base.ts)_

## `codegen generate [FILE]`

Generate code based on your configuration, use `init` to get started, `generate` to generate code from the configuration.

```
USAGE
  $ codegen generate [FILE] [--json] [--no-color] [--debug | [-q | -v | --silent] | ] [--help] [-w] [-p
    <value>]

ARGUMENTS
  FILE  Path or URL to the configuration file, defaults to root of where the command is run

FLAGS
  -p, --watchPath=<value>  Optional path to watch for changes when --watch flag is used. If not provided, watches the
                           input file from configuration
  -q, --quiet              Only show errors and warnings
  -v, --verbose            Show detailed output
  -w, --watch              Watch for file changes and regenerate code automatically
      --debug              Show debug information
      --help               Show CLI help.
      --json               Output results as JSON for scripting
      --no-color           Disable colored output
      --silent             Suppress all output except fatal errors

DESCRIPTION
  Generate code based on your configuration, use `init` to get started, `generate` to generate code from the
  configuration.
```

_See code: [src/commands/generate.ts](https://github.com/the-codegen-project/cli/blob/v0.64.0/src/commands/generate.ts)_

## `codegen help [COMMAND]`

Display help for codegen.

```
USAGE
  $ codegen help [COMMAND...] [-n]

ARGUMENTS
  COMMAND...  Command to show help for.

FLAGS
  -n, --nested-commands  Include all nested commands in the output.

DESCRIPTION
  Display help for codegen.
```

_See code: [@oclif/plugin-help](https://github.com/oclif/plugin-help/blob/v6.0.22/src/commands/help.ts)_

## `codegen init`

Initialize The Codegen Project in your project

```
USAGE
  $ codegen init [--json] [--no-color] [--debug |  | [--silent | -v | -q]] [--help] [--input-file <value>]
    [--config-name <value>] [--input-type asyncapi|openapi] [--output-directory <value>] [--config-type
    esm|json|yaml|ts] [--languages typescript] [--no-tty] [--include-payloads] [--include-headers] [--include-client]
    [--include-parameters] [--include-channels] [--gitignore-generated]

FLAGS
  -q, --quiet                     Only show errors and warnings
  -v, --verbose                   Show detailed output
      --config-name=<value>       [default: codegen] The name to use for the configuration file (dont include file
                                  extension)
      --config-type=<option>      [default: esm] The type of configuration file. 'esm', 'ts' can do everything, 'json'
                                  and 'yaml' is more restrictive. Read more here:
                                  https://github.com/the-codegen-project/cli/blob/main/docs/configurations.md
                                  <options: esm|json|yaml|ts>
      --debug                     Show debug information
      --gitignore-generated       Add generated output directories to .gitignore
      --help                      Show CLI help.
      --include-channels          Include channels generation, available for TypeScript
      --include-client            Include client generation, available for TypeScript
      --include-headers           Include headers generation, available for TypeScript
      --include-parameters        Include parameters generation, available for TypeScript
      --include-payloads          Include payloads generation, available for TypeScript
      --input-file=<value>        File path for the code generation input such as AsyncAPI document
      --input-type=<option>       Input file type
                                  <options: asyncapi|openapi>
      --json                      Output results as JSON for scripting
      --languages=<option>        Which languages do you wish to generate code for?
                                  <options: typescript>
      --no-color                  Disable colored output
      --no-tty                    Do not use an interactive terminal
      --output-directory=<value>  [default: ./] Output configuration location, path to where the configuration file
                                  should be located. If relative path, the current working directory of the terminal
                                  will be used
      --silent                    Suppress all output except fatal errors

DESCRIPTION
  Initialize The Codegen Project in your project
```

_See code: [src/commands/init.ts](https://github.com/the-codegen-project/cli/blob/v0.64.0/src/commands/init.ts)_

## `codegen telemetry ACTION`

Manage telemetry settings

```
USAGE
  $ codegen telemetry ACTION [--json] [--no-color] [--debug | [-q | -v | --silent] | ] [--help]

ARGUMENTS
  ACTION  (status|enable|disable) Action to perform: status, enable, or disable

FLAGS
  -q, --quiet     Only show errors and warnings
  -v, --verbose   Show detailed output
      --debug     Show debug information
      --help      Show CLI help.
      --json      Output results as JSON for scripting
      --no-color  Disable colored output
      --silent    Suppress all output except fatal errors

DESCRIPTION
  Manage telemetry settings

EXAMPLES
  $ codegen telemetry status

  $ codegen telemetry enable

  $ codegen telemetry disable
```

_See code: [src/commands/telemetry.ts](https://github.com/the-codegen-project/cli/blob/v0.64.0/src/commands/telemetry.ts)_

## `codegen version`

```
USAGE
  $ codegen version [--json] [--verbose]

FLAGS
  --verbose  Show additional information about the CLI.

GLOBAL FLAGS
  --json  Format output as json.

FLAG DESCRIPTIONS
  --verbose  Show additional information about the CLI.

    Additionally shows the architecture, node version, operating system, and versions of plugins that the CLI is using.
```

_See code: [@oclif/plugin-version](https://github.com/oclif/plugin-version/blob/v2.1.2/src/commands/version.ts)_
<!-- commandsstop -->
