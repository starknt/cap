import { defineNuxtModule, addComponentsDir, createResolver, installModule, hasNuxtModule, addServerHandler, addServerTemplate, addComponent, addTemplate } from '@nuxt/kit'
import type Cap from '@cap.js/server'
import { version } from '../package.json'

export interface ModuleOptions extends Cap.CapConfig {
  cdn?: {
    provider: 'jsdelivr' | 'unpkg' | 'local'
    widget?: string
    floating?: string
    version?: string
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
      widget: '/@cap.js/widget',
      floating: '/@cap.js/widget/cap-floating.min.js',
      version: '0.1.12',
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
            export const version = '${cdn.version}'
            export const widget = '${cdn.widget}'
            export const floating = '${cdn.floating}'
          `
        },
      })
    }
    else {
      const providerUri = cdn?.provider === 'jsdelivr'
        ? 'https://cdn.jsdelivr.net/npm'
        : 'https://unpkg.com'
      const widget = `${providerUri}/@cap.js/widget@${cdn?.version}`
      const floating = `${providerUri}/@cap.js/widget@${cdn?.version}/cap-floating.min.js`

      addTemplate({
        filename: 'cap.internal.widget.mjs',
        getContents: () => {
          return `
            export const version = '${cdn?.version}'
            export const widget = '${widget}'
            export const floating = '${floating}'
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
