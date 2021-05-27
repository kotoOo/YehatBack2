module.exports = (core, ecs) => {
  const { loadEntity, Meta, SaveTaffy } = require("../ecs")({ core });

  const Stat0 = ecs.define("stat0", {
    name: "No name", /* caption */
    value: 0,
    dt: null
  });

  const makeStat0 = ({ id, ...a }) => {
    const stat0 = loadEntity([
      { type: "stat0" },
      Stat0(a),
      SaveTaffy({
        stat0: true
      }),
      Meta({
        name: "Stat 0",
        type: "Counter"
      })
    ], core)({ id: id || core.uuid(), specials: [ "save" ] });

    ecs.root[stat0.id] = stat0;
    return stat0;
  };

  return { Stat0, makeStat0 };
};