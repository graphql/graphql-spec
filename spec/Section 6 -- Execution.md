# Execution

A GraphQL service generates a response from a request via execution.

:: A _request_ for execution consists of a few pieces of information:

- {schema}: The schema to use, typically solely provided by the GraphQL service.
- {document}: A {Document} which must contain GraphQL {OperationDefinition} and
  may contain {FragmentDefinition}.
- {operationName} (optional): The name of the Operation in the Document to
  execute.
- {variableValues} (optional): Values for any Variables defined by the
  Operation.
- {initialValue} (optional): An initial value corresponding to the root type
  being executed. Conceptually, an initial value represents the "universe" of
  data available via a GraphQL Service. It is common for a GraphQL Service to
  always use the same initial value for every request.
- {extensions} (optional): A map reserved for implementation-specific additional
  information.

Given this information, the result of {ExecuteRequest(schema, document,
operationName, variableValues, initialValue)} produces the response, to be
formatted according to the Response section below.

Implementations should not add additional properties to a _request_, which may
conflict with future editions of the GraphQL specification. Instead,
{extensions} provides a reserved location for implementation-specific additional
information. If present, {extensions} must be a map, but there are no additional
restrictions on its contents. To avoid conflicts, keys should use unique
prefixes.

Note: GraphQL requests do not require any specific serialization format or
transport mechanism. Message serialization and transport mechanisms should be
chosen by the implementing service.

Note: Descriptions and comments in executable documents (operation definitions,
fragment definitions, and variable definitions) MUST be ignored during execution
and have no effect on the observable execution, validation, or response of a
GraphQL document. Descriptions and comments on executable documents MAY be used
for non-observable purposes, such as logging and other developer tools.

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
need to be coerced using the input coercion rules of the variable's declared
type. If a _request error_ is encountered during input coercion of variable
values, then the operation fails without execution.

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
    - Let {coercedDefaultValue} be the result of coercing {defaultValue}
      according to the input coercion rules of {variableType}.
    - Add an entry to {coercedValues} named {variableName} with the value
      {coercedDefaultValue}.
  - Otherwise if {variableType} is a Non-Nullable type, and either {hasValue} is
    not {true} or {value} is {null}, raise a _request error_.
  - Otherwise if {hasValue} is {true}:
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
executing the operation’s _root selection set_ with the query root operation
type.

An initial value may be provided when executing a query operation.

ExecuteQuery(query, schema, variableValues, initialValue):

- Let {queryType} be the root Query type in {schema}.
- Assert: {queryType} is an Object type.
- Let {rootSelectionSet} be the _root selection set_ in {query}.
- Return {ExecuteRootSelectionSet(variableValues, initialValue, queryType,
  rootSelectionSet, "normal")}.

### Mutation

If the operation is a mutation, the result of the operation is the result of
executing the operation’s _root selection set_ on the mutation root object type.
This selection set should be executed serially.

It is expected that the top level fields in a mutation operation perform
side-effects on the underlying data system. Serial execution of the provided
mutations ensures against race conditions during these side-effects.

ExecuteMutation(mutation, schema, variableValues, initialValue):

- Let {mutationType} be the root Mutation type in {schema}.
- Assert: {mutationType} is an Object type.
- Let {rootSelectionSet} be the _root selection set_ in {mutation}.
- Return {ExecuteRootSelectionSet(variableValues, initialValue, mutationType,
  rootSelectionSet, "serial")}.

### Subscription

If the operation is a subscription, the result is an _event stream_ called the
_response stream_ where each event in the event stream is the result of
executing the operation for each new event on an underlying _source stream_.

Executing a subscription operation creates a persistent function on the service
that maps an underlying _source stream_ to a returned _response stream_.

Subscribe(subscription, schema, variableValues, initialValue):

- Let {sourceStream} be the result of running
  {CreateSourceEventStream(subscription, schema, variableValues, initialValue)}.
- Let {responseStream} be the result of running
  {MapSourceToResponseEvent(sourceStream, subscription, schema,
  variableValues)}.
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

:: An _event stream_ represents a sequence of events: discrete emitted values
over time which can be observed. As an example, a "Pub-Sub" system may produce
an _event stream_ when "subscribing to a topic", with an value emitted for each
"publish" to that topic.

An _event stream_ may complete at any point, often because no further events
will occur. An _event stream_ may emit an infinite sequence of values, in which
it may never complete. If an _event stream_ encounters an error, it must
complete with that error.

An observer may at any point decide to stop observing an _event stream_ by
cancelling it. When an _event stream_ is cancelled, it must complete.

Internal user code also may cancel an _event stream_ for any reason, which would
be observed as that _event stream_ completing.

**Supporting Subscriptions at Scale**

Query and mutation operations are stateless, allowing scaling via cloning of
GraphQL service instances. Subscriptions, by contrast, are stateful and require
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

:: A _source stream_ is an _event stream_ representing a sequence of root
values, each of which will trigger a GraphQL execution. Like field value
resolution, the logic to create a _source stream_ is application-specific.

CreateSourceEventStream(subscription, schema, variableValues, initialValue):

- Let {subscriptionType} be the root Subscription type in {schema}.
- Assert: {subscriptionType} is an Object type.
- Let {selectionSet} be the top level selection set in {subscription}.
- Let {collectedFieldsMap} and {newDeferUsages} be the result of
  {CollectFields(subscriptionType, selectionSet, variableValues)}.
- Assert: {newDeferUsages} is empty.
- If {collectedFieldsMap} does not have exactly one entry, raise a _request
  error_.
- Let {fields} be the value of the first entry in {collectedFieldsMap}.
- Let {fieldDetails} be the first entry in {fields}.
- Let {field} be the corresponding entry on {fieldDetails}.
- Let {fieldName} be the field name of {field}. Note: This value is unaffected
  if an alias is used.
- Let {argumentValues} be the result of {CoerceArgumentValues(subscriptionType,
  field, variableValues)}.
- Let {sourceStream} be the result of running
  {ResolveFieldEventStream(subscriptionType, initialValue, fieldName,
  argumentValues)}.
- Return {sourceStream}.

ResolveFieldEventStream(subscriptionType, rootValue, fieldName, argumentValues):

- Let {resolver} be the internal function provided by {subscriptionType} for
  determining the resolved _event stream_ of a subscription field named
  {fieldName}.
- Return the result of calling {resolver}, providing {rootValue} and
  {argumentValues}.

Note: This {ResolveFieldEventStream()} algorithm is intentionally similar to
{ResolveFieldValue()} to enable consistency when defining resolvers on any
operation type.

#### Response Stream

Each event from the underlying _source stream_ triggers execution of the
subscription _selection set_ using that event's value as the {initialValue}.

MapSourceToResponseEvent(sourceStream, subscription, schema, variableValues):

- Let {responseStream} be a new _event stream_.
- When {sourceStream} emits {sourceValue}:
  - Let {executionResult} be the result of running
    {ExecuteSubscriptionEvent(subscription, schema, variableValues,
    sourceValue)}.
  - If internal {error} was raised:
    - Cancel {sourceStream}.
    - Complete {responseStream} with {error}.
  - Otherwise emit {executionResult} on {responseStream}.
- When {sourceStream} completes normally:
  - Complete {responseStream} normally.
- When {sourceStream} completes with {error}:
  - Complete {responseStream} with {error}.
- When {responseStream} is cancelled:
  - Cancel {sourceStream}.
  - Complete {responseStream} normally.
- Return {responseStream}.

Note: Since {ExecuteSubscriptionEvent()} handles all _execution error_, and
_request error_ only occur during {CreateSourceEventStream()}, the only
remaining error condition handled from {ExecuteSubscriptionEvent()} are internal
exceptional errors not described by this specification.

ExecuteSubscriptionEvent(subscription, schema, variableValues, initialValue):

- Let {subscriptionType} be the root Subscription type in {schema}.
- Assert: {subscriptionType} is an Object type.
- Let {rootSelectionSet} be the _root selection set_ in {subscription}.
- Return {ExecuteRootSelectionSet(variableValues, initialValue,
  subscriptionType, rootSelectionSet, "normal")}.

Note: The {ExecuteSubscriptionEvent()} algorithm is intentionally similar to
{ExecuteQuery()} since this is how each event result is produced.

#### Unsubscribe

Unsubscribe cancels the _response stream_ when a client no longer wishes to
receive payloads for a subscription. This in turn also cancels the Source
Stream, which is a good opportunity to clean up any other resources used by the
subscription.

Unsubscribe(responseStream):

- Cancel {responseStream}.

## Executing Selection Sets

Executing a GraphQL operation recursively collects and executes every selected
field in the operation. First all initially selected fields from the operation's
top most _root selection set_ are collected, then each executed. As each field
completes, all its subfields are collected, then each executed. This process
continues until there are no more subfields to collect and execute.

### Executing the Root Selection Set

:: A _root selection set_ is the top level _selection set_ provided by a GraphQL
operation. A root selection set always selects from a _root operation type_.

To execute the root selection set, the initial value being evaluated and the
root type must be known, as well as whether the fields must be executed in a
series, or normally by executing all fields in parallel (see
[Normal and Serial Execution](#sec-Normal-and-Serial-Execution)).

Executing the root selection set works similarly for queries (parallel),
mutations (serial), and subscriptions (where it is executed for each event in
the underlying Source Stream).

First, the _selection set_ is collected into a _collected fields map_ which is
then executed, returning the resulting {data} and {errors}.

ExecuteRootSelectionSet(variableValues, initialValue, objectType, selectionSet,
executionMode):

- Let {collectedFieldsMap} and {newDeferUsages} be the result of
  {CollectFields(objectType, selectionSet, variableValues)}.
- Let {executionPlan} be the result of {BuildExecutionPlan(collectedFieldsMap)}.
- Let {data} and {work} be the result of {ExecuteExecutionPlan(newDeferUsages,
  executionPlan, objectType, initialValue, variableValues, executionMode)}.
- Let {errors} be the list of all _execution error_ raised while executing the
  execution plan.
- Let {tasks} and {streams} be the corresponding entries on {work}.
- If {tasks} is empty and {streams} is empty, return an unordered map containing
  {data} and {errors}.
- Let {incrementalStreamResults} be the result of {YieldIncrementalResults(data,
  errors, work)}.
- Wait for the first result in {incrementalStreamResults} to be available.
- Let {initialIncrementalStreamResult} be that result.
- Return {initialIncrementalStreamResult} and
  {BatchIncrementalResults(incrementalStreamResults)}.

Note: {ExecuteExecutionPlan()} does not directly raise execution errors from the
incremental portion of the Execution Plan.

### Field Collection

Before execution, each _selection set_ is converted to a _collected fields map_
by collecting all fields with the same response name, including those in
referenced fragments, into an individual _field set_. This ensures that multiple
references to fields with the same response name will only be executed once.

:: A _collected fields map_ is an ordered map where each entry is a _response
name_ and its associated _field set_. A _collected fields map_ may be produced
from a selection set via {CollectFields()} or from the selection sets of all
entries of a _field set_ via {CollectSubfields()}.

:: A _field set_ is an ordered set of Field Details that share the same
_response name_ (the field alias if defined, otherwise the field's name).
Validation ensures each field in the set has the same name and arguments,
however each may have different subfields (see:
[Field Selection Merging](#sec-Field-Selection-Merging)).

Note: The order of field selections in both a _collected fields map_ and a
_field set_ are significant, hence the algorithms in this specification model
them as an ordered map and ordered set.

As an example, collecting the fields of this query's selection set would result
in a collected fields map with two entries, `"a"` and `"b"`, with two instances
of the field `a` and one of field `b`:

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

The depth-first-search order of each _field set_ produced by {CollectFields()}
is maintained through execution, ensuring that fields appear in the executed
response in a stable and predictable order.

CollectFields(objectType, selectionSet, variableValues, deferUsage,
visitedFragments):

The {CollectFields()} algorithm makes use of the following data types:

Defer Usage Records are unordered maps representing the usage of a `@defer`
directive within a given operation. Defer Usages are "abstract" in that they
include information about the `@defer` directive from the AST of the GraphQL
document. A single Defer Usage may be used to create many "concrete" Delivery
Groups when a `@defer` is included within a list type.

Defer Usages contain the following information:

- {label}: the `label` argument provided by the given `@defer` directive, if
  any, otherwise {undefined}.
- {parentDeferUsage}: a Defer Usage corresponding to the `@defer` directive
  enclosing this `@defer` directive, if any, otherwise {undefined}.

The {parentDeferUsage} entry is used to build distinct Execution Groups as
discussed within the Execution Plan Generation section below.

Field Details Records are unordered maps containing the following entries:

- {field}: the Field selection.
- {deferUsage}: the Defer Usage enclosing the selection, if any, otherwise
  {undefined}.

A Collected Fields Map is an ordered map of _response name_ to lists of Field
Details.

The {CollectFields()} algorithm returns:

- {collectedFieldsMap}: the Collected Fields Map for the fields in the selection
  set.
- {newDeferUsages}: a list of new Defer Usages encountered during this field
  collection.

- If {visitedFragments} is not provided, initialize it to the empty set.
- Initialize {collectedFieldsMap} to an empty ordered map of ordered sets.
- Initialize {newDeferUsages} to an empty list.
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
    - Let {responseName} be the _response name_ of {selection} (the alias if
      defined, otherwise the field name).
    - Let {fieldDetails} be a new unordered map containing {field} and
      {deferUsage}.
    - Set the corresponding entries on {fieldDetails} to {selection} and
      {deferUsage}, respectively.
    - Let {fieldsForResponseName} be the _field set_ value in
      {collectedFieldsMap} for the key {responseName}; otherwise create the
      entry with an empty ordered set.
    - Add {fieldDetails} to the {fieldsForResponseName}.
  - If {selection} is a {FragmentSpread}:
    - Let {fragmentSpreadName} be the name of {selection}.
    - If {selection} provides the directive `@defer` and its {if} argument is
      not {false} and is not a variable in {variableValues} with the value
      {false}:
      - Let {deferDirective} be that directive.
      - If this execution is for a subscription operation, raise an _execution
        error_.
    - If {fragmentSpreadName} is in {visitedFragments}, continue with the next
      {selection} in {selectionSet}.
    - If {deferDirective} is not defined:
      - Add {fragmentSpreadName} to {visitedFragments}.
    - Let {fragment} be the Fragment in the current Document whose name is
      {fragmentSpreadName}.
    - If no such {fragment} exists, continue with the next {selection} in
      {selectionSet}.
    - Let {fragmentType} be the type condition on {fragment}.
    - If {DoesFragmentTypeApply(objectType, fragmentType)} is {false}, continue
      with the next {selection} in {selectionSet}.
    - Let {fragmentSelectionSet} be the top-level selection set of {fragment}.
    - If {deferDirective} is defined:
      - Let {label} be the corresponding entry on {deferDirective}.
      - Let {parentDeferUsage} be {deferUsage}.
      - Let {fragmentDeferUsage} be an unordered map containing {label} and
        {parentDeferUsage}.
    - Otherwise, let {fragmentDeferUsage} be {deferUsage}.
    - Let {fragmentCollectedFieldsMap} and {fragmentNewDeferUsages} be the
      result of calling {CollectFields(objectType, fragmentSelectionSet,
      variableValues, fragmentDeferUsage, visitedFragments)}.
    - For each {responseName} and {fragmentFieldSet} in
      {fragmentCollectedFieldsMap}:
      - Let {fieldsForResponseName} be the _field set_ value in
        {collectedFieldsMap} for the key {responseName}; otherwise create the
        entry with an empty ordered set.
      - Add each item from {fragmentFieldSet} to {fieldsForResponseName}.
    - Append all items in {fragmentNewDeferUsages} to {newDeferUsages}.
  - If {selection} is an {InlineFragment}:
    - Let {fragmentType} be the type condition on {selection}.
    - If {fragmentType} is not {null} and {DoesFragmentTypeApply(objectType,
      fragmentType)} is {false}, continue with the next {selection} in
      {selectionSet}.
    - Let {fragmentSelectionSet} be the top-level selection set of {selection}.
    - If {selection} provides the directive `@defer` and its {if} argument is
      not {false} and is not a variable in {variableValues} with the value
      {false}:
      - Let {deferDirective} be that directive.
      - If this execution is for a subscription operation, raise an _execution
        error_.
    - If {deferDirective} is defined:
      - Let {label} be the corresponding entry on {deferDirective}.
      - Let {parentDeferUsage} be {deferUsage}.
      - Let {fragmentDeferUsage} be an unordered map containing {label} and
        {parentDeferUsage}.
    - Otherwise, let {fragmentDeferUsage} be {deferUsage}.
    - Let {fragmentCollectedFieldsMap} and {fragmentNewDeferUsages} be the
      result of calling {CollectFields(objectType, fragmentSelectionSet,
      variableValues, fragmentDeferUsage, visitedFragments)}.
    - For each {responseName} and {fragmentFieldSet} in
      {fragmentCollectedFieldsMap}:
      - Let {fieldsForResponseName} be the _field set_ value in
        {collectedFieldsMap} for the key {responseName}; otherwise create the
        entry with an empty ordered set.
      - Add each item from {fragmentFieldSet} to {fieldsForResponseName}.
    - Append all items in {fragmentNewDeferUsages} to {newDeferUsages}.
- Return {collectedFieldsMap} and {newDeferUsages}.

DoesFragmentTypeApply(objectType, fragmentType):

- If {fragmentType} is an Object Type:
  - If {objectType} and {fragmentType} are the same type, return {true},
    otherwise return {false}.
- If {fragmentType} is an Interface Type:
  - If {objectType} is an implementation of {fragmentType}, return {true},
    otherwise return {false}.
- If {fragmentType} is a Union:
  - If {objectType} is a possible type of {fragmentType}, return {true},
    otherwise return {false}.

Note: The steps in {CollectFields()} evaluating the `@skip` and `@include`
directives may be applied in either order since they apply commutatively.

Note: When completing a List field, the {CollectFields} algorithm is invoked
with the same arguments for each element of the list. GraphQL Services may
choose to memoize their implementations of {CollectFields}.

**Merging Selection Sets**

In order to execute the sub-selections of an object typed field, all _selection
sets_ of each field with the same response name in the parent _field set_ are
merged together into a single _collected fields map_ representing the subfields
to be executed next.

An example operation illustrating parallel fields with the same name with
sub-selections.

Continuing the example above,

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

After resolving the value for field `"a"`, the following multiple selection sets
are collected and merged together so `"subfield1"` and `"subfield2"` are
resolved in the same phase with the same value.

CollectSubfields(objectType, fields, variableValues):

- Let {collectedFieldsMap} be an empty ordered map of ordered sets.
- Let {newDeferUsages} be an empty list.
- For each {fieldDetails} in {fields}:
  - Let {field} and {deferUsage} be the corresponding entries on {fieldDetails}.
  - Let {fieldSelectionSet} be the selection set of {field}.
  - If {fieldSelectionSet} is null or empty, continue to the next field.
  - Let {subCollectedFieldsMap} and {subNewDeferUsages} be the result of
    {CollectFields(objectType, fieldSelectionSet, variableValues, deferUsage)}.
  - For each {responseName} and {subfields} in {subCollectedFieldsMap}:
    - Let {fieldsForResponseName} be the _field set_ value in
      {collectedFieldsMap} for the key {responseName}; otherwise create the
      entry with an empty ordered set.
    - Add each item from {subfields} to {fieldsForResponseName}.
  - Append all items in {subNewDeferUsages} to {newDeferUsages}.
- Return {collectedFieldsMap} and {newDeferUsages}.

Note: All the {fieldDetailsList} passed to {CollectSubfields()} share the same
_response name_.

### Executing Collected Fields

To execute a _collected fields map_, the object type being evaluated and the
runtime value need to be known, as well as the runtime values for any variables.

Execution will recursively resolve and complete the value of every entry in the
collected fields map, producing an entry in the result map with the same
_response name_ key.

ExecuteCollectedFields(collectedFieldsMap, objectType, objectValue,
variableValues, path, deferUsageSet, deferMap):

- Initialize {resultMap} to an empty ordered map.
- Initialize {groups}, {tasks}, and {streams} to empty lists.
- For each {responseName} and {fields} in {collectedFieldsMap}:
  - Let {fieldDetails} be the first entry in {fields}.
  - Let {field} be the corresponding entry on {fieldDetails}.
  - Let {fieldName} be the field name of {field}. Note: This value is unaffected
    if an alias is used.
  - Let {fieldType} be the return type defined for the field {fieldName} of
    {objectType}.
  - If {fieldType} is defined:
    - Let {responseValue} and {fieldWork} be the result of
      {ExecuteField(objectType, objectValue, fieldType, fields, variableValues,
      path, deferUsageSet, deferMap)}.
    - Let {fieldGroups}, {fieldTasks}, and {fieldStreams} be the corresponding
      entries on {fieldWork}.
    - Set {responseValue} as the value for {responseName} in {resultMap}.
    - For each {fieldGroup} in {fieldGroups}:
      - If {groups} does not contain an equivalent {fieldGroup}, append
        {fieldGroup} to {groups}.
    - Append all items in {fieldTasks} to {tasks}.
    - Append all items in {fieldStreams} to {streams}.
- Return {resultMap} and an unordered map containing {groups}, {tasks}, and
  {streams}.

Note: {resultMap} is ordered by which fields appear first in the operation. This
is explained in greater detail in the Field Collection section below.

**Errors and Non-Null Types**

<a name="sec-Executing-Selection-Sets.Errors-and-Non-Null-Fields">
  <!-- Legacy link, this section was previously titled "Errors and Non-Null Fields" -->
</a>

If during {ExecuteCollectedFields()} a _response position_ with a non-null type
raises an _execution error_ then that error must propagate to the parent
response position (the entire selection set in the case of a field, or the
entire list in the case of a list position), either resolving to {null} if
allowed or being further propagated to a parent response position.

If this occurs, any sibling response positions which have not yet executed or
have not yet yielded a value may be cancelled to avoid unnecessary work.

Note: See [Handling Execution Errors](#sec-Handling-Execution-Errors) for more
about this behavior.

### Normal and Serial Execution

Normally the executor can execute the entries in a _collected fields map_ in
whatever order it chooses (normally in parallel). Because the resolution of
fields other than top-level mutation fields must always be side effect-free and
idempotent, the execution order must not affect the result, and hence the
service has the freedom to execute the field entries in whatever order it deems
optimal.

For example, given the following collected fields map to be executed normally:

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

When executing a collected fields map serially, the executor must consider each
entry from the collected fields map in the order provided in the collected
fields map. It must determine the corresponding entry in the result map for each
item to completion before it continues on to the next entry in the collected
fields map:

For example, given the following mutation operation, the root _selection set_
must be executed serially:

```graphql example
mutation ChangeBirthdayAndAddress($newBirthday: String!, $newAddress: String!) {
  changeBirthday(birthday: $newBirthday) {
    month
  }
  changeAddress(address: $newAddress) {
    street
  }
}
```

Therefore the executor must, in serial:

- Run {ExecuteField()} for `changeBirthday`, which during {CompleteValue()} will
  execute the `{ month }` sub-selection set normally.
- Run {ExecuteField()} for `changeAddress`, which during {CompleteValue()} will
  execute the `{ street }` sub-selection set normally.

As an illustrative example, let's assume we have a mutation field
`changeTheNumber` that returns an object containing one field, `theNumber`. If
we execute the following _selection set_ serially:

```graphql example
# Note: This is a selection set, not a full document using the query shorthand.
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

A correct executor must generate the following result for that _selection set_:

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

## Executing Fields

Each entry in a result map is the result of executing a field on an object type
selected by the name of that field in a _collected fields map_. Field execution
first coerces any provided argument values, then resolves a value for the field,
and finally completes that value either by recursively executing another
selection set or coercing a scalar value.

ExecuteField(objectType, objectValue, fieldType, fieldDetailsList,
variableValues, path, deferUsageSet, deferMap):

- Let {fieldDetails} be the first entry in {fieldDetailsList}.
- Let {field} be the corresponding entry on {fieldDetails}.
- Let {fieldName} be the field name of {field}.
- Append {fieldName} to {path}.
- Let {argumentValues} be the result of {CoerceArgumentValues(objectType, field,
  variableValues)}.
- Let {resolvedValue} be {ResolveFieldValue(objectType, objectValue, fieldName,
  argumentValues)}.
- Return the result of {CompleteValue(fieldType, fieldDetailsList,
  resolvedValue, variableValues, path, deferUsageSet, deferMap)}.

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
  - Let {argumentValue} be the value provided in {argumentValues} for the name
    {argumentName}.
  - If {argumentValue} is a {Variable}:
    - Let {variableName} be the name of {argumentValue}.
    - If {variableValues} provides a value for the name {variableName}:
      - Let {hasValue} be {true}.
      - Let {value} be the value provided in {variableValues} for the name
        {variableName}.
  - Otherwise if {argumentValues} provides a value for the name {argumentName}.
    - Let {hasValue} be {true}.
    - Let {value} be {argumentValue}.
  - If {hasValue} is not {true} and {defaultValue} exists (including {null}):
    - Let {coercedDefaultValue} be the result of coercing {defaultValue}
      according to the input coercion rules of {argumentType}.
    - Add an entry to {coercedValues} named {argumentName} with the value
      {coercedDefaultValue}.
  - Otherwise if {argumentType} is a Non-Nullable type, and either {hasValue} is
    not {true} or {value} is {null}, raise an _execution error_.
  - Otherwise if {hasValue} is {true}:
    - If {value} is {null}:
      - Add an entry to {coercedValues} named {argumentName} with the value
        {null}.
    - Otherwise, if {argumentValue} is a {Variable}:
      - Add an entry to {coercedValues} named {argumentName} with the value
        {value}.
    - Otherwise:
      - If {value} cannot be coerced according to the input coercion rules of
        {argumentType}, raise an _execution error_.
      - Let {coercedValue} be the result of coercing {value} according to the
        input coercion rules of {argumentType}.
      - Add an entry to {coercedValues} named {argumentName} with the value
        {coercedValue}.
- Return {coercedValues}.

Any _request error_ raised as a result of input coercion during
{CoerceArgumentValues()} should be treated instead as an _execution error_.

Note: Variable values are not coerced because they are expected to be coerced
before executing the operation in {CoerceVariableValues()}, and valid operations
must only allow usage of variables of appropriate types.

Note: Implementations are encouraged to optimize the coercion of an argument's
default value by doing so only once and caching the resulting coerced value.

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
flow. If the field is of a list type, each value in the collection of values
returned by {resolver} may itself be retrieved asynchronously.

### Value Completion

After resolving the value for a field, it is completed by ensuring it adheres to
the expected return type. If the return type is another Object type, then the
field execution process continues recursively by collecting and executing
subfields.

CompleteValue(fieldType, fieldDetailsList, result, variableValues, path,
deferUsageSet, deferMap):

- If the {fieldType} is a Non-Null type:
  - Let {innerType} be the inner type of {fieldType}.
  - Let {completedResult} and {work} be the result of calling
    {CompleteValue(innerType, fieldDetailsList, result, variableValues, path,
    deferUsageSet, deferMap)}.
  - If {completedResult} is {null}, raise an _execution error_.
  - Return {completedResult} and {work}.
- If {result} is {null} (or another internal value similar to {null} such as
  {undefined}), return {null} and an unordered map containing empty lists for
  {groups}, {tasks}, and {streams}.
- If {fieldType} is a List type:
  - If {result} is not a collection of values, raise an _execution error_.
  - Let {innerType} be the inner type of {fieldType}.
  - Return the result of {CompleteListValue(innerType, fieldDetailsList, result,
    variableValues, path, deferUsageSet, deferMap)}.
- If {fieldType} is a Scalar or Enum type:
  - Return the result of {CoerceResult(fieldType, result)} and an unordered map
    containing empty lists for {groups}, {tasks}, and {streams}.
- If {fieldType} is an Object, Interface, or Union type:
  - If {fieldType} is an Object type.
    - Let {objectType} be {fieldType}.
  - Otherwise if {fieldType} is an Interface or Union type.
    - Let {objectType} be {ResolveAbstractType(fieldType, result)}.
  - Let {collectedFieldsMap} and {newDeferUsages} be the result of calling
    {CollectSubfields(objectType, fieldDetailsList, variableValues)}.
  - Let {executionPlan} be the result of {BuildExecutionPlan(collectedFieldsMap,
    deferUsageSet)}.
  - Return the result of {ExecuteExecutionPlan(newDeferUsages, executionPlan,
    objectType, result, variableValues, "normal", path, deferUsageSet,
    deferMap)}.

CompleteListValue(innerType, fieldDetailsList, result, variableValues, path,
deferUsageSet, deferMap):

- Initialize {items}, {groups}, {tasks}, and {streams} to empty lists.
- Let {index} be {0}.
- For each {resultItem} of {result}:
  - Let {itemPath} be {path} with {index} appended.
  - Let {completedItem} and {itemWork} be the result of calling
    {CompleteValue(innerType, fieldDetailsList, resultItem, variableValues,
    itemPath, deferUsageSet, deferMap)}.
  - Let {itemGroups}, {itemTasks}, and {itemStreams} be the corresponding
    entries on {itemWork}.
  - Append {completedItem} to {items}.
  - For each {itemGroup} in {itemGroups}:
    - If {groups} does not contain an equivalent {itemGroup}, append {itemGroup}
      to {groups}.
  - Append all items in {itemTasks} to {tasks}.
  - Append all items in {itemStreams} to {streams}.
  - Increment {index} by {1}.
- Return {items} and an unordered map containing {groups}, {tasks}, and
  {streams}.

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

- Assert: {value} is not {null}.
- Return the result of calling the internal method provided by the type system
  for determining the "result coercion" of {leafType} given the value {value}.
  This internal method must return a valid value for the type and not {null}.
  Otherwise raise an _execution error_.

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

### Handling Execution Errors

<a name="sec-Handling-Field-Errors">
  <!-- Legacy link, this section was previously titled "Handling Execution Errors" -->
</a>

An _execution error_ is an error raised during field execution, value resolution
or coercion, at a specific _response position_. While these errors must be
reported in the response, they are "handled" by producing partial {"data"} in
the _response_.

Note: This is distinct from a _request error_ which results in a _request error
result_ with no data.

If an execution error is raised while resolving a field (either directly or
nested inside any lists), it is handled as though the _response position_ at
which the error occurred resolved to {null}, and the error must be added to the
{"errors"} list in the _execution result_.

If the result of resolving a _response position_ is {null} (either due to the
result of {ResolveFieldValue()} or because an execution error was raised), and
that position is of a `Non-Null` type, then an execution error is raised at that
position. The error must be added to the {"errors"} list in the _execution
result_.

If a _response position_ resolves to {null} because of an execution error which
has already been added to the {"errors"} list in the _execution result_, the
{"errors"} list must not be further affected. That is, only one error should be
added to the errors list per _response position_.

Since `Non-Null` response positions cannot be {null}, execution errors are
propagated to be handled by the parent _response position_. If the parent
response position may be {null} then it resolves to {null}, otherwise if it is a
`Non-Null` type, the execution error is further propagated to its parent
_response position_.

If a `List` type wraps a `Non-Null` type, and one of the _response position_
elements of that list resolves to {null}, then the entire list _response
position_ must resolve to {null}. If the `List` type is also wrapped in a
`Non-Null`, the execution error continues to propagate upwards.

If every _response position_ from the root of the request to the source of the
execution error has a `Non-Null` type, then the {"data"} entry in the _execution
result_ should be {null}.

### Execution Plan Generation

A _collected fields map_ may contain fields that have been deferred by the use
of the `@defer` directive on their enclosing fragments. Given a _collected
fields map_, {BuildExecutionPlan()} generates an execution plan by partitioning
the _collected fields map_ as specified by the operation's use of `@defer` and
the requirements of the incremental response format. An execution plan consists
of a single new _collected fields map_ containing the fields that do not require
deferral, and a map of new _collected fields maps_ where the keys represent sets
of Defer Usages containing those fields.

BuildExecutionPlan(originalCollectedFieldsMap, parentDeferUsages):

- If {parentDeferUsages} is not provided, initialize it to the empty set.
- Initialize {collectedFieldsMap} to an empty ordered map.
- Initialize {newCollectedFieldsMaps} to an empty unordered map.
- Let {executionPlan} be an unordered map containing {collectedFieldsMap} and
  {newCollectedFieldsMaps}.
- For each {responseName} and {fieldsForResponseName} of
  {originalCollectedFieldsMap}:
  - Let {filteredDeferUsageSet} be the result of
    {GetFilteredDeferUsageSet(fieldsForResponseName)}.
  - If {filteredDeferUsageSet} is the equivalent set to {parentDeferUsages}:
    - Set the entry for {responseName} in {collectedFieldsMap} to
      {fieldsForResponseName}.
  - Otherwise:
    - Let {newCollectedFieldsMap} be the entry in {newCollectedFieldsMaps} for
      any equivalent set to {filteredDeferUsageSet}; if no such map exists,
      create it as an empty ordered map.
    - Set the entry for {responseName} in {newCollectedFieldsMap} to
      {fieldsForResponseName}.
- Return {executionPlan}.

GetFilteredDeferUsageSet(fieldDetailsList):

- Initialize {filteredDeferUsageSet} to the empty set.
- For each {fieldDetails} of {fieldDetailsList}:
  - Let {deferUsage} be the corresponding entry on {fieldDetails}.
  - If {deferUsage} is not defined:
    - Remove all entries from {filteredDeferUsageSet}.
    - Return {filteredDeferUsageSet}.
  - Add {deferUsage} to {filteredDeferUsageSet}.
- For each {deferUsage} in {filteredDeferUsageSet}:
  - Let {parentDeferUsage} be the corresponding entry on {deferUsage}.
  - While {parentDeferUsage} is defined:
    - If {parentDeferUsage} is contained by {filteredDeferUsageSet}:
      - Remove {deferUsage} from {filteredDeferUsageSet}.
      - Continue to the next {deferUsage} in {filteredDeferUsageSet}.
    - Reset {parentDeferUsage} to the corresponding entry on {parentDeferUsage}.
- Return {filteredDeferUsageSet}.

### Yielding Incremental Stream Results

The procedure for yielding an _incremental stream_ uses a generic incremental
work queue and maps its event stream into an _initial incremental stream result_
followed by zero or more _incremental stream update result_.

YieldIncrementalResults(data, errors, work):

- Let {initialGroups}, {initialStreams}, and {workEventStream} be the result of
  {CreateWorkQueue(work)}.
- Let {pending} be the result of {GetPendingEntry(initialGroups,
  initialStreams)}.
- Let {hasNext} be {true}.
- Yield an unordered map containing {data}, {errors}, {pending}, and {hasNext}.
- Let {incrementalStreamUpdateResults} be the result of
  {MapIncrementalWorkEventsToResponseEvent(workEventStream)}.
- For each {incrementalStreamUpdateResult} in {incrementalStreamUpdateResults}:
  - Yield {incrementalStreamUpdateResult}.
- Complete this incremental stream.

### Mapping Work Events to Response Events

The {MapIncrementalWorkEventsToResponseEvent()} algorithm maps each batch of
work queue events into an _incremental stream update result_.

MapIncrementalWorkEventsToResponseEvent(workEventStream):

- Let {idMap} be an empty map.
- Let {nextID} be {0}.
- Return a new event stream {responseEventStream} which yields events as
  follows:
- For each {batch} emitted by {workEventStream}:
  - Initialize {pending}, {incremental}, and {completed} to empty lists.
  - Let {hasNext} be {true}.
  - For each {event} in {batch}:
    - If {event} is {GROUP_VALUES}:
      - Let {group} and {values} be the corresponding entries on {event}.
      - For each {value} in {values}:
        - Append {GetIncrementalEntry(group, value)} to {incremental}.
    - If {event} is {GROUP_SUCCESS}:
      - Let {group}, {newGroups}, and {newStreams} be the corresponding entries
        on {event}.
      - Append {GetCompletedEntry(group)} to {completed}.
      - Append all items in {GetPendingEntry(newGroups, newStreams)} to
        {pending}.
    - If {event} is {GROUP_FAILURE}:
      - Let {group} and {error} be the corresponding entries on {event}.
      - Let {groupErrors} be a list containing {error}.
      - Append {GetCompletedEntry(group, groupErrors)} to {completed}.
    - If {event} is {STREAM_VALUES}:
      - Let {stream}, {values}, {newGroups}, and {newStreams} be the
        corresponding entries on {event}.
      - Let {id} be the result of {EnsureID(stream)}.
      - Initialize {items} and {streamErrors} to empty lists.
      - For each {value} in {values}:
        - Append the stream item entry from {value} to {items}.
        - If {value} contains {errors}, append each such error to
          {streamErrors}.
      - Let {incrementalEntry} be an unordered map containing {id} and {items}.
      - If {streamErrors} is not empty, set the corresponding entry on
        {incrementalEntry} to {streamErrors}.
      - Append {incrementalEntry} to {incremental}.
      - Append all items in {GetPendingEntry(newGroups, newStreams)} to
        {pending}.
    - If {event} is {STREAM_SUCCESS}:
      - Let {stream} be the corresponding entry on {event}.
      - Append {GetCompletedEntry(stream)} to {completed}.
    - If {event} is {STREAM_FAILURE}:
      - Let {stream} and {error} be the corresponding entries on {event}.
      - Let {streamErrors} be a list containing {error}.
      - Append {GetCompletedEntry(stream, streamErrors)} to {completed}.
    - If {event} is {WORK_QUEUE_TERMINATION}:
      - Let {hasNext} be {false}.
  - Yield the result of {GetIncrementalStreamUpdateResult(hasNext, completed,
    incremental, pending)}.

The following algorithms have access to {idMap} and {nextID}.

EnsureID(node):

- If {idMap} has an entry for {node}, return that entry.
- Let {id} be {nextID} converted to a string.
- Set the entry for {node} in {idMap} to {id}.
- Increment {nextID} by {1}.
- Return {id}.

GetPendingEntry(newGroups, newStreams):

- Initialize {pending} to an empty list.
- For each {group} of {newGroups}:
  - Let {id} be the result of {EnsureID(group)}.
  - Let {path} and {label} be the corresponding entries on {group}.
  - Let {pendingEntry} be an unordered map containing {id}, {path}, and {label}.
  - Append {pendingEntry} to {pending}.
- For each {stream} of {newStreams}:
  - Let {id} be the result of {EnsureID(stream)}.
  - Let {path} and {label} be the corresponding entries on {stream}.
  - Let {pendingEntry} be an unordered map containing {id}, {path}, and {label}.
  - Append {pendingEntry} to {pending}.
- Return {pending}.

GetIncrementalEntry(group, value):

- Let {id} be the result of {EnsureID(group)}.
- Let {groupPath} be the path entry on {group}.
- Let {path}, {data}, and {errors} be the corresponding entries on {value}.
- Let {subPath} be the portion of {path} not contained by {groupPath}.
- Let {incrementalEntry} be an unordered map containing {id} and {data}.
- If {errors} is not empty, set the corresponding entry on {incrementalEntry} to
  {errors}.
- If {subPath} is not empty, set the corresponding entry on {incrementalEntry}
  to {subPath}.
- Return {incrementalEntry}.

GetCompletedEntry(node, errors):

- Let {id} be the result of {EnsureID(node)}.
- Let {completedEntry} be an unordered map containing {id}.
- If {errors} is provided and not empty, set the corresponding entry on
  {completedEntry} to {errors}.
- Return {completedEntry}.

GetIncrementalStreamUpdateResult(hasNext, completed, incremental, pending):

- Let {incrementalStreamUpdateResult} be an unordered map containing {hasNext}.
- If {incremental} is not empty:
  - Set the corresponding entry on {incrementalStreamUpdateResult} to
    {incremental}.
- If {completed} is not empty:
  - Set the corresponding entry on {incrementalStreamUpdateResult} to
    {completed}.
- If {pending} is not empty:
  - Set the corresponding entry on {incrementalStreamUpdateResult} to {pending}.
- Return {incrementalStreamUpdateResult}.

### Batching Incremental Stream Update Results

BatchIncrementalResults(incrementalStreamUpdateResults):

- Return a new stream {batchedIncrementalStreamUpdateResults} which yields
  events as follows:
- While {incrementalStreamUpdateResults} is not closed:
  - Let {availableIncrementalStreamUpdateResults} be a list of one or more
    _incremental stream update result_ available on
    {incrementalStreamUpdateResults}.
  - Let {batchedIncrementalStreamUpdateResult} be an unordered map created by
    merging the items in {availableIncrementalStreamUpdateResults} into a single
    unordered map, concatenating list entries as necessary, and setting
    {hasNext} to the value of {hasNext} on the final item in the list.
  - Yield {batchedIncrementalStreamUpdateResult}.

## Executing an Execution Plan

Executing an execution plan consists of two tasks that may be performed in
parallel. The first task is simply the execution of the non-deferred collected
fields map. The second task is to use the partitioned collected fields maps
within the execution plan to generate Execution Group tasks and combine those
tasks with any nested incremental work.

ExecuteExecutionPlan(newDeferUsages, executionPlan, objectType, objectValue,
variableValues, executionMode, path, deferUsageSet, deferMap):

- If {path} is not provided, initialize it to an empty list.
- Let {newDeferMap} be the result of {GetNewDeferMap(newDeferUsages, path,
  deferMap)}.
- Let {collectedFieldsMap} and {newCollectedFieldsMaps} be the corresponding
  entries on {executionPlan}.
- Allowing for parallelization, perform the following steps:
  - Let {data} and {work} be the result of running
    {ExecuteCollectedFields(collectedFieldsMap, objectType, objectValue,
    variableValues, path, deferUsageSet, newDeferMap)} _serially_ if
    {executionMode} is {"serial"}, _normally_ (allowing parallelization)
    otherwise.
  - Let {executionGroupTasks} be the result of
    {CollectExecutionGroups(objectType, objectValue, variableValues,
    newCollectedFieldsMaps, path, newDeferMap)}.
- Let {groups}, {tasks}, and {streams} be the corresponding entries on {work}.
- Append all items in {executionGroupTasks} to {tasks}.
- For each {task} in {executionGroupTasks}:
  - Let {deferredFragments} be the Deferred Fragments incrementally completed by
    {task}.
  - For each {deferredFragment} in {deferredFragments}:
    - If {groups} does not contain an equivalent {deferredFragment}, append
      {deferredFragment} to {groups}.
- Return {data} and {work}.

### Mapping @defer Directives to Delivery Groups

Because `@defer` directives may be nested within list types, a map is required
to associate a Defer Usage record as recorded within Field Details Records and
an actual Deferred Fragment so that any additional Execution Groups may be
associated with the correct Deferred Fragment. The {GetNewDeferMap()} algorithm
creates that map. Given a list of new Defer Usages, the actual path at which the
fields they defer are spread, and an initial map, it returns a new map
containing all entries in the provided defer map, as well as new entries for
each new Defer Usage.

GetNewDeferMap(newDeferUsages, path, deferMap):

- If {newDeferUsages} is empty, return {deferMap}.
- Let {newDeferMap} be a new unordered map containing all entries in {deferMap}.
- For each {deferUsage} in {newDeferUsages}:
  - Let {parentDeferUsage} and {label} be the corresponding entries on
    {deferUsage}.
  - Let {parent} be the entry in {deferMap} for {parentDeferUsage}.
  - Let {newDeferredFragment} be an unordered map containing {parent}, {path}
    and {label}.
  - Set the entry for {deferUsage} in {newDeferMap} to {newDeferredFragment}.
- Return {newDeferMap}.

### Collecting Execution Groups

The {CollectExecutionGroups()} algorithm is responsible for creating the
Execution Group tasks for each partitioned collected fields map. It uses the map
created by {GetNewDeferMap()} algorithm to associate each Execution Group with
the correct Deferred Fragment.

CollectExecutionGroups(objectType, objectValue, variableValues,
newCollectedFieldsMaps, path, deferMap):

- Initialize {executionGroupTasks} to an empty list.
- For each {deferUsageSet} and {collectedFieldsMap} in {newCollectedFieldsMaps}:
  - Let {deferredFragments} be an empty list.
  - For each {deferUsage} in {deferUsageSet}:
    - Let {deferredFragment} be the entry for {deferUsage} in {deferMap}.
    - Append {deferredFragment} to {deferredFragments}.
  - Let {executionGroupTask} represent the future execution of
    {ExecuteExecutionGroup(collectedFieldsMap, objectType, objectValue,
    variableValues, path, deferUsageSet, deferMap)}, incrementally completing
    {deferredFragments} at {path}.
  - Append {executionGroupTask} to {executionGroupTasks}.
  - Schedule initiation of execution of {executionGroupTask} following any
    implementation specific deferral.
- Return {executionGroupTasks}.

Note: {executionGroupTask} can be safely initiated without blocking
higher-priority data once any of {deferredFragments} are released as pending.

The {ExecuteExecutionGroup()} algorithm is responsible for actually executing
the deferred collected fields map and collecting the result and any raised
errors.

ExecuteExecutionGroup(collectedFieldsMap, objectType, objectValue,
variableValues, path, deferUsageSet, deferMap):

- Let {data} and {work} be the result of running
  {ExecuteCollectedFields(collectedFieldsMap, objectType, objectValue,
  variableValues, path, deferUsageSet, deferMap)} _normally_ (allowing
  parallelization).
- Let {errors} be the list of all _execution error_ raised while executing
  {ExecuteCollectedFields()}.
- Return an unordered map containing {data}, {errors}, and {work}.
