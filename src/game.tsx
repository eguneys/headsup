import { AppProvider, useApp } from './app'
import { Quad, Vec2 } from 'soli2d-js/web'
import { For, on, createEffect, createContext, useContext, createSignal } from 'soli2d-js'

const Game = () => {

  let flop = [1, 2, 3]

  return (<>
      <For each={flop}>{(card, i) =>
        <Card x={i()*32} y={30}/>
      }</For>
      <Card x={3*32+1} y={30}/>
      <Card x={4*32+2} y={30}/>
    </>)
}

const MoveAndReveal = (props) => {

  
}

const Card = (props) => {

  return (<transform x={props.x} y={props.y}>
      <>
        <Anim qs={[0, 96, 30, 40]}/>
        <Anim qs={[0, 80, 6, 6]} x={22} y={2}/>
      </>
   </transform>)
}

export const Anim = (props) => {

  const [{image, root}] = useApp()

  return (<transform
          quad={Quad.make(image(), ...props.qs)}
          size={Vec2.make(props.qs[2], props.qs[3])}
          x={props.x}
          y={props.y}
          />)
}


const App = (_render, _image, _root, $canvas) => {

  let _App = () => {

    const [{image, root, update, render, mouse}, { _setImage, _setRoot }] = useApp()

      _setImage(_image)
      _setRoot(_root)

     createEffect(on(render, () => {
        root()._update_world()
       _render()
       }))

    return (<Game/>)
  }

  return () => (<AppProvider $canvas={$canvas}> <_App/> </AppProvider>)
}

export default App

