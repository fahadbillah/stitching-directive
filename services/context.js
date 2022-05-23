/**
 * Copyright 2021 Design Barn Inc.
 */

//  const { FastifyContext } = require('fastify');

 const buildContext = async (_req, _reply) => {
  //  let {
  //    headers: { authtoken: authToken, cookie },
  //  } = _req;
 
  //  if (!cookie) {
  //    if (!authToken) {
  //      throw new Error('Neither cookie nor authToken is provided');
  //    }
  //    cookie = `ory_kratos_session=${authToken}`;
  //  }
  console.log('~~~~~~~~~~~~~~~~~~~~~~~~~', _req.body);
 
   const context = {};
 
   return context;
 };
 
 module.exports = buildContext;
