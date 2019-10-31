"use strict";

var wonka = require("wonka");

var graphql = require("graphql");

var react = require("react");

function _extends() {
  return (_extends = Object.assign || function(target) {
    for (var i = 1; i < arguments.length; i++) {
      var source = arguments[i];
      for (var key in source) {
        if (Object.prototype.hasOwnProperty.call(source, key)) {
          target[key] = source[key];
        }
      }
    }
    return target;
  }).apply(this, arguments);
}

var generateErrorMessage = function(networkErr, graphQlErrs) {
  var error = "";
  if (void 0 !== networkErr) {
    return error = "[Network] " + networkErr.message;
  }
  if (void 0 !== graphQlErrs) {
    graphQlErrs.forEach(function _ref(err) {
      error += "[GraphQL] " + err.message + "\n";
    });
  }
  return error.trim();
};

var rehydrateGraphQlError = function(error) {
  if ("string" == typeof error) {
    return new graphql.GraphQLError(error);
  } else if ("object" == typeof error && error.message) {
    return new graphql.GraphQLError(error.message, error.nodes, error.source, error.positions, error.path, error.originalError, error.extensions || {});
  } else {
    return error;
  }
};

function _toString() {
  return this.message;
}

var CombinedError = function(Error) {
  function CombinedError(ref) {
    var networkError = ref.networkError;
    var response = ref.response;
    var normalizedGraphQLErrors = (ref.graphQLErrors || []).map(rehydrateGraphQlError);
    var message = generateErrorMessage(networkError, normalizedGraphQLErrors);
    Error.call(this, message);
    this.name = "CombinedError";
    this.message = message;
    this.graphQLErrors = normalizedGraphQLErrors;
    this.networkError = networkError;
    this.response = response;
  }
  if (Error) {
    CombinedError.__proto__ = Error;
  }
  (CombinedError.prototype = Object.create(Error && Error.prototype)).constructor = CombinedError;
  CombinedError.prototype.toString = _toString;
  return CombinedError;
}(Error);

var phash = function(h, x) {
  h |= 0;
  for (var i = 0, l = 0 | x.length; i < l; i++) {
    h = (h << 5) + h + x.charCodeAt(i);
  }
  return h;
};

var seen = new Set();

var stringify = function(x) {
  if (void 0 === x) {
    return "";
  } else if ("number" == typeof x) {
    return isFinite(x) ? "" + x : "null";
  } else if ("object" != typeof x) {
    return JSON.stringify(x);
  } else if (null === x) {
    return "null";
  }
  var out = "";
  if (Array.isArray(x)) {
    out = "[";
    for (var i = 0, l = x.length; i < l; i++) {
      if (i > 0) {
        out += ",";
      }
      var value = stringify(x[i]);
      out += value.length > 0 ? value : "null";
    }
    return out += "]";
  } else if (seen.has(x)) {
    throw new TypeError("Converting circular structure to JSON");
  }
  var keys = Object.keys(x).sort();
  seen.add(x);
  out = "{";
  for (var i$1 = 0, l$1 = keys.length; i$1 < l$1; i$1++) {
    var key = keys[i$1];
    var value$1 = stringify(x[key]);
    if (0 !== value$1.length) {
      if (out.length > 1) {
        out += ",";
      }
      out += stringify(key) + ":" + value$1;
    }
  }
  seen.delete(x);
  return out += "}";
};

var stringifyVariables = function(x) {
  seen.clear();
  return stringify(x);
};

var hashQuery = function(q) {
  return x = q.replace(/[\s,]+/g, " ").trim(), phash(5381, x) >>> 0;
  var x;
};

var docs = Object.create(null);

var createRequest = function(q, vars) {
  var key;
  var query;
  if ("string" == typeof q) {
    key = hashQuery(q);
    query = void 0 !== docs[key] ? docs[key] : graphql.parse(q);
  } else if (void 0 !== q.__key) {
    key = q.__key;
    query = q;
  } else {
    key = hashQuery(graphql.print(q));
    query = void 0 !== docs[key] ? docs[key] : q;
  }
  docs[key] = query;
  query.__key = key;
  return {
    key: vars ? phash(key, stringifyVariables(vars)) >>> 0 : key,
    query: query,
    variables: vars || {}
  };
};

var addMetadata = function(source, meta) {
  return _extends({}, source, {
    context: _extends({}, source.context, {
      meta: _extends({}, source.context.meta, meta)
    })
  });
};

var makeResult = function(operation, result, response) {
  return {
    operation: operation,
    data: result.data,
    error: Array.isArray(result.errors) ? new CombinedError({
      graphQLErrors: result.errors,
      response: response
    }) : void 0,
    extensions: "object" == typeof result.extensions && null !== result.extensions ? result.extensions : void 0
  };
};

var makeErrorResult = function(operation, error, response) {
  return {
    operation: operation,
    data: void 0,
    error: new CombinedError({
      networkError: error,
      response: response
    }),
    extensions: void 0
  };
};

var collectTypes = function(obj, types) {
  if (void 0 === types) {
    types = [];
  }
  if (Array.isArray(obj)) {
    obj.forEach(function _ref(inner) {
      collectTypes(inner, types);
    });
  } else if ("object" == typeof obj && null !== obj) {
    for (var key in obj) {
      if (Object.prototype.hasOwnProperty.call(obj, key)) {
        var val = obj[key];
        if ("__typename" === key && "string" == typeof val) {
          types.push(val);
        } else if ("object" == typeof val && null !== val) {
          collectTypes(val, types);
        }
      }
    }
  }
  return types;
};

function _ref2(v, i, a) {
  return a.indexOf(v) === i;
}

var collectTypesFromResponse = function(response) {
  return collectTypes(response).filter(_ref2);
};

function _ref3(s) {
  return "Field" === s.kind && "__typename" === s.name.value;
}

var formatNode = function(n) {
  if (void 0 === n.selectionSet) {
    return !1;
  }
  if (n.selectionSet.selections.some(_ref3)) {
    return n;
  }
  return _extends({}, n, {
    selectionSet: _extends({}, n.selectionSet, {
      selections: n.selectionSet.selections.concat([ {
        kind: graphql.Kind.FIELD,
        name: {
          kind: graphql.Kind.NAME,
          value: "__typename"
        }
      } ])
    })
  });
};

var formatDocument = function(astNode) {
  return graphql.visit(astNode, {
    Field: formatNode,
    InlineFragment: formatNode
  });
};

function withPromise(source$) {
  source$.toPromise = function() {
    return wonka.toPromise(wonka.take(1)(source$));
  };
  return source$;
}

var noop = function() {};

var shouldSkip = function(ref) {
  var operationName = ref.operationName;
  return "subscription" !== operationName && "query" !== operationName;
};

function _ref(x) {
  return "" + x;
}

var serializeResult = function(ref) {
  var error = ref.error;
  var result = {
    data: ref.data,
    error: void 0
  };
  if (void 0 !== error) {
    result.error = {
      networkError: "" + error.networkError,
      graphQLErrors: error.graphQLErrors.map(_ref)
    };
  }
  return result;
};

var deserializeResult = function(operation, result) {
  var error = result.error;
  var deserialized = {
    operation: operation,
    data: result.data,
    extensions: void 0,
    error: void 0
  };
  if (void 0 !== error) {
    deserialized.error = new CombinedError({
      networkError: new Error(error.networkError),
      graphQLErrors: error.graphQLErrors
    });
  }
  return deserialized;
};

var shouldSkip$1 = function(ref) {
  var operationName = ref.operationName;
  return "mutation" !== operationName && "query" !== operationName;
};

function _ref$1(operation) {
  return _extends({}, operation, {
    query: formatDocument(operation.query)
  });
}

function _ref5(op) {
  return addMetadata(op, {
    cacheOutcome: "miss"
  });
}

function _ref7(op) {
  return shouldSkip$1(op);
}

var cacheExchange = function(ref) {
  var forward = ref.forward;
  var client = ref.client;
  var resultCache = new Map();
  var operationCache = Object.create(null);
  var mapTypeNames = _ref$1;
  var handleAfterMutation = afterMutation(resultCache, operationCache, client);
  var handleAfterQuery = afterQuery(resultCache, operationCache);
  var isOperationCached = function(operation) {
    var requestPolicy = operation.context.requestPolicy;
    return "query" === operation.operationName && "network-only" !== requestPolicy && ("cache-only" === requestPolicy || resultCache.has(operation.key));
  };
  function _ref2(operation) {
    var cachedResult = resultCache.get(operation.key);
    if ("cache-and-network" === operation.context.requestPolicy) {
      reexecuteOperation(client, operation);
    }
    return _extends({}, cachedResult, {
      operation: addMetadata(operation, {
        cacheOutcome: cachedResult ? "hit" : "miss"
      })
    });
  }
  function _ref3(op) {
    return !shouldSkip$1(op) && isOperationCached(op);
  }
  function _ref4(response) {
    if (response.operation && "mutation" === response.operation.operationName) {
      handleAfterMutation(response);
    } else if (response.operation && "query" === response.operation.operationName) {
      handleAfterQuery(response);
    }
  }
  function _ref6(op) {
    return !shouldSkip$1(op) && !isOperationCached(op);
  }
  return function(ops$) {
    var sharedOps$ = wonka.share(ops$);
    var cachedOps$ = wonka.map(_ref2)(wonka.filter(_ref3)(sharedOps$));
    var forwardedOps$ = wonka.tap(_ref4)(forward(wonka.map(_ref5)(wonka.merge([ wonka.map(mapTypeNames)(wonka.filter(_ref6)(sharedOps$)), wonka.filter(_ref7)(sharedOps$) ]))));
    return wonka.merge([ cachedOps$, forwardedOps$ ]);
  };
};

var reexecuteOperation = function(client, operation) {
  return client.reexecuteOperation(_extends({}, operation, {
    context: _extends({}, operation.context, {
      requestPolicy: "network-only"
    })
  }));
};

var afterMutation = function(resultCache, operationCache, client) {
  function _ref9(key) {
    if (resultCache.has(key)) {
      var operation = resultCache.get(key).operation;
      resultCache.delete(key);
      reexecuteOperation(client, operation);
    }
  }
  return function(response) {
    var pendingOperations = new Set();
    function _ref8(key) {
      pendingOperations.add(key);
    }
    collectTypesFromResponse(response.data).forEach(function(typeName) {
      var operations = operationCache[typeName] || (operationCache[typeName] = new Set());
      operations.forEach(_ref8);
      operations.clear();
    });
    pendingOperations.forEach(_ref9);
  };
};

var afterQuery = function(resultCache, operationCache) {
  return function(response) {
    var operation = response.operation;
    var data = response.data;
    if (null == data) {
      return;
    }
    resultCache.set(operation.key, {
      operation: operation,
      data: data,
      error: response.error
    });
    collectTypesFromResponse(response.data).forEach(function(typeName) {
      (operationCache[typeName] || (operationCache[typeName] = new Set())).add(operation.key);
    });
  };
};

var isSubscriptionOperation = function(operation) {
  return "subscription" === operation.operationName;
};

function _ref$2(op) {
  return !isSubscriptionOperation(op);
}

function _ref2$1(result) {
  return console.log("[Exchange debug]: Completed operation: ", result);
}

function _ref3$1(op) {
  return console.log("[Exchange debug]: Incoming operation: ", op);
}

var dedupExchange = function(ref) {
  var forward = ref.forward;
  var inFlightKeys = new Set();
  var filterIncomingOperation = function(operation) {
    var key = operation.key;
    var operationName = operation.operationName;
    if ("teardown" === operationName) {
      inFlightKeys.delete(key);
      return !0;
    } else if ("query" !== operationName) {
      return !0;
    }
    var isInFlight = inFlightKeys.has(key);
    inFlightKeys.add(key);
    return !isInFlight;
  };
  var afterOperationResult = function(ref) {
    inFlightKeys.delete(ref.operation.key);
  };
  return function(ops$) {
    var forward$ = wonka.filter(filterIncomingOperation)(ops$);
    return wonka.tap(afterOperationResult)(forward(forward$));
  };
};

function _ref$3(operation) {
  var operationName = operation.operationName;
  return "query" === operationName || "mutation" === operationName;
}

var fetchExchange = function(ref) {
  var forward = ref.forward;
  var isOperationFetchable = _ref$3;
  function _ref2(op) {
    return !isOperationFetchable(op);
  }
  return function(ops$) {
    var sharedOps$ = wonka.share(ops$);
    var fetchResults$ = wonka.mergeMap(function(operation) {
      var key = operation.key;
      var teardown$ = wonka.filter(function(op) {
        return "teardown" === op.operationName && op.key === key;
      })(sharedOps$);
      return wonka.takeUntil(teardown$)(createFetchSource(operation));
    })(wonka.filter(isOperationFetchable)(sharedOps$));
    var forward$ = forward(wonka.filter(_ref2)(sharedOps$));
    return wonka.merge([ fetchResults$, forward$ ]);
  };
};

function _ref3$2(node) {
  return node.kind === graphql.Kind.OPERATION_DEFINITION && node.name;
}

var createFetchSource = function(operation) {
  if ("production" !== process.env.NODE_ENV && "subscription" === operation.operationName) {
    throw new Error("Received a subscription operation in the httpExchange. You are probably trying to create a subscription. Have you added a subscriptionExchange?");
  }
  return wonka.make(function(ref) {
    var next = ref[0];
    var complete = ref[1];
    var abortController = "undefined" != typeof AbortController ? new AbortController() : void 0;
    var context = operation.context;
    var extraOptions = "function" == typeof context.fetchOptions ? context.fetchOptions() : context.fetchOptions || {};
    var operationName = void 0 !== (node = operation.query.definitions.find(_ref3$2)) && node.name ? node.name.value : null;
    var node;
    var body = {
      query: graphql.print(operation.query),
      variables: operation.variables
    };
    if (null !== operationName) {
      body.operationName = operationName;
    }
    var fetchOptions = _extends({
      body: JSON.stringify(body),
      method: "POST"
    }, extraOptions, {
      headers: _extends({
        "content-type": "application/json"
      }, extraOptions.headers),
      signal: void 0 !== abortController ? abortController.signal : void 0
    });
    executeFetch(operation, fetchOptions).then(function(result) {
      if (void 0 !== result) {
        next(result);
      }
      complete();
    });
    return function() {
      if (void 0 !== abortController) {
        abortController.abort();
      }
    };
  });
};

var executeFetch = function(operation, opts) {
  var ref = operation.context;
  var response;
  return (ref.fetch || fetch)(ref.url, opts).then(function(res) {
    var status = res.status;
    response = res;
    if (status < 200 || status >= ("manual" === opts.redirect ? 400 : 300)) {
      throw new Error(res.statusText);
    } else {
      return res.json();
    }
  }).then(function(result) {
    return makeResult(operation, result, response);
  }).catch(function(err) {
    if ("AbortError" !== err.name) {
      return makeErrorResult(operation, err, response);
    }
  });
};

function _ref$4() {
  return !1;
}

function _ref2$2(ref) {
  var operationName = ref.operationName;
  if ("teardown" !== operationName && "production" !== process.env.NODE_ENV) {
    console.warn('No exchange has handled operations of type "' + operationName + "\". Check whether you've added an exchange responsible for these operations.");
  }
}

var fallbackExchangeIO = function(ops$) {
  return wonka.filter(_ref$4)(wonka.tap(_ref2$2)(ops$));
};

var composeExchanges = function(exchanges) {
  if (1 === exchanges.length) {
    return exchanges[0];
  }
  return function(ref) {
    var client = ref.client;
    return exchanges.reduceRight(function(forward, exchange) {
      return exchange({
        client: client,
        forward: forward
      });
    }, ref.forward);
  };
};

var defaultExchanges = [ dedupExchange, cacheExchange, fetchExchange ];

var createClient = function(opts) {
  return new Client(opts);
};

var Client = function Client(opts) {
  var this$1 = this;
  this.activeOperations = Object.create(null);
  this.createOperationContext = function(opts) {
    var requestPolicy = (opts || {}).requestPolicy;
    if (void 0 === requestPolicy) {
      requestPolicy = this$1.requestPolicy;
    }
    return _extends({
      url: this$1.url,
      fetchOptions: this$1.fetchOptions,
      fetch: this$1.fetch
    }, opts, {
      requestPolicy: requestPolicy
    });
  };
  this.createRequestOperation = function(type, ref, opts) {
    return {
      key: ref.key,
      query: ref.query,
      variables: ref.variables,
      operationName: type,
      context: this$1.createOperationContext(opts)
    };
  };
  this.reexecuteOperation = function(operation) {
    if ((this$1.activeOperations[operation.key] || 0) > 0) {
      this$1.dispatchOperation(operation);
    }
  };
  this.executeQuery = function(query, opts) {
    var operation = this$1.createRequestOperation("query", query, opts);
    var response$ = this$1.executeRequestOperation(operation);
    var pollInterval = operation.context.pollInterval;
    if (pollInterval) {
      return wonka.switchMap(function _ref() {
        return response$;
      })(wonka.merge([ wonka.fromValue(0), wonka.interval(pollInterval) ]));
    }
    return response$;
  };
  this.executeSubscription = function(query, opts) {
    var operation = this$1.createRequestOperation("subscription", query, opts);
    return this$1.executeRequestOperation(operation);
  };
  this.executeMutation = function(query, opts) {
    var operation = this$1.createRequestOperation("mutation", query, opts);
    return this$1.executeRequestOperation(operation);
  };
  this.url = opts.url;
  this.fetchOptions = opts.fetchOptions;
  this.fetch = opts.fetch;
  this.suspense = !!opts.suspense;
  this.requestPolicy = opts.requestPolicy || "cache-first";
  var ref = wonka.makeSubject();
  var nextOperation = ref[1];
  this.operations$ = ref[0];
  var queuedOperations = [];
  var isDispatching = !1;
  this.dispatchOperation = function(operation) {
    queuedOperations.push(operation);
    if (!isDispatching) {
      isDispatching = !0;
      var queued;
      while (void 0 !== (queued = queuedOperations.shift())) {
        nextOperation(queued);
      }
      isDispatching = !1;
    }
  };
  this.exchange = composeExchanges(void 0 !== opts.exchanges ? opts.exchanges : defaultExchanges);
  this.results$ = wonka.share(this.exchange({
    client: this,
    forward: fallbackExchangeIO
  })(this.operations$));
};

Client.prototype.onOperationStart = function onOperationStart(operation) {
  var key = operation.key;
  this.activeOperations[key] = (this.activeOperations[key] || 0) + 1;
  this.dispatchOperation(operation);
};

Client.prototype.onOperationEnd = function onOperationEnd(operation) {
  var key = operation.key;
  var prevActive = this.activeOperations[key] || 0;
  if ((this.activeOperations[key] = prevActive <= 0 ? 0 : prevActive - 1) <= 0) {
    this.dispatchOperation(_extends({}, operation, {
      operationName: "teardown"
    }));
  }
};

Client.prototype.executeRequestOperation = function executeRequestOperation(operation) {
  var this$1 = this;
  var key = operation.key;
  var operationName = operation.operationName;
  var operationResults$ = wonka.filter(function(res) {
    return res.operation.key === key;
  })(this.results$);
  if ("mutation" === operationName) {
    return wonka.take(1)(wonka.onStart(function _ref2() {
      return this$1.dispatchOperation(operation);
    })(operationResults$));
  }
  var teardown$ = wonka.filter(function(op) {
    return "teardown" === op.operationName && op.key === key;
  })(this.operations$);
  var result$ = wonka.onEnd(function() {
    return this$1.onOperationEnd(operation);
  })(wonka.onStart(function() {
    return this$1.onOperationStart(operation);
  })(wonka.takeUntil(teardown$)(operationResults$)));
  return (operation.context.suspense || this.suspense) && "query" === operationName ? (source = result$, 
  wonka.make(function(ref) {
    var push = ref[0];
    var end = ref[1];
    var isCancelled = !1;
    var resolveSuspense;
    var synchronousResult;
    var teardown = wonka.subscribe(function(value) {
      if (void 0 === resolveSuspense) {
        synchronousResult = value;
      } else if (!isCancelled) {
        resolveSuspense(value);
        end();
        teardown();
      }
    })(wonka.onEnd(end)(wonka.onPush(push)(source)))[0];
    if (void 0 === synchronousResult) {
      throw new Promise(function _ref(resolve) {
        resolveSuspense = resolve;
      });
    }
    return function() {
      isCancelled = !0;
      teardown();
    };
  })) : result$;
  var source;
};

Client.prototype.query = function query(query$1, variables, context) {
  if (!context || "boolean" != typeof context.suspense) {
    context = _extends({}, context, {
      suspense: !1
    });
  }
  return withPromise(this.executeQuery(createRequest(query$1, variables), context));
};

Client.prototype.mutation = function mutation(query, variables, context) {
  return withPromise(this.executeMutation(createRequest(query, variables), context));
};

var defaultClient = createClient({
  url: "/graphql"
});

var Context = react.createContext(defaultClient);

var Provider = Context.Provider;

var Consumer = Context.Consumer;

var hasWarnedAboutDefault = !1;

var useClient = function(overrideClient) {
  var client = react.useContext(Context);
  if (overrideClient) {
    return overrideClient;
  }
  if ("production" !== process.env.NODE_ENV && client === defaultClient && !hasWarnedAboutDefault) {
    hasWarnedAboutDefault = !0;
    console.warn("Default Client: No client has been specified using urql's Provider.This means that urql will be falling back to defaults including making requests to `/graphql`.\nIf that's not what you want, please create a client and add a Provider.");
  }
  return client;
};

var useIsomorphicLayoutEffect = "undefined" != typeof window ? react.useLayoutEffect : react.useEffect;

var useImmediateState = function(init) {
  var isMounted = react.useRef(!1);
  var ref = react.useState(init);
  var state = ref[0];
  var setState = ref[1];
  var updateState = react.useCallback(function(action) {
    if (!isMounted.current) {
      var newState = "function" == typeof action ? action(state) : action;
      _extends(state, newState);
    } else {
      setState(action);
    }
  }, []);
  function _ref() {
    isMounted.current = !1;
  }
  useIsomorphicLayoutEffect(function() {
    isMounted.current = !0;
    return _ref;
  }, []);
  return [ state, updateState ];
};

var useMutation = function(query, client) {
  var _client = useClient(client);
  var ref = useImmediateState({
    fetching: !1,
    error: void 0,
    data: void 0,
    extensions: void 0
  });
  var setState = ref[1];
  function _ref(result) {
    setState({
      fetching: !1,
      data: result.data,
      error: result.error,
      extensions: result.extensions
    });
    return result;
  }
  return [ ref[0], react.useCallback(function(variables, context) {
    setState({
      fetching: !0,
      error: void 0,
      data: void 0,
      extensions: void 0
    });
    var request = createRequest(query, variables);
    return wonka.toPromise(_client.executeMutation(request, context || {})).then(_ref);
  }, [ _client, query, setState ]) ];
};

var useRequest = function(query, variables) {
  var prev = react.useRef(void 0);
  return react.useMemo(function() {
    var request = createRequest(query, variables);
    if (void 0 !== prev.current && prev.current.key === request.key) {
      return prev.current;
    } else {
      prev.current = request;
      return request;
    }
  }, [ query, variables ]);
};

var useImmediateEffect = function(effect, changes) {
  var teardown = react.useRef(noop);
  var isMounted = react.useRef(!1);
  if (!isMounted.current) {
    teardown.current();
    teardown.current = effect() || noop;
  }
  react.useEffect(function() {
    return isMounted.current ? effect() : (isMounted.current = !0, teardown.current);
  }, changes);
};

function _ref$5(s) {
  return _extends({}, s, {
    fetching: !0
  });
}

function _ref3$3(s) {
  return _extends({}, s, {
    fetching: !1
  });
}

function _ref5$1(s) {
  return _extends({}, s, {
    fetching: !1
  });
}

var useQuery = function(args) {
  var unsubscribe = react.useRef(noop);
  var client = useClient(args.client);
  var ref = useImmediateState({
    fetching: !1,
    data: void 0,
    error: void 0,
    extensions: void 0
  });
  var state = ref[0];
  var setState = ref[1];
  var request = useRequest(args.query, args.variables);
  function _ref2(ref) {
    setState({
      fetching: !1,
      data: ref.data,
      error: ref.error,
      extensions: ref.extensions
    });
  }
  function _ref4() {
    return setState(_ref3$3);
  }
  var executeQuery = react.useCallback(function(opts) {
    var assign;
    unsubscribe.current();
    setState(_ref$5);
    assign = wonka.subscribe(_ref2)(wonka.onEnd(_ref4)(client.executeQuery(request, _extends({
      requestPolicy: args.requestPolicy,
      pollInterval: args.pollInterval
    }, args.context, opts)))), unsubscribe.current = assign[0];
  }, [ args.context, args.requestPolicy, args.pollInterval, client, request, setState ]);
  function _ref6() {
    return unsubscribe.current();
  }
  useImmediateEffect(function() {
    if (args.pause) {
      unsubscribe.current();
      setState(_ref5$1);
      return noop;
    }
    executeQuery();
    return _ref6;
  }, [ executeQuery, args.pause, setState ]);
  return [ state, executeQuery ];
};

function _ref$6(s) {
  return _extends({}, s, {
    fetching: !0
  });
}

function _ref3$4(s) {
  return _extends({}, s, {
    fetching: !1
  });
}

function _ref5$2(s) {
  return _extends({}, s, {
    fetching: !1
  });
}

var useSubscription = function(args, handler) {
  var unsubscribe = react.useRef(noop);
  var handlerRef = react.useRef(handler);
  var client = useClient(args.client);
  var ref = useImmediateState({
    fetching: !1,
    error: void 0,
    data: void 0,
    extensions: void 0
  });
  var state = ref[0];
  var setState = ref[1];
  handlerRef.current = handler;
  var request = useRequest(args.query, args.variables);
  function _ref2(ref) {
    var data = ref.data;
    var error = ref.error;
    var extensions = ref.extensions;
    var handler = handlerRef.current;
    setState(function(s) {
      return {
        fetching: !0,
        data: "function" == typeof handler ? handler(s.data, data) : data,
        error: error,
        extensions: extensions
      };
    });
  }
  function _ref4() {
    return setState(_ref3$4);
  }
  var executeSubscription = react.useCallback(function(opts) {
    var assign;
    unsubscribe.current();
    setState(_ref$6);
    assign = wonka.subscribe(_ref2)(wonka.onEnd(_ref4)(client.executeSubscription(request, _extends({}, args.context, opts)))), 
    unsubscribe.current = assign[0];
  }, [ client, request, setState, args.context ]);
  function _ref6() {
    return unsubscribe.current();
  }
  useImmediateEffect(function() {
    if (args.pause) {
      unsubscribe.current();
      setState(_ref5$2);
      return noop;
    }
    executeSubscription();
    return _ref6;
  }, [ executeSubscription, args.pause, setState ]);
  return [ state, executeSubscription ];
};

exports.Client = Client;

exports.CombinedError = CombinedError;

exports.Consumer = Consumer;

exports.Context = Context;

exports.Mutation = function Mutation(ref) {
  var children = ref.children;
  var ref$1 = useMutation(ref.query);
  return children(_extends({}, ref$1[0], {
    executeMutation: ref$1[1]
  }));
};

exports.Provider = Provider;

exports.Query = function Query(props) {
  var ref = useQuery(props);
  return props.children(_extends({}, ref[0], {
    executeQuery: ref[1]
  }));
};

exports.Subscription = function Subscription(props) {
  var ref = useSubscription(props, props.handler);
  return props.children(_extends({}, ref[0], {
    executeSubscription: ref[1]
  }));
};

exports.cacheExchange = cacheExchange;

exports.composeExchanges = composeExchanges;

exports.createClient = createClient;

exports.createRequest = createRequest;

exports.debugExchange = function(ref) {
  var forward = ref.forward;
  if ("production" === process.env.NODE_ENV) {
    return function _ref(ops$) {
      return forward(ops$);
    };
  } else {
    return function _ref4(ops$) {
      return wonka.tap(_ref2$1)(forward(wonka.tap(_ref3$1)(ops$)));
    };
  }
};

exports.dedupExchange = dedupExchange;

exports.defaultExchanges = defaultExchanges;

exports.fallbackExchangeIO = fallbackExchangeIO;

exports.fetchExchange = fetchExchange;

exports.formatDocument = formatDocument;

exports.makeErrorResult = makeErrorResult;

exports.makeResult = makeResult;

exports.ssrExchange = function(params) {
  var data = {};
  var isCached = function(operation) {
    return !shouldSkip(operation) && void 0 !== data[operation.key];
  };
  function _ref2(op) {
    return !isCached(op);
  }
  function _ref3(op) {
    return deserializeResult(op, data[op.key]);
  }
  function _ref4(op) {
    return isCached(op);
  }
  function _ref5(result) {
    var operation = result.operation;
    if (!shouldSkip(operation)) {
      var serialized = serializeResult(result);
      data[operation.key] = serialized;
    }
  }
  function _ref6(result) {
    delete data[result.operation.key];
  }
  var ssr = function(ref) {
    var client = ref.client;
    var forward = ref.forward;
    return function(ops$) {
      var isClient = params && "boolean" == typeof params.isClient ? !!params.isClient : !client.suspense;
      var sharedOps$ = wonka.share(ops$);
      var forwardedOps$ = forward(wonka.filter(_ref2)(sharedOps$));
      var cachedOps$ = wonka.map(_ref3)(wonka.filter(_ref4)(sharedOps$));
      if (!isClient) {
        forwardedOps$ = wonka.tap(_ref5)(forwardedOps$);
      } else {
        cachedOps$ = wonka.tap(_ref6)(cachedOps$);
      }
      return wonka.merge([ forwardedOps$, cachedOps$ ]);
    };
  };
  ssr.restoreData = function(restore) {
    return _extends(data, restore);
  };
  ssr.extractData = function() {
    return _extends({}, data);
  };
  if (params && params.initialState) {
    ssr.restoreData(params.initialState);
  }
  return ssr;
};

exports.stringifyVariables = stringifyVariables;

exports.subscriptionExchange = function(ref) {
  var forwardSubscription = ref.forwardSubscription;
  return function(ref) {
    var client = ref.client;
    var forward = ref.forward;
    return function(ops$) {
      var sharedOps$ = wonka.share(ops$);
      var subscriptionResults$ = wonka.mergeMap(function(operation) {
        var key = operation.key;
        var teardown$ = wonka.filter(function(op) {
          return "teardown" === op.operationName && op.key === key;
        })(sharedOps$);
        return wonka.takeUntil(teardown$)(function(operation) {
          var observableish = forwardSubscription({
            key: operation.key.toString(36),
            query: graphql.print(operation.query),
            variables: operation.variables,
            context: _extends({}, operation.context)
          });
          return wonka.make(function(ref) {
            var next = ref[0];
            var complete = ref[1];
            var isComplete = !1;
            var sub = observableish.subscribe({
              next: function(result) {
                return next(makeResult(operation, result));
              },
              error: function(err) {
                return next(makeErrorResult(operation, err));
              },
              complete: function() {
                if (!isComplete) {
                  client.reexecuteOperation(_extends({}, operation, {
                    operationName: "teardown"
                  }));
                }
                complete();
              }
            });
            return function() {
              isComplete = !0;
              sub.unsubscribe();
            };
          });
        }(operation));
      })(wonka.filter(isSubscriptionOperation)(sharedOps$));
      var forward$ = forward(wonka.filter(_ref$2)(sharedOps$));
      return wonka.merge([ subscriptionResults$, forward$ ]);
    };
  };
};

exports.useClient = useClient;

exports.useMutation = useMutation;

exports.useQuery = useQuery;

exports.useSubscription = useSubscription;
//# sourceMappingURL=urql.js.map
