# `__id`, a common unique ID field for object types

## Justification

Most GraphQL clients do some kind of result normalization to improve UI
consistency across multiple GraphQL results. Currently, these clients need to be
configured to use a specific field name, or require server implementers to use a
particular field name like `id` by convention.

## Desirable properties

### Unique meta field name

Naming the meta field `__id` with leading underscores is important to avoid
overlapping with any existing field, and many types already provide a field
named `id`. If it's important that a client receives this field with a different
specific name, an alias can be used to do so, but otherwise this leaves
the ability for any Type to present fields of any name while presenting an
unambiguous field to access a globally unique identifier.

### Queryable on every type

It's advantageous for the `__id` field to be queryable on every type of the
schema, just like `__typename`, so that client-side tools can ask for a unique
identifier even if they don't have access to the schema ahead of time. This
proposal suggests simply having the `__id` field return the `ID` type, which is
nullable. In the case where the type doesn't support a unique identifier, it can
return `null` for that field, which indicates that this object doesn't have an
ID and the client should not attempt to normalize it.

### Globally unique

Since this field in the schema is GraphQL-specific, we have an opportunity to
introduce a requirement that will make it far easy to build deduplicating and
caching features on the client. Requiring identifiers returned from `__id` to be
globally unique across all types in the schema means that clients don't need to
do any post-processing on the results to generate cache keys. Since the `__id`
field name is unlikely to collide with any existing non-unique `id` fields, for
example from SQL, developers can have both fields side-by-side in the result
where necessary.

### Validation changes - allow `__id` on all unions and interfaces

Just like `__typename` can be queried on any union or interface selection set,
`__id` can as well. If some of the results in an array of union or interface
types have valid `__id`s and some don't, then some of the results will have
`null` for that field.

## Non-goals

### Refetchability.

This proposal intentionally does not address refetching any object directly
given it's `__id` value. Experience building Facebook's type system and others
exposed numerous examples of types for which a refetch token and a unique cache
key were not the same thing. This proposal focusing only on the use case of
uniquely identifying objects to use for caching and deduplicating
result values.

> Credit to Lee Byron for some of the initial content.
