module.exports = (core, ecs) => {
  const log = core.makeLog("events0");

  const ioEnter = ({ name, eventID, code }, { socket, userID, sessionID }) => {
    const { deviceID } = socket.data;
    if (!deviceID) return { code: "YB-E-EV-00", details: "YB-E-EV-00 -- Too early enter attempt." };
    if (!name) return { code: "YB-E-EV-03", details: "YB-E-EV-03 -- Empty name." };

    const { makeUser2 } = core.treasure;
    try {
      const user2 = makeUser2({ socketID: socket.id, deviceID, eventID, code, name });
      console.log("user2 created", user2);
      user2.save();

      let c = 0;
      Object.values(ecs.root).filter(item => {
        return item.user2 && item.user2.eventID == eventID && item.id != user2.id &&
          item.user2pos.dt >= +new Date() - 60*5;
      }).map(item => {
        if (!item.user2.name) {
          console.log("skipped", item.id, "empty name", item);
          return;
        }

        c++;
        socket.emit("u2j", { id: item.id, name: item.user2.name });
      });

      console.log(`${c} users in the room at start.`);

      socket.join(eventID);
      socket.to(eventID).emit("u2j", { id: user2.id, name });

      return {
        code: "ok",
        entity: user2
      };
    } catch(e) {
      log(`ioEnter error`, e);
      return { code: "YB-E-EV-01", details: e.message };
    }    
  };

  const ioMove = ({ id, d }, { socket, userID, sessionID }) => {
    const userQ = core.db.entities(function() {
      const item = this;
      return item.id == id && item.user2pos;
    }).get();
    if (!userQ.length) {
      return {
        code: "YB-E-EV-02", details: "YB-E-EV-02 -- User not found."
      };
    }

    const user = userQ[0];
    user.user2pos.pos = [
      d[0], d[1], d[2]
    ];
    user.user2pos.dir = d[3];
    user.user2pos.dt = +new Date();

    socket.to(user.user2.eventID).emit("u2p", { id, d });

    return { code: "ok" };
  };

  const disconnected = ({ socket }) => {
    const { deviceID } = socket.data;    

    let c = 0;
    Object.values(ecs.root).filter(item => {
      return item.user2 && !!~item.user2.deviceIDs.indexOf(deviceID);
    }).map(item => {
      //c++;
      //socket.emit("u2j", { id: item.id, name: item.user2.name });
      c++;
      socket.to(item.user2.eventID).emit("u2l", { id: item.id });
    });

    console.log("Disconnected! Instanced has left: ", c);
  };

  const ioSetStage = ({ eventID, stageIndex }, { socket }) => {
    socket.to(eventID).emit("pre0stage", { stageIndex });
  };

  return { ioEnter, ioMove, disconnected, ioSetStage };
};