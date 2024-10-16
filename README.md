![The Codegen Project banner](https://github.com/user-attachments/assets/5a839f64-8ed3-49fe-84e2-899cbd7d5027)

<div align="center">

<h1>⚡️The Codegen Project⚡️</h1>

[![License](https://img.shields.io/github/license/the-codegen-project/cli)](https://github.com/the-codegen-project/cli/blob/master/LICENSE)
[![Npm latest version](https://img.shields.io/npm/v/@the-codegen-project/cli)](https://www.npmjs.com/package/@the-codegen-project/cli)
![NPM Downloads](https://img.shields.io/npm/dw/%40the-codegen-project%2Fcli)
![GitHub Actions Workflow Status](https://img.shields.io/github/actions/workflow/status/the-codegen-project/cli/.github%2Fworkflows%2Fruntime-testing.yml?label=runtime%20testing)
![GitHub last commit](https://img.shields.io/github/last-commit/the-codegen-project/cli)
![GitHub Downloads (specific asset, all releases)](https://img.shields.io/github/downloads/the-codegen-project/cli/codegen.x64.pkg?label=MacOS)
![GitHub Downloads (specific asset, all releases)](https://img.shields.io/github/downloads/the-codegen-project/cli/codegen.arm64.pkg?label=MacOS)
![GitHub Downloads (specific asset, all releases)](https://img.shields.io/github/downloads/the-codegen-project/cli/codegen.x86.exe?label=Win)
![GitHub Downloads (specific asset, all releases)](https://img.shields.io/github/downloads/the-codegen-project/cli/codegen.x64.exe?label=Win)
![GitHub Downloads (specific asset, all releases)](https://img.shields.io/github/downloads/the-codegen-project/cli/codegen.tar.gz?label=Linux)
![GitHub Downloads (specific asset, all releases)](https://img.shields.io/github/downloads/the-codegen-project/cli/codegen.deb?label=Linux)
![homebrew downloads](https://img.shields.io/homebrew/installs/dm/codegen?label=Brew%20(SOON))
![Chocolatey Downloads](https://img.shields.io/chocolatey/dt/codegen?label=Chocolatey%20(SOON))<!-- ALL-CONTRIBUTORS-BADGE:START - Do not remove or modify this section -->
[![All Contributors](https://img.shields.io/badge/all_contributors-2-orange.svg?style=flat-square)](#contributors-)
<!-- ALL-CONTRIBUTORS-BADGE:END -->

<h4>Generate payload models, parameters, headers, messages, communication support functions, testing functions, and more, across programming languages such as TypeScript, and soon more...</h4>

[Read the Docs](./docs/README.md) | [View Demos](./examples/README.md)

</div>

<table>
  <thead>
    <tr>
      <th width="600px"></th>
      <th width="600px"></th>
    </tr>
  </thead>
  <tbody>
  <tr width="600px">
    <td>
      <a href="./assets/videos/generate-nextjs.gif"><img src="./assets/videos/generate-nextjs.gif" width="100%"/></a>
    </td>
    <td>
      <a href="./assets/videos/generate-typescript.gif"><img src="./assets/videos/generate-typescript.gif" width="100%"/></a>
    </td>
  </tr>
  </tbody>
</table>

# Core Features
- 📃 Generate payload representations from your AsyncAPI document (including Protobuf, RAML, OpenAPI Schema)
- 📊 Customize the generators output to your hearts desire
- 💫 Regenerate once the input changes 
- 👀 Integrate it into any project (such as [Next.JS](./examples/typescript-nextjs/), etc.)
- 💅 Create custom generators ([read more](./docs/generators/custom.md))
- 🗄️ Protocol agnostic generator ([docs](./docs/README.md#protocols))
- ⭐ And much more...

# How it works
The Codegen Project is a generator that is built to live along side your projects to help you save time in the development phase, ensuring you spend as much time on the business logic as possible. It works by using your configuration file to know what it needs to generate. 

Each input has different generates and [all of them can be customized](./docs/generators/README.md), or you can build your own generator [right in the configuration file](./docs/generators/custom.md).
```ts
export default {
  inputType: 'asyncapi',
  inputPath: './asyncapi.json',
  language: 'typescript',
  generators: [
    {
      preset: 'payloads',
      outputPath: './src/payloads',
      serializationType: 'json', 
    },
    ...
  ]
};
```

In this example, the generator will read the AsyncAPI document located in same directory as the configuration file, and generate TypeScript models for all the payload including code to serialize the models to JSON.

# Getting started
Its simple, [install the CLI](#install) into your project or machine, [setup the Codegen configuration file](#initialize) to include all the code your heart desire, customize it, and generate it at build time or whenever you feel like it.

## Install
Installing the CLI can be done inside a project or within your system.

<table style="table-layout: fixed;">
  <tr style="height: 50px;">
    <th>Package manager</th>
    <th>MacOS x64</th>
    <th>MacOS arm64</th>
    <th>Windows x64</th>
    <th>Windows x32</th>
    <th>Linux (Debian)</th>
    <th>Linux (Others)</th>
  </tr>
  <tr>
    <td style="vertical-align: top; min-width: 300px;">
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
    <td style="vertical-align: top;">
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
    <td style="vertical-align: top;">
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
    <td style="vertical-align: top;">
      <div>
<a href="https://github.com/the-codegen-project/cli/releases/latest/download/codegen.x64.exe">Download and run codegen.x64.exe</a>
</div>
    </td>
    <td style="vertical-align: top;">
      <div>
<a href="https://github.com/the-codegen-project/cli/releases/latest/download/codegen.x86.exe">Download and run codegen.x86.exe</a>
</div>
    </td>
    <td style="vertical-align: top;">
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
    <td style="vertical-align: top;">
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

You can find all the possible commands in [the usage documentation](./docs/usage.md).

## Initialize
Add a configuration file, either manually or through the CLI;
```sh
codegen init
```

<div align="center">


[![Initialize The Codegen Project](./assets/videos/initialize.gif)](./assets/videos/initialize.gif)

[Customize it to your heart's desire!](./docs/generators/README.md)

</div>

## Generate
With your configuration file in hand, time to generate the code and use it! This can be done manually or integrate into your build process. Checkout [all the examples](./examples/) for inspiration how to do it.

```sh
codegen generate
```

# 👀 Goals
Besides the [milestones](https://github.com/the-codegen-project/cli/milestones), we have certain goals that we want to reach for various reasons;
- ⭐ Reach 50 stars - So we can publish the CLI on Brew and Chocolatey
- 📃 3 Published resources (blog post, video, etc)

# 📃 Resources
People who have been so kind to write or talk about The Codegen Project;
- Write one!

# Contribution Guidelines

We have made quite a [comprehensive contribution guide](./docs/contributing.md) to give you a lending hand in how the project is structured and how to contribute to it.

## Contributors 

Thanks go out to these wonderful people ([emoji key](https://allcontributors.org/docs/en/emoji-key)):

<!-- ALL-CONTRIBUTORS-LIST:START - Do not remove or modify this section -->
<!-- prettier-ignore-start -->
<!-- markdownlint-disable -->
<table>
  <tbody>
    <tr>
      <td align="center" valign="top" width="14.28%"><a href="https://github.com/jonaslagoni"><img src="https://avatars.githubusercontent.com/u/13396189?v=4?s=100" width="100px;" alt="Jonas Lagoni"/><br /><sub><b>Jonas Lagoni</b></sub></a><br /><a href="https://github.com/the-codegen-project/cli/issues?q=author%3Ajonaslagoni" title="Bug reports">🐛</a> <a href="https://github.com/the-codegen-project/cli/commits?author=jonaslagoni" title="Code">💻</a> <a href="https://github.com/the-codegen-project/cli/commits?author=jonaslagoni" title="Documentation">📖</a> <a href="#ideas-jonaslagoni" title="Ideas, Planning, & Feedback">🤔</a> <a href="#maintenance-jonaslagoni" title="Maintenance">🚧</a> <a href="#question-jonaslagoni" title="Answering Questions">💬</a> <a href="https://github.com/the-codegen-project/cli/commits?author=jonaslagoni" title="Tests">⚠️</a> <a href="https://github.com/the-codegen-project/cli/pulls?q=is%3Apr+reviewed-by%3Ajonaslagoni" title="Reviewed Pull Requests">👀</a></td>
      <td align="center" valign="top" width="14.28%"><a href="https://github.com/ALagoni97"><img src="https://avatars.githubusercontent.com/u/68890168?v=4?s=100" width="100px;" alt="Lagoni"/><br /><sub><b>Lagoni</b></sub></a><br /><a href="https://github.com/the-codegen-project/cli/issues?q=author%3AALagoni97" title="Bug reports">🐛</a> <a href="#maintenance-ALagoni97" title="Maintenance">🚧</a> <a href="#projectManagement-ALagoni97" title="Project Management">📆</a> <a href="https://github.com/the-codegen-project/cli/pulls?q=is%3Apr+reviewed-by%3AALagoni97" title="Reviewed Pull Requests">👀</a></td>
    </tr>
  </tbody>
</table>

<!-- markdownlint-restore -->
<!-- prettier-ignore-end -->

<!-- ALL-CONTRIBUTORS-LIST:END -->

This project follows the [all-contributors](https://github.com/all-contributors/all-contributors) specification. Contributions of any kind are welcome!
