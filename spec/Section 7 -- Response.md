# Response

When a GraphQL service receives a _request_, it must return a well-formed
response. The service's response describes the result of executing the requested
operation if successful, and describes any errors raised during the request.

A response may contain both a partial response as well as a list of errors in
the case that any _field error_ was raised on a field and was replaced with
{null}.

## Response Format

A response to a GraphQL request must be a map or a response stream of maps.

If the request raised any errors, the response map must contain an entry with
key `errors`. The value of this entry is described in the "Errors" section. If
the request completed without raising any errors, this entry must not be
present.

If the request included execution, the response map must contain an entry with
key `data`. The value of this entry is described in the "Data" section. If the
request failed before execution, due to a syntax error, missing information, or
validation error, this entry must not be present.

When the response of the GraphQL operation is a response stream, the first value
will be the initial response. All subsequent values may contain an `incremental`
entry, containing a list of Defer or Stream payloads.

The `label` and `path` entries on Defer and Stream payloads are used by clients
to identify the `@defer` or `@stream` directive from the GraphQL operation that
triggered this response to be included in an `incremental` entry on a value
returned by the response stream. When a label is provided, the combination of
these two entries will be unique across all Defer and Stream payloads returned
in the response stream.

If the response of the GraphQL operation is a response stream, each response map
must contain an entry with key `hasNext`. The value of this entry is `true` for
all but the last response in the stream. The value of this entry is `false` for
the last response of the stream. This entry must not be present for GraphQL
operations that return a single response map.

The GraphQL service may determine there are no more values in the response
stream after a previous value with `hasNext` equal to `true` has been emitted.
In this case the last value in the response stream should be a map without
`data` and `incremental` entries, and a `hasNext` entry with a value of `false`.

The response map may also contain an entry with key `extensions`. This entry, if
set, must have a map as its value. This entry is reserved for implementors to
extend the protocol however they see fit, and hence there are no additional
restrictions on its contents. When the response of the GraphQL operation is a
response stream, implementors may send subsequent response maps containing only
`hasNext` and `extensions` entries. Defer and Stream payloads may also contain
an entry with the key `extensions`, also reserved for implementors to extend the
protocol however they see fit.

To ensure future changes to the protocol do not break existing services and
clients, the top level response map must not contain any entries other than the
five described above.

Note: When `errors` is present in the response, it may be helpful for it to
appear first when serialized to make it more clear when errors are present in a
response during debugging.

### Data

The `data` entry in the response will be the result of the execution of the
requested operation. If the operation was a query, this output will be an object
of the query root operation type; if the operation was a mutation, this output
will be an object of the mutation root operation type.

If an error was raised before execution begins, the `data` entry should not be
present in the result.

If an error was raised during the execution that prevented a valid response, the
`data` entry in the response should be `null`.

### Errors

The `errors` entry in the response is a non-empty list of errors raised during
the _request_, where each error is a map of data described by the error result
format below.

If present, the `errors` entry in the response must contain at least one error.
If no errors were raised during the request, the `errors` entry must not be
present in the result.

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
field is described in the [Path](#sec-Path) section.

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
reserved for implementors to add additional information to errors however they
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

### Incremental Delivery

The `pending` entry in the response is a non-empty list of references to pending
Defer or Stream results. If the response of the GraphQL operation is a response
stream, this field should appear on the initial and possibly subsequent
payloads.

The `incremental` entry in the response is a non-empty list of data fulfilling
Defer or Stream results. If the response of the GraphQL operation is a response
stream, this field may appear on the subsequent payloads.

The `completed` entry in the response is a non-empty list of references to
completed Defer or Stream results. If errors are

For example, a query containing both defer and stream:

```graphql example
query {
  person(id: "cGVvcGxlOjE=") {
    ...HomeWorldFragment @defer(label: "homeWorldDefer")
    name
    films @stream(initialCount: 1, label: "filmsStream") {
      title
    }
  }
}
fragment HomeWorldFragment on Person {
  homeWorld {
    name
  }
}
```

The response stream might look like:

Response 1, the initial response does not contain any deferred or streamed
results.

```json example
{
  "data": {
    "person": {
      "name": "Luke Skywalker",
      "films": [{ "title": "A New Hope" }]
    }
  },
  "pending": [
    { "path": ["person"], "label": "homeWorldDefer" },
    { "path": ["person", "films"], "label": "filmStream" }
  ],
  "hasNext": true
}
```

Response 2, contains the defer payload and the first stream payload.

```json example
{
  "incremental": [
    {
      "path": ["person"],
      "data": { "homeWorld": { "name": "Tatooine" } }
    },
    {
      "path": ["person", "films"],
      "items": [{ "title": "The Empire Strikes Back" }]
    }
  ],
  "completed": [{ "path": ["person"], "label": "homeWorldDefer" }],
  "hasNext": true
}
```

Response 3, contains the final stream payload. In this example, the underlying
iterator does not close synchronously so {hasNext} is set to {true}. If this
iterator did close synchronously, {hasNext} would be set to {false} and this
would be the final response.

```json example
{
  "incremental": [
    {
      "path": ["person", "films"],
      "items": [{ "title": "Return of the Jedi" }]
    }
  ],
  "hasNext": true
}
```

Response 4, contains no incremental payloads. {hasNext} set to {false} indicates
the end of the response stream. This response is sent when the underlying
iterator of the `films` field closes.

```json example
{
  "completed": [{ "path": ["person", "films"], "label": "filmStream" }],
  "hasNext": false
}
```

#### Streamed data

Streamed data may appear as an item in the `incremental` entry of a response.
Streamed data is the result of an associated `@stream` directive in the
operation. A stream payload must contain `items` and `path` entries and may
contain `errors`, and `extensions` entries.

##### Items

The `items` entry in a stream payload is a list of results from the execution of
the associated @stream directive. This output will be a list of the same type of
the field with the associated `@stream` directive. If an error has caused a
`null` to bubble up to a field higher than the list field with the associated
`@stream` directive, then the stream will complete with errors.

#### Deferred data

Deferred data is a map that may appear as an item in the `incremental` entry of
a response. Deferred data is the result of an associated `@defer` directive in
the operation. A defer payload must contain `data` and `path` entries and may
contain `errors`, and `extensions` entries.

##### Data

The `data` entry in a Defer payload will be of the type of a particular field in
the GraphQL result. The adjacent `path` field will contain the path segments of
the field this data is associated with. If an error has caused a `null` to
bubble up to a field higher than the field that contains the fragment with the
associated `@defer` directive, then the fragment will complete with errors.

#### Path

A `path` field allows for the association to a particular field in a GraphQL
result. This field should be a list of path segments starting at the root of the
response and ending with the field to be associated with. Path segments that
represent fields should be strings, and path segments that represent list
indices should be 0-indexed integers. If the path is associated to an aliased
field, the path should use the aliased name, since it represents a path in the
response, not in the request.

When the `path` field is present on a Stream payload, it indicates that the
`items` field represents the partial result of the list field containing the
corresponding `@stream` directive. All but the non-final path segments must
refer to the location of the list field containing the corresponding `@stream`
directive. The final segment of the path list must be a 0-indexed integer. This
integer indicates that this result is set at a range, where the beginning of the
range is at the index of this integer, and the length of the range is the length
of the data.

When the `path` field is present on a Defer payload, it indicates that the
`data` field represents the result of the fragment containing the corresponding
`@defer` directive. The path segments must point to the location of the result
of the field containing the associated `@defer` directive.

When the `path` field is present on an "Error result", it indicates the response
field which experienced the error.

#### Label

Stream and Defer payloads may contain a string field `label`. This `label` is
the same label passed to the `@defer` or `@stream` directive associated with the
response. This allows clients to identify which `@defer` or `@stream` directive
is associated with this value. `label` will not be present if the corresponding
`@defer` or `@stream` directive is not passed a `label` argument.

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

Since the result of evaluating a selection set is ordered, the serialized Map of
results should preserve this order by writing the map entries in the same order
as those fields were requested as defined by selection set execution. Producing
a serialized response where fields are represented in the same order in which
they appear in the request improves human readability during debugging and
enables more efficient parsing of responses if the order of properties can be
anticipated.

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
