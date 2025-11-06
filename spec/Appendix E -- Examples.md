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

The _incremental stream_ might look like:

The _initial execution result_ does not contain any deferred or streamed results
in the {"data"} entry. The initial execution result contains a {"hasNext"}
entry, indicating that _execution update result_ will be delivered. There are
two _pending result_ indicating that results for both the `@defer` and `@stream`
in the query will be delivered in the execution update results.

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

_Execution update result_ 1 contains the deferred data and the first streamed
list item. There is one _completed result_, indicating that the deferred data
has been completely delivered.

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

_Execution update result_ 2 contains the final stream results. In this example,
the underlying iterator does not close synchronously so {"hasNext"} is set to
{true}. If this iterator did close synchronously, {"hasNext"} would be set to
{false} and this would be the final execution update result.

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

_Execution update result_ 3 contains no incremental data. {"hasNext"} set to
{false} indicates the end of the _incremental stream_. This response is sent
when the underlying iterator of the `films` field closes.

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

The _incremental stream_ might look like:

The _initial execution result_ contains the results of the `firstName` field.
Even though it is also present in the `HomeWorldFragment`, it must be returned
in the initial response because it is also defined outside of any fragments with
the `@defer` directive. Additionally, there are two _pending result_ indicating
that results for both `@defer`s in the query will be delivered in the execution
update results.

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

_Execution update result_ 1 contains the deferred data from `HomeWorldFragment`.
There is one Completed Result, indicating that `HomeWorldFragment` has been
completely delivered. Because the `homeWorld` field is present in two separate
`@defer`s, it is separated into its own _incremental result_.

The second _incremental result_ contains the data for the `terrain` field. This
_incremental result_ contains a {"subPath"} entry to indicate to clients that
the path of this result can be determined by concatenating the path from the
_pending result_ with id `"0"` and this {"subPath"} entry.

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

_Execution update result_ 2 contains the remaining data from the
`NameAndHomeWorldFragment`. `lastName` is the only remaining field that has not
been delivered in a previous response.

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
