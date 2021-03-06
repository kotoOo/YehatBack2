module.exports = (core, ecs) => {
  return {    
    ...require("./logRecord0")(core, ecs),
    ...require("./owner0")(core, ecs),
    ...require("./directIOModInterface")(core, ecs),
    ...require("./user0")(core, ecs),
    ...require("./stat0")(core, ecs),
    ...require("./user2")(core, ecs),
  };
};