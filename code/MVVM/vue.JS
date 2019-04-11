class Vue{

  /*
  * MVVM模式， Object.defineProperty 这个API只有在从视图层数据发生改变时，数据更新到Model层，再从Model层更新到View层时起作用
  * 1. 初始化视图，实现M-->V
  * 2. 视图层发生变化， 数据更新到Model层， 再从Model层更新到View层
  */
  // 接收参数
  constructor(option){
    this.option = option;
    this.$data = option.data;
    this.el = document.querySelector(option.el);
    // 初始化一个订阅者容器
    this._director = {}

    this.Observer(this.$data);
    this.Compile(this.el);
  }
  // 实现数据劫持、通知数据变化
  Observer(data){
    // 数据劫持
    // Vue更新数据的时候是局部刷新，当改变myBx时只会刷新myBox的数据，所以this._director的格式应该是{myText:[订阅者1，订阅者2],myBox:[订阅者1，订阅者2]}
    for (let key in data) {
      this._director[key] = [];
      let val = this.$data[key]; // 不能使用var 否则会出现Object.defineProperty中的val为最后一次获取到的this.$data[key]
      // 获取订阅者实例
      let watch = this._director[key];
      // 数据变化通知订阅者 更新视图
      Object.defineProperty(this.$data,key,{
        get:function () {
          return val
        },
        set:function (newVal) {
          if (newVal !== val){
            val = newVal;
            watch.forEach(element => {
              element.update();
            });
          }
        }
      });
    }
  }
  // 解析指令、初始化视图、订阅数据变化并绑定更新函数
  Compile(el){
    let nodes = el.children;
    for(let i = 0;i<nodes.length;i++){
      let node = nodes[i];
      // 递归循环
      if(node.children.length){
        this.Compile(node);
      }
      // 解析v-text指令
      if(node.hasAttribute('v-text')){
        let attrT = node.getAttribute('v-text');
        // 添加订阅者
        this._director[attrT].push(new Watcher(node,this,attrT,'innerHTML'));
      }
      // 解析v-model指令
      if (node.hasAttribute('v-model')) {
        let attrM = node.getAttribute('v-model');
        // 添加订阅者
        this._director[attrM].push(new Watcher(node, this, attrM, 'value'));
        // 绑定数据监听 更新到M
        node.addEventListener('input', (function (event) {
          return function (event) {
            this.$data[attrM] = event.target.value;
          }
        })().bind(this));
      }
    }
  }
}

// 订阅者
class Watcher{
  constructor(el,vm,exp,attr){
    this.el = el;
    this.vm = vm;
    this.exp = exp;
    this.attr = attr;
    // 初始化视图
    this.update();
  }
  update(){
    this.el[this.attr] = this.vm.$data[this.exp]
  }
}