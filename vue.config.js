const { defineConfig } = require('@vue/cli-service')
const CopyPlugin = require("copy-webpack-plugin");

module.exports = defineConfig({
    transpileDependencies: true,
    pluginOptions: {
        electronBuilder: {
            builderOptions: {
                "extraFiles": [
                    "public/bonker"
                ],
                appId: "ca.jayo.TuberYeets",
                publish: [
                    {
                        provider: "github",
                        owner: "jayo-exe",
                        repo: "tuberyeets",
                        releaseType: 'draft'
                    }
                ],
                nsis: {
                    oneClick: true,
                    perMachine: false
                }
            }
        }
    },
    configureWebpack: {
        externals: {
            bufferutil: 'commonjs bufferutil',
            'utf-8-validate': 'commonjs utf-8-validate',
        },
        watchOptions: {
            ignored: /data\.json/
        },
        plugins: [
            new CopyPlugin({
                patterns: [
                    { from: "node_modules/@fortawesome/fontawesome-free/webfonts", to: "fontawesome/webfonts" },
                    { from: "node_modules/@fortawesome/fontawesome-free/js", to: "fontawesome/js" },
                    { from: "node_modules/@fortawesome/fontawesome-free/css", to: "fontawesome/css" },
                ],
            }),
        ],
    }
})
