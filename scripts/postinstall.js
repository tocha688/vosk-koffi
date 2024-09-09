const fs = require("node:fs");
const path = require("node:path");
const os = require("node:os");
const { execSync } = require("node:child_process");
const https = require("https");
const yauzl = require("yauzl");
const Downloader = require("nodejs-file-downloader");

const ZIP_BASE = "https://github.com/alphacep/vosk-api/releases/download";

const ZIP = {
  win32: {
    x64: "/v0.3.45/vosk-win64-0.3.45.zip",
    ia32: "/v0.3.42/vosk-win32-0.3.42.zip",
  },
  darwin: {
    arm64: "/v0.3.42/vosk-osx-0.3.42.zip",
    x64: "/v0.3.42/vosk-osx-0.3.42.zip",
  },
  linux: {
    arm64: "/v0.3.45/vosk-linux-aarch64-0.3.45.zip",
    arm: "/v0.3.45/vosk-linux-armv7l-0.3.45.zip",
    x64: "/v0.3.45/vosk-linux-x86_64-0.3.45.zip",
    ia32: "/v0.3.45/vosk-linux-x86-0.3.45.zip",
    riscv64: "/v0.3.45/vosk-linux-riscv64-0.3.45.zip",
  },
};

const VERBOSE = true;
const LIB_DIR = path.resolve(
  __dirname,
  "..",
  `bin-${process.platform}-${process.arch}`,
);

(async () => {
  const ignorePlatform = detectInstallIgnorePlatform();

  const remotes = ignorePlatform
    ? Object.entries(ZIP).flatMap(([platform, arches]) =>
        Object.entries(arches).map(([arch, remote]) => [
          remote,
          path.resolve(__dirname, "..", `bin-${platform}-${arch}`),
        ]),
      )
    : [[ZIP[process.platform]?.[process.arch], LIB_DIR]];

  if (!ignorePlatform && remotes[0] === undefined) {
    throw new Error(
      `Unsupported platform: ${process.platform}-${process.arch}`,
    );
  }

  Promise.allSettled(
    remotes.map(([remote, libDir]) => {
      return (async () => {
        if (!fs.existsSync(libDir)) {
          fs.mkdirSync(libDir, { recursive: true });
        }

        const version = path.basename(remote, ".zip").split('-').pop()

        if (fs.existsSync(path.resolve(libDir, `DONE ${version}`))) {
          VERBOSE && console.log("Library already downloaded.");
          return;
        }
        await download(ZIP_BASE + remote, libDir);
        await unzip(path.resolve(libDir, path.basename(remote)), libDir);
        fs.unlinkSync(path.resolve(libDir, path.basename(remote)));
      })();
    }),
  ).then((results) => {
    results.forEach((result) => {
      if (result.status === "rejected") {
        console.error(result.reason);
      }
    });
  });
})();

async function download(url, dest) {
  const downloader = new Downloader({
    url,
    directory: dest,
  });
  const { filePath } = await downloader.download();
  VERBOSE && console.log("Downloaded file to", filePath);
}

function unzip(zip, dest) {
  const dir = path.basename(zip, ".zip");
  const version = dir.split('-').pop()
  return new Promise((resolve, reject) => {
    yauzl.open(zip, { lazyEntries: true }, (err, zipfile) => {
      if (err) {
        reject(err);
      }
      zipfile.readEntry();
      zipfile
        .on("entry", (entry) => {
          if (/\/$/.test(entry.fileName)) {
            zipfile.readEntry();
          } else {
            zipfile.openReadStream(entry, (err, stream) => {
              if (err) {
                reject(err);
              }
              const f = path.resolve(
                dest,
                entry.fileName.replace(`${dir}/`, ""),
              );
              if (!fs.existsSync(path.dirname(f))) {
                fs.mkdirSync(path.dirname(f), { recursive: true });
                VERBOSE && console.log("Created directory", path.dirname(f));
              }
              stream.pipe(fs.createWriteStream(f));
              stream
                .on("end", () => {
                  VERBOSE && console.log("Extracted", f);
                  zipfile.readEntry();
                })
                .on("error", (err) => {
                  reject(err);
                });
            });
          }
        })
        .on("error", (err) => {
          reject(err);
        })
        .on("end", () => {
          VERBOSE && console.log("Extracted all files");
          fs.readdirSync(dest).filter(file => file.startsWith('DONE')).forEach(doneFile => 
            fs.rmSync(path.resolve(dest,doneFile)))
          fs.writeFileSync(path.resolve(dest, `DONE ${version}`), "");
        })
        .on("close", () => {
          resolve();
        });
    });
  });
}

function detectInstallIgnorePlatform() {
  try {
    // Get the parent process ID (PPID) of the current process
    const ppid = process.ppid;

    // Use a platform-specific command to get the command line of the parent process
    let command;
    if (process.platform === "win32") {
      command = `wmic process where (ProcessId=${ppid}) get CommandLine`;
    } else {
      command = `ps -o args= -p ${ppid}`;
    }

    // Execute the command to get the command line of the parent process
    const result = execSync(command, { encoding: "utf8" });

    // Check if the command line contains '--ignore-platform'
    if (result.includes("--ignore-platform")) {
      VERBOSE && console.log("Install command was run with --ignore-platform");
      return true;
    } else {
      VERBOSE &&
        console.log("Install command was not run with --ignore-platform");
      return false;
    }
  } catch (error) {
    console.error("Error detecting --ignore-platform:", error);
    return false;
  }
}
