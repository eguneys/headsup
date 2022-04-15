import { h, VNode } from 'snabbdom'
import Ctrl from './ctrl'
import ground from './ground'


export default function view(ctrl: Ctrl) {

  return h('div.s-wrap', [
    h('div.side', [
      slices(ctrl),
      h('button', {
        on: {
          click() {
            ctrl.add_slice()
            ctrl.redraw()
          }
        }
      }, 'Add slice')
    ]),
    h('div.board', {

      hook: {
        insert(vnode: VNode) {
          ctrl.setGround(ground(ctrl.image, vnode.elm as HTMLElement))
        }
      }
    })
  ])

}

function slices(ctrl: Ctrl) {
  return h('div.slices', ctrl.slices.map(slice =>
             h('div.slice', [h('input', {
               key: slice.name,
               attrs: {
                 value: slice.name,
               },
               on: {
                 focus(e) {
                   ctrl.select(slice)
                 },
                 change(e) {
                   slice.name = e.target.value
                   ctrl.redraw()
                 }
               }
             }), h('button', {
                 on: {
                   click() {

                     if (slice.name === '') {
                       ctrl.remove(slice)
                     } else {
                       ctrl.save(slice)
                     }
                     ctrl.redraw()
                   }
                 }
             }, 'Ok')])
  ))
}
