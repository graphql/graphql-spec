# October2021 Changelog

This describes the set of changes since the last edition of the GraphQL
specification, [June2018](https://spec.graphql.org/June2018/). It's intended to
ease the review of changes since the last edition for reviewers or curious
readers, but is not normative. Please read the
[specification document](https://spec.graphql.org/October2021/) itself for full detail
and context.

## Authors

While many have participated in the design and review RFC process, this is the
set of authors and RFC champions who have committed directly to the
specification text in this edition:

| Author                          |
| ------------------------------- |
| [ab-pm]                         |
| [Andreas Marek]                 |
| [Antoine Boyer]                 |
| [António Nuno Monteiro]         |
| [Arun Ponniah Sethuramalingam]  |
| [Benedikt Franke]               |
| [Benjie Gillam]                 |
| [Brian Warner]                  |
| [Chris Brown]                   |
| [David Glasser]                 |
| [dugenkui]                      |
| [Edwin Shin]                    |
| [Evan Huus]                     |
| [Grant Wu]                      |
| [Görcsös Zoltán]                |
| [Ivan Goncharov]                |
| [Ivan Maximov]                  |
| [James Scott]                   |
| [Jamie Schouten]                |
| [Joe Duarte]                    |
| [Kei Kamikawa]                  |
| [Lee Byron]                     |
| [Loren Sands-Ramshaw]           |
| [Marais Rossouw]                |
| [Marc Knaup]                    |
| [Martin Bonnin]                 |
| [Matt Farmer]                   |
| [Matt Mahoney]                  |
| [Michael Joseph Rosenthal]      |
| [Mike Marcacci]                 |
| [Matthias Prechtl]              |
| [Pascal Senn]                   |
| [Sebastian Redl]                |
| [Tejas Kumar]                   |
| [Oleg Ilyenko]                  |

[ab-pm]: https://github.com/ab-pm
[Andreas Marek]: https://github.com/andimarek
[Antoine Boyer]: https://github.com/tinnou
[António Nuno Monteiro]: https://github.com/anmonteiro
[Arun Ponniah Sethuramalingam]: https://github.com/saponniah
[Benedikt Franke]: https://github.com/spawnia
[Benjie Gillam]: https://github.com/benjie
[Brian Warner]: https://github.com/brianwarner
[Chris Brown]: https://github.com/ccbrown
[David Glasser]: https://github.com/glasser
[dugenkui]: https://github.com/dugenkui03
[Edwin Shin]: https://github.com/eddies
[Evan Huus]: https://github.com/eapache
[Grant Wu]: https://github.com/grantwwu
[Görcsös Zoltán]: https://github.com/zgorcsos
[Ivan Goncharov]: https://github.com/IvanGoncharov
[Ivan Maximov]: https://github.com/sungam3r
[James Scott]: https://github.com/scottydocs
[Jamie Schouten]: https://github.com/maantje
[Joe Duarte]: https://github.com/JoeUX
[Kei Kamikawa]: https://github.com/Code-Hex
[Lee Byron]: https://github.com/leebyron
[Loren Sands-Ramshaw]: https://github.com/lorensr
[Marais Rossouw]: https://github.com/maraisr
[Marc Knaup]: https://github.com/fluidsonic
[Martin Bonnin]: https://github.com/martinbonnin
[Matt Farmer]: https://github.com/m14t
[Matt Mahoney]: https://github.com/mjmahone
[Michael Joseph Rosenthal]: https://github.com/micimize
[Mike Marcacci]: https://github.com/mike-marcacci
[Matthias Prechtl]: https://github.com/matprec
[Pascal Senn]: https://github.com/PascalSenn
[Sebastian Redl]: https://github.com/CornedBee
[Tejas Kumar]: https://github.com/TejasQ
[Oleg Ilyenko]: https://github.com/OlegIlyenko

Generated with:

```sh
git log June2018..HEAD --format="%an <%ae>%x0A%(trailers:key=Co-authored-by,valueonly)" -- spec | sort -uf
```

## Changes

Listed in reverse-chronological order (latest commit on top).

| Hash | Change | Authors |
| ---- | ------ | ------- |
| [ae1bab6](https://github.com/graphql/graphql-spec/commit/ae1bab6ff27cc331fc17c10af14ddd6b01512bf9) | Fix typo in Handling Field Errors (#876) | Antoine Boyer <antoineb19@gmail.com>
| [fdeb37d](https://github.com/graphql/graphql-spec/commit/fdeb37d4c9528c44c3834913944880dce9f4e8bd) | Updated legal copy (#869) | [Lee Byron], [Brian Warner]
| [50bbaa8](https://github.com/graphql/graphql-spec/commit/50bbaa8bb2503ef9b3c3477d53b266c9e8205a31) | Editorial: Improve Introspection section (#857) | [Lee Byron], [Ivan Maximov], [Benjie Gillam]
| [debcdc3](https://github.com/graphql/graphql-spec/commit/debcdc381b6173adbb89a800fd2a0009a3df8568) | Improve clarity of built-in directives  (#633) | [Ivan Maximov], [Lee Byron]
| [5b7b9f6](https://github.com/graphql/graphql-spec/commit/5b7b9f6415ec9861032ced3f061d6fab1406f376) | Add spellcheck to test suite (#858) | [Lee Byron]
| [086bb1f](https://github.com/graphql/graphql-spec/commit/086bb1f1a7f273b6d0787de525f1c23742374ae0) | Editorial: Define 'Schema Specification URL' (#856) | [Lee Byron]
| [40d025c](https://github.com/graphql/graphql-spec/commit/40d025ce5cb681454c0f6455c4d97e38313616d2) | fixed introspection field "specifiedBy" to "specifiedByURL" (#848) | [Kei Kamikawa], [Lee Byron]
| [61c50f2](https://github.com/graphql/graphql-spec/commit/61c50f28cb247539e4da930b5553d25ac3d8c792) | clarify that utf-8 is just a possible encoding of strings (#684) | [Andreas Marek], [Lee Byron]
| [d4777b4](https://github.com/graphql/graphql-spec/commit/d4777b428030347300f98873b5a760b5e29ae726) | Editorial: StringValue (#854) | [Lee Byron]
| [413b689](https://github.com/graphql/graphql-spec/commit/413b68974ef86b6cc8a9272bbc8360762eee3479) | RFC: __typename is not valid at subscription root (#776) | [Benjie Gillam], [Lee Byron]
| [9bb7b77](https://github.com/graphql/graphql-spec/commit/9bb7b777d0a5de26d94bb0e2993fdd4e22c13443) | Fix: Syntax highlighting in example (#851) | [Lee Byron]
| [c6eb911](https://github.com/graphql/graphql-spec/commit/c6eb91110f6f80550f8cac1c69de1c7808b93a21) | make clear that some String escape sequences are optional (#686) | [Andreas Marek], [Lee Byron]
| [044d1d4](https://github.com/graphql/graphql-spec/commit/044d1d459d5ed289a66422cc3a996a9265fe8efa) | Clarity in Section 3 (#847) | [Ivan Maximov]
| [a16d249](https://github.com/graphql/graphql-spec/commit/a16d2493f72020f63f3e689d61420c35944c953c) | State that built-in mandatory directives must be omitted (#816) | [Marais Rossouw], [Lee Byron]
| [d4a865a](https://github.com/graphql/graphql-spec/commit/d4a865adada9c78924cf29e1bc86d6ff6bcc5f15) | [RFC] Custom Scalar Specification URLs (#649) | [Evan Huus], [Matt Farmer], [Lee Byron]
| [9ec15e3](https://github.com/graphql/graphql-spec/commit/9ec15e365933caff4894aa640ac4c55f9f78e2de) | Spec edits to reduce "query ambiguity" (#777) | [Benjie Gillam], [Lee Byron]
| [f474e66](https://github.com/graphql/graphql-spec/commit/f474e666d6698f6fd061fafad862b977834a3d5b) | Editorial: Clarify meta-fields in introspection (#844) | [Lee Byron], [Benjie Gillam]
| [f8b75d3](https://github.com/graphql/graphql-spec/commit/f8b75d30970c75007f4418bf3e79112d65c2f187) | Editorial: Clarify document grammar rules (#840) | [Lee Byron]
| [0062610](https://github.com/graphql/graphql-spec/commit/0062610494be356b033b933023829fdbc7149a96) | Add CoerceResult() (#836) | [Lee Byron]
| [792671b](https://github.com/graphql/graphql-spec/commit/792671bcfc3d451514213b5f57d0f3dbe9068a9b) | __Type represents all types in the system (#775) | [Benjie Gillam], [Lee Byron]
| [d616285](https://github.com/graphql/graphql-spec/commit/d616285dad370ca4cf126482052e313a24249e1e) | Avoid parse ambiguity on type extensions (#598) | [Lee Byron]
| [adee896](https://github.com/graphql/graphql-spec/commit/adee896e83a01ba065e13df360d61eea225f2b8b) | Update 'Field Collection' explanation (#765) | [dugenkui]
| [c43d2f7](https://github.com/graphql/graphql-spec/commit/c43d2f7c8e706442662ccf95e6b7eaaeeab4b878) | Editorial: Clarify field aliases (#843) | [Lee Byron]
| [29bcc26](https://github.com/graphql/graphql-spec/commit/29bcc26766d7f62560bb5d760b39b14bc80063c4) | Editorial: Refine design principles (#839) | [Lee Byron]
| [567e05c](https://github.com/graphql/graphql-spec/commit/567e05cfa5fbe1405c652c5db0b4b65eca431cb1) | Editorial: Query shorthand (#841) | [Lee Byron]
| [2c2cea7](https://github.com/graphql/graphql-spec/commit/2c2cea7327fe8c01a819f7bf9ea9c9454e4946af) | Editorial: root types (#842) | [Lee Byron]
| [080c8b6](https://github.com/graphql/graphql-spec/commit/080c8b669967ccaa5021b9b5b1278807cbfe9c7a) | Editorial: clarify input object introspection (#838) | [Lee Byron]
| [9cb9a4b](https://github.com/graphql/graphql-spec/commit/9cb9a4b25ea975b4affbea6676cf857f8eb43967) | Replace 'query error' with 'request error' (#803) | [Benjie Gillam], [Lee Byron]
| [6dbef35](https://github.com/graphql/graphql-spec/commit/6dbef35869abbc10d7b3e3aef073ed0ebd1bf52c) | Clarify that Float does not include NaN or infinity (#780) | [David Glasser], [Lee Byron]
| [b47598f](https://github.com/graphql/graphql-spec/commit/b47598f49264d7018ef2c07e2dfc21b3e0503420) | Prettier pre-work: formatting tweaks (#832) | [Benjie Gillam], [Lee Byron]
| [d716d84](https://github.com/graphql/graphql-spec/commit/d716d84263a428c3e7f45962a2ed66a5e063d5d9) | Rename references from master to main (#835) | [Lee Byron]
| [f331650](https://github.com/graphql/graphql-spec/commit/f3316502285e46d7b9bea17e895ce79bfcb771e9) | Clarify how lexical tokens are separated (#748) | [Joe Duarte]
| [7546566](https://github.com/graphql/graphql-spec/commit/7546566bc8a9b3992e87c0a2656dab85319b3264) | fix spelling (#834) | [Lee Byron]
| [bed0a19](https://github.com/graphql/graphql-spec/commit/bed0a193436af5e3fc89b9a21a90debf7f5663a7) | Formatting: use markdown lists in 'one of' lists (#726) | [Benjie Gillam]
| [d24252b](https://github.com/graphql/graphql-spec/commit/d24252b82637a1deab3c3b8b07ce6bb3b3fda331) | Add definition of selectionSet to CreateSourceEventStream (#828) | [Benjie Gillam]
| [83b638f](https://github.com/graphql/graphql-spec/commit/83b638f0ec93cebf4d85997e3b49479a56aa051a) | Renumber list items (#824) | [Benjie Gillam]
| [d248f55](https://github.com/graphql/graphql-spec/commit/d248f551bd84042cfba1b48b95848f06dee36ea8) | Editorial: Clean trailing whitespace (#813) | [Lee Byron]
| [eb86ed9](https://github.com/graphql/graphql-spec/commit/eb86ed92bd89b6d58f25d39e6c6e8cb82620b8c9) | Disallow non-breakable chains of circular references in Input Objects (#701) | [Benedikt Franke], [Lee Byron]
| [c83baf6](https://github.com/graphql/graphql-spec/commit/c83baf6efb3abb0faeb55d118324704f3ce2c1f2) | Editorial: s/server/service (#811) | [Lee Byron]
| [d3ea511](https://github.com/graphql/graphql-spec/commit/d3ea51147c2c00c4da21cf0b624bf055dd45a02d) | Add missing VARIABLE DEFINITION (#761) | [dugenkui]
| [39caf61](https://github.com/graphql/graphql-spec/commit/39caf613baab565d42385a7ba2e643eaaa275e9b) | Clarify that __typename may be queried on unions (#756) | [David Glasser]
| [657bc69](https://github.com/graphql/graphql-spec/commit/657bc69cc834a66350ebaaa68263d6fad716f1b5) | Minor grammar fixes (#728) | [Loren Sands-Ramshaw]
| [41dc593](https://github.com/graphql/graphql-spec/commit/41dc593687768af447b70ee82bd7d92f5f7d7e82) | Add explicit example to allow nesting lists within lists (#755) | [Benedikt Franke]
| [73fc593](https://github.com/graphql/graphql-spec/commit/73fc59385f5bcbc6bec4c011eedf18aff1e127b7) | Make 'Field Selections' header stable (#773) | [Benjie Gillam]
| [abed779](https://github.com/graphql/graphql-spec/commit/abed7797820657f0ecc75e04418115ff5bd33561) | Small grammar fix (#762) | [Martin Bonnin]
| [2e5aa78](https://github.com/graphql/graphql-spec/commit/2e5aa786d30fb13f2992d71d154b4320cbcec114) | fix typo (#747) | [Andreas Marek]
| [2d67b69](https://github.com/graphql/graphql-spec/commit/2d67b696256c90e0772823f73ae9e8fd60aa4e7c) | Fix typo in Input Objects (#741) | [dugenkui]
| [05d4a3b](https://github.com/graphql/graphql-spec/commit/05d4a3be4ed8bad274209c6f855d895f824949c2) | fix __Type explanation (#737) | [dugenkui]
| [c976d31](https://github.com/graphql/graphql-spec/commit/c976d31311bdcc0590c930a3da45b9b78201fb68) | Fix typo in CollectFields (#732) | [Benjie Gillam]
| [6c9e13b](https://github.com/graphql/graphql-spec/commit/6c9e13b2281b6e30a630d334fea90d389e9099cb) | [Variables] Generalize description | [Michael Joseph Rosenthal]
| [e5c31c9](https://github.com/graphql/graphql-spec/commit/e5c31c9d8c4439d06c858ec22fde7158509283bb) | Fix 'Format' / 'Formal' typo; fix another header | [Benjie Gillam]
| [0b3c0fa](https://github.com/graphql/graphql-spec/commit/0b3c0fa7b57dd6087cc7b2b31fe7af8be54d3b23) | Section headers for formal specifications | [Benjie Gillam]
| [a0de4c5](https://github.com/graphql/graphql-spec/commit/a0de4c5cc158083b98f5002d6016118c28f42557) | [Editorial] Fix example for Variable Uniqueness (#703) | [Pascal Senn]
| [2bd2d01](https://github.com/graphql/graphql-spec/commit/2bd2d0197ee2780aa7f5895a1d06f8d64f9e83dd) | [grammar] add "the " to Type Condition section (#712) | [Michael Joseph Rosenthal]
| [ef4bbca](https://github.com/graphql/graphql-spec/commit/ef4bbca9a49999947b6d3b319addc422d47fc18e) | [Editorial]: Use non-null for if variable in @skip and @include (#722) | [Loren Sands-Ramshaw]
| [02fd71f](https://github.com/graphql/graphql-spec/commit/02fd71f816139b7e040f969860778d23df288d32) |  Add description to Schema (#466) | [Ivan Goncharov]
| [3b001da](https://github.com/graphql/graphql-spec/commit/3b001da015a4b55331b534327a9ad74eb2e6d744) | Grammar: Add missing ImplementsInterface to Interface rules | [Ivan Maximov]
| [8ac091a](https://github.com/graphql/graphql-spec/commit/8ac091a4e0232def801dd8dfc6da208c3e7e347f) | Update draft URL | [Lee Byron]
| [e297e92](https://github.com/graphql/graphql-spec/commit/e297e9254bc7649ee0063164d7f3395425159e26) | RFC: Allow interfaces to implement other interfaces (#373) | [Mike Marcacci], [Lee Byron]
| [97db7cd](https://github.com/graphql/graphql-spec/commit/97db7cd2bdff15c4d195141065fa2bfb41816f60) | [editorial] Fix formatting of algorithms in Validation section (#671) | [Lee Byron]
| [4d55742](https://github.com/graphql/graphql-spec/commit/4d55742ff4f9d18a722d31846bea3ea63cf7971f) | [editorial] Localized note about order of skip and include directives (#669) | [Lee Byron]
| [be33a64](https://github.com/graphql/graphql-spec/commit/be33a640a8d12eb177f7cce0c61a1fad770a3430) | [RFC] Repeatable directives (#472) | [Oleg Ilyenko], [Lee Byron], [Benedikt Franke]
| [39f7a34](https://github.com/graphql/graphql-spec/commit/39f7a34e7af99de345ca344f9e6645ed8a6bc3f7) | Improve clarity of scalar types (#597) | [Lee Byron]
| [8ada467](https://github.com/graphql/graphql-spec/commit/8ada467ed5bc3b72ccd42508f5bb56a7ef3b1328) | Fixed that `CoerceArgumentValues` refers to `variableType` (#659) | [Marc Knaup]
| [09cdaec](https://github.com/graphql/graphql-spec/commit/09cdaecf3a4d08c9c53092ce83b0dede40adcba6) | RFC: Number value literal lookahead restrictions (#601) | [Lee Byron]
| [a73cd6f](https://github.com/graphql/graphql-spec/commit/a73cd6fef02d16483cb5f9c1f7f6d81db3c46584) | Clarify lexing is greedy with lookahead restrictions. (#599) | [Lee Byron]
| [e491220](https://github.com/graphql/graphql-spec/commit/e49122000599567bea17ad6eecf50ad17fa60693) | Added missing parameter in call to CollectFields() (#658) | [Marc Knaup]
| [bce8020](https://github.com/graphql/graphql-spec/commit/bce80208054cb1aaf7b9f9f513270ba413054da3) | [RFC] Add note recommending directive names to be namespaced (#657) | [Antoine Boyer], [Lee Byron]
| [43a5826](https://github.com/graphql/graphql-spec/commit/43a58263fe69e6c016964848a8cf6eab3c69faaf) | Update copyright and URLs from Facebook to GraphQL Foundation (#637) | [Lee Byron]
| [bb95aa5](https://github.com/graphql/graphql-spec/commit/bb95aa5c4023cc3cf04fb3450f894300db77d846) | fixed #613 (#614) | [Ivan Maximov]
| [b967f46](https://github.com/graphql/graphql-spec/commit/b967f46a6d34c8ea45b85ff6b7c97cbcfdcf02c9) | remove redundant step from SameResponseShape (#602) | [Chris Brown]
| [7ca239c](https://github.com/graphql/graphql-spec/commit/7ca239c01eb7cb950d36eebc3f341fa9a9deeb4b) | "Directive order is significant" section (#470) | [Oleg Ilyenko]
| [7237443](https://github.com/graphql/graphql-spec/commit/72374434452fc05ace73d5c5d4287e047e939ae0) | Editorial: Fix reference to StringValue from Ignored (#608) | [Lee Byron]
| [5cc1424](https://github.com/graphql/graphql-spec/commit/5cc14241511d193d2ba2c7dc95b7808e088b0caa) | values of correct type grammar fix (#603) | [Chris Brown]
| [663a18b](https://github.com/graphql/graphql-spec/commit/663a18bbcda0a8686a7bb51b1699aa997a488cb1) | Grammar fix in section 3 (#605) | [ab-pm]
| [6de9b65](https://github.com/graphql/graphql-spec/commit/6de9b654e8cd559978f8cdf5dee64a06cb054e28) | fix ExecuteField usage arguments (#607) | [Chris Brown]
| [dfd7571](https://github.com/graphql/graphql-spec/commit/dfd75718042806733e779930fbcebd6b02bb2106) | Editorial: Make grammar recursion more clear (#593) | [Lee Byron]
| [a3087c2](https://github.com/graphql/graphql-spec/commit/a3087c262022adf6a767d1cf644bc5594eb4eb14) | Remove contradictory language (#535) | [Grant Wu]
| [6b19129](https://github.com/graphql/graphql-spec/commit/6b19129b984faccf97b31356c3ebdc0d16c8e6d4) | Synchronise grammar rules across the spec (#538) | [Ivan Goncharov]
| [c7bface](https://github.com/graphql/graphql-spec/commit/c7bface58bf6f58cc809f279cba1b6245de914b4) | Update spec/Section 4 -- Introspection.md (#524) | [Görcsös Zoltán]
| [69f2bd4](https://github.com/graphql/graphql-spec/commit/69f2bd4740191b1917296d55fe08e07922123c57) | Fix grammar in Section 3 -- Type System.md (#546) | [Edwin Shin]
| [a9b186a](https://github.com/graphql/graphql-spec/commit/a9b186adf178fde9eaba0db2c2abfe05bd3caad5) | Introspection: Clarify nullability of fields in `__Type` type (#536) | [Ivan Goncharov]
| [f18c922](https://github.com/graphql/graphql-spec/commit/f18c92232e7c7a17402abc8e427ab77ec7901eaa) | Fix ambiguity about optional variables in non-null args (#520) | [Lee Byron]
| [51337d6](https://github.com/graphql/graphql-spec/commit/51337d6d038b094bc9598e15674d91b80ceca315) | Add missing '&' to Punctuator production (graphql#573) (#574) | [Sebastian Redl]
| [b79c7f7](https://github.com/graphql/graphql-spec/commit/b79c7f760b039f5c924da2a40107b70ee08fc1dd) | Added missing 'a' to section on 'Descriptions' (#527) | [James Scott]
| [7133b59](https://github.com/graphql/graphql-spec/commit/7133b599a42507734ea0e983e2aa59003951a583) | Add example of negative integer coercion to ID (#480) | [Ivan Goncharov]
| [760753e](https://github.com/graphql/graphql-spec/commit/760753edc3588923b8ee8e9885dadc22e478b911) | [RFC] Allow directives on variable definitions (#510) | [Matt Mahoney]
| [1278654](https://github.com/graphql/graphql-spec/commit/1278654d9bef295c56c08c1c0f63d4056b611e89) | Editorial changes on the spec document. (#493) | [Arun Ponniah Sethuramalingam]
| [b83ca98](https://github.com/graphql/graphql-spec/commit/b83ca9802f2d23a23d4cf2385d05b12cfd83896c) | Change scheme for URLs from http to https where https is available. (#504) | [Jamie Schouten]
| [4efbbc0](https://github.com/graphql/graphql-spec/commit/4efbbc0a091448ab2914dc6e255e0f4d5026f5dd) | Correct description of directive example (#506) | [António Nuno Monteiro]
| [1884f41](https://github.com/graphql/graphql-spec/commit/1884f4140c012063c1367edce466d5d7dbf187c1) | Fix grammar (#514) | [Ivan Goncharov]
| [4a70722](https://github.com/graphql/graphql-spec/commit/4a707222431fb68bbf649aaf7350c4dcca7c9c4d) | Revert "[RFC] Allow directives on variable definitions" (#492) | [Lee Byron]
| [b7b6a0b](https://github.com/graphql/graphql-spec/commit/b7b6a0b3c898b20395d58dd6414465a208fca440) | Move to after DefaultValue, and make [Const] | [Matt Mahoney]
| [98ffe21](https://github.com/graphql/graphql-spec/commit/98ffe217ff4fef3a6d20159ac3d96820915fa955) | [RFC] Allow directives on variable definitions | [Matt Mahoney]
| [1ee42ce](https://github.com/graphql/graphql-spec/commit/1ee42ceb453c124173615f98d0c90506f2345f9d) | Change values of x, y in example 121 (#468) | [Matthias Prechtl]
| [8ee3cc7](https://github.com/graphql/graphql-spec/commit/8ee3cc72c3141568f612dac3b66b3881f023b5ef) | Update Section 6 -- Execution.md (#469) | [Tejas Kumar]
| [b095b18](https://github.com/graphql/graphql-spec/commit/b095b18ff8c2f0f11b9fd33a8fdf2d95241fff28) | Start next working draft for future release | Travis CI

Generated with:

```sh
git log June2018..HEAD --format="| [%h](https://github.com/graphql/graphql-spec/commit/%H) | %s | %an <%ae> %(trailers:key=Co-authored-by,valueonly,separator=%x20)" -- spec
```

## Diff

### spec/GraphQL.md

<details>
<summary>spec/GraphQL.md</summary>

~~~diff
@@ -1,51 +1,72 @@
-GraphQL
--------
+# GraphQL

-*June 2018 Edition*
+*October 2021 Edition*

 **Introduction**

 This is the specification for GraphQL, a query language and execution engine
 originally created at Facebook in 2012 for describing the capabilities and
 requirements of data models for client-server applications. The development of
-this open standard started in 2015.
+this open standard started in 2015. This specification was licensed under OWFa
+1.0 in 2017. The [GraphQL Foundation](https://graphql.org/foundation/) was
+formed in 2019 as a neutral focal point for organizations who support the
+GraphQL ecosystem, and the
+[GraphQL Specification Project](https://graphql.org/community/) was established
+also in 2019 as the Joint Development Foundation Projects, LLC, GraphQL Series.
+
+If your organization benefits from GraphQL, please consider
+[becoming a member](https://graphql.org/foundation/join/#graphql-foundation)
+and helping us to sustain the activities that support the health of our neutral
+ecosystem.
+
+The GraphQL Specification Project has evolved and may continue to evolve in
+future editions of this specification. Previous editions of the GraphQL
+specification can be found at permalinks that match their
+[release tag](https://github.com/graphql/graphql-spec/releases). The latest
+working draft release can be found at
+[https://spec.graphql.org/draft](https://spec.graphql.org/draft).

-GraphQL has evolved and may continue to evolve in future editions of this
-specification. Previous editions of the GraphQL specification can be found at
-permalinks that match their [release tag](https://github.com/facebook/graphql/releases).
-The latest working draft release can be found at [facebook.github.io/graphql/draft/](http://facebook.github.io/graphql/draft/).

 **Copyright notice**

-Copyright © 2015-present, Facebook, Inc.
+Copyright © 2015-2018, Facebook, Inc.

-As of September 26, 2017, the following persons or entities have made this
-Specification available under the Open Web Foundation Final Specification
-Agreement (OWFa 1.0), which is available at [openwebfoundation.org](http://www.openwebfoundation.org/legal/the-owf-1-0-agreements/owfa-1-0).
+Copyright © 2019-present, GraphQL contributors

-* Facebook, Inc.
-
-You can review the signed copies of the Open Web Foundation Final Specification
-Agreement Version 1.0 for this specification at [github.com/facebook/graphql](https://github.com/facebook/graphql/tree/master/signed-agreements),
-which may also include additional parties to those listed above.
-
-Your use of this Specification may be subject to other third party rights.
-THIS SPECIFICATION IS PROVIDED “AS IS.” The contributors expressly disclaim any
+THESE MATERIALS ARE PROVIDED “AS IS.” The parties expressly disclaim any
 warranties (express, implied, or otherwise), including implied warranties of
 merchantability, non-infringement, fitness for a particular purpose, or title,
-related to the Specification. The entire risk as to implementing or otherwise
-using the Specification is assumed by the Specification implementer and user.
-IN NO EVENT WILL ANY PARTY BE LIABLE TO ANY OTHER PARTY FOR LOST PROFITS OR ANY
-FORM OF INDIRECT, SPECIAL, INCIDENTAL, OR CONSEQUENTIAL DAMAGES OF ANY CHARACTER
-FROM ANY CAUSES OF ACTION OF ANY KIND WITH RESPECT TO THIS SPECIFICATION OR ITS
-GOVERNING AGREEMENT, WHETHER BASED ON BREACH OF CONTRACT, TORT (INCLUDING
-NEGLIGENCE), OR OTHERWISE, AND WHETHER OR NOT THE OTHER PARTY HAS BEEN ADVISED
-OF THE POSSIBILITY OF SUCH DAMAGE.
+related to the materials. The entire risk as to implementing or otherwise using
+the materials is assumed by the implementer and user. IN NO EVENT WILL THE
+PARTIES BE LIABLE TO ANY OTHER PARTY FOR LOST PROFITS OR ANY FORM OF INDIRECT,
+SPECIAL, INCIDENTAL, OR CONSEQUENTIAL DAMAGES OF ANY CHARACTER FROM ANY CAUSES
+OF ACTION OF ANY KIND WITH RESPECT TO THIS DELIVERABLE OR ITS GOVERNING
+AGREEMENT, WHETHER BASED ON BREACH OF CONTRACT, TORT (INCLUDING NEGLIGENCE), OR
+OTHERWISE, AND WHETHER OR NOT THE OTHER MEMBER HAS BEEN ADVISED OF THE
+POSSIBILITY OF SUCH DAMAGE.
+
+
+**Licensing**
+
+The GraphQL Specification Project is made available by the
+[Joint Development Foundation](https://www.jointdevelopment.org/). The current
+[Working Group](https://github.com/graphql/graphql-wg) charter, which includes
+the IP policy governing all working group deliverables (including specifications,
+source code, and datasets) may be found at
+[https://technical-charter.graphql.org](https://technical-charter.graphql.org).
+
+Currently, the licenses governing GraphQL Specification Project deliverables are:
+
+| Deliverable    | License                                                 |
+| -------------- | ------------------------------------------------------- |
+| Specifications | [Open Web Foundation Agreement 1.0 Mode](http://www.openwebfoundation.org/legal/the-owf-1-0-agreements/owfa-1-0) (Patent and Copyright)
+| Source code    | [MIT License](https://opensource.org/licenses/MIT)
+| Data sets      | [CC0 1.0](https://creativecommons.org/publicdomain/zero/1.0/)


 **Conformance**

 A conforming implementation of GraphQL must fulfill all normative requirements.
 Conformance requirements are described in this document via both
 descriptive assertions and key words with clearly defined meanings.

~~~
</details>

<details>
<summary>spec/Section 1 -- Overview.md</summary>

~~~diff
@@ -21,65 +21,65 @@ Which produces the resulting data (in JSON):
 {
   "user": {
     "name": "Mark Zuckerberg"
   }
 }
 ```

 GraphQL is not a programming language capable of arbitrary computation, but is
-instead a language used to query application servers that have
+instead a language used to make requests to application services that have
 capabilities defined in this specification. GraphQL does not mandate a
-particular programming language or storage system for application servers that
-implement it. Instead, application servers take their capabilities and map them
+particular programming language or storage system for application services that
+implement it. Instead, application services take their capabilities and map them
 to a uniform language, type system, and philosophy that GraphQL encodes.
 This provides a unified interface friendly to product development and a powerful
 platform for tool-building.

 GraphQL has a number of design principles:

- * **Hierarchical**: Most product development today involves the creation and
-   manipulation of view hierarchies. To achieve congruence with the structure
-   of these applications, a GraphQL query itself is structured hierarchically.
-   The query is shaped just like the data it returns. It is a natural
-   way for clients to describe data requirements.
-
  * **Product-centric**: GraphQL is unapologetically driven by the requirements
    of views and the front-end engineers that write them. GraphQL starts with
    their way of thinking and requirements and builds the language and runtime
    necessary to enable that.

- * **Strong-typing**: Every GraphQL server defines an application-specific
-   type system. Queries are executed within the context of that type system.
-   Given a query, tools can ensure that the query is both syntactically
-   correct and valid within the GraphQL type system before execution, i.e. at
-   development time, and the server can make certain guarantees about the shape
+ * **Hierarchical**: Most product development today involves the creation and
+   manipulation of view hierarchies. To achieve congruence with the structure
+   of these applications, a GraphQL request itself is structured hierarchically.
+   The request is shaped just like the data in its response. It is a natural way
+   for clients to describe data requirements.
+
+ * **Strong-typing**: Every GraphQL service defines an application-specific
+   type system. Requests are executed within the context of that type system.
+   Given a GraphQL operation, tools can ensure that it is both syntactically
+   correct and valid within that type system before execution, i.e. at
+   development time, and the service can make certain guarantees about the shape
    and nature of the response.

- * **Client-specified queries**: Through its type system, a GraphQL server
+ * **Client-specified response**: Through its type system, a GraphQL service
    publishes the capabilities that its clients are allowed to consume. It is
    the client that is responsible for specifying exactly how it will consume
-   those published capabilities. These queries are specified at field-level
-   granularity. In the majority of client-server applications written
-   without GraphQL, the server determines the data returned in its various
-   scripted endpoints. A GraphQL query, on the other hand, returns exactly what
-   a client asks for and no more.
+   those published capabilities. These requests are specified at field-level
+   granularity. In the majority of client-server applications written without
+   GraphQL, the service determines the shape of data returned from its various
+   endpoints. A GraphQL response, on the other hand, contains exactly what a
+   client asks for and no more.

- * **Introspective**: GraphQL is introspective. A GraphQL server's type system
-   must be queryable by the GraphQL language itself, as will be described in this
+ * **Introspective**: GraphQL is introspective. A GraphQL service's type system
+   can be queryable by the GraphQL language itself, as will be described in this
    specification. GraphQL introspection serves as a powerful platform for
    building common tools and client software libraries.

 Because of these principles, GraphQL is a powerful and productive environment
 for building client applications. Product developers and designers building
-applications against working GraphQL servers -- supported with quality tools --
-can quickly become productive without reading extensive documentation and with
+applications against working GraphQL services—supported with quality tools—can
+quickly become productive without reading extensive documentation and with
 little or no formal training. To enable that experience, there must be those
-that build those servers and tools.
+that build those services and tools.

 The following formal specification serves as a reference for those builders.
 It describes the language and its grammar, the type system and the
 introspection system used to query it, and the execution and validation engines
 with the algorithms to power them. The goal of this specification is to provide
 a foundation and framework for an ecosystem of GraphQL tools, client libraries,
-and server implementations -- spanning both organizations and platforms -- that
+and service implementations—spanning both organizations and platforms—that
 has yet to be built. We look forward to working with the community
 in order to do that.
~~~
</details>

<details>
<summary>spec/Section 2 -- Language.md</summary>

~~~diff
@@ -1,43 +1,78 @@
 # Language

 Clients use the GraphQL query language to make requests to a GraphQL service.
 We refer to these request sources as documents. A document may contain
 operations (queries, mutations, and subscriptions) as well as fragments, a
-common unit of composition allowing for query reuse.
+common unit of composition allowing for data requirement reuse.

 A GraphQL document is defined as a syntactic grammar where terminal symbols are
 tokens (indivisible lexical units). These tokens are defined in a lexical
-grammar which matches patterns of source characters (defined by a
-double-colon `::`).
+grammar which matches patterns of source characters. In this document, syntactic
+grammar productions are distinguished with a colon `:` while lexical grammar
+productions are distinguished with a double-colon `::`.

-Note: See [Appendix A](#sec-Appendix-Notation-Conventions) for more details about the definition of lexical and syntactic grammar and other notational conventions
-used in this document.
+The source text of a GraphQL document must be a sequence of {SourceCharacter}.
+The character sequence must be described by a sequence of {Token} and {Ignored}
+lexical grammars. The lexical token sequence, omitting {Ignored}, must be
+described by a single {Document} syntactic grammar.
+
+Note: See [Appendix A](#sec-Appendix-Notation-Conventions) for more information
+about the lexical and syntactic grammar and other notational conventions used
+throughout this document.
+
+**Lexical Analysis & Syntactic Parse**
+
+The source text of a GraphQL document is first converted into a sequence of
+lexical tokens, {Token}, and ignored tokens, {Ignored}. The source text is
+scanned from left to right, repeatedly taking the next possible sequence of
+code-points allowed by the lexical grammar productions as the next token. This
+sequence of lexical tokens are then scanned from left to right to produce an
+abstract syntax tree (AST) according to the {Document} syntactical grammar.
+
+Lexical grammar productions in this document use *lookahead restrictions* to
+remove ambiguity and ensure a single valid lexical analysis. A lexical token is
+only valid if not followed by a character in its lookahead restriction.
+
+For example, an {IntValue} has the restriction {[lookahead != Digit]}, so cannot
+be followed by a {Digit}. Because of this, the sequence {`123`} cannot represent
+the tokens ({`12`}, {`3`}) since {`12`} is followed by the {Digit} {`3`} and
+so must only represent a single token. Use {WhiteSpace} or other {Ignored}
+between characters to represent multiple tokens.
+
+Note: This typically has the same behavior as a
+"[maximal munch](https://en.wikipedia.org/wiki/Maximal_munch)" longest possible
+match, however some lookahead restrictions include additional constraints.


 ## Source Text

-SourceCharacter :: /[\u0009\u000A\u000D\u0020-\uFFFF]/
+SourceCharacter ::
+  - "U+0009"
+  - "U+000A"
+  - "U+000D"
+  - "U+0020–U+FFFF"

 GraphQL documents are expressed as a sequence of
-[Unicode](http://unicode.org/standard/standard.html) characters. However, with
+[Unicode](https://unicode.org/standard/standard.html) code points (informally
+referred to as *"characters"* through most of this specification). However, with
 few exceptions, most of GraphQL is expressed only in the original non-control
 ASCII range so as to be as widely compatible with as many existing tools,
 languages, and serialization formats as possible and avoid display issues in
 text editors and source control.

+Note: Non-ASCII Unicode characters may appear freely within {StringValue} and
+{Comment} portions of GraphQL.
+

 ### Unicode

 UnicodeBOM :: "Byte Order Mark (U+FEFF)"

-Non-ASCII Unicode characters may freely appear within {StringValue} and
-{Comment} portions of GraphQL.
-
 The "Byte Order Mark" is a special Unicode character which
 may appear at the beginning of a file containing Unicode which programs may use
 to determine the fact that the text stream is Unicode, what endianness the text
 stream is in, and which of several Unicode encodings to interpret.


 ### White Space

@@ -55,158 +90,195 @@ Note: GraphQL intentionally does not consider Unicode "Zs" category characters
 as white-space, avoiding misinterpretation by text editors and source
 control tools.


 ### Line Terminators

 LineTerminator ::
   - "New Line (U+000A)"
-  - "Carriage Return (U+000D)" [ lookahead ! "New Line (U+000A)" ]
+  - "Carriage Return (U+000D)" [lookahead != "New Line (U+000A)"]
   - "Carriage Return (U+000D)" "New Line (U+000A)"

 Like white space, line terminators are used to improve the legibility of source
-text, any amount may appear before or after any other token and have no
-significance to the semantic meaning of a GraphQL Document. Line
-terminators are not found within any other token.
+text and separate lexical tokens, any amount may appear before or after any
+other token and have no significance to the semantic meaning of a GraphQL
+Document. Line terminators are not found within any other token.

-Note: Any error reporting which provide the line number in the source of the
+Note: Any error reporting which provides the line number in the source of the
 offending syntax should use the preceding amount of {LineTerminator} to produce
 the line number.


 ### Comments

-Comment :: `#` CommentChar*
+Comment :: `#` CommentChar* [lookahead != CommentChar]

 CommentChar :: SourceCharacter but not LineTerminator

 GraphQL source documents may contain single-line comments, starting with the
 {`#`} marker.

-A comment can contain any Unicode code point except {LineTerminator} so a
-comment always consists of all code points starting with the {`#`} character up
-to but not including the line terminator.
+A comment can contain any Unicode code point in {SourceCharacter} except
+{LineTerminator} so a comment always consists of all code points starting with
+the {`#`} character up to but not including the {LineTerminator} (or end of
+the source).

-Comments behave like white space and may appear after any token, or before a
-line terminator, and have no significance to the semantic meaning of a
+Comments are {Ignored} like white space and may appear after any token, or
+before a {LineTerminator}, and have no significance to the semantic meaning of a
 GraphQL Document.


 ### Insignificant Commas

 Comma :: ,

 Similar to white space and line terminators, commas ({`,`}) are used to improve
 the legibility of source text and separate lexical tokens but are otherwise
 syntactically and semantically insignificant within GraphQL Documents.

 Non-significant comma characters ensure that the absence or presence of a comma
 does not meaningfully alter the interpreted syntax of the document, as this can
 be a common user-error in other languages. It also allows for the stylistic use
-of either trailing commas or line-terminators as list delimiters which are both
+of either trailing commas or line terminators as list delimiters which are both
 often desired for legibility and maintainability of source code.


 ### Lexical Tokens

 Token ::
   - Punctuator
   - Name
   - IntValue
   - FloatValue
   - StringValue

 A GraphQL document is comprised of several kinds of indivisible lexical tokens
 defined here in a lexical grammar by patterns of source Unicode characters.
+Lexical tokens may be separated by {Ignored} tokens.

-Tokens are later used as terminal symbols in a GraphQL Document
-syntactic grammars.
+Tokens are later used as terminal symbols in GraphQL syntactic grammar rules.


 ### Ignored Tokens

 Ignored ::
   - UnicodeBOM
   - WhiteSpace
   - LineTerminator
   - Comment
   - Comma

-Before and after every lexical token may be any amount of ignored tokens
-including {WhiteSpace} and {Comment}. No ignored regions of a source
-document are significant, however ignored source characters may appear within
-a lexical token in a significant way, for example a {String} may contain white
-space characters.
+{Ignored} tokens are used to improve readability and provide separation between
+lexical tokens, but are otherwise insignificant and not referenced in
+syntactical grammar productions.

-No characters are ignored while parsing a given token, as an example no
-white space characters are permitted between the characters defining a
-{FloatValue}.
+Any amount of {Ignored} may appear before and after every lexical token. No
+ignored regions of a source document are significant, however {SourceCharacter}
+which appear in {Ignored} may also appear within a lexical {Token} in a
+significant way, for example a {StringValue} may contain white space characters.
+No {Ignored} may appear *within* a {Token}, for example no white space
+characters are permitted between the characters defining a {FloatValue}.


 ### Punctuators

-Punctuator :: one of ! $ ( ) ... : = @ [ ] { | }
+Punctuator :: one of ! $ & ( ) ... : = @ [ ] { | }

 GraphQL documents include punctuation in order to describe structure. GraphQL
 is a data description language and not a programming language, therefore GraphQL
 lacks the punctuation often used to describe mathematical expressions.


 ### Names

-Name :: /[_A-Za-z][_0-9A-Za-z]*/
+Name ::
+  - NameStart NameContinue* [lookahead != NameContinue]
+
+NameStart ::
+  - Letter
+  - `_`
+
+NameContinue ::
+  - Letter
+  - Digit
+  - `_`
+
+Letter :: one of
+  - `A` `B` `C` `D` `E` `F` `G` `H` `I` `J` `K` `L` `M`
+  - `N` `O` `P` `Q` `R` `S` `T` `U` `V` `W` `X` `Y` `Z`
+  - `a` `b` `c` `d` `e` `f` `g` `h` `i` `j` `k` `l` `m`
+  - `n` `o` `p` `q` `r` `s` `t` `u` `v` `w` `x` `y` `z`
+
+Digit :: one of
+  - `0` `1` `2` `3` `4` `5` `6` `7` `8` `9`

 GraphQL Documents are full of named things: operations, fields, arguments,
 types, directives, fragments, and variables. All names must follow the same
 grammatical form.

 Names in GraphQL are case-sensitive. That is to say `name`, `Name`, and `NAME`
 all refer to different names. Underscores are significant, which means
 `other_name` and `othername` are two different names.

-Names in GraphQL are limited to this <acronym>ASCII</acronym> subset of possible
-characters to support interoperation with as many other systems as possible.
+A {Name} must not be followed by a {NameContinue}. In other words, a {Name}
+token is always the longest possible valid sequence. The source characters
+{`a1`} cannot be interpreted as two tokens since {`a`} is followed by the {NameContinue} {`1`}.
+
+Note: Names in GraphQL are limited to the Latin <acronym>ASCII</acronym> subset
+of {SourceCharacter} in order to support interoperation with as many other
+systems as possible.
+
+**Reserved Names**
+
+Any {Name} within a GraphQL type system must not start with two underscores
+{"__"} unless it is part of the [introspection system](#sec-Introspection) as
+defined by this specification.


 ## Document

 Document : Definition+

 Definition :
   - ExecutableDefinition
-  - TypeSystemDefinition
-  - TypeSystemExtension
+  - TypeSystemDefinitionOrExtension
+
+ExecutableDocument : ExecutableDefinition+

 ExecutableDefinition :
   - OperationDefinition
   - FragmentDefinition

 A GraphQL Document describes a complete file or request string operated on
 by a GraphQL service or client. A document contains multiple definitions, either
 executable or representative of a GraphQL type system.

-Documents are only executable by a GraphQL service if they contain an
-{OperationDefinition} and otherwise only contain {ExecutableDefinition}.
-However documents which do not contain {OperationDefinition} or do contain
-{TypeSystemDefinition} or {TypeSystemExtension} may still be parsed
-and validated to allow client tools to represent many GraphQL uses which may
-appear across many individual files.
+Documents are only executable by a GraphQL service if they are
+{ExecutableDocument} and contain at least one {OperationDefinition}. A
+Document which contains {TypeSystemDefinitionOrExtension} must not be executed;
+GraphQL execution services which receive a Document containing these should
+return a descriptive error.

-If a Document contains only one operation, that operation may be unnamed or
-represented in the shorthand form, which omits both the query keyword and
-operation name. Otherwise, if a GraphQL Document contains multiple
+GraphQL services which only seek to execute GraphQL requests and not construct
+a new GraphQL schema may choose to only permit {ExecutableDocument}.
+
+Documents which do not contain {OperationDefinition} or do contain
+{TypeSystemDefinitionOrExtension} may still be parsed and validated to allow
+client tools to represent many GraphQL uses which may appear across many
+individual files.
+
+If a Document contains only one operation, that operation may be unnamed. If
+that operation is a query without variables or directives then it may also be
+represented in the shorthand form, omitting both the {`query`} keyword as well
+as the operation name. Otherwise, if a GraphQL Document contains multiple
 operations, each operation must be named. When submitting a Document with
 multiple operations to a GraphQL service, the name of the desired operation to
 be executed must also be provided.

-GraphQL services which only seek to provide GraphQL query execution may choose
-to only include {ExecutableDefinition} and omit the {TypeSystemDefinition} and
-{TypeSystemExtension} rules from {Definition}.
-

 ## Operations

 OperationDefinition :
   - OperationType Name? VariableDefinitions? Directives? SelectionSet
   - SelectionSet

 OperationType : one of `query` `mutation` `subscription`
@@ -230,19 +302,20 @@ mutation {
       likeCount
     }
   }
 }
 ```

 **Query shorthand**

-If a document contains only one query operation, and that query defines no
-variables and contains no directives, that operation may be represented in a
-short-hand form which omits the query keyword and query name.
+If a document contains only one operation and that operation is a query which
+defines no variables and contains no directives then that operation may be
+represented in a short-hand form which omits the {`query`} keyword and operation
+name.

 For example, this unnamed query operation is written via query shorthand.

 ```graphql example
 {
   field
 }
 ```
@@ -266,18 +339,18 @@ under-fetching data.
 ```graphql example
 {
   id
   firstName
   lastName
 }
 ```

-In this query, the `id`, `firstName`, and `lastName` fields form a selection
-set. Selection sets may also contain fragment references.
+In this query operation, the `id`, `firstName`, and `lastName` fields form a
+selection set. Selection sets may also contain fragment references.


 ## Fields

 Field : Alias? Name Arguments? Directives? SelectionSet?

 A selection set is primarily composed of fields. A field describes one discrete
 piece of information available to request within a selection set.
@@ -335,17 +408,17 @@ unique identifier.
 ## Arguments

 Arguments[Const] : ( Argument[?Const]+ )

 Argument[Const] : Name : Value[?Const]

 Fields are conceptually functions which return values, and occasionally accept
 arguments which alter their behavior. These arguments often map directly to
-function arguments within a GraphQL server's implementation.
+function arguments within a GraphQL service's implementation.

 In this example, we want to query a specific user (requested via the `id`
 argument) and their profile picture of a specific `size`:

 ```graphql example
 {
   user(id: 4) {
     id
@@ -367,17 +440,17 @@ Many arguments can exist for a given field:
 }
 ```

 **Arguments are unordered**

 Arguments may be provided in any syntactic order and maintain identical
 semantic meaning.

-These two queries are semantically identical:
+These two operations are semantically identical:

 ```graphql example
 {
   picture(width: 200, height: 100)
 }
 ```

 ```graphql example
@@ -386,71 +459,68 @@ These two queries are semantically identical:
 }
 ```


 ## Field Alias

 Alias : Name :

-By default, the key in the response object will use the field name
-queried. However, you can define a different name by specifying an alias.
+By default a field's response key in the response object will use that field's
+name. However, you can define a different response key by specifying an alias.

 In this example, we can fetch two profile pictures of different sizes and ensure
-the resulting object will not have duplicate keys:
+the resulting response object will not have duplicate keys:

 ```graphql example
 {
   user(id: 4) {
     id
     name
     smallPic: profilePic(size: 64)
     bigPic: profilePic(size: 1024)
   }
 }
 ```

-Which returns the result:
+which returns the result:

 ```json example
 {
   "user": {
     "id": 4,
     "name": "Mark Zuckerberg",
     "smallPic": "https://cdn.site.io/pic-4-64.jpg",
     "bigPic": "https://cdn.site.io/pic-4-1024.jpg"
   }
 }
 ```

-Since the top level of a query is a field, it also can be given an alias:
+The fields at the top level of an operation can also be given an alias:

 ```graphql example
 {
   zuck: user(id: 4) {
     id
     name
   }
 }
 ```

-Returns the result:
+which returns the result:

 ```json example
 {
   "zuck": {
     "id": 4,
     "name": "Mark Zuckerberg"
   }
 }
 ```

-A field's response key is its alias if an alias is provided, and it is
-otherwise the field's name.
-

 ## Fragments

 FragmentSpread : ... FragmentName Directives?

 FragmentDefinition : fragment FragmentName TypeCondition Directives? SelectionSet

 FragmentName : Name but not `on`
@@ -478,17 +548,17 @@ query noFragments {
       name
       profilePic(size: 50)
     }
   }
 }
 ```

 The repeated fields could be extracted into a fragment and composed by
-a parent fragment or query.
+a parent fragment or operation.

 ```graphql example
 query withFragments {
   user(id: 4) {
     friends(first: 10) {
       ...friendFields
     }
     mutualFriends(first: 10) {
@@ -499,18 +569,18 @@ query withFragments {

 fragment friendFields on User {
   id
   name
   profilePic(size: 50)
 }
 ```

-Fragments are consumed by using the spread operator (`...`). All fields selected
-by the fragment will be added to the query field selection at the same level
+Fragments are consumed by using the spread operator (`...`). All fields
+selected by the fragment will be added to the field selection at the same level
 as the fragment invocation. This happens through multiple levels of fragment
 spreads.

 For example:

 ```graphql example
 query withNestedFragments {
   user(id: 4) {
@@ -529,40 +599,40 @@ fragment friendFields on User {
   ...standardProfilePic
 }

 fragment standardProfilePic on User {
   profilePic(size: 50)
 }
 ```

-The queries `noFragments`, `withFragments`, and `withNestedFragments` all
+The operations `noFragments`, `withFragments`, and `withNestedFragments` all
 produce the same response object.


 ### Type Conditions

 TypeCondition : on NamedType

 Fragments must specify the type they apply to. In this example, `friendFields`
 can be used in the context of querying a `User`.

 Fragments cannot be specified on any input value (scalar, enumeration, or input
 object).

 Fragments can be specified on object types, interfaces, and unions.

-Selections within fragments only return values when concrete type of the object
+Selections within fragments only return values when the concrete type of the object
 it is operating on matches the type of the fragment.

-For example in this query on the Facebook data model:
+For example in this operation using the Facebook data model:

 ```graphql example
 query FragmentTyping {
-  profiles(handles: ["zuck", "cocacola"]) {
+  profiles(handles: ["zuck", "coca-cola"]) {
     handle
     ...userFragment
     ...pageFragment
   }
 }

 fragment userFragment on User {
   friends {
@@ -582,21 +652,21 @@ The `profiles` root field returns a list where each element could be a `Page` or
 present and `likers` will not. Conversely when the result is a `Page`, `likers`
 will be present and `friends` will not.

 ```json example
 {
   "profiles": [
     {
       "handle": "zuck",
-      "friends": { "count" : 1234 }
+      "friends": { "count": 1234 }
     },
     {
-      "handle": "cocacola",
-      "likers": { "count" : 90234512 }
+      "handle": "coca-cola",
+      "likers": { "count": 90234512 }
     }
   ]
 }
 ```


 ### Inline Fragments

@@ -604,17 +674,17 @@ InlineFragment : ... TypeCondition? Directives? SelectionSet

 Fragments can be defined inline within a selection set. This is done to
 conditionally include fields based on their runtime type. This feature of
 standard fragment inclusion was demonstrated in the `query FragmentTyping`
 example. We could accomplish the same thing using inline fragments.

 ```graphql example
 query inlineFragmentTyping {
-  profiles(handles: ["zuck", "cocacola"]) {
+  profiles(handles: ["zuck", "coca-cola"]) {
     handle
     ... on User {
       friends {
         count
       }
     }
     ... on Page {
       likers {
@@ -661,98 +731,131 @@ Field and directive arguments accept input values of various literal primitives;
 input values can be scalars, enumeration values, lists, or input objects.

 If not defined as constant (for example, in {DefaultValue}), input values can be
 specified as a variable. List and inputs objects may also contain variables (unless defined to be constant).


 ### Int Value

-IntValue :: IntegerPart
+IntValue :: IntegerPart [lookahead != {Digit, `.`, NameStart}]

 IntegerPart ::
   - NegativeSign? 0
   - NegativeSign? NonZeroDigit Digit*

 NegativeSign :: -

-Digit :: one of 0 1 2 3 4 5 6 7 8 9
-
 NonZeroDigit :: Digit but not `0`

-An Int number is specified without a decimal point or exponent (ex. `1`).
+An {IntValue} is specified without a decimal point or exponent but may be
+negative (ex. {-123}). It must not have any leading {0}.
+
+An {IntValue} must not be followed by a {Digit}. In other words, an {IntValue}
+token is always the longest possible valid sequence. The source characters
+{12} cannot be interpreted as two tokens since {1} is followed by the {Digit}
+{2}. This also means the source {00} is invalid since it can neither be
+interpreted as a single token nor two {0} tokens.
+
+An {IntValue} must not be followed by a {`.`} or {NameStart}. If either {`.`} or
+{ExponentIndicator} follows then the token must only be interpreted as a
+possible {FloatValue}. No other {NameStart} character can follow. For example
+the sequences `0x123` and `123L` have no valid lexical representations.


 ### Float Value

 FloatValue ::
-  - IntegerPart FractionalPart
-  - IntegerPart ExponentPart
-  - IntegerPart FractionalPart ExponentPart
+  - IntegerPart FractionalPart ExponentPart [lookahead != {Digit, `.`, NameStart}]
+  - IntegerPart FractionalPart [lookahead != {Digit, `.`, NameStart}]
+  - IntegerPart ExponentPart [lookahead != {Digit, `.`, NameStart}]

 FractionalPart :: . Digit+

 ExponentPart :: ExponentIndicator Sign? Digit+

 ExponentIndicator :: one of `e` `E`

 Sign :: one of + -

-A Float number includes either a decimal point (ex. `1.0`) or an exponent
-(ex. `1e50`) or both (ex. `6.0221413e23`).
+A {FloatValue} includes either a decimal point (ex. {1.0}) or an exponent
+(ex. {1e50}) or both (ex. {6.0221413e23}) and may be negative. Like {IntValue},
+it also must not have any leading {0}.
+
+A {FloatValue} must not be followed by a {Digit}. In other words, a {FloatValue}
+token is always the longest possible valid sequence. The source characters
+{1.23} cannot be interpreted as two tokens since {1.2} is followed by the
+{Digit} {3}.
+
+A {FloatValue} must not be followed by a {.}. For example, the sequence {1.23.4}
+cannot be interpreted as two tokens ({1.2}, {3.4}).
+
+A {FloatValue} must not be followed by a {NameStart}. For example the sequence
+`0x1.2p3` has no valid lexical representation.
+
+Note: The numeric literals {IntValue} and {FloatValue} both restrict being
+immediately followed by a letter (or other {NameStart}) to reduce confusion
+or unexpected behavior since GraphQL only supports decimal numbers.


 ### Boolean Value

 BooleanValue : one of `true` `false`

 The two keywords `true` and `false` represent the two boolean values.


 ### String Value

 StringValue ::
-  - `"` StringCharacter* `"`
+  - `""` [lookahead != `"`]
+  - `"` StringCharacter+ `"`
   - `"""` BlockStringCharacter* `"""`

 StringCharacter ::
-  - SourceCharacter but not `"` or \ or LineTerminator
-  - \u EscapedUnicode
-  - \ EscapedCharacter
+  - SourceCharacter but not `"` or `\` or LineTerminator
+  - `\u` EscapedUnicode
+  - `\` EscapedCharacter

 EscapedUnicode :: /[0-9A-Fa-f]{4}/

-EscapedCharacter :: one of `"` \ `/` b f n r t
+EscapedCharacter :: one of `"` `\` `/` `b` `f` `n` `r` `t`

 BlockStringCharacter ::
   - SourceCharacter but not `"""` or `\"""`
   - `\"""`

-Strings are sequences of characters wrapped in double-quotes (`"`). (ex.
-`"Hello World"`). White space and other otherwise-ignored characters are
+Strings are sequences of characters wrapped in quotation marks (U+0022).
+(ex. {`"Hello World"`}). White space and other otherwise-ignored characters are
 significant within a string value.

-Note: Unicode characters are allowed within String value literals, however
-{SourceCharacter} must not contain some ASCII control characters so escape
-sequences must be used to represent these characters.
+The empty string {`""`} must not be followed by another {`"`} otherwise it would
+be interpreted as the beginning of a block string. As an example, the source
+{`""""""`} can only be interpreted as a single empty block string and not three
+empty strings.
+
+Non-ASCII Unicode characters are allowed within single-quoted strings.
+Since {SourceCharacter} must not contain some ASCII control characters, escape
+sequences must be used to represent these characters. The {`\`}, {`"`}
+characters also must be escaped. All other escape sequences are optional.

 **Block Strings**

 Block strings are sequences of characters wrapped in triple-quotes (`"""`).
 White space, line terminators, quote, and backslash characters may all be
 used unescaped to enable verbatim text. Characters must all be valid
 {SourceCharacter}.

 Since block strings represent freeform text often used in indented
 positions, the string value semantics of a block string excludes uniform
 indentation and blank initial and trailing lines via {BlockStringValue()}.

 For example, the following operation containing a block string:

-```graphql example
+```raw graphql example
 mutation {
   sendEmail(message: """
     Hello,
       World!

     Yours,
       GraphQL.
   """)
@@ -785,44 +888,49 @@ which makes it a little harder to read."""
 ```

 Note: If non-printable ASCII characters are needed in a string value, a standard
 quoted string with appropriate escape sequences must be used instead of a
 block string.

 **Semantics**

-StringValue :: `"` StringCharacter* `"`
+StringValue :: `""`

-  * Return the Unicode character sequence of all {StringCharacter}
-    Unicode character values (which may be an empty sequence).
+  * Return an empty sequence.

-StringCharacter :: SourceCharacter but not `"` or \ or LineTerminator
+StringValue :: `"` StringCharacter+ `"`

-  * Return the character value of {SourceCharacter}.
+  * Return the sequence of all {StringCharacter} code points.
+
+StringCharacter :: SourceCharacter but not `"` or `\` or LineTerminator
+
+  * Return the code point {SourceCharacter}.

-StringCharacter :: \u EscapedUnicode
+StringCharacter :: `\u` EscapedUnicode

-  * Return the character whose code unit value in the Unicode Basic Multilingual
-    Plane is the 16-bit hexadecimal value {EscapedUnicode}.
+  * Let {value} be the 16-bit hexadecimal value represented by the sequence of
+    hexadecimal digits within {EscapedUnicode}.
+  * Return the code point {value}.

-StringCharacter :: \ EscapedCharacter
+StringCharacter :: `\` EscapedCharacter

-  * Return the character value of {EscapedCharacter} according to the table below.
+  * Return the code point represented by {EscapedCharacter} according to the
+    table below.

-| Escaped Character | Code Unit Value | Character Name               |
-| ----------------- | --------------- | ---------------------------- |
-| `"`               | U+0022          | double quote                 |
-| `\`               | U+005C          | reverse solidus (back slash) |
-| `/`               | U+002F          | solidus (forward slash)      |
-| `b`               | U+0008          | backspace                    |
-| `f`               | U+000C          | form feed                    |
-| `n`               | U+000A          | line feed (new line)         |
-| `r`               | U+000D          | carriage return              |
-| `t`               | U+0009          | horizontal tab               |
+| Escaped Character | Code Point | Character Name               |
+| ----------------- | ---------- | ---------------------------- |
+| {`"`}             | U+0022     | double quote                 |
+| {`\`}             | U+005C     | reverse solidus (back slash) |
+| {`/`}             | U+002F     | solidus (forward slash)      |
+| {`b`}             | U+0008     | backspace                    |
+| {`f`}             | U+000C     | form feed                    |
+| {`n`}             | U+000A     | line feed (new line)         |
+| {`r`}             | U+000D     | carriage return              |
+| {`t`}             | U+0009     | horizontal tab               |

 StringValue :: `"""` BlockStringCharacter* `"""`

   * Let {rawValue} be the Unicode character sequence of all
     {BlockStringCharacter} Unicode character values (which may be an empty
     sequence).
   * Return the result of {BlockStringValue(rawValue)}.

@@ -879,24 +987,24 @@ For example, these two field calls are similar, but are not identical:

 ```graphql example
 {
   field(arg: null)
   field
 }
 ```

-The first has explictly provided {null} to the argument "arg", while the second
+The first has explicitly provided {null} to the argument "arg", while the second
 has implicitly not provided a value to the argument "arg". These two forms may
 be interpreted differently. For example, a mutation representing deleting a
 field vs not altering a field, respectively. Neither form may be used for an
 input expecting a Non-Null type.

 Note: The same two methods of representing the lack of a value are possible via
-variables by either providing the a variable value as {null} and not providing
+variables by either providing the variable value as {null} or not providing
 a variable value at all.


 ### Enum Value

 EnumValue : Name but not `true`, `false` or `null`

 Enum values are represented as unquoted names (ex. `MOBILE_WEB`). It is
@@ -945,17 +1053,17 @@ curly-braces `{ }`. The values of an object literal may be any input value
 literal or variable (ex. `{ name: "Hello world", score: 1.0 }`). We refer to
 literal representation of input objects as "object literals."

 **Input object fields are unordered**

 Input object fields may be provided in any syntactic order and maintain
 identical semantic meaning.

-These two queries are semantically identical:
+These two operations are semantically identical:

 ```graphql example
 {
   nearestThing(location: { lon: 12.43, lat: -53.211 })
 }
 ```

 ```graphql example
@@ -981,60 +1089,59 @@ ObjectValue : { ObjectField+ }


 ## Variables

 Variable : $ Name

 VariableDefinitions : ( VariableDefinition+ )

-VariableDefinition : Variable : Type DefaultValue?
+VariableDefinition : Variable : Type DefaultValue? Directives[Const]?

 DefaultValue : = Value[Const]

-A GraphQL query can be parameterized with variables, maximizing query reuse,
+A GraphQL operation can be parameterized with variables, maximizing reuse,
 and avoiding costly string building in clients at runtime.

 If not defined as constant (for example, in {DefaultValue}), a {Variable} can be
 supplied for an input value.

 Variables must be defined at the top of an operation and are in scope
-throughout the execution of that operation.
+throughout the execution of that operation. Values for those variables are
+provided to a GraphQL service as part of a request so they may be substituted
+in during execution.

 In this example, we want to fetch a profile picture size based on the size
 of a particular device:

 ```graphql example
 query getZuckProfile($devicePicSize: Int) {
   user(id: 4) {
     id
     name
     profilePic(size: $devicePicSize)
   }
 }
 ```

-Values for those variables are provided to a GraphQL service along with a
-request so they may be substituted during execution. If providing JSON for the
-variables' values, we could run this query and request profilePic of
-size `60` width:
+If providing JSON for the variables' values, we could request a `profilePic` of
+size `60`:

 ```json example
 {
   "devicePicSize": 60
 }
 ```

 **Variable use within Fragments**

-Query variables can be used within fragments. Query variables have global scope
-with a given operation, so a variable used within a fragment must be declared
-in any top-level operation that transitively consumes that fragment. If
-a variable is referenced in a fragment and is included by an operation that does
-not define that variable, the operation cannot be executed.
+Variables can be used within fragments. Variables have global scope with a given operation, so a variable used within a fragment must be declared in any
+top-level operation that transitively consumes that fragment. If a variable is
+referenced in a fragment and is included by an operation that does not define
+that variable, that operation is invalid (see [All Variable Uses Defined](#sec-All-Variable-Uses-Defined)).


 ## Type References

 Type :
   - NamedType
   - ListType
   - NonNullType
@@ -1042,19 +1149,19 @@ Type :
 NamedType : Name

 ListType : [ Type ]

 NonNullType :
   - NamedType !
   - ListType !

-GraphQL describes the types of data expected by query variables. Input types
-may be lists of another input type, or a non-null variant of any other
-input type.
+GraphQL describes the types of data expected by arguments and variables.
+Input types may be lists of another input type, or a non-null variant of any
+other input type.

 **Semantics**

 Type : Name

   * Let {name} be the string value of {Name}
   * Let {type} be the type defined in the Schema named {name}
   * {type} must not be {null}
@@ -1084,13 +1191,36 @@ validation behavior in a GraphQL document.

 In some cases, you need to provide options to alter GraphQL's execution
 behavior in ways field arguments will not suffice, such as conditionally
 including or skipping a field. Directives provide this by describing additional information to the executor.

 Directives have a name along with a list of arguments which may accept values
 of any input type.

-Directives can be used to describe additional information for types, fields, fragments
-and operations.
+Directives can be used to describe additional information for types, fields,
+fragments and operations.

 As future versions of GraphQL adopt new configurable execution capabilities,
-they may be exposed via directives.
+they may be exposed via directives. GraphQL services and tools may also provide
+any additional *custom directive* beyond those described here.
+
+**Directive order is significant**
+
+Directives may be provided in a specific syntactic order which may have semantic interpretation.
+
+These two type definitions may have different semantic meaning:
+
+```graphql example
+type Person
+  @addExternalFields(source: "profiles")
+  @excludeField(name: "photo") {
+  name: String
+}
+```
+
+```graphql example
+type Person
+  @excludeField(name: "photo")
+  @addExternalFields(source: "profiles") {
+  name: String
+}
+```
~~~
</details>

<details>
<summary>spec/Section 3 -- Type System.md</summary>

~~~diff
@@ -1,51 +1,126 @@
 # Type System

-The GraphQL Type system describes the capabilities of a GraphQL server and is
-used to determine if a query is valid. The type system also describes the
-input types of query variables to determine if values provided at runtime
-are valid.
+The GraphQL Type system describes the capabilities of a GraphQL service and is
+used to determine if a requested operation is valid, to guarantee the type of
+response results, and describes the input types of variables to determine if
+values provided at request time are valid.
+
+TypeSystemDocument : TypeSystemDefinition+

 TypeSystemDefinition :
   - SchemaDefinition
   - TypeDefinition
   - DirectiveDefinition

 The GraphQL language includes an
 [IDL](https://en.wikipedia.org/wiki/Interface_description_language) used to
 describe a GraphQL service's type system. Tools may use this definition language
 to provide utilities such as client code generation or service boot-strapping.

-GraphQL tools which only seek to provide GraphQL query execution may choose not
-to parse {TypeSystemDefinition}.
-
-A GraphQL Document which contains {TypeSystemDefinition} must not be executed;
-GraphQL execution services which receive a GraphQL Document containing type
-system definitions should return a descriptive error.
+GraphQL tools or services which only seek to execute GraphQL requests and not
+construct a new GraphQL schema may choose not to allow {TypeSystemDefinition}.
+Tools which only seek to produce schema and not execute requests may choose to
+only allow {TypeSystemDocument} and not allow {ExecutableDefinition} or
+{TypeSystemExtension} but should provide a descriptive error if present.

 Note: The type system definition language is used throughout the remainder of
 this specification document when illustrating example type systems.


 ## Type System Extensions

+TypeSystemExtensionDocument : TypeSystemDefinitionOrExtension+
+
+TypeSystemDefinitionOrExtension :
+  - TypeSystemDefinition
+  - TypeSystemExtension
+
 TypeSystemExtension :
   - SchemaExtension
   - TypeExtension

-Type system extensions are used to represent a GraphQL type system which has been
-extended from some original type system. For example, this might be used by a
-local service to represent data a GraphQL client only accesses locally, or by a
-GraphQL service which is itself an extension of another GraphQL service.
+Type system extensions are used to represent a GraphQL type system which has
+been extended from some original type system. For example, this might be used by
+a local service to represent data a GraphQL client only accesses locally, or by
+a GraphQL service which is itself an extension of another GraphQL service.
+
+Tools which only seek to produce and extend schema and not execute requests may
+choose to only allow {TypeSystemExtensionDocument} and not allow
+{ExecutableDefinition} but should provide a descriptive error if present.
+
+
+## Descriptions
+
+Description : StringValue
+
+Documentation is a first-class feature of GraphQL type systems. To ensure
+the documentation of a GraphQL service remains consistent with its capabilities,
+descriptions of GraphQL definitions are provided alongside their definitions and
+made available via introspection.
+
+To allow GraphQL service designers to easily publish documentation alongside the
+capabilities of a GraphQL service, GraphQL descriptions are defined using the
+Markdown syntax (as specified by [CommonMark](https://commonmark.org/)). In the
+type system definition language, these description strings (often {BlockString})
+occur immediately before the definition they describe.
+
+GraphQL schema and all other definitions (e.g. types, fields, arguments, etc.)
+which can be described should provide a {Description} unless they are considered
+self descriptive.
+
+As an example, this simple GraphQL schema is well described:
+
+```raw graphql example
+"""
+A simple GraphQL schema which is well described.
+"""
+schema {
+  query: Query
+}
+
+"""
+Root type for all your query operations
+"""
+type Query {
+  """
+  Translates a string from a given language into a different language.
+  """
+  translate(
+    "The original language that `text` is provided in."
+    fromLanguage: Language
+
+    "The translated language to be returned."
+    toLanguage: Language
+
+    "The text to be translated."
+    text: String
+  ): String
+}
+
+"""
+The set of languages supported by `translate`.
+"""
+enum Language {
+  "English"
+  EN
+
+  "French"
+  FR
+
+  "Chinese"
+  CH
+}
+```


 ## Schema

-SchemaDefinition : schema Directives[Const]? { RootOperationTypeDefinition+ }
+SchemaDefinition : Description? schema Directives[Const]? { RootOperationTypeDefinition+ }

 RootOperationTypeDefinition : OperationType : NamedType

 A GraphQL service's collective type system capabilities are referred to as that
 service's "schema". A schema is defined in terms of the types and directives it
 supports as well as the root operation types for each kind of operation:
 query, mutation, and subscription; this determines the place in the type system
 where those operations begin.
@@ -64,60 +139,64 @@ begins with {"__"} (two underscores), as this is used exclusively by GraphQL's
 introspection system.

 ### Root Operation Types

 A schema defines the initial root operation type for each kind of operation it
 supports: query, mutation, and subscription; this determines the place in the
 type system where those operations begin.

-The `query` root operation type must be provided and must be an Object type.
+The {`query`} root operation type must be provided and must be an Object type.

-The `mutation` root operation type is optional; if it is not provided, the
+The {`mutation`} root operation type is optional; if it is not provided, the
 service does not support mutations. If it is provided, it must be an
 Object type.

-Similarly, the `subscription` root operation type is also optional; if it is not
-provided, the service does not support subscriptions. If it is provided, it must
-be an Object type.
+Similarly, the {`subscription`} root operation type is also optional; if it is
+not provided, the service does not support subscriptions. If it is provided, it
+must be an Object type.

-The fields on the `query` root operation type indicate what fields are available
-at the top level of a GraphQL query. For example, a basic GraphQL query like:
+The {`query`}, {`mutation`}, and {`subscription`} root types must all be
+different types if provided.
+
+The fields on the {`query`} root operation type indicate what fields are
+available at the top level of a GraphQL query operation.
+
+For example, this example operation:

 ```graphql example
 query {
   myName
 }
 ```

-Is valid when the `query` root operation type has a field named "myName".
+is only valid when the {`query`} root operation type has a field named "myName":

 ```graphql example
 type Query {
   myName: String
 }
 ```

-Similarly, the following mutation is valid if a `mutation` root operation type
-has a field named "setName". Note that the `query` and `mutation` root types
-must be different types.
+Similarly, the following mutation is only valid if the {`mutation`} root
+operation type has a field named "setName".

 ```graphql example
 mutation {
   setName(name: "Zuck") {
     newName
   }
 }
 ```

 When using the type system definition language, a document must include at most
-one `schema` definition.
+one {`schema`} definition.

 In this example, a GraphQL schema is defined with both query and mutation
-root types:
+root operation types:

 ```graphql example
 schema {
   query: MyQueryRootType
   mutation: MyMutationRootType
 }

 type MyQueryRootType {
@@ -127,107 +206,55 @@ type MyQueryRootType {
 type MyMutationRootType {
   setSomeField(to: String): String
 }
 ```

 **Default Root Operation Type Names**

 While any type can be the root operation type for a GraphQL operation, the type
-system definition language can omit the schema definition when the `query`,
-`mutation`, and `subscription` root types are named `Query`, `Mutation`, and
-`Subscription` respectively.
+system definition language can omit the schema definition when the {`query`},
+{`mutation`}, and {`subscription`} root types are named {"Query"}, {"Mutation"},
+and {"Subscription"} respectively.

 Likewise, when representing a GraphQL schema using the type system definition
 language, a schema definition should be omitted if it only uses the default root
 operation type names.

 This example describes a valid complete GraphQL schema, despite not explicitly
-including a `schema` definition. The `Query` type is presumed to be the `query`
-root operation type of the schema.
+including a {`schema`} definition. The {"Query"} type is presumed to be the
+{`query`} root operation type of the schema.

 ```graphql example
 type Query {
   someField: String
 }
 ```

 ### Schema Extension

 SchemaExtension :
-  - extend schema Directives[Const]? { OperationTypeDefinition+ }
-  - extend schema Directives[Const]
+  - extend schema Directives[Const]? { RootOperationTypeDefinition+ }
+  - extend schema Directives[Const] [lookahead != `{`]

 Schema extensions are used to represent a schema which has been extended from
 an original schema. For example, this might be used by a GraphQL service which
 adds additional operation types, or additional directives to an existing schema.

+Note: Schema extensions without additional operation type definitions must not
+be followed by a {`{`} (such as a query shorthand) to avoid parsing ambiguity.
+The same limitation applies to the type definitions and extensions below.
+
 **Schema Validation**

 Schema extensions have the potential to be invalid if incorrectly defined.

 1. The Schema must already be defined.
-2. Any directives provided must not already apply to the original Schema.
-
-
-## Descriptions
-
-Description : StringValue
-
-Documentation is first-class feature of GraphQL type systems. To ensure
-the documentation of a GraphQL service remains consistent with its capabilities,
-descriptions of GraphQL definitions are provided alongside their definitions and
-made available via introspection.
-
-To allow GraphQL service designers to easily publish documentation alongside the
-capabilities of a GraphQL service, GraphQL descriptions are defined using the
-Markdown syntax (as specified by [CommonMark](http://commonmark.org/)). In the
-type system definition language, these description strings (often {BlockString})
-occur immediately before the definition they describe.
-
-All GraphQL types, fields, arguments and other definitions which can be
-described should provide a {Description} unless they are considered self
-descriptive.
-
-As an example, this simple GraphQL schema is well described:
-
-```graphql example
-"""
-A simple GraphQL schema which is well described.
-"""
-type Query {
-  """
-  Translates a string from a given language into a different language.
-  """
-  translate(
-    "The original language that `text` is provided in."
-    fromLanguage: Language
-
-    "The translated language to be returned."
-    toLanguage: Language
-
-    "The text to be translated."
-    text: String
-  ): String
-}
-
-"""
-The set of languages supported by `translate`.
-"""
-enum Language {
-  "English"
-  EN
-
-  "French"
-  FR
-
-  "Chinese"
-  CH
-}
-```
+2. Any non-repeatable directives provided must not already apply to the
+   original Schema.


 ## Types

 TypeDefinition :
   - ScalarTypeDefinition
   - ObjectTypeDefinition
   - InterfaceTypeDefinition
@@ -244,53 +271,54 @@ are enumerable. GraphQL offers an `Enum` type in those cases, where the type
 specifies the space of valid responses.

 Scalars and Enums form the leaves in response trees; the intermediate levels are
 `Object` types, which define a set of fields, where each field is another
 type in the system, allowing the definition of arbitrary type hierarchies.

 GraphQL supports two abstract types: interfaces and unions.

-An `Interface` defines a list of fields; `Object` types that implement that
-interface are guaranteed to implement those fields. Whenever the type system
-claims it will return an interface, it will return a valid implementing type.
+An `Interface` defines a list of fields; `Object` types and other Interface
+types which implement this Interface are guaranteed to implement those fields.
+Whenever a field claims it will return an Interface type, it will return a
+valid implementing Object type during execution.

 A `Union` defines a list of possible types; similar to interfaces, whenever the
 type system claims a union will be returned, one of the possible types will be
 returned.

 Finally, oftentimes it is useful to provide complex structs as inputs to
 GraphQL field arguments or variables; the `Input Object` type allows the schema
 to define exactly what data is expected.


 ### Wrapping Types

 All of the types so far are assumed to be both nullable and singular: e.g. a
 scalar string returns either null or a singular string.

-A GraphQL schema may describe that a field represents list of another types;
+A GraphQL schema may describe that a field represents a list of another type;
 the `List` type is provided for this reason, and wraps another type.

 Similarly, the `Non-Null` type wraps another type, and denotes that the
-resulting value will never be {null} (and that an error cannot result in a
+resulting value will never be {null} (and that a field error cannot result in a
 {null} value).

 These two types are referred to as "wrapping types"; non-wrapping types are
 referred to as "named types". A wrapping type has an underlying named type,
 found by continually unwrapping the type until a named type is found.


 ### Input and Output Types

 Types are used throughout GraphQL to describe both the values accepted as input
 to arguments and variables as well as the values output by fields. These two
 uses categorize types as *input types* and *output types*. Some kinds of types,
 like Scalar and Enum types, can be used as both input types and output types;
-other kinds types can only be used in one or the other. Input Object types can
+other kinds of types can only be used in one or the other. Input Object types can
 only be used as input types. Object, Interface, and Union types can only be used
 as output types. Lists and Non-Null types may be used as input types or output
 types depending on how the wrapped type may be used.

 IsInputType(type) :
   * If {type} is a List type or Non-Null type:
     * Let {unwrappedType} be the unwrapped type of {type}.
     * Return IsInputType({unwrappedType})
@@ -322,273 +350,319 @@ from some original type. For example, this might be used by a local service to
 represent additional fields a GraphQL client only accesses locally.


 ## Scalars

 ScalarTypeDefinition : Description? scalar Name Directives[Const]?

 Scalar types represent primitive leaf values in a GraphQL type system. GraphQL
-responses take the form of a hierarchical tree; the leaves on these trees are
-GraphQL scalars.
-
-All GraphQL scalars are representable as strings, though depending on the
-response format being used, there may be a more appropriate primitive for the
-given scalar type, and server should use those types when appropriate.
-
-GraphQL provides a number of built-in scalars, but type systems can add
-additional scalars with semantic meaning. For example, a GraphQL system could
-define a scalar called `Time` which, while serialized as a string, promises to
-conform to ISO-8601. When querying a field of type `Time`, you can then rely on
-the ability to parse the result with an ISO-8601 parser and use a
-client-specific primitive for time. Another example of a potentially useful
-custom scalar is `Url`, which serializes as a string, but is guaranteed by
-the server to be a valid URL.
+responses take the form of a hierarchical tree; the leaves of this tree are
+typically GraphQL Scalar types (but may also be Enum types or {null} values).
+
+GraphQL provides a number of built-in scalars which are fully defined in the
+sections below, however type systems may also add additional custom scalars to
+introduce additional semantic meaning.
+
+**Built-in Scalars**
+
+GraphQL specifies a basic set of well-defined Scalar types: {Int}, {Float},
+{String}, {Boolean}, and {ID}. A GraphQL framework should support all of these
+types, and a GraphQL service which provides a type by these names must adhere to
+the behavior described for them in this document. As an example, a service must
+not include a type called {Int} and use it to represent 64-bit numbers,
+internationalization information, or anything other than what is defined in
+this document.
+
+When returning the set of types from the `__Schema` introspection type, all
+referenced built-in scalars must be included. If a built-in scalar type is not
+referenced anywhere in a schema (there is no field, argument, or input field of
+that type) then it must not be included.
+
+When representing a GraphQL schema using the type system definition language,
+all built-in scalars must be omitted for brevity.
+
+**Custom Scalars**
+
+GraphQL services may use custom scalar types in addition to the built-in
+scalars. For example, a GraphQL service could define a scalar called `UUID`
+which, while serialized as a string, conforms to [RFC 4122](https://tools.ietf.org/html/rfc4122).
+When querying a field of type `UUID`, you can then rely on the ability to parse
+the result with a RFC 4122 compliant parser. Another example of a potentially
+useful custom scalar is `URL`, which serializes as a string, but is guaranteed
+by the server to be a valid URL.
+
+:: When defining a custom scalar, GraphQL services should provide a *scalar
+specification URL* via the `@specifiedBy` directive or the `specifiedByURL`
+introspection field. This URL must link to a human-readable specification of the
+data format, serialization, and coercion rules for the scalar.
+
+For example, a GraphQL service providing a `UUID` scalar may link to RFC 4122,
+or some custom document defining a reasonable subset of that RFC. If a *scalar
+specification URL* is present, systems and tools that are aware of it should
+conform to its described rules.

 ```graphql example
-scalar Time
-scalar Url
+scalar UUID @specifiedBy(url: "https://tools.ietf.org/html/rfc4122")
+scalar URL @specifiedBy(url: "https://tools.ietf.org/html/rfc3986")
 ```

-A server may omit any of the built-in scalars from its schema, for example if a
-schema does not refer to a floating-point number, then it must not include the
-`Float` type. However, if a schema includes a type with the name of one of the
-types described here, it must adhere to the behavior described. As an example,
-a server must not include a type called `Int` and use it to represent
-128-bit numbers, internationalization information, or anything other than what
-is defined in this document.
+Custom *scalar specification URL*s should provide a single, stable format to
+avoid ambiguity. If the linked specification is in flux, the service should link
+to a fixed version rather than to a resource which might change.

-When representing a GraphQL schema using the type system definition language,
-the built-in scalar types should be omitted for brevity.
+Custom *scalar specification URL*s should not be changed once defined. Doing so
+would likely disrupt tooling or could introduce breaking changes within the
+linked specification's contents.

-**Result Coercion**
+Built-in scalar types must not provide a *scalar specification URL* as they are
+specified by this document.
+
+Note: Custom scalars should also summarize the specified format and provide
+examples in their description.

-A GraphQL server, when preparing a field of a given scalar type, must uphold the
+**Result Coercion and Serialization**
+
+A GraphQL service, when preparing a field of a given scalar type, must uphold the
 contract the scalar type describes, either by coercing the value or producing a
-field error if a value cannot be coerced or if coercion may result in data loss.
+[field error](#sec-Errors.Field-errors) if a value cannot be coerced or if
+coercion may result in data loss.

 A GraphQL service may decide to allow coercing different internal types to the
-expected return type. For example when coercing a field of type `Int` a boolean
-`true` value may produce `1` or a string value `"123"` may be parsed as base-10
-`123`. However if internal type coercion cannot be reasonably performed without
+expected return type. For example when coercing a field of type {Int} a boolean
+{true} value may produce {1} or a string value {"123"} may be parsed as base-10
+{123}. However if internal type coercion cannot be reasonably performed without
 losing information, then it must raise a field error.

-Since this coercion behavior is not observable to clients of the GraphQL server,
+Since this coercion behavior is not observable to clients of the GraphQL service,
 the precise rules of coercion are left to the implementation. The only
-requirement is that the server must yield values which adhere to the expected
+requirement is that the service must yield values which adhere to the expected
 Scalar type.

+GraphQL scalars are serialized according to the serialization format being used.
+There may be a most appropriate serialized primitive for each given scalar type,
+and the service should produce each primitive where appropriate.
+
+See [Serialization Format](#sec-Serialization-Format) for more detailed
+information on the serialization of scalars in common JSON and other formats.
+
 **Input Coercion**

-If a GraphQL server expects a scalar type as input to an argument, coercion
+If a GraphQL service expects a scalar type as input to an argument, coercion
 is observable and the rules must be well defined. If an input value does not
-match a coercion rule, a query error must be raised.
+match a coercion rule, a [request error](#sec-Errors.Request-errors) must be
+raised (input values are validated before execution begins).

 GraphQL has different constant literals to represent integer and floating-point
 input values, and coercion rules may apply differently depending on which type
-of input value is encountered. GraphQL may be parameterized by query variables,
-the values of which are often serialized when sent over a transport like HTTP. Since
+of input value is encountered. GraphQL may be parameterized by variables, the
+values of which are often serialized when sent over a transport like HTTP. Since
 some common serializations (ex. JSON) do not discriminate between integer
 and floating-point values, they are interpreted as an integer input value if
 they have an empty fractional part (ex. `1.0`) and otherwise as floating-point
 input value.

 For all types below, with the exception of Non-Null, if the explicit value
 {null} is provided, then the result of input coercion is {null}.

-**Built-in Scalars**
-
-GraphQL provides a basic set of well-defined Scalar types. A GraphQL server
-should support all of these types, and a GraphQL server which provide a type by
-these names must adhere to the behavior described below.
-

 ### Int

 The Int scalar type represents a signed 32-bit numeric non-fractional value.
 Response formats that support a 32-bit integer or a number type should use
 that type to represent this scalar.

 **Result Coercion**

-Fields returning the type `Int` expect to encounter 32-bit integer
+Fields returning the type {Int} expect to encounter 32-bit integer
 internal values.

-GraphQL servers may coerce non-integer internal values to integers when
+GraphQL services may coerce non-integer internal values to integers when
 reasonable without losing information, otherwise they must raise a field error.
 Examples of this may include returning `1` for the floating-point number `1.0`,
 or returning `123` for the string `"123"`. In scenarios where coercion may lose
 data, raising a field error is more appropriate. For example, a floating-point
 number `1.2` should raise a field error instead of being truncated to `1`.

 If the integer internal value represents a value less than -2<sup>31</sup> or
 greater than or equal to 2<sup>31</sup>, a field error should be raised.

 **Input Coercion**

 When expected as an input type, only integer input values are accepted. All
-other input values, including strings with numeric content, must raise a query
+other input values, including strings with numeric content, must raise a request
 error indicating an incorrect type. If the integer input value represents a
 value less than -2<sup>31</sup> or greater than or equal to 2<sup>31</sup>, a
-query error should be raised.
+request error should be raised.

 Note: Numeric integer values larger than 32-bit should either use String or a
 custom-defined Scalar type, as not all platforms and transports support
 encoding integer numbers larger than 32-bit.


 ### Float

-The Float scalar type represents signed double-precision fractional values
-as specified by [IEEE 754](http://en.wikipedia.org/wiki/IEEE_floating_point).
-Response formats that support an appropriate double-precision number type
-should use that type to represent this scalar.
+The Float scalar type represents signed double-precision finite values as
+specified by [IEEE 754](https://en.wikipedia.org/wiki/IEEE_floating_point).
+Response formats that support an appropriate double-precision number type should
+use that type to represent this scalar.

 **Result Coercion**

-Fields returning the type `Float` expect to encounter double-precision
+Fields returning the type {Float} expect to encounter double-precision
 floating-point internal values.

-GraphQL servers may coerce non-floating-point internal values to `Float` when
+GraphQL services may coerce non-floating-point internal values to {Float} when
 reasonable without losing information, otherwise they must raise a field error.
 Examples of this may include returning `1.0` for the integer number `1`, or
 `123.0` for the string `"123"`.

+Non-finite floating-point internal values ({NaN} and {Infinity}) cannot be
+coerced to {Float} and must raise a field error.
+
 **Input Coercion**

 When expected as an input type, both integer and float input values are
 accepted. Integer input values are coerced to Float by adding an empty
 fractional part, for example `1.0` for the integer input value `1`. All
-other input values, including strings with numeric content, must raise a query
-error indicating an incorrect type. If the integer input value represents a
-value not representable by IEEE 754, a query error should be raised.
+other input values, including strings with numeric content, must raise a request
+error indicating an incorrect type. If the input value otherwise represents a
+value not representable by finite IEEE 754 (e.g. {NaN}, {Infinity}, or a value
+outside the available precision), a request error must be raised.


 ### String

-The String scalar type represents textual data, represented as UTF-8 character
-sequences. The String type is most often used by GraphQL to represent free-form
-human-readable text. All response formats must support string representations,
-and that representation must be used here.
+The String scalar type represents textual data, represented as a sequence of
+Unicode code points. The String type is most often used by GraphQL to
+represent free-form human-readable text. How the String is encoded internally
+(for example UTF-8) is left to the service implementation. All response
+serialization formats must support a string representation (for example, JSON
+Unicode strings), and that representation must be used to serialize this type.

 **Result Coercion**

-Fields returning the type `String` expect to encounter UTF-8 string internal values.
+Fields returning the type {String} expect to encounter Unicode string values.

-GraphQL servers may coerce non-string raw values to `String` when reasonable
+GraphQL services may coerce non-string raw values to {String} when reasonable
 without losing information, otherwise they must raise a field error. Examples of
 this may include returning the string `"true"` for a boolean true value, or the
 string `"1"` for the integer `1`.

 **Input Coercion**

-When expected as an input type, only valid UTF-8 string input values are
-accepted. All other input values must raise a query error indicating an
+When expected as an input type, only valid Unicode string input values are
+accepted. All other input values must raise a request error indicating an
 incorrect type.


 ### Boolean

 The Boolean scalar type represents `true` or `false`. Response formats should
 use a built-in boolean type if supported; otherwise, they should use their
 representation of the integers `1` and `0`.

 **Result Coercion**

-Fields returning the type `Boolean` expect to encounter boolean internal values.
+Fields returning the type {Boolean} expect to encounter boolean internal values.

-GraphQL servers may coerce non-boolean raw values to `Boolean` when reasonable
+GraphQL services may coerce non-boolean raw values to {Boolean} when reasonable
 without losing information, otherwise they must raise a field error. Examples of
 this may include returning `true` for non-zero numbers.

 **Input Coercion**

 When expected as an input type, only boolean input values are accepted. All
-other input values must raise a query error indicating an incorrect type.
+other input values must raise a request error indicating an incorrect type.


 ### ID

 The ID scalar type represents a unique identifier, often used to refetch an
 object or as the key for a cache. The ID type is serialized in the same way as
-a `String`; however, it is not intended to be human-readable. While it is
-often numeric, it should always serialize as a `String`.
+a {String}; however, it is not intended to be human-readable. While it is
+often numeric, it should always serialize as a {String}.

 **Result Coercion**

 GraphQL is agnostic to ID format, and serializes to string to ensure consistency
 across many formats ID could represent, from small auto-increment numbers, to
 large 128-bit random numbers, to base64 encoded values, or string values of a
-format like [GUID](http://en.wikipedia.org/wiki/Globally_unique_identifier).
+format like [GUID](https://en.wikipedia.org/wiki/Globally_unique_identifier).

-GraphQL servers should coerce as appropriate given the ID formats they expect.
+GraphQL services should coerce as appropriate given the ID formats they expect.
 When coercion is not possible they must raise a field error.

 **Input Coercion**

-When expected as an input type, any string (such as `"4"`) or integer (such
-as `4`) input value should be coerced to ID as appropriate for the ID formats
-a given GraphQL server expects. Any other input value, including float input
-values (such as `4.0`), must raise a query error indicating an incorrect type.
+When expected as an input type, any string (such as `"4"`) or integer (such as
+`4` or `-4`) input value should be coerced to ID as appropriate for the ID
+formats a given GraphQL service expects. Any other input value, including float
+input values (such as `4.0`), must raise a request error indicating an incorrect
+type.


 ### Scalar Extensions

 ScalarTypeExtension :
   - extend scalar Name Directives[Const]

 Scalar type extensions are used to represent a scalar type which has been
 extended from some original scalar type. For example, this might be used by a
 GraphQL tool or service which adds directives to an existing scalar.

 **Type Validation**

 Scalar type extensions have the potential to be invalid if incorrectly defined.

 1. The named type must already be defined and must be a Scalar type.
-2. Any directives provided must not already apply to the original Scalar type.
+2. Any non-repeatable directives provided must not already apply to the
+   original Scalar type.


 ## Objects

-ObjectTypeDefinition : Description? type Name ImplementsInterfaces? Directives[Const]? FieldsDefinition?
+ObjectTypeDefinition :
+  - Description? type Name ImplementsInterfaces? Directives[Const]? FieldsDefinition
+  - Description? type Name ImplementsInterfaces? Directives[Const]? [lookahead != `{`]

 ImplementsInterfaces :
-  - implements `&`? NamedType
   - ImplementsInterfaces & NamedType
+  - implements `&`? NamedType

 FieldsDefinition : { FieldDefinition+ }

 FieldDefinition : Description? Name ArgumentsDefinition? : Type Directives[Const]?

-GraphQL queries are hierarchical and composed, describing a tree of information.
-While Scalar types describe the leaf values of these hierarchical queries, Objects
-describe the intermediate levels.
+GraphQL operations are hierarchical and composed, describing a tree of
+information. While Scalar types describe the leaf values of these hierarchical
+operations, Objects describe the intermediate levels.

 GraphQL Objects represent a list of named fields, each of which yield a value of
 a specific type. Object values should be serialized as ordered maps, where the
-queried field names (or aliases) are the keys and the result of evaluating
-the field is the value, ordered by the order in which they appear in the query.
+selected field names (or aliases) are the keys and the result of evaluating
+the field is the value, ordered by the order in which they appear in
+the selection set.

 All fields defined within an Object type must not have a name which begins with
 {"__"} (two underscores), as this is used exclusively by GraphQL's
 introspection system.

 For example, a type `Person` could be described as:

 ```graphql example
 type Person {
   name: String
   age: Int
   picture: Url
 }
 ```

-Where `name` is a field that will yield a `String` value, and `age` is a field
-that will yield an `Int` value, and `picture` is a field that will yield a
+Where `name` is a field that will yield a {String} value, and `age` is a field
+that will yield an {Int} value, and `picture` is a field that will yield a
 `Url` value.

 A query of an object value must select at least one field. This selection of
 fields will yield an ordered map containing exactly the subset of the object
 queried, which should be represented in the order in which they were queried.
 Only fields that are declared on the object type may validly be queried on
 that object.

@@ -640,18 +714,18 @@ For example, the `Person` type might include a `relationship`:
 type Person {
   name: String
   age: Int
   picture: Url
   relationship: Person
 }
 ```

-Valid queries must supply a nested field set for a field that returns
-an object, so this query is not valid:
+Valid operations must supply a nested field set for any field that returns an
+object, so this operation is not valid:

 ```graphql counter-example
 {
   name
   relationship
 }
 ```

@@ -675,17 +749,17 @@ And will yield the subset of each object type queried:
     "name": "Priscilla Chan"
   }
 }
 ```

 **Field Ordering**

 When querying an Object, the resulting mapping of fields are conceptually
-ordered in the same order in which they were encountered during query execution,
+ordered in the same order in which they were encountered during execution,
 excluding fragments for which the type does not apply and fields or
 fragments that are skipped via `@skip` or `@include` directives. This ordering
 is correctly produced when using the {CollectFields()} algorithm.

 Response serialization formats capable of representing ordered maps should
 maintain this ordering. Serialization formats which can only represent unordered
 maps (such as JSON) should retain this order textually. That is, if two fields
 `{foo, bar}` were queried in that order, the resulting JSON serialization
@@ -798,41 +872,64 @@ of rules must be adhered to by every Object type in a GraphQL schema.
    2. The field must not have a name which begins with the
       characters {"__"} (two underscores).
    3. The field must return a type where {IsOutputType(fieldType)} returns {true}.
    4. For each argument of the field:
       1. The argument must not have a name which begins with the
          characters {"__"} (two underscores).
       2. The argument must accept a type where {IsInputType(argumentType)}
          returns {true}.
-4. An object type may declare that it implements one or more unique interfaces.
-5. An object type must be a super-set of all interfaces it implements:
-   1. The object type must include a field of the same name for every field
-      defined in an interface.
-      1. The object field must be of a type which is equal to or a sub-type of
-         the interface field (covariant).
-         1. An object field type is a valid sub-type if it is equal to (the same
-            type as) the interface field type.
-         2. An object field type is a valid sub-type if it is an Object type and
-            the interface field type is either an Interface type or a Union type
-            and the object field type is a possible type of the interface field
-            type.
-         3. An object field type is a valid sub-type if it is a List type and
-            the interface field type is also a List type and the list-item type
-            of the object field type is a valid sub-type of the list-item type
-            of the interface field type.
-         4. An object field type is a valid sub-type if it is a Non-Null variant
-            of a valid sub-type of the interface field type.
-      2. The object field must include an argument of the same name for every
-         argument defined in the interface field.
-         1. The object field argument must accept the same type (invariant) as
-            the interface field argument.
-      3. The object field may include additional arguments not defined in the
-         interface field, but any additional argument must not be required, e.g.
-         must not be of a non-nullable type.
+3. An object type may declare that it implements one or more unique interfaces.
+4. An object type must be a super-set of all interfaces it implements:
+   1. Let this object type be {objectType}.
+   2. For each interface declared implemented as {interfaceType},
+      {IsValidImplementation(objectType, interfaceType)} must be {true}.
+
+IsValidImplementation(type, implementedType):
+
+   1. If {implementedType} declares it implements any interfaces,
+      {type} must also declare it implements those interfaces.
+   2. {type} must include a field of the same name for every field
+      defined in {implementedType}.
+      1. Let {field} be that named field on {type}.
+      2. Let {implementedField} be that named field on {implementedType}.
+      3. {field} must include an argument of the same name for every argument
+         defined in {implementedField}.
+         1. That named argument on {field} must accept the same type
+            (invariant) as that named argument on {implementedField}.
+      4. {field} may include additional arguments not defined in
+         {implementedField}, but any additional argument must not be required,
+         e.g. must not be of a non-nullable type.
+      5. {field} must return a type which is equal to or a sub-type of
+         (covariant) the return type of {implementedField} field's return type:
+         1. Let {fieldType} be the return type of {field}.
+         2. Let {implementedFieldType} be the return type of {implementedField}.
+         3. {IsValidImplementationFieldType(fieldType, implementedFieldType)}
+            must be {true}.
+
+IsValidImplementationFieldType(fieldType, implementedFieldType):
+  1. If {fieldType} is a Non-Null type:
+     1. Let {nullableType} be the unwrapped nullable type of {fieldType}.
+     2. Let {implementedNullableType} be the unwrapped nullable type
+        of {implementedFieldType} if it is a Non-Null type, otherwise let it be
+        {implementedFieldType} directly.
+     3. Return {IsValidImplementationFieldType(nullableType, implementedNullableType)}.
+  2. If {fieldType} is a List type and {implementedFieldType} is also a List type:
+     1. Let {itemType} be the unwrapped item type of {fieldType}.
+     2. Let {implementedItemType} be the unwrapped item type
+        of {implementedFieldType}.
+     3. Return {IsValidImplementationFieldType(itemType, implementedItemType)}.
+  3. If {fieldType} is the same type as {implementedFieldType} then return {true}.
+  4. If {fieldType} is an Object type and {implementedFieldType} is
+     a Union type and {fieldType} is a possible type of {implementedFieldType}
+     then return {true}.
+  5. If {fieldType} is an Object or Interface type and {implementedFieldType}
+     is an Interface type and {fieldType} declares it implements
+     {implementedFieldType} then return {true}.
+  6. Otherwise return {false}.


 ### Field Arguments

 ArgumentsDefinition : ( InputValueDefinition+ )

 InputValueDefinition : Description? Name : Type DefaultValue? Directives[Const]?

@@ -850,64 +947,64 @@ determine what size of an image to return.

 ```graphql example
 type Person {
   name: String
   picture(size: Int): Url
 }
 ```

-GraphQL queries can optionally specify arguments to their fields to provide
+Operations can optionally specify arguments to their fields to provide
 these arguments.

-This example query:
+This example operation:

 ```graphql example
 {
   name
   picture(size: 600)
 }
 ```

-May yield the result:
+May return the result:

 ```json example
 {
   "name": "Mark Zuckerberg",
   "picture": "http://some.cdn/picture_600.jpg"
 }
 ```

 The type of an object field argument must be an input type (any type except an
 Object, Interface, or Union type).


 ### Field Deprecation

 Fields in an object may be marked as deprecated as deemed necessary by the
-application. It is still legal to query for these fields (to ensure existing
-clients are not broken by the change), but the fields should be appropriately
-treated in documentation and tooling.
+application. It is still legal to include these fields in a selection set
+(to ensure existing clients are not broken by the change), but the fields should
+be appropriately treated in documentation and tooling.

 When using the type system definition language, `@deprecated` directives are
 used to indicate that a field is deprecated:

 ```graphql example
 type ExampleType {
   oldField: String @deprecated
 }
 ```


 ### Object Extensions

 ObjectTypeExtension :
   - extend type Name ImplementsInterfaces? Directives[Const]? FieldsDefinition
-  - extend type Name ImplementsInterfaces? Directives[Const]
-  - extend type Name ImplementsInterfaces
+  - extend type Name ImplementsInterfaces? Directives[Const] [lookahead != `{`]
+  - extend type Name ImplementsInterfaces [lookahead != `{`]

 Object type extensions are used to represent a type which has been extended from
 some original type. For example, this might be used to represent local data, or
 by a GraphQL service which is itself an extension of another GraphQL service.

 In this example, a local data field is added to a `Story` type:

 ```graphql example
@@ -929,30 +1026,33 @@ extend type User @addedDirective

 Object type extensions have the potential to be invalid if incorrectly defined.

 1. The named type must already be defined and must be an Object type.
 2. The fields of an Object type extension must have unique names; no two fields
    may share the same name.
 3. Any fields of an Object type extension must not be already defined on the
    original Object type.
-4. Any directives provided must not already apply to the original Object type.
+4. Any non-repeatable directives provided must not already apply to the
+   original Object type.
 5. Any interfaces provided must not be already implemented by the original
    Object type.
 6. The resulting extended object type must be a super-set of all interfaces it
    implements.


 ## Interfaces

-InterfaceTypeDefinition : Description? interface Name Directives[Const]? FieldsDefinition?
+InterfaceTypeDefinition :
+  - Description? interface Name ImplementsInterfaces? Directives[Const]? FieldsDefinition
+  - Description? interface Name ImplementsInterfaces? Directives[Const]? [lookahead != `{`]

 GraphQL interfaces represent a list of named fields and their arguments. GraphQL
-objects can then implement these interfaces which requires that the object type
-will define all fields defined by those interfaces.
+objects and interfaces can then implement these interfaces which requires that
+the implementing type will define all fields defined by those interfaces.

 Fields on a GraphQL interface have the same rules as fields on a GraphQL object;
 their type can be Scalar, Object, Enum, Interface, or Union, or any wrapping
 type whose base type is one of those five.

 For example, an interface `NamedEntity` may describe a required field and types
 such as `Person` or `Business` may then implement this interface to guarantee
 this field will always exist.
@@ -989,59 +1089,116 @@ To continue the example, a `Contact` might refer to `NamedEntity`.
 ```graphql example
 type Contact {
   entity: NamedEntity
   phoneNumber: String
   address: String
 }
 ```

-This allows us to write a query for a `Contact` that can select the
+This allows us to write a selection set for a `Contact` that can select the
 common fields.

 ```graphql example
 {
   entity {
     name
   }
   phoneNumber
 }
 ```

-When querying for fields on an interface type, only those fields declared on
+When selecting fields on an interface type, only those fields declared on
 the interface may be queried. In the above example, `entity` returns a
 `NamedEntity`, and `name` is defined on `NamedEntity`, so it is valid. However,
-the following would not be a valid query:
+the following would not be a valid selection set against `Contact`:

 ```graphql counter-example
 {
   entity {
     name
     age
   }
   phoneNumber
 }
 ```

 because `entity` refers to a `NamedEntity`, and `age` is not defined on that
 interface. Querying for `age` is only valid when the result of `entity` is a
-`Person`; the query can express this using a fragment or an inline fragment:
+`Person`; this can be expressed using a fragment or an inline fragment:

 ```graphql example
 {
   entity {
     name
     ... on Person {
       age
     }
-  },
+  }
   phoneNumber
 }
 ```

+**Interfaces Implementing Interfaces**
+
+When defining an interface that implements another interface, the implementing
+interface must define each field that is specified by the implemented interface.
+For example, the interface Resource must define the field id to implement the
+Node interface:
+
+```raw graphql example
+interface Node {
+  id: ID!
+}
+
+interface Resource implements Node {
+  id: ID!
+  url: String
+}
+```
+
+Transitively implemented interfaces (interfaces implemented by the interface
+that is being implemented) must also be defined on an implementing type or
+interface. For example, `Image` cannot implement `Resource` without also
+implementing `Node`:
+
+```raw graphql example
+interface Node {
+  id: ID!
+}
+
+interface Resource implements Node {
+  id: ID!
+  url: String
+}
+
+interface Image implements Resource & Node {
+  id: ID!
+  url: String
+  thumbnail: String
+}
+```
+
+Interface definitions must not contain cyclic references nor implement
+themselves. This example is invalid because `Node` and `Named` implement
+themselves and each other:
+
+```graphql counter-example
+interface Node implements Named & Node {
+  id: ID!
+  name: String
+}
+
+interface Named implements Node & Named {
+  id: ID!
+  name: String
+}
+```
+
+
 **Result Coercion**

 The interface type should have some way of determining which object a given
 result corresponds to. Once it has done so, the result coercion of the interface
 is the same as the result coercion of the object.

 **Input Coercion**

@@ -1059,23 +1216,30 @@ Interface types have the potential to be invalid if incorrectly defined.
       characters {"__"} (two underscores).
    3. The field must return a type where {IsOutputType(fieldType)}
       returns {true}.
    4. For each argument of the field:
       1. The argument must not have a name which begins with the
          characters {"__"} (two underscores).
       2. The argument must accept a type where {IsInputType(argumentType)}
          returns {true}.
+3. An interface type may declare that it implements one or more unique
+   interfaces, but may not implement itself.
+4. An interface type must be a super-set of all interfaces it implements:
+   1. Let this interface type be {implementingType}.
+   2. For each interface declared implemented as {implementedType},
+      {IsValidImplementation(implementingType, implementedType)} must be {true}.


 ### Interface Extensions

 InterfaceTypeExtension :
-  - extend interface Name Directives[Const]? FieldsDefinition
-  - extend interface Name Directives[Const]
+  - extend interface Name ImplementsInterfaces? Directives[Const]? FieldsDefinition
+  - extend interface Name ImplementsInterfaces? Directives[Const] [lookahead != `{`]
+  - extend interface Name ImplementsInterfaces [lookahead != `{`]

 Interface type extensions are used to represent an interface which has been
 extended from some original interface. For example, this might be used to
 represent common local data on many types, or by a GraphQL service which is
 itself an extension of another GraphQL service.

 In this example, an extended data field is added to a `NamedEntity` type along
 with the types which implement it:
@@ -1108,40 +1272,44 @@ extend interface NamedEntity @addedDirective

 Interface type extensions have the potential to be invalid if incorrectly defined.

 1. The named type must already be defined and must be an Interface type.
 2. The fields of an Interface type extension must have unique names; no two
    fields may share the same name.
 3. Any fields of an Interface type extension must not be already defined on the
    original Interface type.
-4. Any Object type which implemented the original Interface type must also be a
-   super-set of the fields of the Interface type extension (which may be due to
-   Object type extension).
-5. Any directives provided must not already apply to the original Interface type.
+4. Any Object or Interface type which implemented the original Interface type
+   must also be a super-set of the fields of the Interface type extension (which
+   may be due to Object type extension).
+5. Any non-repeatable directives provided must not already apply to the
+   original Interface type.
+6. The resulting extended Interface type must be a super-set of all Interfaces
+   it implements.


 ## Unions

 UnionTypeDefinition : Description? union Name Directives[Const]? UnionMemberTypes?

 UnionMemberTypes :
-  - = `|`? NamedType
   - UnionMemberTypes | NamedType
+  - = `|`? NamedType

 GraphQL Unions represent an object that could be one of a list of GraphQL
 Object types, but provides for no guaranteed fields between those types.
 They also differ from interfaces in that Object types declare what interfaces
 they implement, but are not aware of what unions contain them.

 With interfaces and objects, only those fields defined on the type can be
 queried directly; to query other fields on an interface, typed fragments
 must be used. This is the same as for unions, but unions do not define any
 fields, so **no** fields may be queried on this type without the use of
-type refining fragments or inline fragments.
+type refining fragments or inline fragments (with the exception of the
+meta-field {__typename}).

 For example, we might define the following types:

 ```graphql example
 union SearchResult = Photo | Person

 type Person {
   name: String
@@ -1153,32 +1321,30 @@ type Photo {
   width: Int
 }

 type SearchQuery {
   firstSearchResult: SearchResult
 }
 ```

-When querying the `firstSearchResult` field of type `SearchQuery`, the
-query would ask for all fields inside of a fragment indicating the appropriate
-type. If the query wanted the name if the result was a Person, and the height if
-it was a photo, the following query is invalid, because the union itself
-defines no fields:
+In this example, a query operation wants the name if the result was a Person,
+and the height if it was a photo. However because a union itself defines no
+fields, this could be ambiguous and is invalid.

 ```graphql counter-example
 {
   firstSearchResult {
     name
     height
   }
 }
 ```

-Instead, the query would be:
+A valid operation includes typed fragments (in this example, inline fragments):

 ```graphql example
 {
   firstSearchResult {
     ... on Person {
       name
     }
     ... on Photo {
@@ -1186,17 +1352,17 @@ Instead, the query would be:
     }
   }
 }
 ```

 Union members may be defined with an optional leading `|` character to aid
 formatting when representing a longer list of possible types:

-```graphql example
+```raw graphql example
 union SearchResult =
   | Photo
   | Person
 ```

 **Result Coercion**

 The union type should have some way of determining which object a given result
@@ -1234,27 +1400,30 @@ Union type extensions have the potential to be invalid if incorrectly defined.

 1. The named type must already be defined and must be a Union type.
 2. The member types of a Union type extension must all be Object base types;
    Scalar, Interface and Union types must not be member types of a Union.
    Similarly, wrapping types must not be member types of a Union.
 3. All member types of a Union type extension must be unique.
 4. All member types of a Union type extension must not already be a member of
    the original Union type.
-5. Any directives provided must not already apply to the original Union type.
+5. Any non-repeatable directives provided must not already apply to the
+   original Union type.

 ## Enums

-EnumTypeDefinition : Description? enum Name Directives[Const]? EnumValuesDefinition?
+EnumTypeDefinition :
+  - Description? enum Name Directives[Const]? EnumValuesDefinition
+  - Description? enum Name Directives[Const]? [lookahead != `{`]

 EnumValuesDefinition : { EnumValueDefinition+ }

 EnumValueDefinition : Description? EnumValue Directives[Const]?

-GraphQL Enum types, like scalar types, also represent leaf values in a GraphQL
+GraphQL Enum types, like Scalar types, also represent leaf values in a GraphQL
 type system. However Enum types describe the set of possible values.

 Enums are not references for a numeric value, but are unique values in their own
 right. They may serialize as a string: the name of the represented value.

 In this example, an Enum type called `Direction` is defined:

 ```graphql example
@@ -1263,62 +1432,65 @@ enum Direction {
   EAST
   SOUTH
   WEST
 }
 ```

 **Result Coercion**

-GraphQL servers must return one of the defined set of possible values. If a
+GraphQL services must return one of the defined set of possible values. If a
 reasonable coercion is not possible they must raise a field error.

 **Input Coercion**

 GraphQL has a constant literal to represent enum input values. GraphQL string
-literals must not be accepted as an enum input and instead raise a query error.
+literals must not be accepted as an enum input and instead raise a request error.

-Query variable transport serializations which have a different representation
+Variable transport serializations which have a different representation
 for non-string symbolic values (for example, [EDN](https://github.com/edn-format/edn))
 should only allow such values as enum input values. Otherwise, for most
 transport serializations that do not, strings may be interpreted as the enum
 input value with the same name.

 **Type Validation**

 Enum types have the potential to be invalid if incorrectly defined.

 1. An Enum type must define one or more unique enum values.


 ### Enum Extensions

 EnumTypeExtension :
   - extend enum Name Directives[Const]? EnumValuesDefinition
-  - extend enum Name Directives[Const]
+  - extend enum Name Directives[Const] [lookahead != `{`]

 Enum type extensions are used to represent an enum type which has been
 extended from some original enum type. For example, this might be used to
 represent additional local data, or by a GraphQL service which is itself an
 extension of another GraphQL service.

 **Type Validation**

 Enum type extensions have the potential to be invalid if incorrectly defined.

 1. The named type must already be defined and must be an Enum type.
 2. All values of an Enum type extension must be unique.
 3. All values of an Enum type extension must not already be a value of
    the original Enum.
-4. Any directives provided must not already apply to the original Enum type.
+4. Any non-repeatable directives provided must not already apply to the
+   original Enum type.


 ## Input Objects

-InputObjectTypeDefinition : Description? input Name Directives[Const]? InputFieldsDefinition?
+InputObjectTypeDefinition :
+  - Description? input Name Directives[Const]? InputFieldsDefinition
+  - Description? input Name Directives[Const]? [lookahead != `{`]

 InputFieldsDefinition : { InputValueDefinition+ }

 Fields may accept arguments to configure their behavior. These inputs are often
 scalars or enums, but they sometimes need to represent more complex values.

 A GraphQL Input Object defines a set of input fields; the input fields are either
 scalars, enums, or other input objects. This allows arguments to accept
@@ -1334,51 +1506,105 @@ input Point2D {
 ```

 Note: The GraphQL Object type ({ObjectTypeDefinition}) defined above is
 inappropriate for re-use here, because Object types can contain fields that
 define arguments or contain references to interfaces and unions, neither of
 which is appropriate for use as an input argument. For this reason, input
 objects have a separate type in the system.

+**Circular References**
+
+Input Objects are allowed to reference other Input Objects as field types. A
+circular reference occurs when an Input Object references itself either directly
+or through referenced Input Objects.
+
+Circular references are generally allowed, however they may not be defined as an
+unbroken chain of Non-Null singular fields. Such Input Objects are invalid
+because there is no way to provide a legal value for them.
+
+This example of a circularly-referenced input type is valid as the field `self`
+may be omitted or the value {null}.
+
+```graphql example
+input Example {
+  self: Example
+  value: String
+}
+```
+
+This example is also valid as the field `self` may be an empty List.
+
+```graphql example
+input Example {
+  self: [Example!]!
+  value: String
+}
+```
+
+This example of a circularly-referenced input type is invalid as the field
+`self` cannot be provided a finite value.
+
+```graphql counter-example
+input Example {
+  value: String
+  self: Example!
+}
+```
+
+This example is also invalid, as there is a non-null singular circular reference
+via the `First.second` and `Second.first` fields.
+
+```graphql counter-example
+input First {
+  second: Second!
+  value: String
+}
+
+input Second {
+  first: First!
+  value: String
+}
+```
+
 **Result Coercion**

 An input object is never a valid result. Input Object types cannot be the return
 type of an Object or Interface field.

 **Input Coercion**

 The value for an input object should be an input object literal or an unordered
-map supplied by a variable, otherwise a query error must be thrown. In either
+map supplied by a variable, otherwise a request error must be raised. In either
 case, the input object literal or unordered map must not contain any entries
-with names not defined by a field of this input object type, otherwise an error
-must be thrown.
+with names not defined by a field of this input object type, otherwise a
+response error must be raised.

 The result of coercion is an unordered map with an entry for each field both
 defined by the input object type and for which a value exists. The resulting map
 is constructed with the following rules:

 * If no value is provided for a defined input object field and that field
   definition provides a default value, the default value should be used. If no
   default value is provided and the input object field's type is non-null, an
-  error should be thrown. Otherwise, if the field is not required, then no entry
+  error should be raised. Otherwise, if the field is not required, then no entry
   is added to the coerced unordered map.

 * If the value {null} was provided for an input object field, and the field's
   type is not a non-null type, an entry in the coerced unordered map is given
   the value {null}. In other words, there is a semantic difference between the
   explicitly provided value {null} versus having not provided a value.

 * If a literal value is provided for an input object field, an entry in the
   coerced unordered map is given the result of coercing that value according
   to the input coercion rules for the type of that field.

 * If a variable is provided for an input object field, the runtime value of that
   variable must be used. If the runtime value is {null} and the field type
-  is non-null, a field error must be thrown. If no runtime value is provided,
+  is non-null, a field error must be raised. If no runtime value is provided,
   the variable definition's default value should be used. If the variable
   definition does not provide a default value, the input object field
   definition's default value should be used.

 Following are examples of input coercion for an input object type with a
 `String` field `a` and a required (non-null) `Int!` field `b`:

 ```graphql example
@@ -1393,17 +1619,17 @@ Literal Value            | Variables               | Coerced Value
 `{ a: "abc", b: 123 }`   | `{}`                    | `{ a: "abc", b: 123 }`
 `{ a: null, b: 123 }`    | `{}`                    | `{ a: null, b: 123 }`
 `{ b: 123 }`             | `{}`                    | `{ b: 123 }`
 `{ a: $var, b: 123 }`    | `{ var: null }`         | `{ a: null, b: 123 }`
 `{ a: $var, b: 123 }`    | `{}`                    | `{ b: 123 }`
 `{ b: $var }`            | `{ var: 123 }`          | `{ b: 123 }`
 `$var`                   | `{ var: { b: 123 } }`   | `{ b: 123 }`
 `"abc123"`               | `{}`                    | Error: Incorrect value
-`$var`                   | `{ var: "abc123" } }`   | Error: Incorrect value
+`$var`                   | `{ var: "abc123" }`     | Error: Incorrect value
 `{ a: "abc", b: "123" }` | `{}`                    | Error: Incorrect value for field {b}
 `{ a: "abc" }`           | `{}`                    | Error: Missing required field {b}
 `{ b: $var }`            | `{}`                    | Error: Missing required field {b}.
 `$var`                   | `{ var: { a: "abc" } }` | Error: Missing required field {b}
 `{ a: "abc", b: null }`  | `{}`                    | Error: {b} must be non-null.
 `{ b: $var }`            | `{ var: null }`         | Error: {b} must be non-null.
 `{ b: 123, c: "xyz" }`   | `{}`                    | Error: Unexpected field {c}

@@ -1412,89 +1638,95 @@ Literal Value            | Variables               | Coerced Value
 1. An Input Object type must define one or more input fields.
 2. For each input field of an Input Object type:
    1. The input field must have a unique name within that Input Object type;
       no two input fields may share the same name.
    2. The input field must not have a name which begins with the
       characters {"__"} (two underscores).
    3. The input field must accept a type where {IsInputType(inputFieldType)}
       returns {true}.
+3. If an Input Object references itself either directly or through referenced
+   Input Objects, at least one of the fields in the chain of references must be
+   either a nullable or a List type.


 ### Input Object Extensions

 InputObjectTypeExtension :
   - extend input Name Directives[Const]? InputFieldsDefinition
-  - extend input Name Directives[Const]
+  - extend input Name Directives[Const] [lookahead != `{`]

 Input object type extensions are used to represent an input object type which
 has been extended from some original input object type. For example, this might
 be used by a GraphQL service which is itself an extension of another GraphQL service.

 **Type Validation**

 Input object type extensions have the potential to be invalid if incorrectly defined.

 1. The named type must already be defined and must be a Input Object type.
-3. All fields of an Input Object type extension must have unique names.
-4. All fields of an Input Object type extension must not already be a field of
+2. All fields of an Input Object type extension must have unique names.
+3. All fields of an Input Object type extension must not already be a field of
    the original Input Object.
-5. Any directives provided must not already apply to the original Input Object type.
+4. Any non-repeatable directives provided must not already apply to the
+   original Input Object type.


 ## List

 A GraphQL list is a special collection type which declares the type of each
 item in the List (referred to as the *item type* of the list). List values are
 serialized as ordered lists, where each item in the list is serialized as per
-the item type. To denote that a field uses a List type the item type is wrapped
-in square brackets like this: `pets: [Pet]`.
+the item type.
+
+To denote that a field uses a List type the item type is wrapped in square brackets
+like this: `pets: [Pet]`. Nesting lists is allowed: `matrix: [[Int]]`.

 **Result Coercion**

-GraphQL servers must return an ordered list as the result of a list type. Each
+GraphQL services must return an ordered list as the result of a list type. Each
 item in the list must be the result of a result coercion of the item type. If a
 reasonable coercion is not possible it must raise a field error. In
 particular, if a non-list is returned, the coercion should fail, as this
 indicates a mismatch in expectations between the type system and the
 implementation.

-If a list's item type is nullable, then errors occuring during preparation or
+If a list's item type is nullable, then errors occurring during preparation or
 coercion of an individual item in the list must result in a the value {null} at
-that position in the list along with an error added to the response. If a list's
-item type is non-null, an error occuring at an individual item in the list must
-result in a field error for the entire list.
+that position in the list along with a field error added to the response.
+If a list's item type is non-null, a field error occurring at an individual item
+in the list must result in a field error for the entire list.

-Note: For more information on the error handling process, see "Errors and
-Non-Nullability" within the Execution section.
+Note: See [Handling Field Errors](#sec-Handling-Field-Errors) for more about
+this behavior.

 **Input Coercion**

 When expected as an input, list values are accepted only when each item in the
 list can be accepted by the list's item type.

 If the value passed as an input to a list type is *not* a list and not the
 {null} value, then the result of input coercion is a list of size one,
 where the single item value is the result of input coercion for the list's item
 type on the provided value (note this may apply recursively for nested lists).

-This allow inputs which accept one or many arguments (sometimes referred to as
+This allows inputs which accept one or many arguments (sometimes referred to as
 "var args") to declare their input type as a list while for the common case of a
 single value, a client can just pass that value directly rather than
 constructing the list.

 Following are examples of input coercion with various list types and values:

 Expected Type | Provided Value   | Coerced Value
 ------------- | ---------------- | ---------------------------
 `[Int]`       | `[1, 2, 3]`      | `[1, 2, 3]`
 `[Int]`       | `[1, "b", true]` | Error: Incorrect item value
 `[Int]`       | `1`              | `[1]`
 `[Int]`       | `null`           | `null`
-`[[Int]]`     | `[[1], [2, 3]]`  | `[[1], [2, 3]`
+`[[Int]]`     | `[[1], [2, 3]]`  | `[[1], [2, 3]]`
 `[[Int]]`     | `[1, 2, 3]`      | Error: Incorrect item value
 `[[Int]]`     | `1`              | `[[1]]`
 `[[Int]]`     | `null`           | `null`


 ## Non-Null

 By default, all types in GraphQL are nullable; the {null} value is a valid
@@ -1502,43 +1734,43 @@ response for all of the above types. To declare a type that disallows null,
 the GraphQL Non-Null type can be used. This type wraps an underlying type,
 and this type acts identically to that wrapped type, with the exception
 that {null} is not a valid response for the wrapping type. A trailing
 exclamation mark is used to denote a field that uses a Non-Null type like this:
 `name: String!`.

 **Nullable vs. Optional**

-Fields are *always* optional within the context of a query, a field may be
-omitted and the query is still valid. However fields that return Non-Null types
-will never return the value {null} if queried.
+Fields are *always* optional within the context of a selection set, a field may
+be omitted and the selection set is still valid. However fields that return
+Non-Null types will never return the value {null} if queried.

 Inputs (such as field arguments), are always optional by default. However a
 non-null input type is required. In addition to not accepting the value {null},
 it also does not accept omission. For the sake of simplicity nullable types
 are always optional and non-null types are always required.

 **Result Coercion**

 In all of the above result coercions, {null} was considered a valid value.
 To coerce the result of a Non-Null type, the coercion of the wrapped type
 should be performed. If that result was not {null}, then the result of coercing
 the Non-Null type is that result. If that result was {null}, then a field error
 must be raised.

-Note: When a field error is raised on a non-null value, the error propogates to
+Note: When a field error is raised on a non-null value, the error propagates to
 the parent field. For more information on this process, see
 "Errors and Non-Nullability" within the Execution section.

 **Input Coercion**

 If an argument or input-object field of a Non-Null type is not provided, is
 provided with the literal value {null}, or is provided with a variable that was
 either not provided a value at runtime, or was provided the value {null}, then
-a query error must be raised.
+a request error must be raised.

 If the value provided to the Non-Null type is provided with a literal value
 other than {null}, or a Non-Null variable value, it is coerced using the input
 coercion for the wrapped type.

 A non-null argument cannot be omitted:

 ```graphql counter-example
@@ -1601,74 +1833,103 @@ Expected Type | Internal Value   | Coerced Result
 `[Int!]!`     | `[1, 2, 3]`      | `[1, 2, 3]`
 `[Int!]!`     | `null`           | Error: Value cannot be null
 `[Int!]!`     | `[1, 2, null]`   | Error: Item cannot be null
 `[Int!]!`     | `[1, 2, Error]`  | Error: Error occurred in item


 ## Directives

-DirectiveDefinition : Description? directive @ Name ArgumentsDefinition? on DirectiveLocations
+DirectiveDefinition : Description? directive @ Name ArgumentsDefinition? `repeatable`? on DirectiveLocations

 DirectiveLocations :
-  - `|`? DirectiveLocation
   - DirectiveLocations | DirectiveLocation
+  - `|`? DirectiveLocation

 DirectiveLocation :
   - ExecutableDirectiveLocation
   - TypeSystemDirectiveLocation

 ExecutableDirectiveLocation : one of
-  `QUERY`
-  `MUTATION`
-  `SUBSCRIPTION`
-  `FIELD`
-  `FRAGMENT_DEFINITION`
-  `FRAGMENT_SPREAD`
-  `INLINE_FRAGMENT`
+  - `QUERY`
+  - `MUTATION`
+  - `SUBSCRIPTION`
+  - `FIELD`
+  - `FRAGMENT_DEFINITION`
+  - `FRAGMENT_SPREAD`
+  - `INLINE_FRAGMENT`
+  - `VARIABLE_DEFINITION`

 TypeSystemDirectiveLocation : one of
-  `SCHEMA`
-  `SCALAR`
-  `OBJECT`
-  `FIELD_DEFINITION`
-  `ARGUMENT_DEFINITION`
-  `INTERFACE`
-  `UNION`
-  `ENUM`
-  `ENUM_VALUE`
-  `INPUT_OBJECT`
-  `INPUT_FIELD_DEFINITION`
+  - `SCHEMA`
+  - `SCALAR`
+  - `OBJECT`
+  - `FIELD_DEFINITION`
+  - `ARGUMENT_DEFINITION`
+  - `INTERFACE`
+  - `UNION`
+  - `ENUM`
+  - `ENUM_VALUE`
+  - `INPUT_OBJECT`
+  - `INPUT_FIELD_DEFINITION`

 A GraphQL schema describes directives which are used to annotate various parts
 of a GraphQL document as an indicator that they should be evaluated differently
 by a validator, executor, or client tool such as a code generator.

+**Built-in Directives**
+
+:: A *built-in directive* is any directive defined within this specification.
+
 GraphQL implementations should provide the `@skip` and `@include` directives.

 GraphQL implementations that support the type system definition language must
 provide the `@deprecated` directive if representing deprecated portions of
 the schema.

+GraphQL implementations that support the type system definition language should
+provide the `@specifiedBy` directive if representing custom scalar
+definitions.
+
+When representing a GraphQL schema using the type system definition language
+any *built-in directive* may be omitted for brevity.
+
+When introspecting a GraphQL service all provided directives, including
+any *built-in directive*, must be included in the set of returned directives.
+
+**Custom Directives**
+
+:: GraphQL services and client tooling may provide any additional
+*custom directive* beyond those defined in this document. Directives are the
+preferred way to extend GraphQL with custom or experimental behavior.
+
+Note: When defining a *custom directive*, it is recommended to prefix the
+directive's name to make its scope of usage clear and to prevent a collision
+with *built-in directive* which may be specified by future versions of this
+document (which will not include `_` in their name). For example, a
+*custom directive* used by Facebook's GraphQL service should be named `@fb_auth`
+instead of `@auth`. This is especially recommended for proposed additions to
+this specification which can change during the [RFC process](https://github.com/graphql/graphql-spec/blob/main/CONTRIBUTING.md).
+For example a work in progress version of `@live` should be named `@rfc_live`.
+
 Directives must only be used in the locations they are declared to belong in.
-In this example, a directive is defined which can be used to annotate a
-fragment definition:
+In this example, a directive is defined which can be used to annotate a field:

 ```graphql example
 directive @example on FIELD

 fragment SomeFragment on SomeType {
   field @example
 }
 ```

 Directive locations may be defined with an optional leading `|` character to aid
 formatting when representing a longer list of possible locations:

-```graphql example
+```raw graphql example
 directive @example on
   | FIELD
   | FRAGMENT_SPREAD
   | INLINE_FRAGMENT
 ```

 Directives can also be used to annotate the type system definition language
 as well, which can be a useful tool for supplying additional metadata in order
@@ -1680,22 +1941,41 @@ In this example, the directive `@example` annotates field and argument definitio
 ```graphql example
 directive @example on FIELD_DEFINITION | ARGUMENT_DEFINITION

 type SomeType {
   field(arg: Int @example): String @example
 }
 ```

+A directive may be defined as repeatable by including the "repeatable" keyword.
+Repeatable directives are often useful when the same directive should be used
+with different arguments at a single location, especially in cases where
+additional information needs to be provided to a type or schema extension via
+a directive:
+
+```graphql example
+directive @delegateField(name: String!) repeatable on OBJECT | INTERFACE
+
+type Book @delegateField(name: "pageCount") @delegateField(name: "author") {
+  id: ID!
+}
+
+extend type Book @delegateField(name: "index")
+```
+
 While defining a directive, it must not reference itself directly or indirectly:

 ```graphql counter-example
 directive @invalidExample(arg: String @invalidExample) on ARGUMENT_DEFINITION
 ```

+Note: The order in which directives appear may be significant, including
+repeatable directives.
+
 **Validation**

 1. A directive definition must not contain the use of a directive which
    references itself directly.
 2. A directive definition must not contain the use of a directive which
    references itself indirectly by referencing a Type or Directive which
    transitively includes a reference to this directive.
 3. The directive must not have a name which begins with the characters
@@ -1707,73 +1987,93 @@ directive @invalidExample(arg: String @invalidExample) on ARGUMENT_DEFINITION
       returns {true}.

 ### @skip

 ```graphql
 directive @skip(if: Boolean!) on FIELD | FRAGMENT_SPREAD | INLINE_FRAGMENT
 ```

-The `@skip` directive may be provided for fields, fragment spreads, and
-inline fragments, and allows for conditional exclusion during execution as
-described by the if argument.
+The `@skip` *built-in directive* may be provided for fields, fragment spreads,
+and inline fragments, and allows for conditional exclusion during execution as
+described by the `if` argument.

 In this example `experimentalField` will only be queried if the variable
 `$someTest` has the value `false`.

 ```graphql example
-query myQuery($someTest: Boolean) {
+query myQuery($someTest: Boolean!) {
   experimentalField @skip(if: $someTest)
 }
 ```


 ### @include

 ```graphql
 directive @include(if: Boolean!) on FIELD | FRAGMENT_SPREAD | INLINE_FRAGMENT
 ```

-The `@include` directive may be provided for fields, fragment spreads, and
-inline fragments, and allows for conditional inclusion during execution as
-described by the if argument.
+The `@include` *built-in directive* may be provided for fields, fragment
+spreads, and inline fragments, and allows for conditional inclusion during
+execution as described by the `if` argument.

 In this example `experimentalField` will only be queried if the variable
 `$someTest` has the value `true`

 ```graphql example
-query myQuery($someTest: Boolean) {
+query myQuery($someTest: Boolean!) {
   experimentalField @include(if: $someTest)
 }
 ```

 Note: Neither `@skip` nor `@include` has precedence over the other. In the case
-that both the `@skip` and `@include` directives are provided in on the same the
+that both the `@skip` and `@include` directives are provided on the same
 field or fragment, it *must* be queried only if the `@skip` condition is false
 *and* the `@include` condition is true. Stated conversely, the field or fragment
 must *not* be queried if either the `@skip` condition is true *or* the
 `@include` condition is false.


 ### @deprecated

 ```graphql
 directive @deprecated(
   reason: String = "No longer supported"
 ) on FIELD_DEFINITION | ENUM_VALUE
 ```

-The `@deprecated` directive is used within the type system definition language
-to indicate deprecated portions of a GraphQL service's schema, such as
+The `@deprecated` *built-in directive* is used within the type system definition
+language to indicate deprecated portions of a GraphQL service's schema, such as
 deprecated fields on a type or deprecated enum values.

 Deprecations include a reason for why it is deprecated, which is formatted using
-Markdown syntax (as specified by [CommonMark](http://commonmark.org/)).
+Markdown syntax (as specified by [CommonMark](https://commonmark.org/)).

 In this example type definition, `oldField` is deprecated in favor of
 using `newField`.

 ```graphql example
 type ExampleType {
   newField: String
   oldField: String @deprecated(reason: "Use `newField`.")
 }
 ```
+
+
+### @specifiedBy
+
+```graphql
+directive @specifiedBy(url: String!) on SCALAR
+```
+
+The `@specifiedBy` *built-in directive* is used within the type system
+definition language to provide a *scalar specification URL* for specifying the
+behavior of [custom scalar types](#sec-Scalars.Custom-Scalars). The URL should
+point to a human-readable specification of the data format, serialization, and
+coercion rules. It must not appear on built-in scalar types.
+
+In this example, a custom scalar type for `UUID` is defined with a URL pointing
+to the relevant IETF specification.
+
+```graphql example
+scalar UUID @specifiedBy(url: "https://tools.ietf.org/html/rfc4122")
+```
~~~
</details>

<details>
<summary>spec/Section 4 -- Introspection.md</summary>

~~~diff
@@ -1,43 +1,43 @@
 # Introspection

-A GraphQL server supports introspection over its schema. This schema is queried
+A GraphQL service supports introspection over its schema. This schema is queried
 using GraphQL itself, creating a powerful platform for tool-building.

-Take an example query for a trivial app. In this case there is a User type with
+Take an example request for a trivial app. In this case there is a User type with
 three fields: id, name, and birthday.

-For example, given a server with the following type definition:
+For example, given a service with the following type definition:

 ```graphql example
 type User {
   id: String
   name: String
   birthday: Date
 }
 ```

-The query
+A request containing the operation:

 ```graphql example
 {
   __type(name: "User") {
     name
     fields {
       name
       type {
         name
       }
     }
   }
 }
 ```

-would return
+would produce the result:

 ```json example
 {
   "__type": {
     "name": "User",
     "fields": [
       {
         "name": "id",
@@ -45,112 +45,127 @@ would return
       },
       {
         "name": "name",
         "type": { "name": "String" }
       },
       {
         "name": "birthday",
         "type": { "name": "Date" }
-      },
+      }
     ]
   }
 }
 ```

-## Reserved Names
+**Reserved Names**

 Types and fields required by the GraphQL introspection system that are used in
 the same context as user-defined types and fields are prefixed with {"__"} two
 underscores. This in order to avoid naming collisions with user-defined GraphQL
-types. Conversely, GraphQL type system authors must not define any types,
-fields, arguments, or any other type system artifact with two leading
-underscores.
-
-
-## Documentation
-
-All types in the introspection system provide a `description` field of type
-`String` to allow type designers to publish documentation in addition to
-capabilities. A GraphQL server may return the `description` field using Markdown
-syntax (as specified by [CommonMark](http://commonmark.org/)). Therefore it is
-recommended that any tool that displays `description` use a CommonMark-compliant
-Markdown renderer.
-
-
-## Deprecation
-
-To support the management of backwards compatibility, GraphQL fields and enum
-values can indicate whether or not they are deprecated (`isDeprecated: Boolean`)
-and a description of why it is deprecated (`deprecationReason: String`).
-
-Tools built using GraphQL introspection should respect deprecation by
-discouraging deprecated use through information hiding or developer-facing
-warnings.
+types.

+Otherwise, any {Name} within a GraphQL type system must not start with
+two underscores {"__"}.

 ## Type Name Introspection

-GraphQL supports type name introspection at any point within a query by the
-meta-field `__typename: String!` when querying against any Object, Interface,
-or Union. It returns the name of the object type currently being queried.
+GraphQL supports type name introspection within any selection set in an
+operation, with the single exception of selections at the root of a subscription
+operation. Type name introspection is accomplished via the meta-field
+`__typename: String!` on any Object, Interface, or Union. It returns the name of
+the concrete Object type at that point during execution.

 This is most often used when querying against Interface or Union types to
-identify which actual type of the possible types has been returned.
+identify which actual Object type of the possible types has been returned.

-This field is implicit and does not appear in the fields list in any defined type.
+As a meta-field, `__typename` is implicit and does not appear in the fields list
+in any defined type.

+Note: `__typename` may not be included as a root field in a subscription
+operation.

 ## Schema Introspection

 The schema introspection system is accessible from the meta-fields `__schema`
 and `__type` which are accessible from the type of the root of a query
 operation.

 ```graphql
 __schema: __Schema!
 __type(name: String!): __Type
 ```

-These fields are implicit and do not appear in the fields list in the root type
-of the query operation.
+Like all meta-fields, these are implicit and do not appear in the fields list in
+the root type of the query operation.

-The schema of the GraphQL schema introspection system:
+**First Class Documentation**
+
+All types in the introspection system provide a `description` field of type
+`String` to allow type designers to publish documentation in addition to
+capabilities. A GraphQL service may return the `description` field using Markdown
+syntax (as specified by [CommonMark](https://commonmark.org/)). Therefore it is
+recommended that any tool that displays `description` use a CommonMark-compliant
+Markdown renderer.
+
+**Deprecation**
+
+To support the management of backwards compatibility, GraphQL fields and enum
+values can indicate whether or not they are deprecated (`isDeprecated: Boolean`)
+and a description of why it is deprecated (`deprecationReason: String`).
+
+Tools built using GraphQL introspection should respect deprecation by
+discouraging deprecated use through information hiding or developer-facing
+warnings.
+
+**Schema Introspection Schema**
+
+The schema introspection system is itself represented as a GraphQL schema. Below
+are the full set of type system definitions providing schema introspection,
+which are fully defined in the sections below.

 ```graphql
 type __Schema {
+  description: String
   types: [__Type!]!
   queryType: __Type!
   mutationType: __Type
   subscriptionType: __Type
   directives: [__Directive!]!
 }

 type __Type {
   kind: __TypeKind!
   name: String
   description: String
-
-  # OBJECT and INTERFACE only
+  # must be non-null for OBJECT and INTERFACE, otherwise null.
   fields(includeDeprecated: Boolean = false): [__Field!]
-
-  # OBJECT only
+  # must be non-null for OBJECT and INTERFACE, otherwise null.
   interfaces: [__Type!]
-
-  # INTERFACE and UNION only
+  # must be non-null for INTERFACE and UNION, otherwise null.
   possibleTypes: [__Type!]
-
-  # ENUM only
+  # must be non-null for ENUM, otherwise null.
   enumValues(includeDeprecated: Boolean = false): [__EnumValue!]
-
-  # INPUT_OBJECT only
+  # must be non-null for INPUT_OBJECT, otherwise null.
   inputFields: [__InputValue!]
-
-  # NON_NULL and LIST only
+  # must be non-null for NON_NULL and LIST, otherwise null.
   ofType: __Type
+  # may be non-null for custom SCALAR, otherwise null.
+  specifiedByURL: String
+}
+
+enum __TypeKind {
+  SCALAR
+  OBJECT
+  INTERFACE
+  UNION
+  ENUM
+  INPUT_OBJECT
+  LIST
+  NON_NULL
 }

 type __Field {
   name: String!
   description: String
   args: [__InputValue!]!
   type: __Type!
   isDeprecated: Boolean!
@@ -166,211 +181,245 @@ type __InputValue {

 type __EnumValue {
   name: String!
   description: String
   isDeprecated: Boolean!
   deprecationReason: String
 }

-enum __TypeKind {
-  SCALAR
-  OBJECT
-  INTERFACE
-  UNION
-  ENUM
-  INPUT_OBJECT
-  LIST
-  NON_NULL
-}
-
 type __Directive {
   name: String!
   description: String
   locations: [__DirectiveLocation!]!
   args: [__InputValue!]!
+  isRepeatable: Boolean!
 }

 enum __DirectiveLocation {
   QUERY
   MUTATION
   SUBSCRIPTION
   FIELD
   FRAGMENT_DEFINITION
   FRAGMENT_SPREAD
   INLINE_FRAGMENT
+  VARIABLE_DEFINITION
   SCHEMA
   SCALAR
   OBJECT
   FIELD_DEFINITION
   ARGUMENT_DEFINITION
   INTERFACE
   UNION
   ENUM
   ENUM_VALUE
   INPUT_OBJECT
   INPUT_FIELD_DEFINITION
 }
 ```

+### The __Schema Type

-### The __Type Type
+The `__Schema` type is returned from the `__schema` meta-field and provides
+all information about the schema of a GraphQL service.

-`__Type` is at the core of the type introspection system.
-It represents scalars, interfaces, object types, unions, enums in the system.
+Fields\:

-`__Type` also represents type modifiers, which are used to modify a type
-that it refers to (`ofType: __Type`). This is how we represent lists,
-non-nullable types, and the combinations thereof.
+* `description` may return a String or {null}.
+* `queryType` is the root type of a query operation.
+* `mutationType` is the root type of a mutation operation, if supported.
+  Otherwise {null}.
+* `subscriptionType` is the root type of a subscription operation, if supported.
+  Otherwise {null}.
+* `types` must return the set of all named types contained within this schema.
+  Any named type which can be found through a field of any introspection type
+  must be included in this set.
+* `directives` must return the set of all directives available within
+  this schema including all built-in directives.


-### Type Kinds
+### The __Type Type
+
+`__Type` is at the core of the type introspection system, it represents all
+types in the system: both named types (e.g. Scalars and Object types) and
+type modifiers (e.g. List and Non-Null types).
+
+Type modifiers are used to modify the type presented in the field `ofType`.
+This modified type may recursively be a modified type, representing lists,
+non-nullables, and combinations thereof, ultimately modifying a named type.

 There are several different kinds of type. In each kind, different fields are
-actually valid. These kinds are listed in the `__TypeKind` enumeration.
+actually valid. All possible kinds are listed in the `__TypeKind` enum.
+
+Each sub-section below defines the expected fields of `__Type` given each
+possible value of the `__TypeKind` enum:

+* {"SCALAR"}
+* {"OBJECT"}
+* {"INTERFACE"}
+* {"UNION"}
+* {"ENUM"}
+* {"INPUT_OBJECT"}
+* {"LIST"}
+* {"NON_NULL"}

-#### Scalar
+**Scalar**

 Represents scalar types such as Int, String, and Boolean. Scalars cannot have fields.

-A GraphQL type designer should describe the data format and scalar coercion
-rules in the description field of any scalar.
+Also represents [Custom scalars](#sec-Scalars.Custom-Scalars) which may provide
+`specifiedByURL` as a *scalar specification URL*.

-Fields
+Fields\:

 * `kind` must return `__TypeKind.SCALAR`.
 * `name` must return a String.
 * `description` may return a String or {null}.
+* `specifiedByURL` may return a String (in the form of a URL) for custom
+  scalars, otherwise must be {null}.
 * All other fields must return {null}.


-#### Object
+**Object**

 Object types represent concrete instantiations of sets of fields. The
 introspection types (e.g. `__Type`, `__Field`, etc) are examples of objects.

-Fields
+Fields\:

 * `kind` must return `__TypeKind.OBJECT`.
 * `name` must return a String.
 * `description` may return a String or {null}.
-* `fields`: The set of fields query-able on this type.
+* `fields` must return the set of fields that can be selected for this type.
   * Accepts the argument `includeDeprecated` which defaults to {false}. If
     {true}, deprecated fields are also returned.
-* `interfaces`: The set of interfaces that an object implements.
+* `interfaces` must return the set of interfaces that an object implements
+  (if none, `interfaces` must return the empty set).
 * All other fields must return {null}.


-#### Union
+**Union**

 Unions are an abstract type where no common fields are declared. The possible
 types of a union are explicitly listed out in `possibleTypes`. Types can be
 made parts of unions without modification of that type.

-Fields
+Fields\:

 * `kind` must return `__TypeKind.UNION`.
 * `name` must return a String.
 * `description` may return a String or {null}.
 * `possibleTypes` returns the list of types that can be represented within this
   union. They must be object types.
 * All other fields must return {null}.


-#### Interface
+**Interface**

 Interfaces are an abstract type where there are common fields declared. Any type
 that implements an interface must define all the fields with names and types
 exactly matching. The implementations of this interface are explicitly listed
 out in `possibleTypes`.

-Fields
+Fields\:

 * `kind` must return `__TypeKind.INTERFACE`.
 * `name` must return a String.
 * `description` may return a String or {null}.
-* `fields`: The set of fields required by this interface.
+* `fields` must return the set of fields required by this interface.
   * Accepts the argument `includeDeprecated` which defaults to {false}. If
     {true}, deprecated fields are also returned.
+* `interfaces` must return the set of interfaces that an object implements
+  (if none, `interfaces` must return the empty set).
 * `possibleTypes` returns the list of types that implement this interface.
   They must be object types.
 * All other fields must return {null}.


-#### Enum
+**Enum**

 Enums are special scalars that can only have a defined set of values.

-Fields
+Fields\:

 * `kind` must return `__TypeKind.ENUM`.
 * `name` must return a String.
 * `description` may return a String or {null}.
-* `enumValues`: The list of `EnumValue`. There must be at least one and they
-  must have unique names.
+* `enumValues` must return the set of enum values as a list of `__EnumValue`.
+  There must be at least one and they must have unique names.
   * Accepts the argument `includeDeprecated` which defaults to {false}. If
     {true}, deprecated enum values are also returned.
 * All other fields must return {null}.


-#### Input Object
+**Input Object**

-Input objects are composite types used as inputs into queries defined as a list
-of named input values.
+Input objects are composite types defined as a list of named input values. They
+are only used as inputs to arguments and variables and cannot be a field
+return type.

 For example the input object `Point` could be defined as:

 ```graphql example
 input Point {
   x: Int
   y: Int
 }
 ```

-Fields
+Fields\:

 * `kind` must return `__TypeKind.INPUT_OBJECT`.
 * `name` must return a String.
 * `description` may return a String or {null}.
-* `inputFields`: a list of `InputValue`.
+* `inputFields` must return the set of input fields as a list of `__InputValue`.
 * All other fields must return {null}.


-#### List
+**List**

 Lists represent sequences of values in GraphQL. A List type is a type modifier:
 it wraps another type instance in the `ofType` field, which defines the type of
 each item in the list.

-Fields
+The modified type in the `ofType` field may itself be a modified type, allowing
+the representation of Lists of Lists, or Lists of Non-Nulls.
+
+Fields\:

 * `kind` must return `__TypeKind.LIST`.
-* `ofType`: Any type.
+* `ofType` must return a type of any kind.
 * All other fields must return {null}.


-#### Non-Null
+**Non-Null**

 GraphQL types are nullable. The value {null} is a valid response for field type.

-A Non-null type is a type modifier: it wraps another type instance in the
+A Non-Null type is a type modifier: it wraps another type instance in the
 `ofType` field. Non-null types do not allow {null} as a response, and indicate
 required inputs for arguments and input object fields.

+The modified type in the `ofType` field may itself be a modified List type,
+allowing the representation of Non-Null of Lists. However it must not be a
+modified Non-Null type to avoid a redundant Non-Null of Non-Null.
+
+Fields\:
+
 * `kind` must return `__TypeKind.NON_NULL`.
-* `ofType`: Any type except Non-null.
+* `ofType` must return a type of any kind except Non-Null.
 * All other fields must return {null}.


 ### The __Field Type

 The `__Field` type represents each field in an Object or Interface type.

-Fields
+Fields\:

 * `name` must return a String
 * `description` may return a String or {null}
 * `args` returns a List of `__InputValue` representing the arguments this
   field accepts.
 * `type` must return a `__Type` that represents the type of value returned by
   this field.
 * `isDeprecated` returns {true} if this field should no longer be used,
@@ -378,42 +427,69 @@ Fields
 * `deprecationReason` optionally provides a reason why this field is deprecated.


 ### The __InputValue Type

 The `__InputValue` type represents field and directive arguments as well as the
 `inputFields` of an input object.

-Fields
+Fields\:

 * `name` must return a String
 * `description` may return a String or {null}
 * `type` must return a `__Type` that represents the type this input
   value expects.
 * `defaultValue` may return a String encoding (using the GraphQL language) of the
   default value used by this input value in the condition a value is not
   provided at runtime. If this input value has no default value, returns {null}.

 ### The __EnumValue Type

 The `__EnumValue` type represents one of possible values of an enum.

-Fields
+Fields\:

 * `name` must return a String
 * `description` may return a String or {null}
-* `isDeprecated` returns {true} if this field should no longer be used,
+* `isDeprecated` returns {true} if this enum value should no longer be used,
   otherwise {false}.
-* `deprecationReason` optionally provides a reason why this field is deprecated.
+* `deprecationReason` optionally provides a reason why this enum value is deprecated.

 ### The __Directive Type

-The `__Directive` type represents a Directive that a server supports.
-
-Fields
+The `__Directive` type represents a directive that a service supports.
+
+This includes both any *built-in directive* and any *custom directive*.
+
+Individual directives may only be used in locations that are explicitly
+supported. All possible locations are listed in the `__DirectiveLocation` enum:
+
+* {"QUERY"}
+* {"MUTATION"}
+* {"SUBSCRIPTION"}
+* {"FIELD"}
+* {"FRAGMENT_DEFINITION"}
+* {"FRAGMENT_SPREAD"}
+* {"INLINE_FRAGMENT"}
+* {"VARIABLE_DEFINITION"}
+* {"SCHEMA"}
+* {"SCALAR"}
+* {"OBJECT"}
+* {"FIELD_DEFINITION"}
+* {"ARGUMENT_DEFINITION"}
+* {"INTERFACE"}
+* {"UNION"}
+* {"ENUM"}
+* {"ENUM_VALUE"}
+* {"INPUT_OBJECT"}
+* {"INPUT_FIELD_DEFINITION"}
+
+Fields\:

 * `name` must return a String
 * `description` may return a String or {null}
 * `locations` returns a List of `__DirectiveLocation` representing the valid
   locations this directive may be placed.
 * `args` returns a List of `__InputValue` representing the arguments this
   directive accepts.
+* `isRepeatable` must return a Boolean that indicates if the directive may be
+  used repeatedly at a single location.
~~~
</details>

<details>
<summary>spec/Section 5 -- Validation.md</summary>

~~~diff
@@ -16,17 +16,17 @@ validated before. For example: the request may be validated during development,
 provided it does not later change, or a service may validate a request once and
 memoize the result to avoid validating the same request again in the future.
 Any client-side or development-time tool should report validation errors and not
 allow the formulation or execution of requests known to be invalid at that given
 point in time.

 **Type system evolution**

-As GraphQL type system schema evolve over time by adding new types and new
+As GraphQL type system schema evolves over time by adding new types and new
 fields, it is possible that a request which was previously valid could later
 become invalid. Any change that can cause a previously valid request to become
 invalid is considered a *breaking change*. GraphQL services and schema
 maintainers are encouraged to avoid breaking changes, however in order to be
 more resilient to these breaking changes, sophisticated GraphQL systems may
 still allow for the execution of requests which *at some point* were known to
 be free of any validation errors, and have not changed since.

@@ -35,24 +35,28 @@ be free of any validation errors, and have not changed since.
 For this section of this schema, we will assume the following type system
 in order to demonstrate examples:

 ```graphql example
 type Query {
   dog: Dog
 }

-enum DogCommand { SIT, DOWN, HEEL }
+enum DogCommand {
+  SIT
+  DOWN
+  HEEL
+}

 type Dog implements Pet {
   name: String!
   nickname: String
   barkVolume: Int
   doesKnowCommand(dogCommand: DogCommand!): Boolean!
-  isHousetrained(atOtherHomes: Boolean): Boolean!
+  isHouseTrained(atOtherHomes: Boolean): Boolean!
   owner: Human
 }

 interface Sentient {
   name: String!
 }

 interface Pet {
@@ -61,19 +65,22 @@ interface Pet {

 type Alien implements Sentient {
   name: String!
   homePlanet: String
 }

 type Human implements Sentient {
   name: String!
+  pets: [Pet!]
 }

-enum CatCommand { JUMP }
+enum CatCommand {
+  JUMP
+}

 type Cat implements Pet {
   name: String!
   nickname: String
   doesKnowCommand(catCommand: CatCommand!): Boolean!
   meowVolume: Int
 }

@@ -84,31 +91,31 @@ union HumanOrAlien = Human | Alien


 ## Documents

 ### Executable Definitions

 **Formal Specification**

-  * For each definition {definition} in the document.
-  * {definition} must be {OperationDefinition} or {FragmentDefinition} (it must
-    not be {TypeSystemDefinition}).
+* For each definition {definition} in the document.
+* {definition} must be {ExecutableDefinition} (it must not be
+  {TypeSystemDefinitionOrExtension}).

 **Explanatory Text**

 GraphQL execution will only consider the executable definitions Operation and
 Fragment. Type system definitions and extensions are not executable, and are not
 considered during execution.

-To avoid ambiguity, a document containing {TypeSystemDefinition} is invalid
-for execution.
+To avoid ambiguity, a document containing {TypeSystemDefinitionOrExtension} is
+invalid for execution.

 GraphQL documents not intended to be directly executed may include
-{TypeSystemDefinition}.
+{TypeSystemDefinitionOrExtension}.

 For example, the following document is invalid for execution since the original
 executing schema may not know about the provided type extension:

 ```graphql counter-example
 query getDogName {
   dog {
     name
@@ -124,21 +131,21 @@ extend type Dog {
 ## Operations

 ### Named Operation Definitions

 #### Operation Name Uniqueness

 **Formal Specification**

-  * For each operation definition {operation} in the document.
-  * Let {operationName} be the name of {operation}.
-  * If {operationName} exists
-    * Let {operations} be all operation definitions in the document named {operationName}.
-    * {operations} must be a set of one.
+* For each operation definition {operation} in the document.
+* Let {operationName} be the name of {operation}.
+* If {operationName} exists
+  * Let {operations} be all operation definitions in the document named {operationName}.
+  * {operations} must be a set of one.

 **Explanatory Text**

 Each named operation definition must be unique within a document when referred
 to by its name.

 For example the following document is valid:

@@ -193,20 +200,20 @@ mutation dogOperation {
 ```

 ### Anonymous Operation Definitions

 #### Lone Anonymous Operation

 **Formal Specification**

-  * Let {operations} be all operation definitions in the document.
-  * Let {anonymous} be all anonymous operation definitions in the document.
-  * If {operations} is a set of more than 1:
-    * {anonymous} must be empty.
+* Let {operations} be all operation definitions in the document.
+* Let {anonymous} be all anonymous operation definitions in the document.
+* If {operations} is a set of more than 1:
+  * {anonymous} must be empty.

 **Explanatory Text**

 GraphQL allows a short-hand form for defining query operations when only that
 one operation exists in the document.

 For example the following document is valid:

@@ -237,23 +244,24 @@ query getName {
 ```

 ### Subscription Operation Definitions

 #### Single root field

 **Formal Specification**

-  * For each subscription operation definition {subscription} in the document
-  * Let {subscriptionType} be the root Subscription type in {schema}.
-  * Let {selectionSet} be the top level selection set on {subscription}.
-  * Let {variableValues} be the empty set.
-  * Let {groupedFieldSet} be the result of
-    {CollectFields(subscriptionType, selectionSet, variableValues)}.
-  * {groupedFieldSet} must have exactly one entry.
+* For each subscription operation definition {subscription} in the document
+* Let {subscriptionType} be the root Subscription type in {schema}.
+* Let {selectionSet} be the top level selection set on {subscription}.
+* Let {variableValues} be the empty set.
+* Let {groupedFieldSet} be the result of
+  {CollectFields(subscriptionType, selectionSet, variableValues)}.
+* {groupedFieldSet} must have exactly one entry, which must not be an
+  introspection field.

 **Explanatory Text**

 Subscription operations must have exactly one root field.

 Valid examples:

 ```graphql example
@@ -299,42 +307,41 @@ fragment multipleSubscriptions on Subscription {
   newMessage {
     body
     sender
   }
   disallowedSecondRootField
 }
 ```

-Introspection fields are counted. The following example is also invalid:
+The root field of a subscription operation must not be an introspection field.
+The following example is also invalid:

 ```graphql counter-example
 subscription sub {
-  newMessage {
-    body
-    sender
-  }
   __typename
 }
 ```

 Note: While each subscription must have exactly one root field, a document may
 contain any number of operations, each of which may contain different root
 fields. When executed, a document containing multiple subscription operations
 must provide the operation name as described in {GetOperation()}.

 ## Fields

-### Field Selections on Objects, Interfaces, and Unions Types
+### Field Selections
+
+Field selections must exist on Object, Interface, and Union types.

 **Formal Specification**

-  * For each {selection} in the document.
-  * Let {fieldName} be the target field of {selection}
-  * {fieldName} must be defined on type in scope
+* For each {selection} in the document.
+* Let {fieldName} be the target field of {selection}
+* {fieldName} must be defined on type in scope

 **Explanatory Text**

 The target field of a field selection must be defined on the scoped type of the
 selection set. There are no limitations on alias names.

 For example the following fragment would not pass validation:

@@ -396,48 +403,50 @@ fragment directFieldSelectionOnUnion on CatOrDog {
 }
 ```


 ### Field Selection Merging

 **Formal Specification**

-  * Let {set} be any selection set defined in the GraphQL document.
-  * {FieldsInSetCanMerge(set)} must be true.
+* Let {set} be any selection set defined in the GraphQL document.
+* {FieldsInSetCanMerge(set)} must be true.
+
+FieldsInSetCanMerge(set):

-FieldsInSetCanMerge(set) :
   * Let {fieldsForName} be the set of selections with a given response name in
     {set} including visiting fragments and inline fragments.
   * Given each pair of members {fieldA} and {fieldB} in {fieldsForName}:
     * {SameResponseShape(fieldA, fieldB)} must be true.
     * If the parent types of {fieldA} and {fieldB} are equal or if either is not
       an Object Type:
       * {fieldA} and {fieldB} must have identical field names.
       * {fieldA} and {fieldB} must have identical sets of arguments.
       * Let {mergedSet} be the result of adding the selection set of {fieldA}
         and the selection set of {fieldB}.
       * {FieldsInSetCanMerge(mergedSet)} must be true.

-SameResponseShape(fieldA, fieldB) :
+SameResponseShape(fieldA, fieldB):
+
   * Let {typeA} be the return type of {fieldA}.
   * Let {typeB} be the return type of {fieldB}.
   * If {typeA} or {typeB} is Non-Null.
     * If {typeA} or {typeB} is nullable, return false.
     * Let {typeA} be the nullable type of {typeA}
     * Let {typeB} be the nullable type of {typeB}
   * If {typeA} or {typeB} is List.
     * If {typeA} or {typeB} is not List, return false.
     * Let {typeA} be the item type of {typeA}
     * Let {typeB} be the item type of {typeB}
     * Repeat from step 3.
   * If {typeA} or {typeB} is Scalar or Enum.
     * If {typeA} and {typeB} are the same type return true, otherwise return
       false.
-  * If {typeA} or {typeB} is not a composite type, return false.
+  * Assert: {typeA} and {typeB} are both composite types.
   * Let {mergedSet} be the result of adding the selection set of {fieldA} and
     the selection set of {fieldB}.
   * Let {fieldsForName} be the set of selections with a given response name in
     {mergedSet} including visiting fragments and inline fragments.
   * Given each pair of members {subfieldA} and {subfieldB} in {fieldsForName}:
     * If {SameResponseShape(subfieldA, subfieldB)} is false, return false.
   * Return true.

@@ -556,27 +565,27 @@ fragment conflictingDifferingResponses on Pet {
 }
 ```


 ### Leaf Field Selections

 **Formal Specification**

-  * For each {selection} in the document
-  * Let {selectionType} be the result type of {selection}
-  * If {selectionType} is a scalar or enum:
-    * The subselection set of that selection must be empty
-  * If {selectionType} is an interface, union, or object
-    * The subselection set of that selection must NOT BE empty
+* For each {selection} in the document
+* Let {selectionType} be the result type of {selection}
+* If {selectionType} is a scalar or enum:
+  * The subselection set of that selection must be empty
+* If {selectionType} is an interface, union, or object
+  * The subselection set of that selection must NOT BE empty

 **Explanatory Text**

 Field selections on scalars or enums are never allowed, because they
-are the leaf nodes of any GraphQL query.
+are the leaf nodes of any GraphQL operation.

 The following is valid.

 ```graphql example
 fragment scalarSelection on Dog {
   barkVolume
 }
 ```
@@ -586,21 +595,22 @@ The following is invalid.
 ```graphql counter-example
 fragment scalarSelectionsNotAllowedOnInt on Dog {
   barkVolume {
     sinceWhen
   }
 }
 ```

-Conversely the leaf field selections of GraphQL queries
+Conversely the leaf field selections of GraphQL operations
 must be of type scalar or enum. Leaf selections on objects, interfaces,
 and unions without subfields are disallowed.

-Let's assume the following additions to the query root type of the schema:
+Let's assume the following additions to the query root operation type of
+the schema:

 ```graphql example
 extend type Query {
   human: Human
   pet: Pet
   catOrDog: CatOrDog
 }
 ```
@@ -627,98 +637,98 @@ query directQueryOnUnionWithoutSubFields {
 Arguments are provided to both fields and directives. The following validation
 rules apply in both cases.


 ### Argument Names

 **Formal Specification**

-  * For each {argument} in the document
-  * Let {argumentName} be the Name of {argument}.
-  * Let {argumentDefinition} be the argument definition provided by the parent field or definition named {argumentName}.
-  * {argumentDefinition} must exist.
+* For each {argument} in the document
+* Let {argumentName} be the Name of {argument}.
+* Let {argumentDefinition} be the argument definition provided by the parent field or definition named {argumentName}.
+* {argumentDefinition} must exist.

 **Explanatory Text**

 Every argument provided to a field or directive must be defined in the set of
 possible arguments of that field or directive.

 For example the following are valid:

 ```graphql example
 fragment argOnRequiredArg on Dog {
   doesKnowCommand(dogCommand: SIT)
 }

 fragment argOnOptional on Dog {
-  isHousetrained(atOtherHomes: true) @include(if: true)
+  isHouseTrained(atOtherHomes: true) @include(if: true)
 }
 ```

 the following is invalid since `command` is not defined on `DogCommand`.

 ```graphql counter-example
 fragment invalidArgName on Dog {
   doesKnowCommand(command: CLEAN_UP_HOUSE)
 }
 ```

 and this is also invalid as `unless` is not defined on `@include`.

 ```graphql counter-example
 fragment invalidArgName on Dog {
-  isHousetrained(atOtherHomes: true) @include(unless: false)
+  isHouseTrained(atOtherHomes: true) @include(unless: false)
 }
 ```

 In order to explore more complicated argument examples, let's add the following
 to our type system:

 ```graphql example
 type Arguments {
-  multipleReqs(x: Int!, y: Int!): Int!
+  multipleRequirements(x: Int!, y: Int!): Int!
   booleanArgField(booleanArg: Boolean): Boolean
   floatArgField(floatArg: Float): Float
   intArgField(intArg: Int): Int
   nonNullBooleanArgField(nonNullBooleanArg: Boolean!): Boolean!
   booleanListArgField(booleanListArg: [Boolean]!): [Boolean]
   optionalNonNullBooleanArgField(optionalBooleanArg: Boolean! = false): Boolean!
 }

 extend type Query {
   arguments: Arguments
 }
 ```

-Order does not matter in arguments. Therefore both the following example are valid.
+Order does not matter in arguments. Therefore both the following examples are valid.

 ```graphql example
 fragment multipleArgs on Arguments {
-  multipleReqs(x: 1, y: 2)
+  multipleRequirements(x: 1, y: 2)
 }

 fragment multipleArgsReverseOrder on Arguments {
-  multipleReqs(y: 1, x: 2)
+  multipleRequirements(y: 2, x: 1)
 }
 ```


 ### Argument Uniqueness

 Fields and directives treat arguments as a mapping of argument name to value.
 More than one argument with the same name in an argument set is ambiguous
 and invalid.

 **Formal Specification**

-  * For each {argument} in the Document.
-  * Let {argumentName} be the Name of {argument}.
-  * Let {arguments} be all Arguments named {argumentName} in the Argument Set which contains {argument}.
-  * {arguments} must be the set containing only {argument}.
+* For each {argument} in the Document.
+* Let {argumentName} be the Name of {argument}.
+* Let {arguments} be all Arguments named {argumentName} in the Argument Set which contains {argument}.
+* {arguments} must be the set containing only {argument}.


 #### Required Arguments

   * For each Field or Directive in the document.
   * Let {arguments} be the arguments provided by the Field or Directive.
   * Let {argumentDefinitions} be the set of argument definitions of that Field or Directive.
   * For each {argumentDefinition} in {argumentDefinitions}:
@@ -745,17 +755,17 @@ fragment goodBooleanArg on Arguments {

 fragment goodNonNullArg on Arguments {
   nonNullBooleanArgField(nonNullBooleanArg: true)
 }
 ```

 The argument can be omitted from a field with a nullable argument.

-Therefore the following query is valid:
+Therefore the following fragment is valid:

 ```graphql example
 fragment goodBooleanArgDefault on Arguments {
   booleanArgField
 }
 ```

 but this is not valid on a required argument.
@@ -778,20 +788,20 @@ fragment missingRequiredArg on Arguments {
 ## Fragments

 ### Fragment Declarations

 #### Fragment Name Uniqueness

 **Formal Specification**

-  * For each fragment definition {fragment} in the document
-  * Let {fragmentName} be the name of {fragment}.
-  * Let {fragments} be all fragment definitions in the document named {fragmentName}.
-  * {fragments} must be a set of one.
+* For each fragment definition {fragment} in the document
+* Let {fragmentName} be the name of {fragment}.
+* Let {fragments} be all fragment definitions in the document named {fragmentName}.
+* {fragments} must be a set of one.

 **Explanatory Text**

 Fragment definitions are referenced in fragment spreads by name. To avoid
 ambiguity, each fragment's name must be unique within a document.

 Inline fragments are not considered fragment definitions, and are unaffected by this
 validation rule.
@@ -837,25 +847,25 @@ fragment fragmentOne on Dog {
 }
 ```


 #### Fragment Spread Type Existence

 **Formal Specification**

-  * For each named spread {namedSpread} in the document
-  * Let {fragment} be the target of {namedSpread}
-  * The target type of {fragment} must be defined in the schema
+* For each named spread {namedSpread} in the document
+* Let {fragment} be the target of {namedSpread}
+* The target type of {fragment} must be defined in the schema

 **Explanatory Text**

 Fragments must be specified on types that exist in the schema. This
 applies for both named and inline fragments. If they are
-not defined in the schema, the query does not validate.
+not defined in the schema, the fragment is invalid.

 For example the following fragments are valid:

 ```graphql example
 fragment correctType on Dog {
   name
 }

@@ -886,19 +896,19 @@ fragment inlineNotExistingType on Dog {
 }
 ```


 #### Fragments On Composite Types

 **Formal Specification**

-  * For each {fragment} defined in the document.
-  * The target type of fragment must have kind {UNION}, {INTERFACE}, or
-    {OBJECT}.
+* For each {fragment} defined in the document.
+* The target type of fragment must have kind {UNION}, {INTERFACE}, or
+  {OBJECT}.

 **Explanatory Text**

 Fragments can only be declared on unions, interfaces, and objects. They are
 invalid on scalars. They can only be applied on non-leaf fields. This rule
 applies to both inline and named fragments.

 The following fragment declarations are valid:
@@ -933,53 +943,53 @@ fragment inlineFragOnScalar on Dog {
 }
 ```


 #### Fragments Must Be Used

 **Formal Specification**

-  * For each {fragment} defined in the document.
-  * {fragment} must be the target of at least one spread in the document
+* For each {fragment} defined in the document.
+* {fragment} must be the target of at least one spread in the document

 **Explanatory Text**

 Defined fragments must be used within a document.

 For example the following is an invalid document:

-```graphql counter-example
+```raw graphql counter-example
 fragment nameFragment on Dog { # unused
   name
 }

 {
   dog {
     name
   }
 }
 ```


 ### Fragment Spreads

 Field selection is also determined by spreading fragments into one
-another. The selection set of the target fragment is unioned with
+another. The selection set of the target fragment is combined into
 the selection set at the level at which the target fragment is
 referenced.


 #### Fragment spread target defined

 **Formal Specification**

-  * For every {namedSpread} in the document.
-  * Let {fragment} be the target of {namedSpread}
-  * {fragment} must be defined in the document
+* For every {namedSpread} in the document.
+* Let {fragment} be the target of {namedSpread}
+* {fragment} must be defined in the document

 **Explanatory Text**

 Named fragment spreads must refer to fragments defined within the
 document. It is a validation error if the target of a spread is
 not defined.

 ```graphql counter-example
@@ -990,27 +1000,28 @@ not defined.
 }
 ```


 #### Fragment spreads must not form cycles

 **Formal Specification**

-  * For each {fragmentDefinition} in the document
-  * Let {visited} be the empty set.
-  * {DetectCycles(fragmentDefinition, visited)}
+* For each {fragmentDefinition} in the document
+* Let {visited} be the empty set.
+* {DetectFragmentCycles(fragmentDefinition, visited)}
+
+DetectFragmentCycles(fragmentDefinition, visited):

-{DetectCycles(fragmentDefinition, visited)} :
   * Let {spreads} be all fragment spread descendants of {fragmentDefinition}
   * For each {spread} in {spreads}
     * {visited} must not contain {spread}
     * Let {nextVisited} be the set including {spread} and members of {visited}
     * Let {nextFragmentDefinition} be the target of {spread}
-    * {DetectCycles(nextFragmentDefinition, nextVisited)}
+    * {DetectFragmentCycles(nextFragmentDefinition, nextVisited)}

 **Explanatory Text**

 The graph of fragment spreads must not form any cycles including spreading itself.
 Otherwise an operation could infinitely spread or infinitely execute on cycles
 in the underlying data.

 This invalidates fragments that would result in an infinite spread:
@@ -1062,38 +1073,39 @@ executed against cyclic data:

 fragment dogFragment on Dog {
   name
   owner {
     ...ownerFragment
   }
 }

-fragment ownerFragment on Dog {
+fragment ownerFragment on Human {
   name
   pets {
     ...dogFragment
   }
 }
 ```


 #### Fragment spread is possible

 **Formal Specification**

-  * For each {spread} (named or inline) defined in the document.
-  * Let {fragment} be the target of {spread}
-  * Let {fragmentType} be the type condition of {fragment}
-  * Let {parentType} be the type of the selection set containing {spread}
-  * Let {applicableTypes} be the intersection of
-    {GetPossibleTypes(fragmentType)} and {GetPossibleTypes(parentType)}
-  * {applicableTypes} must not be empty.
+* For each {spread} (named or inline) defined in the document.
+* Let {fragment} be the target of {spread}
+* Let {fragmentType} be the type condition of {fragment}
+* Let {parentType} be the type of the selection set containing {spread}
+* Let {applicableTypes} be the intersection of
+  {GetPossibleTypes(fragmentType)} and {GetPossibleTypes(parentType)}
+* {applicableTypes} must not be empty.
+
+GetPossibleTypes(type):

-GetPossibleTypes(type) :
   * If {type} is an object type, return a set containing {type}
   * If {type} is an interface type, return the set of types implementing {type}
   * If {type} is a union type, return the set of possible types of {type}

 **Explanatory Text**

 Fragments are declared on a type and will only apply when the
 runtime object type matches the type condition. They also are
@@ -1233,17 +1245,17 @@ fragment unionWithInterface on Pet {

 fragment dogOrHumanFragment on DogOrHuman {
   ... on Dog {
     barkVolume
   }
 }
 ```

-is consider valid because {Dog} implements interface {Pet} and is a
+is considered valid because {Dog} implements interface {Pet} and is a
 member of {DogOrHuman}.

 However

 ```graphql counter-example
 fragment nonIntersectingInterfaces on Pet {
   ...sentientFragment
 }
@@ -1252,33 +1264,61 @@ fragment sentientFragment on Sentient {
   name
 }
 ```

 is not valid because there exists no type that implements both {Pet}
 and {Sentient}.


+**Interface Spreads in implemented Interface Scope**
+
+Additionally, an interface type fragment can always be spread into an
+interface scope which it implements.
+
+In the example below, the `...resourceFragment` fragments spreads is valid,
+since `Resource` implements `Node`.
+
+```raw graphql example
+interface Node {
+  id: ID!
+}
+
+interface Resource implements Node {
+  id: ID!
+  url: String
+}
+
+fragment interfaceWithInterface on Node {
+  ...resourceFragment
+}
+
+fragment resourceFragment on Resource {
+  url
+}
+```
+
+
 ## Values


 ### Values of Correct Type

-**Format Specification**
+**Formal Specification**

-  * For each input Value {value} in the document.
-    * Let {type} be the type expected in the position {value} is found.
-    * {value} must be coercible to {type}.
+* For each input Value {value} in the document.
+  * Let {type} be the type expected in the position {value} is found.
+  * {value} must be coercible to {type}.

 **Explanatory Text**

 Literal values must be compatible with the type expected in the position they
 are found as per the coercion rules defined in the Type System chapter.

-The type expected in a position include the type defined by the argument a value
+The type expected in a position includes the type defined by the argument a value
 is provided for, the type defined by an input object field a value is provided
 for, and the type of a variable definition a default value is provided for.

 The following examples are valid use of value literals:

 ```graphql example
 fragment goodBooleanArg on Arguments {
   booleanArgField(booleanArg: true)
@@ -1307,21 +1347,21 @@ query badComplexValue {
 }
 ```


 ### Input Object Field Names

 **Formal Specification**

-  * For each Input Object Field {inputField} in the document
-  * Let {inputFieldName} be the Name of {inputField}.
-  * Let {inputFieldDefinition} be the input field definition provided by the
-    parent input object type named {inputFieldName}.
-  * {inputFieldDefinition} must exist.
+* For each Input Object Field {inputField} in the document
+* Let {inputFieldName} be the Name of {inputField}.
+* Let {inputFieldDefinition} be the input field definition provided by the
+  parent input object type named {inputFieldName}.
+* {inputFieldDefinition} must exist.

 **Explanatory Text**

 Every input field provided in an input object value must be defined in the set
 of possible fields of that input object's expected type.

 For example the following example input object is valid:

@@ -1340,138 +1380,140 @@ which is not defined on the expected type:
 }
 ```


 ### Input Object Field Uniqueness

 **Formal Specification**

-  * For each input object value {inputObject} in the document.
-  * For every {inputField} in {inputObject}
-    * Let {name} be the Name of {inputField}.
-    * Let {fields} be all Input Object Fields named {name} in {inputObject}.
-    * {fields} must be the set containing only {inputField}.
+* For each input object value {inputObject} in the document.
+* For every {inputField} in {inputObject}
+  * Let {name} be the Name of {inputField}.
+  * Let {fields} be all Input Object Fields named {name} in {inputObject}.
+  * {fields} must be the set containing only {inputField}.

 **Explanatory Text**

 Input objects must not contain more than one field of the same name, otherwise
 an ambiguity would exist which includes an ignored portion of syntax.

-For example the following query will not pass validation.
+For example the following document will not pass validation.

 ```graphql counter-example
 {
   field(arg: { field: true, field: false })
 }
 ```


 ### Input Object Required Fields

 **Formal Specification**

-  * For each Input Object in the document.
-    * Let {fields} be the fields provided by that Input Object.
-    * Let {fieldDefinitions} be the set of input field definitions of that Input Object.
-  * For each {fieldDefinition} in {fieldDefinitions}:
-    * Let {type} be the expected type of {fieldDefinition}.
-    * Let {defaultValue} be the default value of {fieldDefinition}.
-    * If {type} is Non-Null and {defaultValue} does not exist:
-      * Let {fieldName} be the name of {fieldDefinition}.
-      * Let {field} be the input field in {fields} named {fieldName}
-      * {field} must exist.
-      * Let {value} be the value of {field}.
-      * {value} must not be the {null} literal.
+* For each Input Object in the document.
+  * Let {fields} be the fields provided by that Input Object.
+  * Let {fieldDefinitions} be the set of input field definitions of that Input Object.
+* For each {fieldDefinition} in {fieldDefinitions}:
+  * Let {type} be the expected type of {fieldDefinition}.
+  * Let {defaultValue} be the default value of {fieldDefinition}.
+  * If {type} is Non-Null and {defaultValue} does not exist:
+    * Let {fieldName} be the name of {fieldDefinition}.
+    * Let {field} be the input field in {fields} named {fieldName}
+    * {field} must exist.
+    * Let {value} be the value of {field}.
+    * {value} must not be the {null} literal.

 **Explanatory Text**

 Input object fields may be required. Much like a field may have required
 arguments, an input object may have required fields. An input field is required
 if it has a non-null type and does not have a default value. Otherwise, the
 input object field is optional.


 ## Directives


 ### Directives Are Defined

 **Formal Specification**

-  * For every {directive} in a document.
-  * Let {directiveName} be the name of {directive}.
-  * Let {directiveDefinition} be the directive named {directiveName}.
-  * {directiveDefinition} must exist.
+* For every {directive} in a document.
+* Let {directiveName} be the name of {directive}.
+* Let {directiveDefinition} be the directive named {directiveName}.
+* {directiveDefinition} must exist.

 **Explanatory Text**

-GraphQL servers define what directives they support. For each
-usage of a directive, the directive must be available on that server.
+GraphQL services define what directives they support. For each
+usage of a directive, the directive must be available on that service.


 ### Directives Are In Valid Locations

 **Formal Specification**

-  * For every {directive} in a document.
-  * Let {directiveName} be the name of {directive}.
-  * Let {directiveDefinition} be the directive named {directiveName}.
-  * Let {locations} be the valid locations for {directiveDefinition}.
-  * Let {adjacent} be the AST node the directive affects.
-  * {adjacent} must be represented by an item within {locations}.
+* For every {directive} in a document.
+* Let {directiveName} be the name of {directive}.
+* Let {directiveDefinition} be the directive named {directiveName}.
+* Let {locations} be the valid locations for {directiveDefinition}.
+* Let {adjacent} be the AST node the directive affects.
+* {adjacent} must be represented by an item within {locations}.

 **Explanatory Text**

-GraphQL servers define what directives they support and where they support them.
+GraphQL services define what directives they support and where they support them.
 For each usage of a directive, the directive must be used in a location that the
-server has declared support for.
+service has declared support for.

-For example the following query will not pass validation because `@skip` does
+For example the following document will not pass validation because `@skip` does
 not provide `QUERY` as a valid location.

 ```graphql counter-example
 query @skip(if: $foo) {
   field
 }
 ```


 ### Directives Are Unique Per Location

 **Formal Specification**

-  * For every {location} in the document for which Directives can apply:
-    * Let {directives} be the set of Directives which apply to {location}.
-    * For each {directive} in {directives}:
-      * Let {directiveName} be the name of {directive}.
-      * Let {namedDirectives} be the set of all Directives named {directiveName}
-        in {directives}.
-      * {namedDirectives} must be a set of one.
+* For every {location} in the document for which Directives can apply:
+  * Let {directives} be the set of Directives which apply to {location} and
+    are not repeatable.
+  * For each {directive} in {directives}:
+    * Let {directiveName} be the name of {directive}.
+    * Let {namedDirectives} be the set of all Directives named {directiveName}
+      in {directives}.
+    * {namedDirectives} must be a set of one.

 **Explanatory Text**

 Directives are used to describe some metadata or behavioral change on the
 definition they apply to. When more than one directive of the same name is used,
 the expected metadata or behavior becomes ambiguous, therefore only one of each
 directive is allowed per location.

-For example, the following query will not pass validation because `@skip` has
+For example, the following document will not pass validation because `@skip` has
 been used twice for the same field:

-```graphql counter-example
+```raw graphql counter-example
 query ($foo: Boolean = true, $bar: Boolean = false) {
   field @skip(if: $foo) @skip(if: $bar)
 }
 ```

 However the following example is valid because `@skip` has been used only once
-per location, despite being used twice in the query and on the same named field:
+per location, despite being used twice in the operation and on the same
+named field:

-```graphql example
+```raw graphql example
 query ($foo: Boolean = true, $bar: Boolean = false) {
   field @skip(if: $foo) {
     subfieldA
   }
   field @skip(if: $bar) {
     subfieldB
   }
 }
@@ -1479,33 +1521,33 @@ query ($foo: Boolean = true, $bar: Boolean = false) {


 ## Variables

 ### Variable Uniqueness

 **Formal Specification**

-  * For every {operation} in the document
-    * For every {variable} defined on {operation}
-      * Let {variableName} be the name of {variable}
-      * Let {variables} be the set of all variables named {variableName} on
-        {operation}
-      * {variables} must be a set of one
+* For every {operation} in the document
+  * For every {variable} defined on {operation}
+    * Let {variableName} be the name of {variable}
+    * Let {variables} be the set of all variables named {variableName} on
+      {operation}
+    * {variables} must be a set of one

 **Explanatory Text**

 If any operation defines more than one variable with the same name, it is
 ambiguous and invalid. It is invalid even if the type of the duplicate variable
 is the same.

 ```graphql counter-example
 query houseTrainedQuery($atOtherHomes: Boolean, $atOtherHomes: Boolean) {
   dog {
-    isHousetrained(atOtherHomes: $atOtherHomes)
+    isHouseTrained(atOtherHomes: $atOtherHomes)
   }
 }
 ```


 It is valid for multiple operations to define a variable with the same name. If
 two operations reference the same fragment, it might actually be necessary:

@@ -1513,70 +1555,73 @@ two operations reference the same fragment, it might actually be necessary:
 query A($atOtherHomes: Boolean) {
   ...HouseTrainedFragment
 }

 query B($atOtherHomes: Boolean) {
   ...HouseTrainedFragment
 }

-fragment HouseTrainedFragment {
+fragment HouseTrainedFragment on Query {
   dog {
-    isHousetrained(atOtherHomes: $atOtherHomes)
+    isHouseTrained(atOtherHomes: $atOtherHomes)
   }
 }
 ```


 ### Variables Are Input Types

 **Formal Specification**

-  * For every {operation} in a {document}
-  * For every {variable} on each {operation}
-    * Let {variableType} be the type of {variable}
-    * {IsInputType(variableType)} must be {true}
+* For every {operation} in a {document}
+* For every {variable} on each {operation}
+  * Let {variableType} be the type of {variable}
+  * {IsInputType(variableType)} must be {true}

 **Explanatory Text**

 Variables can only be input types. Objects, unions, and interfaces cannot be
 used as inputs.

-For these examples, consider the following typesystem additions:
+For these examples, consider the following type system additions:

 ```graphql example
-input ComplexInput { name: String, owner: String }
+input ComplexInput {
+  name: String
+  owner: String
+}

 extend type Query {
   findDog(complex: ComplexInput): Dog
   booleanList(booleanListArg: [Boolean!]): Boolean
 }
 ```

-The following queries are valid:
+The following operations are valid:

 ```graphql example
 query takesBoolean($atOtherHomes: Boolean) {
   dog {
-    isHousetrained(atOtherHomes: $atOtherHomes)
+    isHouseTrained(atOtherHomes: $atOtherHomes)
   }
 }

 query takesComplexInput($complexInput: ComplexInput) {
   findDog(complex: $complexInput) {
     name
   }
 }

 query TakesListOfBooleanBang($booleans: [Boolean!]) {
   booleanList(booleanListArg: $booleans)
 }
 ```

-The following queries are invalid:
+The following operations are invalid:

 ```graphql counter-example
 query takesCat($cat: Cat) {
   # ...
 }

 query takesDogBang($dog: Dog!) {
   # ...
@@ -1591,268 +1636,270 @@ query takesCatOrDog($catOrDog: CatOrDog) {
 }
 ```


 ### All Variable Uses Defined

 **Formal Specification**

-  * For each {operation} in a document
-    * For each {variableUsage} in scope, variable must be in {operation}'s variable list.
-    * Let {fragments} be every fragment referenced by that {operation} transitively
-    * For each {fragment} in {fragments}
-      * For each {variableUsage} in scope of {fragment}, variable must be in
-        {operation}'s variable list.
+* For each {operation} in a document
+  * For each {variableUsage} in scope, variable must be in {operation}'s variable list.
+  * Let {fragments} be every fragment referenced by that {operation} transitively
+  * For each {fragment} in {fragments}
+    * For each {variableUsage} in scope of {fragment}, variable must be in
+      {operation}'s variable list.

 **Explanatory Text**

 Variables are scoped on a per-operation basis. That means that any variable
 used within the context of an operation must be defined at the top level of that
 operation

 For example:

 ```graphql example
 query variableIsDefined($atOtherHomes: Boolean) {
   dog {
-    isHousetrained(atOtherHomes: $atOtherHomes)
+    isHouseTrained(atOtherHomes: $atOtherHomes)
   }
 }
 ```

 is valid. ${atOtherHomes} is defined by the operation.

-By contrast the following query is invalid:
+By contrast the following document is invalid:

 ```graphql counter-example
 query variableIsNotDefined {
   dog {
-    isHousetrained(atOtherHomes: $atOtherHomes)
+    isHouseTrained(atOtherHomes: $atOtherHomes)
   }
 }
 ```

 ${atOtherHomes} is not defined by the operation.

 Fragments complicate this rule. Any fragment transitively included by an
 operation has access to the variables defined by that operation. Fragments
 can appear within multiple operations and therefore variable usages
 must correspond to variable definitions in all of those operations.

 For example the following is valid:

 ```graphql example
 query variableIsDefinedUsedInSingleFragment($atOtherHomes: Boolean) {
   dog {
-    ...isHousetrainedFragment
+    ...isHouseTrainedFragment
   }
 }

-fragment isHousetrainedFragment on Dog {
-  isHousetrained(atOtherHomes: $atOtherHomes)
+fragment isHouseTrainedFragment on Dog {
+  isHouseTrained(atOtherHomes: $atOtherHomes)
 }
 ```

-since {isHousetrainedFragment} is used within the context of the operation
+since {isHouseTrainedFragment} is used within the context of the operation
 {variableIsDefinedUsedInSingleFragment} and the variable is defined by that
 operation.

 On the other hand, if a fragment is included within an operation that does
-not define a referenced variable, the query is invalid.
+not define a referenced variable, the document is invalid.

 ```graphql counter-example
 query variableIsNotDefinedUsedInSingleFragment {
   dog {
-    ...isHousetrainedFragment
+    ...isHouseTrainedFragment
   }
 }

-fragment isHousetrainedFragment on Dog {
-  isHousetrained(atOtherHomes: $atOtherHomes)
+fragment isHouseTrainedFragment on Dog {
+  isHouseTrained(atOtherHomes: $atOtherHomes)
 }
 ```

 This applies transitively as well, so the following also fails:

 ```graphql counter-example
 query variableIsNotDefinedUsedInNestedFragment {
   dog {
-    ...outerHousetrainedFragment
+    ...outerHouseTrainedFragment
   }
 }

-fragment outerHousetrainedFragment on Dog {
-  ...isHousetrainedFragment
+fragment outerHouseTrainedFragment on Dog {
+  ...isHouseTrainedFragment
 }

-fragment isHousetrainedFragment on Dog {
-  isHousetrained(atOtherHomes: $atOtherHomes)
+fragment isHouseTrainedFragment on Dog {
+  isHouseTrained(atOtherHomes: $atOtherHomes)
 }
 ```

 Variables must be defined in all operations in which a fragment
 is used.

 ```graphql example
-query housetrainedQueryOne($atOtherHomes: Boolean) {
+query houseTrainedQueryOne($atOtherHomes: Boolean) {
   dog {
-    ...isHousetrainedFragment
+    ...isHouseTrainedFragment
   }
 }

-query housetrainedQueryTwo($atOtherHomes: Boolean) {
+query houseTrainedQueryTwo($atOtherHomes: Boolean) {
   dog {
-    ...isHousetrainedFragment
+    ...isHouseTrainedFragment
   }
 }

-fragment isHousetrainedFragment on Dog {
-  isHousetrained(atOtherHomes: $atOtherHomes)
+fragment isHouseTrainedFragment on Dog {
+  isHouseTrained(atOtherHomes: $atOtherHomes)
 }
 ```

 However the following does not validate:

 ```graphql counter-example
-query housetrainedQueryOne($atOtherHomes: Boolean) {
+query houseTrainedQueryOne($atOtherHomes: Boolean) {
   dog {
-    ...isHousetrainedFragment
+    ...isHouseTrainedFragment
   }
 }

-query housetrainedQueryTwoNotDefined {
+query houseTrainedQueryTwoNotDefined {
   dog {
-    ...isHousetrainedFragment
+    ...isHouseTrainedFragment
   }
 }

-fragment isHousetrainedFragment on Dog {
-  isHousetrained(atOtherHomes: $atOtherHomes)
+fragment isHouseTrainedFragment on Dog {
+  isHouseTrained(atOtherHomes: $atOtherHomes)
 }
 ```

-This is because {housetrainedQueryTwoNotDefined} does not define
-a variable ${atOtherHomes} but that variable is used by {isHousetrainedFragment}
+This is because {houseTrainedQueryTwoNotDefined} does not define
+a variable ${atOtherHomes} but that variable is used by {isHouseTrainedFragment}
 which is included in that operation.


 ### All Variables Used

 **Formal Specification**

-  * For every {operation} in the document.
-  * Let {variables} be the variables defined by that {operation}
-  * Each {variable} in {variables} must be used at least once in either
-    the operation scope itself or any fragment transitively referenced by that
-    operation.
+* For every {operation} in the document.
+* Let {variables} be the variables defined by that {operation}
+* Each {variable} in {variables} must be used at least once in either
+  the operation scope itself or any fragment transitively referenced by that
+  operation.

 **Explanatory Text**

 All variables defined by an operation must be used in that operation or a
 fragment transitively included by that operation. Unused variables cause
 a validation error.

 For example the following is invalid:

 ```graphql counter-example
 query variableUnused($atOtherHomes: Boolean) {
   dog {
-    isHousetrained
+    isHouseTrained
   }
 }
 ```

 because ${atOtherHomes} is not referenced.

 These rules apply to transitive fragment spreads as well:

 ```graphql example
 query variableUsedInFragment($atOtherHomes: Boolean) {
   dog {
-    ...isHousetrainedFragment
+    ...isHouseTrainedFragment
   }
 }

-fragment isHousetrainedFragment on Dog {
-  isHousetrained(atOtherHomes: $atOtherHomes)
+fragment isHouseTrainedFragment on Dog {
+  isHouseTrained(atOtherHomes: $atOtherHomes)
 }
 ```

-The above is valid since ${atOtherHomes} is used in {isHousetrainedFragment}
+The above is valid since ${atOtherHomes} is used in {isHouseTrainedFragment}
 which is included by {variableUsedInFragment}.

 If that fragment did not have a reference to ${atOtherHomes} it would be not valid:

 ```graphql counter-example
 query variableNotUsedWithinFragment($atOtherHomes: Boolean) {
   dog {
-    ...isHousetrainedWithoutVariableFragment
+    ...isHouseTrainedWithoutVariableFragment
   }
 }

-fragment isHousetrainedWithoutVariableFragment on Dog {
-  isHousetrained
+fragment isHouseTrainedWithoutVariableFragment on Dog {
+  isHouseTrained
 }
 ```

 All operations in a document must use all of their variables.

 As a result, the following document does not validate.

 ```graphql counter-example
 query queryWithUsedVar($atOtherHomes: Boolean) {
   dog {
-    ...isHousetrainedFragment
+    ...isHouseTrainedFragment
   }
 }

 query queryWithExtraVar($atOtherHomes: Boolean, $extra: Int) {
   dog {
-    ...isHousetrainedFragment
+    ...isHouseTrainedFragment
   }
 }

-fragment isHousetrainedFragment on Dog {
-  isHousetrained(atOtherHomes: $atOtherHomes)
+fragment isHouseTrainedFragment on Dog {
+  isHouseTrained(atOtherHomes: $atOtherHomes)
 }
 ```

 This document is not valid because {queryWithExtraVar} defines
 an extraneous variable.


 ### All Variable Usages are Allowed

 **Formal Specification**

-  * For each {operation} in {document}:
-  * Let {variableUsages} be all usages transitively included in the {operation}.
-  * For each {variableUsage} in {variableUsages}:
-    * Let {variableName} be the name of {variableUsage}.
-    * Let {variableDefinition} be the {VariableDefinition} named {variableName}
-      defined within {operation}.
-    * {IsVariableUsageAllowed(variableDefinition, variableUsage)} must be {true}.
+* For each {operation} in {document}:
+* Let {variableUsages} be all usages transitively included in the {operation}.
+* For each {variableUsage} in {variableUsages}:
+  * Let {variableName} be the name of {variableUsage}.
+  * Let {variableDefinition} be the {VariableDefinition} named {variableName}
+    defined within {operation}.
+  * {IsVariableUsageAllowed(variableDefinition, variableUsage)} must be {true}.

 IsVariableUsageAllowed(variableDefinition, variableUsage):
+
   * Let {variableType} be the expected type of {variableDefinition}.
   * Let {locationType} be the expected type of the {Argument}, {ObjectField},
     or {ListValue} entry where {variableUsage} is located.
   * If {locationType} is a non-null type AND {variableType} is NOT a non-null type:
     * Let {hasNonNullVariableDefaultValue} be {true} if a default value exists
       for {variableDefinition} and is not the value {null}.
     * Let {hasLocationDefaultValue} be {true} if a default value exists for
       the {Argument} or {ObjectField} where {variableUsage} is located.
     * If {hasNonNullVariableDefaultValue} is NOT {true} AND
       {hasLocationDefaultValue} is NOT {true}, return {false}.
     * Let {nullableLocationType} be the unwrapped nullable type of {locationType}.
     * Return {AreTypesCompatible(variableType, nullableLocationType)}.
   * Return {AreTypesCompatible(variableType, locationType)}.

 AreTypesCompatible(variableType, locationType):
+
   * If {locationType} is a non-null type:
     * If {variableType} is NOT a non-null type, return {false}.
     * Let {nullableLocationType} be the unwrapped nullable type of {locationType}.
     * Let {nullableVariableType} be the unwrapped nullable type of {variableType}.
     * Return {AreTypesCompatible(nullableVariableType, nullableLocationType)}.
   * Otherwise, if {variableType} is a non-null type:
     * Let {nullableVariableType} be the nullable type of {variableType}.
     * Return {AreTypesCompatible(nullableVariableType, locationType)}.
@@ -1877,17 +1924,17 @@ Types must match:
 ```graphql counter-example
 query intCannotGoIntoBoolean($intArg: Int) {
   arguments {
     booleanArgField(booleanArg: $intArg)
   }
 }
 ```

-${intArg} typed as {Int} cannot be used as a argument to {booleanArg}, typed as {Boolean}.
+${intArg} typed as {Int} cannot be used as an argument to {booleanArg}, typed as {Boolean}.

 List cardinality must also be the same. For example, lists cannot be passed into singular
 values.

 ```graphql counter-example
 query booleanListCannotGoIntoBoolean($booleanListArg: [Boolean]) {
   arguments {
     booleanArgField(booleanArg: $booleanListArg)
@@ -1933,33 +1980,37 @@ This would fail validation because a `[T]` cannot be passed to a `[T]!`.
 Similarly a `[T]` cannot be passed to a `[T!]`.

 **Allowing optional variables when default values exist**

 A notable exception to typical variable type compatibility is allowing a
 variable definition with a nullable type to be provided to a non-null location
 as long as either that variable or that location provides a default value.

+In the example below, an optional variable `$booleanArg` is allowed to be used
+in the non-null argument `optionalBooleanArg` because the field argument is
+optional since it provides a default value in the schema.
+
 ```graphql example
 query booleanArgQueryWithDefault($booleanArg: Boolean) {
   arguments {
     optionalNonNullBooleanArgField(optionalBooleanArg: $booleanArg)
   }
 }
 ```

-In the example above, an optional variable is allowed to be used in an non-null argument which provides a default value.
+In the example below, an optional variable `$booleanArg` is allowed to be used
+in the non-null argument (`nonNullBooleanArg`) because the variable provides
+a default value in the operation. This behavior is explicitly supported for
+compatibility with earlier editions of this specification. GraphQL authoring
+tools may wish to report this as a warning with the suggestion to replace
+`Boolean` with `Boolean!` to avoid ambiguity.

 ```graphql example
 query booleanArgQueryWithDefault($booleanArg: Boolean = true) {
   arguments {
     nonNullBooleanArgField(nonNullBooleanArg: $booleanArg)
   }
 }
 ```

-In the example above, a variable provides a default value and can be used in a
-non-null argument. This behavior is explicitly supported for compatibility with
-earlier editions of this specification. GraphQL authoring tools may wish to
-report this is a warning with the suggestion to replace `Boolean` with `Boolean!`.
-
-Note: The value {null} could still be provided to a such a variable at runtime.
-A non-null argument must produce a field error if provided a {null} value.
+Note: The value {null} could still be provided to such a variable at runtime.
+A non-null argument must raise a field error if provided a {null} value.
~~~
</details>

<details>
<summary>spec/Section 6 -- Execution.md</summary>

~~~diff
@@ -36,20 +36,20 @@ ExecuteRequest(schema, document, operationName, variableValues, initialValue):
   * Otherwise if {operation} is a subscription operation:
     * Return {Subscribe(operation, schema, coercedVariableValues, initialValue)}.

 GetOperation(document, operationName):

   * If {operationName} is {null}:
     * If {document} contains exactly one operation.
       * Return the Operation contained in the {document}.
-    * Otherwise produce a query error requiring {operationName}.
+    * Otherwise raise a request error requiring {operationName}.
   * Otherwise:
     * Let {operation} be the Operation named {operationName} in {document}.
-    * If {operation} was not found, produce a query error.
+    * If {operation} was not found, raise a request error.
     * Return {operation}.


 ### Validating Requests

 As explained in the Validation section, only requests which pass all validation
 rules should be executed. If validation errors are known, they should be
 reported in the list of "errors" in the response and the request must fail
@@ -66,17 +66,17 @@ For example: the request may be validated during development, provided it does
 not later change, or a service may validate a request once and memoize the
 result to avoid validating the same request again in the future.


 ### Coercing Variable Values

 If the operation has defined any variables, then the values for
 those variables need to be coerced using the input coercion rules
-of variable's declared type. If a query error is encountered during
+of variable's declared type. If a request error is encountered during
 input coercion of variable values, then the operation fails without
 execution.

 CoerceVariableValues(schema, operation, variableValues):

   * Let {coercedValues} be an empty unordered Map.
   * Let {variableDefinitions} be the variables defined by {operation}.
   * For each {variableDefinition} in {variableDefinitions}:
@@ -87,62 +87,63 @@ CoerceVariableValues(schema, operation, variableValues):
     * Let {hasValue} be {true} if {variableValues} provides a value for the
       name {variableName}.
     * Let {value} be the value provided in {variableValues} for the
       name {variableName}.
     * If {hasValue} is not {true} and {defaultValue} exists (including {null}):
       * Add an entry to {coercedValues} named {variableName} with the
         value {defaultValue}.
     * Otherwise if {variableType} is a Non-Nullable type, and either {hasValue}
-      is not {true} or {value} is {null}, throw a query error.
+      is not {true} or {value} is {null}, raise a request error.
     * Otherwise if {hasValue} is true:
       * If {value} is {null}:
         * Add an entry to {coercedValues} named {variableName} with the
           value {null}.
       * Otherwise:
         * If {value} cannot be coerced according to the input coercion
-          rules of {variableType}, throw a query error.
+          rules of {variableType}, raise a request error.
         * Let {coercedValue} be the result of coercing {value} according to the
           input coercion rules of {variableType}.
         * Add an entry to {coercedValues} named {variableName} with the
           value {coercedValue}.
   * Return {coercedValues}.

 Note: This algorithm is very similar to {CoerceArgumentValues()}.


 ## Executing Operations

 The type system, as described in the "Type System" section of the spec, must
-provide a query root object type. If mutations or subscriptions are supported,
-it must also provide a mutation or subscription root object type, respectively.
+provide a query root operation type. If mutations or subscriptions are supported,
+it must also provide a mutation or subscription root operation type, respectively.

 ### Query

 If the operation is a query, the result of the operation is the result of
-executing the query’s top level selection set with the query root object type.
+executing the operation’s top level selection set with the query root
+operation type.

-An initial value may be provided when executing a query.
+An initial value may be provided when executing a query operation.

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

 ### Mutation

 If the operation is a mutation, the result of the operation is the result of
-executing the mutation’s top level selection set on the mutation root
+executing the operation’s top level selection set on the mutation root
 object type. This selection set should be executed serially.

 It is expected that the top level fields in a mutation operation perform
 side-effects on the underlying data system. Serial execution of the provided
 mutations ensures against race conditions during these side-effects.

 ExecuteMutation(mutation, schema, variableValues, initialValue):

@@ -157,18 +158,18 @@ ExecuteMutation(mutation, schema, variableValues, initialValue):
   * Return an unordered map containing {data} and {errors}.

 ### Subscription

 If the operation is a subscription, the result is an event stream called the
 "Response Stream" where each event in the event stream is the result of
 executing the operation for each new event on an underlying "Source Stream".

-Executing a subscription creates a persistent function on the server that
-maps an underlying Source Stream to a returned Response Stream.
+Executing a subscription operation creates a persistent function on the service
+that maps an underlying Source Stream to a returned Response Stream.

 Subscribe(subscription, schema, variableValues, initialValue):

   * Let {sourceStream} be the result of running {CreateSourceEventStream(subscription, schema, variableValues, initialValue)}.
   * Let {responseStream} be the result of running {MapSourceToResponseEvent(sourceStream, subscription, schema, variableValues)}
   * Return {responseStream}.

 Note: In large scale subscription systems, the {Subscribe()} and
@@ -216,48 +217,49 @@ events or may complete at any point. Event streams may complete in response to
 an error or simply because no more events will occur. An observer may at any
 point decide to stop observing an event stream by cancelling it, after which it
 must receive no more events from that event stream.

 **Supporting Subscriptions at Scale**

 Supporting subscriptions is a significant change for any GraphQL service. Query
 and mutation operations are stateless, allowing scaling via cloning of GraphQL
-server instances. Subscriptions, by contrast, are stateful and require
+service instances. Subscriptions, by contrast, are stateful and require
 maintaining the GraphQL document, variables, and other context over the lifetime
 of the subscription.

 Consider the behavior of your system when state is lost due to the failure of a
 single machine in a service. Durability and availability may be improved by
 having separate dedicated services for managing subscription state and client
 connectivity.

 **Delivery Agnostic**

 GraphQL subscriptions do not require any specific serialization format or
 transport mechanism. Subscriptions specifies algorithms for the creation of a
 stream, the content of each payload on that stream, and the closing of that
-stream. There are intentionally no specifications for message acknoledgement,
+stream. There are intentionally no specifications for message acknowledgement,
 buffering, resend requests, or any other quality of service (QoS) details.
 Message serialization, transport mechanisms, and quality of service details
 should be chosen by the implementing service.

 #### Source Stream

 A Source Stream represents the sequence of events, each of which will
 trigger a GraphQL execution corresponding to that event. Like field value
 resolution, the logic to create a Source Stream is application-specific.

 CreateSourceEventStream(subscription, schema, variableValues, initialValue):

   * Let {subscriptionType} be the root Subscription type in {schema}.
   * Assert: {subscriptionType} is an Object type.
+  * Let {selectionSet} be the top level Selection Set in {subscription}.
   * Let {groupedFieldSet} be the result of
     {CollectFields(subscriptionType, selectionSet, variableValues)}.
-  * If {groupedFieldSet} does not have exactly one entry, throw a query error.
+  * If {groupedFieldSet} does not have exactly one entry, raise a request error.
   * Let {fields} be the value of the first entry in {groupedFieldSet}.
   * Let {fieldName} be the name of the first entry in {fields}.
     Note: This value is unaffected if an alias is used.
   * Let {field} be the first entry in {fields}.
   * Let {argumentValues} be the result of {CoerceArgumentValues(subscriptionType, field, variableValues)}
   * Let {fieldStream} be the result of running {ResolveFieldEventStream(subscriptionType, initialValue, fieldName, argumentValues)}.
   * Return {fieldStream}.

@@ -325,41 +327,41 @@ ExecuteSelectionSet(selectionSet, objectType, objectValue, variableValues):
   * Let {groupedFieldSet} be the result of
     {CollectFields(objectType, selectionSet, variableValues)}.
   * Initialize {resultMap} to an empty ordered map.
   * For each {groupedFieldSet} as {responseKey} and {fields}:
     * Let {fieldName} be the name of the first entry in {fields}.
       Note: This value is unaffected if an alias is used.
     * Let {fieldType} be the return type defined for the field {fieldName} of {objectType}.
     * If {fieldType} is defined:
-      * Let {responseValue} be {ExecuteField(objectType, objectValue, fields, fieldType, variableValues)}.
+      * Let {responseValue} be {ExecuteField(objectType, objectValue, fieldType, fields, variableValues)}.
       * Set {responseValue} as the value for {responseKey} in {resultMap}.
   * Return {resultMap}.

-Note: {resultMap} is ordered by which fields appear first in the query. This
+Note: {resultMap} is ordered by which fields appear first in the operation. This
 is explained in greater detail in the Field Collection section below.

 **Errors and Non-Null Fields**

-If during {ExecuteSelectionSet()} a field with a non-null {fieldType} throws a
+If during {ExecuteSelectionSet()} a field with a non-null {fieldType} raises a
 field error then that error must propagate to this entire selection set, either
 resolving to {null} if allowed or further propagated to a parent field.

 If this occurs, any sibling fields which have not yet executed or have not yet
 yielded a value may be cancelled to avoid unnecessary work.

-See the [Errors and Non-Nullability](#sec-Errors-and-Non-Nullability) section
-of Field Execution for more about this behavior.
+Note: See [Handling Field Errors](#sec-Handling-Field-Errors) for more about
+this behavior.

 ### Normal and Serial Execution

 Normally the executor can execute the entries in a grouped field set in whatever
 order it chooses (normally in parallel). Because the resolution of fields other
 than top-level mutation fields must always be side effect-free and idempotent,
-the execution order must not affect the result, and hence the server has the
+the execution order must not affect the result, and hence the service has the
 freedom to execute the field entries in whatever order it deems optimal.

 For example, given the following grouped field set to be executed normally:

 ```graphql example
 {
   birthday {
     month
@@ -446,18 +448,18 @@ A correct executor must generate the following result for that selection set:
 ```


 ### Field Collection

 Before execution, the selection set is converted to a grouped field set by
 calling {CollectFields()}. Each entry in the grouped field set is a list of
 fields that share a response key (the alias if defined, otherwise the field
-name). This ensures all fields with the same response key included via
-referenced fragments are executed at the same time.
+name). This ensures all fields with the same response key (including those
+in referenced fragments) are executed at the same time.

 As an example, collecting the fields of this selection set would collect two
 instances of the field `a` and one of field `b`:

 ```graphql example
 {
   a {
     subfield1
@@ -474,17 +476,17 @@ fragment ExampleFragment on Query {
 ```

 The depth-first-search order of the field groups produced by {CollectFields()}
 is maintained through execution, ensuring that fields appear in the executed
 response in a stable and predictable order.

 CollectFields(objectType, selectionSet, variableValues, visitedFragments):

-  * If {visitedFragments} if not provided, initialize it to the empty set.
+  * If {visitedFragments} is not provided, initialize it to the empty set.
   * Initialize {groupedFields} to an empty ordered map of lists.
   * For each {selection} in {selectionSet}:
     * If {selection} provides the directive `@skip`, let {skipDirective} be that directive.
       * If {skipDirective}'s {if} argument is {true} or is a variable in {variableValues} with the value {true}, continue with the next
       {selection} in {selectionSet}.
     * If {selection} provides the directive `@include`, let {includeDirective} be that directive.
       * If {includeDirective}'s {if} argument is not {true} and is not a variable in {variableValues} with the value {true}, continue with the next
       {selection} in {selectionSet}.
@@ -502,17 +504,17 @@ CollectFields(objectType, selectionSet, variableValues, visitedFragments):
         {fragmentSpreadName}.
       * If no such {fragment} exists, continue with the next {selection} in
         {selectionSet}.
       * Let {fragmentType} be the type condition on {fragment}.
       * If {DoesFragmentTypeApply(objectType, fragmentType)} is false, continue
         with the next {selection} in {selectionSet}.
       * Let {fragmentSelectionSet} be the top-level selection set of {fragment}.
       * Let {fragmentGroupedFieldSet} be the result of calling
-        {CollectFields(objectType, fragmentSelectionSet, visitedFragments)}.
+        {CollectFields(objectType, fragmentSelectionSet, variableValues, visitedFragments)}.
       * For each {fragmentGroup} in {fragmentGroupedFieldSet}:
         * Let {responseKey} be the response key shared by all fields in {fragmentGroup}.
         * Let {groupForResponseKey} be the list in {groupedFields} for
           {responseKey}; if no such list exists, create it as an empty list.
         * Append all items in {fragmentGroup} to {groupForResponseKey}.
     * If {selection} is an {InlineFragment}:
       * Let {fragmentType} be the type condition on {selection}.
       * If {fragmentType} is not {null} and {DoesFragmentTypeApply(objectType, fragmentType)} is false, continue
@@ -530,16 +532,19 @@ DoesFragmentTypeApply(objectType, fragmentType):

   * If {fragmentType} is an Object Type:
     * if {objectType} and {fragmentType} are the same type, return {true}, otherwise return {false}.
   * If {fragmentType} is an Interface Type:
     * if {objectType} is an implementation of {fragmentType}, return {true} otherwise return {false}.
   * If {fragmentType} is a Union:
     * if {objectType} is a possible type of {fragmentType}, return {true} otherwise return {false}.

+Note: The steps in {CollectFields()} evaluating the `@skip` and `@include`
+directives may be applied in either order since they apply commutatively.
+

 ## Executing Fields

 Each field requested in the grouped field set that is defined on the selected
 objectType will result in an entry in the response map. Field execution first
 coerces any provided argument values, then resolves a value for the field, and
 finally completes that value either by recursively executing another selection
 set or coercing a scalar value.
@@ -553,18 +558,18 @@ ExecuteField(objectType, objectValue, fieldType, fields, variableValues):


 ### Coercing Field Arguments

 Fields may include arguments which are provided to the underlying runtime in
 order to correctly produce a value. These arguments are defined by the field in
 the type system to have a specific input type.

-At each argument position in a query may be a literal {Value}, or a {Variable}
-to be provided at runtime.
+At each argument position in an operation may be a literal {Value}, or a
+{Variable} to be provided at runtime.

 CoerceArgumentValues(objectType, field, variableValues):
   * Let {coercedValues} be an empty unordered Map.
   * Let {argumentValues} be the argument values provided in {field}.
   * Let {fieldName} be the name of {field}.
   * Let {argumentDefinitions} be the arguments defined by {objectType} for the
     field named {fieldName}.
   * For each {argumentDefinition} in {argumentDefinitions}:
@@ -581,35 +586,35 @@ CoerceArgumentValues(objectType, field, variableValues):
         name {variableName}.
       * Let {value} be the value provided in {variableValues} for the
         name {variableName}.
     * Otherwise, let {value} be {argumentValue}.
     * If {hasValue} is not {true} and {defaultValue} exists (including {null}):
       * Add an entry to {coercedValues} named {argumentName} with the
         value {defaultValue}.
     * Otherwise if {argumentType} is a Non-Nullable type, and either {hasValue}
-      is not {true} or {value} is {null}, throw a field error.
+      is not {true} or {value} is {null}, raise a field error.
     * Otherwise if {hasValue} is true:
       * If {value} is {null}:
         * Add an entry to {coercedValues} named {argumentName} with the
           value {null}.
       * Otherwise, if {argumentValue} is a {Variable}:
         * Add an entry to {coercedValues} named {argumentName} with the
           value {value}.
       * Otherwise:
         * If {value} cannot be coerced according to the input coercion
-            rules of {variableType}, throw a field error.
+            rules of {argumentType}, raise a field error.
         * Let {coercedValue} be the result of coercing {value} according to the
-          input coercion rules of {variableType}.
+          input coercion rules of {argumentType}.
         * Add an entry to {coercedValues} named {argumentName} with the
           value {coercedValue}.
   * Return {coercedValues}.

 Note: Variable values are not coerced because they are expected to be coerced
-before executing the operation in {CoerceVariableValues()}, and valid queries
+before executing the operation in {CoerceVariableValues()}, and valid operations
 must only allow usage of variables of appropriate types.


 ### Value Resolution

 While nearly all of GraphQL execution can be described generically, ultimately
 the internal system exposing the GraphQL interface must provide values.
 This is exposed via {ResolveFieldValue}, which produces a value for a given
@@ -636,37 +641,58 @@ After resolving the value for a field, it is completed by ensuring it adheres
 to the expected return type. If the return type is another Object type, then
 the field execution process continues recursively.

 CompleteValue(fieldType, fields, result, variableValues):
   * If the {fieldType} is a Non-Null type:
     * Let {innerType} be the inner type of {fieldType}.
     * Let {completedResult} be the result of calling
       {CompleteValue(innerType, fields, result, variableValues)}.
-    * If {completedResult} is {null}, throw a field error.
+    * If {completedResult} is {null}, raise a field error.
     * Return {completedResult}.
   * If {result} is {null} (or another internal value similar to {null} such as
-    {undefined} or {NaN}), return {null}.
+    {undefined}), return {null}.
   * If {fieldType} is a List type:
-    * If {result} is not a collection of values, throw a field error.
+    * If {result} is not a collection of values, raise a field error.
     * Let {innerType} be the inner type of {fieldType}.
     * Return a list where each list item is the result of calling
       {CompleteValue(innerType, fields, resultItem, variableValues)}, where
       {resultItem} is each item in {result}.
   * If {fieldType} is a Scalar or Enum type:
-    * Return the result of "coercing" {result}, ensuring it is a legal value of
-      {fieldType}, otherwise {null}.
+    * Return the result of {CoerceResult(fieldType, result)}.
   * If {fieldType} is an Object, Interface, or Union type:
     * If {fieldType} is an Object type.
       * Let {objectType} be {fieldType}.
     * Otherwise if {fieldType} is an Interface or Union type.
       * Let {objectType} be {ResolveAbstractType(fieldType, result)}.
     * Let {subSelectionSet} be the result of calling {MergeSelectionSets(fields)}.
     * Return the result of evaluating {ExecuteSelectionSet(subSelectionSet, objectType, result, variableValues)} *normally* (allowing for parallelization).

+**Coercing Results**
+
+The primary purpose of value completion is to ensure that the values returned by
+field resolvers are valid according to the GraphQL type system and a service's
+schema. This "dynamic type checking" allows GraphQL to provide consistent
+guarantees about returned types atop any service's internal runtime.
+
+See the Scalars [Result Coercion and Serialization](#sec-Scalars.Result-Coercion-and-Serialization)
+sub-section for more detailed information about how GraphQL's built-in scalars
+coerce result values.
+
+CoerceResult(leafType, value):
+  * Assert {value} is not {null}.
+  * Return the result of calling the internal method provided by the type
+    system for determining the "result coercion" of {leafType} given the value
+    {value}. This internal method must return a valid value for the
+    type and not {null}. Otherwise throw a field error.
+
+Note: If a field resolver returns {null} then it is handled within
+{CompleteValue()} before {CoerceResult()} is called. Therefore both the input
+and output of {CoerceResult()} must not be {null}.
+
 **Resolving Abstract Types**

 When completing a field with an abstract return type, that is an Interface or
 Union return type, first the abstract type must be resolved to a relevant Object
 type. This determination is made by the internal system using whatever
 means appropriate.

 Note: A common method of determining the Object type for an {objectValue} in
@@ -675,21 +701,21 @@ the {objectValue}.

 ResolveAbstractType(abstractType, objectValue):
   * Return the result of calling the internal method provided by the type
     system for determining the Object type of {abstractType} given the
     value {objectValue}.

 **Merging Selection Sets**

-When more than one fields of the same name are executed in parallel, their
+When more than one field of the same name is executed in parallel, their
 selection sets are merged together when completing the value in order to
 continue execution of the sub-selection sets.

-An example query illustrating parallel fields with the same name with
+An example operation illustrating parallel fields with the same name with
 sub-selections.

 ```graphql example
 {
   me {
     firstName
   }
   me {
@@ -705,36 +731,44 @@ MergeSelectionSets(fields):
   * Let {selectionSet} be an empty list.
   * For each {field} in {fields}:
     * Let {fieldSelectionSet} be the selection set of {field}.
     * If {fieldSelectionSet} is null or empty, continue to the next field.
     * Append all selections in {fieldSelectionSet} to {selectionSet}.
   * Return {selectionSet}.


-### Errors and Non-Nullability
+### Handling Field Errors
+
+["Field errors"](#sec-Errors.Field-errors) are raised from a particular field
+during value resolution or coercion. While these errors should be reported in
+the response, they are "handled" by producing a partial response.
+
+Note: This is distinct from ["request errors"](#sec-Errors.Request-errors) which
+are raised before execution begins. If a request error is encountered, execution
+does not begin and no data is returned in the response.

-If an error is thrown while resolving a field, it should be treated as though
-the field returned {null}, and an error must be added to the {"errors"} list
-in the response.
+If a field error is raised while resolving a field, it is handled as though the
+field returned {null}, and the error must be added to the {"errors"} list in
+the response.

 If the result of resolving a field is {null} (either because the function to
-resolve the field returned {null} or because an error occurred), and that
-field is of a `Non-Null` type, then a field error is thrown. The
+resolve the field returned {null} or because a field error was raised), and that
+field is of a `Non-Null` type, then a field error is raised. The
 error must be added to the {"errors"} list in the response.

-If the field returns {null} because of an error which has already been added to
-the {"errors"} list in the response, the {"errors"} list must not be
+If the field returns {null} because of a field error which has already been
+added to the {"errors"} list in the response, the {"errors"} list must not be
 further affected. That is, only one error should be added to the errors list per
 field.

 Since `Non-Null` type fields cannot be {null}, field errors are propagated to be
 handled by the parent field. If the parent field may be {null} then it resolves
 to {null}, otherwise if it is a `Non-Null` type, the field error is further
-propagated to it's parent field.
+propagated to its parent field.

 If a `List` type wraps a `Non-Null` type, and one of the elements of that list
 resolves to {null}, then the entire list must resolve to {null}.
 If the `List` type is also wrapped in a `Non-Null`, the field error continues
 to propagate upwards.

 If all fields from the root of the request to the source of the field error
 return `Non-Null` types, then the {"data"} entry in the response should
~~~
</details>

<details>
<summary>spec/Section 7 -- Response.md</summary>

~~~diff
@@ -1,76 +1,98 @@
 # Response

-When a GraphQL server receives a request, it must return a well-formed
-response. The server's response describes the result of executing the requested
-operation if successful, and describes any errors encountered during the
-request.
-
-A response may contain both a partial response as well as encountered errors in
-the case that a field error occurred on a field which was replaced with {null}.
+When a GraphQL service receives a request, it must return a well-formed
+response. The service's response describes the result of executing the requested
+operation if successful, and describes any errors raised during the request.

+A response may contain both a partial response as well as any field errors in
+the case that a field error was raised on a field and was replaced with {null}.

 ## Response Format

-A response to a GraphQL operation must be a map.
+A response to a GraphQL request must be a map.

-If the operation encountered any errors, the response map must contain an
+If the request raised any errors, the response map must contain an
 entry with key `errors`. The value of this entry is described in the "Errors"
-section. If the operation completed without encountering any errors, this entry
+section. If the request completed without raising any errors, this entry
 must not be present.

-If the operation included execution, the response map must contain an entry
+If the request included execution, the response map must contain an entry
 with key `data`. The value of this entry is described in the "Data" section. If
-the operation failed before execution, due to a syntax error, missing
+the request failed before execution, due to a syntax error, missing
 information, or validation error, this entry must not be present.

 The response map may also contain an entry with key `extensions`. This entry,
 if set, must have a map as its value. This entry is reserved for implementors
 to extend the protocol however they see fit, and hence there are no additional
 restrictions on its contents.

-To ensure future changes to the protocol do not break existing servers and
+To ensure future changes to the protocol do not break existing services and
 clients, the top level response map must not contain any entries other than the
 three described above.

 Note: When `errors` is present in the response, it may be helpful for it to
 appear first when serialized to make it more clear when errors are present
 in a response during debugging.

 ### Data

 The `data` entry in the response will be the result of the execution of the
 requested operation. If the operation was a query, this output will be an
-object of the schema's query root type; if the operation was a mutation, this
-output will be an object of the schema's mutation root type.
+object of the query root operation type; if the operation was a
+mutation, this output will be an object of the mutation root operation type.

-If an error was encountered before execution begins, the `data` entry should
+If an error was raised before execution begins, the `data` entry should
 not be present in the result.

-If an error was encountered during the execution that prevented a valid
+If an error was raised during the execution that prevented a valid
 response, the `data` entry in the response should be `null`.


 ### Errors

 The `errors` entry in the response is a non-empty list of errors, where each
 error is a map.

-If no errors were encountered during the requested operation, the `errors`
-entry should not be present in the result.
+If no errors were raised during the request, the `errors` entry should
+not be present in the result.

 If the `data` entry in the response is not present, the `errors`
 entry in the response must not be empty. It must contain at least one error.
 The errors it contains should indicate why no data was able to be returned.

 If the `data` entry in the response is present (including if it is the value
-{null}), the `errors` entry in the response may contain any errors that
-occurred during execution. If errors occurred during execution, it should
-contain those errors.
+{null}), the `errors` entry in the response may contain any field errors that
+were raised during execution. If field errors were raised during execution, it
+should contain those errors.
+
+**Request errors**
+
+Request errors are raised before execution begins. This may occur due to a parse
+grammar or validation error in the requested document, an inability to determine
+which operation to execute, or invalid input values for variables.
+
+Request errors are typically the fault of the requesting client.
+
+If a request error is raised, execution does not begin and the `data` entry in
+the response must not be present. The `errors` entry must include the error.
+
+**Field errors**
+
+Field errors are raised during execution from a particular field. This may occur
+due to an internal error during value resolution or failure to coerce the
+resulting value.
+
+Field errors are typically the fault of GraphQL service.
+
+If a field error is raised, execution attempts to continue and a partial result
+is produced (see [Handling Field Errors](#sec-Handling-Field-Errors)).
+The `data` entry in the response must be present. The `errors` entry should
+include all raised field errors.

 **Error result format**

 Every error must contain an entry with the key `message` with a string
 description of the error intended for the developer as a guide to understand
 and correct the error.

 If an error can be associated to a particular point in the requested GraphQL
@@ -84,20 +106,20 @@ must contain an entry with the key `path` that details the path of the
 response field which experienced the error. This allows clients to identify
 whether a `null` result is intentional or caused by a runtime error.

 This field should be a list of path segments starting at the root of the
 response and ending with the field associated with the error. Path segments
 that represent fields should be strings, and path segments that
 represent list indices should be 0-indexed integers. If the error happens
 in an aliased field, the path to the error should use the aliased name, since
-it represents a path in the response, not in the query.
+it represents a path in the response, not in the request.

 For example, if fetching one of the friends' names fails in the following
-query:
+operation:

 ```graphql example
 {
   hero(episode: $episode) {
     name
     heroFriends: friends {
       id
       name
@@ -108,18 +130,18 @@ query:

 The response might look like:

 ```json example
 {
   "errors": [
     {
       "message": "Name for character with ID 1002 could not be fetched.",
-      "locations": [ { "line": 6, "column": 7 } ],
-      "path": [ "hero", "heroFriends", 1, "name" ]
+      "locations": [{ "line": 6, "column": 7 }],
+      "path": ["hero", "heroFriends", 1, "name"]
     }
   ],
   "data": {
     "hero": {
       "name": "R2-D2",
       "heroFriends": [
         {
           "id": "1000",
@@ -137,29 +159,29 @@ The response might look like:
     }
   }
 }
 ```

 If the field which experienced an error was declared as `Non-Null`, the `null`
 result will bubble up to the next nullable field. In that case, the `path`
 for the error should include the full path to the result field where the error
-occurred, even if that field is not present in the response.
+was raised, even if that field is not present in the response.

 For example, if the `name` field from above had declared a `Non-Null` return
 type in the schema, the result would look different but the error reported would
 be the same:

 ```json example
 {
   "errors": [
     {
       "message": "Name for character with ID 1002 could not be fetched.",
-      "locations": [ { "line": 6, "column": 7 } ],
-      "path": [ "hero", "heroFriends", 1, "name" ]
+      "locations": [{ "line": 6, "column": 7 }],
+      "path": ["hero", "heroFriends", 1, "name"]
     }
   ],
   "data": {
     "hero": {
       "name": "R2-D2",
       "heroFriends": [
         {
           "id": "1000",
@@ -181,18 +203,18 @@ This entry, if set, must have a map as its value. This entry is reserved for
 implementors to add additional information to errors however they see fit, and
 there are no additional restrictions on its contents.

 ```json example
 {
   "errors": [
     {
       "message": "Name for character with ID 1002 could not be fetched.",
-      "locations": [ { "line": 6, "column": 7 } ],
-      "path": [ "hero", "heroFriends", 1, "name" ],
+      "locations": [{ "line": 6, "column": 7 }],
+      "path": ["hero", "heroFriends", 1, "name"],
       "extensions": {
         "code": "CAN_NOT_FETCH_BY_ID",
         "timestamp": "Fri Feb 9 14:33:09 UTC 2018"
       }
     }
   ]
 }
 ```
@@ -205,18 +227,18 @@ Note: Previous versions of this spec did not describe the `extensions` entry
 for error formatting. While non-specified entries are not violations, they are
 still discouraged.

 ```json counter-example
 {
   "errors": [
     {
       "message": "Name for character with ID 1002 could not be fetched.",
-      "locations": [ { "line": 6, "column": 7 } ],
-      "path": [ "hero", "heroFriends", 1, "name" ],
+      "locations": [{ "line": 6, "column": 7 }],
+      "path": ["hero", "heroFriends", 1, "name"],
       "code": "CAN_NOT_FETCH_BY_ID",
       "timestamp": "Fri Feb 9 14:33:09 UTC 2018"
     }
   ]
 }
 ```


@@ -269,18 +291,18 @@ values should be used to encode the related GraphQL values:
 Note: For consistency and ease of notation, examples of responses are given in
 JSON format throughout this document.


 ### Serialized Map Ordering

 Since the result of evaluating a selection set is ordered, the serialized Map of
 results should preserve this order by writing the map entries in the same order
-as those fields were requested as defined by query execution. Producing a
-serialized response where fields are represented in the same order in which
+as those fields were requested as defined by selection set execution. Producing
+a serialized response where fields are represented in the same order in which
 they appear in the request improves human readability during debugging and
 enables more efficient parsing of responses if the order of properties can
 be anticipated.

 Serialization formats which represent an ordered map should preserve the
 order of requested fields as defined by {CollectFields()} in the Execution
 section. Serialization formats which only represent unordered maps but where
 order is still implicit in the serialization's textual order (such as JSON)
~~~
</details>

<details>
<summary>spec/Appendix A -- Notation Conventions.md</summary>

~~~diff
@@ -17,119 +17,133 @@ its right-hand side.

 Starting from a single goal non-terminal symbol, a context-free grammar
 describes a language: the set of possible sequences of characters that can be
 described by repeatedly replacing any non-terminal in the goal sequence with one
 of the sequences it is defined by, until all non-terminal symbols have been
 replaced by terminal characters.

 Terminals are represented in this document in a monospace font in two forms: a
-specific Unicode character or sequence of Unicode characters (ex. {`=`} or {`terminal`}), and a pattern of Unicode characters defined by a regular expression
-(ex {/[0-9]+/}).
+specific Unicode character or sequence of Unicode characters (ie. {`=`} or
+{`terminal`}), and prose typically describing a specific Unicode code-point
+{"Space (U+0020)"}. Sequences of Unicode characters only appear in syntactic
+grammars and represent a {Name} token of that specific sequence.

 Non-terminal production rules are represented in this document using the
 following notation for a non-terminal with a single definition:

 NonTerminalWithSingleDefinition : NonTerminal `terminal`

 While using the following notation for a production with a list of definitions:

 NonTerminalWithManyDefinitions :
   - OtherNonTerminal `terminal`
   - `terminal`

 A definition may refer to itself, which describes repetitive sequences,
 for example:

 ListOfLetterA :
-  - `a`
   - ListOfLetterA `a`
+  - `a`


 ## Lexical and Syntactical Grammar

 The GraphQL language is defined in a syntactic grammar where terminal symbols
 are tokens. Tokens are defined in a lexical grammar which matches patterns of
-source characters. The result of parsing a sequence of source Unicode characters
-produces a GraphQL AST.
+source characters. The result of parsing a source text sequence of Unicode
+characters first produces a sequence of lexical tokens according to the lexical
+grammar which then produces abstract syntax tree (AST) according to the
+syntactical grammar.

-A Lexical grammar production describes non-terminal "tokens" by
+A lexical grammar production describes non-terminal "tokens" by
 patterns of terminal Unicode characters. No "whitespace" or other ignored
 characters may appear between any terminal Unicode characters in the lexical
 grammar production. A lexical grammar production is distinguished by a two colon
 `::` definition.

-Word :: /[A-Za-z]+/
+Word :: Letter+

 A Syntactical grammar production describes non-terminal "rules" by patterns of
-terminal Tokens. Whitespace and other ignored characters may appear before or
-after any terminal Token. A syntactical grammar production is distinguished by a
-one colon `:` definition.
+terminal Tokens. {WhiteSpace} and other {Ignored} sequences may appear before or
+after any terminal {Token}. A syntactical grammar production is distinguished by
+a one colon `:` definition.

-Sentence : Noun Verb
+Sentence : Word+ `.`


 ## Grammar Notation

 This specification uses some additional notation to describe common patterns,
 such as optional or repeated patterns, or parameterized alterations of the
 definition of a non-terminal. This section explains these short-hand notations
 and their expanded definitions in the context-free grammar.


 **Constraints**

 A grammar production may specify that certain expansions are not permitted by
 using the phrase "but not" and then indicating the expansions to be excluded.

-For example, the production:
-
-SafeName : Name but not SevenCarlinWords
+For example, the following production means that the non-terminal {SafeWord} may
+be replaced by any sequence of characters that could replace {Word} provided
+that the same sequence of characters could not replace {SevenCarlinWords}.

-means that the nonterminal {SafeName} may be replaced by any sequence of
-characters that could replace {Name} provided that the same sequence of
-characters could not replace {SevenCarlinWords}.
+SafeWord : Word but not SevenCarlinWords

 A grammar may also list a number of restrictions after "but not" separated
 by "or".

 For example:

 NonBooleanName : Name but not `true` or `false`


+**Lookahead Restrictions**
+
+A grammar production may specify that certain characters or tokens are not
+permitted to follow it by using the pattern {[lookahead != NotAllowed]}.
+Lookahead restrictions are often used to remove ambiguity from the grammar.
+
+The following example makes it clear that {Letter+} must be greedy, since {Word}
+cannot be followed by yet another {Letter}.
+
+Word :: Letter+ [lookahead != Letter]
+
+
 **Optionality and Lists**

 A subscript suffix "{Symbol?}" is shorthand for two possible sequences, one
 including that symbol and one excluding it.

 As an example:

 Sentence : Noun Verb Adverb?

 is shorthand for

 Sentence :
-  - Noun Verb
   - Noun Verb Adverb
+  - Noun Verb

-A subscript suffix "{Symbol+}" is shorthand for a list of
-one or more of that symbol.
+A subscript suffix "{Symbol+}" is shorthand for a list of one or more of that
+symbol, represented as an additional recursive production.

 As an example:

 Book : Cover Page+ Cover

 is shorthand for

 Book : Cover Page_list Cover

 Page_list :
-  - Page
   - Page_list Page
+  - Page


 **Parameterized Grammar Productions**

 A symbol definition subscript suffix parameter in braces "{Symbol[Param]}"
 is shorthand for two symbol definitions, one appended with that parameter name,
 the other without. The same subscript suffix on a symbol is shorthand for that
 variant of the definition. If the parameter starts with "?", that
@@ -182,19 +196,19 @@ StringValue :: `"` StringCharacter+ `"`

 This specification describes some algorithms used by the static and runtime
 semantics, they're defined in the form of a function-like syntax with the
 algorithm's name and the arguments it accepts along with a list of algorithmic
 steps to take in the order listed. Each step may establish references to other
 values, check various conditions, call other algorithms, and eventually return
 a value representing the outcome of the algorithm for the provided arguments.

-For example, the following example describes an algorithm named {Fibonacci} which
-accepts a single argument {number}. The algoritm's steps produce the next number
-in the Fibonacci sequence:
+For example, the following example describes an algorithm named {Fibonacci}
+which accepts a single argument {number}. The algorithm's steps produce the next
+number in the Fibonacci sequence:

 Fibonacci(number):
   * If {number} is {0}:
     * Return {1}.
   * If {number} is {1}:
     * Return {2}.
   * Let {previousNumber} be {number} - {1}.
   * Let {previousPreviousNumber} be {number} - {2}.
~~~
</details>

<details>
<summary>spec/Appendix B -- Grammar Summary.md</summary>

~~~diff
@@ -1,11 +1,17 @@
 # B. Appendix: Grammar Summary

-SourceCharacter :: /[\u0009\u000A\u000D\u0020-\uFFFF]/
+## Source Text
+
+SourceCharacter ::
+  - "U+0009"
+  - "U+000A"
+  - "U+000D"
+  - "U+0020–U+FFFF"


 ## Ignored Tokens

 Ignored ::
   - UnicodeBOM
   - WhiteSpace
   - LineTerminator
@@ -15,103 +21,122 @@ Ignored ::
 UnicodeBOM :: "Byte Order Mark (U+FEFF)"

 WhiteSpace ::
   - "Horizontal Tab (U+0009)"
   - "Space (U+0020)"

 LineTerminator ::
   - "New Line (U+000A)"
-  - "Carriage Return (U+000D)" [ lookahead ! "New Line (U+000A)" ]
+  - "Carriage Return (U+000D)" [lookahead != "New Line (U+000A)"]
   - "Carriage Return (U+000D)" "New Line (U+000A)"

-Comment :: `#` CommentChar*
+Comment :: `#` CommentChar* [lookahead != CommentChar]

 CommentChar :: SourceCharacter but not LineTerminator

 Comma :: ,


 ## Lexical Tokens

 Token ::
   - Punctuator
   - Name
   - IntValue
   - FloatValue
   - StringValue

-Punctuator :: one of ! $ ( ) ... : = @ [ ] { | }
+Punctuator :: one of ! $ & ( ) ... : = @ [ ] { | }
+
+Name ::
+  - NameStart NameContinue* [lookahead != NameContinue]
+
+NameStart ::
+  - Letter
+  - `_`

-Name :: /[_A-Za-z][_0-9A-Za-z]*/
+NameContinue ::
+  - Letter
+  - Digit
+  - `_`

-IntValue :: IntegerPart
+Letter :: one of
+  - `A` `B` `C` `D` `E` `F` `G` `H` `I` `J` `K` `L` `M`
+  - `N` `O` `P` `Q` `R` `S` `T` `U` `V` `W` `X` `Y` `Z`
+  - `a` `b` `c` `d` `e` `f` `g` `h` `i` `j` `k` `l` `m`
+  - `n` `o` `p` `q` `r` `s` `t` `u` `v` `w` `x` `y` `z`
+
+Digit :: one of
+  - `0` `1` `2` `3` `4` `5` `6` `7` `8` `9`
+
+IntValue :: IntegerPart [lookahead != {Digit, `.`, NameStart}]

 IntegerPart ::
   - NegativeSign? 0
   - NegativeSign? NonZeroDigit Digit*

 NegativeSign :: -

-Digit :: one of 0 1 2 3 4 5 6 7 8 9
-
 NonZeroDigit :: Digit but not `0`

 FloatValue ::
-  - IntegerPart FractionalPart
-  - IntegerPart ExponentPart
-  - IntegerPart FractionalPart ExponentPart
+  - IntegerPart FractionalPart ExponentPart [lookahead != {Digit, `.`, NameStart}]
+  - IntegerPart FractionalPart [lookahead != {Digit, `.`, NameStart}]
+  - IntegerPart ExponentPart [lookahead != {Digit, `.`, NameStart}]

 FractionalPart :: . Digit+

 ExponentPart :: ExponentIndicator Sign? Digit+

 ExponentIndicator :: one of `e` `E`

 Sign :: one of + -

 StringValue ::
-  - `"` StringCharacter* `"`
+  - `""` [lookahead != `"`]
+  - `"` StringCharacter+ `"`
   - `"""` BlockStringCharacter* `"""`

 StringCharacter ::
-  - SourceCharacter but not `"` or \ or LineTerminator
-  - \u EscapedUnicode
-  - \ EscapedCharacter
+  - SourceCharacter but not `"` or `\` or LineTerminator
+  - `\u` EscapedUnicode
+  - `\` EscapedCharacter

 EscapedUnicode :: /[0-9A-Fa-f]{4}/

-EscapedCharacter :: one of `"` \ `/` b f n r t
+EscapedCharacter :: one of `"` `\` `/` `b` `f` `n` `r` `t`

 BlockStringCharacter ::
   - SourceCharacter but not `"""` or `\"""`
   - `\"""`

 Note: Block string values are interpreted to exclude blank initial and trailing
 lines and uniform indentation with {BlockStringValue()}.


-## Document
+## Document Syntax

 Document : Definition+

 Definition :
   - ExecutableDefinition
-  - TypeSystemDefinition
-  - TypeSystemExtension
+  - TypeSystemDefinitionOrExtension
+
+ExecutableDocument : ExecutableDefinition+

 ExecutableDefinition :
   - OperationDefinition
   - FragmentDefinition

 OperationDefinition :
-  - SelectionSet
   - OperationType Name? VariableDefinitions? Directives? SelectionSet
+  - SelectionSet

-OperationType : one of query mutation subscription
+OperationType : one of `query` `mutation` `subscription`

 SelectionSet : { Selection+ }

 Selection :
   - Field
   - FragmentSpread
   - InlineFragment

@@ -157,17 +182,17 @@ ListValue[Const] :
 ObjectValue[Const] :
   - { }
   - { ObjectField[?Const]+ }

 ObjectField[Const] : Name : Value[?Const]

 VariableDefinitions : ( VariableDefinition+ )

-VariableDefinition : Variable : Type DefaultValue?
+VariableDefinition : Variable : Type DefaultValue? Directives[Const]?

 Variable : $ Name

 DefaultValue : = Value[Const]

 Type :
   - NamedType
   - ListType
@@ -180,32 +205,40 @@ ListType : [ Type ]
 NonNullType :
   - NamedType !
   - ListType !

 Directives[Const] : Directive[?Const]+

 Directive[Const] : @ Name Arguments[?Const]?

+TypeSystemDocument : TypeSystemDefinition+
+
 TypeSystemDefinition :
   - SchemaDefinition
   - TypeDefinition
   - DirectiveDefinition

+TypeSystemExtensionDocument : TypeSystemDefinitionOrExtension+
+
+TypeSystemDefinitionOrExtension :
+  - TypeSystemDefinition
+  - TypeSystemExtension
+
 TypeSystemExtension :
   - SchemaExtension
   - TypeExtension

-SchemaDefinition : schema Directives[Const]? { OperationTypeDefinition+ }
+SchemaDefinition : Description? schema Directives[Const]? { RootOperationTypeDefinition+ }

 SchemaExtension :
-  - extend schema Directives[Const]? { OperationTypeDefinition+ }
-  - extend schema Directives[Const]
+  - extend schema Directives[Const]? { RootOperationTypeDefinition+ }
+  - extend schema Directives[Const] [lookahead != `{`]

-OperationTypeDefinition : OperationType : NamedType
+RootOperationTypeDefinition : OperationType : NamedType

 Description : StringValue

 TypeDefinition :
   - ScalarTypeDefinition
   - ObjectTypeDefinition
   - InterfaceTypeDefinition
   - UnionTypeDefinition
@@ -220,92 +253,102 @@ TypeExtension :
   - EnumTypeExtension
   - InputObjectTypeExtension

 ScalarTypeDefinition : Description? scalar Name Directives[Const]?

 ScalarTypeExtension :
   - extend scalar Name Directives[Const]

-ObjectTypeDefinition : Description? type Name ImplementsInterfaces? Directives[Const]? FieldsDefinition?
+ObjectTypeDefinition :
+  - Description? type Name ImplementsInterfaces? Directives[Const]? FieldsDefinition
+  - Description? type Name ImplementsInterfaces? Directives[Const]? [lookahead != `{`]

 ObjectTypeExtension :
   - extend type Name ImplementsInterfaces? Directives[Const]? FieldsDefinition
-  - extend type Name ImplementsInterfaces? Directives[Const]
-  - extend type Name ImplementsInterfaces
+  - extend type Name ImplementsInterfaces? Directives[Const] [lookahead != `{`]
+  - extend type Name ImplementsInterfaces [lookahead != `{`]

 ImplementsInterfaces :
-  - implements `&`? NamedType
   - ImplementsInterfaces & NamedType
+  - implements `&`? NamedType

 FieldsDefinition : { FieldDefinition+ }

 FieldDefinition : Description? Name ArgumentsDefinition? : Type Directives[Const]?

 ArgumentsDefinition : ( InputValueDefinition+ )

 InputValueDefinition : Description? Name : Type DefaultValue? Directives[Const]?

-InterfaceTypeDefinition : Description? interface Name Directives[Const]? FieldsDefinition?
+InterfaceTypeDefinition :
+  - Description? interface Name ImplementsInterfaces? Directives[Const]? FieldsDefinition
+  - Description? interface Name ImplementsInterfaces? Directives[Const]? [lookahead != `{`]

 InterfaceTypeExtension :
-  - extend interface Name Directives[Const]? FieldsDefinition
-  - extend interface Name Directives[Const]
+  - extend interface Name ImplementsInterfaces? Directives[Const]? FieldsDefinition
+  - extend interface Name ImplementsInterfaces? Directives[Const] [lookahead != `{`]
+  - extend interface Name ImplementsInterfaces [lookahead != `{`]

 UnionTypeDefinition : Description? union Name Directives[Const]? UnionMemberTypes?

 UnionMemberTypes :
-  - = `|`? NamedType
   - UnionMemberTypes | NamedType
+  - = `|`? NamedType

 UnionTypeExtension :
   - extend union Name Directives[Const]? UnionMemberTypes
   - extend union Name Directives[Const]

-EnumTypeDefinition : Description? enum Name Directives[Const]? EnumValuesDefinition?
+EnumTypeDefinition :
+  - Description? enum Name Directives[Const]? EnumValuesDefinition
+  - Description? enum Name Directives[Const]? [lookahead != `{`]

 EnumValuesDefinition : { EnumValueDefinition+ }

 EnumValueDefinition : Description? EnumValue Directives[Const]?

 EnumTypeExtension :
   - extend enum Name Directives[Const]? EnumValuesDefinition
-  - extend enum Name Directives[Const]
+  - extend enum Name Directives[Const] [lookahead != `{`]

-InputObjectTypeDefinition : Description? input Name Directives[Const]? InputFieldsDefinition?
+InputObjectTypeDefinition :
+  - Description? input Name Directives[Const]? InputFieldsDefinition
+  - Description? input Name Directives[Const]? [lookahead != `{`]

 InputFieldsDefinition : { InputValueDefinition+ }

 InputObjectTypeExtension :
   - extend input Name Directives[Const]? InputFieldsDefinition
-  - extend input Name Directives[Const]
+  - extend input Name Directives[Const] [lookahead != `{`]

-DirectiveDefinition : Description? directive @ Name ArgumentsDefinition? on DirectiveLocations
+DirectiveDefinition : Description? directive @ Name ArgumentsDefinition? `repeatable`? on DirectiveLocations

 DirectiveLocations :
-  - `|`? DirectiveLocation
   - DirectiveLocations | DirectiveLocation
+  - `|`? DirectiveLocation

 DirectiveLocation :
   - ExecutableDirectiveLocation
   - TypeSystemDirectiveLocation

 ExecutableDirectiveLocation : one of
-  `QUERY`
-  `MUTATION`
-  `SUBSCRIPTION`
-  `FIELD`
-  `FRAGMENT_DEFINITION`
-  `FRAGMENT_SPREAD`
-  `INLINE_FRAGMENT`
+  - `QUERY`
+  - `MUTATION`
+  - `SUBSCRIPTION`
+  - `FIELD`
+  - `FRAGMENT_DEFINITION`
+  - `FRAGMENT_SPREAD`
+  - `INLINE_FRAGMENT`
+  - `VARIABLE_DEFINITION`

 TypeSystemDirectiveLocation : one of
-  `SCHEMA`
-  `SCALAR`
-  `OBJECT`
-  `FIELD_DEFINITION`
-  `ARGUMENT_DEFINITION`
-  `INTERFACE`
-  `UNION`
-  `ENUM`
-  `ENUM_VALUE`
-  `INPUT_OBJECT`
-  `INPUT_FIELD_DEFINITION`
+  - `SCHEMA`
+  - `SCALAR`
+  - `OBJECT`
+  - `FIELD_DEFINITION`
+  - `ARGUMENT_DEFINITION`
+  - `INTERFACE`
+  - `UNION`
+  - `ENUM`
+  - `ENUM_VALUE`
+  - `INPUT_OBJECT`
+  - `INPUT_FIELD_DEFINITION`
~~~


Generated with:

```sh
git diff June2018..HEAD --minimal -U8 -- spec
```
