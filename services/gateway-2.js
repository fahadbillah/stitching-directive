const { fetch } = require('cross-fetch')
const { createServer } = require('http');
const express = require('express');
const { ApolloServer, gql } = require('apollo-server-express');
const { print, buildSchema } = require('graphql')
const { stitchSchemas } = require('@graphql-tools/stitch');
const { stitchingDirectives } = require('@graphql-tools/stitching-directives')
const { stitchingDirectivesTransformer } = stitchingDirectives();

async function makeRemoteExecutor (gqlEndpoint) {
  return async ({ document, variables }) => {
    let json = null;
    try {
      const query = typeof document === 'string' ? document : print(document);
      const fetchResult = await fetch(gqlEndpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query, variables }),
      });
      json = await fetchResult.json();
    } catch (error) {
      console.error(error, 'Error from authEndpoint!');
    }

    return json;
  };
}

async function fetchRemoteSchema(executor) {
  const { data } = await executor({ document: `{ _sdl }` });
  return buildSchema(data._sdl);
}

async function getStitchedSchema(){

  const [division, district] = await Promise.all([
    makeRemoteExecutor('http://localhost:3004/graphql'),
    makeRemoteExecutor('http://localhost:3005/graphql'),
  ]);
  
  return  stitchSchemas({
    subschemaConfigTransforms: [stitchingDirectivesTransformer],
    subschemas: [
      {
        schema: await fetchRemoteSchema(division),
        executor: division,
      },
      {
        schema: await fetchRemoteSchema(district),
        executor: district,
      }
    ]
  });
}

async function init () {
  const app = express();

  const httpServer = createServer(app);
  const schema = await getStitchedSchema();

  const server = new ApolloServer({
    schema
  });
  await server.start();
  server.applyMiddleware({ app });

  const PORT = 3006;
  httpServer.listen(PORT, () =>
    console.log(`Gateway server is now running on http://localhost:${PORT}/graphql`)
  );
}

Promise.resolve(init()).catch((_reason) => {
  console.log('+++++++++++++++++++++++++', _reason);
});
