module.exports = (core, ecs) => {
  return {
    ...require("./logRecord0")(core, ecs),
    ...require("./user0")(core, ecs),
    ...require("./stat0")(core, ecs)
  };
};