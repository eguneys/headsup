import { ticks } from './shared'
import { AppProvider, useApp } from './app'
import { Quad, Vec2 } from 'soli2d-js/web'
import { onCleanup, onMount, Show, For, on, createEffect, createContext, useContext, createSignal } from 'soli2d-js'

import { read, owrite, write, TweenVal } from './play'
import { DragDecay, vec_transform_inverse_matrix } from './play'


const Game = (props) => {
  return (<>
      <HeadsUp headsup={props.headsup}/>
      </>)
}


const HeadsUp = (props) => {
return (<>
    <Background/>
    <HasPosition x={244} y={105}>
      <Pot pot={props.headsup.m_pot()}/>
    </HasPosition>
    <HasPosition x={80} y={160}>
      <ActionButton qs={[37 * 4, 32, 37, 14]} on_click={props.headsup.click_action} action={props.headsup.m_allow_fold()}/>
    </HasPosition>
    <HasPosition x={20} y={160}>
      <ActionButton qs={[185, 32, 37, 14]} on_click={props.headsup.click_action} action={props.headsup.m_allow_check()}/>
    </HasPosition>
    <HasPosition x={20} y={160}>
      <ActionButton qs={[112, 32, 37, 14]} on_click={props.headsup.click_action} action={props.headsup.m_allow_call()}/>
    </HasPosition>
    <HasPosition x={80} y={140}>
      <ActionButton qs={[37 * 1, 32, 37, 14]} on_click={props.headsup.click_action} action={props.headsup.m_allow_allin()}/>
    </HasPosition>
    <HasPosition x={20} y={160}>
      <ActionButton qs={[112, 32, 37, 14]}  on_click={props.headsup.click_action} action={props.headsup.m_allow_call()}/>
    </HasPosition>
    <HasPosition x={20} y={140}>
      <ActionButton qs={[37*2, 32, 37, 14]}  on_click={props.headsup.click_action} action={props.headsup.m_allow_raise()}/>
    </HasPosition>



    <Show when={props.headsup.m_show_hand2()}
    fallback={
      <Show when={props.headsup.m_hand()}>
        <For each={[1,2]}>{ (hand, i) =>
          <HasPosition x={131+i() * 32} y={19}>
            <BackCard/>
          </HasPosition>
        }</For>
      </Show>
    }
    >{ value =>
      <For each={value}>{ (hand, i) =>
        <CardWithRevealHasPosition x={hand.x} y={hand.y} hand={hand}/>
      }</For>
    }</Show>
    <For each={props.headsup.m_show_flop()}>{ hand =>
      <CardWithRevealHasPosition x={hand.x} y={hand.y} hand={hand}/>
    }</For>
    <Show when={props.headsup.m_show_turn()}>{ hand =>
      <CardWithRevealHasPosition x={hand.x} y={hand.y} hand={hand}/>
    }</Show>
    <Show when={props.headsup.m_show_river()}>{ hand =>
      <CardWithRevealHasPosition x={hand.x} y={hand.y} hand={hand}/>
    }</Show>
    <For each={props.headsup.m_hand()}>{ (hand) =>
     <CardWithRevealHasPosition x={hand.x} y={hand.y} hand={hand}/> 
    }</For>
    <Show when={props.headsup.m_turn()}>{ hand =>
     <CardWithRevealHasPosition x={hand.x} y={hand.y} hand={hand}/> 
    }</Show>
    <Show when={props.headsup.m_river()}>{ hand =>
     <CardWithRevealHasPosition x={hand.x} y={hand.y} hand={hand}/> 
    }</Show>
    <For each={props.headsup.m_flop()}>{ hand =>
     <CardWithRevealHasPosition x={hand.x} y={hand.y} hand={hand}/> 
    }</For>
    <For each={props.headsup.m_stacks()}>{ stack =>
      <HasPosition x={stack.x} y={stack.y}>
        <Stack stack={stack}/>
      </HasPosition>
    }</For>
    <For each={props.headsup.m_actions()}>{ action =>
      <HasPosition x={action.x} y={action.y}>
        <TurnAction action={action}/>
      </HasPosition>
    }</For>
    </>)
}

const CardWithRevealHasPosition = (props) => {
  return (<HasPosition x={props.x} y={props.y}>
    <Show when={props.hand.reveal_frame()<1}
      fallback={
        <Card rank={props.hand.rank()} suit={props.hand.suit()}/>
      } >
      <RevealCard frame={Math.floor(props.hand.reveal_frame()*5)}/>
    </Show>
  </HasPosition> )
}

const GameOld = (props) => {

  return (<>
     <HeadsUp headsup={props.headsup}/>
    </>)
}

const HeadsUpOld = (props) => {
  return (<>
      <Background/>
      <HeadsUpMiddle middle={props.headsup.middle}/>
      <AllowedActions actions={props.headsup.allowed_actions}/>
      <CurrentAction action={props.headsup.current_action}/>
      <HasPosition x={244} y={106}>
        <Pot pot_chips={props.headsup.pot_chips}/>
      </HasPosition>
      <For each={props.headsup.stacks}>{ stack =>
        <HasPosition x={stack.x} y={stack.y}>
          <Stack stack={stack} />
        </HasPosition>
      }</For>
      </>)
}

const Stack = (props) => {
  return (<>
      
      <Anim qs={[47 + 50 * props.stack.turn_frame(), 5, 50, 11]} x={0} y={-11}/>
      <Anim qs={[50, 16, 50, 13]}/> 
    <HasPosition y={-2}>
      <Show when={props.stack.i_width()}>{ value =>
        <>
        <Anim size={Vec2.make(50, 2)} qs={[466, 33, 1, 1]}/>
        <Anim size={Vec2.make(value * 50, 2)} qs={[465, 33, 1, 1]}/>
        </>
      }</Show>
    </HasPosition>
      <HasPosition x={2} y={2}>
        <Chips digits={props.stack.chips} />
      </HasPosition>
   </>)
}

const Chips = props => {
  return (<>
    <For each={props.digits}>{(digit,i) =>
     <HasPosition x={1 + (8 - props.digits.length + i()+1)*4} y={0}>
       <Anim qs={[120 + digit * 8, 48, 8, 7]}/> 
     </HasPosition>
    }</For>
    <HasPosition x={10*4} y={0}>
      <Anim qs={[120 + 10 * 8, 48, 8, 7]}/> 
    </HasPosition>
      </>)
}

const Pot = props => {
  return (<>
    <Anim qs={[100 + 7 * 49, 16, 49, 12]} y={-12}/>
    <Anim qs={[0, 16, 50, 13]}/>
    <HasPosition x={2} y={2}>
      <Chips digits={props.pot}/>
    </HasPosition>
    </>)
}

const CurrentAction = props => {

  return (<>
    <For each={read(props.action.actions)}>{ action =>
      <HasPosition x={action.x} y={action.y}>
        <TurnAction action={action}/>
      </HasPosition>
    }</For>
      </>)
}

const TurnAction = (props) => {
  return (<>
        <TweenPosition x={0} iy={0} y={-12}>
        <Anim qs={[100 + props.action.frame * 49, 16, 49, 12]}/>
        </TweenPosition>
        <Anim qs={[0, 16, 50, 13]}/>
        <HasPosition x={2} y={2}>
          <Chips digits={props.action.amount}/>
        </HasPosition>
        </>)
}


const AllowedActions = (props) => {
 return (<>
     <HasPosition x={20} y={160}>
       <ActionButton action={props.actions.check} qs={[185, 32, 37, 14]}/>
     </HasPosition>
     <HasPosition x={20} y={160}>
       <ActionButton action={props.actions.call} qs={[112, 32, 37, 14]}/>
     </HasPosition>
     <HasPosition x={20} y={140}>
       <ActionButton action={props.actions.raise} qs={[37 * 2, 32, 37, 14]}/>
     </HasPosition>
     <HasPosition x={80} y={160}>
       <ActionButton action={props.actions.fold} qs={[37 * 4, 32, 37, 14]}/>
     </HasPosition>
     <HasPosition x={80} y={140}>
       <ActionButton action={props.actions.allin} qs={[37 * 1, 32, 37, 14]}/>
     </HasPosition>
   </>)
}

const ActionButton = props => {
  return (<>
      <Show when={props.action}>{ value => 
      <>
      <DropTarget onClick={_ => props.on_click(value)} qs={[0, 0, 37, 14]}/>
      <Anim qs={[0, 32, 37, 14]}/>
      <Anim qs={props.qs}/>
      </>
      }</Show>
      </>)
}

const HeadsUpMiddle = props => {
  return (<>
      <For each={read(props.middle.hand2)}>{card =>
      <HasPosition x={card.x} y={card.y}>
      <CardHasPosition shadow={props.shadow} card={card}/>
      </HasPosition>
      }</For>
      <For each={read(props.middle.hand)}>{card =>
      <HasPosition x={card.x} y={card.y}>
      <CardHasPosition shadow={props.shadow} card={card}/>
      </HasPosition>
      }</For>
    </>)
}

const Solitaire = (props) => {

  let { solitaire } = props

  return (<>
  <Background/>

  <HasPosition x={6} y={12}>
    <BackCard/>
  </HasPosition>

  <For each={solitaire.back_piles}>{ (pile, i) =>
    <CardStack stack={read(pile.pile)}/>
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
      <Anim qs={[90, 96, 30, 40]}/>
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
    <Anim qs={[90 + props.frame * 30, 96, 30, 40]}/>
    </>)
}

const Card = (props) => {

  let color = props.suit % 2
  return (<>
      <DropTarget set_ref={props.set_ref} onDrag={props.onDrag} qs={[0, 48, 30, 40]}/>
      <Anim qs={[60, 96, 30, 40]} x={props.shadow || 1} y={props.shadow || 1}/>
      <Anim qs={[0, 96, 30, 40]}/>
      <Anim qs={[0 + (props.suit - 1) * 6, 80 + color * 6, 6, 6]} x={22} y={2}/>
      <Anim qs={[0 + (props.rank - 1) * 8, 64 + color * 6, 8, 6]} x={2} y={2}/>
      </>)
}

export const DropTarget = (props) => {

  const [{mouse}] = useApp()

  let t_ref

  onMount(() => {
    props.set_ref?.(t_ref)
    t_ref.on_event = () => {
      let { drag, click, click_down } = mouse()

      if (props.onDrag && drag && !drag.move0 && !drag.drop) {
        let hit = vec_transform_inverse_matrix(Vec2.make(...drag.start), t_ref)

        if (Math.floor(hit.x) === 0 && Math.floor(hit.y) === 0) {
            let decay = DragDecay.make(drag, t_ref)
            return props.onDrag(decay)
        }
      }
      if (props.onClick && click) {
        let hit = vec_transform_inverse_matrix(Vec2.make(...click), t_ref)
        if (Math.floor(hit.x) === 0 && Math.floor(hit.y) === 0) {
          return props.onClick()
        }
      }

      if (props.onClickDown && click_down) {
        let hit = vec_transform_inverse_matrix(Vec2.make(...click_down), t_ref)
        if (Math.floor(hit.x) === 0 && Math.floor(hit.y) === 0) {
          return props.onClickDown()
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
          size={props.size || Vec2.make(props.qs[2], props.qs[3])}
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




const App = (anim, _render, _image, _root, $canvas) => {

  let _App = () => {

    const [{image, root, update, render, mouse}, { _setImage, _setRoot }] = useApp()

      _setImage(_image)
      _setRoot(_root)

      createEffect(on(render, () => {
         root()._update_world()
         _render()
      }))

    anim._set_front()
    return (<Game headsup={anim.front}/>)
  }

  return () => (<AppProvider $canvas={$canvas}> <_App/> </AppProvider>)
}

export default App

