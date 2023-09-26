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

- Let {queryType} be the root Query type in {schema}.
- Assert: {queryType} is an Object type.
- Let {selectionSet} be the top level Selection Set in {query}.
- Return {ExecuteRootSelectionSet(variableValues, initialValue, queryType,
  selectionSet)}.

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
- Return {ExecuteRootSelectionSet(variableValues, initialValue, queryType,
  selectionSet, true)}.

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
- Let {fieldsByTarget} be the result of calling
  {AnalyzeSelectionSet(subscriptionType, selectionSet, variableValues)}.
- Let {groupedFieldSet} be the first entry in {fieldsByTarget}.
- If {groupedFieldSet} does not have exactly one entry, raise a _request error_.
- Let {fieldGroup} be the value of the first entry in {groupedFieldSet}.
- Let {fieldDetails} be the first entry in {fieldGroup}.
- Let {node} be the corresponding entry on {fieldDetails}.
- Let {fieldName} be the name of {node}. Note: This value is unaffected if an
  alias is used.
- Let {argumentValues} be the result of {CoerceArgumentValues(subscriptionType,
  node, variableValues)}
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
  - Yield an event containing {response}.
- When {responseStream} completes: complete this event stream.

ExecuteSubscriptionEvent(subscription, schema, variableValues, initialValue):

- Let {subscriptionType} be the root Subscription type in {schema}.
- Assert: {subscriptionType} is an Object type.
- Let {selectionSet} be the top level Selection Set in {subscription}.
- Let {fieldsByTarget} be the result of calling
  {AnalyzeSelectionSet(subscriptionType, selectionSet, variableValues)}.
- Let {groupedFieldSet} be the first entry in {fieldsByTarget}.
- Let {data} be the result of running {ExecuteGroupedFieldSet(groupedFieldSet,
  subscriptionType, initialValue, variableValues)} _normally_ (allowing
  parallelization).
- Let {errors} be the list of all _field error_ raised while executing the
  {groupedFieldSet}.
- Return an unordered map containing {data} and {errors}.

Note: The {ExecuteSubscriptionEvent()} algorithm is intentionally similar to
{ExecuteQuery()} since this is how each event result is produced. Incremental
delivery, however, is not supported within ExecuteSubscriptionEvent.

#### Unsubscribe

Unsubscribe cancels the Response Stream when a client no longer wishes to
receive payloads for a subscription. This may in turn also cancel the Source
Stream. This is also a good opportunity to clean up any other resources used by
the subscription.

Unsubscribe(responseStream):

- Cancel {responseStream}

## Incremental Delivery

If an operation contains `@defer` or `@stream` directives, execution may also
result in an Subsequent Result stream in addition to the initial response.
Because execution of Subsequent Results may occur concurrently and prior to the
completion of their parent results, an Incremental Publisher may be used to
manage the ordering and potentially filtering of the Subsequent Result stream,
as described below.

The Incremental Publisher is responsible for processing Execution Events
submitted to its queue, including introduction of potential new Subsequent
Results, exclusion of any Subsequent Results in case of null bubbling within the
parent, normal completion of Subsequent Results, and errors within Subsequent
Results that preclude their data from being sent.

The Incremental Publisher provides an asynchronous iterator that resolves to the
Subsequent Result stream.

Both the Execution algorithms and the Incremental Publisher service utilize
Incremental Result and Data Records to store required information. The records
are detailed below, including which entries are required for Execution itself
and which are required by the Incremental Publisher.

### Incremental Delivery Records

#### Incremental Publisher Records

An Incremental Publisher Record is a structure containing:

- {eventQueue}: a queue to which events can be pushed from multiple sources,
  perhaps concurrently.
- {pending}: a list of pending notifications for Deferred Fragment or Stream
  Records whose parent is the initial result, set after the Completed Initial
  Result Event has been processed.
- {subsequentResults}: an iterator for the Subsequent Result stream, meaningful
  only if pending is non-empty.

Note: The Incremental Publisher may be run as a separate service. The input to
the Incremental Publisher are the Execution Events enqueued on {eventQueue}; the
output is the value for {pending}, as well as the {subsequentResults} stream.

Note: The Incremental Publisher could be extended to provide additional
functionality. For example, for implementations intending to defer execution
until the parent result has completed, the Incremental Publisher could be
extended to allow subscribing to this event. Additionally, for implementations
choosing to ignore incremental delivery directives given a certain threshold of
already deferred fields, the Incremental Publisher could be extended to allow
querying for the present number of deferred fields.

#### Incremental Result Records

An Incremental Result Record is either an Initial Result Record or a Subsequent
Result Record. A Subsequent Result Record is either a Deferred Fragment Record
or a Stream Items Record.

An Initial Result Record is a structure containing:

- {id}: an implementation-specific value uniquely identifying this record,
  created if not provided.

A Deferred Fragment Record is a structure that always contains:

- {id}: an implementation-specific value uniquely identifying this record,
  created if not provided.

Within the Incremental Publisher context, records of this type also include:

- {label}: value derived from the corresponding `@defer` directive.
- {path}: a list of field names and indices from root to the location of the
  corresponding `@defer` directive.
- {deferredGroupedFieldSets}: the set of Deferred Group Field Set Records that
  comprise this Deferred Fragment Record, initialized to the empty set.
- {pendingDeferredGroupedFieldSetRecords}: the set of still pending Deferred
  Group Field Set Records, initialized to the empty set.
- {errors}: a list of any unrecoverable errors encountered when attempting to
  deliver this record, initialized to an empty list.

A Stream Items Record is a structure that always contains:

- {id}: an implementation-specific value uniquely identifying this record,
  created if not provided.

Within the Incremental Publisher context, records of this type also include:

- {path}: a list of field names and indices from root to the location of the
  corresponding list item contained by this Stream Items Record.
- {stream}: the Stream Record which this Stream Items Record partially fulfills.
- {items}: a list that will contain the streamed item, if the underlying
  iterator produced a value.
- {errors}: a list of all _field error_ raised while completing the value
  produced by the iterator.
- {isCompleted}: a boolean value indicating whether this record is complete,
  initialized to {false}.
- {isCompletedIterator}: a boolean value indicating whether this record
  represents completion of the iterator rather than any actual items.

A Stream Record is a structure that always contains:

- {id}: an implementation-specific value uniquely identifying this record,
  created if not provided.

Within the Incremental Publisher context, records of this type also include:

- {label}: value derived from the corresponding `@stream` directive.
- {path}: a list of field names and indices from root to the location of the
  corresponding `@stream` directive.
- {earlyReturn}: implementation-specific value denoting how to notify the
  underlying iterator that no additional items will be requested.
- {pendingSent}: a boolean value indicating whether a pending notification for
  this record has been sent.
- {errors}: a list of any unrecoverable errors encountered when attempting to
  deliver this record, initialized to an empty list.

#### Incremental Data Records

An Incremental Data Record is either an Initial Result Record, a Deferred
Grouped Field Set Record or a Stream Items Record.

A Deferred Grouped Field Set Record is a structure that always contains:

- {id}: an implementation-specific value uniquely identifying this record,
  created if not provided.

Within the Incremental Publisher context, records of this type also include:

- {path}: a list of field names and indices from root to the location of this
  deferred grouped field set.
- {deferredFragments}: a set of Deferred Fragment Records containing this
  record.
- {data}: an ordered map that will contain the result of execution for this
  fragment on completion, not defined until the record has been completed.
- {errors}: a list of all _field error_ raised while executing this record, not
  defined until the record has been completed.

Deferred Grouped Field Set Records may fulfill multiple Deferred Fragment
Records secondary to overlapping fields. Initial Result Records and Stream Items
Records always each fulfills a single result record and so they represents both
a unit of Incremental Data as well as an Incremental Result.

### Execution Events

#### New Deferred Fragment Event

Required event details include:

- {id}: string value identifying this Deferred Fragment.
- {label}: value derived from the corresponding `@defer` directive.
- {path}: a list of field names and indices from root to the location of the
  corresponding `@defer` directive.
- {parentId}: string value identifying the parent incremental result record for
  this Deferred Fragment.

#### New Deferred Grouped Field Set Event

Required event details include:

- {id}: string value identifying this Deferred Grouped Field Set.
- {path}: a list of field names and indices from root to the location of this
  deferred grouped field set.
- {fragmentIds}: list of string values identifying the Deferred Fragments
  containing this Deferred Grouped Field Set.

#### Completed Deferred Grouped Field Set Event

Required event details include:

- {id}: string value identifying this Deferred Grouped Field Set.
- {data}: ordered map represented the completed data for this Deferred Grouped
  Field Set.
- {errors}: the list of _field error_ for this Deferred Grouped Field Set.

#### Errored Deferred Grouped Field Set Event

Required event details include:

- {id}: string value identifying this Deferred Grouped Field Set.
- {errors}: The _field error_ causing the entire Deferred Grouped Field Set to
  error.

#### New Stream Event

Required event details include:

- {id}: string value identifying this Stream.
- {label}: value derived from the corresponding `@stream` directive.
- {path}: a list of field names and indices from root to the location of the
  corresponding `@stream` directive.
- {earlyReturn}: implementation-specific value denoting how to handle early
  return of the stream.

#### New Stream Items Event

Required event details include:

- {id}: string value identifying these Stream Items.
- {streamId}: string value identifying the Stream
- {parentIds}: string value identifying the parent incremental data results for
  these Stream Items.

#### Completed Stream Items Event

Required event details include:

- {id}: string value identifying these Stream Items.
- {items}: the list of items.
- {errors}: the list of _field error_ for these items.

#### Completed Empty Stream Items Event

Required event details include:

- {id}: string value identifying these Stream Items.

#### Errored Stream Items Event

Required event details include:

- {id}: string value identifying these Stream Items.
- {errors}: the _field error_ causing these items to error.

#### Completed Initial Result Event

Required event details include:

- {id}: string value identifying this Initial Result.

#### Field Error Event

Required event details include:

- {id}: string value identifying the Initial Result, Deferred Grouped Field Set
  or Stream Items from which the _field error_ originates.
- {nullPath}: a list of field names and indices from root to the location of the
  error.

### Creating the Incremental Publisher

The Incremental Publisher manages a queue of incoming Execution Events and is
responsible when necessary for emitting a stream of Subsequent Results. The
incoming Execution Events can be handled synchronously, while the stream of
Subsequent Results is emitted asynchronously as necessary. The Incremental
Publisher Record itself exposes the {eventQueue} to the Execution algorithms.

After the Completed Initial Result is processed, if additions results are
pending, these will be listed within the {pending} entry on the Incremental
Publisher Record for inclusion within the initial result, and the
{subsequentResults} iterator will resolve to the stream of all Subsequent
Results.

CreateIncrementalPublisher():

- Perform the following initial steps:

  - Let {incrementalPublisher} be a new Incremental Publisher Record.
  - Set {eventQueue} on {incrementalPublisher} to an empty queue.
  - Initialize {subsequentResultMap} to a map of Incremental Result ids to
    Subsequent Result Records.
  - Initialize {deferredFragmentMap} to a map of Deferred Fragment ids to
    Deferred Fragment Records.
  - Initialize {deferredGroupedFieldSetMap} to a map of Deferred Fragment ids to
    Deferred Fragment Records.
  - Initialize {streamMap} to a map of Stream ids to Stream Records.
  - Initialize {streamItemsMap} to a map of Stream Items ids to Stream Items
    Records.
  - Initialize {pendingSubsequentResults} to the empty set.
  - Initialize {completedSubsequentResults} to the empty set.
  - Initialize {newPending} to the empty set.
  - Set {initialResultCompleted} to {false}.
  - Set {allResultsCompleted} to {false}.

- Define the sub-procedure {ReleaseSubsequentResult(subsequentResult)} as
  follows:

  - Add {subsequentResult} to {pendingSubsequentResults}.
  - If {subsequentResult} is a Stream Items Record:
    - Let {stream} be the corresponding entry on {subsequentResult}.
    - Let {pendingSent} be the corresponding entry on {stream}.
      - If {pendingSent} is {false}:
        - Add {stream} to {newPending}.
        - Set {pendingSent} on {stream} to {true}.
    - Let {isCompleted} be the corresponding entry on {subsequentResult}.
    - If {isCompleted} is {true}:
      - Add {subsequentResult} to {completedSubsequentResults}.
  - Otherwise:
    - Add {subsequentResult} to {newPending}.
    - Let {pendingDeferredGroupedFieldSets} be the corresponding entry on
      {subsequentResult}.
    - If {pendingDeferredGroupedFieldSets} is empty, add {subsequentResult} to
      {completedSubsequentResults}.

- Define the sub-procedure {HandleCompletedInitialResultEvent(id, children)} as
  follows:

  - Let {id} be the corresponding entry on {eventDetails}.
  - Let {children} be the corresponding entry on {subsequentResultMap} for {id}.
  - Delete the entry on {subsequentResultMap} for {id}.
  - For each {child} in {children}:
    - Call {ReleaseSubsequentResult(child)}.
  - Set {pending} on {incrementalPublisher} to
    {PendingSourcesToResults(newPending)}.
  - Set {initialResultCompleted} to {true}.

- Define the sub-procedure {HandleNewDeferredFragmentEvent(id, label, path,
  parentId)} as follows:

  - Let {deferredFragment} be a new Deferred Fragment Record created from {id},
    {label}, and {path}.
  - Set the entry for {id} in {deferredFragmentMap} to {deferredFragment}.
  - Let {subsequentResult} be the entry in {subsequentResultMap} for {parentId}.
  - If {subsequentResult} is not defined:
    - Initialize {subsequentResult} to an empty unordered map.
    - Initialize {children} to the empty set.
  - Otherwise:
    - Let {children} be the corresponding entry on {subsequentResult}.
  - Add {subsequentResult} to {children}.

- Define the sub-procedure {HandleNewDeferredGroupedFieldSetEvent(id, path,
  fragmentIds)} as follows:

  - Initialize {deferredFragments} to an empty list.
  - For each {fragmentId} in {fragmentIds}:
    - Let {deferredFragment} be the entry in {deferredFragmentMap} for
      {fragmentId}.
    - Let {deferredGroupedFieldSets} and {pendingDeferredGroupedFieldSets} be
      the corresponding entries on {deferredFragment}.
    - Add {deferredFragment} to each of {deferredGroupedFieldSets} and
      {pendingDeferredGroupedFieldSets}.
    - Append {deferredFragment} to {deferredFragments}.
  - Let {deferredGroupedFieldSet} be a new Deferred Grouped Field Set Record
    created from {id}, {path}, and {deferredFragments}.
  - Set the entry for {id} on {deferredGroupedFieldSetMap} to
    {deferredGroupedFieldSet}.

- Define the sub-procedure {HandleCompletedDeferredGroupedFieldSetEvent(id,
  data, errors)} as follows:

  - Let {deferredGroupedFieldSet} be the entry on {deferredGroupedFieldSetMap}
    for {id}.
  - Set the corresponding entries on {deferredGroupedFieldSet} to {data} and
    {errors}.
  - Let {deferredFragments} be the corresponding entry on
    {deferredGroupedFieldSet}.
  - For each {deferredFragment} in {deferredFragments}:
    - Let {pendingDeferredGroupedFieldSets} be the corresponding entry on
      {deferredFragment}.
    - Remove {deferredGroupedFieldSet} from {pendingDeferredGroupedFieldSets}.
    - If {pendingDeferredGroupedFieldSets} is empty and
      {pendingSubsequentResults} contains {deferredFragment}:
      - Add {deferredFragment} to {completedSubsequentResults}.

- Define the sub-procedure {HandleErroredDeferredGroupedFieldSetEvent(id,
  errors)} as follows:

  - Let {deferredGroupedFieldSet} be the entry for {id} on
    {deferredGroupedFieldSetMap}.
  - Let {deferredFragments} be the corresponding entry on
    {deferredGroupedFieldSet}.
  - For each {deferredFragment} in {deferredFragments}:
    - For each {error} in {errors}:
      - Append {error} to the list of {errors} on {deferredFragment}.
    - If {pendingSubsequentResults} contains {deferredFragment}:
      - Add {deferredFragment} to {completedSubsequentResults}.

- Define the sub-procedure {HandleNewStreamEvent(id, label, path, earlyReturn)}
  as follows:

  - Let {stream} be a new Stream Record created from {id}, {path}, and
    {earlyReturn}.
  - Set the entry for {id} on {streamMap} to {stream}.

- Define the sub-procedure {HandleNewStreamItemsEvent(id, streamId, parentIds)}
  as follows:

  - Let {stream} be the entry in {streamMap} for {streamId}.
  - Let {streamItems} be a new Stream Items record created from {id} and
    {stream}.
  - Set the entry for {id} on {streamItemsMap} to {streamItems}.
  - For each {parentId} in {parentIds}:
    - Let {subsequentResult} be the map in {allSubsequentResults} for
      {parentId}.
    - If {subsequentResult} is not defined:
      - Initialize {subsequentResult} to an empty unordered map.
      - Initialize {children} to the empty set.
    - Otherwise:
      - Let {children} be the corresponding entry on {subsequentResult}.
    - Add {subsequentResult} to {children}.

- Define the sub-procedure {HandleCompletedStreamItemsEvent(id, items, errors)}
  as follows:

  - Let {streamItems} be the entry on {streamItemsMap} for {id}.
  - Set the corresponding entries on {streamItems} to {items} and {errors}.
  - Set {isCompleted} on {streamItems} to {true}.
  - If {pendingSubsequentResults} contains {streamItems}:
    - Add {streamItems} to {completedSubsequentResults}.

- Define the sub-procedure {HandleCompletedEmptyStreamItemEvent(id)} as follows:

  - Let {streamItems} be the entry on {streamItemsMap} for {id}.
  - Set {isCompletedIterator} on {streamItems} to {true}.
  - Set {isCompleted} on {streamItems} to {true}.
  - If {pendingSubsequentResults} contains {streamItems}:
    - Add {streamItems} to {completedSubsequentResults}.

- Define the sub-procedure {HandleErroredStreamItemEvent(id, errors)} as
  follows:

  - Let {streamItems} be the entry on {streamItemsMap} for {id}.
  - Set the corresponding entries on {streamItems} to {items} and {errors}.
  - Let {stream} be the corresponding entry on {streamItems}.
  - For each {error} in {errors}:
    - Append {error} to the list of {errors} on {stream}.
  - If {pendingSubsequentResults} contains {streamItems}:
    - Add {streamItems} to {completedSubsequentResults}.

- Define the sub-procedure {HandleFieldErrorEvent(id, nullPath)} as follows:

  - Let {children} be the result of {GetChildren(subsequentResultMap, id)}.
  - Let {descendants} be the result of {GetDescendants(children)}.
  - Let {streams} be an empty set of Stream Records.
  - For each {descendant} in {descendants}:
    - If {NullsSubsequentResultRecord(descendant, nullPath)} is not {true}:
      - Continue to the next {descendant} in {descendants}.
    - Let {id} be the corresponding entry on {descendant}.
    - Delete the entry for {id} on {subsequentResultMap}.
    - If {descendant} is a Stream Items Record:
      - Add {stream} to {streams}.
      - Let {streamId} be the entry for {id} on {stream}.
      - Delete the entry for {streamId} on {streamMap}.
      - Delete the entry for {id} on {streamItemsMap}.
    - Otherwise:
      - Delete the entry for {id} on {deferredFragmentMap}.
      - Let {deferredGroupedFieldSets} be the corresponding entry on
        {descendant}.
      - For each {deferredGroupedFieldSet} in {deferredGroupedFieldSets}:
        - Let {deferredFragments} be the corresponding entry for
          {deferredGroupedFieldSet}.
        - Remove {descendant} from {deferredFragments}.
        - If {deferredFragments} is empty:
          - Let {id} be the corresponding entry on {deferredGroupedFieldSet}.
          - Delete the entry for {id} on {deferredGroupedFieldSetMap}.
  - For each {stream} in {streams}:
    - Let {earlyReturn} be the corresponding entry on {stream}.
    - As specified by the implementation-specific value within {earlyReturn},
      notify the underlying iterator that no additional items will be requested.

- Define the sub-procedure {HandleExecutionEvent(eventType, eventDetails)} as
  follows:

  - If {eventType} is a Completed Initial Result Event:
    - Let {id} be the corresponding entry on {eventDetails}.
    - Call {HandleCompletedInitialResultEvent(id)}.
  - If {eventType} is a New Deferred Fragment Event:
    - Let {id}, {label}, {path}, and {parentId} be the corresponding entries on
      {eventDetails}.
    - Call {HandleNewDeferredFragmentEvent(id, label, path, parentId)}.
  - If {eventType} is a New Deferred Grouped Field Set Event:
    - Let {id}, {path}, and {fragmentIds} be the corresponding entries on
      {eventDetails}.
    - Call {HandleNewDeferredGroupedFieldSetEvent(id, path, fragmentIds)}.
  - If {eventType} is a Completed Deferred Grouped Field Set Event:
    - Let {id}, {data} and {errors} be the corresponding entries on
      {eventDetails}.
    - Call {HandleCompletedDeferredGroupedFieldSetEvent(id, data, errors)}.
  - If {eventType} is an Errored Deferred Grouped Field Set Event:
    - Let {id} and {errors} be the corresponding entries on {eventDetails}.
    - Call {HandleErroredDeferredGroupedFieldSetEvent(id, data, errors)}.
  - If {eventType} is a New Stream Event:
    - Let {id}, {label}, {path}, and {earlyReturn} be the corresponding entries
      on {eventDetails}.
    - Call {HandleNewStreamEvent(id, label, path, earlyReturn)}.
  - If {eventType} is a New Stream Items Event:
    - Let {id}, {streamId}, and {parentIds} be the corresponding entries on
      {eventDetails}.
    - Call {HandleNewStreamItemEvent(id, streamId, parentIds)}.
  - If {eventType} is a Completed Stream Items Event:
    - Let {id}, {items} and {errors} be the corresponding entries on
      {eventDetails}.
    - Call {HandleCompletedStreamItemsEvent(id, items, errors)}.
  - If {eventType} is an Completed Empty Stream Items Event:
    - Let {id} be the corresponding entry on {eventDetails}.
    - Call {HandleCompletedEmptyStreamItemEvent(id)}.
  - If {eventType} is an Errored Stream Items Event:
    - Let {id} and {errors} be the corresponding entries on {eventDetails}.
    - Call {HandleErroredStreamItemEvent(id, errors)}.
  - If {eventType} is a Field Error Event:
    - Let {id} and {nullPath} be the corresponding entries on {eventDetails}.
    - Call {HandleFieldErrorEvent(id, nullPath)}.

- Define the sub-procedure YieldSubsequentResults() as follows:

  - Wait for {initialResultCompleted} to be set to {true}.
  - Repeat the following steps:
    - If a termination signal was received:
      - For each {stream} in {streamMap}:
        - Let {earlyReturn} be the corresponding entry on {stream}.
        - As specified by the implementation-specific value within
          {earlyReturn}, notify the underlying iterator that no additional items
          will be requested.
      - Return.
    - Clear {newPending} and re-initialize it to the empty set.
    - Initialize {incrementalResults} to an empty list.
    - Initialize {completedRecords} to the empty set.
    - While {completedSubsequentResults} is not empty:
      - Initialize {currentBatch} to the empty set.
      - For each {subsequentResult} in {completedSubsequentResults}:
        - Add {subsequentResult} to {currentBatch}.
        - Remove {subsequentResult} from both {completedSubsequentResults} and
          {pendingSubsequentResults}.
      - For each {subsequentResult} in {currentBatch}:
        - Let {id} be the corresponding entry on {subsequentResult}
        - Let {children} be the corresponding entry on {subsequentResultMap} for
          {id}.
        - Delete the entry on {subsequentResultMap} for {id}.
        - For each {child} in {children}:
          - Call {ReleaseSubsequentResult(child)}.
        - If {subsequentResult} is a Stream Items Record:
          - Let {id} be the corresponding entry on {subsequentResult}.
          - Delete the entry for {id} on {streamItemsMap}.
          - Let {isCompletedIterator} be the corresponding entry on
            {subsequentResult}.
          - Let {stream} be the corresponding entry on {subsequentResult}.
          - Let {streamErrors} be the entry for {errors} on {stream}.
          - If {streamErrors} is not empty or if {isCompletedIterator} is
            {true}:
            - Remove {stream} from {newPending}, if present.
            - Add {stream} to {completedRecords}.
            - Delete the entry for {streamId} on {streamItemsMap}.
            - Continue to the next {subsequentResult} in {currentBatch}.
          - Let {items} and {errors} be the corresponding entries on
            {subsequentResult}.
          - Let {incrementalResult} be an unordered map containing {items}.
          - If {errors} is not empty:
            - Set the corresponding entry on {incrementalResult} to {errors}.
          - Append {incrementalResult} to {incrementalResults}.
        - Otherwise:
          - Let {id} be the corresponding entry on {subsequentResult}.
          - Delete the entry for {id} on {deferredFragmentMap}.
          - Remove {subsequentResult} from {newPending}, if present.
          - Let {errors} be the corresponding entry on {subsequentResult}.
          - If {errors} is not empty:
            - Add {subsequentResult} to {completedRecords}.
            - Let {deferredGroupedFieldSets} be the corresponding entry on  
              {subsequentResult}.
            - For each {deferredGroupedFieldSet} in {deferredGroupedFieldSets}:
              - Let {deferredFragments} be the corresponding entry on
                {deferredGroupedFieldSet}.
              - Remove {subsequentResult} from {deferredFragments}.
              - If {deferredFragments} is empty:
                - Delete the entry for {id} on {deferredGroupedFieldSetMap}.
            - Continue to the next {subsequentResult} in {currentBatch}.
          - Add {subsequentResult} to {completedRecords}.
          - Let {deferredGroupedFieldSets} be the corresponding entry on
            {subsequentResult}.
          - For each {deferredGroupedFieldSet} in {deferredGroupedFieldSets}:
            - Let {id} be the corresponding entry on {deferredGroupedFieldSet}.
            - If {deferredGroupedFieldSetMap} does not include an entry for
              {id}:
              - This Deferred Grouped Field Set has already been sent, continue
                to the next {subsequentResult} in {currentBatch}.
            - Delete the entry for {id} on {deferredGroupedFieldSetMap}.
            - Let {data} and {errors} be the corresponding entries on
              {deferredGroupedFieldSet}.
            - Let {incrementalResult} be an unordered map containing {data}.
            - If {errors} is not empty:
              - Set the corresponding entry on {incrementalResult} to {errors}.
            - Append {incrementalResult} to {incrementalResults}.
    - Let {hasNext} be {true} if {pendingSubsequentResults} is empty; otherwise,
      let it be {false}.
    - Let {subsequentResponse} be an unordered map containing {hasNext}.
    - If {newPending} is not empty:
      - Set the corresponding entry on {subsequentResponse} to
        {PendingSourcesToResults(newPending)}.
    - If {incrementalResults} is not empty:
      - Set the {incremental} entry on {subsequentResponse} to
        {incrementalResults}.
    - If {completedRecords} is not empty:
      - Set the corresponding entry on {subsequentResponse} to
        {CompletedRecordsToResults(completedRecords)}.
    - Yield {subsequentResponse}.
    - If {pendingSubsequentResults} is empty:
      - Set {allResultsCompleted} to {true}.
      - Return.
    - If {completedSubsequentResults} is empty:
      - Wait until additional event(s) are pushed to the queue.

- Set up the event handler and the iterator as follows:

  - For each event of pushed to {eventQueue} of type {eventType} described by
    {eventDetails}, in order of its entry into the queue:
    - Remove the event from the queue.
    - Call {HandleExecutionEvent(eventType, eventDetails)}.
    - Wait for the next event or for {allResultsCompleted} to be set to {true}.
      - If {allResultsCompleted} is {true}, return.
  - In parallel, set {subsequentResults} on {incrementalPublisher} to the result
    of lazily executing {YieldSubsequentResults()}.

- Return {incrementalPublisher}.

The below sub-procedures are used by {CreateIncrementalPublisher()} and its
sub-procedures, but are listed separately as they do not modify the Incremental
Publisher's internal state:

PendingSourcesToResults(pendingSources):

- Initialize {pendingResults} to an empty list.
- For each {pendingSource} in {pendingSources}:
  - Let {path} and {label} be the corresponding entries on {pendingSource}.
  - Let {pendingResult} be an unordered map containing {path} and {label}.
  - Append {pendingResult} to {pendingResults}.
- Return {pendingResults}.

GetChildren(subsequentResultMap, id):

- Let {children} be the empty set.
- If {deferredGroupedFieldSetMap} contains an entry for {id}:
  - Let {deferredGroupedFieldSet} be that entry.
  - Let {deferredFragments} be the corresponding entry on
    {deferredGroupedFieldSet}.
  - For each {deferredFragment} in {deferredFragments}:
    - Let {id} be the corresponding entry on {deferredFragment}.
    - Let {resultChildren} be the entry in {subsequentResultMap} for {id}.
    - For each {child} in {resultChildren}:
      - Add {child} to {children}.
- Otherwise:
  - Let {resultChildren} be the entry in {subsequentResultMap} for {id}.
  - For each {child} in {resultChildren}:
    - Add {child} to {children}.
- Return {children}

GetDescendants(children, descendants):

- If {descendants} is not provided, let it be the empty set.
- For each {child} in {children}:
  - Add {child} to {descendants}.
  - Let {grandchildren} be the value for {children} on {child}.
  - Call {GetDescendants(grandchildren, descendants)}.
- Return {descendants}.

NullsSubsequentResultRecord(subsequentResult, nullPath):

- If {subsequentResult} is a Stream Items Record:
  - Let {incrementalDataRecords} be a list containing {subsequentResult}.
- Otherwise:
  - Let {incrementalDataRecords} be the value corresponding the entry for
    {deferredGroupedFieldSets} on {subsequentResult}.
- Let {matched} equal {false}.
- For each {incrementalDataRecord} in {incrementalDataRecords}:
  - Let {path} be the corresponding entry on {incrementalDataRecord}.
  - If {MatchesPath(path, nullPath)} is {true}:
    - Set {matched} equal to {true}.
    - Optionally, cancel any incomplete work in the execution of
      {incrementalDataRecord}.
- Return {matched}.

MatchesPath(testPath, basePath):

- Initialize {index} to zero.
- While {index} is less then the length of {basePath}:
  - Initialize {basePathItem} to the element at {index} in {basePath}.
  - Initialize {testPathItem} to the element at {index} in {testPath}.
  - If {basePathItem} is not equivalent to {testPathItem}:
    - Return {true}.
  - Increment {index} by one.
  - Return {false}.

CompletedRecordsToResults(records):

- Initialize {completedResults} to an empty list.
- For each {record} in {records}:
  - Let {path}, {label}, and {errors} be the corresponding entries on {record}.
  - Let {completedResult} be an unordered map containing {path} and {label}.
  - If {errors} is not empty, set the corresponding entry on {completedResult}
    to {errors}.
  - Append {completedResult} to {completedResults}.
- Return {completedResults}.

## Executing the Root Selection Set

To execute the root selection set, the object value being evaluated and the
object type need to be known, as well as whether it must be executed serially,
or may be executed in parallel.

Executing the root selection set works similarly for queries (parallel),
mutations (serial), and subscriptions (where it is executed for each event in
the underlying Source Stream).

First, the selection set is turned into a grouped field set; then, we execute
this grouped field set and return the resulting {data} and {errors}.

ExecuteRootSelectionSet(variableValues, initialValue, objectType, selectionSet,
serial):

- Let {fieldsByTarget}, {targetsByKey}, and {newDeferUsages} be the result of
  calling {AnalyzeSelectionSet(objectType, selectionSet, variableValues)}.
- Let {groupedFieldSet} and {groupDetailsMap} be the result of calling
  {BuildGroupedFieldSets(fieldsByTarget, targetsByKey)}.
- Let {incrementalPublisher} be the result of {CreateIncrementalPublisher()}.
- Let {initialResultRecord} be a new Initial Result Record.
- Let {newDeferMap} be the result of {AddNewDeferFragments(incrementalPublisher,
  newDeferUsages, initialResultRecord)}.
- Let {detailsList} be the result of
  {AddNewDeferredGroupedFieldSets(incrementalPublisher, groupDetailsMap,
  newDeferMap)}.
- Let {data} be the result of running {ExecuteGroupedFieldSet(groupedFieldSet,
  queryType, initialValue, variableValues, incrementalPublisher,
  initialResultRecord)} _serially_ if {serial} is {true}, _normally_ (allowing
  parallelization) otherwise.
- In parallel, call {ExecuteDeferredGroupedFieldSets(queryType, initialValues,
  variableValues, incrementalPublisher, detailsList, newDeferMap)}.
- Let {id} be the corresponding entry on {initialResultRecord}.
- Let {errors} be the list of all _field error_ raised while executing the
  {groupedFieldSet}.
- Initialize {initialResult} to an empty unordered map.
- If {errors} is not empty:
  - Set the corresponding entry on {initialResult} to {errors}.
- Set {data} on {initialResult} to {data}.
- Let {eventQueue} and {pending} be the corresponding entries on
  {incrementalPublisher}.
- Enqueue a Completed Initial Result Event on {eventQueue} with {id}.
- Wait for {pending} to be set.
- If {pending} is empty, return {initialResult}.
- Let {hasNext} be {true}.
- Set the corresponding entries on {initialResult} to {pending} and {hasNext}.
- Let {subsequentResults} be the corresponding entry on {incrementalPublisher}.
- Return {initialResult} and {subsequentResults}.

AddNewDeferFragments(incrementalPublisher, newDeferUsages,
incrementalDataRecord, deferMap, path):

- Initialize {newDeferredGroupedFieldSets} to an empty list.
- If {newDeferUsages} is empty:
  - Let {newDeferMap} be {deferMap}.
- Otherwise:
  - Let {newDeferMap} be a new empty unordered map of Defer Usage records to
    Deferred Fragment records.
  - For each {deferUsage} and {deferredFragment} in {deferMap}.
    - Set the entry for {deferUsage} in {newDeferMap} to {deferredFragment}.
- Let {eventQueue} be the corresponding entry on {incrementalPublisher}.
- For each {deferUsage} in {newDeferUsages}:
  - Let {label} be the corresponding entry on {deferUsage}.
  - Let {parent} be (GetParent(deferUsage, deferMap, incrementalDataRecord)).
  - Let {parentId} be the entry for {id} on {parent}.
  - Let {deferredFragment} be a new Deferred Fragment Record.
  - Let {id} be the corresponding entry on {deferredFragment}.
  - Enqueue a New Deferred Fragment Event on {eventQueue} with details {label},
    {path}, and {parentId}.
  - Set the entry for {deferUsage} in {newDeferMap} to {deferredFragment}.
  - Return {newDeferMap}.

GetParent(deferUsage, deferMap, incrementalDataRecord):

- Let {ancestors} be the corresponding entry on {deferUsage}.
- Let {parentDeferUsage} be the first member of {ancestors}.
- If {parentDeferUsage} is not defined, return {incrementalDataRecord}.
- Let {parent} be the corresponding entry in {deferMap} for {parentDeferUsage}.
- Return {parent}.

AddNewDeferredGroupedFieldSets(incrementalPublisher, groupDetailsMap, deferMap,
path):

- Initialize {detailsList} to an empty list.
- For each {deferUsageSet} and {details} in {groupDetailsMap}:
  - Let {groupedFieldSet} and {shouldInitiateDefer} be the corresponding entries
    on {details}.
  - Let {deferredGroupedFieldSetRecord} be a new Deferred Grouped Field Set
    Record.
  - Initialize {recordDetails} to an empty unordered map.
  - Set the corresponding entries on {recordDetails} to
    {deferredGroupedFieldSetRecord}, {groupedFieldSet}, and
    {shouldInitiateDefer}.
  - Let {deferredFragments} be the result of
    {GetDeferredFragments(deferUsageSet, newDeferMap)}.
  - Let {fragmentIds} be an empty list.
  - For each {deferredFragment} in {deferredFragments}:
    - Let {id} be the corresponding entry on {deferredFragment}.
    - Append {id} to {fragmentIds}.
  - Let {id} be the corresponding entry on {deferredGroupedFieldSetRecord}.
  - Let {eventQueue} be the corresponding entry on {incrementalPublisher}.
  - Enqueue a New Deferred Grouped Field Set Event on {eventQueue} with details
    {id}, {path}, and {fragmentIds}.
  - Append {recordDetails} to {detailsList}.
- Return {detailsList}.

GetDeferredFragments(deferUsageSet, deferMap):

- Let {deferredFragments} be an empty list of Deferred Fragment records.
- For each {deferUsage} in {deferUsageSet}:
  - Let {deferredFragment} be the entry for {deferUsage} in {deferMap}.
  - Append {deferredFragment} to {deferredFragments}.
- Return {deferredFragments}.

## Executing a Grouped Field Set

To execute a grouped field set, the object value being evaluated and the object
type need to be known, as well as whether it must be executed serially, or may
be executed in parallel.

ExecuteGroupedFieldSet(groupedFieldSet, objectType, objectValue, variableValues,
path, deferMap, incrementalPublisher, incrementalDataRecord):

- If {path} is not provided, initialize it to an empty list.
- Initialize {resultMap} to an empty ordered map.
- For each {groupedFieldSet} as {responseKey} and {fieldGroup}:
  - Let {fieldDetails} be the first entry in {fieldGroup}.
  - Let {node} be the corresponding entry on {fieldDetails}.
  - Let {fieldName} be the name of {node}. Note: This value is unaffected if an
    alias is used.
  - Let {fieldType} be the return type defined for the field {fieldName} of
    {objectType}.
  - If {fieldType} is defined:
    - Let {responseValue} be {ExecuteField(objectType, objectValue, fieldType,
      fieldGroup, variableValues, path, incrementalPublisher,
      incrementalDataRecord)}.
    - Set {responseValue} as the value for {responseKey} in {resultMap}.
- Return {resultMap}.

Note: {resultMap} is ordered by which fields appear first in the operation. This
is explained in greater detail in the Selection Set Analysis section below.

**Errors and Non-Null Fields**

If during {ExecuteGroupedFieldSet()} a field with a non-null {fieldType} raises
a _field error_ then that error must propagate to this entire grouped field set,
either resolving to {null} if allowed or further propagated to a parent field.

If this occurs, any sibling fields which have not yet executed or have not yet
yielded a value may be cancelled to avoid unnecessary work.

All raised field errors should also be enqueued as Field Error Events including
the {id} of the originating Incremental Data Record and the path to the final
propagated {null}.

Additionally, unpublished Subsequent Result records must be filtered if their
path points to a location that has resolved to {null} due to propagation of a
field error. If these subsequent results have not yet executed or have not yet
yielded a value they may also be cancelled to avoid unnecessary work.

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

Note: See [Handling Field Errors](#sec-Handling-Field-Errors) for more about
this behavior.

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
{ExecuteDeferredGroupedFieldSets} and {ExecuteStreamField}.

### Selection Set Analysis

Before execution, the selection set is converted to a grouped field set by
calling {AnalyzeSelectionSet()} and {BuildGroupedFieldSets()}. Each entry in the
grouped field set is a Field Group record describing all fields that share a
response key (the alias if defined, otherwise the field name). This ensures all
fields with the same response key (including those in referenced fragments) are
executed at the same time.

As an example, analysis of the fields of this selection set would return two
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

The depth-first-search order of the field groups produced by selection set
processing is maintained through execution, ensuring that fields appear in the
executed response in a stable and predictable order.

{AnalyzeSelectionSet()} also returns a list of references to any new deferred
fragments encountered the selection set. {BuildGroupedFieldSets()} also
potentially returns additional deferred grouped field sets related to new or
previously encountered deferred fragments. Additional grouped field sets are
constructed carefully so as to ensure that each field is executed exactly once
and so that fields are grouped according to the set of deferred fragments that
include them.

Information derived from the presence of a `@defer` directive on a fragment is
returned as a Defer Usage record, unique to the label, a structure containing:

- {label}: value of the corresponding argument to the `@defer` directive.
- {ancestors}: a list, where the first entry is the parent Defer Usage record
  corresponding to the deferred fragment enclosing this deferred fragment and
  the remaining entries are the values included within the {ancestors} entry of
  that parent Defer Usage record, or, if this Defer Usage record is deferred
  directly by the initial result, a list containing the single value
  {undefined}.

A Field Group record is a structure containing:

- {fields}: a list of Field Details records for each encountered field.
- {targets}: the set of Defer Usage records corresponding to the deferred
  fragments enclosing this field, as well as possibly the value {undefined} if
  the field is included within the initial response.

A Field Details record is a structure containing:

- {node}: the field node itself.
- {target}: the Defer Usage record corresponding to the deferred fragment
  enclosing this field or the value {undefined} if the field was not deferred.

Information about additional deferred grouped field sets are returned as a list
of Grouped Field Set Details structures containing:

- {groupedFieldSet}: the grouped field set itself.
- {shouldInitiateDefer}: a boolean value indicating whether the executor should
  defer execution of {groupedFieldSet}.

Deferred grouped field sets do not always require initiating deferral. For
example, when a parent field is deferred by multiple fragments, deferral is
initiated on the parent field. New grouped field sets for child fields will be
created if the child fields are not all present in all of the deferred
fragments, but these new grouped field sets, while representing deferred fields,
do not require additional deferral.

AnalyzeSelectionSet(objectType, selectionSet, variableValues, visitedFragments,
parentTarget, newTarget):

- If {visitedFragments} is not defined, initialize it to the empty set.
- Initialize {targetsByKey} to an empty unordered map of sets.
- Initialize {fieldsByTarget} to an empty unordered map of ordered maps.
- Initialize {newDeferUsages} to an empty list of Defer Usage records.
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
    - Let {target} be {newTarget} if {newTarget} is defined; otherwise, let
      {target} be {parentTarget}.
    - Let {targetsForKey} be the list in {targetsByKey} for {responseKey}; if no
      such list exists, create it as an empty set.
    - Add {target} to {targetsForKey}.
    - Let {fieldsForTarget} be the map in {fieldsByTarget} for {responseKey}; if
      no such map exists, create it as an unordered map.
    - Let {groupForResponseKey} be the list in {fieldsForTarget} for
      {responseKey}; if no such list exists, create it as an empty list.
    - Append {selection} to the {groupForResponseKey}.
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
    - If {deferDirective} is defined:
      - Let {label} be the value or the variable to {deferDirective}'s {label}
        argument.
      - Let {ancestors} be an empty list.
      - Append {parentTarget} to {ancestors}.
      - If {parentTarget} is defined:
        - Let {parentAncestors} be the {ancestor} entry on {parentTarget}.
        - Append all items in {parentAncestors} to {ancestors}.
      - Let {target} be a new Defer Usage record created from {label} and
        {ancestors}.
      - Append {target} to {newDeferUsages}.
    - Otherwise:
      - Let {target} be {newTarget}.
    - Let {fragmentTargetsByKey}, {fragmentFieldsByTarget},
      {fragmentNewDeferUsages} be the result of calling
      {AnalyzeSelectionSet(objectType, fragmentSelectionSet, variableValues,
      visitedFragments, parentTarget, target)}.
    - For each {target} and {fragmentMap} in {fragmentFieldsByTarget}:
      - Let {mapForTarget} be the ordered map in {fieldsByTarget} for {target};
        if no such map exists, create it as an empty ordered map.
      - For each {responseKey} and {fragmentList} in {fragmentMap}:
        - Let {listForResponseKey} be the list in {fieldsByTarget} for
          {responseKey}; if no such list exists, create it as an empty list.
        - Append all items in {fragmentList} to {listForResponseKey}.
    - For each {responseKey} and {targetSet} in {fragmentTargetsByKey}:
      - Let {setForResponseKey} be the set in {targetsByKey} for {responseKey};
        if no such set exists, create it as the empty set.
      - Add all items in {targetSet} to {setForResponseKey}.
    - Append all items in {fragmentNewDeferUsages} to {newDeferUsages}.
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
    - If {deferDirective} is defined:
      - Let {label} be the value or the variable to {deferDirective}'s {label}
        argument.
      - Let {ancestors} be an empty list.
      - Append {parentTarget} to {ancestors}.
      - If {parentTarget} is defined:
        - Let {parentAncestors} be {ancestor} on {parentTarget}.
        - Append all items in {parentAncestors} to {ancestors}.
      - Let {target} be a new Defer Usage record created from {label} and
        {ancestors}.
      - Append {target} to {newDeferUsages}.
    - Otherwise:
      - Let {target} be {newTarget}.
    - Let {fragmentTargetsByKey}, {fragmentFieldsByTarget},
      {fragmentNewDeferUsages} be the result of calling
      {AnalyzeSelectionSet(objectType, fragmentSelectionSet, variableValues,
      visitedFragments, parentTarget, target)}.
    - For each {target} and {fragmentMap} in {fragmentFieldsByTarget}:
      - Let {mapForTarget} be the ordered map in {fieldsByTarget} for {target};
        if no such map exists, create it as an empty ordered map.
      - For each {responseKey} and {fragmentList} in {fragmentMap}:
        - Let {listForResponseKey} be the list in {fieldsByTarget} for
          {responseKey}; if no such list exists, create it as an empty list.
        - Append all items in {fragmentList} to {listForResponseKey}.
    - For each {responseKey} and {targetSet} in {fragmentTargetsByKey}:
      - Let {setForResponseKey} be the set in {targetsByKey} for {responseKey};
        if no such set exists, create it as the empty set.
      - Add all items in {targetSet} to {setForResponseKey}.
    - Append all items in {fragmentNewDeferUsages} to {newDeferUsages}.
- Return {fieldsByTarget}, {targetsByKey}, and {newDeferUsages}.

Note: The steps in {AnalyzeSelectionSet()} evaluating the `@skip` and `@include`
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

BuildGroupedFieldSets(fieldsByTarget, targetsByKey, parentTargets)

- If {parentTargets} is not provided, initialize it to a set containing the
  value {undefined}.
- Let {keysWithParentTargets} and {targetSetDetailsMap} be the result of
  {GetTargetSetDetails(targetsByKey, parentTargets)}.
- Initialize {remainingFieldsByTarget} to an empty unordered map of ordered
  maps.
  - For each {target} and {fieldsForTarget} in {fieldsByTarget}:
    - Initialize {remainingFieldsForTarget} to an empty ordered map.
    - For each {responseKey} and {fieldList} in {fieldsForTarget}:
      - Set {responseKey} on {remainingFieldsForTarget} to {fieldList}.
- Initialize {groupedFieldSet} to an empty ordered map.
- If {keysWithParentTargets} is not empty:
  - Let {orderedResponseKeys} be the result of
    {GetOrderedResponseKeys(parentTargets, remainingFieldsByTarget)}.
  - For each {responseKey} in {orderedResponseKeys}:
    - If {keysWithParentTargets} does not contain {responseKey}, continue to the
      next member of {orderedResponseKeys}.
    - Let {fieldGroup} be the Field Group record in {groupedFieldSet} for
      {responseKey}; if no such record exists, create a new such record from the
      empty list {fields} and the set of {parentTargets}.
    - Let {targets} be the entry in {targetsByKeys} for {responseKey}.
    - For each {target} in {targets}:
      - Let {remainingFieldsForTarget} be the entry in {remainingFieldsByTarget}
        for {target}.
      - Let {nodes} be the list in {remainingFieldsByTarget} for {responseKey}.
      - Remove the entry for {responseKey} from {remainingFieldsByTarget}.
      - For each {node} of {nodes}:
        - Let {fieldDetails} be a new Field Details record created from {node}
          and {target}.
        - Append {fieldDetails} to the {fields} entry on {fieldGroup}.
- Initialize {groupDetailsMap} to an empty unordered map.
- For each {maskingTargets} and {targetSetDetails} in {targetSetDetailsMap}:
  - Initialize {newGroupedFieldSet} to an empty ordered map.
  - Let {keys} be the corresponding entry on {targetSetDetails}.
  - Let {orderedResponseKeys} be the result of
    {GetOrderedResponseKeys(maskingTargets, remainingFieldsByTarget)}.
  - For each {responseKey} in {orderedResponseKeys}:
    - If {keys} does not contain {responseKey}, continue to the next member of
      {orderedResponseKeys}.
    - Let {fieldGroup} be the Field Group record in {newGroupedFieldSet} for
      {responseKey}; if no such record exists, create a new such record from the
      empty list {fields} and the set of {parentTargets}.
    - Let {targets} be the entry in {targetsByKeys} for {responseKey}.
    - For each {target} in {targets}:
      - Let {remainingFieldsForTarget} be the entry in {remainingFieldsByTarget}
        for {target}.
      - Let {nodes} be the list in {remainingFieldsByTarget} for {responseKey}.
      - Remove the entry for {responseKey} from {remainingFieldsByTarget}.
      - For each {node} of {nodes}:
        - Let {fieldDetails} be a new Field Details record created from {node}
          and {target}.
        - Append {fieldDetails} to the {fields} entry on {fieldGroup}.
  - Let {shouldInitiateDefer} be the corresponding entry on {targetSetDetails}.
  - Initialize {details} to an empty unordered map.
  - Set the entry for {groupedFieldSet} in {details} to {newGroupedFieldSet}.
  - Set the corresponding entry in {details} to {shouldInitiateDefer}.
  - Set the entry for {maskingTargets} in {groupDetailsMap} to {details}.
- Return {groupedFieldSet} and {groupDetailsMap}.

Note: entries are always added to Grouped Field Set records in the order in
which they appear for the first target. Field order for deferred grouped field
sets never alters the field order for the parent.

GetOrderedResponseKeys(targets, fieldsByTarget):

- Let {firstTarget} be the first entry in {targets}.
- Assert that {firstTarget} is defined.
- Let {firstFields} be the entry for {firstTarget} in {fieldsByTarget}.
- Assert that {firstFields} is defined.
- Let {responseKeys} be the keys of {firstFields}.
- Return {responseKeys}.

GetTargetSetDetails(targetsByKey, parentTargets):

- Initialize {keysWithParentTargets} to the empty set.
- Initialize {targetSetDetailsMap} to an empty unordered map.
- For each {responseKey} and {targets} in {targetsByKey}:
  - Initialize {maskingTargets} to an empty set.
  - For each {target} in {targets}:
    - If {target} is not defined:
      - Add {target} to {maskingTargets}.
      - Continue to the next entry in {targets}.
    - Let {ancestors} be the corresponding entry on {target}.
    - For each {ancestor} of {ancestors}:
      - If {targets} contains {ancestor}, continue to the next member of
        {targets}.
    - Add {target} to {maskingTargets}.
  - If {IsSameSet(maskingTargets, parentTargets)} is {true}:
    - Append {responseKey} to {keysWithParentTargets}.
    - Continue to the next entry in {targetsByKey}.
  - For each {key} in {targetSetDetailsMap}:
    - If {IsSameSet(maskingTargets, key)} is {true}, let {targetSetDetails} be
      the map in {targetSetDetailsMap} for {maskingTargets}.
  - If {targetSetDetails} is defined:
    - Let {keys} be the corresponding entry on {targetSetDetails}.
    - Add {responseKey} to {keys}.
  - Otherwise:
    - Initialize {keys} to the empty set.
    - Add {responseKey} to {keys}.
    - Let {shouldInitiateDefer} be {false}.
    - For each {target} in {maskingTargets}:
      - If {parentTargets} does not contain {target}:
        - Set {shouldInitiateDefer} equal to {true}.
    - Create {newTargetSetDetails} as an map containing {keys} and
      {shouldInitiateDefer}.
    - Set the entry in {targetSetDetailsMap} for {maskingTargets} to
      {newTargetSetDetails}.
- Return {keysWithParentTargets} and {targetSetDetailsMap}.

IsSameSet(setA, setB):

- If the size of setA is not equal to the size of setB:
  - Return {false}.
- For each {item} in {setA}:
  - If {setB} does not contain {item}:
    - Return {false}.
- Return {true}.

## Executing Deferred Grouped Field Sets

ExecuteDeferredGroupedFieldSets(objectType, objectValue, variableValues,
incrementalPublisher, path, detailsList, deferMap)

- For each {recordDetails} in {detailsList}, allowing for parallelization:
  - Let {deferredGroupedFieldSetRecord}, {groupedFieldSet}, and
    {shouldInitiateDefer} be the corresponding entries on {recordDetails}.
  - If {shouldInitiateDefer} is {true}:
    - Initiate implementation specific deferral of further execution, resuming
      execution as defined.
  - Let {data} be the result of calling {ExecuteGroupedFieldSet(groupedFieldSet,
    objectType, objectValue, variableValues, path, deferMap,
    incrementalPublisher, deferredGroupedFieldSet)}.
  - Let {eventQueue} be the corresponding entry on {incrementalPublisher}.
  - Let {id} be the corresponding entry on {deferredGroupedFieldSetRecord}.
  - If _field error_ were raised, causing a {null} to be propagated to {data}:
    - Let {incrementalErrors} be the list of such field errors.
    - Enqueue an Errored Deferred Grouped Field Set event with details {id} and
      {incrementalErrors}.
  - Otherwise:
    - Let {errors} be the list of all _field error_ raised while executing the
      {groupedFieldSet}.
    - Enqueue a Completed Deferred Grouped Field Set event with details {id},
      {data}, and {errors}.

## Executing Fields

Each field requested in the grouped field set that is defined on the selected
objectType will result in an entry in the response map. Field execution first
coerces any provided argument values, then resolves a value for the field, and
finally completes that value either by recursively executing another selection
set or coercing a scalar value.

ExecuteField(objectType, objectValue, fieldType, fieldGroup, variableValues,
path, deferMap, incrementalPublisher, incrementalDataRecord):

- Let {fieldDetails} be the first entry in {fieldGroup}.
- Let {node} be the corresponding entry on {fieldDetails}.
- Let {fieldName} be the field name of {node}.
- Append {fieldName} to {path}.
- Let {argumentValues} be the result of {CoerceArgumentValues(objectType, field,
  variableValues)}
- Let {resolvedValue} be {ResolveFieldValue(objectType, objectValue, fieldName,
  argumentValues)}.
- Return the result of {CompleteValue(fieldType, fields, resolvedValue,
  variableValues, path, deferMap, incrementalPublisher, incrementalDataRecord)}.

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

#### Execute Stream Field

ExecuteStreamField(stream, path, iterator, fieldGroup, index, innerType,
variableValues, incrementalPublisher, parentIncrementalDataRecord):

- Let {incrementalErrors} be an empty list of _field error_ for the entire
  stream, including all _field error_ bubbling up to {path}.
- Let {currentIndex} be {index}.
- Let {currentParent} be {parentIncrementalDataRecord}.
- Let {errored} be {false}.
- Let {eventQueue} be the corresponding entry on {incrementalPublisher}.
- Let {streamFieldGroup} be the result of {GetStreamFieldGroup(fieldGroup)}.
- Repeat the following steps:
  - Let {itemPath} be {path} with {currentIndex} appended.
  - Let {streamItems} be a new Stream Items Record.
  - Let {id} be the corresponding entry on {streamItems}.
  - Let {parentIds} be an empty list.
  - If {currentParent} is a Deferred Grouped Field Set Record.
    - Let {deferredFragments} be the corresponding entry on {currentParent}.
    - For each {deferredFragment} in {deferredFragments}:
      - Let {fragmentId} be the entry for {id} on {deferredFragments}.
      - Append {fragmentId} to {parentIds}.
  - Otherwise:
    - Let {id} be the corresponding entry on {currentParent}.
    - Append {id} to {parentIds}.
  - Let {streamId} be the entry for {id} on {stream}.
  - Enqueue a New Stream Items Event on {eventQueue} with details {id},
    {streamId}, and {parentIds}.
  - Wait for the next item from {result} via the {iterator}.
  - If {errored} is {true}:
    - Return.
  - If an item is not retrieved because of an error:
    - Let {error} be that error.
    - Initialize {incrementalErrors} to a list containing {error}.
    - Enqueue an Errored Stream Items Event on {eventQueue} with details {id}
      and {incrementalErrors}.
    - Return.
  - If an item is not retrieved because {iterator} has completed:
    - Let {id} be the corresponding entry on {streamItems}
    - Enqueue a Completed Empty Stream Items Event on {eventQueue} with details
      {id}.
    - Return.
  - Let {item} be the item retrieved from {iterator}.
  - Let {newDeferMap} be an empty unordered map.
  - Let {data} be the result of calling {CompleteValue(innerType,
    streamedFieldGroup, item, variableValues, itemPath, newDeferMap,
    incrementalPublisher, currentParent)}.
  - If a field error was raised, causing a {null} to be propagated to {data} and
    {innerType} is a Non-Nullable type, let {incrementalErrors} be the list of
    those errors:
    - Set {errored} to {true}.
    - Let {id} be the corresponding entry on {streamItems}
    - Enqueue an Errored Stream Items Event on {eventQueue} with details {id}
      and {incrementalErrors}.
    - Return.
  - Let {errors} be the list of all _field error_ raised while completing this
    item.
  - Initialize {items} to an list containing the single item {data}.
  - Let {id} be the corresponding entry on {streamItems}
  - Enqueue a Completed Stream Items Event on {eventQueue} with details {id},
    {items}, and {errors}.
  - Increment {currentIndex}.
  - Set {currentParent} to {streamItems}.
  - Increment {index}.

CompleteValue(fieldType, fieldGroup, result, variableValues, path, deferMap,
incrementalPublisher, incrementalDataRecord):

- If the {fieldType} is a Non-Null type:
  - Let {innerType} be the inner type of {fieldType}.
  - Let {completedResult} be the result of calling {CompleteValue(innerType,
    fieldGroup, result, variableValues, path)}.
  - If {completedResult} is {null}, raise a _field error_.
  - Return {completedResult}.
- If {result} is {null} (or another internal value similar to {null} such as
  {undefined}), return {null}.
- If {fieldType} is a List type:
  - If {result} is not a collection of values, raise a _field error_.
  - Let {field} be the first entry in {fields}.
  - Let {innerType} be the inner type of {fieldType}.
  - If {field} provides the directive `@stream` and its {if} argument is not
    {false} and is not a variable in {variableValues} with the value {false} and
    {innerType} is the outermost return type of the list type defined for
    {field}:
    - Let {streamDirective} be that directive.
    - If this execution is for a subscription operation, raise a _field error_.
    - Let {initialCount} be the value or variable provided to
      {streamDirective}'s {initialCount} argument.
    - If {initialCount} is less than zero, raise a _field error_.
    - Let {label} be the value or variable provided to {streamDirective}'s
      {label} argument.
  - Let {iterator} be an iterator for {result}.
  - Let {items} be an empty list.
  - Let {index} be zero.
  - Let {eventQueue} be the corresponding entry on {incrementalPublisher}.
  - While {result} is not closed:
    - If {streamDirective} is defined and {index} is greater than or equal to
      {initialCount}:
      - Let {stream} be a new Stream Record.
      - Let {id} be the corresponding entry on {stream}.
      - Let {earlyReturn} be the implementation-specific value denoting how to
        notify {iterator} that no additional items will be requested.
      - Enqueue a New Stream Event on {eventQueue} with details {id}, {label},
        {path}, and {earlyReturn}.
      - Call {ExecuteStreamField(stream, path, iterator, fieldGroup, index,
        innerType, variableValues, incrementalPublisher,
        incrementalDataRecord)}.
      - Return {items}.
    - Otherwise:
      - Wait for the next item from {result} via the {iterator}.
      - If an item is not retrieved because of an error, raise a _field error_.
      - Let {resultItem} be the item retrieved from {result}.
      - Let {itemPath} be {path} with {index} appended.
      - Let {resolvedItem} be the result of calling {CompleteValue(innerType,
        fields, resultItem, variableValues, itemPath, deferMap,
        incrementalPublisher, incrementalDataRecord)}.
      - Append {resolvedItem} to {items}.
      - Increment {index}.
  - Return {items}.
- If {fieldType} is a Scalar or Enum type:
  - Return the result of {CoerceResult(fieldType, result)}.
- If {fieldType} is an Object, Interface, or Union type:
  - If {fieldType} is an Object type.
    - Let {objectType} be {fieldType}.
  - Otherwise if {fieldType} is an Interface or Union type.
    - Let {objectType} be {ResolveAbstractType(fieldType, result)}.
  - Let {groupedFieldSet}, {groupDetailsMap}, and {deferUsages} be the result of
    {ProcessSubSelectionSets(objectType, fieldGroup, variableValues)}.
  - Let {newDeferMap} be the result of
    {AddNewDeferFragments(incrementalPublisher, newDeferUsages,
    incrementalDataRecord, deferMap, path)}.
  - Let {detailsList} be the result of
    {AddNewDeferredGroupedFieldSets(incrementalPublisher, groupDetailsMap,
    newDeferMap, path)}.
  - Let {completed} be the result of evaluating
    {ExecuteGroupedFieldSet(groupedFieldSet, objectType, result, variableValues,
    path, newDeferMap, incrementalPublisher, incrementalDataRecord)} _normally_
    (allowing for parallelization).
  - In parallel, call {ExecuteDeferredGroupedFieldSets(objectType, result,
    variableValues, incrementalPublisher, detailsList, newDeferMap)}.
  - Return {completed}.

ProcessSubSelectionSets(objectType, fieldGroup, variableValues):

- Initialize {targetsByKey} to an empty unordered map of sets.
- Initialize {fieldsByTarget} to an empty unordered map of ordered maps.
- Initialize {newDeferUsages} to an empty list.
- Let {fields} and {targets} be the corresponding entries on {fieldGroup}.
- For each {fieldDetails} within {fields}:
  - Let {node} and {target} be the corresponding entries on {fieldDetails}.
  - Let {fieldSelectionSet} be the selection set of {fieldNode}.
  - If {fieldSelectionSet} is null or empty, continue to the next field.
  - Let {subfieldsFieldsByTarget}, {subfieldTargetsByKey}, and
    {subfieldNewDeferUsages} be the result of calling
    {AnalyzeSelectionSet(objectType, fieldSelectionSet, variableValues,
    visitedFragments, target)}.
    - For each {target} and {subfieldMap} in {subfieldFieldsByTarget}:
      - Let {mapForTarget} be the ordered map in {fieldsByTarget} for {target};
        if no such map exists, create it as an empty ordered map.
      - For each {responseKey} and {subfieldList} in {subfieldMap}:
        - Let {listForResponseKey} be the list in {fieldsByTarget} for
          {responseKey}; if no such list exists, create it as an empty list.
        - Append all items in {subfieldList} to {listForResponseKey}.
    - For each {responseKey} and {targetSet} in {subfieldTargetsByKey}:
      - Let {setForResponseKey} be the set in {targetsByKey} for {responseKey};
        if no such set exists, create it as the empty set.
      - Add all items in {targetSet} to {setForResponseKey}.
    - Append all items in {subfieldNewDeferUsages} to {newDeferUsages}.
- Let {parentTargets} be the corresponding entry on {fieldGroup}.
- Let {groupedFieldSet} and {newGroupedFieldSetDetails} be the result of calling
  {BuildGroupedFieldSets(fieldsByTarget, targetsByKey, parentTargets)}.
- Return {groupedFieldSet}, {newGroupedFieldSetDetails}, and {newDeferUsages}.

GetStreamFieldGroup(fieldGroup):

- Let {streamFields} be an empty list.
- Let {fields} be the corresponding entry on {fieldGroup}.
- For each {fieldDetails} in {fields}:
  - Let {node} be the corresponding entry on {fieldDetails}.
  - Let {newFieldDetails} be a new Field Details record created from {node} and
    {undefined}.
  - Append {newFieldDetails} to {streamFields}.
- Let {targets} be a set containing the value {undefined}.
- Let {streamFieldGroup} be a new Field Group record created from {streamFields}
  and {targets}.
- Return {streamFieldGroup}.

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
calling {ProcessSubSelectionSets()} so `firstName` and `lastName` can be
resolved for one value.

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

When a field error is raised inside `ExecuteDeferredGroupedFieldSets` or
`ExecuteStreamField`, the defer and stream payloads act as error boundaries.
That is, the null resulting from a `Non-Null` type cannot propagate outside of
the boundary of the defer or stream payload.

If a field error is raised while executing the selection set of a fragment with
the `defer` directive, causing a {null} to propagate to the object containing
this fragment, the {null} should not be sent to the client, as this will
overwrite existing data. In this case, the associated Defer Payload's
`completed` entry must include the causative errors, whose presence indicated
the failure of the payload to be included within the final reconcilable object.

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
  "pending": [
    { "path": ["birthday"], "label": "monthDefer" }
    { "path": ["birthday"], "label": "yearDefer" }
  ],
  "hasNext": true
}
```

Response 2, the defer payload for label "monthDefer" is completed with errors.
Incremental data cannot be sent, as this would overwrite previously sent values.

```json example
{
  "completed": [
    {
      "path": ["birthday"],
      "label": "monthDefer",
      "errors": [...]
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
      "data": { "year": "2022" }
    }
  ],
  "completed": [
    {
      "path": ["birthday"],
      "label": "yearDefer"
    }
  ],
  "hasNext": false
}
```

If the `stream` directive is present on a list field with a Non-Nullable inner
type, and a field error has caused a {null} to propagate to the list item, the
{null} similarly should not be sent to the client, as this will overwrite
existing data. In this case, the associated Stream's `completed` entry must
include the causative errors, whose presence indicated the failure of the stream
to complete successfully. For example, assume the `films` field is a `List` type
with an `Non-Null` inner type. In this case, the second list item raises a field
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
  "pending": [{ "path": ["films"] }],
  "hasNext": true
}
```

Response 2, the stream is completed with errors. Incremental data cannot be
sent, as this would overwrite previously sent values.

```json example
{
  "completed": [
    {
      "path": ["films"],
      "errors": [...],
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

Response 2, the first stream payload is sent; the stream is not completed. The
{items} entry has been set to a list containing {null}, as this {null} has only
propagated as high as the list item.

```json example
{
  "incremental": [
    {
      "path": ["films", 1],
      "items": [null],
      "errors": [...],
    }
  ],
  "hasNext": true
}
```

If all fields from the root of the request to the source of the field error
return `Non-Null` types, then the {"data"} entry in the response should be
{null}.
