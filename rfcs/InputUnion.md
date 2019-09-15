RFC: GraphQL Input Union
----------

The addition of an Input Union type has been discussed in the GraphQL community for many years now. The value of this feature has largely been agreed upon, but the implementation has not.

This document attempts to bring together all the various solutions that have been discussed with the goal of reaching a shared understanding of the problem space.

From that shared understanding, this document can then evolve into a proposed solution.

### Contributing

To help bring this idea to reality, you can contribute through two channels:

* Discuss the idea in this Github Issue:
  * https://github.com/graphql/graphql-spec/issues/617
* Submit PRs to this RFC document
  * https://github.com/graphql/graphql-spec/blob/master/rfcs/InputUnion.md

## Problem Statement

TODO:
* [ ] Describe at a high level the problem that Input Union is trying to solve.

## Use Cases

TODO:
* [ ] Collect use cases from the community's related Issues / PRs.

## Possible Solutions

Categories:

* Value-based discriminator field
* Structural discrimination

### Value-based discriminator field

These options rely the **value** of a specific input field to express the concrete type.

#### Single `__typename` field; value is the `type`

This solution was discussed in https://github.com/graphql/graphql-spec/pull/395

```graphql
input AddPostInput {
  title: String!
  body: String!
}
input AddImageInput {
  title: String!
  photo: String!
  caption: String
}

inputUnion AddMediaBlockInput = AddPostInput | AddImageInput

type Mutation {
   addContent(content: AddMediaBlockInput!): Content
}

# Variables:
{
  content: {
    "__typename": "AddPostInput",
    title: "Title",
    body: "body..."
  }
}
```

##### Variations:

* A `default` annotation may be provided, for which specifying the `__typename` is not required. This enables a field migration from an `Input` to an `Input Union`

#### Single user-chosen field; value is the `type`

```graphql
input AddPostInput {
  kind: <AddMediaBlockInput>
  title: String!
  body: String!
}
input AddImageInput {
  kind: <AddMediaBlockInput>
  title: String!
  photo: String!
  caption: String
}

inputUnion AddMediaBlockInput = AddPostInput | AddImageInput

type Mutation {
   addContent(content: AddMediaBlockInput!): Content
}

# Variables:
{
  content: {
    kind: "AddPostInput",
    title: "Title",
    body: "body..."
  }
}
```

##### Problems:

* The discriminator field is non-sensical if the input is used _outside_ of an input union.

#### Single user-chosen field; value is a literal

This solution is derrived from one discussed in https://github.com/graphql/graphql-spec/issues/488

```graphql
enum MediaType {
  POST
  IMAGE
}
input AddPostInput {
  kind: MediaType::POST
  title: String!
  body: String!
}
input AddImageInput {
  kind: MediaType::IMAGE
  title: String!
  photo: String!
  caption: String
}

inputUnion AddMediaBlockInput = AddPostInput | AddImageInput

type Mutation {
   addContent(content: AddMediaBlockInput!): Content
}

# Variables:
{
  content: {
    kind: "POST",
    title: "Title",
    body: "body..."
  }
}
```

##### Variations:

* Literal strings used instead of an `enum`

```graphql
input AddPostInput {
  kind: 'post'
  title: String!
  body: String!
}
input AddImageInput {
  kind: 'image'
  title: String!
  photo: String!
  caption: String
}
```

##### Problems:

* The discriminator field is redundant if the input is used _outside_ of an input union.

### Structural discrimination

These options rely on the **structure** of the input to determine the concrete type.

#### Order based type matching

The concrete type is the first type in the input union definition that matches.

```graphql
input AddPostInput {
  title: String!
  publishedAt: Int
  body: String
}
input AddImageInput {
  title: String!
  publishedAt: Int
  photo: String
  caption: String
}

inputUnion AddMediaBlockInput = AddPostInput | AddImageInput

type Mutation {
   addContent(content: AddMediaBlockInput!): Content
}

# Variables:
{
  content: {
    title: "Title",
    date: 1558066429
    # AddPostInput
  }
}
{
  content: {
    title: "Title",
    date: 1558066429
    photo: "photo.png"
    # AddImageInput
  }
}
```

#### Structural uniqueness

Schema Rule: Each type in the union must have a unique set of required field names

```graphql
input AddPostInput {
  title: String!
  body: String!
}
input AddImageInput {
  photo: String!
  caption: String
}

inputUnion AddMediaBlockInput = AddPostInput | AddImageInput

type Mutation {
   addContent(content: AddMediaBlockInput!): Content
}

# Variables:
{
  content: {
    title: "Title",
    body: "body..."
    # AddPostInput
  }
}
```

An invalid schema:

```graphql
input AddPostInput {
  title: String!
  body: String!
}
input AddDatedPostInput {
  title: String!
  body: String!
  date: Int
}
input AddImageInput {
  photo: String!
  caption: String
}

inputUnion AddMediaBlockInput = AddPostInput | AddDatedPostInput | AddImageInput

type Mutation {
   addContent(content: AddMediaBlockInput!): Content
}
```

##### Problems:

* Optional fields could prevent determining a unique type

```graphql
input AddPostInput {
  title: String!
  body: String!
  date: Int
}
input AddDatedPostInput {
  title: String!
  body: String!
  date: Int!
}
```

Workaround? : Each type's set of required fields must be uniquely identifying

  - A type's set of required field names must not match the set of another type's required field names
  - A type's set of required field names must not overlap with the set of another type's required or optional field names

Workaround? : Each type must have at least one unique required field

  - A type must contain one required field that is not a field in any other type

##### Variations:

* Consider the field _type_ along with the field _name_ when determining uniqueness.

#### One Of (Tagged Union)

This solution was presented in https://github.com/graphql/graphql-spec/pull/395#issuecomment-361373097

The type is determined by using an intermediate input type that maps field name to type.

A directive has also been discussed to specify that only one of the fields may be selected. See https://github.com/graphql/graphql-spec/pull/586.

```graphql
input AddPostInput {
  title: String!
  body: String!
}
input AddImageInput {
  photo: String!
  caption: String
}
input AddMediaBlockInput @oneOf {
  post: AddPostInput
  image: AddImageInput
}

type Mutation {
   addContent(content: AddMediaBlockInput!): Content
}

# Variables:
{
  content: {
    post: {
      title: "Title",
      body: "body..."
    }
  }
}
```
