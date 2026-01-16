const { error } = require("console");
const express = require("express");

function startServer({port,origin}){
    const app = express();
    app.use(express.raw({ type: "*/*", limit: "10mb" }))
    app.use(async(req,res)=>{
        try{
            const upstreamURL = new URL(req.originalUrl, origin);
            const headers = {...req.headers};
            delete headers.host;
            delete headers.connection;
            delete headers["content-length"];

            const hasBody = !["GET"||"HEAD"].includes(req.method);
            const body = hasBody ? req.body : undefined;

            const upstreamResp = await fetch(upstreamURL,{
                method: req.method,
                headers,
                body,
                redirect: "manual",
            });
            const buf = Buffer.from(await upstreamResp.arrayBuffer());
            res.status(upstreamResp.status);
            upstreamResp.headers.forEach((name,value)=>{
                if(name.toLowerCase() === "transfer-encoding")return;
                res.setHeader(name,value);
            });

            res.setHeader("X-Cache", "MISS");
        }catch (err){
            res.status(502).json({
                message: "Bad gateway, failed to reach origin",
                error: err.message,
            });
        }
    });
    app.listen(port,()=>{
        console.log(`Caching proxy listening on port : ${port}`);
        console.log(`forwoaring to origin : ${origin}`);
    });
}

module.exports = {startServer};