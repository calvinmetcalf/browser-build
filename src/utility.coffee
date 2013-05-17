require 'sugar'
fs = require 'fs'
np = require 'path'
cp = require 'child_process'

module.exports = exports =
    spawn: spawn = (command, options, callback) ->
        return callback?() unless command?
        if typeof options is 'function'
            callback = options
            options = null
        options ?= {}
        options.stdio ?= 'inherit'
        args = command.split /\s+/
        command = args.shift()
        child = cp.spawn command, args, options
        child.on 'exit', callback if callback?
    exec: exec = (command, options, callback) ->
        return callback?() unless command?
        if typeof options is 'function'
            callback = options
            options = null
        options ?= {}
        cp.exec command, options, (err, stdout, stderr) ->
            console.log err if err?
            console.log stdout.toString() if stdout?
            console.log stderr.toString() if stderr?
            callback?()
    copyMetadata: copyMetadata = (input, output) ->
        for file in ["package.json", "README.md"]
            from = np.join input, file
            to = np.join output, file
            if fs.existsSync from
                copy from, to
                console.log "Copied #{to}"
    buildCoffee: buildCoffee = (input, output, callback) ->
        spawn "coffee.cmd -c -m -o #{output} #{input}", callback
    watchCoffee: watchCoffee = (input, output) ->
        spawn "coffee.cmd -w -m -c -o #{output} #{input}"
    isMatch: isMatch = (value, match, defaultValue=false) ->
        value = value.split(/[\/\\]/g).pop()
        return defaultValue unless match?
        return match value if 'function' is typeof match
        return match.indexOf(value) >= 0 if Array.isArray match
        return value.substring(value.length-match.length) is match if typeof match is 'string'
        return match.test value
    defaultFileExclude: ["node_modules","www"]
    list: list = (dir, options={}, files=[]) ->
        exclude = options.exclude ? exports.defaultFileExclude
        recursive = options.recursive ? true
        for file in fs.readdirSync(dir)
            file = np.join dir, file
            if not isMatch file, exclude, false
                if fs.statSync(file)?.isFile?()
                    files.push file if isMatch file, options.include, true
                else if recursive
                    list file, options, files
        files
    makeDirectories: makeDirectories = (dir) ->
        if not Object.isString dir
            throw new Error "dir is not a string: #{JSON.stringify dir}"
        if not fs.existsSync dir
            # make parent first
            makeDirectories np.dirname dir
            # make self
            fs.mkdirSync dir
    makeParentDirectories: makeParentDirectories = (file) ->
        makeDirectories np.dirname file
    read: read = (file) ->
        fs.readFileSync(file, 'utf8')
    write: write = (file, content) ->
        makeParentDirectories file
        fs.writeFileSync(file, content, 'utf8')
    copy: copy = (source, target) ->
        content = read source
        write target, content
    getMatches: (s, regex, group) ->
        if not regex.global
            throw 'regex must be declared with global modifier /trailing/g'
        results = []
        while match = regex.exec s
            results.push if group > 0 then match[group] else match
        results

    startWebServer: (config) ->
        throw new Error "config.root string is required #{JSON.stringify config.root}" unless Object.isString config.root
        throw new Error "config.port number is required #{JSON.stringify config.port}" unless Object.isNumber config.port
        root = config.root
        port = config.port
        express = require 'express'
        app = express()
        http = require 'http'
        app.disable 'etag'
        app.configure ->
            app.use (req, res, next) ->
                # console.log req.url
                next()
            app.use express.static root
            app.use app.router
        server = http.createServer app
        server.listen port
        console.log "Starting web server on port #{port}."

if typeof describe is 'function'
    assert = require 'assert'
    describe 'glass.build.utility', ->
        describe 'isMatch', ->
            it "should work", ->
                assert isMatch "foo.js", ".js"
                assert isMatch "foo.js", ["foo.bar","foo.js"]
                assert isMatch "foo.js", /\.js$/
                assert isMatch "foo.js", (x) -> x is "foo.js"
                assert not isMatch "foo.jsp", ".js"
                assert not isMatch "foo.jsp", ["foo.bar","foo.js"]
                assert not isMatch "foo.jsp", /\.js$/
                assert not isMatch "foo.jsp", (x) -> x is "foo.js"