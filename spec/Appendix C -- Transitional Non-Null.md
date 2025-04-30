# C. Appendix: Transitional Non-Null

Note: This appendix defines an optional mechanism enabling existing fields to be
marked as `Non-Null` for clients that opt out of error propagation without
changing the error propagation boundaries for deployed legacy clients.
Implementations are not required to support this feature, but doing so enables
gradual migration toward semantic nullability while preserving compatibility.

## Overview


The introduction of _error behavior_ to this specification allows clients to
take responsibility for error handling, no longer having the schema perform
error propagation and destroying potentially useful response data in the
process. With this move towards clients handling errors, designers of new
schemas (or new fields in existing schemas) no longer need to factor whether or
not a field is likely to error into its nullability; designers can mark a
_semantically_ non-nullable _response position_ (a place where {null} is not a
semantically valid value for the data) as `Non-Null`, writing a {null} there on
error in the knowledge that the client now takes responsibility for handling
errors and preventing these placeholder {null} values from being read.

However, for schema designers that need to support legacy clients that do not
exhibit these error handling properties, marking semantically non-nullable
response positions as `Non-Null` would mean that more of the response would be
destroyed for these clients on error, potentially turning local widget errors
into full screen errors.

To allow you to add `Non-Null` to existing fields during this transitional time,
whilst the fields are still in use by legacy clients, without changing their
error propagation boundaries, this appendix introduces the optional
`@noPropagate` directive.

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

### Changes: Handling Execution Errors

When interpreting the
[Handling Execution Errors](#sec-Handling-Execution-Errors) and
[Errors and Non-Null Types](#sec-Executing-Selection-Sets.Errors-and-Non-Null-Types)
sections of the specification, Transitional Non-Null types should be treated as
if they were nullable types. This does not apply to {CompleteValue()} which
should still raise an _execution error_ if {null} is returned for a Transitional
Non-Null type.

### Changes: Introspection

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

### Changes: Type System

When representing a GraphQL schema using the type system definition language,
any field whose return type involves Transitional Non-Null types must indicate
this via the `@noPropagate` directive.
