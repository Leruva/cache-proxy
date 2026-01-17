const fs = require("fs/promises");
const path = require("path");
const crypto = require("crypto");

const CACHE_DIR = path.join(process.cwd(), ".cache");

function keyToFilename(key){
    return crypto.createHash("sha256").update(key).digest("hex") + ".json";
}

async function ensureCacheDir() {
    await fs.mkdir(CACHE_DIR, {recursive: true});
}

async function getCache(key) {
    try{
        const fp = path.join(CACHE_DIR, keyToFilename(key));
        const raw = await fs.readFile(fp, "utf8");
        return JSON.parse(raw);
    }catch{
        return null;
    }
}

async function setCache(key, record) {
  await ensureCacheDir();
  const fp = path.join(CACHE_DIR, keyToFilename(key));
  await fs.writeFile(fp, JSON.stringify(record), "utf8");
}

module.exports = { getCache, setCache, CACHE_DIR };

