module.exports = (core, ecs) => {
  const { loadEntity, Component, Meta, SaveTaffy } = require("../ecs")({ core });

  const User0 = Component("user0", {
    sessionID: null, /* websocketID from server's perspective. null when user is offline. */
    deviceIDs: [],
    memberID: null, /* in host system - PL */
    origin: null, /* host system name, domain for memberID - PL, LA, PropSkip... */
    name: "noname", /* Nickname URL-friendly characters */
    status: "Hey, I'm just a visitor.",
    level: 0
  });

  const User0VTM = Component("user0vtm", {
    socketID: null,
    dtCreated: null,
    dtSessionStart: null,
    dtLastActivity: null,
    online: false
  });

  // const User0Entity = ({ id, ...a }) => loadEntity([ /* here passed DEFAULT values for all component constructors, actual data will
  //     be hydrated from Taffy */
  //   { type: "user0" },
  //   User0(),
  //   User0VTM(),
  //   SaveTaffy({
  //     user0: true,
  //     user0vtm: true,
  //     type: true
  //   }),
  //   Meta({
  //     name: "Yehat User",
  //     type: "Account"
  //   })
  // ], core)({ id, specials: [ "save" ] });

  /* Koto 1st ID on localHost: d8c2cc1b-b981-434c-b28d-e9c6c9607fca   <= not saved */
  /*      2nd ID on localHost: 201c5d52-d74a-47b3-ab8d-afc3925c58e4   <= ?! */
  /*      15th on localHost: b04dbc9c-16fb-413f-813f-75b2f6aa3aa6 */
  const makeUser0 = ({ id, socketID, deviceID, ...a }) => { 
    const online = !!socketID;
    const now = +new Date();
    const deviceIDs = [];
    if (deviceID) deviceIDs.push(deviceID);

    // console.log("deviceIDs", deviceIDs);

    const user = loadEntity([
      { type: "user0" },
      User0({ ...a, deviceIDs }),
      User0VTM({ dtCreated: now, dtSessionStart: online ? now : null, dtLastActivity: online ? now : null, online, socketID }),
      SaveTaffy({
        user0: true,
        user0vtm: true,
        type: true
      }),
      Meta({
        name: "Yehat User",
        type: "Account"
      })
    ], core)({ id: id || core.uuid(), specials: [ "save" ] });

    // console.log("for", deviceID, "created user0", user);
    return user;
  };

  

  // ecs.types.user0 = makeUser0; // bad
  ecs.types.user0 = ({ ...data }) => {
    const user = ecs.composeEntity([
      SaveTaffy({
        user0: true,
        user0vtm: true,
        type: true
      }),
      Meta({
        name: "Yehat User",
        type: "Account"
      })
    ], data);

    // console.log("hydrated", user);

    return user;
  };

  /* ecs.createUser0 .... meow meow meow ... */


  return { User0, makeUser0 };
};