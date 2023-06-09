// URLConverter.test.js
import test from 'node:test';
import URLConverter from './URLConverter.js';

test('convert GitHub subfolder URL to git CLI URL', (t) => {
  const converter = new URLConverter('https://github.com/vitejs/vite/tree/main/packages/create-vite/template-vanilla-ts');
  const expectedOutput = 'git://github.com/vitejs/vite.git#main:packages/create-vite/template-vanilla-ts';
  const actualOutput = converter.convertToGitCLIUrl();
  t.strictEqual(actualOutput, expectedOutput);
});

test('convert GitHub pull request URL to git CLI URL', (t) => {
  const converter = new URLConverter('https://github.com/marshallswain/feathers-pinia/pull/132');
  const expectedOutput = 'git://github.com/marshallswain/feathers-pinia.git#pull/132/head';
  const actualOutput = converter.convertToGitCLIUrl();
  t.strictEqual(actualOutput, expectedOutput);
});

// More tests for the other URLs...
