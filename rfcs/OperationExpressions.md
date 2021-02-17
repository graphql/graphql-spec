# RFC: Operation Expressions

(WORKING TITLE!)

**Proposed by:** [Benjie Gillam](https://twitter.com/benjie) - Graphile

In the [Schema Coordinates RFC](./SchemaCoordinates.md) Mark introduced the
concept of "schema coordinates" which give a standard human- and
machine-readable way to unambiguously refer to entities within a GraphQL
schema: types, fields, field arguments, enum values, directives and directive
arguments. The scope of that RFC is deliberately very tight, and it serves that
goal well, providing a one-to-one mapping between the schema coordinates and
the schema entities.

This RFC is to gather feedback on expansions of the Schema Coordinate syntax
that could be used for different purposes whilst maintaining familiarity.

## Aim

The aim of this RFC is to give the GraphQL community a standard syntax that
people, tools and documentation can use to concisely and consistently reference
GraphQL operation concepts such as paths that is more fluid, expressive, and
contains more context than the Schema Coordinates RFC that this RFC builds on
top of.

This is not intended to be a replacement of the Schema Coordinates RFC, but an
extension to it for a number of additional use-cases.

## Use cases

#### Referencing a position within a GraphQL Operation Document

Imagine you have the following GraphQL query:

```graphql
{
  businesses: searchBusinesses(name: "Automotive") {
    id
    name
    owner: personByOwnerId {
      id
      name
      email # <<< HERE
    }
  }
}
```

You might reference the marked (`<<< HERE`) field with an expression such as:

- `Person.email` - this is the "schema coordinate" which uniquely identifies
  the field, but lacks context on how we retrieved it
- `>businesses>owner>email` - given the GraphQL query document, this is
  sufficient to uniquely identify this specific reference (caveat: duplicate
  fields would all be referenced with the same expression)
- `>businesses:searchBusinesses>owner:personByOwnerId>email` - this
  contains more context than the above, indicating not just the aliases but the
  actual field names too; with this access to the operation document is not
  required to determine what was requested
- `>businesses:searchBusinesses(name:)>owner:personByOwnerId>email` - this
  contains even more context (the argument names that were used)

These are all valid operation expressions, but they each convey different levels
of context.

### Generating a GraphQL Operation Document quickly (Emmet-style)

> Emmet is a plugin for many popular text editors which greatly improves HTML &
> CSS workflow:

Emmet is a popular syntax for quickly generating HTML/CSS. It's easy to imagine
how a operation expression syntax could be combined with a GraphQL schema
definition to quickly generate GraphQL queries, mutations and subscriptions
with a concise syntax. For example the expression:

`>businesses:searchBusinesses(name:)>owner:personByOwnerId>email`

might expand to:

```graphql
query ($name: String!) {
  businesses: searchBusinesses(name: $name) {
    owner: personByOwnerId {
      email
    }
  }
}
```

`MyFragment:User.businesses>owner>email`

might expand to:

```graphql
fragment MyFragment on User {
  businesses {
    owner { email }
  }
}
```

### Documentation Permalinks

When navigating the GraphiQL documentation, GraphiQL maintains a stack of the
path you arrived to the current documentation page through. It could be
valuable to store this into the query string such that you could share a
"documentation stack" with someone else (or bookmark it). For example if you
browsed through the documentation via:

- `User` type
- `User.friends` field (returns a `User`)
- `User.latestMedia` field (returns a `Media` union)
- `Post` type in Media union
- `title` field

you might use a query string such as:

```
?docs=User.friends>latestMedia>Post.title
```

### Linking from a field description to an operation path

If, for example, you were to deprecate a root-level field in your schema, you
might want to indicate where the user can retrieve the equivalent data now. You
could do this by including an operation expression as part of the deprecation
reason:

> The `Query.branchesFromFork` field is being removed; please use the following
> path instead: `Query>repositories>forks>branches`

### Indicating how to access a particular field

When reading the documentation of a type in GraphiQL it currently does not
indicate how to reach a particular field. Though there are often infinitely
many paths to reach a field, often the shortest are the most valuable, so
GraphiQL could indicate a few of the shorter paths using operation expression
syntax:

> `User.firstName` can be accessed through paths such as:
>
> - `>me>firstName`
> - `>articles>author>firstName`
> - `>searchMedia>Book.author>firstName`
> - `mutation>createUser>user>firstName`

### Analytics

When analysing how a GraphQL schema is used, it may be useful to track
statistics for each type, field, argument using Schema Coordinates; but it may
also be interesting to track through what paths users are finding said fields.
You could use operation expression syntax to track this:

```
counters['Query.cities>libraries>findBook(isbn:)']++
```

## Syntax

Syntax is in flux; but here's some thoughts:

#### Pathing

Following a path from one field to the next could use the `>` character; this
is already used in Apollo's GraphQL documentation browser and is intuitive for
navigation. This leaves `.` available and non-ambiguous for referring to fields
on a type, which is useful when disambiguating references on a union type, for
instance:

```
>me>media>Film.duration
```

might model:

```graphql
{ me { media { ... on Film { duration } } } }
```

#### Operations

The expression `>me>name` would expand to `{ me { name } }`.

If you want to create a mutation or subscription operation, you can prefix the
path with the operation type (you can do this for queries too, but just like in
operation documents, the query keyword is optional):

- `mutation>createUser>user>name` expands to `mutation ($input: CreateUserInput!) { createUser(input: $input) { user { name } } }`
- `subscription>currentUserUpdated>name` expands to `subscription { currentUserUpdated { name } }`
- `query>me>name` expands to `query { me { name } }`

You may name operations by prefixing with an operation name followed by a
colon; for example `MyName:>me>name` expands to `query MyName { me { name } }`.

#### Fragments

Fragments start with a type name followed by a period: `User.friends>name`
expands to `... on User { friends { name } }`. You can name fragments by
prefixing with a fragment name and a colon: `FriendNames:User.friends>name`
expands to `fragment FriendNames on User { friends { name } }`.

#### Arguments

Arguments use the same syntax as Schema Coordinates; namely parenthesis and a
colon: `>searchBusinesses(name:)>city`.

We also allow you to reference input objects used in arguments, for example:

`>searchBusinesses(where.size.greaterThan:)>city`

expands to something like:

```graphql
query ($whereSizeGreaterThan: Int) {
  searchBusinesses(where: { size: { greaterThan: $whereSizeGreaterThan } }) {
    city
  }
}
```
