// Prototype pure-js implementation
// git.mjs -- push all changes to Git
// Usage: `node git.mjs`

  // Bootstrap
  if (import.meta?.url?.endsWith(process.argv[1])) {
    await main()
  }

  