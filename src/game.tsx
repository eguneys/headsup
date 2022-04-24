import { ticks } from './shared'
import { AppProvider, useApp } from './app'
import { Quad, Vec2 } from 'soli2d-js/web'
import { onCleanup, onMount, Show, For, on, createEffect, createContext, useContext, createSignal } from 'soli2d-js'

import { read, owrite, write, TweenVal } from './play'
import { DragDecay, vec_transform_inverse_matrix } from './play'

import { Solitaire as OSolitaire } from './gsolitaire'

const Game = () => {

  return (<>
      <Solitaire/>
    </>)
}


const Solitaire = () => {

  let [{mouse, update}] = useApp()


  let solitaire = OSolitaire.make()

  return (<>
  <Background/>

  <HasPosition x={6} y={12}>
    <BackCard/>
  </HasPosition>

  <For each={solitaire.back_piles}>{ (pile, i) =>
    <BackCardStack stack={read(pile.pile)}/>
  }</For>

  <For each={solitaire.piles}>{ (pile, i) =>
    <>
    <HasPosition x={pile.x} y={pile.y}>
      <DropTarget set_ref={pile._set_ref} qs={[0, 0, 30, 40]}/>
    </HasPosition>
    <CardStack onDrag={(_i, decay) => { pile.begin_drag(_i, decay); return true }} stack={read(pile.pile)}/>
    </>
  }</For>


  <For each={solitaire.holes}>{ (hole, i) =>
    <>
      <HasPosition x={hole.x} y={hole.y}>
        <DropTarget set_ref={hole._set_ref} qs={[0, 0, 30, 40]}/>
      </HasPosition>
      <CardStack onDrag={(_i, decay) => { hole.begin_drag(_i, decay); return true }} stack={read(hole.pile)}/>
    </>
  }</For>

  <Show when={read(solitaire.drag_pile)}>{ value =>
  <TweenPosition ix={0} iy={0} x={-3} y={-3} duration={ticks.three}>
    <CardStack shadow={2} stack={value.stack}/>
  </TweenPosition>
  }</Show>

  </>)
}

const HasPosition = props => {

  return (<transform tint={props.tint} x={props.x} y={props.y}>
      {props.children}
      </transform>)
}

const BackCardStack = props => {
    return (<>
    <For each={props.stack}>{ (card, i) =>
      <HasPosition x={card.x} y={card.y}>
        <BackCard/>
      </HasPosition>
      }</For>
      </>)
}

const CardStack = props => {
    return (<>
    <For each={props.stack}>{ (card, i) =>
      <HasPosition x={card.x} y={card.y}>
        <CardHasPosition onDrag={props.onDrag ? (e) => props.onDrag(i(), e): undefined} shadow={props.shadow} card={card}/>
      </HasPosition>
      }</For>
      </>)
}


const BackCard = (props) => {
  return (<>
      <Anim qs={[60, 48, 30, 40]} x={1} y={1}/>
      <Anim qs={[30, 48, 30, 40]}/>
      </>)
}

const CardHasPosition = (props) => {
  return (<>
<Show when={ props.card.ping_pong ??  props.card.reveal ??  props.card.hide }>{ value =>
<RevealCard frame={Math.floor((value===1?0.9:value)*5)}/>
}</Show>
<Show when={props.card.show}>{ value =>
<Card shadow={props.shadow} set_ref={value._set_ref} card={value} onDrag={props.onDrag}/>
}</Show>
 </>)
}

const RevealCard = (props) => {
  return (<>
    <Anim qs={[90 + props.frame * 30, 48, 30, 40]}/>
    </>)
}

const Card = (props) => {

  return (<>
      <DropTarget set_ref={props.set_ref} onDrag={props.onDrag} qs={[0, 48, 30, 40]}/>
      <Anim qs={[60, 48, 30, 40]} x={props.shadow || 1} y={props.shadow || 1}/>
      <Anim qs={[0, 48, 30, 40]}/>
      <Anim qs={[0, 32, 6, 6]} x={22} y={2}/>
      <Anim qs={[0, 16, 8, 6]} x={2} y={2}/>
      </>)
}

export const DropTarget = (props) => {

  const [{mouse}] = useApp()

  let t_ref

  onMount(() => {
    props.set_ref?.(t_ref)
    if (props.onDrag) {
      t_ref.on_event = () => {
        let { drag } = mouse()

        if (drag && !drag.move0 && !drag.drop) {
          let hit = vec_transform_inverse_matrix(Vec2.make(...drag.start), t_ref)

          if (Math.floor(hit.x) === 0 && Math.floor(hit.y) === 0) {
            let decay = DragDecay.make(drag, t_ref)
            return props.onDrag(decay)
          }
        }
      }
    }
 })

  return (<transform
          ref={t_ref}
          size={Vec2.make(props.qs[2], props.qs[3])}
          x={props.x}
          y={props.y}
          />)
}
export const Anim = (props) => {

  let [{image}] = useApp()

  return (<transform
          quad={Quad.make(image(), ...props.qs)}
          size={Vec2.make(props.qs[2], props.qs[3])}
          x={props.x}
          y={props.y}
          />)
}

const Background = () => {
  return (<Anim qs={[0, 332, 320, 180]}/>)
}

const TweenPosition = (props) => {

  let ix = props.ix === undefined ? props.x : props.ix
  let iy = props.iy === undefined ? props.y : props.iy

  let tX = createSignal(new TweenVal(ix, ix, props.duration || ticks.half, TweenVal.quad_in_out), { equals: false })
  let tY = createSignal(new TweenVal(iy, iy, props.duration || ticks.half, TweenVal.quad_in_out), { equals: false })

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

