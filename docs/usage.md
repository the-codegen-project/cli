The CodeGen project CLI makes it easier to integrate code generation aspects into existing development workflows.

# Table of contents

<!-- toc -->
* [Table of contents](#table-of-contents)
* [Usage](#usage)
* [Commands](#commands)
<!-- tocstop -->

# Usage
<!-- usage -->
```sh-session
$ npm install -g @the-codegen-project/cli
$ codegen COMMAND
running command...
$ codegen (--version)
@the-codegen-project/cli/0.17.1 linux-x64 node-v18.20.4
$ codegen --help [COMMAND]
USAGE
  $ codegen COMMAND
...
```
<!-- usagestop -->

# Commands
<!-- commands -->
* [`codegen autocomplete [SHELL]`](#codegen-autocomplete-shell)
* [`codegen generate [FILE]`](#codegen-generate-file)
* [`codegen help [COMMAND]`](#codegen-help-command)
* [`codegen init`](#codegen-init)
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

## `codegen generate [FILE]`

Generate code based on your configuration, use `init` to get started.

```
USAGE
  $ codegen generate [FILE] [--help]

ARGUMENTS
  FILE  Path or URL to the configuration file, defaults to root of where the command is run

FLAGS
  --help  Show CLI help.

DESCRIPTION
  Generate code based on your configuration, use `init` to get started.
```

_See code: [src/commands/generate.ts](https://github.com/the-codegen-project/cli/blob/v0.17.1/src/commands/generate.ts)_

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
  $ codegen init [--help] [--input-file <value>] [--input-type asyncapi] [--output-directory <value>]
    [--config-type esm|json|yaml] [--languages typescript|java|csharp] [--no-tty] [--include-payloads]
    [--include-parameters] [--include-channels]

FLAGS
  --config-type=<option>      [default: esm] The type of configuration file. 'esm' can do everything, 'json' and 'yaml'
                              is more restrictive. Read more here:
                              https://github.com/the-codegen-project/cli/blob/main/docs/configurations.md
                              <options: esm|json|yaml>
  --help                      Show CLI help.
  --include-channels          Include channels generation, available for TypeScript.
  --include-parameters        Include parameters generation, available for TypeScript.
  --include-payloads          Include payloads generation, available for TypeScript, Java and C#.
  --input-file=<value>        Input file for the code generation
  --input-type=<option>       Input file type
                              <options: asyncapi>
  --languages=<option>        Which languages do you wish to generate code for?
                              <options: typescript|java|csharp>
  --no-tty                    Do not use an interactive terminal
  --output-directory=<value>  [default: ./] Output configuration location, path to where the configuration file should
                              be located. If relative path, the current working directory of the terminal will be used.

DESCRIPTION
  Initialize The Codegen Project in your project
```

_See code: [src/commands/init.ts](https://github.com/the-codegen-project/cli/blob/v0.17.1/src/commands/init.ts)_

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
