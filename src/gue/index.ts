export interface GueOptions {
  data: () => { [key: string]: unknown }

  computed: { [key: string]: () => any }
}

// 全局的订阅者实例
let subscriber = null;

let subscribers = [];

class Gue {
  _data: any;

  [key: string]: any;

  constructor(options: GueOptions) {
    let $data = options.data();
    let vm = this;

    // 处理data
    Object.defineProperty(vm, "_data", {
      value: new Proxy($data, {
        get(target: { [p: string]: unknown }, p: string | number, receiver: any): any {
          // 求值+依赖(只收集一次)
          if (subscriber) {
            subscribers.push(subscriber);
          }
          return target[p];
        },
        set(target: { [p: string]: unknown }, p: string | number, value: any, receiver: any): boolean {
          // 通知
          target[p] = value;
          subscribers.forEach($subscriber => {
            // 通知
            $subscriber.update();
          });
          return true;
        }
      })
    });

    // 将state的访问权直接代理到vm上
    let keys = Object.getOwnPropertyNames($data);

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
      _computed[key] = $computed[key].bind(this);

      Object.defineProperty(vm, key, {
        get(): any {
          return vm._computed[key]();
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
      update() {
        $element.innerHTML = vm[dependency];
      }
    };
    $element.innerHTML = vm[dependency];
    subscriber = null;
    return vm;
  }
}

export default Gue;