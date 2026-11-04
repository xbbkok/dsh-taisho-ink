/**
 * Offline checks for dsh-taisho-ink.
 *
 * No GUI, no network, no dependencies: the browser half is a plain script, so
 * the checks compile it and assert its shape, then validate the manifest, the
 * patch row, the locale metadata and the artwork. A final redaction pass makes
 * sure no local path or credential-shaped string can be published by accident.
 *
 *   npm test
 */

import { readFileSync, readdirSync, statSync, existsSync } from 'node:fs'
import { join, dirname, relative } from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'
import assert from 'node:assert/strict'

const here = dirname(fileURLToPath(import.meta.url))
const root = dirname(here)
const read = (path) => readFileSync(join(root, path), 'utf8')

let checks = 0
let failures = 0

function check(title, fn) {
  checks += 1
  try {
    fn()
    console.log(`  ok   ${title}`)
  } catch (error) {
    failures += 1
    console.log(`  FAIL ${title}`)
    console.log(`       ${error && error.message ? error.message : error}`)
  }
}

function section(title) {
  console.log(`\n${title}`)
}

// ---------------------------------------------------------------------------
// 1. Manifest
// ---------------------------------------------------------------------------

section('manifest')
const pkg = JSON.parse(read('package.json'))

check('package name and version are publishable', () => {
  assert.equal(pkg.name, 'dsh-taisho-ink')
  assert.match(pkg.version, /^\d+\.\d+\.\d+$/)
  assert.equal(pkg.license, 'MIT')
  assert.equal(pkg.type, 'module')
  assert.equal(pkg.main, 'lib/index.js')
})

check('declares the bundle patch and the web client', () => {
  assert.equal(pkg.dsh.bundle.patch, './cordis.patch.yml')
  assert.equal(pkg.dsh.client.platform, 'web')
  assert.ok(Array.isArray(pkg.dsh.client.inject))
})

check('exports the browser half and the display resources', () => {
  assert.equal(pkg.exports['./client'], './lib/client.js')
  assert.equal(pkg.exports['./icon'], './icon.svg')
  assert.ok(pkg.exports['./locale/*.json'])
})

check('every shipped file exists', () => {
  const shipped = ['lib/index.js', 'lib/client.js', 'cordis.patch.yml', 'icon.svg',
    'locale/en.json', 'locale/zh.json', 'README.md', 'README.zh.md', 'CHANGELOG.md', 'LICENSE']
  for (const file of shipped) assert.ok(existsSync(join(root, file)), `missing ${file}`)
})

// ---------------------------------------------------------------------------
// 2. Loader patch
// ---------------------------------------------------------------------------

section('loader patch')
const patch = read('cordis.patch.yml')

check('inserts exactly one row named after the package', () => {
  const body = patch
    .split('\n')
    .filter((line) => !line.trim().startsWith('#'))
    .join('\n')
  assert.match(body, /- insert:/)
  assert.match(body, /- id: dsh-taisho-ink/)
  assert.match(body, /name: 'dsh-taisho-ink'/)
  assert.equal((body.match(/id: dsh-taisho-ink/g) || []).length, 1)
})

// ---------------------------------------------------------------------------
// 3. Display metadata
// ---------------------------------------------------------------------------

section('display metadata')

for (const locale of ['en', 'zh']) {
  check(`locale/${locale}.json carries a title and a description`, () => {
    const dict = JSON.parse(read(`locale/${locale}.json`))
    assert.ok(dict.meta && dict.meta.title && dict.meta.description)
    assert.ok(dict.meta.title.length <= 60)
    assert.ok(dict.meta.description.length <= 220)
  })
}

check('the icon is a bounded SVG', () => {
  const icon = read('icon.svg')
  assert.match(icon, /^<svg[\s>]/)
  assert.match(icon, /viewBox="0 0 64 64"/)
  assert.ok(Buffer.byteLength(icon) < 256 * 1024)
})

check('the palette card is an SVG', () => {
  assert.match(read('docs/palette.svg'), /^<svg[\s>]/)
})

section('documentation assets')

check('the animated preview ships as a valid GIF', () => {
  const gif = readFileSync(join(root, 'docs', 'ambience.gif'))
  assert.equal(gif.subarray(0, 6).toString('ascii'), 'GIF89a')
  assert.ok(gif.length > 100 * 1024, 'the preview looks empty')
  assert.ok(gif.length < 5 * 1024 * 1024, 'the preview is too large for a README')
})

check('the preview stage reuses the plugin particle rules', () => {
  const html = read('docs/preview.html')
  assert.match(html, /ti-ember/)
  assert.match(html, /ti-petal/)
  assert.ok(!html.includes('data:image'))
})

// ---------------------------------------------------------------------------
// 4. Host half
// ---------------------------------------------------------------------------

section('host half')

const host = await import(pathToFileURL(join(root, 'lib', 'index.js')).href)

check('exports an apply function and registers nothing else', () => {
  assert.equal(typeof host.apply, 'function')
  assert.deepEqual(Object.keys(host).sort(), ['apply'])
})

// ---------------------------------------------------------------------------
// 5. Browser half
// ---------------------------------------------------------------------------

section('browser half')
const client = read('lib/client.js')

check('parses as a classic script', () => {
  // Compiling without invoking catches syntax errors in the bundle.
  new Function(client)
})

check('registers the package id and a factory', () => {
  assert.match(client, /id:\s*'dsh-taisho-ink'/)
  assert.match(client, /factory\(require\)\s*\{/)
})

check('registers the token layer and both slot entries', () => {
  assert.match(client, /ctx\.theme\.overrideTokens\(PACKAGE, TOKENS\)/)
  assert.match(client, /'shell\.overlay', id: 'dsh-taisho-ink\.atmosphere'/)
  assert.match(client, /'conversation\.hero\.brand\.mark'/)
})

check('ships no binary payload and performs no network access', () => {
  assert.ok(!client.includes('data:image'))
  assert.ok(!/\bfetch\s*\(/.test(client))
  assert.ok(!client.includes('XMLHttpRequest'))
  assert.ok(!client.includes('WebSocket'))
})

check('declares every palette pair', () => {
  const names = client.match(/--dsw-[a-z0-9-]+/g) || []
  assert.equal(new Set(names).size, 14)
  assert.equal((client.match(/\{ light: '/g) || []).length, 14)
})

// ---------------------------------------------------------------------------
// 6. Redaction: nothing personal or secret may reach the public repository
// ---------------------------------------------------------------------------

section('redaction')

function walk(dir, out) {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    if (entry.name === '.git' || entry.name === 'node_modules') continue
    const full = join(dir, entry.name)
    if (entry.isDirectory()) walk(full, out)
    else out.push(full)
  }
  return out
}

const PERSONAL = [
  { label: 'Windows user path', re: /[A-Za-z]:[\\/]Users[\\/][^\\/\s]+/i },
  { label: 'macOS user path', re: /\/Users\/[A-Za-z0-9._-]+\// },
  { label: 'GitHub token', re: /\bgh[pousr]_[A-Za-z0-9]{16,}/ },
  { label: 'fine-grained GitHub token', re: /\bgithub_pat_[A-Za-z0-9_]{20,}/ },
  { label: 'API key', re: /\bsk-[A-Za-z0-9]{16,}/ },
  { label: 'AWS access key', re: /AKIA[0-9A-Z]{16}/ },
  { label: 'private key block', re: /-----BEGIN [A-Z ]*PRIVATE KEY-----/ }
]

check('no local paths or credentials in tracked text files', () => {
  const offenders = []
  for (const file of walk(root, [])) {
    if (!/\.(md|json|js|mjs|yml|yaml|svg|txt|html)$/i.test(file)) continue
    const text = readFileSync(file, 'utf8')
    for (const rule of PERSONAL) {
      if (rule.re.test(text)) offenders.push(`${relative(root, file)} → ${rule.label}`)
    }
  }
  assert.deepEqual(offenders, [])
})

// ---------------------------------------------------------------------------
// Summary
// ---------------------------------------------------------------------------

console.log(`\n${checks - failures}/${checks} checks passed`)
if (failures > 0) process.exitCode = 1
