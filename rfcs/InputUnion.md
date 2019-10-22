RFC: GraphQL Input Union
----------

The addition of an Input Union type has been discussed in the GraphQL community for many years now. The value of this feature has largely been agreed upon, but the implementation has not.

This document attempts to bring together all the various solutions and perspectives that have been discussed with the goal of reaching a shared understanding of the problem space.

From that shared understanding, the GraphQL Working Group aims to reach a consensus on how to address the proposal.

### Contributing

To help bring this idea to reality, you can contribute [PRs to this RFC document.](https://github.com/graphql/graphql-spec/edit/master/rfcs/InputUnion.md)

## Problem Statement

GraphQL currently provides polymorphic types that enable schema authors to model complex **Object** types that have multiple shapes while remaining type-safe, but lacks an equivilant capability for **Input** types.

Over the years there have been numerous proposals from the community to add a polymorphic input type. Without such a type, schema authors have resorted to a handful of work-arounds to model their domains. These work-arounds have led to schemas that aren't as expressive as they could be, and schemas where mutations that ideally mirror queries are forced to be modeled differently.

## Problem Sketch

To understand the problem space a little more, we'll sketch out an example that explores a domain from the perspective of a Query and a Mutation. However, it's important to note that the problem is not limited to mutations, since `Input` types are used in field arguments for any GraphQL operation type.

Let's imagine an animal shelter for our example. When querying for a list of the animals, it's easy to see how abstract types are useful - we can get data specific to the type of the animal easily.

```graphql
{
  animalShelter(location: "Portland, OR") {
    animals {
      __typename
      name
      age
      ... on Cat { livesLeft }
      ... on Dog { breed }
      ... on Snake { venom }
    }
  }
}
```

However, when we want to submit data, we can't use an `interface` or `union`, so we must model around that.

One technique commonly used to is a **tagged union** pattern. This essentially boils down to a "wrapper" input that isolates each type into it's own field. The field name takes on the convention of representing the type.

```graphql
mutation {
  logAnimalDropOff(
    location: "Portland, OR"
    animals: [
      {cat: {name: "Buster", age: 3, livesLeft: 7}}
    ]
  )
}
```

Unfortunately, this opens up a set of problems, since the Tagged union input type actually contains many fields, any of which could be submitted.

```graphql
input AnimalDropOffInput {
  cat: CatInput
  dog: DogInput
  snake: SnakeInput
}
```

This allows non-sensical mutations to pass GraphQL validation, for example representing an animal that is both a `Cat` and a `Dog`.

```graphql
mutation {
  logAnimalDropOff(
    location: "Portland, OR"
    animals: [
      {
        cat: {name: "Buster", age: 3, livesLeft: 7},
        dog: {name: "Ripple", age: 2, breed: WHIPPET}
      }
    ]
  )
}
```

In addition, relying on this layer of abstraction means that this domain must be modelled differently across input & output. This can put a larger burden on the developer interacting with the schema, both in terms of lines of code and complexity.

```json
// JSON structure returned from a query
{
  "animals": [
    {"__typename": "Cat", "name": "Ruby", "age": 2, "livesLeft": 9}
    {"__typename": "Snake", "name": "Monty", "age": 13, "venom": "POISON"}
  ]
}
```

```json
// JSON structure submitted to a mutation
{
  "animals": [
    {"cat": {"name": "Ruby", "age": 2, "livesLeft": 9}},
    {"snake": {"name": "Monty", "age": 13, "venom": "POISON"}}
  ]
}
```

Another common approach is to provide a unique mutation for every type. A schema employing this technique might have `logCatDropOff`, `logDogDropOff` and `logSnakeDropOff` mutations. This removes the potential for modeling non-sensical situations, but it explodes the number of mutations in a schema, making the schema less accessible. If the type is nested inside other inputs, this approach simply isn't feasable.

These workarounds only get worse at scale. Real world GraphQL schemas can have dozens if not hundreds of possible types for a single `Interface` or `Union`.

The goal of the **Input Union** is to bring a polymorphic type to Inputs. This would enable us to model situations where an input may be of different types in a type-safe and elegant manner, like we can with outputs.

```graphql
mutation {
  logAnimalDropOff(
    location: "Portland, OR"

    # Problem: we need to determine the type of each Animal
    animals: [
      # This is meant to be a CatInput
      {name: "Buster", age: 3, livesLeft: 7},

      # This is meant to be a DogInput
      {name: "Ripple", age: 2}
    ]
  )
}
```

In this mutation, we encounter the main challenge of the **Input Union** - we need to determine the correct type of the data submitted.

A wide variety of solutions have been explored by the community, and they are outlined in detail in this document under [Possible Solutions](#Possible-Solutions).

## Solution Criteria

Hypothetical goals that a solution might attempt to fulfill. These goals will be evaluated with the [GraphQL Spec Guiding Principles](https://github.com/graphql/graphql-spec/blob/master/CONTRIBUTING.md#guiding-principles) in mind:

* Backwards compatibility
* Performance is a feature
* Favor no change
* Enable new capabilities motivated by real use cases
* Simplicity and consistency over expressiveness and terseness
* Preserve option value
* Understandability is just as important as correctness

### GraphQL should contain a polymorphic Input type

The premise of this RFC - GraphQL should contain a polymorphic Input type.

### Input polymorphism matches output polymorphism

Any data structure that can be modeled with output type polymorphism should be able to be mirrored with Input polymorphism. Minimal transformation of outputs should be required to send a data structure back as inputs.

* Objection: input types and output types are distinct. Output types support aliases and arguments whereas input types do not. Marking an output field as non-nullable is a non-breaking change, but marking an input field as non-nullable is a breaking change.

### Doesn't inhibit [schema evolution](https://graphql.github.io/graphql-spec/draft/#sec-Validation.Type-system-evolution)

Adding a new member type to an Input Union or doing any non-breaking change to existing member types does not result in breaking change. For example, adding a new optional field to member type or changing a field from non-nullable to nullable does not break previously valid client operations.

### Any member type restrictions are validated in schema

If a solution places any restrictions on member types, compliance with these restrictions should be fully validated during schema building (analagous to how interfaces enforce restrictions on member types).

### A member type may be a Leaf type

In addition to containing Input types, member type may also contain Leaf types like `Scalar`s or `Enum`s.

* Objection: Multiple Leaf types serialize the same way, making it impossible to distinguish the type without additional information. For example, a `String`, `ID` and `Enum`.
  * Potential solution: only allow a single built-in leaf type per input union.
* Objection: Output polymorphism is restricted to Object types only. Supporting Leaf types in Input polymorphism would create a new inconsistency.

### Changing field from an input type to an input union including that type is non-breaking

Since the input object type is now a member of the input union, existing input objects being sent through should remain valid.

* Objection: achieving this by indicating the default in the union (either explicitly or implicitly via the order) is undesirable as it may require multiple equivalent unions being created where only the default differs.
* Objection: achieving this by indicating a default type in the input field is verbose/potentially ugly.

### Input unions may include other input unions

To ease development.

### Input unions don't need "discriminator" field

Differentiate types structurally, e.g. by checking the input value against each candidate input type in turn until a viable match is found.

* Objection: many input objects may not have unique required attributes (i.e. are heterogenous), leading to ambiguity.
  * Potential solution: input union order is signficant.
* Objection: making a field in an input object nullable may result in an existing input value being interpretted as a different input object type at a later time (breaks forwards compatibility).
* Objection: does not work with scalars.
* Objection: this may have a noticable performance cost for larger input unions.

### Input unions don't use wrapper objects

For consistency with output unions/interfaces each union should resolve to a single JSON object; i.e. `{__typename:"MyInput",value:3}` rather than `{MyInput:{value:3}}`.

* Objection: wrapper objects can be more concise than including `__typename` or similar in each value.
* Objection: the "tagged union" pattern is already in common usage.
* Objection: this pattern enables support for leaf types (e.g. scalars) in unions.
* Objection: this pattern enables support for individual input object list types in unions.

### Input unions should be easy to upgrade from existing solutions

Many people in the wild are solving the need for input unions with validation at run-time (e.g. using the "tagged union" pattern). Formalising support for these existing patterns in a non-breaking way would enable existing schemas to become retroactively more type-safe.

### A GraphQL schema that supports input unions can be queried by older GraphQL clients

Preferably without loss of functionality.

## Use Cases

There have been a variety of use cases described by users asking for an abstract input type.

* [Observability Metrics](https://github.com/graphql/graphql-spec/pull/395#issuecomment-489495267)
* [Login Options](https://github.com/graphql/graphql-js/issues/207#issuecomment-228543259)
* [Abstract Syntax Tree](https://github.com/graphql/graphql-spec/pull/395#issuecomment-489611199)
* [Content Widgets](https://github.com/graphql/graphql-js/issues/207#issuecomment-308344371)
* [Filtering](https://github.com/graphql/graphql-spec/issues/202#issue-170560819)
* [Observability Cloud Integrations](https://gist.github.com/binaryseed/f2dd63d1a1406124be70c17e2e796891#cloud-integrations)
* [Observability Dashboards](https://gist.github.com/binaryseed/f2dd63d1a1406124be70c17e2e796891#dashboards)

## Possible Solutions

Broadly speaking, there are two categories of solutions to the problem of type discrimination:

* Value-based discriminator field
* Structural discrimination

### Value-based discriminator field

These solutions rely the **value** of a specific input field to determine the concrete type.

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

These solutions rely on the **structure** of the input to determine the concrete type.

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
