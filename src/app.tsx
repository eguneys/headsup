import { on, createEffect, createContext, useContext, createSignal } from 'soli2d-js'
import { loop } from 'soli2d-js/web'
import Game from './game'
import Mouse from './mouse'

const AppContext = createContext<AppContextValue>({})

const AppProvider = (props) => {
  const [image, _setImage] = createSignal()
  const [root, _setRoot] = createSignal()
  const [update, setUpdate] = createSignal([16, 16])
  const [mouse, setMouse] = createSignal(new Mouse(props.$canvas).init(), { equals: false })
  const [render, setRender] = createSignal(undefined, { equals: false })

  let store = [{image, root, update, render, mouse}, {
    _setImage,
      _setRoot
  }]

  loop((dt, dt0) => {
    setUpdate([dt, dt0])
    setMouse(mouse=> {
      mouse.update(dt, dt0)
      return mouse
    })
    setRender()
  })

  return (
    <AppContext.Provider value={store}>
      {props.children}
    </AppContext.Provider>)
  
}

export const useApp = () => useContext(AppContext)

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

