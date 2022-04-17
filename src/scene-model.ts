import { Vec2, Transform, Quad } from 'soli2d'

const Template = new Transform()

export type ImportSlice = [number, number, number, number]
export type ImportGroup = [GroupRef, number, number]
export type GroupRef = number

export type ImportScene = {
  l: Array<ImportSlice>,
  g: Array<Array<ImportGroup>>,
  s: GroupRef
}

export class SceneEditor {

  static make = (image: HTMLImageElement, _scene: ImportScene) => {
    let res = new SceneEditor()
    res.slices = _scene.l
    .map((_, i) => {
      let t = Template.clone
      t.quad = Quad.make(image, ..._)
      t.size = Vec2.make(_[2], _[3])
      
      return SceneNode.make(i, t)
    })

    _scene.g.forEach((_, i) => {
      let index = res.slices.length + i
      let _g = SceneNode.make(index, Template.clone)
     _.forEach(_ => {
        let [ref, x, y] = _
        let _s

        if (ref === index) {
          _g.transform.x = x
          _g.transform.y = y
          return
        } else if (ref < res.slices.length) {
          _s = res.slices[ref].clone
        } else {
          _s = res.groups[ref - res.slices.length].clone
        }
        _s.transform.x = x
        _s.transform.y = y
        _g.add(_s, ref)
      })
      res.groups.push(_g)
    })
    res.groups[_scene.s].children.forEach(_ => res.scene.add(_.clone))
    return res
  }


  get export_scene(): SceneImport {

    let l = this.slices.map(_ => _.export_slice)
    let g = this.groups.map(_ => _.export_group)
    let s = this.scene.export_scene
    g[s-l.length] = this.scene.export_group

    return { l, g, s }
  }

  slices: Array<SceneNode>
  groups: Array<SceneNode>

  scene: SceneNode

  constructor() {
    this.scene = SceneNode.make(-1, Template.clone)
    this.slices = []
    this.groups = []
  }
}

export class SceneNode {

  static make = (index: number, transform: Transform) => new SceneNode(index, transform)

  parent?: SceneNode
  children: Array<SceneNode> = []


  get export_slice() {
    return this.transform.quad._frame.vs
  }

  get export_group() {
    return this.children.map(_ => 
                      [_.index, 
                        ..._.transform.translate.vs])
  }

  get export_scene() {
    return this.children[0].index
  }

  get clone() {
    let index = this.index
    let transform = this.transform.clone
    transform._children = []
    let res = SceneNode.make(index, transform)
    this.children.forEach(_ =>
                          res.add(_.clone))

    return res
  }
  
  index: number

  constructor(index: number, readonly transform: Transform) { 
    this.index = index
  }


  add(node: SceneNode, ref?: number) {
    if (ref !== undefined) {
      node.index = ref
    }
    node.parent = this
    this.children.push(node)
    node.transform._set_parent(this.transform)
  }

  remove() {
    if (this.parent) {
      this.parent.children.splice(this.parent.children.indexOf(this), 1)
      this.transform._remove()
    }
  }
}
