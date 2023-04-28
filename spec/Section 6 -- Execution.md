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

### Delivery group

::: A _delivery group_ represents either the root selection set or a particular
`@stream` or `@defer` directive at a particular {path} in the response.

::: The _root delivery group_ is the _delivery group_ that represents the root
selection set in the operation.

Each _delivery group_ belongs to a {parent} delivery group, except for the _root
delivery group_. During field collection, the delivery group of each field is
tracked, and this is used when determining when to execute and deliver defered
fields and streamed list items.

In an operation that does not utilise the `@stream` and `@defer` directives,
there will only be a single delivery group, the _root delivery group_, and all
fields will belong to it.

### Execution group

::: An _execution group_ represents a number of fields at a number of given
paths in the operation that all belong to the same _delivery group_ or groups.
An execution group may depend on other execution groups, such that it cannot be
delivered until they also have been delivered.

::: A _shared execution group_ is an _execution group_ that applies to more than
one _delivery group_. Shared execution groups cannot be delivered on their own,
they must only be delivered along with at least one completed _execution group_
that depends on them.

An execution group consists of:

- {deliveryGroups}: a set of the delivery groups to which it applies,
- {pendingId}: a numeric id used in the response stream to identify where to
  write the data,
- {status}: {PENDING}, {EXECUTING}, {COMPLETE} or {FAILED},
- {dependencies}: a list of execution groups on which it is dependent, and
- {groupedFieldSetByPath}: a map of response path to grouped field set that it
  is responsible for executing.
- {objectValueByPath}: a map of response path to the object value for that path,
  to be used when executing field sets against that object value.

Note: {dependencies}, {groupedFieldSetByPath}, and {objectValueByPath} may be
added to over time.

ExecuteExecutionGroup(executionGroup, variableValues):

- TODO

ExecuteRootSelectionSet(selectionSet, objectType, initialValue, variableValues,
serial):

- If {serial} is not provided, initialize it to {false}.
- Let {path} be an empty list.
- Let {rootDeliveryGroup} be a new delivery group with path {path}.
- Let {groupedFieldSet} be the result of {CollectFields(objectType,
  selectionSet, variableValues, path, rootDeliveryGroup)}.
- Let {currentDeliveryGroups} be a set containing {rootDeliveryGroup}.
- Let {data} and {incrementalFieldSetsByPath} be the result of running
  {ExecuteFieldSet(groupedFieldSet, objectType, initialValue, variableValues,
  path, currentDeliveryGroups)} _serially_ if {serial} is true, or _normally_
  (allowing parallelization) otherwise.
- Let {errors} be the list of all _field error_ raised while executing the
  selection set.
- If {incrementalFieldSetsByPath} is empty:
  - Return an unordered map containing {data} and {errors}.
- Otherwise:
  - Return {IncrementalEventStream(data, errors, incrementalFieldSetsByPath,
    variableValues)}.

IncrementalEventStream(data, errors, initialIncrementalFieldSetsByPath,
variableValues):

- Return a new event stream {responseStream} which yields events as follows:
- Let {nextId} be {0}.
- Let {executionGroups} be an empty set.
- Let {pending} be an empty list.
- Define the sub-procedure {CreateExecutionGroup(deliveryGroups)} with the
  following actions:
  - Let {executionGroup} be a new execution group that relates to
    {deliveryGroups} with no dependencies and an empty {groupedFieldSetByPath}
    and {objectValueByPath}.
  - If {deliveryGroups} contains more than one entry:
    - Let {id} be {null}.
    - Let {bestPath} be {null}.
    - For each {deliveryGroups} as {deliveryGroup}:
      - Let {deliveryGroupSet} be a set containing {deliveryGroup}.
      - Let {childExecutionGroup} be the result of
        {ExecutionGroupFor(deliveryGroupSet)}.
      - Add {executionGroup} as a dependency of {childExecutionGroup}.
      - Let {path} be the path of {deliveryGroup}.
      - If {bestPath} is {null} or {bestPath} contains fewer entries than
        {path}:
        - Let {bestPath} be {path}.
        - Let {id} be the {pendingId} of {childExecutionGroup}.
  - Otherwise:
    - Let {id} be {nextId} and increment {nextId} by one.
    - Let {deliveryGroup} be the only entry in {deliveryGroups}.
    - Let {path} be the path of {deliveryGroup}.
    - Let {label} be the label of {deliveryGroup} (if any).
    - Let {pendingPayload} be an unordered map containing {id}, {path}, {label}.
    - Add {pendingPayload} to {pending}.
  - Assert: {id} is not null.
  - Set {id} as the value for {pendingId} in {executionGroup}.
  - Add {executionGroup} to {executionGroups}.
  - Return {executionGroup}.
- Define the sub-procedure {ExecutionGroupFor(deliveryGroups)} with the
  following actions:
  - Let {executionGroup} be the execution group for the current operation that
    relates to the delivery groups {deliveryGroups} and only those delivery
    groups. If no such execution group exists then let {executionGroup} be the
    result of {CreateExecutionGroup(deliveryGroups)}.
  - Return {executionGroup}.
- Define the sub-procedure {AddFieldDigestsToExecutionGroup(executionGroup,
  path, objectValue, responseKey, fieldDigests)} with the following actions:
  - Let {groupedFieldSetByPath} be that property of {executionGroup}.
  - Let {objectValueByPath} be that property of {executionGroup}.
  - Let {groupedFieldSet} be the map in {groupedFieldSetByPath} for {path}; if
    no such list exists, create it as an empty map and set {objectValue} as the
    value for {path} in {objectValueByPath}.
  - Set {fieldDigests} as the value for {responseKey} in {groupedFieldSet}.
- Define the sub-procedure {HandleIncremental(fieldSetsByPath)} with the
  following actions:
  - For each {fieldSetsByPath} as {path} and {fieldSets}:
    - For each {fieldSets} as {responseKey} and {fieldDigests}:
      - Let {deliveryGroups} be the set of delivery groups in {fieldDigests}.
      - Let {executionGroup} be {ExecutionGroupFor(deliveryGroups)}.
      - Let {objectValueByPath} be that property of {executionGroup}.
      - Let {objectValue} be the value for {path} in {objectValueByPath}.
      - Assert: {objectValue} exists and is not {null}.
      - Call {AddFieldDigestsToExecutionGroup(executionGroup, path, objectValue,
        responseKey, fieldDigests)}.
- Call {HandleIncremental(initialIncrementalFieldSetsByPath)}.
- Assert: {pending} is not empty.
- Let {initialResponse} be an unordered map containing {data}, {errors},
  {pending}, and the value {true} for key {hasNext}.
- Yield an event containing {initialResponse}.
- Let {incremental} be an empty list.
- Let {pending} be an empty list.
- Let {completed} be an empty list.
- Define the sub-procedure {FlushStream(hasNext)} with the following actions:
  - If {hasNext} is not provided, initialize it to {true}.
  - Let {incrementalPayload} be an empty unordered map.
  - Add {hasNext} to {incrementalPayload}.
  - If {incremental} is not empty:
    - Add {incremental} to {incrementalPayload}.
  - If {pending} is not empty:
    - Add {pending} to {incrementalPayload}.
  - If {completed} is not empty:
    - Add {completed} to {incrementalPayload}.
  - Yield an event containing {incrementalPayload}.
  - Reset {incremental} to an empty list.
  - Reset {pending} to an empty list.
  - Reset {completed} to an empty list.
- While {remainingDefers} is not empty or {remainingStreams} is not empty:
  - If {remainingDefers} is not empty:
    - Let {pendingDefer} be the first entry in {remainingDefers}.
    - Remove {pendingDefer} from {remainingDefers}.
    - Let {thisId} be the value for key {id} in {pendingDefer}.
    - Let {defers} be the value for key {defers} in {pendingDefer}.
    - Note: A single `@defer` directive may output multiple incremental payloads
      at different paths; it is essential that these multiple incremental
      payloads are received by the client as part of a single event in order to
      maintain consistency for the client. This is why these incremental
      payloads are batched together rather than being flushed to the event
      stream as early as possible.
    - Let {batchIncremental} be an empty list.
    - Let {batchErrors} be an empty list.
    - Let {batchDefers} be an empty unordered map.
    - Let {batchStreams} be an empty list.
    - For each key {path} and value {deferredDetailsForPath} in {defers}, in
      parallel:
      - Let {objectType} be the value for key {objectType} in
        {deferredDetailsForPath}.
      - Let {objectValue} be the value for key {objectValue} in
        {deferredDetailsForPath}.
      - Let {fieldDetails} be the value for key {fieldDetails} in
        {deferredDetailsForPath}.
      - Let {fields} be a list of all the values of the {field} key in the
        entries of {fieldDetails}.
      - Let {selectionSet} be a new selection set consisting of {fields}.
      - Let {data}, {childDefers} and {childStreams} be the result of running
        {ExecuteSelectionSet(selectionSet, objectType, objectValue,
        variableValues, path)}.
      - Let {childErrors} be the list of all _field error_ raised while
        executing the selection set.
      - Let {incrementalPayload} be an unordered object containing {path},
        {data}, and the key {errors} with value {childErrors}.
      - Append {incrementalPayload} to {batchIncremental}.
      - Add the entries of {childDefers} into {batchDefers}. Note: {childDefers}
        and {batchDefers} will never have keys in common.
      - For each entry {stream} in {childStreams}, append {stream} to
        {batchStreams}.
    - For each entry {incrementalPayload} in {batchIncremental}, append
      {incrementalPayload} to {incremental}.
    - If {batchDefers} is not an empty object:
      - Let {id} be {nextId} and increment {nextId} by one.
      - Let {path} be the result of running
        {LongestCommonPathPrefix(batchDefers)}.
      - Let {pendingPayload} be an unordered map containing {id}, {path}.
      - Add {pendingPayload} to {pending}.
      - Let {defers} be {batchDefers}.
      - Let {pendingDefer} be an unordered map containing {id}, {defers}.
      - Append {pendingDefer} to {remainingDefers}.
    - For each entry {streamDetails} in {batchStreams}:
      - Let {id} be {nextId} and increment {nextId} by one.
      - Let {path} be the value for the key {path} in {streamDetails}.
      - Let {pendingPayload} be an unordered map containing {id}, {path}.
      - Add {pendingPayload} to {pending}.
      - Let {pendingStream} be an unordered map containing {id},
        {streamDetails}.
      - Append {pendingStream} to {remainingStreams}.
    - Add to {completed} an unordered map containing key {id} with value
      {thisId}.
    - Optionally, {FlushStream()}.
  - Otherwise:
    - Assert: {remainingStreams} is not empty.
    - Let {pendingStream} be the first entry in {remainingStreams}.
    - Remove {pendingStream} from {remainingStreams}.
    - Let {thisId} be the value for key {id} in {pendingStream}.
    - Let {streamDetails} be the value for key {streamDetails} in
      {pendingStream}.
    - Let {parentPath} be the value for key {path} in {streamDetails}.
    - Let {itemType} be the value for key {itemType} in {streamDetails}.
    - Let {fields} be the value for key {fields} in {streamDetails}.
    - Let {remainingValues} the the value for key {remainingValues} in
      {streamDetails}.
    - Let {initialCount} be the value for key {initialCount} in {streamDetails}.
    - Let {fieldDetails} be the value for key {fieldDetails} in {streamDetails}.
    - For each entry {remainingValue} with zero-based index
      {remainingValueIndex} in {remainingValues}.
      - Let {index} be the result of adding {initialCount} to
        {remainingValueIndex}.
      - Let {path} be a copy of {parentPath} with {index} appended.
      - Let {value} and {incrementalFieldSetsByPath} be the result of running
        {CompleteValue(itemType, fields, remainingValue, variableValues, path)}.
      - Let {childErrors} be the list of all _field error_ raised while
        completing the value.
      - Let {incrementalPayload} be an unordered object containing {path},
        {value}, and the key {errors} with value {childErrors}.
      - Append {incrementalPayload} to {incremental}.
      - If {childDefers} is not an empty object:
        - Let {id} be {nextId} and increment {nextId} by one.
        - Let {path} be the result of running
          {LongestCommonPathPrefix(childDefers)}.
        - Let {pendingPayload} be an unordered map containing {id}, {path}.
        - Add {pendingPayload} to {pending}.
        - Let {defers} be {childDefers}.
        - Let {pendingDefer} be an unordered map containing {id}, {defers}.
        - Append {pendingDefer} to {remainingDefers}.
      - For each entry {streamDetails} in {childStreams}:
        - Let {id} be {nextId} and increment {nextId} by one.
        - Let {path} be the value for the key {path} in {streamDetails}.
        - Let {pendingPayload} be an unordered map containing {id}, {path}.
        - Add {pendingPayload} to {pending}.
        - Let {pendingStream} be an unordered map containing {id},
          {streamDetails}.
        - Append {pendingStream} to {remainingStreams}.
      - Add to {completed} an unordered map containing key {id} with value
        {thisId}.
      - Optionally, {FlushStream()}.
- {FlushStream(false)}.
- Complete {responseStream}.

### Query

If the operation is a query, the result of the operation is the result of
executing the operation’s top level selection set with the query root operation
type.

An initial value may be provided when executing a query operation.

ExecuteQuery(query, schema, variableValues, initialValue):

- Let {queryType} be the root Query type in {schema}.
- Assert: {queryType} is an Object type.
- Let {selectionSet} be the top level Selection Set in {query}.
- Return the result of running {ExecuteRootSelectionSet(selectionSet, queryType,
  initialValue, variableValues)}.

### Mutation

If the operation is a mutation, the result of the operation is the result of
executing the operation’s top level selection set on the mutation root object
type. This selection set should be executed serially.

It is expected that the top level fields in a mutation operation perform
side-effects on the underlying data system. Serial execution of the provided
mutations ensures against race conditions during these side-effects.

ExecuteMutation(mutation, schema, variableValues, initialValue):

- Let {mutationType} be the root Mutation type in {schema}.
- Assert: {mutationType} is an Object type.
- Let {selectionSet} be the top level Selection Set in {mutation}.
- Return the result of running {ExecuteRootSelectionSet(selectionSet, queryType,
  initialValue, variableValues, true)}.

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
- Let {groupedFieldSet} be the result of {CollectFields(subscriptionType,
  selectionSet, variableValues)}.
- If {groupedFieldSet} does not have exactly one entry, raise a _request error_.
- Let {fields} be the value of the first entry in {groupedFieldSet}.
- Let {fieldName} be the name of the first entry in {fields}. Note: This value
  is unaffected if an alias is used.
- Let {field} be the first entry in {fields}.
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
  - Let {response} be the result of running
    {ExecuteSubscriptionEvent(subscription, schema, variableValues, event)}.
  - If {response} is an event stream:
    - For each {childEvent} on {response}:
      - Yield {childEvent}.
  - Otherwise:
    - Yield an event containing {response}.
- When {responseStream} completes: complete this event stream.

ExecuteSubscriptionEvent(subscription, schema, variableValues, initialValue):

- Let {subscriptionType} be the root Subscription type in {schema}.
- Assert: {subscriptionType} is an Object type.
- Let {selectionSet} be the top level Selection Set in {subscription}.
- Return the result of running {ExecuteRootSelectionSet(selectionSet,
  subscriptionType, initialValue, variableValues)}.

Note: The {ExecuteSubscriptionEvent()} algorithm is intentionally similar to
{ExecuteQuery()} since this is how each event result is produced.

#### Unsubscribe

Unsubscribe cancels the Response Stream when a client no longer wishes to
receive payloads for a subscription. This may in turn also cancel the Source
Stream. This is also a good opportunity to clean up any other resources used by
the subscription.

Unsubscribe(responseStream):

- Cancel {responseStream}

## Executing Selection Sets

To execute a selection set, the object value being evaluated and the object type
need to be known, as well as whether it must be executed serially, or may be
executed in parallel.

First, the selection set is turned into a grouped field set; then, each
represented field in the grouped field set produces an entry into a response
map.

ExecuteFieldSet(groupedFieldSet, objectType, objectValue, variableValues, path,
currentDeliveryGroups):

- Let {incrementalFieldSetsByPath} be an empty map.
- Initialize {resultMap} to an empty ordered map.
- For each {groupedFieldSet} as {responseKey} and {fieldDigests}:
  - Let {deliveryGroups} be the set of delivery groups in {fieldDigests}.
  - If {deliveryGroups} contains every delivery group in
    {currentDeliveryGroups}:
    - Let {fieldName} be the name of the field of the first entry in
      {fieldDigests}. Note: This value is unaffected if an alias is used.
    - Let {fieldType} be the return type defined for the field {fieldName} of
      {objectType}.
    - If {fieldType} is defined:
      - Let {childPath} be the result of appending {responseKey} to {path}.
      - Let {responseValue} and {childFieldSetsByPath} be
        {ExecuteField(objectType, objectValue, fieldType, fieldDigests,
        variableValues, childPath, currentDeliveryGroups)}.
      - Set {responseValue} as the value for {responseKey} in {resultMap}.
      - For each {childFieldSetsByPath} as {childPath} and {fieldSets}:
        - Set {fieldSets} as the value for {childPath} in
          {incrementalFieldSetsByPath}.
  - Otherwise:
    - Let {incrementalFieldSets} be the map in {incrementalFieldSetsByPath} for
      {path}; if no such map exists, create it as an empty map.
    - Set {fieldDigests} as the value for {responseKey} in
      {incrementalFieldSets}.
- Return {resultMap} and {incrementalFieldSetsByPath}.

Note: {resultMap} is ordered by which fields appear first in the operation. This
is explained in greater detail in the Field Collection section below.

**Errors and Non-Null Fields**

If during {ExecuteFieldSet()} a field with a non-null {fieldType} raises a
_field error_ then that error must propagate to this entire selection set,
either resolving to {null} if allowed or further propagated to a parent field.

If this occurs, any sibling fields which have not yet executed or have not yet
yielded a value may be cancelled to avoid unnecessary work.

Note: See [Handling Field Errors](#sec-Handling-Field-Errors) for more about
this behavior.

Further, if this occurs, the {incrementalFieldSetsByPath} must be made empty.

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

### Field Collection

Before execution, the selection set is converted to a grouped field set by
calling {CollectFields()}. Each entry in the grouped field set is a list of
fields that share a response key (the alias if defined, otherwise the field
name). This ensures all fields with the same response key (including those in
referenced fragments) are executed at the same time.

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
}
```

The depth-first-search order of the field groups produced by {CollectFields()}
is maintained through execution, ensuring that fields appear in the executed
response in a stable and predictable order.

CollectFields(objectType, selectionSet, variableValues, path, deliveryGroup,
visitedFragments):

- If {path} is not provided, initialize it to an empty list.
- If {deliveryGroup} is not provided, initialize it to be a new delivery group
  with path {path}.
- If {visitedFragments} is not provided, initialize it to the empty set.
- Initialize {groupedFields} to an empty ordered map of lists.
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
    - Let {groupForResponseKey} be the list in {groupedFields} for
      {responseKey}; if no such list exists, create it as an empty list.
    - Let {fieldDigest} be a new field digest containing {selection} and
      {deliveryGroup}.
    - Append {fieldDigest} to the {groupForResponseKey}.
  - If {selection} is a {FragmentSpread}:
    - Let {fragmentDeliveryGroup} be {deliveryGroup}.
    - If {selection} provides the directive `@defer`, let {deferDirective} be
      that directive.
      - If {deferDirective}'s {if} argument is not {false} and is not a variable
        in {variableValues} with the value {false}:
        - Let {label} be the value of {deferDirective}'s {label} argument (or
          the value of the associated variable) if any.
        - Let {fragmentDeliveryGroup} be a new delivery group with path {path},
          parent {deliveryGroup} and label {label}.
    - Let {fragmentSpreadName} be the name of {selection}.
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
    - Let {fragmentGroupedFieldSet} be the result of calling
      {CollectFields(objectType, fragmentSelectionSet, variableValues, path,
      fragmentDeliveryGroup, visitedFragments)}.
    - For each {fragmentGroup} in {fragmentGroupedFieldSet}:
      - Let {responseKey} be the response key shared by all fields in
        {fragmentGroup}.
      - Let {groupForResponseKey} be the list in {groupedFields} for
        {responseKey}; if no such list exists, create it as an empty list.
      - Append all items in {fragmentGroup} to {groupForResponseKey}.
  - If {selection} is an {InlineFragment}:
    - Let {fragmentDeliveryGroup} be {deliveryGroup}.
    - If {selection} provides the directive `@defer`, let {deferDirective} be
      that directive.
      - If {deferDirective}'s {if} argument is not {false} and is not a variable
        in {variableValues} with the value {false}:
        - Let {label} be the value of {deferDirective}'s {label} argument (or
          the value of the associated variable) if any.
        - Let {fragmentDeliveryGroup} be a new delivery group with path {path},
          parent {deliveryGroup} and label {label}.
    - Let {fragmentType} be the type condition on {selection}.
    - If {fragmentType} is not {null} and {DoesFragmentTypeApply(objectType,
      fragmentType)} is false, continue with the next {selection} in
      {selectionSet}.
    - Let {fragmentSelectionSet} be the top-level selection set of {selection}.
    - Let {fragmentGroupedFieldSet} be the result of calling
      {CollectFields(objectType, fragmentSelectionSet, variableValues, path,
      fragmentDeliveryGroup, visitedFragments)}.
    - For each {fragmentGroup} in {fragmentGroupedFieldSet}:
      - Let {responseKey} be the response key shared by all fields in
        {fragmentGroup}.
      - Let {groupForResponseKey} be the list in {groupedFields} for
        {responseKey}; if no such list exists, create it as an empty list.
      - Append all items in {fragmentGroup} to {groupForResponseKey}.
- Return {groupedFields}.

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

Note: The steps in {CollectFields()} evaluating the `@skip` and `@include`
directives may be applied in either order since they apply commutatively.

## Executing Fields

Each field requested in the grouped field set that is defined on the selected
objectType will result in an entry in the response map. Field execution first
coerces any provided argument values, then resolves a value for the field, and
finally completes that value either by recursively executing another selection
set or coercing a scalar value.

ExecuteField(objectType, objectValue, fieldType, fieldDigests, variableValues,
path, currentDeliveryGroups):

- Let {field} be the first entry in {fieldDigests}.
- Let {fieldName} be the field name of {field}.
- Let {argumentValues} be the result of {CoerceArgumentValues(objectType, field,
  variableValues)}
- Let {resolvedValue} be {ResolveFieldValue(objectType, objectValue, fieldName,
  argumentValues)}.
- Return the result of {CompleteValue(fieldType, fieldDigests, resolvedValue,
  variableValues, path, currentDeliveryGroups)}.

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

ResolveFieldValue(objectType, objectValue, fieldName, argumentValues):

- Let {resolver} be the internal function provided by {objectType} for
  determining the resolved value of a field named {fieldName}.
- Return the result of calling {resolver}, providing {objectValue} and
  {argumentValues}.

Note: It is common for {resolver} to be asynchronous due to relying on reading
an underlying database or networked service to produce a value. This
necessitates the rest of a GraphQL executor to handle an asynchronous execution
flow.

### Value Completion

After resolving the value for a field, it is completed by ensuring it adheres to
the expected return type. If the return type is another Object type, then the
field execution process continues recursively.

CompleteValue(fieldType, fieldDigests, result, variableValues, path,
currentDeliveryGroups):

- If the {fieldType} is a Non-Null type:
  - Let {innerType} be the inner type of {fieldType}.
  - Let {completedResult} and {incrementalFieldSetsByPath} be the result of
    calling {CompleteValue(innerType, fieldDigests, result, variableValues,
    path, currentDeliveryGroups)}.
  - If {completedResult} is {null}, raise a _field error_.
  - Return {completedResult} and {incrementalFieldSetsByPath}.
- If {result} is {null} (or another internal value similar to {null} such as
  {undefined}), return {null}.
- If {fieldType} is a List type:
  - If {result} is not a collection of values, raise a _field error_.
  - Let {innerType} be the inner type of {fieldType}.
  - Let {incrementalFieldSetsByPath} be an empty map.
  - Let {list} be an empty list.
    - For each list item {resultItem} at 0-indexed index {resultIndex} in
      {result}:
      - Let {subpath} be the result of appending {resultIndex} to {path}.
      - Let {listValue} and {itemIncrementalFieldSetsByPath} be the result of
        calling {CompleteValue(innerType, fieldDigests, resultItem,
        variableValues, subpath, currentDeliveryGroups)}.
      - Append {listValue} to {list}.
      - If {listValue} is not {null}:
        - For each {itemIncrementalFieldSetsByPath} as {childPath} and
          {childFieldSets}:
          - Set {childFieldSets} as the value for {childPath} in
            {incrementalFieldSetsByPath}.
  - Return {list} and {incrementalFieldSetsByPath}.
- If {fieldType} is a Scalar or Enum type:
  - Let {completedResult} be the result of {CoerceResult(fieldType, result)}.
  - Return {completedResult} and an empty map.
- If {fieldType} is an Object, Interface, or Union type:
  - If {fieldType} is an Object type.
    - Let {objectType} be {fieldType}.
  - Otherwise if {fieldType} is an Interface or Union type.
    - Let {objectType} be {ResolveAbstractType(fieldType, result)}.
  - Let {groupedFieldSet} be the result of calling
    {CollectSubfields(fieldDigests, objectType, variableValues, path)}.
  - Return the result of evaluating {ExecuteFieldSet(groupedFieldSet,
    objectType, result, variableValues, path, currentDeliveryGroups)} _normally_
    (allowing for parallelization).

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

After resolving the value for `me`, the selection sets are merged together so
`firstName` and `lastName` can be resolved for one value.

CollectSubfields(fields, objectType, variableValues, path):

- Let {finalGroupedFieldSet} be an empty list.
- For each {fieldDigest} in {fields}:
  - Let {field} be the field of {fieldDigest}.
  - Let {deliveryGroup} be the delivery group of {fieldDigest}.
  - Let {fieldSelectionSet} be the selection set of {field}.
  - If {fieldSelectionSet} is null or empty, continue to the next field.
  - Let {groupedFieldSet} be the result of {CollectFields(objectType,
    selectionSet, variableValues, path, deliveryGroup)}.
  - For each {groupedFieldSet} as {responseKey} and {fieldDigests}:
    - Let {groupForResponseKey} be the list in {finalGroupedFieldSet} for
      {responseKey}; if no such list exists, create it as an empty list.
    - Append all field digests in {fieldDigests} to the {groupForResponseKey}.
- Return {finalGroupedFieldSet}.

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

If all fields from the root of the request to the source of the field error
return `Non-Null` types, then the {"data"} entry in the response should be
{null}.
