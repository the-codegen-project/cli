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
@the-codegen-project/cli/0.0.0 linux-x64 node-v18.20.3
$ codegen --help [COMMAND]
USAGE
  $ codegen COMMAND
...
```
<!-- usagestop -->

# Commands
<!-- commands -->
* [`codegen autocomplete [SHELL]`](#codegen-autocomplete-shell)
* [`codegen help [COMMAND]`](#codegen-help-command)
* [`codegen plugins`](#codegen-plugins)
* [`codegen plugins add PLUGIN`](#codegen-plugins-add-plugin)
* [`codegen plugins:inspect PLUGIN...`](#codegen-pluginsinspect-plugin)
* [`codegen plugins install PLUGIN`](#codegen-plugins-install-plugin)
* [`codegen plugins link PATH`](#codegen-plugins-link-path)
* [`codegen plugins remove [PLUGIN]`](#codegen-plugins-remove-plugin)
* [`codegen plugins reset`](#codegen-plugins-reset)
* [`codegen plugins uninstall [PLUGIN]`](#codegen-plugins-uninstall-plugin)
* [`codegen plugins unlink [PLUGIN]`](#codegen-plugins-unlink-plugin)
* [`codegen plugins update`](#codegen-plugins-update)
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

## `codegen plugins`

List installed plugins.

```
USAGE
  $ codegen plugins [--json] [--core]

FLAGS
  --core  Show core plugins.

GLOBAL FLAGS
  --json  Format output as json.

DESCRIPTION
  List installed plugins.

EXAMPLES
  $ codegen plugins
```

_See code: [@oclif/plugin-plugins](https://github.com/oclif/plugin-plugins/blob/v5.1.3/src/commands/plugins/index.ts)_

## `codegen plugins add PLUGIN`

Installs a plugin into codegen.

```
USAGE
  $ codegen plugins add PLUGIN... [--json] [-f] [-h] [-s | -v]

ARGUMENTS
  PLUGIN...  Plugin to install.

FLAGS
  -f, --force    Force npm to fetch remote resources even if a local copy exists on disk.
  -h, --help     Show CLI help.
  -s, --silent   Silences npm output.
  -v, --verbose  Show verbose npm output.

GLOBAL FLAGS
  --json  Format output as json.

DESCRIPTION
  Installs a plugin into codegen.

  Uses bundled npm executable to install plugins into /home/runner/.local/share/@the-codegen-project/cli

  Installation of a user-installed plugin will override a core plugin.

  Use the CODEGEN_NPM_LOG_LEVEL environment variable to set the npm loglevel.
  Use the CODEGEN_NPM_REGISTRY environment variable to set the npm registry.

ALIASES
  $ codegen plugins add

EXAMPLES
  Install a plugin from npm registry.

    $ codegen plugins add myplugin

  Install a plugin from a github url.

    $ codegen plugins add https://github.com/someuser/someplugin

  Install a plugin from a github slug.

    $ codegen plugins add someuser/someplugin
```

## `codegen plugins:inspect PLUGIN...`

Displays installation properties of a plugin.

```
USAGE
  $ codegen plugins inspect PLUGIN...

ARGUMENTS
  PLUGIN...  [default: .] Plugin to inspect.

FLAGS
  -h, --help     Show CLI help.
  -v, --verbose

GLOBAL FLAGS
  --json  Format output as json.

DESCRIPTION
  Displays installation properties of a plugin.

EXAMPLES
  $ codegen plugins inspect myplugin
```

_See code: [@oclif/plugin-plugins](https://github.com/oclif/plugin-plugins/blob/v5.1.3/src/commands/plugins/inspect.ts)_

## `codegen plugins install PLUGIN`

Installs a plugin into codegen.

```
USAGE
  $ codegen plugins install PLUGIN... [--json] [-f] [-h] [-s | -v]

ARGUMENTS
  PLUGIN...  Plugin to install.

FLAGS
  -f, --force    Force npm to fetch remote resources even if a local copy exists on disk.
  -h, --help     Show CLI help.
  -s, --silent   Silences npm output.
  -v, --verbose  Show verbose npm output.

GLOBAL FLAGS
  --json  Format output as json.

DESCRIPTION
  Installs a plugin into codegen.

  Uses bundled npm executable to install plugins into /home/runner/.local/share/@the-codegen-project/cli

  Installation of a user-installed plugin will override a core plugin.

  Use the CODEGEN_NPM_LOG_LEVEL environment variable to set the npm loglevel.
  Use the CODEGEN_NPM_REGISTRY environment variable to set the npm registry.

ALIASES
  $ codegen plugins add

EXAMPLES
  Install a plugin from npm registry.

    $ codegen plugins install myplugin

  Install a plugin from a github url.

    $ codegen plugins install https://github.com/someuser/someplugin

  Install a plugin from a github slug.

    $ codegen plugins install someuser/someplugin
```

_See code: [@oclif/plugin-plugins](https://github.com/oclif/plugin-plugins/blob/v5.1.3/src/commands/plugins/install.ts)_

## `codegen plugins link PATH`

Links a plugin into the CLI for development.

```
USAGE
  $ codegen plugins link PATH [-h] [--install] [-v]

ARGUMENTS
  PATH  [default: .] path to plugin

FLAGS
  -h, --help          Show CLI help.
  -v, --verbose
      --[no-]install  Install dependencies after linking the plugin.

DESCRIPTION
  Links a plugin into the CLI for development.
  Installation of a linked plugin will override a user-installed or core plugin.

  e.g. If you have a user-installed or core plugin that has a 'hello' command, installing a linked plugin with a 'hello'
  command will override the user-installed or core plugin implementation. This is useful for development work.


EXAMPLES
  $ codegen plugins link myplugin
```

_See code: [@oclif/plugin-plugins](https://github.com/oclif/plugin-plugins/blob/v5.1.3/src/commands/plugins/link.ts)_

## `codegen plugins remove [PLUGIN]`

Removes a plugin from the CLI.

```
USAGE
  $ codegen plugins remove [PLUGIN...] [-h] [-v]

ARGUMENTS
  PLUGIN...  plugin to uninstall

FLAGS
  -h, --help     Show CLI help.
  -v, --verbose

DESCRIPTION
  Removes a plugin from the CLI.

ALIASES
  $ codegen plugins unlink
  $ codegen plugins remove

EXAMPLES
  $ codegen plugins remove myplugin
```

## `codegen plugins reset`

Remove all user-installed and linked plugins.

```
USAGE
  $ codegen plugins reset [--hard] [--reinstall]

FLAGS
  --hard       Delete node_modules and package manager related files in addition to uninstalling plugins.
  --reinstall  Reinstall all plugins after uninstalling.
```

_See code: [@oclif/plugin-plugins](https://github.com/oclif/plugin-plugins/blob/v5.1.3/src/commands/plugins/reset.ts)_

## `codegen plugins uninstall [PLUGIN]`

Removes a plugin from the CLI.

```
USAGE
  $ codegen plugins uninstall [PLUGIN...] [-h] [-v]

ARGUMENTS
  PLUGIN...  plugin to uninstall

FLAGS
  -h, --help     Show CLI help.
  -v, --verbose

DESCRIPTION
  Removes a plugin from the CLI.

ALIASES
  $ codegen plugins unlink
  $ codegen plugins remove

EXAMPLES
  $ codegen plugins uninstall myplugin
```

_See code: [@oclif/plugin-plugins](https://github.com/oclif/plugin-plugins/blob/v5.1.3/src/commands/plugins/uninstall.ts)_

## `codegen plugins unlink [PLUGIN]`

Removes a plugin from the CLI.

```
USAGE
  $ codegen plugins unlink [PLUGIN...] [-h] [-v]

ARGUMENTS
  PLUGIN...  plugin to uninstall

FLAGS
  -h, --help     Show CLI help.
  -v, --verbose

DESCRIPTION
  Removes a plugin from the CLI.

ALIASES
  $ codegen plugins unlink
  $ codegen plugins remove

EXAMPLES
  $ codegen plugins unlink myplugin
```

## `codegen plugins update`

Update installed plugins.

```
USAGE
  $ codegen plugins update [-h] [-v]

FLAGS
  -h, --help     Show CLI help.
  -v, --verbose

DESCRIPTION
  Update installed plugins.
```

_See code: [@oclif/plugin-plugins](https://github.com/oclif/plugin-plugins/blob/v5.1.3/src/commands/plugins/update.ts)_

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
