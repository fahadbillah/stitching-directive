
const Fastify = require('fastify')
const mercurius = require('mercurius')
const { fetch } = require('cross-fetch')
const { print, buildSchema } = require('graphql')
const { stitchSchemas } = require('@graphql-tools/stitch');
const { introspectSchema } = require('@graphql-tools/wrap')
const { stitchingDirectives } = require('@graphql-tools/stitching-directives')
const { stitchingDirectivesTransformer } = stitchingDirectives();

const buildContext = require('./context');

const app = Fastify()

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
      console.log('*************************', json);
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

  const [author, book, publisher, division, district] = await Promise.all([
    makeRemoteExecutor('http://localhost:3001/graphql'),
    makeRemoteExecutor('http://localhost:3002/graphql'),
    makeRemoteExecutor('http://localhost:3003/graphql'),
    makeRemoteExecutor('http://localhost:3004/graphql'),
    makeRemoteExecutor('http://localhost:3005/graphql'),
  ]);
  
  return  stitchSchemas({
    subschemaConfigTransforms: [stitchingDirectivesTransformer],
    subschemas: [
      {
        schema: await fetchRemoteSchema(author),
        executor: author,
      },
      {
        schema: await fetchRemoteSchema(book),
        executor: book,
      },
      {
        schema: await fetchRemoteSchema(publisher),
        executor: publisher,
      },
      // {
      //   schema: await fetchRemoteSchema(division),
      //   batch: true,
      //   merge: {
      //     // Type1: { ... built from SDL directives },
      //     // Type2: { ... built from SDL directives },
      //     District: {
      //       // entryPoints: [{
      //       //   selectionSet: '{ id }',
      //       //   fieldName: 'districts',
      //       //   key: ({ id }) => ({ id }),
      //       //   argsFromKeys: (ids) => ({ ids }),
      //       // }, 
      //       // {
      //       //   selectionSet: '{ id }',
      //       //   fieldName: 'productsByKey',
      //       //   key: ({ id }) => ({ id }),
      //       //   argsFromKeys: (keys) => ({ keys }),
      //       // }],
      //     }
      //   }
      // },
      {
        schema: await fetchRemoteSchema(division),
        executor: division,
      },
      // {
      //   schema: await fetchRemoteSchema(district),
      //   executor: district,
      // }
    ]
  });
}

async function init(){
  const schema = await getStitchedSchema();

  app.register(mercurius, {
    schema,
    graphiql: true,
    context: buildContext,
    // errorFormatter: (result) => {
    //   // console.log('^^^^^^^^^^^^^^^^^^^^^^^^^', result);
    // }
  })

  app.get('/', async function (req, reply) {
    const query = '{ add(x: 2, y: 2) }'
    return reply.graphql(query)
  })

  app.listen(3000)
}


Promise.resolve(init()).catch((_reason) => {
  console.log('+++++++++++++++++++++++++', _reason);
});

/*
stitchSchemas({
    subschemas: [
      {
        // 1. Introspect a remote schema. Simple, but there are caveats:
        // - Remote server must enable introspection.
        // - Custom directives are not included in introspection.
        schema: await introspectSchema(productsExec, adminContext),
        executor: productsExec,
      },
      {
        // 2. Manually fetch a remote SDL string, then build it into a simple schema.
        // - Use any strategy to load the SDL: query it via GraphQL, load it from a repo, etc.
        // - Allows the remote schema to include custom directives.
        schema: buildSchema(await fetchRemoteSDL(storefrontsExec, adminContext)),
        executor: storefrontsExec,
      },
      {
        // 3. Integrate a schema that conflicts with another schema.
        // Let's pretend that "Rainforest API" executor talks to an API that
        // we don't control (say, a product database named after a rainforest...),
        // and the naming in this third-party API conflicts with our schemas.
        // In this case, transforms may be used to integrate the third-party schema
        // with remapped names (and/or numerous other transformations).
        schema: await introspectSchema(rainforestApiExec, adminContext),
        executor: rainforestApiExec,
        transforms: [
          new RenameTypes((name) => `Rainforest${name}`),
          new RenameRootFields((op, name) => `rainforest${name.charAt(0).toUpperCase()}${name.slice(1)}`),
        ]
      },
      {
        // 4. Incorporate a locally-executable subschema.
        // No need for a remote executor!
        // Note that that the gateway still proxies through
        // to this same underlying executable schema instance.
        schema: localSchema
      }
    ],
    // 5. Add additional schema directly into the gateway proxy layer.
    // Under the hood, `stitchSchemas` is a wrapper for `makeExecutableSchema`,
    // and accepts all of its same options. This allows extra type definitions
    // and resolvers to be added directly into the top-level gateway proxy schema.
    typeDefs: 'type Query { heartbeat: String! }',
    resolvers: {
      Query: {
        heartbeat: () => 'OK'
      }
    }
  });
*/