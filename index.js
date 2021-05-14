const serverID = "a21447a1-d33c-4c2c-b1f9-50c980208a80";
 
const core = {
  config: {
    wsPort: 4950    
  },
  capitalize: s => s.charAt(0).toUpperCase() + s.slice(1),
  microTime: () => new Date().getTime(),
  time: () => Math.floor(new Date().getTime() / 1000),
  log: (...rest) => console.log(...rest),
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
    });

    httpServer.listen(80);
})();
