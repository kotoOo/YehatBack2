module.exports = (core, ecs) => {
  // const { loadEntity, Meta, SaveTaffy } = require("../ecs")({ core });

  const User2 = ecs.define("user2", {
    eventID: null, /* What event led to creating this user2 record. */
                   /* Ex.: Presentation 0 [704539de-5b73-4f3f-8e72-f78755c14b1c] */
    refID: null, /* Owner of the invitational code, an arbitrary UUID - user0, user1, user2 - any */
    name: "Unknown",
    deviceIDs: []
  });

  const User2Pos = ecs.define("user2pos", {
    pos: [ 0, 0, 0 ],
    dir: 0,
    dt: null
  });

  const makeUser2 = ({ /* id, */ socketID, deviceID, eventID, code, name, ...a }) => { 
    console.log("makeUser2", { /* id, */ socketID, deviceID, eventID, code, name, ...a });
    const id = null; /* We're not supporting creating user2 records for existing IDs */
                     /* intentionally, however, if it might be needed for some kind of */
                     /* experimental stuff, uncomment it, and good luck. */
    const online = !!socketID;
    const now = +new Date();
    const deviceIDs = [];
    if (deviceID) deviceIDs.push(deviceID);

    // console.log("deviceIDs", deviceIDs);

    /* Look for existing user0 on this deviceIDs */
    /* Later =) */

    /* Look for existing user2 on this deviceIDs */
    /* Later =) */

    /* Look for existing user2 with the same name */
    /* Globally? Within a realm? Yes! EventID! */

    let c = 0;
    const existing = core.db.entities(function() { 
      const item = this;
      c++;
      return item && item.type == "user2" && item.user2 && item.user2.eventID == eventID && item.user2.name == name;
    }).get();

    console.log("Entities searched", c);


    if (existing.length) { /* User name exists within the realm. */
      console.log("Found!");
      // throw("User name exists within the realm.");
      let mine = null;
      for(let item of existing) {      
        if (~item.user2.deviceIDs.indexOf(deviceID)) {
          mine = item;
          break;
        }
      }

      if (mine) {
        if (ecs.root[mine.id]) return ecs.root[mine.id];

        const { ___id, ___s, ...a } = mine;
        // const entity = ecs.types.Entity({
        //   ...a,
        //   ecs.compo.saveTaffy({
        //     user2: true,  
        //     user2pos: true,
        //     type: true
        //   }),
        //   ecs.compo.meta({
        //     name: "Promotion-Aquired User",
        //     type: "Account"
        //   })
        // });
        // ecs.bindMethods({ entity, specials: [ "save" ]});
        const entity = ecs.composeEntity([
          ecs.compo.saveTaffy({
            user2: true,  
            user2pos: true,
            type: true
          }),
          ecs.compo.meta({
            name: "Promotion-Aquired User",
            type: "Account"
          })
        ], a);

        ecs.root[entity.id] = entity;
        return entity;
      }
      
      throw("Username is already reserved.");
    } else {
      console.log("Not found.");
    }

    const user2 = ecs.loadEntity([
      { type: "user2" },
      //User0VTM({ dtCreated: now, dtSessionStart: online ? now : null, dtLastActivity: online ? now : null, online, socketID }),
      ecs.compo.user2({
        eventID, refID: code, name, deviceIDs: [ deviceID ]
      }),
      ecs.compo.user2pos({

      }),
      ecs.compo.saveTaffy({
        user2: true,  
        user2pos: true,
        type: true
      }),
      ecs.compo.meta({
        name: "Promotion-Aquired User",
        type: "Account"
      })
    ], core)({ id: id || core.uuid(), specials: [ "save" ] });

  //bindMethods({ entity: user2, specials: [ "save" ] }); 

    // console.log("for", deviceID, "created user0", user);
    return user2;
  };

  ecs.declareType("user2", makeUser2, { details: "Promotion-Aquired User" });  

  return { makeUser2 };
};