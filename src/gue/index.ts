export interface GueOptions {
  data: () => { [key: string]: unknown }

  computed: { [key: string]: () => any }

  watch: { [key: string]: (oldValue: any, newValue: any) => void }
}

// 全局的订阅者实例
let subscriber = null;
let subscriberStack = [];

let subscribers = {
  data: {},
  computed: {}
};

(<any>window).subscribers = subscribers;

class Gue {
  _data: any;

  [key: string]: any;

  constructor(options: GueOptions) {
    let $data = options.data();
    let vm = this;


    // 处理watch
    let $watches = options.watch;
    let _watches = vm._watches = Object.create(null);

    let keys = Object.getOwnPropertyNames($watches);

    keys.forEach(key => {
      _watches[key] = $watches[key].bind(vm);
    });

    // 处理data
    Object.defineProperty(vm, "_data", {
      value: new Proxy($data, {
        get(target: { [p: string]: unknown }, p: string | number, receiver: any): any {
          // 求值+依赖(只收集一次)
          if (subscriber) {
            subscribers.data.hasOwnProperty(p) ?
              subscribers.data[p].push(subscriber) :
              subscribers.data[p] = [subscriber];
          }
          return target[p];
        },
        set(target: { [p: string]: unknown }, p: string | number, value: any, receiver: any): boolean {
          let oldValue = target[p], newValue = value;
          // 提前通知watch
          if (vm._watches[p]) {
            vm._watches[p].call(vm, newValue, oldValue);
          }
          // 通知
          target[p] = newValue;
          subscribers.data[p] && subscribers.data[p].forEach($subscriber => {
            // 通知
            $subscriber.update();
          });
          return true;
        }
      })
    });

    // 将state的访问权直接代理到vm上
    keys = Object.getOwnPropertyNames($data);

    keys.forEach(key => {
      Object.defineProperty(vm, key, {
        get(): any {
          return vm._data[key]
        },
        set(v: any): void {
          vm._data[key] = v;
        },
      })
    });
    // 处理data 结束

    // 处理computed
    let $computed = options.computed;
    let _computed = vm._computed = Object.create(null);

    keys = Object.getOwnPropertyNames($computed);

    keys.forEach(key => {

      // computed函数相当于计算属性的set过程，因此在这里也要进行通知
      _computed[key] = {
        cachedValue: null,
        getter: function wrappedComputed() {
          // 在进行实际的求值
          return $computed[key].call(vm);
        }
      };

      Object.defineProperty(vm, key, {
        get(): any {
          // 收集依赖
          if (subscriber) {
            subscribers.computed.hasOwnProperty(key) ?
              subscribers.computed[key].push(subscriber) :
              subscribers.computed[key] = [subscriber];
          }

          // 求值
          let newValue;

          // 依赖别人
          if (subscriber) {
            // 有人占用
            subscriberStack.push(subscriber);
            subscriber = {
              self: null,
              update() {
                // 提前通知watch
                if (vm._watches[key]) {
                  vm._watches[key].call(vm, _computed[key].getter(), _computed[key].cachedValue);
                }
                // 通知computed的订阅者
                subscribers.computed.hasOwnProperty(key) && subscribers.computed[key].forEach($subscriber => {
                  $subscriber.update();
                })
              }
            };
          }
          newValue = vm._computed[key].getter();
          vm._computed[key].cachedValue = newValue;
          if(subscriberStack.length !== 0) {
            subscriber = subscriberStack.pop();
          }

          return newValue;
        }
      })
    });
    // 处理computed 结束


  }

  $mount(elementOrSelector: string) {
    let $element = document.querySelector(elementOrSelector);
    let template = $element.innerHTML;
    let vm = this;

    vm.$el = $element;
    vm.$template = template;

    let reg = /^{{(.*)}}$/g;

    template.match(reg);

    let dependency = RegExp.$1;

    // 如果在get过程中订阅，那就需要提前记录好订阅者
    subscriber = {
      self: $element,
      target: dependency,
      update() {
        $element.innerHTML = vm[dependency];
      }
    };
    subscriber.update();
    subscriber = null;
    return vm;
  }
}

export default Gue;