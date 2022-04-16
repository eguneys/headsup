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
    .map(_ => {
      let t = Template.clone
      t.quad = Quad.make(image, ..._)
      t.size = Vec2.make(_[2], _[3])
      
      return SceneNode.make(t)
    })

    _scene.g.forEach(_ => {
      let _g = SceneNode.make(Template.clone)
     _.forEach(_ => {
        let [ref, x, y] = _
        let _s

        if (ref < res.slices.length) {
          _s = res.slices[ref].clone
        } else {
          _s = res.groups[ref - res.slices.length].clone
        }
        _s.transform.x = x
        _s.transform.y = y
        _g.add(_s)
      })
      res.groups.push(_g)
    })

    res.scene.add(res.groups[_scene.s].clone)

    return res
  }

  slices: Array<SceneNode>
  groups: Array<SceneNode>

  scene: SceneNode

  constructor() {
    this.scene = new SceneNode(Template.clone)
    this.slices = []
    this.groups = []
  }
}

export class SceneNode {

  static make = (transform: Transform) => new SceneNode(transform)

  parent?: SceneNode
  children: Array<SceneNode> = []


  get clone() {
    let transform = this.transform.clone
    transform._children = []
    let res = new SceneNode(transform)
    this.children.forEach(_ =>
                          res.add(_.clone))

    return res
  }
  
  constructor(readonly transform: Transform) {}


  add(node: SceneNode) {
    node.parent = this
    this.children.push(node)
    node.transform._set_parent(this.transform)
  }

  remove() {
    if (this.parent) {
      this.parent.children.splice(this.parent.children.indexOf(this), 1)
      this.transform.remove()
    }
  }
}
