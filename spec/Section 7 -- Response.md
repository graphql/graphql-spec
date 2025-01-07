# Response

When a GraphQL service receives a _request_, it must return a well-formed
response. The service's response describes the result of executing the requested
operation if successful, and describes any errors raised during the request.

A response may contain both a partial response as well as a list of errors in
the case that any _field error_ was raised on a field and was replaced with
{null}.

## Response Format

The result of a GraphQL request must be either a single initial response or an
incremental stream. The response will be an incremental stream when the GraphQL
service has deferred or streamed data as a result of the `@defer` or `@stream`
directives. When the result of the GraphQL operation is an incremental stream,
the first value will be an initial response, followed by one or more subsequent
responses.

### Initial Response

An initial response must be a map.

If the request raised any errors, the response map must contain an entry with
key `errors`. The value of this entry is described in the "Errors" section. If
the request completed without raising any errors, this entry must not be
present.

If the request included execution, the initial response map must contain an
entry with key `data`. The value of this entry is described in the "Data"
section. If the request failed before execution, due to a syntax error, missing
information, or validation error, this entry must not be present.

When the result of the GraphQL operation is an incremental stream, the initial
response must contain an entry with key `hasNext`. The value of this entry must
be {true}. This entry must not be present for GraphQL operations that result in
a single initial response.

When the result of the GraphQL operation is an incremental stream, the initial
response may contain entries with the keys `pending`, `incremental`, and/or
`completed`. The value of these entries are described in the "Pending",
"Incremental", and "Completed" sections below.

The initial response map may also contain an entry with key `extensions`. This
entry, if set, must have a map as its value. This entry is reserved for
implementers to extend the protocol however they see fit, and hence there are no
additional restrictions on its contents.

To ensure future changes to the protocol do not break existing services and
clients, the initial response map must not contain any entries other than the
entries described above.

Note: When `errors` is present in a response, it may be helpful for it to appear
first when serialized to make it more clear when errors are present in a
response during debugging.

### Subsequent Response

When the result of the GraphQL operation is an incremental stream, the first
value will be an initial response, followed by one or more subsequent responses.
A subsequent response must be a map.

Each subsequent response must contain an entry with key `hasNext`. The value of
this entry must be {true} for all but the last response in the stream. The value
of this entry must be {false} for the last response of the stream.

Each subsequent response may contain entries with the keys `pending`,
`incremental`, and/or `completed`. The value of these entries are described in
the "Pending", "Incremental", and "Completed" sections below.

The subsequent response map may also contain an entry with key `extensions`.
This entry, if set, must have a map as its value. This entry is reserved for
implementers to extend the protocol however they see fit, and hence there are no
additional restrictions on its contents. Implementers may send subsequent
responses containing only `hasNext` and `extensions` entries.

To ensure future changes to the protocol do not break existing services and
clients, the initial response map must not contain any entries other than the
entries described above.

### Data

The `data` entry in the response will be the result of the execution of the
requested operation. If the operation was a query, this output will be an object
of the query root operation type; if the operation was a mutation, this output
will be an object of the mutation root operation type.

If an error was raised before execution begins, the `data` entry should not be
present in the response.

If an error was raised during the execution that prevented a valid response, the
`data` entry in the response should be `null`.

When the response of the GraphQL operation is an incremental stream, `data` may
only be present in the initial response. `data` must not be present in any
subsequent responses.

### Errors

The `errors` entry in the response is a non-empty list of errors raised during
the _request_, where each error is a map of data described by the error result
format below.

If present, the `errors` entry in the response must contain at least one error.
If no errors were raised during the request, the `errors` entry must not be
present in the response.

If the `data` entry in the response is not present, the `errors` entry must be
present. It must contain at least one _request error_ indicating why no data was
able to be returned.

If the `data` entry in the response is present (including if it is the value
{null}), the `errors` entry must be present if and only if one or more _field
error_ was raised during execution.

**Request Errors**

:: A _request error_ is an error raised during a _request_ which results in no
response data. Typically raised before execution begins, a request error may
occur due to a parse grammar or validation error in the _Document_, an inability
to determine which operation to execute, or invalid input values for variables.

A request error is typically the fault of the requesting client.

If a request error is raised, the `data` entry in the response must not be
present, the `errors` entry must include the error, and request execution should
be halted.

**Field Errors**

:: A _field error_ is an error raised during the execution of a particular field
which results in partial response data. This may occur due to an internal error
during value resolution or failure to coerce the resulting value.

A field error is typically the fault of a GraphQL service.

If a field error is raised, execution attempts to continue and a partial result
is produced (see [Handling Field Errors](#sec-Handling-Field-Errors)). The
`data` entry in the response must be present. The `errors` entry should include
this error.

**Error Result Format**

Every error must contain an entry with the key `message` with a string
description of the error intended for the developer as a guide to understand and
correct the error.

If an error can be associated to a particular point in the requested GraphQL
document, it should contain an entry with the key `locations` with a list of
locations, where each location is a map with the keys `line` and `column`, both
positive numbers starting from `1` which describe the beginning of an associated
syntax element.

If an error can be associated to a particular field in the GraphQL result, it
must contain an entry with the key `path` that details the path of the response
field which experienced the error. This allows clients to identify whether a
`null` result is intentional or caused by a runtime error. The value of this
_path entry_ is described in the [Path](#sec-Path) section.

For example, if fetching one of the friends' names fails in the following
operation:

```graphql example
{
  hero(episode: $episode) {
    name
    heroFriends: friends {
      id
      name
    }
  }
}
```

The response might look like:

```json example
{
  "errors": [
    {
      "message": "Name for character with ID 1002 could not be fetched.",
      "locations": [{ "line": 6, "column": 7 }],
      "path": ["hero", "heroFriends", 1, "name"]
    }
  ],
  "data": {
    "hero": {
      "name": "R2-D2",
      "heroFriends": [
        {
          "id": "1000",
          "name": "Luke Skywalker"
        },
        {
          "id": "1002",
          "name": null
        },
        {
          "id": "1003",
          "name": "Leia Organa"
        }
      ]
    }
  }
}
```

If the field which experienced an error was declared as `Non-Null`, the `null`
result will bubble up to the next nullable field. In that case, the `path` for
the error should include the full path to the result field where the error was
raised, even if that field is not present in the response.

For example, if the `name` field from above had declared a `Non-Null` return
type in the schema, the result would look different but the error reported would
be the same:

```json example
{
  "errors": [
    {
      "message": "Name for character with ID 1002 could not be fetched.",
      "locations": [{ "line": 6, "column": 7 }],
      "path": ["hero", "heroFriends", 1, "name"]
    }
  ],
  "data": {
    "hero": {
      "name": "R2-D2",
      "heroFriends": [
        {
          "id": "1000",
          "name": "Luke Skywalker"
        },
        null,
        {
          "id": "1003",
          "name": "Leia Organa"
        }
      ]
    }
  }
}
```

GraphQL services may provide an additional entry to errors with key
`extensions`. This entry, if set, must have a map as its value. This entry is
reserved for implementers to add additional information to errors however they
see fit, and there are no additional restrictions on its contents.

```json example
{
  "errors": [
    {
      "message": "Name for character with ID 1002 could not be fetched.",
      "locations": [{ "line": 6, "column": 7 }],
      "path": ["hero", "heroFriends", 1, "name"],
      "extensions": {
        "code": "CAN_NOT_FETCH_BY_ID",
        "timestamp": "Fri Feb 9 14:33:09 UTC 2018"
      }
    }
  ]
}
```

GraphQL services should not provide any additional entries to the error format
since they could conflict with additional entries that may be added in future
versions of this specification.

Note: Previous versions of this spec did not describe the `extensions` entry for
error formatting. While non-specified entries are not violations, they are still
discouraged.

```json counter-example
{
  "errors": [
    {
      "message": "Name for character with ID 1002 could not be fetched.",
      "locations": [{ "line": 6, "column": 7 }],
      "path": ["hero", "heroFriends", 1, "name"],
      "code": "CAN_NOT_FETCH_BY_ID",
      "timestamp": "Fri Feb 9 14:33:09 UTC 2018"
    }
  ]
}
```

### Path

:: A _path entry_ is an entry within an _error result_ or a _pending result_
that allows for association with a particular field reached during GraphQL
execution.

The value for a _path entry_ must be a list of path segments starting at the
root of the response and ending with the field to be associated with. Path
segments that represent fields must be strings, and path segments that represent
list indices must be 0-indexed integers. If a path segment is associated with an
aliased field it must use the aliased name, since it represents a path in the
response, not in the request.

When the _path entry_ is present on an _error result_, it identifies the
response field which experienced the error.

### Pending

The `pending` entry in the response is a non-empty list of Pending Results. If
the response of the GraphQL operation is an incremental stream, this field may
appear on both the initial and subsequent responses. If present, the `pending`
entry must contain at least one Pending Result.

Each Pending Result corresponds to either a `@defer` or `@stream` directive
located at a specific path in the response data. The Pending Result is used to
communicate that the GraphQL service has chosen to incrementally deliver the
data associated with this `@defer` or `@stream` directive and clients should
expect the associated data in either the current response, or one of the
following responses.

**Pending Result Format**

Every Pending Result must contain an entry with the key `id` with a string
value. This `id` should be used by clients to correlate Pending Results with
Completed Results. The `id` value must be unique for the entire response stream.
There must not be any other Pending Result in any response that contains the
same `id`.

Every Pending Result must contain an entry with the key `path`. When the Pending
Result is associated with a `@stream` directive, it indicates the response list
field that is not known to be complete. Clients should expect the GraphQL
Service to incrementally deliver the remainder of indicated list field. When the
Pending Result is associated with a `@defer` directive, it indicates that the
response fields contained in the deferred fragment are not known to be complete.
Clients should expect the GraphQL Service to incrementally deliver the remainder
of the fields contained in the deferred fragment.

If the associated `@defer` or `@stream` directive contains a `label` argument,
the Pending Result must contain an entry `label` with the value of this
argument.

If a Pending Result is not returned for a `@defer` or `@stream` directive,
clients must assume that the GraphQL service chose not to incrementally deliver
this data, and the data can be found either in the `data` entry in the initial
response, or one of the Incremental Results in a prior subsequent response.

### Incremental

The `incremental` entry in the response is a non-empty list of Incremental
Results. If the response of the GraphQL operation is an incremental stream, this
field may appear on both the initial and subsequent responses. If present, the
`incremental` entry must contain at least one Incremental Result.

The Incremental Result is used to deliver data that the GraphQL service has
chosen to incrementally deliver. An Incremental Result may be ether an
Incremental List Result or an Incremental Object Result.

An Incremental List Result is used to deliver additional list items for a list
field with a `@stream` directive.

An Incremental Object Result is used to deliver additional response fields that
were contained in one or more fragments with a `@defer` directive.

**Incremental Result Format**

Every Incremental Result must contain an entry with the key `id` with a string
value. This `id` must match the `id` that was returned in a prior Pending
Result.

Additionally, Incremental List Results and Incremental Object Results have
further requirements.

**Incremental List Result Format**

An Incremental List Result's `id` entry must match the `id` that was returned in
a prior Pending Result. This Pending Result must be associated with a `@stream`
directive.

The Incremental List Result's path can be determined using the prior Pending
Result with the same `id` as this Incremental Result. The Incremental List
Result's path is the same as the Pending Result's `path`.

Every Incremental List Result must contain an `items` entry. The `items` entry
must contain a list of additional list items for the response field at the
Incremental List Result's `path`. This output will be a list of the same type of
the response field at this path.

If any field errors were raised during the execution of the results in `items`
and these errors propagate to a path higher than the Incremental List Result's
path, The Incremental List Result is considered failed and should not be
included in the response stream. The errors that caused this failure will be
included in a Completed Result.

If any field errors were raised during the execution of the results in `items`
and these errors did not propagate to a path higher than the Incremental List
Result's path, the Incremental List Result must contain an entry with key
`errors` containing these field errors. The value of this entry is described in
the "Errors" section.

**Incremental Object Result Format**

An Incremental Object Result's `id` entry must match the `id` that was returned
in a prior Pending Result. This Pending Result must be associated with a
`@defer` directive.

The Incremental Object Result's path can be determined using the prior Pending
Result with the same `id` as this Incremental Result. The Incremental Object
Result may contain a `subPath` entry. If the `subPath` entry is present, The
Incremental Object Result's path can be determined by concatenating the Pending
Result's `path` with this `subPath`. If no `subPath` entry is present, the path
is the same as the Pending Result's `path`.

Every Incremental Object Result must contain a `data` entry. The `data` entry
must contain a map of additional response fields. The `data` entry in an
Incremental Object Result will be of the type of a particular field in the
GraphQL result. The Incremental Object Result's path will contain the path
segments of the field this data is associated with.

An Incremental Object Result's data may contain response fields that were
contained in more than one deferred fragments. In that case, the `id` of the
Incremental Object Result must point to the Pending Result that results in the
shortest path.

If any field errors were raised during the execution of the results in `data`
and these errors propagated to a path higher than the Incremental Object
Result's path, The Incremental Object Result is considered failed and should not
be included in the response stream. The errors that caused this failure will be
included in a Completed Result.

If any field errors were raised during the execution of the results in `data`
and these errors did not propagate to a path higher than the Incremental Object
Result's path, the Incremental Object Result must contain an entry with key
`errors` containing these field errors. The value of this entry is described in
the "Errors" section.

### Completed

The `completed` entry in the response is a non-empty list of Completed Results.
If the response of the GraphQL operation is an incremental stream, this field
may appear on both the initial and subsequent responses. If present, the
`completed` entry must contain at least one Completed Result.

Each Completed Result corresponds to a prior Pending Result. The Completed
Result is used to communicate that the GraphQL service has completed the
incremental delivery of the data associated with the corresponding Pending
Result. The associated data must have been completed in the current response.

**Completed Result Format**

Every Completed Result must contain an entry with the key `id` with a string
value. The `id` entry must match the `id` that was returned in a prior Pending
Result.

A Completed Result may contain an `errors` entry. When the `errors` entry is
present, it informs clients that the delivery of the data associated with the
corresponding Pending Result has failed, due to an error bubbling to a path
higher than the Incremental Data Result's path. The `errors` entry must contain
these field errors. The value of this entry is described in the "Errors"
section.

## Serialization Format

GraphQL does not require a specific serialization format. However, clients
should use a serialization format that supports the major primitives in the
GraphQL response. In particular, the serialization format must at least support
representations of the following four primitives:

- Map
- List
- String
- Null

A serialization format should also support the following primitives, each
representing one of the common GraphQL scalar types, however a string or simpler
primitive may be used as a substitute if any are not directly supported:

- Boolean
- Int
- Float
- Enum Value

This is not meant to be an exhaustive list of what a serialization format may
encode. For example custom scalars representing a Date, Time, URI, or number
with a different precision may be represented in whichever relevant format a
given serialization format may support.

### JSON Serialization

JSON is the most common serialization format for GraphQL. Though as mentioned
above, GraphQL does not require a specific serialization format.

When using JSON as a serialization of GraphQL responses, the following JSON
values should be used to encode the related GraphQL values:

| GraphQL Value | JSON Value        |
| ------------- | ----------------- |
| Map           | Object            |
| List          | Array             |
| Null          | {null}            |
| String        | String            |
| Boolean       | {true} or {false} |
| Int           | Number            |
| Float         | Number            |
| Enum Value    | String            |

Note: For consistency and ease of notation, examples of responses are given in
JSON format throughout this document.

### Serialized Map Ordering

Since the result of evaluating a _selection set_ is ordered, the serialized Map
of results should preserve this order by writing the map entries in the same
order as those fields were requested as defined by selection set execution.
Producing a serialized response where fields are represented in the same order
in which they appear in the request improves human readability during debugging
and enables more efficient parsing of responses if the order of properties can
be anticipated.

Serialization formats which represent an ordered map should preserve the order
of requested fields as defined by {CollectFields()} in the Execution section.
Serialization formats which only represent unordered maps but where order is
still implicit in the serialization's textual order (such as JSON) should
preserve the order of requested fields textually.

For example, if the request was `{ name, age }`, a GraphQL service responding in
JSON should respond with `{ "name": "Mark", "age": 30 }` and should not respond
with `{ "age": 30, "name": "Mark" }`.

While JSON Objects are specified as an
[unordered collection of key-value pairs](https://tools.ietf.org/html/rfc7159#section-4)
the pairs are represented in an ordered manner. In other words, while the JSON
strings `{ "name": "Mark", "age": 30 }` and `{ "age": 30, "name": "Mark" }`
encode the same value, they also have observably different property orderings.

Note: This does not violate the JSON spec, as clients may still interpret
objects in the response as unordered Maps and arrive at a valid value.
