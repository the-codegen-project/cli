---
sidebar_position: 2
---

# Getting Started in 5 minutes

Its simple, [install the CLI](#install) into your project or machine, [setup the Codegen configuration file](#initialize) to include all the code your heart desire, customize it, and generate it at build time or whenever you feel like it.

## Install
Installing the CLI can be done inside a project or within your system.

<table>
  <tr>
    <th>Package manager</th>
    <th>MacOS x64</th>
    <th>MacOS arm64</th>
    <th>Windows x64</th>
    <th>Windows x32</th>
    <th>Linux (Debian)</th>
    <th>Linux (Others)</th>
  </tr>
  <tr>
    <td>
      <div>

#### NPM

```sh
npm install --save-dev @the-codegen-project/cli

npm install -g @the-codegen-project/cli
```

#### Yarn

```sh
yarn add @the-codegen-project/cli
```

#### Pnpm

```sh
pnpm add @the-codegen-project/cli
```

#### Bun

```sh
bun add @the-codegen-project/cli
```

</div>
    </td>
    <td>
      <div>

#### Download
```sh
curl -OL https://github.com/the-codegen-project/cli/releases/latest/download/codegen.x64.pkg
```

#### Install
```sh
sudo installer -pkg codegen.x64.pkg -target /
```

</div>
    </td>
    <td>
      <div>

#### Download
```sh
curl -OL https://github.com/the-codegen-project/cli/releases/latest/download/codegen.arm64.pkg
```
#### Install

```sh
sudo installer -pkg codegen.arm64.pkg -target /
```
</div>
    </td>
    <td>
      <div>
<a href="https://github.com/the-codegen-project/cli/releases/latest/download/codegen.x64.exe">Download and run codegen.x64.exe</a>
</div>
    </td>
    <td>
      <div>
<a href="https://github.com/the-codegen-project/cli/releases/latest/download/codegen.x86.exe">Download and run codegen.x86.exe</a>
</div>
    </td>
    <td>
      <div>

#### Download
```sh
curl -OL https://github.com/the-codegen-project/cli/releases/latest/download/codegen.deb
```

#### Install
```sh
sudo apt install ./codegen.deb
```
</div>
    </td>
    <td>
      <div>

#### Download
```sh
curl -OL https://github.com/the-codegen-project/cli/releases/latest/download/codegen.tar.gz
```

#### Install

```sh
tar -xzf codegen.tar.gz
```

#### Symlink
```sh
ln -s <absolute-path>/bin/codegen /usr/local/bin/codegen
```

</div>
    </td>
  </tr>
</table>

You can find all the possible commands in [the usage documentation](./usage.md).

## Initialize
Add a configuration file, either manually or through the CLI;
```sh
codegen init
```

<div align="center">


![Initialize The Codegen Project](../static/assets/videos/initialize.gif)

Customize it to your heart's desire! [Each generator has unique set of options](./generators/README.md)

</div>

## Integrate
With your configuration file in hand, time to integrate it into your project and generate some code!  Checkout [all the integrations](../examples/) for inspiration how to do it.

Or manually generate some code;
```sh
codegen generate
```
