# Xdebug Trace Viewer

> An xdebug trace viewer build on electron.


## Install

*macOS 10.10+, Linux, and Windows 7+ are supported (64-bit only).*

**Linux**

[**Download**](https://github.com/kuun/xdebug-trace-viewer/releases/latest) the `.7z` file.

*The AppImage needs to be [made executable](http://discourse.appimage.org/t/how-to-make-an-appimage-executable/80) after download.*

**Windows**

[**Download**](https://github.com/kuun/xdebug-trace-viewer/releases/latest) the `-win.7z` file.


---


## Dev

Built with [Electron](https://electronjs.org).

### Prepare

```
$ npm install gulp-cli -g
```

### Run

```bash
$ npm install
$ npm run ejs
$ npm start
```

### Build package

```bash
$ npm run ejs
# for windows
$ npm run win-dist
# for linux
$ npm run linux-dist
```

## How to get trace

### Install Xdebug

Fellow [Xdebug offical installation documentation](https://xdebug.org/docs/install).

### Config Xdebug

`Note:` Now XdebugTraceViewer only support computerize format, so `trace_format` must be 1, read more abort [trace_format](https://xdebug.org/docs/all_settings#trace_format).

```ini
xdebug.trace_format = 1
```

Suggested configration:

```ini
# disable auto trace
xdebug.auto_trace = 0
xdebug.trace_enable_trigger = 1
# disable debug
xdebug.default_enable=0
xdebug.remote_enable=0
# for performance, disable auto profiler
xdebug.profiler_enable = 0
```

Then trigger Xdebug to generate trace manually, for example:

```bash
$ curl 'http://localhost/test.php&XDEBUG_TRACE=1'
```

If you want to get function parameters and return information, add these to xdebug.ini.

```ini
xdebug.collect_params=4
xdebug.collect_return=0
```

To get memory usage delta information between function calls, enable `show_mem_delta`.

```ini
xdebug.show_mem_delta = 1
```

Format trace file name as you wart:

```ini
xdebug.trace_output_name = trace.%p.%t
```
