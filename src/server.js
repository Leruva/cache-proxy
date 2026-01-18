const express = require("express");
const { getCache, setCache } = require("./cache");

function startServer({port,origin}){
    const app = express();
    app.use(express.raw({ type: "*/*", limit: "10mb" }))
    app.use(async(req,res)=>{
        try{
            const upstreamURL = new URL(req.originalUrl, origin);
            const cacheKey = `${req.method}:${req.originalUrl}`;
            if (req.method === "GET") {
                const cached = await getCache(cacheKey);
                if (cached) {
                res.status(cached.status);
                for (const [name, value] of Object.entries(cached.headers)) {
                    res.setHeader(name, value);
                }
                res.setHeader("X-Cache", "HIT");
                return res.send(Buffer.from(cached.bodyBase64, "base64"));
                }
            }

            const headers = {...req.headers};
            delete headers.host;
            delete headers.connection;
            delete headers["content-length"];

            const hasBody = !["GET","HEAD"].includes(req.method);
            const body = hasBody ? req.body : undefined;

            const upstreamResp = await fetch(upstreamURL,{
                method: req.method,
                headers,
                body,
                redirect: "manual",
            });

            const buf = Buffer.from(await upstreamResp.arrayBuffer());
            res.status(upstreamResp.status);
            upstreamResp.headers.forEach((value,name)=>{
                if(name.toLowerCase() === "transfer-encoding")return;
                res.setHeader(name,value);
            });
            
            if (req.method === "GET" && upstreamResp.ok) {
                const headersToCache = {};
                upstreamResp.headers.forEach((value, name) => {
                const lower = name.toLowerCase();
                if (lower === "transfer-encoding") return;
                if (lower === "content-length") return;
                if (lower === "content-encoding") return;
                if (lower === "set-cookie") return;
                headersToCache[name] = value;
                });

                await setCache(cacheKey, {
                status: upstreamResp.status,
                headers: headersToCache,
                bodyBase64: buf.toString("base64"),
                cachedAt: Date.now(),
                });
            }
            res.setHeader("X-Cache", "MISS");
            return res.send(buf);
        }catch (err){
            res.status(502).json({
                message: "Bad gateway, failed to reach origin",
                error: err.message,
            });
        }
    });
    app.listen(port,()=>{
        console.log(`Caching proxy listening on port : ${port}`);
        console.log(`forwarding to origin : ${origin}`);
    });
}

module.exports = {startServer};