# Validation

GraphQL does not just verify if a request is syntactically correct.

Prior to execution, it can also verify that a request is valid
within the context of a given GraphQL schema. Validation is primarily
targeted at development-time tooling. Any client-side tooling
should return errors and not allow the formulation of queries
known to violate the type system at a given point in time.

Total request validation on the server-side during execution is optional. As
schemas and systems change over time existing clients may end up emitting
queries that are no longer valid given the current type system.  Servers
(as described in the Execution section of this spec) attempt to satisfy as
much as the request as possible and continue to execute in the presence
of type system errors rather than cease execution completely.

For this section of this schema, we will assume the following type system
in order to demonstrate examples:

```
enum DogCommand { SIT, DOWN, HEEL }

type Dog implements Pet {
  name: String!
  nickname: String
  barkVolume: Int
  doesKnowCommand(dogCommand: DogCommand!) : Boolean!
  isHousetrained(atOtherHomes: Boolean): Boolean!
  owner: Human
}

interface Sentient {
  name: String!
}

interface Pet {
  name: String!
}

type Alien implements Sentient {
  name: String!
  homePlanet: String
}

type Human implements Sentient {
  name: String!
}

enum CatCommand { JUMP }

type Cat implements Pet {
  name: String!
  nickname: String
  doesKnowCommand(catCommand: CatCommand!) : Boolean!
  meowVolume: Int
}

union CatOrDog = Cat | Dog
union DogOrHuman = Dog | Human
union HumanOrAlien = Human | Alien

type QueryRoot {
  dog: Dog
}
```

## Operations

### Named Operation Definitions

#### Operation Name Uniqueness

** Formal Specification **

  * For each operation definition {operation} in the document
  * Let {operationName} be the name of {operation}.
  * If {operationName} exists
    * Let {operations} be all operation definitions in the document named {operationName}.
    * {operations} must be a set of one.

** Explanatory Text **

Each named operation definitions must be unique within a document when referred
to by its name.

For example the following document is valid:

```graphql
query getDogName {
  dog {
    name
  }
}

query getOwnerName {
  dog {
    owner {
      name
    }
  }
}
```

While this document is invalid:

```!graphql
query getName {
  dog {
    name
  }
}

query getName {
  dog {
    owner {
      name
    }
  }
}
```

### Anonymous Operation Definitions

#### Lone Anonymous Operation

** Formal Specification **

  * Let {operations} be all anonymous operation definitions in the document.
  * {operations} must be a set of one.

** Explanatory Text **

GraphQL allows a short-hand form for defining query operations when only that
one operation exists in the document.

For example the following document is valid:

```graphql
{
  dog {
    name
  }
}
```

While this document is invalid:

```!graphql
{
  dog {
    name
  }
}

query getName {
  dog {
    owner {
      name
    }
  }
}
```

## Fields

### Field Selections on Objects, Interfaces, and Unions Types

** Formal Specification **

  * For each {selection} in the document.
  * Let {fieldName} be the target field of {selection}
  * {fieldName} must be defined on type in scope

** Explanatory Text **

The target field of a field selection must defined on the scoped type of the
selection set. There are no limitations on alias names.

For example the following fragment would not pass validation:

```!graphql
fragment fieldNotDefined on Dog {
  meowVolume
}

fragment aliasedLyingFieldTargetNotDefined on Dog {
  barkVolume: kawVolume
}
```

For interfaces, direct field selection can only be done on fields. Fields
of concrete implementors is not relevant to the validity of the given
interface-typed selection set.

For example, the following is valid:

```graphql
fragment interfaceFieldSelection on Pet {
  name
}
```

and the following is invalid:

```!graphql
fragment definedOnImplementorsButNotInterface on Pet {
  nickname
}
```

Because unions do not define fields, fields may not be directly selected from a
union-typed selection set, with the exception of the meta-field {__typename}.
Fields from a union-typed selection set must only be queried indirectly via
a fragment.

For example the following is valid:

```graphql
fragment inDirectFieldSelectionOnUnion on CatOrDog {
  __typename
  ... on Pet {
    name
  }
  ... on Dog {
    barkVolume
  }
}
```

But the following is invalid:

```!graphql
fragment directFieldSelectionOnUnion on CatOrDog {
  name
  barkVolume
}
```

### Field Selection Merging

** Formal Specification **

  * Let {set} be any selection set defined in the GraphQL document
  * Let {fieldsForName} be the set of selections with a given response name in
    {set} including visiting fragments and inline fragments.
  * Given each pair of members {fieldA} and {fieldB} in {fieldsForName}:
    * If the parent types of {fieldA} and {fieldB} are equal or if either is not
      an Object Type:
      * {fieldA} and {fieldB} must have identical field names.
      * {fieldA} and {fieldB} must have identical return type.
      * {fieldA} and {fieldB} must have identical sets of arguments.

** Explanatory Text **

If multiple fields selections with the same response names are encountered
during execution, the result should be unambiguous. Therefore any two field
selections which might both be encountered for the same object are only valid if
they are equivalent.

For simple hand-written GraphQL, this rule is obviously a clear developer error,
however nested fragments can make this difficult to detect manually.

The following selections correctly merge:

```graphql
fragment mergeIdenticalFields on Dog {
  name
  name
}

fragment mergeIdenticalAliasesAndFields on Dog {
  otherName: name
  otherName: name
}
```

The following is not able to merge:

```!graphql
fragment conflictingBecauseAlias on Dog {
  name: nickname
  name
}
```

Identical arguments are also merged if they have identical arguments. Both
values and variables can be correctly merged.

For example the following correctly merge:

```graphql
fragment mergeIdenticalFieldsWithIdenticalArgs on Dog {
  doesKnowCommand(dogCommand: SIT)
  doesKnowCommand(dogCommand: SIT)
}

fragment mergeIdenticalFieldsWithIdenticalValues on Dog {
  doesKnowCommand(dogCommand: $dogCommand)
  doesKnowCommand(dogCommand: $dogCommand)
}
```

The following do not correctly merge:

```!graphql
fragment conflictingArgsOnValues on Dog {
  doesKnowCommand(dogCommand: SIT)
  doesKnowCommand(dogCommand: HEEL)
}

fragment conflictingArgsValueAndVar on Dog {
  doesKnowCommand(dogCommand: SIT)
  doesKnowCommand(dogCommand: $dogCommand)
}

fragment conflictingArgsWithVars on Dog {
  doesKnowCommand(dogCommand: $varOne)
  doesKnowCommand(dogCommand: $varTwo)
}

fragment differingArgs on Dog {
  doesKnowCommand(dogCommand: SIT)
  doesKnowCommand
}
```

The following would not merge together, however both cannot be encountered
against the same object:

```graphql
fragment safeDifferingFields on Pet {
  ... on Dog {
    name: nickname
  }
  ... on Cat {
    name
  }
}

fragment safeDifferingArgs on Pet {
  ... on Dog {
    doesKnowCommand(dogCommand: SIT)
  }
  ... on Cat {
    doesKnowCommand(catCommand: JUMP)
  }
}
```

### Leaf Field Selections

** Formal Specification **

  * For each {selection} in the document
  * Let {selectionType} be the result type of {selection}
  * If {selectionType} is a scalar:
    * The subselection set of that selection must be empty
  * If {selectionType} is an interface, union, or object
    * The subselection set of that selection must NOT BE empty

** Explanatory Text **

Field selections on scalars are never allowed: scalars
are the leaf nodes of any GraphQL query.

The following is valid.

```graphql
fragment scalarSelection on Dog {
  barkVolume
}
```

The following is invalid.

```!graphql
fragment scalarSelectionsNotAllowedOnBoolean on Dog {
  barkVolume {
    sinceWhen
  }
}
```

Conversely the leaf field selections of GraphQL queries
must be scalars. Leaf selections on objects, interfaces,
and unions without subfields are disallowed.

Let's assume the following additions to the query root type of the schema:

```
extend type QueryRoot {
  human: Human
  pet: Pet
  catOrDog: CatOrDog
}
```

The following examples are invalid

```!graphql
query directQueryOnObjectWithoutSubFields {
  human
}

query directQueryOnInterfaceWithoutSubFields {
  pet
}

query directQueryOnUnionWithoutSubFields {
  catOrDog
}
```

## Arguments

Arguments are provided to both fields and directives. The following validation
rules apply in both cases.

### Argument Names

** Formal Specification **

  * For each {argument} in the document
  * Let {argumentName} be the Name of {argument}.
  * Let {argumentDefinition} be the argument definition provided by the parent field or definition named {argumentName}.
  * {argumentDefinition} must exist.

** Explanatory Text **

Every argument provided to a field or directive must be defined in the set of
possible arguments of that field or directive.

For example the following are valid:

```graphql
fragment argOnRequiredArg on Dog {
  doesKnowCommand(dogCommand: SIT)
}

fragment argOnOptional on Dog {
  isHousetrained(atOtherHomes: true) @include(if: true)
}
```

the following is invalid since `command` is not defined on `DogCommand`.

```!graphql
fragment invalidArgName on Dog {
  doesKnowCommand(command: CLEAN_UP_HOUSE)
}
```

and this is also invalid as `unless` is not defined on `@include`.

```!graphql
fragment invalidArgName on Dog {
  isHousetrained(atOtherHomes: true) @include(unless: false)
}
```

In order to explore more complicated argument examples, let's add the following
to our type system:

```
type Arguments {
  multipleReqs(x: Int!, y: Int!): Int!
  booleanArgField(booleanArg: Boolean): Boolean
  floatArgField(floatArg: Float): Float
  intArgField(intArg: Int): Int
  nonNullBooleanArgField(nonNullBooleanArg: Boolean!): Boolean!
  booleanListArgField(booleanListArg: [Boolean]!): [Boolean]
}

extend type QueryRoot {
  arguments: Arguments
}
```

Order does not matter in arguments. Therefore both the following example are valid.

```graphql
fragment multipleArgs on Arguments {
  multipleReqs(x: 1, y: 2)
}

fragment multipleArgsReverseOrder on Arguments {
  multipleReqs(y: 1, x: 2)
}
```

### Argument Uniqueness

Fields and directives treat arguments as a mapping of argument name to value.
More than one argument with the same name in an argument set is ambiguous
and invalid.

** Formal Specification **

  * For each {argument} in the Document.
  * Let {argumentName} be the Name of {argument}.
  * Let {arguments} be all Arguments named {argumentName} in the Argument Set which contains {argument}.
  * {arguments} must be the set containing only {argument}.

### Argument Values Type Correctness

#### Compatible Values

** Formal Specification **

  * For each {argument} in the document
  * Let {value} be the Value of {argument}
  * If {value} is not a Variable
    * Let {argumentName} be the Name of {argument}.
    * Let {argumentDefinition} be the argument definition provided by the parent field or definition named {argumentName}.
    * Let {type} be the type expected by {argumentDefinition}.
    * The type of {literalArgument} must be coercible to {type}.

** Explanatory Text **

Literal values must be compatible with the type defined by the argument they are
being provided to, as per the coercion rules defined in the Type System chapter.

For example, an Int can be coerced into a Float.

```graphql
fragment goodBooleanArg on Arguments {
  booleanArgField(booleanArg: true)
}

fragment coercedIntIntoFloatArg on Arguments {
  floatArgField(floatArg: 1)
}
```

An incoercible conversion, is string to int. Therefore, the
following example is invalid.

```!graphql
fragment stringIntoInt on Arguments {
  intArgField(intArg: "3")
}
```

#### Required Arguments

  * For each Field or Directive in the document.
  * Let {arguments} be the arguments provided by the Field or Directive.
  * Let {argumentDefinitions} be the set of argument definitions of that Field or Directive.
  * For each {definition} in {argumentDefinitions}
    * Let {type} be the expected type of {definition}
    * If {type} is Non-Null
      * Let {argumentName} be the name of {definition}
      * Let {argument} be the argument in {arguments} named {argumentName}
      * {argument} must exist.

** Explanatory Text **

Arguments can be required. Arguments are required if the type of the argument
is non-null. If it is not non-null, the argument is optional.

For example the following are valid:

```graphql
fragment goodBooleanArg on Arguments {
  booleanArgField(booleanArg: true)
}

fragment goodNonNullArg on Arguments {
  nonNullBooleanArgField(nonNullBooleanArg: true)
}
```

The argument can be omitted from a field with a nullable argument.

Therefore the following query is valid:

```graphql
fragment goodBooleanArgDefault on Arguments {
  booleanArgField
}
```

but this is not valid on a non-null argument.

```!graphql
fragment missingRequiredArg on Arguments {
  nonNullBooleanArgField
}
```

## Fragments

### Fragment Declarations

#### Fragment Name Uniqueness

** Formal Specification **

  * For each fragment definition {fragment} in the document
  * Let {fragmentName} be the name of {fragment}.
  * Let {fragments} be all fragment definitions in the document named {fragmentName}.
  * {fragments} must be a set of one.

** Explanatory Text **

Fragment definitions are referenced in fragment spreads by name. To avoid
ambiguity, each fragment's name must be unique within a document.

Inline fragments are not considered fragment definitions, and are unaffected by this
validation rule.

For example the following document is valid:

```graphql
{
  dog {
    ...fragmentOne
    ...fragmentTwo
  }
}

fragment fragmentOne on Dog {
  name
}

fragment fragmentTwo on Dog {
  owner {
    name
  }
}
```

While this document is invalid:

```!graphql
{
  dog {
    ...fragmentOne
  }
}

fragment fragmentOne on Dog {
  name
}

fragment fragmentOne on Dog {
  owner {
    name
  }
}
```

#### Fragment Spread Type Existence

** Formal Specification **

  * For each named spread {namedSpread} in the document
  * Let {fragment} be the target of {namedSpread}
  * The target type of {fragment} must be defined in the schema

** Explanatory Text **

Fragments must be specified on types that exist in the schema. This
applies for both named and inline fragments. If they are
not defined in the schema, the query does not validate.

For example the following fragments are valid:

```graphql
fragment correctType on Dog {
  name
}

fragment inlineFragment on Dog {
  ... on Dog {
    name
  }
}

fragment inlineFragment2 on Dog {
  ... @include(if: true) {
    name
  }
}
```

and the following do not validate:

```!graphql
fragment notOnExistingType on NotInSchema {
  name
}

fragment inlineNotExistingType on Dog {
  ... on NotInSchema {
    name
  }
}
```

#### Fragments On Composite Types

** Formal Specification **

  * For each {fragment} defined in the document.
  * The target type of fragment must have kind {UNION}, {INTERFACE}, or
    {OBJECT}.

** Explanatory Text **

Fragments can only be declared on unions, interfaces, and objects. They are
invalid on scalars. They can only be applied on non-leaf fields. This rule
applies to both inline and named fragments.

The following fragment declarations are valid:

```graphql
fragment fragOnObject on Dog {
  name
}

fragment fragOnInterface on Pet {
  name
}

fragment fragOnUnion on CatOrDog {
  ... on Dog {
    name
  }
}
```

and the following are invalid:

```!graphql
fragment fragOnScalar on Int {
  something
}

fragment inlineFragOnScalar on Dog {
  ... on Boolean {
    somethingElse
  }
}
```

#### Fragments Must Be Used

** Formal Specification **

  * For each {fragment} defined in the document.
  * {fragment} must be the target of at least one spread in the document

** Explanatory Text **

Defined fragments must be used within a query document.

For example the following is an invalid query document:

```!graphql
fragment nameFragment on Dog { # unused
  name
}

{
  dog {
    name
  }
}
```

### Fragment Spreads

Field selection is also determined by spreading fragments into one
another. The selection set of the target fragment is unioned with
the selection set at the level at which the target fragment is
referenced.

#### Fragment spread target defined

** Formal Specification **

  * For every {namedSpread} in the document.
  * Let {fragment} be the target of {namedSpread}
  * {fragment} must be defined in the document

** Explanatory Text **

Named fragment spreads must refer to fragments defined
within the document.  If the target of a spread is
not defined, this is an error:

```!graphql
{
  dog {
    ...undefinedFragment
  }
}
```

#### Fragment spreads must not form cycles

** Formal Specification **

  * For each {fragmentDefinition} in the document
  * Let {visited} be the empty set.
  * {DetectCycles(fragmentDefinition, visited)}

{DetectCycles(fragmentDefinition, visited)} :
  * Let {spreads} be all fragment spread descendants of {fragmentDefinition}
  * For each {spread} in {spreads}
    * {visited} must not contain {spread}
    * Let {nextVisited} be the set including {spread} and members of {visited}
    * Let {nextFragmentDefinition} be the target of {spread}
    * {DetectCycles(nextFragmentDefinition, nextVisited)}

** Explanatory Text **

The graph of fragment spreads must not form any cycles including spreading itself.
Otherwise an operation could infinitely spread or infinitely execute on cycles
in the underlying data.

This invalidates fragments that would result in an infinite spread:

```!graphql
{
  dog {
    ...nameFragment
  }
}

fragment nameFragment on Dog {
  name
  ...barkVolumeFragment
}

fragment barkVolumeFragment on Dog {
  barkVolume
  ...nameFragment
}
```

If the above fragments were inlined, this would result in the infinitely large:

```graphql
{
  dog {
    name
    barkVolume
    name
    barkVolume
    name
    barkVolume
    name
    # forever...
  }
}
```

This also invalidates fragments that would result in an infinite recursion when
executed against cyclic data:

```!graphql
{
  dog {
    ...dogFragment
  }
}

fragment dogFragment on Dog {
  name
  owner {
    ...ownerFragment
  }
}

fragment ownerFragment on Dog {
  name
  pets {
    ...dogFragment
  }
}
```

#### Fragment spread is possible

** Formal Specification **

  * For each {spread} (named or inline) defined in the document.
  * Let {fragment} be the target of {spread}
  * Let {fragmentType} be the type condition of {fragment}
  * Let {parentType} be the type of the selection set containing {spread}
  * Let {applicableTypes} be the intersection of
    {GetPossibleTypes(fragmentType)} and {GetPossibleTypes(parentType)}
  * {applicableTypes} must not be empty.

GetPossibleTypes(type) :
  * If {type} is an object type, return a set containing {type}
  * If {type} is an interface type, return the set of types implementing {type}
  * If {type} is a union type, return the set of possible types of {type}

** Explanatory Text **

Fragments are declared on a type and will only apply when the
runtime object type matches the type condition. They also are
spread within the context of a parent type. A fragment spread
is only valid if its type condition could ever apply within
the parent type.

##### Object Spreads In Object Scope

In the scope of an object type, the only valid object type
fragment spread is one that applies to the same type that
is in scope.

For example

```graphql
fragment dogFragment on Dog {
  ... on Dog {
    barkVolume
  }
}
```

and the following is invalid

```!graphql
fragment catInDogFragmentInvalid on Dog {
  ... on Cat {
    meowVolume
  }
}
```

##### Abstract Spreads in Object Scope

In scope of an object type, unions or interface spreads can be used
if the object type implements the interface or is a member of the union.

For example

```graphql
fragment petNameFragment on Pet {
  name
}

fragment interfaceWithinObjectFragment on Dog {
  ...petNameFragment
}
```

is valid because {Dog} implements Pet.

Likewise

```graphql
fragment catOrDogNameFragment on CatOrDog {
  ... on Cat {
    meowVolume
  }
}

fragment unionWithObjectFragment on Dog {
  ...catOrDogNameFragment
}
```

is valid because {Dog} is a member of the {CatOrDog} union. It is worth
noting that if one inspected the contents of the {CatOrDogNameFragment}
you could note that the no valid results would ever be returned. However
we do not specify this as invalid because we only consider the fragment
declaration, not its body.

##### Object Spreads In Abstract Scope

Union or interface spreads can be used within the context of an object type
fragment, but only if the object type is one of the possible types of the
that interface or union.

For example, the following fragments are valid:

```graphql
fragment petFragment on Pet {
  name
  ... on Dog {
    barkVolume
  }
}

fragment catOrDogFragment on CatOrDog {
  ... on Cat {
    meowVolume
  }
}
```

{petFragment} is valid because {Dog} implements the interface {Pet}.
{catOrDogFragment} is valid because {Cat} is a member of the
{CatOrDog} union.

By contrast the following fragments are invalid:

```!graphql
fragment sentientFragment on Sentient {
  ... on Dog {
    barkVolume
  }
}

fragment humanOrAlienFragment on HumanOrAlien {
  ... on Cat {
    meowVolume
  }
}
```

{Dog} does not implement the interface {Sentient} and therefore
{sentientFragment} can never return meaningful results. Therefore the fragment
is invalid. Likewise {Cat} is not a member of the union {HumanOrAlien}, and it
can also never return meaningful results, making it invalid.

##### Abstract Spreads in Abstract Scope

Union or interfaces fragments can be used within each other. As long as there
exists at least *one* object type that exists in the intersection of the
possible types of the scope and the spread, the spread is considered valid.

So for example

```graphql
fragment unionWithInterface on Pet {
  ...dogOrHumanFragment
}

fragment dogOrHumanFragment on DogOrHuman {
  ... on Dog {
    barkVolume
  }
}
```

is consider valid because {Dog} implements interface {Pet} and is a
member of {DogOrHuman}.

However

```!graphql
fragment nonIntersectingInterfaces on Pet {
  ...sentientFragment
}

fragment sentientFragment on Sentient {
  name
}
```

is not valid because there exists no type that implements both {Pet}
and {Sentient}.

## Values

### Input Object Field Uniqueness

** Formal Specification **

  * For each input object value {inputObject} in the document.
  * For every {inputField} in {inputObject}
    * Let {name} be the Name of {inputField}.
    * Let {fields} be all Input Object Fields named {name} in {inputObject}.
    * {fields} must be the set containing only {inputField}.

** Explanatory Text **

Input objects must not contain more than one fields of the same name, otherwise
an amgibuity would exist which includes an ignored portion of syntax.

For example the following query will not pass validation.

```!graphql
{
  field(arg: { field: true, field: false })
}
```

## Directives

### Directives Are Defined

** Formal Specification **

  * For every {directive} in a document.
  * Let {directiveName} be the name of {directive}.
  * Let {directiveDefinition} be the directive named {directiveName}.
  * {directiveDefinition} must exist.

** Explanatory Text **

GraphQL servers define what directives they support. For each
usage of a directive, the directive must be available on that server.

## Variables

### Variable Uniqueness

** Formal Specification **

  * For every {operation} in the document
    * For every {variable} defined on {operation}
      * Let {variableName} be the name of {variable}
      * Let {variables} be the set of all variables named {variableName} on
        {operation}
      * {variables} must be a set of one

** Explanatory Text **

If any operation defines more than one variable with the same name, it is
ambiguous and invalid. It is invalid even if the type of the duplicate variable
is the same.

```!graphql
query houseTrainedQuery($atOtherHomes: Boolean, $atOtherHomes: Boolean) {
  dog {
    isHousetrained(atOtherHomes: $atOtherHomes)
  }
}
```


It is valid for multiple operations to define a variable with the same name. If
two operations reference the same fragment, it might actually be necessary:

```graphql
query A($atOtherHomes: Boolean) {
  ...HouseTrainedFragment
}

query B($atOtherHomes: Boolean) {
  ...HouseTrainedFragment
}

fragment HouseTrainedFragment {
  dog {
    isHousetrained(atOtherHomes: $atOtherHomes)
  }
}
```


### Variable Default Values Are Correctly Typed

** Formal Specification **

  * For every {operation} in a document
  * For every {variable} on each {operation}
    * Let {variableType} be the type of {variable}
    * If {variableType} is non-null it cannot have a default value
    * If {variable} has a default value it must be of the same types
      or able to be coerced to {variableType}

** Explanatory Text **

Variables defined by operations are allowed to define default values
if the type of that variable is not non-null.

For example the following query will pass validation.

```graphql
query houseTrainedQuery($atOtherHomes: Boolean = true) {
  dog {
    isHousetrained(atOtherHomes: $atOtherHomes)
  }
}
```

However if the variable is defined as non-null, default values
are unreachable. Therefore queries such as the following fail
validation

```!graphql
query houseTrainedQuery($atOtherHomes: Boolean! = true) {
  dog {
    isHousetrained(atOtherHomes: $atOtherHomes)
  }
}
```

Default values must be compatible with the types of variables.
Types must match or they must be coercible to the type.

Non-matching types fail, such as in the following example:

```!graphql
query houseTrainedQuery($atOtherHomes: Boolean = "true") {
  dog {
    isHousetrained(atOtherHomes: $atOtherHomes)
  }
}
```

However if a type is coercible the query will pass validation.

For example:

```graphql
query intToFloatQuery($floatVar: Float = 1) {
  arguments {
    floatArgField(floatArg: $floatVar)
  }
}
```

### Variables Are Input Types

** Formal Specification **

  * For every {operation} in a {document}
  * For every {variable} on each {operation}
    * Let {variableType} be the type of {variable}
    * While {variableType} is {LIST} or {NON_NULL}
      * Let {variableType} be the referenced type of {variableType}
    * {variableType} must of kind {SCALAR}, {ENUM} or {INPUT_OBJECT}

** Explanatory Text **

Variables can only be scalars, enums, input objects, or lists and non-null
variants of those types. These are known as input types. Object, unions,
and interfaces cannot be used as inputs.

For these examples, consider the following typesystem additions:

```
input ComplexInput { name: String, owner: String }

extend type QueryRoot {
  findDog(complex: ComplexInput): Dog
  booleanList(booleanListArg: [Boolean!]): Boolean
}
```

The following queries are valid:

```graphql
query takesBoolean($atOtherHomes: Boolean) {
  dog {
    isHousetrained(atOtherHomes: $atOtherHomes)
  }
}

query takesComplexInput($complexInput: ComplexInput) {
  findDog(complex: $complexInput) {
    name
  }
}

query TakesListOfBooleanBang($booleans: [Boolean!]) {
  booleanList(booleanListArg: $booleans)
}
```

The following queries are invalid:

```!graphql
query takesCat($cat: Cat) {
  # ...
}

query takesDogBang($dog: Dog!) {
  # ...
}

query takesListOfPet($pets: [Pet]) {
  # ...
}

query takesCatOrDog($catOrDog: CatOrDog) {
  # ...
}
```

### All Variable Uses Defined

** Formal Specification **

  * For each {operation} in a document
    * For each {variableUsage} in scope, variable must be operation's variable list.
    * Let {fragments} be every fragment reference by that operation transitively
    * For each {fragment} in {fragments}
      * For each {variableUsage} in scope of {fragment}, variable must be
        {operation}'s variable list.

** Explanatory Text **

Variables are scoped on a per-operation basis. That means that any variable
used within the context of a operation must be defined at the top level of that
operation

For example:

```graphql
query variableIsDefined($atOtherHomes: Boolean) {
  dog {
    isHousetrained(atOtherHomes: $atOtherHomes)
  }
}
```

is valid. ${atOtherHomes} is defined by the operation.

By contrast the following query is invalid:

```!graphql
query variableIsNotDefined {
  dog {
    isHousetrained(atOtherHomes: $atOtherHomes)
  }
}
```

${atOtherHomes} is not defined by the operation.

Fragments complicate this rule. Any fragment transitively included by an
operation has access to the variables defined by that operation. Fragments
can appear within multiple operations and therefore variable usages
must correspond to variable definitions in all of those operations.

For example the following is valid:

```graphql
query variableIsDefinedUsedInSingleFragment($atOtherHomes: Boolean) {
  dog {
    ...isHousetrainedFragment
  }
}

fragment isHousetrainedFragment on Dog {
  isHousetrained(atOtherHomes: $atOtherHomes)
}
```

since {isHousetrainedFragment} is used within the context of the operation
{variableIsDefinedUsedInSingleFragment} and the variable is defined by that
operation.

On the contrary is a fragment is included within an operation that does
not define a referenced variable, this is a validation error.

```!graphql
query variableIsNotDefinedUsedInSingleFragment {
  dog {
    ...isHousetrainedFragment
  }
}

fragment isHousetrainedFragment on Dog {
  isHousetrained(atOtherHomes: $atOtherHomes)
}
```

This applies transitively as well, so the following also fails:

```!graphql
query variableIsNotDefinedUsedInNestedFragment {
  dog {
    ...outerHousetrainedFragment
  }
}

fragment outerHousetrainedFragment on Dog {
  ...isHousetrainedFragment
}

fragment isHousetrainedFragment on Dog {
  isHousetrained(atOtherHomes: $atOtherHomes)
}
```

Variables must be defined in all operations in which a fragment
is used.

```graphql
query housetrainedQueryOne($atOtherHomes: Boolean) {
  dog {
    ...isHousetrainedFragment
  }
}

query housetrainedQueryTwo($atOtherHomes: Boolean) {
  dog {
    ...isHousetrainedFragment
  }
}

fragment isHousetrainedFragment on Dog {
  isHousetrained(atOtherHomes: $atOtherHomes)
}
```

However the following does not validate:

```!graphql
query housetrainedQueryOne($atOtherHomes: Boolean) {
  dog {
    ...isHousetrainedFragment
  }
}

query housetrainedQueryTwoNotDefined {
  dog {
    ...isHousetrainedFragment
  }
}

fragment isHousetrainedFragment on Dog {
  isHousetrained(atOtherHomes: $atOtherHomes)
}
```

This is because {housetrainedQueryTwoNotDefined} does not define
a variable ${atOtherHomes} but that variable is used by {isHousetrainedFragment}
which is included in that operation.

### All Variables Used

** Formal Specification **

  * For every {operation} in the document.
  * Let {variables} be the variables defined by that {operation}
  * Each {variable} in {variables} must be used at least once in either
    the operation scope itself or any fragment transitively referenced by that
    operation.

** Explanatory Text **

All variables defined by an operation must be used in that operation or a
fragment transitively included by that operation. Unused variables cause
a validation error.

For example the following is invalid:

```!graphql
query variableUnused($atOtherHomes: Boolean) {
  dog {
    isHousetrained
  }
}
```

because ${atOtherHomes} in not referenced.

These rules apply to transitive fragment spreads as well:

```graphql
query variableUsedInFragment($atOtherHomes: Boolean) {
  dog {
    ...isHousetrainedFragment
  }
}

fragment isHousetrainedFragment on Dog {
  isHousetrained(atOtherHomes: $atOtherHomes)
}
```

The above is valid since ${atOtherHomes} is used in {isHousetrainedFragment}
which is included by {variableUsedInFragment}.

If that fragment did not have a reference to ${atOtherHomes} it would be not valid:

```!graphql
query variableNotUsedWithinFragment($atOtherHomes: Boolean) {
  ...isHousetrainedWithoutVariableFragment
}

fragment isHousetrainedWithoutVariableFragment on Dog {
  isHousetrained
}
```

All operations in a document must use all of their variables.

As a result, the following document does not validate.

```!graphql
query queryWithUsedVar($atOtherHomes: Boolean) {
  dog {
    ...isHousetrainedFragment
  }
}

query queryWithExtraVar($atOtherHomes: Boolean, $extra: Int) {
  dog {
    ...isHousetrainedFragment
  }
}

fragment isHousetrainedFragment on Dog {
  isHousetrained(atOtherHomes: $atOtherHomes)
}
```

This document is not valid because {queryWithExtraVar} defines
an extraneous variable.

### All Variable Usages are Allowed

** Formal Specification **

  * For each {operation} in {document}
  * Let {variableUsages} be all usages transitively included in the {operation}
  * For each {variableUsage} in {variableUsages}
    * Let {variableType} be the type of variable definition in the operation
    * Let {argumentType} be the type of the argument the variable is passed to.
    * Let {hasDefault} be true if the variable definition defines a default.
    * AreTypesCompatible({argumentType}, {variableType}, {hasDefault}) must be true

  * AreTypesCompatible({argumentType}, {variableType}, {hasDefault}):
    * If {hasDefault} is true, treat the {variableType} as non-null.
    * If inner type of {argumentType} and {variableType} be different, return false
    * If {argumentType} and {variableType} have different list dimensions, return false
    * If any list level of {variableType} is not non-null, and the corresponding level
      in {argument} is non-null, the types are not compatible.

** Explanatory Text **

Variable usages must be compatible with the arguments they are passed to.

Validation failures occur when variables are used in the context of types
that are complete mismatches, or if a nullable type in a variable is passed to
a not-null argument type.

Types must match:

```!graphql
query intCannotGoIntoBoolean($intArg: Int) {
  arguments {
    booleanArgField(booleanArg: $intArg)
  }
}
```

${intArg} typed as {Int} cannot be used as a argument to {booleanArg}, typed as {Boolean}.

List cardinality must also be the same. For example, lists cannot be passed into singular
values.

```!graphql
query booleanListCannotGoIntoBoolean($booleanListArg: [Boolean]) {
  arguments {
    booleanArgField(booleanArg: $booleanListArg)
  }
}
```

Nullability must also be respected. In general a nullable variable cannot
be passed to a non-null argument.

```!graphql
query booleanArgQuery($booleanArg: Boolean) {
  arguments {
    nonNullBooleanArgField(nonNullBooleanArg: $booleanArg)
  }
}
```

A notable exception is when default arguments are provided. They are, in effect,
treated as non-nulls.

```graphql
query booleanArgQueryWithDefault($booleanArg: Boolean = true) {
  arguments {
    nonNullBooleanArgField(nonNullBooleanArg: $booleanArg)
  }
}
```

For list types, the same rules around nullability apply to both outer types
and inner types. A nullable list cannot be passed to a non-null list, and a lists
of nullable values cannot be passed to a list of non-null values.

```graphql
query nonNullListToList($nonNullBooleanList: [Boolean]!) {
  arguments {
    booleanListArgField(booleanListArg: $nonNullBooleanList)
  }
}
```

However a nullable list could not be passed to a non-null list.

```!graphql
query listToNonNullList($booleanList: [Boolean]) {
  arguments {
    nonNullBooleanListField(nonNullBooleanListArg: $booleanList)
  }
}
```

This would fail validation because a `[T]` cannot be passed to a `[T]!`.

Similarly a `[T]` cannot be passed to a `[T!]`.
