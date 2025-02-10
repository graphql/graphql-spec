# C. Appendix: Examples

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

The incremental stream might look like:

The initial response does not contain any deferred or streamed results in the
`data` entry. The initial response contains a `hasNext` entry, indicating that
subsequent responses will be delivered. There are two Pending Results indicating
that results for both the `@defer` and `@stream` in the query will be delivered
in the subsequent responses.

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

Subsequent response 1, contains the deferred data and the first streamed list
item. There is one Completed Result, indicating that the deferred data has been
completely delivered.

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

Subsequent response 2, contains the final stream results. In this example, the
underlying iterator does not close synchronously so {hasNext} is set to {true}.
If this iterator did close synchronously, {hasNext} would be set to {false} and
this would be the final response.

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

Subsequent response 3, contains no incremental data. {hasNext} set to {false}
indicates the end of the incremental stream. This response is sent when the
underlying iterator of the `films` field closes.

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

The incremental stream might look like:

The initial response contains the results of the `firstName` field. Even though
it is also present in the `HomeWorldFragment`, it must be returned in the
initial response because it is also defined outside of any fragments with the
`@defer` directive. Additionally, There are two Pending Results indicating that
results for both `@defer`s in the query will be delivered in the subsequent
responses.

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

Subsequent response 1, contains the deferred data from `HomeWorldFragment`.
There is one Completed Result, indicating that `HomeWorldFragment` has been
completely delivered. Because the `homeWorld` field is present in two separate
`@defer`s, it is separated into its own Incremental Result.

The second Incremental Result contains the data for the `terrain` field. This
incremental result contains a `subPath` property to indicate to clients that the
path of this result can be determined by concatenating the path from the Pending
Result with id `"0"` and this `subPath` entry.

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

Subsequent response 2, contains the remaining data from the
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
