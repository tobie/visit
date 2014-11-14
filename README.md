Visit
=====

`visit` is a PhantomJS-based node module.

It's designed to visits one or multiple urls, runs a CommonJS-aware script in
the context of the page once the page is loaded, grab whatever response it gets
back through the `window.callPhantom()` method and parse it as JSON.

`visit`'s goal is just to be a robust wrapper around PhantomJS, focused on a
single task: get specific data out of a publicly available Web page.

API
---

### `visit(url, script[, options], callback)`

Visits `url`, runs `script` onload (note `script` can import other CJS modules)
and call `callback` upon completition with the object passed from `script` as 
second argument.

`options` is… optional. It accepts the following values:

*   `timeout` (`int`): the length, in `ms` before a request is killed.
    Defaults to none.
*   `attempts` (`int`): number of attempts at visiting the page before reporting
    an error (note this uses an exponential backoff). Defaults to `1`.
*  `delay` (`int`): time in `ms` before the second attempt, default to `0 ms`.
*  `confing` (`str`): Path to the [PhantomJS JSON config file](http://phantomjs.org/api/command-line.html). Optional.

### `visitPages(urls, script[, options], callback)`

Sequenctially visits every `url` in the `urls` array, run `script` for each page
load (note `script` can import other CJS modules). Passes the output of visiting
each `url` as an array to the callback.

Options are the same as for `visit`.