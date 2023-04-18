
class Observer {
  private subscriptionID: number = 0;

  private observers: any[] = [];

  protected subscribe(subscriptionEntityName: string, callBack: any) {
    this.observers[this.subscriptionID++] = { callBack, subscriptionEntityName };

    return () => {
      delete this.observers[this.subscriptionID - 1];
    };
  }

  protected notify(entityName: string, entity: any) {
    for (const observer of this.observers) {
      if (entityName === observer.subscriptionEntityName) {
        observer.callBack(entity);
      }
    }
  }
  protected unsubscribeAll() {
    this.observers.splice(0, this.observers.length);
    this.subscriptionID = 0;
  }
}

interface IExecutor {
  (resolve: (value: any) => void, reject: (error: any) => void): void;
}

interface IPromiseConstructor {
  new (executor: IExecutor): CustomPromise;
}

interface ICallBack<T> {
  (value: T): T | void;
}

class PromiseState {
  private _resolvedValue: any = undefined;
  private _rejectedValue: any = undefined;

  constructor() {}

  set resolvedValue(value) {
    this._resolvedValue = value;
  }
  get resolvedValue() {
    return this._resolvedValue;
  }

  set rejectedValue(error) {
    this._rejectedValue = error;
  }

  get rejectedValue() {
    return this._rejectedValue;
  }
}

class PromiseReturnValue<T extends string, U> {
  public PromiseState?: T;
  public PromiseResult?: U;

  constructor(promiseState?: T, promiseResult?: U) {
    this.PromiseState = promiseState || ('pending' as T);
    this.PromiseResult = promiseResult;
  }
}

class Utils {
  //debounce
  static getDebounce<T>(cb: ICallBack<T>, MS: number = 0) {
    let TIME_OUT_ID: ReturnType<typeof setTimeout>;

    return function (args: T) {
      clearTimeout(TIME_OUT_ID);
      TIME_OUT_ID = setTimeout(() => {
        cb(args);
      }, MS);
    };
  }

  static isFunction (target: unknown) {
    return typeof target === 'function'
  }

}

enum promiseState {
  pending = 'pending',
  fulfilled = 'fulfilled',
  rejected = 'rejected',
}

enum entityName {
  resolve = 'resolve',
  reject = 'reject',
}

class CustomPromise extends Observer {
  public then: any;
  public catch: any;

  private state = new PromiseState();

  constructor(executor: IExecutor) {
    super();

    if(!Utils.isFunction(executor)) {
      return
    }

    const debouncedResolveExecutor = Utils.getDebounce(this.resolveExecutor.bind(this));
    const debouncedRejectExecutor = Utils.getDebounce(this.rejectExecutor.bind(this));

    executor(
      (value) => debouncedResolveExecutor(value),
      (error) => debouncedRejectExecutor(error)
    );

    this.then = this.thenExec;
    this.catch = this.catchExec;
  }

  static Resolve(value: unknown) {
    const instance = new CustomPromise((resolve, reject) => {
      resolve(value);
    });

    return instance;
  }

  static Reject(error: unknown) {
    const instance = new CustomPromise((resolve, reject) => {
      reject(error);
    });
    return instance;
  }

  //NOT IMPLEMENTED
  // static All(values: unknown[]) {
  //   let resolved = [];
  //   const instance = new CustomPromise((resolve, reject) => {
  //     for (let promise = 0; promise < values.length; promise++) {
  //       resolved.push(values[promise]);
  //     }
  //     resolve(resolved);
  //   });

  //   return instance;
  // }

  private thenExec(cb: ICallBack<any>) {
    this.subscribe(entityName.resolve, () => {
      try {
        const { resolvedValue } = this.state;
        this.state.resolvedValue = cb(resolvedValue) || resolvedValue;
      } catch (err) {
        this.rejectExecutor(err);
        this.unsubscribeAll();
      }
    });

    return this;
  }

  private catchExec(cb: ICallBack<any>) {
    this.subscribe(entityName.reject, () => {
      const { rejectedValue } = this.state;
      this.state.rejectedValue = cb(rejectedValue) || rejectedValue;
    });

    return this;
  }

  private resolveExecutor(value) {
    this.state.resolvedValue = value; //save resolved value
    this.notify(entityName.resolve, value);
  }

  private rejectExecutor(error: any) {
    this.state.rejectedValue = error; //save rejected value
    this.notify(entityName.reject, error);
  }
}

new CustomPromise(null)

const instance  = new CustomPromise((resolve, reject) => {

  setTimeout(() => resolve(1), 2000);
});


instance.then((result) => {
  console.log(result);
})
