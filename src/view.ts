import { h, VNode } from 'snabbdom'
import Ctrl from './ctrl'
import ground from './ground'


export default function view(ctrl: Ctrl) {

  let content = ctrl.current_tab === 1 ? slicer(ctrl) : grouper(ctrl)

  return h('div.s-wrap', [h('div.tabs', [
    h('span', {
      on: {
        click: (e) => {
          ctrl.current_tab = 1
          ctrl.redraw()
        }
      }
    }, 'Slice'),
    h('span', {
      on: {
        click(e) {
          ctrl.current_tab = 2
          ctrl.redraw()
        }
      }
    }, 'Group')
  ]), content])

}


function grouper(ctrl: Ctrl) {
  return h('div.content.grouper', [
    h('div.side-board', [
      h('div.side', [
        groups(ctrl),
        h('button', {
          on: {
            click() {
              ctrl.add_group()
              ctrl.redraw()
            }
          }
        }, 'Add group')
      ]),
      h('div.board', {
        hook: {
          insert(vnode: VNode) {
            let import_scene = ctrl.import_scene
            ctrl.setGround(ground(ctrl.image, vnode.elm as HTMLElement, 
                                  { import_scene }))
          }
        }
      })
    ]),
    h('div.info', [
      h('span', 'Add a slice: '),
      ...ctrl.slices.map(_ => 
                         h('button.slice', {
                         
                           on: {
                             click() {
                               ctrl.grouper_add_slice(_)
                             }
                           }
                         }, _.name))
    ])
  ])
}

function groups(ctrl: Ctrl) {
  return h('div.groups', ctrl.groups.map(group =>
             h('div.group', [h('input', {
               key: group.name,
               attrs: {
                 value: group.name,
               },
               on: {
                 focus(e) {
                   ctrl.select_group(group)
                 },
                 change(e) {
                   group.name = e.target.value
                   ctrl.redraw()
                 }
               }
             }), h('button', {
                 on: {
                   click() {
                     if (group.name === '') {
                       ctrl.remove_group(group)
                     } else {
                       ctrl.save_group(group)
                     }
                     ctrl.redraw()
                   }
                 }
             }, 'Ok')])
  ))
}

function slicer(ctrl: Ctrl) {
  return h('div.content.slicer', [
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
