(function(){require.register('browser-build/index',function(module,exports,require){// Generated by CoffeeScript 1.6.3
(function() {
  var buildBrowserTestFile, buildCommon, buildFile, buildIncludes, buildMap, check, copyRequire, copySourceMap, deleteFile, exclude, fs, getBaseModuleName, getDebugIncludeFile, getDebugManifestFile, getInputDirectory, getInputKeyValueForFile, getModuleId, getOutputFile, getOutputModuleDirectory, log, normalize, np, utility, watchInput, watcher;

  require('sugar');

  utility = require("./utility");

  watcher = require("./watcher");

  np = require("path");

  fs = require('fs');

  log = function(config, message) {
    if (!config.silent) {
      return console.log(message);
    }
  };

  normalize = function(file) {
    return file.replace(/\\/g, "\/");
  };

  getInputKeyValueForFile = function(config, file) {
    var input, name, _ref;
    file = normalize(file);
    _ref = config.input;
    for (name in _ref) {
      input = _ref[name];
      if (Object.isString(input)) {
        if (file.startsWith(input)) {
          return [name, input];
        }
      }
    }
    throw new Error("input not found in config.input: " + file);
  };

  getInputDirectory = function(config, file) {
    return getInputKeyValueForFile(config, file)[1];
  };

  getBaseModuleName = function(config, file) {
    return getInputKeyValueForFile(config, file)[0];
  };

  getOutputModuleDirectory = function(config) {
    return np.join(config.output.directory, "modules");
  };

  getOutputFile = function(config, file, id) {
    return file = np.normalize(np.join(getOutputModuleDirectory(config), id) + ".js");
  };

  deleteFile = function(file) {
    if (fs.existsSync(file)) {
      return fs.unlinkSync(file);
    }
  };

  buildBrowserTestFile = function(config) {
    var outputFolder, testFolder, type;
    type = config.output.test;
    if (type == null) {
      return;
    }
    testFolder = np.join(__dirname, "../test", type);
    if (!fs.existsSync(testFolder)) {
      throw new Error("Test files for " + type + " not found, expected at " + testFolder);
    }
    outputFolder = np.join(config.output.directory, "test");
    return utility.copy(testFolder, outputFolder);
  };

  copySourceMap = function(config, inputFile, outputFile, deleteOutput) {
    var copyTo, e, index, map, mapInput, mapOutput, shortName, source, _i, _len, _ref;
    if (deleteOutput == null) {
      deleteOutput = false;
    }
    mapInput = inputFile.replace(/\.js$/, ".map");
    mapOutput = outputFile.replace(/\.js$/, ".map");
    if (fs.existsSync(mapInput)) {
      try {
        map = JSON.parse(utility.read(mapInput));
      } catch (_error) {
        e = _error;
        map = {
          sourceRoot: ".",
          sources: []
        };
      }
      _ref = map.sources;
      for (index = _i = 0, _len = _ref.length; _i < _len; index = ++_i) {
        source = _ref[index];
        source = np.join(np.dirname(mapInput), map.sourceRoot, source);
        copyTo = np.join(np.dirname(mapOutput), shortName = source.split(/[\/\\]/g).pop());
        if (deleteOutput) {
          deleteFile(copyTo);
        } else {
          if (!fs.existsSync(source)) {
            continue;
          }
          utility.copy(source, copyTo);
        }
        map.sources[index] = shortName;
      }
      map.sourceRoot = ".";
      if (deleteOutput) {
        deleteFile(mapInput);
        return deleteFile(mapOutput);
      } else {
        return utility.write(mapOutput, JSON.stringify(map, null, '    '));
      }
    }
  };

  buildMap = {};

  buildFile = function(config, file, id) {
    var input, output, outputFile, previousFile;
    previousFile = buildMap[id];
    if ((previousFile != null) && previousFile !== file) {
      return;
    }
    buildMap[id] = file;
    outputFile = getOutputFile(config, file, id);
    if (!fs.existsSync(file)) {
      copySourceMap(config, file, outputFile, true);
      deleteFile(outputFile);
      return;
    }
    input = utility.read(file);
    output = "(function(){require.register('" + id + "',function(module,exports,require){" + input + "\n})})()";
    utility.write(outputFile, output);
    log(config, "Wrapped " + outputFile);
    return copySourceMap(config, file, outputFile);
  };

  buildIncludes = function(config) {
    var base, file, includeFile, list, manifest, manifestList, manifestParent, script, webroot, _i, _len, _ref;
    list = utility.list(getOutputModuleDirectory(config), {
      include: ".js"
    });
    list = list.map(function(x) {
      return normalize(np.relative(config.output.directory, x));
    });
    list = list.sort(function(a, b) {
      var aa, aitem, bb, bitem, compare, index, _i, _len;
      aa = a.split('/');
      bb = b.split('/');
      if (aa.length !== bb.length) {
        return aa.length - bb.length;
      }
      for (index = _i = 0, _len = aa.length; _i < _len; index = ++_i) {
        aitem = aa[index];
        bitem = bb[index];
        compare = aitem.localeCompare(bitem);
        if (compare !== 0) {
          return compare;
        }
      }
      return 0;
    });
    script = "";
    webroot = (_ref = config.output.webroot) != null ? _ref : config.output.directory;
    base = np.relative(webroot, config.output.directory).replace(/\\/g, '\/');
    base = ("/" + base + "/").replace(/\/+/, '/');
    for (_i = 0, _len = list.length; _i < _len; _i++) {
      file = list[_i];
      script += "document.writeln(\"<script src='" + base + file + "'></script>\");\n";
    }
    includeFile = getDebugIncludeFile(config);
    utility.write(includeFile, script);
    log(config, "Created " + includeFile);
    manifest = getDebugManifestFile(config);
    manifestParent = np.dirname(manifest);
    manifestList = list.map(function(x) {
      return normalize(np.relative(manifestParent, np.join(config.output.directory, x)));
    });
    utility.write(getDebugManifestFile(config), JSON.stringify(manifestList, null, "  "));
    return buildBrowserTestFile(config);
  };

  getDebugIncludeFile = function(config) {
    return np.join(config.output.directory, "debug.js");
  };

  getDebugManifestFile = function(config) {
    return np.join(config.output.directory, "modules/manifest.json");
  };

  copyRequire = function(config) {
    var source, target;
    source = np.join(__dirname, 'require.js');
    if (!fs.existsSync(source)) {
      source = np.join(__dirname, '../lib/require.js');
    }
    target = np.join(getOutputModuleDirectory(config), 'require.js');
    utility.copy(source, target);
    return log(config, "Copied " + target);
  };

  check = function(config) {
    var fixOptions, key, resolve, value, _ref;
    if (config.input == null) {
      config.input = {
        "": true
      };
    }
    resolve = function(root, module, source) {
      var json, main, name, path, paths, _i, _len, _ref;
      paths = [root, np.join(root, "node_modules"), np.join(root, "../node_modules"), np.join(root, "../../node_modules")];
      if (process.env.NODE_PATH != null) {
        paths = paths.concat(process.env.NODE_PATH.split(np.delimiter));
      }
      for (_i = 0, _len = paths.length; _i < _len; _i++) {
        path = paths[_i];
        main = np.join(path, module + "/package.json");
        if (fs.existsSync(main)) {
          json = eval("(" + (utility.read(main)) + ")");
          module = json.name;
          if (json.dependencies != null) {
            for (name in json.dependencies) {
              fixOptions(name, true, np.dirname(main), main);
            }
          }
          main = np.join(np.dirname(main), (_ref = json.main) != null ? _ref : "index.js");
          return [module, main];
        }
        main = np.join(path, module + ".js");
        if (fs.existsSync(main)) {
          return [module, main];
        }
        main = np.join(path, module + "/index.js");
        if (fs.existsSync(main)) {
          return [module, main];
        }
      }
      throw new Error("module not found: " + module + ", source: " + source);
    };
    fixOptions = function(name, options, root, source) {
      var main, _ref;
      delete config.input[name];
      if (Object.isString(options)) {
        options = {
          name: name,
          main: 'index.js',
          directory: np.normalize(options)
        };
      } else if (options === true) {
        _ref = resolve(root, name, source), name = _ref[0], main = _ref[1];
        options = {
          name: name,
          main: np.basename(main),
          directory: np.dirname(main)
        };
      }
      return config.input[name] = options;
    };
    _ref = config.input;
    for (key in _ref) {
      value = _ref[key];
      fixOptions(key, value, '.', 'config');
    }
  };

  buildCommon = function(config) {
    check(config);
    return copyRequire(config);
  };

  getModuleId = function(inputConfig, file) {
    var relative;
    relative = np.relative(inputConfig.directory, file);
    if (relative === inputConfig.main) {
      relative = "index.js";
    }
    relative = relative.slice(0, -".js".length);
    return normalize(np.join(inputConfig.name, relative));
  };

  exclude = function(file) {
    if (/WEB-INF/.test(file)) {
      return true;
    }
    return false;
  };

  exports.build = function(config, callback) {
    var file, id, input, list, name, _i, _len, _ref;
    buildCommon(config);
    _ref = config.input;
    for (name in _ref) {
      input = _ref[name];
      list = utility.list(input.directory, {
        include: ".js"
      });
      for (_i = 0, _len = list.length; _i < _len; _i++) {
        file = list[_i];
        if (!(!exclude(file))) {
          continue;
        }
        id = getModuleId(input, file);
        buildFile(config, file, id);
      }
    }
    buildIncludes(config);
    return typeof callback === "function" ? callback() : void 0;
  };

  watchInput = function(config, input) {
    return watcher.watchDirectory(input.directory, {
      include: ".js",
      initial: false
    }, function(file, curr, prev, change) {
      var id;
      if (exclude(file)) {
        return;
      }
      id = getModuleId(input, file);
      buildFile(config, file, id);
      if (change === "deleted" || change === "created") {
        return buildIncludes(config);
      } else {
        return utility.touch(getDebugManifestFile(config));
      }
    });
  };

  exports.watch = function(config) {
    var input, name, _ref, _results;
    exports.build(config);
    _ref = config.input;
    _results = [];
    for (name in _ref) {
      input = _ref[name];
      _results.push(watchInput(config, input));
    }
    return _results;
  };

  exports.utility = utility;

  exports.watcher = watcher;

}).call(this);

/*
//@ sourceMappingURL=index.map
*/

})})()