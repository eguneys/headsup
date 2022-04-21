import { AppProvider, useApp } from './app'
import { Quad, Vec2 } from 'soli2d-js/web'
import { For, on, createEffect, createContext, useContext, createSignal } from 'soli2d-js'

const Game = () => {

  return (<>
    <Showcase/>
    </>)
}


const Showcase = () => {

  return (<>
      <Background/>

      <Card/>
      <CardStack ox={10} oy={10}/>
    </>)

}

const Background = () => {
  return (<Anim qs={[0, 332, 320, 180]}/>)
}

const TweenPosition = () => {
  
}

const CardStack = props => {
  let stack = [1,2,3]

  return (<>
    <For each={stack}>{ (card, i) =>
      <transform x={props.ox} y={props.oy+ i() * 8}>
      <Card/>
      </transform>
    }</For>
  </>)
}

const Card = (props) => {

  return (<>
      <Anim qs={[60, 48, 30, 40]} x={1} y={1}/>
      <Anim qs={[0, 48, 30, 40]}/>
      <Anim qs={[0, 32, 6, 6]} x={22} y={2}/>
      <Anim qs={[0, 16, 8, 6]} x={2} y={2}/>
      </>)
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

