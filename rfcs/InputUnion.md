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

Each criteria is identified with a Letter so they can be referenced in the rest of the document. New criteria must be added to the end of the list.

### A) GraphQL should contain a polymorphic Input type

The premise of this RFC - GraphQL should contain a polymorphic Input type.

### B) Input polymorphism matches output polymorphism

Any data structure that can be modeled with output type polymorphism should be able to be mirrored with Input polymorphism. Minimal transformation of outputs should be required to send a data structure back as inputs.

* Objection: input types and output types are distinct. Output types support aliases and arguments whereas input types do not. Marking an output field as non-nullable is a non-breaking change, but marking an input field as non-nullable is a breaking change.

### C) Doesn't inhibit [schema evolution](https://graphql.github.io/graphql-spec/draft/#sec-Validation.Type-system-evolution)

Adding a new member type to an Input Union or doing any non-breaking change to existing member types does not result in breaking change. For example, adding a new optional field to member type or changing a field from non-nullable to nullable does not break previously valid client operations.

### D) Any member type restrictions are validated in schema

If a solution places any restrictions on member types, compliance with these restrictions should be fully validated during schema building (analagous to how interfaces enforce restrictions on member types).

### E) A member type may be a Leaf type

In addition to containing Input types, member type may also contain Leaf types like `Scalar`s or `Enum`s.

* Objection: multiple Leaf types serialize the same way, making it impossible to distinguish the type without additional information. For example, a `String`, `ID` and `Enum`.
  * Potential solution: only allow a single built-in leaf type per input union.
* Objection: Output polymorphism is restricted to Object types only. Supporting Leaf types in Input polymorphism would create a new inconsistency.

### F) Changing field from an input type to a polymorphic type including that type is non-breaking

Since the input object type is now a member of the input union, existing input objects being sent through should remain valid.

* Objection: achieving this by indicating the default in the union (either explicitly or implicitly via the order) is undesirable as it may require multiple equivalent unions being created where only the default differs.
* Objection: achieving this by indicating a default type in the input field is verbose/potentially ugly.

### G) Input unions may include other input unions

To ease development.

### H) Input unions should accept plain data from clients

Clients should be able to pass "natural" input data to unions without
specially formatting it, adding extra metadata, or otherwise doing work.

### I) Input unions should be easy to upgrade from existing solutions

Many people in the wild are solving the need for input unions with validation at run-time (e.g. using the "tagged union" pattern). Formalising support for these existing patterns in a non-breaking way would enable existing schemas to become retroactively more type-safe.

### J) A GraphQL schema that supports input unions can be queried by older GraphQL clients

Preferably without loss of functionality.

### K) Input unions should be expressed efficiently in the query and on the wire

The less typing and fewer bytes transmitted, the better.

### L) Input unions should be performant for servers

Ideally a server does not have to do much computation to determine which concrete type is represented by an input.

## Use Cases

There have been a variety of use cases described by users asking for an abstract input type.

* [Observability Metrics](https://github.com/graphql/graphql-spec/pull/395#issuecomment-489495267)
* [Login Options](https://github.com/graphql/graphql-js/issues/207#issuecomment-228543259)
* [Abstract Syntax Tree](https://github.com/graphql/graphql-spec/pull/395#issuecomment-489611199)
* [Content Widgets](https://github.com/graphql/graphql-js/issues/207#issuecomment-308344371)
* [Filtering](https://github.com/graphql/graphql-spec/issues/202#issue-170560819)
* [Observability Cloud Integrations](https://gist.github.com/binaryseed/f2dd63d1a1406124be70c17e2e796891#cloud-integrations)
* [Observability Dashboards](https://gist.github.com/binaryseed/f2dd63d1a1406124be70c17e2e796891#dashboards)

## Prior art

Other technologies/languages also faced the same problems and there things we can learn from them:

* [Wiki article on Tagged_union](https://en.wikipedia.org/wiki/Tagged_union)
* [gRPC Oneof](https://developers.google.com/protocol-buffers/docs/proto3#oneof)

## Possible Solutions

Broadly speaking, there are two categories of solutions to the problem of type discrimination:

* Value-based discriminator field
* Structural discrimination

### Value-based discriminator field

These solutions rely the **value** of a specific input field to determine the concrete type.

#### Single `__typename` field; value is the `type`

This solution was discussed in https://github.com/graphql/graphql-spec/pull/395

```graphql
input CatInput {
  name: String!
  age: Int
  livesLeft: Int
}
input DogInput {
  name: String!
  age: Int
  breed: DogBreed
}

inputunion AnimalInput = CatInput | DogInput

type Mutation {
  logAnimalDropOff(location: String, animals: [AnimalInput!]!): Int
}

# Variables:
{
  location: "Portland, OR",
  animals: [
    {
      __typename: "CatInput",
      name: "Buster",
      livesLeft: 7
    }
  ]
}
```

##### Variations:

* A `default` type may be defined, for which specifying the `__typename` is not required. This enables a field to migration from an `Input` to an `Input Union`

#### Single user-chosen field; value is the `type`

```graphql
input CatInput {
  kind: CatInput
  name: String!
  age: Int
  livesLeft: Int
}
input DogInput {
  kind: DogInput
  name: String!
  age: Int
  breed: DogBreed
}

inputunion AnimalInput = CatInput | DogInput

type Mutation {
  logAnimalDropOff(location: String, animals: [AnimalInput!]!): Int
}

# Variables:
{
  location: "Portland, OR",
  animals: [
    {
      kind: "CatInput",
      name: "Buster",
      livesLeft: 7
    }
  ]
}
```

##### Problems:

* The discriminator field is non-sensical if the input is used _outside_ of an input union, or in multiple input unions.

##### Variations:

* Value is a `Enum` literal

This solution is derrived from discussions in https://github.com/graphql/graphql-spec/issues/488

```graphql
enum AnimalKind {
  CAT
  DOG
}

input CatInput {
  kind: AnimalKind::CAT
  name: String!
  age: Int
  livesLeft: Int
}
input DogInput {
  kind: AnimalKind::DOG
  name: String!
  age: Int
  breed: DogBreed
}

# Variables:
{
  location: "Portland, OR",
  animals: [
    {
      kind: "CAT",
      name: "Buster",
      livesLeft: 7
    }
  ]
}
```

* Value is a `String` literal

```graphql
input CatInput {
  kind: "cat"
  name: String!
  age: Int
  livesLeft: Int
}
input DogInput {
  kind: "dog"
  name: String!
  age: Int
  breed: DogBreed
}
```

##### Problems:

* The discriminator field is redundant if the input is used _outside_ of an input union.

### Structural discrimination

These solutions rely on the **structure** of the input to determine the concrete type.

#### Order based type matching

The concrete type is the first type in the input union definition that matches.

```graphql
input CatInput {
  name: String!
  age: Int
  livesLeft: Int
}
input DogInput {
  name: String!
  age: Int
  breed: DogBreed
}

inputunion AnimalInput = CatInput | DogInput

type Mutation {
  logAnimalDropOff(location: String, animals: [AnimalInput!]!): Int
}

# Variables:
{
  location: "Portland, OR",
  animals: [
    {
      name: "Buster",
      age: 3
      # => CatInput
    },
    {
      name: "Buster",
      age: 3,
      breed: "WHIPPET"
      # => DogInput
    }
  ]
}
```

#### Structural uniqueness

Schema Rule: Each type in the union must have a unique set of required field names

```graphql
input CatInput {
  name: String!
  age: Int
  livesLeft: Int!
}
input DogInput {
  name: String!
  age: Int
  breed: DogBreed!
}

inputunion AnimalInput = CatInput | DogInput

type Mutation {
  logAnimalDropOff(location: String, animals: [AnimalInput!]!): Int
}

# Variables:
{
  location: "Portland, OR",
  animals: [
    {
      name: "Buster",
      age: 3,
      livesLeft: 7
      # => CatInput
    },
    {
      name: "Buster",
      breed: "WHIPPET"
      # => DogInput
    }
  ]
}
```

An invalid schema:

```graphql
input CatInput {
  name: String!
  age: Int!
  livesLeft: Int
}
input DogInput {
  name: String!
  age: Int!
  breed: DogBreed
}
```

##### Problems:

* Inputs may be pushed to include extraneous fields


##### Variations:

* Consider the field _type_ along with the field _name_ when determining uniqueness.

#### One Of (Tagged Union)

This solution was presented in:
* https://github.com/graphql/graphql-spec/pull/395#issuecomment-361373097
* https://github.com/graphql/graphql-spec/pull/586

The type is discriminated using features already available, with an intermediate input type that acts to "tag" the field.

A proposed directive would specify that only one of the fields may be selected.

```graphql
input CatInput {
  name: String!
  age: Int!
  livesLeft: Int
}
input DogInput {
  name: String!
  age: Int!
  breed: DogBreed
}

input AnimalInput @oneOf {
  cat: CatInput
  dog: DogInput
}

type Mutation {
  logAnimalDropOff(location: String, animals: [AnimalInput!]!): Int
}

# Variables:
{
  location: "Portland, OR",
  animals: [
    cat: {
      name: "Buster",
      livesLeft: 7
    }
  ]
}
```

##### Problems:

* Forces data to be modeled with different structure for input and output types.
