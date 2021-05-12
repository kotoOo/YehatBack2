module.exports = async (core) => {
    const Taffy = require("../libs/taffy.min.js").taffy;
    // const fossil = require("../libs/fossildelta.cjs.min.js");
    // const dffptch = require("../libs/dffptch.js");
    const fs = require('fs').promises;
    const path = require('path');

    const tablePath = (table, suffix) => path.join(__dirname, `../db/${table}.${suffix}.json`);
    const dbPath = path.join(__dirname, '../db/');

    const locks = {};
    const save = async ({ table }) => {
        try {
            const filename = tablePath(table, 'taffy');
            while (locks[table]) await core.ms(50);
            locks[table] = true;

            /* -- Fossil */
            // const deltaFilename = tablePath(table, 'deltas');
            // const current = db[table]().stringify();
            // const before = await fs.readFile(filename, 'binary').catch(() => '[]');
            // const delta = fossil.create(before, current);
            // const deltaStr = Buffer.from(delta.map(b => typeof b == 'string' ? b.charCodeAt(0) : b)).toString('base64');
            // await fs.writeFile(deltaFilename, deltaStr+'\n', { flag: "a+" });
            /* -- */

            /* -- dffptch */
            const deltaFilename = tablePath(table, 'deltas');
            const current = db[table]().get();
            console.log("current", current);

            const before = JSON.parse(await fs.readFile(filename, 'binary').catch(() => '[]'));
            const delta = dffptch.diff(before, current);
            const deltaStr = Buffer.from(core.encJ(delta)).toString('base64');
            console.log("delta", delta);
            console.log("deltaStr", deltaStr);
            
            await fs.writeFile(deltaFilename, deltaStr+'\n', { flag: "a+" });
            /* -- */

            await fs.writeFile(filename, JSON.stringify(current));
            core.log(`[ EpiTaffy ] ${table} saved.`);
            delete locks[table];
        } catch(e) {
            core.panic.push({
                code: "taffySaveFailure",
                table,
                message: e.message
            });
        }
    };

    const load = async ({ table }) => {
        try {
            const filename = tablePath(table, 'taffy');
            const json = await fs.readFile(filename).catch(() => '[]');
            db[table] = Taffy(JSON.parse(json));
            db[table].settings({
                onUpdate() {
                  console.log("DB Update");
                  setImmediate(() => {
                    save({ table });
                  });
                },
                onInsert() {
                    console.log("DB Insert");
                    setImmediate(() => {
                      save({ table });
                    });
                },
                onRemove() {
                    console.log("DB Remove");
                    setImmediate(() => {
                      save({ table });
                    });
                }
            });
        } catch(e) {
            core.panic.push({
                code: "taffyLoadFailure",
                table,
                message: e.message
            });
        }
    };

    const allTables = async () => {
      const files = await fs.readdir(dbPath);
      return files.map(item => item.match(/(.+)\.taffy\.json/i)).filter(item => item).map(item => item[1]);
    };

    const db = {};
    let c = 0;
    for(let table of await allTables()) {
        await load({ table });
        c++;
    }
    core.log(`[ EpiTaffy ] ${c} table(s) loaded.`);

    //core.log(`[ EpiTaffy ] members`, db.members().get());

    core.mods.db = {
      // async healthCheck({ table }) {
      //   const deltaFilename = tablePath(table, 'deltas');
      //   const deltas = (await fs.readFile(deltaFilename, { encoding: 'binary' })).split('\n');
      //   let origin = [];

      //   for(let deltaB64 of deltas) {
      //       const deltaStr = Buffer.from(deltaB64, 'base64').toString('utf8');
      //       if (!deltaStr.length) continue;
      //       // console.log("deltaStr", deltaStr);
      //       const delta = core.decJ(deltaStr);
      //       // console.log("delta", delta);
            
      //       //console.log("parse delta", deltaStr, delta);
      //       //console.log("delta size", delta.length);
      //       //origin = fossil.apply(origin, delta);
      //       dffptch.patch(origin, delta);
      //   }

      //   const live = await fs.readFile(tablePath(table, 'taffy'));
      //   // core.log("Recovered", JSON.stringify(origin));
      //   // core.log("Live", live.length, typeof live);
      //   core.log("[ EpiTaffy ] Health status", live == JSON.stringify(origin) ? 'GOOD' : 'NO GOOD');
      // },
      async create({ table }) {
        if (db[table]) throw("Already exists.");

        db[table] = Taffy();
        db[table].settings({
            onUpdate() {
              console.log("DB Update");
              setImmediate(() => {
                save({ table });
              });
            },
            onInsert() {
                console.log("DB Insert");
                save({ table });
            },
            onRemove() {
                console.log("DB Remove");
                save({ table });
            }
        });

        await save({ table });
        return db[table];
      },
      async ensureTable({ table }) {
        if (!db[table]) return core.mods.db.create({ table });
      },
      async ensureTables({ tables = [] }) {
        return Promise.all(tables.map(table => core.mods.db.ensureTable({ table })));
      },
      allTables
    };

    // await core.mods.db.healthCheck({ table: 'members' });

    return db;
};