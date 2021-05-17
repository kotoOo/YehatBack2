const { exec } = require("child_process");
const runScript = (path) => new Promise((resolve, reject) => {
  const handle = exec(path,
    (error, stdout, stderr) => {
      if (error !== null) {
        console.log(`exec error: ${error}`, stderr);
        return reject({ error, stderr });
      }

      resolve(stdout);        
    }
  );
});

runScript('./gitPull.sh');

// const handle = exec('./gitPull.sh',
//     (error, stdout, stderr) => {
//         // console.log(stdout);
//         // console.log(stderr);
//         if (error !== null) {
//             console.log(`exec error: ${error}`, stderr);
//         }
//     }
// );

//console.log("handle", handle);