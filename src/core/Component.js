export default class Component{
  $target;
  $state;
  $props;
  constructor($target, $props){
    this.$target = $target;
    this.$props = $props; // $props 할당
    this.setup();
    this.render();
    this.setEvent();
  }
  setup (){};
  mounted () {};
  template(){return '';}
  render(){
    this.$target.innerHTML = this.template();
    this.mounted(); // render 이후에 mounted가 실행된다.
  }
  setEvent(){};
  setState(newState){
    this.$state = {...this.$state, ...newState};
    this.render();
  }

  addEvent(eventType, selector, callback){
    const children = [...this.$target.querySelectorAll(selector)];
    
    // $target 자체에 이벤트를 여러개 걸고.. 들어왔을때 selector로 해당 이벤트가 발생해야하는지 판단!
    // target.classList.contains('deleteBtn')를 대신함
    const isTarget = (target) => children.includes(target) || target.closest(selector);
    this.$target.addEventListener(eventType, event => {
      if(!isTarget(event.target)) return false;
      callback(event);
    })
  }
}