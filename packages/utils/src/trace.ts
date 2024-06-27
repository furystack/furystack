import { ObservableValue } from './observable-value.js'

/**
 * Options object for tracing method calls
 */
export interface TraceMethodOptions<T, TMethod extends (...args: TArgs) => unknown, TArgs extends unknown[]> {
  /**
   * The context object. Can be an instance or a constructor for static methods
   */
  object: T
  /**
   * The method reference that needs to be traced
   */
  method: TMethod
  /**
   * Callback that will be called right before executing the method
   */
  onCalled?: (newValue: TraceMethodCall<TArgs>) => void
  /**
   * Callback that will be called right after the method returns
   */
  onFinished?: (newValue: TraceMethodFinished<ReturnType<TMethod>, TArgs>) => void
  /**
   * Callback that will be called when a method throws an error
   */
  onError?: (newValue: TraceMethodError<TArgs>) => void

  /**
   * The method execution will be awaited if set
   */
  isAsync?: boolean
}

/**
 * Defines a trace method call object
 */
export interface TraceMethodCall<TArgs extends any[]> {
  /**
   * The timestamp when the event occured
   */
  startDateTime: Date

  /**
   * The provided arguments for the call
   */
  methodArguments: TArgs
}

/**
 * Defines a trace event when a method call has been finished
 */
export interface TraceMethodFinished<TReturns, TArgs extends any[]> extends TraceMethodCall<TArgs> {
  returned: TReturns
  finishedDateTime: Date
}

/**
 * Defines a trace event when an error was thrown during a method call
 */
export interface TraceMethodError<TArgs extends any[]> extends TraceMethodCall<TArgs> {
  error: any
  errorDateTime: Date
}

/**
 * Defines a method mapping object
 */
export interface MethodMapping<TReturns, TArgs extends any[]> {
  /**
   * The original method instance
   */
  originalMethod: (...args: TArgs) => TReturns
  /**
   * An observable for distributing the events
   */
  callObservable: ObservableValue<TraceMethodCall<TArgs>>

  finishedObservable: ObservableValue<TraceMethodFinished<any, TArgs>>
  errorObservable: ObservableValue<TraceMethodError<TArgs>>
}

/**
 * Defines an Object Trace mapping
 */
export interface ObjectTrace {
  /**
   * Map about the already wrapped methods
   */
  methodMappings: Map<string, MethodMapping<any, any[]>>
}

/**
 * Helper class that can be used to trace method calls programmatically
 *
 * Usage example:
 * ```ts
 * const methodTracer: IDisposable = Trace.method({
 *     object: myObjectInstance,           // You can define an object constructor for static methods as well
 *     method: myObjectInstance.method,    // The method to be tracked
 *     isAsync: true,                      // if you set to async, method finished will be *await*-ed
 *     onCalled: (traceData) => {
 *         console.log("Method called:", traceData)
 *     },
 *     onFinished: (traceData) => {
 *         console.log("Method call finished:", traceData)
 *     },
 *     onError: (traceData) => {
 *         console.log("Method throwed an error:", traceData)
 *     }
 * });
 * ```
 */
export class Trace {
  private static objectTraces: Map<object, ObjectTrace> = new Map()

  private static getMethodTrace<TArgs extends unknown[], TReturns>(
    object: object,
    method: (...args: TArgs) => TReturns,
  ): MethodMapping<TReturns, TArgs> {
    const objectTrace = this.objectTraces.get(object) as ObjectTrace
    return objectTrace.methodMappings.get(method.name) as any as MethodMapping<TReturns, TArgs>
  }

  private static traceStart<TReturns, TArgs extends unknown[]>(
    methodTrace: MethodMapping<TReturns, TArgs>,
    args: TArgs,
  ) {
    const startDateTime = new Date()
    const traceValue = {
      methodArguments: args,
      startDateTime,
    }
    methodTrace.callObservable.setValue(traceValue)
    return traceValue
  }

  private static traceFinished<TReturns, TArgs extends unknown[]>(
    methodTrace: MethodMapping<TReturns, TArgs>,
    args: TArgs,
    callTrace: TraceMethodCall<TArgs>,
    returned: any,
  ) {
    const finishedTrace: TraceMethodFinished<TReturns, TArgs> = {
      methodArguments: args,
      startDateTime: callTrace.startDateTime,
      finishedDateTime: new Date(),
      returned,
    }
    methodTrace.finishedObservable.setValue(finishedTrace)
  }

  private static traceError<TReturns, TArgs extends any[]>(
    methodTrace: MethodMapping<TReturns, TArgs>,
    args: TArgs,
    callTrace: TraceMethodCall<TArgs>,
    error: any,
  ) {
    const errorTrace: TraceMethodError<TArgs> = {
      methodArguments: args,
      startDateTime: callTrace.startDateTime,
      errorDateTime: new Date(),
      error,
    }
    methodTrace.errorObservable.setValue(errorTrace)
    return errorTrace
  }

  private static callMethod<TReturns, TArgs extends unknown[]>(
    object: object,
    method: (...args: TArgs) => TReturns,
    args: TArgs,
  ) {
    const methodTrace = this.getMethodTrace(object, method)
    const start = this.traceStart(methodTrace, args)
    try {
      const returned = methodTrace.originalMethod.call(object, ...args)
      this.traceFinished(methodTrace, args, start, returned)
      return returned
    } catch (error) {
      this.traceError(methodTrace, args, start, error)
      throw error
    }
  }

  private static async callMethodAsync<TReturns, TArgs extends unknown[]>(
    object: object,
    method: (...args: TArgs) => TReturns,
    args: TArgs,
  ) {
    const methodTrace = this.getMethodTrace(object, method)
    const start = this.traceStart(methodTrace, args)
    try {
      const returned = await methodTrace.originalMethod.call(object, ...args)
      this.traceFinished(methodTrace, args, start, returned)
      return returned
    } catch (error) {
      this.traceError(methodTrace, args, start, error)
      throw error
    }
  }

  /**
   * Creates an observer that will be observe method calls, finishes and errors
   * @param options The options object for the trace
   * @returns the trace object that can be disposed after usage
   */
  public static method<T extends object, TMethod extends (...args: TArgs) => any, TArgs extends any[]>(
    options: TraceMethodOptions<T, TMethod, TArgs>,
  ): Disposable {
    // add object mapping
    if (!this.objectTraces.has(options.object)) {
      this.objectTraces.set(options.object, {
        methodMappings: new Map(),
      })
    }
    // setup override if needed
    if (!(options.method as any).isTraced) {
      const overriddenMethod = options.isAsync
        ? (...args: TArgs) => this.callMethodAsync(options.object, options.method, args)
        : (...args: TArgs) => this.callMethod(options.object, options.method, args)
      Object.defineProperty(overriddenMethod, 'name', { value: options.method.name })
      Object.defineProperty(overriddenMethod, 'isTraced', { value: options.method.name })
      ;(options.object as any)[options.method.name] = overriddenMethod
    }
    const objectTrace = this.objectTraces.get(options.object) as any as ObjectTrace

    // add method mapping if needed
    if (!objectTrace.methodMappings.has(options.method.name)) {
      objectTrace.methodMappings.set(options.method.name, {
        originalMethod: options.method,
        callObservable: new ObservableValue<TraceMethodCall<any>>({
          methodArguments: [],
          startDateTime: new Date(''),
        }),
        finishedObservable: new ObservableValue<TraceMethodFinished<ReturnType<TMethod>, any>>({
          methodArguments: [],
          startDateTime: new Date(''),
          finishedDateTime: new Date(''),
          returned: undefined as ReturnType<TMethod>,
        }),
        errorObservable: new ObservableValue<TraceMethodError<any>>({
          methodArguments: [],
          startDateTime: new Date(''),
          errorDateTime: new Date(''),
          error: undefined,
        }),
      })
    }
    const methodTrace = objectTrace.methodMappings.get(options.method.name) as any as MethodMapping<
      ReturnType<TMethod>,
      TArgs
    >
    const callbacks = [
      options.onCalled && methodTrace.callObservable.subscribe(options.onCalled),
      options.onFinished && methodTrace.finishedObservable.subscribe(options.onFinished),
      options.onError && methodTrace.errorObservable.subscribe(options.onError),
    ]

    // Subscribe and return the observer
    return {
      [Symbol.dispose]: () => callbacks.forEach((c) => c && c[Symbol.dispose]()),
    }
  }
}
