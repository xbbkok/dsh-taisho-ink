/**
 * dsh-taisho-ink — browser half.
 *
 * Three surfaces, all driven by the host theme:
 *   1. Alias-token overrides (`ctx.theme.overrideTokens`): the light palette is
 *      washi paper, the dark palette is ink and ember. Both are supplied at once
 *      and resolve against whichever built-in theme is active, so the Appearance
 *      switch keeps working.
 *   2. An ambient layer in `shell.overlay`: a crimson/indigo glow, a faint
 *      washi-fibre texture, a vignette, rising embers and falling wisteria
 *      petals. The layer is click-through.
 *   3. A crest before the blank-session headline (`conversation.hero.brand.mark`).
 *
 * Every resource is registered inside `apply` and disposed with the plugin, so
 * disabling the bundle restores the stock palette and removes the layer.
 */

window.__ModuleLoader__.load({
  id: 'dsh-taisho-ink',
  factory(require) {
    const React = require('react')
    const h = React.createElement

    const PACKAGE = 'dsh-taisho-ink'

    // ------------------------------------------------------------------
    // Palette. Keys are the alias CSS variables the host documents; each
    // value carries both palettes.
    // ------------------------------------------------------------------
    const TOKENS = {
      '--dsw-alias-bg-base': { light: '#f5f0e6', dark: '#0c0e13' },
      '--dsw-alias-bg-layer-1': { light: '#fcf8f0', dark: '#141821' },
      '--dsw-alias-bg-layer-2': { light: '#efe7d8', dark: '#1c2230' },
      '--dsw-alias-bg-overlay': { light: '#fffbf3', dark: '#171c26' },
      '--dsw-alias-border-l1': { light: '#ded1ba', dark: '#2c3343' },
      '--dsw-alias-border-l2': { light: '#c8b694', dark: '#455068' },
      '--dsw-alias-brand-primary': { light: '#b3191f', dark: '#e04a3c' },
      '--dsw-alias-label-primary': { light: '#2b2320', dark: '#f3ece2' },
      '--dsw-alias-label-secondary': { light: '#6d5c4d', dark: '#a79d90' },
      '--dsw-alias-state-error-primary': { light: '#c62828', dark: '#ff5b50' },
      '--dsw-alias-state-idle-primary': { light: '#b5a693', dark: '#6a7280' },
      '--dsw-alias-state-success-primary': { light: '#2f7d5f', dark: '#4fae8a' },
      '--dsw-alias-state-warn-primary': { light: '#c98612', dark: '#e8b04a' },
      '--dsw-specific-sidebar-fill': { light: '#ece2d0', dark: '#090b10' },
    }

    // ------------------------------------------------------------------
    // Global stylesheet, owned by the mounted atmosphere component so it
    // leaves with the plugin. Layout stays the host's; only ambience is ours.
    // ------------------------------------------------------------------
    const CSS = `
::selection{background:color-mix(in srgb,#b3191f 32%,transparent);color:inherit}
*::-webkit-scrollbar{width:10px;height:10px}
*::-webkit-scrollbar-track{background:transparent}
*::-webkit-scrollbar-thumb{
  background-color:color-mix(in srgb,var(--dsw-alias-brand-primary) 42%,var(--dsw-alias-border-l2));
  border:2px solid transparent;border-radius:999px;background-clip:padding-box}
*::-webkit-scrollbar-thumb:hover{
  background-color:color-mix(in srgb,var(--dsw-alias-brand-primary) 72%,var(--dsw-alias-border-l2))}
*::-webkit-scrollbar-corner{background:transparent}

.ti-atm{position:fixed;inset:0;pointer-events:none;overflow:hidden;z-index:1}
.ti-atm-glow{position:absolute;inset:-16%;
  background:
    radial-gradient(46% 38% at 90% 4%,color-mix(in srgb,#c9302c 24%,transparent),transparent 70%),
    radial-gradient(44% 36% at 6% 94%,color-mix(in srgb,#3a2b52 26%,transparent),transparent 72%),
    radial-gradient(38% 28% at 48% 0%,color-mix(in srgb,#e0a03a 12%,transparent),transparent 70%)}
.ti-atm-paper{position:absolute;inset:0;opacity:.55;
  background-image:
    repeating-linear-gradient(92deg,color-mix(in srgb,var(--dsw-alias-label-primary) 4%,transparent) 0 1px,transparent 1px 11px),
    repeating-linear-gradient(2deg,color-mix(in srgb,var(--dsw-alias-label-primary) 3%,transparent) 0 1px,transparent 1px 15px)}
.ti-atm-vignette{position:absolute;inset:0;
  background:radial-gradient(120% 100% at 50% 38%,transparent 52%,color-mix(in srgb,var(--dsw-alias-label-primary) 15%,transparent) 100%)}

.ti-embers,.ti-petals{position:absolute;inset:0}
.ti-ember{position:absolute;bottom:-4%;border-radius:50%;
  background:radial-gradient(circle at 50% 50%,#ffd9a3,#e2542a 62%,transparent 74%);
  box-shadow:0 0 9px rgba(226,84,42,.55);
  animation-name:ti-rise;animation-timing-function:ease-out;animation-iteration-count:infinite;will-change:transform,opacity}
@keyframes ti-rise{
  0%{transform:translate3d(0,8vh,0) scale(.7);opacity:0}
  14%{opacity:.85}
  64%{opacity:.5}
  100%{transform:translate3d(18px,-104vh,0) scale(1.12);opacity:0}}

.ti-petal{position:absolute;top:-8%;display:block;will-change:transform;
  animation-name:ti-fall;animation-timing-function:linear;animation-iteration-count:infinite}
.ti-petal span{display:block;width:100%;height:100%;
  animation:ti-swing 4.6s ease-in-out infinite alternate}
@keyframes ti-fall{0%{transform:translate3d(0,-8vh,0) rotate(0deg)}100%{transform:translate3d(-36px,112vh,0) rotate(260deg)}}
@keyframes ti-swing{0%{transform:translateX(-7px) rotate(-7deg)}100%{transform:translateX(9px) rotate(9deg)}}

.ti-crest{overflow:visible}
@media (prefers-reduced-motion:reduce){
  .ti-embers,.ti-petals{display:none}
  .ti-ember,.ti-petal,.ti-petal span{animation:none}
}`

    // ------------------------------------------------------------------
    // Deterministic particle paint, so a reload looks the same.
    // ------------------------------------------------------------------
    let seed = 20261022
    function next() {
      seed = (seed * 1103515245 + 12345) % 2147483648
      return seed / 2147483648
    }

    const EMBERS = Array.from({ length: 18 }, function () {
      return {
        left: (next() * 100).toFixed(2),
        size: Math.round(3 + next() * 4),
        rise: (13 + next() * 10).toFixed(1),
        delay: (-next() * 22).toFixed(1),
        opacity: (0.45 + next() * 0.4).toFixed(2),
      }
    })

    const PETALS = Array.from({ length: 10 }, function () {
      return {
        left: (next() * 100).toFixed(2),
        size: Math.round(9 + next() * 5),
        fall: (18 + next() * 12).toFixed(1),
        delay: (-next() * 26).toFixed(1),
        opacity: (0.3 + next() * 0.35).toFixed(2),
      }
    })

    function petalSvg() {
      return h('svg', {
        viewBox: '0 0 14 20', width: '100%', height: '100%',
        'aria-hidden': true, focusable: 'false',
      },
        h('defs', null,
          h('linearGradient', { id: 'ti-wisteria', x1: '0', y1: '0', x2: '0.4', y2: '1' },
            h('stop', { offset: '0', stopColor: '#cfc3f2' }),
            h('stop', { offset: '1', stopColor: '#8f7fc9' })
          )
        ),
        h('path', {
          d: 'M7 0C10.6 4 11.8 9.4 10.4 14.2C9.4 17.8 5.2 19.6 2.8 17.2C0.6 15 -0.2 10.6 1.6 6.6C2.8 3.8 4.6 1.4 7 0Z',
          fill: 'url(#ti-wisteria)',
        }),
        h('path', {
          d: 'M7.2 3.2C9 6.4 9.6 10.2 8.6 13.2',
          stroke: '#efe9ff', strokeWidth: 1, fill: 'none', strokeOpacity: 0.55, strokeLinecap: 'round',
        })
      )
    }

    function Embers() {
      return h('div', { className: 'ti-embers', 'aria-hidden': 'true' },
        EMBERS.map(function (ember, index) {
          return h('span', {
            key: index,
            className: 'ti-ember',
            style: {
              left: ember.left + '%',
              width: ember.size + 'px',
              height: ember.size + 'px',
              opacity: ember.opacity,
              animationDuration: ember.rise + 's',
              animationDelay: ember.delay + 's',
            },
          })
        })
      )
    }

    function Petals() {
      return h('div', { className: 'ti-petals', 'aria-hidden': 'true' },
        PETALS.map(function (petal, index) {
          return h('span', {
            key: index,
            className: 'ti-petal',
            style: {
              left: petal.left + '%',
              width: petal.size + 'px',
              height: Math.round(petal.size * 1.42) + 'px',
              opacity: petal.opacity,
              animationDuration: petal.fall + 's',
              animationDelay: petal.delay + 's',
            },
          }, h('span', null, petalSvg()))
        })
      )
    }

    // ------------------------------------------------------------------
    // Components.
    // ------------------------------------------------------------------
    function Atmosphere() {
      return h(React.Fragment, null,
        h('style', { key: 'css' }, CSS),
        h('div', { className: 'ti-atm', 'aria-hidden': 'true' },
          h('div', { className: 'ti-atm-glow' }),
          h('div', { className: 'ti-atm-paper' }),
          h(Embers),
          h(Petals),
          h('div', { className: 'ti-atm-vignette' })
        )
      )
    }

    function Crest(props) {
      const size = typeof props.size === 'number' ? props.size : 40
      const className = 'ti-crest' + (props.className ? ' ' + props.className : '')
      return h('svg', {
        className: className, width: size, height: size, viewBox: '0 0 64 64',
        role: 'img', 'aria-hidden': 'true', focusable: 'false',
      },
        h('defs', null,
          h('linearGradient', { id: 'ti-sun', x1: '0', y1: '0', x2: '0.6', y2: '1' },
            h('stop', { offset: '0', stopColor: '#d8322e' }),
            h('stop', { offset: '1', stopColor: '#8f1116' })
          )
        ),
        h('circle', { cx: 32, cy: 32, r: 27, fill: 'none', stroke: '#d8a24a', strokeOpacity: 0.4, strokeWidth: 1.2, strokeDasharray: '2 5' }),
        h('circle', { cx: 32, cy: 32, r: 21, fill: 'url(#ti-sun)' }),
        h('path', { d: 'M13 51L51 13', stroke: '#e9e4d8', strokeWidth: 3.2, strokeLinecap: 'round' }),
        h('path', { d: 'M13 51L51 13', stroke: '#a9a294', strokeWidth: 1, strokeLinecap: 'round', strokeDasharray: '3 4', strokeOpacity: 0.9 }),
        h('circle', { cx: 15.2, cy: 48.8, r: 2.6, fill: '#d8a24a' }),
        h('circle', { cx: 32, cy: 32, r: 21, fill: 'none', stroke: '#d8a24a', strokeOpacity: 0.55, strokeWidth: 1 }),
        h('circle', { cx: 51, cy: 13, r: 1.8, fill: '#e8b04a' })
      )
    }

    return {
      inject: ['slots', 'theme'],
      apply(ctx) {
        ctx.effect(function () {
          return ctx.theme.overrideTokens(PACKAGE, TOKENS)
        }, 'dsh-taisho-ink:tokens')

        ctx.slots.inject('shell.overlay', function () {
          return ctx.slots.register({
            name: 'shell.overlay', id: 'dsh-taisho-ink.atmosphere', order: 80,
          }, Atmosphere)
        })

        ctx.slots.inject('conversation.hero.brand.mark', function () {
          return ctx.slots.register({ name: 'conversation.hero.brand.mark' }, Crest)
        })
      },
    }
  },
})
