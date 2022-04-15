import { Vec2, Transform, Quad } from 'soli2d'

const Template = new Transform()

export type SceneFrame = Array<number>

export type SceneNode = {
  name?: string,
  q?: Array<SceneFrame>,
  c: Array<SceneNode>
}

export type SceneData = Array<SceneNode>

export const T_ROOT = 1
export const T_QN = 2
export const T_QUAD = 3
export const T_NODE = 4
export const T_VALUE = 5

export type TransformPlusType = T_ROOT | T_QN | T_QUAD | T_NODE | T_VALUE

export type TransformPlus = {
  type: TransformPlusType,
  data: Transform,
  children: Array<TransformPlus>
}

export function scene_import(image: HTMLImageElement, data: SceneData) {

  let root = Template.clone
  let children = data.map(_ => {
    let p = node_import(_)
    p.data._set_parent(root)
    return p
  })

  return {
    type: T_ROOT,
    data: root,
    children
  }

  function node_import(node: SceneNode) {
    let _n = Template.clone
    _n.name = node.name

    let _qr_children = Template.clone
    let _qs_children = Template.clone

    _qr_children._set_parent(_n)
    _qs_children._set_parent(_n)


    let p_qr_children = node.c.map(_ => {
      let p = node_import(_)
      p.data._set_parent(_qr_children)
      return p
    })


    let p_qs_children = []
    if (node.q) {
      p_qs_children = node.q.map(frame => {
        let _qr = Template.clone
        _qr.quad = Quad.make(image, ...frame.slice(0, 4))
        _qr.size = Vec2.make(frame[2], frame[3])
        let translate = frame.slice(4, 6)

        if (translate.length === 2) {
          _qr.translate = Vec2.make(...translate)
        }
        _qr._set_parent(_qs_children)

        return {
          type: T_VALUE,
          data: _qr,
          children: []
        }
      })
    }


    return {
      type: T_QN,
      data: _n,
      children: [{
        type: T_NODE,
        data: _qr_children,
        children: p_qr_children
      }, {
        type: T_QUAD,
        data: _qs_children,
        children: p_qs_children
      }]
    }
  }
}

