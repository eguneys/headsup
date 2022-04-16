import { ticks } from './shared'
import { Rectangle, Quad, Transform, Vec2 } from 'soli2d'
import { HasPlaysParent, PlayWithTransform, WithPlays, ColorFactory } from './base'
import { dark, red } from './shared'
import { MouseDrag } from './mouse'
import { Config } from './play-config'

import { SceneEditor, ImportScene } from './slices'

const Template = new Transform()

function vec_transform_matrix(vec: Vec2, transform: Transform) {
  return transform.world.mVec2(vec)
}

function vec_transform_inverse_matrix(vec: Vec2, transform: Transform) {
  return transform.world.inverse.mVec2(vec)
}

function vec_hit(vec: Vec2, transform: Transform) {

  let { x1, y1, x2, y2 } = Rectangle.unit.transform(transform.world)

  let { x, y } = vec

  return (x1 < x && x < x2 && y1 < y && y < y2)
}

class SelectAreaRectangle extends WithPlays {

  a_light = this.colors.quad(dark, 3)

  get size() { return this.data as Vec2 }
  get width() { return this.size.x }
  get height() { return this.size.y }


  lefts: Array<Transform>
  rights: Array<Transform>
  ups: Array<Transform>
  downs: Array<Transform>

  ref_on_pan!: Transform

  _init() {

    this.rights = []
    this.lefts = []
    this.ups = []
    this.downs = []

    let { rights, lefts, ups, downs } = this

    this.container = Template.clone

    let { a_light, width, height } = this


    this.ref_on_pan = Template.clone
    this.ref_on_pan.quad = a_light
    this.ref_on_pan.size = Vec2.make(width, height)
    //this.ref_on_pan._set_parent(this.container)


    let horiz_tile = Vec2.make(1, 1).half
    for (let j = 0; j < height; j++) {
      let tile = Template.clone
      tile.quad = a_light
      tile.size = horiz_tile
      tile.x = 0
      tile.y = j
      tile._set_parent(this.container)
      
      let tile2 = Template.clone
      tile2.quad = a_light
      tile2.size = horiz_tile
      tile2.x = width - horiz_tile.x
      tile2.y = j
      tile2._set_parent(this.container)

      if (j > 0) {
        ups.push(tile)
        downs.push(tile2)
      }


    }

    let vert_tile = Vec2.make(1, 1).half
    for (let j = 0; j < width; j++) {
      let tile = Template.clone
      tile.quad = a_light
      tile.size = vert_tile
      tile.x = j
      tile.y = 0
      tile._set_parent(this.container)

      let tile2 = Template.clone
      tile2.quad = a_light
      tile2.size = vert_tile
      tile2.x = j
      tile2.y = height - vert_tile.y
      tile2._set_parent(this.container)

      if (j > 0) {
        lefts.push(tile2)
        rights.push(tile)
      }
    }
  }

  _update(dt: number, dt0: number) {
    this.rights.forEach(right => {
      right.x += 8 * dt/ticks.seconds;
      right.x %= this.width - 1
    })
    this.lefts.forEach(right => {
      right.x -= 8 * dt/ticks.seconds;
      right.x += this.width - 1
      right.x %= this.width - 1
    })

    this.downs.forEach(right => {
      right.y += 8 * dt/ticks.seconds;
      right.y %= this.height - 1
    })
    this.ups.forEach(right => {
      right.y -= 8 * dt/ticks.seconds;
      right.y += this.height - 1
      right.y %= this.height - 1
    })


  }
}

class GridBackground extends WithPlays {

  a_dark = this.colors.quad(dark, 1)
  a_light = this.colors.quad(dark, 0)

  get size() { return this.data as Vec2 }
  get width() { return this.size.x }
  get height() { return this.size.y }

  _init() {

    this.container = Template.clone
    
    let { a_dark, a_light, width, height } = this

    let tile_size = Vec2.make(8, 8)
    
    for (let j = 0; j < height/8; j++) {
      for (let i = 0; i < width/8; i++) {
        let tile = Template.clone
        tile.quad = (i + j) % 2 === 0 ? a_dark : a_light
        tile.size = tile_size
        tile.x = i * 8
        tile.y = j * 8
        tile._set_parent(this.container)
      }
    }
  }

  _update(dt: number, dt0: number) {}


}


class DragDecay2 {
  static make = (drag: MouseDrag, orig: Transform) => {
    return new DragDecay2(drag, orig)
  }


  get translate() {
    return this.move.add(this.decay)
  }

  get move() {
    return vec_transform_inverse_matrix(Vec2.make(...this.drag.move), this.parent)
  }

  get parent() {
    return this.orig._parent
  }

  get drop() {
    return this.drag.drop
  }


  decay: Vec2
  start: Vec2


  constructor(readonly drag: MouseDrag,
              readonly orig: Transform) {
                this.start = Vec2.make(...drag.start)
                this.decay = orig.translate.sub(vec_transform_inverse_matrix(this.start, orig._parent))
              }

}

class DragDecay {

  static make = (drag: MouseDrag, orig: Vec2) => { return new DragDecay(drag, orig) }

  decay: Vec2
  start: Vec2

  get translate() {
    return this.move.add(this.decay)
  }

  get move() {
    return Vec2.make(...this.drag.move)
  }

  get drop() {
    return this.drag.drop
  }

  constructor(readonly drag: MouseDrag, readonly orig: Vec2) {
    this.start = Vec2.make(...drag.start)
    this.decay = orig.sub(this.start)
  }

  start_zoomed(orig: Transform) {
    return this.start.sub(orig.translate).div(orig.scale)
  }

  translate_zoomed(orig: Transform) {
    return this.translate.sub(orig.translate).div(orig.scale)
  }
}

export type Handler = () => void;

class Slicer extends WithPlays {

  bg: GridBackground
  a_image = this.anim(0, 0, 512, 512)

  pan_zoom_scale!: Transform

  pan_drag?: DragDecay
  select_drag?: DragDecay

  select_area_rects: Array<SelectAreaRectangle>

  _init() {
    this.container = Template.clone

    let { a_image } = this

    this.pan_zoom_scale = Template.clone
    this.pan_zoom_scale.scale.set_in(1080/512)
    this.pan_zoom_scale._set_parent(this.container)

    this.pan_zoom_scale.scale.mul_in(Vec2.make(5, 5))

    this.bg = new GridBackground(this.ctx, this.pan_zoom_scale, this.plays)
    ._set_data(Vec2.make(512, 512))
    .init()

    this.bg.add_after_init()

    
    let image = a_image.template
    image._set_parent(this.pan_zoom_scale)


    this.select_area_rects = []
  }

  set_select_area_rects(slices: Array<Slice>) {
    this.select_area_rects.forEach(_ => _.remove())

    slices.forEach(slice => this.add_select_area_rect(slice.x, slice.y, slice.w, slice.h))
  }

  get for_save_select_area_rects() {
    return this.select_area_rects.map(_ => ({
      x: _.x,
      y: _.y,
      w: _.width,
      h: _.height
    }))
  }

  add_select_area_rect(x: number, y: number, w: number, h: number) {
    let res = new SelectAreaRectangle(this.ctx, this.pan_zoom_scale, this.plays)
    ._set_data(Vec2.make(w, h))
    .init()

    res.x = x
    res.y = y
    res.add_after_init()

    this.select_area_rects.push(res)
  }

  _update(dt: number, dt0: number) {
    let { wheel, drag, click } = this.mouse

    if (drag && drag.button === 1) {
      if (!this.pan_drag) {
        this.pan_drag = DragDecay.make(drag, 
                                       this.pan_zoom_scale.translate)
      }
    }

    if (drag && drag.button === 0) {
      if (!this.select_drag) {
        this.select_drag = DragDecay.make(drag,
                                          this.pan_zoom_scale.translate)
      }
    }

    if (this.pan_drag) {

      this.pan_zoom_scale.x = this.pan_drag.translate.x
      this.pan_zoom_scale.y = this.pan_drag.translate.y

      if (this.pan_drag.drop) {
        this.pan_drag = undefined
      }
    }

    if (this.select_drag) {
      this.select_area_rects.forEach(_ => _.remove())
      this.select_area_rects = []


      let start_zoomed = this.select_drag.start_zoomed(this.pan_zoom_scale)
      let translate_zoomed = this.select_drag.translate_zoomed(this.pan_zoom_scale)
      this.add_select_area_rect(Math.floor(start_zoomed.x),
                                Math.floor(start_zoomed.y),
                                Math.ceil(translate_zoomed.x),
                                Math.ceil(translate_zoomed.y))

      if (this.select_drag.drop) {
        this.select_drag = undefined
      }
    }

    if (click) {

      let click_on_pan = vec_transform_inverse_matrix(Vec2.make(...click), this.pan_zoom_scale)

      let [select_area_rect] = this.select_area_rects

      if (select_area_rect) {

        let ref_on_pan = select_area_rect.ref_on_pan.clone
        ref_on_pan.translate = select_area_rect.container.translate.clone


        let width = ref_on_pan.size.x
        let nb = Math.ceil((click_on_pan.x - ref_on_pan.x) / width)

        if (nb > 0) {

          this.select_area_rects.forEach(_ => _.remove())
          this.select_area_rects = []

          Array.from(Array(nb).keys()).map(i =>
               this.add_select_area_rect(
                 select_area_rect.x + i * width,
                 select_area_rect.y,
                 width,
                 ref_on_pan.size.y
               ))
        }
      }


    }

    if (wheel !== 0) {
      this.pan_zoom_scale.scale.x -= this.pan_zoom_scale.scale.x * 0.3 * wheel
      this.pan_zoom_scale.scale.y -= this.pan_zoom_scale.scale.y * 0.3 * wheel
    }

    this.select_area_rects.forEach(_ => _.update(dt, dt0))
  }


}

class SceneNodeHandle extends HasPlaysParent {


  a_red = this.colors.quad(red, 2)


  get node() { return this.data as SceneNode }
  get handle() { return this.node.transform }

  tile!: Transform

  drag?: DragDecay

  _init() {
    this.container = Template.clone

    let { a_red } = this

    this.tile = Template.clone
    this.tile.quad = a_red
    this.tile.size = Vec2.make(2, 2)
    this.tile._set_parent(this.container)
    this.tile.translate = this.handle.translate
  }

  test_drag() {
    let { drag } = this.mouse

    if (drag && !drag.move0 && drag.button === 0) {
      let hit = vec_transform_inverse_matrix(Vec2.make(...drag.start), this.handle)

      if (Math.floor(hit.x) === 0 && Math.floor(hit.y) === 0) {

        if (!this.drag) {
          this.drag = DragDecay2.make(drag,
                                      this.handle)
          return true
        }

      }
    }
    return false
  }

  _update(dt: number, dt0: number) {
    if (this.drag) {
      this.tile.x = Math.floor(this.drag.translate.x)
      this.tile.y = Math.floor(this.drag.translate.y)

      if (this.drag.drop) {
        this.drag = undefined
      }
    }
  }
}

class Grouper extends WithPlays {

  bg: GridBackground

  select_transform?: SelectTransform

  _editor!: SceneEditor

  _handles!: Array<SceneNodeHandle>
  
  pan_zoom_scale!: Transform
  pan_zoom_scale_handles!: Transform
  pan_zoom_scale_children!: Transform

  _init() {
    this.container = Template.clone

    this.pan_zoom_scale = Template.clone
    this.pan_zoom_scale.scale.set_in(1920/320, 1080/180)
    this.pan_zoom_scale._set_parent(this.container)

    this.bg = new GridBackground(this.ctx, this.pan_zoom_scale, this.plays)
    ._set_data(Vec2.make(320, 180))
    .init()

    this.bg.add_after_init()

    this.pan_zoom_scale_children = Template.clone
    this.pan_zoom_scale_children._set_parent(this.pan_zoom_scale)

    this.pan_zoom_scale_handles = Template.clone
    this.pan_zoom_scale_handles._set_parent(this.pan_zoom_scale)

    let example_scene = {
      l: [[0, 96, 30, 40]],
      g: [[[0, 0, 0]]],
      s: 0
    }

    this._handles = []

    this._editor = SceneEditor.make(this.image, example_scene)
    this._editor.scene.transform._set_parent(this.pan_zoom_scale_children)

    this.add_scene_handles(this._editor.scene)
  }

  add_scene_handles(node: SceneNode) {
    let res = new SceneNodeHandle(this.ctx, 
                                  this.pan_zoom_scale, 
    this)
    ._set_data(node)
    .init()

    res.add_after_init()

    this._handles.push(res)

    node.children.forEach(_ => this.add_scene_handles(_))
  }

  _update(dt: number, dt0: number) {

    let { wheel, drag, click } = this.mouse

    let handled = this._handles.slice(0).reverse().some(_ => _.test_drag())

    if (drag && drag.button === 1) {
      if (!this.pan_drag) {
        this.pan_drag = DragDecay.make(drag, 
                                       this.pan_zoom_scale.translate)
      }
    }

    if (drag && drag.button === 0) {
      if (!this.select_drag) {
        this.select_drag = DragDecay.make(drag,
                                          this.pan_zoom_scale.translate)
      }
    }

    if (this.pan_drag) {

      this.pan_zoom_scale.x = this.pan_drag.translate.x
      this.pan_zoom_scale.y = this.pan_drag.translate.y

      if (this.pan_drag.drop) {
        this.pan_drag = undefined
      }
    }


    if (wheel !== 0) {
      this.pan_zoom_scale.scale.x -= this.pan_zoom_scale.scale.x * 0.3 * wheel
      this.pan_zoom_scale.scale.y -= this.pan_zoom_scale.scale.y * 0.3 * wheel
    }


    this._handles.forEach(_ => _.update(dt, dt0))

  }


}


export default class AllPlays extends PlayWithTransform {

  colors = new ColorFactory(this.image)

  slicer!: Slicer

  get config(): Config {
    return this.data as Config
  }

  get slices() {
    return this.slicer.for_save_select_area_rects
  }

  set slices(slices: Array<SliceFrame>) {
    this.slicer.set_select_area_rects(slices)
  }

  _init() {
    this.container = Template.clone

    this.slicer = new Slicer(this.ctx, this.container, this).init()

    this.grouper = new Grouper(this.ctx, this.container, this).init()

    if (this.config.grouper) {
      this.grouper.add_after_init()
    } else {
      this.slicer.add_after_init()
    }
  }

  _update(dt: number, dt0: number) {
    this.slicer.update(dt, dt0)
    this.grouper.update(dt, dt0)
  }
}
