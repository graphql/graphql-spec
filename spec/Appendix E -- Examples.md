# E. Appendix: Examples

## Incremental Delivery Examples

### Example 1 - A query containing both defer and stream

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

The response to this request will be an _incremental stream_ consisting of an
_initial execution result_ followed by one or more _execution update result_.

The _initial execution result_ has:

- a {"data"} entry containing the results of the GraphQL operation except for
  the `@defer` and `@stream` selections;
- a {"pending"} entry containing two _pending result_, one for the `@defer`
  selection and for the the `@stream` selection, indicating that these results
  will be delivered in a later _execution update result_;
- a {"hasNext"} entry with the value {true}, indicating that the response is not
  yet complete.

If an error were to occur, it would also have an {"error"} entry; but not in
this example.

```json example
{
  "data": {
    "person": {
      "name": "Luke Skywalker",
      "films": [{ "title": "A New Hope" }]
    }
  },
  "pending": [
    { "id": "0", "path": ["person"], "label": "homeWorldDefer" },
    { "id": "1", "path": ["person", "films"], "label": "filmsStream" }
  ],
  "hasNext": true
}
```

Depending on the behavior of the backend and the time at which the deferred and
streamed resources resolve, the stream may produce results in different orders.
In this example, our first _execution update result_ contains the deferred data
and the first streamed list item. There is one _completed result_, indicating
that the deferred data has been completely delivered.

```json example
{
  "incremental": [
    {
      "id": "0",
      "data": { "homeWorld": { "name": "Tatooine" } }
    },
    {
      "id": "1",
      "items": [{ "title": "The Empire Strikes Back" }]
    }
  ],
  "completed": [
    {"id": "0"}
  ]
  "hasNext": true
}
```

The second _execution update result_ contains the final stream results. In this
example, the underlying iterator does not close synchronously so {"hasNext"} is
set to {true}. If this iterator did close synchronously, {"hasNext"} would be
set to {false} and this would be the final execution update result.

```json example
{
  "incremental": [
    {
      "id": "1",
      "items": [{ "title": "Return of the Jedi" }]
    }
  ],
  "hasNext": true
}
```

The third _execution update result_ contains no incremental data. {"hasNext"}
set to {false} indicates the end of the _incremental stream_. This execution
update result is sent when the underlying iterator of the `films` field closes.

```json example
{
  "hasNext": false
}
```

### Example 2 - A query containing overlapping defers

```graphql example
query {
  person(id: "cGVvcGxlOjE=") {
    ...HomeWorldFragment @defer(label: "homeWorldDefer")
    ...NameAndHomeWorldFragment @defer(label: "nameAndWorld")
    firstName
  }
}
fragment HomeWorldFragment on Person {
  homeWorld {
    name
    terrain
  }
}

fragment NameAndHomeWorldFragment on Person {
  firstName
  lastName
  homeWorld {
    name
  }
}
```

In this example the response is an _incremental stream_ of the following
results.

The _initial execution result_ contains the results of the `firstName` field.
Even though it is also present in the `HomeWorldFragment`, it must be returned
in the initial execution result because it is also defined outside of any
fragments with the `@defer` directive. Additionally, there are two _pending
result_ indicating that results for both `@defer`s in the query will be
delivered in later _execution update result_.

```json example
{
  "data": {
    "person": {
      "firstName": "Luke"
    }
  },
  "pending": [
    { "id": "0", "path": ["person"], "label": "homeWorldDefer" },
    { "id": "1", "path": ["person"], "label": "nameAndWorld" }
  ],
  "hasNext": true
}
```

In this example, the first _execution update result_ contains the deferred data
from `HomeWorldFragment`. There is one _completed result_, indicating that
`HomeWorldFragment` has been completely delivered. Because the `homeWorld` field
is present in two separate `@defer`s, it is separated into its own _incremental
result_.

The second _incremental result_ in this _execution update result_ contains the
data for the `terrain` field. This _incremental result_ contains a {"subPath"}
entry to indicate to clients that the _response position_ of this result can be
determined by concatenating the path from the _pending result_ with id `"0"` and
the value of this {"subPath"} entry.

```json example
{
  "incremental": [
    {
      "id": "0",
      "data": { "homeWorld": { "name": "Tatooine" } }
    },
    {
      "id": "0",
      "subPath": ["homeWorld"],
      "data": { "terrain": "desert" }
    }
  ],
  "completed": [{ "id": "0" }],
  "hasNext": true
}
```

The second _execution update result_ contains the remaining data from the
`NameAndHomeWorldFragment`. `lastName` is the only remaining field from this
selection that has not been delivered in a previous result. With this field now
delivered, clients are informed that the `NameAndHomeWorldFragment` has been
completed by the presence of the associated _completed result_. Additionally,
{"hasNext"} is set to {false} indicating the end of the _incremental stream_.

```json example
{
  "incremental": [
    {
      "id": "1",
      "data": { "lastName": "Skywalker" }
    }
  ],
  "completed": [{ "id": "1" }],
  "hasNext": false
}
```
