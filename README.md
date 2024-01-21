# An example of using [react-jycm-viewer](https://github.com/eggachecat/react-jycm-viewer)


This is a demo project for using [react-jycm-viewer](https://github.com/eggachecat/react-jycm-viewer) 
created from the amazing template [React Webpack Typescript Starter](https://github.com/vikpe/react-webpack-typescript-starter)


# Usage
```bash
yarn # install dependenices
yarn start
```

# Included steps:

## dependenices
- yarn add react-jycm-viewer react-monacor-editor monaco-editor
- yarn add -D monaco-editor-webpack-plugin
- 

## webpack config:
- in `webpack/common.js`

you can find the config for `monaco-editor-webpack-plugin`

```js
{
    plugins: [
        // ...
        new MonacoWebpackPlugin({
            languages: ["json"],
        })
    ]
}

```
