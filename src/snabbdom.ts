import { VNode, init,
  eventListenersModule,
  attributesModule,
  propsModule,
  classModule,
  styleModule } from 'snabbdom'

const patch = init([
  propsModule,
  attributesModule,
  eventListenersModule,
  classModule,
  styleModule])

export default function Snabbdom($_: Element, fn: () => VNode) {

  let vnode: VNode

  function redraw() {
    vnode = patch(vnode, fn())
  }

  vnode = patch($_, fn())

  return redraw
}
