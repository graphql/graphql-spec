import { readFile, readdir } from "node:fs/promises";

const SPEC_DIR = new URL("../spec", import.meta.url).pathname;

process.exitCode = 0;
const filenames = await readdir(SPEC_DIR);
for (const filename of filenames) {
  if (!filename.endsWith(".md")) {
    continue;
  }
  const markdown = await readFile(`${SPEC_DIR}/${filename}`, "utf8");

  /**
   * Not strictly 'lines' since we try and group indented things together as if
   * they were one line. Close enough though.
   */
  const lines = markdown.split(/\n(?=[\S\n]|\s*(?:-|[0-9]+\.) )/);

  for (let i = 0, l = lines.length; i < l; i++) {
    const line = lines[i];

    // Check algorithm is consistently formatted
    {
      // Is it an algorithm definition?
      const matches = line.match(/^([a-z0-9A-Z]+)(\s*)\(([^)]*)\)(\s*):(\s*)$/);
      if (matches) {
        const [, algorithmName, ns1, _args, ns2, ns3] = matches;
        if (ns1 || ns2 || ns3) {
          console.log(
            `Bad whitespace in definition of ${algorithmName} in '${filename}':`
          );
          console.log(line);
          console.log();
          process.exitCode = 1;
        }
        if (lines[i + 1] !== "") {
          console.log(
            `No empty space after algorithm ${algorithmName} header in '${filename}'`
          );
          console.log();
          process.exitCode = 1;
        }
        for (let j = i + 2; j < l; j++) {
          const step = lines[j];
          if (!step.match(/^\s*(-|[0-9]+\.) /)) {
            if (step !== "") {
              console.log(
                `Bad algorithm ${algorithmName} step in '${filename}':`
              );
              console.log(step);
              console.log();
              process.exitCode = 1;
            }
            break;
          }
          if (!step.match(/[.:]$/)) {
            console.log(
              `Bad formatting for '${algorithmName}' step (does not end in '.' or ':') in '${filename}':`
            );
            console.log(step);
            console.log();
            process.exitCode = 1;
          }
          if (step.match(/^\s*(-|[0-9]\.)\s+[a-z]/)) {
            console.log(
              `Bad formatting of '${algorithmName}' step (should start with a capital) in '${filename}':`
            );
            console.log(step);
            console.log();
            process.exitCode = 1;
          }
          const trimmedInnerLine = step.replace(/\s+/g, " ");
          if (
            trimmedInnerLine.match(
              /(?:[rR]eturn|is (?:not )?)(true|false|null)\b/
            ) &&
            !trimmedInnerLine.match(/null or empty/)
          ) {
            console.log(
              `Potential bad formatting of '${algorithmName}' step (true/false/null should be wrapped in curly braces, e.g. '{true}') in '${filename}':`
            );
            console.log(step);
            console.log();
            process.exitCode = 1;
          }
        }
      }
    }

    // Check `- ...:` step is followed by an indent
    {
      const matches = line.match(/^(\s*)- .*:\s*$/);
      if (matches) {
        const indent = matches[1];
        const nextLine = lines[i + 1];
        if (!nextLine.startsWith(`${indent}  `)) {
          console.log(
            `Lacking indent in '${filename}' following ':' character:`
          );
          console.dir(line);
          console.dir(nextLine);
          console.log();
          // TODO: process.exitCode = 1;
        }
      }
    }
  }
}

if (process.exitCode === 0) {
  console.log(`Everything looks okay!`);
} else {
  console.log(`Please resolve the errors detailed above.`);
}
