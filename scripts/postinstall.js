const fs = require("node:fs");
const path = require("node:path");
const os = require("node:os");
const https = require("https");
const yauzl = require("yauzl");

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

    const basename = path.basename(remote);
    const zip = path.resolve(os.tmpdir(), basename);
    await download(ZIP_BASE + remote, zip);
    VERBOSE && console.log("Downloaded file to", zip);

    await unzip(zip, LIB_DIR);
    fs.unlinkSync(zip);
})();

/**
 * Download the file to the correct location.
 * @param {string} url The url of the file to download
 * @param {string} to The path to save the file to
 * @param {number} redirect The number of redirects to follow
 * @returns {Promise<string>} The path to the file
 */
function download(url, to, redirect = 0) {
    if (redirect === 0) {
        VERBOSE && console.log(`Downloading ${url} to ${to}`);
    } else {
        VERBOSE && console.log(`Redirecting to ${url}`);
    }

    return new Promise((resolve, reject) => {
        if (!fs.existsSync(path.dirname(to))) {
            fs.mkdirSync(path.dirname(to), { recursive: true });
        }

        let done = true;
        const file = fs.createWriteStream(to);
        const request = https.get(url, (res) => {
            if (res.statusCode === 302 && res.headers.location !== undefined) {
                done = false;
                file.close();
                resolve(download(res.headers.location, to, redirect + 1));
                return;
            }
            res.pipe(file);
        });

        file.on("finish", () => {
            if (done) {
                resolve(to);
            }
        });

        request.on("error", (err) => {
            fs.unlink(to, () => reject(err));
        });

        file.on("error", (err) => {
            fs.unlink(to, () => reject(err));
        });

        request.end();
    });
}

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
