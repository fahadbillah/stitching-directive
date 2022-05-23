const Fastify = require('fastify')
const mercurius = require('mercurius')
const { makeExecutableSchema } = require('@graphql-tools/schema');
const { stitchingDirectives } = require('@graphql-tools/stitching-directives')
const { stitchingDirectivesTypeDefs, stitchingDirectivesValidator } = stitchingDirectives();

const buildContext = require('./context');


const app = Fastify()

const authors = [
  {
    id: "1",
    name: 'Jules Verne'
  },
  {
    id: "2",
    name: 'H. G. Wells'
  },
  {
    id: "3",
    name: 'Arthur C. Clarke'
  },
]

/*
    books: [Book]


  type Book @key(selectionSet: "{ id }") {
    id: ID
    author: Author
  }

    _books(keys: [ID]): [Book] @merge(keyField: "id")
    _book(id: ID): Book @merge(keyField: "id")
*/

const typeDefs = `
  ${stitchingDirectivesTypeDefs}

  scalar _Key

  type Author {
    id: ID
    name: String
    books: [Book]
  }

  type Book @key(selectionSet: "{ books { id, authorId } }") {
    authorId: ID
  }

  type Query {
    author(id: ID): Author @merge(keyField: "id")
    authors(ids: [ID]): [Author] @merge(
      keyField: "id"
      keyArg: "ids"
    )
    _books(ids: [_Key]): [Book] @merge
    _sdl: String!
  }
`

const resolvers = {
  Author: {
    books: (author) => {
      console.log('+++++++++++++++++++++++++', author);
      return [{ authorId: author.id }]
      // return { authorId: author.id }
      // return [{id: author.id}] // authors.filter(review => review.authorId === book.id)
    },
  },
  Book: {
    authorId: (author) => {
      console.log('$$$$$$$$$$$$$$$$$$$$$$$$$', author);
      return author.authorId;
      // return [{ authorId: author.authorId }]
    }
  },
  Query: {
    // author: async (_, args) => {
    //   const { id } = args;
    //   return authors.find(author => author.id === id)
    // },
    authors: async (_, args) => {
      const { ids } = args;
      if (!ids) {
        return authors;
      }
      const result = authors.filter(author => ids.includes(author.id))
      console.log('!!!!!!!!!!!!!!!!!!!!!!!!!', args, result);
      return result
    },
    _books: (_root, {ids}) => {
      console.log('^^^^^^^^^^^^^^^^^^^^^^^^^', _root, ids);
      return ids;
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

  app.listen(3001)
}


Promise.resolve(init()).catch((_reason) => {
  console.log('+++++++++++++++++++++++++', _reason);
});