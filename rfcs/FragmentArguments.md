## RFC: Fragment Arguments

# Problem: Variable Modularity

GraphQL fragments are designed to allow a client's data requirements to compose.
Two different screens can use the same underlying UI component. If that
component has a corresponding fragment, then each of those screens can include
exactly the data required by having each query spread the child component's
fragment.

This modularity begins to break down for variables. As an example, let's imagine
a FriendsList component that shows a variable number of friends. We would have a
fragment for that component like so:

```
fragment FriendsList on User {
  friends(first: $nFriends) {
    name
  }
}
```

In one use, we might want to show some screen-supplied number of friends, and in
another the top 10. For example:

```
fragment AnySizedFriendsList on User {
  name
  ...FriendsList
}

fragment TopFriendsUserProfile on User {
  name
  profile_picture { uri }
  ...FriendsList
}
```

Even though every usage of `TopFriendsUserProfile` should be setting `$nFriends`
to `10`, the only way to enforce that is by manually walking all callers of
`TopFriendsUserProfile`, recursively, until you arrive at the operation
definition and verify the variable is defined like `$nFriends: Int = 10`.

This causes a few major usability problems:

- If I ever want to change the number of items `TopFriendsUserProfile` includes,
  I now need to update every _operation_ that includes it. This could be dozens
  or hundreds of individual locations.
- Even if the component for `TopFriendsUserProfile` is only able to display 10
  friends, in most clients at runtime the user can override the default value,
  enabling a mismatch between the data required and the data asked for.

# Existing Solution: Relay's `@arguments`/`@argumentDefinitions`

Relay has a solution for this problem by using a custom, non-spec-compliant pair
of directives,
[`@arguments`/`@argumentDefinitions`](https://relay.dev/docs/api-reference/graphql-and-directives/#arguments).

These directives live only in user-facing GraphQL definitions, and are compiled
away prior to making a server request.

Following the above example, if we were using Relay we'd be able to write:

```
fragment FriendsList on User @argumentDefinitions(nFriends: {type: "Int!"}) {
  friends(first: $nFriends) {
    name
  }
}

fragment AnySizedFriendsList on User {
  name
  ...FriendsList @arguments(nFriends: $operationProvidedFriendCount)
}

fragment TopFriendsUserProfile on User {
  name
  profile_picture { uri }
  ...FriendsList @arguments(nFriends: 10)
}
```

Before sending a query to the server, Relay compiles away these directives so
the server, when running an operation using `TopFriendsUserProfile`, sees:

```
fragment FriendsList on User {
  friends(first: 10) {
    name
  }
}

fragment TopFriendsUserProfile on User {
  name
  profile_picture { uri }
  ...FriendsList
}
```

The exact mechanics of how Relay rewrites the user-written operation based on
`@arguments` supplied is not the focus of this RFC.

However, even to enable this client-compile-time operation transformation, Relay
had to introduce _non-compliant directives_: each argument to `@arguments`
changes based on the fragment the directive is applied to. While syntactically
valid, this fails the
[Argument Names validation](https://spec.graphql.org/draft/#sec-Argument-Names).

Additionally, the `@argumentDefinitions` directive gets very verbose and unsafe,
using strings to represent variable type declarations.

Relay has supported `@arguments` in its current form since
[v2.0](https://github.com/facebook/relay/releases/tag/v2.0.0), released in
January 2019. There's now a large body of evidence that allowing fragments to
define arguments that can be passed into fragment spreads is a significant
usability improvement, and valuable to the wider GraphQL community. However, if
we are to introduce this notion more broadly, we should make sure the ergonomics
of it conform to users' expectations.

# Proposal: Introduce Fragment Argument Definitions, which allow using arguments on Fragment Spreads

Relay's `@arguments`/`@argumentDefinitions` concepts provide value, and can be
applied against GraphQL written for existing GraphQL servers so long as there is
a pre-server compiler which transforms the concept away.

## New Fragment Argument Definition syntax

For the `@argumentDefinitions` concept, we can allow fragments to share the same
syntax as operation level definitions. Going back to the previous example, this
would look like:

```
fragment FriendsList($nFriends: Int!) on User {
  friends(first: $nFriends) {
    name
  }
}
```

The syntax re-uses the concepts from Variable Definitions, so that when you
_define_ and _use_ the argument, it preserves the same appearance (`$` + name).

## New Fragment Spread Argument syntax

For the `@arguments` concept, we can allow fragment spreads to share the same
syntax as field and directive arguments.

```
fragment AnySizedFriendsList on User {
  name
  ...FriendsList(nFriends: $operationProvidedFriendCount)
}

fragment TopFriendsUserProfile on User {
  name
  profile_picture { uri }
  ...FriendsList(nFriends: 10)
}
```

This may feel a little weird: for fields, arguments are defined as
`argName: Type` and then used like `...Foo(argName: $variable)`. The
alternatives here are:

- Define `argName: Type` for fragment arguments
  - This has the disadvantage of seeing both the argument definition and the
    argument usage in the same fragment with different styles.
- Call `...Foo($argName: $variable)`
  - This feels incredibly confusing: `$` typically means "replace this token
    with a value", and that's not what's happening.

Notably, this proposed syntax, of using `$name` at the definition and usage
site, and `name:` when calling the Fragment/Function, is the convention that PHP
uses for
[Named Arguments](https://www.php.net/manual/en/functions.arguments.php#functions.named-arguments).
Given GraphQL was designed with many PHP-isms, it seems like we should re-use
the conventions chosen there when there's no clear reason not to.

## Scope: Local

Fragment Arguments should always have local scope. This gets us closer to the
idea that while operations are "global", fragments behave more like well-scoped
functions.

This has a bunch of beneficial side effects:

- For validation, we don't need ot check for fragment argument definition
  clashes
- For composability, I can use the same argument on many fragments and not worry
  about unrelated fragments.
- For ease-of-understanding, you don't need to keep track of how all child
  fragments use a fragment argument to understand how changing something like
  the default value will modify the results.
- Makes it easy to update Variables In Allowed Positions, as we don't need to
  hunt the definition of a variable across many potential parent fragments.

The other scoping options are:

- Global, i.e. a fragment argument is just syntactic sugar for an operation
  variable.
  - This is what we implemented at Meta, and it was terrible for all the reasons
    you can think of.
- Recursively local, i.e. the variable takes on any parent fragment argument
  definition
  - This preserves the concept of the value being some sort of recursively
    scoped variable.
  - However, as explained above, keeping track of what's happening, and
    preventing fragment conflicts, becomes really difficult.

We're choosing to explicitly _allow_ overriding operation variables, as the
local scope means you can clearly see whether a variable is scoped to the
fragment or operation.

## New Validation Rule: Fragment Argument Definitions Used in Fragment

With local scope, this rule is very simple.

```
fragment Foo($x: Int) on User {
  name
}
```

would be invalid.

Additionally,

```
fragment Foo($x: Int!) on User {
  ...Bar
}

fragment Bar {
  number(x: $x)
}
```

would also be invalid: even though `$x` is used underneath Foo, it is used
outside of Foo's explicit definition. In this context, `$x` in Bar is actually
an operation variable.

However, this would be valid:

```
fragment Foo($x: Int!) on User {
  ...Bar(x: $x)
}

fragment Bar($x: Int) {
  number(x: $x)
}
```

### Consideration: how strict should this rule be?

As an initial RFC, I'd advocate for encouraging the _strictest_ version of this
rule possible: any argument defined on a fragment must be explicitly used by
that same fragment. It would be easy to relax the rule later, but very difficult
to do the reverse.

It's clearly more composable if, when changing a child fragment, you don't need
to worry about modifying argument definitions on parent fragments callsites.
However, we could in the future allow annotating argument definitions with
`@deprecated`.

## Updated Validation Rule: Required Arguments are Provided

We update
[Required Arguments](https://spec.graphql.org/draft/#sec-Required-Arguments) to
include fragment spreads. This makes the validation's first two bullets:

- For each Field, **Fragment Spread** or Directive in the document.
- Let _arguments_ be the set of argument definitions of that Field, **Fragment**
  or Directive.

With this rule, the below example is invalid, even if the argument
`User.number(x:)` is nullable in the schema.

```
fragment Foo on User {
  ...Bar
}

fragment Bar($x: Int!) on User {
  number(x: $x)
}
```

### Potential Alternative: Default Value indicates _required or not_, and `!` indicates _non-null or nullable_.

If we were writing the language from scratch, I'd advocate for making _all_
argument definitions without a default value to be required, regardless of their
nullability. If you want to make a nullable argument optional, you do so by
adding a `= null` to its definition.

In short, if I define:

```
fragment Bar($x: Int) { number(x: $x) }
```

then `...Bar` would be **invalid**.

However, that's not how operation variables, field arguments, directive
arguments or input object fields work today, no matter how much I might wish it.
For this RFC, I'm making the meaning of "required" and "nullable" for fragment
spread arguments the same as all other inputs, because doing something
_different_ would be more confusing IMO, even if that difference would lead to
unvalidated fewer foot guns.

## Updated Validation: Overlapping Fields Can Be Merged

Previously, fragment spreads didn't have to be considered as unique selections
in the overlapping field merging algorithm. However, in practice the algorithm,
but not the spec, still de-duplicated common fragment spreads.

With this change, we can just treat deduplicated fragment spreads as being keyed
by (name, arguments) rather than just by name. When visiting child selections,
we need to apply any fragment argument values (basically replace them with
either variable or const values), and then any time we encounter duplicated
fragment spreads with different arguments within merging selections, we consider
that invalid.

We _could_ just allow field merging rules to apply, but stopping the validation
when same-named fragment spreads with different args are discovered helps
provide much better error messaging and root-causes the issue: the issue isn't
that you reached the same field in the same fragment twice, but rather than you
reached the same fragment spread with different arguments, which will induce
those two usages to be merging the same field with different arguments.

## WILL NOT IMPLEMENT Validation Rule: Document Argument Uniqueness

If the client pre-server compiler rewrites an operation, it's possible to end up
with a selection set that violates
[Field Selection Merging](https://spec.graphql.org/draft/#sec-Field-Selection-Merging)
validation. Additionally, we have no mechanism on servers today to handle the
same fragment having different variable values depending on that fragment's
location in an operation.

Therefore, any Fragment Spread for the same Fragment in an Operation could be
required to have non-conflicting argument values passed in.

As an example, this is invalid:

```
query {
  user {
    best_friend {
      ...UserProfile(imageSize: 100)
    }
    ...UserProfile(imageSize: 200)
  }
}
```

Note: today Relay's compiler handles this ambiguity. In an extreme
simplification, this is done by producing two unique versions of `UserProfile`,
where in `UserProfile_0` `$imageSize` is replaced with `100`, and in
`UserProfile_1` `$imageSize` is replaced with `200`. However, there exist client
implementations that are unable to have multiple applications of the same
fragment within a single operation (the clients I work on cannot use Relay's
trick).

This validation rule is more strict than necessary: the graphql-js
implementation did not require it, given the Overlapping Fields Can Be Merged
changes that protect against mis-merged fields.

This validation rule may end up being more strict than required, but it would be easier to relax the rule than make it more strict later.

# Implementation

This proposal is implemented completely in
[graphql-js](https://github.com/graphql/graphql-js/pull/3152)

## Initial Implementation

In the initial implementation, I tried to change as little as possible. This
means I only added a single new validation rule. Additionally, there may be some
weirdness around internal grammar and AST node naming/usage, but the actual
behavior should be feature complete.
