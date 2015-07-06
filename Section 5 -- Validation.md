# Validation

GraphQL does not just verify if a request is syntactically correct.

Prior to execution, it can also verify that a request is valid
within the context of a given GraphQL schema. Validation is primarily
targeted at development-time tooling. Any client-side tooling
should returns errors and not allow the formulation of queries
known to violate the type system at a given point in time.

Total request validation on the server-side during execution is optional. As
schemas and systems change over time existing clients may end up emitting
queries that are no longer valid given the current type system.  Servers
(as described in the Execution section of this spec) attempt to satisfy as
much as the request as possible and continue to execute in the presence
of type system errors rather than cease execution completely.

For this section of this schema, we will assume the following type system
in order to demonstrate examples:

```graphql

enum DogCommand { SIT, DOWN, HEEL }

type Dog : Pet {
  name: String!,
  nickname: String,
  barkVolume: Int,
  doesKnowCommand(dogCommand: DogCommand!) : Boolean!
  isHousetrained(atOtherHomes: Boolean): Boolean!
}

interface Sentient { name: String! }
interface Pet { name: String! }

type Alien : Sentient { name: String!, homePlanet: String }
type Human : Sentient { name: String! }

type Cat : Pet {
  name: String!,
  nickname: String,
  meowVolume: Int
}

union CatOrDog = Cat | Dog
union DogOrHuman = Dog | Human
union HumanOrAlien = Human | Alien
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

Because fields are not declared on unions, direct field selection on
union-typed selection set. This is true even if concrete
implementors of the union define the fieldName.

For example the following is invalid

```!graphql
fragment directFieldSelectionOnUnion on CatOrDog {
  directField
}

fragment definedOnImplementorsQueriedOnUnion on CatOrDog {
  name
}
```

### Field Selection Merging

** Formal Specification **

  * Let {set} be any selection set defined in the GraphQL document
  * Let {setForKey} be the set of selections with a given response key in {set}
  * All members of {setForKey} must:
    * Have identical target fields
    * Have identical sets of arguments name-value pairs.
    * Have identical sets of directive name-value pairs.

** Explanatory Text **

Selection names are de-duplicated and merged for validation, but the target
field, arguments, and directives must all be identical.

For human-curated GraphQL, this rules seem a bit counterintuitive since it
appears to be clear developer error. However in the presence of nested
fragments or machine-generated GraphQL, requiring unique selections is a
burdensome limitation on tool authors.

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

Identical field arguments are also merged if they have
identical arguments. Both values and variables can be
correctly merged.

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
```

The same logic applies to directives. The set of directives on each selection
with the same response key in a given scope must be identical.

The following is valid:

```graphql
fragment mergeSameFieldsWithSameDirectives on Dog {
  name @if:true
  name @if:true
}
```

and the following is invalid:

```!graphql

fragment conflictingDirectiveArgs on Dog {
  name @if: true
  name @unless: false
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
fragment scalarSelection: Dog {
  barkVolume
}
```

The following is invalid.

```!graphql
fragment scalarSelectionsNotAllowedOnBoolean : Dog {
  barkVolume { sinceWhen }
}
```

Conversely the leaf field selections of GraphQL queries
must be scalars. Leaf selections on objects, interfaces,
and unions without subfields are disallowed.

Let's assume the following query root type of the schema:

```graphql
type QueryRoot {
  human: Human
  pet: Pet
  catOrDog: CatOrDog
}
```

The following examples are invalid

```!graphql

query directQueryOnObjectWithoutSubFields
{
  human
}

query directQueryOnInterfaceWithoutSubFields
{
  pet
}

query directQueryOnUnionWithoutSubFields
{
  catOrDog
}
```

## Arguments

### Argument Names

** Formal Specification **

  * For each {selection} in the document
  * Let {arguments} be the set of argument provided to the {selection}
  * Let {targetField} be the target field of a given {selection}
  * Let {argumentDefinitions} be the set of argument definitions of {targetField}
  * Each {argumentName} in {arguments} must have a corresponding argument definition
    in the {targetField} with the same name

** Explanatory Text **

Field selections may take arguments. Each field selection corresponds to a
field definition on the enclosing type, which specifies a set of possible
arguments. Every argument provided to the selection must be defined in the set
of possible arguments.

For example the following are valid:

```graphql
fragment argOnRequiredArg on Dog {
  doesKnowCommand(dogCommand: SIT)
}

fragment argOnOptional on Dog {
  isHousetrained(atOtherHomes: true)
}
```

and the following is invalid since command is not defined on DogCommand:

```!graphql

fragment invalidArgName on Dog {
  doesKnowCommand(command: CLEAN_UP_HOUSE)
}

```

In order to explore more complicated argument examples, let's add the following
to our type system:

```graphql
type Arguments {
  multipleReqs(x: Int!, y: Int!)
  booleanArgField(booleanArg: Boolean)
  floatArgField(floatArg: Float)
  intArgField(intArg: Int)
  nonNullBooleanArgField(nonNullBooleanArg: Boolean!)
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

### Argument Values Type Correctness

#### Compatible Values

** Formal Specification **

  * For each {selection} in the document
  * Let {arguments} be the set of argument provided to the {selection}
  * Let {targetField} be the target field of a given {selection}
  * Let {argumentDefinitions} be the set of argument definitions of {targetField}
  * For each {literalArgument} of all {arguments} with literal for values.
    * The type of {literalArgument} must equal the type of the argument definition OR
    * The type of {literalArgument} must be coercible to type of the argument definition

** Explanatory Text **

Argument literal values must be compatible with the type defined on the type that
literal is being passed to.

This means either
  * the types must match equally or
  * the types must be coercible.

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

#### Argument Optionality

  * For each {selection} in the document
  * Let {arguments} be the set of argument provided to the {selection}
  * Let {targetField} be the target field of a given {selection}
  * Let {argumentDefinitions} be the set of argument definitions of {targetField}
  * For each {definition} in {argumentDefinition}, if the type of {definition} is non-null
    a value must be provided.

** Explanatory Text **

Field arguments can be required. Field arguments are required if the type of the argument
is non-null. If it is not non-null, the argument is optional. Optional arguments
must have default values.

For example the following are valid:

```graphql
fragment goodBooleanArg on Arguments {
  booleanArgField(booleanArg: true)
}

fragment goodNonNullArg on Arguments {
  nonNullBooleanArgField(nonNullBooleanArg: true)
}

```

On a field with a a nullable arg, that argument can be omitted.

Therefore the following query is valid:

```graphql

fragment goodBooleanArgDefault on Arguments {
  booleanArgField
}
```

but this is not valid on a non-null argument.

```!graphql
fragment missingRequiredArg on Arguments {
  notNullBooleanArgField
}
```

## Fragments

### Fragment Declarations

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

fragment CorrectType on Dog {
  name
}

fragment InlineFragment on Dog {
  ... on Dog {
    name
  }
}

```

and the following do not validate:

```!graphql

fragment NotOnExistingType on NotInSchema {
  name
}

fragment InlineNotExistingType on Dog {
  ... on NotInSchema { name }
}
```

#### Fragments On Composite Types

** Formal Specification **

  * For each {fragment} defined in the document.
  * The target type of fragment must be have kind {UNION}, {INTERFACE}, or
    {OBJECT}.

** Explanatory Text **

Fragments can only be declared on unions, interfaces, and objects. They are
invalid on scalars. They can only be applied on non-leaf fields. This rule
applies to both inline and named fragments.

The following fragment declarations are valid:

```graphql
fragment fragOnObject on Dog { name }
fragment fragOnInterface on Pet { name }
fragment fragOnUnion on CatOrDog { ... on Dog { name } }
```

and the following are invalid:

```!graphql
fragment fragOnScalar on Int { something }
fragment inlineFragOnScalar on Dog { ... on Boolean { somethingElse } }
```

#### Fragments Must Be Used

** Formal Specification **

  * For each {fragment} defined in the document.
  * {fragment} must be be the target of at least one spread in the document

** Explanatory Text **

Defined fragments must be used within a query document.

For example the following is an invalid query document:

```!graphql
fragment nameFragment on Dog { // unused
  name
}
{ dog { name } }
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
fragment nameFragment on Dog { name }
{ dog { ...undefinedFragment} }
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

```!graphql
{
  dog {
    name, barkVolume, name, barkVolume, name, barkVolume, name, # etc...
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

  * For each {spread} (named or inline) in defined in the document.
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

and the following valid fragments:

##### Object Spreads In Object Scope

In the scope of a object type, the only valid object type
fragment spread is one that applies to the same type that
is in scope.

For example

```graphql
fragment dogFragment on Dog { ... on Dog { barkVolume } }
```

and the following is invalid

```!graphql
fragment catInDogFragmentInvalid on Dog { ... on Cat { meowVolume } }
```

##### Abstract Spreads in Object Scope

In scope of an object type, unions or interface spreads can be used
if the object type implements the interface or is a member of the union.

For example

```graphql
fragment petNameFragment on Pet { name }
fragment interfaceWithinObjectFragment on Dog { ...petNameFragment }
```

is valid because {Dog} implements Pet.

Likewise

```graphql
fragment CatOrDogNameFragment on CatOrDog { ... on Cat { meowVolume } }
fragment unionWithObjectFragment on Dog { ...CatOrDogFragment }
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
fragment petFragment on Pet { name, ... on Dog { barkVolume } }
fragment catOrDogFragment on CatOrDog { ... on Cat { meowVolume } }
```

{petFragment} is valid because {Dog} implements the interface {Pet}.
{catOrDogFragment} is valid because {Cat} is a member of the
{CatOrDog} union.

By contrast the following fragments are invalid:

```!graphql
fragment sentientFragment on Sentient { ... on Dog { barkVolume } }
fragment humanOrAlienFragment on HumanOrAlien { ... on Cat { meowVolume } }
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
fragment unionWithInterface on Pet { ...dogOrHumanFragment }
fragment dogOrHumanFragment on DogOrHuman { ... on Dog { barkVolume } }
```

is consider valid because {Dog} implements interface {Pet} and is a
member of {DogOrHuman}.

However

```!graphql
fragment nonIntersectingInterfaces on Pet { ...sentientFragment }
fragment sentientFragment on Sentient { name }
```

is not valid because there exists no type that implements both {Pet}
and {Sentient}.

## Directives

### Directives Are Defined

** Formal Specification **

  * For every {directiveUse} in a document.
  * The name of that directive must be defined by the type system of
    the GraphQL server.

** Explanatory Text **

GraphQL servers define what directives they support. For each
usage of a directive, the directive must be available on that server.

### Directive Arguments Are Of Correct Type

** Formal Specification **

  * For every {directiveUse} in a document.
  * Let {directiveType} be the input type of the corresponding
    directive defined on the server.
  * If {directiveType} is not defined:
    * The directive is meant to be used only as flag, and no argument should be
      provided.
  * If {directiveType} is defined and non-null:
    * {directiveUse} must have an argument
  * Let {argumentType} be the type of argument supplied to {directiveUse}
  * {argumentType} and {directiveType} must be the same or {argumentType} must
    be coercible to {directiveType}

** Explanatory Text **

Directive arguments follow similar rules to arguments on fields. Much like
field arguments, arguments to directives must be of the same type or
coercible to input type of the directive type.

Directives arguments differ from field arguments insofar as they can
be used without a provided argument. If the type of directive is not non-null,
the directive can be optionally used without an argument. If the type of
a directive is not defined, it is a flag directive: it cannot have an argument,
If a value is provided to a flag directive, this is a validation error.

## Operations

### Variables

#### Variable Default Values Are Correctly Typed

** Formal Specification **

  * For every {operation} in a document
  * For every {variable} on each {operation}
    * Let {variableType} be the type of {variable}
    * If {variableType} is non-null it cannot have a default value
    * If {variable} has a default value it must be of the same types
      or able to be coerced to {variableType}

** Explanatory Text **

Variable defined by operations are allowed to define default values
if the type of that variable not non-null.

For example the following query will pass validation.

```graphql
  query HouseTrainedQuery($atOtherHomes: Boolean = true) {
    dog { isHousetrained(atOtherHomes: $atOtherHomes) }
  }
```

However if the variable is defined as non-null, default values
are unreachable. Therefore queries such as the following fail
validation

```!graphql
  query HouseTrainedQuery($atOtherHomes: Boolean! = true) {
    dog { isHousetrained(atOtherHomes: $atOtherHomes) }
  }
```

Default values must be compatible with the types of variables.
Types much match or they must be coercible to the type.

Non-matching types fail, such as in the following example:

```!graphql
  query HouseTrainedQuery($atOtherHomes: Boolean = "true") {
    dog { isHousetrained(atOtherHomes: $atOtherHomes) }
  }
```

However if a type is coercible the query will pass validation.

For example:

```graphql
  query IntToFloatQuery($floatVar: Float = 1) {
    arguments {
      floatArgField(floatArg: $floatVar)
    }
  }
```

#### Variables Are Input Types

** Formal Specification **

  * For every {operation} in a {document}
  * For every {variable} on each {operation}
    * Let {variableType} be the type of {variable}
    * {variableType} must of kind {SCALAR}, {ENUM} or {INPUT_OBJECT}

** Explanatory Text **

Variables can only be scalars, enums, input objects, or lists and non-null
variants of those types. These are known as input types. Object, unions,
and interfaces cannot be used as inputs.

The following queries are valid:

```graphql
  query TakesBoolean($atOtherHomes: Boolean) { /* ... */ }
  query TakesComplexInput($complexInput: ComplexInput) { /* ... */ }
  query TakesListOfBooleanBang($booleans: [Boolean!]) { /* ... */ }
```

The following queries are invalid:

```!graphql
  query TakesCat($cat: Cat) { /* ... */ }
  query TakesDogBang($dog: Dog!) { /* ... */ }
  query TakesListOfPet($pets: [Pet]) { /* ... */ }
  query TakesCatOrDog($catOrDog: CatOrDog) { /* ... */ }
```

#### All Variable Uses Defined

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
query VariableIsDefined($atOtherHomes: Boolean) {
  dog { isHousetrained(atOtherHomes: $booleanArg)
}
```

is valid. ${atOtherHomes} is defined by the operation.

By contrast the following query is invalid:

```!graphql
query VariableIsNotDefined {
  dog { isHousetrained(atOtherHomes: $atOtherHomes)
}
```

${atOtherHomes} is not defined by the operation.

Fragments complicate this rule. Any fragment transitively included by an
operation has access to the variables defined by that operation. Fragments
can appear within multiple operations and therefore variable usages
must correspond to variable definitions in all of those operations.

For example the following is valid:

```graphql
query VariableIsDefinedUsedInSingleFragment($atOtherHomes: Boolean) {
  dog { ...isHousetrainedFragment }
}

fragment isHousetrainedFragment on Dog {
  isHousetrained(atOtherHomes: $atOtherHomes}
}
```

since {isHousetrainedFragment} is used within the context of the operation
{VariableIsDefinedUsedInSingleFragment} and the variable is defined by that
operation.

On the contrary is a fragment is included within an operation that does
not define a referenced variable, this is a validation error.

```!graphql
query VariableIsNotDefinedUsedInSingleFragment {
  dog { ...isHousetrainedFragment }
}

fragment isHousetrainedFragment on Dog {
  isHousetrained(atOtherHomes: $atOtherHomes}
}
```

This applies transitively as well, so the following also fails:

```!graphql
query VariableIsNotDefinedUsedInNestedFragment {
  dog { ...outerHousetrainedFragment }
}

fragment outerHousetrainedFragment on Dog {
  ...isHousetrainedFragment
}

fragment isHousetrainedFragment on Dog {
  isHousetrained(atOtherHomes: $atOtherHomes}
}
```

Variables must be defined in all operations in which a fragment
is used.

```graphql
query HousetrainedQueryOne($atOtherHomes: Boolean) {
  dog { ...isHousetrainedFragment }
}

query HousetrainedQueryTwo($atOtherHomes: Boolean) {
  dog { ...isHousetrainedFragment }
}

fragment isHousetrainedFragment on Dog {
  isHousetrained(atOtherHomes: $atOtherHomes}
}
```

However the following does not validate:

```!graphql

query HousetrainedQueryOne($atOtherHomes: Boolean) {
  dog { ...isHousetrainedFragment }
}

query HousetrainedQueryTwoNotDefined {
  dog { ...isHousetrainedFragment }
}

fragment isHousetrainedFragment on Dog {
  isHousetrained(atOtherHomes: $atOtherHomes}
}
```

This is because {HousetrainedQueryTwoNotDefined} does not define
a variable ${atOtherHomes} but that variable is used by {isHousetrainedFragment}
which is included in that operation.

#### All Variables Used

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
query VariableUnused($atOtherHomes: Boolean) {
  dog { isHousetrained }
}
```

because ${atOtherHomes} in not referenced.

These rules apply to transitive fragment spreads as well:

```graphql
query VariableUsedInFragment($atOtherHomes: Boolean) {
  dog { ...isHousetrainedFragment }
}

fragment isHousetrainedFragment on Dog {
  isHousetrained(atOtherHomes: $atOtherHomes)
}
```

The above is valid since ${atOtherHomes} is used in {isHousetrainedFragment}
which is included by {VariableUsedInFragment}.

If that fragment did not have a reference to ${atOtherHomes} it would be not valid:

```!graphql
query VariableNotUsedWithinFragment($atOtherHomes: Boolean) {
  ...isHousetrainedWithoutVariableFragment
}

fragment isHousetrainedWithoutVariableFragment on Dog {
  isHousetrained
}
```

All operations in a document must use all of their variables.

As a result, the following document does not validate.

```!graphql

query QueryWithUsedVar($atOtherHomes: Boolean) {
  dog { ...isHousetrainedFragment }
}

query QueryWithExtraVar($atOtherHomes: Boolean, $extra: Int) {
  dog { ...isHousetrainedFragment }
}

fragment isHousetrainedFragment on Dog {
  isHousetrained(atOtherHomes: $atOtherHomes)
}
```

This document is not valid because {QueryWithExtraVar} defines
an extraneous variable.

#### All Variable Usages are Allowed

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
Query IntCannotGoIntoBoolean($intArg: Int) {
  arguments { booleanArgField(booleanArg: $intArg) }
}
```

${intArg} typed as {Int} cannot be used as a argument to {booleanArg}, typed as {Boolean}.

List cardinality must also be the same. For example, lists cannot be passed into singular
values.

```!graphql
Query BooleanListCannotGoIntoBoolean($booleanListArg: [Boolean]) {
  arguments { booleanArgField(booleanArg: $booleanListArg) }
}
```

Nullability must also be respected. In general a nullable variable cannot
be passed to a non-null argument.

```!graphql
Query BooleanArgQuery($booleanArg: Boolean) {
  arguments { nonNullBooleanArgField(nonNullBooleanArg: $booleanArg) }
}
```

A notable exception is when default arguments are provided. They are, in effect,
treated as non-nulls.

```graphql
Query BooleanArgQueryWithDefault($booleanArg: Boolean = true) {
  arguments { nonNullBooleanArgField(nonNullBooleanArg: $booleanArg) }
}
```

For list types, the same rules around nullability apply to both outer types
and inner types. A nullable list cannot be passed to a non-null list, and a lists
of nullable values cannot be passed to a list of non-null values.

```graphql

Query NonNullListToList($nonNullBooleanList: ![Boolean]) {
  arguments { booleanListArgField(booleanListArg: $nonNullBooleanList) }
}

```

However a nullable list could not be passed to a non-null list.

```!graphql

Query ListToNonNullList($booleanList: [Boolean]) {
  arguments { nonNullBooleanListField(nonNullBooleanListArg: $booleanList) }
}

```

This would fail validation because a `[T]` cannot be passed to a `[T]!`.

Similarly a `[T]` cannot be passed to a `[T!]`.
