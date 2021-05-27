module.exports = (core, ecs) => {
  const noAck = () => {};
  const makeDirectIOModInterface = ({ socket }) => 
    ([ cmd, props = {}, ack = noAck ], next) => {
      console.log("[DirectIOModInterface]", cmd, props, ack == noAck ? "No Ack function!" : "");
      if (typeof cmd != "string") return next();
      if (typeof props != "object") return next();

      let [ mod, method ] = cmd.split(".");
      if (!method) {  /* assume if there's no mod name passed, it is defaulted to "main0" */
        method = mod;
        mod = "main0";
      }

      const reply = (a) => {
        if (fn) {
          return fn(a);
        } else {
          console.log("[DirectIOModInterface] No acknoledgement passed for", cmd, socket.id);
        }
      };

      /* Mod exists? */
      const theMod = core.mods[mod];
      if (!theMod) {
        console.log(`[DirectIOModInterface] Mod ${mod} not found for command ${cmd} socketID ${socket.id}.`)
        return next();
      }

      /* Method exists? */
      const meth = `io${core.capitalize(method)}`; /* To expose a method, a MOD must implement the corresponding 
                                                      function, named "io" + core.capitalize(<method_name>). 
                                                      Literally, "io" PLUS METHOD NAME CAPITALIZED.

                                                      Ex.: To support method "deviceID", MOD [main0] implements
                                                      function "ioDeviceID".  */

      if (!theMod[meth] || (typeof theMod[meth] != 'function')) {
        console.log(`[DirectIOModInterface] Mod ${mod} ain't support method "${method}" for command ${cmd} socketID ${socket.id}.`)
        // console.log(`theMod`, theMod, '.method', theMod[method]);
        return next();
      }

      try {
        const output = theMod[meth]({ ...props, socket }); /* <= should pass basic user data here already! */
        if (ack) ack(output);

      } catch(e) {
        if (ack) ack({ code: "error", details: e.message });

        console.log(`[DirectIOModInterface] Failure at MOD ${mod} METHOD "${method}"`, e); 
      }

      next();
    };

  return {
    makeDirectIOModInterface
  };
};