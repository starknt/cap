import { defineNuxtModule, addComponentsDir, createResolver, hasNuxtModule, addServerHandler, addServerTemplate, addComponent, addTemplate } from '@nuxt/kit'
import type Cap from '@cap.js/server'
import { version } from '../package.json'

export interface ModuleOptions extends Cap.CapConfig {
  cdn?: {
    provider: 'jsdelivr' | 'unpkg' | 'local'
    widget?: string
    floating?: string
    wasm?: string
  }
  endpoints?: {
    challenge: string
    redeem: string
  }
}

export default defineNuxtModule<ModuleOptions>({
  meta: {
    name: '@cap.js/nuxt',
    configKey: 'cap',
    version,
  },
  defaults: {
    tokens_store_path: '.data/tokensList.json',
    cdn: {
      provider: 'jsdelivr',
      widget: '/@cap.js/widget@0.1.12',
      floating: '/@cap.js/widget@0.1.12/cap-floating.min.js',
      wasm: '/@cap.js/wasm@0.0.4/browser/cap_wasm.min.js',
    },
    endpoints: {
      challenge: '/api/challenge',
      redeem: '/api/redeem',
    },
  },
  async setup(options, nuxt) {
    const isCustomElement = nuxt.options.vue.compilerOptions.isCustomElement

    nuxt.options.vue.compilerOptions.isCustomElement = (tag) => {
      if (tag.startsWith('cap-widget')) {
        return true
      }

      return isCustomElement?.(tag)
    }

    const resolver = createResolver(import.meta.url)

    if (!hasNuxtModule('@nuxt/scripts')) {
      throw new Error('@nuxt/scripts is required to use @cap.js/nuxt')
    }

    addServerTemplate({
      filename: '#cap/cap.mjs',
      getContents: () => {
        return `
          import Cap from '@cap.js/server'

          export const cap = new Cap(${JSON.stringify(options)})
        `
      },
    })

    const cdn = options.cdn

    if (cdn?.provider === 'local') {
      addTemplate({
        filename: 'cap.internal.widget.mjs',
        getContents: () => {
          return `
            export const widget = '${cdn.widget}'
            export const floating = '${cdn.floating}'
            export const wasm = '${cdn.wasm}'
          `
        },
      })
    }
    else {
      const providerUri = cdn?.provider === 'jsdelivr'
        ? 'https://cdn.jsdelivr.net/npm'
        : 'https://unpkg.com'
      const widget = `${providerUri}${cdn?.widget || '/@cap.js/widget@0.1.12'}`
      const floating = `${providerUri}${cdn?.floating || '/@cap.js/widget@0.1.12/cap-floating.min.js'}`
      const wasm = `${providerUri}${cdn?.wasm || '/@cap.js/wasm@0.0.4/browser/cap_wasm.min.js'}`

      addTemplate({
        filename: '@cap.js/widget.mjs',
        getContents: () => {
          return `
            export const widget = '${widget}'
            export const floating = '${floating}'
            export const wasm = '${wasm}'
          `
        },
      })
    }

    addServerHandler({
      route: options.endpoints!.challenge,
      handler: resolver.resolve('./runtime/server/challenge.ts'),
    })

    addServerHandler({
      route: options.endpoints!.redeem,
      handler: resolver.resolve('./runtime/server/redeem.ts'),
    })

    addComponentsDir({
      path: resolver.resolve('./runtime/components'),
    })
  },
})
