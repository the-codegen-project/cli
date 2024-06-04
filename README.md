[![License](https://img.shields.io/github/license/the-codegen-project/cli)](https://github.com/the-codegen-project/cli/blob/master/LICENSE)
[![Npm latest version](https://img.shields.io/npm/v/@the-codegen-project/cli)](https://www.npmjs.com/package/@the-codegen-project/cli)
![NPM Downloads](https://img.shields.io/npm/dw/%40the-codegen-project%2Fcli)
![homebrew downloads](https://img.shields.io/homebrew/installs/dm/codegen?label=Brew)
![Chocolatey Downloads](https://img.shields.io/chocolatey/dt/codegen?label=Chocolatey)
![GitHub Downloads (specific asset, all releases)](https://img.shields.io/github/downloads/the-codegen-project/cli/codegen.x64.pkg?label=MacOS)
![GitHub Downloads (specific asset, all releases)](https://img.shields.io/github/downloads/the-codegen-project/cli/codegen.arm64.pkg?label=MacOS)
![GitHub Downloads (specific asset, all releases)](https://img.shields.io/github/downloads/the-codegen-project/cli/codegen.x86.exe?label=Win)
![GitHub Downloads (specific asset, all releases)](https://img.shields.io/github/downloads/the-codegen-project/cli/codegen.x64.exe?label=Win)
![GitHub Downloads (specific asset, all releases)](https://img.shields.io/github/downloads/the-codegen-project/cli/codegen.tar.gz?label=Linux)
![GitHub Downloads (specific asset, all releases)](https://img.shields.io/github/downloads/the-codegen-project/cli/codegen.deb?label=Linux)

---

The Codegen Project solves a single problem, how to simplify the implementation phase of software development for different standards.

Here are all the ways you can integrate and run The Codegen Project CLI. For a full list of commands [checkout the usage documentation](./docs/usage.md).

<h2 align="center">MacOS</h2>
<!-- prettier-ignore-start -->
<!-- markdownlint-disable -->
<table  align="center" style="width: 100%;">
  <tr>
    <td>
<b><a href="https://brew.sh/">Brew</a></b>

```
brew install codegen
```
</td>
  </tr>
  <tr>
    <td>
<b>MacOS x64</b>

Install it through a dedicated `.pkg` file as a MacOS Application

```
# Download latest release
curl -OL https://github.com/the-codegen-project/cli/releases/latest/download/codegen.x64.pkg
# Install it
sudo installer -pkg codegen.pkg -target /
```
</td>
  </tr>
  <tr>
    <td>
<b>MacOS arm64</b>

Install it through a dedicated `.pkg` file as a MacOS Application for arm64
```
# Download latest release
curl -OL https://github.com/the-codegen-project/cli/releases/latest/download/codegen.arm64.pkg
# Install it
sudo installer -pkg codegen.pkg -target /
```
</td>
  </tr>
</table>

<h2 align="center">Windows</h2>
<!-- prettier-ignore-start -->
<!-- markdownlint-disable -->
<table align="center" style="width: 100%;">
  <tr>
    <td>
<b><a href="https://chocolatey.org/install">Chocolatey</a></b>

```
choco install codegen
```
</td>
  </tr>
  <tr>
    <td><b>Windows x64</b>

Manually download and run [`codegen.x64.exe`](https://github.com/the-codegen-project/cli/releases/latest/download/codegen.x64.exe)
</td>
  </tr>
  <tr>
    <td>
<b>Windows x32</b>

Manually download and run the executable [`codegen.x86.exe`](https://github.com/the-codegen-project/cli/releases/latest/download/codegen.x86.exe)
</td>
  </tr>
</table>


<h2 align="center">Linux</h2>
<!-- prettier-ignore-start -->
<!-- markdownlint-disable -->
<table align="center" style="width: 100%;">
  <tr>
    <td><b>Debian</b>

```
# Download
curl -OL https://github.com/the-codegen-project/cli/releases/latest/download/codegen.deb

# Install
sudo apt install ./codegen.deb
```
</td>
  </tr>
  <tr>
    <td>
<b>Others</b>

```
# Download
curl -OL https://github.com/the-codegen-project/cli/releases/latest/download/codegen.tar.gz
# Install
tar -xzf codegen.tar.gz
```

Remember to symlink the binaries `ln -s <absolute-path>/bin/codegen /user/local/bin/codegen` to access the CLI anywhere.
</td>
  </tr>
</table>

<h2 align="center">Other ways</h2>
<!-- prettier-ignore-start -->
<!-- markdownlint-disable -->
<table align="center" style="width: 100%;">
  <tr>
    <td>
<b>NPM</b>

```typescript
npm install -g @the-codegen-project/cli
```
</td>
  </tr>
</table>
