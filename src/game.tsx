import { ticks } from './shared'
import { AppProvider, useApp } from './app'
import { Quad, Vec2 } from 'soli2d-js/web'
import { onMount, Show, For, on, createEffect, createContext, useContext, createSignal } from 'soli2d-js'

import { read, owrite, write, TweenVal } from './play'
import { DragDecay, vec_transform_inverse_matrix } from './play'

const Game = () => {

  return (<>
      <Solitaire/>
    </>)
}


const Solitaire = () => {
  return (<>
  <Background/>
</>)
}


const Showcase = () => {

  let b = createSignal(0)


  setTimeout(() => {
    owrite(b, b => b+=100)
      }, 1000)

  let [{mouse}] = useApp()


let follow_d = createSignal()

const onDrag = (i, decay) => {
  owrite(follow_d, () => decay.decay)
  return true
}

createEffect(() => {
let { drag } = mouse()

if (drag && drag.drop) {
  owrite(follow_d, undefined)
}
})

  return (<>
      <Background/>

      <TweenPosition x={read(b)} y={0}>
      <Card/>
      </TweenPosition>
      <CardStack onDrag={onDrag} ox={read(b)} oy={read(b)}/>
      <Show when={read(follow_d)}>
        <FollowMouseStack ox={read(follow_d).x} oy={read(follow_d).y} drag={mouse().drag}/>
      </Show>
    </>)

}

const Background = () => {
  return (<Anim qs={[0, 332, 320, 180]}/>)
}

const TweenPosition = (props) => {

  let tX = createSignal(new TweenVal(props.x, props.x, props.duration || ticks.half, TweenVal.quad_in_out), { equals: false })
  let tY = createSignal(new TweenVal(props.y, props.y, props.duration || ticks.half, TweenVal.quad_in_out), { equals: false })

  let [{update}] = useApp()

  createEffect(on(update, ([dt, dt0]) => {
    write(tX, _ => _.update(dt, dt0))
    write(tY, _ => _.update(dt, dt0))
    }))

  createEffect(() => {
      owrite(tX, _ => _.new_b(props.x))
      })

  createEffect(() => {
    owrite(tY, _ => _.new_b(props.y))
    })
  
  return (<transform x={read(tX).value} y={read(tY).value}>
      {props.children}
      </transform>)

}

const FollowMouseStack = props => {
  
  let [{mouse}] = useApp()

  let pos = createSignal()

  createEffect(() => {
    owrite(pos, () => Vec2.make(...props.drag.move))
  })


  return (<Show when={read(pos)}>
     <CardStack duration={ticks.one} ox={props.ox + read(pos).x} oy={props.oy + read(pos).y}/> 
    </Show>)

}

const CardStack = props => {
  let stack = [1,2,3]

    return (<>
    <For each={stack}>{ (card, i) =>
      <TweenPosition duration={(props.duration || ticks.thirds) + ticks.one * (i() / 2 + 1)} x={props.ox} y={props.oy + i() * 8}>
        <Card onDrag={props.onDrag ? (e) => props.onDrag(i(), e) : undefined}/>
      </TweenPosition>
      }</For>
      </>)
}

const Card = (props) => {

  return (<>
      <Anim qs={[60, 48, 30, 40]} x={1} y={1}/>
      <Anim onDrag={props.onDrag} qs={[0, 48, 30, 40]}/>
      <Anim qs={[0, 32, 6, 6]} x={22} y={2}/>
      <Anim qs={[0, 16, 8, 6]} x={2} y={2}/>
      </>)
}

export const Anim = (props) => {

  const [{image, root, mouse}] = useApp()
  let t_ref

  if (props.onDrag) {

    onMount(() => {
      t_ref.on_event = () => {
        let { drag } = mouse()

        if (drag && !drag.move0) {
          let hit = vec_transform_inverse_matrix(Vec2.make(...drag.start), t_ref)

          if (Math.floor(hit.x) === 0 && Math.floor(hit.y) === 0) {
            let decay = DragDecay.make(drag, t_ref)
            return props.onDrag(decay)
          }
        }
      }
   })
  }

  return (<transform
          ref={t_ref}
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

