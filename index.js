#!/usr/bin/env node

const serverID = "a21447a1-d33c-4c2c-b1f9-50c980208a80";
/* "475316bd-47f9-477b-b2ff-b803b7cf6885" at box !! ToDo!! */
const epochStart = 18761;
 
const core = {
  config: {
    wsPort: 4950    
  },
  capitalize: s => s.charAt(0).toUpperCase() + s.slice(1),
  microTime: () => new Date().getTime(),
  time: () => Math.floor(new Date().getTime() / 1000),
  to2Digits: (v) => {
    let a = "" + v;
    if (a.length < 2) a = '0'+a;
    return a;
  },
  to3Digits: (v) => {
    let a = "" + v;
    while (a.length < 3) a = '0'+a;
    return a;
  },
  dtToVTime: (dt, short = false) => {
    const ms = dt % 1000;
    const a1 = Math.floor(dt / 1000);
    const s = a1 % 60;
    const a2 = Math.floor(a1 / 60);
    const m = a2 % 60;
    const a3 = Math.floor(a2 / 60);
    const h = a3 % 24;
    const a4 = Math.floor(a3 / 24);
    const d = a4 / 10;
    if (short) return `${core.to2Digits(h)}:${core.to2Digits(m)}:${core.to2Digits(s)}.${core.to3Digits(ms)}`;
    return `Day ${a4 - epochStart} Time ${core.to2Digits(h)}:${core.to2Digits(m)}:${core.to2Digits(s)}.${core.to3Digits(ms)}`;
  },
  dtStart: null, /* Moment of Yehat System started. */
  vTimeNow: () => core.dtToVTime(core.microTime()),
  vTimeSession: () => core.dtToVTime(core.microTime() - core.dtStart, true),
  log: (...rest) => console.log(...rest),
  makeLog: (name) => (...rest) => 
    console.log("\x1b[37m--[\x1b[33m %s \x1b[37m]--[ %s ]--[ "+"%s ".repeat(Object.keys(rest).length), name, core.vTimeSession(), ...rest),
  uuid: () => 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => {
    let r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  }),
  validateEmail: email => {
    const re = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
    return re.test(String(email).toLowerCase());
  },
  escapeHTML: (text) => {
    const map = {
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#039;'
    };

    return text.replace(/[&<>"']/g, m => map[m]);
  },
  dec: b=>{let a={},e={},d=b.split(""),c=d[0],f=c,g=[c],h=256,o=h;for(b=1;b<d.length;b++)a=d[b].charCodeAt(0),a=h>a?d[b]:e[a]?e[
    a]:f+c,g.push(a),c=a.charAt(0),e[o]=f+c,o++,f=a;return g.join("")},
  enc: c=>{let x='charCodeAt',b={},z={},f=c.split(""),d=[],a=f[0],g=256;for(b=1;b<f.length;b++)c=f[b],null!=z[a+c]?a+=c:(d.
    push(1<a.length?z[a]:a[x](0)),z[a+c]=g,g++,a=c);d.push(1<a.length?z[a]:a[x](0));for(b=0;b<d.length;b++)d[b]=
    String.fromCharCode(d[b]);return d.join("")},
  decJ(s) {
    return JSON.parse(this.dec(s));
  },
  encJ(o) {
    return this.enc(JSON.stringify(o))
  },
  ...((() => {
    const randomString = r => n => () => new Uint8Array(n).reduce((a, v) => a + Math.floor(Math.random() * r).toString(r), "");
    return {
      randomString,
      randomHex8: randomString(16)(8),
      randomHex20: randomString(16)(20),
    }
  })()),
  ms: delay => new Promise(resolve => setTimeout(resolve, delay)),
  dropper: (drop = []) => v => {
    const a = Object.assign({}, v);
    drop.forEach(key => delete a[key]);
    return a;
  },    
  panic: [],
  mods: {}
};

const { Component, ecs } = require("./ecs.js")({ core });

core.dtStart = core.microTime();
core.log("\x1b[35m--[\x1b[04m Yehat Backend \x1b[m\x1b[35m]--[ %s ]--[ %s\x1b[m", core.vTimeNow(), "Initializing server...");

const log = core.makeLog("Core");

(async() => {
    core.db = await require('./mods/epitaffy')(core);

    if (core.db.config) {
      let c = 0;
      core.db.config().get().map(item => {
        core.config[item.name] = item.value;
        c++;
      });

      core.log(`${c} config items loaded from DB.`);
    } else {
      core.log(`No DB config found.`);
    }

    core.mods.db.ensureTables({ 
      tables: [ 'entities' ]
    });

    const treasure = require("./items")(core, ecs);
    const { makeUser0, makeUser1, upgradeUser0ToUser1 } = treasure;

    core.log0({ deviceID: serverID, name: "yehat-backend-start", message: "Ye-haat. Reporting in. Server is about to start now." });
    console.log("treasure", treasure);

    // require("./items/index.js");
    // require("./systems/serverSaveSystem.js")(core);
    // require("./systems/usersSystem.js")(core);
    
    [ /* 'express', 'hub', 'workshop', 'mail', 'marlin', 'epitaffyadmin', 'ecs', 'online', 'gallery' */ ].map(mod => {
      core.mods[mod] = require(`./mods/${mod}.js`)(core);
    });

    const userFromDeviceID = (deviceID) => {
      // const query = core.db.entities({ user0: { deviceID } });
      const query = core.db.entities(function() {  /* This is an analogue of pre-reactive ORM languages and hopefully we'll
                                                      get out of this territory soon. For the glory! */
        const entity = this;
        if (entity.user0 && ~entity.user0.deviceIDs.indexOf(deviceID)) return true;
        if (entity.user0) console.log("user in DB", entity);
        return false;
      });
      const a = query.get();

      if (!a.length) return null;

      const user0 = ecs.revive(a[0]);

      // console.log("user from deviceID", deviceID, user0);

      /* return makeUser0(a[0]); */ /* WRONG!! this function ain't supposed to get plain entity as an input!! */
      return user0;
    };

    const requestListener = function (req, res) {
      res.writeHead(200);
      res.end("PropertyLeads Liberty Pylon Alpha Zero");
    };

    const httpServer = require("http").createServer(requestListener);
    const io = require("socket.io")(httpServer, {
      cors: {
        origin: "*", // http://127.0.0.1:8080/
        methods: "GET,HEAD,PUT,PATCH,POST,DELETE",
        allowedHeaders: ["my-custom-header"],
        credentials: true
      }
    });

    io.on("connection", (socket) => {
      socket.data = {
        dtSessionStart: core.microTime()
      };

      const SVTime = () => core.microTime() - socket.data.dtSessionStart;
      const UpTime = () => core.microTime() - core.dtStart;

      console.log("Connection", socket.id);
      socket.emit("server", {
        time: core.dtToVTime(core.microTime())
      });

      socket.use(async (event, next) => {
        if (!Array.isArray(event)) return next();
        console.log(">=", event[0], event[1]);

        const fn = event[2];
        const reply = (a) => {
          if (fn) {
            return fn(a);
          } else {
            console.log("socket.id missed acknoledgement.", a);
          }
        };



        if (event[0] == 'deviceID' && core.log0) {
          const now = +new Date();
          const { deviceID, userObject } = event[1]; /* userObject is incoming, but how do we pipe it through? */
          core.log0({ deviceID, name: "deviceID-report-00", deviceID, svTime: SVTime() });
          socket.data = {
            ...socket.data,
            deviceID,
            pathPoints: 0
          };

          const user = userFromDeviceID(deviceID);
          if (user) {
            socket.data.userID = user.id;
            socket.data.sessonID = core.uuid();

            if (user.type == 'user0' && userObject) {
              upgradeUser0ToUser1(user, userObject);
            }
            
            console.log("connected user by deviceID", user.id, user.type);
            user.user0.sessionID = socket.data.sessonID;
            user.user0vtm.socketID = socket.id;
            user.user0vtm.dtSessionStart = now;
            user.user0vtm.dtLastActivity = now;
            user.user0vtm.online = true;
            user.save();
          } else {
            /* create user based on userObject */
            if (userObject) {
              const user1 = makeUser1({ deviceID, socketID: socket.id, userObject });
              user1.save();
              core.log0({ name: "user-created", type: "user1", deviceID, userID: user0.id, svTime: SVTime(), uptime: UpTime() });
            } else {
              const user0 = makeUser0({ deviceID, socketID: socket.id, userID: userObject.user_name });
              user0.save();
              core.log0({ name: "user-created", type: "user0", deviceID, userID: user0.id, svTime: SVTime(), uptime: UpTime() });
            }
            // reply({ code: "ok", user0 });
          }
        }

        if (event[0] == 'read') {
          const { keys, tags, types, ids } = event[1];
          const { deviceID } = socket.data;
          core.log0({ deviceID, name: "read", keys, tags, types, ids, svTime: SVTime() });

          const fn = event[2];
          if (fn && typeof fn == 'function') {
            const entities = [ ...core.db["entities"]().get() ]; /* Unbind from Taffy Networking? */

            /* Benchmark!! */

            const sorted = entities.filter(e => !!e.log0).sort((a, b) => {
              // if (a.log0 && b.log0) {
                // console.log("sorting", a.log0.dt, b.log0.dt);
                return b.log0.dt - a.log0.dt;
              // }
              // return 0;
            });

            /* -- */

            fn({ code: "ok", entities: sorted });
          }
        }

        if (event[0] == 'reportRouting') {
          const { page, fromPage, path } = event[1];
          const { deviceID } = socket.data;
          core.log0({ name: "routing", deviceID, page, fromPage, path, svTime: SVTime() });
          socket.data.pathPoints++;

          const fn = event[2] || (() => {});
          fn({ code: "ok", pathPoints: socket.data.pathPoints });
        }

        if (event[0] == 'restart') {
          const { deviceID } = socket.data;

          log("Yehat backend shutting down...");
          core.log0({ name: "yehat-backend-restart", deviceID, svTime: SVTime(), uptime: UpTime() });

          const fn = event[2] || (() => {});
          fn({ code: "ok" });
        
          await core.ms(250).then(() => {
            httpServer.close();

            // process.on("exit", function () {
            require("child_process").spawn("cmd", [ "start cmd" ], {
              cwd: process.cwd(),
              detached : true,
              stdio: "inherit"
            });
            // // });
            process.exitCode = 1;
            process.exit(1);
            // process.exit();
          });
        }

        if (event[0] == 'user0') {
          const { deviceID } = socket.data;
          const existing = userFromDeviceID(deviceID);

          if (existing) {
            reply({ code: "ok", user0: existing });
            core.log0({ name: "user-existing", deviceID, userID: existing.id, svTime: SVTime(), uptime: UpTime() });
            next(); return;
          }

          const user0 = makeUser0({ deviceID, socketID: socket.id });
          user0.save();
          core.log0({ name: "user-created", deviceID, userID: user0.id, svTime: SVTime(), uptime: UpTime() });
          reply({ code: "ok", user0 });
        }

        if (event[0] == 'room0') {
          const { at } = event[1];
          const all = core.db.entities(function(entity) {
            if (at) {
              return this.id === at || this.type === at;
            } else {
              return this.id ? true : false;
            }
          }).get();

          const types = {}; /* keys: types, values: how many times met */
          const compos = {}; /* keys: compo names, values: how many times met */
          all.map(item => {
            types[item.type] = (types[item.type] || 0) + 1;
            Object.keys(item).map(key => {
              compos[key] = (compos[key] || 0) + 1;
            });
          });

          reply({ code: "ok", types, compos, total: all.length, top: all.slice(0, 4) });
        }

        if (event[0] == 'runScript') {
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
          const { path } = event[1];
          try {
            const output = await runScript(path);
            reply({ code: "ok", details: output });
          } catch(e) {
            reply({ code: "fail", details: e.message });
          }
        }

        if (event[0] == 'userlist') {
          const items = core.db.entities(function(entity) {            
            return !!this.user1;
          }).get();
          reply({ code: "ok", items })
        }

        next();
      });

      socket.on("disconnect", (reason) => {
        const { deviceID } = socket.data;

        const user = userFromDeviceID(deviceID);
        if (user) {
          // console.log("disconnected user by deviceID", user);
          user.user0.sessionID = null;
          user.user0vtm.socketID = null;
          user.user0vtm.dtLastActivity = +new Date();
          user.user0vtm.online = false;
          user.save();
        }

        core.log0({ name: "disconnect", deviceID, svTime: SVTime(), uptime: UpTime(), reason });
      });
    });

    httpServer.listen(80);
})();
