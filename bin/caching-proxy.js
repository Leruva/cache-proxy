#!/usr/bin/env node

function parseArgs(argv){
    const args = {clearCache: false, port: null, origin: null};

    for (let i = 2; i < argv.length; i++){
        if(argv[i] === "--clear-cache"){
            args.clearCache = true;
            continue;
        }        
        if(argv[i] === "--port"){
            args.port = Number(argv[++i]);
            continue;
        }
        if(argv[i] === "--origin"){
            args.origin = argv[++i];
            continue;
        }
    }

    return args;
}


function validate(args){
    if(args.clearCache) return;

    if(!args.port || Number.isNaN(args.port)){
        throw new Error("Missing or invalid --port <number>");
    }

    if(!args.origin){
        throw new Error("Missing --origin <url>");
    }

    try{
        new URL(args.origin);
    }catch(err){
        throw new Error("Invalid --origin URL , Example: http://dummyurl.com");
    }
}

async function main() {
    try{
        const args = parseArgs(process.argv);
        validate(args);
        if(args.clearCache){
            console.log("cleared cache");
        }
        console.log("Starting caching proxy with: ");
        console.log("  port =", args.port);
        console.log("  origin =", args.origin);
        
    }catch(err){
        console.error("Error: err.message");
        console.error("Usage:");
        console.error("  caching-proxy --port <number> --origin <url>");
        console.error("  caching-proxy --clear-cache");
        process.exit(1);
    }
}
main();