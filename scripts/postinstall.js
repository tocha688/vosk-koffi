const fs = require("node:fs");
const path = require("node:path");
const os = require("node:os");
const https = require("https");
const yauzl = require("yauzl");
const Downloader = require("nodejs-file-downloader");

const ZIP_BASE = "https://github.com/alphacep/vosk-api/releases/download";

const ZIP = {
    win32: {
        x64: "/v0.3.42/vosk-win64-0.3.42.zip",
        ia32: "/v0.3.42/vosk-win32-0.3.42.zip",
    },
    darwin: {
        arm64: "/v0.3.42/vosk-osx-0.3.42.zip",
        x64: "/v0.3.42/vosk-osx-0.3.42.zip",
    },
    linux: {
        arm64: "/v0.3.43/vosk-linux-aarch64-0.3.43.zip",
        arm: "/v0.3.43/vosk-linux-armv7l-0.3.43.zip",
        x64: "/v0.3.43/vosk-linux-x86_64-0.3.43.zip",
        ia32: "/v0.3.43/vosk-linux-x86-0.3.43.zip",
    },
};

const VERBOSE = true;
const LIB_DIR = path.resolve(__dirname, "..", `bin-${process.platform}-${process.arch}`);

(async () => {
    if (!fs.existsSync(LIB_DIR)) {
        fs.mkdirSync(LIB_DIR, { recursive: true });
    }

    if (fs.existsSync(path.resolve(LIB_DIR, "DONE"))) {
        VERBOSE && console.log("Library already downloaded.");
        return;
    }

    const remote = ZIP[process.platform]?.[process.arch];

    if (remote === undefined) {
        throw new Error(`Unsupported platform: ${process.platform}-${process.arch}`);
    }

    // await download(ZIP_BASE + remote, zip);
    const downloader = new Downloader({
        url: ZIP_BASE + remote,
        directory: LIB_DIR
    });
    const { filePath } = await downloader.download();
    VERBOSE && console.log("Downloaded file to", filePath);

    await unzip(filePath, LIB_DIR);
    fs.unlinkSync(filePath);
})();



function unzip(zip, dest) {
    const dir = path.basename(zip, ".zip");
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
                            const f = path.resolve(dest, entry.fileName.replace(`${dir}/`, ""));
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
                    fs.writeFileSync(path.resolve(dest, "DONE"), "");
                })
                .on("close", () => {
                    resolve();
                });
        });
    });
}
