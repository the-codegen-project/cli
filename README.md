[![License](https://img.shields.io/github/license/the-codegen-project/cli)](https://github.com/the-codegen-project/cli/blob/master/LICENSE)
[![Npm latest version](https://img.shields.io/npm/v/@the-codegen-project/cli)](https://www.npmjs.com/package/@the-codegen-project/cli)
![NPM Downloads](https://img.shields.io/npm/dw/%40the-codegen-project%2Fcli)
![GitHub Actions Workflow Status](https://img.shields.io/github/actions/workflow/status/the-codegen-project/cli/.github%2Fworkflows%2Fruntime-testing.yml?label=runtime%20testing)
![GitHub last commit](https://img.shields.io/github/last-commit/the-codegen-project/cli)

<!-- ![GitHub Downloads (specific asset, all releases)](https://img.shields.io/github/downloads/the-codegen-project/cli/codegen.x64.pkg?label=MacOS)
![GitHub Downloads (specific asset, all releases)](https://img.shields.io/github/downloads/the-codegen-project/cli/codegen.arm64.pkg?label=MacOS)
![GitHub Downloads (specific asset, all releases)](https://img.shields.io/github/downloads/the-codegen-project/cli/codegen.x86.exe?label=Win)
![GitHub Downloads (specific asset, all releases)](https://img.shields.io/github/downloads/the-codegen-project/cli/codegen.x64.exe?label=Win)
![GitHub Downloads (specific asset, all releases)](https://img.shields.io/github/downloads/the-codegen-project/cli/codegen.tar.gz?label=Linux)
![GitHub Downloads (specific asset, all releases)](https://img.shields.io/github/downloads/the-codegen-project/cli/codegen.deb?label=Linux)
![homebrew downloads](https://img.shields.io/homebrew/installs/dm/codegen?label=Brew)
![Chocolatey Downloads](https://img.shields.io/chocolatey/dt/codegen?label=Chocolatey)-->
---

Simplifying your implementation phase when using standards such as AsyncAPI has never been easier.

<table>
  <tr>
    <th colspan="3" style="text-align: center;">Anywhere</th>
  </tr>
  <tr>
    <td>
      <div style="text-align: center;">
<a href="https://github.com/the-codegen-project/cli/tree/main/examples/typescript-library">TypeScript</a> <video src='https://github.com/the-codegen-project/cli/assets/13396189/ef400456-3583-4e7a-aa65-f1db95f1c0ec' width=360></video>
      </div>
    </td>
    <td>
      <div>
<a href="https://github.com/the-codegen-project/cli/tree/main/examples/java-maven">Java Maven <video src='https://github.com/the-codegen-project/cli/assets/13396189/79b6019a-4e8f-4893-82ae-5b9f5c2cf2e6' width=360></video>
      </div>
    </td>
    <td>
      <div>
<a href="https://github.com/the-codegen-project/cli/tree/main/examples/typescript-nextjs">Next.js</a> <video src='https://github.com/the-codegen-project/cli/assets/13396189/e54aa060-61fc-49bd-b603-0a5f82667286' width=360></video>
      </div>
    </td>
  </tr>
  <tr>
    <td>
      <div style="text-align: center;">
<a href="https://github.com/the-codegen-project/cli/tree/main/examples/java-gradle">Java Gradle</a>
      </div>
    </td>
  </tr>
</table>

## Install
Install The Codegen Project any way you wish.

<table style="table-layout: fixed;">
  <tr style="height: 50px;">
    <th>NPM (All Platforms)</th>
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

#### Globally

```sh
npm install -g @the-codegen-project/cli
```

#### Locally

```sh
npm install --save-dev @the-codegen-project/cli
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
Add The Codegen Project configuration file, either manually or through the CLI;
```sh
codegen init
```

<video src='https://github.com/the-codegen-project/cli/assets/13396189/6a351e0d-b5b2-4ca3-845a-556aeba490c9' width=1920></video>

Check out all the possible generators here: https://github.com/the-codegen-project/cli/tree/main/docs/generators

## Generate
With your configuration file in hand, time to generate the code and use it!

```sh
codegen generate
```
