# C. Appendix: Transitional Non-Null

Note: This appendix defines an optional mechanism enabling existing fields to be
marked as `Non-Null` for clients that opt out of error propagation without
changing the error propagation boundaries for deployed legacy clients.
Implementations are not required to support this feature, but doing so enables
gradual migration toward semantic nullability while preserving compatibility.

## Overview

With the introduction of _error behavior_, clients can take responsibility for
handling of _execution error_: correlating {"errors"} in the result with `null`
values inside {"data"} and thereby removing the ambiguity that error propagation
originally set out to solve. If all clients adopt this approach then schema
designers can, and should, reflect true nullability in the schema, marking
fields as `Non-Null` based on their data semantics without regard to whether or
not they might error.

However, legacy clients may not perform this correlation. Introducing `Non-Null`
in such cases could cause errors to propagate further, potentially turning a
previously handled error in a single field into a full-screen error in the
application.

To support a smooth transition, this appendix introduces the `@noPropagate`
directive and the concept of _transitional_ Non-Null types. These wrappers raise
errors like regular `Non-Null` types, but suppress propagation and appear
nullable in introspection when using the legacy {"PROPAGATE"} _error behavior_.

## The @noPropagate Directive

```graphql
directive @noPropagate(levels: [Int!]! = [0]) on FIELD_DEFINITION
```

The `@noPropagate` directive instructs the system to mark the non-null types at
the given levels in the field's return type as "transitional" non-null types
(see [Transitional Non-Null Type](#sec-Transitional-Non-Null-Type)).

The `levels` argument identifies levels within the return type by counting each
list wrapper. Level 0 refers to the base type; each nested list increases the
level by 1 for its inner type. For the avoidance of doubt: `Non-Null` wrappers
do not increase the count.

If a listed level corresponds to a nullable type in the return type, it has no
effect.

For a field that does not return a list type you do not need to specify levels.
If a field returns a list type and you wish to mark the inner type as
`@noPropagate` only then you would provide `@noPropagate(levels: [1])`.

This example outlines how you might introduce semantic nullability into existing
fields in your schema, to reduce the number of null checks your error-handling
clients need to perform. Remember: new fields should reflect the semantic
nullability immediately, they do not need the `@noPropagate` directive since
there is no legacy to support.

```diff example
 type Query {
-  myString: String
+  myString: String! @noPropagate
-  myString2: String
+  myString2: String! @noPropagate(levels: [0])
-  myList: [Int]!
+  myList: [Int!]! @noPropagate(levels: [1])
 }
```

```graphql example
type Query {
  myString: String! @noPropagate
  # Equivalent to the above
  myString2: String! @noPropagate(levels: [0])
  myList: [Int!]! @noPropagate(levels: [1])
}
```

## Transitional Non-Null

A "transitional" Non-Null type is a variant of a [Non-Null](#sec-Non-Null) type
that behaves identically to Non-Null with two exceptions:

1. If an _execution error_ occurs in this response position, the error does not
   propagate to the parent _response position_, instead the response position is
   set to {null}.
2. When the _error behavior_ of the request is {"PROPAGATE"}, this _response
   position_ must be exposed as nullable in introspection.

### Changes to Handling Execution Errors

When interpreting the
[Handling Execution Errors](#sec-Handling-Execution-Errors) and
[Errors and Non-Null Types](#sec-Executing-Selection-Sets.Errors-and-Non-Null-Types)
sections of the specification, Transitional Non-Null types should be treated as
if they were nullable types. This does not apply to {CompleteValue()} which
should still raise an _execution error_ if {null} is returned for a Transitional
Non-Null type.

### Changes to Introspection

Note: Transitional Non-Null types do not appear in the type system as a distinct
\_\_TypeKind. They are unwrapped to nullable types in introspection when the
error behavior is {"PROPAGATE"}, and appear as {"NON_NULL"} otherwise.

**\_\_Field.type**

When the request _error behavior_ is {"PROPAGATE"}, the `type` field on the
`__Field` introspection type must return a `__Type` that represents the type of
value returned by this field with the transitional Non-Null wrapper types
unwrapped at every level.

**\_\_Field.noPropagateLevels**

This additional field should be added to introspection:

```graphql
extend type __Field {
  noPropagateLevels: [Int!]
}
```

The list must match the `levels` that would be passed to `@noPropagate` to
describe the field’s transitional Non-Null wrappers, or `null` if no
`@noPropagate` would be needed. It must not be an empty list.

### Changes to the Type System

When representing a GraphQL schema using the type system definition language,
any field whose return type involves Transitional Non-Null types must indicate
this via the `@noPropagate` directive.
