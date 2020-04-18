This is a fork of deskgap-builder.
I created another this another repository, as:

- It's impossible to have 2 forks on GitHub;
- I might do PR to `deskgap-builder` someday;


# deskgap-builder [![npm version](https://img.shields.io/npm/v/deskgap-builder.svg?label=latest)](https://yarn.pm/deskgap-builder) [![downloads per month](https://img.shields.io/npm/dm/deskgap-builder.svg)](https://yarn.pm/deskgap-builder) [![donate](https://img.shields.io/badge/donate-donorbox-green.svg)](https://www.deskgap.build/donate) [![project chat](https://img.shields.io/badge/chat-on_zulip-brightgreen.svg)](https://deskgap-builder.zulipchat.com)
A complete solution to package and build a ready for distribution [DeskGap](https://deskgapjs.org), [Proton Native](https://proton-native.js.org/) app for macOS, Windows and Linux with “auto update” support out of the box.

See documentation on [deskgap.build](https://www.deskgap.build).

* NPM packages management:
    * [Native application dependencies](https://deskgap.atom.io/docs/tutorial/using-native-node-modules/) compilation (including [Yarn](http://yarnpkg.com/) support).
    * Development dependencies are never included. You don't need to ignore them explicitly.
    * [Two package.json structure](https://www.deskgap.build/tutorials/two-package-structure) is supported, but you are not forced to use it even if you have native production dependencies.
* [Code Signing](https://www.deskgap.build/code-signing) on a CI server or development machine.
* [Auto Update](https://www.deskgap.build/auto-update) ready application packaging.
* Numerous target formats:
    * All platforms: `7z`, `zip`, `tar.xz`, `tar.7z`, `tar.lz`, `tar.gz`, `tar.bz2`, `dir` (unpacked directory).
    * [macOS](https://www.deskgap.build/configuration/mac): `dmg`, `pkg`, `mas`.
    * [Linux](https://www.deskgap.build/configuration/linux): [AppImage](http://appimage.org), [snap](http://snapcraft.io), debian package (`deb`), `rpm`, `freebsd`, `pacman`, `p5p`, `apk`.
    * [Windows](https://www.deskgap.build/configuration/win): `nsis` (Installer), `nsis-web` (Web installer), `portable` (portable app without installation), AppX (Windows Store), MSI, Squirrel.Windows.
* [Publishing artifacts](https://www.deskgap.build/configuration/publish) to GitHub Releases, Amazon S3, DigitalOcean Spaces and Bintray.
* Advanced building:
    * Pack in a distributable format [already packaged app](https://www.deskgap.build/#pack-only-in-a-distributable-format).
    * Separate [build steps](https://github.com/deskgap-userland/deskgap-builder/issues/1102#issuecomment-271845854).
    * Build and publish in parallel, using hard links on CI server to reduce IO and disk space usage.
    * [deskgap-compile](https://github.com/deskgap/deskgap-compile) support (compile for release-time on the fly on build).
* [Docker](https://www.deskgap.build/multi-platform-build#docker) images to build DeskGap app for Linux or Windows on any platform.
* [Proton Native](https://www.deskgap.build/configuration/configuration/#proton-native) support.
* Downloads all required tools files on demand automatically (e.g. to code sign windows application, to make AppX), no need to setup.

| Question                               | Answer                                                                                                                                    |
| -------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------- |
| “I want to configure deskgap-builder” | [See options](https://deskgap.build/configuration/configuration)                                                                         |
| “I have a question”                    | [Open an issue](https://github.com/deskgap-userland/deskgap-builder/issues) or [join the chat](https://deskgap-builder.zulipchat.com/) |
| “I found a bug”                        | [Open an issue](https://github.com/deskgap-userland/deskgap-builder/issues/new)                                                         |
| “I want to support development”        | [Donate](https://www.deskgap.build/donate)                                                                                               |

## Installation
[Yarn](http://yarnpkg.com/) is [strongly](https://github.com/deskgap-userland/deskgap-builder/issues/1147#issuecomment-276284477) recommended instead of npm.

`yarn add deskgap-builder --dev`

## Quick Setup Guide

[deskgap-webpack-quick-start](https://github.com/deskgap-userland/deskgap-webpack-quick-start) is a recommended way to create a new DeskGap application. See [Boilerplates](https://www.deskgap.build/#boilerplates).

1. Specify the standard fields in the application `package.json` — [name](https://deskgap.build/configuration/configuration#Metadata-name), `description`, `version` and [author](https://docs.npmjs.com/files/package.json#people-fields-author-contributors).

2. Specify the [build](https://deskgap.build/configuration/configuration#build) configuration in the `package.json` as follows:
    ```json
    "build": {
      "appId": "your.id",
      "mac": {
        "category": "your.app.category.type"
      }
    }
    ```
   See [all options](https://www.deskgap.build/configuration/configuration). Option [files](https://www.deskgap.build/configuration/contents#files) to indicate which files should be packed in the final application, including the entry file, maybe required.

3. Add [icons](https://www.deskgap.build/icons).

4. Add the [scripts](https://docs.npmjs.com/cli/run-script) key to the development `package.json`:
    ```json
    "scripts": {
      "pack": "deskgap-builder --dir",
      "dist": "deskgap-builder"
    }
    ```
    Then you can run `yarn dist` (to package in a distributable format (e.g. dmg, windows installer, deb package)) or `yarn pack` (only generates the package directory without really packaging it. This is useful for testing purposes).

    To ensure your native dependencies are always matched deskgap version, simply add script `"postinstall": "deskgap-builder install-app-deps"` to your `package.json`.

5. If you have native addons of your own that are part of the application (not as a dependency), set [nodeGypRebuild](https://www.deskgap.build/configuration/configuration#Configuration-nodeGypRebuild) to `true`.

Please note that everything is packaged into an asar archive [by default](https://deskgap.build/configuration/configuration#Configuration-asar).

For an app that will be shipped to production, you should sign your application. See [Where to buy code signing certificates](https://www.deskgap.build/code-signing#where-to-buy-code-signing-certificate).

## Donate

We do this open source work in our free time. If you'd like us to invest more time on it, please [donate](https://www.deskgap.build/donate). Donation can be used to increase some issue priority.

## Sponsors

<a href="https://workflowy.com"><img src="https://workflowy.com/media/i/icon-28x28.png" alt="WorkFlowy" title="WorkFlowy" width="28" height="28" align="middle"/></a>
<a href="https://tidepool.org"><img src="https://www.deskgap.build/sponsor-logos/Tidepool_Logo_Light.svg" alt="Tidepool" title="Tidepool" align="middle"/></a>
