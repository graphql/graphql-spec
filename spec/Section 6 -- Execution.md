# Execution

A GraphQL service generates a response from a request via execution.

:: A _request_ for execution consists of a few pieces of information:

- The schema to use, typically solely provided by the GraphQL service.
- A {Document} which must contain GraphQL {OperationDefinition} and may contain
  {FragmentDefinition}.
- Optionally: The name of the Operation in the Document to execute.
- Optionally: Values for any Variables defined by the Operation.
- An initial value corresponding to the root type being executed. Conceptually,
  an initial value represents the "universe" of data available via a GraphQL
  Service. It is common for a GraphQL Service to always use the same initial
  value for every request.

Given this information, the result of {ExecuteRequest()} produces the response,
to be formatted according to the Response section below.

Note: GraphQL requests do not require any specific serialization format or
transport mechanism. Message serialization and transport mechanisms should be
chosen by the implementing service.

## Executing Requests

To execute a request, the executor must have a parsed {Document} and a selected
operation name to run if the document defines multiple operations, otherwise the
document is expected to only contain a single operation. The result of the
request is determined by the result of executing this operation according to the
"Executing Operations” section below.

ExecuteRequest(schema, document, operationName, variableValues, initialValue):

Note: the execution assumes implementing language supports coroutines.
Alternatively, the socket can provide a write buffer pointer to allow
{ExecuteRequest()} to directly write payloads into the buffer.

- Let {operation} be the result of {GetOperation(document, operationName)}.
- Let {coercedVariableValues} be the result of {CoerceVariableValues(schema,
  operation, variableValues)}.
- If {operation} is a query operation:
  - Return {ExecuteQuery(operation, schema, coercedVariableValues,
    initialValue)}.
- Otherwise if {operation} is a mutation operation:
  - Return {ExecuteMutation(operation, schema, coercedVariableValues,
    initialValue)}.
- Otherwise if {operation} is a subscription operation:
  - Return {Subscribe(operation, schema, coercedVariableValues, initialValue)}.

GetOperation(document, operationName):

- If {operationName} is {null}:
  - If {document} contains exactly one operation.
    - Return the Operation contained in the {document}.
  - Otherwise raise a _request error_ requiring {operationName}.
- Otherwise:
  - Let {operation} be the Operation named {operationName} in {document}.
  - If {operation} was not found, raise a _request error_.
  - Return {operation}.

### Validating Requests

As explained in the Validation section, only requests which pass all validation
rules should be executed. If validation errors are known, they should be
reported in the list of "errors" in the response and the request must fail
without execution.

Typically validation is performed in the context of a request immediately before
execution, however a GraphQL service may execute a request without immediately
validating it if that exact same request is known to have been validated before.
A GraphQL service should only execute requests which _at some point_ were known
to be free of any validation errors, and have since not changed.

For example: the request may be validated during development, provided it does
not later change, or a service may validate a request once and memoize the
result to avoid validating the same request again in the future.

### Coercing Variable Values

If the operation has defined any variables, then the values for those variables
need to be coerced using the input coercion rules of variable's declared type.
If a _request error_ is encountered during input coercion of variable values,
then the operation fails without execution.

CoerceVariableValues(schema, operation, variableValues):

- Let {coercedValues} be an empty unordered Map.
- Let {variablesDefinition} be the variables defined by {operation}.
- For each {variableDefinition} in {variablesDefinition}:
  - Let {variableName} be the name of {variableDefinition}.
  - Let {variableType} be the expected type of {variableDefinition}.
  - Assert: {IsInputType(variableType)} must be {true}.
  - Let {defaultValue} be the default value for {variableDefinition}.
  - Let {hasValue} be {true} if {variableValues} provides a value for the name
    {variableName}.
  - Let {value} be the value provided in {variableValues} for the name
    {variableName}.
  - If {hasValue} is not {true} and {defaultValue} exists (including {null}):
    - Add an entry to {coercedValues} named {variableName} with the value
      {defaultValue}.
  - Otherwise if {variableType} is a Non-Nullable type, and either {hasValue} is
    not {true} or {value} is {null}, raise a _request error_.
  - Otherwise if {hasValue} is true:
    - If {value} is {null}:
      - Add an entry to {coercedValues} named {variableName} with the value
        {null}.
    - Otherwise:
      - If {value} cannot be coerced according to the input coercion rules of
        {variableType}, raise a _request error_.
      - Let {coercedValue} be the result of coercing {value} according to the
        input coercion rules of {variableType}.
      - Add an entry to {coercedValues} named {variableName} with the value
        {coercedValue}.
- Return {coercedValues}.

Note: This algorithm is very similar to {CoerceArgumentValues()}.

## Executing Operations

The type system, as described in the "Type System" section of the spec, must
provide a query root operation type. If mutations or subscriptions are
supported, it must also provide a mutation or subscription root operation type,
respectively.

### Query

If the operation is a query, the result of the operation is the result of
executing the operation’s top level selection set with the query root operation
type.

An initial value may be provided when executing a query operation.

ExecuteQuery(query, schema, variableValues, initialValue):

- Let {publisherRecord} be the result of {CreatePublisher()}.
- Let {queryType} be the root Query type in {schema}.
- Assert: {queryType} is an Object type.
- Let {selectionSet} be the top level Selection Set in {query}.
- Let {groupedFieldSet} and {deferUsages} be the result of
  {CollectRootFields(queryType, selectionSet, variableValues)}.
- Initialize {deferMap} to an empty map of Defer Usage records to Async Payload
  records.
- For each {deferUsage} in {deferUsages}:
  - Let {deferRecord} be a new Async Payload record created from {deferUsage}.
  - Set the record in {deferMap} for {deferUsage} equal to {deferRecord}.
- Let {data} be the result of running {ExecuteGroupedFieldSet(groupedFieldSet,
  queryType, initialValue, variableValues, deferMap, publisherRecord)}
  _normally_ (allowing parallelization).
- Let {errors} be the list of all _field error_ raised while executing the
  selection set.
- If {HasNext(publisherRecord)} is {false}:
  - Return an unordered map containing {data} and {errors}.
- Otherwise:
  - Let {initialResponse} be an unordered map containing {data}, {errors}, and
    an entry named {hasNext} with the value {true}.
  - Let {iterator} be the result of running
    {YieldSubsequentPayloads(initialResponse, publisherRecord)}.
  - For each {payload} yielded by {iterator}:
    - If a termination signal is received:
      - Send a termination signal to {iterator}.
      - Return.
    - Otherwise:
      - Yield {payload}.

### Mutation

If the operation is a mutation, the result of the operation is the result of
executing the operation’s top level selection set on the mutation root object
type. This selection set should be executed serially.

It is expected that the top level fields in a mutation operation perform
side-effects on the underlying data system. Serial execution of the provided
mutations ensures against race conditions during these side-effects.

ExecuteMutation(mutation, schema, variableValues, initialValue):

- Let {publisherRecord} be the result of {CreatePublisher()}.
- Let {mutationType} be the root Mutation type in {schema}.
- Assert: {mutationType} is an Object type.
- Let {selectionSet} be the top level Selection Set in {mutation}.
- Let {groupedFieldSet} and {deferUsages} be the result of
  {CollectRootFields(mutationType, selectionSet, variableValues)}.
- Initialize {deferMap} to an empty map of Defer Usage records to Async Payload
  records.
- For each {deferUsage} in {deferUsages}:
  - Let {deferRecord} be a new Async Payload record created from {deferUsage}.
  - Set the record in {deferMap} for {deferUsage} equal to {deferRecord}.
- Let {data} be the result of running {ExecuteGroupedFieldSet(groupedFieldSet,
  mutationType, initialValue, variableValues, deferMap, publisherRecord)}
  _serially_.
- Let {errors} be the list of all _field error_ raised while executing the
  selection set.
- If {HasNext(publisherRecord)} is {false}:
  - Return an unordered map containing {data} and {errors}.
- Otherwise:
  - Let {initialResponse} be an unordered map containing {data}, {errors}, and
    an entry named {hasNext} with the value {true}.
  - Let {iterator} be the result of running
    {YieldSubsequentPayloads(initialResponse, publisherRecord)}.
  - For each {payload} yielded by {iterator}:
    - If a termination signal is received:
      - Send a termination signal to {iterator}.
      - Return.
    - Otherwise:
      - Yield {payload}.

### Subscription

If the operation is a subscription, the result is an event stream called the
"Response Stream" where each event in the event stream is the result of
executing the operation for each new event on an underlying "Source Stream".

Executing a subscription operation creates a persistent function on the service
that maps an underlying Source Stream to a returned Response Stream.

Subscribe(subscription, schema, variableValues, initialValue):

- Let {sourceStream} be the result of running
  {CreateSourceEventStream(subscription, schema, variableValues, initialValue)}.
- Let {responseStream} be the result of running
  {MapSourceToResponseEvent(sourceStream, subscription, schema, variableValues)}
- Return {responseStream}.

Note: In a large-scale subscription system, the {Subscribe()} and
{ExecuteSubscriptionEvent()} algorithms may be run on separate services to
maintain predictable scaling properties. See the section below on Supporting
Subscriptions at Scale.

As an example, consider a chat application. To subscribe to new messages posted
to the chat room, the client sends a request like so:

```graphql example
subscription NewMessages {
  newMessage(roomId: 123) {
    sender
    text
  }
}
```

While the client is subscribed, whenever new messages are posted to chat room
with ID "123", the selection for "sender" and "text" will be evaluated and
published to the client, for example:

```json example
{
  "data": {
    "newMessage": {
      "sender": "Hagrid",
      "text": "You're a wizard!"
    }
  }
}
```

The "new message posted to chat room" could use a "Pub-Sub" system where the
chat room ID is the "topic" and each "publish" contains the sender and text.

**Event Streams**

An event stream represents a sequence of discrete events over time which can be
observed. As an example, a "Pub-Sub" system may produce an event stream when
"subscribing to a topic", with an event occurring on that event stream for each
"publish" to that topic. Event streams may produce an infinite sequence of
events or may complete at any point. Event streams may complete in response to
an error or simply because no more events will occur. An observer may at any
point decide to stop observing an event stream by cancelling it, after which it
must receive no more events from that event stream.

**Supporting Subscriptions at Scale**

Supporting subscriptions is a significant change for any GraphQL service. Query
and mutation operations are stateless, allowing scaling via cloning of GraphQL
service instances. Subscriptions, by contrast, are stateful and require
maintaining the GraphQL document, variables, and other context over the lifetime
of the subscription.

Consider the behavior of your system when state is lost due to the failure of a
single machine in a service. Durability and availability may be improved by
having separate dedicated services for managing subscription state and client
connectivity.

**Delivery Agnostic**

GraphQL subscriptions do not require any specific serialization format or
transport mechanism. GraphQL specifies algorithms for the creation of the
response stream, the content of each payload on that stream, and the closing of
that stream. There are intentionally no specifications for message
acknowledgement, buffering, resend requests, or any other quality of service
(QoS) details. Message serialization, transport mechanisms, and quality of
service details should be chosen by the implementing service.

#### Source Stream

A Source Stream represents the sequence of events, each of which will trigger a
GraphQL execution corresponding to that event. Like field value resolution, the
logic to create a Source Stream is application-specific.

CreateSourceEventStream(subscription, schema, variableValues, initialValue):

- Let {subscriptionType} be the root Subscription type in {schema}.
- Assert: {subscriptionType} is an Object type.
- Let {selectionSet} be the top level Selection Set in {subscription}.
- Let {groupedFieldSet} be the result of {CollectRootFields(subscriptionType,
  selectionSet, variableValues)}.}
- If {groupedFieldSet} does not have exactly one entry, raise a _request error_.
- Let {fieldGroup} be that entry.
- Let {fieldName} be the corresponding entry on {fieldGroup}. Note: This value
  is unaffected if an alias is used.
- Let {fields} by the corresponding entry of {fieldGroup}.
- Let {field} be the first entry of the first list in {fields}.
- Let {argumentValues} be the result of {CoerceArgumentValues(subscriptionType,
  field, variableValues)}
- Let {fieldStream} be the result of running
  {ResolveFieldEventStream(subscriptionType, initialValue, fieldName,
  argumentValues)}.
- Return {fieldStream}.

ResolveFieldEventStream(subscriptionType, rootValue, fieldName, argumentValues):

- Let {resolver} be the internal function provided by {subscriptionType} for
  determining the resolved event stream of a subscription field named
  {fieldName}.
- Return the result of calling {resolver}, providing {rootValue} and
  {argumentValues}.

Note: This {ResolveFieldEventStream()} algorithm is intentionally similar to
{ResolveFieldValue()} to enable consistency when defining resolvers on any
operation type.

#### Response Stream

Each event in the underlying Source Stream triggers execution of the
subscription selection set using that event as a root value.

MapSourceToResponseEvent(sourceStream, subscription, schema, variableValues):

- Return a new event stream {responseStream} which yields events as follows:
- For each {event} on {sourceStream}:
  - Let {executionResult} be the result of running
    {ExecuteSubscriptionEvent(subscription, schema, variableValues, event)}.
  - For each {response} yielded by {executionResult}:
    - Yield an event containing {response}.
- When {responseStream} completes: complete this event stream.

ExecuteSubscriptionEvent(subscription, schema, variableValues, initialValue):

- Let {subscriptionType} be the root Subscription type in {schema}.
- Assert: {subscriptionType} is an Object type.
- Let {selectionSet} be the top level Selection Set in {subscription}.
- Let {data} be the result of running {ExecuteSelectionSet(selectionSet,
  subscriptionType, initialValue, variableValues)} _normally_ (allowing
  parallelization).
- Let {errors} be the list of all _field error_ raised while executing the
  selection set.
- Return an unordered map containing {data} and {errors}.

Note: The {ExecuteSubscriptionEvent()} algorithm is intentionally similar to
{ExecuteQuery()} since this is how each event result is produced.

#### Unsubscribe

Unsubscribe cancels the Response Stream when a client no longer wishes to
receive payloads for a subscription. This may in turn also cancel the Source
Stream. This is also a good opportunity to clean up any other resources used by
the subscription.

Unsubscribe(responseStream):

- Cancel {responseStream}

## Publisher Record

If an operation contains `@defer` or `@stream` directives, execution may also
result in an Async Payload Record stream in addition to the initial response.
The Async Payload Records may be published lazily as requested, with the
internal state of the unpublished stream held by a Publisher Record unique to
the request.

- {pending}: the set of Async Payload Records for this response that have not
  yet been completed.
- {waiting}: the set of Async Payload Records for this response that have been
  completed, but are waiting for a parent to complete.
- {waitingByParent}: an unordered map of uncompleted parent Async Payload
  Records to sets of completed child Async Payload Records.
- {current}: the set of Async Payload Records for this response that may be
  yielded on the next request.
- {signal}: An asynchronous signal that can be awaited and triggered.

## Create Publisher

CreatePublisher():

- Let {publisherRecord} be a publisher record.
- Initialize {pending} on {publisherRecord} to an empty set.
- Initialize {waiting} on {publisherRecord} to an empty set.
- Initialize {waitingByParent} on {publisherRecord} to an empty unordered map.
- Initialize {current} on {publisherRecord} to an empty set.
- Initialize {signal}.
- Return {publisherRecord}.

## Has Next

HasNext(publisherRecord):

- Let {pending}, {waiting}, and {current} be the corresponding entries on
  {publisherRecord}.
- If {pending}, {waiting}, or {current} is not empty, return {true}.
- Return {false}.

## Add Payload

AddPayload(payload, publisherRecord):

- Let {pending} be the corresponding entry on {publisherRecord}.
- Add {payload} to {pending}.

## Complete Payload

CompletePayload(payload, publisherRecord):

- Let {pending} be the corresponding entry on {publisherRecord}.
- If {payload} is not within {pending}, return.
- Remove {payload} from {pending}.
- Let {parentRecords} be the corresponding entry on {payload}.
- If {parentRecords} is undefined:
  - Call PushPayload(payload, publisherRecord).
  - Let {signal} be the corresponding entry on {publisherRecord}.
  - Trigger {signal}.
  - Return.
- Let {waiting} be the corresponding entry on {publisherRecord}.
- For each {parentRecord} in {parentRecords}:
  - If both {pending} and {waiting} do not contain {parentRecord}:
    - Call PushPayload(payload, publisherRecord).
    - Let {signal} be the corresponding entry on {publisherRecord}.
    - Trigger {signal}.
    - Return.
- Otherwise:
  - Let {waitingByChildren} be the corresponding entries on {publisherRecord}.
  - Add {payload} to {waiting}.
  - For each {parentRecord} in {parentRecords}:
    - Let {children} be the set in {waitingByParent} for {parentRecord}; if no
      such set exists, create it as an empty set.
    - Append {payload} to {children}.

## Push Payload

PushPayload(payload, publisherRecord):

- Let {current}, and {waitingByParent} be the corresponding entries on
  {publisherRecord}.
- Add {payload} to {current}.
- Let {children} be the set in {waitingByParent} for {payload}.
- If {children} is not defined, return.
- Let {waiting} be the corresponding entry on {publisherRecord}.
- For each {child} in {children}:
  - Call {PushPayload(payload, publisherRecord)}.
  - Remove {child} from {waiting}.
- Remove the set in {waitingByParent} for {parentRecord}.

## Yield Subsequent Payloads

If an operation contains subsequent payload records resulting from `@stream` or
`@defer` directives, the {YieldSubsequentPayloads} algorithm defines how the
payloads should be processed.

YieldSubsequentPayloads(initialResponse, publisherRecord):

- Let {current} be the corresponding entry on {publisherRecord}.
- Initialize {initialIncremental} to an empty list.
- For each {record} in {current}:
  - Remove {record} from {current}.
  - If {isCompletedIterator} on {record} is {true}:
    - Continue to the next record in {records}.
  - Let {payload} be the corresponding entry on {record}.
  - Append {payload} to {initialIncremental}.
- Reset {current} to an empty set.
- If {initialIncremental} is not empty:
  - Add an entry to {initialResponse} named `incremental` containing the value
    {incremental}.
- Yield {initialResponse}.
- While {HasNext(publisherRecord)} is {true}:
  - If a termination signal is received:
    - For each {record} in {subsequentPayloads}:
      - If {record} contains {iterator}:
        - Send a termination signal to {iterator}.
    - Return.
  - Let {signal} be the corresponding entry on {publisherRecord}.
  - Wait for {signal} to be triggered.
  - Reinitialize {signal} on {publisherRecord}.
  - Let {subsequentResponse} be an unordered map with an entry {incremental}
    initialized to an empty list.
  - Let {current} be the corresponding entry on {publisherRecord}.
  - For each {record} in {current}:
    - Remove {record} from {current}.
    - If {isCompletedIterator} on {record} is {true}:
      - Continue to the next record in {current}.
    - Let {payload} be the corresponding entry on {record}.
  - Reset {current} to an empty set.
  - Append {payload} to the {incremental} entry on {subsequentResponse}.
  - Let {hasNext} be the result of {HasNext(publisherRecord)}.
  - Add an entry to {subsequentResponse} named `hasNext` with the value
    {hasNext}.
  - Yield {subsequentResponse}

## Executing Grouped Field Sets

To execute a grouped field set, the object value being evaluated and the object
type need to be known, as well as whether it must be executed serially, or may
be executed in parallel.

ExecuteGroupedFieldSet(groupedFieldSet, objectType, objectValue, variableValues,
path, deferMap, publisherRecord, priority, parentRecords):

- If {path} is not provided, initialize it to an empty list.
- Initialize {resultMap} to an empty ordered map.
- Initialize {contextByFieldGroup} to an empty ordered map.
- For each {groupedFieldSet} as {responseKey} and {fieldGroup}:
  - Let {fieldName} be the corresponding entry on {fieldGroup}. Note: This value
    is unaffected if an alias is used.
  - Let {fieldType} be the return type defined for the field {fieldName} of
    {objectType}.
  - If {fieldType} is defined:
    - Let {fieldPath} be {path} with {fieldName} appended.
    - Set the entry for {responseKey} on {fieldGroupContexts} to a record
      consisting of {fieldGroup}, {fieldType}, and {fieldPath}.
    - Call {AddPendingDeferredField(fieldGroup, fieldPath, deferMap)}.
- For each {contextByFieldGroup} as {responseKey}, {fieldGroup}, {fieldType},
  and {fieldPath}:
  - Let {priority} and {parentFieldGroup} be the corresponding entries on
    {fieldGroup}.
  - If {parentFieldGroup} is {undefined} and {priority} is greater than zero, or
    if {priority} is greater than the corresponding entry on {parentFieldGroup}.
    - Call {ExecuteDeferredField(objectType, objectValue, fieldType, fieldGroup,
      variableValues, path, deferMap, publisherRecord, parentRecords)}.
  - Otherwise:
    - Let {responseValue} be {ExecuteField(objectType, objectValue, fieldType,
      fieldGroup, variableValues, path, deferMap, publisherRecord,
      parentRecords)}.
    - Set {responseValue} as the value for {responseKey} in {resultMap}.
- Return {resultMap}.

Note: {resultMap} is ordered by which fields appear first in the operation. This
is explained in greater detail in the Field Collection section below.

**Errors and Non-Null Fields**

If during {ExecuteSelectionSet()} a field with a non-null {fieldType} raises a
_field error_ then that error must propagate to this entire selection set,
either resolving to {null} if allowed or further propagated to a parent field.

If this occurs, any sibling fields which have not yet executed or have not yet
yielded a value may be cancelled to avoid unnecessary work.

Additionally, unpublished Async Payload Records must be filtered if their path
points to a location that has resolved to {null} due to propagation of a field
error. This is described in
[Filter Subsequent Payloads](#sec-Filter-Subsequent-Payloads). The result of
these async payload records must not be sent to clients. If these async records
have not yet executed or have not yet yielded a value they may also be cancelled
to avoid unnecessary work.

Note: See [Handling Field Errors](#sec-Handling-Field-Errors) for more about
this behavior.

### Filter Subsequent Payloads

When a field error is raised, there may be unpublished async payload records
with a path that points to a location that has been removed or set to null due
to null propagation. The results of these async payload records must not be sent
to clients.

In {FilterSubsequentPayloads}, {nullPath} is the path which has resolved to null
after propagation as a result of a field error. {currentAsyncRecord} is the
async payload record where the field error was raised. {currentAsyncRecord} will
not be set for field errors that were raised during the initial execution
outside of {ExecuteDeferredField} or {ExecuteStreamField}.

FilterSubsequentPayloads(publisherRecord, nullPath, currentAsyncRecords):

- Let {pending}, {current}, {waiting}, and {waitingByParent} be the
  corresponding entries on {publisherRecord}.
- For each {asyncRecord} in {pending} and {current}:
  - If {ShouldKeepPayload(asyncRecord, nullPath, currentAsyncRecords)} is
    {true}:
  - Continue to the next record in {set}.
  - Remove {asyncRecord} from {set}. Optionally, cancel any incomplete work in
    the execution of {asyncRecord}.
- For each {asyncRecord} in {waiting}:
  - If {ShouldKeepPayload(asyncRecord, nullPath, currentAsyncRecords)} is
    {true}:
  - Continue to the next record in {waiting}.
  - Remove {asyncRecord} from {waiting}. Optionally, cancel any incomplete work
    in the execution of {asyncRecord}.
  - Let {parentRecords} be the corresponding entry on {asyncRecord}.
  - For each {parentRecord} in {parentRecords}:
    - Let {children} be the set in {waitingByParent} for {parentRecord}.
    - Remove {asyncRecord} from {children}.

ShouldKeepPayload(asyncRecord, nullPath, currentAsyncRecords):

- For each {currentAsyncRecord} in {currentAsyncRecords}:
  - If {asyncRecord} is the same record as {currentAsyncRecord}:
    - Return {true}.
- Initialize {index} to zero.
- While {index} is less then the length of {nullPath}:
  - Initialize {nullPathItem} to the element at {index} in {nullPath}.
  - Initialize {asyncRecordPathItem} to the element at {index} in the {path} of
    {asyncRecord}.
  - If {nullPathItem} is not equivalent to {asyncRecordPathItem}:
    - Return {true}.
  - Increment {index} by one. Return {false}.

For example, assume the field `alwaysThrows` is a `Non-Null` type that always
raises a field error:

```graphql example
{
  myObject {
    ... @defer {
      name
    }
    alwaysThrows
  }
}
```

In this case, only one response should be sent. The async payload record
associated with the `@defer` directive should be removed and its execution may
be cancelled.

```json example
{
  "data": { "myObject": null },
  "hasNext": false
}
```

### Normal and Serial Execution

Normally the executor can execute the entries in a grouped field set in whatever
order it chooses (normally in parallel). Because the resolution of fields other
than top-level mutation fields must always be side effect-free and idempotent,
the execution order must not affect the result, and hence the service has the
freedom to execute the field entries in whatever order it deems optimal.

For example, given the following grouped field set to be executed normally:

```graphql example
{
  birthday {
    month
  }
  address {
    street
  }
}
```

A valid GraphQL executor can resolve the four fields in whatever order it chose
(however of course `birthday` must be resolved before `month`, and `address`
before `street`).

When executing a mutation, the selections in the top most selection set will be
executed in serial order, starting with the first appearing field textually.

When executing a grouped field set serially, the executor must consider each
entry from the grouped field set in the order provided in the grouped field set.
It must determine the corresponding entry in the result map for each item to
completion before it continues on to the next item in the grouped field set:

For example, given the following selection set to be executed serially:

```graphql example
{
  changeBirthday(birthday: $newBirthday) {
    month
  }
  changeAddress(address: $newAddress) {
    street
  }
}
```

The executor must, in serial:

- Run {ExecuteField()} for `changeBirthday`, which during {CompleteValue()} will
  execute the `{ month }` sub-selection set normally.
- Run {ExecuteField()} for `changeAddress`, which during {CompleteValue()} will
  execute the `{ street }` sub-selection set normally.

As an illustrative example, let's assume we have a mutation field
`changeTheNumber` that returns an object containing one field, `theNumber`. If
we execute the following selection set serially:

```graphql example
{
  first: changeTheNumber(newNumber: 1) {
    theNumber
  }
  second: changeTheNumber(newNumber: 3) {
    theNumber
  }
  third: changeTheNumber(newNumber: 2) {
    theNumber
  }
}
```

The executor will execute the following serially:

- Resolve the `changeTheNumber(newNumber: 1)` field
- Execute the `{ theNumber }` sub-selection set of `first` normally
- Resolve the `changeTheNumber(newNumber: 3)` field
- Execute the `{ theNumber }` sub-selection set of `second` normally
- Resolve the `changeTheNumber(newNumber: 2)` field
- Execute the `{ theNumber }` sub-selection set of `third` normally

A correct executor must generate the following result for that selection set:

```json example
{
  "first": {
    "theNumber": 1
  },
  "second": {
    "theNumber": 3
  },
  "third": {
    "theNumber": 2
  }
}
```

When subsections contain a `@stream` or `@defer` directive, these subsections
are no longer required to execute serially. Execution of the deferred or
streamed sections of the subsection may be executed in parallel, as defined in
{ExecuteStreamField} and {ExecuteDeferredField}.

### Field Collection

Before execution, the selection set is converted to a grouped field set by
calling {CollectFields()}. Each entry in the grouped field set is a list of
fields that share a response key (the alias if defined, otherwise the field
name). This ensures all fields with the same response key (including those in
referenced fragments) are executed at the same time. {CollectFields} also
returns a list of references to any encountered deferred fragments within the
selection set. A deferred selection set's fields will be included in the grouped
field set, but execution may be delayed in the absence of overlapping
non-deferred fields. The executor executes each field exactly once, guaranteeing
consistent results.

Information derived from the presence of a `@defer` directive on a fragment is
returned as a Defer Usage record, unique to the label, a structure containing:

- {label}: value of the corresponding argument to the `@defer` directive.
- {priority}: a positive integer derived the `@defer` directive's location
  within the operation, with lower numbers representing higher priorities.
  Nested defers at different levels within the operation cause further increase
  in the priority value, with nested `@defer` directive at the same level not
  causing any change in priority.

Information derived from the presence of a `@stream` directive on a field is
returned as a Stream Usage record, a structure containing:

- {label}: value of the corresponding argument to the `@stream` directive.
- {initialCount}: value of the corresponding argument to the `@stream`
  directive.

Information about all fields sharing a response key are stored within Field
Group records, structures containing:

- {parentType}: the type of the parent object for this field.
- {fieldName}: the name of this field.
- {fields}: a map of lists of collected field nodes, indexed by the Defer Usage
  record corresponding to the originating enclosing deferred fragment, or by
  {undefined} if the field is not contained by a deferred fragment.
- {streamUsage}: information derived from any `@stream` directive on this field.
- {priority}: the overall priority for this field group, equivalent to the
  lowest priority of any indexing Defer Usage records within the {fields}, or 0,
  if any field nodes without Defer Usage records are present.
- {parentFieldGroup}: the parent Field Group record, or undefined, if this is
  the root field group.

As an example, collecting the fields of this selection set would collect two
instances of the field `a` and one of field `b`:

```graphql example
{
  a {
    subfield1
  }
  ...ExampleFragment
}

fragment ExampleFragment on Query {
  a {
    subfield2
  }
  b
}run
```

The depth-first-search order of the field groups produced by {CollectFields()}
is maintained through execution, ensuring that fields appear in the executed
response in a stable and predictable order.

CollectFields(objectType, selectionSet, variableValues, visitedFragments,
priority, parentFieldGroup, deferUsage):

- Initialize {groupedFieldSet} to an empty ordered map of Field Group records.
- Initialize {deferUsages} to an empty map of Defer Usage records.
- For each {selection} in {selectionSet}:
  - If {selection} provides the directive `@skip`, let {skipDirective} be that
    directive.
    - If {skipDirective}'s {if} argument is {true} or is a variable in
      {variableValues} with the value {true}, continue with the next {selection}
      in {selectionSet}.
  - If {selection} provides the directive `@include`, let {includeDirective} be
    that directive.
    - If {includeDirective}'s {if} argument is not {true} and is not a variable
      in {variableValues} with the value {true}, continue with the next
      {selection} in {selectionSet}.
  - If {selection} is a {Field}:
    - Let {responseKey} be the response key of {selection} (the alias if
      defined, otherwise the field name).
    - Let {groupForResponseKey} be the entry in in {groupedFieldSet} for
      {responseKey}.
    - If {groupForResponseKey} is {undefined}:
      - Let {fieldName} be the name of {selection}.
      - Initialize {fields} to an empty map of lists of collected field nodes,
        indexed by originating Defer Usage record, or by {undefined}.
      - Let {listForDeferUsage} be a list containing {selection}.
      - Set the entry for {deferUsage} in {fields} to {listForDeferUsage}.
      - If {selection} provides the directive `@stream` and its {if} argument is
        not {false} and is not a variable in {variableValues} with the value
        {false}, let {streamDirective} be that directive.
      - Let {groupForResponseKey} be a new Field Group record created from
        {runtimeType}, {fieldName}, {fields}, {streamDirective}, {priority}, and
        {parentFieldGroup}.
    - Otherwise:
      - Let {fields} be the corresponding entry on {groupForResponseKey}.
      - Let {listForDeferUsage} be the list in {fields} for {deferUsage}; if no
        such list exists, create it as an empty list.
      - Append {selection} to {listForDeferUsage}.
      - Let {fieldGroupPriority} be the value of the {priority} entry on
        {fieldGroup}.
      - If {priority} is less than {fieldGroupPriority}, update the {priority}
        entry on {fieldGroup} to {priority}.
  - If {selection} is a {FragmentSpread}:
    - Let {fragmentSpreadName} be the name of {selection}.
    - If {fragmentSpreadName} provides the directive `@defer` and its {if}
      argument is not {false} and is not a variable in {variableValues} with the
      value {false}:
      - Let {deferDirective} be that directive.
      - If this execution is for a subscription operation, raise a _field
        error_.
    - If {deferDirective} is not defined:
      - If {fragmentSpreadName} is in {visitedFragments}, continue with the next
        {selection} in {selectionSet}.
      - Add {fragmentSpreadName} to {visitedFragments}.
    - Let {fragment} be the Fragment in the current Document whose name is
      {fragmentSpreadName}.
    - If no such {fragment} exists, continue with the next {selection} in
      {selectionSet}.
    - Let {fragmentType} be the type condition on {fragment}.
    - If {DoesFragmentTypeApply(objectType, fragmentType)} is false, continue
      with the next {selection} in {selectionSet}.
    - Let {fragmentSelectionSet} be the top-level selection set of {fragment}.
    - Let {maybeNewDefer} be equal to {deferDirective}.
    - Let {maybeIncreasedPriority} be equal to {priority}.
    - If {deferDirective} is defined:
      - If {parentFieldGroup} is {undefined}, set {maybeIncreasedPriority} to 1.
      - Otherwise:
        - Let {parentFieldGroupPriority} be the value of the {priority} entry on
          {parentFieldGroup}.
        - If {maybeIncreasedPriority} is equal to {parentFieldGroupPriority},
          set {maybeIncreasedPriority} to {maybeIncreasedPriority} + 1.
      - Let {label} be the value or the variable to {deferDirective}'s {label}
        argument.
      - Let {existingDefer} be the record in {deferUsages} for {label}.
      - If {existingDefer} is undefined:
        - Set {maybeNewDefer} equal to a new Defer Usage record created from
          {label} and {maybeIncreasedPriority}.
        - Set the record in {deferUsages} for {label} to {maybeNewDefer}.
      - Otherwise, set {maybeNewDefer} to {existingDefer}.
    - Let {fragmentGroupedFieldSet} and {fragmentDeferUsages} be the result of
      calling {CollectFields(objectType, fragmentSelectionSet, variableValues,
      visitedFragments, maybeIncreasedPriority, parentFieldGroup,
      maybeNewDefer)}.
    - For each {label} and {fragmentDeferUsage} in {fragmentDeferUsages}:
      - Let {existingDeferUsage} be the record in {deferUsages} for {label}.
      - If {existingDeferUsage} is {undefined}:
        - Set the record in {deferUsages} for {label} to {fragmentDeferUsage}.
    - For each {responseKey} and {fragmentGroup} in {fragmentGroupedFieldSet}:
      - Let {groupForResponseKey} be the record in {groupedFieldSet} for
        {responseKey}.
      - If {groupForResponseKey} is {undefined}, set the record in
        {groupedFieldSet} for {responseKey} to {fragmentGroup}.
      - Otherwise:
        - Let {fieldGroupPriority} be equal to the {priority} entry on
          {groupForResponseKey}.
        - Let {fragmentGroupPriority} be equal to the {priority} entry on
          {fragmentGroup}.
        - If {fragmentGroupPriority} is less than {fieldGroupPriority}, update
          the {priority} entry on {fieldGroup} to {fragmentGroupPriority}.
        - Let {fields} be the corresponding entry on {groupForResponseKey}.
        - Let {fragmentFields} be equal to the {fields} entry on
          {fragmentGroup}.
        - For each {fragmentDeferUsage} and {fragmentListForDeferUsage} in
          {fragmentFields}:
          - Let {label} be the corresponding entry in {fragmentDeferUsage}.
          - Let {uniqueDeferUsage} be the record in {deferUsages} for {label}.
          - If {uniqueDeferUsage} is {undefined}, let {uniqueDeferUsage} be
            equal to {fragmentDeferUsage}.
          - Let {listForDeferUsage} be the record in {fields} for
            {uniqueDeferUsage}.
          - If {listForDeferUsage} is {undefined}, set the record in {fields}
            for {uniqueDeferUsage} to {fragmentListForDeferUsage}.
          - Otherwise, append all items in {fragmentListForDeferUsage} to
            {listForDeferUsage}.
  - If {selection} is an {InlineFragment}:
    - Let {fragmentType} be the type condition on {selection}.
    - If {fragmentType} is not {null} and {DoesFragmentTypeApply(objectType,
      fragmentType)} is false, continue with the next {selection} in
      {selectionSet}.
    - Let {fragmentSelectionSet} be the top-level selection set of {selection}.
    - If {InlineFragment} provides the directive `@defer` and its {if} argument
      is not {false} and is not a variable in {variableValues} with the value
      {false}:
      - Let {deferDirective} be that directive.
      - If this execution is for a subscription operation, raise a _field
        error_.
    - Let {fragmentSelectionSet} be the top-level selection set of {fragment}.
    - Let {maybeNewDefer} be equal to {deferDirective}.
    - Let {maybeIncreasedPriority} be equal to {priority}.
    - If {deferDirective} is defined:
      - If {parentFieldGroup} is {undefined}, set {maybeIncreasedPriority} to 1.
      - Otherwise:
        - Let {parentFieldGroupPriority} be the value of the {priority} entry on
          {parentFieldGroup}.
        - If {maybeIncreasedPriority} is equal to {parentFieldGroupPriority},
          set {maybeIncreasedPriority} to {maybeIncreasedPriority} + 1.
      - Let {label} be the value or the variable to {deferDirective}'s {label}
        argument.
      - Let {existingDefer} be the record in {deferUsages} for {label}.
      - If {existingDefer} is undefined:
        - Set {maybeNewDefer} equal to a new Defer Usage record created from
          {label} and {maybeIncreasedPriority}.
        - Set the record in {deferUsages} for {label} to {maybeNewDefer}.
      - Otherwise, set {maybeNewDefer} to {existingDefer}.
    - Let {fragmentGroupedFieldSet} and {fragmentDeferUsages} be the result of
      calling {CollectFields(objectType, fragmentSelectionSet, variableValues,
      visitedFragments, maybeIncreasedPriority, parentFieldGroup,
      maybeNewDefer)}.
    - For each {label} and {fragmentDeferUsage} in {fragmentDeferUsages}:
      - Let {existingDeferUsage} be the record in {deferUsages} for {label}.
      - If {existingDeferUsage} is {undefined}:
        - Set the record in {deferUsages} for {label} to {fragmentDeferUsage}.
    - For each {responseKey} and {fragmentGroup} in {fragmentGroupedFieldSet}:
      - Let {groupForResponseKey} be the record in {groupedFieldSet} for
        {responseKey}.
      - If {groupForResponseKey} is {undefined}, set the record in
        {groupedFieldSet} for {responseKey} to {fragmentGroup}.
      - Otherwise:
        - Let {fieldGroupPriority} be equal to the {priority} entry on
          {groupForResponseKey}.
        - Let {fragmentGroupPriority} be equal to the {priority} entry on
          {fragmentGroup}.
        - If {fragmentGroupPriority} is less than {fieldGroupPriority}, update
          the {priority} entry on {fieldGroup} to {fragmentGroupPriority}.
        - Let {fields} be the corresponding entry on {groupForResponseKey}.
        - Let {fragmentFields} be equal to the {fields} entry on
          {fragmentGroup}.
        - For each {fragmentDeferUsage} and {fragmentListForDeferUsage} in
          {fragmentFields}:
          - Let {label} be the corresponding entry in {fragmentDeferUsage}.
          - Let {uniqueDeferUsage} be the record in {deferUsages} for {label}.
          - If {uniqueDeferUsage} is {undefined}, let {uniqueDeferUsage} be
            equal to {fragmentDeferUsage}.
          - Let {listForDeferUsage} be the record in {fields} for
            {uniqueDeferUsage}.
          - If {listForDeferUsage} is {undefined}, set the record in {fields}
            for {uniqueDeferUsage} to {fragmentListForDeferUsage}.
          - Otherwise, append all items in {fragmentListForDeferUsage} to
            {listForDeferUsage}.
- Return {groupedFieldSet} and {deferUsages}.

Note: The steps in {CollectFields()} evaluating the `@skip` and `@include`
directives may be applied in either order since they apply commutatively.

DoesFragmentTypeApply(objectType, fragmentType):

- If {fragmentType} is an Object Type:
  - if {objectType} and {fragmentType} are the same type, return {true},
    otherwise return {false}.
- If {fragmentType} is an Interface Type:
  - if {objectType} is an implementation of {fragmentType}, return {true}
    otherwise return {false}.
- If {fragmentType} is a Union:
  - if {objectType} is a possible type of {fragmentType}, return {true}
    otherwise return {false}.

### Root Field Collection

Root field collection processes the operation's top-level selection set:

CollectRootFields(rootType, operationSelectionSet, variableValues):

- Initialize {visitedFragments} to the empty set.
- Let {groupedFieldSet} and {deferUsages} be the result of calling
  {CollectFields(rootType, operationSelectionSet, variableValues,
  visitedFragments)}.
- Return {groupedFieldSet} and {deferUsages}.

### Object Subfield Collection

Object subfield collection processes a field's sub-selection sets:

CollectSubfields(objectType, fieldGroup, variableValues):

- Initialize {visitedFragments} to the empty set.
- Initialize {groupedSubfieldSet} to an empty ordered map of Field Group
  records.
- Initialize {deferUsages} to an empty map of strings to Defer Usage records.
- Let {fields}, {priority}, and {parentFieldGroup} be the corresponding entries
  on {fieldGroup}.
- For each {deferUsage} and {listOfFieldNodes} within {fields}:
  - For each {fieldNode} of {listOfFieldNodes}:
    - Let {fieldSelectionSet} be the selection set of {fieldNode}.
    - If {fieldSelectionSet} is null or empty, continue to the next field.
    - Let {subfieldGroupedFieldSet} and {subfieldDeferUsages} be the result of
      calling {CollectFields(objectType, fieldSelectionSet, variableValues,
      visitedFragments, priority, parentFieldGroup, deferUsage)}.
    - For each {label} and {subfieldDeferUsage} in {subfieldDeferUsages}:
      - Let {existingDeferUsage} be the record in {deferUsages} for {label}.
      - If {existingDeferUsage} is {undefined}:
        - Set the record in {deferUsages} for {label} to {fieldDeferUsage}.
    - For each {responseKey} and {subfieldGroup} in {subfieldGroupedFieldSet}:
      - Let {groupForResponseKey} be the record in {groupedSubfieldSet} for
        {responseKey}.
      - If {groupForResponseKey} is {undefined}, set the record in
        {groupedSubfieldSet} for {responseKey} to {subfieldGroup}.
      - Otherwise:
        - Let {fieldGroupPriority} be equal to the {priority} entry on
          {groupForResponseKey}.
        - Let {subfieldGroupPriority} be equal to the {priority} entry on
          {subfieldGroup}.
        - If {subfieldGroupPriority} is less than {fieldGroupPriority}, update
          the {priority} entry on {groupForResponseKey} to
          {subfieldGroupPriority}.
        - Let {fields} be the corresponding entry on {groupForResponseKey}.
        - Let {subfieldFields} be equal to the {fields} entry on
          {subfieldGroup}.
        - For each {subfieldDeferUsage} and {subfieldListForDeferUsage} in
          {subfieldFields}:
          - Let {label} be the corresponding entry in {subfieldDeferUsage}.
          - Let {uniqueDeferUsage} be the record in {deferUsages} for {label}.
          - If {uniqueDeferUsage} is {undefined}, let {uniqueDeferUsage} be
            equal to {subfieldDeferUsage}.
          - Let {listForDeferUsage} be the record in {fields} for
            {uniqueDeferUsage}.
          - If {listForDeferUsage} is {undefined}, set the record in {fields}
            for {uniqueDeferUsage} to {subfieldListForDeferUsage}.
          - Otherwise, append all items in {subfieldListForDeferUsage} to
            {listForDeferUsage}.
- Return {groupedSubfieldSet} and {deferUsages}.

#### Async Payload Record

An Async Payload Record is either a Deferred Fragment Record or a Stream Record.
All Async Payload Records are structures containing:

- {parentRecords}: The generating parent Async Payload Records, not defined if
  this Async Payload Record is spawned by the initial result.
- {label}: value derived from the corresponding `@defer` or `@stream` directive.
- {path}: a list of field names and indices from root to the location of the
  corresponding `@defer` or `@stream` directive. from an iterator that has
  completed.
- {errors}: a list of field errors encountered during execution.
- {payload}: An unordered map containing the formatted payload.

Deferred Fragment Records also contain the following:

- {pending}: a set of pending paths.
- {results}: a list of completed paths and results.

Stream Records also contain the following:

- {iterator}: The underlying iterator.
- {isCompletedIterator}: a boolean indicating the payload record was generated
  from an iterator that has completed.

## Executing Fields

Each field requested in the grouped field set that is defined on the selected
objectType will result in an entry in the response map. Field execution first
coerces any provided argument values, then resolves a value for the field, and
finally completes that value either by recursively executing another selection
set or coercing a scalar value.

ExecuteField(objectType, objectValue, fieldType, fieldGroup, variableValues,
path, deferMap, publisherRecord, parentRecords):

- Let {fieldName} and {fields} be the corresponding entries on {fieldGroup}.
- Let {field} be the first entry of the first list in {fields}.
- Let {argumentValues} be the result of {CoerceArgumentValues(objectType, field,
  variableValues)}
- Let {resolvedValue} be {ResolveFieldValue(objectType, objectValue, fieldName,
  argumentValues)}.
- Let {result} be the result of calling {CompleteValue(fieldType, fields,
  resolvedValue, variableValues, path, deferMap, publisherRecord,
  parentRecords)}.
- Return {result}.

## Executing Deferred Fields

Deferred field are delivered after non-deferred fields. Execution is deferred in
an implementation-defined manner.

ExecuteDeferredField(objectType, objectValue, fieldType, fieldGroup,
variableValues, path, deferMap, publisherRecord, parentRecords):

- Defer further execution in an implementation-defined manner.
- Call {ExecuteField(objectType, objectValue, fieldType, fieldGroup,
  variableValues, path, deferMap, publisherRecord, parentRecords)}.

### Coercing Field Arguments

Fields may include arguments which are provided to the underlying runtime in
order to correctly produce a value. These arguments are defined by the field in
the type system to have a specific input type.

At each argument position in an operation may be a literal {Value}, or a
{Variable} to be provided at runtime.

CoerceArgumentValues(objectType, field, variableValues):

- Let {coercedValues} be an empty unordered Map.
- Let {argumentValues} be the argument values provided in {field}.
- Let {fieldName} be the name of {field}.
- Let {argumentDefinitions} be the arguments defined by {objectType} for the
  field named {fieldName}.
- For each {argumentDefinition} in {argumentDefinitions}:
  - Let {argumentName} be the name of {argumentDefinition}.
  - Let {argumentType} be the expected type of {argumentDefinition}.
  - Let {defaultValue} be the default value for {argumentDefinition}.
  - Let {hasValue} be {true} if {argumentValues} provides a value for the name
    {argumentName}.
  - Let {argumentValue} be the value provided in {argumentValues} for the name
    {argumentName}.
  - If {argumentValue} is a {Variable}:
    - Let {variableName} be the name of {argumentValue}.
    - Let {hasValue} be {true} if {variableValues} provides a value for the name
      {variableName}.
    - Let {value} be the value provided in {variableValues} for the name
      {variableName}.
  - Otherwise, let {value} be {argumentValue}.
  - If {hasValue} is not {true} and {defaultValue} exists (including {null}):
    - Add an entry to {coercedValues} named {argumentName} with the value
      {defaultValue}.
  - Otherwise if {argumentType} is a Non-Nullable type, and either {hasValue} is
    not {true} or {value} is {null}, raise a _field error_.
  - Otherwise if {hasValue} is true:
    - If {value} is {null}:
      - Add an entry to {coercedValues} named {argumentName} with the value
        {null}.
    - Otherwise, if {argumentValue} is a {Variable}:
      - Add an entry to {coercedValues} named {argumentName} with the value
        {value}.
    - Otherwise:
      - If {value} cannot be coerced according to the input coercion rules of
        {argumentType}, raise a _field error_.
      - Let {coercedValue} be the result of coercing {value} according to the
        input coercion rules of {argumentType}.
      - Add an entry to {coercedValues} named {argumentName} with the value
        {coercedValue}.
- Return {coercedValues}.

Note: Variable values are not coerced because they are expected to be coerced
before executing the operation in {CoerceVariableValues()}, and valid operations
must only allow usage of variables of appropriate types.

### Value Resolution

While nearly all of GraphQL execution can be described generically, ultimately
the internal system exposing the GraphQL interface must provide values. This is
exposed via {ResolveFieldValue}, which produces a value for a given field on a
type for a real value.

As an example, this might accept the {objectType} `Person`, the {field}
{"soulMate"}, and the {objectValue} representing John Lennon. It would be
expected to yield the value representing Yoko Ono.

List values are resolved similarly. For example, {ResolveFieldValue} might also
accept the {objectType} `MusicBand`, the {field} {"members"}, and the
{objectValue} representing the Beatles. It would be expected to yield a
collection of values representing John Lennon, Paul McCartney, Ringo Starr and
George Harrison.

ResolveFieldValue(objectType, objectValue, fieldName, argumentValues):

- Let {resolver} be the internal function provided by {objectType} for
  determining the resolved value of a field named {fieldName}.
- Return the result of calling {resolver}, providing {objectValue} and
  {argumentValues}.

Note: It is common for {resolver} to be asynchronous due to relying on reading
an underlying database or networked service to produce a value. This
necessitates the rest of a GraphQL executor to handle an asynchronous execution
flow. In addition, an implementation for collections may leverage asynchronous
iterators or asynchronous generators provided by many programming languages.
This may be particularly helpful when used in conjunction with the `@stream`
directive.

### Value Completion

After resolving the value for a field, it is completed by ensuring it adheres to
the expected return type. If the return type is another Object type, then the
field execution process continues recursively. If the return type is a List
type, each member of the resolved collection is completed using the same value
completion process. In the case where `@stream` is specified on a field of list
type, value completion iterates over the collection until the number of items
yielded items satisfies `initialCount` specified on the `@stream` directive.

#### Add Pending Deferred Field

AddPendingDeferredField(fieldGroup, path, deferMap):

- Let {fields} be the corresponding entry on {fieldGroup}.
- For each {deferUsage} in {fields}:
  - If {deferUsage} is defined:
    - Let {deferRecord} be the record in {deferMap} for {deferUsage}.
    - Let {pending} be the corresponding entry on {deferRecord}.
    - Add {path} to {pending}.

#### Report Deferred Value

ReportDeferredValue(value, fieldGroup, path, deferMap, publisherRecords,
parentRecords):

- If {value} is {null}:
  - Call {FilterSubsequentPayloads(publisherRecords, path, parentRecords)}.
- Let {fields} be the corresponding entry on {fieldGroup}.
- For each {deferUsage} in {fields}:
  - If {deferUsage} is defined:
    - Let {deferRecord} be the record in {deferMap} for {deferUsage}.
    - Let {payload}, {pending} and {results} be the corresponding entries on
      {deferRecord}.
    - Remove {path} from {pending}.
    - Append a record containing {path} and {value} to {results}.
    - If {pending} is empty, build {payload} from {results}.
    - Call {CompletePayload(deferRecord, publisherRecord)}.

#### Execute Stream Field

ExecuteStreamField(label, iterator, index, fieldGroup, innerType, path,
variableValues, publisherRecord, parentRecords):

- Let {streamRecord} be an async payload record created from {parentRecords},
  {label}, {path}, and {iterator}.
- Call {AddPayload(streamRecord, publisherRecord)}.
- Initialize {errors} on {streamRecord} to an empty list.
- Let {itemPath} be {path} with {index} appended.
- Wait for the next item from {iterator}.
- If an item is not retrieved because {iterator} has completed:
  - Set {isCompletedIterator} to {true} on {streamRecord}.
  - Return {null}.
- Let {payload} be an unordered map.
- If an item is not retrieved because of an error:
  - Append the encountered error to {errors}.
  - Add an entry to {payload} named `items` with the value {null}.
- Otherwise:
  - Let {item} be the item retrieved from {iterator}.
  - Let {data} be the result of calling {CompleteValue(innerType, fieldGroup,
    item, variableValues, itemPath, deferMap, publisherRecord, parentRecords)}.
  - Append any encountered field errors to {errors}.
  - Increment {index}.
  - Let {newParentRecords} be a list containing {streamRecord}.
  - Call {ExecuteStreamField(label, iterator, index, fields, innerType, path,
    variableValues, deferMap, publisherRecord, newParentRecords)}.
  - If a field error was raised, causing a {null} to be propagated to {data},
    and {innerType} is a Non-Nullable type:
    - Add an entry to {payload} named `items` with the value {null}.
  - Otherwise:
    - Add an entry to {payload} named `items` with a list containing the value
      {data}.
- If {errors} is not empty:
  - Add an entry to {payload} named `errors` with the value {errors}.
- If {label} is defined:
  - Add an entry to {payload} named `label` with the value {label}.
- Add an entry to {payload} named `path` with the value {itemPath}.
- Set {payload} on {streamRecord}.
- Call {CompletePayload(streamRecord, publisherRecord)}.

CompleteValue(fieldType, fieldGroup, result, variableValues, path, deferMap,
publisherRecord, parentRecords):

- If the {fieldType} is a Non-Null type:
  - Let {innerType} be the inner type of {fieldType}.
  - Let {completedResult} be the result of calling {CompleteValue(innerType,
    fieldGroup, result, variableValues, path)}.
  - If {completedResult} is {null}, raise a _field error_.
  - Return {completedResult}.
- If {result} is {null} (or another internal value similar to {null} such as
  {undefined}):
  - Call {ReportDeferredValue(null, fieldGroup, path, deferMap, publisherRecord,
    parentRecords)}.
  - Return {null}.
- If {fieldType} is a List type:
  - If {result} is not a collection of values, raise a _field error_.
  - Let {field} be the first entry in {fields}.
  - Let {innerType} be the inner type of {fieldType}.
  - Let {streamUsage} be the corresponding entry on {fieldGroup}.
  - If {streamUsage} is defined and {innerType} is the outermost return type of
    the list type defined for {field}:
    - Let {initialCount} be the value or variable provided to
      {streamDirective}'s {initialCount} argument.
    - If {initialCount} is less than zero, raise a _field error_.
    - Let {label} be the value or variable provided to {streamDirective}'s
      {label} argument.
  - Let {iterator} be an iterator for {result}.
  - Let {items} be an empty list.
  - Let {index} be zero.
  - While {result} is not closed:
    - If {streamDirective} is defined and {index} is greater than or equal to
      {initialCount}:
      - Let {parentType}, {fieldName}, and {fields} be the corresponding entries
        on {fieldGroup}.
      - Let {streamedFields} be a new empty map of Defer Usage records or
        {undefined} to Async Payload records.
      - For each {deferUsage} and {listForDeferUsage} of {fields}:
        - Let {list} be the entry for {undefined} on {streamedFields}.
        - If {list} is not defined:
          - Set the list for {undefined} in {streamedFields} to
            {listForDeferUsage}.
        - Otherwise,
          - Append all items in {listForDeferUsage} to {list}.
      - Let {priority} be zero.
      - Let {streamedFieldGroup} be a new Field Group record created from
        {parentType}, {fieldName}, {streamedFields}, and {priority}.
      - Call {ExecuteStreamField(label, iterator, index, streamedFieldGroup,
        innerType, path, publisherRecord, parentRecords)}.
      - Return {items}.
    - Otherwise:
      - Wait for the next item from {result} via the {iterator}.
      - If an item is not retrieved because of an error, raise a _field error_.
      - Let {resultItem} be the item retrieved from {result}.
      - Let {itemPath} be {path} with {index} appended.
      - Call {AddPendingDeferredField(fieldGroup, itemPath, deferMap)}.
      - Let {resolvedItem} be the result of calling {CompleteValue(innerType,
        fields, resultItem, variableValues, itemPath, deferMap, publisherRecord,
        parentRecords)}.
      - Append {resolvedItem} to {items}.
      - Increment {index}.
  - Let {emptyList} be an empty list.
  - Call {ReportDeferredValue(emptyList, fieldGroup, path, deferMap,
    parentRecords)}.
  - Return {items}.
- If {fieldType} is a Scalar or Enum type:
  - Call {ReportDeferredValue(result, fieldGroup, path, deferMap,
    publisherRecord, parentRecords)}.
  - Return the result of {CoerceResult(fieldType, result)}.
- If {fieldType} is an Object, Interface, or Union type:
  - If {fieldType} is an Object type.
    - Let {objectType} be {fieldType}.
  - Otherwise if {fieldType} is an Interface or Union type.
    - Let {objectType} be {ResolveAbstractType(fieldType, result)}.
  - Initialize {newParentRecords} to an empty list of Async Payload records.
  - Let {fields} be the corresponding entry on {fieldGroup}.
  - For each {deferUsage} in {fields}:
    - If {deferUsage} is defined, append {deferUsage} to {newParentRecords}.
    - Otherwise:
      - Set {newParentRecords} to {undefined}.
      - Stop iterating through {fields}.
  - Initialize {newDeferMap} to an map of Defer Usage records to Async Payload
    records, with all of the entries in {deferMap}.
  - For each {deferUsage} in {deferUsages}:
    - Let {deferRecord} be a new Async Payload record created from {deferUsage},
      {path}, and {newParentRecords}.
    - Set the record in {newDeferMap} for {deferUsage} equal to {deferRecord}.
  - Let {groupedSubfieldSet} and {deferUsages} be the result of calling
    {CollectSubfields(objectType, fields, variableValues)}.
  - Let {completed} be the result of evaluating
    {ExecuteGroupedFieldSet(groupedSubfieldSet, objectType, result,
    variableValues, path, newDeferMap, publisherRecord, newParentRecords)}
    _normally_ (allowing for parallelization).
  - Let {emptyMap} be an empty ordered map.
  - Call {ReportDeferredValue(emptyMap, fieldGroup, path, deferMap,
    publisherRecord, parentRecords)}.
  - Return {completed}.

**Coercing Results**

The primary purpose of value completion is to ensure that the values returned by
field resolvers are valid according to the GraphQL type system and a service's
schema. This "dynamic type checking" allows GraphQL to provide consistent
guarantees about returned types atop any service's internal runtime.

See the Scalars
[Result Coercion and Serialization](#sec-Scalars.Result-Coercion-and-Serialization)
sub-section for more detailed information about how GraphQL's built-in scalars
coerce result values.

CoerceResult(leafType, value):

- Assert {value} is not {null}.
- Return the result of calling the internal method provided by the type system
  for determining the "result coercion" of {leafType} given the value {value}.
  This internal method must return a valid value for the type and not {null}.
  Otherwise raise a _field error_.

Note: If a field resolver returns {null} then it is handled within
{CompleteValue()} before {CoerceResult()} is called. Therefore both the input
and output of {CoerceResult()} must not be {null}.

**Resolving Abstract Types**

When completing a field with an abstract return type, that is an Interface or
Union return type, first the abstract type must be resolved to a relevant Object
type. This determination is made by the internal system using whatever means
appropriate.

Note: A common method of determining the Object type for an {objectValue} in
object-oriented environments, such as Java or C#, is to use the class name of
the {objectValue}.

ResolveAbstractType(abstractType, objectValue):

- Return the result of calling the internal method provided by the type system
  for determining the Object type of {abstractType} given the value
  {objectValue}.

**Merging Selection Sets**

When more than one field of the same name is executed in parallel, their
selection sets are merged together when completing the value in order to
continue execution of the sub-selection sets.

An example operation illustrating parallel fields with the same name with
sub-selections.

```graphql example
{
  me {
    firstName
  }
  me {
    lastName
  }
}
```

After resolving the value for `me`, the selection sets are merged together by
calling {CollectSubfields()} so `firstName` and `lastName` can be resolved for
one value.

### Handling Field Errors

A _field error_ is an error raised from a particular field during value
resolution or coercion. While these errors should be reported in the response,
they are "handled" by producing a partial response.

Note: This is distinct from a _request error_ which results in a response with
no data.

If a field error is raised while resolving a field, it is handled as though the
field returned {null}, and the error must be added to the {"errors"} list in the
response.

If the result of resolving a field is {null} (either because the function to
resolve the field returned {null} or because a field error was raised), and that
field is of a `Non-Null` type, then a field error is raised. The error must be
added to the {"errors"} list in the response.

If the field returns {null} because of a field error which has already been
added to the {"errors"} list in the response, the {"errors"} list must not be
further affected. That is, only one error should be added to the errors list per
field.

Since `Non-Null` type fields cannot be {null}, field errors are propagated to be
handled by the parent field. If the parent field may be {null} then it resolves
to {null}, otherwise if it is a `Non-Null` type, the field error is further
propagated to its parent field.

If a `List` type wraps a `Non-Null` type, and one of the elements of that list
resolves to {null}, then the entire list must resolve to {null}. If the `List`
type is also wrapped in a `Non-Null`, the field error continues to propagate
upwards.

When a field error is raised inside `ExecuteDeferredField` or
`ExecuteStreamField`, the defer and stream payloads act as error boundaries.
That is, the null resulting from a `Non-Null` type cannot propagate outside of
the boundary of the defer or stream payload.

If a field error is raised while executing the selection set of a fragment with
the `defer` directive, causing a {null} to propagate to the object containing
this fragment, the {null} should not propagate any further. In this case, the
associated Defer Payload's `data` field must be set to {null}.

For example, assume the `month` field is a `Non-Null` type that raises a field
error:

```graphql example
{
  birthday {
    ... @defer(label: "monthDefer") {
      month
    }
    ... @defer(label: "yearDefer") {
      year
    }
  }
}
```

Response 1, the initial response is sent:

```json example
{
  "data": { "birthday": {} },
  "hasNext": true
}
```

Response 2, the defer payload for label "monthDefer" is sent. The {data} entry
has been set to {null}, as this {null} as propagated as high as the error
boundary will allow.

```json example
{
  "incremental": [
    {
      "path": ["birthday"],
      "label": "monthDefer",
      "data": null
    }
  ],
  "hasNext": false
}
```

Response 3, the defer payload for label "yearDefer" is sent. The data in this
payload is unaffected by the previous null error.

```json example
{
  "incremental": [
    {
      "path": ["birthday"],
      "label": "yearDefer",
      "data": { "year": "2022" }
    }
  ],
  "hasNext": false
}
```

If the `stream` directive is present on a list field with a Non-Nullable inner
type, and a field error has caused a {null} to propagate to the list item, the
{null} should not propagate any further, and the associated Stream Payload's
`item` field must be set to {null}.

For example, assume the `films` field is a `List` type with an `Non-Null` inner
type. In this case, the second list item raises a field error:

```graphql example
{
  films @stream(initialCount: 1)
}
```

Response 1, the initial response is sent:

```json example
{
  "data": { "films": ["A New Hope"] },
  "hasNext": true
}
```

Response 2, the first stream payload is sent. The {items} entry has been set to
{null}, as this {null} as propagated as high as the error boundary will allow.

```json example
{
  "incremental": [
    {
      "path": ["films", 1],
      "items": null
    }
  ],
  "hasNext": false
}
```

In this alternative example, assume the `films` field is a `List` type without a
`Non-Null` inner type. In this case, the second list item also raises a field
error:

```graphql example
{
  films @stream(initialCount: 1)
}
```

Response 1, the initial response is sent:

```json example
{
  "data": { "films": ["A New Hope"] },
  "hasNext": true
}
```

Response 2, the first stream payload is sent. The {items} entry has been set to
a list containing {null}, as this {null} has only propagated as high as the list
item.

```json example
{
  "incremental": [
    {
      "path": ["films", 1],
      "items": [null]
    }
  ],
  "hasNext": false
}
```

If all fields from the root of the request to the source of the field error
return `Non-Null` types, then the {"data"} entry in the response should be
{null}.
