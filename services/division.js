const { createServer } = require('http');
const express = require('express');
const { ApolloServer, gql } = require('apollo-server-express');
const { ApolloServerPluginLandingPageGraphQLPlayground } = require('apollo-server-core');
const { makeExecutableSchema } = require('@graphql-tools/schema');
const { stitchingDirectives } = require('@graphql-tools/stitching-directives');
const { stitchingDirectivesTypeDefs, stitchingDirectivesValidator } = stitchingDirectives();

const divisions = [
  {
    id: "1",
    name: 'Dhaka',
  },
  {
    id: "2",
    name: 'Chittagong',
  },
  {
    id: "3",
    name: 'Rajshahi',
  },
]

const typeDefs = `
  ${stitchingDirectivesTypeDefs}

  type Division {
    id: ID
    name: String
    districts: [District]
  }

  type District {
    id: ID
  }

  type Query {
    """ 
    division: [Division] @merge(
      keyField: "id"
      keyArg: "ids"
    )
    _districts(id: ID): [District] @merge
    """
    divisions(ids: [ID]): [Division] @merge(
      keyField: "id"
      keyArg: "ids"
    ) 
    _sdl: String!
  }
`

const resolvers = {
  Division: {
    districts: (division) => {
      console.log('*************************', division);
      return [{id: division.id}]
    }
  },
  District: {
    id: (root) => {
      console.log('&&&&&&&&&&&&&&&&&&&&&&&&&', root);
      return root.id
    }
  },
  Query: {
    // division: async (_, args) => {
    //   console.log('$$$$$$$$$$$$$$$$$$$$$$$$$', args);
    //   return divisions.find(division => division.id = args.id)
    // },
    divisions: async (_, args) => {
      console.log('@@@@@@@@@@@@@@@@@@@@@@@@@', _, args);
      let result = [];
      const { ids } = args;
      if (!ids) {
        return divisions;
      }
      result = divisions.filter(division => ids.includes(division.id))
      console.log('#########################', result);
      return result;
    },
    // _districts: async (_, args) => {
    //   console.log('@@@@@@@@@@@_districts@@@@@@@@@@@', _, args);
    //   return {};
    // },
    _sdl: () => typeDefs
  }
}

  
  
async function init () {
  const app = express();

  const httpServer = createServer(app);

  const schema = makeExecutableSchema({
    typeDefs,
    resolvers,
    plugins: [
      ApolloServerPluginLandingPageGraphQLPlayground(),
    ],
  });

  const server = new ApolloServer({
    schema,
    context() {
      // lookup userId by token, etc.
      return {};
    },
  });
  await server.start();
  server.applyMiddleware({ app });

  const PORT = 3004;
  httpServer.listen(PORT, () =>
    console.log(`Division server is now running on http://localhost:${PORT}/graphql`)
  );
}

Promise.resolve(init()).catch((_reason) => {
  console.log('+++++++++++++++++++++++++', _reason);
});