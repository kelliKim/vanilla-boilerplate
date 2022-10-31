# vanilla-boilerplate
a simple vanilla js boilerplate

- [ ] Babel
- [ ] Webpack
- [ ] MVC


- [ ] [Why and How to Use Webpack and Babel with Vanilla JS](https://www.syncfusion.com/blogs/post/why-and-how-to-use-webpack-and-babel-with-vanilla-js.aspx)
- [ ] [개발자 황준일 블로그 참고](https://junilhwang.github.io/TIL/Javascript/Design/Vanilla-JS-Component/)


## Javascript MVC 
- [개발자 황준일 블로그 참고](https://junilhwang.github.io/TIL/Javascript/Design/Vanilla-JS-Component/)

### 1. 상태관리: state - setState - render
#### 1) 기능구현
- `state`가 변경되면 `render`를 실행한다.
- `state`는 `setState`로만 변경된다.

```html
<div id="app"></div>
<script>
const $app = document.querySelector('#app');

/* 
state가 변경되면 render를 실행한다.
state는 setState로만 변경된다.
*/
let state = {
  items: ['item1', 'item2', 'item3', 'item4']
}

const render = () => {
  const {items} = state;
  $app.innerHTML = `
    <ul>
      ${items.map(item =>`<li>${item}</li>`).join('')}
    </ul>
    <button id="append">추가</button>`;
  
  document.querySelector('#append').addEventListener('click', () => {
    setState({items: [...items, `item${items.length+1}`]})
  })

}

const setState = (newState) => {
  state = {...state, ...newState};
  render();
}

render();
</script>
```
> state - setState - render 규칙을 지켜서 코드를 작성하면, 브라우저 출력 내용은 무조건 `state`에 종속된다. 즉, DOM을 직접적으로 조작할 필요가 없어진다.

#### 2) 추상화
- 컴포넌트 클래스를 정의하여 컴포넌트 코드의 사용방법을 강제화 할 수 있고 유지보수 및 관리가 편한 장점이 있다.

```html
<div id="app"></div>
<script>
class Component{
  $target;
  $state;
  constructor($target){
    this.$target = $target;
    this.setup();
    this.render();
  }

  setup(){};
  template(){return '';}
  render(){
    this.$target.innerHTML = this.template();
    this.setEvent();
  }
  setEvent(){};
  setState(newState){
    this.$state = {...this.$state, ...newState};
    this.render();
  }
}

class App extends Component{
  setup(){
    this.$state = {items:['item1', 'item2']}
  }
  template(){
    const {items} = this.$state;
    return `
      <ul>
        ${items.map(item =>`<li>${item}</li>`).join('')}
      </ul>
      <button id="append">추가</button>`
  }
  setEvent(){
    this.$target.querySelector('button').addEventListener('click', () => {
      const {items} = this.$state;
      this.setState({items: [...items, `item${items.length+1}`]});
    });
  }
}

new App(document.querySelector('#app'));
</script>
```

#### 3) 모듈화
```shell
.
├── index.html
└── src
    ├── app.js              # ES Module의 entry file
    ├── components          # 코어를 상속한 컴포넌트
    │   └── Items.js
    └── core                # 구현에 필요한 코어
        └── Component.js
```

`index.html`
```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta http-equiv="X-UA-Compatible" content="IE=edge">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>VanillaJS Boilerplate</title>
</head>
<body>
  <div id="app"></div>
  <script src="./src/app.js" type="module"></script>
</body>
</html>
```

`app.js`
```javascript
import Items from './components/Items.js';

class App {
  constructor(){
    const $app = document.querySelector('#app');
    //components
    new Items($app);
  }
}

new App();
```

`Component.js`
```javascript
export default class Component{
  $target;
  $state;
  constructor($target){
    this.$target = $target;
    this.setup();
    this.render();
  }
  setup (){};
  template(){return '';}
  render(){
    this.$target.innerHTML = this.template();
    this.setEvent();
  }
  setEvent(){};
  setState(newState){
    this.$state = {...this.$state, ...newState};
    this.render();
  }
}
```

`Items.js`
```javascript
import Component from '../core/Component.js';

export default class Items extends Component{
  setup(){
    this.$state = {items:['item1','item2']};
  }

  template(){
    const {items} = this.$state;
    return `
      <ul>
        ${items.map((item, key) =>`
        <li>
          ${item}
          <button class="deleteBtn" data-index="${key}">삭제</button>
        </li>`).join('')}
      </ul>
      <button class="addBtn">추가</button>`
  }

  setEvent(){
    // 추가
    this.$target.querySelector('.addBtn').addEventListener('click', () =>{
      const {items} = this.$state;
      this.setState({items: [...items, `item${items.length+1}`]});
    });

    // 삭제
    this.$target.querySelectorAll('.deleteBtn').forEach(deleteBtn =>
      deleteBtn.addEventListener('click', ({target}) =>{
        const items = [...this.$state.items];
        items.splice(target.dataset.index, 1);
        this.setState({items});
      })
    );
  }
}
```


### 2. 이벤트 처리
앞서 작성한 코드를 실행하면 `render`를 실행할 때마다 이벤트가 새로 등록되는 문제가 있다.
> button클릭 -> 이벤트실행(setState) -> render실행 -> **이벤트등록(.addBtn, .deleteBtn)**, 화면갱신

이벤트버블링을 이용하여 component의 target 자체에 등록하고 component 생성 시점에만(constructor) 이벤트 등록을 하도록 하면, component내에 상태가 변경돼도 이벤트 추가 없이 사용이 가능하다.

#### 1) 이벤트 버블링

`Items.js`
```javascript
import Component from '../core/Component.js';

export default class Items extends Component{
  /*
  ...생략
  */
  setEvent(){
    // [이벤트버블링]
    this.$target.addEventListener('click', ({target}) =>{
      const items = [...this.$state.items];
      
      if(target.classList.contains('addBtn')){
        this.setState({items: [...items, `item${items.length+1}`]});
      }
      
      if(target.classList.contains('deleteBtn')){
        items.splice(target.dataset.index, 1);
        this.setState({items});
      }
    });
  }
}
```

`Component.js`
```javascript
export default class Component{
  /*
  ...생략
  */
  constructor($target){
    this.$target = $target;
    this.setup();
    this.render();
    // [추가] constructor에서 한번만 실행!
    this.setEvent();
  }
  render(){
    this.$target.innerHTML = this.template();
    // [삭제] this.setEvent();
  }
}
```

#### 2) 이벤트버블링 추상화

`Items.js`
```javascript
import Component from '../core/Component.js';

export default class Items extends Component{
  /*
  ...생략
  */
  setEvent(){
    this.addEvent('click', '.addBtn', ({target}) => {
      const {items} = this.$state;
      this.setState({items: [...items, `item${items.length+1}`]});
    });
    
    this.addEvent('click', '.deleteBtn', ({target}) => {
      const items = [...this.$state.items];
      items.splice(target.dataset.index, 1);
      this.setState({items});
    });
  }
}
```

`Component.js`
```javascript
export default class Component{
  /*
  ...생략
  */
  addEvent(eventType, selector, callback){
    const children = [...this.$target.querySelectorAll(selector)];
    
    // $target 자체에 이벤트를 여러개 걸고.. 들어왔을때 selector로 해당 이벤트가 발생해야하는지 판단!
    // target.classList.contains('deleteBtn')를 대신함
    const isTarget = (target) => children.includes(target) || target.closest(selector);
    this.$target.addEventListener(eventType, event => {
      // this.$target에 eventType 이벤트가 발생할때마다 아래 실행하여 사실살 addEven함수의 closure인 callback함수를 리턴!
      if(!isTarget(event.target)) return false;
      callback(event);
    })
  }
}
```

### 3. 컴포넌트 설계

- 아래처럼 Items 컴포넌트에 여러 기능을 추가하면 어떠 문제가 발생할까?

`Items.js`
```javascript
import Component from '../core/Component.js';

export default class Items extends Component{
  get filteredItems () {
    const { isFilter, items } = this.$state;
    return items.filter(({ active }) => (isFilter === 1 && active) ||
                                        (isFilter === 2 && !active) ||
                                        isFilter === 0);
  }
  setup(){
    this.$state = {
      isFilter:0,
      items:[
        {
          seq: 1,
          contents: 'item1',
          active: false,
        },
        {
          seq: 2,
          contents: 'item2',
          active: true,
        }
      ]
    }
  }

  template() {
    return `
      <header>
        <input type="text" class="appender" placeholder="아이템 내용 입력" />
      </header>
      <main>
        <ul>
          ${this.filteredItems.map(({contents, active, seq}) => `
            <li data-seq="${seq}">
              ${contents}
              <button class="toggleBtn" style="color: ${active ? '#09F' : '#F09'}">
                ${active ? '활성' : '비활성'}
              </button>
              <button class="deleteBtn">삭제</button>
            </li>
          `).join('')}
        </ul>
      </main>
      <footer>
        <button class="filterBtn" data-is-filter="0">전체 보기</button>
        <button class="filterBtn" data-is-filter="1">활성 보기</button>
        <button class="filterBtn" data-is-filter="2">비활성 보기</button>
      </footer>
    `
  }

  setEvent(){
    this.addEvent('keyup', '.appender', ({ key, target }) => {
      if(key !== 'Enter') return;
      const {items} = this.$state;
      const seq = Math.max(0,...items.map(v => v.seq))+1;
      const contents = target.value;
      const active = false;
      this.setState({
        items:[...items, {seq, contents, active}]
      });
    });

    this.addEvent('click', '.toggleBtn', ({target}) => {
      const {items} = this.$state;
      const seq = Number(target.closest('[data-seq]').dataset.seq);
      const index = items.findIndex(v=>v.seq === seq);
      items[index].active = !items[index].active;
      this.setState({items});
    });
    
    this.addEvent('click', '.deleteBtn', ({target}) => {
      const {items} = this.$state;
      const seq = Number(target.closest('[data-seq]').dataset.seq);
      items.splice(items.findIndex(v=>v.seq === seq), 1);
      this.setState({items});
    });


    this.addEvent('click', '.filterBtn', ({target}) => {
      this.setState({isFilter: Number(target.dataset.isFilter)});
    });
  }
}
```
하나의 컴포넌트에서 하는일이 많아지는 경우, 코드 관리가 어렵고 컴포넌트 단위로 다른 곳에서 활용하기 어려워진다.**기본적으로 컴포넌트는 재활용이 목적이다. 즉, 하나의 컴포넌트는 최대한 작은 단위의 일을 하도록 만들어야한다.**

#### 1) 컴포넌트 분할
- 위 컴포넌트를 기능단위로 분리해보자.

```shell
.
├── index.html
└── src
    ├── App.js               # main에서 App컴포넌트를 마운트, 컴포넌트를 정의함
    ├── main.js              # js의 entry 포인트로 컴포넌트를 조합하여 렌더링한다.
    ├── components
    │   ├── ItemAppender.js
    │   ├── ItemFilter.js
    │   └── Items.js
    └── core
        └── Component.js
```

**Component Core 변경**
Items 컴포넌트에서 하던 일을 기능단위로 쪼개기 위해서는 공통 데이터(stats.items) 관리가 필요하다. 또한, 부모 컴포넌트가 먼저 그려진 후, 자식 컴포넌트가 그려져야한다. 이를 위해 Component코어 코드를 변경해보자!

- `mounted`: render 이후에 추가적이 기능을 수행하기 위함
- `$props`: 부모 컴포넌트가 자식 컴포넌트에게 상태 혹은 메소드를 넘겨주기 위함

`Component.js`
```javascript
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
  mounted () {}; // mounted 추가
  template(){return '';}
  render(){
    this.$target.innerHTML = this.template();
    this.mounted(); // render 이후에 mounted가 실행된다.
  }
  setEvent(){};
  setState(newState){ /* 생략 */ }
  addEvent(eventType, selector, callback){ /* 생략 */ }
}
```

`main.js`
```javascript
import App from './App.js';

new App(document.querySelector('#app'))
```

`index.html`
```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta http-equiv="X-UA-Compatible" content="IE=edge">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>VanillaJS Boilerplate</title>
</head>
<body>
  <div id="app"></div>
  <script src="./src/main.js" type="module"></script>
</body>
</html>
```

**컴포넌트 분할**
기존 Items에 존재하던 로직을 App.js에 넘기고, 분리된 컴포넌트(Items, ItemAppender, ItemFilter)들은 App.js에서 넘겨주는 로직을 사용하도록 만들어보자.

`App.js`
```javascript
import Component from "./core/Component.js";
import Items from "./components/Items.js";
import ItemAppender from "./components/ItemAppender.js";
import ItemFilter from "./components/ItemFilter.js";

export default class App extends Component{
  setup(){
    this.$state = {
      isFilter:0,
      items:[
        {
          seq: 1,
          contents: 'item1',
          active: false,
        },
        {
          seq: 2,
          contents: 'item2',
          active: true,
        }
      ]
    }
  }

  template() {
    return `
      <header data-component="item-appender"></header>
      <main data-component="items"></main>
      <footer data-component="item-filter"></footer>
    `;
  }

  // 직접 자식 컴포넌트들을 마운트한다.
  mounted(){
    const { filteredItems, addItem, deleteItem, toggleItem, filterItem } = this;
    const $itemAppender = this.$target.querySelector('[data-component="item-appender"]');
    const $items = this.$target.querySelector('[data-component="items"]');
    const $itemFilter = this.$target.querySelector('[data-component="item-filter"]');
  
    // 하위컴포넌트에서 사용할 메소드의 this를 바인딩해준다.
    new ItemAppender($itemAppender, {addItem: addItem.bind(this)});
    new Items($items, {
      filteredItems,
      deleteItem: deleteItem.bind(this),
      toggleItem: toggleItem.bind(this),
    });
    new ItemFilter($itemFilter, {
      filterItem: filterItem.bind(this)
    });
  }

  get filteredItems () {
    const { isFilter, items } = this.$state;
    return items.filter(({ active }) => (isFilter === 1 && active) ||
                                        (isFilter === 2 && !active) ||
                                        isFilter === 0);
  }

  addItem (contents) {
    const {items} = this.$state;
    const seq = Math.max(0, ...items.map(v => v.seq)) + 1;
    const active = false;
    this.setState({
      items: [
        ...items,
        {seq, contents, active}
      ]
    });
  }

  deleteItem (seq) {
    const items = [ ...this.$state.items ];;
    items.splice(items.findIndex(v => v.seq === seq), 1);
    this.setState({items});
  }

  toggleItem (seq) {
    const items = [ ...this.$state.items ];
    const index = items.findIndex(v => v.seq === seq);
    items[index].active = !items[index].active;
    this.setState({items});
  }

  filterItem (isFilter) {
    this.setState({ isFilter });
  }
}
```

`ItemAppender.js`
```javascript
import Component from "../core/Component.js";

export default class ItemAppender extends Component {

  template() {
    return `<input type="text" class="appender" placeholder="아이템 내용 입력" />`;
  }

  setEvent() {
    const { addItem } = this.$props;
    this.addEvent('keyup', '.appender', ({ key, target }) => {
      if (key !== 'Enter') return;
      addItem(target.value);
    });
  }
}
```

`Items.js`
```javascript
import Component from "../core/Component.js";

export default class Items extends Component {

  template() {
    const { filteredItems } = this.$props;
    return `
      <ul>
        ${filteredItems.map(({contents, active, seq}) => `
          <li data-seq="${seq}">
            ${contents}
            <button class="toggleBtn" style="color: ${active ? '#09F' : '#F09'}">
              ${active ? '활성' : '비활성'}
            </button>
            <button class="deleteBtn">삭제</button>
          </li>
        `).join('')}
      </ul>
    `
  }

  setEvent() {
    const { deleteItem, toggleItem } = this.$props;

    this.addEvent('click', '.deleteBtn', ({target}) => {
      deleteItem(Number(target.closest('[data-seq]').dataset.seq));
    });

    this.addEvent('click', '.toggleBtn', ({target}) => {
      toggleItem(Number(target.closest('[data-seq]').dataset.seq));
    });
  }
}
```

`ItemFilter.js`
```javascript
import Component from "../core/Component.js";

export default class ItemFilter extends Component {

  template() {
    return `
      <button class="filterBtn" data-is-filter="0">전체 보기</button>
      <button class="filterBtn" data-is-filter="1">활성 보기</button>
      <button class="filterBtn" data-is-filter="2">비활성 보기</button>
    `
  }

  setEvent() {
    const { filterItem } = this.$props;
    this.addEvent('click', '.filterBtn', ({ target }) => {
      filterItem(Number(target.dataset.isFilter));
    });
  }
}
```