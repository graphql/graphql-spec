# Language

Clients use the GraphQL language to make requests to a GraphQL server. We
refer to these requests as documents. A document may contain operations
(queries and mutations are both operations) and fragments, a common unit
of composition allowing for query reuse.

## Names

GraphQL documents are full of named things: operations, fields, arguments,
directives, fragments, and variables. All names follow the same
grammatical form:

Name : /[_A-Za-z][_0-9A-Za-z]*/

Names in GraphQL are case-sensitive. That is to say `name`, `Name`, and `NAME`
all refer to different names. Underscores are significant, which means
`other_name` and `othername` are two different names.

Names in GraphQL are limited to this <acronym>ASCII</acronym> subset of possible
characters to support interoperation with as many other systems as possible.

## Document

GraphQL documents are only executable by a server if they contain an operation.
However documents which do not contain operations may still be parsed and
validated to allow client to represent a single request across many documents.

GraphQL documents may contain multiple operations, as long as they are named.
When submitting a document with multiple operations to a GraphQL server, the
name of the desired operation must also be provided.

If a document contains only one query operation, that operation may be
represented in the shorthand form, which omits the query keyword and
query name.

## Operations

There are two types of operations that GraphQL models:

  * query - a read-only fetch.
  * mutation - a write followed by a fetch.

Each operation is represented by a custom name and a selection of fields.

**Query shorthand**

If a query has no variables or directives or name, the `query` keyword can be
omitted. This means it must be the only query in the document.

Note: many examples below will use the query shorthand syntax.

## Fields

A field in the top-level selection set often represents some kind of
information that is globally accessible to your application and the current
viewer. Some typical examples of global fields:

```graphql
# `me` could represent the currently logged in user.
query getMe {
  me { /* ... */ }
}

# `user` represents one of many users in a graph of data.
query getZuck {
  user(id: 4) { /* ... */ }
}
```

## Field Selections

Each field is of a specific type, and the sub-fields must always be explicitly
declared via a field selection, unless it is a scalar. For example, when
fetching data from some user object:

```graphql
query getZuck {
  user(id: 4) {
    id,
    firstName,
    lastName
  }
}
```

Field selections can be further composed to explicitly state all subfields of
nested types. All queries must specify down to scalar fields.

```graphql
query getZuck {
  user(id: 4) {
    id,
    firstName,
    lastName,
    birthday {
      month,
      day
    }
  }
}
```

## Arguments

Fields and directives may take arguments.

These often map directly to function arguments within the GraphQL server
implementation. We already saw arguments used in the global field above.

In this example, we want to query a user's profile picture of a
specific size:

```graphql
{
  user(id: 4) {
    id,
    name,
    profilePic(size: 100)
  }
}
```

Many arguments can exist for a given field:

```graphql
{
  user(id: 4) {
    id,
    name,
    profilePic(width: 100, height: 50)
  }
}
```

**Arguments are unordered**

Arguments may be provided in any syntactic order and maintain identical
semantic meaning.

These two queries are semantically identical:

```graphql
{
  picture(width: 200, height: 100)
}
```

```graphql
{
  picture(height: 100, width: 200)
}
```

## Field Alias

By default, the key in the response object will use the field name
queried. However, you can define a different name by specifying an alias.

In this example, we can fetch two profile pictures of different sizes and ensure
the resulting object will not have duplicate keys:

```graphql
{
  user(id: 4) {
    id,
    name,
    smallPic: profilePic(size: 64),
    bigPic: profilePic(size: 1024)
  }
}
```

Which returns the result:

```js
{
  "user": {
    "id": 4,
    "name": "Mark",
    "smallPic": "https://cdn.site.io/pic-4-64.jpg",
    "bigPic": "https://cdn.site.io/pic-4-1024.jpg"
  }
}
```

Since the top level of a query is a field, it also can be given an alias:

```graphql
{
  zuck: user(id: 4) {
    id,
    name
  }
}
```

Returns the result:

```js
{
  "zuck": {
    "id": 4,
    "name": "Mark Zuckerberg"
  }
}
```

A field's response key is its alias if an alias is provided, and it is
the field's name otherwise.

## Input Values

Field and directive arguments accept input values. Input values can be
specified as a variable or represented inline as literals.  Input values can
be scalars, enumerations, or input objects. List and inputs objects may also
contain variables.

**Int**

Int is a number specified without a decimal point (ex. `1`).

**Float**

A Float numbers always includes a decimal point (ex. `1.0`) and may optionally
also include an exponent (ex. `6.0221413e23`).

**Boolean**

The two keywords `true` and `false` represent the two boolean values.

**String**

Strings are lists of characters wrapped in double-quotes `"`. (ex. `"Hello World"`).
Whitespace is significant within a string.

**Enum Value**

Enum values are represented as unquoted names (ex. `MOBILE_WEB`). It is
recommended that Enum values be "all caps". Enum values are only used in contexts
where the precise enumeration type is known. Therefore it's not necessary
to use the enumeration type name in the literal.

**List**

Lists are an ordered sequence of values wrapped in square-brackets `[ ]`. The
values of an Array literal may be any value literal or variable (ex. `[1, 2, 3]`).

Commas are optional throughout GraphQL so trailing commas are allowed and repeated
commas do not represent missing values.

**Input Object**

Input object literals are unordered lists of keyed input values wrapped in
curly-braces `{ }`.  The values of an object literal may be any input value
literal or variable (ex. `{ name: "Hello world", score: 1.0 }`). We refer to
literal representation of input objects as "object literals."

## Variables

A GraphQL query can be parameterized with variables, maximizing query reuse,
and avoiding costly string building in clients at runtime.

Variables must be defined at the top of an operation and have global scope.

In this example, we want to fetch a profile picture size based on the size
of a particular device:

```graphql
query getZuckProfile($devicePicSize: Int) {
  user(id: 4) {
    id,
    name,
    profilePic(size: $devicePicSize)
  }
}
```

Values for those variables are provided along with a GraphQL query, so they may be
substituted during execution. If providing JSON for the variables values, we
could run this query and request profilePic of size 60 width:

```js
{
  "devicePicSize": 60
}
```


## Fragments

Fragments allow for reuse of repeated portions of a query. It is the unit of
composition in GraphQL.

For example, if we wanted to fetch some common information about mutual friends
as well as friends of some user:

```graphql
query noFragments {
  user(id: 4) {
    friends(first: 10) {
      id,
      name,
      profilePic(size: 50)
    },
    mutualFriends(first: 10) {
      id,
      name,
      profilePic(size: 50)
    }
  }
}
```

The repeated fields could be extracted into a fragment and composed by
a parent fragment or query.

```graphql
query withFragments {
  user(id: 4) {
    friends(first: 10) { ...friendFields },
    mutualFriends(first: 10) { ...friendFields }
  }
}

fragment friendFields on User {
  id,
  name,
  profilePic(size: 50)
}
```

Fragments are consumed by using the spread operator (`...`).  All fields selected
by the fragment will be added to the query field selection at the same level
as the fragment invocation. This happens through multiple levels of fragment
spreads.

For example:

```graphql
query withNestedFragments
{
  user(id: 4) {
    friends(first: 10) { ...friendFields },
    mutualFriends(first: 10) { ...friendFields }
  }
}

fragment friendFields on User {
  id,
  name,
  ...standardProfilePic
}

fragment standardProfilePic on User {
  profilePic(size: 50)
}
```

The queries `noFragments`, `withFragments`, and `withNestedFragments` all
produce the same response object.

### Types on fragments

Fragments must specify the type they apply to. In this example, `friendFields`
can be used in the context of querying a `User`.

Fragments cannot be specified on any input value (scalar, enumeration, or input
object).

Fragments can be specified on object types, interfaces, and unions.

Selections within fragments only return values when concrete type of the object
it is operating on matches the type of the fragment.

For example in this query on the Facebook data model:

```graphql
query FragmentTyping {
  profiles(handles: ["zuck", "cocacola"]) {
    handle,
    ...userFragment,
    ...pageFragment
  }
}

fragment userFragment on User {
  friends { count }
}

fragment pageFragment on Page {
  likers { count }
}
```

The `profiles` root field returns a list where each element could be a `Page` or a
`User`. When the object in the `profiles` result is a `User`, `friends` will be
present and `likers` will not. Conversely when the result is a `Page`, `likers`
will be present and `friends` will not.

```js
{
  "profiles" : [
    {
      "handle" : "zuck",
      "friends" : { "count" : 1234 }
    },
    {
      "handle" : "cocacola",
      "likers" : { "count" : 90234512 }
    }
  ]
}
```

### Query variables in fragments

Query variables can be used within fragments. Query variables have global scope
with a given operation, so a variable used within a fragment must be declared
in any top-level operation that transitively consumes that fragment. If
a variable is referenced in a fragment and is included by an operation that does
not define that variable, the operation cannot be executed.

### Inline fragments

Fragments can be defined inline to query. This is done to conditionally execute
fields based on their runtime type. This feature of standard fragment inclusion
was demonstrated in the `query FragmentTyping` example. We could accomplish the
same thing using inline fragments.

```graphql
query InlineFragmentTyping {
  profiles(handles: ["zuck", "cocacola"]) {
    handle,
    ... on User {
      friends { count }
    },
    ... on Page {
      likers { count }
    }
  }
}
```


## Directives

In some cases, you need to provide options to alter GraphQL's execution
behavior in ways field arguments will not suffice, such as conditionally
including or skipping a field. Directives provide this by describing additional information to the executor.

Directives have a name along with a list of arguments which may accept values
of any input type.

Directives can be used to describe additional information for fields, fragments,
and operations.

As future versions of GraphQL adopts new configurable execution capabilities,
they may be exposed via directives.

### Fragment Directives

Fragments may include directives to alter their behavior. At runtime, the directives provided on a fragment spread override those described on the
definition.

For example, the following query:

```graphql
query HasConditionalFragment($condition: Boolean) {
  ...MaybeFragment @include(if: $condition)
}

fragment MaybeFragment on Query {
  me {
    name
  }
}
```

Will have identical runtime behavior as

```graphql
query HasConditionalFragment($condition: Boolean) {
  ...MaybeFragment
}

fragment MaybeFragment on Query @include(if: $condition) {
  me {
    name
  }
}
```

FragmentSpreadDirectives(fragmentSpread) :
  * Let {directives} be the set of directives on {fragmentSpread}
  * Let {fragmentDefinition} be the FragmentDefinition in the document named {fragmentSpread} refers to.
  * For each {directive} in directives on {fragmentDefinition}
    * If {directives} does not contain a directive named {directive}.
    * Add {directive} into {directives}
  * Return {directives}


Prev: [Overview](Section 1 -- Overview.md) |
Next: [Type System](Section 3 -- Type System.md)
