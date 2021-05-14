module.exports = (core) => {
  const { loadEntity, Component, Meta } = require("../ecs")({ core });

  const LogRecord0 = Component("log0", {
    deviceID: null,
    dt: null,
    vTime: null,
    name: "default", /* Enum, there're many types of log0 records are available. */
    details: "",
    sessionID: null,
    ip: null
  });

  const SaveTaffy = Component("saveTaffy", {
    /* ... DYNAMIC Key: component name, Value: True = save all fields, Array = save some fields */
    save: (item) => ({ realm = "yehat1" } = {}) => {
      const a = {};
      for (let key in item.saveTaffy) {
        let v = item.saveTaffy[key];

        if (Array.isArray(v)) {
          a[key] = {};
          v.forEach(name => a[key][name] = item[key][name]);
        } else if (v === true) {
          a[key] = item[key];
        } else if (typeof v == "function") {
          /* That's a method, don't save */
        }
      }

      if (realm) a.realm = realm;

      core.db['entities'].insert(a);
      //localStorage[`${prefix}-${item.id}`] = JSON.stringify(a);
      console.log(`[ECS]Saved in Taffy ${item.meta.name}.`);
    }
  });

  const makeLogRecord0 = ({ id, ...a }) => loadEntity([
    LogRecord0(a),
    SaveTaffy({
      log0: true
    }),
    Meta({
      name: "Log Record",
      type: "LogRecord"
    })
  ], core)({ id: id || core.uuid(), specials: [ "save" ] });

  core.log0 = ({ deviceID, ...a }) => {
    const logRecord = makeLogRecord0({
      deviceID,
      dt: core.time(),
      vTime: core.vTimeNow(),
      name: "normal", /* Enum, there're many types of log0 records are available. */
      details: JSON.stringify(a),
      sessionID: null,
      ip: null
    });

    logRecord.save();
  };




  return {
    makeLogRecord0
  };
};