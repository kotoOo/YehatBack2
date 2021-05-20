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

            const current = db[table]().stringify();
            await fs.writeFile(filename, JSON.stringify(current));
            core.log(`--[ Taffy ] ${table} saved.`);
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
                  console.log("--[ Taffy ] DB Update");
                  setImmediate(() => {
                    save({ table });
                  });
                },
                onInsert() {
                    console.log("--[ Taffy ] DB Insert");
                    setImmediate(() => {
                      save({ table });
                    });
                },
                onRemove() {
                    console.log("--[ Taffy ] DB Remove");
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
    core.log(`--[ Taffy ] ${c} table(s) loaded.`);

    core.mods.db = {
      async create({ table }) {
        if (db[table]) throw("Already exists.");

        db[table] = Taffy();
        db[table].settings({ /* Code duplication!! */
            onUpdate() {
              console.log("--[ Taffy ] DB Update");
              setImmediate(() => {
                save({ table });
              });
            },
            onInsert() {
                console.log("--[ Taffy ] DB Insert");
                save({ table });
            },
            onRemove() {
                console.log("--[ Taffy ] DB Remove");
                save({ table });
            }
        });

        await save({ table });
        return db[table];
      },
      async ensureTable({ table }) {
        if (db[table]) return db[table];
        core.mods.db.create({ table });
        core.log(`--[ Taffy ] Table created [ ${table} ].`);
        save({ table });
        return db[table];
      },
      async ensureTables({ tables = [] }) {
        return Promise.all(tables.map(table => core.mods.db.ensureTable({ table })));
      },
      allTables
    };

    // await core.mods.db.healthCheck({ table: 'members' });

    return db;
};