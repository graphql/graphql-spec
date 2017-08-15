# Stages for changes to GraphQL specification

> **Document status:** [Draft](https://github.com/facebook/graphql/pull/342)

This document describes set of stages required for merging changes to the
GraphQL specification. These stages are intended to:
+ Be as flexible as possible.
+ Define a clear process for getting changes into the specification.
+ Provide transparency for participants in the GraphQL ecosystem of the
status/progress of proposals.
+ Encourage community discussion around the proposed changes.

Any changes to a specification that affect behavior of **GraphQL server or
client implementation** should go through below stages no matter how small
it is. All other changes should be labeled as “editorial” and could be merged
right away.

## Stage -2: proposed change (optional)
**Prerequisite**: Described problem/change should be specific to the content of
GraphQL Specification and not be an implementation detail.

**Purpose**: Filter out questions, issues for other repos and engage community
discussion.

## Stage -1: PR requested (optional)
**Prerequisite**: Issue should contain description of problem/usecase and
proposed solution.

**Purpose**: Find member of community to be champion for this change.

## Stage 0: Proposal
**Prerequisite**:
+ Initial version of spec changes
+ Filled checklist (TBD) in PR description

**Steps**: start review process on specification changes

**Post-Acceptance Changes Expected**: Major

## Stage 1: Draft
**Prerequisite**:
+ Finalized wording inside Specification document
+ Proposed spec changes don’t have any blind spots (undescribed edge-cases,
missed changes to related part of spec, etc.)

**Steps**: start working on [graphql-js](https://github.com/graphql/graphql-js)
PR

**Post-Acceptance Changes Expected**: Incremental

## Stage 2: Candidate
**Prerequisite**:
+ Prepared PR for graphql-js
+ Notify all members of [GraphQL WG](https://github.com/graphql/graphql-wg)
+ Community consent on the proposed change. If it’s hard to achieve, add it to
agenda of the next WG meeting.
+ No changes to the graphql and graphql-js PRs for at least last 7 days

**Steps**: Merge graphql-js PR and release NPM package

**Post-Acceptance Changes Expected**: only those deemed critical based on
implementation experience

## Stage 3: Merged
**Prerequisite**:
+ At least one month since release of the graphql-js with proposed change
+ Community consent on proposed change. If it’s hard to achieve add to agenda of
the next WG meeting.

**Steps**: Merge PR into “master” branch

**Post-Acceptance Changes Expected**: none
