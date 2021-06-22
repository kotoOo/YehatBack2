module.exports = (core, ecs) => {
  const express = require('express');
  const fs = require("fs");
  const path = require('path');
  const fallback = require('express-history-api-fallback');
  const app = express();
  const httpServer = require("http").createServer(app);

  const options = {
    key: fs.readFileSync('./keys/localhost.key'),
    cert: fs.readFileSync('./keys/localhost.crt')
  };

  const httpsServer = require("https").createServer(options, app);

  const rootPath = path.join(__dirname, '../public');

  
  app.use("/storage", (req, res, next) => {
    console.log("storage request", req.url, path.join(__dirname, '../../storage', req.url));
    //res.sendFile(path.join(__dirname, '../../storage', req.url));
    next();
  }, express.static(path.normalize(path.join(__dirname, '../../storage'))));
  app.use(express.static(rootPath));
  //, express.static(path.normalize(path.join(__dirname, '../../storage/')))

  app.use(/^\/api.*/, express.json({ limit: '50mb' }), express.urlencoded({ extended: true }));
  app.use(/^(?!\/api|\/api-raw|\/socket|\/storage).*/, fallback('index.html', { root: rootPath }));

  const port = 80;
  const portSSL = 443;    
  httpServer.listen(port); // <== 
  httpsServer.listen(portSSL); // <== 

  core.log("\x1b[35m--[\x1b[04m Yehat Backend \x1b[m\x1b[35m]--[ %s ]--[ %s\x1b[m", core.vTimeNow(), `Listening on port ${port}, ${portSSL} SSL`);    

  return {
    app, httpServer, httpsServer
  };
};