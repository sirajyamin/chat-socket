const { resolvers } = require("./resolvers");
const { typedefs } = require("./typedefs");
const { model } = require("./models/message");
const { datasource } = require("./datasource");
const { mutations } = require("./mutations");
const { queries } = require("./queries");

module.exports.Chat = {
  resolvers,
  typedefs,
  model,
  datasource,
  mutations,
  queries,
};
