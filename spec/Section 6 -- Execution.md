# Execution

GraphQL generates a response from a request via execution.

A request for execution consists of a few pieces of information:

* The schema to use, typically solely provided by the GraphQL service.
* A Document containing GraphQL Operations and Fragments to execute.
* Optionally: The name of the Operation in the Document to execute.
* Optionally: Values for Variables defined by the Operation.
* Optionally: An initial value corresponding to the root type being executed.

Given this information, the result of {ExecuteRequest()} produces the response,
to be formatted according to the Reponse section below.


## Executing Requests

To execute a request, the executor must have a parsed `Document` (as defined
in the “Query Language” part of this spec) and a selected operation name to
run if the document defines multiple operations.

ExecuteRequest(schema, document, operationName, variableValues, initialValue):

  * Let {operation} be the result of {GetOperation(document, operationName)}.
  * Let {coercedVariableValues} be the result of {CoerceVariableValues(schema, operation, variableValues)}.
  * If {operation} is a query operation:
    * Return {ExecuteQuery(operation, schema, coercedVariableValues, initialValue)}.
  * Otherwise if {operation} is a mutation operation:
    * Return {ExecuteMutation(operation, schema, coercedVariableValues, initialValue)}.

The executor should find the `Operation` in the `Document` with the given
operation name. If no such operation exists, the executor should throw an
error. If the operation is found, then the result of executing the request
should be the result of executing the operation according to the "Executing
Operations” section.

GetOperation(document, operationName):

  * If {operationName} is not {null}:
    * Let {operation} be the Operation named {operationName} in {document}.
    * If {operation} was not found, produce a query error.
    * Return {operation}.
  * Otherwise if there is only one Operation in {document}:
    * Return that Operation.
  * Otherwise:
    * Produce a query error requiring a non-null {operationName}.


## Validation of operation

As explained in the Validation section, only requests which pass all validation
rules should be executed. If validation errors are known, they should be
reported in the list of "errors" in the response and the operation must fail
without execution.

Typically validation is performed in the context of a request immediately
before execution, however a GraphQL service may execute a request without
explicitly validating it if that exact same request is known to have been
validated before. For example: the request may be validated during development,
provided it does not later change, or a service may validate a request once and
memoize the result to avoid validating the same request again in the future.

A GraphQL service should only execute requests which *at some point* were
known to be free of any validation errors, and have not changed since.


## Coercing Variable Values

If the operation has defined any variables, then the values for
those variables need to be coerced using the input coercion rules
of variable's declared type. If a query error is encountered during
input coercion of variable values, then the operation fails without
execution.

If any variable defined as non-null is not provided, or is provided the value
{null}, then the operation fails without execution.

CoerceVariableValues(schema, operation, variableValues)

## Executing Operations

The type system, as described in the “Type System” part of the spec, must
provide a “Query Root” and a “Mutation Root” object.

If the operation is a query, the result of the operation is the result of
executing the query’s top level selection set on the “Query Root” object.

An initial value can be optionally provided when executing a query.

ExecuteQuery(query, schema, variableValues, initialValue):

  * Let {queryType} be the root Query type in {schema}.
  * Assert: {queryType} is an Object type.
  * Let {selectionSet} be the top level Selection Set in {query}.
  * Let {data} be the result of running
    {ExecuteSelectionSet(selectionSet, queryType, initialValue, variableValues)}
    *normally* (allowing parallelization).
  * Let {errors} be any *field errors* produced while executing the
    selection set.
  * Return an unordered map containing {data} and {errors}.

If the operation is a mutation, the result of the operation is the result of
executing the mutation’s top level selection set on the “Mutation Root”
object. This selection set should be executed serially.

It is expected that the top level fields in a mutation operation perform
side-effects on the underlying data system. Serial execution of the provided
mutations ensures against race conditions during these side-effects.

ExecuteMutation(mutation, schema, variableValues, initialValue):

  * Let {variableValues} be the set of variable values to be used by any
    field argument value coercion.
  * Let {mutationType} be the root Mutation type in {schema}.
  * Assert: {mutationType} is an Object type.
  * Let {selectionSet} be the top level Selection Set in {mutation}.
  * Let {data} be the result of running
    {ExecuteSelectionSet(selectionSet, mutationType, initialValue, variableValues)}
    *serially*.
  * Let {errors} be any *field errors* produced while executing the
    selection set.
  * Return an unordered map containing {data} and {errors}.


## Executing Selection Sets

To execute a selection set, the object value being evaluated and the object type
need to be known, as well as whether it must be executed serially, or may be
executed in parallel.

First, the selection set is turned into a grouped field set; then, each
represented field in the grouped field set produces an entry into a
response map.

ExecuteSelectionSet(selectionSet, objectType, objectValue, variableValues):

  * Initialize {visitedFragments} to be the empty set.
  * Let {groupedFieldSet} be the result of
    {CollectFields(objectType, selectionSet, visitedFragments, variableValues)}.
  * Initialize {resultMap} to an empty ordered map.
  * For each {groupedFields} in {groupedFieldSet}:
    * Let {entryTuple} be {GetFieldEntry(objectType, objectValue, groupedFields, variableValues)}.
    * If {entryTuple} is not {null}:
      * Let {responseKey} and {responseValue} be the values of {entryTuple}.
      * Set {responseValue} as the value for {responseKey} in {resultMap}.
  * Return {resultMap}.

Note: {responseMap} is ordered by which fields appear first in the query. This
is explained in greater detail in the Response section below.

Note: Normally, each call to {GetFieldEntry()} in the algorithm above is
performed in parallel. However there are conditions in which each call must be
done in serial, such as for mutations. This is explain in more detail in the
sections below.

Before execution, the selection set is converted to a grouped field set by
calling {CollectFields()}. Each entry in the grouped field set is a list of
fields that share a response key.

This ensures all fields with the same response key (alias or field name)
included via referenced fragments are executed at the same time.

CollectFields(objectType, selectionSet, visitedFragments, variableValues):

  * Initialize {groupedFields} to an empty ordered list of lists.
  * For each {selection} in {selectionSet}:
    * If {selection} provides the directive `@skip`, let {skipDirective} be that directive.
      * If {skipDirective}'s {if} argument is {true} or is a variable with a
        {true} value in {variableValues}, continue with the next
        {selection} in {selectionSet}.
    * If {selection} provides the directive `@include`, let {includeDirective} be that directive.
      * If {includeDirective}'s {if} argument is {false} or is a variable with
        *no* {true} value in {variableValues}, continue with the next
        {selection} in {selectionSet}.
    * If {selection} is a {Field}:
      * Let {responseKey} be the response key of {selection}.
      * Let {groupForResponseKey} be the list in {groupedFields} for
        {responseKey}; if no such list exists, create it as an empty list.
      * Append {selection} to the {groupForResponseKey}.
    * If {selection} is a {FragmentSpread}:
      * Let {fragmentSpreadName} be the name of {selection}.
      * If {fragmentSpreadName} is in {visitedFragments}, continue with the
        next {selection} in {selectionSet}.
      * Add {fragmentSpreadName} to {visitedFragments}.
      * Let {fragment} be the Fragment in the current Document whose name is
        {fragmentSpreadName}.
      * If no such {fragment} exists, continue with the next {selection} in
        {selectionSet}.
      * Let {fragmentType} be the type condition on {fragment}.
      * If {DoesFragmentTypeApply(objectType, fragmentType)} is false, continue
        with the next {selection} in {selectionSet}.
      * Let {fragmentSelectionSet} be the top-level selection set of {fragment}.
      * Let {fragmentGroupedFieldSet} be the result of calling
        {CollectFields(objectType, fragmentSelectionSet, visitedFragments)}.
      * For each {fragmentGroup} in {fragmentGroupedFieldSet}:
        * Let {responseKey} be the response key shared by all fields in {fragmentGroup}
        * Let {groupForResponseKey} be the list in {groupedFields} for
          {responseKey}; if no such list exists, create it as an empty list.
        * Append all items in {fragmentGroup} to {groupForResponseKey}.
    * If {selection} is an {InlineFragment}:
      * Let {fragmentType} be the type condition on {selection}.
      * If {fragmentType} is not {null} and {DoesFragmentTypeApply(objectType, fragmentType)} is false, continue
        with the next {selection} in {selectionSet}.
      * Let {fragmentSelectionSet} be the top-level selection set of {selection}.
      * Let {fragmentGroupedFieldSet} be the result of calling {CollectFields(objectType, fragmentSelectionSet, visitedFragments)}.
      * For each {fragmentGroup} in {fragmentGroupedFieldSet}:
        * Let {responseKey} be the response key shared by all fields in {fragmentGroup}
        * Let {groupForResponseKey} be the list in {groupedFields} for
          {responseKey}; if no such list exists, create it as an empty list.
        * Append all items in {fragmentGroup} to {groupForResponseKey}.
  * Return {groupedFields}.

DoesFragmentTypeApply(objectType, fragmentType):

  * If {fragmentType} is an Object Type:
    * if {objectType} and {fragmentType} are the same type, return {true}, otherwise return {false}.
  * If {fragmentType} is an Interface Type:
    * if {objectType} is an implementation of {fragmentType}, return {true} otherwise return {false}.
  * If {fragmentType} is a Union:
    * if {objectType} is a possible type of {fragmentType}, return {true} otherwise return {false}.

The result of executing the selection set is the result of executing the
corresponding grouped field set. The corresponding grouped field set should be
executed serially if the selection set is being executed serially, otherwise
it should be executed normally.

The result of executing a grouped field set will be an ordered map. For each
item in the grouped field set, an entry is added to the resulting ordered map,
where the key is the response key shared by all fields for that entry, and the
value is the result of executing those fields.


### Normal Execution

When executing a grouped field set without a serial execution order requirement,
the executor can determine the entries in the result map in whatever order it
chooses. Because the resolution of fields other than top-level mutation fields
is always side effect&ndash;free and idempotent, the execution order must not
affect the result, and hence the server has the freedom to execute the field
entries in whatever order it deems optimal.

For example, given the following grouped field set to be executed normally:

```graphql
{
  birthday {
    month
  }
  address {
    street
  }
}
```

A valid GraphQL executor can resolve the four fields in whatever order it
chose.


### Serial Execution

Observe that based on the above sections, the only time an executor will run in
serial execution order is on the top level selection set of a mutation
operation and on its corresponding grouped field set.

When executing a grouped field set serially, the executor must consider each entry
from the grouped field set in the order provided in the grouped field set. It must
determine the corresponding entry in the result map for each item to completion
before it continues on to the next item in the grouped field set:

For example, given the following selection set to be executed serially:

```graphql
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

 - Run {GetFieldEntry()} for `changeBirthday`, which during {CompleteValue()}
   will execute the `{ month }` sub-selection set normally.
 - Run {GetFieldEntry()} for `changeAddress`, which during {CompleteValue()}
   will execute the `{ street }` sub-selection set normally.

As an illustrative example, let's assume we have a mutation field
`changeTheNumber` that returns an object containing one field,
`theNumber`. If we execute the following selection set serially:

```graphql
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

```js
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

Each item in the grouped field set can potentially create an entry in the
result map. That entry in the result map is the result of calling
{GetFieldEntry()} on the corresponding item in the grouped field set.
{GetFieldEntry()} can return {null}, which indicates that there should be no
entry in the result map for this item. Note that this is distinct from
returning an entry with a string key and a {null} value, which indicates that
an entry in the result should be added for that key, and its value should
be {null}.

GetFieldEntry(objectType, objectValue, fields, variableValues):

  * Let {firstField} be the first entry in the ordered list {fields}. Note that
    {fields} is never empty, as the entry in the grouped field set would not
    exist if there were no fields.
  * Let {responseKey} be the response key of {firstField}. Note: If an alias was
    provided, it is used as the response key.
  * Let {fieldName} be the name of {firstField}. Note: This value is unaffected
    if an alias is provided.
  * Let {fieldType} be the result of calling
    {GetFieldTypeFromObjectType(objectType, fieldName)}.
  * If {fieldType} is {null}, return {null}, indicating that no entry exists in
    the result map.
  * Let {resolvedValue} be {ResolveFieldValue(objectType, firstField, objectValue, variableValues)}.
  * If {resolvedValue} is {null}, return {tuple(responseKey, null)},
    indicating that an entry exists in the result map whose value is `null`.
  * Let {subSelectionSet} be the result of calling {MergeSelectionSets(fields)}.
  * Let {responseValue} be the result of calling {CompleteValue(fieldType, resolvedValue, subSelectionSet, variableValues)}.
  * Return {tuple(responseKey, responseValue)}.

Every Object type is defined as a set of fields, each of which provides a return
type. {GetFieldTypeFromObjectType()} produces this type for a named field.

GetFieldTypeFromObjectType(objectType, fieldName):
  * Return the field type defined by {objectType} with the name {fieldName}.

While nearly all of GraphQL execution can be described generically, ultimately
the internal system exposing the GraphQL interface must provide values.
This is exposed via {ResolveFieldValue}, which produces a value for a given
field on a type for a real value.

As an example, this might accept the {objectType} `Person`, and the {fieldName}
{"soulMate"} and the {object} value representing John Lennon. It would be
expected to yield the value representing Yoko Ono.

Note: While described here in immediate procedural steps, it's common for this
operation to be asynchronous by relying on reading an underlying database or
networked service to produce a value. This necessitates the rest of a GraphQL
executor to handle an asynchronous execution flow.

ResolveFieldValue(objectType, field, object, variableValues):
  * Let {argumentValues} be the result of {CoerceArgumentValues(objectType, field, variableValues)}
  * Let {fieldName} be the name of {field}.
  * Call the internal function provided by {objectType} for determining the
    resolved value of a field named {fieldName} on a given {object}
    provided {argumentValues}.

When more than one fields of the same name are executed in parallel, their
selection sets are merged together to produce a single result.

An example query illustrating parallel fields with the same name:

```graphql
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

MergeSelectionSets(fields):
  * Let {selectionSet} be an empty list.
  * For each {field} in {fields}:
    * Let {fieldSelectionSet} be the selection set of {field}.
    * If {fieldSelectionSet} is null or empty, continue to the next field.
    * Append all selections in {fieldSelectionSet} to {selectionSet}.
  * Return {selectionSet}.

After resolving the value for a field, it is completed by ensuring it adheres
to the expected return type. If the return type is another Object type, then
the field execution process continues recursively.

CompleteValue(fieldType, result, subSelectionSet, variableValues):
  * If the {fieldType} is a Non-Null type:
    * Let {innerType} be the inner type of {fieldType}.
    * Let {completedResult} be the result of calling
      {CompleteValue(innerType, result, subSelectionSet)}.
    * If {completedResult} is {null}, throw a field error.
    * Return {completedResult}.
  * If {result} is {null} (or another internal value similar to {null} such as
    {undefined} or {NaN}), return {null}.
  * If {fieldType} is a List type:
    * If {result} is not a collection of values, throw a field error.
    * Let {innerType} be the inner type of {fieldType}.
    * Return a list where each item is the result of calling
      {CompleteValue(innerType, resultItem, subSelectionSet)}, where
      {resultItem} is each item in {result}.
  * If {fieldType} is a Scalar or Enum type:
    * Return the result of "coercing" {result}, ensuring it is a legal value of
      {fieldType}, otherwise {null}.
  * If {fieldType} is an Object, Interface, or Union type:
    * If {fieldType} is an Object type.
      * Let {objectType} be {fieldType}.
    * Otherwise if {fieldType} is an Interface or Union type.
      * Let {objectType} be ResolveAbstractType({fieldType}, {result}).
    * Return the result of evaluating ExecuteSelectionSet(subSelectionSet, objectType, result, variableValues) *normally* (allowing for parallelization).

When completing a field with an abstract return type, that is an Interface or
Union return type, first the abstract type must be resolved to a relevant Object
type. This determination is made by the internal system using whatever
means appropriate.

Note: A common method of determining the Object type for an {objectValue} in
object-oriented environments, such as Java or C#, is to use the class name of
the {objectValue}.

ResolveAbstractType(abstractType, objectValue):
  * Return the result of calling the internal method provided by the type
    system for determining the Object type of {abstractType} given the
    value {objectValue}.

### Nullability

If the result of resolving a field is `null` (either because the function to
resolve the field returned `null` or because an error occurred), and that
field is of a `Non-Null` type, then a field error is thrown.

If the field was `null` because of an error which has already been added to the
`"errors"` list in the response, the `"errors"` list must not be
further affected.

If the field resolve function returned `null`, the resulting field error must be
added to the `"errors"` list in the response.


### Error Handling

If an error occurs when resolving a field, it should be treated as though
the field returned `null`, and an error must be added to the `"errors"` list
in the response.

However, if the type of that field is of a `Non-Null` type, since the field
cannot be `null` the error is propagated to be dealt with by the parent field.

If all fields from the root of the request to the source of the error return
`Non-Null` types, then the `"data"` entry in the response should be `null`.


### Coercing Field Arguments

Fields may include arguments which are provided to the underlying runtime in
order to correctly produce a value. These arguments are defined by the field in
the type system to have a specific input type: Scalars, Enum, Input Object, or
List or Non-Null wrapped variations of these three.

At each argument position in a query may be a literal value or a variable to be
provided at runtime.

CoerceArgumentValues(objectType, field, variableValues)
  * Let {argumentValues} be the argument values provided in {field}.
  * Let {fieldName} be the name of {field}.
  * Let {argumentDefinitions} be the arguments defined by {objectType} for the
    field named {fieldName}.
  * Let {coercedArgumentValues} be an empty Map.
  * For each {argumentDefinitions} as {argumentName} and {argumentType}:
    * If no value was provided in {argumentValues} for the name {argumentName}:
      * Continue to the next argument definition.
    * Let {value} be the value provided in {argumentValues} for the name {argumentName}.
    * If {value} is a Variable:
      * If a value exists in {variableValues} for the Variable {value}:
        * Add an entry to {coercedArgumentValues} named {argName} with the
          value of the Variable {value} found in {variableValues}.
    * Otherwise:
      * Let {coercedValue} be the result of coercing {value} according to the
        input coercion rules of {argType}.
      * Add an entry to {coercedArgumentValues} named {argName} with the
        value {coercedValue}.
  * Return {coercedArgumentValues}.

Note: Variable values are not coerced because they are expected to be coerced
based on the type of the variable, and valid queries must only allow usage of
variables of appropriate types.
