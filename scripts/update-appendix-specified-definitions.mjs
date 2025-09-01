import prettier from "prettier";
import { writeFile } from "node:fs/promises";
import {
  printIntrospectionSchema,
  buildSchema,
  specifiedScalarTypes,
  printType,
  parse,
  print,
  visit,
  Kind
} from "graphql";

function stripDescriptions(sdl) {
  const ast = parse(sdl);
  const noDescAst = visit(ast, {
    enter: (node) => {
      // Not in spec yet
      if (node.name?.value === "FRAGMENT_VARIABLE_DEFINITION") {
        return null
      }
    },
    leave: (node) => ({ ...node, description: undefined })
  });
  return print(noDescAst);
}

function printSpecifiedScalars() {
  return specifiedScalarTypes
    .map((type) => stripDescriptions(printType(type)))
    .join("\n\n");
}

const introspectionSchema = stripDescriptions(
  printIntrospectionSchema(buildSchema(`type Query { i: Int }`))
);

const allSpecifiedTypesSDL = prettier
  .format(printSpecifiedScalars() + "\n\n" + introspectionSchema, {
    parser: "graphql"
  })
  .trimEnd();

await writeFile(
  "./spec/Appendix D -- Specified Definitions.md",
  `# D. Appendix: Type System Definitions

This appendix lists all type system definitions specified in this document.

The order of types, fields, arguments, values and directives is non-normative.

\`\`\`graphql
${allSpecifiedTypesSDL}
\`\`\`
`
);
