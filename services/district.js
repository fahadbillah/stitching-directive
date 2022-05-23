// const Fastify = require('fastify')
// const mercurius = require('mercurius')
const { createServer } = require('http');
const express = require('express');
const { ApolloServer, gql } = require('apollo-server-express');
const { ApolloServerPluginLandingPageLocalDefault } = require('apollo-server-core');
const { makeExecutableSchema } = require('@graphql-tools/schema');
const { stitchingDirectives } = require('@graphql-tools/stitching-directives');
const { stitchingDirectivesTypeDefs, stitchingDirectivesValidator } = stitchingDirectives();

const buildContext = require('./context');

// const app = Fastify()

const districts = [
  {
    id: "1",
    name: 'Dhaka',
    divisionId: "1",
  },
  {
    id: "2",
    name: 'Gazipur',
    divisionId: "1",
  },
  {
    id: "3",
    name: 'Chittagong',
    divisionId: "2",
  },
  {
    id: "4",
    name: 'CoxsBazar',
    divisionId: "2",
  },
  {
    id: "5",
    name: 'Rajshahi',
    divisionId: "3",
  },
  {
    id: "6",
    name: 'Rongpur',
    divisionId: "3",
  },
]

const typeDefs = `
${stitchingDirectivesTypeDefs}
type District {
  id: ID
  name: String
  divisionId: ID
  division: Division
}

type Division {
  id: ID
}

type Query {
  """
  district(id: ID): District @merge(
    keyField: "id"
    keyArg: "id"
  )
  """
  _divisions(id: ID): [Division] @merge
  districts(ids: [ID]): [District] @merge(
    keyField: "id"
    keyArg: "ids"
    )
  _sdl: String!
  }
  `
  
  const resolvers = {
    District: {
      division: (district) => {
        console.log('*************************', district);
        // return district.divisionId;
        return {id: district.divisionId}
      }
    },
    // Division: {
    //   id: (root) => {
    //     console.log('&&&&&&&&&&&&&&&&&&&&&&&&&', root);
    //     return root.id
    //   }
    // },
    Query: {
      // district: async (_, args) => {
      //   let result = [];
      //   const { id } = args;
      //   console.log('@@@@@@@@@@@@@@@@@@@@@@@@@', _, args);
      //   // result = districts.find(district => district.divisionId === id)
      //   result = districts.filter(district => district.divisionId === id)
      //   console.log('#########################', result);
      //   return result;
      // },
      districts: async (_, args) => {
        let result = [];
        const { ids } = args;
        console.log('@@@@@@@@@@@@@@@@@@@@@@@@@', args);
        if (!ids) {
          return districts;
        }
        result = districts.filter(district => ids.includes(district.divisionId))
        console.log('#########################', result);
        return result;
      },
      _divisions: async (_, args) => {
        console.log('@@@@@@@@@@@_divisions@@@@@@@@@@@', _, args);
        return {};
      },
      _sdl: () => typeDefs
    }
  }
  
  
async function init () {
  const app = express();

  const httpServer = createServer(app);

  const schema = makeExecutableSchema({
    typeDefs,
    resolvers,
    playground: true,
    plugins: [
      ApolloServerPluginLandingPageLocalDefault(),
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

  const PORT = 3005;
  httpServer.listen(PORT, () =>
    console.log(`District server is now running on http://localhost:${PORT}/graphql`)
  );
}

Promise.resolve(init()).catch((_reason) => {
  console.log('+++++++++++++++++++++++++', _reason);
});