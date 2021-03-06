module.exports = (core, ecs) => {
  const { loadEntity, Meta, SaveTaffy } = require("../ecs")({ core });

  const LogRecord0 = ecs.define("log0", {
    deviceID: null,
    dt: null,
    vTime: null, /* Epoch time, started at 14th May '21 */
    svTime: null, /* Session time started with WebSocket connection */
    name: "default", /* Enum, there're many types of log0 records are available. */
    details: "",
    sessionID: null,
    ip: null
  });

  //ecs.compo.log0 = logRecord0;

  const makeLogRecord0 = ({ id, ...a }) => loadEntity([
    { type: "log0" },
    LogRecord0(a),
    SaveTaffy({
      log0: true
    }),
    Meta({
      name: "Log Record",
      type: "LogRecord"
    })
  ], core)({ id: id || core.uuid(), specials: [ "save" ] });

  core.log0 = ({ deviceID, svTime, socket = null, ...a }) => { /* now svTime might be auto inferred from socket */
    const SVTime = (socket) => core.microTime() - socket.data.dtSessionStart;   

    const logRecord = makeLogRecord0({
      deviceID,
      dt: core.time(),
      vTime: core.vTimeNow(),
      name: "normal", /* Enum, there're many types of log0 records are available. */
      details: JSON.stringify(a),
      sessionID: null,
      ip: null,
      svTime: svTime ? core.dtToVTime(svTime, true) : (
        socket ? SVTime(socket) : null
      )
    });

    logRecord.save();

    if (core.io) core.io.to("log0").emit("e", logRecord);

    return logRecord;
  };




  return {
    makeLogRecord0
  };
};