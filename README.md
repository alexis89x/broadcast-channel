# broadcast-channel-polyfill

A simple BroadcastChannel polyfill that works with all major browsers.
Please refer to the official MDN documentation of the Broadcast Channel API.

See <a href="https://developer.mozilla.org/en-US/docs/Web/API/Broadcast_Channel_API">Broadcast Channel API on MDN</a>.

For more info, see the related article on <a href="https://alexis89x.medium.com/communication-among-iframes-and-tabs-a-working-polyfill-for-broadcast-channel-api-f44d07dcf527">Medium</a>.


## Webpack usage


```js

.... 
plugins: [
    new ProvidePlugin({
        BroadcastChannel: '@alexis89x/broadcast-channel/lib/index.js'
    })]

``