module.exports = (core, ecs) => {
  // const { loadEntity, Meta, SaveTaffy } = require("../ecs")({ core });

  const Owner0 = ecs.define("owner0", {
    userID: null, /* websocketID from server's perspective. null when user is offline. */
    dtCreated: core.time(),  /* this Component in this particular Entity */
    dtModified: core.time(), /* this Component in this particular Entity */
    access: "private"
  });

  return Owner0;
};