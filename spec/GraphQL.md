GraphQL
-------

*Current Working Draft*

**Introduction**

This is a Draft RFC Specification for GraphQL, a query language created by
Facebook in 2012 for describing the capabilities and requirements of data models
for client-server applications. The development of this standard started
in 2015. GraphQL is a new and evolving language and is not complete. Significant
enhancement will continue in future editions of this specification.

Previous releases of the GraphQL specification can be found at permalinks that
match their [release tag](https://github.com/facebook/graphql/releases).

**Copyright notice**

Copyright © 2015-present, Facebook, Inc.

As of September 26, 2017, the following persons or entities have made this
Specification available under the Open Web Foundation Final Specification
Agreement (OWFa 1.0), which is available at [openwebfoundation.org](http://www.openwebfoundation.org/legal/the-owf-1-0-agreements/owfa-1-0).

Facebook, Inc.

You can review the signed copies of the Open Web Foundation Final Specification
Agreement Version 1.0 for this specification at [github.com/facebook/graphql](https://github.com/facebook/graphql/tree/master/signed-agreements),
which may also include additional parties to those listed above.

Your use of this Specification may be subject to other third party rights.
THIS SPECIFICATION IS PROVIDED “AS IS.” The contributors expressly disclaim any
warranties (express, implied, or otherwise), including implied warranties of
merchantability, non-infringement, fitness for a particular purpose, or title,
related to the Specification. The entire risk as to implementing or otherwise
using the Specification is assumed by the Specification implementer and user.
IN NO EVENT WILL ANY PARTY BE LIABLE TO ANY OTHER PARTY FOR LOST PROFITS OR ANY
FORM OF INDIRECT, SPECIAL, INCIDENTAL, OR CONSEQUENTIAL DAMAGES OF ANY CHARACTER
FROM ANY CAUSES OF ACTION OF ANY KIND WITH RESPECT TO THIS SPECIFICATION OR ITS
GOVERNING AGREEMENT, WHETHER BASED ON BREACH OF CONTRACT, TORT (INCLUDING
NEGLIGENCE), OR OTHERWISE, AND WHETHER OR NOT THE OTHER PARTY HAS BEEN ADVISED
OF THE POSSIBILITY OF SUCH DAMAGE.


**Conformance**

A conforming implementation of GraphQL must fulfill all normative requirements.
Conformance requirements are described in this document via both
descriptive assertions and key words with clearly defined meanings.

The key words "MUST", "MUST NOT", "REQUIRED", "SHALL", "SHALL NOT", "SHOULD",
"SHOULD NOT", "RECOMMENDED", "MAY", and "OPTIONAL" in the normative portions of
this document are to be interpreted as described in [IETF RFC 2119](https://tools.ietf.org/html/rfc2119).
These key words may appear in lowercase and still retain their meaning unless
explicitly declared as non-normative.

A conforming implementation of GraphQL may provide additional functionality,
but must not where explicitly disallowed or would otherwise result
in non-conformance.


**Conforming Algorithms**

Algorithm steps phrased in imperative grammar (e.g. "Return the result of
calling resolver") are to be interpreted with the same level of requirement as
the algorithm it is contained within. Any algorithm referenced within an
algorithm step (e.g. "Let completedResult be the result of calling
CompleteValue()") is to be interpreted as having at least the same level of
requirement as the algorithm containing that step.

Conformance requirements expressed as algorithms can be fulfilled by an
implementation of this specification in any way as long as the perceived result
is equivalent. Algorithms described in this document are written to be easy to
understand. Implementers are encouraged to include equivalent but
optimized implementations.


**Non-Normative Portions**

All contents of this document are normative except portions explicitly
declared as non-normative.

Examples in this document are non-normative, and are presented to aid
understanding of introduced concepts and the behavior of normative portions of
the specification. Examples are either introduced explicitly in prose
(e.g. "for example") or are set apart in example or counter-example blocks,
like this:

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


# [Overview](Section 1 -- Overview.md)

# [Language](Section 2 -- Language.md)

# [Type System](Section 3 -- Type System.md)

# [Introspection](Section 4 -- Introspection.md)

# [Validation](Section 5 -- Validation.md)

# [Execution](Section 6 -- Execution.md)

# [Response](Section 7 -- Response.md)

# [Appendix: Notation Conventions](Appendix A -- Notation Conventions.md)

# [Appendix: Grammar Summary](Appendix B -- Grammar Summary.md)
