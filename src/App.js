import {
  RecoilRoot,
  atom,
  selector,
  useRecoilValue, 
  useSetRecoilState,
  useRecoilState,

}
from 'recoil'
import axios from 'axios'
import { Suspense, useState } from 'react'

function App() {
  return (
    <RecoilRoot>
      <Suspense fallback={<h1>Cargando...</h1>}>
        <UserData />
        <TodoFilter />
        <TodoStats />
        <ItemCreator />
        <TodoList />
      </Suspense>
    </RecoilRoot>
  );
}

let idUnico = 0;

const todoListState = atom({
  key: 'todoListState',
  default: []
})

const todoFilterState = atom({
  key: 'todoFilterState',
  default: 'all'
})

const todoFilterSelector = selector({
  key: "todoFilterSelector",
  get: ({ get }) => {
    const list = get(todoListState)
    const filter= get(todoFilterState)

    switch (filter) {
  
      case "done":
        return list.filter(item => item.isCompleted)
      case "notDone":
        return list.filter(item => !item.isCompleted)
      default:
        return list
    }
  }
  
})

const todoStatsSelector = selector({
  key: "todoStatsSelector",
  get: ({ get }) => {
    const list = get(todoListState)
    const toDo = list.filter(item => !item.isCompleted).length
    const notTodo= list.filter(item => item.isCompleted).length 
    const completedPercentage = list.length === 0 ? 0 : notTodo / list.length
    
    const data = {
      total: list.length, 
      toDo,
      notTodo,
      completedPercentage
    }

    return data
    
  }
  
})

const userDataSelector = selector({
  key: "userDataSelector",
  get: async () => {
    const response = await axios.get("http://localhost:3001/users/1")
    return response.data.name
  }
})

function ItemCreator(){

  const [text, setText] = useState('')
  const setNewTodo = useSetRecoilState(todoListState)

  const onChangeText= (event) => {
    setText(event.target.value);
  }

  const onClick = () => {
    setNewTodo( oldTodoList => {
      return [...oldTodoList, 
        {
          id: idUnico++, 
          text, 
          isCompleted: false
       }]

    })
    setText('')
  }

  return (
    <div>
      <input value={text} onChange={onChangeText}/>
      <button onClick={onClick}>Agregar</button>
    </div>
  )
}

function TodoList(){
  const todos = useRecoilValue(todoFilterSelector)
  return ( 
  <div>
    {
      todos.map(item => <TodoItem key={item.id} {...item} />)
    }
  </div>)
}

function changeItem(id, todoList, changedItem){

  const index = todoList.findIndex(item => item.id === id)

  return [ ...todoList.slice(0, index), changedItem, ...todoList.slice(index + 1, todoList.lenght) ]
}

function TodoItem({ id, text, isCompleted }){

  const [ todoList, setTodoList] = useRecoilState(todoListState)
  const onChangeTodoItem = (event) =>{

    const textValue = event.target.value

    const changedItem = {
      id,
      text: textValue,
      isCompleted
    }

    setTodoList(changeItem(id, todoList, changedItem))

  }

  const onToggleCompleted = () => {

    const changedItem = {
      id,
      text,
      isCompleted: !isCompleted
    }

    setTodoList(changeItem(id, todoList, changedItem))
    
  }

  const deleteItem = (id, todoList) => {

    const index = todoList.findIndex(item => item.id === id)
    
    return [ ...todoList.slice(0, index), ...todoList.slice(index + 1, todoList.lenght) ]

  }

  const onClickDelete = () => {

    setTodoList(deleteItem(id, todoList))

  }

  return (
  <div>
    <input value={text} onChange={onChangeTodoItem} />
    <input type="checkbox" checked={isCompleted} onChange={onToggleCompleted}/>
    <button onClick={onClickDelete}>X</button>
  </div>
  )
}

function TodoFilter() {
  const [filterState, setFilterState] = useRecoilState(todoFilterState)

  const onSelectedItem = (event) => {
    const { value } = event.target
    setFilterState(value)

  }
  return (
    <div>
      Filtro: 
      <select value={filterState} onChange={onSelectedItem}>
        <option value="all">ToDo</option>
        <option value="done">Done</option>
        <option value="notDone">Not Done</option>
      </select>
    </div>
  )
}

function TodoStats(){
  const { total, toDo, notTodo, completedPercentage } = useRecoilValue(todoStatsSelector)
  return(
    <div>
      <span>Tareas totales: {total} </span><br></br>
      <span>Tareas x hacer: {toDo} </span><br></br>
      <span>Tareas realizadas: {notTodo} </span><br></br>
      <span>Eficiencia: %{completedPercentage * 100}</span>
    </div>
  )

}

function UserData(){
  const user= useRecoilValue(userDataSelector)
  return(<h1>{user.name}</h1>)
}

export default App;
