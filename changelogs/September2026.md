# September 2026 Changelog

This describes the set of changes since the last edition of the GraphQL
specification, [September2025](https://spec.graphql.org/September2025/) (see
[prior changelog](./September2025.md)). It's intended to ease the review of
changes since the last edition for reviewers or curious readers, but is not
normative. Please read the
[specification document](https://spec.graphql.org/September2026/) itself for
full detail and context.

## GraphQL beyond the specification

The way software is built is undergoing profound change, yet interoperability,
clear boundaries, and strong guard rails remain as important as ever. The
GraphQL specification is the beating heart of GraphQL: a reliable bedrock that
implementations share, yet one that can evolve without leaving users behind.
This year, we've been delighted to see so much work happening around that core.

The long-awaited [GraphQL over HTTP
specification](https://http-spec.graphql.org), launched alongside this release,
brings years of collaboration to an agreed standard for how clients and servers
communicate. With its draft already widely adopted, it builds on the patterns of
the past whilst extending them to make the most of the rich HTTP protocol. The
new [GraphQL Auxiliary Proposals (GAPs)](https://gaps.graphql.org/) project
gives the wider community a place to contribute and develop shared, optional
building blocks on top of GraphQL, covering everything from schema design to
client behaviors. The Federation working group, a strong collaboration between
many vendors, is hard at work developing a vendor-neutral approach to composing
GraphQL schemas with a focus on enabling communication and collaboration between
teams. The GraphQL OpenTelemetry working group has proposed [Semantic
Conventions for
GraphQL](https://github.com/open-telemetry/semantic-conventions/pull/3515), now
open for review. The [Golden Path](https://goldenpath.graphql.org) is exploring
the default experience we'd like libraries and frameworks to offer GraphQL
users, while the AI Working Group is considering how GraphQL fits into new ways
of building, delivering and consuming software. And that's not to mention all
the work going on across implementations, development tools, and websites!

It has been a privilege to see so many people contribute to the GraphQL
technologies over the last year. GraphQL remains a dependable foundation because
you continue to improve it, challenge it, and help it meet changing needs.

Thank you for your dedication, enthusiasm, and hard work!

- [@benjie](https://github.com/benjie) on behalf of the GraphQL TSC

## Contributors

Anyone is welcome to join working group meetings and contribute to the GraphQL
specification. See
[Contributing.md](https://github.com/graphql/graphql-spec/blob/main/CONTRIBUTING.md)
for more information. Thank you to these community members for their technical
contribution to this edition of the GraphQL specification.

| Author             | Github                                             |
| ------------------ | -------------------------------------------------- |
| Benjie             | [@benjie](https://github.com/benjie)               |
| Benoit 'BoD' Lubek | [@BoD](https://github.com/BoD)                     |
| Ivan Goncharov     | [@IvanGoncharov](https://github.com/IvanGoncharov) |
| James Bellenger    | [@jbellenger](https://github.com/jbellenger)       |
| janettec           | [@janettec](https://github.com/janettec)           |
| Kai Ren            | [@tyranron](https://github.com/tyranron)           |
| Lee Byron          | [@leebyron](https://github.com/leebyron)           |
| Martin Bonnin      | [@martinbonnin](https://github.com/martinbonnin)   |
| mmin               | [@MarkoMin](https://github.com/MarkoMin)           |
| Yaacov Rydzinski   | [@yaacovCR](https://github.com/yaacovCR)           |

## Notable contributions

A few notable changes in this edition:

- Directives now supported on directive definitions, including deprecation of directives ([#1206](https://graphql.org/graphql/graphql-spec/pull/1206))
- Empty selection sets now allowed, useful for client-side-only fields ([#1227](https://graphql.org/graphql/graphql-spec/pull/1227))
- OneOf input object definitions now validated to ensure they can be populated ([#1211](https://graphql.org/graphql/graphql-spec/pull/1211))
- Fragments now better defined to emphasize their intended use ([#1193](https://graphql.org/graphql/graphql-spec/pull/1193))
- Many editorial improvements removing ambiguities and improving clarity

## Changeset

- [GitHub: all Accepted RFC PRs merged since last spec cut](https://github.com/graphql/graphql-spec/pulls?q=is%3Apr+is%3Amerged+base%3Amain+merged%3A2025-09-03..2026-09-24+label%3A%22%F0%9F%8F%81+Accepted+%28RFC+3%29%22)
- [GitHub: all Editorial PRs merged since last spec cut](https://github.com/graphql/graphql-spec/pulls?page=1&q=is%3Apr+is%3Amerged+base%3Amain+merged%3A2025-09-03..2026-09-24+label%3A%22%E2%9C%8F%EF%B8%8F+Editorial%22)
- [GitHub: all changes since last spec cut](https://github.com/graphql/graphql-spec/compare/September2025...31608dbf6ec41e907b6be047ceebdb4fedbbe5ca)

Listed in reverse-chronological order (latest commit on top).

| Hash                                                                                               | Change                                                                            | Authors                                                                                                                                                            |
| -------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| [59bc70a](https://github.com/graphql/graphql-spec/commit/59bc70ac974b0d5d1e00869f41c06bb3bfc756da) | Define 'operation execution', clarifying 'before execution begins' (#894)         | Benjie <benjie@jemjie.com> Yaacov Rydzinski <yaacovCR@gmail.com> Martin Bonnin <martin@mbonnin.net> Benoit 'BoD' Lubek <BoD@JRAF.org> Lee Byron <lee@leebyron.com> |
| [6ab9475](https://github.com/graphql/graphql-spec/commit/6ab9475e6ea0aaf8b2e61c9fb71da02bab4b6f76) | Fix "response position" definition; clarify sibling errors on propagation (#1183) | Benjie <benjie@jemjie.com>                                                                                                                                         |
| [56fbeec](https://github.com/graphql/graphql-spec/commit/56fbeecdb0294177744e14fe5e37fca98aad1c0f) | Clarify definition of response position (#1238)                                   | Benjie <benjie@jemjie.com>                                                                                                                                         |
| [b4a3a20](https://github.com/graphql/graphql-spec/commit/b4a3a2071a9e1c1bad4f54300311db394d87dc77) | Allow empty selection sets (#1227)                                                | Benjie <benjie@jemjie.com>                                                                                                                                         |
| [c248c06](https://github.com/graphql/graphql-spec/commit/c248c06ffb2d710b179b8d6e86af7551af2747f2) | OneOf inhabitability (#1211)                                                      | James Bellenger <james.bellenger@airbnb.com> Benjie <benjie@jemjie.com> Lee Byron <lee@leebyron.com>                                                               |
| [bf95fc4](https://github.com/graphql/graphql-spec/commit/bf95fc4e578966fad74ef0909445e12bcd806b06) | Add support for directives on directive definitions (#1206)                       | Benoit 'BoD' Lubek <BoD@JRAF.org> Ivan Goncharov <ivan.goncharov.ua@gmail.com>                                                                                     |
| [1fe9b61](https://github.com/graphql/graphql-spec/commit/1fe9b61b3151251d4a09a8061fa55e1c5e929168) | fix: field selection set final values (#1212)                                     | mmin <marko.mindek@gmail.com> Benjie <benjie@jemjie.com>                                                                                                           |
| [3c6695c](https://github.com/graphql/graphql-spec/commit/3c6695ce9cba27a2b887efd1f0e06cb030731b7c) | Editorial: consistent field ordering in Circular References examples (#1214)      | James Bellenger <james.bellenger@airbnb.com>                                                                                                                       |
| [ff0d285](https://github.com/graphql/graphql-spec/commit/ff0d285289e1bd9c8c38d49743f94a90ce3e0bf3) | Fix format (#1210)                                                                | Martin Bonnin <martin@mbonnin.net>                                                                                                                                 |
| [61217f0](https://github.com/graphql/graphql-spec/commit/61217f05e1d940a85bf9355ed7dc9029bf939335) | Update description of Fragments to emphasize evolving data needs (#1193)          | janettec <janettelc@gmail.com> Lee Byron <lee@leebyron.com> Benjie <benjie@jemjie.com>                                                                             |
| [5dee82d](https://github.com/graphql/graphql-spec/commit/5dee82d218e47f17cc4af58050972fa0fb67b815) | Fix `includeDeprecated` arg type in "Appendix D" (#1192)                          | Kai Ren <tyranron@gmail.com> Martin Bonnin <martin@mbonnin.net>                                                                                                    |

Generated with:

```sh
git log September2025..31608dbf6ec41e907b6be047ceebdb4fedbbe5ca --format="[%h](https://github.com/graphql/graphql-spec/commit/%H) | %s | %an <%ae> %(trailers:key=Co-authored-by,valueonly,separator=%x20)" -- spec
```

## Diff

[GitHub: diff from last spec cut](https://github.com/graphql/graphql-spec/compare/September2025...31608dbf6ec41e907b6be047ceebdb4fedbbe5ca?w=1)

## Notes

This changeset was generated with the help of

```sh
yarn wgutils spec version --previous September2025 --current 31608dbf6ec41e907b6be047ceebdb4fedbbe5ca September2026
```
