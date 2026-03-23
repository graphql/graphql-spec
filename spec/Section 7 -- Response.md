# Response

When a GraphQL service receives a _request_, it must return a well-formed
response. The service's response describes the result of executing the requested
operation if successful, and describes any errors raised during the request.

A response may contain both a partial response as well as a list of errors in
the case that any _execution error_ was raised and replaced with {null}.

## Response Format

:: A GraphQL request returns a _response_. A _response_ is either an _execution
result_, a _response stream_, an _incremental stream_, or a _request error
result_.

### Execution Result

:: A GraphQL request returns an _execution result_ when the GraphQL operation is
a query or mutation and the request included execution. Additionally, for each
event in a subscription's _source stream_, the _response stream_ will emit an
_execution result_.

An _execution result_ must be a map.

The _execution result_ must contain an entry with key {"data"}. The value of
this entry is described in the "Data" section.

If execution raised any errors, the _execution result_ must contain an entry
with key {"errors"}. The value of this entry must be a non-empty list of
_execution error_ raised during execution. Each error must be a map as described
in the "Errors" section below. If the request completed without raising any
errors, this entry must not be present.

Note: When {"errors"} is present in an _execution result_, it may be helpful for
it to appear first when serialized to make it more apparent that errors are
present.

The _execution result_ may also contain an entry with key `extensions`. The
value of this entry is described in the "Extensions" section.

### Response Stream

:: A GraphQL request returns a _response stream_ when the GraphQL operation is a
subscription and the request included execution. A response stream must be a
stream of _execution result_.

### Incremental Stream

:: A GraphQL request returns an _incremental stream_ when the GraphQL service
has deferred or streamed data as a result of the `@defer` or `@stream`
directives. When the result of the GraphQL operation is an incremental stream,
the first payload will be an _initial incremental stream result_, optionally
followed by one or more _incremental stream update result_.

### Request Error Result

:: A GraphQL request returns a _request error result_ when one or more _request
error_ are raised, causing the request to fail before execution. This request
will result in no response data.

Note: A _request error_ may be raised before execution due to missing
information, syntax errors, validation failure, coercion failure, or any other
reason the implementation may determine should prevent the request from
proceeding.

A _request error result_ must be a map.

The _request error result_ map must contain an entry with key {"errors"}. The
value of this entry must be a non-empty list of _request error_ raised during
the _request_. It must contain at least one _request error_ indicating why no
data was able to be returned. Each error must be a map as described in the
"Errors" section below.

Note: It may be helpful for the {"errors"} key to appear first when serialized
to make it more apparent that errors are present.

The _request error result_ map must not contain an entry with key {"data"}.

The _request error result_ map may also contain an entry with key `extensions`.
The value of this entry is described in the "Extensions" section.

### Initial Incremental Stream Result

:: An _initial incremental stream result_ contains the result of executing any
non-deferred selections, along with any errors that occurred during their
execution, as well as details of any future _incremental stream update result_
to be expected. An initial incremental stream result must be the first payload
yielded by an _incremental stream_.

An _initial incremental stream result_ must be a map.

The _initial incremental stream result_ must contain entries with keys {"data"},
{"pending"}, and {"hasNext"}, and may contain entries with keys {"errors"},
{"incremental"}, {"completed"}, and {"extensions"}.

The value of {"data"}, {"errors"} and {"extensions"} are defined in the same way
as an _execution result_ as described in the "Data", "Errors", and "Extensions"
sections below.

The value of {"hasNext"} must be {false} if the initial incremental stream
result is the last response of the incremental stream. Otherwise, {"hasNext"}
must be {true}.

The value of {"pending"} must be a non-empty list of _incremental pending
notice_. Each _incremental pending notice_ must be a map as described in the
"Incremental Pending Notice" section below.

The value of {"incremental"}, if present, must be a non-empty list of
_incremental result_. Each _incremental result_ must be a map as described in
the "Incremental Result" section below.

The value of {"completed"}, if present, must be a non-empty list of _completed
result_. Each _completed result_ must be a map as described in the "Completed
Result" section below.

Note: A GraphQL service is permitted to include incrementally delivered data in
the _initial incremental stream_. For example, A GraphQL middleware layer, such
as a caching CDN or proxy service, may wish to intercept and rewrite the
_incremental stream_ before delivering it to a client. This service may collect
some or all of the _incremental pending notice_, _incremental result_, and
_completed result_ from the entire _incremental stream_ of the upstream service,
and construct a new incremental stream containing a single payload: an _initial
incremental stream result_ containing the all of the intercepted incremental
pending notices, incremental results, and completed results, and the {"hasNext"}
entry set to false. This would allow the client to efficiently render the entire
result without having to process multiple payloads.

### Incremental Stream Update Result

:: An _incremental stream update result_ contains the result of executing any
deferred selections, along with any errors that occurred during their execution,
as well as details of any future _incremental stream update result_ to be
expected. All payloads yielded by an _incremental stream_, except the first,
must be incremental stream update results.

An _incremental stream update result_ must be a map.

The _incremental stream update result_ must contain an entry with the key
{"hasNext"}, and may contain entries with the keys {"pending"}, {"incremental"},
{"completed"}, and {"extensions"}. Unlike the _initial incremental stream
result_, an _incremental stream update result_ must not contain entries with
keys {"data"} or {"errors"}.

The value of {"hasNext"} must be {true} for all but the last response in the
_incremental stream_. Otherwise, {"hasNext"} must be {true}.

The value of {"pending"}, {"incremental"}, and/or {"completed"}, if present are
defined in the same way as an _initial incremental stream result_ as described
in the "Incremental Pending Notice", "Incremental Result", and "Completed
Result" sections below.

The value of {"extensions"}, if present, is defined in the same way as an
_execution result_ as described in the "Extensions" section below.

### Response Position

<a name="sec-Path">
  <!-- Legacy link, this section was previously titled "Path" -->
</a>

:: A _response position_ is a uniquely identifiable position in the response
data produced during execution. It is either a direct entry in the {resultMap}
of a {ExecuteSelectionSet()}, or it is a position in a (potentially nested) List
value. Each response position is uniquely identifiable via a _response path_.

:: A _response path_ uniquely identifies a _response position_ via a list of
path segments (response names or list indices) starting at the root of the
response and ending with the associated response position.

The value for a _response path_ must be a list of path segments. Path segments
that represent field _response name_ must be strings, and path segments that
represent list indices must be 0-indexed integers. If a path segment is
associated with an aliased field it must use the aliased name, since it
represents a path in the response, not in the request.

When a _response path_ is present on an _error result_, it identifies the
_response position_ which raised the error.

When a _response path_ is present on an _incremental pending notice_, it
identifies the _response position_ of the incremental data update.

A single field execution may result in multiple response positions. For example,

```graphql example
{
  hero(episode: $episode) {
    name
    friends {
      name
    }
  }
}
```

The hero's name would be found in the _response position_ identified by the
_response path_ `["hero", "name"]`. The List of the hero's friends would be
found at `["hero", "friends"]`, the hero's first friend at
`["hero", "friends", 0]` and that friend's name at
`["hero", "friends", 0, "name"]`.

### Data

The {"data"} entry in the _execution result_ will be the result of the execution
of the requested operation. If the operation was a query, this output will be an
object of the query root operation type; if the operation was a mutation, this
output will be an object of the mutation root operation type.

The response data is the result of accumulating the resolved result of all
response positions during execution.

If an error was raised before execution begins, the _response_ must be a
_request error result_ which will result in no response data.

If an error was raised during the execution that prevented a valid response, the
{"data"} entry in the response should be `null`.

### Errors

The {"errors"} entry in the _execution result_ or _request error result_ is a
non-empty list of errors raised during the _request_, where each error is a map
of data described by the error result format below.

**Request Errors**

:: A _request error_ is an error raised during a _request_ which results in no
response data. Typically raised before execution begins, a request error may
occur due to a parse grammar or validation error in the _Document_, an inability
to determine which operation to execute, or invalid input values for variables.

A request error is typically the fault of the requesting client.

If a request error is raised, the _response_ must be a _request error result_.
The {"data"} entry in this map must not be present, the {"errors"} entry must
include the error, and request execution should be halted.

**Execution Errors**

<a name="sec-Errors.Field-Errors">
  <!-- Legacy link, this section was previously titled "Field Errors" -->
</a>

:: An _execution error_ is an error raised during the execution of a particular
field which results in partial response data. This may occur due to failure to
coerce the arguments for the field, an internal error during value resolution,
or failure to coerce the resulting value.

Note: In previous versions of this specification _execution error_ was called
_field error_.

An execution error is typically the fault of a GraphQL service.

An _execution error_ must occur at a specific _response position_, and may occur
in any response position. The response position of an execution error is
indicated via a _response path_ in the error response's {"path"} entry.

When an execution error is raised at a given _response position_, then that
response position must not be present within the _response_ {"data"} entry
(except {null}), and the {"errors"} entry must include the error. Nested
execution is halted and sibling execution attempts to continue, producing
partial result (see
[Handling Execution Errors](#sec-Handling-Execution-Errors)).

**Error Result Format**

Every error must contain an entry with the key {"message"} with a string
description of the error intended for the developer as a guide to understand and
correct the error.

If an error can be associated to a particular point in the requested GraphQL
document, it should contain an entry with the key {"locations"} with a list of
locations, where each location is a map with the keys {"line"} and {"column"},
both positive numbers starting from `1` which describe the beginning of an
associated syntax element.

If an error can be associated to a particular field in the GraphQL result, it
must contain an entry with the key {"path"} with a _response path_ which
describes the _response position_ which raised the error. This allows clients to
identify whether a {null} resolved result is a true value or the result of an
_execution error_.

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

### Extensions

The {"extensions"} entry in an _execution result_, _request error result_,
_initial incremental stream result_, or an _incremental stream update result_,
if set, must have a map as its value. This entry is reserved for implementers to
extend the protocol however they see fit, and hence there are no additional
restrictions on its contents.

### Incremental Pending Notice

:: A _incremental pending notice_ is used to communicate to clients that the
GraphQL service has chosen to incrementally deliver data associated with a
`@defer` or `@stream` directive. Each incremental pending notice corresponds to
a specific `@defer` or `@stream` directive located at a _response position_ in
the response data. The presence of an incremental pending notice indicates that
clients should expect the associated data in either the current response, or one
of the following responses.

**Incremental Pending Notice Format**

An _incremental pending notice_ must be a map.

An _incremental pending notice_ must contain entries with the keys {"id"} and
{"path"}, and may contain an entry with key {"label"}.

The value of {"id"} must be a string. This {"id"} should be used by clients to
correlate incremental pending notices with _incremental result_ and _completed
result_. The {"id"} value must be unique across the entire _incremental stream_
response. There must not be any other incremental pending notice in the
_incremental stream_ with the same {"id"}.

The value of {"path"} must be a _response position_. When the incremental
pending notice is associated with a `@stream` directive, it indicates the list
at this _response position_ is not known to be complete. Clients should expect
the GraphQL Service to incrementally deliver the remainder list items of this
list. When the incremental pending notice is associated with a `@defer`
directive, it indicates that the response fields contained in the deferred
fragment are not known to be complete. Clients should expect the GraphQL Service
to incrementally deliver the remainder of the fields contained in the deferred
fragment at this _response position_.

If the associated `@defer` or `@stream` directive contains a `label` argument,
the incremental pending notice must contain an entry {"label"} with the value of
this argument. Clients should use this entry to differentiate the _incremental
pending notices_ for different deferred fragments at the same _response
position_.

If an incremental pending notice is not returned for a `@defer` or `@stream`
directive, clients must assume that the GraphQL service chose not to
incrementally deliver this data, and the data can be found either in the
{"data"} entry in the _initial incremental stream result_, or one of the prior
_incremental stream update result_ in the _incremental stream_.

:: The _associated incremental pending notice_ of an _incremental result_ or
_completed result_ is the _incremental pending notice_ whose {"id"} entry has
the same value as the {"id"} entry of the given incremental result or completed
result.

### Incremental Result

:: The _incremental result_ is used to deliver data that the GraphQL service has
chosen to incrementally deliver. An incremental result may be either an
_incremental list result_ or an _incremental object result_.

An _incremental result_ must be a map.

Every _incremental result_ must contain an entry with the key {"id"}, the value
of which is a string referencing its _associated incremental pending notice_.
The associated incremental pending notice must appear either in the _initial
incremental stream result_, in a prior _incremental stream update result_, or in
the same _incremental stream update result_ as the _incremental result_ that
references it.

#### Incremental List Result

:: An _incremental list result_ is an _incremental result_ used to deliver
additional list items for a list field with a `@stream` directive. The
_associated incremental pending notice_ for this _incremental list result_ must
be associated with a `@stream` directive.

The _response position_ for an _incremental list result_ is the {"path"} entry
from its _associated incremental pending notice_.

**Incremental List Result Format**

Every _incremental list result_ must contain an {"items"} entry. The {"items"}
entry must contain a list of additional list items for the list field in the
incremental list result's _response position_. The value of this entry must be a
list of the same type of the response field at this _response position_.

If any _execution error_ were raised during the execution of the results in
{"items"} and these errors propagate to the _response position_ of the
_incremental list result_ (i.e. the streamed list), or a parent response
position of the incremental list result's response position (i.e. a parent of
the streamed list), the incremental list result is considered failed and should
not be included in the _incremental stream_. The errors that caused this failure
will be included in a _completed result_.

If any _execution error_ were raised during the execution of the results in
{"items"} and no such error propagated to the _response position_ of the
_incremental list result_, or a parent response position of the incremental list
result's response position, the incremental list result must contain an entry
with key {"errors"} containing these execution errors. The value of this entry
is described in the "Errors" section.

#### Incremental Object Result

:: An _incremental object result_ is an _incremental result_ used to deliver
additional response fields that were contained in one or more fragments with a
`@defer` directive. The _associated incremental pending notice_ for this
_incremental object result_ must be associated with a `@defer` directive.

**Incremental Object Result Format**

The _incremental object result_ may contain a {"subPath"} entry. If such an
entry is present, the _response position_ of the incremental object result is
the result of appending the value of this {"subPath"} to the value of the
{"path"} entry of the _associated incremental pending notice_. If no {"subPath"}
entry is present, the _response position_ is the value of the associated
incremental pending notice's {"path"} entry.

An _incremental object result_ may be used to deliver data for response fields
that were contained in more than one deferred fragment.

In that case, the _associated incremental pending notice_ of the incremental
object result must be one of the _incremental pending notice_ that corresponding
to a fragment that contained the delivered responsive fields. If any of these
incremental pending notices have a {"path"} of varying length, one of the
incremental pending notices with the longest {"path"} must be chosen to minimize
the size of the {"subPath"}.

Every _incremental object result_ must contain a {"data"} entry. The {"data"}
entry must contain a map of additional response fields. The {"data"} entry in an
incremental object result will be of the type of the field at the incremental
object result's _response position_.

If any _execution error_ were raised during the execution of the results in
{"data"} and these errors propagated to a parent _response position_ of the
_incremental object result_'s response position, the incremental object result
is considered failed and should not be included in the incremental stream. The
error that caused this failure will be included in a _completed result_.

If any _execution error_ were raised during the execution of the results in
{"data"} and no such error propagated to a parent _response position_ of the
_incremental object result_'s response position, the incremental object result
must contain an entry with key {"errors"} containing these execution errors. The
value of this entry is described in the "Errors" section.

### Completed Result

:: A _completed result_ is used to communicate that the GraphQL service has
completed the incremental delivery of the data associated with the _associated
incremental pending notice_. The corresponding data must have been completed in
the same _initial incremental stream result_ or _incremental stream update
result_ in which this completed result appears.

**Completed Result Format**

A _completed result_ must be a map.

A _completed result_ must contain an entry with the key {"id"}, and may contain
an entry with the key {"errors"}.

The value of {"id"} must be a string referencing its _associated incremental
pending notice_. The associated incremental pending notice must appear either in
the _initial incremental stream result_, in a prior _incremental stream update
result_, or in the same _incremental stream update result_ as the _completed
result_ that references it.

The value of {"errors"}, if present, informs clients that the delivery of the
data from the _associated incremental pending notice_ has failed, due to an
execution error propagating to a parent _response position_ of the _incremental
result_'s response position. The {"errors"} entry must contain these execution
errors. The value of this entry is described in the "Errors" section.

### Additional Entries

To ensure future changes to the protocol do not break existing services and
clients, any of the maps described in the "Response" section (with the exception
of {"extensions"}) must not contain any entries other than those described
above. Clients must ignore any entries other than those described above.

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
