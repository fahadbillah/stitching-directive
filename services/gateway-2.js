const { fetch } = require('cross-fetch')
const { createServer } = require('http');
const express = require('express');
const { ApolloServer, gql } = require('apollo-server-express');
const { makeExecutableSchema } = require('@graphql-tools/schema');
const { print, buildSchema } = require('graphql')
const { stitchSchemas } = require('@graphql-tools/stitch');
const { introspectSchema } = require('@graphql-tools/wrap')
const { stitchingDirectives } = require('@graphql-tools/stitching-directives')
const { stitchingDirectivesTransformer } = stitchingDirectives();

const buildContext = require('./context');

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
      // json.data.books = {...json.data.books}
      // if (json && json.data && json.data.books) {
      //     json.data.books.forEach((element, idx) => {
      //       console.log('+++++++++++++++++++++++++', typeof element);
      //       // json.data.books[idx] = new Object({ ...element })
      //     });
      // }
      console.log('*************************', JSON.stringify(json));
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

  const [
    // author, book, publisher, 
    division, district] = await Promise.all([
    // makeRemoteExecutor('http://localhost:3001/graphql'),
    // makeRemoteExecutor('http://localhost:3002/graphql'),
    // makeRemoteExecutor('http://localhost:3003/graphql'),
    makeRemoteExecutor('http://localhost:3004/graphql'),
    makeRemoteExecutor('http://localhost:3005/graphql'),
  ]);
  
  return  stitchSchemas({
    subschemaConfigTransforms: [stitchingDirectivesTransformer],
    subschemas: [
      // {
      //   schema: await fetchRemoteSchema(author),
      //   executor: author,
      // },
      // {
      //   schema: await fetchRemoteSchema(book),
      //   executor: book,
      // },
      // {
      //   schema: await fetchRemoteSchema(publisher),
      //   executor: publisher,
      // },
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

  // const schema = makeExecutableSchema({
  //   schema,
  //   plugins: [
  //     ApolloServerPluginLandingPageGraphQLPlayground(),
  //   ],
  // });

  const server = new ApolloServer({
    schema,
    context() {
      return {};
    },
  });
  await server.start();
  server.applyMiddleware({ app });

  const PORT = 3006;
  httpServer.listen(PORT, () =>
    console.log(`New gateway server is now running on http://localhost:${PORT}/graphql`)
  );
}

Promise.resolve(init()).catch((_reason) => {
  console.log('+++++++++++++++++++++++++', _reason);
});

// async function init(){
//   const schema = await getStitchedSchema();

//   app.register(mercurius, {
//     schema,
//     graphiql: true,
//     context: buildContext,
//     // errorFormatter: (result) => {
//     //   // console.log('^^^^^^^^^^^^^^^^^^^^^^^^^', result);
//     // }
//   })

//   app.get('/', async function (req, reply) {
//     const query = '{ add(x: 2, y: 2) }'
//     return reply.graphql(query)
//   })

//   app.listen(3000)
// }


// Promise.resolve(init()).catch((_reason) => {
//   console.log('+++++++++++++++++++++++++', _reason);
// });
