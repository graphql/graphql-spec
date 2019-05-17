RFC: GraphQL Input Union
----------

## Possible Solutions

Categories:

* Value-based discriminator field
* Structural discrimination

### Value-based discriminator field

These options rely the _value_ of a specific input field to express the concrete type.

#### Single `__typename` field; value is the `type`

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

#### Single user-chosen field; value is a literal

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

### Structural discrimination

These options rely on the _structure_ of the input to determine the concrete type.

#### Unique structure

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

Problems:

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
