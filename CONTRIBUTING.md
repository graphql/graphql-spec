# Stages for changes to the GraphQL Specification

> **Document status:** [Draft](https://github.com/facebook/graphql/pull/342)

This document describes the stages required for merging changes to the
GraphQL Specification. These stages are intended to:

+ Be as flexible as possible.
+ Define a clear process for getting changes into the specification.
+ Provide visibility for participants in the GraphQL ecosystem into the
status and progress of proposals.
+ Encourage community discussion around the proposed changes.

Any changes to the specification that affect the behavior of **GraphQL server
or client implementations** should go through the stages below no matter how
small they are. All other changes should be labeled as “editorial” and may
be merged right away.  Also, please read the [Code of Conduct](CODE_OF_CONDUCT.md)
to know what is expected when making contributions to this project.

## Stage -2: proposed change (optional)

**Prerequisite**: Described problem/change should be specific to the content of
GraphQL Specification and not be an implementation detail.

**Purpose**: Filter out questions and issues for other repos, and engage community
discussion.

## Stage -1: PR requested (optional)

**Prerequisite**: Issue should contain description of problem or use case and
proposed solution.

**Purpose**: Find member of community to be champion for this change.

## Stage 0: Proposal

**Prerequisite**:
+ Initial version of spec changes.
+ Filled checklist ([TBD](https://youtu.be/mePT9MNTM98?t=20m32s)) in PR description.

**Steps**: Start review process.

**Post-Acceptance Changes Expected**: Major.

## Stage 1: Draft

**Prerequisite**:
+ Finalized wording inside specification document.
+ Proposed spec changes don’t have any blind spots (undescribed edge-cases,
missed changes to related part of spec, etc).

**Steps**: Start working on [graphql-js](https://github.com/graphql/graphql-js)
PR

**Post-Acceptance Changes Expected**: Incremental.

## Stage 2: Candidate

**Prerequisite**:
+ Prepared PR for graphql-js.
+ Notify all members of [GraphQL WG](https://github.com/graphql/graphql-wg).
+ Community consent on the proposed change. If it’s hard to achieve, add it to
agenda of the next WG meeting.
+ No changes to the graphql and graphql-js PRs for at least last 7 days.

**Steps**: Merge graphql-js PR and release NPM package

**Post-Acceptance Changes Expected**: Only those deemed critical based on
implementation experience.

## Stage 3: Merged

**Prerequisite**:
+ At least one month since release of the graphql-js with proposed change.
+ Community consent on proposed change. If it’s hard to achieve add to agenda of
the next WG meeting..

**Steps**: Merge PR into “master” branch.

**Post-Acceptance Changes Expected**: None.
