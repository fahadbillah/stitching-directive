const Fastify = require('fastify')
const mercurius = require('mercurius')
const { makeExecutableSchema } = require('@graphql-tools/schema');
const { stitchingDirectives } = require('@graphql-tools/stitching-directives');
const { stitchingDirectivesTypeDefs, stitchingDirectivesValidator } = stitchingDirectives();

const buildContext = require('./context');

const app = Fastify()

const books = [
  {
    id: "1",
    title: 'Journey to the Center of the Earth',
    year: 1864,
    authorId: "1",
    publisherId: "1",
  },
  {
    id: "2",
    title: 'Twenty Thousand Leagues Under the Sea',
    year: 1870,
    authorId: "1",
    publisherId: "1",
  },
  {
    id: "3",
    title: 'Around the World in Eighty Days',
    year: 1873,
    authorId: "1",
    publisherId: "2",
  },
  {
    id: "4",
    title: 'The Time Machine',
    year: 1895,
    authorId: "2",
    publisherId: "3",
  },
  {
    id: "5",
    title: 'The War of the Worlds',
    year: 1998,
    authorId: "2",
    publisherId: "3",
  },
  {
    id: "6",
    title: 'A Space Odyssey',
    year: 2001,
    authorId: "3",
    publisherId: "4",
  },
]

const typeDefs = `
  ${stitchingDirectivesTypeDefs}
  type Book {
    id: ID
    title: String
    year: Int
    authorId: ID
    author: Author
  }

  type Author {
    id: ID
    books: [Book]
  }

  type Query {
    book(id: ID): Author @merge(keyField: "authorId")
    books(ids: [ID], authorIds: [ID]): [Book] @merge(
      keyField: "authorId"
      keyArg: "authorIds"
    )
    _sdl: String!
  }
`

const resolvers = {
  Book: {
    author: (book) => {
      console.log('+++++++++++++++++++++++++', book);
      return {id: book.authorId}
    }
  },
  Author: {
    books: (author) => {
      const result = books.filter(book => book.authorId === author.id);
      console.log('^^^^^^^^^^^^^^^^^^^^^^^^^', author, result);
      return result;
    }
  },
  Query: {
    book: async (_, args) => {
      console.log('!!!!!!!!!!!!!!!!!!!!!!!!!', args, book);
      return books.filter(book => book.id = args.id)
    },
    books: async (_, args) => {
      let result = [];
      const { ids, authorIds } = args;
      if (!ids && !authorIds) {
        return books;
      }
      if (authorIds) {
        result = books.filter(book => authorIds.includes(book.authorId))
      } else {
        result = books.filter(book => ids.includes(book.id))
      }
      console.log('@@@@@@@@@@@@@@@@@@@@@@@@@', args, result);
      return result;
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

  app.listen(3002)
}


Promise.resolve(init()).catch((_reason) => {
  console.log('+++++++++++++++++++++++++', _reason);
});