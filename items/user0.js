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

  const UserAccess0 = Component("userAccess0", {
    additional_standard_per: null,
    affiliate: null,
    billing_period_start: null,
    coupon_affiliate_code: {},
    monthly_const: null,
    plan_base_rate: 0,
    plan_schedule: 'monthly',
    plan_type: null,
    plans: [],
    skiptracing_cost_per_hit: 0,
    standard_stripe_sub_id: null
  });

  const User1 = Component("user1", {
    user_name: null,
    stripe_customer_id: null,
    email_address: null,
    first_name: null,
    last_name: null,
    company: null,
    added_ts: null,
    active: false,
    srtipe_card_id: null,
    stripe_card_last4: null,    
    rumored: '',
    phone: null,
    user_access: UserAccess0().userAccess0    
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

  const upgradeUser0ToUser1 = (user, userObject) => { /* won't save */
    user.type = "user1";
    user.user1 = User1({
      ...userObject,
      user_access: UserAccess0(userObject.user_access)
    });
    user.saveTaffy.user1 = true;
    user.user0.level = 1;
    user.user0.origin = "listability";
    user.user0.memberID = userObject.user_name;
    user.user0.name = `${userObject.first_name} ${userObject.last_name}`;
    user.user0.status = "Hey, I'm a ListAbility user.";
  };

  const makeUser1 = ({ id, socketID, deviceID, userObject, ...a }) => { 
    const user = makeUser0({ id, socketID, deviceID, ...a });

    upgradeUser0ToUser1(user, userObject);
    user.save();

    return user;
  }; 

  ecs.types.user1 = ({ ...data }) => {
    const user = ecs.composeEntity([
      SaveTaffy({
        user0: true,
        user1: true,
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


  return { User0, makeUser0, makeUser1, upgradeUser0ToUser1 };
};