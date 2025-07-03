# D. Appendix: Conformance & Licensing

## Conformance

A conforming implementation of GraphQL must fulfill all normative requirements.
Conformance requirements are described in this document via both descriptive
assertions and key words with clearly defined meanings.

The key words "MUST", "MUST NOT", "REQUIRED", "SHALL", "SHALL NOT", "SHOULD",
"SHOULD NOT", "RECOMMENDED", "MAY", and "OPTIONAL" in the normative portions of
this document are to be interpreted as described in
[IETF RFC 2119](https://tools.ietf.org/html/rfc2119). These key words may appear
in lowercase and still retain their meaning unless explicitly declared as
non-normative.

A conforming implementation of GraphQL may provide additional functionality, but
must not where explicitly disallowed or would otherwise result in
non-conformance.

**Conforming Algorithms**

Algorithm steps phrased in imperative grammar (e.g. "Return the result of
calling resolver") are to be interpreted with the same level of requirement as
the algorithm it is contained within. Any algorithm referenced within an
algorithm step (e.g. "Let completedResult be the result of calling
CompleteValue()") is to be interpreted as having at least the same level of
requirement as the algorithm containing that step.

Conformance requirements expressed as algorithms and data collections can be
fulfilled by an implementation of this specification in any way as long as the
perceived result is equivalent. Algorithms described in this document are
written to be easy to understand. Implementers are encouraged to include
equivalent but optimized implementations.

See [Appendix A](#sec-Appendix-Notation-Conventions) for more details about the
definition of algorithms, data collections, and other notational conventions
used in this document.

**Non-Normative Portions**

All contents of this document are normative except portions explicitly declared
as non-normative.

Examples in this document are non-normative, and are presented to aid
understanding of introduced concepts and the behavior of normative portions of
the specification. Examples are either introduced explicitly in prose (e.g. "for
example") or are set apart in example or counter-example blocks, like this:

```example
This is an example of a non-normative example.
```

```counter-example
This is an example of a non-normative counter-example.
```

Notes in this document are non-normative, and are presented to clarify intent,
draw attention to potential edge-cases and pit-falls, and answer common
questions that arise during implementation. Notes are either introduced
explicitly in prose (e.g. "Note: ") or are set apart in a note block, like this:

Note: This is an example of a non-normative note.

## [LICENSE](../LICENSE.md)
