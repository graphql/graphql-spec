# Execution

This section describes how GraphQL generates a response from a request.

## Evaluating requests

To evaluate a request, the executor must have a parsed `Document` (as defined
in the “Query Language” part of this spec) and a selected operation name to
run if the document defines multiple operations.

The executor should find the `Operation` in the `Document` with the given
operation name. If no such operation exists, the executor should throw an
error. If the operation is found, then the result of evaluating the request
should be the result of evaluating the operation according to the “Evaluating
operations” section.

## Coercing Variables

If the operation has defined any variables, then the values for
those variables need to be coerced using the input coercion rules
of variable's declared type. If a query error is encountered during
input coercion of variable values, then the operation fails without
execution.

## Evaluating operations

The type system, as described in the “Type System” part of the spec, must
provide a “Query Root” and a “Mutation Root” object.

If the operation is a mutation, the result of the operation is the result of
evaluating the mutation’s top level selection set on the “Mutation Root”
object. This selection set should be evaluated serially.

If the operation is a query, the result of the operation is the result of
evaluating the query’s top level selection set on the “Query Root” object.

## Evaluating selection sets

To evaluate a selection set, the executor needs to know the object on which it
is evaluating the set and whether it is being evaluated serially.

If the selection set is being evaluated on the `null` object, then the result
of evaluating the selection set is `null`.

Otherwise, the selection set is turned into a grouped field set; each entry in
the grouped field set is a list of fields that share a responseKey.

The selection set is converted to a grouped field set by calling
`CollectFields`, initializing `visitedFragments` to an empty list.

CollectFields(objectType, selectionSet, visitedFragments):

  * Initialize {groupedFields} to an empty list of lists.
  * For each {selection} in {selectionSet};
    * If {selection} provides the directive `@skip`, let {skipDirective} be that directive.
      * If {skipDirective}'s {if} argument is {true}, continue with the
        next {selection} in {selectionSet}.
    * If {selection} provides the directive `@include`, let {includeDirective} be that directive.
      * If {includeDirective}'s {if} argument is {false}, continue with the
        next {selection} in {selectionSet}.
    * If {selection} is a Field:
      * Let {responseKey} be the response key of {selection}.
      * Let {groupForResponseKey} be the list in {groupedFields} for
        {responseKey}; if no such list exists, create it as an empty list.
      * Append {selection} to the {groupForResponseKey}.
    * If {selection} is a FragmentSpread:
      * Let {fragmentSpreadName} be the name of {selection}.
      * If {fragmentSpreadName} is in {visitedFragments}, continue with the
        next {selection} in {selectionSet}.
      * Add {fragmentSpreadName} to {visitedFragments}.
      * Let {fragment} be the Fragment in the current Document whose name is
        {fragmentSpreadName}.
      * If no such {fragment} exists, continue with the next {selection} in
        {selectionSet}.
      * Let {fragmentType} be the type condition on {fragment}.
      * If {doesFragmentTypeApply(objectType, fragmentType)} is false, continue
        with the next {selection} in {selectionSet}.
      * Let {fragmentSelectionSet} be the top-level selection set of {fragment}.
      * Let {fragmentGroupedFields} be the result of calling
        {CollectFields(objectType, fragmentSelectionSet)}.
      * For each {fragmentGroup} in {fragmentGroupedFields}:
        * Let {responseKey} be the response key shared by all fields in {fragmentGroup}
        * Let {groupForResponseKey} be the list in {groupedFields} for
          {responseKey}; if no such list exists, create it as an empty list.
        * Append all items in {fragmentGroup} to {groupForResponseKey}.
    * If {selection} is an inline fragment:
      * Let {fragmentType} be the type condition on {selection}.
      * If {fragmentType} is not {null} and {doesFragmentTypeApply(objectType, fragmentType)} is false, continue
        with the next {selection} in {selectionSet}.
      * Let {fragmentSelectionSet} be the top-level selection set of {selection}.
      * Let {fragmentGroupedFields} be the result of calling {CollectFields(objectType, fragmentSelectionSet)}.
      * For each {fragmentGroup} in {fragmentGroupedFields}:
        * Let {responseKey} be the response key shared by all fields in {fragmentGroup}
        * Let {groupForResponseKey} be the list in {groupedFields} for
          {responseKey}; if no such list exists, create it as an empty list.
        * Append all items in {fragmentGroup} to {groupForResponseKey}.
  * Return {groupedFields}.

doesFragmentTypeApply(objectType, fragmentType):

  * If {fragmentType} is an Object Type:
    * if {objectType} and {fragmentType} are the same type, return {true}, otherwise return {false}.
  * If {fragmentType} is an Interface Type:
    * if {objectType} is an implementation of {fragmentType}, return {true} otherwise return {false}.
  * If {fragmentType} is a Union:
    * if {objectType} is a possible type of {fragmentType}, return {true} otherwise return {false}.

The result of evaluating the selection set is the result of evaluating the
corresponding grouped field set. The corresponding grouped field set should be
evaluated serially if the selection set is being evaluated serially, otherwise
it should be evaluated normally.

## Evaluating a grouped field set

The result of evaluating a grouped field set will be an unordered map. There
will be an entry in this map for every item in the grouped field set.

### Field entries

Each item in the grouped field set can potentially create an entry in the
result map. That entry in the result map is the result of calling
`GetFieldEntry` on the corresponding item in the grouped field set.
`GetFieldEntry` can return `null`, which indicates that there should be no
entry in the result map for this item. Note that this is distinct from
returning an entry with a string key and a null value, which indicates that an
entry in the result should be added for that key, and its value should be null.

`GetFieldEntry` assumes the existence of two functions that are not defined in
this section of the spec. It is expected that the type system provides these
methods:

 * `ResolveFieldOnObject`, which takes an object type, a field, and an object,
   and returns the result of resolving that field on the object.
 * `GetFieldTypeFromObjectType`, which takes an object type and a field, and
   returns that field's type on the object type, or `null` if the field is not
   valid on the object type.

GetFieldEntry(objectType, object, fields):

  * Let {firstField} be the first entry in the ordered list {fields}. Note that
    {fields} is never empty, as the entry in the grouped field set would not
    exist if there were no fields.
  * Let {responseKey} be the response key of {firstField}.
  * Let {fieldType} be the result of calling
    {GetFieldTypeFromObjectType(objectType, firstField)}.
  * If {fieldType} is {null}, return {null}, indicating that no entry exists in
    the result map.
  * Let {resolvedObject} be {ResolveFieldOnObject(objectType, object, fieldEntry)}.
  * If {resolvedObject} is {null}, return {tuple(responseKey, null)},
    indicating that an entry exists in the result map whose value is `null`.
  * Let {subSelectionSet} be the result of calling {MergeSelectionSets(fields)}.
  * Let {responseValue} be the result of calling {CompleteValue(fieldType, resolvedObject, subSelectionSet)}.
  * Return {tuple(responseKey, responseValue)}.

GetFieldTypeFromObjectType(objectType, firstField):
  * Call the method provided by the type system for determining the field type
    on a given object type.

ResolveFieldOnObject(objectType, object, firstField):
  * Call the method provided by the type system for determining the resolution
    of a field on a given object.

MergeSelectionSets(fields):
  * Let {selectionSet} be an empty list.
  * For each {field} in {fields}:
    * Let {fieldSelectionSet} be the selection set of {field}.
    * If {fieldSelectionSet} is null or empty, continue to the next field.
    * Append all selections in {fieldSelectionSet} to {selectionSet}.
  * Return {selectionSet}.

CompleteValue(fieldType, result, subSelectionSet):
  * If the {fieldType} is a Non-Null type:
    * Let {innerType} be the inner type of {fieldType}.
    * Let {completedResult} be the result of calling {CompleteValue(innerType, result)}.
    * If {completedResult} is {null}, throw a field error.
    * Return {completedResult}.
  * If {result} is {null} or a value similar to {null} such as {undefined} or
    {NaN}, return {null}.
  * If {fieldType} is a List type:
    * If {result} is not a collection of values, throw a field error.
    * Let {innerType} be the inner type of {fieldType}.
    * Return a list where each item is the result of calling
      {CompleteValue(innerType, resultItem)}, where {resultItem} is each item
      in {result}.
  * If {fieldType} is a Scalar or Enum type:
    * Return the result of "coercing" {result}, ensuring it is a legal value of
      {fieldType}, otherwise {null}.
  * If {fieldType} is an Object, Interface, or Union type:
    * If {fieldType} is an Object type.
      * Let {objectType} be {fieldType}.
    * Otherwise if {fieldType} is an Interface or Union type.
      * Let {objectType} be ResolveAbstractType(fieldType, result).
    * Return the result of evaluating {subSelectionSet} on {objectType} normally.

ResolveAbstractType(abstractType, objectValue):
  * Return the result of calling the internal method provided by the type
    system for determining the Object type of {abstractType} given the
    value {objectValue}.

### Normal evaluation

When evaluating a grouped field set without a serial execution order requirement,
the executor can determine the entries in the result map in whatever order it
chooses. Because the resolution of fields other than top-level mutation fields
is always side effect&ndash;free and idempotent, the execution order must not
affect the result, and hence the server has the freedom to evaluate the field
entries in whatever order it deems optimal.

For example, given the following grouped field set to be evaluated normally:

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

### Serial execution

Observe that based on the above sections, the only time an executor will run in
serial execution order is on the top level selection set of a mutation
operation and on its corresponding grouped field set.

When evaluating a grouped field set serially, the executor must consider each entry
from the grouped field set in the order provided in the grouped field set. It must
determine the corresponding entry in the result map for each item to completion
before it continues on to the next item in the grouped field set:

For example, given the following selection set to be evaluated serially:

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

 - Run `getFieldEntry` for `changeBirthday`, which during `CompleteValue` will
   evaluate the `{ month }` sub-selection set normally.
 - Run `getFieldEntry` for `changeAddress`, which during `CompleteValue` will
   evaluate the `{ street }` sub-selection set normally.

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

The executor will evaluate the following serially:

 - Resolve the `changeTheNumber(newNumber: 1)` field
 - Evaluate the `{ theNumber }` sub-selection set of `first` normally
 - Resolve the `changeTheNumber(newNumber: 3)` field
 - Evaluate the `{ theNumber }` sub-selection set of `second` normally
 - Resolve the `changeTheNumber(newNumber: 2)` field
 - Evaluate the `{ theNumber }` sub-selection set of `third` normally

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

### Error handling

If an error occurs when resolving a field, it should be treated as though
the field returned null, and an error must be added to the "errors" list
in the response.

### Nullability

If the result of resolving a field is null (either because the function to
resolve the field returned null or because an error occurred), and that
field is marked as being non-null in the type system, then the result
of evaluating the entire field set that contains this field is now
null.

If the field was null because of an error, then the error has already been
logged, and the "errors" list in the response must not be affected.

If the field resolution function returned null, and the field was non-null,
then no error has been logged, so an appropriate error must be added to
the "errors" list.
