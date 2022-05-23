const Fastify = require('fastify')
const mercurius = require('mercurius')
const { makeExecutableSchema } = require('@graphql-tools/schema');
const { stitchingDirectives } = require('@graphql-tools/stitching-directives')
const { stitchingDirectivesTypeDefs, stitchingDirectivesValidator } = stitchingDirectives();

const buildContext = require('./context');

const app = Fastify()

const publishers = [
  {
    id: "1",
    name: 'Pierre-Jules Hetzel',
  },
  {
    id: "2",
    name: 'Le Temps',
  },
  {
    id: "3",
    name: 'William Heinemann',
  },
  {
    id: "4",
    name: 'Hutchinson',
  },
]

const typeDefs = `
  ${stitchingDirectivesTypeDefs}
  type Publisher {
    id: ID
    name: String
    books: [Book]
  }
  type Book {
    id: ID
  }
  type Query {
    publishers(ids: [ID]): [Publisher]
    _sdl: String!
  }
`;

const resolvers = {
  Publisher: {
    books: (publisher) => {
      console.log('!!!!!!!!!!!!!!!!!!!!!!!!!', publisher);
      return [{id: publisher.id}]
    }
  },
  Query: {
    publishers: async (_, { ids }) => {
      if (!ids) {
        return publishers;
      }
      return publishers.filter(author => ids.includes(author.id))
    },
    _sdl: () => typeDefs
  }
}

async function init(){
  const schema = makeExecutableSchema({
    schemaTransform: [stitchingDirectivesValidator],
    typeDefs,
    resolvers,
  })
  app.register(mercurius, {
    schema,
    graphiql: true,
    context: buildContext,
  })

  app.listen(3003)
}


Promise.resolve(init()).catch((_reason) => {
  console.log('+++++++++++++++++++++++++', _reason);
});