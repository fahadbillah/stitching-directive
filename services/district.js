const { createServer } = require('http');
const express = require('express');
const { ApolloServer } = require('apollo-server-express');
const { makeExecutableSchema } = require('@graphql-tools/schema');
const { stitchingDirectives } = require('@graphql-tools/stitching-directives');
const { stitchingDirectivesTypeDefs, stitchingDirectivesValidator } = stitchingDirectives();

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
  districts(ids: [ID]): [District] @merge(
    keyField: "id"
    keyArg: "ids"
    )
    _sdl: String!
  }
  `
  
  const resolvers = {
    District: {
      division: (district) => ({id: district.divisionId})
    },
    Query: {
      districts: async (_, { ids }) => {
        if (!ids) {
          return districts;
        }
        return districts.filter(district => ids.includes(district.divisionId))
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
    });
    
    const server = new ApolloServer({
      schema
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