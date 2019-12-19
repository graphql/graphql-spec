# GraphQL

The GraphQL specification is edited in the markdown files found in [`/spec`](./spec)
the latest release of which is published at https://facebook.github.io/graphql/.

The latest draft specification can be found at https://facebook.github.io/graphql/draft/
which tracks the latest commit to the master branch in this repository.

Previous releases of the GraphQL specification can be found at permalinks that
match their [release tag](https://github.com/facebook/graphql/releases). For
example, https://facebook.github.io/graphql/October2016/. If you are linking
directly to the GraphQL specification, it's best to link to a tagged permalink
for the particular referenced version.

## Overview

This is a Working Draft of the Specification for GraphQL, a query language for APIs created by Facebook.

The target audience for this specification is not the client developer, but those who have,
or are actively interested in, building their own GraphQL implementations and
tools.

In order to be broadly adopted, GraphQL will have to target a wide
variety of backends, frameworks, and languages, which will necessitate a
collaborative effort across projects and organizations. This specification serves as a point of coordination for this effort.

Looking for help? Find resources [from the community](https://graphql.org/community/).

## Getting Started

GraphQL consists of a type system, query language and execution semantics,
static validation, and type introspection, each outlined below. To guide you
through each of these components, we've written an example designed to
illustrate the various pieces of GraphQL.

This example is not comprehensive, but it is designed to quickly introduce
the core concepts of GraphQL, to provide some context before diving into
the more detailed specification or the [GraphQL.js](https://github.com/graphql/graphql-js)
reference implementation.

The premise of the example is that we want to use GraphQL to query for
information about characters and locations in the original Star Wars
trilogy.

### Type System

At the heart of any GraphQL implementation is a description of what types
of objects it can return, described in a GraphQL type system and returned
in the GraphQL Schema.

For our Star Wars example, the
[starWarsSchema.js](https://github.com/graphql/graphql-js/blob/master/src/__tests__/starWarsSchema.js)
file in GraphQL.js defines this type system.

The most basic type in the system will be `Human`, representing characters
like Luke, Leia, and Han. All humans in our type system will have a name,
so we define the `Human` type to have a field called "name". This returns
a String, and we know that it is not null (since all `Human`s have a name),
so we will define the "name" field to be a non-nullable String. Using a
shorthand notation that we will use throughout the spec and documentation,
we would describe the human type as:

```graphql
type Human {
  name: String
}
```

This shorthand is convenient for describing the basic shape of a type
system; the JavaScript implementation is more full-featured, and allows types
and fields to be documented. It also sets up the mapping between the
type system and the underlying data; for a test case in GraphQL.js, the
underlying data is a [set of JavaScript objects](https://github.com/graphql/graphql-js/blob/master/src/__tests__/starWarsData.js),
but in most cases the backing data will be accessed through some service, and
this type system layer will be responsible for mapping from types and fields to
that service.

A common pattern in many APIs, and indeed in GraphQL is to give
objects an ID that can be used to refetch the object. So let's add
that to our Human type. We'll also add a string for their home
planet.

```graphql
type Human {
  id: String
  name: String
  homePlanet: String
}
```

Since we're talking about the Star Wars trilogy, it would be useful
to describe the episodes in which each character appears. To do so, we'll
first define an enum, which lists the three episodes in the trilogy:

```graphql
enum Episode { NEWHOPE, EMPIRE, JEDI }
```

Now we want to add a field to `Human` describing what episodes they
were in. This will return a list of `Episode`s:

```graphql
type Human {
  id: String
  name: String
  appearsIn: [Episode]
  homePlanet: String
}
```

Now, let's introduce another type, `Droid`:


```graphql
type Droid {
  id: String
  name: String
  appearsIn: [Episode]
  primaryFunction: String
}
```

Now we have two types! Let's add a way of going between them: humans
and droids both have friends. But humans can be friends with both
humans and droids. How do we refer to either a human or a droid?

If we look, we note that there's common functionality between
humans and droids; they both have IDs, names, and episodes in which
they appear. So we'll add an interface, `Character`, and make
both `Human` and `Droid` implement it. Once we have that, we can
add the `friends` field, that returns a list of `Character`s.

Our type system so far is:

```graphql
enum Episode { NEWHOPE, EMPIRE, JEDI }

interface Character {
  id: String
  name: String
  friends: [Character]
  appearsIn: [Episode]
}

type Human implements Character {
  id: String
  name: String
  friends: [Character]
  appearsIn: [Episode]
  homePlanet: String
}

type Droid implements Character {
  id: String
  name: String
  friends: [Character]
  appearsIn: [Episode]
  primaryFunction: String
}
```

One question we might ask, though, is whether any of those fields can return
`null`. By default, `null` is a permitted value for any type in GraphQL,
since fetching data to fulfill a GraphQL query often requires talking
to different services that may or may not be available. However, if the
type system can guarantee that a type is never null, then we can mark
it as Non Null in the type system. We indicate that in our shorthand
by adding an "!" after the type. We can update our type system to note
that the `id` is never null.

Note that while in our current implementation, we can guarantee that more
fields are non-null (since our current implementation has hard-coded data),
we didn't mark them as non-null. One can imagine we would eventually
replace our hardcoded data with a backend service, which might not be
perfectly reliable; by leaving these fields as nullable, we allow
ourselves the flexibility to eventually return null to indicate a backend
error, while also telling the client that the error occurred.

```graphql
enum Episode { NEWHOPE, EMPIRE, JEDI }

interface Character {
  id: String!
  name: String
  friends: [Character]
  appearsIn: [Episode]
}

type Human implements Character {
  id: String!
  name: String
  friends: [Character]
  appearsIn: [Episode]
  homePlanet: String
}

type Droid implements Character {
  id: String!
  name: String
  friends: [Character]
  appearsIn: [Episode]
  primaryFunction: String
}
```

We're missing one last piece: an entry point into the type system.

When we define a schema, we define an object type that is the basis for all
queries. The name of this type is `Query` by convention, and it describes
our public, top-level API. Our `Query` type for this example will look like
this:

```graphql
type Query {
  hero(episode: Episode): Character
  human(id: String!): Human
  droid(id: String!): Droid
}
```

In this example, there are three top-level operations
that can be done on our schema:

 - `hero` returns the `Character` who is the hero of the Star Wars trilogy; it
takes an optional argument that allows us to fetch the hero of a specific
episode instead.
 - `human` accepts a non-null string as a query argument, a human's ID, and
returns the human with that ID.
 - `droid` does the same for droids.

These fields demonstrate another feature of the type system, the ability
for a field to specify arguments that configure their behavior.

When we package the whole type system together, defining the `Query` type
above as our entry point for queries, this creates a GraphQL Schema.

This example just scratched the surface of the type system. The specification
goes into more detail about this topic in the "Type System" section, and the [type](https://github.com/graphql/graphql-js/blob/master/src/type)
directory in GraphQL.js contains code implementing
a specification-compliant GraphQL type system.

### Query Syntax

GraphQL queries declaratively describe what data the issuer wishes
to fetch from whoever is fulfilling the GraphQL query.

For our Star Wars example, the
[starWarsQueryTests.js](https://github.com/graphql/graphql-js/blob/master/src/__tests__/starWarsQuery-test.js)
file in the GraphQL.js repository contains a number of queries and responses.
That file is a test file that uses the schema discussed above and a set of
sample data, located in
[starWarsData.js](https://github.com/graphql/graphql-js/blob/master/src/__tests__/starWarsData.js).
This test file can be run to exercise the reference implementation.

An example query on the above schema would be:

```graphql
query HeroNameQuery {
  hero {
    name
  }
}
```

The initial line, `query HeroNameQuery`, defines a query with the operation
name `HeroNameQuery` that starts with the schema's root query type; in this
case, `Query`. As defined above, `Query` has a `hero` field that returns a
`Character`, so we'll query for that. `Character` then has a `name` field that
returns a `String`, so we query for that, completing our query. The result of
this query would then be:


```json
{
  "hero": {
    "name": "R2-D2"
  }
}
```

Specifying the `query` keyword and an operation name is only required when a
GraphQL document defines multiple operations. We therefore could have written
the previous query with the query shorthand:

```graphql
{
  hero {
    name
  }
}
```

Assuming that the backing data for the GraphQL server identified R2-D2 as the
hero. The response continues to vary based on the request; if we asked for
R2-D2's ID and friends with this query:

```graphql
query HeroNameAndFriendsQuery {
  hero {
    id
    name
    friends {
      id
      name
    }
  }
}
```

then we'll get back a response like this:

```json
{
  "hero": {
    "id": "2001",
    "name": "R2-D2",
    "friends": [
      {
        "id": "1000",
        "name": "Luke Skywalker"
      },
      {
        "id": "1002",
        "name": "Han Solo"
      },
      {
        "id": "1003",
        "name": "Leia Organa"
      }
    ]
  }
}
```

One of the key aspects of GraphQL is its ability to nest queries. In the
above query, we asked for R2-D2's friends, but we can ask for more information
about each of those objects. So let's construct a query that asks for R2-D2's
friends, gets their name and episode appearances, then asks for each of *their*
friends.

```graphql
query NestedQuery {
  hero {
    name
    friends {
      name
      appearsIn
      friends {
        name
      }
    }
  }
}
```

which will give us the nested response

```json
{
  "hero": {
    "name": "R2-D2",
    "friends": [
      {
        "name": "Luke Skywalker",
        "appearsIn": ["NEWHOPE", "EMPIRE", "JEDI"],
        "friends": [
          { "name": "Han Solo" },
          { "name": "Leia Organa" },
          { "name": "C-3PO" },
          { "name": "R2-D2" }
        ]
      },
      {
        "name": "Han Solo",
        "appearsIn": ["NEWHOPE", "EMPIRE", "JEDI"],
        "friends": [
          { "name": "Luke Skywalker" },
          { "name": "Leia Organa" },
          { "name": "R2-D2" }
        ]
      },
      {
        "name": "Leia Organa",
        "appearsIn": ["NEWHOPE", "EMPIRE", "JEDI"],
        "friends": [
          { "name": "Luke Skywalker" },
          { "name": "Han Solo" },
          { "name": "C-3PO" },
          { "name": "R2-D2" }
        ]
      }
    ]
  }
}
```

The `Query` type above defined a way to fetch a human given their
ID. We can use it by hardcoding the ID in the query:

```graphql
query FetchLukeQuery {
  human(id: "1000") {
    name
  }
}
```

to get

```json
{
  "human": {
    "name": "Luke Skywalker"
  }
}
```

Alternately, we could have defined the query to have a query parameter:

```graphql
query FetchSomeIDQuery($someId: String!) {
  human(id: $someId) {
    name
  }
}
```

This query is now parameterized by `$someId`; to run it, we must provide
that ID. If we ran it with `$someId` set to "1000", we would get Luke;
set to "1002", we would get Han. If we passed an invalid ID here,
we would get `null` back for the `human`, indicating that no such object
exists.

Notice that the key in the response is the name of the field, by default.
It is sometimes useful to change this key, for clarity or to avoid key
collisions when fetching the same field with different arguments.

We can do that with field aliases, as demonstrated in this query:

```graphql
query FetchLukeAliased {
  luke: human(id: "1000") {
    name
  }
}
```

We aliased the result of the `human` field to the key `luke`. Now the response
is:

```json
{
  "luke": {
    "name": "Luke Skywalker"
  }
}
```

Notice the key is "luke" and not "human", as it was in our previous example
where we did not use the alias.

This is particularly useful if we want to use the same field twice
with different arguments, as in the following query:

```graphql
query FetchLukeAndLeiaAliased {
  luke: human(id: "1000") {
    name
  }
  leia: human(id: "1003") {
    name
  }
}
```

We aliased the result of the first `human` field to the key
`luke`, and the second to `leia`. So the result will be:

```json
{
  "luke": {
    "name": "Luke Skywalker"
  },
  "leia": {
    "name": "Leia Organa"
  }
}
```

Now imagine we wanted to ask for Luke and Leia's home planets. We could do so
with this query:

```graphql
query DuplicateFields {
  luke: human(id: "1000") {
    name
    homePlanet
  }
  leia: human(id: "1003") {
    name
    homePlanet
  }
}
```

but we can already see that this could get unwieldy, since we have to add new
fields to both parts of the query. Instead, we can extract out the common fields
into a fragment, and include the fragment in the query, like this:

```graphql
query UseFragment {
  luke: human(id: "1000") {
    ...HumanFragment
  }
  leia: human(id: "1003") {
    ...HumanFragment
  }
}

fragment HumanFragment on Human {
  name
  homePlanet
}
```

Both of those queries give this result:

```json
{
  "luke": {
    "name": "Luke Skywalker",
    "homePlanet": "Tatooine"
  },
  "leia": {
    "name": "Leia Organa",
    "homePlanet": "Alderaan"
  }
}
```

The `UseFragment` and `DuplicateFields` queries will both get the same result, but
`UseFragment` is less verbose; if we wanted to add more fields, we could add
it to the common fragment rather than copying it into multiple places.

We defined the type system above, so we know the type of each object
in the output; the query can ask for that type using the special
field `__typename`, defined on every object.

```graphql
query CheckTypeOfR2 {
  hero {
    __typename
    name
  }
}
```

Since R2-D2 is a droid, this will return

```json
{
  "hero": {
    "__typename": "Droid",
    "name": "R2-D2"
  }
}
```

This was particularly useful because `hero` was defined to return a `Character`,
which is an interface; we might want to know what concrete type was actually
returned. If we instead asked for the hero of Episode V:

```graphql
query CheckTypeOfLuke {
  hero(episode: EMPIRE) {
    __typename
    name
  }
}
```

We would find that it was Luke, who is a Human:

```json
{
  "hero": {
    "__typename": "Human",
    "name": "Luke Skywalker"
  }
}
```

As with the type system, this example just scratched the surface of the query
language. The specification goes into more detail about this topic in the
"Language" section, and the
[language](https://github.com/graphql/graphql-js/blob/master/src/language)
directory in GraphQL.js contains code implementing a
specification-compliant GraphQL query language parser and lexer.

### Validation

By using the type system, it can be predetermined whether a GraphQL query
is valid or not. This allows servers and clients to effectively inform
developers when an invalid query has been created, without having to rely
on runtime checks.

For our Star Wars example, the file
[starWarsValidationTests.js](https://github.com/graphql/graphql-js/blob/master/src/__tests__/starWarsValidation-test.js)
contains a number of queries demonstrating various invalidities, and is a test
file that can be run to exercise the reference implementation's validator.

To start, let's take a complex valid query. This is the `NestedQuery` example
from the above section, but with the duplicated fields factored out into
a fragment:

```graphql
query NestedQueryWithFragment {
  hero {
    ...NameAndAppearances
    friends {
      ...NameAndAppearances
      friends {
        ...NameAndAppearances
      }
    }
  }
}

fragment NameAndAppearances on Character {
  name
  appearsIn
}
```

And this query is valid. Let's take a look at some invalid queries!

When we query for fields, we have to query for a field that exists on the
given type. So as `hero` returns a `Character`, we have to query for a field
on `Character`. That type does not have a `favoriteSpaceship` field, so this
query:

```graphql
# INVALID: favoriteSpaceship does not exist on Character
query HeroSpaceshipQuery {
  hero {
    favoriteSpaceship
  }
}
```

is invalid.

Whenever we query for a field and it returns something other than a scalar
or an enum, we need to specify what data we want to get back from the field.
Hero returns a `Character`, and we've been requesting fields like `name` and
`appearsIn` on it; if we omit that, the query will not be valid:

```graphql
# INVALID: hero is not a scalar, so fields are needed
query HeroNoFieldsQuery {
  hero
}
```

Similarly, if a field is a scalar, it doesn't make sense to query for
additional fields on it, and doing so will make the query invalid:

```graphql
# INVALID: name is a scalar, so fields are not permitted
query HeroFieldsOnScalarQuery {
  hero {
    name {
      firstCharacterOfName
    }
  }
}
```

Earlier, it was noted that a query can only query for fields on the type
in question; when we query for `hero` which returns a `Character`, we
can only query for fields that exist on `Character`. What happens if we
want to query for R2-D2s primary function, though?

```graphql
# INVALID: primaryFunction does not exist on Character
query DroidFieldOnCharacter {
  hero {
    name
    primaryFunction
  }
}
```

That query is invalid, because `primaryFunction` is not a field on `Character`.
We want some way of indicating that we wish to fetch `primaryFunction` if the
`Character` is a `Droid`, and to ignore that field otherwise. We can use
the fragments we introduced earlier to do this. By setting up a fragment defined
on `Droid` and including it, we ensure that we only query for `primaryFunction`
where it is defined.

```graphql
query DroidFieldInFragment {
  hero {
    name
    ...DroidFields
  }
}

fragment DroidFields on Droid {
  primaryFunction
}
```

This query is valid, but it's a bit verbose; named fragments were valuable
above when we used them multiple times, but we're only using this one once.
Instead of using a named fragment, we can use an inline fragment; this
still allows us to indicate the type we are querying on, but without naming
a separate fragment:

```graphql
query DroidFieldInInlineFragment {
  hero {
    name
    ... on Droid {
      primaryFunction
    }
  }
}
```

This has just scratched the surface of the validation system; there
are a number of validation rules in place to ensure that a GraphQL query
is semantically meaningful. The specification goes into more detail about this
topic in the "Validation" section, and the
[validation](https://github.com/graphql/graphql-js/blob/master/src/validation)
directory in GraphQL.js contains code implementing a
specification-compliant GraphQL validator.

### Introspection

It's often useful to ask a GraphQL schema for information about what
queries it supports. GraphQL allows us to do so using the introspection
system!

For our Star Wars example, the file
[starWarsIntrospectionTests.js](https://github.com/graphql/graphql-js/blob/master/src/__tests__/starWarsIntrospection-test.js)
contains a number of queries demonstrating the introspection system, and is a
test file that can be run to exercise the reference implementation's
introspection system.

We designed the type system, so we know what types are available, but if
we didn't, we can ask GraphQL, by querying the `__schema` field, always
available on the root type of a Query. Let's do so now, and ask what types
are available.

```graphql
query IntrospectionTypeQuery {
  __schema {
    types {
      name
    }
  }
}
```

and we get back:

```json
{
  "__schema": {
    "types": [
      {
        "name": "Query"
      },
      {
        "name": "Character"
      },
      {
        "name": "Human"
      },
      {
        "name": "String"
      },
      {
        "name": "Episode"
      },
      {
        "name": "Droid"
      },
      {
        "name": "__Schema"
      },
      {
        "name": "__Type"
      },
      {
        "name": "__TypeKind"
      },
      {
        "name": "Boolean"
      },
      {
        "name": "__Field"
      },
      {
        "name": "__InputValue"
      },
      {
        "name": "__EnumValue"
      },
      {
        "name": "__Directive"
      }
    ]
  }
}
```

Wow, that's a lot of types! What are they? Let's group them:

 - **Query, Character, Human, Episode, Droid** - These are the ones that we
defined in our type system.
 - **String, Boolean** - These are built-in scalars that the type system
provided.
 - **__Schema, __Type, __TypeKind, __Field, __InputValue, __EnumValue,
__Directive** - These all are preceded with a double underscore, indicating
that they are part of the introspection system.

Now, let's try and figure out a good place to start exploring what queries are
available. When we designed our type system, we specified what type all queries
would start at; let's ask the introspection system about that!

```graphql
query IntrospectionQueryTypeQuery {
  __schema {
    queryType {
      name
    }
  }
}
```

and we get back:

```json
{
  "__schema": {
    "queryType": {
      "name": "Query"
    }
  }
}
```

And that matches what we said in the type system section, that
the `Query` type is where we will start! Note that the naming here
was just by convention; we could have named our `Query` type anything
else, and it still would have been returned here if we had specified it
as the starting type for queries. Naming it `Query`, though, is a useful
convention.

It is often useful to examine one specific type. Let's take a look at
the `Droid` type:


```graphql
query IntrospectionDroidTypeQuery {
  __type(name: "Droid") {
    name
  }
}
```

and we get back:

```json
{
  "__type": {
    "name": "Droid"
  }
}
```

What if we want to know more about Droid, though? For example, is it
an interface or an object?

```graphql
query IntrospectionDroidKindQuery {
  __type(name: "Droid") {
    name
    kind
  }
}
```

and we get back:

```json
{
  "__type": {
    "name": "Droid",
    "kind": "OBJECT"
  }
}
```

`kind` returns a `__TypeKind` enum, one of whose values is `OBJECT`. If
we asked about `Character` instead:


```graphql
query IntrospectionCharacterKindQuery {
  __type(name: "Character") {
    name
    kind
  }
}
```

and we get back:

```json
{
  "__type": {
    "name": "Character",
    "kind": "INTERFACE"
  }
}
```

We'd find that it is an interface.

It's useful for an object to know what fields are available, so let's
ask the introspection system about `Droid`:

```graphql
query IntrospectionDroidFieldsQuery {
  __type(name: "Droid") {
    name
    fields {
      name
      type {
        name
        kind
      }
    }
  }
}
```

and we get back:

```json
{
  "__type": {
    "name": "Droid",
    "fields": [
      {
        "name": "id",
        "type": {
          "name": null,
          "kind": "NON_NULL"
        }
      },
      {
        "name": "name",
        "type": {
          "name": "String",
          "kind": "SCALAR"
        }
      },
      {
        "name": "friends",
        "type": {
          "name": null,
          "kind": "LIST"
        }
      },
      {
        "name": "appearsIn",
        "type": {
          "name": null,
          "kind": "LIST"
        }
      },
      {
        "name": "primaryFunction",
        "type": {
          "name": "String",
          "kind": "SCALAR"
        }
      }
    ]
  }
}
```

Those are our fields that we defined on `Droid`!

`id` looks a bit weird there, it has no name for the type. That's
because it's a "wrapper" type of kind `NON_NULL`. If we queried for
`ofType` on that field's type, we would find the `String` type there,
telling us that this is a non-null String.

Similarly, both `friends` and `appearsIn` have no name, since they are the
`LIST` wrapper type. We can query for `ofType` on those types, which will
tell us what these are lists of.

```graphql
query IntrospectionDroidWrappedFieldsQuery {
  __type(name: "Droid") {
    name
    fields {
      name
      type {
        name
        kind
        ofType {
          name
          kind
        }
      }
    }
  }
}
```

and we get back:

```json
{
  "__type": {
    "name": "Droid",
    "fields": [
      {
        "name": "id",
        "type": {
          "name": null,
          "kind": "NON_NULL",
          "ofType": {
            "name": "String",
            "kind": "SCALAR"
          }
        }
      },
      {
        "name": "name",
        "type": {
          "name": "String",
          "kind": "SCALAR",
          "ofType": null
        }
      },
      {
        "name": "friends",
        "type": {
          "name": null,
          "kind": "LIST",
          "ofType": {
            "name": "Character",
            "kind": "INTERFACE"
          }
        }
      },
      {
        "name": "appearsIn",
        "type": {
          "name": null,
          "kind": "LIST",
          "ofType": {
            "name": "Episode",
            "kind": "ENUM"
          }
        }
      },
      {
        "name": "primaryFunction",
        "type": {
          "name": "String",
          "kind": "SCALAR",
          "ofType": null
        }
      }
    ]
  }
}
```

Let's end with a feature of the introspection system particularly useful
for tooling; let's ask the system for documentation!

```graphql
query IntrospectionDroidDescriptionQuery {
  __type(name: "Droid") {
    name
    description
  }
}
```

yields

```json
{
  "__type": {
    "name": "Droid",
    "description": "A mechanical creature in the Star Wars universe."
  }
}
```

So we can access the documentation about the type system using introspection,
and create documentation browsers, or rich IDE experiences.

This has just scratched the surface of the introspection system; we can
query for enum values, what interfaces a type implements, and more. We
can even introspect on the introspection system itself. The specification goes
into more detail about this topic in the "Introspection" section, and the [introspection](https://github.com/graphql/graphql-js/blob/master/src/type/introspection.js)
file in GraphQL.js
contains code implementing a specification-compliant GraphQL query
introspection system.

### Additional Content

This README walked through the GraphQL.js reference implementation's type
system, query execution, validation, and introspection systems. There's more
in both [GraphQL.js](https://github.com/graphql/graphql-js/) and specification,
including a description and implementation for executing queries, how to format
a response, explaining how a type system maps to an underlying implementation,
and how to format a GraphQL response, as well as the grammar for GraphQL.



Apache License
                           Version 2.0, January 2004
                        https://www.apache.org/licenses/

   TERMS AND CONDITIONS FOR USE, REPRODUCTION, AND DISTRIBUTION

   1. Definitions.

      "License" shall mean the terms and conditions for use, reproduction,
      and distribution as defined by Sections 1 through 9 of this document.

      "Licensor" shall mean the copyright owner or entity authorized by
      the copyright owner that is granting the License.

      "Legal Entity" shall mean the union of the acting entity and all
      other entities that control, are controlled by, or are under common
      control with that entity. For the purposes of this definition,
      "control" means (i) the power, direct or indirect, to cause the
      direction or management of such entity, whether by contract or
      otherwise, or (ii) ownership of fifty percent (50%) or more of the
      outstanding shares, or (iii) beneficial ownership of such entity.

      "You" (or "Your") shall mean an individual or Legal Entity
      exercising permissions granted by this License.

      "Source" form shall mean the preferred form for making modifications,
      including but not limited to software source code, documentation
      source, and configuration files.

      "Object" form shall mean any form resulting from mechanical
      transformation or translation of a Source form, including but
      not limited to compiled object code, generated documentation,
      and conversions to other media types.

      "Work" shall mean the work of authorship, whether in Source or
      Object form, made available under the License, as indicated by a
      copyright notice that is included in or attached to the work
      (an example is provided in the Appendix below).

      "Derivative Works" shall mean any work, whether in Source or Object
      form, that is based on (or derived from) the Work and for which the
      editorial revisions, annotations, elaborations, or other modifications
      represent, as a whole, an original work of authorship. For the purposes
      of this License, Derivative Works shall not include works that remain
      separable from, or merely link (or bind by name) to the interfaces of,
      the Work and Derivative Works thereof.

      "Contribution" shall mean any work of authorship, including
      the original version of the Work and any modifications or additions
      to that Work or Derivative Works thereof, that is intentionally
      submitted to Licensor for inclusion in the Work by the copyright owner
      or by an individual or Legal Entity authorized to submit on behalf of
      the copyright owner. For the purposes of this definition, "submitted"
      means any form of electronic, verbal, or written communication sent
      to the Licensor or its representatives, including but not limited to
      communication on electronic mailing lists, source code control systems,
      and issue tracking systems that are managed by, or on behalf of, the
      Licensor for the purpose of discussing and improving the Work, but
      excluding communication that is conspicuously marked or otherwise
      designated in writing by the copyright owner as "Not a Contribution."

      "Contributor" shall mean Licensor and any individual or Legal Entity
      on behalf of whom a Contribution has been received by Licensor and
      subsequently incorporated within the Work.

   2. Grant of Copyright License. Subject to the terms and conditions of
      this License, each Contributor hereby grants to You a perpetual,
      worldwide, non-exclusive, no-charge, royalty-free, irrevocable
      copyright license to reproduce, prepare Derivative Works of,
      publicly display, publicly perform, sublicense, and distribute the
      Work and such Derivative Works in Source or Object form.

   3. Grant of Patent License. Subject to the terms and conditions of
      this License, each Contributor hereby grants to You a perpetual,
      worldwide, non-exclusive, no-charge, royalty-free, irrevocable
      (except as stated in this section) patent license to make, have made,
      use, offer to sell, sell, import, and otherwise transfer the Work,
      where such license applies only to those patent claims licensable
      by such Contributor that are necessarily infringed by their
      Contribution(s) alone or by combination of their Contribution(s)
      with the Work to which such Contribution(s) was submitted. If You
      institute patent litigation against any entity (including a
      cross-claim or counterclaim in a lawsuit) alleging that the Work
      or a Contribution incorporated within the Work constitutes direct
      or contributory patent infringement, then any patent licenses
      granted to You under this License for that Work shall terminate
      as of the date such litigation is filed.

   4. Redistribution. You may reproduce and distribute copies of the
      Work or Derivative Works thereof in any medium, with or without
      modifications, and in Source or Object form, provided that You
      meet the following conditions:

      (a) You must give any other recipients of the Work or
          Derivative Works a copy of this License; and

      (b) You must cause any modified files to carry prominent notices
          stating that You changed the files; and

      (c) You must retain, in the Source form of any Derivative Works
          that You distribute, all copyright, patent, trademark, and
          attribution notices from the Source form of the Work,
          excluding those notices that do not pertain to any part of
          the Derivative Works; and

      (d) If the Work includes a "NOTICE" text file as part of its
          distribution, then any Derivative Works that You distribute must
          include a readable copy of the attribution notices contained
          within such NOTICE file, excluding those notices that do not
          pertain to any part of the Derivative Works, in at least one
          of the following places: within a NOTICE text file distributed
          as part of the Derivative Works; within the Source form or
          documentation, if provided along with the Derivative Works; or,
          within a display generated by the Derivative Works, if and
          wherever such third-party notices normally appear. The contents
          of the NOTICE file are for informational purposes only and
          do not modify the License. You may add Your own attribution
          notices within Derivative Works that You distribute, alongside
          or as an addendum to the NOTICE text from the Work, provided
          that such additional attribution notices cannot be construed
          as modifying the License.

      You may add Your own copyright statement to Your modifications and
      may provide additional or different license terms and conditions
      for use, reproduction, or distribution of Your modifications, or
      for any such Derivative Works as a whole, provided Your use,
      reproduction, and distribution of the Work otherwise complies with
      the conditions stated in this License.

   5. Submission of Contributions. Unless You explicitly state otherwise,
      any Contribution intentionally submitted for inclusion in the Work
      by You to the Licensor shall be under the terms and conditions of
      this License, without any additional terms or conditions.
      Notwithstanding the above, nothing herein shall supersede or modify
      the terms of any separate license agreement you may have executed
      with Licensor regarding such Contributions.

   6. Trademarks. This License does not grant permission to use the trade
      names, trademarks, service marks, or product names of the Licensor,
      except as required for reasonable and customary use in describing the
      origin of the Work and reproducing the content of the NOTICE file.

   7. Disclaimer of Warranty. Unless required by applicable law or
      agreed to in writing, Licensor provides the Work (and each
      Contributor provides its Contributions) on an "AS IS" BASIS,
      WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or
      implied, including, without limitation, any warranties or conditions
      of TITLE, NON-INFRINGEMENT, MERCHANTABILITY, or FITNESS FOR A
      PARTICULAR PURPOSE. You are solely responsible for determining the
      appropriateness of using or redistributing the Work and assume any
      risks associated with Your exercise of permissions under this License.

   8. Limitation of Liability. In no event and under no legal theory,
      whether in tort (including negligence), contract, or otherwise,
      unless required by applicable law (such as deliberate and grossly
      negligent acts) or agreed to in writing, shall any Contributor be
      liable to You for damages, including any direct, indirect, special,
      incidental, or consequential damages of any character arising as a
      result of this License or out of the use or inability to use the
      Work (including but not limited to damages for loss of goodwill,
      work stoppage, computer failure or malfunction, or any and all
      other commercial damages or losses), even if such Contributor
      has been advised of the possibility of such damages.

   9. Accepting Warranty or Additional Liability. While redistributing
      the Work or Derivative Works thereof, You may choose to offer,
      and charge a fee for, acceptance of support, warranty, indemnity,
      or other liability obligations and/or rights consistent with this
      License. However, in accepting such obligations, You may act only
      on Your own behalf and on Your sole responsibility, not on behalf
      of any other Contributor, and only if You agree to indemnify,
      defend, and hold each Contributor harmless for any liability
      incurred by, or claims asserted against, such Contributor by reason
      of your accepting any such warranty or additional liability.

   END OF TERMS AND CONDITIONS

   APPENDIX: How to apply the Apache License to your work.

      To apply the Apache License to your work, attach the following
      boilerplate notice, with the fields enclosed by brackets "[]"
      replaced with your own identifying information. (Don't include
      the brackets!)  The text should be enclosed in the appropriate
      comment syntax for the file format. We also recommend that a
      file or class name and description of purpose be included on the
      same "printed page" as the copyright notice for easier
      identification within third-party archives.

   Copyright 2019 Rolando Gopez Lacuata.

   Licensed under the Apache License, Version 2.0 (the "License");
   you may not use this file except in compliance with the License.
   You may obtain a copy of the License at

       https://www.apache.org/licenses/LICENSE-2.0

   Unless required by applicable law or agreed to in writing, software
   distributed under the License is distributed on an "AS IS" BASIS,
   WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
   See the License for the specific language governing permissions and
   limitations under the License.

