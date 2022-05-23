const { createServer } = require('http');
const express = require('express');
const { ApolloServer } = require('apollo-server-express');
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
      console.log('@@@@@@@@@@@@@@@@@@@@@@@@@', division);
      return [{id: division.id}]
    }
  },
  Query: {
    // division: async (_, args) => {
    //   return divisions.find(division => division.id = args.id)
    // },
    divisions: async (_, args) => {
      let result = [];
      const { ids } = args;
      if (!ids) {
        return divisions;
      }
      result = divisions.filter(division => ids.includes(division.id))
      return result;
    },
    _sdl: () => typeDefs
  }
}

  
  
async function init () {
  const app = express();

  const httpServer = createServer(app);

  const schema = makeExecutableSchema({
    typeDefs,
    resolvers
  });

  const server = new ApolloServer({
    schema
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