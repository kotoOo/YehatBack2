const { exec } = require("child_process");
const handle = exec('gitPull.sh',
    (error, stdout, stderr) => {
        console.log(stdout);
        console.log(stderr);
        if (error !== null) {
            console.log(`exec error: ${error}`);
        }
    }
);

//console.log("handle", handle);