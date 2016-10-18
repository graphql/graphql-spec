# Validation

GraphQL 并不会对请求的语法是否正确进行确认。

GraphQL does not just verify if a request is syntactically correct.

在请求被执行之前，它也会根据给定的 GraphQL schema的语境来核对请求是否有效。任何客户端工具应该返回错误信息，不应允许形成
已知的会违反当前type system的query。

Prior to execution, it can also verify that a request is valid
within the context of a given GraphQL schema. Validation is primarily
targeted at development-time tooling. Any client-side tooling
should return errors and not allow the formulation of queries
known to violate the type system at a given point in time.

在执行过程中服务器端的对请求的完整校验是可选项。当schema和系统随着时间而发生变更，已有的客户端可能会忽略那些对于当前type system 早已不合法的query请求。
服务器(正如在该标准规范的Execution章节中所介绍的)会尝试尽可能多地满足请求，在出现type system error时仍然继续执行而不是完全中断执行。

Total request validation on the server-side during execution is optional. As
schemas and systems change over time existing clients may end up emitting
queries that are no longer valid given the current type system.  Servers
(as described in the Execution section of this spec) attempt to satisfy as
much as the request as possible and continue to execute in the presence
of type system errors rather than cease execution completely.

对于该章节中的schema，为了演示起见,我们假设有如下的type system：

For this section of this schema, we will assume the following type system
in order to demonstrate examples:

```
enum DogCommand { SIT, DOWN, HEEL }

type Dog : Pet {
  name: String!
  nickname: String
  barkVolume: Int
  doesKnowCommand(dogCommand: DogCommand!) : Boolean!
  isHousetrained(atOtherHomes: Boolean): Boolean!
}

interface Sentient {
  name: String!
}

interface Pet {
  name: String!
}

type Alien : Sentient {
  name: String!
  homePlanet: String
}

type Human : Sentient {
  name: String!
}

type Cat : Pet {
  name: String!
  nickname: String
  meowVolume: Int
}

union CatOrDog = Cat | Dog
union DogOrHuman = Dog | Human
union HumanOrAlien = Human | Alien
```

## Fields

### Field Selections on Objects, Interfaces, and Unions Types

** 正式规范 Formal Specification **

  * For each {selection} in the document.
  * Let {fieldName} be the target field of {selection}
  * {fieldName} must be defined on type in scope

** 说明性文字 Explanatory Text **

field selection 的 target field必须定义在 selection set范围内的type上。对alias name 别名没有任何限制。

The target field of a field selection must be defined on the scoped type of the
selection set. There are no limitations on alias names.

比如，下面的例子就通不过校验：

For example the following fragment would not pass validation:

```!graphql
fragment fieldNotDefined on Dog {
  meowVolume
}

fragment aliasedLyingFieldTargetNotDefined on Dog {
  barkVolume: kawVolume
}
```

对于interface，只能对field做直接的field selection。具体实现类的field 与给定的interface-typed(针对interface的) selection set的合法性是无关的。

For interfaces, direct field selection can only be done on fields. Fields
of concrete implementors are not relevant to the validity of the given
interface-typed selection set.

比如，下面的例子是合法的：

For example, the following is valid:

```graphql
fragment interfaceFieldSelection on Pet {
  name
}
```

下面的这个例子则是非法的：

and the following is invalid:

```!graphql
fragment definedOnImplementorsButNotInterface on Pet {
  nickname
}
```

由于Union 中并未声明/定义任何field，不能直接从union-typed selection set中选择field，除了meta-field {__typename}。
只能通过 fragment 来间接查询 union-typed selection set中的field。

Because unions do not define fields, fields may not be directly selected from a
union-typed selection set, with the exception of the meta-field {__typename}.
Fields from a union-typed selection set must only be queried indirectly via
a fragment.

比如，下面的例子是合法的：

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

下面的例子是非法的：

For example the following is invalid

```!graphql
fragment directFieldSelectionOnUnion on CatOrDog {
   name
   barkVolume
 }
```

### Field Selection Merging

** 正式规范 Formal Specification **

<<<<<<< HEAD:zh-cn/spec/Section 5 -- Validation.md
  * Let {set} be any selection set defined in the GraphQL document
  * Let {setForKey} be the set of selections with a given response key in {set}
  * All members of {setForKey} must:
    * Have identical target fields
    * Have identical sets of arguments.
    * Have identical sets of directives.
=======
  * Let {set} be any selection set defined in the GraphQL document.
  * {FieldsInSetCanMerge(set)} must be true.

FieldsInSetCanMerge(set) :
  * Let {fieldsForName} be the set of selections with a given response name in
    {set} including visiting fragments and inline fragments.
  * Given each pair of members {fieldA} and {fieldB} in {fieldsForName}:
    * {SameResponseShape(fieldA, fieldB)} must be true.
    * If the parent types of {fieldA} and {fieldB} are equal or if either is not
      an Object Type:
      * {fieldA} and {fieldB} must have identical field names.
      * {fieldA} and {fieldB} must have identical sets of arguments.
      * Let {mergedSet} be the result of adding the selection set of {fieldA}
        and the selection set of {fieldB}.
      * {FieldsInSetCanMerge(mergedSet)} must be true.

SameResponseShape(fieldA, fieldB) :
  * Let {typeA} be the return type of {fieldA}.
  * Let {typeB} be the return type of {fieldB}.
  * If {typeA} or {typeB} is Non-Null.
    * {typeA} and {typeB} must both be Non-Null.
    * Let {typeA} be the nullable type of {typeA}
    * Let {typeB} be the nullable type of {typeB}
  * If {typeA} or {typeB} is List.
    * {typeA} and {typeB} must both be List.
    * Let {typeA} be the item type of {typeA}
    * Let {typeB} be the item type of {typeB}
    * Repeat from step 3.
  * If {typeA} or {typeB} is Scalar or Enum.
    * {typeA} and {typeB} must be the same type.
  * Assert: {typeA} and {typeB} are both composite types.
  * Let {mergedSet} be the result of adding the selection set of {fieldA} and
    the selection set of {fieldB}.
  * Let {fieldsForName} be the set of selections with a given response name in
    {mergedSet} including visiting fragments and inline fragments.
  * Given each pair of members {subfieldA} and {subfieldB} in {fieldsForName}:
    * {SameResponseShape(subfieldA, subfieldB)} must be true.
>>>>>>> 6097d7b32c464552bccf116201cf310adb82835c:spec/Section 5 -- Validation.md

** 说明性文字 Explanatory Text **

在校验过程中要对重复的Selection 的名称进行合并和删除，但target field、argument、directive必须完全相同。


Selection names are de-duplicated and merged for validation, but the target
field, arguments, and directives must all be identical.

对于人为编辑的 GraphQL ，鉴于这种情况更像是一个开发人员所犯的错误，这条规则似乎是有违常理的。但在嵌套式 fragment或机器生成的 GraphQL 中，
对于工具的作者来讲，强制要求 selection的唯一性是极大的限制。

<<<<<<< HEAD:zh-cn/spec/Section 5 -- Validation.md
For human-curated GraphQL, this rules seem a bit counterintuitive since it
appears to be clear developer error. However in the presence of nested
fragments or machine-generated GraphQL, requiring unique selections is a
burdensome limitation on tool authors.
=======
If multiple fields selections with the same response names are encountered
during execution, the field and arguments to execute and the resulting value
should be unambiguous. Therefore any two field selections which might both be
encountered for the same object are only valid if they are equivalent.
>>>>>>> 6097d7b32c464552bccf116201cf310adb82835c:spec/Section 5 -- Validation.md

如下的 selection 可以正确地合并起来：

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

如下的则不能合并：

The following is not able to merge:

```!graphql
fragment conflictingBecauseAlias on Dog {
  name: nickname
  name
}
```

只有argument也相同时才能对argument进行合并。value 和variable 都能够正确地被合并。

Identical arguments are also merged if they have identical arguments. Both
values and variables can be correctly merged.

如下的例子能够正确地被合并：

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

如下的则不能实现合并：

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

<<<<<<< HEAD:zh-cn/spec/Section 5 -- Validation.md
对于directive来说是同样的处理逻辑。在某个范围内同样response key的每个selection中，directive的集合必须完全相同。

The same logic applies to directives. The set of directives on each selection
with the same response key in a given scope must be identical.

如下是合法的：

The following is valid:

```graphql
fragment mergeSameFieldsWithSameDirectives on Dog {
  name @include(if: true)
  name @include(if: true)
=======
The following fields would not merge together, however both cannot be
encountered against the same object, so they are safe:

```graphql
fragment safeDifferingFields on Pet {
  ... on Dog {
    volume: barkVolume
  }
  ... on Cat {
    volume: meowVolume
  }
>>>>>>> 6097d7b32c464552bccf116201cf310adb82835c:spec/Section 5 -- Validation.md
}
```

如下是非法的：

and the following is invalid:

```!graphql
fragment conflictingDirectiveArgs on Dog {
  name @include(if: true)
  name @include(if: false)
}
```

<<<<<<< HEAD:zh-cn/spec/Section 5 -- Validation.md
=======
However, the field responses must be shapes which can be merged. For example,
scalar values must not differ. In this example, `someValue` might be a `String`
or an `Int`:

```!graphql
fragment conflictingDifferingResponses on Pet {
  ... on Dog {
    someValue: nickname
  }
  ... on Cat {
    someValue: meowVolume
  }
}
```


>>>>>>> 6097d7b32c464552bccf116201cf310adb82835c:spec/Section 5 -- Validation.md
### Leaf Field Selections

** 正式规范 Formal Specification **

  * For each {selection} in the document
  * Let {selectionType} be the result type of {selection}
  * If {selectionType} is a scalar:
    * The subselection set of that selection must be empty
  * If {selectionType} is an interface, union, or object
    * The subselection set of that selection must NOT BE empty

** 说明性文字 Explanatory Text **

决不允许对 scalar 进行field selection：scalar 是任何 GraphQL query的leaf nodes(叶节点) 。

Field selections on scalars are never allowed: scalars
are the leaf nodes of any GraphQL query.

如下是合法的。

The following is valid.

```graphql
fragment scalarSelection: Dog {
  barkVolume
}
```

如下是非法的：

The following is invalid.

```!graphql
fragment scalarSelectionsNotAllowedOnBoolean : Dog {
  barkVolume {
    sinceWhen
  }
}
```

相反地，GraphQL query的 leaf field selection 必须是scalar类型。 对于objects, interfaces,
and unions类型的leaf selection中必须要有subfield。

Conversely the leaf field selections of GraphQL queries
must be scalars. Leaf selections on objects, interfaces,
and unions without subfields are disallowed.

假设schema是如下root type的query：

Let's assume the following query root type of the schema:

```
type QueryRoot {
  human: Human
  pet: Pet
  catOrDog: CatOrDog
}
```

下述例子都是非法的：

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

field 和 directive 中都存在 argument。下述的校验规则适用于这两种情况。

Arguments are provided to both fields and directives. The following validation
rules apply in both cases.

### Argument Names

** 正式规范 Formal Specification **

  * For each {argument} in the document
  * Let {argumentName} be the Name of {argument}.
  * Let {argumentDefinition} be the argument definition provided by the parent field or definition named {argumentName}.
  * {argumentDefinition} must exist.

** 说明性文字 Explanatory Text **

一个field 或directive 中出现的 argument 都必须存在于该字段所定义的可能会有的argument 集合之中。

Every argument provided to a field or directive must be defined in the set of
possible arguments of that field or directive.

如下的例子是合法的：

For example the following are valid:

```graphql
fragment argOnRequiredArg on Dog {
  doesKnowCommand(dogCommand: SIT)
}

fragment argOnOptional on Dog {
  isHousetrained(atOtherHomes: true) @include(if: true)
}
```

如下的例子是非法的，原因是`DogCommand`中没有定义`command`。

the following is invalid since `command` is not defined on `DogCommand`.

```!graphql
fragment invalidArgName on Dog {
  doesKnowCommand(command: CLEAN_UP_HOUSE)
}
```

这个也是非法的，原因是`@include`中没有定义 `unless` 

and this is also invalid as `unless` is not defined on `@include`.

```!graphql
fragment invalidArgName on Dog {
  isHousetrained(atOtherHomes: true) @include(unless: false)
}
```

为了能够演示更加复杂的argument的例子，先把如下类型添加到我们的type system中：

In order to explore more complicated argument examples, let's add the following
to our type system:

```
type Arguments {
  multipleReqs(x: Int!, y: Int!)
  booleanArgField(booleanArg: Boolean)
  floatArgField(floatArg: Float)
  intArgField(intArg: Int)
  nonNullBooleanArgField(nonNullBooleanArg: Boolean!)
}
```

argument 的顺序是没有关系的。因此，如下的例子都是合法的：

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

#### 兼容性问题 Compatible Values

** 正式规范 Formal Specification **

  * For each {argument} in the document
  * Let {value} be the Value of {argument}
  * If {value} is not a Variable
    * Let {argumentName} be the Name of {argument}.
    * Let {argumentDefinition} be the argument definition provided by the parent field or definition named {argumentName}.
    * Let {type} be the type expected by {argumentDefinition}.
    * The type of {literalArgument} must be coercible to {type}.

** 说明性文字 Explanatory Text **


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

** 说明性文字 Explanatory Text **

argument 可以是必须存在的。如果argument的数据类型是非空non-null类型，则该 argument 是必须存在的。如果不是非空类型，则argument 是可选项

Arguments can be required. Arguments are required if the type of the argument
is non-null. If it is not non-null, the argument is optional.

如下的例子是合法的：

For example the following are valid:

```graphql
fragment goodBooleanArg on Arguments {
  booleanArgField(booleanArg: true)
}

fragment goodNonNullArg on Arguments {
  nonNullBooleanArgField(nonNullBooleanArg: true)
}
```

如果argument是一个可空类型，则该argument是可以忽略的：

The argument can be omitted from a field with a nullable argument.

因此，如下的例子是合法的：

Therefore the following query is valid:

```graphql
fragment goodBooleanArgDefault on Arguments {
  booleanArgField
}
```

但如下的例子是非法的：

but this is not valid on a non-null argument.

```!graphql
fragment missingRequiredArg on Arguments {
  notNullBooleanArgField
}
```

## Fragments

### Fragment Declarations

#### Fragment Spread Type Existence

** 正式规范 Formal Specification **

  * For each named spread {namedSpread} in the document
  * Let {fragment} be the target of {namedSpread}
  * The target type of {fragment} must be defined in the schema

** 说明性文字 Explanatory Text **

只有存在于schema之中的类型才能规定/定义 fragment。对于有名称的和内嵌的fragment同样适用。
如果schema中没有定义，则无法校验该query。

Fragments must be specified on types that exist in the schema. This
applies for both named and inline fragments. If they are
not defined in the schema, the query does not validate.

比如下面的例子是合法的：

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
```

如下的例子则无法校验：

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

** 正式规范 Formal Specification **

  * For each {fragment} defined in the document.
  * The target type of fragment must have kind {UNION}, {INTERFACE}, or
    {OBJECT}.

** 说明性文字 Explanatory Text **

只能对   unions, interfaces, and objects 定义 fragment。在scalar 中定义是非法的。fragment 只能用于非叶节点字段。这样的规则同样适用于内嵌式和有名称的fragment。

Fragments can only be declared on unions, interfaces, and objects. They are
invalid on scalars. They can only be applied on non-leaf fields. This rule
applies to both inline and named fragments.

如下的例子是合法的：

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

如下的例子是非法的：

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

** 正式规范 Formal Specification **

  * For each {fragment} defined in the document.
  * {fragment} must be the target of at least one spread in the document

** 说明性文字 Explanatory Text **

定义好了的fragment 必须在 query document中使用。

Defined fragments must be used within a query document.

比如，下面的query document 是非法的：

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

** 正式规范 Formal Specification **

  * For every {namedSpread} in the document.
  * Let {fragment} be the target of {namedSpread}
  * {fragment} must be defined in the document

** 说明性文字 Explanatory Text **

有名称的 fragment spreads 必须引用定义在document 中的某个fragment。如果spread的target未定义，就会出现错误：


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

** 正式规范 Formal Specification **

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

** 说明性文字 Explanatory Text **

包括spreading自身在内，fragment spreads的graph 必须不能形成任意闭环。否则operation 就回无限spread或者在underlying data上无限制执行该循环。


The graph of fragment spreads must not form any cycles including spreading itself.
Otherwise an operation could infinitely spread or infinitely execute on cycles
in the underlying data.

未通过校验的fragment 会产生一个无限spread：

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

如果上述fragment 是内嵌式的，则会产生一个无限循环：

If the above fragments were inlined, this would result in the infinitely large:

```!graphql
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

** 正式规范 Formal Specification **

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
  ...CatOrDogFragment
}
```

is valid because {Dog} is a member of the {CatOrDog} union. It is worth
noting that if one inspected the contents of the {CatOrDogNameFragment}
you could note that no valid results would ever be returned. However
we do not specify this as invalid because we only consider the fragment
declaration, not its body.

##### Object Spreads In Abstract Scope

Union or interface spreads can be used within the context of an object type
fragment, but only if the object type is one of the possible types of
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

<<<<<<< HEAD:zh-cn/spec/Section 5 -- Validation.md
=======

## Values


### Input Object Field Uniqueness

** Formal Specification **

  * For each input object value {inputObject} in the document.
  * For every {inputField} in {inputObject}
    * Let {name} be the Name of {inputField}.
    * Let {fields} be all Input Object Fields named {name} in {inputObject}.
    * {fields} must be the set containing only {inputField}.

** Explanatory Text **

Input objects must not contain more than one field of the same name, otherwise
an ambiguity would exist which includes an ignored portion of syntax.

For example the following query will not pass validation.

```!graphql
{
  field(arg: { field: true, field: false })
}
```


>>>>>>> 6097d7b32c464552bccf116201cf310adb82835c:spec/Section 5 -- Validation.md
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

## Operations

<<<<<<< HEAD:zh-cn/spec/Section 5 -- Validation.md
### Variables
=======
### Directives Are In Valid Locations

** Formal Specification **

  * For every {directive} in a document.
  * Let {directiveName} be the name of {directive}.
  * Let {directiveDefinition} be the directive named {directiveName}.
  * Let {locations} be the valid locations for {directiveDefinition}.
  * Let {adjacent} be the AST node the directive affects.
  * {adjacent} must be represented by an item within {locations}.

** Explanatory Text **

GraphQL servers define what directives they support and where they support them.
For each usage of a directive, the directive must be used in a location that the
server has declared support for.

For example the following query will not pass validation because `@skip` does
not provide `QUERY` as a valid location.

```!graphql
query @skip(if: $foo) {
  field
}
```


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

>>>>>>> 6097d7b32c464552bccf116201cf310adb82835c:spec/Section 5 -- Validation.md

#### Variable Default Values Are Correctly Typed

** Formal Specification **

  * For every {operation} in a document
  * For every {variable} on each {operation}
    * Let {variableType} be the type of {variable}
    * If {variableType} is non-null it cannot have a default value
    * If {variable} has a default value it must be of the same type
      or able to be coerced to {variableType}

** Explanatory Text **

Variable defined by operations are allowed to define default values
if the type of that variable not non-null.

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
Types much match or they must be coercible to the type.

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

#### Variables Are Input Types

** Formal Specification **

  * For every {operation} in a {document}
  * For every {variable} on each {operation}
    * Let {variableType} be the type of {variable}
    * While {variableType} is {LIST} or {NON_NULL}
      * Let {variableType} be the referenced type of {variableType}
    * {variableType} must be of kind {SCALAR}, {ENUM} or {INPUT_OBJECT}

** Explanatory Text **

Variables can only be scalars, enums, input objects, or lists and non-null
variants of those types. These are known as input types. Objects, unions,
and interfaces cannot be used as inputs.

The following queries are valid:

```graphql
query takesBoolean($atOtherHomes: Boolean) {
  # ...
}

query takesComplexInput($complexInput: ComplexInput) {
  # ...
}

query TakesListOfBooleanBang($booleans: [Boolean!]) {
  # ...
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

#### All Variable Uses Defined

** Formal Specification **

  * For each {operation} in a document
    * For each {variableUsage} in scope, variable must be in {operation}'s variable list.
    * Let {fragments} be every fragment referenced by that {operation} transitively
    * For each {fragment} in {fragments}
      * For each {variableUsage} in scope of {fragment}, variable must be in
        {operation}'s variable list.

** Explanatory Text **

Variables are scoped on a per-operation basis. That means that any variable
used within the context of an operation must be defined at the top level of that
operation

For example:

```graphql
query variableIsDefined($atOtherHomes: Boolean) {
  dog {
    isHousetrained(atOtherHomes: $booleanArg)
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
  isHousetrained(atOtherHomes: $atOtherHomes}
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
  isHousetrained(atOtherHomes: $atOtherHomes}
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
  isHousetrained(atOtherHomes: $atOtherHomes}
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
  isHousetrained(atOtherHomes: $atOtherHomes}
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
query variableUnused($atOtherHomes: Boolean) {
  dog {
    isHousetrained
  }
}
```

because ${atOtherHomes} is not referenced.

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

#### All Variable Usages are Allowed

** Formal Specification **

  * For each {operation} in {document}
  * Let {variableUsages} be all usages transitively included in the {operation}
  * For each {variableUsage} in {variableUsages}
    * Let {variableType} be the type of variable definition in the {operation}
    * Let {argumentType} be the type of the argument the variable is passed to.
    * Let {hasDefault} be true if the variable definition defines a default.
    * AreTypesCompatible({argumentType}, {variableType}, {hasDefault}) must be true

  * AreTypesCompatible({argumentType}, {variableType}, {hasDefault}):
    * If {hasDefault} is true, treat the {variableType} as non-null.
    * If inner type of {argumentType} and {variableType} are different, return false
    * If {argumentType} and {variableType} have different list dimensions, return false
    * If any list level of {variableType} is not non-null, and the corresponding level
      in {argument} is non-null, the types are not compatible.

** Explanatory Text **

Variable usages must be compatible with the arguments they are passed to.

Validation failures occur when variables are used in the context of types
that are complete mismatches, or if a nullable type in a variable is passed to
a non-null argument type.

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
query nonNullListToList($nonNullBooleanList: ![Boolean]) {
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
