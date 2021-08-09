# RFC: Implicit Inheritance


Related issues:
- [graphql-spec: Proposal: Implicitly include properties of implemented interfaces](https://github.com/graphql/graphql-spec/issues/533)
- [graphql-spec: [Proposal] Interface implementation violate "Don't Repeat Yourself"](https://github.com/graphql/graphql-spec/issues/500)
- [graphql-js: Thought: avoiding self-repitition when a schema is defined as a string](https://github.com/graphql/graphql-js/issues/703)

## Problem Statement

Currently, when defining an interface that implements another interface, the implementing interface must define each field that is specified by the implemented interface.  
If an interface contains more than a few properties and is used in multiple places, one ends up with a very significant amount of repetition of the same field definitions.
This becomes particularly apparent if you have deeper hierarchies of interfaces since fields are repeated on each level.
The following schema exhibits this exemplarily.

```graphql
interface Vehicle {
  id: ID!
  make: VehicleMake
  wheelCount: Int
  acceleration: Float
  topSpeed: Float
  mass: Float
}

interface Automobile implements Vehicle {
  id: ID!
  make: AutoMake
  wheelCount: Int
  acceleration: Float
  topSpeed: Float
  mass: Float
  engineCylinders: Int
  engineSize: Float
}

interface AutomobileForPersonTransfer implements Automobile {
  id: ID!
  make: AutoMake
  wheelCount: Int
  acceleration: Float
  topSpeed: Float
  mass: Float
  engineCylinders: Int
  engineSize: Float
  capacity: Int
}

type Bicycle implements Vehicle {
  id: ID!
  make: BicycleMake #
  wheelCount: Int
  acceleration: Float
  topSpeed: Float
  mass: Float
  capacity: Int
  gearCount: Int
}

type Car implements Vehicle & Automobile & AutomobileForPersonTransfer {
  id: ID!
  make: CarMake
  wheelCount: Int
  acceleration: Float
  topSpeed: Float
  mass: Float
  capacity: Int
  engineCylinders: Int
  engineSize: Float
  trunkSize: Float
}

type Motorcycle implements Vehicle & Automobile & AutomobileForPersonTransfer {
  id: ID!
  make: MotorcycleMake
  class: MotorcycleClass
  wheelCount: Int
  acceleration: Float
  topSpeed: SmallFloat
  mass: Float
  capacity: Int
  engineCylinders: Int
  engineSize: Float
}

type Truck implements Vehicle & Automobile {
  id: ID!
  make: TruckMake
  wheelCount: Int
  acceleration: Float
  topSpeed: Float
  mass: Float
  engineCylinders: Int
  engineSize: Float
  maxLoad: Float
}

```

The problems with the current behavior are:
- The DRY-principle is violated, resulting in well-known issues regarding maintainability and scalability.
  This becomes especially apparent if the fields are documented using comments, which need to be repeated and then maintained as well.
  While there is good support for compile-checking that fields are indeed repeated in the inheriting type, something like this is not possible for the documentation because differences might be intentional.
- If a field in an implementing type differs from the field in the interface, it is not clear if that is due to carelessness/omission or if it is an intended overwrite.
  The same applies to differences in documentation.   
- It is hard to recognize changes or overwrites (e.g. `topSpeed: SmallFloat` in `Motorcycle` doesn't stick out).
- Changes to a root interface require multiple repetitive changes in the implementing interfaces and types. 
- Since there is no indication that a field is inherited, readers who are already aware of the interface fields don't know what to "skip" when reading other types, so they waste time.
- The schema is longer due to the repetition, which makes reading the schema more intimidating and leads to skimming in place of actual reading.

## Proposed Solution

This RFC proposes that interface fields may be automatically inherited if they are not explicitly repeated in the implementing type.
Essentially, the proposal is to change [L890-L891](https://github.com/graphql/graphql-spec/blame/main/spec/Section%203%20--%20Type%20System.md#L890-L891) in `IsValidImplementation(type, implementedType)` from

> type must include a field of the same name for every field defined in implementedType.

to

> type may include a field of the same name for every field defined in implementedType.

Thus, types are no longer required to enumerate all fields from all implemented types, and missing fields are automatically copied into the type.
One can still specify a field in the implementing type, for example, narrow down the field's return type. 
For backwards compatibility and to include different preferences, it is still possible to specify exactly the same field in an implementing type so that existing schema are still valid. 

With these changes, the above example may be written as follows.
```graphql
interface Vehicle {
  id: ID!
  make: VehicleMake
  wheelCount: Int
  acceleration: Float
  topSpeed: Float
  mass: Float
}

interface Automobile implements Vehicle {
  engineCylinders: Int
  engineSize: Float
}

interface AutomobileForPersonTransfer implements Automobile {
  capacity: Int
}

type Bicycle implements Vehicle {
  make: BicycleMake # We can still overwrite fields if needed
  wheelCount: Int # Or repeat them 1:1, if preferred
  capacity: Int
  gearCount: Int
}

type Car implements AutomobileForPersonTransfer {
  make: CarMake
  trunkSize: Float
}

type Motorcycle implements AutomobileForPersonTransfer {
  make: MotorcycleMake
  topSpeed: SmallFloat
  class: MotorcycleClass
}

type Truck implements Automobile {
  make: TruckMake
  maxLoad: Float
}
```

## Advantages
- Fields that changed or that are new are highlighted and stand out, which makes reading and understanding the schema easier.
- No repetition in the definition of the fields.
- The schema is easier to scale and maintain.
  In particular, addition of new types implementing multiple interfaces is easier and doesn't involve copy & paste.
- Changes to interface stay mostly local to that interface.
  That is, addition or change of a field in an interface for the most part doesn't require changes in the implementing types.
- Interfaces can be used as a kind of `fragment` on the schema-side by extracting common structures and making them easy to reuse. 
- Shorter schema, which require less writing and are easier to skim/read.
- Aligns with the handling of interfaces in other object-oriented languages such as TypeScript and with, e.g., the documentation of the Github GraphQL API which doesn't include inherited fields, see [for example](https://docs.github.com/en/graphql/reference/objects#issue).
  Following established conventions leads to an easier knowledge transfer.
  Moreover, it also aligns the way the schema is defined with other alternatives to SDL like [TypeGraphQL](https://typegraphql.com/).

## Disadvantages
- It is no longer possible to immediately see all fields that are provided by a type (without traversing the inheritance hierarchy), which makes reading the schema more challenging in some aspects.
- If a type inherits multiple interfaces that declare a field with different but compatible types, the resulting type is not immediately clear.  

It should be noted that these disadvantages can mostly be mitigated using tools or IDE integrations that can easily determine all fields on the fly.

## Evaluation against [guiding principles](https://github.com/graphql/graphql-spec/blob/main/CONTRIBUTING.md#guiding-principles)
- Backwards compatibility: ✅

  Existing queries and schema are still valid.
  
- Performance is a feature: ✅⚠️

  There are no runtime issues, as schema are usually not used at runtime.
  During compilation or schema parsing, there is a small additional overhead since one needs to traverse the inheritance hierarchy to determine all fields of a type.
  This cost is of the order of the existing check that all fields from interfaces are indeed repeated, which is no longer necessary.
  Thus there shouldn't be any noticeable negative performance impact.

- Favor no change: ✅

  The proposed changes are very minimal and do not require any new keywords or changes in parsing.
  
- Enable new capabilities motivated by real use cases: ✅

  Maintainability and scalability of the schema are improved.

- Simplicity and consistency over expressiveness and terseness: ✅

  The schema simplifies considerably, and the new behavior is consistent with other established object-oriented programming languages.
  On the other hand, the existing behavior is more expressive.

- Preserve option value: ✅

  Since the proposed changes are essentially a relaxation of limits of the current rules (must => may), it opens more options now and in the future.

- Understandability is just as important as correctness: ✅

  The GraphQL spec stay almost unchanged by the proposed changes (must => may).

## Other relevant points, often mentioned in this context
- An interesting difference of the two approaches is if a field is removed from an interface.

  In the current implementation, one needs to manually go through each implementing type to remove the field there as well after double-checking.
  On the other hand, if fields are automatically inherited, one needs to manually go through each implementing type to readd the field if necessary.    
- A common argument against the automatic inheritance is the principle "Favor reading over writing".

  With the rising popularity of schema explorer such as GraphiQL, GraphQL Playground or Apollo Studio Explorer, it may be argued that developers mainly use the SDL to write the schema and consume it via other ways.
  This, depends strongly on the preference of the team and which kind of tools are used.
  The proposed changes give teams the possibility to choose which option is best for them and then enforce this decision, for example, using build tools such as eslint.

## Alternatives
- Use a new keyword such as `extends` to signal that fields should be automatically inherited.
- Post-process a schema to automatically add fields that are not repeated.
  Such an approach is taken by [node-graphql-partials](https://github.com/Sydsvenskan/node-graphql-partials), using new concepts `partial` (similar to `interface`) and `using` (similar to `implements`).
