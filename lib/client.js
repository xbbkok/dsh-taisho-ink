/**
 * dsh-taisho-ink — browser half.
 *
 * Four surfaces, all driven by the host theme:
 *   1. Alias-token overrides (`ctx.theme.overrideTokens`): the light palette is
 *      washi paper, the dark palette is ink and ember. Both are supplied at once
 *      and resolve against whichever built-in theme is active, so the Appearance
 *      switch keeps working.
 *   2. An ambient layer in `shell.overlay`: a crimson/indigo glow, a faint
 *      washi-fibre texture, a vignette, rising embers and falling wisteria
 *      petals. The layer is click-through.
 *   3. A crest before the blank-session headline (`conversation.hero.brand.mark`).
 *   4. A "Brand" tab in Settings → Plugins that can replace the sidebar's
 *      top-left mark (`sidebar.brand.mark`). The official mark registers at the
 *      default priority, so a themed registration at a lower priority shadows
 *      it; switching back to "Default" disposes that registration and the
 *      official lockup returns.
 *
 * Every resource is registered inside `apply` and disposed with the plugin, so
 * disabling the bundle restores the stock palette, the ambient layer and the
 * official brand mark.
 */

window.__ModuleLoader__.load({
  id: 'dsh-taisho-ink',
  factory(require) {
    const React = require('react')
    const h = React.createElement

    const PACKAGE = 'dsh-taisho-ink'
    const NS = 'taisho-ink'
    const BRAND_KEY = 'dsh-taisho-ink:brand'

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
    // Copy for the Brand tab. English is the complete fallback table.
    // ------------------------------------------------------------------
    const EN = {
      'brand.tab': 'Brand',
      'brand.title': 'Brand mark',
      'brand.desc': 'Choose what sits at the top-left of the sidebar. Default keeps the official mark; the crest or your own image replaces it.',
      'brand.default': 'Default',
      'brand.crest': 'Crest',
      'brand.custom': 'Custom image',
      'brand.hidden': 'Hidden',
      'brand.upload': 'Choose image…',
      'brand.clear': 'Clear image',
      'brand.hint': 'PNG, JPG, WebP or SVG. Cropped to a square and stored in this browser only.',
      'brand.preview': 'Preview',
    }
    const ZH = {
      'brand.tab': '品牌图标',
      'brand.title': '品牌图标',
      'brand.desc': '选择侧栏左上角显示什么。默认保留官方标识；也可以换成主题纹章、你自己的图片，或直接隐藏。',
      'brand.default': '默认',
      'brand.crest': '纹章',
      'brand.custom': '自定义图片',
      'brand.hidden': '隐藏',
      'brand.upload': '选择图片…',
      'brand.clear': '清除图片',
      'brand.hint': '支持 PNG / JPG / WebP / SVG，会裁剪成正方形，只保存在本机浏览器。',
      'brand.preview': '预览',
    }

    // ------------------------------------------------------------------
    // Brand preference. localStorage keeps the choice local to the browser;
    // a failed write (private mode, quota) leaves the in-memory value.
    // ------------------------------------------------------------------
    const MODES = ['default', 'crest', 'custom', 'hidden']

    function readBrand() {
      try {
        const raw = window.localStorage.getItem(BRAND_KEY)
        if (!raw) return { mode: 'default' }
        const parsed = JSON.parse(raw)
        if (!parsed || typeof parsed !== 'object') return { mode: 'default' }
        if (MODES.indexOf(parsed.mode) === -1) return { mode: 'default' }
        if (parsed.mode === 'custom' && typeof parsed.image !== 'string') return { mode: 'default' }
        return { mode: parsed.mode, image: parsed.image }
      } catch (error) {
        return { mode: 'default' }
      }
    }

    function writeBrand(state) {
      try {
        window.localStorage.setItem(BRAND_KEY, JSON.stringify(state))
      } catch (error) {
        /* private mode or quota: keep the in-memory choice */
      }
    }

    const brandStore = {
      state: readBrand(),
      listeners: new Set(),
      get() {
        return this.state
      },
      set(next) {
        this.state = next
        writeBrand(next)
        for (const listener of Array.from(this.listeners)) {
          try {
            listener(next)
          } catch (error) {
            /* one listener must not break the others */
          }
        }
      },
      subscribe(listener) {
        this.listeners.add(listener)
        return function () {
          this.listeners.delete(listener)
        }.bind(this)
      },
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

.ti-brand{max-width:620px}
.ti-brand h3{margin:0 0 6px;font-size:14px;font-weight:600;color:var(--dsw-alias-label-primary)}
.ti-brand p{margin:0 0 16px;font-size:12.5px;line-height:1.6;color:var(--dsw-alias-label-secondary)}
.ti-brand-options{display:flex;flex-wrap:wrap;gap:8px;margin:0 0 16px}
.ti-brand-opt{appearance:none;cursor:pointer;padding:6px 14px;font-size:12.5px;line-height:1.4;
  border-radius:8px;color:var(--dsw-alias-label-primary);
  background:var(--dsw-alias-bg-layer-1);
  border:1px solid var(--dsw-alias-border-l1)}
.ti-brand-opt:hover{border-color:var(--dsw-alias-border-l2)}
.ti-brand-opt.is-active{
  border-color:var(--dsw-alias-brand-primary);
  background:color-mix(in srgb,var(--dsw-alias-brand-primary) 12%,var(--dsw-alias-bg-layer-1));
  color:var(--dsw-alias-brand-primary)}
.ti-brand-custom{display:flex;align-items:center;gap:14px;margin:0 0 12px}
.ti-brand-preview{display:grid;place-items:center;width:44px;height:44px;border-radius:10px;
  background:var(--dsw-alias-bg-layer-2);border:1px solid var(--dsw-alias-border-l1);overflow:hidden}
.ti-brand-preview img{max-width:34px;max-height:34px;object-fit:contain;display:block}
.ti-brand-actions{display:flex;flex-wrap:wrap;gap:8px}
.ti-brand-btn{appearance:none;cursor:pointer;padding:6px 12px;font-size:12px;line-height:1.4;
  border-radius:8px;color:var(--dsw-alias-label-primary);
  background:var(--dsw-alias-bg-layer-1);border:1px solid var(--dsw-alias-border-l1)}
.ti-brand-btn:hover{border-color:var(--dsw-alias-border-l2)}
.ti-brand-hint{margin:10px 0 0;font-size:11.5px;color:var(--dsw-alias-label-secondary);opacity:.85}

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

    function useBrandState() {
      const [state, setState] = React.useState(brandStore.get())
      React.useEffect(function () {
        return brandStore.subscribe(setState)
      }, [])
      return state
    }

    // The occupant of `sidebar.brand.mark` while a non-default mode is active.
    function BrandMark(props) {
      const state = useBrandState()
      const size = typeof props.size === 'number' ? props.size : 24

      if (state.mode === 'hidden') return null
      if (state.mode === 'custom' && state.image) {
        return h('img', {
          src: state.image,
          alt: '',
          draggable: 'false',
          style: { width: size + 'px', height: size + 'px', objectFit: 'contain', display: 'block' },
        })
      }
      return h(Crest, { size: size })
    }

    function readImage(file, onDone) {
      const reader = new FileReader()
      reader.onload = function () {
        const image = new Image()
        image.onload = function () {
          const edge = 128
          const canvas = document.createElement('canvas')
          canvas.width = edge
          canvas.height = edge
          const context = canvas.getContext('2d')
          if (!context) return
          const scale = Math.min(edge / image.width, edge / image.height)
          const width = Math.max(1, Math.round(image.width * scale))
          const height = Math.max(1, Math.round(image.height * scale))
          context.clearRect(0, 0, edge, edge)
          context.drawImage(image, (edge - width) / 2, (edge - height) / 2, width, height)
          onDone(canvas.toDataURL('image/png'))
        }
        image.src = String(reader.result)
      }
      reader.readAsDataURL(file)
    }

    function makeBrandSettings(t) {
      return function BrandSettings() {
        const state = useBrandState()
        const fileRef = React.useRef(null)

        function choose(mode) {
          if (mode === 'custom' && !state.image) {
            if (fileRef.current) fileRef.current.click()
            return
          }
          brandStore.set({ mode: mode, image: mode === 'custom' ? state.image : undefined })
        }

        function onFile(event) {
          const file = event.target.files && event.target.files[0]
          event.target.value = ''
          if (!file || !/^image\//.test(file.type)) return
          readImage(file, function (dataUrl) {
            brandStore.set({ mode: 'custom', image: dataUrl })
          })
        }

        const options = ['default', 'crest', 'custom', 'hidden']

        return h('div', { className: 'ti-brand' },
          h('h3', null, t('brand.title')),
          h('p', null, t('brand.desc')),
          h('div', { className: 'ti-brand-options' },
            options.map(function (mode) {
              return h('button', {
                key: mode,
                type: 'button',
                className: 'ti-brand-opt' + (state.mode === mode ? ' is-active' : ''),
                'aria-pressed': state.mode === mode ? 'true' : 'false',
                onClick: function () { choose(mode) },
              }, t('brand.' + mode))
            })
          ),
          state.mode === 'custom' || state.image
            ? h('div', { className: 'ti-brand-custom' },
                h('div', { className: 'ti-brand-preview' },
                  state.image ? h('img', { src: state.image, alt: '' }) : h(Crest, { size: 30 })),
                h('div', { className: 'ti-brand-actions' },
                  h('button', {
                    type: 'button',
                    className: 'ti-brand-btn',
                    onClick: function () { if (fileRef.current) fileRef.current.click() },
                  }, t('brand.upload')),
                  state.image
                    ? h('button', {
                        type: 'button',
                        className: 'ti-brand-btn',
                        onClick: function () { brandStore.set({ mode: 'default' }) },
                      }, t('brand.clear'))
                    : null
                )
              )
            : null,
          h('input', {
            ref: fileRef,
            type: 'file',
            accept: 'image/*',
            style: { display: 'none' },
            onChange: onFile,
          }),
          h('p', { className: 'ti-brand-hint' }, t('brand.hint'))
        )
      }
    }

    return {
      inject: ['slots', 'theme', 'locale'],
      apply(ctx) {
        ctx.effect(function () {
          return ctx.theme.overrideTokens(PACKAGE, TOKENS)
        }, 'dsh-taisho-ink:tokens')

        ctx.effect(function () {
          return ctx.locale.register(NS, 'en', EN)
        }, 'dsh-taisho-ink:locale-en')

        ctx.effect(function () {
          return ctx.locale.register(NS, 'zh', ZH)
        }, 'dsh-taisho-ink:locale-zh')

        const t = ctx.locale.bind(NS)

        ctx.slots.inject('shell.overlay', function () {
          return ctx.slots.register({
            name: 'shell.overlay', id: 'dsh-taisho-ink.atmosphere', order: 80,
          }, Atmosphere)
        })

        ctx.slots.inject('conversation.hero.brand.mark', function () {
          return ctx.slots.register({ name: 'conversation.hero.brand.mark' }, Crest)
        })

        ctx.slots.inject('settings.plugins.tab', function () {
          return ctx.slots.register({
            name: 'settings.plugins.tab',
            id: 'dsh-taisho-ink.brand',
            order: 70,
            label: function () { return t('brand.tab') },
          }, makeBrandSettings(t))
        })

        // The official mark registers at the default priority (0). A single
        // slot allows one registration per priority and the lowest renders, so
        // registering at -1 shadows it; disposing restores the official one.
        ctx.effect(function () {
          let release = null

          function sync() {
            if (release) {
              release()
              release = null
            }
            if (brandStore.get().mode === 'default') return
            release = ctx.slots.inject('sidebar.brand.mark', function () {
              return ctx.slots.register({
                name: 'sidebar.brand.mark',
                priority: -1,
              }, BrandMark)
            })
          }

          sync()
          const off = brandStore.subscribe(sync)
          return function () {
            off()
            if (release) release()
          }
        }, 'dsh-taisho-ink:brand')
      },
    }
  },
})
