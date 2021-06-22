module.exports = (core, ecs) => {
  const log = core.makeLog("main0");

  const ioDeviceID = ({ deviceID, userObject, yehatPass }, { socket }, c) => {
    log("ioDeviceID", deviceID, userObject, socket, yehatPass);

    if (!core.log0) {
      log("Panic, core.log0 down.");
    }
    
    //console.log("1");
    const now = +new Date();    
    if (core.log0) core.log0({ deviceID, name: "deviceID-report-01", socket });
    
    socket.data = {
      ...socket.data,
      deviceID,
      pathPoints: 0
    };


    if (!core.userFromDeviceID) {
      log("Panic, core.userFromDeviceID down.");
    }

    /* We are to locate onlineStat0 which we want to update. */
    /* As we see, it is not available at the point of mod loaded. But we are
    now in the handler of DIOMI protocol! No worries, it will be loaded before the
    first message starts to be piped though here. */
    /* ...but how do I get to there? =^_^= */
    log("Trying to locate onlineStat0...");
    const onlineStat0 = ecs.root["591191f9-ce0c-4d42-9263-aa86e8b83507"];

    if (onlineStat0) {
      console.log("onlineStat0 located:", onlineStat0);
    } else {
      log("Panic, onlineStat0 can't be located.");
    } 

    const user = core.userFromDeviceID(deviceID);
    if (user) {
      socket.data.userID = user.id;
      socket.data.sessonID = core.uuid();

      if (user.type == 'user0' && userObject && userObject.first_name != undefined) {
        core.treasure.upgradeUser0ToUser1(user, userObject);
      }
      
      if (user.type == "user1") {
        log(`Connected user ${user.user0.name} (${user.id})`);
      } else {
        log("Connected user: by deviceID", user.id, user.type);
      }
      user.user0.sessionID = socket.data.sessonID;
      user.user0vtm.socketID = socket.id;
      user.user0vtm.dtSessionStart = now;
      user.user0vtm.dtLastActivity = now;
      user.user0vtm.online = true;
      user.save();

      if (onlineStat0) {
        onlineStat0.stat0.value.guest--;
        onlineStat0.stat0.value.user++;
      }
    } else {
      /* create user based on userObject */
      if (userObject && userObject.first_name != undefined) {
        const user1 = core.treasure.makeUser1({ deviceID, socketID: socket.id, userObject });
        console.log("makeUser1", user1);
        user1.save();
        core.log0({ name: "user-created", type: "user1", deviceID, userID: user0.id, svTime: SVTime(), uptime: UpTime() });

        if (onlineStat0) {
          onlineStat0.stat0.value.guest--;
          onlineStat0.stat0.value.user++;
        }
      } else {
        const user0 = core.treasure.makeUser0({ deviceID, socketID: socket.id, userID: userObject.user_name });
        user0.save();
        core.log0({ name: "user-created", type: "user0", deviceID, userID: user0.id, svTime: SVTime(), uptime: UpTime() });
        if (onlineStat0) {
          onlineStat0.stat0.value.guest--;
          onlineStat0.stat0.value.user++;
        }
      }
      // reply({ code: "ok", user0 });
    }    
  };

  const ioSaveEntity = ({ entity = {}, access = "private" }, { socket, userID, sessionID }) => {
    console.log("=> save entity", entity, userID, sessionID);

    if (!entity.id) entity.id = core.uuid();

    const exists = core.db.entities({ id: entity.id }).get().length;

    console.log("..:", exists ? "Exists" : "Doesn't Exist");
    const { owner0 } = ecs.compo;
    if (!exists) {
      const item = {
        ...entity,
        ...owner0({ userID, access })
      };
      core.db.entities.insert(item);
    }

    return { code: "ok", id: entity.id };
  };

  const ioByOwner = ({ userID: lookForUserID_ = null }, { socket, userID, sessionID }) => {
    /* returns entities by owner */
    const lookForUserID = lookForUserID_ ? lookForUserID_ : userID; /* Default: MINE */

    const entities = core.db.entities({ owner0: { userID: lookForUserID } }).get();
    return { code: "ok", entities };
  };

  const ioUpdate = ({ id, ...rest }, { socket, userID, sessionID }) => {
    /* let's find out what is this */
    const inDB = core.db.entities({ id }).get()[0];
    const now = core.time();

    if (inDB) {
      if (
        inDB.owner0 && inDB.owner0.userID == userID || /* Update my own entity */
        inDB.owner0 && inDB.owner0.access == "public" /* Update public entity */
      ) {        
        const dto = { ...ecs.compo.owner0({ userID }), ...rest };
        dto.owner0.dtModified = now;        
        core.db.entities({ id }).update(dto);
        return { code: "ok" };
      } else {
        return { code: "fail", details: "No access." };
      }
    } else {
      return { code: "fail", details: "No exists." };
    }
  };

  const ioGetPublicRoot = ({}, { socket, userID, sessionID }) => {
    const entities = core.db.entities({ 
      owner0: { access: "public" }, 
      located: { rel: null } 
    }).get();

    return { code: "ok", entities };
  };

  return {
    ioDeviceID, ioSaveEntity, ioByOwner, ioUpdate, ioGetPublicRoot
  };
};