/** @type {import('dependency-cruiser').IConfiguration} */
module.exports = {
  forbidden: [
    {
      name: "no-circular",
      severity: "error",
      from: {},
      to: { circular: true },
    },
    {
      name: "core-not-to-entry",
      comment: "Core must not depend on the entry or command layers.",
      severity: "error",
      from: { path: "^src/", pathNot: "^src/(cli\\.ts|commands/)" },
      to: { path: "^src/(cli\\.ts|commands/)" },
    },
    {
      name: "core-not-to-terminal",
      comment: "Only the entry and command layers talk to the terminal.",
      severity: "error",
      from: { path: "^src/", pathNot: "^src/(cli\\.ts|commands/)" },
      to: { path: "node_modules/(@clack/prompts|prompts|inquirer|@inquirer/[^/]+|chalk|picocolors|ora|commander|yargs)/" },
    },
    {
      name: "commands-independent",
      severity: "error",
      from: { path: "^src/commands/([^/]+)" },
      to: { path: "^src/commands/", pathNot: "^src/commands/$1" },
    },
  ],
  options: {
    doNotFollow: { path: "node_modules" },
    tsPreCompilationDeps: true,
    tsConfig: { fileName: "tsconfig.json" },
  },
};
