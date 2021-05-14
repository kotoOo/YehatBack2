

const serverID = "a21447a1-d33c-4c2c-b1f9-50c980208a80";
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
    if (short) return `Match Time ${core.to2Digits(h)}:${core.to2Digits(m)}:${core.to2Digits(s)}.${core.to3Digits(ms)}`;
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

const { Component } = require("./ecs.js")({ core });

core.dtStart = core.microTime();
core.log("\x1b[37m--[\x1b[33m Yehat Backend \x1b[37m]--[ %s ]--[ %s", core.vTimeNow(), "Initializing server...");

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

    require("./items")(core);

    core.log0({ deviceID: serverID, name: "yehat-backend-start", message: "Ye-haat. Reporting in. Server is about to start now." });

    // require("./items/index.js");
    // require("./systems/serverSaveSystem.js")(core);
    // require("./systems/usersSystem.js")(core);
    
    [ /* 'express', 'hub', 'workshop', 'mail', 'marlin', 'epitaffyadmin', 'ecs', 'online', 'gallery' */ ].map(mod => {
      core.mods[mod] = require(`./mods/${mod}.js`)(core);
    });
    

    const requestListener = function (req, res) {
      res.writeHead(200);
      res.end("PropertyLeads Liberty Pylon Alpha Zero");
    };

    const httpServer = require("http").createServer(requestListener);
    const io = require("socket.io")(httpServer, {
      cors: {
        origin: "http://127.0.0.1:8080/",
        methods: [ "GET", "POST" ],
        allowedHeaders: ["my-custom-header"],
        credentials: true
      }
    });

    io.on("connection", (socket) => {
      console.log("Connection", socket.id);
      socket.emit("server", {
        time: core.dtToVTime(core.microTime())
      });

      socket.use((event, next) => {
        console.log("Packet", event);
        if (event[0] == 'deviceID' && core.log0) {
          const { deviceID } = event[1];
          core.log0({ deviceID, name: "deviceID-report-00", deviceID });
        }

        if (event[0] == 'read') {
          const { deviceID, keys, tags, types, ids } = event[1];
          core.log0({ deviceID, name: "read", keys, tags, types, ids });

          const fn = event[2];
          if (fn && typeof fn == 'function') {
            const entities = [ ...core.db["entities"]().get() ]; /* Unbind from Taffy Networking? */
            const sorted = entities.filter(e => !!e.log0).sort((a, b) => {
              // if (a.log0 && b.log0) {
                console.log("sorting", a.log0.dt, b.log0.dt);
                return b.log0.dt - a.log0.dt;
              // }
              // return 0;
            });

            fn({ code: "ok", entities: sorted });
          }
        }

        next();
      });
    });

    httpServer.listen(80);
})();
