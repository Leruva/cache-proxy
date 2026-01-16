const express = require("express");

function startServer({port,origin}){
    const app = express();
    app.get("/health", (req,res)=>{
        res.json({ok: true, origin})
    })
    app.listen(port,()=>{
        console.log(`Caching proxy listening on port : ${port}`);
        console.log(`forwoaring to origin : ${origin}`);
    });
}

module.exports = {startServer};