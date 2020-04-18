import { Arch, build, PackagerOptions, Platform } from "deskgap-builder"
import { promises as fs } from "fs"
import * as path from "path"
import { assertThat } from "./helpers/fileAssert"
import { app, assertPack, linuxDirTarget, modifyPackageJson } from "./helpers/packTester"
import { getDeskGapCacheDir } from "./helpers/testConfig"
import { expectUpdateMetadata } from "./helpers/winHelper"

function createBuildResourcesTest(packagerOptions: PackagerOptions) {
  return app({
    ...packagerOptions,
    config: {
      publish: null,
      directories: {
        buildResources: "custom",
        // tslint:disable:no-invalid-template-strings
        output: "customDist/${channel}",
        // https://github.com/deskgap-userland/deskgap-builder/issues/601
        app: ".",
      },
      nsis: {
        differentialPackage: false,
      },
    },
  }, {
    packed: async context => {
      await assertThat(path.join(context.projectDir, "customDist", "latest")).isDirectory()
    },
    projectDirCreated: projectDir => fs.rename(path.join(projectDir, "build"), path.join(projectDir, "custom"))
  })
}

test.ifAll.ifNotWindows("custom buildResources and output dirs: mac", createBuildResourcesTest({mac: ["dir"]}))
test.ifAll.ifNotCiMac("custom buildResources and output dirs: win", createBuildResourcesTest({win: ["nsis"]}))
test.ifAll.ifNotWindows("custom buildResources and output dirs: linux", createBuildResourcesTest({linux: ["appimage"]}))

test.ifAll.ifLinuxOrDevMac("prepackaged", app({
  targets: linuxDirTarget,
}, {
  packed: async context => {
    await build({
      prepackaged: path.join(context.outDir, "linux-unpacked"),
      projectDir: context.projectDir,
      linux: [],
      config: {
        // test target
        linux: {
          target: {
            target: "deb",
            arch: "ia32",
          }
        },
        compression: "store"
      }
    })
    await assertThat(path.join(context.projectDir, "dist", "TestApp_1.1.0_i386.deb")).isFile()
  }
}))

test.ifAll.ifLinuxOrDevMac("retrieve latest deskgap version", app({
  targets: linuxDirTarget,
}, {
  projectDirCreated: projectDir => modifyPackageJson(projectDir, data => {
    data.devDependencies = {
      ...data.devDependencies,
      deskgap: "latest",
    }
    delete data.build.deskgapVersion
  }),
}))

test.ifAll.ifLinuxOrDevMac("retrieve latest deskgap-nightly version", app({
  targets: linuxDirTarget,
}, {
  projectDirCreated: projectDir => modifyPackageJson(projectDir, data => {
    data.devDependencies = {
      ...data.devDependencies,
      "deskgap-nightly": "latest",
    }
    delete data.build.deskgapVersion
  }),
}))

test.ifAll.ifDevOrLinuxCi("override targets in the config", app({
  targets: linuxDirTarget,
}, {
  packed: async context => {
    await build({
      projectDir: context.projectDir,
      linux: ["deb"],
      config: {
        publish: null,
        // https://github.com/deskgap-userland/deskgap-builder/issues/1355
        linux: {
          target: [
            "AppImage",
            "deb",
            "rpm"
          ],
        },
        compression: "store"
      }
    })
  }
}))

// test https://github.com/deskgap-userland/deskgap-builder/issues/1182 also
test.ifAll.ifDevOrWinCi("override targets in the config - only arch", app({
  targets: Platform.WINDOWS.createTarget(null, Arch.ia32),
  config: {
    extraMetadata: {
      version: "1.0.0-beta.1",
    },
    // https://github.com/deskgap-userland/deskgap-builder/issues/1348
    win: {
      // tslint:disable:no-invalid-template-strings
      artifactName: "${channel}-${name}.exe",
      target: [
        "nsis",
      ],
    },
    publish: {
      provider: "generic",
      url: "https://develar.s3.amazonaws.com/test",
    },
  },
}, {
  packed: context => {
    return Promise.all([
      assertThat(path.join(context.projectDir, "dist", "win-unpacked")).doesNotExist(),
      assertThat(path.join(context.projectDir, "dist", "latest.yml")).doesNotExist(),
      expectUpdateMetadata(context, Arch.ia32),
    ])
  },
}))

// test on all CI to check path separators
test.ifAll("do not exclude build entirely (respect files)", () => assertPack("test-app-build-sub", {targets: linuxDirTarget}))

test.ifNotWindows("deskgapDist as path to local folder with deskgap builds zipped ", app({
  targets: linuxDirTarget,
  config: {
    deskgapDist: getDeskGapCacheDir(),
  },
}))

const overridePublishChannel: any = {
  channel: "beta"
}

test.ifAll.ifDevOrLinuxCi("overriding the publish channel", app({
  targets: linuxDirTarget,
  config: {
    publish: overridePublishChannel
  },
}, {
  projectDirCreated: projectDir => modifyPackageJson(projectDir, data => {
    data.devDependencies = {}
    data.build.publish = [
      {
        provider: "s3",
        bucket: "my-s3-bucket",
      }
    ]
  }),
  packed: async context => {
    expect(context.packager.config.publish).toMatchSnapshot()
  },
}))